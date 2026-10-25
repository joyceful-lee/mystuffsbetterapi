import { z } from 'zod';
import { sql } from './db';
import { ApiError } from './api';
import { readThroughCache } from './catalog-cache.mjs';
import { normalize, rankMatches, type CatalogMatch } from './pokemon-matching.mjs';

const DAY=86400000;
const idSchema=z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9.-]{0,79}$/);
const briefSchema=z.object({id:idSchema,name:z.string().max(100),localId:z.string().max(40),image:z.string().optional()});
const setSchema=z.object({id:idSchema,name:z.string().max(100),cardCount:z.object({official:z.number().optional()}).optional()});
const detailSchema=briefSchema.extend({set:setSchema,rarity:z.string().max(100).optional()}).passthrough();
type Detail=z.infer<typeof detailSchema>;
export const catalogSearchInput=z.object({name:z.string().trim().max(100).default(''),set:z.string().trim().max(100).default(''),number:z.string().trim().max(40).default(''),page:z.coerce.number().int().min(1).max(250).default(1)}).refine(q=>normalize(q.name).length>=2||(normalize(q.set).length>=2&&normalize(q.number).length>=1),'Enter a name, or a set and card number.');

async function cache<T>(key:string,ttl:number,fetchValue:()=>Promise<T>):Promise<T> {
 if(!process.env.DATABASE_URL)throw new ApiError('Card search is not configured yet. You can still add cards manually.',503);
 const store={
  async read(key:string){
   try {const [row]=await sql()`SELECT payload,expires_at AS "expiresAt" FROM pokemon_catalog_cache WHERE cache_key=${key}`;return row as {payload:T;expiresAt:string}|undefined;}
   catch {throw new ApiError('Card search needs its database setup. You can still add cards manually.',503);}
  },
  async write(key:string,payload:T,expires:Date){await sql()`INSERT INTO pokemon_catalog_cache(cache_key,payload,expires_at) VALUES(${key},${JSON.stringify(payload)}::jsonb,${expires.toISOString()}) ON CONFLICT(cache_key) DO UPDATE SET payload=EXCLUDED.payload,expires_at=EXCLUDED.expires_at,updated_at=now()`;},
 };
 return readThroughCache(store,`tcgdex:en:v1:${key}`,ttl,async()=>{
  try{return await fetchValue();}
  catch(error){if(error instanceof ApiError)throw error;throw new ApiError('The card catalog is unavailable. Try again shortly or add your card manually.',502);}
 });
}

// Bound responses before buffering and disallow redirects to arbitrary hosts.
async function limitedFetch(url:string,limit:number) {
 const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(12000),cache:'no-store'});
 if(!response.ok)throw new ApiError('The card catalog is unavailable. Try again shortly or add your card manually.',502);
 if(Number(response.headers.get('content-length'))>limit)throw new ApiError('The catalog response is too large. Please narrow your search.',502);
 const reader=response.body?.getReader();if(!reader)throw new ApiError('The catalog returned an empty response.',502);
 const chunks:Uint8Array[]=[];let length=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>limit)throw new ApiError('The catalog response is too large. Please narrow your search.',502);chunks.push(value);}}
 finally{await reader.cancel();}
 return {bytes:Buffer.concat(chunks),type:response.headers.get('content-type')?.split(';')[0]};
}
async function json(path:string){return JSON.parse((await limitedFetch(`https://api.tcgdex.net/v2/en/${path}`,2500000)).bytes.toString('utf8'));}
function hasImage(image?:string){return !!image && /^https:\/\/assets\.tcgdex\.net\/en\/[a-zA-Z0-9/.-]+$/.test(image)&&!image.includes('..');}
async function sets(){return cache('sets',30*DAY,async()=>z.array(setSchema).max(2000).parse(await json('sets')));}

export async function searchPokemon(query:z.infer<typeof catalogSearchInput>) {
 const allSets=await sets(),byId=new Map(allSets.map(set=>[set.id,set]));
 let cards:CatalogMatch[]=[];
 const setQuery=normalize(query.set);
 if(setQuery){
  const exact=allSets.filter(set=>normalize(set.id)===setQuery||normalize(set.name)===setQuery);
  const matching=exact.length?exact:allSets.filter(set=>normalize(set.id).includes(setQuery)||normalize(set.name).includes(setQuery));
  if(matching.length>5)throw new ApiError('Several sets match. Enter a more specific set name.');
  const groups=await Promise.all(matching.map(set=>cache(`set:${set.id}`,7*DAY,async()=>{
   const data=z.object({cards:z.array(briefSchema).max(2000)}).parse(await json(`sets/${encodeURIComponent(set.id)}`));
   return data.cards.map(card=>({id:card.id,name:card.name,localId:card.localId,setId:set.id,setName:set.name,total:set.cardCount?.official,hasImage:hasImage(card.image)}));
  })));
  cards=groups.flat();
  // A set + number may identify a printing even if its name was mistyped.
  if(query.name&&!query.number)cards=cards.filter(card=>normalize(card.name).includes(normalize(query.name)));
 }else{
  const briefs=await cache(`name:${query.name.toLowerCase()}`,7*DAY,async()=>z.array(briefSchema).max(5000).parse(await json(`cards?${new URLSearchParams({name:`like:${query.name}`})}`)));
  cards=briefs.map(card=>{const setId=card.id.slice(0,card.id.lastIndexOf('-')),set=byId.get(setId);return {id:card.id,name:card.name,localId:card.localId,setId,setName:set?.name||setId,total:set?.cardCount?.official,hasImage:hasImage(card.image)};});
 }
 const ranked=rankMatches(cards,query),offset=(query.page-1)*24;
 return {cards:ranked.slice(offset,offset+24),total:ranked.length,page:query.page,hasMore:offset+24<ranked.length};
}
export async function pokemonDetail(id:string):Promise<Detail> {
 idSchema.parse(id);
 return cache(`card:${id}`,30*DAY,async()=>{
  const data=detailSchema.parse(await json(`cards/${encodeURIComponent(id)}`));
  if(data.id!==id)throw new ApiError('The catalog returned a different card.',502);
  return data;
 });
}
export async function pokemonImage(id:string):Promise<string> {
 idSchema.parse(id);
 return cache(`image:${id}`,3650*DAY,async()=>{
  const card=await pokemonDetail(id);
  if(!hasImage(card.image))throw new ApiError('This card has no catalog image. You can upload your own.',404);
  const image=await limitedFetch(`${card.image}/high.webp`,2000000);
  if(image.type!=='image/webp'||image.bytes.toString('ascii',0,4)!=='RIFF'||image.bytes.toString('ascii',8,12)!=='WEBP')throw new ApiError('The catalog image could not be opened.',502);
  return `data:image/webp;base64,${image.bytes.toString('base64')}`;
 });
}

import { createHash } from 'node:crypto';
import { z } from 'zod';
import { sql } from './db';
import { ApiError } from './api';
import { catalogCache, catalogFetch } from './catalog-server';
import { supportedCatalogImage, catalogImageType } from './catalog-image.mjs';
export { supportedCatalogImage } from './catalog-image.mjs';
import { collectorNumber, normalize } from './pokemon-matching.mjs';
import { scryfallCards, yugiohCards, onePieceCards, matchingSets, exactNumber, rankTradingCards, type TradingCard } from './trading-card-adapters.mjs';

const DAY=86400000;
export const catalogGame=z.enum(['magic','yugioh','one-piece']);
type Game=z.infer<typeof catalogGame>;
type Query={name:string;set:string;number:string;page:number};
export const tradingSearchInput=z.object({name:z.string().trim().max(100).default(''),set:z.string().trim().max(100).default(''),number:z.string().trim().max(40).default(''),page:z.coerce.number().int().min(1).max(250).default(1)}).refine(q=>normalize(q.name).length>=2||(normalize(q.set).length>=2&&normalize(q.number).length>0)||/^[a-z0-9]+-[a-z0-9]+$/i.test(q.number),'Enter a card name, a full card code, or a set and number.');
const recordId=z.string().regex(/^[a-f0-9]{64}$/);
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
const namespace=(game:Game)=>`catalog:v1:${game}`;
const text=z.string().max(1000);
const uri=text.nullish();
const scryCard=z.object({id:z.string().uuid(),name:text,collector_number:text,set:text,set_name:text,rarity:text,image_uris:z.object({normal:uri}).passthrough().optional(),card_faces:z.array(z.object({name:text,image_uris:z.object({normal:uri}).passthrough().optional()}).passthrough()).optional(),scryfall_uri:text}).passthrough();
const ygoCard=z.object({id:z.number(),name:text,card_sets:z.array(z.object({set_name:text,set_code:text,set_rarity:text}).passthrough()).max(1000).optional(),card_images:z.array(z.object({id:z.number(),image_url:text}).passthrough()).max(100).optional()}).passthrough();
const opCard=z.object({card_name:text,card_set_id:uri,set_id:uri,set_name:uri,rarity:uri,card_image_id:uri,card_image:uri}).passthrough();

async function source(game:Game,url:string,ttl=7*DAY){
 const host={magic:'api.scryfall.com',yugioh:'db.ygoprodeck.com','one-piece':'optcgapi.com'}[game];
 return catalogCache<unknown>(namespace(game),`source:${hash(url)}`,ttl,async()=>JSON.parse((await catalogFetch(url,5000000,[host],game==='yugioh'?[400,404]:[404],game==='one-piece'?250:150)).bytes.toString('utf8')));
}
function narrowSets(sets:{id:string;name:string}[],query:string){const matches=matchingSets(sets,query);if(matches.length>5)throw new ApiError('Several sets match. Enter a more specific set name or set code.');return matches;}
function literal(value:string){return '"'+value.replace(/["\\]/g,' ').trim()+'"';}

async function magic(query:Query){
 const clauses=['game:paper'];
 if(query.set){
  const data=z.object({data:z.array(z.object({code:text,name:text}))}).parse(await source('magic','https://api.scryfall.com/sets',30*DAY));
  const sets=narrowSets(data.data.map(set=>({id:set.code,name:set.name})),query.set);
  if(!sets.length)return {cards:[],truncated:false};
  clauses.push('('+sets.map(set=>`set:${literal(set.id)}`).join(' or ')+')');
 }
 if(query.number)clauses.push(`cn:${literal(collectorNumber(query.number))}`);
 if(query.name&&!(query.set&&query.number))clauses.push(`name:${literal(query.name)}`);
 const search=new URLSearchParams({q:clauses.join(' '),unique:'prints',order:'name'});
 let cards:TradingCard[]=[],truncated=false;
 for(let page=1;page<=4;page++){
  const data=await source('magic',`https://api.scryfall.com/cards/search?${search}&page=${page}`);
  if(data===null)break;
  const parsed=z.object({data:z.array(scryCard).max(175),has_more:z.boolean()}).parse(data);
  cards=cards.concat(scryfallCards(parsed.data));truncated=parsed.has_more;
  if(!parsed.has_more)break;
 }
 return {cards,truncated};
}
async function yugioh(query:Query){
 const base='https://db.ygoprodeck.com/api/v7/';
 let queries:URLSearchParams[];
 if(/^[a-z0-9]+-[a-z0-9]+$/i.test(query.number)){
  const found=await source('yugioh',base+'cardsetsinfo.php?'+new URLSearchParams({setcode:query.number.toUpperCase()}));
  if(found===null)return {cards:[],truncated:false};
  const card=z.object({name:text}).parse(found);queries=[new URLSearchParams({name:card.name})];
 }else if(query.name){queries=[new URLSearchParams({fname:query.name})];}
 else{
  const all=z.array(z.object({set_name:text,set_code:text})).parse(await source('yugioh',base+'cardsets.php',30*DAY));
  const sets=narrowSets(all.map(set=>({id:set.set_code,name:set.set_name})),query.set);
  if(!sets.length)return {cards:[],truncated:false};
  queries=sets.map(set=>new URLSearchParams({cardset:set.name}));
 }
 const rawCards=new Map<number,z.infer<typeof ygoCard>>();let truncated=false;
 for(const params of queries){
  params.set('num','500');params.set('offset','0');
  const raw=await source('yugioh',base+'cardinfo.php?'+params);if(raw===null)continue;
  const data=z.object({data:z.array(ygoCard).max(500),meta:z.object({pages_remaining:z.number().optional()}).optional()}).parse(raw);
  for(const card of data.data)rawCards.set(card.id,card);
  truncated=truncated||!!data.meta?.pages_remaining;
 }
 let cards=yugiohCards([...rawCards.values()]);
 if(query.set){const sets=narrowSets([...new Map(cards.map(card=>[card.setName,{id:card.setId,name:card.setName}])).values()],query.set);const names=new Set(sets.map(set=>set.name));cards=cards.filter(card=>names.has(card.setName));}
 if(query.number){const matches=exactNumber(cards,query.number);if(matches.length)cards=matches;}
 return {cards,truncated};
}
async function onePiece(query:Query){
 const base='https://optcgapi.com/api/';
 let urls:string[]=[];
 const full=query.number.toUpperCase().replace(/\s/g,'');
 if(/^(OP|EB|PRB|ST)\d+-\d+$/i.test(full))urls=[base+(full.startsWith('ST')?'decks':'sets')+'/card/'+encodeURIComponent(full)+'/',base+'promos/card/'+encodeURIComponent(full)+'/'];
 else if(/^P-\d+$/i.test(full))urls=[base+'promos/card/'+encodeURIComponent(full)+'/'];
 else if(query.set){
  const sets=z.array(z.object({set_name:text,set_id:text})).parse(await source('one-piece',base+'allSets/',30*DAY));
  const decks=z.array(z.object({structure_deck_name:text,structure_deck_id:text})).parse(await source('one-piece',base+'allDecks/',30*DAY));
  const all=[...sets.map(set=>({id:set.set_id,name:set.set_name,group:'sets'})),...decks.map(set=>({id:set.structure_deck_id,name:set.structure_deck_name,group:'decks'})),{id:'P',name:'One Piece Promotion Cards',group:'promos'}];
  const matches=narrowSets(all,query.set);
  urls=matches.map(set=>{const group=all.find(value=>value.id===set.id)!.group;return base+(group==='promos'?'allPromoCards/':group+'/'+encodeURIComponent(set.id)+'/');});
 }else urls=['sets','decks','promos','don'].map(group=>base+group+'/filtered/?'+new URLSearchParams({card_name:query.name}));
 // Keep provider traffic predictable even on the first uncached name lookup.
 let cards:TradingCard[]=[];
 for(const url of urls){const raw=await source('one-piece',url);if(raw!==null)cards.push(...onePieceCards(z.array(opCard).max(10000).parse(raw)));}
 if(query.name&&!(query.set&&query.number)&&!full.includes('-'))cards=cards.filter(card=>normalize(card.name).includes(normalize(query.name)));
 if(query.number){const matches=exactNumber(cards,query.number);if(matches.length)cards=matches;}
 return {cards,truncated:false};
}

export async function searchTradingCards(game:Game,query:Query){
 const found=await ({magic,yugioh,'one-piece':onePiece}[game])(query);
 const allRanked=rankTradingCards(found.cards,query);
 const ranked=allRanked.slice(0,6000).map(card=>({...card,hasImage:supportedCatalogImage(game,card.image)}));
 const cards=ranked.slice((query.page-1)*24,query.page*24);
 if(cards.length)await sql()`INSERT INTO pokemon_catalog_cache(cache_key,payload,expires_at) SELECT ${namespace(game)+':record:'}||(item->>'id'),item,now()+interval '10 years' FROM jsonb_array_elements(${JSON.stringify(cards)}::jsonb) item ON CONFLICT(cache_key) DO NOTHING`;
 return {cards:cards.map(({metadata,image,...card})=>card),total:ranked.length,page:query.page,hasMore:query.page*24<ranked.length,truncated:found.truncated||allRanked.length>6000};
}
export async function tradingCardDetail(game:Game,id:string):Promise<TradingCard>{
 recordId.parse(id);
 const [row]=await sql()`SELECT payload FROM pokemon_catalog_cache WHERE cache_key=${namespace(game)+':record:'+id}`;
 if(!row)throw new ApiError('Search for this card again to load its printing.',404);
 return row.payload as TradingCard;
}
export async function tradingCardImage(game:Game,id:string){
 const card=await tradingCardDetail(game,id);
 if(!supportedCatalogImage(game,card.image))throw new ApiError('This card has no supported catalog picture. You can upload your own.',404);
 return catalogCache(namespace(game),`image:${hash(card.image!)}`,3650*DAY,async()=>{
  const host=new URL(card.image!).hostname;
  const image=await catalogFetch(card.image!,2000000,[host],[],250);
  const type=catalogImageType(image.bytes);
  if(!type)throw new ApiError('The catalog picture could not be opened.',502);
  return {type,base64:image.bytes.toString('base64')};
 });
}

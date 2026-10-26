import { sql } from './db';
import { ApiError } from './api';
import { readThroughCache } from './catalog-cache.mjs';

export async function catalogCache<T>(namespace:string,key:string,ttl:number,fetchValue:()=>Promise<T>):Promise<T>{
 if(!process.env.DATABASE_URL)throw new ApiError('Card search is not configured yet. You can still add cards manually.',503);
 const store={
  async read(key:string){
   try{const [row]=await sql()`SELECT payload,expires_at AS "expiresAt" FROM pokemon_catalog_cache WHERE cache_key=${key}`;return row as {payload:T;expiresAt:string}|undefined;}
   catch{throw new ApiError('Card search needs its database setup. You can still add cards manually.',503);}
  },
  async write(key:string,payload:T,expires:Date){await sql()`INSERT INTO pokemon_catalog_cache(cache_key,payload,expires_at) VALUES(${key},${JSON.stringify(payload)}::jsonb,${expires.toISOString()}) ON CONFLICT(cache_key) DO UPDATE SET payload=EXCLUDED.payload,expires_at=EXCLUDED.expires_at,updated_at=now()`;},
 };
 return readThroughCache(store,`${namespace}:${key}`,ttl,async()=>{
  try{return await fetchValue();}
  catch(error){if(error instanceof ApiError)throw error;throw new ApiError('The card catalog is unavailable. Try again shortly or add your card manually.',502);}
 });
}

// Reserve provider request slots in Neon, so separate server instances also
// share a conservative rate limit. Cache hits never reserve a slot.
async function pace(host:string,gap:number){
 if(!gap)return;
 const [row]=await sql()`INSERT INTO pokemon_catalog_cache AS c(cache_key,payload,expires_at) VALUES(${'catalog-rate:v1:'+host},jsonb_build_object('nextAt',extract(epoch from clock_timestamp())*1000+${gap}::numeric),now()+interval '1 day') ON CONFLICT(cache_key) DO UPDATE SET payload=jsonb_build_object('nextAt',greatest((c.payload->>'nextAt')::numeric,extract(epoch from clock_timestamp())*1000)+${gap}::numeric),updated_at=now(),expires_at=now()+interval '1 day' RETURNING greatest(0,(payload->>'nextAt')::numeric-extract(epoch from clock_timestamp())*1000-${gap}::numeric) AS delay`;
 const delay=Number(row.delay);
 if(delay>20000)throw new ApiError('The card catalog is busy. Please try again shortly.',429);
 if(delay>0)await new Promise(resolve=>setTimeout(resolve,delay));
}
export async function catalogFetch(url:string,limit:number,hosts:string[],emptyStatuses:number[]=[],gap=0){
 const target=new URL(url);
 if(target.protocol!=='https:'||target.username||target.password||target.port||!hosts.includes(target.hostname))throw new ApiError('This catalog image address is not supported.',502);
 await pace(target.hostname,gap);
 const response=await fetch(target,{headers:{'User-Agent':'MyStuffsBetterAPI/1.0 (https://mystuffsbetterapi.vercel.app)','Accept':'application/json,image/jpeg,image/png,image/webp;q=0.9,*/*;q=0.5'},redirect:'error',signal:AbortSignal.timeout(15000),cache:'no-store'});
 if(emptyStatuses.includes(response.status)){await response.body?.cancel();return {bytes:Buffer.from('null'),type:'application/json',status:response.status};}
 if(!response.ok)throw new ApiError(response.status===429?'The card catalog is busy. Please try again shortly.':'The card catalog is unavailable. Try again shortly or add your card manually.',response.status===429?429:502);
 if(Number(response.headers.get('content-length'))>limit){await response.body?.cancel();throw new ApiError('The catalog response is too large. Please narrow your search.',502);}
 const reader=response.body?.getReader();if(!reader)throw new ApiError('The catalog returned an empty response.',502);
 const chunks:Uint8Array[]=[];let length=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>limit)throw new ApiError('The catalog response is too large. Please narrow your search.',502);chunks.push(value);}}
 finally{await reader.cancel();}
 return {bytes:Buffer.concat(chunks),type:response.headers.get('content-type')?.split(';')[0],status:response.status};
}

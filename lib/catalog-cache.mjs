// Dependencies are explicit so cache misses, expiry and outages can be tested.
const pending=new Map();
export async function readThroughCache(store,key,ttl,fetchValue,now=Date.now()) {
 const cached=await store.read(key);
 if(cached && new Date(cached.expiresAt).getTime()>now)return cached.payload;
 // Public catalog keys can share work within a server instance. Always remove
 // settled promises; this is request coalescing, not a second permanent cache.
 if(pending.has(key))return pending.get(key);
 const task=refresh();pending.set(key,task);
 try{return await task;}finally{pending.delete(key);}
 async function refresh(){
 try {
  const payload=await fetchValue();
  await store.write(key,payload,new Date(now+ttl));
  return payload;
 }catch(error){
  if(cached)return cached.payload;
  throw error;
 }
 }
}

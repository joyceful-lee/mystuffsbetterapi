import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectorNumber, rankMatches, catalogRarity } from '../lib/pokemon-matching.mjs';
import { readThroughCache } from '../lib/catalog-cache.mjs';

const cards=[
 {id:'base1-4',name:'Charizard',setId:'base1',setName:'Base Set',localId:'4',total:102},
 {id:'other-4',name:'Charizard',setId:'other',setName:'Another Set',localId:'4',total:100},
 {id:'base1-5',name:'Charizard',setId:'base1',setName:'Base Set',localId:'5',total:102},
 {id:'base1-6',name:'Charizard VMAX',setId:'base1',setName:'Base Set',localId:'6',total:102},
];
test('set + collector number outranks name, normalizing accents and leading zeroes',()=>{
 assert.equal(collectorNumber('004/102'),'4');
 assert.equal(collectorNumber('TG01/TG30'),'tg01');
 const matches=rankMatches(cards,{name:'Charizard VMAX',set:'base1',number:'004/102'});
 assert.equal(matches[0].id,'base1-4');
 assert.equal(matches[0].match,'Set and number match');
 assert.equal(cards[0].score,undefined);
 assert.equal(rankMatches(cards,{name:'Chárizard',set:'',number:''})[0].name,'Charizard');
});
test('printed totals disambiguate identical collector numbers, and set names work',()=>{
 assert.equal(rankMatches([...cards].reverse(),{name:'Charizard',set:'',number:'004/102'})[0].id,'base1-4');
 assert.equal(rankMatches(cards,{name:'Charizard',set:'Another Set',number:'4'})[0].id,'other-4');
});
test('rarity conversion recognizes known spellings and leaves unknown labels for review',()=>{
 assert.equal(catalogRarity('Rare Holo'),'Holo rare');
 assert.equal(catalogRarity('Ultra Rare'),'Ultra rare');
 assert.equal(catalogRarity('Some new rarity'),null);
});
function store(initial){
 let row=initial,writes=0;
 return {read:async()=>row,write:async(_key,payload,expires)=>{writes++;row={payload,expiresAt:expires.toISOString()};},get writes(){return writes;}};
}
test('first lookup persists image bytes and metadata; repeat lookups avoid the provider',async()=>{
 const cache=store();let calls=0;
 const load=async()=>{calls++;return {image:'data:image/webp;base64,AAAA',name:'Charizard'};};
 assert.equal((await readThroughCache(cache,'card',1000,load,10000)).name,'Charizard');
 assert.equal((await readThroughCache(cache,'card',1000,load,10001)).image,'data:image/webp;base64,AAAA');
 assert.equal(calls,1);assert.equal(cache.writes,1);
});
test('empty searches are cached too, expired searches refresh, outages use stale data',async()=>{
 const cache=store();let calls=0;
 const load=async()=>{calls++;return [];};
 await readThroughCache(cache,'search',1000,load,10000);
 await readThroughCache(cache,'search',1000,load,10001);
 assert.equal(calls,1);
 await readThroughCache(cache,'search',1000,load,11001);
 assert.equal(calls,2);
 assert.deepEqual(await readThroughCache(cache,'search',1000,async()=>{throw Error('offline');},13000),[]);
 await assert.rejects(readThroughCache(store(),'missing',1000,async()=>{throw Error('offline');},10000),/offline/);
});
test('simultaneous cache misses share one provider request, and failures can be retried',async()=>{
 const cache=store();let calls=0;
 const load=async()=>{calls++;await new Promise(resolve=>setTimeout(resolve,5));return {name:'Pikachu'};};
 const results=await Promise.all(Array.from({length:5},()=>readThroughCache(cache,'concurrent',1000,load,10000)));
 assert.equal(calls,1);assert.equal(cache.writes,1);assert.equal(results.length,5);
 await assert.rejects(readThroughCache(store(),'retry',1000,async()=>{throw Error('offline');},10000));
 assert.equal(await readThroughCache(store(),'retry',1000,async()=>42,10000),42);
});

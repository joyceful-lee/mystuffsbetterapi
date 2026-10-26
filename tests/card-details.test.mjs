import {test} from 'node:test';
import assert from 'node:assert/strict';
import {games,raritiesFor,isRarityForGame} from '../lib/binder-config.mjs';
import {readGuest,writeGuest,migrateGuest} from '../lib/guest-state.mjs';

test('Riftbound is retired from game options while existing cards retain their rarities',()=>{
 assert.equal(games.includes('Riftbound'),false);
 assert.deepEqual(raritiesFor('Riftbound'),['Common','Uncommon','Rare','Epic','Showcase','Promo']);
 assert.equal(isRarityForGame('Riftbound','Epic'),true);
 assert.equal(isRarityForGame('Riftbound','Mythic rare'),false);
});
test('imageless guest cards retain optional details through reload and migration',async()=>{
 const data=new Map();const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 writeGuest(storage,[{id:'binder',name:'My cards',game:'Riftbound',color:'pink',cards:[{id:'card',name:'Poro Herder',image:'',rarity:'Common',favorite:false,deck:'Poro deck',cardNumber:'061/298'}]}]);
 assert.equal(readGuest(storage)[0].cards[0].image,'');
 await migrateGuest(storage,async binder=>{assert.equal(binder.cards[0].deck,'Poro deck');assert.equal(binder.cards[0].cardNumber,'061/298');assert.equal(binder.cards[0].image,'');});
});
test('older guest cards receive blank optional fields',()=>{
 const data=new Map();const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 writeGuest(storage,[{id:'binder',name:'My cards',game:'Other',color:'lime',cards:[{id:'card',name:'Old card',image:'picture',rarity:'Rare',favorite:false}]}]);
 const card=readGuest(storage)[0].cards[0];assert.equal(card.deck,'');assert.equal(card.cardNumber,'');
});

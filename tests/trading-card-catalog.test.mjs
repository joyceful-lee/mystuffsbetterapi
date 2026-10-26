import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scryfallCards,yugiohCards,onePieceCards,rankTradingCards,exactNumber,matchingSets} from '../lib/trading-card-adapters.mjs';
import {cardCatalogs,rarityForCatalog} from '../lib/card-catalog-config.mjs';
import {supportedCatalogImage,catalogImageType} from '../lib/catalog-image.mjs';

test('only supported games offer an automatic catalog and rarity translation stays game-specific',()=>{
 for(const game of ['Pokémon','Magic','Yu-Gi-Oh!','One Piece'])assert.ok(cardCatalogs[game]);
 assert.equal(cardCatalogs.Riftbound,undefined);assert.equal(cardCatalogs.Other,undefined);
 assert.equal(rarityForCatalog('Magic','mythic'),'Mythic rare');
 assert.equal(rarityForCatalog('Magic','bonus'),'Special');
 assert.equal(rarityForCatalog('One Piece','SR'),'Super rare');
 assert.equal(rarityForCatalog('One Piece','L'),'Leader');
 assert.equal(rarityForCatalog('Yu-Gi-Oh!','Quarter Century Secret Rare'),'Quarter century secret rare');
 assert.equal(rarityForCatalog('Yu-Gi-Oh!','Duel Terminal Ultra Parallel Rare'),null);
 assert.equal(rarityForCatalog('One Piece','DON!!'),null);
});
test('Magic retains separate printing IDs and both faces without replacing the card name',()=>{
 const base={id:'print-one',name:'Front // Back',collector_number:'001',set:'tst',set_name:'Test Set',rarity:'rare',scryfall_uri:'https://scryfall.com/card/tst/1',card_faces:[{name:'Front',image_uris:{normal:'https://cards.scryfall.io/normal/front.jpg'},oracle_text:'Front text'},{name:'Back',image_uris:{normal:'https://cards.scryfall.io/normal/back.jpg'},oracle_text:'Back text'}]};
 const cards=scryfallCards([base,{...base,id:'print-two'}]);
 assert.equal(cards.length,4);assert.equal(new Set(cards.map(c=>c.id)).size,4);
 assert.equal(cards[0].name,'Front // Back');assert.equal(cards[1].metadata.oracle_text,'Back text');
 assert.equal(cards[1].artwork,'Face 2: Back');
 assert.equal(rankTradingCards(cards,{name:'Wrong name',set:'Test Set',number:'1'})[0].match,'Set and number match');
});
test('Yu-Gi-Oh! preserves set rarity and artwork choices without claiming an artwork/set mapping',()=>{
 const cards=yugiohCards([{id:123,name:'Dragon',card_sets:[{set_code:'LOB-EN001',set_name:'First Set',set_rarity:'Ultra Rare'},{set_code:'LOB-EN001',set_name:'First Set',set_rarity:'Secret Rare'},{set_code:'SDK-001',set_name:'Starter',set_rarity:'Common'}],card_images:[{id:123,image_url:'https://images.ygoprodeck.com/images/cards/123.jpg'},{id:124,image_url:'https://images.ygoprodeck.com/images/cards/124.jpg'}],desc:'Effect'}]);
 assert.equal(cards.length,6);assert.equal(new Set(cards.map(c=>c.id)).size,6);
 assert.equal(exactNumber(cards,'LOB-EN001').length,4);
 assert.equal(exactNumber(cards,'001').length,6);
 const ranked=rankTradingCards(cards,{name:'Dragon',set:'SDK',number:'001'});
 assert.equal(ranked[0].localId,'SDK-001');
 assert.match(ranked[0].artwork,/not linked to a specific set/);
 assert.equal(ranked[0].metadata.desc,'Effect');
});
test('One Piece alternate art stays distinct with the full printed code and no-image records are selectable',()=>{
 const base={card_name:'Roronoa Zoro (001)',card_set_id:'OP01-001',set_id:'OP-01',set_name:'Romance Dawn',rarity:'L',card_image_id:'OP01-001',card_image:'https://optcgapi.com/media/static/Card_Images/OP01-001.jpg',card_text:'Leader ability'};
 const cards=onePieceCards([base,{...base,card_name:'Roronoa Zoro (001) (Alternate Art)',card_image_id:'OP01-001_p1',card_image:null}]);
 assert.equal(cards[0].name,'Roronoa Zoro');assert.equal(cards[0].localId,'OP01-001');
 assert.notEqual(cards[0].id,cards[1].id);assert.equal(cards[1].hasImage,false);
 assert.equal(cards[0].metadata.card_text,'Leader ability');
 assert.equal(exactNumber(cards,'001').length,2);
 assert.equal(rankTradingCards(cards,{name:'Zoro',set:'OP01',number:'1'})[0].match,'Set and number match');
});
test('set lookup prefers exact codes and names over similarly named expansions',()=>{
 const sets=[{id:'OP-01',name:'Romance Dawn'},{id:'OP-02',name:'Romance Dawn Extras'},{id:'ST-01',name:'Starter Deck 1'}];
 assert.deepEqual(matchingSets(sets,'op01'),[sets[0]]);
 assert.deepEqual(matchingSets(sets,'Romance Dawn'),[sets[0]]);
 assert.equal(matchingSets(sets,'not a set').length,0);
});
test('catalog image downloads only accept exact provider hosts and supported image paths',()=>{
 assert.equal(supportedCatalogImage('magic','https://cards.scryfall.io/normal/front/card.jpg?123'),true);
 assert.equal(supportedCatalogImage('yugioh','https://images.ygoprodeck.com/images/cards/123.jpg'),true);
 assert.equal(supportedCatalogImage('one-piece','https://optcgapi.com/media/static/Card_Images/card.jpg'),true);
 for(const url of ['https://optcgapi.com.evil.example/media/static/Card_Images/card.jpg','http://optcgapi.com/media/static/Card_Images/card.jpg','https://user:pass@optcgapi.com/media/static/Card_Images/card.jpg','https://optcgapi.com/media/static/Card_Images/../../other','https://optcgapi.com:444/media/static/Card_Images/card.jpg','https://optcgapi.com/api/allSets/'])assert.equal(supportedCatalogImage('one-piece',url),false);
 assert.equal(supportedCatalogImage('riftbound','https://optcgapi.com/media/static/Card_Images/card.jpg'),false);
});
test('image content signatures handle mislabeled One Piece PNGs and reject HTML and SVG',()=>{
 const png=Buffer.from('89504e470d0a1a0a0000000d49484452','hex');
 assert.equal(catalogImageType(png),'image/png');
 assert.equal(catalogImageType(Buffer.from('ffd8ffe000104a464946000101','hex')),'image/jpeg');
 assert.equal(catalogImageType(Buffer.from('RIFFxxxxWEBPdata')),'image/webp');
 assert.equal(catalogImageType(Buffer.from('<html>an error page</html>')),null);
 assert.equal(catalogImageType(Buffer.from('<svg onload="bad()"></svg>')),null);
});

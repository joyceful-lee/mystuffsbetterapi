import { createHash } from 'node:crypto';
import { normalize, collectorNumber, rankMatches } from './pokemon-matching.mjs';
function id(...parts){return createHash('sha256').update(JSON.stringify(parts)).digest('hex');}
function name(value){return String(value||'').slice(0,100);}
function facts(card,keys){return Object.fromEntries(keys.filter(key=>card[key]!==undefined).map(key=>[key,card[key]]));}
export function scryfallCards(cards){
 return cards.flatMap(card=>{
  const faces=card.image_uris?[card]:(card.card_faces||[]);
  return faces.map((face,index)=>({
   id:id('scryfall',card.id,index),name:name(card.name),localId:card.collector_number,setId:card.set,setName:name(card.set_name),
   rarity:card.rarity,image:face.image_uris?.normal||null,hasImage:!!face.image_uris?.normal,artwork:faces.length>1?`Face ${index+1}: ${face.name}`:'',
   sourceUrl:card.scryfall_uri,metadata:{providerId:card.id,artworkIndex:index,...facts(card,['lang','finishes','artist','layout']),...facts(face,['name','oracle_text','mana_cost','type_line','power','toughness','loyalty'])},
  }));
 });
}
export function yugiohCards(cards){
 return cards.flatMap(card=>(card.card_sets?.length?card.card_sets:[{set_name:'Unlisted set',set_code:'',set_rarity:''}]).flatMap((set,index)=>
  (card.card_images?.length?card.card_images:[{id:card.id}]).map((image,artIndex)=>({
   id:id('ygoprodeck',card.id,set.set_code,set.set_rarity,index,image.id),name:name(card.name),localId:set.set_code,setId:set.set_code.split('-')[0],setName:name(set.set_name),
   numberAliases:[set.set_code.split('-').at(-1)?.replace(/^[A-Za-z]+/,'')||''],rarity:set.set_rarity,image:image.image_url||null,hasImage:!!image.image_url,
   artwork:`Artwork ${artIndex+1}. Artwork is not linked to a specific set by this catalog.`,sourceUrl:card.ygoprodeck_url,
   metadata:{providerId:card.id,artworkId:image.id,artworkIndex:artIndex,...facts(card,['desc','type','race','attribute','atk','def','level','archetype']),printing:set},
  }))));
}
export function onePieceCards(cards){
 return cards.map(card=>({
  id:id('optcg',card.card_image_id,card.card_set_id,card.card_name,card.card_image),name:name(card.card_name.replace(/\s*\(\d+\)\s*$/,'')),
  localId:card.card_set_id||card.don_id||'',setId:card.set_id||'',setName:name(card.set_name||'DON!! cards'),rarity:card.rarity||'',image:card.card_image||null,hasImage:!!card.card_image,
  numberAliases:[(card.card_set_id||'').split('-').at(-1)||''],artwork:card.card_name,sourceUrl:'https://optcgapi.com',
  metadata:facts(card,['card_name','card_image_id','card_text','card_color','card_type','life','card_cost','card_power','sub_types','counter_amount','attribute']),
 }));
}
export function rankTradingCards(cards,query){
 const unique=[...new Map(cards.map(card=>[card.id,card])).values()];
 return rankMatches(unique.map(card=>({...card,hasImage:!!card.image})),query).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name)||Number(a.metadata.artworkIndex||0)-Number(b.metadata.artworkIndex||0)||a.id.localeCompare(b.id));
}
export function exactNumber(cards,number){
 const wanted=collectorNumber(number);
 return cards.filter(card=>collectorNumber(card.localId)===wanted||(card.numberAliases||[]).some(value=>collectorNumber(value)===wanted));
}
export function matchingSets(sets,query){
 const wanted=normalize(query);
 const exact=sets.filter(set=>[set.id,set.name].some(value=>normalize(value)===wanted));
 return exact.length?exact:sets.filter(set=>[set.id,set.name].some(value=>normalize(value).includes(wanted)));
}

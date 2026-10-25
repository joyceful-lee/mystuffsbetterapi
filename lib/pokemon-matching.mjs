export function normalize(value) {
 return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}
export function collectorNumber(value) {
 return normalize(String(value || '').split('/')[0]).replace(/^(0+)(?=\d)/, '');
}
export function rankMatches(cards, query) {
 const name=normalize(query.name),set=normalize(query.set),number=collectorNumber(query.number);
 const total=String(query.number || '').split('/')[1]?.trim().replace(/^0+/, '');
 return cards.map(card=>{
  const sameSet=!!set && [card.setId,card.setName].some(value=>normalize(value)===set);
  const relatedSet=!!set && [card.setId,card.setName].some(value=>normalize(value).includes(set));
  const sameNumber=!!number && collectorNumber(card.localId)===number;
  const sameName=!!name && normalize(card.name)===name;
  const sameTotal=!!total && String(card.total)===total;
  const score=(sameSet&&sameNumber?10000:relatedSet&&sameNumber?8000:0)+(sameNumber?1000:0)+(sameTotal?500:0)+(sameSet?200:relatedSet?100:0)+(sameName?50:0);
  const match=sameNumber&&(sameSet||relatedSet)?'Set and number match':sameNumber?'Number matches; check the set':sameName?'Name matches; check the printing':'Possible match';
  return {...card,score,match};
 }).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
}
// Catalog spellings vary. Do not invent a rarity for an unknown provider label.
export function catalogRarity(value) {
 const mappings={common:'Common',uncommon:'Uncommon',rare:'Rare',holo:'Holo rare',holorare:'Holo rare',rareholo:'Holo rare',doublerare:'Double rare',ultrarare:'Ultra rare',rareultra:'Ultra rare',illustrationrare:'Illustration rare',specialillustrationrare:'Special illustration rare',hyperrare:'Hyper rare',shinyrare:'Shiny rare',shinyultrarare:'Shiny ultra rare',acespecrare:'ACE SPEC rare',secretrare:'Secret rare',raresecret:'Secret rare',promo:'Promo'};
 return mappings[normalize(value)] || null;
}

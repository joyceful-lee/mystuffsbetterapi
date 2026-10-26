import { raritiesFor } from './binder-config.mjs';
import { catalogRarity, normalize } from './pokemon-matching.mjs';
export const cardCatalogs={
 'Pokémon':{slug:'pokemon',name:'TCGdex',url:'https://tcgdex.dev',example:'Darkness Ablaze',number:'020/189'},
 'Magic':{slug:'magic',name:'Scryfall',url:'https://scryfall.com',example:'Revised Edition or 3ed',number:'233'},
 'Yu-Gi-Oh!':{slug:'yugioh',name:'YGOPRODeck',url:'https://ygoprodeck.com',example:'Legend of Blue Eyes White Dragon or LOB',number:'LOB-EN001'},
 'One Piece':{slug:'one-piece',name:'OPTCG API',url:'https://optcgapi.com',example:'Romance Dawn or OP-01',number:'OP01-001'},
};
export function rarityForCatalog(game,value){
 if(game==='Pokémon')return catalogRarity(value);
 const key=normalize(value),exact=raritiesFor(game).find(rarity=>normalize(rarity)===key);
 if(exact)return exact;
 if(game==='Magic')return {mythic:'Mythic rare',bonus:'Special'}[key]||null;
 if(game==='One Piece')return {c:'Common',uc:'Uncommon',r:'Rare',sr:'Super rare',sec:'Secret rare',l:'Leader',sp:'Special',tr:'Treasure rare',pr:'Promo',p:'Promo'}[key]||null;
 return null;
}

export const GUEST_CARD_LIMIT = 50;
export const IMPORT_BATCH_SIZE = 10;
// Allow space for 50 photos even when browser quotas count UTF-16 bytes.
export const GUEST_IMAGE_DATA_LIMIT = 40000;
export const binderColors = ['lime', 'purple', 'blue', 'pink', 'coral', 'orange', 'gold', 'mint', 'teal', 'red', 'navy', 'black', 'hotpink', 'electricblue', 'violet', 'cyan'];
export const neutralColors = {pearl:'#f1eff1',ivory:'#faf8f2',mist:'#e5eceb',linen:'#eee7db',sand:'#e8dcc8',stone:'#dddcd6',espresso:'#302723',porcelain:'#f5f8fa',silver:'#d4d9df',graphite:'#252a30',ink:'#171e28',fog:'#e2e6ea',slate:'#303943',parchment:'#f2e8d5',taupe:'#d8cec0',charcoal:'#2b2928',clay:'#80766b',smoke:'#51585f',pewter:'#a4aaa9',onyx:'#090b0d',greige:'#c4b9a4',chalk:'#fdfdfb',cream:'#fbf4e8'};
// Keep older saved cover colors readable and accepted by imports.
export const backgroundColors = [...binderColors,...Object.keys(neutralColors)];
export const binderThemes = {
  pastel: {label:'Pastel', colors:['pink','purple','mint','blue'], backgrounds:['chalk','cream','clay','slate'], neutralPool:['chalk','cream','pearl','ivory','mist','linen','taupe','clay','smoke','slate','charcoal','espresso','ink']},
  vibrant: {label:'Vibrant', colors:['coral','orange','gold','teal'], backgrounds:['ivory','sand','stone','espresso'], neutralPool:['ivory','sand','stone','taupe','pewter','clay','smoke','espresso','graphite','charcoal','ink']},
  neon: {label:'Neon', colors:['lime','hotpink','electricblue','cyan'], backgrounds:['porcelain','silver','graphite','ink'], neutralPool:['porcelain','silver','pewter','clay','smoke','slate','graphite','ink','espresso']},
  gamer: {label:'Gamer', colors:['black','navy','red','violet'], backgrounds:['fog','slate','graphite','charcoal'], neutralPool:['fog','ivory','parchment','silver','taupe','pewter','clay','stone','smoke','slate','charcoal']},
  classic: {label:'Classic', colors:['red','navy','teal','gold'], backgrounds:['parchment','linen','taupe','charcoal'], neutralPool:['parchment','linen','taupe','ivory','sand','pewter','clay','smoke','charcoal','espresso','ink']},
};
export function paletteFor(theme, currentColor) {
  const colors = Object.hasOwn(binderThemes,theme) ? binderThemes[theme].colors : binderThemes.classic.colors;
  return currentColor && binderColors.includes(currentColor) && !colors.includes(currentColor) ? [...colors,currentColor] : colors;
}
export function backgroundPaletteFor(theme){return (Object.hasOwn(binderThemes,theme)?binderThemes[theme]:binderThemes.classic).backgrounds;}
export const raritiesByGame = {
  'Pokémon': ['Common', 'Uncommon', 'Rare', 'Holo rare', 'Double rare', 'Ultra rare', 'Illustration rare', 'Special illustration rare', 'Hyper rare', 'Shiny rare', 'Shiny ultra rare', 'ACE SPEC rare', 'Secret rare', 'Promo'],
  'Magic': ['Common', 'Uncommon', 'Rare', 'Mythic rare', 'Special'],
  'Yu-Gi-Oh!': ['Common', 'Rare', 'Super rare', 'Ultra rare', 'Secret rare', 'Ultimate rare', 'Ghost rare', 'Gold rare', 'Platinum rare', 'Prismatic secret rare', 'Platinum secret rare', 'Collector’s rare', 'Prismatic collector’s rare', 'Prismatic ultimate rare', 'Starlight rare', 'Quarter century secret rare'],
  'One Piece': ['Common', 'Uncommon', 'Rare', 'Super rare', 'Secret rare', 'Leader', 'Special', 'Treasure rare', 'Promo'],
  'Riftbound': ['Common', 'Uncommon', 'Rare', 'Epic', 'Showcase', 'Promo'],
  'Other': ['Common', 'Uncommon', 'Rare', 'Super rare', 'Ultra rare', 'Secret rare', 'Promo'],
};
// Preserve rarity support for existing binders without offering retired games.
export const games = Object.keys(raritiesByGame).filter(game => game !== 'Riftbound');
export function raritiesFor(game) { return Object.hasOwn(raritiesByGame, game) ? raritiesByGame[game] : raritiesByGame.Other; }
export function isRarityForGame(game, rarity) { return typeof rarity === 'string' && (game === 'Other' ? rarity.trim().length > 0 && rarity.trim().length <= 60 : raritiesFor(game).includes(rarity)); }
export function rarityRank(game, rarity) {
  const index = raritiesFor(game).indexOf(rarity);
  return index < 0 ? -1 : index;
}

import type { CatalogMatch } from './pokemon-matching.mjs';
export type TradingCard=CatalogMatch & {rarity:string;image:string|null;artwork:string;sourceUrl:string;metadata:Record<string,unknown>};
export function scryfallCards(cards:any[]):TradingCard[];
export function yugiohCards(cards:any[]):TradingCard[];
export function onePieceCards(cards:any[]):TradingCard[];
export function rankTradingCards(cards:TradingCard[],query:{name:string;set:string;number:string}):TradingCard[];
export function exactNumber(cards:TradingCard[],number:string):TradingCard[];
export function matchingSets(sets:{id:string;name:string}[],query:string):{id:string;name:string}[];

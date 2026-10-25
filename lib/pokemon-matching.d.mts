export function normalize(value:unknown):string;
export function collectorNumber(value:unknown):string;
export type CatalogMatch={id:string;name:string;localId:string;setId:string;setName:string;total?:number;hasImage:boolean;score?:number;match?:string};
export function rankMatches(cards:CatalogMatch[],query:{name:string;set:string;number:string}):CatalogMatch[];
export function catalogRarity(value:unknown):string|null;

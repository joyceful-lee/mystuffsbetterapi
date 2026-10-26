export type CardCatalog={slug:string;name:string;url:string;example:string;number:string};
export const cardCatalogs:Record<string,CardCatalog|undefined>;
export function rarityForCatalog(game:string,value:unknown):string|null;

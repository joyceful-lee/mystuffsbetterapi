import type { Binder, Card } from './types';
export function allFavorites(binders:Binder[]):{card:Card;binder:Binder}[];
export function allCards(binders:Binder[]):{card:Card;binder:Binder}[];
export function reorderItems<T extends {id:string}>(items:T[],ids:string[]):T[];
export function coverCard(binder:Binder):Card|null;

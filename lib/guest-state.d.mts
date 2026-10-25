import type { Binder } from './types';
export const GUEST_KEY:string;
export function readGuest(storage:Storage):Binder[];
export function writeGuest(storage:Storage,binders:Binder[]):void;
export function migrateGuest(storage:Storage,upload:(binder:Binder)=>Promise<unknown>):Promise<number>;

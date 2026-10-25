export const UPLOAD_MIME_TYPES:string[];
export const UPLOAD_ACCEPT:string;
export const MAX_SOURCE_IMAGE_BYTES:number;
export const MAX_SAVED_IMAGE_BYTES:number;
export const MAX_IMAGE_EDGE:number;
export const UPLOAD_GUIDELINES:string;
export function sourceImageError(file:{type:string;size:number}):string|null;

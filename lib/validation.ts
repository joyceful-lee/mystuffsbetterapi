import { z } from 'zod';
import { binderColors, backgroundColors, games, binderThemes } from './binder-config.mjs';
import { MAX_SAVED_IMAGE_BYTES } from './upload-guidelines.mjs';
export const binderInput = z.object({ name: z.string().trim().min(1).max(60), game: z.enum(games), color: z.enum(binderColors), backgroundColor: z.enum(backgroundColors).default('navy'), bio: z.string().trim().max(180).default(''), theme:z.string().refine(value=>Object.hasOwn(binderThemes,value)).default('classic') });
export const cardInput = z.object({ name: z.string().trim().min(1).max(100), image: z.string().max(350000).default(''), deck: z.string().trim().max(100).default(''), cardNumber: z.string().trim().max(40).default(''), rarity: z.string().trim().min(1).max(60), favorite: z.boolean().default(false) });
export function validImage(value: string) {
  const match = /^data:image\/(jpeg|png|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return false;
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > MAX_SAVED_IMAGE_BYTES || bytes.length < 12) return false;
  return (match[1] === 'jpeg' && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    || (match[1] === 'png' && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))
    || (match[1] === 'webp' && bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP')
    || (match[1] === 'gif' && ['GIF87a','GIF89a'].includes(bytes.toString('ascii',0,6)));
}

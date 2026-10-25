import { z } from 'zod';
import { IMPORT_BATCH_SIZE } from '../../../lib/binder-config.mjs';
import { account, ApiError, failure, jsonBody } from '../../../lib/api';
import { sql } from '../../../lib/db';
import { binderInput, cardInput, validImage } from '../../../lib/validation';
const input=binderInput.extend({id:z.string().uuid(),coverCardId:z.string().uuid().nullable().default(null),cards:z.array(cardInput.extend({id:z.string().uuid(),position:z.number().int().min(0).max(1000000).default(0)})).max(IMPORT_BATCH_SIZE)});
export async function POST(request:Request) {
 try {const user=await account(request);const data=input.parse(await jsonBody(request));
  if(data.cards.some(c=>c.image&&!validImage(c.image)))throw new ApiError('A guest card picture could not be read. Your guest binder is still saved on this browser.');
  // One atomic statement. Source IDs make retries safe after network failures.
  const [binder]=await sql()`WITH saved AS (
   INSERT INTO binders(user_id,name,game,color,bio,background_color,theme,position,guest_source_id)
   SELECT ${user.id},${data.name},${data.game},${data.color},${data.bio},${data.backgroundColor},${data.theme},COALESCE(MAX(position),-1)+1,${data.id} FROM binders WHERE user_id=${user.id}
   ON CONFLICT(user_id,guest_source_id) DO UPDATE SET guest_source_id=EXCLUDED.guest_source_id RETURNING id
  ), imported AS (
   INSERT INTO cards(binder_id,name,image,rarity,favorite,guest_source_id,position,deck,card_number)
   SELECT saved.id,c.name,c.image,c.rarity,c.favorite,c.id::uuid,c.position,c.deck,c."cardNumber" FROM saved CROSS JOIN jsonb_to_recordset(${JSON.stringify(data.cards)}::jsonb) AS c(id text,name text,image text,rarity text,favorite boolean,position integer,deck text,"cardNumber" text)
   ON CONFLICT(binder_id,guest_source_id) DO NOTHING RETURNING id
  ) SELECT id FROM saved`;
  // A guest cover may arrive in a later batch; map its source ID after that batch commits.
  if(data.coverCardId)await sql()`UPDATE binders b SET cover_card_id=c.id FROM cards c WHERE b.id=${binder.id} AND b.user_id=${user.id} AND b.cover_card_id IS NULL AND c.binder_id=b.id AND c.guest_source_id=${data.coverCardId}`;
  return Response.json({id:binder.id});
 }catch(e){return failure(e);}
}

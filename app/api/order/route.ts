import { z } from 'zod';
import { account, ApiError, failure, jsonBody } from '../../../lib/api';
import { sql } from '../../../lib/db';

const ids=z.array(z.string().uuid()).min(1).max(10000).refine(list=>new Set(list).size===list.length);
const input=z.discriminatedUnion('type',[
 z.object({type:z.literal('binders'),ids}),
 z.object({type:z.literal('cards'),binderId:z.string().uuid(),ids}),
]);
export async function POST(request:Request) {
 try {
  const user=await account(request);const data=input.parse(await jsonBody(request));const db=sql();const order=JSON.stringify(data.ids);let rows;
  // Check the whole owned set in the same statement so a stale or foreign order cannot partially apply.
  if(data.type==='binders')rows=await db`WITH owned AS (
    SELECT id FROM binders WHERE user_id=${user.id} FOR UPDATE
   ), requested AS (
    SELECT value::uuid AS id,(ordinality-1)::integer AS position FROM jsonb_array_elements_text(${order}::jsonb) WITH ORDINALITY
   ), valid AS (
    SELECT (SELECT COUNT(*) FROM owned)=${data.ids.length} AND NOT EXISTS(SELECT id FROM owned EXCEPT SELECT id FROM requested) AS ok
   ) UPDATE binders b SET position=r.position FROM requested r,valid v WHERE b.id=r.id AND b.user_id=${user.id} AND v.ok RETURNING b.id`;
  else rows=await db`WITH owned AS (
    SELECT c.id FROM cards c JOIN binders b ON b.id=c.binder_id WHERE b.id=${data.binderId} AND b.user_id=${user.id} FOR UPDATE OF c
   ), requested AS (
    SELECT value::uuid AS id,(ordinality-1)::integer AS position FROM jsonb_array_elements_text(${order}::jsonb) WITH ORDINALITY
   ), valid AS (
    SELECT (SELECT COUNT(*) FROM owned)=${data.ids.length} AND NOT EXISTS(SELECT id FROM owned EXCEPT SELECT id FROM requested) AS ok
   ) UPDATE cards c SET position=r.position FROM requested r,valid v WHERE c.id=r.id AND c.binder_id=${data.binderId} AND v.ok RETURNING c.id`;
  if(rows.length!==data.ids.length)throw new ApiError('The collection changed or could not be found. Close the order window and refresh before trying again.',409);
  return Response.json({ok:true});
 }catch(e){return failure(e);}
}

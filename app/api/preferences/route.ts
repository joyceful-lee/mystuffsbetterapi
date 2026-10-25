import { z } from 'zod';
import { account, failure, jsonBody } from '../../../lib/api';
import { sql } from '../../../lib/db';

export async function GET(){
 try{const user=await account();const [row]=await sql()`SELECT sample_hidden AS "sampleHidden" FROM collection_preferences WHERE user_id=${user.id}`;return Response.json({sampleHidden:row?.sampleHidden??false},{headers:{'Cache-Control':'private, no-store'}});}catch(e){return failure(e);}
}
export async function PATCH(request:Request){
 try{const user=await account(request);const data=z.object({sampleHidden:z.boolean()}).strict().parse(await jsonBody(request));await sql()`INSERT INTO collection_preferences(user_id,sample_hidden) VALUES(${user.id},${data.sampleHidden}) ON CONFLICT(user_id) DO UPDATE SET sample_hidden=EXCLUDED.sample_hidden`;return Response.json(data);}catch(e){return failure(e);}
}

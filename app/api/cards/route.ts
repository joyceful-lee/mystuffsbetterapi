import { z } from 'zod';
import { account, ApiError, failure, jsonBody } from '../../../lib/api';
import { sql } from '../../../lib/db';
import { isRarityForGame } from '../../../lib/binder-config.mjs';
import { cardInput, validImage } from '../../../lib/validation';
export async function POST(request:Request) {
 try { const user=await account(request);const data=cardInput.extend({binderId:z.string().uuid()}).parse(await jsonBody(request));
  if(data.image&&!validImage(data.image))throw new ApiError('Choose a JPG, PNG, WebP, or GIF picture.');
  const db=sql();
  const [binder]=await db`SELECT game FROM binders WHERE id=${data.binderId} AND user_id=${user.id}`;
  if(!binder)throw new ApiError('Binder not found.',404);
  if(!isRarityForGame(binder.game,data.rarity))throw new ApiError('Choose a rarity for this binder’s card game.');
  const [card]=await db`INSERT INTO cards(binder_id,name,image,rarity,favorite,deck,card_number,position) SELECT b.id,${data.name},${data.image},${data.rarity},${data.favorite},${data.deck},${data.cardNumber},COALESCE((SELECT MAX(c.position)+1 FROM cards c WHERE c.binder_id=b.id),0) FROM binders b WHERE b.id=${data.binderId} AND b.user_id=${user.id} AND b.game=${binder.game} RETURNING id,name,image,rarity,favorite,deck,card_number AS "cardNumber"`;
  if(!card)throw new ApiError('Binder not found.',404);return Response.json({card},{status:201});
 }catch(e){return failure(e);}
}

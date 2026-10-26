import { ApiError, failure } from '../../../../../../../lib/api';
import { catalogGame, tradingCardImage } from '../../../../../../../lib/trading-card-catalog';
export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{game:string;id:string}>}){
 try{
  const {game,id}=await params,parsed=catalogGame.safeParse(game);if(!parsed.success)throw new ApiError('This game uses manual card entry.',404);
  const image=await tradingCardImage(parsed.data,id);
  return new Response(Buffer.from(image.base64,'base64'),{headers:{'Content-Type':image.type,'Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'}});
 }catch(error){return failure(error);}
}

import { ApiError, failure } from '../../../../../../lib/api';
import { catalogGame, tradingCardDetail, supportedCatalogImage } from '../../../../../../lib/trading-card-catalog';
export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{game:string;id:string}>}){
 try{
  const {game,id}=await params,parsed=catalogGame.safeParse(game);if(!parsed.success)throw new ApiError('This game uses manual card entry.',404);
  const card=await tradingCardDetail(parsed.data,id);
  return Response.json({card:{...card,image:supportedCatalogImage(parsed.data,card.image)?`/api/catalog/${parsed.data}/cards/${card.id}/image`:null,set:{id:card.setId,name:card.setName}}},{headers:{'Cache-Control':'public, max-age=3600'}});
 }catch(error){return failure(error);}
}

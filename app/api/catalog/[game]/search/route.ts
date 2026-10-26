import { ApiError, failure } from '../../../../../lib/api';
import { catalogGame, tradingSearchInput, searchTradingCards } from '../../../../../lib/trading-card-catalog';
export const runtime='nodejs';
export async function GET(request:Request,{params}:{params:Promise<{game:string}>}){
 try{
  const game=catalogGame.safeParse((await params).game);if(!game.success)throw new ApiError('This game uses manual card entry.',404);
  const query=tradingSearchInput.safeParse(Object.fromEntries(new URL(request.url).searchParams));if(!query.success)throw new ApiError('Enter a card name (at least 2 letters), a full card code, or a set and number.');
  return Response.json(await searchTradingCards(game.data,query.data),{headers:{'Cache-Control':'public, max-age=300'}});
 }catch(error){return failure(error);}
}

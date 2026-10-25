import { failure } from '../../../../../lib/api';
import { pokemonDetail } from '../../../../../lib/pokemon-catalog';
export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 try{return Response.json({card:await pokemonDetail((await params).id)},{headers:{'Cache-Control':'public, max-age=3600'}});}catch(error){return failure(error);}
}

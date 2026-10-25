import { ApiError, failure } from '../../../../lib/api';
import { catalogSearchInput, searchPokemon } from '../../../../lib/pokemon-catalog';
export const runtime='nodejs';
export async function GET(request:Request){
 try{const query=catalogSearchInput.safeParse(Object.fromEntries(new URL(request.url).searchParams));if(!query.success)throw new ApiError('Enter a Pokémon name (at least 2 letters), or a set and card number.');return Response.json(await searchPokemon(query.data),{headers:{'Cache-Control':'public, max-age=300'}});}
 catch(error){return failure(error);}
}

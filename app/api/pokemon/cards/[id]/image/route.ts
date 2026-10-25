import { failure } from '../../../../../../lib/api';
import { pokemonImage } from '../../../../../../lib/pokemon-catalog';
export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 try{const image=await pokemonImage((await params).id);return new Response(Buffer.from(image.slice(image.indexOf(',')+1),'base64'),{headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'}});}catch(error){return failure(error);}
}

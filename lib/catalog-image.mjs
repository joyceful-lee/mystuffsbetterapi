export function supportedCatalogImage(game,image){
 if(!image)return false;
 try{const url=new URL(image);if(url.protocol!=='https:'||url.username||url.password||url.port)return false;
  if(game==='magic')return url.hostname==='cards.scryfall.io'&&/^\/(normal|large)\//.test(url.pathname);
  if(game==='yugioh')return url.hostname==='images.ygoprodeck.com'&&/^\/images\/cards\/\d+\.jpg$/.test(url.pathname);
  return game==='one-piece'&&url.hostname==='optcgapi.com'&&url.pathname.startsWith('/media/static/Card_Images/');
 }catch{return false;}
}
// Some catalog hosts label PNG bytes as image/jpeg. Detect supported signatures
// and serve the real type rather than trusting a filename or response header.
export function catalogImageType(bytes){
 if(bytes.length<12)return null;
 if([137,80,78,71,13,10,26,10].every((value,i)=>bytes[i]===value))return 'image/png';
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
 if([82,73,70,70].every((value,i)=>bytes[i]===value)&&[87,69,66,80].every((value,i)=>bytes[i+8]===value))return 'image/webp';
 return null;
}

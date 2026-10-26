'use client';
import { useEffect, useRef, useState } from 'react';
import type { Card } from '../lib/types';
import { isRarityForGame, raritiesFor } from '../lib/binder-config.mjs';
import type { CatalogMatch } from '../lib/pokemon-matching.mjs';
import { cardCatalogs, rarityForCatalog } from '../lib/card-catalog-config.mjs';

type CatalogCard={id:string;name:string;localId:string;rarity?:string;image?:string;set:{name:string;cardCount?:{official?:number}}};
type Results={cards:CatalogMatch[];total:number;page:number;hasMore:boolean;truncated?:boolean};
function CatalogPreview({match,basePath}:{match:CatalogMatch;basePath:string}){
 const [failed,setFailed]=useState(false);
 return match.hasImage&&!failed?<img src={`${basePath}/cards/${encodeURIComponent(match.id)}/image`} alt={`${match.name}, ${match.setName}, number ${match.localId}`} loading="lazy" onError={()=>setFailed(true)}/>:<span className="pokemon-no-picture">Picture unavailable</span>;
}
async function readJson<T>(path:string,signal?:AbortSignal):Promise<T>{
 const response=await fetch(path,{signal});
 const data=await response.json();
 if(!response.ok)throw new Error(data.error||'Card search is unavailable. Please try again.');
 return data;
}

export default function CardDetailsFields({card,game,otherRarities,disabled,onImage,onBusy}:{card:Card|null;game:string;otherRarities:string[];disabled:boolean;onImage:(image:Blob)=>Promise<void>;onBusy:(busy:boolean)=>void}){
 const catalog=cardCatalogs[game],basePath=catalog?.slug==='pokemon'?'/api/pokemon':`/api/catalog/${catalog?.slug||''}`;
 const [name,setName]=useState(card?.name||''),[deck,setDeck]=useState(card?.deck||''),[number,setNumber]=useState(card?.cardNumber||'');
 const [rarity,setRarity]=useState(card?(isRarityForGame(game,card.rarity)?card.rarity:''):raritiesFor(game)[0]);
 const [results,setResults]=useState<Results|null>(null),[message,setMessage]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 const request=useRef<AbortController|null>(null);
 useEffect(()=>()=>request.current?.abort(),[]);
 function change(update:()=>void){request.current?.abort();setLoading(false);setResults(null);setMessage('');setError('');update();}
 async function search(page=1){
  request.current?.abort();const controller=new AbortController();request.current=controller;setLoading(true);setError('');setMessage('');
  try{const data=await readJson<Results>(`${basePath}/search?${new URLSearchParams({name,set:deck,number,page:String(page)})}`,controller.signal);if(!controller.signal.aborted)setResults(data);}
  catch(error){if(!controller.signal.aborted){setResults(null);setError(error instanceof Error?error.message:'Could not search cards.');}}
  finally{if(!controller.signal.aborted)setLoading(false);}
 }
 async function choose(match:CatalogMatch){
  if(disabled||loading)return;
  const controller=new AbortController();request.current=controller;setLoading(true);onBusy(true);setError('');setMessage('');
  try{
   // Only copy an image when the user selects a printing. Preview loads use the
   // same cached image endpoint, so selecting it does not refetch the provider.
   const {card:selected}=await readJson<{card:CatalogCard}>(`${basePath}/cards/${encodeURIComponent(match.id)}`,controller.signal);
   let imageWarning='';
   if(selected.image){
    try{
     const response=await fetch(`${basePath}/cards/${encodeURIComponent(match.id)}/image`,{signal:controller.signal});
     if(!response.ok)throw new Error('Picture unavailable');
     await onImage(await response.blob());
    }catch{imageWarning=' The catalog picture could not be copied; your current picture was kept. You can upload your own.';}
   }else imageWarning=' No catalog image is available; your current picture was kept.';
   if(controller.signal.aborted)return;
   setName(selected.name);setDeck(selected.set.name);setNumber(`${selected.localId}${selected.set.cardCount?.official?`/${selected.set.cardCount.official}`:''}`);
   const mapped=rarityForCatalog(game,selected.rarity);
   setRarity(mapped||'');
   setResults(null);setMessage(`${selected.name} selected from ${selected.set.name}.${imageWarning}${!mapped?` Catalog rarity: ${selected.rarity||'not listed'}. Choose the appropriate rarity below.`:''} Review the fields, then save your card.`);
  }catch(error){if(!controller.signal.aborted)setError(error instanceof Error?error.message:'Could not select this card.');}
  finally{if(!controller.signal.aborted){setLoading(false);onBusy(false);}}
 }
 return <>
  <label>Card name<input name="name" required maxLength={100} value={name} disabled={disabled} onChange={event=>change(()=>setName(event.target.value))} placeholder="Enter the printed card name"/></label>
  <label>{catalog?'Set / deck (optional)':'Deck (optional)'}<input name="deck" maxLength={100} value={deck} disabled={disabled} onChange={event=>change(()=>setDeck(event.target.value))} placeholder={catalog?`e.g. ${catalog.example}`:'e.g. My first deck'}/>{catalog&&<span className="field-hint">Use the printed set name or set ID for the best match. Leave this blank for a name-only search.</span>}</label>
  <label>Card number (optional)<input name="cardNumber" maxLength={40} value={number} disabled={disabled} onChange={event=>change(()=>setNumber(event.target.value))} placeholder={`e.g. ${catalog?.number||'061/298'}`}/></label>
  {catalog&&<section className="pokemon-lookup" aria-label={`Find a ${game} printing`} aria-busy={loading}>
   <p className="small muted">Find the matching card image and details. Set + card number rank first; name helps confirm the printing. Always check the picture.</p>
   <button className="button secondary wide" type="button" disabled={disabled||loading} onClick={()=>void search()}>{loading?'Finding your card…':`Find ${game} card matches`}</button>
   {error&&<p className="form-error" role="alert">{error} You can still enter details and upload a picture manually.</p>}
   {message&&<p className="small" role="status">{message}</p>}
   {results&&<>
    <p className="small" role="status">{results.total?`${results.total} possible ${results.total===1?'printing':'printings'}. Choose the one you own.`:'No matches. Check the set name, or clear it to search by name.'}</p>
    {results.truncated&&<p className="small muted">More cards match this broad search. Add a set name or card number to narrow the results.</p>}
    <div className="pokemon-results">{results.cards.map(match=><button className="pokemon-result" type="button" key={match.id} disabled={disabled||loading} onClick={()=>void choose(match)}>
     <CatalogPreview match={match} basePath={basePath}/>
     <strong>{match.name}</strong><span>{match.setName}</span><span>#{match.localId}{match.total?`/${match.total}`:''}</span>{match.rarity&&<span>{match.rarity}</span>}{match.artwork&&<small>{match.artwork}</small>}<small>{match.match}</small><span className="pokemon-choose">Use this printing</span>
    </button>)}</div>
    {(results.page>1||results.hasMore)&&<div className="pokemon-pagination"><button type="button" className="button secondary" disabled={disabled||loading||results.page===1} onClick={()=>void search(results.page-1)}>Previous</button><span>Page {results.page}</span><button type="button" className="button secondary" disabled={disabled||loading||!results.hasMore} onClick={()=>void search(results.page+1)}>Next</button></div>}
   </>}
   <p className="small muted">Card catalog: <a href={catalog.url} target="_blank" rel="noreferrer">{catalog.name}</a>. Different finishes may share a scan.</p>
  </section>}
  <label>Rarity{game==='Other'?<><input name="rarity" required maxLength={60} list="other-rarities" value={rarity} disabled={disabled} onChange={event=>setRarity(event.target.value)} placeholder="e.g. Legendary, Event exclusive, or Rare"/><datalist id="other-rarities">{otherRarities.map(value=><option key={value} value={value}/>)}</datalist><span className="field-hint">Enter your own rarity, or choose a suggestion. You can use up to 60 characters.</span></>:<select name="rarity" required value={rarity} disabled={disabled} onChange={event=>setRarity(event.target.value)}>{!isRarityForGame(game,rarity)&&<option value="" disabled>Choose a {game} rarity</option>}{raritiesFor(game).map(value=><option key={value}>{value}</option>)}</select>}</label>
 </>;
}

'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';
export default function OrderingList({items,busy,onSave}:{items:{id:string;name:string;image?:string}[];busy:boolean;onSave:(ids:string[])=>void}) {
 const [ids,setIds]=useState(()=>items.map(item=>item.id));const dragged=useRef<string|null>(null);
 const [dragging,setDragging]=useState<string|null>(null);
 const rows=useRef(new Map<string,HTMLLIElement>()),positions=useRef(new Map<string,DOMRect>()),beforeDrag=useRef<string[]>([]),dropped=useRef(false);
 const byId=new Map(items.map(item=>[item.id,item]));
 function measure(){positions.current=new Map([...rows.current].map(([id,row])=>[id,row.getBoundingClientRect()]));}
 function move(id:string,to:number){measure();setIds(current=>{const next=current.filter(value=>value!==id);next.splice(Math.max(0,Math.min(to,next.length)),0,id);return next;});}
 useLayoutEffect(()=>{
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)for(const [id,row] of rows.current){
   const previous=positions.current.get(id);if(!previous||id===dragged.current)continue;
   row.getAnimations().forEach(animation=>animation.cancel());
   const delta=previous.top-row.getBoundingClientRect().top;
   if(Math.abs(delta)>1)row.animate([{transform:`translateY(${delta}px)`},{transform:'translateY(0)'}],{duration:180,easing:'cubic-bezier(.2,.7,.2,1)'});
  }
  positions.current.clear();
 },[ids]);
 function finish(){if(!dropped.current){measure();setIds(beforeDrag.current);}dragged.current=null;setDragging(null);}
 return <div className="ordering-list"><p className="muted">Drag a row to move it while the others shift into place. You can also use the arrows or choose a position, then select Save order.</p><ol onDragOver={event=>{if(dragged.current){event.preventDefault();event.dataTransfer.dropEffect='move';const box=event.currentTarget.getBoundingClientRect();if(event.clientY<box.top+40)event.currentTarget.scrollTop-=12;else if(event.clientY>box.bottom-40)event.currentTarget.scrollTop+=12;}}} onDrop={event=>{if(dragged.current){event.preventDefault();dropped.current=true;}}}>{ids.map((id,index)=>{const item=byId.get(id);if(!item)return null;return <li ref={row=>{if(row)rows.current.set(id,row);else rows.current.delete(id);}} className={dragging===id?'is-dragging':''} key={id} draggable={!busy} onDragStart={event=>{if((event.target as HTMLElement).closest('button,select')){event.preventDefault();return;}beforeDrag.current=[...ids];dropped.current=false;dragged.current=id;setDragging(id);event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',id);}} onDragEnd={finish} onDragOver={event=>{
  const source=dragged.current;if(!source||source===id||busy)return;
  event.preventDefault();event.dataTransfer.dropEffect='move';
  const sourceIndex=ids.indexOf(source),box=event.currentTarget.getBoundingClientRect(),middle=box.top+box.height/2;
  if((sourceIndex<index&&event.clientY>=middle)||(sourceIndex>index&&event.clientY<=middle))move(source,index);
 }}><GripVertical size={18} className="drag-handle" aria-hidden="true"/>{item.image&&<img src={item.image} alt="" draggable={false}/>}<span>{item.name}</span><select aria-label={`Position of ${item.name}`} value={index} disabled={busy||!!dragging} onChange={event=>move(id,Number(event.target.value))}>{ids.map((_,position)=><option key={position} value={position}>{position+1}</option>)}</select><button type="button" className="icon-button" aria-label={`Move ${item.name} up`} disabled={busy||!!dragging||index===0} onClick={()=>move(id,index-1)}><ArrowUp size={17}/></button><button type="button" className="icon-button" aria-label={`Move ${item.name} down`} disabled={busy||!!dragging||index===ids.length-1} onClick={()=>move(id,index+1)}><ArrowDown size={17}/></button></li>;})}</ol><span className="sr-only" aria-live="polite">{dragging?`${byId.get(dragging)?.name} is in position ${ids.indexOf(dragging)+1} of ${ids.length}`:''}</span><button className="button primary wide" disabled={busy||!!dragging} onClick={()=>onSave(ids)}>{busy?'Saving order…':'Save order'}</button></div>;
}

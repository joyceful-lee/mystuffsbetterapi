'use client';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
export default function Modal({title,close,children,className=''}:{title:string;close:()=>void;children:React.ReactNode;className?:string}) {
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const dialog=ref.current!;dialog.showModal();return()=>dialog.close();},[]);
 return <dialog ref={ref} className={`modal ${className}`} onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.target===e.currentTarget)close();}} aria-labelledby="modal-title"><div className="modal-heading"><h2 id="modal-title">{title}</h2><button className="icon-button" aria-label="Close" onClick={close}><X size={20}/></button></div>{children}</dialog>;
}

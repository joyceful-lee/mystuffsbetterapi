'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { workspaceStyle } from '../lib/appearance.mjs';

type Mode='light'|'dark';
const preferenceKey='mystuffsbetter.display-mode';
const DisplayModeContext=createContext<{mode:Mode;choose:(mode:Mode)=>void}>({mode:'dark',choose:()=>{}});

export function DisplayModeProvider({children}:{children:React.ReactNode}) {
 const [mode,setMode]=useState<Mode>('dark');
 useEffect(()=>{
  let saved:string|null=null;
  try{saved=localStorage.getItem(preferenceKey);}catch{}
  setMode(saved==='light'||saved==='dark'?saved:window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  function sync(event:StorageEvent){if(event.key===preferenceKey&&(event.newValue==='light'||event.newValue==='dark'))setMode(event.newValue);}
  window.addEventListener('storage',sync);return ()=>window.removeEventListener('storage',sync);
 },[]);
 function choose(value:Mode){setMode(value);try{localStorage.setItem(preferenceKey,value);}catch{}}
 return <DisplayModeContext.Provider value={{mode,choose}}><div className="site-appearance" data-display-mode={mode} style={workspaceStyle(mode)}>{children}</div></DisplayModeContext.Provider>;
}
export function useDisplayMode(){return useContext(DisplayModeContext);}
export function DisplayModeSwitch(){
 const {mode,choose}=useDisplayMode();
 return <div className="display-mode-switch" role="group" aria-label="Page appearance"><button type="button" aria-pressed={mode==='light'} onClick={()=>choose('light')}><Sun size={15}/><span>Light</span></button><button type="button" aria-pressed={mode==='dark'} onClick={()=>choose('dark')}><Moon size={15}/><span>Dark</span></button></div>;
}

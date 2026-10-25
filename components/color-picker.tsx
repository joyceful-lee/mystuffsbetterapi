import { Check } from 'lucide-react';
import { appearanceStyle } from '../lib/appearance.mjs';

export default function ColorPicker({label,name,colors,value,onChange,background=false,theme='classic'}:{label:string;name:string;colors:string[];value:string;onChange:(value:string)=>void;background?:boolean;theme?:string}) {
 return <fieldset className={`color-picker ${background?'neutral-color-picker':''}`}><legend>{label}</legend>{colors.map(color=><label className={`color-option ${color} ${background?`background-option theme-${color}`:''}`} style={appearanceStyle(theme,color)} key={color} title={color.charAt(0).toUpperCase()+color.slice(1)}><input type="radio" name={name} value={color} checked={value===color} onChange={()=>onChange(color)} aria-label={`${color.charAt(0).toUpperCase()+color.slice(1)} ${background?'binder cover and page':'binder spine'}`}/><span><Check size={18}/></span></label>)}</fieldset>;
}

const colors={lime:'#c5f36c',purple:'#cfb9ef',blue:'#acd9f0',pink:'#f1bfd5',coral:'#ff9f88',orange:'#ffbe76',gold:'#ffe18a',mint:'#b9e7cc',teal:'#64ccc0',red:'#d85a72',navy:'#263954',black:'#262d2c',hotpink:'#ff68ce',electricblue:'#6b9fff',violet:'#9872d5',cyan:'#65eceb'};
import { neutralColors, binderThemes } from './binder-config.mjs';
const familyColors={
 workspace:{light:'#eeece5',dark:'#202428'},
 pastel:{pink:'#f4d6e2',purple:'#e1d6f3',mint:'#d6eddf',blue:'#d4eaf5'},
 vibrant:{coral:'#ffb098',orange:'#ffc27f',gold:'#ffe18a',teal:'#7cd9cc'},
 neon:{lime:'#c3fa57',hotpink:'#ff76d5',electricblue:'#83adff',cyan:'#78f5ee'},
 gamer:{black:'#20262d',navy:'#22344e',red:'#542d3e',violet:'#3d2c57'},
 classic:{red:'#922f3c',navy:'#243c62',teal:'#176759',gold:'#d4aa4f',lime:'#465129',purple:'#583365',blue:'#24466e',pink:'#803750'},
};
function mix(first,second,amount){const a=first.slice(1).match(/../g).map(value=>parseInt(value,16));const b=second.slice(1).match(/../g).map(value=>parseInt(value,16));return '#'+a.map((value,index)=>Math.round(value*(1-amount)+b[index]*amount).toString(16).padStart(2,'0')).join('');}
function luminance(hex){const rgb=hex.slice(1).match(/../g).map(value=>parseInt(value,16)/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
function contrast(first,second){const a=luminance(first),b=luminance(second);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);}
export function colorContrast(first,second){return contrast(first,second);}
function oklab(hex){
 const [r,g,b]=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b),m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b),s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
 return [.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s];
}
export function colorDistance(first,second){const a=oklab(first),b=oklab(second);return Math.hypot(...a.map((v,i)=>v-b[i]));}
export function coverPaletteFor(theme,spineColor){
 if(theme==='pastel')return ['chalk','cream','clay','slate'];
 const family=Object.hasOwn(binderThemes,theme)?binderThemes[theme]:binderThemes.classic;
 const spine=appearanceFor(theme,spineColor).background;
 const pool=[...new Set([...family.neutralPool,'onyx','greige','ivory','pewter','smoke','slate','espresso','ink'])];
 const candidates=pool;
 const ultraLight=pool.find(color=>luminance(neutralColors[color])>=.85)||'ivory';
 const dark=pool.find(color=>luminance(neutralColors[color])<=.045)||'ink';
 const selected=[ultraLight,dark];
 while(selected.length<4&&selected.length<candidates.length){
  const remaining=candidates.filter(color=>!selected.includes(color));
  const score=color=>Math.min(...selected.map(other=>colorDistance(neutralColors[color],neutralColors[other])))+.015*Math.log2(contrast(neutralColors[color],spine));
  remaining.sort((a,b)=>score(b)-score(a));
  selected.push(remaining[0]);
 }
 return selected.sort((a,b)=>luminance(neutralColors[b])-luminance(neutralColors[a]));
}
export function appearanceFor(theme,color){
 const family=Object.hasOwn(familyColors,theme)?familyColors[theme]:familyColors.classic;
 const background=Object.hasOwn(neutralColors,color)?neutralColors[color]:family[color]||(Object.hasOwn(colors,color)?colors[color]:family.navy||colors.navy);
 const darkInk='#202e2b',lightInk='#faf8f1';const lightContrast=(luminance(lightInk)+.05)/(luminance(background)+.05);const darkContrast=(luminance(background)+.05)/(luminance(darkInk)+.05);
 let light=darkContrast>=lightContrast;
 let ink=light?darkInk:lightInk;
 if(contrast(ink,background)<4.5){light=contrast('#000000',background)>=contrast('#ffffff',background);ink=light?'#000000':'#ffffff';}
 const softer= mix(ink,background,.15);
 function accessibleSurface(amount){const candidate=mix(background,'#ffffff',amount);return contrast(ink,candidate)>=4.5?candidate:mix(background,'#000000',amount);}
 const surface=accessibleSurface(light?.56:.055),raised=accessibleSurface(light?.76:.12),appBackground=mix(background,light?'#ffffff':'#10151b',.2),sleeve=accessibleSurface(light?.24:.07);
 const accent=light?'#174b91':'#8bc2ff';
 const danger=light?'#792a36':'#ffb8b5';
 return {
  mode:light?'light':'dark',background,ink,
  muted:[background,surface,raised,appBackground,sleeve].every(value=>contrast(softer,value)>=4.5)?softer:ink,
  surface,raised,appBackground,sleeve,
  border:mix(background,ink,light?.32:.3),
  accent:contrast(accent,background)>=4.5?accent:ink,
  button:light?'#174b91':'#8bc2ff',buttonInk:light?'#fffdf5':'#142b43',
  danger:contrast(danger,background)>=4.5?danger:ink,
  shadow:light?'0 1px 1px rgb(16 28 22 / 12%)':'0 1px 2px rgb(0 0 0 / 55%)',
 };
}
function styleFor(look){
 return {'colorScheme':look.mode,'--page-bg':look.background,'--page-ink':look.ink,'--page-muted':look.muted,'--surface':look.surface,'--surface-raised':look.raised,'--app-bg':look.appBackground,'--sleeve-bg':look.sleeve,'--page-border':look.border,'--page-accent':look.accent,'--button-bg':look.button,'--button-ink':look.buttonInk,'--page-danger':look.danger,'--page-text-shadow':look.shadow};
}
export function appearanceStyle(theme,color){return styleFor(appearanceFor(theme,color));}
export function binderAppearanceFor(theme,backgroundColor,spineColor){
 const look=appearanceFor(theme,backgroundColor),spine=appearanceFor(theme,spineColor).background;
 let accent=spine;
 const surfaces=[look.background,look.surface,look.raised,look.sleeve];
 for(let step=1;step<=20&&surfaces.some(surface=>contrast(accent,surface)<4.5);step++)accent=mix(spine,look.mode==='light'?'#000000':'#ffffff',step/20);
 const dark='#171c22',white='#ffffff';
 return {...look,accent,button:spine,buttonInk:contrast(spine,dark)>=contrast(spine,white)?dark:white,spine};
}
export function binderAppearanceStyle(theme,backgroundColor,spineColor){const look=binderAppearanceFor(theme,backgroundColor,spineColor);return {...styleFor(look),'--spine-color':look.spine};}
export function workspaceStyle(mode){return appearanceStyle('workspace',mode==='light'?'light':'dark');}

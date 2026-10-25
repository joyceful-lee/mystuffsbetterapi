import type { CSSProperties } from 'react';
export function appearanceFor(theme:string,color:string):{mode:'light'|'dark';background:string;ink:string;muted:string;surface:string;raised:string;appBackground:string;sleeve:string;border:string;accent:string;button:string;buttonInk:string;danger:string;shadow:string};
export function appearanceStyle(theme:string,color:string):CSSProperties;
export function workspaceStyle(mode:'light'|'dark'):CSSProperties;
export function binderAppearanceFor(theme:string,backgroundColor:string,spineColor:string):ReturnType<typeof appearanceFor>&{spine:string};
export function binderAppearanceStyle(theme:string,backgroundColor:string,spineColor:string):CSSProperties;
export function coverPaletteFor(theme:string,spineColor:string):string[];
export function colorContrast(first:string,second:string):number;
export function colorDistance(first:string,second:string):number;

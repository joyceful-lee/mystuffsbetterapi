import {test} from 'node:test';
import assert from 'node:assert/strict';
import {appearanceFor,appearanceStyle,workspaceStyle,binderAppearanceFor,binderAppearanceStyle,coverPaletteFor,colorDistance} from '../lib/appearance.mjs';
import {binderColors,backgroundColors,binderThemes,paletteFor,backgroundPaletteFor,neutralColors} from '../lib/binder-config.mjs';
function luminance(hex){const values=hex.slice(1).match(/../g).map(value=>parseInt(value,16)/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4);return values[0]*.2126+values[1]*.7152+values[2]*.0722;}
function ratio(a,b){const first=luminance(a),second=luminance(b);return (Math.max(first,second)+.05)/(Math.min(first,second)+.05);}
test('every supported theme and saved color keeps primary, secondary, and action text readable',()=>{
 for(const theme of Object.keys(binderThemes))for(const color of backgroundColors){
  const look=appearanceFor(theme,color);
  for(const key of ['ink','muted','accent','danger'])assert.ok(ratio(look[key],look.background)>=4.5,`${theme}/${color} ${key} contrast`);
  for(const surface of ['surface','raised','sleeve','appBackground'])for(const key of ['ink','muted'])assert.ok(ratio(look[key],look[surface])>=4.5,`${theme}/${color} ${key} on ${surface}`);
  assert.ok(ratio(look.button,look.buttonInk)>=4.5,`${theme}/${color} button contrast`);
 }
});
test('pastel and neon pages use light, colorful backgrounds while gamer keeps its intended dark palette',()=>{
 for(const color of paletteFor('pastel')){const look=appearanceFor('pastel',color);assert.equal(look.mode,'light');assert.ok(luminance(look.background)>.6);assert.notEqual(look.appBackground,'#151b25');assert.match(look.shadow,/12%/);}
 for(const color of paletteFor('neon')){assert.equal(appearanceFor('neon',color).mode,'light');assert.ok(luminance(appearanceFor('neon',color).background)>.3);}
 for(const color of paletteFor('gamer'))assert.equal(appearanceFor('gamer',color).mode,'dark');
});
test('form previews, swatches, shared binder pages, and the app shell can use identical appearance tokens',()=>{
 const look=appearanceFor('pastel','pink'),style=appearanceStyle('pastel','pink');
 assert.equal(style['--page-bg'],look.background);assert.equal(style['--app-bg'],look.appBackground);assert.equal(style['--page-ink'],look.ink);assert.equal(style.colorScheme,'light');
 assert.equal(appearanceFor('unknown','unknown').background,appearanceFor('classic','navy').background);
});
test('Classic offers deeper traditional colors distinct from the Pastel palette',()=>{
 assert.deepEqual(paletteFor('classic'),['red','navy','teal','gold']);
 assert.equal(paletteFor('classic').filter(color=>paletteFor('pastel').includes(color)).length,0);
 for(const color of ['red','navy','teal'])assert.ok(luminance(appearanceFor('classic',color).background)<.2);
 for(const color of ['purple','blue','pink'])assert.notEqual(appearanceFor('classic',color).background,appearanceFor('pastel',color).background);
});
test('light and dark workspace text stays readable across navigation and dialog surfaces',()=>{
 for(const mode of ['light','dark']){
  const look=appearanceFor('workspace',mode),style=workspaceStyle(mode);
  assert.equal(look.mode,mode);assert.equal(style.colorScheme,mode);
  for(const surface of ['background','surface','raised','appBackground'])for(const key of ['ink','muted','accent','danger'])assert.ok(ratio(look[key],look[surface])>=4.5,`${mode}/${key}/${surface}`);
  assert.ok(ratio(look.button,look.buttonInk)>=4.5);
 }
 assert.notEqual(workspaceStyle('light')['--app-bg'],workspaceStyle('dark')['--app-bg']);
});
test('each theme offers four neutral cover colors separately from its colored spines',()=>{
 for(const theme of Object.keys(binderThemes)){
  const backgrounds=backgroundPaletteFor(theme);
  assert.equal(backgrounds.length,4);assert.equal(new Set(backgrounds).size,4);
  for(const color of backgrounds){assert.ok(Object.hasOwn(neutralColors,color));assert.ok(backgroundColors.includes(color));assert.ok(!paletteFor(theme).includes(color));}
 }
 assert.ok(backgroundColors.includes('pink'),'old cover colors remain accepted');
});
test('binder backgrounds match covers exactly and highlights follow the spine with readable text',()=>{
 for(const theme of Object.keys(binderThemes))for(const background of backgroundColors)for(const spine of paletteFor(theme)){
  const look=binderAppearanceFor(theme,background,spine),style=binderAppearanceStyle(theme,background,spine);
  assert.equal(look.background,appearanceFor(theme,background).background);
  assert.equal(look.spine,appearanceFor(theme,spine).background);
  assert.equal(style['--page-bg'],look.background);assert.equal(style['--spine-color'],look.spine);
  assert.equal(style['--button-bg'],look.spine);assert.ok(ratio(look.button,look.buttonInk)>=4.5,`${theme}/${background}/${spine} button`);
  for(const surface of ['background','surface','raised','sleeve'])assert.ok(ratio(look.accent,look[surface])>=4.5,`${theme}/${background}/${spine} text on ${surface}`);
 }
});
test('every spine gets an ultra-light, dark, and two varied complementary neutral choices',()=>{
 for(const theme of Object.keys(binderThemes))for(const spine of binderColors){
  const choices=coverPaletteFor(theme,spine),spineHex=appearanceFor(theme,spine).background;
  assert.equal(choices.length,4,`${theme}/${spine} has four choices`);
  assert.equal(new Set(choices).size,4);
  for(const color of choices)assert.ok(Object.hasOwn(neutralColors,color));
  assert.ok(choices.some(color=>luminance(neutralColors[color])>=.85),`${theme}/${spine} ultra-light`);
  assert.ok(choices.some(color=>luminance(neutralColors[color])<=.045),`${theme}/${spine} dark`);
  for(let i=0;i<choices.length;i++)for(let j=i+1;j<choices.length;j++)assert.ok(colorDistance(neutralColors[choices[i]],neutralColors[choices[j]])>=(theme==='pastel'&&i<2&&j<2?.025:.15),`${theme}/${spine}/${choices[i]}/${choices[j]} variety`);
 }
});
test('Pastel offers white and warm brown-based ultra-lights with two darker neutral alternatives',()=>{
 for(const spine of binderColors){
  const choices=coverPaletteFor('pastel',spine);
  assert.deepEqual(choices,['chalk','cream','clay','slate']);
  assert.equal(choices.filter(color=>luminance(neutralColors[color])>=.85).length,2);
  assert.equal(choices.filter(color=>luminance(neutralColors[color])<.25).length,2);
  const warm=neutralColors[choices[1]].slice(1).match(/../g).map(value=>parseInt(value,16));
  assert.ok(warm[0]>warm[1]&&warm[1]>warm[2]);
 }
});

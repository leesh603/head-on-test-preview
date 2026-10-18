// One preprocessed atlas. Aircraft, primary tracers and cannon artwork remain unchanged.
export const COMBAT_FX_CELLS = Object.freeze([
  'explosion0','explosion1','explosion2','explosion3',
  'fire0','fire1','fire2','fire3',
  'smokeGray','smokeDark','smokeWisp','smokePuff',
  'spark','armorSpark','gas','gasThin'
]);
const CELL=128, COLS=4;
const index = new Map(COMBAT_FX_CELLS.map((key,i)=>[key,i]));
index.set('fire',index.get('fire0'));
const atlas = typeof Image === 'undefined' ? null : new Image();
let loaded=false;
export const fxArtReady = !atlas ? Promise.resolve(false) : new Promise(resolve=>{
  atlas.decoding='async';
  atlas.onload=()=>{loaded=atlas.naturalWidth===512&&atlas.naturalHeight===512;resolve(loaded)};
  atlas.onerror=()=>resolve(false);
  atlas.src=new URL('./combat-fx196.webp',import.meta.url).href;
});
export function fxReady(key){return loaded&&index.has(key)}
const clampAlpha = value => Math.max(0,Math.min(1,Number.isFinite(value)?value:1));
export function fx(c,key,x,y,w,h=w,angle=0,alpha=1){
  if(!fxReady(key)||!(w>0)||!(h>0))return false;
  const i=index.get(key),size=Math.min(w,h);
  c.save();c.translate(x,y);if(angle)c.rotate(angle);
  c.globalAlpha*=clampAlpha(alpha);
  c.drawImage(atlas,(i%COLS)*CELL,Math.floor(i/COLS)*CELL,CELL,CELL,-size/2,-size/2,size,size);
  c.restore();return true;
}
// Legacy callers requesting an image receive a single cell, never the whole sheet.
const cellCache=new Map(),tintCache=new Map();
export function fxImage(key){
  if(!fxReady(key)||typeof document==='undefined')return null;
  if(cellCache.has(key))return cellCache.get(key);
  const cv=document.createElement('canvas');cv.width=cv.height=CELL;
  const i=index.get(key),g=cv.getContext('2d');
  if(!g)return null;
  g.drawImage(atlas,(i%COLS)*CELL,Math.floor(i/COLS)*CELL,CELL,CELL,0,0,CELL,CELL);
  Object.defineProperties(cv,{naturalWidth:{value:CELL},naturalHeight:{value:CELL}});
  cellCache.set(key,cv);return cv;
}
export function fxTintedCanvas(key,color){
  const im=fxImage(key);if(!im)return null;
  const id=key+'|'+color;
  if(tintCache.has(id))return tintCache.get(id);
  const cv=document.createElement('canvas');cv.width=cv.height=CELL;
  const c=cv.getContext('2d');if(!c)return null;
  c.drawImage(im,0,0);c.globalCompositeOperation='multiply';c.fillStyle=color;c.fillRect(0,0,CELL,CELL);
  c.globalCompositeOperation='destination-in';c.drawImage(im,0,0);
  if(tintCache.size>=32)tintCache.delete(tintCache.keys().next().value);
  tintCache.set(id,cv);return cv;
}
export function fxTint(c,key,color,x,y,w,h=w,angle=0,alpha=1){
  const im=fxTintedCanvas(key,color);if(!im)return fx(c,key,x,y,w,h,angle,alpha);
  const size=Math.min(w,h);if(!(size>0))return false;
  c.save();c.translate(x,y);if(angle)c.rotate(angle);c.globalAlpha*=clampAlpha(alpha);
  c.drawImage(im,-size/2,-size/2,size,size);c.restore();return true;
}

import {NAVAL_FACTION_ATLASES,NAVAL_FACTION_FRAMES} from './naval-faction-atlas.js?v=tame3';
const images=new Map(),pending=new Map();
export function factionHullFrame(faction,kind,state=0){return NAVAL_FACTION_FRAMES[faction==='entente'?'entente':'central']?.[kind]?.[Math.max(0,Math.min(2,state))];}
function load(key){if(images.has(key))return images.get(key);const im=new Image();im.crossOrigin='anonymous';im.decoding='async';images.set(key,im);pending.set(key,new Promise((resolve,reject)=>{im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Naval hull asset '+key));}));im.src='./'+NAVAL_FACTION_ATLASES[key]+'?v=r5';return im;}
export function prepareFactionHulls(){for(const key of Object.keys(NAVAL_FACTION_ATLASES))load(key);return Promise.all([...pending.values()]);}
// 20261111 hull cache. Every ship used to resample its hull out of a 1086x1448 atlas on every
// frame. The hull at its drawn size is now baked once per class/state/size (a few small
// canvases) and each frame blits that. Same picture, a fraction of the work per ship.
const hulls=new Map();
function bakedHull(im,frame,width,height,scale){
 if(typeof document==='undefined')return null;
 const w=Math.max(4,Math.ceil(width*scale/4)*4),h=Math.max(4,Math.ceil(height*scale/8)*8),id=frame.key+'|'+frame.rect.join(',')+'|'+w+'x'+h;
 let cv=hulls.get(id);if(cv)return cv;
 cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext?.('2d');if(!g)return null;
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(im,...frame.rect,0,0,w,h);
 if(hulls.size>=32)hulls.delete(hulls.keys().next().value);
 hulls.set(id,cv);return cv;
}
export function drawFactionHull(c,faction,kind,state,x,y,width,height,angle=0){const frame=factionHullFrame(faction,kind,state);if(!frame)return false;const im=load(frame.key);if(!im.naturalWidth)return false;
 const t=c.getTransform?.(),scale=t?Math.min(3,Math.max(.5,Math.round(Math.hypot(t.a,t.b)*4)/4)):1,baked=bakedHull(im,frame,width,height,scale);
 c.save();c.translate(x,y);c.rotate(angle);c.imageSmoothingEnabled=true;
 if(baked)c.drawImage(baked,-width/2,-height/2,width,height);else c.drawImage(im,...frame.rect,-width/2,-height/2,width,height);
 c.restore();return true;}

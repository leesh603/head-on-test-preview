import {NAVAL_FACTION_ATLASES,NAVAL_FACTION_FRAMES} from './naval-faction-atlas.js?v=ui5';
const images=new Map(),pending=new Map();
export function factionHullFrame(faction,kind,state=0){return NAVAL_FACTION_FRAMES[faction==='entente'?'entente':'central']?.[kind]?.[Math.max(0,Math.min(2,state))];}
function load(key){if(images.has(key))return images.get(key);const im=new Image();im.crossOrigin='anonymous';im.decoding='async';images.set(key,im);pending.set(key,new Promise((resolve,reject)=>{im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Naval hull asset '+key));}));im.src='./'+NAVAL_FACTION_ATLASES[key]+'?v=ui5';return im;}
export function prepareFactionHulls(){for(const key of Object.keys(NAVAL_FACTION_ATLASES))load(key);return Promise.all([...pending.values()]);}
export function drawFactionHull(c,faction,kind,state,x,y,width,height,angle=0){const frame=factionHullFrame(faction,kind,state);if(!frame)return false;const im=load(frame.key);if(!im.naturalWidth)return false;c.save();c.translate(x,y);c.rotate(angle);c.imageSmoothingEnabled=true;c.drawImage(im,...frame.rect,-width/2,-height/2,width,height);c.restore();return true;}

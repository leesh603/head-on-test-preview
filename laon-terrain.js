import {applyTerrainAtmosphere} from './alps-terrain117.js?v=gal1&phoneperf=20261103';
// Authored Laon woodland emplacement, anchored to the actual gun foundation.
// This renderer owns scenery only: no RNG, camera, collision or mission clock.
export const LAON_GROUND=Object.freeze({size:1536,sourceWidth:1254,sourceHeight:1254,foundationX:625,foundationY:820});
export const LAON_TERRAIN_ASSETS=Object.freeze({map:'./terrain-laon1918.webp?art=combat-scale-20261109',forest:'./asset-bank/terrain/argonne_forest.webp'});
let images={},loading=null,source=null,patch=null,forestSource=null,patterns=new WeakMap();
const ready=im=>im?.complete&&im.naturalWidth>0;
export function releaseLaonTerrain(){images={};loading=null;source=null;patch=null;forestSource=null;patterns=new WeakMap();}
export function prepareLaonTerrain(){
 if(loading)return loading;
 if(typeof Image==='undefined')return Promise.resolve(false);
 loading=Promise.all(Object.entries(LAON_TERRAIN_ASSETS).map(([key,url])=>new Promise(resolve=>{
  const im=new Image();images[key]=im;im.decoding='async';
  im.onload=()=>{(im.decode?im.decode():Promise.resolve()).catch(()=>{}).then(()=>resolve(!!im.naturalWidth));};
  im.onerror=()=>resolve(false);im.src=url;
 }))).then(results=>results.every(Boolean));return loading;
}
function artwork(im){
 if(source===im)return patch;
 const cv=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(im.naturalWidth,im.naturalHeight):globalThis.document?.createElement?.('canvas');
 if(!cv)return im;
 cv.width=im.naturalWidth;cv.height=im.naturalHeight;
 const q=cv.getContext('2d');q.filter='saturate(.74) contrast(.87)';q.drawImage(im,0,0);q.filter='none';q.globalCompositeOperation='destination-in';
 // Blend the full width of the bordering woodland, leaving the gun, revetments
 // and their service road at full opacity around the actual foundation.
 for(const [x,y] of [[cv.width,0],[0,cv.height]]){
  const fade=q.createLinearGradient(0,0,x,y);for(const [offset,alpha] of [[0,0],[.03,.07],[.08,.48],[.16,1],[.86,1],[.94,.42],[.98,.06],[1,0]])fade.addColorStop(offset,'rgba(0,0,0,'+alpha+')');q.fillStyle=fade;q.fillRect(0,0,cv.width,cv.height);
 }
 q.globalCompositeOperation='source-over';source=im;patch=cv;return patch;
}
export function paintLaonTerrain(c,g,cx,cy,width,height,art=images){
 const origin=g?.laonBattle?.origin||g?.laonMission?.gun||g?.laonBattle?.gun;
 if(!origin||![art.map,art.forest].every(ready)||typeof c.createPattern!=='function')return false;
 const a=LAON_GROUND,left=cx-width/2-origin.x,top=cy-height/2-origin.y,patchLeft=-a.foundationX/a.sourceWidth*a.size,patchTop=-a.foundationY/a.sourceHeight*a.size;
 if(forestSource!==art.forest){forestSource=art.forest;patterns=new WeakMap();}
 if(!patterns.has(c)){const p=c.createPattern(art.forest,'repeat');p.setTransform({a:a.size/art.forest.naturalWidth,b:0,c:0,d:a.size/art.forest.naturalHeight,e:patchLeft+a.size*.31,f:patchTop+a.size*.24});patterns.set(c,p);}
 c.save();c.beginPath();c.rect(0,0,width,height);c.clip();c.translate(-left,-top);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
 c.fillStyle=patterns.get(c);c.fillRect(left,top,width,height);
 // One railhead, one artillery clearing. Outside it only forest repeats.
 if(left<patchLeft+a.size&&left+width>patchLeft&&top<patchTop+a.size&&top+height>patchTop)c.drawImage(artwork(art.map),patchLeft,patchTop,a.size,a.size);
 c.restore();applyTerrainAtmosphere(c,'rural',width,height);return true;
}

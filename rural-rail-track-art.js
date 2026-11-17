// Native alpha artwork, registered to the existing 92px rail gauge.
import {warmRaster} from './raster-warm.js';
export const RURAL_TRACK_ART=Object.freeze({url:'./rail-track-states-20261110.webp',cellWidth:512,height:1024,scale:92/194,
 centers:[257,254,254],gauges:[192,196,192]});
let image,terminal,pending,generation=0,held=false,lastRegion=0;
function prepareTrackTerminal(im){
 const {cellWidth,height}=RURAL_TRACK_ART;
 const cv=typeof OffscreenCanvas==='function'?new OffscreenCanvas(cellWidth,height):globalThis.document?.createElement('canvas');
 if(!cv)return null;
 cv.width=cellWidth;cv.height=height;
 const c=cv.getContext('2d');if(!c)return null;
 c.drawImage(im,0,0,cellWidth,height,0,0,cellWidth,height);
 c.globalCompositeOperation='destination-in';
 const blend=c.createLinearGradient(0,height*.58,0,height);
 blend.addColorStop(0,'#fff');blend.addColorStop(1,'transparent');
 c.fillStyle=blend;c.fillRect(0,0,cellWidth,height);
 return cv;
}
export function holdRuralTrackArt(active){held=active;if(!active&&lastRegion!==0)prepareRuralTrackArt(lastRegion);}
export function prepareRuralTrackArt(region){
 lastRegion=region;
 if(region!==0){if(region<0)held=false;if(!held){generation++;image=null;terminal=null;pending=null;return Promise.resolve();}}
 if(pending)return pending;
 const current=generation,im=new Image();im.decoding='async';
 pending=new Promise(resolve=>{
  im.onload=()=>{Promise.resolve(im.decode?.()).catch(()=>{}).then(()=>{if(current===generation){image=im;terminal=prepareTrackTerminal(im);warmRaster(im);}resolve();});};
  im.onerror=()=>resolve();im.src=RURAL_TRACK_ART.url;
 });return pending;
}
export const ruralTrackArtReady=()=>!!image?.naturalWidth;
export function drawRuralTrackTile(c,state,y,end=false){
 const art=RURAL_TRACK_ART,k=92/art.gauges[state],height=art.height*art.scale;
 c.drawImage(end&&terminal?terminal:image,end&&terminal?0:state*art.cellWidth,0,art.cellWidth,art.height,-art.centers[state]*k,y,art.cellWidth*k,height);
}

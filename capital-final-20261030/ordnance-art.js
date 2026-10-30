// Approved body/flight artwork only. Collision and impact FX stay in their existing systems.
import {ORDNANCE_FRAMES} from './ordnance-atlas.js?v=capital-final-20261030';
const kinds={moteurBody:'moteur',cowBody:'cow',shellBody:'shell',cannonMotor:'moteur',cannonCow:'cow',shellAuto:'moteur',shell:'shell',shellHeavy:'shell',mortarShell:'shell',bomb:'bomb',bombBody:'bomb',grenade:'grenade',grenadeBody:'grenade',grenadeFlight:'grenade'};
const image=typeof Image==='undefined'?null:new Image();let ready=false;
export const ordnanceArtReady=new Promise(resolve=>{if(!image){resolve(false);return;}image.decoding='async';image.onload=()=>{ready=true;resolve(true)};image.onerror=()=>resolve(false);image.src=new URL('https://head-on-aces.justzeon.chatgpt.site/fx-ordnance-body-flight-q92.webp?v=capital-final-20261030',import.meta.url).href;});
export function ordnanceReady(key){return ready&&!!kinds[key];}
// Keep the authored grenade wake, but let it follow the throw independently
// of the spinning metal body. Crop before the body; no replacement bitmap.
export function drawOrdnanceFlightTrail(c,key,x,y,w,h=w,angle=0,alpha=1){
 if(key!=='grenadeFlight'||!ordnanceReady(key)||!(w>0)||!(h>0))return false;
 const f=ORDNANCE_FRAMES.grenade,rect=f.flight,scale=Math.min(w/f.body[2],h/f.body[3]);
 const tailWidth=Math.max(0,Math.floor(f.anchor[0]-f.body[2]/2));
 c.save();c.translate(x,y);if(angle)c.rotate(angle);c.globalAlpha*=Math.max(0,Math.min(1,alpha));c.imageSmoothingEnabled=true;
 c.drawImage(image,rect[0],rect[1],tailWidth,rect[3],-f.anchor[0]*scale,-f.anchor[1]*scale,tailWidth*scale,rect[3]*scale);c.restore();return true;
}
export function drawOrdnance(c,key,x,y,w,h=w,angle=0,alpha=1){
 if(!ordnanceReady(key)||!(w>0)||!(h>0))return false;
 const f=ORDNANCE_FRAMES[kinds[key]],flight=key!=='grenade'&&!key.endsWith('Body'),rect=flight?f.flight:f.body,anchor=flight?f.anchor:[f.body[2]/2,f.body[3]/2];
 const scale=Math.min(w/f.body[2],h/f.body[3]);
 c.save();c.translate(x,y);if(angle)c.rotate(angle);c.globalAlpha*=Math.max(0,Math.min(1,alpha));c.imageSmoothingEnabled=true;
 c.drawImage(image,...rect,-anchor[0]*scale,-anchor[1]*scale,rect[2]*scale,rect[3]*scale);c.restore();return true;
}

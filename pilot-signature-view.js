import {fx} from './fx-art.js?v=536';
import {drawGameIcon} from './icons.js?v=536';
import {createPilotSignatureRenderer} from './pilot-signature-renderer.js';
// Ferrari's original prancing-horse vector is used only as a small Baracca marking.
// Source: simple-icons/simple-icons, icons/ferrari.svg (the horse only, without a shield or text).
const files={blackHeart:'pilot-mark-nungesser.webp',repairSupply:'repair-pickup.webp',baraccaHorse:'pilot-mark-baracca-ferrari.svg',skull:'pilot-mark-brumowski-skull.webp'};
const images=new Map();
export const pilotSignatureArtReady=Promise.all(Object.entries(files).map(([key,file])=>new Promise(resolve=>{
 if(typeof Image==='undefined'){resolve(false);return}
 const im=new Image();images.set(key,im);im.onload=()=>resolve(true);im.onerror=()=>resolve(false);
 im.src=new URL('./'+file,import.meta.url).href;
})));
export function pilotSignatureInsigniaReady(key){const im=images.get(key);return !!(im?.complete&&im.naturalWidth)}
function insignia(c,key,x,y,size){
 const im=images.get(key);if(!pilotSignatureInsigniaReady(key))return false;
 const scale=size/Math.max(im.naturalWidth,im.naturalHeight);
 c.drawImage(im,x-im.naturalWidth*scale/2,y-im.naturalHeight*scale/2,im.naturalWidth*scale,im.naturalHeight*scale);return true;
}
export function createSignatureView(petal){return createPilotSignatureRenderer({fx,icon:drawGameIcon,petal,insignia})}
let foreground;
export function drawPilotSignatureFront(c,p,x,y){
 foreground??=createSignatureView(()=>{});
 return foreground(c,p,x,y,'front');
}


// Reuse the painted repair crate, with a physical descent and a compact landing spark.
export function drawMccuddenSupply(c,d,x,y){
 const im=images.get('repairSupply');if(!pilotSignatureInsigniaReady('repairSupply'))return false;
 const q=Math.max(0,Math.min(1,1-(d.fallTime||0)/.65)),height=1-q,size=34+height*9,scale=size/Math.max(im.naturalWidth,im.naturalHeight);
 c.save();c.translate(x,y);c.save();c.globalAlpha*=.16;c.translate(8+height*13,11+height*17);c.rotate(d.dropHeading||0);c.drawImage(im,-im.naturalWidth*scale/2,-im.naturalHeight*scale/2,im.naturalWidth*scale,im.naturalHeight*scale);c.restore();
 c.rotate((d.dropHeading||0)*height);c.drawImage(im,-im.naturalWidth*scale/2,-im.naturalHeight*scale/2,im.naturalWidth*scale,im.naturalHeight*scale);
 if(height>0){fx(c,'metalShard1',-8,7,7,5,q*2,.55*height);fx(c,'armorSpark',-12,0,20,13,0,.45*height)}c.restore();return true;
}

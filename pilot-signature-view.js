import {fx} from './fx-art.js?v=459';
import {drawGameIcon} from './icons.js?v=338';
import {createPilotSignatureRenderer} from './pilot-signature-renderer.js';
// Authored horse and checksum-verified archival Nungesser derivative.
const files={blackHeart:'pilot-mark-nungesser.webp'};
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

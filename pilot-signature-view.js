import {drawMaterialSupply} from './petal-supply-fx.js?v=headon-quality-20261023-7d8a4756';
import {fx,fxTint} from './fx-art.js?v=headon-quality-20261023-7d8a4756';
import {drawGameIcon} from './icons.js?v=headon-quality-20261023-7d8a4756&afc=1';
import {createPilotSignatureRenderer} from './pilot-signature-renderer.js?v=headon-quality-20261023-7d8a4756&sig=1019&boss=20261020b&phase=1021';

// Ferrari's original prancing-horse vector is used only as a small Baracca marking.
// Source: simple-icons/simple-icons, icons/ferrari.svg (the horse only, without a shield or text).
const files={blackHeart:'pilot-mark-nungesser-alpha2.webp',baraccaHorse:'pilot-mark-baracca-ferrari.svg',skull:'pilot-mark-brumowski-skull.webp'};
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
export function createSignatureView(petal){return createPilotSignatureRenderer({fx,tint:fxTint,icon:drawGameIcon,petal,insignia})}
let foreground;
export function drawPilotSignatureFront(c,p,x,y){
 foreground??=createSignatureView(()=>{});
 return foreground(c,p,x,y,'front');
}


// Actual engine drops, shared by solo and cooperative views.
export function drawMccuddenSupply(c,d,x,y){return drawMaterialSupply(c,d,x,y);}


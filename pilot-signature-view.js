import {planeSprite,aircraftKey} from './aircraft.js?v=arras-cargo-icons-4529781a-20261112';
import {drawInternalRepair} from './mccudden-internal-repair.js?v=quality-audit-596-c6ea4cf8-20261109';
import {drawMaterialSupply} from './petal-supply-fx.js?v=quality-audit-596-c6ea4cf8-20261109';
import {fx,fxTint} from './fx-art.js?v=quality-audit-596-c6ea4cf8-20261109';
import {drawProctorGunRecord} from './proctor-burst-fx.js?v=quality-audit-596-c6ea4cf8-20261109';
import {drawGameIcon} from './icons.js?v=equipment-icons-327a0f5a-20261112';
import {createPilotSignatureRenderer} from './pilot-signature-renderer.js?v=earned-rewards-7ccfad1b-20261114';

// Ferrari's original prancing-horse vector is used only as a small Baracca marking.
// Source: simple-icons/simple-icons, icons/ferrari.svg (the horse only, without a shield or text).
const files={blackHeart:'pilot-mark-nungesser-alpha2.webp',baraccaHorse:'pilot-mark-baracca-ferrari.svg',skull:'pilot-mark-brumowski-skull-512.webp'};
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
const proctorTexture=(c,key,x,y,w,h,a,alpha,color)=>fxTint(c,key,color,x,y,w,h,a,alpha);
export function drawPilotSignatureFront(c,p,x,y){
 foreground??=createSignatureView(()=>{});
 const drawn=foreground(c,p,x,y,'front');
 if(p.pilot==='mccudden')drawInternalRepair(c,p,x,y,planeSprite,aircraftKey(p.plane,false,p.pilot),fx);
 if(p.pilot==='proctor')for(const f of p.pilotIdentity?.fx||[])drawProctorGunRecord(c,p,f,proctorTexture,x,y);
 return drawn;
}


// Actual engine drops, shared by solo and cooperative views.
export function drawMccuddenSupply(c,d,x,y){return drawMaterialSupply(c,d,x,y);}



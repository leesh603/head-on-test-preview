// A recovered belt is shown only after the authoritative transfer returned rounds.
// Existing painted equipment material; no new ammo, timing, random state or target.
import {EXTENSION_ATLAS,EXTENSION_FRAMES} from './equipment-extension-art-data.js';
let art;
export const lotharTransferArtReady=new Promise(resolve=>{
 if(typeof Image==='undefined'){resolve(false);return;}
 const im=new Image();im.onload=()=>{const ok=im.naturalWidth===EXTENSION_ATLAS.width&&im.naturalHeight===EXTENSION_ATLAS.height;if(ok)art=im;resolve(ok);};im.onerror=()=>resolve(false);im.src=new URL('./equipment-extension-atlas.webp',import.meta.url).href;
});
export function drawLotharRecoveredBelt(c,p,e){
 if(!art||p.pilot!=='lothar'||!(p.hp>0)||p.status==='downed'||p.reloadTime>0||!(e.ammoRecovered>0)||!(e.life>0)||!Number.isFinite(e.age)||e.age<0||!(e.maxLife>0))return false;
 const q=Math.min(1,e.age/e.maxLife),f=EXTENSION_FRAMES['belt'+Math.min(2,Math.floor(q*3))],scale=(26-8*q)/f.visualHeight;
 // Beside the real forward gun body: the loose end shortens into its feed port.
 c.save();c.translate(12+q*4,9+7*(1-q));c.rotate(-.2+.2*q);c.globalAlpha*=Math.min(1,e.life/.16);
 c.drawImage(art,f.x,f.y,f.w,f.h,-f.pivotX*scale,-f.pivotY*scale,f.w*scale,f.h*scale);c.restore();return true;
}

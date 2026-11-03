// Painted equipment marks and bailout cloth; no procedural substitute on load failure.
import {FINISHING_ATLAS,FINISHING_FRAMES} from './equipment-finishing-art-data.js';
let atlas=null;
export const equipmentFinishingArtReady=new Promise(resolve=>{
 if(typeof Image==='undefined'){resolve(false);return;}
 const im=new Image();im.decoding='async';im.onload=()=>{const valid=im.naturalWidth===FINISHING_ATLAS.width&&im.naturalHeight===FINISHING_ATLAS.height;if(valid)atlas=im;im.onload=im.onerror=null;resolve(valid);};im.onerror=()=>{im.onload=im.onerror=null;resolve(false);};im.src=new URL('./equipment-finishing-atlas.webp',import.meta.url).href;
});
function sprite(c,key,fit=1){
 const f=FINISHING_FRAMES[key];if(!atlas||!f)return;
 const s=f.worldHeight/f.visualHeight*fit;
 c.imageSmoothingEnabled=true;c.drawImage(atlas,f.x,f.y,f.w,f.h,-f.pivotX*s,-f.pivotY*s,f.w*s,f.h*s);
}
export function drawEquipmentDecals(c,p){
 if(!(p?.hp>0)||p.status==='downed'||p.heineckeEscape>0||p.bomberTransfer)return;
 if(p.upgrades?.loEmblem){c.save();c.translate(12,10);c.rotate(Math.PI/2);sprite(c,'lo',14/18);c.restore();}
 if(p.upgrades?.sacredCowling){c.save();c.translate(20,0);c.rotate(Math.PI/2);sprite(c,'cowling',.5);c.restore();}
}
export function drawHeineckeCloth(c,open,pop){
 if(open>0)sprite(c,'canopy'+Math.min(2,Math.floor(open*3)));
 if(pop>0)sprite(c,'pilot');
}

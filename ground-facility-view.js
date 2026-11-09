import {FACILITY_ART} from './ground-facility-profiles.js';
import {configureFacilityArtReady,facilityStageKey} from './ground-facility-missions.js';
const images=new Map();
function load(file){if(typeof Image==='undefined')return null;if(images.has(file))return images.get(file);const im=new Image();im.decoding='async';im.src='./'+file;images.set(file,im);return im;}
configureFacilityArtReady(file=>{const im=load(file);load('asset-bank/ground-facilities/rubble.webp');return !!im?.naturalWidth;});
export function drawGroundFacilities(c,g,{point=(x,y)=>[x,y]}={}){
 const state=g?.groundFacilities;if(!state||state.stageKey!==facilityStageKey(g))return;
 for(const site of state.sites)for(const e of site.targets){
  const spec=FACILITY_ART[e.facilityArt],im=spec&&load(spec.file);if(!im?.naturalWidth)continue;
  const [x,y]=point(e.x,e.y),w=e.width,h=e.height;c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
  if(spec.source)c.drawImage(im,...spec.source,x-w/2,y-h/2,w,h);else c.drawImage(im,x-w/2,y-h/2,w,h);
  if(spec.flag){const flag=load(spec.flag);if(flag?.naturalWidth)c.drawImage(flag,x+w/2-10,y-h/2,10,12.5);}
  if(e.destroyed){
   const rubble=load('asset-bank/ground-facilities/rubble.webp');
   if(rubble?.naturalWidth){const r=spec.rubble||[65,142,1666,603];c.drawImage(rubble,...r,x+e.hitOffsetX-e.hitWidth*.57,y+e.hitOffsetY-e.hitHeight*.57,e.hitWidth*1.14,e.hitHeight*1.14);}
  }else if(e.missionTarget){
   const hx=x+e.hitOffsetX,hy=y+e.hitOffsetY,hw=e.hitWidth/2+4,hh=e.hitHeight/2+4;
   // HUD target brackets, not replacement artwork. Ground render stays world-fixed.
   c.strokeStyle=e.hitFlash>0?'#fff1c0':'#e8c787';c.lineWidth=1.4;c.beginPath();
   for(const [sx,sy]of [[-1,-1],[1,-1],[-1,1],[1,1]]){c.moveTo(hx+sx*(hw-7),hy+sy*hh);c.lineTo(hx+sx*hw,hy+sy*hh);c.lineTo(hx+sx*hw,hy+sy*(hh-7));}c.stroke();
   c.fillStyle='#1a251ed9';c.fillRect(hx-22,hy+hh+5,44,3);c.fillStyle='#e8c787';c.fillRect(hx-22,hy+hh+5,44*Math.max(0,e.hp/e.maxHp),3);
  }
  c.restore();
 }
}

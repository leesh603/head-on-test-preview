import {FACILITY_ART} from './ground-facility-profiles.js?v=d7a0cfcfc455802b';
import {configureFacilityArtReady,facilityStageKey} from './ground-facility-missions.js?v=d7a0cfcfc455802b';
const images=new Map();
const meadowShadows=new WeakMap();
function load(file){if(typeof Image==='undefined')return null;if(images.has(file))return images.get(file);const im=new Image();im.decoding='async';im.src='./'+file;images.set(file,im);return im;}
configureFacilityArtReady(file=>{const im=load(file);load('asset-bank/ground-facilities/rubble.webp');return !!im?.naturalWidth;});
function meadowFacilityShadow(c,im,x,y,w,h){
 let shadow=meadowShadows.get(im);
 if(!shadow){
  shadow=document.createElement('canvas');
  shadow.width=104;shadow.height=Math.round(im.naturalHeight*96/im.naturalWidth)+8;
  const ink=shadow.getContext('2d');
  ink.filter='blur(1px)';ink.drawImage(im,4,4,96,shadow.height-8);ink.filter='none';
  ink.globalCompositeOperation='source-in';ink.fillStyle='#272015a0';ink.fillRect(0,0,shadow.width,shadow.height);
  meadowShadows.set(im,shadow);
 }
 const pad=w/24;
 c.drawImage(shadow,x-w/2-pad+4,y-h/2-pad+6,w+pad*2,h+pad*2);
}
export function drawGroundFacilities(c,g,{point=(x,y)=>[x,y]}={}){
 const state=g?.groundFacilities;if(!state||state.stageKey!==facilityStageKey(g))return;
 for(const site of state.sites)for(const e of site.targets){
  const spec=FACILITY_ART[e.facilityArt],im=spec&&load(spec.file);if(!im?.naturalWidth)continue;
  const [x,y]=point(e.x,e.y),w=e.width,h=e.height;c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
  if(state.region===0&&!spec.source&&e.facilityArt.startsWith('rural-airfield-'))meadowFacilityShadow(c,im,x,y,w,h);
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

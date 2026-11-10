import {applySeaColor} from './sea-colors.js?v=b3bf991d11fc7798';
import {fleetGunStations} from './naval-faction-atlas.js?v=b3bf991d11fc7798';
import {drawFactionHull,prepareFactionHulls} from './naval-faction-art.js?v=b3bf991d11fc7798';
import {drawShipWater,drawTorpedo,drawFactionMark} from './naval-water.js?v=b3bf991d11fc7798';
import {drawSinkingShip} from './ship-sinking.js?v=b3bf991d11fc7798';
import {fx} from './fx-art.js?v=b3bf991d11fc7798';
import {impactMark,partMark,aimLine} from './tactical-marks.js?v=b3bf991d11fc7798';
import {periodicSandPixels,maanGroundTiles} from './maan-ground.js?v=b3bf991d11fc7798';
import {jutlandMuzzle,jutlandRotate} from './jutland-boss.js?v=b3bf991d11fc7798';
import {JUTLAND_RECTS} from './jutland-atlas.js?v=b3bf991d11fc7798';
import {drawJutlandGun} from './jutland-gun-art.js?v=b3bf991d11fc7798';
import {drawShellFlight} from './boss-rounds.js?v=b3bf991d11fc7798';
export const JUTLAND_ASSETS=Object.freeze({sea:'jutland-sea.webp',flagship:'jutland-flagship.webp',parts:'jutland-parts.webp'});
const images=new Map(),pending=new Map();
let water=null,regionReady=null;
function load(key){
 if(images.has(key))return images.get(key);
 const im=new Image();
 images.set(key,im);im.crossOrigin='anonymous';im.decoding='async';
 const ready=new Promise(resolve=>{
  im.onload=()=>{(im.decode?im.decode():Promise.resolve()).catch(()=>{}).then(()=>resolve(im));};
  im.onerror=()=>resolve(null);
 });
 pending.set(key,ready);
 im.src='./'+JUTLAND_ASSETS[key]+'?v=r5';
 return im;
}
export function prepareJutlandAssets(region){
 if(region!==16){
  images.delete('sea');images.delete('flagship');
  pending.delete('sea');pending.delete('flagship');
  water=null;regionReady=null;
  return Promise.resolve();
 }
 if(regionReady)return regionReady;
 const sea=load('sea');
 load('flagship');load('parts');
 regionReady=Promise.all([...pending.values()]).then(()=>{
  if(images.get('sea')!==sea||!sea.naturalWidth)return;
  const cv=document.createElement('canvas');cv.width=sea.naturalWidth;cv.height=sea.naturalHeight;
  const c=cv.getContext('2d',{willReadFrequently:true});c.drawImage(sea,0,0);
  const p=periodicSandPixels(c.getImageData(0,0,cv.width,cv.height).data,cv.width,cv.height);
  water=document.createElement('canvas');water.width=p.width+2;water.height=p.height+2;
  const tc=water.getContext('2d'),data=tc.createImageData(p.width,p.height);
  data.data.set(p.data);tc.putImageData(data,1,1);
  applySeaColor(tc,'jutland',water.width,water.height);
  tc.drawImage(water,p.width,1,1,p.height,0,1,1,p.height);
  tc.drawImage(water,1,1,1,p.height,p.width+1,1,1,p.height);
  tc.drawImage(water,0,p.height,p.width+2,1,0,0,p.width+2,1);
  tc.drawImage(water,0,1,p.width+2,1,0,p.height+1,p.width+2,1);
 });
 return regionReady;
}
function sprite(c,key,state,x,y,height,angle=0,row=0,pivot=.5){
 const im=load(key);if(!im.naturalWidth)return false;
 const rect=JUTLAND_RECTS[key]?.[key==='parts'?row*3+state:state]||[0,0,im.naturalWidth,im.naturalHeight],width=height*rect[2]/rect[3];
 c.save();c.translate(x,y);c.rotate(angle);c.imageSmoothingEnabled=true;
 c.drawImage(im,...rect,-width/2,-height*pivot,width,height);c.restore();
 return true;
}
export function paintJutland(c,g,cx,cy,w,h){
 c.fillStyle='#263e4b';c.fillRect(0,0,w,h);
 if(water)for(const q of maanGroundTiles(cx,cy,w,h,water.width-2,water.height-2))c.drawImage(water,q.x-1,q.y-1,water.width,water.height);
}
export function jutlandBodyVisible(b,view){
 if(!view)return true;
 const radius=Math.hypot(b.width,b.height)/2+360;
 return hazardPointVisible(view,b.x,b.y,radius);
}
export function drawJutlandBody(c,b,deathAge=0,view=null){
 if(!jutlandBodyVisible(b,view))return;
 if(b.dead&&!b.sinkRendered)return drawSinkingShip(c,{key:b,x:b.x,y:b.y,yaw:b.hullYaw||0,width:b.width,height:b.height,age:deathAge,duration:4.4},k=>drawJutlandBody(k,{...b,sinkRendered:true},deathAge));
 const yaw=b.hullYaw||0,damaged=b.hp<b.maxHp*.45;
 c.save();
 drawShipWater(c,b,b.width,b.height);
 if(!sprite(c,'flagship',0,b.x,b.y,b.height,yaw))drawFactionHull(c,b.faction,b.role,b.dead?2:damaged?1:0,b.x,b.y,b.width,b.height,yaw);
 const mark=jutlandRotate(0,-b.height*.405,yaw);
 drawFactionMark(c,b.faction,b.x+mark.x,b.y+mark.y,b.width*.135,yaw);
 for(const p of b.parts.values()){
  const state=b.dead||p.destroyed?2:p.hp<p.maxHp*.55?1:0,x=b.x+p.x,y=b.y+p.y;
  if(!hazardPointVisible(view,x,y,230))continue;
  if(p.kind==='director'){
   const rect=JUTLAND_RECTS.parts[9];
   sprite(c,'parts',state,x,y,98*rect[3]/rect[2],yaw,3);
  }else drawJutlandGun(c,load('parts'),p,state,x,y);
  if(b.dead)continue;
  if(p.destroyed){fx(c,'smokeDark',x,y,75,104,0,.45);continue;}
  if(p.kind==='gun'&&p.recoil>0){
   const m=jutlandMuzzle(b,p),age=.22-p.recoil,angle=p.angle+Math.PI/2;
   if(age<.08)fx(c,'muzzle',m.x,m.y,62,108,angle,1-age/.08);
   fx(c,'smokePuff',m.x+Math.cos(p.angle)*age*85,m.y+Math.sin(p.angle)*age*85,74,96,angle,p.recoil/.22*.65);
  }
  if(p.kind==='director')partMark(c,x,y,p.radius,p.radius,{alpha:.75});
  c.fillStyle='#101e24';c.fillRect(x-24,y+p.radius+9,48,4);
  c.fillStyle='#d6b57e';c.fillRect(x-24,y+p.radius+9,48*p.hp/p.maxHp,4);
 }
 if(!b.dead){
  const stack=jutlandRotate(0,b.height*.13,yaw);
  fx(c,'smokeDark',b.x+stack.x+22,b.y+stack.y-40,118,153,.2,damaged?.42:.23);
  for(const lane of b.pending?.lanes||[]){
   const p=b.parts.get(lane.id);if(lane.fired||!p||p.destroyed)continue;
   const muzzle=jutlandMuzzle(b,p);
   if(!hazardPointVisible(view,(muzzle.x+lane.x)/2,(muzzle.y+lane.y)/2,Math.hypot(lane.x-muzzle.x,lane.y-muzzle.y)/2+16))continue;
   aimLine(c,muzzle.x,muzzle.y,lane.x,lane.y,{heavy:lane.id==='aft',alpha:.62,chevron:false});
  }
 }
 c.restore();
}
function hazardPointVisible(view,x,y,padding){return !view||Math.abs(x-view.x)<=view.width/2+padding&&Math.abs(y-view.y)<=view.height/2+padding;}
export function drawJutlandHazard(c,h,view=null){
 if(!h.visual.startsWith('jutland-'))return false;
 const warning=h.phase==='warning';
 // Tracks and torpedoes keep their existing long, rotated water dressing.
 if(h.visual==='jutland-track'){c.save();if(warning)aimLine(c,h.x,h.y,h.x+Math.cos(h.angle)*h.length,h.y+Math.sin(h.angle)*h.length,{p:Math.min(1,(h.age-h.delay)/Math.max(.01,h.warning)),dash:[12,10],tone:'water'});c.restore();return true;}
 if(h.visual==='jutland-torpedo'){c.save();if(!warning)drawTorpedo(c,h);c.restore();return true;}
 if(warning){
  const q=Math.max(0,Math.min(1,(h.age-h.delay)/Math.max(.01,h.warning))),impactVisible=hazardPointVisible(view,h.x,h.y,h.radius*1.28+8);
  // A distant target can still have a shell crossing the current viewport.
  // Match drawShellFlight's current point, including its optional mortar arc.
  const lobbed=h.ordnanceFamily==='mortar'||h.ordnanceFamily==='rifle-grenade';
  const flightVisible=h.visual==='jutland-shell'&&(!view||h.sourceX!=null&&q>0&&hazardPointVisible(view,h.sourceX+(h.x-h.sourceX)*q,h.sourceY+(h.y-h.sourceY)*q-(lobbed?Math.sin(q*Math.PI)*80:0),64));
  if(!impactVisible&&!flightVisible)return true;
  c.save();if(impactVisible)impactMark(c,h.x,h.y,h.radius,q,{heavy:h.raidHeavy});if(flightVisible)drawShellFlight(c,h,q);c.restore();
 }else if(hazardPointVisible(view,h.x,h.y,h.radius*1.4+36)){
  c.save();fx(c,'foamRing',h.x,h.y,h.radius*2.5,h.radius*2.5,0,.85);fx(c,'waterColumn',h.x,h.y-28,h.radius*1.4,h.radius*2.8,0,.75);c.restore();
 }
 return true;
}
export function drawJutlandGuide(c,b,g,w,h,z=1){if(b.dead)return;const sx=(b.x-g.x)*z+w/2,sy=(b.y-g.y)*z+h/2;if(sx>35&&sx<w-35&&sy>190&&sy<h-115)return;const x=Math.max(28,Math.min(w-28,sx)),y=Math.max(195,Math.min(h-120,sy));c.save();c.translate(x,y);c.rotate(Math.atan2(b.y-g.y,b.x-g.x));c.fillStyle='#f0c584';c.beginPath();c.moveTo(12,0);c.lineTo(-7,-7);c.lineTo(-7,7);c.fill();c.restore();c.fillStyle='#dfd9c4';c.font='bold 11px sans-serif';c.textAlign='center';c.fillText('기함',x,Math.min(h-98,y+21));}

// Faction silhouettes and class-specific decks; rotating guns keep the boss material style.
export function drawFleetShip(c,e,height,gunPositions){const state=e.hp<=0?2:e.hp<e.maxHp*.55?1:0,yaw=e.a+Math.PI/2;const width=height*(e.shipClass==='aa'?.24:.20);drawFactionHull(c,e.faction,e.shipClass,state,0,0,width,height,yaw);
 for(const along of fleetGunStations(e.faction,e.shipClass,height)){const q=jutlandRotate(0,-along,yaw),angle=(e.gunAim??e.a)+Math.PI/2,size=height*(e.shipClass==='aa'?.085:.11),rect=JUTLAND_RECTS.parts[3+state];sprite(c,'parts',state,q.x,q.y,size*rect[3]/rect[2],angle,1,JUTLAND_RECTS.pivots[1]);}
 if(e.hp>0){const mark=jutlandRotate(0,-height*.40,yaw);drawFactionMark(c,e.faction,mark.x,mark.y,width*.19,yaw);}
 if(e.hp>0&&e.hp<e.maxHp*.55){const q=jutlandRotate(0,-height*.04,yaw);fx(c,'smokeDark',q.x+12,q.y-30,width*.95,height*.23,0,.35);}
}
export function prepareFleetShipArt(){load('parts');return prepareFactionHulls();}


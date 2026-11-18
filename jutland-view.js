import {applySeaColor} from './sea-colors.js?v=tame3';
import {fleetGunStations} from './naval-faction-atlas.js?v=tame3';
import {drawFactionHull,prepareFactionHulls} from './naval-faction-art.js?v=tame3&shipperf=20261112';
import {drawShipWater,drawTorpedo,drawFactionMark} from './naval-water.js?v=tame3&perf=1029&shipperf=20261112';
import {drawSinkingShip} from './ship-sinking.js?v=tame3';
import {fx} from './fx-art.js?v=tame3';
import {drawWaterContact} from './water-contact-art.js';
import {drawMaterialFrame,materialRows} from './combat-material-art.js';
import {impactMark,partMark,aimLine} from './tactical-marks.js?v=tame3';
import {periodicSandPixels,maanGroundTiles} from './maan-ground.js?v=tame3';
import {jutlandMuzzle,jutlandRotate} from './jutland-boss.js?v=tame3&ai=1018&sig=1019&boss=20261020b&phase=1021';
import {FLAGSHIP_WATERLINE,JUTLAND_RECTS} from './jutland-atlas.js?v=tame3';
import {drawJutlandGun} from './jutland-gun-art.js?v=20261023';
import {drawShellFlight} from './boss-rounds.js?v=tame3&ai=1018';
export const JUTLAND_ASSETS=Object.freeze({sea:'jutland-sea.webp',flagship:'jutland-flagship.webp',parts:'jutland-parts.webp'});
const images=new Map(),pending=new Map();
const hullTransforms=new WeakMap();
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
 if(!b.dead&&c.getTransform)hullTransforms.set(b,c.getTransform());
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
export function jutlandDeckAt(b,x,y){
 if(!b||b.dead||b.hidden)return false;
 const dx=x-b.x,dy=y-b.y;
 if(Math.abs(dx)>b.height*.53||Math.abs(dy)>b.height*.53)return false;
 const yaw=b.hullYaw||0,cs=Math.cos(yaw),sn=Math.sin(yaw),scale=1150/b.height;
 const row=Math.floor((dy*cs-dx*sn)*scale+575);
 if(row<0||row>=1150)return false;
 const col=Math.floor((dx*cs+dy*sn)*scale+165.5);
 // Narrow gaps between the rail fittings and the hull in the painted alpha.
 if(row===443&&(col>=24&&col<=31||col>=300&&col<=306)||
    row===444&&(col>=26&&col<=30||col>=301&&col<=303)||
    row===557&&col===18)return false;
 return col>=FLAGSHIP_WATERLINE[2*row]&&col<331-FLAGSHIP_WATERLINE[2*row+1];
}
// A pool slot is reused. Choose the material once per activation so a moving
// ship cannot turn an existing splash into sparks halfway through its decay.
const shellContacts=new WeakMap();
function hitsDeck(h,body){
 let contact=shellContacts.get(h);
 if(!contact||contact.generation!==h.generation){
  contact={generation:h.generation,deck:jutlandDeckAt(body,h.x,h.y)};
  shellContacts.set(h,contact);
 }
 return contact.deck;
}
function paintSeaImpact(c,h,progress){
 if(drawWaterContact(c,h.x,h.y,h.radius*2.8,progress))return;
 c.save();fx(c,'foamRing',h.x,h.y,h.radius*2.5,h.radius*2.5,0,.85);fx(c,'waterColumn',h.x,h.y-28,h.radius*1.4,h.radius*2.8,0,.75);c.restore();
}
function impactProgress(h){return Math.max(0,Math.min(1,(h.age-h.delay-h.warning)/Math.max(.01,h.duration)));}
let exterior;
function seaOutsideFlagship(){
 if(exterior)return exterior;
 const path=new Path2D();
 path.rect(-4096,-4096,8192,8192);
 // Maximal runs of identical left/right insets keep this reusable clip small.
 for(let start=0;start<1150;){
  const left=FLAGSHIP_WATERLINE[start*2],right=FLAGSHIP_WATERLINE[start*2+1];
  let end=start+1;
  while(end<1150&&FLAGSHIP_WATERLINE[end*2]===left&&FLAGSHIP_WATERLINE[end*2+1]===right)end++;
  if(left+right<331)path.rect(left,start,331-left-right,end-start);
  start=end;
 }
 for(const [x,y,w] of [[24,443,8],[300,443,7],[26,444,5],[301,444,3],[18,557,1]])path.rect(x,y,w,1);
 exterior=path;return path;
}
function paintSeaBesideHull(c,b,h,progress){
 const scale=b.height/1150,dx=h.x-b.x,dy=h.y-b.y,yaw=b.hullYaw||0;
 const cs=Math.cos(yaw),sn=Math.sin(yaw),reach=h.radius*1.4+36;
 if(b.dead||b.hidden||Math.abs(dx*cs+dy*sn)>165.5*scale+reach||Math.abs(dy*cs-dx*sn)>b.height/2+reach)
  return paintSeaImpact(c,h,progress);
 const overlay=c.getTransform();
 c.save();
 // The hull and HUD hazard passes can carry different camera shake. Place the
 // clip at the pose used for this actual hull, then paint at the warned point.
 c.setTransform(hullTransforms.get(b)||overlay);c.translate(b.x,b.y);c.rotate(yaw);
 c.scale(scale,scale);c.translate(-165.5,-575);c.clip(seaOutsideFlagship(),'evenodd');c.setTransform(overlay);
 paintSeaImpact(c,h,progress);c.restore();
}
export function drawJutlandHazard(c,h,view=null,body=null){
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
  const progress=impactProgress(h);
  if(progress>=1)return true;
  if(body&&h.visual==='jutland-shell'){
   if(!hitsDeck(h,body)){paintSeaBesideHull(c,body,h,progress);return true;}
   const frame=Math.min(3,Math.floor(progress*4)),angle=Math.atan2(h.y-h.sourceY,h.x-h.sourceX);
   const alpha=Math.min(1,(1-progress)*2.4),size=h.radius*(h.raidHeavy?1.38:1.2);
   if(!drawMaterialFrame(c,materialRows.metal,frame,h.x,h.y,size*1.6,size,angle,alpha))
    fx(c,'armorSpark',h.x,h.y,size,size*.8,angle,alpha);
  }else paintSeaImpact(c,h,progress);
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
export function prepareFleetShipArt(includeCapital=false,includeWeapons=false){
 const hulls=prepareFactionHulls(includeCapital);
 if(!includeWeapons||typeof Image==='undefined')return hulls;
 // The first visible ship uses the gun atlas as well as the hull atlas.
 load('parts');
 return Promise.all([hulls,pending.get('parts')]);
}


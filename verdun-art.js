import {drawVerdunGround,prepareVerdunGround,releaseVerdunGround} from './verdun-ground.js?v=tame3';
import {fx} from './fx-art.js?v=tame3';
import {drawTracerBolt} from './projectiles.js?v=tame3&rail=42';
import {impactMark} from './tactical-marks.js?v=tame3';
import {drawShellFlight} from './boss-rounds.js?v=tame3';
import {VERDUN_PART_FRAMES,VERDUN_BODY_GRID,VERDUN_GUN_FRAMES} from './verdun-art-layout.js?v=verdun-r9';
import {VERDUN_FORT_LAYOUT,VERDUN_FORT_ENLARGEMENT,verdunFortCollapseSites} from './verdun-fortresses.js?v=tame3&rail=42';

// Authored PNG/WebP atlas frames; no generated geometry or per-frame raster copy.
const sources={map:'./terrain-verdun-r8.webp?v=r5',douaumont:'./boss-douaumont-atlas-r9.webp',souville:'./boss-souville-atlas-r9.webp',douaumontParts:'./boss-douaumont-parts-r9.webp',souvilleParts:'./boss-souville-parts-r9.webp',weapons:'./boss-verdun-weapons-r9.webp'};
const images={},pending={};
function load(key){if(images[key])return images[key];const im=new Image();im.decoding='async';pending[key]=new Promise((resolve,reject)=>{im.onload=()=>{(im.decode?im.decode():Promise.resolve()).catch(()=>{}).finally(()=>resolve(im))};im.onerror=()=>reject(new Error('Missing Verdun asset: '+sources[key]));});im.src=sources[key];images[key]=im;return im;}
export function prepareVerdunAssets(){for(const key of Object.keys(sources))load(key);return Promise.all(Object.values(pending)).then(result=>{prepareVerdunGround(images.map);return result;});}
export function releaseVerdunAssets(){releaseVerdunGround();shadows.clear();foundations=new WeakMap();for(const k of Object.keys(images)){images[k].src='';delete images[k];delete pending[k];}}
export function paintVerdun(c,g,cx,cy,w,h){
 c.save();c.fillStyle='#55493a';c.fillRect(0,0,w,h);const im=load('map');if(!im?.naturalWidth){c.restore();return;}
 drawVerdunGround(c,im,cx,cy,w,h);c.restore();
}
// Every fixed foundation keeps one measured mounting center through damage.
function drawMount(c,im,type,state,x,y,w,h,sou=false){
 if(!im?.naturalWidth)return;
 const set=VERDUN_PART_FRAMES[sou?'souville':'douaumont'].mounts[type];
 if(!set)return;
 const frame=set.frames[state],[sx,sy,sw,sh]=frame.rect,[px,py]=frame.pivot;
 const kx=w/set.size[0],ky=h/set.size[1];
 c.save();c.translate(x,y);c.imageSmoothingEnabled=true;
 c.drawImage(im,sx,sy,sw,sh,-px*kx,-py*ky,sw*kx,sh*ky);c.restore();
}
function drawMountAlpha(c,im,type,state,p,gun,sou,alpha=1){
 if(alpha<=0)return;c.save();c.globalAlpha*=alpha;
 drawMount(c,im,type,state,p.x,p.y,p.drawWidth,gun?p.drawWidth*.76:p.drawHeight,sou);c.restore();
}
function drawWeapon(c,im,type,state,x,y,muzzle,angle,sou=false,recoil=0){
 im=load('weapons');
 if(!im?.naturalWidth)return;
 const frames=VERDUN_GUN_FRAMES[type];if(!frames)return;
 const frame=frames[state],[sx,sy,sw,sh]=frame.rect,[px,py]=frame.pivot;
 // Functional states put the illustrated muzzle on the native shot origin.
 // A wreck uses the original scale and retains the gun's last aim direction.
 const k=muzzle/(state===frames.length-1?frames[0].reach:frame.reach);
 c.save();c.translate(x,y);c.rotate(angle+Math.PI/2);c.imageSmoothingEnabled=true;
 c.translate(0,recoil);
 c.drawImage(im,sx,sy,sw,sh,-px*k,-py*k,sw*k,sh*k);c.restore();
}
const shadows=new Map();
function drawContactShadow(c,im,key,w,h,scale){
 if(typeof document==='undefined')return;
 let shadow=shadows.get(key);
 if(!shadow){
  const grid=VERDUN_BODY_GRID[key],cw=im.naturalWidth/grid.columns,ch=im.naturalHeight/grid.rows,cv=document.createElement('canvas');cv.width=cw+20;cv.height=ch+20;
  const d=cv.getContext('2d');d.filter='blur(5px)';d.drawImage(im,0,0,cw,ch,10,10,cw,ch);d.filter='none';
  d.globalCompositeOperation='source-in';d.fillStyle='#241b13';d.fillRect(0,0,cv.width,cv.height);shadow=cv;shadows.set(key,cv);
 }
 c.save();c.globalAlpha*=.18;c.drawImage(shadow,-w/2-10*w/(im.naturalWidth/VERDUN_BODY_GRID[key].columns),-h/2-10*h/(im.naturalHeight/VERDUN_BODY_GRID[key].rows)+scale,w+20*w/(im.naturalWidth/VERDUN_BODY_GRID[key].columns),h+20*h/(im.naturalHeight/VERDUN_BODY_GRID[key].rows));c.restore();
}
// Ground-coloured earth overlaps only the outer berm. Bake from the actual
// world-aligned terrain and the approved hull alpha, once per fixed pose. The
// walls, internal courts, sockets and damaged artwork stay untouched.
let foundations=new WeakMap();
function drawFoundation(c,b,im,key,w,h,cw,ch){
 const map=load('map');if(!map?.naturalWidth||typeof document==='undefined')return;
 const cached=foundations.get(b);let layer=cached?.layer;
 if(!layer||cached.x!==b.x||cached.y!==b.y||cached.w!==w){
  const pad=24,cv=document.createElement('canvas');cv.width=Math.ceil(w)+pad*2;cv.height=Math.ceil(h)+pad*2;
  const mask=document.createElement('canvas');mask.width=cv.width;mask.height=cv.height;
  const m=mask.getContext('2d'),d=cv.getContext('2d');if(!m||!d)return;
  const x=(cv.width-w)/2,y=(cv.height-h)/2;
  m.drawImage(im,0,0,cw,ch,x,y,w,h);
  m.globalCompositeOperation='destination-out';m.filter='blur(10px)';m.drawImage(im,0,0,cw,ch,x,y,w,h);m.filter='none';
  drawVerdunGround(d,map,b.x,b.y,cv.width,cv.height);d.globalCompositeOperation='destination-in';d.drawImage(mask,0,0);
  layer=cv;foundations.set(b,{layer,x:b.x,y:b.y,w});
 }
 c.save();c.globalAlpha*=.8;c.drawImage(layer,-layer.width/2,-layer.height/2);c.restore();
}
export function drawVerdunFort(c,b,destruction={}){
 const sou=b.kind==='fort-souville',key=sou?'souville':'douaumont',im=load(key),parts=load(key+'Parts'),cfg=VERDUN_FORT_LAYOUT[b.kind];if(!cfg||!im?.naturalWidth)return;
 const scale=b.fortScale||1,artScale=scale*VERDUN_FORT_ENLARGEMENT,w=cfg.width*scale,h=cfg.height*scale,cw=im.naturalWidth/VERDUN_BODY_GRID[key].columns,ch=im.naturalHeight/VERDUN_BODY_GRID[key].rows,age=destruction.destructionAge||0;
 const collapsed=b.dead&&(!destruction.destroying||age>=4.15);
 const fallen=b.dead?new Set(verdunFortCollapseSites(b).filter(s=>s.at<=age).map(s=>s.partId)):null;
 c.save();c.translate(b.x,b.y);c.imageSmoothingEnabled=true;
 drawContactShadow(c,im,key,w,h,artScale);
 c.drawImage(im,collapsed&&!sou?cw:0,collapsed&&sou?ch:0,cw,ch,-w/2,-h/2,w,h);
 drawFoundation(c,b,im,key,w,h,cw,ch);
 for(const p of b.parts.values()){
  const dead=collapsed||p.destroyed||b.dead&&fallen.has(p.id),damaged=p.hp<p.maxHp*.55;
  const artSou=sou&&p.kind!=='aa',artKey=artSou?'souville':'douaumont',partImage=p.kind==='aa'&&sou?load('douaumontParts'):parts;
  const gun=!!VERDUN_GUN_FRAMES[p.art];
  const opens=['pit','ammo','core'].includes(p.art);
  const state=artSou?(dead?3:damaged?2:opens&&p.revealed?1:0):(dead?2:damaged?1:0);
  // Souville's intact casemates and AA foundations belong to the connected
  // authored hull. Overlay independent foundations only for state changes.
  if(p.kind==='pit'&&!dead){
   drawMountAlpha(c,partImage,p.art,0,p,gun,artSou);drawMountAlpha(c,partImage,p.art,damaged?2:1,p,gun,artSou,p.openAmount??(p.revealed?1:0));
  }else if(!sou||dead||damaged||opens&&p.revealed){
   const blend=dead?(p.repairBlend>0?1-p.repairBlend:p.damageBlend??1):damaged?p.damageBlend??1:1;
   if((dead||damaged)&&blend<1)drawMountAlpha(c,partImage,p.art,artSou&&opens&&p.revealed?1:0,p,gun,artSou);
   drawMountAlpha(c,partImage,p.art,state,p,gun,artSou,blend);
   if(dead&&p.repairBlend>0)drawMountAlpha(c,partImage,p.art,0,p,gun,artSou,p.repairBlend);
  }
  if(gun&&(p.kind!=='pit'||p.active)&&(dead||p.revealed||p.openAmount>0||!sou)){
   c.save();if(p.kind==='pit'&&!dead)c.globalAlpha*=p.openAmount??1;
   const gunState=dead?2:damaged?1:0;
   if(dead&&p.damageBlend<1)drawWeapon(c,partImage,p.art,0,p.x,p.y,p.muzzleLength,p.angle,artSou);
   if(dead)c.globalAlpha*=Math.max(.01,p.repairBlend>0?1-p.repairBlend:p.damageBlend??1);
   drawWeapon(c,partImage,p.art,gunState,p.x,p.y,p.muzzleLength,p.angle,artSou,dead?0:(p.recoil||0)*24*scale);
   if(dead&&p.repairBlend>0){c.globalAlpha=p.repairBlend;drawWeapon(c,partImage,p.art,0,p.x,p.y,p.muzzleLength,p.angle,artSou);}
   c.restore();
  }
  if(p.repairRemaining>0&&p.repairRemaining<3){const pulse=Math.max(0,Math.sin(b.clock*13));fx(c,'spark',p.x-p.drawWidth*.2,p.y,14*artScale,14*artScale,0,pulse*.7);fx(c,'smokeDust',p.x,p.y,25*artScale,20*artScale,0,.16);}
  if(dead&&!(p.repairRemaining>0&&p.repairRemaining<3)){fx(c,'smokeDark',p.x+4*scale,p.y-15*scale,40*scale,60*scale,0,.18);fx(c,'fire',p.x,p.y,18*scale,24*scale,0,.45);}
 }
 const core=b.regionalCore,coreState=sou?(collapsed?3:b.coreVulnerable?1:0):(collapsed?2:b.coreVulnerable?1:0);
 if(!sou||collapsed||b.coreVulnerable)drawMount(c,parts,'core',coreState,core.x,core.y,132*artScale,116*artScale,sou);
 c.restore();
}
export function drawVerdunHazard(c,h){
 if(!h.visual?.startsWith('verdun-'))return false;
 if(h.kind==='projectile'){drawTracerBolt(c,h.x,h.y,Math.atan2(h.vy,h.vx),'#f0965a',30,6,.95);return true;}
 if(h.kind!=='circle')return false;
 c.save();const warning=h.phase==='warning',q=Math.max(0,Math.min(1,(h.age-h.delay)/Math.max(.01,h.warning)));
 if(warning){
  // Functional landing telegraph uses the same circle as the native hit area.
  impactMark(c,h.x,h.y,h.radius,q,{heavy:h.raidHeavy});
  drawShellFlight(c,h,q,{arc:90});
 }else{const age=h.age-h.delay-h.warning,frame=Math.min(3,Math.floor(age/Math.max(.01,h.duration)*4));fx(c,'mortarImpact'+frame,h.x,h.y,h.radius*2.5,h.radius*2.5,0,Math.min(1,(h.duration-age)/.14));}
 c.restore();return true;
}
export function drawVerdunEnvironment(c,g,layer){
 if(g?.stageBoss?.stages.stageIndex!==12)return;const v=g.verdunBattle;if(!v)return;
 if(layer==='bodies'){
  for(const b of g.verdunWrecks||[])drawVerdunFort(c,b);
  const im=load('douaumontParts');for(const p of v.batteries){drawMount(c,im,'aa',0,p.x,p.y,64,49);drawWeapon(c,im,'aa',0,p.x,p.y,28,-Math.PI/2);};
  return;
 }
 for(const d of v.dust){const q=d.age/d.life,alpha=Math.sin(q*Math.PI)*.26;fx(c,'smokeDust',d.x,d.y-10*q,d.radius*(1+q),d.radius*(.8+q),0,alpha);}
 for(const m of v.muzzles)fx(c,'muzzleHeavy',m.x,m.y,35,22,m.a,Math.max(0,1-m.age/.2));
}

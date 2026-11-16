import {drawVerdunWeapon as drawWeapon,drawVerdunMount,drawVerdunPit,releaseVerdunHardware} from './verdun-hardware-art.js?v=d7a0cfcfc455802b';
import {drawVerdunGround,prepareVerdunGround,releaseVerdunGround} from './verdun-ground.js?v=d7a0cfcfc455802b';
import {drawMinenInstallation} from './minenwerfer-art-render.js?v=d7a0cfcfc455802b';
import {RURAL_TRACK_ART} from './rural-rail-track-art.js?v=d7a0cfcfc455802b';
import {fx} from './fx-art.js?v=d7a0cfcfc455802b';
import {drawTracerBolt} from './projectiles.js?v=d7a0cfcfc455802b';
import {impactMark} from './tactical-marks.js?v=d7a0cfcfc455802b';
import {drawShellFlight} from './boss-rounds.js?v=d7a0cfcfc455802b';
import {VERDUN_PART_FRAMES,VERDUN_BODY_GRID} from './verdun-art-layout.js?v=d7a0cfcfc455802b';
import {VERDUN_FORT_LAYOUT,VERDUN_FORT_ENLARGEMENT,verdunFortCollapseSites} from './verdun-fortresses.js?v=d7a0cfcfc455802b';

// Authored atlas frames keep measured pivots; component transition canvases are reused.
const sources={map:'./terrain-verdun-siege-20261116.webp',vaux:'./boss-vaux-1916-20261116.webp',crater:'./verdun-impact-crater-20261116.webp',douaumont:'./boss-douaumont-atlas-r8.webp?v=douaumont1916',souville:'./boss-souville-atlas-r8.webp?v=r5',douaumontParts:'./boss-douaumont-parts-r8.webp?v=douaumont1916',souvilleParts:'./boss-souville-parts-r8.webp?v=r5',
 train:'./operation-cargo-train-ink-20261115.webp',track:RURAL_TRACK_ART.url,
 mortarStates:'./minenwerfer-structural-states-20261022.webp',mortarBarrels:'./boss-minenwerfer-barrels-20261009.webp',
 centralObserver:'./asset-bank/ground-facilities/signal-hq-maan-central-clean.webp',ententeObserver:'./asset-bank/ground-facilities/signal-hq-maan-entente-clean.webp',
 rubble:'./asset-bank/ground-facilities/rubble.webp'};
const images={},pending={};
function load(key){if(images[key])return images[key];const im=new Image();im.decoding='async';pending[key]=new Promise((resolve,reject)=>{im.onload=()=>{(im.decode?im.decode():Promise.resolve()).catch(()=>{}).finally(()=>resolve(im))};im.onerror=()=>reject(new Error('Missing Verdun asset: '+sources[key]));});im.src=sources[key];images[key]=im;return im;}
export function prepareVerdunAssets(){for(const key of Object.keys(sources))load(key);return Promise.all(Object.values(pending)).then(result=>{prepareVerdunGround(images.map);return result;});}
export function releaseVerdunAssets(){releaseVerdunGround();releaseVerdunHardware();shadows.clear();foundations=new WeakMap();for(const k of Object.keys(images)){images[k].src='';delete images[k];delete pending[k];}}
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
const shadows=new Map();
const bodyGrids={...VERDUN_BODY_GRID,vaux:{columns:1,rows:1}};
function drawContactShadow(c,im,key,w,h,scale){
 if(typeof document==='undefined')return;
 let shadow=shadows.get(key);
 if(!shadow){
  const grid=bodyGrids[key],cw=im.naturalWidth/grid.columns,ch=im.naturalHeight/grid.rows,cv=document.createElement('canvas');cv.width=cw+20;cv.height=ch+20;
  const d=cv.getContext('2d');d.filter='blur(5px)';d.drawImage(im,0,0,cw,ch,10,10,cw,ch);d.filter='none';
  d.globalCompositeOperation='source-in';d.fillStyle='#241b13';d.fillRect(0,0,cv.width,cv.height);shadow=cv;shadows.set(key,cv);
 }
 c.save();c.globalAlpha*=.18;c.drawImage(shadow,-w/2-10*w/(im.naturalWidth/bodyGrids[key].columns),-h/2-10*h/(im.naturalHeight/bodyGrids[key].rows)+scale,w+20*w/(im.naturalWidth/bodyGrids[key].columns),h+20*h/(im.naturalHeight/bodyGrids[key].rows));c.restore();
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
function drawRubble(c,x,y,w,h,blend=1){
 const im=load('rubble');if(!im.naturalWidth||blend<=0)return;
 c.save();c.globalAlpha*=blend;c.drawImage(im,65,142,1666,603,x-w/2,y-h/2,w,h);c.restore();
}

function drawVaux(c,b,destruction){
 const im=load('vaux'),cfg=VERDUN_FORT_LAYOUT[b.kind];
 if(!im.naturalWidth)return;
 const scale=b.fortScale||1,w=cfg.width*scale,h=cfg.height*scale,age=destruction.destructionAge||0;
 const parts=load('douaumontParts'),fallen=b.dead?new Set(verdunFortCollapseSites(b).filter(q=>q.at<=age).map(q=>q.partId)):null;
 const collapsed=b.dead&&(!destruction.destroying||age>=4.15);
 c.save();c.translate(b.x,b.y);c.imageSmoothingEnabled=true;
 drawContactShadow(c,im,'vaux',w,h,scale);
 c.drawImage(im,-w/2,-h/2,w,h);
 drawFoundation(c,b,im,'vaux',w,h,im.naturalWidth,im.naturalHeight);
 for(const p of b.parts.values()){
  const destroyed=p.destroyed||collapsed||fallen?.has(p.id);
  if(p.kind==='aa'){
   drawVerdunMount(c,parts,'aa',destroyed?2:0,p,true,false,1,0);
   drawWeapon(c,parts,'aa',destroyed?2:0,p.x,p.y,p.muzzleLength,p.angle,false,(p.recoil||0)*24*scale);
  }else if(p.kind==='ammo'&&!destroyed&&p.revealed){
   drawMount(c,parts,'ammo',1,p.x,p.y,p.drawWidth,p.drawHeight);
  }
  if(destroyed&&p.kind!=='aa'){
   drawRubble(c,p.x,p.y+p.drawHeight*.08,p.drawWidth*1.05,p.drawHeight*.73,collapsed?1:p.damageBlend||.22);
   fx(c,'smokeDark',p.x,p.y-12*scale,43*scale,58*scale,0,.26);
  }else if(p.hp<p.maxHp*.55){
   drawRubble(c,p.x-p.drawWidth*.26,p.y+p.drawHeight*.22,p.drawWidth*.63,p.drawHeight*.38,.8);
  }
 }
 const k=b.regionalCore;
 if(collapsed){drawRubble(c,k.x,k.y,k.rx*2.5,k.ry*1.9);fx(c,'smokeDark',k.x,k.y-20*scale,95*scale,130*scale,0,.34);}
 else if(b.coreVulnerable)drawRubble(c,k.x,k.y+k.ry*.5,k.rx*2.0,k.ry*.72);
 c.restore();
}

export function drawVerdunFort(c,b,destruction={}){
 if(b.kind==='fort-vaux'){drawVaux(c,b,destruction);return;}
 const sou=b.kind==='fort-souville',key=sou?'souville':'douaumont',im=load(key),parts=load(key+'Parts'),cfg=VERDUN_FORT_LAYOUT[b.kind];if(!cfg||!im?.naturalWidth)return;
 const scale=b.fortScale||1,artScale=scale*VERDUN_FORT_ENLARGEMENT,w=cfg.width*scale,h=cfg.height*scale,cw=im.naturalWidth/bodyGrids[key].columns,ch=im.naturalHeight/bodyGrids[key].rows,age=destruction.destructionAge||0;
 const collapsed=b.dead&&(!destruction.destroying||age>=4.15);
 const fallen=b.dead?new Set(verdunFortCollapseSites(b).filter(s=>s.at<=age).map(s=>s.partId)):null;
 c.save();c.translate(b.x,b.y);c.imageSmoothingEnabled=true;
 drawContactShadow(c,im,key,w,h,artScale);
 c.drawImage(im,collapsed&&!sou?cw:0,collapsed&&sou?ch:0,cw,ch,-w/2,-h/2,w,h);
 drawFoundation(c,b,im,key,w,h,cw,ch);
 for(const p of b.parts.values()){
  const structuralFall=collapsed||b.dead&&fallen.has(p.id),dead=structuralFall||p.destroyed,damaged=p.hp<p.maxHp*.55;
  const artSou=sou&&p.kind!=='aa',artKey=artSou?'souville':'douaumont',partImage=p.kind==='aa'&&sou?load('douaumontParts'):parts;
  const gun=!!VERDUN_PART_FRAMES[artKey].guns[p.art];
  const cupola=!sou&&(p.kind==='heavy'||p.kind==='mg');
  const opens=['pit','ammo','core'].includes(p.art);
  const state=artSou?(dead?3:damaged?2:opens&&p.revealed?1:0):(dead?2:damaged?1:0);
  // The fixed iron dome occludes the rotating receiver. Only the short
  // muzzle beyond its edge remains visible when the turret fires.
  if(cupola&&!dead)drawWeapon(c,partImage,p.art,damaged?1:0,p.x,p.y,p.muzzleLength,p.angle,false,(p.recoil||0)*24*scale);
  // Souville's intact casemates and AA foundations belong to the connected
  // authored hull. Overlay independent foundations only for state changes.
  if(p.kind==='pit'&&!dead){
   drawVerdunPit(c,partImage,p);
  }else if(!sou||dead||damaged||opens&&p.revealed){
   const blend=structuralFall?1:dead?(p.repairBlend>0?1-p.repairBlend:p.damageBlend??1):damaged?p.damageBlend??1:1;
   drawVerdunMount(c,partImage,p.art,state,p,gun,artSou,blend,artSou&&opens&&p.revealed?1:0);
  }
  if(gun&&!cupola&&(p.kind!=='pit'||p.active)&&(dead||p.revealed||p.openAmount>0||!sou)){
   c.save();if(p.kind==='pit'&&!dead)c.globalAlpha*=p.openAmount??1;
   const gunState=artSou?(dead?1:0):(dead?2:damaged?1:0);
   const wreckBlend=structuralFall?1:dead?(p.repairBlend>0?1-p.repairBlend:p.damageBlend??1):1;
   if(dead&&wreckBlend<1){c.save();c.globalAlpha*=1-wreckBlend;drawWeapon(c,partImage,p.art,0,p.x,p.y,p.muzzleLength,p.angle,artSou);c.restore();}
   if(dead)c.globalAlpha*=wreckBlend;
   drawWeapon(c,partImage,p.art,gunState,p.x,p.y,p.muzzleLength,p.angle,artSou,dead?0:(p.recoil||0)*24*scale);
   c.restore();
  }
  if(p.repairRemaining>0&&p.repairRemaining<3){const pulse=Math.max(0,Math.sin(b.clock*13));fx(c,'spark',p.x-p.drawWidth*.2,p.y,14*artScale,14*artScale,0,pulse*.7);fx(c,'smokeDust',p.x,p.y,25*artScale,20*artScale,0,.16);}
  if(dead&&!(p.repairRemaining>0&&p.repairRemaining<3)){fx(c,'smokeDark',p.x+4*scale,p.y-15*scale,40*scale,60*scale,0,.18);fx(c,'fire',p.x,p.y,18*scale,24*scale,0,.45);}
 }
 const core=b.regionalCore,coreState=sou?(collapsed?3:b.coreVulnerable?1:0):(collapsed?2:b.coreVulnerable?1:0);
 if(!sou||collapsed||b.coreVulnerable)drawMount(c,parts,'core',coreState,core.x,core.y,(sou?132:110)*artScale,(sou?116:78)*artScale,sou);
 c.restore();
}
export function drawVerdunHazard(c,h){
 if(!h.visual?.startsWith('verdun-'))return false;
 if(h.kind==='projectile'){drawTracerBolt(c,h.x,h.y,Math.atan2(h.vy,h.vx),'#f0965a',30,6,.95);return true;}
 if(h.kind!=='circle')return false;
 c.save();const warning=h.phase==='warning',q=Math.max(0,Math.min(1,(h.age-h.delay)/Math.max(.01,h.warning)));
 if(warning){
  // Functional landing telegraph uses the same circle as the native hit area.
  if(h.damage>0)impactMark(c,h.x,h.y,h.radius,q,{heavy:h.raidHeavy||h.visual==='verdun-field-heavy'});
  drawShellFlight(c,h,q,{arc:h.visual==='verdun-field-heavy'?150:90});
 }else{const age=h.age-h.delay-h.warning,frame=Math.min(3,Math.floor(age/Math.max(.01,h.duration)*4));fx(c,'mortarImpact'+frame,h.x,h.y,h.radius*2.5,h.radius*2.5,0,Math.min(1,(h.duration-age)/.14));}
 c.restore();return true;
}
function drawSupplyRail(c,train,view){
 if(!train)return;
 const track=load('track'),atlas=load('train'),gauge=25;
 const k=gauge/RURAL_TRACK_ART.gauges[0],sw=RURAL_TRACK_ART.cellWidth,sh=RURAL_TRACK_ART.height,step=sh*k;
 if(track.naturalWidth&&Math.abs(train.x-view.x)<view.width/2+sw*k){
  const top=view.y-view.height/2,bottom=view.y+view.height/2;
  const anchor=train.start+Math.floor((top-train.start)/step)*step;
  c.save();c.imageSmoothingEnabled=true;
  for(let y=anchor;y<bottom;y+=step){
   c.drawImage(track,0,0,sw,sh,train.x-RURAL_TRACK_ART.centers[0]*k,y,sw*k,step);
  }
  c.restore();
 }
 if(train.departed||!atlas.naturalWidth)return;
 for(const [i,e] of [train.engine,...train.wagons].entries()){
  if(!visible(e,view,80))continue;
  c.save();c.translate(e.x,e.y);c.rotate(train.sign*Math.PI/2);c.imageSmoothingEnabled=true;
  c.drawImage(atlas,(i===0?0:2)*330,e.hp<=0?114:0,330,114,-e.height/2,-e.width/2,e.height,e.width);
  c.restore();
  if(e.hp<=0)fx(c,'smokeDark',e.x,e.y,40,62,0,.35);
 }
}

function visible(p,view,pad=150){
 return Math.abs(p.x-view.x)<view.width/2+pad&&Math.abs(p.y-view.y)<view.height/2+pad;
}

export function drawVerdunEnvironment(c,g,layer,view){
 if(g?.stageBoss?.stages.stageIndex!==12)return;
 const v=g.verdunBattle;if(!v)return;
 if(layer!=='hazards'){
  const crater=load('crater');
  if(crater.naturalWidth)for(const p of v.craters||[]){
   if(!visible(p,view))continue;
   c.save();c.translate(p.x,p.y);c.rotate(p.angle);c.globalAlpha*=.78;
   c.drawImage(crater,-p.radius,-p.radius,p.radius*2,p.radius*2);c.restore();
  }
  drawSupplyRail(c,v.train,view);
  const mortarArt={states:load('mortarStates'),barrels:load('mortarBarrels')};
  for(const p of v.mortars||[]){
   if(!visible(p,view))continue;
   drawMinenInstallation(c,{...p,destroyed:p.hp<=0},mortarArt,{scale:p.width/600});
   if(p.hp<=0)fx(c,'smokeDark',p.x,p.y,44,56,0,.25);
  }
  const p=v.observer;
  if(p&&visible(p,view)){
   const im=load(p.faction==='central'?'centralObserver':'ententeObserver');
   if(im.naturalWidth)c.drawImage(im,p.x-p.width/2,p.y-p.height/2,p.width,p.height);
   if(p.hp<=0)drawRubble(c,p.x,p.y+9,p.width*.8,p.height*.65);
  }
  for(const b of g.verdunWrecks||[])if(visible(b,view,850))drawVerdunFort(c,b);
 }
 if(layer==='bodies')return;
 for(const d of v.dust){
  if(!visible(d,view))continue;
  const q=d.age/d.life,alpha=Math.sin(q*Math.PI)*.29;
  fx(c,'smokeDust',d.x+q*18,d.y-20*q,d.radius*(1+q),d.radius*(.8+q),0,alpha);
 }
 for(const m of v.muzzles)if(visible(m,view))fx(c,'muzzleHeavy',m.x,m.y,35,22,m.a,Math.max(0,1-m.age/.2));
}

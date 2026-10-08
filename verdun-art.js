import {drawVerdunGround,prepareVerdunGround,releaseVerdunGround} from './verdun-ground.js?v=cb1';
import {fx} from './fx-art.js?v=cb1';
import {VERDUN_PART_FRAMES,VERDUN_BODY_GRID} from './verdun-art-layout.js?v=cb1';
import {VERDUN_FORT_LAYOUT,VERDUN_FORT_ENLARGEMENT,verdunFortCollapseSites} from './verdun-fortresses.js?v=cb1';

// Authored PNG/WebP atlas frames; no generated geometry or per-frame raster copy.
const sources={map:'./terrain-verdun-r8.webp?v=r5',douaumont:'./boss-douaumont-atlas-r8.webp?v=r5',souville:'./boss-souville-atlas-r8.webp?v=r5',douaumontParts:'./boss-douaumont-parts-r8.webp?v=r5',souvilleParts:'./boss-souville-parts-r8.webp?v=r5'};
const images={},pending={};
function load(key){if(images[key])return images[key];const im=new Image();im.decoding='async';pending[key]=new Promise((resolve,reject)=>{im.onload=()=>{(im.decode?im.decode():Promise.resolve()).catch(()=>{}).finally(()=>resolve(im))};im.onerror=()=>reject(new Error('Missing Verdun asset: '+sources[key]));});im.src=sources[key];images[key]=im;return im;}
export function prepareVerdunAssets(){for(const key of Object.keys(sources))load(key);return Promise.all(Object.values(pending)).then(result=>{prepareVerdunGround(images.map);return result;});}
export function releaseVerdunAssets(){releaseVerdunGround();shadows.clear();for(const k of Object.keys(images)){images[k].src='';delete images[k];delete pending[k];}}
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
function drawWeapon(c,im,type,state,x,y,muzzle,angle,sou=false){
 if(!im?.naturalWidth)return;
 const frames=VERDUN_PART_FRAMES[sou?'souville':'douaumont'].guns[type];if(!frames)return;
 const frame=frames[state],[sx,sy,sw,sh]=frame.rect,[px,py]=frame.pivot;
 // Functional states put the illustrated muzzle on the native shot origin.
 // A wreck uses the original scale and retains the gun's last aim direction.
 const k=muzzle/(state===frames.length-1?frames[0].reach:frame.reach);
 c.save();c.translate(x,y);c.rotate(angle+Math.PI/2);c.imageSmoothingEnabled=true;
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
 c.save();c.globalAlpha*=.38;c.drawImage(shadow,-w/2-10*w/(im.naturalWidth/VERDUN_BODY_GRID[key].columns),-h/2-10*h/(im.naturalHeight/VERDUN_BODY_GRID[key].rows)+3*scale,w+20*w/(im.naturalWidth/VERDUN_BODY_GRID[key].columns),h+20*h/(im.naturalHeight/VERDUN_BODY_GRID[key].rows));c.restore();
}
export function drawVerdunFort(c,b,destruction={}){
 const sou=b.kind==='fort-souville',key=sou?'souville':'douaumont',im=load(key),parts=load(key+'Parts'),cfg=VERDUN_FORT_LAYOUT[b.kind];if(!cfg||!im?.naturalWidth)return;
 const scale=b.fortScale||1,artScale=scale*VERDUN_FORT_ENLARGEMENT,w=cfg.width*scale,h=cfg.height*scale,cw=im.naturalWidth/VERDUN_BODY_GRID[key].columns,ch=im.naturalHeight/VERDUN_BODY_GRID[key].rows,age=destruction.destructionAge||0;
 const collapsed=b.dead&&(!destruction.destroying||age>=4.15);
 const fallen=new Set(b.dead?verdunFortCollapseSites(b).filter(s=>s.at<=age).map(s=>s.partId):[]);
 c.save();c.translate(b.x,b.y);c.imageSmoothingEnabled=true;
 drawContactShadow(c,im,key,w,h,artScale);
 c.drawImage(im,collapsed&&!sou?cw:0,collapsed&&sou?ch:0,cw,ch,-w/2,-h/2,w,h);
 for(const p of b.parts.values()){
  const dead=collapsed||p.destroyed||b.dead&&fallen.has(p.id),damaged=p.hp<p.maxHp*.55;
  const artSou=sou&&p.kind!=='aa',artKey=artSou?'souville':'douaumont',partImage=p.kind==='aa'&&sou?load('douaumontParts'):parts;
  const gun=!!VERDUN_PART_FRAMES[artKey].guns[p.art];
  const opens=['pit','ammo','core'].includes(p.art);
  const state=artSou?(dead?3:damaged?2:opens&&p.revealed?1:0):(dead?2:damaged?1:0);
  // Souville's intact casemates and AA foundations belong to the connected
  // authored hull. Overlay independent foundations only for state changes.
  if(!sou||dead||damaged||p.kind==='pit'||opens&&p.revealed)drawMount(c,partImage,p.art,state,p.x,p.y,p.drawWidth,gun?p.drawWidth*.76:p.drawHeight,artSou);
  if(gun&&(p.kind!=='pit'||p.active)&&(dead||p.revealed||!sou)){
   drawWeapon(c,partImage,p.art,artSou?(dead?1:0):(dead?2:damaged?1:0),p.x,p.y,p.muzzleLength,p.angle,artSou);
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
 if(h.kind==='projectile'){fx(c,'tracerOrange',h.x,h.y,28,5,Math.atan2(h.vy,h.vx),.92);return true;}
 if(h.kind!=='circle')return false;
 c.save();const warning=h.phase==='warning',q=Math.max(0,Math.min(1,(h.age-h.delay)/Math.max(.01,h.warning)));
 if(warning){
  // Functional landing telegraph uses the same circle as the native hit area.
  c.strokeStyle='#d7be88';c.lineWidth=1.6;c.setLineDash([5,4]);c.beginPath();c.arc(h.x,h.y,h.radius,0,Math.PI*2);c.stroke();c.setLineDash([]);
  c.globalAlpha=.18+.35*q;c.strokeStyle='#fff0bc';c.beginPath();c.arc(h.x,h.y,h.radius*(1-q*.7),0,Math.PI*2);c.stroke();c.globalAlpha=1;
  if(h.sourceX!=null){const x=h.sourceX+(h.x-h.sourceX)*q,y=h.sourceY+(h.y-h.sourceY)*q-Math.sin(q*Math.PI)*90;fx(c,'shellHeavy',x,y,24,8,Math.atan2(h.y-h.sourceY,h.x-h.sourceX),.92);}
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

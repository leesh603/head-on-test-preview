import {fx} from './fx-art.js?v=351';
import {VERDUN_FORT_LAYOUT,verdunFortCollapseSites} from './verdun-fortresses.js?v=verdun20261003';

// Authored PNG/WebP atlas frames; no generated geometry or per-frame raster copy.
const sources={map:'./terrain-verdun.webp?v=verdun20261003',douaumont:'./boss-douaumont-atlas.webp?v=verdun20261003',souville:'./boss-souville-atlas.webp?v=verdun20261003',douaumontParts:'./boss-douaumont-parts.webp?v=verdun20261003',souvilleParts:'./boss-souville-parts.webp?v=verdun20261003'};
const images={},pending={};
function load(key){if(images[key])return images[key];const im=new Image();im.decoding='async';pending[key]=new Promise((resolve,reject)=>{im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Missing Verdun asset: '+sources[key]));});im.src=sources[key];images[key]=im;return im;}
export function prepareVerdunAssets(){for(const key of Object.keys(sources))load(key);return Promise.all(Object.values(pending));}
export function releaseVerdunAssets(){for(const k of Object.keys(images)){images[k].src='';delete images[k];delete pending[k];}}
export function paintVerdun(c,g,cx,cy,w,h){
 c.save();c.fillStyle='#47463d';c.fillRect(0,0,w,h);const im=images.map;if(!im?.naturalWidth){c.restore();return;}
 const v=g?.verdunBattle,anchorX=v?.x??cx,anchorY=v?.y??cy;
 // One continuous authored plate. The distant ground parallax never tiles,
 // mirrors or joins patches; aircraft/world hit positions remain unscaled.
 const size=Math.max(2048,w*2,h*2),px=Math.max(w-size,Math.min(0,(w-size)/2-(cx-anchorX)*.055)),py=Math.max(h-size,Math.min(0,(h-size)/2-(cy-anchorY)*.055));
 c.globalAlpha=.72;c.imageSmoothingEnabled=true;c.drawImage(im,px,py,size,size);c.globalAlpha=1;c.fillStyle='#73838616';c.fillRect(0,0,w,h);c.restore();
}
const columns={heavy:0,mg:1,aa:2,control:3,ammo:4,core:5};
const souColumns={bunker:0,pit:1,observer:2,command:3,ammo:4,core:5};
// Measured source rectangles and rotational pivots, in the original 1774×887 atlas.
const douFrames=[
 [[26,20,281,335,145,219],[327,116,262,224,129,130],[597,42,280,313,140,199],[910,118,242,236,117,125],[1185,143,273,205,135,102],[1472,111,291,247,145,133]],
 [[27,331,282,292,144,165],[327,383,264,232,129,107],[596,352,283,275,142,149],[909,380,242,243,118,122],[1185,399,275,218,135,112],[1473,378,290,246,145,128]],
 [[24,621,285,250,147,135],[323,637,274,223,133,116],[592,615,286,264,146,137],[903,640,254,221,124,108],[1180,641,285,221,140,109],[1470,635,294,240,145,119]]
];
function drawPart(c,im,type,state,x,y,w,h,angle=0,sou=false){
 if(!im?.naturalWidth)return;
 const col=(sou?souColumns:columns)[type];if(col===undefined)return;
 let sx,sy,sw,sh,pivotX,pivotY;
 if(sou){sw=im.naturalWidth/6;sh=im.naturalHeight/4;sx=col*sw;sy=state*sh;pivotX=sw/2;pivotY=sh/2;}
 else{[sx,sy,sw,sh,pivotX,pivotY]=douFrames[state][col];}
 c.save();c.translate(x,y);c.rotate(angle);c.imageSmoothingEnabled=true;c.drawImage(im,sx,sy,sw,sh,-pivotX*w/sw,-pivotY*h/sh,w,h);c.restore();
}
export function drawVerdunFort(c,b,destruction={}){
 const sou=b.kind==='fort-souville',key=sou?'souville':'douaumont',im=images[key],parts=images[key+'Parts'],cfg=VERDUN_FORT_LAYOUT[b.kind];if(!cfg||!im?.naturalWidth)return;
 const scale=b.fortScale||1,w=cfg.width*scale,h=cfg.height*scale,cw=im.naturalWidth/2,ch=im.naturalHeight,age=destruction.destructionAge||0;
 const collapsed=b.dead&&(!destruction.destroying||age>=4.15),sites=b.dead?verdunFortCollapseSites(b):[];
 c.save();c.translate(b.x,b.y);c.imageSmoothingEnabled=true;
 const drawBase=state=>c.drawImage(im,state*cw,0,cw,ch,-w/2,-h/2,w,h);
 drawBase(collapsed?1:0);
 if(!collapsed)for(const p of b.parts.values()){
  if(!p.destroyed&&!(b.dead&&sites.some(s=>s.partId===p.id&&s.at<=age)))continue;
  // The corresponding collapsed foundation replaces only its local section;
  // registered atlas variants preserve the surrounding perimeter and roofs.
  c.save();c.beginPath();c.ellipse(p.x,p.y,Math.max(p.drawWidth*.72,40*scale),Math.max(p.drawHeight*.65,35*scale),0,0,Math.PI*2);c.clip();drawBase(1);c.restore();
 }
 for(const p of b.parts.values()){
  const dead=collapsed||p.destroyed||b.dead&&sites.some(s=>s.partId===p.id&&s.at<=age),damaged=p.hp<p.maxHp*.55;
  let state=sou?(dead?3:damaged?2:p.revealed?1:0):(dead?2:damaged?1:0);
  const gun=['heavy','mg','aa','pit','bunker'].includes(p.kind),angle=gun&&!dead&&(p.revealed||!sou)?p.angle+Math.PI/2:0;
  drawPart(c,parts,p.art,state,p.x,p.y,p.drawWidth,p.drawHeight,angle,sou);
  if(dead){fx(c,'smokeDark',p.x+4*scale,p.y-20*scale,65*scale,90*scale,0,.32);fx(c,'fire',p.x,p.y,24*scale,35*scale,0,.55);}
 }
 const core=b.regionalCore,coreState=sou?(collapsed?3:b.coreVulnerable?1:0):(collapsed?2:b.coreVulnerable?1:0);
 drawPart(c,parts,'core',coreState,core.x,core.y,132*scale,116*scale,0,sou);
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
  const im=images.douaumontParts;for(const p of v.batteries)drawPart(c,im,'aa',0,p.x,p.y,64,66,0);
  return;
 }
 for(const d of v.dust){const q=d.age/d.life,alpha=Math.sin(q*Math.PI)*.26;fx(c,'smokeDust',d.x,d.y-10*q,d.radius*(1+q),d.radius*(.8+q),0,alpha);}
 for(const m of v.muzzles)fx(c,'muzzleHeavy',m.x,m.y,35,22,m.a,Math.max(0,1-m.age/.2));
}

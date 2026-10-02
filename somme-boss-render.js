import {SOMME_FRAMES,SOMME_SHEETS} from './somme-boss-atlas.js?v=504';
import {fx} from './fx-art.js?v=504';
import {drawAADefense} from './aa-defense-art.js?v=504';
import {clamp,sommeMuzzle} from './somme-boss-layout.js?v=504';
const images={},pending={};
function load(key){if(images[key])return images[key];const im=new Image();im.decoding='async';images[key]=im;pending[key]=new Promise(resolve=>{im.addEventListener('load',()=>resolve(im),{once:true});im.addEventListener('error',()=>resolve(im),{once:true});});im.src='./'+SOMME_SHEETS[key]+'?v=somme20261001';return im;}
export function prepareSommeAssets(){for(const key of Object.keys(SOMME_SHEETS))load(key);return Promise.all(Object.values(pending));}
export function releaseSommeAssets(){for(const key of Object.keys(images)){delete images[key];delete pending[key];}}
// Pivot is measured on the normal sprite's visible silhouette. Damage-state
// offsets stay relative to that cell; broken barrels/debris do not move a mount.
function sprite(c,key,state,x,y,w,h,angle=0,pivotY=.5){
 const f=SOMME_FRAMES[key+'-'+state],n=SOMME_FRAMES[key+'-normal'];if(!f||!n)return;
 const im=load(f.sheet);if(!(im.naturalWidth||im.width))return;
 const [sx,sy,sw,sh]=f.rect,[nx,ny,nw,nh]=n.solid,[cx,cy]=f.cell,[ncx,ncy]=n.cell;
 const scaleX=w/nw,scaleY=h/nh,px=nx+nw*.5,py=ny+nh*pivotY;
 c.save();c.translate(x,y);c.rotate(angle);c.imageSmoothingEnabled=true;c.drawImage(im,sx,sy,sw,sh,(sx-cx-px)*scaleX,(sy-cy-py)*scaleY,sw*scaleX,sh*scaleY);c.restore();
}
const state=(p,dead)=>dead||p.destroyed?'wreck':p.hp<=p.maxHp*.5?'damaged':'normal';
function warningRing(c,x,y,r,progress){c.strokeStyle='#e6c38be0';c.lineWidth=1.5;c.setLineDash([6,5]);c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();c.setLineDash([]);c.strokeStyle='#ffe3a0';c.lineWidth=2;c.beginPath();c.arc(x,y,r+4,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);c.stroke();}
export function drawSommeBoss(c,b){
 const s=b.sommeScale||1,parts=b.parts||[],tank=b.assetKey==='mark4-wedge',dead=b.destroying;
 c.save();c.translate(b.x,b.y);
 if(tank){
  for(const m of b.trackMarks||[]){c.save();c.translate(m.x-b.x,m.y-b.y);c.rotate(m.a);c.globalAlpha=clamp((6-m.age)/6,0,1)*.16;c.fillStyle='#30271c';for(const side of [-1,1])c.fillRect((side*49-8)*s,-18*s,16*s,36*s);c.restore();}
  c.save();c.rotate(b.hullYaw);
  // Inner armor on the track strip is covered by the hull; only the tread edge
  // lies outside the roof. Component destruction remains a separate overlay.
  for(const p of parts.filter(p=>p.id.startsWith('track-')))sprite(c,p.art==='casemate'?'heavy-casemate':p.art==='mg'?'aa-mg':p.art,state(p,dead),p.localX*s,p.localY*s,p.drawWidth,p.drawHeight);
  sprite(c,b.tankRole+'-hull',dead?'wreck':b.hp<b.maxHp*.55?'damaged':'normal',0,0,84*s,230*s);
  c.restore();
  for(const p of parts.filter(p=>p.id.startsWith('sponson-')))sprite(c,b.tankRole+'-sponson',state(p,dead),p.x,p.y,p.drawWidth,p.drawHeight,p.angle+Math.PI/2,.6);
  if(b.salvo&&!dead){const q=b.salvo,prog=clamp(1-q.remaining/1.05,0,1);c.strokeStyle='#d8b57b66';c.lineWidth=1;c.setLineDash([6,7]);c.beginPath();const p=parts.find(p=>p.id===q.partId);if(p){const m=sommeMuzzle(b,p);c.moveTo(m.x-b.x,m.y-b.y);c.lineTo(q.x-b.x,q.y-b.y);c.stroke();}c.setLineDash([]);warningRing(c,q.x-b.x,q.y-b.y,28*s,prog);}
 }else{
  sprite(c,'body',dead?'wreck':b.coreVulnerable?'breached':b.hp<b.maxHp*.72?'damaged':'normal',0,0,680*s,340*s);
  for(const p of parts){const weapon=!['ammo','observer'].includes(p.id),pivot=p.art==='twin-aa'?.61:p.art==='casemate'?.66:p.art==='mg'?.66:.5;sprite(c,p.art==='casemate'?'heavy-casemate':p.art==='mg'?'aa-mg':p.art,state(p,dead),p.x,p.y,p.drawWidth,p.drawHeight,weapon?p.angle+Math.PI/2:0,pivot);}
  if(b.coreVulnerable&&!dead){c.strokeStyle='#e7b574aa';c.lineWidth=1.6;c.setLineDash([6,5]);c.beginPath();c.ellipse(0,48*s,58*s,56*s,0,0,Math.PI*2);c.stroke();c.setLineDash([]);}
  if(b.lock&&!dead){const q=b.lock;warningRing(c,q.x-b.x,q.y-b.y,17*s,b.lockProgress);const observer=parts.find(p=>p.id==='observer');if(q.mode==='tracked'&&observer){c.strokeStyle='#d6c29955';c.setLineDash([4,7]);c.beginPath();c.moveTo(observer.x,observer.y);c.lineTo(q.x-b.x,q.y-b.y);c.stroke();c.setLineDash([]);}}
  if(b.lane?.remaining>0&&!dead){const q=b.lane;c.strokeStyle='#9bc5b899';c.lineWidth=1;c.setLineDash([10,8]);for(const side of [-1,1]){c.beginPath();c.moveTo(q.x-b.x+side*q.width/2,q.y-b.y-66);c.lineTo(q.x-b.x+side*q.width/2,q.y-b.y+66);c.stroke();}c.setLineDash([]);}
 }
 c.restore();
 for(const p of parts){if(p.destroyed||dead)continue;if(p.recoil>0){const m=sommeMuzzle(b,p);if(!drawAADefense(c,'aaMuzzle',m.x,m.y,28*s,28*s,0,clamp(p.recoil/.2,0,1)))fx(c,'muzzleHeavy',m.x,m.y,28*s,28*s,p.angle,clamp(p.recoil/.2,0,1));}if(p.hitFlash>0){c.save();c.strokeStyle='#ffdcaa';c.globalAlpha=p.hitFlash/.12;c.lineWidth=2;c.beginPath();c.ellipse(b.x+p.x,b.y+p.y,p.hitRadiusX,p.hitRadiusY,b.hullYaw||0,0,Math.PI*2);c.stroke();c.restore();}}
 if(dead){const age=b.destructionAge||0;for(const [x,y]of [[-30,-24],[24,28]]){fx(c,'fireGround',b.x+x*s,b.y+y*s,65*s,65*s,0,.58);fx(c,'smokeDark',b.x+(x+Math.sin(age)*9)*s,b.y+(y-25)*s,105*s,120*s,0,.55);}}
}
export function drawSommeHazard(c,h){
 if(!h.visual?.startsWith('somme-'))return false;
 if(h.kind==='projectile'){fx(c,'tracerAmber',h.x,h.y,18,4,Math.atan2(h.vy,h.vx),.9);c.save();c.fillStyle='#edce93';c.beginPath();c.arc(h.x,h.y,2,0,Math.PI*2);c.fill();c.restore();return true;}
 c.save();const warning=h.phase==='warning',q=clamp((h.age-h.delay)/Math.max(.01,h.warning),0,1);
 if(warning){warningRing(c,h.x,h.y,h.radius,q);if(h.sourceX!=null){const x=h.sourceX+(h.x-h.sourceX)*q,y=h.sourceY+(h.y-h.sourceY)*q-Math.sin(q*Math.PI)*62;fx(c,'shellHeavy',x,y,20,7,Math.atan2(h.y-h.sourceY,h.x-h.sourceX),.9);}}
 else{const age=Math.max(0,h.age-h.delay-h.warning),frame=age<h.duration*.28?'aaFlakHot':age<h.duration*.62?'aaFlakDark':'aaFlakSmoke';if(!drawAADefense(c,frame,h.x,h.y,h.radius*2.35,h.radius*2.35))fx(c,'flak',h.x,h.y,h.radius*2.35,h.radius*2.35,0,clamp(1-age/h.duration,0,1));}
 c.restore();return true;
}

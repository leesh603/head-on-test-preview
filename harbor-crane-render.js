import {HARBOR_BOOM,harborScale,harborCranePose} from './harbor-crane-layout.js?v=507';
import {fx} from './fx-art.js?v=507';

export const HARBOR_FRAMES=Object.freeze({arm:[0,0,627,390],armBroken:[627,0,627,390],ammo:[0,390,627,458],ammoBroken:[627,390,627,458],facility:[0,848,627,406],facilityBroken:[627,848,627,406]});
const gunCache=new WeakMap(),gunCenters=[[188,152],[196,152],[190,161],[194,161]],gunAngles=[-2.6,-.54,2.52,.57];
function buildGuns(image){
 if(!image?.naturalWidth)return null;if(gunCache.has(image))return gunCache.get(image);
 const cells=[];for(let i=0;i<4;i++){
  const base=document.createElement('canvas'),weapon=document.createElement('canvas'),mask=document.createElement('canvas');for(const c of [base,weapon,mask])c.width=c.height=192;
  const [x,y]=gunCenters[i],m=mask.getContext('2d');m.scale(.5,.5);m.fillStyle='#fff';m.beginPath();m.arc(x,y,64,0,Math.PI*2);m.fill();m.save();m.translate(x,y);m.rotate(gunAngles[i]);m.fillRect(-10,-24,184,48);m.restore();
  for(const [canvas,op]of [[base,'destination-out'],[weapon,'destination-in']]){const c=canvas.getContext('2d');c.drawImage(image,(i%2)*384,Math.floor(i/2)*384,384,384,0,0,192,192);c.globalCompositeOperation=op;c.drawImage(mask,0,0);}
  cells.push({base,weapon,x,y});
 }gunCache.set(image,cells);return cells;
}
function frame(c,image,f,x,y,w,h){if(!image?.naturalWidth)return false;c.drawImage(image,...f,x-w/2,y-h/2,w,h);return true;}
function damageBar(c,p,x,y){if(p.hp>=p.maxHp||p.destroyed)return;c.fillStyle='#1e2727';c.fillRect(x-18,y+21,36,2);c.fillStyle='#dfb87d';c.fillRect(x-18,y+21,36*p.hp/p.maxHp,2);}
export function drawHarborFortress(c,b,art){
 const s=harborScale(b),parts=b.parts||[],part=id=>parts.find(p=>p.id===id),dead=id=>b.destroying||part(id)?.destroyed;
 const wreck=b.destroying?Math.min(1,b.destructionAge/Math.max(.1,b.destructionDuration)):0,time=b.motionTime||0;
 c.save();c.translate(b.x,b.y);c.scale(s,s);c.imageSmoothingEnabled=true;
 // The fortress settles into its berth; it never drifts away like a vessel.
 if(wreck){c.translate(0,wreck*9);c.scale(1-wreck*.035,1-wreck*.035);c.globalAlpha*=1-wreck*.32;}
 if(art.base?.naturalWidth)c.drawImage(art.base,-150,-150,300,300);
 for(const [id,kind]of [['ammo-storage','ammo'],['seaplane-facility','facility']]){
  const p=part(id);if(!p)continue;const x=p.localX,y=p.localY;
  if(!frame(c,art.parts,HARBOR_FRAMES[kind+(dead(id)?'Broken':'')],x,y,p.drawWidth,p.drawHeight)&&art[kind]?.naturalWidth)c.drawImage(art[kind],x-p.drawWidth/2,y-p.drawHeight/2,p.drawWidth,p.drawHeight);
  if(dead(id)){const burn=Math.max(0,1-(time-(p.destroyedAt??time))/5)*(1-wreck);fx(c,'smokeDark',x+4,y-11,42,48,0,burn*.36);if(kind==='ammo')fx(c,'fireGround',x,y,34,26,0,burn*.55);}
  else{damageBar(c,p,x,y);if(p.launchWarmup>0){c.strokeStyle='#d6b67b';c.lineWidth=1.2;c.setLineDash([3,3]);c.strokeRect(x-17,y-13,34,36);c.setLineDash([]);c.beginPath();c.moveTo(x-15,y+19);c.lineTo(x-15+30*(1-p.launchWarmup/1.05),y+19);c.stroke();}}
 }
 const guns=buildGuns(art.guns);for(const p of parts.filter(p=>p.kind==='harbor-gun')){
  const index=p.cell??parts.filter(q=>q.kind==='harbor-gun').indexOf(p),g=guns?.[index];if(!g)continue;const w=p.drawWidth,h=p.drawHeight,k=w/384;
  c.save();c.translate(p.localX,p.localY);c.drawImage(g.base,-g.x*k,-g.y*k,w,h);c.rotate(p.angle+(dead(p.id)?.22:0));
  if(dead(p.id)){c.filter='grayscale(.85) brightness(.48)';c.globalAlpha*=.75;}else c.translate(-(p.recoil||0)*2,0);
  c.rotate(-gunAngles[index]);c.drawImage(g.weapon,-g.x*k,-g.y*k,w,h);c.restore();if(!dead(p.id))damageBar(c,p,p.localX,p.localY);
 }
 const pose=harborCranePose(b),pivot={x:(pose.pivot.x-b.x)/s,y:(pose.pivot.y-b.y)/s},tip={x:(pose.tip.x-b.x)/s,y:(pose.tip.y-b.y)/s},load={x:(pose.load.x-b.x)/s,y:(pose.load.y-b.y)/s};
 const broken=dead('crane-arm')||dead('crane-pivot'),f=broken?HARBOR_FRAMES.armBroken:HARBOR_FRAMES.arm;
 if(art.parts?.naturalWidth){const dx=HARBOR_BOOM.tip[0]-HARBOR_BOOM.root[0],dy=HARBOR_BOOM.tip[1]-HARBOR_BOOM.root[1],unit=HARBOR_BOOM.reach/Math.hypot(dx,dy);
  c.save();c.translate(pivot.x,pivot.y);c.rotate((b.craneAngle||0)-Math.atan2(dy,dx)+(wreck*.1));c.drawImage(art.parts,...f,-HARBOR_BOOM.root[0]*unit,-HARBOR_BOOM.root[1]*unit,f[2]*unit,f[3]*unit);c.restore();
 }
 const pivotPart=part('crane-pivot');if(art.pivot?.naturalWidth){c.save();if(dead('crane-pivot'))c.filter='grayscale(.6) brightness(.6)';c.drawImage(art.pivot,pivot.x-41,pivot.y-41,82,82);c.restore();}
 if(pivotPart?.hittable&&!pivotPart.destroyed){c.strokeStyle='#d6b27d95';c.lineWidth=1;c.beginPath();c.arc(pivot.x,pivot.y,21,0,Math.PI*2);c.stroke();damageBar(c,pivotPart,pivot.x,pivot.y);}
 if(!broken&&(b.craneState==='windup'||b.craneState==='sweep')){
  if(b.craneState==='windup'){c.save();c.setLineDash([5,6]);c.strokeStyle='#dfbd8273';c.lineWidth=1.2;c.beginPath();c.arc(pivot.x,pivot.y+38,HARBOR_BOOM.reach,Math.min(b.craneStart,b.craneEnd),Math.max(b.craneStart,b.craneEnd));c.stroke();c.restore();}
  c.strokeStyle='#353c35';c.lineWidth=2.5;c.beginPath();c.moveTo(tip.x,tip.y);c.lineTo(load.x,load.y);c.stroke();c.strokeStyle='#aca18a';c.lineWidth=.8;c.stroke();
  if(!dead('ammo-storage'))fx(c,'mine',load.x,load.y,32,32,0,1);
  else{c.strokeStyle='#b0a08a';c.lineWidth=3;c.beginPath();c.moveTo(load.x,load.y-7);c.lineTo(load.x,load.y+5);c.arc(load.x-4,load.y+5,4,0,Math.PI*1.5);c.stroke();}
 }
 if(b.coreVulnerable){c.strokeStyle='#d8965f88';c.lineWidth=1.5;c.beginPath();c.arc(pivot.x,pivot.y,30,0,Math.PI*2);c.stroke();}
 if(wreck){fx(c,'smokeHeavy',pivot.x,pivot.y-15,110,115,0,(1-wreck)*.5);fx(c,'fireGround',pivot.x,pivot.y,65,45,0,(1-wreck)*.6);}
 c.restore();
}

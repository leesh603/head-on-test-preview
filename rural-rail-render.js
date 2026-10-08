import {fx} from './fx-art.js?v=lc1';
import {getLocale} from './i18n.js?v=lc1';
import {RURAL_RAIL,RURAL_CARS} from './rural-rail-layout.js?v=lc1';
import {RAIL_GUN_RIGS,railRecoil,railSuspension,railGunMuzzle} from './rural-rail-artillery.js?v=lc1';
const circle=(c,x,y,r)=>{c.beginPath();c.arc(x,y,r,0,Math.PI*2);};
// Called with the body's translation already applied. Original RGBA car art.
export function drawRuralRail(c,b,images,wrecks){
 c.save();c.imageSmoothingEnabled=true;
 const cars=new Map((b.railCars||[]).map(p=>[p.id,p]));
 for(const spec of RURAL_CARS){const p=cars.get(spec.id);if(!p)continue;const dead=p.destroyed||b.destroying,im=dead?wrecks[spec.art]:images[spec.art];
  c.save();c.translate(p.x,p.y+(dead?0:railSuspension(b,spec.y/RURAL_RAIL.pitch)));c.rotate(p.angle||0);
  if(im?.naturalWidth)c.drawImage(im,-130,-195,260,390);
  if(dead){const age=p.detachedPose?.age??Math.max(0,(b.motionTime||0)-(p.destroyedAt||0));
   if(age<7){fx(c,'smokeDark',-12,-38-age*8,90,125,0,Math.max(.08,.42-age*.05));fx(c,'fireGround',10,32,35,48,0,Math.max(0,.7-age*.1));}
  }else if(p.hittable){
   if(p.gunFlash>0)fx(c,'muzzle',0,-145,27,43,p.shotAngle||0,Math.min(1,p.gunFlash/.08));
   // Brackets identify the currently exposed carriage, without covering its art.
   c.strokeStyle='#edc17ca8';c.lineWidth=1.5;
   for(const x of [-76,76])for(const y of [-173,173]){c.beginPath();c.moveTo(x,y-Math.sign(y)*14);c.lineTo(x,y);c.lineTo(x-Math.sign(x)*12,y);c.stroke();}
   if(p.hp<p.maxHp){c.fillStyle='#292e26';c.fillRect(-50,176,100,4);c.fillStyle='#d5ad6b';c.fillRect(-50,176,100*p.hp/p.maxHp,4);}
  }
  c.restore();
 }
 c.save();if(b.phase==='derailed'){c.translate(20,6);c.rotate(.12);}
 c.translate(0,b.destroying?0:railSuspension(b));
 const engine=b.destroying?wrecks.engine:images.engine,rig=RAIL_GUN_RIGS[b.assetKey];
 const layered=!b.destroying&&images.chassis?.naturalWidth&&images.gun?.naturalWidth&&rig;
 if(layered){
  const chassis=images.chassis,w=390*chassis.naturalWidth/chassis.naturalHeight;
  c.drawImage(chassis,-w/2,-195,w,390);
  const g=b.railGun||{},load=g.load||0,open=load>0?Math.sin(load*Math.PI):0;
  // The round slides only along the authored loading tray. Ammo starvation delays it.
  const start=g.manual?.62:.2,q=Math.max(0,Math.min(1,(load-start)/(.92-start)));
  if(load>start&&load<.92)fx(c,'shell',22*(1-q),rig.pivotY+62-48*q,13,34,0,.9);
  c.save();c.translate(0,rig.pivotY);c.rotate(g.angle||0);
  c.drawImage(images.gun,-rig.gunWidth/2,-rig.gunHeight*rig.anchor+railRecoil(b)+open*3,rig.gunWidth,rig.gunHeight);
  c.restore();
 }else if(engine?.naturalWidth)c.drawImage(engine,-130,-195,260,390);
 if(!b.destroying&&b.railGun){
  const p=railGunMuzzle(b),x=p.x-b.x,y=p.y-b.y-railSuspension(b),age=b.railGun.shotAge,heavy=b.assetKey==='lincomparable',a=(b.railGun.angle||0)-Math.PI/2;
  if(b.gunFlash>0)fx(c,'muzzleHeavy',x,y,heavy?94:67,heavy?120:84,a,Math.min(1,b.gunFlash/.1));
  if(age<.75){const q=age/.75;fx(c,'gunSmoke',x-12,y-22-q*42,58+q*52,65+q*80,a,(1-q)*.36);}
  if(age<.45){const q=age/.45;for(const side of [-1,1])fx(c,'dustPuff',side*60,100,48+q*42,28+q*24,0,(1-q)*.25);}
 }
 if(b.assetKey==='lincomparable'&&b.coreVulnerable&&b.recovery>0&&!b.destroying){
  c.strokeStyle='#bce5c9';c.lineWidth=2;for(const x of [-62,62]){c.beginPath();c.moveTo(x,-6);c.lineTo(x,65);c.lineTo(x-Math.sign(x)*14,65);c.stroke();}
  c.fillStyle='#bce5c9';c.font='bold 12px sans-serif';c.textAlign='center';c.fillText(getLocale()==='en'?'RELOAD':'재장전',0,92);
 }
 c.restore();c.restore();
}
export function drawRuralRailWarnings(c,b){
 if(!b.ruralRailBoss||b.dead)return;
 c.save();c.lineWidth=1.5;
 const pending=b.finalAim||b.aimPlan||(b.kind==='paris-gun'?b.barrage:null);
 if(pending){const plan=pending,heavy=b.kind==='lincomparable';
  c.strokeStyle=plan.blind?'#b7c1a899':'#f0c589bb';c.setLineDash([7,7]);
  for(const [i,p]of plan.points.entries()){
   if(i<(plan.index||0))continue;
   circle(c,p.x,p.y,plan.radius||88);c.stroke();
   if(!heavy){c.setLineDash([]);c.fillStyle='#f0cf91';c.font='bold 14px sans-serif';c.textAlign='center';c.fillText(String(i+1),p.x,p.y+5);c.setLineDash([7,7]);}
  }
  if(heavy){
   const p=plan.target;circle(c,p.x,p.y,plan.wave);c.stroke();c.setLineDash([]);
   c.fillStyle='#f0cf91';c.font='bold 13px sans-serif';c.textAlign='center';
   c.fillText(getLocale()==='en'?'1 IMPACT → 2 WAVE':'1 착탄 → 2 충격파',p.x,p.y-plan.radius-10);
   if(plan.final)c.fillText(getLocale()==='en'?(plan.locked?'AIM LOCKED':'AIM DRIFT'):(plan.locked?'조준 고정 · 급선회':'조준 이동 · 고정 후 이탈'),p.x,p.y+plan.radius+20);
   if(plan.smoke&&plan.mode!=='heavy-shell'){
    const smoke=plan.smoke;c.strokeStyle='#c6a680bb';c.setLineDash([5,6]);circle(c,smoke.x,smoke.y,smoke.radius);c.stroke();
    c.fillText(getLocale()==='en'?'3 RESIDUE':'3 잔류 위험',smoke.x,smoke.y+5);
    const dx=smoke.x-p.x,dy=smoke.y-p.y,len=Math.hypot(dx,dy)||1,d=plan.start-65;
    c.setLineDash([]);c.strokeStyle='#bce5c9';circle(c,p.x-dx/len*d,p.y-dy/len*d,16);c.stroke();
   }
  }
 }
 if(b.kind==='paris-gun'&&b.railGun.brakeAge<.65){const q=b.railGun.brakeAge/.65;
  for(const side of [-1,1])fx(c,'gunSmoke',b.x+side*(60+q*40),b.y+105,60+q*65,70+q*75,0,(1-q)*.32);
 }
 if(b.kind==='lincomparable'&&b.railGun.brakeAge<1.2){const q=b.railGun.brakeAge/1.2;for(const side of [-1,1])fx(c,'gunSmoke',b.x+side*(60+q*40),b.y+105,70+q*70,80+q*90,0,(1-q)*.34);}
 if(b.aaPlan){const rear=b.parts.get('car-rear'),x=b.x,y=b.y+rear.y-145,a=b.aaPlan.angle;
  c.setLineDash([5,7]);c.strokeStyle='#e9c38b99';for(const da of [-.14,0,.14]){c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(a+da)*230,y+Math.sin(a+da)*230);c.stroke();}
 }
 c.restore();
}
export function drawRuralRailHazard(c,h){
 if(!['rural-rail-shock','rural-rail-smoke'].includes(h.visual))return false;
 c.save();const warning=h.phase==='warning';
 if(h.visual==='rural-rail-shock'){
  c.strokeStyle=warning?'#f1c78fa8':'#f5dba6';c.lineWidth=warning?1.5:2.5;c.setLineDash(warning?[7,8]:[]);
  if(warning){circle(c,h.x,h.y,h.radiusLimit);c.stroke();circle(c,h.x,h.y,h.radiusStart);c.stroke();}
  else{const radius=h.radius,inner=h.innerRadius;c.fillStyle='#efd0a633';c.beginPath();c.arc(h.x,h.y,radius,0,Math.PI*2);c.arc(h.x,h.y,inner,0,Math.PI*2,true);c.fill();circle(c,h.x,h.y,radius);c.stroke();circle(c,h.x,h.y,inner);c.stroke();
   for(let i=0;i<12;i++){const a=i*Math.PI/6;fx(c,'smokeGray',h.x+Math.cos(a)*(inner+21),h.y+Math.sin(a)*(inner+21),48,48,a,.2);}
  }
 }else{
  c.strokeStyle=warning?'#b6b69ba8':'#c0b29866';c.lineWidth=1.5;c.setLineDash(warning?[5,7]:[]);circle(c,h.x,h.y,h.radius);c.stroke();
  if(!warning){const size=h.radius*2;fx(c,'smokeDark',h.x,h.y,size,size,0,.38);fx(c,'smokeGray',h.x-h.radius*.18,h.y-h.radius*.14,size*.75,size*.75,0,.32);}
 }
 c.restore();return true;
}

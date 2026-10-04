import {fx} from './fx-art.js?v=513';
import {getLocale} from './i18n.js?v=513';
import {RURAL_RAIL,RURAL_CARS} from './rural-rail-layout.js?v=513';
const circle=(c,x,y,r)=>{c.beginPath();c.arc(x,y,r,0,Math.PI*2);};
// Called with the body's translation already applied. Original RGBA car art.
export function drawRuralRail(c,b,images,wrecks){
 c.save();c.imageSmoothingEnabled=true;
 const cars=new Map((b.railCars||[]).map(p=>[p.id,p]));
 for(const spec of RURAL_CARS){const p=cars.get(spec.id);if(!p)continue;const dead=p.destroyed||b.destroying,im=dead?wrecks[spec.art]:images[spec.art];
  c.save();c.translate(p.x,p.y);c.rotate(p.angle||0);
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
 const engine=b.destroying?wrecks.engine:images.engine;if(engine?.naturalWidth)c.drawImage(engine,-130,-195,260,390);
 if(b.gunFlash>0)fx(c,'muzzle',0,RURAL_RAIL.muzzleY,75,100,-Math.PI/2,Math.min(1,b.gunFlash/.12));
 if(b.assetKey==='lincomparable'&&b.coreVulnerable&&b.recovery>0&&!b.destroying){
  c.strokeStyle='#bce5c9';c.lineWidth=2;for(const x of [-62,62]){c.beginPath();c.moveTo(x,-6);c.lineTo(x,65);c.lineTo(x-Math.sign(x)*14,65);c.stroke();}
  c.fillStyle='#bce5c9';c.font='bold 12px sans-serif';c.textAlign='center';c.fillText(getLocale()==='en'?'RELOAD':'재장전',0,92);
 }
 c.restore();c.restore();
}
export function drawRuralRailWarnings(c,b){
 if(!b.ruralRailBoss||b.dead)return;
 c.save();c.lineWidth=1.5;
 if(b.rail129.phase==='aim'&&b.aimPlan){const plan=b.aimPlan,heavy=b.kind==='lincomparable';
  c.strokeStyle=plan.blind?'#b7c1a899':'#f0c589bb';c.setLineDash([7,7]);
  for(const [i,p]of plan.points.entries()){
   circle(c,p.x,p.y,heavy?92:88);c.stroke();
   if(!heavy){c.setLineDash([]);c.fillStyle='#f0cf91';c.font='bold 14px sans-serif';c.textAlign='center';c.fillText(String(i+1),p.x,p.y+5);c.setLineDash([7,7]);}
  }
  if(heavy){circle(c,plan.target.x,plan.target.y,245);c.stroke();}
 }
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
  if(!warning){fx(c,'smokeDark',h.x,h.y,240,240,0,.38);fx(c,'smokeGray',h.x-24,h.y-18,180,180,0,.32);}
 }
 c.restore();return true;
}

// Read-only rendering of authored machinery and existing attack clocks.
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const coreBreaches=new WeakMap();
export function drawQfCoreBreach(c,atlas,scale){
 if(!atlas?.naturalWidth||typeof document==='undefined')return false;
 let poses=coreBreaches.get(atlas);if(!poses){poses=new Map();coreBreaches.set(atlas,poses);}let layer=poses.get(scale);
 if(!layer){
  const cv=document.createElement('canvas');cv.width=Math.ceil(150*scale);cv.height=Math.ceil(180*scale);const d=cv.getContext('2d');if(!d?.createRadialGradient)return false;
  d.translate(cv.width/2,cv.height/2);const size=380*scale;
  d.drawImage(atlas,0,0,atlas.naturalWidth/4,atlas.naturalHeight/2,-size*.89/2,-size*.92/2,size*.89,size*.92);
  d.globalCompositeOperation='destination-in';d.scale(cv.width/2,cv.height/2);const mask=d.createRadialGradient(0,0,.68,0,0,1);if(!mask?.addColorStop)return false;
  mask.addColorStop(0,'#fff');mask.addColorStop(1,'#fff0');d.fillStyle=mask;d.fillRect(-1,-1,2,2);layer=cv;poses.set(scale,layer);
 }
 c.drawImage(layer,-layer.width/2,-layer.height/2);return true;
}
export function cityWeaponSignals(body,hazards){
 const signals=new Map();
 hazards?.pool?.visit(h=>{
  if(h.bossId!==body.id||!h.sourcePartId||h.age<h.delay||!['projectile','searchlight','circle'].includes(h.kind))return;
  const elapsed=h.age-h.delay,after=elapsed-(h.kind==='circle'?0:h.warning),recoil=after>=0&&after<.2?1-after/.2:0,old=signals.get(h.sourcePartId);
  if(old)old.recoil=Math.max(old.recoil,recoil);
  if(old&&old.elapsed<elapsed-1e-6)return;
  const angle=h.kind==='searchlight'?h.angle:h.kind==='circle'?Math.atan2(h.y-h.sourceY,h.x-h.sourceX):Math.atan2(h.vy,h.vx);
  if(!Number.isFinite(angle))return;
  if(old&&Math.abs(old.elapsed-elapsed)<1e-6){old.dx+=Math.cos(angle);old.dy+=Math.sin(angle);old.angle=Math.atan2(old.dy,old.dx);return;}
  signals.set(h.sourcePartId,{angle,elapsed,dx:Math.cos(angle),dy:Math.sin(angle),recoil:Math.max(old?.recoil||0,recoil)});
 });return signals;
}
export const cityPartState=(body,p)=>p.destroyed||body.dead||body.destroying?2:p.hp<p.maxHp*.55?1:0;
export function drawParisMovingMount(c,b,p,atlas,signals){
 const state=cityPartState(b,p),light=p.id.startsWith('light-'),heavy=p.id.startsWith('aa-'),signal=signals.get(p.id),scale=b.geometryScale||1;
 const angle=state===2?0:wrap((signal?.angle??p.angle??-Math.PI/2)+Math.PI/2),height=(p.radius/scale)*(light?2:heavy?1.8:2),width=height*260/(light?286:heavy?338:326);
 const sy=light?18:heavy?320:674,sh=light?286:heavy?338:326;
 c.save();c.translate((p.localX??p.x)/scale,(p.localY??p.y)/scale);c.rotate(angle);
 if(!light)c.translate(0,state===2?0:(signal?.recoil||0)*(heavy?6:3));
 c.drawImage(atlas,[240,640,1040][state],sy,260,sh,-width/2,light?-height/2:-height*.02,width,height);c.restore();
}
export function staakenRackLoaded(body,p,hazards){
 if(p.destroyed||body.dead||body.destroying)return false;
 let dropped=false;hazards?.pool?.visit(h=>{if(h.bossId===body.id&&h.sourcePartId===p.id&&h.airborneBomb&&h.age>=h.delay)dropped=true;});
 // Only a rack that actually released ordnance is empty. The other rack
 // stays loaded; the existing next approach represents rearming.
 return !dropped;
}
export function drawStaakenPropellers(c,b,rotor){
 const s=b.geometryScale||1;
 for(const [i,p] of (b.parts||[]).filter(p=>p.kind==='engine').entries()){
  if(p.destroyed||b.destroying)continue;
  const x=(p.localX??p.x)/s,phase=(b.motionTime||0)*48+i*1.7;
  c.save();c.translate(x,-244);c.scale(1,.18);
  for(const [lag,alpha]of [[-.4,.14],[-.2,.23],[0,.88]]){c.save();c.globalAlpha*=alpha;c.rotate(phase+lag);c.drawImage(rotor,-71,-71,142,142);c.restore();}
  c.restore();
 }
}
export function drawQfWeapon(c,b,p,atlas,signals){
 if(!atlas?.naturalWidth||p.id==='ears')return false;
 const state=cityPartState(b,p),s=b.regionalScale||1,w=p.radius*2.6,h=w*.5,muzzle=30*s,recoil=state===2?0:(signals.get(p.id)?.recoil||0)*5*s;
 c.save();c.translate(p.x,p.y);c.rotate(p.angle+Math.PI/2);
 // Keep the carriage fixed. Only the registered upper barrel strip recoils.
 c.drawImage(atlas,state*192+18,110,174,82,-w*96/174,-h/2,w,h);
 c.drawImage(atlas,state*192+74,0,80,110,-w*.18,-muzzle+recoil,w*.36,muzzle+w*.18);
 c.restore();return true;
}

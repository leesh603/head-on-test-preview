// Optional authored hardware; all angles/times are read from committed hazards.
export const DOVER_HARDWARE_SOURCES=Object.freeze({deck:'https://head-on-aces.justzeon.chatgpt.site/dover-mount-decks-20261022.webp',hardware:'https://head-on-aces.justzeon.chatgpt.site/dover-hardware-20261022.webp'});
export const DOVER_DECK_FRAMES={"nighthawk": {"lamp": [0, 0, 108, 103], "davis-cannon": [128, 0, 116, 128], "gun-left": [256, 0, 121, 135], "gun-right": [384, 0, 121, 135]}, "rviii": {"gun-nose": [0, 144, 88, 134], "gun-dorsal": [128, 144, 88, 94], "gun-tail": [256, 144, 88, 100]}};
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
export const doverHardwarePart=id=>id==='lamp'||id==='davis-cannon'||id.startsWith('gun-');
export function doverHardwareSignals(body,hazards){
 const signals=new Map();
 hazards?.pool?.visit(h=>{
  if(h.bossId!==body.id||!doverHardwarePart(h.sourcePartId||'')||!['projectile','searchlight'].includes(h.kind)||h.age<h.delay)return;
  const elapsed=h.age-h.delay,old=signals.get(h.sourcePartId),after=elapsed-h.warning,recoil=after>=0&&after<.18?1-after/.18:0;
  if(old)old.recoil=Math.max(old.recoil,recoil);
  if(old&&old.elapsed<elapsed-1e-6)return;
  const angle=h.kind==='searchlight'?h.angle:Math.atan2(h.vy,h.vx);
  if(old&&Math.abs(old.elapsed-elapsed)<1e-6){old.dx+=Math.cos(angle);old.dy+=Math.sin(angle);old.angle=Math.atan2(old.dy,old.dx);return;}
  signals.set(h.sourcePartId,{angle,elapsed,dx:Math.cos(angle),dy:Math.sin(angle),recoil:Math.max(old?.recoil||0,recoil)});
 });return signals;
}
export function doverHardwarePose(b,p,signals){
 const signal=signals?.get(p.id),broken=p.destroyed||b.dead;
 const world=signal?.angle??(p.id==='lamp'&&Number.isFinite(p.angle)?p.angle:b.a+(p.id==='gun-tail'?Math.PI:0));
 return {state:broken?2:p.hp<p.maxHp*.55?1:0,angle:broken?(p.id==='gun-tail'?Math.PI:0):wrap(world-b.a),recoil:broken?0:signal?.recoil||0};
}
export function drawDoverHardware(c,b,p,atlas,signals){
 const pose=doverHardwarePose(b,p,signals),lamp=p.id==='lamp',cannon=p.id==='davis-cannon';
 const sx=[240,640,1040][pose.state],sy=lamp?18:cannon?320:674,sw=260,sh=lamp?286:cannon?338:326;
 const height=lamp?78:cannon?94:70,width=height*sw/sh,s=b.geometryScale||1;
 c.save();c.translate(p.localX/s,p.localY/s);c.rotate(pose.angle);
 // Weapon tips register to the existing physical shot origin. Recoil settles
 // the barrel behind that point only after the shot has already left it.
 c.translate(0,lamp?0:pose.recoil*(cannon?7:3));
 c.drawImage(atlas,sx,sy,sw,sh,-width/2,lamp?-height/2:-height*.02,width,height);
 c.restore();
}

// Rear-fire flashes. Berthold keeps the existing airframe without fabric.
export const CREW_SCAR_PILOTS=new Set(['huffzky','berthold']);
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const visible=p=>p?.hp>0&&p.status!=='downed';
export const crewScarArtReady=Promise.resolve([]);
export function rearGunnerPose(p){
 if(p.pilot!=='huffzky'||!visible(p)||!Number.isFinite(p.a))return null;
 const a=(Number.isFinite(p.nineRearAim)?p.nineRearAim:p.a+Math.PI)-p.a;
 const flash=clamp((p.nineRearFlash||0)/.1),kick=Math.sin(flash*Math.PI)*(p.skillTime>0?2.3:1.2);
 const mount=p.bomberTransfer?.rear??23,size=(p.bomberTransfer?.scale??1)*(p.aceScale129||1),reach=19*size;
 if(!Number.isFinite(mount))return null;
 // Muzzle rests on the real rear bullet origin; receiver sits inboard of it.
 return {a,x:-mount-Math.cos(a)*(reach+kick),y:-Math.sin(a)*(reach+kick),muzzleX:-mount-Math.cos(a)*kick,muzzleY:-Math.sin(a)*kick,flash,kick,size,reach};
}
export function bertholdSkinPose(p){
 if(p.pilot!=='berthold'||!visible(p)||!(p.maxHp>0))return null;
 const held=clamp((p.heldDamage||0)/(p.maxHp*.3)),damage=clamp(1-p.hp/p.maxHp);
 const cues=p.pilotSignatureState?.effects||[],hit=cues.find(e=>e.kind==='ironImpact'&&e.life>0),salvo=cues.find(e=>e.kind==='ironSalvo'&&e.life>0);
 const impact=hit?clamp(1-hit.age/.65):0,release=salvo?Math.sin(clamp(salvo.age/.38)*Math.PI):0;
 const strength=Math.max(held,damage*.65,impact*.35);
 if(strength<.035)return null;
 const t=p.pilotSignatureState?.clock||0,steady=p.skillTime>0&&!salvo;
 const flutter=(.35+strength*1.65)*(steady?.12:1),wave=Math.sin(t*24)+Math.sin(t*37)*.35;
 return {strength,held,steady,release,impact,flutter,angle:wave*flutter*.055+release*.24,extension:1+Math.sin(t*27)*flutter*.08+release*.32};
}
export function drawCrewScarLocal(c,p,tex){
 if(!CREW_SCAR_PILOTS.has(p.pilot)||!visible(p))return false;
 c.save();try{
 if(p.pilot==='huffzky'){
  const pose=rearGunnerPose(p);if(!pose)return true;
  // The rear station is already painted into the airframe. A detached weapon
  // overlay floats above it as aim changes; show only actual firing feedback.
  if(pose.flash>0)tex(c,'muzzleRear',pose.muzzleX+Math.cos(pose.a)*4,pose.muzzleY+Math.sin(pose.a)*4,p.skillTime>0?22:16,8,pose.a,.92*clamp(pose.flash*2));
  if(p.muzzleFlash>0){const a=(p.gunDirection?.(0)??p.a)-p.a;tex(c,'muzzleTwin',p.bomberTransfer?.front??23,0,18,8,a,.85*clamp(p.muzzleFlash/.05));}
 }
 }finally{c.restore();}return true;
}

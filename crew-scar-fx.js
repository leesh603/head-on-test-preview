import {drawBertholdCounterLocal} from './berthold-counter-fx.js';
// Authored firing feedback; no fabric cover or floating weapon overlay.
export const CREW_SCAR_PILOTS=new Set(['huffzky','berthold']);
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const visible=p=>p?.hp>0&&p.status!=='downed';
export const crewScarArtReady=Promise.resolve([]);
export function rearGunnerPose(p){
 if(p.pilot!=='huffzky'||!visible(p)||!Number.isFinite(p.a))return null;
 const a=(Number.isFinite(p.nineRearAim)?p.nineRearAim:p.a+Math.PI)-p.a;
 const flash=clamp((p.nineRearFlash||0)/.1),kick=Math.sin(flash*Math.PI)*(p.skillTime>0?2.3:1.2);
 const mount=p.bomberTransfer?.rear??-5,size=(p.bomberTransfer?.scale??1)*(p.aceScale129||1),reach=19*size;
 if(!Number.isFinite(mount))return null;
 // The Halberstadt observer sits just forward of sprite centre, not on the tail.
 // Heavy transfers retain their own rear port. Projectile origins stay unchanged.
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
 if(p.pilot==='berthold')return drawBertholdCounterLocal(c,p,tex);
 c.save();try{
 if(p.pilot==='huffzky'){
  const pose=rearGunnerPose(p);if(!pose)return true;
  // The rear station is already painted into the airframe. A detached weapon
  // overlay floats above it as aim changes; show only actual firing feedback.
  if(pose.flash>0){
   const age=(1-pose.flash)*.1,ca=Math.cos(pose.a),sa=Math.sin(pose.a),x=pose.muzzleX+ca*5,y=pose.muzzleY+sa*5,active=p.skillTime>0;
   tex(c,'muzzleRear',x,y,active?27:20,active?11:8,pose.a,.94*clamp(pose.flash*2));
   tex(c,'gunSmoke',x+ca*(7+age*30)-age*45,y+sa*(7+age*30),22+age*70,11+age*35,pose.a,.34*pose.flash);
   for(let i=0;i<(active?3:1);i++){
    const t=age+i*.018;
    tex(c,'bulletBrass',pose.muzzleX+3-t*32,pose.muzzleY+7+t*66,5.5,2.2,.5+t*13,.82*pose.flash*(1-i*.16));
   }
  }
  if(p.muzzleFlash>0){const a=(p.gunDirection?.(0)??p.a)-p.a;tex(c,'muzzleTwin',p.bomberTransfer?.front??23,0,18,8,a,.85*clamp(p.muzzleFlash/.05));}
 }
 }finally{c.restore();}return true;
}



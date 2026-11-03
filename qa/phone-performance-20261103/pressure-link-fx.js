// Real suppression, firing and kill-link observations. No combat fields are written.
import {signatureCue,signatureInterval} from './pilot-signature-state.js';
import {drawHawkerLinkedTarget} from './hawker-linked-view.js';
import {drawJacobsGunGas,drawJacobsHitDust,drawJacobsSuppressedFlow} from './jacobs-close-fire-fx.js';
export const PRESSURE_LINK_PILOTS=new Set(['jacobs','hawker']);
const INSTALLED=Symbol.for('headon.pressure-link-fx.v1');
const clamp=n=>Math.max(0,Math.min(1,n));
const owner=p=>p.id??'p1',world=p=>p.combatWorld?.()||p;
const live=p=>p?.hp>0&&p.status!=='downed';
const aircraft=e=>live(e)&&!e.crashing&&!e.crashed&&!e.expired&&!e.rivalEscaped&&!e.surface&&!e.fieldUnit&&!e.stageBossBody&&!e.navalVessel;
// Co-op assigns ownerId in emit(), after the round hook returns.
const personal=(p,b,preEmit=false)=>b&&(b.ownerId===undefined?preEmit||owner(p)==='p1':b.ownerId===owner(p))&&Number.isInteger(b.gun)&&!['enemy','ally','formation','patrol','rocket','cow37','motorCannon','mauserRound','blast','actualExplosion','identityDot','identityChain'].some(k=>b[k]);
let lewisImage;
export const pressureLinkArtReady=new Promise(resolve=>{
 if(typeof Image==='undefined'){resolve(false);return;}
 lewisImage=new Image();lewisImage.onload=()=>resolve(true);lewisImage.onerror=()=>resolve(false);
 lewisImage.src=new URL('./pilot-material-art/hawker-lewis.webp',import.meta.url).href;
});
export function installPressureLinkFx(Game){
 const q=Game.prototype;if(Object.hasOwn(q,INSTALLED))return;Object.defineProperty(q,INSTALLED,{value:true});
 const round=q.applySpecialRound;q.applySpecialRound=function(b,...args){const r=round.call(this,b,...args);
  if(PRESSURE_LINK_PILOTS.has(this.pilot)&&live(this)&&this.state==='playing'&&this.reloadTime<=0&&personal(this,b,true)&&signatureInterval(this,'pressureGun'+b.gun,.02)){
   const dx=b.x-this.x,dy=b.y-this.y,co=Math.cos(this.a),si=Math.sin(this.a);
   signatureCue(this,'pressureGun',{life:.28,x:b.x,y:b.y,a:Math.atan2(b.vy,b.vx),gun:b.gun,ownerId:owner(this),mountX:dx*co+dy*si,mountY:-dx*si+dy*co,activeFire:this.skillTime>0,linkedFire:this.pilot==='hawker'&&this.skillTime>0&&this.hawkerLinkTime>0});
  }return r;
 };
 const impact=q.identityImpact;q.identityImpact=function(b,e,target=e,pos=e){const r=impact.call(this,b,e,target,pos);
  if(PRESSURE_LINK_PILOTS.has(this.pilot)&&live(this)&&this.state==='playing'&&personal(this,b)&&signatureInterval(this,'pressureHit',.085)){
   const point=e?.stageBossBody?(pos||b):b;signatureCue(this,'pressureHit',{life:.24,x:point.x,y:point.y,a:Math.atan2(b.vy,b.vx),ownerId:owner(this)});
  }return r;
 };
}
export function pressureAirframePose(e,base,time){
 if(!aircraft(e)||e.pilotSuppressKind!=='jacobs'||!(e.pilotSuppressedUntil>time))return base;
 const strength=clamp((e.pilotSuppressedUntil-time)/.18),beat=Math.sin(time*29+e.a*2),bank=.74+.16*Math.cos(time*23)**2;
 return {...base,x:base.x-Math.sin(e.a)*beat*1.8*strength,y:base.y+Math.cos(e.a)*beat*1.8*strength,roll:base.roll+beat*.16*strength,bank:base.bank*(1-strength+bank*strength)};
}
export function hawkerLinkStrength(w,e){
 if(!aircraft(e))return 0;let strength=0;
 for(const p of w.players||[w])if(live(p)&&p.pilot==='hawker'&&p.hawkerNext===e&&p.hawkerLinkTime>0&&Math.hypot(e.x-p.x,e.y-p.y)<=500)strength=Math.max(strength,clamp(p.hawkerLinkTime/.25));
 return strength;
}
export function drawPressureEnemyFront(c,w,e,tex,scale=1,paintTint=null){
 drawJacobsSuppressedFlow(c,w,e,tex,scale);
 const strength=hawkerLinkStrength(w,e);if(!strength)return;
 c.save();try{c.rotate(-(e.a||0));drawHawkerLinkedTarget(c,w,e,scale);}finally{c.restore();}
}

function latestGun(p,gun){const cues=p.pilotSignatureState?.effects||[];for(let i=cues.length-1;i>=0;i--){const e=cues[i];if(e.kind==='pressureGun'&&e.life>0&&e.age>=0&&e.age<.085&&e.gun===gun&&e.ownerId===owner(p))return e;}}
export function hawkerGunPose(p){
 if(p.pilot!=='hawker'||!live(p))return null;
 const cue=latestGun(p,0),a=(cue?.a??p.gunDirection?.(0)??p.a)-p.a,scale=(p.bomberTransfer?.scale??1)*(p.aceScale129||1),reach=13*scale;
 const mx=cue?.mountX??p.bomberTransfer?.front??23,my=cue?.mountY??p.weapon?.sortieMuzzleSide??0,kick=cue?Math.sin(clamp(cue.age/.085)*Math.PI)*(cue.activeFire?2.2:1.4):0;
 return {a,x:mx-Math.cos(a)*(reach+kick),y:my-Math.sin(a)*(reach+kick),mx:mx-Math.cos(a)*kick,my:my-Math.sin(a)*kick,reach,scale,kick,activeFire:!!cue?.activeFire,linkedFire:!!cue?.linkedFire,flash:cue?clamp((.085-cue.age)/.045):0};
}
// Spent powder and cases stay at the recorded shot, independent of muzzle flash.
// A reload or the end of an active cannot erase a shot that already happened.
function drawHawkerSpent(c,p,e,tex){
 if(p.state!=='playing'||!Number.isFinite(e.maxLife)||![e.x,e.y,e.a,p.a].every(Number.isFinite))return;
 const age=e.age,q=clamp(age/.28),a=e.a-p.a,ca=Math.cos(a),sa=Math.sin(a),co=Math.cos(p.a),si=Math.sin(p.a),dx=e.x-p.x,dy=e.y-p.y,x=dx*co+dy*si,y=-dx*si+dy*co,side=e.gun%2?1:-1;
 if(age<.22){const fade=1-age/.22;tex(c,'gunSmoke',x+ca*6-age*34,y+sa*6,19+age*48,8+age*20,a,(e.linkedFire?.34:.22)*fade);}
 const back=age*27,out=4+age*65;
 tex(c,'bulletBrass',x-ca*back-sa*side*out,y-sa*back+ca*side*out,5,2.2,a+side*(.3+age*13),.8*(1-q));
}
export function jacobsFanAngles(p,gun=0){
 const list=world(p).bullets||[],out=[];
 for(let i=list.length-1;i>=0&&out.length<3;i--){const b=list[i];if(!personal(p,b)||b.gun!==gun||!b.jacobsSuppress||!(b.life>0)||Math.hypot(b.x-p.x,b.y-p.y)>80)continue;
  const a=Math.atan2(b.vy,b.vx)-p.a;if(!out.some(v=>Math.abs(v-a)<.006))out.push(a);
 }return out;
}
export function drawPressureLocal(c,p,tex){
 if(!PRESSURE_LINK_PILOTS.has(p.pilot)||!live(p))return false;
 if(p.pilot==='hawker'){
  const pose=hawkerGunPose(p);
  if(lewisImage?.complete&&lewisImage.naturalWidth){const h=20*pose.scale,w=h*lewisImage.naturalWidth/lewisImage.naturalHeight;c.save();try{c.translate(pose.x,pose.y);c.rotate(pose.a+Math.PI/2);c.drawImage(lewisImage,-w/2,-pose.reach,w,h);}finally{c.restore();}}
  if(pose.flash>0)tex(c,'muzzle',pose.mx+Math.cos(pose.a)*3,pose.my+Math.sin(pose.a)*3,pose.activeFire?29:17,pose.activeFire?11:7,pose.a,.9*pose.flash);
 }else for(let gun=0;gun<(p.weapon?.guns||2);gun++){
  const cue=latestGun(p,gun);if(!cue)continue;const angles=jacobsFanAngles(p,gun);if(!angles.length)angles.push(cue.a-p.a);
  for(const a of angles)tex(c,'muzzleTwin',cue.mountX+Math.cos(a)*3,cue.mountY+Math.sin(a)*3,angles.length>1?11:17,angles.length>1?4:7,a,.78*clamp((.085-cue.age)/.045));
 }
 const cues=p.pilotSignatureState?.effects||[];let spent=0;
 for(let i=cues.length-1;i>=0&&spent<12;i--){const e=cues[i];
  if(e.kind!=='pressureGun'||e.ownerId!==owner(p)||!(e.life>0)||!(e.age>=0&&e.age<.28))continue;
  spent++;if(p.pilot==='jacobs')drawJacobsGunGas(c,p,e,tex);else drawHawkerSpent(c,p,e,tex);
 }return true;
}
export function drawPressureCue(c,p,e,tex,front){
 if(!PRESSURE_LINK_PILOTS.has(p.pilot))return false;
 if(p.pilot==='jacobs'&&e.kind==='jacobsAngle'){
  if(front){const q=clamp(e.age/e.maxLife),a=e.a-p.a,fade=(1-q)**1.3;
   tex(c,'armorSpark',0,0,38-12*q,22-8*q,a,.96*fade);
   tex(c,'ricochet',q*10,0,30-8*q,13,a,.85*fade);
   tex(c,'gunSmoke',-q*13,0,34+q*22,18+q*12,a,.32*fade);
  }return true;
 }
 if(!front||e.kind!=='pressureHit')return true;
 const q=clamp(e.age/.24),a=e.a-p.a;
 if(p.pilot==='jacobs')for(const side of [-1,1])tex(c,'debris',-q*5,side*(2+q*8),9-q*4,4,a+side*q*.5,.8*(1-q));
 else tex(c,'ricochet',q*3,0,15-q*5,6,a,.75*(1-q));
 drawJacobsHitDust(c,p,e,tex,front);
 return true;
}

// Udet owns his graze/roll/counter loop. Host collision remains authoritative.
import {signatureCue,activatePilotSignature} from './pilot-signature-state.js';
import {PILOT_IDENTITY_COPY} from './pilot-identity-copy.js?v=headon-result339-20261028';

export const UDET_ACROBAT_BALANCE=Object.freeze({inner:14,outer:30,stacks:3,buffSeconds:6,grazeInterval:.22,damagePerStack:.08,turnPerStack:.08,rollSeconds:.42,counterSeconds:2.4,rollSpeed:.72,rollTurn:1.5,counterTurn:1.6,counterRatePerStack:.15,cooldown:18,wake:12,wakeLife:.44});
const privateStates=new WeakMap();
const live=p=>p.state==='playing'&&p.hp>0&&p.status!=='downed';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const local=p=>{let s=privateStates.get(p);if(!s){s={passes:new WeakMap(),frame:null};privateStates.set(p,s);}return s;};
export const udetState=p=>p.udetAcrobat??={clock:0,stacks:0,buffUntil:0,lastGrazeAt:-10,grazeCount:0,active:null,side:1,wake:[],muzzles:[],lastX:p.x,lastY:p.y,sampleAt:-10};
export const udetStacks=p=>{const f=p.udetAcrobat;return f&&f.buffUntil>f.clock?clamp(f.stacks,0,3):0;};
export function udetPhase(p){const f=p.udetAcrobat;if(!f?.active||!(p.skillTime>0)||f.clock>=f.active.until)return null;return f.clock<f.active.rollUntil?'roll':'counter';}
export function udetFlightModifiers(p){
 if(p.pilot!=='udet')return {speed:1,turn:1,rate:1};
 const phase=udetPhase(p),f=p.udetAcrobat,n=udetStacks(p);
 return {speed:phase==='roll'?.72:1,turn:(1+n*.08)*(phase==='roll'?1.5:phase==='counter'?1.6:1),rate:phase==='counter'?1+(f.active.spent||0)*.15:1};
}
export function advanceUdetReplica(p,dt){if(p.pilot==='udet'&&p.udetAcrobat&&live(p)&&Number.isFinite(dt)&&dt>0)p.udetAcrobat.clock+=Math.min(.04,dt);}
export function udetRollPose(p){const f=p.udetAcrobat;if(udetPhase(p)!=='roll')return {bank:1,roll:0,offset:0};const q=clamp((f.clock-f.active.at)/.42),a=q*Math.PI*2;return {bank:.3+.7*Math.abs(Math.cos(a)),roll:Math.sin(a)*.075*f.side,offset:Math.sin(a)*4*f.side};}
const personal=(p,b)=>b&&Number.isInteger(b.gun)&&(b.ownerId===undefined||b.ownerId===(p.id??'p1'))&&!['enemy','ally','patrol','formation','rocket','motorCannon','cow37','actualExplosion','blast','mauserRound','identityDot','identityChain'].some(k=>b[k]);
const hostile=b=>b?.enemy&&b.life>0&&Number.isFinite(b.damage)&&b.damage>0&&[b.x,b.y,b.vx,b.vy].every(Number.isFinite)&&Math.hypot(b.vx,b.vy)>1&&!['heavy','flak','naval','navalShell','fieldShell','shell','bomb','rocket','hostileRocket','actualExplosion','blast','torpedo','incendiary','gas','beam'].some(k=>b[k])&&!(b.collisionRadius>4);

// Called only after the real swept collision resolver has accepted/rejected hits.
export function observeUdetPass(p,b,x0,y0){
 if(p?.pilot!=='udet'||!hostile(b)||![x0,y0].every(Number.isFinite))return false;
 const f=udetState(p),s=local(p),start=s.frame||{x:p.x,y:p.y,invuln:p.invuln,hp:p.hp,evade:p.evadeTime};
 const moved=Math.hypot(p.x-start.x,p.y-start.y),rx=x0-start.x,ry=y0-start.y,ex=b.x-p.x,ey=b.y-p.y,dx=ex-rx,dy=ey-ry,len=dx*dx+dy*dy;
 if(len<1e-8)return false;
 const q=clamp(-(rx*dx+ry*dy)/len),cx=rx+dx*q,cy=ry+dy*q,d=Math.hypot(cx,cy);
 let pass=s.passes.get(b);if(!pass&&d>UDET_ACROBAT_BALANCE.outer)return false;
 if(!pass){pass={approach:false,min:Infinity,done:false};s.passes.set(b,pass);}if(pass.done)return false;
 if(!live(p)||p.mission?.unarmed||p.bomberTransfer||p.isBomberEntering?.()||p.heineckeEscape>0||p.invuln>0||start.invuln>0||p.evadeTime>0||start.evade>0||moved>120||p.hp<start.hp||d<=UDET_ACROBAT_BALANCE.inner){pass.done=true;return false;}
 if(rx*dx+ry*dy<0)pass.approach=true;
 if(d<pass.min){pass.min=d;pass.x=x0+(b.x-x0)*q;pass.y=y0+(b.y-y0)*q;}
 if(!pass.approach||ex*dx+ey*dy<=0)return false;
 pass.done=true;
 if(pass.min>UDET_ACROBAT_BALANCE.outer||f.clock-f.lastGrazeAt<UDET_ACROBAT_BALANCE.grazeInterval)return false;
 f.lastGrazeAt=f.clock;f.stacks=Math.min(3,udetStacks(p)+1);f.buffUntil=f.clock+6;f.grazeCount++;
 signatureCue(p,'udetGraze',{x:pass.x,y:pass.y,a:Math.atan2(b.vy,b.vx),life:.42,count:f.stacks});
 return true;
}
function tick(p,dt,input){
 const f=udetState(p),s=local(p);f.clock+=dt;p.fxOverheat=0;p.udetDanger=false;
 s.frame={x:p.x,y:p.y,invuln:p.invuln,hp:p.hp,evade:p.evadeTime};
 if(f.buffUntil<=f.clock)f.stacks=0;
 if(f.active&&(p.skillTime<=0||f.clock>=f.active.until))f.active=null;
 const phase=udetPhase(p);if(f.active&&phase==='counter'&&!f.active.counterShown){f.active.counterShown=true;signatureCue(p,'udetCounter',{life:.58,signatureStart:true,count:f.active.spent});}
 const yaw=Number.isFinite(input.angle)?Math.atan2(Math.sin(input.angle-p.a),Math.cos(input.angle-p.a)):input.steer||0;
 if(phase!=='roll'&&Math.abs(yaw)>.05)f.side=Math.sign(yaw);
 const moved=Math.hypot(p.x-f.lastX,p.y-f.lastY);f.lastX=p.x;f.lastY=p.y;
 let kept=0;for(const v of f.wake)if(f.clock-v.at<.44)f.wake[kept++]=v;f.wake.length=kept;
 if(moved>120)f.wake.length=0;
 if((phase||udetStacks(p)>0)&&moved>.5&&moved<120&&f.clock-f.sampleAt>=.04){f.sampleAt=f.clock;if(f.wake.length===12)f.wake.shift();f.wake.push({x:p.x,y:p.y,a:p.a,at:f.clock,phase,side:f.side});}
 return udetFlightModifiers(p);
}
export function installUdetAcrobatics(Game,PILOTS){
 const q=Game.prototype;
 const copy=PILOT_IDENTITY_COPY.udet.ko;Object.assign(PILOTS.udet,{passive:copy.passive,passiveDesc:copy.passiveDetail,skill:copy.skill,desc:copy.activeDetail,cooldown:18});
 const duration=q.skillDuration;q.skillDuration=function(){return this.pilot==='udet'?.42+2.4*(this.skillEnhanced?1.35:1):duration.call(this);};
 const skill=q.skill;q.skill=function(){
  if(this.pilot!=='udet')return skill.call(this);
  // Airframe conversion replaces evade with defensive fire, while retaining
  // the selected pilot's active, including during the arrival animation.
  if(!live(this)||this.cooldown>0||this.mission?.unarmed||this.heineckeEscape>0)return false;
  this.ensureRevisionPilot();const f=udetState(this),spent=udetStacks(this),duration=this.skillDuration();
  f.stacks=0;f.buffUntil=0;f.active={at:f.clock,rollUntil:f.clock+.42,until:f.clock+duration,spent,counterShown:false};
  this.skillTime=duration;this.cooldown=this.skillCooldown();this.invuln=Math.max(this.invuln,.42);this.udetBoost=0;this.fxOverheat=0;this.udetDanger=false;
  activatePilotSignature(this);this.event('skill',PILOTS.udet.skill);return true;
 };
 const begin=q.beginRevisionFrame;q.beginRevisionFrame=function(dt,input={}){
  const prior=begin.call(this,dt,input);
  if(this.pilot==='udet'&&live(this)&&Number.isFinite(dt)&&dt>0){const mods=tick(this,Math.min(.04,dt),input);this.baseSpeed*=mods.speed;this.speed*=mods.speed;this.turn*=mods.turn;this.rate/=mods.rate;
   if(udetPhase(this)==='roll'){prior.fire=this.fire;this.fire=Math.max(this.fire,Math.min(.04,dt)+.03);}
  }return prior;
 };
 const resolve=q.resolveHostileRound;q.resolveHostileRound=function(b,x,y){const result=resolve.call(this,b,x,y);if(b.life>0)observeUdetPass(this,b,x,y);return result;};
 const round=q.applySpecialRound;q.applySpecialRound=function(b,type){const result=round.call(this,b,type);
  if(this.pilot==='udet'&&live(this)&&personal(this,b)){
   const f=udetState(this),n=udetStacks(this);b.udetGrazeDamage=1+n*.08;
   if(this.reloadTime<=0&&!this.cow37&&udetPhase(this)!=='roll'){const old=f.muzzles[b.gun];if(!old||f.clock-old.at>=.045){f.muzzles[b.gun]={at:f.clock};if(n||udetPhase(this)==='counter')signatureCue(this,'udetBrass',{x:b.x-Math.cos(this.a)*10,y:b.y-Math.sin(this.a)*10,a:Math.atan2(b.vy,b.vx),side:b.gun%2?1:-1,life:.32});}}
  }return result;
 };
 const damage=q.roundDamageMultiplier;q.roundDamageMultiplier=function(b,e){return damage.call(this,b,e)*(this.pilot==='udet'&&personal(this,b)?b.udetGrazeDamage||1:1);};
 const received=q.buildReceivedDamage;q.buildReceivedDamage=function(before){const result=received.call(this,before);if(this.pilot==='udet'&&this.hp<before){const f=udetState(this);f.stacks=0;f.buffUntil=0;}return result;};
 const legacy=q.identityFx;q.identityFx=function(key,x,y,a,size,life,style={}){return legacy.call(this,key,x,y,a,size,life,this.pilot==='udet'?{...style,udetLegacy:true}:style);};
 q.resetUdetAcrobatics=function(){if(this.pilot==='udet'){privateStates.delete(this);delete this.udetAcrobat;delete this.pilotSignatureState;this.fxOverheat=0;this.udetDanger=false;this.udetBoost=0;}};
}
export function installUdetCoop(CoopGame){const q=CoopGame.prototype,resolve=q.resolveHostileRound;q.resolveHostileRound=function(b,x,y){const result=resolve.call(this,b,x,y);if(b.life>0)for(const p of this.players)observeUdetPass(p,b,x,y);return result;};}

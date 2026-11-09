// Loewenhardt: presentation observes the existing frontal bonus and ascent.
import {signatureCue,signatureInterval,activatePilotSignature} from './pilot-signature-state.js';
export const LOEW_FX_PALETTE=Object.freeze({gold:'#e9bb48',ivory:'#fff1ba',ochre:'#b48236',smoke:'#c2b18f'});
export const LOEW_FX_LIMITS=Object.freeze({wake:10,wakeLife:.42,sampleInterval:.045,shotInterval:.045});
const clamp=n=>Math.max(0,Math.min(1,n));
const alive=p=>p.state==='playing'&&p.hp>0&&p.status!=='downed';
const state=p=>p.loewAscentFx??={clock:0,wake:[],muzzles:[],lastX:p.x,lastY:p.y,sampleAt:-10};
const personal=(p,b)=>b&&Number.isInteger(b.gun)&&(b.ownerId===undefined||b.ownerId===(p.id??'p1'))&&!['enemy','ally','patrol','formation','rocket','motorCannon','cow37','actualExplosion','blast','mauserRound','fonckSeeker','identityDot','identityChain'].some(k=>b[k]);
// Match the existing damage rule: current owner position, target center, 420 range
// and a forward 120-degree sector. No new target-heading requirement is added.
export function loewFrontalFx(p,e){if(!e)return false;const dx=e.x-p.x,dy=e.y-p.y,a=Math.atan2(dy,dx)-p.a;return dx*dx+dy*dy<=420*420&&Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<Math.PI/3;}
function advance(p,dt){
 if(!alive(p)||!Number.isFinite(dt)||dt<=0)return;
 const f=state(p);f.clock+=Math.min(.04,dt);let kept=0;
 for(const v of f.wake)if(f.clock-v.at<.42)f.wake[kept++]=v;f.wake.length=kept;
 const moved=Math.hypot(p.x-f.lastX,p.y-f.lastY);f.lastX=p.x;f.lastY=p.y;
 if(moved>120){f.wake.length=0;f.sampleAt=-10;}
 if(p.skillTime>0&&moved>.5&&moved<120&&f.clock-f.sampleAt>=.045){f.sampleAt=f.clock;if(f.wake.length===10)f.wake.shift();f.wake.push({x:p.x,y:p.y,a:p.a,at:f.clock,phase:p.aceSkillPhase});}
}
export function installLoewenhardtFx(Game){
 const q=Game.prototype,begin=q.beginRevisionFrame;
 q.beginRevisionFrame=function(dt,input={}){const result=begin.call(this,dt,input);if(this.pilot==='loewenhardt')advance(this,dt);return result;};
 const skill=q.skill;q.skill=function(){const used=skill.call(this);if(used&&this.pilot==='loewenhardt'){state(this);activatePilotSignature(this);}return used;};
 const round=q.applySpecialRound;q.applySpecialRound=function(b,type){const result=round.call(this,b,type);
  if(this.pilot==='loewenhardt'&&alive(this)&&this.reloadTime<=0&&!this.cow37&&personal(this,b)){
   const f=state(this),last=f.muzzles[b.gun];if(!last||f.clock-last.at>=.045){f.muzzles[b.gun]={at:f.clock};if(this.skillTime>0||this.loewenhardtEngaged)signatureCue(this,'loewBrass',{x:b.x-Math.cos(this.a)*10,y:b.y-Math.sin(this.a)*10,a:Math.atan2(b.vy,b.vx),side:b.gun%2?1:-1,life:.32});}
  }return result;
 };
 const impact=q.identityImpact;q.identityImpact=function(b,e,target,position){const result=impact.call(this,b,e,target,position);
  if(this.pilot==='loewenhardt'&&alive(this)&&personal(this,b)&&(b.ownerId??'p1')===(this.id??'p1')&&loewFrontalFx(this,e)&&signatureInterval(this,'loewFrontHit',.09)){
   const pos=e.stageBossBody?(position||b):b;signatureCue(this,'loewFrontHit',{x:pos.x,y:pos.y,a:Math.atan2(b.vy,b.vx),life:.32});
  }return result;
 };
 const legacy=q.identityFx;q.identityFx=function(key,x,y,a,size,life,style={}){return legacy.call(this,key,x,y,a,size,life,this.pilot==='loewenhardt'&&['windStreak','mist','muzzle','muzzleTwin','gunSmoke'].includes(key)?{...style,loewLegacy:true}:style);};
 q.resetLoewenhardtFx=function(){if(this.pilot==='loewenhardt'){delete this.loewAscentFx;delete this.pilotSignatureState;}};
}
export function drawLoewWake(c,p,tex){const f=p.loewAscentFx;if(!f)return;
 for(let i=0;i<f.wake.length;i++){const v=f.wake[i],q=clamp((f.clock-v.at)/.42),ca=Math.cos(v.a),sa=Math.sin(v.a),dx=v.x-p.x,dy=v.y-p.y;
  if(v.phase==='vertical-fire'){
   // A broad, broken central ribbon contrasts with the other pilots' twin wakes.
   if(i%2===0){tex(c,'smokeTrail',dx-ca*(30+q*12),dy-sa*(30+q*12),62+q*17,15+q*9,v.a,.33*(1-q),LOEW_FX_PALETTE.gold);tex(c,'vaporTrail',dx-ca*(30+q*12),dy-sa*(30+q*12),64,7,v.a,.42*(1-q),LOEW_FX_PALETTE.ivory);}
  }else if(i%2===0)tex(c,'mist',dx+ca*19,dy+sa*19,47+q*17,28+q*13,v.a,.29*(1-q),LOEW_FX_PALETTE.smoke);
 }
}
export function drawLoewLocal(c,p,tex,front=false){const f=p.loewAscentFx;if(!f)return;const active=p.skillTime>0,climbing=active&&p.aceSkillPhase==='vertical-fire';
 if(front){
  if(active)for(const side of [-1,1])tex(c,'mist',4,side*31,climbing?42:48,climbing?13:17,side*.18,climbing?.24:.31,LOEW_FX_PALETTE.ivory);
  if(p.reloadTime>0||p.cow37||!(active||p.loewenhardtEngaged))return;
  const count=Math.min(8,p.weapon?.guns||1),ca=Math.cos(p.a),sa=Math.sin(p.a);
  for(let gun=0;gun<count;gun++){const shot=f.muzzles[gun],age=shot?f.clock-shot.at:Infinity;if(age<0||age>.055)continue;
   const a=p.gunDirection?.(gun)??p.a,offset=p.weapon?.bidirectional?0:(gun-(count-1)/2)*8,m=p.bomberGunMount(gun,a,offset),dx=m.x-p.x,dy=m.y-p.y,x=dx*ca+dy*sa,y=-dx*sa+dy*ca,heading=a-p.a;
   tex(c,'muzzle',x+Math.cos(heading)*10,y+Math.sin(heading)*10,climbing?43:31,climbing?18:13,heading,.95*(1-age/.055),climbing?LOEW_FX_PALETTE.ivory:LOEW_FX_PALETTE.gold);
   if(climbing)tex(c,'gunSmoke',x+Math.cos(heading)*19,y+Math.sin(heading)*19,42,16,heading,.29*(1-age/.055),LOEW_FX_PALETTE.ochre);
  }return;
 }
 if(active&&!climbing){for(const side of [-1,1])tex(c,'mist',12,side*32,68,27,side*.32,.55,side<0?LOEW_FX_PALETTE.gold:LOEW_FX_PALETTE.ivory);}
 else if(climbing){const phase=(f.clock*2.4)%1;
  for(const side of [-1,1]){tex(c,'windStreak',-12-phase*20,side*(31+phase*7),88,13,side*(.34-phase*.23),.70*(1-phase*.35),side<0?LOEW_FX_PALETTE.gold:LOEW_FX_PALETTE.ivory);tex(c,'mist',2,side*31,48,20,side*.2,.38,LOEW_FX_PALETTE.ivory);}
 }else if(p.loewenhardtEngaged)for(const side of [-1,1]){tex(c,'mist',5,side*31,38,13,side*.12,.30,LOEW_FX_PALETTE.gold);tex(c,'vaporTrail',-18,side*29,29,5,0,.27,LOEW_FX_PALETTE.ivory);}
}
export function drawLoewCue(c,p,e,tex,front){const q=clamp(e.age/e.maxLife),fade=1-q,a=e.a-p.a;
 if(e.kind==='loewBrass'){if(front)tex(c,'bulletBrass',-e.age*36,e.side*(6+e.age*62),6,2.6,a+e.age*13,.8*fade,LOEW_FX_PALETTE.gold);return true;}
 if(e.kind==='loewFrontHit'){
  if(front){tex(c,'ricochet',0,0,43+q*16,22,a,.95*fade,LOEW_FX_PALETTE.gold);tex(c,'spark',0,0,21,12,a,.90*fade,LOEW_FX_PALETTE.ivory);tex(c,'gunSmoke',-q*10,0,31+q*16,19,a,.30*fade,LOEW_FX_PALETTE.smoke);}return true;
 }
 if(e.kind==='climbingAttack'){
  if(!front)for(const side of [-1,1])tex(c,'mist',8-q*12,side*(22-q*8),62+q*15,25,side*.3,.43*fade,side<0?LOEW_FX_PALETTE.gold:LOEW_FX_PALETTE.ivory);return true;
 }
 if(e.kind==='climbSalvo'){
  // Only the actual phase transition is a launch cue. Legacy generic hit
  // reactions must never draw a muzzle at the struck enemy.
  if(!front&&e.signatureStart)for(const side of [-1,1]){tex(c,'airblast0',-22-q*35,side*(15+q*13),90+q*20,25,side*.25,.55*fade,side<0?LOEW_FX_PALETTE.gold:LOEW_FX_PALETTE.ivory);tex(c,'vaporTrail',-45-q*28,side*15,75,8,0,.45*fade,LOEW_FX_PALETTE.ivory);}return true;
 }
 return false;
}

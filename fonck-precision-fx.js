// Fonck: presentation follows the existing steady lead and finite piercing volley.
import {signatureState,signatureCue,signatureInterval,activatePilotSignature} from './pilot-signature-state.js';
export const FONCK_FX_PALETTE=Object.freeze({blue:'#9bbbc9',red:'#cf806b',ivory:'#f4e9cd',brass:'#c5a268',smoke:'#84928f'});
const clamp=n=>Math.max(0,Math.min(1,n));
const live=p=>p.state==='playing'&&p.hp>0&&p.status!=='downed';
const state=p=>p.fonckPrecisionFx??={muzzles:[],ready:false};
const gun=(p,b)=>b&&Number.isInteger(b.gun)&&b.gun>=0&&b.gun<8&&(b.ownerId===undefined||b.ownerId===(p.id??'p1'))&&!['enemy','ally','patrol','formation','rocket','motorCannon','cow37','actualExplosion','blast','mauserRound','identityDot','identityChain','fonckSeeker'].some(k=>b[k]);
export function fonckFocus(p){const s=p.pilotIdentity;return s?.target?.hp>0?clamp(s.focus||0):0;}
export function installFonckPrecisionFx(Game){
 const q=Game.prototype,begin=q.beginRevisionFrame;
 q.beginRevisionFrame=function(dt,input={}){const result=begin.call(this,dt,input);
  if(this.pilot==='fonck'&&live(this)&&Number.isFinite(dt)&&dt>0){const f=state(this),ready=fonckFocus(this)>=.8;
   if(ready&&!f.ready)signatureCue(this,'fonckReady',{life:.35,signatureStart:true});f.ready=ready;
  }return result;
 };
 const skill=q.skill;q.skill=function(){const used=skill.call(this);if(used&&this.pilot==='fonck'){state(this);activatePilotSignature(this);}return used;};
 const round=q.applySpecialRound;q.applySpecialRound=function(b,type){const result=round.call(this,b,type);
  if(this.pilot==='fonck'&&live(this)&&this.reloadTime<=0&&gun(this,b)){
   const f=state(this),clock=signatureState(this).clock,last=f.muzzles[b.gun];
   if(!last||clock-last.at>=.025){const precise=b.fiveAcePhase==='precision';f.muzzles[b.gun]={at:clock,a:Math.atan2(b.vy,b.vx),precise};
    const a=Math.atan2(b.vy,b.vx);
    signatureCue(this,'fonckBrass',{x:b.x-Math.cos(a)*12,y:b.y-Math.sin(a)*12,a,side:b.gun%2?1:-1,life:.28,precise});
   }
  }return result;
 };
 const hit=q.identityImpact;q.identityImpact=function(b,e,target,pos){const result=hit.call(this,b,e,target,pos);
  if(this.pilot==='fonck'&&live(this)&&gun(this,b)&&(b.ownerId??'p1')===(this.id??'p1')&&signatureInterval(this,'fonckImpact',.045)){
   const point=e?.stageBossBody?(pos||b):b;signatureCue(this,'fonckImpact',{x:point.x,y:point.y,a:Math.atan2(b.vy,b.vx),life:.30,precise:b.fiveAcePhase==='precision'});
  }return result;
 };
 const legacy=q.identityFx;q.identityFx=function(key,x,y,a,size,life,style={}){return legacy.call(this,key,x,y,a,size,life,this.pilot==='fonck'&&['muzzle','muzzleTwin','gunSmoke','armorSpark'].includes(key)?{...style,fonckLegacy:true}:style);};
 q.resetFonckPrecisionFx=function(){if(this.pilot==='fonck'){delete this.fonckPrecisionFx;delete this.pilotSignatureState;}};
}
export function drawFonckLocal(c,p,tex,front=false){
 const f=p.fonckPrecisionFx,s=p.pilotSignatureState;if(!f||!s)return;
 const five=p.pilotIdentity?.five,prepare=p.skillTime>0&&five?.active&&five.age<.18;
 // The enemy's brass sight owns focus. The wings stay clean during preparation.
 if(!front)return;
 if(p.reloadTime>0)return;
 const count=Math.min(8,p.weapon?.guns||1),ca=Math.cos(p.a),sa=Math.sin(p.a);
 for(let g=0;g<count;g++){
  const offset=p.weapon?.bidirectional?0:(g-(count-1)/2)*8,ga=p.gunDirection?.(g)??p.a,m=p.bomberGunMount(g,ga,offset),dx=m.x-p.x,dy=m.y-p.y,x=dx*ca+dy*sa,y=-dx*sa+dy*ca;
  if(prepare)tex(c,'metalShard0',x+Math.cos(ga-p.a)*5,y+Math.sin(ga-p.a)*5,12,2.5,ga-p.a,.35+.35*clamp(five.age/.18),FONCK_FX_PALETTE.brass);
  const shot=f.muzzles[g],age=shot?s.clock-shot.at:Infinity;if(age<0||age>.085)continue;
  const a=shot.a-p.a,fade=1-age/.085;
  tex(c,'muzzle',x+Math.cos(a)*9,y+Math.sin(a)*9,shot.precise?33:25,shot.precise?12:9,a,.92*fade,FONCK_FX_PALETTE.ivory);
  if(shot.precise)tex(c,'gunSmoke',x+Math.cos(a)*12,y+Math.sin(a)*12,29,10,a,.32*fade,FONCK_FX_PALETTE.smoke);
 }
}
export function drawFonckCue(c,p,e,tex,front){const q=clamp(e.age/e.maxLife),fade=1-q,a=e.a-p.a;
 if(e.kind==='sightConverge')return true; // Preparation is driven by the actual .18s firing delay.
 if(e.kind==='fonckReady')return true; // Readiness is shown at the actual target.
 if(e.kind==='fonckBrass'){if(front){const back=-e.age*24,side=e.side*(5+e.age*65);tex(c,'bulletBrass',Math.cos(a)*back-Math.sin(a)*side,Math.sin(a)*back+Math.cos(a)*side,e.precise?7:5,2.5,a+e.age*11,.8*fade,FONCK_FX_PALETTE.brass);}return true;}
 if(e.kind==='fonckImpact'){
  if(front){tex(c,'ricochet',0,0,e.precise?54+q*14:27, e.precise?17:13,a,.94*fade,FONCK_FX_PALETTE.ivory);
   tex(c,'gunSmoke',-Math.cos(a)*q*12,-Math.sin(a)*q*12,e.precise?44:25,e.precise?24:16,a,.40*fade,FONCK_FX_PALETTE.blue);
   if(e.precise)for(const side of [-1,1]){const d=q*19;tex(c,'metalShard'+(side>0?0:1),-Math.cos(a)*d-Math.sin(a)*side*d,-Math.sin(a)*d+Math.cos(a)*side*d,8,4,a+side*q*3,.75*fade,FONCK_FX_PALETTE.red);}
  }return true;
 }
 return false;
}

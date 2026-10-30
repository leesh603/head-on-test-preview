// Ball's cloud deception and Barker's battle damage: presentation only.
// Observe the completed combat layers; use their real shots, impacts and states.
import {signatureCue,signatureInterval,activatePilotSignature} from './pilot-signature-state.js';

export const SORTIE_PILOTS=new Set(['ball','barker']);
export const SORTIE_FX_LIMITS=Object.freeze({wake:12,wakeLife:.48,sampleInterval:.045,shotInterval:.045});
export const SORTIE_PALETTES=Object.freeze({
 ball:Object.freeze({edge:'#bda8cb',core:'#e9e6ef',smoke:'#74677e',spark:'#efe0c5'}),
 barker:Object.freeze({edge:'#a44c43',core:'#efc984',smoke:'#51474a',spark:'#e69b50'})
});
const clamp=n=>Math.max(0,Math.min(1,n));
const world=p=>p.combatWorld?.()||p;
const alive=p=>p.state==='playing'&&p.hp>0&&p.status!=='downed';
const state=p=>p.sortieFlightFx??={clock:0,wake:[],muzzles:[],sampleAt:-Infinity,lastX:p.x,lastY:p.y};
const personal=(p,b)=>b&&Number.isInteger(b.gun)&&(b.ownerId===undefined||b.ownerId===(p.id??'p1'))&&!['enemy','ally','patrol','formation','rocket','motorCannon','cow37','actualExplosion','blast','mauserRound','identityDot','identityChain'].some(k=>b[k]);
// Match the existing normalGunMultiplier's lone-hunter condition, including patrols.
export function ballLoneFx(p){
 const w=world(p);
 return ![...(w.allies||[]),...(w.patrols||[])].some(a=>a.life>0&&(a.hp===undefined||a.hp>0)&&Math.hypot(a.x-p.x,a.y-p.y)<320)
  &&!(w.players||[]).some(a=>a!==p&&a.hp>0&&a.status!=='downed'&&Math.hypot(a.x-p.x,a.y-p.y)<320);
}
const strength=p=>p.pilot==='ball'?(p.ballAmbush>0&&ballLoneFx(p)?1:0):Math.min(5,p.barkerStacks||0)/5;
function advance(p,dt){
 if(!alive(p)||!Number.isFinite(dt)||dt<=0)return;
 const f=state(p);f.clock+=Math.min(.05,dt);
 let kept=0;for(const v of f.wake)if(f.clock-v.at<SORTIE_FX_LIMITS.wakeLife)f.wake[kept++]=v;f.wake.length=kept;
 const moved=Math.hypot(p.x-f.lastX,p.y-f.lastY);f.lastX=p.x;f.lastY=p.y;
 if(moved>100){f.wake.length=0;f.sampleAt=-Infinity;}
 const stage=Math.min(5,Math.max(p.barkerStacks||0,p.barkerDamageStage||0,p.barkerScarStage||0));
 const visible=p.pilot==='ball'?p.ballCloak>0||p.ballAmbush>0&&ballLoneFx(p):stage>0||p.skillTime>0;
 if(visible&&moved>.5&&f.clock-f.sampleAt>=SORTIE_FX_LIMITS.sampleInterval){
  f.sampleAt=f.clock;if(f.wake.length===SORTIE_FX_LIMITS.wake)f.wake.shift();
  f.wake.push({x:p.x,y:p.y,a:p.a,at:f.clock,cloaked:p.ballCloak>0,stage});
 }
}
export function installCloudSurvivalFx(Game){
 const q=Game.prototype,frame=q.beginRevisionFrame;
 q.beginRevisionFrame=function(dt,input={}){const result=frame.call(this,dt,input);if(SORTIE_PILOTS.has(this.pilot))advance(this,dt);return result;};
 const skill=q.skill;
 q.skill=function(){const used=skill.call(this);if(used&&SORTIE_PILOTS.has(this.pilot)){state(this);activatePilotSignature(this);}return used;};
 const legacy=q.identityFx;
 q.identityFx=function(key,x,y,a,size,life,style={}){return legacy.call(this,key,x,y,a,size,life,SORTIE_PILOTS.has(this.pilot)?{...style,sortiePilotLegacy:true}:style);};
 const round=q.applySpecialRound;
 q.applySpecialRound=function(b,type){const result=round.call(this,b,type);
  if(SORTIE_PILOTS.has(this.pilot)&&alive(this)&&personal(this,b)&&this.reloadTime<=0&&!this.cow37&&!(this.ballCloak>0)){
   const f=state(this),prior=f.muzzles[b.gun];
   if(!prior||f.clock-prior.at>=SORTIE_FX_LIMITS.shotInterval){
    f.muzzles[b.gun]={at:f.clock,a:Math.atan2(b.vy,b.vx),strength:strength(this)};
    if(this.skillTime>0||strength(this)>0)signatureCue(this,'sortieBrass',{x:b.x-Math.cos(this.a)*10,y:b.y-Math.sin(this.a)*10,a:Math.atan2(b.vy,b.vx),side:b.gun%2?1:-1,life:.32});
   }
  }return result;
 };
 const impact=q.identityImpact;
 q.identityImpact=function(b,e,target,position){const result=impact.call(this,b,e,target,position);
  if(this.pilot==='ball'&&alive(this)&&personal(this,b)&&b.identityGun&&this.ballAmbush>0&&this.pilotIdentity?.alone&&e){
   // Ambush damage uses the firing origin and the authoritative identity state.
   // Its historical alone rule differs from the normal gun passive's patrol rule.
   const origin=b.identityOrigin||this,rear=Math.atan2(origin.y-e.y,origin.x-e.x)-(e.a||0);
   if(Math.abs(Math.atan2(Math.sin(rear),Math.cos(rear)))>Math.PI*.72&&signatureInterval(this,'cloudStrike',.12)){
    const pos=position||b;signatureCue(this,'cloudStrike',{x:pos.x,y:pos.y,a:Math.atan2(b.vy,b.vx),life:.32});
   }
  }return result;
 };
 const received=q.buildReceivedDamage;
 q.buildReceivedDamage=function(before){const result=received.call(this,before),source=this.damageSource;
  if(this.pilot==='barker'&&alive(this)&&this.hp<before&&source?.bullet&&signatureInterval(this,'survivalHit',.10))signatureCue(this,'survivalHit',{x:source.impactX??this.x,y:source.impactY??this.y,a:Math.atan2(source.bullet.vy,source.bullet.vx),count:this.barkerStacks||1,life:.42});
  return result;
 };
 q.resetCloudSurvivalFx=function(){if(SORTIE_PILOTS.has(this.pilot)){delete this.sortieFlightFx;delete this.pilotSignatureState;}};
}

export function drawSortieWake(c,p,tex){
 const f=p.sortieFlightFx;if(!f)return;const palette=SORTIE_PALETTES[p.pilot],ball=p.pilot==='ball';
 for(let i=0;i<f.wake.length;i++){
  const v=f.wake[i],q=clamp((f.clock-v.at)/SORTIE_FX_LIMITS.wakeLife),ca=Math.cos(v.a),sa=Math.sin(v.a),dx=v.x-p.x,dy=v.y-p.y;
  if(ball){
   // Leave only a few detached wisps on the flown path. The decoy below carries
   // the cloud mass; the controlled airframe never wears a cloud membrane.
   if(v.cloaked&&i%4===0)tex(c,'fx-cloud-wispy-1',dx-ca*(26+q*12),dy-sa*(26+q*12),62+q*20,22+q*8,v.a,.22*(1-q),palette.core);
  }else if(v.stage>0&&i%2===0){
   tex(c,'smokeDark',dx-ca*(23+q*22),dy-sa*(23+q*22),42+q*(22+v.stage*3),19+v.stage*2+q*14,v.a+Math.PI,(.23+v.stage*.025)*(1-q),palette.smoke);
   tex(c,'smokeTrail',dx-ca*(20+q*20)-sa*8,dy-sa*(20+q*20)+ca*8,53+q*18,10+v.stage,v.a,(.26+v.stage*.04)*(1-q),palette.edge);
  }
 }
 // The cloud decoy is tied to the target the enemy AI actually follows.
 if(ball&&p.ballCloak>0&&p.ballGhost){
  const g=p.ballGhost,fade=Math.min(1,p.ballCloak/.22),x=g.x-p.x,y=g.y-p.y;
  // Keep the painted cloud's natural broad proportions and the AI's true lure
  // position. No orbiting lobes, rotating wreath, or shadow of another aircraft.
  tex(c,'fx-cloud-cumulus-1',x,y,112,65,g.a,.66*fade,palette.core);
  tex(c,'fx-cloud-wispy-0',x-Math.cos(g.a)*31,y-Math.sin(g.a)*31,102,38,g.a,.38*fade,palette.core);
 }
}
export function drawSortieLocal(c,p,tex,front=false){
 const f=p.sortieFlightFx;if(!f)return;const palette=SORTIE_PALETTES[p.pilot],ball=p.pilot==='ball',t=f.clock,active=p.skillTime>0;
 if(front){
  if(ball&&p.ballCloak>0)return;
  if(!ball){const stage=Math.min(5,Math.max(p.barkerStacks||0,p.barkerDamageStage||0,p.barkerScarStage||0));
   if(stage>=2)tex(c,'debrisShard',-13,17,13,8,.3,.70,palette.smoke);
   if(stage>=3){const peak=active&&p.hp/p.maxHp<.12?1:0;tex(c,'fireEngine',-7,-2,13+stage*2+peak*5,9+stage,Math.PI,.58+peak*.18,palette.spark);tex(c,'spark',-9,14,8,5,t,.28,palette.core);}
  }
  if(p.reloadTime>0||p.cow37)return;
  const guns=Math.min(8,p.weapon?.guns||1),ca=Math.cos(p.a),sa=Math.sin(p.a);
  for(let gun=0;gun<guns;gun++){
   const shot=f.muzzles[gun],age=shot?f.clock-shot.at:Infinity;if(age<0||age>.055)continue;
   const a=p.gunDirection?.(gun)??p.a,offset=p.weapon?.bidirectional?0:(gun-(guns-1)/2)*8,m=p.bomberGunMount(gun,a,offset),dx=m.x-p.x,dy=m.y-p.y,x=dx*ca+dy*sa,y=-dx*sa+dy*ca,heading=a-p.a,power=shot.strength;
   tex(c,'muzzle',x+Math.cos(heading)*10,y+Math.sin(heading)*10,28+power*16,12+power*7,heading,.94*(1-age/.055),power>0?palette.core:palette.spark);
   if(power>0)tex(c,'gunSmoke',x+Math.cos(heading)*19,y+Math.sin(heading)*19,35+power*9,15,heading,.28*(1-age/.055),ball?palette.edge:palette.smoke);
  }return;
 }
 if(ball){
  // Lone flight alone needs no decoration. The short aft airflow only marks
  // the actual two-second ambush window after concealment has ended.
  if(!(p.ballCloak>0)&&p.ballAmbush>0&&ballLoneFx(p))for(const side of [-1,1])tex(c,'vaporTrail',-35,side*24,46,7,0,.40*Math.min(1,p.ballAmbush/.2),palette.core);
 }else {
  const stage=Math.min(5,Math.max(p.barkerStacks||0,p.barkerDamageStage||0,p.barkerScarStage||0));
  if(stage>0)for(let i=0;i<2;i++){const phase=(t*(.9+stage*.1)+i*.5)%1;tex(c,'smokeDark',-25-phase*26,(i?1:-1)*(3+phase*4),37+phase*19,17+stage*2,Math.PI,(.26+stage*.025)*(1-phase*.6),palette.smoke);}
  if(active){const pulse=.7+.3*Math.sin(t*9)**2;tex(c,'smokeTrail',-28,0,57,10,0,.23*pulse,palette.edge);}
 }
}
export function drawSortieCue(c,p,e,tex,front){
 const ball=p.pilot==='ball',palette=SORTIE_PALETTES[p.pilot],q=clamp(e.age/e.maxLife),fade=1-q,a=e.a-p.a;
 if(e.kind==='sortieBrass'){if(front)tex(c,'bulletBrass',-e.age*35,e.side*(7+e.age*62),6,2.5,a+e.age*14,.82*fade,palette.spark);return true;}
 if(e.kind==='cloudStrike'||e.kind==='survivalHit'){
  if(front){tex(c,'ricochet',0,0,e.kind==='cloudStrike'?40:48,22,a,.90*fade,palette.core);tex(c,'gunSmoke',-q*13,0,28+q*22,18,a,.33*fade,ball?palette.edge:palette.smoke);
   if(!ball)for(let i=0;i<3;i++){const angle=a+(i-1)*.7;tex(c,'metalShard'+i,Math.cos(angle)*q*28,Math.sin(angle)*q*28,8,4,angle+q*3,.83*fade,palette.spark);}
  }return true;
 }
 if(ball&&['cloudAmbush','ambushBreak'].includes(e.kind)){
  // Activation is already shown at the real AI lure. On emergence the cloud
  // separates once at the release point instead of following the aircraft.
  if(!front&&e.kind==='ambushBreak')for(const side of [-1,1])tex(c,'fx-cloud-wispy-1',-8-q*22,side*(20+q*38),88+q*16,33+q*9,side*.20,.46*fade,palette.core);
  return true;
 }
 if(!ball&&e.kind==='lastStand'){
  if(!front)for(const side of [-1,1]){tex(c,'airblast0',-6-q*27,side*(20+q*14),74+q*18,19,-side*.32,.60*fade,side<0?palette.edge:palette.core);tex(c,'smokeTrail',-37-q*24,side*12,62,10,0,.30*fade,palette.smoke);}return true;
 }
 // Superseded legacy reactions, including generic hit accents that didn't check
 // Ball's actual rear/alone bonus. Never paint a muzzle merely on activation.
 return ball?['shotAccent','ambushShot'].includes(e.kind):['shotAccent','battleDamage','escape','survivalBreak'].includes(e.kind);
}

// Five authored attacks on the existing shot/impact/wing hooks. No new input or FX renderer.
import {PILOT_IDENTITY_COPY} from './pilot-identity-copy.js?v=sortierhythm20261018';
const TAU=Math.PI*2;
const IDS=new Set(['fonck','gontermann','luke','proctor','lufbery']);
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const live=e=>e&&e.hp>0&&!e.crashed&&!e.rivalEscaped&&!e.expired&&!e.destroyed;
const world=p=>p.combatWorld?.()||p;
const owner=p=>p.id||'p1';
const ordinary=e=>live(e)&&!e.surface&&!e.fieldUnit&&!e.stageBossBody&&!e.bossPilot&&!e.heavyBomber&&e.type!=='boss'&&e.type!=='zeppelin';
const gun=b=>b&&!b.enemy&&!b.ally&&!b.patrol&&!b.formation&&!b.rocket&&!b.motorCannon&&!b.cow37&&!b.mauserRound&&!b.actualExplosion&&!b.blast&&!b.identityDot&&b.gun!==undefined;
const duration={fonck:.6,gontermann:1.05,luke:1.05,proctor:2.4,lufbery:6};
const beats={fonck:[.18,.23,.28],gontermann:[.12,.19,.46,.53],luke:[.1,.17,.24,.6,.67,.74],proctor:[.12,.17,.22,.72,.77,.82,1.32,1.37,1.42,1.92,1.97,2.02]};
export const FIVE_ACE_BALANCE=Object.freeze({airshipBonus:.2,chainRadius:145,chainLimit:6,chainDelay:.12,proctorDelay:.4,proctorRepeat:5,orbitRadius:155,duration:Object.freeze(duration)});
// Body kinds are real BOSS_CATALOG keys. Zeppelin-Staaken is an aeroplane.
export function isFiveAceAirship(e){return !!e&&(e.type==='zeppelin'||['zeppelin-l70','hma23'].includes(e.stageBossBody?.kind||e.kind));}
export function fiveAceState(p){const s=p.identityState();return s.five??=({age:0,next:0,active:false,prepared:null,hits:0,lastHit:-Infinity,proctorSeen:new WeakMap(),chain:[],detonated:new Set(),chainCount:0});}
function bearing(p,e){return Math.atan2(e.y-p.y,e.x-p.x);}
function distance(p,e){return Math.hypot(e.x-p.x,e.y-p.y);}
function muzzle(p,heading,size=32){const x=p.x+Math.cos(p.a)*25,y=p.y+Math.sin(p.a)*25;p.identityFx('muzzleTwin',x,y,heading,size,.1,{height:size*.45});p.identityFx('gunSmoke',x+Math.cos(heading)*10,y+Math.sin(heading)*10,heading,27,.25,{height:16,alpha:.28});p.muzzleFlash=.09;p.event('shot','');}
function impact(p,pos,hot=false){p.identityFx(hot?'fireEngine':'armorSpark',pos.x,pos.y,p.a,hot?32:22,hot?.35:.18,{alpha:.82});}
function point(burn){const body=burn.body,part=burn.part&&body?.support129?.parts.get(burn.target.id),pos=part?body.support129.world(part.nx,part.ny):null;return pos||{x:body?body.x+(burn.part?burn.target.x:0):burn.enemy.x,y:body?body.y+(burn.part?burn.target.y:0):burn.enemy.y};}
function ignite(p,e,target,pos,strong=false){if(!live(target))return;const s=p.identityState();s.burns.set(target,{enemy:e,target,position:{x:pos.x,y:pos.y},time:strong?4:3,tick:0,damage:p.damage*(strong?.45:.2),part:!!e.stageBossBody&&target!==e.stageBossBody,body:e.stageBossBody});impact(p,pos,true);}
function lead(p,e,speed=650){const t=Math.min(.7,distance(p,e)/speed),vx=Number.isFinite(e.vx)?e.vx:Math.cos(e.a||0)*(e.speed||0),vy=Number.isFinite(e.vy)?e.vy:Math.sin(e.a||0)*(e.speed||0);return Math.atan2(e.y+vy*t-p.y,e.x+vx*t-p.x);}
function emit(p,s,phase,heading,power,pierce=false,fan=false){
 if(p.reloadTime>0)return false;
 const w=world(p),pellets=Math.max(1,Math.min(5,p.shots||1)),guns=p.weapon.guns||1;
 let fired=0;
 for(let g=0;g<guns;g++){
  if(p.weapon.bidirectional&&g===1)continue;
  const available=p.unlimitedAmmo?pellets:p.ammo[g]||0,n=Math.min(pellets,available);
  if(!n)continue;
  if(!p.unlimitedAmmo)p.ammo[g]-=Math.max(1,n-(p.freeVolleyShots||0));
  const off=(g-(guns-1)/2)*8;
  for(let i=0;i<n;i++){
   const a=heading+(i-(n-1)/2)*(fan?.10:.016),b={x:p.x+Math.cos(p.a)*25-Math.sin(p.a)*off,y:p.y+Math.sin(p.a)*25+Math.cos(p.a)*off,vx:Math.cos(a)*650,vy:Math.sin(a)*650,life:1.55,enemy:false,ownerId:owner(p),gun:g,damage:p.damage*p.normalGunMultiplier()*power*(p.skillEnhanced?1.3:1)/Math.sqrt(pellets),pierce,hit:new Set(),fiveAceRound:true,fiveAcePhase:phase,fiveAceHeading:heading,fiveAceAngle:a,visualType:'normal'};
   p.applySpecialRound(b,null);w.bullets.push(b);fired++;p.roundsFired++;
  }
 }
 if(fired){muzzle(p,heading,p.pilot==='fonck'?40:32);s.fired=(s.fired||0)+fired;}
 return !!fired;
}
function scheduleDetonation(p,target){
 const s=fiveAceState(p),burn=p.identityState().burns.get(target);
 if(!burn||s.detonated.has(target)||s.chainCount>=FIVE_ACE_BALANCE.chainLimit)return false;
 s.detonated.add(target);s.chainCount++;s.chain.push({burn,delay:s.chainCount>1?FIVE_ACE_BALANCE.chainDelay:0});return true;
}
function tickChain(p,dt){
 const s=fiveAceState(p);if(!s.chain.length)return;
 const next=s.chain[0];next.delay-=dt;if(next.delay>0)return;s.chain.shift();
 const burn=next.burn; // Queued burning wrecks cook off once; the queue owns the record.
 const pos=point(burn);p.identityState().burns.delete(burn.target);
 const start=p.bullets.length;
 p.queueExplosionDamage(pos.x,pos.y,FIVE_ACE_BALANCE.chainRadius,p.payloadPower(36),{secondaryExplosion:true,identityChain:true,fiveLukeChain:true});
 for(let i=start;i<p.bullets.length;i++){const b=p.bullets[i];b.identityChain=true;b.fiveLukeChain=true;b.ownerId=owner(p);}
 p.combatBlast?.(pos.x,pos.y,FIVE_ACE_BALANCE.chainRadius,'friendly','blast','ammoCookoff');
 p.identityFx('gunSmoke',pos.x,pos.y,0,92,.7,{height:66,alpha:.52});
 for(const [target,other]of p.identityState().burns){if(live(target)&&distance(pos,point(other))<=FIVE_ACE_BALANCE.chainRadius)scheduleDetonation(p,target);}
}
function rearThreat(p,origin=p){
 let target=null,best=600;
 for(const e of world(p).enemies||[]){
  if(!live(e)||e.surface||e.fieldUnit||e.stageBossBody)continue;
  const d=distance(origin,e);if(d>=best)continue;
  if(Math.abs(wrap(bearing(origin,e)-(origin.a||0)))<Math.PI*.6)continue;
  if(Math.abs(wrap(bearing(e,origin)-(e.a||0)))>.85)continue;
  target=e;best=d;
 }
 return target;
}
function ownLafayette(p,a){return a.ownerId===owner(p)&&(a.fiveLafayette||a.permanent&&a.slot===p.fiveLafayetteSlot);}
function updateLafayette(p,a,dt){
 if(!ownLafayette(p,a))return false;
 const s=fiveAceState(p),w=world(p),orbit=p.skillTime>0&&s.orbit;
 a.life-=dt;a.invuln=Math.max(0,(a.invuln||0)-dt);a.hitFlash=Math.max(0,(a.hitFlash||0)-dt);a.muzzleFlash=Math.max(0,(a.muzzleFlash||0)-dt);
 if(a.fiveLafayette&&!orbit){a.a+=wrap((s.exitHeading??p.a)-a.a)*Math.min(1,dt*2);a.x+=Math.cos(a.a)*230*dt;a.y+=Math.sin(a.a)*230*dt;return true;}
 let threat=rearThreat(p),goal;
 if(orbit){
  const slot=a.fiveLafayetteSlot??0,angle=s.orbit.angle+s.age*1.12+slot*TAU/3,r=FIVE_ACE_BALANCE.orbitRadius;
  goal={x:s.orbit.x+Math.cos(angle)*r,y:s.orbit.y+Math.sin(angle)*r};
  for(const friend of w.allies||[]){if(friend!==a&&ownLafayette(p,friend)){const e=rearThreat(p,friend);if(e&&(!threat||distance(a,e)<distance(a,threat)))threat=e;}}
 }else{
  const behind=p.a+Math.PI;goal={x:p.x+Math.cos(behind)*100-Math.sin(p.a)*65,y:p.y+Math.sin(behind)*100+Math.cos(p.a)*65};
  if(threat&&distance(p,threat)<450)goal={x:threat.x-Math.cos(threat.a||0)*90,y:threat.y-Math.sin(threat.a||0)*90};
 }
 const dx=goal.x-a.x,dy=goal.y-a.y,d=Math.hypot(dx,dy),move=Math.min(1,dt*(orbit?3:2.6),dt*260/Math.max(1,d));
 a.x+=dx*move;a.y+=dy*move;
 const desired=d>22?Math.atan2(dy,dx):threat?bearing(a,threat):p.a;
 const turn=clamp(wrap(desired-(a.a||0)),-dt*3.1,dt*3.1);a.a=(a.a||0)+turn;a.fiveBank=clamp(turn/Math.max(dt,.001),-1,1);
 a.fire=(a.fire||0)-dt;
 if(!threat){let best=620;for(const e of w.enemies||[]){if(!live(e)||e.surface)continue;const range=distance(a,e);if(range<best&&Math.abs(wrap(bearing(a,e)-a.a))<.45){threat=e;best=range;}}}
 if(threat&&a.fire<=0&&distance(a,threat)<620&&Math.abs(wrap(bearing(a,threat)-a.a))<.5){
  const heading=lead(a,threat,470),coop=!!p.world,supply=!!(a.permanent&&p.upgrades?.fighterSupply),mannock=(w.players||[p]).some(x=>x.pilot==='mannock'&&x.hp>0);a.fire=(coop?.42:.58)*(supply?.9:1)/((1+(p.commandRateBonus||0))*(mannock?1.15:1));a.muzzleFlash=.09;a.fireHeading=heading;
  p.identityShot(heading,p.supportPower(coop?7.44:5)*(p.wingmanDamageMult||1)*(supply?1.2:1),{ally:true,ownerId:owner(p),speed:470,fiveLafayetteRound:true},a);
 }
 return true;
}
function tick(p,dt){
 const s=fiveAceState(p);
 if(p.state!=='playing')return;
 if(!(p.hp>0)||p.status==='downed'){s.active=false;s.chain.length=0;s.orbit=null;return;}
 if(p.mission?.unarmed){s.active=false;s.chain.length=0;return;}
 tickChain(p,dt);
 if(p.pilot==='gontermann'&&s.prepared&&((p.identityState().clock-s.lastHit)>2.4||!live(s.prepared))){s.prepared=null;s.hits=0;}
 if(!s.active)return;
 s.age+=dt;
 if(p.pilot==='lufbery'){if(!(p.skillTime>0)){s.active=false;s.orbit=null;}return;}
 // Only this finite attack gates ordinary auto-fire. No temporary stat multiplier.
 p.fire=Math.max(p.fire,dt+.02);
 const times=beats[p.pilot];
 while(s.next<times.length&&s.age+1e-7>=times[s.next]){
  const i=s.next++;
  if(p.pilot==='fonck')emit(p,s,'precision',s.heading,5,true);
  else if(p.pilot==='gontermann')emit(p,s,i<2?'pierce':'ignite',p.a,i<2?2:1.6,i<2);
  else if(p.pilot==='luke')emit(p,s,i<3?'ignite':'detonate',p.a+(i%3-1)*.16,1.5,false,true);
  else if(p.pilot==='proctor'){if(i%3===0)s.heading=p.a;emit(p,s,'suppress',s.heading,1.6,true);s.bursts=Math.ceil(s.next/3);}
 }
 if(s.age>=duration[p.pilot]){s.active=false;p.fire=Math.min(p.fire,.08);}
}
export function installFivePilots(Game,PILOTS){
 const q=Game.prototype;
 for(const id of IDS){const c=PILOT_IDENTITY_COPY[id].ko;Object.assign(PILOTS[id],{passive:c.passive,skill:c.skill,passiveDesc:c.passiveDetail,desc:c.activeDetail});}
 const ensure=q.ensureRevisionPilot;q.ensureRevisionPilot=function(){ensure.call(this);if(!IDS.has(this.pilot)||this.fiveAceReady)return;this.fiveAceReady=true;if(this.pilot==='lufbery'){this.fiveLafayetteSlot=this.permanentWingman||0;this.permanentWingman=this.fiveLafayetteSlot+1;}};
 const dur=q.skillDuration;q.skillDuration=function(){return IDS.has(this.pilot)?duration[this.pilot]*(this.pilot==='lufbery'&&this.skillEnhanced?1.35:1):dur.call(this)};
 const skill=q.skill;q.skill=function(){
  if(!IDS.has(this.pilot))return skill.call(this);
  this.ensureRevisionPilot();if(this.state!=='playing'||this.hp<=0||this.status==='downed'||this.cooldown>0||this.mission?.unarmed)return false;
  if(this.pilot!=='lufbery'&&(this.reloadTime>0||!this.unlimitedAmmo&&!this.ammo.some(n=>n>0)))return false;
  const s=fiveAceState(this);s.age=0;s.next=0;s.active=true;s.heading=this.a;s.fired=0;s.bursts=0;s.pierced=null;
  this.cooldown=this.skillCooldown();this.skillTime=this.skillDuration();
  if(this.pilot==='luke'){s.chain.length=0;s.detonated.clear();s.chainCount=0;}
  if(this.pilot==='fonck'){const t=this.identityTarget(.13,780);if(t&&this.identityState().focus>=.8)s.heading=lead(this,t);}
  if(this.pilot==='lufbery'){
   s.orbit={x:this.x,y:this.y,angle:this.a+Math.PI};s.exitHeading=this.a;
   const w=world(this);w.allies??=[];
   for(let i=1;i<=2;i++){const side=i===1?-1:1;w.allies.push({ownerId:owner(this),plane:this.plane,x:this.x-Math.cos(this.a)*260-Math.sin(this.a)*side*85,y:this.y-Math.sin(this.a)*260+Math.cos(this.a)*side*85,a:this.a,life:this.skillTime+1.1,fire:.3+i*.1,temporary:true,fiveLafayette:true,fiveLafayetteSlot:i,slot:(this.permanentWingman||0)+i-1});}
  }
  this.event('skill',PILOTS[this.pilot].skill);return true;
 };
 const begin=q.beginRevisionFrame;q.beginRevisionFrame=function(dt,input={}){const prior=begin.call(this,dt,input);if(IDS.has(this.pilot)&&Number.isFinite(dt)&&dt>0)tick(this,dt);return prior;};
 const wing=q.updatePilotWing;q.updatePilotWing=function(a,dt){if(this.pilot==='lufbery'&&updateLafayette(this,a,dt))return true;return wing.call(this,a,dt)};
 const wingPlane=q.permanentWingPlane;q.permanentWingPlane=function(){return this.pilot==='lufbery'?this.plane:wingPlane.call(this)};
 const round=q.applySpecialRound;q.applySpecialRound=function(b,type){
  const result=round.call(this,b,type);if(!IDS.has(this.pilot)||!gun(b))return result;
  if(this.pilot==='fonck'){
   const s=this.identityState(),e=s.target;
   if(!b.fiveAceRound&&live(e)&&s.focus>=.8){const a=lead(this,e,Math.hypot(b.vx,b.vy)),speed=Math.hypot(b.vx,b.vy);b.vx=Math.cos(a)*speed;b.vy=Math.sin(a)*speed;}
  }
  if(b.fiveAceRound){
   const speed=Math.hypot(b.vx,b.vy),a=b.fiveAceAngle;b.vx=Math.cos(a)*speed;b.vy=Math.sin(a)*speed;
   if(b.fiveAcePhase==='precision'){b.pierce=true;b.fonckVolley=true;}
   if(b.fiveAcePhase==='ignite'||b.fiveAcePhase==='detonate')b.specialColor='#d99658';
   if(b.fiveAcePhase==='suppress'){b.pierce=true;b.proctorSalvo=true;}
  }
  return result;
 };
 const damage=q.roundDamageMultiplier;q.roundDamageMultiplier=function(b,e){const m=damage.call(this,b,e);return this.pilot==='luke'&&gun(b)&&isFiveAceAirship(e)?m*(1+FIVE_ACE_BALANCE.airshipBonus):m;};
 const hit=q.identityImpact;q.identityImpact=function(b,e,target=e,pos=e){
  const pendingLukeBurn=this.pilot==='luke'&&b.fiveAcePhase==='detonate'&&gun(b)&&(b.ownerId||'p1')===owner(this)?this.identityState().burns.get(target):null;
  hit.call(this,b,e,target,pos);
  if(!IDS.has(this.pilot)||!gun(b)||(b.ownerId||'p1')!==owner(this))return;
  if(!live(target)){
   if(pendingLukeBurn){this.identityState().burns.set(target,pendingLukeBurn);scheduleDetonation(this,target);this.identityState().burns.delete(target);}
   return;
  }
  const s=fiveAceState(this),now=this.identityState().clock;
  if(this.pilot==='fonck'&&b.fiveAcePhase==='precision')impact(this,pos);
  if(this.pilot==='gontermann'){
   if(!b.fiveAceRound){
    if(s.prepared!==target||now-s.lastHit>.8){s.prepared=target;s.hits=0;s.lastCounted=-Infinity;}
    if(now-(s.lastCounted??-Infinity)>=.08){s.hits=Math.min(3,s.hits+1);s.lastCounted=now;}
    s.lastHit=now;
    if(s.hits>=3&&now-(s.leakFxAt??-Infinity)>.25){s.leakFxAt=now;this.identityFx('gunSmoke',pos.x,pos.y,e.a||0,29,.55,{height:18,alpha:.4});}
   }else if(b.fiveAcePhase==='pierce'){s.pierced=target;impact(this,pos);}
   else if(b.fiveAcePhase==='ignite'){ignite(this,e,target,pos,s.pierced===target||s.prepared===target&&s.hits>=3);s.prepared=null;s.hits=0;}
  }
  if(this.pilot==='luke'&&b.fiveAceRound){
   if(b.fiveAcePhase==='detonate'&&this.identityState().burns.has(target))scheduleDetonation(this,target);
   else if(b.fiveAcePhase==='ignite'||b.fiveAcePhase==='detonate')ignite(this,e,target,pos);
  }
  if(this.pilot==='proctor'&&ordinary(e)&&now-(s.proctorSeen.get(e)??-Infinity)>=FIVE_ACE_BALANCE.proctorRepeat){s.proctorSeen.set(e,now);e.fire=Math.max(e.fire||0,FIVE_ACE_BALANCE.proctorDelay);impact(this,pos);}
 };
}

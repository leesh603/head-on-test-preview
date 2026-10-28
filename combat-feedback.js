import {combatImpactResult} from './combat-impact-result.js';
import {queueCombatImpact,advanceReplicaImpactFx} from './explosion-profiles.js?v=headon-result339-20261028';
import {playerAirframeModel} from './player-airframe-handling.js?v=headon-result339-20261028';
import {drawFuelFire} from './explosion-profiles.js?v=headon-result339-20261028';
import {beginAircraftCrash,advanceAircraftCrash,drawAircraftCrash,enemyCanCrash,enemyCrashScale,enemyCrashVisual} from './aircraft-crash.js?v=headon-result339-20261028';
import {drawTracerBolt} from './projectiles.js?v=headon-result339-20261028';
import {tacticalCueSound} from './tactical-combat-view.js?v=headon-result339-20261028&td4=20261026';
// Presentation owns its own state and deterministic variation. Never consume the
// simulation RNG or write aircraft positions, headings, damage, or rewards here.
const worlds=new WeakMap(),poses=new WeakMap();
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const angle=n=>Math.atan2(Math.sin(n),Math.cos(n));
const ordinary=e=>e&&!e.bossPilot&&!e.ace&&!e.rivalAce&&!e.eliteKind&&!e.stageBossBody&&!e.heavyBomber&&!e.surface&&!e.stationary&&!e.fieldUnit&&!e.navalVessel&&!e.bugDrone&&!e.groundEscort&&!e.missionGround&&!e.londonInstallation&&!e.cityUnit&&!e.bossAirship&&!e.expired&&['scout','hunter','bomber'].includes(e.type);
export const COMBAT_FEEDBACK_LIMITS=Object.freeze({impacts:40,compactImpacts:20,wrecks:10,compactWrecks:5,trail:48,compactTrail:24,plumes:64,compactPlumes:32});
export const COMBAT_CRASH_PROFILES=Object.freeze(['spin','smoke','fire','runaway']);
const _lpShare=[0,0];
function localPoint(e,forward,side){const q=combatVisualPose(e),a=e.a+q.roll;_lpShare[0]=e.x+q.x+Math.cos(a)*forward-Math.sin(a)*side*q.bank;_lpShare[1]=e.y+q.y+Math.sin(a)*forward+Math.cos(a)*side*q.bank;return _lpShare}
export function impactMaterial(e,b){
 if(e.surface||e.fieldUnit||e.navalVessel||e.stageBossBody)return 'metal';
 const dx=b.x-e.x,dy=b.y-e.y,forward=dx*Math.cos(e.a)+dy*Math.sin(e.a),side=-dx*Math.sin(e.a)+dy*Math.cos(e.a);
 return forward>9&&Math.abs(side)<12?'metal':Math.abs(side)>15?'fabric':'wood';
}
const NO_POSE={x:0,y:0,roll:0,bank:1,active:false};
export function combatVisualPose(e){return poses.get(e)||NO_POSE}
// Caller-owned output avoids allocations during continuous multi-gun fire.
export function combatMountPoint(e,forward,side,out){
 const q=combatVisualPose(e),a=e.a+q.roll,c=Math.cos(a),s=Math.sin(a);
 out.x=e.x+q.x+c*forward-s*side*q.bank;
 out.y=e.y+q.y+s*forward+c*side*q.bank;
 return out;
}
function pose(e,time,dt,damageState,flight=false){
 const q=poses.get(e)||{x:0,y:0,roll:0,bank:1,lastA:e.a,lastHp:e.hp,kick:0,turn:0};
 if(flight){const elapsed=time-(q.flightAt??time),prior=q.airspeed;
  q.flightSpeed=elapsed>0&&q.lastX!=null&&e.speed>0?Math.hypot(e.x-q.lastX,e.y-q.lastY)/elapsed/e.speed:(e.airframeSpeed??1);
  q.airspeed=clamp(q.flightSpeed*(e.speed||170),0,(e.speed||170)*1.7);
  const acceleration=elapsed>0&&prior!=null?clamp((q.airspeed-prior)/elapsed,-300,300):0;
  q.acceleration=(q.acceleration||0)+(acceleration-(q.acceleration||0))*(1-Math.exp(-dt*8));q.lastX=e.x;q.lastY=e.y;q.flightAt=time;
 }
 const rate=dt>0?clamp(angle(e.a-q.lastA)/dt,-4,4):0;
 q.turn+=(rate-q.turn)*(1-Math.exp(-dt*12));q.kick=Math.max(e.hp<q.lastHp-.4?1:0,q.kick-dt*6);
 const shot=!(e.reloadTime>0)&&!(e.cannonRecoil129>0)?Math.sin(clamp((e.muzzleFlash||0)/.09)*Math.PI)*1.25:0;
 const weight=e.bomberTransfer?.kind==='airship'?.35:e.bomberTransfer?.6:e.weapon?.bidirectional?.7:1;
 const side=Math.sin(time*67)*q.kick*1.6*weight;
 q.x=-Math.cos(e.a)*shot-Math.sin(e.a)*side;q.y=-Math.sin(e.a)*shot+Math.cos(e.a)*side;
 const hit=damageState?clamp(1-(time-damageState.lastHit)/.18):0;
 const punch=Math.sin(hit*Math.PI)*(damageState?.impulse||0);
 // A damped visual recoil follows the incoming round, never the simulation body.
 q.x+=Math.cos(damageState?.direction||0)*punch;
 q.y+=Math.sin(damageState?.direction||0)*punch;
 q.roll=(Math.sin(time*61)*q.kick*.018+(damageState?.side||1)*Math.sin(hit*Math.PI)*(.045+(damageState?.impulse||0)*.012))*weight;
 // Keep the authored top-down wing shape during ordinary flight.
 q.active=true;q.bank=1;q.lastA=e.a;q.lastHp=e.hp;poses.set(e,q);
}
export function attachCombatFeedback(world,{play=()=>{},pulse=()=>{},key=e=>e.escortPlane||e.bossPlane||e.plane,scale=()=>1}={}){
 if(worlds.has(world))return worlds.get(world);
 const state={impacts:[],wrecks:[],trail:[],plumes:[],passes:[],damage:new WeakMap(),serial:0,impactSerial:0,time:world.t||0,nextNear:0,nextPass:0,nextApproach:0,camera:0,duckUntil:0,headOnUntil:0,previous:new WeakMap(),whizzed:new WeakSet(),dead:new WeakSet(),pendingKill:null,heard:new WeakSet(),heardIds:new Set()};
 worlds.set(world,state);world.combatPresentation=true;
 const compact=()=>world.viewWidth<=720;
 const cap=(list,small,big)=>{const max=compact()?small:big;if(list.length>max)list.splice(0,list.length-max)};
 // Cosmetic copies reuse ace motion and production FX without simulation RNG.
 let visualSeed=0x41ce;const visualRandom=()=>((visualSeed=(Math.imul(visualSeed,1664525)+1013904223)>>>0)/4294967296);
 const burst=world.burst,smoke=world.smoke;
 const crashEffects={rng:visualRandom,
  smoke(x,y,heavy){let w=0;for(const p of state.trail)if(p.life>0)state.trail[w++]=p;state.trail.length=w;if(state.trail.length>=(compact()?COMBAT_FEEDBACK_LIMITS.compactTrail:COMBAT_FEEDBACK_LIMITS.trail))return;smoke.call({rng:visualRandom,particles:world.particles},x,y,heavy);state.trail.push(world.particles.at(-1))},
  burst(x,y,color){world.combatFX??=[];const fire=this.wreck?.style==='fire';burst.call({rng:visualRandom,particles:world.particles,combatFX:world.combatFX,viewWidth:world.viewWidth},x,y,fire?color:'#ab9471',fire?30:12,'aircraftMedium')},
  event(){play(this.wreck?.style==='fire'?'impact':'airframeBreak')}
 };
 world.burst=function(x,y,color,n,...args){
  // Online guests receive combatFX, not these local wreck copies. Preserve the
  // shared explosion there so killing a minion remains visible on both peers.
  const e=!this.online&&color==='#f2aa52'&&n>=26?(this.enemies||[]).find(e=>ordinary(e)&&e.hp<=0&&!e.crashing&&!e.crashed&&!enemyCanCrash(e)&&Math.hypot(e.x-x,e.y-y)<2):null;
  const particleStart=this.particles?.length||0,oldFx=e?new Set(this.combatFX||[]):null;
  const result=burst.call(this,x,y,color,n,...args);
  if(!e)return result;
  // Preserve the original RNG calls, but replace the generic kill artwork.
  if(state.dead.has(e)){this.combatFX=(this.combatFX||[]).filter(f=>oldFx.has(f)||!f.killExplosion);this.particles?.splice(particleStart);return result}
  state.dead.add(e);const sequence=state.serial++,large=sequence%17===16;
  state.pendingKill=large?'kill':'airframeBreak';
  if(!large){
   this.combatFX=(this.combatFX||[]).filter(f=>oldFx.has(f)||!f.killExplosion);this.particles?.splice(particleStart);
   const wreck={x:e.x,y:e.y,a:e.a,speed:e.speed||100,type:e.type,key:key(e),scale:scale(e)};
   beginAircraftCrash(wreck,visualRandom);
   const damage=state.damage.get(e);wreck.style=damage?.structure>=3?'spin':damage?.engine>=2?(sequence%2?'smoke':'fire'):COMBAT_CRASH_PROFILES[sequence%COMBAT_CRASH_PROFILES.length];wreck.crashStyle=wreck.style==='spin'?'spin':'glide';wreck.side=damage?.side||Math.sign(wreck.crashSpin);wreck.age=0;
   // Keep the proven ace trajectory as the default; vary only dead visual copies.
   if(wreck.style==='smoke'){wreck.crashT=1.65;wreck.crashSpin*=.12}
   if(wreck.style==='fire'){wreck.crashT=1.45;wreck.crashSpin*=.3}
   if(wreck.style==='runaway'){wreck.crashT=1.9;wreck.crashDir=e.a;wreck.crashSpeed=Math.max(160,e.speed||100);wreck.crashSpin*=.055}
   wreck.crashDuration=wreck.crashT;
   state.wrecks.push(wreck);
   cap(state.wrecks,COMBAT_FEEDBACK_LIMITS.compactWrecks,COMBAT_FEEDBACK_LIMITS.wrecks);
  }
  return result;
 };
 const blast=world.combatBlast;
 if(blast)world.combatBlast=function(x,y,...args){const result=blast.call(this,x,y,...args);const effect=this.combatFX?.at(-1);if(effect)effect.feedbackId='blast:'+(this.combatFeedbackSerial=(this.combatFeedbackSerial||0)+1);if((this.players||[this]).some(p=>p.hp>0&&Math.hypot(x-p.x,y-p.y)<240)){state.camera=Math.max(state.camera,1.1);pulse('explosion')}return result};
 const event=world.event;
 world.event=function(type,...args){const result=event.call(this,type,...args);if(type==='kill'&&state.pendingKill){const emitted=this.events?.at(-1);if(emitted?.type==='kill')emitted.combatSound=state.pendingKill;state.pendingKill=null}if(type==='impact'&&state.pendingImpact){const emitted=this.events?.at(-1);if(emitted?.type==='impact')emitted.combatMaterial=true;state.pendingImpact=false}if(type==='shot')pulse('shot');else if(type==='hit'){state.camera=Math.max(state.camera,.9);pulse('hit')}return result};
 const recordPlayerHit=(p,hp,source)=>{
  if(p.hp<hp&&source&&Number.isFinite(source.x)&&Number.isFinite(source.y)){
   const side=-(source.x-p.x)*Math.sin(p.a)+(source.y-p.y)*Math.cos(p.a);
   state.damage.set(p,{lastHit:world.t||0,side:Math.sign(side)||1});
  }
 };
 const hitPlayer=world.hitPlayer;
 if(hitPlayer)world.hitPlayer=function(p,...args){const hp=p.hp,source=p.damageSource,result=hitPlayer.call(this,p,...args);recordPlayerHit(p,hp,source);return result};
 for(const p of world.players||[world]){
  const hit=p.hit;
  if(hit)p.hit=function(...args){
   const hp=this.hp,source=this.damageSource,result=hit.apply(this,args);
   recordPlayerHit(this,hp,source);
   return result;
  };
  const impact=p.specialRoundImpact;
  if(impact)p.specialRoundImpact=function(b,e){
   const resolved=combatImpactResult(b,e),result=impact.call(this,b,e);if(b.patrol)return result;
   if(resolved?.blocked){queueCombatImpact(world,b,e,{material:'metal',blocked:true});play('armorClink');return result;}
   if(!resolved||!(resolved.damage>0)||b.flak||b.rocket||b.cow37||b.motorCannon)return result;
   const material=impactMaterial(e,b),index=++state.impactSerial;
   const dx=b.x-e.x,dy=b.y-e.y,forward=clamp(dx*Math.cos(e.a)+dy*Math.sin(e.a),-30,30),side=clamp(-dx*Math.sin(e.a)+dy*Math.cos(e.a),-30,30);
   const d=state.damage.get(e)||{engine:0,structure:0,lastHit:-Infinity,streak:0,nextSmoke:0,side:1,broken:false};
   d.streak=(world.t||0)-d.lastHit<.45?Math.min(6,d.streak+1):1;d.lastHit=world.t||0;d.side=Math.sign(side)||d.side;
   if(material==='metal')d.engine++;else d.structure++;state.damage.set(e,d);
   const aircraft=enemyCanCrash(e)||ordinary(e),finisher=aircraft&&e.hp<=0&&!d.finished;
   const breakup=aircraft&&e.hp>0&&e.hp/e.maxHp<.4&&!d.broken;
   d.direction=Math.atan2(b.vy||0,b.vx||0);
   d.impulse=aircraft?Math.min(e.type==='bomber'?2.5:4.5,1.4+d.streak*.45+(breakup?1.5:0)):0;
   if(breakup)d.broken=true;
   if(finisher)d.finished=true;
   const cue=queueCombatImpact(world,b,e,{material,streak:d.streak,piercing:!!b.pierce,breakup,finisher});
   if(cue&&aircraft&&e.hp>0){state.impacts.push({effect:cue,target:e,forward,side,age:0});cap(state.impacts,COMBAT_FEEDBACK_LIMITS.compactImpacts,COMBAT_FEEDBACK_LIMITS.impacts)}
   // Only the decisive local hit gets a short camera/pad accent. Continuous MG
   // fire and distant kills must not shake the screen or drown incoming warnings.
   if(cue&&(breakup||finisher)){
    const local=world.online?(world.players||[]).filter(p=>p.id===world.localPlayerId):(world.players||[world]);
    const zoom=world.camera?.zoom||1;
    if(local.some(p=>p.hp>0&&Math.abs(e.x-p.x)<(world.viewWidth||960)/zoom*.5&&Math.abs(e.y-p.y)<(world.viewHeight||700)/zoom*.5)){
     state.camera=Math.max(state.camera,finisher?2.2:1.15);state.duckUntil=(world.t||0)+.16;pulse('explosion');
    }
    if(finisher)state.pendingKill='airframeBreak';else play('airframeBreak');
   }
   state.pendingImpact=true;if(cue&&!finisher&&!breakup)play('materialImpact',{material,streak:d.streak});return result;
  };
 }
 const update=world.update;
 world.update=function(dt,...args){
  const before=this.t||0,result=update.call(this,dt,...args),replica=this.online&&!this.host,step=Math.min(.04,Math.max(0,replica?(this.state==='playing'?dt:0):(this.t||0)-before));
  if(!step)return result;
  const players=state.players??=[];players.length=0;
  if(this.players){for(const p of this.players)if(p.hp>0&&(!p.status||p.status==='alive'))players.push(p)}else if(this.hp>0&&(!this.status||this.status==='alive'))players.push(this);
  state.time=replica?state.time+step:this.t;state.camera=Math.max(0,state.camera-step*9);
  if(replica)advanceReplicaImpactFx(this,step);
  for(const f of this.combatFX||[])if(!state.heard.has(f)){
   state.heard.add(f);
   if(f.feedbackId){if(state.heardIds.has(f.feedbackId))continue;state.heardIds.add(f.feedbackId);if(state.heardIds.size>256)state.heardIds.delete(state.heardIds.values().next().value);}
   if(f.fxProfile==='tactical'){const cue=tacticalCueSound(f.tacticalCue);if(cue)play(cue,{tactical:true});}
   else if(f.fxProfile==='bulletImpact'&&replica)play(f.blocked?'armorClink':f.finisher||f.breakup?'airframeBreak':'materialImpact',{material:f.material,streak:f.streak});
   else if(['armorBreak','engineBreak','navalBreak'].includes(f.fxProfile)){play(f.fxProfile==='navalBreak'?'shipBreak':f.fxProfile==='engineBreak'?'airframeBreak':'metalBreak');pulse('explosion');}
  }
  for(const p of players)pose(p,state.time,step,state.damage.get(p),true);
  for(const e of this.enemies||[])if((enemyCanCrash(e)||ordinary(e))&&e.hp>0){
   const d=state.damage.get(e);pose(e,state.time,step,d);
   if(d&&e.hp/e.maxHp<.72&&this.t>=d.nextSmoke){
    d.nextSmoke=this.t+(compact()?.14:.09);const engine=d.engine>0,[x,y]=localPoint(e,engine?14:0,engine?0:d.side*20*scale(e));
    state.plumes.push({x,y,a:e.a,age:0,life:.85,heavy:e.hp/e.maxHp<.35,engine});
   }
  }
  for(const e of this.enemies||[])if(e.crashing){const v=enemyCrashVisual(e),q={x:0,y:0,roll:v.roll,bank:v.bank,active:true};poses.set(e,q);}
  {let w=0;for(const f of state.impacts){f.age+=step;if(f.target.hp>0&&f.age<.085&&f.effect.life>0){[f.effect.x,f.effect.y]=localPoint(f.target,f.forward,f.side);state.impacts[w++]=f}}state.impacts.length=w}
  {let w=0;for(const f of state.plumes){f.age+=step;if(f.age<f.life)state.plumes[w++]=f}state.plumes.length=w}cap(state.plumes,COMBAT_FEEDBACK_LIMITS.compactPlumes,COMBAT_FEEDBACK_LIMITS.plumes);
  {let w=0;for(const f of state.passes){f.life-=step;if(f.life>0)state.passes[w++]=f}state.passes.length=w}
  for(const w of state.wrecks){w.age+=step;crashEffects.wreck=w;advanceAircraftCrash(crashEffects,w,step)}
  {let kept=0;for(const w of state.wrecks)if(!w.crashed)state.wrecks[kept++]=w;state.wrecks.length=kept}
  {let kept=0;for(const p of state.trail)if(p.life>0)state.trail[kept++]=p;state.trail.length=kept}
  if(this.state==='playing'&&players.length){
   // Reuse the same pass detector for separately stored elite aircraft.
   const contacts=state.contacts??=[];contacts.length=0;
   for(const e of this.enemies||[])contacts.push(e);
   for(const e of this.eliteEnemies?.members||[])if(!(this.enemies||[]).includes(e))contacts.push(e);
   for(const e of contacts){
    if(e.hp<=0||e.alive===false||e.surface||e.stationary||e.fieldUnit)continue;
    let prior=state.previous.get(e);if(!prior){prior=new WeakMap();state.previous.set(e,prior)}
    for(const p of players){
     const d=Math.hypot(e.x-p.x,e.y-p.y),pass=prior.get(p)||{distance:d,armed:false,passed:false},radial=(d-pass.distance)/step;
     const dx=e.x-p.x,dy=e.y-p.y,headOn=d>0&&(Math.cos(p.a)*dx+Math.sin(p.a)*dy)/d>.86&&(-Math.cos(e.a)*dx-Math.sin(e.a)*dy)/d>.8;
     const relative=pass.dx==null?0:Math.hypot(dx-pass.dx,dy-pass.dy)/step;
     const sx=pass.dx==null?0:dx-pass.dx,sy=pass.dy==null?0:dy-pass.dy,length=sx*sx+sy*sy;
     const u=length?clamp(-(pass.dx*sx+pass.dy*sy)/length):0;
     const swept=length?Math.hypot(pass.dx+sx*u,pass.dy+sy*u):d;
     const crossed=u>0&&u<1&&relative>=180&&swept<110;
     pass.closest=Math.min(pass.closest??d,d,swept);pass.relative=Math.max(pass.relative||0,Math.min(700,relative));
     if(headOn&&d<440&&radial< -25)state.headOnUntil=this.t+.3;
     const heavy=e.heavyBomber||e.type==='bomber'||e.type==='zeppelin';
     if(d>1100)pass.announced=false;
     if(!pass.announced&&radial< -25&&d<(heavy?1000:620)&&(heavy||headOn)&&this.t>=state.nextApproach){pass.announced=true;state.nextApproach=this.t+2.5;play(heavy?'formationPass':'headOn')}
     if(d>180){pass.passed=false;pass.armed=false;pass.closest=d;pass.relative=relative}
     if(!pass.passed&&(d<180&&radial< -30||crossed))pass.armed=true;
     if(pass.armed&&pass.closest<110&&(radial>30||crossed)){pass.armed=false;pass.passed=true;if(this.t>=state.nextPass){state.nextPass=this.t+.7;const rush=clamp((pass.relative-180)/320);state.camera=Math.max(state.camera,.45+rush*.65);state.duckUntil=this.t+.22;state.passes.push({player:p,life:.3,rush});play('closePass',{speed:pass.relative});pulse('pass')}}
     pass.distance=d;pass.dx=dx;pass.dy=dy;prior.set(p,pass);
    }
   }
   for(const b of this.bullets||[]){
    if(!b.enemy||b.life<=0||state.whizzed.has(b)||b.flak)continue;
    const ax=b.previousX??b.x-b.vx*step,ay=b.previousY??b.y-b.vy*step,dx=b.x-ax,dy=b.y-ay,length=dx*dx+dy*dy;
    for(const p of players){const u=length?clamp(((p.x-ax)*dx+(p.y-ay)*dy)/length):0,d=Math.hypot(ax+dx*u-p.x,ay+dy*u-p.y);if(d>22&&d<68){state.whizzed.add(b);if(this.t>=state.nextNear){state.nextNear=this.t+.18;play('whizz')}break}}
   }
  }
  return result;
 };
 return state;
}
export function combatCameraOffset(world){const s=worlds.get(world);return s?{x:Math.sin(s.time*83)*s.camera,y:Math.cos(s.time*71)*s.camera}:{x:0,y:0}}
export function combatFlightSound(world,planes){const players=world.players||[world],p=(world.online&&players.find(p=>p.id===world.localPlayerId&&p.hp>0))||players.find(p=>p.hp>0)||world,s=worlds.get(world),q=poses.get(p);return{plane:playerAirframeModel(p.plane,planes)||p.plane,reload:p.reloadTime>0,speed:q?.flightSpeed??p.airframeSpeed??1,airspeed:q?.airspeed??(p.speed||170)*(p.airframeSpeed??1),acceleration:q?.acceleration||0,turn:Math.abs(q?.turn||0),damage:clamp(1-p.hp/p.maxHp),duck:(s?.duckUntil||0)>(world.t||0)}}
// The existing sparse airflow follows displacement, not the ambient clock.
// No simulation writes, extra particles, or persistent per-frame allocations.
export function drawFlightFlow(c,world,W,H,zoom=1){
 if(!world)return;
 const players=world.players||[world],p=world.online?players.find(p=>p.id===world.localPlayerId&&p.hp>0)||players.find(p=>p.hp>0):players.find(p=>p.hp>0);
 if(!p)return;
 const q=poses.get(p),speed=q?.airspeed??(p.speed||0)*(p.airframeSpeed??1),pace=clamp((speed-105)/165);
 if(pace<=0)return;
 const count=Math.floor(4+8*pace),length=(9+20*pace)*zoom,dx=Math.cos(p.a)*length,dy=Math.sin(p.a)*length;
 c.save();c.strokeStyle='#ecf6de';c.globalAlpha*=.025+.055*pace;c.lineWidth=1;
 for(let i=0;i<count;i++){
  const x=((i*137.3-p.x*.35*zoom)%W+W)%W,y=((i*97.7-p.y*.35*zoom)%H+H)%H;
  c.beginPath();c.moveTo(x,y);c.lineTo(x-dx,y-dy);c.stroke();
 }
 c.restore();
}
function drawWreck(c,w,x,y,time,fx,planeSprite){
 if(w.style==='spin')drawAircraftCrash(c,w,x,y,time,fx);
 else fx(c,'smokeTrail',x-Math.cos(w.a)*56,y-Math.sin(w.a)*56,160,58,w.a,.8);
 const v=enemyCrashVisual(w),ws=w.scale*v.scale;
 if(w.type!=='bomber'){c.save();c.translate(x+v.shadowX,y+v.shadowY);c.rotate(w.a+v.roll);c.scale(1,v.bank);planeSprite(c,0,0,0,w.key,ws,true,true);c.restore();}
 c.save();c.translate(x,y);c.rotate(w.a+v.roll);c.scale(1,v.bank);planeSprite(c,0,0,0,w.key,ws,true,false,0,true);c.restore();if(w.style==='fire')fx(c,'fireEngine',x+Math.cos(w.a)*12,y+Math.sin(w.a)*12,58,66,w.a+Math.PI/2,.9);
}
export function drawCombatFeedback(c,world,point,{fx,planeSprite,bolt=drawTracerBolt}){
 const s=worlds.get(world);if(!s)return;
 const visible=(x,y)=>Math.abs(x-world.x)<(world.viewWidth||960)+160&&Math.abs(y-world.y)<(world.viewHeight||700)+160;
 for(const f of s.plumes){if(!visible(f.x,f.y))continue;const [x,y]=point(f.x,f.y),k=f.age/f.life,size=16+k*(f.heavy?38:24);fx(c,f.heavy?'smokeDark':'engineSmoke',x,y,size,size,f.a,(1-k)*(f.heavy?.55:.35))}
 let fuelCount=0;for(const e of world.enemies||[])if(e.hp>0&&e.burnTime>0&&!e.gontermannBurn&&!e.burnAnchorSpace&&visible(e.x,e.y)&&fuelCount<(world.viewWidth<=720?6:10)){const [x,y]=point(e.x,e.y);drawFuelFire(c,fx,x,y,e.fuelFxAge||0,e.surface?58:38,e.surface?0:e.a+Math.PI/2,e.burnTime);fuelCount++}
 for(const e of world.enemies||[])if(ordinary(e)&&e.hp>0&&!(e.burnTime>0)&&visible(e.x,e.y)){
  const d=s.damage.get(e);if(!d||e.hp/e.maxHp>=.4)continue;const [x,y]=point(...localPoint(e,d.engine>0?14:0,d.engine>0?0:d.side*18));
  fx(c,d.engine>0?'fireEngine':'fireWing',x,y,32,32,e.a+Math.PI/2,.6+Math.sin(s.time*21)*.12);
 }
 for(const p of world.players||[world]){const q=poses.get(p);if(p.hp<=0||!q)continue;const turn=clamp((Math.abs(q.turn)-1.25)/2.5);if(turn>0)for(const side of [-1,1]){const [x,y]=point(...localPoint(p,-30,side*27));fx(c,'vaporTrail',x,y,82,10,p.a,turn*.26)}}
 for(const f of s.passes)for(const side of [-1,1]){const [x,y]=point(...localPoint(f.player,-15,side*56));fx(c,'windStreak',x,y,135,22,f.player.a,f.life/.3*(.22+(f.rush??1)*.28))}
 if(s.headOnUntil>s.time){let count=0;const players=world.players||[world];for(const b of world.bullets||[]){
  if(b.life<=0||b.flak||b.rocket||b.cow37||b.motorCannon||!players.some(p=>p.hp>0&&Math.hypot(b.x-p.x,b.y-p.y)<330))continue;
  const [x,y]=point(b.x,b.y),a=Math.atan2(b.vy,b.vx);bolt(c,x,y,a,b.enemy?'#f0965a':'#f2d9a0',clamp(Math.hypot(b.vx,b.vy)*.035,18,42),6,.85);
  if(++count>=(world.viewWidth<=720?12:20))break;
 }}
 for(const w of s.wrecks){if(!visible(w.x,w.y))continue;const [x,y]=point(w.x,w.y);drawWreck(c,w,x,y,s.time,fx,planeSprite)}
 // Contact anchors move the existing combatFX entries; drawing them again here
 // would double the impact budget and obscure the aircraft.
}

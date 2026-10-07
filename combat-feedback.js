import {beginAircraftCrash,advanceAircraftCrash,drawAircraftCrash,enemyCanCrash,enemyCrashScale} from './aircraft-crash.js?v=hangar2';
// Presentation owns its own state and deterministic variation. Never consume the
// simulation RNG or write aircraft positions, headings, damage, or rewards here.
const worlds=new WeakMap(),poses=new WeakMap();
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const angle=n=>Math.atan2(Math.sin(n),Math.cos(n));
const ordinary=e=>e&&!e.bossPilot&&!e.ace&&!e.rivalAce&&!e.eliteKind&&!e.formationLeader&&!e.missionTarget&&!e.stageBossBody&&!e.bossMinion&&!e.heavyBomber&&!e.surface&&!e.stationary&&!e.fieldUnit&&!e.navalVessel&&!e.bugDrone&&['scout','hunter','bomber'].includes(e.type);
export const COMBAT_FEEDBACK_LIMITS=Object.freeze({impacts:40,compactImpacts:20,wrecks:10,compactWrecks:5,trail:48,compactTrail:24,plumes:64,compactPlumes:32});
export const COMBAT_CRASH_PROFILES=Object.freeze(['spin','smoke','fire','runaway']);
function localPoint(e,forward,side){const q=combatVisualPose(e),a=e.a+q.roll;return[e.x+q.x+Math.cos(a)*forward-Math.sin(a)*side*q.bank,e.y+q.y+Math.sin(a)*forward+Math.cos(a)*side*q.bank]}
export function impactMaterial(e,b){
 if(e.surface||e.fieldUnit||e.navalVessel||e.stageBossBody)return 'metal';
 const dx=b.x-e.x,dy=b.y-e.y,forward=dx*Math.cos(e.a)+dy*Math.sin(e.a),side=-dx*Math.sin(e.a)+dy*Math.cos(e.a);
 return forward>9&&Math.abs(side)<12?'metal':Math.abs(side)>15?'fabric':'wood';
}
export function combatVisualPose(e){return poses.get(e)||{x:0,y:0,roll:0,bank:1,active:false}}
function pose(e,time,dt,damageState){
 const q=poses.get(e)||{x:0,y:0,roll:0,bank:1,lastA:e.a,lastHp:e.hp,kick:0,turn:0};
 const rate=dt>0?clamp(angle(e.a-q.lastA)/dt,-4,4):0;
 q.turn+=(rate-q.turn)*(1-Math.exp(-dt*12));q.kick=Math.max(e.hp<q.lastHp-.4?1:0,q.kick-dt*6);
 const shot=!(e.reloadTime>0)&&!(e.cannonRecoil129>0)?clamp((e.muzzleFlash||0)/.04)*.18:0;
 const side=Math.sin(time*67)*q.kick*1.6;
 q.x=-Math.cos(e.a)*shot-Math.sin(e.a)*side;q.y=-Math.sin(e.a)*shot+Math.cos(e.a)*side;
 const hit=damageState?clamp(1-(time-damageState.lastHit)/.18):0;
 q.roll=Math.sin(time*61)*q.kick*.018+(damageState?.side||1)*Math.sin(hit*Math.PI)*.045;
 q.active=true;q.bank=1;q.lastA=e.a;q.lastHp=e.hp;poses.set(e,q);
}
export function attachCombatFeedback(world,{play=()=>{},pulse=()=>{},key=e=>e.escortPlane||e.bossPlane||e.plane,scale=()=>1}={}){
 if(worlds.has(world))return worlds.get(world);
 const state={impacts:[],wrecks:[],trail:[],plumes:[],passes:[],damage:new WeakMap(),serial:0,impactSerial:0,time:world.t||0,nextNear:0,nextPass:0,nextApproach:0,camera:0,duckUntil:0,headOnUntil:0,previous:new WeakMap(),whizzed:new WeakSet(),dead:new WeakSet(),pendingKill:null};
 worlds.set(world,state);
 const compact=()=>world.viewWidth<=720;
 const cap=(list,small,big)=>{const max=compact()?small:big;if(list.length>max)list.splice(0,list.length-max)};
 // Cosmetic copies reuse ace motion and production FX without simulation RNG.
 let visualSeed=0x41ce;const visualRandom=()=>((visualSeed=(Math.imul(visualSeed,1664525)+1013904223)>>>0)/4294967296);
 const burst=world.burst,smoke=world.smoke;
 const crashEffects={rng:visualRandom,
  smoke(x,y,heavy){state.trail=state.trail.filter(p=>p.life>0);if(state.trail.length>=(compact()?COMBAT_FEEDBACK_LIMITS.compactTrail:COMBAT_FEEDBACK_LIMITS.trail))return;smoke.call({rng:visualRandom,particles:world.particles},x,y,heavy);state.trail.push(world.particles.at(-1))},
  burst(x,y,color){world.combatFX??=[];const fire=this.wreck?.style==='fire';burst.call({rng:visualRandom,particles:world.particles,combatFX:world.combatFX},x,y,fire?color:'#ab9471',fire?30:12,'aircraftMedium')},
  event(){play(this.wreck?.style==='fire'?'impact':'airframeBreak')}
 };
 world.burst=function(x,y,color,n,...args){
  const e=color==='#f2aa52'&&n>=26?(this.enemies||[]).find(e=>ordinary(e)&&e.hp<=0&&!e.crashing&&!e.crashed&&!enemyCanCrash(e)&&Math.hypot(e.x-x,e.y-y)<2):null;
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
   state.wrecks.push(wreck);
   cap(state.wrecks,COMBAT_FEEDBACK_LIMITS.compactWrecks,COMBAT_FEEDBACK_LIMITS.wrecks);
  }
  return result;
 };
 const blast=world.combatBlast;
 if(blast)world.combatBlast=function(x,y,...args){const result=blast.call(this,x,y,...args);if((this.players||[this]).some(p=>p.hp>0&&Math.hypot(x-p.x,y-p.y)<240)){state.camera=Math.max(state.camera,1.1);pulse('explosion')}return result};
 const event=world.event;
 world.event=function(type,...args){const result=event.call(this,type,...args);if(type==='kill'&&state.pendingKill){const emitted=this.events?.at(-1);if(emitted?.type==='kill')emitted.combatSound=state.pendingKill;state.pendingKill=null}if(type==='impact'&&state.pendingImpact){const emitted=this.events?.at(-1);if(emitted?.type==='impact')emitted.combatMaterial=true;state.pendingImpact=false}if(type==='shot')pulse('shot');else if(type==='hit'){state.camera=Math.max(state.camera,.9);pulse('hit')}return result};
 for(const p of world.players||[world]){
  const impact=p.specialRoundImpact;
  if(impact)p.specialRoundImpact=function(b,e){
   const result=impact.call(this,b,e);if(b.patrol||b.flak||b.rocket||b.cow37||b.motorCannon)return result;
   const material=impactMaterial(e,b),index=++state.impactSerial;
   const dx=b.x-e.x,dy=b.y-e.y,forward=clamp(dx*Math.cos(e.a)+dy*Math.sin(e.a),-30,30),side=clamp(-dx*Math.sin(e.a)+dy*Math.cos(e.a),-30,30);
   const d=state.damage.get(e)||{engine:0,structure:0,lastHit:-Infinity,streak:0,nextSmoke:0,side:1,broken:false};
   d.streak=(world.t||0)-d.lastHit<.45?Math.min(6,d.streak+1):1;d.lastHit=world.t||0;d.side=Math.sign(side)||d.side;
   if(material==='metal')d.engine++;else d.structure++;state.damage.set(e,d);
   if(ordinary(e)&&e.hp>0&&e.hp/e.maxHp<.4&&!d.broken){d.broken=true;play('airframeBreak')}
   state.impacts.push({target:e,forward,side,x:b.x,y:b.y,a:Math.atan2(b.vy,b.vx),material,streak:d.streak,age:0,life:.28+(index%3)*.025});
   cap(state.impacts,COMBAT_FEEDBACK_LIMITS.compactImpacts,COMBAT_FEEDBACK_LIMITS.impacts);
   state.pendingImpact=true;play('materialImpact',{material,streak:d.streak});return result;
  };
 }
 const update=world.update;
 world.update=function(dt,...args){
  const before=this.t||0,result=update.call(this,dt,...args),step=Math.min(.04,Math.max(0,(this.t||0)-before));
  if(!step)return result;
  const players=(this.players||[this]).filter(p=>p.hp>0&&(!p.status||p.status==='alive'));
  state.time=this.t;state.camera=Math.max(0,state.camera-step*9);
  for(const p of players)pose(p,this.t,step);
  for(const e of this.enemies||[])if(ordinary(e)&&e.hp>0){
   const d=state.damage.get(e);pose(e,this.t,step,d);
   if(d&&e.hp/e.maxHp<.72&&this.t>=d.nextSmoke){
    d.nextSmoke=this.t+(compact()?.14:.09);const engine=d.engine>0,[x,y]=localPoint(e,engine?14:0,engine?0:d.side*20*scale(e));
    state.plumes.push({x,y,a:e.a,age:0,life:.85,heavy:e.hp/e.maxHp<.35,engine});
   }
  }
  for(const f of state.impacts){f.age+=step;if(f.target.hp>0&&f.age<.12)[f.x,f.y]=localPoint(f.target,f.forward,f.side)}state.impacts=state.impacts.filter(f=>f.age<f.life);
  for(const f of state.plumes)f.age+=step;state.plumes=state.plumes.filter(f=>f.age<f.life);cap(state.plumes,COMBAT_FEEDBACK_LIMITS.compactPlumes,COMBAT_FEEDBACK_LIMITS.plumes);
  for(const f of state.passes)f.life-=step;state.passes=state.passes.filter(f=>f.life>0);
  for(const w of state.wrecks){w.age+=step;crashEffects.wreck=w;advanceAircraftCrash(crashEffects,w,step)}
  state.wrecks=state.wrecks.filter(w=>!w.crashed);state.trail=state.trail.filter(p=>p.life>0);
  if(this.state==='playing'&&players.length){
   for(const e of this.enemies||[]){
    if(e.hp<=0||e.surface||e.stationary||e.fieldUnit)continue;
    let prior=state.previous.get(e);if(!prior){prior=new WeakMap();state.previous.set(e,prior)}
    for(const p of players){
     const d=Math.hypot(e.x-p.x,e.y-p.y),pass=prior.get(p)||{distance:d,armed:false,passed:false},radial=(d-pass.distance)/step;
     const dx=e.x-p.x,dy=e.y-p.y,headOn=d>0&&(Math.cos(p.a)*dx+Math.sin(p.a)*dy)/d>.86&&(-Math.cos(e.a)*dx-Math.sin(e.a)*dy)/d>.8;
     if(headOn&&d<440&&radial< -25)state.headOnUntil=this.t+.3;
     const heavy=e.heavyBomber||e.type==='bomber'||e.type==='zeppelin';
     if(d>1100)pass.announced=false;
     if(!pass.announced&&radial< -25&&d<(heavy?1000:620)&&(heavy||headOn)&&this.t>=state.nextApproach){pass.announced=true;state.nextApproach=this.t+2.5;play(heavy?'formationPass':'headOn')}
     if(d>180){pass.passed=false;pass.armed=false}
     if(!pass.passed&&d<180&&radial< -30)pass.armed=true;
     if(pass.armed&&pass.distance<95&&radial>30){pass.armed=false;pass.passed=true;if(this.t>=state.nextPass){state.nextPass=this.t+.7;state.camera=Math.max(state.camera,.65);state.duckUntil=this.t+.22;state.passes.push({player:p,life:.3});play('closePass');pulse('pass')}}
     pass.distance=d;prior.set(p,pass);
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
export function combatFlightSound(world){const p=(world.players||[world]).find(p=>p.hp>0)||world,s=worlds.get(world);return{reload:p.reloadTime>0,speed:p.airframeSpeed??1,turn:Math.abs(poses.get(p)?.turn||0),damage:clamp(1-p.hp/p.maxHp),duck:(s?.duckUntil||0)>(world.t||0)}}
function drawWreck(c,w,x,y,time,fx,planeSprite){
 if(w.style==='spin')drawAircraftCrash(c,w,x,y,time,fx);
 else fx(c,'smokeTrail',x-Math.cos(w.a)*56,y-Math.sin(w.a)*56,160,58,w.a,.8);
 const ws=w.scale*enemyCrashScale(w);if(w.type!=='bomber')planeSprite(c,x+14,y+22,w.a,w.key,ws,true,true);
 planeSprite(c,x,y,w.a,w.key,ws,true,false,0,true);if(w.style==='fire')fx(c,'fireEngine',x+Math.cos(w.a)*12,y+Math.sin(w.a)*12,58,66,w.a+Math.PI/2,.9);
}
export function drawCombatFeedback(c,world,point,{fx,planeSprite}){
 const s=worlds.get(world);if(!s)return;
 const visible=(x,y)=>Math.abs(x-world.x)<(world.viewWidth||960)+160&&Math.abs(y-world.y)<(world.viewHeight||700)+160;
 for(const f of s.plumes){if(!visible(f.x,f.y))continue;const [x,y]=point(f.x,f.y),k=f.age/f.life,size=16+k*(f.heavy?38:24);fx(c,f.heavy?'smokeDark':'engineSmoke',x,y,size,size,f.a,(1-k)*(f.heavy?.55:.35))}
 for(const e of world.enemies||[])if(ordinary(e)&&e.hp>0&&visible(e.x,e.y)){
  const d=s.damage.get(e);if(!d||e.hp/e.maxHp>=.4)continue;const [x,y]=point(...localPoint(e,d.engine>0?14:0,d.engine>0?0:d.side*18));
  fx(c,d.engine>0?'fireEngine':'fireWing',x,y,32,32,e.a+Math.PI/2,.6+Math.sin(s.time*21)*.12);
 }
 for(const p of world.players||[world]){const q=poses.get(p);if(p.hp<=0||!q)continue;const turn=clamp((Math.abs(q.turn)-1.25)/2.5);if(turn>0)for(const side of [-1,1]){const [x,y]=point(...localPoint(p,-30,side*27));fx(c,'vaporTrail',x,y,82,10,p.a,turn*.26)}}
 for(const f of s.passes)for(const side of [-1,1]){const [x,y]=point(...localPoint(f.player,-15,side*56));fx(c,'windStreak',x,y,135,22,f.player.a,f.life/.3*.5)}
 if(s.headOnUntil>s.time){let count=0;const players=world.players||[world];for(const b of world.bullets||[]){
  if(b.life<=0||b.flak||b.rocket||b.cow37||b.motorCannon||!players.some(p=>p.hp>0&&Math.hypot(b.x-p.x,b.y-p.y)<330))continue;
  const [x,y]=point(b.x,b.y),a=Math.atan2(b.vy,b.vx);fx(c,b.enemy?'tracerOrange':'tracerCream',x,y,clamp(Math.hypot(b.vx,b.vy)*.035,18,42),5,a,.8);
  if(++count>=(world.viewWidth<=720?12:20))break;
 }}
 for(const w of s.wrecks){if(!visible(w.x,w.y))continue;const [x,y]=point(w.x,w.y);drawWreck(c,w,x,y,s.time,fx,planeSprite)}
 for(const f of s.impacts){
  const attached=f.target.hp>0&&f.age<.12,[wx,wy]=attached?localPoint(f.target,f.forward,f.side):[f.x,f.y];if(!visible(wx,wy))continue;
  const [x,y]=point(wx,wy),k=f.age/f.life,size=(f.material==='metal'?29:35)+Math.min(4,f.streak)*2;
  fx(c,f.material==='metal'?'armorSpark':f.material==='fabric'?'smokePuff':'debris',x,y,size*(.8+k*.5),size,f.a,1-k);
  if(f.material!=='metal')fx(c,'debrisShard',x+Math.cos(f.a)*k*28,y+Math.sin(f.a)*k*28,14,14,f.a+k*3,(1-k)*.85);
 }
}

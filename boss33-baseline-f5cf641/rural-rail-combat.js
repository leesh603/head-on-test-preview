import {RailAdapter} from './boss-adapters129.js?v=tame3&ai=1018&sig=1019&boss=20261020b&phase=1021';
import {BaseBoss,predictPilot} from './headon-stageboss-core.js?v=tame3&ai=1018&sig=1019&boss=20261020b&phase=1021&harbor=20261021';
import {RURAL_RAIL,RURAL_CARS} from './rural-rail-layout.js?v=tame3';
import {createRailArtillery,aimRailArtillery,fireRailArtillery,updateRailArtillery} from './rural-rail-artillery.js?v=tame3';
import {brunoSalvo} from './bruno-raid.js?v=tame3&rail=40';
import {lincomparableRound} from './lincomparable-raid.js?v=tame3&ring=1023';

// Rural-only mechanics. The Cambrai carrier keeps its separate controller.
export class RuralRailBoss extends RailAdapter {
 constructor(o,kind){
  // Keep the approaching tail at the old spawn position, with the gun ahead.
  super({...o,y:(o.y||0)-(RURAL_RAIL.tailY-465)},kind);
  this.ruralRailBoss=true;this.baseReload=this.rail129.c.reloadSeconds;
  this.aimPlan=null;this.barrage=null;this.gunFlash=0;this.recovery=0;this.aaClock=1.6;this.aaPlan=null;
  this.railGun=createRailArtillery();this.phaseShots={1:0,2:0,3:0};
  if(kind==='paris-gun'){this.raidPhase=1;this.entry={age:0,initialized:false};this.observerMotion={vx:0,vy:-1};this.baseReload=Math.max(2.8,this.baseReload);this.rail129.c.reloadSeconds=this.baseReload;}
  if(kind==='lincomparable'){
   this.raidPhase=1;this.entry={age:0,initialized:false};this.reloadStress=0;this.finalAim=null;this.observerMotion={vx:0,vy:0};
   // A ~10 s firing cycle (was ~15 s): the gun fired only twice in a typical fight.
   this.baseReload=3.6;this.rail129.c.reloadSeconds=this.baseReload;this.rail129.c.moveSeconds=Math.min(this.rail129.c.moveSeconds,2.2);
   this.rail129.c.brakeSeconds=1.2;this.rail129.c.aimSeconds=Math.max(2.8,this.rail129.c.aimSeconds);
  }
  this.blindOrigin={x:this.x,y:this.y+RURAL_RAIL.tailY};this.frameBounds=null;this.ruralClock=0;
  for(const spec of RURAL_CARS){const p=this.parts.get(spec.id);Object.assign(p,{x:0,y:spec.y,hp:this.maxHp*spec.share,maxHp:this.maxHp*spec.share,hitRadiusY:188,role:spec.role});}
  // A visible fixed track section behind the tail remains independently hittable.
  this.rail129.railTarget={x:this.x,y:this.y+RURAL_RAIL.tailY+220,radius:34};this.syncRailPart();
 }
 syncRailPart(){const p=this.parts.get('rail'),q=this.rail129.railTarget;p.x=q.x-this.x;p.y=q.y-this.y;}
 // What the gun must still show before it can fall: each phase's own shot,
 // then the runaway's last salvo / last 520 mm round. Destroying every car
 // skips straight to the last shot; heavy firepower only shortens the waits.
 hpFloor(){
  if(this.dead)return 0;const m=this.maxHp,carsGone=this.railCarOrder.every(id=>this.parts.get(id).destroyed);
  // Released once the last salvo / round has actually landed: the derailed
  // locomotive is the finishing target, not the shell in flight.
  const finalDone=(this.kind==='lincomparable'?!!this.finalCounter:!!this.ironRainFired)&&this.ruralClock>=(this.finalLandAt||0);
  if(this.runawayTriggered129||carsGone)return finalDone?0:m*.06;
  // Count shots actually fired, not phase labels: heavy damage moves the raid
  // phase on before the gun has fired, so a per-phase check never held.
  // Bruno fires every few seconds, so it must show four salvos before its last
  // one; the 520 mm gun has a long lay and shows two rounds.
  const shots=this.shotsFired();if(this.entry)return this.showSchedule().hull[0][1]*m+1;
  for(const [need,pct] of this.showSchedule().hull)if(shots<need)return m*pct+1;
  return m*.06;
 }
 // Both guns were down in ~25 s with a late build: five 520 mm rounds / five Bruno salvos now.
 showSchedule(){return this.kind==='lincomparable'?{hull:[[1,.9],[2,.72],[3,.54],[4,.36],[5,.18]],cars:[1,2,4]}:{hull:[[1,.92],[2,.76],[3,.58],[4,.4],[5,.22]],cars:[2,4,5]};}
 shotsFired(){return (this.phaseShots[1]||0)+(this.phaseShots[2]||0)+(this.phaseShots[3]||0);}
 // Cars are the weak-point route, so they unlock with the gun's shots instead of
 // falling in the first second. Breaking cars stays as fast as the hull route.
 partFloor(id){const i=this.railCarOrder.indexOf(id);if(i<0||this.dead)return 0;return this.shotsFired()>=this.showSchedule().cars[i]?0:1;}
 // While the crew lays the gun, the marker follows the pilot to where the pilot
 // will be when the rounds land, then locks LOCK seconds before firing. Flying on
 // is hit; turning out after the lock is the dodge. A destroyed observer car
 // blinds the gun (old sector), which stays the weak-point reward.
 // ahead: the marker sits at least this far from the pilot along its course, so a slow
 // airframe that turns away still clears it while one flying on still meets it.
 leadPoint(p,t,ahead=0){const b=this.frameBounds,m=100;let q=predictPilot(p,t);const dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy),v=Math.hypot(p.vx||0,p.vy||0);
  if(ahead>0&&v>20&&d<ahead){const ux=d>1?dx/d:(p.vx||0)/v,uy=d>1?dy/d:(p.vy||0)/v;q={x:p.x+ux*ahead,y:p.y+uy*ahead};}let x=q.x,y=q.y;if(b){x=Math.max(b.left+m,Math.min(b.right-m,x));y=Math.max(b.top+m,Math.min(b.bottom-m,y));}return{x,y,vx:p.vx||0,vy:p.vy||0};}
 trackAim(){
  const rail=this.rail129,players=this.lastRaidPlayers||[];if(!players.length)return;const p=players[rail.shot%players.length];
  // The 520 mm lock comes 1 s before impact; its shock ring spreads slower than
  // a plane flies, so flying outward escapes it.
  const q=this.finalAim;
  // Lock long enough before impact that straightening out of a tight turn clears the blast.
  if(q?.tracking){q.locked=q.locked||q.remaining<=Math.min(2.7,1.6*Math.max(1,Math.min(2.6,2/(p.turn||2))));if(!q.locked){const keep={remaining:q.remaining,locked:false,tracking:true,blindAim:q.blindAim};const t=q.blindAim?this.leadPoint({...p,vx:0,vy:0},0):this.leadPoint(p,q.remaining,(q.radius||175)+45);Object.assign(q,lincomparableRound(t,2,this,{blind:false,final:true,stress:this.reloadStress,broken:rail.broken}),keep);aimRailArtillery(this,q.target);return;}}
  const plan=this.aimPlan;if(!plan||rail.phase!=='aim'||!rail.target)return;
  // Slow-turning airframes (bomber/airship transfers) get an earlier lock.
  const k=Math.max(1,Math.min(2.6,2/(p.turn||2))),LOCK=Math.min(rail.c.aimSeconds-.1,(this.kind==='lincomparable'?1.25:.6)*k);
  const rem=rail.c.aimSeconds-rail.time;if(plan.locked||rem<=LOCK){plan.locked=true;return;}
  // A blinded gun (observer car destroyed) still lays on the pilot it can see,
  // but cannot predict: it aims where the pilot is, so simply flying on escapes.
  // A blinded gun (observer car gone) cannot predict: it lays on where the pilot is
  // now, so a pilot circling in place is hit and flying on escapes. The sighted gun
  // predicts, so flying on is hit and turning escapes. Either way: change course.
  const blind=!!plan.blind,lead=(t,r)=>blind?this.leadPoint({...p,vx:0,vy:0},0):this.leadPoint(p,t,r+45);
  if(this.kind==='paris-gun'){const t=lead(rem+(plan.warning??.9)+2*(plan.interval||.32),plan.radius||88);this.aimPlan=brunoSalvo(t,this.raidPhase,rail.shot,this.frameBounds,{blind,extra:this.brunoBarrage?2:this.hp<=this.maxHp*.62?1:0});rail.target={...t};aimRailArtillery(this,t);}
  else if(this.kind==='lincomparable'){const t=lead(rem+.05,plan.radius||92);this.aimPlan=lincomparableRound(t,this.raidPhase,this,{blind});rail.target={...t};aimRailArtillery(this,t);}
 }
 counterWindow(){return this.recovery>0?1.35:super.counterWindow();}
 refreshReload(){this.rail129.c.reloadSeconds=this.baseReload*(this.parts.get('car-front').destroyed?1.6:1)*(this.kind==='lincomparable'&&this.rail129.broken?1.4:1);}
 railEvent(e){
  if(e.type==='aim'){
   const blind=this.parts.get('car-middle').destroyed,target=blind?{...this.blindOrigin,vx:0,vy:0}:{...e.target};
   this.rail129.target={...target};
   this.aimPlan={target,blind,mode:this.rail129.shot%2?'cross':'march',points:[{x:target.x,y:target.y}]};
   if(this.kind==='paris-gun'){
    // Phase I ranges at the sampled position; Phase II leads movement only
    // while the observer survives. Destroyed observers keep their old sector.
    if(!blind){const lead=this.raidPhase===1?-.65:.35;target.x+=(target.vx||0)*lead;target.y+=(target.vy||0)*lead;}
    this.aimPlan=brunoSalvo(target,this.raidPhase,this.rail129.shot,blind?null:this.frameBounds,{blind,extra:this.brunoBarrage?2:this.hp<=this.maxHp*.62?1:0});
    this.rail129.target={...target};
   }
   if(this.kind==='lincomparable')this.aimPlan=lincomparableRound(target,this.raidPhase,this,{blind});
   aimRailArtillery(this,target);
   this.emit({...e,type:'rural-aim',target,bossId:this.id});return;
  }
  if(e.type==='fire'){
   const blind=this.parts.get('car-middle').destroyed;
   const plan=this.aimPlan||(this.kind==='lincomparable'
    ?lincomparableRound(e.target,this.raidPhase,this,{blind})
    :brunoSalvo(e.target,this.raidPhase,this.rail129.shot,this.frameBounds,{blind}));
   this.blindOrigin={...plan.target};this.aimPlan=null;
   this.refreshReload();
   this.phaseShots[this.raidPhase||1]=(this.phaseShots[this.raidPhase||1]||0)+1;
   if(this.kind==='lincomparable'){
    this.fire520(plan);this.recovery=this.rail129.c.recoilSeconds+this.rail129.c.reloadSeconds;
   }else{
    this.fireBarrage(plan);this.recovery=this.rail129.c.recoilSeconds+this.rail129.c.reloadSeconds;
    if(this.raidPhase===2&&this.railCarOrder.some(id=>!this.parts.get(id).destroyed)){this.aaPlan=null;this.aaClock=(plan.points.length-1)*plan.interval+.3;}
   }
   return;
  }
  if(e.type==='rail-break'){
   this.refreshReload();
   if(this.kind==='paris-gun'&&this.runawayTriggered129){
    this.barrage=null;this.emit({type:'cancel-hazards',bossId:this.id,tag:this.id+':iron-rain'});
   }
   if(this.kind==='lincomparable'&&this.finalAim){
    const q=this.finalAim,remaining=q.remaining,locked=q.locked;Object.assign(q,lincomparableRound(q.target,2,this,{blind:q.blind,final:true,stress:this.reloadStress,broken:true}),{remaining,locked});
   }
  }
  if(e.type==='runaway-start'){
   // Pull the locomotive away from its abandoned tail without reflecting back.
   const rail=this.rail129;rail.from.y-=1600;rail.length+=1600;rail.s+=1600;rail.direction=-1;
   this.aimPlan=null;this.aaPlan=null;this.barrage=null;
   if(this.kind==='paris-gun'){
    this.emit({type:'cancel-hazards',bossId:this.id,tag:this.id+':bruno-salvo'});
    const p=this.lastRaidPlayers?.[rail.shot%this.lastRaidPlayers.length]||this.blindOrigin;
    const blind=this.parts.get('car-middle').destroyed,motion=blind?this.observerMotion:p;
    const lead=blind?0:(rail.broken?.5:1.05),aim={...p,x:p.x+(blind?0:(p.vx||0)*lead),y:p.y+(blind?0:(p.vy||0)*lead),vx:motion.vx||0,vy:motion.vy||0};
    const plan=brunoSalvo(aim,2,rail.shot,this.frameBounds,{final:true,blind,broken:rail.broken,starved:this.parts.get('car-front').destroyed});
    this.fireBarrage(plan);this.raidPhase=3;this.ironRainFired=true;this.finalLandAt=this.ruralClock+(plan.warning||1)+plan.points.length*(plan.interval||.22)+.4;
    this.emit({type:'bruno-iron-rain',bossId:this.id,...this.rail129.pose});
   }
   if(this.kind==='lincomparable'){
    this.emit({type:'cancel-hazards',bossId:this.id,tag:this.id+':520-round'});
    const p=this.lastRaidPlayers?.[rail.shot%this.lastRaidPlayers.length]||this.blindOrigin;
    const blind=this.parts.get('car-middle').destroyed;
    // The last 520 mm shot commits one coordinate for the full long lay. It
    // cannot follow the pilot after the warning has begun.
    // The last 520 mm round follows the pilot through its long lay and locks
    // 0.7 s before it lands, where the pilot will be: a late hard turn is the dodge.
    this.finalAim={...lincomparableRound({x:p.x,y:p.y,vx:0,vy:0},2,this,{blind,final:true,stress:this.reloadStress,broken:rail.broken}),remaining:2.8,locked:false,tracking:true,blindAim:blind};
    this.raidPhase=3;aimRailArtillery(this,this.finalAim.target);
    this.emit({type:'rural-aim',target:{...this.finalAim.target},seconds:2.8,bossId:this.id});
    this.emit({type:'phase-change',bossId:this.id,phase:'lincomparable-locked'});
    this.emit({type:'lincomparable-last-520',bossId:this.id,...rail.pose});
   }
  }
  super.railEvent(e);
 }
 // The whole wave is laid out at once so the march reads as a domino: every
 // marker shows immediately and the shells land on the gun's firing beat.
 fireBarrage(plan){
  const interval=plan.interval||this.t.barrageInterval||.32;
  fireRailArtillery(this);
  plan.points.forEach((p,i)=>this.emit({type:'hazard',bossId:this.id,kind:'circle',...p,warning:(plan.warning??.85)+i*interval,delay:0,duration:plan.duration??.35,once:true,radius:plan.radius??88,damage:this.t.damage*(i===plan.points.length-1?2.4:1),raidHeavy:i===plan.points.length-1,visual:'rail-shell',tag:plan.final?this.id+':iron-rain':this.kind==='paris-gun'?this.id+':bruno-salvo':null}));
  // The volley ends when the gun's last shot leaves the barrel; the trailing
  // markers still count down on their own.
  this.barrage={...plan,index:1,clock:0,total:(plan.points.length-1)*interval+.02};
 }
 fire520(plan){
  const target={x:plan.target.x,y:plan.target.y},tag=this.id+(plan.final?':last-520':':520-round');
  const emit=spec=>this.emit({type:'hazard',bossId:this.id,kind:'circle',tag,...spec});
  emit({...target,warning:.02,delay:0,duration:plan.centerDuration,once:true,radius:plan.radius,damage:this.t.damage*2.4,raidHeavy:true,visual:'rail-shell'});
  emit({...target,warning:plan.waveWarning,delay:plan.waveDelay,duration:plan.waveDuration,once:true,radius:plan.wave,radiusStart:plan.start,radiusLimit:plan.wave,ringWidth:42,ringSpeed:(plan.wave-plan.start)/plan.waveDuration,damage:this.t.damage*1.6,raidHeavy:true,visual:'rural-rail-shock'});
  emit({...plan.smoke,warning:plan.smokeWarning,delay:plan.smokeDelay,duration:plan.smokeDuration,once:false,tickInterval:.7,damage:this.t.damage*.22,visual:'rural-rail-smoke'});
  // The expanding pressure front is the secondary attack. Do not add radial
  // bullets: hiding their art would leave invisible damage beyond the wave.
  fireRailArtillery(this);
 }
 onPartDestroyed(p){
  if(p.kind!=='rail-car')return;
  const detachSpeed=Math.min(this.rail129.velocity,this.rail129.c.speed);
  p.detachedPose={x:this.x+p.x,y:this.y+p.y,vx:10,vy:detachSpeed*this.rail129.direction*.45,angle:0,age:0};
  this.pullAway=true;
  if(this.aaPlan?.car===p)this.aaPlan=null;
  if(p.id==='car-middle'){
   if(this.aimPlan)this.blindOrigin={...this.aimPlan.target};
   this.aimPlan=null;
   if(this.rail129.phase==='aim'){this.rail129.target=null;this.rail129.time=0;}
   this.emit({type:'phase-change',bossId:this.id,phase:'observer-destroyed'});
  }
  if(p.id==='car-front'){
   this.refreshReload();this.emit({type:'ammo-cookoff',bossId:this.id,x:p.detachedPose.x,y:p.detachedPose.y});
   this.emit({type:'phase-change',bossId:this.id,phase:'ammo-starved'});
  }
  super.onPartDestroyed(p);
  if(this.railCarOrder.every(id=>this.parts.get(id).destroyed)){
   // A round already laid by the gun retains its warning and impact timings
   // when the last car detaches. The controller still fires that same round.
   this.aaPlan=null;this.barrage=null;this.coreVulnerable=true;this.hp=Math.min(this.hp,this.maxHp*.14);
   this.emit({type:'cancel-hazards',bossId:this.id,tag:this.id+':bruno-salvo'});
   this.emit({type:'cancel-hazards',bossId:this.id,tag:this.id+':520-round'});
   this.emit({type:'phase-change',bossId:this.id,phase:'locomotive-finish'});
  }
 }
 update(dt,ctx){
  if(this.dead||ctx.paused)return;dt=Math.min(dt,.25);this.ruralClock+=dt;this.frameBounds=ctx.bounds;
  this.lastRaidPlayers=(ctx.players||[]).filter(p=>p.alive!==false&&Number.isFinite(p.x)&&Number.isFinite(p.y));
  if(this.kind==='lincomparable'&&!this.parts.get('car-middle').destroyed&&this.lastRaidPlayers.length){const p=this.lastRaidPlayers[this.rail129.shot%this.lastRaidPlayers.length];this.observerMotion={vx:p.vx||0,vy:p.vy||0};}
  if(this.kind==='paris-gun'){
   this.lastRaidPlayers=(ctx.players||[]).filter(p=>p.alive!==false&&Number.isFinite(p.x)&&Number.isFinite(p.y));
   if(!this.parts.get('car-middle').destroyed&&this.lastRaidPlayers.length){const p=this.lastRaidPlayers[this.rail129.shot%this.lastRaidPlayers.length];this.observerMotion={vx:p.vx||0,vy:p.vy||0};}
   if(this.updateBrunoEntry(dt,ctx))return;
   const rear=this.parts.get('car-rear');
   if(this.raidPhase===1&&(this.hp<=this.maxHp*.92||rear.hp<=rear.maxHp*.5)){
    this.raidPhase=2;this.emit({type:'phase-change',bossId:this.id,phase:'bruno-tracking'});
   }
   // Late fight: the crew stops repositioning as long between salvos and the
   // march grows to seven shells (count rises at 62% too).
   if(this.raidPhase===2&&!this.brunoBarrage&&this.hp<=this.maxHp*.5){
    this.brunoBarrage=true;this.rail129.c.moveSeconds=2.3;this.emit({type:'phase-change',bossId:this.id,phase:'bruno-barrage'});
   }
  }
  if(this.kind==='lincomparable'){
   if(this.update520Entry(dt,ctx))return;
   const rear=this.parts.get('car-rear');
   if(this.raidPhase===1&&(this.hp<=this.maxHp*.84||rear.destroyed)){
    this.raidPhase=2;this.emit({type:'phase-change',bossId:this.id,phase:'lincomparable-shock-link'});
   }
   // Damage shakes the loading crew, but the 520 mm round still has a long,
   // readable reload rather than cycling like a field gun.
   if(this.raidPhase===2&&!this.hastyReload&&this.hp<=this.maxHp*.55){
    this.hastyReload=true;this.baseReload=Math.max(3.2,this.baseReload*.9);this.refreshReload();
    this.emit({type:'phase-change',bossId:this.id,phase:'lincomparable-strained-reload'});
   }
  }
  this.trackAim();
  this.gunFlash=Math.max(0,this.gunFlash-dt);this.refreshReload();
  const rail=this.rail129,oldS=rail.s,oldPose={x:this.x,y:this.y};
  if(this.pullAway&&rail.phase==='move'){rail.direction=-1;this.pullAway=false;}
  this.railGun.shotAge+=dt;
  rail.update(dt,ctx);Object.assign(this,rail.pose);
  for(const spec of RURAL_CARS){const p=this.parts.get(spec.id),q=p.detachedPose;if(!q)continue;
   q.age+=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.angle=Math.min(.12,q.angle+dt*.14);const drag=Math.exp(-dt*4);q.vx*=drag;q.vy*=drag;
   p.x=q.x-this.x;p.y=q.y-this.y;p.angle=q.angle;
  }
  const attached=[{x:0,y:0},...RURAL_CARS.map(s=>this.parts.get(s.id)).filter(p=>!p.destroyed)];
  const blocked=RURAL_CARS.some(s=>{const p=this.parts.get(s.id);return p.detachedPose&&attached.some(a=>Math.abs(this.x+a.x-p.detachedPose.x)<120&&Math.abs(this.y+a.y-p.detachedPose.y)<360);});
  if(blocked&&!this.derailed129){rail.s=oldS;Object.assign(this,oldPose);this.pullAway=true;
   if(rail.phase==='move'){rail.brakeStart=0;rail.enter('brake');}rail.velocity=0;
   for(const spec of RURAL_CARS){const p=this.parts.get(spec.id),q=p.detachedPose;if(q){p.x=q.x-this.x;p.y=q.y-this.y;}}
  }
  this.syncRailPart();
  // Armor is open throughout the real recoil/reload state, including slow reload.
  this.recovery=['recoil','reload'].includes(rail.phase)?Math.max(.01,(rail.phase==='recoil'?rail.c.recoilSeconds-rail.time+rail.c.reloadSeconds:rail.c.reloadSeconds-rail.time)):0;
  if(this.barrage){const q=this.barrage,interval=q.interval||this.t.barrageInterval||.32;q.clock+=dt;
   // One railway round owns the full committed impact pattern. Recoil and
   // reload begin immediately; later markers do not fake extra gun shots.
   while(q.index<q.points.length&&q.clock>=q.index*interval)q.index++;
   if(q.clock>=q.total){this.barrage=null;if(this.kind==='paris-gun'&&this.raidPhase===2&&!q.final&&this.railCarOrder.some(id=>!this.parts.get(id).destroyed))this.aaClock=.3;}}
  updateRailArtillery(this,dt);
  if(this.finalAim){
   const q=this.finalAim;q.remaining-=dt;
   if(this.finalAim.remaining<=0){const plan=this.finalAim;this.finalAim=null;this.fire520(plan);this.finalCounter=true;this.finalLandAt=this.ruralClock+(plan.waveDelay||1)+(plan.waveDuration||.6)+.3;this.emit({type:'phase-change',bossId:this.id,phase:'lincomparable-counter'});}
  }
  this.updateDefense(dt,ctx.players||[]);
  if(!this.runawayTriggered129)this.phase=this.coreVulnerable?'locomotive':rail.phase;
 }
 update520Entry(dt,ctx){
  const e=this.entry,r=this.rail129;if(!e)return false;
  if(r.phase!=='move'||r.broken||this.railCarOrder.some(id=>this.parts.get(id).destroyed)){
   if(e.initialized){r.from.y=this.y-r.length/2;r.to.y=this.y+r.length/2;r.s=r.length/2;}
   this.entry=null;return false;
  }
  const bounds=ctx.bounds,p=this.lastRaidPlayers[0];if(!bounds||!p){this.entry=null;return false;}
  if(!e.initialized){
   const width=bounds.right-bounds.left,side=p.x>(bounds.left+bounds.right)/2?-1:1;
   this.x=Math.max(bounds.left+110,Math.min(bounds.right-110,p.x+side*Math.min(170,width*.26)));
   e.startY=bounds.bottom+200;this.y=e.startY;e.initialized=true;
   r.from={x:this.x,y:this.y-r.length/2};r.to={x:this.x,y:this.y+r.length/2};r.s=r.length/2;
   r.railTarget={x:this.x,y:Math.max(bounds.top+90,Math.min(bounds.bottom-90,p.y+190)),radius:34};this.syncRailPart();
   this.emit({type:'lincomparable-rail-discovered',bossId:this.id,x:this.x,y:r.railTarget.y});
  }
  e.age+=dt;const oldY=this.y;
  if(e.age<=.8){r.velocity=0;this.phase='arrival';return true;}
  const q=Math.min(1,(e.age-.8)/4.8),stop=Math.max(bounds.top+160,Math.min(bounds.bottom-160,p.y-190));
  this.y=e.startY+(stop-e.startY)*(q*(2-q));r.s=this.y-r.from.y;r.velocity=Math.abs(this.y-oldY)/dt;r.direction=-1;
  this.railGun.shotAge+=dt;updateRailArtillery(this,dt);this.syncRailPart();this.phase='arrival';
  if(q===1){this.entry=null;r.from.y=this.y-r.length/2;r.to.y=this.y+r.length/2;r.s=r.length/2;r.velocity=0;r.target=null;r.enter('brake');r.brakeStart=0;this.railGun.brakeAge=0;this.emit({type:'rural-rail-brake',bossId:this.id});this.emit({type:'phase-change',bossId:this.id,phase:'lincomparable-heavy-shell'});}
  return true;
 }
 updateBrunoEntry(dt,ctx){
  const e=this.entry,r=this.rail129;if(!e)return false;
  // Explicit Test Lab phase staging and an early rail hit still use the real
  // controller. Never relocate a track or an already detached carriage.
  if(r.phase!=='move'||r.broken||this.railCarOrder.some(id=>this.parts.get(id).destroyed)){
   if(e.initialized){r.from.y=this.y-r.length/2;r.to.y=this.y+r.length/2;r.s=r.length/2;}
   this.entry=null;return false;
  }
  const bounds=ctx.bounds,p=this.lastRaidPlayers?.[0];if(!bounds||!p){this.entry=null;return false;}
  if(!e.initialized){
   const width=bounds.right-bounds.left,offset=Math.min(190,width*.28),side=p.x>(bounds.left+bounds.right)/2?-1:1;
   this.x=Math.max(bounds.left+110,Math.min(bounds.right-110,p.x+side*offset));
   e.startY=bounds.bottom+200;this.y=e.startY;e.initialized=true;
   r.from={x:this.x,y:this.y-r.length/2};r.to={x:this.x,y:this.y+r.length/2};r.s=r.length/2;
   r.railTarget={x:this.x,y:Math.max(bounds.top+90,Math.min(bounds.bottom-90,p.y+190)),radius:34};this.syncRailPart();
   this.emit({type:'bruno-rail-discovered',bossId:this.id,x:this.x,y:r.railTarget.y});
  }
  e.age+=dt;const oldY=this.y;
  if(e.age<=.55){r.velocity=0;this.phase='arrival';return true;}
  const q=Math.min(1,(e.age-.55)/3.2),stop=Math.max(bounds.top+160,Math.min(bounds.bottom-160,p.y-190));
  // Follow the visible forward stop during approach, along one fixed rail.
  // No writes to players or camera; no independently moving cutscene sprite.
  this.y=e.startY+(stop-e.startY)*(q*(2-q));
  r.s=this.y-r.from.y;r.velocity=Math.abs(this.y-oldY)/dt;r.direction=-1;
  this.railGun.shotAge+=dt;updateRailArtillery(this,dt);this.syncRailPart();this.phase='arrival';
  if(q===1){
   this.entry=null;r.from.y=this.y-r.length/2;r.to.y=this.y+r.length/2;r.s=r.length/2;
   r.velocity=0;r.target=null;r.enter('brake');r.brakeStart=0;
   this.railGun.brakeAge=0;this.emit({type:'rural-rail-brake',bossId:this.id});
   this.emit({type:'phase-change',bossId:this.id,phase:'bruno-ranging'});
  }
  return true;
 }
 updateDefense(dt,players){
  const cars=this.railCarOrder.map(id=>this.parts.get(id)).filter(c=>c&&!c.destroyed);
  for(const c of this.railCarOrder){const car=this.parts.get(c);if(car)car.gunFlash=Math.max(0,(car.gunFlash||0)-dt);}
  if(!cars.length||this.runawayTriggered129)return;
  // During the heavy gun's lay, recoil and reload the car gunners stand down;
  // the train's move phase is the lure and screening-fire beat.
  if(['aim','brake'].includes(this.rail129.phase)){this.aaPlan=null;this.aaClock=Math.max(this.aaClock||0,.6);return;}
  // The recoil/reload after a heavy shot is the announced counter window: gunners hold fire.
  if(this.recovery>0){this.aaPlan=null;this.aaClock=Math.max(this.aaClock||0,.6);return;}
  if(this.aaPlan){this.aaPlan.remaining-=dt;if(this.aaPlan.remaining<=0){
   const car=this.aaPlan.car;if(car.destroyed){this.aaPlan=null;this.aaClock=.5;return;}
   const a=this.aaPlan.angle,x=this.x,y=this.y+car.y-145,speed=(this.t.bulletSpeed||260)*.85;
   car.gunFlash=.14;car.shotAngle=a;
   for(const da of [-.2,-.1,0,.1,.2])this.emit({type:'hazard',bossId:this.id,kind:'projectile',x,y,vx:Math.cos(a+da)*speed,vy:Math.sin(a+da)*speed,radius:5,warning:0,delay:0,duration:3.2,damage:this.t.damage*.4,visual:'rail-mg'});
   this.aaPlan=null;this.aaClock=2.8/(this.t.patternMultiplier||1)/cars.length;
  }return;}
  this.aaClock-=dt;if(this.aaClock>0)return;
  this._defenseTurn=((this._defenseTurn||0)+1)%cars.length;const car=cars[this._defenseTurn];
  const p=players.filter(p=>p.alive!==false).sort((a,b)=>Math.hypot(a.x-this.x,a.y-this.y-car.y)-Math.hypot(b.x-this.x,b.y-this.y-car.y))[0];
  if(!p||Math.hypot(p.x-this.x,p.y-this.y-car.y)>850)return;
  // Lead the pilot by the bullets' flight time, so holding a straight course is punished.
  const oy=this.y+car.y-145,speed=(this.t.bulletSpeed||260)*.85,q=predictPilot(p,.45+Math.hypot(p.x-this.x,p.y-oy)/speed*.8);
  this.aaPlan={car,angle:Math.atan2(q.y-oy,q.x-this.x),remaining:.45};
 }
 hit(s){
  if(!Number.isFinite(s.damage)||s.damage<0)throw new Error('Invalid damage');
  if(this.dead)return{damage:0,blocked:true};
  const p=this.parts.get(s.partId);
  if(p?.kind==='rail-car'){
   const result=BaseBoss.prototype.hit.call(this,s);this.hp=Math.max(Math.min(this.hp,this.maxHp*.4),this.hp-result.damage);return result;
  }
  const damage=!s.partId&&this.kind==='lincomparable'&&!this.derailed129?s.damage*(this.recovery>0?1.35:.35):s.damage;
  if(!s.partId&&this.kind==='lincomparable'&&this.coreVulnerable&&!this.runawayTriggered129&&this.recovery>0){
   this.reloadStress=Math.min(1,this.reloadStress+Math.min(damage,Math.max(0,this.hp-this.maxHp*.28))/(this.maxHp*.12));
  }
  return super.hit({...s,damage});
 }
 locateHit(s){return this.dead?null:super.locateHit(s);}
 dispose(){this.entry=null;this.finalAim=null;this.aimPlan=null;this.aaPlan=null;this.barrage=null;super.dispose();}
}


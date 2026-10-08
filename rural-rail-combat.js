import {RailAdapter} from './boss-adapters129.js?v=tame3';
import {BaseBoss} from './headon-stageboss-core.js?v=tame3';
import {RURAL_RAIL,RURAL_CARS} from './rural-rail-layout.js?v=tame3';
import {createRailArtillery,aimRailArtillery,fireRailArtillery,updateRailArtillery} from './rural-rail-artillery.js?v=tame3';
import {brunoSalvo,brunoRhythmSalvo,brunoFragments} from './bruno-raid.js?v=tame3&rail=12';
import {lincomparableRound} from './lincomparable-raid.js?v=tame3';

// Rural-only mechanics. The Cambrai carrier keeps its separate controller.
export class RuralRailBoss extends RailAdapter {
 constructor(o,kind){
  // Keep the approaching tail at the old spawn position, with the gun ahead.
  super({...o,y:(o.y||0)-(RURAL_RAIL.tailY-465)},kind);
  this.ruralRailBoss=true;this.baseReload=this.rail129.c.reloadSeconds;
  this.aimPlan=null;this.barrage=null;this.gunFlash=0;this.recovery=0;this.aaClock=1.6;this.aaPlan=null;
  this.railGun=createRailArtillery();
  if(kind==='paris-gun'){this.raidPhase=1;this.entry={age:0,initialized:false};this.observerMotion={vx:0,vy:-1};this.rail129.c.aimSeconds=1.6;this.brunoBeat=0;this.brunoAttackUntil=0;}
  if(kind==='lincomparable'){
   this.raidPhase=1;this.entry={age:0,initialized:false};this.reloadStress=0;this.finalAim=null;this.observerMotion={vx:0,vy:0};
   this.baseReload=Math.max(3.2,this.baseReload);this.rail129.c.reloadSeconds=this.baseReload;
   this.rail129.c.brakeSeconds=1.2;this.rail129.c.aimSeconds=Math.max(1.8,this.rail129.c.aimSeconds);
  }
  this.blindOrigin={x:this.x,y:this.y+RURAL_RAIL.tailY};this.frameBounds=null;this.ruralClock=0;
  for(const spec of RURAL_CARS){const p=this.parts.get(spec.id);Object.assign(p,{x:0,y:spec.y,hp:this.maxHp*spec.share,maxHp:this.maxHp*spec.share,hitRadiusY:188,role:spec.role});}
  // A visible fixed track section behind the tail remains independently hittable.
  this.rail129.railTarget={x:this.x,y:this.y+RURAL_RAIL.tailY+220,radius:34};this.syncRailPart();
 }
 syncRailPart(){const p=this.parts.get('rail'),q=this.rail129.railTarget;p.x=q.x-this.x;p.y=q.y-this.y;}
 refreshReload(){this.rail129.c.reloadSeconds=this.baseReload*(this.parts.get('car-front').destroyed?1.6:1)*(this.kind==='lincomparable'&&this.rail129.broken?1.4:1);}
 railEvent(e){
  if(e.type==='aim'){
   const blind=this.parts.get('car-middle').destroyed,target=blind?{...this.blindOrigin,vx:0,vy:0}:{...e.target};
   this.rail129.target={...target};
   this.aimPlan={target,blind,mode:this.rail129.shot%2?'cross':'march',points:[{x:target.x,y:target.y}]};
   if(this.kind==='paris-gun'){
    // Undo the controller's .65s sample; the plan predicts each impact itself.
    if(!blind){target.x-=(target.vx||0)*.65;target.y-=(target.vy||0)*.65;}
    this.aimPlan=brunoRhythmSalvo(target,this.raidPhase,this.rail129.shot,blind?null:this.frameBounds,{blind});
    this.rail129.target={...target};this.brunoBeat=1;
    const rear=this.parts.get('car-rear'),x=this.x,y=this.y+rear.y-145;
    this.aaPlan=rear.destroyed?null:{angle:Math.atan2(target.y-y,target.x-x),remaining:0};
   }
   if(this.kind==='lincomparable')this.aimPlan=lincomparableRound(target,this.raidPhase,this,{blind});
   aimRailArtillery(this,target);
   this.emit({...e,type:'rural-aim',target,bossId:this.id});return;
  }
  if(e.type==='fire'){
   const plan=this.aimPlan||{target:e.target,points:[e.target]};this.blindOrigin={...plan.target};this.aimPlan=null;
   this.refreshReload();
   if(this.kind==='lincomparable'){
    this.fire520(plan);this.recovery=this.rail129.c.recoilSeconds+this.rail129.c.reloadSeconds;
   }else{
    this.fireBarrage(plan);
   }
   return;
  }
  if(e.type==='rail-break'){
   this.refreshReload();
   if(this.kind==='paris-gun'&&this.runawayTriggered129){
    this.barrage=null;this.emit({type:'cancel-hazards',bossId:this.id,tag:this.id+':iron-rain'});
   }
   if(this.kind==='lincomparable'&&this.finalAim){
    const q=this.finalAim;Object.assign(q,lincomparableRound(q.target,2,this,{blind:q.blind,final:true,stress:this.reloadStress,broken:true}));
   }
  }
  if(e.type==='runaway-start'){
   // Pull the locomotive away from its abandoned tail without reflecting back.
   const rail=this.rail129;rail.from.y-=1600;rail.length+=1600;rail.s+=1600;rail.direction=-1;
   this.aimPlan=null;this.aaPlan=null;this.barrage=null;
   if(this.kind==='paris-gun'){
    this.brunoBeat=0;this.brunoAttackUntil=0;
    this.emit({type:'cancel-hazards',bossId:this.id,tag:this.id+':bruno-salvo'});
    const p=this.lastRaidPlayers?.[rail.shot%this.lastRaidPlayers.length]||this.blindOrigin;
    const blind=this.parts.get('car-middle').destroyed,motion=blind?this.observerMotion:p;
    const plan=brunoSalvo({...p,vx:motion.vx||0,vy:motion.vy||0},2,rail.shot,this.frameBounds,{final:true,blind,broken:rail.broken,starved:this.parts.get('car-front').destroyed});
    this.fireBarrage(plan);this.raidPhase=3;
    this.emit({type:'bruno-iron-rain',bossId:this.id,...this.rail129.pose});
   }
   if(this.kind==='lincomparable'){
    this.emit({type:'cancel-hazards',bossId:this.id,tag:this.id+':520-round'});
    const p=this.lastRaidPlayers?.[rail.shot%this.lastRaidPlayers.length]||this.blindOrigin;
    const blind=this.parts.get('car-middle').destroyed;
    const motion=blind?this.observerMotion:p;
    // Preview a drifting aim for 1.4s, then lock for another full 1.4s.
    // The destroyed observer uses stale motion, never a new homing sample.
    this.finalAim={...lincomparableRound(p,2,this,{blind,final:true,stress:this.reloadStress,broken:rail.broken}),remaining:2.8,
     originTarget:{x:p.x,y:p.y},forecast:{x:p.x+(motion.vx||0)*2.8,y:p.y+(motion.vy||0)*2.8}};
    this.raidPhase=3;aimRailArtillery(this,this.finalAim.target);
    this.emit({type:'lincomparable-last-520',bossId:this.id,...rail.pose});
   }
  }
  super.railEvent(e);
 }
 // The whole wave is laid out at once so the march reads as a domino: every
 // marker shows immediately and the shells land on the gun's firing beat.
 fireBarrage(plan){
  if(plan.rhythm){
   this.barrage={...plan,index:0,clock:0,startedAt:this.ruralClock,firedRows:0};
   this.brunoBeat=3;if(this.aaPlan)this.aaPlan.remaining=0;
   this.brunoAttackUntil=this.ruralClock+plan.end+.05;
   this.baseReload=Math.max(this.baseReload,plan.end+.05+3.2-this.rail129.c.recoilSeconds);this.refreshReload();
   for(const p of plan.points){
    this.emit({type:'hazard',bossId:this.id,kind:'circle',x:p.x,y:p.y,warning:plan.warning+p.at,delay:0,
     duration:plan.duration,once:true,radius:p.radius,damage:this.t.damage,visual:'rail-shell',tag:this.id+':bruno-salvo'});
    if(p.heavy)for(const fragment of brunoFragments(plan,p))this.emit({type:'hazard',bossId:this.id,...fragment,delay:plan.warning+p.at,damage:this.t.damage*.32,tag:this.id+':bruno-salvo'});
   }
   this.emit({type:'rail-aim',bossId:this.id,beat:3});return;
  }
  const interval=plan.interval||this.t.barrageInterval||.32;
  fireRailArtillery(this);
  plan.points.forEach((p,i)=>this.emit({type:'hazard',bossId:this.id,kind:'circle',...p,warning:(plan.warning??.85)+i*interval,delay:0,duration:plan.duration??.35,once:true,radius:plan.radius??88,damage:this.t.damage,visual:'rail-shell',tag:plan.final?this.id+':iron-rain':this.kind==='paris-gun'?this.id+':bruno-salvo':null}));
  // The volley ends when the gun's last shot leaves the barrel; the trailing
  // markers still count down on their own.
  this.barrage={...plan,index:1,clock:0,total:(plan.points.length-1)*interval+.02};
 }
 fire520(plan){
  const target={x:plan.target.x,y:plan.target.y},tag=this.id+(plan.final?':last-520':':520-round');
  const emit=spec=>this.emit({type:'hazard',bossId:this.id,kind:'circle',tag,...spec});
  emit({...target,warning:.02,delay:0,duration:plan.centerDuration,once:true,radius:plan.radius,damage:this.t.damage*(plan.final?1.1:.74),visual:'rail-shell'});
  emit({...target,warning:plan.waveWarning,delay:plan.waveDelay,duration:plan.waveDuration,once:true,radius:plan.wave,radiusStart:plan.start,radiusLimit:plan.wave,ringWidth:42,ringSpeed:(plan.wave-plan.start)/plan.waveDuration,damage:this.t.damage*(plan.final?.8:.62),visual:'rural-rail-shock'});
  emit({...plan.smoke,warning:plan.smokeWarning,delay:plan.smokeDelay,duration:plan.smokeDuration,once:false,tickInterval:.7,damage:this.t.damage*.22,visual:'rural-rail-smoke'});
  if(plan.final)for(let i=0;i<8;i++){const a=i/8*Math.PI*2+.39,speed=155;
   emit({...target,kind:'projectile',tag:tag+'-shrapnel',vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,radius:6,warning:plan.waveDelay,delay:0,duration:2.4,damage:this.t.damage*.3,visual:'rail-shrapnel'});}
  fireRailArtillery(this);
 }
 onPartDestroyed(p){
  if(p.kind!=='rail-car')return;
  const detachSpeed=Math.min(this.rail129.velocity,this.rail129.c.speed);
  p.detachedPose={x:this.x+p.x,y:this.y+p.y,vx:10,vy:detachSpeed*this.rail129.direction*.45,angle:0,age:0};
  this.pullAway=true;
  if(p.id==='car-rear')this.aaPlan=null;
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
  }
  if(this.kind==='lincomparable'){
   if(this.update520Entry(dt,ctx))return;
   const rear=this.parts.get('car-rear');
   if(this.raidPhase===1&&(this.hp<=this.maxHp*.84||rear.destroyed)){
    this.raidPhase=2;this.emit({type:'phase-change',bossId:this.id,phase:'lincomparable-shock-link'});
   }
  }
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
  this.recovery=(this.kind==='lincomparable'||(this.kind==='paris-gun'&&this.brunoAttackUntil>0&&this.ruralClock>=this.brunoAttackUntil))&&['recoil','reload'].includes(rail.phase)?Math.max(.01,(rail.phase==='recoil'?rail.c.recoilSeconds-rail.time+rail.c.reloadSeconds:rail.c.reloadSeconds-rail.time)):0;
  if(this.kind==='paris-gun')this.updateBrunoRhythm();
  if(this.barrage&&!this.barrage.rhythm){const q=this.barrage,interval=q.interval||this.t.barrageInterval||.32;q.clock+=dt;
   // Muzzle flash keeps the firing beat; the markers themselves were pre-placed.
   while(q.index<q.points.length&&q.clock>=q.index*interval){q.index++;fireRailArtillery(this);}
   if(q.clock>=q.total){this.barrage=null;if(this.kind==='paris-gun'&&this.raidPhase===2&&!q.final&&!this.parts.get('car-rear').destroyed)this.aaClock=.3;}}
  updateRailArtillery(this,dt);
  if(this.finalAim){
   const q=this.finalAim;q.remaining-=dt;
   if(!q.locked){
    const f=Math.min(1,(2.8-q.remaining)/1.4),target={x:q.originTarget.x+(q.forecast.x-q.originTarget.x)*f,y:q.originTarget.y+(q.forecast.y-q.originTarget.y)*f};
    Object.assign(q,lincomparableRound(target,2,this,{blind:q.blind,final:true,stress:this.reloadStress,broken:rail.broken}));aimRailArtillery(this,q.target);
    if(q.remaining<=1.4){q.locked=true;this.emit({type:'phase-change',bossId:this.id,phase:'lincomparable-locked'});}
   }
   if(this.finalAim.remaining<=0){const plan=this.finalAim;this.finalAim=null;this.fire520(plan);this.finalCounter=true;this.emit({type:'phase-change',bossId:this.id,phase:'lincomparable-counter'});}
  }
  this.updateDefense(dt,ctx.players||[]);
  if(!this.runawayTriggered129)this.phase=this.coreVulnerable?'locomotive':rail.phase;
 }
 updateBrunoRhythm(){
  const plan=this.aimPlan,rail=this.rail129;
  if(plan?.rhythm&&rail.phase==='aim'&&!plan.secondCue&&rail.time>=plan.beat){
   plan.secondCue=true;this.brunoBeat=2;this.emit({type:'rail-aim',bossId:this.id,beat:2});
  }
  const q=this.barrage;if(!q?.rhythm)return;
  const elapsed=this.ruralClock-q.startedAt;
  if(elapsed>=q.beat)this.brunoBeat=4;
  while(q.index<q.points.length&&q.points[q.index].at<=elapsed+1e-9){
   const p=q.points[q.index++];
   if(!(q.firedRows&(1<<p.row))){q.firedRows|=1<<p.row;fireRailArtillery(this);}
  }
  if(q.index===q.points.length&&this.ruralClock>=this.brunoAttackUntil)this.barrage=null;
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
  const rear=this.parts.get('car-rear');rear.gunFlash=Math.max(0,(rear.gunFlash||0)-dt);if(rear.destroyed||this.runawayTriggered129)return;
  if(this.kind==='paris-gun'&&this.brunoBeat!==3)return;
  if(this.aaPlan){this.aaPlan.remaining-=dt;if(this.aaPlan.remaining<=0){
   const a=this.aaPlan.angle,x=this.x,y=this.y+rear.y-145,speed=(this.t.bulletSpeed||260)*.85;
   rear.gunFlash=.14;rear.shotAngle=a;
   for(const da of [-.14,0,.14])this.emit({type:'hazard',bossId:this.id,kind:'projectile',x,y,vx:Math.cos(a+da)*speed,vy:Math.sin(a+da)*speed,radius:5,warning:0,delay:0,duration:3.2,damage:this.t.damage*.32,visual:'rail-mg',tag:this.kind==='paris-gun'?this.id+':bruno-salvo':null});
   this.aaPlan=null;this.aaClock=2.8/(this.t.patternMultiplier||1);
  }return;}
  // Bruno's rear gun fires on beat three only; no hidden shots during recovery.
  if(this.kind==='paris-gun')return;
  this.aaClock-=dt;if(this.aaClock>0)return;
  const p=players.filter(p=>p.alive!==false).sort((a,b)=>Math.hypot(a.x-this.x,a.y-this.y-rear.y)-Math.hypot(b.x-this.x,b.y-this.y-rear.y))[0];
  if(!p||Math.hypot(p.x-this.x,p.y-this.y-rear.y)>850)return;
  this.aaPlan={angle:Math.atan2(p.y-(this.y+rear.y-145),p.x-this.x),remaining:.45};
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
 dispose(){this.brunoBeat=0;this.brunoAttackUntil=0;this.entry=null;this.finalAim=null;this.aimPlan=null;this.aaPlan=null;this.barrage=null;super.dispose();}
}
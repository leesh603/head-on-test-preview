import {RailAdapter} from './boss-adapters129.js?v=ui5';
import {BaseBoss} from './headon-stageboss-core.js?v=ui5';
import {RURAL_RAIL,RURAL_CARS} from './rural-rail-layout.js?v=ui5';
import {createRailArtillery,aimRailArtillery,fireRailArtillery,updateRailArtillery} from './rural-rail-artillery.js?v=rail1';
import {brunoSalvo} from './bruno-raid.js?v=1';

// Rural-only mechanics. The Cambrai carrier keeps its separate controller.
export class RuralRailBoss extends RailAdapter {
 constructor(o,kind){
  // Keep the approaching tail at the old spawn position, with the gun ahead.
  super({...o,y:(o.y||0)-(RURAL_RAIL.tailY-465)},kind);
  this.ruralRailBoss=true;this.baseReload=this.rail129.c.reloadSeconds;
  this.aimPlan=null;this.barrage=null;this.gunFlash=0;this.recovery=0;this.aaClock=1.6;this.aaPlan=null;
  this.railGun=createRailArtillery();
  if(kind==='paris-gun'){this.raidPhase=1;this.entry={age:0,initialized:false};this.observerMotion={vx:0,vy:-1};}
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
    // Phase I ranges at the sampled position; Phase II leads movement only
    // while the observer survives. Destroyed observers keep their old sector.
    if(!blind){const lead=this.raidPhase===1?-.65:.35;target.x+=(target.vx||0)*lead;target.y+=(target.vy||0)*lead;}
    this.aimPlan=brunoSalvo(target,this.raidPhase,this.rail129.shot,blind?null:this.frameBounds,{blind});
    this.rail129.target={...target};
   }
   aimRailArtillery(this,target);
   this.emit({...e,type:'rural-aim',target,bossId:this.id});return;
  }
  if(e.type==='fire'){
   const plan=this.aimPlan||{target:e.target,points:[e.target]};this.blindOrigin={...plan.target};this.aimPlan=null;
   this.refreshReload();
   if(this.kind==='lincomparable'){
    const target={x:plan.target.x,y:plan.target.y};
    this.emit({type:'hazard',bossId:this.id,kind:'circle',...target,warning:.02,delay:0,duration:.65,once:true,radius:92,damage:this.t.damage*.74,visual:'rail-shell'});
    // The wave has an actual safe interior; a swept annulus hits each pilot once.
    this.emit({type:'hazard',bossId:this.id,kind:'circle',...target,warning:.55,delay:.28,duration:.4,once:true,radius:245,radiusStart:92,radiusLimit:245,ringWidth:42,ringSpeed:382.5,damage:this.t.damage*.62,visual:'rural-rail-shock'});
    this.emit({type:'hazard',bossId:this.id,kind:'circle',...target,warning:.04,delay:.5,duration:1.8,once:false,tickInterval:.7,radius:132,damage:this.t.damage*.22,visual:'rural-rail-smoke'});
    fireRailArtillery(this);this.recovery=this.rail129.c.recoilSeconds+this.rail129.c.reloadSeconds;
   }else this.barrage={...plan,points:plan.points.map(p=>({...p})),index:0,clock:0};
   return;
  }
  if(e.type==='rail-break'){
   this.refreshReload();
   if(this.kind==='paris-gun'&&this.runawayTriggered129){
    this.barrage=null;this.emit({type:'cancel-hazards',bossId:this.id,tag:this.id+':iron-rain'});
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
    const plan=brunoSalvo({...p,vx:motion.vx||0,vy:motion.vy||0},2,rail.shot,this.frameBounds,{final:true,blind,broken:rail.broken,starved:this.parts.get('car-front').destroyed});
    this.barrage={...plan,index:0,clock:0};this.raidPhase=3;
    this.emit({type:'bruno-iron-rain',bossId:this.id,...this.rail129.pose});
   }
  }
  super.railEvent(e);
 }
 onPartDestroyed(p){
  if(p.kind!=='rail-car')return;
  const detachSpeed=this.kind==='paris-gun'?Math.min(this.rail129.velocity,this.rail129.c.speed):this.rail129.velocity;
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
  if(this.kind==='paris-gun'){
   this.lastRaidPlayers=(ctx.players||[]).filter(p=>p.alive!==false&&Number.isFinite(p.x)&&Number.isFinite(p.y));
   if(!this.parts.get('car-middle').destroyed&&this.lastRaidPlayers.length){const p=this.lastRaidPlayers[this.rail129.shot%this.lastRaidPlayers.length];this.observerMotion={vx:p.vx||0,vy:p.vy||0};}
   if(this.updateBrunoEntry(dt,ctx))return;
   const rear=this.parts.get('car-rear');
   if(this.raidPhase===1&&(this.hp<=this.maxHp*.92||rear.hp<=rear.maxHp*.5)){
    this.raidPhase=2;this.emit({type:'phase-change',bossId:this.id,phase:'bruno-tracking'});
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
  this.recovery=this.kind==='lincomparable'&&['recoil','reload'].includes(rail.phase)?Math.max(.01,(rail.phase==='recoil'?rail.c.recoilSeconds-rail.time+rail.c.reloadSeconds:rail.c.reloadSeconds-rail.time)):0;
  if(this.barrage){const q=this.barrage;q.clock-=dt;while(q.index<q.points.length&&q.clock<=0){const p=q.points[q.index++];fireRailArtillery(this);this.emit({type:'hazard',bossId:this.id,kind:'circle',...p,warning:q.warning??.85,delay:0,duration:q.duration??.35,once:true,radius:q.radius??88,damage:this.t.damage,visual:'rail-shell',tag:q.final?this.id+':iron-rain':this.kind==='paris-gun'?this.id+':bruno-salvo':null});q.clock+=q.interval||this.t.barrageInterval||.32;}
   if(q.index===q.points.length){this.barrage=null;if(this.kind==='paris-gun'&&this.raidPhase===2&&!q.final&&!this.parts.get('car-rear').destroyed)this.aaClock=.3;}}
  updateRailArtillery(this,dt);
  this.updateDefense(dt,ctx.players||[]);
  if(!this.runawayTriggered129)this.phase=this.coreVulnerable?'locomotive':rail.phase;
 }
 updateBrunoEntry(dt,ctx){
  const e=this.entry,r=this.rail129;if(!e)return false;
  // Explicit Test Lab phase staging and an early rail hit still use the real
  // controller. Never relocate a track or an already detached carriage.
  if(r.phase!=='move'||r.broken||this.railCarOrder.some(id=>this.parts.get(id).destroyed)){this.entry=null;return false;}
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
  if(this.aaPlan){this.aaPlan.remaining-=dt;if(this.aaPlan.remaining<=0){
   const a=this.aaPlan.angle,x=this.x,y=this.y+rear.y-145,speed=(this.t.bulletSpeed||260)*.85;
   rear.gunFlash=.14;rear.shotAngle=a;
   for(const da of [-.14,0,.14])this.emit({type:'hazard',bossId:this.id,kind:'projectile',x,y,vx:Math.cos(a+da)*speed,vy:Math.sin(a+da)*speed,radius:5,warning:0,delay:0,duration:3.2,damage:this.t.damage*.32,visual:'rail-mg'});
   this.aaPlan=null;this.aaClock=2.8/(this.t.patternMultiplier||1);
  }return;}
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
  return super.hit({...s,damage});
 }
 locateHit(s){return this.dead?null:super.locateHit(s);}
 dispose(){this.entry=null;this.aimPlan=null;this.aaPlan=null;this.barrage=null;super.dispose();}
}

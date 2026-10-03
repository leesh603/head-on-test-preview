import {RailAdapter} from './boss-adapters129.js?v=510';
import {BaseBoss} from './headon-stageboss-core.js?v=510';
import {RURAL_RAIL,RURAL_CARS,ruralBarrage} from './rural-rail-layout.js?v=510';

// Rural-only mechanics. The Cambrai carrier keeps its separate controller.
export class RuralRailBoss extends RailAdapter {
 constructor(o,kind){
  // Keep the approaching tail at the old spawn position, with the gun ahead.
  super({...o,y:(o.y||0)-(RURAL_RAIL.tailY-465)},kind);
  this.ruralRailBoss=true;this.baseReload=this.rail129.c.reloadSeconds;
  this.aimPlan=null;this.barrage=null;this.gunFlash=0;this.recovery=0;this.aaClock=1.6;this.aaPlan=null;
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
   this.aimPlan={target,blind,mode:this.rail129.shot%2?'cross':'march',points:this.kind==='paris-gun'?ruralBarrage(target,this.rail129.shot,blind?null:this.frameBounds):[{x:target.x,y:target.y}]};
   this.emit({...e,type:'rural-aim',target,bossId:this.id});return;
  }
  if(e.type==='fire'){
   const plan=this.aimPlan||{target:e.target,points:[e.target]};this.blindOrigin={...plan.target};this.aimPlan=null;
   this.gunFlash=.22;this.refreshReload();
   if(this.kind==='lincomparable'){
    const target={x:plan.target.x,y:plan.target.y};
    this.emit({type:'hazard',bossId:this.id,kind:'circle',...target,warning:.02,delay:0,duration:.65,once:true,radius:92,damage:this.t.damage*.74,visual:'rail-shell'});
    // The wave has an actual safe interior; a swept annulus hits each pilot once.
    this.emit({type:'hazard',bossId:this.id,kind:'circle',...target,warning:.55,delay:.28,duration:.4,once:true,radius:245,radiusStart:92,radiusLimit:245,ringWidth:42,ringSpeed:382.5,damage:this.t.damage*.62,visual:'rural-rail-shock'});
    this.emit({type:'hazard',bossId:this.id,kind:'circle',...target,warning:.04,delay:.5,duration:1.8,once:false,tickInterval:.7,radius:132,damage:this.t.damage*.22,visual:'rural-rail-smoke'});
    this.recoilKick129=55;this.recovery=this.rail129.c.recoilSeconds+this.rail129.c.reloadSeconds;
   }else this.barrage={points:plan.points.map(p=>({...p})),index:0,clock:0};
   this.emit({type:'heavy-gun-fired',bossId:this.id,x:this.x,y:this.y+RURAL_RAIL.muzzleY});return;
  }
  if(e.type==='rail-break')this.refreshReload();
  if(e.type==='runaway-start'){
   // Pull the locomotive away from its abandoned tail without reflecting back.
   const rail=this.rail129;rail.from.y-=1600;rail.length+=1600;rail.s+=1600;rail.direction=-1;
   this.aimPlan=null;this.aaPlan=null;this.barrage=null;
  }
  super.railEvent(e);
 }
 onPartDestroyed(p){
  if(p.kind!=='rail-car')return;
  p.detachedPose={x:this.x+p.x,y:this.y+p.y,vx:10,vy:this.rail129.velocity*this.rail129.direction*.45,angle:0,age:0};
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
  this.gunFlash=Math.max(0,this.gunFlash-dt);this.refreshReload();
  const rail=this.rail129,oldS=rail.s,oldPose={x:this.x,y:this.y};
  if(this.pullAway&&rail.phase==='move'){rail.direction=-1;this.pullAway=false;}
  if(this.recoilKick129>0&&rail.phase==='recoil'&&!rail.broken){const kick=Math.min(this.recoilKick129,dt*180);rail.s=Math.max(0,rail.s-rail.direction*kick);this.recoilKick129-=kick;}
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
  if(this.barrage){const q=this.barrage;q.clock-=dt;while(q.index<q.points.length&&q.clock<=0){const p=q.points[q.index++];this.emit({type:'hazard',bossId:this.id,kind:'circle',...p,warning:.85,delay:0,duration:.35,once:true,radius:88,damage:this.t.damage,visual:'rail-shell'});q.clock+=.32;}if(q.index===q.points.length)this.barrage=null;}
  this.updateDefense(dt,ctx.players||[]);
  if(!this.runawayTriggered129)this.phase=this.coreVulnerable?'locomotive':rail.phase;
 }
 updateDefense(dt,players){
  const rear=this.parts.get('car-rear');rear.gunFlash=Math.max(0,(rear.gunFlash||0)-dt);if(rear.destroyed||this.runawayTriggered129)return;
  if(this.aaPlan){this.aaPlan.remaining-=dt;if(this.aaPlan.remaining<=0){
   const a=this.aaPlan.angle,x=this.x,y=this.y+rear.y-145,speed=(this.t.bulletSpeed||260)*.85;
   rear.gunFlash=.14;rear.shotAngle=a;
   for(const da of [-.14,0,.14])this.emit({type:'hazard',bossId:this.id,kind:'projectile',x,y,vx:Math.cos(a+da)*speed,vy:Math.sin(a+da)*speed,radius:5,warning:0,delay:0,duration:3.2,damage:this.t.damage*.32,visual:'rail-mg'});
   this.aaPlan=null;this.aaClock=2.8;
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
 dispose(){this.aimPlan=null;this.aaPlan=null;this.barrage=null;super.dispose();}
}

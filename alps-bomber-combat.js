import {BaseBoss,BossPart} from './headon-stageboss-core.js?v=lc2';
import {ALPS_BOMBER_LAYOUT,alpsAngleDelta,alpsPoint,alpsMuzzle,alpsHullExtents,locateAlpsHit} from './alps-bomber-layout.js?v=lc2';

class AlpsBomber extends BaseBoss {
 constructor({tuning,rng=Math.random,faction,kind,...base}){
  for(const key of ['maxHp','partHp','damage','bulletSpeed'])if(!Number.isFinite(tuning?.[key])||tuning[key]<=0)throw new Error('Current bomber tuning required: '+key);
  const layout=ALPS_BOMBER_LAYOUT[kind],s=tuning.geometryScale||1;
  super({...base,maxHp:tuning.maxHp,parts:layout.parts.map(p=>new BossPart({...p,x:p.x*s,y:p.y*s,radius:p.radius*s,maxHp:tuning.parts?.[p.id]?.maxHp||tuning.maxHp*p.hp}))});
  Object.assign(this,{kind,faction,t:tuning,rng,layout,phase:1,ownsMotion129:true,hidden:false,routeClock:0,hullYaw:0,bank:0,driveVelocity:0,imbalance:0,flightTime:0,cursor:0,patternIndex:0});
  this.fixedX=this.x;this.fixedY=this.y;this.a=-Math.PI/2;
  for(const p of this.parts.values()){p.localX=p.x;p.localY=p.y;p.hitFlash=0;p.recoil=0;}
 }
 command(type,spec={}){this.emit({...spec,type,bossId:this.id,faction:this.faction});}
 hazard(kind,spec){this.command('hazard',{kind,damage:this.t.damage,warning:kind==='projectile'?0:1.2,duration:kind==='projectile'?3.5:.3,...spec});}
 suppressive(){} // Every round must belong to a surviving physical weapon.
 part(id){return this.parts.get(id);}
 target(players,predicate=()=>true){const list=players.filter(p=>p.alive&&predicate(p));return list.length?list[this.cursor++%list.length]:null;}
 engineLoss(){return this.layout.engines.filter(id=>this.part(id).destroyed).length;}
 setPhase(phase){if(this.dead||phase<=this.phase)return;this.phase=phase;this.command('phase-change',{phase:'alps-phase-'+phase});}
 syncParts(){for(const p of this.parts.values()){const q=alpsPoint(this,p.localX,p.localY);p.x=q.x-this.x;p.y=q.y-this.y;p.angle=this.hullYaw;}}
 cruise(dt,frame){
  if(this.alpsRaid)return this.raidFlight(dt,frame);
  const loss=this.engineLoss(),speedScale=Math.max(.34,1-loss/(this.layout.engines.length+1)),pace=(this.kind==='gik'?.17:.125)*speedScale;
  this.routeClock+=dt*pace;this.flightTime+=dt;
  const sign=(this.part('leftEngine').destroyed?1:0)-(this.part('rightEngine').destroyed?1:0);
  this.imbalance+=(sign*22-this.imbalance)*Math.min(1,dt*1.1);
  const span=this.kind==='gik'?250:290,oldX=this.x,oldY=this.y;
  this.x=this.fixedX+Math.sin(this.routeClock)*span+this.imbalance;
  this.y=this.fixedY+Math.sin(this.routeClock*2)*(this.kind==='gik'?68:90);
  this.driveVelocity=Math.hypot(this.x-oldX,this.y-oldY)/Math.max(.001,dt);
  const yaw=this.cannonLock?this.cannonLock.angle+Math.PI/2:Math.cos(this.routeClock)*.2+sign*.055,delta=alpsAngleDelta(yaw,this.hullYaw);
  this.hullYaw+=this.cannonLock?Math.max(-dt*.7,Math.min(dt*.7,delta)):delta*Math.min(1,dt*1.4);this.bank=Math.sin(this.routeClock)*.12+sign*.05;this.a=this.hullYaw-Math.PI/2;
  this.syncParts();for(const p of this.parts.values()){p.hitFlash=Math.max(0,p.hitFlash-dt);p.recoil=Math.max(0,p.recoil-dt);}
 }
 // Only the two Alpine aircraft use this physical flight path. No camera or player writes.
 fitAirframe(bounds){
  if(this.airframeFitted)return;this.airframeFitted=true;
  const scale=Math.min(this.t.geometryScale||1,(bounds.right-bounds.left)*.68/this.layout.width),ratio=scale/(this.t.geometryScale||1);
  this.t.geometryScale=scale;for(const p of this.parts.values()){p.localX*=ratio;p.localY*=ratio;p.radius*=ratio;}this.syncParts();
 }
 inView(bounds){const e=alpsHullExtents(this);return this.x-e.halfWidth>bounds.left+8&&this.x+e.halfWidth<bounds.right-8&&this.y-e.halfHeight>bounds.top+32&&this.y+e.halfHeight<bounds.bottom-45;}
 raidFlight(dt,{bounds,players}){
  this.fitAirframe(bounds);const loss=this.engineLoss(),sign=Number(this.part('leftEngine').destroyed)-Number(this.part('rightEngine').destroyed);
  const speedScale=Math.max(.34,1-loss/(this.layout.engines.length+1));this.flightTime+=dt;this.routeClock+=dt*(this.kind==='gik'?.24:.14)*speedScale;
  this.imbalance+=(sign*22-this.imbalance)*Math.min(1,dt*1.1);
  const extent=alpsHullExtents(this),w=bounds.right-bounds.left,h=bounds.bottom-bounds.top,cx=(bounds.left+bounds.right)/2;
  const span=Math.max(0,w/2-extent.halfWidth-20),side=this.phase===1?.35:this.phase===2?.9:.65;
  const desiredX=cx+Math.sin(this.routeClock)*span*side+this.imbalance*.35;
  const desiredY=bounds.top+Math.max(extent.halfHeight+40,h*.31)+Math.sin(this.routeClock*2)*Math.min(24,h*.035);
  const oldX=this.x,oldY=this.y,dx=desiredX-this.x,dy=desiredY-this.y,d=Math.hypot(dx,dy),speed=(this.entry?230:225)*speedScale*(this.recovery>0?.5:1),returnSpeed=this.inView(bounds)?speed:Math.max(speed,...players.filter(p=>p.alive).map(p=>Math.hypot(p.vx||0,p.vy||0)+80)),step=Math.min(d,returnSpeed*dt);
  if(d){this.x+=dx/d*step;this.y+=dy/d*step;}this.driveVelocity=step/Math.max(.001,dt);
  let yaw=this.cannonLock?this.cannonLock.angle+Math.PI/2:this.hullYaw;
  if(!this.cannonLock){const p=players.find(p=>p.alive);if(p&&this.kind==='gik')yaw=Math.atan2(p.y-this.y,p.x-this.x)+Math.PI/2;else yaw=Math.cos(this.routeClock)*.22+sign*.12;}
  const turn=Math.max(.42,1.8-loss*.4),delta=alpsAngleDelta(yaw+(!this.cannonLock?sign*.08:0),this.hullYaw);
  this.hullYaw+=Math.max(-dt*turn,Math.min(dt*turn,delta));this.bank=Math.sin(this.routeClock)*.12+sign*.05;this.a=this.hullYaw-Math.PI/2;
  this.syncParts();for(const p of this.parts.values()){p.hitFlash=Math.max(0,p.hitFlash-dt);p.recoil=Math.max(0,p.recoil-dt);}
 }
 discover(){if(this.discovered)return;this.discovered=true;this.command('alps-discovered',{kind:this.kind,x:this.x,y:this.y});}
 recover(seconds=2.8){this.recovery=seconds;this.command('phase-change',{phase:this.kind+'-recovery'});}
 locateHit(shot){return locateAlpsHit(this,shot);}
 hitAt(shot){const h=this.locateHit(shot);return h?this.hit({...h,damage:shot.damage}):{damage:0,miss:true};}
 hit(attack){
  if(this.dead)return{damage:0,blocked:true};
  const p=attack.partId&&this.part(attack.partId);
  const result=super.hit(attack.partId?attack:{...attack,damage:attack.damage*(.85+.15*this.engineLoss()/this.layout.engines.length)});
  if(p&&result.damage){p.hitFlash=.14;if(!this.dead){const hull=super.hit({damage:result.damage*.8});result.hullDamage=hull.damage;result.bodyDefeated=hull.bodyDefeated;}}
  return result;
 }
 mountFire(id,players,dt,interval,rear=false){
  const gun=this.part(id);if(!gun||gun.destroyed||!this.due(id+'-fire',dt,interval))return;
  const forward=this.hullYaw+(rear?Math.PI/2:-Math.PI/2),q=alpsMuzzle(this,id),target=this.target(players,p=>Math.abs(alpsAngleDelta(Math.atan2(p.y-q.y,p.x-q.x),forward))<1.15&&Math.hypot(p.x-q.x,p.y-q.y)<720);
  if(!target)return;const angle=Math.atan2(target.y-q.y,target.x-q.x),count=Math.min(7,Math.max(1,Math.ceil((this.phase===3?3:2)*(this.t.projectileDensity??1))));gun.recoil=.12;this.command('muzzle',{...q,partId:id});
  for(let i=0;i<count;i++){const a=angle+(i-(count-1)/2)*.12;this.hazard('projectile',{...q,vx:Math.cos(a)*this.t.bulletSpeed*.8,vy:Math.sin(a)*this.t.bulletSpeed*.8,radius:4,damage:this.t.damage*.55,visual:'alps-mg',tag:this.id+':'+id});}
 }
 stickBombs(bounds,{count=5,radius=36,warning=1.25,damage=.8}={}){
  const s=this.t.geometryScale||1,source=alpsPoint(this,0,25*s),a=this.hullYaw-Math.PI/2,dx=Math.cos(a),dy=Math.sin(a);
  for(let i=0;i<count;i++)this.hazard('circle',{x:source.x+dx*(i-2)*64,y:source.y+dy*(i-2)*64,radius,delay:i*.18,warning,duration:.3,once:true,damage:this.t.damage*damage,visual:'carpet-bomb',airborneBomb:true,sourceX:source.x,sourceY:source.y,tag:this.id+':payload'});
 }
 onPartDestroyed(p){if(p.kind==='gun')this.command('cancel-hazards',{tag:this.id+':'+p.id});if(p.id==='cannon'){this.cannonLock=null;this.cannonRemaining=0;}if(p.kind==='engine')this.command('phase-change',{phase:'engine-damaged'});}
 updatePhase(){const loss=this.engineLoss();if(this.hp<=this.maxHp*.68||loss)this.setPhase(2);if(this.hp<=this.maxHp*.32||loss===this.layout.engines.length)this.setPhase(3);}
}

export class GIK extends AlpsBomber {
 constructor(o){super({...o,kind:'gik'});Object.assign(this,{alpsRaid:true,discovered:false,entry:{age:0,shot:false},cannonLock:null,cannonRemaining:0,cannonFlash:0,recovery:0,ironCage:null,finalUsed:false});}
 lockCannon(target,{lead=0,warning=1.25,final=false,entry=false}={}){
  if(this.part('cannon').destroyed||!target)return false;
  const forward=this.hullYaw-Math.PI/2,desired=Math.atan2(target.y+(target.vy||0)*lead-this.y,target.x+(target.vx||0)*lead-this.x);
  // The airframe physically acquires the lane before the frozen warning countdown.
  this.cannonLock={angle:forward+alpsAngleDelta(desired,forward),seconds:warning,final,entry};this.cannonRemaining=warning;
  this.command('alps-cannon-lock',{x:this.x,y:this.y});return true;
 }
 cannon(dt,players){
  const gun=this.part('cannon');this.cannonFlash=Math.max(0,this.cannonFlash-dt);if(gun.destroyed)return false;
  if(this.cannonLock){
   if(Math.abs(alpsAngleDelta(this.cannonLock.angle+Math.PI/2,this.hullYaw))>.035)return false;
   this.cannonRemaining=Math.max(0,this.cannonRemaining-dt);if(this.cannonRemaining>0)return false;
   const lock=this.cannonLock,angle=lock.angle,q=alpsMuzzle(this,'cannon',angle);
   this.hazard('projectile',{...q,vx:Math.cos(angle)*this.t.bulletSpeed*1.35,vy:Math.sin(angle)*this.t.bulletSpeed*1.35,radius:9,damage:this.t.damage*(lock.final?1.8:1.6),visual:'alps-cannon',duration:3,tag:this.id+':cannon'});
   this.cannonShotAngle=angle;this.command('heavy-gun-fired',{...q,partId:'cannon'});gun.recoil=.22;this.cannonFlash=.16;this.cannonLock=null;
   if(lock.entry&&this.entry)this.entry.shot=true;
   if(this.phase>=2&&!lock.entry&&!lock.final)this.defenseDelay=.5;return true;
  }
  if(this.ironCage||this.entry||this.recovery>0||!this.due('alps-cannon',dt,this.t.cannonInterval||(this.phase===1?3.5:2.7)))return false;
  const q=alpsMuzzle(this,'cannon'),forward=this.hullYaw-Math.PI/2,p=this.target(players,p=>Math.abs(alpsAngleDelta(Math.atan2(p.y-q.y,p.x-q.x),forward))<.85);
  return this.lockCannon(p,{lead:this.phase===3?.45:this.phase===2?.25:0});
 }
 startIronCage(players){
  if(this.finalUsed)return;this.finalUsed=true;this.cannonLock=null;this.cannonRemaining=0;
  this.ironCage={age:0,index:0,wait:1.1,shots:this.part('cannon').destroyed?0:3+Number(this.engineLoss()===0)};
  this.command('alps-final-warning');this.command('phase-change',{phase:'gik-iron-cage'});
 }
 updateIronCage(dt,players,bounds){
  const plan=this.ironCage;plan.age+=dt;plan.wait=Math.max(0,plan.wait-dt);
  if(this.part('cannon').destroyed){this.cannonLock=null;plan.shots=0;}
  if(plan.shots===0){ // Surviving rear mount only; no replacement cannon or anonymous bullets.
   if(plan.age<2.2)this.mountFire('rearGun',players,dt,1.8,true);
   else {this.ironCage=null;this.recover(3.2);}return;
  }
  if(this.cannonLock){if(this.cannon(dt,players)){plan.index++;plan.wait=.7;}}
  else if(plan.index>=plan.shots){if(!plan.wait){this.ironCage=null;this.recover(3.2);}}
  else if(!plan.wait){const p=this.target(players);if(p)this.lockCannon(p,{lead:plan.index===plan.shots-1?.65:plan.index%2?.2:0,warning:plan.index===plan.shots-1?1.5:1.1,final:true});}
 }
 onPartDestroyed(p){super.onPartDestroyed(p);if(p.id==='cannon'&&this.ironCage)this.ironCage.shots=0;}
 update(dt,frame){
  if(this.dead||frame.paused)return;const {players,bounds}=frame;this.cruise(dt,frame);this.updatePhase();
  if(this.entry){
   if(!this.inView(bounds))return;this.entry.age+=dt;
   if(this.entry.age>=.4)this.discover();
   if(this.entry.age>=.6&&!this.entry.aimed){const p=this.target(players);if(p){const a=Number.isFinite(p.a)?p.a:-Math.PI/2;this.lockCannon({...p,x:p.x+Math.cos(a)*85,y:p.y+Math.sin(a)*85},{warning:1.5,entry:true});this.entry.aimed=true;}else return;}
   this.cannon(dt,players);
   if(this.part('cannon').destroyed)this.entry.shot=true;
   if(this.entry.shot&&this.entry.age>=3.4){this.entry=null;this.recover(1.5);}return;
  }
  if(this.recovery>0){this.recovery=Math.max(0,this.recovery-dt);return;}
  // Final attacks wait for a visible airframe and never start over an unfinished warning.
  if(this.hp<=this.maxHp*.22&&!this.finalUsed&&!this.cannonLock&&this.inView(bounds))this.startIronCage(players);
  if(this.ironCage){this.updateIronCage(dt,players,bounds);return;}
  if(!this.inView(bounds)&&!this.cannonLock)return;
  this.cannon(dt,players);
  if(this.phase===1)return;
  if(this.defenseDelay>0){this.defenseDelay=Math.max(0,this.defenseDelay-dt);if(!this.defenseDelay)this.timers.set('rearGun-fire',0);}
  this.mountFire('rearGun',players,dt,this.phase===3?1.5:2.2,true);
  if(!this.cannonLock&&this.due('gik-bomb-run',dt,this.phase===3?5.8:7.2)){this.stickBombs(bounds,{count:5});this.command('phase-change',{phase:'gik-strafe-run'});}
 }
}

export class Ca4 extends AlpsBomber {
 constructor(o){super({...o,kind:'ca4'});this.bayExpose=0;this.bayRuptured=false;this.bombLane=-1;this.bombRunRemaining=0;this.runSerial=0;this.laneWarnings=[];}
 startBombRun(bounds){
  if(this.part('bombBay').destroyed||this.bombRunRemaining>0)return;
  this.bombLane=(this.bombLane+1)%3;const width=bounds.right-bounds.left,height=bounds.bottom-bounds.top;
  // Bounds are captured once: a moving camera never relocates a warned strike.
  const gap=width/3,margin=Math.max(32,gap*.15),radius=Math.min(44,Math.max(16,(gap-2*margin)*.22));
  this.runBounds={...bounds};this.runRadius=radius;this.laneWarnings=[];
  for(let i=0;i<3;i++)this.laneWarnings.push({x:bounds.left+gap*(i+.5),y:bounds.top+height*.55,width:gap-2*margin,height:height*.55,safe:i===this.bombLane});
  this.bombRunRemaining=1.25;this.runSerial++;this.bayExpose=3.3;this.part('bombBay').hittable=true;this.command('phase-change',{phase:'bomb-bay-exposed'});
 }
 releaseBombRun(){
  if(this.part('bombBay').destroyed)return;
  const b=this.runBounds,source=alpsPoint(this,0,this.part('bombBay').localY),height=b.bottom-b.top;
  for(const lane of this.laneWarnings.filter(l=>!l.safe))for(let row=0;row<4;row++)this.hazard('circle',{x:lane.x,y:b.top+height*(.32+row*.135),radius:this.runRadius,delay:row*.18,warning:1.1,duration:.3,once:true,damage:this.t.damage*.85,visual:'carpet-bomb',airborneBomb:true,sourceX:source.x,sourceY:source.y,tag:this.id+':payload'});
  this.command('bomb-release',{...source});
 }
 onPartDestroyed(p){super.onPartDestroyed(p);if(p.id==='bombBay'&&!this.bayRuptured){this.bayRuptured=true;this.bombRunRemaining=0;this.laneWarnings=[];this.bayExpose=0;this.command('cancel-hazards',{tag:this.id+':payload'});
   this.command('internal-explosion',{x:this.x,y:this.y});BaseBoss.prototype.hit.call(this,{damage:Math.min(this.hp,this.maxHp*.16)});this.setPhase(3);
  }}
 update(dt,{players,bounds}){
  this.cruise(dt);this.updatePhase();const bay=this.part('bombBay');
  if(this.bayExpose>0)this.bayExpose=Math.max(0,this.bayExpose-dt);
  if(this.bombRunRemaining>0){this.bombRunRemaining=Math.max(0,this.bombRunRemaining-dt);if(!this.bombRunRemaining)this.releaseBombRun();}
  else if(!bay.destroyed&&this.due('ca4-bombs',dt,(this.t.bombInterval||(this.phase===3?4.6:6.3))*(1+this.engineLoss()*.18)))this.startBombRun(bounds);
  bay.hittable=!bay.destroyed&&(this.bayExpose>0||this.phase===3);
  this.mountFire('frontGun',players,dt,2.15);this.mountFire('rearGun',players,dt,2.15,true);
 }
}

import {impactPulse} from './boss-raid-strikes.js';
import {fireFanSalvo} from './boss-salvo-geometry.js';
import {BaseBoss,BossPart} from './headon-stageboss-core.js?v=tame3';
import {ALPS_BOMBER_LAYOUT,alpsAngleDelta,alpsPoint,alpsMuzzle,locateAlpsHit} from './alps-bomber-layout.js?v=tame3';

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
 cruise(dt){
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
  const gun=this.part(id);if(!gun||gun.destroyed||!this.due(id+'-fire',dt,Math.max(4.6,interval)))return;
  const forward=this.hullYaw+(rear?Math.PI/2:-Math.PI/2),q=alpsMuzzle(this,id),target=this.target(players,p=>Math.abs(alpsAngleDelta(Math.atan2(p.y-q.y,p.x-q.x),forward))<1.15&&Math.hypot(p.x-q.x,p.y-q.y)<720);
  if(!target)return;const angle=Math.atan2(target.y-q.y,target.x-q.x),count=Math.min(7,Math.max(1,Math.ceil((this.phase===3?3:2)*(this.t.projectileDensity??1))));gun.recoil=.12;this.command('muzzle',{...q,partId:id});
  fireFanSalvo(this,{...q,angle,speed:this.t.bulletSpeed*.8,damage:this.t.damage*.55,visual:'alps-mg',tag:this.id+':'+id,sourcePartId:id,count:11,spread:1.4,beats:2,beat:.42,warning:.75,gapIndex:rear?2:7,step:rear?1:-1});
 }
 stickBombs(bounds,{count=5,radius=36,warning=1.25,damage=.8}={}){
  const s=this.t.geometryScale||1,source=alpsPoint(this,0,25*s),a=this.hullYaw-Math.PI/2,dx=Math.cos(a),dy=Math.sin(a);
  for(let i=0;i<count;i++)this.hazard('circle',{x:source.x+dx*(i-2)*64,y:source.y+dy*(i-2)*64,radius,delay:i*.18,warning,duration:.3,once:true,damage:this.t.damage*damage,visual:'carpet-bomb',airborneBomb:true,sourceX:source.x,sourceY:source.y,tag:this.id+':payload'});
 }
 onPartDestroyed(p){if(p.kind==='gun')this.command('cancel-hazards',{tag:this.id+':'+p.id});if(p.id==='cannon'){this.cannonLock=null;this.cannonRemaining=0;}if(p.kind==='engine')this.command('phase-change',{phase:'engine-damaged'});}
 updatePhase(){const loss=this.engineLoss();if(this.hp<=this.maxHp*.68||loss)this.setPhase(2);if(this.hp<=this.maxHp*.32||loss===this.layout.engines.length)this.setPhase(3);}
}

export class GIK extends AlpsBomber {
 constructor(o){super({...o,kind:'gik'});this.cannonLock=null;this.cannonRemaining=0;this.cannonFlash=0;}
 cannon(dt,players){
  const gun=this.part('cannon');this.cannonFlash=Math.max(0,this.cannonFlash-dt);if(gun.destroyed)return;
  if(this.cannonLock){this.cannonRemaining=Math.max(0,this.cannonRemaining-dt);if(this.cannonRemaining>0)return;
   const angle=this.cannonLock.angle,q=alpsMuzzle(this,'cannon',angle);for(let i=0;i<3;i++)this.hazard('projectile',{...q,sourcePartId:'cannon',sourceOffsetX:q.x-this.x-gun.x,sourceOffsetY:q.y-this.y-gun.y,vx:Math.cos(angle)*400,vy:Math.sin(angle)*400,radius:i===2?18:9,delay:i*.48,damage:this.t.damage*(i===2?2.4:1.2),raidHeavy:i===2,visual:'alps-cannon',duration:2.6,tag:this.id+':cannon'});this.timers.set('alps-cannon',6.5);
   this.cannonShotAngle=angle;this.command('heavy-gun-fired',{...q,partId:'cannon'});gun.recoil=.22;this.cannonFlash=.16;this.cannonLock=null;return;
  }
  if(!this.due('alps-cannon',dt,this.t.cannonInterval||(this.phase===1?3.5:2.7)))return;
  const forward=this.hullYaw-Math.PI/2,q=alpsMuzzle(this,'cannon'),p=this.target(players,p=>Math.abs(alpsAngleDelta(Math.atan2(p.y-q.y,p.x-q.x),forward))<.8);if(!p)return;
  const desired=Math.atan2(p.y-q.y+(p.vy||0)*.3,p.x-q.x+(p.vx||0)*.3),angle=forward+Math.max(-.6,Math.min(.6,alpsAngleDelta(desired,forward)));
  this.cannonLock={angle,seconds:1.25};this.cannonRemaining=1.25;
 }
 update(dt,{players,bounds}){
  this.cruise(dt);this.updatePhase();this.cannon(dt,players);
  this.mountFire('rearGun',players,dt,this.phase===3?1.3:1.8,true);
  if(!this.cannonLock&&this.due('gik-bomb-run',dt,this.phase===3?5.1:7.2)){this.stickBombs(bounds,{count:this.phase===3?6:5});this.command('phase-change',{phase:'gik-strafe-run'});}
 }
}

export class Ca4 extends AlpsBomber {
 constructor(o){super({...o,kind:'ca4'});this.bayExpose=0;this.bayRuptured=false;this.bombLane=-1;this.bombRunRemaining=0;this.runSerial=0;this.laneWarnings=[];}
 startBombRun(bounds){
  if(this.part('bombBay').destroyed||this.bombRunRemaining>0)return;
  this.bombLane=(this.bombLane+1)%3;const width=bounds.right-bounds.left,height=bounds.bottom-bounds.top;
  // Bounds are captured once: a moving camera never relocates a warned strike.
  const gap=width/3,margin=Math.max(32,gap*.15),radius=Math.max(24,gap*.46);
  this.runBounds={...bounds};this.runRadius=radius;this.laneWarnings=[];
  for(let i=0;i<3;i++)this.laneWarnings.push({x:bounds.left+gap*(i+.5),y:bounds.top+height*.55,width:gap-2*margin,height:height*.55,safe:i===this.bombLane});
  this.bombRunRemaining=1.25;this.runSerial++;this.bayExpose=3.3;this.part('bombBay').hittable=true;this.command('phase-change',{phase:'bomb-bay-exposed'});
 }
 releaseBombRun(){
  if(this.part('bombBay').destroyed)return;
  const b=this.runBounds,source=alpsPoint(this,0,this.part('bombBay').localY),height=b.bottom-b.top;
  for(const lane of this.laneWarnings.filter(l=>!l.safe))for(let row=0;row<6;row++)this.hazard('circle',{x:lane.x,y:b.top+height*(.24+row*.10),radius:this.runRadius,delay:0,warning:1.1+row*.38,duration:.3,once:true,damage:this.t.damage*.85,visual:'carpet-bomb',airborneBomb:true,sourceX:source.x,sourceY:source.y,tag:this.id+':payload'});
  const lane=this.laneWarnings.find(l=>l.safe);if(lane)impactPulse(this,{x:lane.x,y:b.top+height*.6,radius:Math.min(115,(b.right-b.left)/3*.48),warning:3.65,source,partId:'bombBay',visual:'carpet-bomb',tag:this.id+':payload'});this.timers.set('ca4-bombs',8);
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

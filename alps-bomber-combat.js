import {impactPulse} from './boss-raid-strikes.js?v=b3bf991d11fc7798';
import {fireFanSalvo} from './boss-salvo-geometry.js?v=b3bf991d11fc7798';
import {BaseBoss,BossPart,predictPilot} from './headon-stageboss-core.js?v=b3bf991d11fc7798';
import {ALPS_BOMBER_LAYOUT,alpsAngleDelta,alpsPoint,alpsMuzzle,locateAlpsHit} from './alps-bomber-layout.js?v=b3bf991d11fc7798';

class AlpsBomber extends BaseBoss {
 constructor({tuning,rng=Math.random,faction,kind,...base}){
  for(const key of ['maxHp','partHp','damage','bulletSpeed'])if(!Number.isFinite(tuning?.[key])||tuning[key]<=0)throw new Error('Current bomber tuning required: '+key);
  const layout=ALPS_BOMBER_LAYOUT[kind],s=tuning.geometryScale||1;
  super({...base,maxHp:tuning.maxHp,parts:layout.parts.map(p=>new BossPart({...p,x:p.x*s,y:p.y*s,radius:p.radius*s,maxHp:tuning.parts?.[p.id]?.maxHp||tuning.maxHp*p.hp}))});
  Object.assign(this,{kind,faction,t:tuning,rng,layout,phase:1,ownsMotion129:true,hidden:false,routeClock:0,hullYaw:0,bank:0,driveVelocity:0,imbalance:0,flightTime:0,cursor:0,patternIndex:0});
  this.fixedX=this.x;this.fixedY=this.y;this.a=-Math.PI/2;this.alignIntent=null;this.avoidTarget=null;this.disarmedRemaining=null;
  // These aircraft own their gun and payload rhythm; the shared barrage must
  // not invent attacks from mounts the airframe has not brought to bear.
  this.ownsBasicBarrage=true;
  for(const p of this.parts.values()){p.localX=p.x;p.localY=p.y;p.hitFlash=0;p.recoil=0;}
 }
 command(type,spec={}){this.emit({...spec,type,bossId:this.id,faction:this.faction});}
 hazard(kind,spec){this.command('hazard',{kind,damage:this.t.damage,warning:kind==='projectile'?0:1.2,duration:kind==='projectile'?3.5:.3,...spec});}
 suppressive(){} // Every round must belong to a surviving physical weapon.
 part(id){return this.parts.get(id);}
 target(players,predicate=()=>true){const list=players.filter(p=>p.alive&&predicate(p));return list.length?list[this.cursor++%list.length]:null;}
 weaponCount(){let n=0;for(const p of this.parts.values())if(!p.destroyed&&(p.kind==='gun'||p.kind==='payload'))n++;return n;}
 alignFor(id,target,rear=false){if(!target)return;this.alignIntent={id,target,rear,until:this.flightTime+2.5};if(Math.hypot(target.x-this.x,target.y-this.y)<150)this.avoidTarget=target;}
 enterDisarmedFinish(){if(this.disarmedRemaining!=null)return;this.disarmedRemaining=5;this.phase='exposed';this.coreVulnerable=true;this.hp=Math.min(this.hp,this.maxHp*.12);this.alignIntent=null;this.avoidTarget=null;this.cannonLock=null;this.cannonRemaining=0;this.bombRunRemaining=0;this.laneWarnings=[];this.command('cancel-hazards',{tag:this.id+':basic-fire'});this.command('cancel-hazards',{tag:this.id+':payload'});this.command('phase-change',{phase:'exposed',seconds:5});}
 updateDisarmed(dt){if(this.weaponCount())return false;this.enterDisarmedFinish();this.disarmedRemaining=Math.max(0,this.disarmedRemaining-dt);if(!this.disarmedRemaining&&!this.dead)BaseBoss.prototype.hit.call(this,{damage:this.hp});return true;}
 engineLoss(){return this.layout.engines.filter(id=>this.part(id).destroyed).length;}
 setPhase(phase){if(this.dead||phase<=this.phase)return;this.phase=phase;this.command('phase-change',{phase:'alps-phase-'+phase});}
 syncParts(){for(const p of this.parts.values()){const q=alpsPoint(this,p.localX,p.localY);p.x=q.x-this.x;p.y=q.y-this.y;p.angle=this.hullYaw;}}
 cruise(dt,bounds,players=[]){
  if(!(dt>0))return;
  const loss=this.engineLoss(),speedScale=Math.max(.34,1-loss/(this.layout.engines.length+1)),pace=(this.kind==='gik'?.17:.125)*speedScale;
  this.routeClock+=dt*pace;this.flightTime+=dt;
  const sign=(this.part('leftEngine').destroyed?1:0)-(this.part('rightEngine').destroyed?1:0);
  this.imbalance+=(sign*22-this.imbalance)*(1-Math.exp(-dt*1.1));
  const span=this.kind==='gik'?250:290,height=this.kind==='gik'?68:90;
  // The authored route is a destination, never a second writer of hull position.
  // Every visible displacement follows the same heading used by the mounts/art.
  const routeX=this.fixedX+Math.sin(this.routeClock)*span+this.imbalance,routeY=this.fixedY+Math.sin(this.routeClock*2)*height;
  let tx=routeX,ty=routeY,desiredSpeed=(this.kind==='gik'?48:43)*speedScale,turn=1.2;
  if(this.alignIntent){const live=players.find(p=>p.alive&&p.id===this.alignIntent.target?.id);if(live)this.alignIntent.target=live;
   if(!this.alignIntent.target?.alive||this.flightTime>this.alignIntent.until)this.alignIntent=null;}
  const align=this.alignIntent;
  let yaw;
  if(this.egress){
   const e=this.egress;if(e.phase==='away'||e.phase==='hold'){tx=e.x+Math.cos(e.angle)*950;ty=e.y+Math.sin(e.angle)*950;}
   desiredSpeed=85*speedScale;
   yaw=Math.atan2(ty-this.y,tx-this.x)+Math.PI/2;
   if(e.phase==='return')desiredSpeed=Math.min(desiredSpeed,Math.max(24*speedScale,Math.hypot(tx-this.x,ty-this.y)*.5));
  }else if(this.cannonLock)yaw=this.cannonLock.angle+Math.PI/2;
  else if(align){yaw=Math.atan2(align.target.y-this.y,align.target.x-this.x)+(align.rear?-Math.PI/2:Math.PI/2);turn=.85;}
  else{
   // Feed the route tangent into pursuit so a slow destination cannot trap the
   // bomber at a waypoint; correction regains its original patrol after firing.
   const vx=Math.cos(this.routeClock)*span*pace+(tx-this.x)*.65,vy=Math.cos(this.routeClock*2)*height*2*pace+(ty-this.y)*.65;
   yaw=Math.atan2(vy,vx)+Math.PI/2;
  }
  const delta=alpsAngleDelta(yaw,this.hullYaw),yawStep=Math.max(-dt*turn,Math.min(dt*turn,delta));
  this.hullYaw+=yawStep;this.a=this.hullYaw-Math.PI/2;
  this.flightSpeed??=desiredSpeed;this.flightSpeed+=Math.max(-40*dt,Math.min(40*dt,desiredSpeed-this.flightSpeed));
  this.x+=Math.cos(this.a)*this.flightSpeed*dt;this.y+=Math.sin(this.a)*this.flightSpeed*dt;this.driveVelocity=this.flightSpeed;
  const targetBank=Math.max(-.42,Math.min(.42,yawStep/dt*.32))+sign*.05;
  this.bank+=(targetBank-this.bank)*(1-Math.exp(-dt*3));
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
  const gun=this.part(id);if(!gun||gun.destroyed||!this.due(id+'-fire',dt,Math.max(2.4,interval)))return;
  const q=alpsMuzzle(this,id),base=this.hullYaw+(rear?Math.PI/2:-Math.PI/2),arc=rear?1.18:1.05,spread=this.phase===3?1.05:.82;
  let target=null,best=Infinity;for(const p of players||[])if(p?.alive){const d=Math.hypot(p.x-q.x,p.y-q.y),off=Math.abs(alpsAngleDelta(Math.atan2(p.y-q.y,p.x-q.x),base));if(d>=95&&d<=920&&off<=arc-spread/2&&off<best){target=p;best=off;}}
  if(!target){target=this.target(players||[]);if(target)this.alignFor(id,target,rear);this.timers.set(id+'-fire',.18);return;}
  this.alignIntent=null;const wanted=Math.atan2(target.y-q.y,target.x-q.x),aim=base+Math.max(-arc+spread/2,Math.min(arc-spread/2,alpsAngleDelta(wanted,base)));
  gun.recoil=.12;this.command('muzzle',{...q,partId:id});
  fireFanSalvo(this,{...q,angle:aim,speed:this.t.bulletSpeed*.8,damage:this.t.damage*.55,visual:'alps-mg',tag:this.id+':'+id,sourcePartId:id,count:this.phase===3?9:7,spread,beats:1,warning:.55,gapIndex:this.patternIndex++%2?2:5});
 }
 stickBombs(bounds,{count=7,radius=36,warning=2,damage=.8}={}){
  const s=this.t.geometryScale||1,source=alpsPoint(this,0,25*s),a=this.hullYaw-Math.PI/2,dx=Math.cos(a),dy=Math.sin(a);
  // Bombs land ahead of the airframe along the run, never on the boss itself.
  for(let i=0;i<count;i++)this.hazard('circle',{x:source.x+dx*(150+i*64),y:source.y+dy*(150+i*64),radius,delay:i*.18,warning,duration:.3,once:true,damage:this.t.damage*damage,visual:'carpet-bomb',airborneBomb:true,sourceX:source.x,sourceY:source.y,tag:this.id+':payload'});
 }
 onPartDestroyed(p){if(p.kind==='gun')this.command('cancel-hazards',{tag:this.id+':'+p.id});if(p.id==='cannon'){this.cannonLock=null;this.cannonRemaining=0;}if(this.alignIntent?.id===p.id)this.alignIntent=null;if(p.kind==='engine')this.command('phase-change',{phase:'engine-damaged'});}
 updatePhase(){const loss=this.engineLoss();if(this.hp<=this.maxHp*.68||loss)this.setPhase(2);if(this.hp<=this.maxHp*.32||loss===this.layout.engines.length)this.setPhase(3);}
}

export class GIK extends AlpsBomber {
 constructor(o){super({...o,kind:'gik'});this.cannonLock=null;this.cannonRemaining=0;this.cannonFlash=0;this.cannonVolley=0;this.gateResponse=0;}
 hurry(){
  const key=this.part('cannon').destroyed||this.gateResponse++%2?'gik-bomb-run':'alps-cannon';
  if(!this.cannonLock)this.timers.set(key,.15);return key;
 }
 cannon(dt,players){
  const gun=this.part('cannon');this.cannonFlash=Math.max(0,this.cannonFlash-dt);if(gun.destroyed)return;
  if(this.cannonLock){this.cannonRemaining=Math.max(0,this.cannonRemaining-dt);if(this.cannonRemaining>0)return;
   // Each round keeps its warned bearing; the final phase adds a fourth beat.
   const lock=this.cannonLock,angle=lock.angle,q=alpsMuzzle(this,'cannon',angle),rounds=lock.angles.length;for(let i=0;i<rounds;i++){const shotAngle=lock.angles[i];this.hazard('projectile',{...q,sourcePartId:'cannon',sourceOffsetX:q.x-this.x-gun.x,sourceOffsetY:q.y-this.y-gun.y,vx:Math.cos(shotAngle)*400,vy:Math.sin(shotAngle)*400,radius:i===rounds-1?18:9,delay:i*.48,damage:this.t.damage*(i===rounds-1?2.4:1.2),raidHeavy:i===rounds-1,visual:'alps-cannon',duration:2.6,tag:this.id+':cannon'});}this.timers.set('alps-cannon',this.phase===3?4.2:this.phase===2?5.4:6.5);
   this.cannonShotAngle=angle;this.command('heavy-gun-fired',{...q,partId:'cannon'});gun.recoil=.22;this.cannonFlash=.16;this.cannonLock=null;return;
  }
  if(!this.due('alps-cannon',dt,this.t.cannonInterval||(this.phase===1?3.5:2.7)))return;
  const forward=this.hullYaw-Math.PI/2,q=alpsMuzzle(this,'cannon');let p=this.target(players,p=>Math.hypot(p.x-q.x,p.y-q.y)>=120&&Math.abs(alpsAngleDelta(Math.atan2(p.y-q.y,p.x-q.x),forward))<.55);
  if(!p){p=this.target(players);if(p)this.alignFor('cannon',p,false);this.timers.set('alps-cannon',.18);return;}
  this.alignIntent=null;
  const desired=Math.atan2(p.y-q.y+(p.vy||0)*.3,p.x-q.x+(p.vx||0)*.3),angle=forward+Math.max(-.6,Math.min(.6,alpsAngleDelta(desired,forward)));
  const sweep=this.phase>=2&&this.cannonVolley++%2===1,rounds=this.phase===3?4:3;
  const angles=Array.from({length:rounds},(_,i)=>angle+(sweep?(i/(rounds-1)-.5)*.36:0));
  this.cannonLock={angle,angles,seconds:1.25};this.cannonRemaining=1.25;
  for(const shot of new Set(angles))this.command('charge-warning',{...q,partId:'cannon',targetX:q.x+Math.cos(shot)*700,targetY:q.y+Math.sin(shot)*700,seconds:1.25});
 }
 tailCover(dt,players){
  this.tailCoverClock=Math.max(0,(this.tailCoverClock||0)-dt);
  const gun=this.part('rearGun');if(!this.cannonLock||gun.destroyed||this.tailCoverClock>0)return;
  const q=alpsMuzzle(this,'rearGun'),rear=this.hullYaw+Math.PI/2;
  const target=players.find(p=>p.alive&&Math.hypot(p.x-q.x,p.y-q.y)>=95&&Math.hypot(p.x-q.x,p.y-q.y)<=920&&Math.abs(alpsAngleDelta(Math.atan2(p.y-q.y,p.x-q.x),rear))<.85);
  if(!target)return;
  // A short defensive burst uses the same gun, but never advances its native
  // attack/steering clocks or steals the cannon's committed firing direction.
  const angle=Math.atan2(target.y-q.y,target.x-q.x),speed=this.t.bulletSpeed*.8;
  this.tailCoverClock=3.5;gun.recoil=.12;this.command('muzzle',{...q,partId:gun.id});
  this.command('charge-warning',{...q,partId:gun.id,targetX:q.x+Math.cos(angle)*480,targetY:q.y+Math.sin(angle)*480,seconds:.55});
  for(const offset of [-.16,0,.16])this.hazard('projectile',{...q,vx:Math.cos(angle+offset)*speed,vy:Math.sin(angle+offset)*speed,radius:4,warning:.55,duration:2.2,damage:this.t.damage*.55,visual:'alps-mg',tag:this.id+':rearGun',sourcePartId:gun.id,sourceOffsetX:q.x-this.x-gun.x,sourceOffsetY:q.y-this.y-gun.y});
 }
 bombIntercept(players){
  const p=this.target(players);if(!p)return;
  const source=alpsPoint(this,0,25*(this.t.geometryScale||1)),speed=Math.hypot(p.vx||0,p.vy||0),moving=speed>10;
  const dx=moving?p.vx/speed:Math.cos(this.a),dy=moving?p.vy/speed:Math.sin(this.a),rows=this.phase===3?8:7;
  for(let i=0;i<rows;i++){
   // Each bomb falls where the pilot will be if it holds its course (straight or turning).
   const warning=1.7+i*.32,travel=moving?Math.min(speed,340)*warning:i*64,shoulder=moving?(i%2?1:-1)*22:0,q=moving?predictPilot(p,warning):{x:p.x+dx*travel,y:p.y+dy*travel};
   this.hazard('circle',{x:q.x-dy*shoulder,y:q.y+dx*shoulder,radius:36,warning,duration:.3,once:true,damage:this.t.damage*.8,visual:'carpet-bomb',airborneBomb:true,sourceX:source.x,sourceY:source.y,tag:this.id+':payload'});
  }
 }
 update(dt,{players,bounds}){
  this.cruise(dt,bounds,players);if(this.updateDisarmed(dt))return;this.updatePhase();
  if(this.encounter?.breathBlocks({type:'charge-warning'})){if(this.cannonLock){this.cannonLock=null;this.cannonRemaining=0;this.timers.set('alps-cannon',.2);}return;}
  this.cannon(dt,players);
  // Keep the original rear-gun clock and alignment decisions unchanged.
  if(!this.cannonLock&&this.alignIntent?.id!=='cannon')this.mountFire('rearGun',players,dt,this.phase===3?1.3:1.8,true);
  this.tailCover(dt,players);
  if(!this.cannonLock&&this.due('gik-bomb-run',dt,this.phase===3?3.6:5)){this.bombIntercept(players);this.command('phase-change',{phase:'gik-strafe-run'});}
 }
}

export class Ca4 extends AlpsBomber {
 constructor(o){super({...o,kind:'ca4'});this.bayExpose=0;this.bayRuptured=false;this.bombLane=-1;this.bombRunRemaining=0;this.runSerial=0;this.laneWarnings=[];this.egress=null;this.egressLift=0;this.egressDone=false;}
 startBombRun(bounds){
  if(this.part('bombBay').destroyed||this.bombRunRemaining>0)return;
  this.bombLane=(this.bombLane+1)%3;const width=bounds.right-bounds.left,height=bounds.bottom-bounds.top;
  // Bounds are captured once: a moving camera never relocates a warned strike.
  const gap=width/3,margin=Math.max(32,gap*.15),radius=Math.max(24,gap*.46);
  this.runBounds={...bounds};this.runRadius=radius;this.laneWarnings=[];
  for(let i=0;i<3;i++)this.laneWarnings.push({x:bounds.left+gap*(i+.5),y:bounds.top+height*.55,width:gap-2*margin,height:height*.55,safe:i===this.bombLane});
  this.bombRunRemaining=1.25;this.runSerial++;this.bayExpose=3.3;this.part('bombBay').hittable=true;this.command('phase-change',{phase:'bomb-bay-exposed'});
 }
 egressBombing(bounds){
  const bottom=Math.max(this.y+120,bounds.bottom-40);
  for(let i=0;i<3;i++){const x=this.x+(this.rng()-.5)*170,y=bottom-i*80;
   this.hazard('circle',{x,y,radius:34,delay:0,warning:1.9+i*.2,duration:.3,once:true,damage:this.t.damage*.7,visual:'carpet-bomb',airborneBomb:true,sourceX:this.x,sourceY:this.y,tag:this.id+':payload'});}
 }
 defenseRing(players){
  for(const id of ['frontGun','rearGun']){
   const gun=this.part(id);if(!gun||gun.destroyed)continue;
   const rear=id==='rearGun',forward=this.hullYaw+(rear?Math.PI/2:-Math.PI/2),q=alpsPoint(this,gun.localX,gun.localY);
   const target=players.find(p=>p.alive&&Math.abs(alpsAngleDelta(Math.atan2(p.y-q.y,p.x-q.x),forward))<1.15&&Math.hypot(p.x-q.x,p.y-q.y)<720);if(!target)continue;
   const base=Math.atan2(target.y-q.y,target.x-q.x);
   // The ring is warned from the gun like every other burst.
   this.command('charge-warning',{...q,partId:id,targetX:q.x+Math.cos(base)*420,targetY:q.y+Math.sin(base)*420,seconds:.6});
   for(let i=0;i<7;i++){const a=base+(i-3)*.28;
    this.hazard('projectile',{...q,sourcePartId:id,sourceOffsetX:q.x-this.x-gun.x,sourceOffsetY:q.y-this.y-gun.y,vx:Math.cos(a)*240,vy:Math.sin(a)*240,radius:4,delay:.6,warning:0,duration:2.2,damage:this.t.damage*.55,visual:'alps-mg',tag:this.id+':'+id});}
   this.command('muzzle',{...q,partId:id});
  }
 }
 releaseBombRun(){
  if(this.part('bombBay').destroyed)return;
  const b=this.runBounds,source=alpsPoint(this,0,this.part('bombBay').localY),height=b.bottom-b.top;
  // Loading stays exposed through the final warned drop: a lateral approach
  // can silence the ongoing corridor, rather than finding a closed bay
  // while its bombs are still waiting to launch.
  this.bayExpose=Math.max(this.bayExpose,5.6);
  for(const lane of this.laneWarnings.filter(l=>!l.safe))for(let row=0;row<8;row++)this.hazard('circle',{x:lane.x,y:b.top+height*(.24+row*.10),radius:this.runRadius,delay:0,warning:2+row*.32,duration:.3,once:true,damage:this.t.damage*.85,visual:'carpet-bomb',airborneBomb:true,sourceX:source.x,sourceY:source.y,sourcePartId:'bombBay',tag:this.id+':payload'});
  const lane=this.laneWarnings.find(l=>l.safe);if(lane)impactPulse(this,{x:lane.x,y:b.top+height*.6,radius:Math.min(115,(b.right-b.left)/3*.48),warning:5,source,partId:'bombBay',visual:'carpet-bomb',tag:this.id+':payload'});this.timers.set('ca4-bombs',8);
  this.command('bomb-release',{...source});
 }
 onPartDestroyed(p){super.onPartDestroyed(p);if(p.id==='bombBay'&&!this.bayRuptured){this.bayRuptured=true;this.bombRunRemaining=0;this.laneWarnings=[];this.bayExpose=0;this.command('cancel-hazards',{tag:this.id+':payload'});
   this.command('internal-explosion',{x:this.x,y:this.y});BaseBoss.prototype.hit.call(this,{damage:Math.min(this.hp,this.maxHp*.16)});this.setPhase(3);
  }}
 update(dt,{players,bounds}){
  this.cruise(dt,bounds,players);if(this.updateDisarmed(dt))return;this.updatePhase();const bay=this.part('bombBay');
  if(this.egress){
   const e=this.egress;e.age=(e.age||0)+dt;
   if(e.phase==='away'&&(Math.hypot(this.x-e.x,this.y-e.y)>=430||e.age>=12)){e.phase='hold';e.left=1.5;}
   else if(e.phase==='hold'){e.left-=dt;if(e.left<=0)e.phase='return';}
   else if(e.phase==='return'&&Math.hypot(this.x-this.fixedX,this.y-this.fixedY)<180){this.egress=null;if(!bay.destroyed)this.startBombRun(bounds);}
   if(!bay.destroyed&&this.due('ca4-egress-bombs',dt,.45))this.egressBombing(bounds);
   this.mountFire('frontGun',players,dt,1.6);this.mountFire('rearGun',players,dt,1.6,true);
   return;
  }
  if(!bay.destroyed&&!this.egressDone&&this.hp<=this.maxHp*.45){this.egressDone=true;this.egress={phase:'away',x:this.x,y:this.y,angle:this.a,age:0};this.egressLift=0;this.bombRunRemaining=0;this.laneWarnings=[];this.bayExpose=0;this.command('cancel-hazards',{tag:this.id+':payload'});this.command('phase-change',{phase:'ca4-egress'});return;}
  if(this.bayExpose>0)this.bayExpose=Math.max(0,this.bayExpose-dt);
  if(this.bombRunRemaining>0){this.bombRunRemaining=Math.max(0,this.bombRunRemaining-dt);if(!this.bombRunRemaining)this.releaseBombRun();}
  else if(!bay.destroyed&&this.due('ca4-bombs',dt,(this.t.bombInterval||(this.phase===3?3.4:4.8))*(1+this.engineLoss()*.18)))this.startBombRun(bounds);
  bay.hittable=!bay.destroyed&&(this.bayExpose>0||this.phase===3);
  if(this.due('ca4-ring',dt,this.phase===3?3.2:4.4))this.defenseRing(players);
  this.mountFire('frontGun',players,dt,2.15);this.mountFire('rearGun',players,dt,2.15,true);
 }
}


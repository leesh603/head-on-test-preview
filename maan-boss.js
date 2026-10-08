import {impactPulse} from './boss-raid-strikes.js?v=raid1&rail=19';
import {fireFanSalvo} from './boss-salvo-geometry.js';
import {BaseBoss,BossPart} from './headon-stageboss-core.js?v=raid1';
import {MAAN_LAYOUT,MAAN_ENTRY,rotateMaan,segmentBox,maanLocal,maanWorld,maanClearance,maanGroundBlocked,resolveMaanGround,MAAN_ESCORT_RADIUS} from './maan-layout.js?v=raid1';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
class DesertHull extends BaseBoss {
 constructor(o,kind){
  const layout=MAAN_LAYOUT[kind],parts=layout.parts.map(([id,x,y,rx,ry,type])=>new BossPart({id,x,y,radius:Math.min(rx,ry),kind:type,maxHp:o.tuning.partHp*(type==='track'?1.2:type==='cooling'||type==='command'?1.6:1)}));
  super({...o,maxHp:o.tuning.maxHp,coreRadius:layout.width*.4,parts});
  Object.assign(this,{kind,faction:o.faction,t:o.tuning,rng:o.rng||Math.random,layout,ownsMotion129:true,hullYaw:Math.PI,entryAge:0,entryDuration:MAAN_ENTRY.duration,entryOrigin:{x:o.x,y:o.y},phase:'arrival',coreVulnerable:false,hidden:true});
  this.parts.forEach(p=>{const row=layout.parts.find(r=>r[0]===p.id);Object.assign(p,{localX:p.x,localY:p.y,rx:row[3],ry:row[4],hittable:false});});
 }
 command(type,spec={}){this.emit({...spec,type,bossId:this.id,faction:this.faction});}
 hazard(kind,spec){this.command('hazard',{kind,damage:this.t.damage,warning:kind==='projectile'?0:1.15,duration:kind==='projectile'?5:.4,...spec});}
 fan(x,y,a,count,spread,speed=this.t.bulletSpeed,visual='wusten-shell'){for(let i=0;i<count;i++){const angle=a+(count===1?0:i/(count-1)-.5)*spread;this.hazard('projectile',{x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,radius:5,visual});}}
 ring(count=10,speed=this.t.bulletSpeed*.6,visual='wusten-mg'){const guns=this.live('mg');if(!guns.length)return;const n=Math.max(4,Math.ceil(count*(this.t.projectileDensity||1))),off=this.rng()*Math.PI*2;
  for(let i=0;i<n;i++){const gun=guns[i%guns.length],m=this.muzzle(gun),a=off+i*Math.PI*2/n;if(i<guns.length){gun.gunFlash=.14;this.command('muzzle',{...m,partId:gun.id});}this.hazard('projectile',{...m,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,radius:4,visual,damage:this.t.damage*.5});}}
 target(players){return players.find(p=>p.alive);}
 gone(id){return this.parts.get(id)?.destroyed;}
 live(type){return [...this.parts.values()].filter(p=>!p.destroyed&&p.kind===type);}
 phaseTo(phase){if(this.phase!==phase){this.phase=phase;this.command('phase-change',{phase});}}
 syncParts(){for(const p of this.parts.values()){const r=rotateMaan(p.localX,p.localY+(p.id==='heavy-gun'&&!p.destroyed?p.recoil||0:0),this.hullYaw);p.x=r.x;p.y=r.y;}}
 muzzle(p,side=0){const r=rotateMaan(p.localX+side*(p.rx+(this.kind==='sinai-landship'?4:13)),p.localY+(side?0:-p.ry-9)+(p.id==='heavy-gun'?p.recoil||0:0),this.hullYaw);return{x:this.x+r.x,y:this.y+r.y};}
 // Sand cover keeps the last observed fix; command loss never reacquires it.
 aimTarget(p,blind=false){
  if(!blind&&!p.sandCover){this.lastSeen={x:p.x,y:p.y,vx:p.vx||0,vy:p.vy||0};this.sandBlind=false;return this.lastSeen;}
  this.sandBlind=true;
  return blind?{x:this.x+this.side*90,y:this.y+220,vx:0,vy:0}:(this.lastSeen||{x:this.x,y:this.y+220,vx:0,vy:0});
 }
 arrival(dt,{bounds,players}){
  if(this.entryAge>=this.entryDuration)return false;
  const previous=this.entryAge;this.entryAge=Math.min(this.entryDuration,this.entryAge+dt);
  if(!this.entryTarget){
   const factory=this.kind==='wustenpanzer',x=(bounds.left+bounds.right)/2;
   // Keep the physical doorway in view on both screen shapes. The fort exits
   // toward the camera, with its nose and every gun facing its drive direction.
   const y=factory?bounds.top+Math.min(150,(bounds.bottom-bounds.top)*.18)+this.layout.height/2+24:(bounds.top+bounds.bottom)/2-clamp((bounds.bottom-bounds.top)*.15,70,125);
   this.entryTarget={x,y};
   const travel=factory?this.layout.height+44:this.layout.height+150;
   this.entryStart={x,y:y-travel};this.entryAnchor={x,y:y-this.layout.height/2-24-256};
   this.workshop={x,y:this.entryAnchor.y,width:420,height:640,openingY:y-this.layout.height/2-24};
   const halfX=Math.max((bounds.right-bounds.left)/2,this.layout.width*1.3),halfY=Math.max((bounds.bottom-bounds.top)/2,this.layout.height*.6);
   this.arenaBounds={left:x-halfX,right:x+halfX,top:y-halfY,bottom:y+halfY};
   this.x=this.entryStart.x;this.y=this.entryStart.y;
   for(const car of this.encounter?.bodies.values()||[])if(car.leader===this)car.stageArrival(bounds);
  }
  const factory=this.kind==='wustenpanzer',start=factory?3.6:3,progress=clamp((this.entryAge-start)/(this.entryDuration-start),0,1),smooth=progress*progress*(3-2*progress),oldY=this.y;
  this.x=this.entryStart.x;this.y=this.entryStart.y+(this.entryTarget.y-this.entryStart.y)*smooth;
  this.driveVelocity=dt?(this.y-oldY)/dt:0;this.hidden=false;
  this.rollTracks(this.y-oldY,0);
  if(factory&&previous<2.8&&this.entryAge>=2.8){this.workshop.destroyedAt=2.8;this.command('maan-workshop-collapse',{x:this.workshop.x,y:this.workshop.openingY});}
  for(const [at,stage] of [[0,'alarm'],[1.6,'ignition'],[2.8,'doors'],[4.8,'reveal']])if((at===0&&previous===0)||(previous<at&&this.entryAge>=at))this.command('maan-entry',{stage,x:this.x,y:this.y});
  if(this.entryAge>=this.entryDuration){this.coreVulnerable=true;for(const part of this.parts.values())part.hittable=true;this.phaseTo('advance');this.command('maan-entry',{stage:'engaged',x:this.x,y:this.y});}
  this.separateEscorts();
  this.syncParts();return true;
 }
 locateHit(s){
  if(this.entryAge<this.entryDuration||this.dead)return null;
  const a=rotateMaan((s.previousX??s.x)-this.x,(s.previousY??s.y)-this.y,-this.hullYaw),b=rotateMaan(s.x-this.x,s.y-this.y,-this.hullYaw);
  let best=null;
  for(const p of this.parts.values())if(p.hittable&&!p.destroyed&&segmentBox(a.x,a.y,b.x,b.y,p.localX,p.localY+(p.id==='heavy-gun'?p.recoil||0:0),p.rx,p.ry,s.radius||0)){
   const dx=(b.x-a.x)/p.rx,dy=(b.y-a.y)/p.ry,nx=(a.x-p.localX)/p.rx,ny=(a.y-p.localY-(p.id==='heavy-gun'?p.recoil||0:0))/p.ry,t=clamp(-(nx*dx+ny*dy)/(dx*dx+dy*dy||1),0,1),score=(nx+dx*t)**2+(ny+dy*t)**2;
   if(!best||score<best.score)best={partId:p.id,score};
  }
  if(best)return{partId:best.partId};
  return segmentBox(a.x,a.y,b.x,b.y,0,0,this.layout.width*.43,this.layout.height*.48,s.radius||0)?{partId:null}:null;
 }
 hit(s){
  if(this.entryAge<this.entryDuration)return{damage:0,blocked:true};
  const r=super.hit(s.partId?s:{...s,damage:s.damage*(this.breached||this.serviceWindow>0?1:.32)});
  if(this.dead)for(const car of this.encounter?.bodies.values()||[])if(car.leader===this){car.dead=true;car.hp=0;}
  return r;
 }
 onPartDestroyed(p){
  this.command('cancel-hazards',{tag:this.id+':'+p.id});
  // Parts remain attached; the renderer swaps authored plate/track regions.
  this.command('maan-damage',{partId:p.id,x:this.x+p.x,y:this.y+p.y,material:p.kind});
  this.breached=this.live('gun').length<=1||this.live('track').length<=1||this.gone(this.kind==='wustenpanzer'?'radiator':'command');
 }
 rollTracks(distance,turn){
  for(const p of this.parts.values())if(p.kind==='track'&&!p.destroyed)p.trackRoll=(p.trackRoll||0)+distance-(p.localX<0?-1:1)*turn*this.layout.width*.35;
 }
 trackedDrive(dt,speed,left,right){
  const origin=this.entryTarget||this.entryOrigin,bounds=this.arenaBounds,rx=Math.min(145,(bounds.right-bounds.left)*.2),ry=90;
  this.route??=[{x:origin.x,y:origin.y+ry},{x:origin.x+rx,y:origin.y},{x:origin.x,y:origin.y-ry},{x:origin.x-rx,y:origin.y}];
  this.routeIndex??=0;this.drivePause=Math.max(0,(this.drivePause||0)-dt);
  const target=this.route[this.routeIndex],dx=target.x-this.x,dy=target.y-this.y;
  if(Math.hypot(dx,dy)<28){this.routeIndex=(this.routeIndex+1)%this.route.length;this.drivePause=Math.max(this.drivePause,.8);}
  const desired=Math.atan2(dy,dx)+Math.PI/2,delta=Math.atan2(Math.sin(desired-this.hullYaw),Math.cos(desired-this.hullYaw));
  const mobility=(left+right)/2,steering=mobility?clamp(delta*.55,-.25,.25)*mobility*(this.steeringFactor??1)+(left-right)*.22:0;
  const wanted=this.drivePause>0?0:speed*mobility*Math.max(0,Math.cos(delta));
  this.driveVelocity=(this.driveVelocity||0)+clamp(wanted-(this.driveVelocity||0),-28*dt,10*dt);
  if(!mobility)this.driveVelocity=0;
  const turn=this.drivePause>0?0:steering*dt,distance=this.driveVelocity*dt;
  this.hullYaw+=turn;this.x+=Math.sin(this.hullYaw)*distance;this.y-=Math.cos(this.hullYaw)*distance;
  this.rollTracks(distance,turn);this.syncParts();this.separateEscorts();
 }
 separateEscorts(){resolveMaanGround(this.encounter);}
 tactic(name){if(this.tacticName!==name){this.tacticName=name;this.command('maan-tactic',{name});}}
 aimed(p,target,{side=0,count=3,spread=.25,visual,warning=0,delay=0,tag=null}={}){
  const m=this.muzzle(p,side),a=Math.atan2(target.y-m.y,target.x-m.x);p.gunFlash=.14;this.command('muzzle',{...m,partId:p.id});
  if(warning)this.hazard('circle',{x:target.x+(target.vx||0)*.45,y:target.y+(target.vy||0)*.45,radius:44,warning,delay,once:true,sourceX:m.x,sourceY:m.y,visual:visual||'wusten-impact',damage:this.t.damage*1.6,tag});
  else this.fan(m.x,m.y,a,count,spread,this.t.bulletSpeed,visual);
 }
}
export class Wustenpanzer extends DesertHull {
 constructor(o){super(o,'wustenpanzer');this.heat=0;this.ventAge=0;this.heavySerial=0;this.serviceWindow=0;this.pressureCycle=null;this.heavyPlan=null;this.timers.set('heavy',.2);}
 onPartDestroyed(p){super.onPartDestroyed(p);if(p.id==='radiator')this.heat=Math.max(this.heat,.6);if(p.id==='heavy-gun'){this.heavyPlan=null;p.recoil=0;this.syncParts();}}
 heavyShot(target,walking=false){
  const gun=this.parts.get('heavy-gun');if(gun.destroyed)return;
  gun.recoil=4;this.syncParts();if(!walking)this.aimed(gun,target,{warning:1.7,visual:'wusten-impact'});
  gun.gunFlash=.18;gun.reloadVisual=.8;
  if(walking){const m=this.muzzle(gun);impactPulse(this,{x:target.x,y:target.y,radius:86,warning:1.7,source:m,partId:gun.id,visual:'wusten-impact',tag:this.id+':heavy-gun'});}if(!walking){const m=this.muzzle(gun);this.hazard('circle',{x:target.x+(target.vx||0)*.45,y:target.y+(target.vy||0)*.45,radius:38,radiusStart:38,radiusLimit:140,ringSpeed:95,ringWidth:22,innerRadius:16,warning:1.8,duration:1.08,damage:this.t.damage*.6,sourceX:m.x,sourceY:m.y,visual:'maan-sand-ring'});}
  this.artilleryClearAt=this.motionTime+2.9;this.heat=clamp(this.heat+.2,0,1);this.command('heavy-gun-fired');
 }
 startPressure(runaway,aim){
  this.heavyPlan=null;this.pressureCycle={age:0,runaway:true,index:0,target:{...aim},stage:'vent'};
  this.drivePause=6.5;this.tactic(runaway?'desert-runaway':'pressure-release');
  const r=this.parts.get('radiator'),m={x:this.x+r.x,y:this.y+r.y};
  // The longitudinal lane between the two warned vents stays open.
  for(const side of [-1,1]){const v=rotateMaan(side*95,0,this.hullYaw);this.hazard('circle',{x:m.x+v.x,y:m.y+v.y,radius:58,warning:1.15,duration:1.6,tickInterval:.5,damage:this.t.damage*.5,visual:'wusten-steam'});}
 }
 pressure(dt,p){
  const s=this.pressureCycle;s.age+=dt;
  if(!s.released&&s.age>=1.15){s.released=true;const r=this.parts.get('radiator');this.command('maan-vent',{x:this.x+r.x,y:this.y+r.y,black:this.gone('engine')});}
  if(s.runaway&&s.age>=2.8){
   s.stage='barrage';
   while(s.index<3&&s.age>=2.8+s.index*.48){
    const i=s.index++,target={...s.target,y:s.target.y+(i-1)*78,vx:0,vy:0};
    if(!this.gone('heavy-gun'))this.heavyShot(target,true);
    else if(i<2&&!p.sandCover){const id=i?'sponson-right':'sponson-left',gun=this.parts.get(id);if(!gun.destroyed)this.aimed(gun,target,{side:i?1:-1,warning:1.25,visual:'wusten-impact'});}
   }
  }
  if(s.age>=(s.runaway?6.5:2.8)){
   this.pressureCycle=null;this.heat=.25;this.serviceWindow=s.runaway?3.2:2.6;this.drivePause=this.serviceWindow;
   this.timers.set('heavy',2);this.tactic('overheat-service');
  }
 }
 update(dt,ctx){
  if(this.arrival(dt,ctx))return;const p=this.target(ctx.players);if(!p)return;
  for(const gun of this.parts.values()){gun.gunFlash=Math.max(0,(gun.gunFlash||0)-dt);gun.recoil=Math.max(0,(gun.recoil||0)-dt*12);gun.reloadVisual=Math.max(0,(gun.reloadVisual||0)-dt);}
  const aim=this.aimTarget(p);
  const cooling=!this.gone('radiator'),engine=!this.gone('engine'),left=!this.gone('track-left'),right=!this.gone('track-right');
  this.heat=clamp(this.heat+dt*(cooling?-.13:.19)+(this.hp<this.maxHp*.3?dt*.12:0),0,1);
  const runaway=!cooling&&this.hp<this.maxHp*.3,overheat=this.heat>.72;
  this.phaseTo(runaway?'cooling-runaway':overheat?'overheated':!engine?'engine-crippled':left!==right?'track-slew':'advance');
  this.serviceWindow=Math.max(0,this.serviceWindow-dt);
  if(this.serviceWindow>0||this.pressureCycle)this.drivePause=Math.max(this.drivePause||0,.1);
  this.trackedDrive(dt,(engine?1:.3)*(runaway?25:12),+left,+right);
  if(this.serviceWindow>0)return;
  if(this.pressureCycle){this.pressure(dt,p);return;}
  // Finish an already fired shell before opening the counterattack window.
  if(!this.heavyPlan&&this.motionTime>=(this.artilleryClearAt||0)&&((!cooling&&this.heat>=.82)||(runaway&&!this.runawayStarted)||(cooling&&this.due('pressure-cycle',dt,12)))){
   this.runawayStarted ||= runaway;this.startPressure(runaway,aim);return;
  }
  const gun=this.parts.get('heavy-gun');
  if(!gun.destroyed&&!this.heavyPlan&&this.due('heavy',dt,overheat?8.5:6.4)){
   const walking=++this.heavySerial%2===0;this.drivePause=2.4;this.tactic(walking?'walking-barrage':'siege-shot');
   this.heavyPlan={age:0,index:0,walking,target:{...aim,x:aim.x+(overheat?(this.rng()-.5)*36:0),y:aim.y+(overheat?(this.rng()-.5)*28:0)}};
  }
  if(this.heavyPlan){
   const s=this.heavyPlan;s.age+=dt;gun.reloadVisual=Math.max(0,.9-s.age);if(gun.reloadVisual>0){gun.recoil=Math.max(gun.recoil,gun.reloadVisual*1.5);this.syncParts();}
   if(gun.destroyed)this.heavyPlan=null;
   else{while(s.index<(s.walking?3:1)&&s.age>=.9+s.index*.48){const i=s.index++;this.heavyShot({...s.target,x:s.target.x+(s.target.vx||0)*i*.35,y:s.target.y+(s.walking?(i-1)*78:0)},s.walking);}
    if(s.index>=(s.walking?3:1))this.heavyPlan=null;}
  }
  if(this.due('crossfire',dt,overheat?8:6.5))for(const [id,side]of [['sponson-left',-1],['sponson-right',1]]){
   const gun=this.parts.get(id);if(!gun.destroyed&&!p.sandCover){const m=this.muzzle(gun,side),a=Math.atan2(aim.y-m.y,aim.x-m.x)+side*.17;
    gun.gunFlash=.14;this.command('muzzle',{...m,partId:id});fireFanSalvo(this,{...m,angle:a,speed:this.t.bulletSpeed*.75,damage:this.t.damage*.7,visual:'wusten-shell',tag:this.id+':'+id,sourcePartId:id,count:11,spread:1.4,beats:3,beat:.45,warning:.9,gapIndex:side<0?2:7,step:side<0?1:-1});}
  }
  if(this.due('close-defence',dt,2.5)&&!p.sandCover)for(const gun of this.live('mg')){const m=this.muzzle(gun);if(Math.hypot(aim.x-m.x,aim.y-m.y)<360)this.aimed(gun,aim,{count:5,spread:.55,visual:'wusten-mg'});}
  if(this.due('aa-sweep',dt,13)){
   const guns=this.live('mg');if(guns.length&&!p.sandCover){this.tactic('aa-sweep');for(const gun of guns)this.aimed(gun,aim,{count:7,spread:1.05,visual:'wusten-mg'});}
  }
  if(this.live('mg').length&&!p.sandCover&&this.due('ring',dt,8.5))this.ring(5*this.live('mg').length,this.t.bulletSpeed*.6,'wusten-mg');
 }
}
export class SinaiLandship extends DesertHull {
 constructor(o){super(o,'sinai-landship');this.side=-1;this.salvo=null;this.escortAge=0;this.encirclement=null;this.finalCooldown=0;this.serviceWindow=0;this.timers.set('broadside',.25);}
 gunOrder(side){return [side,-side].flatMap(s=>['front','rear'].map(end=>({id:`sponson-${s<0?'left':'right'}-${end}`,side:s}))).filter(g=>!this.gone(g.id));}
 startEncirclement(aim,ctx,disrupted){
  this.finalStarted=true;this.salvo=null;this.drivePause=6.3;
  const lane={x:clamp(aim.x,ctx.bounds.left+65,ctx.bounds.right-65),y:aim.y,width:110,depth:260,remaining:6.3};
  this.duneLane=lane;this.escortOrder=disrupted?'withdraw':'flank';
  this.encirclement={age:0,index:0,stage:'flank',disrupted,lane,guns:this.gunOrder(this.side).slice(0,disrupted?2:4)};
  if(!disrupted)for(const car of this.encounter.bodies.values())if(car.leader===this&&!car.dead)car.timers.set('escort-gun',0);
  this.tactic(disrupted?'broken-encirclement':'desert-encirclement');
 }
 finalAttack(dt,ctx){
  const s=this.encirclement;s.age+=dt;this.escortOrder=s.disrupted?'withdraw':'flank';
  if(s.age>=2.2){
   s.stage='barrage';const offset=Math.min(140,(ctx.bounds.right-ctx.bounds.left)*.3);
   while(s.index<s.guns.length&&s.age>=2.2+s.index*(s.disrupted?.8:.55)){
    const {id,side}=s.guns[s.index++],gun=this.parts.get(id);if(gun.destroyed)continue;
    const flank=rotateMaan(side,0,this.hullYaw).x<0?-1:1,x=clamp(s.lane.x+flank*offset,ctx.bounds.left+56,ctx.bounds.right-56);
    // Do not squeeze the promised 110px lane shut on a phone.
    if(Math.abs(x-s.lane.x)<44+s.lane.width/2+12)continue;
    this.aimed(gun,{x,y:s.lane.y+(s.index%2?-.5:.5)*130},{side,warning:1.7,visual:'sinai-impact',tag:s.disrupted?'sinai-final':'sinai-command'});
   }
  }
  if(!s.disrupted&&!s.finishFired&&s.age>=4.25){s.finishFired=true;if(this.duneLane)this.duneLane.remaining=0;const order=s.guns.find(q=>!this.parts.get(q.id).destroyed);if(order){const gun=this.parts.get(order.id);impactPulse(this,{x:s.lane.x,y:s.lane.y,radius:100,warning:1.35,source:this.muzzle(gun,order.side),partId:gun.id,visual:'sinai-impact',tag:'sinai-command'});}}
  if(s.age>=6.3){this.encirclement=null;this.duneLane=null;this.escortOrder='withdraw';this.serviceWindow=2.8;this.drivePause=2.8;this.finalCooldown=10;this.tactic('convoy-reload');}
 }
 update(dt,ctx){
  if(this.arrival(dt,ctx))return;const p=this.target(ctx.players);if(!p)return;
  for(const gun of this.parts.values()){gun.gunFlash=Math.max(0,(gun.gunFlash||0)-dt);gun.recoil=Math.max(0,(gun.recoil||0)-dt*12);}
  const front=['track-front-left','track-front-right'].filter(id=>!this.gone(id)).length,rear=['track-rear-left','track-rear-right'].filter(id=>!this.gone(id)).length;
  const disrupted=this.gone('command'),burning=this.gone('tank'),late=this.hp<this.maxHp*.4;
  const aim=this.aimTarget(p,disrupted);
  this.phaseTo(disrupted?'command-disrupted':late?'escort-pressure':burning?'fuel-fire':front!==rear?'differential-drive':'broadside');
  const left=['track-front-left','track-rear-left'].filter(id=>!this.gone(id)).length/2,right=['track-front-right','track-rear-right'].filter(id=>!this.gone(id)).length/2;
  this.steeringFactor=.45+.55*Math.min(front,rear)/2;
  this.serviceWindow=Math.max(0,this.serviceWindow-dt);this.finalCooldown=Math.max(0,this.finalCooldown-dt);
  if(this.encirclement||this.serviceWindow>0)this.drivePause=Math.max(this.drivePause||0,.1);
  this.trackedDrive(dt,12.8*(burning?.5:1)*(this.salvo?.35:1),left,right);
  const order=['screen','flank','withdraw'][Math.floor((this.motionTime-this.entryDuration)/8)%3];
  this.escortOrder=disrupted?'withdraw':order;
  this.escortFocus={...aim};
  if(this.serviceWindow>0){this.escortOrder='withdraw';return;}
  if(this.encirclement){this.finalAttack(dt,ctx);return;}
  if(late&&this.finalCooldown<=0){this.side=disrupted?(this.rng()<.5?-1:1):(maanLocal(this,aim.x,aim.y).x<0?-1:1);this.startEncirclement(aim,ctx,disrupted);return;}
  if(this.due('broadside',dt,disrupted?3.8:late?4.5:6.2)){
   this.side=disrupted?(this.rng()<.5?-1:1):(maanLocal(this,aim.x,aim.y).x<0?-1:1);this.salvo={age:0,index:0,guns:this.gunOrder(this.side),target:{x:aim.x,y:aim.y,vx:aim.vx||0,vy:aim.vy||0}};
   this.command('phase-change',{phase:'broadside-warning'});
  }
  if(this.salvo){const s=this.salvo;s.age+=dt;
   while(s.index<s.guns.length&&s.age>=s.index*(disrupted?.7:.38)){const {id,side}=s.guns[s.index],gun=this.parts.get(id),i=s.index++;if(!gun.destroyed)this.aimed(gun,{x:s.target.x+(i-1.5)*58,y:s.target.y+i*30,vx:0,vy:0},{side,warning:disrupted?1.7:1.25,visual:'sinai-impact'});}
   if(s.index>=s.guns.length)this.salvo=null;
  }
  if(!disrupted&&this.due('corridor-barrage',dt,14)){
   const width=ctx.bounds.right-ctx.bounds.left,offset=Math.min(140,width*.3),radius=Math.min(42,width*.085);
   this.tactic('corridor-barrage');this.drivePause=2.4;
   // The announced escape lane keeps the dashed telegraph drawn by the view.
   const gate=clamp(aim.x+(this.side<0?1:-1)*Math.min(100,width*.24),ctx.bounds.left+65,ctx.bounds.right-65);
   this.duneLane={x:gate,y:aim.y,width:100,depth:220,remaining:3.5};
   for(const side of [-1,1])for(let row=0;row<3;row++){
    const gun=this.parts.get(`sponson-${side<0?'left':'right'}-${row%2?'rear':'front'}`);if(gun.destroyed)continue;
    const x=clamp(gate+side*offset,ctx.bounds.left+radius+12,ctx.bounds.right-radius-12);if(Math.abs(x-gate)<radius+50)continue;
    const m=this.muzzle(gun,side);this.command('muzzle',{...m,partId:gun.id});
    this.hazard('circle',{x,y:aim.y+(row-1)*95,radius,warning:1.65+row*.48,delay:0,once:true,sourceX:m.x,sourceY:m.y,visual:'sinai-impact',tag:'sinai-command'});
   }
  }
  if(this.duneLane)this.duneLane.remaining=Math.max(0,this.duneLane.remaining-dt);
  const mg=this.parts.get('lewis');if(!mg.destroyed&&!p.sandCover&&!disrupted&&this.due('lewis',dt,2.6))this.aimed(mg,aim,{count:3,spread:.22,visual:'sinai-mg'});
  if(!mg.destroyed&&!p.sandCover&&this.due('ring',dt,disrupted?12:9))this.ring(10,this.t.bulletSpeed*.58,'sinai-mg');
  if(burning&&this.due('fuel-leak',dt,4.2)){const tank=this.parts.get('tank'),r=rotateMaan(0,75,this.hullYaw);this.hazard('circle',{x:this.x+tank.x+r.x,y:this.y+tank.y+r.y,radius:58,warning:.9,duration:2.2,tickInterval:.65,damage:this.t.damage*.5,visual:'sinai-fire'});this.command('maan-vent',{x:this.x+tank.x,y:this.y+tank.y,black:true});}
  // Existing encounter bodies provide cap, targeting, hit routing and cleanup.
  this.escortAge+=dt;
  const cap=late?3:2,live=[...this.encounter.bodies.values()].filter(b=>b.leader===this&&!b.dead);
  if(!this.gone('support')&&(!this.finalStarted||live.length>0)&&live.length<cap&&this.escortAge>=(late?10:18)){
   this.escortAge=0;const slot=this.escortSerial=(this.escortSerial||0)+1;
   const car=new RollsRoyceEscort({id:this.id+':escort:'+slot,leader:this,side:slot%2?-1:1,tuning:this.t,emit:this.emit,faction:this.faction,x:this.x,y:this.y});car.encounter=this.encounter;car.stageReinforcement();this.encounter.bodies.set(car.id,car);
   this.command('maan-escort',{x:car.x,y:car.y});
  }
 }
 onPartDestroyed(p){super.onPartDestroyed(p);if(p.id==='support')this.command('phase-change',{phase:'support-silenced'});if(p.id==='command'){this.command('cancel-hazards',{tag:'sinai-command'});this.duneLane=null;this.salvo=null;this.encirclement=null;this.finalCooldown=7;this.escortOrder='withdraw';this.tactic('command-lost');}}
}
export class RollsRoyceEscort extends BaseBoss {
 constructor({leader,side,tuning,...o}){super({...o,maxHp:tuning.partHp*.7,coreRadius:23});Object.assign(this,{kind:'maan-rolls-royce',leader,side,t:tuning,faction:o.faction,ownsMotion129:true,hullYaw:Math.PI,age:0,hidden:true,coreVulnerable:false});}
 stageArrival(bounds){
  const b=this.leader,lane=Math.min(maanClearance(b).x+28,(bounds.right-bounds.left)/2-45);
  this.arrivalStart={x:b.entryTarget.x+this.side*Math.max(65,lane),y:b.entryTarget.y-240};
  this.arrivalTarget={x:this.arrivalStart.x,y:b.entryTarget.y+b.layout.height/2+110};
  Object.assign(this,this.arrivalStart);this.clearHull();this.arrivalStart={x:this.x,y:this.y};
 }
 stageReinforcement(){
  const b=this.leader,r=maanClearance(b),cars=[...this.encounter.bodies.values()].filter(c=>c.leader===b&&!c.dead);
  for(let rank=0;rank<8;rank++){const p=maanWorld(b,this.side*(r.x+30),r.y+100+rank*100);if(cars.every(c=>Math.hypot(c.x-p.x,c.y-p.y)>MAAN_ESCORT_RADIUS*2+12)){Object.assign(this,p);break;}}
  this.hidden=false;this.coreVulnerable=true;this.clearHull();
 }
 clearHull(){
  const b=this.leader,p=maanLocal(b,this.x,this.y),r=maanClearance(b);
  if(Math.abs(p.x)<=r.x&&Math.abs(p.y)<=r.y){
   const dx=r.x-Math.abs(p.x),dy=r.y-Math.abs(p.y);
   if(dx<dy)p.x=(p.x<0?-1:p.x>0?1:this.side)*(r.x+.5);else p.y=(p.y<0?-1:1)*(r.y+.5);
   Object.assign(this,maanWorld(b,p.x,p.y));
  }
  if(!this.hidden)resolveMaanGround(this.encounter);
 }
 locateHit(s){const a=rotateMaan((s.previousX??s.x)-this.x,(s.previousY??s.y)-this.y,-this.hullYaw),b=rotateMaan(s.x-this.x,s.y-this.y,-this.hullYaw);return !this.hidden&&this.coreVulnerable&&!this.dead&&segmentBox(a.x,a.y,b.x,b.y,0,0,19,35,s.radius||0)?{partId:null}:null;}
 driveTo(dt,target,speed){
  this.clearHull();const b=this.leader,r=maanClearance(b),p=maanLocal(b,this.x,this.y),goal=maanLocal(b,target.x,target.y);
  if(Math.abs(goal.x)<=r.x&&Math.abs(goal.y)<=r.y)goal.x=this.side*(r.x+24);
  let destination=maanWorld(b,goal.x,goal.y);
  if(maanGroundBlocked(b,this.x,this.y,destination.x,destination.y)){
   // Reach the near corner, follow the outside lane, then approach the target.
   // A swept check also prevents tunnelling at low frame rates.
   const lane=(p.x<0?-1:p.x>0?1:this.side)*(r.x+24);
   destination=maanWorld(b,lane,Math.abs(p.x)<r.x?Math.sign(p.y||1)*(r.y+24):goal.y);
  }
  const dx=destination.x-this.x,dy=destination.y-this.y,d=Math.hypot(dx,dy);
  if(d<4){this.driveVelocity=0;return;}
  const facing=Math.atan2(dy,dx)+Math.PI/2,delta=Math.atan2(Math.sin(facing-this.hullYaw),Math.cos(facing-this.hullYaw));
  this.hullYaw+=clamp(delta,-1.5*dt,1.5*dt);
  const distance=Math.min(d,speed*dt)*Math.max(0,Math.cos(delta)),x=this.x+Math.sin(this.hullYaw)*distance,y=this.y-Math.cos(this.hullYaw)*distance;
  const occupied=[...this.encounter.bodies.values()].some(c=>c!==this&&c.leader===b&&!c.dead&&!c.hidden&&segmentBox(this.x,this.y,x,y,c.x,c.y,MAAN_ESCORT_RADIUS*2+8,MAAN_ESCORT_RADIUS*2+8));
  if(occupied||maanGroundBlocked(b,this.x,this.y,x,y)){this.driveVelocity=0;return;}
  this.x=x;this.y=y;this.driveVelocity=dt?distance/dt:0;
 }
 update(dt,{players}){
  if(this.leader.dead){this.dead=true;this.hp=0;return;}const p=players.find(p=>p.alive);if(!p)return;this.age+=dt;this.gunFlash=Math.max(0,(this.gunFlash||0)-dt);
  if(this.leader.entryAge<this.leader.entryDuration){
   this.hidden=this.leader.entryAge<1.6;this.coreVulnerable=false;
   if(!this.hidden)this.driveTo(dt,this.arrivalTarget,72);return;
  }
  this.hidden=false;this.coreVulnerable=true;
  // Escort orders follow the ground hull, never the moving aircraft camera.
  const b=this.leader,r=maanClearance(b),order=b.escortOrder,s=b.encirclement,focus=maanLocal(b,b.escortFocus?.x??b.x,b.escortFocus?.y??b.y);
  const target=order==='screen'?maanWorld(b,this.side*95,-r.y-65):order==='withdraw'?maanWorld(b,this.side*100,r.y+100):s?{x:s.lane.x+this.side*(s.lane.width/2+90),y:s.lane.y-80}:maanWorld(b,this.side*(r.x+55),clamp(focus.y,-r.y-120,r.y+180));
  this.driveTo(dt,target,42);resolveMaanGround(this.encounter);
  if(b.serviceWindow>0)return;
  // Scouts pressure the flanks first, then yield to the hull's warned salvo.
  if(s&&(s.disrupted||s.stage!=='flank'||s.age<(this.side<0?.6:1.3)||s.age>=(this.side<0?1.2:2)))return;
  if(this.age>7&&!p.sandCover&&this.due('escort-gun',dt,this.leader.gone('command')?4.6:3.4)){
   const m=rotateMaan(0,-31,this.hullYaw),x=this.x+m.x,y=this.y+m.y,aim=s?{x:s.lane.x+this.side*(s.lane.width/2+85),y:s.lane.y+130}:p,a=Math.atan2(aim.y-y,aim.x-x),speed=this.t.bulletSpeed*.65;
   const angles=[-.12,0,.12].map(offset=>a+offset).filter(angle=>!s||!segmentBox(x,y,x+Math.cos(angle)*speed*4,y+Math.sin(angle)*speed*4,s.lane.x,s.lane.y+80,s.lane.width/2+16,130+16));
   if(!angles.length)return;
   this.gunFlash=.12;this.emit({type:'muzzle',bossId:this.id,x,y});for(const angle of angles)this.emit({type:'hazard',bossId:this.id,faction:this.faction,kind:'projectile',x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,radius:4,damage:this.t.damage*.5,warning:0,duration:4,visual:'sinai-mg'});
  }
 }
}

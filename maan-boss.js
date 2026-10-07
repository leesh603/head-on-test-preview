import {BaseBoss,BossPart} from './headon-stageboss-core.js?v=ui2';
import {MAAN_LAYOUT,MAAN_ENTRY,rotateMaan,segmentBox,maanLocal,maanWorld,maanClearance,maanGroundBlocked,resolveMaanGround,MAAN_ESCORT_RADIUS} from './maan-layout.js?v=ui2';
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
 ring(count=10,speed=this.t.bulletSpeed*.6,visual='wusten-mg'){const n=Math.max(4,Math.ceil(count*(this.t.projectileDensity||1))),off=this.rng()*Math.PI*2;
  for(let i=0;i<n;i++){const a=off+i*Math.PI*2/n;this.hazard('projectile',{x:this.x,y:this.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,radius:4,visual,damage:this.t.damage*.5});}}
 target(players){return players.find(p=>p.alive);}
 gone(id){return this.parts.get(id)?.destroyed;}
 live(type){return [...this.parts.values()].filter(p=>!p.destroyed&&p.kind===type);}
 phaseTo(phase){if(this.phase!==phase){this.phase=phase;this.command('phase-change',{phase});}}
 syncParts(){for(const p of this.parts.values()){const r=rotateMaan(p.localX,p.localY,this.hullYaw);p.x=r.x;p.y=r.y;}}
 muzzle(p,side=0){const r=rotateMaan(p.localX+side*(p.rx+(this.kind==='sinai-landship'?4:13)),p.localY+(side?0:-p.ry-9),this.hullYaw);return{x:this.x+r.x,y:this.y+r.y};}
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
  for(const p of this.parts.values())if(p.hittable&&!p.destroyed&&segmentBox(a.x,a.y,b.x,b.y,p.localX,p.localY,p.rx,p.ry,s.radius||0)){
   const dx=(b.x-a.x)/p.rx,dy=(b.y-a.y)/p.ry,nx=(a.x-p.localX)/p.rx,ny=(a.y-p.localY)/p.ry,t=clamp(-(nx*dx+ny*dy)/(dx*dx+dy*dy||1),0,1),score=(nx+dx*t)**2+(ny+dy*t)**2;
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
  const mobility=(left+right)/2,steering=mobility?clamp(delta*.55,-.25,.25)+(left-right)*.22:0;
  const wanted=this.drivePause>0?0:speed*mobility*Math.max(0,Math.cos(delta));
  this.driveVelocity=(this.driveVelocity||0)+clamp(wanted-(this.driveVelocity||0),-28*dt,10*dt);
  if(!mobility)this.driveVelocity=0;
  const turn=steering*dt,distance=this.driveVelocity*dt;
  this.hullYaw+=turn;this.x+=Math.sin(this.hullYaw)*distance;this.y-=Math.cos(this.hullYaw)*distance;
  this.rollTracks(distance,turn);this.syncParts();this.separateEscorts();
 }
 separateEscorts(){resolveMaanGround(this.encounter);}
 tactic(name){if(this.tacticName!==name){this.tacticName=name;this.command('maan-tactic',{name});}}
 aimed(p,target,{side=0,count=3,spread=.25,visual,warning=0,delay=0}={}){
  const m=this.muzzle(p,side),a=Math.atan2(target.y-m.y,target.x-m.x);this.command('muzzle',{...m,partId:p.id});
  if(warning)this.hazard('circle',{x:target.x+(target.vx||0)*.45,y:target.y+(target.vy||0)*.45,radius:44,warning,delay,once:true,sourceX:m.x,sourceY:m.y,visual:visual||'wusten-impact',damage:this.t.damage*1.6});
  else this.fan(m.x,m.y,a,count,spread,this.t.bulletSpeed,visual);
 }
}
export class Wustenpanzer extends DesertHull {
 constructor(o){super(o,'wustenpanzer');this.heat=0;this.ventAge=0;this.heavySerial=0;this.serviceWindow=0;}
 update(dt,ctx){
  if(this.arrival(dt,ctx))return;const p=this.target(ctx.players);if(!p)return;
  const aim=this.aimTarget(p);
  const cooling=!this.gone('radiator'),engine=!this.gone('engine'),left=!this.gone('track-left'),right=!this.gone('track-right');
  this.heat=clamp(this.heat+dt*(cooling?-.13:.19)+(this.hp<this.maxHp*.3?dt*.12:0),0,1);
  const runaway=!cooling&&this.hp<this.maxHp*.3,overheat=this.heat>.72;
  this.phaseTo(runaway?'cooling-runaway':overheat?'overheated':!engine?'engine-crippled':left!==right?'track-slew':'advance');
  this.serviceWindow=Math.max(0,this.serviceWindow-dt);
  this.trackedDrive(dt,(engine?1:.3)*(runaway?25:12),+left,+right);
  const gun=this.parts.get('heavy-gun');
  if(!gun.destroyed&&this.serviceWindow<=0&&this.due('heavy',dt,runaway?3.8:overheat?8.5:6.4)){
   const walking=++this.heavySerial%2===0;this.drivePause=1.8;this.tactic(walking?'walking-barrage':'siege-shot');
   for(let i=0;i<(walking?3:1);i++)this.aimed(gun,{...aim,x:aim.x+(aim.vx||0)*i*.35,y:aim.y+(walking?(i-1)*78:0)},{warning:1.7,delay:i*.42,visual:'wusten-impact'});
   if(!walking){const m=this.muzzle(gun);this.hazard('circle',{x:aim.x+(aim.vx||0)*.45,y:aim.y+(aim.vy||0)*.45,radius:38,radiusStart:38,radiusLimit:140,ringSpeed:95,ringWidth:22,innerRadius:16,warning:1.8,duration:1.08,damage:this.t.damage*.6,sourceX:m.x,sourceY:m.y,visual:'maan-sand-ring'});}
   this.heat=clamp(this.heat+.2,0,1);this.command('heavy-gun-fired');
  }
  if(this.due('crossfire',dt,overheat?5.8:3.7))for(const [id,side]of [['sponson-left',-1],['sponson-right',1]]){
   const gun=this.parts.get(id);if(!gun.destroyed&&!p.sandCover){const m=this.muzzle(gun,side),a=Math.atan2(aim.y-m.y,aim.x-m.x)+side*.17;
    this.command('muzzle',{...m,partId:id});this.fan(m.x,m.y,a,4,.36,this.t.bulletSpeed*.82,'wusten-shell');}
  }
  if(this.due('close-defence',dt,2.5)&&!p.sandCover)for(const gun of this.live('mg')){const m=this.muzzle(gun);if(Math.hypot(aim.x-m.x,aim.y-m.y)<360)this.aimed(gun,aim,{count:5,spread:.55,visual:'wusten-mg'});}
  if(this.due('aa-sweep',dt,13)){
   const guns=this.live('mg');if(guns.length&&!p.sandCover){this.tactic('aa-sweep');for(const gun of guns)this.aimed(gun,aim,{count:7,spread:1.05,visual:'wusten-mg'});}
  }
  if((!cooling&&this.due('steam',dt,runaway?2.2:4.8))||(cooling&&this.due('pressure-cycle',dt,18))){
   const r=this.parts.get('radiator'),m={x:this.x+r.x,y:this.y+r.y};this.command('maan-vent',{...m,black:!engine});
   for(const side of [-1,1]){const v=rotateMaan(side*95,0,this.hullYaw);this.hazard('circle',{x:m.x+v.x,y:m.y+v.y,radius:58,warning:1.15,duration:1.6,tickInterval:.5,damage:this.t.damage*.5,visual:'wusten-steam'});}
   this.heat=runaway?1:.4;
   this.serviceWindow=2.6;this.drivePause=2.6;this.tactic('pressure-release');
  }
  if(this.due('ring',dt,runaway?5.5:8.5))this.ring(10,this.t.bulletSpeed*.6,'wusten-mg');
 }
}
export class SinaiLandship extends DesertHull {
 constructor(o){super(o,'sinai-landship');this.side=-1;this.salvo=null;this.escortAge=0;}
 update(dt,ctx){
  if(this.arrival(dt,ctx))return;const p=this.target(ctx.players);if(!p)return;
  const front=['track-front-left','track-front-right'].filter(id=>!this.gone(id)).length,rear=['track-rear-left','track-rear-right'].filter(id=>!this.gone(id)).length;
  const disrupted=this.gone('command'),burning=this.gone('tank'),late=this.hp<this.maxHp*.4;
  const aim=this.aimTarget(p,disrupted);
  this.phaseTo(disrupted?'command-disrupted':late?'escort-pressure':burning?'fuel-fire':front!==rear?'differential-drive':'broadside');
  const left=['track-front-left','track-rear-left'].filter(id=>!this.gone(id)).length/2,right=['track-front-right','track-rear-right'].filter(id=>!this.gone(id)).length/2;
  this.trackedDrive(dt,12.8*(burning?.5:1)*(this.salvo?.35:1),left,right);
  const order=['screen','flank','withdraw'][Math.floor((this.motionTime-this.entryDuration)/8)%3];
  this.escortOrder=disrupted?'flank':order;
  if(this.due('broadside',dt,disrupted?3.8:late?4.5:6.2)){
   this.side=disrupted?(this.rng()<.5?-1:1):-this.side;this.salvo={age:0,index:0,side:this.side,target:{x:aim.x,y:aim.y,vx:aim.vx||0,vy:aim.vy||0}};
   this.command('phase-change',{phase:'broadside-warning'});
  }
  if(this.salvo){const s=this.salvo;s.age+=dt;const side=s.side<0?'left':'right',ids=[`sponson-${side}-front`,`sponson-${side}-rear`];
   while(s.index<4&&s.age>=s.index*.38){const gun=this.parts.get(ids[s.index%2]),i=s.index++;if(!gun.destroyed)this.aimed(gun,{x:s.target.x+(i-1.5)*58,y:s.target.y+i*30,vx:0,vy:0},{side:s.side,warning:1.25,visual:'sinai-impact'});}
   if(s.index>=4)this.salvo=null;
  }
  if(!disrupted&&this.due('corridor-barrage',dt,14)){
   const width=ctx.bounds.right-ctx.bounds.left,offset=Math.min(140,width*.3),radius=Math.min(42,width*.085);
   this.tactic('corridor-barrage');this.drivePause=2.4;
   // The announced escape lane keeps the dashed telegraph drawn by the view.
   this.duneLane={x:aim.x,y:aim.y,width:110,depth:220,remaining:2.2};
   for(const side of [-1,1])for(let row=0;row<3;row++){
    const gun=this.parts.get(`sponson-${side<0?'left':'right'}-${row%2?'rear':'front'}`);if(gun.destroyed)continue;
    const x=clamp(aim.x+side*offset,ctx.bounds.left+radius+12,ctx.bounds.right-radius-12);if(Math.abs(x-aim.x)<radius+60)continue;
    const m=this.muzzle(gun,side);this.command('muzzle',{...m,partId:gun.id});
    this.hazard('circle',{x,y:aim.y+(row-1)*95,radius,warning:1.7,delay:row*.42,once:true,sourceX:m.x,sourceY:m.y,visual:'sinai-impact',tag:'sinai-command'});
   }
  }
  if(this.duneLane)this.duneLane.remaining=Math.max(0,this.duneLane.remaining-dt);
  const mg=this.parts.get('lewis');if(!mg.destroyed&&!p.sandCover&&!disrupted&&this.due('lewis',dt,2.6))this.aimed(mg,aim,{count:3,spread:.22,visual:'sinai-mg'});
  if(this.due('ring',dt,disrupted?6:9))this.ring(10,this.t.bulletSpeed*.58,'sinai-mg');
  if(burning&&this.due('fuel-leak',dt,4.2)){const tank=this.parts.get('tank');this.hazard('circle',{x:this.x+tank.x,y:this.y+tank.y+75,radius:58,warning:.9,duration:2.2,tickInterval:.65,damage:this.t.damage*.5,visual:'sinai-fire'});this.command('maan-vent',{x:this.x+tank.x,y:this.y+tank.y,black:true});}
  // Existing encounter bodies provide cap, targeting, hit routing and cleanup.
  this.escortAge+=dt;
  const cap=late?3:2,live=[...this.encounter.bodies.values()].filter(b=>b.leader===this&&!b.dead);
  if(!this.gone('support')&&live.length<cap&&this.escortAge>=(late?10:18)){
   this.escortAge=0;const slot=this.escortSerial=(this.escortSerial||0)+1;
   const car=new RollsRoyceEscort({id:this.id+':escort:'+slot,leader:this,side:slot%2?-1:1,tuning:this.t,emit:this.emit,faction:this.faction,x:this.x,y:this.y});car.encounter=this.encounter;car.stageReinforcement();this.encounter.bodies.set(car.id,car);
   this.command('maan-escort',{x:car.x,y:car.y});
  }
 }
 onPartDestroyed(p){super.onPartDestroyed(p);if(p.id==='support')this.command('phase-change',{phase:'support-silenced'});if(p.id==='command'){this.command('cancel-hazards',{tag:'sinai-command'});this.duneLane=null;}}
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
  if(this.leader.dead){this.dead=true;this.hp=0;return;}const p=players.find(p=>p.alive);if(!p)return;this.age+=dt;
  if(this.leader.entryAge<this.leader.entryDuration){
   this.hidden=this.leader.entryAge<1.6;this.coreVulnerable=false;
   if(!this.hidden)this.driveTo(dt,this.arrivalTarget,72);return;
  }
  this.hidden=false;this.coreVulnerable=true;
  // Escort orders follow the ground hull, never the moving aircraft camera.
  const b=this.leader,r=maanClearance(b),order=b.escortOrder;
  const target=order==='screen'?maanWorld(b,this.side*95,-r.y-65):order==='withdraw'?maanWorld(b,this.side*100,r.y+100):maanWorld(b,this.side*(r.x+55),Math.sin(this.age*.3)*100);
  this.driveTo(dt,target,42);resolveMaanGround(this.encounter);
  if(this.age>7&&!p.sandCover&&this.due('escort-gun',dt,this.leader.gone('command')?2.3:3.4)){
   const m=rotateMaan(0,-31,this.hullYaw),x=this.x+m.x,y=this.y+m.y,a=Math.atan2(p.y-y,p.x-x);
   this.emit({type:'muzzle',bossId:this.id,x,y});for(const offset of [-.12,0,.12])this.emit({type:'hazard',bossId:this.id,faction:this.faction,kind:'projectile',x,y,vx:Math.cos(a+offset)*this.t.bulletSpeed*.65,vy:Math.sin(a+offset)*this.t.bulletSpeed*.65,radius:4,damage:this.t.damage*.5,warning:0,duration:4,visual:'sinai-mg'});
  }
 }
}

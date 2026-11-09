import {recordShipWake} from './naval-water.js?v=tame3&perf=1029';
import {BaseBoss,BossPart,BossEncounter} from './headon-stageboss-core.js?v=tame3&ai=1018&sig=1019&boss=20261020b&phase=1021&harbor=20261021';
import {segmentDistance} from './alps-geometry117.js?v=tame3';

export const JUTLAND_ENTRY_SECONDS=2.2;
export const JUTLAND_HULL=Object.freeze({width:302,height:1050});
const GUNS=['bow','aft'];
const LANES={
 bow:{side:1,delay:0,interval:.16,radius:58},
 aft:{side:-1,delay:.4,interval:.32,radius:70}
};
const PARTS=[
 {id:'bow',kind:'gun',localY:-270,radius:53,fraction:.16,row:0,size:112},
 {id:'director',kind:'director',localY:-115,radius:48,fraction:.14},
 {id:'aft',kind:'gun',localY:310,radius:53,fraction:.16,row:0,size:112}
];
const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const turnToward=(a,b,max)=>a+Math.max(-max,Math.min(max,angleDelta(a,b)));
export const jutlandRotate=(x,y,a)=>({x:x*Math.cos(a)-y*Math.sin(a),y:x*Math.sin(a)+y*Math.cos(a)});
export function jutlandMuzzle(b,p){
 return {x:b.x+p.x+Math.cos(p.angle)*128,y:b.y+p.y+Math.sin(p.angle)*128};
}

export class JutlandVessel extends BaseBoss{
 constructor({id,x,y,tuning,faction='central',emit}){
  super({id,x,y,maxHp:tuning.maxHp*.78,coreRadius:72,emit,
   parts:PARTS.map(spec=>new BossPart({id:spec.id,maxHp:tuning.maxHp*.78*spec.fraction,radius:spec.radius,kind:spec.kind}))});
  Object.assign(this,JUTLAND_HULL,{t:tuning,faction,role:'battleship',jutlandBoss:true,kind:'jutland-battleship',ownsMotion129:true,ownsLeadAim:true,
   hullYaw:0,anchorX:x,anchorY:y,entryAge:0,driveVelocity:0,attackStep:'approach',attackTime:.85,volleyCount:0});
  for(const spec of PARTS)Object.assign(this.parts.get(spec.id),spec,{localX:0,angle:-Math.PI/2,recoil:0});
  this.updateParts();
 }
 command(type,spec={}){this.emit({...spec,type,bossId:this.id,faction:this.faction});}
 updateParts(){
  for(const p of this.parts.values()){
   Object.assign(p,jutlandRotate(p.localX,p.localY,this.hullYaw));
   if(p.destroyed)p.angle=this.hullYaw+p.wreckHullAngle;
  }
 }
 locateHit(s){
  if(this.entryAge<JUTLAND_ENTRY_SECONDS||this.dead)return null;
  const x0=(s.previousX??s.x)-this.x,y0=(s.previousY??s.y)-this.y,x1=s.x-this.x,y1=s.y-this.y,r=s.radius||0;
  for(const p of this.parts.values())if(!p.destroyed&&segmentDistance(p.x,p.y,x0,y0,x1,y1)<=p.radius+r)return {partId:p.id};
  const a=jutlandRotate(x0,y0,-this.hullYaw),b=jutlandRotate(x1,y1,-this.hullYaw);
  const w=this.width*.47+r,h=this.height*.49+r;
  return segmentDistance(0,0,a.x/w,a.y/h,b.x/w,b.y/h)<=1?{partId:null}:null;
 }
 hitAt(s){
  const hit=this.locateHit(s);
  return hit?this.hit({...hit,damage:s.damage}):{damage:0,miss:true};
 }
 hit(a){
  if(!Number.isFinite(a.damage)||a.damage<0)throw new Error('Invalid damage');
  if(this.entryAge<JUTLAND_ENTRY_SECONDS||this.dead)return {damage:0,blocked:true};
  const result=super.hit(a);
  if(a.partId&&result.damage)this.hp=Math.max(0,this.hp-result.damage);
  if(this.hp<=0)this.finish();
  return {...result,bodyDefeated:this.dead};
 }
 finish(){
  this.hp=0;
  if(!this.dead){this.dead=true;this.phase='defeated';this.command('body-defeated');}
  if(this.deathHandled)return;
  this.deathHandled=true;
  this.pending=null;
  for(const id of GUNS)this.command('cancel-hazards',{tag:this.id+':'+id});
 }
 onPartDestroyed(part){
  part.wreckHullAngle=angleDelta(this.hullYaw,part.angle);
  if(part.id==='director'){
   if(this.attackStep==='disarmed')return;
   for(const id of GUNS)this.command('cancel-hazards',{tag:this.id+':'+id,pendingOnly:true});
   this.reload(4.2,'jutland-director-lost');
   return;
  }
  this.command('cancel-hazards',{tag:this.id+':'+part.id,pendingOnly:true});
  if(GUNS.every(id=>this.parts.get(id).destroyed)){
   this.pending=null;this.attackStep='disarmed';this.hp=Math.min(this.hp,this.maxHp*.14);
   this.command('phase-change',{phase:'jutland-disarmed'});
  }else this.command('phase-change',{phase:'jutland-'+part.id+'-lost'});
 }
 counterWindow(){return this.attackStep==='reload'||this.attackStep==='disarmed'?1.6:super.counterWindow();}
 reload(seconds,phase='jutland-reload'){
  this.pending=null;this.attackStep='reload';this.attackTime=seconds;
  this.command('phase-change',{phase,crescendo:phase==='jutland-reload'&&this.crescendoReload});this.crescendoReload=false;
 }
 hurry(){
  if(this.attackStep==='approach')this.attackTime=Math.min(this.attackTime,.15);
  return 'broadside';
 }
 move(dt){
  const dx=this.anchorX-this.x,dy=this.anchorY-this.y;
  const returning=Math.hypot(dx,dy)>490;
  if(returning&&this.attackStep!=='turn'&&this.attackStep!=='aim')this.hullYaw=turnToward(this.hullYaw,Math.atan2(dy,dx)+Math.PI/2,.43*dt);
  const desired=this.entryAge<JUTLAND_ENTRY_SECONDS?0:returning&&this.pending?0:this.attackStep==='turn'?25:39;
  this.driveVelocity+=Math.max(-20*dt,Math.min(18*dt,desired-this.driveVelocity));
  this.x+=Math.sin(this.hullYaw)*this.driveVelocity*dt;
  this.y-=Math.cos(this.hullYaw)*this.driveVelocity*dt;
  this.updateParts();
  if(this.driveVelocity>1)recordShipWake(this,dt,this.height);
 }
 beginBroadside(target){
  const bearing=Math.atan2(target.y-this.y,target.x-this.x);
  const left=bearing-Math.PI/2,right=bearing+Math.PI/2;
  const yaw=Math.abs(angleDelta(this.hullYaw,left))<Math.abs(angleDelta(this.hullYaw,right))?left:right;
  this.pending={targetId:target.id,yaw};
  this.attackStep='turn';this.attackTime=.95;
  this.command('phase-change',{phase:'jutland-broadside-turn'});
 }
 lockBroadside(target){
  const coordinated=!this.parts.get('director').destroyed,last=this.hp<=this.maxHp*.33;
  const live=GUNS.filter(id=>!this.parts.get(id).destroyed);
  const guns=coordinated?live:[live[this.volleyCount%live.length]];
  const heading=jutlandRotate(0,-1,this.hullYaw);
  const lead=coordinated?(last?2.2:2.45):.75;
  const vx=target.vx||0,vy=target.vy||0,leadTime=Math.min(lead,540/(Math.hypot(vx,vy)||1));
  const x=target.x+vx*leadTime,y=target.y+vy*leadTime;
  const bias=this.volleyCount%2?48:-48,separation=last?126:102;
  const lanes=guns.map(id=>{
   const offset=LANES[id].side*separation+bias;
   return {id,x:x+heading.x*offset,y:y+heading.y*offset};
  });
  const crescendo=coordinated&&this.volleyCount%3===1;
  this.pending={lanes,heading,coordinated,last,crescendo};
  this.attackStep='aim';this.attackTime=crescendo?1.2:.85;
  this.command('phase-change',{phase:'jutland-aim-locked'});
 }
 layGuns(dt){
  let aligned=true;
  for(const {id,x,y} of this.pending.lanes){
   const p=this.parts.get(id);if(p.destroyed)continue;
   const aim=Math.atan2(y-this.y-p.y,x-this.x-p.x);
   p.angle=turnToward(p.angle,aim,4.4*dt);
   aligned&&=Math.abs(angleDelta(p.angle,aim))<.09;
  }
  return aligned;
 }
 fireBroadside(){
  const {lanes,coordinated,last,crescendo}=this.pending;
  const armed=lanes.filter(lane=>!this.parts.get(lane.id).destroyed);
  if(!armed.length){this.reload(2.2);return;}
  const slots=last&&coordinated?3:2,rounds=slots*(crescendo?3:1),warning=crescendo?2.15:coordinated?(last?1.6:1.8):2.1;
  const lastImpact=Math.max(...armed.map(({id})=>coordinated?LANES[id].delay+(rounds-1)*LANES[id].interval:.3));
  this.pending={...this.pending,lanes:armed,rounds,slots,warning,elapsed:0};
  this.attackStep='fall';this.attackTime=warning+lastImpact+.34;
  this.crescendoReload=crescendo;
  this.volleyCount++;
  this.command('phase-change',{phase:coordinated?(last?'jutland-last-salvo':'jutland-broadside-fire'):'jutland-blind-salvo',crescendo});
  this.fireReadyLanes();
 }
 fireReadyLanes(){
  const {lanes,heading,coordinated,last,rounds,slots,warning,elapsed}=this.pending;
  for(const lane of lanes){
   const spec=LANES[lane.id],p=this.parts.get(lane.id);
   if(lane.fired||p.destroyed||coordinated&&elapsed+1e-8<spec.delay)continue;
   lane.fired=true;
   const m=jutlandMuzzle(this,p);p.recoil=.22;
   this.command('muzzle',{...m,partId:p.id});
   for(let i=0;i<rounds;i++){
    // Three ripples reuse the locked impact slots; the escape lane never shrinks.
    const offset=(i%slots-(slots-1)/2)*52,heavy=coordinated&&i===rounds-1;
    const delay=i*(coordinated?spec.interval:.3);
    this.command('hazard',{kind:'circle',visual:'jutland-shell',x:lane.x+heading.x*offset,y:lane.y+heading.y*offset,
     sourceX:m.x,sourceY:m.y,sourcePartId:p.id,tag:this.id+':'+p.id,once:true,warning,delay,
     duration:.23,radius:heavy?spec.radius+(last?10:0):43,damage:this.t.damage*(coordinated?1:.7),raidHeavy:heavy});
   }
  }
  if(lanes.every(lane=>lane.fired||this.parts.get(lane.id).destroyed))this.pending=null;
 }
 update(dt,{players=[]}){
  this.entryAge=Math.min(JUTLAND_ENTRY_SECONDS,this.entryAge+dt);
  for(const p of this.parts.values())p.recoil=Math.max(0,p.recoil-dt);
  if(this.attackStep==='turn')this.hullYaw=turnToward(this.hullYaw,this.pending.yaw,.58*dt);
  this.move(dt);
  if(this.entryAge<JUTLAND_ENTRY_SECONDS||this.attackStep==='disarmed')return;
  this.attackTime-=dt;
  if(this.attackStep==='fall'){
   if(this.pending){this.pending.elapsed+=dt;this.fireReadyLanes();}
   if(this.attackTime<=0)this.reload(3.6);
   return;
  }
  if(this.attackStep==='aim'){
   const aligned=this.layGuns(dt);
   if(this.attackTime<=0&&aligned)this.fireBroadside();
   return;
  }
  if(this.attackTime>0)return;
  const live=players.filter(p=>p.alive),target=live.find(p=>p.id===this.pending?.targetId)||live[this.volleyCount%live.length];
  if(!target){if(this.pending)this.reload(.8);return;}
  if(this.attackStep==='turn'){
   if(Math.abs(angleDelta(this.hullYaw,this.pending.yaw))>.05)return;
   this.lockBroadside(target);
  }else this.beginBroadside(target);
 }
}

export function createJutlandEncounter(o){
 const flagship=new JutlandVessel({...o,id:o.id+':0'});
 return new BossEncounter({id:o.id,bossId:o.bossId,bodies:[flagship]});
}


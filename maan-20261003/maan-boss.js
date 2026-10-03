import {BaseBoss,BossPart} from './headon-stageboss-core.js?v=338&b=326';
import {MAAN_LAYOUT,rotateMaan,segmentBox} from './maan-layout.js?v=maan20261003';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
class DesertHull extends BaseBoss {
 constructor(o,kind){
  const layout=MAAN_LAYOUT[kind],parts=layout.parts.map(([id,x,y,rx,ry,type])=>new BossPart({id,x,y,radius:Math.min(rx,ry),kind:type,maxHp:o.tuning.partHp*(type==='track'?1.2:type==='cooling'||type==='command'?1.6:1)}));
  super({...o,maxHp:o.tuning.maxHp,coreRadius:layout.width*.4,parts});
  Object.assign(this,{kind,faction:o.faction,t:o.tuning,rng:o.rng||Math.random,layout,ownsMotion129:true,hullYaw:0,entryAge:0,entryDuration:7,entryOrigin:{x:o.x,y:o.y},phase:'arrival',coreVulnerable:false});
  this.parts.forEach(p=>{const row=layout.parts.find(r=>r[0]===p.id);Object.assign(p,{localX:p.x,localY:p.y,rx:row[3],ry:row[4],hittable:false});});
 }
 command(type,spec={}){this.emit({...spec,type,bossId:this.id,faction:this.faction});}
 hazard(kind,spec){this.command('hazard',{kind,damage:this.t.damage,warning:kind==='projectile'?0:1.15,duration:kind==='projectile'?5:.4,...spec});}
 fan(x,y,a,count,spread,speed=this.t.bulletSpeed,visual='wusten-shell'){for(let i=0;i<count;i++){const angle=a+(count===1?0:i/(count-1)-.5)*spread;this.hazard('projectile',{x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,radius:5,visual});}}
 target(players){return players.find(p=>p.alive);}
 gone(id){return this.parts.get(id)?.destroyed;}
 live(type){return [...this.parts.values()].filter(p=>!p.destroyed&&p.kind===type);}
 phaseTo(phase){if(this.phase!==phase){this.phase=phase;this.command('phase-change',{phase});}}
 syncParts(){for(const p of this.parts.values()){const r=rotateMaan(p.localX,p.localY,this.hullYaw);p.x=r.x;p.y=r.y;}}
 muzzle(p,side=0){const r=rotateMaan(p.localX+side*(p.rx+(this.kind==='sinai-landship'?4:13)),p.localY+(side?0:-p.ry-9),this.hullYaw);return{x:this.x+r.x,y:this.y+r.y};}
 arrival(dt,{bounds,players}){
  if(this.entryAge>=this.entryDuration)return false;
  const previous=this.entryAge;this.entryAge=Math.min(this.entryDuration,this.entryAge+dt);
  if(previous===0)this.command('maan-entry',{stage:'alarm',x:this.x,y:this.y});
  if(previous<2&&this.entryAge>=2)this.command('maan-entry',{stage:'ignition',x:this.x,y:this.y});
  if(previous<4&&this.entryAge>=4)this.command('maan-entry',{stage:'doors',x:this.x,y:this.y});
  if(!this.entryAnchor)this.entryAnchor={x:this.x,y:this.y};
  const p=this.target(players),targetX=(bounds.left+bounds.right)/2,targetY=p?clamp(p.y-230,bounds.top+this.layout.height*.32,bounds.bottom-180):(bounds.top+bounds.bottom)/2-100;
  this.entryTarget??={x:targetX,y:targetY};
  const progress=clamp((this.entryAge-2)/5,0,1),smooth=progress*progress*(3-2*progress);
  this.x=this.entryAnchor.x+(this.entryTarget.x-this.entryAnchor.x)*smooth;this.y=this.entryAnchor.y+(this.entryTarget.y-this.entryAnchor.y)*smooth;
  if(this.entryAge>=this.entryDuration){this.coreVulnerable=true;for(const part of this.parts.values())part.hittable=true;this.phaseTo('advance');this.command('maan-entry',{stage:'engaged',x:this.x,y:this.y});}
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
  const r=super.hit(s.partId?s:{...s,damage:s.damage*(this.breached?1:.32)});
  if(this.dead)for(const car of this.encounter?.bodies.values()||[])if(car.leader===this){car.dead=true;car.hp=0;}
  return r;
 }
 onPartDestroyed(p){
  // Parts remain attached; the renderer swaps authored plate/track regions.
  this.command('maan-damage',{partId:p.id,x:this.x+p.x,y:this.y+p.y,material:p.kind});
  this.breached=this.live('gun').length<=1||this.live('track').length<=1||this.gone(this.kind==='wustenpanzer'?'radiator':'command');
 }
 boundsDrive(dt,bounds,speed,yaw){
  this.arenaBounds??={...bounds};bounds=this.arenaBounds;this.driveSign??=1;
  this.hullYaw+=clamp(yaw-this.hullYaw,-.12*dt,.12*dt);this.driveVelocity=speed;
  this.x+=Math.sin(this.hullYaw)*speed*dt;this.y+=Math.cos(this.hullYaw)*speed*dt*this.driveSign;
  // Keep the moving fort in the playable camera corridor. No off-screen orbit.
  const marginX=Math.min(this.layout.width*.43,(bounds.right-bounds.left)*.3),marginY=Math.min(this.layout.height*.25,(bounds.bottom-bounds.top)*.28);
  if(this.y>bounds.bottom-marginY)this.driveSign=-1;else if(this.y<bounds.top+marginY)this.driveSign=1;
  this.x=clamp(this.x,bounds.left+marginX,bounds.right-marginX);this.y=clamp(this.y,bounds.top+marginY,bounds.bottom-marginY);this.syncParts();
 }
 aimed(p,target,{side=0,count=3,spread=.25,visual,warning=0,delay=0}={}){
  const m=this.muzzle(p,side),a=Math.atan2(target.y-m.y,target.x-m.x);this.command('muzzle',{...m,partId:p.id});
  if(warning)this.hazard('circle',{x:target.x+(target.vx||0)*.45,y:target.y+(target.vy||0)*.45,radius:44,warning,delay,once:true,sourceX:m.x,sourceY:m.y,visual:visual||'wusten-impact',damage:this.t.damage*1.6});
  else this.fan(m.x,m.y,a,count,spread,this.t.bulletSpeed,visual);
 }
}
export class Wustenpanzer extends DesertHull {
 constructor(o){super(o,'wustenpanzer');this.heat=0;this.ventAge=0;}
 update(dt,ctx){
  if(this.arrival(dt,ctx))return;const p=this.target(ctx.players);if(!p)return;
  const cooling=!this.gone('radiator'),engine=!this.gone('engine'),left=!this.gone('track-left'),right=!this.gone('track-right');
  this.heat=clamp(this.heat+dt*(cooling?-.13:.19)+(this.hp<this.maxHp*.3?dt*.12:0),0,1);
  const runaway=!cooling&&this.hp<this.maxHp*.3,overheat=this.heat>.72;
  this.phaseTo(runaway?'cooling-runaway':overheat?'overheated':!engine?'engine-crippled':left!==right?'track-slew':'advance');
  const yaw=left!==right?(left?.48:-.48):Math.sin(this.motionTime*.08)*.16;
  const halt=Math.floor(this.motionTime/10)%2===1,speed=!(left||right)?0:(engine?1:.3)*(runaway?25:halt?0:12);
  this.boundsDrive(dt,ctx.bounds,speed,yaw);
  const gun=this.parts.get('heavy-gun');
  if(!gun.destroyed&&this.due('heavy',dt,runaway?3.8:overheat?8.5:6.4)){
   this.aimed(gun,p,{warning:1.7,visual:'wusten-impact'});this.heat=clamp(this.heat+.2,0,1);this.command('heavy-gun-fired');
  }
  if(this.due('crossfire',dt,overheat?5.8:3.7))for(const [id,side]of [['sponson-left',-1],['sponson-right',1]]){
   const gun=this.parts.get(id);if(!gun.destroyed){const m=this.muzzle(gun,side),a=Math.atan2(p.y-m.y,p.x-m.x)+side*.17;
    this.command('muzzle',{...m,partId:id});this.fan(m.x,m.y,a,4,.36,this.t.bulletSpeed*.82,'wusten-shell');}
  }
  if(this.due('close-defence',dt,2.5))for(const gun of this.live('mg')){const m=this.muzzle(gun);if(Math.hypot(p.x-m.x,p.y-m.y)<360)this.aimed(gun,p,{count:5,spread:.55,visual:'wusten-mg'});}
  if(!cooling&&this.due('steam',dt,runaway?2.2:4.8)){
   const r=this.parts.get('radiator'),m={x:this.x+r.x,y:this.y+r.y};this.command('maan-vent',{...m,black:!engine});
   for(const side of [-1,1]){const v=rotateMaan(side*95,0,this.hullYaw);this.hazard('circle',{x:m.x+v.x,y:m.y+v.y,radius:58,warning:1.15,duration:1.6,tickInterval:.5,damage:this.t.damage*.5,visual:'wusten-steam'});}
   this.heat=runaway?1:.4;
  }
 }
}
export class SinaiLandship extends DesertHull {
 constructor(o){super(o,'sinai-landship');this.side=-1;this.salvo=null;this.escortAge=0;}
 update(dt,ctx){
  if(this.arrival(dt,ctx))return;const p=this.target(ctx.players);if(!p)return;
  const front=['track-front-left','track-front-right'].filter(id=>!this.gone(id)).length,rear=['track-rear-left','track-rear-right'].filter(id=>!this.gone(id)).length;
  const disrupted=this.gone('command'),burning=this.gone('tank'),late=this.hp<this.maxHp*.4;
  this.phaseTo(disrupted?'command-disrupted':late?'escort-pressure':burning?'fuel-fire':front!==rear?'differential-drive':'broadside');
  const yaw=front!==rear?clamp((rear-front)*.26,-.52,.52):this.side*.48;
  this.boundsDrive(dt,ctx.bounds,(front+rear)*3.2*(burning?.5:1)*(this.salvo?.35:1),yaw);
  if(this.due('broadside',dt,disrupted?3.8:late?4.5:6.2)){
   this.side=disrupted?(this.rng()<.5?-1:1):-this.side;this.salvo={age:0,index:0,side:this.side,target:{x:p.x,y:p.y,vx:p.vx||0,vy:p.vy||0}};
   this.command('phase-change',{phase:'broadside-warning'});
  }
  if(this.salvo){const s=this.salvo;s.age+=dt;const side=s.side<0?'left':'right',ids=[`sponson-${side}-front`,`sponson-${side}-rear`];
   while(s.index<4&&s.age>=s.index*.38){const gun=this.parts.get(ids[s.index%2]),i=s.index++;if(!gun.destroyed)this.aimed(gun,{...s.target,x:s.target.x+(i-1.5)*58,y:s.target.y+i*30},{side:s.side,warning:1.25,visual:'sinai-impact'});}
   if(s.index>=4)this.salvo=null;
  }
  const mg=this.parts.get('lewis');if(!mg.destroyed&&this.due('lewis',dt,2.6))this.aimed(mg,p,{count:3,spread:.22,visual:'sinai-mg'});
  if(burning&&this.due('fuel-leak',dt,4.2)){const tank=this.parts.get('tank');this.hazard('circle',{x:this.x+tank.x,y:this.y+tank.y+75,radius:58,warning:.9,duration:2.2,tickInterval:.65,damage:this.t.damage*.5,visual:'sinai-fire'});this.command('maan-vent',{x:this.x+tank.x,y:this.y+tank.y,black:true});}
  // Existing encounter bodies provide cap, targeting, hit routing and cleanup.
  this.escortAge+=dt;
  const cap=late?3:2,live=[...this.encounter.bodies.values()].filter(b=>b.leader===this&&!b.dead);
  if(!this.gone('support')&&live.length<cap&&this.escortAge>=(late?10:18)){
   this.escortAge=0;const slot=this.escortSerial=(this.escortSerial||0)+1;
   const car=new RollsRoyceEscort({id:this.id+':escort:'+slot,leader:this,side:slot%2?-1:1,tuning:this.t,emit:this.emit,faction:this.faction,x:this.x,y:this.y+165});car.entryAge=7;this.encounter.bodies.set(car.id,car);car.encounter=this.encounter;
   this.command('maan-escort',{x:car.x,y:car.y});
  }
 }
 onPartDestroyed(p){super.onPartDestroyed(p);if(p.id==='support')this.command('phase-change',{phase:'support-silenced'});}
}
export class RollsRoyceEscort extends BaseBoss {
 constructor({leader,side,tuning,...o}){super({...o,maxHp:tuning.partHp*.7,coreRadius:23});Object.assign(this,{kind:'maan-rolls-royce',leader,side,t:tuning,faction:o.faction,ownsMotion129:true,hullYaw:0,age:0});}
 locateHit(s){const a=rotateMaan((s.previousX??s.x)-this.x,(s.previousY??s.y)-this.y,-this.hullYaw),b=rotateMaan(s.x-this.x,s.y-this.y,-this.hullYaw);return !this.dead&&segmentBox(a.x,a.y,b.x,b.y,0,0,19,35,s.radius||0)?{partId:null}:null;}
 update(dt,{players,bounds}){
  if(this.leader.dead){this.dead=true;this.hp=0;return;}const p=players.find(p=>p.alive);if(!p)return;this.age+=dt;
  const tx=clamp(p.x+this.side*190,bounds.left+40,bounds.right-40),ty=clamp(p.y+Math.sin(this.age*.6)*90,bounds.top+50,bounds.bottom-50),dx=tx-this.x,dy=ty-this.y,d=Math.hypot(dx,dy),speed=42;
  if(d>12){this.x+=dx/d*Math.min(d,speed*dt);this.y+=dy/d*Math.min(d,speed*dt);this.hullYaw=Math.atan2(dy,dx)+Math.PI/2;}
  if(this.age>7&&this.due('escort-gun',dt,this.leader.gone('command')?2.3:3.4)){
   const m=rotateMaan(0,-31,this.hullYaw),x=this.x+m.x,y=this.y+m.y,a=Math.atan2(p.y-y,p.x-x);
   this.emit({type:'muzzle',bossId:this.id,x,y});for(const offset of [-.12,0,.12])this.emit({type:'hazard',bossId:this.id,faction:this.faction,kind:'projectile',x,y,vx:Math.cos(a+offset)*this.t.bulletSpeed*.65,vy:Math.sin(a+offset)*this.t.bulletSpeed*.65,radius:4,damage:this.t.damage*.5,warning:0,duration:4,visual:'sinai-mg'});
  }
 }
}

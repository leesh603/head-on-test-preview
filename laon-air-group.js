import {LAON_MISSION} from './laon-layout.js?v=b3bf991d11fc7798';
import {BaseBoss,BossPart} from './headon-stageboss-core.js?v=b3bf991d11fc7798';
import {sweptLaonEllipse} from './laon-layout.js?v=b3bf991d11fc7798';

export const FRENCH_AIR_GROUP=Object.freeze([
 {id:'observer',role:'observer',aircraft:'salmson_2a2',hp:.17,at:0,side:-1,radius:22},
 {id:'bomber-leader',role:'bomber',aircraft:'breguet14',hp:.22,at:6,side:1,radius:28},
 {id:'bomber-left',role:'bomber',aircraft:'breguet14',hp:.19,at:10,side:-1,radius:28},
 {id:'bomber-right',role:'bomber',aircraft:'breguet14',hp:.19,at:14,side:1,radius:28},
 {id:'escort-left',role:'escort',aircraft:'caudron_r11',hp:.115,at:5,side:-1,radius:27},
 {id:'escort-right',role:'escort',aircraft:'caudron_r11',hp:.115,at:9,side:1,radius:27}
].map(Object.freeze));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const alive=p=>!p.destroyed&&p.mode!=='pending';
const lerp=(a,b,t)=>a+(b-a)*t;

// One finite encounter with destructible, spatially present aircraft. Planes
// are boss parts so existing projectile/area routes hit exactly their sprite;
// no unrelated ace or normal enemy object is substituted or respawned.
export class FrenchCounterBatteryAirGroup extends BaseBoss {
 constructor(o){
  const t=o.tuning||{},maxHp=t.maxHp||o.maxHp||1000,scale=t.geometryScale||1;
  super({...o,maxHp,coreRadius:0,parts:FRENCH_AIR_GROUP.map(p=>new BossPart({...p,maxHp:maxHp*p.hp,hittable:false,radius:p.radius*scale}))});
  Object.assign(this,{kind:'french-counter-battery',faction:'entente',t,scale,ownsMotion129:true,coreVulnerable:true,gun:o.gun||null,
   clock:0,phase:'reconnaissance',planes:[...this.parts.values()],bombs:[],strikes:[],counterClock:14,ordnanceClock:0,serial:0,finalAttack:false});
  this.planes.forEach((p,i)=>Object.assign(p,FRENCH_AIR_GROUP[i],{hp:p.maxHp,radius:FRENCH_AIR_GROUP[i].radius*scale,mode:'pending',runs:0,angle:Math.PI/2,x:FRENCH_AIR_GROUP[i].side*560,y:-850-i*45,fireClock:2+i*.4,finalRun:false}));
 }
 hpFloor(){return 0;}
 partFloor(){return 0;}
 hurry(){return null;}
 suppressive(){}
 command(type,detail={}){this.emit({...detail,type,bossId:this.id,faction:this.faction});}
 setGun(gun){this.gun=gun;return this;}
 targetGun(){return this.gun||{x:this.x,y:this.y,scale:1,shotCount:0,parts:new Map()};}
 living(role=null,activeOnly=false){return this.planes.filter(p=>!p.destroyed&&(!role||p.role===role)&&(!activeOnly||p.mode!=='pending'));}
 forceStatus(){return Object.fromEntries(['bomber','escort','observer'].map(role=>[role,{alive:this.living(role).length,total:FRENCH_AIR_GROUP.filter(p=>p.role===role).length}]));}
 activeCount(){return this.living(null,true).length;}
 point(p){return{x:this.x+p.x,y:this.y+p.y};}
 activate(p,ctx){
  const gun=this.targetGun(),s=gun.scale||1,b=ctx.bounds;
  let x=gun.x+p.side*560*s,y=gun.y-(850+this.planes.indexOf(p)*45)*s;
  if(b&&x>b.left-80&&x<b.right+80&&y>b.top-80&&y<b.bottom+80)x=p.side<0?b.left-100:b.right+100;
  p.x=x-this.x;p.y=y-this.y;p.hittable=true;p.mode=p.role==='bomber'?'approach':'inbound';
  p.speed=(p.role==='observer'?115:p.role==='bomber'?138:168)*s;
  if(p.role==='bomber'){p.finalRun=this.finalAttack;this.planRun(p);}else p.destination={x:gun.x+p.side*250*s,y:gun.y-170*s};
  p.angle=Math.atan2(p.destination.y-y,p.destination.x-x);
  this.command('laon-air-arrival',{partId:p.id,role:p.role,aircraft:p.aircraft,...this.point(p),targetX:p.destination.x,targetY:p.destination.y});
 }
 chooseTarget(p){
  const gun=this.targetGun(),ids=['breech','loader','ammo','recoil'],rotation=(p.runs+this.planes.indexOf(p))%ids.length;
  for(let i=0;i<ids.length;i++){const part=gun.parts.get(ids[(rotation+i)%ids.length]);if(part&&!part.destroyed)return{x:gun.x+part.x,y:gun.y+part.y,partId:part.id};}
  return{x:gun.x,y:gun.y,partId:'breech'};
 }
 planRun(p){
  p.destination=this.chooseTarget(p);p.mode='approach';p.released=false;
  this.command('laon-air-route',{partId:p.id,...this.point(p),targetX:p.destination.x,targetY:p.destination.y,final:p.finalRun});
 }
 move(p,target,dt,speed=p.speed){
  const q=this.point(p),dx=target.x-q.x,dy=target.y-q.y,d=Math.hypot(dx,dy);
  if(!(dt>0)||d<1e-6)return d;
  const turn=p.role==='bomber'?.9:p.role==='escort'?1.8:1.2,want=Math.atan2(dy,dx),delta=Math.atan2(Math.sin(want-p.angle),Math.cos(want-p.angle));
  const native=clamp(delta/dt,-turn,turn),pace=Math.min(speed,Math.max(18*this.scale,d*turn*.48));
  const peers=this.planes.filter(other=>other!==p&&!other.destroyed&&other.mode!=='pending'&&Math.hypot(other.x-p.x,other.y-p.y)<(speed+(other.speed||0))*3+120*this.scale);
  const pose=(plane,rate,v,t)=>Math.abs(rate)<.001?{x:plane.x+Math.cos(plane.angle)*v*t,y:plane.y+Math.sin(plane.angle)*v*t}:{x:plane.x+(Math.sin(plane.angle+rate*t)-Math.sin(plane.angle))*v/rate,y:plane.y+(Math.cos(plane.angle)-Math.cos(plane.angle+rate*t))*v/rate};
  const times=[.15,.35,.6,.9,1.25,1.6,2,2.5,3];
  const forecasts=peers.map(other=>({other,points:times.map(t=>pose(other,other.flightTurn||0,other.flightSpeed??other.speed??0,t))}));
  let rate=native,velocity=pace,best=Infinity,safeChoice=false;
  // Both destinations and the approach arcs need separation. Predict the same
  // finite-turn forward flight used below; reserve the chosen rate for peers.
  for(const v of [pace,pace*.65,Math.min(pace,18*this.scale)])for(const r of [native,-turn,-turn*.5,0,turn*.5,turn]){
   let minimum=Infinity,penalty=0;
   for(let i=0;i<times.length;i++){const at=pose(p,r,v,times[i]);for(const f of forecasts){const gap=Math.hypot(at.x-f.points[i].x,at.y-f.points[i].y)-p.radius-f.other.radius-16*this.scale;minimum=Math.min(minimum,gap);if(gap<0)penalty+=100000+gap*gap*200;}}
   const safe=minimum>=0,score=penalty+(r-native)**2*80+(r-(p.flightTurn||0))**2*8+(v-pace)**2*.04;
   if(safe&&!safeChoice||safe===safeChoice&&score<best){best=score;safeChoice=safe;rate=r;velocity=v;}
  }
  p.flightTurn=rate;p.flightSpeed=velocity;p.angle+=rate*dt;
  const step=Math.min(d,velocity*dt);p.x+=Math.cos(p.angle)*step;p.y+=Math.sin(p.angle)*step;
  return Math.hypot(target.x-this.x-p.x,target.y-this.y-p.y);
 }
 releaseBomb(p){
  const start=this.point(p),target={...p.destination},gun=this.targetGun(),damage=(gun.maxHp||1000)*(p.finalRun?.135:.105),s=gun.scale||1;
  const bomb={id:this.id+':bomb:'+(++this.serial),sourcePartId:p.id,x:start.x,y:start.y,startX:start.x,startY:start.y,targetX:target.x,targetY:target.y,
   targetPartId:target.partId,age:0,duration:1.35,radius:38*s,damage,final:!!p.finalRun};
  this.bombs.push(bomb);p.released=true;p.runs++;p.mode='egress';const slot=p.id==='bomber-left'?-1:p.id==='bomber-right'?1:0;p.destination={x:gun.x+(p.side*(520+p.runs*35)+slot*110)*s,y:gun.y+(700+slot*90)*s};
  this.command('laon-bomb-release',{...bomb,aircraft:p.aircraft});
 }
 scheduleCounterBattery(){
  const gun=this.targetGun(),observed=this.living('observer',true).length>0,s=gun.scale||1;
  // An unobserved battery keeps firing at a dispersed old fix. Destroying
  // observation reduces both rate and accuracy rather than cancelling history.
  const part=gun.parts.get(['breech','ammo','loader'][this.serial%3]),base=part?{x:gun.x+part.x,y:gun.y+part.y}:{x:gun.x,y:gun.y};
  const a=this.serial*2.3999632297+1.2,spread=observed?16:165;
  const x=base.x+Math.cos(a)*spread*s,y=base.y+Math.sin(a)*spread*s;
  const strike={id:this.id+':battery:'+(++this.serial),x,y,age:0,duration:observed?2.6:3.5,radius:observed?45*s:38*s,damage:(gun.maxHp||1000)*(observed?.13:.065),observed};
  this.strikes.push(strike);this.counterClock=observed?13:30;
  this.command('laon-counterbattery-warning',{...strike});
 }
 updateOrdnance(dt){
  if(this.missionResolved||!(dt>0)||!Number.isFinite(dt))return;
  this.ordnanceClock+=dt;
  for(const bomb of this.bombs){
   const remaining=Math.max(0,bomb.duration-bomb.age);bomb.age=Math.min(bomb.duration,bomb.age+dt);const q=bomb.age/bomb.duration;
   bomb.x=lerp(bomb.startX,bomb.targetX,q);bomb.y=lerp(bomb.startY,bomb.targetY,q);bomb.height=Math.sin(q*Math.PI)*18;
   if(dt+1e-8>=remaining&&!bomb.impacted){bomb.impacted=true;const hits=this.gun?.takeObjectiveDamage?.({x:bomb.targetX,y:bomb.targetY,radius:bomb.radius,damage:bomb.damage})||[];
    this.command('laon-bomb-impact',{...bomb,x:bomb.targetX,y:bomb.targetY,hits});}
  }
  this.bombs=this.bombs.filter(b=>!b.impacted);
  for(const strike of this.strikes){strike.age+=dt;if(strike.age+1e-8>=strike.duration&&!strike.impacted){strike.impacted=true;const hits=this.gun?.takeObjectiveDamage?.(strike)||[];this.command('laon-counterbattery-impact',{...strike,hits});}}
  this.strikes=this.strikes.filter(s=>!s.impacted);
 }
 coverBomber(p,dt,ctx){
  const s=this.scale,q=this.point(p),players=(ctx.players||[]).filter(t=>t.alive);
  // A threatened attacking bomber gets a real escort interception. With no
  // nearby threat, cover its flank instead of circling the gun independently.
  const bombers=this.living('bomber',true).filter(b=>b.mode==='approach'||b.mode==='egress');
  const candidates=bombers.map(b=>{const point=this.point(b);const threat=players.filter(t=>Math.hypot(t.x-point.x,t.y-point.y)<500*s).sort((a,b)=>Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y))[0];return{b,point,threat};});
  candidates.sort((a,b)=>Number(!!b.threat)-Number(!!a.threat)||Math.hypot(a.point.x-q.x,a.point.y-q.y)-Math.hypot(b.point.x-q.x,b.point.y-q.y));
  const cover=candidates[0];if(!cover){p.protectedId=null;p.coverTarget=null;return false;}
  p.protectedId=cover.b.id;p.coverTarget=cover.threat?{x:cover.threat.x,y:cover.threat.y,alive:true}:null;
  const dx=cover.threat?cover.threat.x-cover.point.x:0,dy=cover.threat?cover.threat.y-cover.point.y:-1,length=Math.hypot(dx,dy)||1;
  // Retain the two flank slots during interception too. Sharing the same
  // threatened midpoint made both living escorts merge into one sprite.
  const target=cover.threat?{x:cover.point.x+dx*.65-dy/length*p.side*110*s,y:cover.point.y+dy*.65+dx/length*p.side*110*s}:{x:cover.point.x+p.side*95*s,y:cover.point.y-65*s};
  this.move(p,target,dt,p.speed);this.fireEscort(p,dt,ctx);return true;
 }
 fireEscort(p,dt,ctx){
  p.fireClock-=dt;if(p.fireClock>0)return;
  const q=this.point(p),targets=(ctx.players||[]).filter(t=>t.alive);if(!targets.length)return;
  const target=p.coverTarget||targets.reduce((a,b)=>Math.hypot(a.x-q.x,a.y-q.y)<Math.hypot(b.x-q.x,b.y-q.y)?a:b);
  if(Math.hypot(target.x-q.x,target.y-q.y)>570*this.scale)return;
  const finalCover=this.finalAttack&&p.role==='escort';
  p.fireClock=p.role==='escort'?(finalCover?3.6:2.8):4.8;p.flash=.12;
  const a=Math.atan2(target.y-q.y,target.x-q.x),speed=this.t.bulletSpeed||220;
  this.command('muzzle',{...q,partId:p.id});
  // Only the final bombing pass earns a two-row escort burst. The ordinary
  // cadence and finite roster stay intact, and a lost escort removes both rows.
  for(let row=0;row<(finalCover?2:1);row++)for(const turn of p.role==='escort'?[-.13,0,.13]:[0])this.command('hazard',{kind:'projectile',...q,vx:Math.cos(a+turn)*speed,vy:Math.sin(a+turn)*speed,radius:3,warning:finalCover?.7:.35,delay:row*.34,duration:2.8,
   damage:(this.t.damage||18)*(p.role==='escort'?.55:.35),visual:'staaken-mg',sourcePartId:p.id,tag:this.id+':'+p.id});
 }
 update(dt,ctx={}){
  if(this.missionResolved||ctx.paused||!(dt>0)||!Number.isFinite(dt))return;
  this.updateOrdnance(dt);if(this.dead)return;
  this.clock+=dt;const gun=this.targetGun(),s=gun.scale||1;
  if(gun.dead)return;
  const cap=clamp(Math.floor(ctx.laonAvailableSlots??6),0,6);
  for(const p of this.planes)if(!p.destroyed&&p.mode==='pending'&&this.clock>=p.at&&this.activeCount()<cap)this.activate(p,ctx);
  if(!this.finalAttack&&(gun.shotCount||0)>=LAON_MISSION.shots-1){this.finalAttack=true;this.phase='final-attack';for(const p of this.living('bomber',true)){p.finalRun=true;if(p.mode==='regroup')this.planRun(p);}this.command('laon-final-air-attack',{remainingBombers:this.living('bomber').length});}
  else if(!this.finalAttack&&this.living('bomber',true).length)this.phase='bombing-runs';
  for(const p of this.planes){
   if(!alive(p))continue;p.flash=Math.max(0,(p.flash||0)-dt);
   if(p.role==='bomber'){
    if(p.mode==='approach'){const distance=this.move(p,p.destination,dt);if(distance<65*s&&!p.released)this.releaseBomb(p);}
    else if(p.mode==='egress'){if(this.move(p,p.destination,dt)<5*s){p.mode='regroup';p.regroupAge=0;const slot=p.id==='bomber-left'?-1:p.id==='bomber-right'?1:0;p.destination={x:gun.x+(-p.side*520+slot*120)*s,y:gun.y-(650+slot*85)*s};}}
    else if(p.mode==='regroup'){
     p.regroupAge+=dt;const distance=this.move(p,p.destination,dt);
     if(distance<8*s&&p.regroupAge>4&&(p.runs<3||p.finalRun&&!p.finalRunCompleted)){if(p.finalRun)p.finalRunCompleted=true;p.side*=-1;this.planRun(p);}
    }
   }else if(p.mode==='inbound'){
    if(this.move(p,p.destination,dt)<12*s){p.mode='orbit';p.orbitAngle=Math.atan2(this.point(p).y-gun.y,this.point(p).x-gun.x);}
   }else{
    if(p.role==='escort'&&this.coverBomber(p,dt,ctx))continue;
    p.orbitAngle+=(p.role==='observer'?.30:.43)*dt*p.side;
    const radius=(p.role==='observer'?250:320)*s,target={x:gun.x+Math.cos(p.orbitAngle)*radius,y:gun.y-120*s+Math.sin(p.orbitAngle)*radius*.62};
    this.move(p,target,dt,p.speed);this.fireEscort(p,dt,ctx);
   }
  }
  this.counterClock-=dt;if(this.counterClock<=0)this.scheduleCounterBattery();
 }
 hit({partId=null,damage}){
  if(!Number.isFinite(damage)||damage<0)throw new Error('Invalid damage');
  const p=this.parts.get(partId);if(this.dead||!p||!p.hittable||p.destroyed)return{damage:0,blocked:true};
  const dealt=p.hit(damage);this.hp=Math.max(0,this.planes.reduce((sum,q)=>sum+q.hp,0));
  this.command('laon-air-hit',{partId:p.id,role:p.role,...this.point(p),damage:dealt});
  if(p.destroyed){p.destroyedAt=this.clock;p.mode='destroyed';p.hittable=false;
   this.command('cancel-hazards',{tag:this.id+':'+p.id,pendingOnly:true});this.command('part-destroyed',{partId:p.id,...this.point(p)});
   this.command('laon-air-destroyed',{partId:p.id,role:p.role,aircraft:p.aircraft,...this.point(p),angle:p.angle});
   if(p.role==='observer'){this.counterClock=Math.max(this.counterClock,26);this.command('laon-observation-lost',{interval:30,spread:165});}
  }
  if(this.hp<=1e-8){this.hp=0;this.dead=true;this.phase='defeated';this.command('body-defeated',{x:this.x,y:this.y});}
  return{damage:dealt,partId:p.id,partDestroyed:p.destroyed,bodyDefeated:this.dead};
 }
 locateHit(shot){
  if(this.dead)return null;let found=null,distance=Infinity;
  for(const p of this.planes)if(p.hittable&&!p.destroyed){const q=this.point(p);if(sweptLaonEllipse(shot,q.x,q.y,p.radius,p.radius*.72)){
   const d=Math.hypot(shot.x-q.x,shot.y-q.y);if(d<distance){found=p;distance=d;}}}
  return found?{partId:found.id}:null;
 }
 hitAt(shot){const hit=this.locateHit(shot);return hit?this.hit({...hit,damage:shot.damage}):{damage:0,miss:true};}
}

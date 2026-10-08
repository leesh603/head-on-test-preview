import {BaseBoss,BossPart} from './headon-stageboss-core.js?v=raid2';
import {segmentDistance} from './alps-geometry117.js?v=raid2';
export const GALLIPOLI_SCALE=.78;
const gs=v=>Math.round(v*GALLIPOLI_SCALE);
export const GALLIPOLI_EXTENTS=Object.freeze({halfWidth:gs(1640),halfHeight:gs(1300)});
export const GALLIPOLI_SECTORS=Object.freeze([
 {id:'west',name:'서부 해안포 진지',x:-940,y:160,guards:['left','west-howitzer','aa-west']},
 {id:'east',name:'동부 해안포 진지',x:940,y:160,guards:['right','east-howitzer','aa-east']},
 {id:'citadel',name:'후방 중포 성채',x:0,y:-620,guards:['rear-left','rear-right','aa-citadel']}
].map(s=>Object.freeze({...s,x:gs(s.x),y:gs(s.y),guards:Object.freeze(s.guards)})));
const gun=(id,sector,x,y,art)=>({id,sector,x:gs(x),y:gs(y),art,r:gs(92),fraction:.085,size:gs(310),muzzle:gs(art==='twin'?216:208),kind:'gun'});
export const GALLIPOLI_PARTS=Object.freeze([
 gun('left','west',-1290,160,'twin'),gun('west-howitzer','west',-640,160,'howitzer'),
 gun('right','east',600,160,'twin'),gun('east-howitzer','east',1240,160,'howitzer'),
 gun('rear-left','citadel',-300,-710,'twin'),gun('rear-right','citadel',300,-710,'howitzer'),
 ...GALLIPOLI_SECTORS.map(s=>({id:'aa-'+s.id,sector:s.id,x:gs(s.x-30),y:gs(s.id==='citadel'?s.y+220:s.y),art:'aa',r:gs(58),fraction:.04,size:gs(200),muzzle:gs(118),kind:'aa'})),
 ...GALLIPOLI_SECTORS.map(s=>({id:'ammo-'+s.id,sector:s.id,x:gs(s.x),y:gs(s.y-205),art:'ammo',r:gs(68),fraction:.03,size:gs(230),muzzle:0,kind:'supply'})),
 {id:'observer',sector:null,x:0,y:gs(660),art:'signal',r:gs(70),fraction:.03,size:gs(230),muzzle:0,kind:'observer'}
].map(p=>Object.freeze(p)));
// Distances match the authored 1280px gun atlas and the view's recoil offset.
export const GALLIPOLI_COMMAND_MUZZLE=260;
export function gallipoliMuzzle(b,p,barrel=0){const reach=(p.muzzle||0)-(p.recoil||0)*25,side=p.art==='twin'?barrel*(p.barrelOffset||14):0;return{x:b.x+p.x+Math.cos(p.angle)*reach-Math.sin(p.angle)*side,y:b.y+p.y+Math.sin(p.angle)*reach+Math.cos(p.angle)*side};}
export const gallipoliCommandMuzzle=(b,barrel=-1)=>gallipoliMuzzle(b,{x:0,y:0,angle:b.coreAngle,muzzle:GALLIPOLI_COMMAND_MUZZLE,recoil:b.coreRecoil,art:'twin',barrelOffset:22},barrel);
export function gallipoliObjective(b,x,y){
 const available=[...b.parts.values()].filter(p=>!p.destroyed&&(p.kind==='gun'||p.kind==='aa'));
 if(!b.commandDestroyed)available.push({x:0,y:0,kind:'command'});
 return available.sort((a,c)=>Math.hypot(b.x+a.x-x,b.y+a.y-y)-Math.hypot(b.x+c.x-x,b.y+c.y-y))[0]||{x:0,y:0,kind:'command'};
}
export const GALLIPOLI_REPAIR_SECONDS=18;
export const GALLIPOLI_HANGAR=Object.freeze({x:gs(-460),y:gs(-380),width:gs(220),height:gs(300),exitX:gs(-460),exitY:gs(-215),heading:Math.PI/2});
export const GALLIPOLI_INTERCEPTORS=Object.freeze({central:'eindecker',entente:'nieuport11'});
export const gallipoliAngleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
export function turnGallipoliTurret(angle,target,rate,dt){const d=gallipoliAngleDelta(angle,target);return angle+Math.max(-rate*dt,Math.min(rate*dt,d));}
export class GallipoliFortress extends BaseBoss{
 constructor(o){const t=o.tuning;super({...o,maxHp:t.maxHp,coreRadius:gs(115),parts:GALLIPOLI_PARTS.map(p=>new BossPart({id:p.id,x:p.x,y:p.y,radius:p.r,maxHp:t.maxHp*p.fraction,angle:Math.PI/2}))});
 Object.assign(this,{t,kind:'gallipoli-fortress',faction:o.faction,gallipoliBoss:true,ownsMotion129:true,clock:0,entryAge:0,coreVulnerable:true,phase:'gallipoli-coastal-line',cursor:0,batteryCursor:0,captured:new Set(),coreAngle:Math.PI/2,commandMaxHp:t.maxHp*.25,commandHp:t.maxHp*.25,commandDestroyed:false,coastalClock:0,coastalRemaining:0,centralClock:0,sortieRemaining:6,centralRemaining:0,launchWarning:false,defensePhase:1,finalClock:0,barrageRemaining:0,recoveryRemaining:0,coreRecoil:0});
 for(const d of GALLIPOLI_PARTS)Object.assign(this.parts.get(d.id),d,{angle:Math.PI/2,recoil:0,repairRemaining:0,repairWarned:false,repairGrace:0});}
 command(type,spec={}){this.emit({...spec,type,bossId:this.id,faction:this.faction});}
 hazard(spec){this.command('hazard',{kind:'circle',damage:this.t.damage,warning:1.8,duration:.45,once:true,visual:'gallipoli-shell',...spec});}
 shot(x,y,angle,count=5,spread=.5,speed=this.t.bulletSpeed*.88,visual='gallipoli-aa',duration=7){
  const n=Math.max(1,Math.ceil(count*(this.t.projectileDensity??1)));
  for(let i=0;i<n;i++){const a=angle+(n===1?0:(i/(n-1)-.5)*spread);
   this.hazard({kind:'projectile',x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,radius:5,warning:0,duration,once:false,visual,damage:this.t.damage*.55,tag:this.id+':'+(visual==='gallipoli-ring'?'central':this.aaSourceId)});}}
 ring(count=12,speed=this.t.bulletSpeed*.7){const n=Math.max(1,Math.ceil(count*(this.t.projectileDensity??1)));
  const q=gallipoliCommandMuzzle(this);for(let i=0;i<n;i++)this.shot(q.x,q.y,i*Math.PI*2/n,1,0,speed,'gallipoli-ring');}
 locateHit(s){if(this.entryAge<5||this.dead)return null;for(const p of this.parts.values())if(!p.destroyed&&segmentDistance(0,0,(s.previousX??s.x)-this.x-p.x,(s.previousY??s.y)-this.y-p.y,s.x-this.x-p.x,s.y-this.y-p.y)<=p.radius+(s.radius||0))return{partId:p.id};return !this.commandDestroyed&&segmentDistance(0,0,(s.previousX??s.x)-this.x,(s.previousY??s.y)-this.y,s.x-this.x,s.y-this.y)<=this.coreRadius+(s.radius||0)?{partId:null}:null;}
 syncHp(){this.hp=Math.max(0,this.commandHp)+[...this.parts.values()].reduce((n,p)=>n+Math.max(0,p.hp),0);}
 // Gun crews reloading after a barrage: the announced opening deals 1.5x.
 counterWindow(){return this.recoveryRemaining>0?1.5:1;}
 hit(a){if(!Number.isFinite(a.damage)||a.damage<0)throw new Error('Invalid damage');if(this.entryAge<5||this.dead)return{damage:0,blocked:true};let result;
 if(a.partId){result=super.hit(a);}
 else{if(this.commandDestroyed)return{damage:0,blocked:true};const damage=Math.min(a.damage,this.commandHp);this.commandHp-=damage;result={damage,commandDestroyed:this.commandHp<=0};
 if(this.commandHp<=0){this.commandDestroyed=true;this.phase='command-destroyed';this.launchWarning=false;this.command('cancel-hazards',{tag:this.id+':central'});if(this.pendingAttack){this.pendingAttack.sources=this.pendingAttack.sources.filter(s=>s.id);if(!this.pendingAttack.sources.length)this.pendingAttack=null;}this.coreAimTarget=null;this.coreFlash=0;for(const p of this.parts.values()){p.repairRemaining=0;p.repairWarned=false;}this.command('phase-change',{phase:'gallipoli-command-destroyed'});this.command('camera-shake',{strength:8});}}
 this.syncHp();this.finishIfCleared();return{...result,bodyDefeated:this.dead};}
 hitAt(s){const h=this.locateHit(s);return h?this.hit({...h,damage:s.damage}):{damage:0,miss:true};}
 onPartDestroyed(p){this.command('cancel-hazards',{tag:this.id+':'+p.id});p.aimTarget=null;p.gunFlash=0;if(this.pendingAttack)this.pendingAttack.sources=this.pendingAttack.sources.filter(s=>s.id!==p.id);p.repairRemaining=this.commandDestroyed?0:GALLIPOLI_REPAIR_SECONDS;p.repairWarned=false;
 if(p.kind==='supply')for(const q of this.parts.values())if(q.sector===p.sector&&q.kind==='gun'&&!q.destroyed)this.hit({partId:q.id,damage:q.maxHp*.35});
 this.command('camera-shake',{strength:p.kind==='gun'?5:3});}
 finishIfCleared(){if(this.dead||this.finishing||!this.commandDestroyed||[...this.parts.values()].some(p=>(p.kind==='gun'||p.kind==='aa')&&!p.destroyed))return;
 this.finishing=true;for(const p of this.parts.values())if(!p.destroyed)this.hit({partId:p.id,damage:p.hp});this.finishing=false;this.syncHp();this.dead=true;this.phase='defeated';this.command('body-defeated');}
 updateRepairs(dt){for(const p of this.parts.values()){p.repairGrace=Math.max(0,p.repairGrace-dt);if(!p.destroyed||this.commandDestroyed||p.repairRemaining<=0)continue;p.repairRemaining=Math.max(0,p.repairRemaining-dt);
 if(p.repairRemaining<=3&&!p.repairWarned){p.repairWarned=true;this.command('phase-change',{phase:'gallipoli-repair-warning',partId:p.id});}
 if(p.repairRemaining<=0){p.hp=p.maxHp;p.destroyedAt=null;p.repairGrace=2;p.repairWarned=false;p.aimTarget=null;this.syncHp();this.command('phase-change',{phase:'gallipoli-repaired'});}}
 for(const s of GALLIPOLI_SECTORS){const disabled=s.guards.every(id=>this.parts.get(id).destroyed);if(disabled&&!this.captured.has(s.id)){this.captured.add(s.id);this.command('phase-change',{phase:'sector-'+s.id+'-captured'});}else if(!disabled)this.captured.delete(s.id);}}
 target(ps){const live=ps.filter(p=>p.alive);return live.length?live[this.cursor++%live.length]:null;}
 turnTurrets(dt,players){const live=players.filter(p=>p.alive);for(const p of this.parts.values()){p.recoil=Math.max(0,p.recoil-dt);p.gunFlash=Math.max(0,(p.gunFlash||0)-dt);if(p.destroyed||(p.kind!=='gun'&&p.kind!=='aa'))continue;const target=p.aimTarget||live.reduce((best,q)=>!best||Math.hypot(q.x-this.x-p.x,q.y-this.y-p.y)<Math.hypot(best.x-this.x-p.x,best.y-this.y-p.y)?q:best,null);if(target)p.angle=turnGallipoliTurret(p.angle,Math.atan2(target.y-this.y-p.y,target.x-this.x-p.x),p.kind==='aa'?1.35:.7,dt);}
 this.coreRecoil=Math.max(0,this.coreRecoil-dt);this.coreFlash=Math.max(0,(this.coreFlash||0)-dt);const target=this.coreAimTarget||live[0];if(target&&!this.commandDestroyed)this.coreAngle=turnGallipoliTurret(this.coreAngle,Math.atan2(target.y-this.y,target.x-this.x),.5,dt);}
 tickSorties(dt){if(this.commandDestroyed)return;this.sortieRemaining=Math.max(0,this.sortieRemaining-dt);this.launchWarning=this.sortieRemaining<=1.2;if(this.sortieRemaining>0)return;
 if((this.countMinions129?.()||0)>=4){this.sortieRemaining=2;this.launchWarning=false;return;}const h=GALLIPOLI_HANGAR;this.command('spawn-minion',{minion:'gallipoli-interceptor',plane:GALLIPOLI_INTERCEPTORS[this.faction],behavior:'gallipoli-interceptor',x:this.x+h.exitX,y:this.y+h.exitY,a:h.heading,hp:45*(1+(this.t.loopIndex||0)*.12),life:26,fire:1.8});this.sortieRemaining=8;this.launchWarning=false;this.launchFlash=.5;}
 planCentral(target){this.coreAimTarget={x:target.x,y:target.y};this.pendingAttack={kind:'central',sources:[{id:null,target:this.coreAimTarget,shots:[{...this.coreAimTarget,radius:100,warning:2.2,tag:this.id+':central'}]}]};this.centralClock=0;}
 updateDefensePhase(){
  const offensive=[...this.parts.values()].filter(p=>(p.kind==='gun'||p.kind==='aa')&&!p.destroyed);
  const coast=offensive.some(p=>p.sector==='west'||p.sector==='east');
  const phase=this.hp<=this.maxHp*.38||offensive.length<=2?3:coast?1:2;
  if(phase!==this.defensePhase){this.defensePhase=phase;const label=['','gallipoli-coastal-line','gallipoli-citadel-defense','gallipoli-last-defense'][phase];if(this.pendingAttack?.kind!=='final'&&!this.barrageRemaining&&!this.recoveryRemaining)this.phase=label;if(phase===3)this.finalClock=18;this.command('phase-change',{phase:label});}
 }
 planCoastal(target){
  const guns=[...this.parts.values()].filter(p=>p.kind==='gun'&&!p.destroyed&&p.repairGrace<=0);
  const choose=sector=>{const group=guns.filter(p=>p.sector===sector);return group.length?group[this.batteryCursor%group.length]:null;};
  // Either wing can be attacked first. The rear guns take over as wings fall.
  const selected=this.defensePhase===2?guns.filter(p=>p.sector==='citadel').slice(0,2):[choose('west'),choose('east')].filter(Boolean);
  for(const p of guns.filter(p=>p.sector==='citadel'))if(selected.length<2&&!selected.includes(p))selected.push(p);
  const sources=[],observed=!this.parts.get('observer').destroyed;
  for(const [i,p]of selected.entries()){
   const point={x:target.x+(i===0?-65:65),y:target.y+(target.vy||0)*.35},ammoGone=this.parts.get('ammo-'+p.sector).destroyed,shots=[];
   p.aimTarget=point;for(let j=0;j<(ammoGone?1:2);j++)shots.push({x:point.x,y:point.y+j*130,radius:p.art==='twin'?60:52,delay:i*.35+j*(p.art==='twin'?.24:.85),barrel:j?1:-1,warning:observed?1.8:2.3,tag:this.id+':'+p.id});sources.push({id:p.id,target:point,shots});
  }this.batteryCursor++;
  const aa=[...this.parts.values()].find(p=>p.kind==='aa'&&!p.destroyed&&p.repairGrace<=0);if(aa){const point={x:target.x+(target.vx||0)*.75,y:target.y+(target.vy||0)*.75};aa.aimTarget=point;sources.push({id:aa.id,target:point,shots:[{...point,radius:34,warning:2,delay:.2,damage:this.t.damage*.55,tag:this.id+':'+aa.id}]});}
  if(sources.length)this.pendingAttack={kind:'coastal',sources,lane:null};this.coastalClock=0;
 }
 planFinal(target){
  const sources=[],observed=!this.parts.get('observer').destroyed;
  // Reuse the existing batteries; no restored or synthetic guns participate.
  for(const [i,sector]of GALLIPOLI_SECTORS.entries()){
   const guns=[...this.parts.values()].filter(p=>p.sector===sector.id&&!p.destroyed&&p.repairGrace<=0&&(p.kind==='gun'||p.kind==='aa'));
   const p=guns[this.batteryCursor%Math.max(1,guns.length)];if(!p)continue;
   const point={x:target.x+(i===1?90:i===0?-90:0),y:target.y+(i===2?100:0)},shots=[],ammoGone=this.parts.get('ammo-'+sector.id).destroyed;
   for(let j=0;j<(p.art==='twin'&&!ammoGone?2:1);j++)shots.push({...point,y:point.y+j*130,radius:p.kind==='aa'?34:60,delay:1+i*1.15+j*.24,barrel:j?1:-1,warning:observed?2:2.5,tag:this.id+':'+p.id});
   p.aimTarget=point;sources.push({id:p.id,target:point,shots});
  }
  if(!this.commandDestroyed){const point={x:target.x+(target.vx||0)*.65,y:target.y+(target.vy||0)*.65};this.coreAimTarget=point;sources.push({id:null,target:point,shots:[{...point,radius:145,delay:4.5,warning:2.4,raidHeavy:true,duration:.22,tag:this.id+':central'}]});}
  if(!sources.length)return;
  // End old AA/ring fire before the sector-by-sector artillery order.
  for(const p of this.parts.values())this.command('cancel-hazards',{tag:this.id+':'+p.id});this.command('cancel-hazards',{tag:this.id+':central'});
  this.pendingAttack={kind:'final',sources,lane:null};this.finalClock=0;this.batteryCursor++;this.phase='gallipoli-final-barrage';this.command('phase-change',{phase:this.phase});
 }
 fireIfAligned(dt=0){
  const a=this.pendingAttack;if(!a)return;a.sources=a.sources.filter(s=>s.id?!this.parts.get(s.id).destroyed:!this.commandDestroyed);
  const aligned=(s,point)=>{const p=s.id?this.parts.get(s.id):{x:0,y:0,angle:this.coreAngle};return Math.abs(gallipoliAngleDelta(p.angle,Math.atan2(point.y-this.y-p.y,point.x-this.x-p.x)))<=.055;};
  if(!a.started){if(a.sources.some(s=>!aligned(s,s.target)))return;a.started=true;a.age=0;a.endsAt=this.clock;if(a.lane)this.lane=a.lane;}
  a.age+=dt;if(a.lane)this.lane.remaining=Math.max(this.lane.remaining,.1);
  for(const s of a.sources){const index=s.next||0,shot=s.shots[index];if(!shot||a.age<(shot.delay||0)||!aligned(s,shot))continue;
   let q;if(s.id){const p=this.parts.get(s.id);p.recoil=.28;q=gallipoliMuzzle(this,p,shot.barrel||0);Object.assign(p,{gunFlash:.16,flashX:q.x,flashY:q.y});}else{this.coreRecoil=.28;q=gallipoliCommandMuzzle(this,shot.barrel??-1);this.coreFlash=.16;this.coreFlashX=q.x;this.coreFlashY=q.y;}
   this.command('muzzle',{...q,partId:s.id});this.hazard({...shot,delay:0,sourceX:q.x,sourceY:q.y});
   if(s.id){const _p=this.parts.get(s.id);if(Number.isFinite(_p.angle)){this.aaSourceId=s.id;this.shot(q.x,q.y,_p.angle,4,.85,this.t.bulletSpeed*.7,'gallipoli-aa',shot.warning+.3);}}
   a.endsAt=Math.max(a.endsAt,this.clock+shot.warning+.45);if(a.lane)this.lane.remaining=Math.max(this.lane.remaining,shot.warning+.45);
   s.next=index+1;const next=s.shots[s.next];s.target=next||shot;if(s.id)this.parts.get(s.id).aimTarget=next||null;else this.coreAimTarget=next||null;
  }
  if(a.sources.every(s=>(s.next||0)>=s.shots.length)){
   if(a.kind==='final')this.barrageRemaining=Math.max(.01,a.endsAt-this.clock);else if(a.kind==='central')this.centralRemaining=Math.max(0,a.endsAt-this.clock);else this.coastalRemaining=Math.max(.01,a.endsAt-this.clock);
   this.pendingAttack=null;
  }
 }

 update(dt,{players}){
  if(this.dead)return;this.clock+=dt;this.entryAge=Math.min(5,this.entryAge+dt);if(this.entryAge<5)return;
  this.updateRepairs(dt);this.updateDefensePhase();this.turnTurrets(dt,players);this.tickSorties(dt);this.launchFlash=Math.max(0,(this.launchFlash||0)-dt);
  if(this.lane)this.lane.remaining=Math.max(0,this.lane.remaining-dt);this.centralRemaining=Math.max(0,this.centralRemaining-dt);
  if(this.barrageRemaining>0){this.barrageRemaining=Math.max(0,this.barrageRemaining-dt);if(!this.barrageRemaining){this.recoveryRemaining=2.4;this.phase='gallipoli-recovery';this.command('phase-change',{phase:this.phase});}return;}
  if(this.coastalRemaining>0){this.coastalRemaining=Math.max(0,this.coastalRemaining-dt);if(!this.coastalRemaining){this.recoveryRemaining=1.4;this.phase='gallipoli-recovery';}return;}
  if(this.recoveryRemaining>0){this.recoveryRemaining=Math.max(0,this.recoveryRemaining-dt);if(!this.recoveryRemaining)this.phase=['','gallipoli-coastal-line','gallipoli-citadel-defense','gallipoli-last-defense'][this.defensePhase];return;}
  const mult=Math.min(3,this.t.patternMultiplier||1);this.coastalClock+=dt*mult;this.centralClock+=dt*mult;this.finalClock+=dt;
  if(this.pendingAttack?.kind==='final'){this.fireIfAligned(dt);return;}
  if(!this.pendingAttack&&!this.lane?.remaining&&!this.centralRemaining&&this.finalClock>=(this.defensePhase===3?18:24)){const target=this.target(players);if(target){this.planFinal(target);this.fireIfAligned(dt);return;}}
  this.aaClock=(this.aaClock??0)+dt*mult;
  if(this.aaClock>=1.5&&!this.recoveryRemaining){this.aaClock=0;const mounts=[...this.parts.values()].filter(p=>p.kind==='aa'&&!p.destroyed&&p.repairGrace<=0);
   if(mounts.length){const m=mounts[(this.aaCursor=(this.aaCursor||0)+1)%mounts.length];m.recoil=.18;const q=gallipoliMuzzle(this,m);Object.assign(m,{gunFlash:.12,flashX:q.x,flashY:q.y});this.aaSourceId=m.id;this.command('muzzle',{...q,partId:m.id});this.shot(q.x,q.y,m.angle,7,.95);}}
  // Bullet-hell: every surviving gun turret tracks a live pilot and sprays an
  // aimed fan — the fortress rains real projectiles, not just warned circles.
  this.fanClock=(this.fanClock??0)+dt*mult;
  if(this.fanClock>=1.6&&!this.pendingAttack&&!this.recoveryRemaining){this.fanClock=0;
   const live=players.filter(p=>p.alive),guns=[...this.parts.values()].filter(p=>p.kind==='gun'&&!p.destroyed&&p.repairGrace<=0);
   if(guns.length&&live.length){const g=guns[(this.fanCursor=(this.fanCursor||0)+1)%guns.length];
    const tp=live[this.fanCursor%live.length]||live[0],gx=this.x+g.x,gy=this.y+g.y,aim=Math.atan2(tp.y+(tp.vy||0)*.35-gy,tp.x+(tp.vx||0)*.35-gx);
    if(!Number.isFinite(aim))return;
    g.angle=Number.isFinite(g.angle)?turnGallipoliTurret(g.angle,aim,4,dt):aim;
    g.recoil=.2;const q=gallipoliMuzzle(this,g);Object.assign(g,{gunFlash:.14,flashX:q.x,flashY:q.y});
    this.aaSourceId=g.id;this.command('muzzle',{...q,partId:g.id});
    this.shot(q.x,q.y,aim,this.defensePhase>=2?8:6,1.05,this.t.bulletSpeed*.78,'gallipoli-aa');}}
  this.ringClock=(this.ringClock??0)+dt*mult;
  if(!this.commandDestroyed&&this.ringClock>=5.5){this.ringClock=0;this.coreRecoil=.28;const q=gallipoliCommandMuzzle(this);this.coreFlash=.16;this.coreFlashX=q.x;this.coreFlashY=q.y;this.command('muzzle',q);this.ring(12);}
  if(this.pendingAttack){this.fireIfAligned(dt);return;}if(this.lane?.remaining||this.centralRemaining)return;const target=this.target(players);if(!target)return;
  if(!this.commandDestroyed&&this.centralClock>=8)this.planCentral(target);else if(this.coastalClock>=4.4)this.planCoastal(target);this.fireIfAligned(dt);
 }
}

import {BaseBoss,BossPart} from './headon-stageboss-core.js?v=tame3&ai=1018&sig=1019&boss=20261020b&phase=1021';
import {segmentDistance} from './alps-geometry117.js?v=tame3';
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
 if(b.coreVulnerable&&!b.commandDestroyed)available.push({x:0,y:0,kind:'command'});
 return available.sort((a,c)=>Math.hypot(b.x+a.x-x,b.y+a.y-y)-Math.hypot(b.x+c.x-x,b.y+c.y-y))[0]||{x:0,y:0,kind:'command'};
}
export const GALLIPOLI_REPAIR_SECONDS=18;
export const GALLIPOLI_HANGAR=Object.freeze({x:gs(-460),y:gs(-380),width:gs(220),height:gs(300),exitX:gs(-460),exitY:gs(-215),heading:Math.PI/2});
export const GALLIPOLI_INTERCEPTORS=Object.freeze({central:'eindecker',entente:'nieuport11'});
export const gallipoliAngleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
export function turnGallipoliTurret(angle,target,rate,dt){const d=gallipoliAngleDelta(angle,target);return angle+Math.max(-rate*dt,Math.min(rate*dt,d));}
export class GallipoliFortress extends BaseBoss{
 constructor(o){const t=o.tuning;super({...o,maxHp:t.maxHp,coreRadius:gs(115),parts:GALLIPOLI_PARTS.map(p=>new BossPart({id:p.id,x:p.x,y:p.y,radius:p.r,maxHp:t.maxHp*p.fraction,angle:Math.PI/2}))});
 Object.assign(this,{t,kind:'gallipoli-fortress',faction:o.faction,gallipoliBoss:true,ownsMotion129:true,clock:0,entryAge:0,coreVulnerable:false,phase:'gallipoli-coastal-line',cursor:0,batteryCursor:0,sectorCursor:0,captured:new Set(),coreAngle:Math.PI/2,commandMaxHp:t.maxHp*.25,commandHp:t.maxHp*.25,commandDestroyed:false,coastalClock:0,coastalRemaining:0,centralClock:0,sortieRemaining:6,centralRemaining:0,launchWarning:false,defensePhase:1,finalClock:0,barrageRemaining:0,recoveryRemaining:0,coreRecoil:0});
 for(const d of GALLIPOLI_PARTS)Object.assign(this.parts.get(d.id),d,{angle:Math.PI/2,recoil:0,repairRemaining:0,repairWarned:false,repairGrace:0});}
 command(type,spec={}){this.emit({...spec,type,bossId:this.id,faction:this.faction});}
 hazard(spec){this.command('hazard',{kind:'circle',damage:this.t.damage,warning:1.8,duration:.45,once:true,visual:'gallipoli-shell',...spec});}
 shot(x,y,angle,count=5,spread=.5,speed=this.t.bulletSpeed*.88,visual='gallipoli-aa',duration=7){
  const n=Math.max(1,Math.ceil(count*(this.t.projectileDensity??1)));
  for(let i=0;i<n;i++){const a=angle+(n===1?0:(i/(n-1)-.5)*spread);
   this.hazard({kind:'projectile',x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,radius:5,warning:0,duration,once:false,visual,damage:this.t.damage*.55,sourcePartId:visual==='gallipoli-ring'?undefined:this.aaSourceId,tag:this.id+':'+(visual==='gallipoli-ring'?'central':this.aaSourceId)});}}
 ring(count=12,speed=this.t.bulletSpeed*.7){const n=Math.max(1,Math.ceil(count*(this.t.projectileDensity??1)));
  const q=gallipoliCommandMuzzle(this);for(let i=0;i<n;i++)this.shot(q.x,q.y,i*Math.PI*2/n,1,0,speed,'gallipoli-ring');}
 locateHit(s){if(this.entryAge<5||this.dead)return null;for(const p of this.parts.values())if(!p.destroyed&&segmentDistance(0,0,(s.previousX??s.x)-this.x-p.x,(s.previousY??s.y)-this.y-p.y,s.x-this.x-p.x,s.y-this.y-p.y)<=p.radius+(s.radius||0))return{partId:p.id};return this.coreVulnerable&&!this.commandDestroyed&&segmentDistance(0,0,(s.previousX??s.x)-this.x,(s.previousY??s.y)-this.y,s.x-this.x,s.y-this.y)<=this.coreRadius+(s.radius||0)?{partId:null}:null;}
 syncHp(){this.hp=Math.max(0,this.commandHp)+[...this.parts.values()].reduce((n,p)=>n+Math.max(0,p.hp),0);}
 // Gun crews reloading after a barrage: the announced opening deals 1.5x.
 counterWindow(){return this.recoveryRemaining>0?1.5:1;}
 // The command post is the kill pool: phase gates hold it rather than the total gauge.
 coreReserve(){return this.commandHp;}
 hit(a){if(!Number.isFinite(a.damage)||a.damage<0)throw new Error('Invalid damage');if(this.entryAge<5||this.dead)return{damage:0,blocked:true};let result;
 if(a.partId){result=super.hit(a);}
 else{if(this.commandDestroyed||!this.coreVulnerable)return{damage:0,blocked:true};const damage=Math.min(a.damage,this.commandHp);this.commandHp-=damage;result={damage,commandDestroyed:this.commandHp<=0};
 if(this.commandHp<=0){this.commandDestroyed=true;this.phase='defeated';this.launchWarning=false;this.pendingAttack=null;this.coreAimTarget=null;this.coreFlash=0;for(const p of this.parts.values()){p.repairRemaining=0;p.repairWarned=false;p.hp=0;this.command('cancel-hazards',{tag:this.id+':'+p.id});}this.command('cancel-hazards',{tag:this.id+':central'});this.command('phase-change',{phase:'gallipoli-command-destroyed'});this.command('camera-shake',{strength:8});this.dead=true;this.command('body-defeated');}}
 this.syncHp();this.finishIfCleared();return{...result,bodyDefeated:this.dead};}
 hitAt(s){const h=this.locateHit(s);return h?this.hit({...h,damage:s.damage}):{damage:0,miss:true};}
 onPartDestroyed(p){this.command('cancel-hazards',{tag:this.id+':'+p.id});p.aimTarget=null;p.gunFlash=0;if(this.pendingAttack){this.pendingAttack.sources=this.pendingAttack.sources.filter(s=>s.id!==p.id);if(!this.pendingAttack.sources.length)this.pendingAttack=null;}p.repairRemaining=this.commandDestroyed||this.coreVulnerable?0:GALLIPOLI_REPAIR_SECONDS;p.repairWarned=false;
 if(p.kind==='supply')for(const q of this.parts.values())if(q.sector===p.sector&&q.kind==='gun'&&!q.destroyed)this.hit({partId:q.id,damage:q.maxHp*.35});
 this.command('camera-shake',{strength:p.kind==='gun'?5:3});}
 finishIfCleared(){if(this.dead||[...this.parts.values()].some(p=>(p.kind==='gun'||p.kind==='aa')&&!p.destroyed))return;
  if(!this.commandDestroyed&&!this.coreVulnerable){this.coreVulnerable=true;this.pendingAttack=null;this.recoveryRemaining=2.4;this.phase='gallipoli-command-exposed';for(const p of this.parts.values()){p.repairRemaining=0;p.repairWarned=false;this.command('cancel-hazards',{tag:this.id+':'+p.id});}this.command('cancel-hazards',{tag:this.id+':central'});this.command('phase-change',{phase:this.phase,seconds:this.recoveryRemaining});}
 }
 updateRepairs(dt){for(const p of this.parts.values()){p.repairGrace=Math.max(0,p.repairGrace-dt);if(!p.destroyed||this.commandDestroyed||p.repairRemaining<=0)continue;p.repairRemaining=Math.max(0,p.repairRemaining-dt);
 if(p.repairRemaining<=3&&!p.repairWarned){p.repairWarned=true;this.command('phase-change',{phase:'gallipoli-repair-warning',partId:p.id});}
 if(p.repairRemaining<=0){p.hp=p.maxHp;p.destroyedAt=null;p.repairGrace=2;p.repairWarned=false;p.aimTarget=null;this.syncHp();this.command('phase-change',{phase:'gallipoli-repaired'});}}
 for(const s of GALLIPOLI_SECTORS){const disabled=s.guards.every(id=>this.parts.get(id).destroyed);if(disabled&&!this.captured.has(s.id)){this.captured.add(s.id);this.command('phase-change',{phase:'sector-'+s.id+'-captured'});}else if(!disabled)this.captured.delete(s.id);}}
 target(ps){const live=ps.filter(p=>p.alive);return live.length?live[this.cursor++%live.length]:null;}
 turnTurrets(dt,players){const live=players.filter(p=>p.alive);for(const p of this.parts.values()){p.recoil=Math.max(0,p.recoil-dt);p.gunFlash=Math.max(0,(p.gunFlash||0)-dt);if(p.destroyed||(p.kind!=='gun'&&p.kind!=='aa'))continue;const target=p.aimTarget||live.reduce((best,q)=>!best||Math.hypot(q.x-this.x-p.x,q.y-this.y-p.y)<Math.hypot(best.x-this.x-p.x,best.y-this.y-p.y)?q:best,null);if(target)p.angle=turnGallipoliTurret(p.angle,Math.atan2(target.y-this.y-p.y,target.x-this.x-p.x),p.kind==='aa'?1.35:.7,dt);}
 this.coreRecoil=Math.max(0,this.coreRecoil-dt);this.coreFlash=Math.max(0,(this.coreFlash||0)-dt);const target=this.coreAimTarget||live[0];if(target&&!this.commandDestroyed)this.coreAngle=turnGallipoliTurret(this.coreAngle,Math.atan2(target.y-this.y,target.x-this.x),.5,dt);}
 tickSorties(dt){if(this.commandDestroyed)return;this.sortieRemaining=Math.max(0,this.sortieRemaining-dt);this.launchWarning=this.sortieRemaining<=1.2;if(this.sortieRemaining>0)return;
 if((this.countMinions129?.()||0)>=4){this.sortieRemaining=2;this.launchWarning=false;return;}const h=GALLIPOLI_HANGAR;this.command('spawn-minion',{minion:'gallipoli-interceptor',plane:GALLIPOLI_INTERCEPTORS[this.faction],behavior:'gallipoli-interceptor',x:this.x+h.exitX,y:this.y+h.exitY,a:h.heading,hp:45*(1+(this.t.loopIndex||0)*.12),life:26,fire:1.8});this.sortieRemaining=8;this.launchWarning=false;this.launchFlash=.5;}
 planCentral(target){this.coreAimTarget={x:target.x,y:target.y};this.pendingAttack={kind:'central',sources:[{id:null,target:this.coreAimTarget,shots:[{...this.coreAimTarget,radius:100,warning:2.2,raidHeavy:true,tag:this.id+':central'}]}]};this.centralClock=0;}
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
 planZone(target){
  const liveSectors=GALLIPOLI_SECTORS.filter(s=>s.guards.some(id=>!this.parts.get(id).destroyed&&this.parts.get(id).repairGrace<=0));if(!liveSectors.length){this.finishIfCleared();return;}
  const primary=liveSectors[this.sectorCursor++%liveSectors.length],adjacent=liveSectors.filter(s=>s!==primary).sort((a,b)=>Math.hypot(a.x-primary.x,a.y-primary.y)-Math.hypot(b.x-primary.x,b.y-primary.y))[0];
  const weapon=sector=>[...this.parts.values()].filter(p=>p.sector===sector.id&&!p.destroyed&&p.repairGrace<=0&&(p.kind==='gun'||p.kind==='aa')).sort((a,b)=>(a.kind==='aa')-(b.kind==='aa'))[0];
  const sources=[],lead={x:target.x+(target.vx||0)*.45,y:target.y+(target.vy||0)*.45},main=weapon(primary),support=adjacent&&weapon(adjacent);
  if(main){const r=main.kind==='aa'?34:52,shots=[-1,0,1].map((n,i)=>({x:lead.x+n*(r*2+12),y:lead.y+(i%2?32:0),radius:r,delay:i*.24,warning:1.7,tag:this.id+':'+main.id}));main.aimTarget=lead;sources.push({id:main.id,target:lead,shots});}
  if(support){const point={x:lead.x+(support.x<main.x?-1:1)*120,y:lead.y+85};support.aimTarget=point;sources.push({id:support.id,target:point,shots:[{...point,radius:support.kind==='aa'?34:50,delay:.7,warning:1.9,tag:this.id+':'+support.id}]});}
  if(!this.commandDestroyed){const point={x:target.x+(target.vx||0)*.8,y:target.y+(target.vy||0)*.8};this.coreAimTarget=point;sources.push({id:null,target:point,shots:[{...point,radius:118,delay:1.55,warning:2.35,duration:.25,raidHeavy:true,tag:this.id+':central'}]});}
  if(!sources.length)return;this.pendingAttack={kind:'zone',sector:primary.id,sources};this.coastalClock=0;this.phase='gallipoli-zone-'+primary.id;this.command('phase-change',{phase:this.phase,sector:primary.id,supportSector:adjacent?.id});
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
   this.command('muzzle',{...q,partId:s.id});this.hazard({...shot,delay:0,sourceX:q.x,sourceY:q.y,sourcePartId:s.id||undefined});
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
  this.updateRepairs(dt);if(this.coreVulnerable){this.pendingAttack=null;this.launchWarning=false;return;}
  this.updateDefensePhase();this.turnTurrets(dt,players);this.tickSorties(dt);this.launchFlash=Math.max(0,(this.launchFlash||0)-dt);
  if(this.coastalRemaining>0){this.coastalRemaining=Math.max(0,this.coastalRemaining-dt);if(!this.coastalRemaining){this.recoveryRemaining=1.8;this.phase='gallipoli-recovery';this.command('phase-change',{phase:this.phase});}return;}
  if(this.recoveryRemaining>0){this.recoveryRemaining=Math.max(0,this.recoveryRemaining-dt);return;}
  if(this.pendingAttack){this.fireIfAligned(dt);return;}
  this.coastalClock+=dt*Math.min(2,this.t.patternMultiplier||1);if(this.coastalClock<1.2)return;const target=this.target(players);if(!target)return;this.planZone(target);this.fireIfAligned(dt);
 }
}


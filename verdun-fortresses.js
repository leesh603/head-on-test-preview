import {BaseBoss,BossPart} from './headon-stageboss-core.js?v=519&b=326';
import {segmentDistance} from './alps-geometry117.js?v=519&b=326';

// Shared measured geometry for the authored fortress layers, hits and muzzles.
// A fortress is one existing boss body; its core is the body's final hit route.
export const VERDUN_FORT_ENLARGEMENT=1.7;
export const VERDUN_AA_REPAIR_SECONDS=18;
const size=v=>v*VERDUN_FORT_ENLARGEMENT;
const freezeParts=parts=>Object.freeze(parts.map(p=>Object.freeze({...p,...Object.fromEntries(['x','y','w','h','rx','ry','muzzle'].map(k=>[k,size(p[k])]))})));
export const VERDUN_FORT_LAYOUT=Object.freeze({
 'fort-douaumont':Object.freeze({width:size(820),height:size(590),core:Object.freeze({x:0,y:size(10),rx:size(65),ry:size(58)}),parts:freezeParts([
  {id:'heavy-left',x:-154,y:-87,w:146,h:164,rx:56,ry:58,fraction:.12,muzzle:103,art:'heavy',kind:'heavy'},
  {id:'heavy-right',x:154,y:-87,w:146,h:164,rx:56,ry:58,fraction:.12,muzzle:103,art:'heavy',kind:'heavy'},
  {id:'control',x:0,y:-156,w:112,h:90,rx:43,ry:33,fraction:.07,muzzle:0,art:'control',kind:'control'},
  {id:'mg-left',x:-285,y:95,w:92,h:84,rx:33,ry:28,fraction:.06,muzzle:41,art:'mg',kind:'mg'},
  {id:'mg-right',x:285,y:95,w:92,h:84,rx:33,ry:28,fraction:.06,muzzle:41,art:'mg',kind:'mg'},
  {id:'aa-left',x:-276,y:-149,w:100,h:102,rx:36,ry:34,fraction:.06,muzzle:43,art:'aa',kind:'aa'},
  {id:'aa-right',x:275,y:-149,w:100,h:102,rx:36,ry:34,fraction:.06,muzzle:43,art:'aa',kind:'aa'},
  {id:'ammo-left',x:-154,y:110,w:132,h:100,rx:48,ry:35,fraction:.07,muzzle:0,art:'ammo',kind:'ammo',locked:true},
  {id:'ammo-right',x:154,y:110,w:132,h:100,rx:48,ry:35,fraction:.07,muzzle:0,art:'ammo',kind:'ammo',locked:true}
 ])}),
 'fort-souville':Object.freeze({width:size(900),height:size(540),core:Object.freeze({x:0,y:size(162),rx:size(72),ry:size(54)}),parts:freezeParts([
  {id:'bunker-left',x:-333,y:61,w:148,h:118,rx:58,ry:42,fraction:.08,muzzle:57,art:'bunker',kind:'bunker'},
  {id:'bunker-right',x:346,y:61,w:148,h:118,rx:58,ry:42,fraction:.08,muzzle:57,art:'bunker',kind:'bunker'},
  {id:'pit-left',x:-182,y:-56,w:108,h:94,rx:38,ry:32,fraction:.07,muzzle:48,art:'pit',kind:'pit',hidden:true},
  {id:'pit-center',x:15,y:-163,w:108,h:94,rx:38,ry:32,fraction:.07,muzzle:48,art:'pit',kind:'pit',hidden:true},
  {id:'pit-right',x:216,y:-56,w:108,h:94,rx:38,ry:32,fraction:.07,muzzle:48,art:'pit',kind:'pit',hidden:true},
  {id:'observer',x:-95,y:-226,w:92,h:76,rx:33,ry:26,fraction:.075,muzzle:0,art:'observer',kind:'observer'},
  {id:'command',x:165,y:16,w:120,h:98,rx:44,ry:35,fraction:.08,muzzle:0,art:'command',kind:'command'},
  {id:'reserve-left',x:-142,y:136,w:106,h:94,rx:37,ry:32,fraction:.065,muzzle:48,art:'pit',kind:'pit',hidden:true,reserve:true},
  {id:'reserve-right',x:159,y:136,w:106,h:94,rx:37,ry:32,fraction:.065,muzzle:48,art:'pit',kind:'pit',hidden:true,reserve:true},
  {id:'aa-left',x:-329,y:-160,w:100,h:102,rx:36,ry:34,fraction:.04,muzzle:43,art:'aa',kind:'aa'},
  {id:'aa-right',x:339,y:-160,w:100,h:102,rx:36,ry:34,fraction:.04,muzzle:43,art:'aa',kind:'aa'},
  {id:'ammo',x:-13,y:7,w:142,h:106,rx:53,ry:38,fraction:.12,muzzle:0,art:'ammo',kind:'ammo',locked:true}
 ])})
});

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const delta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const turn=(a,b,step)=>a+clamp(delta(b,a),-step,step);
// Reuse the current segment geometry in ellipse space for fast bullet sweeps.
function intersectsEllipse(s,cx,cy,rx,ry){
 rx+=s.radius||0;ry+=s.radius||0;
 return segmentDistance(0,0,((s.previousX??s.x)-cx)/rx,((s.previousY??s.y)-cy)/ry,(s.x-cx)/rx,(s.y-cy)/ry)<=1;
}
export function verdunFortScale(t,kind){
 const layout=VERDUN_FORT_LAYOUT[kind];
 if(!layout)throw new Error('Unknown Verdun fortress');
 if(Number.isFinite(t.verdunScale)&&t.verdunScale>0)return t.verdunScale;
 // The battlefield-sized hull deliberately spans a phone viewport. Flying
 // around its flanks reveals its other sections; do not shrink it to a card.
 return Math.max(.8,Math.min(1,(t.regionalViewWidth||960)/960));
}
export function verdunFortMuzzle(b,p){
 return{x:b.x+p.x+Math.cos(p.angle)*(p.muzzleLength||0),y:b.y+p.y+Math.sin(p.angle)*(p.muzzleLength||0)};
}
export function verdunFortCollapseSites(b){
 const ids=b.kind==='fort-douaumont'?['mg-left','aa-right','heavy-left','ammo-right','control','heavy-right','ammo-left','mg-right','aa-left']:['bunker-left','pit-right','reserve-left','observer','bunker-right','command','reserve-right','pit-center','aa-left','ammo','aa-right','pit-left'];
 const sites=ids.map((id,i)=>{const p=b.parts.get(id);return{partId:id,x:b.x+p.x,y:b.y+p.y,at:i*(3.51/Math.max(1,ids.length-1)),radius:Math.max(28,Math.min(72,p.drawWidth*.55))};});
 const k=b.regionalCore;sites.push({partId:null,x:b.x+k.x,y:b.y+k.y,at:4.15,radius:size(110)*b.fortScale,final:true});
 return sites;
}

class VerdunFortress extends BaseBoss{
 constructor(o,kind){
  const t=o.tuning;for(const key of ['maxHp','damage','bulletSpeed'])if(!Number.isFinite(t?.[key])||t[key]<=0)throw new Error('Current boss tuning required: '+key);
  const cfg=VERDUN_FORT_LAYOUT[kind],scale=verdunFortScale(t,kind);
  super({...o,maxHp:t.maxHp,coreRadius:Math.max(cfg.core.rx,cfg.core.ry)*scale,parts:cfg.parts.map(p=>new BossPart({id:p.id,maxHp:t.maxHp*p.fraction,x:p.x*scale,y:p.y*scale,radius:Math.max(p.rx,p.ry)*scale,hittable:!p.locked&&!p.hidden,kind:p.kind,angle:Math.PI/2}))});
  Object.assign(this,{t,kind,faction:o.faction,fortressBoss:true,ownsMotion129:true,fortScale:scale,regionalScale:scale,coreVulnerable:false,clock:0,cursor:0,rng:o.rng||Math.random});
  this.regionalCore={x:cfg.core.x*scale,y:cfg.core.y*scale,rx:cfg.core.rx*scale,ry:cfg.core.ry*scale};
  for(const d of cfg.parts)Object.assign(this.parts.get(d.id),{localX:d.x,localY:d.y,hitRadiusX:d.rx*scale,hitRadiusY:d.ry*scale,drawWidth:d.w*scale,drawHeight:d.h*scale,muzzleLength:d.muzzle*scale,art:d.art,bodyDamageDealt:0,repairRemaining:0,repairWarned:false,recoil:0,revealed:!d.hidden&&!d.locked,reserve:!!d.reserve,active:!d.reserve,openRemaining:0});
 }
 command(type,spec={}){this.emit({...spec,type,bossId:this.id,faction:this.faction});}
 hazard(kind,spec){this.command('hazard',{kind,damage:this.t.damage,warning:0,duration:kind==='projectile'?3.6:.48,...spec});}
 suppressive(){} // Fortress mounts own every shot; no unrelated central fan.
 tag(id){return this.id+':'+id;}
 cancel(id){this.command('cancel-hazards',{tag:this.tag(id)});}
 target(players){const live=players.filter(p=>p.alive);return live.length?live[this.cursor++%live.length]:null;}
 canRepairAA(p){
  if(this.dead||this.coreVulnerable)return false;
  const ammo=this.parts.get(this.kind==='fort-douaumont'?'ammo-'+(p.id.endsWith('left')?'left':'right'):'ammo');
  return p.kind==='aa'&&!ammo?.destroyed;
 }
 queueAARepair(p){
  if(this.canRepairAA(p)){p.repairRemaining=VERDUN_AA_REPAIR_SECONDS;p.repairWarned=false;p.hittable=false;}
 }
 tickParts(dt){
  this.clock+=dt;
  for(const p of this.parts.values()){
   p.recoil=Math.max(0,p.recoil-dt);p.hitFlash=Math.max(0,(p.hitFlash||0)-dt);
   if(!p.destroyed||!p.repairRemaining)continue;
   if(!this.canRepairAA(p)){p.repairRemaining=0;continue;}
   p.repairRemaining=Math.max(0,p.repairRemaining-dt);
   if(p.repairRemaining<=3&&!p.repairWarned){p.repairWarned=true;this.command('fort-aa-repairing',{partId:p.id,x:this.x+p.x,y:this.y+p.y});}
   if(p.repairRemaining<=1e-8){
    p.repairRemaining=0;p.hp=p.maxHp;p.hittable=true;p.revealed=true;p.salvo=null;p.recoil=0;p.destroyedAt=undefined;
    this.timers.set(p.id,2.2);this.command('fort-aa-restored',{partId:p.id,x:this.x+p.x,y:this.y+p.y});
   }
  }
 }
 changePhase(phase){if(this.phase===phase)return;this.phase=phase;this.command('phase-change',{phase});}
 locateHit(s){
  if(this.dead)return null;
  for(const p of this.parts.values())if(p.hittable&&!p.destroyed&&intersectsEllipse(s,this.x+p.x,this.y+p.y,p.hitRadiusX,p.hitRadiusY))return{partId:p.id};
  const k=this.regionalCore;
  return this.coreVulnerable&&intersectsEllipse(s,this.x+k.x,this.y+k.y,k.rx,k.ry)?{partId:null}:null;
 }
 hitAt(s){const route=this.locateHit(s);return route?this.hit({...route,damage:s.damage}):{damage:0,miss:true};}
 hit(a){
  const result=super.hit(a);
  if(result.damage&&a.partId){
   const p=this.parts.get(a.partId),credit=Math.min(result.damage,Math.max(0,p.maxHp-p.bodyDamageDealt));
   p.bodyDamageDealt+=credit;p.hitFlash=.12;this.hp=Math.max(1,this.hp-credit);result.bodyDamage=credit;
  }
  if(result.bodyDefeated){for(const p of this.parts.values()){this.cancel(p.id);p.hittable=false;p.salvo=null;}this.cancel('final-barrage');}
  return result;
 }
 aim(p,target,dt,speed=1.1){const angle=Math.atan2(target.y-this.y-p.y,target.x-this.x-p.x);p.angle=turn(p.angle,angle,speed*dt);return angle;}
 muzzle(p){const m=verdunFortMuzzle(this,p);p.recoil=.24;this.command('muzzle',{...m,partId:p.id});return m;}
 burst(p,target,count=3,spread=.17){
  const m=this.muzzle(p),n=Math.max(2,Math.min(5,Math.ceil(count*(this.t.projectileDensity||1))));
  for(let i=0;i<n;i++){const a=p.angle+(i-(n-1)/2)*spread;this.hazard('projectile',{...m,vx:Math.cos(a)*this.t.bulletSpeed*.82,vy:Math.sin(a)*this.t.bulletSpeed*.82,radius:3.5,damage:this.t.damage*.48,visual:'verdun-mg',tag:this.tag(p.id),delay:i*.065});}
 }
 landing(target,bounds,lead=.55,radius=43){
  return{x:clamp(target.x+(target.vx||0)*lead,bounds.left+radius+8,bounds.right-radius-8),y:clamp(target.y+(target.vy||0)*lead,bounds.top+radius+8,bounds.bottom-radius-8)};
 }
 shell(p,point,{radius=43,warning=1.7,delay=0,damage=1,visual='verdun-heavy-shell'}={}){
  const m=this.muzzle(p);this.hazard('circle',{...point,sourceX:m.x,sourceY:m.y,radius,warning,delay,damage:this.t.damage*damage,once:true,visual,tag:this.tag(p.id)});
 }
 coreBarrage(dt,players,bounds){
  if(!this.coreVulnerable||!this.due('final-barrage',dt,5.4))return;
  const target=this.target(players);if(!target)return;const radius=clamp(40*this.fortScale,25,40),q=this.landing(target,bounds,.25,radius),k=this.regionalCore;
  for(let i=-1;i<=1;i++)this.hazard('circle',{x:clamp(q.x+i*85*this.fortScale,bounds.left+radius,bounds.right-radius),y:q.y,sourceX:this.x+k.x,sourceY:this.y+k.y,radius,warning:1.8,delay:(i+1)*.16,damage:this.t.damage,once:true,visual:'verdun-core-shell',tag:this.tag('final-barrage')});
 }
}

export class FortDouaumont extends VerdunFortress{
 constructor(o){
  super(o,'fort-douaumont');this.phase='verdun-outer';this.heavyActive=false;
  for(const [id,wait]of [['mg-left',1.5],['mg-right',2.6],['aa-left',3.4],['aa-right',4.7],['heavy-left',1.2],['heavy-right',3.4]])this.timers.set(id,wait);
 }
 flankStarved(side){return this.parts.get('ammo-'+side).destroyed;}
 outerDestroyed(){return ['mg-left','mg-right','aa-left','aa-right'].filter(id=>this.parts.get(id).destroyed).length;}
 reloadInterval(side){return 5.8*(this.flankStarved(side)?1.8:1)*(this.parts.get('control').destroyed?1.25:1);}
 refreshArmor(){
  for(const side of ['left','right']){
   const ammo=this.parts.get('ammo-'+side),open=this.parts.get('heavy-'+side).destroyed||['mg-','aa-'].every(prefix=>this.parts.get(prefix+side).destroyed);
   if(open&&!ammo.revealed){ammo.revealed=true;ammo.hittable=true;this.command('fort-section-exposed',{partId:ammo.id,x:this.x+ammo.x,y:this.y+ammo.y});}
  }
  this.coreVulnerable=['heavy-left','heavy-right','ammo-left','ammo-right'].every(id=>this.parts.get(id).destroyed);
  if(this.coreVulnerable)this.changePhase('verdun-core');
  else if(['ammo-left','ammo-right'].some(id=>this.parts.get(id).revealed))this.changePhase('verdun-ammo');
  else if(this.heavyActive)this.changePhase('verdun-heavy');
 }
 onPartDestroyed(p){
  this.cancel(p.id);p.salvo=null;this.queueAARepair(p);
  if(p.kind==='ammo'){
   const side=p.id.endsWith('left')?'left':'right';this.command('ammo-cookoff',{x:this.x+p.x,y:this.y+p.y});
   for(const prefix of ['mg-','aa-']){const nearby=this.parts.get(prefix+side);if(!nearby.destroyed)this.hit({partId:nearby.id,damage:nearby.maxHp*.65});}
   this.timers.set('heavy-'+side,this.reloadInterval(side));
  }
  if(p.id==='control')for(const side of ['left','right']){const gun=this.parts.get('heavy-'+side);gun.salvo=null;this.cancel(gun.id);this.timers.set(gun.id,this.reloadInterval(side));}
  if(this.outerDestroyed()>=2)this.heavyActive=true;
  this.refreshArmor();
 }
 heavyGun(p,side,dt,players,bounds){
  if(p.destroyed||!this.heavyActive)return;
  const control=!this.parts.get('control').destroyed,target=players.filter(q=>q.alive)[(p.targetCursor||0)%Math.max(1,players.filter(q=>q.alive).length)];if(!target)return;
  if(p.salvo){
   const q=p.salvo;p.angle=turn(p.angle,q.angle,.63*dt);q.remaining-=dt;
   if(q.remaining<=0&&Math.abs(delta(p.angle,q.angle))<.16){
    const n=control&&!this.flankStarved(side)?2:1,radius=clamp(48*this.fortScale,28,48);
    for(let i=0;i<n;i++)this.shell(p,{x:clamp(q.x+(i-(n-1)/2)*75*this.fortScale,bounds.left+radius,bounds.right-radius),y:q.y},{radius,warning:control?1.65:2.05,delay:i*.22,damage:1.35});
    p.salvo=null;p.targetCursor=(p.targetCursor||0)+1;this.command('heavy-gun-fired',{partId:p.id});
   }
  }else{
   this.aim(p,target,dt,.48);
   if(this.due(p.id,dt,this.reloadInterval(side))){const radius=clamp(48*this.fortScale,28,48),q=this.landing(target,bounds,control?.8:.12,radius);p.salvo={...q,remaining:.7,angle:Math.atan2(q.y-this.y-p.y,q.x-this.x-p.x)};}
  }
 }
 update(dt,{players,bounds}){
  if(this.dead)return;this.tickParts(dt);
  if(!this.heavyActive&&(this.clock>=9||this.outerDestroyed()>=2)){this.heavyActive=true;this.refreshArmor();}
  for(const side of ['left','right']){
   const starved=this.flankStarved(side),mg=this.parts.get('mg-'+side),aa=this.parts.get('aa-'+side),target=players.find(q=>q.alive);
   if(target&&!mg.destroyed){this.aim(mg,target,dt,1.35);if(this.due(mg.id,dt,starved?4.8:2.9)&&Math.abs(delta(mg.angle,Math.atan2(target.y-this.y-mg.y,target.x-this.x-mg.x)))<.3)this.burst(mg,target,starved?2:4,.07);}
   if(target&&!aa.destroyed){this.aim(aa,target,dt,.8);if(this.due(aa.id,dt,starved?6.5:4.2)){const r=clamp(35*this.fortScale,23,35),q=this.landing(target,bounds,.4,r);this.shell(aa,q,{radius:r,warning:1.45,damage:.8,visual:'verdun-aa-shell'});}}
   this.heavyGun(this.parts.get('heavy-'+side),side,dt,players,bounds);
  }
  this.coreBarrage(dt,players,bounds);
 }
}

export class FortSouville extends VerdunFortress{
 constructor(o){
  super(o,'fort-souville');this.phase='verdun-ambush';this.pitCursor=0;this.reserveCursor=0;this.observerWave=0;
  this.timers.set('pit-open',1.1);this.timers.set('observer',4.3);this.timers.set('command',10.5);this.timers.set('bunker-left',2.1);this.timers.set('bunker-right',3.6);this.timers.set('aa-left',3.4);this.timers.set('aa-right',4.7);
 }
 initialDamageCount(){return ['bunker-left','bunker-right','pit-left','pit-center','pit-right','observer','command'].filter(id=>this.parts.get(id).destroyed).length;}
 refreshRuin(){
  const ammo=this.parts.get('ammo'),breached=this.initialDamageCount()>=4||(this.parts.get('observer').destroyed&&this.parts.get('command').destroyed);
  if(breached&&!ammo.revealed){ammo.revealed=true;ammo.hittable=true;this.command('fort-section-exposed',{partId:ammo.id,x:this.x+ammo.x,y:this.y+ammo.y});}
  this.coreVulnerable=breached&&ammo.destroyed;
  if(this.coreVulnerable)this.changePhase('verdun-underground');else if(ammo.revealed)this.changePhase('verdun-ruin-breach');else if(this.parts.get('observer').destroyed)this.changePhase('verdun-observer-lost');
 }
 onPartDestroyed(p){
  this.cancel(p.id);p.salvo=null;p.openRemaining=0;this.queueAARepair(p);
  if(p.id==='observer'){this.cancel('observer');this.observerLock=null;}
  if(p.id==='command')this.cancel('command');
  if(p.id==='ammo'){
   this.command('ammo-cookoff',{x:this.x+p.x,y:this.y+p.y});
   for(const id of ['pit-center','reserve-left','reserve-right']){const nearby=this.parts.get(id);if(nearby.active&&!nearby.destroyed){nearby.hittable=true;nearby.revealed=true;nearby.openRemaining=4.5;this.hit({partId:id,damage:nearby.maxHp*.7});}}
  }
  this.refreshRuin();
 }
 openPit(p,players,bounds){
  if(p.destroyed||!p.active)return;
  const target=this.target(players);if(!target)return;
  p.revealed=true;p.hittable=true;p.openRemaining=3.8;
  const radius=clamp(39*this.fortScale,25,39),q=this.landing(target,bounds,.45,radius);
  p.salvo={...q,remaining:1.05,angle:Math.atan2(q.y-this.y-p.y,q.x-this.x-p.x)};
  this.command('fort-pit-open',{partId:p.id,x:this.x+p.x,y:this.y+p.y,seconds:p.openRemaining});
 }
 observerBarrage(players,bounds){
  if(this.parts.get('observer').destroyed)return;
  const target=this.target(players);if(!target)return;
  const r=clamp(43*this.fortScale,26,43),q=this.landing(target,bounds,.65,r),w=bounds.right-bounds.left,side=this.observerWave++%2;
  this.observerLock={...q,at:this.clock};
  const n=this.parts.get('ammo').destroyed?2:4;
  for(let i=0;i<n;i++)this.hazard('circle',{x:clamp(q.x+(i-(n-1)/2)*82*this.fortScale,bounds.left+r,bounds.right-r),y:clamp(q.y+(i%2)*46*this.fortScale,bounds.top+r,bounds.bottom-r),sourceX:bounds.left+(side?w+110:-110),sourceY:bounds.top-120,radius:r,warning:2.15,delay:i*.24,damage:this.t.damage*1.2,once:true,visual:'verdun-offscreen-shell',tag:this.tag('observer')});
 }
 update(dt,{players,bounds}){
  if(this.dead)return;this.tickParts(dt);
  const command=!this.parts.get('command').destroyed;
  if(command&&this.due('command',dt,11.5)){
   const reserve=['reserve-left','reserve-right'].map(id=>this.parts.get(id)).find(p=>!p.active&&!p.destroyed);
   if(reserve){reserve.active=true;this.openPit(reserve,players,bounds);this.command('fort-reserve-active',{partId:reserve.id,x:this.x+reserve.x,y:this.y+reserve.y});}
  }
  if(this.due('pit-open',dt,command?3.8:5.5)){
   const pits=['pit-left','pit-center','pit-right','reserve-left','reserve-right'].map(id=>this.parts.get(id)).filter(p=>p.active&&!p.destroyed);
   if(pits.length)this.openPit(pits[this.pitCursor++%pits.length],players,bounds);
  }
  for(const p of this.parts.values()){
   if(p.kind!=='pit'||p.destroyed||!p.active)continue;
   if(p.openRemaining>0){p.openRemaining=Math.max(0,p.openRemaining-dt);
    if(p.salvo){const q=p.salvo;p.angle=turn(p.angle,q.angle,1.3*dt);q.remaining-=dt;
     if(q.remaining<=0&&Math.abs(delta(p.angle,q.angle))<.2){this.shell(p,q,{radius:clamp(39*this.fortScale,25,39),warning:1.55,damage:1.1,visual:'verdun-ambush-shell'});p.salvo=null;}}
    if(p.openRemaining<=0){p.revealed=false;p.hittable=false;p.salvo=null;}
   }
  }
  for(const id of ['bunker-left','bunker-right']){const p=this.parts.get(id),target=players.find(q=>q.alive);if(!p.destroyed&&target){this.aim(p,target,dt,.95);if(this.due(id,dt,this.parts.get('ammo').destroyed?5.3:3.2))this.burst(p,target,3,.09);}}
  for(const id of ['aa-left','aa-right']){
   const p=this.parts.get(id),target=players.find(q=>q.alive);
   if(!p.destroyed&&target){this.aim(p,target,dt,.8);if(this.due(id,dt,4.8)){
    const r=clamp(35*this.fortScale,23,35);this.shell(p,this.landing(target,bounds,.4,r),{radius:r,warning:1.55,damage:.8,visual:'verdun-aa-shell'});
   }}
  }
  if(!this.parts.get('observer').destroyed&&this.due('observer',dt,this.parts.get('ammo').destroyed?9.8:6.4))this.observerBarrage(players,bounds);
  this.coreBarrage(dt,players,bounds);
 }
}

export function verdunFortExtents(b){const cfg=VERDUN_FORT_LAYOUT[b.kind],scale=b.fortScale||1;return{halfWidth:cfg.width*scale/2,halfHeight:cfg.height*scale/2};}

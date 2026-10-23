import {shellMarch} from './boss-raid-strikes.js?v=tame3&rail=40';
import {fireFanSalvo} from './boss-salvo-geometry.js?boss=20261020b';
import {BaseBoss,BossPart} from './headon-stageboss-core.js?v=tame3&ai=1018&sig=1019&boss=20261020b&phase=1021&harbor=20261021';
import {intersectsEllipse} from './regional-boss-layout352.js?v=tame3';
import {CITY_FLAK_SCALE,CITY_FLAK_WEAPONS} from './city-flak-geometry.js?v=qf1023';
export const CITY_FLAK_PARTS=Object.freeze([
 {id:'siege',x:-73,y:-75,radius:34,fraction:.16},
 {id:'ears',x:74,y:-75,radius:32,fraction:.10},
 {id:'gun-bl',x:-74,y:75,radius:32,fraction:.12},
 {id:'gun-br',x:71,y:74,radius:32,fraction:.12}
]);
const delta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const turn=(a,b,step)=>a+Math.max(-step,Math.min(step,delta(b,a)));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class CityFlakCell extends BaseBoss{
 constructor(o){
  const s=(o.tuning.cityScale||1)*CITY_FLAK_SCALE;
  super({...o,maxHp:o.tuning.maxHp,coreRadius:44*s,parts:CITY_FLAK_PARTS.map(p=>new BossPart({...p,x:p.x*s,y:p.y*s,radius:p.radius*s,maxHp:o.tuning.maxHp*p.fraction,angle:-Math.PI/2}))});
  this.t=o.tuning;this.faction=o.faction;this.kind='flak-tower-cell';this.ownsMotion129=true;this.regionalScale=s;this.coreVulnerable=false;this.phase='listening';this.lockProgress=0;this.shellLock=null;this.cursor=o.index||0;this.index=o.index||0;this.blindStep=0;
  this.timers.set('siege',3.5+this.index*1.8);this.timers.set('gun-bl',2.4+this.index*.55);this.timers.set('gun-br',3.3+this.index*.55);
 }
 command(type,spec={}){this.emit({...spec,type,bossId:this.id,faction:this.faction});}
 hazard(kind,spec){this.command('hazard',{kind,damage:this.t.damage,duration:4,warning:0,...spec});}
 suppressive(){}
 muzzle(p){const n=(CITY_FLAK_WEAPONS[p.id]?.muzzle||0)*this.regionalScale;return{x:this.x+p.x+Math.cos(p.angle)*n,y:this.y+p.y+Math.sin(p.angle)*n};}
 locateHit(s){for(const p of this.parts.values())if(!p.destroyed&&intersectsEllipse(s,this.x+p.x,this.y+p.y,p.radius,p.radius))return{partId:p.id};return this.coreVulnerable&&intersectsEllipse(s,this.x,this.y,this.coreRadius,this.coreRadius)?{partId:null}:null;}
 hitAt(s){const route=this.locateHit(s);return route?this.hit({...route,damage:s.damage}):{damage:0,miss:true};}
 hit(a){
  const r=super.hit(a);
  if(a.partId&&r.damage){const transfer=Math.min(this.hp,r.damage*.8);this.hp-=transfer;r.bodyDamage=transfer;if(this.hp<=0&&!this.dead){this.dead=true;this.phase='defeated';r.bodyDefeated=true;this.command('body-defeated');}}
  if(this.dead){this.shellLock=null;this.command('cancel-hazards',{tag:this.id+'-shell'});}
  return r;
 }
 onPartDestroyed(p){
  this.command('cancel-hazards',{tag:this.id+'-'+p.id});
  if(p.id==='siege'||p.id==='ears'){this.shellLock=null;this.lockProgress=0;this.command('cancel-hazards',{tag:this.id+'-shell'});}
  const lost=[...this.parts.values()].filter(p=>p.destroyed).length;
  if(lost>=2){this.coreVulnerable=true;this.phase='exposed';}
  else if(p.id==='ears')this.phase='flak-deaf';
  if(['siege','gun-bl','gun-br'].every(id=>this.parts.get(id).destroyed)){this.coreVulnerable=true;this.hp=Math.min(this.hp,this.maxHp*.18);this.phase='weapons-lost';this.shellLock=null;}
  this.command('phase-change',{phase:this.phase});
 }
 planShell(x,y,mode='tracked'){
  // The synchronized city barrage outranks a tower's own tracked shot, so the
  // corridor gate is never left with a silently missing shell.
  if(this.dead||this.parts.get('siege').destroyed||this.shellLock&&!(mode==='corridor'&&this.shellLock.mode!=='corridor'))return false;
  if(mode==='tracked'&&this.parts.get('ears').destroyed)return false;
  this.shellLock={x,y,mode,remaining:.9,age:0};return true;
 }
 network(dt,players,bounds){
  const cells=[...this.encounter?.bodies.values()||[]].filter(b=>b.kind==='flak-tower-cell'&&!b.dead).sort((a,b)=>a.index-b.index);if(cells[0]!==this)return;
  const net=this.encounter.cityFlakState??={phase:'observing',age:0,wave:0,fresh:true};net.age+=dt;
  const start=()=>{const observers=cells.filter(c=>!c.parts.get('ears').destroyed),heavies=cells.filter(c=>!c.parts.get('siege').destroyed),list=players.filter(p=>p.alive);
   net.observerId=observers.length?observers[net.wave%observers.length].id:null;const heavyPool=heavies.filter(c=>c.id!==net.observerId);net.heavyId=(heavyPool[net.wave%Math.max(1,heavyPool.length)]||heavies[0])?.id||null;
   net.targetId=list[net.wave%Math.max(1,list.length)]?.id||null;net.precision=false;net.heavyFired=false;net.limitFired=new Set();net.fresh=false;
   for(const c of cells)c.networkRole=c.id===net.observerId?'observer':c.id===net.heavyId?'heavy-gun':'route-limiter';
   this.command('phase-change',{phase:'qf-observing'});
  };
  if(net.fresh)start();
  const target=players.find(p=>p.alive&&p.id===net.targetId)||players.find(p=>p.alive);
  if(net.phase==='observing'&&net.age>=2.5){const observer=cells.find(c=>c.id===net.observerId);net.precision=!!observer&&!observer.parts.get('ears').destroyed&&observer.lockProgress>=.65;
   if(target){const lead=net.precision?.62:.18;net.x=clamp(target.x+(target.vx||0)*lead,bounds.left+45,bounds.right-45);net.y=clamp(target.y+(target.vy||0)*lead,bounds.top+45,bounds.bottom-45);}net.phase='aiming';net.age=0;this.command('phase-change',{phase:net.precision?'qf-precision-aim':'qf-limited-aim'});
  }else if(net.phase==='aiming'&&net.age>=2.15){net.phase='limiting-routes';net.age=0;this.command('phase-change',{phase:'qf-limiting-routes'});
  }else if(net.phase==='limiting-routes'&&net.age>=2.25){net.phase='relief';net.age=0;this.command('phase-change',{phase:'qf-relief'});
  }else if(net.phase==='relief'&&net.age>=1.85){net.phase='observing';net.age=0;net.wave++;net.fresh=true;start();}
  const heavy=cells.find(c=>c.id===net.heavyId);if(net.phase==='aiming'&&(!heavy||heavy.parts.get('siege').destroyed)){const replacement=cells.find(c=>!c.parts.get('siege').destroyed&&c.id!==net.observerId)||cells.find(c=>!c.parts.get('siege').destroyed);net.heavyId=replacement?.id||null;
   for(const c of cells)c.networkRole=c.id===net.observerId?'observer':c.id===net.heavyId?'heavy-gun':'route-limiter';}
 }
 fireNetworkHeavy(net){const siege=this.parts.get('siege');if(net.heavyFired||siege.destroyed||!Number.isFinite(net.x+net.y))return;const aim=Math.atan2(net.y-this.y-siege.y,net.x-this.x-siege.x);if(Math.abs(delta(aim,siege.angle))>.12)return;
  const from=this.muzzle(siege),warning=net.precision?1.25:1.85,attackScale=this.regionalScale/CITY_FLAK_SCALE;this.hazard('circle',{x:net.x,y:net.y,sourceX:from.x,sourceY:from.y,sourcePartId:'siege',radius:Math.max(32,58*attackScale),warning,duration:.48,once:true,damage:this.t.damage*1.35,visual:'city-flak-shell',tag:this.id+'-shell'});
  if(net.precision)shellMarch(this,{source:from,partId:'siege',target:{x:net.x,y:net.y,vx:0,vy:0},rows:2,step:90,radius:Math.max(38,58*attackScale),warning:1.55,beat:.48,visual:'city-flak-shell',tag:this.id+'-shell'});
  this.command('muzzle',{...from,partId:'siege'});net.heavyFired=true;
 }
 fireRouteLimit(net,players,dt){if(net.limitFired.has(this.id))return;const list=players.filter(p=>p.alive),target=list[(net.wave+this.index)%Math.max(1,list.length)];if(!target)return;
  const ids=this.index%2?['gun-br','gun-bl']:['gun-bl','gun-br'],p=ids.map(id=>this.parts.get(id)).find(p=>!p.destroyed);if(!p)return;const aim=Math.atan2(target.y-this.y-p.y,target.x-this.x-p.x);p.angle=turn(p.angle,aim,2.2*dt);if(Math.abs(delta(aim,p.angle))>.18)return;
  const from=this.muzzle(p);if(fireFanSalvo(this,{...from,angle:p.angle,speed:this.t.bulletSpeed*.78,damage:this.t.damage*.55,visual:'city-mg',tag:this.id+'-'+p.id,sourcePartId:p.id,count:9,spread:.9,beats:2,beat:.48,warning:.85,gapIndex:this.index%2?6:2,step:this.index%2?-1:1})){this.command('muzzle',{...from,partId:p.id});net.limitFired.add(this.id);}
 }
 counterWindow(){return this.encounter?.cityFlakState?.phase==='relief'?1.4:super.counterWindow();}
 update(dt,{players,bounds}){
  if(this.dead)return;const list=players.filter(p=>p.alive);if(!list.length)return;
  this.basicHoldUntil=(this.combatTime||0)+dt+.1;if(this.encounter?.breath)return;const ears=this.parts.get('ears'),siege=this.parts.get('siege');this.network(dt,players,bounds);const net=this.encounter?.cityFlakState,target=list.find(p=>p.id===net?.targetId)||list[0];
  if(!ears.destroyed&&this.networkRole==='observer'&&net?.phase==='observing'){const aim=Math.atan2(target.y-this.y-ears.y,target.x-this.x-ears.x);ears.angle=turn(ears.angle,aim,1.5*dt);this.lockProgress=Math.max(0,Math.min(1.4,this.lockProgress+(Math.abs(delta(aim,ears.angle))<.35?dt:-dt*1.6)));}else this.lockProgress=Math.max(0,this.lockProgress-dt*1.6);
  if(!siege.destroyed&&this.id===net?.heavyId&&net.phase==='aiming'){const aim=Math.atan2(net.y-this.y-siege.y,net.x-this.x-siege.x);siege.angle=turn(siege.angle,aim,1.7*dt);this.fireNetworkHeavy(net);}
  if(this.networkRole==='route-limiter'&&net?.phase==='limiting-routes')this.fireRouteLimit(net,players,dt);
 }
}
export class FlakTowerNet extends BaseBoss{
 constructor(o){super({...o,maxHp:o.tuning.maxHp});this.t=o.tuning;this.faction=o.faction;this.rng=o.rng;this.networkEmit=o.emit;this.kind='flak-tower';this.phase='deploy';this.coreVulnerable=false;this.ownsMotion129=true;this.stateAge=0;}
 suppressive(){}
 update(dt){
  this.stateAge+=dt;if(this.stateAge<.6)return;
  if(!this.encounter)throw new Error('City tower network needs an encounter');
  const w=this.t.regionalViewWidth||960,h=this.t.regionalViewHeight||700,s=Math.max(.32,Math.min(1,(w-48)/840,(h-100)/820));
  // The four towers hold the corners of a combat area deliberately wider than
  // one screen — they are meant to be hunted one at a time, not fought bunched.
  const mx=Math.max(280*s,w*.56),my=Math.max(280*s,h*.52);
  const children=[[-1,-1],[1,-1],[-1,1],[1,1]].map(([sx,sy],index)=>new CityFlakCell({id:this.id+'-t'+index,index,x:this.x+sx*(mx+(this.rng?this.rng()-.5:0)*60*s),y:this.y+sy*(my+(this.rng?this.rng()-.5:0)*60*s),faction:this.faction,emit:this.networkEmit,tuning:{...this.t,maxHp:this.hp/4,cityScale:s}}));
  this.encounter.replaceBody(this.id,children);this.emit({type:'phase-change',bossId:this.id,phase:'city-network-deployed',faction:this.faction});
 }
}


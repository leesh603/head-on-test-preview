import {BaseBoss,BossPart} from './headon-stageboss-core.js?v=469';
import {intersectsEllipse} from './regional-boss-layout352.js?v=469';
export const CITY_FLAK_PARTS=Object.freeze([
 {id:'siege',x:-74,y:-101,radius:34,fraction:.16},
 {id:'ears',x:77,y:-96,radius:32,fraction:.10},
 {id:'gun-bl',x:-77,y:70,radius:32,fraction:.12},
 {id:'gun-br',x:74,y:72,radius:32,fraction:.12}
]);
const delta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const turn=(a,b,step)=>a+Math.max(-step,Math.min(step,delta(b,a)));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class CityFlakCell extends BaseBoss{
 constructor(o){
  const s=o.tuning.cityScale||1;
  super({...o,maxHp:o.tuning.maxHp,coreRadius:44*s,parts:CITY_FLAK_PARTS.map(p=>new BossPart({...p,x:p.x*s,y:p.y*s,radius:p.radius*s,maxHp:o.tuning.maxHp*p.fraction,angle:-Math.PI/2}))});
  this.t=o.tuning;this.faction=o.faction;this.kind='flak-tower-cell';this.ownsMotion129=true;this.regionalScale=s;this.coreVulnerable=false;this.phase='listening';this.lockProgress=0;this.shellLock=null;this.cursor=o.index||0;this.index=o.index||0;this.blindStep=0;
  this.timers.set('siege',3.5+this.index*1.8);this.timers.set('gun-bl',2.4+this.index*.55);this.timers.set('gun-br',3.3+this.index*.55);
 }
 command(type,spec={}){this.emit({...spec,type,bossId:this.id,faction:this.faction});}
 hazard(kind,spec){this.command('hazard',{kind,damage:this.t.damage,duration:4,warning:0,...spec});}
 suppressive(){}
 muzzle(p){const n=30*this.regionalScale;return{x:this.x+p.x+Math.cos(p.angle)*n,y:this.y+p.y+Math.sin(p.angle)*n};}
 locateHit(s){for(const p of this.parts.values())if(!p.destroyed&&intersectsEllipse(s,this.x+p.x,this.y+p.y,p.radius,p.radius))return{partId:p.id};return this.coreVulnerable&&intersectsEllipse(s,this.x,this.y,this.coreRadius,this.coreRadius)?{partId:null}:null;}
 hitAt(s){const route=this.locateHit(s);return route?this.hit({...route,damage:s.damage}):{damage:0,miss:true};}
 hit(a){
  const r=super.hit(a);
  if(a.partId&&r.damage){const transfer=Math.min(this.hp,r.damage*.8);this.hp-=transfer;r.bodyDamage=transfer;if(this.hp<=0&&!this.dead){this.dead=true;this.phase='defeated';r.bodyDefeated=true;this.command('body-defeated');}}
  if(this.dead){this.shellLock=null;this.command('cancel-hazards',{tag:this.id+'-shell'});}
  return r;
 }
 onPartDestroyed(p){
  if(p.id==='siege'||p.id==='ears'){this.shellLock=null;this.lockProgress=0;this.command('cancel-hazards',{tag:this.id+'-shell'});}
  const lost=[...this.parts.values()].filter(p=>p.destroyed).length;
  if(lost>=2){this.coreVulnerable=true;this.phase='exposed';}
  else if(p.id==='ears')this.phase='flak-deaf';
  this.command('phase-change',{phase:this.phase});
 }
 planShell(x,y,mode='tracked'){
  if(this.dead||this.parts.get('siege').destroyed||this.shellLock)return false;
  if(mode==='tracked'&&this.parts.get('ears').destroyed)return false;
  this.shellLock={x,y,mode,remaining:.9,age:0};return true;
 }
 network(dt,bounds){
  const cells=[...this.encounter?.bodies.values()||[]].filter(b=>b.kind==='flak-tower-cell'&&!b.dead);
  if(cells[0]!==this)return;
  const net=this.encounter.cityFlakState??={remaining:11,wave:0};net.remaining-=dt;
  if(net.remaining>0)return;net.remaining=12;net.wave++;
  const cx=(bounds.left+bounds.right)/2,cy=(bounds.top+bounds.bottom)/2,w=bounds.right-bounds.left,gate=[-.20,.20,0][net.wave%3]*w+cx,gap=Math.min(150,w*.26);
  for(const cell of cells){if(cell.parts.get('ears').destroyed)continue;const side=cell.index%2?-1:1,x=clamp(gate+side*(gap/2+65),bounds.left+35,bounds.right-35),y=cy+(cell.index<2?-95:95)*cell.regionalScale;cell.planShell(x,y,'corridor');}
  this.command('phase-change',{phase:'city-cross-barrage'});
 }
 update(dt,{players,bounds}){
  if(this.dead)return;const list=players.filter(p=>p.alive);if(!list.length)return;
  const target=list[this.cursor%list.length],ears=this.parts.get('ears'),siege=this.parts.get('siege'),s=this.regionalScale;
  const lost=[...this.encounter?.bodies.values()||[]].filter(b=>b.kind==='flak-tower-cell'&&b.dead).length,enrage=Math.min(1.4,1+lost*.13);
  if(!ears.destroyed){const aim=Math.atan2(target.y-this.y-ears.y,target.x-this.x-ears.x);ears.angle=turn(ears.angle,aim,1.05*dt);this.lockProgress=Math.max(0,Math.min(1.4,this.lockProgress+(Math.abs(delta(aim,ears.angle))<.35?dt:-dt*1.6)));}else this.lockProgress=0;
  this.network(dt,bounds);
  if(!siege.destroyed){
   if(this.shellLock){const q=this.shellLock;const aim=Math.atan2(q.y-this.y-siege.y,q.x-this.x-siege.x);siege.angle=turn(siege.angle,aim,.85*dt);q.remaining-=dt;q.age+=dt;
    if(q.remaining<=0&&Math.abs(delta(aim,siege.angle))<.08){const from=this.muzzle(siege);this.hazard('circle',{x:q.x,y:q.y,...{sourceX:from.x,sourceY:from.y},radius:Math.max(32,58*s),warning:1.35,duration:.48,once:true,damage:this.t.damage*1.35,visual:'city-flak-shell',tag:this.id+'-shell'});this.command('muzzle',{...from,partId:'siege'});this.shellLock=null;this.cursor++;this.timers.set('siege',5.6/enrage);}
    else if(q.age>5.5)this.shellLock=null;
   }else if(this.due('siege',dt,5.6/enrage)){
    if(!ears.destroyed&&this.lockProgress>=1.4)this.planShell(clamp(target.x+(target.vx||0)*.45,bounds.left+35,bounds.right-35),clamp(target.y+(target.vy||0)*.45,bounds.top+35,bounds.bottom-35));
    else if(ears.destroyed){const a=[Math.PI/2,Math.PI/2-.7,Math.PI/2+.7][this.blindStep++%3];this.planShell(this.x+Math.cos(a)*250*s,this.y+Math.sin(a)*250*s,'blind');}
   }
  }
  for(const id of ['gun-bl','gun-br']){
   const p=this.parts.get(id);if(p.destroyed)continue;p.targetCursor??=this.index+(id==='gun-br'?1:0);const gunTarget=list[p.targetCursor%list.length],aim=Math.atan2(gunTarget.y-this.y-p.y,gunTarget.x-this.x-p.x);p.angle=turn(p.angle,aim,1.45*dt);
   if(this.due(id,dt,(id==='gun-bl'?4.2:5.3)/enrage)&&Math.abs(delta(aim,p.angle))<.35){const from=this.muzzle(p),count=Math.max(3,Math.min(9,Math.ceil(5*(this.t.projectileDensity||1))));for(let i=0;i<count;i++){const a=p.angle+(i-(count-1)/2)*.11;this.hazard('projectile',{...from,vx:Math.cos(a)*this.t.bulletSpeed*.88,vy:Math.sin(a)*this.t.bulletSpeed*.88,radius:4,damage:this.t.damage*.55,duration:4.2,visual:'city-mg',tag:this.id+'-'+id});}this.command('muzzle',{...from,partId:id});p.targetCursor++;}
  }
 }
}
export class FlakTowerNet extends BaseBoss{
 constructor(o){super({...o,maxHp:o.tuning.maxHp});this.t=o.tuning;this.faction=o.faction;this.rng=o.rng;this.kind='flak-tower';this.phase='deploy';this.coreVulnerable=false;this.ownsMotion129=true;this.stateAge=0;}
 suppressive(){}
 update(dt){
  this.stateAge+=dt;if(this.stateAge<.6)return;
  if(!this.encounter)throw new Error('City tower network needs an encounter');
  const s=Math.max(.32,Math.min(1,((this.t.regionalViewWidth||960)-48)/840,((this.t.regionalViewHeight||700)-100)/820));
  const children=[[-230,-220],[230,-220],[-230,220],[230,220]].map(([x,y],index)=>new CityFlakCell({id:this.id+'-t'+index,index,x:this.x+x*s,y:this.y+y*s,faction:this.faction,emit:this.emit,tuning:{...this.t,maxHp:this.hp/4,cityScale:s}}));
  this.encounter.replaceBody(this.id,children);this.emit({type:'phase-change',bossId:this.id,phase:'city-network-deployed',faction:this.faction});
 }
}

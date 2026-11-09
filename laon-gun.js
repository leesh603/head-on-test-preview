import {BaseBoss,BossPart} from './headon-stageboss-core.js?v=09c75d146ae4289d';
import {LAON_LAYOUT,LAON_MISSION,LAON_NORMAL_CYCLE_SECONDS,LAON_CRITICAL_PARTS,laonPartState,sweptLaonEllipse} from './laon-layout.js?v=09c75d146ae4289d';

const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const PHASES=Object.freeze(['loading','ready','recoil','return','reload']);

export class ParisGeschuetz extends BaseBoss {
 constructor(o){
  const t=o.tuning||{},maxHp=t.maxHp||o.maxHp||1000,scale=t.geometryScale||1;
  const parts=LAON_LAYOUT.parts.map(p=>new BossPart({...p,x:p.x*scale,y:p.y*scale,radius:Math.min(p.rx,p.ry)*scale,maxHp:maxHp*p.hp}));
  super({...o,maxHp,coreRadius:25*scale,parts});
  Object.assign(this,{kind:'paris-geschuetz',faction:o.faction||'central',friendly:!!o.friendly,t,scale,layout:LAON_LAYOUT,ownsMotion129:true,
   coreVulnerable:true,clock:0,phase:'loading',phaseAge:0,phaseProgress:0,loaderProgress:0,recoil:0,shotCount:0,flash:0,smoke:0,
   aaClock:0,aaShots:[],lastShotAt:null,loadingCue:false,stageClock:0});
  for(const p of this.parts.values()){const row=LAON_LAYOUT.parts.find(q=>q.id===p.id);Object.assign(p,{localX:p.x,localY:p.y,rx:row.rx*scale,ry:row.ry*scale,damageState:0});}
 }
 command(type,detail={}){this.emit({...detail,type,bossId:this.id,faction:this.faction});}
 hpFloor(){return 0;}
 partFloor(){return 0;}
 hurry(){return null;} // Strategic gunnery never accelerates to pay a combat gate.
 suppressive(){}
 partState(id){return laonPartState(this.parts.get(id));}
 loadMultiplier(){return [1,1.45,2.25][this.partState('loader')]*[1,1.3,1.8][this.partState('ammo')];}
 static normalReturnSeconds=2.3;
 returnSeconds(){return [ParisGeschuetz.normalReturnSeconds,4.6,8][this.partState('recoil')];}
 static reloadSeconds=LAON_NORMAL_CYCLE_SECONDS-10.5-1.5-.34-ParisGeschuetz.normalReturnSeconds;
 phaseSeconds(phase=this.phase){return phase==='loading'?10.5*this.loadMultiplier():phase==='ready'?1.5:phase==='recoil'?.34:phase==='return'?this.returnSeconds():phase==='reload'?ParisGeschuetz.reloadSeconds*this.loadMultiplier():Infinity;}
 cycleSeconds(){return (10.5+ParisGeschuetz.reloadSeconds)*this.loadMultiplier()+1.5+this.returnSeconds()+.34;}
 muzzle(){return{x:this.x,y:this.y+(LAON_LAYOUT.muzzle.y+this.recoil)*this.scale};}
 coreOffset(){return{x:0,y:(-20+this.recoil)*this.scale};}
 syncParts(){for(const p of this.parts.values()){p.x=p.localX;p.y=p.localY+(LAON_CRITICAL_PARTS.includes(p.id)?this.recoil*this.scale:0);}}
 lastShotNumber(){return this.friendly?LAON_MISSION.shots:LAON_MISSION.attackShotLimit;}
 transition(phase){this.phase=phase;this.phaseAge=0;this.phaseProgress=0;this.loadingCue=false;this.command('laon-phase',{phase,seconds:this.phaseSeconds(),shotCount:this.shotCount,finalShot:phase==='ready'&&this.shotCount+1===this.lastShotNumber()});}
 fire(){
  if(this.dead||LAON_CRITICAL_PARTS.some(id=>this.parts.get(id).destroyed))return false;
  this.shotCount++;const finalShot=this.shotCount===this.lastShotNumber();this.lastShotAt=this.clock;this.flash=finalShot?.34:.20;this.smoke=1;this.transition('recoil');
  this.command('laon-shot',{...this.muzzle(),shotCount:this.shotCount,clock:this.clock,recoil:LAON_LAYOUT.recoilDistance*this.scale,finalShot});
  return true;
 }
 stop(){
  if(this.dead)return;
  this.hp=0;this.dead=true;this.phase='destroyed';this.phaseAge=0;this.flash=0;this.loaderProgress=0;this.smoke=1;
  for(const id of LAON_CRITICAL_PARTS){const p=this.parts.get(id);p.hp=0;p.damageState=2;p.destroyedAt=this.clock;}
  this.command('cancel-hazards',{tag:this.id+':aa'});this.aaShots.length=0;
  this.command('laon-stopped',{x:this.x,y:this.y,shotCount:this.shotCount,clock:this.clock});
  this.command('body-defeated',{x:this.x,y:this.y});
 }
 hit({partId=null,damage}){
  if(!Number.isFinite(damage)||damage<0)throw new Error('Invalid damage');
  if(this.dead)return{damage:0,blocked:true};
  const p=this.parts.get(partId||'breech');if(!p||!p.hittable||p.destroyed)return{damage:0,blocked:true};
  const previous=this.partState(p.id),dealt=p.hit(damage),destroyed=p.destroyed;
  p.damageState=this.partState(p.id);
  if(LAON_CRITICAL_PARTS.includes(p.id))this.hp=Math.min(this.hp,this.maxHp*p.hp/p.maxHp);
  this.command('laon-part-hit',{partId:p.id,damage:dealt,state:p.damageState,x:this.x+p.x,y:this.y+p.y});
  if(previous!==p.damageState)this.command('laon-part-state',{partId:p.id,state:p.damageState,cycleSeconds:this.cycleSeconds()});
  if(destroyed){p.destroyedAt=this.clock;this.command('part-destroyed',{partId:p.id});this.onPartDestroyed(p);}
  if(LAON_CRITICAL_PARTS.includes(p.id)&&destroyed)this.stop();
  return{damage:dealt,partId:p.id,partDestroyed:destroyed,bodyDefeated:this.dead};
 }
 onPartDestroyed(p){
  if(p.id==='ammo'){
   const blast={x:this.x+p.x,y:this.y+p.y,radius:160*this.scale,damage:this.maxHp*.08};
   this.command('laon-ammo-explosion',blast);
   // A spatial secondary blast can damage nearby mechanism, but never a
   // disconnected facility on the opposite side of the emplacement.
   this.takeObjectiveDamage(blast);
  }
  if(p.kind==='gun')this.command('cancel-hazards',{tag:this.id+':'+p.id,pendingOnly:true});
 }
 locateHit(shot){
  if(this.dead)return null;
  // Narrow critical geometry wins at the centre; the recoil housing does not
  // swallow a shot that visibly crosses the barrel or breech.
  for(const id of ['barrel','breech','loader','ammo','aa-west','aa-east']){
   const p=this.parts.get(id);if(!p.destroyed&&p.hittable&&sweptLaonEllipse(shot,this.x+p.x,this.y+p.y,p.rx,p.ry))return{partId:id};
  }
  const p=this.parts.get('recoil');if(!p.destroyed&&p.hittable){
   for(const side of [-1,1])if(sweptLaonEllipse(shot,this.x+side*25*this.scale,this.y+p.y,7*this.scale,p.ry))return{partId:p.id};
  }
  return null;
 }
 hitAt(shot){const hit=this.locateHit(shot);return hit?this.hit({...hit,damage:shot.damage}):{damage:0,miss:true};}
 takeObjectiveDamage(blast){
  if(this.dead)return[];
  const results=[],r=Math.max(0,blast.radius||0);let critical=null,distance=Infinity;
  for(const p of this.parts.values()){
   if(p.destroyed||!p.hittable)continue;
   const d=Math.hypot(blast.x-this.x-p.x,blast.y-this.y-p.y),inside=sweptLaonEllipse({...blast,radius:0},this.x+p.x,this.y+p.y,p.rx+r,p.ry+r);
   if(!inside)continue;
   if(LAON_CRITICAL_PARTS.includes(p.id)){if(d<distance){critical=p;distance=d;}}
   else results.push(this.hit({partId:p.id,damage:blast.damage}));
  }
  // A single blast cannot double its core damage by overlapping both pieces.
  if(critical&&!this.dead)results.push(this.hit({partId:critical.id,damage:blast.damage}));
  return results;
 }
 updateAA(dt,ctx){
  this.aaClock-=dt;
  const targets=this.friendly?(ctx.laonAirGroup?.planes||[]).filter(p=>!p.destroyed&&p.mode!=='pending').map(p=>({x:ctx.laonAirGroup.x+p.x,y:ctx.laonAirGroup.y+p.y,part:p})):(ctx.players||[]).filter(p=>p.alive);
  if(this.aaClock<=0&&targets.length){
   this.aaClock=3.8;for(const p of this.parts.values())if(p.kind==='gun'&&!p.destroyed){
    const x=this.x+p.x,y=this.y+p.y,target=targets.reduce((a,b)=>Math.hypot(a.x-x,a.y-y)<Math.hypot(b.x-x,b.y-y)?a:b);
    if(Math.hypot(target.x-x,target.y-y)>760*this.scale)continue;
    const angle=Math.atan2(target.y-y,target.x-x);p.angle=angle;p.flash=.12;
    this.command('muzzle',{x,y,partId:p.id});
    if(this.friendly){this.aaShots.push({x,y,vx:Math.cos(angle)*320,vy:Math.sin(angle)*320,age:0,duration:2.6,radius:4,damage:Math.max(8,(ctx.laonAirGroup?.maxHp||1000)*.006),sourcePartId:p.id});}
    else this.command('hazard',{kind:'projectile',x,y,vx:Math.cos(angle)*210,vy:Math.sin(angle)*210,radius:4,warning:.4,duration:3.4,damage:(this.t.damage||18)*.7,visual:'staaken-mg',tag:this.id+':'+p.id,sourcePartId:p.id});
   }
  }
  const group=ctx.laonAirGroup;for(const shot of this.aaShots){shot.previousX=shot.x;shot.previousY=shot.y;shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.age+=dt;
   const hit=group?.locateHit(shot);if(hit){group.hit({...hit,damage:shot.damage});shot.age=shot.duration;}}
  this.aaShots=this.aaShots.filter(s=>s.age<s.duration);
 }
 update(dt,ctx={}){
  if(ctx.paused||!(dt>0)||!Number.isFinite(dt))return;
  // Integrate rather than discard large steps. Paused frames are excluded by
  // the caller; both off-camera cycle and physical recoil use this clock.
  if(this.dead){this.smoke=Math.max(.5,this.smoke-dt*.03);return;}
  let left=dt;while(left>1e-8&&!this.dead){
   const duration=this.phaseSeconds(),step=Math.min(left,Math.max(0,duration-this.phaseAge));
   this.phaseAge+=step;this.clock+=step;this.stageClock=this.clock;left-=step;this.phaseProgress=clamp(this.phaseAge/duration);
   this.flash=Math.max(0,this.flash-step);this.smoke=Math.max(0,this.smoke-step*.035);
   if(this.phase==='loading'){this.loaderProgress=this.partState('loader')===2?0:this.phaseProgress;if(!this.loadingCue){this.loadingCue=true;this.command('laon-loading',{x:this.x-116*this.scale,y:this.y+55*this.scale,damaged:this.partState('loader')});}}
   else if(this.phase==='ready')this.loaderProgress=this.partState('loader')===2?0:1;
   else if(this.phase==='recoil'){const q=this.phaseProgress;this.recoil=LAON_LAYOUT.recoilDistance*(1-(1-q)*(1-q)*(1-q));}
   else if(this.phase==='return'){const q=this.phaseProgress,s=q*q*(3-2*q);this.recoil=LAON_LAYOUT.recoilDistance*(1-s);if(this.partState('recoil')>0)this.recoil+=Math.sin(q*Math.PI*10)*(1-q)*this.partState('recoil')*2;}
   else if(this.phase==='reload'){this.recoil=0;this.loaderProgress=this.partState('loader')===2?0:clamp(this.phaseProgress*.4);}
   this.syncParts();
   if(this.phaseAge+1e-8>=duration){
    if(this.phase==='ready'){if(!this.fire())break;}
    else{const index=PHASES.indexOf(this.phase);this.transition(PHASES[(index+1)%PHASES.length]);}
   }else if(step<=1e-8)break;
  }
  if(!this.dead)this.updateAA(dt,ctx);
  for(const p of this.parts.values())p.flash=Math.max(0,(p.flash||0)-dt);
 }
}

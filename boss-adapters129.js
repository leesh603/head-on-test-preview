import {BaseBoss,BossPart} from './headon-stageboss-core.js?v=213&b=210';
import {RailBossController} from './rail-boss129.js?v=213';
import {StuttgartSupport} from './stuttgart129.js?v=213';

export class RailAdapter extends BaseBoss {
 constructor(o,kind){
  const carHp=(o.tuning.railCarHp||o.tuning.partHp*.85),cars=[
   {id:'car-rear',kind:'rail-car',maxHp:carHp,x:0,y:465,radius:68,hitRadiusY:188,hittable:true},
   {id:'car-middle',kind:'rail-car',maxHp:carHp,x:0,y:310,radius:68,hitRadiusY:188,hittable:false},
   {id:'car-front',kind:'rail-car',maxHp:carHp,x:0,y:155,radius:68,hitRadiusY:188,hittable:false}
  ];
  super({...o,maxHp:o.tuning.maxHp,parts:cars});this.t=o.tuning;this.kind=kind;this.faction=o.faction;this.ownsMotion129=true;
  this.railCarOrder=['car-rear','car-middle','car-front'];this.coreVulnerable=false;this.runawayTriggered129=false;this.derailed129=false;
  const aimSeconds=this.t.warningSeconds||1.9,cycle=this.t.railCycle||8,trackHalfLength=this.t.railHalfLength||560,moveSeconds=this.t.railMoveSeconds||5.2;
  // Stage 1 is a pursuit encounter: keep the train moving across a long visible
  // section before every firing stop. The destructible rail remains fixed in
  // world space and sits on the same route instead of beyond a tiny shuttle.
  this.rail129=new RailBossController({id:this.id,from:{x:this.x,y:this.y-trackHalfLength},to:{x:this.x,y:this.y+trackHalfLength},config:{speed:95*(this.t.motionMultiplier||1),moveSeconds,railHp:this.t.partHp,aimSeconds,reloadSeconds:Math.max(.8,cycle-4.9-aimSeconds),runawaySpeed:185*(this.t.motionMultiplier||1),runawaySeconds:3.2},emit:e=>this.railEvent(e)});
  this.rail129.setRailTarget({x:this.x,y:this.y+Math.min(410,trackHalfLength-120),radius:34});
  const rail=this.rail129;this.parts.set('rail',{id:'rail',kind:'rail',get hp(){return rail.railHp},maxHp:rail.c.railHp,get destroyed(){return rail.broken},get hittable(){return !rail.broken},x:0,y:Math.min(410,trackHalfLength-120),radius:34});
 }
 railEvent(e){
  if(e.type==='aim')this.emit({...e,type:'rail-aim',bossId:this.id});
  if(e.type==='runaway-start'){this.phase='runaway';this.coreVulnerable=false;this.emit({...e,type:'rail-runaway',bossId:this.id});}
  if(e.type==='derail'){this.derailed129=true;this.phase='derailed';this.coreVulnerable=true;this.emit({...e,type:'rail-derail',bossId:this.id});}
  if(e.type==='rail-break')this.emit({...e,type:'rail-break',bossId:this.id});
  if(e.type==='fire'){
   const heavy=this.kind==='lincomparable',count=heavy?1:(this.t.shellCount||5);
   if(heavy){
    this.emit({type:'hazard',bossId:this.id,kind:'circle',x:e.target.x,y:e.target.y,warning:.02,delay:0,duration:.65,once:true,radius:165,damage:this.t.damage*.86,visual:'rail-shell-outer'});
    this.emit({type:'hazard',bossId:this.id,kind:'circle',x:e.target.x,y:e.target.y,warning:.02,delay:0,duration:.65,once:true,radius:92,damage:this.t.damage*.74,visual:'rail-shell'});
    this.emit({type:'hazard',bossId:this.id,kind:'circle',x:e.target.x,y:e.target.y,warning:.04,delay:.5,duration:2.2,once:false,tickInterval:.7,radius:132,damage:this.t.damage*.22,visual:'rail-smoke'});
    this.recoilKick129=55;
   }else for(let i=0;i<count;i++){
    const lead=i/(Math.max(1,count-1)),side=i%2?1:-1;
    this.emit({type:'hazard',bossId:this.id,kind:'circle',x:e.target.x+(e.target.vx||0)*lead*.9+side*(i?24:0),y:e.target.y+(e.target.vy||0)*lead*.9,warning:.02,delay:i*.16,duration:.65,once:true,radius:108,damage:this.t.damage,visual:'rail-shell'});
   }
   if(!heavy&&(this.t.loopIndex||0)>0){const dodge=96+Math.min(70,(this.t.loopIndex-1)*20),side=this.rail129.shot%2?1:-1;this.emit({type:'hazard',bossId:this.id,kind:'circle',x:e.target.x+(e.target.vx||0)*1.15+side*dodge,y:e.target.y+(e.target.vy||0)*1.15,warning:.72,delay:.18,duration:.55,once:true,radius:94,damage:this.t.damage*.9,visual:'rail-shell'});}
   this.emit({type:'heavy-gun-fired',bossId:this.id,x:this.x,y:this.y});
  }
 }
 onPartDestroyed(p){
  if(p.kind!=='rail-car')return;
  const index=this.railCarOrder.indexOf(p.id),next=this.railCarOrder[index+1]&&this.parts.get(this.railCarOrder[index+1]);
  this.emit({type:'rail-car-detached',bossId:this.id,partId:p.id,index,x:this.x+p.x,y:this.y+p.y});
  if(next)next.hittable=true;
  else{this.coreVulnerable=true;this.phase='locomotive';this.emit({type:'phase-change',bossId:this.id,phase:'locomotive'});}
 }
 update(dt,ctx){const rail=this.rail129;if(this.recoilKick129>0&&rail.phase==='recoil'&&!rail.broken){const kick=Math.min(this.recoilKick129,dt*180);rail.s=Math.max(0,Math.min(rail.length,rail.s-rail.direction*kick));this.recoilKick129-=kick;}rail.update(dt,ctx);Object.assign(this,rail.pose);if(!this.runawayTriggered129)this.phase=this.coreVulnerable?'locomotive':rail.phase;}
 locateHit(s){
  const r=this.rail129.railTarget;
  if(!this.rail129.broken){
   const dx=s.x-(s.previousX??s.x),dy=s.y-(s.previousY??s.y),x=s.previousX??s.x,y=s.previousY??s.y,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((r.x-x)*dx+(r.y-y)*dy)/l)):0;
   if(Math.hypot(x+dx*t-r.x,y+dy*t-r.y)<=r.radius+(s.radius||0))return {partId:'rail'};
  }
  const ellipseHit=(cx,cy,rx,ry)=>{const x=s.previousX??s.x,y=s.previousY??s.y,dx=s.x-x,dy=s.y-y,nx=x-cx,ny=y-cy,ax=dx/rx,ay=dy/ry,bx=nx/rx,by=ny/ry,l=ax*ax+ay*ay,t=l?Math.max(0,Math.min(1,-(bx*ax+by*ay)/l)):0,qx=bx+ax*t,qy=by+ay*t,shot=(s.radius||0)/Math.min(rx,ry);return qx*qx+qy*qy<=(1+shot)*(1+shot);};
  for(const id of this.railCarOrder){const p=this.parts.get(id);if(!p?.hittable||p.destroyed)continue;if(ellipseHit(this.x+p.x,this.y+p.y,p.radius,p.hitRadiusY||p.radius))return {partId:id};}
  return this.coreVulnerable&&ellipseHit(this.x,this.y,68,188)?{partId:null}:null;
 }
 hit(s){
  if(s.partId==='rail')return{damage:this.rail129.hitRail(s.damage),partId:'rail'};
  if(s.partId){const r=super.hit(s);return r;}
  if(!this.coreVulnerable)return{damage:0,blocked:true};
  if(!this.runawayTriggered129){
   const threshold=this.maxHp*.28,damage=Math.min(s.damage,Math.max(0,this.hp-threshold)),r=super.hit({...s,damage});
   if(this.hp<=threshold&&!this.dead){this.runawayTriggered129=true;this.coreVulnerable=false;this.rail129.startRunaway();}
   return r;
  }
  const r=super.hit(s);if(this.dead)this.dispose();return r;
 }
 hitAt(s){const hit=this.locateHit(s);return hit?this.hit({...hit,damage:s.damage}):{damage:0};}
 dispose(){this.rail129.destroy();}
}
export class StuttgartAdapter extends BaseBoss {
 constructor(o){super({...o,maxHp:o.tuning.maxHp});this.t=o.tuning;this.kind='sms-stuttgart';this.faction=o.faction;this.ownsMotion129=true;
  this.support129=new StuttgartSupport({id:this.id,tuning:{maxHp:this.maxHp,damage:this.t.damage,bulletSpeed:this.t.bulletSpeed,projectileDensity:this.t.projectileDensity??1,spawnInterval:this.t.launchInterval||4,minionCap:6,rotationSpeed:.08*(this.t.motionMultiplier||1)},x:this.x,y:this.y,width:500,height:750,
   onDamage:(playerId,damage,source)=>this.emit({type:'support-damage',bossId:this.id,playerId,damage,source}),
   spawnSeaplane:s=>{this.emit({type:'spawn-minion',bossId:this.id,faction:this.faction,minion:'seaplane',...s,a:s.angle-Math.PI/2});return true;},
   countSeaplanes:()=>this.countMinions129?.()||0,
   clearOwned:()=>this.emit({type:'support-cleanup',bossId:this.id}),onCleared:()=>{},onCue:e=>this.emit({...e,bossId:this.id})});
  for(const p of this.support129.parts.values()){const support=this.support129;this.parts.set(p.id,{id:p.id,maxHp:p.maxHp,get hp(){return p.hp},get destroyed(){return p.hp<=0},get hittable(){return support.hittable(p)},x:p.nx*support.width,y:p.ny*support.height,radius:p.rx*support.width});}
 }
 update(dt,ctx){this.support129.tick(dt,ctx);this.sync129();}
 sync129(){this.hp=this.support129.hp;this.phase=this.support129.phase===1?'carrier':this.support129.phase===2?'sortie':'full-sortie';this.dead=this.support129.dead;}
 locateHit(s){const id=this.support129.locateHit(s);return id?{partId:id}:null;}
 hit(s){const was=this.dead,result=this.support129.hit({...s,partId:s.partId||'hull'});this.sync129();if(this.dead&&!was)this.emit({type:'body-defeated',bossId:this.id});return result;}
 hitAt(s){const hit=this.locateHit(s);return hit?this.hit({...hit,damage:s.damage}):{damage:0};}
 dispose(){this.support129.dispose();}
}

import {BaseBoss,BossPart} from './headon-stageboss-core.js?v=535';
import {intersectsEllipse} from './regional-boss-layout352.js?v=535';
import {apronPose,apronPanelHull,netContact} from './london-apron369.js?v=535';

// Source-image coordinates are shared by hull hit tests, gun mounts and mines.
export const CITY_HULLS={
 'london-apron':[[123,132,116,47],[384,123,121,56],[646,132,116,47]],
 'drachen-net':[[145,211,100,46],[454,159,242,71],[641,325,83,49]]
};
export const CITY_GUNS={'london-apron':[[123,193],[384,199],[646,193]],'drachen-net':[[154,295],[441,292],[641,432]]};
export const DRACHEN_MINES=[[[116,425],[189,425]],[[316,397],[443,456],[590,397]],[[607,509],[678,509]]];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

class CityAirships extends BaseBoss{
 constructor(o,kind){
  const hp=o.tuning.maxHp,parts=[0,1,2].map(i=>new BossPart({id:'airship-'+i,maxHp:hp/3}));
  super({...o,maxHp:hp,parts});this.t=o.tuning;this.rng=o.rng||Math.random;this.kind=kind;this.cityArtKind=kind;this.faction=o.faction;
  const w=this.t.regionalViewWidth||960,h=this.t.regionalViewHeight||700,height=kind==='london-apron'?512:576;
  // 2x silhouette on every viewport — same fit math, doubled budgets.
  this.cityArtScale=Math.max(.30,Math.min(2.288,(w-38)/384,(h-210)/(height/2)));
  this.apronScale=this.cityArtScale;this.regionalScale=this.cityArtScale;this.sourceHeight=height;
  for(const [i,p]of [...this.parts.values()].entries()){
   const [x,y,rx,ry]=CITY_HULLS[kind][i],s=this.cityArtScale;
   Object.assign(p,{x:(x-384)*s,y:(y-height/2)*s,radius:Math.max(rx,ry)*s,hitRadiusX:rx*s,hitRadiusY:ry*s});
   this.timers.set('gun-'+i,1.3+i*.65);
  }
  this.ownsMotion129=true;this.coreVulnerable=true;this.phase='three-airships';this.gunQueue=[];this.netWave=0;
 }
 suppressive(){}
 point(x,y){return{x:this.x+(x-384)*this.cityArtScale,y:this.y+(y-this.sourceHeight/2)*this.cityArtScale};}
 live(){return [...this.parts.values()].filter(p=>!p.destroyed&&p.id.startsWith('airship-'));}
 command(type,spec={}){this.emit({...spec,type,bossId:this.id,faction:this.faction});}
 hazard(kind,spec){this.command('hazard',{kind,damage:this.t.damage,warning:0,duration:5,...spec});}
 locateHit(s){
  if(this.dead)return null;
  for(const p of this.live())if(intersectsEllipse(s,this.x+p.x,this.y+p.y,p.hitRadiusX,p.hitRadiusY))return{partId:p.id};
  return this.rigHit(s);
 }
 rigHit(){return null;}
 hitAt(s){const hit=this.locateHit(s);return hit?this.hit({...hit,damage:s.damage}):{damage:0,miss:true};}
 hit({partId,damage}){
  const indirect=partId?.startsWith('net-')||partId?.startsWith('rig-'),id=indirect?'airship-'+partId.at(-1):partId;
  if(!id||this.dead)return{damage:0,blocked:true};
  const result=super.hit({partId:id,damage:damage*(indirect?(this.cityArtKind==='london-apron'?.38:.65):1)});
  this.hp=[...this.parts.values()].reduce((sum,p)=>sum+(p.id.startsWith('airship-')?Math.max(0,p.hp):0),0);
  if(this.hp<=.001&&!this.dead){this.hp=0;this.dead=true;this.phase='defeated';this.command('body-defeated');}
  return result;
 }
 onPartDestroyed(p){
  const index=Number(p.id.at(-1));this.gunQueue=this.gunQueue.filter(q=>q.index!==index);
  this.command('cancel-hazards',{tag:'apron-'+p.id});
  this.phase=this.live().length===1?'last-airship':'two-airships';
  this.command('aa-effect',{...this.point(...CITY_GUNS[this.cityArtKind][index],index),kind:'aaWireSnap',size:60*this.cityArtScale,life:.6});
  this.command('phase-change',{phase:this.phase});
 }
 guns(dt,players){
  const target=players.find(p=>p.alive);if(!target)return;
  const live=this.live(),interval=live.length===1?2.6:3.6;
  for(const p of live){const index=Number(p.id.at(-1));if(this.due('gun-'+index,dt,interval)){
   const from=this.point(...CITY_GUNS[this.cityArtKind][index],index);
   const list=players.filter(p=>p.alive),aimTarget=this.cityArtKind==='drachen-net'?list[(this.gunCursor||0)%list.length]:target;this.gunCursor=(this.gunCursor||0)+1;
   const a=Math.atan2(aimTarget.y+(aimTarget.vy||0)*.18-from.y,aimTarget.x+(aimTarget.vx||0)*.18-from.x);
   for(let j=0;j<5;j++)this.gunQueue.push({index,delay:.25+j*.115,angle:a+(j-2)*.055});
  }}
  for(const q of this.gunQueue)q.delay-=dt;
  for(const q of this.gunQueue.filter(q=>q.delay<=0)){
   if(this.parts.get('airship-'+q.index).destroyed)continue;
   const from=this.point(...CITY_GUNS[this.cityArtKind][q.index],q.index),speed=Math.max(245,this.t.bulletSpeed*.95);
   this.hazard('projectile',{...from,vx:Math.cos(q.angle)*speed,vy:Math.sin(q.angle)*speed,radius:3,damage:this.t.damage*.32,duration:4.2,visual:'city-mg',tag:'gun-'+q.index});
   this.command('muzzle',from);
  }
  this.gunQueue=this.gunQueue.filter(q=>q.delay>0);
 }
}

export class LondonApron extends CityAirships{
 constructor(o){super(o,'london-apron');this.apronTime=0;this.apronStarted=false;}
 rigHit(s){
  const pose=apronPose(this.apronTime,3-this.live().length),dx=s.x-(s.previousX??s.x),dy=s.y-(s.previousY??s.y),steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/10));
  for(const p of this.live()){
   const index=Number(p.id.at(-1)),v=apronPanelHull(index,pose,this.apronScale,this.x,this.y);
   for(let i=0;i<=Math.min(steps,32);i++){const q=i/Math.min(steps,32);if(netContact({x:s.x-dx*(1-q),y:s.y-dy*(1-q),radius:s.radius||0},v))return{partId:'net-'+index};}
  }return null;
 }
 update(dt,{players}){
  if(this.dead)return;this.apronTime+=dt;this.guns(dt,players);
  const pose=apronPose(this.apronTime,3-this.live().length);
  for(const p of this.live()){
   const index=Number(p.id.at(-1)),tag='apron-'+p.id,vertices=apronPanelHull(index,pose,this.apronScale,this.x,this.y);
   if(!this.apronStarted)this.hazard('net',{x:this.x,y:this.y,vertices,warning:1.5,duration:3600,tickInterval:.8,damage:this.t.damage*.5,blocks:true,visual:'apron-attached',tag});
   this.command('apron-pose',{x:this.x,y:this.y,vertices,tag});
  }this.apronStarted=true;
 }
}

export class DrachenMineNet extends CityAirships{
 constructor(o){super(o,'drachen-net');this.mineQueue=[];this.mineSerial=0;this.driftTime=0;this.cityRigOffsets=[[0,0],[0,0],[0,0]];
  this.cityArtScale=Math.max(.27,Math.min(1.35,((this.t.regionalViewWidth||960)-60)/790,((this.t.regionalViewHeight||700)-150)/720));
  this.regionalScale=this.apronScale=this.cityArtScale;this.syncRigs();this.timers.set('mine-lay',1.0);}
 point(x,y,index=1){const o=this.cityRigOffsets?.[index]||[0,0];return{x:this.x+(x-384+o[0])*this.cityArtScale,y:this.y+(y-288+o[1])*this.cityArtScale};}
 syncRigs(){for(const [i,p] of [...this.parts.values()].entries()){if(p.destroyed)continue;const [x,y,rx,ry]=CITY_HULLS['drachen-net'][i],q=this.point(x,y,i),s=this.cityArtScale;Object.assign(p,{x:q.x-this.x,y:q.y-this.y,radius:Math.max(rx,ry)*s,hitRadiusX:rx*s,hitRadiusY:ry*s});}}
 drift(dt){this.driftTime+=dt;for(let i=0;i<3;i++)if(!this.parts.get('airship-'+i).destroyed)this.cityRigOffsets[i]=[Math.sin(this.driftTime*.38+i*1.7)*12-Math.sin(i*1.7)*12,Math.sin(this.driftTime*.52+i)*9-Math.sin(i)*9];this.syncRigs();}

 rigHit(s){for(const p of this.live()){const index=Number(p.id.at(-1));for(const [x,y]of DRACHEN_MINES[index]){const q=this.point(x,y,index);if(intersectsEllipse(s,q.x,q.y,24*this.cityArtScale,24*this.cityArtScale))return{partId:'rig-'+index};}}return null;}
 onPartDestroyed(p){super.onPartDestroyed(p);this.mineQueue=this.mineQueue.filter(q=>q.index!==Number(p.id.at(-1)));}
 update(dt,{players,bounds}){
  if(this.dead)return;if(this.cityMineLane)this.cityMineLane.remaining=Math.max(0,this.cityMineLane.remaining-dt);this.drift(dt);this.guns(dt,players);const list=players.filter(p=>p.alive),target=list[this.netWave%Math.max(1,list.length)],live=this.live();
  if(target&&this.due('mine-lay',dt,live.length===1?3.3:3.8)){
   const mode=this.netWave++%4,count=live.length===1?7:10,w=bounds.right-bounds.left;
   const gate=bounds.left+w*[.28,.5,.72][this.netWave%3],gap=Math.min(150,w*.36);
   this.cityMineLane={x:gate,width:gap,top:bounds.top,bottom:bounds.bottom,remaining:3};
   this.mineQueue=this.mineQueue.filter(q=>Math.abs(q.x-gate)>=gap/2);
   this.command('city-mine-lane',{x:gate,width:gap});
   const cx=clamp(target.x+(target.vx||0)*.4,bounds.left+75,bounds.right-75),cy=clamp(target.y+(target.vy||0)*.4,bounds.top+90,bounds.bottom-90);
   for(let i=0;i<count;i++){
    const a=this.rng()*Math.PI*2,d=85+this.rng()*150;let x,y;
    if(mode===0){x=cx+Math.cos(a)*d;y=cy+Math.sin(a)*d*.8;}
    else if(mode===1){const gate=(this.netWave%3)*.25+.25,u=(i+.5)/count;if(Math.abs(u-gate)<.11)continue;x=bounds.left+35+u*(w-70);y=cy-90+(i%2)*65+(this.rng()-.5)*25;}
    else if(mode===2){const angle=i/count*Math.PI*2+.3;x=cx+Math.cos(angle)*145;y=cy+Math.sin(angle)*105;}
    else{x=bounds.left+45+(i%5)*(w-90)/4;y=cy+(i<5?-100:105)+(this.rng()-.5)*45;}
    x=clamp(x,bounds.left+24,bounds.right-24);y=clamp(y,bounds.top+40,bounds.bottom-35);
    if(Math.hypot(x-target.x,y-target.y)<65||Math.abs(x-gate)<gap/2)continue;
    const index=Number(live[i%live.length].id.at(-1));
    this.mineQueue.push({index,slot:this.mineSerial++,delay:i*.13+(mode===3&&i>=5?.8:0),x,y,warning:mode===2?2.1:1.45});
   }
  }
  for(const q of this.mineQueue)q.delay-=dt;
  for(const q of this.mineQueue.filter(q=>q.delay<=0)){
   if(this.parts.get('airship-'+q.index).destroyed)continue;
   const mounts=DRACHEN_MINES[q.index],from=this.point(...mounts[q.slot%mounts.length],q.index);
   this.command('spawn-minefield',{points:[{x:q.x,y:q.y}],sourceX:from.x,sourceY:from.y,warning:q.warning,life:12,maxMines:26,rigIndex:q.index});
   this.command('aa-effect',{...from,kind:'aaWinchSpark',size:30*this.cityArtScale,life:.22});
  }
  this.mineQueue=this.mineQueue.filter(q=>q.delay>0);
 }
}

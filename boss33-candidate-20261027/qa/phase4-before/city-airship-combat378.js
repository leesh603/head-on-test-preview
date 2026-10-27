import {BaseBoss,BossPart} from './headon-stageboss-core.js?v=tame3&ai=1018&sig=1019&boss=20261020b&phase=1021&harbor=20261021';
import {intersectsEllipse} from './regional-boss-layout352.js?v=tame3';
import {apronPose,apronPanelHull,netContact} from './london-apron369.js?v=tame3&cityart=20261022';

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
  // Hull health is the sum of the three airships: pilot damage to them is hull damage.
  this.partsCarryHull=true;
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
 command(type,spec={}){if(type==='muzzle'){
   let p=this.parts.get(spec.partId);if(!p){let best=Infinity;for(const v of this.live()){const i=Number(v.id.at(-1)),q=this.point(...CITY_GUNS[this.cityArtKind][i],i),d=Math.hypot(q.x-spec.x,q.y-spec.y);if(d<best){best=d;p=v;}}}
   if(p&&!p.destroyed){p.gunFlash=.15;p.recoil=1;}
  }this.emit({...spec,type,bossId:this.id,faction:this.faction});}
 tickCityArt(dt){for(const p of this.parts.values()){p.recoil=Math.max(0,(p.recoil||0)-dt*4);p.gunFlash=Math.max(0,(p.gunFlash||0)-dt);}}
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
  this.command('cancel-hazards',{tag:'gun-'+index});this.command('cancel-hazards',{tag:'apron-light-'+p.id});this.command('cancel-hazards',{tag:'apron-bombard-'+p.id});
  this.phase=this.live().length===1?'last-airship':'two-airships';
  this.command('aa-effect',{...this.point(...CITY_GUNS[this.cityArtKind][index],index),kind:'aaWireSnap',size:60*this.cityArtScale,life:.6});
  this.command('phase-change',{phase:this.phase});
 }
 guns(dt,players){
  const target=players.find(p=>p.alive);if(!target)return;
  const live=this.live(),interval=this.cityArtKind==='drachen-net'?[3.8,5.2,6.5][live.length-1]:live.length===1?5:6.5;
  for(const p of live){const index=Number(p.id.at(-1));if(this.due('gun-'+index,dt,interval)){
   const from=this.point(...CITY_GUNS[this.cityArtKind][index],index);
   const list=players.filter(p=>p.alive),aimTarget=this.cityArtKind==='drachen-net'?list[(this.gunCursor||0)%list.length]:target;this.gunCursor=(this.gunCursor||0)+1;
   const a=Math.atan2(aimTarget.y+(aimTarget.vy||0)*.18-from.y,aimTarget.x+(aimTarget.vx||0)*.18-from.x);
   this.command('charge-warning',{...from,targetX:from.x+Math.cos(a)*480,targetY:from.y+Math.sin(a)*480,seconds:.8});
   for(let row=0;row<3;row++)for(let j=0;j<7;j++){if(j===2+row)continue;this.gunQueue.push({index,delay:.8+row*.42,angle:a+(j-3)*.18});}
  }}
  for(const q of this.gunQueue)q.delay-=dt;
  for(const q of this.gunQueue.filter(q=>q.delay<=0)){
   if(this.parts.get('airship-'+q.index).destroyed)continue;
   const from=this.point(...CITY_GUNS[this.cityArtKind][q.index],q.index),speed=Math.max(245,this.t.bulletSpeed*.95);
   this.hazard('projectile',{...from,vx:Math.cos(q.angle)*speed,vy:Math.sin(q.angle)*speed,radius:3,damage:this.t.damage*.32,duration:4.2,visual:'city-mg',tag:'gun-'+q.index,sourcePartId:'airship-'+q.index});
   this.command('muzzle',from);
  }
  this.gunQueue=this.gunQueue.filter(q=>q.delay>0);
 }
}

export class LondonApron extends CityAirships{
 constructor(o){super(o,'london-apron');this.apronTime=0;this.apronStarted=false;this.apronState='corridor-formation';this.apronStateAge=0;this.apronCycle=0;this.apronCaught=false;this.apronTargetId=null;this.ownsNativeApron=true;}
 counterWindow(){return this.apronState==='relief'?1.4:super.counterWindow();}
 rigHit(s){
  const pose=this.apronPoseOverride||apronPose(this.apronTime,3-this.live().length),dx=s.x-(s.previousX??s.x),dy=s.y-(s.previousY??s.y),steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/10));
  for(const p of this.live()){
   const index=Number(p.id.at(-1)),v=apronPanelHull(index,pose,this.apronScale,this.x,this.y);
   for(let i=0;i<=Math.min(steps,32);i++){const q=i/Math.min(steps,32);if(netContact({x:s.x-dx*(1-q),y:s.y-dy*(1-q),radius:s.radius||0},v))return{partId:'net-'+index};}
  }return null;
 }
 setApronState(state,players=[]){this.apronState=state;this.apronStateAge=0;this.phase='apron-'+state;this.command('phase-change',{phase:this.phase});
  const live=this.live();if(!live.length)return;
  if(state==='corridor-formation'){this.apronCaught=false;this.apronTargetId=null;this.command('apron-corridor',{cycle:this.apronCycle});}
  if(state==='light-catch'){
   const target=players.filter(p=>p.alive)[this.apronCycle%Math.max(1,players.filter(p=>p.alive).length)];if(!target)return;
   const light=this.parts.get('light'),source=light?(light.destroyed?null:light):live[this.apronCycle%live.length];if(!source)return;const partId=source.id,index=partId.startsWith('airship-')?Number(partId.at(-1)):1;
   const from=partId.startsWith('airship-')?this.point(...CITY_GUNS[this.cityArtKind][index],index):{x:this.x+source.x,y:this.y+source.y};
   const angle=Math.atan2(target.y-from.y,target.x-from.x);this.apronTargetId=target.id;
   this.hazard('searchlight',{...from,angle,angularSpeed:0,halfAngle:.15,radius:720,duration:2.35,warning:.55,damage:0,visual:'searchlight',tag:partId==='light'?'raid-light':'apron-light-'+partId,sourcePartId:partId});
  }
  if(state==='bombard')this.apronBombard(players);
 }
 apronBombard(players){const target=players.find(p=>p.alive&&p.id===this.apronTargetId)||players.find(p=>p.alive);if(!target)return;
  const gun=this.parts.get('gun'),live=this.live(),source=gun?(gun.destroyed?null:gun):live[this.apronCycle%Math.max(1,live.length)];if(!source)return;
  const index=source.id.startsWith('airship-')?Number(source.id.at(-1)):1,from=source.id.startsWith('airship-')?this.point(...CITY_GUNS[this.cityArtKind][index],index):{x:this.x+source.x,y:this.y+source.y};
  const speed=Math.hypot(target.vx||0,target.vy||0),nx=speed>8?-(target.vy||0)/speed:1,ny=speed>8?(target.vx||0)/speed:0,cx=target.x+(target.vx||0)*.55,cy=target.y+(target.vy||0)*.55,tag=source.id==='gun'?'raid-gun':'apron-bombard-'+source.id;
  for(const [i,side]of [-1,1,0].entries())this.hazard('circle',{x:cx+nx*side*72,y:cy+ny*side*72,sourceX:from.x,sourceY:from.y,sourcePartId:source.id,radius:side?50:88,warning:1.15+i*.42,duration:.23,once:true,damage:this.t.damage*(side?1:1.8),raidHeavy:side===0,visual:'black-flak',tag});
  this.command('muzzle',{...from,partId:source.id});
 }
 update(dt,{players,isIlluminated}){
  if(this.dead)return;this.tickCityArt(dt);this.basicHoldUntil=(this.combatTime||0)+dt+.1;this.apronTime+=dt;
  const pose=this.apronPoseOverride||apronPose(this.apronTime,3-this.live().length);
  for(const p of this.live()){
   const index=Number(p.id.at(-1)),tag='apron-'+p.id,vertices=apronPanelHull(index,pose,this.apronScale,this.x,this.y);
   if(!this.apronStarted)this.hazard('net',{x:this.x,y:this.y,vertices,warning:this.apronEntryRemaining??1.5,duration:3600,tickInterval:.8,damage:this.t.damage*.5,blocks:true,visual:'apron-attached',tag});
   this.command('apron-pose',{x:this.x,y:this.y,vertices,tag});
  }this.apronStarted=true;if(this.encounter?.breath)return;
  const alive=players.filter(p=>p.alive);if(!alive.length)return;this.apronStateAge+=dt;
  if(this.apronState==='corridor-formation'&&this.apronStateAge>=2.4)this.setApronState('light-catch',players);
  else if(this.apronState==='light-catch'){
   const target=alive.find(p=>p.id===this.apronTargetId);if(target)this.apronCaught||=typeof isIlluminated==='function'?!!isIlluminated(target):true;
   if(this.apronStateAge>=2.55)this.setApronState(this.apronCaught?'bombard':'relief',players);
  }else if(this.apronState==='bombard'&&this.apronStateAge>=2.35)this.setApronState('relief',players);
  else if(this.apronState==='relief'&&this.apronStateAge>=2.25){this.apronCycle++;this.setApronState('corridor-formation',players);}
 }
}

export class DrachenMineNet extends CityAirships{
 constructor(o){super(o,'drachen-net');this.mineQueue=[];this.burstQueue=[];this.mineSerial=0;this.driftTime=0;this.cityRigOffsets=[[0,0],[0,0],[0,0]];this.netState='mines';this.netStateAge=0;this.netStateFresh=true;this.mineSupportIndex=null;this.aimSupportIndex=null;
  this.cityArtScale=Math.max(.32,Math.min(1.62,((this.t.regionalViewWidth||960)-60)/790*1.2,((this.t.regionalViewHeight||700)-150)/720*1.2));
  this.regionalScale=this.apronScale=this.cityArtScale;this.syncRigs();this.timers.set('mine-lay',1.0);}
 point(x,y,index=1){const o=this.cityRigOffsets?.[index]||[0,0];return{x:this.x+(x-384+o[0])*this.cityArtScale,y:this.y+(y-288+o[1])*this.cityArtScale};}
 syncRigs(){for(const [i,p] of [...this.parts.values()].entries()){if(p.destroyed)continue;const [x,y,rx,ry]=CITY_HULLS['drachen-net'][i],q=this.point(x,y,i),s=this.cityArtScale;Object.assign(p,{x:q.x-this.x,y:q.y-this.y,radius:Math.max(rx,ry)*s,hitRadiusX:rx*s,hitRadiusY:ry*s});}}
 drift(dt){this.driftTime+=dt;for(let i=0;i<3;i++)if(!this.parts.get('airship-'+i).destroyed)this.cityRigOffsets[i]=[Math.sin(this.driftTime*.38+i*1.7)*12-Math.sin(i*1.7)*12,Math.sin(this.driftTime*.52+i)*9-Math.sin(i)*9];this.syncRigs();}

 rigHit(s){for(const p of this.live()){const index=Number(p.id.at(-1));for(const [x,y]of DRACHEN_MINES[index]){const q=this.point(x,y,index);if(intersectsEllipse(s,q.x,q.y,24*this.cityArtScale,24*this.cityArtScale))return{partId:'rig-'+index};}}return null;}
 onPartDestroyed(p){super.onPartDestroyed(p);const index=Number(p.id.at(-1));this.mineQueue=this.mineQueue.filter(q=>q.index!==index);this.burstQueue=this.burstQueue.filter(q=>q.index!==index);this.command('cancel-hazards',{tag:'drachen-support-'+index});if(this.mineSupportIndex===index)this.mineSupportIndex=null;if(this.aimSupportIndex===index)this.aimSupportIndex=null;}
 setNetState(state){this.netState=state;this.netStateAge=0;this.netStateFresh=true;this.phase='drachen-'+state;this.command('phase-change',{phase:this.phase});}
 planMines(target,live,bounds){if(!target||!live.length)return;const owner=live[this.netWave%live.length],index=Number(owner.id.at(-1));this.mineSupportIndex=index;
  const mode=this.netWave++%4,count=10,w=bounds.right-bounds.left,gate=bounds.left+w*[.28,.5,.72][this.netWave%3],gap=Math.min(150,w*.36);
  this.cityMineLane={x:gate,width:gap,top:bounds.top,bottom:bounds.bottom,remaining:3};this.mineQueue=this.mineQueue.filter(q=>q.index!==index&&Math.abs(q.x-gate)>=gap/2);this.command('city-mine-lane',{x:gate,width:gap});
  const cx=clamp(target.x+(target.vx||0)*.4,bounds.left+75,bounds.right-75),cy=clamp(target.y+(target.vy||0)*.4,bounds.top+90,bounds.bottom-90);
  for(let i=0;i<count;i++){const a=i/count*Math.PI*2+mode*.35,d=155;let x,y;
   if(mode===0){x=cx+Math.cos(a)*d;y=cy+Math.sin(a)*d*.8;}
   else if(mode===1){const opening=(this.netWave%3)*.25+.25,u=(i+.5)/count;if(Math.abs(u-opening)<.11)continue;x=bounds.left+35+u*(w-70);y=cy-90+(i%2)*65;}
   else if(mode===2){const angle=i/count*Math.PI*2+.3;x=cx+Math.cos(angle)*145;y=cy+Math.sin(angle)*105;}
   else{x=bounds.left+45+(i%5)*(w-90)/4;y=cy+(i<5?-100:105);}
   x=clamp(x,bounds.left+24,bounds.right-24);y=clamp(y,bounds.top+40,bounds.bottom-35);if(Math.hypot(x-target.x,y-target.y)<65||Math.abs(x-gate)<gap/2)continue;
   this.mineQueue.push({index,slot:this.mineSerial++,delay:i*.08,x,y,warning:1.25,blastRadius:78,fuse:3+(i%3)*.32});
  }
  this.mineQueue.push({index,slot:this.mineSerial++,delay:1.1,x:gate,y:clamp(target.y+(target.vy||0)*1.1,bounds.top+60,bounds.bottom-60),warning:1.25,blastRadius:105,fuse:4.1,blastHeavy:true});
 }
 planSupportAim(players,bounds){const live=this.live(),target=players.filter(p=>p.alive)[this.netWave%Math.max(1,players.filter(p=>p.alive).length)];if(!target||!live.length)return;
  const different=live.find(p=>Number(p.id.at(-1))!==this.mineSupportIndex)||live[0],index=Number(different.id.at(-1));this.aimSupportIndex=index;
  const from=this.point(...CITY_GUNS[this.cityArtKind][index],index),x=clamp(target.x+(target.vx||0)*.65,bounds.left+45,bounds.right-45),y=clamp(target.y+(target.vy||0)*.65,bounds.top+45,bounds.bottom-45),a=Math.atan2(y-from.y,x-from.x);
  this.supportLock={index,x,y,nx:Math.hypot(target.vx||0,target.vy||0)>8?-(target.vy||0)/Math.hypot(target.vx||0,target.vy||0):1,ny:Math.hypot(target.vx||0,target.vy||0)>8?(target.vx||0)/Math.hypot(target.vx||0,target.vy||0):0};
  this.command('charge-warning',{...from,partId:different.id,targetX:from.x+Math.cos(a)*520,targetY:from.y+Math.sin(a)*520,seconds:1.1});
 }
 queueSupportBursts(){const q=this.supportLock;if(!q||this.parts.get('airship-'+q.index)?.destroyed)return;for(const [i,side]of [-1,1,0].entries())this.burstQueue.push({index:q.index,delay:.35+i*.5,x:q.x+q.nx*side*70,y:q.y+q.ny*side*70,radius:side?48:84,heavy:side===0});}
 tickQueues(dt){for(const q of this.mineQueue)q.delay-=dt;for(const q of this.mineQueue.filter(q=>q.delay<=0)){if(this.parts.get('airship-'+q.index)?.destroyed)continue;const mounts=DRACHEN_MINES[q.index],from=this.point(...mounts[q.slot%mounts.length],q.index);
   this.command('spawn-minefield',{points:[{x:q.x,y:q.y}],sourceX:from.x,sourceY:from.y,warning:q.warning,life:12,maxMines:26,rigIndex:q.index,sourcePartId:'airship-'+q.index,fuse:q.fuse,blastRadius:q.blastRadius,blastHeavy:q.blastHeavy});this.command('aa-effect',{...from,kind:'aaWinchSpark',size:30*this.cityArtScale,life:.22});}
  this.mineQueue=this.mineQueue.filter(q=>q.delay>0);
  for(const q of this.burstQueue)q.delay-=dt;for(const q of this.burstQueue.filter(q=>q.delay<=0)){const part=this.parts.get('airship-'+q.index);if(part?.destroyed)continue;const from=this.point(...CITY_GUNS[this.cityArtKind][q.index],q.index);
   this.hazard('circle',{x:q.x,y:q.y,sourceX:from.x,sourceY:from.y,sourcePartId:part.id,radius:q.radius,warning:1.05,duration:.25,once:true,damage:this.t.damage*(q.heavy?1.8:1),raidHeavy:q.heavy,visual:'observer-shell',tag:'drachen-support-'+q.index});this.command('muzzle',{...from,partId:part.id});}
  this.burstQueue=this.burstQueue.filter(q=>q.delay>0);
 }
 update(dt,{players,bounds}){
  if(this.dead)return;this.tickCityArt(dt);this.basicHoldUntil=(this.combatTime||0)+dt+.1;if(this.cityMineLane)this.cityMineLane.remaining=Math.max(0,this.cityMineLane.remaining-dt);this.drift(dt);if(this.encounter?.breath)return;this.netStateAge+=dt;const live=this.live(),target=players.filter(p=>p.alive)[this.netWave%Math.max(1,players.filter(p=>p.alive).length)];
  if(this.netStateFresh){this.netStateFresh=false;if(this.netState==='mines')this.planMines(target,live,bounds);else if(this.netState==='support-aim')this.planSupportAim(players,bounds);else if(this.netState==='delayed-bursts')this.queueSupportBursts();}
  this.tickQueues(dt);
  if(this.netState==='mines'&&this.netStateAge>=1.65)this.setNetState('support-aim');
  else if(this.netState==='support-aim'&&this.netStateAge>=1.15)this.setNetState('delayed-bursts');
  else if(this.netState==='delayed-bursts'&&this.netStateAge>=2.05)this.setNetState('reset');
  else if(this.netState==='reset'&&this.netStateAge>=2.1)this.setNetState('mines');
 }
}



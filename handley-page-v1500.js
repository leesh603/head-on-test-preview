/** V/1500: host-authoritative long bombing legs and defensive gun sectors.
 * All encounter state is JSON; no simulation RNG, timers, or global state.
 * Coordinates describe the dedicated top-view art, not the ordinary roster sprite.
 */
import {followTurningArrival} from './giant-intrusion-arrival.js';
import {queueV1500CollapseFx} from './v1500-destruction-fx.js';
import {queueArtilleryMuzzle} from './artillery-fx.js?v=20261026';
export const V1500_WIDTH=1774,V1500_HEIGHT=887,V1500_DESTRUCTION_TIME=2.9;
export const V1500_POINTS=Object.freeze({
 engine_port_front:{x:-117,y:-253.5},engine_port_rear:{x:-117,y:-110.5},
 engine_starboard_front:{x:117,y:-253.5},engine_starboard_rear:{x:117,y:-110.5},
 gun_nose:{x:0,y:-310.5},gun_dorsal:{x:0,y:-52.5},gun_tail:{x:0,y:375.5},bay:{x:0,y:45}
});
export const V1500_PROP_POINTS=Object.freeze({engine_port_front:{x:-117,y:-298.5},engine_starboard_front:{x:117,y:-298.5},engine_port_rear:{x:-117,y:-32.5},engine_starboard_rear:{x:117,y:-32.5}});
export const V1500_ENGINE_IDS=Object.freeze(Object.keys(V1500_POINTS).filter(id=>id.startsWith('engine_')));
const guns=['gun_tail','gun_dorsal','gun_nose'];
const finite=(n,d=0)=>Number.isFinite(n)?n:d,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const players=g=>(g.players||[g]).filter(p=>p.hp>0&&(!p.status||p.status==='alive'));
const live=(e,id)=>e.parts?.[id]?.hp>0;
const point=(e,id)=>e.v1500Geometry?.[id]||V1500_POINTS[id];
const emit=(g,event)=>(g.events||=[]).push(event);
export function v1500WorldPoint(e,p){const a=e.a+Math.PI/2,s=e.scale*(e.crash?1-.12*clamp(e.crash.age/V1500_DESTRUCTION_TIME,0,1):1);return{x:e.x+s*(p.x*Math.cos(a)-p.y*Math.sin(a)),y:e.y+s*(p.x*Math.sin(a)+p.y*Math.cos(a))};}
export function initializeV1500(e){
 if(e.v1500Initialized)return e;e.v1500Initialized=true;
 e.props=Object.fromEntries(V1500_ENGINE_IDS.map((id,i)=>[id,{phase:i*.8,rpm:1}]));
 e.releasedBombs=[];e.bayAmmo=6;e.bombSerial=0;e.gunSerial=0;e.flightPhase='entry';e.flightClock=0;e.gunClock=1.2;e.bombClock=.8;e.crash=null;e.v1500Shots=[];e.gunRecoil={};e.bombingLeg=0;e.bombPattern='trail';e.knownWingLoss=0;e.structuralStagger=0;
 return e;
}
function advanceProps(e,dt,crashing=false){for(const id of V1500_ENGINE_IDS){const prop=e.props[id],hp=e.parts?.[id],target=crashing?0:live(e,id)?clamp(.45+.55*hp.hp/hp.maxHp,.45,1):0;prop.rpm+=(target-prop.rpm)*(1-Math.exp(-dt*(crashing?1.35:2.6)));prop.phase=(prop.phase+dt*prop.rpm*42)%(Math.PI*2);}}
function velocity(p){return{x:finite(p.vx,Math.cos(finite(p.a,-Math.PI/2))*finite(p.speed)),y:finite(p.vy,Math.sin(finite(p.a,-Math.PI/2))*finite(p.speed))};}
function samplePlayer(g,e,dt){const p=players(g)[0]||g,v=velocity(p),old=e.playerMotion;if(!old){e.playerMotion={x:finite(p.x),y:finite(p.y),vx:v.x,vy:v.y};return;}const dx=(finite(p.x)-old.x)/dt,dy=(finite(p.y)-old.y)/dt,s=Math.hypot(dx,dy),k=1-Math.exp(-dt*8);old.vx+=(clamp(s>800?v.x:dx,-800,800)-old.vx)*k;old.vy+=(clamp(s>800?v.y:dy,-800,800)-old.vy)*k;old.rawVx=s>800?v.x:dx;old.rawVy=s>800?v.y:dy;old.x=finite(p.x);old.y=finite(p.y);}
// Keep the complete fuselage and the pilot clear at the same-speed station.
// The lead target remains 150 units beyond that station, preserving chase gain.
export function v1500StandOff(e,p={}){return Math.max(140,V1500_HEIGHT*e.scale*.5+Math.max(12,finite(p.r,12))+48);}
function enter(g,e){const p=players(g)[0]||g,v=velocity(p),a=Math.hypot(v.x,v.y)>10?Math.atan2(v.y,v.x):finite(e.shadowPass?.a,finite(p.a,-Math.PI/2)),margin=Math.hypot(e.width,e.height)*.5+V1500_WIDTH*e.scale*.5+40;
 e.entry={x:finite(p.x)-Math.cos(a)*margin,y:finite(p.y)-Math.sin(a)*margin,a,distance:margin+v1500StandOff(e,p)+Math.hypot(v.x,v.y)*3,endSpeed:Math.max(82,Math.hypot(v.x,v.y)),age:0};
 e.x=e.entry.x;e.y=e.entry.y;e.a=a;
}
function enterStep(g,e,dt){if(!e.entry){enter(g,e);return;}const q=e.entry;if(q.age===0){const v=e.playerMotion,travel=Math.max(0,finite(v.rawVx,v.vx)*Math.cos(q.a)+finite(v.rawVy,v.vy)*Math.sin(q.a));q.distance=Math.hypot(e.width,e.height)*.5+V1500_WIDTH*e.scale*.5+40+v1500StandOff(e,players(g)[0]||g)+travel*3;q.endSpeed=Math.max(82,travel);}q.age=Math.min(3,q.age+dt);const t=q.age/3,D=q.distance,vEnd=q.endSpeed,d=(-2*t*t*t+3*t*t)*D+(t*t*t-t*t)*vEnd*3,v=(6*t-6*t*t)*D/3+(3*t*t-2*t)*vEnd;const p=players(g)[0]||g;if(followTurningArrival(e,q,p,velocity(p),dt,v,v1500StandOff(e,p))){e.flightSpeed=Math.hypot(e.worldVx,e.worldVy);return;}e.x=q.x+Math.cos(q.a)*d;e.y=q.y+Math.sin(q.a)*d;e.a=q.a;e.worldVx=Math.cos(e.a)*Math.max(0,v);e.worldVy=Math.sin(e.a)*Math.max(0,v);e.flightSpeed=vEnd;}
function propulsion(e){const power=side=>V1500_ENGINE_IDS.filter(id=>id.includes(side)).reduce((sum,id)=>{const p=e.parts?.[id];return sum+(p?clamp(p.hp/Math.max(1,p.maxHp),0,1):0);},0)/2;return{port:power('port'),starboard:power('starboard')};}
function setRun(g,e){const p=players(g)[0]||g,v=velocity(p);e.flightPhase='bombing-run';e.flightClock=0;e.runAngle=e.a;e.runTarget={x:finite(p.x)+v.x*4,y:finite(p.y)+v.y*4};e.bombClock=.65;e.bayAmmo=6;e.bombingLeg=finite(e.bombingLeg)+1;e.bombPattern=e.bombingLeg%2?'trail':'paired';emit(g,{type:'v1500BombingLeg',encounterId:e.encounterId,pattern:e.bombPattern,leg:e.bombingLeg});}
export function stepV1500Motion(g,e,dt){
 initializeV1500(e);if(!(dt>0))return;
 samplePlayer(g,e,dt);
 if(e.phase==='resolved'||e.phase==='reserved'||e.phase==='warning')return;
 advanceProps(e,dt);
 for(const id in e.flash||{})if((e.flash[id]-=dt)<=0)delete e.flash[id];
 if(e.phase==='entering'){enterStep(g,e,dt);return;}
 if(e.phase!=='active'&&e.phase!=='retreating')return;
 if(e.flightPhase==='entry')setRun(g,e);
 // A locked bombing heading cannot use distance-only pursuit acceleration:
 // when the player is aft it would accelerate away indefinitely. Bleed speed
 // instead, preserving the complete six-round leg and nose-aligned motion.
 const engines=V1500_ENGINE_IDS.filter(id=>live(e,id)).length,p=players(g)[0]||g,v=e.playerMotion,ps=Math.hypot(v.vx,v.vy),leadDistance=150+v1500StandOff(e,p),lead={x:finite(p.x)+(ps>10?v.vx/ps:Math.cos(e.a))*leadDistance,y:finite(p.y)+(ps>10?v.vy/ps:Math.sin(e.a))*leadDistance},distance=Math.hypot(lead.x-e.x,lead.y-e.y),separation=Math.hypot(finite(p.x)-e.x,finite(p.y)-e.y),closingProjection=(finite(p.x)-e.x)*Math.cos(e.a)+(finite(p.y)-e.y)*Math.sin(e.a),runDiverging=e.flightPhase==='bombing-run'&&separation>260&&closingProjection<0,desired=(runDiverging?Math.min(clamp(ps,40,600),Math.max(40,ps*.45)):clamp(ps+(distance-150)*.3,70,600))*(.72+.28*engines/4);e.flightSpeed=finite(e.flightSpeed,82)+clamp(desired-finite(e.flightSpeed,82),-85*dt,85*dt);const speed=e.flightSpeed;
 e.flightClock+=dt;
 if(e.phase==='active'){
  const changedCourse=ps>30&&Math.abs(angleDelta(Math.atan2(v.vy,v.vx),e.runAngle))>.8;
  if(e.flightPhase==='bombing-run'&&(e.flightClock>=9||(changedCourse&&e.flightClock>=1.1))){e.flightPhase='turn';e.flightClock=0;e.bayAmmo=0;}
  if(e.flightPhase==='turn'){
   const aim=Math.atan2(lead.y-e.y,lead.x-e.x);
   const wingsLost=Number(e.parts?.wing_port?.hp<=0)+Number(e.parts?.wing_starboard?.hp<=0),power=propulsion(e),delta=angleDelta(aim,e.a);
   // A turn toward the failed bank needs power from that bank to arrest yaw.
   // Alter angular authority only: translation always follows the actual nose.
   const turningBank=delta<0?power.port:power.starboard,otherBank=delta<0?power.starboard:power.port,asymmetry=Math.max(0,otherBank-turningBank);
   const turnRate=clamp(.8+ps/300,.8,2.15)*(1-.18*wingsLost)*(1-.32*asymmetry);e.a+=clamp(delta,-turnRate*dt,turnRate*dt);
   if(e.flightClock>2.4+1.25*wingsLost&&Math.abs(angleDelta(aim,e.a))<.22||e.flightClock>=8)setRun(g,e);
  }else e.a+=clamp(angleDelta(e.runAngle,e.a),-.2*dt,.2*dt);
 }
 const actual=e.phase==='retreating'?Math.max(160,speed):speed;
 e.worldVx=Math.cos(e.a)*actual;e.worldVy=Math.sin(e.a)*actual;e.x+=e.worldVx*dt;e.y+=e.worldVy*dt;
 e.smokeClock=finite(e.smokeClock)-dt;if(e.smokeClock<=0){e.smokeClock=.22;for(const id of V1500_ENGINE_IDS){const p=e.parts[id];if(p&&p.hp<p.maxHp*.55){const w=v1500WorldPoint(e,point(e,id));g.smoke?.(w.x,w.y,p.hp<=0);}}}
}
function gunArc(id,relative){if(id==='gun_nose')return Math.abs(relative)<=1.05;if(id==='gun_tail')return Math.abs(angleDelta(relative,Math.PI))<=1.25;return Math.abs(relative)>.55&&Math.abs(relative)<2.6;}
function muzzle(e,id,a){const p=v1500WorldPoint(e,point(e,id));return{x:p.x+Math.cos(a)*42*e.scale,y:p.y+Math.sin(a)*42*e.scale};}
function aimGuns(g,e,dt){const p=players(g)[0];if(!p)return;e.turretAngles||={};for(const id of guns){if(!live(e,id))continue;const q=e.v1500Shots.find(q=>q.partId===id),m=v1500WorldPoint(e,point(e,id));let desired=angleDelta(q?q.a+(clamp((q.age-q.warning)/.56,0,1)-.5)*q.sweep*(q.serial%2?1:-1):Math.atan2(p.y-m.y,p.x-m.x),e.a);if(!gunArc(id,desired))desired=id==='gun_nose'?clamp(desired,-1.05,1.05):id==='gun_tail'?Math.PI:Math.sign(desired||1)*Math.PI/2;const current=finite(e.turretAngles[id]);e.turretAngles[id]=current+clamp(angleDelta(desired,current),-1.2*dt,1.2*dt);}}
function queueGun(g,e){
 const ps=players(g);if(!ps.length)return;
 for(let k=0;k<guns.length;k++){
  const id=guns[(e.gunSerial+k)%guns.length];if(!live(e,id))continue;const m=v1500WorldPoint(e,point(e,id)),p=ps[e.gunSerial%ps.length],v=p===ps[0]&&e.playerMotion?{x:e.playerMotion.vx,y:e.playerMotion.vy}:velocity(p),distance=Math.hypot(p.x-m.x,p.y-m.y);
  // Aim at one common future instant: both the moving muzzle and player advance
  // during warning. Advancing only the target incorrectly fires the nose gun away.
  const warning=.78,rx=p.x+v.x*warning-m.x-finite(e.worldVx)*warning,ry=p.y+v.y*warning-m.y-finite(e.worldVy)*warning,A=v.x*v.x+v.y*v.y-310*310,B=2*(rx*v.x+ry*v.y),C=rx*rx+ry*ry,disc=B*B-4*A*C;
  let flight=Math.hypot(rx,ry)/310;if(Math.abs(A)>1e-6&&disc>=0){const roots=[(-B-Math.sqrt(disc))/(2*A),(-B+Math.sqrt(disc))/(2*A)].filter(t=>t>0);if(roots.length)flight=Math.min(...roots);}flight=clamp(flight,0,1.7);
  const a=Math.atan2(ry+v.y*flight,rx+v.x*flight);
  if(distance>560||Math.abs(m.x-g.x)>e.width*.48||Math.abs(m.y-g.y)>e.height*.48||!gunArc(id,angleDelta(a,e.a)))continue;
  e.v1500Shots.push({partId:id,a,age:0,warning:.78,next:0,count:5,sweep:.26,damage:6,speed:310,serial:e.gunSerial});
  e.shotCues.push({...m,partId:id,a,age:0,warning:.78,damage:6,done:false,v1500:true});e.gunSerial=(e.gunSerial+k+1)%guns.length;e.volley=finite(e.volley)+1;return true;
 }
 e.gunSerial=(e.gunSerial+1)%guns.length;
}
function releaseBomb(g,e,sideOverride){
 if(e.bayAmmo<=0||e.flightPhase!=='bombing-run')return;
 const m=v1500WorldPoint(e,point(e,'bay')),side=sideOverride??(e.bombSerial%2?1:-1),spread=e.bombPattern==='paired'?72:26;
 // Fixed ballistic lane: never retarget a released bomb to the player/camera.
 const x=m.x+e.worldVx*1.3+Math.cos(e.a+Math.PI/2)*side*spread,y=m.y+e.worldVy*1.3+Math.sin(e.a+Math.PI/2)*side*spread;
 const id=`${e.encounterId}/bomb/${e.bombSerial++}`;e.bayAmmo--;e.volley=finite(e.volley)+1;
 e.hazards.push({id,kind:'bomb',x,y,radius:32,age:0,warning:1.6,damage:19,done:false,v1500:true});
 e.releasedBombs.push({id,releaseX:m.x,releaseY:m.y,x,y,targetX:x,targetY:y,angle:e.a,age:0,life:1.6});
 emit(g,{type:'v1500BombReleased',encounterId:e.encounterId,bossId:e.profileId,id,x,y,releaseX:m.x,releaseY:m.y,pattern:e.bombPattern});
}
export function stepV1500Combat(g,e,dt){
 initializeV1500(e);if(!['entering','active'].includes(e.phase)||e.hp<=0||!(dt>0))return;
 for(const id in e.gunRecoil||{})e.gunRecoil[id]=Math.max(0,e.gunRecoil[id]-dt);
 const wingLoss=Number(e.parts?.wing_port?.hp<=0)+Number(e.parts?.wing_starboard?.hp<=0);
 if(wingLoss>finite(e.knownWingLoss)){e.structuralStagger=.85;e.v1500Shots=[];e.shotCues=[];e.gunClock=Math.max(finite(e.gunClock),.85);emit(g,{type:'v1500WingStagger',encounterId:e.encounterId,wingsLost:wingLoss});}
 e.knownWingLoss=wingLoss;e.structuralStagger=Math.max(0,finite(e.structuralStagger)-dt);
 aimGuns(g,e,dt);
 for(const bomb of e.releasedBombs)bomb.age+=dt;e.releasedBombs=e.releasedBombs.filter(b=>b.age<b.life);
 for(const b of e.hazards){b.age+=dt;if(!b.done&&b.age>=b.warning){b.done=true;for(const p of players(g))if(Math.hypot(p.x-b.x,p.y-b.y)<b.radius+finite(p.r,12)){if(g.players)g.hitPlayer?.(p,b.damage);else g.hit?.(b.damage);}g.combatBlast?.(b.x,b.y,b.radius,'enemy','structure');}}
 e.hazards=e.hazards.filter(b=>b.age<b.warning+.35);
 for(const q of e.shotCues){q.age+=dt;const w=muzzle(e,q.partId,q.a);q.x=w.x;q.y=w.y;if(!live(e,q.partId))q.done=true;}e.shotCues=e.shotCues.filter(q=>!q.done&&q.age<q.warning+.56);
 for(const q of e.v1500Shots){q.age+=dt;if(!live(e,q.partId)){q.next=q.count;continue;}while(q.next<q.count&&q.age>=q.warning+q.next*.14){const i=q.next++,a=q.a+(i/(q.count-1)-.5)*q.sweep*(q.serial%2?1:-1);if(!gunArc(q.partId,angleDelta(a,e.a))||Math.abs(angleDelta(a,e.a+finite(e.turretAngles[q.partId])))>.18)continue;const m=muzzle(e,q.partId,a);(g.bullets||=[]).push({...m,vx:Math.cos(a)*q.speed,vy:Math.sin(a)*q.speed,life:2.1,enemy:true,visualType:'boss',damage:q.damage,intrusionEncounterId:e.encounterId,encounterId:e.encounterId,sourceBossId:e.profileId,sourcePartId:q.partId});queueArtilleryMuzzle(g,{...m,angle:a,scale:.18,heavy:false});(e.gunRecoil||={})[q.partId]=.11;emit(g,{type:'v1500GunShot',encounterId:e.encounterId,partId:q.partId,x:m.x,y:m.y,a});}}
 e.v1500Shots=e.v1500Shots.filter(q=>q.next<q.count);
 e.gunClock-=dt;if(e.gunClock<=0&&e.structuralStagger<=0){e.gunClock=queueGun(g,e)?1.75:.25;}
 if(e.phase!=='active')return;
 e.bombClock-=dt;if(e.bombClock<=0){if(e.bombPattern==='paired'){releaseBomb(g,e,-1);releaseBomb(g,e,1);e.bombClock=2.3;}else{releaseBomb(g,e);e.bombClock=1.15;}}
}
export function beginV1500Destruction(g,e){
 initializeV1500(e);if(e.crash)return;
 const damage=id=>{const p=e.parts[id];return p?1-p.hp/p.maxHp:0;},ids=[...V1500_ENGINE_IDS].sort((a,b)=>damage(b)-damage(a)||a.localeCompare(b)),first=point(e,ids[0]),side=first.x<0?-1:1;
 const sites=[first,{x:side*240,y:-80},point(e,ids[1]),{x:-side*260,y:-100},{x:side*590,y:-80},{x:0,y:0},{x:-side*590,y:-80},{x:0,y:310},{x:0,y:100}];
 let seed=2166136261;for(const c of String(e.encounterId))seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
 const times=[0,.2,.49,.82,1.1,1.48,1.88,2.25,2.57];
 e.crash={age:0,side,speed:Math.max(55,Math.hypot(finite(e.worldVx),finite(e.worldVy))),index:0,sites:sites.map((p,i)=>({...p,at:times[i]+(i&&i<8?(((seed>>>(i*3))&7)-3)*.005:0)}))};
 e.v1500Shots=[];e.shotCues=[];e.hazards=[];e.releasedBombs=[];e.bayAmmo=0;
}
export function stepV1500Destruction(g,e,dt){
 if(!e.crash)beginV1500Destruction(g,e);const c=e.crash;c.age+=dt;advanceProps(e,dt,true);
 const q=clamp(c.age/V1500_DESTRUCTION_TIME,0,1);e.a+=c.side*(.10+.2*q)*dt;const speed=c.speed*(1+.15*q);e.worldVx=Math.cos(e.a)*speed;e.worldVy=Math.sin(e.a)*speed;e.x+=e.worldVx*dt;e.y+=e.worldVy*dt;e.crashDrop=38*q*q;
 while(c.index<c.sites.length&&c.sites[c.index].at<=c.age){const index=c.index++,site=c.sites[index],w=v1500WorldPoint(e,site),event={type:'v1500DestructionPulse',encounterId:e.encounterId,...w,radius:index===8?24:17+(index%3)*2,direction:e.a+Math.PI/2,pulseIndex:index,index,sound:[0,3,6,8].includes(index),final:index===8};queueV1500CollapseFx(g,event);emit(g,event);}
}


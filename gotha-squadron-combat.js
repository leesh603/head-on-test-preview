import {tickBomberWings} from './bomber-wing-damage.js';
import {arrivalFlightTurn,reserveArrivalFlight} from './boss-arrival-flight.js';
// City Gotha flights: guided forward flight, never slot-position interpolation.
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
export const GOTHA_TURN_RATE=1.1;
export function gothaOnScreen(b,bounds,margin=12){return !bounds||(b.x>=bounds.left+margin&&b.x<=bounds.right-margin&&b.y>=bounds.top+margin&&b.y<=bounds.bottom-margin);}
function partPoint(b,id,angle){const q=b.parts.get(id),reach=id.endsWith('-gun')?5:0,a=angle??q?.aimAngle??b.a;return {x:b.x+(q?.x||0)+Math.cos(a)*reach,y:b.y+(q?.y||0)+Math.sin(a)*reach};}
function cue(b,v){const q=partPoint(b,v.partId,v.angle),reach=460;b.command('charge-warning',{...q,partId:v.partId,targetX:q.x+Math.cos(v.angle)*reach,targetY:q.y+Math.sin(v.angle)*reach,lockedAngle:v.angle,followSource:true,seconds:v.left});}
function steer(b,dt,p,phase,radius,active,beat){
 const pvx=p.vx||0,pvy=p.vy||0;
 b.gothaRadius??=radius;b.gothaRadius+=clamp(radius-b.gothaRadius,-65*dt,65*dt);
 const r=b.gothaRadius,omega=.45,angle=phase;
 const tx=p.x+Math.cos(angle)*r,ty=p.y+Math.sin(angle)*r;
 let vx=pvx-Math.sin(angle)*r*omega+(tx-b.x)*1.15;
 let vy=pvy+Math.cos(angle)*r*omega+(ty-b.y)*1.15;
 // Separation changes the desired heading, never an aircraft's coordinates.
 // Firmer since the waiting orbit moved in from 620 px to 470 px.
 for(const q of b.encounter?.bodies.values()||[]){if(q===b||q.dead||q.kind!=='gotha-raider')continue;const dx=b.x-q.x,dy=b.y-q.y,d=Math.hypot(dx,dy);if(d>1&&d<230){const n=(230-d)*5;vx+=dx/d*n;vy+=dy/d*n;}}
 const desired=Math.atan2(vy,vx),engines=b.engines(),limit=GOTHA_TURN_RATE*(engines===2?1:.8);
 let goal=clamp(Math.hypot(vx,vy),engines===2?80:65,engines===2?400:330);
 // A chased bomber must be catchable: a player-centered orbit otherwise moves
 // its destination away at the pursuer's own speed forever. Reentry still has
 // full catch-up speed when the player is flying away or the flight is distant.
 const dx=b.x-p.x,dy=b.y-p.y,distance=Math.hypot(dx,dy),pursuitSpeed=Math.hypot(pvx,pvy);
 if(pursuitSpeed>80&&distance>1&&distance<750&&(pvx*dx+pvy*dy)/(pursuitSpeed*distance)>.98)goal=Math.min(goal,pursuitSpeed*.78);
 // Throttle back to turn: at full speed the forward-only turn circle is wider
 // than the screen, so a flight whose orbit point swung behind it looped a
 // thousand pixels away before coming back. Slower, it turns in on the spot.
 const off=Math.abs(wrap(desired-b.a));if(off>.45)goal=Math.max(engines===2?80:65,Math.min(goal,goal*(1.2-off*.45)));
 if(!b.gothaVolley)b.a+=arrivalFlightTurn(b,dt,desired,limit,b.gothaSpeed||170,goal,90,70)*dt;
 else reserveArrivalFlight(b,0);
 b.gothaSpeed??=goal;b.gothaSpeed+=clamp(goal-b.gothaSpeed,-70*dt,90*dt);
 b.x+=Math.cos(b.a)*b.gothaSpeed*dt;b.y+=Math.sin(b.a)*b.gothaSpeed*dt;
 b.rotateMounts();
}
function gunFor(b,p){
 const distance=Math.hypot(p.x-b.x,p.y-b.y);if(distance>620||distance<70)return null;
 const relative=Math.abs(wrap(Math.atan2(p.y-b.y,p.x-b.x)-b.a));
 const id=relative<.22?'front-gun':relative>1.15?'rear-gun':null,part=b.parts.get(id);
 return part&&!part.destroyed?part:null;
}
function gun(b,p,bounds,dt,allowed,startAllowed){
 b.gothaGunClock=Math.max(0,(b.gothaGunClock??(.7+(b.slot%3)*.5))-dt);
 const v=b.gothaVolley;
 if(v){
  v.left-=dt;const part=b.parts.get(v.partId);
  if(part?.destroyed||!allowed||!gothaOnScreen(b,bounds)){b.gothaVolley=null;return;}
  if(v.left>0)return;
  b.gothaVolley=null;
  const q=partPoint(b,v.partId,v.angle);if(!gothaOnScreen(q,bounds,0))return;const relative=Math.abs(wrap(v.angle-b.a));
  if(v.partId==='front-gun'&&relative>.22||v.partId==='rear-gun'&&relative<1.1)return;
  b.gothaGunClock=2.8;
  part.aimAngle=v.angle;part.gunFlash=.18;
  b.command('muzzle',{...q,partId:v.partId});
  for(const spread of [-.1,0,.1]){const a=v.angle+spread;b.hazard('projectile',{...q,vx:Math.cos(a)*v.speed,vy:Math.sin(a)*v.speed,radius:5,duration:1.35,warning:0,damage:b.t.damage*.45,visual:'gotha-mg',sourcePartId:v.partId,sourceOffsetX:Math.cos(v.angle)*5,sourceOffsetY:Math.sin(v.angle)*5,tag:b.id+'-'+v.partId,lockedAim:true,signatureAttack:true});}
  return;
 }
 if(!allowed||!startAllowed||b.gothaGunClock>0||!gothaOnScreen(b,bounds))return;
 const part=gunFor(b,p);if(!part)return;const partId=part.id;
 const warning=.9,speed=Math.max(260,b.t.bulletSpeed*.85),q=partPoint(b,partId);
 const futureX=q.x+Math.cos(b.a)*b.gothaSpeed*warning,futureY=q.y+Math.sin(b.a)*b.gothaSpeed*warning;
 const lead=warning+Math.min(.6,Math.hypot(p.x-b.x,p.y-b.y)/speed*.55),tx=p.x+(p.vx||0)*lead,ty=p.y+(p.vy||0)*lead;
 const angle=partId==='front-gun'?b.a:Math.atan2(ty-futureY,tx-futureX);
 if(partId==='rear-gun'&&Math.abs(wrap(angle-b.a))<1.1)return;
 b.gothaVolley={partId,left:warning,angle,speed};part.aimAngle=angle;cue(b,b.gothaVolley);
}
function bomb(b,p,bounds,cycle,allowed){
 if(!allowed||b.parts.get('bomb-bay')?.destroyed||!b.engines())return;
 const visible=gothaOnScreen(b,bounds);
 if(!visible&&!b.runTarget)return;
 const key=Math.floor(cycle/8);if(b.gothaBombCycle===key)return;
 b.gothaBombCycle=key;b.bayOpen=1;
 const speed=Math.hypot(p.vx||0,p.vy||0),warning=.95;
 const tx=p.x+(p.vx||0)*warning,ty=p.y+(p.vy||0)*warning;
 const a=speed>1?Math.atan2(p.vy,p.vx):b.a;
 const q=partPoint(b,'bomb-bay'),count=b.engines()===2?2:1;
 // Lock once at release: turning after this tell wins, not an endless chase.
 for(let i=0;visible&&i<count;i++){const x=tx+Math.cos(a)*i*70,y=ty+Math.sin(a)*i*70;
  b.hazard('circle',{x,y,radius:42,warning:warning+i*.2,duration:.22,once:true,damage:b.t.damage*.8,visual:'carpet-bomb',airborneBomb:true,sourceX:q.x,sourceY:q.y,sourcePartId:'bomb-bay',tag:b.id+'-payload',lockedAim:true});}
 releaseCityBomb(b,q);
}
export function releaseCityBomb(b,q){
 const t=b.runTarget;
 if(t){
  b.command('city-bomb',{runId:b.runId,targetId:t.id,x:t.x,y:t.y,sourceX:q.x,sourceY:q.y,seconds:1.1,damage:6});
  b.hazard('circle',{x:t.x,y:t.y,radius:42,warning:1.1,duration:.22,once:true,damage:b.t.damage*.8,visual:'carpet-bomb',airborneBomb:true,objective:true,sourceX:q.x,sourceY:q.y,sourcePartId:'bomb-bay',tag:b.id+'-payload',lockedAim:true});
  b.runTarget=null;b.runRemaining=0;b.onBombLine=false;
 }
}
export function abortCityBomb(b){
 if(b.runTarget)b.command('city-bomb-abort',{runId:b.runId});
 b.runTarget=null;b.runRemaining=0;b.onBombLine=false;
}
export function planCityBomb(b,targets,time,active,period,release){
 const beat=time%period,key=Math.floor(time/period);
 if(b.runTarget){
  b.runRemaining=Math.max(0,release-beat);
  b.onBombLine=b.runRemaining<=.4;
  if(!active||beat>=release+.5||b.parts.get('bomb-bay')?.destroyed||!b.engines()||b.runTarget.hp<=0)abortCityBomb(b);
 }
 if(!active||beat<release-1.5||beat>=release||b.cityPlanCycle===key||b.parts.get('bomb-bay')?.destroyed||!b.engines())return;
 // City districts are fixed world objectives; moving the camera must not
 // protect them or cancel a warned bombing run.
 const available=targets.filter(q=>q.hp>0),slot=b.slot%3+(targets.length>3?key:0),t=available[slot%available.length];if(!t)return;
 b.cityPlanCycle=key;b.runTarget=t;b.runId=b.id+':city:'+key;b.runRemaining=release-beat;
 b.command('city-bomb-warning',{runId:b.runId,targetId:t.id,x:t.x,y:t.y,seconds:b.runRemaining});
}
export function updateGothaCombat(b,dt,{players=[],bounds,londonTargets=[]}){
 if(b.dead||!dt)return;const p=players.find(q=>q.alive);if(!p)return;
 tickBomberWings(b,dt);b.gothaTime=(b.gothaTime||0)+dt;b.entryAge=(b.entryAge||0)+dt;
 const live=[...b.encounter?.bodies.values()||[b]].filter(q=>!q.dead&&q.kind==='gotha-raider');
 const groups=[...new Set(live.map(q=>Math.floor(q.slot/3)))].sort(),time=b.encounter?.clock??b.gothaTime;
 const active=groups[Math.floor(time/8)%groups.length],next=groups[(Math.floor(time/8)+1)%groups.length],beat=time%8;
 const group=Math.floor(b.slot/3),engines=b.engines();
 const isActive=group===active,preentry=group===next&&beat>=4;
 // The waiting flights orbit at 470 px (was 620): near the screen edge, not
 // far outside it where they read as having flown off.
 const radius=isActive?220:preentry?340:470;
 const angle=time*.45+(b.slot%3)*TAU/3+group*TAU/9;
 if(!b.gothaStarted){b.gothaStarted=true;b.gothaRadius=radius;b.x=p.x+Math.cos(angle)*radius;b.y=p.y+Math.sin(angle)*radius;b.a=angle+Math.PI/2;b.gothaSpeed=170;b.command('gotha-approach');}
 for(const part of b.parts.values()){part.gunFlash=Math.max(0,(part.gunFlash||0)-dt);part.hitFlash=Math.max(0,(part.hitFlash||0)-dt);}
 // No camera displacement, lateral trim, snap-to-slot or return teleport.
 steer(b,dt,p,angle,radius,isActive,beat);
 const front=b.parts.get('front-gun');if(front)front.aimAngle=b.a;
 if(!engines){b.gothaVolley=null;b.glideAge=(b.glideAge||0)+dt;b.phase='gliding';if(b.glideAge>4.6)b.hit({damage:b.hp*2});return;}
 // A trailing flight can cover a missed pass without firing offscreen or
 // advancing the attack clock of the flight assigned to this pass.
 const canCover=q=>q.engines()&&gothaOnScreen(q,bounds)&&(q.gothaVolley||((q.gothaGunClock??0)<=dt&&gunFor(q,p)));
 const cover=b.arrivalFlightGuard&&beat<4.35&&!live.some(q=>Math.floor(q.slot/3)===active&&canCover(q))
  ?live.find(q=>q.gothaVolley)||live.find(canCover)
  :null;
 const fighting=(isActive||b===cover||!!b.gothaVolley)&&beat<5.3&&b.entryAge>1.1;
 const phase=!isActive?'gotha-reentry':beat<2.5?'gotha-cover':beat<5.3?'gotha-crossfire':beat<6.5?'gotha-bomb-run':'gotha-regroup';
 b.phase=phase;
 gun(b,p,bounds,dt,fighting,beat<4.35);
 if(b.gothaVolley)reserveArrivalFlight(b,0);

 if(!fighting)b.gothaVolley=null;
 const release=engines===2?5.3:5.55;
 planCityBomb(b,londonTargets,time,isActive,8,release);
 bomb(b,p,bounds,time,isActive&&beat>=release&&beat<5.8);
 b.bayOpen=Math.max(0,b.bayOpen-dt*.5);
}


/** WWI submarine encounters. Deck-shell spray threatening aircraft is an arcade
 * interpretation; submerged torpedoes can only hit surface shipping. */
export const SUBMARINE_PROFILES=Object.freeze({
 uboat:{id:'uboat',name:'U-35',faction:'central',mode:'naval-submarine',enabled:true,stages:[1,16],domain:'sea',hpRatio:.43,detail:'갑판포를 피하며 어뢰 발사관을 파괴하세요.'},
 m1:{id:'m1',name:'HMS M1',faction:'entente',mode:'naval-submarine',enabled:true,stages:[1,16],domain:'sea',hpRatio:.48,detail:'주포 예고를 피하고 재장전 중 공격하세요.'}
});
export const isNewSubmarine=e=>!!SUBMARINE_PROFILES[typeof e==='string'?e:e?.profileId];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
const M1_WARNING=2.2;
const M1_SPLASH_RADIUS=43;
const live=p=>p.hp>0&&(!p.status||p.status==='alive');
const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
const inView=(g,e,p)=>Math.abs(p.x-finite(g.x))<e.width*.48&&Math.abs(p.y-finite(g.y))<e.height*.48;

function flightPoint(p,speed,heading,turn,time){
 if(Math.abs(turn)<.001)return{x:p.x+Math.cos(heading)*speed*time,y:p.y+Math.sin(heading)*speed*time};
 const a=heading+turn*time;
 return{x:p.x+speed*(Math.sin(a)-Math.sin(heading))/turn,y:p.y+speed*(Math.cos(heading)-Math.cos(a))/turn};
}
function m1Target(g,e,players){
 const preferred=players[e.volley%players.length];
 return preferred&&inView(g,e,preferred)?preferred:players.find(p=>inView(g,e,p))||preferred;
}
function submarineImpact(g,e,p,predictImpact,warning){
 const track=e.naval.aimTracks?.[p.id||'p1'];
 if(!track||Math.abs(track.turn)<.025)return predictImpact?predictImpact(g,e,p,warning):p;
 // Give the ring the same minimum on-screen warning as a straight flypast.
 const impact=flightPoint(p,track.speed,track.heading,track.turn,warning);
 const approach=flightPoint(p,track.speed,track.heading,track.turn,warning-.65);
 return inView(g,e,{x:impact.x-approach.x+p.x,y:impact.y-approach.y+p.y})?impact:null;
}
export const submarineTimings=e=>({exposed:e.profileId==='m1'?14:12,diving:1,submerged:1.6,surfacing:1.2});
export const submarineGunArc=e=>e.profileId==='m1'?Math.PI/12:Math.PI/3;
export function submarineDrive(e){const p=e.parts?.propulsion;if(!p)return{speed:1,turn:1};return p.hp<=0?{speed:.45,turn:.45}:p.hp<=p.maxHp*.5?{speed:.7,turn:.7}:{speed:1,turn:1};}
export function stepSubmarineMechanisms(e,dt){const n=e.naval;if(!n)return;n.gunRecoil=Math.max(0,(n.gunRecoil||0)-dt*4);n.periscopeAngle=(n.periscopeAngle||0)+(e.parts?.dive_control?.hp>0?dt*.45:0);}

export function submarinePhase(e){if(e.phase==='retreating')return 'diving';if(e.phase==='warning')return 'submerged';if(e.phase==='entering')return 'surfacing';return e.naval?.phase||'surfaced';}
export function submarineLayers(e){
 const phase=submarinePhase(e),age=['entering','retreating'].includes(e.phase)?e.phaseAge:e.naval?.phaseAge||0;
 if(phase==='submerged')return {surface:0,diving:0,periscope:1};
 if(phase==='diving'){const k=clamp(age,0,1);return{surface:Math.max(0,1-k*2),diving:Math.sin(k*Math.PI),periscope:k};}
 if(phase==='surfacing'){const k=clamp(age/1.2,0,1);return{surface:Math.max(0,(k-.35)/.65),diving:Math.sin(k*Math.PI),periscope:1-k};}
 return {surface:1,diving:0,periscope:0};
}
export function submarineSteering(g,e,dt,layout,predictImpact=null){
 const n=e.naval;if(!n)return;
 const heavy=e.profileId==='m1';
 if(n.phase!=='surfaced'){n.aimTracks=null;return;}
 // Limited-traverse separated gun: slew before firing, then hold its bearing
 // while a locked splash warning is on screen. Hull steering stays bounded.
 const players=(g.players||[g]).filter(live);
 n.aimTracks??={};
 for(const p of players){
  const key=p.id||'p1',old=n.aimTracks[key],a=finite(p.a,-Math.PI/2),speed=finite(p.baseSpeed,p.speed||0)*finite(p.pilotFlightFraction,1);
  const vx=finite(p.vx,Math.cos(a)*speed),vy=finite(p.vy,Math.sin(a)*speed);
  const heading=Math.hypot(vx,vy)>1?Math.atan2(vy,vx):a;
  const measured=old?angle(heading-old.heading)/dt:!n.cycle&&p===players[0]?finite(e.contactTurnRate):0;
  const turn=clamp(measured,-1.5,1.5);
  n.aimTracks[key]={heading,speed:Math.hypot(vx,vy),turn:old?old.turn+(turn-old.turn)*Math.min(1,dt*8):turn};
 }
 const p=heavy?m1Target(g,e,players):players[0];
 if(!p||e.hazards.some(h=>!h.done))return;
 const aim=submarineImpact(g,e,p,predictImpact,heavy?M1_WARNING:1.8);
 if(!aim)return;
 const travel=heavy?finite(n.speed)*M1_WARNING:0;
 const mount=layout?.targets?.find(t=>t.id==='deck_gun')||{x:0,y:0},yaw=e.a+Math.PI/2;
 const gx=e.x+Math.cos(e.a)*travel+e.scale*(mount.x*Math.cos(yaw)-mount.y*Math.sin(yaw));
 const gy=e.y+Math.sin(e.a)*travel+e.scale*(mount.x*Math.sin(yaw)+mount.y*Math.cos(yaw));
 const delta=angle(Math.atan2(aim.y-gy,aim.x-gx)-e.a),arc=submarineGunArc(e),gun=e.parts?.deck_gun;
 if(gun?.hp>0){const current=e.turretAngles.deck_gun||0,rate=heavy?.35:.8;e.turretAngles.deck_gun=current+clamp(clamp(delta,-arc,arc)-current,-rate*dt,rate*dt);}
 if((!heavy&&n.phaseAge<2.4)||(n.avoidanceUntil||0)>n.clock)return;
 const desired=Math.atan2(aim.y-e.y,aim.x-e.x);
 n.course=e.a+clamp(angle(desired-e.a),-.25*dt,.25*dt);
}
export function queueSubmarineAttack(g,e,layout,api){
 if(!isNewSubmarine(e))return false;
 e.naval.didQueueAttack=false;
 if(submarinePhase(e)!=='surfaced')return true;
 const gun=layout.targets.find(t=>t.id==='deck_gun');
 const heavy=e.profileId==='m1',warning=heavy?M1_WARNING:1.8,players=api.alive(g);
 const p=heavy?m1Target(g,e,players):players[e.volley%Math.max(1,players.length)];
 const impact=p?submarineImpact(g,e,p,api.predictImpact,warning):null;
 if(e.parts.dive_control?.hp>0&&e.naval.phaseAge+warning>=submarineTimings(e).exposed)return true;
 if(impact&&gun&&api.canFire(e,gun.id)){
  const original=gun.muzzle,rotation=e.turretAngles.deck_gun||0,c=Math.cos(rotation),s=Math.sin(rotation),m={x:original.pivotX+(original.x-original.pivotX)*c-(original.y-original.pivotY)*s,y:original.pivotY+(original.x-original.pivotX)*s+(original.y-original.pivotY)*c},wp=api.world(e,m);
  const travel=heavy?finite(e.naval.speed)*warning:0;
  const fireX=wp.x+Math.cos(e.a)*travel,fireY=wp.y+Math.sin(e.a)*travel;
  const bearing=Math.atan2(impact.y-fireY,impact.x-fireX),barrel=e.a+rotation;
  const range=Math.hypot(impact.x-fireX,impact.y-fireY);
  // The aligned barrel locks a splash warning on the sea. This is an arcade
  // low-altitude hazard, not an underwater weapon hitting an aircraft.
  if((!heavy||range>M1_SPLASH_RADIUS)&&api.visible(g,e,wp)&&api.visible(g,e,p)&&Math.abs(angle(bearing-barrel))<(heavy?.12:.2)&&!e.hazards.some(h=>!h.done)){
   if(heavy)e.naval.course=e.a;
   const splash=heavy?{x:fireX+Math.cos(barrel)*range,y:fireY+Math.sin(barrel)*range}:impact;
   e.naval.didQueueAttack=true;e.hazards.push({kind:'naval-splash',...splash,radius:heavy?M1_SPLASH_RADIUS:30,age:0,warning,damage:heavy?22:14,sourcePartId:gun.id,localMuzzle:m,localAngle:-Math.PI/2+rotation,done:false});
  }
 }
 if(e.profileId==='uboat'&&api.canFire(e,'torpedo_tubes')){
  const ships=(g.friendlyShips||[]).filter(s=>s.movingShip&&s.hp>0&&!s.expired&&s.faction!==SUBMARINE_PROFILES[e.profileId].faction);
  const ship=ships.filter(s=>api.visible(g,e,s)).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0];
  const shots=e.naval.torpedoes||(e.naval.torpedoes=[]);
  if(ship&&shots.length<3){e.naval.didQueueAttack=true;const bow=api.world(e,{x:0,y:-layout.height*.46}),a=Math.atan2(ship.y-bow.y,ship.x-bow.x);shots.push({x:bow.x,y:bow.y,vx:Math.cos(a)*110,vy:Math.sin(a)*110,age:0,warning:1.4,life:5,damage:18});}
 }
 if(e.naval.didQueueAttack)e.volley++;return true;
}
function entryTime(a,b){const x=b.x-a.x,y=b.y-a.y,A=x*x+y*y,B=2*(a.x*x+a.y*y),C=a.x*a.x+a.y*a.y-1;if(C<=0)return 0;if(!A)return Infinity;const D=B*B-4*A*C;if(D<0)return Infinity;const t=(-B-Math.sqrt(D))/(2*A);return t>=0&&t<=1?t:Infinity;}
export function stepSubmarineTorpedoes(g,e,dt){
 const shots=e.naval?.torpedoes;if(!shots)return;
 for(const q of shots){if(q.age<q.warning&&(e.parts?.torpedo_tubes?.hp<=0||submarinePhase(e)!=='surfaced')){q.life=0;continue;}q.age+=dt;if(q.age<q.warning)continue;const old={x:q.x,y:q.y};q.x+=q.vx*dt;q.y+=q.vy*dt;q.life-=dt;
  let first=null,firstT=Infinity;for(const ship of g.friendlyShips||[]){if(!ship.movingShip||ship.hp<=0||ship.expired||ship.faction===SUBMARINE_PROFILES[e.profileId].faction)continue;
   // Swept ship-local ellipse, never the aircraft player or generic enemies.
   const a=ship.a||0,c=Math.cos(a),s=Math.sin(a),local=p=>({x:(p.x-ship.x)*c+(p.y-ship.y)*s,y:-(p.x-ship.x)*s+(p.y-ship.y)*c});
   const p=local(old),v=local(q),rx=Math.max(20,ship.hullLength||75),ry=Math.max(10,ship.hullWidth||20);
   const t=entryTime({x:p.x/rx,y:p.y/ry},{x:v.x/rx,y:v.y/ry});if(t<firstT){first=ship;firstT=t;}
  }
  if(first){q.x=old.x+(q.x-old.x)*firstT;q.y=old.y+(q.y-old.y)*firstT;first.hp=Math.max(0,first.hp-q.damage);q.life=0;g.combatBlast?.(q.x,q.y,26,'enemy','structure');}
 }
 e.naval.torpedoes=shots.filter(q=>q.life>0&&q.age<7);
}

/** Reserve one clear patch of open sea before the visible periscope cue. The
 * sea-only regions have no shoreline cells; harbours/Dover are not eligible. */
export function placeSubmarineContact(g,e,layout,overlaps,ships){
 const p=(g.players||[g]).find(live)||g,v=e.contactVelocity||{x:0,y:0};
 const speed=Math.hypot(v.x,v.y),a=speed>1?Math.atan2(v.y,v.x):finite(p.a,-Math.PI/2);
 const timeToSurface=Math.max(0,4-Math.max(2.8,e.phaseAge||0))+1.2;
 const offsetAhead=Math.min(e.width,e.height)*.12;
 const turn=clamp(e.contactTurnRate||0,-1.5,1.5);
 // Set the hull down once, before its periscope is drawn. Leave room in
 // front of the barrel even when the approaching aircraft is turning tightly.
 const origin={x:finite(p.x),y:finite(p.y)};
 const surface=flightPoint(origin,speed,a,turn,timeToSurface);
 const impact=flightPoint(origin,speed,a,turn,timeToSurface+.4+(e.profileId==='m1'?M1_WARNING:1.8));
 const distance=Math.hypot(impact.x-surface.x,impact.y-surface.y);
 const heading=distance>1?Math.atan2(impact.y-surface.y,impact.x-surface.x):a;
 const gunReach=layout.targets.find(t=>t.id==='deck_gun')?.muzzle.y||0;
 const ahead=Math.abs(turn)>.001?Math.min(offsetAhead,distance-90)+gunReach*e.scale:offsetAhead;
 const cx=surface.x+Math.cos(heading)*ahead,cy=surface.y+Math.sin(heading)*ahead;
 for(const offset of [0,.23,-.23,.38,-.38]){
  const x=cx-Math.sin(heading)*e.width*offset,y=cy+Math.cos(heading)*e.width*offset;
  const r={x,y,w:(layout.hullBounds?.width||layout.width)*e.scale,h:(layout.hullBounds?.height||layout.height)*e.scale,yaw:heading+Math.PI/2};
  if(ships.some(b=>overlaps(r,b,28)))continue;
  Object.assign(e,{x,y,a:heading,contactPlaced:true,naval:{phase:'surfacing',phaseAge:0,clock:0,cycle:0,course:heading,speed:0,wakeTrail:[],wakeClock:0,torpedoes:[]}});return true;
 }
 return false;
}

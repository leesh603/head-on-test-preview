import {arrivalFlightTurn} from './boss-arrival-flight.js';
export const CITY_BOMBER_GUN_REACH=5;

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Keep each flight's lead and trailing wings on one course. The destination
// moves; the aircraft still reaches it by forward flight and collision-safe turns.
export function cityBomberFormation(body,p,phase,radius,omega,live){
 const group=Math.floor(body.slot/3),flight=live.filter(b=>Math.floor(b.slot/3)===group);
 const rank=flight.indexOf(body),scale=body.regionalScale||1;
 const side=rank<=0?0:(rank===1?-1:1)*134*scale;
 const trail=rank<=0?0:205*scale,co=Math.cos(phase),si=Math.sin(phase),r=radius+side;
 return {x:p.x+co*r+si*trail,y:p.y+si*r-co*trail,
  vx:(p.vx||0)+(-si*r+co*trail)*omega,vy:(p.vy||0)+(co*r+si*trail)*omega};
}

// Feed a gradual rudder command INTO the existing avoidance predictor. Never
// smooth its result afterwards, which would invalidate its collision forecast.
export function cityBomberTurn(body,dt,desired,limit,speed,goal,accel,decel){
 // Easing is safe only while the existing flight guard can override it.
 if(!body.arrivalFlightGuard)return arrivalFlightTurn(body,dt,desired,limit,speed,goal,accel,decel);
 const error=Math.atan2(Math.sin(desired-body.a),Math.cos(desired-body.a));
 const wanted=clamp(error/.42,-limit,limit),prior=body.cityTurn||0;
 const rate=prior+clamp(wanted-prior,-limit*3.4*dt,limit*3.4*dt);
 return body.cityTurn=arrivalFlightTurn(body,dt,body.a+rate*dt,limit,speed,goal,accel,decel);
}

// Widths are world-space units, the same used by the battle camera.
export function cityBomberScale({regionalViewWidth:width}){
 return Number.isFinite(width)&&width>0?(115+13*Math.max(0,Math.min(1,(width-450)/510)))/100:1;
}

export function glideCityBomber(body,dt,speed){
 body.glideAge=(body.glideAge||0)+dt;
 body.phase='gliding';
 const next=Math.max(52,speed-28*dt),distance=(speed+next)*.5*dt;
 body.x+=Math.cos(body.a)*distance;
 body.y+=Math.sin(body.a)*distance;
 body.rotateMounts();
 return next;
}

export function moveCityBomberBay(body,dt,preparing){
 const target=preparing?1:0,open=body.bayOpen||0;
 const step=dt*(preparing?2.8:1.25);
 body.bayOpen=open+Math.sign(target-open)*Math.min(Math.abs(target-open),step);
}

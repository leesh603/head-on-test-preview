// The combat decoy and its short render-only continuation share one flight path.
// Closed-form arcs keep position, tangent heading and 140px/s speed in agreement
// at any update rate; no render displacement is applied to a live combat target.
// Open the two halves away from one another. Alternating hard turns make
// neighboring aircraft converge into pairs instead of reading as a flying fan.
const baseTurns=Object.freeze([.95,.65,.35,-.35,-.65,-.95]);
const medalTurns=Object.freeze([.95,.7,.45,.2,-.2,-.45,-.7,-.95]);
export function beginVossDecoyFlight(d,slot){
 const turns=d.medalDecoy?medalTurns:baseTurns;
 d.vossFlight={x:d.x,y:d.y,a:d.a,speed:Math.hypot(d.vx,d.vy),turn:turns[slot%turns.length]};return d;
}
export function vossDecoyFlightPose(f,age){
 const t=Math.max(0,age),a=f.a+f.turn*t;
 const x=f.x+f.speed/f.turn*(Math.sin(a)-Math.sin(f.a));
 const y=f.y+f.speed/f.turn*(Math.cos(f.a)-Math.cos(a));
 return {x,y,a,vx:Math.cos(a)*f.speed,vy:Math.sin(a)*f.speed};
}
export function advanceVossDecoyFlight(d,dt){
 if(d.pilot!=='voss'||!d.vossFlight){d.x+=d.vx*dt;d.y+=d.vy*dt;return}
 const age=(d.medalDecoy?1.6:1.2)-d.life;
 Object.assign(d,vossDecoyFlightPose(d.vossFlight,age));
}

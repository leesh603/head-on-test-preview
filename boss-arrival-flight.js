// An arrival-opted-in flight guard. It only selects a legal turn rate; position,
// airspeed, weapon clocks and the native flight controller remain authoritative.
const frames=new WeakMap(),lookahead=[.1,.25,.4,.6,.8,1,1.2,1.5,1.8,2.1,2.4];
function flightFrame(b){
 const encounter=b.encounter;if(!encounter)return[];
 let cached=frames.get(encounter);
 if(!cached||cached.clock!==encounter.clock){
  cached={clock:encounter.clock,poses:[...encounter.bodies.values()].filter(q=>!q.dead).map(q=>({body:q,x:q.x,y:q.y,a:q.a,kind:q.kind,speed:q.gothaSpeed||q.speed||170,goal:q.kind==='gotha-raider'?q.arrivalFlightGoal:q.speed,accel:q.kind==='gotha-raider'?90:105,decel:q.kind==='gotha-raider'?70:85,rate:q.gothaVolley?0:q.arrivalFlightTurn||0}))};
  frames.set(encounter,cached);
 }
 return cached.poses;
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function predicted(b,rate,t,speed,goal=speed,accel=0,decel=0){
 goal=Number.isFinite(goal)?goal:speed;const acceleration=goal>=speed?accel:-decel;
 const ramp=acceleration?Math.min(t,Math.abs((goal-speed)/acceleration)):0,a=b.a+rate*t,ar=b.a+rate*ramp;
 const endSpeed=speed+acceleration*ramp;
 if(Math.abs(rate)<.001){const distance=speed*ramp+acceleration*ramp*ramp/2+endSpeed*(t-ramp);return{x:b.x+Math.cos(b.a)*distance,y:b.y+Math.sin(b.a)*distance,a};}
 const dx=speed*(Math.sin(ar)-Math.sin(b.a))/rate+acceleration*(ramp*Math.sin(ar)/rate+(Math.cos(ar)-Math.cos(b.a))/(rate*rate))+endSpeed*(Math.sin(a)-Math.sin(ar))/rate;
 const dy=speed*(Math.cos(b.a)-Math.cos(ar))/rate+acceleration*(-ramp*Math.cos(ar)/rate+(Math.sin(ar)-Math.sin(b.a))/(rate*rate))+endSpeed*(Math.cos(ar)-Math.cos(a))/rate;
 return{x:b.x+dx,y:b.y+dy,a};
}
function gap(a,b,w,h){
 let best=-Infinity;
 for(const axis of [a.a,a.a+Math.PI/2,b.a,b.a+Math.PI/2]){
  const extent=p=>h/2*Math.abs(Math.cos(p.a-axis))+w/2*Math.abs(Math.sin(p.a-axis));
  best=Math.max(best,Math.abs((b.x-a.x)*Math.cos(axis)+(b.y-a.y)*Math.sin(axis))-extent(a)-extent(b));
 }
 return best;
}
export function arrivalFlightTurn(b,dt,desired,limit,speed,goal=speed,accel=0,decel=0){
 const native=clamp(Math.atan2(Math.sin(desired-b.a),Math.cos(desired-b.a))/dt,-limit,limit);
 if(!(b.arrivalFlightGuard>0))return native;
 b.arrivalFlightGoal=goal;
 const poses=flightFrame(b),peers=poses.filter(q=>q.body!==b&&q.kind===b.kind&&Math.hypot(q.x-b.x,q.y-b.y)<1100);
 const [w,h]=b.kind==='gotha-raider'?[210,210]:[184,123];
 const forecasts=peers.map(q=>lookahead.map(t=>predicted(q,q.rate,t,q.speed,q.goal,q.accel,q.decel)));
 let best=native,bestScore=Infinity,bestSafe=false;
 for(const rate of [native,-limit,-limit*.5,0,limit*.5,limit]){
  let score=(rate-native)**2*18+(rate-(b.arrivalFlightTurn||0))**2*3,minimum=Infinity;
  const path=lookahead.map(t=>predicted(b,rate,t,speed,goal,accel,decel));
  for(const forecast of forecasts)for(let i=0;i<lookahead.length;i++){
   const t=lookahead[i],clear=gap(path[i],forecast[i],w,h);
   minimum=Math.min(minimum,clear);
   score+=(clear<8?100000+(8-clear)**2*100:Math.max(0,35-clear)**2)*(3-t);
  }
  if(rate===native&&minimum>=35){best=native;break;}
  const safe=minimum>=8;
  if(safe&&!bestSafe||safe===bestSafe&&score<bestScore){bestScore=score;best=rate;bestSafe=safe;}
 }
 b.arrivalFlightTurn=best;const reservation=poses.find(q=>q.body===b);if(reservation)reservation.rate=best;return best;
}

export function reserveArrivalFlight(b,rate=0){
 if(!b.arrivalFlightGuard)return;
 b.arrivalFlightTurn=rate;const pose=flightFrame(b).find(q=>q.body===b);if(pose)pose.rate=rate;
}

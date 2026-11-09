/** One world-space silhouette pass. It shares the subsequent nose-first arrival heading. */
const finite=(n,d=0)=>Number.isFinite(n)?n:d;
export function stepGiantArrivalShadow(g,e,dt){
 if(e.phase!=='warning')return;
 if(!e.shadowPass){
  const p=(g.players||[g]).find(p=>p.hp>0)||g,a=finite(p.a,-Math.PI/2);
  const speed=Math.max(0,Math.hypot(finite(p.vx,Math.cos(a)*finite(p.speed)),finite(p.vy,Math.sin(a)*finite(p.speed))));
  const margin=Math.hypot(e.width,e.height)*.5+Math.max(e.width*.39,100)+40;
  e.shadowPass={x:finite(p.x)-Math.cos(a)*margin,y:finite(p.y)-Math.sin(a)*margin,a,distance:margin*2+Math.min(600,speed)*4,age:0};
 }
 e.shadowPass.age=Math.min(4,e.shadowPass.age+dt);
}
export function giantArrivalShadowPose(e){
 const s=e.shadowPass;if(!s)return null;
 const t=Math.max(0,Math.min(1,s.age/4));
 return{x:s.x+Math.cos(s.a)*s.distance*t,y:s.y+Math.sin(s.a)*s.distance*t,a:s.a,alpha:.2*Math.min(1,t*8,(1-t)*8)};
}

// Keep the authored straight entry until the pilot breaks its approach line.
// The replacement leg still integrates nose-first and retains a stand-off gap.
export function followTurningArrival(body,entry,pilot,v,dt,plannedSpeed,gap){
 const heading=Math.atan2(v.y,v.x);
 const delta=heading-entry.a;
 entry.tracking ||= Math.hypot(v.x,v.y)>30&&Math.abs(Math.atan2(Math.sin(delta),Math.cos(delta)))>.55;
 if(!entry.tracking)return false;
 const dx=pilot.x+v.x*.32-body.x,dy=pilot.y+v.y*.32-body.y;
 const distance=Math.hypot(dx,dy),error=Math.atan2(dy,dx)-body.a;
 const turn=Math.atan2(Math.sin(error),Math.cos(error));
 body.a+=Math.max(-2.2*dt,Math.min(2.2*dt,turn));
 const speed=Math.min(Math.max(80,plannedSpeed),Math.max(0,distance-gap)*2);
 body.worldVx=Math.cos(body.a)*speed;body.worldVy=Math.sin(body.a)*speed;
 body.x+=body.worldVx*dt;body.y+=body.worldVy*dt;
 return true;
}

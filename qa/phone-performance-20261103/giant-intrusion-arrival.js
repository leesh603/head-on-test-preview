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

// Dedicated post-maneuver air texture; solo/co-op entry points preserved.
import {drawImmelmannPassive} from './pilot-passive-art.js';
const clamp=n=>Math.max(0,Math.min(1,n));
const visible=p=>p?.pilot==='immelmann'&&p.hp>0&&p.status!=='downed'&&p.state==='playing';
// Read the existing, per-pilot flight samples. Never invent a circular path.
export function drawImmelmannWake(c,p,tex){
 if(!visible(p)||!p.immelmannTurn||!(p.skillTime>0))return;
 const turn=p.immelmannTurn;if(![p.x,p.y,p.a,turn.elapsed].every(Number.isFinite))return;
 const points=(p.pilotIdentity?.feedback?.ghosts||[]).filter(g=>
  g.pilot==='immelmann'&&g.life>0&&g.maxLife>0&&g.maxLife-g.life<=.40&&
  g.maxLife-g.life<=turn.elapsed+.025&&[g.x,g.y,g.a].every(Number.isFinite)).slice(-4);
 const path=[...points,{x:p.x,y:p.y,a:p.a,life:.42,maxLife:.42}];
 let traced=false;
 for(let i=0;i<path.length-1;i++){
  const from=path[i],to=path[i+1],travel=Math.hypot(to.x-from.x,to.y-from.y);
  if(travel<1||travel>85)continue;
  const age=Math.max(0,from.maxLife-from.life);
  const fade=clamp(from.life/from.maxLife)*clamp(turn.elapsed/.10)*clamp((.96-turn.elapsed)/.14);
  for(const side of [-1,1]){
   const x0=from.x-Math.sin(from.a)*side*24,y0=from.y+Math.cos(from.a)*side*24;
   const x1=to.x-Math.sin(to.a)*side*24,y1=to.y+Math.cos(to.a)*side*24;
   const length=Math.hypot(x1-x0,y1-y0);if(length<2||length>110)continue;
   // Subdivide the measured wingtip path with heading tangents. This follows
   // the flown reversal instead of joining sparse samples into sharp elbows.
   const tangent=Math.min(travel,length)*.36;
   const point=t=>{const u=1-t;return {
    x:u*u*u*x0+3*u*u*t*(x0+Math.cos(from.a)*tangent)+3*u*t*t*(x1-Math.cos(to.a)*tangent)+t*t*t*x1,
    y:u*u*u*y0+3*u*u*t*(y0+Math.sin(from.a)*tangent)+3*u*t*t*(y1-Math.sin(to.a)*tangent)+t*t*t*y1
   }};
   for(let j=0;j<3;j++){
    const a=point(j/3),b=point((j+1)/3),span=Math.hypot(b.x-a.x,b.y-a.y);
    if(span<.5)continue;
    traced=true;
    const x=(a.x+b.x)/2-p.x,y=(a.y+b.y)/2-p.y,heading=Math.atan2(b.y-a.y,b.x-a.x);
    // Two painted layers: a narrow fresh core, then a softer expanding wake.
    tex(c,'vaporTrail',x,y,span+12,20+age*20,heading,.88*fade,'#e0e1d5');
    if(j===1){
     tex(c,'windStreak',x,y,span+16,13+age*8,heading,.66*fade,'#e0e1d5');
     tex(c,'mist',x,y,span+21,17+age*28,heading,.30*fade,'#bfc5bc');
    }
   }
  }
 }
 // Condensation gathers briefly at the loaded wingtips, then clears before
 // counterfire. No continuous halo, synthetic flight path or new bitmap.
 const load=Math.sin(clamp(turn.elapsed/.66)*Math.PI),ca=Math.cos(p.a),sa=Math.sin(p.a);
 if(traced&&load>0)for(const side of [-1,1])tex(c,'mist',-sa*side*24-ca*4,ca*side*24-sa*4,28+load*22,16+load*10,p.a,.52*load,'#e0e1d5');
}
export function drawImmelmannEnergy(c,p,tex,front=false){
 if(!front)drawImmelmannPassive(c,p);
 if(!front||!visible(p)||!p.immelmannTurn?.fired||!(p.muzzleFlash>0)||p.reloadTime>0)return;
 const age=Math.max(0,.12-p.muzzleFlash),flash=clamp(1-age/.065),smoke=clamp(1-age/.12);
 // The counter salvo is emitted at x=24 by rebalance103; preserve that origin.
 if(flash>0)tex(c,'muzzle',29,0,31,12,0,.95*flash,'#ebd5a9');
 tex(c,'gunSmoke',27-age*70,0,24+age*115,10+age*48,0,.46*smoke,'#bfc5bc');
 for(let i=0;i<2;i++)tex(c,'bulletBrass',15-age*50-i*4,9+age*75+i*4,5.5,2.5,.6+age*11+i,.8*smoke,'#c69a61');
}

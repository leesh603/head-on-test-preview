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
 for(let i=0;i<path.length-1;i++){
  const from=path[i],to=path[i+1],travel=Math.hypot(to.x-from.x,to.y-from.y);
  if(travel<1||travel>85)continue;
  const fade=clamp(from.life/from.maxLife)*clamp(turn.elapsed/.12)*clamp((.96-turn.elapsed)/.14);
  for(const side of [-1,1]){
   const x0=from.x-Math.sin(from.a)*side*24,y0=from.y+Math.cos(from.a)*side*24;
   const x1=to.x-Math.sin(to.a)*side*24,y1=to.y+Math.cos(to.a)*side*24;
   const length=Math.hypot(x1-x0,y1-y0);if(length<2||length>110)continue;
   tex(c,'vaporTrail',(x0+x1)/2-p.x,(y0+y1)/2-p.y,length+9,11,Math.atan2(y1-y0,x1-x0),.82*fade,'#e0e1d5');
  }
 }
}
export function drawImmelmannEnergy(c,p,tex,front=false){
 if(!front)drawImmelmannPassive(c,p);
 if(!front||!visible(p)||!p.immelmannTurn?.fired||!(p.muzzleFlash>0)||p.reloadTime>0)return;
 const fade=clamp(p.muzzleFlash/.09),age=Math.max(0,.12-p.muzzleFlash);
 tex(c,'muzzle',29,0,27,10,0,.95*fade,'#ebd5a9');
 tex(c,'gunSmoke',19-age*55,0,29+age*60,13,0,.38*fade,'#bfc5bc');
 for(let i=0;i<2;i++)tex(c,'bulletBrass',15-age*50-i*4,9+age*75+i*4,5.5,2.5,.6+age*11+i,.8*fade,'#c69a61');
}

import {roleReady,roleDraw} from './fx-role3.js?v=340';
const clamp=n=>Math.max(0,Math.min(1,n));
// Rendering only: weather movement, exposure and collision remain in the engine.
export function drawGust3(c,g,x,y,time=0){
 const key=g.wreck?'wreckGust':'gustFront';if(!roleReady(key))return false;
 const duration=g.maxLife||6,age=Math.max(0,duration-g.life),fade=clamp(Math.min(age/.65,g.life/.9))*.66;
 const direction=(g.vx||g.vy)?Math.atan2(g.vy||0,g.vx||0):(g.a||0);
 const d=g.radius*(2.05+Math.min(1,age/duration)*.3);
 roleDraw(c,key,x,y,d,d,direction,fade);
 for(let i=0;i<2;i++){const offset=(i?1:-1)*g.radius*.35,travel=Math.sin(time*1.8+i*2)*g.radius*.2;
  roleDraw(c,'windStreak',x+Math.cos(direction)*travel-Math.sin(direction)*offset,y+Math.sin(direction)*travel+Math.cos(direction)*offset,g.radius*1.55,g.radius*.42,direction,fade*.42);
 }
 return true;
}
export function drawGasVeil3(c,z,x,y,time=0,boundary=true){
 if(!roleReady('gasCloud0'))return false;
 const duration=z.maxLife||14,q=clamp(1-z.life/duration),frame=Math.min(3,Math.floor(q*4));
 const fade=Math.min(1,(1-q)*3.5),diameter=z.r*(1.65+q*.4),turn=(z.seed||0)*.08+time*.025;
 roleDraw(c,'gasCloud'+frame,x,y,diameter,diameter,turn,.78*fade);
 roleDraw(c,'gasCloud'+Math.min(3,frame+1),x+Math.cos(turn+2)*z.r*.28,y+Math.sin(turn+2)*z.r*.22,diameter*.8,diameter*.68,-turn,.48*fade);
 if(boundary){c.save();c.globalAlpha*=fade*.55;c.strokeStyle='#a2a36c';c.lineWidth=1.2;c.setLineDash([5,9]);c.beginPath();c.arc(x,y,z.r,0,Math.PI*2);c.stroke();c.restore();}
 return true;
}

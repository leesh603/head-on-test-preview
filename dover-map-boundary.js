import {doverFlightBounds,doverPatrolChart,doverCliffRoute} from './dover-patrol-chart.js?v=dover3';
const inDover=g=>(g.worldRegion?.()??g.region)===17;
export function steerDoverBoundary(game,p,dt,speed,input){
 if(!inDover(game))return;
 const b=doverFlightBounds(game);game.doverBounds=b;
 // Uncommanded flight follows the chalk coast north. Explicit steering, aim,
 // evasions and scripted skills keep their own heading.
 if(input&&!Number.isFinite(input.angle)&&!input.steer&&!input.moveX&&!input.moveY&&!(p.evadeTime>0)&&!(p.chargeTime>0)&&!p.aceRetreat129){
  const route=doverCliffRoute(doverPatrolChart(game),p.y,330,Math.max(300,speed*2.4));
  if(p.y>b.top+480){const delta=Math.atan2(Math.sin(Math.atan2(route.y-p.y,route.x-p.x)-p.a),Math.cos(Math.atan2(route.y-p.y,route.x-p.x)-p.a)),rate=Math.min(p.turn||1.2,1.2);p.a+=Math.max(-rate*dt,Math.min(rate*dt,delta));}
 }
 const buffer=Math.max(360,Math.min(800,speed*2.1));
 let nx=0,ny=0;
 if(p.x<b.left+buffer)nx=(b.left+buffer-p.x)/buffer;
 if(p.x>b.right-buffer)nx=-(p.x-b.right+buffer)/buffer;
 if(p.y<b.top+buffer)ny=(b.top+buffer-p.y)/buffer;
 if(p.y>b.bottom-buffer)ny=-(p.y-b.bottom+buffer)/buffer;
 if(!nx&&!ny)return;
 const inward=Math.atan2(ny,nx),delta=Math.atan2(Math.sin(inward-p.a),Math.cos(inward-p.a));
 // Keep normal flight through the roomy interior; turn only toward an approaching edge.
 if(Math.cos(p.a)*nx+Math.sin(p.a)*ny>=.35*Math.hypot(nx,ny))return;
 const rate=Math.max(.8,Math.min(2.1,speed/220))*Math.min(1,Math.hypot(nx,ny)*1.5);
 p.a+=Math.max(-rate*dt,Math.min(rate*dt,delta));
}
export function containDoverPlayer(game,p){
 if(!inDover(game))return;const b=doverFlightBounds(game);
 p.x=Math.max(b.left,Math.min(b.right,p.x));p.y=Math.max(b.top,Math.min(b.bottom,p.y));
}

import {doverFlightBounds} from './dover-patrol-chart.js?v=dover3';
const inDover=g=>(g.worldRegion?.()??g.region)===17;
export function steerDoverBoundary(game,p,dt,speed){
 if(!inDover(game))return;
 const b=doverFlightBounds(game);game.doverBounds=b;
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

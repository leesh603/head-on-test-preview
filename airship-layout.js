// Registered to the existing 640 x 213 horizontal airship art, in logical units.
export const AIRSHIP_SIZE=Object.freeze({width:390,height:130});
export const L70_ENGINES=Object.freeze([
 [-100,-43],[-123,29],[-8,-43],[-58,36],[80,-43],[40,36],[109,31]
]);
export const HMA_PORTS=Object.freeze([[-80,1],[-40,1],[34,1],[76,1]]);
export function airshipScale(b){return b.t?.geometryScale||b.geometryScale||1;}
export function airshipPoint(b,x,y){const a=b.hullYaw||0,c=Math.cos(a),s=Math.sin(a);return{x:b.x+x*c-y*s,y:b.y+x*s+y*c};}
export function airshipLocal(b,x,y){const a=b.hullYaw||0,c=Math.cos(a),s=Math.sin(a),dx=x-b.x,dy=y-b.y;return{x:dx*c+dy*s,y:-dx*s+dy*c};}
export function airshipSweptHit(b,shot,rx,ry){
 const a=airshipLocal(b,shot.previousX??shot.x,shot.previousY??shot.y),z=airshipLocal(b,shot.x,shot.y),r=shot.radius||0;
 rx+=r;ry+=r;const x=a.x/rx,y=a.y/ry,dx=(z.x-a.x)/rx,dy=(z.y-a.y)/ry,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,-(x*dx+y*dy)/l)):0;
 return (x+dx*t)**2+(y+dy*t)**2<=1;
}

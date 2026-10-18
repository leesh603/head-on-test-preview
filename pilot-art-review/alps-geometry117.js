export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function positive(v,name){if(!Number.isFinite(v)||v<=0)throw new Error(name+' must be positive');return v;}
export function segmentDistance(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy,t=l?clamp(((px-ax)*dx+(py-ay)*dy)/l,0,1):0;return Math.hypot(px-ax-t*dx,py-ay-t*dy);}
export function insidePolygon(x,y,points){let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;}
function segmentsCross(a,b,c,d){const cross=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);const u=cross(a,b,c),v=cross(a,b,d),w=cross(c,d,a),z=cross(c,d,b);return u*v<0&&w*z<0;}
export function sweptPolygon(a,b,r,points){if(insidePolygon(a.x,a.y,points)||insidePolygon(b.x,b.y,points))return true;for(let i=0;i<points.length;i++){const c=points[i],d=points[(i+1)%points.length];if(segmentsCross(a,b,c,d)||Math.min(segmentDistance(c.x,c.y,a.x,a.y,b.x,b.y),segmentDistance(d.x,d.y,a.x,a.y,b.x,b.y),segmentDistance(a.x,a.y,c.x,c.y,d.x,d.y),segmentDistance(b.x,b.y,c.x,c.y,d.x,d.y))<=r)return true;}return false;}
export function hash(a,b,seed=1){let x=Math.imul(a^seed,374761393)^Math.imul(b,668265263);x=Math.imul(x^(x>>>13),1274126177);return((x^(x>>>16))>>>0)/4294967296;}
export function rotated(x,y,angle){const c=Math.cos(angle),s=Math.sin(angle);return{x:x*c-y*s,y:x*s+y*c};}

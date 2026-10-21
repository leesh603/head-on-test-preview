// One measured pose for the authored harbor parts, hitboxes and attack origins.
export const HARBOR_SIZE=300;
export const HARBOR_BOOM=Object.freeze({root:[158,271],tip:[564,77],frame:[0,0,627,390],broken:[627,0,627,390],reach:180});
export const HARBOR_PARTS=Object.freeze([
 {id:'crane-pivot',x:0,y:-44,radius:18,kind:'crane-pivot',width:82,height:82,hittable:false},
 {id:'crane-arm',x:0,y:-44,radius:20,kind:'crane-arm'},
 {id:'ammo-storage',x:68,y:-32,radius:25,kind:'ammo-storage',width:85,height:62},
 {id:'seaplane-facility',x:0,y:91,radius:27,kind:'seaplane-facility',width:105,height:68},
 {id:'gun-left',x:-118,y:-47,radius:24,kind:'harbor-gun',width:76,height:76,cell:0,artAngle:-2.6},
 {id:'gun-right',x:118,y:-47,radius:24,kind:'harbor-gun',width:76,height:76,cell:1,artAngle:-.54},
 {id:'gun-front-left',x:-104,y:53,radius:24,kind:'harbor-gun',width:76,height:76,cell:2,artAngle:2.52},
 {id:'gun-front-right',x:104,y:53,radius:24,kind:'harbor-gun',width:76,height:76,cell:3,artAngle:.57}
]);
export const harborScale=b=>b.t?.geometryScale||b.geometryScale||1;
export const harborPoint=(b,x,y)=>({x:b.x+x*harborScale(b),y:b.y+y*harborScale(b)});
export function harborCranePose(b){
 const s=harborScale(b),pivot=harborPoint(b,0,-44),angle=b.craneAngle??-.55;
 const tip={x:pivot.x+Math.cos(angle)*HARBOR_BOOM.reach*s,y:pivot.y+Math.sin(angle)*HARBOR_BOOM.reach*s};
 const sway=Math.sin((b.motionTime||0)*1.7)*5*s,drop=(b.craneState==='windup'?70-32*(1-Math.max(0,Math.min(1,b.craneClock/Math.max(.01,b.craneWarn)))):38)*s;
 return{pivot,tip,load:{x:tip.x+sway,y:tip.y+drop},arm:{x:pivot.x+(tip.x-pivot.x)*.55,y:pivot.y+(tip.y-pivot.y)*.55}};
}
export const harborMuzzle=(b,p)=>({x:b.x+p.x+Math.cos(p.angle)*30*harborScale(b),y:b.y+p.y+Math.sin(p.angle)*30*harborScale(b)});
export const harborLaunchPoint=b=>harborPoint(b,0,140);
const distance=(x,y,a,z)=>{const dx=z.x-a.x,dy=z.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/Math.max(1,dx*dx+dy*dy)));return Math.hypot(x-a.x-t*dx,y-a.y-t*dy);};
export function harborSegmentHit(shot,a,z,radius){
 const old={x:shot.previousX??shot.x,y:shot.previousY??shot.y},now={x:shot.x,y:shot.y},r=radius+(shot.radius||0);
 const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
 const c1=cross(a,z,old),c2=cross(a,z,now),c3=cross(old,now,a),c4=cross(old,now,z);
 if(c1*c2<0&&c3*c4<0)return true;
 return Math.min(distance(old.x,old.y,a,z),distance(now.x,now.y,a,z),distance(a.x,a.y,old,now),distance(z.x,z.y,old,now))<=r;
}

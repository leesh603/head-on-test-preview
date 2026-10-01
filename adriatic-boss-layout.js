// One world-space layout for naval art, cut positions, muzzles and collision.
export const ZUBIAN_LAYOUT=Object.freeze({width:154,height:416,frontHeight:228,rearHeight:188,frontY:-94,rearY:114,splitGap:76});
export function navalPoint(body,x,y){const a=body.hullYaw||0,c=Math.cos(a),s=Math.sin(a);return{x:body.x+x*c-y*s,y:body.y+x*s+y*c};}
export function navalLocal(body,x,y){const a=body.hullYaw||0,c=Math.cos(a),s=Math.sin(a),dx=x-body.x,dy=y-body.y;return{x:dx*c+dy*s,y:-dx*s+dy*c};}
export function zubianSize(body){const s=body.t?.geometryScale||1;return{width:ZUBIAN_LAYOUT.width*s,height:(body.role==='front'?ZUBIAN_LAYOUT.frontHeight:body.role==='rear'?ZUBIAN_LAYOUT.rearHeight:ZUBIAN_LAYOUT.height)*s};}
export function zubianSplitPose(body,role,gap=body.splitGap||0){const s=body.t?.geometryScale||body.geometryScale||1;return navalPoint(body,0,(role==='front'?ZUBIAN_LAYOUT.frontY-gap/2:ZUBIAN_LAYOUT.rearY+gap/2)*s);}
export function navalSweptEllipse(body,shot,rx,ry){
 const a=navalLocal(body,shot.previousX??shot.x,shot.previousY??shot.y),b=navalLocal(body,shot.x,shot.y),pad=shot.radius||0;
 rx+=pad;ry+=pad;const dx=(b.x-a.x)/rx,dy=(b.y-a.y)/ry,x=a.x/rx,y=a.y/ry,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,-(x*dx+y*dy)/l)):0;
 return (x+dx*t)**2+(y+dy*t)**2<=1;
}
// Separating-axis clearance includes the full painted rectangles, not just
// small core circles. Run once after BOTH halves have moved in the same step.
export function navalOverlap(a,b,padding=12){
 const as=zubianSize(a),bs=zubianSize(b),aa=a.hullYaw||0,ba=b.hullYaw||0;
 const axes=[[Math.cos(aa),Math.sin(aa)],[-Math.sin(aa),Math.cos(aa)],[Math.cos(ba),Math.sin(ba)],[-Math.sin(ba),Math.cos(ba)]];
 const project=(s,angle,x,y)=>Math.abs(x*Math.cos(angle)+y*Math.sin(angle))*s.width/2+Math.abs(-x*Math.sin(angle)+y*Math.cos(angle))*s.height/2;
 let best=null;for(const [x,y] of axes){const d=(b.x-a.x)*x+(b.y-a.y)*y,depth=project(as,aa,x,y)+project(bs,ba,x,y)+padding-Math.abs(d);if(depth<=0)return null;if(!best||depth<best.depth)best={x:x*(d<0?-1:1),y:y*(d<0?-1:1),depth};}return best;
}
export function separateZubianHalves(encounter){
 const halves=[...encounter.bodies.values()].filter(b=>b.role==='front'||b.role==='rear');if(halves.length!==2||halves.some(b=>b.dead))return;
 const [a,b]=halves,overlap=navalOverlap(a,b);if(!overlap)return;
 // Preserve the bow's locked launch course while it winds up or charges.
 // The stern yields the full clearance so the warning and torpedo muzzle agree.
 const locked=body=>body.role==='front'&&(body.phase==='windup'||body.phase==='charging');
 const shift=overlap.depth+.02,shareA=locked(a)?0:locked(b)?1:.5,shareB=1-shareA;
 a.x-=overlap.x*shift*shareA;a.y-=overlap.y*shift*shareA;b.x+=overlap.x*shift*shareB;b.y+=overlap.y*shift*shareB;
}

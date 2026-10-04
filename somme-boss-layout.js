// One geometry definition for drawing, swept hits, movement bounds and muzzles.
export const SCHWABEN_PARTS=Object.freeze([
 {id:'gun-left',x:-249,y:13,w:151,h:157,rx:53,ry:48,art:'casemate',fraction:.12,muzzle:83},
 {id:'gun-right',x:249,y:13,w:151,h:157,rx:53,ry:48,art:'casemate',fraction:.12,muzzle:83},
 {id:'twin-aa',x:0,y:-8,w:164,h:170,rx:66,ry:58,art:'twin-aa',fraction:.18,muzzle:100},
 {id:'mg-left',x:-193,y:110,w:81,h:89,rx:29,ry:25,art:'mg',fraction:.055,muzzle:48},
 {id:'mg-right',x:193,y:110,w:81,h:89,rx:29,ry:25,art:'mg',fraction:.055,muzzle:48},
 {id:'observer',x:0,y:-121,w:100,h:91,rx:39,ry:29,art:'observer',fraction:.075,muzzle:0},
 {id:'ammo',x:0,y:122,w:118,h:77,rx:49,ry:28,art:'ammo',fraction:.09,muzzle:0}
]);
export const MARK1_PARTS=Object.freeze([
 {id:'track-left',x:-40,y:-20,w:34,h:184,rx:11,ry:84,hitX:-49,art:'track-left',fraction:.12,muzzle:0},
 {id:'track-right',x:40,y:-20,w:34,h:184,rx:11,ry:84,hitX:49,art:'track-right',fraction:.12,muzzle:0},
 {id:'sponson-left',x:-54,y:-22,w:44,h:51,rx:18,ry:17,art:'sponson',fraction:.18,muzzle:29},
 {id:'sponson-right',x:54,y:-22,w:44,h:51,rx:18,ry:17,art:'sponson',fraction:.18,muzzle:29}
]);
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export const turn=(a,b,step)=>a+clamp(angleDelta(b,a),-step,step);
// Mark I side sponsons have a traverse stop; the armored housing never turns.
export function sponsonAim(b,p,x,y){
 const aim=Math.atan2(y-b.y-p.y,x-b.x-p.x),center=b.hullYaw+(p.id==='sponson-left'?Math.PI:0),arc=1.45;
 return {angle:center+clamp(angleDelta(aim,center),-arc,arc),reachable:Math.abs(angleDelta(aim,center))<=arc};
}
export function sommeScale(t,tank=false){return Math.min(1,Math.max(.3,((t.regionalViewWidth||960)-56)/(tank?500:680)),Math.max(.3,((t.regionalViewHeight||700)-170)/(tank?450:340)));}
export function sommePoint(b,x,y){const s=b.sommeScale||b.regionalScale||1,a=b.hullYaw||0;return{x:b.x+(x*Math.cos(a)-y*Math.sin(a))*s,y:b.y+(x*Math.sin(a)+y*Math.cos(a))*s};}
export function syncSommeParts(b){for(const p of b.parts.values()){const q=sommePoint(b,p.localX,p.localY);p.x=q.x-b.x;p.y=q.y-b.y;p.hitAngle=b.hullYaw||0;}}
export function sommeMuzzle(b,p){const n=p.muzzleLength||0;return{x:b.x+p.x+Math.cos(p.angle)*n,y:b.y+p.y+Math.sin(p.angle)*n};}
export function sommeExtents(b){const s=b.sommeScale||1;if(b.kind==='morser-battery')return{halfWidth:345*s,halfHeight:174*s};const a=b.hullYaw||0;return{halfWidth:(Math.abs(Math.cos(a))*80+Math.abs(Math.sin(a))*119)*s,halfHeight:(Math.abs(Math.sin(a))*80+Math.abs(Math.cos(a))*119)*s};}
export function landshipClearance(a,b){const angle=Math.atan2(b.y-a.y,b.x-a.x),support=q=>Math.hypot(78*Math.cos(angle-q.hullYaw),112*Math.sin(angle-q.hullYaw))*q.sommeScale;return Math.hypot(a.x-b.x,a.y-b.y)-support(a)-support(b)-10*Math.min(a.sommeScale,b.sommeScale);}
export function separateLandships(bodies,bounds){
 // Fixed tracks and wrecks retain their actual world pose. Moving partners
 // yield to them. Solve after the last live tank's movement, then sync mounts.
 const mobile=b=>!b.dead&&b.tracks()>0;
 for(let pass=0;pass<5;pass++)for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){
  const a=bodies[i],b=bodies[j],gap=landshipClearance(a,b);if(gap>=0||!mobile(a)&&!mobile(b))continue;
  const angle=Math.atan2(b.y-a.y,b.x-a.x),push=-gap+.1,share=mobile(a)&&mobile(b)?.5:1;
  for(const [q,sign]of [[a,-1],[b,1]])if(mobile(q)){const ex=sommeExtents(q);q.x=clamp(q.x+Math.cos(angle)*push*share*sign,bounds.left+ex.halfWidth+8,bounds.right-ex.halfWidth-8);q.y=clamp(q.y+Math.sin(angle)*push*share*sign,bounds.top+ex.halfHeight+8,bounds.bottom-ex.halfHeight-8);syncSommeParts(q);}
 }
}

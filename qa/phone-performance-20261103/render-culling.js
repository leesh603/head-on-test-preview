// Rendering-only, conservative bounds. Missing/unknown geometry always draws.
export function canvasCullView(context){
 const width=context.canvas?.width,height=context.canvas?.height;if(!(width>0&&height>0))return null;
 const m=context.getTransform?.()||{a:1,b:0,c:0,d:1,e:0,f:0};
 if(![m.a,m.b,m.c,m.d,m.e,m.f].every(Number.isFinite))return null;
 return {width,height,a:m.a,b:m.b,c:m.c,d:m.d,e:m.e,f:m.f,scale:Math.hypot(m.a,m.b)+Math.hypot(m.c,m.d)};
}
export function outsideCanvas(view,x,y,radius){
 if(!view||![x,y,radius].every(Number.isFinite))return false;
 const sx=view.a*x+view.c*y+view.e,sy=view.b*x+view.d*y+view.f,r=Math.max(0,radius)*view.scale;
 return sx+r<0||sx-r>view.width||sy+r<0||sy-r>view.height;
}
const CULLABLE_AIR_BODIES=new Set(['gotha-raider','o400-raider','gik','ca4','zeppelin-l70','hma23','staaken-rvi']);
export function outsideBossView(body,view,bounds,{destroying=false}={}){
 // Train/ship trails, cranes, searchlights, ropes, entry reveals and destruction
 // may reach beyond the hull. Do not cull these unknown or transitional cases.
 if(!view||destroying||body.arrivalPending||!CULLABLE_AIR_BODIES.has(body.kind)||!bounds)return false;
 const {halfWidth,halfHeight}=bounds;if(![body.x,body.y,halfWidth,halfHeight,view.x,view.y,view.width,view.height].every(Number.isFinite))return false;
 let r=Math.hypot(halfWidth,halfHeight)+600; // all hull rotations, shadows, smoke and muzzle flashes
 for(const p of body.parts?.values?.()||[]){const extent=Math.max(p.drawWidth||0,p.drawHeight||0,p.radius||0,p.hitRadiusX||0,p.hitRadiusY||0);r=Math.max(r,Math.hypot(p.x||0,p.y||0)+extent+600);}
 return body.x+r<view.x-view.width/2||body.x-r>view.x+view.width/2||body.y+r<view.y-view.height/2||body.y-r>view.y+view.height/2;
}

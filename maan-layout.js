// Coordinates are shared by sprite composition, swept hits and gun muzzles.
export const MAAN_ENTRY=Object.freeze({duration:9,ignition:1.6,breakAt:2.8,reveal:4.8});
export const MAAN_LAYOUT=Object.freeze({
 'wustenpanzer':{width:248,height:520,parts:[
  ['track-left',-99,0,25,242,'track'],['track-right',99,0,25,242,'track'],
  ['heavy-gun',0,-189,23,62,'gun'],['sponson-left',-77,-1,32,42,'gun'],['sponson-right',77,-1,32,42,'gun'],
  ['aa-left',-68,-174,20,24,'mg'],['aa-right',68,-174,20,24,'mg'],
  ['radiator',0,33,48,55,'cooling'],['engine',0,154,37,62,'engine']
 ]},
 'sinai-landship':{width:284,height:540,parts:[
  ['track-front-left',-92,-191,24,68,'track'],['track-front-right',92,-191,24,68,'track'],
  ['track-rear-left',-92,194,24,68,'track'],['track-rear-right',92,194,24,68,'track'],
  ['sponson-left-front',-112,-100,28,33,'gun'],['sponson-right-front',112,-100,28,33,'gun'],
  ['sponson-left-rear',-112,92,28,33,'gun'],['sponson-right-rear',112,92,28,33,'gun'],
  ['lewis',0,-145,35,32,'mg'],['tank',0,0,37,66,'fuel'],['command',0,171,48,45,'command'],['support',0,98,46,31,'support']
 ]}
});
export const rotateMaan=(x,y,a)=>({x:x*Math.cos(a)-y*Math.sin(a),y:x*Math.sin(a)+y*Math.cos(a)});
export const MAAN_ESCORT_RADIUS=Math.hypot(20,35);
export function maanLocal(body,x,y){return rotateMaan(x-body.x,y-body.y,-(body.hullYaw||0));}
export function maanWorld(body,x,y){const p=rotateMaan(x,y,body.hullYaw||0);return{x:body.x+p.x,y:body.y+p.y};}
// Include the gun barrels and a car's full rotating silhouette, not its bullet
// hit radius. Destroying tracks does not remove the physical ground footprint.
export function maanClearance(body,radius=MAAN_ESCORT_RADIUS){return{x:body.layout.width/2+radius+12,y:body.layout.height/2+radius+12};}
export function maanGroundBlocked(body,x0,y0,x1=x0,y1=y0){
 const a=maanLocal(body,x0,y0),b=maanLocal(body,x1,y1),r=maanClearance(body);
 return segmentBox(a.x,a.y,b.x,b.y,0,0,r.x,r.y);
}
// Test the entire swept hull before committing a drive step. The clearance
// includes the car's rotating silhouette, so the hull yields instead of
// relocating a visible escort when its stern swings into the outside lane.
export function canMoveMaanHull(body,x,y,hullYaw){
 const cars=[...body.encounter?.bodies.values()||[]].filter(c=>c.leader&&!c.dead&&!c.hidden);
 if(!cars.length)return true;
 const dx=x-body.x,dy=y-body.y,turn=hullYaw-body.hullYaw;
 const reach=Math.hypot(body.layout.width,body.layout.height)/2+MAAN_ESCORT_RADIUS;
 const steps=Math.max(1,Math.ceil((Math.hypot(dx,dy)+Math.abs(turn)*reach)/2));
 for(let i=1;i<=steps;i++){
  const f=i/steps,pose={...body,x:body.x+dx*f,y:body.y+dy*f,hullYaw:body.hullYaw+turn*f};
  if(cars.some(c=>maanGroundBlocked(pose,c.x,c.y)))return false;
 }
 return true;
}
// Residual roundoff correction only. Initial/hidden placement owns staging;
// live traffic must yield before contact, never jump to a distant free slot.
export function resolveMaanGround(encounter){
 const bodies=[...encounter?.bodies.values()||[]],hulls=bodies.filter(b=>b.layout&&!b.dead),cars=bodies.filter(b=>b.leader&&!b.dead&&!b.hidden),gap=MAAN_ESCORT_RADIUS*2+16;
 const free=(car,x,y)=>hulls.every(b=>!maanGroundBlocked(b,x,y))&&cars.every(c=>c===car||Math.hypot(c.x-x,c.y-y)>=gap);
 for(const car of cars){
  if(free(car,car.x,car.y))continue;
  const candidates=[];
  for(const b of hulls){const p=maanLocal(b,car.x,car.y),r=maanClearance(b);
   for(const side of [-1,1]){candidates.push(maanWorld(b,side*(r.x+.01),p.y));candidates.push(maanWorld(b,p.x,side*(r.y+.01)));}
  }
  candidates.sort((a,z)=>Math.hypot(a.x-car.x,a.y-car.y)-Math.hypot(z.x-car.x,z.y-car.y));
  const position=candidates.find(q=>Math.hypot(q.x-car.x,q.y-car.y)<=.05&&free(car,q.x,q.y));
  if(position)Object.assign(car,position);
 }
}
export function segmentBox(x0,y0,x1,y1,cx,cy,rx,ry,r=0){
 let lo=0,hi=1;
 for(const [start,end,center,half] of [[x0,x1,cx,rx+r],[y0,y1,cy,ry+r]]){
  const d=end-start;if(Math.abs(d)<1e-8){if(Math.abs(start-center)>half)return false;continue;}
  let a=(center-half-start)/d,b=(center+half-start)/d;if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);if(lo>hi)return false;
 }return true;
}

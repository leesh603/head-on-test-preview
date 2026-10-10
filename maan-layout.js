// Combat centers follow the r3 painted tracks and surviving gun emplacements.
export const MAAN_REGION=13;
export const MAAN_ENTRY=Object.freeze({duration:9,ignition:1.6,breakAt:2.8,reveal:4.8});
export const MAAN_LAYOUT=Object.freeze({
 'wustenpanzer':{width:248,height:520,parts:[
  ['track-left',-99,0,25,242,'track'],['track-right',99,0,25,242,'track'],
  ['heavy-gun',0,-189,23,62,'gun'],['sponson-left',-77,-1,32,42,'gun'],['sponson-right',77,-1,32,42,'gun'],
  ['aa-left',-68,-174,20,24,'mg'],['aa-right',68,-174,20,24,'mg'],
  ['radiator',0,33,48,55,'cooling'],['engine',0,154,37,62,'engine']
 ]},
 'sinai-landship':{width:284,height:540,parts:[
  ['track-front-left',-78,-231,24,30,'track'],['track-front-right',78,-231,24,30,'track'],
  ['track-rear-left',-80,202,24,48,'track'],['track-rear-right',80,202,24,48,'track'],
  ['sponson-left-front',-112,-124,28,33,'gun'],['sponson-right-front',112,-124,28,33,'gun'],
  ['sponson-left-rear',-112,72,28,33,'gun'],['sponson-right-rear',112,72,28,33,'gun'],
  ['lewis',0,-197,28,30,'mg'],['tank',0,0,37,66,'fuel'],['command',0,171,48,45,'command'],['support',0,98,46,31,'support']
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
// Resolve the complete convoy together: moving/turning the hull can push one
// escort into another, even when each car's own path is clear.
export function resolveMaanGround(encounter){
 const bodies=[...encounter?.bodies.values()||[]],hulls=bodies.filter(b=>b.layout&&!b.dead),cars=bodies.filter(b=>b.leader&&!b.dead&&!b.hidden),gap=MAAN_ESCORT_RADIUS*2+16;
 const free=(car,x,y)=>hulls.every(b=>!maanGroundBlocked(b,x,y))&&cars.every(c=>c===car||Math.hypot(c.x-x,c.y-y)>=gap);
 for(const car of cars){
  if(free(car,car.x,car.y))continue;
  const b=car.leader,p=maanLocal(b,car.x,car.y),r=maanClearance(b),candidates=[];
  for(let rank=0;rank<cars.length+3;rank++)for(const side of [-1,1]){
   candidates.push(maanWorld(b,side*(r.x+2+rank*gap),p.y));
   candidates.push(maanWorld(b,p.x,side*(r.y+2+rank*gap)));
   for(const edge of [-1,1])candidates.push(maanWorld(b,side*(r.x+2),edge*(r.y+2+rank*gap)));
  }
  candidates.sort((a,z)=>Math.hypot(a.x-car.x,a.y-car.y)-Math.hypot(z.x-car.x,z.y-car.y));
  const position=candidates.find(q=>free(car,q.x,q.y));if(position)Object.assign(car,position);
 }
}
export function segmentBox(x0,y0,x1,y1,cx,cy,rx,ry,r=0){
 let lo=0,hi=1;
 for(const [start,end,center,half] of [[x0,x1,cx,rx+r],[y0,y1,cy,ry+r]]){
  const d=end-start;if(Math.abs(d)<1e-8){if(Math.abs(start-center)>half)return false;continue;}
  let a=(center-half-start)/d,b=(center+half-start)/d;if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);if(lo>hi)return false;
 }return true;
}

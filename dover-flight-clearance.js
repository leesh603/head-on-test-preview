import {hullOverlap} from './adriatic-boss-layout.js?v=tame3';

const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const normalize=a=>Math.atan2(Math.sin(a),Math.cos(a));

export function doverAircraftHull(body,x=body.x,y=body.y,a=body.a){
 return {x,y,w:body.layout.width*body.geometryScale,h:body.layout.height*body.geometryScale,yaw:a+Math.PI/2};
}

export function doverDuel(bodies){
 const bomber=bodies.find(body=>body.kind==='siemens-schuckert-r-viii');
 const interceptor=bodies.find(body=>body.kind==='supermarine-nighthawk');
 return interceptor&&Number.isFinite(bomber?.doverTransit)?{bomber,interceptor}:null;
}

// Approach the northbound bomber from ahead, bank clear of its wing, and
// turn onto its tail. The stern position includes the actual painted hulls.
export function doverInterceptCourse(body,target){
 const wingspan=(body.layout.width*body.geometryScale+target.w)/2;
 const tailGap=(body.layout.height*body.geometryScale+target.h)/2+34;
 const ahead=target.y-body.y,side=body.doverInterceptSide??(body.x<target.x?-1:1);
 const lane=target.x+side*(wingspan+55);
 if(!body.doverInterceptLeg)body.doverInterceptLeg='head-on';
 if(body.doverInterceptLeg==='head-on'&&ahead<tailGap+315)body.doverInterceptLeg='pass';
 if(body.doverInterceptLeg==='head-on'){
  return {angle:Math.atan2(Math.max(260,ahead),clamp(lane-body.x,-105,105)),speed:190*body.speedRatio()};
 }
 if(body.doverInterceptLeg==='pass'){
  if(ahead>-tailGap-80){
   return {angle:Math.atan2(245,clamp(lane-body.x,-125,125)),speed:205*body.speedRatio()};
  }
  body.doverInterceptLeg='bank';
 }
 if(body.doverInterceptLeg==='bank'){
  const angle=-Math.PI*.5-side*Math.PI*.11;
  if(Math.abs(normalize(angle-body.a))>.55)return {angle,speed:166*body.speedRatio()};
  body.doverInterceptLeg='trail';
 }
 const x=target.x+side*48,y=target.y+tailGap;
 const vx=(target.vx||0)+clamp((x-body.x)*.72,-125,125);
 const vy=(target.vy||0)+clamp((y-body.y)*.88,-155,110);
 return {angle:Math.atan2(Math.min(-35,vy),vx),speed:clamp(Math.hypot(vx,vy),48,238)*body.speedRatio()};
}

// Sight the near end of a giant airframe rather than aiming every mount
// at its distant center. Swept hits still resolve against the real polygons.
export function doverBomberAim(body,target){
 const cos=Math.cos(target.a),sin=Math.sin(target.a);
 const along=(body.x-target.x)*cos+(body.y-target.y)*sin;
 const reach=clamp(along,-target.h*.29,target.h*.34);
 return {...target,x:target.x+cos*reach,y:target.y+sin*reach};
}

// Select a nearby bearing before painted silhouettes meet. The ordinary
// speed and turn-rate limits still execute the maneuver.
export function doverShipAvoidance(body,ships,angle,speed){
 if(!ships?.length||!(speed>0))return angle;
 const horizon=2.2,nearby=ships.filter(ship=>Math.hypot(ship.x-body.x,ship.y-body.y)<speed*horizon+body.layout.width*body.geometryScale*.63+ship.h/2+30);
 const blocked=a=>{
  const x=Math.cos(a)*speed,y=Math.sin(a)*speed;
  return nearby.some(ship=>[.75,1.45,horizon].some(t=>hullOverlap(doverAircraftHull(body,body.x+x*t,body.y+y*t,a),ship,24)));
 };
 if(!blocked(angle))return angle;
 const side=body.doverShipSide||(Math.sin(angle)<0?-1:1);
 for(const offset of [.32,.60,.94,1.25])for(const sign of [side,-side]){
  const choice=angle+offset*sign;
  if(!blocked(choice)){body.doverShipSide=sign;return choice;}
 }
 return angle;
}

// A last, sub-frame clearance for late traffic entering a flight path. The
// bomber keeps its route priority, while the interceptor yields to its hull.
export function clearDoverFlightOverlap(duel,ships=[]){
 if(!duel?.bomber.doverOpposedEntry)return;
 const {bomber,interceptor}=duel;
 for(const body of [bomber,interceptor]){
  if(body.dead||body.hidden)continue;
  const blockers=body===interceptor&&!bomber.dead&&!bomber.hidden?[...ships,doverAircraftHull(bomber)]:ships;
  for(let pass=0;pass<4;pass++){
   let moved=false;
   for(const blocker of blockers){
    const hull=doverAircraftHull(body);
    if(Math.hypot(hull.x-blocker.x,hull.y-blocker.y)>Math.hypot(hull.w,hull.h)/2+Math.hypot(blocker.w,blocker.h)/2+12)continue;
    const overlap=hullOverlap(blocker,hull,8);
    if(!overlap)continue;
    body.x+=overlap.x*(overlap.depth+.05);
    body.y+=overlap.y*(overlap.depth+.05);
    moved=true;
   }
   if(!moved)break;
  }
 }
}

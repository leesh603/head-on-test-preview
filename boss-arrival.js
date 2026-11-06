import {attachBossEntry,bossEntryFamily} from './boss-entry-presentation.js';
import {CAPITAL_BOSS_ART} from './capital-boss-art.js';
import {ALPS_BOMBER_LAYOUT,alpsHullExtents} from './alps-bomber-layout.js?v=gal1';
import {verdunFortExtents} from './verdun-fortresses.js?v=gal1&rail=42&ai=1018&sig=1019&boss=20261020b&phase=1021';
import {sommeExtents} from './somme-boss-layout.js?v=tame3&somme=20261021';
// Preserve authored railway, buried-weapon and formation approaches.
const authored=new Set(['paris-gun','lincomparable','livens-flame-projector','minenwerfer-battery','mark4-wedge','treffas-wagen','fliegerzug','jasta11-circus','naval10-black-flight','london-apron-raid','sinai-landship','wustenpanzer']);
const installed=new Set(['armored-harbor-fortress','gallipoli-fortress']);
const fixed=id=>['artillery','net','fortress'].includes(bossEntryFamily(id));
const clamp=q=>Math.max(0,Math.min(1,q));
export function bossArrivalBounds(b){
 let rx=Math.max(100,b.coreRadius||0),ry=130;
 const size=(w,h,a=0)=>{if(!(w>0&&h>0))return;const c=Math.abs(Math.cos(a)),s=Math.abs(Math.sin(a));rx=Math.max(rx,(w*c+h*s)/2);ry=Math.max(ry,(h*c+w*s)/2);};
 const capital=CAPITAL_BOSS_ART[b.kind];
 if(capital)size(capital.width*(b.capitalScale||.6),capital.height*(b.capitalScale||.6),b.hullYaw||0);
 if(ALPS_BOMBER_LAYOUT[b.kind]){const r=alpsHullExtents(b);rx=Math.max(rx,r.halfWidth);ry=Math.max(ry,r.halfHeight);}
 if(b.layout)size(b.layout.width*(b.geometryScale||1),b.layout.height*(b.geometryScale||1),b.a!=null?b.a+Math.PI/2:b.hullYaw||0);
 if(b.layout?.trackX!=null)size(256*(b.t?.geometryScale||1),256*(b.t?.geometryScale||1),b.hullYaw||0);
 if(b.support129)size(b.support129.width,b.support129.height,b.support129.angle||0);
 if(b.jutlandBoss)size(b.width,b.height,b.hullYaw||0);
 if(b.kind.startsWith('hms-zubian'))size(154*(b.t?.geometryScale||1),416*(b.t?.geometryScale||1),b.hullYaw||0);
 if(['zeppelin-l70','hma23'].includes(b.kind))size(390*(b.t?.geometryScale||2.025),130*(b.t?.geometryScale||2.025));
 if(b.fortressBoss){const r=verdunFortExtents(b);rx=Math.max(rx,r.halfWidth);ry=Math.max(ry,r.halfHeight);}
 if(b.sommeBoss){const r=sommeExtents(b);rx=Math.max(rx,r.halfWidth);ry=Math.max(ry,r.halfHeight);}
 if(b.kind==='drachen-net')size(800*(b.cityArtScale||1),720*(b.cityArtScale||1));
 if(b.kind==='flak-tower'){
  // Include the four children deployed on the next native update.
  const w=b.t.regionalViewWidth||960,h=b.t.regionalViewHeight||700,s=Math.max(.32,Math.min(1,(w-48)/840,(h-100)/820));
  rx=Math.max(rx,Math.max(280*s,w*.56)+220*s);ry=Math.max(ry,Math.max(280*s,h*.52)+220*s);
 }
 for(const p of b.parts.values()){rx=Math.max(rx,Math.abs(p.x)+(p.drawWidth||p.hitRadiusX*2||p.radius*2||50)/2);ry=Math.max(ry,Math.abs(p.y)+(p.drawHeight||p.hitRadiusY*2||p.radius*2||50)/2);}
 return {halfWidth:rx+70,halfHeight:ry+90};
}
function outsideOffset(bodies,bounds,direction=null){
 let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
 for(const b of bodies){const r=bossArrivalBounds(b);left=Math.min(left,b.x-r.halfWidth);right=Math.max(right,b.x+r.halfWidth);top=Math.min(top,b.y-r.halfHeight);bottom=Math.max(bottom,b.y+r.halfHeight);}
 if(direction){
  const {x,y}=direction;
  const d=Math.abs(x)>Math.abs(y)?Math.max(0,(x<0?right-bounds.left+180:bounds.right-left+180)/Math.abs(x)):Math.max(0,(y<0?bottom-bounds.top+180:bounds.bottom-top+180)/Math.abs(y));
  return {x:x*d,y:y*d};
 }
 const x=(left+right-bounds.left-bounds.right)/2,y=(top+bottom-bounds.top-bounds.bottom)/2;
 if(Math.abs(x)/(bounds.right-bounds.left)>Math.abs(y)/(bounds.bottom-bounds.top))return {x:x<0?Math.min(0,bounds.left-180-right):Math.max(0,bounds.right+180-left),y:0};
 return {x:0,y:y>0?Math.max(0,bounds.bottom+180-top):Math.min(0,bounds.top-180-bottom)};
}
function placeFixed(encounter,bounds){
 const offset=outsideOffset([...encounter.bodies.values()],bounds);
 for(const b of encounter.bodies.values()){b.x+=offset.x;b.y+=offset.y;if(Number.isFinite(b.anchorX))b.anchorX+=offset.x;if(Number.isFinite(b.anchorY))b.anchorY+=offset.y;delete b.arrivalFixedPending;}
 delete encounter.arrivalFixedPending;
}
// The native first tick initializes orbit poses, not an inbound flight. Keep
// that initialization (and its clocks) but enter as a rigid, nose-first flight.
function formationArrival(encounter,bodies,frame){
 const o400=encounter.bossId==='o400-squadron',gotha=encounter.bossId==='gotha-squadron';
 if(!o400&&!gotha)return false;
 const player=frame.players?.find(p=>p.alive!==false),vx=player?.vx||0,vy=player?.vy||0;
 const heading=Math.hypot(vx,vy)>20?Math.atan2(vy,vx):Number.isFinite(player?.a)?player.a:Math.PI/2;
 const fx=Math.cos(heading),fy=Math.sin(heading),rx=fy,ry=-fx;
 // A single bounded prediction, never a camera lock or a moving arrival target.
 const cx=(player?.x||0)+vx*3.25,cy=(player?.y||0)+vy*3.25;
 const lateral=o400?108:125,trail=o400?150:240,flightGap=560;
 for(const b of bodies){
  const group=o400?0:Math.floor(b.slot/3),slot=b.slot%3;
  // Lead + two trailing wings; subsequent Gotha flights follow the same lane.
  const side=slot===0?0:slot===1?-lateral:lateral,forward=140-(slot===0?0:trail)-group*flightGap;
  b.x=cx+rx*side+fx*forward;b.y=cy+ry*side+fy*forward;
  b.a=heading;b.arrivalFlightGuard=true;b.rotateMounts?.();
 }
 return true;
}
// Set the flight's destination once, in the same moving airspace the player
// will occupy at release. Translate native anchors too; never drag the camera.
function positionAirArrival(encounter,bodies,frame){
 const ids=['siemens-schuckert-r-viii','supermarine-nighthawk','staaken-rvi','paris-staaken-rvi','gik','ca4','zeppelin-l70','hma23','final-leviathan'];
 if(!ids.includes(encounter.bossId))return;
 const p=frame.players?.find(p=>p.alive!==false);if(!p)return;
 const vx=p.vx||0,vy=p.vy||0,speed=Math.hypot(vx,vy),scale=Math.min(1,400/Math.max(1,speed));
 const ahead=['zeppelin-l70','hma23'].includes(encounter.bossId)&&speed>1?220/speed:0;
 const dx=vx*(3.25*scale+ahead),dy=vy*(3.25*scale+ahead);
 for(const b of bodies){
  b.x+=dx;b.y+=dy;
  for(const [key,delta]of [['anchorX',dx],['anchorY',dy],['patrolCenterX',dx],['patrolCenterY',dy],['fixedX',dx],['fixedY',dy]])if(Number.isFinite(b[key]))b[key]+=delta;
  if(Number.isFinite(b.patrolFlowX)){b.patrolFlowX=vx*scale;b.patrolFlowY=vy*scale;}
 }
}
export function bossArrivalProgress(body,age=body.arrivalAge){
 const q=clamp((age-body.arrivalHold)/body.arrivalDuration),m=body.arrivalPath?.endSlope||0;
 if(body.arrivalPath?.coastRamp){const ramp=body.arrivalPath.coastRamp;return q<ramp?q*q/(2*ramp*(1-ramp)):q>1-ramp?1-(1-q)**2/(2*ramp*(1-ramp)):(q-ramp/2)/(1-ramp);}
 return q*q*((3-m)+(m-2)*q);
}
export function beginBossArrival(addon,encounter,enabled=addon.presentArrivals,bounds=addon.frameContext?.bounds){
 if(!enabled)return;
 attachBossEntry(encounter);
 if(authored.has(encounter.bossId))return;
 if(fixed(encounter.bossId)){
  // Quays/fortresses retain their authored route previews and world coordinates.
  if(bounds&&!installed.has(encounter.bossId)){
   placeFixed(encounter,bounds);
  }else if(!installed.has(encounter.bossId)){
   encounter.arrivalFixedPending=true;for(const b of encounter.bodies.values())b.arrivalFixedPending=true;
  }
  return;
 }
 encounter.arrivalPending=true;encounter.arrivalInitialized=false;addon.arrivalQueue=[];
 for(const body of encounter.bodies.values()){Object.assign(body,{arrivalPending:true,arrivalAge:0,arrivalHold:.25,arrivalDuration:3});
  // Start the existing lateral cruise on its nose-first (leftward) leg.
  // This is a motion offset, not an attack/phase-clock advance.
  if(['zeppelin-l70','hma23'].includes(body.kind))body.arrivalLateralPhase=Math.PI;
 }
}
export function bossArrivalAlpha(body){return body.arrivalFixedPending||body.arrivalPending&&!body.arrivalPath?0:1;}
export function tickBossArrival(addon,encounter,dt,frame){
 if(encounter?.arrivalFixedPending)placeFixed(encounter,frame.bounds);
 if(!encounter?.arrivalPending)return false;
 if(!encounter.arrivalInitialized){
  // Settle native orbit/deployment poses before the fully painted hull enters.
  const scene=[...encounter.bodies.values()].find(b=>b.bossEntry)?.bossEntry;
  addon.preparingArrival=true;
  try{encounter.update(.000001,{...frame,canBasicFire:()=>false,isIlluminated:()=>false});}
  finally{addon.preparingArrival=false;}
  const bodies=[...encounter.bodies.values()],lead=bodies[0],family=bossEntryFamily(encounter.bossId);
  // Travel follows the painted nose/tracks instead of sliding broadside into view.
  const formation=formationArrival(encounter,bodies,frame);
  if(!formation)positionAirArrival(encounter,bodies,frame);
  const heading=formation?lead.a:family==='airship'&&!lead.isCapitalBoss?Math.PI:['naval','armour'].includes(family)||lead.isCapitalBoss?(lead.hullYaw||0)-Math.PI/2:lead.a??(lead.hullYaw||0)-Math.PI/2;
  const offset=outsideOffset(bodies,frame.bounds,{x:-Math.cos(heading),y:-Math.sin(heading)});
  for(const body of bodies){
   // One progress clock and offset preserve the complete flight's spacing.
   // Retain forward speed through handoff instead of stopping then restarting.
   const speed=formation?(encounter.bossId==='o400-squadron'?135:170):['siemens-schuckert-r-viii','supermarine-nighthawk'].includes(body.kind)?body.flightSpeed||0:body.kind==='paris-staaken-rvi'?body.currentSpeed||0:0;
   const endSlope=Math.min(1.5,speed*3/Math.max(1,Math.hypot(offset.x,offset.y))),coastRamp=['zeppelin-l70','hma23'].includes(body.kind)?.2:0;
   Object.assign(body,{arrivalPending:true,arrivalAge:0,arrivalHold:.25,arrivalDuration:3,arrivalPath:{x:body.x,y:body.y,dx:offset.x,dy:offset.y,...(endSlope?{endSlope}:{}),...(coastRamp?{coastRamp}:{})}});
   body.x+=offset.x;body.y+=offset.y;if(body.support129){body.support129.x=body.x;body.support129.y=body.y;}
  }
  if(scene){const first=bodies[0];if(first)first.bossEntry=scene;for(const body of bodies)body.entryFamily=scene.family;}
  encounter.arrivalInitialized=true;
 }
 let pending=false;
 for(const body of encounter.bodies.values()){
  body.arrivalAge+=dt;
  const q=clamp((body.arrivalAge-body.arrivalHold)/body.arrivalDuration),ease=bossArrivalProgress(body),path=body.arrivalPath;
  body.x=path.x+path.dx*(1-ease);body.y=path.y+path.dy*(1-ease);
  if(body.support129){body.support129.x=body.x;body.support129.y=body.y;}
  if(q<1-1e-8)pending=true;
 }
 if(pending)return true;
 encounter.arrivalPending=false;
 for(const body of encounter.bodies.values()){
  body.arrivalPending=false;delete body.arrivalPath;
  // The rendered fly-in has already provided the Leviathan's warning window.
  if(body.kind==='final-leviathan')body.entryLeft=Math.min(body.entryLeft,.55);
 }
 const queued=addon.arrivalQueue||[];addon.arrivalQueue=[];
 for(const [event,id,tuning] of queued)addon.accept(event,id,tuning);
 return true;
}

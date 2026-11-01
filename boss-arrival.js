import {attachBossEntry,bossEntryFamily} from './boss-entry-presentation.js';
import {CAPITAL_BOSS_ART} from './capital-boss-art.js';
import {ALPS_BOMBER_LAYOUT,alpsHullExtents} from './alps-bomber-layout.js';
import {verdunFortExtents} from './verdun-fortresses.js';
import {sommeExtents} from './somme-boss-layout.js';
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
 for(const body of encounter.bodies.values())Object.assign(body,{arrivalPending:true,arrivalAge:0,arrivalHold:.25,arrivalDuration:3});
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
  const heading=family==='airship'&&!lead.isCapitalBoss?0:['naval','armour'].includes(family)||lead.isCapitalBoss?(lead.hullYaw||0)-Math.PI/2:lead.a??(lead.hullYaw||0)-Math.PI/2;
  const offset=outsideOffset(bodies,frame.bounds,{x:-Math.cos(heading),y:-Math.sin(heading)});
  for(const body of bodies){
   Object.assign(body,{arrivalPending:true,arrivalAge:0,arrivalHold:.25,arrivalDuration:3,arrivalPath:{x:body.x,y:body.y,dx:offset.x,dy:offset.y}});
   body.x+=offset.x;body.y+=offset.y;if(body.support129){body.support129.x=body.x;body.support129.y=body.y;}
  }
  if(scene){const first=bodies[0];if(first)first.bossEntry=scene;for(const body of bodies)body.entryFamily=scene.family;}
  encounter.arrivalInitialized=true;
 }
 let pending=false;
 for(const body of encounter.bodies.values()){
  body.arrivalAge+=dt;
  const q=clamp((body.arrivalAge-body.arrivalHold)/body.arrivalDuration),ease=q*q*(3-2*q),path=body.arrivalPath;
  body.x=path.x+path.dx*(1-ease);body.y=path.y+path.dy*(1-ease);
  if(body.support129){body.support129.x=body.x;body.support129.y=body.y;}
  if(q<1-1e-8)pending=true;
 }
 if(pending)return true;
 encounter.arrivalPending=false;
 for(const body of encounter.bodies.values()){body.arrivalPending=false;delete body.arrivalPath;}
 const queued=addon.arrivalQueue||[];addon.arrivalQueue=[];
 for(const [event,id,tuning] of queued)addon.accept(event,id,tuning);
 return true;
}

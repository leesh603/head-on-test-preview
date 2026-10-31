import {attachBossEntry} from './boss-entry-presentation.js';
// Existing physical/buried entries retain their authored timing and world anchors.
const authored=new Set(['livens-flame-projector','minenwerfer-battery','mark4-wedge','treffas-wagen','fliegerzug','jasta11-circus','naval10-black-flight','london-apron-raid','sinai-landship','wustenpanzer']);
export function beginBossArrival(addon,encounter,enabled=addon.presentArrivals){
 if(!enabled)return;
 attachBossEntry(encounter);
 if(authored.has(encounter.bossId))return;
 encounter.arrivalPending=true;encounter.arrivalInitialized=false;addon.arrivalQueue=[];
 for(const body of encounter.bodies.values())Object.assign(body,{arrivalPending:true,arrivalAge:0,arrivalHold:1.4,arrivalDuration:.85});
}
export function bossArrivalAlpha(body){
 if(!body.arrivalPending)return 1;
 const q=Math.max(0,Math.min(1,((body.arrivalAge||0)-(body.arrivalHold||0))/(body.arrivalDuration||.85)));
 return q*q*(3-2*q);
}
export function tickBossArrival(addon,encounter,dt,frame){
 if(!encounter?.arrivalPending)return false;
 if(!encounter.arrivalInitialized){
  // Resolve native first-frame orbit/deployment/adapter poses while invisible.
  // Preserve any one-shot commands until their warning can actually be seen.
  const scene=[...encounter.bodies.values()].find(b=>b.bossEntry)?.bossEntry;
  addon.preparingArrival=true;
  try{encounter.update(.000001,{...frame,canBasicFire:()=>false,isIlluminated:()=>false});}
  finally{addon.preparingArrival=false;}
  for(const body of encounter.bodies.values())Object.assign(body,{arrivalPending:true,arrivalAge:0,arrivalHold:1.4,arrivalDuration:.85});
  if(scene){const first=encounter.bodies.values().next().value;if(first)first.bossEntry=scene;for(const body of encounter.bodies.values())body.entryFamily=scene.family;}
  encounter.arrivalInitialized=true;
 }
 let pending=false;
 for(const body of encounter.bodies.values()){
  body.arrivalAge+=dt;
  if(body.arrivalAge+1e-8<body.arrivalHold+body.arrivalDuration)pending=true;
 }
 if(pending)return true;
 encounter.arrivalPending=false;
 for(const body of encounter.bodies.values())body.arrivalPending=false;
 const queued=addon.arrivalQueue||[];addon.arrivalQueue=[];
 for(const [event,id,tuning] of queued)addon.accept(event,id,tuning);
 // The next simulation step owns combat; no unseen catch-up volley.
 return true;
}

import {isMaritimeIntrusion,maritimeOpacity,maritimeReveal} from './maritime-intrusion.js';
/** Guest presentation only. Never advances encounter clocks, attacks, damage or rewards. */
import {intrusionMuzzle} from './intrusion-boss-art.js';
const mixAngle=(a,b,k)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*k;
const valid=e=>e&&Number.isFinite(e.x+e.y+e.a);
export function receiveIntrusionVisual(g,previous,full=false){
 const e=g.intrusionBoss;
 if(!valid(e)){g._intrusionReplica=null;return;}
 const same=valid(previous)&&previous.encounterId===e.encounterId;
 if(full||!same||g.state!=='playing'||e.phase==='resolved'||Math.hypot(e.x-previous.x,e.y-previous.y)>200){g._intrusionReplica=null;e.visualTime=e.age||0;delete e.visualMaritimeOpacity;delete e.visualMaritimeReveal;return;}
 const from={x:previous.x,y:previous.y,a:previous.a,turrets:{...previous.turretAngles}},to={x:e.x,y:e.y,a:e.a,turrets:{...e.turretAngles}};
 if(isMaritimeIntrusion(e)){from.opacity=maritimeOpacity(previous);to.opacity=maritimeOpacity(e,false);from.reveal=maritimeReveal(previous);to.reveal=maritimeReveal(e,false);e.visualMaritimeOpacity=from.opacity;e.visualMaritimeReveal=from.reveal;}
 g._intrusionReplica={encounterId:e.encounterId,from,to,elapsed:0};
 e.x=from.x;e.y=from.y;e.a=from.a;e.turretAngles={...from.turrets};e.visualTime=previous.visualTime??e.age??0;
}
export function advanceIntrusionVisual(g,dt,hz=15){
 const e=g.intrusionBoss,r=g._intrusionReplica;if(!valid(e)||g.state!=='playing')return;
 e.visualTime=(e.visualTime??e.age??0)+dt;
 if(r&&r.encounterId===e.encounterId){
  r.elapsed+=dt;const k=Math.min(1,r.elapsed*hz);
  e.x=r.from.x+(r.to.x-r.from.x)*k;e.y=r.from.y+(r.to.y-r.from.y)*k;e.a=mixAngle(r.from.a,r.to.a,k);
  if(Number.isFinite(r.to.opacity)){e.visualMaritimeOpacity=r.from.opacity+(r.to.opacity-r.from.opacity)*k;e.visualMaritimeReveal=r.from.reveal+(r.to.reveal-r.from.reveal)*k;}
  for(const [id,a]of Object.entries(r.to.turrets))e.turretAngles[id]=mixAngle(r.from.turrets[id]??a,a,k);
 }
 // Cues share the displayed barrel pivot, rather than the next network pose.
 const a=e.a+Math.PI/2,c=Math.cos(a),s=Math.sin(a);
 for(const q of e.shotCues||[]){
  if(!q.localMuzzle)continue;
  const m=intrusionMuzzle(e.profileId,q.partId,e.turretAngles?.[q.partId]||0,q.barrelIndex||0)||{...q.localMuzzle,angle:q.localAngle};
  q.x=e.x+e.scale*(m.x*c-m.y*s);q.y=e.y+e.scale*(m.x*s+m.y*c);q.a=m.angle+a;
 }
}


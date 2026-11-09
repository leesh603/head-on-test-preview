import {submarineLayouts} from './submarine-layouts.js';
import {hullOverlap,bossHullRect} from './adriatic-boss-layout.js?v=tame3';
import {maritimeLayouts} from './maritime-intrusion-layouts.js';
import {maritimeRaiderLayouts} from './maritime-raider-layouts.js';
export function fleetHull(e){return{x:e.x,y:e.y,w:(e.hullWidth||40)*2,h:(e.hullLength||150)*2,yaw:(e.a||0)+Math.PI/2};}
export function surfaceTraffic(g){return [...(g.enemies||[]),...(g.friendlyShips||[])].filter(e=>e.movingShip&&e.hp>0&&!e.expired);}
export function surfaceBosses(g){
 const hulls=[...(g.stageBoss?.stages?.encounter?.bodies.values()||[])].filter(b=>!b.dead).map(bossHullRect).filter(Boolean);
 const e=g.intrusionBoss,layout=maritimeLayouts[e?.profileId]||maritimeRaiderLayouts[e?.profileId]||submarineLayouts[e?.profileId];
 // Optional sea encounters live outside BossStages. Use their painted hull,
 // including entry/withdrawal and the submarine's reserved resurfacing space.
 if(layout&&(['entering','active','retreating','destroyed'].includes(e.phase)||submarineLayouts[e.profileId]&&e.phase==='warning'&&e.contactPlaced))hulls.push(submarineLayouts[e.profileId]?submarineHull(e):{x:e.x,y:e.y,w:layout.width*e.scale,h:layout.height*e.scale,yaw:e.a+Math.PI/2});
 return hulls;
}
function liveShipCount(g){let n=0;for(const e of g.enemies||[])if(e.movingShip&&e.hp>0&&!e.expired)n++;for(const e of g.friendlyShips||[])if(e.movingShip&&e.hp>0&&!e.expired)n++;return n;}
export function shipObstacles(g){const list=[];for(const e of g.enemies||[])if(e.movingShip&&e.hp>0&&!e.expired)list.push({e,h:fleetHull(e)});for(const e of g.friendlyShips||[])if(e.movingShip&&e.hp>0&&!e.expired)list.push({e,h:fleetHull(e)});for(const b of surfaceBosses(g))list.push({e:null,h:b});return list;}
export function vacantShipPose(g,e){const other=surfaceTraffic(g).filter(s=>s!==e).map(fleetHull),bosses=surfaceBosses(g),ox=e.x,oy=e.y,a=e.a||0;
 // Bounded spawn search. Reject a crowded birth instead of teleporting a live ship.
 for(let i=0;i<28;i++){const lane=(i===0?0:(i%2?1:-1)*Math.ceil(i/2)*105),back=Math.floor(i/7)*240;e.x=ox-Math.sin(a)*lane-Math.cos(a)*back;e.y=oy+Math.cos(a)*lane-Math.sin(a)*back;const r=fleetHull(e);if(![...other,...bosses].some(b=>hullOverlap(r,b,24)))return true;}e.x=ox;e.y=oy;return false;}
export function steerShipClear(g,e,dt,obstacles){const r=fleetHull(e),look={...r,x:r.x+Math.cos(e.a)*(70+e.driveVelocity*2),y:r.y+Math.sin(e.a)*(70+e.driveVelocity*2)},obs=obstacles||shipObstacles(g);let turn=0;
 for(const o of obs){if(o.e===e)continue;const b=o.h,ov=hullOverlap(look,b,32);if(!ov)continue;const cross=Math.cos(e.a)*(b.y-e.y)-Math.sin(e.a)*(b.x-e.x);turn=cross>=0?-1:1;break;}
 if(turn){e.driveVelocity=Math.max(0,e.driveVelocity-14*dt);return e.a+turn*.65;}return e.course+Math.sin(e.weave)*.055;}
export function resolveSurfaceSpacing(g){if(!liveShipCount(g))return;const ships=surfaceTraffic(g),bosses=surfaceBosses(g);if(ships.length<2&&!bosses.length)return;
 // Fleet traffic yields to boss trajectories, keeping scripted attacks unchanged.
 for(let pass=0;pass<12;pass++){let changed=false;for(let i=0;i<ships.length;i++){const a=ships[i];for(const b of bosses){const ov=hullOverlap(b,fleetHull(a),18);if(ov){a.x+=ov.x*(ov.depth+.05);a.y+=ov.y*(ov.depth+.05);a.driveVelocity=0;changed=true;}}
 for(let j=i+1;j<ships.length;j++){const b=ships[j],ov=hullOverlap(fleetHull(a),fleetHull(b),18);if(!ov)continue;const shift=(ov.depth+.05)/2;a.x-=ov.x*shift;a.y-=ov.y*shift;b.x+=ov.x*shift;b.y+=ov.y*shift;a.driveVelocity=b.driveVelocity=0;changed=true;}}if(!changed)break;}
 // Degenerate crowded contacts yield by withdrawing traffic, never leaving an overlap.
 for(let i=0;i<ships.length;i++){const a=ships[i];if(a.expired)continue;if(bosses.some(b=>hullOverlap(fleetHull(a),b,1)))a.expired=true;for(let j=i+1;j<ships.length;j++)if(!ships[j].expired&&hullOverlap(fleetHull(a),fleetHull(ships[j]),1))ships[j].expired=true;}
}
export function separateBossFleet(ships){for(let pass=0;pass<12;pass++){let changed=false;for(let i=0;i<ships.length;i++)for(let j=i+1;j<ships.length;j++){const a=ships[i],b=ships[j];if(a.dead||b.dead)continue;const ov=hullOverlap(bossHullRect(a),bossHullRect(b),24);if(!ov)continue;const share=a.role==='battleship'?0:b.role==='battleship'?1:.5,shift=ov.depth+.05;a.x-=ov.x*shift*share;a.y-=ov.y*shift*share;b.x+=ov.x*shift*(1-share);b.y+=ov.y*shift*(1-share);a.updateParts();b.updateParts();changed=true;}if(!changed)break;}}

/** Painted submarine hull bounds, excluding water and transparent canvas padding. */
export function submarineHull(e,pose=e){const l=submarineLayouts[e?.profileId];if(!l)return null;const b=l.hullBounds||{x:0,y:0,width:l.width,height:l.height},yaw=pose.a+Math.PI/2,c=Math.cos(yaw),s=Math.sin(yaw);return{x:pose.x+(b.x*c-b.y*s)*e.scale,y:pose.y+(b.x*s+b.y*c)*e.scale,w:b.width*e.scale,h:b.height*e.scale,yaw};}
const shortAngle=a=>Math.atan2(Math.sin(a),Math.cos(a));
/** Swept SAT with rotation. Sampling interval bounds corner travel to <= 2px;
 * its 2px envelope conservatively closes the interval between samples. */
export function sweptHullOverlap(a,z,b,pad=18,bz=b){const da=shortAngle(z.yaw-a.yaw),db=shortAngle(bz.yaw-b.yaw),travel=Math.hypot(z.x-a.x,z.y-a.y)+Math.abs(da)*Math.hypot(a.w,a.h)/2+Math.hypot(bz.x-b.x,bz.y-b.y)+Math.abs(db)*Math.hypot(b.w,b.h)/2,steps=Math.max(1,Math.ceil(travel/2));for(let i=0;i<=steps;i++){const t=i/steps,A={...a,x:a.x+(z.x-a.x)*t,y:a.y+(z.y-a.y)*t,yaw:a.yaw+da*t},B={...b,x:b.x+(bz.x-b.x)*t,y:b.y+(bz.y-b.y)*t,yaw:b.yaw+db*t};if(hullOverlap(A,B,pad+2))return true;}return false;}
export function submarineObstacles(g,e){const list=surfaceTraffic(g).map(s=>fleetHull(s));for(const b of g.stageBoss?.stages?.encounter?.bodies?.values?.()||[]){if(b.dead)continue;const h=bossHullRect(b);if(h)list.push(h);}return list;}
/** Commit only a clear next pose. Blocking slows/turns the moving submarine,
 * never pushes another vessel or teleports the contact to a different lane. */
export function guardSubmarineMovement(g,e,previous){if(!submarineLayouts[e?.profileId])return true;const a=submarineHull(e,previous),z=submarineHull(e),obstacles=submarineObstacles(g,e),hit=obstacles.find(b=>sweptHullOverlap(a,z,b));if(!hit){e.naval.spacingBlocked=false;return true;}
 const rotation={x:previous.x,y:previous.y,a:e.a},r=submarineHull(e,rotation);e.x=previous.x;e.y=previous.y;if(obstacles.some(b=>sweptHullOverlap(a,r,b)))e.a=previous.a;
 e.naval.speed=0;e.driveVelocity=0;e.naval.spacingBlocked=true;e.naval.wakeTrail=previous.wakeTrail;e.naval.wakeClock=previous.wakeClock;
 const cross=Math.cos(e.a)*(hit.y-e.y)-Math.sin(e.a)*(hit.x-e.x),side=cross>=0?-1:1;e.naval.course=e.a+side*.8;e.naval.travelAngle=e.naval.course;e.naval.avoidanceUntil=e.naval.clock+1;return false;
}
/** Ordinary traffic retains its PR477 steering, with a last swept stop only
 * around the new submarine reservation. Do not move ships out after overlap. */
export function guardFleetSubmarineMovement(g,ship,previous){const e=g.intrusionBoss;if(!submarineLayouts[e?.profileId]||!e.contactPlaced||!['warning','entering','active','retreating','destroyed'].includes(e.phase))return true;const obstacle=submarineHull(e),a=fleetHull({...ship,...previous}),z=fleetHull(ship);if(!sweptHullOverlap(a,z,obstacle))return true;ship.x=previous.x;ship.y=previous.y;const rotation=fleetHull(ship);if(sweptHullOverlap(a,rotation,obstacle))ship.a=previous.a;ship.driveVelocity=0;return false;}

import {hullOverlap,bossHullRect} from './adriatic-boss-layout.js?v=485';
export function fleetHull(e){return{x:e.x,y:e.y,w:(e.hullWidth||40)*2,h:(e.hullLength||150)*2,yaw:(e.a||0)+Math.PI/2};}
export function surfaceTraffic(g){return [...(g.enemies||[]),...(g.friendlyShips||[])].filter(e=>e.movingShip&&e.hp>0&&!e.expired);}
export function surfaceBosses(g){return [...(g.stageBoss?.stages?.encounter?.bodies.values()||[])].filter(b=>!b.dead).map(bossHullRect).filter(Boolean);}
export function vacantShipPose(g,e){const other=surfaceTraffic(g).filter(s=>s!==e).map(fleetHull),bosses=surfaceBosses(g),ox=e.x,oy=e.y,a=e.a||0;
 // Bounded spawn search. Reject a crowded birth instead of teleporting a live ship.
 for(let i=0;i<28;i++){const lane=(i===0?0:(i%2?1:-1)*Math.ceil(i/2)*105),back=Math.floor(i/7)*240;e.x=ox-Math.sin(a)*lane-Math.cos(a)*back;e.y=oy+Math.cos(a)*lane-Math.sin(a)*back;const r=fleetHull(e);if(![...other,...bosses].some(b=>hullOverlap(r,b,24)))return true;}e.x=ox;e.y=oy;return false;}
export function steerShipClear(g,e,dt){const r=fleetHull(e),look={...r,x:r.x+Math.cos(e.a)*(70+e.driveVelocity*2),y:r.y+Math.sin(e.a)*(70+e.driveVelocity*2)},obstacles=[...surfaceTraffic(g).filter(s=>s!==e).map(fleetHull),...surfaceBosses(g)];let turn=0;
 for(const b of obstacles){const ov=hullOverlap(look,b,32);if(!ov)continue;const cross=Math.cos(e.a)*(b.y-e.y)-Math.sin(e.a)*(b.x-e.x);turn=cross>=0?-1:1;break;}
 if(turn){e.driveVelocity=Math.max(0,e.driveVelocity-14*dt);return e.a+turn*.65;}return e.course+Math.sin(e.weave)*.055;}
export function resolveSurfaceSpacing(g){const ships=surfaceTraffic(g),bosses=surfaceBosses(g);
 // Fleet traffic yields to boss trajectories, keeping scripted attacks unchanged.
 for(let pass=0;pass<12;pass++){let changed=false;for(let i=0;i<ships.length;i++){const a=ships[i];for(const b of bosses){const ov=hullOverlap(b,fleetHull(a),18);if(ov){a.x+=ov.x*(ov.depth+.05);a.y+=ov.y*(ov.depth+.05);a.driveVelocity=0;changed=true;}}
 for(let j=i+1;j<ships.length;j++){const b=ships[j],ov=hullOverlap(fleetHull(a),fleetHull(b),18);if(!ov)continue;const shift=(ov.depth+.05)/2;a.x-=ov.x*shift;a.y-=ov.y*shift;b.x+=ov.x*shift;b.y+=ov.y*shift;a.driveVelocity=b.driveVelocity=0;changed=true;}}if(!changed)break;}
 // Degenerate crowded contacts yield by withdrawing traffic, never leaving an overlap.
 for(let i=0;i<ships.length;i++){const a=ships[i];if(a.expired)continue;if(bosses.some(b=>hullOverlap(fleetHull(a),b,1)))a.expired=true;for(let j=i+1;j<ships.length;j++)if(!ships[j].expired&&hullOverlap(fleetHull(a),fleetHull(ships[j]),1))ships[j].expired=true;}
}
export function separateBossFleet(bodies){const ships=[...bodies].filter(b=>b.jutlandBoss&&!b.jutlandAirship&&!b.dead);for(let pass=0;pass<12;pass++){let changed=false;for(let i=0;i<ships.length;i++)for(let j=i+1;j<ships.length;j++){const a=ships[i],b=ships[j],ov=hullOverlap(bossHullRect(a),bossHullRect(b),24);if(!ov)continue;const share=a.role==='battleship'?0:b.role==='battleship'?1:.5,shift=ov.depth+.05;a.x-=ov.x*shift*share;a.y-=ov.y*shift*share;b.x+=ov.x*shift*(1-share);b.y+=ov.y*shift*(1-share);a.updateParts();b.updateParts();changed=true;}if(!changed)break;}}

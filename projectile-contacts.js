// Shared broad-phase/first-contact ordering for ordinary and legacy aircraft.
// Boss bodies keep their authored exact collision routines and relative slots.
const byTime=(a,b)=>a.t-b.t;
export function legacyProjectileTarget(world,target){return !!target?.eliteKind&&typeof world.eliteEnemies?.damageMember==='function'&&!!world.eliteEnemies.members?.includes(target);}
export function projectileTargetRadius(target,radiusFor){return target?.eliteKind?(target.eliteKind==='schlachtstaffel'?24:18):radiusFor(target);}
export function projectileContactTime(round,target,radiusFor){
 const x1=round.x,y1=round.y,x0=Number.isFinite(round.previousX)?round.previousX:x1,y0=Number.isFinite(round.previousY)?round.previousY:y1;
 if(![x0,y0,x1,y1,target.x,target.y].every(Number.isFinite))return Infinity;
 const moving=!!round.sweptProjectile,tx0=moving?(target.wwiPreviousX??target.previousX??target.x):target.x,ty0=moving?(target.wwiPreviousY??target.previousY??target.y):target.y;
 let ox=x0-tx0,oy=y0-ty0,dx=x1-target.x-ox,dy=y1-target.y-oy;
 const pad=Math.max(0,round.collisionRadius||0),scale=round.ammunitionHitScale||1;
 if(target.hullLength){const a=target.a||0,c=Math.cos(a),s=Math.sin(a),l=Math.abs(target.hullLength)*scale+pad,w=Math.abs(target.hullWidth)*scale+pad;if(!(l>0&&w>0))return Infinity;[ox,oy,dx,dy]=[(ox*c+oy*s)/l,(-ox*s+oy*c)/w,(dx*c+dy*s)/l,(-dx*s+dy*c)/w];}
 else{const r=projectileTargetRadius(target,radiusFor)*scale+pad;if(!(r>0))return Infinity;ox/=r;oy/=r;dx/=r;dy/=r;}
 const c=ox*ox+oy*oy-1;if(c<=0)return 0;const a=dx*dx+dy*dy;if(!a)return Infinity;
 const dot=ox*dx+oy*dy,d=dot*dot-a*c;if(d<0)return Infinity;const t=(-dot-Math.sqrt(d))/a;return t>=0&&t<=1?t:Infinity;
}
export function prepareProjectileTargets(world){
 const members=world.eliteEnemies?.members;
 if(!members?.some(e=>e.alive!==false&&e.hp>0)){world._projectileTargets=world.enemies;return world.enemies;}
 const out=world._combinedProjectileTargets??=[];out.length=0;for(const e of world.enemies)out.push(e);
 for(const e of members)if(e.alive!==false&&e.hp>0&&!world.enemies.includes(e))out.push(e);
 world._projectileTargets=out;return out;
}
export function orderedProjectileCandidates(world,round,radiusFor){
 const source=world._projectileTargets||world.enemies,grid=world._projectileGrid;
 // Existing special swept ordnance can include target motion: retain its full broad phase.
 let candidates;if(round?.sweptProjectile||world.useCollisionGrid===false||!grid)candidates=source;
 else if(round?.actualExplosion)candidates=grid.query(round,source);
 else{const x0=Number.isFinite(round.previousX)?round.previousX:round.x,y0=Number.isFinite(round.previousY)?round.previousY:round.y;
  const query=world._projectileSweepQuery??={};query.x=(x0+round.x)/2;query.y=(y0+round.y)/2;query.collisionRadius=Math.max(0,round.collisionRadius||0)+Math.hypot(round.x-x0,round.y-y0)/2+grid.maxRadius*((round.ammunitionHitScale||1)-1);candidates=grid.query(query,source);}
 if(round?.actualExplosion)return candidates;
 const out=world._orderedProjectileTargets??=[],air=world._projectileContactScratch??=[];out.length=air.length=0;const pool=world._projectileContactPool??=[];
 for(const e of candidates){if(e.stageBossBody){out.push(e);continue;}const t=projectileContactTime(round,e,radiusFor);if(Number.isFinite(t)){const contact=pool[air.length]??={};contact.e=e;contact.t=t;air.push(contact);out.push(null);}}
 air.sort(byTime);let index=0;for(let i=0;i<out.length;i++)if(!out[i])out[i]=air[index++].e;return out;
}

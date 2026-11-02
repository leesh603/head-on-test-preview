// Native elite MG, rocket and flak currently share linear vx/vy integration.
// Send births/deaths once, and authoritative corrections whenever prediction or
// any primitive render/combat descriptor changes. Never simulate guest damage.
const OMIT=new Set(['__proto__','constructor','prototype']);
const MOVING=new Set(['x','y','life']);
const descriptor=p=>Object.fromEntries(Object.entries(p).filter(([k,v])=>!OMIT.has(k)&&['number','string','boolean'].includes(typeof v)).map(([k,v])=>[k,typeof v==='number'&&Number.isFinite(v)?Math.round(v*1000)/1000:v]));
const valid=p=>p&&typeof p.id==='string'&&['x','y','vx','vy','life'].every(k=>Number.isFinite(p[k]));
const same=(a,b)=>{const keys=new Set([...Object.keys(a),...Object.keys(b)]);for(const k of keys)if(!MOVING.has(k)&&a[k]!==b[k])return false;return true;};
export class LegacyProjectileStream{
 constructor(){this.sent=new Map();this.replica=new Map();}
 clear(){this.sent.clear();this.replica.clear();}
 take(projectiles,time,full=false){
  if(full)this.sent.clear();
  const born=[],changed=[],retired=[],alive=new Set();
  for(const raw of projectiles){if(!(raw.life>0))continue;const p=descriptor(raw);if(!valid(p))continue;alive.add(p.id);const prior=this.sent.get(p.id),dt=prior?time-prior.time:0;
   if(!prior)born.push(p);
   else if(dt<0||!same(prior.data,p)||Math.abs(p.x-prior.data.x-prior.data.vx*dt)>.02||Math.abs(p.y-prior.data.y-prior.data.vy*dt)>.02||Math.abs(p.life-prior.data.life+dt)>.005)changed.push(p);
   else continue;
   this.sent.set(p.id,{data:p,time});
  }
  for(const id of this.sent.keys())if(!alive.has(id)){retired.push(id);this.sent.delete(id);}
  return {version:1,full:!!full,born,changed,retired};
 }
 accept(message){
  if(message.full)this.replica.clear();
  for(const p of [...(message.born||[]),...(message.changed||[])]){if(!valid(p))continue;let e=this.replica.get(p.id);if(!e){e={};this.replica.set(p.id,e);}for(const k of Object.keys(e))if(!Object.hasOwn(p,k))delete e[k];Object.assign(e,descriptor(p));}
  for(const id of message.retired||[])this.replica.delete(id);
 }
 advance(dt){for(const [id,p] of this.replica){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;if(p.life<=0)this.replica.delete(id);}}
 values(){return [...this.replica.values()].filter(p=>p.life>0);}
}

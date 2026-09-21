import {FixedPool} from './support-pool129.js';
export const HANGAR=Object.freeze({x:0,y:.213,w:.25,h:.314}); // normalized to full base image
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function segmentDistance(x,y,a,b){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy,t=l?clamp(((x-a.x)*dx+(y-a.y)*dy)/l,0,1):0;return Math.hypot(x-a.x-t*dx,y-a.y-t*dy);}
export class StuttgartSupport {
 constructor({id,tuning,x,y,width,height,angle=0,onDamage,spawnSeaplane,countSeaplanes,clearOwned,onCleared,onCue=()=>{}}){
  for(const k of ['maxHp','damage','bulletSpeed','spawnInterval','minionCap','rotationSpeed'])if(!Number.isFinite(tuning?.[k])||tuning[k]<=0)throw new Error('Required tuning: '+k);
  if(!id||![x,y,width,height,angle].every(Number.isFinite)||width<=0||height<=0)throw new Error('Invalid transform');
  for(const f of [onDamage,spawnSeaplane,countSeaplanes,clearOwned,onCleared])if(typeof f!=='function')throw new Error('Missing host hook');
  Object.assign(this,{id,tuning:{...tuning},x,y,width,height,angle,onDamage,spawnSeaplane,countSeaplanes,clearOwned,onCleared,onCue});
  this.maxHp=tuning.maxHp;this.hp=this.maxHp;this.phase=1;this.time=0;this.phaseAge=0;this.dead=false;this.cleaned=false;this.notified=false;
  this.fireClock=1.8;this.spawnClock=tuning.spawnInterval;this.linkedLaunchClock=0;this.volley=0;this.fireSide=0;this.fxSerial=0;this.cover=null;
  this.parts=new Map([['cover',0,.213,.125,.157,.18],['fuel',.084,.24,.032,.105,.10],['gun0',-.12,-.324,.048,.033,.06],['gun1',.12,-.324,.048,.033,.06],['gun2',-.165,-.045,.048,.033,.06],['gun3',.165,-.045,.048,.033,.06]].map(([id,nx,ny,rx,ry,hp])=>[id,{id,nx,ny,rx,ry,hp:hp*this.maxHp,maxHp:hp*this.maxHp}]));
  this.projectiles=new FixedPool(256,()=>({hits:new Set()}));this.effects=new FixedPool(160);this.damageSerial=0;
 }
 world(nx,ny,angle=this.angle){const x=nx*this.width,y=ny*this.height,c=Math.cos(angle),s=Math.sin(angle);return{x:this.x+x*c-y*s,y:this.y+x*s+y*c};}
 local(x,y){const dx=x-this.x,dy=y-this.y,c=Math.cos(this.angle),s=Math.sin(this.angle);return{x:(dx*c+dy*s)/this.width,y:(-dx*s+dy*c)/this.height};}
 hittable(p){return p.hp>0&&(p.id!=='fuel'||this.phase>=2)&&(p.id!=='cover'||this.phase===1);}
 locateHit({x,y,previousX=x,previousY=y,radius=0}){
  if(this.dead)return null;const a=this.local(previousX,previousY),b=this.local(x,y);
  for(const p of this.parts.values())if(this.hittable(p)){const rx=p.rx+radius/this.width,ry=p.ry+radius/this.height;if(segmentDistance(0,0,{x:(a.x-p.nx)/rx,y:(a.y-p.ny)/ry},{x:(b.x-p.nx)/rx,y:(b.y-p.ny)/ry})<=1)return p.id;}
  const rx=.18+radius/this.width,ry=.44+radius/this.height;return segmentDistance(0,0,{x:a.x/rx,y:a.y/ry},{x:b.x/rx,y:b.y/ry})<=1?'hull':null;
 }
 hitAt(s){const partId=this.locateHit(s);return partId?this.hit({partId,damage:s.damage}):{damage:0,miss:true};}
 hit({partId='hull',damage}){
  if(!Number.isFinite(damage)||damage<0)throw new Error('Invalid damage');if(this.dead)return{damage:0,blocked:true};
  const p=this.parts.get(partId);if(partId!=='hull'&&(!p||!this.hittable(p)))return{damage:0,blocked:true};
  const dealt=Math.min(this.hp,p?Math.min(p.hp,damage):damage);if(p)p.hp-=dealt;this.hp-=dealt;
  if(p&&p.hp<=0){const q=this.world(p.nx,p.ny);this.onCue({type:'part-destroyed',encounterId:this.id,partId,x:q.x,y:q.y});this.fx('burst',q.x,q.y,34,.9);
   if(partId==='fuel'&&this.hp>0){this.hp=Math.max(0,this.hp-this.maxHp*.10);this.onCue({type:'fuel-detonation',encounterId:this.id,...q});}
  }
  if(this.hp<=0){this.dead=true;this.clean();}
  else if(this.phase===1&&(this.hp<=this.maxHp*.55||this.parts.get('cover').hp<=0))this.openHangar();
  return{damage:dealt,partId,partDestroyed:p?.hp<=0,defeated:this.dead};
 }
 openHangar(){if(this.phase!==1||this.dead)return;this.phase=2;this.phaseAge=0;this.parts.get('cover').hp=0;
  const q=this.world(HANGAR.x,HANGAR.y),a=this.angle;this.cover={x:q.x,y:q.y,angle:a,age:0,vx:Math.cos(a)*110,vy:Math.sin(a)*110};
  this.fx('burst',q.x,q.y,62,.9);for(let i=0;i<10;i++)this.fx('debris',q.x,q.y,3,1.7,{vx:Math.cos(i*2.4)*90,vy:Math.sin(i*2.4)*90});
  this.onCue({type:'hangar-cover-ejected',encounterId:this.id,...q});
 }
 fx(kind,x,y,radius,life,extra={}){const f=this.effects.acquire();if(f)Object.assign(f,{kind,x,y,radius,life,age:0,vx:0,vy:0,angle:0,...extra});return f;}
 shoot(x,y,angle){const p=this.projectiles.acquire();if(!p)return;p.hits.clear();Object.assign(p,{id:this.id+':shot:'+(++this.damageSerial),kind:'shell',x,y,vx:Math.cos(angle)*this.tuning.bulletSpeed,vy:Math.sin(angle)*this.tuning.bulletSpeed,age:0,warning:0,life:4,radius:4,damage:this.tuning.damage*.34,applied:false});}
 flak(x,y){const p=this.projectiles.acquire();if(!p)return;p.hits.clear();Object.assign(p,{id:this.id+':flak:'+(++this.damageSerial),kind:'flak',x,y,vx:0,vy:0,age:0,warning:1.05,life:1.35,radius:30,damage:this.tuning.damage*.72,applied:false});}
 fire(players){const side=this.fireSide++%2,indices=side?[1,3]:[0,2];for(const i of indices){const p=this.parts.get('gun'+i);if(p.hp<=0)continue;const q=this.world(p.nx,p.ny),a=this.angle+(side?0:Math.PI)+Math.sin(this.volley*.4)*.3;
   const n=Math.max(1,Math.ceil(5*(this.tuning.projectileDensity??1)));for(let j=0;j<n;j++)this.shoot(q.x,q.y,a+(n===1?0:j/(n-1)-.5)*.6);this.fx('muzzle',q.x,q.y,15,.20,{angle:a});
  }
  if(this.volley++%2===1){const alive=players.filter(p=>p.alive);if(alive.length){const p=alive[(this.volley>>1)%alive.length];for(const d of [-64,64])this.flak(p.x+d,p.y);if(this.phase>=2)this.linkedLaunchClock=this.phase===3 ? .82 : 1.02;}}
  this.onCue({type:'aa-volley',encounterId:this.id,x:this.x,y:this.y});
 }
 launch(players=[]){if(this.phase<2||this.parts.get('fuel').hp<=0)return;
  const active=this.countSeaplanes(this.id),count=Math.min(this.phase===3?3:2,this.tuning.minionCap-active);if(count<=0)return;
  const q=this.world(0,.445),angle=this.angle+Math.PI,target=players.filter(p=>p.alive)[this.volley%Math.max(1,players.filter(p=>p.alive).length)];
  let accepted=0;for(let i=0;i<count;i++){const lane=(i-(count-1)/2)*42,nx=q.x-Math.sin(angle)*lane,ny=q.y+Math.cos(angle)*lane;
   if(this.spawnSeaplane({ownerId:this.id,faction:'central',x:nx,y:ny,angle,kind:'floatplane',behavior:'attack-pass',formationIndex:i,formationCount:count,
    passTargetX:(target?.x??q.x+Math.cos(angle)*520)+(target?.vx||0)*.9,passTargetY:(target?.y??q.y+Math.sin(angle)*520)+(target?.vy||0)*.9,invulnerableSeconds:.45})!==false)accepted++;}
  if(accepted){this.fx('wake',q.x,q.y,22,.8,{angle:this.angle});this.onCue({type:'seaplane-launch',encounterId:this.id,count:accepted,...q});}
 }
 tick(dt,{players,paused=false,transitionBlocked=false}){
  if(paused)return;if(!Number.isFinite(dt)||dt<0)throw new Error('Invalid dt');if(this.dead){this.clean();if(!transitionBlocked&&!this.notified){this.notified=true;this.onCleared(this.snapshot());}return;}
  this.time+=dt;this.phaseAge+=dt;if(this.phase===2&&this.hp<=this.maxHp*.28){this.phase=3;this.phaseAge=0;this.onCue({type:'phase-change',encounterId:this.id,phase:'full-sortie'});}this.angle=(this.angle+this.tuning.rotationSpeed*dt)%(Math.PI*2); // fixed center
  if(this.cover){this.cover.age+=dt;this.cover.x+=this.cover.vx*dt;this.cover.y+=this.cover.vy*dt;this.cover.angle+=dt*1.2;if(this.cover.age>=1.8)this.cover=null;}
  this.fireClock-=dt;if(this.fireClock<=0){const base=this.phase===1?1.35:this.phase===2?1.2:1.05;this.fireClock=(this.fireSide%2?base:base+0.55)/(this.tuning.projectileDensity??1);this.fire(players);}
  this.spawnClock-=dt;if(this.spawnClock<=0){this.spawnClock=this.tuning.spawnInterval*(this.phase===3 ? .72 : 1);this.launch(players);}
  if(this.linkedLaunchClock>0&&(this.linkedLaunchClock-=dt)<=0)this.launch(players);
  this.projectiles.visit(p=>{const ax=p.x,ay=p.y;p.age+=dt;if(p.age<p.warning)return;p.x+=p.vx*dt;p.y+=p.vy*dt;
   if(p.kind==='flak'&&!p.applied){p.applied=true;this.fx('burst',p.x,p.y,p.radius,.45);this.onCue({type:'flak-burst',encounterId:this.id,x:p.x,y:p.y});}
   for(const target of players){if(!p.active||!target.alive||p.hits.has(target.id))continue;
    const old={x:target.teleported?target.x:target.previousX??target.x,y:target.teleported?target.y:target.previousY??target.y};
    const hit=p.kind==='shell'?segmentDistance(0,0,{x:ax-old.x,y:ay-old.y},{x:p.x-target.x,y:p.y-target.y})<=p.radius+(target.radius??0):Math.hypot(p.x-target.x,p.y-target.y)<=p.radius+(target.radius??0);
    if(hit){p.hits.add(target.id);this.onDamage(target.id,p.damage,{kind:p.kind,sourceId:p.id,ownerId:this.id});if(p.kind==='shell'){this.fx('burst',p.x,p.y,16,.35);this.projectiles.release(p.index,p.generation);break;}}
   }if(p.active&&p.age>=p.life)this.projectiles.release(p.index,p.generation);
  });
  this.effects.visit(f=>{f.age+=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;if(f.age>=f.life)this.effects.release(f.index,f.generation);});
 }
 clean(){if(this.cleaned)return;this.cleaned=true;this.projectiles.clear();this.effects.clear();this.cover=null;this.clearOwned(this.id);}
 dispose(){this.dead=true;this.clean();this.notified=true;}
 snapshot(){return{id:this.id,bossId:'sms-stuttgart',name:'SMS 슈투트가르트',role:'support-miniboss',hp:this.hp,maxHp:this.maxHp,phase:this.phase,completed:this.dead,parts:[...this.parts.values()].map(p=>({id:p.id,hp:p.hp,maxHp:p.maxHp,hittable:this.hittable(p)}))};}
}

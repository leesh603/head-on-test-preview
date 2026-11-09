import {bomberWingContact,recordBomberWingHit,tickBomberWings} from './bomber-wing-damage.js';
import {arrivalFlightTurn} from './boss-arrival-flight.js';
import {abortCityBomb,planCityBomb,releaseCityBomb} from './gotha-squadron-combat.js?v=natural-flight20261031&orbit=20261107';
import {BaseBoss,BossPart} from './headon-stageboss-core.js?v=tame3&ai=1018&sig=1019&boss=20261020b&phase=1021&harbor=20261021';
import {O400_LAYOUT} from './o400-layout.js';
import {segmentDistance,sweptPolygon} from './alps-geometry117.js?v=tame3';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const inView=(q,bounds,margin=0)=>!bounds||(q.x>=bounds.left+margin&&q.x<=bounds.right-margin&&q.y>=bounds.top+margin&&q.y<=bounds.bottom-margin);
function gunFor(body,p){
 const bearing=Math.atan2(p.y-body.y,p.x-body.x);
 const part=body.parts.get(Math.abs(wrap(bearing-body.a))<1.5?'front-gun':'rear-gun');
 return part.destroyed?null:part;
}
export const O400_TURN_RATE=.85;
export class O400Raider extends BaseBoss {
 constructor({tuning,slot=0,faction='entente',...options}){
  const hp=tuning.maxHp,defs=O400_LAYOUT.parts;
  super({...options,maxHp:hp,coreRadius:23,parts:defs.map(([id,x,y,radius,k])=>new BossPart({id,x,y,radius,maxHp:hp*k}))});
  Object.assign(this,{t:tuning,slot,faction,kind:'o400-raider',formationTotal:1,ownsMotion129:true,nativeBomberCombat:true,coreVulnerable:true,a:Math.PI/2,speed:135,age:0,phase:'approach',bayOpen:0});
  this.mounts=defs.map(([id,x,y])=>({id,x,y}));this.gunWait=.7+(slot%3)*.7;this.rotateMounts();
 }
 command(type,spec={}){this.emit({...spec,type,bossId:this.id,faction:this.faction});}
 hazard(kind,spec){this.command('hazard',{kind,damage:this.t.damage,warning:0,duration:2,...spec});}
 suppressive(){}
 engines(){return ['engine-left','engine-right'].filter(id=>!this.parts.get(id).destroyed).length;}
 rotateMounts(){const a=this.a+Math.PI/2,c=Math.cos(a),s=Math.sin(a);for(const m of this.mounts){const p=this.parts.get(m.id);p.x=m.x*c-m.y*s;p.y=m.x*s+m.y*c;}}
 point(id,angle){const p=this.parts.get(id);return{x:this.x+p.x+(Number.isFinite(angle)?Math.cos(angle)*5:0),y:this.y+p.y+(Number.isFinite(angle)?Math.sin(angle)*5:0)};}
 onPartDestroyed(p){this.volley=null;if(p.id==='bomb-bay'||!this.engines())abortCityBomb(this);this.command('cancel-hazards',{tag:this.id+'-'+p.id,pendingOnly:true});}
 hit(a){const p=a.partId&&this.parts.get(a.partId),r=super.hit(a);if(!p)recordBomberWingHit(this,a.wingSide,r.damage);if(p&&r.damage){p.hitFlash=.16;if(!this.dead){const d=super.hit({damage:r.damage*.7});r.bodyDefeated=d.bodyDefeated;}}return r;}
 locateHit(a){
  if(this.dead)return null;
  const x0=Number.isFinite(a.previousX)&&Number.isFinite(a.previousY)?a.previousX:a.x,y0=Number.isFinite(a.previousX)&&Number.isFinite(a.previousY)?a.previousY:a.y,r=Math.max(0,a.radius||0);
  // Use the existing swept geometry helper. No generic central collision disc:
  // the empty space between the main wings and tail must remain empty.
  const c=Math.cos(this.a+Math.PI/2),s=Math.sin(this.a+Math.PI/2),local=(x,y)=>({x:(x-this.x)*c+(y-this.y)*s,y:-(x-this.x)*s+(y-this.y)*c}),from=local(x0,y0),to=local(a.x,a.y);
  if(Math.max(from.x,to.x)<-O400_LAYOUT.width/2-r||Math.min(from.x,to.x)>O400_LAYOUT.width/2+r||Math.max(from.y,to.y)<-O400_LAYOUT.height/2-r||Math.min(from.y,to.y)>O400_LAYOUT.height/2+r)return null;
  const steps=Math.max(1,Math.ceil(Math.hypot(a.x-x0,a.y-y0)/3));let previous={x:x0,y:y0},localPrevious=from;
  // Walk in travel order, as before, but sweep each short interval so a fast
  // round cannot skip a thin tailplane or hit the far engine through a wing.
  for(let i=0;i<=steps;i++){
   const t=i/steps,point={x:x0+(a.x-x0)*t,y:y0+(a.y-y0)*t},localPoint={x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t};
   for(const m of this.mounts){const p=this.parts.get(m.id),f=O400_LAYOUT.partFootprints[m.id];
    if(p.hittable&&!p.destroyed&&segmentDistance(m.x/(f.rx+r),m.y/(f.ry+r),localPrevious.x/(f.rx+r),localPrevious.y/(f.ry+r),localPoint.x/(f.rx+r),localPoint.y/(f.ry+r))<=1)return{partId:p.id};
   }
   if(this.coreVulnerable&&O400_LAYOUT.hulls.some(p=>sweptPolygon(localPrevious,localPoint,r,p))){
    // The rear gun sits on the wing/fuselage join. Damage to this small
    // mounting surface belongs to the gun, not an opaque hull in front of it.
    // This runs ONLY after silhouette contact: no added hitbox in empty air.
    const rear=this.parts.get('rear-gun');
    if(!rear.destroyed&&Math.abs(localPoint.x)<=12+r&&localPoint.y>=-31-r&&localPoint.y<=3+r)return{partId:rear.id};
    return{partId:null,wingSide:bomberWingContact(this.kind,localPoint.x,localPoint.y,r)};
   }
   previous=point;localPrevious=localPoint;
  }return null;
 }
 hitAt(a){const hit=this.locateHit(a);return hit?this.hit({...a,...hit}):{damage:0,miss:true};}
 update(dt,{players=[],bounds,londonTargets=[]}){
  if(this.dead||dt<=0)return;const p=players.find(p=>p.alive!==false);if(!p)return;this.age+=dt;tickBomberWings(this,dt);
  const time=this.encounter?.clock??this.age,live=[...this.encounter?.bodies.values()||[this]].filter(b=>b.kind===this.kind&&!b.dead);
  const beat=time%10,cycle=Math.floor(time/10),group=Math.floor(this.slot/3),groups=[...new Set(live.map(b=>Math.floor(b.slot/3)))];
  const activeGroup=groups[cycle%groups.length],active=group===activeGroup,flight=live.filter(b=>Math.floor(b.slot/3)===activeGroup);
  const rank=flight.indexOf(this),count=flight.length,multiple=groups.length>1,waiting=multiple&&!active;
  const wantedRadius=waiting?(group===groups[(cycle+1)%groups.length]&&beat>=5.8?360:500):multiple?220:135;
  this.orbitRadius??=wantedRadius;
  this.orbitRadius+=clamp(wantedRadius-this.orbitRadius,-65*dt,65*dt);
  const radius=this.orbitRadius,omega=multiple?.45:.65,angle=time*omega+(this.slot%3)*Math.PI*2/3+group*Math.PI*2/9;
  // Initial spawn only. Subsequent tracking changes heading and airspeed, never position.
  if(!this.started){this.started=true;this.x=p.x+Math.cos(angle)*radius;this.y=p.y+Math.sin(angle)*radius;this.a=angle+Math.PI/2;}
  let vx=(p.vx||0)-Math.sin(angle)*radius*omega+(p.x+Math.cos(angle)*radius-this.x)*1.35,vy=(p.vy||0)+Math.cos(angle)*radius*omega+(p.y+Math.sin(angle)*radius-this.y)*1.35;
  const separation=multiple?255:135,avoidance=multiple?5:1;
  for(const b of live){if(b===this)continue;const dx=this.x-b.x,dy=this.y-b.y,d=Math.hypot(dx,dy);if(d>1&&d<separation){vx+=dx/d*(separation-d)*avoidance;vy+=dy/d*(separation-d)*avoidance;}}
  const engines=this.engines(),turn=O400_TURN_RATE*(engines?1:.75);
  // Outside the combat area, fly back toward the pilot before resuming the orbit.
  const dx=p.x-this.x,dy=p.y-this.y;
  const reachX=bounds?Math.max(90,(bounds.right-bounds.left)*.42):210;
  const reachY=bounds?Math.max(90,(bounds.bottom-bounds.top)*.42):210;
  const returning=!multiple&&engines&&Math.hypot(dx/reachX,dy/reachY)>(count===1?1:2);
  if(returning){
   vx=dx*1.65+(p.vx||0)*1.8;
   vy=dy*1.65+(p.vy||0)*1.8;
  }
  const heading=Math.atan2(vy,vx),headingError=Math.abs(wrap(heading-this.a));
  const speedLimit=engines===2?350:300;
  const cornerSpeed=engines?85:80;
  const aligned=clamp(1-headingError/1.15,0,1);
  const cruise=clamp(Math.hypot(vx,vy),engines?100:80,speedLimit);
  const goal=returning?clamp(Math.hypot(vx,vy),cornerSpeed,cornerSpeed+(speedLimit-cornerSpeed)*aligned):multiple?Math.max(cornerSpeed,Math.min(cruise,cruise*(1.2-headingError*.45))):cruise;
  const decel=returning?205:85;
  const anticipate=returning||multiple;
  this.a+=arrivalFlightTurn(this,dt,heading,turn,this.speed,anticipate?goal:this.speed,anticipate?105:0,anticipate?decel:0)*dt;
  this.speed+=clamp(goal-this.speed,-decel*dt,105*dt);
  this.x+=Math.cos(this.a)*this.speed*dt;this.y+=Math.sin(this.a)*this.speed*dt;this.rotateMounts();
  for(const part of this.parts.values()){part.gunFlash=Math.max(0,(part.gunFlash||0)-dt);part.hitFlash=Math.max(0,(part.hitFlash||0)-dt);}
  if(!engines){this.phase='gliding';this.glideAge=(this.glideAge||0)+dt;if(this.glideAge>4.6)super.hit({damage:this.hp});return;}
  const visible=inView(this,bounds,12);
  const scheduled=flight[count===3?Math.floor(beat/2)%3:count===2?cycle%2:0];
  const gunner=live.find(b=>b.volley)||[scheduled,...live].find(b=>b&&b.gunWait<=0&&inView(b,bounds,12)&&b.engines()&&gunFor(b,p));
  this.phase=beat<5.8?(count===1?'short-pass':count===2?'guard-swap':'sequential-cover'):beat<7.2?'parallel-bombing':'recovery';
  const allowed=visible&&this.age>1.2&&beat<5.8;
  this.gunWait-=dt;
  if(this.volley){const v=this.volley,part=this.parts.get(v.id);v.left-=dt;
   if(!allowed||part.destroyed){this.volley=null;}
   else if(v.left<=0){this.volley=null;const q=this.point(v.id,v.angle);if(!inView(q,bounds))return;this.gunWait=1.7;part.gunFlash=.18;this.command('muzzle',{...q,partId:v.id});
    for(const off of [-.09,0,.09])this.hazard('projectile',{...q,vx:Math.cos(v.angle+off)*v.speed,vy:Math.sin(v.angle+off)*v.speed,radius:4,damage:this.t.damage*.42,duration:1.6,visual:'gotha-mg',sourcePartId:v.id,sourceOffsetX:Math.cos(v.angle)*5,sourceOffsetY:Math.sin(v.angle)*5,tag:this.id+'-'+v.id,lockedAim:true,signatureAttack:true});
   }
  }else if(allowed&&beat<4.9&&gunner===this){const part=gunFor(this,p),id=part.id;
   const q=this.point(id),speed=Math.max(260,this.t.bulletSpeed*.8),fx=q.x+Math.cos(this.a)*this.speed*.9,fy=q.y+Math.sin(this.a)*this.speed*.9;
   let lead=.9;
   for(let i=0;i<3;i++)lead=.9+Math.min(1.35,Math.hypot(p.x+(p.vx||0)*lead-fx,p.y+(p.vy||0)*lead-fy)/speed);
   const aim=Math.atan2(p.y+(p.vy||0)*lead-fy,p.x+(p.vx||0)*lead-fx);
   part.aimAngle=aim;this.volley={id,angle:aim,left:.9,speed};this.command('charge-warning',{...q,partId:id,targetX:q.x+Math.cos(aim)*440,targetY:q.y+Math.sin(aim)*440,lockedAngle:aim,followSource:true,seconds:.9});
  }
  this.bayOpen=Math.max(0,this.bayOpen-dt*1.5);
  planCityBomb(this,londonTargets,time,active,10,5.8);
  if(this.runTarget&&beat>=5.8){this.bayOpen=1;releaseCityBomb(this,this.point('bomb-bay'));}
  if(active&&visible&&beat>=5.8&&beat<7.2&&this.bombCycle!==cycle&&!this.parts.get('bomb-bay').destroyed&&(count!==2||rank!==cycle%2)){
   this.bombCycle=cycle;this.bayOpen=1;const q=this.point('bomb-bay'),a=Math.hypot(p.vx||0,p.vy||0)>1?Math.atan2(p.vy,p.vx):Math.PI/2,side=count===3?rank-1:rank%2?1:-1;
   // The central aircraft covers; wingmen leave a real 100px-wide escape lane.
   if(count===3&&side===0)return;
   for(let i=0;i<(engines===2?2:1);i++){const lateral=(side||1)*100,along=i*74;this.hazard('circle',{x:p.x+(p.vx||0)*1.1-Math.sin(a)*lateral+Math.cos(a)*along,y:p.y+(p.vy||0)*1.1+Math.cos(a)*lateral+Math.sin(a)*along,radius:43,warning:1.1+i*.25,duration:.25,once:true,visual:'carpet-bomb',airborneBomb:true,sourceX:q.x,sourceY:q.y,sourcePartId:'bomb-bay',tag:this.id+'-bomb-bay',lockedAim:true});}
  }
 }
}


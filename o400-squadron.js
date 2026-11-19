import {bomberWingContact,recordBomberWingHit,tickBomberWings} from './bomber-wing-damage.js';
import {arcLead,trackPilotTurn} from './bomber-turn-lead.js';
import {abortCityBomb,planCityBomb,releaseCityBomb} from './gotha-squadron-combat.js?v=natural-flight20261031&orbit=20261107&bomber=20261113';
import {BaseBoss,BossPart} from './headon-stageboss-core.js?v=tame3&ai=1018&sig=1019&boss=20261020b&phase=1021&harbor=20261021';
import {CITY_BOMBER_GUN_REACH,cityBomberScale,cityBomberFormation,cityBomberReentry,cityBomberTurn,glideCityBomber,moveCityBomberBay} from './city-bomber-flight.js';
import {O400_LAYOUT} from './o400-layout.js';
import {segmentDistance,sweptPolygon} from './alps-geometry117.js?v=tame3';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const severeWingPolygons=Object.fromEntries(Object.entries(O400_LAYOUT.severeWings).map(([side,outline])=>[
 side,outline.map(([x,y])=>({x:side==='left'?-x:x,y}))
]));
const inView=(q,bounds,margin=0)=>!bounds||(q.x>=bounds.left+margin&&q.x<=bounds.right-margin&&q.y>=bounds.top+margin&&q.y<=bounds.bottom-margin);
// A warned lane is only opened by a bomber that will still be on screen when it fires.
const staysInView=(b,bounds)=>inView({x:b.x+Math.cos(b.a)*b.speed*.9,y:b.y+Math.sin(b.a)*b.speed*.9},bounds,24);
function gunFor(body,p){
 const bearing=Math.atan2(p.y-body.y,p.x-body.x);
 const part=body.parts.get(Math.abs(wrap(bearing-body.a))<1.5?'front-gun':'rear-gun');
 return part.destroyed?null:part;
}
export const O400_TURN_RATE=.85;
// crossfire: active volleys allowed at once (was one for the whole squadron).
// tailReach: a chased bomber answers with its rear gun even off its pass.
export const O400_GUNNERY=Object.freeze({crossfire:2,tailReach:380});
export class O400Raider extends BaseBoss {
 constructor({tuning,slot=0,faction='entente',...options}){
  const hp=tuning.maxHp,defs=O400_LAYOUT.parts,scale=cityBomberScale(tuning);
  super({...options,maxHp:hp,coreRadius:23*scale,parts:defs.map(([id,x,y,radius,k])=>new BossPart({id,x,y,radius:radius*scale,maxHp:hp*k}))});
  Object.assign(this,{t:tuning,slot,faction,kind:'o400-raider',formationTotal:1,ownsMotion129:true,nativeBomberCombat:true,coreVulnerable:true,regionalScale:scale,a:Math.PI/2,speed:135,age:0,phase:'approach',bayOpen:0});
  this.mounts=defs.map(([id,x,y])=>({id,x,y}));this.gunWait=.7+(slot%3)*.7;this.rotateMounts();
 }
 command(type,spec={}){this.emit({...spec,type,bossId:this.id,faction:this.faction});}
 hazard(kind,spec){this.command('hazard',{kind,damage:this.t.damage,warning:0,duration:2,...spec});}
 suppressive(){}
 engines(){return ['engine-left','engine-right'].filter(id=>!this.parts.get(id).destroyed).length;}
 rotateMounts(){const a=this.a+Math.PI/2,c=Math.cos(a),s=Math.sin(a);for(const m of this.mounts){const p=this.parts.get(m.id);p.x=(m.x*c-m.y*s)*this.regionalScale;p.y=(m.x*s+m.y*c)*this.regionalScale;}}
 point(id,angle){const p=this.parts.get(id),reach=CITY_BOMBER_GUN_REACH*this.regionalScale;return{x:this.x+p.x+(Number.isFinite(angle)?Math.cos(angle)*reach:0),y:this.y+p.y+(Number.isFinite(angle)?Math.sin(angle)*reach:0)};}
 onPartDestroyed(p){
  const powerless=!this.engines();
  if(this.volley?.id===p.id||powerless)this.volley=null;
  if(p.id==='bomb-bay'||powerless){abortCityBomb(this);this.bayOpen=0;}
  if(powerless)this.phase='gliding';
  this.command('cancel-hazards',{tag:this.id+'-'+p.id,pendingOnly:true});
 }
 hit(a){const p=a.partId&&this.parts.get(a.partId),r=super.hit(p?.id==='bomb-bay'&&this.bayOpen>=.3?{...a,damage:a.damage*1.25}:a);if(!p)recordBomberWingHit(this,a.wingSide,r.damage);if(p&&r.damage){p.hitFlash=.16;if(!this.dead){const d=super.hit({damage:r.damage*.7});r.bodyDefeated=d.bodyDefeated;}}return r;}
 locateHit(a){
  if(this.dead)return null;
  const scale=this.regionalScale,x0=Number.isFinite(a.previousX)&&Number.isFinite(a.previousY)?a.previousX:a.x,y0=Number.isFinite(a.previousX)&&Number.isFinite(a.previousY)?a.previousY:a.y,r=Math.max(0,a.radius||0)/scale;
  // Use the existing swept geometry helper. No generic central collision disc:
  // the empty space between the main wings and tail must remain empty.
  const c=Math.cos(this.a+Math.PI/2),s=Math.sin(this.a+Math.PI/2),local=(x,y)=>({x:((x-this.x)*c+(y-this.y)*s)/scale,y:(-(x-this.x)*s+(y-this.y)*c)/scale}),from=local(x0,y0),to=local(a.x,a.y);
  if(Math.max(from.x,to.x)<-O400_LAYOUT.width/2-r||Math.min(from.x,to.x)>O400_LAYOUT.width/2+r||Math.max(from.y,to.y)<-O400_LAYOUT.height/2-r||Math.min(from.y,to.y)>O400_LAYOUT.height/2+r)return null;
  const steps=Math.max(1,Math.ceil(Math.hypot(a.x-x0,a.y-y0)/3));let localPrevious=from;
  // Walk in travel order, as before, but sweep each short interval so a fast
  // round cannot skip a thin tailplane or hit the far engine through a wing.
  for(let i=0;i<=steps;i++){
   const t=i/steps,localPoint={x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t};
   for(const m of this.mounts){const p=this.parts.get(m.id),f=O400_LAYOUT.partFootprints[m.id];
    if(p.hittable&&!p.destroyed&&segmentDistance(m.x/(f.rx+r),m.y/(f.ry+r),localPrevious.x/(f.rx+r),localPrevious.y/(f.ry+r),localPoint.x/(f.rx+r),localPoint.y/(f.ry+r))<=1)return{partId:p.id};
   }
   if(this.coreVulnerable&&O400_LAYOUT.hulls.some(p=>sweptPolygon(localPrevious,localPoint,r,p))){
    // The rear gun sits on the wing/fuselage join. Damage to this small
    // mounting surface belongs to the gun, not an opaque hull in front of it.
    // This runs ONLY after silhouette contact: no added hitbox in empty air.
    const rear=this.parts.get('rear-gun');
    if(!rear.destroyed&&Math.abs(localPoint.x)<=12+r&&localPoint.y>=-31-r&&localPoint.y<=3+r)return{partId:rear.id};
    const wingSide=bomberWingContact(this.kind,localPoint.x,localPoint.y,r);
    if(!wingSide||this.wingDamage?.[wingSide]?.stage!==2||sweptPolygon(localPrevious,localPoint,r,severeWingPolygons[wingSide]))return{partId:null,wingSide};
   }
   localPrevious=localPoint;
  }return null;
 }
 hitAt(a){const hit=this.locateHit(a);return hit?this.hit({...a,...hit}):{damage:0,miss:true};}
 update(dt,{players=[],bounds,londonTargets=[]}){
  if(this.dead||dt<=0)return;const p=players.find(p=>p.alive!==false);if(!p)return;this.age+=dt;tickBomberWings(this,dt);trackPilotTurn(this,p,dt);
  for(const part of this.parts.values()){part.gunFlash=Math.max(0,(part.gunFlash||0)-dt);part.hitFlash=Math.max(0,(part.hitFlash||0)-dt);}
  const engines=this.engines();
  if(!engines){
   this.speed=glideCityBomber(this,dt,this.speed);
   if(this.glideAge>=4.6)super.hit({damage:this.hp});
   return;
  }
  const time=this.encounter?.clock??this.age,live=[...this.encounter?.bodies.values()||[this]].filter(b=>b.kind===this.kind&&!b.dead);
  const beat=time%10,cycle=Math.floor(time/10),group=Math.floor(this.slot/3),groups=[...new Set(live.map(b=>Math.floor(b.slot/3)))];
  const activeGroup=groups[cycle%groups.length],active=group===activeGroup,flight=live.filter(b=>Math.floor(b.slot/3)===activeGroup);
  const rank=flight.indexOf(this),count=flight.length,multiple=groups.length>1,waiting=multiple&&!active;
  const wantedRadius=waiting?(group===groups[(cycle+1)%groups.length]&&beat>=4.8?250:335):multiple?220:135;
  this.orbitRadius??=wantedRadius;
  this.orbitRadius+=clamp(wantedRadius-this.orbitRadius,-65*dt,65*dt);
  const radius=this.orbitRadius,omega=multiple?.45:.65,angle=time*omega+group*Math.PI*2/3;
  const target=cityBomberFormation(this,p,angle,radius,omega,live);
  // Initial spawn only. Subsequent tracking changes heading and airspeed, never position.
  if(!this.started){this.started=true;this.x=target.x;this.y=target.y;this.a=angle+Math.PI/2;}
  let vx=target.vx+(target.x-this.x)*1.35,vy=target.vy+(target.y-this.y)*1.35;
  const separation=(multiple?255:135)*this.regionalScale,avoidance=multiple?5:1;
  for(const b of live){if(b===this)continue;const dx=this.x-b.x,dy=this.y-b.y,d=Math.hypot(dx,dy);if(d>1&&d<separation){vx+=dx/d*(separation-d)*avoidance;vy+=dy/d*(separation-d)*avoidance;}}
  const turn=O400_TURN_RATE*(engines===2?1:.75);
  // Outside the combat area, fly back toward the pilot before resuming the orbit.
  const dx=p.x-this.x,dy=p.y-this.y;
  const reachX=bounds?Math.max(90,(bounds.right-bounds.left)*.42):210;
  const reachY=bounds?Math.max(90,(bounds.bottom-bounds.top)*.42):210;
  const returning=multiple?cityBomberReentry(this,p,bounds,this.speed):Math.hypot(dx/reachX,dy/reachY)>(count===1?1:2);
  if(returning){
   const lead=multiple?1:1.8;
   vx=dx*1.65+(p.vx||0)*lead;
   vy=dy*1.65+(p.vy||0)*lead;
  }
  const heading=Math.atan2(vy,vx),headingError=Math.abs(wrap(heading-this.a));
  const speedLimit=engines===2?350:300;
  const cornerSpeed=engines?85:80;
  const aligned=clamp(1-headingError/1.15,0,1);
  const cruise=clamp(Math.hypot(vx,vy),engines?100:80,speedLimit);
  const goal=returning?clamp(Math.hypot(vx,vy),cornerSpeed,cornerSpeed+(speedLimit-cornerSpeed)*aligned):multiple?Math.max(cornerSpeed,Math.min(cruise,cruise*(1.2-headingError*.45))):cruise;
  const decel=returning?205:85;
  const anticipate=returning||multiple;
  this.a+=cityBomberTurn(this,dt,heading,turn,this.speed,anticipate?goal:this.speed,anticipate?105:0,anticipate?decel:0)*dt;
  this.speed+=clamp(goal-this.speed,-decel*dt,105*dt);
  this.x+=Math.cos(this.a)*this.speed*dt;this.y+=Math.sin(this.a)*this.speed*dt;this.rotateMounts();
  const visible=inView(this,bounds,12);
  const scheduled=flight[count===3?Math.floor(beat/2)%3:count===2?cycle%2:0];
  // Up to two gunners hold warned lanes at once, from different aircraft, so a
  // single sidestep no longer clears the whole pass.
  const firing=live.filter(b=>b.volley&&!b.volley.tail).length;
  const gunner=firing>=O400_GUNNERY.crossfire?null:[scheduled,...live].find(b=>b&&!b.volley&&b.gunWait<=0&&inView(b,bounds,12)&&staysInView(b,bounds)&&b.engines()&&gunFor(b,p));
  this.phase=beat<5.8?(count===1?'short-pass':count===2?'guard-swap':'sequential-cover'):beat<7.2?'parallel-bombing':'recovery';
  const allowed=visible&&this.age>1.2&&beat<5.8;
  const tail=!allowed&&visible&&this.age>1.2&&Math.hypot(p.x-this.x,p.y-this.y)<O400_GUNNERY.tailReach&&gunFor(this,p)?.id==='rear-gun'&&staysInView(this,bounds);
  this.gunWait-=dt;
  if(this.volley){const v=this.volley,part=this.parts.get(v.id);v.left-=dt;
   if(!(allowed||v.tail&&visible)||part.destroyed){this.volley=null;}
   else if(v.left<=0){this.volley=null;const q=this.point(v.id,v.angle);if(!inView(q,bounds))return;this.gunWait=v.tail?2.4:1.7;part.gunFlash=.18;this.command('muzzle',{...q,partId:v.id});
    for(const off of [-.09,0,.09])this.hazard('projectile',{...q,vx:Math.cos(v.angle+off)*v.speed,vy:Math.sin(v.angle+off)*v.speed,radius:4,damage:this.t.damage*.42,duration:1.6,visual:'gotha-mg',sourcePartId:v.id,sourceOffsetX:q.x-this.x-part.x,sourceOffsetY:q.y-this.y-part.y,tag:this.id+'-'+v.id,lockedAim:true,signatureAttack:true});
   }
  }else if(allowed&&beat<4.9&&gunner===this||tail&&this.gunWait<=0){const part=gunFor(this,p),id=part.id;
   const q=this.point(id),speed=Math.max(260,this.t.bulletSpeed*.8),fx=q.x+Math.cos(this.a)*this.speed*.9,fy=q.y+Math.sin(this.a)*this.speed*.9;
   let lead=.9;
   for(let i=0;i<3;i++){const q=arcLead(p,this.pilotTurn||0,lead);lead=.9+Math.min(1.35,Math.hypot(q.x-fx,q.y-fy)/speed);}
   const at=arcLead(p,this.pilotTurn||0,lead),aim=Math.atan2(at.y-fy,at.x-fx);
   part.aimAngle=aim;this.volley={id,angle:aim,left:.9,speed,tail:!(allowed&&gunner===this)};const muzzle=this.point(id,aim);this.command('charge-warning',{...muzzle,partId:id,targetX:muzzle.x+Math.cos(aim)*440,targetY:muzzle.y+Math.sin(aim)*440,lockedAngle:aim,followSource:true,muzzleReach:CITY_BOMBER_GUN_REACH*this.regionalScale,seconds:.9});
  }
  const canDrop=active&&visible&&!this.parts.get('bomb-bay').destroyed&&(count!==2||rank!==cycle%2);
  planCityBomb(this,londonTargets,time,active,10,5.8);
  moveCityBomberBay(this,dt,canDrop&&beat>=1.91&&beat<2.55||(canDrop||!!this.runTarget)&&beat>=5.12&&beat<5.8);
  if(this.runTarget&&beat>=5.8){this.bayOpen=1;releaseCityBomb(this,this.point('bomb-bay'));}
  const early=beat>=2.55&&beat<3.05,main=beat>=5.8&&beat<7.2;
  const field=early?'earlyBombCycle':'bombCycle';
  if(canDrop&&(early||main)&&this[field]!==cycle){
   this[field]=cycle;this.bayOpen=1;
   const q=this.point('bomb-bay'),turn=this.pilotTurn||0,side=count===3?rank-1:rank%2?1:-1;
   // The wingmen leave a lane. The centre bomber threatens its far end with
   // a longer tell, giving the player time to turn out of the line.
   const warning=side===0?1.8:1.1,at=arcLead(p,turn,warning),lateral=side*100;
   const a=Math.hypot(p.vx||0,p.vy||0)>1?Math.atan2(p.vy,p.vx)+turn*warning:Math.PI/2;
   const bombs=engines*(early||side===0?1:2);
   for(let i=0;i<bombs;i++){const along=i*86;this.hazard('circle',{x:at.x-Math.sin(a)*lateral+Math.cos(a)*along,y:at.y+Math.cos(a)*lateral+Math.sin(a)*along,radius:43,warning:warning+i*.14,duration:.25,once:true,visual:'carpet-bomb',airborneBomb:true,sourceX:q.x,sourceY:q.y,sourcePartId:'bomb-bay',tag:this.id+'-bomb-bay',lockedAim:true});}
  }
 }
}


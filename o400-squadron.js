import {BaseBoss,BossPart} from './headon-stageboss-core.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
export const O400_TURN_RATE=.85;
export class O400Raider extends BaseBoss {
 constructor({tuning,slot=0,faction='entente',...options}){
  const hp=tuning.maxHp,defs=[['engine-left',-23,-5,12,.24],['engine-right',23,-5,12,.24],['front-gun',0,-47,9,.13],['rear-gun',0,-10.4,9,.13],['bomb-bay',0,10,10,.22]];
  super({...options,maxHp:hp,coreRadius:23,parts:defs.map(([id,x,y,radius,k])=>new BossPart({id,x,y,radius,maxHp:hp*k}))});
  Object.assign(this,{t:tuning,slot,faction,kind:'o400-raider',formationTotal:1,ownsMotion129:true,nativeBomberCombat:true,coreVulnerable:true,a:Math.PI/2,speed:135,age:0,phase:'approach',bayOpen:0});
  this.mounts=defs.map(([id,x,y])=>({id,x,y}));this.gunWait=.7+slot*.7;
 }
 command(type,spec={}){this.emit({...spec,type,bossId:this.id,faction:this.faction});}
 hazard(kind,spec){this.command('hazard',{kind,damage:this.t.damage,warning:0,duration:2,...spec});}
 suppressive(){}
 engines(){return ['engine-left','engine-right'].filter(id=>!this.parts.get(id).destroyed).length;}
 rotateMounts(){const a=this.a+Math.PI/2,c=Math.cos(a),s=Math.sin(a);for(const m of this.mounts){const p=this.parts.get(m.id);p.x=m.x*c-m.y*s;p.y=m.x*s+m.y*c;}}
 point(id,angle){const p=this.parts.get(id);return{x:this.x+p.x+(Number.isFinite(angle)?Math.cos(angle)*5:0),y:this.y+p.y+(Number.isFinite(angle)?Math.sin(angle)*5:0)};}
 onPartDestroyed(p){this.volley=null;this.command('cancel-hazards',{tag:this.id+'-'+p.id,pendingOnly:true});}
 hit(a){const p=a.partId&&this.parts.get(a.partId),r=super.hit(a);if(p&&r.damage&&!this.dead){const d=super.hit({damage:r.damage*.7});r.bodyDefeated=d.bodyDefeated;}return r;}
 locateHit(a){const n=Number.isFinite(a.previousX)?Math.min(64,Math.max(1,Math.ceil(Math.hypot(a.x-a.previousX,a.y-a.previousY)/Math.max(3,a.radius||3)))):1;
  for(let i=0;i<=n;i++){const x=n===1&&!Number.isFinite(a.previousX)?a.x:a.previousX+(a.x-a.previousX)*i/n,y=n===1&&!Number.isFinite(a.previousY)?a.y:a.previousY+(a.y-a.previousY)*i/n,r=a.radius||0,h=super.locateHit({x,y,radius:r});if(h)return h;
   const c=Math.cos(this.a+Math.PI/2),s=Math.sin(this.a+Math.PI/2),dx=x-this.x,dy=y-this.y,lx=dx*c+dy*s,ly=-dx*s+dy*c;
   if((lx/(89+r))**2+((ly+6)/(12+r))**2<=1||(lx/(13+r))**2+(ly/(55+r))**2<=1)return{partId:null};
  }return null;
 }
 update(dt,{players=[],bounds}){
  if(this.dead||dt<=0)return;const p=players.find(p=>p.alive!==false);if(!p)return;this.age+=dt;
  const time=this.encounter?.clock??this.age,live=[...this.encounter?.bodies.values()||[this]].filter(b=>b.kind===this.kind&&!b.dead),rank=live.indexOf(this),count=live.length;
  const radius=135,angle=time*.65+this.slot*Math.PI*2/3;
  // Initial spawn only. Subsequent tracking changes heading and airspeed, never position.
  if(!this.started){this.started=true;this.x=p.x+Math.cos(angle)*radius;this.y=p.y+Math.sin(angle)*radius;this.a=angle+Math.PI/2;}
  let vx=(p.vx||0)-Math.sin(angle)*radius*.65+(p.x+Math.cos(angle)*radius-this.x)*1.35,vy=(p.vy||0)+Math.cos(angle)*radius*.65+(p.y+Math.sin(angle)*radius-this.y)*1.35;
  for(const b of live){if(b===this)continue;const dx=this.x-b.x,dy=this.y-b.y,d=Math.hypot(dx,dy);if(d>1&&d<135){vx+=dx/d*(135-d);vy+=dy/d*(135-d);}}
  const engines=this.engines(),turn=O400_TURN_RATE*(engines?1:.75);this.a+=clamp(wrap(Math.atan2(vy,vx)-this.a),-turn*dt,turn*dt);
  const goal=clamp(Math.hypot(vx,vy),engines?100:80,engines===2?350:300);this.speed+=clamp(goal-this.speed,-85*dt,105*dt);
  this.x+=Math.cos(this.a)*this.speed*dt;this.y+=Math.sin(this.a)*this.speed*dt;this.rotateMounts();
  for(const part of this.parts.values())part.gunFlash=Math.max(0,(part.gunFlash||0)-dt);
  if(!engines){this.phase='gliding';this.glideAge=(this.glideAge||0)+dt;if(this.glideAge>4.6)super.hit({damage:this.hp});return;}
  const visible=!bounds||(this.x>bounds.left+12&&this.x<bounds.right-12&&this.y>bounds.top+12&&this.y<bounds.bottom-12),beat=time%10,cycle=Math.floor(time/10);
  const gunner=count===3?rank===Math.floor(beat/2)%3:count===2?rank===cycle%2:true;
  this.phase=beat<5.8?(count===1?'short-pass':count===2?'guard-swap':'sequential-cover'):beat<7.2?'parallel-bombing':'recovery';
  const allowed=visible&&this.age>1.2&&beat<5.8&&gunner;
  this.gunWait-=dt;
  if(this.volley){const v=this.volley,part=this.parts.get(v.id);v.left-=dt;
   if(!allowed||part.destroyed){this.volley=null;}
   else if(v.left<=0){this.volley=null;this.gunWait=1.7;const q=this.point(v.id,v.angle);part.gunFlash=.18;this.command('muzzle',{...q,partId:v.id});
    for(const off of [-.09,0,.09])this.hazard('projectile',{...q,vx:Math.cos(v.angle+off)*v.speed,vy:Math.sin(v.angle+off)*v.speed,radius:4,damage:this.t.damage*.42,duration:1.6,visual:'gotha-mg',sourcePartId:v.id,sourceOffsetX:Math.cos(v.angle)*5,sourceOffsetY:Math.sin(v.angle)*5,tag:this.id+'-'+v.id,lockedAim:true,signatureAttack:true});
   }
  }else if(allowed&&this.gunWait<=0){const bearing=Math.atan2(p.y-this.y,p.x-this.x),rel=Math.abs(wrap(bearing-this.a)),id=rel<1.5?'front-gun':'rear-gun',part=this.parts.get(id);
   if(!part.destroyed){const q=this.point(id),speed=Math.max(260,this.t.bulletSpeed*.8),aim=Math.atan2(p.y+(p.vy||0)*1.1-q.y-Math.sin(this.a)*this.speed*.9,p.x+(p.vx||0)*1.1-q.x-Math.cos(this.a)*this.speed*.9);part.aimAngle=aim;this.volley={id,angle:aim,left:.9,speed};this.command('charge-warning',{...q,partId:id,targetX:q.x+Math.cos(aim)*440,targetY:q.y+Math.sin(aim)*440,lockedAngle:aim,followSource:true,seconds:.9});}
  }
  this.bayOpen=Math.max(0,this.bayOpen-dt*1.5);
  if(visible&&beat>=5.8&&beat<7.2&&this.bombCycle!==cycle&&!this.parts.get('bomb-bay').destroyed&&(count!==2||rank!==cycle%2)){
   this.bombCycle=cycle;this.bayOpen=1;const q=this.point('bomb-bay'),a=Math.hypot(p.vx||0,p.vy||0)>1?Math.atan2(p.vy,p.vx):Math.PI/2,side=count===3?rank-1:rank%2?1:-1;
   // The central aircraft covers; wingmen leave a real 100px-wide escape lane.
   if(count===3&&side===0)return;
   for(let i=0;i<(engines===2?2:1);i++){const lateral=(side||1)*100,along=i*74;this.hazard('circle',{x:p.x+(p.vx||0)*1.1-Math.sin(a)*lateral+Math.cos(a)*along,y:p.y+(p.vy||0)*1.1+Math.cos(a)*lateral+Math.sin(a)*along,radius:43,warning:1.1+i*.25,duration:.25,once:true,visual:'carpet-bomb',airborneBomb:true,sourceX:q.x,sourceY:q.y,sourcePartId:'bomb-bay',tag:this.id+'-bomb-bay',lockedAim:true});}
  }
 }
}

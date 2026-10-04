import {BaseBoss,BossPart} from './headon-stageboss-core.js?v=styles537';
import {segmentDistance} from './alps-geometry117.js?v=styles537';
export const GALLIPOLI_PARTS=Object.freeze([
 {id:'left',x:-236,y:20,r:70,fraction:.2,row:1,size:166},
 {id:'right',x:236,y:20,r:70,fraction:.2,row:1,size:166},
 {id:'observer',x:0,y:-146,r:32,fraction:.10,row:2,size:90},
 {id:'ammo-left',x:-140,y:110,r:37,fraction:.10,row:3,size:100},
 {id:'ammo-right',x:140,y:110,r:37,fraction:.10,row:3,size:100},
 {id:'bunker',x:-98,y:-100,r:43,fraction:.15,row:3,size:112}
]);
export const gallipoliMuzzle=(b,p)=>({x:b.x+p.x+Math.cos(p.angle)*p.size*.60,y:b.y+p.y+Math.sin(p.angle)*p.size*.60});
export class GallipoliFortress extends BaseBoss{
 constructor(o){const t=o.tuning;super({...o,maxHp:t.maxHp,coreRadius:76,parts:GALLIPOLI_PARTS.map(p=>new BossPart({id:p.id,x:p.x,y:p.y,radius:p.r,maxHp:t.maxHp*p.fraction,angle:Math.PI/2}))});Object.assign(this,{t,kind:'gallipoli-fortress',faction:o.faction,gallipoliBoss:true,ownsMotion129:true,clock:0,entryAge:0,coreVulnerable:false,phase:'coastal-defense',cursor:0,phaseAge:0,centralRemaining:0,centralReady:false,coreAngle:Math.PI/2});for(const d of GALLIPOLI_PARTS)Object.assign(this.parts.get(d.id),d,{angle:Math.PI/2,recoil:0});}
 command(type,spec={}){this.emit({...spec,type,bossId:this.id,faction:this.faction});}
 hazard(spec){this.command('hazard',{kind:'circle',damage:this.t.damage,warning:1.5,duration:.45,once:true,visual:'gallipoli-shell',...spec});}
 locateHit(s){if(this.entryAge<5)return null;for(const p of this.parts.values())if(!p.destroyed&&segmentDistance(0,0,(s.previousX??s.x)-this.x-p.x,(s.previousY??s.y)-this.y-p.y,s.x-this.x-p.x,s.y-this.y-p.y)<=p.radius+(s.radius||0))return{partId:p.id};return this.coreVulnerable&&segmentDistance(0,0,(s.previousX??s.x)-this.x,(s.previousY??s.y)-this.y,s.x-this.x,s.y-this.y)<=76+(s.radius||0)?{partId:null}:null;}
 hit(a){if(this.entryAge<5)return{damage:0,blocked:true};if(!a.partId){if(!this.coreVulnerable)return{damage:0,blocked:true};if(this.phase!=='central-fortress')a={...a,damage:Math.min(a.damage,Math.max(0,this.hp-this.maxHp*.55))};}return super.hit(a);}
 hitAt(s){const h=this.locateHit(s);return h?this.hit({...h,damage:s.damage}):{damage:0,miss:true};}
 onPartDestroyed(p){this.command('cancel-hazards',{tag:this.id+':'+p.id});if(p.id.startsWith('ammo-')){const gun=this.parts.get(p.id.endsWith('left')?'left':'right');if(!gun.destroyed)this.hit({partId:gun.id,damage:gun.maxHp*.35});}this.command('camera-shake',{strength:4});}
 target(ps){const live=ps.filter(p=>p.alive);return live[this.cursor++%Math.max(1,live.length)];}
 aim(p,t){p.angle=Math.atan2(t.y-this.y-p.y,t.x-this.x-p.x);p.recoil=.25;this.command('muzzle',{...gallipoliMuzzle(this,p),partId:p.id});}
 update(dt,{players}){this.clock+=dt;this.entryAge=Math.min(5,this.entryAge+dt);if(this.entryAge<5)return;this.phaseAge+=dt;for(const p of this.parts.values())p.recoil=Math.max(0,p.recoil-dt);const gone=id=>this.parts.get(id).destroyed;
 if(this.phase==='coastal-defense'&&(gone('left')||gone('right')||gone('observer')||gone('ammo-left')||gone('ammo-right'))){this.phase='defense-collapse';this.phaseAge=0;this.coreVulnerable=true;this.command('phase-change',{phase:this.phase});}
 if(this.phase==='defense-collapse'&&this.phaseAge>=3&&((gone('left')&&gone('right'))||this.hp<=this.maxHp*.55)){this.phase='central-fortress';this.phaseAge=0;this.coreVulnerable=true;this.command('phase-change',{phase:this.phase});}
 this.centralRemaining=Math.max(0,this.centralRemaining-dt);
 if(this.phase==='central-fortress'&&this.due('central',dt,5.6))this.centralReady=true;
 const target=this.target(players);if(!target)return;const observed=!gone('observer'),hasCoastal=!gone('left')||!gone('right');
 if(hasCoastal&&this.centralRemaining<=0&&!this.centralReady&&this.due('coastal',dt,this.phase==='central-fortress'?5.4:4.6)){for(const side of [-1,1]){const p=this.parts.get(side<0?'left':'right');if(p.destroyed)continue;const ammoGone=gone('ammo-'+p.id),tx=target.x+side*125+(observed?0:side*55),ty=target.y+55;this.aim(p,{x:tx,y:ty});const count=ammoGone?1:2;for(let i=0;i<count;i++)this.hazard({x:tx,y:ty+i*105,radius:43,delay:(side<0?0:.35)+i*.28,warning:observed?1.5:2,tag:this.id+':'+p.id});}this.lane={x:target.x,y:target.y,width:110,remaining:3.7};}
 if(this.lane)this.lane.remaining=Math.max(0,this.lane.remaining-dt);
 if(this.centralReady&&!this.lane?.remaining&&this.centralRemaining<=0){this.centralReady=false;this.centralRemaining=2.6;this.coreAngle=Math.atan2(target.y-this.y,target.x-this.x);const m={x:this.x+Math.cos(this.coreAngle)*136,y:this.y+Math.sin(this.coreAngle)*136};this.command('muzzle',m);this.hazard({x:target.x,y:target.y,radius:80,warning:2,tag:this.id+':central'});}
 if(!gone('bunker')&&!this.lane?.remaining&&this.centralRemaining<=0&&this.due('bunker',dt,4.2)){this.hazard({x:target.x+170,y:target.y,radius:25,warning:1.8,damage:this.t.damage*.5,tag:this.id+':bunker'});}
 }
}

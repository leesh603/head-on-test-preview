import {BaseBoss,BossPart} from './headon-stageboss-core.js?v=477';
import {segmentDistance} from './alps-geometry117.js?v=477';
export const GALLIPOLI_EXTENTS=Object.freeze({halfWidth:1640,halfHeight:1300});
export const GALLIPOLI_SECTORS=Object.freeze([
 {id:'west',name:'서부 해안포 진지',x:-940,y:160,guards:['left','west-howitzer','aa-west']},
 {id:'east',name:'동부 해안포 진지',x:940,y:160,guards:['right','east-howitzer','aa-east']},
 {id:'citadel',name:'후방 중포 성채',x:0,y:-620,guards:['rear-left','rear-right','aa-citadel']}
].map(s=>Object.freeze({...s,guards:Object.freeze(s.guards)})));
const gun=(id,sector,x,y,art)=>({id,sector,x,y,art,r:92,fraction:.085,size:310,muzzle:208,kind:'gun'});
export const GALLIPOLI_PARTS=Object.freeze([
 gun('left','west',-1290,160,'twin'),gun('west-howitzer','west',-640,160,'howitzer'),
 gun('right','east',600,160,'twin'),gun('east-howitzer','east',1240,160,'howitzer'),
 gun('rear-left','citadel',-300,-710,'twin'),gun('rear-right','citadel',300,-710,'howitzer'),
 ...GALLIPOLI_SECTORS.map(s=>({id:'aa-'+s.id,sector:s.id,x:s.x-30,y:s.id==='citadel'?s.y+220:s.y,art:'aa',r:58,fraction:.04,size:200,muzzle:115,kind:'aa'})),
 ...GALLIPOLI_SECTORS.map(s=>({id:'ammo-'+s.id,sector:s.id,x:s.x,y:s.y-205,art:'ammo',r:68,fraction:.03,size:230,muzzle:0,kind:'supply'})),
 {id:'observer',sector:null,x:0,y:660,art:'signal',r:70,fraction:.03,size:230,muzzle:0,kind:'observer'}
].map(p=>Object.freeze(p)));
export const gallipoliMuzzle=(b,p)=>({x:b.x+p.x+Math.cos(p.angle)*(p.muzzle||0),y:b.y+p.y+Math.sin(p.angle)*(p.muzzle||0)});
export function gallipoliObjective(b,x,y){
 const available=[...b.parts.values()].filter(p=>!p.destroyed&&(p.kind==='gun'||p.kind==='aa'));
 return available.sort((a,c)=>Math.hypot(b.x+a.x-x,b.y+a.y-y)-Math.hypot(b.x+c.x-x,b.y+c.y-y))[0]||{x:0,y:0,kind:'command'};
}
export class GallipoliFortress extends BaseBoss{
 constructor(o){const t=o.tuning;super({...o,maxHp:t.maxHp,coreRadius:115,parts:GALLIPOLI_PARTS.map(p=>new BossPart({id:p.id,x:p.x,y:p.y,radius:p.r,maxHp:t.maxHp*p.fraction,angle:Math.PI/2}))});Object.assign(this,{t,kind:'gallipoli-fortress',faction:o.faction,gallipoliBoss:true,ownsMotion129:true,clock:0,entryAge:0,coreVulnerable:false,phase:'coastal-defense',cursor:0,batteryCursor:0,captured:new Set(),phaseAge:0,centralRemaining:0,coreAngle:Math.PI/2});for(const d of GALLIPOLI_PARTS)Object.assign(this.parts.get(d.id),d,{angle:Math.PI/2,recoil:0});}
 command(type,spec={}){this.emit({...spec,type,bossId:this.id,faction:this.faction});}
 hazard(spec){this.command('hazard',{kind:'circle',damage:this.t.damage,warning:1.8,duration:.45,once:true,visual:'gallipoli-shell',...spec});}
 locateHit(s){if(this.entryAge<5)return null;for(const p of this.parts.values())if(!p.destroyed&&segmentDistance(0,0,(s.previousX??s.x)-this.x-p.x,(s.previousY??s.y)-this.y-p.y,s.x-this.x-p.x,s.y-this.y-p.y)<=p.radius+(s.radius||0))return{partId:p.id};return this.coreVulnerable&&segmentDistance(0,0,(s.previousX??s.x)-this.x,(s.previousY??s.y)-this.y,s.x-this.x,s.y-this.y)<=this.coreRadius+(s.radius||0)?{partId:null}:null;}
 hit(a){if(!Number.isFinite(a.damage)||a.damage<0)throw new Error('Invalid damage');if(this.entryAge<5||this.dead)return{damage:0,blocked:true};if(!a.partId)return this.coreVulnerable?super.hit(a):{damage:0,blocked:true};
 // Destructible defenses own 75% of the ONE boss HP budget. Count their
 // actual damage once, including supply explosions, without killing a shielded core.
 const p=this.parts.get(a.partId);if(!p)return{damage:0,blocked:true};const expected=Math.min(p.hp,p.hittable?a.damage:0);this.hp=Math.max(this.maxHp*.25,this.hp-expected);return super.hit(a);}
 hitAt(s){const h=this.locateHit(s);return h?this.hit({...h,damage:s.damage}):{damage:0,miss:true};}
 onPartDestroyed(p){this.command('cancel-hazards',{tag:this.id+':'+p.id});
 if(p.kind==='supply')for(const q of this.parts.values())if(q.sector===p.sector&&q.kind==='gun'&&!q.destroyed)this.hit({partId:q.id,damage:q.maxHp*.35});
 this.command('camera-shake',{strength:p.kind==='gun'?5:3});}
 captureSectors(){for(const s of GALLIPOLI_SECTORS)if(!this.captured.has(s.id)&&s.guards.every(id=>this.parts.get(id).destroyed)){
 this.captured.add(s.id);const ammo=this.parts.get('ammo-'+s.id);if(!ammo.destroyed)this.hit({partId:ammo.id,damage:ammo.hp});this.command('phase-change',{phase:'sector-'+s.id+'-captured'});}
 const next=this.captured.size===3?'central-fortress':this.captured.has('west')&&this.captured.has('east')?'defense-collapse':'coastal-defense';
 if(this.phase!==next){this.phase=next;this.phaseAge=0;this.command('phase-change',{phase:next});}
 if(this.captured.size===3){this.coreVulnerable=true;const observer=this.parts.get('observer');if(!observer.destroyed)this.hit({partId:observer.id,damage:observer.hp});}}
 target(ps){const live=ps.filter(p=>p.alive);return live.length?live[this.cursor++%live.length]:null;}
 aim(p,t){p.angle=Math.atan2(t.y-this.y-p.y,t.x-this.x-p.x);p.recoil=.28;this.command('muzzle',{...gallipoliMuzzle(this,p),partId:p.id});}
 update(dt,{players}){this.clock+=dt;this.entryAge=Math.min(5,this.entryAge+dt);if(this.entryAge<5)return;this.phaseAge+=dt;for(const p of this.parts.values())p.recoil=Math.max(0,p.recoil-dt);this.captureSectors();
 if(this.lane)this.lane.remaining=Math.max(0,this.lane.remaining-dt);this.centralRemaining=Math.max(0,this.centralRemaining-dt);
 // One salvo window at a time even on high loops. Fixed impact positions,
 // at most two gun sources per salvo, and a 160-unit clear escape corridor.
 if(this.lane?.remaining||this.centralRemaining)return;
 if(this.coreVulnerable){if(!this.due('central',dt,5.6))return;const target=this.target(players);if(!target)return;this.coreAngle=Math.atan2(target.y-this.y,target.x-this.x);this.command('muzzle',{x:this.x+Math.cos(this.coreAngle)*325,y:this.y+Math.sin(this.coreAngle)*325});this.hazard({x:target.x,y:target.y,radius:100,warning:2.2,tag:this.id+':central'});this.centralRemaining=3;return;}
 if(!this.due('coastal',dt,4.4))return;const target=this.target(players);if(!target)return;
 const guns=[...this.parts.values()].filter(p=>p.kind==='gun'&&!p.destroyed).sort((a,b)=>Math.hypot(this.x+a.x-target.x,this.y+a.y-target.y)-Math.hypot(this.x+b.x-target.x,this.y+b.y-target.y));
 const observed=!this.parts.get('observer').destroyed;this.lane={x:target.x,y:target.y,width:160,remaining:3.7};
 for(let i=0;i<Math.min(2,guns.length);i++){const p=guns[(this.batteryCursor+i)%guns.length],side=i===0?-1:1,tx=target.x+side*170,ty=target.y+40;this.aim(p,{x:tx,y:ty});const ammoGone=this.parts.get('ammo-'+p.sector).destroyed;for(let j=0;j<(ammoGone?1:2);j++)this.hazard({x:tx,y:ty+j*130,radius:p.art==='twin'?60:52,delay:i*.3+j*.32,warning:observed?1.8:2.3,tag:this.id+':'+p.id});}this.batteryCursor++;
 const aa=[...this.parts.values()].filter(p=>p.kind==='aa'&&!p.destroyed).sort((a,b)=>Math.hypot(this.x+a.x-target.x,this.y+a.y-target.y)-Math.hypot(this.x+b.x-target.x,this.y+b.y-target.y))[0];
 if(aa){const aim={x:target.x+270,y:target.y-170};this.aim(aa,aim);this.hazard({...aim,radius:34,warning:2,delay:.2,damage:this.t.damage*.55,tag:this.id+':'+aa.id});}
 }
}

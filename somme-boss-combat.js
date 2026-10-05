import {driveLandship} from './somme-landship-drive.js?v=477';
import {BaseBoss,BossPart} from './headon-stageboss-core.js?v=477';
import {intersectsEllipse} from './regional-boss-layout352.js?v=477';
import {SCHWABEN_PARTS,MARK1_PARTS,sommeScale,sommePoint,syncSommeParts,sommeMuzzle,sponsonAim,clamp,turn,angleDelta} from './somme-boss-layout.js?v=477';

class SommeBoss extends BaseBoss{
 constructor(o,layout,kind,tank=false){
  const scale=o.tuning.sommeScale||sommeScale(o.tuning,tank);
  super({...o,maxHp:o.tuning.maxHp,parts:layout.map(p=>new BossPart({id:p.id,maxHp:o.tuning.maxHp*p.fraction,radius:Math.max(p.rx,p.ry)*scale,kind:'somme-part'}))});
  this.t=o.tuning;this.faction=o.faction;this.kind=kind;this.sommeBoss=true;this.ownsMotion129=true;this.sommeScale=scale;this.regionalScale=scale;this.clock=0;this.cursor=o.slot||0;this.hullYaw=0;
  for(const d of layout){const p=this.parts.get(d.id);Object.assign(p,{localX:d.x,localY:d.y,hitLocalX:d.hitX??d.x,hitRadiusX:d.rx*scale,hitRadiusY:d.ry*scale,drawWidth:d.w*scale,drawHeight:d.h*scale,art:d.art,muzzleLength:d.muzzle*scale,angle:-Math.PI/2,recoil:0});}
  syncSommeParts(this);
 }
 command(type,spec={}){this.emit({...spec,type,bossId:this.id,faction:this.faction});}
 hazard(kind,spec){this.command('hazard',{kind,damage:this.t.damage,duration:kind==='projectile'?4:.48,warning:0,...spec});}
 suppressive(){}
 target(players){const live=players.filter(p=>p.alive);return live.length?live[this.cursor++%live.length]:null;}
 tag(id){return this.id+':'+id;}
 cancel(id){this.command('cancel-hazards',{tag:this.tag(id)});}
 tickParts(dt){this.clock+=dt;for(const p of this.parts.values()){p.recoil=Math.max(0,p.recoil-dt);p.hitFlash=Math.max(0,(p.hitFlash||0)-dt);}}
 locateHit(s){
  if(this.dead)return null;
  for(const p of this.parts.values()){if(p.destroyed||!p.hittable)continue;const q=sommePoint(this,p.hitLocalX,p.localY);if(intersectsEllipse(s,q.x,q.y,p.hitRadiusX,p.hitRadiusY,p.hitAngle))return{partId:p.id};}
  const q=sommePoint(this,0,this.kind==='morser-battery'?48:-15),scale=this.sommeScale;
  return this.coreVulnerable&&intersectsEllipse(s,q.x,q.y,(this.kind==='morser-battery'?58:35)*scale,(this.kind==='morser-battery'?56:78)*scale,this.hullYaw)?{partId:null}:null;
 }
 hitAt(s){const route=this.locateHit(s);return route?this.hit({...route,damage:s.damage}):{damage:0,miss:true};}
 bodyDamage(damage){const dealt=Math.min(this.hp,damage);this.hp-=dealt;if(this.hp<=0&&!this.dead){this.dead=true;this.phase='defeated';this.onDeath();this.command('body-defeated');}return dealt;}
 hit(a){
  if(!Number.isFinite(a.damage)||a.damage<0)throw new Error('Invalid damage');
  if(this.dead)return{damage:0,blocked:true};
  if(a.partId){const p=this.parts.get(a.partId);if(!p||p.destroyed||!p.hittable)return{damage:0,blocked:true};
   const damage=p.hit(a.damage);p.hitFlash=.12;const bodyDamage=this.bodyDamage(damage*.8);
   if(p.destroyed){p.destroyedAt=this.motionTime||0;this.command('part-destroyed',{partId:p.id});this.onPartDestroyed(p);}
   return{damage,bodyDamage,partId:p.id,partDestroyed:p.destroyed,bodyDefeated:this.dead};}
  if(!this.coreVulnerable)return{damage:0,blocked:true};
  const damage=this.bodyDamage(a.damage*this.hullArmor());return{damage,bodyDefeated:this.dead};
 }
 hullArmor(){return 1;}
 onDeath(){for(const p of this.parts.values()){this.cancel(p.id);p.hp=0;}this.cancel('barrage');this.salvo=null;this.lock=null;}
 fireMG(p,dt,players,interval,visual='somme-mg'){
  if(p.destroyed)return;p.targetCursor??=this.cursor;const live=players.filter(q=>q.alive),target=live[p.targetCursor%live.length];if(!target)return;
  const aim=Math.atan2(target.y-this.y-p.y,target.x-this.x-p.x);const traverse=this.kind==='mark4-wedge'?sponsonAim(this,p,target.x,target.y):{angle:aim,reachable:true};p.angle=turn(p.angle,traverse.angle,1.2*dt);if(!traverse.reachable)return;
  if(!this.due(p.id,dt,interval)||Math.abs(angleDelta(aim,p.angle))>.25)return;
  const m=sommeMuzzle(this,p),count=Math.min(5,Math.max(2,Math.ceil(3*(this.t.projectileDensity||1))));
  for(let i=0;i<count;i++){const a=p.angle+(i-(count-1)/2)*.085;this.hazard('projectile',{...m,vx:Math.cos(a)*this.t.bulletSpeed*.85,vy:Math.sin(a)*this.t.bulletSpeed*.85,radius:3.5,damage:this.t.damage*.5,visual,tag:this.tag(p.id)});}
  p.recoil=.18;this.command('muzzle',{...m,partId:p.id});p.targetCursor++;
 }
}

// Stable encounter ID is retained for saves/test lab; the boss is now Schwaben.
export class SchwabenFortress extends SommeBoss{
 constructor(o){super(o,SCHWABEN_PARTS,'morser-battery');this.coreVulnerable=false;this.phase='observation';this.lockProgress=0;this.wave=0;this.timers.set('barrage',3.8);this.timers.set('twin-aa',2.6);this.timers.set('mg-left',2.1);this.timers.set('mg-right',3.4);}
 liveHeavy(){return ['gun-left','gun-right','twin-aa'].filter(id=>!this.parts.get(id).destroyed);}
 reloadInterval(){return(this.parts.get('ammo').destroyed?10.8:6.7);}
 onPartDestroyed(p){
  this.cancel(p.id);
  if(p.id==='gun-left'||p.id==='gun-right'){this.cancel('barrage');this.salvo=null;if(this.lock){this.lock.guns=this.lock.guns.filter(id=>id!==p.id);if(!this.lock.guns.length)this.lock=null;}}
  if(p.id==='observer'){this.lock=null;this.lockProgress=0;this.salvo=null;this.cancel('barrage');this.timers.set('barrage',2.4);}
  if(p.id==='ammo'){this.salvo=null;this.cancel('barrage');this.timers.set('barrage',this.reloadInterval());this.bodyDamage(this.maxHp*.08);const m=sommePoint(this,p.localX,p.localY);this.command('internal-explosion',{...m});}
  if(this.liveHeavy().length<=1||(this.parts.get('observer').destroyed&&this.parts.get('ammo').destroyed))this.coreVulnerable=true;
  this.phase=this.coreVulnerable?'core-exposed':this.parts.get('observer').destroyed?'blind-barrage':this.parts.get('ammo').destroyed?'ammo-starved':'battery-weakened';this.command('phase-change',{phase:this.phase});
 }
 planBarrage(players,bounds){
  const guns=['gun-left','gun-right'].filter(id=>!this.parts.get(id).destroyed);if(!guns.length)return;
  const observer=!this.parts.get('observer').destroyed,p=this.target(players);if(!p)return;
  const w=bounds.right-bounds.left,h=bounds.bottom-bounds.top,scale=this.sommeScale;
  const radius=clamp(48*scale,25,48),gap=Math.max(84,Math.min(135,w*.26));
  // Observer captures coordinates before the warning. Blind fire never reads
  // player coordinates. The marked corridor remains clear for the whole salvo.
  const targetX=clamp(p.x+(p.vx||0)*.35,bounds.left+radius,bounds.right-radius);
  const gate=observer?clamp(targetX+(this.wave%2?1:-1)*gap*1.3,bounds.left+gap/2+radius,bounds.right-gap/2-radius):bounds.left+w*[.3,.7,.5][this.wave%3];
  const y=observer?clamp(p.y+(p.vy||0)*.35,bounds.top+radius+20,bounds.bottom-radius-20):bounds.top+h*[.55,.72,.4][this.wave%3];
  this.lock={x:observer?targetX:gate,gate,y,remaining:observer?1.15:.85,mode:observer?'tracked':'blind',pattern:this.wave%2?'creeping':'curtain',guns};this.lockProgress=0;this.lane={x:gate,y,width:gap,remaining:observer?3.8:4.6};this.wave++;
  this.lane.depth=this.lock.pattern==='creeping'?136*scale:0;this.pendingBounds={...bounds};
 }
 launchBarrage(){
  const q=this.lock;if(!q)return;const bounds=this.pendingBounds,r=clamp(48*this.sommeScale,25,48),gap=this.lane.width,starved=this.parts.get('ammo').destroyed;
  const points=[];for(let x=bounds.left+r+12;x<=bounds.right-r-12;x+=r*2+22)if(Math.abs(x-q.gate)>=gap/2+r)points.push({x,y:q.y});
  // Narrow viewports still get one shell on each reachable side of the gate.
  if(!points.length)for(const side of [-1,1]){const x=q.gate+side*(gap/2+r+8);if(x-r>=bounds.left&&x+r<=bounds.right)points.push({x,y:q.y});}
  for(const [i,point]of points.slice(0,starved?2:5).entries()){const id=q.guns[i%q.guns.length],p=this.parts.get(id);if(p.destroyed)continue;const impact={...point,y:clamp(point.y+(q.pattern==='creeping'?i*34*this.sommeScale:0),bounds.top+r,bounds.bottom-r)};p.angle=Math.atan2(impact.y-this.y-p.y,impact.x-this.x-p.x);const m=sommeMuzzle(this,p);this.hazard('circle',{...impact,sourceX:m.x,sourceY:m.y,radius:r,warning:q.mode==='blind'?2.05:1.65,delay:i*(q.pattern==='creeping'?.32:.16),once:true,damage:this.t.damage*1.35,visual:'somme-heavy-shell',tag:this.tag('barrage')});p.recoil=.28;this.command('muzzle',{...m,partId:id});}
  this.salvo={mode:q.mode,pattern:q.pattern,gate:q.gate,width:gap,y:q.y,remaining:3.2};this.lane.remaining=4.1;this.lock=null;this.lockProgress=0;
 }
 update(dt,{players,bounds}){
  if(this.dead)return;this.tickParts(dt);if(this.lane)this.lane.remaining=Math.max(0,this.lane.remaining-dt);if(this.salvo&&(this.salvo.remaining-=dt)<=0)this.salvo=null;
  if(this.lock){this.lock.remaining-=dt;this.lockProgress=clamp(1-this.lock.remaining/1.15,0,1);if(this.lock.remaining<=0)this.launchBarrage();}
  else if(!this.salvo&&this.due('barrage',dt,this.reloadInterval()))this.planBarrage(players,bounds);
  const aa=this.parts.get('twin-aa');if(!aa.destroyed){const live=players.filter(p=>p.alive),p=live[this.cursor%live.length];if(p){const aim=Math.atan2(p.y-this.y-aa.y,p.x-this.x-aa.x);aa.angle=turn(aa.angle,aim,.75*dt);
   if(this.due('twin-aa',dt,this.parts.get('ammo').destroyed?5.8:3.7)){const m=sommeMuzzle(this,aa);this.cursor++;const radius=clamp(36*this.sommeScale,23,36);const observer=!this.parts.get('observer').destroyed,capturedX=observer?p.x+(p.vx||0)*.22:bounds.left+(bounds.right-bounds.left)*[.22,.78][this.wave%2],capturedY=observer?p.y+(p.vy||0)*.22:bounds.top+(bounds.bottom-bounds.top)*.6;for(const side of [-1,1]){const x=clamp(capturedX+side*(radius+34),bounds.left+radius,bounds.right-radius);if(this.lane?.remaining>0&&Math.abs(x-this.lane.x)<this.lane.width/2+radius)continue;this.hazard('circle',{x,y:clamp(capturedY,bounds.top+radius,bounds.bottom-radius),sourceX:m.x,sourceY:m.y,radius,warning:observer?1.5:2.05,delay:side===1?.18:0,once:true,visual:'somme-aa-shell',tag:this.tag(aa.id)});}aa.recoil=.22;this.command('muzzle',{...m,partId:aa.id});}}
  }
  for(const id of ['mg-left','mg-right'])this.fireMG(this.parts.get(id),dt,players,this.parts.get('ammo').destroyed?4.7:3.1);
 }
}

export class Mark1Landship extends SommeBoss{
 constructor(o){super(o,MARK1_PARTS,'mark4-wedge',true);this.slot=o.slot||0;this.tankRole=this.slot===0?'male':'female';this.coreVulnerable=true;this.phase='advance';this.hullYaw=Math.PI;this.anchorX=this.x;this.anchorY=this.y;this.clock=this.slot*.8;this.trackMarks=[];this.markWait=0;this.salvo=null;this.timers.set('sponson-left',3.2+this.slot*.8);this.timers.set('sponson-right',4.7+this.slot*.8);syncSommeParts(this);for(const p of this.parts.values())p.angle=this.hullYaw+(p.id==='sponson-left'?Math.PI:0);}
 tracks(){return ['track-left','track-right'].filter(id=>!this.parts.get(id).destroyed).length;}
 hullArmor(){return ['sponson-left','sponson-right'].every(id=>this.parts.get(id).destroyed)?1:.45;}
 onPartDestroyed(p){this.cancel(p.id);if(this.salvo?.partId===p.id)this.salvo=null;if(this.tracks()===0){this.driveVelocity=0;this.driveMoving=false;}this.phase=this.tracks()===0?'tracks-disabled':this.tracks()===1?'track-disabled':this.hullArmor()===1?'exposed':'weapon-disabled';this.command('phase-change',{phase:this.phase});}
 move(dt,bounds){driveLandship(this,dt);}
 update(dt,{players,bounds}){
  if(this.dead)return;this.tickParts(dt);this.move(dt,bounds);
  for(const m of this.trackMarks)m.age+=dt;this.trackMarks=this.trackMarks.filter(m=>m.age<6);
  if(this.salvo&&!sponsonAim(this,this.parts.get(this.salvo.partId),this.salvo.x,this.salvo.y).reachable)this.salvo=null;
  if(this.salvo){this.salvo.remaining-=dt;const p=this.parts.get(this.salvo.partId);p.angle=turn(p.angle,this.salvo.angle,.9*dt);if(this.salvo.remaining<=0&&sponsonAim(this,p,this.salvo.x,this.salvo.y).reachable&&this.driveVelocity<.5&&Math.abs(angleDelta(this.salvo.angle,p.angle))<.12){if(!p.destroyed){const m=sommeMuzzle(this,p),q=this.salvo,r=clamp(37*this.sommeScale,24,37);for(let i=-1;i<=1;i++)this.hazard('circle',{x:clamp(q.x+i*83*this.sommeScale,bounds.left+r,bounds.right-r),y:q.y,sourceX:m.x,sourceY:m.y,radius:r,warning:1.45,delay:(i+1)*.12,once:true,damage:this.t.damage*1.15,visual:'somme-landship-shell',tag:this.tag(p.id)});p.recoil=.24;this.command('muzzle',{...m,partId:p.id});}this.salvo=null;}}
  for(const id of ['sponson-left','sponson-right']){const p=this.parts.get(id);if(p.destroyed)continue;
   if(this.tankRole==='female'){this.fireMG(p,dt,players,[...this.encounter?.bodies.values()||[]].some(q=>q.tankRole==='male'&&!q.dead&&q.salvo)?2.5:3.6+this.slot*.3);continue;}
   if(!this.salvo&&this.due(id,dt,6.4)){const target=players.find(q=>q.alive&&sponsonAim(this,p,q.x,q.y).reachable);if(target){const r=clamp(37*this.sommeScale,24,37),x=clamp(target.x+(target.vx||0)*.3,bounds.left+r,bounds.right-r),y=clamp(target.y+(target.vy||0)*.3,bounds.top+r,bounds.bottom-r);const aim=sponsonAim(this,p,x,y);if(aim.reachable)this.salvo={partId:id,x,y,remaining:1.05,angle:aim.angle};}}
  }
 }
}
// Legacy exported class names remain compatible with development tools.
export {Mark1Landship as Mark4Wedge,SchwabenFortress as MorserBattery};

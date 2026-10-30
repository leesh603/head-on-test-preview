import {BaseBoss,BossPart} from './headon-stageboss-core.js?v=capital-final-20261030&ai=1018&sig=1019&boss=20261020b&phase=1021&harbor=20261021';
import {CAPITAL_BOSS_ART} from './capital-boss-art.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const coreId=kind=>kind==='final-kaiserkrone'?'main-envelope':'flying-boat-hull';
const live=p=>p&&p.hp>0&&!p.disabled;
const turn=(a,b,step)=>a+clamp(wrap(b-a),-step,step);
const ART_PARTS=Object.fromEntries(Object.entries(CAPITAL_BOSS_ART).map(([id,a])=>[id,Object.fromEntries(a.parts.map(p=>[p.id,p]))]));
const source=(body,p)=>ART_PARTS[body.kind]?.[p.artId];

// Shared by hit geometry, gunnery and the renderer. All coordinates are world
// coordinates; descriptor w/h are multiplied by capitalScale by the renderer.
export function capitalPartPose(body,p){
 const d=source(body,p)||p,parent=p.parent&&body.parts.get(p.parent);
 let x=p.nativeX??d.x??0,y=p.nativeY??d.y??0;
 let angle=p.kind==='barrel'?(parent?.angle||0):p.angle||0,scaleX=1;
 if(p.kind==='door')x+=(p.side==='left'?-1:1)*(p.travel||19)*(p.hatchOpen||0);
 if(p.kind==='barrel'){
  const r=(d.recoilDistance||8)*clamp((p.recoil||parent?.recoil||0)/.24,0,1);
  x-=Math.sin(angle)*r;y+=Math.cos(angle)*r;
 }
 if(p.kind==='propeller')scaleX=.18+.82*Math.abs(Math.cos(p.propellerAngle||0));
 const c=Math.cos(body.hullYaw||0),s=Math.sin(body.hullYaw||0),k=body.capitalScale||1;
 const unavailable=p.hp<=0||parent?.hp<=0&&(p.inheritDamage!==false||p.kind==='propeller'||p.kind==='barrel');
 return {x:body.x+(x*c-y*s)*k,y:body.y+(x*s+y*c)*k,angle:(body.hullYaw||0)+angle,scaleX,alpha:p.kind==='fighter'&&(p.launchAge??3)<1.5?0:1,state:unavailable?2:p.hp/p.maxHp<=.5?1:0};
}
export function capitalMuzzle(body,p,angle){
 const q=capitalPartPose(body,p),barrel=body.parts.get(p.id+'-barrel'),d=barrel&&source(body,barrel);
 const length=(Math.abs(d?.muzzle?.[1]||64))*(body.capitalScale||1),a=Number.isFinite(angle)?angle:q.angle-Math.PI/2;
 return {x:q.x+Math.cos(a)*length,y:q.y+Math.sin(a)*length,angle:a};
}
function halfRectangle(body,p){
 const d=source(body,p),k=body.capitalScale||1;
 let cx=p.nativeX,cy=p.nativeY,w=d.w,h=d.h;
  if(d.sourceHalf){w/=2;cx+=(d.sourceHalf==='left'?-1:1)*w/2;}
  if(p.kind==='door')cx+=(p.side==='left'?-1:1)*(p.travel||19)*(p.hatchOpen||0);
 const c=Math.cos(body.hullYaw||0),s=Math.sin(body.hullYaw||0);
 return {x:body.x+(cx*c-cy*s)*k,y:body.y+(cx*s+cy*c)*k,w:w*k,h:h*k};
}
const segmentRect=(x,y,x0,y0,r,w,h)=>{
 const dx=x-x0,dy=y-y0;let low=0,high=1;
 for(const [a,b,half]of[[x0,dx,w/2+r],[y0,dy,h/2+r]]){
  if(Math.abs(b)<1e-9){if(Math.abs(a)>half)return false;continue;}
  let u=(-half-a)/b,v=(half-a)/b;if(u>v)[u,v]=[v,u];low=Math.max(low,u);high=Math.min(high,v);if(low>high)return false;
 }return true;
};

export class CapitalBoss extends BaseBoss{
 constructor({id,tuning,x=0,y=0,emit=()=>{},rng=Math.random,faction},kind){
  const art=CAPITAL_BOSS_ART[kind];if(!art)throw Error('Unknown capital boss '+kind);
  const maxHp=tuning.maxHp*1.8,scale=1000/art.width;
  const parts=art.parts.map(d=>new BossPart({id:d.id,maxHp:d.id===coreId(kind)?maxHp:tuning.maxHp*(d.kind==='structure'?.11:d.kind==='command'?.07:d.kind==='door'?.025:.045),x:d.x*scale,y:d.y*scale,radius:Math.max(14,Math.min(d.w,d.h)*scale*.36),kind:d.kind,hittable:!['propeller','barrel','fighter'].includes(d.kind)}));
  super({id,maxHp,x,y,coreRadius:65,parts,emit});
  Object.assign(this,{kind,isCapitalBoss:true,capitalScale:scale,hullYaw:0,assetKey:kind,t:{...tuning,mobileBoss:false},faction:faction||(kind==='final-kaiserkrone'?'central':'entente'),rng,anchorX:x,anchorY:y,ownsMotion129:true,partsCarryHull:true,capitalPhase:1,entryLeft:4.5,attackClock:1.4,specialClock:5,deckClock:7,recoveryLeft:0,recoveryClock:13,acePairRequested:false,motionTime:0});
  for(const d of art.parts){const p=this.parts.get(d.id);Object.assign(p,{artId:d.id,nativeX:d.x,nativeY:d.y,parent:d.parent||null,dependencies:d.dependencies||[],inheritDamage:d.inheritDamage,side:d.side,travel:d.travel,kind:d.kind,angle:0,recoil:0,propellerAngle:d.phase||0,hatchOpen:0,disabled:false});
   if(p.kind==='turret'){p.baseAim=/stern/.test(p.id)?Math.PI:/^port/.test(p.id)?-Math.PI/2:/^starboard/.test(p.id)?Math.PI/2:0;p.angle=p.baseAim;p.arc=d.arc||[-1.5,1.5];}
  }
  this.capitalHitOrder=[...this.parts.values()].filter(p=>p.hittable).sort((a,b)=>(a.kind==='structure')-(b.kind==='structure')).map(p=>p.id);
  this.syncParts();
 }
 syncParts(){
  for(const p of this.parts.values()){
   const parent=p.parent&&this.parts.get(p.parent);
   p.disabled=!!(parent?.hp<=0||p.dependencies.some(id=>this.parts.get(id)?.hp<=0));
   if(p.kind==='propeller'||p.kind==='barrel'){p.hp=parent?.hp??p.hp;p.maxHp=parent?.maxHp??p.maxHp;}
   if(p.id===coreId(this.kind))p.hp=this.hp;
   const q=capitalPartPose(this,p);p.x=q.x-this.x;p.y=q.y-this.y;
  }
 }
 locateHit({x,y,previousX=x,previousY=y,radius=0}){
  if(this.dead||this.entryLeft>0)return null;
  const c=Math.cos(-(this.hullYaw||0)),s=Math.sin(-(this.hullYaw||0));
  // Small working hardware gets priority over broad wings. The two wing halves
  // have disjoint measured rectangles despite sharing one source-image pivot.
  for(const id of this.capitalHitOrder){const p=this.parts.get(id);if(!p.hittable||p.hp<=0)continue;const box=halfRectangle(this,p);let w=box.w,h=box.h;
   const dx=x-box.x,dy=y-box.y,px=previousX-box.x,py=previousY-box.y;
   if(segmentRect(dx*c-dy*s,dx*s+dy*c,px*c-py*s,px*s+py*c,radius,w*.9,h*.9))return{partId:p.id};
  }return null;
 }
 hit({partId=null,damage}){
  if(this.entryLeft>0||this.dead)return {damage:0,blocked:true};
  if(!Number.isFinite(damage)||damage<0)throw Error('Invalid capital damage');
  if(partId===coreId(this.kind)||partId===null){const r=super.hit({damage});this.syncParts();return r;}
  const p=this.parts.get(partId);if(!p?.hittable||p.hp<=0)return {damage:0,blocked:true};
  const r=super.hit({partId,damage});if(r.damage>0&&!this.dead)super.hit({damage:r.damage*.32});this.syncParts();return r;
 }
 onPartDestroyed(p){
  this.emit({type:'capital-part-break',bossId:this.id,partId:p.id,...capitalPartPose(this,p)});
  this.recoveryLeft=Math.max(this.recoveryLeft,p.kind==='structure'?1.5:.65);
  this.syncParts();
 }
 counterWindow(){return this.recoveryLeft>0?1.45:1;}
 hazardMuzzle(p,h){return capitalMuzzle(this,p,h.sourceAngle);}
 targetFor(ctx){
  const visible=ctx.players.find(p=>p.alive&&!p.londonRiver&&(p.cloudConceal||0)<.9);
  if(visible)this.lastCapitalTarget={...visible};
  if(!this.lastCapitalTarget){const p=ctx.players.find(p=>p.alive);if(p)this.lastCapitalTarget={...p,vx:0,vy:0};}
  return this.lastCapitalTarget;
 }
 fireGuns(ctx){
  const guns=[...this.parts.values()].filter(p=>p.kind==='turret'&&live(p));if(!guns.length)return false;
  const target=this.targetFor(ctx);if(!target)return false;
  const count=Math.min(2,guns.length),start=this.gunCursor||0;this.gunCursor=(start+count)%guns.length;
  for(let j=0;j<count;j++){const p=guns[(start+j)%guns.length],a=this.hullYaw+p.angle-Math.PI/2,m=capitalMuzzle(this,p,a);p.aimHoldUntil=(this.motionTime||0)+1;
   this.emit({type:'charge-warning',bossId:this.id,partId:p.id,x:m.x,y:m.y,targetX:m.x+Math.cos(a)*500,targetY:m.y+Math.sin(a)*500,seconds:.8});
   for(let i=-1;i<=1;i++){const angle=a+i*.09;this.emit({type:'hazard',bossId:this.id,sourcePartId:p.id,sourceAngle:a,kind:'projectile',x:m.x,y:m.y,sourceOffsetX:m.x-this.x-p.x,sourceOffsetY:m.y-this.y-p.y,vx:Math.cos(angle)*this.t.bulletSpeed,vy:Math.sin(angle)*this.t.bulletSpeed,radius:6,damage:this.t.damage*.65,warning:.8,duration:2.8,visual:'black-flak',ordnanceFamily:'he',tag:this.id+':guns'});}
  }return true;
 }
 special(ctx){
  const p=this.targetFor(ctx);if(!p)return;const targetX=p.x+(p.vx||0)*1.25,targetY=p.y+(p.vy||0)*1.25;
  if(this.kind==='final-kaiserkrone'){
   const doors=[...this.parts.values()].filter(q=>q.kind==='door'&&live(q));if(doors.length<2)return this.lastStand(ctx);
   doors.forEach(q=>q.hatchOpen=1);this.hatchUntil=(this.motionTime||0)+2.2;
   const m=capitalPartPose(this,doors[0]),speed=Math.hypot(p.vx||0,p.vy||0)||1,nx=(p.vx||0)/speed,ny=(p.vy||0)/speed;
   for(let i=0;i<4;i++)this.emit({type:'hazard',bossId:this.id,sourcePartId:doors[0].id,kind:'circle',x:targetX+nx*(i-1.5)*90,y:targetY+ny*(i-1.5)*90,sourceX:m.x,sourceY:m.y,airborneBomb:true,sprite:'puw',radius:65,warning:1.6,delay:i*.22,duration:.22,once:true,damage:this.t.damage*.85,visual:'carpet-bomb',tag:this.id+':bombs'});
  }else{
   const guns=[...this.parts.values()].filter(q=>q.kind==='turret'&&live(q));if(!guns.length)return this.lastStand(ctx);
   const mount=guns[(this.specialCursor||0)%guns.length];this.specialCursor=(this.specialCursor||0)+1;const m=capitalMuzzle(this,mount);
   // Three committed impact points leave two lateral escape lanes. Destroying
   // the source cancels preparation through the existing hazard lifecycle.
   for(let i=-1;i<=1;i++)this.emit({type:'hazard',bossId:this.id,sourcePartId:mount.id,kind:'circle',x:targetX+i*105,y:targetY,sourceX:m.x,sourceY:m.y,airborneBomb:true,sprite:'cooper',radius:58,warning:1.6,delay:Math.abs(i)*.2,duration:.2,once:true,damage:this.t.damage*.85,visual:'carpet-bomb',tag:this.id+':salvo'});
  }
 }
 lastStand(ctx){
  const p=ctx.players.find(p=>p.alive);if(!p)return;const core=this.parts.get(coreId(this.kind));if(!live(core))return;
  // A disarmed hull vents from its visible core; there is no invisible gun.
  this.phase='capital-vent-recovery';this.recoveryLeft=2.4;
  this.emit({type:'hazard',bossId:this.id,sourcePartId:core.id,kind:'circle',x:this.x,y:this.y,radius:230,innerRadius:125,warning:1.7,duration:.25,once:true,damage:this.t.damage*.7,visual:'engine-blast',tag:this.id+':vent'});
 }
 launchDeck(ctx){
  if(this.kind!=='final-leviathan')return;
  for(const p of this.parts.values())if(p.kind==='fighter'&&live(p)){
   const doors=p.dependencies.map(id=>this.parts.get(id)).filter(q=>q?.kind==='door');doors.forEach(q=>q.hatchOpen=1);this.hatchUntil=this.motionTime+1.8;
   const q=capitalPartPose(this,p);p.launchAge=0;
   this.emit({type:'spawn-minion',bossId:this.id,minion:'sopwith-camel',plane:'camel',faction:this.faction,behavior:'attack-pass',x:q.x,y:q.y,a:-Math.PI/2,life:6.2,hp:Math.min(210,this.maxHp*.015),passTargetX:ctx.players[0]?.x,passTargetY:ctx.players[0]?.y});
  }
 }
 update(dt,ctx){
  if(this.dead)return;
  this.entryLeft=Math.max(0,this.entryLeft-dt);this.recoveryLeft=Math.max(0,this.recoveryLeft-dt);
  const engines=[...this.parts.values()].filter(p=>p.kind==='engine'),power=engines.filter(live).length/engines.length;
  const now=this.motionTime||0;this.hullYaw+=Math.cos(now*.13)*.045*.13*power*dt;this.x+=Math.cos(now*.18)*44*.18*power*dt;this.y+=Math.cos(now*.14)*24*.14*power*dt;
  const target=this.targetFor(ctx);
  for(const p of this.parts.values()){
   p.recoil=Math.max(0,p.recoil-dt);p.gunFlash=Math.max(0,(p.gunFlash||0)-dt);
   if(p.kind==='propeller'&&live(this.parts.get(p.parent))&&!p.disabled)p.propellerAngle+=dt*(source(this,p)?.speed||24);
   if(p.kind==='door'&&now>(this.hatchUntil||0))p.hatchOpen=Math.max(0,p.hatchOpen-dt*1.8);
   if(p.kind==='fighter')p.launchAge=Math.min(3,(p.launchAge??3)+dt);
   if(p.kind==='turret'&&live(p)&&now>=(p.aimHoldUntil||0)&&target){const q=capitalPartPose(this,p),aim=wrap(Math.atan2(target.y-q.y,target.x-q.x)+Math.PI/2-this.hullYaw),relative=clamp(wrap(aim-p.baseAim),p.arc[0],p.arc[1]);p.angle=turn(p.angle,p.baseAim+relative,dt*(this.parts.get('command-cabin')?.hp<=0?.38:.75));}
  }this.syncParts();
  if(this.entryLeft>0){this.phase='capital-entry';return;}
  const fraction=this.hp/this.maxHp,next=fraction<=.33?3:fraction<=.66?2:1;
  if(next!==this.capitalPhase){this.capitalPhase=next;this.recoveryLeft=Math.max(this.recoveryLeft,2.2);this.emit({type:'phase-change',bossId:this.id,phase:'capital-phase-'+next});}
  if(fraction<=.5&&!this.acePairRequested){this.acePairRequested=true;this.recoveryLeft=Math.max(this.recoveryLeft,5);this.aceWaitUntil=now+5;this.emit({type:'capital-ace-pair',bossId:this.id,faction:this.faction,x:this.x,y:this.y});}
  if(ctx.capitalAcesAlive>0&&now<(this.aceWaitUntil||0)+22){this.recoveryLeft=Math.max(this.recoveryLeft,.12);this.phase='capital-ace-cover';return;}
  this.recoveryClock-=dt;if(this.recoveryClock<=0){this.recoveryClock=13;this.recoveryLeft=Math.max(this.recoveryLeft,2.3);}
  this.phase=this.recoveryLeft>0?'capital-recovery':'capital-phase-'+next;
  if(this.recoveryLeft>0)return;
  const suppressed=ctx.capitalDefenseSuppressed?1.2:1;
  this.attackClock-=dt;this.specialClock-=dt;this.deckClock-=dt;
  if(this.attackClock<=0){this.attackClock=(next===3?2.2:2.8)*suppressed;if(!this.fireGuns(ctx))this.lastStand(ctx);}
  if(this.specialClock<=0){this.specialClock=(next===3?7:9)*suppressed;this.special(ctx);this.attackClock=Math.max(this.attackClock,2.5);}
  if(this.deckClock<=0){this.deckClock=11;this.launchDeck(ctx);}
 }
}
export function createCapitalBoss(options,bossId){return new CapitalBoss(options,bossId);}

import {BaseBoss,BossPart,predictPilot} from './headon-stageboss-core.js?v=09c75d146ae4289d';
import {CAPITAL_BOSS_ART} from './capital-boss-art.js?v=09c75d146ae4289d';

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
 if(p.kind==='barrel'&&parent){const px=parent.nativeX??x,py=parent.nativeY??y,dx=x-px,dy=y-py; x=px+dx*Math.cos(angle)-dy*Math.sin(angle);y=py+dx*Math.sin(angle)+dy*Math.cos(angle);}
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
export function capitalMuzzle(body,p,angle,barrelOffset=0){
 const barrel=body.parts.get(p.id+'-barrel'),d=barrel&&source(body,barrel),q=capitalPartPose(body,barrel||p);
 // The painted barrel's tip is measured from its own pivot. It is not a
 // fixed 64px extension of the turret and follows the same recoil as the art.
 const muzzle=d?.muzzle||[0,-(d?.h||80)*(d?.pivot?.[1]??.5)],a=Number.isFinite(angle)?angle:q.angle-Math.PI/2;
 const k=body.capitalScale||1,c=Math.cos(a+Math.PI/2),s=Math.sin(a+Math.PI/2);
 return {x:q.x+((muzzle[0]+barrelOffset)*c-muzzle[1]*s)*k,y:q.y+((muzzle[0]+barrelOffset)*s+muzzle[1]*c)*k,angle:a};
}
function halfRectangle(body,p){
 const d=source(body,p),k=body.capitalScale||1,q=capitalPartPose(body,p),pivot=d.framePivots?.[q.state]||d.pivot||[.5,.5];
 let w=d.w,h=d.h;
 if(d.preserveAspect!==false){const frame=d.frames[q.state]||d.frames[0],fit=Math.min(w/frame[2],h/frame[3]);w=frame[2]*fit;h=frame[3]*fit;}
 let dx=w*(.5-pivot[0]),dy=h*(.5-pivot[1]);
 if(d.sourceHalf){w/=2;dx+=(d.sourceHalf==='left'?-1:1)*w/2;}
 const c=Math.cos(q.angle),s=Math.sin(q.angle);
 return {x:q.x+(dx*c-dy*s)*k,y:q.y+(dx*s+dy*c)*k,w:w*k,h:h*k,angle:q.angle};
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
  const maxHp=tuning.maxHp*1.8,scale=(kind==='final-leviathan'?1180:1000)/art.width;
  const parts=art.parts.map(d=>new BossPart({id:d.id,maxHp:d.id===coreId(kind)?maxHp:tuning.maxHp*(d.kind==='structure'?.11:d.kind==='command'?.07:d.kind==='door'?.025:.045),x:d.x*scale,y:d.y*scale,radius:Math.max(14,Math.min(d.w,d.h)*scale*.36),kind:d.kind,hittable:!['propeller','barrel','fighter'].includes(d.kind)}));
  super({id,maxHp,x,y,coreRadius:65,parts,emit});
  Object.assign(this,{kind,isCapitalBoss:true,capitalScale:scale,hullYaw:0,assetKey:kind,t:{...tuning,mobileBoss:false},faction:faction||(kind==='final-kaiserkrone'?'central':'entente'),rng,anchorX:x,anchorY:y,ownsMotion129:true,partsCarryHull:true,capitalPhase:1,entryLeft:4.5,attackClock:1.4,specialClock:5,deckClock:7,recoveryLeft:0,recoveryClock:13,acePairRequested:false,motionTime:0});
  for(const d of art.parts){const p=this.parts.get(d.id);Object.assign(p,{artId:d.id,nativeX:d.x,nativeY:d.y,parent:d.parent||null,dependencies:d.dependencies||[],inheritDamage:d.inheritDamage,side:d.side,travel:d.travel,kind:d.kind,angle:0,recoil:0,propellerAngle:d.phase||0,hatchOpen:0,disabled:false});
   if(p.kind==='turret'){
    const side=/^port/.test(p.id)?-1:/^starboard/.test(p.id)?1:0;
    // Mounts face their own sector: forward/aft batteries overlap the nose
    // and tail instead of every side gun sharing the same blind corridor.
    p.baseAim=/stern/.test(p.id)?Math.PI:/forward-gun|-gun-1$/.test(p.id)?side*.8:/aft-gun|-gun-3$/.test(p.id)?side*2.35:side*Math.PI/2;
    p.angle=p.baseAim;p.arc=d.arc||[-1.5,1.5];
   }
  }
  this.capitalHitOrder=[...this.parts.values()].filter(p=>p.hittable).sort((a,b)=>(a.kind==='structure')-(b.kind==='structure')).map(p=>p.id);
  this.syncParts();
 }
 syncParts(){
  for(const p of this.parts.values()){
   const parent=p.parent&&this.parts.get(p.parent);
   // The Kaiser support frame has no shared engine/weapon power bus. Its
   // wreckage remains in place; destroying it must not silently disable every
   // independently healthy engine, gun and hatch at once.
   p.disabled=!!(parent?.hp<=0&&parent.id!=='load-frame'||p.dependencies.some(id=>this.parts.get(id)?.hp<=0));
   if(p.kind==='propeller'||p.kind==='barrel'){p.hp=parent?.hp??p.hp;p.maxHp=parent?.maxHp??p.maxHp;}
   if(p.id===coreId(this.kind))p.hp=this.hp;
   const q=capitalPartPose(this,p);p.x=q.x-this.x;p.y=q.y-this.y;
  }
 }
 locateHit({x,y,previousX=x,previousY=y,radius=0}){
  if(this.dead||this.entryLeft>0)return null;
  // Small working hardware gets priority over broad wings. The two wing halves
  // have disjoint measured rectangles despite sharing one source-image pivot.
  for(const id of this.capitalHitOrder){const p=this.parts.get(id);if(!p.hittable||p.hp<=0)continue;const box=halfRectangle(this,p),c=Math.cos(-box.angle),s=Math.sin(-box.angle);let w=box.w,h=box.h;
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
 hurry(){this.specialClock=Math.min(this.specialClock,.15);return 'capital-special';}
 hazardMuzzle(p,h){return capitalMuzzle(this,p,h.sourceAngle,h.sourceBarrelOffset||0);}
 targetFor(ctx){
  const visible=ctx.players.find(p=>p.alive&&!p.londonRiver&&(p.cloudConceal||0)<.9);
  if(visible)this.lastCapitalTarget={...visible};
  if(!this.lastCapitalTarget){const p=ctx.players.find(p=>p.alive);if(p)this.lastCapitalTarget={...p,vx:0,vy:0};}
  return this.lastCapitalTarget;
 }
 gunAim(p,target){
  const q=capitalPartPose(this,p);
  if(this.kind==='final-leviathan'){
   const flight=clamp(Math.hypot(target.x-q.x,target.y-q.y)/this.t.bulletSpeed,.1,.85);
   target=predictPilot(target,.8+flight);
  }
  return wrap(Math.atan2(target.y-q.y,target.x-q.x)+Math.PI/2-this.hullYaw);
 }
 aimedGuns(ctx){
  const target=this.targetFor(ctx);if(!target)return [];
  return [...this.parts.values()].filter(p=>{
   if(p.kind!=='turret'||!live(p))return false;
   const aim=this.gunAim(p,target),relative=wrap(aim-p.baseAim);
   return relative>=p.arc[0]+.04&&relative<=p.arc[1]-.04&&Math.abs(wrap(aim-p.angle))<.18;
  });
 }
 fireWingWaves(p,a,delay){
  const late=this.capitalPhase===3, waves=late?3:2, width=late?4:3;
  const side=this.gunCursor%2?1:-1,m=capitalMuzzle(this,p,a);
  this.emit({type:'charge-warning',bossId:this.id,partId:p.id,x:m.x,y:m.y,targetX:m.x+Math.cos(a)*760,targetY:m.y+Math.sin(a)*760,seconds:.85+delay});
  for(let wave=0;wave<waves;wave++)for(let lane=-width;lane<=width;lane++){
   // The opening shifts one lane between waves. Each group still leaves
   // a gap wide enough for the pilot to cross the advancing front.
   if(lane===(wave%2?side:-side))continue;
   const angle=a+lane*.105, speed=this.t.bulletSpeed*(1.12+wave*.11);
   this.emit({type:'hazard',bossId:this.id,sourcePartId:p.id,sourceAngle:a,kind:'projectile',x:m.x,y:m.y,
    vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,radius:7,warning:.85,delay:delay+wave*.32,duration:3.2,
    damage:this.t.damage*.65,visual:'aa-shell',ordnanceFamily:'he',tag:this.id+':wing-wave'});
  }
 }
 fireGuns(ctx,guns=this.aimedGuns(ctx)){
  if(!guns.length)return [...this.parts.values()].some(p=>p.kind==='turret'&&live(p));
  const count=Math.min(2,guns.length),start=(this.gunCursor||0)%guns.length;this.gunCursor=start+count;
  for(let j=0;j<count;j++){
   const p=guns[(start+j)%guns.length],a=this.hullYaw+p.angle-Math.PI/2,delay=j*.22;
   p.aimHoldUntil=(this.combatTime||0)+1+delay;p.aimHoldAngle=a;
   const main=this.kind==='final-leviathan'&&/^(bow|stern)-gun$/.test(p.id),barrel=this.parts.get(p.id+'-barrel');
   if(this.kind==='final-leviathan'&&ctx.bounds&&!main){
    p.aimHoldUntil=(this.combatTime||0)+1.6+delay;
    this.fireWingWaves(p,a,delay);
    continue;
   }
   const offsets=main?(source(this,barrel)?.barrelOffsets||[-10,10]):[0];
   for(const offset of offsets){
    const m=capitalMuzzle(this,p,a,offset);
    this.emit({type:'charge-warning',bossId:this.id,partId:p.id,x:m.x,y:m.y,targetX:m.x+Math.cos(a)*650,targetY:m.y+Math.sin(a)*650,seconds:.8+delay});
    const spread=this.kind==='final-kaiserkrone'?.075:.12;
    for(let i=main?0:-1;i<=(main?0:1);i++){const angle=a+i*spread;this.emit({type:'hazard',bossId:this.id,sourcePartId:p.id,sourceAngle:a,sourceBarrelOffset:offset,kind:'projectile',x:m.x,y:m.y,sourceOffsetX:m.x-this.x-p.x,sourceOffsetY:m.y-this.y-p.y,vx:Math.cos(angle)*this.t.bulletSpeed,vy:Math.sin(angle)*this.t.bulletSpeed,radius:main?8:6,damage:this.t.damage*(main?.9:.65),warning:.8,delay,duration:2.8,visual:main?'aa-shell':'black-flak',ordnanceFamily:'he',tag:this.id+':guns'});}
   }
  }return true;
 }
 reserveSalvoRecovery(seconds){
  // The native reload starts after the last committed round has cleared.
  // The same hold also keeps hurry() from layering another attack over it.
  this.basicHoldUntil=Math.max(this.basicHoldUntil||0,(this.combatTime||0)+seconds);
  this.recoveryClock=seconds;
 }
 special(ctx){
  const p=this.targetFor(ctx);if(!p)return;
  const step=this.specialCursor||0;
  const {x:targetX,y:targetY}=this.kind==='final-leviathan'?predictPilot(p,1.88):predictPilot({...p,omega:0},.85);
  if(this.kind==='final-kaiserkrone'){
   this.specialCursor=step+1;
   const doors=[...this.parts.values()].filter(q=>q.kind==='door'&&live(q));if(!doors.length)return this.lastStand(ctx);
   doors.forEach(q=>q.hatchOpen=1);this.hatchUntil=(this.combatTime||0)+2.9;
   const mount=doors[step%doors.length],m=capitalPartPose(this,mount);
   const speed=Math.hypot(p.vx||0,p.vy||0),a=speed>10?Math.atan2(p.vy,p.vx):this.hullYaw-Math.PI/2,ux=Math.cos(a),uy=Math.sin(a);
   if(this.capitalPhase>=2&&step%3===1){
    // A brief two-sided carpet leaves the pilot's flight corridor open.
    // Losing a hatch removes its entire lane, including pending releases.
    const rows=this.capitalPhase===3?6:4,hatches=doors.slice(0,2);
    for(const [index,hatch] of hatches.entries()){
     const side=hatch.side==='left'?-1:1,origin=capitalPartPose(this,hatch);
     for(let row=0;row<rows;row++){
      const along=(row-(rows-1)/2)*115;
      this.emit({type:'hazard',bossId:this.id,sourcePartId:hatch.id,kind:'circle',x:targetX+ux*along-uy*side*150,y:targetY+uy*along+ux*side*150,sourceX:origin.x,sourceY:origin.y,airborneBomb:true,sprite:'puw',radius:58,warning:2,delay:row*.22+index*.12,duration:.22,once:true,damage:this.t.damage*.85,visual:'carpet-bomb',tag:this.id+':bombs'});
     }
    }
    const release=2+(rows-1)*.22+(hatches.length-1)*.12;
    this.hatchUntil=Math.max(this.hatchUntil,(this.combatTime||0)+release);
    this.reserveSalvoRecovery(release+.22);
   }else if(this.capitalPhase>=2&&step%3===2){
    // Two staggered mine groups leave an open central flight lane. Mines
    // deploy visibly from the surviving hatch using the native mine lifecycle.
    const points=[];for(const side of [-1,1])for(let i=0;i<2;i++)points.push({x:targetX+ux*(i-.5)*125-uy*side*150,y:targetY+uy*(i-.5)*125+ux*side*150});
    this.emit({type:'spawn-minefield',bossId:this.id,sourcePartId:mount.id,sourceX:m.x,sourceY:m.y,points,warning:2.1,deploySeconds:1.6,life:8,maxMines:8,blastRadius:52});
   }else{
    // A stationary pilot still sees a bombing line, never four bombs stacked
    // on one pixel. The alternate stick crosses the previous approach.
    const nx=step%2?-uy:ux,ny=step%2?ux:uy;
    for(let i=0;i<4;i++)this.emit({type:'hazard',bossId:this.id,sourcePartId:mount.id,kind:'circle',x:targetX+nx*(i-1.5)*115,y:targetY+ny*(i-1.5)*115,sourceX:m.x,sourceY:m.y,airborneBomb:true,sprite:'puw',radius:58,warning:1.65,delay:i*.3,duration:.22,once:true,damage:this.t.damage*.85,visual:'carpet-bomb',tag:this.id+':bombs'});
   }
  }else{
   const decks=[...this.parts.values()].some(q=>q.kind==='fighter'&&live(q));
   if(step%3===2&&decks){this.launchDeck(ctx);this.deckClock=11;this.specialCursor=step+1;return true;}
   const guns=this.aimedGuns(ctx),all=[...this.parts.values()].filter(q=>q.kind==='turret'&&live(q));
   if(!guns.length){
    if(all.length)return false;
    if(decks){this.launchDeck(ctx);this.deckClock=Math.max(this.deckClock,11);}else this.lastStand(ctx);
    return true;
   }
   this.specialCursor=step+1;
   const wing=guns.filter(q=>!/^(bow|stern)-gun$/.test(q.id)),main=guns.filter(q=>/^(bow|stern)-gun$/.test(q.id));
   if(step%3===1&&wing.length){
    // Each surviving wing battery commits its own physical sightline. The
    // crossing fans share neither a floating muzzle nor an invisible gun.
    const batteries=wing.slice(0,2),climax=this.capitalPhase>=2,waves=climax?(this.capitalPhase===3?3:2):1;
    for(const [index,mount] of batteries.entries()){
     const a=this.hullYaw+mount.angle-Math.PI/2,m=capitalMuzzle(this,mount),delay=index*.25;
     mount.aimHoldUntil=(this.combatTime||0)+Math.max(2.2,1.8+delay+(waves-1)*.42);mount.aimHoldAngle=a;
     this.emit({type:'charge-warning',bossId:this.id,partId:mount.id,x:m.x,y:m.y,targetX:m.x+Math.cos(a)*700,targetY:m.y+Math.sin(a)*700,seconds:1.6+delay});
     const half=climax?2:1,gap=climax?Math.max(.14,Math.asin(Math.min(.5,48/Math.max(1,Math.hypot(targetX-m.x,targetY-m.y))))):.13;
     for(let wave=0;wave<waves;wave++)for(let i=-half;i<=half;i++){
      // Repeated fronts retain one readable gap along each warned sightline.
      if(climax&&i===0)continue;
      const angle=a+i*gap;this.emit({type:'hazard',bossId:this.id,sourcePartId:mount.id,sourceAngle:a,kind:'projectile',x:m.x,y:m.y,vx:Math.cos(angle)*this.t.bulletSpeed*1.1,vy:Math.sin(angle)*this.t.bulletSpeed*1.1,radius:7,warning:1.6,delay:delay+wave*.42,duration:3.2,damage:this.t.damage*.8,visual:'aa-shell',ordnanceFamily:'he',tag:this.id+':crossfire'});
     }
    }
    if(climax){const release=1.6+(batteries.length-1)*.25+(waves-1)*.42;this.leviathanVolleyUntil=(this.combatTime||0)+release;this.reserveSalvoRecovery(release+3.2);}
   }else{
    const mount=(main.length?main:guns)[step%(main.length||guns.length)],a=this.hullYaw+mount.angle-Math.PI/2,ux=Math.cos(a),uy=Math.sin(a);
    mount.aimHoldUntil=(this.combatTime||0)+2.5;mount.aimHoldAngle=a;
    const barrel=this.parts.get(mount.id+'-barrel'),offsets=main.includes(mount)?(source(this,barrel)?.barrelOffsets||[-10,10]):[0];
    const q=capitalMuzzle(this,mount,a,offsets[0]);mount.recoil=.24;mount.gunFlash=.12;
    this.emit({type:'muzzle',bossId:this.id,partId:mount.id,x:q.x,y:q.y});
    this.emit({type:'charge-warning',bossId:this.id,partId:mount.id,x:q.x,y:q.y,targetX,targetY,seconds:1.6});
    // Main guns bracket range with three committed impacts. Alternating
    // barrels keep the source visible without doubling overlapping damage.
    for(let i=-1;i<=1;i++){
     const offset=offsets[(i+1)%offsets.length],m=capitalMuzzle(this,mount,a,offset);
     this.emit({type:'hazard',bossId:this.id,sourcePartId:mount.id,sourceBarrelOffset:offset,kind:'circle',x:targetX+ux*i*145,y:targetY+uy*i*145,sourceX:m.x,sourceY:m.y,radius:70,warning:1.6,delay:(i+1)*.28,duration:.2,once:true,damage:this.t.damage*.9,visual:'black-flak',ordnanceFamily:'he',tag:this.id+':salvo'});
    }
   }
   return true;
  }
 }

 lastStand(ctx){
  const p=ctx.players.find(p=>p.alive);if(!p)return;const core=this.parts.get(coreId(this.kind));if(!live(core))return;
  // A disarmed hull vents from its visible core; there is no invisible gun.
  this.phase='capital-vent-recovery';this.recoveryLeft=2.4;
  this.emit({type:'hazard',bossId:this.id,sourcePartId:core.id,kind:'circle',x:this.x,y:this.y,radius:230,innerRadius:125,warning:1.7,duration:.25,once:true,damage:this.t.damage*.7,visual:'engine-blast',tag:this.id+':vent'});
 }
 launchDeck(ctx){
  if(this.kind!=='final-leviathan')return 0;
  let launched=0;
  for(const p of this.parts.values())if(p.kind==='fighter'&&live(p)){
   const doors=p.dependencies.map(id=>this.parts.get(id)).filter(q=>q?.kind==='door');doors.forEach(q=>q.hatchOpen=1);this.hatchUntil=Math.max(this.hatchUntil||0,(this.combatTime||0)+1.8);
   const q=capitalPartPose(this,p);p.launchAge=0;launched++;
   this.emit({type:'spawn-minion',bossId:this.id,minion:'sopwith-camel',plane:'camel',faction:this.faction,behavior:'attack-pass',x:q.x,y:q.y,a:this.hullYaw-Math.PI/2,life:6.2,hp:Math.min(210,this.maxHp*.015),passTargetX:ctx.players[0]?.x,passTargetY:ctx.players[0]?.y});
  }return launched;
 }
 update(dt,ctx){
  if(this.dead)return;
  this.entryLeft=Math.max(0,this.entryLeft-dt);this.recoveryLeft=Math.max(0,this.recoveryLeft-dt);
  const engines=[...this.parts.values()].filter(p=>p.kind==='engine'),power=engines.filter(live).length/engines.length;
  const now=this.motionTime||0,combatNow=this.combatTime||0,target=this.targetFor(ctx);
  const maneuver=this.kind==='final-leviathan'&&ctx.bounds&&target;
  if(power>0){
   const airship=this.kind==='final-kaiserkrone',port=engines.filter(p=>/^port/.test(p.id)&&live(p)).length,starboard=engines.filter(p=>/^starboard/.test(p.id)&&live(p)).length;
   let heading=Math.sin(now*(airship?.12:.18))*(airship?.23:.4)+(port-starboard)*.025;
   let speed=airship?30:49,turnLimit=airship?.045:.075,acceleration=airship?9:15;
   if(maneuver){
    const pursuit=predictPilot(target,1.12),dx=pursuit.x-this.x,dy=pursuit.y-this.y,distance=Math.hypot(dx,dy);
    const {left,right,top,bottom}=ctx.bounds,station=clamp(Math.min(right-left,bottom-top)*.53,235,400);
    this.passSide??=dx>=0?1:-1;
    // Fly a broadside arc nearby and cut back toward the fight if a pilot
    // leaves it. The hull never follows the camera's position directly.
    const arc=clamp(Math.PI/2-(distance-station)/station*2.3,0,2.27);
    heading=Math.atan2(dy,dx)+Math.PI/2+this.passSide*arc+(port-starboard)*.035;
    const pilotSpeed=Math.hypot(target.vx||0,target.vy||0),closing=distance>station*1.38;
    speed=clamp(Math.max(104+this.capitalPhase*13,pilotSpeed*(closing?1.23:.86)),104,232);
    const alignment=Math.abs(wrap(heading-this.hullYaw));
    speed*=1-.55*clamp((alignment-.42)/1.38,0,1);
    if(this.recoveryLeft>0)speed*=.78;
    turnLimit=combatNow<(this.leviathanVolleyUntil||0)?.29:.56;
    acceleration=58;
   }
   // Heavy hulls build speed and turn rate instead of instantly entering a
   // full-speed sine weave. Translation always follows the visible nose.
   const maxTurn=turnLimit*power,desiredTurn=clamp(wrap(heading-this.hullYaw)*(maneuver?1.1:.65),-maxTurn,maxTurn);
   const turnAccel=maxTurn*dt*(maneuver?2.4:1);
   this.capitalTurnRate=(this.capitalTurnRate||0)+clamp(desiredTurn-(this.capitalTurnRate||0),-turnAccel,turnAccel);
   this.hullYaw+=this.capitalTurnRate*dt;
   const targetSpeed=speed*power;
   this.capitalSpeed=(this.capitalSpeed||0)+clamp(targetSpeed-(this.capitalSpeed||0),-acceleration*dt,acceleration*dt);
   this.x+=Math.sin(this.hullYaw)*this.capitalSpeed*dt;this.y-=Math.cos(this.hullYaw)*this.capitalSpeed*dt;
  }else{
   this.capitalSpeed=0;this.capitalTurnRate=0;
  }
  for(const p of this.parts.values()){
   p.recoil=Math.max(0,p.recoil-dt);p.gunFlash=Math.max(0,(p.gunFlash||0)-dt);
   if(p.kind==='propeller'&&live(this.parts.get(p.parent))&&!p.disabled)p.propellerAngle+=dt*(source(this,p)?.speed||24);
   if(p.kind==='door'&&combatNow>(this.hatchUntil||0))p.hatchOpen=Math.max(0,p.hatchOpen-dt*1.8);
   if(p.kind==='fighter')p.launchAge=Math.min(3,(p.launchAge??3)+dt);
   if(p.kind==='turret'&&live(p)&&combatNow<(p.aimHoldUntil||0)&&Number.isFinite(p.aimHoldAngle))p.angle=p.baseAim+clamp(wrap(p.aimHoldAngle+Math.PI/2-this.hullYaw-p.baseAim),p.arc[0],p.arc[1]);
   if(p.kind==='turret'&&live(p)&&combatNow>=(p.aimHoldUntil||0)&&target){
    const relative=clamp(wrap(this.gunAim(p,target)-p.baseAim),p.arc[0],p.arc[1]);
    const damaged=this.parts.get('command-cabin')?.hp<=0;
    const slew=this.kind==='final-leviathan'?(damaged?.65:1.3):(damaged?.38:.75);
    p.angle=turn(p.angle,p.baseAim+relative,dt*slew);
   }
  }this.syncParts();
  if(this.entryLeft>0){this.phase='capital-entry';return;}
  const fraction=this.hp/this.maxHp,next=fraction<=.33?3:fraction<=.66?2:1;
  if(next!==this.capitalPhase){this.capitalPhase=next;this.recoveryLeft=Math.max(this.recoveryLeft,2.2);this.emit({type:'phase-change',bossId:this.id,phase:'capital-phase-'+next});}
  if(fraction<=.5&&!this.acePairRequested){this.acePairRequested=true;const cover=this.kind==='final-leviathan'?3.2:5;this.recoveryLeft=Math.max(this.recoveryLeft,cover);this.aceWaitUntil=combatNow+cover;this.emit({type:'capital-ace-pair',bossId:this.id,faction:this.faction,x:this.x,y:this.y});}
  if(ctx.capitalAcesAlive>0&&combatNow<(this.aceWaitUntil||0)+(this.kind==='final-leviathan'?0:22)){this.recoveryLeft=Math.max(this.recoveryLeft,.12);this.phase='capital-ace-cover';return;}
  this.recoveryClock-=dt;if(this.recoveryClock<=0){this.recoveryClock=13;this.recoveryLeft=Math.max(this.recoveryLeft,this.kind==='final-leviathan'?1.55:2.3);}
  this.phase=this.recoveryLeft>0?'capital-recovery':'capital-phase-'+next;
  if(this.recoveryLeft>0||combatNow<(this.basicHoldUntil||0))return;
  const suppressed=ctx.capitalDefenseSuppressed?1.2:1;
  this.attackClock-=dt;this.specialClock-=dt;this.deckClock-=dt;
  if(this.specialClock<=0){
   if(this.special(ctx)===false)this.specialClock=.25;
   else{this.specialClock=(next===3?7:9)*suppressed;this.attackClock=Math.max(this.attackClock,2.5);}
  }
  if(this.recoveryLeft>0||combatNow<(this.basicHoldUntil||0))return;
  if(this.attackClock<=0){
   const hasGuns=[...this.parts.values()].some(p=>p.kind==='turret'&&live(p));
   this.attackClock=(next===3?2.2:2.8)*suppressed;
   if(hasGuns){
    const guns=this.aimedGuns(ctx);
    if(guns.length){
     this.fireGuns(ctx,guns);
     if(maneuver)this.leviathanVolleyUntil=combatNow+1.6;
    }
    else if(this.kind==='final-leviathan')this.attackClock=.18;
   }else if(this.kind==='final-leviathan'&&[...this.parts.values()].some(p=>p.kind==='fighter'&&live(p)))this.deckClock=Math.min(this.deckClock,0);
   else this.lastStand(ctx);
  }
  if(this.deckClock<=0){this.deckClock=11;this.launchDeck(ctx);}
 }
}
export function createCapitalBoss(options,bossId){return new CapitalBoss(options,bossId);}

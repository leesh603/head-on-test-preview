// Presentation owns its own state and deterministic variation. Never consume the
// simulation RNG or write aircraft positions, headings, damage, or rewards here.
const worlds=new WeakMap(),poses=new WeakMap();
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const angle=n=>Math.atan2(Math.sin(n),Math.cos(n));
const ordinary=e=>e&&!e.bossPilot&&!e.ace&&!e.rivalAce&&!e.eliteKind&&!e.formationLeader&&!e.missionTarget&&!e.stageBossBody&&!e.bossMinion&&!e.heavyBomber&&!e.surface&&!e.stationary&&!e.fieldUnit&&!e.navalVessel&&!e.bugDrone&&['scout','hunter','bomber'].includes(e.type);
export const COMBAT_FEEDBACK_LIMITS=Object.freeze({impacts:40,compactImpacts:20,wrecks:10,compactWrecks:5,trail:48,compactTrail:24});
export const WRECK_STYLES=Object.freeze(['smoke','fire','spin','breakup','runaway']);
export function impactMaterial(e,b){
 if(e.surface||e.fieldUnit||e.navalVessel||e.stageBossBody)return 'metal';
 const dx=b.x-e.x,dy=b.y-e.y,forward=dx*Math.cos(e.a)+dy*Math.sin(e.a),side=-dx*Math.sin(e.a)+dy*Math.cos(e.a);
 return forward>9&&Math.abs(side)<12?'metal':Math.abs(side)>15?'fabric':'wood';
}
export function combatVisualPose(e){return poses.get(e)||{x:0,y:0,roll:0,bank:1,active:false}}
function pose(e,time,dt){
 const q=poses.get(e)||{x:0,y:0,roll:0,bank:1,lastA:e.a,lastHp:e.hp,kick:0,turn:0};
 const rate=dt>0?clamp(angle(e.a-q.lastA)/dt,-4,4):0;
 q.turn+=(rate-q.turn)*(1-Math.exp(-dt*12));q.kick=Math.max(e.hp<q.lastHp?1:0,q.kick-dt*6);
 const shot=e.muzzleFlash>0&&!(e.reloadTime>0)?.85:0,damage=clamp(1-e.hp/e.maxHp)*.3;
 const side=Math.sin(time*67)*q.kick*1.6+Math.sin(time*43)*shot*.45;
 q.x=-Math.cos(e.a)*shot-Math.sin(e.a)*side;q.y=-Math.sin(e.a)*shot+Math.cos(e.a)*side;
 q.roll=Math.sin(time*61)*q.kick*.018+Math.sin(time*9)*damage*.012;
 q.active=true;q.bank=1-Math.min(.085,Math.abs(q.turn)*.025);q.lastA=e.a;q.lastHp=e.hp;poses.set(e,q);
}
export function attachCombatFeedback(world,{play=()=>{},pulse=()=>{},key=e=>e.escortPlane||e.bossPlane||e.plane,scale=()=>1}={}){
 if(worlds.has(world))return worlds.get(world);
 const state={impacts:[],wrecks:[],trail:[],serial:0,impactSerial:0,time:world.t||0,nextEngine:0,nextHeavy:0,nextNear:0,nextPass:0,camera:0,previous:new WeakMap(),whizzed:new WeakSet(),dead:new WeakSet(),pendingKill:null};
 worlds.set(world,state);
 const compact=()=>world.viewWidth<=720;
 const cap=(list,small,big)=>{const max=compact()?small:big;if(list.length>max)list.splice(0,list.length-max)};
 const burst=world.burst;
 world.burst=function(x,y,color,n,...args){
  const e=color==='#f2aa52'&&n>=26?(this.enemies||[]).find(e=>ordinary(e)&&e.hp<=0&&Math.hypot(e.x-x,e.y-y)<2):null;
  const particleStart=this.particles?.length||0,oldFx=e?new Set(this.combatFX||[]):null;
  const result=burst.call(this,x,y,color,n,...args);
  if(!e)return result;
  // Preserve the original RNG calls, but replace the generic kill artwork.
  if(state.dead.has(e)){this.combatFX=(this.combatFX||[]).filter(f=>oldFx.has(f)||!f.killExplosion);this.particles?.splice(particleStart);return result}
  state.dead.add(e);const sequence=state.serial++,large=sequence%17===16;
  state.pendingKill=large?'kill':'airframeBreak';
  if(!large){
   this.combatFX=(this.combatFX||[]).filter(f=>oldFx.has(f)||!f.killExplosion);this.particles?.splice(particleStart);
   state.wrecks.push({x:e.x,y:e.y,a:e.a,heading:e.a,speed:Math.min(190,e.speed||100),key:key(e),scale:scale(e),style:WRECK_STYLES[sequence%5],side:sequence%2?1:-1,age:0,life:1.7+(sequence%3)*.25,nextTrail:0});
   cap(state.wrecks,COMBAT_FEEDBACK_LIMITS.compactWrecks,COMBAT_FEEDBACK_LIMITS.wrecks);
  }
  return result;
 };
 const blast=world.combatBlast;
 if(blast)world.combatBlast=function(x,y,...args){const result=blast.call(this,x,y,...args);if((this.players||[this]).some(p=>p.hp>0&&Math.hypot(x-p.x,y-p.y)<240)){state.camera=Math.max(state.camera,1.1);pulse('explosion')}return result};
 const event=world.event;
 world.event=function(type,...args){const result=event.call(this,type,...args);if(type==='kill'&&state.pendingKill){const emitted=this.events?.at(-1);if(emitted?.type==='kill')emitted.combatSound=state.pendingKill;state.pendingKill=null}if(type==='impact'&&state.pendingImpact){const emitted=this.events?.at(-1);if(emitted?.type==='impact')emitted.combatMaterial=true;state.pendingImpact=false}if(type==='shot')pulse('shot');else if(type==='hit'){state.camera=Math.max(state.camera,.9);pulse('hit')}return result};
 for(const p of world.players||[world]){
  const impact=p.specialRoundImpact;
  if(impact)p.specialRoundImpact=function(b,e){
   const result=impact.call(this,b,e);if(b.patrol||b.flak||b.rocket||b.cow37||b.motorCannon)return result;
   const material=impactMaterial(e,b),index=++state.impactSerial;
   state.impacts.push({x:b.x,y:b.y,a:Math.atan2(b.vy,b.vx),material,age:0,life:.22+(index%3)*.035});
   cap(state.impacts,COMBAT_FEEDBACK_LIMITS.compactImpacts,COMBAT_FEEDBACK_LIMITS.impacts);
   state.pendingImpact=true;play('materialImpact',material);return result;
  };
 }
 const update=world.update;
 world.update=function(dt,...args){
  const before=this.t||0,result=update.call(this,dt,...args),step=Math.min(.04,Math.max(0,(this.t||0)-before));
  if(!step)return result;
  const players=(this.players||[this]).filter(p=>p.hp>0&&(!p.status||p.status==='alive'));
  state.time=this.t;state.camera=Math.max(0,state.camera-step*9);
  for(const p of players)pose(p,this.t,step);
  for(const e of this.enemies||[])if(ordinary(e)&&e.hp>0)pose(e,this.t,step);
  for(const f of state.impacts)f.age+=step;state.impacts=state.impacts.filter(f=>f.age<f.life);
  for(const w of state.wrecks){
   w.age+=step;const turn=w.style==='spin'?3.2:w.style==='breakup'?1.5:w.style==='runaway'?.35:.16;
   w.a+=turn*w.side*step;const heading=w.style==='runaway'?w.a:w.heading;
   w.x+=Math.cos(heading)*w.speed*step;w.y+=Math.sin(heading)*w.speed*step;w.speed*=Math.exp(-step*.35);
   if(w.age>=w.nextTrail){w.nextTrail=w.age+(compact()?.12:.08);state.trail.push({x:w.x,y:w.y,age:0,life:.65,a:w.a,fire:w.style==='fire'||w.style==='breakup'})}
  }
  state.wrecks=state.wrecks.filter(w=>w.age<w.life);
  for(const f of state.trail)f.age+=step;state.trail=state.trail.filter(f=>f.age<f.life);cap(state.trail,COMBAT_FEEDBACK_LIMITS.compactTrail,COMBAT_FEEDBACK_LIMITS.trail);
  if(this.state==='playing'&&players.length){
   const p=players[0];
   if(this.t>=state.nextEngine){state.nextEngine=this.t+.14;play('flightEngine',{speed:p.airframeSpeed??1,turn:Math.abs(poses.get(p)?.turn||0),damage:clamp(1-p.hp/p.maxHp)});
    let nearest=null,distance=1000;
    for(const e of this.enemies||[]){if(e.hp<=0||e.fieldUnit||e.surface||e.stationary)continue;const d=Math.min(...players.map(p=>Math.hypot(e.x-p.x,e.y-p.y)));if(d<distance){nearest=e;distance=d}}
    if(nearest)play('enemyEngine',{distance,heavy:!!(nearest.heavyBomber||nearest.type==='bomber'||nearest.type==='zeppelin'||nearest.type==='boss'),firing:nearest.muzzleFlash>0});
   }
   if(this.t>=state.nextHeavy){state.nextHeavy=this.t+.7;let distance=1400;for(const e of this.enemies||[])if(e.hp>0&&(e.heavyBomber||e.type==='bomber'||e.type==='zeppelin'||e.type==='boss'||e.stageBossBody))distance=Math.min(distance,...players.map(p=>Math.hypot(e.x-p.x,e.y-p.y)));if(distance<1400)play('heavyApproach',distance)}
   for(const e of this.enemies||[]){
    if(e.hp<=0||e.surface||e.stationary||e.fieldUnit)continue;
    let prior=state.previous.get(e);if(!prior){prior=new WeakMap();state.previous.set(e,prior)}
    for(const p of players){
     const d=Math.hypot(e.x-p.x,e.y-p.y),pass=prior.get(p)||{distance:d,armed:false,passed:false},radial=(d-pass.distance)/step;
     if(d>180){pass.passed=false;pass.armed=false}
     if(!pass.passed&&d<180&&radial< -30)pass.armed=true;
     if(pass.armed&&pass.distance<95&&radial>30){pass.armed=false;pass.passed=true;if(this.t>=state.nextPass){state.nextPass=this.t+.7;state.camera=Math.max(state.camera,.65);play('closePass');pulse('pass')}}
     pass.distance=d;prior.set(p,pass);
    }
   }
   for(const b of this.bullets||[]){
    if(!b.enemy||b.life<=0||state.whizzed.has(b)||b.flak)continue;
    const ax=b.previousX??b.x-b.vx*step,ay=b.previousY??b.y-b.vy*step,dx=b.x-ax,dy=b.y-ay,length=dx*dx+dy*dy;
    for(const p of players){const u=length?clamp(((p.x-ax)*dx+(p.y-ay)*dy)/length):0,d=Math.hypot(ax+dx*u-p.x,ay+dy*u-p.y);if(d>22&&d<68){state.whizzed.add(b);if(this.t>=state.nextNear){state.nextNear=this.t+.18;play('whizz')}break}}
   }
  }
  return result;
 };
 return state;
}
export function combatCameraOffset(world){const s=worlds.get(world);return s?{x:Math.sin(s.time*83)*s.camera,y:Math.cos(s.time*71)*s.camera}:{x:0,y:0}}
export function drawCombatFeedback(c,world,point,{fx,planeSprite}){
 const s=worlds.get(world);if(!s)return;
 const visible=(x,y)=>Math.abs(x-world.x)<(world.viewWidth||960)+160&&Math.abs(y-world.y)<(world.viewHeight||700)+160;
 for(const e of world.enemies||[])if(ordinary(e)&&e.hp>0&&e.hp/e.maxHp<.3&&visible(e.x,e.y)){const [x,y]=point(e.x,e.y);fx(c,'fireSmall',x-Math.cos(e.a)*12,y-Math.sin(e.a)*12,18,18,e.a,.45+Math.sin(s.time*21)*.12);}
 for(const f of s.trail){if(!visible(f.x,f.y))continue;const [x,y]=point(f.x,f.y),k=f.age/f.life;fx(c,'smokeDark',x,y,20+k*28,20+k*28,f.a,(1-k)*.42);if(f.fire)fx(c,'fireSmall',x,y,22*(1-k),22*(1-k),f.a,(1-k)*.55)}
 for(const w of s.wrecks){if(!visible(w.x,w.y))continue;const [x,y]=point(w.x,w.y),k=w.age/w.life;c.save();c.globalAlpha*=Math.min(1,(1-k)*3);planeSprite(c,x,y,w.a,w.key,w.scale*(1-k*.55),true,false,0,true);c.restore();if(w.style==='breakup')fx(c,'debris',x+Math.sin(w.a)*w.age*24,y-Math.cos(w.a)*w.age*24,30,30,w.a+w.age*3,1-k)}
 for(const f of s.impacts){if(!visible(f.x,f.y))continue;const [x,y]=point(f.x,f.y),k=f.age/f.life,size=f.material==='metal'?21:28;fx(c,f.material==='metal'?'armorSpark':f.material==='fabric'?'smokePuff':'debris',x,y,size*(.8+k*.5),size,f.a,1-k);if(f.material==='wood')fx(c,'spark',x,y,12,12,f.a,(1-k)*.5)}
}

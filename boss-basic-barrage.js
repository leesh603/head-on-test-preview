import {armorGunMuzzle,armorAngleDelta} from './trench-armor-layout.js?v=raid1';
import {alpsMuzzle} from './alps-bomber-layout.js?v=raid1';
import {harborMuzzle} from './harbor-crane-layout.js?v=raid1';
import {sommeMuzzle,sponsonAim} from './somme-boss-layout.js?v=raid1';
import {treffasPoint} from './cambrai-layout.js?v=raid1';

// Ordinary fire is separate from the raid controller. Only authored weapons
// fire; destroying one removes its lane. No new HP or difficulty multipliers.
const profile=(ports,visual,spread=1.05,count=7,interval=1.65,script=null,damage=.5)=>({ports,visual,spread,count,interval,script,damage});
// Script shorthands. Each tier list loops; 'rest' is the counter-attack window.
const R='rest',R2={p:'rest',t:1.5};
const sweep2={p:'sweep',passes:2},sweep2p={p:'sweep',passes:2,pair:true},ripple4={p:'ripple',rows:4},stream2={p:'stream',lanes:2},ring3={p:'ring',waves:3};
export const BASIC_BARRAGES=Object.freeze({
 // Rail guns: the rear car's machine guns hose along the track.
 'paris-gun':profile(['car-rear'],'rail-mg',.9,7,1.55,[['wall','stream',R2],['wall','sweep',R],[{p:'wall',rows:2},'stream','bracket',R]]),
 lincomparable:profile(['car-rear'],'rail-mg',1.1,7,1.8,[['bracket','wall',R2],['sweep','wall',R],[{p:'wall',rows:2},sweep2p,R]]),
 // Ships: paired guns cross, broadside rows walk.
 'sms-stuttgart':profile(['gun0','gun1','gun2','gun3'],'stuttgart-flak',1.1,7,1.65,[['wall','cross',R2],['cross','wall','ripple',R],[{p:'wall',rows:2},'cross',ripple4,R]]),
 'hms-zubian':profile(['frontGun','rearGun'],'zubian-shell',1.15,7,1.65,[['wall',R2],['wall','ripple',R],[{p:'wall',rows:2},'cross',R]]),
 'hms-zubian-front':profile(['frontGun'],'zubian-shell',1.15,7,1.65,[['ripple','wall',R2],['wall','bracket',R],[{p:'wall',rows:2},ripple4,R]]),
 'hms-zubian-rear':profile(['rearGun'],'zubian-shell',1.15,7,1.65,[['bracket','wall',R2],['wall','ripple',R],[{p:'wall',rows:2},'bracket',R]]),
 // Armour: turrets traverse (A7V) or sponsons cross (Mark V).
 'a7v-flak':profile(['front','right','rear','left'],'aa-shell',1.05,7,1.1,[['sweep','fan',R2],[sweep2,'cross',R],[sweep2p,'cross','ripple',R]]),
 'mark-v-cruiser':profile(['sponson-left','sponson-right'],'aa-shell',1.1,7,1.3,[['cross','stream',R2],['cross','stream','ripple',R],['cross',stream2,'ripple',R]]),
 // Trenches: embers sweep slowly; mortars rake in rows from three pits.
 'livens-flame-projector':profile([],'livens-ember',.95,5,1.6,[[{p:'sweep',speed:.85},'fan',R2],[{p:'sweep',passes:2,speed:.85},'bracket',R],[{p:'sweep',passes:2,pair:true,speed:.85},'ripple',R]]),
 'minenwerfer-battery':profile(['gun-left','main-gun','gun-right'],'aa-shell',1.3,7,1.8,[['wall','cross',R2],['ripple','wall','bracket',R],[{p:'wall',rows:2},'cross',ripple4,R]]),
 // City air defence: gondola guns stream and cross between airships.
 'drachen-net':profile(['airship-0','airship-1','airship-2'],'city-mg',1.2,7,1.6,[['stream','cross',R2],['cross','stream','bracket',R],['cross',stream2,'bracket',R]]),
 'london-apron-raid':profile(['airship-0','airship-1','airship-2'],'city-mg',1.05,7,1.7,[['cross','stream',R2],['cross','sweep',R],[sweep2,'cross',R]]),
 'flak-tower-cell':profile(['gun-bl','gun-br'],'city-mg',1.2,7,2.1,[['sweep',R2],['sweep','bracket',R],[sweep2,'bracket',R]]),
 // Airships: all-round gun galleries.
 'zeppelin-l70':profile(['engine-0','engine-2','engine-4','engine-6'],'zeppelin-flak',1.2,7,1.55,[[{p:'ring',guns:2},'wall',R2],[{p:'ring',guns:3},'wall','cross',R],[ring3,{p:'wall',rows:2},R]]),
 hma23:profile(['port-0','port-1','port-2','port-3'],'airship-flak',1.2,7,1.55,[['wall',{p:'ring',guns:2},R2],[{p:'ring',guns:3},'wall','bracket',R],[ring3,{p:'wall',rows:2},R]]),
 // Bombers: gunners hose and traverse.
 gik:profile(['rearGun'],'alps-mg',.9,7,1.5,[['stream','sweep',R2],['stream','sweep','bracket',R],[stream2,sweep2,R]]),
 ca4:profile(['frontGun','rearGun'],'alps-mg',1.05,7,1.5,[['stream','cross',R2],['sweep','cross','stream',R],[sweep2,'cross',R]]),
 'armored-harbor-fortress':profile(['gun-left','gun-right','gun-front-left','gun-front-right'],'harbor-shell',1.15,7,1.5,[['wall','cross',R2],['cross','wall','ripple',R],['sweep',{p:'wall',rows:2},ripple4,R]]),
 fliegerzug:profile(['car-flak','car-rear'],'rail-mg',1.1,7,1.6,[['wall','stream',R2],['cross','wall',R],[{p:'wall',rows:2},stream2,R]]),
 'treffas-wagen':profile([],'treffas-mg',.95,7,1.55,[['sweep','fan',R2],[sweep2,'bracket',R],[sweep2p,'bracket',R]]),
 // Ace formations: bracketing bursts from the leader's guns.
 'jasta11-circus':profile([],'aa-shell',.45,5,1.3,[['bracket',R2],['bracket','stream',R],['bracket',stream2,R]]),
 'naval10-black-flight':profile([],'aa-shell',.6,5,1.45,[['stream',R2],['stream','bracket',R],[stream2,'bracket',R]]),
 'mark4-wedge':profile(['sponson-left','sponson-right'],'somme-mg',.85,5,2,[['stream',R2],['cross','stream',R],['cross',stream2,R]]),
 'morser-battery':profile(['mg-left','mg-right','twin-aa'],'somme-mg',1.2,7,1.6,[['wall','cross',R2],['cross','ripple','wall',R],[{p:'wall',rows:2},ripple4,'sweep',R]]),
 'gotha-raider':profile(['rear-gun'],'gotha-mg',1.05,5,2.1,[['stream',R2],['sweep','stream',R],[stream2,'sweep',R]]),
 // Fortresses: casemates cross, then the whole work fires round.
 'fort-douaumont':profile(['mg-left','mg-right','aa-left','aa-right'],'verdun-mg',1.25,7,1.65,[['wall','cross',R2],['cross','wall','bracket',R],['ring',{p:'wall',rows:2},ripple4,R]]),
 'fort-souville':profile(['bunker-left','bunker-right','aa-left','aa-right'],'verdun-mg',1.25,7,1.65,[['ripple','wall',R2],['sweep','wall','cross',R],[sweep2,{p:'wall',rows:2},'ring',R]]),
 wustenpanzer:profile(['aa-left','aa-right'],'maan-mg',1.05,7,1.6,[['sweep','cross',R2],[sweep2,'cross',R],[sweep2p,'cross',R]]),
 'sinai-landship':profile(['lewis'],'maan-mg',1.2,7,1.5,[['stream','fan',R2],['stream','bracket',R],[stream2,'bracket','sweep',R]]),
 'gallipoli-fortress':profile(['aa-west','aa-east','aa-citadel'],'gallipoli-mg',1.2,7,1.5,[['wall','cross',R2],['ring','wall',R],[ring3,{p:'wall',rows:2},'sweep',R]]),
 'paris-searchlight-fortress':profile(['mg-left','mg-right'],'paris-mg',1.1,7,1.8,[['wall','stream',R2],['cross','wall',R],[{p:'wall',rows:2},stream2,'bracket',R]]),
 'paris-staaken-rvi':profile(['gun-front','gun-top','gun-rear','gun-left','gun-right'],'staaken-mg',.95,7,1.6,[['ring','stream',R2],['ring','cross',R],[ring3,'cross',R]]),
 'jutland-battleship':profile(['bow-port','bow-starboard','aft-port','aft-starboard'],'zubian-shell',1.2,7,2,[['wall',R2],['wall','ripple',R],[{p:'wall',rows:2},'cross',R]]),
 'jutland-cruiser':profile(['bow','aft'],'zubian-shell',1.05,5,2.2,[['fan',R2],['bracket',R],['ripple','bracket',R]])
});
const quietPhase=/(arrival|entry|buried|lowering|recover|cooldown|reform|service|depressurized|gliding|seam-warning|splitting)/;
export function basicFirePaused(b){
 return b.dead||b.hidden||b.phase==='approach'&&(b.combatTime||0)<4||
  b.kind==='armored-harbor-fortress'&&(b.elapsed<3||b.craneState==='recover')||
  b.kind==='gallipoli-fortress'&&(b.entryAge<5||b.pendingAttack?.kind==='final')||
  b.kind==='paris-searchlight-fortress'&&b.phase==='last-stand'||
  b.kind==='sinai-landship'&&!!b.encirclement||
  b.kind==='livens-flame-projector'&&(b.trenchEntry?.state!=='active'||b.lockedFlameAngle!=null)||
  b.kind==='mark4-wedge'&&(!b.discovered||/mark1-(approach|regroup|counter|last-push)/.test(String(b.phase)))||
  b.formationBoss129&&b.finalAge!=null||quietPhase.test(String(b.phase))||
  b.entryAge<(b.entryDuration||0)||b.formationBoss129&&!b.entryComplete||
  b.recovery>0||b.recoveryRemaining>0||b.serviceWindow>0||b.recoverLeft>0||
  b.rotation?.stage==='recover'||b.rotation?.stage==='windup'||b.rotation?.stage==='breakthrough'||
  b.fleet?.phase==='reform'||b.finalAim||b.stormActive||
  (b.basicHoldUntil||0)>(b.combatTime||0);
}
function mount(b,p,target,serial){
 const k=b.kind,aim=Math.atan2(target.y-b.y-(p?.y||0),target.x-b.x-(p?.x||0));
 let q={x:b.x+(p?.x||0),y:b.y+(p?.y||0),angle:aim};
 if(k==='livens-flame-projector'){const n=b.nozzleMount,a=b.nozzleAngle;q={x:b.x+n.x+Math.cos(a)*n.length,y:b.y+n.y+Math.sin(a)*n.length,angle:a};}
 else if(k==='a7v-flak'||k==='mark-v-cruiser'){
  const m=armorGunMuzzle(k,p,b.hullYaw,b.t.geometryScale||1);
  q={x:b.x+m.x,y:b.y+m.y,angle:m.angle,arc:b.layout.gunArc,base:b.hullYaw+p.baseAngle};
 }else if(b.cityArtKind){
  const index=Number(p.id.at(-1)),points=b.cityArtKind==='drachen-net'?[[154,295],[441,292],[641,432]]:[[123,193],[384,199],[646,193]];
  q={...b.point(...points[index],index),angle:aim};
 }else if(b.ruralRailBoss){q.y-=145;}
 else if(k==='fliegerzug'){q.y-=45;}
 else if(k==='gik'||k==='ca4'){
  const base=b.hullYaw+(p.id==='rearGun'?Math.PI/2:-Math.PI/2);
  q={...alpsMuzzle(b,p.id,aim),angle:base+Math.max(-1.2,Math.min(1.2,armorAngleDelta(aim,base))),arc:1.2,base};
 }else if(k==='armored-harbor-fortress'){q={...harborMuzzle(b,p),angle:p.angle};}
 else if(k==='mark4-wedge'||k==='morser-battery'){
  q={...sommeMuzzle(b,p),angle:p.angle};
  if(k==='mark4-wedge'){const a=sponsonAim(b,p,target.x,target.y);if(!a.reachable)return null;q.angle=a.angle;q.arc=.45;q.base=b.hullYaw+(p.id==='sponson-left'?Math.PI:0);}
 }else if(k==='minenwerfer-battery'){
  if(!p.discovered)return null;q={...b.muzzle(p),angle:aim};
 }else if(k==='treffas-wagen'){q={...treffasPoint(b,serial%2?-64:64,-24),angle:aim};}
 else if(b.formationBoss129){q={x:b.x+Math.cos(b.a)*30,y:b.y+Math.sin(b.a)*30,angle:b.a};}
 else if(k==='gotha-raider'){
  const base=b.a+Math.PI;q.angle=base+Math.max(-1.1,Math.min(1.1,armorAngleDelta(aim,base)));q.base=base;q.arc=1.1;
 }else if(k==='flak-tower-cell'){q={...b.muzzle(p),angle:p.angle};}
 else if(k.startsWith('fort-')){
  const length=p.muzzleLength||0;q={x:q.x+Math.cos(p.angle)*length,y:q.y+Math.sin(p.angle)*length,angle:p.angle};
 }else if(k==='gallipoli-fortress'){
  q={x:q.x+Math.cos(p.angle)*(p.muzzle||0),y:q.y+Math.sin(p.angle)*(p.muzzle||0),angle:p.angle};
 }else if(k.startsWith('jutland-')){
  const length=p.row===1?85:128;q={x:q.x+Math.cos(p.angle)*length,y:q.y+Math.sin(p.angle)*length,angle:p.angle};
 }
 return q;
}
function emit(b,e){b.emit({...e,bossId:b.id,faction:b.faction});}
export function updateBasicBarrage(b,dt,ctx){
 const config=BASIC_BARRAGES[b.kind];if(!config)return false;
 if(ctx.paused||dt<=0)return true;
 if(basicFirePaused(b)){if(!b.basicPaused&&b.basicSerial)emit(b,{type:'cancel-hazards',tag:b.id+':basic-fire'});b.basicPaused=true;b.basicClock=.55;return true;}
 b.basicPaused=false;
 b.basicClock=(b.basicClock??(1+(b.slot||b.index||0)*.27))-dt;if(b.basicClock>0)return true;
 const players=ctx.players||[],serial=b.basicSerial||0;let live=0;for(const p of players)if(p.alive)live++;
 if(!live)return true;let cursor=serial%live,target;for(const p of players)if(p.alive&&cursor--===0){target=p;break;}
 // Rank every physical weapon that can cover the current target. A modest
 // alternation bias prevents one gun monopolising ordinary volleys.
 const mounts=[];
 for(let i=0;i<Math.max(1,config.ports.length);i++){
  const id=config.ports[(i+serial)%config.ports.length],p=id&&b.parts.get(id);
  if(id&&(!p||p.destroyed||p.active===false||p.revealed===false))continue;
  const q=mount(b,p,target,serial);if(!q)continue;
  const distance=Math.hypot(target.x-q.x,target.y-q.y),angle=Math.atan2(target.y-q.y,target.x-q.x);
  const rank=distance+Math.abs(armorAngleDelta(angle,q.angle))*250+i*24;
  if(distance<1100)mounts.push({p,q,rank});
 }
 if(!mounts.length){b.basicClock=.25;return true;}
 mounts.sort((m,n)=>m.rank-n.rank);
 // A fleet/network shares one ordinary-fire beat rather than multiplying its
 // screen density by the number of bodies. Signature attacks remain native.
 const encounter=b.encounter,now=b.combatTime||0;
 if(encounter&&(encounter.basicNext||0)>now){b.basicClock=.18;return true;}
 if(ctx.canBasicFire&&!ctx.canBasicFire()){b.basicClock=.35;return true;}
 const step=nextStep(b,config);
 const length=fireStep(b,config,step,mounts,target,serial);
 if(encounter)encounter.basicNext=now+Math.max(.72,length*.8);
 b.basicClock=length;b.basicSerial=serial+1;
 return true;
}

// ---- Authored ordinary-fire phrases -------------------------------------
// Each boss owns a short script per health tier, built from the primitives
// below and fired from its real guns in its own ammunition. Every phrase has a
// telegraph (dashed muzzle line), a deliberate opening and a rest beat after it.
// Tiers: >66% health, >33%, below. Losing guns removes their lanes.
const encounterRatio=b=>{const e=b.encounter;if(!e?.bodies)return b.hp/b.maxHp;let hp=0;for(const x of e.bodies.values())hp+=Math.max(0,x.hp);return hp/(e.maxHpBudget||b.maxHp);};
function nextStep(b,config){
 const tiers=config.script||DEFAULT_SCRIPT,ratio=encounterRatio(b),tier=ratio>.66?0:ratio>.33?1:2;
 const list=tiers[Math.min(tier,tiers.length-1)];
 if(b.basicTier!==tier){b.basicTier=tier;b.basicCursor=0;}
 const step=list[(b.basicCursor||0)%list.length];b.basicCursor=(b.basicCursor||0)+1;
 return typeof step==='string'?{p:step}:step;
}
const DEFAULT_SCRIPT=[['fan','rest'],['fan','ripple','rest'],['ripple','bracket','rest']];
function clampArc(q,a,half=0){return q.arc?q.base+Math.max(-q.arc+half,Math.min(q.arc-half,armorAngleDelta(a,q.base))):a;}
function fireStep(b,config,step,mounts,target,serial){
 const kind=step.p,warning=step.warning??.6,tag=b.id+':basic-fire';
 const base=Math.max(225,Math.min(330,b.t.bulletSpeed*.85)),speed=base*(step.speed||1);
 const damage=b.t.damage*(config.damage??.5);
 const shot=(m,a,delay,extra)=>{const q=m.q,p=m.p;emit(b,{type:'hazard',kind:'projectile',x:q.x,y:q.y,vx:Math.cos(a)*speed*(extra?.speed||1),vy:Math.sin(a)*speed*(extra?.speed||1),
  partId:p?.id,sourceX:q.x,sourceY:q.y,sourcePartId:p?.id,sourceOffsetX:p?q.x-b.x-p.x:0,sourceOffsetY:p?q.y-b.y-p.y:0,
  basicSerial:serial,basicMuzzle:!!extra?.muzzle,radius:4,damage,delay,warning:0,
  duration:Math.min(3.4,Math.max(2,Math.max(Math.hypot(target.x-q.x,target.y-q.y),Math.hypot(target.x+(target.vx||0)*2-q.x,target.y+(target.vy||0)*2-q.y))/(speed*(extra?.speed||1))+.6)),visual:config.visual,tag});};
 const cue=(m,a,seconds=warning)=>emit(b,{type:'charge-warning',x:m.q.x,y:m.q.y,targetX:m.q.x+Math.cos(a)*420,targetY:m.q.y+Math.sin(a)*420,seconds,partId:m.p?.id,basicFire:true});
 const aimOf=m=>clampArc(m.q,Math.atan2(target.y-m.q.y,target.x-m.q.x));
 // Aircraft never stop, so a round aimed at the pilot's current position only
 // punishes flying straight at the gun. Phrases are centred between where the
 // pilot is and where they will be (0.8 of the lead): turning, not just
 // cruising, is what clears them.
 const leadOf=(m,k=1)=>{const v=Math.hypot(target.vx||0,target.vy||0);if(v<20)return aimOf(m);
  // Intercept: the round leaves after the warning and flies at `speed`.
  let tt=warning;for(let i=0;i<4;i++)tt=Math.min(2.6,warning+Math.hypot(target.x+(target.vx||0)*tt-m.q.x,target.y+(target.vy||0)*tt-m.q.y)/speed);
  tt*=k;return clampArc(m.q,Math.atan2(target.y+(target.vy||0)*tt-m.q.y,target.x+(target.vx||0)*tt-m.q.x));};
 const m=mounts[0],now=aimOf(m),ahead=leadOf(m),aim=now+armorAngleDelta(ahead,now)*.5;
 const flat=b.kind==='livens-flame-projector'&&b.parts.get('pressure')?.destroyed;
 if(kind==='rest'){return step.t??1.1;}
 if(kind==='fan'||flat){
  // One aimed fan with an alternating off-centre opening.
  const n=flat?3:step.n||config.count,spread=Math.min(step.spread||config.spread,m.q.arc?2*m.q.arc:9),a0=clampArc(m.q,aim,spread/2);cue(m,a0);
  for(let i=0;i<n;i++){if(n>=7&&i===(serial%2?n-2:1))continue;shot(m,a0+(i/(n-1)-.5)*spread,warning,{muzzle:i===0});}
  return step.t??config.interval;
 }
 if(kind==='ripple'){
  // Rows from one gun; each row's opening steps sideways, so the pilot walks
  // with the gap instead of holding still.
  const rows=step.rows||3,n=step.n||9,spread=Math.min(step.spread||config.spread*1.1,m.q.arc?2*m.q.arc:9),beat=step.beat||.36,a0=clampArc(m.q,aim,spread/2);
  const dir=serial%2?1:-1,start=Math.floor(n/2)-dir*Math.floor(rows/2);cue(m,a0);
  for(let r=0;r<rows;r++){const hole=start+dir*r;for(let i=0;i<n;i++){if(i===hole||i===hole+1)continue;shot(m,a0+(i/(n-1)-.5)*spread,warning+r*beat,{muzzle:i===0});}}
  return warning+(rows-1)*beat+(step.t??1.1);
 }
 if(kind==='sweep'){
  // A traversing gun: three-round bursts walk across the pilot's bearing from
  // just behind them to well past their lead, a solid curtain with one
  // two-burst opening. Doubling back, or turning behind the first burst,
  // also clears it.
  const arc=step.arc||1.3,pitch=step.pitch||.2,n=Math.max(4,Math.round(arc/pitch)+1),beat=step.beat||.07,passes=step.passes||1;
  const along=armorAngleDelta(ahead,now);let dir=Math.abs(along)>.05?Math.sign(along):serial%2?1:-1,t=warning;
  const half=arc/2,centre=clampArc(m.q,now+dir*half*.75,m.q.arc?Math.min(half,m.q.arc):0);
  cue(m,clampArc(m.q,centre-dir*half));cue(m,clampArc(m.q,centre+dir*half),warning+n*beat*.6);
  for(let pass=0;pass<passes;pass++){
   const gap=pass%2?n-3-(serial%2):2+(serial%2);
   for(let i=0;i<n;i++){if(i===gap||i===gap+1){t+=beat;continue;}const a=clampArc(m.q,centre+dir*(-half+i*arc/(n-1)));
    for(let k=-1;k<=1;k++)shot(m,clampArc(m.q,a+k*pitch/3*dir),t+(k+1)*.02,{muzzle:i===0&&k===-1});
    if(step.pair)shot(m,a+pitch*.5*dir,t+beat*.5);t+=beat;}
   dir=-dir;t+=step.turn||.3;
  }
  return t+(step.t??.9);
 }
 if(kind==='stream'){
  // A machine-gun burst committed to the warned bearing, walking slightly
  // toward where the pilot was heading.
  const n=step.n||8,beat=step.beat||.085,v=Math.hypot(target.vx||0,target.vy||0);
  const lead=v>20?armorAngleDelta(leadOf(m,1),now):0,aim=now;
  const lanes=step.lanes||1;cue(m,aim);
  for(let i=0;i<n;i++){const w=Math.sin(i*1.9)*.035,a=clampArc(m.q,aim+lead*i/(n-1)+w);
   for(let l=0;l<lanes;l++)shot(m,a+(l-(lanes-1)/2)*.2,warning+i*beat,{muzzle:i===0&&l===0});}
  return warning+n*beat+(step.t??.9);
 }
 if(kind==='bracket'){
  // Two short fans: one where the pilot is, one where they are going. The
  // opening between them is the safe line; turning hard also works.
  const side=serial%2?1:-1,lead=armorAngleDelta(leadOf(m,1.1),now)||side*.42;
  const off=Math.sign(lead)*Math.max(.3,Math.min(.6,Math.abs(lead)));
  const aim=now;
  const n=step.n||4,spread=step.spread||.22;cue(m,aim);cue(m,clampArc(m.q,aim+off),warning+.25);
  for(const [centre,delay] of [[aim,warning],[aim+off,warning+.25]])for(let i=0;i<n;i++)shot(m,clampArc(m.q,centre+(i/(n-1)-.5)*spread),delay,{muzzle:i===0});
  return warning+.25+(step.t??1.3);
 }
 if(kind==='cross'){
  // Two separate guns rake the pilot from two bearings a beat apart. The
  // second gun aims at the side the first one pushed the pilot to.
  const other=mounts.find(n=>n!==m&&Math.hypot(n.q.x-m.q.x,n.q.y-m.q.y)>60);
  if(!other)return fireStep(b,config,{...step,p:'ripple'},mounts,target,serial);
  const n=step.n||7,spread=step.spread||.5;
  const a1=aim,a2=leadOf(other,1);cue(m,a1);cue(other,a2,warning+.42);
  for(let i=0;i<n;i++)shot(m,clampArc(m.q,a1+(i/(n-1)-.5)*spread),warning,{muzzle:i===0});
  for(let i=0;i<n;i++){if(i===Math.floor(n/2)-(serial%2))continue;shot(other,clampArc(other.q,a2+(i/(n-1)-.5)*spread*1.4),warning+.42,{muzzle:i===0});}
  return warning+.42+(step.t??1.4);
 }
 if(kind==='ring'){
  // All-round defensive fire: every live gun fires an outward arc from its own
  // mount. Two staggered waves interleave; the wedge facing the pilot opens
  // on alternate phrases.
  const per=step.n||6,arc=step.arc||1.1,waves=step.waves||2;
  const live=mounts.slice(0,step.guns||4);
  for(const g of live){const out=Math.atan2(g.q.y-b.y,g.q.x-b.x),centre=Number.isFinite(out)&&Math.hypot(g.q.x-b.x,g.q.y-b.y)>20?out:aimOf(g);cue(g,centre);
   for(let w=0;w<waves;w++)for(let i=0;i<per;i++){const a=centre+((i+(w%2)*.5)/(per-.5)-.5)*arc;
    if(Math.abs(armorAngleDelta(a,aimOf(g)))<.16&&(serial+w)%2===0)continue;
    shot(g,a,warning+w*.45,{speed:.78,muzzle:i===0&&w===0});}}
  return warning+(waves-1)*.45+(step.t??1.6);
 }
 if(kind==='wall'){
  // A broadside: rounds leave every port along the hull on parallel courses,
  // a moving fence 34 px apart with one opening offset from the pilot. The
  // fence does not spread with range, so the opening stays as wide as it looks.
  const ends=mounts.length>1?[m,mounts.reduce((f,n)=>Math.hypot(n.q.x-m.q.x,n.q.y-m.q.y)>Math.hypot(f.q.x-m.q.x,f.q.y-m.q.y)?n:f,mounts[1])]:[m,m];
  const dirx=Math.cos(aim),diry=Math.sin(aim),nx=-diry,ny=dirx;
  const cx=(ends[0].q.x+ends[1].q.x)/2,cy=(ends[0].q.y+ends[1].q.y)/2;
  const half=Math.max(step.half||170,Math.abs((ends[1].q.x-ends[0].q.x)*nx+(ends[1].q.y-ends[0].q.y)*ny)/2+40);
  const pitch=34,count=Math.floor(half*2/pitch)+1;
  const lateral=(target.x-cx)*nx+(target.y-cy)*ny,holeAt=lateral+(serial%2?1:-1)*(step.offset??64);
  const rows=step.rows||1;cue(m,aim);if(ends[1]!==m)cue(ends[1],aim);
  for(let r=0;r<rows;r++){const shift=r%2?pitch/2:0,hole=holeAt+(r%2?-1:1)*(step.drift||0)*r;
   for(let i=0;i<count;i++){const off=-half+i*pitch+shift;if(Math.abs(off-hole)<46)continue;
    const src=Math.abs(off-((ends[0].q.x-cx)*nx+(ends[0].q.y-cy)*ny))<Math.abs(off-((ends[1].q.x-cx)*nx+(ends[1].q.y-cy)*ny))?ends[0]:ends[1];
    const x=cx+nx*off,y=cy+ny*off;
    emit(b,{type:'hazard',kind:'projectile',x,y,vx:dirx*speed,vy:diry*speed,radius:4,damage,delay:warning+r*(step.beat||.42),warning:0,
     duration:Math.min(3.4,Math.max(2,Math.hypot(target.x-x,target.y-y)/speed+.7)),visual:config.visual,tag,basicSerial:serial,basicMuzzle:false});}}
  // The guns at each end of the fence carry the muzzle flash and recoil.
  for(const e of new Set(ends))if(e.p)shot(e,aim,warning,{muzzle:true});
  return warning+(rows-1)*(step.beat||.42)+(step.t??1.2);
 }
 return fireStep(b,config,{p:'fan'},mounts,target,serial);
}

export function basicBarrageMuzzle(b,h){
 // Broadside fence rounds leave the hull line itself, not a turret.
 if(!h.sourcePartId&&BASIC_BARRAGES[b.kind]?.ports.length)return null;
 const p=h.sourcePartId?b.parts.get(h.sourcePartId):null,a=Math.atan2(h.vy,h.vx);
 return mount(b,p,{x:b.x+Math.cos(a)*800,y:b.y+Math.sin(a)*800},h.basicSerial||0);
}

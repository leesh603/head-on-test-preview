/** Historical units; top-view encounter choreography is gameplay interpretation. */
import {squadronDamage,squadronDurability} from './squadron-elite-balance.js?v=09c75d146ae4289d';
import {arrivalViewport} from './enemy-arrivals.js?v=09c75d146ae4289d';
import {canAdmitSquadron,announceSquadron} from './squadron-combat-state.js?v=09c75d146ae4289d';
export const LEGEND_BALANCE=Object.freeze({sqn56:{plane:'se5a',faction:'entente',count:5,hp:66},jasta2:{plane:'albatros_d5a',faction:'central',count:5,hp:72},duration:24,commandWarning:.65,commandSpacing:.18,commandCycles:3,coverPasses:4,recovery:1.8});
const B=LEGEND_BALANCE,angle=a=>Math.atan2(Math.sin(a),Math.cos(a)),live=e=>e&&e.hp>0&&!e.crashing&&!e.expired,host=g=>!g.online||g.host;
const pilot=g=>g.players?.find(p=>p.hp>0&&p.status!=='downed')||g,pace=g=>Math.max(60,Math.min(320,(pilot(g).speed||150)*(pilot(g).airframeSpeed??1)*(pilot(g).pursuitSpeedFactor??1)));
const stage=g=>`${g.stageBoss?.stages?.loopIndex||0}:${g.stageBoss?.stages?.orderPosition||0}:${g.stageBoss?.stages?.stageIndex}`;
const members=g=>(g.enemies||[]).filter(e=>live(e)&&e.legendWingGroup===g.legendWing?.groupId&&e.legendWingUnit===g.legendWing?.unitId);
const visible=(g,e,m=0)=>{const v=arrivalViewport(g);return Math.abs(e.x-v.x)<v.w+m&&Math.abs(e.y-v.y)<v.h+m;};
const speed=(e,v)=>{e.speed=e.dogfightCruise=e.personalityCruise=e.cruiseSpeedCap=Math.max(60,v);};
const flightHistory=new WeakMap();
export function rememberSquadronFlight(g,es,maxTurn=1.05){const now=g.t||0;for(const e of es){const old=flightHistory.get(e),dt=old?now-old.at:0;flightHistory.set(e,{at:now,a:e.a,turn:dt>0&&dt<.2?Math.max(-maxTurn,Math.min(maxTurn,angle(e.a-old.a)/dt)):0});}}
function projectedFlight(e,t){const w=flightHistory.get(e)?.turn||0,v=e.speed*(e.energySpeed??1),a=e.a;if(Math.abs(w)<.001)return {x:e.x+Math.cos(a)*v*t,y:e.y+Math.sin(a)*v*t};return {x:e.x+v/w*(Math.sin(a+w*t)-Math.sin(a)),y:e.y-v/w*(Math.cos(a+w*t)-Math.cos(a))};}
export function squadronClearance(g,e,heading,es,slotKey,lead=0,maxTurn=1.05,desiredGap=100){
 const others=es.filter(q=>q!==e&&(q[slotKey]===lead||e[slotKey]!==lead&&q[slotKey]<e[slotKey]));
 if(!others.length)return heading;
 const close=others.filter(q=>Math.hypot(q.x-e.x,q.y-e.y)<520);if(!close.length)return heading;
 const step=.15,count=desiredGap>100?12:10,tracks=close.map(q=>Array.from({length:count},(_,i)=>projectedFlight(q,(i+1)*step))),wanted=e.speed;
 function clearance(a,v){let x=e.x,y=e.y,h=e.a,min=Infinity;for(let i=0;i<count;i++){h+=Math.max(-maxTurn*step,Math.min(maxTurn*step,angle(a-h)));x+=Math.cos(h)*v*step;y+=Math.sin(h)*v*step;for(const track of tracks)min=Math.min(min,Math.hypot(x-track[i].x,y-track[i].y));}return min;}
 if(clearance(heading,wanted)>=desiredGap)return heading;
 // Only the yielding pilot changes its native forward course. Predict the
 // actual bounded turns of both aircraft; a straight-line closest point is
 // insufficient while a five-aircraft formation is circling or reforming.
 let best=null;
 for(const a of [heading,e.a,e.a-.65,e.a+.65,e.a-1.25,e.a+1.25])for(const v of [wanted,Math.max(60,wanted*.6),Math.min(380,Math.max(wanted+80,260))]){
  const gap=clearance(a,v),cost=Math.max(0,desiredGap-gap)*1000+Math.abs(angle(a-heading))*28+Math.abs(v-wanted)*.06;
  if(!best||cost<best.cost)best={a,v,cost};
 }
 speed(e,best.v);return best.a;
}
let art;const pending=new Set(),failed=new Map();
export function configureLegendArt(hooks){art=hooks;pending.clear();failed.clear();}
function ready(id){if(typeof Image==='undefined')return true;if(art?.ready?.(id))return true;if(art&&!pending.has(id)&&Date.now()>=(failed.get(id)||0)){pending.add(id);Promise.resolve().then(()=>art.load(id)).then(()=>{if(!art.ready?.(id))failed.set(id,Date.now()+30000)}).catch(()=>failed.set(id,Date.now()+30000)).finally(()=>pending.delete(id));}return false;}
function blocked(g){return g.stageBoss?.stages?.phase!=='explore'||g.stageCombatWindow?.ready||['active','pending','dispatching'].includes(g.photoReconDirector?.phase)||g.battlefieldEvents?.current?.status==='active'||['warning','entering','active','retreating'].includes(g.intrusionBoss?.phase)||g.eliteEnemies?.active||g.londonBattle||g.parisBattle||g.verdunBattle||(g.battleRecoveryUntil||0)>(g.t||0)||(g.bossPresentationAfter||0)>(g.t||0)||(g.enemies||[]).some(e=>live(e)&&(e.bossPilot||e.type==='boss'||e.stageBossBody));}
function retreat(e,g){if(e.legendWingPhase==='exit')return;e.legendWingPhase='exit';e.legendWingPreparing=false;e.legendWingWarningLeft=0;e.legendWingHeading=e.a+(e.legendWingSlot%2?-.55:.55);e.fire=Infinity;e.missionTarget=false;speed(e,pace(g)+120);}
export function withdrawLegendWing(g,reason='priority'){if(!host(g)||!g.legendWing)return;g.legendWing.phase='exit';g.legendWing.outcome=reason;for(const e of members(g))retreat(e,g);}
/** Admission only: may warm artwork, never creates combat entities or consumes RNG. */
export function canSpawnLegendWing(g,id){
 const profile=B[id],p=pilot(g),own=g.stageBoss?.stages?.teamFaction||g.teamFaction;
 if(!profile||!host(g)||g.state!=='playing'||!(p.hp>0)||(g.players?.length&&!g.players.some(p=>p.hp>0&&p.status!=='downed'))||!['central','entente'].includes(own)||own===profile.faction||g.mode==='campaign'||g.historicalMode||g.stage?.historicalAnchorDate||blocked(g)||!canAdmitSquadron(g,id)||!ready(profile.plane)||(g.stageCombatWindow?.remaining??Infinity)<B.duration+8)return false;
 const es=(g.enemies||[]).filter(live);
 if(es.filter(e=>!e.bossPilot&&!e.heavyBomber&&['scout','hunter','bomber'].includes(e.type)).length+profile.count>(g.regularEnemyLimit?.()??12)||es.length+profile.count>(g.enemyCapacity?.()??65)-1)return false;
 return true;
}
export function spawnLegendWing(g,id){
 if(!canSpawnLegendWing(g,id))return false;
 const profile=B[id],p=pilot(g);
 const v=arrivalViewport(g),a=p.a||0,dx=Math.cos(a),dy=Math.sin(a),distance=Math.min(Math.abs(dx)>.001?(v.w+180)/Math.abs(dx):Infinity,Math.abs(dy)>.001?(v.h+180)/Math.abs(dy):Infinity),group=(g.legendSerial||0)+1,created=[],before=g.directorSpawning;g.directorSpawning=true;
 try{for(let i=0;i<profile.count;i++){const n=g.enemies.length,e=g.spawnEnemy?.('scout')||(g.enemies.length>n?g.enemies.at(-1):null);if(!e)break;
  for(const k of ['bankAircraft','bankHandlingBase','bankFireFactor','bankTurnFactor','formationLivery','directorSquad','directorFormation','frontRoute','eliteKind','personalityId','normalFormationFamily','formationLeader','isFormationCommander','directorSignals','dangerHeavy','dangerAimUntil','dangerAimAngle','airArrival','arrivalPending'])delete e[k];
  const front=id==='sqn56',along=front?distance+i*150:-distance-(i>=3?240:i?100:0),side=front?[-85,-210,210,-300,300][i]:commandSide(g,i),hp=Math.round(profile.hp*squadronDurability(g)),heading=front?a+Math.PI+(i?-.12:.12):a;
  Object.assign(e,{type:'scout',ace:false,legendWingUnit:id,legendWingGroup:group,legendWingSlot:i,legendWingLeader:i===0,legendWingPhase:'entry',legendWingHeading:heading,legendWingPreparing:false,legendWingWarningLeft:0,legendWingRounds:0,arrivalAuthored:true,missionTarget:true,battlefieldEventId:id+':'+group,escortPlane:profile.plane,visualScale:1,faction:profile.faction,name:id==='sqn56'?'No. 56 Squadron':'Jasta 2 · Boelcke',hp,maxHp:hp,energySpeed:1,fire:Infinity,hitRadius:20,contactRadius:17,x:v.x+dx*along-dy*side,y:v.y+dy*along+dx*side,a:heading});speed(e,front?100:Math.min(380,pace(g)+110));created.push(e);
 }}finally{g.directorSpawning=before;}
 if(created.length!==profile.count){g.enemies=g.enemies.filter(e=>!created.includes(e));return false;}
 g.legendSerial=group;g.legendWing={unitId:id,groupId:group,phase:'entry',age:0,elapsed:0,combatAge:0,cycle:0,commit:0,stageKey:stage(g),lastTime:g.t||0,entryHeading:a};
 announceSquadron(g,id,group);return created[0];
}
function phase(s,name){s.phase=name;s.age=0;}
function prep(e,left){e.legendWingPreparing=true;e.legendWingWarningLeft=left;}
function commandDepth(g,e){const v=arrivalViewport(g),a=g.legendWing?.entryHeading??pilot(g).a,half=Math.min(v.w/Math.max(.001,Math.abs(Math.cos(a))),v.h/Math.max(.001,Math.abs(Math.sin(a))));return Math.min(e.legendWingSlot===0?50:e.legendWingSlot>=3?170:130,Math.max(80,half-(e.legendWingSlot>=3?95:110)));}
function commandSide(g,slot){const v=arrivalViewport(g),a=pilot(g).a||0,half=Math.min(v.w/Math.max(.001,Math.abs(Math.sin(a))),v.h/Math.max(.001,Math.abs(Math.cos(a))));return slot===0?0:(slot%2?-1:1)*Math.min(slot>=3?230:115,Math.max(55,half-(slot>=3?45:115)));}
function beginCommand(g,s,es){const p=pilot(g);s.lockedPoint={x:p.x+Math.cos(p.a)*(300+pace(g)*.65),y:p.y+Math.sin(p.a)*(300+pace(g)*.65)};s.cycle++;phase(s,'command');for(const e of es){e.legendWingRounds=0;e.legendWingPhase='command';e.legendWingHeading=Math.atan2(s.lockedPoint.y-e.y,s.lockedPoint.x-e.x);prep(e,B.commandWarning+e.legendWingSlot*B.commandSpacing);speed(e,pace(g));}}
function leadAim(g,e){const p=pilot(g),rx=p.x-e.x,ry=p.y-e.y,vx=Math.cos(p.a)*pace(g),vy=Math.sin(p.a)*pace(g),A=vx*vx+vy*vy-420*420,Q=2*(rx*vx+ry*vy),C=rx*rx+ry*ry,t=Math.max(0,Math.min(1.8,(-Q-Math.sqrt(Math.max(0,Q*Q-4*A*C)))/(2*A)));return Math.atan2(ry+vy*t,rx+vx*t);}
// An actively pursued lure reveals the chase course before the cover warning.
function coverPoint(g,e){const p=pilot(g),s=g.legendWing,bait=s?.pursuitRequired?members(g).find(q=>q.legendWingSlot===(s.leadSlot??0)):null,course=bait&&Math.abs(angle(p.a-bait.legendWingHeading))<.65?bait.legendWingHeading:p.a,delay=.65,vx=Math.cos(course)*pace(g),vy=Math.sin(course)*pace(g),rx=p.x+vx*delay-e.x-Math.cos(e.a)*pace(g)*delay,ry=p.y+vy*delay-e.y-Math.sin(e.a)*pace(g)*delay,A=vx*vx+vy*vy-420*420,Q=2*(rx*vx+ry*vy),C=rx*rx+ry*ry,t=Math.max(0,Math.min(1.8,(-Q-Math.sqrt(Math.max(0,Q*Q-4*A*C)))/(2*A)));return {x:p.x+vx*(delay+t),y:p.y+vy*(delay+t)};}
function coverRunVisible(g,e,heading){const p=pilot(g),v=arrivalViewport(g),time=1.05,dx=(Math.cos(heading)-Math.cos(p.a))*pace(g)*time,dy=(Math.sin(heading)-Math.sin(p.a))*pace(g)*time;return visible(g,e,-25)&&Math.abs(e.x+dx-v.x)<v.w-30&&Math.abs(e.y+dy-v.y)<v.h-30;}
function pursuit(g,bait,s,dt){const p=pilot(g),d=Math.hypot(bait.x-p.x,bait.y-p.y),toward=Math.atan2(bait.y-p.y,bait.x-p.x),closing=s.lastBaitDistance===undefined?false:d<s.lastBaitDistance+.05;s.lastBaitDistance=d;const aligned=s.phase==='bait'?Math.abs(angle(toward-p.a))<.48&&Math.abs(angle(p.a-s.baitPlayerHeading))>.2&&d<650&&closing:Math.abs(angle(toward-p.a))<.65&&d<900;s.commit=aligned?Math.min(.45,s.commit+dt):Math.max(0,s.commit-dt*2);return aligned;}
function beginCover(g,s,lead,wing,requiresPursuit=false){s.directCover=!requiresPursuit;if(s.directCover)s.regrouping=true;s.coverSlot=wing.legendWingSlot;s.pursuitRequired=requiresPursuit;s.breakAge=0;wing.legendWingPhase='intercept';wing.legendWingPreparing=false;wing.legendWingWarningLeft=0;const point=coverPoint(g,wing);wing.legendWingHeading=Math.atan2(point.y-wing.y,point.x-wing.x);speed(lead,Math.min(340,pace(g)+20));speed(wing,60);phase(s,'intercept');}
function recoverCover(g,s,lead,wing){if(wing){wing.legendWingPreparing=false;wing.legendWingWarningLeft=0;wing.legendWingPhase='cover';wing.legendWingHeading=lead.legendWingHeading;}phase(s,'cover-recover');}
export function tickLegendWing(g,dt){
 const s=g.legendWing;if(!s||!host(g)||!(dt>0))return;if(g.state!=='playing'){if(['lost','won','dead'].includes(g.state))withdrawLegendWing(g,'run-ended');return;}dt=Math.min(.04,dt);
 if((g.t||0)<s.lastTime)withdrawLegendWing(g,'restart');s.lastTime=g.t||0;
 let es=members(g);rememberSquadronFlight(g,es);if(!['exit','idle'].includes(s.phase)){
  if(blocked(g)||s.stageKey!==stage(g)||!(pilot(g).hp>0)){withdrawLegendWing(g,'priority');return;}
  s.age+=dt;s.elapsed+=dt;if(s.engagedAt!==undefined)s.combatAge=(s.combatAge||0)+dt;if(s.combatAge>=B.duration||s.elapsed>=B.duration+8){withdrawLegendWing(g,'timeout');return;}
  let lead=es.find(e=>e.legendWingSlot===(s.leadSlot??0));
  if(!es.length){withdrawLegendWing(g,'destroyed');return;}
  if(!lead){
   s.leadSlot=es[0].legendWingSlot;s.commandBrokenUntil=(g.t||0)+2.6;s.outcome=s.unitId==='sqn56'?'bait-destroyed':'commander-destroyed';s.commit=0;s.breakAge=0;
   for(const e of es){e.legendWingLeader=e.legendWingSlot===s.leadSlot;e.legendWingPreparing=false;e.legendWingWarningLeft=0;e.legendWingRounds=0;e.legendWingHeading=e.a+(e.legendWingSlot%2?-.55:.55);e.legendWingPhase='disrupted';}
   phase(s,'disrupted');return;
  }
  if(s.phase==='disrupted'){
   if((g.t||0)<s.commandBrokenUntil)return;
   s.coverSlot=es.find(e=>e!==lead)?.legendWingSlot;phase(s,'entry');for(const e of es)e.legendWingPhase='entry';
  }
  if(s.unitId==='sqn56'){
   let wing=es.find(e=>e.legendWingSlot===(s.coverSlot??1));if(!wing){wing=es.find(e=>e.legendWingSlot!==(s.leadSlot??0));if(wing){s.coverSlot=wing.legendWingSlot;if(!['entry','opening','bait'].includes(s.phase)){phase(s,'intercept');s.breakAge=0;wing.legendWingPhase='intercept';wing.legendWingPreparing=false;wing.legendWingWarningLeft=0;}}}if(['entry','opening'].includes(s.phase)&&lead.legendWingRounds===0)lead.legendWingHeading=leadAim(g,lead);
   if(s.phase==='entry'&&visible(g,lead,-20)){phase(s,'opening');prep(lead,.3);}
   else if(s.phase==='opening'){lead.legendWingWarningLeft=Math.max(0,.3-s.age);if(s.age>=.3&&lead.legendWingRounds<3&&s.age>=.3+lead.legendWingRounds*.12){lead.legendWingHeading=lead.a;const n=g.bullets?.length||0;fireLegendWing(g,lead);if((g.bullets?.length||0)>n)lead.legendWingRounds++;}if(s.age>=.55&&lead.legendWingRounds>=3||s.age>=1.75){lead.legendWingPreparing=false;lead.legendWingPhase='bait';lead.legendWingHeading=s.entryHeading+.6;speed(lead,Math.max(60,pace(g)*.8));for(const cover of es.filter(e=>e.legendWingSlot!==(s.leadSlot??0))){cover.legendWingPhase='cover';cover.legendWingHeading=s.entryHeading+.6;speed(cover,Math.min(320,pace(g)));}s.baitPlayerHeading=pilot(g).a;phase(s,'bait');}}
   else if(s.phase==='bait'){if(!wing){withdrawLegendWing(g,'cover-destroyed');return;}pursuit(g,lead,s,dt);if(s.commit>=.45&&Math.abs(angle(lead.legendWingHeading-lead.a))<.3)beginCover(g,s,lead,wing,true);else if(s.age>=3.2)beginCover(g,s,lead,wing);}
   else if(s.phase==='intercept'){if(!wing){withdrawLegendWing(g,'cover-destroyed');return;}s.breakAge=pursuit(g,lead,s,dt)?0:(s.breakAge||0)+dt;if(s.breakAge>1.25){s.pursuitRequired=false;s.directCover=true;s.regrouping=true;}const point=coverPoint(g,wing),heading=Math.atan2(point.y-wing.y,point.x-wing.x);wing.legendWingHeading=heading;speed(wing,Math.abs(angle(heading-wing.a))>.35?60:Math.min(380,pace(g)+80));if((!s.pursuitRequired||Math.abs(angle(pilot(g).a-lead.legendWingHeading))*pace(g)<15)&&coverRunVisible(g,wing,heading)&&Math.hypot(pilot(g).x-wing.x,pilot(g).y-wing.y)<(420-pace(g))*1.5+25&&Math.abs(angle(heading-wing.a))<.17){s.lockedPoint=point;s.cycle++;speed(wing,pace(g));phase(s,'cover-warning');prep(wing,.65);}else if(s.age>(s.directCover?7:5))recoverCover(g,s,lead,wing);}
   else if(s.phase==='cover-warning'){if(!wing){withdrawLegendWing(g,'cover-destroyed');return;}if(s.pursuitRequired&&!pursuit(g,lead,s,dt)&&s.commit<=0){beginCover(g,s,lead,wing);return;}wing.legendWingWarningLeft=Math.max(0,.65-s.age);if(s.age>=.65){phase(s,'cover-fire');wing.legendWingPreparing=false;wing.legendWingRounds=0;}}
   else if(s.phase==='cover-fire'){if(wing&&wing.legendWingRounds<3&&s.age>=wing.legendWingRounds*.15){const n=g.bullets?.length||0;fireLegendWing(g,wing);if((g.bullets?.length||0)>n)wing.legendWingRounds++;}if(s.age>.35&&wing?.legendWingRounds>=3||s.age>1.55){if(wing?.legendWingRounds)s.coverPasses=(s.coverPasses||0)+1;recoverCover(g,s,lead,wing);}}
   else if(s.phase==='cover-recover'){if(!wing){withdrawLegendWing(g,'cover-destroyed');return;}if(s.age>=B.recovery){if(s.coverPasses>=B.coverPasses)withdrawLegendWing(g,'cover-complete');else{const covers=es.filter(e=>e.legendWingSlot!==(s.leadSlot??0)),next=covers[(covers.indexOf(wing)+1)%covers.length];if(!next){withdrawLegendWing(g,'cover-destroyed');return;}beginCover(g,s,lead,next,!!s.pursuitRequired);}}}
  }else{
   if(s.phase==='entry'){
    const p=pilot(g),depth=e=>(p.x-e.x)*Math.cos(s.entryHeading)+(p.y-e.y)*Math.sin(s.entryHeading);
    // Five real aircraft need their initial stagger to clear the viewport edge.
    // Later passes reacquire faster; a replacement commander reforms the survivors.
    if(Math.abs(angle(p.a-s.entryHeading))>.45||s.age>(s.cycle===0?6:4.2))s.reacquiring=true;
    for(const e of es)speed(e,visible(g,e,-40)&&depth(e)<commandDepth(g,e)?pace(g):Math.min(380,pace(g)+110));
    const ready=s.reacquiring?visible(g,lead,-30)&&Math.hypot(p.x-lead.x,p.y-lead.y)<360&&Math.abs(angle(leadAim(g,lead)-lead.a))<.3&&(s.leadSlot>0?es.every(e=>visible(g,e,-25)):es.length===1||es.some(e=>e!==lead&&visible(g,e,-25))):es.every(e=>visible(g,e,-25)&&depth(e)<commandDepth(g,e)+5);
    if(ready){s.entryHeading=p.a;s.reacquiring=false;beginCommand(g,s,es);}
   }
   else if(s.phase==='command'){for(const e of es){const cue=B.commandWarning+e.legendWingSlot*B.commandSpacing;e.legendWingWarningLeft=Math.max(0,cue-s.age);e.legendWingPreparing=s.age<cue;if(s.age>=cue&&Math.abs(angle(e.legendWingHeading-e.a))<.18&&e.legendWingRounds<3&&s.age>=cue+e.legendWingRounds*.16){const n=g.bullets?.length||0;fireLegendWing(g,e);if((g.bullets?.length||0)>n)e.legendWingRounds++;}}if(s.age>B.commandWarning+(B.jasta2.count-1)*B.commandSpacing+.36&&es.every(e=>e.legendWingRounds>=3)||s.age>B.commandWarning+(B.jasta2.count-1)*B.commandSpacing+1.56){for(const e of es){e.legendWingPreparing=false;e.legendWingHeading=s.entryHeading+(e.legendWingSlot===1?-.3:e.legendWingSlot===2?.3:0);speed(e,pace(g));}phase(s,'recover');}}
   else if(s.phase==='recover'&&s.age>=1.45){if(s.cycle>=B.commandCycles)withdrawLegendWing(g,'departed');else if(es.some(e=>!visible(g,e,-35))||Math.abs(angle(pilot(g).a-s.entryHeading))>.6){s.reacquiring=true;phase(s,'entry');for(const e of es)e.legendWingPhase='entry';}else beginCommand(g,s,es);}
  }
 }
 es=members(g);for(const e of es)if(e.legendWingPhase==='exit'){speed(e,pace(g)+120);if(!visible(g,e,120))g.enemies=g.enemies.filter(x=>x!==e);}if(!members(g).length)s.phase='idle';
}
// Yield before converging command passes overlap; flight stays native and forward.
function commandSeparation(g,e,heading){const es=members(g),s=g.legendWing;if(e.legendWingUnit==='sqn56'){
 const covers=es.filter(q=>q.legendWingSlot!==(s.leadSlot??0)),current=covers.findIndex(q=>q.legendWingSlot===(s.coverSlot??1)),slot=s.phase==='cover-recover'&&s.coverPasses<B.coverPasses?covers[(current+1)%covers.length]?.legendWingSlot:(s.coverSlot??1);
 for(const q of es)q.legendAvoidSlot=q.legendWingSlot===(s.leadSlot??0)?0:q.legendWingSlot===slot?1:s.phase==='cover-recover'&&q.legendWingSlot===s.coverSlot?2:q.legendWingSlot+3;
 return squadronClearance(g,e,heading,es,'legendAvoidSlot',0,1.05,Math.max(140,s.directCover?pace(g)*.6:0));}
 return squadronClearance(g,e,heading,es,'legendWingSlot',s.leadSlot??0,1.05,100);}
export function legendSteering(g,e){if(e.legendWingGroup==null)return null;let heading=e.legendWingHeading;
 if(e.legendWingUnit==='jasta2'&&e.legendWingPhase!=='exit'&&['command','recover'].includes(g.legendWing?.phase))speed(e,Math.min(380,pace(g)/Math.max(.72,Math.cos(e.a-g.legendWing.entryHeading))));
 if(e.legendWingUnit==='jasta2'&&g.legendWing?.phase==='entry'&&g.legendWing.reacquiring){
  const p=pilot(g),side=e.legendWingSlot===(g.legendWing.leadSlot??0)?0:commandSide(g,e.legendWingSlot),back=commandDepth(g,e),tx=p.x-Math.cos(p.a)*back-Math.sin(p.a)*side,ty=p.y-Math.sin(p.a)*back+Math.cos(p.a)*side,vx=Math.cos(p.a)*pace(g)+(tx-e.x)*.7,vy=Math.sin(p.a)*pace(g)+(ty-e.y)*.7;
  heading=e.legendWingSlot===(g.legendWing.leadSlot??0)?leadAim(g,e):Math.atan2(vy,vx);
  speed(e,Math.abs(angle(heading-e.a))>.55?100:e.legendWingSlot===(g.legendWing.leadSlot??0)?Math.min(380,pace(g)+90):Math.max(80,Math.min(380,Math.hypot(vx,vy))));
 }
 const s=g.legendWing;
 if(e.legendWingUnit==='sqn56'&&(s.phase==='cover-recover'||s.pursuitRequired&&['cover-warning','cover-fire'].includes(s.phase))&&s.coverPasses<B.coverPasses&&e.legendWingPhase!=='exit'){
  const covers=members(g).filter(q=>q.legendWingSlot!==(s.leadSlot??0)),current=covers.findIndex(q=>q.legendWingSlot===s.coverSlot),next=covers[(current+1)%covers.length];
  if(e===next&&(s.phase==='cover-recover'||next.legendWingSlot!==s.coverSlot)){const point=coverPoint(g,e);heading=Math.atan2(point.y-e.y,point.x-e.x);speed(e,Math.abs(angle(heading-e.a))>.35?60:Math.min(380,pace(g)+80));return {delta:angle(commandSeparation(g,e,heading)-e.a),turn:1.05};}
 }
 if(e.legendWingUnit==='sqn56'&&s.regrouping&&!['entry','opening','disrupted'].includes(s.phase)&&e.legendWingPhase!=='exit'&&e.legendWingSlot!==(s.leadSlot??0)&&e.legendWingPhase==='cover'){
  // If the lure is declined, reserve covers recover around the player. The
  // bait keeps its fixed escape course: making it orbit the pursuing player
  // would force every later cover to chase an endlessly turning target.
  const p=pilot(g),side=(e.legendWingSlot%2?-1:1)*(e.legendWingSlot>2?285:160),back=e.legendWingSlot>2?235:150,a=p.a||0,tx=p.x-Math.cos(a)*back-Math.sin(a)*side,ty=p.y-Math.sin(a)*back+Math.cos(a)*side,vx=Math.cos(a)*pace(g)+(tx-e.x)*.7,vy=Math.sin(a)*pace(g)+(ty-e.y)*.7;
  heading=Math.atan2(vy,vx);e.legendWingHeading=heading;speed(e,Math.abs(angle(heading-e.a))>.6?85:Math.min(360,Math.max(80,Math.hypot(vx,vy))));
 }else if(e.legendWingUnit==='sqn56'&&e.legendWingPhase==='cover'){const lead=members(g).find(q=>q.legendWingSlot===(g.legendWing?.leadSlot??0));if(lead){const a=lead.legendWingHeading,side=(e.legendWingSlot%2?-1:1)*(e.legendWingSlot>2?225:150),back=e.legendWingSlot>2?240:155,x=lead.x-Math.cos(a)*back-Math.sin(a)*side,y=lead.y-Math.sin(a)*back+Math.cos(a)*side;const vx=Math.cos(lead.a)*lead.speed+(x-e.x)*.7,vy=Math.sin(lead.a)*lead.speed+(y-e.y)*.7;heading=Math.atan2(vy,vx);speed(e,Math.abs(angle(heading-e.a))>.55?85:Math.min(360,Math.max(80,Math.hypot(vx,vy))));}}return {delta:angle(commandSeparation(g,e,heading)-e.a),turn:1.05};}
export function fireLegendWing(g,e){
 if(e.legendWingGroup==null)return false;e.fire=Infinity;const s=g.legendWing;
 if(!host(g)||g.state!=='playing'||!live(e)||e.legendWingPhase==='exit'||s?.groupId!==e.legendWingGroup||!visible(g,e,-20)||(g.bullets?.length||0)>=180||g.sunStrikeContains?.(e))return true;
 const es=members(g);if(s.phase==='disrupted'||!es.some(x=>x.legendWingSlot===(s.leadSlot??0)))return true;
 const allowed=s.unitId==='sqn56'?(s.phase==='opening'&&s.age>=.3&&e.legendWingSlot===(s.leadSlot??0)||s.phase==='cover-fire'&&e.legendWingSlot===(s.coverSlot??1)):s.phase==='command'&&s.age>=B.commandWarning+e.legendWingSlot*B.commandSpacing;
 const p=pilot(g);if(!allowed||e.legendWingRounds>=3||e.legendWingLastShot===s.cycle+':'+s.phase+':'+e.legendWingRounds||p.fogHidden||p.cloudConceal>0||p.kaiserFogTime>0||p.ballCloak>0)return true;
 s.engagedAt??=g.t||0;e.legendWingLastShot=s.cycle+':'+s.phase+':'+e.legendWingRounds;
 (g.bullets??=[]).push({x:e.x+Math.cos(e.a)*25,y:e.y+Math.sin(e.a)*25,vx:Math.cos(e.a)*420,vy:Math.sin(e.a)*420,enemy:true,damage:squadronDamage(g,10),life:1.8,visualType:'scout',legendWingUnit:s.unitId,legendWingGroup:s.groupId,legendWingSlot:e.legendWingSlot});e.muzzleFlash=.12;e.gunAim=e.a;g.event?.('enemyShot','');return true;
}
export function installLegendCombat(Game){const p=Game.prototype;if(Object.hasOwn(p,'__legendCombat'))return;p.__legendCombat=true;const steer=p.dogfightSteering,fire=p.fireEnemy;p.dogfightSteering=function(e,...args){return legendSteering(this,e)||steer.call(this,e,...args);};p.fireEnemy=function(e,...args){if(!fireLegendWing(this,e))return fire.call(this,e,...args);};}

/** Asset-only prefetch, independent of combat admission and RNG. */
export function warmLegendArt(id){return B[id]?ready(B[id].plane):false;}

// Enemy-only decisions. Existing aircraft, weapon, sortie and reward budgets
// remain owned by their original systems. No player input is read here.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const diff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const alive=p=>!!(p?.hp>0&&!p.expired&&!p.crashing&&!p.rivalEscaped&&(!p.status||p.status==='alive'));
const profile=(tactic,range,setup,attack,recovery,cone,extra={})=>Object.freeze({tactic,range,setup,attack,recovery,cone,observe:.3,targetHold:5,defense:'BREAK',...extra});

// Each entry has a distinct decision rule below, not just a stat multiplier.
// Historical references are translated into level, two-dimensional flight.
export const ENEMY_ACE_PROFILES=Object.freeze({
 baron:profile('HUNT',165,.35,2.7,1.2,.22,{targetHold:7,defense:'HOOK'}),
 voss:profile('SCISSORS',150,.25,1.35,1.45,.29,{defense:'SCISSORS',observe:.28}),
 fonck:profile('PRECISION',330,1.05,.6,2,.095,{observe:.42,defense:'EXTEND'}),
 boelcke:profile('PINCER',230,.85,1.1,1.65,.18,{formation:'PINCER'}),
 udet:profile('ACROBAT',195,.35,1.1,1.6,.22,{defense:'ROLL',observe:.32}),
 immelmann:profile('REVERSAL',210,.6,.9,1.8,.2,{defense:'REVERSAL'}),
 collishaw:profile('BLACK_FLIGHT',215,.65,1.35,1.5,.21,{formation:'TRAIL'}),
 baracca:profile('CAVALRY',210,.6,.95,1.9,.23,{defense:'EXTEND'}),
 guynemer:profile('CANNON_RUN',295,.7,1.15,1.7,.16,{defense:'EXTEND'}),
 mannock:profile('CROSS_FLIGHT',295,.8,1.15,1.8,.19,{formation:'CROSS',defense:'EXTEND'}),
 mccudden:profile('ASSESS',315,.95,.75,2.05,.12,{observe:.4,defense:'EXTEND'}),
 bishop:profile('AMBUSH_BOMB',185,.55,1.05,1.85,.25,{defense:'REAR_GUN'}),
 goering:profile('WHITE_FLIGHT',245,.75,1.25,1.6,.22,{formation:'SPLIT'}),
 rickenbacker:profile('AWARENESS',275,.55,.95,1.55,.19,{targetHold:3.5,defense:'YOYO'}),
 ball:profile('LONE_AMBUSH',185,.9,.75,1.9,.16,{defense:'EXTEND'}),
 barker:profile('LAST_STAND',180,.45,1.4,1.65,.26,{defense:'SCISSORS'}),
 nungesser:profile('BREAK_THROUGH',165,.3,1.5,1.55,.28,{defense:'BREAK'}),
 jacobs:profile('LOW_PRESSURE',140,.4,2.2,1.65,.25,{defense:'HOOK'}),
 loewenhardt:profile('FRONTAL_ENERGY',270,.65,1.1,1.85,.2,{defense:'EXTEND'}),
 lothar:profile('NEXT_CONTACT',185,.25,1.6,1.25,.27,{targetHold:3.2,defense:'BREAK'}),
 berthold:profile('ENDURE_COUNTER',235,.55,1.25,1.75,.22,{defense:'COUNTER'}),
 wolff:profile('CLEAN_PASS',290,.85,.85,1.9,.17,{defense:'EXTEND'}),
 mckeever:profile('TWO_SEAT_OFFENSE',250,.6,1.5,1.75,.25,{defense:'REAR_GUN'}),
 huffzky:profile('REAR_LURE',270,.7,1.2,1.85,.26,{defense:'REAR_GUN'}),
 hawker:profile('SUSTAINED_TURN',145,.35,2.4,1.75,.24,{defense:'HOOK'}),
 luke:profile('RISK_RUN',220,.3,1.2,1.7,.26,{defense:'BREAK'}),
 brumowski:profile('ESCORT_SCREEN',225,.7,1.4,1.6,.21,{formation:'SCREEN'}),
 gontermann:profile('FOCUS_IGNITION',255,.95,1.6,1.85,.15,{targetHold:6.5}),
 sachsenberg:profile('METAL_PASS',285,.7,1.3,1.95,.2,{defense:'EXTEND'}),
 proctor:profile('STEP_BURST',280,.75,.85,1.65,.14,{targetHold:4}),
 schleich:profile('DARK_APPROACH',235,.85,1.15,1.85,.18,{defense:'COUNTER'}),
 lufbery:profile('CIRCLE_COVER',185,.55,1.8,1.8,.2,{defense:'CIRCLE'})
});

// 20261111 pressed break. A pursuer sitting close astern and landing hits used to get a free
// kill: the ace finished its scripted defence, then flew a straight recovery for seconds.
// Now it breaks hard toward the pursuer's side with the airframe's real turn rate, bleeds
// speed as any defensive turn does (the overshoot is the player's risk) and comes back round
// to re-engage. No speed, health, damage or accuracy change; pilots with a signature defence
// (scissors, roll, reversal, rear gun, circle, yo-yo) keep flying it, only sooner.
export const ACE_PRESSED_BREAK=Object.freeze({range:260,hitWindow:.6,cooldown:2.6,duration:1,maxDuration:2.4,turn:1.5,throttle:.6,snapCone:.9,closeRange:170,turnCap:3.2});
const OWN_DEFENSE=new Set(['SCISSORS','ROLL','REVERSAL','REAR_GUN','CIRCLE','YOYO']);
export function tacticalAce(e){return !!(alive(e)&&ENEMY_ACE_PROFILES[e.bossPilot]&&!e.stageBossBody&&!e.bossMinion&&!e.encounterId&&!e.escortLeaderId&&!e.formationLeader)}
const authoritative=g=>!(g.online&&g.host===false||g.onlineRole==='guest'||g.onlineCoop?.role==='guest'||g.isOnlineGuest);
const bypass=(g,e)=>!authoritative(g)||!tacticalAce(e)||e.stationary||g.sunStrikeContains?.(e)||e.rivalEscaping||e.aceRetreat||e.defensivePressure||e.aceEntryUntil>(g.t||0);
const readySlot=(g,e)=>!g.aceCoopFireReady||g.aceCoopFireReady(e);
const nowOf=g=>g.t||0;

function stateFor(g,e){
 if(e.aceTactics)return e.aceTactics;
 const p=ENEMY_ACE_PROFILES[e.bossPilot],seed=g.rng?.()??.5;
 const state={state:'APPROACH',since:nowOf(g),until:nowOf(g)+.55,nextDecision:0,nextObserve:0,
  side:seed<.5?-1:1,seed,cycle:0,heading:e.a,energy:1,stable:0,lastHp:e.hp,lastHit:-Infinity,
  defenseReady:0,grazeUntil:0,grazeCount:0,bulletCursor:0,nextScan:0,targetUntil:0,
  observation:{x:e.x+Math.cos(e.a)*p.range,y:e.y+Math.sin(e.a)*p.range,a:e.a,speed:0},
  previousObservation:null,skillReady:false,signatureUntil:0,skillHeading:e.a};
 // Decisions are host-private; only existing pose/energy/visual fields cross
 // the network. In particular, do not serialize observed projectile references.
 Object.defineProperty(e,'aceTactics',{value:state,writable:true,configurable:true});
 return state;
}
function enter(g,e,s,name,duration,heading=e.a){
 if(name==='RECOVER')duration*=1.15-.25*clamp((g.stageBoss?.stages?.stageIndex||0)/17*.65+(g.stageBoss?.stages?.loopIndex||0)*.2,0,1);
 s.state=name;s.since=Math.floor((nowOf(g)+1e-7)*4)/4;s.until=Math.ceil((s.since+duration-1e-7)*4)/4;s.heading=heading;s.nextDecision=s.since+.25;
 if(name==='RECOVER')s.cycle++;
 if(name==='SETUP'){s.aimTime=0;s.setupOpportunity=0}
 e.aceTacticalState=name;
}

// Finite, periodic observation of nearby *present* rounds. Never inspect a
// player's controls or scan the entire projectile array on every frame.
function observe(g,e,s,p,contact){
 const now=nowOf(g);if(now+1e-7<s.nextObserve)return;
 s.nextObserve=(Math.floor((now+1e-7)/p.observe)+1)*p.observe;
 const old=s.observation;
 s.previousObservation=old;
 s.observation={x:contact.x,y:contact.y,a:contact.a??old.a,speed:contact.baseSpeed??contact.speed??0};
 const signedTurn=diff(s.observation.a,old.a)/p.observe,turn=Math.abs(signedTurn);
 // A steady observed turn can be learned too; a circling player must not
 // disable precision pilots forever. Sudden reversals still spoil setup.
 s.stable=turn<.35||Math.abs(signedTurn-(s.observedSignedTurn??signedTurn))<.18?s.stable+p.observe:0;
 s.observedSignedTurn=signedTurn;
 s.observedTurn=turn;
 if(e.hp<s.lastHp){s.lastHit=now;s.grazeCount=0;s.grazeUntil=0}s.lastHp=e.hp;
 if(e.bossPilot!=='udet'||now<s.nextScan)return;
 s.nextScan=now+.3;
 const bullets=g.bullets||[],n=Math.min(32,bullets.length);
 for(let i=0;i<n;i++){
  const b=bullets[(s.bulletCursor+i)%bullets.length];
  if(!b||b.enemy||b.life<=0||b.actualExplosion||b.rocket||b.motorCannon||b.cow37||b.patrol||b===s.lastGraze)continue;
  const d=Math.hypot(b.x-e.x,b.y-e.y),r=e.hitRadius??19;
  const vx=(b.vx||0)-Math.cos(e.a)*e.speed*(e.energySpeed??1),vy=(b.vy||0)-Math.sin(e.a)*e.speed*(e.energySpeed??1);
  if(d>r+7&&d<r+35&&(b.x-e.x)*vx+(b.y-e.y)*vy>0&&now>=s.defenseReady){
   s.lastGraze=b;
   if((g.rng?.()??s.seed)<.65){s.grazeUntil=now+6;s.grazeCount=Math.min(3,s.grazeCount+1)}
   break;
  }
 }
 s.bulletCursor=bullets.length?(s.bulletCursor+n)%bullets.length:0;
}
function situation(e,s){
 const o=s.observation,dx=o.x-e.x,dy=o.y-e.y,d=Math.hypot(dx,dy),bearing=Math.atan2(dy,dx);
 return {o,d,bearing,angle:Math.abs(diff(bearing,e.a)),
  pursued:d<340&&Math.abs(diff(bearing,e.a+Math.PI))<.9&&Math.abs(diff(Math.atan2(-dy,-dx),o.a))<.65,
  frontal:Math.abs(diff(e.a,o.a+Math.PI))<.65,
  tail:Math.abs(diff(Math.atan2(e.y-o.y,e.x-o.x),o.a+Math.PI))<.8};
}
function skillCondition(e,s,p,q,now){
 switch(p.tactic){
  case 'SCISSORS':return q.pursued||e.vossSurgeCount>=3||s.state==='DEFEND';
  case 'ACROBAT':return s.grazeUntil>now&&s.grazeCount>0||s.state==='DEFEND';
  case 'REVERSAL':return s.state==='DEFEND'||s.state==='REENGAGE';
  case 'PRECISION':return s.stable>=.8&&q.angle<p.cone;
  case 'PINCER':case 'BLACK_FLIGHT':case 'WHITE_FLIGHT':case 'CROSS_FLIGHT':case 'ESCORT_SCREEN':return s.wingsReady>=Math.min(2,s.wingCount||0)&&s.state==='ATTACK';
  case 'ASSESS':return e.hp<e.maxHp*.72&&q.d>190||s.state==='ATTACK'&&s.stable>.55;
  case 'ENDURE_COUNTER':case 'LAST_STAND':return now-s.lastHit<2.5||e.hp<e.maxHp*.5;
  case 'CAVALRY':case 'FRONTAL_ENERGY':return q.frontal&&q.angle<.18;
  case 'CANNON_RUN':return q.angle<.15&&s.stable>.35;
  case 'FOCUS_IGNITION':return s.tracking>1.2;
  case 'CLEAN_PASS':return now-s.lastHit>2&&s.state==='ATTACK';
  case 'REAR_LURE':return q.pursued||s.state==='ATTACK';
  default:return s.state==='ATTACK';
 }
}

function decide(g,e,s,p,q){
 const now=nowOf(g);if(now+1e-7<s.nextDecision)return;s.nextDecision=(Math.floor((now+1e-7)*4)+1)/4;
 const out=q.d>Math.max(750,Math.hypot(g.viewWidth||960,g.viewHeight||700)*.85);
 if(out&&s.state!=='APPROACH'&&s.state!=='REENGAGE'){enter(g,e,s,'REENGAGE',1.1,q.bearing);return}
 if(s.signatureUntil>now)return;
 if((q.pursued||p.tactic==='ACROBAT'&&s.grazeUntil>now)&&now>=s.defenseReady&&s.state!=='DEFEND'&&s.state!=='RECOVER'){
  s.defenseReady=now+4.5+p.recovery;
  enter(g,e,s,'DEFEND',p.defense==='SCISSORS'?1.65:1.05,e.a+s.side*.75);return;
 }
 if(q.pursued&&q.d<ACE_PRESSED_BREAK.range&&now-s.lastHit<ACE_PRESSED_BREAK.hitWindow&&now>=(s.breakReady||0)&&
  (s.state!=='DEFEND'||!s.pressedBreak&&p.defense==='EXTEND')){
  s.breakReady=now+ACE_PRESSED_BREAK.cooldown;s.pressedBreak=true;
  // Break toward the side the pursuer sits on: the turn opens the angle fastest.
  s.side=Math.sign(diff(q.bearing,e.a))||s.side;
  enter(g,e,s,'DEFEND',OWN_DEFENSE.has(p.defense)?(p.defense==='SCISSORS'?1.65:1.05):ACE_PRESSED_BREAK.duration,e.a+s.side*.75);return;
 }
 if(now+1e-7<s.until)return;
 switch(s.state){
  case 'APPROACH':case 'REENGAGE':enter(g,e,s,'SETUP',p.setup);break;
  case 'SETUP':
   if(!readySlot(g,e))break;
   s.setupOpportunity+=.25;
   if(q.d<p.range*1.65&&s.aimTime>=.25&&q.angle<Math.max(.2,p.cone)&&(p.tactic!=='PRECISION'||s.stable>=.8)){
    // Other aces may use the firing slot while this pilot keeps its setup.
    if(readySlot(g,e))enter(g,e,s,'ATTACK',p.attack);
   }
   else if(s.setupOpportunity>3.2)enter(g,e,s,'DISENGAGE',1.25,e.a+s.side*.6);
   break;
  case 'ATTACK':
   if(p.tactic==='HUNT'&&q.tail&&q.angle<.65&&q.d<330&&now-s.since<4.5){s.until=now+.3;break}
   if(p.tactic==='LOW_PRESSURE'&&q.d<210&&s.energy>.78&&now-s.since<3.8){s.until=now+.35;break}
   enter(g,e,s,'DISENGAGE',1.05+(p.defense==='EXTEND'?.45:0),e.a+s.side*.2);break;
  case 'DEFEND':
   // The Eindecker must finish the turn with its real, limited nose rate.
   if(p.tactic==='REVERSAL'&&Math.abs(diff(s.heading+s.side*Math.PI,e.a))>.2&&now-s.since<4){s.until=now+.25;break}
   // A pressed break ends nose-on to the attacker, not in another straight recovery.
   if(s.pressedBreak){
    // Hold the braking turn until the pursuer has actually gone past (bounded), then take
    // the snapshot the overshoot offers instead of flying off to a new station.
    if((q.pursued||q.d<ACE_PRESSED_BREAK.closeRange&&q.angle>ACE_PRESSED_BREAK.snapCone)&&now-s.since<ACE_PRESSED_BREAK.maxDuration){s.until=now+.25;break}
    s.pressedBreak=false;
    if(q.d<340&&q.angle<ACE_PRESSED_BREAK.snapCone&&readySlot(g,e))enter(g,e,s,'ATTACK',Math.min(p.attack,1.1),q.bearing);
    else enter(g,e,s,'REENGAGE',.7,q.bearing);
    break;
   }
   enter(g,e,s,p.tactic==='REVERSAL'?'REENGAGE':'RECOVER',p.recovery,q.bearing+s.side*.4);break;
  case 'DISENGAGE':enter(g,e,s,'RECOVER',p.recovery,e.a);break;
  case 'RECOVER':s.side*=-1;enter(g,e,s,'REENGAGE',.7,q.bearing);break;
 }
}

function desiredHeading(g,e,s,p,q){
 const {o,d,bearing}=q,now=nowOf(g),ca=Math.cos(o.a),sa=Math.sin(o.a),side=s.side;
 if(s.signatureUntil>now){
  if(p.defense==='SCISSORS'||p.defense==='ROLL')return s.skillHeading+side*Math.sin((now-s.signatureAt)*4)*.9;
  if(p.defense==='REVERSAL')return s.skillHeading+side*Math.PI;
  if(p.tactic==='HUNT')return bearing+side*.12;
  return s.skillHeading;
 }
 if(s.state==='DISENGAGE')return s.heading;
 if(s.state==='RECOVER')return d<620?s.heading:bearing+side*.35;
 if(s.state==='DEFEND'){
  if(s.pressedBreak&&!OWN_DEFENSE.has(p.defense))return q.pursued?e.a+side*ACE_PRESSED_BREAK.turn:bearing;
  if(p.defense==='SCISSORS'||p.defense==='ROLL')return s.heading+side*Math.sin((now-s.since)*4)*1.05;
  if(p.defense==='REVERSAL')return s.heading+side*Math.PI;
  if(p.defense==='REAR_GUN')return o.a+side*.25;
  if(p.defense==='EXTEND')return e.a+diff(Math.atan2(e.y-o.y,e.x-o.x),e.a)*.2;
  if(p.defense==='YOYO')return bearing+side*1.25;
  if(p.defense==='CIRCLE')return bearing+side*1.35;
  return bearing+side*.3;
 }
 if(s.state==='ATTACK'){
  if(['HUNT','LOW_PRESSURE','SUSTAINED_TURN','BREAK_THROUGH','LAST_STAND'].includes(p.tactic))return bearing+side*(q.tail?.02:.12);
  if(p.tactic==='CIRCLE_COVER')return bearing+side*.55;
  return s.heading;
 }
 let back=p.range*.75,lateral=side*p.range*.65,lead=.35;
 switch(p.tactic){
  case 'HUNT':back=125;lateral=side*55;lead=.25;break;
  case 'SCISSORS':back=75;lateral=side*125;break;
  case 'PRECISION':back=300;lateral=side*90;lead=.5;break;
  case 'PINCER':back=190;lateral=-side*230;break;
  case 'ACROBAT':back=120;lateral=side*(s.grazeUntil>now?-110:180);break;
  case 'REVERSAL':back=-160;lateral=side*100;break;
  case 'BLACK_FLIGHT':back=155;lateral=side*(120+s.cycle%3*55);break;
  case 'CAVALRY':case 'FRONTAL_ENERGY':back=-280;lateral=side*35;break;
  case 'CANNON_RUN':back=-210;lateral=side*95;break;
  case 'CROSS_FLIGHT':back=120;lateral=-side*300;break;
  case 'ASSESS':back=340;lateral=side*(s.observedTurn>.5?270:110);break;
  case 'AMBUSH_BOMB':back=95;lateral=side*185;break;
  case 'WHITE_FLIGHT':back=130;lateral=side*240;break;
  case 'AWARENESS':back=200;lateral=side*(q.frontal?310:160);break;
  case 'LONE_AMBUSH':back=260;lateral=-side*200;break;
  case 'LAST_STAND':back=e.hp/e.maxHp<.5?50:170;lateral=side*95;break;
  case 'BREAK_THROUGH':back=-100;lateral=side*115;break;
  case 'LOW_PRESSURE':back=90;lateral=side*45;break;
  case 'NEXT_CONTACT':back=-80;lateral=side*165;break;
  case 'ENDURE_COUNTER':back=now-s.lastHit<2.5?-130:200;lateral=side*105;break;
  case 'CLEAN_PASS':back=280;lateral=side*(now-s.lastHit<3?300:150);break;
  case 'TWO_SEAT_OFFENSE':back=-100;lateral=side*225;break;
  case 'REAR_LURE':back=-240;lateral=side*75;break;
  case 'SUSTAINED_TURN':back=70;lateral=side*95;break;
  case 'RISK_RUN':back=-190;lateral=side*140;break;
  case 'ESCORT_SCREEN':back=170;lateral=side*210;break;
  case 'FOCUS_IGNITION':back=210;lateral=side*65;break;
  case 'METAL_PASS':back=-230;lateral=side*155;break;
  case 'STEP_BURST':back=220;lateral=side*(85+(s.cycle%4)*60);break;
  case 'DARK_APPROACH':back=270;lateral=-side*250;break;
  case 'CIRCLE_COVER':back=110;lateral=side*220;break;
 }
 const rangeScale=e.rivalPreferredRange?clamp(e.rivalPreferredRange/p.range,.6,1.25):1;
 back*=rangeScale;lateral*=rangeScale;
 // Approach far contacts by interception; fly the flank station only nearby.
 if(d>p.range*2.1)return Math.atan2(o.y+sa*o.speed*lead-e.y,o.x+ca*o.speed*lead-e.x);
 const x=o.x-ca*back-sa*lateral,y=o.y-sa*back+ca*lateral;
 // Once near a station, fly onto the observed target instead of orbiting it.
 if(Math.hypot(x-e.x,y-e.y)<90||s.state==='SETUP'&&now-s.since>p.setup)return bearing+Math.sin(s.seed*17+s.cycle)*.025;
 return Math.atan2(y-e.y,x-e.x);
}

export function aceTacticalSteering(g,e,contact,dt,baseTurn,planes){
 if(bypass(g,e)||!contact){if(e?.aceTactics&&authoritative(g))e.aceDashFactor=e.bossDash>0?3:1;return null}
 const p=ENEMY_ACE_PROFILES[e.bossPilot],s=stateFor(g,e),now=nowOf(g),step=clamp(dt||0,0,.05);
 observe(g,e,s,p,contact);const q=situation(e,s);
 s.aimTime=q.angle<Math.max(.2,p.cone)?(s.aimTime||0)+step:0;
 if(p.formation&&now>=(s.nextWings??0)){
  s.nextWings=now+.4;s.wingCount=0;s.wingsReady=0;
  for(const wing of g.enemies||[])if(wing.formationLeader===e&&alive(wing)){
   s.wingCount++;
   if(Math.hypot(wing.x-contact.x,wing.y-contact.y)<650&&Math.abs(diff(Math.atan2(contact.y-wing.y,contact.x-wing.x),wing.a))<.8)s.wingsReady++;
  }
 }
 s.tracking=q.angle<.4&&q.d<450?(s.tracking||0)+step:0;
 if(!readySlot(g,e)&&s.signatureUntil<=now&&s.state==='ATTACK')enter(g,e,s,'DISENGAGE',1.1,e.a+s.side*.2);
 else decide(g,e,s,p,q);
 const plane=planes[e.bossPlane]||{},h=e.airframeHandling||plane.handling||{},personality=e.personality||plane.personality||{};
 const heading=desiredHeading(g,e,s,p,q),delta=diff(heading,e.a);
 const handling=(personality.lowSpeedHandling??1)*(1-s.energy)+(personality.highSpeedHandling??1)*s.energy;
 const defensiveSkill=s.signatureUntil>now&&['HUNT','SCISSORS','ACROBAT','REVERSAL'].includes(p.tactic);
 const authority=baseTurn===0&&e.bossDash>0&&defensiveSkill?2:baseTurn;
 // In a pressed break the pilot flies the airframe toward its own listed turn rate (the
 // figure the player's copy of that aircraft uses) instead of the cruise-combat 66%, capped
 // well under a player's real rate (~4-4.6 rad/s) so the tail can still be held by flying.
 const pressedBreak=s.state==='DEFEND'&&s.pressedBreak&&baseTurn>0,airframeTurn=h.turn??plane.turn??3;
 const turn=pressedBreak?Math.min(ACE_PRESSED_BREAK.turnCap,Math.max(.45,airframeTurn)*clamp(handling,.75,1.12)*(delta<0?(h.left??1):1))
  :Math.min(2.25,Math.max(0,authority)*(e.aceTurnMultiplier||1),Math.max(.45,airframeTurn*.66)*clamp(handling,.75,1.12)*(delta<0?(h.left??1):1)*(e.aceTurnMultiplier||1));
 const effort=turn>0?clamp(Math.abs(delta)/Math.max(.001,turn*step),0,1):0;
 const slowing=pressedBreak?ACE_PRESSED_BREAK.throttle:s.state==='DEFEND'&&p.defense!=='EXTEND'?.8:s.state==='SETUP'&&p.tactic==='PRECISION'?.9:1;
 const target=clamp(slowing-(h.drag??.18)*effort*effort,pressedBreak?ACE_PRESSED_BREAK.throttle-.05:.65,1),rate=target<s.energy?1.8:(h.recovery??1)*(personality.acceleration??1);
 s.energy+=(target-s.energy)*(1-Math.exp(-rate*step));e.energySpeed=s.energy;
 // Retain the existing short dash budget, with finite acceleration/deceleration.
 const dashTarget=e.bossDash>0&&!defensiveSkill?3:1;
 e.aceDashFactor=(e.aceDashFactor??1)+clamp(dashTarget-(e.aceDashFactor??1),-4*step,5*step);
 e.speed=Math.min(e.speed,e.cruiseSpeedCap??Infinity);
 e.aceTacticalState=s.state;s.skillEligible=skillCondition(e,s,p,q,now);
 return {turn,delta};
}

function visible(g,e){
 const ps=g.players?.length?g.players:[g],z=g.camera?.zoom||1,w=(g.viewWidth||960)/2/z+30,h=(g.viewHeight||700)/2/z+30;
 return ps.some(p=>alive(p)&&Math.abs(e.x-p.x)<=w&&Math.abs(e.y-p.y)<=h);
}
// Shared by solo and CoopGame's own target override. Preserve concealment,
// decoys and patrol contacts returned by the existing target resolver.
export function aceCombatTarget(g,e,original){
 if(bypass(g,e)||!g.players?.length||!g.players.includes(original))return original;
 const s=stateFor(g,e),now=nowOf(g),p=ENEMY_ACE_PROFILES[e.bossPilot];
 const available=c=>alive(c)&&(c.kaiserFogTime||0)<=0&&!(c.pilot==='ball'&&c.ballCloak>0)&&!(c.cloudConceal>0);
 const current=g.players.find(p=>p.id===s.targetId&&available(p));
 if(current&&now<s.targetUntil)return current;
 let best=null,score=Infinity;
 for(const candidate of g.players){if(!available(candidate))continue;
  let n=Math.hypot(candidate.x-e.x,candidate.y-e.y);
  for(const other of g.enemies||[])if(other!==e&&alive(other)&&other.aceTactics?.targetId===candidate.id)n+=130;
  if(current===candidate)n+=110;
  if(p.tactic==='HUNT')n-=(candidate.maxHp||100)*.25;
  if(n<score){score=n;best=candidate}
 }
 s.targetId=best?.id;s.targetUntil=now+p.targetHold;return best||original;
}

export function aceEscortStation(g,wing,leader){
 if(bypass(g,leader)||!ENEMY_ACE_PROFILES[leader.bossPilot]?.formation)return null;
 const s=stateFor(g,leader),o=s.observation,now=nowOf(g);
 if(wing.aceWingSlot==null){
  const used=new Set((g.enemies||[]).filter(w=>w!==wing&&w.formationLeader===leader&&alive(w)).map(w=>w.aceWingSlot));
  let slot=0;while(used.has(slot))slot++;wing.aceWingSlot=slot;
 }
 const slot=wing.aceWingSlot,side=slot%2?1:-1,rank=Math.floor(slot/2),p=ENEMY_ACE_PROFILES[leader.bossPilot];
 let back=130+rank*100,lateral=side*(175+rank*45);
 if(p.formation==='TRAIL'){back=180+slot*90;lateral=side*95}
 if(p.formation==='CROSS'){back=(slot%2?-1:1)*160;lateral=side*(270+rank*35)}
 if(p.formation==='SPLIT'){back=90+rank*100;lateral=side*(240+rank*45)}
 if(p.formation==='SCREEN'){back=60+rank*110;lateral=side*(155+rank*55)}
 const attacking=s.state==='ATTACK'&&readySlot(g,leader);
 if(attacking)back=-100-rank*75;
 back=clamp(back,-400,480);lateral=clamp(lateral,-380,380);
 const ca=Math.cos(o.a),sa=Math.sin(o.a),x=o.x-ca*back-sa*lateral,y=o.y-sa*back+ca*lateral;
 wing.aceWingRole=p.formation;wing.aceWingAttack=attacking;
 // Reuse the existing wing fire budget, staggering real aircraft, not copies.
 const phase=((now-s.since-slot*.28)%2.8+2.8)%2.8;
 wing.aceWingFireReady=attacking&&phase<.7;
 return {x,y,a:Math.atan2(o.y-wing.y,o.x-wing.x)};
}
function escortShotReady(g,e){
 const leader=e.formationLeader;
 if(!tacticalAce(leader)||!ENEMY_ACE_PROFILES[leader.bossPilot]?.formation)return true;
 const target=g.enemyCombatTarget(leader);
 return !bypass(g,leader)&&e.aceWingFireReady&&readySlot(g,leader)&&visible(g,e)&&
  Math.abs(diff(Math.atan2(target.y-e.y,target.x-e.x),e.a))<.25;
}
export function aceShotReady(g,e,contact,{signature=false}={}){
 if(bypass(g,e)||!contact||!readySlot(g,e)||!visible(g,e))return false;
 const s=stateFor(g,e),p=ENEMY_ACE_PROFILES[e.bossPilot],q=situation(e,s),now=nowOf(g);
 if(signature)return s.skillEligible&&q.d<Math.max(420,p.range*1.8)&&s.state!=='RECOVER'&&
  (['SCISSORS','ACROBAT','REVERSAL','REAR_LURE'].includes(p.tactic)||q.angle<Math.max(.16,p.cone));
 // Ordinary guns may exploit a real nose alignment while positioning. Only
 // committed disengagement/recovery withholds them; skills keep their own gate.
 if((s.state==='DISENGAGE'||s.state==='RECOVER')&&!(s.signatureUntil>now))return false;
 const a=Math.atan2(contact.y-e.y,contact.x-e.x);
 return Math.hypot(contact.x-e.x,contact.y-e.y)<Math.max(350,p.range*1.7)&&
  (Math.abs(diff(a,e.a))<Math.max(.2,p.cone)||e.aceRearWeapon&&Math.abs(diff(a,e.a+Math.PI))<.6);
}

function tacticalVolley(g,e,args,volley,weapons){
 const contact=g.enemyCombatTarget(e);
 e.aceRearWeapon=!!weapons?.[e.bossPlane]?.bidirectional;
 if(!aceShotReady(g,e,contact))return;
 const rear=e.aceRearWeapon&&Math.abs(diff(Math.atan2(contact.y-e.y,contact.x-e.x),e.a+Math.PI))<.6;
 const start=g.bullets.length,result=volley.call(g,e,...args);
 if(rear){
  // Re-aim this existing volley from a genuine rear mount. Do not increase its
  // rounds, damage, cooldown or turn the airframe to face the rear target.
  const heading=e.a+Math.PI,rotation=diff(heading,e.gunAim??e.a),ca=Math.cos(rotation),sa=Math.sin(rotation);
  for(let i=start;i<g.bullets.length;i++){
   const b=g.bullets[i];if(b.sourcePilot!==e.bossPilot)continue;
   const vx=b.vx,vy=b.vy;b.vx=vx*ca-vy*sa;b.vy=vx*sa+vy*ca;
   b.x=e.x+Math.cos(heading)*14;b.y=e.y+Math.sin(heading)*14;b.aceRearGun=true;
  }
  e.gunAim=heading;
 }
 return result;
}

function tacticalFire(g,e,args,fire,weapons){
 if(tacticalAce(e)){
  if(!authoritative(g))return;
  e.aceRearWeapon=!!weapons?.[e.bossPlane]?.bidirectional;
  // Do not consume the normal firing interval for a shot withheld during
  // setup or a fleeting nose misalignment. The sortie still owns slot retries.
  if(readySlot(g,e)&&!aceShotReady(g,e,g.enemyCombatTarget(e))){e.fire=.12;return}
 }
 return fire.call(g,e,...args);
}

export function installEnemyAceTactics(Game,{PILOTS,PLANES,WEAPONS}){
 const proto=Game.prototype;if(proto.__enemyAceTactics)return;proto.__enemyAceTactics=true;
 const target=proto.enemyCombatTarget;
 proto.enemyCombatTarget=function(e,...args){
  return aceCombatTarget(this,e,target.call(this,e,...args));
 };
 const steer=proto.dogfightSteering;
 proto.dogfightSteering=function(e,contact,dt,baseTurn){return aceTacticalSteering(this,e,contact,dt,baseTurn,PLANES)||steer.call(this,e,contact,dt,baseTurn)};
 proto.aceSignatureShotReady=function(e){return authoritative(this)&&!bypass(this,e)&&readySlot(this,e)&&visible(this,e)};
 const volley=proto.enemyVolley;
 proto.enemyVolley=function(e,...args){
  if(!escortShotReady(this,e))return;
  if(tacticalAce(e))return tacticalVolley(this,e,args,volley,WEAPONS);
  return volley.call(this,e,...args);
 };
 const fire=proto.fireEnemy;
 proto.fireEnemy=function(e,...args){return tacticalFire(this,e,args,fire,WEAPONS)};
 const attack=proto.aceAttack;
 proto.aceAttack=function(e,...args){
  if(!tacticalAce(e))return attack.call(this,e,...args);
  if(!authoritative(this))return;
  // Keep the sortie owner's exact reservation/retry behavior outside our slot.
  if(!readySlot(this,e))return attack.call(this,e,...args);
  const s=stateFor(this,e),p=ENEMY_ACE_PROFILES[e.bossPilot],contact=this.enemyCombatTarget(e),now=nowOf(this);
  if(!aceShotReady(this,e,contact,{signature:true})){
   s.pendingCooldown??=e.abilityTimer;e.abilityTimer=.25;s.skillReady=true;return;
  }
  if(s.pendingCooldown!=null){e.abilityTimer=s.pendingCooldown;s.pendingCooldown=null}
  s.skillReady=false;s.skillHeading=e.a;s.signatureAt=now;
  s.signatureUntil=now+.8;
  // Longstanding payloads/cooldowns are invoked once, after real positioning.
  // Legacy heading assignments are restored; the nose turns in steering only.
  const heading=e.a,disengageUntil=e.disengageUntil,start=this.bullets?.length||0,result=attack.call(this,e,...args);
  // Legacy skills add a separate 2.4s firing hold. The tactical state machine
  // already owns disengagement; retain only a hold that preceded this skill.
  e.disengageUntil=disengageUntil;
  const rotated=diff(heading,e.a);e.a=heading;
  if(rotated)for(let i=start;i<(this.bullets?.length||0);i++){
   const b=this.bullets[i];if(b.sourcePilot!==e.bossPilot)continue;
   const c=Math.cos(rotated),sn=Math.sin(rotated),vx=b.vx,vy=b.vy,dx=b.x-e.x,dy=b.y-e.y;
   b.vx=vx*c-vy*sn;b.vy=vx*sn+vy*c;b.x=e.x+dx*c-dy*sn;b.y=e.y+dx*sn+dy*c;
  }
  for(let i=start;i<(this.bullets?.length||0);i++){
   const b=this.bullets[i];if(b.sourcePilot===e.bossPilot&&Math.hypot(b.x-e.x,b.y-e.y)<2){b.x=e.x+Math.cos(heading)*(e.muzzleOffset??25);b.y=e.y+Math.sin(heading)*(e.muzzleOffset??25)}
  }
  s.signatureUntil=now+(e.fonckBarrage?.time||e.vossReverse||Math.max(.8,e.bossDash||0));
  if(e.fonckBarrage)e.fonckBarrage.heading=heading;
  if(p.tactic==='SCISSORS'||p.tactic==='ACROBAT'||p.tactic==='REVERSAL')enter(this,e,s,'DEFEND',Math.max(1.2,s.signatureUntil-now),heading);
  else enter(this,e,s,'ATTACK',Math.max(.8,s.signatureUntil-now),heading);
  s.grazeCount=0;s.grazeUntil=0;return result;
 };
}

// Co-op owns target/volley methods but inherits the real movement and the
// already-wrapped aceAttack. Do not double-install those inherited layers.
export function installEnemyAceCoopTactics(CoopGame,{WEAPONS}){
 const proto=CoopGame.prototype;if(Object.hasOwn(proto,'__enemyAceCoopTactics'))return;proto.__enemyAceCoopTactics=true;
 const target=proto.enemyCombatTarget,volley=proto.enemyVolley,fire=proto.fireEnemy;
 proto.enemyCombatTarget=function(e,...args){return aceCombatTarget(this,e,target.call(this,e,...args))};
 proto.enemyVolley=function(e,...args){
  if(!escortShotReady(this,e))return;
  if(tacticalAce(e))return tacticalVolley(this,e,args,volley,WEAPONS);
  return volley.call(this,e,...args);
 };
 proto.fireEnemy=function(e,...args){return tacticalFire(this,e,args,fire,WEAPONS)};
}

import {disposeIntrusion, intrusionWorldPoint, startOperationIntrusion, stepIntrusion} from './intrusion-bosses.js';
import {syncIntrusionTarget} from './intrusion-boss-host.js';
import {intrusionArtReady, intrusionLayout, intrusionMuzzle, prepareIntrusionArt} from './intrusion-boss-art.js';
import {maritimeWeaponsReady, revealMaritimeDecoy} from './maritime-intrusion.js';
import {queueArtilleryMuzzle} from './artillery-fx.js?v=20261026';
import {SPECIAL_OPERATION_LIMIT, SPECIAL_OPERATION_PERISCOPE as SCOPE} from './special-operations.js?v=tension20261107';

const contacts = ['U-35', 'U-38', 'U-139'];
const live = vessel => vessel.hp > 0 && !vessel.expired && !vessel.crashing;
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const ahead = (x,y,a,forward,side=0) => ({x:x+Math.cos(a)*forward-Math.sin(a)*side,y:y+Math.sin(a)*forward+Math.cos(a)*side});
const percent = vessel => Math.ceil(100*vessel.hp/vessel.maxHp);

export const submarineOperationBriefing = faction => faction==='central'
 ? ['유보트 전대 지원','U-139를 엄호하고 초계기와 Q-Ship을 제압하세요.','노획 특수장비','U-boat squadron support','Cover U-139 and silence the patrols and the Q-ship.','Captured equipment']
 : ['유보트 전대 격퇴','잠항한 유보트는 잠망경 위를 낮게 날면 떠오릅니다. 수송선을 지키며 격침하세요.','노획 특수장비','Repel the U-boat squadron','Fly low over a periscope to force the U-boat up. Guard the transports and sink them.','Captured equipment'];

export function startSubmarineOperation(game,battle,player){
 const escort=battle.faction==='central',a=battle.heading;
 const ships=(escort?['U-139','U-35','U-38']:['수송선 1','수송선 2']).map((name,i)=>{
  const profileId=escort?'uboat':'qship',layout=intrusionLayout(profileId);
  const length=escort?(i===0?270:204):246,hp=escort?(i===0?225:126):122;
  const position=ahead(player.x,player.y,a,190-i*(escort?145:185),i===0?0:i===1?-100:100);
  const scale=length/(layout.waterHeight||layout.height);
  return {...position,name,a,profileId,scale,hp,maxHp:hp,hullLength:length*.46,hullWidth:24,faction:battle.faction,
   movingShip:!escort,driveVelocity:escort?10:12,age:0,phase:'active',naval:{phase:'surfaced',phaseAge:0,clock:0,reveal:0}};
 });
 battle.naval={ships,contactIndex:0,nextContact:2,ownerId:null,escort,pressure:[],strikeAt:0,reinforced:false};
 if(typeof Image!=='undefined')for(const id of ['uboat','qship'])prepareIntrusionArt(id).catch(()=>{});
}

function startContact(game,battle,player){
 const naval=battle.naval,stage=game.stageBoss.stages,flagship=naval.contactIndex===contacts.length-1;
 const displayName=naval.escort?'Q-Ship':contacts[naval.contactIndex];
 const e=startOperationIntrusion(game,naval.escort?'qship':'uboat',{
  stageIndex:stage.stageIndex,loopIndex:stage.loopIndex,width:(game.viewWidth||960)/(game.camera?.zoom||1),
  height:(game.viewHeight||700)/(game.camera?.zoom||1),regularBossHp:naval.escort?1750:flagship?1170:610,
  displayName
 });
 if(naval.escort)e.disguiseDuration=8;
 if(!naval.escort&&flagship)e.scale*=1.18;
 naval.ownerId=e.encounterId;
 if(naval.escort){
  const strike=ahead(player.x,player.y,battle.heading,330,92);
  e.operationContact={...strike,a:battle.heading+Math.PI};
 }else{
  const target=naval.ships.find(live),side=naval.contactIndex===1?-1:1;
  e.operationContact={...ahead(target.x,target.y,battle.heading,240,side*145),a:battle.heading+Math.PI};
 }
 return e;
}

function advanceShips(naval,elapsed,dt){
 for(const [i,ship] of naval.ships.entries()){
  if(!live(ship)){ship.sinkAge=(ship.sinkAge||0)+dt;continue;}
  ship.age=elapsed;
  const phase=naval.escort?(elapsed+i*.9)%18:0;
  const state=phase<11?'surfaced':phase<12?'diving':phase<16.8?'submerged':'surfacing';
  ship.naval.phase=state;
  ship.naval.phaseAge=phase-(state==='surfaced'?0:state==='diving'?11:state==='submerged'?12:16.8);
  ship.naval.periscopeAngle=elapsed*.3;
  ship.naval.clock=elapsed;
  ship.driveVelocity=state==='submerged'?15:naval.escort?10:12;
  Object.assign(ship,ahead(ship.x,ship.y,ship.a,ship.driveVelocity*dt));
 }
}

function stepSurfacePressure(game,battle,e,dt,spawnAir){
 const naval=battle.naval,flagship=naval.ships[0];
 if(!naval.reinforced&&battle.elapsed>=3){naval.reinforced=true;spawnAir(flagship,2,'bomber');spawnAir(flagship,2,'hunter');}
 for(const plane of battle.enemies.filter(p=>p.operationNavalBomber&&live(p)&&game.enemies.includes(p))){
  plane.frontRoute=ahead(flagship.x,flagship.y,flagship.a,80);
  if(battle.elapsed<(plane.operationNavalStrikeAt||0)||distance(plane,flagship)>240||flagship.naval.phase==='submerged')continue;
  const travel=flagship.driveVelocity*1.65;
  naval.pressure.push({...ahead(flagship.x,flagship.y,flagship.a,travel),fireX:plane.x,fireY:plane.y,age:0,warning:1.65,radius:42,damage:23,bomb:true});
  plane.operationNavalStrikeAt=battle.elapsed+7;
 }
 if(e?.phase==='active'&&e.contactPlaced&&!e.naval.revealing&&distance(e,flagship)<360)revealMaritimeDecoy(e);
 if(e?.phase==='active'&&e.contactPlaced&&maritimeWeaponsReady(e)&&battle.elapsed>=naval.strikeAt&&distance(e,flagship)<640&&flagship.naval.phase==='surfaced'){
  const side=Math.sin(Math.atan2(flagship.y-e.y,flagship.x-e.x)-e.a)>0?'starboard':'port';
  const gun=['fore_'+side,'aft_'+side].find(id=>e.parts[id]?.hp>0);
  if(gun){
   const muzzle=intrusionMuzzle('qship',gun,e.turretAngles[gun]||0);
   const start=intrusionWorldPoint(e,muzzle),angle=Math.atan2(flagship.y-start.y,flagship.x-start.x);
   const barrel=e.a+Math.PI/2+muzzle.angle;
   if(Math.cos(angle-barrel)>.85){
    naval.strikeAt=battle.elapsed+4.6;
    queueArtilleryMuzzle(game,{...start,angle:barrel,scale:.72,heavy:true});
    naval.pressure.push({...ahead(flagship.x,flagship.y,flagship.a,flagship.driveVelocity*1.8),fireX:start.x,fireY:start.y,age:0,warning:1.8,radius:38,damage:19});
   }
  }
 }
 for(const hazard of naval.pressure){
  hazard.age+=dt;
  if(hazard.done||hazard.age<hazard.warning)continue;
  hazard.done=true;
  const ship=naval.ships.find(s=>live(s)&&s.naval.phase!=='submerged'&&distance(s,hazard)<hazard.radius+20);
  if(ship)ship.hp=Math.max(0,ship.hp-hazard.damage);
  game.combatBlast?.(hazard.x,hazard.y,hazard.radius,'enemy','structure');
 }
 naval.pressure=naval.pressure.filter(h=>h.age<h.warning+.35);
}

// Periscope hunt (Entente): runs after the contact's own phase step. Unforced, a surfaced
// U-boat dives after SCOPE.window s and stays under for SCOPE.hide s, showing only its
// wake. A pilot holding over the wake for SCOPE.markTime s forces it up and pins it for
// SCOPE.pinned s. Diving control knocked out (hp 0) already keeps it up on its own.
function setPhase(e,phase){const n=e.naval;n.phase=phase;n.phaseAge=0;e.shotCues=[];e.hazards=[];}
export function stepPeriscopeHunt(game,battle,e,dt){
 const n=e?.naval;if(!n||e.phase!=='active'||!e.contactPlaced)return;
 const fresh=battle.naval.hunt?.id!==e.encounterId;
 const hunt=battle.naval.hunt=fresh?{id:e.encounterId,mark:0,hidden:0,pinnedUntil:0,marks:battle.naval.hunt?.marks||0}:battle.naval.hunt;
 // Each contact makes its approach at periscope depth.
 if(fresh&&n.phase==='surfaced'){n.cycle=(n.cycle||0)+1;n.travelAngle=e.a;setPhase(e,'diving');return;}
 const now=battle.elapsed,pilots=[game,...(game.players||[])].filter(p=>p&&p.hp>0&&p.status!=='downed');
 const over=pilots.some(p=>distance(p,e)<=SCOPE.markRadius);
 hunt.over=false;
 if(n.phase==='surfaced'){
  hunt.mark=0;hunt.hidden=0;
  const limit=now<hunt.pinnedUntil?Infinity:SCOPE.window;
  if(n.phaseAge>=limit&&!(e.parts?.dive_control?.hp<=0)&&!e.hazards?.some(h=>!h.done)){
   n.cycle=(n.cycle||0)+1;n.travelAngle=e.a+(n.cycle%2?1:-1)*.35;setPhase(e,'diving');
  }
  return;
 }
 if(n.phase==='surfacing')return;
 hunt.hidden+=dt;hunt.over=over;
 hunt.mark=over?hunt.mark+dt:Math.max(0,hunt.mark-dt*.5);
 if(hunt.mark>=SCOPE.markTime){
  hunt.mark=0;hunt.marks=(hunt.marks||0)+1;hunt.pinnedUntil=now+SCOPE.pinned+1.2;
  setPhase(e,'surfacing');
  game.event?.('operationMark','');
  return;
 }
 // Hold it under until the hide time runs out (its own clock would surface it sooner).
 if(n.phase==='submerged'&&hunt.hidden<SCOPE.hide)n.phaseAge=Math.min(n.phaseAge,.5);
}

export function tickSubmarineOperation(game,battle,player,dt,spawnAir){
 const naval=battle.naval,stage=game.stageBoss.stages;
 advanceShips(naval,battle.elapsed,dt);
 const protectedShips=naval.escort?naval.ships.slice(0,1):naval.ships;
 if(!protectedShips.some(live)||battle.elapsed>=SPECIAL_OPERATION_LIMIT)return 'failed';
 let encounter=game.intrusionBoss;
 if(naval.ownerId&&encounter?.encounterId===naval.ownerId&&encounter.phase==='resolved'){
  if(encounter.reason!=='destroyed'){
   if(encounter.reason==='sea-lane-blocked'||encounter.reason==='traffic-blocked'){
    naval.ownerId=null;naval.nextContact=battle.elapsed+1.5;
   }else return 'failed';
  }else{
   naval.contactIndex++;
   naval.ownerId=null;
   naval.nextContact=battle.elapsed+1.5;
  }
 }
 const goal=naval.escort?1:contacts.length;
 if(!naval.ownerId&&naval.contactIndex<goal&&battle.elapsed>=naval.nextContact)encounter=startContact(game,battle,player);
 if(naval.ownerId&&encounter?.encounterId===naval.ownerId){
  encounter.operationTimeLeft=SPECIAL_OPERATION_LIMIT-battle.elapsed;
  stepIntrusion(game,dt,{phase:'operation-active',stageIndex:stage.stageIndex,remaining:SPECIAL_OPERATION_LIMIT-battle.elapsed,
   artReady:id=>typeof Image==='undefined'||intrusionArtReady(id)});
  if(!naval.escort){stepPeriscopeHunt(game,battle,encounter,dt);naval.contactPhase=encounter.phase==='active'?encounter.naval?.phase:null;}
  syncIntrusionTarget(game);
 }
 if(naval.escort)stepSurfacePressure(game,battle,encounter,dt,spawnAir);
 if(naval.contactIndex>=goal&&(!naval.escort||!battle.enemies.some(e=>live(e)&&game.enemies.includes(e))))return 'succeeded';
 return null;
}

export function clearSubmarineOperation(game,battle){
 if(!battle.naval.ownerId||game.intrusionBoss?.encounterId!==battle.naval.ownerId)return;
 disposeIntrusion(game,'operation-ended');
 syncIntrusionTarget(game);
}

export function submarineOperationCard(battle,en){
 const naval=battle.naval,flagship=naval.ships[0],time=Math.max(0,Math.ceil(SPECIAL_OPERATION_LIMIT-battle.elapsed));
 const status=naval.escort?`U-139 ${percent(flagship)}% · ${en?'Patrol aircraft':'대잠 초계기'} ${battle.enemies.filter(live).length}`
  : `${en?'Transports':'수송선'} ${naval.ships.filter(live).length}/2 · ${en?'Submarines sunk':'격침'} ${naval.contactIndex}/3`;
 const escortText=naval.contactIndex?(en?'Down the patrols':'초계기 격추'):(en?'Cover U-139':'U-139 엄호');
 return {title:submarineOperationBriefing(battle.faction)[en?3:0],
  objective:naval.escort?escortText:huntObjective(battle,en),
  meta:`${status} · ${time}${en?' s':'초'}`,urgent:time<=12||naval.escort&&flagship.hp<.3*flagship.maxHp};
}

function huntObjective(battle,en){
 const naval=battle.naval,e=battle.naval.hunt,phase=naval.ownerId?naval.contactPhase:null;
 if(phase==='submerged'||phase==='diving'){
  const pct=Math.floor(100*Math.min(1,(e?.mark||0)/SCOPE.markTime));
  return e?.over?(en?`Marking periscope · ${pct}%`:`잠망경 표시 · ${pct}%`):(en?'Find the periscope':'잠망경 추적');
 }
 if(phase==='surfaced'||phase==='surfacing')return battle.elapsed<(e?.pinnedUntil||0)
  ?(en?`Surfaced · attack · ${Math.ceil(e.pinnedUntil-battle.elapsed)} s`:`부상 · 공격 · ${Math.ceil(e.pinnedUntil-battle.elapsed)}초`)
  :(en?'Surfaced · attack':'부상 · 공격');
 return en?'Guard the transports':'수송선 엄호';
}

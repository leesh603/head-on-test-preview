import {disposeIntrusion, intrusionWorldPoint, startOperationIntrusion, stepIntrusion} from './intrusion-bosses.js';
import {syncIntrusionTarget} from './intrusion-boss-host.js';
import {intrusionArtReady, intrusionLayout, intrusionMuzzle, prepareIntrusionArt} from './intrusion-boss-art.js';
import {maritimeWeaponsReady, revealMaritimeDecoy} from './maritime-intrusion.js';
import {queueArtilleryMuzzle} from './artillery-fx.js?v=20261026';
import {SPECIAL_OPERATION_LIMIT} from './special-operations.js?v=tension20261107';

const contacts = ['U-35', 'U-38', 'U-139'];
const live = vessel => vessel.hp > 0 && !vessel.expired && !vessel.crashing;
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const ahead = (x,y,a,forward,side=0) => ({x:x+Math.cos(a)*forward-Math.sin(a)*side,y:y+Math.sin(a)*forward+Math.cos(a)*side});
const percent = vessel => Math.ceil(100*vessel.hp/vessel.maxHp);

export const submarineOperationBriefing = faction => faction==='central'
 ? ['유보트 전대 지원','U-139를 엄호하고 대잠 초계기를 격추하세요. 위장을 푼 Q-Ship의 함포를 제압해 매복을 돌파하세요.','노획 특수장비','U-boat squadron support','Cover U-139, intercept the patrol aircraft and silence the Q-ship when it opens its gun covers.','Captured equipment']
 : ['유보트 전대 격퇴','수송선 두 척 중 최소 한 척을 지키세요. 어뢰를 쏘는 잠수함을 부상 중에 공격하고 기함 U-139를 격침하세요.','노획 특수장비','Repel the U-boat squadron','Keep at least one transport afloat. Hit the submarines on the surface and sink the flagship U-139.','Captured equipment'];

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
  height:(game.viewHeight||700)/(game.camera?.zoom||1),regularBossHp:naval.escort?1190:flagship?1170:610,
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
 const escortText=naval.contactIndex?(en?'Clear the remaining patrol aircraft':'남은 대잠 초계기를 격추하세요'):(en?'Cover U-139 · Intercept patrol aircraft':'U-139 엄호 · 대잠 초계기 요격');
 return {title:submarineOperationBriefing(battle.faction)[en?3:0],
  objective:naval.escort?escortText:en?'Protect the transports · Strike on surfacing':'수송선을 지키고 부상한 유보트를 공격하세요',
  meta:`${status} · ${time}${en?' s':'초'}`,urgent:time<=12||naval.escort&&flagship.hp<.3*flagship.maxHp};
}

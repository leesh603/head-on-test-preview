import {reserveFacilitySlot} from './ground-facility-missions.js';
import {intrusionActive} from './intrusion-bosses.js';
import {ACE_SORTIE_BALANCE} from './ace-sortie-rhythm.js?v=sortierhythm1&art=pilot-recovery2';
// Two bounded, persistent combat groups. Aircraft always use the normal combat
// simulation, including offscreen: no arrival respawns or second damage model.
export const FRONT_TYPES = Object.freeze({
 intercept:{ko:'폭격편대 요격',en:'Intercept bombers',mission:'BOMBER_INTERCEPT'},
 recon:{ko:'정찰기 구조',en:'Rescue reconnaissance',mission:'PHOTO_RECON'},
 commander:{ko:'편대장 제거',en:'Destroy flight leader',mission:'HIGH_VALUE_TARGET'},
 escort:{ko:'폭격기 호위',en:'Escort bomber',mission:'RECON_ESCORT'},
 elite:{ko:'정예 편대 차단',en:'Stop elite flight',mission:'HIGH_VALUE_TARGET'},
 support:{ko:'지원기 구출',en:'Rescue support flight',mission:'RESCUE'}
});
const pairs=[['intercept','recon'],['commander','escort'],['elite','support'],['recon','commander'],['escort','intercept'],['support','elite']];
const destroyed=u=>u?.hp<=0||u?.deathHandled;
const alive=u=>u?.hp>0&&!u.expired&&!u.deathHandled&&!u.rivalEscaped;
const players=g=>(g.players||[g]).filter(p=>p.hp>0&&p.status!=='downed');
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const key=g=>`${g.stageCombatWindow?.loopIndex??0}:${g.stageCombatWindow?.stageIndex??0}:${g.worldRegion?.()}`;
const boss=g=>intrusionActive(g)||g.stageBoss?.stages?.phase==='boss'||g.stageCombatWindow?.approaching||g.stageCombatWindow?.ready;
const ace=g=>(g.enemies||[]).some(e=>alive(e)&&(e.bossPilot||e.type==='boss'));
export const activeFronts=g=>(g.ruralFronts?.fronts||[]).filter(f=>f.status==='active');
export const frontLocation=f=>alive(f.protected)?f.protected:f.targets.find(alive)||f;
export function frontBrief(g,f,en=false){
 const n=f.targets.filter(e=>!destroyed(e)).length,total=f.targets.length;
 const hp=Math.max(0,Math.ceil(100*(f.protected?.hp||0)/(f.protected?.maxHp||1)));
 const seconds=Math.max(0,Math.ceil(f.deadline-g.t));
 const actions=en?{intercept:`Bombers ${n}/${total}`,commander:`Leader ${n}/${total}`,elite:`Elite ${n}/${total}`,recon:`Protect recon · ${hp}%`,escort:`Protect bomber · ${hp}%`,support:`Clear attackers · ${hp}%`}:{intercept:`폭격기 ${n}/${total}기 남음`,commander:`편대장 ${n}기 남음`,elite:`정예 ${n}기 남음`,recon:`정찰기 보호 · ${hp}%`,escort:`폭격기 보호 · ${hp}%`,support:`추격기 제거 · ${hp}%`};
 return actions[f.type]+' · '+seconds+(en?'s':'초');
}
const effects={intercept:'후속 폭격 차단 · 다음 교전 아군 폭격',recon:'정찰 확보 · 보스 약점 노출',commander:'적 편대 붕괴 · 다음 교전 지휘 약화',escort:'폭격대 생환 · 다음 교전 폭격 지원',elite:'정예 차단 · 다음 교전 지휘 약화',support:'지원기 생환 · 보급 확보'};
export function frontTarget(g,e){
 const f=e.ruralFront;if(!f||f.status!=='active')return null;
 if(e.frontRoute)return e.frontRoute;
 let target=f.patrols.find(alive),best=target?distance(e,target):Infinity;
 for(const p of players(g))if(distance(p,frontLocation(f))<650&&distance(e,p)<best){target=p;best=distance(e,p)}
 return target||{x:f.x+Math.cos((g.t||0)*.15)*220,y:f.y+Math.sin((g.t||0)*.15)*220,a:e.a};
}
function spawnEnemy(g,f,type,i=0){
 const previous=g.battlefieldEventSpawning,mechanic=g.bossMechanicSpawn;
 let e;try{g.battlefieldEventSpawning=true;g.bossMechanicSpawn=type==='bomber';e=g.spawnEnemy?.(type)}finally{g.battlefieldEventSpawning=previous;g.bossMechanicSpawn=mechanic}
 if(!e)return null;
 Object.assign(e,{ruralFront:f,missionTarget:true,battlefieldEventId:f.id,x:f.x+180+(i%2)*70,y:f.y+(i-1)*95,a:Math.PI,fire:1.5+i*.3,directorFireHoldUntil:(g.t||0)+1.5});
 const minimum=type==='bomber'?110:f.type==='commander'&&i===0?75:f.type==='elite'?55:35;
 e.hp=e.maxHp=Math.max(e.maxHp||e.hp,minimum);
 f.enemies.push(e);return e;
}
function patrol(g,f,plane){
 const p={ruralFront:f,slot:0,x:f.x-140,y:f.y,a:0,plane:plane||g.allyPlane||'camel',hp:112,maxHp:112,life:90,speed:185,fire:.3,invuln:.6,hitFlash:0,altitude:g.altitude,target:null,think:0,pass:0,waypoint:{x:f.x,y:f.y}};
 (g.patrols??=[]).push(p);f.patrols.push(p);return p;
}
function makeFront(g,state,type,side){
 const p=players(g)[0]||g,reach=Math.max(620,Math.min(850,(p.speed||200)*3.5));
 const f={id:`front-${++state.serial}`,type,side,x:p.x+side*reach,y:p.y-100,status:'active',startedAt:g.t,deadline:g.t+48,enemies:[],patrols:[],targets:[],entered:false};
 const central=g.teamFaction==='central'||g.allyPlane==='fokker';
 const friendly=patrol(g,f,type==='recon'?(central?'dfw_cv':'re7'):type==='escort'?(central?'gotha':'handley-page'):null);
 if(['recon','escort','support'].includes(type))f.protected=friendly;
 if(type==='escort'){friendly.frontEscortRoute={x:friendly.x-side*1800,y:friendly.y-900};friendly.waypoint=friendly.frontEscortRoute;friendly.a=Math.atan2(friendly.frontEscortRoute.y-friendly.y,friendly.frontEscortRoute.x-friendly.x);friendly.speed=125;}
 const count=type==='intercept'?2:type==='elite'?3:2;
 for(let i=0;i<count;i++){const e=spawnEnemy(g,f,type==='intercept'?'bomber':'hunter',i);if(!e)continue;
  if(type==='intercept'){e.frontRoute={x:f.x-side*2600,y:f.y-650};e.a=Math.atan2(e.frontRoute.y-e.y,e.frontRoute.x-e.x);e.speed=Math.min(e.speed,110);f.targets.push(e)}
  else if(type==='commander'&&i===0){e.eventCommander=true;f.targets.push(e)}
  else if(type==='elite'){e.dangerMarksman=true;f.targets.push(e);if(i>0){e.formationLeader=f.targets[0];e.formationBack=90;e.formationOffset=i===1?-100:100;}}
 }
 if(type==='intercept')spawnEnemy(g,f,'hunter',2);
 if(type==='commander'&&f.targets[0])for(const e of f.enemies.slice(1)){e.formationLeader=f.targets[0];e.formationBack=80;e.formationOffset=80;}
 return f;
}
export function startRuralFronts(g,forcedPair,forcedDark){
 if(forcedPair===undefined&&reserveFacilitySlot(g))return null;
 const state=g.ruralFronts??={serial:0,fronts:[],history:[],nextAt:8,pair:0,lastDarkAt:-Infinity};
 if(g.worldRegion?.()!==0||(g.mode==='campaign'||g.mode==='coop2')||g.state!=='playing'||activeFronts(g).length||g.battlefieldEvents?.current||boss(g)||ace(g)||g.eliteEnemies?.active)return null;
 if((g.stageCombatWindow?.remaining??60)<52||(g.battleRecoveryUntil||0)>g.t)return null;
 const rng=g.rng||Math.random;
 state.feedback=null;state.regionKey=key(g);state.startedAt=g.t;state.order=[];state.counterAt=null;state.firstEntered=null;state.readDeception=false;state.revealedAt=null;state.ambushTriggered=false;state.ambushAce=null;
 const index=forcedPair??((state.pair+1+Math.floor(rng()*(pairs.length-1)))%pairs.length);state.pair=index;
  const allowDark=g.t-state.lastDarkAt>=150;
 state.dark=forcedDark!==undefined?forcedDark:(allowDark&&rng()<.24?['feint','falseRescue','bomberDecoy','aceAmbush','counterattack'][Math.floor(rng()*5)]:null);
 const pair=['falseRescue','aceAmbush'].includes(state.dark)?['support','intercept']:state.dark==='bomberDecoy'?['intercept','intercept']:state.dark==='feint'?['commander','intercept']:pairs[index];
 state.fronts=pair.map((type,i)=>makeFront(g,state,type,i?1:-1));
 if(state.fronts.some(f=>f.enemies.length<(f.type==='intercept'||f.type==='elite'?3:2))){for(const f of state.fronts){f.status='cancelled';release(g,f,true)}state.nextAt=g.t+8;return null;}
 if(['feint','bomberDecoy'].includes(state.dark)){const main=state.fronts[1];spawnEnemy(g,main,'hunter',2);main.deadline=g.t+38;if(state.dark==='bomberDecoy'){const bait=state.fronts[0],decoy=bait.targets.pop();if(decoy){decoy.expired=true;g.enemies=g.enemies.filter(e=>e!==decoy);bait.enemies=bait.enemies.filter(e=>e!==decoy);}bait.clue='단독 폭격기 · 호위 없이 우회 비행';for(const e of bait.targets)e.frontRoute={x:e.x-2800,y:e.y+200};}}
 if(state.dark){state.lastDarkAt=g.t;const [bait,main]=state.fronts;state.baitId=bait.id;state.mainId=main.id;
  bait.clue=bait.clue||(state.dark==='falseRescue'?'구조 신호 불일치 · 호위기가 지나치게 멀다':state.dark==='aceAmbush'?'고도 위쪽 단독기 흔적 · 접근 주의':state.dark==='counterattack'?'반대편 예비 편대 관측':'선두 편대는 우회 중 · 반대편 밀집 편대 관측');
  if(state.dark==='bomberDecoy'||state.dark==='feint')main.clue='목표로 직진하는 편대 · 우선 차단 가능';
 }
 state.nextAt=g.t+125;g.event?.('frontsOpen','');return state;
}
function release(g,f,cancel=false){
 for(const e of f.enemies){delete e.ruralFront;delete e.frontRoute;e.missionTarget=false;delete e.battlefieldEventId;
  // Far survivors retreat rather than accumulate or reappear at full health.
  if(cancel||players(g).every(p=>distance(p,e)>1000))e.expired=true;
 }
 for(const p of f.patrols){delete p.ruralFront;delete p.frontEscortRoute;if(cancel)p.life=0;else p.life=Math.min(p.life,12);}
}
function finish(g,state,f,outcome,reason){
 if(f.status!=='active')return;
 f.status=outcome;f.reason=reason;f.finishedAt=g.t;state.order.push(f.id);
 const win=outcome==='completed',spec=FRONT_TYPES[f.type];
 // Reuse authored field consequences; two different objectives use independent keys.
 const event={id:f.id,type:spec.mission,region:0,rescue:f.protected};
 const priorSupport=g.battlefieldEvents?.pending?.airSupport?.remaining||0;
 const priorBomber=g.battlefieldEvents?.pending?.bomber;
 g.recordBattlefieldOutcome?.(event,outcome);
 // A stopped decoy cannot erase a real bomber breakthrough (either finish order).
 if(f.type==='intercept'&&win&&priorBomber?.value===1)g.battlefieldEvents.pending.bomber=priorBomber;
 if(win){
  if(g.battlefieldEvents?.pending?.airSupport&&priorSupport)g.battlefieldEvents.pending.airSupport.remaining=Math.min(4,Math.max(priorSupport,g.battlefieldEvents.pending.airSupport.remaining));
  const survivor=f.protected||f.patrols.find(alive);
  if(f.type==='recon')g.event?.('wave','정찰 정보 확보 · 보스 약점 확인');
  if(f.type==='commander'||f.type==='elite')for(const e of f.enemies)if(alive(e)){g.breakEnemyFormation?.(e,3);e.directorFireHoldUntil=g.t+3;}
  if(survivor){survivor.life=Math.max(survivor.life,15);survivor.waypoint={x:g.x,y:g.y};}
  (g.drops??=[]).push({x:f.x,y:f.y,value:18,heal:false,battlefieldEvent:true});
  if(state.dark==='counterattack'&&activeFronts(g).length){state.counterAt=g.t+7;g.event?.('wave','적 예비대 역습 접근 · 반대 전선 7초 뒤 증원');}
 }else if(f.type!=='intercept'){
  // A failed rescue/elite operation changes the next formation, not just its toast.
  g.recordBattleSceneOutcome?.({sceneId:f.id,region:0,outcome:'breakthrough'});
 }
 state.feedback={until:g.t+8,title:`${f.side<0?'서쪽':'동쪽'} ${spec.ko} · ${win?'성공':'실패'}`,detail:win?effects[f.type]:(f.type==='intercept'?'적 폭격대 돌파 · 다음 교전 폭격 공세':'아군 작전 상실 · 다음 교전 적 공세'),win};
 g.event?.('wave',state.feedback.title);
 release(g,f);
 if(!activeFronts(g).length){
  const wins=state.fronts.filter(x=>x.status==='completed').length;
  state.result={wins,order:[...state.order],dark:state.dark,readDeception:!!state.readDeception};
  if(wins===2||state.readDeception){g.spawnAlly?.();g.event?.('ally',state.readDeception?'기만 간파 · 추가 엄호기 합류':'두 전선 확보 · 추가 엄호기 합류');}
  state.history.push(state.result);state.history=state.history.slice(-6);
 }
}
export function tickRuralFronts(g){
 if(g.state!=='playing')return;
 const state=g.ruralFronts??={serial:0,fronts:[],history:[],nextAt:8,pair:0,lastDarkAt:-Infinity};
 const fronts=activeFronts(g);
 if(fronts.length&&(g.worldRegion?.()!==0||key(g)!==state.regionKey||boss(g)||ace(g)&&!state.ambushAce)){
  for(const f of fronts){f.status='cancelled';release(g,f,true)}state.feedback=null;state.nextAt=g.t+20;return;
 }
 if(!fronts.length){if(g.t>=state.nextAt)startRuralFronts(g);return;}
 for(const f of fronts){
  const radius=Math.max(150,Math.min(360,Math.min(g.viewWidth||960,g.viewHeight||700)*.4));
  const near=players(g).some(p=>distance(p,frontLocation(f))<radius+(f.inContact?100:0));
  if(near&&!f.inContact){
   f.entered=true;f.enteredAt??=g.t;state.firstEntered??=f.id;
   if(g.t-(f.lastContactNotice??-Infinity)>6){g.event?.('wave',`${f.side<0?'서쪽':'동쪽'} 전선 도착 · ${FRONT_TYPES[f.type].ko}`);f.lastContactNotice=g.t;}
  }
  f.inContact=near;
  const bait=f.id===state.baitId;
  if(['falseRescue','aceAmbush'].includes(state.dark)&&bait&&near&&!state.revealedAt){state.revealedAt=g.t;g.event?.('wave','매복 징후 · 3초 뒤 협공, 이탈 가능');}
  if(state.revealedAt&&g.t>=state.revealedAt+3&&!state.ambushTriggered&&bait&&['falseRescue','aceAmbush'].includes(state.dark)){
   state.ambushTriggered=true;
   if(state.dark==='aceAmbush'&&!ace(g)&&(g.stageCombatWindow?.remaining??0)>30&&(g.battleRecoveryUntil||0)<=g.t&&g.t-Math.max(g.aceSortie?.endedAt??-Infinity,g._aceCombatEndedAt??-Infinity)>=ACE_SORTIE_BALANCE.recovery&&g.availableAcePilots?.().length){
    // Final spawn API retains the duplicate/cooldown/fair-entry contracts.
    state.ambushAce=g.spawnEnemy?.('boss')||null;
   }else for(let i=0;i<2;i++)if(f.enemies.filter(alive).length<4)spawnEnemy(g,f,'hunter',i+2);
  }
  if(state.counterAt&&g.t>=state.counterAt){for(let i=0;i<2;i++)if(f.enemies.filter(alive).length<4)spawnEnemy(g,f,'hunter',i+2);state.counterAt=null;}
  if(f.protected&&!alive(f.protected)){finish(g,state,f,'failed','protectedLost');continue;}
  if(f.targets.some(e=>!destroyed(e)&&(e.expired||e.rivalEscaped))){finish(g,state,f,'failed','targetEscaped');continue;}
  if(f.targets.length&&f.targets.every(destroyed)){
   if(state.dark&&f.id===state.mainId&&!state.fronts.find(x=>x.id===state.baitId)?.entered){state.readDeception=true;}
   finish(g,state,f,'completed','targetsDestroyed');continue;
  }
  if(f.type==='escort'&&f.protected?.frontEscortRoute&&distance(f.protected,f.protected.frontEscortRoute)<160){finish(g,state,f,'completed','escortArrived');continue;}
  if(f.type!=='escort'&&f.protected&&f.enemies.length&&f.enemies.every(destroyed)){finish(g,state,f,'completed','threatsDestroyed');continue;}
  if(f.type==='intercept'&&f.targets.some(e=>alive(e)&&e.frontRoute&&distance(e,e.frontRoute)<180)){finish(g,state,f,'failed','bombersEscaped');continue;}
  if(g.t>=f.deadline){finish(g,state,f,f.type!=='escort'&&f.protected&&alive(f.protected)?'completed':'failed','deadline');}
 }
}


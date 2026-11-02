/** One optional major encounter per ordinary exploration window. Existing schedulers
 * keep their own aircraft, timers and objectives; this is their shared admission. */
const SPECIAL=new Set([7,11,14,16,17,18]);
const KINDS=['named','ace','heavy','mission'];
const live=e=>e&&e.hp>0&&!e.expired&&!e.crashing&&!e.rivalEscaped;
const now=g=>g.t||0;
export function ordinaryAdmissionStage(g){const s=g.stageBoss?.stages;return !!s&&g.mode!=='campaign'&&!g.historicalMode&&!g.stage?.historicalAnchorDate&&!SPECIAL.has(g.worldRegion?.()??s.stageIndex);}
export function admissionTrace(g,type,detail={}){
 if(!g.directorDebug&&!Array.isArray(g.battleDirectorTrace))return;
 const trace=g.battleDirectorTrace??=[];trace.push({at:now(g),type,...detail});if(trace.length>1024)trace.splice(0,trace.length-1024);
}
function present(g,kind){
 if(kind==='named')return !!g.squadronDirector?.owner?.pending||!!g.eliteEnemies?.pendingEncounter||!!g.eliteEnemies?.active||(g.enemies||[]).some(e=>live(e)&&(e.cigognesRole||e.hatRingGroup!=null||e.famousWingGroup!=null||e.expansionWingGroup!=null||e.legendWingGroup!=null))||(g.bullets||[]).some(b=>b.life>0&&(b.cigognesGroup!=null||b.hatRingGroup!=null||b.famousWingGroup!=null||b.expansionWingGroup!=null||b.legendWingGroup!=null));
 if(kind==='ace')return (g.enemies||[]).some(e=>live(e)&&(e.bossPilot||e.type==='boss'));
 if(kind==='heavy')return ['warning','entering','active','retreating'].includes(g.intrusionBoss?.phase)||(g.enemies||[]).some(e=>live(e)&&(e.heavyBomber||e.type==='zeppelin'));
 return !!(g.londonBattle||g.parisBattle||g.verdunBattle)||g.battlefieldEvents?.current?.status==='active'||['active','pending','dispatching'].includes(g.photoReconDirector?.phase)||(g.ruralFronts?.fronts||[]).some(f=>f.status==='active');
}
export function admissionState(g){
 const stage=g.stageBoss?.stages,key=stage?`${stage.loopIndex||0}:${stage.orderPosition||0}:${stage.stageIndex}`:'none',time=now(g);
 let s=g.directorAdmission;
 if(!s||s.key!==key||time<(s.lastTime??time)){
  const order=stage?.orderPosition??stage?.stageIndex??0,index=((stage?.loopIndex||0)*3+order)%KINDS.length;
  const opportunities=g.squadronDirector?.opportunities||0,ordinary=ordinaryAdmissionStage(g);
  // A fast first aircraft can close its53-second distance window before the
  // protected30-second first opportunity has enough encounter time remaining.
  // Carry that never-attempted named reservation to one ordinary visit only;
  // native special stages preserve the deferred slot without consuming it.
  const missedNamed=s?.kind==='named'&&!s.used&&!s.fulfilledKind&&!s.namedCarryUsed&&opportunities<=(s.opportunitiesAtEntry??0);
  const carryNamed=!!s?.deferredNamed||missedNamed;
  const enteredAt=g.stageStartTime??time,reserved=carryNamed?'named':s?.used&&s.fulfilledKind&&s.fulfilledKind!==s.kind?s.kind:KINDS[index],kind=reserved==='named'&&(g.squadronDirector?.lastClearedAt??-Infinity)+90>enteredAt+50?'ace':reserved;
  s=g.directorAdmission={key,kind,missionVariant:(Math.floor(order/4)+(stage?.loopIndex||0))%2?'event':'recon',enteredAt,active:null,used:false,requests:[],lastTime:time,opportunitiesAtEntry:opportunities,namedCarryUsed:carryNamed&&ordinary,deferredNamed:carryNamed&&!ordinary};
  admissionTrace(g,'majorReserved',{kind:s.kind,stage:key});
 }
 s.lastTime=time;
 if(!ordinaryAdmissionStage(g))return s;
 if(s.active==='named'&&s.pending&&present(g,'named')&&!g.squadronDirector?.owner?.pending&&!g.eliteEnemies?.pendingEncounter){s.pending=false;s.used=true;s.fulfilledKind??='named';s.admittedAt=time;admissionTrace(g,'majorAdmitted',{kind:'named'});}
 if(s.active&&!present(g,s.active)&&time>s.admittedAt+1){
  admissionTrace(g,s.pending?'spawnCancelled':'majorResolved',{kind:s.active,reason:s.pending?'native-admission-cancelled':'resolved'});s.active=null;
  if(!s.pending)g.battleRecoveryUntil=Math.max(g.battleRecoveryUntil||0,time+5);s.pending=false;
 }
 // Rivals and authored major objectives already using this region consume its
 // optional slot. Do not squeeze a delayed reservation in after their defeat.
 if(!s.active){const external=KINDS.find(kind=>present(g,kind));if(external){s.active=external;s.pending=external==='named'&&!!(g.squadronDirector?.owner?.pending||g.eliteEnemies?.pendingEncounter);if(!s.pending){s.used=true;s.fulfilledKind??=external;}s.admittedAt=time;admissionTrace(g,'majorObserved',{kind:external,pending:s.pending,reserved:s.kind});}}
 for(const request of s.requests)if(!request.cancelled&&time>=request.expiresAt){request.cancelled=true;admissionTrace(g,'spawnCancelled',{kind:request.kind,reason:'expired'});}
 s.requests=s.requests.filter(r=>!r.cancelled);
 return s;
}
export function majorEncounterRemaining(g){
 const w=g.stageCombatWindow,s=g.stageBoss?.stages;
 if(w&&w.stageIndex===s?.stageIndex&&(w.loopIndex||0)===(s?.loopIndex||0)&&Number.isFinite(w.remaining))return Math.max(0,w.remaining);
 return Math.max(0,90-(now(g)-(g.stageStartTime??now(g))));
}
export function encounterAllowed(g,kind,{minRemaining=24,reserve=true,variant}={}){
 if(g.online&&!g.host||g.state!=='playing'||g.stageBoss?.stages?.phase==='boss')return false;
 if(!ordinaryAdmissionStage(g))return true;
 const s=admissionState(g),time=now(g),remaining=majorEncounterRemaining(g);
 let reason=null;
 if(s.active)reason='major-active';
 else if(s.used)reason='region-slot-used';
 else if(kind!==s.kind)reason='other-major-reserved';
 else if(kind==='mission'&&variant&&variant!==s.missionVariant&&time-s.enteredAt<45)reason='other-mission-reserved';
 else if(g.stageCombatWindow?.ready||remaining<minRemaining)reason='boss-window';
 else if(time<(g.battleRecoveryUntil||0)||g.battleDirector?.pattern==='RECOVERY'||g.battleDirector?.awaitingRecovery)reason='recovery';
 else if(time-s.enteredAt<8)reason='opening';
 const p=g.players?.find(p=>p.hp>0&&p.status!=='downed')||g,compact=(g.viewWidth||960)<=720;
 const bullets=(g.bullets||[]).filter(b=>b.enemy&&b.life>0&&Math.hypot(b.x-p.x,b.y-p.y)<480).length;
 if(!reason&&bullets>(compact?16:24))reason='projectile-pressure';
 if(!reason){if(s.lastApprovalKind!==kind){admissionTrace(g,'spawnApproved',{kind,remaining});s.lastApprovalKind=kind;}return true;}
 if(reserve&&!s.used&&!s.requests.some(r=>r.kind===kind)&&!['region-slot-used','boss-window'].includes(reason)){
  const expiresAt=time+Math.min(18,Math.max(0,remaining-minRemaining));if(expiresAt>time){s.requests.push({kind,requestedAt:time,expiresAt});if(s.requests.length>4)s.requests.shift();admissionTrace(g,'spawnRequested',{kind,reason,expiresAt});}
 }
 s.deniedReasons??={};if(s.deniedReasons[kind]!==reason){admissionTrace(g,'spawnDeferred',{kind,reason});s.deniedReasons[kind]=reason;s.lastDenied={kind,reason};}
 return false;
}
export function admitEncounter(g,kind,detail={}){
 if(!ordinaryAdmissionStage(g))return;
 const s=admissionState(g);if(s.explicitAdmissionAt===now(g)&&s.active===kind)return;
 s.active=kind;s.pending=false;s.used=true;s.fulfilledKind??=kind;s.admittedAt=now(g);s.explicitAdmissionAt=now(g);s.requests=[];admissionTrace(g,'majorAdmitted',{kind,...detail});
}
export function releaseEncounter(g,kind,reason='resolved'){
 if(!ordinaryAdmissionStage(g))return;
 const s=g.directorAdmission;if(!s||s.active!==kind)return;
 s.active=null;g.battleRecoveryUntil=Math.max(g.battleRecoveryUntil||0,now(g)+5);admissionTrace(g,'majorResolved',{kind,reason});
}

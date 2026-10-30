let currentEvent=null;

function ensureShell(){
 let shell=document.getElementById('battlefieldEventShell');
 if(shell)return shell;
 shell=document.createElement('section');shell.id='battlefieldEventShell';shell.className='battlefield-event-shell';shell.hidden=true;
 shell.setAttribute('role','dialog');shell.setAttribute('aria-modal','false');shell.setAttribute('aria-labelledby','battlefieldEventTitle');
 const panel=document.createElement('div');panel.className='battlefield-event-panel';
 const tag=document.createElement('small');tag.textContent='BATTLEFIELD EVENT';
 const title=document.createElement('h2');title.id='battlefieldEventTitle';
 const description=document.createElement('p');description.id='battlefieldEventDescription';
 const actions=document.createElement('div');actions.className='battlefield-event-actions';
 const decline=document.createElement('button');decline.type='button';decline.dataset.eventAction='decline';
 const accept=document.createElement('button');accept.type='button';accept.dataset.eventAction='accept';
 actions.append(decline,accept);panel.append(tag,title,description,actions);shell.append(panel);document.body.append(shell);
 return shell;
}

export function hideBattlefieldEvent(){
 const shell=document.getElementById('battlefieldEventShell');if(!shell)return;
 shell.classList.remove('is-visible');shell.hidden=true;currentEvent=null;
}

export function showBattlefieldEvent({title='',description='',acceptText='수락',declineText='거절',onAccept,onDecline}={}){
 const shell=ensureShell();
 shell.querySelector('#battlefieldEventTitle').textContent=title;
 shell.querySelector('#battlefieldEventDescription').textContent=description;
 shell.querySelector('[data-event-action="accept"]').textContent=acceptText;
 shell.querySelector('[data-event-action="decline"]').textContent=declineText;
 const finish=accepted=>{
  const callback=accepted?onAccept:onDecline;hideBattlefieldEvent();callback?.();
 };
 shell.onclick=event=>{
  const action=event.target.closest('[data-event-action]')?.dataset.eventAction;
  if(action)finish(action==='accept');
 };
 shell.hidden=false;requestAnimationFrame(()=>shell.classList.add('is-visible'));
 currentEvent={close:hideBattlefieldEvent,element:shell};
 shell.querySelector('[data-event-action="accept"]').focus({preventScroll:true});
 return currentEvent;
}

window.showBattlefieldEvent=showBattlefieldEvent;
window.hideBattlefieldEvent=hideBattlefieldEvent;

// Regional operations share this compact objective/reward model with result feedback.
// Counts follow region-doctrine1's actual all-targets completion contract.
export function regionalMissionUi(event,en=false){
 const type=event?.type,targets=event?.targets||[],done=targets.filter(t=>t.hp<=0||t.deathHandled).length;
 const labels={
  FORWARD_OBSERVER:['관측기구·호위기 격파','Destroy balloon and escorts'],
  ARTILLERY_SPOTTER:['포병 관측기 격추','Destroy artillery spotters'],
  BLACKOUT:['탐조등 파괴','Destroy searchlight'],
  BOMBER_STREAM:['폭격기·호위기 격추','Destroy bombers and escorts'],
  MOUNTAIN_PURSUIT:['에이스·호위기 격추','Destroy ace and escorts'],
  AMMO_DEPOT:['탄약고 파괴','Destroy ammunition depot'],
  FLEET_CROSSING:['함포 사격을 피하며 생존','Survive naval gunfire'],
  GAS_ATTACK:['독가스 구역을 피해 생존','Stay clear of gas and survive']
 };
 if(!labels[type])return null;
 const ambient=type==='FLEET_CROSSING'||type==='GAS_ATTACK';
 const extra={FORWARD_OBSERVER:['다음 포격 차단','Next artillery strike cancelled'],ARTILLERY_SPOTTER:['다음 포격 차단','Next artillery strike cancelled'],BOMBER_STREAM:['다음 폭격 차단','Next bomber operation cancelled'],BLACKOUT:['15초 정전','15s blackout'],AMMO_DEPOT:['항구 보스 시설 방해','Harbor boss disruption']}[type];
 return {objective:labels[type][en?1:0]+(ambient?'':' '+done+'/'+targets.length),reward:(en?'XP·repair supplies':'경험치·수리 보급')+(extra?' · '+extra[en?1:0]:'')};
}

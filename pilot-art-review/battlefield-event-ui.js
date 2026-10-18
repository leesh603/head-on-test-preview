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

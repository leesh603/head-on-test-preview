import {PILOT_CHALLENGES,pilotUnlocked,pilotUnlockProgress} from './pilot-unlocks.js?v=capital-final-20261030';

const challenge=id=>Array.isArray(PILOT_CHALLENGES)?PILOT_CHALLENGES.find(d=>d.id===id):PILOT_CHALLENGES[id];
const node=(doc,tag,cls,text)=>{const el=doc.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el};
const LOCK_SVG='<svg viewBox="0 0 12 14" aria-hidden="true"><path d="M3 6V4a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="1.5" y="6" width="9" height="7" rx="1.2" fill="currentColor"/></svg>';
// Same padlock glyph as the locked campaign tab.
function lockBadge(doc,host,cls,on){let m=host.querySelector('.'+cls);if(on&&!m){m=node(doc,'small',cls);m.innerHTML=LOCK_SVG;host.append(m)}if(m)m.hidden=!on}
export function pilotUnlockRosterState(pilots){return Object.keys(pilots).map(id=>({id,locked:!pilotUnlocked(id)}))}

// Reuse the current skill detail space. Hidden skill nodes retain their dimensions.
export function renderPilotUnlockDetails({id,pilots,getLocale=()=> 'ko',document:doc=globalThis.document}={}){
 if(!doc||!pilots?.[id])return;
 const en=getLocale()==='en',locked=!pilotUnlocked(id),d=challenge(id),name=pilots[id].name;
 const roster=doc.getElementById('pilotTabs');
 for(const b of roster?.querySelectorAll('[data-pilot-id]')||[]){const off=!pilotUnlocked(b.dataset.pilotId);b.classList.toggle('pilot-locked',off);b.dataset.pilotLocked=String(off);b.title=(pilots[b.dataset.pilotId]?.name||'')+(off?(en?' · Not yet in the squadron · View conditions':' · 미합류 · 합류 조건 보기'):'');b.setAttribute('aria-label',b.title);b.querySelector('.pilot-lock-label:not(:has(svg))')?.remove();lockBadge(doc,b,'pilot-lock-label',off)}
 if(!doc.body.classList.contains('playing'))doc.body.classList.toggle('pilot-locked-selected',locked);
 const start=doc.getElementById('start');if(start&&!doc.body.classList.contains('playing')){start.disabled=locked;start.setAttribute('aria-disabled',String(locked));if(locked)start.textContent=en?'Not in the squadron · Meet the join conditions':'미합류 파일럿 · 합류 조건 달성 필요'}
 const progress=pilotUnlockProgress(id)||[];
 const mounts=[doc.querySelector('.skill-info'),doc.querySelector('.lobby-aces-panel .lap-info')].filter(Boolean);
 for(const mount of mounts){mount.classList.toggle('is-pilot-locked',locked);let panel=mount.querySelector('.pilot-unlock-detail');if(!locked||!d){panel?.remove();continue}if(!panel){panel=node(doc,'section','pilot-unlock-detail');panel.tabIndex=0;mount.append(panel)}const signature=JSON.stringify([id,en,progress]);const mobileSkill=mount.querySelector('.lap-sk');if(mobileSkill&&panel.style&&Number.isFinite(mobileSkill.offsetTop))panel.style.top=mobileSkill.offsetTop+'px';if(panel.dataset.signature===signature)continue;panel.dataset.signature=signature;panel.replaceChildren();panel.setAttribute('aria-label',name+(en?' join conditions':' 합류 조건'));
  panel.append(node(doc,'small','pilot-unlock-kicker',en?'Join conditions':'합류 조건'),node(doc,'b',null,d.title||name));
  const history=en?(d.historyEn||d.history):(d.history||d.historyEn);if(history)panel.append(node(doc,'p','pilot-unlock-history',history));
  const description=en?(d.descriptionEn||d.description):d.description;if(description)panel.append(node(doc,'p','pilot-unlock-condition',description));
  const list=node(doc,'div','pilot-unlock-goals');for(const goal of progress){const row=node(doc,'div'),done=Math.min(goal.value||0,goal.goal),bar=node(doc,'i','pilot-unlock-bar'),fill=node(doc,'i');fill.style&&(fill.style.width=(goal.goal?100*done/goal.goal:0)+'%');bar.append(fill);row.classList?.toggle('done',done>=goal.goal);row.append(node(doc,'span',null,en?(goal.labelEn||goal.label):goal.label),node(doc,'strong',null,`${done.toLocaleString()} / ${goal.goal.toLocaleString()}`),bar);list.append(row)}panel.append(list,node(doc,'small','pilot-unlock-status',en?'Joins your squadron for good once every goal is met':'모든 조건 달성 시 편대에 영구 합류'));
 }
 const mobile=doc.querySelector('.lobby-aces-panel');if(mobile){mobile.classList.toggle('pilot-locked-preview',locked);for(const b of mobile.querySelectorAll('[data-pick]')){const off=!pilotUnlocked(b.dataset.pick);b.classList.toggle('pilot-locked',off);b.setAttribute('aria-label',(pilots[b.dataset.pick]?.name||'')+(off?(en?' · Not yet in the squadron · View conditions':' · 미합류 · 합류 조건 보기'):''));b.dataset.pilotLocked=String(off);lockBadge(doc,b,'pilot-lock-badge',off)}}
}

export function installPilotUnlockUI({book,getGame,getSelected,pilots,getLocale=()=> 'ko',portraitSource=()=>null,onUnlock,sound,document:doc=globalThis.document}={}){
 if(!doc||!book)return null;
 const link=node(doc,'link');link.rel='stylesheet';link.href='./pilot-unlocks.css?v=capital-final-20261030';doc.head.append(link);
 const toast=node(doc,'aside','pilot-unlock-toast');toast.id='pilotUnlockToast';toast.hidden=true;toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');doc.body.append(toast);
 let queue=[],timer=0,run=null,lastResult='',pendingRender=0;const seen=new Set();
 const render=()=>{pendingRender=0;if(getSelected)renderPilotUnlockDetails({id:getSelected(),pilots,getLocale,document:doc})};
 const scheduleRender=()=>{if(!pendingRender)pendingRender=globalThis.requestAnimationFrame?.(render)||setTimeout(render,0)};
 function showNext(){if(timer||!queue.length)return;const id=queue.shift(),d=challenge(id),en=getLocale()==='en';toast.replaceChildren();const source=portraitSource(id);if(source){const img=node(doc,'img');img.src=source;img.alt='';toast.append(img)}const copy=node(doc,'div');copy.append(node(doc,'small',null,en?'JOINED THE SQUADRON':'편대 합류!'),node(doc,'b',null,pilots[id]?.name||id),node(doc,'span',null,(d?.title||'')+(en?' · Conditions met':' 달성')));toast.append(copy);toast.hidden=false;try{sound?.()}catch{}timer=setTimeout(()=>{toast.hidden=true;timer=0;showNext()},3400)}
 const unsubscribe=book.subscribe(({newPilots=[]}={})=>{for(const id of newPilots){if(!pilots[id]||seen.has(id))continue;seen.add(id);queue.push(id)}showNext();if(!getGame?.())scheduleRender();if(newPilots.length)onUnlock?.(newPilots)});
 // The mobile view copies the existing roster asynchronously. Observe only that roster,
 // and the mobile grid's child list, so our own badge/detail changes do not recurse.
 const observer=typeof MutationObserver==='function'?new MutationObserver(records=>{if(records.some(r=>r.type==='childList'&&[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('.lobby-aces-panel,[data-pick]')||n.querySelector?.('.lobby-aces-panel,[data-pick]')))))scheduleRender()}):null;
 observer?.observe(doc.body,{childList:true,subtree:true});
 function sync(){const g=getGame?.();if(g!==run){run=g;lastResult='';doc.getElementById('pilotUnlockResult')?.remove()}if(!g||!['lost','won'].includes(g.state))return;const sessions=g.pilotUnlockSession||{},own=g.online?g.localPlayerId:null,ids=[...new Set(own?sessions[own]||[]:Object.values(sessions).flat())];const signature=ids.join(',')+':'+getLocale();const modal=doc.getElementById('modal');if(!ids.length||!modal||modal.classList.contains('hidden'))return;if(signature===lastResult&&doc.getElementById('pilotUnlockResult'))return;lastResult=signature;let box=doc.getElementById('pilotUnlockResult');if(!box){box=node(doc,'section','pilot-unlock-result');box.id='pilotUnlockResult';doc.getElementById('modalText')?.after(box)}box.replaceChildren(node(doc,'b',null,getLocale()==='en'?'Joined the squadron this sortie':'이번 출격에 합류한 파일럿'));for(const id of ids){const item=node(doc,'span');const source=portraitSource(id);if(source){const img=node(doc,'img');img.src=source;img.alt='';item.append(img)}item.append(node(doc,'span',null,pilots[id]?.name||id));box.append(item)}}
 link.onload=scheduleRender;globalThis.addEventListener?.('resize',scheduleRender);render();return{sync,refresh:scheduleRender,dispose(){unsubscribe();observer?.disconnect();globalThis.removeEventListener?.('resize',scheduleRender);clearTimeout(timer);if(pendingRender)globalThis.cancelAnimationFrame?.(pendingRender);toast.remove();link.remove();doc.getElementById('pilotUnlockResult')?.remove()}};
}

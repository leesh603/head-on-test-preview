import {OnlineCoopGame} from './online-coop-game.js?v=raid3&coopfix=1&rail=18';

export function relayUrl(){
 const configured=globalThis.HEADON_COOP_RELAY||new URLSearchParams(location.search).get('coopRelay');
 if(configured){const url=new URL(configured);if(!['ws:','wss:'].includes(url.protocol)||location.protocol==='https:'&&url.protocol!=='wss:')throw Error('안전한 Co-op 서버 주소를 확인하세요.');return url.href;}
 if(['localhost','127.0.0.1','[::1]'].includes(location.hostname))return `${location.protocol==='https:'?'wss':'ws'}://${location.host}/coop`;
 throw Error('온라인 Co-op 서버가 아직 연결되지 않았습니다. 테스트 서버 설정 후 이용할 수 있습니다.');
}
export class OnlineSession {
 constructor({url,onLobby,onStart,onStatus,onEnd}){Object.assign(this,{url,onLobby,onStart,onStatus,onEnd});this.closed=false;this.attempts=0;this.started=false;this.reconnectUntil=0;this.role=null;}
 connect(hello){
  this.hello=hello;const socket=this.socket=new WebSocket(this.url);this.onStatus?.('Co-op 서버 연결 중…');
  const timeout=setTimeout(()=>{if(socket.readyState===0){socket.close();this.onStatus?.('서버에 연결하지 못했습니다. 다시 시도하세요.');}},8000);
  socket.onopen=()=>{clearTimeout(timeout);this.send(hello);};
  socket.onerror=()=>this.onStatus?.('서버 연결을 확인하고 다시 시도하세요.');
  socket.onmessage=e=>{
   if(this.closed||socket!==this.socket)return;
   let m;try{m=JSON.parse(e.data);}catch{return;}
   if(m.type==='joined'){this.code=m.code;this.role=m.role;this.token=m.token;this.reconnectUntil=0;if(this.role==='guest')try{sessionStorage.setItem('headon-online-room',JSON.stringify({url:this.url,code:this.code,token:this.token}));}catch{}this.onStatus?.(this.role==='host'?'Host · 친구를 기다리는 중':'Guest · 연결됨');}
   else if(m.type==='lobby')this.onLobby?.(m);
   else if(m.type==='start'){if(!this.started){this.started=true;this.onStart?.(this,m);}else if(m.resumed)this.send({type:'resync'});this.onStatus?.(m.resumed?'재접속 완료':'온라인 Co-op · 연결됨');}
   else if(m.type==='error'){this.onStatus?.(m.message);this.closed=true;socket.close();}
   else if(m.type==='ended'){this.finish(m.reason);}
   else {if(m.type==='peer')this.onStatus?.(m.connected?'Guest 재접속 완료':'Guest 연결 끊김 · 30초 동안 재접속 대기');this.onGameMessage?.(m);}
  };
  socket.onclose=()=>{
   clearTimeout(timeout);if(this.closed||this.socket!==socket)return;
   if(this.role==='guest'&&this.started){
    this.reconnectUntil||=Date.now()+28000;
    if(Date.now()<this.reconnectUntil){this.onStatus?.('연결 끊김 · 같은 방으로 재접속 중…');this.onGameMessage?.({type:'linkLost'});this.retry=setTimeout(()=>this.connect({type:'join',code:this.code,token:this.token}),1000);return;}
   }
   this.finish(this.role==='host'?'Host 연결이 끊겨 작전이 종료되었습니다.':'방 연결이 종료되었습니다.');
  };
 }
 send(message){if(this.socket?.readyState!==1||this.socket.bufferedAmount>512*1024)return false;this.socket.send(JSON.stringify(message));return true;}
 forget(){try{const saved=JSON.parse(sessionStorage.getItem('headon-online-room')||'null');if(saved?.code===this.code)sessionStorage.removeItem('headon-online-room');}catch{}}
 finish(reason){if(this.closed)return;this.closed=true;this.forget();clearTimeout(this.retry);this.socket?.close();this.onEnd?.(reason);}
 leave(){if(this.closed)return;this.send({type:'leave'});this.closed=true;this.forget();clearTimeout(this.retry);this.socket?.close();}
}

export function installOnlineLobby({getLoadout,getGame,onStart,onEnd}){
 const mode=document.createElement('button');mode.id='onlineCoopMode';mode.type='button';mode.hidden=true;mode.textContent='온라인 Co-op';mode.setAttribute('aria-pressed','false');document.getElementById('hangar').append(mode);
 const panel=document.createElement('section');panel.id='onlineCoopPanel';panel.className='coop-panel hidden';panel.setAttribute('aria-label','온라인 2인 협동');
 panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
 panel.innerHTML='<span class="panel-eyebrow">ONLINE CO-OP</span><h3 class="panel-title">친구와 함께 출격</h3><p>각자 파일럿을 선택하고 같은 진영으로 준비하세요.</p><div class="online-room-actions"><button type="button" id="onlineCreate">새 방 만들기</button><span class="online-room-divider">또는 친구의 방에 참가</span><label for="onlineCode">방 코드<input id="onlineCode" maxlength="6" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="6자리 코드"></label><button type="button" id="onlineJoin">참가하기</button></div><p id="onlineRoomCode"></p><div id="onlinePlayers"></div><p id="onlineStatus" role="status" aria-live="polite">방을 만들거나 친구의 코드를 입력하세요.</p><div class="online-lobby-footer"><button type="button" id="onlineReady" hidden>출격 준비</button><button type="button" id="onlineLeave">닫기</button></div>';

 const seat=()=>{if(panel.parentElement!==document.body)document.body.append(panel);};
 seat();
 const status=document.createElement('span');status.id='onlineConnection';status.hidden=true;status.setAttribute('role','status');document.getElementById('viewport').append(status);
 let session=null,ready=false;
 const $=id=>document.getElementById(id);
 const message=text=>{$('onlineStatus').textContent=text;status.textContent=text;};
 const close=()=>{session?.leave();session=null;ready=false;panel.classList.add('hidden');mode.setAttribute('aria-pressed','false');$('onlineReady').hidden=true;$('onlineCreate').disabled=false;$('onlineJoin').disabled=false;$('onlineCode').disabled=false;$('onlineRoomCode').textContent='';$('onlinePlayers').replaceChildren();message('방을 만들거나 친구의 코드를 입력하세요.');$('onlineLeave').textContent='닫기';if(!getGame())$('onlineCoopEntry')?.focus({preventScroll:true});};
 mode.onclick=()=>{if(getGame())return;seat();panel.classList.toggle('hidden');mode.setAttribute('aria-pressed',String(!panel.classList.contains('hidden')));if(!panel.classList.contains('hidden'))$('onlineCreate').focus({preventScroll:true});};
 const open=type=>{
  if(getGame())return;const enteredCode=$('onlineCode').value.trim().toUpperCase();if(type==='join'&&!/^[A-Z2-9]{6}$/.test(enteredCode)){message('6자리 방 코드를 확인하세요.');$('onlineCode').focus();return;}session?.leave();ready=false;
  let url;try{url=relayUrl();}catch(e){message(e.message);return;}
  session=new OnlineSession({url,onStatus:message,onLobby:m=>{
   $('onlineRoomCode').textContent='방 코드 · '+m.code;$('onlineCreate').disabled=true;$('onlineJoin').disabled=true;$('onlineCode').disabled=true;$('onlineLeave').textContent='방 나가기';
   $('onlinePlayers').replaceChildren(...m.players.map(p=>{const row=document.createElement('div');row.className='online-player-seat';const name=document.createElement('b');name.textContent=p.role===session.role?'나':p.connected?'동료':'동료 대기';const state=document.createElement('span');state.textContent=p.connected?(p.ready?'준비 완료':'준비 대기'):'미접속';row.append(name,state);return row;}));
   $('onlineReady').hidden=!!m.started;const own=m.players.find(p=>p.role===session.role);ready=!!own?.ready;$('onlineReady').textContent=ready?'준비 취소':'출격 준비';
   $('onlineCode').value=m.code;
  },onStart:(s,data)=>{status.hidden=false;panel.classList.add('hidden');onStart(s,data);},onEnd:reason=>{message(reason);$('onlineReady').hidden=true;$('onlineCreate').disabled=false;$('onlineJoin').disabled=false;$('onlineCode').disabled=false;onEnd(reason);}});
  const code=$('onlineCode').value.trim().toUpperCase();let token;try{const saved=JSON.parse(sessionStorage.getItem('headon-online-room')||'null');if(type==='join'&&saved?.code===code&&saved.url===url)token=saved.token;}catch{}
  session.connect({type,code,token,config:getLoadout()});
 };
 $('onlineCreate').onclick=()=>open('create');$('onlineJoin').onclick=()=>open('join');
 $('onlineReady').onclick=()=>{if(session?.send({type:'ready',ready:!ready}))ready=!ready;};
 $('onlineLeave').onclick=close;
 panel.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();close();return;}if(e.key==='Enter'&&e.target===$('onlineCode')){e.preventDefault();open('join');return;}if(e.key==='Tab'){const buttons=[...panel.querySelectorAll('button:not([hidden]):not(:disabled),input:not(:disabled)')];const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};
 return {close(){close();status.hidden=true;},createGame:(s,data)=>new OnlineCoopGame(s,data),input(g,inputs,joy){return g.localInput(inputs,joy);},controls(g){
  const p=g.player(g.localPlayerId),live=g.state==='playing'&&p.status==='alive';
  $('touchSkill').disabled=!live||p.cooldown>0;$('touchEvade').disabled=!live||p.evadeCooldown>0;$('reload').disabled=!live||p.reloadTime>0;
  $('skillButtonState').textContent=p.cooldown>0?Math.ceil(p.cooldown)+'초':'준비';$('maneuverButtonState').textContent=p.evadeCooldown>0?Math.ceil(p.evadeCooldown)+'초':'준비';
  $('touchSkill').style.setProperty('--ready',1-Math.min(1,p.cooldown/p.skillCooldown()));$('touchEvade').style.setProperty('--ready',1-Math.min(1,p.evadeCooldown/(8*(p.evadeCooldownMult||1))));
 }};
}

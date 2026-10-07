import {OnlineCoopGame} from './online-coop-game.js';

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
 panel.innerHTML='<p>선택한 파일럿으로 출격합니다. 친구와 같은 진영을 선택하세요.</p><div class="online-room-actions"><button type="button" id="onlineCreate">방 만들기</button><label for="onlineCode">Room Code<input id="onlineCode" maxlength="6" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="6자리 코드"></label><button type="button" id="onlineJoin">참가</button></div><p id="onlineRoomCode"></p><p id="onlinePlayers"></p><p id="onlineStatus" role="status" aria-live="polite">방을 만들거나 친구의 코드를 입력하세요.</p><button type="button" id="onlineReady" hidden>준비</button> <button type="button" id="onlineLeave">닫기</button>';
 document.getElementById('hangar').append(panel);
 const status=document.createElement('span');status.id='onlineConnection';status.hidden=true;status.setAttribute('role','status');document.getElementById('viewport').append(status);
 let session=null,ready=false;
 const $=id=>document.getElementById(id);
 const message=text=>{$('onlineStatus').textContent=text;status.textContent=text;};
 const close=()=>{session?.leave();session=null;ready=false;panel.classList.add('hidden');mode.setAttribute('aria-pressed','false');$('onlineReady').hidden=true;};
 mode.onclick=()=>{if(getGame())return;panel.classList.toggle('hidden');mode.setAttribute('aria-pressed',String(!panel.classList.contains('hidden')));};
 const open=type=>{
  if(getGame())return;session?.leave();ready=false;
  let url;try{url=relayUrl();}catch(e){message(e.message);return;}
  session=new OnlineSession({url,onStatus:message,onLobby:m=>{
   $('onlineRoomCode').textContent='Room Code · '+m.code;
   $('onlinePlayers').textContent=m.players.map(p=>(p.role==='host'?'Host · P1':'Guest · P2')+' · '+(p.connected?(p.ready?'준비 완료':'준비 대기'):'미접속')).join(' / ');
   $('onlineReady').hidden=!!m.started;const own=m.players.find(p=>p.role===session.role);ready=!!own?.ready;$('onlineReady').textContent=ready?'준비 취소':'준비';
   $('onlineCode').value=m.code;
  },onStart:(s,data)=>{status.hidden=false;panel.classList.add('hidden');onStart(s,data);},onEnd:reason=>{message(reason);$('onlineReady').hidden=true;onEnd(reason);}});
  const code=$('onlineCode').value.trim().toUpperCase();let token;try{const saved=JSON.parse(sessionStorage.getItem('headon-online-room')||'null');if(type==='join'&&saved?.code===code&&saved.url===url)token=saved.token;}catch{}
  session.connect({type,code,token,config:getLoadout()});
 };
 $('onlineCreate').onclick=()=>open('create');$('onlineJoin').onclick=()=>open('join');
 $('onlineReady').onclick=()=>{if(session?.send({type:'ready',ready:!ready}))ready=!ready;};
 $('onlineLeave').onclick=close;
 return {close(){close();status.hidden=true;},createGame:(s,data)=>new OnlineCoopGame(s,data),input(g,inputs,joy){return g.localInput(inputs,joy);},controls(g){
  const p=g.player(g.localPlayerId),live=g.state==='playing'&&p.status==='alive';
  $('touchSkill').disabled=!live||p.cooldown>0;$('touchEvade').disabled=!live||p.evadeCooldown>0;$('reload').disabled=!live||p.reloadTime>0;
  $('skillButtonState').textContent=p.cooldown>0?Math.ceil(p.cooldown)+'초':'준비';$('maneuverButtonState').textContent=p.evadeCooldown>0?Math.ceil(p.evadeCooldown)+'초':'준비';
  $('touchSkill').style.setProperty('--ready',1-Math.min(1,p.cooldown/p.skillCooldown()));$('touchEvade').style.setProperty('--ready',1-Math.min(1,p.evadeCooldown/(8*(p.evadeCooldownMult||1))));
 }};
}

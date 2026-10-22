import {createServer} from 'node:http';
import {randomBytes} from 'node:crypto';
import {createReadStream,statSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {WebSocketServer} from 'ws';

const root=fileURLToPath(new URL('../',import.meta.url));
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const token=()=>randomBytes(24).toString('hex');
const code=()=>Array.from(randomBytes(6),b=>alphabet[b%alphabet.length]).join('');
const send=(socket,message)=>{if(socket?.readyState===1&&socket.bufferedAmount<1024*1024)socket.send(JSON.stringify(message));else if(socket?.readyState===1)socket.terminate();};
const config=value=>value&&typeof value.pilot==='string'&&value.pilot.length<40&&typeof value.plane==='string'&&value.plane.length<50&&['central','entente'].includes(value.faction)?{pilot:value.pilot,plane:value.plane,faction:value.faction,nickname:String(value.nickname||'').slice(0,12)}:null;

// Transport only. No scores, ranking writes, RNG simulation or combat claims here.
export function createCoopRelay({staticRoot=root,reconnectMs=30000,maxRooms=500,origins=null}={}){
 const rooms=new Map();
 const server=createServer((req,res)=>{
  if(req.url==='/health'){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({ok:true,rooms:rooms.size}));return;}
  if(!staticRoot){res.writeHead(404);res.end();return;}
  let name;try{name=decodeURIComponent(new URL(req.url,'http://local').pathname)}catch{res.writeHead(400);res.end();return;}
  const path=resolve(staticRoot,'.'+(name==='/'?'/index.html':name));
  if(!path.startsWith(resolve(staticRoot)+sep)||name.split('/').some(p=>p.startsWith('.')||['server','node_modules','tests','tools'].includes(p))){res.writeHead(403);res.end();return;}
  try{if(!statSync(path).isFile())throw Error();}catch{res.writeHead(404);res.end();return;}
  const type={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg','.wav':'audio/wav'}[extname(path)]||'application/octet-stream';
  res.writeHead(200,{'content-type':type,'cache-control':'no-cache'});createReadStream(path).pipe(res);
 });
 const wss=new WebSocketServer({noServer:true,maxPayload:512*1024,perMessageDeflate:false});
 server.on('upgrade',(req,socket,head)=>{
  const origin=req.headers.origin;
  if(new URL(req.url,'http://local').pathname!=='/coop'||origins&&origin&&!origins.includes(origin)){socket.end('HTTP/1.1 403 Forbidden\r\n\r\n');return;}
  wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));
 });
 const lobby=room=>{const state={type:'lobby',code:room.code,started:!!room.start,players:['host','guest'].map(role=>({role,connected:room[role]?.socket?.readyState===1,ready:!!room[role]?.ready,config:room[role]?.config||null}))};for(const role of ['host','guest'])send(room[role]?.socket,state);};
 const end=(room,reason)=>{rooms.delete(room.code);for(const role of ['host','guest']){const p=room[role];if(p){clearTimeout(p.expiry);send(p.socket,{type:'ended',reason});p.socket?.close(1000,reason);}}};
 wss.on('connection',socket=>{
  socket.alive=true;socket.on('pong',()=>socket.alive=true);socket.on('error',()=>{});
  socket.windowAt=Date.now();socket.count=0;socket.bytes=0;
  const helloTimer=setTimeout(()=>{if(!socket.room)socket.close(1008,'Join timeout')},10000);helloTimer.unref();
  socket.on('message',(raw,binary)=>{
   const now=Date.now();if(now-socket.windowAt>=1000){socket.windowAt=now;socket.count=0;socket.bytes=0;}
   if(binary||++socket.count>40||(socket.bytes+=raw.length)>4*1024*1024){socket.close(1008,'Rate limit');return;}
   let m;try{m=JSON.parse(raw)}catch{socket.close(1008,'Invalid message');return;}
   if(!m||typeof m.type!=='string')return;
   if(!socket.room){
    let room,role;
    if(m.type==='create'){
     if(rooms.size>=maxRooms){send(socket,{type:'error',message:'방이 가득 찼습니다. 잠시 후 다시 시도하세요.'});return;}
     const fit=config(m.config);if(!fit){send(socket,{type:'error',message:'기체 선택을 확인하세요.'});return;}
     let key;do{key=code()}while(rooms.has(key));room={code:key,created:now,host:{config:fit,token:token(),ready:false}};rooms.set(key,room);role='host';
    }else if(m.type==='join'){
     room=rooms.get(String(m.code||'').toUpperCase());if(!room){send(socket,{type:'error',message:'방 코드를 확인하세요.'});return;}
     role='guest';const fit=config(m.config),prior=room.guest;
     if(prior&&(prior.socket?.readyState===1||m.token!==prior.token)){send(socket,{type:'error',message:'이미 두 명이 참가했거나 재접속 시간이 지났습니다.'});return;}
     if(!prior){if(room.start||!fit||fit.faction!==room.host.config.faction){send(socket,{type:'error',message:'Host와 같은 진영의 파일럿을 선택하세요.'});return;}room.guest={config:fit,token:token(),ready:false};}
    }else return;
    const peer=room[role];clearTimeout(peer.expiry);peer.socket=socket;socket.room=room;socket.role=role;clearTimeout(helloTimer);
    send(socket,{type:'joined',code:room.code,role,token:peer.token});lobby(room);
    if(room.start){send(socket,{...room.start,resumed:true});send(room.host.socket,{type:'resync'});send(room.host.socket,{type:'peer',connected:true});}
    return;
   }
   const room=socket.room,role=socket.role;if(!rooms.has(room.code)||room[role]?.socket!==socket)return;
   if(m.type==='ready'&&!room.start){room[role].ready=!!m.ready;lobby(room);if(room.host.ready&&room.guest?.ready&&room.host.socket.readyState===1&&room.guest.socket.readyState===1){room.start={type:'start',seed:randomBytes(4).readUInt32LE(),runId:token(),players:[room.host.config,room.guest.config]};send(room.host.socket,room.start);send(room.guest.socket,room.start);}}
   else if(role==='host'&&m.type==='state'&&room.start)send(room.guest?.socket,m);
   else if(role==='guest'&&['input','action','choose','pause','resync'].includes(m.type)&&room.start)send(room.host.socket,m);
   else if(m.type==='leave'){if(role==='host')end(room,'Host가 방을 닫았습니다.');else{end(room,'Guest가 작전을 종료했습니다.');}}
  });
  socket.on('close',()=>{
   clearTimeout(helloTimer);const room=socket.room;if(!room||!rooms.has(room.code)||room[socket.role]?.socket!==socket)return;
   room[socket.role].socket=null;
   if(socket.role==='host'){end(room,'Host 연결이 끊겨 작전이 종료되었습니다.');return;}
   room.guest.ready=false;send(room.host.socket,{type:'peer',connected:false,reconnectMs});lobby(room);
   room.guest.expiry=setTimeout(()=>{if(!room.guest.socket){if(room.start)end(room,'Guest 재접속 시간이 지났습니다.');else{room.guest=null;lobby(room);}}},reconnectMs);room.guest.expiry.unref();
  });
 });
 const heartbeat=setInterval(()=>{
  for(const socket of wss.clients){if(!socket.alive){socket.terminate();continue;}socket.alive=false;socket.ping();}
  for(const room of rooms.values())if(Date.now()-room.created>(room.start?4*3600000:600000))end(room,'방 이용 시간이 만료되었습니다.');
 },5000);heartbeat.unref();
 return {server,rooms,async close(){clearInterval(heartbeat);for(const room of rooms.values())end(room,'서버 종료');for(const ws of wss.clients)ws.terminate();await new Promise(r=>wss.close(r));await new Promise(r=>server.close(r));}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const origins=process.env.COOP_ORIGINS?.split(',').filter(Boolean)||['http://localhost:8787','http://127.0.0.1:8787','https://leesh603.github.io'];
 const relay=createCoopRelay({staticRoot:process.env.COOP_STATIC==='0'?null:root,origins});
 relay.server.listen(Number(process.env.PORT)||8787,process.env.HOST||'127.0.0.1',()=>console.log('HEAD-ON Co-op relay: http://'+(process.env.HOST||'127.0.0.1')+':'+(Number(process.env.PORT)||8787)));
}

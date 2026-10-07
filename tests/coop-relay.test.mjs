import test from 'node:test';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import {createCoopRelay} from '../server/coop-relay.mjs';
const config={pilot:'baron',plane:'fokker',faction:'central',nickname:'P'};
async function client(url){const ws=new WebSocket(url),queue=[],waiters=[];ws.on('message',raw=>{const m=JSON.parse(raw);const i=waiters.findIndex(w=>w.type===m.type);if(i>=0)waiters.splice(i,1)[0].resolve(m);else queue.push(m);});await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});return {ws,send:m=>ws.send(JSON.stringify(m)),next(type){const i=queue.findIndex(m=>m.type===type);if(i>=0)return Promise.resolve(queue.splice(i,1)[0]);return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Missing '+type)),3000);waiters.push({type,resolve:m=>{clearTimeout(timer);resolve(m);}});});}};}
async function setup(t,options={}){const relay=createCoopRelay({staticRoot:null,...options});await new Promise(r=>relay.server.listen(0,'127.0.0.1',r));t.after(()=>relay.close());return {relay,url:'ws://127.0.0.1:'+relay.server.address().port+'/coop'};}
test('room / ready / permissions / guest reconnect / host termination',async t=>{
 const {relay,url}=await setup(t),host=await client(url);host.send({type:'create',config});const room=await host.next('joined');assert.match(room.code,/^[A-Z2-9]{6}$/);
 const guest=await client(url);guest.send({type:'join',code:room.code,config});const joined=await guest.next('joined');assert.equal(joined.role,'guest');
 const intruder=await client(url);intruder.send({type:'join',code:room.code,config});assert.match((await intruder.next('error')).message,/두 명/);intruder.ws.close();
 host.send({type:'ready',ready:true});assert.equal(relay.rooms.get(room.code).start,undefined);guest.send({type:'ready',ready:true});const start=await host.next('start');assert.equal((await guest.next('start')).runId,start.runId);
 guest.send({type:'state',world:{hp:999}});host.send({type:'state',seq:1,world:{set:{state:'playing'}}});assert.equal((await guest.next('state')).seq,1);
 guest.send({type:'input',seq:1,input:{angle:0}});assert.equal((await host.next('input')).seq,1);
 guest.ws.terminate();assert.equal((await host.next('peer')).connected,false);
 const resumed=await client(url);resumed.send({type:'join',code:room.code,token:joined.token});assert.equal((await resumed.next('start')).resumed,true);assert.equal((await host.next('peer')).connected,true);await host.next('resync');
 host.ws.terminate();assert.match((await resumed.next('ended')).reason,/Host/);assert.equal(relay.rooms.size,0);
});
test('invalid code and opposite faction reject; guest timeout ends safely',async t=>{
 const {url}=await setup(t,{reconnectMs:40}),host=await client(url);host.send({type:'create',config});const room=await host.next('joined');const wrong=await client(url);wrong.send({type:'join',code:'BADBAD',config});assert.match((await wrong.next('error')).message,/코드/);wrong.send({type:'join',code:room.code,config:{...config,faction:'entente'}});assert.match((await wrong.next('error')).message,/진영/);wrong.ws.close();
 const guest=await client(url);guest.send({type:'join',code:room.code,config});await guest.next('joined');host.send({type:'ready',ready:true});guest.send({type:'ready',ready:true});await host.next('start');guest.ws.terminate();assert.match((await host.next('ended')).reason,/재접속/);
});

import {CoopGame} from './coop-engine.js?v=tame3&rail=11';
import {BossEncounter} from './headon-stageboss-core.js?v=tame3';
import {stageBossSpeed} from './stageboss-host.js?v=tame3&hints=1&rail=11';
import {NET_HZ,MAX_TETHER,seededRandom,cleanInput,pack,unpack,FieldDelta,applyFields,pose,mixAngle} from './online-coop-protocol.js';

const LANES=['enemies','drops','allies','patrols','mines','friendlyBombers','friendlyBombs','bombZones','flakBursts','hostileMinefields','gasZones','gusts','grenades','smokeZones','combatFX','revisionDecoys','enemyAirshipPasses'];
const WORLD=['t','distance','kills','priorityKills','score','state','manualPaused','region','wave','stageStartDistance','stageStartTime','battleDirectorPattern','battleDirector','battlefieldEvents','navalRoute','jutlandRoute','gallipoliRoute','bossBuildings','bossCues','londonBattle','parisBattle','verdunBattle','maanWeather','alpsMountains','cityDefense','activeUpgrade','pendingLevelUps','upgradeSequence'];
const NOTICE=new Set(['wave','skill','downed','revived','end','kill','bossArrival','bossPhase','bossSound','regionTransition','heinecke','heineckeReturn','bombWarning']);
const ownWithoutPose=entity=>{const data=pack(entity);delete data.x;delete data.y;delete data.a;return data;};
const cameraTarget=g=>g.player(g.localPlayerId)?.status==='alive'?g.player(g.localPlayerId):g.living()[0]||g.player(g.localPlayerId);

export class OnlineCoopGame extends CoopGame {
 constructor(session,start){
  super(start.players,{rng:seededRandom(start.seed),runId:start.runId});
  this.online=true;this.session=session;this.host=session.role==='host';this.localPlayerId=this.host?'p1':'p2';this.netSeed=start.seed;
  this._netDelta=new FieldDelta();this._netIds=new WeakMap();this._netSerial=0;this._netBullets=new Map();this._netReplica=new Map();this._netTargets=new Map();this._netEvents=[];this._netSeq=0;this._netInputSeq=0;this._netLastInput=0;this._netRemoteInput={};this._netLastAction=0;this._netLastState=0;this._netDisconnected=false;
  this._netInput={};this._netCorrection={x:0,y:0,a:0};this._netEnded=false;this._netFull=true;this._netHaveBase=this.host;this._netResyncAt=0;
  if(!this.host){this.enemies=[];this.bullets=[];this.state='paused';this.stageBoss=null;}
  session.onGameMessage=message=>this.receive(message);
  this._netTimer=setInterval(()=>this.networkTick(),1000/NET_HZ);
 }
 disposeOnline(){clearInterval(this._netTimer);this.session.onGameMessage=null;}
 worldRegion(){return this.host?super.worldRegion():this.region;}
 updateCamera(dt){const p=cameraTarget(this);if(!p)return;const k=1-Math.exp(-dt*12);this.camera.x+=(p.x-this.camera.x)*k;this.camera.y+=(p.y-this.camera.y)*k;this.camera.zoom=1;}
 constrainMove(p,x0,y0){
  const partner=this.players.find(q=>q!==p&&q.status==='alive');if(!partner)return;
  const dx=p.x-partner.x,dy=p.y-partner.y,d=Math.hypot(dx,dy);if(d>MAX_TETHER){const amount=Math.min(d-MAX_TETHER,Math.hypot(p.x-x0,p.y-y0)*.7);p.x-=dx/d*amount;p.y-=dy/d*amount;}
 }
 // Both clients use their usual WASD/arrow/touch control for their own aircraft.
 localInput(inputs,joy){const input=cleanInput(Number.isFinite(inputs?.p1?.angle)?inputs.p1:inputs?.p2||{});if(Number.isFinite(joy))input.angle=joy;this._netInput=input;return input;}
 keydown(e,input,hooks={},bindings={evade:'Space',skill:'KeyE',reload:'KeyR'}){
  if(e.isComposing||['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName)||e.target?.isContentEditable)return;
  e.preventDefault();const repeat=e.repeat||input.held.has(e.code);input.held.add(e.code);if(repeat||input.blocked.has(e.code))return;
  if(this.state==='upgrade'){
   const item=this.activeUpgrade;if(item?.playerId!==this.localPlayerId)return;
   if(['ArrowLeft','KeyA','ArrowRight','KeyD'].includes(e.code)){input.selection=(input.selection+(['ArrowLeft','KeyA'].includes(e.code)?2:1))%item.choices.length;hooks.highlight?.(input.selection);}
   if(e.code===bindings.skill||e.code==='Enter')hooks.choose?.(item.id,item.choices[input.selection||0].id);
   if(/^Digit[123]$/.test(e.code))hooks.choose?.(item.id,item.choices[Number(e.code.slice(-1))-1]?.id);return;
  }
  if(['Escape','KeyP'].includes(e.code)){input.clear();hooks.pause?.();return;}
  for(const action of ['skill','evade','reload'])if(e.code===bindings[action])this.action(this.localPlayerId,action);
 }
 action(_id,action){
  if(this.state!=='playing'||!['skill','evade','reload'].includes(action))return false;
  if(this.host)return super.action('p1',action);
  this.session.send({type:'action',seq:++this._netInputSeq,action});return true;
 }
 skill(){return this.action(this.localPlayerId,'skill');} evade(){return this.action(this.localPlayerId,'evade');} reload(){return this.action(this.localPlayerId,'reload');}
 pause(){if(this.host){super.pause();return;}this.session.send({type:'pause',paused:true});}
 resume(){if(this._netDisconnected)return false;if(this.host)return super.resume();this.session.send({type:'pause',paused:false});return false;}
 chooseUpgrade(itemId,id){
  if(this.activeUpgrade?.playerId!==this.localPlayerId)return false;
  if(this.host)return super.chooseUpgrade(itemId,id);
  if(this.state!=='upgrade'||this.activeUpgrade.id!==itemId||!this.activeUpgrade.choices.some(c=>c.id===id))return false;
  return this.session.send({type:'choose',itemId,id});
 }
 captureEvents(events){if(this.host)for(const e of events)if(NOTICE.has(e.type))this._netEvents.push(pack(e));}
 idOf(entity){let id=this._netIds.get(entity);if(!id){id='n'+(++this._netSerial);this._netIds.set(entity,id);}return id;}
 receive(m){
  if(this.host){
   if(m.type==='input'&&Number.isSafeInteger(m.seq)&&m.seq>this._netSeq){this._netSeq=m.seq;this._netLastInput=performance.now();this._netRemoteInput=cleanInput(m.input);}
   else if(m.type==='action'&&Number.isSafeInteger(m.seq)&&m.seq>this._netLastAction){this._netLastAction=m.seq;super.action('p2',m.action);}
   else if(m.type==='choose'&&this.activeUpgrade?.playerId==='p2')super.chooseUpgrade(m.itemId,m.id);
   else if(m.type==='pause'){if(m.paused)super.pause();else if(!this._netDisconnected)super.resume();}
   else if(m.type==='resync'){this._netDelta.reset();this._netBullets.clear();this._netFull=true;}
   else if(m.type==='peer'){
    this._netDisconnected=!m.connected;if(!m.connected){this._netResumeAfterPeer=this.state==='playing';super.pause();this._netRemoteInput={};}
    else {const resume=this._netResumeAfterPeer;this._netResumeAfterPeer=false;this._netSeq=0;this._netLastAction=0;this._netLastInput=0;this._netRemoteInput={};this._netDelta.reset();this._netBullets.clear();this._netFull=true;if(resume)super.resume();}
   }
  }else if(m.type==='state')this.acceptState(m);
  else if(m.type==='linkLost'){this.state='paused';}
 }
 networkTick(){
  if(this._netEnded||this.session.closed)return;
  if(!this.host){if(!this._netHaveBase&&performance.now()-this._netResyncAt>500){this._netResyncAt=performance.now();this.session.send({type:'resync'});}this.session.send({type:'input',seq:++this._netInputSeq,input:this._netInput});return;}
  // A reliable ordered delta stream: descriptors once, changed fields + compact
  // motion tuples at 15 Hz. Ordinary projectile trajectories only at birth.
  const world={};for(const key of WORLD)if(this[key]!==undefined)world[key]=pack(this[key]);
  const message={type:'state',seq:++this._netLastState,full:!!this._netFull,world:this._netDelta.take('world',world),players:[],lanes:{},shots:[],retired:[],events:this._netEvents.splice(0)};this._netFull=false;
  for(const p of this.players)message.players.push({id:p.id,pose:pose(p),data:this._netDelta.take(p.id,ownWithoutPose(p))});
  const aliveIds=new Set(['world','boss','p1','p2']);
  for(const lane of LANES){const rows=[];for(const entity of this[lane]||[]){const id=this.idOf(entity);aliveIds.add(id);const data=ownWithoutPose(entity);if(lane==='enemies')data.formationLeaderId=entity.formationLeader?.id??null;rows.push({id,pose:pose(entity),data:this._netDelta.take(id,data)});}message.lanes[lane]=rows;}
  const current=new Set();for(const b of this.bullets){if(b.life<=0)continue;const id=this.idOf(b);current.add(id);if(!this._netBullets.has(id)){message.shots.push({id,data:pack(b)});this._netBullets.set(id,b);}}
  for(const id of this._netBullets.keys())if(!current.has(id)){message.retired.push(id);this._netBullets.delete(id);}
  const sb=this.stageBoss;let boss=null;
  if(sb){const encounter=sb.stages.encounter,stages=pack(sb.stages);delete stages.encounter;
   const bodies=[],hazards=[];
   for(const b of encounter?.bodies.values()||[]){const id=this.idOf(b);aliveIds.add(id);bodies.push({id,data:this._netDelta.take(id,pack(b))});}
   sb.hazards.pool.visit(h=>{const id=this.idOf(h);aliveIds.add(id);hazards.push({id,data:this._netDelta.take(id,pack(h))});});
   boss={meta:this._netDelta.take('boss',{ended:sb.ended,time:sb.time,stages,encounter:encounter?{id:encounter.id,bossId:encounter.bossId,maxHpBudget:encounter.maxHpBudget,hud:pack(encounter.snapshot())}:null,defeatSequence:pack(sb.defeatSequence),bodyDefeats:pack(sb.bodyDefeats)}),bodies,hazards};
  }
  message.boss=boss;this._netDelta.retain(aliveIds);
  if(!this.session.send(message)){this._netDelta.reset();this._netBullets.clear();this._netFull=true;this._netEvents.unshift(...message.events);this._netEvents.length=Math.min(100,this._netEvents.length);}
 }
 acceptState(m){
  if(!Number.isSafeInteger(m.seq)||m.seq<=this._netLastState)return;this._netLastState=m.seq;this._netReceivedAt=performance.now();
  if(!this._netHaveBase&&!m.full)return;this._netHaveBase=true;
  if(m.full){this._netReplica.clear();this._netTargets.clear();this._netBullets.clear();this.bullets=[];}
  const before=this.state,oldRegion=this.region,priorChoice=this.activeUpgrade?.id;applyFields(this,m.world);
  for(const row of m.players){const p=this.player(row.id),status=p.status;applyFields(p,row.data);const [x,y,a,vx,vy]=row.pose;
   if(row.id===this.localPlayerId){
    if(m.full||status!==p.status||Math.hypot(x-p.x,y-p.y)>180||p.status!=='alive'||this.state!=='playing'){p.x=x;p.y=y;p.a=a;this._netCorrection={x:0,y:0,a:0};}
    else {const lead=.065;this._netCorrection={x:x+vx*lead-p.x,y:y+vy*lead-p.y,a:Math.atan2(Math.sin(a-p.a),Math.cos(a-p.a))};}
   }else this.target(p,row.pose);
  }
  const keep=new Set();for(const [lane,rows] of Object.entries(m.lanes||{})){if(!LANES.includes(lane))continue;const entities=[];
   for(const row of rows){let entity=this._netReplica.get(row.id);if(!entity){entity={};this._netReplica.set(row.id,entity);}applyFields(entity,row.data);this.target(entity,row.pose);keep.add(row.id);entities.push(entity);}this[lane]=entities;
  }
  const enemiesById=new Map(this.enemies.map(e=>[e.id,e]));for(const e of this.enemies)e.formationLeader=enemiesById.get(e.formationLeaderId)||null;
  for(const row of m.shots||[]){const b=unpack(row.data);this._netBullets.set(row.id,b);}
  for(const id of m.retired||[])this._netBullets.delete(id);this.bullets=[...this._netBullets.values()].filter(b=>b.life>0);
  if(m.boss){this._netBossData??={};applyFields(this._netBossData,m.boss.meta);const data=this._netBossData;
   const restore=rows=>rows.map(row=>{let entity=this._netReplica.get(row.id);if(!entity){entity={};this._netReplica.set(row.id,entity);}applyFields(entity,row.data);keep.add(row.id);return entity;});
   const bodies=restore(m.boss.bodies),hazards=restore(m.boss.hazards);if(data.encounter)data.encounter.bodies=new Map(bodies.map(b=>[b.id,b]));data.hazards=hazards;this.restoreBoss(data);
  }else {this._netBossData=null;this.stageBoss=null;}
  for(const id of this._netReplica.keys())if(!keep.has(id)){this._netTargets.delete(this._netReplica.get(id));this._netReplica.delete(id);}
  this.events.push(...(m.events||[]).map(unpack));
  if(this.state==='upgrade'&&priorChoice!==this.activeUpgrade?.id)this.events.push({type:'upgrade',item:this.activeUpgrade});
  if(this.state==='paused'&&before!=='paused')this.events.push({type:'onlinePause'});
  if(this.state==='playing'&&before!=='playing')this.events.push({type:'onlineResume'});
  if(oldRegion!==this.region&&!this.events.some(e=>e.type==='regionTransition'))this.events.push({type:'regionTransition',region:this.region,text:''});
  if(this.state==='lost'&&before!=='lost'&&!this.events.some(e=>e.type==='end'))this.events.push({type:'end',text:'두 기체 모두 격추'});
 }
 restoreBoss(data){
  if(!data){this.stageBoss=null;return;}
  const encounter=data.encounter?Object.assign(Object.create(BossEncounter.prototype),{id:data.encounter.id,bossId:data.encounter.bossId,maxHpBudget:data.encounter.maxHpBudget,bodies:data.encounter.bodies}):null;
  if(encounter){const hud=data.encounter.hud;encounter.snapshot=()=>hud;for(const b of encounter.bodies.values())b.encounter=encounter;}
  this.stageBoss={ended:data.ended,time:data.time,stages:{...data.stages,encounter},defeatSequence:data.defeatSequence,bodyDefeats:data.bodyDefeats||[],hazards:{pool:{visit:fn=>{for(const h of data.hazards||[])fn(h);}}},dispose(){this.ended=true;}};
 }
 target(entity,position){if(!this._netTargets.has(entity)||Math.hypot(entity.x-position[0],entity.y-position[1])>200){entity.x=position[0];entity.y=position[1];entity.a=position[2];}this._netTargets.set(entity,{from:[entity.x,entity.y,entity.a],to:position,age:0});}
 update(dt,inputs={}){
  if(this.host){super.update(dt,{p1:this._netInput,p2:performance.now()-this._netLastInput<300?this._netRemoteInput:{}});return;}
  // Guest never calls CoopGame.update, Director, boss update, collision or RNG.
  const step=Math.min(.04,Math.max(0,dt));
  if(this.state==='playing'){
   const p=this.player(this.localPlayerId);if(p.status==='alive'){
    p.flyAirframe(step,this._netInput);const velocity=p.baseSpeed*p.healthSpeedFactor()*stageBossSpeed(p)*(p.udetBoost>0?1.7:1)*(p.chargeTime>0?4.6:p.evadeTime>0?2.35:p.airframeSpeed??1)*(p.pursuitSpeedFactor??1)*(p.vossReverse>0?2.35:1);
    const x=p.x,y=p.y;p.x+=Math.cos(p.a)*velocity*step;p.y+=Math.sin(p.a)*velocity*step;this.constrainMove(p,x,y);
    const k=1-Math.exp(-step*10),c=this._netCorrection;p.x+=c.x*k;p.y+=c.y*k;p.a+=c.a*k;c.x*=1-k;c.y*=1-k;c.a*=1-k;
   }
   let count=0;for(const b of this.bullets){b.previousX=b.x;b.previousY=b.y;b.x+=b.vx*step;b.y+=b.vy*step;b.life-=step;if(b.life>0)this.bullets[count++]=b;}this.bullets.length=count;
   for(const [entity,target] of this._netTargets){target.age+=step;const k=Math.min(1,target.age*NET_HZ);entity.x=target.from[0]+(target.to[0]-target.from[0])*k;entity.y=target.from[1]+(target.to[1]-target.from[1])*k;entity.a=mixAngle(target.from[2],target.to[2],k);}
  }
  this.updateCamera(step);
 }
}

// Asymmetric carrier: independent JSON state, long-range battery and deck sorties.
export const GEOMETRY={width:1360,height:1157,pivot:{x:680,y:578.5}};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const definitions=[
 ['core',514,795,300,'core',90],['main-left',451,985,150,'battery',48],['main-right',584,985,150,'battery',48],
 ['aa-west',83,636,80,'aa',45],['aa-bridge',658,408,80,'aa',45],['aa-deck',1227,420,80,'aa',45],['aa-left',286,813,80,'aa',45],['aa-right',746,811,80,'aa',45],
 ['deck',1030,530,180,'deck',150],['crane',600,142,100,'crane',45],
 ['track-west',145,755,100,'track',60],['track-main-left',350,1030,100,'track',60],['track-main-right',680,1030,100,'track',60],['track-deck-left',860,650,100,'track',60],['track-deck-mid',1010,650,100,'track',60],['track-deck-right',1235,650,100,'track',60]
];
export function localToWorld(s,x,y){x-=680;y-=578.5;return{x:s.x+x*Math.cos(s.a)-y*Math.sin(s.a),y:s.y+x*Math.sin(s.a)+y*Math.cos(s.a)}}
export function createBoss({entityId='asymmetric-1',token='preview'}={}){return {entityId,token,variant:'asymmetric',x:0,y:0,a:0,v:0,time:0,stepRemainder:0,paused:false,coreHp:300,drive:0,turn:0,serial:0,parts:definitions.map(([id,x,y,maxHp,role,r])=>({id,x,y,hp:maxHp,maxHp,role,r,angle:role==='battery'?Math.PI:0,elevation:0,recoil:0,recoilV:0,trackDistance:0,door:0,phase:'idle',aimError:0,warning:0,nextAttack:role==='battery'?(id==='main-left'?4:4.8):role==='deck'?6:role==='aa'?2+definitions.findIndex(d=>d[0]===id)*.18:999})),pending:[],hazards:[],effects:[],audioEvents:[],damageEvents:[],defeat:null,sorties:0,ammo:3}}
export function listParts(s){return s.parts.map(p=>({...p,...localToWorld(s,p.x,p.y)}))}
function audio(s,kind,source,x=s.x){s.audioEvents.push({serial:++s.serial,kind,source,x});s.audioEvents=s.audioEvents.slice(-48)}
export function damagePart(s,id,amount){if(s.paused||!Number.isFinite(amount)||amount<=0)return false;const p=s.parts.find(p=>p.id===id);if(s.defeat||!p||p.hp<=0)return false;p.hp=Math.max(0,p.hp-amount);if(p.hp>0){const w=localToWorld(s,p.x,p.y);s.effects.push({...w,kind:'impact',age:0,life:.24})}if(id==='core')s.coreHp=p.hp;if(!p.hp){s.pending=s.pending.filter(q=>q.sourcePartId!==id&&!(['crane','deck'].includes(id)&&q.kind==='reload'));p.recoil=p.recoilV=0;p.phase='destroyed';p.warning=0;const q=localToWorld(s,p.x,p.y);s.effects.push({...q,age:0,life:1,kind:'explosion'});audio(s,'destroy',id,q.x)}if(s.coreHp<=0&&!s.defeat){s.pending=[];s.hazards=[];s.damageEvents=[];s.defeat={token:s.token+':'+s.entityId,elapsed:0};s.v=0}s.effects=s.effects.slice(-64);return true}
export function barrelProjection(s,p){const e=p.elevation||0,lift=.45*Math.sin(e);return {a:Math.cos(p.angle),b:Math.sin(p.angle),c:-Math.sin(p.angle)*Math.cos(e)+Math.sin(s.a)*lift,d:Math.cos(p.angle)*Math.cos(e)+Math.cos(s.a)*lift}}
export function muzzle(s,p){const reach=(p.role==='battery'?259.2:90)-p.recoil,a=s.a+p.angle,q=localToWorld(s,p.x,p.y),e=p.elevation;return{x:q.x+Math.sin(a)*reach*Math.cos(e),y:q.y-Math.cos(a)*reach*Math.cos(e)-reach*.45*Math.sin(e),a}}
function segmentDistance(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,t=clamp(((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(px-ax-t*dx,py-ay-t*dy)}
function fire(s,p,kind){const q=muzzle(s,p);p.recoilV=p.role==='battery'?660:250;s.hazards.push({...q,kind,sourcePartId:p.id,age:0,life:kind==='shell'?5:2.5,vx:Math.sin(q.a)*(kind==='shell'?400:650),vy:-Math.cos(q.a)*(kind==='shell'?400:650),r:kind==='shell'?30:12,damage:kind==='shell'?20:6,hit:[]});s.effects.push({...q,age:0,life:.3,kind:'muzzle'});if(kind==='shell')s.effects.push({...q,age:0,life:2.6,kind:'smoke'});audio(s,kind==='shell'?'cannon':'gun',kind==='shell'?'main':p.id,q.x)}
// Already-fired projectiles/aircraft persist after ordinary source destruction.
// All threat production is cancelled by core defeat. Fixed 120Hz steps are snapshot state.
const STEP=1/120;
const livePlayer=p=>(p.hp==null||p.hp>0)&&p.alive!==false&&p.status!=='downed'&&Number.isFinite(p.x)&&Number.isFinite(p.y);
export function requestAttack(s,id){const p=s.parts.find(p=>p.id===id);if(!p||p.hp<=0||s.coreHp<=0||s.paused)return false;p.nextAttack=Math.min(p.nextAttack,s.time);return true}
export function updateBoss(s,dt,{players=[],paused=false}={}){
 if(paused||s.paused||!Number.isFinite(dt)||dt<=0)return;
 s.damageEvents=[];s.stepRemainder=(s.stepRemainder||0)+dt;
 // Bounded work per call; excess elapsed is carried, never silently discarded.
 let steps=0;while(s.stepRemainder+1e-10>=STEP&&steps++<240){s.stepRemainder=Math.max(0,s.stepRemainder-STEP);step(s,STEP,players)}
 s.damageEvents=s.damageEvents.slice(-32);
}
function step(s,dt,players){
 s.time+=dt;if(s.defeat)s.defeat.elapsed=Math.min(7,s.defeat.elapsed+dt);
 const alive=s.coreHp>0,tracks=s.parts.filter(p=>p.role==='track'&&p.hp>0);
 const ratio=tracks.reduce((sum,p)=>sum+p.hp/p.maxHp,0)/6,omega=alive?clamp(s.turn,-1,1)*.025*ratio:0;
 const goalV=alive?clamp(s.drive,-1,1)*25*ratio:0;s.v+=clamp(goalV-s.v,-dt*18,dt*18);if(!alive||!tracks.length)s.v=0;
 s.a=wrap(s.a+omega*dt);s.x+=Math.sin(s.a)*s.v*dt;s.y-=Math.cos(s.a)*s.v*dt;
 const candidates=players.filter(livePlayer),target=candidates.sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0]||localToWorld(s,514,2400);
 for(const p of s.parts){
  if(p.hp<=0)continue;
  if(p.role==='track'){p.trackSpeed=alive?s.v-omega*(p.x-680):0;p.trackDistance+=p.trackSpeed*dt;continue}
  if(!alive){p.warning=0;continue}
  if(p.role==='crane'){
   const job=s.pending.find(q=>q.kind==='reload');
   if(!job&&s.ammo<3&&s.parts.find(q=>q.id==='deck').hp>0)s.pending.push({kind:'reload',sourcePartId:p.id,started:s.time,at:s.time+4+2*(1-p.hp/p.maxHp)});
   const reload=s.pending.find(q=>q.kind==='reload'),progress=reload?clamp((s.time-reload.started)/(reload.at-reload.started),0,1):0;
   p.phase=reload?(progress<.45?'pick-up':'transfer'):'idle';p.loadProgress=progress;
   const goal=reload?-.5+Math.sin(progress*Math.PI)*1.1:-.5;p.angle+=clamp(wrap(goal-p.angle),-dt*.55,dt*.55);continue;
  }
  if(p.role==='deck'){
   const queued=s.pending.some(q=>q.sourcePartId===p.id),want=s.ammo>0&&(s.time>=p.nextAttack-1.5||queued);
   p.door=clamp(p.door+dt*(want?1:-1)*.7*(.6+.4*p.hp/p.maxHp),0,1);p.phase=queued?'launch-warning':want?'opening':'idle';
   p.warning=queued?1:0;
   if(s.time>=p.nextAttack&&s.ammo>0&&p.door>.99&&!queued&&s.pending.filter(q=>q.kind!=='reload').length<3&&s.hazards.filter(h=>h.kind==='aircraft').length<2){s.pending.push({kind:'launch',sourcePartId:p.id,started:s.time,at:s.time+1.2});p.nextAttack=s.time+8+3*(1-p.hp/p.maxHp)}
   continue;
  }
  if(!['aa','battery'].includes(p.role))continue;
  const main=p.role==='battery',w=localToWorld(s,p.x,p.y),desired=wrap(Math.atan2(target.x-w.x,-(target.y-w.y))-s.a);
  const withinArc=!main||Math.abs(wrap(desired-Math.PI))<=.24;
  const goal=main?Math.PI+clamp(wrap(desired-Math.PI),-.24,.24):desired;
  const rate=(main?.24:1.15)*(.65+.35*p.hp/p.maxHp);p.angle=wrap(p.angle+clamp(wrap(goal-p.angle),-dt*rate,dt*rate));p.aimError=Math.abs(wrap(desired-p.angle));
  const queued=s.pending.find(q=>q.sourcePartId===p.id),preparing=withinArc&&(s.time>=p.nextAttack-2.5||!!queued);
  if(main)p.elevation+=clamp((preparing?.72:0)-p.elevation,-dt*.3,dt*.34);
  const freq=main?5.5:10,b=p.recoilV+freq*p.recoil,e=Math.exp(-freq*dt);p.recoil=(p.recoil+b*dt)*e;p.recoilV=(p.recoilV-freq*b*dt)*e;
  p.ready=withinArc&&p.aimError<(main?.035:.045)&&(!main||p.elevation>=.70)&&p.recoil<3;
  p.phase=queued?'warning':!withinArc?'arc-blocked':preparing?'aiming':'recover';p.warning=queued?clamp((s.time-queued.started)/(queued.at-queued.started),0,1):0;
  if(s.time>=p.nextAttack&&p.ready&&!queued&&s.pending.filter(q=>q.kind!=='reload').length<3)s.pending.push({kind:main?'shell':'bullet',sourcePartId:p.id,started:s.time,at:s.time+(main?1.1:.45)});
 }
 const due=s.pending.filter(q=>q.at<=s.time);s.pending=s.pending.filter(q=>q.at>s.time);
 for(const q of due){
  const p=s.parts.find(p=>p.id===q.sourcePartId);if(!alive||!p||p.hp<=0)continue;
  if(q.kind==='reload'){if(s.parts.find(p=>p.id==='deck').hp>0)s.ammo=Math.min(3,s.ammo+1)}
  else if(q.kind==='launch'){
   if(s.ammo<=0||p.door<.99)continue;s.ammo--;const w=localToWorld(s,1040,535);
   s.hazards.push({...w,a:s.a+Math.PI/2,launchA:s.a+Math.PI/2,kind:'aircraft',sourcePartId:p.id,vx:0,vy:0,age:0,life:14,r:30,damage:9,hit:[],nextShot:3,phase:'takeoff'});s.sorties++;audio(s,'aircraft',p.id,w.x);
  }else if(p.ready){fire(s,p,q.kind);p.nextAttack=s.time+(p.role==='battery'?7.2:2.6)*(1+.4*(1-p.hp/p.maxHp));p.phase='recover';p.warning=0}
  else {p.nextAttack=s.time+.35;p.warning=0}
 }
 for(const h of [...s.hazards]){
  const oldX=h.x,oldY=h.y;h.age+=dt;h.life-=dt;
  if(h.kind==='aircraft'){
   const speed=80+Math.min(1,h.age/2)*230;
   if(h.age>2){h.phase='airborne';const desired=Math.atan2(target.x-h.x,-(target.y-h.y));h.a=wrap(h.a+clamp(wrap(desired-h.a),-dt*.48,dt*.48))}
   h.vx=Math.sin(h.a)*speed;h.vy=-Math.cos(h.a)*speed;
  }
  h.x+=h.vx*dt;h.y+=h.vy*dt;
  if(h.kind==='aircraft'&&alive&&h.phase==='airborne'&&h.age>=h.nextShot){
   const aim=Math.atan2(target.x-h.x,-(target.y-h.y));
   if(Math.abs(wrap(aim-h.a))<.12){h.nextShot=h.age+2;s.hazards.push({x:h.x,y:h.y,a:h.a,kind:'bullet',sourcePartId:h.sourcePartId,age:0,life:2.5,vx:Math.sin(h.a)*580,vy:-Math.cos(h.a)*580,r:12,damage:6,hit:[]})}
  }
  if(h.phase==='takeoff')continue;
  for(const p of candidates){if(!alive)continue;const id=p.id??p.playerId;if(id!=null&&!h.hit.includes(id)&&segmentDistance(p.x,p.y,oldX,oldY,h.x,h.y)<h.r+(p.r||20)){h.hit.push(id);s.damageEvents.push({playerId:id,damage:h.damage,x:h.x,y:h.y,source:s.entityId+':'+h.sourcePartId});if(h.kind==='bullet'){h.life=0;break}}}
 }
 s.pending=s.pending.slice(-32);s.damageEvents=s.damageEvents.slice(-32);s.hazards=s.hazards.filter(h=>h.life>0).slice(-96);for(const e of s.effects)e.age+=dt;s.effects=s.effects.filter(e=>e.age<e.life).slice(-64);
}

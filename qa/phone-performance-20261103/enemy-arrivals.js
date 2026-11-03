// Admission happens after the caller has finished placing a new aircraft.
// The simulation owns these coordinates; rendering never translates a hitbox.
const aircraft=e=>e?.hp>0&&!e.surface&&!e.stationary&&!e.fieldUnit&&!e.cityUnit&&!e.navalVessel&&!e.stageBossBody&&!e.bossMinion&&!e.finalArenaTarget&&!e.bossPilot&&!e.arrivalAuthored&&['scout','hunter','bomber','heavyBomber','zeppelin'].includes(e.type);
export function arrivalViewport(game){
 const z=Math.max(.1,game.camera?.zoom||1);
 return {x:game.mode==='coop2'?(game.camera?.x??game.x):game.x,y:game.mode==='coop2'?(game.camera?.y??game.y):game.y,w:(game.viewWidth||960)/(2*z),h:(game.viewHeight||700)/(2*z)};
}
const radius=e=>e.heavyBomber?210:e.type==='zeppelin'?240:e.type==='bomber'?90:65;
export function admitEnemyArrivals(game){
 const v=arrivalViewport(game),now=game.t||0;
 const pending=(game.enemies||[]).filter(e=>e.arrivalPending);
 // One translation for each freshly placed wing preserves its authored slots.
 const groups=new Map();
 for(const e of pending){delete e.arrivalPending;if(!aircraft(e))continue;
  const key=e.directorSceneId?`${e.directorSceneId}:${e.directorLayout}:${['cross','pincer','decoyWing'].includes(e.directorLayout)?e.directorEntrySide:0}`:(e.formationLeader||e);
  const group=groups.get(key)||[];group.push(e);groups.set(key,group);
 }
 for(const group of groups.values()){
  if(group.every(e=>Math.abs(e.x-v.x)>v.w+radius(e)||Math.abs(e.y-v.y)>v.h+radius(e)))continue;
  const leader=group[0],heading=Number.isFinite(leader.a)?leader.a:Math.atan2(v.y-leader.y,v.x-leader.x),dx=-Math.cos(heading),dy=-Math.sin(heading);
  let travel=Infinity;
  for(const [axis,d,center,half] of [['x',dx,v.x,v.w],['y',dy,v.y,v.h]])if(Math.abs(d)>.05){
   const needed=Math.max(0,...group.map(e=>(half+radius(e)+24-(e[axis]-center)*Math.sign(d))/Math.abs(d)));
   travel=Math.min(travel,needed);
  }
  if(!Number.isFinite(travel))continue;
  for(const e of group){
   const targetX=Math.max(-v.w*.65,Math.min(v.w*.65,e.x-v.x)),targetY=Math.max(-v.h*.65,Math.min(v.h*.65,e.y-v.y));
   e.x+=dx*travel;e.y+=dy*travel;
   if(e.directorSceneId){
    const pilot=game.players?.find(p=>p.hp>0)||game,pace=Math.min(360,(pilot.speed||0)*(pilot.airframeSpeed??1)*(pilot.pursuitSpeedFactor??1));
    const closing=(e.speed||160)*(e.energySpeed??1)+(['headOn','veteran'].includes(e.directorLayout)?pace:0),transit=travel/Math.max(80,closing);
    if(['cross','pincer'].includes(e.directorLayout)){
     const a=pilot.a??-Math.PI/2;
     e.x+=Math.cos(a)*pace*transit;e.y+=Math.sin(a)*pace*transit;
    }
    for(const key of ['directorReadyAt','directorLaunchAt','directorIntentUntil','directorRallyUntil'])if(Number.isFinite(e[key]))e[key]+=transit;
   }else e.a=Math.atan2(v.y+targetY-e.y,v.x+targetX-e.x);
   e.airArrival={startedAt:now,lastAt:now,targetX,targetY};e.directorFireHoldUntil=Math.max(e.directorFireHoldUntil||0,now+.45);
  }
 }
 for(const e of game.enemies||[]){const entry=e.airArrival;if(!entry)continue;
  entry.lastAt=now;
  const visible=Math.abs(e.x-v.x)<Math.max(20,v.w-radius(e)*.35)&&Math.abs(e.y-v.y)<Math.max(20,v.h-radius(e)*.35);
  if(visible||now-entry.startedAt>=6){delete e.airArrival;e.directorFireHoldUntil=Math.max(e.directorFireHoldUntil||0,now+.45);continue;}
  // Native tactical steering keeps the solved interception course during entry.
  e.directorFireHoldUntil=Math.max(e.directorFireHoldUntil||0,now+.45);
 }
}
export function arrivalSteering(game,e,turn){
 if(!e.airArrival||e.directorSceneId)return null;
 const v=arrivalViewport(game),a=Math.atan2(v.y+e.airArrival.targetY-e.y,v.x+e.airArrival.targetX-e.x);
 return {delta:Math.atan2(Math.sin(a-e.a),Math.cos(a-e.a)),turn:Math.max(.7,turn||0)};
}
export function installEnemyArrivals(Game){
 const p=Game.prototype;if(p.__enemyArrivals)return;p.__enemyArrivals=true;
 const spawn=p.spawnEnemy;
 p.spawnEnemy=function(...args){const e=spawn.apply(this,args);if(e){e.arrivalPending=!!(this.arrivalFrameActive||this.directorSpawning||this.battlefieldEventSpawning);e.arrivalAuthored=!!(this.bossMechanicSpawn||this._escortSummon);}return e;};
 const update=p.update;
 p.update=function(...args){if(this.state!=='playing')return update.apply(this,args);this.arrivalFrameActive=true;try{const result=update.apply(this,args);if(this.state==='playing')admitEnemyArrivals(this);return result;}finally{delete this.arrivalFrameActive;}};
 const steering=p.dogfightSteering;
 p.dogfightSteering=function(e,contact,dt,turn){return arrivalSteering(this,e,turn)||steering.call(this,e,contact,dt,turn);};
 const bomber=p.directorBomberSteering;
 p.directorBomberSteering=function(e,contact,dt,turn){return arrivalSteering(this,e,turn)||bomber?.call(this,e,contact,dt,turn);};
}

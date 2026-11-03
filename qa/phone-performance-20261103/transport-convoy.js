/** Optional supply interception. Aircraft are historical; the cargo mission/reward is game fiction. */
export const TRANSPORT_CONVOY_BALANCE=Object.freeze({firstAt:35,interval:145,duration:22,collectionTime:30,bossReserve:5,hpGrowthLimit:2.5,xp:24,repairFraction:.30});
export const TRANSPORT_PROFILES=Object.freeze({
 central:Object.freeze({plane:'dfw_cv',name:'DFW C.V',hp:126,speed:126,turn:.45}),
 entente:Object.freeze({plane:'re7',name:'R.E.7',hp:144,speed:112,turn:.38})
});
const B=TRANSPORT_CONVOY_BALANCE;
const live=e=>e&&e.hp>0&&!e.expired&&!e.crashing&&!e.rivalEscaped;
const pilot=g=>g.players?.find(p=>p.hp>0&&p.status!=='downed')||g;
export const transportConvoyActive=g=>g.battlefieldEvents?.current?.type==='TRANSPORT_CONVOY'&&g.battlefieldEvents.current.status==='active';
let artHooks;const loading=new Set();
export function configureTransportArt(hooks){artHooks=hooks;loading.clear();}
function opposite(g){const own=g.stageBoss?.stages?.teamFaction||g.teamFaction;return own==='central'?'entente':own==='entente'?'central':null;}
export function transportArtReady(g){
 const profile=TRANSPORT_PROFILES[opposite(g)];if(!profile)return false;
 if(typeof Image==='undefined')return true;
 if(artHooks?.ready?.(profile.plane))return true;
 if(artHooks&&!loading.has(profile.plane)){loading.add(profile.plane);Promise.resolve(artHooks.load(profile.plane)).finally(()=>loading.delete(profile.plane)).catch(()=>{});}
 return false;
}
const regular=e=>live(e)&&!e.bossPilot&&!e.heavyBomber&&['scout','hunter','bomber'].includes(e.type);
function room(g,count){return (g.enemies||[]).filter(regular).length+count<=(g.regularEnemyLimit?.()??12)&&(g.enemies||[]).filter(live).length+count<(g.enemyCapacity?.()??65);}
export function transportCanSpawn(g){return room(g,3)&&transportArtReady(g);}
function clearFit(e){for(const k of ['bankAircraft','bankHandlingBase','bankFireFactor','bankTurnFactor','formationLivery','directorSquad','directorFormation','frontRoute','eliteKind','personalityId','normalFormationFamily'])delete e[k];}
export function spawnTransportConvoy(g,event,place=(g,p,x,y)=>({x,y})){
 if(!transportCanSpawn(g))return false;
 const faction=opposite(g),profile=TRANSPORT_PROFILES[faction],p=pilot(g),heading=(p.a||0)+((g.rng?.()??.5)<.5?-.18:.18);
 const prior=g.directorSpawning;g.directorSpawning=true;
 try{
  const e=g.spawnEnemy?.('scout');if(!e)return false;clearFit(e);
  const pos=place(g,p,p.x+Math.cos(p.a||0)*285,p.y+Math.sin(p.a||0)*285);
  const hp=Math.round(profile.hp*Math.min(B.hpGrowthLimit,1+(g.t||0)/400)*(g.players?1.35:1));
  Object.assign(e,{type:'scout',ace:false,transportCarrier:true,transportHeading:heading,transportProfile:faction,battlefieldEventId:event.id,battlefieldEventType:event.type,missionTarget:true,escortPlane:profile.plane,visualScale:1.15,planeName:profile.name,name:profile.name+' · 보급 임무',faction,hp,maxHp:hp,speed:profile.speed,dogfightCruise:profile.speed,personalityCruise:profile.speed,cruiseSpeedCap:profile.speed,energySpeed:1,fire:2.8,hitRadius:22,contactRadius:18,x:pos.x,y:pos.y,a:heading});
  event.targets=[e];event.transportProfile=faction;event.transportPhase='intercept';event.transportDuration=B.duration;event.deadline=(g.t||0)+B.duration;
  const desired=(g.viewWidth||960)<720?2:3;
  for(let i=0;i<desired&&room(g,1);i++){
   const wing=g.spawnEnemy?.('hunter');if(!wing)break;
   const back=i===2?150:80,side=i===2?0:(i?1:-1)*105;
   Object.assign(wing,{transportEscort:true,battlefieldEventId:event.id,battlefieldEventType:event.type,faction,formationLeader:e,formationBack:back,formationOffset:side,x:e.x-Math.cos(heading)*back-Math.sin(heading)*side,y:e.y-Math.sin(heading)*back+Math.cos(heading)*side,a:heading,fire:1.4+i*.35});
  }
  g.event?.('wave','수송 편대 접근 · 호위기를 모두 잡을 필요 없이 수송기만 격추하세요');return true;
 }finally{g.directorSpawning=prior;}
}
function releaseEscorts(g,event,retreat){
 const heading=event.targets?.[0]?.transportHeading??0;
 for(const wing of g.enemies||[])if(wing.transportEscort&&wing.battlefieldEventId===event.id){
  g.breakEnemyFormation?.(wing,2.5);wing.formationLeader=null;wing.formationResumeLeader=null;wing.formationCommand=false;
  if(retreat){wing.transportRetreat=true;wing.transportHeading=heading;wing.fire=Infinity;}
  else{wing.directorFireHoldUntil=Math.max(wing.directorFireHoldUntil||0,(g.t||0)+2.5);wing.fire=Math.max(wing.fire||0,2.5);}
 }
}
/** One physical pickup contains the reward; ordinary kill XP and ranking stay untouched. */
export function tickTransportConvoy(g,event){
 if(g.state!=='playing'||g.online&&!g.host)return null;
 if(event.transportPhase==='collect'){
  const drop=(g.drops||[]).find(d=>d.transportCargoId===event.id)||event.supplyDrop;
  if(drop?.dead)return 'completed';
  if(!drop||drop.life<=0||(g.t||0)>=event.deadline)return 'cargoExpired';
  // Ordinary drop distance/budget culling must not shorten this mission's 30s pickup window.
  // Reattach only this event's already-earned, live receipt; never recreate a collected reward.
  if(!g.drops.includes(drop)){if(g.drops.length>=250)g.drops.shift();g.drops.push(drop);}
  return null;
 }
 const e=event.targets?.[0];
 if(e&&(e.hp<=0||e.deathHandled||e.crashing)&&!event.transportRewardDropped){
  event.transportRewardDropped=true;event.transportPhase='collect';e.missionTarget=false;
  releaseEscorts(g,event,false);
  const drop={x:e.x,y:e.y,value:B.xp,heal:true,healFraction:B.repairFraction,supply:true,vx:0,vy:0,life:B.collectionTime,transportCargoId:event.id,battlefieldEvent:true};
  if(Number.isFinite(g.nextEntityId))drop.id=g.nextEntityId++;
  (g.drops??=[]).push(drop);event.supplyDrop=drop;event.deadline=(g.t||0)+B.collectionTime;
  g.event?.('wave','수송기 격추 · 낙하한 보급품 회수: 수리 30% + 경험치');return null;
 }
 if(!e||e.expired||!g.enemies?.includes(e)||(g.t||0)>=event.deadline)return 'escaped';
 return null;
}
export function finishTransportConvoy(g,event){
 const e=event.targets?.[0];
 if(live(e)){e.transportRetreat=true;e.missionTarget=false;e.fire=Infinity;releaseEscorts(g,event,true);}
 // Rewards already emitted remain collectible through a boss/region transition.
 // A cancellation never manufactures a kill, refund, extra XP or reinforcement.
}
export function installTransportConvoy(Game){
 const p=Game.prototype;if(Object.hasOwn(p,'__transportConvoy'))return;p.__transportConvoy=true;
 const steering=p.dogfightSteering;p.dogfightSteering=function(e,...args){
  if(e.transportCarrier||e.transportRetreat){const delta=Math.atan2(Math.sin(e.transportHeading-e.a),Math.cos(e.transportHeading-e.a));return {delta,turn:TRANSPORT_PROFILES[e.transportProfile]?.turn??.65};}
  return steering.call(this,e,...args);
 };
 const fire=p.fireEnemy;p.fireEnemy=function(e,...args){
  if(!e.transportCarrier&&!e.transportRetreat)return fire.call(this,e,...args);
  e.fire=3.2;if(e.transportRetreat||this.sunStrikeContains?.(e))return;
  const q=this.enemyCombatTarget?.(e)||pilot(this);if(!q||q.fogHidden||q.kaiserFogTime>0||q.ballCloak>0||q.cloudConceal>0)return;
  const aim=Math.atan2(q.y-e.y,q.x-e.x),delta=Math.atan2(Math.sin(aim-e.a),Math.cos(aim-e.a));
  if(Math.abs(delta)<Math.PI-.7||Math.hypot(q.x-e.x,q.y-e.y)>380)return;
  (this.bullets??=[]).push({x:e.x-Math.cos(e.a)*12,y:e.y-Math.sin(e.a)*12,vx:Math.cos(aim)*185,vy:Math.sin(aim)*185,life:2,enemy:true,sourceX:e.x,sourceY:e.y,damage:6,visualType:'scout'});e.muzzleFlash=.14;e.gunAim=aim;this.event?.('enemyShot','');
 };
 const scheduled=p.runScheduledAces;if(scheduled)p.runScheduledAces=function(...args){if(transportConvoyActive(this))return;return scheduled.apply(this,args);};
}

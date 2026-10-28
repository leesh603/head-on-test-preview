/** Enemy photographic reconnaissance: a periodic mission, not a boss or player camera objective. */
export const PHOTO_RECON_BALANCE=Object.freeze({firstMin:6,firstMax:8,intervalMin:70,intervalMax:100,deadline:18,delayMin:8,delayMax:12,dispatchWindow:9,bossReserve:6,spawnSpacing:.45});
export const PHOTO_RECON_PROFILES=Object.freeze({
 'rumpler-civ-photo':Object.freeze({id:'rumpler-civ-photo',name:'룸플러 C.IV 사진정찰형',faction:'central',base:'rumpler_civ',hp:76,speed:142,turn:.85,fireInterval:2.8,damage:7,altitude:'고고도 정찰 · 게임에서는 동일 공중 전투층',crew:2}),
 're8-photo':Object.freeze({id:'re8-photo',name:'R.E.8 사진정찰형',faction:'entente',base:'re8',hp:84,speed:132,turn:.78,fireInterval:2.8,damage:7,altitude:'중고도 사진정찰 · 게임에서는 동일 공중 전투층',crew:2})
});
const B=PHOTO_RECON_BALANCE;
let artHooks=null;const artLoads=new Map();
export function configurePhotoReconArt(hooks){artHooks=hooks;artLoads.clear();}
function readyArt(id){
 if(typeof Image==='undefined')return true;
 if(!artHooks)return false;
 if(artHooks.ready?.(id))return true;
 if(!artLoads.has(id))artLoads.set(id,Promise.resolve().then(()=>artHooks.load?.(id)).catch(()=>false));
 return false;
}
const random=g=>Math.max(0,Math.min(.999999999,g.rng?.()??.5));
const living=e=>e&&e.hp>0&&!e.expired&&!e.crashing&&!e.rivalEscaped;
const host=g=>!g.online||g.host;
const player=g=>g.players?.find(p=>p.hp>0&&p.status!=='downed')||g;
const stageKey=g=>{const s=g.stageBoss?.stages;return s?`${s.loopIndex||0}:${s.orderPosition||0}:${s.stageIndex}`:'none'};
const activePhases=new Set(['active','pending','dispatching']);
export const photoReconActive=g=>activePhases.has(g.photoReconDirector?.phase);
const hostileFaction=g=>{const own=g.stageBoss?.stages?.teamFaction||g.teamFaction||g.faction;return own==='central'?'entente':own==='entente'?'central':null};
function blocked(g){
 const s=g.stageBoss?.stages,e=g.battlefieldEvents?.current;
 return !s||s.phase!=='explore'||g.stageCombatWindow?.ready||['warning','entering','active','retreating'].includes(g.intrusionBoss?.phase)||!!g.eliteEnemies?.active||!!g.londonBattle||!!g.parisBattle||!!g.verdunBattle||(g.bossPresentationAfter||0)>(g.t||0)||(g.battleRecoveryUntil||0)>(g.t||0)||(e?.status==='active'&&!['PHOTO_RECON','SUPPLY_RECOVERY'].includes(e.type))||(g.enemies||[]).some(e=>living(e)&&(e.bossPilot||e.type==='boss'||e.stageBossBody));
}
function state(g){return g.photoReconDirector??={phase:'idle',serial:0,nextIn:B.firstMin+random(g)*(B.firstMax-B.firstMin),stageKey:stageKey(g),queue:[],lastTime:g.t||0};}
function target(g,s){return (g.enemies||[]).find(e=>e.photoReconId===s.targetId)}
function withdraw(g,s){const e=target(g,s);if(e&&living(e)){e.photoReconRetreat=true;e.missionTarget=false;e.photoReconExit=Math.atan2(e.y-player(g).y,e.x-player(g).x);e.fire=Infinity;}}
function resolve(g,s,outcome){withdraw(g,s);s.phase='resolved';s.outcome=outcome;s.queue=[];s.remaining=0;s.reinforcementIn=0;s.noticeRemaining=4;s.nextIn=B.intervalMin+random(g)*(B.intervalMax-B.intervalMin);}
export function cancelPhotoRecon(g,reason='cancelled'){const s=g.photoReconDirector;if(!s||!host(g))return;resolve(g,s,reason);}
function spawn(g,type){const previous=g.directorSpawning,n=g.enemies.length;g.directorSpawning=true;try{const result=g.spawnEnemy?.(type);return result||(g.enemies.length>n?g.enemies.at(-1):null)}finally{g.directorSpawning=previous}}
function begin(g,s){
 const faction=hostileFaction(g);if(!faction)return false;
 const profile=PHOTO_RECON_PROFILES[faction==='central'?'rumpler-civ-photo':'re8-photo'];
 if(!readyArt(profile.id))return false;
 const e=spawn(g,'scout');if(!e)return false;
 const p=player(g),a=p.a||0,side=random(g)<.5?-1:1;
 for(const k of ['bankAircraft','bankHandlingBase','bankFireFactor','bankTurnFactor','formationLivery','escortPlane','directorSquad','frontRoute','eliteKind','personalityId'])delete e[k];
 const hp=Math.round(profile.hp*(1+(g.t||0)/300));
 Object.assign(e,{type:'scout',faction:profile.faction,ace:false,photoReconProfile:profile.id,photoReconId:`photo:${++s.serial}:${s.stageKey}`,escortPlane:profile.id,visualScale:1.14,planeName:profile.name,name:profile.name,missionTarget:true,hp,maxHp:hp,speed:profile.speed,dogfightCruise:profile.speed,personalityCruise:profile.speed,cruiseSpeedCap:profile.speed,energySpeed:1,fire:profile.fireInterval,hitRadius:21,contactRadius:17,x:p.x+Math.cos(a)*220-Math.sin(a)*side*110,y:p.y+Math.sin(a)*220+Math.cos(a)*side*110,a:a+Math.PI*.65*side,photoReconSide:side,photoReconRouteAge:0});
 Object.assign(s,{phase:'active',profileId:profile.id,targetId:e.photoReconId,remaining:B.deadline,reinforcementIn:0,queue:[],outcome:null,noticeRemaining:0,deadSeen:false});
 g.event?.('wave',`${profile.name} 접근 · ${B.deadline}초 안에 격추하여 증원 차단`);return true;
}
function plan(g){const r=random(g);return r<.40?['bomber','hunter','hunter','bomber','hunter','hunter']:r<.75?['zeppelin','hunter','hunter','hunter','hunter']:['zeppelin','bomber','hunter','hunter','hunter'];}
function cap(g){return Math.min((g.regularEnemyLimit?.()??((g.viewWidth||960)<720?9:12))+3,(g.enemyCapacity?.()??65)-1);}
function danger(g){return (g.enemies||[]).filter(e=>living(e)&&!e.surface&&!e.stationary&&!e.stageBossBody).length;}
function dispatch(g,s,dt){
 s.dispatchRemaining-=dt;s.spawnIn-=dt;
 if(!s.queue.length||s.dispatchRemaining<=0){resolve(g,s,s.spawned>0?'reinforced':'budget-delayed');return;}
 if(s.spawnIn>0||danger(g)>=cap(g))return;
 const type=s.queue[0];
 // Existing one-airship / two-bomber budgets remain authoritative. If that
 // role is already in the sky, add its fighter escort instead of a duplicate.
 const existing=(g.enemies||[]).filter(living);
 const actual=type==='zeppelin'&&existing.some(e=>e.type==='zeppelin')||type==='bomber'&&existing.filter(e=>e.type==='bomber').length>=2?'hunter':type;
 const reserved=g.battlefieldEventSpawning;g.battlefieldEventSpawning=true;let e;try{e=spawn(g,actual)}finally{g.battlefieldEventSpawning=reserved}if(!e)return;
 const p=player(g),a=p.a||0,index=s.spawned++,side=index%2?-1:1,forward=320+(index%2)*60;
 e.x=p.x+Math.cos(a)*forward-Math.sin(a)*side*(90+Math.floor(index/2)*45);e.y=p.y+Math.sin(a)*forward+Math.cos(a)*side*(90+Math.floor(index/2)*45);e.a=a+Math.PI;
 e.photoReconReinforcement=s.targetId;e.faction=PHOTO_RECON_PROFILES[s.profileId].faction;e.fire=Math.max(e.fire||0,1.5);if(actual==='zeppelin')e.summonDone=true;
 s.queue.shift();s.spawnIn=B.spawnSpacing;
}
/** Called after the normal damage/kill frame: a same-frame lethal hit wins the deadline tie. */
export function tickPhotoRecon(g,dt){
 if(!host(g)||g.mode==='campaign')return;
 if(['lost','won','dead'].includes(g.state)){if(photoReconActive(g))cancelPhotoRecon(g,'run-ended');return;}
 if(g.state!=='playing'||!(dt>0))return;
 if((g.players?.length&&!g.players.some(p=>p.hp>0&&p.status!=='downed'))||(!g.players?.length&&g.hp<=0)){if(photoReconActive(g))cancelPhotoRecon(g,'run-ended');return;}
 dt=Math.min(.04,dt);const s=state(g),now=g.t||0,key=stageKey(g);
 if(now<s.lastTime){cancelPhotoRecon(g,'restart');s.nextIn=B.firstMin+random(g)*(B.firstMax-B.firstMin)}s.lastTime=now;
 if(s.stageKey!==key){if(photoReconActive(g))cancelPhotoRecon(g,'stage-changed');s.stageKey=key;}
 if(s.phase==='resolved'){s.noticeRemaining=Math.max(0,s.noticeRemaining-dt);if(!s.noticeRemaining)s.phase='idle';}
 if(photoReconActive(g)&&blocked(g)){cancelPhotoRecon(g,'encounter-priority');return;}
 if(s.phase==='active'){
  const e=target(g,s);
  if(s.deadSeen||e&&(e.hp<=0||e.crashing)){resolve(g,s,'intercepted');g.event?.('wave','사진정찰기 격추 · 적 증원 차단');return;}
  if(e)e.photoReconRouteAge+=dt;s.remaining=e?Math.max(0,s.remaining-dt):0;
  if(s.remaining<=0){withdraw(g,s);s.phase='pending';s.outcome='reported';s.reinforcementIn=B.delayMin+random(g)*(B.delayMax-B.delayMin);s.reinforcementDelay=s.reinforcementIn;g.event?.('wave',`정찰 보고 전송! ${Math.ceil(s.reinforcementIn)}초 뒤 적 혼합 편대 접근`);}
  return;
 }
 if(s.phase==='pending'){s.reinforcementIn=Math.max(0,s.reinforcementIn-dt);if(s.reinforcementIn<=0){s.phase='dispatching';s.queue=plan(g);s.dispatchRemaining=B.dispatchWindow;s.spawnIn=0;s.spawned=0;g.event?.('wave','적 증원 도착 · 혼합 편대 강습');}return;}
 if(s.phase==='dispatching'){dispatch(g,s,dt);return;}
 if(blocked(g))return;
 s.nextIn=Math.max(0,s.nextIn-dt);
 const faction=hostileFaction(g);if(faction)readyArt(faction==='central'?'rumpler-civ-photo':'re8-photo');
 const remaining=g.stageCombatWindow?.remaining??Infinity;
 if(s.nextIn<=0&&remaining>=B.deadline+B.delayMax+B.bossReserve)begin(g,s);
}
export function photoReconSteering(g,e){
 const p=player(g),profile=PHOTO_RECON_PROFILES[e.photoReconProfile];if(!profile)return null;
 const age=e.photoReconRouteAge||0,side=e.photoReconSide||1;
 // A physical shallow racetrack ahead of the player; steering changes heading,
 // never position, and the ordinary engine integrates velocity/collisions.
 const a=(p.a||0)+Math.sin(age*.24)*.6*side;
 const x=p.x+Math.cos(a)*165-Math.sin(a)*Math.sin(age*.45)*180;
 const y=p.y+Math.sin(a)*165+Math.cos(a)*Math.sin(age*.45)*180;
 const heading=e.photoReconRetreat?e.photoReconExit:Math.atan2(y-e.y,x-e.x);
 return {delta:Math.atan2(Math.sin(heading-e.a),Math.cos(heading-e.a)),turn:profile.turn};
}
function fireRecon(g,e){
 const profile=PHOTO_RECON_PROFILES[e.photoReconProfile];if(!profile)return false;
 e.fire=profile.fireInterval;if(e.photoReconRetreat||g.sunStrikeContains?.(e))return true;
 const p=g.enemyCombatTarget?.(e)||player(g);if(!p||p.fogHidden||p.kaiserFogTime>0||p.ballCloak>0||(p.cloudConceal||0)>0)return true;
 const aim=Math.atan2(p.y-e.y,p.x-e.x),delta=Math.atan2(Math.sin(aim-e.a),Math.cos(aim-e.a));
 // Forward fixed MG and rear observer's defensive arc, not 360-degree fire.
 if(Math.abs(delta)>.22&&Math.abs(delta)<Math.PI-.85)return true;
 const rear=Math.abs(delta)>Math.PI/2,a=rear?aim:e.a,offset=rear?-12:20;
 g.bullets??=[];g.bullets.push({x:e.x+Math.cos(e.a)*offset,y:e.y+Math.sin(e.a)*offset,vx:Math.cos(a)*185,vy:Math.sin(a)*185,life:2,enemy:true,sourceX:e.x,sourceY:e.y,damage:profile.damage*(1+(g.t||0)/240),visualType:'scout'});e.muzzleFlash=.14;e.gunAim=a;g.event?.('enemyShot','');return true;
}
export function installPhotoReconEncounters(Game){
 const p=Game.prototype;if(Object.hasOwn(p,'__photoReconEncounters'))return;p.__photoReconEncounters=true;
 const update=p.update;p.update=function(dt,...args){const s=this.photoReconDirector,e=s&&target(this,s);const result=update.call(this,dt,...args);if(e&&(e.hp<=0||e.crashing)&&s===this.photoReconDirector)s.deadSeen=true;tickPhotoRecon(this,dt);return result;};
 const steer=p.dogfightSteering;p.dogfightSteering=function(e,...args){return photoReconSteering(this,e)||steer.call(this,e,...args);};
 const fire=p.fireEnemy;p.fireEnemy=function(e,...args){if(!fireRecon(this,e))return fire.call(this,e,...args);};
 // Defer the scheduler itself: returning an empty pilot pool alone consumes
 // nextBossAt/pendingAceCount in the legacy wave loop and loses the reservation.
 const scheduled=p.runScheduledAces;if(scheduled)p.runScheduledAces=function(...args){if(photoReconActive(this))return;return scheduled.apply(this,args);};
 for(const name of ['offerBattlefieldEvent','availableAcePilots']){const previous=p[name];if(previous)p[name]=function(...args){if(photoReconActive(this))return name==='availableAcePilots'?[]:null;return previous.apply(this,args);};}
 const director=p.tickBattleDirector;p.tickBattleDirector=function(dt){if(host(this)&&['pending','dispatching'].includes(this.photoReconDirector?.phase))return;return director?.call(this,dt);};
 for(const name of ['mobSpawnsSuppressed','directorMobSpawnsSuppressed']){const suppression=p[name];p[name]=function(){return ['pending','dispatching'].includes(this.photoReconDirector?.phase)||suppression?.call(this);};}
}

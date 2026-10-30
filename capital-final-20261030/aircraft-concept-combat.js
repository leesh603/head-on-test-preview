// New concept AIRFRAMES only. Paints and all legacy aircraft retain their chain.
// Geometry follows planeSprite: 288x320 image, pivot(144,152), .54/2 world scale.
const IDS=new Set(['01','02','03','04','09','10','13','14','17','18','21','22','25','26','29','30']);
const fits=new WeakMap();
const steeredResults=new WeakSet(),updatedAt=new WeakMap(),nativeFireActive=new WeakSet();
const BOMBS=Object.freeze({'03':[144,151],'04':[144,157],'10':[144,155],'14':[144,145],'18':[144,154],'21':[144,139]});
const angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
const finite=Number.isFinite;
function fitFor(e){const f=e&&fits.get(e);return f&&e.bankAircraft===f.bankKey&&e.escortPlane===e.bankAircraft?f:null;}
function live(e){return e?.hp>0&&!e.crashing&&!e.dead&&!e.bossPilot&&!e.bossPlane&&!e.bossMinion&&!e.stageBossBody&&!e.heavyBomber&&!e.missionTarget&&!e.surface&&!e.stationary;}
export function configureConceptEnemy(e,fit){
 if(!e||!fit?.newAirframe||fit.paint||!IDS.has(String(fit.conceptId).padStart(2,'0')))return false;
 const id=String(fit.conceptId).padStart(2,'0');
 const mounts=(fit.weaponMounts||[]).filter(m=>finite(m.x)&&finite(m.y)&&m.x>=0&&m.x<=288&&m.y>=0&&m.y<=320&&['forward','aft'].includes(m.direction)).map(m=>Object.freeze({...m}));
 // Closed cabin / unarmed torpedo adaptation never invents a gun mount.
 if(id==='10'||id==='18')mounts.length=0;
 fits.set(e,Object.freeze({id,bankKey:e.bankAircraft,role:fit.role,turn:finite(fit.turn)?Math.max(0,fit.turn):1,fire:finite(fit.fire)?Math.max(1,fit.fire):1,mounts:Object.freeze(mounts),bombOrigin:fit.bombLoad===0?null:fit.bombLoad>0&&finite(fit.bombOrigin?.x)&&finite(fit.bombOrigin?.y)?[fit.bombOrigin.x,fit.bombOrigin.y]:(BOMBS[id]||null)}));
 return true;
}
export function conceptMountWorld(e,mount){
 const scale=finite(e.visualScale)?e.visualScale:1,a=e.a||0;
 const along=(152-mount.y)*.27*scale,side=(mount.x-144)*.27*scale;
 return {x:e.x+Math.cos(a)*along-Math.sin(a)*side,y:e.y+Math.sin(a)*along+Math.cos(a)*side,a:a+(mount.direction==='aft'?Math.PI:0)};
}
function blocked(game,e,contact){
 const now=game.t||0;
 return !live(e)||(game.state&&game.state!=='playing')||game.kaiserFogTime>0||game.sunStrikeContains?.(e)||!contact||contact.hp<=0||contact.invuln>0||contact.fogHidden||contact.kaiserFogTime>0||contact.ballCloak>0||contact.crashing||e.directorFireHoldUntil>now||e.formationCollapseUntil>now||e.directorBreakUntil>now||e.combatPassState==='disengage'||(e.directorSquad&&game.directorShotReady?.(e)===false);
}
function visible(game,e){const z=game.camera?.zoom||1,cx=game.camera?.x??game.x,cy=game.camera?.y??game.y;return Math.abs(e.x-cx)<=(game.viewWidth||960)/(2*z)+12&&Math.abs(e.y-cy)<=(game.viewHeight||720)/(2*z)+12;}
function fighter(f){return f.role==='fighter'||f.role==='sea-fighter';}
// Called around EVERY enemyVolley, including native fighter burst followups.
// Change only origins of newly emitted rounds; never add rounds or alter damage,
// velocity, lifetime, shared burst budget, original cooldown or aim restrictions.
export function remapConceptVolley(game,e,startIndex){
 const f=fitFor(e);if(!f||!live(e)||!fighter(f)||!Array.isArray(game.bullets)||!Number.isInteger(startIndex)||startIndex<0)return false;
 const mounts=f.mounts.filter(m=>m.direction==='forward');if(!mounts.length)return false;
 let n=0;for(let i=startIndex;i<game.bullets.length;i++){const b=game.bullets[i];if(!b.enemy)continue;const p=conceptMountWorld(e,mounts[n++%mounts.length]);b.x=p.x;b.y=p.y;}
 return n>0;
}
// Return false for native fighters so fireFighterBurst and its threat budget survive.
// Recon/bomber turret fire replaces, never supplements, the native generic volley.
export function fireConceptEnemy(game,e){
 const f=fitFor(e);if(!f||fighter(f))return false;
 if(!live(e))return true;
 const contact=game.enemyCombatTarget?.(e);
 if(blocked(game,e,contact)||!visible(game,e)){e.fire=Math.max(e.fire||0,.12);return true;}
 if(e.fire>0)return true;
 const bomber=f.role==='bomber'||f.role==='sea-bomber';
 e.fire=(bomber?1.5:2.5)*f.fire;
 const eligible=f.mounts.map(m=>({m,p:conceptMountWorld(e,m)})).filter(({m,p})=>{
  const distance=Math.hypot(contact.x-p.x,contact.y-p.y),aim=Math.atan2(contact.y-p.y,contact.x-p.x);
  return distance>=55&&distance<=470&&Math.abs(angle(aim-p.a))<=(m.direction==='aft'?.70:.55);
 });
 if(!eligible.length)return true;
 const count=bomber?3:1,power=1+(game.t||0)/240,damage=Math.round(9*power*(e.aceDamageMultiplier||1)*(e.vossSurge?1.3:1));
 game.bullets??=[];
 for(let i=0;i<count;i++){
  const {p,m}=eligible[i%eligible.length],aim=Math.atan2(contact.y-p.y,contact.x-p.x),spread=(i-(count-1)/2)*.075;
  // Clamp the fan too: a target at a traverse stop cannot leak shots past it.
  const half=m.direction==='aft'?.70:.55,a=p.a+Math.max(-half,Math.min(half,angle(aim-p.a)+spread)),speed=bomber?210:185;
  game.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:4,enemy:true,sourceX:e.x,sourceY:e.y,heavy:false,sourcePilot:null,visualType:e.type,damage,...contact.id?{targetPlayerId:contact.id}:{}});
  e.gunAim=a;
 }
 e.muzzleFlash=.14;game.event?.('enemyShot','');return true;
}
// Engine bomber branch bypasses dogfightSteering. Call from its directorBomberSteering
// wrapper, including a null prior result, to make this new profile's turn effective.
export function steerConceptBomber(game,e,contact,dt,baseTurn,priorResult){
 const f=fitFor(e);if(!f||!live(e)||e.type!=='bomber')return priorResult;
 if(priorResult&&steeredResults.has(priorResult))return priorResult;
 const prior=priorResult||{turn:baseTurn>0?.16:0,delta:e.directorIntentUntil>(game.t||0)?angle((e.combatPassHeading??e.a)-e.a):Math.cos((game.t||0)*.6+(e.wobble||0))*(baseTurn>0?.16:0)*dt};
 const result={...prior,turn:baseTurn>0?Math.min(baseTurn,Math.max(0,prior.turn*f.turn)):0};steeredResults.add(result);return result;
}
// Existing bombZone telegraph/collision path; no torpedo system and no new entities.
// One bomb per >=4.2s, versus heavy bomber's existing five with the same max radius.
export function updateConceptAircraft(game,dt){
 if(game.state!=='playing'||!finite(dt)||dt<=0)return;
 // Nested prototype wrappers may invoke this twice before the same world tick.
 if(updatedAt.has(game)&&updatedAt.get(game)===game.t)return;updatedAt.set(game,game.t);
 const step=Math.min(.04,dt);
 for(const e of game.enemies||[]){
  const f=fitFor(e);if(!f?.bombOrigin||!live(e))continue;
  const contact=game.enemyCombatTarget?.(e);
  if(blocked(game,e,contact)||!visible(game,e))continue;
  e.conceptBombTimer=(e.conceptBombTimer??4.2)-step;if(e.conceptBombTimer>0)continue;
  const [x,y]=f.bombOrigin,p=conceptMountWorld(e,{x,y,direction:'forward'});
  if(Math.hypot(contact.x-e.x,contact.y-e.y)>650){e.conceptBombTimer=.25;continue;}
  e.conceptBombTimer=4.2*f.fire;
  const delay=2.3,travel=Math.max(0,Math.min(180,e.speed||0))*delay;
  game.bombZones??=[];game.bombZones.push({x:p.x+Math.cos(e.a)*travel,y:p.y+Math.sin(e.a)*travel,sx:p.x,sy:p.y,delay,maxDelay:delay,radius:52,damage:22+Math.floor((game.t||0)/90)});
  game.event?.('bombWarning','폭격 투하! 붉은 표적을 벗어나세요');
 }
}

// Coop owns these methods instead of inheriting Game's bank wrappers. Install
// combat-only adapters: never reinstall the roster or its speed/hp/fire factors.
export function installConceptCombatHooks(GameClass){
 const proto=GameClass.prototype;
 if(Object.hasOwn(proto,'__conceptCombatHooks'))return;
 Object.defineProperty(proto,'__conceptCombatHooks',{value:true});
 const fire=proto.fireEnemy;
 proto.fireEnemy=function(e,...args){
  if(fireConceptEnemy(this,e))return;
  const f=fitFor(e),applyFactor=!!(f&&fighter(f)&&!nativeFireActive.has(e));
  if(applyFactor)nativeFireActive.add(e);
  try{const result=fire.apply(this,[e,...args]);if(applyFactor&&fitFor(e)===f&&finite(e.fire))e.fire*=f.fire;return result;}
  finally{if(applyFactor)nativeFireActive.delete(e);}
 };
 const volley=proto.enemyVolley;
 proto.enemyVolley=function(e,...args){
  const f=fitFor(e);
  // Direct/followup volleys must not resurrect omnidirectional generic bomber guns.
  if(f&&!fighter(f)){fireConceptEnemy(this,e);return;}
  const start=this.bullets?.length||0,result=volley.apply(this,[e,...args]);
  remapConceptVolley(this,e,start);return result;
 };
 const update=proto.update;
 proto.update=function(dt,...args){updateConceptAircraft(this,dt);return update.apply(this,[dt,...args]);};
}

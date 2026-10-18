export const RIVAL_ACE_PHASES=Object.freeze({
 FIRST_ENCOUNTER:'FIRST_ENCOUNTER',ESCAPED:'ESCAPED',RETURNED:'RETURNED',FINAL_DUEL:'FINAL_DUEL',DEFEATED:'DEFEATED'
});

export const RIVAL_ACE_BALANCE=Object.freeze({
 escapeHpFraction:.27,finalDuelHpFraction:.45,edgeScale:.62,minEdgeRadius:520,edgeHold:1,returnDelay:35,returnRetry:5,compactWidth:720,
 returnedAttackRate:1.2,returnedDamage:1.12,returnedTurn:1.08,returnedAbilityRate:1.2,finalAttackRate:1.12,finalDamage:1.08,finalTurn:1.04,finalAbilityRate:1.15
});

const P=RIVAL_ACE_PHASES;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const playerFor=game=>game.players?.find(p=>p?.hp>0&&(!p.status||p.status==='alive'))||game;
const scriptedBoss=game=>game.stageBoss?.stages?.phase==='boss';
const supported=game=>game.mode!=='campaign'&&!scriptedBoss(game);

function notice(game,state,phase){
 state.noticeId=(state.noticeId||0)+1;game.rivalAceNotice={id:state.noticeId,phase,pilot:state.pilot,name:state.active?.name||state.name||state.pilot};
}

function tailPressure(game,e){
 if(!e?.tailId)return false;const players=game.players?.length?game.players:[game];
 return players.some(p=>p?.hp>0&&(!p.status||p.status==='alive')&&p.tailLocked&&p.tailTargetId===e.tailId);
}

function edgeRadius(game){return Math.max(RIVAL_ACE_BALANCE.minEdgeRadius,Math.hypot(game.viewWidth||960,game.viewHeight||700)*RIVAL_ACE_BALANCE.edgeScale)}

function tuneReturned(e){
 if(e.rivalReturnTuned)return;e.rivalReturnTuned=true;e.aceAttackRate=(e.aceAttackRate||1)*RIVAL_ACE_BALANCE.returnedAttackRate;e.aceDamageMultiplier=(e.aceDamageMultiplier||1)*RIVAL_ACE_BALANCE.returnedDamage;e.aceTurnMultiplier=(e.aceTurnMultiplier||1)*RIVAL_ACE_BALANCE.returnedTurn;e.rivalAbilityRate=RIVAL_ACE_BALANCE.returnedAbilityRate;e.rivalPreferredRange=240;
}

function tuneFinal(e){
 if(e.rivalFinalTuned)return;e.rivalFinalTuned=true;e.aceAttackRate=(e.aceAttackRate||1)*RIVAL_ACE_BALANCE.finalAttackRate;e.aceDamageMultiplier=(e.aceDamageMultiplier||1)*RIVAL_ACE_BALANCE.finalDamage;e.aceTurnMultiplier=(e.aceTurnMultiplier||1)*RIVAL_ACE_BALANCE.finalTurn;e.rivalAbilityRate=(e.rivalAbilityRate||1)*RIVAL_ACE_BALANCE.finalAbilityRate;e.rivalPreferredRange=175;
}

function addReturnSupport(game,leader,attachAircraftPersonality,PLANES){
 const count=(game.viewWidth||960)<=RIVAL_ACE_BALANCE.compactWidth?1:2;
 for(let i=0;i<count;i++){const wing=game.spawnEnemy?.('hunter');if(!wing)break;Object.assign(wing,{x:leader.x+(i?80:-80),y:leader.y+75,a:leader.a,escortPlane:leader.bossPlane,formationLeader:leader,formationBack:75,formationOffset:i?80:-80,rivalSupport:true});attachAircraftPersonality?.(PLANES,wing,leader.bossPlane,{retuneCruise:true})}
}

function escape(game,state,e){
 state.phase=P.ESCAPED;state.active=null;state.returnAt=(game.t||0)+RIVAL_ACE_BALANCE.returnDelay;e.rivalPhase=P.ESCAPED;e.rivalEscaped=true;e.expired=true;notice(game,state,P.ESCAPED);
}

function beginFinal(game,state,e){
 state.phase=P.FINAL_DUEL;e.rivalPhase=P.FINAL_DUEL;e.rivalEscaping=false;e.rivalEdgeHold=0;tuneFinal(e);
 for(const wing of game.enemies||[])if(wing.formationLeader===e)wing.expired=true;
 notice(game,state,P.FINAL_DUEL);
}

function spawnReturn(game,state){
 if((game.enemies||[]).some(e=>e.hp>0&&!e.expired&&e.bossPilot)){state.returnAt=(game.t||0)+RIVAL_ACE_BALANCE.returnRetry;return null}
 game._rivalReturnPilot=state.pilot;let e;try{e=game.spawnEnemy?.('boss')}finally{game._rivalReturnPilot=null}
 if(!e){state.returnAt=(game.t||0)+RIVAL_ACE_BALANCE.returnRetry;return null}return e;
}

function tick(game,dt){
 const state=game.rivalAce;if(!state||!supported(game))return;
 const step=clamp(Number(dt)||0,0,.05),now=game.t||0;
 if(state.phase===P.ESCAPED){if(now>=state.returnAt)spawnReturn(game,state);return}
 const e=state.active;if(!e||e.rivalEscaped)return;
 if(e.hp<=0||e.deathHandled){if(state.phase!==P.DEFEATED){state.phase=P.DEFEATED;e.rivalPhase=P.DEFEATED;state.active=null;notice(game,state,P.DEFEATED)}return}
 if(state.phase===P.RETURNED&&e.hp/e.maxHp<=RIVAL_ACE_BALANCE.finalDuelHpFraction){beginFinal(game,state,e);return}
 if(state.phase!==P.FIRST_ENCOUNTER)return;
 if(e.hp/e.maxHp<=RIVAL_ACE_BALANCE.escapeHpFraction)e.rivalEscaping=true;
 if(!e.rivalEscaping)return;
 const p=playerFor(game),outward=Math.atan2(e.y-p.y,e.x-p.x);e.rivalEscapeHeading=outward;e.speed=Math.max(e.speed||0,(e.cruiseSpeedCap||e.speed||100)*1.06);
 if(tailPressure(game,e)){e.rivalEdgeHold=0;return}
 const distance=Math.hypot(e.x-p.x,e.y-p.y);e.rivalEdgeHold=distance>=edgeRadius(game)?(e.rivalEdgeHold||0)+step:0;
 if(e.rivalEdgeHold>=RIVAL_ACE_BALANCE.edgeHold)escape(game,state,e);
}

export function installRivalAce(Game,{PILOTS,PLANES,attachAircraftPersonality,angleDiff}){
 if(Game.prototype.__rivalAce171)return;Game.prototype.__rivalAce171=true;
 const spawn=Game.prototype.spawnEnemy;
 Game.prototype.spawnEnemy=function(type,...args){
  const forced=type==='boss'?this._rivalReturnPilot:null,deck=forced?this.bossDeck:null;if(forced)this.bossDeck=[forced];let e;
  try{e=spawn.call(this,type,...args)}finally{if(forced)this.bossDeck=deck}
  if(type!=='boss'||!e||!supported(this))return e;
  if(forced){
   const state=this.rivalAce;if(!state||state.pilot!==forced)return e;Object.assign(e,{rivalAce:true,rivalPhase:P.RETURNED});state.phase=P.RETURNED;state.active=e;state.encounters=(state.encounters||1)+1;tuneReturned(e);addReturnSupport(this,e,attachAircraftPersonality,PLANES);notice(this,state,P.RETURNED);return e;
  }
  if(!this.rivalAce){const state=this.rivalAce={pilot:e.bossPilot,name:PILOTS[e.bossPilot]?.name||e.name,phase:P.FIRST_ENCOUNTER,active:e,encounters:1,noticeId:0};Object.assign(e,{rivalAce:true,rivalPhase:P.FIRST_ENCOUNTER});notice(this,state,P.FIRST_ENCOUNTER)}
  return e;
 };
 const steer=Game.prototype.dogfightSteering;
 Game.prototype.dogfightSteering=function(e,contact,dt,baseTurn){
  if(e?.rivalEscaping){const heading=e.rivalEscapeHeading??e.a;return{delta:angleDiff(heading,e.a),turn:baseTurn*.78}}
  const result=steer.call(this,e,contact,dt,baseTurn);if(e?.rivalAce&&e.rivalPreferredRange&&contact){const distance=Math.hypot(contact.x-e.x,contact.y-e.y);if(distance<e.rivalPreferredRange*.7&&!(e.disengageUntil>this.t)){e.disengageUntil=this.t+.7;e.exitHeading=Math.atan2(e.y-contact.y,e.x-contact.x)}}return result;
 };
 const attack=Game.prototype.aceAttack;
 Game.prototype.aceAttack=function(e){const result=attack.call(this,e);if(e?.rivalAce&&e.rivalAbilityRate>1&&Number.isFinite(e.abilityTimer))e.abilityTimer/=e.rivalAbilityRate;return result};
 Game.prototype.tickRivalAce=function(dt){return tick(this,dt)};
 const update=Game.prototype.update;
 Game.prototype.update=function(dt,input={}){const result=update.call(this,dt,input);this.tickRivalAce(dt);return result};
}

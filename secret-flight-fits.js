import {hasSecretWeapon,secretWeaponEffect} from './secret-weapons.js?v=d7a0cfcfc455802b';

export const SALAMANDER_HULL_FRACTION=.40;
export const SALAMANDER_HULL_BONUS_CAP=96;
const SALAMANDER='salamanderArmor',SIEMENS='siemensHalske';
const clamp=(value,min,max)=>Math.max(min,Math.min(value,max));

export function salamanderBaseHull(p){return p.maxHp-(p.salamanderHullHp||0);}

export function applySalamanderHull(p,{active=hasSecretWeapon(p,SALAMANDER),heal=false}={}){
 if(!active||!(p.maxHp>0))return 0;
 const base=salamanderBaseHull(p),emblem=p.upgrades?.loEmblem ? .5 : 1;
 const cap=(p.bomberTransfer?.hpCap??Infinity)*emblem;
 const bonus=Math.max(0,Math.min(base*SALAMANDER_HULL_FRACTION,SALAMANDER_HULL_BONUS_CAP*emblem,cap-base));
 const change=bonus-(p.salamanderHullHp||0);
 const ratio=p.hp/p.maxHp;
 p.salamanderHullHp=bonus;
 p.maxHp=base+bonus;
 if(p.hp>0)p.hp=clamp(heal?p.hp+change:ratio*p.maxHp,0,p.maxHp);
 return change;
}

// Airframe conversions have their own caps and preserve the player's health ratio.
// Refit on the converted hull after that stock calculation has run.
export function stripSalamanderHull(p){
 if(!p.salamanderHullHp)return;
 const ratio=p.hp/p.maxHp;
 p.maxHp=salamanderBaseHull(p);
 p.hp=p.maxHp*ratio;
 delete p.salamanderHullHp;
}

export function salamanderArmorContact(p,before,cue,sound){
 const source=p.damageSource,bullet=source?.bullet;
 if(!hasSecretWeapon(p,SALAMANDER)||!(before>p.hp)||!bullet||bullet.flak||bullet.heavy||bullet.heavyShell||bullet.rocket||bullet.actualExplosion||bullet.blast||bullet.gas)return;
 const state=secretWeaponEffect(p,SALAMANDER);
 state.wear=Math.min(1,(state.wear||0)+clamp((before-p.hp)/Math.max(1,p.maxHp)*1.6,.09,.26));
 const heading=Math.atan2(bullet.vy||0,bullet.vx||0),ca=Math.cos(p.a),sa=Math.sin(p.a);
 const dx=Number.isFinite(source.impactX)?source.impactX-p.x:-Math.cos(heading)*10;
 const dy=Number.isFinite(source.impactY)?source.impactY-p.y:-Math.sin(heading)*10;
 const length=p.bomberTransfer?.hullLength??26,width=p.bomberTransfer?.hullWidth??26;
 const forward=clamp(dx*ca+dy*sa,-length*.21,length*.43),side=clamp(-dx*sa+dy*ca,-width*.24,width*.24);
 const x=p.x+ca*forward-sa*side,y=p.y+sa*forward+ca*side;
 cue(p,'salamanderImpact',{x,y,a:heading},{wear:state.wear,forward,side,life:.36});
 sound(p,'secretSalamanderImpact');
}

const scripted=p=>p.hp<=0||p.status==='downed'||p.evadeTime>0||p.strutterBrakeDuration>0||p.chargeTime>0||p.aceRetreat129||p.duoSpinStep>0||p.vossReverse>0||p.heineckeEscape>0||p.bomberTransfer;

export function siemensTurnOutput(p,dt,steer,effort){
 if(!hasSecretWeapon(p,SIEMENS)||!(dt>0)||scripted(p))return;
 const state=secretWeaponEffect(p,SIEMENS),direction=effort>=.18?Math.sign(steer):0;
 state.reversal=Math.max(0,(state.reversal||0)-dt);
 if(direction){
  if(state.direction&&state.direction!==direction&&state.held>=.14){state.reversal=.32;state.reversalCue=true;}
  state.held=direction===state.direction?Math.min(.65,(state.held||0)+dt):dt;
  state.direction=direction;
  state.coast=0;
 }else{
  state.coast=Math.min(.20,(state.coast||0)+dt);
  if(state.coast>=.20){state.direction=0;state.held=0;}
 }
 const load=direction?clamp((effort-.18)/.72,0,1):0;
 state.load=(state.load||0)+(load-(state.load||0))*(1-Math.exp(-(direction?7:9)*dt));
 if(!direction)return;
 const reversing=state.reversal>0;
 return {drag:1-.26-.32*state.load-(reversing ? .12 : 0),recovery:1+.32*state.load+(reversing ? .9 : 0)};
}

export function tickSiemensFeedback(p,dt,cue,sound){
 if(!hasSecretWeapon(p,SIEMENS))return;
 const state=p.secretWeaponState?.effects[SIEMENS];
 if(!state)return;
 if(scripted(p)){
  clearSecretFlightTransient(p);
  return;
 }
 state.soundDelay=Math.max(0,(state.soundDelay||0)-dt);
 if(state.reversalCue){
  delete state.reversalCue;
  cue(p,'siemensReversal',p,{life:.38});
  sound(p,'secretSiemensReverse');
  state.soundDelay=.4;
 }else if(state.load>=.46&&state.coast===0&&state.soundDelay<=0){
  sound(p,'secretSiemensPower');
  state.soundDelay=.57;
 }
}

export function clearSecretFlightTransient(p,stage=false){
 const effects=p.secretWeaponState?.effects;
 if(effects?.[SIEMENS])delete effects[SIEMENS];
 if(stage&&effects?.[SALAMANDER])delete effects[SALAMANDER];
}

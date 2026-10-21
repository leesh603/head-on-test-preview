// A narrow owner-local extension of existing MG rounds and swept hostile impacts.
import {NUNGESSER_BALANCE as B,signatureState,signatureCue,nungesserState} from './pilot-signature-state.js';
export {NUNGESSER_BALANCE} from './pilot-signature-state.js';
const INSTALLED=Symbol.for('headon.nungesser-combat.v1');
const owner=p=>p.id??'p1';
const visible=p=>p?.pilot==='nungesser'&&p.hp>0&&p.status!=='downed'&&p.state==='playing';
const personal=(p,b)=>b&&Number.isInteger(b.gun)&&(b.ownerId===undefined||b.ownerId===owner(p))&&!['enemy','ally','formation','patrol','transferGun','rocket','cow37','motorCannon','mauserRound','blast','actualExplosion','identityDot','identityChain','nungesserCounter'].some(k=>b[k]);
export function nungesserCombatStatus(p){
 const s=p?.pilotSignatureState,n=s?.nungesser,ready=visible(p)&&!!n&&n.readyUntil>s.clock,active=visible(p)&&p.skillTime>0;
 return {ready,readyFraction:ready?Math.min(1,(n.readyUntil-s.clock)/B.readySeconds):0,active,entry:active&&(p.pilotIdentity?.activeAge??Infinity)<B.entryGrace};
}
function remember(p,b){
 const n=nungesserState(p);n.pool??=p.combatWorld().bullets;if(n.shots.length<B.maxShots)n.shots.push({round:b,x:b.x,y:b.y});
}
export function installNungesserCombat(Game){
 const q=Game.prototype;if(Object.hasOwn(q,INSTALLED))return;Object.defineProperty(q,INSTALLED,{value:true});
 const begin=q.beginRevisionFrame;
 q.beginRevisionFrame=function(dt,input={}){
  const prior=begin.call(this,dt,input);if(this.pilot!=='nungesser')return prior;
  const n=nungesserState(this);n.shots.length=0;n.pool=this.combatWorld().bullets;n.step=Math.min(.04,Math.max(0,dt));
  if(!visible(this)){n.readyUntil=0;return prior;}
  this.passiveStrength=nungesserCombatStatus(this).readyFraction;
  if(this.skillTime>0)for(const b of this.combatWorld().bullets||[])if(b.nungesserBreakthrough&&b.ownerId===owner(this)&&b.life>0)remember(this,b);
  return prior;
 };
 const round=q.applySpecialRound;
 q.applySpecialRound=function(b,...args){
  const result=round.call(this,b,...args),shot=result??b;if(!visible(this)||!personal(this,shot))return result;
  const s=signatureState(this),n=nungesserState(this);
  if(this.skillTime>0){shot.ownerId=owner(this);shot.pierce=true;shot.nungesserBreakthrough=true;remember(this,shot);}
  if(n.readyUntil>s.clock){
   n.readyUntil=0;n.rearmAt=Math.max(n.rearmAt,s.clock+B.rearmSeconds);
   const heading=Math.atan2(shot.vy,shot.vx),speed=Math.hypot(shot.vx,shot.vy);
   for(const side of [-1,1]){
    const a=heading+side*B.counterAngle,extra={x:shot.x,y:shot.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:shot.life,damage:shot.damage*B.counterDamage,gun:shot.gun,ownerId:owner(this),enemy:false,pierce:true,hit:new Set(),identityGun:true,identityOrigin:{x:this.x,y:this.y,a:this.a},nungesserCounter:true};
    if(this.skillTime>0){extra.nungesserBreakthrough=true;remember(this,extra);}
    this.combatWorld().bullets.push(extra);
   }
   signatureCue(this,'nungesserCounterShot',{x:shot.x,y:shot.y,a:heading,life:.24});
  }
  return result;
 };
}

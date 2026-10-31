// Read-only presentation of the existing two piercing / two incendiary beats.
import {signatureCue,signatureInterval} from './pilot-signature-state.js';
import {combatImpactResult} from './combat-impact-result.js';
const INSTALLED=Symbol.for('headon.gontermann-phase-fx.v1');
const owner=p=>p.id??'p1',live=p=>p.pilot==='gontermann'&&p.state==='playing'&&p.hp>0&&p.status!=='downed';
const phase=b=>b?.fiveAceRound&&['pierce','ignite'].includes(b.fiveAcePhase);
const personal=(p,b,pre=false)=>phase(b)&&Number.isInteger(b.gun)&&(b.ownerId===undefined?pre||owner(p)==='p1':b.ownerId===owner(p))&&!['enemy','ally','formation','patrol','rocket','motorCannon','cow37','mauserRound','blast','actualExplosion','identityDot','identityChain'].some(k=>b[k]);
export function installGontermannPhaseFx(Game){const q=Game.prototype;if(Object.hasOwn(q,INSTALLED))return;Object.defineProperty(q,INSTALLED,{value:true});
 const apply=q.applySpecialRound;q.applySpecialRound=function(b,...args){const r=apply.call(this,b,...args);
  if(live(this)&&this.reloadTime<=0&&personal(this,b,true)&&signatureInterval(this,'gonterShot'+b.fiveAcePhase+b.gun,.025))signatureCue(this,'gonterPhaseShot',{x:b.x,y:b.y,a:Math.atan2(b.vy,b.vx),phase:b.fiveAcePhase,life:.19});return r;
 };
 const impact=q.specialRoundImpact;q.specialRoundImpact=function(b,e,...args){const r=impact.call(this,b,e,...args),hit=combatImpactResult(b,e);
  if(live(this)&&personal(this,b)&&(hit?.damage>0&&!hit.blocked)&&signatureInterval(this,'gonterHit'+b.fiveAcePhase,.035)){
   const point=b;signatureCue(this,'gonterPhaseHit',{x:point.x,y:point.y,a:Math.atan2(b.vy,b.vx),phase:b.fiveAcePhase,life:b.fiveAcePhase==='pierce'?.18:.34});
  }return r;
 };
}
export function drawGontermannPhaseCue(c,p,e,tex,front){
 if(p.pilot!=='gontermann'||!['gonterPhaseShot','gonterPhaseHit'].includes(e.kind))return false;
 if(!front||e.ownerId!==owner(p))return true;
 const age=e.age,q=Math.max(0,Math.min(1,age/e.maxLife)),fade=1-q,a=e.a-p.a,shot=e.kind==='gonterPhaseShot';
 if(e.phase==='pierce'){
  if(age<.08)tex(c,shot?'muzzleHeavy':'armorSpark',0,0,shot?27:25,shot?9:13,a,.95*(1-age/.08));
  if(!shot)tex(c,'ricochet',q*13,0,21,7,a,.85*fade);
 }else{
  // A round ignition bloom followed by a short attached smoke tear, not a larger bullet.
  if(age<.12)tex(c,shot?'muzzleTwin':'fireSmall',0,0,shot?23:29,shot?17:26,a,.87*(1-age/.12));
  if(!shot)tex(c,'gunSmoke',-q*9,0,22+q*14,18+q*9,a,.42*fade);
 }
 return true;
}

// Real rear-gun records only. Never alter aiming, aircraft motion or bullets.
import {signatureCue,signatureInterval} from './pilot-signature-state.js';
import {combatImpactResult} from './combat-impact-result.js';
const INSTALLED=Symbol.for('headon.huffzky-rear-fx.v1');
const owner=p=>p.id??'p1',live=p=>p.pilot==='huffzky'&&p.state==='playing'&&p.hp>0&&p.status!=='downed';
const rear=(p,b)=>b?.pilotRear&&b.gun===1&&(b.ownerId??'p1')===owner(p)&&!['enemy','ally','formation','patrol','rocket','motorCannon','cow37','mauserRound','blast','actualExplosion','identityDot','identityChain'].some(k=>b[k]);
export function installHuffzkyRearFx(Game){const q=Game.prototype;if(Object.hasOwn(q,INSTALLED))return;Object.defineProperty(q,INSTALLED,{value:true});
 const shot=q.applySpecialRound;q.applySpecialRound=function(b,...args){const r=shot.call(this,b,...args);
  if(live(this)&&this.reloadTime<=0&&rear(this,b)&&signatureInterval(this,'huffSpent',.025))signatureCue(this,'huffSpent',{x:b.x,y:b.y,a:Math.atan2(b.vy,b.vx),strong:!!b.pilotRearActive,life:b.pilotRearActive?.42:.32});return r;
 };
 const impact=q.specialRoundImpact;q.specialRoundImpact=function(b,e,...args){const r=impact.call(this,b,e,...args),hit=combatImpactResult(b,e);
  if(live(this)&&rear(this,b)&&hit?.damage>0&&!hit.blocked&&signatureInterval(this,'huffRearHit',.045))signatureCue(this,'huffRearHit',{x:b.x,y:b.y,a:Math.atan2(b.vy,b.vx),strong:!!b.pilotRearActive,life:.24});return r;
 };
}
export function drawHuffzkyRearCue(c,p,e,tex,front){
 if(p.pilot!=='huffzky'||!['huffSpent','huffRearHit'].includes(e.kind))return false;
 if(!front||e.ownerId!==owner(p))return true;
 const age=e.age,q=Math.max(0,Math.min(1,age/e.maxLife)),fade=1-q,a=e.a-p.a,ca=Math.cos(a),sa=Math.sin(a);
 if(e.kind==='huffSpent'){
  // Existing gun-mounted flash/brass covers the first .1s. Only the spent
  // cartridge and powder remain in world space after that flash, never a trail.
  if(age<.075)return true;
  for(let i=0;i<(e.strong?3:2);i++){
   const t=age+i*.025,back=4+t*21,side=6+t*45+i*2;
   tex(c,'bulletBrass',-ca*back-sa*side,-sa*back+ca*side,5.5,2.3,a+.6+t*10+i*.4,.8*fade);
  }
  const smoke=(e.strong?.38:.24)*fade;
  tex(c,'gunSmoke',ca*(4-age*15),sa*(4-age*15),21+q*19,10+q*9,a,smoke);
 }else{
  if(age<.09)tex(c,'ricochet',0,0,e.strong?24:18,11,a,.85*(1-age/.09));
  for(const side of [-1,1])tex(c,'debris',-ca*q*7-sa*side*q*9,-sa*q*7+ca*side*q*9,8-q*3,4,a+side*q,.7*fade);
 }
 return true;
}

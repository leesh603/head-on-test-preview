// Baracca: one dark charge body. Rickenbacker: cowl glints and real radial guns.
// Presentation observers only; projectile bodies and every combat rule stay intact.
import {signatureCue,signatureInterval} from './pilot-signature-state.js';
import {headOnTarget} from './engagement-feedback.js?v=tame3';
import {ordnanceGroundShift} from './ordnance-pilot-fx.js?v=ordnancefx1';
export const CAVALRY_RACER_PILOTS=new Set(['baracca','rickenbacker']);
const INSTALLED=Symbol.for('headon.cavalry-racer-fx.v1');
const clamp=n=>Math.max(0,Math.min(1,n));
const own=p=>p.id??'p1';
const alive=p=>p.hp>0&&p.status!=='downed'&&p.state==='playing';
const mine=(p,b)=>(b.ownerId??'p1')===own(p)&&!b.enemy&&!b.ally&&!b.patrol&&!b.actualExplosion&&!b.blast&&!b.identityDot&&!b.identityChain;
const personal=b=>!b.enemy&&!b.ally&&!b.patrol&&!b.blast&&!b.actualExplosion&&!b.identityDot&&!b.identityChain&&!b.formation&&!b.rocket&&!b.motorCannon&&!b.cow37&&!b.mauserRound;
export function cavalryHeadOn(p,b,e){
 if(!e)return false;const origin=b.identityOrigin||p;
 // Damage has already been accepted, including lethal hits. Recheck its original
 // firing geometry with positive HP, preserving the same type/range/cone rules.
 return !!headOnTarget({...origin,hp:1},[{...e,hp:1}]);
}
export function racerPressure(p){
 let n=0;for(const e of (p.combatWorld?.()||p).enemies||[])if(e.hp>0&&!e.surface&&Math.hypot(e.x-p.x,e.y-p.y)<700&&++n===5)break;return n/5;
}
export function installCavalryRacerFx(Game){
 const q=Game.prototype;if(Object.hasOwn(q,INSTALLED))return;Object.defineProperty(q,INSTALLED,{value:true});
 const round=q.applySpecialRound;q.applySpecialRound=function(b,type){const r=round.call(this,b,type);
  if(CAVALRY_RACER_PILOTS.has(this.pilot)&&alive(this)&&personal(b)&&Number.isInteger(b.gun)&&!b.enemy&&!b.ally&&!b.patrol&&(b.ownerId===undefined||b.ownerId===own(this))&&this.reloadTime<=0&&signatureInterval(this,'cavalryRacerGun'+b.gun,.025))
   signatureCue(this,'cavalryRacerGun',{x:b.x,y:b.y,a:Math.atan2(b.vy,b.vx),life:.085,power:this.pilot==='rickenbacker'?racerPressure(this):0});
  return r;
 };
 const impact=q.identityImpact;q.identityImpact=function(b,e,target,pos){
  const s=this.pilotIdentity,clock=s?.clock||0,last=s?.lastHit,previous=s?.switchSeen?.get(e)??-Infinity;
  const switched=this.pilot==='rickenbacker'&&b.identityGun&&last&&last!==e&&clock-(s.lastHitAt||0)<2&&clock-previous>=2;
  const r=impact.call(this,b,e,target,pos);
  if(!CAVALRY_RACER_PILOTS.has(this.pilot)||!alive(this)||!mine(this,b))return r;
  const kind=this.pilot==='baracca'&&personal(b)&&cavalryHeadOn(this,b,e)?'cavalryHeadOn':this.pilot==='rickenbacker'&&b.rickRingRound?'racerPierce':switched&&personal(b)?'racerSwitch':null;
  if(kind&&signatureInterval(this,kind,.065)){const point=e?.stageBossBody?(pos||b):b;
   signatureCue(this,kind,{x:point.x,y:point.y,a:Math.atan2(b.vy,b.vx),life:.28,count:this.pilotIdentity?.switches||1});
  }return r;
 };
 const hit=q.hit;q.hit=function(...args){const r=hit.apply(this,args);if(CAVALRY_RACER_PILOTS.has(this.pilot)&&!(this.hp>0))delete this.pilotSignatureState;return r;};
}
export function racerRounds(p){
 const out=[],bullets=(p.combatWorld?.()||p).bullets||[];
 for(let i=bullets.length-1;i>=0&&out.length<14;i--){const b=bullets[i],age=1.5-b.life;
  if(b.rickRingRound&&mine(p,b)&&age>=0&&age<.075&&[b.x,b.y,b.vx,b.vy].every(Number.isFinite))out.push(b);
 }return out;
}
export function drawCavalryRacerWorld(c,p,tex,front=false){
 if(p.pilot!=='rickenbacker'||!alive(p)||!front)return;
 const shift=ordnanceGroundShift(p);
 for(const b of racerRounds(p)){
  const age=1.5-b.life,a=Math.atan2(b.vy,b.vx),x=b.x-b.vx*age-p.x+shift.x,y=b.y-b.vy*age-p.y+shift.y;
  tex(c,'muzzleTwin',x+Math.cos(a)*6,y+Math.sin(a)*6,32,13,a,.98*(1-age/.075),'#e6c895');
 }
}
export function drawCavalryRacerLocal(c,p,tex,front=false){
 if(!alive(p))return;
 if(p.pilot==='baracca'&&!front&&p.chargeTime>0){
  const t=p.pilotSignatureState?.clock||0,strength=Math.min(1,p.chargeTime/.12),heading=(p.chargeAngle??p.a)-p.a;
  // A translucent, faceted black lance envelope around the aircraft. The actual
  // locked charge heading also owns the smoke; steering cannot bend the tip.
  for(let i=0;i<3;i++){const x=-42-i*25,breath=Math.sin(t*18+i)*1.5;
   tex(c,'smokeOil',Math.cos(heading)*x-Math.sin(heading)*breath,Math.sin(heading)*x+Math.cos(heading)*breath,60+i*17,28+i*9,heading,(.32-i*.06)*strength,'#171b1c');
  }
  c.save();try{c.globalCompositeOperation='source-over';tex(c,'baraccaLance',Math.cos(heading)*14,Math.sin(heading)*14,174,124,heading,.32*strength);}finally{c.restore();}return;
 }
 if(p.pilot==='rickenbacker'&&front){
  const pressure=racerPressure(p),active=p.skillTime>0;if(!pressure&&!active)return;
  const t=p.pilotSignatureState?.clock||0,pulse=.72+.28*Math.sin(t*13)**2;
  // Light catches the engine cowling; the nearby-enemy multiplier is not a HUD.
  for(const side of [-1,1])tex(c,'metalShard0',22,side*8,active?17:11+pressure*5,4,-side*.3,(active?.82:pressure*.75)*pulse,active?'#e5cda0':'#b6d4dc');
 }
}
export function drawCavalryRacerCue(c,p,e,tex,front){
 if(!CAVALRY_RACER_PILOTS.has(p.pilot))return false;
 if(['cavalryCharge','cavalryGuard','ringPass','ringVolley','targetSwitch','shotAccent'].includes(e.kind))return true;
 if(!['cavalryRacerGun','cavalryHeadOn','racerSwitch','racerPierce'].includes(e.kind))return false;
 if(front){const fade=1-clamp(e.age/e.maxLife),a=e.a-p.a;
  if(e.kind==='cavalryRacerGun')tex(c,'muzzleTwin',Math.cos(a)*5,Math.sin(a)*5,22+(e.power||0)*4,10,a,.92*fade,p.pilot==='baracca'?'#ded4b9':'#c5dadb');
  else if(e.kind==='cavalryHeadOn'){
   tex(c,'ricochet',0,0,39,12,a,.95*fade,'#dfd3ad');
   tex(c,'smokeOil',-e.age*22,0,31+e.age*28,19,a,.52*fade,'#434b48');
  }else if(e.kind==='racerSwitch'){
   for(let i=0;i<Math.min(3,e.count||1);i++)tex(c,'metalShard'+i,-i*5-e.age*20,(i-1)*6,15,4,a+(i-1)*.4,.95*fade,'#c5dbe0');
   tex(c,'ricochet',0,0,28,11,a,.7*fade,'#c5dbe0');
  }else tex(c,'armorSpark',0,0,29,15,a,.9*fade,'#d8c69e');
 }return true;
}


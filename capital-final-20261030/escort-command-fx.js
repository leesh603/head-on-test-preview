// Real flight positions and gunfire carry escort orders; healthy wings stay clean.
// Observe actual owned wingmen, accepted support damage and accepted guard hits.
import {signatureCue,signatureInterval} from './pilot-signature-state.js';
import {ordnanceGroundShift} from './ordnance-pilot-fx.js?v=capital-final-20261030';
export const ESCORT_PILOTS=new Set(['goering','brumowski']);
const INSTALLED=Symbol.for('headon.escort-command-fx.v1');
const clamp=n=>Math.max(0,Math.min(1,n));
const owner=p=>p.id??'p1';
const alive=p=>p.hp>0&&p.status!=='downed'&&p.state==='playing';
const world=p=>p.combatWorld?.()||p;
const blocked=b=>['enemy','patrol','rocket','motorCannon','cow37','blast','actualExplosion','mauserRound','identityDot','identityChain'].some(k=>b[k]);
export function escortWings(p){
 if(!ESCORT_PILOTS.has(p.pilot)||!alive(p))return [];
 const owned=w=>w.ownerId===owner(p)||(w.ownerId===undefined&&!p.world&&!p.players);
 return (world(p).allies||[]).filter(w=>owned(w)&&w.life>0&&(w.hp===undefined||w.hp>0)&&!w.crashing&&!w.crashed&&[w.x,w.y,w.a].every(Number.isFinite)).slice(0,10);
}
export function escortGuardCount(p){
 return (world(p).allies||[]).filter(w=>w.ownerId===owner(p)&&w.life>0&&Math.hypot(w.x-p.x,w.y-p.y)<180).length;
}
export function escortStrength(p){
 let n=0;for(const w of world(p).allies||[])if(w.life>0&&(w.hp===undefined||w.hp>0)&&++n===3)break;return n/3;
}
function guardAfter(p,before,count,source){
 if(ESCORT_PILOTS.has(p.pilot)&&!(p.hp>0)){delete p.pilotSignatureState;return;}
 if(p.pilot!=='brumowski'||!alive(p)||!(p.hp<before)||!(p.skillTime>0)||!count||!source?.bullet||!signatureInterval(p,'escortGuard',.09))return;
 const x=source.impactX??p.x,y=source.impactY??p.y,a=Math.atan2(source.bullet.vy,source.bullet.vx);
 signatureCue(p,'escortGuard',{x,y,a,life:.3,power:Math.min(2,count)/2});
}
export function installEscortCommandFx(Game){
 const q=Game.prototype;if(Object.hasOwn(q,INSTALLED))return;Object.defineProperty(q,INSTALLED,{value:true});
 const round=q.applySpecialRound;q.applySpecialRound=function(b,type){const r=round.call(this,b,type);
  if(ESCORT_PILOTS.has(this.pilot)&&alive(this)&&!blocked(b)&&!b.ally&&!b.formation&&Number.isInteger(b.gun)&&(b.ownerId===undefined||b.ownerId===owner(this))&&this.reloadTime<=0&&signatureInterval(this,'escortGun'+b.gun,.025))
   signatureCue(this,'escortGun',{x:b.x,y:b.y,a:Math.atan2(b.vy,b.vx),life:.085,power:this.pilot==='brumowski'?escortStrength(this):0});
  return r;
 };
 const impact=q.identityImpact;q.identityImpact=function(b,e,target,pos){const r=impact.call(this,b,e,target,pos);
  if(ESCORT_PILOTS.has(this.pilot)&&alive(this)&&(b.ownerId??'p1')===owner(this)&&!blocked(b)&&(b.ally||b.formation)&&signatureInterval(this,'escortSupportHit',.08)){
   const point=e?.stageBossBody?(pos||b):b;signatureCue(this,'escortSupportHit',{x:point.x,y:point.y,a:Math.atan2(b.vy,b.vx),life:.28});
  }return r;
 };
 const hit=q.hit;q.hit=function(...args){const hp=this.hp,count=this.pilot==='brumowski'?escortGuardCount(this):0,source=this.damageSource,r=hit.apply(this,args);guardAfter(this,hp,count,source);return r;};
}
// Co-op owns its hitPlayer path; PlayerState does not call Game.hit.
export function installEscortCoopFx(CoopGame){
 const q=CoopGame.prototype;if(Object.hasOwn(q,INSTALLED))return;Object.defineProperty(q,INSTALLED,{value:true});
 const hit=q.hitPlayer;q.hitPlayer=function(p,...args){const hp=p.hp,count=p.pilot==='brumowski'?escortGuardCount(p):0,source=p.damageSource,r=hit.call(this,p,...args);guardAfter(p,hp,count,source);return r;};
}
export function drawEscortWorld(c,p,tex,front=false){
 if(!alive(p)||!ESCORT_PILOTS.has(p.pilot))return;
 const shift=ordnanceGroundShift(p),white=p.pilot==='goering',active=p.skillTime>0;
 for(const w of escortWings(p)){
  const x=w.x-p.x+shift.x,y=w.y-p.y+shift.y,ca=Math.cos(w.a),sa=Math.sin(w.a),side=(-Math.sin(p.a)*(w.x-p.x)+Math.cos(p.a)*(w.y-p.y))<0?-1:1;
  const at=(key,dx,dy,width,height,a,alpha,color)=>tex(c,key,x+ca*dx-sa*dy,y+sa*dx+ca*dy,width,height,w.a+a,alpha,color);
  if(front){
   if(w.muzzleFlash>0){const a=w.fireHeading??w.muzzleAngle??w.a,fade=clamp(w.muzzleFlash/.055);
    tex(c,white?'muzzle':'muzzleTwin',x+Math.cos(a)*31,y+Math.sin(a)*31,white?25:29,white?9:13,a,.96*fade,white?'#e9e4c9':'#e1bb85');
   }
  }else if(active){
   at('windStreak',-31,side*23,24,3,0,.13,white?'#e1e4d6':'#d9bb95');
  }
 }
}
export function drawEscortCue(c,p,e,tex,front){
 if(!ESCORT_PILOTS.has(p.pilot))return false;
 if(['whiteCommand','skullGuard','commandHit','intercept','shotAccent'].includes(e.kind))return true;
 if(!['escortGun','escortSupportHit','escortGuard'].includes(e.kind))return false;
 if(front){const q=clamp(e.age/e.maxLife),fade=1-q,a=e.a-p.a,white=p.pilot==='goering';
  if(e.kind==='escortGun')tex(c,white?'muzzle':'muzzleTwin',Math.cos(a)*5,Math.sin(a)*5,white?21:22+(e.power||0)*4,white?8:11,a,.93*fade,white?'#e4e1cd':'#d7ad80');
  else if(e.kind==='escortGuard'){
   tex(c,'ricochet',0,0,36+e.power*8,18,a,.94*fade,'#ddbd8b');
   for(const side of [-1,1])tex(c,'metalShard1',-q*13,side*q*14,12,4,a+side*q,.85*fade,'#c88e68');
  }else if(white){tex(c,'armorSpark',0,0,25,12,a,.9*fade,'#e1e5d7');tex(c,'metalShard2',-q*12,0,13,4,a,.8*fade,'#aabcc5');}
  else{tex(c,'ricochet',0,0,29,13,a,.9*fade,'#d5a071');tex(c,'metalShard0',-q*11,q*9,11,5,a+q,.8*fade,'#b17e62');}
 }return true;
}


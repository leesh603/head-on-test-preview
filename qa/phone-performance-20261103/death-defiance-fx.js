// Owner-local heraldry, counterfire and damaged rotary exhaust.
import {signatureCue,signatureInterval} from './pilot-signature-state.js';
import {nungesserCombatStatus} from './nungesser-combat.js';
export const DEFIANCE_PILOTS=new Set(['nungesser','barker']);
const INSTALLED=Symbol.for('headon.death-defiance-fx.v1');
const clamp=n=>Math.max(0,Math.min(1,n));
const visible=p=>p?.hp>0&&p.status!=='downed';
const owner=p=>p.id??'p1';
const time=p=>p.pilotSignatureState?.clock??p.t??0;
const personal=(p,b)=>b&&Number.isInteger(b.gun)&&(b.ownerId===undefined||b.ownerId===owner(p))&&!['enemy','ally','formation','patrol','rocket','cow37','motorCannon','mauserRound','blast','actualExplosion','identityDot','identityChain'].some(k=>b[k]);
const art={};
export const deathDefianceArtReady=Promise.all(['barker-exhaust'].flatMap(kind=>Array.from({length:4},(_,i)=>new Promise(resolve=>{
 if(typeof Image==='undefined'){resolve(false);return;}
 const key=kind+'-'+i,im=new Image();art[key]=im;im.onload=()=>resolve(true);im.onerror=()=>resolve(false);im.src=new URL('./pilot-material-art/'+key+'.webp',import.meta.url).href;
}))));
function ready(key){const im=art[key];return im?.complete&&im.naturalWidth?im:null;}
function latest(p,kind,gun){const effects=p.pilotSignatureState?.effects||[];for(let i=effects.length-1;i>=0;i--){const e=effects[i];if(e.life>0&&e.ownerId===owner(p)&&e.kind===kind&&(gun===undefined||e.gun===gun))return e;}}
export function installDeathDefianceFx(Game){
 const q=Game.prototype;if(Object.hasOwn(q,INSTALLED))return;Object.defineProperty(q,INSTALLED,{value:true});
 const round=q.applySpecialRound;q.applySpecialRound=function(b,...args){const r=round.call(this,b,...args);
  // Missing owner is valid here only: co-op assigns it in emit() after this hook.
  if(DEFIANCE_PILOTS.has(this.pilot)&&visible(this)&&this.state==='playing'&&this.reloadTime<=0&&personal(this,b)&&signatureInterval(this,'defianceGun'+b.gun,.025)){
   const dx=b.x-this.x,dy=b.y-this.y,c=Math.cos(this.a),s=Math.sin(this.a);
   signatureCue(this,'defianceGun',{life:.085,x:b.x,y:b.y,a:Math.atan2(b.vy,b.vx),gun:b.gun,mountX:dx*c+dy*s,mountY:-dx*s+dy*c});
  }return r;
 };
}
export function barkerStrain(p){
 if(p.pilot!=='barker'||!visible(p)||!(p.maxHp>0))return 0;
 const stage=Math.min(5,Math.max(p.barkerDamageStage||0,p.barkerStacks||0)),active=p.skillTime>0,damage=clamp(1-p.hp/p.maxHp);
 // Permanent scars stay in the existing painted decals; they do not burn forever.
 return clamp(Math.max(stage/5*(.4+.6*damage),active?.2+damage*.8:0));
}
// A narrow, broken oil/exhaust thread follows the recorded flight path.
// The existing engine smoke particles and painted damage remain intact.
export function drawBarkerDamageWake(c,p,tex){
 if(p.pilot!=='barker'||!visible(p)||p.state!=='playing')return;
 const f=p.sortieFlightFx,strain=barkerStrain(p);if(!f||!strain||!Number.isFinite(f.clock))return;
 const wake=f.wake||[];let drawn=0;
 for(let i=wake.length-2;i>=0&&drawn<6;i-=2){
  const v=wake[i],next=wake[i+1],age=f.clock-v.at;
  if(!(v.stage>0)||!Number.isFinite(age)||age<0||age>=.48||![v.x,v.y,v.a,next.x,next.y].every(Number.isFinite))continue;
  const dx=next.x-v.x,dy=next.y-v.y,d=Math.hypot(dx,dy);if(d<.5||d>32)continue;
  const q=age/.48,fade=(1-q)**.7,a=Math.atan2(dy,dx),ca=Math.cos(v.a),sa=Math.sin(v.a),k=Math.min(1,v.stage/5);
  const x=(v.x+next.x)/2-p.x+ca*(15-age*55),y=(v.y+next.y)/2-p.y+sa*(15-age*55);
  tex(c,'smokeTrail',x,y,d+25+q*15,11+strain*10+q*4,a,(.55+k*.25)*fade,'#514d45');
  if(v.stage>=3)tex(c,'engineSmoke',x-ca*7,y-sa*7,23+q*18,12+q*11,v.a+Math.PI,.20*strain*fade);
  drawn++;
 }
}
export function defianceAirframePose(p,base){
 const strength=barkerStrain(p);if(!strength)return base;
 const t=time(p),critical=p.skillTime>0&&p.hp<=3?1:0,hit=latest(p,'battleDamage'),kick=hit?Math.max(0,1-hit.age/.16):0;
 return {...base,x:base.x+Math.sin(t*41)*strength*(.55+critical*.45),y:base.y+Math.sin(t*33)*strength*.35,roll:base.roll+Math.sin(t*31)*strength*.022+kick*.012};
}
// Retained for older review tools; the fabric veil has been retired.
export function nungesserVeilPose(){return null;}
function heart(c,p,insignia,x,size,alpha){
 c.save();try{
  c.translate(x,0);c.rotate(-p.a);c.globalCompositeOperation='source-over';c.globalAlpha*=clamp(alpha);
  insignia(c,'blackHeart',0,0,size,time(p));
 }finally{c.restore();}
}
export function drawDeathDefianceLocal(c,p,tex,front=false,insignia=()=>false){
 if(!DEFIANCE_PILOTS.has(p.pilot)||!visible(p))return false;
 const scale=(p.bomberTransfer?.scale??1)*(p.aceScale129||1);
 if(!front){
  c.save();try{c.scale(scale,scale);
  }finally{c.restore();}return true;
 }
 if(p.pilot==='barker'){c.save();try{c.scale(scale,scale);
    const strength=barkerStrain(p),im=ready('barker-exhaust-'+Math.floor(time(p)*15)%4);
    if(strength&&im){const critical=p.skillTime>0&&p.hp<=3,length=11+strength*21+(critical?3:0),pulse=.75+.25*Math.sin(time(p)*37)**2;
     for(const side of [-1,1]){const h=length*(side<0?.82:1),w=h*im.naturalWidth/im.naturalHeight;c.save();c.translate(17,side*5);c.rotate(Math.PI/2);c.globalAlpha*=pulse*(.48+strength*.42);c.drawImage(im,-w/2,0,w,h);c.restore();}
    }

 }finally{c.restore();}}
 for(let gun=0;gun<(p.weapon?.guns||1);gun++){
  const e=latest(p,'defianceGun',gun);if(!e)continue;const a=e.a-p.a,flash=clamp(e.life/.045);
  const mark=p.pilot==='nungesser'&&nungesserCombatStatus(p).active;
  const power=p.pilot==='barker'?clamp(Math.max(p.barkerStacks||0,p.barkerDamageStage||0)/5):0;
  tex(c,Math.cos(a)<0?'muzzleRear':'muzzleTwin',e.mountX+Math.cos(a)*3,e.mountY+Math.sin(a)*3,16+power*15+(mark?8:0),7+power*5+(mark?3:0),a,.9*flash);
  if(power){
   const age=Number.isFinite(e.age)?e.age:Math.max(0,.085-e.life),side=gun%2?1:-1;
   tex(c,'gunSmoke',e.mountX+Math.cos(a)*(10+age*35),e.mountY+Math.sin(a)*(10+age*35),24+power*13,12+power*6,a,.28*power*flash);
   tex(c,'bulletBrass',e.mountX-7-age*38,e.mountY+side*(7+age*80),6,2.5,side*(.4+age*12),.8*power*flash);
  }
 }return true;
}
export function drawDeathDefianceCue(c,p,e,tex,front,insignia=()=>false){
 if(!DEFIANCE_PILOTS.has(p.pilot))return false;
 if(e.ownerId!==owner(p))return true;
 if(p.pilot==='nungesser'){return true; }else if(front&&e.kind==='survivalHit'){
  const q=clamp(e.age/.42);for(const side of [-1,1])tex(c,'metalShard2',-q*9,side*(2+q*7),8-q*3,3,e.a-p.a+side*q,.8*(1-q));
 }
 // Consume all generic starts, duplicate expiry/near-miss cues and old brass.
 return true;
}


// A small upright authored insignia above the target, never over its airframe.
export function drawNungesserMark(c,p,insignia){
 if(p.pilot!=='nungesser'||!visible(p)||p.status==='downed')return;
 const n=p.pilotSignatureState?.nungesser;if(!n?.markKey||!(n.markRemaining>0)||!(p.skillTime>0)||![n.markX,n.markY,n.markTop].every(Number.isFinite))return;
 c.save();try{c.globalAlpha*=Math.min(1,n.markRemaining/.18);c.filter='drop-shadow(0px 0px 0.7px #f5edcf)';insignia(c,'blackHeart',n.markX-p.x,n.markY-p.y-n.markTop,24,time(p));}finally{c.restore();}
}

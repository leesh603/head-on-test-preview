// Luke: actual burning fuel cells. Mannock: articulated real support aircraft.
// No projectile, damage, spawn, random-number or flight-state writes.
import {signatureCue,signatureInterval} from './pilot-signature-state.js';
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const owner=p=>p.id??'p1';
const living=p=>p?.hp>0&&p.status!=='downed'&&p.state==='playing';
const world=p=>p.combatWorld?.()||p;
const privateGun=(p,b)=>b&&(b.ownerId??'p1')===owner(p)&&Number.isInteger(b.gun)&&!['enemy','ally','formation','patrol','rocket','motorCannon','cow37','mauserRound','blast','actualExplosion','identityDot','identityChain'].some(k=>b[k]);
export const FIRE_DIVE_PILOTS=new Set(['luke','mannock']);
export const lukeAirship=e=>!!e&&(e.type==='zeppelin'||['zeppelin-l70','hma23'].includes(e.stageBossBody?.kind||e.kind));
const INSTALLED=Symbol.for('headon.fire-dive-fx.v1');
const burnAnchors=new WeakMap();
const fireArt=[];
export const fireDiveArtReady=Promise.all([0,1,2,3].map(i=>new Promise(resolve=>{
 if(typeof Image==='undefined'){resolve(false);return;}
 const im=new Image();fireArt[i]=im;im.onload=()=>resolve(true);im.onerror=()=>resolve(false);im.src=new URL('./pilot-material-art/luke-fire-'+i+'.webp',import.meta.url).href;
})));
export function installFireDiveFx(Game){
 const q=Game.prototype;if(Object.hasOwn(q,INSTALLED))return;Object.defineProperty(q,INSTALLED,{value:true});
 const impact=q.identityImpact;q.identityImpact=function(b,e,target=e,pos=e){
  const before=this.pilotIdentity?.burns?.get(target),r=impact.call(this,b,e,target,pos);
  if(this.pilot!=='luke'||!living(this)||!privateGun(this,b))return r;
  const burn=this.pilotIdentity?.burns?.get(target);
  if(burn&&burn!==before){
   const point=e.stageBossBody?(pos||b):b,a=e.a||0,dx=point.x-e.x,dy=point.y-e.y;
   burnAnchors.set(burn,{x:dx*Math.cos(a)+dy*Math.sin(a),y:-dx*Math.sin(a)+dy*Math.cos(a)});
  }
  // identityImpact is the existing positive-damage notification, including parts.
  if(lukeAirship(e)&&signatureInterval(this,'lukeFabricHit',.09)){
   const point=e.stageBossBody?(pos||b):b;
   signatureCue(this,'lukeFabricHit',{x:point.x,y:point.y,a:Math.atan2(b.vy,b.vx),life:.3});
  }
  return r;
 };
 const round=q.applySpecialRound;q.applySpecialRound=function(b,type){const r=round.call(this,b,type);
  if(this.pilot==='luke'&&living(this)&&privateGun(this,b)&&b.fiveAceRound&&['ignite','detonate'].includes(b.fiveAcePhase)&&this.reloadTime<=0&&signatureInterval(this,'lukeBeat',.025))
   signatureCue(this,'lukeBeat',{x:b.x,y:b.y,a:Math.atan2(b.vy,b.vx),life:.11,phase:b.fiveAcePhase});
  return r;
 };
}
export function lukeBurnPoint(burn){
 const e=burn.enemy,body=burn.body,target=burn.target;
 if(!e||!(target?.hp>0)||target.destroyed||target.dead||body?.dead)return null;
 const raw=burn.part&&body?.support129?.parts.get(target.id);
 if(raw)return body.support129.world(raw.nx,raw.ny);
 if(body)return {x:body.x+(burn.part?target.x:0),y:body.y+(burn.part?target.y:0)};
 const local=burnAnchors.get(burn),a=e.a||0;
 if(local)return {x:e.x+local.x*Math.cos(a)-local.y*Math.sin(a),y:e.y+local.x*Math.sin(a)+local.y*Math.cos(a)};
 return {x:e.x,y:e.y};
}
export function lukeBurns(p){
 if(p.pilot!=='luke'||!living(p))return [];
 const out=[];
 for(const burn of p.pilotIdentity?.burns?.values()||[]){
  if(!(burn.time>0))continue;const point=lukeBurnPoint(burn);if(!point||Math.hypot(point.x-p.x,point.y-p.y)>1200)continue;
  const e=burn.enemy,a=(Math.hypot(e.vx||0,e.vy||0)>10?Math.atan2(e.vy,e.vx):e.a||0)+Math.PI;
  out.push({burn,...point,a,age:Math.max(0,3-burn.time),large:lukeAirship(e)});if(out.length===8)break;
 }return out;
}
export function drawLukeFlame(c,x,y,a,height,age,alpha=1){
 const frame=(age*11)%4,index=Math.floor(frame),mix=frame-index;
 let drawn=false;
 c.save();c.translate(x,y);c.rotate(a+Math.PI/2);
 for(const [i,weight]of [[index,1-mix],[(index+1)%4,mix]]){
  const im=fireArt[i];if(!im?.complete||!im.naturalWidth||weight<=0)continue;
  c.save();c.globalAlpha*=alpha*weight;c.drawImage(im,-height/3,-height*.9375,height*2/3,height);c.restore();drawn=true;
 }c.restore();return drawn;
}
export function drawFireDiveWorld(c,p,tex,front=false,shift={x:0,y:0}){
 for(const f of lukeBurns(p)){
  const x=f.x-p.x+shift.x,y=f.y-p.y+shift.y,growth=clamp(f.age/.32),fade=clamp(f.burn.time/.35),size=(f.large?78:54)*(.48+.52*growth),pulse=1+Math.sin(f.age*19)*.06;
  if(front){
   drawLukeFlame(c,x,y,f.a,size*pulse,f.age,.92*fade);
   if(f.large&&growth>.5)drawLukeFlame(c,x-Math.sin(f.a)*13,y+Math.cos(f.a)*13,f.a+.16,size*.65,f.age+.17,.76*fade);
  }else if(growth>.2){const d=17+growth*17;tex(c,'smokeOil',x+Math.cos(f.a)*d,y+Math.sin(f.a)*d,46,20,f.a,.32*fade);}
 }
}
export function mannockWingPose(w,pass=true){
 const age=Math.max(0,w.age||0),vertical=w.pass==='vertical';
 const entry=pass?1-clamp(age/1.45):0,exit=pass?clamp((age-2.5)/1.2):0,beat=w.muzzleFlash>0?Math.sin(clamp(w.muzzleFlash/.09)*Math.PI)*1.8:0;
 // All body/heading changes are local artwork transforms around the real wing.
 const bank=pass?1-.45*entry-.32*exit:1-.10*clamp(w.muzzleFlash/.09);
 return {scale:pass?.93+entry*.18+exit*.09:.78*(w.carrierScale??1),bank,roll:pass?(vertical?1:-1)*(entry*.16-exit*.2):0,kick:beat,height:pass?entry*16+exit*13:0,alpha:pass?clamp(age/.12)*clamp((4.6-age)/.28):1};
}
export function drawMannockWing(c,p,w,x,y,plane,tex,pass=true){
 if(p.pilot!=='mannock'||!living(p)||!(w.ownerId===owner(p)||w.ownerId===undefined&&!p.world)||!pass&&(!(w.life>0)||w.hp<=0)||![x,y,w.a].every(Number.isFinite))return false;
 if(pass&&(!(w.age>=0)||w.age>=4.6))return false;
 const pose=mannockWingPose(w,pass),a=w.a,key=pass?'se5a':w.plane;if(!key)return false;
 c.save();c.globalAlpha*=pose.alpha;
 plane(c,x+12+pose.height*.3,y+18+pose.height,a,key,pose.scale*.96,false,true);
 c.save();c.translate(x-Math.cos(a)*pose.kick,y-Math.sin(a)*pose.kick);c.rotate(a+pose.roll);c.scale(1,pose.bank);plane(c,0,0,0,key,pose.scale,false,false,w.hitFlash||0);c.restore();
 if(w.muzzleFlash>0){const aim=w.fireHeading??w.muzzleAngle??a;
  tex(c,'muzzle',x+Math.cos(aim)*31,y+Math.sin(aim)*31,pass?18:15,8,aim,.92*clamp(w.muzzleFlash/.05));
 }
 c.restore();return true;
}
export function drawFireDiveCue(c,p,e,tex,front=false){
 if(!FIRE_DIVE_PILOTS.has(p.pilot))return false;
 if(!front)return true;
 const q=clamp(e.age/e.maxLife),a=e.a-p.a;
 if(e.kind==='lukeBeat'){
  if(e.phase==='ignite')drawLukeFlame(c,0,0,a,19,e.age*1.5,.85*(1-q));
  else tex(c,'muzzle',4,0,20,9,a,.86*(1-q));
 }else if(e.kind==='lukeFabricHit'){
  // A real fabric-cell puncture. The passive itself does not ignite a target.
  for(const side of [-1,1])tex(c,'debris',-q*9,side*(3+q*9),19-q*8,8-q*3,a+side*q*.8,.82*(1-q));
 }
 return true;
}

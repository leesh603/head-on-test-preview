// World-fixed powder from observed, owned live rocket positions only.
import {signatureState} from './pilot-signature-state.js';
export const GUYNEMER_SMOKE_LIMITS=Object.freeze({life:.38,sample:.06,points:96,rockets:12,maxStep:80});
const L=GUYNEMER_SMOKE_LIMITS,INSTALLED=Symbol.for('headon.guynemer-rocket-smoke.v1'),runtime=new WeakMap();
const owner=p=>p.id??'p1',world=p=>p.combatWorld?.()||p;
const live=p=>p.pilot==='guynemer'&&p.state==='playing'&&p.hp>0&&p.status!=='downed';
const mine=(p,b)=>b?.rocket&&b.special&&!b.enemy&&!b.ally&&!b.formation&&(b.ownerId??'p1')===owner(p)&&b.life>0&&[b.x,b.y,b.vx,b.vy].every(Number.isFinite);
export function resetGuynemerSmoke(p){runtime.delete(p);if(p.pilotSignatureState)delete p.pilotSignatureState.guynemerRocketSmoke;}
export function advanceGuynemerSmoke(p,dt){
 if(p.pilot!=='guynemer')return;
 if(!live(p)){resetGuynemerSmoke(p);return;}
 if(!(dt>0)||!Number.isFinite(dt))return;
 const s=signatureState(p),f=s.guynemerRocketSmoke??={clock:0,points:[]};f.clock+=Math.min(.05,dt);
 let r=runtime.get(p);if(!r||r.state!==f){r={state:f,seen:new WeakMap(),x:p.x,y:p.y};runtime.set(p,r);}
 if(Math.hypot(p.x-r.x,p.y-r.y)>100){f.points.length=0;r.seen=new WeakMap();}r.x=p.x;r.y=p.y;
 f.points=f.points.filter(v=>f.clock-v.at<L.life);
 const bullets=world(p).bullets||[];let count=0;
 for(let i=bullets.length-1;i>=0&&count<L.rockets;i--){const b=bullets[i];if(!mine(p,b)||Math.hypot(b.x-p.x,b.y-p.y)>=850)continue;count++;
  const old=r.seen.get(b);if(!old){r.seen.set(b,{x:b.x,y:b.y,at:f.clock});continue;}
  const d=Math.hypot(b.x-old.x,b.y-old.y);if(d>L.maxStep){r.seen.set(b,{x:b.x,y:b.y,at:f.clock});continue;}
  if(f.clock-old.at<L.sample||d<2)continue;
  // A single sampled smoke fleck, not an extrapolated flight segment.
  f.points.push({x:b.x,y:b.y,a:Math.atan2(b.vy,b.vx),at:f.clock,ownerId:owner(p)});r.seen.set(b,{x:b.x,y:b.y,at:f.clock});
 }
 if(f.points.length>L.points)f.points.splice(0,f.points.length-L.points);
}
export function installGuynemerRocketSmoke(Game){const q=Game.prototype;if(Object.hasOwn(q,INSTALLED))return;Object.defineProperty(q,INSTALLED,{value:true});q.resetGuynemerSmoke=function(){if(this.pilot==='guynemer')resetGuynemerSmoke(this);};const begin=q.beginRevisionFrame;q.beginRevisionFrame=function(dt,input={}){const prior=begin.call(this,dt,input);advanceGuynemerSmoke(this,dt);return prior;};}
export function drawGuynemerRocketSmoke(c,p,tex,shift={x:0,y:0}){
 if(!live(p))return;const f=p.pilotSignatureState?.guynemerRocketSmoke;if(!f)return;
 for(const v of f.points){const age=f.clock-v.at;if(v.ownerId!==owner(p)||age<0||age>=L.life)continue;const q=age/L.life;
  tex(c,'smokeWisp',v.x-p.x+shift.x,v.y-p.y+shift.y,22+q*7,7+q*4,v.a,.54*(1-q)**1.25,'#ddd4c2');
 }
}

// Visual observation of an actual forced-landing transition; never issues damage/rewards.
const states=new WeakMap(),INSTALLED=Symbol.for('headon.frommherz-landing-fx.v1');
export const FROMMHERZ_LANDING_FX_LIMITS=Object.freeze({life:.65,events:6});
const live=p=>p?.pilot==='frommherz'&&p.state==='playing'&&p.hp>0&&p.status!=='downed';
const clock=p=>(p.combatWorld?.()||p.world||p).t||0;
export function resetFrommherzLandingFx(p){states.delete(p);}
export function frommherzLandingEvents(p){
 if(!live(p)){states.delete(p);return [];}
 const s=states.get(p),t=clock(p);if(!s)return [];
 if(t<s.time){states.delete(p);return [];}s.time=t;
 s.events=s.events.filter(e=>t>=e.at&&t-e.at<FROMMHERZ_LANDING_FX_LIMITS.life);
 return s.events.map(e=>({x:e.x,y:e.y,a:e.a,age:t-e.at}));
}
export function cleanFrommherzLandingEvents(events){
 return Array.isArray(events)?events.slice(-FROMMHERZ_LANDING_FX_LIMITS.events).filter(e=>e&&[e.x,e.y,e.a,e.age].every(Number.isFinite)&&Math.abs(e.x)<=1e7&&Math.abs(e.y)<=1e7&&Math.abs(e.a)<=Math.PI*4&&e.age>=0&&e.age<FROMMHERZ_LANDING_FX_LIMITS.life).map(({x,y,a,age})=>({x,y,a,age})):[];
}
export function installFrommherzLandingFx(Game){
 const q=Game.prototype;if(Object.hasOwn(q,INSTALLED))return;Object.defineProperty(q,INSTALLED,{value:true});
 const prior=q.specialRoundImpact;q.specialRoundImpact=function(b,e){
  const before=!!e?.frommherzForcedLanding,result=prior.call(this,b,e);
  if(!before&&e?.frommherzForcedLanding&&live(this)&&(b?.ownerId??'p1')===(this.id??'p1')&&[e.x,e.y,e.a].every(Number.isFinite)){
   frommherzLandingEvents(this);const t=clock(this),s=states.get(this)||{time:t,events:[]};
   s.events.push({x:e.x+Math.cos(e.a)*17,y:e.y+Math.sin(e.a)*17,a:Math.atan2(Math.sin(e.a),Math.cos(e.a)),at:t});
   if(s.events.length>FROMMHERZ_LANDING_FX_LIMITS.events)s.events.shift();states.set(this,s);
  }return result;
 };
 const reset=q.resetNavarreFrommherzCombat;q.resetNavarreFrommherzCombat=function(...args){resetFrommherzLandingFx(this);return reset?.apply(this,args);};
 const begin=q.beginRevisionFrame;q.beginRevisionFrame=function(...args){const r=begin.apply(this,args);if(this.pilot==='frommherz')frommherzLandingEvents(this);return r;};
 const hit=q.hit;q.hit=function(...args){const r=hit.apply(this,args);if(this.pilot==='frommherz'&&!(this.hp>0))resetFrommherzLandingFx(this);return r;};
}
export function drawFrommherzLandingEvents(c,events,{point,fx,tint=null,visible}){
 if(!fx)return;
 const smoke=(...args)=>tint?tint(args[0],args[1],'#d2d0c7',...args.slice(2)):fx(...args);
 for(const e of cleanFrommherzLandingEvents(events)){
  const [x,y]=point(e.x,e.y);if(!visible(x,y,55))continue;
  const q=e.age/FROMMHERZ_LANDING_FX_LIMITS.life,fade=(1-q)**1.3;
  // Two uneven engine coughs disperse at the true cut-out position. No flame,
  // explosion, kill marker, or attached persistent fire on the gliding aircraft.
  const ca=Math.cos(e.a),sa=Math.sin(e.a),d=e.age*25;
  smoke(c,'engineSmoke',x-ca*d,y-sa*d,52+q*16,40+q*14,e.a,fade);
  if(e.age>=.07){const age=e.age-.07;smoke(c,'gunSmoke',x-ca*(8+age*33)-sa*5,y-sa*(8+age*33)+ca*5,42+q*18,23+q*12,e.a+.28,.70*fade);}
 }
}

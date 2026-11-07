// Presentation metadata only. Read existing owned wing rounds; never fire or aim.
const seen=new WeakMap(),flashes=new WeakMap(),INSTALLED=Symbol.for('headon.goering-whiteflight-fx.v1');
const owner=p=>p.id??'p1',world=p=>p.combatWorld?.()||p.world||p;
const live=p=>p.pilot==='goering'&&p.state==='playing'&&p.hp>0&&p.status!=='downed';
const owned=(p,w)=>(w.ownerId??'p1')===owner(p)&&w.life>0&&(w.hp==null||w.hp>0)&&!w.crashing&&!w.crashed&&!w.carrierHidden;
const plain=b=>b?.ally&&!b.enemy&&b.life>0&&!['formation','patrol','rocket','motorCannon','cow37','mauserRound','blast','actualExplosion','identityDot','identityChain','specialAmmo','specialColor','tacticalRound','pierce','wwiIncendiary','telescopeGuided','projectileDoctrine','tacticalStyle','projectileCombo','mannockPass','fonckVolley','fonckSeeker','eagle'].some(k=>b[k])&&[b.x,b.y,b.vx,b.vy].every(Number.isFinite);
export function primeWhiteFlightFx(p){seen.set(p,new WeakSet(world(p).bullets||[]));for(const w of world(p).allies||[])if(owned(p,w))delete w.whiteFlightFxUntil;}
export function observeWhiteFlightFx(p){
 if(p.pilot!=='goering')return;
 if(!live(p)){seen.delete(p);return;}
 let old=seen.get(p);if(!old){primeWhiteFlightFx(p);old=seen.get(p);}
 for(const w of world(p).allies||[])if(owned(p,w)){const previous=flashes.get(w)||0;if((w.muzzleFlash||0)>previous+1e-6)delete w.whiteFlightFxUntil;flashes.set(w,w.muzzleFlash||0);}
 const allies=(world(p).allies||[]).filter(w=>owned(p,w)&&w.muzzleFlash>0&&[w.x,w.y,w.a].every(Number.isFinite));
 for(const b of world(p).bullets||[]){if(old.has(b))continue;old.add(b);
  if(!(p.skillTime>0)||!plain(b)||(b.ownerId??'p1')!==owner(p))continue;
  const a=Math.atan2(b.vy,b.vx),w=allies.find(w=>{const aim=w.fireHeading??w.muzzleAngle??w.a;return Math.abs(Math.atan2(Math.sin(a-aim),Math.cos(a-aim)))<.12&&Math.hypot(b.x-w.x-Math.cos(aim)*23,b.y-w.y-Math.sin(aim)*23)<48;});
  if(!w)continue;
  b.whiteFlightFxOwner=owner(p);w.whiteFlightFxUntil=(world(p).t||0)+Math.min(.07,w.muzzleFlash);
 }
}
export function installWhiteFlightFx(Game){const q=Game.prototype;if(Object.hasOwn(q,INSTALLED))return;Object.defineProperty(q,INSTALLED,{value:true});
 const skill=q.skill;q.skill=function(...args){const used=skill.apply(this,args);if(used&&this.pilot==='goering')primeWhiteFlightFx(this);return used;};
 const update=q.update;q.update=function(...args){const r=update.apply(this,args);observeWhiteFlightFx(this);return r;};
}
export function installWhiteFlightCoopFx(CoopGame){const q=CoopGame.prototype;if(Object.hasOwn(q,INSTALLED))return;Object.defineProperty(q,INSTALLED,{value:true});const update=q.update;q.update=function(...args){const r=update.apply(this,args);for(const p of this.players||[])observeWhiteFlightFx(p);return r;};}
export function whiteFlightRound(b){return plain(b)&&typeof b.whiteFlightFxOwner==='string'&&b.whiteFlightFxOwner===(b.ownerId??'p1');}
export function drawWhiteFlightRound(c,b,x,y,{tint,ready}){
 if(!whiteFlightRound(b)||![x,y].every(Number.isFinite)||!ready('tracerCore'))return false;
 const a=Math.atan2(b.vy,b.vx),length=42;
 // One authored thin tracer replaces the ordinary support tracer, not a second
 // bullet or a line joining aircraft. The projectile head stays at its real x/y.
 tint(c,'tracerCore','#fff1d5',x-Math.cos(a)*length*.5,y-Math.sin(a)*length*.5,length,2.4,a,.98);return true;
}
export function drawWhiteFlightMuzzle(c,p,w,x,y,tex){
 if(!live(p)||!(p.skillTime>0)||!owned(p,w)||!(w.whiteFlightFxUntil>(world(p).t||0))||!(w.muzzleFlash>0))return false;
 const a=w.fireHeading??w.muzzleAngle??w.a,fade=Math.min(1,w.muzzleFlash/.065);
 tex(c,'muzzle',x+Math.cos(a)*31,y+Math.sin(a)*31,34,12,a,.98*fade,'#fff0ce');
 const age=Math.max(0,.09-w.muzzleFlash),side=(w.slot||0)%2?-1:1,ca=Math.cos(w.a),sa=Math.sin(w.a);
 for(let i=0;i<2;i++){const dx=12-age*(50+i*14),dy=side*(10+age*(85+i*20)+i*4);tex(c,'bulletBrass',x+ca*dx-sa*dy,y+sa*dx+ca*dy,6,2.5,w.a+side*(.5+age*14+i),.85*fade,'#dcc398');}
 return true;
}

// Signal and slipstream are drawn from actual activation and wing poses.
const maneuverWakes=new WeakMap();
export function drawWhiteFlightSignal(c,p,tex){
 if(!live(p))return;
 const e=p.pilotSignatureState?.effects?.find(e=>e.kind==='whiteCommand'&&e.ownerId===owner(p)&&e.life>0&&e.age>=0&&e.age<1.05);
 if(!e||![e.x,e.y,e.a].every(Number.isFinite))return;
 const ca=Math.cos(e.a),sa=Math.sin(e.a),age=e.age,fade=Math.min(1,age/.045,e.life/.2);
 const position=t=>{const forward=10+62*(1-Math.exp(-t*3)),port=-16-t*46;return [e.x-p.x+ca*forward-sa*port,e.y-p.y+sa*forward+ca*port];};
 for(let i=5;i>=1;i--){
  const t=age-i*.047;if(t<0)continue;
  const [x,y]=position(t),spread=age-t;
  tex(c,i%2?'mistPuff':'gunSmoke',x-sa*spread*9,y+ca*spread*9,30+spread*42,26+spread*28,e.a-.8,.72*(1-i/7)*fade,'#e3e6dc');
 }
 const [x,y]=position(age);
 tex(c,'armorSpark',x,y,31,28,e.a-.8,.98*fade,'#fff9e7');
 if(age<.2)tex(c,'gunSmoke',e.x-p.x-sa*-14,e.y-p.y+ca*-14,25+age*42,15+age*19,e.a,.35*(1-age/.2),'#d1d4c8');
}
export function drawWhiteFlightManeuver(c,p,wings,tex){
 const signature=p.pilotSignatureState,time=signature?.clock??world(p).t;
 if(!live(p)||!Number.isFinite(time)){maneuverWakes.delete(p);return;}
 let cache=maneuverWakes.get(p);
 if(!cache||cache.signature!==signature||cache.activation!==signature?.activation||time<cache.time||time-cache.time>.25){
  cache={signature,activation:signature?.activation,time,wings:new Map()};maneuverWakes.set(p,cache);
 }
 cache.time=time;
 const active=p.skillTime>0,flight=wings.filter(w=>owned(p,w)&&(w.permanent||w.whiteTemporary)&&!w.aceWingman&&!w.weaponModFormation&&!w.tacticalWing&&!w.orbit&&[w.x,w.y,w.a].every(Number.isFinite)).slice(0,2);
 const present=new Set(flight);
 for(const w of cache.wings.keys())if(!present.has(w))cache.wings.delete(w);
 for(const w of flight){
  let poses=cache.wings.get(w)||[],last=poses.at(-1);
  if(last&&Math.hypot(w.x-last.x,w.y-last.y)>Math.max(40,(time-last.t)*520))poses=[];
  last=poses.at(-1);
  if(active&&(!last||time-last.t>=.04)){
   const ca=Math.cos(w.a),sa=Math.sin(w.a);
   poses.push({t:time,x:w.x,y:w.y,tips:[-1,1].map(side=>({x:w.x-ca*13-sa*side*20,y:w.y-sa*13+ca*side*20}))});
  }
  poses=poses.filter(v=>time-v.t<.65).slice(-16);cache.wings.set(w,poses);
  const wingAlpha=w.alpha??1;
  for(let i=1;i<poses.length;i++)for(let side=0;side<2;side++){
   const from=poses[i-1].tips[side],to=poses[i].tips[side],dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy);
   if(length<.5||length>38)continue;
   const age=time-poses[i].t,fade=(1-age/.65)**1.2,a=Math.atan2(dy,dx),height=19+age*10;
   // Align the painted ribbon within its transparent atlas margin to the tip.
   // The untinted atlas draw retains its length; tinting fits a square cell.
   const margin=height*1.65*.19;
   tex(c,'vaporTrail',(from.x+to.x)/2-p.x+Math.sin(a)*margin,(from.y+to.y)/2-p.y-Math.cos(a)*margin,length+14,height,a,.72*fade*wingAlpha);
  }
 }
}

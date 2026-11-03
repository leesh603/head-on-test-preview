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

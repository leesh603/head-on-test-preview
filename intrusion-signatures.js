// Signature attacks for intrusion bosses (20261113).
//
// Measured on main with a pilot circling and shooting each boss for 30 s, most
// intrusion bosses repeated one attack on one beat: Bastion and the twin
// fortress a single aimed burst every 3.6-3.8 s (1-2 hits), Goliath, Leviathan
// and the Svyatogor the same burst plus the same four-bomb carpet, ships and
// submarines a lone shell splash (0-3 hits). Each boss now also cycles through
// two or three signature attacks on a clock of its own. They reuse the
// existing telegraphs (dashed gun lines, bomb and splash rings) and the
// existing projectiles, so they need no new art: what changes is the shape -
// a fan, a crossfire, a bomb chain walking in, a cross, a ring with one gap, a
// shell straddle - and every one is announced before it can hurt.
// Below half health the clock shortens and each pattern grows by a step.

const finite=(n,d=0)=>Number.isFinite(n)?n:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));

export const INTRUSION_SIGNATURE=Object.freeze({
 first:2.4,interval:5.2,enraged:3.9,enrageAt:.5,retry:.6,
 // Bosses whose own attacks already land often get their signatures less often.
 pace:Object.freeze({'handley-page-v1500':2,goliath:1.5,leviathan:1.4}),
 fan:Object.freeze({rays:Object.freeze([-.26,-.13,0,.13,.26]),reach:.34,rounds:2,enragedRounds:3,warning:1.05,damage:11,speed:300,guns:2}),
 crossfire:Object.freeze({reach:.2,rounds:3,enragedRounds:4,warning:.9,damage:13,speed:320}),
 walk:Object.freeze({count:5,enragedCount:7,first:1.05,step:.2,radius:30,damage:18,beyond:110}),
 cross:Object.freeze({arm:72,warning:1.5,radius:29,damage:18}),
 ring:Object.freeze({slots:9,radius:100,warning:1.9,enragedWarning:1.6,bomb:30,core:36,damage:18}),
 straddle:Object.freeze({spread:58,warning:1.8,radius:34,damage:17}),
 // Shell splashes keep the sea's readable rule: exactly 1.8 s of warning, 17 damage,
 // so a sea salvo lands together; its shape, not its timing, is the pattern.
 splash:Object.freeze({warning:1.8,radius:34,damage:17}),
 curtain:Object.freeze({rays:Object.freeze([-.24,-.12,0,.12,.24]),rounds:2,enragedRounds:3,warning:.95,damage:9,speed:285})
});

// Air turrets are complete artworks with a fixed bearing (+-5-18 degrees), so a
// gun signature is opportunistic: it fires only when the pilot actually sits in
// a battery's lane, and takes priority over the bomb rotation when it does.
// The bomb rotation always has at least two shapes, so a pilot who keeps out of
// the lanes still meets more than one attack. V/1500 and R.II run their own
// gunnery, so their signatures are bomb-only.
const S=(guns,bombs)=>Object.freeze({guns:Object.freeze(guns),bombs:Object.freeze(bombs)});
export const INTRUSION_SIGNATURE_SETS=Object.freeze({
 bastion:S(['crossfire','fan'],['ring','cross']),
 'twin-fortress':S(['crossfire','fan'],['walk','ring']),
 citadel:S(['fan','crossfire'],['cross','walk']),
 goliath:S(['fan'],['walk','ring','cross']),
 leviathan:S(['fan'],['cross','walk','ring']),
 'armed-svyatogor':S(['fan','crossfire'],['walk','cross']),
 'handley-page-v1500':S([],['ring','walk']),
 'linke-hofmann-r-ii':S([],['walk','cross','ring']),
 // At sea the shapes are shell splashes from a live deck gun; only the
 // Dreadnought carries anti-aircraft mounts for a bullet curtain.
 dreadnought:S(['curtain'],['straddle','walk','cross']),
 qship:S([],['straddle','walk']),
 seeadler:S([],['walk','straddle']),
 nachtwal:S([],['straddle','walk']),
 uboat:S([],['straddle','walk']),
 m1:S([],['straddle','walk'])
});

const BOMBS=new Set(['walk','cross','ring']);
const pending=e=>(e.hazards||[]).some(h=>h.signature&&!h.done)||(e.shotCues||[]).some(q=>q.signature&&!q.done);
export const intrusionEnraged=e=>finite(e.maxHp)>0&&finite(e.hp)/e.maxHp<=INTRUSION_SIGNATURE.enrageAt;

function heading(p,api){const v=api.velocity(p),s=Math.hypot(v.vx,v.vy);return s>10?Math.atan2(v.vy,v.vx):finite(p.a,-Math.PI/2);}
// Pilots dodge by turning, so the bombs follow the pilot's current turn rather
// than a straight line (the Citadel already reads its target this way).
function trackTurn(e,p,api,dt){
 const h=heading(p,api),id=p.id??null;
 if(e.signaturePilot!==id||e.signatureHeading==null){e.signaturePilot=id;e.signatureHeading=h;e.signatureTurn=0;return;}
 const rate=clamp(wrap(h-e.signatureHeading)/Math.max(dt,1e-3),-2.2,2.2);
 e.signatureTurn=finite(e.signatureTurn)+(rate-finite(e.signatureTurn))*Math.min(1,dt*6);e.signatureHeading=h;
}
export function signatureLead(p,turn,t,api){
 const v=api.velocity(p),speed=Math.hypot(v.vx,v.vy),h=heading(p,api);
 if(speed<10)return{x:p.x,y:p.y,a:h};
 if(Math.abs(turn)<.05)return{x:p.x+v.vx*t,y:p.y+v.vy*t,a:h};
 return{x:p.x+speed*(Math.sin(h+turn*t)-Math.sin(h))/turn,y:p.y+speed*(Math.cos(h)-Math.cos(h+turn*t))/turn,a:h+turn*t};
}

// One muzzle per live gun, rotated by its current traverse, as queueAttack does.
function mounts(e,api,kind){
 const out=[];
 for(const gun of api.layout(e.profileId).targets){
  if(!gun.muzzle||!api.canFire(e,gun.id))continue;
  if(kind==='aa'&&gun.kind!=='anti_air')continue;
  if(kind==='heavy'&&gun.kind==='anti_air')continue;
  const m=gun.muzzles?.[0]||gun.muzzle,d=finite(e.turretAngles?.[gun.id]),c=Math.cos(d),s=Math.sin(d);
  const muzzle={x:m.pivotX+(m.x-m.pivotX)*c-(m.y-m.pivotY)*s,y:m.pivotY+(m.x-m.pivotX)*s+(m.y-m.pivotY)*c};
  out.push({gun,muzzle,a:m.angle+d,world:api.world(e,muzzle)});
 }
 return out;
}

function gunPattern(g,e,p,api,name){
 const k=name==='crossfire'?INTRUSION_SIGNATURE.crossfire:name==='curtain'?INTRUSION_SIGNATURE.curtain:INTRUSION_SIGNATURE.fan;
 const target=api.local(e,p.x,p.y),enraged=intrusionEnraged(e);
 const reach=name==='curtain'?.5:k.reach;
 const ready=mounts(e,api,name==='curtain'?'aa':null).map(x=>({...x,error:Math.abs(wrap(Math.atan2(target.y-x.muzzle.y,target.x-x.muzzle.x)-x.a))}))
  .filter(x=>x.error<=reach&&api.visible(g,e,x.world)).sort((a,b)=>a.error-b.error);
 const chosen=name==='crossfire'?ready:ready.slice(0,name==='curtain'?1:k.guns);
 let queued=0;
 for(const {gun,muzzle,a,world}of chosen){
  const rays=name==='crossfire'?[0]:k.rays;
  const offsets=rays.filter(o=>api.clear(e,gun.id,muzzle,a+o));
  if(!offsets.length||(name!=='crossfire'&&offsets.length<3))continue;
  e.shotCues.push({...world,localMuzzle:muzzle,localAngle:a,a:a+e.a+Math.PI/2,partId:gun.id,barrelIndex:0,age:0,
   warning:k.warning,damage:k.damage,speed:k.speed,rounds:enraged?k.enragedRounds:k.rounds,
   offsets:name==='crossfire'?undefined:offsets,telegraphLength:name==='crossfire'?220:170,aimMode:'signature',signature:name,done:false});
  queued++;
 }
 // A crossfire is two batteries at once; one lone gun is just the ordinary burst.
 if(name==='crossfire'&&queued<2){e.shotCues=e.shotCues.filter(q=>q.signature!=='crossfire'||q.done);return 0;}
 if(queued)api.commit?.(e);
 return queued;
}

function seaGun(g,e,p,api){
 const sub=api.newSubmarine(e);
 return mounts(e,api,'heavy').filter(x=>api.visible(g,e,x.world)&&(sub||api.clear(e,x.gun.id,x.muzzle,x.a)))
  .sort((a,b)=>Math.hypot(a.world.x-p.x,a.world.y-p.y)-Math.hypot(b.world.x-p.x,b.world.y-p.y))[0]||null;
}
// Air bosses drop bombs; ships lay the same shapes as shell splashes from one gun.
function ordnance(g,e,p,api){
 if(!api.sea(e))return api.canBomb(e)?{kind:'bomb'}:null;
 const gun=seaGun(g,e,p,api);
 return gun&&{kind:'naval-splash',sourcePartId:gun.gun.id,localMuzzle:gun.muzzle,localAngle:gun.a,gun};
}
function bomb(e,x,y,warning,radius,damage,name,o){const {gun,...source}=o;e.hazards.push({...source,x,y,radius,age:0,warning,damage,signature:name,done:false});}

function bombPattern(g,e,p,api,name){
 const o=ordnance(g,e,p,api);if(!o)return 0;
 const enraged=intrusionEnraged(e),turn=finite(e.signatureTurn),lead=t=>signatureLead(p,turn,t,api),points=[];
 if(name==='walk'){
  // A chain that starts toward the boss and walks onto the pilot's track.
  const k=INTRUSION_SIGNATURE.walk,n=enraged?k.enragedCount:k.count,last=k.first+(n-1)*k.step;
  const end=lead(last),dx=end.x-e.x,dy=end.y-e.y,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d,span=Math.min(d*.7,(n-1)*68);
  for(let i=0;i<n;i++){const t=(i-(n-1))/(n-1);points.push({x:end.x+ux*t*span,y:end.y+uy*t*span,w:k.first+i*k.step,r:k.radius,dmg:k.damage});}
  const over=lead(last+k.step);points.push({x:over.x+ux*k.beyond*.5,y:over.y+uy*k.beyond*.5,w:last+k.step,r:k.radius,dmg:k.damage});
 }else if(name==='cross'){
  const k=INTRUSION_SIGNATURE.cross,c=lead(k.warning),fx=Math.cos(c.a),fy=Math.sin(c.a),lx=-fy,ly=fx;
  const arms=[[0,0],[1,0],[-1,0],[0,1],[0,-1]];if(enraged)arms.push([2,0],[-2,0],[0,2],[0,-2]);
  for(const [f,l]of arms)points.push({x:c.x+(fx*f+lx*l)*k.arm,y:c.y+(fy*f+ly*l)*k.arm,w:k.warning+(Math.abs(f)+Math.abs(l)>1?.25:0),r:k.radius,dmg:k.damage});
 }else if(name==='ring'){
  // Boxed in where the pilot will be: a wall all round and a bomb in the
  // middle, with one opening off a wing. Holding course is a hit; the pilot
  // has to bank through the gap before it lands.
  const k=INTRUSION_SIGNATURE.ring,w=enraged?k.enragedWarning:k.warning,c=lead(w),side=finite(e.signatureSerial)%2?1:-1,gap=c.a+side*Math.PI/2,step=Math.PI*2/k.slots;
  for(let i=1;i<k.slots;i++){const a=gap+i*step;points.push({x:c.x+Math.cos(a)*k.radius,y:c.y+Math.sin(a)*k.radius,w,r:k.bomb,dmg:k.damage});}
  points.push({x:c.x,y:c.y,w,r:k.core,dmg:k.damage});
 }
 const shown=points.filter(q=>api.visible(g,e,q));
 if(shown.length<Math.ceil(points.length*.6))return 0;
 const sea=o.kind==='naval-splash',k=INTRUSION_SIGNATURE.splash;
 for(const q of shown)bomb(e,q.x,q.y,sea?k.warning:q.w,sea?k.radius:q.r,sea?k.damage:q.dmg,name,o);
 if(sea)api.muzzle?.(g,{x:o.gun.world.x,y:o.gun.world.y,angle:o.gun.a+e.a+Math.PI/2,scale:.9,heavy:true});
 return shown.length;
}

function straddle(g,e,p,api){
 const k=INTRUSION_SIGNATURE.straddle,h=heading(p,api),lx=-Math.sin(h),ly=Math.cos(h);
 const gun=seaGun(g,e,p,api);if(!gun)return 0;
 const c=signatureLead(p,finite(e.signatureTurn),k.warning,api);if(!api.visible(g,e,c))return 0;
 const enraged=intrusionEnraged(e),lanes=enraged?[-1,0,1,-2,2]:[-1,0,1];let n=0;
 lanes.forEach((l,i)=>{const q={x:c.x+lx*l*k.spread,y:c.y+ly*l*k.spread};if(!api.visible(g,e,q))return;
  e.hazards.push({kind:'naval-splash',...q,radius:k.radius,age:0,warning:k.warning,damage:k.damage,sourcePartId:gun.gun.id,localMuzzle:gun.muzzle,localAngle:gun.a,signature:'straddle',done:false});n++;});
 if(n)api.muzzle?.(g,{x:gun.world.x,y:gun.world.y,angle:gun.a+e.a+Math.PI/2,scale:.9,heavy:true});
 return n;
}

function attempt(g,e,p,api,name){
 if(BOMBS.has(name))return bombPattern(g,e,p,api,name);
 if(name==='straddle')return straddle(g,e,p,api);
 return gunPattern(g,e,p,api,name);
}

/** Advance the signature clock; returns the pattern that was launched, if any. */
export function stepIntrusionSignature(g,e,dt,api){
 const set=INTRUSION_SIGNATURE_SETS[e?.profileId];
 if(!set||e.phase!=='active'||!(dt>0)||!api.ready(e))return null;
 e.hazards||=[];e.shotCues||=[];
 const ps=api.alive(g);if(!ps.length)return null;
 const p=ps[finite(e.signatureSerial)%ps.length];
 trackTurn(e,p,api,dt);
 if(e.signatureClock==null)e.signatureClock=INTRUSION_SIGNATURE.first;
 e.signatureClock-=dt;
 if(e.signatureClock>0)return null;
 if(pending(e)){e.signatureClock=INTRUSION_SIGNATURE.retry;return null;}
 // A battery that bears takes the turn, but never twice running.
 const order=[...set.guns.filter(n=>n!==e.lastSignature)];
 const start=finite(e.signatureIndex)%Math.max(1,set.bombs.length);
 for(let i=0;i<set.bombs.length;i++)order.push(set.bombs[(start+i)%set.bombs.length]);
 for(const name of order){
  if(!(attempt(g,e,p,api,name)>0))continue;
  if(set.bombs.includes(name))e.signatureIndex=(set.bombs.indexOf(name)+1)%set.bombs.length;
  e.signatureSerial=finite(e.signatureSerial)+1;e.lastSignature=name;
  e.signatureClock=(intrusionEnraged(e)?INTRUSION_SIGNATURE.enraged:INTRUSION_SIGNATURE.interval)*finite(INTRUSION_SIGNATURE.pace[e.profileId],1);
  return name;
 }
 e.signatureClock=INTRUSION_SIGNATURE.retry;
 return null;
}

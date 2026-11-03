// The existing three-second kill chain is simulation-owned; no permanent stats change.
export const MOMENTUM_WINDOW=3;
export const MOMENTUM_TIERS=Object.freeze([
 Object.freeze({min:0,speed:1,damage:1,aggro:0,trail:0}),
 Object.freeze({min:3,speed:1.05,damage:1,aggro:.15,trail:1}),
 Object.freeze({min:6,speed:1.08,damage:1.05,aggro:.30,trail:2}),
 Object.freeze({min:10,speed:1.10,damage:1.10,aggro:.50,trail:3}),
 Object.freeze({min:15,speed:1.10,damage:1.10,aggro:.50,trail:3})
]);
export const momentumTime=p=>p?.world?.t??p?.t??0;
export function momentumCount(p){
 if(!p||p.hp<=0||p.status==='downed')return 0;
 const age=momentumTime(p)-(p.momentumAt??-Infinity);
 return age>=0&&age<MOMENTUM_WINDOW?(p.momentumStreak||0):0;
}
export function momentumTier(p){const n=momentumCount(p);return MOMENTUM_TIERS[n>=15?4:n>=10?3:n>=6?2:n>=3?1:0];}
export function recordMomentumKill(p,e){
 p.momentumStreak=momentumCount(p)+1;p.momentumAt=momentumTime(p);
 p.momentumBest=Math.max(p.momentumBest||0,p.momentumStreak);
 if((p.killMarks??=[]).length<24)p.killMarks.push({x:e.x,y:e.y,priority:!!(e.bossPilot||['boss','zeppelin','bomber'].includes(e.type)),streak:p.momentumStreak});
}
export function momentumDamage(world,shot){
 if(shot?.enemy||shot?.patrol)return 1;
 const owner=world.players?world.players.find(p=>p.id===shot?.ownerId):world;
 return momentumTier(owner).damage;
}
// Reuse the Director's chosen contact. Only nearby ordinary aircraft reconsider it;
// ghosts, decoys, concealment and scripted/front objectives retain their priority.
export function momentumCombatTarget(world,e,contact){
 if(!contact||contact.fogHidden||e.bossPilot||!['scout','hunter'].includes(e.type)||e.fieldUnit||e.stageBossBody||e.bossMinion||e.missionGround||e.ruralFront)return contact;
 const players=world.players||[world],patrols=world.patrols||[];
 if(!players.includes(contact)&&!patrols.includes(contact))return contact;
 const candidates=players.filter(p=>p.hp>0&&p.status!=='downed'&&!(p.ballCloak>0)&&!(p.kaiserFogTime>0)&&!(p.cloudConceal>0)&&Math.hypot(p.x-e.x,p.y-e.y)<680);
 if(!candidates.some(p=>momentumTier(p).aggro>0))return contact;
 const now=world.t||0;
 if(e.momentumTargetUntil>now){const held=e.momentumTargetId==='solo'?world:candidates.find(p=>p.id===e.momentumTargetId);return held&&candidates.includes(held)?held:contact;}
 const focus=p=>momentumCount(p)>=15&&(e.elite||e.formationLeader||e.directorRole==='leader'||e.isFormationCommander);
 const weight=p=>1+momentumTier(p).aggro*(focus(p)?1.4:1);
 let target=contact;
 if(patrols.includes(contact)){
  // A +50% priority weight diverts at most one third of patrol contacts.
  const best=candidates.reduce((a,p)=>!a||weight(p)>weight(a)?p:a,null);
  if(best&&(world.rng?.()??1)<1-1/weight(best))target=best;
 }else{
  let score=((contact.x-e.x)**2+(contact.y-e.y)**2)/weight(contact);
  for(const p of candidates){const s=((p.x-e.x)**2+(p.y-e.y)**2)/weight(p);if(s<score){score=s;target=p;}}
 }
 e.momentumTargetId=target===world?'solo':players.includes(target)?target.id:null;e.momentumTargetUntil=now+(focus(target)?.55:1.1);
 return target;
}

// Renderer-local, bounded history: never serialized into online snapshots.
const trails=new WeakMap();
export const MOMENTUM_TRAIL_LIMIT=32;
export function drawMomentumTrail(c,p,x,y,{scale=1,roll=0,bank=1}={}){
 const now=momentumTime(p),tier=momentumTier(p);
 // A brief confirmation on each kill, using the existing curved wingtip wake.
 // Simulation time keeps the accent still while paused and consistent in co-op.
 const killAge=now-(p.momentumAt??-Infinity);
 const pulse=tier.trail&&killAge>=0?Math.max(0,1-killAge/.42)**2:0;
 let h=trails.get(p);
 if(!h){h={t:now,x:p.x,y:p.y,sampleAt:now,strength:0,points:[]};trails.set(p,h);return;}
 const dt=now-h.t,travel=Math.hypot(p.x-h.x,p.y-h.y);
 if(dt<0||travel>150){h.points.length=0;h.strength=0;}
 if(dt>0){
  const speed=travel/dt,ratio=Math.min(1.6,speed/Math.max(1,p.baseSpeed||p.speed||140));
  // Missing optional parachute state is normal on unmodified aircraft.
  const intensity=tier.trail&&!(p.heineckeEscape>0)?Math.min(1,ratio)*tier.trail/3:0;
  h.strength+=(intensity-h.strength)*Math.min(1,dt*9);
  h.life=([0,.34,.59,.94][tier.trail]||h.life||.3)*Math.max(.3,Math.min(1.2,ratio));
  if(now-h.sampleAt>=.025&&speed>12&&h.strength>.015){
   const a=p.a+roll,ca=Math.cos(a),sa=Math.sin(a),forward=-18*scale,side=27*scale*bank;
   h.points.push({t:now,x:p.x,y:p.y,strength:h.strength,left:{x:p.x+ca*forward-sa*side,y:p.y+sa*forward+ca*side},right:{x:p.x+ca*forward+sa*side,y:p.y+sa*forward-ca*side}});h.sampleAt=now;
  }
  h.points=h.points.filter(q=>now-q.t<(h.life||.3)&&Math.hypot(q.x-p.x,q.y-p.y)<210).slice(-MOMENTUM_TRAIL_LIMIT);
  h.t=now;h.x=p.x;h.y=p.y;
 }
 if(h.points.length<2||h.strength<.008)return;
 c.save();c.lineCap='round';c.lineJoin='round';
 const points=h.points;
 for(const side of ['left','right'])for(let i=1;i<points.length;i++){
  const prev=points[i-1][side],q=points[i][side],next=points[i+1]?.[side]||q;
  const fade=Math.max(0,1-(now-points[i].t)/(h.life||.3)),alpha=fade*fade*Math.min(h.strength,points[i].strength);
  const sx=i===1?prev.x:(prev.x+q.x)/2,sy=i===1?prev.y:(prev.y+q.y)/2,ex=i===points.length-1?q.x:(q.x+next.x)/2,ey=i===points.length-1?q.y:(q.y+next.y)/2;
  c.beginPath();c.moveTo(x+sx-p.x,y+sy-p.y);c.quadraticCurveTo(x+q.x-p.x,y+q.y-p.y,x+ex-p.x,y+ey-p.y);
  c.globalAlpha=alpha*(.21+pulse*.10);c.strokeStyle=tier.trail>=3?'#b6a477':'#62716f';c.lineWidth=(.7+1.6*fade)+1.35+pulse*1.4;c.stroke();
  c.globalAlpha=Math.min(1,alpha*(.88+pulse*.12));c.strokeStyle=tier.trail>=3?'#fff0cb':'#f0f2ed';c.lineWidth=.55+1.7*fade+pulse*.75;c.stroke();
 }
 c.restore();
}

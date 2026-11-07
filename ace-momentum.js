// The existing three-second kill chain is simulation-owned; no permanent stats change.
export const MOMENTUM_WINDOW=3;
export const MOMENTUM_TIERS=Object.freeze([
 Object.freeze({min:0,speed:1,damage:1,aggro:0,trail:0}),
 Object.freeze({min:3,speed:1.05,damage:1,aggro:.15,trail:1}),
 Object.freeze({min:6,speed:1.08,damage:1.05,aggro:.30,trail:2}),
 Object.freeze({min:10,speed:1.10,damage:1.10,aggro:.50,trail:3}),
 Object.freeze({min:15,speed:1.10,damage:1.10,aggro:.50,trail:4})
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
const TRAIL_STYLES=[
 null,
 {life:.28,width:9,opacity:.53},
 {life:.48,width:15,opacity:.65},
 {life:.72,width:23,opacity:.79},
 {life:1.04,width:34,opacity:.94}
];

const NEUTRAL_TRAIL_PALETTE=Object.freeze({ink:'#85958b',light:'#d6ded8'});

export function trailPaletteFromPixels(pixels){
 const bins=new Map();
 for(let i=0;i<pixels.length;i+=4){
  const r=pixels[i],g=pixels[i+1],b=pixels[i+2];
  const high=Math.max(r,g,b),low=Math.min(r,g,b);
  if(pixels[i+3]<200||high<24)continue;
  const key=(r>>5)*64+(g>>5)*8+(b>>5);
  let bin=bins.get(key);
  if(!bin){bin={r:0,g:0,b:0,weight:0};bins.set(key,bin);}
  const weight=1+(high-low)/256;
  bin.r+=r*weight;
  bin.g+=g*weight;
  bin.b+=b*weight;
  bin.weight+=weight;
 }
 let dominant=null;
 for(const bin of bins.values())if(!dominant||bin.weight>dominant.weight)dominant=bin;
 if(!dominant)return NEUTRAL_TRAIL_PALETTE;
 const rgb=[dominant.r,dominant.g,dominant.b].map(value=>value/dominant.weight);
 const shade=(target,amount)=>'#'+rgb.map(value=>Math.round(value+(target-value)*amount).toString(16).padStart(2,'0')).join('');
 return {ink:shade(128,.13),light:shade(240,.48)};
}

function paintRibbon(c,points,color,halfWidth){
 const last=points.length-1;
 c.beginPath();
 for(const side of [1,-1]){
  let prevX,prevY;
  for(let i=0;i<=last;i++){
   const q=points[side===1?i:last-i];
   const x=q.drawX+q.nx*q.fade*halfWidth*side,y=q.drawY+q.ny*q.fade*halfWidth*side;
   if(i===0){
    if(side===1)c.moveTo(x,y);
    else c.quadraticCurveTo(q.drawX+q.ny*halfWidth*.48,q.drawY-q.nx*halfWidth*.48,x,y);
   }else c.quadraticCurveTo(prevX,prevY,(prevX+x)/2,(prevY+y)/2);
   prevX=x;
   prevY=y;
  }
  c.lineTo(prevX,prevY);
 }
 c.closePath();
 c.fillStyle=color;
 c.fill();
}

export function drawMomentumTrail(c,p,x,y,{scale=1,roll=0,bank=1,palette}={}){
 if(p.hp<=0||p.status==='downed'||p.heineckeEscape>0){trails.delete(p);return;}
 const now=momentumTime(p),style=TRAIL_STYLES[momentumTier(p).trail];
 let history=trails.get(p);
 if(!history){
  if(style)trails.set(p,{t:now,x:p.x,y:p.y,sampleAt:now,points:[]});
  return;
 }

 const dt=now-history.t,travel=Math.hypot(p.x-history.x,p.y-history.y);
 const points=history.points;
 if(dt<0||dt>.25||travel>150){
  points.length=0;
  history.sampleAt=now;
 }else if(dt>0&&style&&travel>12*dt&&now-history.sampleAt>=.027){
  const angle=p.a+roll,ca=Math.cos(angle),sa=Math.sin(angle);
  // Sample aft of the fuselage and keep the aircraft's bank in the trail.
  const rear=18*scale,normalScale=Math.max(.45,Math.abs(bank));
  points.push({t:now,x:p.x-ca*rear,y:p.y-sa*rear,nx:-sa*normalScale,ny:ca*normalScale});
  history.sampleAt=now;
 }
 history.t=now;
 history.x=p.x;
 history.y=p.y;
 if(style){history.style=style;history.palette=palette||NEUTRAL_TRAIL_PALETTE;}
 const paint=history.style;
 if(!paint)return;
 while(points.length&&(points.length>MOMENTUM_TRAIL_LIMIT||now-points[0].t>=paint.life))points.shift();
 if(points.length<2){
  if(!style)trails.delete(p);
  return;
 }

 const tail=points[0],head=points.at(-1);
 const offsetX=x-p.x,offsetY=y-p.y;
 for(const q of points){
  q.drawX=q.x+offsetX;
  q.drawY=q.y+offsetY;
  q.fade=(1-(now-q.t)/paint.life)**1.35;
 }
 const {ink,light:highlight}=history.palette;
 const pulse=style?Math.max(0,1-(now-p.momentumAt)/.24)**2:0;
 const widthScale=Math.min(1.35,Math.max(.65,scale));
 const halfWidth=paint.width*widthScale*(1+.16*pulse)/2;
 const gradient=c.createLinearGradient(tail.drawX,tail.drawY,head.drawX,head.drawY);
 gradient.addColorStop(0,ink+'00');
 gradient.addColorStop(.38,ink+'56');
 gradient.addColorStop(1,ink);
 const light=c.createLinearGradient(tail.drawX,tail.drawY,head.drawX,head.drawY);
 light.addColorStop(0,highlight+'00');
 light.addColorStop(.65,highlight+'24');
 light.addColorStop(1,highlight+'95');
 c.save();
 c.globalAlpha*=(paint.opacity*head.fade);
 paintRibbon(c,points,gradient,halfWidth);
 c.globalAlpha*=.66+.2*pulse;
 paintRibbon(c,points,light,halfWidth*.36);
 c.restore();
}

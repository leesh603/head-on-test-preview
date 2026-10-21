// Player-local pilot signature cues. No combat statistics are changed here.
// Missing artwork is omitted, never replaced by a polygon, emoji or text glyph.
export const SIGNATURE_LIMITS=Object.freeze({effects:32,maxDt:.05,maxLife:2.4});
export const PILOT_SIGNATURES=Object.freeze({
 sachsenberg:{start:'metalClimb',sustain:'balticDive',symbol:null,reaction:null},
 schleich:{start:'metalAdvance',sustain:'blackAdvanceRun',symbol:null,reaction:null},
 lothar:{start:'lotharAttack',sustain:'relentlessFire',symbol:null,reaction:null},
 baron:{start:'redHunt',sustain:'pursuit',symbol:'redBaron',reaction:'hunt'},
 fonck:{start:'sightConverge',sustain:'precision',symbol:null,reaction:null},
 voss:{start:'sixDirections',sustain:'decoy',symbol:'vossCowling',reaction:null},
 boelcke:{start:'pincerOrder',sustain:'pincer',symbol:null,reaction:'rearAttack'},
 udet:{start:'counterRoll',sustain:'roll',symbol:null,reaction:null},
 goering:{start:'whiteCommand',sustain:'convergence',symbol:null,reaction:'commandHit'},
 immelmann:{start:'halfLoop',sustain:'reversal',symbol:null,reaction:'reverseShot'},
 huffzky:{start:'attackRun',sustain:'bombRun',symbol:null,reaction:'rearShot'},
 berthold:{start:'wingedSword',sustain:'defiance',symbol:'wingedSword',reaction:'wound'},
 loewenhardt:{start:'climbingAttack',sustain:'climb',symbol:null,reaction:'climbSalvo'},
 jacobs:{start:'blackDevil',sustain:'tightTurn',symbol:'blackDevil',reaction:'turnShot'},
 gontermann:{start:'fuseIgnition',sustain:'fuse',symbol:null,reaction:'fuseHit'},
 brumowski:{start:'skullGuard',sustain:'guard',symbol:'skull',reaction:'intercept'},
 collishaw:{start:'blackFlight',sustain:'splitFlight',symbol:null,reaction:'crossfire'},
 guynemer:{start:'rocketSalvo',sustain:'rocketFlight',symbol:null,reaction:'cannonShot'},
 bishop:{start:'closeAttack',sustain:'closeFire',symbol:null,reaction:'closeHit'},
 mannock:{start:'coverOrder',sustain:'cover',symbol:null,reaction:'rescueShot'},
 mckeever:{start:'gunnerHandoff',sustain:'twoSeater',symbol:null,reaction:'handoff'},
 hawker:{start:'steadySight',sustain:'gunPlatform',symbol:null,reaction:'aimedShot'},
 nungesser:{start:'deathKnight',sustain:'deathPass',symbol:'blackHeart',reaction:null},
 rickenbacker:{start:'ringPass',sustain:'ringFlight',symbol:'ring94',reaction:'targetSwitch'},
 ball:{start:'cloudAmbush',sustain:'concealment',symbol:null,reaction:'ambushShot'},
 barker:{start:'lastStand',sustain:'survival',symbol:null,reaction:'escape'},
 luke:{start:'incendiaryRun',sustain:'flameAttack',symbol:null,reaction:'burnKill'},
 baracca:{start:'cavalryCharge',sustain:'charge',symbol:null,reaction:'cavalryGuard'},
 wolff:{start:'petalDive',sustain:'petals',symbol:'flower',reaction:'petalKill'},
 mccudden:{start:'fieldRepair',sustain:'maintenance',symbol:null,reaction:'repair'}
});
for(const value of Object.values(PILOT_SIGNATURES))Object.freeze(value);
const finite=Number.isFinite;
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const alive=p=>p&&p.hp>0&&p.status!=='downed'&&p.state==='playing';
const owner=p=>p.id??'p1';
export function signatureState(p){
 if(!p)throw new TypeError('A pilot instance is required');
 let s=p.pilotSignatureState;
 if(!s||s.pilot!==p.pilot||s.owner!==owner(p)){
  s={pilot:p.pilot,owner:owner(p),clock:0,effects:[],timers:{},previous:{},activation:0,activationTime:-Infinity,activationHeading:p.a||0,activationPoint:{x:p.x||0,y:p.y||0}};
  p.pilotSignatureState=s;
 }
 return s;
}
export function resetPilotSignature(p){delete p.pilotSignatureState;return signatureState(p)}
export function signatureCue(p,kind,{x=p.x,y=p.y,a=p.a||0,life=.6,size=1,...data}={}){
 if(!PILOT_SIGNATURES[p.pilot]||![x,y,a,life,size].every(finite)||life<=0)return null;
 const s=signatureState(p),duration=Math.min(SIGNATURE_LIMITS.maxLife,life);
 const fx={kind,x,y,a,life:duration,maxLife:duration,size,age:0,...data,ownerId:owner(p)};
 if(s.effects.length>=SIGNATURE_LIMITS.effects){const i=s.effects.findIndex(e=>e.kind===kind&&!e.signatureStart);s.effects.splice(i<0?0:i,1)}
 s.effects.push(fx);return fx;
}
export function signatureInterval(p,key,interval){const s=signatureState(p);if(s.clock-(s.timers[key]??-Infinity)<interval)return false;s.timers[key]=s.clock;return true}
export function activatePilotSignature(p){
 if(!alive(p))return false;const profile=PILOT_SIGNATURES[p.pilot];if(!profile)return false;
 const s=signatureState(p);if(s.clock===s.activationTime&&s.previous.skillTime===p.skillTime)return false;
 s.activation++;s.activationTime=s.clock;s.activationHeading=p.a||0;s.activationPoint={x:p.x,y:p.y};s.previous.skillTime=p.skillTime;
 signatureCue(p,profile.start,{life:p.pilot==='rickenbacker'?1.65:1.05,symbol:profile.symbol,signatureStart:true,activation:s.activation});return true;
}
export function advancePilotSignature(p,dt){
 const s=signatureState(p);if(!finite(dt)||dt<=0||!alive(p))return s;
 const step=Math.min(SIGNATURE_LIMITS.maxDt,dt),before=s.previous;s.clock+=step;
 let kept=0;for(const e of s.effects){e.age+=step;e.life=Math.max(0,e.life-step);if(e.kind==='incendiaryImpact'&&e.target){e.x=e.target.x;e.y=e.target.y;if(e.target.hp<=0){e.kind='burnKill';e.age=0;e.life=e.maxLife=.6;delete e.target}}if(e.life>0)s.effects[kept++]=e}s.effects.length=kept;
 const profile=PILOT_SIGNATURES[p.pilot];if(!profile)return s;
 if(p.pilot==='nungesser'&&before.skillTime>0&&!(p.skillTime>0))signatureCue(p,'deathKnightEnd',{life:.55,signatureStart:true});
 if(p.skillTime>0&&(!(before.skillTime>0)||(p.pilot!=='lothar'&&p.skillTime>before.skillTime+.1)))activatePilotSignature(p);
 const turn=wrap((p.a||0)-(before.a??p.a??0))/step,identity=p.pilotIdentity||{};
 if(p.pilot==='wolff'&&(p.wolffStacks||0)>(before.petals||0))signatureCue(p,'petalScatter',{life:1.2,count:Math.min(7,3+(p.wolffStacks||0))});
 if(p.pilot==='baron'&&p.huntBoost>0&&!(before.huntBoost>0))signatureCue(p,'huntConfirmation',{life:.65,symbol:'redBaron'});
 if(p.pilot==='barker'&&identity.escape&&!before.escape)signatureCue(p,'survivalBreak',{life:1.3});
 if(p.pilot==='ball'&&p.ballAmbush>0&&!(before.ambush>0))signatureCue(p,'ambushBreak',{life:.8});
 Object.assign(before,{a:p.a,skillTime:p.skillTime,petals:p.wolffStacks,huntBoost:p.huntBoost,escape:!!identity.escape,ambush:p.ballAmbush,hp:p.hp});
 s.turnRate=turn;s.activeAge=s.clock-s.activationTime;return s;
}
export function pilotSignatureReaction(p,event,{target,position,gun=0,damage=0}={}){
 if(!alive(p))return null;const profile=PILOT_SIGNATURES[p.pilot];if(!profile)return null;
 if(event==='damage'&&p.pilot==='berthold'&&damage>0&&signatureInterval(p,'damage',.14))return signatureCue(p,profile.reaction,{life:.65,damage,symbol:profile.symbol});
 if(event==='shot'&&['lothar','sachsenberg','schleich','ball','barker','udet','loewenhardt','fonck'].includes(p.pilot))return null;
 if(event==='shot'&&signatureInterval(p,gun===1?'rearShot':'shot',.12))return signatureCue(p,'shotAccent',{life:.18,gun,style:profile.sustain,active:p.skillTime>0});
 if(event==='hit'&&p.pilot==='nungesser')return null;
 if(event==='hit'&&profile.reaction&&target&&signatureInterval(p,'hit',.15)){const pos=position||target;return signatureCue(p,profile.reaction,{x:pos.x,y:pos.y,life:.45,active:p.skillTime>0})}
 return null;
}

// Compatibility exports remain for old render callers; low-health aim RNG is retired.
export function nungesserSmokeStage(){return 0;}
export function nungesserAimOffset(){return 0;}
export const NUNGESSER_BALANCE=Object.freeze({grazeOuter:36,grazeMargin:5,readySeconds:2,rearmSeconds:1,counterAngle:.11,counterDamage:.75,entryGrace:.5,interceptRadius:9,maxShots:64});
export function nungesserState(p){
 const s=signatureState(p);
 const n=s.nungesser??={readyUntil:0,rearmAt:0,step:.04};
 // Projectile references are local runtime caches, never co-op snapshot payload.
 if(!Object.hasOwn(n,'shots'))Object.defineProperty(n,'shots',{value:[],writable:true});
 if(!Object.hasOwn(n,'pool'))Object.defineProperty(n,'pool',{value:null,writable:true});
 return n;
}
export function nungesserInterception(p,b,x0,y0){
 if(p?.pilot!=='nungesser'||!alive(p)||!(p.skillTime>0)||!b.enemy||!(b.life>0)||!(b.damage>0)||b.blast||b.actualExplosion||b.rocket||b.mine)return null;
 const n=nungesserState(p),dx=b.x-x0,dy=b.y-y0;let first=Infinity;
 if(n.pool!==(p.combatWorld?.()||p).bullets)return null;
 // Only this owner's real, live MG projectiles cut a narrow path through gunfire.
 for(const shot of n.shots){
  const f=shot.round;if(!(f.life>0))continue;
  const rx=x0-shot.x,ry=y0-shot.y,vx=dx-f.vx*n.step,vy=dy-f.vy*n.step;
  const radius=NUNGESSER_BALANCE.interceptRadius,c=rx*rx+ry*ry-radius*radius,length=vx*vx+vy*vy;
  let t=0;if(c>0){if(!length)continue;const dot=rx*vx+ry*vy,disc=dot*dot-length*c;if(disc<0)continue;t=(-dot-Math.sqrt(disc))/length;if(t<0||t>1)continue;}
  first=Math.min(first,t);
 }
 return first<Infinity?first:null;
}
export function consumeNungesserInterception(p,b,x0,y0,t){
 b.life=0;
 if(signatureInterval(p,'nungesserIntercept',.045))signatureCue(p,'nungesserIntercept',{x:x0+(b.x-x0)*t,y:y0+(b.y-y0)*t,a:Math.atan2(b.vy,b.vx),life:.24});
}
export function nungesserRoundReaction(p,b,x0,y0,maxTime=1){
 if(p?.pilot!=='nungesser'||!alive(p)||!b.enemy||!(b.life>0)||!(b.damage>0))return false;
 const s=signatureState(p),n=nungesserState(p),clip=Math.max(0,Math.min(1,maxTime)),dx=(b.x-x0)*clip,dy=(b.y-y0)*clip;
 // A direct hit is never a graze, including the wider flak collision radius.
 if(p.invuln>0||p.evadeTime>0||b.blast||b.actualExplosion||b.rocket||b.mine)return false;
 const pad=b.flak?6:0,fit=p.bomberTransfer,ca=Math.cos(p.a),sa=Math.sin(p.a),l=fit?fit.hullLength+pad:10+pad,w=fit?fit.hullWidth+pad:10+pad;
 // Measure the same hull ellipse as bomberRoundImpact, including transfer fits.
 const ox=x0-p.x,oy=y0-p.y,u=(ox*ca+oy*sa)/l,v=(-ox*sa+oy*ca)/w,du=(dx*ca+dy*sa)/l,dv=(-dx*sa+dy*ca)/w;
 const q=Math.max(0,Math.min(1,-(u*du+v*dv)/(du*du+dv*dv||1)));
 const x=x0+dx*q,y=y0+dy*q,d=Math.hypot(x-p.x,y-p.y),angle=Math.atan2(y-p.y,x-p.x)-p.a,radius=1/Math.hypot(Math.cos(angle)/l,Math.sin(angle)/w),id=owner(p);
 if(d<=radius+NUNGESSER_BALANCE.grazeMargin||d>radius+NUNGESSER_BALANCE.grazeOuter-10||b.nungesserGrazeOwners?.has(id))return false;
 (b.nungesserGrazeOwners??=new Set()).add(id);
 if(s.clock<n.rearmAt||s.clock<n.readyUntil)return false;
 n.readyUntil=s.clock+NUNGESSER_BALANCE.readySeconds;n.rearmAt=s.clock+NUNGESSER_BALANCE.rearmSeconds;
 signatureCue(p,'nungesserReprisal',{x,y,a:Math.atan2(b.vy,b.vx),life:.42});
 return false;
}

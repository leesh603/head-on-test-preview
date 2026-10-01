// Player-local pilot signature cues. No combat statistics are changed here.
// Missing artwork is omitted, never replaced by a polygon, emoji or text glyph.
export const SIGNATURE_LIMITS=Object.freeze({effects:32,maxDt:.05,maxLife:2.4});
export const PILOT_SIGNATURES=Object.freeze({
 baron:{start:'redHunt',sustain:'pursuit',symbol:'redBaron',reaction:'hunt'},
 fonck:{start:'sightConverge',sustain:'precision',symbol:'cigogne',reaction:'precisionHit'},
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
 nungesser:{start:'blackHeart',sustain:'defyDeath',symbol:'blackHeart',reaction:'defiantHit'},
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
 s.effects=s.effects.filter(e=>{e.age+=step;e.life=Math.max(0,e.life-step);if(e.kind==='incendiaryImpact'&&e.target){e.x=e.target.x;e.y=e.target.y;if(e.target.hp<=0){e.kind='burnKill';e.age=0;e.life=e.maxLife=.6;delete e.target}}return e.life>0});
 const profile=PILOT_SIGNATURES[p.pilot];if(!profile)return s;
 if(p.skillTime>0&&(!(before.skillTime>0)||p.skillTime>before.skillTime+.1))activatePilotSignature(p);
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
 if(event==='damage'&&['nungesser','berthold'].includes(p.pilot)&&damage>0&&signatureInterval(p,'damage',.14))return signatureCue(p,profile.reaction,{life:.65,damage,symbol:profile.symbol});
 if(event==='shot'&&signatureInterval(p,gun===1?'rearShot':'shot',.12))return signatureCue(p,'shotAccent',{life:.18,gun,style:profile.sustain,active:p.skillTime>0});
 if(event==='hit'&&profile.reaction&&target&&signatureInterval(p,'hit',.15)){const pos=position||target;return signatureCue(p,profile.reaction,{x:pos.x,y:pos.y,life:.45,active:p.skillTime>0})}
 return null;
}


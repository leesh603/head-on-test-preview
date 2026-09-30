// Ability feedback uses live combat state and existing painted aircraft/FX assets.
// No extra damage, invulnerability, camera shake, new HUD or asset allocations.
const own=p=>p.id||'p1';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clamp=v=>Math.max(0,Math.min(1,v));
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const state=p=>p.identityState().feedback??=( {ghosts:[],timers:{},previous:{}} );
const stamp=(p,key,interval)=>{const f=state(p),now=p.identityState().clock;if(now-(f.timers[key]??-Infinity)<interval)return false;f.timers[key]=now;return true};
function wind(p,origin=p,strength=1,color){
 const a=origin.a||0,dx=Math.cos(a),dy=Math.sin(a),length=82+strength*38;
 for(const side of [-1,1])p.identityFx('windStreak',origin.x-dx*38-dy*side*22,origin.y-dy*38+dx*side*22,a,length,.42,{height:25,alpha:.76,color});
}
function ghost(p,origin=p,life=.42){
 const f=state(p);f.ghosts.push({x:origin.x,y:origin.y,a:origin.a,plane:origin.plane||p.plane,pilot:origin.pilot||p.pilot,scale:origin===p?1:.78,life,maxLife:life});
 if(f.ghosts.length>8)f.ghosts.shift();
}
function muzzle(p,origin=p,heavy=false,rear=false,strength=1){
 const a=(origin.a||0)+(rear?Math.PI:0),x=origin.x+Math.cos(a)*31,y=origin.y+Math.sin(a)*31;
 p.identityFx(heavy?'muzzleHeavy':rear?'muzzleRear':'muzzleTwin',x,y,a,heavy?78:42+strength*6,.17,{alpha:.95});
 p.identityFx('gunSmoke',x-Math.cos(a)*8,y-Math.sin(a)*8,a,28+strength*6,.38,{alpha:.45});
}
function startFeedback(p){
 const f=state(p);f.activeStart=p.identityState().clock;
 switch(p.pilot){
  case 'boelcke':case 'goering':case 'collishaw':case 'brumowski':{
   const wings=(p.combatWorld().allies||[]).filter(a=>a.life>0&&a.ownerId===own(p));
   for(const a of wings){wind(p,a,1.4);ghost(p,a);a.identityTrail=0;if(p.pilot==='goering')a.fire=.06*(a.slot||0)}
   // The command is visible immediately, even before the first AI frame.
   wind(p,p,.8);break;
  }
  case 'udet':wind(p,p,1.8);ghost(p);f.counterFlash=.65;break;
  case 'fonck':muzzle(p,p,false,false,.6);break;
  case 'guynemer':p.identityFx('gunSmoke',p.x,p.y,p.a,48,.42,{alpha:.55});break;
  case 'berthold':p.identityFx('armorSpark',p.x,p.y,p.a,66,.28);p.identityFx('gunSmoke',p.x,p.y,p.a,38,.6,{alpha:.35});break;
  case 'gontermann':case 'luke':p.identityFx('incendiary',p.x+Math.cos(p.a)*30,p.y+Math.sin(p.a)*30,p.a,36,.38,{alpha:.85});muzzle(p);break;
  case 'mckeever':muzzle(p);muzzle(p,p,false,true);break;
  case 'huffzky':muzzle(p,p,false,true);wind(p,p,.6);break;
  case 'mccudden':p.identityFx('gunSmoke',p.x,p.y,p.a,50,.5,{alpha:.6});p.identityFx('metalShard0',p.x-22,p.y,p.a,18,.35);break;
  case 'ball':p.identityFx('mist',p.x,p.y,p.a,110,.65,{height:62,alpha:.55});ghost(p,p,.65);break;
  case 'hawker':muzzle(p,p,false,false,1.6);break;
  case 'barker':wind(p,p,.7);break;
  case 'baron':if(!p.isRedHunter?.())wind(p,p,1.2,'#81352b');break;
  default:wind(p,p,1.5);ghost(p);break;
 }
}
export function installPilotFeedback(Game){
 // Legacy solo wings with no owner must enter the same command path as co-op.
 // Never infer an owner from an unowned wing in a cooperative world.
 const normalize=p=>{if(!p.world&&!p.players)for(const a of p.allies||[])if(a.ownerId===undefined)a.ownerId=own(p)};
 const oldEnsure=Game.prototype.ensureWingmen;
 Game.prototype.ensureWingmen=function(){normalize(this);const r=oldEnsure.call(this);normalize(this);return r};
 Game.prototype.permanentWingCount=function(){normalize(this);return (this.combatWorld().allies||[]).filter(a=>a.permanent&&a.life>0&&a.ownerId===own(this)).length};
 const oldSkill=Game.prototype.skill;
 Game.prototype.skill=function(){this.ensureRevisionPilot();if(this.state==='playing'&&this.hp>0&&this.cooldown<=0&&['boelcke','goering','collishaw','brumowski'].includes(this.pilot)&&!this.world)this.ensureWingmen();const used=oldSkill.call(this);if(used)startFeedback(this);return used};
 const oldTick=Game.prototype.tickPilotIdentity;
 Game.prototype.tickPilotIdentity=function(dt,input){
  oldTick.call(this,dt,input);if(!(dt>0)||this.hp<=0||this.status==='downed')return;
  const s=this.identityState(),f=state(this),before=f.previous,active=this.skillTime>0;
  f.ghosts=f.ghosts.filter(g=>(g.life-=dt)>0);f.counterFlash=Math.max(0,(f.counterFlash||0)-dt);
  const turned=Math.abs(wrap(this.a-(f.heading??this.a)))/dt;f.heading=this.a;
  if(this.pilot==='udet'){
   // Detect successful real near-misses, including a refresh at the stack cap.
   if((s.grazes||0)>(before.grazes||0)||s.grazeTime>(before.grazeTime||0)+.08){wind(this,this,2);ghost(this,this,.55);f.counterFlash=.65;this.identityFx('windStreak',this.x,this.y,this.a+Math.PI/2,112,.3,{height:20,alpha:.95})}
   if((s.grazes>0||active)&&stamp(this,'acrobatTrail',.2)){wind(this,this,active?1.4:.65);if(turned>.3||f.counterFlash>0)ghost(this)}
  }
  if(['fonck','gontermann','hawker'].includes(this.pilot)&&s.focus>=1&&!(before.focus>=1)){
   muzzle(this,this,false,false,.8);if(this.pilot==='gontermann')this.identityFx('incendiary',this.x+Math.cos(this.a)*30,this.y+Math.sin(this.a)*30,this.a,32,.4);
  }
  if(this.pilot==='loewenhardt'){
   if(s.energy>=1&&!(before.energy>=1)){wind(this,this,1.3);ghost(this)}
   if((active||s.energy>.65)&&stamp(this,'energyTrail',active?.1:.3)){wind(this,this,active?1.9:.7);if(active)ghost(this)}
  }
  if(this.pilot==='jacobs'&&(active||s.turnCharge>.5)&&stamp(this,'turnTrail',.15)){wind(this,this,active?1.2:.6);ghost(this)}
  if(['bishop','nungesser','immelmann','baracca'].includes(this.pilot)&&(active||this.pilot==='nungesser'&&this.hp/this.maxHp<.4)&&stamp(this,'dashTrail',active?.14:.26)){wind(this,this,active?1.5:.9);if(active)ghost(this)}
  if(this.pilot==='voss'){const pressure=this.enemies.filter(e=>e.hp>0&&dist(this,e)<400).length;if((active||pressure>0)&&stamp(this,'vossTrail',active?.16:.4))wind(this,this,active?1.3:.45+Math.min(6,pressure)*.1)}
  if(this.pilot==='baron'&&this.huntBoost>0&&stamp(this,'huntTrail',.16))wind(this,this,1,'#81352b');
  if(this.pilot==='wolff'&&(this.wolffStacks||0)>(before.petals||0)){
   const w=this.combatWorld();for(let i=0;i<5;i++){const a=this.a+Math.PI+(i-2)*.24;w.particles.push({x:this.x-Math.cos(this.a)*24,y:this.y-Math.sin(this.a)*24,vx:Math.cos(a)*36,vy:Math.sin(a)*36,life:.65,maxLife:.65,petal:true,ownerId:own(this),size:5,angle:a,spin:(i-2)*.8})}
  }
  if(this.pilot==='wolff'&&active&&stamp(this,'petalDive',.18))wind(this,this,1.3);
  if(this.pilot==='ball'){
   if((this.ballAmbush||0)>(before.ambush||0)){wind(this,this,1.6);ghost(this);muzzle(this)}
   if(this.ballCloak>0&&stamp(this,'cloakMist',.25))this.identityFx('mist',this.x,this.y,this.a,94,.5,{height:50,alpha:.45});
  }
  if(this.pilot==='barker'&&s.escape&&stamp(this,'escapeTrail',.12)){wind(this,this,1.7);ghost(this)}
  if(this.pilot==='barker'&&before.escape&&!s.escape&&this.hp>before.hp)this.identityFx('gunSmoke',this.x,this.y,this.a,68,.55,{alpha:.6});
  if(this.pilot==='mccudden'&&active&&stamp(this,'maintenance',.25))this.identityFx('gunSmoke',this.x-Math.cos(this.a)*24,this.y-Math.sin(this.a)*24,this.a,40,.4,{alpha:.38});
  Object.assign(before,{grazes:s.grazes,grazeTime:s.grazeTime,focus:s.focus,energy:s.energy,petals:this.wolffStacks,ambush:this.ballAmbush,escape:!!s.escape,hp:this.hp});
 };
 const oldRound=Game.prototype.applySpecialRound;
 Game.prototype.applySpecialRound=function(b,type){const r=oldRound.call(this,b,type);if(!b.identityGun)return r;
  const s=this.identityState(),active=this.skillTime>0;let strength=0;
  if(this.pilot==='udet')strength=active?1.5:s.grazes>0?.5+s.grazes*.25:0;
  if(this.pilot==='fonck'||this.pilot==='hawker')strength=active?1.4:s.focus>.7?.7:0;
  if(this.pilot==='bishop'){const e=this.identityTarget(.4,360);strength=e?1-clamp(dist(this,e)/360)+(active?.7:0):active?.4:0}
  if(this.pilot==='mckeever'||this.pilot==='huffzky')strength=active?1.2:b.gun===1?.45:0;
  if(this.pilot==='rickenbacker')strength=(s.switches||0)*.35+(active?.5:0);
  if(this.pilot==='mannock')strength=s.threat?active?1.2:.6:0;
  if(this.pilot==='gontermann'||this.pilot==='luke')strength=b.identityIgnite?active?1.4:.65:0;
  if(this.pilot==='ball')strength=this.ballAmbush>0?1.5:0;
  if(this.pilot==='barker')strength=(this.barkerStacks||0)*.35;
  if(this.pilot==='nungesser')strength=clamp((1-this.hp/this.maxHp)/.8);
  const rear=b.gun===1&&this.weapon.bidirectional;
  if(strength>0&&stamp(this,rear?'rearFlash':'gunFlash',.12))muzzle(this,this,false,rear,strength);
  return r;
 };
 const oldImpact=Game.prototype.identityImpact;
 Game.prototype.identityImpact=function(b,e,target,position){const previous=this.identityState().switches||0,r=oldImpact.call(this,b,e,target,position);if((b.ownerId||'p1')!==own(this)||!b.identityGun||!stamp(this,'impactFeedback',.15))return r;
  if(this.pilot==='rickenbacker'&&(this.identityState().switches||0)>previous)this.identityFx('spark',e.x,e.y,this.a,42,.2);
  if(this.pilot==='mckeever'&&b.gun===0){muzzle(this);this.identityFx('gunSmoke',this.x-Math.cos(this.a)*22,this.y-Math.sin(this.a)*22,this.a+Math.PI,34,.38,{alpha:.55})}
  return r;
 };
 const oldDamage=Game.prototype.pilotDamageTaken;
 Game.prototype.pilotDamageTaken=function(n){const before=this.identityState().escape,r=oldDamage.call(this,n);if(this.pilot==='barker'&&!before&&this.identityState().escape){this.identityFx('metalShard0',this.x,this.y,this.a,40,.3);wind(this,this,2);ghost(this)}return r};
 const oldWing=Game.prototype.updatePilotWing;
 Game.prototype.updatePilotWing=function(a,dt){const fired=a.fire,used=oldWing.call(this,a,dt);if(!used)return used;
  const active=this.skillTime>0;if(a.fire>fired)muzzle(this,a,false,false,active?1.25:.4);
  a.identityTrail=(a.identityTrail||0)-dt;if(a.identityTrail<=0){a.identityTrail=active?.18:.45;wind(this,a,active?1.2:.35);if(active)ghost(this,a)}
  return used;
 };
}

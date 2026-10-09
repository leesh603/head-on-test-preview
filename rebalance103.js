// Excel revision 103. Unspecified numbers are explicit first-playtest tuning.
import {WING_PLANES} from './engine.js?v=tame3&rail=41';

export const REVISION_BALANCE=Object.freeze({soloCap:12,coopCap:18,soloRegular:10,coopRegular:11,interval:1.6,coopInterval:1.65,countrysideInterval:1,countrysideCoopInterval:1.15,frontReduction:.25,rearBonus:.3,compassXp:1.3});
const pilotMachineGunRound=b=>!b.enemy&&!b.ally&&!b.formation&&!b.patrol&&!b.rocket&&!b.motorCannon&&!b.cow37&&!b.actualExplosion&&!b.blast&&!b.mauserRound;
const maneuverEase=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
 export function installRevision(Game,PLANES,WEAPONS,PILOTS,PILOT_PLANES,LEGENDARIES,UPGRADES){
 const newPlanes={
  nieuport24:{name:'뉴포르 24',faction:'entente',speed:154,turn:4.1,hp:90,drag:.21,recovery:1.3,guns:1,role:'경량 후방 추격',tip:'빠르게 돌아 후방 사격선을 유지하세요.'},
  pfalz_d3a:{name:'팔츠 D.IIIA · 푸른 날개',faction:'central',speed:151,turn:3.15,hp:130,drag:.14,recovery:1.2,guns:2,role:'튼튼한 강습 전투기',tip:'튼튼한 동체로 버티며 재공격하세요.'},
  airco_dh2:{name:'에어코 DH.2',faction:'entente',speed:125,turn:4.2,hp:90,drag:.21,recovery:1.1,guns:1,role:'추진식 근접 선회',tip:'후방 프로펠러와 넓은 전방 시야를 가진 근접 선회기입니다.'}
 };
 for(const [id,s]of Object.entries(newPlanes)){
  PLANES[id]={...s,wings:2,color:s.faction==='central'?'#6688a4':'#9b9e77',xpCostMultiplier:id==='airco_dh2'?.90:1,handling:{speed:s.speed,turn:s.turn,drag:s.drag,recovery:s.recovery,tip:s.tip,history:'신규 출격 기체 · 능력치는 게임용 초기 튜닝값입니다.'}};
  WEAPONS[id]={...WEAPONS[s.faction==='central'?'albatros':'nieuport'],guns:s.guns,name:id==='airco_dh2'?'Lewis':s.faction==='central'?'Spandau LMG 08/15':'Vickers',reload:s.guns===1?2:2.4};
 }
 PILOTS.hawker={name:'라노 호커',alias:'VICTORIA CROSS',faction:'entente',portrait:1,skill:'모든 것을 공격하라',desc:'5초간 공격속도 +100%, 기관총 탄약 무제한.',cooldown:20};
 PILOTS.berthold={name:'루돌프 베르토홀트',alias:'THE IRON KNIGHT',faction:'central',portrait:0,skill:'불굴의 의지',desc:'5초간 받는 피해 65% 감소. 저체력 패시브와 중첩됩니다.',cooldown:20};
 PILOT_PLANES.hawker='airco_dh2';PILOT_PLANES.berthold='pfalz_d3a';
 const passives={baron:['사냥 본능','강한 적을 오래 추적할수록 해당 대상에게 주는 피해가 증가합니다. 사냥감 격추 시 잠시 빨라집니다.'],fonck:['정밀의 에이스','기관총 탄퍼짐 감소, 탄속 +25%.'],voss:['고독한 늑대','400 범위 적 1기당 공격력·속도·선회 +4%, 최대 +24%.'],boelcke:['Dicta Boelcke','적 측면·후방에서 기관총 피해 +25%.'],collishaw:['Black Flight','검은 삼엽기 윙맨 2기가 서로 다른 적을 분산 압박합니다.'],baracca:['Cavallino Rampante','적과 정면으로 마주칠 때 기관총 피해 +30%.'],udet:['공중 곡예사','현재 체력이 100보다 낮으면 부족한 체력 1당 공격력 +0.5%, 속도·선회 +0.3%.'],guynemer:['모퇴르 카농','4초마다 피해 90의 대형 관통 기관포 발사.'],bishop:['근접 사냥꾼','300 범위 안의 적에게 기관총 피해 +80%.'],goering:['백색 편대장','백색 윙맨 1기와 상시 출격.'],immelmann:['독일의 독수리','큰 방향전환·선회기동 직후 1.5초간 탄 퍼짐 감소·연사 +20%.'],mannock:['엄호전의 에이스','아군을 공격 중인 적에게 기관총 피해 +15%, 엄호 교전 중 연사 +15%.'],mckeever:['후방사수 · 파월','전방과 후방 동시 사격.'],huffzky:['후방 사수','에만이 후방의 적을 상시 조준하여 견제합니다.'],hawker:['빅토리아 십자훈장 수훈자','선회 속도 손실 −25%. 직진 유지 시 최대 속도 +20%.'],berthold:['철혈의 에이스','체력 50% 이하에서 받는 피해 25% 감소.']};
 for(const[id,[name,desc]]of Object.entries(passives)){PILOTS[id].passive=name;PILOTS[id].passiveDesc=desc;}
 PILOTS.collishaw.desc='6초간 블랙 플라이트가 좌우로 갈라져 서로 다른 각도에서 적을 협공합니다. 무적 없음.';
 PILOTS.goering.desc='백색 윙맨 1기와 상시 출격. 신호탄에 맞춰 편대가 수렴하며 5초간 윙맨 공격력 3배·공격속도 2배.';
 PILOTS.immelmann.cooldown=11;
  const descriptions={prancingHorse:'이동 속도 +20%, 전방에서 받는 피해 −25%.',ironCross:'파일럿 액티브가 강화되고 재사용 대기시간이 20% 감소합니다.',steelPlate:'기관총·소구경 탄환 피해 −30%, 이동 속도·선회력 −10%. 한 출격 1회.',loEmblem:'최대 내구도 −50%. 기관총·폭발물·편대 피해 +30%, 편대 연사 +30%, 이동 속도·선회력 +20%.',sacredCowling:'근거리 적에게 주는 피해 +25%. 적이 가까울수록 받는 탄환 피해가 최대 20% 감소합니다.',boelckeDicta:'경험치 획득량 +30%. 협동에서는 보유자에게만 적용됩니다.',fogCompass:'경험치와 수리 아이템의 획득 반경이 크게 증가합니다.',rearGunner:'기본 기관총 사격 방향이 초당 약 66°로 회전합니다. 완전 후방 조준 약 2.7초. 총기 수·탄약 소모는 유지됩니다.'};
 const names={steelPlate:'J형 장갑 캡슐',boelckeDicta:'뵐케의 금언집',fogCompass:'C-O 5/17 에어로 컴퍼스',rearGunner:'스카프링 총좌'};
 for(const[id,desc]of Object.entries(descriptions)){let l=LEGENDARIES.find(u=>u.id===id);if(!l){l={id,name:names[id]};LEGENDARIES.push(l);UPGRADES.push({...l,legendary:true,apply:()=>{}})}l.desc=desc;Object.assign(UPGRADES.find(u=>u.id===id),l);}
 const oldUpgrade=Game.prototype.upgrade;
 Game.prototype.upgrade=function(id,rarity='normal'){
  const custom=['prancingHorse','ironCross','steelPlate','loEmblem','boelckeDicta','fogCompass','rearGunner'];
  if(!custom.includes(id))return oldUpgrade.call(this,id,rarity);
  if(this.state!=='upgrade'||rarity!=='legendary'||this.upgrades[id]||this.legendaryCount()>=(this.level>=20?4:this.level>=10?2:1))return;
  const speed=n=>{this.speed*=n;if(this.baseSpeed)this.baseSpeed*=n};
  if(id==='prancingHorse'){speed(1.2);this.frontalProtection=.25;this.legendaryMineTrail=false;}
  if(id==='ironCross'){this.skillEnhanced=true;this.cooldownMult=Math.max(.5,this.cooldownMult*.8)}
  if(id==='steelPlate'){const ratio=this.hp/this.maxHp;this.maxHp*=1.5;this.hp=this.maxHp*ratio}
  if(id==='loEmblem'){this.maxHp*=.5;this.hp*=.5;this.damage*=1.3;this.explosiveBonus=(this.explosiveBonus||0)+.3;this.commandBonus=(this.commandBonus||0)+.3;speed(1.2);this.turn*=1.2;this.rate=Math.max(.045,this.rate*.85);this.weapon.reload*=.85;this.cooldownMult=Math.max(.5,this.cooldownMult*.85);this.magnet=Math.min(480,this.magnet*1.2);this.lowHpDamage=false;}
  if(id==='boelckeDicta')this.rearDamageBonus=.3;
  if(id==='fogCompass')this.xpGainMult=(this.xpGainMult||1)*1.3;
  if(id==='rearGunner'&&!this.weapon.bidirectional)this.rearGunner=true;
  this.upgrades[id]=1;this.state='playing';this.checkLevel();
 };
 Game.prototype.ensureRevisionPilot=function(){
  if(this.revisionPilotReady)return;this.revisionPilotReady=true;
  if(this.pilot==='baron'&&this.isRedHunter()){const mult=1.12;this.speed*=mult;if(this.baseSpeed)this.baseSpeed*=mult;this.turn*=1.12;}
  if(this.pilot==='hawker')this.handlingDragMult=.75;
  if(!this.world&&!this._turnBalanceApplied){this.turn*=.72;this._turnBalanceApplied=true;this.baseSpeed=this.speed;this.enemyCruiseReference=this.speed;}
  if(this.pilot==='collishaw')this.permanentWingman=(this.permanentWingman||0)+2;
 };
 const duration=Game.prototype.skillDuration;
 Game.prototype.skillDuration=function(){const base=({voss:4,boelcke:8,collishaw:6,hawker:5,berthold:5})[this.pilot]??duration.call(this);return base*(this.skillEnhanced&&PILOTS[this.pilot]?1.35:1)};
 Game.prototype.skillCooldown=function(){return Math.max(PILOTS[this.pilot].cooldown*Math.max(.5,this.cooldownMult),this.skillDuration()+this.skillRecovery())};
 const skill=Game.prototype.skill;
 Game.prototype.skill=function(){
  this.ensureRevisionPilot();if(this.state!=='playing'||this.hp<=0||this.cooldown>0)return false;
  if(['voss','boelcke','hawker','berthold'].includes(this.pilot)){
   this.cooldown=this.skillCooldown();this.skillTime=this.skillDuration();
   if(this.pilot==='boelcke'){
    const w=this.combatWorld();w.allies??=[];const formationSize=this.skillEnhanced?5:4;
    for(let i=0;i<formationSize;i++)w.allies.push({ownerId:this.id,slot:(this.permanentWingman||0)+i,plane:this.plane,x:this.x,y:this.y,a:this.a,life:this.skillTime,fire:.85+Math.floor(i/2)*.12,temporary:true,boelckePincer:true});
   }
   this.event('skill',PILOTS[this.pilot].skill);return true;
  }
  const used=skill.call(this);if(!used)return used;
  if(this.skillEnhanced&&this.pilot==='baron')this.skillTime=this.skillDuration();
  if(this.pilot==='collishaw'){
   this.skillTime=this.skillDuration();
   const formationSize=this.skillEnhanced?4:3;
   this.formationWings=Array.from({length:formationSize},(_,i)=>({slot:i-(formationSize-1)/2,phase:i*2.05,x:this.x,y:this.y,a:this.a,alpha:0,fire:0}));
  }
  if(this.pilot==='immelmann')this.eagleTime=1.5;
  if(this.skillEnhanced){if(this.pilot==='goering')this.skillTime=this.wingBoost=this.skillDuration();}
  return used;
 };
 const evade=Game.prototype.evade;
 Game.prototype.evade=function(){const used=evade.call(this);if(used&&this.pilot==='immelmann')this.eagleTime=1.5;return used};
 const gun=Game.prototype.normalGunMultiplier;
 Game.prototype.normalGunMultiplier=function(){return (this.pilot==='boelcke'?1:gun.call(this))*(this.revisionDamageMult||1)};
 Game.prototype.incomingDamageMultiplier=function(source){
  let m=1;
  if(this.frontalProtection&&source&&Math.abs(Math.atan2(Math.sin(Math.atan2(source.y-this.y,source.x-this.x)-this.a),Math.cos(Math.atan2(source.y-this.y,source.x-this.x)-this.a)))<Math.PI/3)m*=1-this.frontalProtection;
  return m;
 };
 const hit=Game.prototype.hit;
 Game.prototype.hit=function(n){if(this.invuln>0)return;const amount=n*this.incomingDamageMultiplier(this.damageSource);return hit.call(this,this.pilotDamageTaken?this.pilotDamageTaken(amount):amount)};
 const round=Game.prototype.applySpecialRound;
 Game.prototype.applySpecialRound=function(b,type){
  round.call(this,b,type);
  if(this.pilot==='fonck'&&pilotMachineGunRound(b)){
   const speed=Math.hypot(b.vx,b.vy)*1.25;let a=Math.atan2(b.vy,b.vx);
   if(this.skillTime>0){a=Math.atan2(this.y+Math.sin(this.a)*220-b.y,this.x+Math.cos(this.a)*220-b.x);b.fonckVolley=true;b.pierce=true;}
   b.vx=Math.cos(a)*speed;b.vy=Math.sin(a)*speed;
  }
  if(this.pilot==='huffzky'&&b.gun===1&&pilotMachineGunRound(b)){b.x=this.x-Math.cos(this.a)*23;b.y=this.y-Math.sin(this.a)*23;}
  if(this.rearGunner&&!this.weapon.bidirectional&&b.gun===0){const a=this.a+Math.PI;this.bullets.push({...b,x:this.x+Math.cos(a)*23,y:this.y+Math.sin(a)*23,vx:Math.cos(a)*520,vy:Math.sin(a)*520,ownerId:this.id,fonckGuided:false,hit:new Set(),rearGunnerRound:true});}
  return b;
 };
 const roundDamage=Game.prototype.roundDamageMultiplier;
 Game.prototype.roundDamageMultiplier=function(b,e){
  let mult=roundDamage.call(this,b,e);const a=Math.atan2(this.y-e.y,this.x-e.x),delta=Math.abs(Math.atan2(Math.sin(a-e.a),Math.cos(a-e.a))),rear=delta>Math.PI*.72,sun=this.isRedHunter()&&this.sunStrikeContains(e);
 if(this.pilot==='boelcke'&&delta>=Math.PI/3&&!b.enemy&&!b.ally&&!b.patrol&&!b.formation&&!b.rocket&&!b.actualExplosion&&!b.blast&&!b.motorCannon&&!b.cow37)mult*=1.25;
  if(rear||sun){mult*=1+(this.rearDamageBonus||0)+(this.isRedHunter?.()?.3:0);if(sun&&rear)mult*=1.2;if(sun&&!b.tailBonus)mult*=1.5;}

  if(pilotMachineGunRound(b)){
   if(this.pilot==='bishop'&&Math.hypot(e.x-this.x,e.y-this.y)<=300)mult*=1.8;
   if(this.pilot==='mannock'&&this.mannockCoverTarget(e))mult*=1.15;
  }
  if(this.skillEnhanced&&(b.special||b.formation||b.duo||b.blast&&this.skillTime>0))mult*=1.3;
  return mult;
 };
 // Read the existing enemy target without changing its AI or acquiring a new target.
 Game.prototype.mannockCoverTarget=function(e){
  if(this.pilot!=='mannock'||!e||!(e.hp>0))return null;const world=this.combatWorld();
  const patrol=e.patrolTarget,ally=patrol?.hp>0&&patrol.life>0&&world.patrols?.includes(patrol)&&world.patrolCanEngage?.(e,patrol)?patrol:world.players?.find(p=>p!==this&&p.id===e.targetPlayerId&&p.hp>0&&p.status!=='downed');
  if(!ally||Math.hypot(ally.x-e.x,ally.y-e.y)>700)return null;
  const aim=Math.atan2(ally.y-e.y,ally.x-e.x),heading=e.gunAim??e.a??0;return Math.abs(Math.atan2(Math.sin(aim-heading),Math.cos(aim-heading)))<.7?ally:null;
 };
 Game.prototype.beginRevisionFrame=function(dt,input={}){
  this.ensureRevisionPilot();const world=this.combatWorld();
  if(this.pilot==='immelmann'){const yaw2=Math.abs(Math.atan2(Math.sin(this.a-(this.immelmannPreviousHeading??this.a)),Math.cos(this.a-(this.immelmannPreviousHeading??this.a))));this.immelmannPreviousHeading=this.a;if(!this.immelmannTurn){this.immelmannTurnAmount=(this.immelmannTurnAmount||0)*Math.exp(-dt*.8)+yaw2;if(this.immelmannTurnAmount>=Math.PI/2){this.eagleTime=1.5;this.immelmannTurnAmount=0}}}
  const nearby=this.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-this.x,e.y-this.y)<400).length;
  const wolf=this.pilot==='voss'?Math.min(6,nearby)*.04:0,udet=0,eagle=this.eagleTime>0?.2:0;
  this.revisionDamageMult=1+wolf+udet*.5;
  const yaw=Number.isFinite(input.angle)?Math.abs(Math.atan2(Math.sin(input.angle-this.a),Math.cos(input.angle-this.a))):Math.abs(input.steer||0);
  if(this.pilot==='hawker')this.straightCharge=Math.max(0,Math.min(1,(this.straightCharge||0)+(yaw<.12?dt/3:-dt*2)));
  const prior={baseSpeed:this.baseSpeed,speed:this.speed,turn:this.turn,rate:this.rate,unlimitedAmmo:this.unlimitedAmmo};
  if(this.pilot==='ball'&&this.ballCloak>0){prior.fire=this.fire;this.fire=Math.max(this.fire,dt+.01)}
  const mobility=1+wolf+udet*.3+(this.pilot==='hawker'?(this.straightCharge||0)*.2:0);
  this.baseSpeed=(this.baseSpeed||this.speed)*mobility;this.speed*=mobility;this.turn*=1+wolf+udet*.3;
  this.mannockCoverEngaged=this.pilot==='mannock'&&this.enemies.some(e=>this.mannockCoverTarget(e)&&Math.hypot(e.x-this.x,e.y-this.y)<700&&Math.abs(Math.atan2(Math.sin(Math.atan2(e.y-this.y,e.x-this.x)-this.a),Math.cos(Math.atan2(e.y-this.y,e.x-this.x)-this.a)))<Math.PI/3);
  this.rate/=(1+eagle)*(this.mannockCoverEngaged?1.15:1);
    this.eagleTime=Math.max(0,(this.eagleTime||0)-dt);
  if(this.pilot==='immelmann'&&this.immelmannTurn){
   const m=this.immelmannTurn;m.elapsed+=dt;const q=Math.min(1,m.elapsed/.9);
   // A half loop followed by a half roll, level before the existing volley.
   m.pitch=Math.PI*maneuverEase(q/.56);m.roll=Math.PI*maneuverEase((q-.44)/.28);
   const forward=Math.cos(m.pitch),groundSpeed=Math.abs(forward);
   this.a=m.heading+(forward<0?Math.PI:0);this.turn=0;
   // Project flight speed onto the ground: no velocity snap at the loop apex.
   this.baseSpeed*=groundSpeed;this.speed*=groundSpeed;
   this.fire=Math.max(this.fire,dt+.03);
   this.immelmannAltitude=Math.sin(Math.PI*maneuverEase(q/.72));
   if(!m.fired&&q>=.72){m.fired=true;for(let i=-m.spread;i<=m.spread;i++){const aa=this.a+i*.07;this.bullets.push({x:this.x+Math.cos(aa)*24,y:this.y+Math.sin(aa)*24,vx:Math.cos(aa)*620,vy:Math.sin(aa)*620,life:1.5,enemy:false,ownerId:this.id,damage:this.damage*3.5,pierce:true,hit:new Set(),formation:true})}this.muzzleFlash=.12}
   if(q>=1){this.immelmannTurn=null;this.immelmannAltitude=0;this.eagleTime=1.5;this.immelmannPreviousHeading=this.a}
  }else if(this.pilot==='immelmann')this.immelmannAltitude=0;
  if(this.pilot==='guynemer'){this.passiveCannonTimer=(this.passiveCannonTimer??0)-dt;if(this.passiveCannonTimer<=0){this.passiveCannonTimer=4;this.cannonRecoil129=.24;this.cannonKick129=9;this.identityFx?.('muzzleHeavy',this.x+Math.cos(this.a)*26,this.y+Math.sin(this.a)*26,this.a,58,.15);this.bullets.push({x:this.x,y:this.y,vx:Math.cos(this.a)*460,vy:Math.sin(this.a)*460,life:2.8,ownerId:this.id,enemy:false,motorCannon:true,pierce:true,collisionRadius:18,damage:this.payloadPower(90),hit:new Set()});}}
  return prior;
 };
 Game.prototype.endRevisionFrame=function(prior){Object.assign(this,prior)};
 const update=Game.prototype.update;
 Game.prototype.update=function(dt,input={}){
  if(this.state!=='playing')return;
  this.checkLevel();if(this.state!=='playing')return;
  const step=Math.min(.04,Math.max(0,dt));this.ensureRevisionPilot();const prior=this.beginRevisionFrame(step,input);
  try{this.tickRevisionWorld(step);update.call(this,step,input)}finally{this.endRevisionFrame(prior)}
 };
 Game.prototype.tickRevisionWorld=function(dt){
  this.revisionDecoys=(this.revisionDecoys||[]).filter(d=>(d.life-=dt)>0);
  for(const b of this.bullets){
   if(!b.fonckGuided||b.life<=0)continue;const owner=this.players?.find(p=>p.id===b.ownerId)||this;
   const targets=this.enemies.filter(e=>e.hp>0&&!b.hit?.has(e)&&Math.abs(Math.atan2(Math.sin(Math.atan2(e.y-owner.y,e.x-owner.x)-b.guidedHeading),Math.cos(Math.atan2(e.y-owner.y,e.x-owner.x)-b.guidedHeading)))<Math.PI/4);
   targets.sort((a,c)=>Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(c.x-b.x,c.y-b.y));if(targets[0]){const a=Math.atan2(targets[0].y-b.y,targets[0].x-b.x),s=Math.hypot(b.vx,b.vy);b.vx=Math.cos(a)*s;b.vy=Math.sin(a)*s;}
  }
 };
 const aceAttack=Game.prototype.aceAttack;
 Game.prototype.aceAttack=function(e){
  if(e.bossPilot==='berthold'){e.ironWillUntil=this.t+5;this.burst(e.x,e.y,'#a9c4db',18);return;}
  if(e.bossPilot==='hawker'){e.rapidFireUntil=this.t+5;this.enemyVolley(e);this.burst(e.x,e.y,'#f0d39c',12);return;}
  return aceAttack.call(this,e);
 };
 const fireEnemy=Game.prototype.fireEnemy;Game.prototype.fireEnemy=function(e){const result=fireEnemy.call(this,e);if(e.rapidFireUntil>this.t)e.fire=Math.min(e.fire,.22);return result};
 const target=Game.prototype.enemyCombatTarget;
 Game.prototype.enemyCombatTarget=function(e){return this.revisionDecoyTarget(e)||target.call(this,e)};
 Game.prototype.revisionDecoyTarget=function(e){const decoys=(this.revisionDecoys||[]).filter(d=>Math.hypot(d.x-e.x,d.y-e.y)<600);return decoys.length?decoys[(e.tailId?.length||0)%decoys.length]:null};
 const supportPlane=Game.prototype.supportPlane;Game.prototype.supportPlane=function(){return this.pilot==='collishaw'?'sopwith':supportPlane.call(this)};
 const support=Game.prototype.supportPower;
 Game.prototype.supportAuraAt=function(){return 1};
 Game.prototype.supportPower=function(base){return support.call(this,base)};
 Game.prototype.boelckeWingTarget=function(wing){
  let target=this.boelckePincerTarget;if(!target||target.hp<=0||!this.enemies.includes(target))target=this.boelckePincerTarget=this.enemies.filter(e=>e.hp>0&&!e.crashing&&Math.hypot(e.x-this.x,e.y-this.y)<900).sort((a,b)=>Math.hypot(a.x-this.x,a.y-this.y)-Math.hypot(b.x-this.x,b.y-this.y))[0];
  const slot=wing.slot||0,side=slot%2?-1:1,row=Math.floor(slot/2),spread=this.skillDuration()-this.skillTime<.75,heading=target?.a??this.a;
  const cx=spread||!target?this.x:target.x,cy=spread||!target?this.y:target.y,h=spread?this.a:heading,back=spread?25:100+row*36,off=side*(spread?155+row*34:100+row*38);
  const x=cx-Math.cos(h)*back-Math.sin(h)*off,y=cy-Math.sin(h)*back+Math.cos(h)*off;return {x,y,a:target?Math.atan2(target.y-wing.y,target.x-wing.x):this.a};
 };
 // World-wide admission is checked before any legacy factory mutates an entity.
 Game.prototype.enemyCapacity=function(){return this.mode==='campaign'?65:this.mode==='coop2'?28:22};
 Game.prototype.isOpeningCountryside=function(){return this.mode!=='campaign'&&this.worldRegion()===0&&(this.stageBoss?.stages.loopIndex??0)===0&&this.t<120};
 Game.prototype.regularEnemyLimit=function(){if(this.stageBoss?.stages.phase==='boss')return this.mode==='coop2'?12:9;return this.mode==='coop2'?19:15};
 Game.prototype.regularSpawnInterval=function(){const interval=this.isOpeningCountryside()?(this.mode==='coop2'?REVISION_BALANCE.countrysideCoopInterval:REVISION_BALANCE.countrysideInterval):(this.mode==='coop2'?REVISION_BALANCE.coopInterval:REVISION_BALANCE.interval);return (this.stageBoss?.stages.phase==='boss'?interval/0.75:interval)*.72};
 Game.prototype.aircraftMix=function(faction,time=this.t){
  const phase=time<120?0:time<300?1:time<480?2:3;
  const pools=faction==='central'?
   [['eindecker','eindecker','eindecker','albatros_d2'],['eindecker','albatros_d2','albatros_d2','pfalz_d3a'],['eindecker','albatros_d2','pfalz_d3a','pfalz_d3a','fokkerd7'],['eindecker','albatros_d2','fokkerd7','pfalz_d3a','fokkerd7']]:
   [['airco_dh2','airco_dh2','airco_dh2','nieuport24'],['airco_dh2','nieuport24','nieuport24','camel'],['airco_dh2','nieuport24','camel','camel','se5a'],['airco_dh2','nieuport24','camel','se5a','spad']];
  return [...pools[phase]];
 };
 Game.prototype.friendlyAircraftMix=function(faction){const pool=WING_PLANES[faction];return pool?[...pool]:this.aircraftMix(faction,this.t)};
 Game.prototype.spawnComposition=function(){const r=this.rng(),t=this.t;return t<120?(r<.85?'scout':'hunter'):t<300?(r<.35?'scout':r<.85?'hunter':'bomber'):t<480?(r<.65?'hunter':r<.95?'bomber':'zeppelin'):(r<.55?'hunter':r<.88?'bomber':r<.97?'zeppelin':'heavyBomber')};
 Game.prototype.canSpawnRevision=function(type){
  if(this.mode==='campaign')return true;
  const live=this.enemies.filter(e=>e.hp>0);const reserved=this.stageBoss?.stages.phase==='boss'?Math.max(0,2-live.filter(e=>e.stageBossBody).length):0,aceReserve=type==='boss'?0:1;if(live.length+reserved+aceReserve>=this.enemyCapacity())return false;
  const regularAircraft=live.filter(e=>!e.bossPilot&&!e.heavyBomber&&['scout','hunter','bomber'].includes(e.type));
  if(!this.bossMechanicSpawn&&['scout','hunter','bomber'].includes(type)&&regularAircraft.length>=this.regularEnemyLimit())return false;
  if(type==='zeppelin'&&!this.bossMechanicSpawn&&live.some(e=>e.type==='zeppelin'))return false;
  if(type==='heavyBomber'&&live.some(e=>e.heavyBomber))return false;
  if(!this.bossMechanicSpawn&&type==='bomber'&&live.filter(e=>e.type==='bomber'&&!e.heavyBomber&&!e.surface).length>=2)return false;
  return true;
 };
 const spawn=Game.prototype.spawnEnemy;
 Game.prototype.spawnEnemy=function(type){
  if(!this.canSpawnRevision(type))return null;const n=this.enemies.length;spawn.call(this,type);if(this.enemies.length===n)return null;const e=this.enemies.at(-1);
  if(this.mode!=='campaign'&&!e.bossPilot&&!e.heavyBomber&&['scout','hunter'].includes(e.type)){
   const mix=this.aircraftMix(e.faction),escort=mix[Math.floor(this.rng()*mix.length)],tiers=e.faction==='central'?{eindecker:0,albatros_d2:1,pfalz_d3a:2,fokkerd7:3}:{airco_dh2:0,nieuport24:1,camel:2,se5a:2,spad:3},tier=tiers[escort]??0;
   e.enemyTier=tier;e.xpValue=[2,3,5,7][tier];e.escortPlane=escort;
   e.hp=e.maxHp=(e.type==='hunter'?42:28)*[1,1.25,1.55,1.9][tier];
  }
  if(this.mode!=='campaign'&&this.mode!=='coop2'){const a=this.a+(this.rng()-.5)*Math.PI*1.4,dx=Math.cos(a),dy=Math.sin(a),w=(this.viewWidth||960)/2+75,h=(this.viewHeight||700)/2+75,d=Math.min(w/(Math.abs(dx)||1e-6),h/(Math.abs(dy)||1e-6));Object.assign(e,{x:this.x+dx*d,y:this.y+dy*d,a:a+Math.PI});}
  return e;
 };
 Game.prototype.runScheduledAces=function(){
  if(this.t>=this.nextBossAt){this.pendingAceCount=Math.max(this.pendingAceCount||0,this.aceWaveCount(this.t));this.nextBossAt=this.nextAceWaveAt(this.t)}
  if(!this.pendingAceCount)return;const requested=this.prepareBossWave(this.pendingAceCount);let count=0;for(let i=0;i<requested;i++){if(!this.spawnEnemy('boss'))break;count++;}
  this.pendingAceCount-=count;if(count)this.event('wave',count>1?'에이스 편대 등장':'적 에이스 출현');
 };
 Game.prototype.reserveEnemySlots=function(){/* Existing enemies stay on the battlefield. */};
}


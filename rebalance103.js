// Excel revision 103. Unspecified numbers are explicit first-playtest tuning.
import {WING_PLANES} from './engine.js?v=337&b=326';
export const REVISION_BALANCE=Object.freeze({soloCap:12,coopCap:18,soloRegular:10,coopRegular:11,interval:1.6,coopInterval:1.65,countrysideInterval:1,countrysideCoopInterval:1.15,frontReduction:.25,rearBonus:.3,compassXp:1.3});
export function installRevision(Game,PLANES,WEAPONS,PILOTS,PILOT_PLANES,LEGENDARIES,UPGRADES){
 const newPlanes={
  nieuport24:{name:'뉴포르 24',faction:'entente',speed:154,turn:4.1,hp:90,drag:.21,recovery:1.3,guns:1,role:'경량 후방 추격',tip:'빠르게 돌아 후방 사격선을 유지하세요.'},
  pfalz_d3a:{name:'팔츠 D.IIIA · 푸른 날개',faction:'central',speed:151,turn:3.15,hp:130,drag:.14,recovery:1.2,guns:2,role:'튼튼한 강습 전투기',tip:'튼튼한 동체로 버티며 재공격하세요.'},
  airco_dh2:{name:'에어코 DH.2',faction:'entente',speed:125,turn:4.2,hp:90,drag:.24,recovery:1.1,guns:1,role:'추진식 근접 선회',tip:'후방 프로펠러와 넓은 전방 시야를 가진 근접 선회기입니다.'}
 };
 for(const [id,s]of Object.entries(newPlanes)){
  PLANES[id]={...s,wings:2,color:s.faction==='central'?'#6688a4':'#9b9e77',xpCostMultiplier:id==='airco_dh2'?.90:1,handling:{speed:s.speed,turn:s.turn,drag:s.drag,recovery:s.recovery,tip:s.tip,history:'신규 출격 기체 · 능력치는 게임용 초기 튜닝값입니다.'}};
  WEAPONS[id]={...WEAPONS[s.faction==='central'?'albatros':'nieuport'],guns:s.guns,name:id==='airco_dh2'?'Lewis':s.faction==='central'?'Spandau LMG 08/15':'Vickers',reload:s.guns===1?2:2.4};
 }
 PILOTS.hawker={name:'라노 호커',alias:'VICTORIA CROSS',faction:'entente',portrait:1,skill:'모든 것을 공격하라',desc:'5초간 공격속도 +100%, 기관총 탄약 무제한.',cooldown:20};
 PILOTS.berthold={name:'루돌프 베르토홀트',alias:'THE IRON KNIGHT',faction:'central',portrait:0,skill:'불굴의 의지',desc:'5초간 받는 피해 65% 감소. 저체력 패시브와 중첩됩니다.',cooldown:20};
 PILOT_PLANES.hawker='airco_dh2';PILOT_PLANES.berthold='pfalz_d3a';
 const passives={baron:['사냥 본능','강한 적을 오래 추적할수록 해당 대상에게 주는 피해가 증가합니다. 사냥감 격추 시 잠시 빨라집니다.'],fonck:['명사수','기관총 피해 +15%, 사거리 +25%.'],voss:['고독한 늑대','400 범위 적 1기당 공격력·속도·선회 +4%, 최대 +24%.'],boelcke:['디 딕타 뵐케','360 범위 아군의 사격 피해 +25%.'],collishaw:['검은 편대','검은 삼엽기 윙맨 2기와 상시 출격.'],baracca:['기사도의 결투','적과 정면으로 마주칠 때 공격 피해 +30%.'],udet:['공중 곡예사','현재 체력이 100보다 낮으면 부족한 체력 1당 공격력 +0.5%, 속도·선회 +0.3%.'],guynemer:['모퇴르 카농','4초마다 피해 90의 대형 관통 기관포 발사.'],bishop:['초근접사격','기관총 공격력 +80%, 사거리 −55%.'],goering:['백색 편대 · 출격','백색 윙맨 2기와 상시 출격.'],immelmann:['독일의 독수리','선회기동·임멜만 턴 이후 3초간 공격력·공격속도·속도·선회 +20%.'],mannock:['외눈의 에이스','기관총 사거리 −55%. 아군·윙맨 연사 +15%.'],mckeever:['후방사수 · 파월','전방과 후방 동시 사격.'],huffzky:['매와 모기','전방과 후방 동시 사격.'],hawker:['빅토리아 십자훈장 수훈자','선회 속도 손실 −25%. 직진 유지 시 최대 속도 +20%.'],berthold:['철혈의 에이스','체력 50% 이하에서 받는 피해 25% 감소.']};
 for(const[id,[name,desc]]of Object.entries(passives)){PILOTS[id].passive=name;PILOTS[id].passiveDesc=desc;}
 Object.assign(PILOTS.fonck,{skill:'탄도학의 달인',desc:'4초간 전방 부채꼴 90도 범위로 발사한 기관총 탄환이 적을 유도 추적합니다.'});
 Object.assign(PILOTS.voss,{skill:'7대 1',desc:'4초간 비행 잔상을 남겨 적의 표적과 조준을 교란합니다. 무적·탄막 삭제 없음.'});
 Object.assign(PILOTS.boelcke,{skill:'편대 집결',desc:'8초간 아군 편대기 4기가 합류합니다. 주변 아군 강화 오라가 적용됩니다.'});
 PILOTS.collishaw.desc='6초간 검은 삼엽기 2기 추가. 좌우 기동하며 0.24초마다 관통 사격. 무적 없음.';
 PILOTS.goering.desc='상시 윙맨 2기. 5초간 자신의 윙맨 공격력 3배·공격속도 2배.';
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
  if(['collishaw','goering'].includes(this.pilot))this.permanentWingman=(this.permanentWingman||0)+(this.pilot==='goering'?1:2);
 };
 const duration=Game.prototype.skillDuration;
 Game.prototype.skillDuration=function(){const base=({voss:4,boelcke:8,collishaw:6,hawker:5,berthold:5})[this.pilot]??duration.call(this);return base*(this.skillEnhanced&&PILOTS[this.pilot]?1.35:1)};
 Game.prototype.skillCooldown=function(){return Math.max(PILOTS[this.pilot].cooldown*Math.max(.5,this.cooldownMult),this.skillDuration()+this.skillRecovery())};
 const skill=Game.prototype.skill;
 Game.prototype.skill=function(){
  this.ensureRevisionPilot();if(this.state!=='playing'||this.hp<=0||this.cooldown>0)return false;
  if(['fonck','voss','boelcke','hawker','berthold'].includes(this.pilot)){
   this.cooldown=this.skillCooldown();this.skillTime=this.skillDuration();
   if(this.pilot==='boelcke'){
    const w=this.combatWorld();w.allies??=[];const formationSize=this.skillEnhanced?5:4;
    for(let i=0;i<formationSize;i++)w.allies.push({ownerId:this.id,slot:(this.permanentWingman||0)+i,plane:this.plane,x:this.x,y:this.y,a:this.a,life:this.skillTime,fire:.15*i,temporary:true});
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
  if(this.pilot==='immelmann')this.eagleTime=3;
  if(this.skillEnhanced){if(this.pilot==='goering')this.skillTime=this.wingBoost=this.skillDuration();if(this.pilot==='udet')this.skillTime=this.udetBoost=this.skillDuration();}
  return used;
 };
 const evade=Game.prototype.evade;
 Game.prototype.evade=function(){const used=evade.call(this);if(used&&this.pilot==='immelmann')this.eagleTime=3;return used};
 const gun=Game.prototype.normalGunMultiplier;
 Game.prototype.normalGunMultiplier=function(){const aura=(this.combatWorld().players||[]).some(p=>p!==this&&p.hp>0&&p.pilot==='boelcke'&&Math.hypot(p.x-this.x,p.y-this.y)<360)?1.25:1;return (this.pilot==='boelcke'?1:gun.call(this))*(this.revisionDamageMult||1)*aura};
 Game.prototype.incomingDamageMultiplier=function(source){
  let m=1;if(this.pilot==='berthold'){if(this.hp<=this.maxHp*.5)m*=.75;if(this.skillTime>0)m*=.35;}
  if(this.frontalProtection&&source&&Math.abs(Math.atan2(Math.sin(Math.atan2(source.y-this.y,source.x-this.x)-this.a),Math.cos(Math.atan2(source.y-this.y,source.x-this.x)-this.a)))<Math.PI/3)m*=1-this.frontalProtection;
  return m;
 };
 const hit=Game.prototype.hit;
 Game.prototype.hit=function(n){return hit.call(this,n*this.incomingDamageMultiplier(this.damageSource))};
 const round=Game.prototype.applySpecialRound;
 Game.prototype.applySpecialRound=function(b,type){
  round.call(this,b,type);
  if(this.pilot==='fonck'){
   b.life*=1.25;
   if(this.skillTime>0){b.fonckGuided=true;b.fonckSpreadRound=this.shots||1;b.guidedHeading=this.a;b.ownerId=this.id;}
  }
  if(this.rearGunner&&!this.weapon.bidirectional&&b.gun===0){const a=this.a+Math.PI;this.bullets.push({...b,x:this.x+Math.cos(a)*23,y:this.y+Math.sin(a)*23,vx:Math.cos(a)*520,vy:Math.sin(a)*520,ownerId:this.id,fonckGuided:false,hit:new Set(),rearGunnerRound:true});}
  return b;
 };
 const roundDamage=Game.prototype.roundDamageMultiplier;
 Game.prototype.roundDamageMultiplier=function(b,e){
  let mult=roundDamage.call(this,b,e);const a=Math.atan2(this.y-e.y,this.x-e.x),delta=Math.abs(Math.atan2(Math.sin(a-e.a),Math.cos(a-e.a))),rear=delta>Math.PI*.72,sun=this.isRedHunter()&&this.sunStrikeContains(e);
  if(rear||sun){mult*=1+(this.rearDamageBonus||0)+(this.isRedHunter?.()?.3:0);if(sun&&rear)mult*=1.2;if(sun&&!b.tailBonus)mult*=1.5;}
  if(this.pilot==='baracca'&&delta<Math.PI/3)mult*=1.3;
  if(this.skillEnhanced&&(b.special||b.formation||b.duo||b.blast&&this.skillTime>0))mult*=1.3;
  return mult;
 };
 Game.prototype.beginRevisionFrame=function(dt,input={}){
  this.ensureRevisionPilot();const world=this.combatWorld();
  const nearby=this.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-this.x,e.y-this.y)<400).length;
  const wolf=this.pilot==='voss'?Math.min(6,nearby)*.04:0,udet=this.pilot==='udet'?Math.max(0,100-this.hp)/100:0,eagle=this.eagleTime>0?.2:0;
  this.revisionDamageMult=1+wolf+udet*.5+eagle;
  const yaw=Number.isFinite(input.angle)?Math.abs(Math.atan2(Math.sin(input.angle-this.a),Math.cos(input.angle-this.a))):Math.abs(input.steer||0);
  if(this.pilot==='hawker')this.straightCharge=Math.max(0,Math.min(1,(this.straightCharge||0)+(yaw<.12?dt/3:-dt*2)));
  const prior={baseSpeed:this.baseSpeed,speed:this.speed,turn:this.turn,rate:this.rate,unlimitedAmmo:this.unlimitedAmmo};
  const mobility=1+wolf+udet*.3+eagle+(this.pilot==='hawker'?(this.straightCharge||0)*.2:0);
  this.baseSpeed=(this.baseSpeed||this.speed)*mobility;this.speed*=mobility;this.turn*=1+wolf+udet*.3+eagle;
  this.rate/=(1+eagle)*(this.pilot==='hawker'&&this.skillTime>0?2:1);
  if(this.pilot==='hawker'&&this.skillTime>0)this.unlimitedAmmo=true;
  this.eagleTime=Math.max(0,(this.eagleTime||0)-dt);
  if(this.pilot==='voss'&&this.skillTime>0){this.decoyTimer=(this.decoyTimer||0)-dt;if(this.decoyTimer<=0){this.decoyTimer=.16;world.revisionDecoys??=[];world.revisionDecoys.push({x:this.x,y:this.y,a:this.a,plane:this.plane,pilot:this.pilot,ownerId:this.id,life:1.2,hp:1,decoy:true});}}
  if(this.pilot==='guynemer'){this.passiveCannonTimer=(this.passiveCannonTimer??0)-dt;if(this.passiveCannonTimer<=0){this.passiveCannonTimer=4;this.bullets.push({x:this.x,y:this.y,vx:Math.cos(this.a)*460,vy:Math.sin(this.a)*460,life:2.8,ownerId:this.id,enemy:false,motorCannon:true,pierce:true,collisionRadius:18,damage:this.payloadPower(90),hit:new Set()});}}
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
 Game.prototype.supportAuraAt=function(unit){return (this.players||[this]).some(p=>p.hp>0&&p.pilot==='boelcke'&&Math.hypot(p.x-unit.x,p.y-unit.y)<360)?1.25:1};
 Game.prototype.supportPower=function(base){const world=this.combatWorld();const leaders=world.players||[this];return support.call(this,base)*(leaders.some(p=>p.hp>0&&p.pilot==='boelcke'&&Math.hypot(p.x-this.x,p.y-this.y)<360)?1.25:1)};
 // World-wide admission is checked before any legacy factory mutates an entity.
 Game.prototype.enemyCapacity=function(){return this.mode==='campaign'?65:this.mode==='coop2'?28:22};
 Game.prototype.isOpeningCountryside=function(){return this.mode!=='campaign'&&this.worldRegion()===0&&(this.stageBoss?.stages.loopIndex??0)===0&&this.t<120};
 Game.prototype.regularEnemyLimit=function(){if(this.stageBoss?.stages.phase==='boss')return this.mode==='coop2'?12:9;return this.mode==='coop2'?19:15};
 Game.prototype.regularSpawnInterval=function(){const interval=this.isOpeningCountryside()?(this.mode==='coop2'?REVISION_BALANCE.countrysideCoopInterval:REVISION_BALANCE.countrysideInterval):(this.mode==='coop2'?REVISION_BALANCE.coopInterval:REVISION_BALANCE.interval);return this.stageBoss?.stages.phase==='boss'?interval/0.75:interval};
 Game.prototype.aircraftMix=function(faction,time=this.t){
  const phase=time<120?0:time<300?1:time<480?2:3;
  const pools=faction==='central'?
   [['eindecker','eindecker','eindecker','albatros_d2'],['eindecker','albatros_d2','albatros_d2','pfalz_d3a'],['eindecker','albatros_d2','pfalz_d3a','pfalz_d3a','fokkerd7'],['eindecker','albatros_d2','fokkerd7','pfalz_d3a','fokkerd7']]:
   [['airco_dh2','airco_dh2','airco_dh2','nieuport24'],['airco_dh2','nieuport24','nieuport24','camel'],['airco_dh2','nieuport24','camel','camel','se5a'],['airco_dh2','nieuport24','camel','se5a','spad']];
  return [...pools[phase]];
 };
 Game.prototype.friendlyAircraftMix=function(faction){const pool=WING_PLANES[faction];return pool?[...pool]:this.aircraftMix(faction,this.t)};
 Game.prototype.queueBossLevel=function(){this.bossLevelRewards=(this.bossLevelRewards||0)+1};
 Game.prototype.resolveBossLevels=function(){
  if(!this.bossLevelRewards||this.state!=='playing')return false;
  if(this.players){while(this.bossLevelRewards>0){for(const p of this.players)p.xp+=p.need;this.bossLevelRewards--;this.queueLevels()}return true}
  this.xp+=this.need;this.bossLevelRewards--;this.checkLevel();return true;
 };
 Game.prototype.spawnComposition=function(){const r=this.rng(),t=this.t;return t<120?(r<.85?'scout':'hunter'):t<300?(r<.35?'scout':r<.85?'hunter':'bomber'):t<480?(r<.65?'hunter':r<.95?'bomber':'zeppelin'):(r<.55?'hunter':r<.88?'bomber':r<.97?'zeppelin':'heavyBomber')};
 Game.prototype.canSpawnRevision=function(type){
  if(this.mode==='campaign')return true;
  const live=this.enemies.filter(e=>e.hp>0);const reserved=this.stageBoss?.stages.phase==='boss'?Math.max(0,2-live.filter(e=>e.stageBossBody).length):0,aceReserve=type==='boss'?0:1;if(live.length+reserved+aceReserve>=this.enemyCapacity())return false;
  const regularAircraft=live.filter(e=>!e.bossPilot&&!e.heavyBomber&&['scout','hunter','bomber'].includes(e.type));
  if(!this.bossMechanicSpawn&&['scout','hunter','bomber'].includes(type)&&regularAircraft.length>=this.regularEnemyLimit())return false;
  if(type==='zeppelin'&&live.some(e=>e.type==='zeppelin'))return false;
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

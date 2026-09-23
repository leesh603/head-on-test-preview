// Augmentation catalog revision 150. Display data mirrors the live 강화정리 sheet;
// legacy ids stay stable so existing runs and local saves remain compatible.
export const AUGMENTATION_OVERHAUL_BALANCE=Object.freeze({
 rarity:Object.freeze({normal:.60,magic:.28,rare:.09,unique:.03}),
 mercedesBaseSpeed:1.08,mercedesMaxSpeed:1.30,mercedesRamp:1.8,mercedesDecay:.72,redScarfSpeed:1.45,redScarfRange:1.25,redScarfLockTime:.65,
 repairInterval:10,repairFraction:.20,frontDamageReduction:.75,jCapsuleBullet:.70,jCapsuleHandling:.90,
 cowlingRange:260,cowlingDamage:1.25,cowlingMinReceived:.80,
 scarffInterval:.72,scarffDamage:8,scarffRange:560,scarffTurnRate:66*Math.PI/180,
 telescopeTurnRate:.90,telescopeBudget:.30,telescopeCone:.36,telescopeWindow:.80,telescopeRange:620,
 mauserInterval:.45,mauserDamage:10,mauserEliteMultiplier:3,mauserAceMultiplier:10,mauserAngle:.55,mauserRange:420,
 rankinInterval:3.2,rankinRange:500,rankinRearArcDegrees:220,rankinDamage:32,
 smokeInterval:12,smokeDuration:3,compassRadius:480,pridoBelt:1.75,pridoReload:.65,
 amatolRadiusMultiplier:1.4,amatolDamageMultiplier:1.4
});

export const BUILD_IDENTITIES=Object.freeze({GUN:'GUN',SPEED:'SPEED',EXPLOSIVE:'EXPLOSIVE',FORMATION:'FORMATION',SURVIVAL:'SURVIVAL'});
export const BUILD_IDENTITY_LIMIT=3;
const BUILD_IDENTITY_BY_ID=Object.freeze({
 damage:'GUN',rate:'GUN',spread:'GUN',turn:'SPEED',mercedesEngine:'SPEED',rockets:'EXPLOSIVE',mines:'EXPLOSIVE',explosives:'EXPLOSIVE',combinedProjectiles:'EXPLOSIVE',
 command:'FORMATION',wingman:'FORMATION',bomber:'FORMATION',fighterSupply:'FORMATION',armor:'SURVIVAL',regen:'SURVIVAL',cooldown:'SURVIVAL',
 amatolCharge:'EXPLOSIVE',lufberyCircle:'FORMATION',redScarf:'SPEED',prancingHorse:'SPEED',ironCross:'SURVIVAL',telescope:'GUN',flightGloves:'GUN',sparkPlug:'SURVIVAL',goeringBaton:'FORMATION',
 immelmannManual:'SPEED',motorCannon:'EXPLOSIVE',loEmblem:'GUN',sacredCowling:'SPEED',steelPlate:'SURVIVAL',mauserAceKiller:'GUN',rearGunner:'GUN',quadLewis:'GUN',cow37:'GUN',rankinShell:'SURVIVAL',kaiserFog:'SURVIVAL',fogCompass:'SURVIVAL',maximBelt:'GUN'
});
export const buildIdentityFor=id=>BUILD_IDENTITY_BY_ID[id]||null;
const committedIdentities=g=>new Set(Object.keys(g.upgrades||{}).filter(id=>g.upgrades[id]).map(buildIdentityFor).filter(Boolean));
const identityAllowed=(g,id)=>{const identity=buildIdentityFor(id),committed=committedIdentities(g);return !identity||committed.has(identity)||committed.size<BUILD_IDENTITY_LIMIT};

const STANDARD=[
 ['damage','특제 철갑탄 개조'],['rate','고속 싱크로나이즈 기어'],['rockets','르 프리외르 로켓 발사대'],
 ['mines','수류탄 투척 장비'],['explosives','고품질 화약 개량'],['command','편대 비행 교범'],
 ['turn','적층 목재 프로펠러'],['armor','합판 모노코크 동체'],['regen','정비공의 오일 펌프'],['cooldown','훈장 수여'],['wingman','편대기 합류']
];
const UNIQUE=[
 ['bomber','폭격 요청 통신비둘기'],['fighterSupply','신형 전투기 보급'],['mercedesEngine','고출력 메르세데스 엔진'],
 ['spread','광역 탄막 사격 장치'],['combinedProjectiles','복합 투사체 분배기']
];
const SPECIAL=[
 ['amatolCharge','아마톨 고폭 장약','폭발 피해·실제 피해 반경 +40%. 폭발 격추 시 원 폭발 피해의 30%로 2차 파편폭발 발생. 2차 폭발은 연쇄하지 않습니다.'],
 ['lufberyCircle','루프베리 서클','상시 편대기 1/2/3/4대 이상일 때 받는 피해 −20/25/30/35%. 상호 엄호 대형으로 전환합니다.'],
 ['redScarf','붉은남작의 머플러','이동 속도가 증가하고 적 후방 추적 판정 거리와 고정 시간이 개선됩니다.'],
 ['prancingHorse','바라카의 검은 말 문장','이동 속도 +20%, 전방에서 받는 피해 −25%. 문장은 방어 발동 순간에만 나타납니다.'],
 ['ironCross','푸르 르 메리트','파일럿 액티브가 강화되고 재사용 대기시간이 20% 감소합니다.'],
 ['telescope','르네 퐁크의 망원경','전방 약 21° 안의 적을 초점 포착하여 초기 0.8초 동안 최대 17° 조준 보정. 보정 궤적과 표적 표시가 나타납니다.'],
 ['flightGloves','빌리비숍의 비행장갑','모든 무기 발사 간격 −40% · 재장전 시간 −55% (파일럿 액티브 재사용 대기시간 제외).'],
 ['sparkPlug','맥커든의 비상수선키트','10초마다 최대 내구도의 20%를 회복합니다.'],
 ['goeringBaton','전투비행대 총동원령','상시 윙맨 +3, 윙맨 피해 +25%.'],
 ['immelmannManual','임멜만의 기동전술 교본','선회기동 재사용 대기시간 −50%, 기동 무적 1.05초.'],
 ['motorCannon','기네메르의 37mm 모퇴르 카농','3초마다 전방으로 거대한 37mm 관통탄을 발사합니다. 고품질 화약 개량이 적용됩니다.'],
 ['loEmblem','LO! 페인팅 엠블럼','최대 내구도 −50%, 기관총·폭발물·편대 피해 +30%, 편대 연사 +30%, 이동 속도·선회력 +20%.'],
 ['sacredCowling','황제의 얼굴 카울링','근거리 적에게 주는 피해 +25%. 적이 가까울수록 받는 탄환 피해가 최대 20% 감소합니다.'],
 ['steelPlate','J형 장갑 캡슐','기관총·소구경 탄환 피해 −30%, 이동 속도·선회력 −10%.'],
 ['mauserAceKiller',"마우저 C96 ‘에이스 킬러’",'0.45초마다 420 범위 자동 조준. 일반 10, 정예 30, 적 에이스 100 피해. 후반 회차에는 피해와 발사 빈도가 완만히 상승합니다.'],
 ['boelckeDicta','뵐케의 금언집','경험치 획득량 +30%. 협동에서는 보유자에게만 적용됩니다.'],
 ['rearGunner','스카프링 총좌','기본 기관총 사격 방향이 초당 약 66°로 회전합니다. 완전 후방 조준 약 2.7초. 총기 수·탄약 소모는 유지됩니다.'],
 ['quadLewis','쿼드 루이스 기관총','일반 발사체 상한을 넘어 총구별 기관총 탄환 +4.'],
 ['cow37','COW 37MM 기관포','기존 기관총을 교체합니다. 발사 간격 1초, 기본 피해 280, 탄창 24발, 재장전 4.6초.'],
 ['rankinShell','랭킨 대공 파편탄','3.2초마다 후방 220°·500 범위의 적 탄환을 제거하고 파편 피해를 줍니다.'],
 ['kaiserFog','브록식 연막장치','12초마다 3초간 연막에 숨어 적 추적에서 제외되고 어그로가 초기화됩니다.'],
 ['fogCompass','C-O 5/17 에어로 컴퍼스','경험치와 수리 아이템의 획득 반경이 크게 증가합니다.'],
 ['maximBelt','프리도 연속 급탄 링크','기관총 탄띠 용량이 증가하고 재장전 시간이 감소합니다.']
];

const tierIndex=rarity=>rarity==='rare'?2:rarity==='magic'?1:0;
const uniqueIds=new Set(UNIQUE.map(([id])=>id));
const standardIds=new Set(STANDARD.map(([id])=>id));
const specialIds=new Set(SPECIAL.map(([id])=>id));

export function installAugmentationOverhaul(Game,PLANES,PILOTS,UPGRADES,LEGENDARIES,TAILING_BALANCE,angleDiff,DURABILITY_BALANCE,AUGMENT_BALANCE,LEGENDARY_BALANCE,COW37_BALANCE){
 const names=new Map([...STANDARD,...UNIQUE,...SPECIAL.map(([id,name])=>[id,name])]);
 const specialDescription=new Map(SPECIAL.map(([id,,desc])=>[id,desc]));
 const byId=new Map();
 for(const item of UPGRADES)if(names.has(item.id)&&!byId.has(item.id))byId.set(item.id,item);
 for(const [id,name] of [...STANDARD,...UNIQUE]){
  const item=byId.get(id)||{id,apply:()=>{}};Object.assign(item,{name,legendary:false,uniqueOnly:uniqueIds.has(id),rareOnly:id==='wingman'});byId.set(id,item);
 }
 LEGENDARIES.splice(0,LEGENDARIES.length,...SPECIAL.map(([id,name,desc])=>({id,name,desc})));
 for(const item of LEGENDARIES)byId.set(item.id,{...item,legendary:true,uniqueOnly:false,apply:()=>{}});
 UPGRADES.splice(0,UPGRADES.length,...[...STANDARD,...UNIQUE].map(([id])=>byId.get(id)),...LEGENDARIES.map(item=>byId.get(item.id)));

 const description=function(id,rarity='normal',g){
  if(specialDescription.has(id))return specialDescription.get(id);const t=tierIndex(rarity),extra=[0,8,16][t];
  return ({
   damage:`기관총 피해 +${[18,27,36][t]}%.`,rate:`기관총 발사 간격 −${[10,14,20][t]}% (최소 0.045초).`,
   rockets:`르 프리외르 로켓 발사대 +1단계 (최대 5).${extra?` 폭발물 피해 +${extra}%p.`:''}`,
   mines:`후방 수류탄 투척 장비 +1단계 (최대 5).${extra?` 폭발물 피해 +${extra}%p.`:''}`,
   explosives:`로켓·수류탄·폭탄·37mm 포탄 등 모든 폭발물 피해 +${[30,50,75][t]}%p.`,
   command:`윙맨과 편대 액티브의 피해·공격 속도 +${[30,50,75][t]}%p.`,
   turn:`선회력 +${[20,32,45][t]}%, 이동 속도 +${[5,8,12][t]}%, 직선 비행 회복 +${[8,12,18][t]}% (누적 상한: 선회 +150%, 이속 +40%, 회복 +60%).`,
   armor:`최대 내구도 +${DURABILITY_BALANCE.armorBonus[t]}. 증가량만큼 즉시 회복.`,
   regen:`초당 최대 내구도 회복 +${DURABILITY_BALANCE.regenPerSecond[t]*100}% (누적 상한 4%).`,
   cooldown:`액티브 재사용 대기시간 −${[8,12,16][t]}% (기본의 50%까지).`,
   bomber:`${Math.max(10,18-(g?.bomberLevel||0)*2)}초마다 폭격기 1대가 폭탄 5발을 투하합니다. 중복 시 주기 2초 감소 (최소 10초).`,
   wingman:'상시 편대기 +1. 한 출격 최대 2회 (전체 최대 7대).',fighterSupply:'현재와 이후 합류하는 상시 편대기를 상위 기종으로 변경. 편대 피해 +20%, 발사 간격 −10%. 기체 수는 유지됩니다.',mercedesEngine:'기본 이동 속도 +8%. 직선 비행을 유지하면 최대 +30%까지 상승하며, 급선회 시 출력이 감소합니다.',
   spread:'기관총 발사체 +1 (최대 5발). 추가 발사체는 탄약을 더 소모하지 않습니다.',
   combinedProjectiles:'로켓과 수류탄의 동시 발사체 +1 (각 최대 5발).'
  })[id]||'';
 };
 for(const u of UPGRADES){u.desc=description(u.id,u.uniqueOnly?'unique':'normal');u.buildIdentity=buildIdentityFor(u.id)}
 Game.prototype.augmentationDescription=description;

 Game.prototype.legendaryCount=function(){return LEGENDARIES.reduce((n,u)=>n+(this.upgrades[u.id]?1:0),0)};
 Game.prototype.legendaryChance=function(){return Math.min(.5,Math.max(.05,(this.level||1)*.05))};
 const namedSpecial=(g,u)=>({...u,name:u.id==='ironCross'?(PLANES[g.plane]?.faction==='entente'?'빅토리아 십자훈장 · Victoria Cross':'푸르 르 메리트 · Pour le Mérite'):u.name,legendary:true,rarity:'legendary'});
 const specialAllowed=function(g,u){return !g.upgrades[u.id]&&(u.id!=='rearGunner'||!g.weapon.bidirectional&&!g.rearGunner)&&!(u.id==='cow37'&&(g.upgrades.quadLewis||g.upgrades.maximBelt))&&!(u.id==='quadLewis'&&g.upgrades.cow37)&&!(u.id==='maximBelt'&&g.upgrades.cow37)};
 const normalAllowed=function(g,u,rarity){
  if(!u||u.legendary||specialIds.has(u.id))return false;
  if(u.uniqueOnly?rarity!=='unique':u.rareOnly?rarity!=='rare':rarity==='unique')return false;
  if(!identityAllowed(g,u.id))return false;
  return (u.id!=='spread'||g.shots<5)&&(u.id!=='combinedProjectiles'||(g.projectileDistributorLevel||0)<4)&&(u.id!=='wingman'||(g.upgrades.wingman||0)<2&&(g.permanentWingman||0)<7)&&
   (u.id!=='fighterSupply'||!g.upgrades.fighterSupply)&&(u.id!=='mercedesEngine'||!g.upgrades.mercedesEngine)&&(u.id!=='rockets'||g.rockets<5)&&(u.id!=='mines'||g.mineCount<5)&&(u.id!=='bomber'||(g.bomberLevel||0)<5)&&
   (u.id!=='regen'||(g.regen||0)<DURABILITY_BALANCE.regenCap-1e-9)&&(u.id!=='rate'||g.rate>.045+1e-9)&&(u.id!=='cooldown'||g.cooldownMult>.5+1e-9)&&
   (u.id!=='turn'||(g.turnUpgradeBonus||0)<AUGMENT_BALANCE.turnCap-1e-9||(g.speedUpgradeBonus||0)<AUGMENT_BALANCE.speedCap-1e-9)&&
   (u.id!=='explosives'||g.rockets||g.mineCount||g.bomberLevel||g.motorCannon||g.cow37||g.upgrades.rankinShell||g.legendaryMineTrail||['bishop','guynemer'].includes(g.pilot))&&
   (u.id!=='command'||g.permanentWingman||['goering','collishaw','mannock'].includes(g.pilot));
 };
 const shuffledPick=(g,pool)=>pool.length?pool[Math.floor(g.rng()*pool.length)]:null;
 const normalPick=function(g,rarity,picks,previous=[]){const used=new Set(picks.map(u=>u.id)),eligible=UPGRADES.filter(u=>!used.has(u.id)&&normalAllowed(g,u,rarity)),fresh=eligible.filter(u=>!previous.includes(u.id));return shuffledPick(g,fresh.length?fresh:eligible)};
 Game.prototype.rollChoices=function(){
  const choiceCount=3;
  const picks=[];for(let slot=0;slot<choiceCount;slot++){
   const r=this.rng();let rarity=r<AUGMENTATION_OVERHAUL_BALANCE.rarity.normal?'normal':r<AUGMENTATION_OVERHAUL_BALANCE.rarity.normal+AUGMENTATION_OVERHAUL_BALANCE.rarity.magic?'magic':r<1-AUGMENTATION_OVERHAUL_BALANCE.rarity.unique?'rare':'unique';
   let u=normalPick(this,rarity,picks,this.lastChoices||[]);if(!u)for(const fallback of ['normal','magic','rare','unique']){if(fallback===rarity)continue;u=normalPick(this,fallback,picks,this.lastChoices||[]);if(u){rarity=fallback;break}}if(u)picks.push({...u,rarity});
  }
  const offers=this.legendaryOffers??(this.legendaryOffered?1:0),limit=this.level>=20?4:this.level>=10?2:1,pool=LEGENDARIES.filter(u=>specialAllowed(this,u)&&!(this.seenLegendaries||[]).includes(u.id));
  if(!this.mission?.unarmed&&offers<limit&&this.legendaryCount()<4&&pool.length>=choiceCount&&(this.rng()<this.legendaryChance()||this.level>=(offers===0?5:offers===1?12:22))){
   picks.length=0;for(let i=pool.length-1;i>0;i--){const j=Math.floor(this.rng()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}picks.push(...pool.slice(0,choiceCount).map(u=>namedSpecial(this,u)));this.legendaryOffered=true;this.legendaryOffers=offers+1;this.seenLegendaries??=[];this.seenLegendaries.push(...picks.map(u=>u.id));
  }
  this.lastChoices=picks.map(u=>u.id);this.choiceDraftSerial=(this.choiceDraftSerial||0)+1;this.choiceRerollUsed=false;this.choiceDraftKind=picks.every(u=>u.rarity==='legendary')?'special':'normal';return picks;
 };
 Game.prototype.rerollLegendaryChoices=function(current=[]){
  return this.rerollChoices(current);
 };
 Game.prototype.canRerollChoices=function(current=[]){const state=this.state??this.combatWorld?.()?.state,special=current.length===3&&current.every(u=>(u.rarity||'legendary')==='legendary');return state==='upgrade'&&!this.choiceRerollUsed&&current.length===3&&new Set(current.map(u=>u.id)).size===3&&(this.pilot==='mccudden'||special)};
 Game.prototype.rerollChoices=function(current=[]){
  if(!this.canRerollChoices(current))return null;const special=current.every(u=>(u.rarity||'legendary')==='legendary'),previous=current.map(u=>u.id),picks=[];
  if(special){const eligible=LEGENDARIES.filter(u=>specialAllowed(this,u)),fresh=eligible.filter(u=>!previous.includes(u.id)),source=[...(fresh.length>=3?fresh:eligible)];for(let i=source.length-1;i>0;i--){const j=Math.floor(this.rng()*(i+1));[source[i],source[j]]=[source[j],source[i]]}picks.push(...source.slice(0,3).map(u=>namedSpecial(this,u)))}
  else for(const old of current){let rarity=old.rarity||'normal',u=normalPick(this,rarity,picks,previous);if(!u)for(const fallback of ['normal','magic','rare','unique']){if(fallback===rarity)continue;u=normalPick(this,fallback,picks,previous);if(u){rarity=fallback;break}}if(u)picks.push({...u,rarity})}
  if(picks.length!==3||new Set(picks.map(u=>u.id)).size!==3)return null;this.choiceRerollUsed=true;this.lastChoices=picks.map(u=>u.id);if(special){this.seenLegendaries??=[];this.seenLegendaries.push(...picks.map(u=>u.id))}return picks;
 };

 Game.prototype.upgrade=function(id,rarity='normal'){
  if(this.state!=='upgrade')return false;const u=UPGRADES.find(x=>x.id===id),limit=4;
  if(!u||u.rareOnly&&rarity!=='rare'||u.uniqueOnly&&rarity!=='unique'||!u.uniqueOnly&&!u.legendary&&!['normal','magic','rare'].includes(rarity)||u.legendary&&(rarity!=='legendary'||!specialAllowed(this,u)||this.legendaryCount()>=limit))return false;
  if(!u.legendary&&!identityAllowed(this,id))return false;
  if((id==='rate'&&this.rate<=.045+1e-9)||(id==='rockets'&&this.rockets>=5)||(id==='mines'&&this.mineCount>=5)||(id==='regen'&&(this.regen||0)>=DURABILITY_BALANCE.regenCap-1e-9)||(id==='cooldown'&&this.cooldownMult<=.5+1e-9)||(id==='turn'&&(this.turnUpgradeBonus||0)>=AUGMENT_BALANCE.turnCap-1e-9&&(this.speedUpgradeBonus||0)>=AUGMENT_BALANCE.speedCap-1e-9))return false;
  if((id==='bomber'&&(this.bomberLevel||0)>=5)||(id==='wingman'&&((this.permanentWingman||0)>=7||(this.upgrades.wingman||0)>=2))||(id==='fighterSupply'&&this.upgrades.fighterSupply)||(id==='mercedesEngine'&&this.upgrades.mercedesEngine)||(id==='spread'&&this.shots>=5)||(id==='combinedProjectiles'&&(this.projectileDistributorLevel||0)>=4))return false;
  this.buildBaseline??={rate:this.rate,maxHp:this.maxHp,speed:this.baseSpeed||this.speed,turn:this.turn};
  const t=tierIndex(rarity),ratio=this.maxHp?this.hp/this.maxHp:1;
  switch(id){
   case 'damage':this.addGunBonus(AUGMENT_BALANCE.damage[t]);break;
   case 'rate':this.rate=Math.max(.045,this.rate*(1-[.10,.14,.20][t]));break;
   case 'rockets':this.rockets=Math.min(5,(this.rockets||0)+1);this.rocketFire=0;this.explosiveBonus=(this.explosiveBonus||0)+[0,.08,.16][t];break;
   case 'mines':this.mineCount=Math.min(5,(this.mineCount||0)+1);this.mineTimer=0;this.explosiveBonus=(this.explosiveBonus||0)+[0,.08,.16][t];break;
   case 'explosives':this.explosiveBonus=(this.explosiveBonus||0)+AUGMENT_BALANCE.support[t];break;
   case 'command':this.commandBonus=(this.commandBonus||0)+AUGMENT_BALANCE.support[t];this.commandRateBonus=(this.commandRateBonus||0)+AUGMENT_BALANCE.support[t];break;
   case 'turn':this.addMobility(t);break;
   case 'armor':this.maxHp+=DURABILITY_BALANCE.armorBonus[t];if(this.hp>0)this.hp=Math.min(this.maxHp,this.hp+DURABILITY_BALANCE.armorBonus[t]);break;
   case 'regen':this.regen=Math.min(DURABILITY_BALANCE.regenCap,(this.regen||0)+DURABILITY_BALANCE.regenPerSecond[t]);break;
   case 'cooldown':this.cooldownMult=Math.max(.5,this.cooldownMult*(1-[.08,.12,.16][t]));break;
   case 'bomber':this.bomberLevel=Math.min(5,(this.bomberLevel||0)+1);this.bomberTimer=Math.min(this.bomberTimer??2,2);break;
   case 'wingman':this.permanentWingman=Math.min(7,(this.permanentWingman||0)+1);break;
   case 'fighterSupply':{const plane=PLANES[this.plane].faction==='central'?'fokkerd7':'camel';for(const wing of this.combatWorld().allies||[])if(wing.permanent&&(!this.id||wing.ownerId===this.id))wing.plane=plane;break;}
   case 'amatolCharge':case 'lufberyCircle':break;
   case 'mercedesEngine':this.enemyCruiseReference??=this.baseSpeed??this.speed;this.speed*=AUGMENTATION_OVERHAUL_BALANCE.mercedesBaseSpeed;if(this.baseSpeed)this.baseSpeed*=AUGMENTATION_OVERHAUL_BALANCE.mercedesBaseSpeed;this.mercedesOutput160=0;this.mercedesHeading160=this.a;break;
   case 'spread':this.shots=Math.min(5,(this.shots||1)+1);this.freeVolleyShots=(this.freeVolleyShots||0)+1;break;
   case 'combinedProjectiles':this.projectileDistributorLevel=Math.min(4,(this.projectileDistributorLevel||0)+1);break;
   case 'redScarf':this.enemyCruiseReference??=this.baseSpeed??this.speed;this.speed*=AUGMENTATION_OVERHAUL_BALANCE.redScarfSpeed;if(this.baseSpeed)this.baseSpeed*=AUGMENTATION_OVERHAUL_BALANCE.redScarfSpeed;this.redScarf=true;break;
   case 'prancingHorse':this.speed*=1.2;if(this.baseSpeed)this.baseSpeed*=1.2;this.prancingHorse=true;break;
   case 'ironCross':this.skillEnhanced=true;this.cooldownMult=Math.max(.5,this.cooldownMult*.8);break;
   case 'telescope':this.telescope=true;break;
   case 'flightGloves':this.rate=Math.max(.045,this.rate*.6);this.weapon.reload=Math.max(.45,this.weapon.reload*.45);this.reloadTime=Math.min(this.reloadTime,this.weapon.reload);break;
   case 'sparkPlug':this.mccuddenRepair=true;this.mccuddenRepairTimer=AUGMENTATION_OVERHAUL_BALANCE.repairInterval;break;
   case 'goeringBaton':this.permanentWingman=Math.min(7,(this.permanentWingman||0)+3);this.wingmanDamageMult=LEGENDARY_BALANCE.wingmanDamageMultiplier;break;
   case 'immelmannManual':this.evadeCooldownMult=.5;this.evadeInvulnerability=1.05;this.evadeCooldown=Math.min(this.evadeCooldown,4);break;
   case 'motorCannon':this.motorCannon=true;this.motorCannonTimer=0;break;
   case 'loEmblem':this.maxHp*=.5;this.hp=this.maxHp*ratio;this.addGunBonus(.30);this.explosiveBonus=(this.explosiveBonus||0)+.30;this.commandBonus=(this.commandBonus||0)+.30;this.commandRateBonus=(this.commandRateBonus||0)+.30;this.turn*=1.2;this.speed*=1.2;if(this.baseSpeed)this.baseSpeed*=1.2;break;
   case 'sacredCowling':this.sacredCowling=true;break;
   case 'steelPlate':this.jArmorCapsule=true;this.speed*=.9;this.turn*=.9;if(this.baseSpeed)this.baseSpeed*=.9;break;
   case 'mauserAceKiller':this.mauserAceKiller=true;this.mauserTimer=.1;break;
   case 'boelckeDicta':this.xpGainMult=(this.xpGainMult||1)*1.30;break;
   case 'rearGunner':this.scarffRing=true;this.scarffAim=this.a;this.scarffTimer=.1;break;
   case 'quadLewis':this.shots=(this.shots||1)+4;break;
   case 'cow37':this.cow37=true;this.unlimitedAmmo=false;this.cow37Timer=.15;this.weapon={name:'COW 37mm 기관포',caliber:'37 mm',guns:1,belt:COW37_BALANCE.belt,rpm:Math.round(60/COW37_BALANCE.interval),reload:COW37_BALANCE.reload};this.ammo=[COW37_BALANCE.belt];this.reloadTime=0;this.fire=0;break;
   case 'rankinShell':this.rankinShrapnel=true;this.rankinShrapnelTimer=AUGMENTATION_OVERHAUL_BALANCE.rankinInterval;break;
   case 'kaiserFog':this.brockSmoke=true;this.brockSmokeTimer=AUGMENTATION_OVERHAUL_BALANCE.smokeInterval;this.kaiserFogTime=0;break;
   case 'fogCompass':this.magnet=Math.max(this.magnet,AUGMENTATION_OVERHAUL_BALANCE.compassRadius);break;
   case 'maximBelt':{const old=this.weapon.belt,thisBase=this.baseBeltCapacity??old,next=Math.round(thisBase*AUGMENTATION_OVERHAUL_BALANCE.pridoBelt);this.baseBeltCapacity=thisBase;this.weapon.belt=Math.max(old,next);this.ammo=this.ammo.map(n=>Math.min(this.weapon.belt,n+this.weapon.belt-old));this.weapon.reload=Math.max(.45,this.weapon.reload*AUGMENTATION_OVERHAUL_BALANCE.pridoReload);break;}
  }
  if(u.legendary)this.equipmentAcquire156={id,life:.5,maxLife:.5};
  this.upgradeRarities??={};this.upgradeRarities[id]=rarity;this.upgrades[id]=(this.upgrades[id]||0)+1;this.state='playing';this.checkLevel();return true;
 };

 Game.prototype.ordnanceInterval=function(interval){return interval*(this.upgrades?.flightGloves?.6:1)};
 Game.prototype.explosionRadius=function(radius){return radius*(this.upgrades?.amatolCharge?AUGMENTATION_OVERHAUL_BALANCE.amatolRadiusMultiplier:1)};
 Game.prototype.explosionDamage=function(damage,{secondaryExplosion=false}={}){return damage*(this.upgrades?.amatolCharge&&!secondaryExplosion?AUGMENTATION_OVERHAUL_BALANCE.amatolDamageMultiplier:1)};
 Game.prototype.queueExplosionDamage=function(x,y,baseRadius,damage,{secondaryExplosion=false,exclude=null,grenade=false}={}){
  const world=this.combatWorld(),radius=this.explosionRadius(baseRadius),baseDamage=damage,finalDamage=this.explosionDamage(damage,{secondaryExplosion}),amatol=!!this.upgrades?.amatolCharge;
  if(grenade){world.combatFX??=[];world.combatFX.push({x,y,radius,side:'friendly',grenade:true,amatol,secondaryExplosion,life:secondaryExplosion?.24:.32,maxLife:secondaryExplosion?.24:.32});world.event('explosion','friendly')}else world.combatBlast(x,y,radius,'friendly');
  if(amatol){const fx=world.combatFX?.at(-1);if(fx){fx.amatol=true;fx.secondaryExplosion=secondaryExplosion;fx.fragmentSecondary=secondaryExplosion}}
  const hit=new Set();if(exclude)hit.add(exclude);
  world.bullets.push({x,y,vx:0,vy:0,life:.15,enemy:false,ownerId:this.id,damage:finalDamage,hit,pierce:true,blast:true,actualExplosion:true,collisionRadius:radius,explosionRadius:radius,explosionDamage:finalDamage,explosionBaseDamage:baseDamage,explosionBaseRadius:baseRadius,secondaryExplosion,fragmentSecondary:secondaryExplosion,grenadeExplosion:grenade});
  return radius;
 };
 Game.prototype.spawnAmatolSecondary=function(victim,source){
  if(!this.upgrades?.amatolCharge||!source?.actualExplosion||source.secondaryExplosion||source.fragmentSecondary)return false;
  source.amatolSecondaryVictims??=new Set();if(source.amatolSecondaryVictims.has(victim))return false;source.amatolSecondaryVictims.add(victim);
  this.queueExplosionDamage(victim.x,victim.y,Math.max(24,(source.explosionBaseRadius||60)*.6),(source.explosionBaseDamage??source.explosionDamage??source.damage)*.3,{secondaryExplosion:true,grenade:!!source.grenadeExplosion});return true;
 };
 Game.prototype.launchUpgradeRocket=function(){
  const base=Math.max(1,Math.min(5,this.rockets||1)),count=Math.min(5,base+(this.projectileDistributorLevel||0));this.rocketFire=this.ordnanceInterval(2.6/(1+base*.3));const speed=520,spread=.075;
  for(let i=0;i<count;i++){const a=this.a+(i-(count-1)/2)*spread,damage=this.payloadPower(78+(base-1)*4);this.bullets.push({x:this.x+Math.cos(a)*30,y:this.y+Math.sin(a)*30,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:this.longRange?this.shotLifetime(speed):2.4,enemy:false,ownerId:this.id,damage,rocket:true,upgradeRocket:true,explosionDamage:damage,explosionBaseRadius:84,collisionRadius:12,hit:new Set()})}this.burst(this.x+Math.cos(this.a)*25,this.y+Math.sin(this.a)*25,'#ffcf83',8+count);
 };

 Game.prototype.updateTailLock=function(dt){
  const clear=()=>{this.tailTargetId=null;this.tailLocked=false;this.tailProgress=0;this.tailGraceRemaining=0};
  if(this.hp<=0||this.status&&this.status!=='alive'){clear();return}
  const eligible=e=>this.tailEligible(e)&&!e.missionTarget,range=this.redScarf?AUGMENTATION_OVERHAUL_BALANCE.redScarfRange:1,lockTime=TAILING_BALANCE.lockTime*(this.redScarf?AUGMENTATION_OVERHAUL_BALANCE.redScarfLockTime:1),within=(e,min,max,rearCone,aimCone)=>{const dx=e.x-this.x,dy=e.y-this.y,d=Math.hypot(dx,dy);if(d<min||d>max)return false;const behind=Math.abs(angleDiff(Math.atan2(this.y-e.y,this.x-e.x),e.a+Math.PI)),aim=Math.abs(angleDiff(Math.atan2(dy,dx),this.a));return behind<=rearCone&&aim<=aimCone};
  let current=this.tailTargetId?this.enemies.find(e=>e.tailId===this.tailTargetId):null;
  if(this.tailTargetId&&!eligible(current)){clear();current=null}
  if(this.tailLocked&&current){
   if(within(current,TAILING_BALANCE.maintainMinDistance,TAILING_BALANCE.maintainMaxDistance*range,TAILING_BALANCE.maintainRearCone,TAILING_BALANCE.maintainAimCone)){this.tailProgress=lockTime;this.tailGraceRemaining=TAILING_BALANCE.graceTime;return}
   this.tailGraceRemaining=Math.max(0,(this.tailGraceRemaining??TAILING_BALANCE.graceTime)-dt);if(this.tailGraceRemaining>0)return;this.tailLocked=false;
  }
  let target=current&&within(current,TAILING_BALANCE.minDistance,TAILING_BALANCE.maxDistance*range,TAILING_BALANCE.rearCone,TAILING_BALANCE.aimCone)?current:null,best=target?0:Infinity;
  if(!target)for(const e of this.enemies){if(!eligible(e))continue;const dx=e.x-this.x,dy=e.y-this.y,d=Math.hypot(dx,dy);if(!within(e,TAILING_BALANCE.minDistance,TAILING_BALANCE.maxDistance*range,TAILING_BALANCE.rearCone,TAILING_BALANCE.aimCone))continue;const behind=Math.abs(angleDiff(Math.atan2(this.y-e.y,this.x-e.x),e.a+Math.PI)),aim=Math.abs(angleDiff(Math.atan2(dy,dx),this.a)),score=d+behind*90+aim*120;if(score<best){best=score;target=e}}
  if(!target){this.tailLocked=false;this.tailProgress=Math.max(0,(this.tailProgress||0)-dt*TAILING_BALANCE.decay);this.tailGraceRemaining=0;if(this.tailProgress<=0)this.tailTargetId=null;return}
  const id=this.tailIdFor(target);if(this.tailTargetId!==id){this.tailProgress=0;this.tailGraceRemaining=0}this.tailTargetId=id;this.tailProgress=Math.min(lockTime,(this.tailProgress||0)+dt);this.tailLocked=this.tailProgress>=lockTime-1e-9;if(this.tailLocked)this.tailGraceRemaining=TAILING_BALANCE.graceTime;
 };
 Game.prototype.tailLockFraction=function(){const lock=TAILING_BALANCE.lockTime*(this.redScarf?AUGMENTATION_OVERHAUL_BALANCE.redScarfLockTime:1);return Math.max(0,Math.min(1,(this.tailProgress||0)/lock))};
 const oldApply=Game.prototype.applySpecialRound;
 Game.prototype.applySpecialRound=function(round,type){const b=oldApply.call(this,round,type);if(this.telescope&&!b.enemy){b.telescopeGuided=true;b.telescopeStrength=AUGMENTATION_OVERHAUL_BALANCE.telescopeTurnRate;b.telescopeBudget=AUGMENTATION_OVERHAUL_BALANCE.telescopeBudget;b.telescopeAge=0}return b};
 const oldIncoming=Game.prototype.incomingDamageMultiplier;
 Game.prototype.incomingDamageMultiplier=function(source){let mult=oldIncoming.call(this,source);if(this.prancingHorse&&source){const incoming=Math.atan2(source.y-this.y,source.x-this.x);if(Math.abs(angleDiff(incoming,this.a))<Math.PI/2){mult*=AUGMENTATION_OVERHAUL_BALANCE.frontDamageReduction;this.prancingHorseFlash160=.34}}if(this.jArmorCapsule&&source?.bullet&&!source.bullet.flak&&!source.bullet.heavyShell&&!source.bullet.gas)mult*=AUGMENTATION_OVERHAUL_BALANCE.jCapsuleBullet;if(this.sacredCowling&&source?.bullet){const d=Math.hypot(source.x-this.x,source.y-this.y);if(d<AUGMENTATION_OVERHAUL_BALANCE.cowlingRange)mult*=1-(1-AUGMENTATION_OVERHAUL_BALANCE.cowlingMinReceived)*(1-d/AUGMENTATION_OVERHAUL_BALANCE.cowlingRange)}return mult*this.lufberyDamageMultiplier()};
 const oldRound=Game.prototype.roundDamageMultiplier;
 Game.prototype.roundDamageMultiplier=function(b,e){let mult=oldRound.call(this,b,e);if(b.mauserRound&&(e.ace||e.bossPilot||e.type==='boss'))mult*=AUGMENTATION_OVERHAUL_BALANCE.mauserAceMultiplier;if(this.sacredCowling&&Math.hypot(e.x-this.x,e.y-this.y)<=AUGMENTATION_OVERHAUL_BALANCE.cowlingRange)mult*=AUGMENTATION_OVERHAUL_BALANCE.cowlingDamage;return mult};

 const distanceTo=(g,e)=>Math.hypot(e.x-g.x,e.y-g.y);
 const mauserTarget=g=>{
  const range=AUGMENTATION_OVERHAUL_BALANCE.mauserRange,valid=e=>e.hp>0&&distanceTo(g,e)<=range&&!e.stageBossBody&&!e.surface&&!e.missionGround&&!e.navalVessel;
  const normal=g.enemies.filter(valid),ace=normal.filter(e=>e.ace||e.bossPilot||e.type==='boss').sort((a,b)=>distanceTo(g,a)-distanceTo(g,b))[0];if(ace)return ace;
  const elite=(g.eliteEnemies?.members||[]).filter(valid).sort((a,b)=>distanceTo(g,a)-distanceTo(g,b))[0];if(elite)return elite;
  return normal.filter(e=>!e.ace&&!e.bossPilot&&e.type!=='boss').sort((a,b)=>distanceTo(g,a)-distanceTo(g,b))[0];
 };
 const mauserScaling=g=>{const loop=Math.max(0,g.stageBoss?.stages.loopIndex||0),late=Math.min(1.4,Math.max(0,((g.t||0)-120)/360));return{interval:AUGMENTATION_OVERHAUL_BALANCE.mauserInterval/(1+loop*.16+late*.2),damage:AUGMENTATION_OVERHAUL_BALANCE.mauserDamage*(1+loop*.2+late*.28)}};
 const nearest=(g,range=Infinity)=>g.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-g.x,e.y-g.y)<=range).sort((a,b)=>Math.hypot(a.x-g.x,a.y-g.y)-Math.hypot(b.x-g.x,b.y-g.y))[0];
 Game.prototype.tickAugmentationSystems=function(dt){
  this.redGhosts162=(this.redGhosts162||[]).filter(g=>(g.life-=dt)>0);
  if(this.pilot==='baron'&&!this.isRedHunter()&&this.skillTime>0){
   this.redGhostClock162=(this.redGhostClock162||0)+dt;
   if(this.redGhostClock162>=.045){this.redGhostClock162=0;this.redGhosts162.push({x:this.x,y:this.y,a:this.a,life:.32});if(this.redGhosts162.length>8)this.redGhosts162.shift();}
  }

  if(this.equipmentAcquire156)this.equipmentAcquire156.life=Math.max(0,this.equipmentAcquire156.life-dt);
  this.prancingHorseFlash160=Math.max(0,(this.prancingHorseFlash160||0)-dt);
  if(this.upgrades?.mercedesEngine){const previous=Number.isFinite(this.mercedesHeading160)?this.mercedesHeading160:this.a,turnRate=Math.abs(angleDiff(this.a,previous))/Math.max(dt,.001),stable=turnRate<.52&&!(this.evadeTime>0);this.mercedesHeading160=this.a;this.mercedesOutput160=Math.max(0,Math.min(1,(this.mercedesOutput160||0)+(stable?dt/AUGMENTATION_OVERHAUL_BALANCE.mercedesRamp:-dt/AUGMENTATION_OVERHAUL_BALANCE.mercedesDecay)));const extra=AUGMENTATION_OVERHAUL_BALANCE.mercedesMaxSpeed/AUGMENTATION_OVERHAUL_BALANCE.mercedesBaseSpeed-1;this.speed*=1+extra*this.mercedesOutput160;}
  this.telescopeFocus156=Math.max(0,(this.telescopeFocus156||0)-dt);
  if(this.scarffRing){
   let target=this.scarffTarget156;
   if(!target||target.hp<=0||Math.hypot(target.x-this.x,target.y-this.y)>AUGMENTATION_OVERHAUL_BALANCE.scarffRange)target=nearest(this,AUGMENTATION_OVERHAUL_BALANCE.scarffRange);
   this.scarffTarget156=target;const aim=target?Math.atan2(target.y-this.y,target.x-this.x):this.a;
   const current=Number.isFinite(this.scarffAim)?this.scarffAim:this.a,cap=AUGMENTATION_OVERHAUL_BALANCE.scarffTurnRate*Math.max(0,Math.min(.04,dt));
   this.scarffAim=current+Math.max(-cap,Math.min(cap,angleDiff(aim,current)));
  }
  const world=this.combatWorld(),push=b=>{b.ownerId??=this.id;b.enemy=false;b.hit??=new Set();world.bullets.push(b)};
  if(this.mccuddenRepair){this.mccuddenRepairTimer-=dt;if(this.mccuddenRepairTimer<=0){this.mccuddenRepairTimer+=AUGMENTATION_OVERHAUL_BALANCE.repairInterval;const before=this.hp;this.hp=Math.min(this.maxHp,this.hp+this.maxHp*AUGMENTATION_OVERHAUL_BALANCE.repairFraction);if(this.hp>before){this.repairFlash151=.75;this.event('ally','비상수선 · 내구도 20% 회복')}}}
  if(this.mauserAceKiller){this.mauserTimer-=dt;if(this.mauserTimer<=0){const target=mauserTarget(this);if(target){const scaled=mauserScaling(this);this.mauserTimer+=scaled.interval;const a=Math.atan2(target.y-this.y,target.x-this.x);this.mauserAim156=a;this.mauserTarget156=target;this.mauserFlash160=.12;push({x:this.x+Math.cos(a)*16,y:this.y+Math.sin(a)*16,vx:Math.cos(a)*420,vy:Math.sin(a)*420,life:.72,mauserRound:true,mauserTarget:target,specialColor:'#a98cff',damage:scaled.damage})}else this.mauserTimer=.10}}
  this.mauserFlash160=Math.max(0,(this.mauserFlash160||0)-dt);
  if(this.rankinShrapnel){this.rankinShrapnelTimer-=dt;if(this.rankinShrapnelTimer<=0){this.rankinShrapnelTimer+=AUGMENTATION_OVERHAUL_BALANCE.rankinInterval;let removed=0;const half=AUGMENTATION_OVERHAUL_BALANCE.rankinRearArcDegrees*Math.PI/360;for(const b of world.bullets){if(!b.enemy||b.life<=0)continue;const d=Math.hypot(b.x-this.x,b.y-this.y),rear=Math.abs(angleDiff(Math.atan2(b.y-this.y,b.x-this.x),this.a+Math.PI));if(d<=AUGMENTATION_OVERHAUL_BALANCE.rankinRange&&rear<=half){b.life=0;removed++}}for(const e of this.enemies){const d=Math.hypot(e.x-this.x,e.y-this.y),rear=Math.abs(angleDiff(Math.atan2(e.y-this.y,e.x-this.x),this.a+Math.PI));if(e.hp>0&&d<=AUGMENTATION_OVERHAUL_BALANCE.rankinRange&&rear<=half)push({x:e.x,y:e.y,vx:0,vy:0,life:.1,blast:true,damage:this.payloadPower(AUGMENTATION_OVERHAUL_BALANCE.rankinDamage)})}this.rankinFlash=.5;this.event('wave',`랭킨 파편탄 · 후방 탄막 ${removed}발 제거`)}}
  if(this.brockSmoke){this.brockSmokeTimer-=dt;if(this.brockSmokeTimer<=0){this.brockSmokeTimer+=AUGMENTATION_OVERHAUL_BALANCE.smokeInterval;this.kaiserFogTime=AUGMENTATION_OVERHAUL_BALANCE.smokeDuration;for(const e of this.enemies){if(!e.targetPlayerId||e.targetPlayerId===this.id)e.targetPlayerId=null;e.patrolTarget=null;e.fire=Math.max(e.fire||0,.65)}this.event('wave','브록식 연막 · 적 추적 해제')}this.kaiserFogTime=Math.max(0,(this.kaiserFogTime||0)-dt)}
  this.repairFlash151=Math.max(0,(this.repairFlash151||0)-dt);
  this.rankinFlash=Math.max(0,(this.rankinFlash||0)-dt);
 };
 Game.prototype.gunDirection=function(gun=0){
  const base=this.a+(this.weapon.bidirectional&&gun===1?Math.PI:0);
  if(!this.scarffRing)return base;
  return Number.isFinite(this.scarffAim)?this.scarffAim:base;
 };
 Game.prototype.guideTelescope=function(dt){
  for(const b of this.combatWorld().bullets||[]){
   if(!b.telescopeGuided||b.enemy||b.life<=0||b.ownerId!==this.id)continue;
   b.telescopeAge=(b.telescopeAge||0)+dt;
   if(b.telescopeAge>AUGMENTATION_OVERHAUL_BALANCE.telescopeWindow){b.telescopeGuided=false;continue}
   const speed=Math.hypot(b.vx,b.vy),current=Math.atan2(b.vy,b.vx);
   if(!b.telescopeTarget)b.telescopeTarget=this.enemies.filter(e=>e.hp>0&&!b.hit?.has(e)&&Math.hypot(e.x-b.x,e.y-b.y)<AUGMENTATION_OVERHAUL_BALANCE.telescopeRange&&Math.abs(angleDiff(Math.atan2(e.y-b.y,e.x-b.x),current))<AUGMENTATION_OVERHAUL_BALANCE.telescopeCone).sort((a,c)=>Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(c.x-b.x,c.y-b.y))[0];
   const target=b.telescopeTarget;if(!target)continue;
   const error=angleDiff(Math.atan2(target.y-b.y,target.x-b.x),current);
   if(target.hp<=0||b.hit?.has(target)||Math.abs(error)>.50){b.telescopeGuided=false;continue}
   if((b.telescopeBudget??AUGMENTATION_OVERHAUL_BALANCE.telescopeBudget)<=0)continue;
   const cap=Math.min(AUGMENTATION_OVERHAUL_BALANCE.telescopeTurnRate*dt,b.telescopeBudget??AUGMENTATION_OVERHAUL_BALANCE.telescopeBudget),turn=Math.max(-cap,Math.min(cap,error));b.telescopeBudget=(b.telescopeBudget??AUGMENTATION_OVERHAUL_BALANCE.telescopeBudget)-Math.abs(turn);
   this.telescopeFocus156=.12;this.telescopeTarget156=target;
   b.vx=Math.cos(current+turn)*speed;b.vy=Math.sin(current+turn)*speed;
  }
 };
 Game.prototype.throwGrenades=function(){
  const world=this.combatWorld(),count=Math.min(5,1+(this.projectileDistributorLevel||0));
  for(let i=0;i<count;i++){const side=i-(count-1)/2,a=this.a+Math.PI+side*.14;
   (world.grenades??=[]).push({ownerId:this.id,x:this.x,y:this.y,startX:this.x,startY:this.y,targetX:this.x+Math.cos(a)*125,targetY:this.y+Math.sin(a)*125,age:0,flight:.6,fuse:.55,height:0,phase:'flight',damage:this.payloadPower(64)});
  }
 };
 Game.prototype.tickGrenades=function(dt){
  const world=this.combatWorld();
  for(const g of world.grenades||[]){if(g.ownerId!==this.id||g.phase==='exploded')continue;g.age+=dt;
   const f=Math.min(1,g.age/g.flight);g.x=g.startX+(g.targetX-g.startX)*f;g.y=g.startY+(g.targetY-g.startY)*f;g.height=Math.sin(Math.PI*f)*24;
   g.phase=f<1?'flight':'fuse';if(g.age<g.flight+g.fuse)continue;
   g.phase='exploded';this.queueExplosionDamage(g.x,g.y,110,g.damage,{grenade:true});
  }
  world.grenades=(world.grenades||[]).filter(g=>g.phase!=='exploded');
 };
 const oldBegin=Game.prototype.beginRevisionFrame;
 Game.prototype.beginRevisionFrame=function(dt,input={}){
  this.tickAugmentationSystems(dt);const world=this.combatWorld();
  this.guideTelescope(dt);
  return oldBegin.call(this,dt,input);
 };

 // Keep the exported description function used by the UI synchronized without
 // changing its stable import name.
 Game.prototype.upgradeDescription=description;
 for(const [id,p] of Object.entries(PILOTS))if(p?.name&&id==='mccudden')p.augmentationAffinity='sparkPlug';
}

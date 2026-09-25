import {installRevision} from './rebalance103.js?v=327&b=326';
import {installCloudCover} from './cloud-cover1.js?v=327&b=326';
import {installFleet} from './fleet-naval1.js?v=327&b=326';
import {installTrenchWar} from './trench-war1.js?v=327&b=326';
import {installCityAir} from './city-air1.js?v=327&b=326';
import {installRegionDoctrine} from './region-doctrine1.js?v=327&b=326';
import {installAugmentationOverhaul,AUGMENTATION_OVERHAUL_BALANCE,BUILD_IDENTITIES,BUILD_IDENTITY_LIMIT,buildIdentityFor} from './augmentation-overhaul150.js?v=327';
import {enableStageBoss,beginStageBossFrame,endStageBossFrame,stageBossSpeed,stageSpawnInterval,stageBossCollision,damageStageBoss} from './stageboss-host.js?v=327&b=326';
import {attachAircraftPersonality,installAircraftPersonality} from './aircraft-personality164.js?v=327';
import {installDogfightPass,DOGFIGHT_PASS_BALANCE,DOGFIGHT_PASS_STATES,directorAircraftEligible} from './dogfight-pass165.js?v=327';
import {installDogfightDefense,PURSUIT_MATCH_BALANCE} from './dogfight-defense166.js?v=327';
import {installEnergyCombat,ENERGY_COMBAT_BALANCE} from './energy-combat167.js?v=327';
import {installBattleDirector,BATTLE_DIRECTOR_BALANCE,BATTLE_DIRECTOR_PATTERNS} from './battle-director169.js?v=327';
import {installBattlefieldEvents,BATTLEFIELD_EVENT_BALANCE,BATTLEFIELD_EVENT_TYPES} from './battlefield-events170.js?v=327';
import {installRivalAce,RIVAL_ACE_BALANCE,RIVAL_ACE_PHASES} from './rival-ace171.js?v=327';
export {DOGFIGHT_PASS_BALANCE,DOGFIGHT_PASS_STATES};
export {PURSUIT_MATCH_BALANCE};
export {ENERGY_COMBAT_BALANCE};
export {BATTLE_DIRECTOR_BALANCE,BATTLE_DIRECTOR_PATTERNS};
export {BATTLEFIELD_EVENT_BALANCE,BATTLEFIELD_EVENT_TYPES};
export {RIVAL_ACE_BALANCE,RIVAL_ACE_PHASES};
export {BUILD_IDENTITIES,BUILD_IDENTITY_LIMIT,buildIdentityFor};
// Pilot balance pass 89: role-aware cooldowns; shared by solo, campaign and co-op.
export const PILOT_BALANCE=Object.freeze({
 cooldowns:Object.freeze({baron:18,baron_albatros:18,fonck:16,voss:12,boelcke:12,collishaw:20,baracca:12,udet:18,guynemer:22,bishop:22,goering:22,immelmann:14,mannock:28,mckeever:20,huffzky:20,wolff:18,loewenhardt:17,mccudden:24,nungesser:20,jacobs:16}),
 recovery:Object.freeze({baron:7,baron_albatros:6,voss:5,immelmann:6,baracca:6,bishop:8,mannock:8,wolff:6,loewenhardt:6,mccudden:8,nungesser:7}),
 singleGunMultiplier:1.45,boelckeDamage:2.2,boelckeDuration:4,immelmannShot:3.5,
 udetHpCost:.05,blackFlightInterval:.24,blackFlightDamage:24,
 mannockInterval:.28,mannockDamage:16,mannockContact:80,duoDamage:1.25
});
export const PLANES={fokker:{name:'포커 Dr.I',role:'근접 선회형',faction:'central',speed:128,turn:3.7,hp:100,rate:.2,color:'#b44735',wings:3},albatros:{name:'알바트로스 D.III',role:'균형 화력형',faction:'central',speed:148,turn:2.8,hp:125,rate:.17,color:'#d4bc7e',wings:2},camel:{name:'소프위드 카멜',role:'공격적 선회형',faction:'entente',speed:141,turn:3.5,hp:110,rate:.19,color:'#a2ae7a',wings:2},sopwith:{name:'숍위드 삼엽기',role:'편대 강습형',faction:'entente',speed:135,turn:3.4,hp:115,rate:.19,color:'#252b2a',wings:3},nieuport:{name:'뉴포르 17',role:'경량 선회기동형',faction:'entente',speed:163,turn:3.9,hp:85,rate:.21,color:'#d5d8c6',wings:2},spad:{name:'SPAD XIII',role:'고속 일격이탈형',faction:'entente',speed:177,turn:2.5,hp:105,rate:.18,color:'#bb9c59',wings:2}};
// Gun count follows the selected aircraft fit. RPM and aerial belt replacement
// are arcade tuning; synchronization affected historical firing rates.
export const WEAPONS={
 fokker:{name:'Spandau LMG 08/15',caliber:'7.92 mm',guns:2,belt:500,rpm:450,reload:2.4},
 albatros:{name:'Spandau LMG 08/15',caliber:'7.92 mm',guns:2,belt:500,rpm:450,reload:2.4},
 camel:{name:'Vickers',caliber:'.303',guns:2,belt:500,rpm:450,reload:2.4},
 nieuport:{name:'Vickers',caliber:'.303',guns:1,belt:500,rpm:450,reload:2.0},
 spad:{name:'Vickers',caliber:'.303',guns:2,belt:500,rpm:450,reload:2.4},
 sopwith:{name:'Vickers',caliber:'.303',guns:2,belt:500,rpm:450,reload:2.4}
};

export const PILOTS={baron:{name:'만프레드 폰 리히트호펜',alias:'THE RED BARON',faction:'central',portrait:0,skill:'플라잉 서커스',desc:'3초간 무적 급강하. 속도와 연사력이 크게 증가합니다.',cooldown:12},fonck:{name:'르네 폰크',alias:'THE PRECISION ACE',faction:'entente',portrait:1,skill:'필살의 일제사격',desc:'4초간 전방으로 강력한 관통탄을 발사합니다.',cooldown:11},voss:{name:'베르너 포스',alias:'THE LONE HUSSAR',faction:'central',portrait:2,skill:'역전 선회',desc:'즉시 180° 선회하고 1.7초간 무적. 추격 탄환을 제거합니다.',cooldown:18},boelcke:{name:'오스왈드 뵐케',alias:'THE FATHER OF FIGHTERS',faction:'central',portrait:0,skill:'뵐케의 십계명',desc:'전투 규율을 지켜 4초간 공격력과 선회력이 상승합니다.',cooldown:13},collishaw:{name:'레이몬드 콜리쇼',alias:'THE BLACK FLIGHT',faction:'entente',portrait:1,skill:'검은 편대 강습',desc:'순간적으로 숍위드 삼엽기 3대가 나타나 전방을 일제 사격합니다.',cooldown:14},baracca:{name:'프란체스코 바라카',alias:'THE ACE OF THE CAVALRY',faction:'entente',portrait:0,skill:'검은 말의 질주',desc:'검은 말이 수평으로 전장을 가르며 적 편대를 쓸어버립니다.',cooldown:16}};
export const UPGRADES=[{id:'damage',name:'스팬다우 LMG 08/15',desc:'기관총 공격력 +30%',apply:g=>g.damage*=1.3},{id:'rate',name:'동조 장치 · 싱크로나이저',desc:'기관총 발사 간격 −18%',apply:g=>g.rate*=.82},{id:'spread',name:'집중 일제사격',desc:'총구별 추가 탄환 +1 · 탄약 소모 증가 (최대 5발)',apply:g=>g.shots=Math.min(5,g.shots+1)},{id:'rockets',name:'르 프리외르 로켓',desc:'전방 직진 로켓 1발이 주기적으로 추가 발사됩니다.',apply:g=>g.rockets=(g.rockets||0)+1},{id:'mines',name:'접촉식 공중 기뢰',desc:'뒤쪽에 기뢰를 투하해 접근한 적에게 폭발 피해를 줍니다.',apply:g=>g.mineCount=(g.mineCount||0)+1},{id:'armor',name:'합판 모노코크 동체',desc:'최대 내구도 +25, 내구도 40 회복',apply:g=>{g.maxHp+=25;g.hp=Math.min(g.maxHp,g.hp+40)}},{id:'turn',name:'적층 목재 프로펠러',desc:'선회 속도 +20%, 비행 속도 +6%',apply:g=>{g.turn*=1.2;g.speed*=1.06}},{id:'magnet',name:'관측병의 전장 지도',desc:'경험치 회수 범위 +70%',apply:g=>g.magnet*=1.7},{id:'repair',name:'비행장 정비반',desc:'내구도 55 회복',apply:g=>g.hp=Math.min(g.maxHp,g.hp+55)},{id:'cooldown',name:'딕타 뵐케',desc:'액티브 재사용 시간 −20%',apply:g=>g.cooldownMult*=.8}];
UPGRADES.push({id:'wingman',name:'레전드리 윙맨 · 정예 편대',desc:'정예 윙맨 1기 영구 합류. 일반 지원기 대비 공격력 +45%, 연사 +20%. 최대 2회 획득.',apply:g=>g.permanentWingman=(g.permanentWingman||0)+1});
UPGRADES.push({id:'regen',name:'현장 정비공의 오일 펌프',desc:'초당 내구도 0.75 회복. (최대 내구도까지)',apply:g=>g.regen=(g.regen||0)+.75});
export const angleDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export const highRiskDamage=(base,maxHp,source={})=>base+(maxHp||0)*(source.maxHpFraction??(source.fieldShell?.025:source.aceSpecial?.04:0));
PLANES.fokkerdv={...PLANES.fokker,name:'포커 D.VIII · LO',role:'무모한 강습',wings:1,speed:153,hp:105};
PLANES.spad12={...PLANES.spad,name:'SPAD XII · 황새',role:'중포 강습',speed:158,hp:115};
WEAPONS.fokkerdv={...WEAPONS.fokker};WEAPONS.spad12={...WEAPONS.spad};
PILOTS.udet={name:'에른스트 우데트',alias:'LO · THE DAREDEVIL',faction:'central',portrait:0,skill:'무모한 기동술',desc:'현재 체력 10%를 소모하고 5초간 이동속도 +70%, 발사속도 +140%.',cooldown:22};
PILOTS.guynemer={name:'조르즈 기네미르',alias:'THE STORK',faction:'entente',portrait:1,skill:'황새의 강타',desc:'황새가 전장을 가로지르며 3차례 강타합니다.',cooldown:25};
PLANES.re7={...PLANES.camel,name:'R.E.7 복좌기',role:'근거리 강습',speed:128,hp:125,turn:2.4};
PLANES.fokkerd7={...PLANES.albatros,name:'포커 D.VII · 백색',role:'편대 지휘',speed:147,hp:115};
WEAPONS.re7={...WEAPONS.camel,name:'Lewis',guns:1};WEAPONS.fokkerd7={...WEAPONS.fokker};
PILOTS.bishop={name:'빌리 비숍',alias:'GUERRILLA NIGHT',faction:'entente',portrait:1,skill:'게릴라 나이트',desc:'기관총 사거리 −55%, 공격력 +80%. 화면 밖으로 상승 후 재진입하며 8발 폭격.',cooldown:25};
PILOTS.goering={name:'헤르만 괴링',alias:'WHITE FLIGHT LEADER',faction:'central',portrait:0,skill:'백색 편대 · 집중 포화',desc:'상시 윙맨 1기와 출격합니다. 5초간 자신의 모든 윙맨 공격력 3배, 발사 속도 2배.',cooldown:27};
export const PILOT_PLANES={baron:'fokker_red',voss:'fokker_voss',boelcke:'albatros',immelmann:'eindecker',fonck:'camel',collishaw:'sopwith',baracca:'nieuport',udet:'fokkerdv',guynemer:'spad12',bishop:'re7',goering:'fokkerd7',mannock:'se5a'};
export const DOCTRINE_BALANCE=Object.freeze({
 '강습 편대':Object.freeze({label:'화력 +15% / 장전 +15%',damage:1.15,reloadPenalty:1.15}),
 '고속 정찰':Object.freeze({label:'속도 +12% / 내구도 −10%',speed:1.12,hp:0.9}),
 '장기 초계':Object.freeze({label:'내구도 +15 / 발사 간격 +8%',hpFlat:15,rate:1.08}),
 '신속 작전':Object.freeze({label:'경험치 +25% / 속도 +5%',xp:1.25,speed:1.05}),
 '관측 비행':Object.freeze({label:'회수 반경 +35% / 경험치 +8%',magnet:1.35,xp:1.08}),
 '방어진지 엄호':Object.freeze({label:'내구도 +25 / 기관총 −8%',hpFlat:25,damage:.92})
});
// Generic squadron aircraft for friendly wingmen/patrols — ace liveries and
// personal mounts excluded; support planes roll across the whole era.
export const WING_PLANES=Object.freeze({
 central:Object.freeze(['fokker','eindecker','albatros_d2','albatros','albatros_d5a','oeffag','pfalz_d3a','fokkerd7','fokkerdv','pfalz_d12','ssw_d3','siemens_d4','roland_d6','phonix_d1','aviatik_d1']),
 entente:Object.freeze(['airco_dh2','nieuport11','nieuport','nieuport24','nieuport28','pup','dh5','camel','sopwith','se5a','spad','hanriot','bristol_m1','dolphin','snipe','morane_ai','ansaldo_sva5'])
});
export class Game{constructor(plane='fokker',pilot='baron',rng=Math.random){this.rng=rng;this.plane=plane;this.pilot=pilot;let p=PLANES[plane];this.x=0;this.y=0;this.a=-Math.PI/2;this.speed=p.speed*1.18;this.turn=p.turn*1.12;this.maxHp=p.hp;this.hp=p.hp;this.weapon={...WEAPONS[plane]};this.rate=60/this.weapon.rpm;this.ammo=Array(this.weapon.guns).fill(this.weapon.belt);this.reloadTime=0;this.roundsFired=0;this.muzzleFlash=0;this.damage=12;this.shots=1;this.rockets=0;this.mineCount=0;this.rocketFire=1.8;this.mineTimer=3;this.magnet=120;this.cooldownMult=1;this.t=0;this.kills=0;this.level=1;this.xp=0;this.baseLevelNeed=6;this.xpCostMultiplier=p.xpCostMultiplier??1;this.need=this.levelRequirement(6);this.enemies=[];this.allies=[];this.bullets=[];this.drops=[];this.mines=[];this.flakTimer=24;this.allyTimer=32;this.allyPlane=p.faction==='central'?'fokker':'camel';this.particles=[];this.events=[];this.upgrades={};this.state='playing';this.fire=0;this.spawn=0;this.supplyTimer=28;this.cooldown=0;this.evadeCooldown=0;this.evadeTime=0;this.evadeDirection=1;this.skillTime=0;this.invuln=1.5;this.bossSpawned=false;this.bossKilled=false;this.nextBossAt=80;this.wave=0;this.shake=0;this.score=0;this.hitFlash=0;this.smokeTimer=0;this.eventTimer=18+this.rng()*10;this.doctrine=['강습 편대','고속 정찰','장기 초계'][Math.floor(this.rng()*3)];if(this.doctrine==='강습 편대'){this.damage*=1.15;this.reloadPenalty=1.15}else if(this.doctrine==='고속 정찰'){this.speed*=1.12;this.maxHp*=.9;this.hp=this.maxHp}else{this.maxHp+=15;this.hp=this.maxHp;this.rate*=1.08}if(pilot==='bishop')this.damage*=1.8;if(pilot==='goering'){this.permanentWingman=1;this.spawnAlly();Object.assign(this.allies.at(-1),{permanent:true,life:1e9})}this.ensureRevisionPilot();this.event('wave',this.doctrine+' · 출격 장비 배정')}
 rollChoices(){let pool=UPGRADES.filter(u=>u.id!=='wingman'&&(u.id!=='spread'||this.shots<5)&&(u.id!=='repair'||this.hp<this.maxHp));let fresh=pool.filter(u=>!(this.lastChoices||[]).includes(u.id));if(fresh.length>=3)pool=fresh;for(let i=pool.length-1;i>0;i--){let j=Math.floor(this.rng()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}let picks=pool.slice(0,3);if((this.upgrades.wingman||0)<2&&this.rng()<.03)picks[2]=UPGRADES.find(u=>u.id==='wingman');this.lastChoices=picks.map(u=>u.id);return picks}
 event(type,text){this.events.push({type,text})}
 skill(){if(this.state!=='playing'||this.cooldown>0)return false;let p=PILOTS[this.pilot];this.cooldown=this.skillCooldown();this.skillTime=this.skillDuration();if(this.pilot==='collishaw')this.formationFire=0;if(this.pilot==='voss')this.invuln=Math.max(this.invuln,1);if(this.pilot==='voss'){this.a+=Math.PI;this.bullets=this.bullets.filter(b=>!b.enemy);this.burst(this.x,this.y,'#f1dca0',25)}this.event('skill',p.skill);return true}
 evade(){if(this.state!=='playing'||this.evadeCooldown>0)return false;this.evadeCooldown=8;this.evadeTime=.82;this.evadeDirection*=-1;/* 넓은 선회로 적 후방 진입 창 확보 */this.a+=this.evadeDirection*Math.PI*.72;this.invuln=Math.max(this.invuln,.78);this.burst(this.x,this.y,'#d8e4d0',18);this.event('evade','선회기동기동');return true}
 reload(){if(this.state!=='playing'||this.reloadTime>0||this.ammo.every(n=>n===this.weapon.belt))return false;this.reloadTime=this.weapon.reload*(this.reloadPenalty||1);this.fire=0;this.muzzleFlash=0;this.event('reload','재장전');return true}

 upgrade(id,rarity='normal'){if(this.state!=='upgrade')return;let u=UPGRADES.find(u=>u.id===id);if(!u)return;u.apply(this);if(rarity==='rare'){u.apply(this)}else if(rarity==='unique'){u.apply(this);u.apply(this);if(id==='rockets')this.rocketFire=0;if(id==='mines')this.mineTimer=0}this.upgrades[id]=(this.upgrades[id]||0)+1;this.state='playing';this.checkLevel()}
 checkLevel(){if(this.xp>=this.need&&this.state==='playing'){this.xp-=this.need;this.level++;this.baseLevelNeed=Math.ceil(this.baseLevelNeed*1.28);this.need=this.levelRequirement(this.baseLevelNeed);this.state='upgrade';this.event('upgrade','전술 개조')}}
 burst(x,y,color,n=8){for(let i=0;i<n;i++){let a=this.rng()*Math.PI*2,s=20+this.rng()*90;this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.4+this.rng()*.5,color})}}
 smoke(x,y,heavy=false){this.particles.push({x,y,vx:(this.rng()-.5)*18,vy:-10-this.rng()*12,life:heavy?.85:.6,maxLife:heavy?.85:.6,smoke:true,size:heavy?7:4,color:heavy?'#343a35':'#bac1ae'})}
 supportPlane(){if(this.pilot==='goering')return 'fokkerd7';if(this.pilot==='collishaw')return 'collishaw_sopwith';const choices=(WING_PLANES[PLANES[this.plane].faction]||[]).filter(id=>id!==this.plane&&PLANES[id]);return choices.length?choices[Math.floor(this.rng()*choices.length)]:this.allyPlane}
 permanentWingPlane(){if(this.pilot==='goering')return 'fokkerd7';if(this.pilot==='collishaw')return 'collishaw_sopwith';const choices=(WING_PLANES[PLANES[this.plane].faction]||[]).filter(id=>id!==this.plane);return choices.length?choices[Math.floor(this.rng()*choices.length)]:this.allyPlane}
 permanentWingCount(){let count=0;const allies=this.combatWorld?.()?.allies||this.allies||[];for(const a of allies)if(a.permanent&&a.life>0&&(a.ownerId===undefined||a.ownerId===this.id))count++;return count}
 lufberyDamageMultiplier(){if(!this.upgrades?.lufberyCircle)return 1;const wings=this.permanentWingCount();return 1-(wings>=4?.35:wings===3?.30:wings===2?.25:wings===1?.20:0)}
 wingFormationOffset(slot,count){if(count<=1)return {forward:-70,side:0};if(count===2)return {forward:-60,side:slot?-70:70};if(count===3)return slot===2?{forward:-125,side:0}:{forward:-55,side:slot?-65:65};const row=Math.floor(slot/2),side=slot%2?-1:1;return {forward:-58-row*48,side:side*(72+row*38)}}
 wingFormationTarget(wing,count=this.permanentWingCount()){if(this.upgrades?.lufberyCircle&&count>0){const radius=Math.max(88,76/(2*Math.sin(Math.PI/Math.max(2,count)))),angle=(this.t||0)*.58+(wing.slot??0)*Math.PI*2/count;return{x:this.x+Math.cos(angle)*radius,y:this.y+Math.sin(angle)*radius}}const offset=this.wingFormationOffset(wing.slot??0,count);return {x:this.x+Math.cos(this.a)*offset.forward-Math.sin(this.a)*offset.side,y:this.y+Math.sin(this.a)*offset.forward+Math.cos(this.a)*offset.side}}
 applyFighterSupplyToWings(){if(!this.upgrades.fighterSupply)return;const pool=(WING_PLANES[PLANES[this.plane].faction]||[]).filter(id=>id!==this.plane&&PLANES[id]),allies=this.combatWorld?.()?.allies||this.allies||[];for(const a of allies)if(a.permanent&&(a.ownerId===undefined||a.ownerId===this.id)){const plane=pool.length?pool[Math.floor(this.rng()*pool.length)]:a.plane;a.plane=plane;attachAircraftPersonality(PLANES,a,plane)}}
 ensureWingmen(){let active=this.permanentWingCount();while(active<(this.permanentWingman||0)){const slot=active++,target=this.wingFormationTarget({slot},this.permanentWingman);this.allies.push({slot,x:target.x,y:target.y,a:this.a,life:1e9,fire:.18,plane:this.permanentWingPlane(),permanent:true})}}
 spawnAlly(){const used=new Set(this.allies.map(a=>a.slot));let slot=0;while(used.has(slot))slot++;const row=Math.floor(slot/2),side=slot%2?-1:1,off=side*(70+row*34),back=45+row*65;this.allies.push({slot,x:this.x-Math.cos(this.a)*back-Math.sin(this.a)*off,y:this.y-Math.sin(this.a)*back+Math.cos(this.a)*off,a:this.a,life:15,fire:.35,plane:this.supportPlane()});this.event('ally','아군 지원 편대 도착')}
 spawnFlak(){let edge=this.rng()*4,x,y;if(edge<1){x=this.x-360+this.rng()*720;y=this.y-300}else if(edge<2){x=this.x+360;y=this.y-300+this.rng()*600}else if(edge<3){x=this.x-360+this.rng()*720;y=this.y+300}else{x=this.x-360;y=this.y-300+this.rng()*600}if(this.sunStrikeContains({x,y,hp:1}))return;let aim=Math.atan2(this.y-y,this.x-x);this.event('flak','대공포 발사! 탄막을 피하세요');for(let i=-3;i<=3;i++){let a=aim+i*.12;this.bullets.push({x,y,vx:Math.cos(a)*190,vy:Math.sin(a)*190,life:4.2,enemy:true,flak:true,damage:Math.round(13*(1+this.t/260))})}this.burst(x,y,'#efb35d',12)}
 spawnEnemy(type){let a=this.rng()*Math.PI*2,d=400+this.rng()*160;let boss=type==='boss';const scale=1+this.t/150;const bossScale=1+this.t/95;const baseHp=type==='zeppelin'?220:type==='bomber'?50:type==='hunter'?30:22;let e={x:this.x+Math.cos(a)*d,y:this.y+Math.sin(a)*d,a:a+Math.PI,type,faction:PLANES[this.plane].faction==='central'?'entente':'central',ace:PLANES[this.plane].faction==='entente'&&(type==='scout'||type==='hunter')&&this.t>35&&this.rng()<.07,hp:boss?Math.round(520*bossScale):Math.round(baseHp*scale),maxHp:boss?Math.round(520*bossScale):Math.round(baseHp*scale),hitFlash:0,smokeTimer:0,speed:(boss?125:type==='zeppelin'?42:type==='bomber'?65:type==='hunter'?117:90)*(boss?1+this.t/500:1+this.t/700),fire:1+this.rng()*2,wobble:this.rng()*6};this.enemies.push(e);if(type==='bomber'){const p=e.faction==='central'?['gotha','aeg_g4','friedrichshafen_g3']:['breguet14','voisin8','caudron_g4'];e.escortPlane=p[(this._bomberSeq=(this._bomberSeq||0)+1)%p.length]}}
 hit(n){if(this.invuln>0)return;this.hp=Math.max(0,this.hp-n);this.invuln=.75;this.hitFlash=.16;this.smoke(this.x,this.y,true);this.shake=7;this.burst(this.x,this.y,'#ffce8e',9);this.event('hit','');if(this.hp<=0){this.state='lost';this.score=this.kills*100+Math.floor(this.t)*10;this.event('end','작전 실패')}}
 update(dt,input={}){if(this.state!=='playing')return;dt=Math.min(.04,Math.max(0,dt));this.t+=dt;this.muzzleFlash=Math.max(0,this.muzzleFlash-dt);this.hitFlash=Math.max(0,this.hitFlash-dt);this.smokeTimer-=dt;if(this.hp<this.maxHp*.6&&this.smokeTimer<=0){this.smoke(this.x-Math.cos(this.a)*12,this.y-Math.sin(this.a)*12,this.hp<this.maxHp*.3);this.smokeTimer=.12}this.cooldown=Math.max(0,this.cooldown-dt);this.evadeCooldown=Math.max(0,this.evadeCooldown-dt);this.evadeTime=Math.max(0,this.evadeTime-dt);this.skillTime=Math.max(0,this.skillTime-dt);this.invuln=Math.max(0,this.invuln-dt);this.shake=Math.max(0,this.shake-dt*22);this.flyAirframe(dt,input);
 let evading=this.evadeTime>0;let velocity=this.speed*stageBossSpeed(this)*(this.chargeTime>0?4.6:evading?2.35:(this.airframeSpeed??1))*(this.pursuitSpeedFactor??1);this.x+=Math.cos(this.a)*velocity*dt;this.y+=Math.sin(this.a)*velocity*dt;// Resolve player-driven entry before enemy shots and hazards are evaluated.
 const wasReloading=this.reloadTime>0;
 if(wasReloading){this.reloadTime=Math.max(0,this.reloadTime-dt);this.fire=0;if(this.reloadTime===0){this.ammo.fill(this.weapon.belt);this.event('loaded','재장전 완료')}}
 else if(!this.cow37&&(input.inputMode!=='gamepad'||input.fireHeld)){this.fire-=dt;if(this.bishopTime>0)this.fire=Math.max(this.fire,.1);let volleys=0;while(this.fire<=0&&this.reloadTime===0&&volleys++<8){
  if(this.ammo.every(n=>n===0)){this.reload();break}
  this.fire+=Math.max(.02,this.rate/(this.pilot==='jacobs'?1+(this.jacobsStacks||0)*.1:1));const skillDamage=this.normalGunMultiplier()/Math.sqrt(this.shots);
  for(let gun=0;gun<this.weapon.guns;gun++){
   const rounds=Math.min(this.shots,this.ammo[gun]),offset=this.weapon.bidirectional?0:(gun-(this.weapon.guns-1)/2)*8,gunAngle=this.gunDirection(gun);
   for(let i=0;i<rounds;i++){const fan=this.pilot==='fonck'&&this.skillTime>0?.16:.11,a=gunAngle+(i-(rounds-1)/2)*fan,tailTargetId=this.tailLocked?this.tailTargetId:null;
    const round={x:this.x+Math.cos(gunAngle)*23-Math.sin(gunAngle)*offset,y:this.y+Math.sin(gunAngle)*23+Math.cos(gunAngle)*offset,vx:Math.cos(a)*520,vy:Math.sin(a)*520,life:this.longRange?this.shotLifetime(520):['bishop','mannock'].includes(this.pilot)?.6:1.35,enemy:false,ownerId:this.id,gun,damage:this.damage*skillDamage,pierce:false,hit:new Set(),tailBonus:!!tailTargetId,tailTargetId,eagle:this.eagleTime>0||undefined};
    this.bullets.push(this.applySpecialRound(round,null));
   }if(!this.unlimitedAmmo)this.ammo[gun]-=rounds?Math.max(1,rounds-(this.freeVolleyShots||0)):0;this.roundsFired+=rounds;
  }this.muzzleFlash=.055;this.event('shot','');
  if(this.ammo.every(n=>n===0))this.reload();
 }}

 if(this.rockets>0){this.rocketFire-=dt;if(this.rocketFire<=0)this.launchUpgradeRocket()}if(this.mineCount>0){this.mineTimer-=dt;if(this.mineTimer<=0){this.mineTimer=this.ordnanceInterval(3.6/(1+this.mineCount*.3));this.throwGrenades()}}this.tickGrenades(dt);for(let m of this.mines){if(m.grenade){m.x+=(m.vx||0)*dt;m.y+=(m.vy||0)*dt;m.vx*=.985;m.vy*=.985}m.life-=dt;m.arm=Math.max(0,m.arm-dt);if(m.life>0&&m.arm===0&&this.enemies.some(e=>e.hp>0&&Math.hypot(e.x-m.x,e.y-m.y)<(m.special?48:72))){
 const radius=m.special?90:110;
 this.queueExplosionDamage(m.x,m.y,radius,m.damage);m.life=0;
 }}this.mines=this.mines.filter(m=>m.life>0);
 let wave=this.t<60?1:this.t<120?2:3;if(wave!==this.wave){this.wave=wave;this.event('wave',wave===1?(this.doctrine+' · '+(DOCTRINE_BALANCE[this.doctrine]?.label||'')):wave===2?'제2파 · 추격기 접근':'제3파 · 전선 돌파')}
 this.eventTimer-=dt;if(this.eventTimer<=0){this.eventTimer=22+this.rng()*20;let roll=this.rng(),quiet=this.mobSpawnsSuppressed();if(roll<.35&&!quiet){for(let i=0;i<3;i++)this.spawnEnemy('hunter');this.event('wave','기습! 고속 추격 편대')}else if(roll<.6&&!quiet){this.spawnEnemy('bomber');this.spawnEnemy('bomber');this.event('wave','폭격 편대 통과')}else if(roll<.8||quiet){this.drops.push({x:this.x+Math.cos(this.a)*180,y:this.y+Math.sin(this.a)*180,value:0,heal:true,supply:true,vx:0,vy:0,life:14});this.event('wave','전방 수리 보급품!')}}
 // Independent patrols replace timed follower arrivals.
 this.flakTimer-=dt;if(this.t>28&&this.flakTimer<=0){this.flakTimer=(Math.max(10,27-this.t*.028)+this.rng()*6)*(this.region===2?.6:[1,7].includes(this.region)?1.4:1);this.spawnFlak()}
 this.spawn-=dt;if(this.spawn<=0&&this.enemies.length<65&&!this.mobSpawnsSuppressed()){this.spawn=this.regularSpawnInterval?.()??2.8;this.spawnEnemy(this.spawnComposition())}else if(this.mobSpawnsSuppressed())this.spawn=Math.max(this.spawn,.5);
 this.supplyTimer-=dt;if(this.supplyTimer<=0){this.supplyTimer=30+this.rng()*24;let a=this.rng()*Math.PI*2,d=520;this.drops.push({x:this.x+Math.cos(a)*d,y:this.y+Math.sin(a)*d,value:0,heal:true,supply:true,vx:-Math.cos(a)*78,vy:-Math.sin(a)*78,life:18})}
 this.runScheduledAces();
 this.ensureWingmen();const permanentCount=this.permanentWingCount();
 for(let a of this.allies){a.life-=dt;let target;if(a.permanent)target=this.wingFormationTarget(a,permanentCount);else{const slot=a.slot??this.allies.indexOf(a),row=Math.floor(slot/2),side=slot%2?-1:1,back=45+row*65,off=side*(70+row*34);target={x:this.x-Math.cos(this.a)*back-Math.sin(this.a)*off,y:this.y-Math.sin(this.a)*back+Math.cos(this.a)*off}}a.a=this.a;const response=2.6*Math.max(.75,Math.min(1.25,a.personality?.acceleration??1));a.x+=(target.x-a.x)*Math.min(1,dt*response);a.y+=(target.y-a.y)*Math.min(1,dt*response);a.fire-=dt;if(a.fire<=0){a.fire=.42*(a.permanent&&this.upgrades.fighterSupply?.9:1)/((this.wingBoost>0?GOERING_WING_BOOST.fireRateMultiplier:1)*(1+(this.commandRateBonus||0))*((this.pilot==='mannock'||(this.players||[]).some(p=>p.pilot==='mannock'))?1.15:1));let nearest=null,best=Infinity;for(const e of this.enemies)if(e.hp>0){const d=(e.x-a.x)**2+(e.y-a.y)**2;if(d<best){best=d;nearest=e}}if(nearest){let aa=Math.atan2(nearest.y-a.y,nearest.x-a.x);this.bullets.push({x:a.x+Math.cos(aa)*23,y:a.y+Math.sin(aa)*23,vx:Math.cos(aa)*470,vy:Math.sin(aa)*470,life:1.5,enemy:false,ownerId:this.id,ally:true,damage:this.supportPower(7.44)*(this.wingmanDamageMult||1)*(this.wingBoost>0?GOERING_WING_BOOST.damageMultiplier:1)*(a.permanent&&this.upgrades.fighterSupply?1.2:1),hit:new Set()});this.burst(a.x+Math.cos(aa)*22,a.y+Math.sin(aa)*22,'#b9f2de',2)}}}
 this.allies=this.allies.filter(a=>a.life>0);
 for(let e of this.enemies){if(e.stageBossBody||e.bossMinion)continue;if(e.crashing){e.crashT-=dt;e.a+=e.crashSpin*dt;e.x+=Math.cos(e.crashDir)*e.crashSpeed*dt;e.y+=Math.sin(e.crashDir)*e.crashSpeed*dt;e.crashSpeed=Math.max(30,e.crashSpeed*(1-.7*dt));e.crashSmoke-=dt;if(e.crashSmoke<=0){e.crashSmoke=.045;this.smoke(e.x+(this.rng()-.5)*10,e.y+(this.rng()-.5)*10,true)}if(e.crashT<=0){e.crashed=true;this.burst(e.x,e.y,'#f2aa52',36);for(let k=0;k<9;k++)this.smoke(e.x+(this.rng()-.5)*26,e.y+(this.rng()-.5)*26,true);this.event('kill','')}continue}e.hitFlash=Math.max(0,(e.hitFlash||0)-dt);e.smokeTimer=(e.smokeTimer||0)-dt;if(e.hp<e.maxHp&&e.smokeTimer<=0){this.smoke(e.x-Math.cos(e.a)*12,e.y-Math.sin(e.a)*12,e.hp/e.maxHp<.4);e.smokeTimer=e.hp/e.maxHp<.4?.07:.16}const contact=this.enemyCombatTarget(e),energySpeed=e.energySpeed??1;// Bombers fly a straight bombing run past the player — no fighter-style
// circling, just a gentle weave on course.
let max=this.sunStrikeContains(e)||e.stationary?0:e.bossDash>0?0:e.heavyBomber?.3:e.type==='boss'?2.0:e.type==='hunter'?1.7:e.type==='zeppelin'?.42:.85,steering=e.type==='bomber'?{turn:max>0?(e.heavyBomber?.12:.16):0,delta:0}:this.dogfightSteering(e,contact,dt,max);if(e.type==='bomber')steering.delta=Math.cos(this.t*.6+e.wobble)*steering.turn*dt;e.a+=Math.max(-steering.turn*dt,Math.min(steering.turn*dt,steering.delta));const sunlightSpeed=this.sunStrikeContains(e)?SUN_STRIKE.speedMultiplier:1;e.x+=Math.cos(e.a)*e.speed*energySpeed*(e.bossDash>0?ENEMY_MOVEMENT_BALANCE.dashMultiplier:1)*sunlightSpeed*dt;e.y+=Math.sin(e.a)*e.speed*energySpeed*(e.bossDash>0?ENEMY_MOVEMENT_BALANCE.dashMultiplier:1)*sunlightSpeed*dt;if(!this.sunStrikeContains(e)){e.fire-=dt*(e.vossSurge?1.25:1);if(e.fire<0)this.fireEnemy(e);}if(!e.surface)for(const p of this.patrols||[])if(p.hp>0&&Math.hypot(e.x-p.x,e.y-p.y)<24)this.hitPatrol(p,18);if(!e.surface&&Math.hypot(e.x-this.x,e.y-this.y)<(e.contactRadius??(e.heavyBomber?48:e.type==='boss'?ENEMY_MOVEMENT_BALANCE.aceContactRadius:e.type==='zeppelin'?42:19)))this.hit(e.type==='boss'?22:e.type==='zeppelin'?18:15)}
 for(let b of this.bullets){const bx=b.x,by=b.y;b.previousX=bx;b.previousY=by;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(b.life<=0)continue;if(b.enemy){this.resolveHostileRound(b,bx,by)}else{for(let e of this.enemies){b.hit??=new Set();if(e.hp<=0||b.hit.has(e)||!this.canHitTarget(e,b)||(b.patrol&&!b.fireZone&&!this.patrolCanEngage(e,b)))continue;if(this.targetCollision(e,b.x,b.y,b)){damageStageBoss(this,e,b,b.damage*(b.patrol?1:(this.globalDamageMult||1)*this.legendaryDamageMultiplier()*this.roundDamageMultiplier(b,e)));if(!b.patrol)e.playerHit=true;e.hitFlash=.24;b.hit.add(e);this.specialRoundImpact(b,e);this.event('impact','');this.burst(b.x,b.y,b.specialColor||'#fff0bb',9);this.smoke(e.x,e.y,true);if(!b.patrol)this.shake=Math.max(this.shake,1.6);if(!b.pierce)b.life=0;if(e.hp<=0&&!e.stageBossBody){this.spawnAmatolSecondary?.(e,b);const credited=!b.patrol||e.playerHit;if(credited&&e===this.huntTarget)e._huntCredit=true;if(credited)this.kills++;else this.patrolKills=(this.patrolKills||0)+1;if(credited&&(e.bossPilot||e.type==='boss'||e.type==='zeppelin'||e.type==='bomber'))this.priorityKills=(this.priorityKills||0)+1;if(e.type==='zeppelin')this.wreckGust(e);this.burst(e.x,e.y,'#f2aa52',30);if(!b.patrol)this.shake=Math.max(this.shake,3);for(let k=0;k<5;k++)this.smoke(e.x+(this.rng()-.5)*15,e.y+(this.rng()-.5)*15,true);this.event('kill',e.fieldUnit==='balloon'?'balloon':'');if(e.type==='boss'){this.bossKilled=true;this.hp=Math.min(this.maxHp,this.hp+this.maxHp*DURABILITY_BALANCE.repairPickupFraction)}if(credited){{const big=e.bossPilot||e.type==='boss';if(big)for(let gi=0;gi<5;gi++)this.drops.push({x:e.x+Math.cos(gi*1.26)*44,y:e.y+Math.sin(gi*1.26)*44,value:14,heal:false});this.drops.push({x:e.x,y:e.y,value:big?30:e.heavyBomber?16:e.type==='bomber'?3:(e.xpValue||1),heal:big||this.rng()<.1})};this.dropObservationRepair(e)}}if(!b.pierce||b.life<=0)break}}}if(b.actualExplosion)b.life=0}
 this.enemies=this.enemies.filter(e=>{if(e.crashed)return false;if(e.crashing)return Math.hypot(e.x-this.x,e.y-this.y)<1300;if(e.hp<=0&&(e.bossPilot||e.type==='boss')&&!e.stageBossBody&&!e.bossMinion&&Math.hypot(e.x-this.x,e.y-this.y)<1300){e.crashing=true;e.crashT=1.15;e.crashDir=e.a+Math.PI/2+(this.rng()-.5)*.9;e.crashSpeed=Math.max(120,e.speed*1.2);e.crashSpin=(this.rng()<.5?-1:1)*(2.4+this.rng()*2.2);e.crashSmoke=0;e.hp=0;return true}return e.hp>0&&(e.missionTarget||e.type==='boss'||Math.hypot(e.x-this.x,e.y-this.y)<1100)});this.bullets=this.bullets.filter(b=>b.life>0);for(let d of this.drops){if(d.supply){d.x+=d.vx*dt;d.y+=d.vy*dt;d.life-=dt}let dist=Math.hypot(d.x-this.x,d.y-this.y);if(!d.supply&&dist<this.magnet){let a=Math.atan2(this.y-d.y,this.x-d.x);d.x+=Math.cos(a)*330*(1+Math.max(0,Math.min(360,this.magnet-120))/360)*dt;d.y+=Math.sin(a)*330*(1+Math.max(0,Math.min(360,this.magnet-120))/360)*dt}if(dist<20){this.xp+=d.value*(this.xpGainMult||1);if(d.heal)this.hp=Math.min(this.maxHp,this.hp+this.maxHp*(d.healFraction??DURABILITY_BALANCE.repairPickupFraction));if(d.specialAmmo)this.giveSpecialAmmo(d.specialAmmo,d.rounds);d.dead=true;this.event('pickup',d.heal?'heal':'xp')}}
 this.drops=this.drops.filter(d=>!d.dead&&(d.life===undefined||d.life>0)&&Math.hypot(d.x-this.x,d.y-this.y)<1500).slice(-250);for(let p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt}this.particles=this.particles.filter(p=>p.life>0).slice(-450);
 if(this.hp<=0)return;this.score=this.kills*100+Math.floor(this.t)*10;this.checkLevel()}
}

// Balance pass and the compact Immelmann pilot are layered here so old saved
// runs keep their state while every new sortie uses the slower turning curve.
PILOTS.immelmann={name:'막스 임멜만',alias:'THE EAGLE OF LILLE',faction:'central',portrait:0,skill:'임멜만 턴',desc:'상승 반전으로 적 탄막을 털어내고 반대 방향으로 관통 급강하 사격을 합니다.',cooldown:16};
const _updateBalanced=Game.prototype.update;
const _skillBalanced=Game.prototype.skill;
const _upgradeBalanced=Game.prototype.upgrade;
Game.prototype.update=function(dt,input={}){

  if(!this._turnBalanceApplied){this.turn*=.72;this._turnBalanceApplied=true;this.baseSpeed=this.speed;this.enemyCruiseReference=this.speed}
  const oldSpeed=this.speed;this.speed=this.baseSpeed*this.healthSpeedFactor();
  _updateBalanced.call(this,dt,input);this.speed=oldSpeed;
};
Game.prototype.skill=function(){
  if(this.pilot!=='immelmann')return _skillBalanced.call(this);
  if(this.state!=='playing'||this.cooldown>0)return false;const p=PILOTS.immelmann;this.cooldown=this.skillCooldown();this.skillTime=this.skillDuration();this.invuln=Math.max(this.invuln,this.skillEnhanced?1.35:1.1);this.a+=Math.PI;this.bullets=this.bullets.filter(b=>!b.enemy);this.burst(this.x,this.y,'#f1dca0',28);
  const spread=this.skillEnhanced?3:2;for(let i=-spread;i<=spread;i++){const aa=this.a+i*.07;this.bullets.push({x:this.x+Math.cos(aa)*24,y:this.y+Math.sin(aa)*24,vx:Math.cos(aa)*620,vy:Math.sin(aa)*620,life:1.5,enemy:false,ownerId:this.id,damage:this.damage*PILOT_BALANCE.immelmannShot,pierce:true,hit:new Set(),formation:true})}this.event('skill',p.skill);return true;
};
const _repairIndex=UPGRADES.findIndex(u=>u.id==='repair');if(_repairIndex>=0)UPGRADES.splice(_repairIndex,1);
Game.prototype.upgrade=function(id,rarity='normal'){const beforeHp=this.hp,beforeTurn=this.turn;_upgradeBalanced.call(this,id,rarity);if(id==='armor')this.hp=Math.min(this.hp,beforeHp);if(id==='turn')this.turn=beforeTurn*(rarity==='unique'?1.08:rarity==='rare'?1.06:1.04)};

// Collishaw's Black Flight now crosses the screen as real attack aircraft,
// while repair drops are rare enough to preserve the pressure of a sortie.
PILOTS.collishaw.desc='검은 숍위드 삼엽기 3대가 빠르게 좌우를 가르며 직접 사격합니다.';
const _formationUpdate=Game.prototype.update;
const _formationSkill=Game.prototype.skill;
Game.prototype.skill=function(){
  const activated=_formationSkill.call(this);
  if(activated&&this.pilot==='collishaw'){
    this.skillTime=this.skillDuration();this.formationTime=this.skillTime;
    this.formationClock=0;
    this.formationWings=[-1,0,1].map((slot,i)=>({slot,phase:i*2.05,x:this.x,y:this.y,a:this.a,alpha:0,fire:0}));
  }
  return activated;
};
const _spawnEnemyPressure=Game.prototype.spawnEnemy;
Game.prototype.spawnEnemy=function(type){
  if(type==='scout'&&this.t>28&&this.rng()<.28)type='hunter';
  else if(type==='hunter'&&this.t>72&&this.rng()<.16)type='bomber';
  _spawnEnemyPressure.call(this,type);
  const e=this.enemies.at(-1);if(!e)return;
  const ramp=Math.max(0,Math.min(1,(this.t-25)/120));
  const hpBoost=e.type==='boss'?1+ramp*.24:e.type==='zeppelin'?1+ramp*.2:e.type==='bomber'?1+ramp*.18:e.type==='hunter'?1+ramp*.15:1+ramp*.12;
  const speedBoost=e.type==='boss'?1+ramp*.08:e.type==='zeppelin'?1+ramp*.1:e.type==='bomber'?1+ramp*.08:1+ramp*.1;
  e.hp=Math.round(e.hp*hpBoost);e.maxHp=e.hp;e.speed*=speedBoost;e.fire*=1-ramp*.14;if(!e.missionTarget&&!e.heavyBomber&&!['boss','zeppelin'].includes(e.type)){const cruise=this.enemyCruiseReference??this.baseSpeed??this.speed;e.speed=Math.min(e.speed,cruise*PLAYER_SPEED_BALANCE.enemyCruiseFraction)}
};
Game.prototype.update=function(dt,input={}){
  if(!this._supplyTuned){this.supplyTimer=62;this._supplyTuned=true}
  const dropStart=this.drops.length;
  const oldBullets=new Set(this.bullets);
  _formationUpdate.call(this,dt,input);
  if(!this._zeppelinSchedule)this._zeppelinSchedule=65;
  if(this.state==='playing'&&this.t>=this._zeppelinSchedule){this.spawnEnemy('zeppelin');this._zeppelinSchedule=this.t+135+this.rng()*35;this.event('wave',(PLANES[this.plane].faction==='central'?'협상국 비행선':'제플린')+' 강습 · 대공 탄막을 돌파하라')}
  const pressure=Math.max(0,Math.min(1,(this.t-30)/120));
  for(const bullet of this.bullets)if(bullet.enemy&&!oldBullets.has(bullet)){bullet.damage=Math.round(bullet.damage*(1+pressure*.16));bullet.vx*=1+pressure*.05;bullet.vy*=1+pressure*.05}
  const fresh=this.drops.slice(dropStart);
  for(const d of fresh)if(d.heal&&!d.supply&&this.rng()>.3)d.heal=false;
  if(fresh.some(d=>d.supply))this.supplyTimer=Math.max(this.supplyTimer,68+this.rng()*42);
  if(this.pilot==='collishaw'&&this.skillTime>0){
    this.formationClock=(this.formationClock||0)+dt;
    const heading=this.a,side=heading+Math.PI/2,t=this.formationClock;
    for(const wing of this.formationWings||[]){
      const sweep=Math.sin(t*1.55+wing.phase)*190;
      const forward=145+Math.cos(t*1.2+wing.phase)*35;
      wing.x=this.x+Math.cos(heading)*forward+Math.cos(side)*(sweep+wing.slot*20);
      wing.y=this.y+Math.sin(heading)*forward+Math.sin(side)*(sweep+wing.slot*20);
      wing.a=heading;wing.alpha=Math.min(1,wing.alpha+dt*8);wing.fire-=dt;
      while(wing.fire<=0){wing.fire+=PILOT_BALANCE.blackFlightInterval/(1+(this.commandRateBonus||0));const aim=this.blackFlightAim(wing,heading),mx=wing.x+Math.cos(heading)*28,my=wing.y+Math.sin(heading)*28;this.bullets.push({x:mx,y:my,vx:Math.cos(aim)*500,vy:Math.sin(aim)*500,life:1.6,enemy:false,ownerId:this.id,damage:this.supportPower(PILOT_BALANCE.blackFlightDamage),pierce:true,hit:new Set(),formation:true,blackFlight:true});this.burst(mx,my,'#e9f0d8',2)}
    }
  }else if(this.formationWings){for(const wing of this.formationWings)wing.alpha=Math.max(0,wing.alpha-dt*5)}
};

// Baracca's emblem becomes a real diagonal attack run: the black horse crosses
// the field while a short burst of piercing rounds follows its charge.
const _wingmanRarityUpgrade=Game.prototype.upgrade;
Game.prototype.upgrade=function(id,rarity='normal'){
  if(id==='wingman'&&(this.upgrades.wingman||0)>=2)return;_wingmanRarityUpgrade.call(this,id,id==='wingman'?'normal':rarity);
};

// Historical name shown in the roster while keeping the Red Baron id for compatibility.
PILOTS.baron.name='만프레드 폰 리히트호펜';

// Intermittent turbulence: a visible gust can throw off the player's heading.
const _environmentUpdate=Game.prototype.update;
Game.prototype.update=function(dt,input={}){
  let control=input;
  if(this.gustDisorient>0){
    this.gustDisorient=Math.max(0,this.gustDisorient-dt);
    control={...input};
    if(Number.isFinite(control.angle))control.angle+=(this.gustOffset||0);
    else control.steer=(control.steer||0)+(this.gustOffset||0)*.65;
  }
  _environmentUpdate.call(this,dt,control);
  if(this.state==='playing'){const regen=Math.min(DURABILITY_BALANCE.regenCap,this.regen||0)+(this.legendaryRegen||0);this.hp=Math.min(this.maxHp,this.hp+(DURABILITY_BALANCE.baseRegenHpPerSecond+this.maxHp*regen)*dt)}
  if(this.flakBursts){for(const f of this.flakBursts)f.life-=dt;this.flakBursts=this.flakBursts.filter(f=>f.life>0)}
  if(!this.gusts)this.gusts=[];
  if(this.state!=='playing')return;
  this.gustTimer=(this.gustTimer??(36+this.rng()*18))-dt;
  if(this.gustTimer<=0){
    this.gustTimer=42+this.rng()*30;
    const a=this.rng()*Math.PI*2,d=430+this.rng()*150;
    this.gusts.push({x:this.x+Math.cos(a)*d,y:this.y+Math.sin(a)*d,vx:-Math.cos(a)*150,vy:-Math.sin(a)*150,a:a+Math.PI/2,life:6,maxLife:6,radius:55+this.rng()*18,hit:false});
    this.event('flak','돌풍 발생! 풍압을 피하세요');
  }
  for(const g of this.gusts){
    g.life-=dt;g.x+=g.vx*dt;g.y+=g.vy*dt;
    if(!g.hit&&Math.hypot(g.x-this.x,g.y-this.y)<g.radius){
      g.hit=true;this.gustDisorient=1.35;this.gustOffset=(this.rng()-.5)*2.2;this.a+=this.gustOffset*.35;this.shake=9;
      this.burst(g.x,g.y,'#d7f4e7',18);this.event('flak','돌풍에 휘말렸다! 조준이 흔들린다');
    }
  }
  this.gusts=this.gusts.filter(g=>g.life>0);
};

const _spawnFlakVisual=Game.prototype.spawnFlak;
Game.prototype.spawnFlak=function(){
  this.flakBursts??=[];
  const before=this.bullets.length;_spawnFlakVisual.call(this);
  const shell=this.bullets.length>before?this.bullets.at(-1):null;
  if(shell?.flak)this.flakBursts.push({x:shell.x,y:shell.y,a:Math.atan2(shell.vy,shell.vx),life:7,maxLife:7});
};

const _newAceSkill=Game.prototype.skill;
Game.prototype.skill=function(){
  if(!['udet','guynemer','baracca'].includes(this.pilot))return _newAceSkill.call(this);
  if(this.state!=='playing'||this.cooldown>0)return false;
  this.cooldown=this.skillCooldown();
  const activeDuration=this.skillDuration();
  if(this.pilot==='udet'){this.hp*=1-PILOT_BALANCE.udetHpCost;this.skillTime=activeDuration;this.udetBoost=activeDuration}
  else if(this.pilot==='guynemer'){this.skillTime=activeDuration;this.salvoWaves=this.skillEnhanced?Math.ceil(activeDuration/.36):8;this.salvoTimer=0;this.invuln=Math.max(this.invuln,.65)}
  else{this.skillTime=activeDuration;this.chargeTime=activeDuration;this.chargeAngle=this.a;this.chargeHits=new Set();this.invuln=Math.max(this.invuln,.9)}
  this.event('skill',PILOTS[this.pilot].skill);return true;
};
const _newAceUpdate=Game.prototype.update;
Game.prototype.update=function(dt,input={}){
  if(this.state!=='playing')return;
  const step=Math.min(.04,Math.max(0,dt)),boost=this.udetBoost>0,rate=this.rate,base=this.baseSpeed??this.speed;
  if(boost){this.baseSpeed=base*1.7;this.rate=rate/2.4}
  _newAceUpdate.call(this,step,input);
  if(boost){this.baseSpeed=base;this.rate=rate;this.udetBoost=Math.max(0,this.udetBoost-step)}

};

// Heavy, opposing-faction bombers are periodic enemies, never selectable aircraft.
const HEAVY_BOMBERS={central:[['staaken','체펠린 슈타켄 R.VI'],['gotha','고타 G.V 중폭격기'],['aeg_g4','AEG G.IV 중폭격기'],['friedrichshafen_g3','프리드리히스하펜 G.III']],
 entente:[['handley-page','핸들리 페이지 O/400'],['voisin8','부아생 VIII 야간폭격기'],['caudron_g4','코드롱 G.4 폭격기'],['fe2b','F.E.2b 푸셔 폭격기'],['breguet14','브레게 14 주간폭격기']]};
const HEAVY_BOMBERS_SEA={central:[],entente:[['felixstowe_f2','펠릭스토우 F.2 비행정']]};
Game.prototype._pickHeavy=function(){
 const sea=[1,7].includes(this.worldRegion?.()??-1),enemyFaction=PLANES[this.plane]?.faction==='central'?'entente':'central';
 const pool=[...(HEAVY_BOMBERS[enemyFaction]||[]),...(sea?(HEAVY_BOMBERS_SEA[enemyFaction]||[]):[])];
 return pool[Math.floor(this.rng()*pool.length)]||HEAVY_BOMBERS.entente[0];
};
const _spawnWithHeavy=Game.prototype.spawnEnemy;
Game.prototype.spawnEnemy=function(type){
 _spawnWithHeavy.call(this,type==='heavyBomber'?'bomber':type);
 if(type!=='heavyBomber')return;
 const e=this.enemies.at(-1);e.heavyBomber=true;e.ace=false;
 const pick=this._pickHeavy();e.airframe=pick[0];e.name=pick[1];
 e.maxHp=e.hp=Math.round(650*(1+this.t/160));e.speed=52*(1+this.t/900);e.fire=2.8;
};
const _updateWithHeavy=Game.prototype.update;
Game.prototype.update=function(dt,input={}){
 _updateWithHeavy.call(this,dt,input);
 if(this.state!=='playing')return;
 if(this.nextHeavyAt===undefined)this.nextHeavyAt=65;
 if(this.t>=this.nextHeavyAt&&this.enemies.length<64&&!this.enemies.some(e=>e.heavyBomber)){
  const heavy=this.spawnEnemy('heavyBomber');if(!heavy)return;this.nextHeavyAt=this.t+100+this.rng()*25;
  this.event('wave',heavy.name+' 출현 · 중기관총 탄막 주의');
 }
};

// Weapon-based ace specials reuse the game's detailed equipment sprites.
PILOTS.guynemer.skill='황새 편대 · 로켓 폭우';
PILOTS.guynemer.desc='3초간 날개에서 직진 로켓 48발을 연속 발사합니다.';
PILOTS.guynemer.cooldown=26;
PILOTS.baracca.skill='카발리노 람판테 · 일직선 돌격';
PILOTS.baracca.desc='1.2초간 바라보는 방향으로 고속 돌격합니다. 돌격 중 무적이며 경로상의 적에게 관통 피해.';
PILOTS.baracca.cooldown=28;
Game.prototype.combatBlast=function(x,y,radius,side='enemy',kind='blast'){
 this.combatFX??=[];this.combatFX.push({x,y,radius,side,kind,life:.65,maxLife:.65});
 this.burst(x,y,side==='enemy'?'#ff8542':'#ffd58a',18);this.smoke(x,y,true);
 this.shake=Math.max(this.shake,Math.hypot(x-this.x,y-this.y)<240?5:1);
 this.event('explosion',side);
};
Game.prototype.enemyVolley=function(e,followup=false){
 const heavy=e.heavyBomber,bomber=e.type==='bomber',n=heavy?7:e.type==='boss'?(this.t<90?4:this.t<180?5:7):e.type==='zeppelin'?15:bomber?3:1;
 const contact=this.enemyCombatTarget(e);
 const aim=e.type==='zeppelin'?Math.atan2(contact.y-e.y,contact.x-e.x):bomber?Math.atan2(contact.y+Math.sin(contact.a)*22-e.y,contact.x+Math.cos(contact.a)*22-e.x):e.a;
 const speed=heavy?235:bomber?210:185,power=1+this.t/240;
 const offsets=e.type==='zeppelin'?[-95,0,95]:heavy?[-42,42]:[0];e.muzzleFlash=.14;e.gunAim=aim;
 for(let j=0;j<n;j++){
  const offset=offsets[j%offsets.length],a=aim+(e.type==='boss'?(j/(n-1)-.5)*.9:(j-(n-1)/2)*(heavy?.13:.15))+(followup?.035:0);
  this.bullets.push({x:e.x+(e.type==='zeppelin'?Math.cos(e.a)*offset:Math.cos(e.a)*22-Math.sin(e.a)*offset),y:e.y+(e.type==='zeppelin'?Math.sin(e.a)*offset:Math.sin(e.a)*22+Math.cos(e.a)*offset),vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:4,enemy:true,heavy,visualType:e.type==='boss'||e.bossPilot?'boss':heavy?'heavyBomber':e.type,damage:Math.round((heavy?14:9)*power*(e.aceDamageMultiplier||1)*(e.vossSurge?1.3:1))});
 }
 this.event(heavy?'heavyShot':'enemyShot','');
};
Game.prototype.fireEnemy=function(e){
 e.fire=e.heavyBomber?2.8:e.type==='boss'?.65/(e.aceAttackRate||1):e.type==='zeppelin'?2.1:e.type==='bomber'?1.5:2.5;
 this.enemyVolley(e);if(e.heavyBomber){e.burstLeft=2;e.burstDelay=.2}else if(e.type==='zeppelin'){e.fire=3.2;e.burstLeft=1;e.burstDelay=.3}
};
const _combatUpdate=Game.prototype.update;
Game.prototype.update=function(dt,input={}){
 if(this.state!=='playing')return;
 const step=Math.min(.04,Math.max(0,dt));
 this.combatFX??=[];this.bombZones??=[];
 for(const fx of this.combatFX)fx.life-=step;
 this.combatFX=this.combatFX.filter(f=>f.life>0).slice(-35);
 if(this.salvoWaves>0){
  this.salvoTimer-=step;
  if(this.salvoTimer<=0){
   this.salvoTimer+=.36;this.salvoWaves--;
   const a=this.a;
   if(this.pilot==='guynemer'){
    for(let j=0;j<6;j++){const side=j<3?-1:1,angle=a+(j-2.5)*.055;
     this.bullets.push({x:this.x+Math.cos(a)*12-Math.sin(a)*side*23,y:this.y+Math.sin(a)*12+Math.cos(a)*side*23,vx:Math.cos(angle)*330,vy:Math.sin(angle)*330,life:this.longRange?this.shotLifetime(330):3.2,enemy:false,ownerId:this.id,damage:this.payloadPower(32.4),rocket:true,special:true,hit:new Set()});
    }this.event('rocketSalvo','');this.muzzleFlash=.12;

   }
  }
 }
 const charge=this.chargeTime>0,oldX=this.x,oldY=this.y;
 if(charge){this.invuln=Math.max(this.invuln,step+.02);this.a=this.chargeAngle}
 _combatUpdate.call(this,step,input);
 if(charge){
  this.a=this.chargeAngle;this.chargeTime=Math.max(0,this.chargeTime-step);
  const dx=this.x-oldX,dy=this.y-oldY,length=dx*dx+dy*dy;
  for(const e of this.enemies){const p=length?Math.max(0,Math.min(1,((e.x-oldX)*dx+(e.y-oldY)*dy)/length)):0;
   if(e.hp>0&&!this.chargeHits.has(e)&&Math.hypot(e.x-oldX-dx*p,e.y-oldY-dy*p)<(e.heavyBomber?85:52)){
    this.chargeHits.add(e);this.bullets.push({x:e.x,y:e.y,vx:0,vy:0,life:.15,enemy:false,ownerId:this.id,damage:this.damage*18,hit:new Set(),blast:true});this.combatBlast(e.x,e.y,48,'friendly','charge');
   }
  }
 }
 if(this.state!=='playing')return;
 for(const e of this.enemies){
  e.muzzleFlash=Math.max(0,(e.muzzleFlash||0)-step);
  if(this.sunStrikeContains(e))continue;
  if(e.burstLeft>0){e.burstDelay-=step;if(e.burstDelay<=0){e.burstLeft--;e.burstDelay=.2;this.enemyVolley(e,true)}}
  if(!e.heavyBomber)continue;
  e.bombTimer=(e.bombTimer??3)-step;
  if(e.bombTimer<=0&&Math.hypot(e.x-this.x,e.y-this.y)<650){
   e.bombTimer=6;const dx=Math.cos(this.a),dy=Math.sin(this.a);
   for(let i=0;i<3;i++)this.bombZones.push({x:this.x+dx*(i-1)*95,y:this.y+dy*(i-1)*95,sx:e.x,sy:e.y,delay:1.5+i*.22,maxDelay:1.5+i*.22,radius:52,damage:22+Math.floor(this.t/90)});
   this.event('bombWarning','폭격 투하! 붉은 표적을 벗어나세요');
  }
 }
 for(const z of this.bombZones){z.delay-=step;if(z.delay<=0){this.combatBlast(z.x,z.y,z.radius,'enemy','bomb');if(Math.hypot(this.x-z.x,this.y-z.y)<z.radius)this.hit(highRiskDamage(z.damage,this.maxHp,z))}}
 this.bombZones=this.bombZones.filter(z=>z.delay>0);
};

const _spacingUpdate=Game.prototype.update;
Game.prototype.update=function(dt,input={}){
 _spacingUpdate.call(this,dt,input);if(this.state!=='playing')return;
 for(let i=0;i<this.allies.length;i++)for(let j=i+1;j<this.allies.length;j++){
  const a=this.allies[i],b=this.allies[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
  if(d<42){const nx=d>0?dx/d:1,ny=d>0?dy/d:0,push=(42-d)*.5;a.x-=nx*push;a.y-=ny*push;b.x+=nx*push;b.y+=ny*push}
 }
};

// Travel is accumulated from actual movement, including evasions and charges.
const _worldSpawn=Game.prototype.spawnEnemy;
Game.prototype.spawnEnemy=function(type){
 if(type==='zeppelin'&&this.enemies.filter(e=>e.type==='zeppelin'&&e.hp>0).length>=2)type='bomber';
 if(type==='boss'){
  const live=new Set(this.enemies.filter(e=>e.hp>0&&e.bossPilot).map(e=>e.bossPilot));
  if(live.size>=8)return;
  const available=Object.keys(PILOTS).filter(id=>PILOTS[id].faction!==PLANES[this.plane].faction&&!live.has(id));
  this.bossDeck=[...new Set(this.bossDeck||[])].filter(id=>available.includes(id));
  if(!this.bossDeck.length){this.bossDeck=available;for(let i=this.bossDeck.length-1;i>0;i--){const j=Math.floor(this.rng()*(i+1));[this.bossDeck[i],this.bossDeck[j]]=[this.bossDeck[j],this.bossDeck[i]]}}
  if(!this.bossDeck.length)return;
 }
 _worldSpawn.call(this,type);const e=this.enemies.at(-1);e.ace=false;if(type==='zeppelin'){e.hp=e.maxHp=Math.round(e.hp*1.6);e.hitRadius=90;e.hullLength=170;e.hullWidth=45;}
 if(type!=='boss')return;
 if(!this.bossDeck?.length){this.bossDeck=Object.keys(PILOTS).filter(id=>PILOTS[id].faction!==PLANES[this.plane].faction);for(let i=this.bossDeck.length-1;i>0;i--){const j=Math.floor(this.rng()*(i+1));[this.bossDeck[i],this.bossDeck[j]]=[this.bossDeck[j],this.bossDeck[i]]}}
 const threatWeight=.12+.88*Math.min(1,this.t/600);const weights=this.bossDeck.map(id=>['baron','fonck'].includes(id)?threatWeight:1);let roll=this.rng()*weights.reduce((a,b)=>a+b,0),pick=weights.length-1;for(let i=0;i<weights.length;i++){roll-=weights[i];if(roll<=0){pick=i;break}}
 e.bossPilot=this.bossDeck.splice(pick,1)[0];e.bossPlane=PILOT_PLANES[e.bossPilot];e.name=PILOTS[e.bossPilot].name;e.ace=true;
 e.hp=e.maxHp=Math.round(700*(1+this.t/150));e.abilityTimer=4;e.fire=.8;e.encounterPending=true;e.aceSpawnT=this.t;if(e.bossPilot==='baron')e.speed*=2.4;
 if(e.bossPilot==='bishop'){e.hp=e.maxHp=Math.round(e.maxHp*ENEMY_BOSS_BALANCE.bishopHpMultiplier);e.speed*=1.1;e.abilityTimer=ENEMY_BOSS_BALANCE.bishopFirstAbility;e.fire=.5}
 this.event('wave','적 에이스 · '+e.name+' / '+PILOTS[e.bossPilot].skill);
};
const _newPilotSkill=Game.prototype.skill;
Game.prototype.skill=function(){
 if(!['bishop','goering'].includes(this.pilot))return _newPilotSkill.call(this);
 if(this.state!=='playing'||this.cooldown>0)return false;
 this.cooldown=this.skillCooldown();
 if(this.pilot==='bishop'){this.skillTime=this.bishopTime=this.skillDuration();this.invuln=Math.max(this.invuln,this.skillTime);this.bishopDrops=Math.ceil(8*(this.skillTime/2.4));this.bishopBombTimer=.5;this.bishopHeading=this.a}
 else{this.skillTime=this.wingBoost=this.skillDuration()}
 this.event('skill',PILOTS[this.pilot].skill);return true;
};
Game.prototype.aceAttack=function(e){
 const id=e.bossPilot;
 if(['baron','voss','baracca','immelmann'].includes(id)){e.a=Math.atan2(this.y-e.y,this.x-e.x);e.bossDash=1.1}
 if(id==='goering'&&this.enemies.length<60){for(let i=0;i<2;i++){const wing=this.spawnEnemy('hunter');if(!wing)break;wing.x=e.x+(i?70:-70);wing.y=e.y+40;wing.hp=wing.maxHp=80*(1+this.t/180);wing.escortPlane='white-fokkerdv55';attachAircraftPersonality(PLANES,wing,wing.escortPlane,{retuneCruise:true});wing.fire=.3}}
 if(id==='bishop'){const f=Math.max(80,this.speed*.8),ca=Math.cos(this.a),sa=Math.sin(this.a),px=-sa,py=ca;for(let i=0;i<8;i++){const row=Math.floor(i/4),lane=i%4-1.5,delay=.9+(i%4)*.16+row*.18;this.bombZones.push({x:this.x+ca*(f+row*92)+px*lane*72,y:this.y+sa*(f+row*92)+py*lane*72,sx:e.x,sy:e.y,delay,maxDelay:delay,radius:50,damage:25*(e.aceDamageMultiplier||1),maxHpFraction:.04})}}
 if(id==='guynemer'){const aim=Math.atan2(this.y-e.y,this.x-e.x);for(let i=0;i<9;i++){const a=aim+(i-4)*.05;this.bullets.push({x:e.x,y:e.y,vx:Math.cos(a)*230,vy:Math.sin(a)*230,life:3,enemy:true,hostileRocket:true,aceSpecial:true,damage:20*(e.aceDamageMultiplier||1)})}}
 else if(id==='fonck'){const a=Math.atan2(this.y-e.y,this.x-e.x);this.bullets.push({x:e.x,y:e.y,vx:Math.cos(a)*360,vy:Math.sin(a)*360,life:2,enemy:true,heavy:true,visualType:'boss',aceSpecial:true,damage:30*(e.aceDamageMultiplier||1)})}
 else{this.enemyVolley(e);if(['udet','boelcke','goering'].includes(id)){e.burstLeft=3;e.burstDelay=.18}}
 this.event('wave',e.name+' · '+PILOTS[id].skill);
};
const _worldUpdate=Game.prototype.update;
Game.prototype.update=function(dt,input={}){
 if(this.state!=='playing')return;
 const step=Math.min(.04,Math.max(0,dt)),x=this.x,y=this.y;
 this.wingBoost=Math.max(0,(this.wingBoost||0)-step);
 if(this.bishopTime>0){this.invuln=Math.max(this.invuln,step+.05);this.bishopTime=Math.max(0,this.bishopTime-step);if(this.bishopTime===0)this.bishopEmptyPending=true;this.bishopBombTimer-=step;
  if(this.bishopDrops>0&&this.bishopBombTimer<=0){this.bishopDrops--;this.bishopBombTimer=.23;
   const target=this.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-this.x,a.y-this.y)-Math.hypot(b.x-this.x,b.y-this.y))[0];
   const bx=target?.x??this.x+Math.cos(this.a)*120,by=target?.y??this.y+Math.sin(this.a)*120;
   this.queueExplosionDamage(bx,by,110,this.payloadPower(90));
  }
 }
 _worldUpdate.call(this,step,input);
 if(this.bishopEmptyPending){this.bishopEmptyPending=false;this.ammo.fill(0);this.reloadTime=0;this.fire=.1;this.muzzleFlash=0;this.event('wave','폭격 종료 · 탄약 소진, 재장전 필요')}
 this.distance=(this.distance||0)+Math.hypot(this.x-x,this.y-y);
 const region=this.worldRegion();
 if(this.region!==region)this.enterRegion(region)
 if(this.state!=='playing')return;
 this.regionThreat=(this.regionThreat??20)-step;if(this.regionThreat<=0){this.regionThreat=24;if([1,7].includes(region)&&this.enemies.length<60)this.spawnEnemy(this.rng()<.12?'zeppelin':'bomber');this.spawnFlak()}
 for(const e of this.enemies){if(!e.bossPilot)continue;e.bossDash=Math.max(0,(e.bossDash||0)-step);if(e.aceRetreat){e.a=Math.atan2(e.y-this.y,e.x-this.x);e.x+=Math.cos(e.a)*e.speed*1.15*step;e.y+=Math.sin(e.a)*e.speed*1.15*step;e.fire=9;if(Math.hypot(e.x-this.x,e.y-this.y)>1500){e.expired=true;if(!e.crashing&&!e.crashed)e.hp=-1}continue}if(this.sunStrikeContains(e))continue;if((e.aceSpawnT??this.t)&&this.t-e.aceSpawnT>75){e.aceRetreat=true;this.event('wave',e.name+' · 이탈 — 교전 한계 초과');continue}e.abilityTimer-=step;if(e.abilityTimer<=0){e.abilityTimer=e.bossPilot==='bishop'?ENEMY_BOSS_BALANCE.bishopAbilityMin+this.rng()*ENEMY_BOSS_BALANCE.bishopAbilityVariance:7+this.rng()*3;this.aceAttack(e)}}
};

Game.prototype.wreckGust=function(e){
 this.gusts??=[];const a=Math.atan2(this.y-e.y,this.x-e.x);
 this.gusts.push({x:e.x,y:e.y,vx:Math.cos(a)*170,vy:Math.sin(a)*170,a:a+Math.PI/2,life:6,maxLife:6,radius:78,hit:false,wreck:true});
 this.event('flak','비행선 붕괴! 충격 돌풍 접근');
};

// Separate weapon families: gun upgrades never silently multiply every payload.
Game.prototype.payloadPower=function(base){return base*(1+(this.explosiveBonus||0))*(this.doctrine==='강습 편대'?1.15:1)};
Game.prototype.supportPower=function(base){return base*(1+(this.commandBonus||0))*(this.doctrine==='강습 편대'?1.15:1)};
export const AUGMENT_BALANCE=Object.freeze({damage:[.18,.27,.36],turn:[.2,.32,.45],speed:[.05,.08,.12],energyRecovery:[.08,.12,.18],turnCap:1.5,speedCap:.4,energyRecoveryCap:.6,support:[.3,.5,.75],spreadBonus:[0,.08,.16],armorHeal:[.08,.12,.18]});
Game.prototype.addGunBonus=function(amount){const before=this.gunUpgradeBonus||0;this.gunUpgradeBonus=before+amount;this.damage*=(1+this.gunUpgradeBonus)/(1+before)};
Game.prototype.addMobility=function(t){const turn=this.turnUpgradeBonus||0,speed=this.speedUpgradeBonus||0,recovery=this.energyRecoveryBonus||0;this.turnUpgradeBonus=Math.min(AUGMENT_BALANCE.turnCap,turn+AUGMENT_BALANCE.turn[t]);this.speedUpgradeBonus=Math.min(AUGMENT_BALANCE.speedCap,speed+AUGMENT_BALANCE.speed[t]);this.energyRecoveryBonus=Math.min(AUGMENT_BALANCE.energyRecoveryCap,recovery+AUGMENT_BALANCE.energyRecovery[t]);this.turn*=(1+this.turnUpgradeBonus)/(1+turn);const factor=(1+this.speedUpgradeBonus)/(1+speed);this.enemyCruiseReference??=this.baseSpeed??this.speed;this.speed*=factor;if(this.baseSpeed)this.baseSpeed*=factor};
export const DURABILITY_BALANCE=Object.freeze({repairPickupFraction:.16,baseRegenHpPerSecond:1,regenPerSecond:[.005,.008,.012],regenCap:.04,legendaryRegenFraction:.025,armorBonus:[18,28,40],maxBonusHp:180});
export const PLAYER_SPEED_BALANCE=Object.freeze({enemyCruiseFraction:.9});
export const ENEMY_MOVEMENT_BALANCE=Object.freeze({
 regularLateCap:1.18,laterLoopCap:1.28,aceCruiseCap:1.28,eliteCruiseCap:1.28,
 aceTurnCap:2.25,aceVisualScale:1.05,aceHitRadius:19,aceContactRadius:21,
 aceMuzzleOffset:25,dashMultiplier:3
});
export function enemyAircraftScale(e){return e?.visualScale??(e?.type==='boss'?ENEMY_MOVEMENT_BALANCE.aceVisualScale:e?.type==='bomber'?1.35:.9)}
export function enemyAircraftHitRadius(e){return e?.hitRadius??(e?.heavyBomber?55:e?.type==='zeppelin'?42:e?.type==='boss'?ENEMY_MOVEMENT_BALANCE.aceHitRadius:e?.type==='bomber'?23:17)}
export function applyEnemyMovementLimits(g,e){
 if(!e||e.surface||e.stationary||e.fieldUnit||e.navalVessel||e.stageBossBody)return e;
 const loop=Math.max(0,g.stageBoss?.stages.loopIndex||0),late=loop>0?ENEMY_MOVEMENT_BALANCE.laterLoopCap:ENEMY_MOVEMENT_BALANCE.regularLateCap;
 if(e.bossPilot||e.type==='boss'){
  const airframe=PLANES[e.bossPlane]||PLANES[e.escortPlane],base=(airframe?.speed||125)*1.18;
  e.cruiseSpeedCap=base*ENEMY_MOVEMENT_BALANCE.aceCruiseCap;e.speed=Math.min(e.speed,e.cruiseSpeedCap);
  e.visualScale=ENEMY_MOVEMENT_BALANCE.aceVisualScale;e.hitRadius=ENEMY_MOVEMENT_BALANCE.aceHitRadius;e.contactRadius=ENEMY_MOVEMENT_BALANCE.aceContactRadius;e.muzzleOffset=ENEMY_MOVEMENT_BALANCE.aceMuzzleOffset;
 }else if(['scout','hunter','bomber'].includes(e.type)){
  const rawBase=e.type==='bomber'?65:e.type==='hunter'?117:90;e.cruiseSpeedCap=Math.min((g.enemyCruiseReference??g.baseSpeed??g.speed)*PLAYER_SPEED_BALANCE.enemyCruiseFraction,rawBase*late);e.speed=Math.min(e.speed,e.cruiseSpeedCap);
 }
 return e;
}
export const ENEMY_BOSS_BALANCE=Object.freeze({lateStart:300,lateInterval:120,lateCount:2,collishawEscorts:7,bishopHpMultiplier:1.35,bishopFirstAbility:3,bishopAbilityMin:4.5,bishopAbilityVariance:1.5});
export const LEGENDARY_BALANCE=Object.freeze({mineInterval:.7,mineLife:14,mineDamage:80,wingmanDamageMultiplier:1.25,motorCannonInterval:3,motorCannonDamage:180,lowHpMaxBonus:1});
export const TAILING_BALANCE=Object.freeze({minDistance:70,maxDistance:380,rearCone:.92,aimCone:.5,lockTime:.42,decay:1.5,damageMultiplier:1.5,maintainMinDistance:55,maintainMaxDistance:410,maintainRearCone:1.02,maintainAimCone:.64,graceTime:.42});
export const SPECIAL_AMMO=Object.freeze({
 incendiary:Object.freeze({name:'소이탄',rounds:500,color:'#ff9a4a',desc:'가연성 관측기구·비행선에 큰 추가 피해'}),
 armorPiercing:Object.freeze({name:'철갑탄',rounds:500,color:'#dce7dc',desc:'중장갑 표적 추가 피해 · 2기 관통'}),
 tracer:Object.freeze({name:'예광탄',rounds:500,color:'#ff5b45',desc:'빠른 탄속과 넓은 명중 판정'}),
 explosive:Object.freeze({name:'폭발탄',rounds:500,color:'#ffd06a',desc:'명중 지점 주변 적에게 유폭 피해'})
});
export const GOERING_WING_BOOST=Object.freeze({duration:5,damageMultiplier:3,fireRateMultiplier:2});
export const LEGENDARIES=[
 {id:'redScarf',name:'붉은남작의 머플러',desc:'이동 속도 +45%, 적 후방 추적 판정 거리 +25%·고정 시간 −35%. 한 출격 1회.'},
 {id:'prancingHorse',name:'바라카의 검은 말 문장',desc:'이동 속도 +20%, 전방에서 받는 피해 −25%. 한 출격 1회.'},
 {id:'ironCross',name:'푸르 르 메리트',desc:'파일럿 액티브가 강화되고 재사용 대기시간이 20% 감소합니다. 한 출격 1회.'},
 {id:'telescope',name:'르네 퐁크의 망원경',desc:'전방 약 21° 안의 적을 초점 포착하여 초기 0.8초 동안 최대 17° 조준 보정. 한 출격 1회.'},
 {id:'flightGloves',name:'빌리 비숍의 비행장갑',desc:'모든 무기 발사 간격 −40% · 재장전 시간 −55% (파일럿 액티브 재사용 대기시간 제외). 한 출격 1회.'},
 {id:'sparkPlug',name:'맥커든의 비상수선키트',desc:'10초마다 최대 내구도의 20%를 회복합니다. 한 출격 1회.'},
 {id:'goeringBaton',name:'전투비행대 총동원령',desc:'상시 윙맨 +3, 윙맨 피해 +25%. 한 출격 1회.'},
 {id:'immelmannManual',name:'임멜만의 기동전술 교본',desc:'선회기동 재사용 대기시간 −50%, 기동 무적 1.05초. 한 출격 1회.'},
 {id:'motorCannon',name:'기네메르의 37mm 모퇴르 카농',desc:'3초마다 전방으로 피해 180의 거대한 37mm 관통탄을 발사합니다. 한 출격 1회.'},
 {id:'loEmblem',name:'LO! 페인팅 엠블럼',desc:'최대 내구도 −50%, 기관총·폭발물·편대 피해 +30%, 편대 연사 +30%, 이동 속도·선회력 +20%. 한 출격 1회.'},
 {id:'sacredCowling',name:'황제의 얼굴 카울링',desc:'근거리 적에게 주는 피해 +25%. 적이 가까울수록 받는 탄환 피해가 최대 20% 감소합니다. 한 출격 1회.'},
 {id:'urLeica',name:'Ur-Leica 소형 카메라',desc:'전과를 사진으로 기록합니다. 게임 종료 시 최종 격추 기록 +10% (소수점 버림). 한 출격 1회.'}
];
for(const u of LEGENDARIES)UPGRADES.push({...u,legendary:true,apply:()=>{}});
const tierIndex=rarity=>rarity==='rare'?2:rarity==='magic'?1:0;
const upgradeNames={turn:'기동 개량 · 프로펠러와 조종면',wingman:'상시 윙맨 · 편대 합류',bomber:'전략 폭격대 · 지원 요청',explosives:'고폭탄 충전 · 폭발물 개량',command:'편대 사격 교범',damage:'기관총 개조 · 스팬다우/비커스'};
for(const id of ['bomber','explosives','command'])UPGRADES.push({id,name:upgradeNames[id],desc:'',apply:()=>{}});
for(const u of UPGRADES){if(upgradeNames[u.id])u.name=upgradeNames[u.id];u.uniqueOnly=['wingman','bomber'].includes(u.id)}
export function upgradeDescription(id,rarity='normal',g){
 if(g?.augmentationDescription)return g.augmentationDescription(id,rarity,g);
 const t=tierIndex(rarity),extra=[0,8,16][t];
 return LEGENDARIES?.find(u=>u.id===id)?.desc||({damage:`기본 기관총 공격력의 ${[18,27,36][t]}% 추가 (중복 보너스 합산). 바라카 돌격·임멜만 관통사격에도 적용. 로켓·수류탄·지원기는 별도 강화.`,
 rate:`기관총 발사 간격 −${[10,14,20][t]}% (최소 0.045초). 탄약 소모도 빨라집니다.`,
 spread:'기관총 발사체 +1 (최대 5발). 추가 탄환은 탄약을 더 소모하지 않습니다.',
 rockets:`르 프리외르 직진 고폭 로켓 +1발 (최대 5발 동시 발사). 탄속 520, 폭발 범위 84 · 주변 적에 50% 피해. 중복 획득 시 발사 주기가 단축됩니다.${extra?' 폭발물 공통 공격력 +'+extra+'%p.':''} 피해 강화: 고품질 화약 개량.`,
 mines:`후방 수류탄 투척 장비 +1단계 (최대 5). 기본 피해 64, 감지 72, 폭발 110, 지속 20초. 중복 획득 시 투척 주기 단축.${extra?' 폭발물 공통 공격력 +'+extra+'%p.':''} 피해 강화: 고품질 화약 개량.`,
 explosives:`로켓·수류탄·폭탄·37mm 포탄 등 모든 폭발물 피해 +${[30,50,75][t]}%p.`,
 command:`윙맨·콜리쇼·매녹 편대 피해 +${[30,50,75][t]}%p. 괴링의 편대 액티브와 함께 적용.`,
 wingman:'아군 편대기 +1 (상한 7대). 피해 강화: 편대 비행 교범.',
 bomber:`아군 폭격기가 ${Math.max(10,18-(g?.bomberLevel||0)*2)}초마다 등장해 폭탄 5발 투하. 중복 획득 시 주기 2초 단축 (최소 10초). 피해 강화: 고품질 화약 개량.`,
 armor:`최대 내구도 +${DURABILITY_BALANCE.armorBonus[t]}. 증가한 내구도만큼 즉시 회복.`,
 turn:`기본 선회력의 ${[20,32,45][t]}%, 이동 속도의 ${[8,12,18][t]}% 추가. 합산 상한: 선회 +150%, 이속 +60%.`,
 mercedesEngine:'이동 속도 +20%. 한 출격 1회.',
 combinedProjectiles:`르 프리외르 로켓과 수류탄의 동시 발사체 +1 (각 최대 5발).`,
 cooldown:`액티브 재사용 시간 −${[8,12,16][t]}% (기본의 50%까지). ${g?'효과 종료 후 최소 '+g.skillRecovery()+'초 대기.':'파일럿별 최소 대기시간 적용.'}${g?' 현재 '+g.skillCooldown().toFixed(1)+'초.':''}`,
 regen:`초당 최대 내구도 회복 +${[.6,1,1.5][t]}% (합계 최대 초당 4%).`})[id]||'';
}
for(const u of UPGRADES)u.desc=upgradeDescription(u.id,u.uniqueOnly?'unique':'normal');
Game.prototype.rollChoices=function(){
 const picks=[];
 for(let slot=0;slot<3;slot++){
  const r=this.rng(),rarity=r<.6?'normal':r<.88?'rare':'unique';
  let pool=UPGRADES.filter(u=>!picks.some(p=>p.id===u.id)&&(!u.uniqueOnly||rarity==='unique')&&
   (!u.legendary)&&(u.id!=='cooldown'||this.cooldownMult>.5&&this.skillCooldown()>this.skillDuration()+this.skillRecovery())&&(u.id!=='spread'||this.shots<5)&&(u.id!=='rockets'||this.rockets<6)&&(u.id!=='mines'||this.mineCount<6)&&
   (u.id!=='bomber'||(this.bomberLevel||0)<5)&&(u.id!=='regen'||(this.regen||0)<DURABILITY_BALANCE.regenCap-1e-9)&&(u.id!=='rate'||this.rate>.045+1e-9)&&(u.id!=='magnet'||this.magnet<480)&&(u.id!=='turn'||(this.turnUpgradeBonus||0)<AUGMENT_BALANCE.turnCap-1e-9||(this.speedUpgradeBonus||0)<AUGMENT_BALANCE.speedCap-1e-9)&&
   (u.id!=='explosives'||this.rockets>0||this.mineCount>0||this.bomberLevel||this.motorCannon||this.legendaryMineTrail||['bishop','guynemer'].includes(this.pilot))&&
   (u.id!=='command'||this.permanentWingman||['goering','collishaw','mannock'].includes(this.pilot)));
  const fresh=pool.filter(u=>!(this.lastChoices||[]).includes(u.id));if(fresh.length>=2)pool=fresh;
  const weighted=pool.flatMap(u=>u.uniqueOnly?[u,u,u]:[u]);const u=weighted[Math.floor(this.rng()*weighted.length)];if(u)picks.push({...u,rarity});
 }
 const legendaryOffers=this.legendaryOffers??(this.legendaryOffered?1:0),legendaryLimit=this.level>=20?4:this.level>=10?2:1,legendaryPool=this.mission?.unarmed||legendaryOffers>=legendaryLimit||this.legendaryCount()>=legendaryLimit?[]:LEGENDARIES.filter(u=>(u.id!=='rearGunner'||!this.weapon.bidirectional&&!this.rearGunner)&&!(u.id==='cow37'&&this.upgrades.quadLewis)&&!(u.id==='quadLewis'&&this.upgrades.cow37)&&!(u.id==='maximBelt'&&this.cow37)&&!this.upgrades[u.id]&&!(this.seenLegendaries||[]).includes(u.id));
 if(legendaryPool.length>=3&&(this.rng()<this.legendaryChance()||this.level>=(legendaryOffers===0?5:legendaryOffers===1?12:22))){
  const available=[...legendaryPool];picks.length=0;
  // One arsenal slot per legendary draft; remaining slots retain the full catalog.
  for(let slot=0;slot<3;slot++){const arsenal=available.filter(u=>['quadLewis','cow37','rankinShell','kaiserFog'].includes(u.id)),pool=slot===0&&arsenal.length?arsenal:available;const u=pool[Math.floor(this.rng()*pool.length)];if(!u)break;available.splice(available.indexOf(u),1);picks.push({...u,legendary:true,rarity:'legendary'})}
  this.legendaryOffered=true;this.legendaryOffers=legendaryOffers+1;this.seenLegendaries??=[];this.seenLegendaries.push(...picks.map(u=>u.id));
 }
 this.lastChoices=picks.map(u=>u.id);return picks;
};
Game.prototype.rerollLegendaryChoices=function(current=[]){
 if(this.state!=='upgrade'||!current.length||!current.every(u=>(u.rarity||'legendary')==='legendary'))return null;
 const excluded=new Set(current.map(u=>u.id)),pool=LEGENDARIES.filter(u=>!excluded.has(u.id)&&!this.upgrades[u.id]&&
  (u.id!=='rearGunner'||!this.weapon.bidirectional&&!this.rearGunner)&&!(u.id==='cow37'&&this.upgrades.quadLewis)&&!(u.id==='quadLewis'&&this.upgrades.cow37));
 if(pool.length<3)return null;for(let i=pool.length-1;i>0;i--){const j=Math.floor(this.rng()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
 const picks=pool.slice(0,3).map(u=>({...u,legendary:true,rarity:'legendary'}));this.seenLegendaries??=[];this.seenLegendaries.push(...picks.map(u=>u.id));this.lastChoices=picks.map(u=>u.id);return picks;
};
Game.prototype.legendaryChance=function(){return Math.min(.5,Math.max(.05,(this.level||1)*.05))};
Game.prototype.legendaryCount=function(){return LEGENDARIES.reduce((count,item)=>count+(this.upgrades[item.id]?1:0),0)};
Game.prototype.recordedKills=function(){const k=this.priorityKills||0;return this.upgrades?.urLeica?Math.floor(k*1.1):k};
Game.prototype.upgrade=function(id,rarity='normal'){
 if(this.state!=='upgrade')return;const u=UPGRADES.find(u=>u.id===id),legendaryLimit=this.level>=20?4:this.level>=10?2:1;if(!u||u.uniqueOnly&&rarity!=='unique'||u.legendary&&(rarity!=='legendary'||this.upgrades[id]||this.legendaryCount()>=legendaryLimit)||id==='cow37'&&this.upgrades.quadLewis||id==='quadLewis'&&this.upgrades.cow37)return;
 const t=tierIndex(rarity);
 switch(id){
 case 'redScarf':this.enemyCruiseReference??=this.baseSpeed??this.speed;this.speed*=1.45;if(this.baseSpeed)this.baseSpeed*=1.45;this.magnet=Math.min(480,this.magnet+120);break;
 case 'prancingHorse':this.legendaryMineTrail=true;this.legendaryMineTimer=0;break;
 case 'ironCross':{const ratio=this.hp/this.maxHp,base=this.baseMaxHp??PLANES[this.plane].hp;this.baseMaxHp=base;this.maxHp=Math.min(base+DURABILITY_BALANCE.maxBonusHp,this.maxHp+base*.60);this.hp=this.maxHp*ratio;this.skillEnhanced=true;break;}
 case 'telescope':this.longRange=true;this.damage*=1.15;break;
 case 'flightGloves':this.rate=Math.max(.045,this.rate*.60);this.weapon.reload=Math.max(.45,this.weapon.reload*.45);this.reloadTime=Math.min(this.reloadTime,this.weapon.reload);break;
 case 'sparkPlug':this.legendaryRegen=DURABILITY_BALANCE.legendaryRegenFraction;break;
 case 'goeringBaton':this.permanentWingman=(this.permanentWingman||0)+3;this.wingmanDamageMult=LEGENDARY_BALANCE.wingmanDamageMultiplier;break;
 case 'immelmannManual':this.evadeCooldownMult=.5;this.evadeInvulnerability=1.05;this.evadeCooldown=Math.min(this.evadeCooldown,4);break;
 case 'motorCannon':this.motorCannon=true;this.motorCannonTimer=0;break;
 case 'loEmblem':this.lowHpDamage=true;break;
 case 'sacredCowling':this.turn*=1.6;this.handlingDragMult=0;this.airframeSpeed=1;this.evadeCooldownMult=.5;this.evadeCooldown=Math.min(this.evadeCooldown,4);break;
 case 'damage':this.addGunBonus(AUGMENT_BALANCE.damage[t]);break;
 case 'rate':this.rate=Math.max(.045,this.rate*(1-[.1,.14,.2][t]));break;
 case 'spread':{const baseBelt=this.baseBeltCapacity??this.weapon.belt,ammoBonus=Math.max(10,Math.round(baseBelt*.15));this.baseBeltCapacity=baseBelt;this.shots=Math.min(5,this.shots+1);this.weapon.belt+=ammoBonus;this.ammo=this.ammo.map(rounds=>Math.min(this.weapon.belt,rounds+ammoBonus));this.addGunBonus(AUGMENT_BALANCE.spreadBonus[t]);break;}
 case 'rockets':this.rockets=Math.min(6,this.rockets+1);this.rocketFire=0;this.explosiveBonus=(this.explosiveBonus||0)+[0,.08,.16][t];break;
 case 'mines':this.mineCount=Math.min(6,this.mineCount+1);this.mineTimer=0;this.explosiveBonus=(this.explosiveBonus||0)+[0,.08,.16][t];break;
 case 'explosives':this.explosiveBonus=(this.explosiveBonus||0)+AUGMENT_BALANCE.support[t];break;
 case 'command':this.commandBonus=(this.commandBonus||0)+AUGMENT_BALANCE.support[t];break;
 case 'wingman':this.permanentWingman=(this.permanentWingman||0)+1;break;
 case 'bomber':this.bomberLevel=Math.min(5,(this.bomberLevel||0)+1);this.bomberTimer=Math.min(this.bomberTimer??2,2);break;
 case 'armor':this.maxHp+=DURABILITY_BALANCE.armorBonus[t];if(this.hp>0)this.hp=Math.min(this.maxHp,this.hp+this.maxHp*AUGMENT_BALANCE.armorHeal[t]);break;
 case 'turn':this.addMobility(t);break;
 case 'magnet':this.magnet=Math.min(480,this.magnet*(1+[.3,.45,.6][t]));break;
 case 'cooldown':this.cooldownMult=Math.max(.5,this.cooldownMult*(1-[.08,.12,.16][t]));break;
 case 'regen':this.regen=Math.min(DURABILITY_BALANCE.regenCap,(this.regen||0)+DURABILITY_BALANCE.regenPerSecond[t]);break;
 }
 this.upgrades[id]=(this.upgrades[id]||0)+1;this.state='playing';this.checkLevel();
};
const _friendlyBomberUpdate=Game.prototype.update;
Game.prototype.update=function(dt,input={}){
 if(this.state!=='playing')return;const step=Math.min(.04,Math.max(0,dt));
 _friendlyBomberUpdate.call(this,step,input);if(this.state!=='playing')return;
 this.friendlyBombers??=[];this.friendlyBombs??=[];
 if(this.bomberLevel){this.bomberTimer=(this.bomberTimer??2)-step;if(this.bomberTimer<=0){
  this.bomberTimer=Math.max(10,18-(this.bomberLevel-1)*2);const a=this.a;
  this.friendlyBombers.push({ox:this.x,oy:this.y,x:this.x-Math.cos(a)*650,y:this.y-Math.sin(a)*650,a,age:0,drop:.8,left:5,airframe:[...(HEAVY_BOMBERS[PLANES[this.plane].faction]||[]),...([1,7].includes(this.worldRegion?.()??-1)?(HEAVY_BOMBERS_SEA[PLANES[this.plane].faction]||[]):[])][Math.floor(this.rng()*([...(HEAVY_BOMBERS[PLANES[this.plane].faction]||[]),...([1,7].includes(this.worldRegion?.()??-1)?(HEAVY_BOMBERS_SEA[PLANES[this.plane].faction]||[]):[])].length))][0]});
  this.event('ally','아군 폭격대 진입 · 폭탄 5발 투하');
 }}
 for(const b of this.friendlyBombers){b.age+=step;const d=-650+b.age*480;b.x=b.ox+Math.cos(b.a)*d;b.y=b.oy+Math.sin(b.a)*d;b.drop-=step;
  if(b.left>0&&b.drop<=0){b.drop=.42;b.left--;const targets=this.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-b.x,e.y-b.y)<650);const target=targets[Math.floor(this.rng()*targets.length)];
   this.friendlyBombs.push({sx:b.x,sy:b.y,x:target?.x??b.x+Math.cos(b.a)*120,y:target?.y??b.y+Math.sin(b.a)*120,life:.55,maxLife:.55,damage:this.payloadPower(80),radius:100});
  }
 }
 this.friendlyBombers=this.friendlyBombers.filter(b=>b.age<3.6);
 for(const b of this.friendlyBombs){b.life-=step;if(b.life<=0)this.queueExplosionDamage(b.x,b.y,b.radius,b.damage)}
 this.friendlyBombs=this.friendlyBombs.filter(b=>b.life>0);
};

// Revision 51: bounded skill recovery, distinct airframes and the 74 Squadron.
PLANES.eindecker={name:'포커 E.III 아인데커',role:'단엽 반전기동형',faction:'central',speed:140,turn:3.1,hp:95,rate:.2,color:'#c6b68b',wings:1};
WEAPONS.eindecker={...WEAPONS.fokker,guns:1,reload:2.1};
PLANES.se5a={name:'S.E.5a',role:'근거리 편대 강습',faction:'entente',speed:168,turn:2.9,hp:110,rate:.18,color:'#7c8051',wings:2};
WEAPONS.se5a={...WEAPONS.camel,name:'Vickers / Lewis',guns:2};
PILOTS.mannock={name:'믹 매녹',alias:'74 SQUADRON',faction:'entente',portrait:1,skill:'74비행단 교차 급강하',desc:'기관총 사거리 −55%. S.E.5a 7대가 위→아래 한 번, 오른쪽→왼쪽 한 번 교차 관통 사격.',cooldown:28};
PILOTS.baron.cooldown=18;PILOTS.baron.skill='Dreidecker';PILOTS.baron.passive='사냥 본능';PILOTS.baron.passiveDesc='강한 적을 오래 추적할수록 해당 대상에게 주는 피해가 증가합니다. 사냥감 격추 시 잠시 빨라집니다.';PILOTS.baron.desc='속도를 낮춰 극단적으로 선회합니다. 적의 후방을 잡으면 즉시 추격 가속합니다.';
PILOTS.voss.desc='즉시 180° 선회하며 적 탄환을 제거합니다. 무적 1초.';
PILOTS.immelmann.desc='아인데커로 상승 반전 후 관통 사격. 무적 1.1초.';
PILOTS.boelcke.desc='3초간 기관총 공격력 ×1.8. 무적 효과 없음.';
PILOTS.collishaw.desc='플레이어와 같은 크기의 검은 삼엽기 3대가 완만하게 좌우 기동하며 5.2초간 사격. 무적 없음.';
PILOTS.baracca.desc='0.9초 무적 직선 돌격. 경로 피해는 기관총 강화에 비례.';
PILOTS.bishop.desc='기관총 사거리 −55%, 공격력 +80%. 2.4초 무적 폭격 후 탄약 소진.';
Game.prototype.skillDuration=function(){if(this.isRedHunter())return 4*(this.skillEnhanced?1.35:1);const d=({baron:4,fonck:4,voss:1,boelcke:PILOT_BALANCE.boelckeDuration,collishaw:5.2,baracca:.9,immelmann:2.8,udet:5,guynemer:3,bishop:2.4,goering:GOERING_WING_BOOST.duration,mannock:7.2,mckeever:5,huffzky:5})[this.pilot]||3;return this.skillEnhanced&&['mckeever','huffzky'].includes(this.pilot)?d*1.35:d};
Game.prototype.skillRecovery=function(){return PILOT_BALANCE.recovery[this.isRedHunter()?'baron_albatros':this.pilot]??6};
Game.prototype.skillCooldown=function(){return Math.max(pilotLoadout(this.pilot,this.plane).cooldown*Math.max(.5,this.cooldownMult),this.skillDuration()+this.skillRecovery())};
Game.prototype.blackFlightAim=function(wing,heading){let aim=heading,best=650*650;for(const e of this.enemies){if(e.hp<=0)continue;const dx=e.x-wing.x,dy=e.y-wing.y,d=dx*dx+dy*dy,a=Math.atan2(dy,dx);if(d<best&&Math.abs(angleDiff(a,heading))<=.8){best=d;aim=a}}return aim};
Game.prototype.normalGunMultiplier=function(){const single=['baracca','immelmann'].includes(this.pilot)&&this.weapon.guns===1?PILOT_BALANCE.singleGunMultiplier:1;return single*(this.pilot==='fonck'?1.15:1)*(this.pilot==='boelcke'&&this.skillTime>0?PILOT_BALANCE.boelckeDamage:1)};
Game.prototype.shotLifetime=function(speed){return Math.hypot(this.viewWidth||960,this.viewHeight||900)/speed+1};
const _skill51=Game.prototype.skill;
Game.prototype.skill=function(){
  if(this.pilot!=='mannock')return _skill51.call(this);
 if(this.state!=='playing'||this.cooldown>0)return false;
 this.cooldown=this.skillCooldown();this.skillTime=this.skillDuration();this.mannockPassTimer=Math.min(2.35,this.skillTime*.33);this.mannockPass=1;
 const w=this.viewWidth||960,h=this.viewHeight||900;
 this.divingSquadron=Array.from({length:7},(_,i)=>{const slot=i-3;return {x:this.x+slot*w*.12,y:this.y-h*.65-Math.abs(slot)*h*.12,a:Math.PI/2,age:0,speed:h*.58,fire:Math.abs(slot)*.04,pass:'vertical',hit:new Set()}});
 this.event('skill',PILOTS.mannock.skill);return true;
};
const _update51=Game.prototype.update;
Game.prototype.update=function(dt,input={}){
 if(this.state!=='playing')return;
 const step=Math.min(.04,Math.max(0,dt));
 // Extend newly created support rounds exactly once, including rounds created
 // inside the older update layers; launch velocity remains constant.
 _update51.call(this,step,input);
 if(this.longRange)for(const b of this.bullets)if(!b.enemy&&!b.rangeExtended&&Math.hypot(b.vx,b.vy)>0){b.life=Math.max(b.life,this.shotLifetime(Math.hypot(b.vx,b.vy)));b.rangeExtended=true}
 if(this.state!=='playing')return;
 this.mannockPassTimer=(this.mannockPassTimer??Infinity)-step;
 if(this.mannockPass===1&&this.mannockPassTimer<=0){const w=this.viewWidth||960,h=this.viewHeight||900;this.mannockPass=2;this.divingSquadron.push(...Array.from({length:7},(_,i)=>{const slot=i-3;return {x:this.x+w*.68+Math.abs(slot)*w*.08,y:this.y+slot*h*.11,a:Math.PI,age:0,speed:w*.58,fire:Math.abs(slot)*.04,pass:'horizontal',hit:new Set()}}))}
 for(const wing of this.divingSquadron||[]){wing.age+=step;const vertical=wing.pass!=='horizontal',oldX=wing.x,oldY=wing.y;wing.x+=Math.cos(wing.a)*wing.speed*step;wing.y+=Math.sin(wing.a)*wing.speed*step;wing.fire-=step;
  if(wing.fire<=0){wing.fire=PILOT_BALANCE.mannockInterval/(1+(this.commandRateBonus||0));const dx=Math.cos(wing.a),dy=Math.sin(wing.a);this.bullets.push({x:wing.x+dx*25,y:wing.y+dy*25,vx:dx*620,vy:dy*620,life:this.longRange?this.shotLifetime(620):1.5,enemy:false,ownerId:this.id,formation:true,pierce:true,damage:this.supportPower(PILOT_BALANCE.mannockDamage),hit:new Set()})}
  for(const e of this.enemies)if(e.hp>0&&!wing.hit.has(e)&&((vertical&&Math.abs(e.x-wing.x)<40&&e.y>=oldY-35&&e.y<=wing.y+35)||(!vertical&&Math.abs(e.y-wing.y)<40&&e.x<=oldX+35&&e.x>=wing.x-35))){wing.hit.add(e);this.bullets.push({x:e.x,y:e.y,vx:0,vy:0,life:.15,enemy:false,ownerId:this.id,damage:this.supportPower(PILOT_BALANCE.mannockContact),hit:new Set(),blast:true})}
 }
 this.divingSquadron=(this.divingSquadron||[]).filter(w=>w.age<4.6);
};

// Campaign integration: player travel speed is independent of current durability.
Game.prototype.canHitTarget=function(){return true};
Game.prototype.healthSpeedFactor=function(){return 1};

// Region identity is shared by simulation, drawing and hazards. Campaigns lock it.
Game.prototype.worldRegion=function(){return this.lockedRegion??this.stageBoss?.stages.stageIndex??Math.floor((this.distance||0)/12000)%3};
const REGION_LABELS53=Object.freeze(['전원 지대 · 기뢰지대','아드리아해 · 적 함대','참호 전선 · 대공포','포화의 참호전선','도심 전역','고공 전역','알프스 산맥','제브뤼헤 군항 · 해안포대']);
Game.prototype.clearRegionalHazards=function(){
 // Region transitions are explicit memory cleanup points. Preserve progression,
 // persistent allies/enemies and reward drops; discard transient battlefield work.
 for(const key of ['particles','flakBursts','gusts','bombZones','gasZones','fireZones','cannonImpacts','combatFX','enemyAirshipPasses','hostileMinefields','mines','grenades','friendlyBombs'])if(Array.isArray(this[key]))this[key]=[];
 this.bullets=[];
 this.enemies=this.enemies.filter(e=>!e.navalVessel||[1,7].includes(this.region));
 if(this.region===5)this.enemies=this.enemies.filter(e=>!e.fieldUnit&&!e.surface);
 this.lastRegionalHazard=-Infinity;
};
Game.prototype.enterRegion=function(region){
 const previous=this.region;this.region=region;this.clearRegionalHazards();
 const label=REGION_LABELS53[region]||'새 전장';
 if(previous!==undefined&&previous!==region)this.events.push({type:'regionTransition',region,previousRegion:previous,text:label});
 this.event('wave',label+' 진입');
};
const _landFlak53=Game.prototype.spawnFlak;
Game.prototype.spawnFlak=function(){
 const region=this.worldRegion();
 if(this.t-(this.lastRegionalHazard??-Infinity)<8)return;
 this.lastRegionalHazard=this.t;
 if(region===0){this.spawnMinefield();return}
 if(region===1||region===7){this.spawnFleet();return}
 const start=this.bullets.length;_landFlak53.call(this);
 for(const b of this.bullets.slice(start))b.hazardRegion=2;
};
Game.prototype.spawnMinefield=function(){
 this.hostileMinefields??=[];
 if(this.hostileMinefields.length>=3)return;
 const a=this.a+(this.rng()-.5)*.9,d=340+this.rng()*140;
 const x=this.x+Math.cos(a)*d,y=this.y+Math.sin(a)*d;
 const field={x,y,radius:190,warning:1.6,life:32,region:0,mines:[]};
 for(let i=0;i<9;i++){const angle=i*Math.PI*2/9+.25,r=100+this.rng()*55;field.mines.push({x:x+Math.cos(angle)*r,y:y+Math.sin(angle)*r,hp:18,dead:false})}
 this.hostileMinefields.push(field);this.event('flak','기뢰지대 발견 · 붉은 기뢰를 피하거나 사격으로 제거하세요');
};
Game.prototype.spawnFleet=function(){
 const live=this.enemies.filter(e=>e.navalVessel&&e.hp>0);
 if(live.length>=3)return;
 const harbor=this.worldRegion()===7&&this.navalRoute,route=this.navalRoute;
 // The illustrated inner harbor is occupied by piers; surface fleets belong
 // to the outer approach, not on top of the fortress quay.
 if(harbor&&(route.maxForward||0)>=10400)return;
 let x,y,a=-Math.PI/2,side=1;
 if(harbor){
  side=this.rng()>.5?1:-1;const hx=Math.cos(route.a),hy=Math.sin(route.a),nx=-hy,ny=hx;
  const along=(route.maxForward||0)+340+this.rng()*220;
  const bank=route.bankAt?.(along,side)??430,waterSide=Math.max(85,Math.min(400,bank-85));
  x=route.x+hx*along+nx*side*waterSide;y=route.y+hy*along+ny*side*waterSide;a=route.a;
 }else{
  const bearing=this.a+(this.rng()>.5?1:-1)*.9,d=360+this.rng()*100;x=this.x+Math.cos(bearing)*d;y=this.y+Math.sin(bearing)*d;
 }
 const count=Math.min(harbor?2:3,3-live.length,Math.max(0,65-this.enemies.length));
 for(let i=0;i<count;i++){
  const e=this.spawnEnemy('bomber');if(!e)break;
  const lateral=harbor?(i-(count-1)/2)*92:(i-1)*155,forward=harbor?i*118:(i%2)*125;
  const hx=Math.cos(a),hy=Math.sin(a),nx=-hy,ny=hx;
  Object.assign(e,{x:x+nx*lateral+hx*forward,y:y+ny*lateral+hy*forward,a,speed:0,stationary:true,surface:true,navalVessel:true,hitRadius:65,hullLength:150,hullWidth:38,hp:230,maxHp:230,fire:2+i*.7,ace:false,escortPlane:undefined,life:55,hazardRegion:this.worldRegion()});
 }
 this.event('flak',harbor?'부두 경비함 발견 · 주항로를 유지하세요':'적 함대 접근 · 함선의 대공 탄막을 피하세요');
};
const _fireEnemy53=Game.prototype.fireEnemy;
Game.prototype.fireEnemy=function(e){
 if(!e.navalVessel)return _fireEnemy53.call(this,e);
 e.fire=3.4;const a=Math.atan2(this.y-e.y,this.x-e.x);e.gunAim=a;e.muzzleFlash=.16;
 for(const along of [-95,0,95])for(let i=-2;i<=2;i++){const heading=a+i*.17;this.bullets.push({x:e.x+Math.cos(e.a)*along,y:e.y+Math.sin(e.a)*along,vx:Math.cos(heading)*205,vy:Math.sin(heading)*205,life:4.2,enemy:true,heavy:true,naval:true,hazardRegion:e.hazardRegion??this.worldRegion(),damage:Math.round(13*(1+this.t/260))})}
 this.event('enemyShot','');
};
const _updateRegional53=Game.prototype.update;
Game.prototype.update=function(dt,input={}){
 if(this.state!=='playing')return;const step=Math.min(.04,Math.max(0,dt));
 // Resolve a transition before any legacy timer emits its next hazard.
 const region=this.worldRegion();if(this.region!==region)this.enterRegion(region)
 _updateRegional53.call(this,step,input);if(this.state!=='playing')return;
 for(const f of this.hostileMinefields||[]){
  f.warning-=step;f.life-=step;
  for(const m of f.mines){if(m.dead)continue;
   for(const b of this.bullets){if(b.enemy||b.life<=0)continue;if(Math.hypot(b.x-m.x,b.y-m.y)<20){m.hp-=b.damage;if(!b.pierce)b.life=0;if(m.hp<=0){m.dead=true;this.combatBlast(m.x,m.y,32,'friendly','mine');break}}}
   if(!m.dead&&f.warning<=0&&Math.hypot(this.x-m.x,this.y-m.y)<25){m.dead=true;this.hit(22);this.combatBlast(m.x,m.y,58,'enemy','mine')}
  }
 }
 this.hostileMinefields=(this.hostileMinefields||[]).filter(f=>f.life>0&&f.region===this.worldRegion()&&f.mines.some(m=>!m.dead));
 for(const e of this.enemies)if(e.navalVessel){e.life-=step;if(e.life<=0)e.expired=true}
 this.enemies=this.enemies.filter(e=>!e.expired);
};

// Enemy-only arrival formations; player abilities and upgrades are unchanged.
const _encounterUpdate55=Game.prototype.update;
Game.prototype.update=function(dt,input={}){
 if(this.state!=='playing')return;
 _encounterUpdate55.call(this,dt,input);if(this.state!=='playing')return;
 const arrivals=[...this.enemies].filter(boss=>boss.encounterPending&&boss.hp>0);
 for(const boss of arrivals){boss.encounterPending=false;this.events.push({type:'bossArrival',pilot:boss.bossPilot,name:boss.name,airframe:boss.bossPlane||boss.escortPlane})}
 const formations=arrivals.filter(boss=>['goering','mannock','collishaw'].includes(boss.bossPilot));
 const needed=formations.reduce((n,boss)=>n+(boss.bossPilot==='collishaw'?ENEMY_BOSS_BALANCE.collishawEscorts:8),0);
 // Make room once for the whole simultaneous arrival so one ace's escorts never erase another's.
 const disposable=this.enemies.filter(e=>!e.missionTarget&&!e.bossPilot&&!e.formationLeader&&!e.navalVessel&&!e.fieldUnit).sort((a,b)=>Math.hypot(b.x-this.x,b.y-this.y)-Math.hypot(a.x-this.x,a.y-this.y));
 while(false&&this.enemies.length>65-needed&&disposable.length){const old=disposable.shift();this.enemies.splice(this.enemies.indexOf(old),1)}
 for(const boss of formations){
  const collie=boss.bossPilot==='collishaw',count=collie?ENEMY_BOSS_BALANCE.collishawEscorts:8,plane=collie?'collishaw_sopwith':boss.bossPilot==='goering'?'white-fokkerdv55':'se5a';
  const slots=count%2?[0,-1,1,-2,2,-3,3]:[-.5,.5,-1.5,1.5,-2.5,2.5,-3.5,3.5];
  for(let i=0;i<count;i++){const w=this.spawnEnemy('hunter');if(!w)break;const slot=slots[i],row=Math.abs(slot)+1,back=row*54,off=slot*62;
   Object.assign(w,{type:'hunter',heavyBomber:false,x:boss.x-Math.cos(boss.a)*back-Math.sin(boss.a)*off,y:boss.y-Math.sin(boss.a)*back+Math.cos(boss.a)*off,a:boss.a,hp:collie?78:65,maxHp:collie?78:65,speed:boss.speed,fire:1.5+i*.16,ace:false,escortPlane:plane,blackFlightEscort:collie,formationLeader:boss,formationBack:back,formationOffset:off});attachAircraftPersonality(PLANES,w,plane);
  }
 }
 const step=Math.min(.04,Math.max(0,dt));for(const w of this.enemies){const b=w.formationLeader;if(!b||b.hp<=0||!this.enemies.includes(b)||this.sunStrikeContains(w))continue;
 const x=b.x-Math.cos(b.a)*w.formationBack-Math.sin(b.a)*w.formationOffset,y=b.y-Math.sin(b.a)*w.formationBack+Math.cos(b.a)*w.formationOffset;
  /* 슈퍼 채플린/호위기는 리더와 520px 이상 벌어지면 복귀한다.  화면 끝까지
     플레이어를 추적하지 않고 편대 슬롯으로 돌아와 재교전하도록 유도한다. */
  const leash=520,dist=Math.hypot(w.x-b.x,w.y-b.y),targetX=dist>leash?b.x:x,targetY=dist>leash?b.y:y;
  w.formationReturning=dist>leash;w.x+=(targetX-w.x)*Math.min(1,step*(dist>leash?4.8:3));w.y+=(targetY-w.y)*Math.min(1,step*(dist>leash?4.8:3));w.a=dist>leash?Math.atan2(b.y-w.y,b.x-w.x):b.a;
 }
};

// Tethered observation balloons and a rail-bound field cannon (arcade roles).
Game.prototype.spawnFieldUnit=function(kind){
 if([1,7].includes(this.worldRegion())||this.enemies.length>=65)return null;
 const rail=kind==='railgun';if(this.enemies.filter(e=>e.hp>0&&e.fieldUnit===(rail?'railgun':'balloon')).length>=(rail?1:1))return null;
 const e=this.spawnEnemy('scout');if(!e)return null;const a=this.a+(this.rng()-.5)*1.5,d=330+this.rng()*100;
 const faction=PLANES[this.plane].faction==='central'?'entente':'central',sprite=rail?'railgun':faction==='central'?'drachen':'caquot';
 Object.assign(e,{type:rail?'railgun':'balloon',fieldUnit:rail?'railgun':'balloon',fieldSprite:sprite,faction,name:rail?'중열차포':sprite==='drachen'?'드라헨 관측기구':'캉코 관측기구',x:this.x+Math.cos(a)*d,y:this.y+Math.sin(a)*d,a:-Math.PI/2,speed:0,stationary:true,surface:rail,ace:false,escortPlane:undefined,hp:rail?600:780,maxHp:rail?600:780,hitRadius:rail?74:114,hullLength:rail?92:170,hullWidth:rail?52:72,fire:2.5,fieldRegion:this.worldRegion()});
 if(rail){e.rail={x:e.x,y:e.y,angle:Math.floor(this.rng()*4)*Math.PI/4,half:180,progress:0,direction:1,speed:42};e.a=e.rail.angle}
 this.event('flak',e.name+' 출현 · '+(rail?'레일 위 이동 포대':'고정 위치에서 탄막 사격'));return e;
};
const _fieldFire56=Game.prototype.fireEnemy;
Game.prototype.fireEnemy=function(e){
 if(!e.fieldUnit)return _fieldFire56.call(this,e);
 const rail=e.fieldUnit==='railgun';e.fire=rail?5.8:6.6;e.fieldSalvoAim=Math.atan2(this.y-e.y,this.x-e.x);e.fieldBurstIndex=0;e.fieldSalvoLeft=2;e.fieldSalvoDelay=rail?.26:.38;this.fieldVolley(e);

};
Game.prototype.fieldVolley=function(e){
 if(e.hp<=0||this.sunStrikeContains(e))return;
 const rail=e.fieldUnit==='railgun',aim=e.fieldSalvoAim??Math.atan2(this.y-e.y,this.x-e.x),index=e.fieldBurstIndex||0;
 const emit=(angle,speed,damage)=>this.bullets.push({x:e.x,y:e.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:rail?3.6:4.2,enemy:true,damage,heavy:true,fieldShell:true,visualType:rail?'railgun':'balloon',hazardRegion:e.fieldRegion});
 if(rail){for(let i=0;i<13;i++)emit(aim+(i-6)*.105+(index-1)*.025,270+index*20,24)}
 else{for(let i=0;i<24;i++)emit(i*Math.PI/12+index*Math.PI/24,145+index*12,14);for(let i=0;i<9;i++)emit(aim+(i-4)*.085,210,18)}
 e.fieldBurstIndex=index+1;e.muzzleFlash=.22;this.event('enemyShot','');
};
const _fieldUpdate56=Game.prototype.update;
Game.prototype.update=function(dt,input={}){
 if(this.state!=='playing')return;const step=Math.min(.04,Math.max(0,dt)),region=this.worldRegion();
 this.enemies=this.enemies.filter(e=>!e.fieldUnit||e.fieldRegion===region);
 for(const e of this.enemies){if(!e.rail||e.hp<=0)continue;const r=e.rail;r.progress+=r.direction*r.speed*step*(this.sunStrikeContains(e)?SUN_STRIKE.speedMultiplier:1);if(r.progress>r.half){r.progress=2*r.half-r.progress;r.direction=-1}else if(r.progress< -r.half){r.progress=-2*r.half-r.progress;r.direction=1}e.x=r.x+Math.cos(r.angle)*r.progress;e.y=r.y+Math.sin(r.angle)*r.progress;}
 _fieldUpdate56.call(this,step,input);if(this.state!=='playing')return;
 for(const e of this.enemies){if(!e.fieldUnit||e.hp<=0||!e.fieldSalvoLeft||this.sunStrikeContains(e))continue;e.fieldSalvoDelay-=step;if(e.fieldSalvoDelay<=0){e.fieldSalvoLeft--;e.fieldSalvoDelay=e.fieldUnit==='railgun'?.26:.38;this.fieldVolley(e)}}
 this.fieldUnitTimer=(this.fieldUnitTimer??34)-step;
 if(this.fieldUnitTimer<=0){this.fieldUnitTimer=this.mode==='campaign'?65:55;if(![1,7].includes(this.worldRegion())){this.fieldUnitWave=(this.fieldUnitWave||0)+1;this.spawnFieldUnit(this.fieldUnitWave%2===0?'railgun':'balloon')}}
};

// 전원 지대 signature — artillery observation network. Balloons build SPOTTED on an
// exposed player (cloud cover breaks observation); a dedicated observed battery
// fires on a 7s cadence, tightened to 4.5s while SPOTTED. Killing a balloon
// blacks the network out for 12s.
const _obsUpdate59=Game.prototype.update;
Game.prototype.update=function(dt,input={}){
 _obsUpdate59.call(this,dt,input);
 if(this.state!=='playing')return;
 const step=Math.min(.04,Math.max(0,dt)),t=this.t||0;
 if(this.worldRegion()!==0){this.spottedUntil=0;return}
 for(const e of this.enemies){if(e.fieldUnit==='balloon'&&e.hp<=0&&!e._obsDown){e._obsDown=1;this.obsBlackoutUntil=t+12;this.spottedUntil=0;this.event('flak','관측기구 격추 · 적 포병 관측망 붕괴 — 12초간 관측포격 중단')}}
 const netDown=(this.obsBlackoutUntil||0)>t;
 const exposed=!netDown&&(this.cloudConceal||0)<.7;
 for(const e of this.enemies){
  if(e.fieldUnit!=='balloon'||e.hp<=0)continue;
  const d=Math.hypot(e.x-this.x,e.y-this.y);
  if(d<720&&exposed)e.observe=(e.observe||0)+step;else e.observe=Math.max(0,(e.observe||0)-step*1.6);
  if(e.observe>=3&&(this.spottedUntil||0)<=t){this.spottedUntil=t+10;this.event('flak','SPOTTED — 관측망에 포착됐습니다 · 대공포 연사 강화 10초')}
 }
 const netUp=this.enemies.some(e=>e.fieldUnit==='balloon'&&e.hp>0&&e.fieldRegion===0);
 if(!netUp||netDown)return;
 const spotted=(this.spottedUntil||0)>t;
 this.obsFireT=(this.obsFireT??5)-step;
 if(this.obsFireT<=0){this.obsFireT=spotted?4.5:7;this.observedVolley(spotted)}
};
Game.prototype.observedVolley=function(spotted){
 if(this.sunStrikeContains({x:this.x,y:this.y,hp:1}))return;
 const edge=Math.floor(this.rng()*4);let x,y;
 if(edge<1){x=this.x-360+this.rng()*720;y=this.y-300}else if(edge<2){x=this.x+360;y=this.y-300+this.rng()*600}else if(edge<3){x=this.x-360+this.rng()*720;y=this.y+300}else{x=this.x-360;y=this.y-300+this.rng()*600}
 const lead=spotted?.95:.55,aim=Math.atan2(this.y-y+Math.sin(this.a||0)*(this.speed||0)*lead,this.x-x+Math.cos(this.a||0)*(this.speed||0)*lead);
 const n=spotted?9:7,spread=spotted?.095:.12,dmg=Math.round(13*(1+this.t/260));
 for(let i=0;i<n;i++){const a=aim+(i-(n-1)/2)*spread;this.bullets.push({x,y,vx:Math.cos(a)*190,vy:Math.sin(a)*190,life:4.2,enemy:true,flak:true,damage:dmg})}
 this.burst(x,y,'#efb35d',12);this.event('enemyShot','');
};

// 알프스 signature — ridge forewarning. Regular aircraft can spawn tucked behind a
// peak: they hold inside the ridge silhouette ~0.9s while a shadow mark telegraphs
// the emergence, then fly out on their original heading.
const _ridgeSpawn61=Game.prototype.spawnEnemy;
Game.prototype.spawnEnemy=function(type){
 const e=_ridgeSpawn61.call(this,type);
 if(!e||this.worldRegion()!==6||!this.alpsMountains)return e;
 if(['scout','hunter','bomber'].includes(e.type)&&!e.fieldUnit&&!e.bossPilot&&!e.stageBossBody){
  const peaks=this.alpsMountains.query({left:e.x-160,top:e.y-160,right:e.x+160,bottom:e.y+160});
  if(peaks.length){
   const peak=peaks.reduce((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)<Math.hypot(b.x-e.x,b.y-e.y)?a:b);
   e._ridgeWarn=.9;e._ridgePeak=peak;e.fire=Math.max(e.fire,1.2);
   const dir=Math.atan2(this.y-peak.y,this.x-peak.x),rx=peak.hitRx||peak.radius||60,ry=peak.hitRy||peak.radius||60;
   this._ridgeMarks??=[];
   this._ridgeMarks.push({x:peak.x+Math.cos(dir)*rx*.85,y:peak.y+Math.sin(dir)*ry*.85,t:.9,max:.9});
   e.x=peak.x;e.y=peak.y;
  }
 }
 return e;
};
const _ridgeUpdate61=Game.prototype.update;
Game.prototype.update=function(dt,input={}){
 _ridgeUpdate61.call(this,dt,input);
 if(this.state!=='playing')return;
 const step=Math.min(.04,Math.max(0,dt));
 if(this._ridgeMarks?.length){for(const m of this._ridgeMarks)m.t-=step;this._ridgeMarks=this._ridgeMarks.filter(m=>m.t>0)}
 if(this.worldRegion()!==6)return;
 for(const e of this.enemies){if(e._ridgeWarn>0){e._ridgeWarn-=step;if(e._ridgePeak){e.x=e._ridgePeak.x;e.y=e._ridgePeak.y}}}
};

// Large targets use their visible elongated hull rather than an enlarged circle.
Game.prototype.targetCollision=function(e,x,y,b){if(e.supportInvulnUntil>this.t)return false;if(e.stageBossBody)return stageBossCollision(this,e,x,y,b);const dx=x-e.x,dy=y-e.y;if(b?.actualExplosion)return dx*dx+dy*dy<b.explosionRadius*b.explosionRadius;const pad=b?.collisionRadius||0;if(e.hullLength){const a=e.a||0,u=dx*Math.cos(a)+dy*Math.sin(a),v=-dx*Math.sin(a)+dy*Math.cos(a);return (u/(e.hullLength+pad))**2+(v/(e.hullWidth+pad))**2<1}return Math.hypot(dx,dy)<enemyAircraftHitRadius(e)+pad};
Game.prototype.spawnGas=function(){if(![2,3].includes(this.worldRegion())||(this.gasZones||[]).length>=2)return;const a=this.a+(this.rng()-.5)*.7,d=230+this.rng()*60;this.gasZones??=[];this.gasZones.push({x:this.x+Math.cos(a)*d,y:this.y+Math.sin(a)*d,r:185,warning:2.5,life:16.5});this.event('flak','독가스 살포 예고 · 노란 경계 밖으로 이동하세요')};
const _gasUpdate57=Game.prototype.update;
Game.prototype.update=function(dt,input={}){
 if(this.state!=='playing')return;const step=Math.min(.04,Math.max(0,dt));
 if(![2,3].includes(this.worldRegion())){this.gasZones=[];this.inGas=false;this.gasExposure=0}
 const inside=()=>[2,3].includes(this.worldRegion())&&(this.gasZones||[]).some(z=>z.warning<=0&&z.life>0&&Math.hypot(this.x-z.x,this.y-z.y)<z.r);
 const turn=this.turn;let control=input;
 if(inside()){this.turn*=.55;control={...input};const drift=Math.sin(this.t*2.4)*.22;if(Number.isFinite(control.angle))control.angle+=drift;else control.steer=(control.steer||0)+drift;}
 try{_gasUpdate57.call(this,step,control)}finally{this.turn=turn}
 if(this.state!=='playing')return;
 for(const z of this.gasZones||[]){z.warning-=step;z.life-=step}this.gasZones=(this.gasZones||[]).filter(z=>z.life>0);this.inGas=inside();
 if(this.inGas&&!this.grunkreuz){this.gasExposure=(this.gasExposure||0)+step;if(this.gasExposure>=1){this.gasExposure-=1;if(this.invuln<=0){const prior=this.invuln;this.hit(6);this.invuln=prior;}}}else this.gasExposure=0;
 if(this.state!=='playing')return;
 this.gasTimer=(this.gasTimer??12)-step;if(this.gasTimer<=0){this.gasTimer=28;if(this.worldRegion()===2)this.spawnGas()}
};

// McKeever & Powell: dedicated Bristol fit; existing historical campaign fits remain intact.
PLANES.bristol_duo={name:'브리스톨 F.2B 파이터',role:'전후방 교차 사격',faction:'entente',speed:145,turn:2.7,hp:125,rate:.2,color:'#a29365',wings:2};
WEAPONS.bristol_duo={name:'Vickers / Lewis',caliber:'.303',guns:2,belt:500,rpm:450,reload:2.4,bidirectional:true};
PILOTS.mckeever={name:'맥키버 & 파월',alias:'THE HAWK & THE GNAT',faction:'entente',portrait:1,skill:'호크 & 그나트 · 회전 난사',desc:'브리스톨 복좌기로 전방·후방 동시 사격. 액티브: 5초간 기체가 계속 회전하며 사방으로 기관총을 난사합니다.',cooldown:24};
PILOT_PLANES.mckeever='bristol_duo';
Game.prototype.duoVolley=function(){for(let i=0;i<4;i++){const a=this.a+i*Math.PI/2;this.bullets.push({x:this.x+Math.cos(a)*25,y:this.y+Math.sin(a)*25,vx:Math.cos(a)*520,vy:Math.sin(a)*520,life:this.longRange?this.shotLifetime(520):1.35,enemy:false,ownerId:this.id,gun:i%2,crossfire:true,damage:this.damage*PILOT_BALANCE.duoDamage,hit:new Set()})}this.crossfireFlash=.06;this.event('shot','')};
const _duoSkill61=Game.prototype.skill;
Game.prototype.skill=function(){if(!['mckeever','huffzky'].includes(this.pilot))return _duoSkill61.call(this);if(this.state!=='playing'||this.cooldown>0)return false;this.cooldown=this.skillCooldown();this.skillTime=this.skillDuration();this.crossfireTimer=.08;this.duoVolley();this.event('skill',PILOTS[this.pilot].skill);return true};
const _duoUpdate61=Game.prototype.update;
Game.prototype.update=function(dt,input={}){if(this.state!=='playing')return;const step=Math.min(.04,Math.max(0,dt)),active=['mckeever','huffzky'].includes(this.pilot)?this.skillTime:0;this.duoSpinStep=Math.min(step,active);_duoUpdate61.call(this,step,input);this.duoSpinStep=0;if(this.state!=='playing')return;this.crossfireFlash=Math.max(0,(this.crossfireFlash||0)-step);if(active>0){this.crossfireTimer-=Math.min(step,active);while(this.crossfireTimer<=1e-9){this.crossfireTimer+=.08;this.duoVolley()}}};

// Flight profiles: historical tendencies translated to bounded arcade handling.
// Speed, turn, drag and recovery are game values, NOT measured historical data.
export const AIRFRAME_PROFILES={
 fokker:{speed:134,turn:4.3,drag:.22,recovery:1.05,role:'저속 근접 선회',history:'Dr.I는 속도보다 기동성과 상승력이 돋보였던 삼엽기입니다.',tip:'좁게 돌아 꼬리를 잡으세요. 빠른 적을 직선으로 쫓는 데는 불리합니다.'},
 albatros:{speed:144,turn:2.95,drag:.16,recovery:1.05,role:'균형형 사격 진입',history:'D.III는 수랭식 직렬 엔진과 쌍발 기관총을 갖춘 전투기입니다.',tip:'짧게 꺾고 사격선을 유지하세요. 경량기와 장시간 원을 그리면 불리합니다.'},
 camel:{speed:149,turn:4.15,drag:.25,recovery:1.15,left:.82,role:'우선회 근접전',history:'회전식 엔진의 영향이 강했던 Camel은 좌우 선회 성향이 달랐고 숙련을 요구했습니다.',tip:'오른쪽 선회가 더 빠릅니다. 연속 급선회 뒤에는 잠시 직진해 속도를 회복하세요.'},
 sopwith:{speed:148,turn:3.9,drag:.20,recovery:1.2,role:'민첩한 삼엽 전투기',history:'Sopwith Triplane은 기동성과 상승 성능이 강점이었지만 직선·급강하 속도는 약점이었습니다.',tip:'빠르게 방향을 바꿔 교전하세요. Dr.I보다 선회는 넓고 직진은 빠릅니다.'},
 nieuport:{speed:145,turn:4.0,drag:.24,recovery:1.25,role:'경량 선회전',history:'Nieuport 17은 작은 하부 날개를 가진 경량 세스퀴플레인 전투기입니다.',tip:'짧고 민첩하게 방향을 바꾸세요. 긴 추격보다 가까운 거리의 선회전에 적합합니다.'},
 spad:{speed:181,turn:2.45,drag:.12,recovery:1.65,role:'고속 일격 이탈',history:'SPAD XIII는 강력한 수랭식 엔진을 쓰는 고속 전투기입니다.',tip:'속도를 살려 통과 사격한 뒤 크게 돌아오세요. 근접 회전 싸움은 피하세요.'},
 fokkerdv:{speed:164,turn:3.7,drag:.15,recovery:1.4,role:'경쾌한 고익 단엽기',history:'D.VIII는 시야가 좋고 민첩하며 조종성이 좋은 후기형 파라솔 단엽기였습니다.',tip:'직진 속도와 방향 전환을 함께 활용하세요. Dr.I만큼 좁게 돌지는 않습니다.'},
 spad12:{speed:169,turn:2.6,drag:.17,recovery:1.3,role:'직선 공격형',history:'SPAD XII는 기수 기관포를 탑재했던 특수형입니다. 게임의 로켓 액티브는 각색입니다.',tip:'넓은 선회로 사격선을 잡고 직선으로 진입하세요.'},
 re7:{speed:112,turn:2.05,drag:.22,recovery:.7,role:'무거운 복좌 정찰기',history:'R.E.7은 복좌 정찰·폭격 기체입니다. 에이스의 전투기 배정은 게임 설정입니다.',tip:'방향 전환과 속도 회복이 느립니다. 미리 진로를 정하고 넓게 도세요.'},
 fokkerd7:{speed:157,turn:3.55,drag:.10,recovery:1.5,role:'다루기 쉬운 만능기',history:'D.VII는 우수한 기동성과 비교적 쉬운 조종성으로 평가받았습니다.',tip:'선회 중 감속이 작아 재공격하기 편합니다. 빠른 추격전은 S.E.5a보다 불리합니다.'},
 eindecker:{speed:108,turn:2.55,drag:.23,recovery:.8,role:'초기 단엽 전투기',history:'E.III의 강점은 속도보다 동조식 전방 기관총이었습니다. 1916년에는 성능이 뒤처졌습니다.',tip:'후기형보다 느리고 방향 전환이 둔합니다. 임멜만 기동으로 위치를 바꾸세요.'},
 se5a:{speed:177,turn:2.9,drag:.11,recovery:1.6,role:'안정적인 고속 사격',history:'S.E.5a는 빠르고 튼튼하며 안정적인 사격 플랫폼으로 평가받았습니다.',tip:'긴 직선 사격과 이탈에 강합니다. Camel보다 넓게 돌지만 속도를 잘 유지합니다.'},
 bristol_duo:{speed:158,turn:3.1,drag:.16,recovery:1.1,role:'공세적인 복좌 전투기',history:'Bristol F.2B는 복좌기여도 단좌기처럼 공격적으로 운용할 때 뛰어난 전투기였습니다.',tip:'R.E.7보다 빠르고 민첩합니다. 전후방 사격을 살려 적 사이를 통과하세요.'}
};
for(const [id,profile] of Object.entries(AIRFRAME_PROFILES)){
 Object.freeze(profile);Object.assign(PLANES[id],{speed:profile.speed,turn:profile.turn,role:profile.role,handling:profile});
}
Game.prototype.flyAirframe=function(dt,input={}){
 if(this.aceRetreat129){this.a=this.aceHeading129;return}
 if(this.duoSpinStep>0){this.a+=Math.PI*2*this.duoSpinStep;return}
 const profile=PLANES[this.plane].handling||AIRFRAME_PROFILES.fokker;
 // Keep forced heading, evasion and the Baron's scripted dive at their existing speeds.
 if(this.chargeTime>0){this.a=this.chargeAngle;return}
 const delta=Number.isFinite(input.angle)?angleDiff(input.angle,this.a):null;
 const steer=delta===null?Math.max(-1,Math.min(1,Number.isFinite(input.steer)?input.steer:0)):Math.sign(delta);
 const directional=steer<0?(profile.left??1):1;
 const analog=input.inputMode==='gamepad'?Math.min(1,Math.hypot(input.moveX||0,input.moveY||0)):1;
 const personality=this.currentAircraftPersonality||PLANES[this.plane].personality,energy=Math.max(0,Math.min(1,this.airframeSpeed??1));
 const handling=1+(((personality?.lowSpeedHandling??1)+((personality?.highSpeedHandling??1)-(personality?.lowSpeedHandling??1))*energy)-1)*.35;
 const limit=this.turn*directional*Math.max(.86,Math.min(1.12,handling))*dt*analog*(this.dreideckerActive?1.6:1);
 const yaw=delta===null?steer*limit:Math.max(-limit,Math.min(limit,delta));
 this.a+=yaw;
 if(dt<=0)return;
 const effort=limit>0?Math.min(1,Math.abs(yaw)/limit):0;
 const target=1-profile.drag*(this.handlingDragMult??1)*(this.dreideckerActive?0.3:1)*effort*effort;
 const current=this.airframeSpeed??1;
 const acceleration=this.currentAircraftPersonality?.acceleration??PLANES[this.plane].personality?.acceleration??1;
 const rate=target<current?1.8:profile.recovery*acceleration*(1+(this.energyRecoveryBonus||0));
 this.airframeSpeed=current+(target-current)*(1-Math.exp(-rate*dt));
};

// Airframe durability is the existing HP pool, not an additional damage-reduction layer.
export const AIRFRAME_DURABILITY={fokker:100,albatros:115,camel:100,sopwith:95,nieuport:85,spad:120,fokkerdv:105,spad12:115,re7:120,fokkerd7:125,eindecker:85,se5a:125,bristol_duo:130};
export function configureAirframeBalance(p,hp){
 p.hp=hp;
 // Immutable starting fit only: skill strength and acquired upgrades are excluded.
 const score=.4*p.speed/140+.2*p.turn/3+.3*p.hp/110+.1*(1-(p.handling?.drag??.18))/.82;
 p.xpCostMultiplier=Math.round(Math.max(.85,Math.min(1.15,1+(score-1)*.9))*100)/100;
}
for(const [id,hp] of Object.entries(AIRFRAME_DURABILITY))configureAirframeBalance(PLANES[id],hp);
Game.prototype.levelRequirement=function(base){return Math.max(1,Math.round(base*this.xpCostMultiplier))};

// Richthofen keeps one pilot identity and can choose a second aircraft in free sorties.
AIRFRAME_PROFILES.baron_albatros=Object.freeze({...AIRFRAME_PROFILES.albatros,history:'리히트호펜의 알바트로스 D.III 추가 기체입니다. 붉은 날개·목재색 동체는 요청한 게임용 도장입니다.',tip:'삼엽기보다 빠르고 넓게 선회합니다. 태양을 등진 사냥꾼으로 전방 사격을 봉쇄하고 안전한 진입선을 잡으세요.'});
PLANES.baron_albatros={...PLANES.albatros,name:'알바트로스 D.III · 붉은 날개',handling:AIRFRAME_PROFILES.baron_albatros};
WEAPONS.baron_albatros={...WEAPONS.albatros};
AIRFRAME_PROFILES.albatros_d2=Object.freeze({...AIRFRAME_PROFILES.albatros,speed:140,turn:2.85,drag:.17,recovery:1,role:'초기 알바트로스',history:'뵐케의 알바트로스 D.II. D.III와 구분되는 넓은 하부 날개와 평행 지주를 표현했습니다.',tip:'미리 사격선을 잡고 진입하세요. 뵐케의 기관총 강화로 짧은 사격 기회를 활용하세요.'});
PLANES.albatros_d2={...PLANES.albatros,name:'알바트로스 D.II',speed:140,turn:2.85,role:'초기 알바트로스',handling:AIRFRAME_PROFILES.albatros_d2};
WEAPONS.albatros_d2={...WEAPONS.albatros};
configureAirframeBalance(PLANES.albatros_d2,110);configureAirframeBalance(PLANES.baron_albatros,115);
PILOT_PLANES.boelcke='albatros_d2';
export function pilotLoadout(pilot,plane){const p=PILOTS[pilot];return pilot==='baron'&&plane==='baron_albatros'?{...p,skill:'태양을 등진 사냥꾼',passive:'붉은 전투기 조종사',passiveDesc:'이동속도·선회력 +12%.',desc:'4초간 전방 범위의 적을 제압하고 후방타격 보너스를 적용합니다. 실제 후방에서 공격하면 추가 피해 +20%.',cooldown:PILOT_BALANCE.cooldowns.baron_albatros}:p}
Game.prototype.isRedHunter=function(){return this.pilot==='baron'&&this.plane==='baron_albatros'};
const _airframeSkill65=Game.prototype.skill;
Game.prototype.skill=function(){if(!this.isRedHunter())return _airframeSkill65.call(this);if(this.state!=='playing'||this.cooldown>0)return false;this.cooldown=this.skillCooldown();this.skillTime=this.skillDuration();this.event('skill','태양을 등진 사냥꾼');return true};

// Schlasta 15 counterpart: reuse the tested two-seat gun and crossfire paths.
AIRFRAME_PROFILES.halberstadt_duo=Object.freeze({speed:133,turn:2.85,drag:.19,recovery:.95,role:'복좌 근접 지원기',history:'Halberstadt CL.II는 경량 복좌 호위·지상지원기입니다. 후프츠키와 에만은 Schlasta 15에서 함께 운용했습니다.',tip:'브리스톨보다 느리지만 레벨업 비용이 낮습니다. 전후방 사격과 회전 난사로 접근하는 적을 견제하세요.'});
PLANES.halberstadt_duo={name:'할버슈타트 CL.II',faction:'central',speed:133,turn:2.85,hp:120,rate:.2,color:'#8b7455',wings:2,role:AIRFRAME_PROFILES.halberstadt_duo.role,handling:AIRFRAME_PROFILES.halberstadt_duo};
WEAPONS.halberstadt_duo={name:'LMG 08/15 / Parabellum',caliber:'7.92 mm',guns:2,belt:500,rpm:450,reload:2.4,bidirectional:true};
PILOTS.huffzky={name:'후프츠키 & 에만',alias:'SCHLASTA 15',faction:'central',portrait:0,skill:'슐라스타 15 · 회전 난사',desc:'할버슈타트 CL.II로 전방·후방 동시 사격. 액티브: 5초간 기체가 계속 회전하며 사방으로 기관총 난사. 프리드리히 후프츠키(조종) · 고트프리트 에만(후방 사수).',cooldown:24};
PILOT_PLANES.huffzky='halberstadt_duo';
AIRFRAME_DURABILITY.halberstadt_duo=120;
configureAirframeBalance(PLANES.halberstadt_duo,120);

// Sun-backed Strike: control only. Existing bullets and collisions remain live.
export const SUN_STRIKE={duration:4,range:650,halfAngle:Math.PI/5,speedMultiplier:.5};
Game.prototype.sunStrikeContains=function(e){
 if(!this.isRedHunter()||this.skillTime<=0||e.hp<=0)return false;
 const dx=e.x-this.x,dy=e.y-this.y,d=Math.hypot(dx,dy);
 return d<=SUN_STRIKE.range&&Math.abs(angleDiff(Math.atan2(dy,dx),this.a))<=SUN_STRIKE.halfAngle;
};
for(const name of ['fireEnemy','enemyVolley','aceAttack']){
 const attack=Game.prototype[name];Game.prototype[name]=function(e,...args){if(this.sunStrikeContains(e))return;return attack.call(this,e,...args)};
}

// René Fonck: the skill inherits the player's extra gun rounds, but splits the
// payload across the fan so a spread build gains coverage without a free burst.
PILOTS.fonck.skill='탄도학의 달인';
PILOTS.fonck.desc='총구별 추가 탄환까지 유도 관통탄으로 발사해 가까운 적을 차례로 추적합니다.';
const _fonckSeekerSkill74=Game.prototype.skill;
Game.prototype.skill=function(){
 if(this.pilot!=='fonck')return _fonckSeekerSkill74.call(this);
 if(this.state!=='playing'||this.cooldown>0)return false;
   const activeDuration=this.skillDuration();
   this.cooldown=this.skillCooldown();this.skillTime=activeDuration;
 const speed=680,rounds=Math.max(1,this.shots||1),payload=this.damage*11/Math.sqrt(rounds);
 for(let i=0;i<rounds;i++){const a=this.a+(i-(rounds-1)/2)*.075;
  this.bullets.push({x:this.x+Math.cos(a)*30,y:this.y+Math.sin(a)*30,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:activeDuration,enemy:false,ownerId:this.id,fonckSeeker:true,pierce:true,damage:payload,hit:new Set()});
 }
 this.muzzleFlash=.18;this.burst(this.x+Math.cos(this.a)*28,this.y+Math.sin(this.a)*28,'#fff0ad',22);this.shake=Math.max(this.shake,5);this.event('skill',PILOTS.fonck.skill);return true;
};
const _fonckSeekerUpdate74=Game.prototype.update;
Game.prototype.update=function(dt,input={}){
 if(this.state==='playing')for(const b of this.bullets)if(b.fonckSeeker&&b.life>0){
  let target=null,best=Infinity;
  for(const e of this.enemies)if(e.hp>0&&!b.hit.has(e)){const d=(e.x-b.x)**2+(e.y-b.y)**2;if(d<best){best=d;target=e}}
  if(target){const a=Math.atan2(target.y-b.y,target.x-b.x),speed=680;b.vx=Math.cos(a)*speed;b.vy=Math.sin(a)*speed;}
 }
 _fonckSeekerUpdate74.call(this,dt,input);
};

// Francesco Baracca flies an Italian-marked Nieuport without altering other French Nieuport sorties.
PLANES.nieuport_italian={...PLANES.nieuport,name:'니외포르 17 · 이탈리아 왕국'};
WEAPONS.nieuport_italian={...WEAPONS.nieuport};
PILOT_PLANES.baracca='nieuport_italian';
PILOTS.mannock.desc='기관총 사거리 −55%. S.E.5a 7대가 V자 편대로 더 길게 화면 위에서 아래로 급강하하며 관통 사격.';

// Independent allied patrols are mortal combatants, not upgrade wingmen.
export const PATROL_BALANCE=Object.freeze({initialDelay:2,reinforceEvery:13,batch:2,earlyCap:6,lateCap:8,lateAfter:120,hp:112,life:58,fireInterval:.38,damage:9,turn:2.25,range:380,maxAttackers:2,diversion:.4,passDistance:70,passDuration:.65});
Game.prototype.patrolCanEngage=function(e,p={}){
 return e.hp>0&&!e.bossPilot&&!e.campaignAce&&!e.missionTarget&&!this.missionUnits?.has(e)&&!e.surface&&!e.stationary&&!e.fieldUnit&&!e.navalVessel&&!e.heavyBomber&&!['boss','zeppelin'].includes(e.type)&&(e.altitude===undefined||e.altitude===(p.altitude??this.altitude));
};
Game.prototype.enemyCombatTarget=function(e){
 const target=e.patrolTarget;
 return target?.hp>0&&target.life>0&&(this.patrols||[]).includes(target)&&this.patrolCanEngage(e,target)?target:this;
};
Game.prototype.dogfightSteering=function(e,contact,dt,baseTurn){
 const eligible=this.patrolCanEngage(e)&&['scout','hunter'].includes(e.type)&&!e.formationLeader&&!e.missionTarget;if(!eligible)return{delta:angleDiff(Math.atan2(contact.y-e.y,contact.x-e.x),e.a),turn:baseTurn};
 if(baseTurn<=0)return{delta:0,turn:0};
 const distanceToTarget=Math.hypot(contact.x-e.x,contact.y-e.y);
 e.dogfightCruise??=e.speed;
 const chase=distanceToTarget<110?.86:1;
 e.speed+=(e.dogfightCruise*chase-e.speed)*Math.min(1,dt*2);
 e.reengageCooldown=Math.max(0,(e.reengageCooldown||0)-dt);
 e.attackPassTime=Math.max(0,(e.attackPassTime||0)-dt);if(e.attackPassTime>0)return{delta:angleDiff(e.attackPassHeading??e.a,e.a),turn:baseTurn*.12};
 const bearing=Math.atan2(contact.y-e.y,contact.x-e.x),delta=angleDiff(bearing,e.a),distance=Math.hypot(contact.x-e.x,contact.y-e.y);
 // Commit to the attack run before reacquiring: crossing behind is a real opening.
 if(e.reengageCooldown===0&&distance<260&&(Math.abs(delta)>2.25||distance<180&&Math.abs(delta)<.9)){e.attackPassTime=2.2;e.reengageCooldown=6;e.attackPassHeading=e.a;return{delta:0,turn:0}}
 return{delta,turn:baseTurn*(Math.abs(delta)>1.4?.65:1)};
};
Game.prototype.spawnPatrol=function(){
 this.patrols??=[];
 const cap=this.mode==='campaign'?4:this.t>=PATROL_BALANCE.lateAfter?PATROL_BALANCE.lateCap:PATROL_BALANCE.earlyCap;
 const count=Math.min(PATROL_BALANCE.batch,cap-this.patrols.length);if(count<=0)return;
 const faction=PLANES[this.plane].faction,planes=this.friendlyAircraftMix?.(faction)??(faction==='central'?['fokker_standard','albatros','fokkerd7']:['camel','se5a','sopwith']);
 const angle=this.a+(this.rng()<.5?-1:1)*1.1,radius=Math.max(300,Math.min(650,(this.viewHeight||600)*.65));
 const x=this.x+Math.cos(angle)*radius,y=this.y+Math.sin(angle)*radius;
 for(let i=0;i<count;i++){
  const off=(i-(count-1)/2)*56,a=angle+Math.PI,plane=planes[Math.floor(this.rng()*planes.length)];
  this.patrols.push({x:x-Math.sin(a)*off,y:y+Math.cos(a)*off,a,plane,hp:PATROL_BALANCE.hp,maxHp:PATROL_BALANCE.hp,life:PATROL_BALANCE.life,speed:185,fire:.2+i*.15,invuln:.6,hitFlash:0,altitude:this.altitude,target:null,think:0,pass:0,waypoint:{x:this.x-Math.cos(angle)*240,y:this.y-Math.sin(angle)*240}});
 }
};
Game.prototype.hitPatrol=function(p,damage){
 if(p.hp<=0||p.invuln>0)return;
 p.hp=Math.max(0,p.hp-damage);p.invuln=.22;p.hitFlash=.15;
 this.burst(p.x,p.y,p.hp>0?'#f3ddaa':'#d49c65',p.hp>0?4:16);
 if(p.hp<=0){p.life=0;this.patrolLosses=(this.patrolLosses||0)+1;this.smoke(p.x,p.y,true)}
};
// Resolve the first swept impact so a round intercepted by an ally cannot also hit the player.
Game.prototype.resolveHostileRound=function(b,x0,y0){
 const dx=b.x-x0,dy=b.y-y0,length=dx*dx+dy*dy;
 let first=Infinity,hit=null;
 for(const target of [this,...(this.patrols||[])]){
  if(target!==this&&(target.hp<=0||target.life<=0))continue;
  const radius=(target===this?10:16)+(b.flak?6:0),ox=x0-target.x,oy=y0-target.y,c=ox*ox+oy*oy-radius*radius;
  let t=0;if(c>0){if(length===0)continue;const dot=ox*dx+oy*dy,disc=dot*dot-length*c;if(disc<0)continue;t=(-dot-Math.sqrt(disc))/length;if(t<0||t>1)continue}
  if(t<first){first=t;hit=target}
 }
 if(hit){if(hit===this){this.damageSource={x:x0,y:y0,bullet:b};this.hit(highRiskDamage(b.damage,this.maxHp,b));this.damageSource=null;}else this.hitPatrol(hit,b.damage);b.life=0}
};
Game.prototype.updatePatrols=function(dt){
 this.patrols??=[];
 this.patrols=this.patrols.filter(p=>p.hp>0&&p.life>0&&Math.hypot(p.x-this.x,p.y-this.y)<1700);
 this.patrolTimer=(this.patrolTimer??PATROL_BALANCE.initialDelay)-dt;
 if(this.patrolTimer<=0){this.spawnPatrol();this.patrolTimer=PATROL_BALANCE.reinforceEvery}
 for(const p of this.patrols){
  p.life-=dt;p.invuln=Math.max(0,p.invuln-dt);p.hitFlash=Math.max(0,p.hitFlash-dt);p.fire=Math.max(0,p.fire-dt);p.think-=dt;p.pass=Math.max(0,p.pass-dt);
  if(p.think<=0||!p.target||!this.patrolCanEngage(p.target,p)||!this.enemies.includes(p.target)){
   const pursuit=Math.max(.75,Math.min(1.25,p.personality?.pursuitControl??1));p.think=.75;p.target=null;let best=750*pursuit;
   for(const e of this.enemies)if(this.patrolCanEngage(e,p)){
    const distance=Math.hypot(e.x-p.x,e.y-p.y),assigned=this.patrols.filter(a=>a!==p&&a.target===e).length,score=distance+assigned*200;
    if(distance<700*pursuit&&score<best){best=score;p.target=e}
   }
  }
  const target=p.target;
  if(p.pass<=0){
   if(target&&Math.hypot(target.x-p.x,target.y-p.y)<Math.max(55,Math.min(95,(p.personality?.preferredRange??210)*.33))){p.pass=1.2}
   else{
    if(!target&&Math.hypot(p.waypoint.x-p.x,p.waypoint.y-p.y)<90){const angle=this.rng()*Math.PI*2;p.waypoint={x:this.x+Math.cos(angle)*320,y:this.y+Math.sin(angle)*320}}
    const aim=target||p.waypoint,delta=angleDiff(Math.atan2(aim.y-p.y,aim.x-p.x),p.a),limit=(p.personalityTurn??PATROL_BALANCE.turn)*dt;
    p.a+=Math.max(-limit,Math.min(limit,delta));
   }
  }
  p.x+=Math.cos(p.a)*p.speed*dt;p.y+=Math.sin(p.a)*p.speed*dt;
  const personalityRange=Math.max(340,Math.min(430,PATROL_BALANCE.range+((p.personality?.preferredRange??210)-210)*.45));
  if(target&&p.fire<=0&&Math.hypot(target.x-p.x,target.y-p.y)<personalityRange&&Math.abs(angleDiff(Math.atan2(target.y-p.y,target.x-p.x),p.a))<.18){
   p.fire=PATROL_BALANCE.fireInterval;p.muzzleFlash=.07;
   this.bullets.push({x:p.x+Math.cos(p.a)*24,y:p.y+Math.sin(p.a)*24,vx:Math.cos(p.a)*430,vy:Math.sin(p.a)*430,life:1,enemy:false,ownerId:this.id,ally:true,patrol:true,altitude:p.altitude,rangeExtended:true,damage:PATROL_BALANCE.damage*(1+Math.min(.5,this.t/480))*this.supportAuraAt(p),hit:new Set()});
  }else p.muzzleFlash=Math.max(0,(p.muzzleFlash||0)-dt);
 }
 this.patrolTargetTimer=(this.patrolTargetTimer??0)-dt;
 if(this.patrolTargetTimer<=0){
  this.patrolTargetTimer=.6;
  const regular=this.enemies.filter(e=>this.patrolCanEngage(e)),quota=Math.floor(regular.length*PATROL_BALANCE.diversion),counts=new Map();let diverted=0;
  for(const e of this.enemies){if(!regular.includes(e))e.patrolTarget=null}
  // Retain contacts before assigning new ones: enemies do not snap targets every frame.
  const valid=(e,p)=>p&&p.hp>0&&p.life>0&&this.patrols.includes(p)&&this.patrolCanEngage(e,p)&&Math.hypot(e.x-p.x,e.y-p.y)<850;
  for(const e of regular){const p=e.patrolTarget;if(valid(e,p)&&diverted<quota&&(counts.get(p)||0)<PATROL_BALANCE.maxAttackers){counts.set(p,(counts.get(p)||0)+1);diverted++}else e.patrolTarget=null}
  for(const e of regular){
   if(e.patrolTarget||diverted>=quota)continue;let best=800,chosen=null;
   for(const p of this.patrols)if(valid(e,p)&&(counts.get(p)||0)<PATROL_BALANCE.maxAttackers){const score=Math.hypot(e.x-p.x,e.y-p.y)+(counts.get(p)||0)*90;if(score<best){best=score;chosen=p}}
   if(chosen){e.patrolTarget=chosen;counts.set(chosen,(counts.get(chosen)||0)+1);diverted++}
  }
 }
};
const _independentPatrolUpdate79=Game.prototype.update;
Game.prototype.update=function(dt,input={}){
 if(this.state!=='playing')return;
 const step=Math.min(.04,Math.max(0,dt));if(step>0)this.updatePatrols(step);
 _independentPatrolUpdate79.call(this,step,input);
};

// Revision 81: late double-ace waves and a relic set with distinct combat roles.
Game.prototype.legendaryDamageMultiplier=function(){
 if(!this.lowHpDamage||!this.maxHp)return 1;
 const ratio=Math.max(0,Math.min(1,this.hp/this.maxHp));
 return 1.15+(1-ratio)*(LEGENDARY_BALANCE.lowHpMaxBonus-.15);
};
Game.prototype.reserveEnemySlots=function(count){
 const disposable=this.enemies.filter(e=>!e.missionTarget&&!e.bossPilot&&!e.formationLeader&&!e.navalVessel&&!e.fieldUnit).sort((a,b)=>Math.hypot(b.x-this.x,b.y-this.y)-Math.hypot(a.x-this.x,a.y-this.y));
 while(this.enemies.length>65-count&&disposable.length){const old=disposable.shift();this.enemies.splice(this.enemies.indexOf(old),1)}
};
Game.prototype.aceWaveCount=function(time=this.t){return Math.min(8,time>=720?5+Math.floor((time-720)/120):time>=600?4:time>=420?3:time>=300?2:1)};
Game.prototype.nextAceWaveAt=function(time=this.t){return time<185?185:time<300?300:time<420?420:time<600?600:time<720?720:720+(Math.floor((time-720)/120)+1)*120};
Game.prototype.prepareBossWave=function(count){
 const live=new Set(this.enemies.filter(e=>e.hp>0&&e.bossPilot).map(e=>e.bossPilot));
 const available=Object.keys(PILOTS).filter(id=>PILOTS[id].faction!==PLANES[this.plane].faction&&!live.has(id));
 count=Math.min(count,8-live.size,available.length);
 if((this.bossDeck?.length||0)>=count)return count;
 this.bossDeck=Object.keys(PILOTS).filter(id=>PILOTS[id].faction!==PLANES[this.plane].faction);
 for(let i=this.bossDeck.length-1;i>0;i--){const j=Math.floor(this.rng()*(i+1));[this.bossDeck[i],this.bossDeck[j]]=[this.bossDeck[j],this.bossDeck[i]]}
 return count;
};
const _legendaryReload81=Game.prototype.reload;
Game.prototype.reload=function(){
 if(this.unlimitedAmmo){this.reloadTime=0;this.ammo.fill(this.weapon.belt);return false}
 return _legendaryReload81.call(this);
};
const _legendaryEvade81=Game.prototype.evade;
Game.prototype.evade=function(){
 const used=_legendaryEvade81.call(this);
 if(used&&this.evadeCooldownMult)this.evadeCooldown*=this.evadeCooldownMult;if(used&&this.evadeInvulnerability)this.invuln=Math.max(this.invuln,this.evadeInvulnerability);
 return used;
};
const _legendaryUpdate81=Game.prototype.update;
Game.prototype.update=function(dt,input={}){
 if(this.state!=='playing')return;
 const step=Math.min(.04,Math.max(0,dt)),trailX=this.x,trailY=this.y;
 if(this.unlimitedAmmo){this.reloadTime=0;this.ammo.fill(this.weapon.belt)}
 if(this.motorCannon&&(input.inputMode!=='gamepad'||input.fireHeld)){
  this.motorCannonTimer=(this.motorCannonTimer??0)-step;
  if(this.motorCannonTimer<=0){
   this.motorCannonTimer+=this.ordnanceInterval(LEGENDARY_BALANCE.motorCannonInterval);
   const a=this.a,speed=460;
   this.bullets.push({x:this.x+Math.cos(a)*38,y:this.y+Math.sin(a)*38,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:this.longRange?this.shotLifetime(speed):2.8,enemy:false,ownerId:this.id,motorCannon:true,pierce:true,collisionRadius:22,damage:this.payloadPower(LEGENDARY_BALANCE.motorCannonDamage),hit:new Set()});
   this.muzzleFlash=.18;this.shake=Math.max(this.shake,7);this.burst(this.x+Math.cos(a)*34,this.y+Math.sin(a)*34,'#fff0b0',18);this.cannonMuzzleSmoke('motor');this.event('shot','');
  }
 }
 _legendaryUpdate81.call(this,step,input);
 if(this.unlimitedAmmo){this.reloadTime=0;this.ammo.fill(this.weapon.belt)}
 if(this.state!=='playing'||!this.legendaryMineTrail)return;
 this.legendaryMineTimer=(this.legendaryMineTimer??0)-step;
 if(this.legendaryMineTimer<=0){
  this.legendaryMineTimer+=LEGENDARY_BALANCE.mineInterval;
  this.mines.push({x:trailX-Math.cos(this.a)*22,y:trailY-Math.sin(this.a)*22,life:LEGENDARY_BALANCE.mineLife,arm:.25,damage:this.payloadPower(LEGENDARY_BALANCE.mineDamage),special:true,legendary:true});
 }
};

// Keep every briefing/cut-in in sync with the actual final skill implementation.
for(const [id,pilot] of Object.entries(PILOTS))pilot.cooldown=PILOT_BALANCE.cooldowns[id];
PILOTS.fonck.skill='탄도학의 달인';
PILOTS.fonck.desc='4초간 총구별 추가 탄환까지 유도 관통탄으로 발사해 적을 차례로 추적합니다. 기본 기관총 사격도 계속합니다.';
PILOTS.boelcke.desc='4초간 기관총 공격력 2.2배. 무적 효과 없음.';
PILOTS.immelmann.desc='단발 기관총 피해 +45%. 180° 반전하며 탄막 제거, 1.1초 무적, 3.5배 피해 관통탄 5발 발사.';
PILOTS.baracca.desc='단발 기관총 피해 +45%. 0.9초 무적 직선 돌격. 경로 피해는 기관총 강화에 비례.';
PILOTS.udet.desc='현재 체력 5%를 소모하고 5초간 이동속도 +70%, 발사속도 +140%.';
PILOTS.collishaw.desc='검은 삼엽기 3대가 5.2초간 좌우 기동하며 전방 적을 조준해 0.24초마다 관통 사격. 무적 없음.';
PILOTS.mannock.desc='기관총 사거리 −55%. S.E.5a 7대가 위→아래 한 번, 오른쪽→왼쪽 한 번 교차 관통 사격.';

// Revision 91: sustained rear-quarter aim rewards dogfighting, while tethered
// observation balloons release short, historically themed special-ammo belts.
Game.prototype.combatWorld=function(){return this.world||this};
Game.prototype.tailEligible=function(e){return !!(e&&e.hp>0&&!e.stationary&&!e.surface&&!e.fieldUnit&&!e.navalVessel&&!e.heavyBomber&&e.type!=='zeppelin')};
Game.prototype.tailIdFor=function(e){if(e.tailId)return e.tailId;const world=this.combatWorld();world.tailEntitySequence=(world.tailEntitySequence||0)+1;return e.tailId=`tail-${world.tailEntitySequence}`};
Game.prototype.updateTailLock=function(dt){
 if(this.hp<=0||this.status&&this.status!=='alive'){this.tailTargetId=null;this.tailLocked=false;this.tailProgress=0;return}
 let target=null,best=Infinity;for(const e of this.enemies){if(!this.tailEligible(e))continue;const dx=e.x-this.x,dy=e.y-this.y,d=Math.hypot(dx,dy);if(d<TAILING_BALANCE.minDistance||d>TAILING_BALANCE.maxDistance)continue;const behind=Math.abs(angleDiff(Math.atan2(this.y-e.y,this.x-e.x),e.a+Math.PI)),aim=Math.abs(angleDiff(Math.atan2(dy,dx),this.a));if(behind>TAILING_BALANCE.rearCone||aim>TAILING_BALANCE.aimCone)continue;const score=d+behind*90+aim*120;if(score<best){best=score;target=e}}
 if(!target){this.tailProgress=Math.max(0,(this.tailProgress||0)-dt*TAILING_BALANCE.decay);this.tailTargetId=null;this.tailLocked=false;return}
 const id=this.tailIdFor(target);if(this.tailTargetId!==id)this.tailProgress=0;this.tailTargetId=id;this.tailProgress=Math.min(TAILING_BALANCE.lockTime,(this.tailProgress||0)+dt);this.tailLocked=this.tailProgress>=TAILING_BALANCE.lockTime-1e-9;
};
Game.prototype.tailLockFraction=function(){return Math.max(0,Math.min(1,(this.tailProgress||0)/TAILING_BALANCE.lockTime))};
Game.prototype.giveSpecialAmmo=function(){this.specialAmmoQueue=[];return false};
Game.prototype.consumeSpecialRound=function(){this.specialAmmoQueue=[];return null};
Game.prototype.specialAmmoStatus=function(){return null};
Game.prototype.applySpecialRound=function(round){return round};
Game.prototype.roundDamageMultiplier=function(b,e){
 let mult=b.tailBonus&&b.tailTargetId===e.tailId?TAILING_BALANCE.damageMultiplier:1;
 return mult;
};
Game.prototype.specialRoundImpact=function(b,e){
 const world=this.combatWorld();if(b.upgradeRocket&&!b.rocketDetonated){b.rocketDetonated=true;this.queueExplosionDamage(b.x,b.y,84,b.damage*.5,{exclude:e})}
 if(b.cow37||b.motorCannon)world.combatBlast?.(e.x,e.y,b.cow37?38:30,'friendly','cannon');
};
Game.prototype.dropSpecialAmmo=function(){return null};
Game.prototype.dropObservationRepair=function(e){
 if(e?.fieldUnit!=='balloon'||e.observationRepairDropped)return null;e.observationRepairDropped=true;const world=this.combatWorld(),drop={x:e.x,y:e.y,value:0,heal:true,healFraction:DURABILITY_BALANCE.repairPickupFraction,observationRepair:true};if(world.nextEntityId)drop.id=world.nextEntityId++;world.drops.push(drop);return drop;
};
const _tacticalUpdate91=Game.prototype.update;
Game.prototype.update=function(dt,input={}){
 if(this.state!=='playing')return;
 this.resolveBossLevels?.();if(this.state!=='playing')return;
 if(this.mode!=='campaign'){this.checkLevel();if(this.state!=='playing')return;enableStageBoss(this,{teamFaction:PLANES[this.plane].faction});}
 const step=Math.min(.04,Math.max(0,dt));beginStageBossFrame(this,step);this.updateTailLock(step);
 _tacticalUpdate91.call(this,step,input);endStageBossFrame(this,step);this.resolveBossLevels?.();
};

installRevision(Game,PLANES,WEAPONS,PILOTS,PILOT_PLANES,LEGENDARIES,UPGRADES);
installCloudCover(Game);
installFleet(Game);
installTrenchWar(Game);
installCityAir(Game);
installRegionDoctrine(Game);

// Upgrade rockets share one launch path in solo and co-op, always straight flight.
Game.prototype.launchUpgradeRocket=function(){
 const level=Math.max(1,Math.min(6,this.rockets));this.rocketFire=2.6/(1+level*.3);
 const speed=520,spread=.075;for(let i=0;i<level;i++){const a=this.a+(i-(level-1)/2)*spread;this.bullets.push({x:this.x+Math.cos(a)*30,y:this.y+Math.sin(a)*30,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:this.longRange?this.shotLifetime(speed):2.4,enemy:false,ownerId:this.id,damage:this.payloadPower(78+(level-1)*4),rocket:true,upgradeRocket:true,collisionRadius:12,hit:new Set()});}
 this.burst(this.x+Math.cos(this.a)*25,this.y+Math.sin(this.a)*25,'#ffcf83',8+level);
};

// Fonck's ballistic mastery also guides and amplifies special cannon rounds;
// cloned COW rounds retain the base gun's spread/shot upgrades after swapping.
const _fonckCannonUpdate120=Game.prototype.update;
Game.prototype.update=function(dt,input={}){const before=this.bullets.length;_fonckCannonUpdate120.call(this,dt,input);for(const b of this.bullets.slice(before)){if(!b||b.enemy||(!b.cow37&&!b.motorCannon))continue;if(this.pilot==='fonck'&&this.skillTime>0){b.fonckSeeker=true;b.fonckGuided=true;b.damage*=1.35;}const count=Math.max(1,this.shots||1),speed=Math.hypot(b.vx,b.vy);for(let n=1;n<count;n++){const a=Math.atan2(b.vy,b.vx)+(n-(count-1)/2)*.08;this.bullets.push({...b,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,hit:new Set()});}} };

// Revision 108 — Werner Voss's reverse-turn must be a visible escape and re-entry,
// not just a heading flip. The same pattern is applied to his ace-boss attack.
export const VOSS_REVERSE=Object.freeze({duration:1,invulnerability:1,speedMultiplier:2.35,afterimageInterval:.075,afterimageLife:2.4,afterimageCount:6,afterimageScatterSpeed:165,afterimageFireDelay:.18,afterimageFireInterval:.42,bossSpeedMultiplier:3});
PILOTS.voss.skill='7대1';
PILOTS.voss.desc='즉시 180° 반전 · 화면의 적 탄막 삭제 · 1초 무적. 주변에 잔상 6기를 생성해 사방으로 흩어지며 사격합니다.';
const _vossReverseSkill=Game.prototype.skill;
const _vossReverseDuration=Game.prototype.skillDuration;
Game.prototype.skillDuration=function(){return this.pilot==='voss'?VOSS_REVERSE.duration*(this.skillEnhanced?1.35:1):_vossReverseDuration.call(this)};
Game.prototype.skill=function(){
 if(this.pilot!=='voss')return _vossReverseSkill.call(this);
 if(this.state!=='playing'||this.cooldown>0)return false;
 this.cooldown=this.skillCooldown();this.skillTime=this.skillDuration();
 this.a+=Math.PI;this.bullets=this.bullets.filter(b=>!b.enemy);
 this.vossReverse=this.skillDuration();
 this.invuln=Math.max(this.invuln,VOSS_REVERSE.invulnerability);
 this.vossAfterimages=[];this.vossAfterimageClock=0;for(let i=0;i<VOSS_REVERSE.afterimageCount;i++){const d=this.a+i*Math.PI*2/VOSS_REVERSE.afterimageCount;this.vossAfterimages.push({x:this.x+Math.cos(d)*14,y:this.y+Math.sin(d)*14,a:d,drift:d,life:VOSS_REVERSE.afterimageLife,maxLife:VOSS_REVERSE.afterimageLife})}
 this.burst(this.x,this.y,'#f1dca0',25);
 this.event('skill',PILOTS.voss.skill);this.event('wave','베르너 포스 · 7대1 / 탄막 제거');
 return true;
};
const _vossReverseAce=Game.prototype.aceAttack;
Game.prototype.aceAttack=function(e){
 const result=_vossReverseAce.call(this,e);
 if(e?.bossPilot==='voss'){
  e.vossReverse=VOSS_REVERSE.duration;
  e.vossInvuln=VOSS_REVERSE.invulnerability;
  e.vossTrails=[];e.vossTrailClock=0;for(let i=0;i<VOSS_REVERSE.afterimageCount;i++){const d=e.a+i*Math.PI*2/VOSS_REVERSE.afterimageCount;e.vossTrails.push({x:e.x+Math.cos(d)*14,y:e.y+Math.sin(d)*14,a:d,drift:d,life:VOSS_REVERSE.afterimageLife,maxLife:VOSS_REVERSE.afterimageLife})}
  // The boss reverse-turn blows away shots already closing on the aircraft,
  // while its own new volley remains as the re-entry threat.
  this.bullets=this.bullets.filter(b=>b.enemy);
  this.event('wave','베르너 포스 · 7대1 / 잔상 6기');
 }
 return result;
};
const _vossReverseCanHit=Game.prototype.canHitTarget;
Game.prototype.canHitTarget=function(e,b){return !(e?.vossInvuln>0)&&_vossReverseCanHit.call(this,e,b)};
const _vossReverseUpdate=Game.prototype.update;
Game.prototype.update=function(dt,input={}){
 if(this.state!=='playing')return _vossReverseUpdate.call(this,dt,input);
 const step=Math.min(.04,Math.max(0,dt));
 const active=this.pilot==='voss'&&(this.vossReverse||0)>0;
 const beforeX=this.x,beforeY=this.y,beforeA=this.a;
 const savedBase=active?this.baseSpeed:undefined;
 if(active&&Number.isFinite(this.baseSpeed))this.baseSpeed*=VOSS_REVERSE.speedMultiplier;
 _vossReverseUpdate.call(this,step,input);
 if(active&&Number.isFinite(savedBase))this.baseSpeed=savedBase;
 if(active){
  this.vossReverse=Math.max(0,this.vossReverse-step);
  }
 if(this.vossAfterimages)for(const ghost of this.vossAfterimages){ghost.life-=step;if(ghost.life>0){const d0=ghost.drift??ghost.a;ghost.x+=Math.cos(d0)*VOSS_REVERSE.afterimageScatterSpeed*step;ghost.y+=Math.sin(d0)*VOSS_REVERSE.afterimageScatterSpeed*step;ghost.a=d0;let tgt=null,best=620*620;for(const en of this.enemies){if(en.hp<=0)continue;const d=(en.x-ghost.x)**2+(en.y-ghost.y)**2;if(d<best){best=d;tgt=en}}ghost.fire=(ghost.fire??VOSS_REVERSE.afterimageFireDelay)-step;if(ghost.fire<=0){ghost.fire=VOSS_REVERSE.afterimageFireInterval;if(tgt){const aim=Math.atan2(tgt.y-ghost.y,tgt.x-ghost.x);this.bullets.push({x:ghost.x+Math.cos(aim)*12,y:ghost.y+Math.sin(aim)*12,vx:Math.cos(aim)*430,vy:Math.sin(aim)*430,life:1.4,enemy:false,ownerId:this.id,ghost:true,damage:8,hit:new Set()})}}}}
 if(this.vossAfterimages)this.vossAfterimages=this.vossAfterimages.filter(ghost=>ghost.life>0).slice(-6);
 for(const e of this.enemies||[]){
  if(e.vossInvuln>0)e.vossInvuln=Math.max(0,e.vossInvuln-step);
  if(e.bossPilot==='voss'){let n=0;for(const p of this.players||[this]){if(p&&p.hp>0&&Math.hypot(p.x-e.x,p.y-e.y)<420)n++}for(const a of this.allies||[])if(a.life>0&&Math.hypot(a.x-e.x,a.y-e.y)<420)n++;e.vossSurgeCount=n;e.vossSurge=n>=3}
  if(e.vossReverse>0){e.vossReverse=Math.max(0,e.vossReverse-step);e.vossTrails??=[]}
  if(e.vossTrails)for(const ghost of e.vossTrails){ghost.life-=step;if(ghost.life>0){{const d0=ghost.drift??ghost.a;ghost.x+=Math.cos(d0)*VOSS_REVERSE.afterimageScatterSpeed*step;ghost.y+=Math.sin(d0)*VOSS_REVERSE.afterimageScatterSpeed*step;ghost.a=d0;let tx=this.x,ty=this.y,best=(this.x-ghost.x)**2+(this.y-ghost.y)**2;for(const a of this.allies||[]){if(a.life<=0)continue;const d=(a.x-ghost.x)**2+(a.y-ghost.y)**2;if(d<best){best=d;tx=a.x;ty=a.y}}for(const p of this.players||[]){if(!(p.hp>0))continue;const d=(p.x-ghost.x)**2+(p.y-ghost.y)**2;if(d<best){best=d;tx=p.x;ty=p.y}}const ga=Math.atan2(ty-ghost.y,tx-ghost.x);ghost.fire=(ghost.fire??VOSS_REVERSE.afterimageFireDelay)-step;if(ghost.fire<=0){ghost.fire=VOSS_REVERSE.afterimageFireInterval;const aim=ga;this.bullets.push({x:ghost.x+Math.cos(aim)*12,y:ghost.y+Math.sin(aim)*12,vx:Math.cos(aim)*175,vy:Math.sin(aim)*175,life:2.8,enemy:true,visualType:'boss',damage:Math.round(6*(1+this.t/240)*(e.aceDamageMultiplier||1))})}}}}
  if(e.vossTrails)e.vossTrails=e.vossTrails.filter(ghost=>ghost.life>0).slice(-6);
 }
};

// Revision 109 — expanded legendary arsenal and periodic defensive relics.
export const COW37_BALANCE=Object.freeze({interval:1,damage:280,speed:430,belt:24,reload:4.6});
export const LEGENDARY_DEFENSE_BALANCE=Object.freeze({rankinInterval:3.2,rankinRange:500,rankinRearArcDegrees:240,rankinRearDamageMultiplier:.2,fogInterval:12,fogDuration:3,grunkreuzInterval:.35,grunkreuzRadius:130,grunkreuzFraction:.06,grunkreuzOnDuration:4.5,grunkreuzOffDuration:8});
const _ensureDoctrine109=Game.prototype.ensureRevisionPilot;
Game.prototype.ensureRevisionPilot=function(){
 if(!this.doctrine109Ready){
  this.doctrine109Ready=true;
  if(this.doctrine==='강습 편대'){this.damage/=1.15;this.reloadPenalty=undefined}
  else if(this.doctrine==='고속 정찰'){this.speed/=1.12;if(this.baseSpeed!==undefined)this.baseSpeed/=1.12;this.maxHp/=0.9;this.hp=this.maxHp}
  else if(this.doctrine==='장기 초계'){this.maxHp-=15;this.hp=Math.min(this.hp,this.maxHp);this.rate/=1.08}
  const doctrines=this.world?['강습 편대','고속 정찰','장기 초계']:Object.keys(DOCTRINE_BALANCE);this.doctrine=doctrines[Math.floor(this.rng()*doctrines.length)];const d=DOCTRINE_BALANCE[this.doctrine];
  if(d.damage)this.damage*=d.damage;if(d.reloadPenalty)this.reloadPenalty=d.reloadPenalty;
  if(d.speed){this.speed*=d.speed;if(this.baseSpeed!==undefined)this.baseSpeed*=d.speed}
  if(d.hp){this.maxHp*=d.hp;this.hp=this.maxHp}if(d.hpFlat){this.maxHp+=d.hpFlat;this.hp=this.maxHp}
  if(d.rate)this.rate*=d.rate;if(d.xp)this.xpGainMult=(this.xpGainMult||1)*d.xp;if(d.magnet)this.magnet*=d.magnet;
 }
 return _ensureDoctrine109.call(this);
};
const legendary109=[
 {id:'quadLewis',name:'쿼드 루이스 기관총',desc:'총구별 기관총 탄환 +4. 일제사격 피해 분산 공식이 적용되며 탄약도 발사 수만큼 소모합니다. 한 출격 1회.'},
 {id:'cow37',name:'COW 37mm 기관포',desc:'기존 기관총 교체. 1초마다 기본 피해 280의 중포탄 1발, 24발 탄창, 재장전 4.6초. 기관총 개조 적용. 한 출격 1회.'},
 {id:'rankinShell',name:'랭킨 대공 파편탄',desc:'3.2초마다 후방 240°·500 범위의 적 탄환을 파편 폭발로 제거합니다. 뒤에서 맞는 탄환 피해는 80% 감소합니다. 한 출격 1회.'},
 {id:'kaiserFog',name:'카이저의 안개',desc:'12초마다 3초간 안개 속에 숨습니다. 적의 사격·추적 대상에서 제외되고 어그로를 초기화합니다. 기존 탄환은 남습니다. 한 출격 1회.'},
 {id:'grunkreuz',name:'녹십자 (Grünkreuz)',desc:'독가스 피해에 면역됩니다. 비행 경로 뒤로 독가스를 계속 분출해 흩어지게 합니다. 가스에 닿은 적은 0.6초마다 최대 내구도의 4% 피해를 받습니다. 분출 간격은 액티브 재사용 감소 효과를 받습니다(최대 50%). 한 출격 1회.'},
 {id:'maximBelt',name:'맥심의 무한 탄띠',desc:'기관총 탄약이 무제한이 되어 재장전 없이 계속 사격합니다. 특수 COW 기관포에는 적용되지 않습니다. 한 출격 1회.'}
];
for(const relic of legendary109)if(!LEGENDARIES.some(item=>item.id===relic.id)){LEGENDARIES.push(relic);UPGRADES.push({...relic,legendary:true,apply:()=>{}})}
export function tickLegendaryDefenses(owner,world,dt){
 if(owner.rankinShell){owner.rankinTimer=(owner.rankinTimer??LEGENDARY_DEFENSE_BALANCE.rankinInterval)-dt;if(owner.rankinTimer<=0){owner.rankinTimer+=LEGENDARY_DEFENSE_BALANCE.rankinInterval;const ca=Math.cos(owner.a),sa=Math.sin(owner.a),half=LEGENDARY_DEFENSE_BALANCE.rankinRearArcDegrees*Math.PI/360;let removed=0;for(const b of world.bullets||[]){if(!b.enemy||b.life<=0)continue;const dx=b.x-owner.x,dy=b.y-owner.y,d=Math.hypot(dx,dy);if(d>LEGENDARY_DEFENSE_BALANCE.rankinRange)continue;const rear=Math.abs(angleDiff(Math.atan2(dy,dx),owner.a+Math.PI));if(rear<=half){b.life=0;removed++}}owner.rankinFlash=.5;owner.burst(owner.x-ca*28,owner.y-sa*28,'#ddd8c1',Math.min(26,10+removed));owner.event('wave',`랭킨 파편탄 · 후방 탄막 ${removed}발 제거`)}}
 owner.rankinFlash=Math.max(0,(owner.rankinFlash||0)-dt);
 if(owner.grunkreuz){owner.grunkreuzOn=(owner.grunkreuzOn??LEGENDARY_DEFENSE_BALANCE.grunkreuzOnDuration)-dt;if(owner.grunkreuzOn>0){owner.grunkreuzTimer=(owner.grunkreuzTimer??0)-dt;if(owner.grunkreuzTimer<=0){owner.grunkreuzTimer+=LEGENDARY_DEFENSE_BALANCE.grunkreuzInterval;world.grunkreuzPuffs??=[];world.grunkreuzPuffs.push({x:owner.x-Math.cos(owner.a)*26,y:owner.y-Math.sin(owner.a)*26,r:LEGENDARY_DEFENSE_BALANCE.grunkreuzRadius,life:3,maxLife:3,dmg:Math.max(3,Math.round(owner.maxHp*LEGENDARY_DEFENSE_BALANCE.grunkreuzFraction)),ownerId:owner.id,seed:world.t*.77+owner.x*.013});owner.burst?.(owner.x-Math.cos(owner.a)*30,owner.y-Math.sin(owner.a)*30,'#a4c46a',3)}}else{owner.grunkreuzOff=(owner.grunkreuzOff??LEGENDARY_DEFENSE_BALANCE.grunkreuzOffDuration)-dt;if(owner.grunkreuzOff<=0){owner.grunkreuzOff+=LEGENDARY_DEFENSE_BALANCE.grunkreuzOffDuration;owner.grunkreuzOn=LEGENDARY_DEFENSE_BALANCE.grunkreuzOnDuration;owner.event?.('wave','녹십자 분출 재충전')}}}
 for(const p of world.grunkreuzPuffs||[])p.life-=dt;
 if(world.grunkreuzPuffs){world.grunkreuzPuffs=world.grunkreuzPuffs.filter(p=>p.life>0);for(const e of world.enemies||[]){e.grunkreuzTick=(e.grunkreuzTick||0)-dt;if(e.hp<=0||e.grunkreuzTick>0||e.stageBossBody)continue;const puff=world.grunkreuzPuffs.find(p=>Math.hypot(e.x-p.x,e.y-p.y)<p.r);if(!puff)continue;e.grunkreuzTick=.6;e.hp-=puff.dmg||1;e.hitFlash=Math.max(e.hitFlash||0,.12);if(e.hp<=0){e.grunkreuzDead=true;const own=(world.players||[]).find(p=>p.id===puff.ownerId)||owner;if(world.handleDeath)world.handleDeath(e,{patrol:false,ownerId:puff.ownerId});else{own.kills=(own.kills||0)+1;if(e.bossPilot||['boss','zeppelin','bomber'].includes(e.type))own.priorityKills=(own.priorityKills||0)+1;if(e.type==='zeppelin'&&world.wreckGust)world.wreckGust(e);world.burst?.(e.x,e.y,'#f2aa52',30);world.event?.('kill','')}}}}
 if(owner.kaiserFog){owner.kaiserFogTimer=(owner.kaiserFogTimer??LEGENDARY_DEFENSE_BALANCE.fogInterval)-dt;if(owner.kaiserFogTimer<=0){owner.kaiserFogTimer+=LEGENDARY_DEFENSE_BALANCE.fogInterval;owner.kaiserFogTime=LEGENDARY_DEFENSE_BALANCE.fogDuration;for(const e of world.enemies||[]){if(!e.targetPlayerId||e.targetPlayerId===owner.id)e.targetPlayerId=null;e.patrolTarget=null;e.fire=Math.max(e.fire||0,.65)}owner.event('wave','카이저의 안개 · 적 추적 해제')}owner.kaiserFogTime=Math.max(0,(owner.kaiserFogTime||0)-dt)}
}
const _legendaryUpgrade109=Game.prototype.upgrade;
Game.prototype.upgrade=function(id,rarity='normal'){
 const before=this.upgrades[id]||0;_legendaryUpgrade109.call(this,id,rarity);if((this.upgrades[id]||0)<=before)return;
 if(id==='quadLewis')this.shots+=4;
 else if(id==='cow37'){this.cow37=true;this.unlimitedAmmo=false;this.cow37Timer=.15;this.weapon={name:'COW 37mm 기관포',caliber:'37 mm',guns:1,belt:COW37_BALANCE.belt,rpm:Math.round(60/COW37_BALANCE.interval),reload:COW37_BALANCE.reload};this.ammo=[COW37_BALANCE.belt];this.reloadTime=0;this.fire=0;}
 else if(id==='rankinShell'){this.rankinShell=true;this.rankinTimer=LEGENDARY_DEFENSE_BALANCE.rankinInterval;}
 else if(id==='kaiserFog'){this.kaiserFog=true;this.kaiserFogTimer=LEGENDARY_DEFENSE_BALANCE.fogInterval;this.kaiserFogTime=0;}
 else if(id==='grunkreuz'){this.grunkreuz=true;this.grunkreuzTimer=LEGENDARY_DEFENSE_BALANCE.grunkreuzInterval*Math.max(LEGENDARY_DEFENSE_BALANCE.grunkreuzMinIntervalFactor,this.cooldownMult||1);}
 else if(id==='maximBelt'){this.unlimitedAmmo=true;this.reloadTime=0;this.ammo.fill(this.weapon.belt);}
};
const _legendaryTarget109=Game.prototype.enemyCombatTarget;
Game.prototype.enemyCombatTarget=function(e){return this.kaiserFogTime>0?{x:e.x+Math.cos(e.a)*420,y:e.y+Math.sin(e.a)*420,a:e.a,fogHidden:true}:_legendaryTarget109.call(this,e)};
const _legendaryFireEnemy109=Game.prototype.fireEnemy;
Game.prototype.fireEnemy=function(e){if(this.kaiserFogTime>0){e.fire=.35;return}return _legendaryFireEnemy109.call(this,e)};
const _legendaryEnemyVolley109=Game.prototype.enemyVolley;
Game.prototype.enemyVolley=function(e,...args){if(this.kaiserFogTime>0)return;return _legendaryEnemyVolley109.call(this,e,...args)};
const _legendarySystems109=Game.prototype.update;
Game.prototype.update=function(dt,input={}){
 if(this.state!=='playing')return _legendarySystems109.call(this,dt,input);const step=Math.min(.04,Math.max(0,dt));
 tickLegendaryDefenses(this,this.combatWorld(),step);
 if(this.cow37&&(input.inputMode!=='gamepad'||input.fireHeld)){this.cow37Timer=(this.cow37Timer??.15)-step;if(this.reloadTime<=0&&this.cow37Timer<=0){if((this.ammo[0]||0)<=0)this.reload();else{this.cow37Timer+=this.ordnanceInterval(COW37_BALANCE.interval);this.ammo[0]--;this.roundsFired++;const a=this.a,fonck=this.pilot==='fonck'&&this.skillTime>0;this.bullets.push({x:this.x+Math.cos(a)*38,y:this.y+Math.sin(a)*38,vx:Math.cos(a)*COW37_BALANCE.speed,vy:Math.sin(a)*COW37_BALANCE.speed,life:2.5,enemy:false,ownerId:this.id,cow37:true,fonckSeeker:fonck,fonckGuided:fonck,pierce:true,collisionRadius:24,damage:this.payloadPower(COW37_BALANCE.damage)*(this.damage/12)*this.normalGunMultiplier()*(fonck?1.35:1),hit:new Set()});this.muzzleFlash=.2;this.shake=Math.max(this.shake,6);this.burst(this.x+Math.cos(a)*32,this.y+Math.sin(a)*32,'#e8d39a',16);this.cannonMuzzleSmoke('cow');this.event('shot','')}}}
 _legendarySystems109.call(this,step,input);
};

// Revision 113: shared battlefield threat layer, without replacing flight/weapon logic.
export const BATTLEFIELD113=Object.freeze({fireLife:12,fireRadius:125,fireDamage:16,mineTrigger:43,mineDamage:30,aceCooldown:6.2});
Game.prototype.cannonMuzzleSmoke=function(kind='motor'){
 const world=this.combatWorld(),heavy=kind==='cow',count=heavy?7:5,fx=Math.cos(this.a),fy=Math.sin(this.a),sx=-fy,sy=fx;
 for(let i=0;i<count;i++){
  const forward=48+this.rng()*12,lateral=(this.rng()-.5)*(heavy?26:20),sideVelocity=(this.rng()-.5)*(heavy?96:72),backVelocity=5+this.rng()*(heavy?18:14),life=(heavy?.78:.64)+this.rng()*.24;
  world.particles.push({x:this.x+fx*forward+sx*lateral,y:this.y+fy*forward+sy*lateral,vx:sx*sideVelocity-fx*backVelocity,vy:sy*sideVelocity-fy*backVelocity,life,maxLife:life,smoke:true,size:(heavy?8:6)+this.rng()*3,color:heavy?'#c2c2b4':'#d0d1c5',muzzleSmoke:true,ownerId:this.id||'p1'});
 }
};
// Arcade capacities/reload times, not historical ammunition or aerial reloading claims.
export const GUN_PROFILES=Object.freeze({
 vickers:Object.freeze({name:'Vickers',belt:288,reload:3.2,rpm:450,spread:.008,damage:1,feed:'탄띠'}),
 spandau:Object.freeze({name:'Spandau LMG 08/15',belt:224,reload:2.6,rpm:450,spread:.004,damage:1,feed:'탄띠'}),
 lewis:Object.freeze({name:'Lewis',belt:75,reload:1.65,rpm:480,spread:.013,damage:1,feed:'드럼'}),
 parabellum:Object.freeze({name:'Parabellum MG 14',belt:160,reload:2.1,rpm:550,spread:.025,damage:.85,feed:'탄띠'})
});
for(const [id,w] of Object.entries(WEAPONS)){
 const key=id==='airco_dh2'||id==='re7'?'lewis':PLANES[id]?.faction==='central'?'spandau':'vickers';
 const profile=GUN_PROFILES[key];w.gunProfile=key;w.gunProfiles=w.bidirectional?[key,id==='halberstadt_duo'?'parabellum':'lewis']:Array(w.guns).fill(key);
 Object.assign(w,{belt:profile.belt,reload:profile.reload,rpm:profile.rpm});
 w.name=w.bidirectional?profile.name+' / '+GUN_PROFILES[w.gunProfiles[1]].name:profile.name;
 if(PLANES[id])PLANES[id].gunProfiles=[...w.gunProfiles];
}
const _profileRound113=Game.prototype.applySpecialRound;
Game.prototype.applySpecialRound=function(b,type){
 _profileRound113.call(this,b,type);const key=this.weapon.gunProfiles?.[b.gun||0],profile=GUN_PROFILES[key];
 if(profile&&!b.motorCannon&&!b.cow37){const a=Math.atan2(b.vy,b.vx)+(this.rng()-.5)*profile.spread*2,s=Math.hypot(b.vx,b.vy);b.vx=Math.cos(a)*s;b.vy=Math.sin(a)*s;b.damage*=profile.damage;}
 return b;
};
const _impact113=Game.prototype.specialRoundImpact;
Game.prototype.specialRoundImpact=function(b,e){
 _impact113.call(this,b,e);if(!b.cow37)return;const w=this.combatWorld();w.cannonImpacts??=[];w.cannonImpacts.push({x:b.x,y:b.y,life:.24});w.cannonImpacts=w.cannonImpacts.slice(-24);
 for(let i=0;i<7;i++){const a=i*Math.PI*2/7;w.particles.push({x:b.x,y:b.y,vx:Math.cos(a)*92,vy:Math.sin(a)*92,life:.38,color:i%2?'#acaa94':'#e2c38a'});}
};
UPGRADES.find(u=>u.id==='damage').name='기관총 개조';
const _spawn113=Game.prototype.spawnEnemy;
Game.prototype.spawnEnemy=function(type,...args){
 const e=_spawn113.call(this,type,...args);if(!e)return e;
 if(e.bossPilot){const loop=this.stageBoss?.stages.loopIndex||0,late=Math.min(1,Math.max(0,(this.t-180)/360));e.hp=e.maxHp=Math.round(e.maxHp*(1+.7*loop+.15*loop*loop));e.speed*=Math.min(1.9,1+loop*.18);e.aceAttackRate=1+Math.min(.75,loop*.2+late*.18);e.aceDamageMultiplier=1+Math.min(.65,loop*.16+late*.14);e.aceTurnMultiplier=1+Math.min(.3,loop*.08+late*.06);e.abilityTimer=2.2;e.threat113=true;}
 return e;
};
const _spawnInterval113=Game.prototype.regularSpawnInterval;
Game.prototype.regularSpawnInterval=function(){return _spawnInterval113.call(this)*.72};
const _dogfight113=Game.prototype.dogfightSteering;
Game.prototype.dogfightSteering=function(e,contact,dt,baseTurn){
 if(e.bossPilot&&e.disengageUntil>this.t)return{delta:angleDiff(e.exitHeading,e.a),turn:baseTurn*.55};
 const result=_dogfight113.call(this,e,contact,dt,baseTurn);
 if(!e.bossPilot&&!e.surface&&!e.stationary){result.turn*=.68;if(e.attackPassTime>0)e.attackPassTime=Math.min(3,e.attackPassTime+dt*.2);}
 return result;
};
Game.prototype.wreckGust=function(e){
 if(e.fireCreated)return;e.fireCreated=true;this.fireZones??=[];
 this.fireZones.push({x:e.x,y:e.y,radius:BATTLEFIELD113.fireRadius,life:BATTLEFIELD113.fireLife,maxLife:BATTLEFIELD113.fireLife,tick:0});
 this.fireZones=this.fireZones.slice(-8);this.combatBlast(e.x,e.y,95,'enemy','hydrogen');this.event('flak','수소 화재 · 적과 아군 모두 접근 금지');
};
const _tickThreat113=Game.prototype.tickRevisionWorld;
Game.prototype.tickRevisionWorld=function(dt){
 _tickThreat113.call(this,dt);const ps=this.players||[this],loop=this.stageBoss?.stages.loopIndex||0;
 this.cannonImpacts=(this.cannonImpacts||[]).filter(f=>(f.life-=dt)>0);
 for(const e of this.enemies){
  if(e.bossPilot&&!this.sunStrikeContains(e)&&Number.isFinite(e.abilityTimer))e.abilityTimer-=dt*(.35+Math.min(1.5,loop*.3));
  if(this.players){e.vossInvuln=Math.max(0,(e.vossInvuln||0)-dt);if(e.vossReverse>0)e.vossReverse=Math.max(0,e.vossReverse-dt);e.vossTrails=(e.vossTrails||[]).filter(d=>d.life>0).slice(-6);
  if(e.disengageUntil>this.t)e.fire=Math.max(e.fire,.15);
  if(e.sunBlindUntil>this.t)for(const p of ps){const a=Math.atan2(p.y-e.y,p.x-e.x);if(Math.hypot(p.x-e.x,p.y-e.y)<470&&Math.abs(angleDiff(a,e.a))<.7)p.fire=Math.max(p.fire,.12);}
 }
  if(this.players)for(const p of this.players){if(!(p.hp>0))continue;p.vossAfterimages??=[];for(const ghost of p.vossAfterimages){ghost.life-=dt;if(ghost.life>0){const d0=ghost.drift??ghost.a;ghost.x+=Math.cos(d0)*165*dt;ghost.y+=Math.sin(d0)*165*dt;ghost.a=d0;let tgt=null,best=620*620;for(const en of this.enemies){if(en.hp<=0)continue;const d2=(en.x-ghost.x)**2+(en.y-ghost.y)**2;if(d2<best){best=d2;tgt=en}}ghost.fire=(ghost.fire??.18)-dt;if(ghost.fire<=0){ghost.fire=.42;if(tgt){const aim=Math.atan2(tgt.y-ghost.y,tgt.x-ghost.x);this.bullets.push({x:ghost.x+Math.cos(aim)*12,y:ghost.y+Math.sin(aim)*12,vx:Math.cos(aim)*430,vy:Math.sin(aim)*430,life:1.4,enemy:false,ownerId:p.id,ghost:true,damage:8,hit:new Set()})}}}}}}
 for(const f of this.fireZones||[]){f.life-=dt;f.tick-=dt;if(f.tick>0||f.life<=0)continue;f.tick=.5;
  for(const p of ps)if(p.hp>0&&Math.hypot(p.x-f.x,p.y-f.y)<f.radius){if(this.players)this.hitPlayer(p,BATTLEFIELD113.fireDamage*.5);else this.hit(BATTLEFIELD113.fireDamage*.5);}
  for(const e of this.enemies)if(e.hp>0&&!e.stageBossBody&&Math.hypot(e.x-f.x,e.y-f.y)<f.radius){
   // Use normal projectile death/reward resolution, including chain airship fires.
   this.bullets.push({x:e.x,y:e.y,vx:0,vy:0,life:.12,enemy:false,damage:8,hit:new Set(),patrol:true,fireZone:true});
  }
  for(const a of [...this.allies||[],...this.patrols||[],...this.friendlyBombers||[]])if(Math.hypot(a.x-f.x,a.y-f.y)<f.radius){a.hp=(a.hp??60)-8;if(a.hp<=0)a.life=0;}
 }
 this.fireZones=(this.fireZones||[]).filter(f=>f.life>0);
 for(const f of this.hostileMinefields||[])if(f.warning<=0)for(const m of f.mines){if(m.dead)continue;for(const p of ps)if(p.hp>0&&Math.hypot(p.x-m.x,p.y-m.y)<BATTLEFIELD113.mineTrigger){m.dead=true;if(this.players)this.hitPlayer(p,BATTLEFIELD113.mineDamage);else this.hit(BATTLEFIELD113.mineDamage);this.combatBlast(m.x,m.y,76,'enemy','mine');break;}}
 for(const g of this.gusts||[]){if(!g.strong113){g.strong113=true;g.radius*=1.55;g.vx*=1.6;g.vy*=1.6;}for(const p of ps)if(p.hp>0&&Math.hypot(p.x-g.x,p.y-g.y)<g.radius){p.x+=g.vx*dt*.32;p.y+=g.vy*dt*.32;p.a+=Math.sin(this.t*9)*dt*.65;}}
 if(this.worldRegion()===5){if(!this.skyTimers113){this.skyTimers113={fieldUnitTimer:this.fieldUnitTimer,flakTimer:this.flakTimer};}this.gustTimer=Math.min(this.gustTimer??0,4.5);this.fieldUnitTimer=Infinity;this.flakTimer=Infinity;}else{if(this.skyTimers113){Object.assign(this,this.skyTimers113);this.skyTimers113=null;}if(Number.isFinite(this.gustTimer)&&this.gustTimer<120)this.gustTimer=Math.min(this.gustTimer,24);}
 for(const b of this.bullets){if(b.enemy&&(b.flak||b.naval||b.fieldShell)&&!b.threat113){b.threat113=true;b.vx*=1.3;b.vy*=1.3;b.damage*=1.15;}
  if((b.motorCannon||b.cow37)&&!b.recoil113){b.recoil113=true;b.collisionRadius=b.cow37?13:9;const p=ps.find(p=>p.id===b.ownerId)||ps[0];if(p){const kick=b.cow37?16:11;p.x-=Math.cos(p.a)*kick;p.y-=Math.sin(p.a)*kick;p.cannonRecoil129=.24;p.cannonKick129=kick;p.cannonKind129=b.cow37?'cow':'motor';}}
 }
};
const _flak113=Game.prototype.spawnFlak;
Game.prototype.spawnFlak=function(){if(this.worldRegion()===5)return;return _flak113.call(this)};
const _scheduled113=Game.prototype.runScheduledAces;
Game.prototype.runScheduledAces=function(){if(this.worldRegion()===5)return;return _scheduled113.call(this)};
const _ace113=Game.prototype.aceAttack;
Game.prototype.aceAttack=function(e){
 const result=_ace113.call(this,e);const p=this.enemyCombatTarget(e),aim=Math.atan2(p.y-e.y,p.x-e.x);
 e.skillUses=(e.skillUses||0)+1;e.disengageUntil=this.t+2.4;e.exitHeading=aim+(this.rng()<.5?1:-1)*1.15;
 if(e.bossPilot==='baron'){e.sunBlindUntil=this.t+2.5;this.event('wave','붉은 남작 · 태양을 등진 재돌입');}
 if(['goering','mannock','boelcke','collishaw'].includes(e.bossPilot)){
  const goering=e.bossPilot==='goering',plane=goering?'white-fokkerdv55':e.bossPilot==='mannock'?'se5a':e.bossPlane;
  this.bossMechanicSpawn=true;try{for(let i=0;i<3;i++){const w=this.spawnEnemy('hunter');if(!w)break;Object.assign(w,{x:e.x+(i-1)*80,y:e.y+80,a:aim,escortPlane:plane,formationLeader:e,formationBack:70,formationOffset:(i-1)*80});attachAircraftPersonality(PLANES,w,plane);}}finally{this.bossMechanicSpawn=false;}
  if(goering){this.enemyAirshipPasses??=[];for(let i=0;i<3;i++)this.enemyAirshipPasses.push({x:p.x-400-i*110,y:p.y-340+i*130,a:.7,life:5,fire:.5+i*.2});}
 }
 return result;
};
const _tickFleet113=Game.prototype.tickRevisionWorld;
Game.prototype.tickRevisionWorld=function(dt){_tickFleet113.call(this,dt);for(const e of this.enemyAirshipPasses||[]){e.life-=dt;e.x+=Math.cos(e.a)*180*dt;e.y+=Math.sin(e.a)*180*dt;e.fire-=dt;if(e.fire<=0){e.fire=.8;for(let i=-2;i<=2;i++){const a=e.a+Math.PI/2+i*.2;this.bullets.push({x:e.x,y:e.y,vx:Math.cos(a)*260,vy:Math.sin(a)*260,life:2.2,enemy:true,visualType:'zeppelin',damage:12});}}}this.enemyAirshipPasses=(this.enemyAirshipPasses||[]).filter(e=>e.life>0);};

// Revision 124 — four faction-balanced aces and a boss-grade René Fonck barrage.
export const NEW_ACE_BALANCE124=Object.freeze({
 wolffStackSeconds:3,wolffMaxStacks:6,wolffDamagePerStack:.05,wolffSpeedPerStack:.03,wolffClimbSeconds:.75,wolffDiveSpeed:2.05,wolffDiveDamage:1.55,wolffDiveFireRate:1.8,
 loewenhardtFrontalDamage:1.35,loewenhardtDiveSeconds:.55,loewenhardtSkillDamage:1.45,loewenhardtSkillSpeed:1.72,loewenhardtSkillFireRate:3,
 mccuddenRepairFraction:.35,nungesserInvulnerability:3,nungesserMaxSpeedBonus:.35,nungesserMaxFireRateBonus:.60,
 fonckBarrageDuration:3.8,fonckBarrageInterval:.22,fonckAbilityMin:5.8,fonckAbilityVariance:1.4,fonckBossHpMultiplier:1.15
});
const newAceAirframes={
 wolff_albatros:{name:'알바트로스 D.III · 여린꽃',faction:'central',speed:149,turn:3.35,hp:110,drag:.14,recovery:1.35,role:'무피격 축적 · 급강하 기습',history:'쿠르트 볼프의 알바트로스 D.III를 바탕으로 목재 동체·Jasta 11 적색 띠·초록 꼬리와 작은 흰 꽃 표식을 조합한 전용 도장입니다.',tip:'피격을 피할수록 강해집니다. 중첩을 모은 뒤 붐 앤 줌으로 직선 기습하세요.'},
 loewenhardt_fokkerd7:{name:'포커 D.VII · 노랑포커',faction:'central',speed:162,turn:3.6,hp:122,drag:.09,recovery:1.6,role:'정면 화력 · 수직 상승 사격',history:'카나리아색 상부 날개와 동체, 로젠지 하부 날개, 흰 꼬리와 대형 검은 십자를 사용한 에리히 뢰벤하르트 전용 D.VII입니다.',tip:'정면 교전 피해가 높습니다. 수직 상승 사격은 방향 전환보다 진입선 선정이 중요합니다.'},
 mccudden_se5a:{name:'S.E.5a · 맥커든 개조형',faction:'entente',speed:184,turn:2.95,hp:128,drag:.10,recovery:1.65,role:'고속 개조 · 선택지 확장',history:'제임스 맥커든이 고고도 성능을 위해 손본 S.E.5a에서 착안했습니다. PC10 도장, 흰 G 표식, 붉은 스피너와 4엽 프로펠러를 반영했습니다.',tip:'최고속도가 높고 매 레벨 선택지가 4개입니다. 넓게 이탈하며 필요한 개조를 빠르게 완성하세요.'},
 nungesser_nieuport24:{name:'뉴포르 24bis · 죽음의 기사',faction:'entente',speed:158,turn:4.3,hp:88,drag:.19,recovery:1.4,role:'빈사 가속 · 불사 돌파',history:'샤를 너겐서의 은색 뉴포르와 검은 심장·해골·관 상징을 게임용으로 정리한 전용 24bis입니다.',tip:'내구도가 낮을수록 빨라집니다. 불사조의 집념으로 위험 구간을 넘기되 종료 직후 이탈하세요.'}
};
for(const [id,s]of Object.entries(newAceAirframes)){
 const handling=Object.freeze({speed:s.speed,turn:s.turn,drag:s.drag,recovery:s.recovery,role:s.role,history:s.history,tip:s.tip});
 PLANES[id]={name:s.name,faction:s.faction,speed:s.speed,turn:s.turn,hp:s.hp,rate:id==='nungesser_nieuport24'?.2:.17,color:s.faction==='central'?'#b8a16d':'#899277',wings:2,role:s.role,handling};
 configureAirframeBalance(PLANES[id],s.hp);
}
WEAPONS.wolff_albatros={...WEAPONS.albatros,name:'Spandau LMG 08/15',guns:2,gunProfile:'spandau',gunProfiles:['spandau','spandau']};
WEAPONS.loewenhardt_fokkerd7={...WEAPONS.fokkerd7,name:'Spandau LMG 08/15',guns:2,gunProfile:'spandau',gunProfiles:['spandau','spandau']};
WEAPONS.mccudden_se5a={...WEAPONS.se5a,name:'Vickers / Lewis',guns:2,gunProfile:'vickers',gunProfiles:['vickers','lewis']};
WEAPONS.nungesser_nieuport24={...WEAPONS.nieuport24,name:'Vickers',guns:1,gunProfile:'vickers',gunProfiles:['vickers']};
Object.assign(PILOTS,{
 wolff:{name:'쿠르트 볼프',alias:'ZARTE BLÜMLEIN',faction:'central',portrait:16,passive:'여린 작은꽃',passiveDesc:'3초 무피격마다 공격력 +5%·속도 +3%, 최대 6중첩. 강화 중 흰 꽃잎이 날리며, 피격 시 초기화.',skill:'붐 앤 줌',desc:'0.75초간 고도를 얻은 뒤 급강하. 하강할수록 가속하며 공격력 +55%, 공격속도 +80%, 선회력 −50%.',cooldown:PILOT_BALANCE.cooldowns.wolff},
 loewenhardt:{name:'에리히 뢰벤하르트',alias:'YELLOW PERIL',faction:'central',portrait:17,passive:'노란색 포커를 타는 미친놈',passiveDesc:'적과 정면으로 마주칠 때 기관총 피해 +35%.',skill:'라이징 스트라이크',desc:'0.55초간 하방으로 진입한 뒤 수직 상승 사격. 상승할수록 속도가 감소하며 공격속도 +200%, 공격력 +45%, 선회력 −65%.',cooldown:PILOT_BALANCE.cooldowns.loewenhardt},
 mccudden:{name:'제임스 맥커든',alias:'THE ENGINEERING ACE',faction:'entente',portrait:18,passive:'엔지니어링 에이스',passiveDesc:'모든 레벨업에서 선택지가 3개가 아닌 4개로 제시됩니다.',skill:'슈퍼 엔지니어링',desc:'주변에 수리 보급품 3개를 투하합니다. 개당 최대 HP의 11.7% 회복. 철십자훈장 강화 시 4개 투하. 협동 아군도 회수 가능.',cooldown:PILOT_BALANCE.cooldowns.mccudden},
 nungesser:{name:'샤를 너겐서',alias:'THE KNIGHT OF DEATH',faction:'entente',portrait:19,passive:'죽음의 기사',passiveDesc:'내구도가 낮을수록 공격속도 최대 +60%, 이동속도 최대 +35%. 원형 게이지가 현재 강화 정도를 표시합니다.',skill:'불사조의 집념',desc:'3초간 완전 무적 상태로 버팁니다.',cooldown:PILOT_BALANCE.cooldowns.nungesser}
});
Object.assign(PILOT_PLANES,{wolff:'wolff_albatros',loewenhardt:'loewenhardt_fokkerd7',mccudden:'mccudden_se5a',nungesser:'nungesser_nieuport24'});
// Jacobs flies his famous black Dr.I; same airframe family, dedicated livery sprite.
PLANES.fokker_jacobs={...PLANES.fokker,name:'포커 Dr.I · 야콥스',role:'근접 제압형',handling:PLANES.fokker.handling};
WEAPONS.fokker_jacobs={...WEAPONS.fokker};
configureAirframeBalance(PLANES.fokker_jacobs,110);
Object.assign(PILOTS,{jacobs:{name:'요제프 야콥스',alias:'THE HAWK OF JASTA 7',faction:'central',portrait:0,passive:'야스타 7의 노련함',passiveDesc:'격추 시 3초간 연사 +10% 중첩 (최대 3단).',skill:'근접 제압 사격',desc:'4초간 기관총 공격력 ×1.9. 발동 시 0.8초 무적.',cooldown:PILOT_BALANCE.cooldowns.jacobs}});
PILOT_PLANES.jacobs='fokker_jacobs';
// Ace-specific liveries: pilots keep their generic airframe's stats but fly a
// personally marked sprite instead of the shared one.
const ACE_LIVERIES165={goering_fokkerd7:'fokkerd7',collishaw_sopwith:'sopwith',guynemer_spad:'spad12',udet_fokkerdv:'fokkerdv',baracca_nieuport:'nieuport_italian',berthold_pfalz:'pfalz_d3a'};
const ACE_LIVERY_NAMES165={goering_fokkerd7:'포커 D.VII · 괴링 백색기',collishaw_sopwith:'숍위드 삼엽기 · 블랙 마리아',guynemer_spad:'SPAD XII · 뷔외 샤를',udet_fokkerdv:'포커 D.VIII · LO!',baracca_nieuport:'니외포르 17 · 카발리노 람판테',berthold_pfalz:'팔츠 D.IIIA · 날개검'};
for(const[key,base]of Object.entries(ACE_LIVERIES165)){PLANES[key]={...PLANES[base],name:ACE_LIVERY_NAMES165[key],handling:PLANES[base].handling};WEAPONS[key]={...WEAPONS[base]};PILOT_PLANES[key.split('_')[0]]=key}
const _jacobsSkill165=Game.prototype.skill;
Game.prototype.skill=function(){
 if(this.pilot!=='jacobs')return _jacobsSkill165.call(this);
 this.ensureRevisionPilot();if(this.state!=='playing'||this.hp<=0||this.cooldown>0)return false;this.cooldown=this.skillCooldown();this.skillTime=this.skillDuration();this.invuln=Math.max(this.invuln,.8*(this.skillEnhanced?1.35:1));this.burst(this.x,this.y,'#8a8f7a',18);this.event('skill',PILOTS.jacobs.skill);return true;
};
const _jacobsDuration165=Game.prototype.skillDuration;
Game.prototype.skillDuration=function(){return this.pilot==='jacobs'?4*(this.skillEnhanced?1.35:1):_jacobsDuration165.call(this)};
const _jacobsGun165=Game.prototype.normalGunMultiplier;
Game.prototype.normalGunMultiplier=function(){return _jacobsGun165.call(this)*(this.pilot==='jacobs'&&this.skillTime>0?1.9:1)};

const _ensureNewAces124=Game.prototype.ensureRevisionPilot;
Game.prototype.ensureRevisionPilot=function(){
 _ensureNewAces124.call(this);if(this.newAces124Ready)return;this.newAces124Ready=true;
 if(this.pilot==='wolff'){this.wolffSafeTime=0;this.wolffStacks=0}
 if(this.pilot==='nungesser'){this.nungesserHeartTimer=0}
};
const _newAceDuration124=Game.prototype.skillDuration;
Game.prototype.skillDuration=function(){const base=({wolff:2.8,loewenhardt:2.4,mccudden:.55,nungesser:NEW_ACE_BALANCE124.nungesserInvulnerability})[this.pilot];return base===undefined?_newAceDuration124.call(this):base*(this.skillEnhanced?1.35:1)};
const _newAceSkill124=Game.prototype.skill;
Game.prototype.skill=function(){
 if(!['wolff','loewenhardt','mccudden','nungesser'].includes(this.pilot))return _newAceSkill124.call(this);
 this.ensureRevisionPilot();if(this.state!=='playing'||this.hp<=0||this.cooldown>0)return false;this.cooldown=this.skillCooldown();this.skillTime=this.skillDuration();
 if(this.pilot==='wolff'){this.wolffSkillDuration=this.skillTime;this.wolffDiveAnnounced=false;this.burst(this.x,this.y,'#dbe6c0',16)}
 else if(this.pilot==='loewenhardt'){this.loewenhardtSkillDuration=this.skillTime;this.invuln=Math.max(this.invuln,NEW_ACE_BALANCE124.loewenhardtDiveSeconds*(this.skillEnhanced?1.35:1));this.burst(this.x,this.y,'#ffd84b',18)}
 else if(this.pilot==='mccudden'){const world=this.combatWorld(),count=this.skillEnhanced?4:3;for(let i=0;i<count;i++){const a=this.a+Math.PI/2+i*Math.PI*2/count;world.drops.push({x:this.x+Math.cos(a)*85,y:this.y+Math.sin(a)*85,vx:0,vy:0,life:25,value:0,heal:true,supply:true,healFraction:NEW_ACE_BALANCE124.mccuddenRepairFraction/3,ownerId:this.id});}this.event('wave',`수리 보급품 ${count}개 투하 · 아군도 회수 가능`)}
 else {this.invuln=Math.max(this.invuln,this.skillTime);this.burst(this.x,this.y,'#1d1822',26)}
 this.aceHeading129=this.a;this.event('skill',PILOTS[this.pilot].skill);return true;
};
const _newAceIncoming124=Game.prototype.incomingDamageMultiplier;
Game.prototype.incomingDamageMultiplier=function(source){let mult=_newAceIncoming124.call(this,source);if(this.rankinShell&&source){const rear=Math.abs(angleDiff(Math.atan2(source.y-this.y,source.x-this.x),this.a+Math.PI));if(rear<=LEGENDARY_DEFENSE_BALANCE.rankinRearArcDegrees*Math.PI/360)mult*=LEGENDARY_DEFENSE_BALANCE.rankinRearDamageMultiplier}if(this.pilot==='wolff'&&(this.invuln||0)<=0){this.wolffSafeTime=0;this.wolffStacks=0;this.wolffPetalTimer131=0;for(const p of this.combatWorld().particles||[])if(p.petal&&p.ownerId===(this.id||'p1'))p.life=0}return mult};
const _newAceFrame124=Game.prototype.beginRevisionFrame;
Game.prototype.beginRevisionFrame=function(dt,input={}){
 const prior=_newAceFrame124.call(this,dt,input),world=this.combatWorld();
 this.aceRetreat129=false;this.aceScale129=1;this.cannonRecoil129=Math.max(0,(this.cannonRecoil129||0)-dt);
 if(this.pilot==='wolff'){
  this.wolffSafeTime=(this.wolffSafeTime||0)+dt;this.wolffStacks=Math.min(NEW_ACE_BALANCE124.wolffMaxStacks,Math.floor(this.wolffSafeTime/NEW_ACE_BALANCE124.wolffStackSeconds));
  this.wolffPetalTimer131=Math.max(0,(this.wolffPetalTimer131||0)-dt);
  if(this.wolffStacks>0&&this.wolffPetalTimer131===0){
   this.wolffPetalTimer131=.52-this.wolffStacks*.045;
   for(let i=0;i<(this.wolffStacks>=4?2:1);i++){const a=this.rng()*Math.PI*2,r=18+this.rng()*30,drift=10+this.rng()*18;
    world.particles.push({x:this.x+Math.cos(a)*r,y:this.y+Math.sin(a)*r,vx:Math.cos(a)*drift+(this.rng()-.5)*12,vy:Math.sin(a)*drift+(this.rng()-.5)*12,life:1.12,maxLife:1.12,petal:true,ownerId:this.id||'p1',size:4+this.rng()*2,angle:a,spin:(this.rng()-.5)*4});
   }
  }
  const passiveSpeed=1+this.wolffStacks*NEW_ACE_BALANCE124.wolffSpeedPerStack;this.baseSpeed*=passiveSpeed;this.speed*=passiveSpeed;this.revisionDamageMult*=1+this.wolffStacks*NEW_ACE_BALANCE124.wolffDamagePerStack;
  if(this.skillTime>0){const duration=this.wolffSkillDuration||this.skillDuration(),elapsed=duration-this.skillTime,diving=elapsed>=NEW_ACE_BALANCE124.wolffClimbSeconds;this.aceSkillPhase=diving?'dive':'climb';
   if(diving){const q=Math.min(1,(elapsed-NEW_ACE_BALANCE124.wolffClimbSeconds)/.72),ease=q*q*(3-2*q),entry=Math.sin(Math.min(1,q/.14)*Math.PI/2),boost=entry*(.32+(NEW_ACE_BALANCE124.wolffDiveSpeed-.32)*ease);this.aceScale129=1.055-.055*ease;this.baseSpeed*=boost;this.speed*=boost;this.turn*=.66-.16*ease;this.rate/=1+(NEW_ACE_BALANCE124.wolffDiveFireRate-1)*ease;this.revisionDamageMult*=1+(NEW_ACE_BALANCE124.wolffDiveDamage-1)*ease;if(!this.wolffDiveAnnounced){this.wolffDiveAnnounced=true;this.event('wave','붐 앤 줌 · 급강하 가속')}}
   else {const q=Math.min(1,elapsed/NEW_ACE_BALANCE124.wolffClimbSeconds),ease=q*q*(3-2*q),curve=Math.sin(Math.PI*q);this.aceScale129=1+.055*ease;this.aceRetreat129=true;this.baseSpeed*=-.42*curve;this.speed*=-.42*curve;this.turn=0;this.fire=Math.max(this.fire,dt+.05);this.invuln=Math.max(this.invuln,dt+.06);}
  }else this.aceSkillPhase=null;
 }
 if(this.pilot==='loewenhardt'&&this.skillTime>0){const duration=this.loewenhardtSkillDuration||this.skillDuration(),elapsed=duration-this.skillTime,climbing=elapsed>=NEW_ACE_BALANCE124.loewenhardtDiveSeconds;this.aceSkillPhase=climbing?'vertical-fire':'dive-under';
  if(climbing){const q=Math.min(1,(elapsed-NEW_ACE_BALANCE124.loewenhardtDiveSeconds)/.9),ease=q*q*(3-2*q),entry=Math.sin(Math.min(1,q/.18)*Math.PI/2),climbSpeed=entry*(.92-.12*ease);this.aceScale129=.945+.055*ease;this.baseSpeed*=climbSpeed;this.speed*=climbSpeed;this.turn*=.52-.17*ease;this.rate/=1+(NEW_ACE_BALANCE124.loewenhardtSkillFireRate-1)*ease;this.revisionDamageMult*=1+(NEW_ACE_BALANCE124.loewenhardtSkillDamage-1)*ease}else{const q=Math.min(1,elapsed/NEW_ACE_BALANCE124.loewenhardtDiveSeconds),ease=q*q*(3-2*q),curve=Math.sin(Math.PI*q);this.aceScale129=1-.055*ease;this.aceRetreat129=true;this.baseSpeed*=-.38*curve;this.speed*=-.38*curve;this.turn=0;this.fire=Math.max(this.fire,dt+.05);this.invuln=Math.max(this.invuln,dt+.06);}
 }else if(this.pilot==='loewenhardt')this.aceSkillPhase=null;
 for(const pl of this.players||[this]){
  if(!pl||!(pl.hp>0))continue;
  if(pl.pilot==='udet'){const low=1-pl.hp/pl.maxHp;if(low>=.5){pl.fxOverheat=Math.min(1,(low-.5)*2+.35);pl._udetSpark=(pl._udetSpark||0)-dt;if(pl._udetSpark<=0){pl._udetSpark=.07;const j=this.rng(),j2=this.rng();world.particles.push({x:pl.x+Math.cos(pl.a)*12,y:pl.y+Math.sin(pl.a)*12,vx:-Math.cos(pl.a)*30+(j-.5)*46,vy:-Math.sin(pl.a)*30+(j2-.5)*46,life:.6,maxLife:.6,size:2.4+j*2.4,color:j2<.55?'#ffb45e':'#ff6436'})}}else pl.fxOverheat=0}
  if(pl.pilot==='loewenhardt'){pl.loewenhardtEngaged=false;for(const e of this.enemies){if(e.hp<=0||e.surface||e.dying)continue;const dx=e.x-pl.x,dy=e.y-pl.y;if(dx*dx+dy*dy>176400)continue;let d=Math.atan2(dy,dx)-pl.a;d=Math.atan2(Math.sin(d),Math.cos(d));if(Math.abs(d)<Math.PI/3){pl.loewenhardtEngaged=true;break}}}
  if(pl.pilot==='rickenbacker'){let n=0;for(const e of this.enemies)if(e.hp>0&&!e.surface&&Math.hypot(e.x-pl.x,e.y-pl.y)<700)n++;pl.rickCount=n}
  pl.rickActive=pl.pilot==='rickenbacker'?pl.skillTime:0
  if(pl.pilot==='ball')pl.ballAlone=!(world.allies||[]).some(a=>a.life>0&&Math.hypot(a.x-pl.x,a.y-pl.y)<320)&&!(this.players||[]).some(p2=>p2!==pl&&p2.hp>0&&Math.hypot(p2.x-pl.x,p2.y-pl.y)<320);
  if(pl.pilot==='brumowski')pl.brumAllyCount=(world.allies||[]).filter(a=>a.life>0).length;
  if(pl.pilot==='jacobs'){const k=this.kills||0;if(k>(pl._jkSeen||0)){pl.jacobsStacks=Math.min(3,(pl.jacobsStacks||0)+(k-(pl._jkSeen||0)));pl.jacobsStackTime=3}pl._jkSeen=k;pl.jacobsStackTime=Math.max(0,(pl.jacobsStackTime||0)-dt);if(pl.jacobsStackTime<=0)pl.jacobsStacks=0}
  if(pl.immelmannGhosts){for(const gh of pl.immelmannGhosts)gh.life-=dt;pl.immelmannGhosts=pl.immelmannGhosts.filter(gh=>gh.life>0)}
  if(pl.pilot==='immelmann'&&pl.evadeTime>0){pl._immGhost=(pl._immGhost||0)-dt;if(pl._immGhost<=0){pl._immGhost=.055;(pl.immelmannGhosts??=[]).push({x:pl.x,y:pl.y,a:pl.a,life:1.15,maxLife:1.15})}}
  if(pl.ballCloak>0){pl._ballCloud=(pl._ballCloud||0)-dt;if(pl._ballCloud<=0){pl._ballCloud=.05;const j=this.rng()*Math.PI*2,rr=4+this.rng()*24;world.particles.push({x:pl.x+Math.cos(j)*rr,y:pl.y+Math.sin(j)*rr,vx:(this.rng()-.5)*16,vy:(this.rng()-.5)*16,life:1.5+this.rng()*.4,maxLife:2,smoke:true,muzzleSmoke:true,size:12+this.rng()*10,color:'#eceee0'})}}
 }
 if(this.pilot==='nungesser'){
  const low=Math.min(1,Math.max(0,(1-this.hp/this.maxHp)/.8));const speed=1+low*NEW_ACE_BALANCE124.nungesserMaxSpeedBonus,fire=1+low*NEW_ACE_BALANCE124.nungesserMaxFireRateBonus;this.baseSpeed*=speed;this.speed*=speed;this.rate/=fire;this.passiveStrength=low;
  // Passive strength is shown by the shared lock-style gauge, without particle clutter.
  if(this.skillTime>0)this.invuln=Math.max(this.invuln,dt+.05);
 }
 this.passiveStrength=this.pilot==='wolff'?this.wolffStacks/NEW_ACE_BALANCE124.wolffMaxStacks:this.passiveStrength;
 this.mccuddenRepairFlash=Math.max(0,(this.mccuddenRepairFlash||0)-dt);return prior;
};
const _newAceRoundDamage124=Game.prototype.roundDamageMultiplier;
Game.prototype.roundDamageMultiplier=function(b,e){let mult=_newAceRoundDamage124.call(this,b,e);if(this.pilot==='loewenhardt'){const bearing=Math.atan2(this.y-e.y,this.x-e.x),front=Math.abs(angleDiff(bearing,e.a))<Math.PI/3;if(front)mult*=NEW_ACE_BALANCE124.loewenhardtFrontalDamage}return mult};

// Revision 164 installs the authoritative three-card draft and McCudden reroll below.
const _newAceCanHit124=Game.prototype.canHitTarget;
Game.prototype.canHitTarget=function(e,b){return !(e?.aceInvuln124>0)&&_newAceCanHit124.call(this,e,b)};
const _newAcePrepare124=Game.prototype.prepareBossWave;
Game.prototype.prepareBossWave=function(count){
 return _newAcePrepare124.call(this,count);
};
const _newAceSpawn124=Game.prototype.spawnEnemy;
Game.prototype.spawnEnemy=function(type,...args){
 const e=_newAceSpawn124.call(this,type,...args);if(e?.bossPilot==='fonck'){
  if(!e.fonckThreatTuned124){e.fonckThreatTuned124=true;e.hp=e.maxHp=Math.round(e.maxHp*NEW_ACE_BALANCE124.fonckBossHpMultiplier)}this.fonckEncountered124=true;
 }return e;
};
const _newAceDogfight124=Game.prototype.dogfightSteering;
Game.prototype.dogfightSteering=function(e,contact,dt,baseTurn){const result=_newAceDogfight124.call(this,e,contact,dt,baseTurn);if(e?.bossPilot==='fonck')result.turn*=1.35;return result};
const _newAceAttack124=Game.prototype.aceAttack;
Game.prototype.aceAttack=function(e){
 const id=e?.bossPilot;if(!id)return _newAceAttack124.call(this,e);const p=this.enemyCombatTarget(e),aim=Math.atan2(p.y-e.y,p.x-e.x);
 if(id==='fonck'){e.a=aim;e.fonckBarrage={time:NEW_ACE_BALANCE124.fonckBarrageDuration,shot:0,volley:0};e.abilityTimer=NEW_ACE_BALANCE124.fonckAbilityMin+this.rng()*NEW_ACE_BALANCE124.fonckAbilityVariance;e.fire=Math.max(e.fire,.2);this.event('wave','르네 퐁크 · 탄도학의 지옥');return true}
 if(id==='wolff'){e.a=aim;e.bossDash=1.15;e.burstLeft=5;e.burstDelay=.12;this.enemyVolley(e);this.event('wave','쿠르트 볼프 · 붐 앤 줌');return true}
 if(id==='loewenhardt'){e.a=aim;e.bossDash=.8;e.rapidFireUntil=this.t+2.4;e.burstLeft=8;e.burstDelay=.11;this.enemyVolley(e);this.event('wave','에리히 뢰벤하르트 · 수직 상승 사격');return true}
 if(id==='mccudden'){e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.28);this.burst(e.x,e.y,'#9fe6bd',18);this.enemyVolley(e);this.event('wave','제임스 맥커든 · 현장 수리');return true}
 if(id==='nungesser'){e.aceInvuln124=NEW_ACE_BALANCE124.nungesserInvulnerability;this.burst(e.x,e.y,'#1d1822',24);this.enemyVolley(e);this.event('wave','샤를 너겐서 · 불사조의 집념');return true}
 return _newAceAttack124.call(this,e);
};
const _newAceTick124=Game.prototype.tickRevisionWorld;
Game.prototype.tickRevisionWorld=function(dt){
 _newAceTick124.call(this,dt);const players=this.players||[this];
 for(const e of this.enemies||[]){e.aceInvuln124=Math.max(0,(e.aceInvuln124||0)-dt);const barrage=e.fonckBarrage;if(!barrage||barrage.time<=0)continue;barrage.time-=dt;barrage.shot-=dt;
  while(barrage.time>0&&barrage.shot<=0){barrage.shot+=NEW_ACE_BALANCE124.fonckBarrageInterval;const target=this.enemyCombatTarget(e),lead=.26,tx=target.x+Math.cos(target.a||0)*(target.baseSpeed||target.speed||0)*lead,ty=target.y+Math.sin(target.a||0)*(target.baseSpeed||target.speed||0)*lead,aim=Math.atan2(ty-e.y,tx-e.x),elapsed=NEW_ACE_BALANCE124.fonckBarrageDuration-barrage.time,phase=elapsed<1.25?0:elapsed<2.55?1:2;
   const offsets=this.t<180?(phase===0?[-.34,0,.34]:phase===1?[-.52,-.17,.17,.52]:[-.3,0,.3]):phase===0?[-.34,-.17,0,.17,.34]:phase===1?[-.52,-.31,-.1,.1,.31,.52]:[-.3,-.2,-.1,0,.1,.2,.3],speed=phase===1?245:phase===2?300:265,damage=Math.round((phase===2?12:10)*(1+(this.t||0)/360)*(e.aceDamageMultiplier||1));
   for(let i=0;i<offsets.length;i++){const a=aim+offsets[i]+(phase===1?(barrage.volley%2?.055:-.055):0),homing=phase===2&&i===Math.floor(offsets.length/2)&&barrage.volley%2===0;this.bullets.push({x:e.x+Math.cos(a)*(e.muzzleOffset??ENEMY_MOVEMENT_BALANCE.aceMuzzleOffset),y:e.y+Math.sin(a)*(e.muzzleOffset??ENEMY_MOVEMENT_BALANCE.aceMuzzleOffset),vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:3.25,enemy:true,heavy:true,visualType:'boss',aceSpecial:true,damage,targetPlayerId:target.id,fonckBossRound:true,fonckHoming:homing})}
   e.muzzleFlash=.15;barrage.volley++;
  }
 }
 for(const b of this.bullets||[])if(b.enemy&&b.fonckHoming&&b.life>0){const target=players.find(p=>p.id===b.targetPlayerId&&p.hp>0)||players.find(p=>p.hp>0);if(!target)continue;const current=Math.atan2(b.vy,b.vx),desired=Math.atan2(target.y-b.y,target.x-b.x),turn=Math.max(-.65*dt,Math.min(.65*dt,angleDiff(desired,current))),a=current+turn,speed=Math.hypot(b.vx,b.vy);b.vx=Math.cos(a)*speed;b.vy=Math.sin(a)*speed}
};

// Display names are pilot-aware; preserve the shared airframe key and its handling.
PLANES.fokker.name='Fokker Dr.I';
export function pilotAircraftName(pilot,plane){
 return pilot==='voss'&&plane==='fokker'?'Fokker F.I':PLANES[plane]?.name||plane;
}

installAugmentationOverhaul(Game,PLANES,PILOTS,UPGRADES,LEGENDARIES,TAILING_BALANCE,angleDiff,DURABILITY_BALANCE,AUGMENT_BALANCE,LEGENDARY_BALANCE,COW37_BALANCE,LEGENDARY_DEFENSE_BALANCE);

// Apply one final cruise/turn guard after the older time, pressure and loop layers.
// Signature attacks retain their short dash timer and immediately return to capped cruise.
const _boundedEnemySpawn163=Game.prototype.spawnEnemy;
Game.prototype.spawnEnemy=function(type,...args){const e=_boundedEnemySpawn163.call(this,type,...args);return applyEnemyMovementLimits(this,e)};
const _boundedEnemySteering163=Game.prototype.dogfightSteering;
Game.prototype.dogfightSteering=function(e,contact,dt,baseTurn){const result=_boundedEnemySteering163.call(this,e,contact,dt,baseTurn);if(e?.bossPilot)result.turn=Math.min(result.turn*(e.aceTurnMultiplier||1),ENEMY_MOVEMENT_BALANCE.aceTurnCap);return result};

// Gameplay 2.0: install shared player/enemy/ally airframe personalities last,
// after every legacy balance layer has registered its aircraft and steering hooks.
installAircraftPersonality(Game,PLANES,angleDiff);
// Install committed fighter passes after every legacy and personality steering layer.
installDogfightPass(Game,angleDiff);
// Tail pressure can interrupt a pass; pursuit easing never changes position or heading directly.
installDogfightDefense(Game,TAILING_BALANCE,AUGMENTATION_OVERHAUL_BALANCE,DOGFIGHT_PASS_STATES,angleDiff);
// Enemy fighters share the same turn-loss and straight-flight recovery model.
installEnergyCombat(Game);
// Compose bounded combat scenes after every legacy spawn and difficulty override.
installBattleDirector(Game,{passStates:DOGFIGHT_PASS_STATES,directorAircraftEligible});
// Offer optional risk/reward objectives only inside safe Director recovery beats.
installBattlefieldEvents(Game);
// Rival state is outermost so escape/return observes the final ace and tail systems.
installRivalAce(Game,{PILOTS,PLANES,attachAircraftPersonality,angleDiff});

// Aces added in pass 2026: Rickenbacker, Ball, Barker, Luke (Entente) and
// Brumowski, Gontermann (Central), each on a dedicated painted livery.
// PLANES/WEAPONS clones live at the end of campaign.js — its snipe/nieuport28
// entries are created there, after this module evaluates.
const ACES1918={rickenbacker_spad:'spad',ball_se5a:'se5a',barker_snipe:'snipe',luke_nieuport28:'nieuport28',brumowski_albatros:'albatros',gontermann_fokker:'fokker'};
const ACES1918_NAMES={rickenbacker_spad:'SPAD XIII · 리켄바커',ball_se5a:'S.E.5a · 앨버트 볼',barker_snipe:'숍위드 스나이프 · 바커',luke_nieuport28:'니외포르 28 · 프랭크 루크',brumowski_albatros:'알바트로스 D.III · 브루모프스키',gontermann_fokker:'포커 Dr.I · 곤터만'};
Object.assign(PILOTS,{
 rickenbacker:{name:'에디 리켄바커',alias:'HAT IN THE RING',faction:'entente',portrait:21,passive:'일대칠의 배짱',passiveDesc:'반경 700px 내 적 1기당 기관총 공격력 +6% (최대 +30%). 포위될수록 강해집니다.',skill:'햇 인 더 링 록온',desc:'4초간 사격할 때마다 반경 780px 내 각 적에게 자동 조준되는 관통탄을 추가 발사합니다. 최대 7개 표적.',cooldown:17},
 ball:{name:'앨버트 볼',alias:'LONE HAWK OF THE RFC',faction:'entente',portrait:22,passive:'고독한 사냥꾼',passiveDesc:'반경 320px 내에 아군·윙맨이 없으면 기관총 공격력 +15%.',skill:'구름 속의 매',desc:'1.5초간 구름에 은닉 — 적들이 사라진 지점의 잔상을 헛조준합니다. 재등장 후 2초간 공격력 ×2.2.',cooldown:16},
 barker:{name:'빌리 바커',alias:'THE LAST STAND',faction:'entente',portrait:23,passive:'불굴의 각성',passiveDesc:'피격될 때마다 3초간 기관총 공격력 +13%, 최대 3중첩.',skill:'새니에트의 기적',desc:'6초간 사망 불가 — 어떤 피해도 체력을 1 아래로 떨어뜨리지 못합니다. 각성 중첩 상한이 5로 늘어납니다.',cooldown:24},
 luke:{name:'프랭크 루크',alias:'THE ARIZONA BALLOON BUSTER',faction:'entente',portrait:24,passive:'기구 사냥꾼',passiveDesc:'기구·폭격기·에이스급 대형 표적 피해 +20%.',skill:'소이탄 연쇄 폭파',desc:'6초간 대형 표적 적중 시 그 자리에서 폭발이 일어나 반경 110px 내 다른 적들에게도 피해를 입힙니다.',cooldown:18},
 brumowski:{name:'고트빈 브루모프스키',alias:'THE RED HAWK OF AUSTRIA',faction:'central',portrait:25,passive:'붉은 편대장',passiveDesc:'출격 중인 아군·윙맨 1기당 기관총 공격력 +8% (최대 +24%).',skill:'붉은 비행대의 진',desc:'붉은 알바트로스 호위 2기를 소집해 15초간 자신 주위를 러프버리 선회하며 접근하는 적을 제압합니다.',cooldown:20},
 gontermann:{name:'하인리히 곤터만',alias:'THE NIGHTMARE OF THE FRONT',faction:'central',portrait:26,passive:'기구 학살자',passiveDesc:'기구·폭격기·에이스급 대형 표적 피해 +15%.',skill:'불꽃의 급강하',desc:'5초간 전탄이 소이탄이 됩니다 — 적중한 적은 3초간 화상 피해를 받고, 대형 표적에는 즉발 폭발 피해 +50%.',cooldown:18}
});
const ACES1918_IDS=Object.keys(ACES1918).map(k=>k.split('_')[0]);
const ACES1918_BIG=e=>e&&(e.type==='zeppelin'||e.type==='bomber'||e.type==='boss'||e.heavyBomber||e.bossPilot||e.balloon||e.fieldUnit==='balloon');
const _aces1918Skill=Game.prototype.skill;
Game.prototype.skill=function(){
 if(!ACES1918_IDS.includes(this.pilot))return _aces1918Skill.call(this);
 this.ensureRevisionPilot();if(this.state!=='playing'||this.hp<=0||this.cooldown>0)return false;this.cooldown=this.skillCooldown();this.skillTime=this.skillDuration();
 if(this.pilot==='ball'){const eh=this.skillEnhanced?1.35:1;this.ballCloak=1.5*eh;this.ballGhost={x:this.x,y:this.y,a:this.a,speed:this.speed,hp:1};this.invuln=Math.max(this.invuln,1.6*eh);this.ballAmbush=0;this.burst(this.x,this.y,'#e8ecdf',24)}
 else if(this.pilot==='gontermann')this.invuln=Math.max(this.invuln,.6*(this.skillEnhanced?1.35:1));
 else if(this.pilot==='brumowski'){const world=typeof this.combatWorld==='function'?this.combatWorld():this;const list=world&&world.allies;const live=list?list.filter(a=>a.orbit&&a.life>0):[];for(let i=live.length;i<2;i++){if(typeof this.spawnAlly==='function'){this.spawnAlly();Object.assign(this.allies.at(-1),{plane:'brumowski_albatros',life:15*(this.skillEnhanced?1.35:1),orbit:true})}else if(list)list.push({slot:list.length+i,x:(this.x||0)-45,y:(this.y||0)+(i?70:-70),a:this.a||0,life:15*(this.skillEnhanced?1.35:1),fire:.35,plane:'brumowski_albatros',ownerId:this.id||'p1',orbit:true})}}
 this.event('skill',PILOTS[this.pilot].skill);return true;
};
const _aces1918Duration=Game.prototype.skillDuration;
Game.prototype.skillDuration=function(){const d=({rickenbacker:4,ball:1.5,barker:6,luke:6,gontermann:5,brumowski:4})[this.pilot];return d===undefined?_aces1918Duration.call(this):d*(this.skillEnhanced?1.35:1)};
const _aces1918Gun=Game.prototype.normalGunMultiplier;
Game.prototype.normalGunMultiplier=function(){let m=_aces1918Gun.call(this);
 if(this.pilot==='rickenbacker'){let n=0;for(const e of this.enemies)if(e.hp>0&&!e.surface&&Math.hypot(e.x-this.x,e.y-this.y)<700)n++;m*=1+Math.min(5,n)*.06}
 else if(this.pilot==='ball'){if(this.ballAmbush>0)m*=2.2;else{const world=typeof this.combatWorld==='function'?this.combatWorld():this;const alone=!(world.allies||[]).some(a=>a.life>0&&Math.hypot(a.x-this.x,a.y-this.y)<320)&&!(this.players||[]).some(p=>p!==this&&Math.hypot((p.x||0)-this.x,(p.y||0)-this.y)<320);if(alone)m*=1.15}}
 else if(this.pilot==='barker')m*=1+(this.barkerStacks||0)*.13;
 else if(this.pilot==='brumowski'){const world=typeof this.combatWorld==='function'?this.combatWorld():this;const n=(world.allies||[]).filter(a=>a.life>0).length;m*=1+Math.min(3,n)*.08}
 return m};
const _aces1918Round=Game.prototype.roundDamageMultiplier;
Game.prototype.roundDamageMultiplier=function(b,e){let m=_aces1918Round.call(this,b,e);const big=ACES1918_BIG(e);if(this.pilot==='luke'&&big)m*=1.2;else if(this.pilot==='gontermann'&&big){m*=1.15;if(b.burn)m*=1.5}return m};
const _aces1918Hit=Game.prototype.hit;
Game.prototype.hit=function(n){if(this.pilot==='barker'&&this.invuln<=0&&n>0){this.barkerStacks=Math.min(this.skillTime>0?5:3,(this.barkerStacks||0)+1);this.barkerStackTime=3;if(this.skillTime>0)n=Math.min(n,Math.max(0,this.hp-1))}_aces1918Hit.call(this,n)};
const _aces1918Contact=Game.prototype.enemyCombatTarget;
// Trash-mob pressure pauses while an ace duel event or a stage boss runs,
// so single-combat challenges stay single.
Game.prototype.mobSpawnsSuppressed=function(){
 const ev=this.battlefieldEvents?.current;
 if(ev?.status==='active'&&ev.type==='ACE_CHALLENGE')return true;
 if(this.stageBoss?.stages?.phase==='boss')return true;
 if(this.enemies?.some(e=>e.hp>0&&e.bossPilot&&!e.expired&&!e.rivalEscaped))return true;
 return false;
};
Game.prototype.enemyCombatTarget=function(e){const c=_aces1918Contact.call(this,e);if(this.pilot==='ball'&&this.ballCloak>0&&c===this&&this.ballGhost)return this.ballGhost;return c};
const _aces1918Impact=Game.prototype.specialRoundImpact;
Game.prototype.specialRoundImpact=function(b,e){_aces1918Impact.call(this,b,e);
 if(b.burn&&e.hp>0){e.burnTime=3;e.burnDps=Math.max(e.burnDps||0,b.damage*.32)}
 if(this.pilot==='luke'&&this.skillTime>0&&ACES1918_BIG(e))this.queueExplosionDamage(b.x,b.y,110,b.damage*.6,{exclude:e})};
const _aces1918Update=Game.prototype.update;
Game.prototype.update=function(dt,input={}){const before=this.bullets.length;_aces1918Update.call(this,dt,input);const step=Math.min(.04,Math.max(0,dt));
 if(this.pilot==='gontermann'&&this.skillTime>0)for(const b of this.bullets.slice(before)){if(b.enemy||b.ally||b.formation||b.patrol)continue;b.burn=3;b.specialColor='#ff9a3c'}
 if(this.pilot==='barker'){if(this.barkerStackTime>0){this.barkerStackTime-=step;if(this.barkerStackTime<=0)this.barkerStacks=0}}
 if(this.pilot==='ball'){if(this.ballCloak>0){this.ballCloak-=step;const g=this.ballGhost;if(g){g.x+=Math.cos(g.a)*g.speed*step;g.y+=Math.sin(g.a)*g.speed*step}this.invuln=Math.max(this.invuln,step+.02);this._ballPuff=(this._ballPuff||0)-step;if(this._ballPuff<=0){this._ballPuff=.09;this.smoke(this.x+(this.rng()-.5)*40,this.y+(this.rng()-.5)*40,false)}if(this.ballCloak<=0){this.ballAmbush=2;this.burst(this.x,this.y,'#f4f0dc',18)}}else if(this.ballAmbush>0)this.ballAmbush-=step}
 if(this.pilot==='rickenbacker'&&this.skillTime>0){if(this._rickFired===undefined)this._rickFired=this.roundsFired;else if(this.roundsFired>this._rickFired){this._rickFired=this.roundsFired;let n=0;for(const e of this.enemies){if(n>=7)break;if(e.hp<=0||e.surface||Math.hypot(e.x-this.x,e.y-this.y)>780)continue;const a=Math.atan2(e.y-this.y,e.x-this.x);this.bullets.push({x:this.x+Math.cos(a)*24,y:this.y+Math.sin(a)*24,vx:Math.cos(a)*580,vy:Math.sin(a)*580,life:1.5,enemy:false,ownerId:this.id,damage:this.damage*.85,pierce:true,specialColor:'#cfe4ff',hit:new Set(),formation:true});n++}}}
 if(this.pilot==='brumowski'){const world=typeof this.combatWorld==='function'?this.combatWorld():this;for(const a of world.allies||[])if(a.orbit&&a.life>0){const ang=(this.t||0)*1.5+(a.slot||0)*Math.PI,tx=(this.x||0)+Math.cos(ang)*115,ty=(this.y||0)+Math.sin(ang)*115;a.x+=(tx-a.x)*Math.min(1,step*6);a.y+=(ty-a.y)*Math.min(1,step*6);a.a=ang+Math.PI/2}}
 for(const e of this.enemies){if(e.burnTime>0){e.burnTime-=step;e.hp-=e.burnDps*step;this._burnFx=(this._burnFx||0)-step;if(this._burnFx<=0){this._burnFx=.13;this.smoke(e.x,e.y,false);this.burst(e.x,e.y,'#ff9a3c',3)}if(e.hp<=0&&!e.burnCounted){e.burnCounted=true;this.kills++;if(e.bossPilot||e.type==='boss'||e.type==='zeppelin'||e.type==='bomber')this.priorityKills=(this.priorityKills||0)+1;if(e.type==='zeppelin'&&this.wreckGust)this.wreckGust(e);this.burst(e.x,e.y,'#f2aa52',30);this.event('kill',e.fieldUnit==='balloon'?'balloon':'');{const big=e.bossPilot||e.type==='boss';if(big)for(let gi=0;gi<5;gi++)this.drops.push({x:e.x+Math.cos(gi*1.26)*44,y:e.y+Math.sin(gi*1.26)*44,value:14,heal:false});this.drops.push({x:e.x,y:e.y,value:big?30:e.heavyBomber?16:e.type==='bomber'?3:(e.xpValue||1),heal:big||this.rng()<.1})}}}else e.burnDps=0}};
const _aces1918AceAttack=Game.prototype.aceAttack;
Game.prototype.aceAttack=function(e){
 if(e.bossPilot==='brumowski'){const live=this.enemies.filter(x=>x.hp>0&&x.escortPlane==='brumowski_albatros').length;for(let i=live;i<2&&this.enemies.length<60;i++){const wing=this.spawnEnemy('hunter');if(!wing)break;wing.x=e.x+(i?70:-70);wing.y=e.y+40;wing.hp=wing.maxHp=80*(1+this.t/180);wing.escortPlane='brumowski_albatros';attachAircraftPersonality(PLANES,wing,wing.escortPlane,{retuneCruise:true});wing.fire=.3}}
 else if(e.bossPilot==='rickenbacker'){const aim=Math.atan2(this.y-e.y,this.x-e.x);for(let i=-1;i<=1;i++)this.bullets.push({x:e.x,y:e.y,vx:Math.cos(aim+i*.11)*330,vy:Math.sin(aim+i*.11)*330,life:2,enemy:true,visualType:'boss',aceSpecial:true,damage:16*(e.aceDamageMultiplier||1)})}
 _aces1918AceAttack.call(this,e)};
const _aces1918Reload=Game.prototype.reload;
Game.prototype.reload=function(){const r=_aces1918Reload.call(this);if(r&&this.pilot==='gontermann')this.reloadTime*=.88;return r};

// ── Richthofen Dr.I rework — 사냥 본능 passive + Dreidecker active ──
export const RICHTHOFEN_DRI_BALANCE=Object.freeze({
 stackInterval:.8,resetAfter:2.2,tierDamage:[1,1.15,1.3,1.45],
 killBoostTime:4,killBoostSpeed:1.2,chaseTime:1.2,chaseSpeed:1.3,
 dreideckerSpeed:.75,dreideckerTurn:1.6,dreideckerDrag:.3,
 ghostInterval:.15,ghostLife:.3,ghostMax:3,designateTime:.35,
});
Game.prototype.isDreideckerPilot=function(){return this.pilot==='baron'&&!this.isRedHunter()};
Game.prototype.huntTargetAlive=function(t){
 if(!t)return false;
 if(this.huntTargetElite)return !!(this.eliteEnemies?.members||[]).includes(t);
 return !!(t.hp>0&&!t.crashed&&!t.rivalEscaped&&(this.enemies||[]).includes(t));
};
Game.prototype.huntTier=function(){return this.huntEngaged?Math.min(3,1+Math.floor((this.huntEngage||0)/RICHTHOFEN_DRI_BALANCE.stackInterval)):0};
Game.prototype.pickHuntTarget=function(){
 const inert=e=>e.stageBossBody||e.bossMinion||e.surface||e.fieldUnit||e.navalVessel||e.missionGround||e.groundEscort||e.stationary||e.rivalEscaped;
 const valid=e=>e&&e.hp>0&&!e.crashed&&!inert(e);
 const es=(this.enemies||[]).filter(valid);
 const dist=(a,b)=>Math.hypot(a.x-this.x,a.y-this.y)-Math.hypot(b.x-this.x,b.y-this.y);
 const ace=es.filter(e=>e.bossPilot).sort(dist)[0];if(ace)return{target:ace,elite:false};
 const elite=(this.eliteEnemies?.members||[]).filter(m=>m.alive).sort(dist)[0];if(elite)return{target:elite,elite:true};
 const heavy=es.filter(e=>e.heavyBomber).sort(dist)[0];if(heavy)return{target:heavy,elite:false};
 const bomber=es.filter(e=>e.type==='bomber').sort(dist)[0];if(bomber)return{target:bomber,elite:false};
 return null;
};
Game.prototype.patchEliteHuntDamage=function(){
 const es=this.eliteEnemies;if(!es||es._driPatched)return;es._driPatched=true;
 const damage=es.damageMember.bind(es),g=this;
 es.damageMember=(m,d,s={})=>{if(g.huntTarget===m&&g.huntTargetElite){g.huntEngaged=true;g.huntLastHit=g.t;d*=RICHTHOFEN_DRI_BALANCE.tierDamage[g.huntTier()]}const was=m.alive;const r=damage(m,d,s);if(was&&!m.alive)m._huntCredit=true;return r};
};
const _driRoundMult=Game.prototype.roundDamageMultiplier;
Game.prototype.roundDamageMultiplier=function(b,e){let mult=_driRoundMult.call(this,b,e);
 if(e&&e===this.huntTarget&&!this.huntTargetElite){this.huntEngaged=true;this.huntLastHit=this.t;const tier=this.huntTier();mult*=RICHTHOFEN_DRI_BALANCE.tierDamage[tier];
  if(tier>=2)this.burst(b.x??e.x,b.y??e.y,tier>=3?'#7d1a1a':'#4d1010',tier>=3?7:4);
 }return mult};
const _driTail=Game.prototype.updateTailLock;
Game.prototype.updateTailLock=function(dt){const was=this.tailLocked;_driTail.call(this,dt);
 if(this.dreideckerActive&&!was&&this.tailLocked){this.skillTime=0;this.dreideckerActive=false;this.dreideckerChase=RICHTHOFEN_DRI_BALANCE.chaseTime;const g=this.dreideckerGhosts?.at(-1);if(g){g.stretch=true;g.life=g.maxLife=.42}this.event('wave','후방 확보 · 추격 가속')}};
const _driBeginFrame=Game.prototype.beginRevisionFrame;
Game.prototype.beginRevisionFrame=function(dt,input={}){
 const prior=_driBeginFrame.call(this,dt,input);
 const dri=this.isDreideckerPilot();
 this.dreideckerActive=dri&&this.skillTime>0;
 if(dri){
  const t=this.huntTarget;
  if(t&&!this.huntTargetAlive(t)){
   if(t._huntCredit){this.huntBoost=RICHTHOFEN_DRI_BALANCE.killBoostTime;this.huntGhost={x:this.x,y:this.y,a:this.a,life:.32,maxLife:.32};
    for(let i=0;i<4;i++)(this.huntStreaks??=[]).push({x:this.x,y:this.y,a:this.a,life:.3+.04*i,maxLife:.3+.04*i,off:i});
   }
   this.huntTarget=null;this.huntTargetElite=false;this.huntEngaged=false;this.huntEngage=0;this.huntLastHit=0;
  }
  if(!this.huntTarget){const pick=this.pickHuntTarget();if(pick){this.huntTarget=pick.target;this.huntTargetElite=pick.elite;this.huntEngaged=false;this.huntEngage=0;this.huntLastHit=0;this.huntDesignate=RICHTHOFEN_DRI_BALANCE.designateTime}}
  if(this.huntTarget){
   if(this.huntEngaged&&(this.t-(this.huntLastHit??0))>RICHTHOFEN_DRI_BALANCE.resetAfter){this.huntEngaged=false;this.huntEngage=0}
   if(this.huntEngaged)this.huntEngage+=dt;
   if(this.huntTargetElite)this.patchEliteHuntDamage();
  }
  this.huntBoost=Math.max(0,(this.huntBoost||0)-dt);this.dreideckerChase=Math.max(0,(this.dreideckerChase||0)-dt);
  this.huntDesignate=Math.max(0,(this.huntDesignate||0)-dt);
  if(this.huntGhost&&(this.huntGhost.life-=dt)<=0)this.huntGhost=null;
  const chase=this.dreideckerChase>0;
  const speedMult=chase?RICHTHOFEN_DRI_BALANCE.chaseSpeed:this.dreideckerActive?RICHTHOFEN_DRI_BALANCE.dreideckerSpeed:this.huntBoost>0?RICHTHOFEN_DRI_BALANCE.killBoostSpeed:1;
  if(speedMult!==1){this.baseSpeed=(this.baseSpeed||this.speed)*speedMult;this.speed*=speedMult}
  if(this.dreideckerActive)this.turn*=RICHTHOFEN_DRI_BALANCE.dreideckerTurn;
  const turnRate=dt>0?Math.abs(angleDiff(this.a,this._driPrevA??this.a))/dt:0;this._driPrevA=this.a;this._driTurnRate=turnRate;
  if(this.dreideckerActive){
   this._driGhostClock=(this._driGhostClock||0)+dt;
   while(this._driGhostClock>=RICHTHOFEN_DRI_BALANCE.ghostInterval){this._driGhostClock-=RICHTHOFEN_DRI_BALANCE.ghostInterval;(this.dreideckerGhosts??=[]).push({x:this.x,y:this.y,a:this.a,life:RICHTHOFEN_DRI_BALANCE.ghostLife,maxLife:RICHTHOFEN_DRI_BALANCE.ghostLife,turn:Math.min(1,turnRate/3)});while(this.dreideckerGhosts.length>RICHTHOFEN_DRI_BALANCE.ghostMax)this.dreideckerGhosts.shift()}
  }else this._driGhostClock=0;
  this.dreideckerGhosts=(this.dreideckerGhosts||[]).filter(g=>(g.life-=dt)>0);
  if(this.huntBoost>0&&turnRate<1.1){this._driStreakClock=(this._driStreakClock||0)+dt;if(this._driStreakClock>.09){this._driStreakClock=0;(this.huntStreaks??=[]).push({x:this.x,y:this.y,a:this.a,life:.28,maxLife:.28});if(this.huntStreaks.length>6)this.huntStreaks.shift()}}
  this.huntStreaks=(this.huntStreaks||[]).filter(s=>(s.life-=dt)>0);
 }
 return prior;
};

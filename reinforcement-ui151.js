// Categories: current 강화 and 특수장비(개편) sheets. Blank merged cells inherit the category above.
// Telescope category follows the user-requested machine-gun-only effect.
// Presentation only. Preview uses the existing upgrade implementation on a detached copy.
import {WWI_EQUIPMENT} from './wwi-equipment.js';
import {getLocale,upgradeName as i18nUpgradeName} from './i18n.js?v=buildfit1&afc=1&art=pilot-recovery2';
import {AUGMENTATION_OVERHAUL_BALANCE} from './augmentation-overhaul150.js?v=airbattle4-20261025';
import {WEAPON_MODS,WEAPON_MOD_BY_ID,ORDNANCE_STAGGER_DELAY} from './weapon-modifications.js';
import {tacticalChoices} from './tactical-doctrines.js?v=tactics20261023';

export const CATEGORIES={"bomberTransfer":"폭탄","mgTransfer":"기관총","airshipTransfer":"편대","damage":"기관총","rate":"기관총","rockets":"로켓","mines":"수류탄","explosives":"폭발 피해","command":"편대","turn":"이동","armor":"내구도","regen":"내구도","cooldown":"액티브","bomber":"공통","wingman":"편대","mercedesEngine":"이동속도","spread":"기관총","combinedProjectiles":"로켓 · 수류탄","redScarf":"이동","prancingHorse":"이동 · 방어력","ironCross":"액티브","telescope":"기관총","flightGloves":"발사 · 투척 주기","amatolCharge":"폭발 피해","lufberyCircle":"편대 · 방어","fighterSupply":"편대","sparkPlug":"내구도","goeringBaton":"편대","immelmannManual":"이동","motorCannon":"특수기","loEmblem":"공통","sacredCowling":"이동","steelPlate":"내구도","mauserAceKiller":"특수기","boelckeDicta":"공통","rearGunner":"특수기","quadLewis":"기관총","cow37":"무기교체","rankinShell":"특수기","kaiserFog":"특수기","fogCompass":"특수기","maximBelt":"기관총"};
for(const e of WWI_EQUIPMENT)CATEGORIES[e.id]={GUN:'기관총',EXPLOSIVE:'폭탄',FORMATION:'편대'}[e.family];
for(const mod of WEAPON_MODS)CATEGORIES[mod.id]={GUN:'기관총',EXPLOSIVE:'로켓 · 수류탄',FORMATION:'편대',SPEED:'이동',SURVIVAL:'내구도'}[mod.family];
const EN_CATEGORY={기관총:'Machine Gun',로켓:'Rockets',수류탄:'Grenades','폭발 피해':'Explosive Damage',편대:'Formation',이동:'Flight',내구도:'Durability',액티브:'Active',공통:'General',이동속도:'Flight Speed','로켓 · 수류탄':'Rockets · Grenades','이동 · 방어력':'Flight · Defense','발사 · 투척 주기':'Fire · Deployment Cycle','편대 · 방어':'Formation · Defense',특수기:'Special Weapon',무기교체:'Weapon Replacement',탄약:'Ammunition',폭탄:'Bombs',회복:'Repair'};
const EN_LABEL={피해:'Damage',연사:'Fire Rate',탄띠:'Belt',재장전:'Reload',속도:'Speed',선회:'Turn',개조:'Modification','최대 체력':'Max Durability','초당 최대 체력':'Max Durability / sec','재사용 대기시간':'Cooldown','동시 발사':'Salvo Size','주기당 발사':'Rockets per Cycle','투척 개수':'Grenades per Deployment','투척 주기':'Deployment Cycle','시차 발사':'Release Delay'};
const label=value=>getLocale()==='en'?(EN_LABEL[value]||EN_CATEGORY[value]||value):value;
export function categoryName(id){return label(CATEGORIES[id]||'공통')}
export function reinforcementName(u,p,planes){if(u.id==='ironCross')return planes[p?.plane]?.faction==='entente'?'Victoria Cross':'Pour le Mérite';return i18nUpgradeName(u.id,u.name)}
export function reinforcementIconId(id){return WEAPON_MOD_BY_ID[id]?.icon||id}
// Choice cards show the decision; the engine and build popups retain full details.
const CHOICE_COPY={
 strutterAirbrake:['감속 선회 후 재가속. 기체 전환 장비와 동시 장착 불가.','Brake turn, then reaccelerate. Incompatible with airframe conversions.'],
 buckinghamBelt:['기관총 연속 명중으로 적 기체에 불을 붙입니다.','Repeated MG hits ignite enemy aircraft.'],
 cooperRack:['전방 적을 스쳐 지나며 소형 폭탄을 연속 투하합니다.','Drops a pair of light bombs when passing a forward target.'],
 fieryGrapnel:['스쳐 지나는 적기에 화염 갈고리를 걸어 불태웁니다.','Hooks and ignites an aircraft during a close flyby.'],
 flechettes:['전방 적에게 관통 화살탄을 연속 살포합니다. 중장갑에는 위력이 감소합니다.','Releases piercing darts in short bursts at forward enemies. Less effective against heavy armor.'],
 veryPistol:['신호탄으로 표적을 지정해 아군 편대의 집중 공격을 유도합니다.','Signals a forward target for your existing wingmen to focus on.'],
 hytheCamera:['연속 명중한 표적을 분석해 기관총 피해를 높이고 공격 준비를 드러냅니다.','Analyzes a repeatedly hit target, boosting MG damage and revealing its attack warnings.'],
 amatolCharge:['폭발 피해·반경 +40%. 폭발 격추 시 30% 파편 폭발 (연쇄 없음).','Blast damage/radius +40%. Explosive kills cause a 30% secondary blast; no chains.'],
 lufberyCircle:['편대기 수에 따라 받는 피해 −20~35%. 상호 엄호 대형.','Damage taken −20–35% by wing count. Mutual-cover formation.'],
 redScarf:['이동 속도 +45%. 후방 추적 거리 +25%, 포착 시간 −35%.','Speed +45%. Rear-pursuit range +25%, lock time −35%.'],
 prancingHorse:['이동 속도 +20%. 전방에서 받는 피해 −25%.','Speed +20%. Damage taken from the front −25%.'],
 ironCross:['파일럿 액티브 강화. 재사용 대기시간 −20%.','Stronger pilot Active. Cooldown −20%.'],
 telescope:['전방 표적 포착 시 0.8초간 기관총 조준 보정.','Corrects machine-gun aim for 0.8s after locking a forward target.'],
 flightGloves:['기관총·폭발물 발사 간격 −25%, 재장전 −35%. 보조장비·액티브 제외.','MG/ordnance firing interval −25%, reload −35%. Excludes auxiliaries and Actives.'],
 sparkPlug:['10초마다 최대 내구도의 20% 회복.','Restores 20% max durability every 10s.'],
 goeringBaton:['상시 편대기 +3. 편대기 피해 +25%.','Permanent wingmen +3. Wingman damage +25%.'],
 immelmannManual:['선회기동 대기시간 −50%. 기동 무적 1.05초.','Maneuver cooldown −50%. Invulnerable for 1.05s during maneuvers.'],
 motorCannon:['3초마다 37mm 관통탄 자동 발사. 피해 240, 폭발물 강화 적용.','Auto-fires a piercing 37mm shell every 3s: 240 damage, scaled by ordnance upgrades.'],
 loEmblem:['최대 내구도 −50%. 전 무장 피해 +50%, 편대 연사 +30%, 속도·선회 +25%.','Max durability −50%. All weapons +50% damage, wing fire rate +30%, speed/turn +25%.'],
 sacredCowling:['근거리 피해 +25%. 가까운 적의 탄환 피해 최대 −20%.','Close-range damage +25%. Nearby enemy bullet damage taken up to −20%.'],
 steelPlate:['소구경 탄환 피해 −30%. 이동 속도·선회력 −10%.','Small-caliber damage taken −30%. Speed/turn −10%.'],
 mauserAceKiller:['0.65초마다 자동 사격. 에이스 우선, 기관총·폭발물 피해 강화 적용.','Auto-fires every 0.65s, prioritizing aces. Scales with MG and ordnance damage.'],
 boelckeDicta:['경험치 +30%. 협동에서는 본인에게만 적용.','XP +30%. Owner only in co-op.'],
 rearGunner:['기관총을 후방까지 회전 조준. 완전 후방 조준 약 2.7초.','Rotating MG aim, reaching fully behind in about 2.7s.'],
 quadLewis:['총구별 기관총 탄환 +4. 일반 발사체 상한 무시.','MG rounds +4 per muzzle, beyond the normal projectile cap.'],
 cow37:['기관총을 37mm 포로 교체. 초당 1발·피해 280. 연사·추가탄 강화 제외.','Replaces MGs with a 37mm cannon: 1 shot/s, 280 damage. No fire-rate/extra-round upgrades.'],
 rankinShell:['3.2초마다 후방 적 탄환 제거. 파편 피해 32.','Clears enemy rounds behind you every 3.2s. Shrapnel damage: 32.'],
 grunkreuz:['독가스 면역. 후방 가스 분출 4.5초·충전 7초. 액티브 대기 감소 적용.','Gas immunity. Rear gas vent: 4.5s; recharge: 7s. Scales with Active cooldown.'],
 kaiserFog:['12초마다 3초간 연막 은폐. 적 추적 해제.','Smoke concealment for 3s every 12s. Breaks enemy tracking.'],
 fogCompass:['경험치·수리 아이템 획득 범위 크게 증가.','Greatly increases XP and repair pickup range.'],
 maximBelt:['기관총 피해 +25%p, 탄띠 +75%, 재장전 −35%.','MG damage +25pp, belt capacity +75%, reload −35%.'],
 urLeica:['출격 종료 시 최종 격추 기록 +10%.','Final kill record +10% at sortie end.'],
 badinGauge:['지속 이속 강화량의 150%만큼 기관총·폭발물 피해 증가 (최대 +60%).','MG/ordnance damage gains 150% of lasting speed bonuses, up to +60%.'],
 heineckeRettungsfallschirm:['치명 피해 시 예비기로 재출격. 출격당 2회·대기 180초.','Relaunch in a reserve aircraft after lethal damage. Twice per sortie; 180s cooldown.'],
 bomberTransfer:['중폭격기 전환·자동 폭격·후방 사수. 내구도↑, 속도·선회↓. 기동은 방어탄막으로 교체.','Heavy bomber: auto-bombs, rear gunner, more durability, less speed/turn. Defensive barrage replaces maneuver.'],
 mgTransfer:['중무장기 전환·기관총 2정 추가·화망 방어. 속도 −26%, 선회 −38%, 피탄 면적↑.','Gunship: +2 MGs, anti-bullet screen replaces maneuver. Speed −26%, turn −38%, larger target.'],
 airshipTransfer:['비행선 전환·호위기 2기·대공 방어망. 속도 −55%, 선회 −74%, 피탄 면적↑.','Airship: 2 escorts, AA screen replaces maneuver. Speed −55%, turn −74%, larger target.'],
 aceWingman:['아군 에이스 1명 합류. 주력 무장과 반대 계열로 엄호.','One allied ace joins, covering you with the opposite weapon family.'],
 fighterSupply:['상시 편대기 기종 개량. 피해 +20%, 발사 간격 −10%.','Upgrades permanent wingmen. Damage +20%, firing interval −10%.'],
 mercedesEngine:['기본 이동 속도 +15%. 직선 비행 시 최대 +45%, 급선회 시 감소.','Base speed +15%, rising to +45% in straight flight. Hard turns reduce output.'],
 spread:['기관총 발사체 +1 (최대 5). 추가 탄약 소모 없음.','MG projectiles +1, up to 5. No extra ammunition cost.'],
 combinedProjectiles:['로켓·수류탄을 0.24초 간격으로 나눠 발사. 총수 유지.','Splits rockets/grenades into two releases 0.24s apart. Same total count.'],
 gunPrecision:['고위력 3연속 점사 후 사격 공백. 단일 표적에 강하고 다방향 대응은 약함.','3 powerful bursts, then a firing gap. Strong vs one target; weak vs scattered enemies.'],
 gunSuppression:['넓은 탄도로 탄환 +1, 개별 위력 감소. 다수 제압에 유리.','Wider spread, +1 round, lower damage per hit. Suppresses groups.'],
 explosiveFocus:['로켓·수류탄 탄착 집중. 밀집 표적에 유리, 광역 대응 감소.','Tighter rocket/grenade patterns. Strong vs clusters; less area coverage.'],
 explosiveArea:['로켓·수류탄 탄착 분산. 광역 대응 증가, 집중 화력 감소.','Wider rocket/grenade patterns. More area coverage, less focused damage.'],
 wingStrike:['편대 동시 출격 후 복귀. 순간 화력↑, 출격 중 본체 엄호↓.','Wings strike together, then return. More burst damage, less cover during sorties.'],
 wingCover:['두 조가 공격·엄호 교대. 지속 방어↑, 동시 화력↓.','Two groups alternate attack and cover. More protection, less simultaneous fire.']
};
export function choiceDescription(id,description){
 const en=getLocale()==='en',copy=CHOICE_COPY[id];if(copy)return copy[en?1:0];
 // Keep live rarity values in ordinary upgrades rather than duplicating balance data.
 const first=cleanDescription(description).split(/\.\s+/)[0].replace(/[.]$/,'');
 if(en)return first;
 if(id==='armor')return first+' · 증가량 즉시 회복.';
 if(id==='rockets'||id==='mines')return cleanDescription(description).replace('르 프리외르 로켓 발사대','로켓').replace('실제 투척 수','투척 수');
 return first.replace(/\s*\((?:최소|누적 상한)[^)]*\)/g,'').replace('윙맨과 편대 액티브','편대').replace('공격 속도','연사').replace('로켓·수류탄·폭탄·37mm 포탄 등 모든 폭발물','모든 폭발물').replace('실제 투척 수','투척 수')+'.';
}
function modName(p,family){const mod=WEAPON_MODS.find(mod=>mod.family===family&&mod.value===p.weaponMods?.[family]);return mod?i18nUpgradeName(mod.id,mod.name):(getLocale()==='en'?'Unmodified':'미개조')}
const num=n=>Number(n.toFixed(1)),pct=n=>(n>=0?'+':'')+num(n*100)+'%';
export function grenadeIntervalForDisplay(p){
 const base=3.6/(1+Math.min(5,p.mineCount||0)*.3);
 return typeof p.ordnanceInterval==='function'?p.ordnanceInterval(base):base*(p.upgrades?.flightGloves?AUGMENTATION_OVERHAUL_BALANCE.glovesInterval:1);
}
export function buildStats(p){
 const b=p.buildBaseline||{rate:p.rate,maxHp:p.maxHp,speed:p.baseSpeed||p.speed,turn:p.turn};
 return {
  wingCount:[label('편대'),getLocale()==='en'?'Aircraft':'편대기',(Math.min(7,p.permanentWingman||0)+(p.weaponMods?.FORMATION==='reinforcement'?2:0))+(getLocale()==='en'?' aircraft':'기')],
  damage:[label('기관총'),label('피해'),pct(p.gunUpgradeBonus||0)],rate:[label('기관총'),label('연사'),pct(b.rate/p.rate-1)],
  belt:[label('탄약'),label('탄띠'),p.weapon.belt+(getLocale()==='en'?' rounds / gun':'발 (총당)')],reload:[label('탄약'),label('재장전'),num(p.weapon.reload)+(getLocale()==='en'?'s':'초')],
  explosives:[label('폭탄'),label('피해'),pct(p.explosiveBonus||0)],command:[label('편대'),label('피해'),pct(p.commandBonus||0)],commandRate:[label('편대'),label('연사'),pct(p.commandRateBonus||0)],
  speed:[label('이동속도'),label('속도'),pct((p.baseSpeed||p.speed)/b.speed-1)],turn:[label('이동속도'),label('선회'),pct(p.turn/b.turn-1)],
  armor:[label('내구도'),label('최대 체력'),(p.maxHp-b.maxHp>=0?'+':'')+num(p.maxHp-b.maxHp)+' HP'],regen:[label('회복'),label('초당 최대 체력'),pct(p.regen||0)],cooldown:[label('액티브'),label('재사용 대기시간'),pct(p.cooldownMult-1)],
  rockets:[label('로켓'),label('주기당 발사'),Math.min(5,p.rockets||0)+(getLocale()==='en'?' rounds':'발')],
  grenadeCount:[label('수류탄'),label('투척 개수'),Math.min(5,p.mineCount||0)+(getLocale()==='en'?' grenades':'개')],
  mines:[label('수류탄'),label('투척 주기'),p.mineCount?num(grenadeIntervalForDisplay(p))+(getLocale()==='en'?'s':'초'):(getLocale()==='en'?'Not equipped':'미장착')],
  staggerDelay:[label('로켓 · 수류탄'),label('시차 발사'),p.upgrades?.combinedProjectiles?ORDNANCE_STAGGER_DELAY+(getLocale()==='en'?'s · same total':'초 · 총량 유지'):(getLocale()==='en'?'Not equipped':'미장착')],
  gunMod:[label('기관총'),label('개조'),modName(p,'GUN')],explosiveMod:[label('로켓 · 수류탄'),label('개조'),modName(p,'EXPLOSIVE')],wingMod:[label('편대'),label('개조'),modName(p,'FORMATION')],speedMod:[label('이동'),label('개조'),modName(p,'SPEED')],survivalMod:[label('내구도'),label('개조'),modName(p,'SURVIVAL')]
 };
}
const fields={mgTransfer:['speed','turn'],airshipTransfer:['wingCount','command','commandRate','speed','turn'],bomberTransfer:['armor','speed','turn'],damage:['damage'],rate:['rate'],rockets:['rockets','explosives'],mines:['grenadeCount','mines','explosives'],explosives:['explosives'],command:['command','commandRate'],turn:['speed','turn'],armor:['armor'],regen:['regen'],cooldown:['cooldown'],combinedProjectiles:['staggerDelay']};
for(const mod of WEAPON_MODS)fields[mod.id]=[{GUN:'gunMod',EXPLOSIVE:'explosiveMod',FORMATION:'wingMod',SPEED:'speedMod',SURVIVAL:'survivalMod'}[mod.family]];
// Pause-screen popup: which totals of the current build each held upgrade feeds into.
const HELD={...fields,fighterSupply:['command','commandRate'],goeringBaton:['command'],mercedesEngine:['speed'],amatolCharge:['explosives'],redScarf:['speed'],prancingHorse:['speed'],ironCross:['cooldown'],flightGloves:['rate','reload'],loEmblem:['damage','armor','speed','turn'],steelPlate:['speed','turn'],maximBelt:['belt','reload'],cow37:['belt','reload']};
const idle=new Set(['+0%','+0 HP','미장착','Not equipped','0발','0 rounds','0개','0 grenades','미개조','Unmodified']);
const HELD_LABEL={wingCount:['편대기','Formation Aircraft'],damage:['기관총 피해','MG Damage'],rate:['기관총 연사','MG Fire Rate'],belt:['탄띠','Belt'],reload:['재장전','Reload'],explosives:['폭발물 피해','Explosive Damage'],command:['편대 피해','Formation Damage'],commandRate:['편대 연사','Formation Fire Rate'],speed:['이동 속도','Speed'],turn:['선회력','Turn'],armor:['최대 내구도','Max Durability'],regen:['초당 회복','Repair / sec'],cooldown:['액티브 재사용 대기','Active Cooldown'],rockets:['로켓 1주기 발사','Rockets per Cycle'],grenadeCount:['수류탄 1주기 투척','Grenades per Cycle'],mines:['수류탄 투척 주기','Grenade Cycle'],staggerDelay:['2차 투사 간격','Second Release Delay'],gunMod:['기관총 개조','Machine-Gun Modification'],explosiveMod:['폭발물 개조','Explosive Modification'],wingMod:['편대기 개조','Formation Modification']};
export function heldStats(p,id){const s=buildStats(p),en=getLocale()==='en';return (HELD[id]||[]).filter(k=>s[k]&&!idle.has(s[k][2])).map(k=>({key:k,name:HELD_LABEL[k]?.[en?1:0]||s[k][1],value:s[k][2]}))}
export function cumulativeText(p,id,rarity){
 if(!fields[id])return '';
 // A doctrine preview is a read-only comparison. It must never pretend to
 // acquire a unique reinforcement, consume a choice, or execute combat hooks.
 const doctrine=WEAPON_MOD_BY_ID[id];
 if(doctrine){const before=buildStats(p),current=getLocale()==='en'?' current ':' 현재 ',available=tacticalChoices(p)?.choices.includes(id),name=i18nUpgradeName(id,doctrine.name);return fields[id].map(key=>before[key][1]+current+before[key][2]+(available&&before[key][2]!==name?' → '+name:'')).join('\n')}
 const copy=Object.assign(Object.create(Object.getPrototypeOf(p)),p,{state:'upgrade',upgrades:{...p.upgrades},upgradeRarities:{...p.upgradeRarities},weaponMods:{...p.weaponMods},weaponModSelections:{...p.weaponModSelections},weapon:{...p.weapon},ammo:[...p.ammo],events:[],event(){},checkLevel(){}});
 if(p.bomberTransfer)copy.bomberTransfer={...p.bomberTransfer,stations:p.bomberTransfer.stations?.map(station=>({...station}))};
 const current=getLocale()==='en'?' current ':' 현재 ';
 const before=buildStats(p);if(!copy.upgrade(id,rarity))return fields[id].map(k=>before[k][1]+current+before[k][2]).join('\n');
 const after=buildStats(copy);return fields[id].filter(k=>before[k][2]!==after[k][2]).map(k=>before[k][1]+current+before[k][2]+' → '+after[k][2]).join('\n');
}
export function cleanDescription(text){return text.replace(/(?:한\s*)?출격(?:당)?\s*(?:1회|한\s*번)[^.。]*(?:[.。]|$)/g,'').replace(/1회 획득 가능[.]?/g,'').trim()}


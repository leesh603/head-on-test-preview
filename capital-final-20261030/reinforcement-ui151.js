import {RARE_SPECIALIZATIONS} from './rare-specializations.js';
// Categories: current 강화 and 특수장비(개편) sheets. Blank merged cells inherit the category above.
// Telescope category follows the user-requested machine-gun-only effect.
// Presentation only. Preview uses the existing upgrade implementation on a detached copy.
import {WWI_EQUIPMENT} from './wwi-equipment.js';
import {getLocale,upgradeName as i18nUpgradeName} from './i18n.js?v=capital-final-20261030&afc=1&art=pilot-recovery2';
import {AUGMENTATION_OVERHAUL_BALANCE} from './augmentation-overhaul150.js?v=capital-final-20261030&airbattle=20261025';
import {WEAPON_MODS,WEAPON_MOD_BY_ID,ORDNANCE_STAGGER_DELAY} from './weapon-modifications.js';
import {tacticalChoices} from './tactical-doctrines.js?v=capital-final-20261030&td4=20261026';

export const CATEGORIES={"bomberTransfer":"폭탄","mgTransfer":"기관총","airshipTransfer":"편대","damage":"기관총","rate":"기관총","rockets":"로켓","mines":"수류탄","explosives":"폭발 피해","command":"편대","turn":"이동","armor":"내구도","regen":"내구도","cooldown":"액티브","bomber":"공통","wingman":"편대","mercedesEngine":"이동속도","spread":"기관총","combinedProjectiles":"로켓 · 수류탄","redScarf":"이동","prancingHorse":"이동 · 방어력","ironCross":"액티브","telescope":"기관총","flightGloves":"주무장 · 기동","amatolCharge":"폭발 피해","lufberyCircle":"편대 · 방어","fighterSupply":"편대","sparkPlug":"내구도","goeringBaton":"편대","immelmannManual":"이동","motorCannon":"특수기","loEmblem":"공통","sacredCowling":"이동","steelPlate":"내구도","mauserAceKiller":"특수기","boelckeDicta":"공통","rearGunner":"특수기","quadLewis":"기관총","cow37":"무기교체","rankinShell":"특수기","kaiserFog":"특수기","fogCompass":"특수기","maximBelt":"기관총"};
for(const e of [...WWI_EQUIPMENT,...RARE_SPECIALIZATIONS])CATEGORIES[e.id]={GUN:'기관총',EXPLOSIVE:'폭탄',FORMATION:'편대',SPEED:'이동',SURVIVAL:'내구도'}[e.family];
for(const mod of WEAPON_MODS)CATEGORIES[mod.id]={GUN:'기관총',EXPLOSIVE:'로켓 · 수류탄',FORMATION:'편대',SPEED:'이동',SURVIVAL:'내구도'}[mod.family];
const EN_CATEGORY={기관총:'Machine Gun',로켓:'Rockets',수류탄:'Grenades','폭발 피해':'Explosive Damage',편대:'Formation',이동:'Flight',내구도:'Durability',액티브:'Active',공통:'General',이동속도:'Flight Speed','로켓 · 수류탄':'Rockets · Grenades','이동 · 방어력':'Flight · Defense','발사 · 투척 주기':'Fire · Deployment Cycle','주무장 · 기동':'Primary · Maneuver','편대 · 방어':'Formation · Defense',특수기:'Special Weapon',무기교체:'Weapon Replacement',탄약:'Ammunition',폭탄:'Bombs',회복:'Repair'};
const EN_LABEL={피해:'Damage',연사:'Fire Rate','발사 간격':'Firing Interval',탄띠:'Belt',재장전:'Reload',속도:'Speed',선회:'Turn',개조:'Modification','최대 체력':'Max Durability','초당 최대 체력':'Max Durability / sec','재사용 대기시간':'Cooldown','동시 발사':'Salvo Size','주기당 발사':'Rockets per Cycle','투척 개수':'Grenades per Deployment','투척 주기':'Deployment Cycle','시차 발사':'Release Delay'};
const label=value=>getLocale()==='en'?(EN_LABEL[value]||EN_CATEGORY[value]||value):value;
export function categoryName(id){return label(CATEGORIES[id]||'공통')}
export function reinforcementName(u,p,planes){if(u.id==='ironCross')return planes[p?.plane]?.faction==='entente'?'Victoria Cross':'Pour le Mérite';return i18nUpgradeName(u.id,u.name)}
export function reinforcementIconId(id){return WEAPON_MOD_BY_ID[id]?.icon||id}
// Choice cards show the decision; the engine and build popups retain full details.
const CHOICE_COPY={
 wimperisSight:['폭격 조준기를 각색. 로켓·수류탄·폭탄의 발사 순간 예측 조준. 발수 유지.','Adapted bombsight: predicts rocket/grenade/bomb aim at release. Projectile count unchanged.'],
 strutterAirbrake:['감속 선회 후 재가속. 기체 전환 장비와 동시 장착 불가.','Brake turn, then reaccelerate. Incompatible with airframe conversions.'],
 buckinghamBelt:['기관총 연속 명중으로 적 기체에 불을 붙입니다.','Repeated MG hits ignite enemy aircraft.'],
 cooperRack:['전방 적을 스쳐 지나며 소형 폭탄을 연속 투하합니다.','Drops a pair of light bombs when passing a forward target.'],
 fieryGrapnel:["근접 교차 갈고리·화상. 직접 피해에 기관총 강화 50% 반영 (최대 +50%).", "Close-flyby hook and fire. Direct damage inherits 50% of MG bonuses, capped at +50%."],
 flechettes:["관통 화살탄 12발. 기관총 강화 50% 반영 (최대 +50%), 중장갑 피해 25%.", "12 piercing darts. Inherits 50% of MG bonuses up to +50%; heavy armor takes 25%."],
 veryPistol:["최근 직접 맞힌 전방 표적 우선 지휘. 대형 유지·남은 시간 내 1회 재지정.", "Prioritizes a recently hit forward target; preserves formations and retargets once."],
 hytheCamera:["주무장 3회 명중 → 6초 분석·피해 +30%. 망원경·퐁크 점사가 분석 표적 우선.", "3 distinct MG hits: 6s analysis, +30% damage; telescope and Fonck burst prioritize the target."],
 amatolCharge:['폭발 피해·반경 +40%. 폭발 격추 시 30% 파편 폭발 (연쇄 없음).','Blast damage/radius +40%. Explosive kills cause a 30% secondary blast; no chains.'],
 lufberyCircle:["260px 내 본인 상시 편대에 따라 피해 −20~35%. 300px 밖에서 엄호 해제.", "Damage taken −20–35% from own permanent wings within 260px; cover ends beyond 300px."],
 redScarf:["속도 +20%, 후미 추적 잠금 중 총 +35%. 추적 거리 +25%, 포착 시간 −35%.", "Speed +20%, or +35% while tail-locked. Pursuit range +25%, lock time −35%."],
 prancingHorse:['이동 속도 +20%. 전방에서 받는 피해 −25%.','Speed +20%. Damage taken from the front −25%.'],
 ironCross:['파일럿 액티브 강화. 재사용 대기시간 −20%.','Stronger pilot Active. Cooldown −20%.'],
 telescope:['전방 표적 포착 시 0.8초간 기관총 조준 보정. 하이스 분석 표적 우선.','Corrects MG aim for 0.8s; prioritizes a forward Hythe-analyzed target.'],
 flightGloves:['주무장 사거리 −20%. 이동 선회 후 근접 재진입: 1.5초간 발사 간격 −30% (대기 3초).','Primary range −20%. Moving turn into close re-entry: firing interval −30% for 1.5s; 3s cooldown.'],
 sparkPlug:["10초마다 내구도 8%. 수리품 회수 시 추가 12% (대기 10초).", "Restores 8% max durability every 10s; repair pickups add 12% once per 10s."],
 goeringBaton:['상시 편대기 +3. 편대기 피해 +25%.','Permanent wingmen +3. Wingman damage +25%.'],
 immelmannManual:['선회기동 대기시간 −50%. 기동 무적 1.05초.','Maneuver cooldown −50%. Invulnerable for 1.05s during maneuvers.'],
 motorCannon:['3초마다 37mm 관통탄 자동 발사. 피해 240, 폭발물 강화 적용.','Auto-fires a piercing 37mm shell every 3s: 240 damage, scaled by ordnance upgrades.'],
 loEmblem:['최대 내구도 −50%. 전 무장 피해 +50%, 편대 연사 +30%, 속도·선회 +25%.','Max durability −50%. All weapons +50% damage, wing fire rate +30%, speed/turn +25%.'],
 sacredCowling:['근거리 피해 +25%. 가까운 적의 탄환 피해 최대 −20%.','Close-range damage +25%. Nearby enemy bullet damage taken up to −20%.'],
 steelPlate:['소구경 탄환 피해 −30%. 이동 속도·선회력 −10%.','Small-caliber damage taken −30%. Speed/turn −10%.'],
 mauserAceKiller:["0.65초마다 피해 18/36/72. 직접 교전한 정예·에이스는 54/120.", "Every 0.65s: 18/36/72 damage; elites/aces recently hit by your direct weapons take 54/120."],
 boelckeDicta:['경험치 +30%. 협동에서는 본인에게만 적용.','XP +30%. Owner only in co-op.'],
 rearGunner:['복좌기 관측수 총좌를 각색. 기관총 후방 회전 조준 (약 2.7초).','Adapted observer mount. Rotating MG aim reaches fully behind in about 2.7s.'],
 quadLewis:['총구별 기관총 탄환 +4. 일반 발사체 상한 무시.','MG rounds +4 per muzzle, beyond the normal projectile cap.'],
 cow37:['기관총을 37mm 포로 교체. 기초 초당 1발·피해 280. 연사·추가탄 강화 제외.','Replaces MGs with a 37mm cannon: base 1 shot/s, 280 damage. No fire-rate/extra-round upgrades.'],
 rankinShell:["3.2초마다 후방 일반 탄막 제거·피해 32. 중탄·경고 공격 제외.", "Clears rear light rounds every 3.2s; damage 32. Heavy and warning attacks remain."],
 grunkreuz:['독가스 면역. 후방 가스 분출 4.5초·충전 7초. 액티브 대기 감소 적용.','Gas immunity. Rear gas vent: 4.5s; recharge: 7s. Scales with Active cooldown.'],
 kaiserFog:['12초마다 3초간 연막 은폐. 적 추적 해제.','Smoke concealment for 3s every 12s. Breaks enemy tracking.'],
 fogCompass:["경험치 반경 480px·수리품 흡입 696px. 솔로·협동 동일.", "XP radius 480px; repair attraction 696px, in solo and co-op."],
 maximBelt:['기관총 피해 +25%p, 탄띠 +75%, 재장전 −35%.','MG damage +25pp, belt capacity +75%, reload −35%.'],
 urLeica:['출격 종료 시 최종 격추 기록 +10%.','Final kill record +10% at sortie end.'],
 badinGauge:["직선 비행으로 지속 속도 강화분의 75%를 피해로 전환 (최대 +30%).", "Straight flight converts 75% of sustained speed gains into damage, up to +30%."],
 heineckeRettungsfallschirm:['치명 피해 시 예비기로 재출격. 출격당 2회·대기 180초.','Relaunch in a reserve aircraft after lethal damage. Twice per sortie; 180s cooldown.'],
 bomberTransfer:['중폭격기 전환·자동 폭격·후방 사수. 내구도↑, 속도·선회↓. 기동은 방어탄막으로 교체.','Heavy bomber: auto-bombs, rear gunner, more durability, less speed/turn. Defensive barrage replaces maneuver.'],
 mgTransfer:['중무장기 전환·기관총 2정 추가·화망 방어. 내구도 2배·정면 피해 +40%. 속도 −14%, 선회 −22%, 피탄 면적↑.','Gunship: +2 MGs, anti-bullet screen replaces maneuver. Double durability, +40% forward damage. Speed −14%, turn −22%, larger target.'],
 airshipTransfer:['비행선 전환·호위기 3기·편대 피해 +35%·내구도 4배. 속도 −38%, 선회 −50%, 피탄 면적↑.','Airship: 3 escorts, +35% wing damage, quadruple durability. Speed −38%, turn −50%, larger target.'],
 aceWingman:['아군 에이스 1명 합류. 주력 무장과 반대 계열로 엄호.','One allied ace joins, covering you with the opposite weapon family.'],
 fighterSupply:['상시 편대기 기종 개량. 피해 +35%, 발사 간격 −20%.','Upgrades permanent wingmen. Damage +35%, firing interval −20%.'],
 mercedesEngine:['기본 속도 +20%. 직선 1.2초로 최대 +55%, 급선회 시 0.75초에 걸쳐 감소.','Base speed +20%; reaches +55% after 1.2s straight flight. Output decays over 0.75s during hard turns.'],
 spread:['기관총 발사체 +1 (최대 5). 추가 탄약 소모 없음.','MG projectiles +1, up to 5. No extra ammunition cost.'],
 combinedProjectiles:['총수 유지·0.24초 시차. 2차 피해 +25%·반경 +10%. 단발 피해 +15%.','Same total, 0.24s delay. Second packet: damage +25%, radius +10%. Single shot: damage +15%.'],
 gunPrecision:['고위력 3연속 점사 후 사격 공백. 단일 표적에 강하고 다방향 대응은 약함.','3 powerful bursts, then a firing gap. Strong vs one target; weak vs scattered enemies.'],
 gunSuppression:['넓은 탄도로 탄환 +1, 개별 위력 감소. 다수 제압에 유리.','Wider spread, +1 round, lower damage per hit. Suppresses groups.'],
 explosiveFocus:['로켓·수류탄 탄착 집중. 밀집 표적에 유리, 광역 대응 감소.','Tighter rocket/grenade patterns. Strong vs clusters; less area coverage.'],
 explosiveArea:['로켓·수류탄 탄착 분산. 광역 대응 증가, 집중 화력 감소.','Wider rocket/grenade patterns. More area coverage, less focused damage.'],
 wingStrike:['편대 동시 출격 후 복귀. 순간 화력↑, 출격 중 본체 엄호↓.','Wings strike together, then return. More burst damage, less cover during sorties.'],
 wingCover:['두 조가 공격·엄호 교대. 지속 방어↑, 동시 화력↓.','Two groups alternate attack and cover. More protection, less simultaneous fire.']
};
for(const u of RARE_SPECIALIZATIONS)CHOICE_COPY[u.id]=[u.desc,u.enDesc];
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
 return typeof p.ordnanceInterval==='function'?p.ordnanceInterval(base):base;
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
  supplyDamage:[label('편대'),label('피해'),p.upgrades?.fighterSupply?'+35%':'+0%'],supplyInterval:[label('편대'),label('발사 간격'),p.upgrades?.fighterSupply?'−20%':'+0%'],
  staggerDelay:[label('로켓 · 수류탄'),label('시차 발사'),p.upgrades?.combinedProjectiles?ORDNANCE_STAGGER_DELAY+(getLocale()==='en'?'s · same total':'초 · 총량 유지'):(getLocale()==='en'?'Not equipped':'미장착')],
  gunMod:[label('기관총'),label('개조'),modName(p,'GUN')],explosiveMod:[label('로켓 · 수류탄'),label('개조'),modName(p,'EXPLOSIVE')],wingMod:[label('편대'),label('개조'),modName(p,'FORMATION')],speedMod:[label('이동'),label('개조'),modName(p,'SPEED')],survivalMod:[label('내구도'),label('개조'),modName(p,'SURVIVAL')]
 };
}
const fields={mgTransfer:['speed','turn'],airshipTransfer:['wingCount','command','commandRate','speed','turn'],bomberTransfer:['armor','speed','turn'],damage:['damage'],rate:['rate'],rockets:['rockets','explosives'],mines:['grenadeCount','mines','explosives'],explosives:['explosives'],command:['command','commandRate'],turn:['speed','turn'],armor:['armor'],regen:['regen'],cooldown:['cooldown'],combinedProjectiles:['staggerDelay']};
for(const mod of WEAPON_MODS)fields[mod.id]=[{GUN:'gunMod',EXPLOSIVE:'explosiveMod',FORMATION:'wingMod',SPEED:'speedMod',SURVIVAL:'survivalMod'}[mod.family]];
// Pause-screen popup: which totals of the current build each held upgrade feeds into.
const HELD={...fields,fighterSupply:['supplyDamage','supplyInterval'],goeringBaton:['command'],mercedesEngine:['speed'],amatolCharge:['explosives'],redScarf:['speed'],prancingHorse:['speed'],ironCross:['cooldown'],flightGloves:['rate','reload'],loEmblem:['damage','armor','speed','turn'],steelPlate:['speed','turn'],maximBelt:['belt','reload'],cow37:['belt','reload']};
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

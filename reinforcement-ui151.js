// Categories: current 강화 and 특수장비(개편) sheets. Blank merged cells inherit the category above.
// Telescope category follows the user-requested machine-gun-only effect.
// Presentation only. Preview uses the existing upgrade implementation on a detached copy.
import {getLocale,upgradeName as i18nUpgradeName} from './i18n.js?v=333';
export const CATEGORIES={"damage":"기관총","rate":"기관총","rockets":"로켓","mines":"수류탄","explosives":"폭발 피해","command":"편대","turn":"이동","armor":"내구도","regen":"내구도","cooldown":"액티브","bomber":"공통","wingman":"편대","mercedesEngine":"이동속도","spread":"기관총","combinedProjectiles":"로켓 · 수류탄","redScarf":"이동","prancingHorse":"이동 · 방어력","ironCross":"액티브","telescope":"기관총","flightGloves":"발사 · 투척 주기","amatolCharge":"폭발 피해","lufberyCircle":"편대 · 방어","fighterSupply":"편대","sparkPlug":"내구도","goeringBaton":"편대","immelmannManual":"이동","motorCannon":"특수기","loEmblem":"공통","sacredCowling":"이동","steelPlate":"내구도","mauserAceKiller":"특수기","boelckeDicta":"공통","rearGunner":"특수기","quadLewis":"기관총","cow37":"무기교체","rankinShell":"특수기","kaiserFog":"특수기","fogCompass":"특수기","maximBelt":"기관총"};
const EN_CATEGORY={기관총:'Machine Gun',로켓:'Rockets',수류탄:'Grenades','폭발 피해':'Explosive Damage',편대:'Formation',이동:'Flight',내구도:'Durability',액티브:'Active',공통:'General',이동속도:'Flight Speed','로켓 · 수류탄':'Rockets · Grenades','이동 · 방어력':'Flight · Defense','발사 · 투척 주기':'Fire · Deployment Cycle','편대 · 방어':'Formation · Defense',특수기:'Special Weapon',무기교체:'Weapon Replacement',탄약:'Ammunition',폭탄:'Bombs',회복:'Repair'};
const EN_LABEL={피해:'Damage',연사:'Fire Rate',탄띠:'Belt',재장전:'Reload',속도:'Speed',선회:'Turn','최대 체력':'Max Durability','초당 최대 체력':'Max Durability / sec','재사용 대기시간':'Cooldown','동시 발사':'Simultaneous Fire','투척 주기':'Deployment Cycle'};
const label=value=>getLocale()==='en'?(EN_LABEL[value]||EN_CATEGORY[value]||value):value;
export function categoryName(id){return label(CATEGORIES[id]||'공통')}
export function reinforcementName(u,p,planes){if(u.id==='ironCross')return planes[p?.plane]?.faction==='entente'?'Victoria Cross':'Pour le Mérite';return i18nUpgradeName(u.id,u.name)}
const num=n=>Number(n.toFixed(1)),pct=n=>(n>=0?'+':'')+num(n*100)+'%';
export function buildStats(p){
 const b=p.buildBaseline||{rate:p.rate,maxHp:p.maxHp,speed:p.baseSpeed||p.speed,turn:p.turn};
 return {
  damage:[label('기관총'),label('피해'),pct(p.gunUpgradeBonus||0)],rate:[label('기관총'),label('연사'),pct(b.rate/p.rate-1)],
  belt:[label('탄약'),label('탄띠'),p.weapon.belt+(getLocale()==='en'?' rounds / gun':'발 / 총')],reload:[label('탄약'),label('재장전'),num(p.weapon.reload)+(getLocale()==='en'?'s':'초')],
  explosives:[label('폭탄'),label('피해'),pct(p.explosiveBonus||0)],command:[label('편대'),label('피해'),pct(p.commandBonus||0)],commandRate:[label('편대'),label('연사'),pct(p.commandRateBonus||0)],
  speed:[label('이동속도'),label('속도'),pct((p.baseSpeed||p.speed)/b.speed-1)],turn:[label('이동속도'),label('선회'),pct(p.turn/b.turn-1)],
  armor:[label('내구도'),label('최대 체력'),(p.maxHp-b.maxHp>=0?'+':'')+num(p.maxHp-b.maxHp)+' HP'],regen:[label('회복'),label('초당 최대 체력'),pct(p.regen||0)],cooldown:[label('액티브'),label('재사용 대기시간'),pct(p.cooldownMult-1)],
  rockets:[label('로켓'),label('동시 발사'),Math.min(5,(p.rockets||0)+(p.rockets?p.projectileDistributorLevel||0:0))+(getLocale()==='en'?' rounds':'발')],
  mines:[label('수류탄'),label('투척 주기'),p.mineCount?num(3.6/(1+p.mineCount*.3)*(p.upgrades?.flightGloves?.6:1))+(getLocale()==='en'?'s':'초'):(getLocale()==='en'?'Not equipped':'미장착')]
 };
}
const fields={damage:['damage'],rate:['rate'],rockets:['rockets','explosives'],mines:['mines','explosives'],explosives:['explosives'],command:['command','commandRate'],turn:['speed','turn'],armor:['armor'],regen:['regen'],cooldown:['cooldown']};
export function cumulativeText(p,id,rarity){
 if(!fields[id])return '';
 const copy=Object.assign(Object.create(Object.getPrototypeOf(p)),p,{state:'upgrade',upgrades:{...p.upgrades},upgradeRarities:{...p.upgradeRarities},weapon:{...p.weapon},ammo:[...p.ammo],events:[],checkLevel(){}});
 const current=getLocale()==='en'?' current ':' 현재 ';
 const before=buildStats(p);if(!copy.upgrade(id,rarity))return fields[id].map(k=>before[k][1]+current+before[k][2]).join('\n');
 const after=buildStats(copy);return fields[id].filter(k=>before[k][2]!==after[k][2]).map(k=>before[k][1]+current+before[k][2]+' → '+after[k][2]).join('\n');
}
export function cleanDescription(text){return text.replace(/(?:한\s*)?출격(?:당)?\s*(?:1회|한\s*번)[^.。]*(?:[.。]|$)/g,'').replace(/1회 획득 가능[.]?/g,'').trim()}


// The field record uses the same final registries, artwork and descriptions as sortie selection.
import {Game,PLANES,WEAPONS,PILOTS,PILOT_PLANES,pilotLoadout,UPGRADES,LEGENDARIES} from './engine.js?v=merge20261017&ai=1018&art=pilot-recovery2&sig=1019&boss=20261020b&phase=1021';
import {PILOT_AIRCRAFT,PILOT_RENDER_ART} from './pilot-aircraft.js?v=pilotair1&art=pilot-recovery2';
import {getAircraftDisplayName,getAircraftMeta,aircraftCategoryLabel} from './aircraft-master.js?v=tame3';
import {hangarArtSource} from './hangar-art.js?v=buildfit1&art=pilot-recovery2';
import {portraitSources} from './portraits.js?v=gal1';
import {pilotIdentityCopy} from './pilot-identity-copy.js?v=merge20261017';
import {WEAPON_MODS} from './weapon-modifications.js?v=weaponmods20261018';
import {getLocale,pilotName,upgradeName,upgradeDescription,subscribe} from './i18n.js?v=buildfit1&afc=1&art=pilot-recovery2';

const NORMAL_IDS=['damage','rate','rockets','mines','explosives','command','turn','armor','regen','cooldown','wingman'];
const UNIQUE_IDS=['bomber','fighterSupply','mercedesEngine','spread','combinedProjectiles'];
const SPECIAL_IDS=['amatolCharge','lufberyCircle','redScarf','prancingHorse','ironCross','telescope','flightGloves','sparkPlug','goeringBaton','immelmannManual','motorCannon','loEmblem','sacredCowling','steelPlate','mauserAceKiller','boelckeDicta','rearGunner','quadLewis','cow37','rankinShell','kaiserFog','fogCompass','maximBelt','grunkreuz','urLeica','badinGauge','heineckeRettungsfallschirm'];
const NEW_ICONS={bomberTransfer:'bomber_squadron_transfer_orders',mgTransfer:'concentrated_firepower_refit_orders',airshipTransfer:'airship_mobilization_orders',aceWingman:'ace_wingman'};
const shortName=key=>PILOTS[key]?.name?.replace(/^.*?\s(?=리히트호펜$)/,'')||key;
const renderKey=(id,pilot)=>PILOT_RENDER_ART[pilot]?.[id]||(id==='fokker'?({baron:'fokker_red',voss:'fokker_voss',jacobs:'fokker_jacobs'}[pilot]||id):id);
const rating=(value,thresholds)=>1+thresholds.filter(n=>value>=n).length;

export function currentRecordPlane(id,pilot=null,previous={}){
 const fit=PLANES[id],weapon=WEAPONS[id];
 if(!fit||!weapon)return previous;
 const handling=fit.handling||{},en=getLocale()==='en';
 return {...previous,key:id,name:getAircraftDisplayName(id,pilot,getLocale(),fit.name),faction:fit.faction,
  role:fit.identityDescription||handling.role||fit.role,history:previous.history||handling.history||'',tip:previous.tip||handling.tip||'',
  image:hangarArtSource(renderKey(id,pilot))||previous.image,
  stats:{hp:fit.hp,speed:fit.speed,turn:fit.turn},
  weapon:{...weapon,profiles:weapon.gunProfiles||fit.gunProfiles||[weapon.gunProfile||(/Spandau/.test(weapon.name)?'spandau':/Lewis/.test(weapon.name)?'lewis':'vickers')]},
  year:fit.aircraftTier?.introduced||previous.year,
  feel:[rating(1-(handling.drag??.18),[.78,.82,.86,.9]),rating(handling.recovery??1,[.8,1,1.3,1.6]),rating(1/(fit.xpCostMultiplier||1),[.8,1,1.2,1.4])],
  categoryLabel:aircraftCategoryLabel(id,pilot,getLocale())+(en?' · Playable':' · 플레이 가능'),
  users:previous.users|| (pilot?pilotName(pilot,PILOTS[pilot].name):(en?'Playable aircraft':'출격 기체'))};
}

export function syncFieldRecord(data){
 const en=getLocale()==='en',byPlane=new Map(data.planes.map(p=>[p.key,p]));
 const allChoices=new Set(Object.values(PILOT_AIRCRAFT).flatMap(p=>[p.defaultAircraft,p.unlockAircraft].filter(Boolean)));
 for(const id of allChoices){
  // Keep the excluded pilot's existing authored record and assets.
  if(id.startsWith('loewenhardt_'))continue;
  const updated=currentRecordPlane(id,null,byPlane.get(id)||{});
  if(byPlane.has(id))Object.assign(byPlane.get(id),updated);else{data.planes.push(updated);byPlane.set(id,updated)}
 }
 for(const p of data.planes){if(PLANES[p.key]&&WEAPONS[p.key]&&!p.key.startsWith('loewenhardt_'))Object.assign(p,currentRecordPlane(p.key,null,p));else if(!allChoices.has(p.key))p.categoryLabel=en?'Historical / display':'역사·전시';}
 const previousPilots=new Map(data.pilots.map(p=>[p.key,p]));
 data.pilots=Object.keys(PILOTS).map(key=>{
  const prior=previousPilots.get(key)||{},roster=PILOT_AIRCRAFT[key];
  if(key==='loewenhardt')return prior;
  const plane=roster?.defaultAircraft||PILOT_PLANES[key],loadout=pilotLoadout(key,plane),copy=pilotIdentityCopy(key,getLocale());
  const options=[plane,roster?.unlockAircraft].filter(Boolean).map(id=>({id,...currentRecordPlane(id,key,byPlane.get(id)||{})}));
  return {...prior,key,name:pilotName(key,loadout.name),alias:loadout.alias,faction:loadout.faction,
   plane:options[0]?.name||'',role:options[0]?.role||'',aircraft:options[0]?.image,
   aircraftOptions:options.map(p=>({id:p.id,name:p.name,image:p.image})),portrait:portraitSources[key]||prior.portrait,
   skill:copy?.skill||loadout.skill,passive:copy?.passive||loadout.passive,
   desc:copy?.activeShort||loadout.desc,passiveDesc:copy?.passiveShort||loadout.passiveDesc,
   history:prior.history|| (en?'Available in the current pilot roster.':'현재 출격 가능한 에이스입니다.'),ranking:prior.ranking||'—'};
 });
 const oldRows=[['normal',NORMAL_IDS],['unique',UNIQUE_IDS],['legendary',SPECIAL_IDS]];
 const oldById=new Map();
 for(const [group,ids] of oldRows)for(let i=0;i<data[group].length;i++){const row=data[group][i];oldById.set(row.id||ids[i],row)}
 const description=(u,rarity)=>upgradeDescription(u.id,Game.prototype.upgradeDescription(u.id,rarity));
 const iconFor=id=>oldById.get(id)?.icon|| (NEW_ICONS[id]?'./augmentation-icons/'+NEW_ICONS[id]+'.webp':'');
 const rowFor=(u,group)=>({...oldById.get(u.id),id:u.id,name:upgradeName(u.id,u.name).replace('르네 퐁크','르네 폰크'),desc:description(u,group==='unique'?'unique':'normal'),icon:iconFor(u.id),target:en?(group==='legendary'?'Special Equipment':group==='unique'?'Unique Upgrade':'Standard Upgrade'):(group==='legendary'?'특수장비':group==='unique'?'유니크 강화':'일반 · 매직 · 레어')});
 data.normal=UPGRADES.filter(u=>!u.legendary&&!u.uniqueOnly&&!u.weaponMod||u.id==='wingman').map(u=>{
  const row=rowFor(u,'normal');row.tiers=Object.fromEntries(['normal','magic','rare'].map(tier=>[tier,description(u,tier)]));return row;
 });
 data.unique=UPGRADES.filter(u=>u.uniqueOnly&&!u.weaponMod&&!u.legendary).map(u=>rowFor(u,'unique'));
 data.legendary=LEGENDARIES.map(u=>rowFor(u,'legendary'));
 data.weaponMods=WEAPON_MODS.map(mod=>({id:mod.id,name:upgradeName(mod.id,mod.name),desc:upgradeDescription(mod.id,mod.description),icon:iconFor(mod.icon),target:en?'Weapon Modification':'무장 개조'}));
 return data;
}

export function syncRecordVariants(data,variants,variantKeys){
 for(const key of Object.keys(variants))delete variants[key];variantKeys.clear();
 const byPlane=new Map(data.planes.map(p=>[p.key,p]));
 for(const [pilot,roster]of Object.entries(PILOT_AIRCRAFT)){
  if(pilot==='loewenhardt')continue;
  for(const id of [roster.defaultAircraft,roster.unlockAircraft].filter(Boolean)){
   const base=getAircraftMeta(id)?.baseAirframeId||id;
   if(!byPlane.has(base)||!PLANES[id])continue;
   const group=variants[base]??=[{key:base,record:currentRecordPlane(base,null,byPlane.get(base)),label:getLocale()==='en'?'Standard':'기본형'}];
   const key=id+':'+pilot;if(group.some(v=>v.key===key))continue;
   group.push({key,record:currentRecordPlane(id,pilot,byPlane.get(id)),label:pilotName(pilot,shortName(pilot))});
   if(id!==base)variantKeys.add(id);
  }
 }
}

if(typeof DATA!=='undefined'){
 const refresh=()=>{syncFieldRecord(DATA);if(typeof VARIANTS!=='undefined')syncRecordVariants(DATA,VARIANTS,VARIANT_KEYS);if(typeof render==='function')render()};
 refresh();subscribe(refresh);
 const fallbacks=()=>new Map(DATA.pilots.map(p=>[p.key,p.portrait]));
 document.addEventListener('error',event=>{
  const image=event.target;if(!(image instanceof HTMLImageElement)||image.dataset.portraitFallback==='1')return;
  const key=image.closest('[data-pilot]')?.dataset.pilot;
  if(!key||!fallbacks().get(key))return;image.dataset.portraitFallback='1';image.src=fallbacks().get(key);
 },true);
}

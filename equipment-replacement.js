import {attachAircraftPersonality} from './aircraft-personality164.js';
/** Rebuild only upgrade-owned contributions. Never replay combat or mutate a live world. */
const clone=v=>JSON.parse(JSON.stringify(v));
export function beginEquipmentLedger(p){
 if(p._equipmentReplay||p.equipmentLedger)return;
 const baseline={};for(const [k,v]of Object.entries(p))if(v===null||['number','string','boolean'].includes(typeof v))baseline[k]=v;
 baseline.weapon=clone(p.weapon);baseline.upgrades={...p.upgrades};baseline.ammo=[...p.ammo];if(p.bomberTransfer)baseline.bomberTransfer=clone(p.bomberTransfer);
 p.equipmentLedger={version:1,baseline,history:[]};
}
export function recordEquipmentUpgrade(p,id,rarity){if(!p._equipmentReplay)p.equipmentLedger?.history.push({id,rarity,active:true});}
export function recordEquipmentDoctrine(p,id){if(!p._equipmentReplay)p.equipmentLedger?.history.push({id,kind:'airframe',active:true});}
export function equipmentRemovable(p,id){return !!p.upgrades?.[id]&&!!p.equipmentLedger?.history.some(e=>e.id===id&&e.rarity==='legendary'&&e.active!==false)&&!p.equipmentLedger.baseline.upgrades[id];}
const MULT=new Set(['speed','baseSpeed','turn','damage','rate','cooldownMult','maxHp','xpGainMult','wingmanDamageMult']);
const KEYS=['speed','baseSpeed','turn','damage','rate','cooldownMult','maxHp','xpGainMult','wingmanDamageMult','gunUpgradeBonus','explosiveBonus','commandBonus','commandRateBonus','permanentWingman','shots','freeVolleyShots','magnet','armorUpgradeHp','baseBeltCapacity','transferBaseRate','evadeCooldownMult','evadeInvulnerability','skillEnhanced','redScarf','prancingHorse','telescope','mccuddenRepair','motorCannon','sacredCowling','jArmorCapsule','mauserAceKiller','scarffRing','cow37','unlimitedAmmo','rankinShrapnel','grunkreuz','brockSmoke','mercedesAppliedBase','projectileDistributorLevel'];
const TIMERS={sparkPlug:['mccuddenRepairTimer'],motorCannon:['motorCannonTimer'],mauserAceKiller:['mauserTimer'],rearGunner:['scarffTimer','scarffAim'],cow37:['cow37Timer'],rankinShell:['rankinShrapnelTimer'],grunkreuz:['grunkreuzTimer','grunkreuzOn','grunkreuzOff'],kaiserFog:['brockSmokeTimer','kaiserFogTime'],aceWingman:['aceWingmanPilotId','aceWingmanRespawnAt'],strutterAirbrake:['airbrakeTime','airbrakeCooldown'],fieryGrapnel:['grapnelTargetId','grapnelCable'],hytheCamera:['hytheTargetId','hytheAnalysis']};
export function equipmentModel(p,Game,removed){
 const ledger=p.equipmentLedger,m=Object.create(Game.prototype);Object.assign(m,clone(ledger.baseline));
 Object.assign(m,{_equipmentReplay:true,state:'upgrade',rng:()=>.5,events:[],allies:[],bullets:[],enemies:[],friendlyBombs:[],friendlyBombers:[],formationWings:[],divingSquadron:[],airshipFleet:[],event(){},checkLevel(){},burst(){},smoke(){}});
 for(const e of ledger.history)if(e.active!==false&&e.id!==removed){m.state='upgrade';if(e.kind==='airframe'){if(!m.acquireAirframeTransfer(e.id))throw new Error('Airframe replay failed: '+e.id);m.upgrades[e.id]=1;}else if(!m.upgrade(e.id,e.rarity))throw new Error('Equipment replay failed: '+e.id);}
 return m;
}
export function removeEquipment(p,id,Game,PLANES){
 if(!equipmentRemovable(p,id))return false;
 let before,after;try{before=equipmentModel(p,Game);after=equipmentModel(p,Game,id);}catch{return false;}
 const hpFraction=p.maxHp>0?p.hp/p.maxHp:0,ammo=p.ammo.map(n=>Math.max(0,n)/(p.weapon.belt||1)),reloadFraction=p.weapon.reload>0?p.reloadTime/p.weapon.reload:0;
 for(const key of KEYS){const a=before[key],b=after[key];if(Object.is(a,b))continue;
  if(typeof a==='number'&&typeof b==='number'&&Number.isFinite(a)&&Number.isFinite(b))p[key]=MULT.has(key)&&a!==0?(p[key]??a)*b/a:(p[key]??a)+b-a;
  else if(b===undefined)delete p[key];else p[key]=b;
 }
 p.hp=Math.max(0,Math.min(p.maxHp,p.maxHp*hpFraction));
 if(JSON.stringify(before.weapon)!==JSON.stringify(after.weapon)){
  const next={...p.weapon};for(const key of new Set([...Object.keys(before.weapon),...Object.keys(after.weapon)])){const a=before.weapon[key],b=after.weapon[key];if(Object.is(a,b))continue;if(typeof a==='number'&&typeof b==='number'&&a!==0)next[key]=(next[key]??a)*b/a;else if(b===undefined)delete next[key];else next[key]=b;}p.weapon=next;p.ammo=Array.from({length:p.weapon.guns},(_,i)=>Math.floor((ammo[i]??Math.min(...ammo))*p.weapon.belt));p.reloadTime=Math.max(0,reloadFraction*p.weapon.reload);
 }
 const world=p.combatWorld?.()||p,ownerId=p.id||'p1',owned=a=>(a.ownerId||'p1')===ownerId;
 if(id==='fighterSupply'){const fallback=after.permanentWingPlane();for(const wing of world.allies||[])if(owned(wing)&&wing.permanent&&!wing.aceWingman){wing.plane=wing.equipmentOriginalPlane||fallback;delete wing.equipmentOriginalPlane;attachAircraftPersonality(PLANES,wing,wing.plane);}}
 if(id==='mercedesEngine'){delete p.mercedesOutput160;delete p.mercedesHeading160;}
 if(id==='aceWingman')world.allies=(world.allies||[]).filter(a=>!owned(a)||!a.aceWingman);
 if(['goeringBaton','airshipTransfer'].includes(id)){let kept=0;world.allies=(world.allies||[]).filter(a=>!owned(a)||!a.permanent||a.aceWingman||kept++<(p.permanentWingman||0));}
 if(['bomberTransfer','mgTransfer','airshipTransfer'].includes(id)){
  delete p.bomberTransfer;p.airframeSpeed=1;p.pendingOrdnance=[];
  world.friendlyBombs=(world.friendlyBombs||[]).filter(b=>!owned(b)||!b.bomberTransfer);
  for(const a of world.allies||[])if(owned(a)){delete a.carrierLaunchAt;delete a.carrierHidden;delete a.carrierScale;}
 }else if(p.bomberTransfer&&after.bomberTransfer){
  // Keep live deployment clocks and ammunition; update only recomputed fit contributions.
  p.bomberTransfer.hpMultiplier=after.bomberTransfer.hpMultiplier;p.bomberTransfer.escortBonus=after.bomberTransfer.escortBonus;
  if(id==='maximBelt')for(const station of p.bomberTransfer.stations||[])station.ammo=Math.min(p.bomberTransfer.belt,Math.floor(station.ammo/1.75));
 }
 const prefix={buckinghamBelt:'wwiBuckingham',cooperRack:'wwiCooper',fieryGrapnel:'wwiGrapnel',flechettes:'wwiFlechette',veryPistol:'wwiVery',hytheCamera:'wwiHythe',strutterAirbrake:'strutterBrake',wimperisSight:'wimperis'}[id];
 if(prefix)for(const key of Object.keys(p))if(key.startsWith(prefix))delete p[key];
 for(const key of TIMERS[id]||[])delete p[key];
 delete p.upgrades[id];if(p.upgradeRarities)delete p.upgradeRarities[id];
 for(const e of p.equipmentLedger.history)if(e.id===id&&e.rarity==='legendary')e.active=false;
 p._buildRankAt=undefined;return true;
}

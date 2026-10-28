import {configureAirship} from './air-threat-profiles.js';
import {CONCEPT_AIRFRAMES} from './aircraft-concept-profiles.js';
import {configureConceptEnemy,fireConceptEnemy,remapConceptVolley,steerConceptBomber,updateConceptAircraft} from './aircraft-concept-combat.js';
import {BANK_LIVERIES,BANK_LIVERY_FAMILIES} from './aircraft-bank-liveries.js?v=headon-result339-20261028';
// Stock-bank aircraft in ordinary encounters. Enemy-only fittings; never touch pilot loadouts.
// Each row: id, display name, faction, WWI service year, role, existing handling archetype,
// cruise / durability / turning / firing-interval multipliers, and sprite scale.
const rows = [
 ['nieuport_11_bebe','Nieuport 11 Bébé','entente',1916,'fighter','nieuport',.90,.80,1.12,1.15,.87],
 ['nieuport_24','Nieuport 24','entente',1917,'fighter','nieuport24',1.02,.94,1.08,1.04,.91],
 ['sopwith_pup','Sopwith Pup','entente',1917,'fighter','pup',.91,.84,1.12,1.12,.89],
 ['sopwith_dolphin','Sopwith Dolphin','entente',1918,'fighter','dolphin',1.08,1.05,1.03,.94,.98],
 ['sopwith_strutter','Sopwith 1½ Strutter','entente',1916,'recon','strutter',.91,1.20,.85,1.26,1.09],
 ['dh4','Airco DH.4','entente',1917,'bomber','dh4',1.17,1.38,.80,1.10,1.24],
 ['re8','Royal Aircraft Factory R.E.8','entente',1917,'recon','re8',.86,1.15,.78,1.29,1.14],
 ['pfalz_d12','Pfalz D.XII','central',1918,'fighter','pfalz_d12',1.08,1.18,.93,.95,1.00],
 ['junkers_d1','Junkers D.I','central',1918,'fighter','junkers_d1',1.12,1.25,.87,1.02,.98],
 ['ssw_d4','Siemens-Schuckert D.IV','central',1918,'fighter','siemens_d4',1.13,.88,1.16,1.10,.87],
 ['hp_o400','Handley Page O/400','entente',1918,'bomber','gotha',.72,3.30,.42,1.40,1.85],
 ['caudron_r11','Caudron R.11','entente',1918,'bomber','caudron_g4',.80,2.15,.72,.93,1.52],
 ['staaken_r6','Zeppelin-Staaken R.VI','central',1917,'bomber','gotha',.64,3.80,.38,1.45,2.04],
 ['sopwith_triplane','Sopwith Triplane','entente',1917,'fighter','sopwith',.98,.95,1.17,1.03,.91],
 ['fokker_ev','Fokker E.V / D.VIII','central',1918,'fighter','fokkerdv',1.18,.93,1.07,1.02,.91],
 ['albatros_d3','Albatros D.III','central',1917,'fighter','albatros',1.01,1.10,.98,.95,1.00],
 ['phoenix_d1','Phönix D.I','central',1917,'fighter','phonix_d1',.98,1.18,.96,1.00,.98],
 ['hannover_cl3','Hannover CL.III','central',1918,'recon','hannover_cl3',.92,1.28,.92,1.12,1.16],
 ['ilya_muromets','Sikorsky Ilya Muromets','entente',1914,'bomber','gotha',.60,3.35,.39,1.58,2.01],
 ['caproni_ca3','Caproni Ca.3','entente',1917,'bomber','gotha',.73,2.95,.49,1.31,1.80],
 ['vickers_fb5','Vickers F.B.5 Gunbus','entente',1915,'fighter','gunbus',.74,.95,.97,1.35,1.10],
 ['dh9','Airco DH.9','entente',1917,'bomber','dh4',.93,1.43,.84,1.12,1.22],
 ['rumpler_taube','Rumpler Taube','central',1914,'recon','aviatik',.72,.80,.75,1.44,1.12],
 ['avro_504','Avro 504','entente',1913,'recon','be2c',.77,.79,.89,1.45,1.04],
 ['salmson_2a2','Salmson 2A2','entente',1917,'recon','re8',1.02,1.21,.94,1.12,1.17],
 ['armstrong_fk8','Armstrong Whitworth F.K.8','entente',1916,'recon','re8',.91,1.37,.85,1.20,1.18],
 ['savoia_pomilio','Savoia-Pomilio SP.4','entente',1917,'recon','re8',.89,1.31,.77,1.24,1.28],
 ['friedrichshafen_ff33','Friedrichshafen FF.33','central',1915,'sea-recon','ff33',.78,1.16,.77,1.31,1.22],
 ['short_184','Short 184','entente',1915,'sea-bomber','re8',.74,1.47,.65,1.34,1.34],
 ['sopwith_baby','Sopwith Baby','entente',1915,'sea-fighter','pup',.91,.83,1.07,1.18,1.00],
 ['fba_h','FBA Type H','entente',1915,'sea-recon','macchi_m3',.76,1.29,.83,1.29,1.28],
 ['hansa_w12','Hansa-Brandenburg W.12','central',1917,'sea-fighter','hb_w29',.99,1.16,.92,1.04,1.16],
 ['gotha_wd14','Gotha WD.14','central',1916,'sea-bomber','lohner_l',.73,1.67,.62,1.27,1.45],
 // Match the established Zeppelin's ~368-world-unit hull; keep smaller blimps proportional.
 ['zeppelin_l30','Zeppelin L.30','central',1916,'airship','parseval',.81,1.36,.67,1.05,5.28],
 ['ss_blimp','SS Type Blimp','entente',1915,'airship','parseval',.93,.72,1.13,1.17,4.18],
 ['parseval_pl25','Parseval PL.25','central',1915,'airship','parseval',1.06,.88,.91,1.12,4.45],
 ['halberstadt_dii','Halberstadt D.II','central',1916,'fighter','albatros',1.01,1.10,.98,.95,1.00],
 ['roland_cii','Roland C.II','central',1916,'recon','halberstadt_duo',.91,1.20,.85,1.26,1.09],
 ['farman_f40','Farman F.40','entente',1915,'recon','caudron_g4',.80,2.15,.72,.93,1.52],
 ['grigorovich_m9','Grigorovich M-9','entente',1916,'sea-recon','macchi_m3',.76,1.29,.83,1.29,1.28],
 // Completed in 1918 but did not enter combat in the First World War.
 ['vickers_vimy','Vickers Vimy','entente',1918,'bomber','gotha',.72,3.30,.42,1.40,1.85,false],
 ['handley_page_v1500','Handley Page V/1500','entente',1918,'bomber','gotha',.64,3.80,.38,1.45,2.04,false]
];
// Existing dogfight archetypes supply AI decisions for fits not previously playable.
const aiBase=Object.freeze({pup:'nieuport',dolphin:'se5a',strutter:'re7',dh4:'bristol_duo',re8:'re7',pfalz_d12:'pfalz_d3a',junkers_d1:'spad12',siemens_d4:'fokkerdv',gotha:'re7',caudron_g4:'re7',phonix_d1:'albatros',hannover_cl3:'halberstadt_duo',gunbus:'airco_dh2',aviatik:'re7',be2c:'re7',ff33:'re7',macchi_m3:'re7',hb_w29:'nieuport',lohner_l:'re7',parseval:'re7'});
const seaRoles=new Set(['sea-fighter','sea-recon','sea-bomber']);
const seaRegions=new Set([1,7,16,17]);
export const BANK_AIRFRAMES=Object.freeze(Object.fromEntries(rows.map(
 ([id,name,faction,year,role,base,speed,hp,turn,fire,scale,historicalCombat])=>[
  (role==='airship'?'bank_airship_':seaRoles.has(role)?'bank_sea_':'bank_plane_')+id,
  Object.freeze({id,name,faction,year,role,base,speed,hp,turn,fire,scale,...historicalCombat===false?{historicalCombat:false}:{}})
 ]
)));
export const BANK_AIRFRAME_COUNT=rows.length;
// Only registered stock sprites may pass the renderer's asynchronous art gate.
export const BANK_ART_APPROVED=Object.freeze(rows.map(row=>row[0]));
export const BANK_ENCOUNTER_AIRFRAMES=Object.freeze({...BANK_AIRFRAMES,...BANK_LIVERIES,...CONCEPT_AIRFRAMES});
// Reuse the renderer's baked sprite, never a separate Image or a placeholder.
// Requested only at spawn time; at most two loads and a 30-second failure backoff.
export function createBankArtGate(load,now=Date.now,isCached=null){
 const states=new Map();let active=0;
 return key=>{
  if(!BANK_ENCOUNTER_AIRFRAMES[key])return false;
  const prior=states.get(key);
  if(prior?.ready&&(!isCached||isCached(key)))return true;
  if(prior?.pending||active>=2||(prior?.retryAt||0)>now())return false;
  const state={pending:true,ready:false,retryAt:0};states.set(key,state);active++;
  Promise.resolve().then(()=>load(key)).then(ok=>{
   state.ready=ok===true;if(!state.ready)state.retryAt=now()+30000;
  },()=>{state.retryAt=now()+30000}).finally(()=>{state.pending=false;active--});
  return false;
 };
}
let aircraftRenderer,rendererModule;
const bankArtReady=createBankArtGate(key=>{
 if(typeof window==='undefined'||typeof document==='undefined')return false;
 // Exact same module URL as app.js: no second renderer/cache or eager bank preload.
 return (aircraftRenderer??=import('./aircraft.js?v=headon-result339-20261028&art=pilot-recovery2&pf=1027')).then(art=>{rendererModule=art;return art.paintedReady(key)});
},Date.now,key=>rendererModule?.hasPaintedAircraft(key)===true);
const ordinaryFits=new Set(['fokker_standard','parseval','gotha','ff33','lohner_l','macchi_m3','macchi_m5','hansa_brandenburg_cc','hb_w29','bristol_duo','re7',...Object.keys(BANK_LIVERY_FAMILIES),...Object.values(BANK_LIVERIES).map(fit=>fit.base)]);
const regular=e=>e&&e.hp>0&&!e.bossPilot&&!e.bossPlane&&!e.bossMinion&&!e.stageBossBody&&!e.heavyBomber&&!e.missionTarget&&!e.fieldUnit&&!e.surface&&!e.stationary&&!e.navalVessel&&!e.formationLeader;
export const bankEncounterCandidates=(faction,type,sea,time,game)=>{
 const historical=Number(game?.stage?.historicalAnchorDate?.slice(0,4));
 const phase=game?.mode==='campaign'&&historical?historical:time>=210?1918:time>=45?1917:1916;
 return Object.entries(BANK_ENCOUNTER_AIRFRAMES).filter(([,v])=>{
  const nonhistorical=game?.mode!=='campaign'&&!game?.historicalMode&&!game?.stage?.historicalAnchorDate;
  const encounterYear=v.endlessFromYear&&nonhistorical&&time>=v.endlessAfter?v.endlessFromYear:v.year;
  if(v.faction!==faction||encounterYear>phase)return false;
  if(v.encounterTypes&&!v.encounterTypes.includes(type))return false;
  if(v.conceptId&&v.historicalCombat===false&&!nonhistorical)return false;
  if(game?.mode==='campaign'&&v.historicalCombat===false)return false;
  if(v.role==='airship')return type==='zeppelin'&&(v.id!=='ss_blimp'||sea);
  if(type==='zeppelin')return false;
  if(sea&&seaRoles.has(v.role)){
   return type==='hunter'?v.role==='sea-fighter':type==='scout'?v.role!=='sea-bomber':v.role==='sea-bomber'||v.role==='sea-recon';
  }
  if(sea||seaRoles.has(v.role))return false;
  if(type==='hunter')return v.role==='fighter';
  if(type==='scout')return v.role==='fighter'||v.role==='recon';
  return v.role==='bomber'||v.role==='recon';
 });
};
// Shuffle-bag, not independent random dice: eligible airframes rotate without repeating
// until a faction / role / era pool is exhausted. No save data or extra spawn entities.
function chooseBag(game,pool,group){
 // Rotate families first: eight paints must not make one model eight times likelier.
 const families=new Map();
 const stockFamilies={nieuport_11_bebe:'nieuport11',nieuport_24:'nieuport24',sopwith_pup:'pup',sopwith_dolphin:'dolphin',sopwith_strutter:'strutter',sopwith_triplane:'triplane',phoenix_d1:'phonix_d1',friedrichshafen_ff33:'ff33'};
 for(const [key,fit]of pool){const family=fit.family||stockFamilies[fit.id]||fit.id;const list=families.get(family)||[];list.push(key);families.set(family,list)}
 const keys=[...families.keys()],signature=pool.map(([key])=>key).join('|');
 const state=game.bankRosterDecks??=(Object.create(null));let deck=state[group];
 if(!deck||deck.signature!==signature||!deck.remaining.length){
  const remaining=[...keys];
  for(let i=remaining.length-1;i>0;i--){const j=Math.floor(game.rng()*(i+1));[remaining[i],remaining[j]]=[remaining[j],remaining[i]]}
  deck=state[group]={signature,remaining};
 }
 const family=deck.remaining.pop(),variants=families.get(family);
 const paints=game.bankPaintDecks??=Object.create(null),paintGroup=group+':'+family;
 let paintDeck=paints[paintGroup];
 if(!paintDeck||paintDeck.signature!==variants.join('|')||!paintDeck.remaining.length){
  const remaining=[...variants];for(let i=remaining.length-1;i>0;i--){const j=Math.floor(game.rng()*(i+1));[remaining[i],remaining[j]]=[remaining[j],remaining[i]]}
  paintDeck=paints[paintGroup]={signature:variants.join('|'),remaining};
 }
 const key=paintDeck.remaining.pop();return [key,BANK_ENCOUNTER_AIRFRAMES[key]];
}
// Keep the director's shared RNG draw budget exactly as the pre-expansion
// family/paint bags. New art diversity must not perturb formation scheduling.
function choose(game,pool,group,seedRoll){
 const legacyPool=pool.filter(([,fit])=>!fit.conceptId);
 const legacy=legacyPool.length?chooseBag(game,legacyPool,group):null;
 if(legacyPool.length===pool.length)return legacy;
 let selection=game.bankConceptSelection;
 if(!selection){
  let state=(Math.floor((seedRoll||0)*4294967296)^0x6a09e667)>>>0;
  selection=game.bankConceptSelection={rng:()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296)};
 }
 return chooseBag(selection,pool,group);
}
export function installAircraftBankRoster(Game,planes,attach,artReady=bankArtReady){
 if(Object.hasOwn(Game.prototype,'__aircraftBankRoster'))return;Game.prototype.__aircraftBankRoster=true;
 const prior=Game.prototype.spawnEnemy;
 Game.prototype.spawnEnemy=function(type,...args){
  const before=this.enemies?.length||0,returned=prior.call(this,type,...args);
  // Legacy spawn wrappers may append a unit without returning it; identify only
  // the newly added unit, never mistake an older enemy for the current spawn.
  const e=returned||(this.enemies?.length>before?this.enemies.at(-1):null);
  if(!regular(e)||!['scout','hunter','bomber','zeppelin'].includes(e.type))return returned;
  const threatBase=e.type==='zeppelin'?{hp:e.hp,maxHp:e.maxHp,speed:e.speed,fire:e.fire}:null;
  const finish=()=>{if(threatBase){const candidate={...e,...threatBase};if(configureAirship(this,candidate)){for(const k of ['bankAircraft','bankHandlingBase','bankFireFactor','bankTurnFactor','escortPlane','formationLivery'])delete e[k];Object.assign(e,candidate);}}return e;};
  // Respect scripted veterans, squadron-specific art and existing airframe assignments.
  if(this.bossMechanicSpawn||e.bossEscort||e.directorSquad?.tactic==='veteran')return finish();
  if(e.escortPlane&&!ordinaryFits.has(e.escortPlane))return finish();
  const sea=seaRegions.has(this.worldRegion?.()),roll=this.rng();
  if(roll>(sea?.82:e.type==='zeppelin'?.92:e.type==='bomber'?.64:.72))return finish();
  const seaPick=sea&&e.type!=='zeppelin'&&this.rng()<.78;
  let pool=bankEncounterCandidates(e.faction,e.type,e.type==='zeppelin'?sea:seaPick,this.t||0,this);
  // Sea encounters retain their geographic role; no extra spawn entities are added.
  if(!pool.length&&seaPick)return finish();
  if(!pool.length)return finish();
  const group=e.faction+':'+e.type+':'+(seaPick?'sea':'land')+':'+(this.t>=210?'late':this.t>=45?'mid':'early');
  const waiting=this.bankRosterPending??=Object.create(null);
  const pending=waiting[group];
  const [key,pick]=pending&&pool.some(([key])=>key===pending.key)&&Date.now()-pending.at<30000?[pending.key,BANK_ENCOUNTER_AIRFRAMES[pending.key]]:choose(this,pool,group,roll);
  // A slow/failed image keeps this unit's original art, stats and collision.
  // A later spawn can use the ready sprite; never swap an aircraft mid-flight.
  rendererModule?.retainBankArtwork((this.enemies||[]).filter(u=>u.hp>0||u.crashing).map(u=>u.bankAircraft).filter(Boolean));
  if(!artReady(key)){waiting[group]={key,at:pending?.key===key?pending.at:Date.now()};return finish();}
  delete waiting[group];
  // This is an NPC airframe only. Existing player PLANES/WEAPONS/skills are untouched.
  e.bankAircraft=key;e.bankHandlingBase=aiBase[pick.base]||pick.base;e.escortPlane=key;e.name=pick.name;
  if(e.formationLivery)e.formationLivery=key;
  e.bankTurnFactor=pick.turn;e.bankFireFactor=pick.fire;
  if(!pick.paint){const referenceSpeed=e.speed;
   e.speed=Math.min(referenceSpeed*pick.speed,(this.enemyCruiseReference??this.baseSpeed??this.speed??160)*.90);
   const hp=Math.max(16,Math.round(e.maxHp*pick.hp));e.hp=e.maxHp=hp;
  }
  if(e.type==='zeppelin'){const halfLength=264*.27*pick.scale/2;e.hullLength=halfLength*.90;e.hullWidth=halfLength*.22;e.hitRadius=e.hullWidth;e.contactRadius=e.hullWidth*.70;}
  else if(pick.role==='bomber'||pick.role==='sea-bomber')e.hitRadius=Math.max(24,Math.round(23*pick.scale));
  else if(pick.role.includes('recon'))e.hitRadius=Math.max(18,Math.round(17*pick.scale));
  e.visualScale=pick.scale;
  // The steering hook recognises bankHandlingBase and reuses the established archetype.
  attach(planes,e,e.bankHandlingBase);
  if(pick.conceptId)configureConceptEnemy(e,pick);
  return finish();
 };
 const fire=Game.prototype.fireEnemy;
 Game.prototype.fireEnemy=function(e,...args){if(fireConceptEnemy(this,e))return;const result=fire.call(this,e,...args);if(e?.bankAircraft&&e.escortPlane===e.bankAircraft&&e.bankFireFactor)e.fire*=e.bankFireFactor;return result};
 const steer=Game.prototype.dogfightSteering;
 Game.prototype.dogfightSteering=function(e,...args){const result=steer.call(this,e,...args);if(result&&e?.bankAircraft&&e.escortPlane===e.bankAircraft&&e.bankTurnFactor)result.turn*=e.bankTurnFactor;return result};
 const volley=Game.prototype.enemyVolley;
 if(typeof volley==='function')Game.prototype.enemyVolley=function(e,...args){if(fireConceptEnemy(this,e))return;const start=this.bullets?.length||0;const result=volley.call(this,e,...args);remapConceptVolley(this,e,start);return result};
 const bomberSteer=Game.prototype.directorBomberSteering;
 Game.prototype.directorBomberSteering=function(e,contact,dt,baseTurn){const result=bomberSteer?.call(this,e,contact,dt,baseTurn);return steerConceptBomber(this,e,contact,dt,baseTurn,result)};
 const update=Game.prototype.update;
 Game.prototype.update=function(...args){updateConceptAircraft(this,args[0]);rendererModule?.retainBankArtwork((this.enemies||[]).filter(e=>e.hp>0||e.crashing).map(e=>e.bankAircraft).filter(Boolean));return update.apply(this,args)};
}

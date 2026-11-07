// Map identity selects among existing encounters; it never owns spawns,
// rewards, timers, victory conditions, or saved/replicated game state.
export const MAP_COMBAT_TYPES=Object.freeze({
 DEFENSE:'defense',ESCORT_INTERCEPT:'escort-intercept',SABOTAGE:'sabotage',
 BREAKTHROUGH:'breakthrough',INTERDICT_SUPPLY:'interdict-supply',DECISIVE:'decisive'
});
const T=MAP_COMBAT_TYPES;
const role=(ko,en,patterns,missions)=>Object.freeze({ko,en,patterns:Object.freeze(patterns),missions:Object.freeze(missions)});
export const MAP_COMBAT_ROLES=Object.freeze({
 [T.DEFENSE]:role('방어형','Defense',['BOMBER_RUN','ESCORT','CHASE'],['BOMBER_INTERCEPT','RESCUE']),
 [T.ESCORT_INTERCEPT]:role('호위요격형','Escort / Intercept',['ESCORT','CROSS_ATTACK','PINCER'],['RECON_ESCORT','BOMBER_INTERCEPT']),
 [T.SABOTAGE]:role('파괴공작형','Sabotage',['DECOY','CROSS_ATTACK','BAIT'],['PHOTO_RECON','HIGH_VALUE_TARGET']),
 [T.BREAKTHROUGH]:role('진격돌파형','Breakthrough',['HEAD_ON_PASS','CROSS_ATTACK','PINCER'],['HIGH_VALUE_TARGET','BOMBER_INTERCEPT']),
 [T.INTERDICT_SUPPLY]:role('차단보급형','Interdict / Supply',['ESCORT','DECOY','CHASE'],['TRANSPORT_CONVOY','HIGH_VALUE_TARGET','SUPPLY_RECOVERY']),
 [T.DECISIVE]:role('결전형','Decisive Battle',['VETERAN_FORMATION','ELITE_FORMATION','CROSS_ATTACK'],['PHOTO_RECON','HIGH_VALUE_TARGET'])
});
const profile=(id,type,ko,en,options={})=>Object.freeze({
 id,type,ko,en,exclusiveObjective:false,regionalEvent:null,regionalChance:.6,...options,
 missions:Object.freeze([...(options.missions||MAP_COMBAT_ROLES[type].missions)])
});
// Exclusivity concerns automatic generic Battlefield Events only. Native map
// controllers, existing scout/squadron admissions and explicit requests keep
// their own safety checks; this module never cancels an active objective.
// Catalogue indexes, not sortie order. The route owner selects ten maps and
// a separate operation; every normal front ends in the opposing capital.
export const MAP_COMBAT_PROFILES=Object.freeze([
 profile('rural',T.INTERDICT_SUPPLY,'기회를 봐서 관측·지휘기를 끊고 보급품을 회수하세요.','Seize opportunities to cut command links and recover transport supplies.',{regionalEvent:'FORWARD_OBSERVER'}),
 profile('sea',T.ESCORT_INTERCEPT,'폭격기를 요격하거나 아군 정찰기를 보호하세요.','Intercept bombers or protect the allied reconnaissance aircraft.',{regionalEvent:'FLEET_CROSSING',regionalChance:.25}),
 profile('trenches',T.BREAKTHROUGH,'관측기를 먼저 끊고 포격선 사이로 진입하세요.','Destroy artillery spotters, then advance between the barrages.',{regionalEvent:'ARTILLERY_SPOTTER'}),
 profile('trenches-hell',T.BREAKTHROUGH,'가스·포격을 피하며 적 지휘 편대를 돌파하세요.','Break the command formation while avoiding gas and artillery.',{regionalEvent:'GAS_ATTACK',regionalChance:.3}),
 // The city is an air-raid defense for both sides (city-air-raid.js); generic offers would compete with it.
 profile('city',T.DEFENSE,'공습 4파를 막아 시가지 3구역을 지키세요. 모두 무너지면 출격 실패입니다.','Stop four raid waves and keep the three districts standing. Losing all of them ends the sortie.',{regionalEvent:'BLACKOUT',regionalChance:.15,exclusiveObjective:true}),
 profile('sky',T.ESCORT_INTERCEPT,'중폭격기를 요격하고 비행선의 호위를 분리하세요.','Intercept heavy bombers and separate the airship escorts.',{regionalEvent:'BOMBER_STREAM'}),
 profile('alps',T.BREAKTHROUGH,'상승기류로 에너지를 회복하고 진입각을 잡으세요.','Recover energy in thermals and choose your approach angle.',{regionalEvent:'MOUNTAIN_PURSUIT',regionalChance:.35,missions:['PHOTO_RECON','HIGH_VALUE_TARGET']}),
 // Zeebrugge is the blockship operation (zeebrugge-raid.js).
 profile('zeebrugge',T.ESCORT_INTERCEPT,'폐색선을 운하 입구까지 호위하면 요새 기능이 끊깁니다.','Escort the blockships to the canal mouth to cut the fortress off.',{regionalEvent:'AMMO_DEPOT',regionalChance:.65,exclusiveObjective:true}),
 profile('cambrai',T.SABOTAGE,'지휘기·비행장을 타격해 적 증원을 약화시키세요.','Strike command aircraft and airfields to weaken reinforcements.'),
 profile('arras',T.ESCORT_INTERCEPT,'정찰기를 보호하거나 촬영으로 보스 약점을 찾으세요.','Protect reconnaissance aircraft or complete photo reconnaissance to reveal a boss weak point.',{missions:['RECON_ESCORT','PHOTO_RECON']}),
 profile('somme',T.INTERDICT_SUPPLY,'관측기구를 격추하면 24초간 포격이 약해집니다.','Destroy the observation balloon for 24 seconds of lighter artillery.'),
 profile('london',T.DECISIVE,'방공망을 제압하고 수도 최종전에 대비하세요.','Suppress the air defenses and prepare for the capital finale.',{exclusiveObjective:true}),
 profile('verdun',T.SABOTAGE,'정찰로 약점을 찾고 요새의 포대를 차례로 제압하세요.','Find a weak point through reconnaissance, then silence the fort guns.'),
 profile('maan',T.INTERDICT_SUPPLY,'수송기를 요격하고 화물을 회수해 전력을 보충하세요.','Intercept the transport and recover its cargo to resupply.'),
 profile('gallipoli',T.BREAKTHROUGH,'해안 포대 구역을 제압하며 요새 지휘부로 진격하세요.','Suppress the coastal batteries and advance on the fortress command.'),
 profile('paris-night',T.DEFENSE,'엔진·폭탄창을 공략해 파리의 누적 피해를 막으세요.','Target engines and bomb bays to prevent damage to Paris.',{exclusiveObjective:true}),
 profile('jutland',T.DECISIVE,'기함이 현측을 돌리면 착탄선을 벗어나고, 재장전 중 사격지휘소를 공략하세요.','Clear the flagship’s impact line as it turns broadside, then strike its director during reload.'),
 profile('dover-night',T.ESCORT_INTERCEPT,'해협을 건너는 폭격 편대를 요격하세요.','Intercept the bomber formation crossing the Channel.',{exclusiveObjective:true}),
 profile('berlin',T.DECISIVE,'방공망을 제압하고 카이저크로네를 격파하세요.','Suppress the air defenses and defeat Kaiserkrone.',{exclusiveObjective:true}),
 profile('laon',T.SABOTAGE,'90초 안에 6번째 포격을 막으세요. 포신이나 약실을 파괴하면 됩니다.','Destroy the barrel or breech before the sixth shot and within 90 seconds.',{exclusiveObjective:true})
]);
const CENTRAL_PROFILES=Object.freeze({
 4:profile('city',T.DEFENSE,'공습 4파를 막아 시가지 3구역을 지키세요. 모두 무너지면 출격 실패입니다.','Stop four raid waves and keep the three districts standing. Losing all of them ends the sortie.',{regionalEvent:'BLACKOUT',regionalChance:.15,exclusiveObjective:true}),
 15:profile('paris-night',T.SABOTAGE,'발전기·탐조등을 제압해 방공망을 무력화하세요.','Disable generators and searchlights to suppress the air defenses.',{exclusiveObjective:true}),
 17:profile('dover-night',T.ESCORT_INTERCEPT,'폭격 편대의 해협 돌파를 호위하세요.','Escort the bomber formation across the Channel.',{exclusiveObjective:true}),
 19:profile('laon',T.DEFENSE,'프랑스 공습을 막고 파리포 6회 사격을 지키세요.','Repel the French raid and protect the Paris Gun until it fires six times.',{exclusiveObjective:true})
});
const FINAL_ARENA_PROFILE=profile('zero-district',T.DECISIVE,'세 비밀병기의 사선을 읽고 공격할 표적을 고르세요.','Watch the three weapons’ firing lines and choose your next target.',{exclusiveObjective:true});
const world=game=>game?.world||game;
export function mapCombatProfileForStage(region,faction){
 if(!Number.isInteger(region)||!MAP_COMBAT_PROFILES[region])return null;
 return faction==='central'&&CENTRAL_PROFILES[region]||MAP_COMBAT_PROFILES[region];
}
export function mapCombatProfile(game){
 const g=world(game);if(!g)return null;
 // The secret arena deliberately uses region 0. It is never a rural mission.
 if(g.stageBoss?.stages?.phase==='final-arena'||['entry','battle','victory'].includes(g.finalArena?.phase))return FINAL_ARENA_PROFILE;
 const region=g.worldRegion?.()??g.stageBoss?.stages?.stageIndex??g.region;
 const faction=g.stageBoss?.stages?.teamFaction||g.teamFaction||g.faction||g.players?.[0]?.faction;
 return mapCombatProfileForStage(region,faction);
}
function selectionActive(game){
 const g=world(game),phase=g?.stageBoss?.stages?.phase;
 return !!g&&g.state==='playing'&&g.mode!=='campaign'&&(!g.online||g.host)&&(!phase||phase==='explore')&&!['entry','battle','victory'].includes(g.finalArena?.phase);
}
// The first rural stage already teaches observation/convoy opportunities.
// Preserve its seeded opening, ace/recon reservations and ordinary-combat
// cadence exactly; new weights start in later maps (and later rural loops).
const preserveOpeningFlow=(game,p)=>p.id==='rural'&&(world(game)?.stageBoss?.stages?.loopIndex??0)===0;
function weightedCandidates(candidates,preferred,copies=1){
 const available=new Set(candidates),extra=preferred.filter(type=>available.has(type));
 return extra.length?[...Array.from({length:copies},()=>extra).flat(),...candidates]:candidates;
}
export function mapCombatPatternPool(game,candidates){
 const p=mapCombatProfile(game);
 return p&&selectionActive(game)&&!preserveOpeningFlow(game,p)?weightedCandidates(candidates,MAP_COMBAT_ROLES[p.type].patterns):candidates;
}
// map-operation-flow keeps game.mapOperation.wanted current for this stage: the
// map's signature objective first, then the follow-up its result calls for.
const operationWanted=game=>{const g=world(game);return g?.mapOperation?.wanted||null};
export function mapCombatMissionPool(game,candidates){
 const p=mapCombatProfile(game);
 // The caller already removed unavailable and immediately repeated missions.
 if(!p||!selectionActive(game)||p.exclusiveObjective||preserveOpeningFlow(game,p))return candidates;
 const wanted=operationWanted(game);
 if(wanted&&candidates.includes(wanted))return [wanted];
 return weightedCandidates(candidates,p.missions,2);
}
export function automaticMapMissionsAllowed(game){return !mapCombatProfile(game)?.exclusiveObjective;}
export function prioritizeMapConvoy(game){
 const p=mapCombatProfile(game);
 // Other maps retain the convoy in their eligible random pool. Only supply
 // maps give it the old guaranteed precedence; no new convoy timer is created.
 return !p||!p.exclusiveObjective&&p.type===T.INTERDICT_SUPPLY;
}
export function mapRegionalMissionChance(game,type,fallback=.6){
 const p=mapCombatProfile(game);
 if(p?.exclusiveObjective)return 0;
 const wanted=p&&selectionActive(game)&&!preserveOpeningFlow(game,p)?operationWanted(game):null;
 if(wanted)return wanted===type?1:0;
 return p?.regionalEvent===type?p.regionalChance:fallback;
}
export function mapCombatBriefing(game,locale='ko'){
 const p=mapCombatProfile(game);if(!p||world(game)?.mode==='campaign')return null;
 const en=locale==='en',r=MAP_COMBAT_ROLES[p.type];
 return{id:'map-role:'+p.id+':'+p.type,type:p.type,label:en?r.en:r.ko,text:en?p.en:p.ko};
}

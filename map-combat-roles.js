// Map identity selects among existing encounters; it never owns spawns,
// rewards, timers, victory conditions, or saved/replicated game state.
export const MAP_COMBAT_TYPES=Object.freeze({
 DEFENSE:'defense',ESCORT_INTERCEPT:'escort-intercept',SABOTAGE:'sabotage',
 BREAKTHROUGH:'breakthrough',WITHDRAWAL:'withdrawal',INTERDICT_SUPPLY:'interdict-supply',DECISIVE:'decisive'
});
const T=MAP_COMBAT_TYPES;
const CITY_BRIEFING=['공습 4파를 막고 야전병원·지휘부·피난처·연구소를 지키세요. 모든 시설이 무너지면 패배합니다.','Repel four air raids and defend the field hospital, command HQ, shelter and laboratory. Losing all four ends the sortie.'];
const role=(ko,en,patterns,missions)=>Object.freeze({ko,en,patterns:Object.freeze(patterns),missions:Object.freeze(missions)});
export const MAP_COMBAT_ROLES=Object.freeze({
 [T.DEFENSE]:role('방어형','Defense',['BOMBER_RUN','ESCORT','CHASE'],['BOMBER_INTERCEPT','RESCUE']),
 [T.ESCORT_INTERCEPT]:role('호위요격형','Escort / Intercept',['ESCORT','CROSS_ATTACK','PINCER'],['RECON_ESCORT','BOMBER_INTERCEPT']),
 [T.SABOTAGE]:role('파괴공작형','Sabotage',['DECOY','CROSS_ATTACK','BAIT'],['PHOTO_RECON','HIGH_VALUE_TARGET']),
 [T.BREAKTHROUGH]:role('진격돌파형','Breakthrough',['HEAD_ON_PASS','CROSS_ATTACK','PINCER'],['HIGH_VALUE_TARGET','BOMBER_INTERCEPT']),
 [T.WITHDRAWAL]:role('철수탈출형','Escape / Withdrawal',['CHASE','CROSS_ATTACK','PINCER'],['RECON_ESCORT','RESCUE']),
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
 profile('rural',T.INTERDICT_SUPPLY,'선로와 탄약차를 끊은 뒤 귀환하세요. 열차포의 전부 파괴는 필요하지 않습니다.','Cut the rail and ammunition car, then return through the marked exit.',{regionalEvent:'FORWARD_OBSERVER'}),
 profile('sea',T.ESCORT_INTERCEPT,'돌파 함정 2척을 저지한 뒤 적 기함을 격침하세요.','Stop two of three blockade runners, then sink the flagship. Two escapes mean defeat.',{regionalEvent:'FLEET_CROSSING',regionalChance:.25}),
 profile('trenches',T.BREAKTHROUGH,'랜드쉽의 양쪽 궤도 또는 엔진을 끊은 뒤 전방 돌파 지점으로 진격하세요.','Disable both tracks or the engine, then fly through the forward breach.',{regionalEvent:'ARTILLERY_SPOTTER'}),
 profile('trenches-hell',T.DECISIVE,'포격을 피하며 적 포대 또는 화염방사 진지의 본체를 파괴하세요.','Evade the barrage and destroy the enemy battery or flame projector.',{regionalEvent:'GAS_ATTACK',regionalChance:.3}),
 // The city is an air-raid defense for both sides (city-air-raid.js); generic offers would compete with it.
 profile('city',T.DEFENSE,...CITY_BRIEFING,{regionalEvent:'BLACKOUT',regionalChance:.15,exclusiveObjective:true}),
 profile('sky',T.ESCORT_INTERCEPT,'폭격대 3파에서 7대를 요격하세요. 3대가 돌파하면 출격 실패입니다.','Intercept seven bombers across three waves. Three escapes fail the sortie.',{regionalEvent:'BOMBER_STREAM'}),
 profile('alps',T.WITHDRAWAL,'추격과 산악 충돌을 피하며 탈출로 3곳을 순서대로 통과하세요.','Evade pursuit and mountain peaks, passing all three escape points in order.',{regionalEvent:'MOUNTAIN_PURSUIT',regionalChance:.35,missions:['PHOTO_RECON','HIGH_VALUE_TARGET']}),
 // Zeebrugge is the blockship operation (zeebrugge-raid.js).
 profile('zeebrugge',T.ESCORT_INTERCEPT,'1918년 운하 폐색 작전: 폐색선 2척의 자침을 엄호한 뒤 외항으로 철수하세요.','1918 canal raid: escort two blockships to scuttle, then withdraw offshore.',{regionalEvent:'AMMO_DEPOT',regionalChance:.65,exclusiveObjective:true}),
 profile('cambrai',T.BREAKTHROUGH,'1917년 공세와 역습: 주요 화기를 끊어 돌파로를 열고 항공 역습까지 저지하세요.','1917 offensive and counterattack: open a breach, then stop the counterattack.'),
 profile('arras',T.ESCORT_INTERCEPT,'1917년 항공 정찰전: 정찰기의 3곳 촬영과 아군 전선 귀환을 끝까지 엄호하세요.','1917 air reconnaissance: escort the aircraft through three photo areas and home.',{missions:['RECON_ESCORT','PHOTO_RECON']}),
 profile('somme',T.BREAKTHROUGH,'보루의 중화기 3곳을 끊고 열린 전선으로 진격하세요.','Silence the three strongpoint weapons and advance through the opening.'),
 profile('london',T.DECISIVE,'방공망을 제압하고 수도 최종전에 대비하세요.','Suppress the air defenses and prepare for the capital finale.',{exclusiveObjective:true}),
 profile('verdun',T.SABOTAGE,'포병 관측소와 보급로를 겨누는 양측 포대를 제압한 뒤 보급로를 확보하세요.','Silence the observation post and both road-covering batteries, then secure the route.'),
 profile('maan',T.DECISIVE,'모래바람과 중포 사격을 뚫고 적 육상전함을 격파하세요.','Fight through the sand and heavy guns to destroy the enemy landship.'),
 profile('gallipoli',T.WITHDRAWAL,'갈리폴리 철수전: 철수선 3척 중 2척의 출항을 지키고 해상 귀환 지점으로 이탈하세요.','Gallipoli evacuation: escort two of three ships out, then return to sea.'),
 profile('paris-night',T.DEFENSE,'파리가 파괴되기 전에 폭탄창 2곳을 무력화해 공습을 끝내세요.','Disable both bomb bays before Paris is destroyed to stop the raid.',{exclusiveObjective:true}),
 profile('jutland',T.ESCORT_INTERCEPT,'1916년 함대 퇴로 차단: 이탈하는 순양함 3척 중 2척을 저지하세요.','1916 fleet withdrawal: stop two of three retreating cruisers.'),
 profile('dover-night',T.ESCORT_INTERCEPT,'해협을 건너는 폭격 편대를 요격하세요.','Intercept the bomber formation crossing the Channel.',{exclusiveObjective:true}),
 profile('berlin',T.DECISIVE,'방공망을 제압하고 카이저크로네를 격파하세요.','Suppress the air defenses and defeat Kaiserkrone.',{exclusiveObjective:true}),
 profile('laon',T.SABOTAGE,'90초 안에 6번째 포격을 막으세요. 포신이나 약실을 파괴하면 됩니다.','Destroy the barrel or breech before the sixth shot and within 90 seconds.',{exclusiveObjective:true})
]);
const CENTRAL_PROFILES=Object.freeze({
 1:profile('sea',T.BREAKTHROUGH,'봉쇄함 2척 격침 → 해협 통과 → 적 기함 격침','Sink both blockade cruisers, cross the strait, then sink the enemy flagship.'),
 7:profile('zeebrugge',T.DEFENSE,'영국 폐색선 2척을 저지하세요. 2척이 운하에서 자침하면 항만 방어 실패입니다.','Stop two British blockships. Two scuttled in the canal mean defeat.',{exclusiveObjective:true}),
 10:profile('somme',T.DEFENSE,'랜드쉽 9대 중 7대의 궤도·엔진을 끊으세요. 3대가 최종 방어선을 넘으면 패배합니다.','Disable tracks or engines on seven of nine landships. Three breaches mean defeat.'),
 16:profile('jutland',T.ESCORT_INTERCEPT,'순양함 3척 중 2척을 이탈 항로까지 보호하세요. 기함 격파는 필수가 아닙니다.','Protect two of three cruisers until they reach the escape route.'),
 15:profile('paris-night',T.SABOTAGE,'발전기 2곳을 끊어 방공망을 소등한 뒤 야간 귀환 지점으로 이탈하세요.','Destroy both generators to black out the defenses, then reach the night exit.',{exclusiveObjective:true}),
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
export function automaticMapMissionsAllowed(game){return !world(game)?.mapMission?.reservesEvents&&!mapCombatProfile(game)?.exclusiveObjective;}
export function prioritizeMapConvoy(game){
 const p=mapCombatProfile(game);
 // Other maps retain the convoy in their eligible random pool. Only supply
 // maps give it the old guaranteed precedence; no new convoy timer is created.
 return !world(game)?.mapMission?.reservesEvents&&(!p||!p.exclusiveObjective&&p.type===T.INTERDICT_SUPPLY);
}
export function mapRegionalMissionChance(game,type,fallback=.6){
 if(world(game)?.mapMission?.reservesEvents)return 0;
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

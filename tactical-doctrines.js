// Sortie-local choices; never enter the upgrade or special-equipment pool.
import {WWI_EQUIPMENT} from './wwi-equipment.js';
import {SPECIAL_DOCTRINES} from './airframe-doctrines.js';
export {SPECIAL_DOCTRINES};
export const TACTICAL_FAMILIES=Object.freeze(['GUN','SPEED','EXPLOSIVE','FORMATION','SURVIVAL']);
export const TACTICAL_FAMILY_NAMES=Object.freeze({GUN:'기관총',SPEED:'속도',EXPLOSIVE:'폭발물',FORMATION:'편대',SURVIVAL:'생존'});
const EN_COPY={
 gunPrecision:['Three tightly grouped bursts, followed by a firing gap.','Concentrated fire on one target','A pause after each burst'],
 gunSuppression:['Sweeping volleys cover the approach from left to right.','Sustained coverage of formations','Lower damage per round'],
 explosiveFocus:['Concentrate explosive weapons and bombing on a narrow target area.','Large or clustered targets','Weaker against scattered enemies'],
 explosiveArea:['Disperse explosive weapons and bombing across enemy approaches.','Cover enemy approaches','Lower single-target concentration'],
 wingReinforcement:['Keep existing wing firepower and add two support aircraft.','Existing wings plus wider coverage','New support aircraft have lower firepower'],
 wingElite:['Wingmen coordinate priority-target passes and regroup.','Coordinated priority attacks','Fewer targets engaged at once'],
 speedStrike:['Attack on a fast straight approach, then leave to prepare another pass.','Entry and egress attacks','Less effective in sustained turns'],
 speedDuel:['Gain an attack opportunity by turning onto a nearby enemy’s tail.','Close rear pursuit','No bonus on straight fly-throughs'],
 survivalRepair:['After taking damage, leave nearby enemies to make limited repairs.','Recover after a safe escape','No repairs while engaged'],
 survivalCounter:['After taking damage, face a nearby enemy for a brief counterattack.','Close defensive retaliation','Short window and cooldown'],
 highSpeedIntercept:['Concentrate fire on a fast entry; leave before the next interception.','Flight and fire coordination','Requires another attack pass'],
 fireLink:['Repeated gun hits trigger a staggered rocket chain that follows surviving contacts.','Ordnance follows your gun target','Link cooldown'],
 crossfire:['Player and wingmen attack from different angles.','Multi-angle pressure','Wingmen must reach position'],
 defensiveSuppression:['After taking damage, suppress a nearby threat.','Close defensive fire','Limited post-hit opportunity'],
 diveBombing:['A fast approach hit opens a rocket strike and a staggered bomb spread.','Entry and bombing coordination','Requires cooldown and re-entry'],
 formationBreakthrough:['Wingmen join a fast attack pass, then regroup.','Synchronized wing attack','Reduced nearby cover during the pass'],
 emergencyEscape:['A safe escape after damage finishes an active reload and restores maneuver readiness.','Leave danger quickly','Limited while staying engaged'],
 guidedBombing:['Wing hits guide a staggered rocket chain onto the marked target and live weakpoints.','Wing-guided bombing','Wingmen must acquire a target'],
 blockingBombing:['After damage, fly clear to lay successive timed bombs along your rear pursuit path.','Block pursuit','Less useful against enemies ahead'],
 mutualCover:['Wingmen prioritize nearby threats when you are in danger.','Close emergency cover','Less focus on offensive targets']
};
const english=id=>({enDescription:EN_COPY[id][0],enAdvantage:EN_COPY[id][1],enWeakness:EN_COPY[id][2]});
const doctrine=(id,family,value,name,enName,description,advantage,weakness,followups)=>Object.freeze({id,family,value,name,enName,description,...english(id),advantage,weakness,followups:Object.freeze(followups),icon:`tactical-icons/${id}.webp`});
export const TACTICAL_DOCTRINES=Object.freeze([
 doctrine('gunPrecision','GUN','precision','정밀 집중 사격','Precision Burst','좁은 탄도로 3연속 점사 후 재정비합니다.','대형·단일 표적 집중','점사 뒤 사격 공백',['damage','rate','spread']),
 doctrine('gunSuppression','GUN','suppression','연속 제압 사격','Sustained Suppression','연속 사격으로 접근 경로를 좌우로 훑어 제압합니다.','여러 방향에 지속 화망','개별 탄환 위력 감소',['spread','rate','damage']),
 doctrine('explosiveFocus','EXPLOSIVE','focus','집중 폭격','Concentrated Bombing','폭발물과 폭격을 좁은 표적 구역에 집중합니다.','대형·밀집 목표 집중','넓게 흩어진 적에 불리',['rockets','explosives','combinedProjectiles']),
 doctrine('explosiveArea','EXPLOSIVE','area','광역 차단','Area Denial','폭발물과 폭격을 여러 접근 경로에 분산합니다.','편대와 접근 경로 차단','단일 표적 집중률 감소',['mines','explosives','combinedProjectiles']),
 doctrine('wingReinforcement','FORMATION','reinforcement','편대 증원 전술','Wing Reinforcements','기존 편대의 화력을 유지하고 지원기 2기가 합류합니다.','기존 편대 유지·다방향 엄호','추가 지원기는 화력이 낮음',['wingman','command','bomber']),
 doctrine('wingElite','FORMATION','elite','정예 편대 전술','Elite Wing','윙맨이 주요 표적에 협동 돌입하고 이탈·재집결합니다.','위협 표적 협동 공격','소수 표적에 전력 집중',['command','fighterSupply','wingman']),
 doctrine('speedStrike','SPEED','strike','일격이탈 전술','Boom and Zoom','고속 직선 진입으로 공격하고 이탈해 다음 공격을 준비합니다.','돌입·이탈 연계','지속 선회전에는 불리',['turn','mercedesEngine','damage']),
 doctrine('speedDuel','SPEED','duel','선회 결투 전술','Turning Duel','근접 선회로 적 후방을 점유할 때 공격 기회를 얻습니다.','근접 후방 추격','직선 돌파에는 효과 없음',['turn','rate','spread']),
 doctrine('survivalRepair','SURVIVAL','repair','응급 수리 전술','Emergency Repairs','피격 후 적에게서 충분히 이탈하면 제한적으로 수리합니다.','안전한 이탈 후 복귀','교전 중에는 수리 불가',['armor','turn','regen']),
 doctrine('survivalCounter','SURVIVAL','counter','피탄 역습 전술','Counterattack','피격 후 가까운 적을 향해 기수를 돌리면 제한된 반격 기회를 얻습니다.','근거리 방어 반격','짧은 기회와 재사용 대기',['armor','damage','cooldown'])
]);
const composite=(id,families,name,enName,description,advantage,weakness)=>Object.freeze({id,families:Object.freeze(families),name,enName,description,...english(id),advantage,weakness,icon:`tactical-icons/${id}.webp`});
export const COMPOSITE_TACTICS=Object.freeze([
 composite('highSpeedIntercept',['GUN','SPEED'],'고속 요격','High-speed Interception','고속 진입 사격을 집중시키고 이탈 후 다음 요격을 준비합니다.','기동과 사격 연계','이탈·재진입 필요'),
 composite('fireLink',['GUN','EXPLOSIVE'],'화력 연계','Linked Fire','반복 명중한 표적에 로켓을 연속 발사해 공격을 이어갑니다.','사격 표적에 폭발물 집중','연계 공격 재사용 대기'),
 composite('crossfire',['GUN','FORMATION'],'교차 사격','Crossfire','플레이어와 윙맨이 서로 다른 각도에서 협동 사격합니다.','여러 방향에서 압박','윙맨의 접근 필요'),
 composite('defensiveSuppression',['GUN','SURVIVAL'],'방어 제압','Defensive Suppression','피격 위기에서 가까운 위협에 방어 사격을 연계합니다.','근거리 위협 제압','피격 후 제한된 기회'),
 composite('diveBombing',['SPEED','EXPLOSIVE'],'급강하 폭격','Diving Bombardment','고속 진입 명중 후 로켓과 연속 폭탄으로 돌입 경로를 타격합니다.','돌입과 폭격 연계','재진입·재사용 대기 필요'),
 composite('formationBreakthrough',['SPEED','FORMATION'],'편대 돌파','Formation Breakthrough','고속 진입에 윙맨이 함께 돌입한 뒤 재집결합니다.','편대의 동시 돌입','돌입 중 주변 엄호 감소'),
 composite('emergencyEscape',['SPEED','SURVIVAL'],'긴급 이탈','Emergency Egress','피격 후 안전하게 이탈하면 재장전을 마치고 회피 기동을 회복합니다.','위험 지역에서 빠른 이탈','교전 유지 시 효과 제한'),
 composite('guidedBombing',['EXPLOSIVE','FORMATION'],'폭격 유도','Wing-guided Bombing','윙맨이 명중한 표적과 약점에 로켓을 연속 유도합니다.','윙맨 표적에 폭격 집중','윙맨의 표적 확보 필요'),
 composite('blockingBombing',['EXPLOSIVE','SURVIVAL'],'차단 폭격','Blocking Bombardment','피격 후 이탈하면 후방 추격 경로에 시차 폭탄을 연속 투하합니다.','후방 추격 차단','전방 공격에는 불리'),
 composite('mutualCover',['FORMATION','SURVIVAL'],'상호 엄호','Mutual Cover','위험에 처하면 윙맨이 가까운 위협을 우선 엄호합니다.','위기 시 근접 보호','공격 표적 집중도 감소')
]);
export function availableTacticalEntries(p){
 if(!p||p.mission?.unarmed)return [];
 const counts=p.weaponModSelections||{},mods=p.weaponMods||{};
 return [
  ...TACTICAL_DOCTRINES.filter(d=>(counts[d.family]||0)>=5&&!mods[d.family]),
  ...COMPOSITE_TACTICS.filter(d=>!p.compositeTactic&&d.families.some((a,i)=>!!mods[a]&&(counts[a]||0)>=5&&(counts[d.families[1-i]]||0)>=3)),
  ...SPECIAL_DOCTRINES.filter(d=>(counts[d.family]||0)>=5&&!p.bomberTransfer&&!p.upgrades?.strutterAirbrake&&!SPECIAL_DOCTRINES.some(d=>p.upgrades?.[d.id]))
 ];
}
export const TACTICAL_BY_ID=Object.freeze(Object.fromEntries([...TACTICAL_DOCTRINES,...COMPOSITE_TACTICS,...SPECIAL_DOCTRINES].map(x=>[x.id,x])));
export const TACTICAL_DEFER_ID='deferComposite';
const growthSignature=p=>TACTICAL_FAMILIES.map(f=>`${f}:${p.weaponModSelections?.[f]||0}:${p.weaponMods?.[f]||''}`).join('|');
export function tacticalChoices(p){
 if(!p||p.mission?.unarmed)return null;
 const counts=p.weaponModSelections||{},mods=p.weaponMods||{};
 // Deterministic order is shared by solo, local co-op and the authoritative host.
 const family=TACTICAL_FAMILIES.find(f=>(counts[f]||0)>=5&&!mods[f]);
 if(family)return {kind:'doctrine',family,choices:TACTICAL_DOCTRINES.filter(d=>d.family===family).map(d=>d.id)};
 if(p.compositeTactic)return null;
 const choices=COMPOSITE_TACTICS.filter(({families:[a,b]})=>(!!mods[a]&&(counts[a]||0)>=5&&(counts[b]||0)>=3)||(!!mods[b]&&(counts[b]||0)>=5&&(counts[a]||0)>=3)).map(d=>d.id);
 return choices.length&&p.deferredCompositeGrowth!==growthSignature(p)?{kind:'composite',choices}:null;
}
export function selectTactical(p,id){
 const offer=tacticalChoices(p);
 if(id===TACTICAL_DEFER_ID){if(offer?.kind!=='composite')return false;p.deferredCompositeGrowth=growthSignature(p);return true;}
 if(!availableTacticalEntries(p).some(d=>d.id===id))return false;
 const item=TACTICAL_BY_ID[id];
 if(item.specialDoctrine){if(!p.acquireAirframeTransfer?.(id))return false;p.upgrades??={};p.upgrades[id]=1;p.upgradeRarities??={};p.upgradeRarities[id]='tactical';}
 else if(item.families)p.compositeTactic=id;
 else {p.weaponMods={...p.weaponMods,[item.family]:item.value};
  if(item.family==='GUN'){p.weaponModBurst=0;p.weaponModSweep=-1;for(const station of p.bomberTransfer?.stations||[]){station.weaponModBurst=0;station.weaponModSweep=-1;}}
  if(item.family==='FORMATION'&&p.hp>0)p.ensureWingmen?.();
 }
 p.event?.('tacticalAdopted',id);return true;
}
const equipmentFamilies=Object.freeze({...Object.fromEntries(WWI_EQUIPMENT.map(e=>[e.id,[e.family]])),amatolCharge:['EXPLOSIVE'],motorCannon:['EXPLOSIVE'],bomberTransfer:['EXPLOSIVE'],mgTransfer:['GUN'],airshipTransfer:['FORMATION'],aceWingman:['FORMATION'],lufberyCircle:['FORMATION','SURVIVAL'],goeringBaton:['FORMATION'],redScarf:['SPEED'],prancingHorse:['SPEED','SURVIVAL'],sacredCowling:['GUN','SURVIVAL'],immelmannManual:['SPEED'],flightGloves:['GUN','EXPLOSIVE'],telescope:['GUN'],quadLewis:['GUN'],maximBelt:['GUN'],rearGunner:['GUN'],sparkPlug:['SURVIVAL'],steelPlate:['SURVIVAL'],rankinShell:['EXPLOSIVE','SURVIVAL'],kaiserFog:['SURVIVAL'],fogCompass:['SURVIVAL'],mauserAceKiller:['GUN','EXPLOSIVE'],cow37:['GUN','EXPLOSIVE'],badinGauge:['SPEED','GUN'],heineckeRettungsfallschirm:['SURVIVAL'],ironCross:['SURVIVAL'],grunkreuz:['SURVIVAL'],loEmblem:['GUN','FORMATION'],boelckeDicta:[],urLeica:[]});
export function tacticalEquipmentFamilies(id){return equipmentFamilies[id]||[];}
export function tacticalFollowupWeight(p,id,family){
 let weight=1;for(const d of TACTICAL_DOCTRINES)if(p.weaponMods?.[d.family]===d.value&&d.followups.includes(id))weight+=.22;
 if(family&&Object.keys(p.upgrades||{}).some(k=>p.upgrades[k]&&tacticalEquipmentFamilies(k).includes(family)))weight+=.12;
 if(family&&TACTICAL_BY_ID[p.compositeTactic]?.families?.includes(family))weight+=.12;
 return Math.min(1.55,weight);
}

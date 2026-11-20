import {applySalamanderHull} from './secret-flight-fits.js';

const recipe=(id,body,catalysts,ranks,extra,icon,ko,en,detail)=>Object.freeze({id,body,catalysts,ranks,extra,icon,ko,en,detail});
export const SECRET_WEAPONS=Object.freeze([
 recipe('fokkerLeimberger',['quadLewis'],['maximBelt'],{GUN:5},{},'secret_fokker_leimberger_12barrel.webp','포커-라임베르거','Fokker–Leimberger',['기관총을 쏠 때마다 12연장 회전 총열이 같은 방향으로 한 발씩 더 쏴서 탄막이 두 배가 됩니다. 37mm 기관포를 쓰는 중이면 회전 총열이 따로 4발씩 연사합니다.','Every machine-gun round is matched by a round from the 12-barrel rotary gun, doubling the stream. With the 37 mm cannon fitted, the rotary gun fires its own 4-round bursts.']),
 recipe('vickersPomPom',['cow37'],['buckinghamBelt'],{GUN:5,EXPLOSIVE:3},{},'secret_vickers_pompom.webp','빅커스 폼폼 기관포','Vickers Pom-Pom',['기관포를 빠르게 연사합니다. 포탄은 표적에 맞거나 일정 거리를 날아가면 터져 주위에 파편을 뿌립니다.','Rapid heavy shells scatter fragments on contact or after a short flight.']),
 recipe('eliteAirWing',['aceWingman'],[],{FORMATION:5},{wings:2,cooldown:3},'secret_elite_air_wing.webp','정예 전투비행단','Elite Air Wing',['상설 편대기의 조종사가 에이스로 교체됩니다. 에이스마다 공격 방식과 전용 기술이 다릅니다.','Assigns distinct ace pilots and abilities to permanent wingmen.']),
 recipe('longRangeBombers',['goeringBaton','fighterSupply'],['cooperRack'],{FORMATION:5,EXPLOSIVE:3},{wings:2,bomber:1},Object.freeze({central:'secret_bombers_central.webp',entente:'secret_bombers_entente.webp'}),'장거리 폭격전대','Long-Range Bomber Squadron',['상설 편대기가 아군 진영의 중폭격기로 바뀝니다. 폭격기들이 차례로 폭탄을 떨어뜨립니다.','Permanent wingmen become faction heavy bombers and deliver staggered strikes.']),
 recipe('sn1650',['veryPistol'],['prototypeAmmo'],{EXPLOSIVE:5},{bomber:1},'secret_sn_1650.webp','S.N. 1,650파운드','S.N. 1,650-pound Bomb',['첫 유효 지정에 1,650파운드 폭탄을 부릅니다. 이후에는 유효 지정 두 번마다 투하하며, 편대가 잠시 없어도 신호권총을 사용할 수 있습니다.','The first valid Very designation calls a 1,650-pound bomb. Subsequent bombs follow every two designations, even while no wingmen are available.']),
 recipe('fliegerpfeil',['cooperRack'],['flechettes'],{EXPLOSIVE:5},{},'secret_fliegerpfeil.webp','플리거파일 — 강철비','Fliegerpfeil — Steel Rain',['세 번째 쿠퍼 폭탄이 폭발하면 강철 화살 24발을 내보냅니다. 16발은 공격 방향에 집중되고 8발은 주변으로 퍼집니다. 화살에 폭발물 성장이 적용됩니다.','Every third Cooper bomb releases 24 steel darts. Sixteen rake the attack lane and eight spread around the impact. Darts scale with explosive upgrades.']),
 recipe('grunkreuzBarrage',['grunkreuz'],['kaiserFog','cooperRack'],{EXPLOSIVE:4,SURVIVAL:3},{},'secret_grunkreuz_barrage.webp','그륀크로이츠 연막폭격','Grünkreuz Smoke Barrage',['독가스를 실은 폭탄이 터지면 더 넓은 범위에 독가스와 엄폐 연막이 퍼집니다.','Compatible bomb impacts spread a larger gas cloud and concealment smoke.']),
 recipe('farnboroughFirechain',['fieryGrapnel'],['buckinghamBelt'],{SPEED:5,EXPLOSIVE:3},{},'secret_farnborough_firechain.webp','판버러 화염쇄','Farnborough Firechain',['화염 그래플넬이 명중하면 불붙은 케이블이 가까운 적 최대 두 기까지 뻗습니다.','On a hit, the fiery grapnel extends to up to two other nearby targets.']),
 recipe('badinBreakthrough',['badinGauge'],['mercedesEngine'],{SPEED:5},{},'secret_badin_breakthrough.webp','바댕 전속돌파','Badin Breakthrough',['고속 직진하면 양쪽 날개 뒤로 적기를 흩뜨리는 후류가 생깁니다. 속도를 유지하면 짧은 선회 중에도 후류가 이어집니다.','High-speed straight flight leaves twin vortices that damage aircraft and disrupt formations. A short turn at speed keeps laying the wake.']),
 recipe('nesterovRam',['steelPlate'],[],{SURVIVAL:5,SPEED:3},{},'secret_nesterov_ram.webp','네스테로프 충각','Nesterov Ram',['고속으로 적기에 들이받으면 속도에 비례해 강한 피해를 줍니다. 자신이 받는 충돌 피해는 70% 줄어듭니다.','Ram enemy aircraft at high speed to deal heavy damage that scales with your speed. Reduces the collision damage you take by 70%.']),
 recipe('explosiveArmor',['steelPlate'],['amatolCharge'],{SURVIVAL:5,EXPLOSIVE:3},{},'secret_explosive_armor.webp','폭렬장갑판','Explosive Armor',['내구도 피해를 입으면 피격 방향부터 기체 둘레에 소형 폭탄 여섯 발을 차례로 터뜨립니다. 15초 뒤 다시 발동할 수 있습니다.','After taking hull damage, six small bombs burst around the aircraft, starting on the incoming side. Rearms after 15 seconds.']),
 recipe('villarPerosa',['mauserAceKiller'],['flightGloves'],{GUN:5},{},'secret_villar_perosa.webp','빌라르-페로사 M1915','Villar–Perosa M1915',['마우저와 별도로 사거리 안의 에이스를 우선해 쌍열 기관총을 점사합니다. 기관총 피해와 연사 강화가 적용되고 산탄 수는 점사 피해를 낮추지 않습니다.','Twin-barrel bursts alongside the Mauser prioritize nearby aces. Gun damage and fire-rate upgrades apply without a scatter penalty.']),
 recipe('ketteringBug',['bomber'],['wimperisSight'],{EXPLOSIVE:5,FORMATION:3},{},'secret_kettering_bug.webp','케터링 버그','Kettering Bug',['폭격 지원 호출마다 유효 표적이 있으면 무인 복엽기가 출격합니다. 처음 조준한 지점까지 날아가 날개를 떼고 급강하합니다.','Each bombing support call with a valid target launches a pilotless biplane. It flies to its fixed aim point, sheds its wings and dives.']),
 recipe('rankenExplosiveDarts',['rankinShell'],['buckinghamBelt'],{SURVIVAL:4,GUN:3},{},'secret_ranken_darts.webp','랭킨 작렬 다트','Ranken Explosive Darts',['3.2초마다 후방의 가까운 적기를 조준해 다트 다섯 발을 쏩니다. 박힌 다트가 차례로 터져 주변 적기에도 피해를 주며, 버킹엄 소이탄을 장착하면 불을 붙입니다.','Every 3.2 seconds, fires five darts at a nearby pursuer. Embedded darts burst in sequence and damage nearby aircraft. Fitting the Buckingham belt adds ignition.']),
 recipe('lePrieurSalvo',['rockets'],['combinedProjectiles'],{EXPLOSIVE:5},{rockets:3},'secret_le_prieur.webp','르 프리외르 8연장 로켓','Le Prieur Eight-Rocket Salvo',['전방 사거리 안에 적이 들어오면 양쪽 날개에서 로켓 여덟 발을 번갈아 발사합니다. 각 로켓은 발사한 방향으로 곧게 날아갑니다.','When a target enters forward range, eight wing-mounted rockets ignite in succession. Each flies straight from its release.']),
 recipe('davisRecoilless',['motorCannon'],['hytheCamera'],{EXPLOSIVE:5,GUN:3},{},'secret_davis.webp','데이비스 무반동포','Davis Recoilless Gun',['하이스 카메라가 포착한 전방 표적에 중포를 쏩니다. 반동을 상쇄하려고 뒤로 발사한 탄도 가까운 추격기를 타격합니다.','Fires a heavy shell at a forward target analyzed by the Hythe camera. Rear countershot can hit close pursuers.']),
 recipe('salamanderArmor',['sparkPlug'],['steelPlate'],{SURVIVAL:5},{armor:3},'secret_salamander.webp','소프위드 TF.2 살라만더 장갑동체','Sopwith TF.2 Salamander Armored Fuselage',['장착할 때 최대 내구도가 늘고 그만큼 회복합니다. 일반 탄환 피해를 18% 줄이며 비상수선 간격이 8초로 짧아집니다.','Fitting increases maximum durability and repairs the added hull. Ordinary bullet damage is reduced by 18%, and emergency repairs cycle every eight seconds.']),
 recipe('puw50',['mines'],['prototypeAmmo'],{EXPLOSIVE:5},{mines:3},'secret_puw.webp','PuW 50 kg 항공폭탄','PuW 50 kg Aerial Bomb',['비행 경로를 따라 50kg 폭탄 네 발을 차례로 떨어뜨립니다. 폭탄은 투하 순간의 비행 방향과 속도를 따라 밀려납니다.','Drops a stick of bombs along the flight path. Each falls from its own release point with inherited velocity.']),
 recipe('siemensHalske',['strutterAirbrake'],['immelmannManual'],{SPEED:5},{},'secret_siemens_halske.webp','지멘스-할스케 Sh.III 반전 로터리 엔진','Siemens–Halske Sh.III Counter-Rotary Engine',['선회할 때 속도가 덜 떨어집니다. 한쪽으로 선회하다 반대쪽으로 틀면 속도를 더 빨리 회복합니다.','Reduces speed loss in ordinary turns and recovers speed faster when reversing a sustained turn.'])
]);
export const SECRET_WEAPON_BY_ID=Object.freeze(Object.fromEntries(SECRET_WEAPONS.map(r=>[r.id,r])));
const SECRET_TRIGGER=Object.freeze({
 fokkerLeimberger:['주무장 사격 · 37mm 장착 시 독립 점사','Primary fire · independent bursts with the 37 mm'],
 vickersPomPom:['기관포 사격 · 명중하거나 신관이 작동하면 공중폭발','Cannon fire · bursts on contact or at the fuse'],
 eliteAirWing:['상설 편대기가 교전할 때 에이스별 기술 발동','Permanent wingmen use their own ace skills in combat'],
 longRangeBombers:['상설 폭격기가 사거리 안의 적에게 두 발을 차례로 투하','Permanent bombers drop two staggered bombs on enemies in range'],
 sn1650:['첫 유효 지정에 투하 · 이후 유효 지정 2회마다','First valid designation · then every two valid designations'],
 fliegerpfeil:['쿠퍼 폭탄 세 번째 투하분이 폭발할 때','When every third Cooper bomb detonates'],
 grunkreuzBarrage:['독가스 탑재 폭탄이 폭발할 때','When a gas-loaded bomb detonates'],
 farnboroughFirechain:['그래플넬이 명중하고 가까운 곳에 다른 적이 있을 때','On a grapnel hit with other enemies nearby'],
 badinBreakthrough:['고속 직진으로 시작 · 속도를 유지하면 짧은 선회에도 후류 지속','Build speed in a straight line · carry the wake into a fast turn'],
 nesterovRam:['고속으로 적기에 닿을 때','On high-speed contact with an enemy aircraft'],
 explosiveArmor:['내구도 피해를 받을 때 · 15초마다 한 번','Taking hull damage · once every 15 seconds'],
 villarPerosa:['가까운 적기가 사거리 안에 들어올 때','When an enemy aircraft enters close range'],
 ketteringBug:['폭격 지원을 호출할 때 유효 표적을 조준','Locks a valid target on a bombing support call'],
 rankenExplosiveDarts:['후방 가까이에 적기가 있을 때 · 3.2초 주기','A pursuer in close rear range · 3.2-second cycle'],
 lePrieurSalvo:['진행 방향에 사거리 안의 적이 있을 때','When a target is in range ahead of you'],
 davisRecoilless:['하이스 카메라로 분석한 전방 적이 사거리 안에 있을 때','An in-range forward target analyzed by the Hythe camera'],
 salamanderArmor:['장착 즉시 내구도 증가 · 피탄 경감 · 8초마다 비상수선','More hull on fitting · reduced gunfire damage · repairs every 8 seconds'],
 puw50:['비행 중 일정 거리를 이동할 때 한 발씩 투하','While flying · one drop per interval along your path'],
 siemensHalske:['한쪽으로 선회하다 반대 방향으로 틀 때','When you reverse a sustained turn']
});
export const secretTrigger=(recipe,en)=>SECRET_TRIGGER[recipe.id][en?1:0];
export const secretWeaponIcon=(r,faction)=>'./augmentation-icons-384/'+(typeof r.icon==='string'?r.icon:r.icon[faction]||r.icon.entente);
export const secretWeaponForBody=(p,body)=>p.upgrades?.[body]?SECRET_WEAPON_BY_ID[p.secretWeaponState?.slots?.[body]]:undefined;
export const hasSecretWeapon=(p,id)=>SECRET_WEAPON_BY_ID[id]?.body.some(body=>secretWeaponForBody(p,body)?.id===id)===true;
const NEW_STATE=()=>({slots:{},effects:{}});
export function secretWeaponEffect(p,id){
 const state=p.secretWeaponState??=NEW_STATE();return state.effects[id]??={};
}

// Only ordinary choices have ranks; owning a legendary can never add a rank.
const PICK_FAMILY=Object.freeze({damage:'GUN',rate:'GUN',spread:'GUN',precisionSynchronizer:'GUN',rockets:'EXPLOSIVE',mines:'EXPLOSIVE',explosives:'EXPLOSIVE',directFuse:'EXPLOSIVE',fragmentationFuse:'EXPLOSIVE',command:'FORMATION',wingman:'FORMATION',bomber:'FORMATION',turn:'SPEED',inertiaRetainer:'SPEED',maneuverSpring:'SPEED',armor:'SURVIVAL',regen:'SURVIVAL',cooldown:'SURVIVAL',emergencyPlating:'SURVIVAL',emergencyDope:'SURVIVAL'});
const familyCounts=upgrades=>{
 const counts={GUN:0,EXPLOSIVE:0,FORMATION:0,SPEED:0,SURVIVAL:0};
 for(const [id,family] of Object.entries(PICK_FAMILY))counts[family]+=Math.max(0,Math.floor(Number(upgrades?.[id])||0));
 return counts;
};
// Materials commit a direction too. Reuse recipe requirements to connect their
// ordinary prerequisites, without changing rarity or unlocking a fourth family.
export function secretWeaponOrdinaryProgress(p,id,familyLimit=3){
 const family=PICK_FAMILY[id];if(!family)return false;
 const u=p?.upgrades||{},ranks=familyCounts(u),slots=p?.secretWeaponState?.slots||{};
 const committed=Object.keys(ranks).filter(f=>ranks[f]>0);
 return SECRET_WEAPONS.some(r=>{
  if(Object.values(slots).includes(r.id)||!r.body.some(b=>!slots[b])||![...r.body,...r.catalysts].some(b=>u[b]))return false;
  const required=new Set([...committed,...Object.keys(r.ranks)]);
  for(const [key,n] of Object.entries(r.extra))if(key==='wings'?(p.permanentWingman||0)<n:(u[key]||0)<n){const f=key==='wings'?'FORMATION':PICK_FAMILY[key];if(f)required.add(f);}
  if(required.size>familyLimit)return false;
  return (r.ranks[family]||0)>ranks[family]||
   (r.extra[id]||0)>(u[id]||0)||id==='wingman'&&(r.extra.wings||0)>(p.permanentWingman||0)||
   r.body.includes(id)&&!r.body.some(b=>u[b])||r.catalysts.includes(id)&&!u[id];
 });
}
// Draft guidance shares the evolution recipes. Do not steer a committed build
// toward a recipe whose missing ordinary families can no longer be acquired.
export function secretWeaponMaterialLinks(p,id,familyLimit=3){
 const upgrades=p?.upgrades||{},ranks=familyCounts(upgrades),slots=p?.secretWeaponState?.slots||{};
 const committed=Object.keys(ranks).filter(f=>ranks[f]>0),links=new Set();
 for(const r of SECRET_WEAPONS){
  if(Object.values(slots).includes(r.id))continue;
  const bodies=r.body.filter(body=>!slots[body]&&(body!=='fighterSupply'||p?.permanentWingman>0)),groups=[bodies,...r.catalysts.map(c=>[c])];
  const group=groups.findIndex(ids=>ids.includes(id));
  if(group<0||!bodies.length||groups[group].some(key=>upgrades[key]))continue;
  const required=new Set([...committed,...Object.keys(r.ranks)]);
  for(const [key,n] of Object.entries(r.extra)){
   if(key==='wings'){if((p.permanentWingman||0)<n&&!upgrades.goeringBaton)required.add('FORMATION');}
   else if((upgrades[key]||0)<n&&PICK_FAMILY[key])required.add(PICK_FAMILY[key]);
  }
  if(required.size>familyLimit)continue;
  for(let i=0;i<groups.length;i++)if(i!==group)for(const key of groups[i])if(upgrades[key])links.add(key);
 }
 return [...links];
}
function ranksReachedFirst(p,a,b){
 const ledger=p.equipmentLedger,initial=familyCounts(ledger?.baseline?.upgrades??p.upgrades),history=ledger?.history||[];
 if(initial[a]>=3&&initial[b]>=3)return a;
 if(initial[a]>=3)return a;
 if(initial[b]>=3)return b;
 for(const item of history){
  const family=PICK_FAMILY[item.id];
  if(item.active!==false&&family&&++initial[family]===3&&(family===a||family===b))return family;
 }
 return a;
}
function ownedBody(p,r,upgrades,choice){
 const bodies=r.body.filter(id=>upgrades[id]);
 if(bodies.length<2)return bodies[0];
 const history=p.equipmentLedger?.history||[],baseline=p.equipmentLedger?.baseline?.upgrades||{};
 return bodies.find(id=>baseline[id])||history.find(e=>e.active!==false&&e.id!==choice?.removeId&&bodies.includes(e.id))?.id||bodies.find(id=>id!==choice?.id)||bodies[0];
}
function status(p,r,upgrades,ranks,wings,choice){
 const body=ownedBody(p,r,upgrades,choice);
 const materials=(body?[]:[r.body]).concat(r.catalysts.filter(id=>!upgrades[id]).map(id=>[id]));
 const missing=[];
 for(const [id,n] of Object.entries(r.ranks))if(ranks[id]<n)missing.push([id,n-ranks[id]]);
 for(const [id,n] of Object.entries(r.extra)){
  const value=id==='wings'?wings:upgrades[id]||0;
  if(value<n)missing.push([id,n-value]);
 }
 return {recipe:r,body,materials,missing,ready:!materials.length&&!missing.length};
}
function statuses(p,upgrades,ranks,wings,choice){return SECRET_WEAPONS.map(r=>status(p,r,upgrades,ranks,wings,choice));}
export function secretWeaponProgress(p,recipe){
 const row=status(p,recipe,p.upgrades||{},familyCounts(p.upgrades),p.permanentWingman||0);
 const fitted=p.secretWeaponState?.slots?.[row.body];
 return {...row,fitted,held:[row.body,...recipe.catalysts.filter(id=>p.upgrades?.[id])].filter(Boolean)};
}

export function secretAcquisitions(events,first=0){
 const ids=new Set();
 for(let i=first;i<events.length;i++){
  const event=events[i];
  if(event.type!=='secretWeaponEvolved'||event.acquisitionCard||!SECRET_WEAPON_BY_ID[event.text])continue;
  event.acquisitionCard=true;
  ids.add(event.text);
 }
 return [...ids];
}
function evolutions(p,rows,slots){
 const ready=rows.filter(q=>q.ready&&!slots[q.body]&&!Object.values(slots).includes(q.recipe.id));
 if(ready.some(q=>q.recipe.id==='nesterovRam')&&ready.some(q=>q.recipe.id==='explosiveArmor')){
  const first=ranksReachedFirst(p,'SPEED','EXPLOSIVE');
  return ready.filter(q=>q.recipe.id!==(first==='SPEED'?'explosiveArmor':'nesterovRam'));
 }
 return ready;
}
export function reconcileSecretWeapons(p,{announce=true}={}){
 if(p._equipmentReplay||!p.upgrades)return [];
 const slots=p.secretWeaponState?.slots||{};
 const ready=evolutions(p,statuses(p,p.upgrades,familyCounts(p.upgrades),p.permanentWingman||0),slots);
 if(!ready.length)return [];
 const state=p.secretWeaponState??=NEW_STATE();
 for(const {recipe:r,body} of ready){
  state.slots[body]=r.id;
  if(r.id==='vickersPomPom')applySecretPomFit(p);
  if(r.id==='salamanderArmor')applySalamanderHull(p,{heal:true});
  if(announce){
   if(r.id==='sn1650')p.wwiVeryCooldown=0;
   if(r.id==='salamanderArmor')p.mccuddenRepairTimer=Math.min(p.mccuddenRepairTimer??8,8);
   (state.notices??={})[r.id]=(p.t||0)+1.2;
   p.event?.('secretWeaponEvolved',r.id);
  }
 }
 return ready.map(q=>q.recipe.id);
}
export function applySecretPomFit(p){
 if(!p.weapon)return;
 const old=p.weapon.belt,belt=Math.round(30*(p.upgrades.maximBelt?1.75:1));
 p.baseBeltCapacity=30;
 p.weapon={...p.weapon,belt,reload:p.weapon.reload*(3/4.6),rpm:Math.round(60/.35)};
 p.ammo=p.ammo.map(n=>Math.min(belt,n+Math.max(0,belt-old)));
 p.reloadTime*=3/4.6;
}
export function removeSecretWeapon(p,body){
 const state=p.secretWeaponState,id=state?.slots?.[body];
 if(!id)return;
 delete state.slots[body];delete state.effects[id];
 if(state.notices)delete state.notices[id];
}
export function previewSecretWeapons(p,{id,rarity,removeId,permanentWingman}={}){
 if(!id)return [];
 const before=p.upgrades||{},upgrades={...before},slots={...p.secretWeaponState?.slots};
 if(removeId){delete upgrades[removeId];delete slots[removeId];}
 upgrades[id]=(upgrades[id]||0)+1;
 const oldWings=p.permanentWingman||0;
 const wings=permanentWingman??Math.min(7,Math.max(0,oldWings+(id==='wingman'?1:id==='goeringBaton'?3:0)-(removeId==='goeringBaton'?3:0)));
 const beforeRanks=familyCounts(before),afterRanks=familyCounts(upgrades);
 if(rarity==='legendary'&&PICK_FAMILY[id])afterRanks[PICK_FAMILY[id]]=beforeRanks[PICK_FAMILY[id]];
 const choice={id,removeId},rows=statuses(p,upgrades,afterRanks,wings,choice);
 const immediately=new Set(evolutions(p,rows,slots).map(q=>q.recipe.id));
 return rows.flatMap(q=>{
  const r=q.recipe;if(Object.values(slots).includes(r.id)||q.body&&slots[q.body])return [];
  if(q.ready)return immediately.has(r.id)&&!status(p,r,before,beforeRanks,oldWings).ready?[{...q,hint:'immediate'}]:[];
  const old=status(p,r,before,beforeRanks,oldWings),remaining=q.missing.reduce((n,[,count])=>n+count,0);
   if(!q.body||q.materials.length+remaining>3||old.materials.length+old.missing.reduce((n,[,count])=>n+count,0)<=q.materials.length+remaining)return [];
   return [{...q,hint:q.materials.length?'material':'near'}];
 });
}

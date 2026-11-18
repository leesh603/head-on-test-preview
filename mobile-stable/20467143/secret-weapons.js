import {applySalamanderHull} from './secret-flight-fits.js';

const recipe=(id,body,catalysts,ranks,extra,icon,ko,en,detail)=>Object.freeze({id,body,catalysts,ranks,extra,icon,ko,en,detail});
export const SECRET_WEAPONS=Object.freeze([
 recipe('fokkerLeimberger',['quadLewis'],['maximBelt'],{GUN:5},{},'secret_fokker_leimberger_12barrel.webp','포커-라임베르거','Fokker–Leimberger',['기관총을 쏠 때마다 12연장 회전 총열이 같은 방향으로 한 발씩 더 쏴서 탄막이 두 배가 됩니다. 37mm 기관포를 쓰는 중이면 회전 총열이 따로 4발씩 연사합니다.','Every machine-gun round is matched by a round from the 12-barrel rotary gun, doubling the stream. With the 37 mm cannon fitted, the rotary gun fires its own 4-round bursts.']),
 recipe('vickersPomPom',['cow37'],['buckinghamBelt'],{GUN:5,EXPLOSIVE:3},{},'secret_vickers_pompom.webp','빅커스 폼폼 기관포','Vickers Pom-Pom',['기관포를 빠르게 연사합니다. 포탄은 표적에 맞거나 일정 거리를 날아가면 터져 주위에 파편을 뿌립니다.','Rapid heavy shells scatter fragments on contact or after a short flight.']),
 recipe('eliteAirWing',['aceWingman'],[],{FORMATION:5},{wings:2,cooldown:3},'secret_elite_air_wing.webp','정예 전투비행단','Elite Air Wing',['상설 편대기의 조종사가 에이스로 교체됩니다. 에이스마다 공격 방식과 전용 기술이 다릅니다.','Assigns distinct ace pilots and abilities to permanent wingmen.']),
 recipe('longRangeBombers',['goeringBaton','fighterSupply'],['cooperRack'],{FORMATION:5,EXPLOSIVE:3},{wings:2,bomber:1},Object.freeze({central:'secret_bombers_central.webp',entente:'secret_bombers_entente.webp'}),'장거리 폭격전대','Long-Range Bomber Squadron',['상설 편대기가 아군 진영의 중폭격기로 바뀝니다. 폭격기들이 차례로 폭탄을 떨어뜨립니다.','Permanent wingmen become faction heavy bombers and deliver staggered strikes.']),
 recipe('sn1650',['veryPistol'],['prototypeAmmo'],{EXPLOSIVE:5},{bomber:1},'secret_sn_1650.webp','S.N. 1,650파운드','S.N. 1,650-pound Bomb',['베리 신호탄으로 폭격 지점을 세 번 지정하면, 세 번째 지점에 1,650파운드 폭탄이 떨어집니다.','After three successful Very pistol strikes, calls a 1,650-pound bomb onto the third marker.']),
 recipe('fliegerpfeil',['cooperRack'],['flechettes'],{EXPLOSIVE:5},{},'secret_fliegerpfeil.webp','플리거파일 — 강철비','Fliegerpfeil — Steel Rain',['세 번째 쿠퍼 폭탄이 폭발하면 강철 화살 24개가 사방으로 퍼집니다.','Every third Cooper bomb bursts into a radial spray of steel darts.']),
 recipe('grunkreuzBarrage',['grunkreuz'],['kaiserFog','cooperRack'],{EXPLOSIVE:4,SURVIVAL:3},{},'secret_grunkreuz_barrage.webp','그륀크로이츠 연막폭격','Grünkreuz Smoke Barrage',['독가스를 실은 폭탄이 터지면 더 넓은 범위에 독가스와 엄폐 연막이 퍼집니다.','Compatible bomb impacts spread a larger gas cloud and concealment smoke.']),
 recipe('farnboroughFirechain',['fieryGrapnel'],['buckinghamBelt'],{SPEED:5,EXPLOSIVE:3},{},'secret_farnborough_firechain.webp','판버러 화염쇄','Farnborough Firechain',['화염 그래플넬이 명중하면 불붙은 케이블이 가까운 적 최대 두 기까지 뻗습니다.','On a hit, the fiery grapnel extends to up to two other nearby targets.']),
 recipe('badinBreakthrough',['badinGauge'],['mercedesEngine'],{SPEED:5},{},'secret_badin_breakthrough.webp','바댕 전속돌파','Badin Breakthrough',['속도를 높여 직진하면 양쪽 날개 뒤로 소용돌이가 생깁니다. 휘말린 적기는 피해를 받고 편대가 흩어집니다.','Sustained high-speed flight leaves twin vortices that damage aircraft and disrupt formations.']),
 recipe('nesterovRam',['steelPlate'],[],{SURVIVAL:5,SPEED:3},{},'secret_nesterov_ram.webp','네스테로프 충각','Nesterov Ram',['고속으로 적기에 들이받으면 속도에 비례해 강한 피해를 줍니다. 자신이 받는 충돌 피해는 70% 줄어듭니다.','Ram enemy aircraft at high speed to deal heavy damage that scales with your speed. Reduces the collision damage you take by 70%.']),
 recipe('explosiveArmor',['steelPlate'],['amatolCharge'],{SURVIVAL:5,EXPLOSIVE:3},{},'secret_explosive_armor.webp','폭렬장갑판','Explosive Armor',['피해를 입으면 기체 둘레로 소형 폭탄 여섯 발을 뿌립니다. 다시 발동하기까지 15초가 걸립니다.','After taking damage, scatters six small bombs around your aircraft. Rearms after 15 seconds.']),
 recipe('villarPerosa',['mauserAceKiller'],['flightGloves'],{GUN:5},{},'secret_villar_perosa.webp','빌라르-페로사 M1915','Villar–Perosa M1915',['마우저와 별도로 가까운 적기에 쌍열 기관총을 짧게 연사합니다. 에이스를 우선 조준하며, 비숍이 비행장갑 기동 중이면 사격이 빨라집니다.','Fires short twin-barrel bursts alongside the Mauser, prioritizing nearby aces. Bishop’s glove maneuver quickens the bursts.']),
 recipe('ketteringBug',['bomber'],['wimperisSight'],{EXPLOSIVE:5,FORMATION:3},{},'secret_kettering_bug.webp','케터링 버그','Kettering Bug',['폭격 지원을 부르면 무인 복엽기가 출격합니다. 처음 조준한 지점까지 날아가 날개를 떼고 급강하해 폭발합니다.','Launches a pilotless biplane on a bombing call. It flies to a point fixed at launch, sheds its wings and crashes.']),
 recipe('rankenExplosiveDarts',['rankinShell'],['buckinghamBelt'],{SURVIVAL:4,GUN:3},{},'secret_ranken_darts.webp','랭킨 작렬 다트','Ranken Explosive Darts',['3.2초마다 후방의 가까운 적기를 조준해 다트 다섯 발을 쏩니다. 박힌 다트가 차례로 터져 주변 적기에도 피해를 주며, 버킹엄 소이탄을 장착하면 불을 붙입니다.','Every 3.2 seconds, fires five darts at a nearby pursuer. Embedded darts burst in sequence and damage nearby aircraft. Fitting the Buckingham belt adds ignition.']),
 recipe('lePrieurSalvo',['rockets'],['combinedProjectiles'],{EXPLOSIVE:5},{rockets:3},'secret_le_prieur.webp','르 프리외르 8연장 로켓','Le Prieur Eight-Rocket Salvo',['양쪽 날개에서 로켓 여덟 발을 번갈아 발사합니다. 로켓은 발사한 방향으로 곧게 날아갑니다.','Ignites eight wing-mounted rockets in succession on their own firing cycle. Each flies straight after launch.']),
 recipe('davisRecoilless',['motorCannon'],['hytheCamera'],{EXPLOSIVE:5,GUN:3},{},'secret_davis.webp','데이비스 무반동포','Davis Recoilless Gun',['하이스 카메라가 포착한 전방 표적에 중포를 쏩니다. 반동을 상쇄하려고 뒤로 발사한 탄도 가까운 추격기를 타격합니다.','Fires a heavy shell at a forward target analyzed by the Hythe camera. Rear countershot can hit close pursuers.']),
 recipe('salamanderArmor',['sparkPlug'],['steelPlate'],{SURVIVAL:5},{armor:3},'secret_salamander.webp','소프위드 TF.2 살라만더 장갑동체','Sopwith TF.2 Salamander Armored Fuselage',['장갑동체가 최대 내구도를 늘리고, 장착할 때 늘어난 만큼 회복합니다. 비상수선 키트의 회복량도 함께 늘어납니다.','Raises maximum durability and immediately repairs the added amount. Periodic emergency repair scales with the larger hull.']),
 recipe('puw50',['mines'],['prototypeAmmo'],{EXPLOSIVE:5},{mines:3},'secret_puw.webp','PuW 50 kg 항공폭탄','PuW 50 kg Aerial Bomb',['비행 경로를 따라 50kg 폭탄 네 발을 차례로 떨어뜨립니다. 폭탄은 투하 순간의 비행 방향과 속도를 따라 밀려납니다.','Drops a stick of bombs along the flight path. Each falls from its own release point with inherited velocity.']),
 recipe('siemensHalske',['strutterAirbrake'],['immelmannManual'],{SPEED:5},{},'secret_siemens_halske.webp','지멘스-할스케 Sh.III 반전 로터리 엔진','Siemens–Halske Sh.III Counter-Rotary Engine',['선회할 때 속도가 덜 떨어집니다. 한쪽으로 선회하다 반대쪽으로 틀면 속도를 더 빨리 회복합니다.','Reduces speed loss in ordinary turns and recovers speed faster when reversing a sustained turn.'])
]);
export const SECRET_WEAPON_BY_ID=Object.freeze(Object.fromEntries(SECRET_WEAPONS.map(r=>[r.id,r])));
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
 const ledger=p.equipmentLedger,initial=familyCounts(ledger?.baseline?.upgrades),history=ledger?.history||[];
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
   if(!q.body||q.materials.length+remaining>2||old.materials.length+old.missing.reduce((n,[,count])=>n+count,0)<=q.materials.length+remaining)return [];
   return [{...q,hint:q.materials.length?'material':'near'}];
 });
}

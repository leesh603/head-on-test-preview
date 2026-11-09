const recipe=(id,body,catalysts,ranks,extra,icon,ko,en,detail)=>Object.freeze({id,body,catalysts,ranks,extra,icon,ko,en,detail});
export const SECRET_WEAPONS=Object.freeze([
 recipe('fokkerLeimberger',['quadLewis'],['maximBelt'],{GUN:5},{},'secret_fokker_leimberger.webp','포커-라임베르거','Fokker–Leimberger',['쿼드 루이스의 사선에 고속 회전 기관총 탄류를 추가합니다.','Adds a high-speed rotary stream to the Quad Lewis firing lanes.']),
 recipe('vickersPomPom',['cow37'],['buckinghamBelt'],{GUN:5,EXPLOSIVE:3},{},'secret_vickers_pompom.webp','빅커스 폼폼 기관포','Vickers Pom-Pom',['중량 포탄을 더 빠르게 쏘며 탄창과 재장전을 개선합니다.','Fires heavy shells faster with a larger belt and quicker reload.']),
 recipe('eliteAirWing',['aceWingman'],[],{FORMATION:5},{wings:2,cooldown:3},'secret_elite_air_wing.webp','정예 전투비행단','Elite Air Wing',['상설 편대기에 에이스 조종사와 전용 능력을 배치합니다.','Assigns distinct ace pilots and abilities to permanent wingmen.']),
 recipe('longRangeBombers',['goeringBaton','fighterSupply'],['cooperRack'],{FORMATION:5,EXPLOSIVE:3},{wings:2,bomber:1},Object.freeze({central:'secret_bombers_central.webp',entente:'secret_bombers_entente.webp'}),'장거리 폭격전대','Long-Range Bomber Squadron',['상설 편대가 진영별 폭격기로 바뀌어 쿠퍼 폭탄을 투하합니다.','Permanent wingmen fly faction bombers and release Cooper bombs.']),
 recipe('sn1650',['veryPistol'],['prototypeAmmo'],{EXPLOSIVE:5},{bomber:1},'secret_sn_1650.webp','S.N. 1,650파운드','S.N. 1,650-pound Bomb',['유효한 베리 신호탄 세 번마다 대형 폭탄을 요청합니다.','Calls a heavy bomb after every three valid Very signals.']),
 recipe('fliegerpfeil',['cooperRack'],['flechettes'],{EXPLOSIVE:5},{},'secret_fliegerpfeil.webp','플리거파일 — 강철비','Fliegerpfeil — Steel Rain',['쿠퍼 투하 세 번마다 강철 다트가 쏟아집니다.','Drops a shower of steel darts every third Cooper release.']),
 recipe('grunkreuzBarrage',['grunkreuz'],['kaiserFog','cooperRack'],{EXPLOSIVE:4,SURVIVAL:3},{},'secret_grunkreuz_barrage.webp','그륀크로이츠 연막폭격','Grünkreuz Smoke Barrage',['적합한 폭격 지점의 가스가 넓어지고 연막이 함께 퍼집니다.','Compatible bomb impacts spread a larger gas cloud and concealment smoke.']),
 recipe('farnboroughFirechain',['fieryGrapnel'],['buckinghamBelt'],{SPEED:5,EXPLOSIVE:3},{},'secret_farnborough_firechain.webp','판버러 화염쇄','Farnborough Firechain',['화염 그래플넬의 케이블이 가까운 표적 최대 세 기를 잇습니다.','Extends the fiery grapnel to up to three nearby targets.']),
 recipe('badinBreakthrough',['badinGauge'],['mercedesEngine'],{SPEED:5},{},'secret_badin_breakthrough.webp','바댕 전속돌파','Badin Breakthrough',['직진 충전 후 고속 비행 경로의 적기에 후류 피해를 줍니다.','Charged high-speed flight damages aircraft along its wake.']),
 recipe('nesterovRam',['steelPlate'],[],{SURVIVAL:5,SPEED:3},{},'secret_nesterov_ram.webp','네스테로프 충각','Nesterov Ram',['고속 충돌로 적에게 피해를 주고 자신의 충돌 피해를 줄입니다.','High-speed rams damage the target and reduce collision damage to the pilot.']),
 recipe('explosiveArmor',['steelPlate'],['amatolCharge'],{SURVIVAL:5,EXPLOSIVE:3},{},'secret_explosive_armor.webp','폭렬장갑판','Explosive Armor',['유효 피격 시 소형 반격 폭탄 여섯 발을 방출합니다.','Releases six small counter-bombs after a damaging hit.'])
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
  if(!(q.body||r.catalysts.some(key=>upgrades[key]))||old.materials.length+old.missing.reduce((n,[,count])=>n+count,0)<=q.materials.length+remaining)return [];
  return [{...q,hint:!q.materials.length&&remaining<=2?'near':'material'}];
 });
}

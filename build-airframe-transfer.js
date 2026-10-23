import {modGunRounds,modGunDamage,modGunFan,modGunInterval} from './weapon-modifications.js';
// Three mutually exclusive, sortie-only fits. Pilot and chosen aircraft IDs stay intact.
export const AIRFRAME_TRANSFER_IDS=Object.freeze(['bomberTransfer','mgTransfer','airshipTransfer']);
export const BUILD_TRANSFER_DESCRIPTIONS=Object.freeze({
 mgTransfer:'대형 중무장 공격기로 전환합니다. 전방 기관총 피해 +18%, 추가 기관총 2정 강화 및 표적 추적, 후방 사수 유지. 선회기동 대신 탄환을 요격하는 화망 전개를 사용합니다. 속도 −26%, 선회력 −38%, 피탄 면적 증가. 다른 기체 전환과 동시 장착 불가.',
 airshipTransfer:'편대 지휘 비행선으로 전환합니다. 하부 호위기 2기 출격(상시 윙맨 합산 최대 7기), 집중사격 및 기존 편대 강화 계승. 선회기동 대신 전방위 대공 방어망을 사용합니다. 기존 내구도 유지, 속도 −55%, 선회력 −74%, 피탄 면적 크게 증가. 다른 기체 전환과 동시 장착 불가.'
});
export const BUILD_TRANSFER=Object.freeze({
 mgTransfer:Object.freeze({
  entente:Object.freeze({name:'Caudron R.11',sprite:'transfer-caudron-r11',kind:'gunship',hp:1,speed:.74,turn:.62,scale:1.95,front:37,rear:30,hullLength:39,hullWidth:58,response:2.6,recovery:.52,gunInterval:.25,gunPower:.78,belt:70,reload:2.4,stationOffsets:[-16,16]}),
  central:Object.freeze({name:'AEG J.I',sprite:'transfer-aeg-ji',kind:'gunship',hp:1,speed:.74,turn:.62,scale:1.76,front:25,rear:19,hullLength:29,hullWidth:53,response:2.6,recovery:.52,gunInterval:.25,gunPower:.78,belt:70,reload:2.4,stationOffsets:[-10,10]})
 }),
 airshipTransfer:Object.freeze({
  entente:Object.freeze({name:'R.29',sprite:'transfer-r29',kind:'airship',hp:1,speed:.45,turn:.26,scale:3.9,front:105,rear:84,hullLength:137,hullWidth:34,response:1.25,recovery:.28,gunInterval:.65,gunPower:.4,belt:44,reload:3.2,stationOffsets:[-19,19,0]}),
  central:Object.freeze({name:'Zeppelin L30',sprite:'transfer-l30',kind:'airship',hp:1,speed:.45,turn:.26,scale:4.1,front:109,rear:88,hullLength:145,hullWidth:42,response:1.25,recovery:.28,gunInterval:.65,gunPower:.4,belt:44,reload:3.2,stationOffsets:[-25,25,0]})
 })
});
const WEIGHT_IDS=Object.freeze({bomberTransfer:['bomber','rockets','mines','explosives','combinedProjectiles','amatolCharge','motorCannon'],mgTransfer:['damage','rate','spread','quadLewis','maximBelt','rearGunner','telescope','flightGloves'],airshipTransfer:['wingman','command','fighterSupply','goeringBaton','lufberyCircle']});
export function transferWeight(g,id){
 const ids=WEIGHT_IDS[id];if(!ids)return 1;
 const count=ids.reduce((sum,key)=>sum+Math.max(0,Number(g.upgrades?.[key])||0),0);
 return 1+Math.min(1.5,count*.25);
}
// Preserve the existing uniform shuffle and RNG sequence on uncommitted builds.
export function pickSpecialEquipment(g,pool,count=3){
 const source=[...pool];
 const optional=picks=>{if(picks.some(u=>!AIRFRAME_TRANSFER_IDS.includes(u.id)))return picks;const alternatives=pool.filter(u=>!AIRFRAME_TRANSFER_IDS.includes(u.id));if(alternatives.length)picks[picks.length-1]=alternatives[Math.floor(g.rng()*alternatives.length)];else picks.pop();return picks;};
 if(source.every(u=>transferWeight(g,u.id)===1)){
  for(let i=source.length-1;i>0;i--){const j=Math.floor(g.rng()*(i+1));[source[i],source[j]]=[source[j],source[i]];}
  return optional(source.slice(0,count));
 }
 const picks=[];
 while(source.length&&picks.length<count){
  let ticket=g.rng()*source.reduce((n,u)=>n+transferWeight(g,u.id),0),index=source.length-1;
  for(let i=0;i<source.length;i++){ticket-=transferWeight(g,source[i].id);if(ticket<0){index=i;break;}}
  picks.push(source.splice(index,1)[0]);
 }
 return optional(picks);
}
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const world=p=>p.combatWorld?.()||p;
export function transferStationPosition(p,front,lateral){const ca=Math.cos(p.a),sa=Math.sin(p.a);return {x:p.x+ca*front-sa*lateral,y:p.y+sa*front+ca*lateral};}
export function tickTransferGuns(p,dt,gunnerAim,gunnerTarget){
 const fit=p.bomberTransfer,w=world(p);
 const concealed=p.bishopTime>0||p.ballCloak>0||p.aceRetreat129;
 fit.stations??=fit.stationOffsets.map((lateral,i)=>({front:fit.kind==='airship'?(i===2?-fit.rear:fit.front*.45):fit.front,lateral,aim:p.a+(fit.kind==='airship'?i*2*Math.PI/3:0),timer:.1+i*.08,ammo:Math.round(fit.belt*(p.upgrades?.maximBelt?1.75:1)),reload:0,flash:0}));
 for(let index=0;index<fit.stations.length;index++){
  const station=fit.stations[index];station.flash=Math.max(0,station.flash-dt);
  const capacity=Math.round(fit.belt*(p.upgrades?.maximBelt?1.75:1));
  if(concealed)continue;
  if(p.unlimitedAmmo){station.reload=0;station.ammo=capacity;}
  if(station.reload>0){station.reload=Math.max(0,station.reload-dt);if(!station.reload)station.ammo=capacity;continue;}
  station.timer=Math.max(0,station.timer-dt);
  const sector=fit.kind==='airship'?p.a+index*2*Math.PI/3:p.a+(index%2?.3:-.3);
  const candidate=gunnerTarget(p,fit.kind==='airship'?500:430,false,sector);
  const bearing=candidate?Math.atan2(candidate.y-p.y,candidate.x-p.x):p.a;
  const target=fit.kind==='gunship'&&Math.abs(wrap(bearing-p.a))>.85?null:candidate;
  const desired=target?Math.atan2(target.y-p.y,target.x-p.x):p.a;
  station.aim=gunnerAim(station.aim,desired,dt,fit.kind==='gunship'?2.5:1.15);
  if(fit.kind==='airship'&&(!target||Math.abs(wrap(station.aim-desired))>.18))continue;
  if(station.timer>0||fit.kind==='gunship'&&p.transferFiring===false)continue;
  const cadence=Math.max(.1,fit.gunInterval*(p.rate/(p.buildBaseline?.rate||p.transferBaseRate||p.rate)));
  const shots=Math.max(1,p.shots||1),normalCount=Math.min(3,shots),count=modGunRounds(p,normalCount,4),spread=modGunFan(p,p.buildGunFan?.(.07)??.07);
  station.timer=modGunInterval(p,cadence,station,normalCount,4);
  const damage=p.damage*p.normalGunMultiplier()*fit.gunPower*Math.sqrt(shots)/normalCount*modGunDamage(p,normalCount,count);
  const position=transferStationPosition(p,station.front,station.lateral);
  for(let i=0;i<count;i++){
   const a=station.aim+(i-(count-1)/2)*spread;
   // Existing personal round modifiers apply; these remain machine-gun projectiles.
   const b={...position,vx:Math.cos(a)*520,vy:Math.sin(a)*520,life:p.longRange?p.shotLifetime(520):1.2,enemy:false,ownerId:p.id,gun:0,damage,hit:new Set(),transferGun:true,transferStation:index,visualType:'normal'};
   w.bullets.push(p.applySpecialRound(b,null));
  }
  p.roundsFired+=count;station.flash=.09;if(!p.unlimitedAmmo)station.ammo--;
  if(station.ammo<=0)station.reload=fit.reload*p.equipmentReloadMultiplier();
  p.event('shot','');
 }
}


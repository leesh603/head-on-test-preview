// Airframe roles compose the existing handling, pursuit, round and wing hooks.
// They are independent of aircraft tier and never change pilot skills or gun power.
export const AIRCRAFT_COMBAT_ROLES=Object.freeze({
 INTERCEPTOR:Object.freeze({id:'INTERCEPTOR',name:'요격형',nameEn:'Interceptor',tip:'직선 진입 후 속도를 회복하며 이탈',tipEn:'Recover speed during a straight exit'}),
 TURN:Object.freeze({id:'TURN',name:'선회전형',nameEn:'Turn fighter',tip:'꼬리를 물면 감속해 근접 추격 유지',tipEn:'Ease closing speed when tracking a tail'}),
 HEAVY:Object.freeze({id:'HEAVY',name:'중무장형',nameEn:'Heavy fighter',tip:'직선 사격선을 유지하면 탄도가 수렴',tipEn:'Hold a straight firing line for tighter grouping'}),
 GROWTH:Object.freeze({id:'GROWTH',name:'성장형',nameEn:'Growth fighter',tip:'낮은 레벨업 비용으로 강화 조합을 먼저 완성',tipEn:'Lower XP cost brings upgrades earlier'}),
 FORMATION:Object.freeze({id:'FORMATION',name:'편대전 특화형',nameEn:'Formation fighter',tip:'윙맨을 넓게 벌려 양쪽 사격선 확보',tipEn:'Wider wingman spacing opens flanking fire'})
});
const R=AIRCRAFT_COMBAT_ROLES;
const growthCosts=Object.freeze({eindecker:.72,airco_dh2:.8});
export const aircraftGrowthCost=(plane,fallback)=>growthCosts[plane]??fallback;

// Only IDs reachable through solo/coop sortie selection. Livery aliases are
// intentional: aircraft rules do not alter their pilots' skills or armament.
const style=(role,name,mode,condition,weakness,tuning={})=>Object.freeze({
 ...R[role],name,tip:condition,mode,condition,weakness,...tuning
});
export const SORTIE_COMBAT_STYLES=Object.freeze({
 fokker:style('TURN','저속 선회전','slow','연속 선회로 감속하면 회전반경 축소','직선 추격과 속도 회복', {threshold:.87,yaw:1.38}),
 albatros_d2:style('HEAVY','중속 사격선','steady','0.65초 직진 후 중속 사격 탄도 수렴·좁은 기수 조준 보정','급선회하면 조준 이점 소멸',{steady:.65,group:.38,maxEnergy:1}),
 eindecker:style('GROWTH','초기 동조사격·성장','early','레벨 8 이전 짧은 직진 후 조준 안정; 기존 빠른 성장 유지','8레벨 이후 초기 조준 보너스 종료',{steady:.3,group:.35}),
 camel:style('TURN','우선회 근거리 난전','close','240px 안 적과 우선회 시 작은 회전반경','원거리 추격·좌선회',{range:240,yaw:1.32}),
 collishaw_sopwith:style('FORMATION','연속 선회 편대전','sustain','같은 방향으로 0.7초 선회하면 감속 완화','좌우를 반복하면 선회 유지 이점 소멸',{hold:.7,retention:.55}),
 baracca_nieuport:style('TURN','경량 반전','reverse','0.35초 이상 선회 후 반대로 꺾으면 0.4초 빠른 반전','반복 반전 중 속도 손실',{hold:.35,window:.4,yaw:1.5}),
 udet_fokkerdv:style('INTERCEPTOR','짧은 이탈·재진입','exit','선회 후 0.3초 직진하면 빠르게 속도 회복','연속 원선회',{steady:.3,recover:2.6}),
 guynemer_spad:style('HEAVY','중무장 진입 사격','steady','0.95초 직선 사격선 유지 시 강한 탄도 수렴·좁은 기수 조준 보정','준비 중 방향을 바꾸면 다시 조준',{steady:.95,group:.22}),
 re7:style('HEAVY','복좌 직선 방어','defensive','0.8초 직진 중 후방 320px 내 적이 있으면 속도 회복','저속 선회전; 기존 무장만 사용',{steady:.8,recover:2,range:320}),
 goering_fokkerd7:style('FORMATION','후반 편대 안정','late','8레벨부터 지속 선회 시 속도 유지; 기존 넓은 윙맨 대형','초반에는 선회 유지 보너스 없음',{hold:.6,retention:.52}),
 se5a:style('INTERCEPTOR','고에너지 재돌입','energy','속도 90% 이상에서 완만하게 돌면 에너지 유지','급선회는 이점 소멸',{threshold:.90,retention:.7}),
 bristol_duo:style('FORMATION','전후방 통과 교전','twoSeat','0.5초 직진 후 전방 탄도 안정·좁은 기수 조준 보정·후방 탄도 추가 수렴','선회 중 사격선 흐트러짐',{steady:.5,group:.65,rearGroup:.28}),
 halberstadt_duo:style('FORMATION','후방 방어 복좌기','twoSeat','0.75초 직진하면 후방 사수 탄도 수렴·좁은 기수 조준 보정','전방 공격은 기존 탄도 유지',{steady:.75,group:1,rearGroup:.2}),
 airco_dh2:style('GROWTH','저속 안쪽 선회','slow','속도 86% 아래에서 높은 선회력·기존 빠른 성장','직선 추격',{threshold:.86,yaw:1.42}),
 berthold_pfalz:style('HEAVY','방어적 이탈','defensive','후방 360px 적을 두고 0.55초 직진하면 에너지 회복','적을 향해 도는 동안 이점 소멸',{steady:.55,recover:3,range:360}),
 wolff_albatros:style('INTERCEPTOR','중속 재공격','exit','선회 후 0.55초 직진하면 재공격 속도 회복','길게 선회하면 감속',{steady:.55,recover:2.1}),
 loewenhardt_fokkerd7:style('INTERCEPTOR','후반 고속 안정','late','8레벨부터 같은 방향 0.9초 선회 시 속도 유지','보너스 전 선회 준비시간',{hold:.9,retention:.65}),
 mccudden_se5a:style('INTERCEPTOR','넓은 고속 선회','energy','속도 92% 이상 완만한 선회에서 높은 에너지 유지','급격한 반전',{threshold:.92,retention:.85}),
 nungesser_nieuport24:style('TURN','반전 후 추격','reverse','0.55초 선회 후 반전하면 0.6초 선회 응답 강화','짧은 좌우 흔들기로는 발동하지 않음',{hold:.55,window:.6,yaw:1.34}),
 rickenbacker_spad:style('INTERCEPTOR','고속 돌입·이탈','pass','0.8초 직진 후 기수 정렬 사격 탄도 수렴·좁은 기수 조준 보정·이탈 회복','급선회 시 회복·조준 이점 종료',{steady:.8,recover:3.4,group:.35}),
 ball_se5a:style('INTERCEPTOR','짧은 재진입 선회','exit','선회 후 0.4초 직진하면 빠른 재진입 회복','선회만 지속하면 이점 없음',{steady:.4,recover:2.8}),
 barker_snipe:style('TURN','장기 난전 선회','sustain','같은 방향으로 1초 이상 선회할 때 감속 완화','짧은 반전 난전',{hold:1,retention:.7}),
 luke_nieuport28:style('TURN','고속 경량 반전','reverse','0.6초 선회 후 반전하면 0.35초 강한 응답','장시간 선회·반전 후 감속',{hold:.6,window:.35,yaw:1.58}),
 brumowski_albatros:style('HEAVY','짧은 중속 사격','steady','0.4초 직진으로 빠른 조준 안정','긴 준비형 기체보다 수렴폭 작음',{steady:.4,group:.6}),
 gontermann_fokker:style('TURN','느린 표적 추적','slow','속도 84% 아래에서 정밀한 저속 선회','발동까지 긴 감속',{threshold:.84,yaw:1.48}),
 lothar_dr1:style('TURN','연속 공격 선회','sustain','같은 방향 0.5초 선회 후 감속 완화','Dr.I 기본형보다 저속 회전반경 이점 작음',{hold:.5,retention:.4}),
 junkers_d1:style('HEAVY','중기체 공격 타이밍','steady','1.15초 직진 유지 후 집중 탄도','늦은 준비·급선회 때 재조준',{steady:1.15,group:.18}),
 proctor_se5a:style('INTERCEPTOR','긴 직선 요격','pass','1.1초 직진 후 조준 안정·이탈 중 회복','짧은 돌입에서는 준비 미완료',{steady:1.1,recover:2.5,group:.24}),
 schleich_albatros:style('HEAVY','안정적인 중속 화력','steady','0.8초 직진 후 정밀 사격','기동 중에는 조준 이점 없음',{steady:.8,group:.3}),
 lufbery_nieuport17:style('TURN','지속 경량 선회','sustain','같은 방향 0.85초 선회 후 속도 유지','즉각 반전에는 이점 없음',{hold:.85,retention:.5}),
 baron_albatros:style('HEAVY','중속 돌입 사격','steady','0.55초 직진 후 탄도 안정·좁은 기수 조준 보정','지속 선회 중 이점 소멸',{steady:.55,group:.46})
});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const scripted=g=>g.skillTime>0||g.evadeTime>0||g.chargeTime>0||g.aceRetreat129||g.duoSpinStep>0;
function nearby(g,range,rear=false){
 const world=g.combatWorld?.()||g;
 return (world.enemies||[]).some(e=>e.hp>0&&!e.surface&&!e.stationary&&Math.hypot(e.x-g.x,e.y-g.y)<range&&(!rear||((e.x-g.x)*Math.cos(g.a)+(e.y-g.y)*Math.sin(g.a)<0)));
}

const assigned=Object.freeze({
 eindecker:'GROWTH',airco_dh2:'GROWTH',
 sopwith:'FORMATION',collishaw_sopwith:'FORMATION',goering_fokkerd7:'FORMATION',fokkerd7:'FORMATION',bristol_duo:'FORMATION',halberstadt_duo:'FORMATION',
 spad:'INTERCEPTOR',se5a:'INTERCEPTOR',mccudden_se5a:'INTERCEPTOR',fokkerdv:'INTERCEPTOR',
 fokker:'TURN',camel:'TURN',nieuport:'TURN',nieuport_italian:'TURN',nieuport24:'TURN',nungesser_nieuport24:'TURN',
 albatros:'HEAVY',albatros_d2:'HEAVY',baron_albatros:'HEAVY',pfalz_d3a:'HEAVY',spad12:'HEAVY',re7:'HEAVY',wolff_albatros:'INTERCEPTOR'
});
export function aircraftCombatRole(plane,planes){
 if(SORTIE_COMBAT_STYLES[plane])return SORTIE_COMBAT_STYLES[plane];
 const fit=planes?.[plane];if(!fit)return null;
 const key=assigned[plane];if(key)return R[key];
 const archetype=fit.personality?.archetype;
 if(['TURN_FIGHTER','LOW_SPEED_AGILITY'].includes(archetype))return R.TURN;
 if(['ENERGY_FIGHTER','BOOM_ZOOM'].includes(archetype))return R.INTERCEPTOR;
 if(archetype==='OFFENSIVE_TWO_SEATER')return R.FORMATION;
 return R.HEAVY;
}

export function installAircraftCombatRoles(Game,planes,angleDiff){
 if(Game.prototype.__aircraftCombatRoles)return;Game.prototype.__aircraftCombatRoles=true;
 // Keep the existing levelRequirement and upgrade draft. Only these early fits
 // receive a lower cost; speed, durability, damage and tier remain authoritative.
 for(const [id,cost]of Object.entries(growthCosts))if(planes[id])planes[id].xpCostMultiplier=cost;
 const requirement=Game.prototype.levelRequirement;
 Game.prototype.levelRequirement=function(base){
  this.xpCostMultiplier=aircraftGrowthCost(this.plane,this.xpCostMultiplier);
  return requirement.call(this,base);
 };
 Game.prototype.aircraftCombatRole=function(){return aircraftCombatRole(this.plane,planes)};
 const fly=Game.prototype.flyAirframe;
 Game.prototype.flyAirframe=function(dt,input={}){
  const step=clamp(dt||0,0,.04),before=this.a,profile=SORTIE_COMBAT_STYLES[this.plane];
  const request=Number.isFinite(input.angle)?angleDiff(input.angle,this.a):(input.steer||0);
  const sign=Math.abs(request)>.08?Math.sign(request):0,oldSign=this.aircraftTurnSign||0;
  const held=this.aircraftTurnTime||0;
  if(sign&&oldSign&&sign!==oldSign&&held>=(profile?.hold??.4))this.aircraftReversalTime=profile?.window??.4;
  this.aircraftReversalTime=Math.max(0,(this.aircraftReversalTime||0)-step);
  this.aircraftTurnTime=sign&&sign===oldSign?held+step:0;
  this.aircraftTurnSign=sign;
  const active=!!profile&&!!this.aircraftCombatRole()&&!scripted(this)&&step>0;
  const energy=this.airframeSpeed??1,turn=this.turn;
  let factor=1;
  if(active){
   if(profile.mode==='slow'&&energy<profile.threshold&&held>.25)factor=profile.yaw;
   if(profile.mode==='close'&&sign>0&&nearby(this,profile.range))factor=profile.yaw;
   if(profile.mode==='reverse'&&this.aircraftReversalTime>0)factor=profile.yaw;
  }
  this.turn=turn*factor;let result;
  try{result=fly.call(this,dt,input)}finally{this.turn=turn}
  const yaw=Math.abs(angleDiff(this.a,before));
  this.aircraftStraightTime=yaw<=step*.22?(this.aircraftStraightTime||0)+step:0;
  this.aircraftStyleActive=false;
  if(!active)return result;
  const mode=profile.mode,straight=this.aircraftStraightTime>=(profile.steady??.45);
  let recovery=0,retention=0;
  if(mode==='exit'&&straight)recovery=profile.recover;
  if(mode==='pass'&&straight)recovery=profile.recover;
  if(mode==='defensive'&&straight&&nearby(this,profile.range,true))recovery=profile.recover;
  if(mode==='energy'&&energy>=profile.threshold&&yaw>step*.22&&yaw<turn*step*.65)retention=profile.retention;
  if((mode==='sustain'||mode==='late'&&this.level>=8)&&this.aircraftTurnTime>profile.hold)retention=profile.retention;
  if(retention&&this.airframeSpeed<energy)this.airframeSpeed+=(energy-this.airframeSpeed)*retention;
  // Sustained turns converge to a bounded energy floor, never to full cruise.
  if(retention&&['sustain','late'].includes(mode)){
   const floor=1-(planes[this.plane]?.handling?.drag??.2)*(1-retention);
   if(this.airframeSpeed<floor)this.airframeSpeed+=(floor-this.airframeSpeed)*(1-Math.exp(-step*2));
  }
  if(recovery)this.airframeSpeed+=(1-this.airframeSpeed)*(1-Math.exp(-recovery*step));
  this.aircraftStyleActive=factor!==1||recovery>0||retention>0;
  return result;
 };
 const tail=Game.prototype.updateTailLock;
 Game.prototype.updateTailLock=function(dt){
  const result=tail.call(this,dt);
  if(this.aircraftCombatRole()?.id==='TURN'&&this.tailLocked&&this.pursuitClosingSpeed>22&&!(this.skillTime>0||this.evadeTime>0||this.chargeTime>0)){
   const desired=1-Math.min(.22,this.pursuitClosingSpeed/240),factor=this.pursuitSpeedFactor??1;
   if(desired<factor)this.pursuitSpeedFactor=factor+(desired-factor)*(1-Math.exp(-3.8*Math.max(0,dt||0)));
  }
  return result;
 };
 const round=Game.prototype.applySpecialRound;
 Game.prototype.applySpecialRound=function(b,...args){
  const result=round.call(this,b,...args);
  const profile=SORTIE_COMBAT_STYLES[this.plane],role=this.aircraftCombatRole();
  const straight=this.aircraftStraightTime>(profile?.steady??.65);
  const mode=profile?.mode,energy=this.airframeSpeed??1;
  const aimed=profile?(['steady','twoSeat','pass'].includes(mode)||mode==='early'&&this.level<8):role===R.HEAVY;
  if(aimed&&straight&&(!profile?.maxEnergy||energy<=profile.maxEnergy)&&!scripted(this)&&!b.special&&!b.rocket&&!b.motorCannon&&!b.cow37&&Number.isInteger(b.gun)){
   const rear=this.weapon?.bidirectional&&b.gun===1;
   const group=rear&&profile?.rearGroup!==undefined?profile.rearGroup:(profile?.group??.55);
   const heading=this.gunDirection(b.gun),speed=Math.hypot(b.vx,b.vy);
   // Reuse the existing narrow-cone target query. Single-gun/one-round fits
   // gain a real firing-line benefit too; no damage, rate or ammunition buff.
   const world=this.combatWorld?.()||this;
   const target=profile&&group<1?world.identityTarget?.(.16,mode==='early'?230:rear?300:420,this,heading):null;
   const correction=target?clamp(angleDiff(Math.atan2(target.y-this.y,target.x-this.x),heading),-.08,.08)*(1-group):0;
   const a=heading+angleDiff(Math.atan2(b.vy,b.vx),heading)*group+correction;
   b.vx=Math.cos(a)*speed;b.vy=Math.sin(a)*speed;this.aircraftStyleActive=group<1;
  }
  return result;
 };
 const wing=Game.prototype.wingFormationTarget;
 Game.prototype.wingFormationTarget=function(member,count=this.permanentWingCount()){
  if(this.aircraftCombatRole()?.id!=='FORMATION'||this.skillTime>0||this.upgrades?.lufberyCircle||member.orbit||['collishaw','brumowski'].includes(this.pilot))return wing.call(this,member,count);
  const slot=member.slot??0,offset=this.wingFormationOffset(slot,count),side=count<=1?85:offset.side*1.45,forward=offset.forward+25;
  return{x:this.x+Math.cos(this.a)*forward-Math.sin(this.a)*side,y:this.y+Math.sin(this.a)*forward+Math.cos(this.a)*side};
 };
}

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
const assigned=Object.freeze({
 eindecker:'GROWTH',airco_dh2:'GROWTH',
 sopwith:'FORMATION',collishaw_sopwith:'FORMATION',goering_fokkerd7:'FORMATION',fokkerd7:'FORMATION',bristol_duo:'FORMATION',halberstadt_duo:'FORMATION',
 spad:'INTERCEPTOR',se5a:'INTERCEPTOR',mccudden_se5a:'INTERCEPTOR',fokkerdv:'INTERCEPTOR',
 fokker:'TURN',camel:'TURN',nieuport:'TURN',nieuport_italian:'TURN',nieuport24:'TURN',nungesser_nieuport24:'TURN',
 albatros:'HEAVY',albatros_d2:'HEAVY',baron_albatros:'HEAVY',pfalz_d3a:'HEAVY',spad12:'HEAVY',re7:'HEAVY',wolff_albatros:'INTERCEPTOR'
});
export function aircraftCombatRole(plane,planes){
 if(plane==='loewenhardt_fokkerd7')return null;
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
 for(const [id,cost]of Object.entries({eindecker:.72,airco_dh2:.8}))if(planes[id])planes[id].xpCostMultiplier=cost;
 Game.prototype.aircraftCombatRole=function(){return aircraftCombatRole(this.plane,planes)};
 const fly=Game.prototype.flyAirframe;
 Game.prototype.flyAirframe=function(dt,input={}){
  const before=this.a,result=fly.call(this,dt,input),step=Math.max(0,dt||0);
  const yaw=Math.abs(angleDiff(this.a,before));
  this.aircraftStraightTime=yaw<=step*.22?(this.aircraftStraightTime||0)+step:0;
  const role=this.aircraftCombatRole();
  if(role===R.INTERCEPTOR&&this.aircraftStraightTime>.45&&!(this.skillTime>0||this.evadeTime>0||this.chargeTime>0))
   this.airframeSpeed+=(1-(this.airframeSpeed??1))*(1-Math.exp(-1.6*step));
  return result;
 };
 const tail=Game.prototype.updateTailLock;
 Game.prototype.updateTailLock=function(dt){
  const result=tail.call(this,dt);
  if(this.aircraftCombatRole()===R.TURN&&this.tailLocked&&this.pursuitClosingSpeed>22&&!(this.skillTime>0||this.evadeTime>0||this.chargeTime>0)){
   const desired=1-Math.min(.22,this.pursuitClosingSpeed/240),factor=this.pursuitSpeedFactor??1;
   if(desired<factor)this.pursuitSpeedFactor=factor+(desired-factor)*(1-Math.exp(-3.8*Math.max(0,dt||0)));
  }
  return result;
 };
 const round=Game.prototype.applySpecialRound;
 Game.prototype.applySpecialRound=function(b,...args){
  const result=round.call(this,b,...args);
  if(this.aircraftCombatRole()===R.HEAVY&&this.aircraftStraightTime>.65&&this.skillTime<=0&&!b.special&&!b.rocket&&!b.motorCannon&&!b.cow37&&Number.isInteger(b.gun)){
   const heading=this.gunDirection(b.gun),speed=Math.hypot(b.vx,b.vy),a=heading+angleDiff(Math.atan2(b.vy,b.vx),heading)*.55;
   b.vx=Math.cos(a)*speed;b.vy=Math.sin(a)*speed;
  }
  return result;
 };
 const wing=Game.prototype.wingFormationTarget;
 Game.prototype.wingFormationTarget=function(member,count=this.permanentWingCount()){
  if(this.aircraftCombatRole()!==R.FORMATION||this.skillTime>0||this.upgrades?.lufberyCircle||member.orbit||['collishaw','brumowski'].includes(this.pilot))return wing.call(this,member,count);
  const slot=member.slot??0,offset=this.wingFormationOffset(slot,count),side=count<=1?85:offset.side*1.45,forward=offset.forward+25;
  return{x:this.x+Math.cos(this.a)*forward-Math.sin(this.a)*side,y:this.y+Math.sin(this.a)*forward+Math.cos(this.a)*side};
 };
}

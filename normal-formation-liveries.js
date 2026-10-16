// Deliberate ordinary squadron/camouflage allowlist. Personal ace liveries,
// Jasta 11 boss aircraft and Jasta 27's Goering paint are never candidates.
export const NORMAL_FORMATION_LIVERIES=Object.freeze({
 albatros:Object.freeze(['jasta4_albatros','jasta5_albatros','jasta78b_albatros']),
 fokkerd7:Object.freeze(['jasta18_fokkerd7','fokkerd7','jasta43_fokkerd7']),
 camel:Object.freeze(['dazzle_camel','naval10_camel','belgian_camel','camel']),
 se5a:Object.freeze(['checker_se5a','sqn85_se5a','se5a']),
 nieuport28:Object.freeze(['eagle_nieuport28','nieuport28']),
  nieuport:Object.freeze(['camo_nieuport','nieuport']),
  spad:Object.freeze(['hatring_spad','italian_spad','belgium_spad','spad'])
});
const ordinary=e=>!!e&&!e.bossPilot&&!e.bossPlane&&!e.stageBossBody&&!e.bossMinion&&!e.heavyBomber&&['hunter','scout'].includes(e.type);
export function installNormalFormationLiveries(Game,planes,attach){
 if(Game.prototype.__normalFormationLiveries)return;Game.prototype.__normalFormationLiveries=true;
 Game.prototype.assignNormalFormationLivery=function(member,leader,index=0){
  if(!ordinary(member)||!ordinary(leader))return false;
   // Mixed historical formations retain their distinct bank airframes; don't
   // silently replace the leader's aircraft when its wingman arrives.
   if((member.bankAircraft&&member.escortPlane===member.bankAircraft)||(leader.bankAircraft&&leader.escortPlane===leader.bankAircraft)){member.formationLivery=member.escortPlane||(member.faction==='central'?'albatros':'camel');return true;}
  if(!leader.normalFormationFamily){
   const id=leader.escortPlane||leader.personalityId;
   const families=leader.faction==='central'?((this.t||0)>=180?['albatros','fokkerd7']:['albatros']):((this.t||0)>=180?['camel','se5a','spad','nieuport28']:['camel','nieuport','spad']);
    leader.normalFormationFamily=NORMAL_FORMATION_LIVERIES[id]?id:families[Math.floor((leader.wobble||0)*13+Math.abs(leader.x||0))%families.length];
  }
  const family=leader.normalFormationFamily,pool=NORMAL_FORMATION_LIVERIES[family];
  leader.formationLivery=pool[0];
  // The Albatros squadron paints are D.Va; use that actual registered fit when present.
  const fit=family==='albatros'&&planes.albatros_d5a?'albatros_d5a':family;
  if(planes[fit]){if(leader.escortPlane!==fit){leader.escortPlane=fit;attach(planes,leader,fit)}member.escortPlane=fit;attach(planes,member,fit)}
  member.formationLivery=member===leader?pool[0]:pool[1+(Math.max(1,index)-1)%(pool.length-1)];
  return true;
 };
 Game.prototype.refreshNormalFormationLiveries=function(){
  if(this.state==='playing'){
   // Existing mission-command escorts already have formationLeader. Preserve their
   // movement and only register the ordinary leader and real painted variants.
   const slots=new Map();
   for(const e of this.enemies||[]){const leader=e.formationLeader;
    if(!ordinary(e)||!ordinary(leader)||leader.hp<=0)continue;
    const slot=(slots.get(leader)||0)+1;slots.set(leader,slot);leader.formationCommand=true;
    if(!e.formationLivery)this.assignNormalFormationLivery(e,leader,slot);
   }
  }
 };
 const update=Game.prototype.update;
 Game.prototype.update=function(dt,input={}){this.refreshNormalFormationLiveries();return update.call(this,dt,input)};
}

// Deliberate ordinary squadron/camouflage allowlist. Personal ace liveries,
// Jasta 11 boss aircraft and Jasta 27's Goering paint are never candidates.
export const NORMAL_FORMATION_LIVERIES=Object.freeze({
 albatros:Object.freeze(['jasta4_albatros','jasta5_albatros','jasta78b_albatros']),
 fokkerd7:Object.freeze(['jasta18_fokkerd7','fokkerd7','jasta43_fokkerd7']),
 camel:Object.freeze(['dazzle_camel','camel']),
 se5a:Object.freeze(['checker_se5a','se5a']),
 nieuport28:Object.freeze(['eagle_nieuport28','nieuport28'])
});
const ordinary=e=>!!e&&!e.bossPilot&&!e.bossPlane&&!e.stageBossBody&&!e.bossMinion&&!e.heavyBomber&&['hunter','scout'].includes(e.type);
export function installNormalFormationLiveries(Game,planes,attach){
 if(Game.prototype.__normalFormationLiveries)return;Game.prototype.__normalFormationLiveries=true;
 Game.prototype.assignNormalFormationLivery=function(member,leader,index=0){
  if(!ordinary(member)||!ordinary(leader))return false;
  if(!leader.normalFormationFamily){
   const id=leader.escortPlane||leader.personalityId;
   leader.normalFormationFamily=NORMAL_FORMATION_LIVERIES[id]?id:leader.faction==='central'?((this.t||0)>=360?'fokkerd7':'albatros'):((this.t||0)>=180?'se5a':'camel');
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

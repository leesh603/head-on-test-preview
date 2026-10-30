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
const ordinary=e=>!!e&&!e.transportCarrier&&!e.bossPilot&&!e.bossPlane&&!e.stageBossBody&&!e.bossMinion&&!e.heavyBomber&&['hunter','scout'].includes(e.type);
export function installNormalFormationLiveries(Game,planes,attach){
 if(Game.prototype.__normalFormationLiveries)return;Game.prototype.__normalFormationLiveries=true;
 // Formation membership affects command and movement, never the aircraft's
 // existing type, paint or handling. Keep the hook for director callers.
 Game.prototype.assignNormalFormationLivery=function(){return false};
 Game.prototype.refreshNormalFormationLiveries=function(){
  if(this.state==='playing'){
   // Existing mission-command escorts retain their original aircraft and paint.
   for(const e of this.enemies||[]){const leader=e.formationLeader;
    if(!ordinary(e)||!ordinary(leader)||leader.hp<=0)continue;
    leader.formationCommand=true;
   }
  }
 };
 const update=Game.prototype.update;
 Game.prototype.update=function(dt,input={}){this.refreshNormalFormationLiveries();return update.call(this,dt,input)};
}

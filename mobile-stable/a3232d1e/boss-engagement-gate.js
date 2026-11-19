// A map mission whose quota is already met must not end the moment its boss
// finishes arriving: the boss gets one attack cycle, or is beaten first.
// The caller decides what "beaten" means (leader shot down, encounter cleared).
export const BOSS_ENGAGE_SECONDS=20;
export function bossEngagement(state,encounter,age,beaten=false){
 const contact=!!encounter&&!encounter.arrivalPending;
 if(contact&&state.bossContactAt==null)state.bossContactAt=age;
 const engaged=contact&&(beaten||!!encounter.completed||age-state.bossContactAt>=BOSS_ENGAGE_SECONDS);
 return {contact,engaged,left:contact&&!engaged?Math.max(1,Math.ceil(BOSS_ENGAGE_SECONDS-(age-state.bossContactAt))):0};
}

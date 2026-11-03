// Existing encounter timers keep their reservations; only admission is shared.
// This reads host simulation state and never consumes RNG or changes a deadline.
const live=e=>e?.hp>0&&!e.expired&&!e.crashing&&!e.rivalEscaped;
export function majorEncounterBlocked(g,kind){
 if(g.online&&!g.host)return true;
 const now=g.t||0,d=g.battleDirector;
 if(g.state!=='playing'||g.stageBoss?.stages?.phase==='boss'||g.stageCombatWindow?.ready||
    (g.battleRecoveryUntil||0)>now||(d?.fireResumeAt||0)>now||d?.pattern==='RECOVERY'&&d.endsAt>now)return true;
 // A due scout keeps a bounded admission reservation while the ordinary rest
 // finishes. A later optional mission cannot consume that opening first.
 const recon=g.photoReconDirector;
 if(kind!=='recon'&&recon?.phase==='idle'&&recon.nextIn<=1&&Number.isFinite(recon.admissionDueAt)&&(g.stageCombatWindow?.remaining??Infinity)>=36&&now-recon.admissionDueAt<12)return true;
 if(kind!=='squadron'&&(g.squadronDirector?.owner||g.eliteEnemies?.active||g.eliteEnemies?.pendingEncounter))return true;
 if(kind!=='recon'&&['active','pending','dispatching'].includes(g.photoReconDirector?.phase))return true;
 if(kind!=='intrusion'&&['reserved','warning','entering','active','retreating'].includes(g.intrusionBoss?.phase))return true;
 if(kind!=='mission'&&g.battlefieldEvents?.current?.status==='active')return true;
 if(kind!=='ace'&&(g.enemies||[]).some(e=>live(e)&&(e.bossPilot||e.type==='boss')))return true;
 return false;
}

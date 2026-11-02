/** Host-only opportunity policy. Time is sortie time, never a per-stage clock. */
export const SQUADRON_OPPORTUNITY=Object.freeze({firstAt:45,cooldown:90,retry:18,chance:.35,guaranteedAttempt:4,drySpell:180});
const B=SQUADRON_OPPORTUNITY;
export function newSquadronOpportunity(time=0){return {nextIn:Math.max(0,B.firstAt-time),introPending:time<B.firstAt,waitingForClear:false,misses:0,opportunities:0,pityAdmissions:0,approvedOpportunity:false,bag:[],history:[]};}
export function advanceSquadronOpportunity(s,time,dt,available){
 if(!(dt>0))return false;
 if(s.introPending){s.nextIn=Math.max(0,(s.firstAt??B.firstAt)-time);if(s.nextIn>0)return false;s.introPending=false;}
 s.nextIn=Math.max(0,s.nextIn-Math.min(.04,dt));if(s.nextIn<1e-8)s.nextIn=0;return available&&s.nextIn<=0;
}
export function rollSquadronOpportunity(s,rng,time){
 if(s.approvedOpportunity)return true;
 const overdue=Number.isFinite(time)&&time-(s.lastClearedAt??0)>=B.drySpell;const forced=(s.misses||0)>=B.guaranteedAttempt-1||overdue;s.opportunities=(s.opportunities||0)+1;
 if(forced||rng()<B.chance){s.approvedOpportunity=true;s.approvedByPity=forced;s.approvedByDrySpell=overdue;return true;}
 s.misses=(s.misses||0)+1;s.nextIn=B.retry;return false;
}
export function chooseSquadronFamily(s,eligible,rng){
 const available=new Set(eligible);let choices=(s.bag||[]).filter(id=>available.has(id));
 if(!choices.length){s.bag=[...available];for(let i=s.bag.length-1;i>0;i--){const j=Math.min(i,Math.floor(rng()*(i+1)));[s.bag[i],s.bag[j]]=[s.bag[j],s.bag[i]];}choices=s.bag.slice();}
 if(choices[0]===s.lastFamily&&available.size>1)return choices.find(id=>id!==s.lastFamily)||[...available].find(id=>id!==s.lastFamily);return choices[0]||null;
}
export function commitSquadronOpportunity(s,unitId,family,time){
 s.introPending=false;s.bag=(s.bag||[]).filter(id=>id!==family);s.lastFamily=family;s.lastUnitId=unitId;s.lastAdmissionAt=time;
 (s.history??=[]).push(unitId);if(s.history.length>12)s.history.shift();if(s.approvedByPity)s.pityAdmissions=(s.pityAdmissions||0)+1;if(s.approvedByDrySpell)s.drySpellAdmissions=(s.drySpellAdmissions||0)+1;
 s.misses=0;s.approvedOpportunity=false;s.approvedByPity=false;s.approvedByDrySpell=false;s.waitingForClear=true;s.nextIn=B.cooldown;
}
export function finishSquadronOpportunity(s,time){s.waitingForClear=false;s.nextIn=B.cooldown;s.lastClearedAt=time;s.approvedOpportunity=false;s.approvedByPity=false;s.approvedByDrySpell=false;s.misses=0;}

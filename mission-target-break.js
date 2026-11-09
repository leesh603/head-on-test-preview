// Mission-target fighters (battlefield events) fly outside the pass machine and
// held their nose on the pilot to the end: on main they were the largest single
// source of contact damage (about 30 a minute against a weaving pilot). Once a
// straight line would pass within breakMiss inside breakRange, the fighter
// breaks to one side for breakTime seconds, then the event steering resumes.
export const MISSION_TARGET_BREAK=Object.freeze({breakRange:170,breakMiss:44,breakTime:.45,breakDelta:1.1,breakTurn:1});
const B=MISSION_TARGET_BREAK;
// Named squadrons, aces, elites and photo-reconnaissance flights fly their own
// authored routes; leave them alone.
const AUTHORED=/^(famousWing|legendWing|expansion|hatRing|cigogne|squadron|elite|rival|lafayette|jasta|photoRecon)/i;
const authored=e=>e.ace||e.rivalAce||e.eventAce||e.bossPilot||e.eliteKind||Object.keys(e).some(k=>AUTHORED.test(k)&&e[k]);
const pilotContact=(g,c)=>c&&(c===g||g.players?.includes?.(c))&&!(c.hp<=0);
export function missionTargetSteering(g,e,contact,turn,steering){
 if(!e?.missionTarget||!['scout','hunter'].includes(e.type)||e.crashing||e.eventExit||authored(e)||!pilotContact(g,contact))return steering;
 const now=g.t||0;
 if(!(e.missionBreakUntil>now)){
  const pv=contact.speed||0,pa=contact.a??0,ev=e.speed||0,rx=e.x-contact.x,ry=e.y-contact.y,d=Math.hypot(rx,ry);
  if(d>B.breakRange)return steering;
  const vx=Math.cos(e.a)*ev-Math.cos(pa)*pv,vy=Math.sin(e.a)*ev-Math.sin(pa)*pv,vv=vx*vx+vy*vy,t=vv>1?-(rx*vx+ry*vy)/vv:0;
  if(t<=0||Math.hypot(rx+vx*t,ry+vy*t)>=B.breakMiss)return steering;
  const mx=rx+vx*t,my=ry+vy*t,away=Math.hypot(mx,my)>4?Math.atan2(my,mx):Math.atan2(ry,rx);
  e.missionBreakUntil=now+B.breakTime;e.missionBreakSide=Math.sin(away-e.a)>=0?1:-1;
 }
 return {delta:e.missionBreakSide*B.breakDelta,turn:(turn||1)*B.breakTurn};
}

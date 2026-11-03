// One explicitly announced arrival salvo, not an early native attack cycle.
// Targets and every pilot's safe strip are frozen once in world coordinates.
const profiles={
 'o400-squadron':{rows:3,radius:30,first:1.25,beat:.3,damage:.3,formation:true},
 'gotha-squadron':{rows:3,radius:30,first:1.25,beat:.3,damage:.3,formation:true}
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const arrivalBombardmentTag=encounter=>encounter.id+':arrival-salvo';
export function buildBossArrivalBombardment(encounter,frame){
 const profile=profiles[encounter?.bossId],bodies=[...encounter?.bodies.values()||[]],lead=bodies[0],bounds=frame.bounds;
 const players=(frame.players||[]).filter(p=>p.alive!==false);if(!profile||!lead?.arrivalPath||!bounds||!players.length)return null;
 const length=Math.hypot(lead.arrivalPath.dx,lead.arrivalPath.dy);if(length<1)return null;
 const fx=-lead.arrivalPath.dx/length,fy=-lead.arrivalPath.dy/length,rx=-fy,ry=fx,p=players[0];
 const width=bounds.right-bounds.left,height=bounds.bottom-bounds.top,safeHalf=clamp(Math.min(width,height)*.18,36,72);
 const strips=players.map(p=>{const speed=Math.hypot(p.vx||0,p.vy||0),a=speed>20?Math.atan2(p.vy,p.vx):Number.isFinite(p.a)?p.a:Math.atan2(fy,fx);return{x:p.x,y:p.y,nx:-Math.sin(a),ny:Math.cos(a),half:safeHalf,playerRadius:p.radius||12};});
 const corners=[[bounds.left,bounds.top],[bounds.right,bounds.top],[bounds.left,bounds.bottom],[bounds.right,bounds.bottom]],along=corners.map(([x,y])=>(x-p.x)*fx+(y-p.y)*fy),side=corners.map(([x,y])=>(x-p.x)*rx+(y-p.y)*ry);
 const radius=profile.radius,inset=radius+16,rowStep=radius*2+18,lo=Math.min(...along)+inset,hi=Math.max(...along)-inset-rowStep*(profile.rows-1);
 const tag=arrivalBombardmentTag(encounter),plan={tag,direction:{x:fx,y:fy},strips,shots:[]};if(hi<lo)return plan;
 const firstAlong=clamp(((p.vx||0)*fx+(p.vy||0)*fy)*profile.first,lo,hi),sideLimit=Math.max(...side.map(Math.abs));
 for(let row=0;row<profile.rows;row++)for(const sign of [-1,1]){
  const distance=firstAlong+row*rowStep;
  // Preserve all safe strips. Crowded co-op or a tiny viewport gets fewer
  // bombs, never a narrower corridor, retargeting, or an invisible warning.
  for(let lateral=safeHalf+radius+(p.radius||12)+8;lateral<=sideLimit;lateral+=12){
   const x=p.x+fx*distance+rx*sign*lateral,y=p.y+fy*distance+ry*sign*lateral;
   if(x-radius<bounds.left+16||x+radius>bounds.right-16||y-radius<bounds.top+16||y+radius>bounds.bottom-16)continue;
   if(strips.some(s=>Math.abs((x-s.x)*s.nx+(y-s.y)*s.ny)<s.half+radius+s.playerRadius+8-1e-7))continue;
   if(plan.shots.some(s=>Math.hypot(s.x-x,s.y-y)<radius+s.radius+12))continue;
   const member=profile.formation?(bodies.find(b=>b.slot===(encounter.bossId==='gotha-squadron'?row*3:0)+(sign<0?1:2))||lead):lead;
   const payload=[...member.parts.values()].find(q=>!q.destroyed&&(q.kind==='payload'||/bomb.?bay|bomb.?rack/i.test(q.id)));
   const damage=clamp((member.t?.damage||12)*profile.damage,3,profile.formation?7:10),impactAt=profile.first+row*profile.beat;
   plan.shots.push({type:'hazard',kind:'circle',bossId:member.id,faction:member.faction,tag,x,y,radius,
    sourceX:member.x+(payload?.x||0),sourceY:member.y+(payload?.y||0),releaseAngle:Math.atan2(fy,fx),
    delay:.15,warning:impactAt-.15,duration:profile.formation?1.1:1.15,damage,once:true,visual:'carpet-bomb',
    sprite:member.faction==='entente'?'cooper':'puw',airborneBomb:true,lockedAim:true,lockAtWarning:false,signatureAttack:false});
   break;
  }
 }
 return plan;
}
export function tickBossArrivalBombardment(addon,encounter,dt,frame){
 if(!encounter?.arrivalInitialized||!addon.hazards)return;
 if(!Object.hasOwn(encounter,'arrivalBombardment')){
  encounter.arrivalBombardment=buildBossArrivalBombardment(encounter,frame);
  for(const shot of encounter.arrivalBombardment?.shots||[])addon.accept(shot,encounter.id,encounter.bodies.get(shot.bossId)?.t);
 }
 const plan=encounter.arrivalBombardment;if(!plan)return;
 const owned=h=>h.encounterId===encounter.id&&h.tag===plan.tag;
 addon.hazards.pool.visit(h=>{if(owned(h)&&(encounter.completed||encounter.bodies.get(h.bossId)?.dead))addon.hazards.pool.release(h.index,h.generation);});
 // Native preparation events stay queued; only these announced drops advance.
 addon.hazards.update(dt,frame,owned);
}

export function pruneBossArrivalBombardments(addon,encounter){
 addon.hazards.pool.visit(h=>{
  if(h.tag!==h.encounterId+':arrival-salvo')return;
  const body=encounter?.id===h.encounterId?encounter.bodies.get(h.bossId):null;
  if(!body||body.dead||encounter.completed)addon.hazards.pool.release(h.index,h.generation);
 });
}

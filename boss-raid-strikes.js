// Physical ordnance used by the existing weapon controllers. Every order locks
// world coordinates, belongs to a real part and fits inside the normal evade.
export function shellMarch(boss,{source,partId,target,visual,tag,rows=3,step=74,radius=52,warning=1.15,beat=.48,finish=true,damage=1}){
 const speed=Math.hypot(target.vx||0,target.vy||0),dx=speed>10?target.vx/speed:0,dy=speed>10?target.vy/speed:-1;
 const emit=s=>boss.emit({type:'hazard',bossId:boss.id,faction:boss.faction,kind:'circle',sourceX:source.x,sourceY:source.y,sourcePartId:partId,tag,visual,airborneBomb:visual==='carpet-bomb',once:true,duration:.23,damage:boss.t.damage*damage,...s});
 for(let row=0;row<rows;row++){
  const travel=speed>10?Math.min(speed,340)*(warning+row*beat):(row+1)*step;
  // Alternating shoulders close the easy straight-line exit. The last impact
  // follows on the same metronome; it never reads the pilot again after warning.
  const side=row%2?1:-1;
  emit({x:target.x+dx*travel-dy*side*radius*.72,y:target.y+dy*travel+dx*side*radius*.72,radius,warning:warning+row*beat});
 }
 const finishTravel=speed>10?Math.min(speed,340)*(warning+rows*beat):(rows+1)*step;
 if(finish)emit({x:target.x+dx*finishTravel,y:target.y+dy*finishTravel,radius:radius*1.7,warning:warning+rows*beat,raidHeavy:true,damage:boss.t.damage*2.4});
 return warning+rows*beat+.23;
}

export function broadsideBreak(boss,{source,partId,target,visual,tag,angle,spread=1.65,warning=1.1,beats=3,beat=.42,speed=350,cue=true}){
 const now=boss.combatTime??boss.motionTime??0;boss.breakOrders??=new Map();if((boss.breakOrders.get(tag)||0)>now)return 0;boss.breakOrders.set(tag,now+warning+(beats-1)*beat+2.4+1.6);
 angle??=Math.atan2(target.y-source.y,target.x-source.x);
 if(cue)boss.emit({type:'charge-warning',bossId:boss.id,...source,partId,targetX:source.x+Math.cos(angle)*700,targetY:source.y+Math.sin(angle)*700,seconds:warning});
 for(let row=0;row<beats;row++)for(let i=0;i<13;i++){
  // Two alternating openings, then a short, solid finishing broadside. The
  // last row can be crossed with a roll; lateral escape stays possible.
  const last=row===beats-1,hole=row%2?8:3;if(!last&&i>=hole&&i<hole+2)continue;
  const a=angle+(i/12-.5)*spread;
  boss.emit({type:'hazard',bossId:boss.id,faction:boss.faction,kind:'projectile',...source,
   sourcePartId:partId,sourceOffsetX:partId?source.x-boss.x-(boss.parts.get(partId)?.x||0):0,sourceOffsetY:partId?source.y-boss.y-(boss.parts.get(partId)?.y||0):0,
   vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,radius:last?7:4,delay:warning+row*beat,warning:0,duration:2.4,
   damage:boss.t.damage*(last?2.4:.8),raidHeavy:last,visual,tag});
 }
 return warning+(beats-1)*beat+2.4;
}

export function impactPulse(boss,{x,y,radius,warning,visual,tag,partId,source,damage=2.4}){
 boss.emit({type:'hazard',bossId:boss.id,faction:boss.faction,kind:'circle',x,y,radius,warning,duration:.22,once:true,
  sourceX:source?.x,sourceY:source?.y,sourcePartId:partId,damage:boss.t.damage*damage,raidHeavy:true,airborneBomb:visual==='carpet-bomb',visual,tag});
}

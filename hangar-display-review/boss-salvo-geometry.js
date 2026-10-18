// Geometry only: each existing boss still owns its weapon, timing and recovery.
// Capture aim once. Rows never home after their warning has been shown.
export function fanSalvo({x,y,angle,speed,damage,visual,tag,count=13,spread=1.65,
  beats=3,beat=.42,warning=.8,gap=2,gapIndex=3,step=1,radius=4,duration=3.2}) {
  const shots=[];
  for(let row=0;row<beats;row++){
    const hole=Math.max(1,Math.min(count-gap-1,gapIndex+row*step));
    for(let i=0;i<count;i++){
      if(i>=hole&&i<hole+gap)continue;
      const a=angle+(i/(count-1)-.5)*spread;
      shots.push({kind:'projectile',x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,
        radius,damage,visual,tag,delay:warning+row*beat,warning:0,duration});
    }
  }
  return shots;
}

export function fireFanSalvo(boss,spec){
  // A later difficulty loop may accelerate native timers, but cannot stack
  // the same weapon's next phrase on top of its still-flying previous phrase.
  const now=boss.combatTime??boss.motionTime??0,key=spec.tag;
  boss.raidSalvos??=new Map();
  if((boss.raidSalvos.get(key)||0)>now)return false;
  const phrase={duration:3.2,...spec};
  boss.raidSalvos.set(key,now+(phrase.warning??.8)+((phrase.beats??3)-1)*(phrase.beat??.42)+phrase.duration+1.1);
  const emit=e=>boss.emit({...e,bossId:boss.id,faction:boss.faction});
  emit({type:'charge-warning',x:spec.x,y:spec.y,
    targetX:spec.x+Math.cos(spec.angle)*480,targetY:spec.y+Math.sin(spec.angle)*480,
    seconds:spec.warning??.8});
  const part=spec.sourcePartId&&boss.parts.get(spec.sourcePartId);
  for(const shot of fanSalvo(phrase))emit({type:'hazard',...shot,
    sourcePartId:part?.id,sourceOffsetX:part?spec.x-boss.x-part.x:0,
    sourceOffsetY:part?spec.y-boss.y-part.y:0});
  return true;
}

// Cover a warned strip with overlapping physical explosions, leaving one
// real opening. Bounds/axis are copied by the caller at the start of its order.
export function barrageStrip({bounds,y,gate,gap=100,radius=42,warning=1.25,
  beat=.18,damage,visual,tag,sourceX,sourceY,duration=.4}){
  const shots=[],left=bounds.left-radius*.3,right=bounds.right+radius*.3;
  for(let x=left;x<=right;x+=radius*1.65){
    if(Math.abs(x-gate)<gap/2+radius)continue;
    shots.push({kind:'circle',x,y,radius,damage,visual,tag,sourceX,sourceY,
      warning:warning+shots.length*beat,delay:0,duration,once:true});
  }
  return shots;
}

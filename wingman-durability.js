const HP=72,REPAIR_SECONDS=12,WITHDRAW_SECONDS=1.25;
const persistent=wing=>wing.permanent||wing.aceWingman;

export function initializeWingDurability(wing){
 if(!persistent(wing))return;
 wing.maxHp??=HP;wing.hp??=wing.maxHp;
}

export function formationWingRoundTarget(wing,round,region){
 if(wing.life<=0||wing.hp<=0||wing.carrierHidden)return false;
 return round.formationBoss129?region!==9:persistent(wing);
}

export function withdrawFormationWing(world,wing){
 wing.life=0;
 if(!persistent(wing))return;
 const owner=world.players?.find(p=>p.id===wing.ownerId)||(!world.players?world:null);
 if(!owner)return;
 wing.wingWithdrawal=WITHDRAW_SECONDS;
 wing.a+=(wing.slot%2?-1:1)*.65;
 wing.muzzleFlash=0;
 const at=world.t+REPAIR_SECONDS;
 if(wing.aceWingman){
  const prefix=wing.aceSource==='rescue'?'rescuedAce':'aceWingman';
  owner[prefix+'RespawnAt']=at;
 }else{
  (owner.wingRepairSlots??=new Map()).set(wing.slot,{at,plane:wing.plane});
 }
}

export function tickWingWithdrawal(wing,dt){
 if(!(wing.wingWithdrawal>0))return;
 const step=Math.min(dt,wing.wingWithdrawal),speed=Math.max(170,wing.flightSpeed||0);
 wing.wingWithdrawal-=step;
 wing.x+=Math.cos(wing.a)*speed*step;wing.y+=Math.sin(wing.a)*speed*step;
}

export function drawWingDurability(c,wing,x,y,zoom=1){
 if(!persistent(wing)||!(wing.hp>0&&wing.hp<wing.maxHp))return;
 const w=24/zoom,h=3/zoom,left=x-w/2,top=y+29/zoom;
 c.save();c.fillStyle='#182222d9';c.fillRect(left-1/zoom,top-1/zoom,w+2/zoom,h+2/zoom);
 c.fillStyle=wing.hp<=wing.maxHp/3?'#e28d63':'#a5c7b0';c.fillRect(left,top,w*wing.hp/wing.maxHp,h);c.restore();
}

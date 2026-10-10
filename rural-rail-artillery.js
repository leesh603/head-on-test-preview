// Mechanical presentation belongs to the rural guns, never to the Cambrai carrier.
// Recoil is local to the gun carriage: it cannot move fixed rails or detached wrecks.
export const RAIL_GUN_RIGS=Object.freeze({
 'paris-gun':Object.freeze({pivotY:25,gunHeight:235,gunWidth:57.87,anchor:.88,kick:21,returnSeconds:.25,bodyKick:3.2,traverse:.12}),
 'lincomparable':Object.freeze({pivotY:-9,gunHeight:205,gunWidth:52.96,anchor:.91,kick:35,returnSeconds:.94,bodyKick:5.2,traverse:.08})
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=t=>t*t*(3-2*t);
export function createRailArtillery(){return{angle:0,targetAngle:0,shotAge:10,shotCount:0,load:0,manual:false,brakeAge:10,velocity:0,phase:'move',rollClock:0};}
export function railRecoil(b){
 const rig=RAIL_GUN_RIGS[b.kind||b.assetKey],age=b.railGun?.shotAge??10;
 if(!rig||age<0||age>=rig.returnSeconds)return 0;
 return rig.kick*(age<.035?smooth(age/.035):1-smooth((age-.035)/(rig.returnSeconds-.035)));
}
export function railSuspension(b,carIndex=0){
 const rig=RAIL_GUN_RIGS[b.kind||b.assetKey],g=b.railGun;if(!rig||!g)return 0;
 const age=g.shotAge-carIndex*.045,shot=age>=0&&age<1.1?rig.bodyKick*Math.sin(age*29)*Math.exp(-age*6)/(1+carIndex*.6):0;
 const brake=g.brakeAge-carIndex*.04;
 return shot+(brake>=0&&brake<1?1.8*Math.sin(brake*19)*Math.exp(-brake*5)/(1+carIndex):0);
}
export function railGunMuzzle(b){
 const rig=RAIL_GUN_RIGS[b.kind||b.assetKey];if(!rig)return{x:b.x,y:b.y-190};
 const a=b.railGun?.angle||0,reach=rig.gunHeight*rig.anchor-railRecoil(b);
 return{x:b.x+Math.sin(a)*reach,y:b.y+rig.pivotY-Math.cos(a)*reach+railSuspension(b)};
}
export function aimRailArtillery(b,target){
 const rig=RAIL_GUN_RIGS[b.kind];
 // Small rail-mount traverse, not a freely spinning tank turret. The salvo is locked.
 b.railGun.targetAngle=clamp(Math.atan2(target.x-b.x,Math.max(300,Math.abs(target.y-b.y)))*.16,-rig.traverse,rig.traverse);
}
export function fireRailArtillery(b){
 b.railGun.shotAge=0;b.railGun.shotCount++;b.gunFlash=.16;
 const p=railGunMuzzle(b);b.emit({type:'heavy-gun-fired',bossId:b.id,...p,railArtillery:true,heavy:b.kind==='lincomparable'});
}
export function updateRailArtillery(b,dt){
 const g=b.railGun,r=b.rail129;
 g.brakeAge+=dt;
 const target=b.runawayTriggered129&&!b.finalAim?0:g.targetAngle,step=dt*(b.kind==='lincomparable'?.1:.22);
 g.angle+=clamp(target-g.angle,-step,step);
 if(r.phase==='brake'&&g.phase!=='brake'){g.brakeAge=0;b.emit({type:'rural-rail-brake',bossId:b.id});}
 const loading=r.phase==='reload'&&!b.barrage;
 if(loading&&!g.loading)b.emit({type:'rural-rail-load',bossId:b.id});
 g.loading=loading;
 g.manual=b.parts.get('car-front').destroyed;
 g.load=loading?clamp(r.time/r.c.reloadSeconds,0,1):0;
 g.velocity=r.velocity;g.phase=r.phase;
 if(r.velocity>12&&!b.derailed129){
  g.rollClock-=dt;if(g.rollClock<=0){
   const speed=clamp(r.velocity/r.c.speed,.3,2);g.rollClock=.62/speed;
   b.emit({type:'rural-rail-roll',bossId:b.id,speed,level:b.runawayTriggered129?.8:.4});
  }
 }else g.rollClock=0;
}

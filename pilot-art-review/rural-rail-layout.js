// The approved 512×768 sprites retain their aspect ratio and coupling length.
export const RURAL_RAIL=Object.freeze({width:260,height:390,pitch:375,muzzleY:-190,tailY:1125});
export const RURAL_CARS=Object.freeze([
 {id:'car-rear',art:'rear',y:1125,share:.16,role:'defense'},
 {id:'car-middle',art:'middle',y:750,share:.18,role:'observer'},
 {id:'car-front',art:'front',y:375,share:.26,role:'ammo'}
]);
export function ruralBarrage(target,shot,bounds){
 const speed=Math.hypot(target.vx||0,target.vy||0),ax=speed>10?(target.vx||0)/speed:0,ay=speed>10?(target.vy||0)/speed:-1;
 const offsets=shot%2?[[0,-110],[110,0],[0,110],[-110,0],[0,0]]:[[-62,-144],[62,-72],[-62,0],[62,72],[0,144]];
 const clamp=(n,lo,hi)=>lo>hi?(lo+hi)/2:Math.max(lo,Math.min(hi,n));
 return offsets.map(([side,along])=>{
  const x=target.x-ay*side+ax*along,y=target.y+ax*side+ay*along;
  return{x:bounds?clamp(x,bounds.left+88,bounds.right-88):x,y:bounds?clamp(y,bounds.top+88,bounds.bottom-88):y};
 });
}

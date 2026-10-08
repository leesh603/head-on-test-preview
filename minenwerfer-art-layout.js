// Each of the THREE complete installations contains three physical mortar
// mounts. These coordinates belong to the full 600 x 450 emplacement, not
// three independent slices or additional HP budgets.
export const MINEN_ART=Object.freeze({width:600,height:450,recoilDuration:.36,recoilKick:.055});
export const MINEN_TUBES=Object.freeze([
 Object.freeze({x:-175,y:22,rx:64,ry:70,muzzleX:-175,muzzleY:-22,barrelY:-5,recoilTravel:8}),
 Object.freeze({x:0,y:22,rx:84,ry:98,muzzleX:0,muzzleY:-86,barrelY:-49,recoilTravel:16}),
 Object.freeze({x:175,y:22,rx:64,ry:70,muzzleX:175,muzzleY:-22,barrelY:-5,recoilTravel:8})
]);
export function minenAtlasFrame(image,index){
 const w=(image.naturalWidth||image.width)/2,h=(image.naturalHeight||image.height)/2;
 return [index%2*w,Math.floor(index/2)*h,w,h];
}
export function minenRecoilOffset(part,tube){
 const remaining=part.mortarRecoils?.[tube]??(part.mortarTube===tube?part.mortarRecoil||0:0);
 if(!(remaining>0))return 0;
 const age=Math.max(0,MINEN_ART.recoilDuration-remaining),kick=MINEN_ART.recoilKick;
 const t=age<kick?Math.min(1,age/kick):Math.min(1,(age-kick)/(MINEN_ART.recoilDuration-kick));
 // Fast compression, then a slower damped hydraulic return. Only the tube
 // translates along its elevation axis; the fixed mounting never moves.
 const eased=age<kick?1-(1-t)**3:1-t*t*(3-2*t);
 return MINEN_TUBES[tube].recoilTravel*eased;
}
export function minenMuzzleLocal(part,tube=part.mortarTube??1){
 const t=MINEN_TUBES[tube];return{x:t.muzzleX,y:t.muzzleY+minenRecoilOffset(part,tube)};
}

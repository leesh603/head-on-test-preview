// Each of the THREE complete installations contains three physical mortar
// mounts. These coordinates belong to the full 600 x 450 emplacement, not
// three independent slices or additional HP budgets.
export const MINEN_ART=Object.freeze({width:600,height:450,recoilDuration:.74,recoilKick:.075,recoilHold:.06,flashDuration:.16,smokeDuration:1.8});
export const MINEN_TUBES=Object.freeze([
 Object.freeze({x:-175,y:22,rx:64,ry:70,muzzleX:-175,muzzleY:-22,barrelY:-5,recoilTravel:21}),
 Object.freeze({x:0,y:22,rx:84,ry:98,muzzleX:0,muzzleY:-86,barrelY:-49,recoilTravel:35}),
 Object.freeze({x:175,y:22,rx:64,ry:70,muzzleX:175,muzzleY:-22,barrelY:-5,recoilTravel:21})
]);
export function minenAtlasFrame(image,index){
 const w=(image.naturalWidth||image.width)/2,h=(image.naturalHeight||image.height)/2;
 return [index%2*w,Math.floor(index/2)*h,w,h];
}
export function minenRecoilOffset(part,tube){
 const remaining=part.mortarRecoils?.[tube]??(part.mortarTube===tube?part.mortarRecoil||0:0);
 if(!(remaining>0))return 0;
 const {recoilDuration,recoilKick,recoilHold}=MINEN_ART;
 const age=Math.max(0,recoilDuration-remaining),returnStart=recoilKick+recoilHold;
 const travel=MINEN_TUBES[tube].recoilTravel;
 if(age<recoilKick)return travel*(1-(1-age/recoilKick)**3);
 if(age<returnStart)return travel;
 const t=(age-returnStart)/(recoilDuration-returnStart);
 return travel*(1-t*t*(3-2*t));
}
export function minenMuzzleLocal(part,tube=part.mortarTube??1){
 const t=MINEN_TUBES[tube];return{x:t.muzzleX,y:t.muzzleY+minenRecoilOffset(part,tube)};
}

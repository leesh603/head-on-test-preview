// Each of the THREE complete installations contains three physical mortar
// mounts. These coordinates belong to the full 600 x 450 emplacement, not
// three independent slices or additional HP budgets.
export const MINEN_ART=Object.freeze({width:600,height:450,recoilDuration:.32});
export const MINEN_TUBES=Object.freeze([
 Object.freeze({x:-175,y:22,rx:64,ry:70,muzzleX:-175,muzzleY:-22}),
 Object.freeze({x:0,y:22,rx:84,ry:98,muzzleX:0,muzzleY:-86}),
 Object.freeze({x:175,y:22,rx:64,ry:70,muzzleX:175,muzzleY:-22})
]);
export function minenAtlasFrame(image,index){
 const w=(image.naturalWidth||image.width)/2,h=(image.naturalHeight||image.height)/2;
 return [index%2*w,Math.floor(index/2)*h,w,h];
}
export function minenRecoilFrame(part){
 return part.mortarRecoil>0?1+(part.mortarTube??1):0;
}

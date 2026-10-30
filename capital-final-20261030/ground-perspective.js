// Visual-only map calibration. Units remain world-fixed; no camera/global squash,
// spawn, damage, reload, detection, or collision parameter is modified here.
// Anchors: authored background dressing vehicles 25–30 city,45 Cambrai,53 Somme;
// rural farm38 and Ma'an camp96. Interactive targets retain their combat footprint.
const profile=(aa,vehicle,light,mg)=>Object.freeze({aa,aatank:vehicle,tank:vehicle,light,mg});
// Coastal authored guns already draw at68px and Paris uses a4096px district.
// Keep their established scale rather than copying the smaller768px-city fit.
const retained=profile(66,96,76,66);
export const GROUND_PERSPECTIVE=Object.freeze({
 0:profile(52,64,58,48),1:retained,2:profile(60,72,64,54),3:profile(60,72,64,54),
 4:profile(42,52,58,42),6:profile(58,70,62,52),7:retained,8:profile(50,62,58,48),
 9:retained,10:profile(58,68,62,52),11:profile(44,54,58,44),12:retained,
 13:profile(60,74,64,54),14:retained,15:retained,16:retained,17:retained
});
export function groundVisualRegion(e={},contextRegion){return e.groundArtRegion??e.fieldRegion??e.hazardRegion??e.region??contextRegion;}
export function groundVisualSize(e={},size=66,kind='aa',contextRegion){
 const p=GROUND_PERSPECTIVE[groundVisualRegion(e,contextRegion)];
 if(!p||!Number.isFinite(size)||size<=0||!p[kind]||e.stageBossBody||e.groundFacility)return size;
 // Hulls/boss railguns/airborne observers are not ordinary map installations.
 const desired=Math.min(size,p[kind]);
 const hit=Number.isFinite(e.hitRadius)&&e.hp>0?Math.max(0,e.hitRadius)*2:0;
 return Math.min(size,Math.max(desired,hit));
}

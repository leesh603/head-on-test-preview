import {ordnanceArtReady,ordnanceReady,drawOrdnance} from './ordnance-art.js?v=capital-final-20261030';
// Union pack: Pro's 196 combat atlas takes precedence for the keys it covers
// (explosion0-3, fire, smoke*, spark, armorSpark, gas, gasThin); every other key
// stays on the approved v189 set below. ?fx=0 keeps the procedural rollback.
import {fxArtReady as fx196ArtReady,fxReady as fx196Ready,fxImage as fx196Image,fx as fx196Draw,fxTintedCanvas as fx196TintedCanvas,fxTint as fx196Tint} from './combat-fx196.js?v=capital-final-20261030';
// Combat FX pack v189 — approved sprite set lives in fx-pack-v189/ and maps onto
// the keys already called by the renderers. Unmapped keys stay procedural.
// Rollback: append ?fx=0 to the URL — FX_FILES empties and every call site
// falls back to procedural drawing exactly as before.
import {FX3,roleArtReady,roleReady,roleDraw,roleImage} from './fx-role3.js?v=capital-final-20261030';
// FX sample preview (?fxs=1 only).
import {FXS,fxsReady,fxsHas,fxsDraw,fxsImage,fxsTintedCanvas,fxsTint,fxsRocketTrail} from './fx-sample-preview.js?v=capital-final-20261030';
export {FXS};

export {FX3};
const FX_OFF=typeof location!=='undefined'&&new URLSearchParams(location.search).get('fx')==='0';
const FX56_OFF=typeof location!=='undefined'&&new URLSearchParams(location.search).get('fx56')==='0';
export const FX56=!FX_OFF&&!FX56_OFF;
const FX56_FILES={
 rocket:'https://head-on-aces.justzeon.chatgpt.site/fx-pack-v189/projectiles/rocket-le-prieur.webp',mine:'https://head-on-aces.justzeon.chatgpt.site/fx-mine-body.webp',
 shell:'https://head-on-aces.justzeon.chatgpt.site/fx-shell-heavy.webp',bomb:'https://head-on-aces.justzeon.chatgpt.site/fx-bomb-body.webp',
 explosion0:'https://head-on-aces.justzeon.chatgpt.site/fx-airblast-0.webp',explosion1:'https://head-on-aces.justzeon.chatgpt.site/fx-airblast-1.webp',
 explosion2:'https://head-on-aces.justzeon.chatgpt.site/fx-airblast-2.webp',explosion3:'https://head-on-aces.justzeon.chatgpt.site/fx-airblast-3.webp',
 explosionOily0:'https://head-on-aces.justzeon.chatgpt.site/fx-bossblast-0.webp',explosionOily1:'https://head-on-aces.justzeon.chatgpt.site/fx-bossblast-1.webp',
 explosionOily2:'https://head-on-aces.justzeon.chatgpt.site/fx-bossblast-2.webp',explosionOily3:'https://head-on-aces.justzeon.chatgpt.site/fx-bossblast-3.webp',
 explosionHot0:'https://head-on-aces.justzeon.chatgpt.site/fx-shellburst-0.webp',explosionHot1:'https://head-on-aces.justzeon.chatgpt.site/fx-shellburst-1.webp',
 explosionHot2:'https://head-on-aces.justzeon.chatgpt.site/fx-shellburst-2.webp',explosionHot3:'https://head-on-aces.justzeon.chatgpt.site/fx-shellburst-3.webp',
 explosionDust0:'https://head-on-aces.justzeon.chatgpt.site/fx-bombfx-0.webp',explosionDust1:'https://head-on-aces.justzeon.chatgpt.site/fx-bombfx-1.webp',
 explosionDust2:'https://head-on-aces.justzeon.chatgpt.site/fx-bombfx-2.webp',explosionDust3:'https://head-on-aces.justzeon.chatgpt.site/fx-bombfx-3.webp',
 smokeDark:'https://head-on-aces.justzeon.chatgpt.site/fx-smoke-heavy.webp',smokeGray:'https://head-on-aces.justzeon.chatgpt.site/fx-engine-smoke.webp',
 smokeWisp:'https://head-on-aces.justzeon.chatgpt.site/fx-pack-v189/gas-smoke/gas-dissipate.webp',smokePuff:'https://head-on-aces.justzeon.chatgpt.site/fx-gun-smoke.webp',
 fire:'https://head-on-aces.justzeon.chatgpt.site/fx-fire-engine.webp',flak:'https://head-on-aces.justzeon.chatgpt.site/fx-combat-flak-burst.webp'
};
const FX_FILES=FX_OFF?{}:Object.assign({
 rocket:'https://head-on-aces.justzeon.chatgpt.site/fx-pack-v189/projectiles/rocket-le-prieur.webp',
 rocketHeavy:'https://head-on-aces.justzeon.chatgpt.site/fx-pack-v189/projectiles/rocket-heavy.webp',
 muzzle:'https://head-on-aces.justzeon.chatgpt.site/fx-pack-v189/projectiles/muzzle-flash.webp',
 bomb:'https://head-on-aces.justzeon.chatgpt.site/fx-bomb-body.webp',
 shell:'https://head-on-aces.justzeon.chatgpt.site/fx-shell-heavy.webp',
 shellAuto:'https://head-on-aces.justzeon.chatgpt.site/fx-pack-v189/projectiles/shell-autocannon.webp',
 bulletBrass:'https://head-on-aces.justzeon.chatgpt.site/fx-pack-v189/projectiles/bullet-brass.webp',
 grenade:'https://head-on-aces.justzeon.chatgpt.site/fx-grenade-ww1.webp?v=capital-final-20261030',
 spark:'https://head-on-aces.justzeon.chatgpt.site/fx-pack-v189/explosions/impact-spark.webp',
 ricochet:'https://head-on-aces.justzeon.chatgpt.site/fx-pack-v189/explosions/impact-ricochet.webp',
 debris:'https://head-on-aces.justzeon.chatgpt.site/fx-pack-v189/explosions/impact-aircraft-debris.webp',
 explosion0:'https://head-on-aces.justzeon.chatgpt.site/fx-pack-v189/explosions/explosion-air-0.webp',
 explosion1:'https://head-on-aces.justzeon.chatgpt.site/fx-pack-v189/explosions/explosion-air-1.webp',
 explosion2:'https://head-on-aces.justzeon.chatgpt.site/fx-pack-v189/explosions/explosion-air-2.webp',
 explosion3:'https://head-on-aces.justzeon.chatgpt.site/fx-pack-v189/explosions/explosion-air-3.webp',
 waterColumn:'https://head-on-aces.justzeon.chatgpt.site/fx-water-column.webp',
 fire:'https://head-on-aces.justzeon.chatgpt.site/fx-fire-engine.webp',
 fireSmall:'https://head-on-aces.justzeon.chatgpt.site/fx-pack-v189/gas-smoke/fire-small.webp',
 smokePuff:'https://head-on-aces.justzeon.chatgpt.site/fx-gun-smoke.webp',
 smokeDark:'https://head-on-aces.justzeon.chatgpt.site/fx-smoke-heavy.webp',
 smokeWisp:'https://head-on-aces.justzeon.chatgpt.site/fx-pack-v189/gas-smoke/gas-dissipate.webp',
 smokeGray:'https://head-on-aces.justzeon.chatgpt.site/fx-engine-smoke.webp',
 smokeOil:'https://head-on-aces.justzeon.chatgpt.site/fx-smoke-heavy.webp',baraccaLance:'https://head-on-aces.justzeon.chatgpt.site/fx-baracca-lance.svg',
 gas:'https://head-on-aces.justzeon.chatgpt.site/fx-pack-v189/gas-smoke/gas-broad.webp',
 gasSmall:'https://head-on-aces.justzeon.chatgpt.site/fx-pack-v189/gas-smoke/gas-small.webp',
 exhaust:'https://head-on-aces.justzeon.chatgpt.site/fx-pack-v189/gas-smoke/exhaust-rocket.webp',
 vaporTrail:'https://head-on-aces.justzeon.chatgpt.site/fx-pack-v189/gas-smoke/vapor-trail.webp',
 flameJet:'https://head-on-aces.justzeon.chatgpt.site/fx-flame-jet.webp',flameTongue1:'https://head-on-aces.justzeon.chatgpt.site/fx-flame-tongue-1.webp',flameTongue2:'https://head-on-aces.justzeon.chatgpt.site/fx-flame-tongue-2.webp',flameTongue3:'https://head-on-aces.justzeon.chatgpt.site/fx-flame-tongue-3.webp',
 // FX family pass 20260925 — generated unified set (all share one painterly palette)
 pop0:'https://head-on-aces.justzeon.chatgpt.site/fx-pop-0.webp',pop1:'https://head-on-aces.justzeon.chatgpt.site/fx-pop-1.webp',pop2:'https://head-on-aces.justzeon.chatgpt.site/fx-pop-2.webp',pop3:'https://head-on-aces.justzeon.chatgpt.site/fx-pop-3.webp',
 shellBurst0:'https://head-on-aces.justzeon.chatgpt.site/fx-shellburst-0.webp',shellBurst1:'https://head-on-aces.justzeon.chatgpt.site/fx-shellburst-1.webp',shellBurst2:'https://head-on-aces.justzeon.chatgpt.site/fx-shellburst-2.webp',shellBurst3:'https://head-on-aces.justzeon.chatgpt.site/fx-shellburst-3.webp',
 structure0:'https://head-on-aces.justzeon.chatgpt.site/fx-structure-0.webp',structure1:'https://head-on-aces.justzeon.chatgpt.site/fx-structure-1.webp',structure2:'https://head-on-aces.justzeon.chatgpt.site/fx-structure-2.webp',structure3:'https://head-on-aces.justzeon.chatgpt.site/fx-structure-3.webp',
 bossBlast0:'https://head-on-aces.justzeon.chatgpt.site/fx-bossblast-0.webp',bossBlast1:'https://head-on-aces.justzeon.chatgpt.site/fx-bossblast-1.webp',bossBlast2:'https://head-on-aces.justzeon.chatgpt.site/fx-bossblast-2.webp',bossBlast3:'https://head-on-aces.justzeon.chatgpt.site/fx-bossblast-3.webp',
 mineBlast0:'https://head-on-aces.justzeon.chatgpt.site/fx-mineblast-0.webp',mineBlast1:'https://head-on-aces.justzeon.chatgpt.site/fx-mineblast-1.webp',mineBlast2:'https://head-on-aces.justzeon.chatgpt.site/fx-mineblast-2.webp',mineBlast3:'https://head-on-aces.justzeon.chatgpt.site/fx-mineblast-3.webp',
 airblast0:'https://head-on-aces.justzeon.chatgpt.site/fx-airblast-0.webp',airblast1:'https://head-on-aces.justzeon.chatgpt.site/fx-airblast-1.webp',airblast2:'https://head-on-aces.justzeon.chatgpt.site/fx-airblast-2.webp',airblast3:'https://head-on-aces.justzeon.chatgpt.site/fx-airblast-3.webp',
 bombfx0:'https://head-on-aces.justzeon.chatgpt.site/fx-bombfx-0.webp',bombfx1:'https://head-on-aces.justzeon.chatgpt.site/fx-bombfx-1.webp',bombfx2:'https://head-on-aces.justzeon.chatgpt.site/fx-bombfx-2.webp',bombfx3:'https://head-on-aces.justzeon.chatgpt.site/fx-bombfx-3.webp',
 fireEngine:'https://head-on-aces.justzeon.chatgpt.site/fx-fire-engine.webp',fireWing:'https://head-on-aces.justzeon.chatgpt.site/fx-fire-wing.webp',fireGround:'https://head-on-aces.justzeon.chatgpt.site/fx-fire-ground.webp',fireFlash:'https://head-on-aces.justzeon.chatgpt.site/fx-fire-flash.webp',
 smokeTrail:'https://head-on-aces.justzeon.chatgpt.site/fx-smoke-trail.webp',smokeHeavy:'https://head-on-aces.justzeon.chatgpt.site/fx-smoke-heavy.webp',gunSmoke:'https://head-on-aces.justzeon.chatgpt.site/fx-gun-smoke.webp',engineSmoke:'https://head-on-aces.justzeon.chatgpt.site/fx-engine-smoke.webp',smokeDust:'https://head-on-aces.justzeon.chatgpt.site/fx-smoke-dust.webp',
 splashTiny:'https://head-on-aces.justzeon.chatgpt.site/fx-splash-tiny.webp',splashShell:'https://head-on-aces.justzeon.chatgpt.site/fx-splash-shell.webp',waterColumn:'https://head-on-aces.justzeon.chatgpt.site/fx-water-column.webp',wakeFast:'https://head-on-aces.justzeon.chatgpt.site/fx-wake-fast.webp',foamRing:'https://head-on-aces.justzeon.chatgpt.site/fx-foam-ring.webp',
 muzzleTwin:'https://head-on-aces.justzeon.chatgpt.site/fx-muzzle-twin.webp',muzzleHeavy:'https://head-on-aces.justzeon.chatgpt.site/fx-muzzle-heavy.webp',muzzleRear:'https://head-on-aces.justzeon.chatgpt.site/fx-muzzle-rear.webp',muzzlePistol:'https://head-on-aces.justzeon.chatgpt.site/fx-muzzle-pistol.webp',
 dustPuff:'https://head-on-aces.justzeon.chatgpt.site/fx-dust-puff.webp',dirtBurst:'https://head-on-aces.justzeon.chatgpt.site/fx-dirt-burst.webp',debrisShard:'https://head-on-aces.justzeon.chatgpt.site/fx-debris-shard.webp',dirtMix:'https://head-on-aces.justzeon.chatgpt.site/fx-dirt-mix.webp',
 sunshaft:'https://head-on-aces.justzeon.chatgpt.site/fx-sunshaft.webp',windStreak:'https://head-on-aces.justzeon.chatgpt.site/fx-wind-streak.webp',mist:'https://head-on-aces.justzeon.chatgpt.site/fx-mist.webp',
 torpedo:'https://head-on-aces.justzeon.chatgpt.site/fx-torpedo.webp',shockRing:'https://head-on-aces.justzeon.chatgpt.site/fx-shock-ring.webp',artilleryWave:'https://head-on-aces.justzeon.chatgpt.site/fx-shock-ring.webp',searchlight:'https://head-on-aces.justzeon.chatgpt.site/fx-city-searchlight.webp',
 mortarShell:'https://head-on-aces.justzeon.chatgpt.site/fx-mortar-shell.webp',lePrieur:'https://head-on-aces.justzeon.chatgpt.site/fx-combat-le-prieur.webp',bombBody:'https://head-on-aces.justzeon.chatgpt.site/fx-bomb-body.webp',grenadeBody:'https://head-on-aces.justzeon.chatgpt.site/fx-grenade-ww1.webp?v=capital-final-20261030',
mineBody:'https://head-on-aces.justzeon.chatgpt.site/fx-mine-body.webp',shellHeavy:'https://head-on-aces.justzeon.chatgpt.site/fx-shell-heavy.webp',incendiary:'https://head-on-aces.justzeon.chatgpt.site/fx-incendiary.webp',
// Boss-pair debris set — Treffas-Wagen crush debris + rail-carrier wreck shards
rockChunk0:'https://head-on-aces.justzeon.chatgpt.site/fx-rock-chunk-0.webp',rockChunk1:'https://head-on-aces.justzeon.chatgpt.site/fx-rock-chunk-1.webp',rockChunk2:'https://head-on-aces.justzeon.chatgpt.site/fx-rock-chunk-2.webp',rockChunk3:'https://head-on-aces.justzeon.chatgpt.site/fx-rock-chunk-3.webp',rockChunk4:'https://head-on-aces.justzeon.chatgpt.site/fx-rock-chunk-4.webp',rockChunk5:'https://head-on-aces.justzeon.chatgpt.site/fx-rock-chunk-5.webp',
metalShard0:'https://head-on-aces.justzeon.chatgpt.site/fx-metal-shard-0.webp',metalShard1:'https://head-on-aces.justzeon.chatgpt.site/fx-metal-shard-1.webp',metalShard2:'https://head-on-aces.justzeon.chatgpt.site/fx-metal-shard-2.webp',metalShard3:'https://head-on-aces.justzeon.chatgpt.site/fx-metal-shard-3.webp',metalShard4:'https://head-on-aces.justzeon.chatgpt.site/fx-metal-shard-4.webp',metalShard5:'https://head-on-aces.justzeon.chatgpt.site/fx-metal-shard-5.webp'
},FX56_OFF?{}:FX56_FILES);
const fxImgs={};
// Aliases share one decoded image; atlas-covered keys need no second bitmap.
const imageLoads=new Map();
const fx189Ready=typeof Image==='undefined'?Promise.resolve():Promise.all([fx196ArtReady,fxsReady]).then(()=>Promise.all(Object.entries(FX_FILES).map(async([key,file])=>{
 if(fx196Ready(key)||fxsHas(key))return;
 if(!imageLoads.has(file))imageLoads.set(file,new Promise(res=>{
  const im=new Image();im.onload=()=>{im.onload=im.onerror=null;res(im)};im.onerror=()=>{im.onload=im.onerror=null;res(null)};im.src='./'+file+'?v=capital-final-20261030';im.decode?.().catch(()=>{});
 }));
 const im=await imageLoads.get(file);if(im)fxImgs[key]=im;
})));
export const fxArtReady=Promise.all([fx189Ready,fx196ArtReady,roleArtReady,fxsReady,ordnanceArtReady]);
export function fxReady(key){return !FX_OFF&&(ordnanceReady(key)||fxsHas(key)||roleReady(key)||fx196Ready(key)||!!fxImgs[key])}
export function fxImage(key){return FX_OFF?null:(fxsHas(key)&&fxsImage(key))||roleImage(key)||fx196Image(key)||fxImgs[key]||null}
// These choreographed effects use the existing painted atlas directly. All
// other callers retain their current sample/atlas precedence and rollback.
const PROFILE_ART={profileAir0:'airblast0',profileAir1:'airblast1',profileAir2:'airblast2',profileAir3:'airblast3',profileEarth0:'mortarImpact0',profileEarth1:'mortarImpact1',profileEarth2:'mortarImpact2',profileEarth3:'mortarImpact3',profileAmmo0:'bossBlast0',profileAmmo1:'bossBlast1',profileAmmo2:'bossBlast2',profileAmmo3:'bossBlast3',profileEngine:'fireEngine',profileWing:'fireWing',profileGround:'fireGround',profileFlash:'fireFlash',profileOil:'smokeOil',profileTrail:'smokeTrail',profileDust:'dustPuff',profileDirt:'dirtBurst'};
// Draw sprite centered at x,y, rotated to angle (0 = sprite's natural right/up orientation), fit inside w×h.
export function fx(c,key,x,y,w,h=w,angle=0,alpha=1){
 if(FX_OFF)return false;
 if(PROFILE_ART[key]){key=PROFILE_ART[key];if(roleReady(key))return roleDraw(c,key,x,y,w,h,angle,alpha)}
 if(drawOrdnance(c,key,x,y,w,h,angle,alpha))return true;
 if(FXS&&key==='rocket')fxsRocketTrail(c,x,y,angle,w);
 if(fxsHas(key))return fxsDraw(c,key,x,y,w,h,angle,alpha);
 if(roleReady(key))return roleDraw(c,key,x,y,w,h,angle,alpha);
 if(fx196Ready(key))return fx196Draw(c,key,x,y,w,h,angle,alpha);
 const im=fxImgs[key];if(!im)return false;
 c.save();c.translate(x,y);if(angle)c.rotate(angle);c.globalAlpha*=alpha;
 if(FX56&&FX_FILES[key]?.startsWith('fx-pack-v189/')){c.imageSmoothingEnabled=false;c.drawImage(im,-w/2,-h/2,w,h)}
 else{const k=Math.min(w/im.naturalWidth,h/im.naturalHeight),dw=im.naturalWidth*k,dh=im.naturalHeight*k;
  c.drawImage(im,-dw/2,-dh/2,dw,dh)}
 c.restore();return true;
}
const tintCache=new Map();
let tintPixels=0;
const TINT_PIXEL_BUDGET=1024*1024;
export function clearFxTintCache(){for(const cv of tintCache.values())if(cv)cv.width=cv.height=0;tintCache.clear();tintPixels=0}
// Lazily bake a color-multiplied copy so painted shading survives tinting.
export function fxTintedCanvas(key,color){
 if(FX_OFF)return null;
 if(fxsHas(key))return fxsTintedCanvas(key,color);
 if(!roleReady(key)&&fx196Ready(key))return fx196TintedCanvas(key,color);
 const im=roleImage(key)||fxImgs[key];if(!im)return null;
 const ck=key+color;let c=tintCache.get(ck);
 if(c===undefined){
  c=null;if(typeof document!=='undefined'){
   const cv=document.createElement('canvas'),scale=Math.min(1,512/Math.max(im.naturalWidth,im.naturalHeight));cv.width=Math.max(1,Math.round(im.naturalWidth*scale));cv.height=Math.max(1,Math.round(im.naturalHeight*scale));
   const g=cv.getContext('2d');if(!g)return null;g.drawImage(im,0,0,cv.width,cv.height);g.globalCompositeOperation='multiply';g.fillStyle=color;g.fillRect(0,0,cv.width,cv.height);
   g.globalCompositeOperation='destination-in';g.drawImage(im,0,0,cv.width,cv.height);c=cv;
  }
  while(tintCache.size&&(tintCache.size>=24||tintPixels+(c?c.width*c.height:0)>TINT_PIXEL_BUDGET)){
   const oldest=tintCache.keys().next().value,cv=tintCache.get(oldest);tintCache.delete(oldest);
   if(cv){tintPixels-=cv.width*cv.height;cv.width=cv.height=0}
  }
  tintPixels+=c?c.width*c.height:0;
  tintCache.set(ck,c);
 }
 return c;
}
export function fxTint(c,key,color,x,y,w,h=w,angle=0,alpha=1){
 if(FX_OFF)return false;
 if(fxsHas(key))return fxsTint(c,key,color,x,y,w,h,angle,alpha);
 if(!roleReady(key)&&fx196Ready(key))return fx196Tint(c,key,color,x,y,w,h,angle,alpha);
 const cv=fxTintedCanvas(key,color);if(!cv)return fx(c,key,x,y,w,h,angle,alpha);
 c.save();c.translate(x,y);if(angle)c.rotate(angle);c.globalAlpha*=alpha;
 if(FX56&&FX_FILES[key]?.startsWith('fx-pack-v189/')){c.imageSmoothingEnabled=false;c.drawImage(cv,-w/2,-h/2,w,h)}
 else{const k=Math.min(w/cv.width,h/cv.height),dw=cv.width*k,dh=cv.height*k;c.drawImage(cv,-dw/2,-dh/2,dw,dh)}
 c.restore();return true;
}



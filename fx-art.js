// Union pack: Pro's 196 combat atlas takes precedence for the keys it covers
// (explosion0-3, fire, smoke*, spark, armorSpark, gas, gasThin); every other key
// stays on the approved v189 set below. ?fx=0 keeps the procedural rollback.
import {fxArtReady as fx196ArtReady,fxReady as fx196Ready,fxImage as fx196Image,fx as fx196Draw,fxTintedCanvas as fx196TintedCanvas,fxTint as fx196Tint} from './combat-fx196.js?v=335';
// Combat FX pack v189 — approved sprite set lives in fx-pack-v189/ and maps onto
// the keys already called by the renderers. Unmapped keys stay procedural.
// Rollback: append ?fx=0 to the URL — FX_FILES empties and every call site
// falls back to procedural drawing exactly as before.
const FX_OFF=typeof location!=='undefined'&&new URLSearchParams(location.search).get('fx')==='0';
const FX56_OFF=typeof location!=='undefined'&&new URLSearchParams(location.search).get('fx56')==='0';
export const FX56=!FX_OFF&&!FX56_OFF;
const FX56_FILES={
 rocket:'fx-pack-v189/projectiles/rocket-le-prieur.webp',mine:'fx-combat-iron-mine.webp',
 shell:'fx-pack-v189/projectiles/shell-37mm.webp',bomb:'fx-pack-v189/projectiles/shell-naval.webp',
 explosion0:'fx-explosion-0.webp',explosion1:'fx-explosion-1.webp',
 explosion2:'fx-explosion-2.webp',explosion3:'fx-explosion-3.webp',
 explosionOily0:'fx-explosion-oily-0.webp',explosionOily1:'fx-explosion-oily-1.webp',
 explosionOily2:'fx-explosion-oily-2.webp',explosionOily3:'fx-explosion-oily-3.webp',
 explosionHot0:'fx-explosion-hot-0.webp',explosionHot1:'fx-explosion-hot-1.webp',
 explosionHot2:'fx-explosion-hot-2.webp',explosionHot3:'fx-explosion-hot-3.webp',
 explosionDust0:'fx-explosion-dust-0.webp',explosionDust1:'fx-explosion-dust-1.webp',
 explosionDust2:'fx-explosion-dust-2.webp',explosionDust3:'fx-explosion-dust-3.webp',
 smokeDark:'fx-pack-v189/gas-smoke/smoke-damage.webp',smokeGray:'fx-pack-v189/gas-smoke/smoke-engine.webp',
 smokeWisp:'fx-pack-v189/gas-smoke/gas-dissipate.webp',smokePuff:'fx-pack-v189/gas-smoke/smoke-gun.webp',
 fire:'fx-pack-v189/gas-smoke/fire-aircraft.webp',flak:'fx-combat-flak-burst.webp'
};
const FX_FILES=FX_OFF?{}:Object.assign({
 rocket:'fx-pack-v189/projectiles/rocket-le-prieur.webp',
 rocketHeavy:'fx-pack-v189/projectiles/rocket-heavy.webp',
 muzzle:'fx-pack-v189/projectiles/muzzle-flash.webp',
 bomb:'fx-pack-v189/projectiles/shell-naval.webp',
 shell:'fx-pack-v189/projectiles/shell-37mm.webp',
 shellAuto:'fx-pack-v189/projectiles/shell-autocannon.webp',
 bulletBrass:'fx-pack-v189/projectiles/bullet-brass.webp',
 grenade:'fx-pack-v189/projectiles/grenade-aerial.webp',
 tracerAmber:'fx-pack-v189/projectiles/tracer-amber.webp',
 tracerCream:'fx-pack-v189/projectiles/tracer-cream.webp',
 tracerOrange:'fx-pack-v189/projectiles/tracer-orange.webp',
 tracerViolet:'fx-pack-v189/projectiles/tracer-violet.webp',
 spark:'fx-pack-v189/explosions/impact-spark.webp',
 ricochet:'fx-pack-v189/explosions/impact-ricochet.webp',
 debris:'fx-pack-v189/explosions/impact-aircraft-debris.webp',
 explosion0:'fx-pack-v189/explosions/explosion-air-0.webp',
 explosion1:'fx-pack-v189/explosions/explosion-air-1.webp',
 explosion2:'fx-pack-v189/explosions/explosion-air-2.webp',
 explosion3:'fx-pack-v189/explosions/explosion-air-3.webp',
 waterColumn:'fx-pack-v189/explosions/splash-naval.webp',
 fire:'fx-pack-v189/gas-smoke/fire-aircraft.webp',
 fireSmall:'fx-pack-v189/gas-smoke/fire-small.webp',
 smokePuff:'fx-pack-v189/gas-smoke/smoke-gun.webp',
 smokeDark:'fx-pack-v189/gas-smoke/smoke-damage.webp',
 smokeWisp:'fx-pack-v189/gas-smoke/gas-dissipate.webp',
 smokeGray:'fx-pack-v189/gas-smoke/smoke-engine.webp',
 smokeOil:'fx-pack-v189/gas-smoke/smoke-oil.webp',
 gas:'fx-pack-v189/gas-smoke/gas-broad.webp',
 gasSmall:'fx-pack-v189/gas-smoke/gas-small.webp',
 exhaust:'fx-pack-v189/gas-smoke/exhaust-rocket.webp',
 vaporTrail:'fx-pack-v189/gas-smoke/vapor-trail.webp',
 flameJet:'fx-flame-jet.webp',flameTongue1:'fx-flame-tongue-1.webp',flameTongue2:'fx-flame-tongue-2.webp',flameTongue3:'fx-flame-tongue-3.webp',
 // FX family pass 20260925 — generated unified set (all share one painterly palette)
 pop0:'fx-pop-0.webp',pop1:'fx-pop-1.webp',pop2:'fx-pop-2.webp',pop3:'fx-pop-3.webp',
 shellBurst0:'fx-shellburst-0.webp',shellBurst1:'fx-shellburst-1.webp',shellBurst2:'fx-shellburst-2.webp',shellBurst3:'fx-shellburst-3.webp',
 structure0:'fx-structure-0.webp',structure1:'fx-structure-1.webp',structure2:'fx-structure-2.webp',structure3:'fx-structure-3.webp',
 bossBlast0:'fx-bossblast-0.webp',bossBlast1:'fx-bossblast-1.webp',bossBlast2:'fx-bossblast-2.webp',bossBlast3:'fx-bossblast-3.webp',
 mineBlast0:'fx-mineblast-0.webp',mineBlast1:'fx-mineblast-1.webp',mineBlast2:'fx-mineblast-2.webp',mineBlast3:'fx-mineblast-3.webp',
 fireEngine:'fx-fire-engine.webp',fireWing:'fx-fire-wing.webp',fireGround:'fx-combat-ground-fire.webp',
 smokeTrail:'fx-smoke-trail.webp',smokeHeavy:'fx-smoke-heavy.webp',gunSmoke:'fx-combat-gun-smoke.webp',engineSmoke:'fx-combat-engine-smoke.webp',
 splashTiny:'fx-splash-tiny.webp',splashShell:'fx-splash-shell.webp',wakeFast:'fx-wake-fast.webp',foamRing:'fx-foam-ring.webp',
 muzzleTwin:'fx-muzzle-twin.webp',muzzleHeavy:'fx-muzzle-heavy.webp',muzzleRear:'fx-muzzle-rear.webp',muzzlePistol:'fx-muzzle-pistol.webp',
 dustPuff:'fx-dust-puff.webp',dirtBurst:'fx-dirt-burst.webp',debrisShard:'fx-debris-shard.webp',
 sunshaft:'fx-sunshaft.webp',windStreak:'fx-wind-streak.webp',mist:'fx-mist.webp',
 torpedo:'fx-torpedo.webp',shockRing:'fx-shock-ring.webp',searchlight:'fx-city-searchlight.webp',
 mortarShell:'fx-combat-mortar-shell.webp',lePrieur:'fx-combat-le-prieur.webp'
},FX56_OFF?{}:FX56_FILES);
const fxImgs={};
const fx189Ready=typeof Image==='undefined'?Promise.resolve():Promise.all(Object.entries(FX_FILES).map(([key,file])=>new Promise(res=>{
 const im=new Image();im.onload=()=>{fxImgs[key]=im;res()};im.onerror=()=>res();im.src='./'+file+'?v=fx5';
})));
export const fxArtReady=Promise.all([fx189Ready,fx196ArtReady]);
export function fxReady(key){return fx196Ready(key)||!!fxImgs[key]}
export function fxImage(key){return fx196Image(key)||fxImgs[key]||null}
// Draw sprite centered at x,y, rotated to angle (0 = sprite's natural right/up orientation), fit inside w×h.
export function fx(c,key,x,y,w,h=w,angle=0,alpha=1){
 if(fx196Ready(key))return fx196Draw(c,key,x,y,w,h,angle,alpha);
 const im=fxImgs[key];if(!im)return false;
 c.save();c.translate(x,y);if(angle)c.rotate(angle);c.globalAlpha*=alpha;
 if(FX56&&FX_FILES[key].startsWith('fx-pack-v189/')){c.imageSmoothingEnabled=false;c.drawImage(im,-w/2,-h/2,w,h)}
 else{const k=Math.min(w/im.naturalWidth,h/im.naturalHeight),dw=im.naturalWidth*k,dh=im.naturalHeight*k;
  c.drawImage(im,-dw/2,-dh/2,dw,dh)}
 c.restore();return true;
}
const tintCache=new Map();
// Lazily bake a color-multiplied copy so painted shading survives tinting.
export function fxTintedCanvas(key,color){
 if(fx196Ready(key))return fx196TintedCanvas(key,color);
 const im=fxImgs[key];if(!im)return null;
 const ck=key+color;let c=tintCache.get(ck);
 if(c===undefined){
  c=null;if(typeof document!=='undefined'){
   const cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;
   const g=cv.getContext('2d');g.drawImage(im,0,0);g.globalCompositeOperation='multiply';g.fillStyle=color;g.fillRect(0,0,cv.width,cv.height);
   g.globalCompositeOperation='destination-in';g.drawImage(im,0,0);c=cv;
  }
  tintCache.set(ck,c);
 }
 return c;
}
export function fxTint(c,key,color,x,y,w,h=w,angle=0,alpha=1){
 if(fx196Ready(key))return fx196Tint(c,key,color,x,y,w,h,angle,alpha);
 const cv=fxTintedCanvas(key,color);if(!cv)return fx(c,key,x,y,w,h,angle,alpha);
 c.save();c.translate(x,y);if(angle)c.rotate(angle);c.globalAlpha*=alpha;
 if(FX56&&FX_FILES[key].startsWith('fx-pack-v189/')){c.imageSmoothingEnabled=false;c.drawImage(cv,-w/2,-h/2,w,h)}
 else{const k=Math.min(w/cv.width,h/cv.height),dw=cv.width*k,dh=cv.height*k;c.drawImage(cv,-dw/2,-dh/2,dw,dh)}
 c.restore();return true;
}

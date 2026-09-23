// Combat FX pack v189 — approved sprite set lives in fx-pack-v189/ and maps onto
// the keys already called by the renderers. Unmapped keys stay procedural.
// Rollback: append ?fx=0 to the URL — FX_FILES empties and every call site
// falls back to procedural drawing exactly as before.
const FX_OFF=typeof location!=='undefined'&&new URLSearchParams(location.search).get('fx')==='0';
const FX56_OFF=typeof location!=='undefined'&&new URLSearchParams(location.search).get('fx56')==='0';
export const FX56=!FX_OFF&&!FX56_OFF;
const FX56_FILES={
 rocket:'fx-combat-le-prieur.png',mine:'fx-combat-iron-mine.png',
 shell:'fx-combat-mortar-shell.png',bomb:'fx-combat-mortar-shell.png',
 explosion0:'fx-combat-blast-0.png',explosion1:'fx-combat-blast-1.png',
 explosion2:'fx-combat-blast-2.png',explosion3:'fx-combat-blast-3.png',
 smokeDark:'fx-combat-engine-smoke.png',smokeGray:'fx-combat-gun-smoke.png',
 smokeWisp:'fx-combat-gun-smoke.png',smokePuff:'fx-combat-gun-smoke.png',
 fire:'fx-combat-ground-fire.png',flak:'fx-combat-flak-burst.png'
};
const FX_FILES=FX_OFF?{}:Object.assign({
 rocket:'fx-pack-v189/projectiles/rocket-le-prieur.png',
 rocketHeavy:'fx-pack-v189/projectiles/rocket-heavy.png',
 muzzle:'fx-pack-v189/projectiles/muzzle-flash.png',
 bomb:'fx-pack-v189/projectiles/shell-naval.png',
 shell:'fx-pack-v189/projectiles/shell-37mm.png',
 shellAuto:'fx-pack-v189/projectiles/shell-autocannon.png',
 bulletBrass:'fx-pack-v189/projectiles/bullet-brass.png',
 grenade:'fx-pack-v189/projectiles/grenade-aerial.png',
 tracerAmber:'fx-pack-v189/projectiles/tracer-amber.png',
 tracerCream:'fx-pack-v189/projectiles/tracer-cream.png',
 tracerOrange:'fx-pack-v189/projectiles/tracer-orange.png',
 tracerViolet:'fx-pack-v189/projectiles/tracer-violet.png',
 spark:'fx-pack-v189/explosions/impact-spark.png',
 ricochet:'fx-pack-v189/explosions/impact-ricochet.png',
 debris:'fx-pack-v189/explosions/impact-aircraft-debris.png',
 explosion0:'fx-pack-v189/explosions/explosion-air-0.png',
 explosion1:'fx-pack-v189/explosions/explosion-air-1.png',
 explosion2:'fx-pack-v189/explosions/explosion-air-2.png',
 explosion3:'fx-pack-v189/explosions/explosion-air-3.png',
 explosionGround:'fx-pack-v189/explosions/explosion-ground.png',
 heavyBomb:'fx-pack-v189/explosions/explosion-heavy-bomb.png',
 flakBurst:'fx-pack-v189/explosions/flak-airburst.png',
 waterColumn:'fx-pack-v189/explosions/splash-naval.png',
 fireWreck:'fx-pack-v189/explosions/fire-wreck.png',
 fire:'fx-pack-v189/gas-smoke/fire-aircraft.png',
 fireSmall:'fx-pack-v189/gas-smoke/fire-small.png',
 smokePuff:'fx-pack-v189/gas-smoke/smoke-gun.png',
 smokeDark:'fx-pack-v189/gas-smoke/smoke-damage.png',
 smokeWisp:'fx-pack-v189/gas-smoke/gas-dissipate.png',
 smokeGray:'fx-pack-v189/gas-smoke/smoke-engine.png',
 smokeOil:'fx-pack-v189/gas-smoke/smoke-oil.png',
 gas:'fx-pack-v189/gas-smoke/gas-broad.png',
 gasSmall:'fx-pack-v189/gas-smoke/gas-small.png',
 exhaust:'fx-pack-v189/gas-smoke/exhaust-rocket.png',
 vaporTrail:'fx-pack-v189/gas-smoke/vapor-trail.png'
},FX56_OFF?{}:FX56_FILES);
const fxImgs={};
export const fxArtReady=typeof Image==='undefined'?Promise.resolve():Promise.all(Object.entries(FX_FILES).map(([key,file])=>new Promise(res=>{
 const im=new Image();im.onload=()=>{fxImgs[key]=im;res()};im.onerror=()=>res();im.src='./'+file+'?v=fx3';
})));
export function fxReady(key){return !!fxImgs[key]}
export function fxImage(key){return fxImgs[key]||null}
// Draw sprite centered at x,y, rotated to angle (0 = sprite's natural right/up orientation), fit inside w×h.
export function fx(c,key,x,y,w,h=w,angle=0,alpha=1){
 const im=fxImgs[key];if(!im)return false;
 c.save();c.translate(x,y);if(angle)c.rotate(angle);c.globalAlpha*=alpha;
 if(FX56){c.imageSmoothingEnabled=false;c.drawImage(im,-w/2,-h/2,w,h)}
 else{const k=Math.min(w/im.naturalWidth,h/im.naturalHeight),dw=im.naturalWidth*k,dh=im.naturalHeight*k;
  c.drawImage(im,-dw/2,-dh/2,dw,dh)}
 c.restore();return true;
}
const tintCache=new Map();
// Lazily bake a color-multiplied copy so painted shading survives tinting.
export function fxTintedCanvas(key,color){
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
 const cv=fxTintedCanvas(key,color);if(!cv)return fx(c,key,x,y,w,h,angle,alpha);
 c.save();c.translate(x,y);if(angle)c.rotate(angle);c.globalAlpha*=alpha;
 if(FX56)c.imageSmoothingEnabled=false;
 c.drawImage(cv,-w/2,-h/2,w,h);c.restore();return true;
}

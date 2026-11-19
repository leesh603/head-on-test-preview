import {SOMME_FRAMES} from './somme-boss-atlas.js?v=tame3';
import {fx} from './fx-art.js?v=tame3';
import {CITY_BOMBER_GUN_REACH} from './city-bomber-flight.js';
import {drawCityBomberBay,drawCityBomberPropeller} from './gotha-detail-art.js?v=20261022';
import {O400_LAYOUT} from './o400-layout.js';
import {gothaCrashPose} from './aircraft-crash.js?v=descent20261022';
const assets={
 hull:O400_LAYOUT.hull,gun:'./boss-mark1-guns-r3.webp',hardware:'./boss-alps-hardware-20261020.webp?v=muted1',
 propellerClear:'./o400-propeller-clear-20261119.webp',
 wingModerate:'./o400-wing-damage-moderate-20261103.webp',wingSevere:'./o400-wing-damage-severe-20261103.webp',
 engineModerate:'./o400-engine-damage-moderate-20261115.webp',engineSevere:'./o400-engine-damage-severe-20261115.webp'
};
const images={};
let pending,attempts=0,retryAt=0;
export function prepareO400Art(){if(pending)return pending;if(attempts>=3||Date.now()<retryAt)return Promise.resolve();attempts++;
 pending=Promise.all(Object.entries(assets).map(([key,url])=>new Promise(resolve=>{
  const im=new Image();images[key]=im;im.decoding='async';im.onload=()=>resolve(im);
  im.onerror=()=>{if(key==='hull'&&!im.fallback){im.fallback=true;im.src='./o400-native-fallback-20261031.webp';}else resolve(im);};
  im.src=url;
 }))).then(()=>{if(!artReady()){pending=null;retryAt=Date.now()+1000;}});return pending;}
function artReady(){return Object.keys(assets).every(key=>images[key]?.naturalWidth>0);}
// Cropped from the 1536x1024 framing, with the original pixels at all joins.
const enginePatches={left:416,right:861,top:44,w:260,h:409};
function enginePatch(side){
 const {top,w,h}=enginePatches,k=O400_LAYOUT.width/1536;
 return {x:enginePatches[side]*k-O400_LAYOUT.width/2,y:top*k-O400_LAYOUT.height/2,w:w*k,h:h*k};
}
function engineDamage(b,side){
 const p=b.parts?.find(p=>p.id==='engine-'+side);
 return !p?0:p.destroyed||b.destroying?2:p.hp<p.maxHp*.55?1:0;
}
function engineArt(state){
 return state===2?images.engineSevere:state===1?images.engineModerate:null;
}
function drawFallbackEngine(c,side,state,clearPropeller=false){
 const pos=side==='left'?-27:27,im=images.hardware,scale=.2,pivot=state===1?97:80;
 c.drawImage(im,state*192,0,192,192,pos-pivot*scale,-23-100*scale,38.4,38.4);
 if(state===1&&!clearPropeller){
  const hull=images.hull,sx=hull.naturalWidth/O400_LAYOUT.width,sy=hull.naturalHeight/O400_LAYOUT.height;
  c.drawImage(hull,(pos-12+O400_LAYOUT.width/2)*sx,(-55+O400_LAYOUT.height/2)*sy,24*sx,21*sy,pos-12,-55,24,21);
 }
}
function cutHullComponent(c,x,y,w,h){c.beginPath();c.rect(-O400_LAYOUT.width/2,-O400_LAYOUT.height/2,O400_LAYOUT.width,O400_LAYOUT.height);c.rect(x,y,w,h);c.clip('evenodd');}
function wingRect(c,side){c.rect(side==='left'?-92:40,-40,52,40);}
function drawHull(c,b){
 const {hull,wingModerate,wingSevere,propellerClear,hardware}=images,clearPropellers=propellerClear?.naturalWidth>0&&hardware?.naturalWidth>0,propHeight=180*O400_LAYOUT.width/1536;
 c.save();
 for(const side of ['left','right']){
  const stage=b.wingDamage?.[side]?.stage,im=stage===2?wingSevere:wingModerate;
  if(stage>0&&im?.naturalWidth){c.beginPath();c.rect(-92,-O400_LAYOUT.height/2,184,O400_LAYOUT.height);wingRect(c,side);c.clip('evenodd');}
  const damage=engineDamage(b,side),engine=engineArt(damage);
  if(engine?.naturalWidth){const q=enginePatch(side);cutHullComponent(c,q.x,q.y,q.w,q.h);}
  else if(damage&&images.hardware?.naturalWidth){
   const x=side==='left'?-27:27;
   cutHullComponent(c,x-6,-41,12,34);
   if(damage===2)cutHullComponent(c,x-12,-55,24,21);
  }
  if(clearPropellers&&damage<2){const q=enginePatch(side);cutHullComponent(c,q.x,q.y,q.w,propHeight);}
 }
 c.drawImage(hull,-O400_LAYOUT.width/2,-O400_LAYOUT.height/2,O400_LAYOUT.width,O400_LAYOUT.height);c.restore();
 for(const side of ['left','right']){
  const damage=engineDamage(b,side),engine=engineArt(damage),w=b.wingDamage?.[side],im=w?.stage===2?wingSevere:wingModerate;
  const clearPropeller=clearPropellers&&damage<2;
  if(clearPropeller){const q=enginePatch(side),sw=propellerClear.naturalWidth/2;c.drawImage(propellerClear,side==='left'?0:sw,0,sw,propellerClear.naturalHeight,q.x,q.y,q.w,propHeight);}
  if(w?.stage>0&&im?.naturalWidth){c.save();c.beginPath();wingRect(c,side);c.clip();c.drawImage(im,-92,-O400_LAYOUT.height/2,184,O400_LAYOUT.height);c.restore();}
  if(engine?.naturalWidth){const q=enginePatch(side),sw=engine.naturalWidth/2;c.save();if(clearPropeller)cutHullComponent(c,q.x,q.y,q.w,propHeight);c.drawImage(engine,side==='left'?0:sw,0,sw,engine.naturalHeight,q.x,q.y,q.w,q.h);c.restore();}
  else if(damage&&hardware?.naturalWidth)drawFallbackEngine(c,side,damage,clearPropeller);
  if(clearPropeller)drawCityBomberPropeller(c,hardware,side==='left'?-26.8:26.8,-44.6,b.motionTime||0,side==='left'?0:1.7,28,false,2);
  if(w?.hitFlash>0)fx(c,'armorSpark',side==='left'?-66:66,-24,18,18,0,Math.min(1,w.hitFlash/.12));
 }
}
export function drawO400(c,b){const {hull,gun,hardware}=images;if(!artReady())prepareO400Art();if(!hull?.naturalWidth)return;const crash=b.destroying?gothaCrashPose(b,b.destructionAge,b.destructionDuration):null;c.save();c.translate(crash?.x??b.x,crash?.y??b.y);c.rotate(crash?.angle??((b.a||0)+Math.PI/2));c.imageSmoothingEnabled=true;const scale=b.regionalScale||1;if(scale!==1)c.scale(scale,scale);if(crash){c.scale(crash.scale*crash.bank,crash.scale);c.globalAlpha*=crash.alpha;}drawHull(c,b);
 for(const p of b.parts||[]){const a=(b.a||0)+Math.PI/2,co=Math.cos(a),si=Math.sin(a),x=(p.x*co+p.y*si)/scale,y=(-p.x*si+p.y*co)/scale;
  if(p.id.endsWith('-gun')&&gun?.naturalWidth){const state=p.destroyed?'wreck':p.hp<p.maxHp*.55?'damaged':'normal',f=SOMME_FRAMES['mark1-gun-mg-'+state],k=CITY_BOMBER_GUN_REACH/f.reach;c.save();c.translate(x,y);c.rotate((p.aimAngle??((b.a||0)+(p.id==='rear-gun'?Math.PI:0)))-(b.a||0));c.drawImage(gun,...f.rect,-f.pivot[0]*k,-f.pivot[1]*k,f.rect[2]*k,f.rect[3]*k);if(!p.destroyed&&p.gunFlash>0)fx(c,'muzzle',0,-CITY_BOMBER_GUN_REACH,9,16,0,Math.min(1,p.gunFlash/.12));c.restore();}
  if(p.id.startsWith('engine')){if(p.destroyed||crash){const wake=crash?40:24;fx(c,'smokeTrail',x,y+wake,24,crash?94:57,Math.PI/2,.55);fx(c,'fireEngine',x,y,18,23,0,.72);}else if(p.hp<p.maxHp*.55)fx(c,'smokeTrail',x,y+14,16,30,Math.PI/2,.35);}
  if(p.id==='bomb-bay'&&hardware?.naturalWidth&&(p.destroyed||p.hp<p.maxHp*.55||b.bayOpen>0))drawCityBomberBay(c,hardware,b,p,x,y,19);
  if(p.hitFlash>0)fx(c,'armorSpark',x,y,18,18,0,Math.min(1,p.hitFlash/.12));
 }
 c.restore();}


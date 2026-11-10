import {SOMME_FRAMES} from './somme-boss-atlas.js?v=b3bf991d11fc7798';
import {fx} from './fx-art.js?v=b3bf991d11fc7798';
import {O400_LAYOUT} from './o400-layout.js?v=b3bf991d11fc7798';
import {gothaCrashPose} from './aircraft-crash.js?v=b3bf991d11fc7798';
let hull,gun,hardware,wingModerate,wingSevere,pending,attempts=0,retryAt=0;
export function prepareO400Art(){if(pending)return pending;if(attempts>=3||Date.now()<retryAt)return Promise.resolve();attempts++;
 pending=Promise.all([['hull',O400_LAYOUT.hull],['gun','./boss-mark1-guns-r3.webp'],['hardware','./boss-alps-hardware-20261020.webp?v=muted1'],['wingModerate','./o400-wing-damage-moderate-20261103.webp'],['wingSevere','./o400-wing-damage-severe-20261103.webp']].map(([key,url])=>new Promise(resolve=>{const im=new Image();if(key==='hull')hull=im;else if(key==='gun')gun=im;else if(key==='hardware')hardware=im;else if(key==='wingModerate')wingModerate=im;else wingSevere=im;im.decoding='async';im.onload=()=>resolve(im);im.onerror=()=>{if(key==='hull'&&!im.fallback){im.fallback=true;im.src='./o400-native-fallback-20261031.webp';}else resolve(im);};im.src=url;}))).then(()=>{if(!hull?.naturalWidth||!gun?.naturalWidth||!hardware?.naturalWidth||!wingModerate?.naturalWidth||!wingSevere?.naturalWidth){pending=null;retryAt=Date.now()+1000;}});return pending;}
function tile(c,index,x,y,size,pivot=[96,96]){const k=size/192;c.drawImage(hardware,index%3*192,Math.floor(index/3)*192,192,192,x-pivot[0]*k,y-pivot[1]*k,size,size);}
function cutHullComponent(c,x,y,w,h){c.beginPath();c.rect(-O400_LAYOUT.width/2,-O400_LAYOUT.height/2,O400_LAYOUT.width,O400_LAYOUT.height);c.rect(x,y,w,h);c.clip('evenodd');}
function wingRect(c,side){c.rect(side==='left'?-92:40,-40,52,40);}
function drawHull(c,b){
 c.save();
 for(const side of ['left','right']){const state=b.wingDamage?.[side]?.stage,im=state===2?wingSevere:wingModerate;if(state>0&&im?.naturalWidth){c.beginPath();c.rect(-92,-O400_LAYOUT.height/2,184,O400_LAYOUT.height);wingRect(c,side);c.clip('evenodd');}}
 if(hardware?.naturalWidth)for(const p of b.parts||[])if(p.id.startsWith('engine')&&(p.destroyed||p.hp<p.maxHp*.55)){
  const x=p.id==='engine-left'?-27:27;
  // Remove only the painted pod; the authored damaged/wreck hardware replaces
  // it. A lost engine also loses its original four-blade prop, not a second
  // intact prop still spinning under the fire. Healthy pixels are untouched.
  cutHullComponent(c,x-6,-41,12,34);
  if(p.destroyed)cutHullComponent(c,x-12,-55,24,21);
 }
 c.drawImage(hull,-O400_LAYOUT.width/2,-O400_LAYOUT.height/2,O400_LAYOUT.width,O400_LAYOUT.height);c.restore();
 for(const side of ['left','right']){const w=b.wingDamage?.[side],im=w?.stage===2?wingSevere:wingModerate;if(w?.stage>0&&im?.naturalWidth){c.save();c.beginPath();wingRect(c,side);c.clip();c.drawImage(im,-92,-O400_LAYOUT.height/2,184,O400_LAYOUT.height);c.restore();}if(w?.hitFlash>0)fx(c,'armorSpark',side==='left'?-66:66,-24,18,18,0,Math.min(1,w.hitFlash/.12));}
}
export function drawO400(c,b){if(!hardware?.naturalWidth||!gun?.naturalWidth||!wingModerate?.naturalWidth||!wingSevere?.naturalWidth)prepareO400Art();if(!hull?.naturalWidth){prepareO400Art();return;}const crash=b.destroying?gothaCrashPose(b,b.destructionAge,b.destructionDuration):null;c.save();c.translate(crash?.x??b.x,crash?.y??b.y);c.rotate(crash?.angle??((b.a||0)+Math.PI/2));c.imageSmoothingEnabled=true;if(crash){c.scale(crash.scale*crash.bank,crash.scale);c.globalAlpha*=crash.alpha;}drawHull(c,b);
 for(const p of b.parts||[]){const a=(b.a||0)+Math.PI/2,co=Math.cos(a),si=Math.sin(a),x=p.x*co+p.y*si,y=-p.x*si+p.y*co;
  if(p.id.endsWith('-gun')&&gun?.naturalWidth){const state=p.destroyed?'wreck':p.hp<p.maxHp*.55?'damaged':'normal',f=SOMME_FRAMES['mark1-gun-mg-'+state],k=5/f.reach;c.save();c.translate(x,y);c.rotate((p.aimAngle??((b.a||0)+(p.id==='rear-gun'?Math.PI:0)))-(b.a||0));c.drawImage(gun,...f.rect,-f.pivot[0]*k,-f.pivot[1]*k,f.rect[2]*k,f.rect[3]*k);if(!p.destroyed&&p.gunFlash>0)fx(c,'muzzle',0,-6,9,16,0,Math.min(1,p.gunFlash/.12));c.restore();}
  if(p.id.startsWith('engine')){const state=p.destroyed?2:p.hp<p.maxHp*.55?1:0;if(state&&hardware?.naturalWidth)tile(c,state,x,y,38.4,state===1?[97,100]:[80,100]);if(state===1){const sx=hull.naturalWidth/O400_LAYOUT.width,sy=hull.naturalHeight/O400_LAYOUT.height;c.drawImage(hull,(x-12+O400_LAYOUT.width/2)*sx,(-55+O400_LAYOUT.height/2)*sy,24*sx,21*sy,x-12,-55,24,21);}if(p.destroyed||crash){fx(c,'fireEngine',x,y,18,23,0,.7);fx(c,'smokeDark',x,y+18,30,40,0,.5);}else if(p.hp<p.maxHp*.55)fx(c,'smokeTrail',x,y+14,16,30,Math.PI/2,.35);}
  if(p.id==='bomb-bay'&&hardware?.naturalWidth&&(p.destroyed||p.hp<p.maxHp*.55||b.bayOpen>0)){tile(c,p.destroyed?11:10,x,y,19,p.destroyed?[80,96]:[97,96]);}
  if(p.hitFlash>0)fx(c,'armorSpark',x,y,18,18,0,Math.min(1,p.hitFlash/.12));
 }
 c.restore();}


import {SOMME_FRAMES} from './somme-boss-atlas.js';
import {fx} from './fx-art.js';
import {O400_LAYOUT} from './o400-layout.js';
import {gothaCrashPose} from './aircraft-crash.js';
let hull,gun,pending,attempts=0,retryAt=0;
export function prepareO400Art(){if(pending)return pending;if(attempts>=3||Date.now()<retryAt)return Promise.resolve();attempts++;
 pending=Promise.all([['hull',O400_LAYOUT.hull],['gun','./boss-mark1-guns-r3.webp']].map(([key,url])=>new Promise(resolve=>{const im=new Image();if(key==='hull')hull=im;else gun=im;im.decoding='async';im.onload=()=>resolve(im);im.onerror=()=>{if(key==='hull'&&!im.fallback){im.fallback=true;im.src='./o400-native-fallback-20261031.webp';}else resolve(im);};im.src=url;}))).then(()=>{if(!hull?.naturalWidth||!gun?.naturalWidth){pending=null;retryAt=Date.now()+1000;}});return pending;}
export function drawO400(c,b){if(!hull?.naturalWidth){prepareO400Art();return;}const crash=b.destroying?gothaCrashPose(b,b.destructionAge,b.destructionDuration):null;c.save();c.translate(crash?.x??b.x,crash?.y??b.y);c.rotate(crash?.angle??((b.a||0)+Math.PI/2));c.imageSmoothingEnabled=true;if(crash){c.scale(crash.scale*crash.bank,crash.scale);c.globalAlpha*=crash.alpha;}c.drawImage(hull,-O400_LAYOUT.width/2,-O400_LAYOUT.height/2,O400_LAYOUT.width,O400_LAYOUT.height);
 for(const p of b.parts||[]){const a=(b.a||0)+Math.PI/2,co=Math.cos(a),si=Math.sin(a),x=p.x*co+p.y*si,y=-p.x*si+p.y*co;
  if(p.id.endsWith('-gun')&&gun?.naturalWidth){const state=p.destroyed?'wreck':p.hp<p.maxHp*.55?'damaged':'normal',f=SOMME_FRAMES['mark1-gun-mg-'+state],k=5/f.reach;c.save();c.translate(x,y);c.rotate((p.aimAngle??((b.a||0)+(p.id==='rear-gun'?Math.PI:0)))-(b.a||0));c.drawImage(gun,...f.rect,-f.pivot[0]*k,-f.pivot[1]*k,f.rect[2]*k,f.rect[3]*k);if(!p.destroyed&&p.gunFlash>0)fx(c,'muzzle',0,-6,9,16,0,Math.min(1,p.gunFlash/.12));c.restore();}
  if(p.id.startsWith('engine')){if(p.destroyed||crash){fx(c,'fireEngine',x,y,18,23,0,.7);fx(c,'smokeDark',x,y+18,30,40,0,.5);}else if(p.hp<p.maxHp*.55)fx(c,'smokeTrail',x,y+14,16,30,Math.PI/2,.35);}
 }
 c.restore();}

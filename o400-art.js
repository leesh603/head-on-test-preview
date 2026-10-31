import {SOMME_FRAMES} from './somme-boss-atlas.js';
import {fx} from './fx-art.js';
let hull,gun,pending,attempts=0,retryAt=0;
export function prepareO400Art(){if(pending)return pending;if(attempts>=3||Date.now()<retryAt)return Promise.resolve();attempts++;
 pending=Promise.all([['hull','./o400-runtime-hull-20261031.webp'],['gun','./boss-mark1-guns-r3.webp']].map(([key,url])=>new Promise(resolve=>{const im=new Image();if(key==='hull')hull=im;else gun=im;im.onload=()=>resolve(im);im.onerror=()=>{if(key==='hull'&&!im.fallback){im.fallback=true;im.src='./o400-native-fallback-20261031.webp';}else resolve(im);};im.src=url;}))).then(()=>{if(!hull?.naturalWidth||!gun?.naturalWidth){pending=null;retryAt=Date.now()+1000;}});return pending;}
export function drawO400(c,b){if(!hull?.naturalWidth){prepareO400Art();return;}const death=b.destroying?Math.min(1,b.destructionAge/Math.max(.1,b.destructionDuration)):0;c.save();c.translate(b.x,b.y);c.rotate((b.a||0)+Math.PI/2);c.globalAlpha*=1-death;c.drawImage(hull,-92,-61.333,184,122.666);
 for(const p of b.parts||[]){const a=(b.a||0)+Math.PI/2,co=Math.cos(a),si=Math.sin(a),x=p.x*co+p.y*si,y=-p.x*si+p.y*co;
  if(p.id.endsWith('-gun')&&gun?.naturalWidth&&!hull.fallback){const state=p.destroyed?'wreck':p.hp<p.maxHp*.55?'damaged':'normal',f=SOMME_FRAMES['mark1-gun-mg-'+state],k=5/f.reach;c.save();c.translate(x,y);c.rotate((p.aimAngle??((b.a||0)+(p.id==='rear-gun'?Math.PI:0)))-(b.a||0));c.drawImage(gun,...f.rect,-f.pivot[0]*k,-f.pivot[1]*k,f.rect[2]*k,f.rect[3]*k);c.restore();}
  if(p.destroyed&&p.id.startsWith('engine')){fx(c,'fireEngine',x,y,18,23,0,.7);fx(c,'smokeDark',x,y+18,30,40,0,.5);}
 }
 c.restore();}

// Cosmetic only: host arrival clocks, actual hull alpha, no weapons/FX renderer.
import {ALPS_BOMBER_LAYOUT} from './alps-bomber-layout.js?v=gal1';
import {PARIS_STAAKEN_LAYOUT} from './paris-night-bosses.js?v=tame3&ai=1018&sig=1019&boss=20261020b&phase=1021';
import {O400_LAYOUT} from './o400-layout.js';
import {CAPITAL_BOSS_ART} from './capital-boss-art.js';
import {capitalPartPose} from './capital-bosses.js';
const clamp=q=>Math.max(0,Math.min(1,q));
const sources={
 'supermarine-nighthawk':['./asset-bank/outlined/native/boss-dover-nighthawk.webp',17],
 'siemens-schuckert-r-viii':['./asset-bank/outlined/native/boss-dover-rviii.webp',17],
 'staaken-rvi':['./asset-bank/outlined/native/boss-staaken-body352.webp',11],
 'paris-staaken-rvi':['./asset-bank/outlined/native/paris-staaken-parts1918.webp?v=bomber-style20261024',15],
 'o400-raider':[O400_LAYOUT.hull,4],
 'gotha-raider':['./gotha-runtime-hull-20261031.webp?v=natural-flight20261031',4,11],
 gik:['./boss-alps-gik-states-20261020.webp?v=bomber-style20261024',6],
 ca4:['./boss-alps-ca4-states-20261113.webp',6],
 'zeppelin-l70':['./boss-sky-l70-states-20261020.webp?v=muted1',5],
 hma23:['./boss-sky-hma23-states-20261020.webp?v=muted1',5]
};
const images=new Map(),masks=new Map();let generation=0;
function load(path){if(images.has(path))return Promise.resolve();const im=new Image();images.set(path,im);im.decoding='async';return new Promise(resolve=>{im.onload=()=>Promise.resolve(im.decode?.()).catch(()=>{}).then(resolve);im.onerror=resolve;im.src=path;});}
export function prepareBossArrivalShadows(region){
 generation++;images.clear();masks.clear();
 if(typeof Image==='undefined')return Promise.resolve();
 const paths=Object.values(sources).filter(s=>s.slice(1).includes(region)).map(s=>s[0]);
 const capital=CAPITAL_BOSS_ART[region===18?'final-kaiserkrone':region===11?'final-leviathan':''];
 if(capital)paths.push(...Object.values(capital.images));
 return Promise.all(paths.map(load));
}
export function bossArrivalShadowPose(b){
 // Formation identity is the announced bombing run; only singles/airships
 // receive this emphasized forward entry projection. Native shadows stay native.
 if(b.kind==='o400-raider'||b.kind==='gotha-raider')return null;
 const p=b.arrivalPath,age=b.arrivalAge;
 if(!b.arrivalPending||!p||!Number.isFinite(age)||age<0||(!sources[b.kind]&&!CAPITAL_BOSS_ART[b.kind]))return null;
 const length=Math.hypot(p.dx,p.dy),h=bossArrivalHull(b),airship=['zeppelin-l70','hma23','final-kaiserkrone'].includes(b.kind);
 // A fixed ground projection of THIS aircraft, not a second flyby. Same hull,
 // heading and translation velocity throughout; only the sun offset leads it.
 const giant=['siemens-schuckert-r-viii','supermarine-nighthawk','staaken-rvi','paris-staaken-rvi','gik','ca4'].includes(b.kind);
 // Higher solo aircraft cast a longer fixed sun projection. It translates
 // exactly with the real hull: no independent flyby, resizing or acceleration.
 const reach=giant?Math.min(560,Math.max(360,length*.35)):Math.min(150,Math.max(46,(h?.h||180)*.42)),dx=length?-p.dx/length:0,dy=length?-p.dy/length:0;
 const end=(b.arrivalHold||.25)+(b.arrivalDuration||3);
 return {x:b.x+dx*reach+10,y:b.y+dy*reach+16,alpha:(airship?.16:.24)*clamp(age/.12)*clamp((end-age)/.35)};
}
export function bossArrivalHull(b){
 const s=b.t?.geometryScale||b.geometryScale||1,k=b.kind;
 if(k==='o400-raider')return {w:O400_LAYOUT.width,h:O400_LAYOUT.height,a:(b.a||0)+Math.PI/2};
 if(k==='gotha-raider')return {w:210,h:210,a:(b.a||0)+Math.PI/2};
 if(k==='staaken-rvi'){const w=380*(b.regionalScale||s);return {w,h:434*w/768,a:0};}
 if(['zeppelin-l70','hma23'].includes(k)){const w=390*s;return {w,h:w/4,a:0,rows:3};}
 if(ALPS_BOMBER_LAYOUT[k]){const l=ALPS_BOMBER_LAYOUT[k];return {w:l.width*s,h:l.height*s,a:b.hullYaw||0,cols:3};}
 if(k==='paris-staaken-rvi')return {w:PARIS_STAAKEN_LAYOUT.width*s,h:PARIS_STAAKEN_LAYOUT.height*s,a:(b.a||0)+Math.PI/2};
 if(b.layout&&sources[k])return {w:b.layout.width*s,h:b.layout.height*s,a:(b.a||0)+Math.PI/2};
 return null;
}
function canvas(w,h){if(!globalThis.document?.createElement)return null;const cv=document.createElement('canvas');cv.width=Math.max(1,Math.ceil(w));cv.height=Math.max(1,Math.ceil(h));return cv;}
function blacken(cv){const c=cv.getContext('2d');c.globalCompositeOperation='source-in';c.fillStyle='#000';c.fillRect(0,0,cv.width,cv.height);return cv;}
function hullMask(b,h){const path=sources[b.kind]?.[0],im=images.get(path);if(!im?.naturalWidth)return null;
 const key=path+':'+(h.rows||1)+':'+(h.cols||1);if(masks.has(key))return masks.get(key);
 const sw=im.naturalWidth/(h.cols||1),sh=im.naturalHeight/(h.rows||1),scale=Math.min(1,768/Math.max(sw,sh)),cv=canvas(sw*scale,sh*scale);if(!cv)return null;
 cv.getContext('2d').drawImage(im,0,0,sw,sh,0,0,cv.width,cv.height);blacken(cv);masks.set(key,cv);return cv;
}
function capitalMask(b){
 const art=CAPITAL_BOSS_ART[b.kind],key=b.kind+':'+(b.capitalScale||.6)+':'+(b.hullYaw||0)+':'+generation;
 if(masks.has(key))return masks.get(key);
 if(!Object.values(art.images).every(p=>images.get(p)?.naturalWidth))return null;
 const s=b.capitalScale||.6,w=art.width*s+160,h=art.height*s+160,ratio=Math.min(1,768/Math.max(w,h)),cv=canvas(w*ratio,h*ratio);if(!cv)return null;
 const c=cv.getContext('2d');c.scale(ratio,ratio);c.translate(w/2,h/2);
 // Paint only the existing articulated sprite frames; no effects callback,
 // bullets, warning lines, clouds, hit flashes, or combat renderer is invoked.
 for(const source of art.parts){const part=b.parts.get(source.id);if(!part)continue;const pose=capitalPartPose(b,part),im=images.get(art.images[source.atlas]);let [sx,sy,sw,sh]=source.frames[0];const pivot=source.framePivots?.[0]||source.pivot||[.5,.5];let dw=source.w*s,dh=source.h*s;if(source.preserveAspect!==false){const fit=Math.min(dw/sw,dh/sh);dw=sw*fit;dh=sh*fit;}let dx=-dw*pivot[0],dy=-dh*pivot[1];if(source.sourceHalf){if(source.sourceHalf==='right'){sx+=sw/2;dx+=dw/2;}sw/=2;dw/=2;}c.save();c.translate(pose.x-b.x,pose.y-b.y);c.rotate(pose.angle);c.scale(pose.scaleX??1,1);for(const offset of source.barrelOffsets||[0])c.drawImage(im,sx,sy,sw,sh,dx+offset*s,dy,dw,dh);c.restore();}
 c.setTransform(1,0,0,1,0,0);blacken(cv);const result={cv,w,h};masks.set(key,result);return result;
}
export function drawBossArrivalShadows(c,encounter){
 for(const b of encounter?.bodies.values()||[]){const p=bossArrivalShadowPose(b);if(!p||b.dead)continue;const h=bossArrivalHull(b),capital=CAPITAL_BOSS_ART[b.kind];let im,w,hh,a=0;
 if(h){im=hullMask(b,h);w=h.w;hh=h.h;a=h.a;}else if(capital){const m=capitalMask(b);if(m){im=m.cv;w=m.w;hh=m.h;}}
 if(!im)continue;c.save();c.translate(p.x,p.y);c.rotate(a);c.globalAlpha*=p.alpha;c.imageSmoothingEnabled=true;c.drawImage(im,-w/2,-hh/2,w,hh);c.restore();
 }
}

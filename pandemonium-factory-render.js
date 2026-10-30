import {factoryMuzzleLocal} from './pandemonium-factory-mechanics.js';
// Only authored sprites: no geometry stand-ins for missing factory artwork.
export const profile=Object.freeze({variant:'factory',label:'공장형 · 이동 군수공장',worldScale:1,width:512,height:768,pivot:{x:256,y:384},assetRoot:'./asset-bank/pandemonium-factory/'});
const specs={"aaHead": [135.0, 134.98046875, 0.19598086124401914], "aaBarrel": [58.265625, 315.60546875, 0.15311004784688995], "aaWreck": [139.18359375, 137.0, 0.19598086124401914], "crawlerHousing": [139.0, 185.18359375, 0.2143540669856459], "crawlerWreck": [143.18359375, 186.28515625, 0.2143540669856459], "craneBoom": [204, 526, 0.22]};
function load(path){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Factory asset unavailable: '+path));im.src=new URL(path,import.meta.url).href;});}
export async function loadAssets(){
 const paths={supply:'./asset-bank/pandemonium-factory/supply.webp',bodyWreck:'./asset-bank/pandemonium-factory/body-wreck.webp',boilerDamaged:'./asset-bank/pandemonium-factory/boiler-damaged.webp',productionDamaged:'./asset-bank/pandemonium-factory/production-damaged.webp',body:'./asset-bank/pandemonium-factory/body.webp',aircraft:'./asset-bank/pandemonium-factory/aircraft.webp',fx:'./asset-bank/pandemonium-factory/fx.webp',craneBoom:'./asset-bank/pandemonium-factory/craneBoom.webp',track:'./asset-bank/pandemonium-factory/track.webp'};
 for(const k of ['aaHead','aaBarrel','aaWreck','crawlerHousing','crawlerWreck'])paths[k]='./asset-bank/pandemonium-factory/'+k+'.webp';
 return Object.fromEntries(await Promise.all(Object.entries(paths).map(async([k,v])=>[k,await load(v)])));
}
function sprite(c,assets,key,x,y,angle=0){const im=assets[key],spec=specs[key];if(!im)return;c.save();c.translate(x,y);c.rotate(angle);c.scale(spec[2],spec[2]);c.drawImage(im,-spec[0],-spec[1]);c.restore();}
function fx(c,a,frame,x,y,size,alpha=1,angle=0){if(!a.fx)return;c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha*=Math.max(0,Math.min(1,alpha));c.drawImage(a.fx,(frame%4)*128,Math.floor(frame/4)*128,128,128,-size/2,-size/2,size,size);c.restore();}
export const muzzleLocal=factoryMuzzleLocal;
function aircraft(c,a,x,y,angle,alpha=1){if(!a.aircraft)return;c.save();c.translate(x,y);c.rotate(angle+Math.PI/2);c.globalAlpha*=alpha;c.drawImage(a.aircraft,-18,-22,36,44);c.restore();}
export function drawBoss(c,s,assets,{camera={x:0,y:0},width=1280,height=900,scale=1,layer='all'}={}){
 if(!assets.body)throw new Error('Factory clean body is required; placeholder rendering is forbidden');
 c.save();c.translate(width/2-camera.x*scale,height/2-camera.y*scale);c.scale(scale,scale);
 if(layer!=='hazards'){c.save();c.translate(s.x,s.y);c.rotate(s.a);
 const finalWreck=!!s.defeat&&s.defeat.elapsed>=5.5;
 c.drawImage(finalWreck&&assets.bodyWreck?assets.bodyWreck:assets.body,-256,-384,512,768);
 if(!finalWreck&&(s.parts.find(p=>p.id==='boiler').hp<=0||s.defeat?.elapsed>1)&&assets.boilerDamaged)c.drawImage(assets.boilerDamaged,37,-330,137.5,153);
 if(!finalWreck&&(s.parts.some(p=>p.role==='production'&&p.hp<=0)||s.defeat?.elapsed>2)&&assets.productionDamaged)c.drawImage(assets.productionDamaged,-116,-59,220.5,248);
 for(const p of [...s.parts.filter(p=>p.role==='track'),...s.parts.filter(p=>p.role!=='track')]){
  const index=s.parts.indexOf(p);
  const destroyed=p.hp<=0||!!s.defeat&&s.defeat.elapsed>index*.35;
  if(p.role==='track'){
   if(!destroyed&&assets.track){c.save();c.beginPath();c.rect(p.x-16,-250,32,565);c.clip();for(let i=-1;i<40;i++)c.drawImage(assets.track,p.x-16,-250+i*15.5+(((p.trackDistance%15.5)+15.5)%15.5),32,15.5);c.restore();}
   if(destroyed)for(let i=0;i<5;i++)sprite(c,assets,'crawlerWreck',p.x,-220+i*120);
  }
  if(p.role==='turret'){
   if(destroyed)sprite(c,assets,'aaWreck',p.x,p.y);
   else {sprite(c,assets,'aaHead',p.x,p.y,p.angle+Math.PI/2);c.save();c.translate(p.x,p.y);c.rotate(p.angle+Math.PI/2);sprite(c,assets,'aaBarrel',0,p.recoil*3);c.restore();}
  }
  if(p.role==='crane'&&!destroyed){sprite(c,assets,'craneBoom',p.x,p.y,p.angle-Math.atan2(-490,-163));if(p.task&&assets.supply){const reach=Math.hypot(163,490)*.22,x=p.x+Math.cos(p.angle)*reach,y=p.y+Math.sin(p.angle)*reach; c.save();c.translate(x,y);c.rotate(Math.sin(s.time*3)*.06);c.drawImage(assets.supply,-12,-9+Math.sin((p.task.progress||0)*Math.PI)*4,24,18);c.restore();}}
  if(p.role==='production'&&p.active)aircraft(c,assets,p.x,p.y-12*p.cycle,-Math.PI/2,.65+.35*p.cycle);
  if(p.role==='boiler'&&p.active)for(let i=0;i<2;i++)fx(c,assets,8,p.x-20+i*35,p.y-65-((s.time*10+i*15)%30),30+((s.time*10+i*15)%30),.28*s.pressure);
  if(p.hitFlash>0&&!destroyed)fx(c,assets,12,p.x,p.y,Math.min(46,p.r),p.hitFlash/.16*.8);
  if(p.hp>0&&p.hp<p.maxHp*.35&&!s.defeat)fx(c,assets,8,p.x+6,p.y-8,Math.min(55,p.r*1.2),.22);
  if(destroyed){fx(c,assets,9,p.x,p.y,p.r*2,.8);if(!s.defeat)fx(c,assets,4+Math.floor(s.time*5)%4,p.x,p.y,p.r,.7);}
 }
 c.restore();}
 if(layer!=='body'){
 for(const h of s.hazards){
  if(!h.fired){if(h.kind==='shell')fx(c,assets,12,h.tx,h.ty,h.r*2,.25+.2*Math.sin(s.time*9));else if(h.kind==='projectile'){for(let i=0;i<3;i++)fx(c,assets,13,h.x+Math.cos(h.angle)*(16+i*17),h.y+Math.sin(h.angle)*(16+i*17),Math.max(9,8/Math.max(.05,scale)),.32+.12*Math.sin(s.time*9),h.angle);}else {aircraft(c,assets,h.x,h.y,s.a-Math.PI/2,.42);fx(c,assets,12,h.x,h.y,Math.max(22,18/Math.max(.05,scale)),.4);}continue;}
  if(h.kind==='unit')aircraft(c,assets,h.x,h.y,h.angle);
  else if(h.kind==='shell')fx(c,assets,Math.min(3,Math.floor((.3-h.life)*12)),h.x,h.y,h.r*2);
  else fx(c,assets,13,h.x,h.y,14,1,h.angle);
 }
 for(const e of s.effects||[]){if(e.kind==='supply'&&assets.supply){c.save();c.globalAlpha*=Math.max(0,1-e.age/e.life);c.drawImage(assets.supply,e.x-12,e.y-9-e.age*10,24,18);c.restore();}else fx(c,assets,e.kind==='muzzle'?12:13,e.x,e.y,e.kind==='muzzle'?28:22,Math.max(0,1-e.age/e.life),e.angle||0);}
 if(s.defeat&&s.defeat.elapsed<7){for(let i=0;i<4;i++){const p=s.parts[(Math.floor(s.defeat.elapsed*2)+i*2)%s.parts.length],x=s.x+p.x*Math.cos(s.a)-p.y*Math.sin(s.a),y=s.y+p.x*Math.sin(s.a)+p.y*Math.cos(s.a);fx(c,assets,Math.floor(s.defeat.elapsed*7+i)%4,x,y,100,Math.min(1,7-s.defeat.elapsed));}}
 }
 c.restore();
}

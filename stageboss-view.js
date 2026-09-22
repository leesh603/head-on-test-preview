import {drawRailDamage,drawRailTrack} from './rail-render129.js';
import {fx,fxReady,fxImage} from './fx-art.js?v=198';
import {drawEnemyProjectile} from './projectiles.js?v=131';
import {drawSupportShip,drawSupportEffects} from './stuttgart-render129.js';
import {renderStageBossLayer} from './headon-stageboss-render.js?v=187';
import {bossHudModel} from './headon-stageboss-hud.js?v=116&b=117';

function createLazyImageGroup(sources){
 const cache={},pending={};
 const load=key=>{
  if(cache[key])return cache[key];
  const image=new Image();image.decoding='async';cache[key]=image;
  pending[key]=new Promise(resolve=>{const done=()=>resolve(image);image.addEventListener('load',done,{once:true});image.addEventListener('error',done,{once:true})});
  image.src=sources[key];return image;
 };
 const images=new Proxy(cache,{get(target,key){if(typeof key==='string'&&Object.prototype.hasOwnProperty.call(sources,key))return load(key);return target[key]}});
 return {
  images,
  preload(keys=Object.keys(sources)){keys=keys.filter(key=>Object.prototype.hasOwnProperty.call(sources,key));keys.forEach(load);return Promise.all(keys.map(key=>pending[key]||Promise.resolve(cache[key])))},
  release(keys=Object.keys(cache)){for(const key of keys){if(cache[key]){try{delete cache[key].lowDetail}catch{}}delete cache[key];delete pending[key]}}
 };
}
const supportGroup=createLazyImageGroup({ship:'./stuttgart-open129.png',cover:'./stuttgart-cover129.png'}),supportImages129=supportGroup.images;

const bossSources={
 parisGun:'./boss-bruno-train115.png',lincomparable:'./boss-lincomparable94.png?v=116&b=117',stuttgart:'./boss-sms-stuttgart94.png',zubian:'./boss-hms-zubian94.png',
 l70:'./boss-zeppelin-l7094.png',hma23:'./boss-hma2394.png',a7v:'./boss-a7v-flak94.png',markv:'./boss-mark-v94.png',gik:'./boss-gik.png?v=116&b=117',ca4:'./boss-ca4.png?v=116&b=117',
 londonApron:'./boss-london-apron115.png',drachenNet:'./boss-drachen-net115.png'
};
const bossGroup=createLazyImageGroup(bossSources),bossArt=bossGroup.images;
const rebuildGroup=createLazyImageGroup({a7vHull:'./boss-a7v-hull-rebuild.png',a7vTurret:'./boss-a7v-turret-rebuild.png',markvHull:'./boss-mark-v-hull-rebuild.png',markvSponson:'./boss-mark-v-sponson-rebuild.png'}),rebuildArt=rebuildGroup.images;
const harborGroup=createLazyImageGroup({base:'./boss-armored-harbor-main-base.png',craneArm:'./boss-armored-harbor-crane-arm.png',cranePivot:'./boss-armored-harbor-crane-pivot.png',ammo:'./boss-armored-harbor-ammo-storage.png',guns:'./boss-armored-harbor-gun-emplacements.png',facility:'./boss-armored-harbor-seaplane-facility.png'}),harborArt=harborGroup.images;
const trenchGroup=createLazyImageGroup({
 livensBase:'./boss_livens_base187.png',livensBody:'./boss_livens_body_normal187.png',livensBodyDamaged:'./boss_livens_body_damaged187.png',livensBodyDestroyed:'./boss_livens_body_destroyed187.png',
 livensTank:'./boss_livens_tank_normal187.png',livensTankDamaged:'./boss_livens_tank_damaged187.png',livensTankDestroyed:'./boss_livens_tank_destroyed187.png',
 livensPressure:'./boss_livens_pressure_normal187.png',livensPressureDamaged:'./boss_livens_pressure_damaged187.png',livensPressureDestroyed:'./boss_livens_pressure_destroyed187.png',
 livensMount:'./boss_livens_nozzle_mount187.png',livensNozzle:'./boss_livens_nozzle_normal_pivot187.png',livensNozzleDamaged:'./boss_livens_nozzle_damaged_pivot187.png',livensNozzleDestroyed:'./boss_livens_nozzle_destroyed_pivot187.png',
 livensCoreClosed:'./boss_livens_core_closed187.png',livensCoreExposed:'./boss_livens_core_exposed187.png',livensCoreDestroyed:'./boss_livens_core_destroyed187.png',
 minenBase:'./boss_minenwerfer_base187.png',minenMain:'./boss_minenwerfer_main_normal187.png',minenMainDamaged:'./boss_minenwerfer_main_damaged187.png',minenMainDestroyed:'./boss_minenwerfer_main_destroyed187.png',
 minenSide:'./boss_minenwerfer_side_normal187.png',minenCrane:'./boss_minenwerfer_crane187.png',minenCommand:'./boss_minenwerfer_command187.png',minenAmmo:'./boss_minenwerfer_ammo_main187.png',minenCore:'./boss_minenwerfer_core187.png'
}),trenchBossArt=trenchGroup.images;
const BOSS_KEYS_BY_REGION=Object.freeze({
 0:['parisGun','lincomparable'],1:['stuttgart','zubian'],2:['a7v','markv'],3:[],4:['londonApron','drachenNet'],5:['l70','hma23'],6:['gik','ca4'],7:[]
});
export function prepareStageBossAssets(region){
 const jobs=[];
 bossGroup.release();supportGroup.release();rebuildGroup.release();harborGroup.release();trenchGroup.release();zubianGroup.release();cityGroup.release();buildingGroup.release();
 for(const group of Object.values(railGroups))group.release();
 const bossKeys=BOSS_KEYS_BY_REGION[region]||[];if(bossKeys.length)jobs.push(bossGroup.preload(bossKeys));
 if(region===0)for(const group of Object.values(railGroups))jobs.push(group.preload());
 if(region===1){jobs.push(supportGroup.preload());jobs.push(zubianGroup.preload())}
 if(region===2)jobs.push(rebuildGroup.preload());
 if(region===3)jobs.push(trenchGroup.preload());
 if(region===4){jobs.push(cityGroup.preload());jobs.push(buildingGroup.preload())}
 if(region===7)jobs.push(harborGroup.preload());
 if(region>=0)jobs.push(partGroup.preload());else{partGroup.release();skyCloud113=null}
 return Promise.all(jobs);
}
const trenchFx={};
for(const [key,src] of Object.entries({
 livensFlameA:'./fx_livens_flame_main_01.png',livensFlameB:'./fx_livens_flame_main_02.png',livensFlameSweep:'./fx_livens_flame_sweep.png',
 livensLeak:'./fx_livens_flame_leak.png',livensSmoke:'./fx_livens_smoke.png',livensSteam:'./fx_livens_steam.png',
 livensTankBoom:'./fx_livens_tank_explosion.png',livensIgnition:'./fx_livens_ignition.png',livensPressureBurst:'./fx_livens_pressure_burst.png',
 livensOverheat:'./fx_livens_core_overheat.png',livensFinalFire:'./fx_livens_final_fire.png',
 minenFlash:'./fx_minenwerfer_muzzle_flash.png',minenSmoke:'./fx_minenwerfer_muzzle_smoke.png',minenImpactS:'./fx_minenwerfer_impact_small.png',
 minenImpactH:'./fx_minenwerfer_impact_heavy.png',minenShock:'./fx_minenwerfer_shockwave.png',minenDebris:'./fx_minenwerfer_debris.png',
 minenTrail:'./fx_minenwerfer_shell_trail_strip.png',minenRing:'./fx_minenwerfer_warning_ring_strip.png',
 minenCookoff:'./fx_minenwerfer_ammo_cookoff.png',minenFinal:'./fx_minenwerfer_final_explosion.png'
})){const image=new Image();image.src=src+'?v=193';trenchFx[key]=image;}
const drawTrenchImage=(c,image,x,y,w,h,angle=0,alpha=1)=>{if(!image?.naturalWidth)return false;c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha=alpha;c.imageSmoothingEnabled=true;c.drawImage(image,-w/2,-h/2,w,h);c.restore();return true;};
const railConsistSources={
 parisGun:{engine:'./rail-boss-bruno-engine181.webp',front:'./rail-boss-bruno-front181.webp',middle:'./rail-boss-bruno-middle181.webp',rear:'./rail-boss-bruno-rear181.webp'},
 lincomparable:{engine:'./rail-boss-lincomparable-engine181.webp',front:'./rail-boss-lincomparable-front181.webp',middle:'./rail-boss-lincomparable-middle181.webp',rear:'./rail-boss-lincomparable-rear181.webp'}
};
const railGroups={},railConsistArt={};
for(const [set,sources] of Object.entries(railConsistSources)){const group=createLazyImageGroup(sources);railGroups[set]=group;railConsistArt[set]=group.images;}
function drawRailConsist181(c,b){
 const set=b.assetKey==='lincomparable'?'lincomparable':'parisGun',images=railConsistArt[set],cars=new Map((b.railCars||[]).map(car=>[car.id,car]));
 if(!images.engine.naturalWidth){drawBossArt(c,set,164*2.025,246*2.025);return;}
 c.save();c.imageSmoothingEnabled=true;
 if(b.phase==='derailed'){c.rotate(.16);c.translate(28,8);}
 for(const [id,key] of [['car-rear','rear'],['car-middle','middle'],['car-front','front']]){const car=cars.get(id);if(!car)continue;
  if(!car.destroyed){c.drawImage(images[key],-130,car.y-195,260,390);continue}
  c.save();c.translate(0,car.y);c.rotate(.055);c.filter='brightness(.38) saturate(.55)';c.globalAlpha=.92;c.drawImage(images[key],-130,-195,260,390);c.filter='none';c.globalAlpha=1;
  for(let k=0;k<5;k++){const t=((b.motionTime||0)*1.7+k*.83)%1,puffY=-60-t*130,puffX=Math.sin(k*2.1+t*5)*14-8;c.fillStyle=`rgba(52,44,40,${(1-t)*.4})`;c.beginPath();c.arc(puffX,puffY,10+t*16,0,Math.PI*2);c.fill()}
  c.fillStyle='#ffb14f2e';for(let k=0;k<3;k++){const fy=-30-k*48+Math.sin((b.motionTime||0)*9+k)*6;c.beginPath();c.ellipse(Math.sin((b.motionTime||0)*7+k*2)*10,fy,7,11,0,0,Math.PI*2);c.fill()}
  c.restore()}
 c.drawImage(images.engine,-130,-195,260,390);c.restore();
}
const LARGE_HULLS=Object.freeze({gik:{halfWidth:128,halfHeight:150},ca4:{halfWidth:128,halfHeight:150},'armored-harbor-fortress':{halfWidth:245,halfHeight:235}});
const zubianGroup=createLazyImageGroup({atlas:'./zubian-atlas.png?v=103'}),zubianArt=zubianGroup.images;
const zubianFrames={intact:[180,8,370,1001],front:[635,25,370,649],rear:[1020,416,369,593]};
function drawZubianFrame(c,key,x,y,w,h){const zubianAtlas=zubianArt.atlas;if(!zubianAtlas.naturalWidth)return;const f=zubianFrames[key];c.save();c.imageSmoothingEnabled=true;c.drawImage(zubianAtlas,f[0],f[1],f[2],f[3],x-w/2,y-h/2,w,h);c.restore();}
const drawBossArt=(c,key,w,h)=>{const image=bossArt[key];if(image?.naturalWidth)c.drawImage(image,-w/2,-h/2,w,h)};
const cityGroup=createLazyImageGroup({london:'./terrain-city-london96.png?v=116&b=117',berlin:'./terrain-city-berlin96.png?v=116&b=117'}),cityArt=cityGroup.images;
// Dedicated aircraft-style sprite atlas; collider sizes remain authoritative.
const partGroup=createLazyImageGroup({atlas:'./boss-parts100.png'}),partArt=partGroup.images;
function bossSprite(c,index,x,y,w,h,angle=0,alpha=1){
 const partAtlas=partArt.atlas;if(!partAtlas.naturalWidth)return;
 const cell=partAtlas.naturalWidth/4,row=partAtlas.naturalHeight/4;
 c.save();c.translate(Math.round(x),Math.round(y));c.rotate(angle);c.globalAlpha*=alpha;c.imageSmoothingEnabled=false;
 c.drawImage(partAtlas,(index%4)*cell,Math.floor(index/4)*row,cell,row,-w/2,-h/2,w,h);c.restore();
}
function pixelBlast(c,x,y,r,age=0,water=false){bossSprite(c,water?13:12,x,y,r*2,r*2,water?0:age*.15)}
function drawBossPart(c,p,ring){
 const r=p.radius;
 if(['paris-gun','lincomparable','sms-stuttgart'].includes(p.bodyKey)||p.bodyKey.startsWith('hms-zubian')){
  return;
 }
 if(p.bodyKey==='london-apron'||p.bodyKey==='drachen-net'){
  if(p.destroyed){c.fillStyle='#382e26cc';c.fillRect(p.x-r*.7,p.y-r*.7,r*1.4,r*1.4);}
  if(p.hittable&&!p.destroyed){ring(p.x,p.y,r,'#ffd579aa');c.fillStyle='#202e28';c.fillRect(p.x-r,p.y+r+5,r*2,4);c.fillStyle='#efb96f';c.fillRect(p.x-r,p.y+r+5,r*2*p.hp/p.maxHp,4);}return;
 }
 if(p.bodyKey==='livens-flame-projector'||p.bodyKey==='minenwerfer-battery'){
  const damaged=p.hp<=p.maxHp*.5;let drawn=false;
  const k=p.radius/({tank:27,pressure:29,nozzle:31,gun:28,ammo:29,crane:25,command:25}[p.partId.split('-')[0]]||28);
  if(p.bodyKey==='livens-flame-projector'){
   if(p.partId.startsWith('tank-'))drawn=drawTrenchImage(c,p.destroyed?trenchBossArt.livensTankDestroyed:damaged?trenchBossArt.livensTankDamaged:trenchBossArt.livensTank,p.x,p.y,94*k,74*k);
   else if(p.partId==='pressure')drawn=drawTrenchImage(c,p.destroyed?trenchBossArt.livensPressureDestroyed:damaged?trenchBossArt.livensPressureDamaged:trenchBossArt.livensPressure,p.x,p.y,104*k,100*k);
   else if(p.partId==='nozzle')drawn=drawTrenchImage(c,p.destroyed?trenchBossArt.livensNozzleDestroyed:damaged?trenchBossArt.livensNozzleDamaged:trenchBossArt.livensNozzle,p.x,p.y,150*k,150*k,(p.angle||0)-Math.PI/2);
  }else{
   const image=p.partId==='main-gun'?(p.destroyed?trenchBossArt.minenMainDestroyed:damaged?trenchBossArt.minenMainDamaged:trenchBossArt.minenMain):p.partId.startsWith('gun-')?trenchBossArt.minenSide:p.partId==='crane'?trenchBossArt.minenCrane:p.partId==='command'?trenchBossArt.minenCommand:p.partId==='ammo-main'?trenchBossArt.minenAmmo:trenchBossArt.minenCore;
   drawn=drawTrenchImage(c,image,p.x,p.y,(p.partId==='main-gun'?104:86)*k,(p.partId==='main-gun'?106:96)*k,0,p.destroyed?.38:1);
  }
  if(!drawn){c.fillStyle=p.destroyed?'#302722':p.bodyKey==='livens-flame-projector'?'#59604a':'#5b5141';c.beginPath();c.arc(p.x,p.y,r*.76,0,Math.PI*2);c.fill();}
  if(p.destroyed)bossSprite(c,11,p.x,p.y,r*1.4,r*1.4,0,.5);
  if(p.hittable&&!p.destroyed){ring(p.x,p.y,r,'#ffd57999');c.fillStyle='#202e28';c.fillRect(p.x-r,p.y+r+5,r*2,4);c.fillStyle='#efb96f';c.fillRect(p.x-r,p.y+r+5,r*2*p.hp/p.maxHp,4);}return;
 }
 if(p.bodyKey==='a7v-flak'){
  if(p.destroyed){bossSprite(c,11,p.x,p.y,r*2.25,r*2.25,0,.46);return;}
  if(!p.destroyed&&rebuildArt.a7vTurret.naturalWidth){const angle={front:-Math.PI/2,rear:Math.PI/2,left:Math.PI,right:0}[p.partId]||0;c.save();c.translate(p.x,p.y);c.rotate(angle);c.imageSmoothingEnabled=true;c.drawImage(rebuildArt.a7vTurret,-47,-47,94,94);c.restore();}
  if(p.hittable&&!p.destroyed){ring(p.x,p.y,r,'#ffd57988');c.fillStyle='#202e28';c.fillRect(p.x-r,p.y+r+5,r*2,4);c.fillStyle='#efb96f';c.fillRect(p.x-r,p.y+r+5,r*2*p.hp/p.maxHp,4);}return;
 }
 if(p.bodyKey==='mark-v-cruiser'){
  if(p.destroyed){bossSprite(c,11,p.x,p.y,r*2.35,r*2.35,0,.46);return;}
  if(!p.destroyed&&rebuildArt.markvSponson.naturalWidth){c.save();c.translate(p.x,p.y);if(p.partId==='sponson-right')c.scale(-1,1);c.imageSmoothingEnabled=true;c.drawImage(rebuildArt.markvSponson,-58,-58,116,116);c.restore();}
  if(p.hittable&&!p.destroyed){ring(p.x,p.y,r,'#ffd57988');c.fillStyle='#202e28';c.fillRect(p.x-r,p.y+r+5,r*2,4);c.fillStyle='#efb96f';c.fillRect(p.x-r,p.y+r+5,r*2*p.hp/p.maxHp,4);}return;
 }
 if(p.bodyKey==='armored-harbor-fortress'){
  if(p.partId==='crane-pivot'&&p.destroyed&&p.phase==='final-core'&&harborArt.cranePivot.naturalWidth){
   const scale=2.025,size=300*scale,bodyX=p.x+78*scale,bodyY=p.y-13*scale;
   c.save();c.imageSmoothingEnabled=true;c.filter='grayscale(.55) brightness(.7) sepia(.25)';
   c.drawImage(harborArt.cranePivot,bodyX-size/2,bodyY-size/2,size,size);c.restore();
   ring(p.x,p.y,r*1.35,'#ffb55fcc');ring(p.x,p.y,r*.72,'#fff0b0bb');return;
  }
  if(p.destroyed){bossSprite(c,11,p.x,p.y,r*2.35,r*2.35,0,.55);return;}
  if(p.hittable){ring(p.x,p.y,r,'#ffd57999');c.fillStyle='#202e28';c.fillRect(p.x-r,p.y+r+5,r*2,4);c.fillStyle='#efb96f';c.fillRect(p.x-r,p.y+r+5,r*2*p.hp/p.maxHp,4);}return;
 }
 const index=p.partId==='truss'?0:p.partId==='muzzle'?1:p.partId==='hangar'?2:p.partId==='crane'?3:p.partId==='capsule'?4:p.kind==='engine'?5:p.partId.startsWith('port-')?6:p.bodyKey==='a7v-flak'?7:8;
 const angle=p.bodyKey==='a7v-flak'?({front:0,right:Math.PI/2,rear:Math.PI,left:-Math.PI/2}[p.partId]||0):p.partId==='sponson-right'?Math.PI:0;
 if(p.destroyed){
  // Preserve each original part's silhouette beneath torn armor instead of substituting an AA gun.
  c.save();c.filter='grayscale(1) brightness(.35)';bossSprite(c,index,p.x,p.y,r*2.1,r*2.1,angle);c.restore();
  bossSprite(c,9,p.x,p.y,r*1.65,r*1.65,angle,.92);
 }else bossSprite(c,index,p.x,p.y,r*2.1,r*2.1,angle);
 if(p.hittable&&!p.destroyed){ring(p.x,p.y,r,'#ffd57988');c.fillStyle='#202e28';c.fillRect(p.x-r,p.y+r+5,r*2,4);c.fillStyle='#efb96f';c.fillRect(p.x-r,p.y+r+5,r*2*p.hp/p.maxHp,4);}
}
export function updateStageBossHud(g){
 const active=!!g?.stageBoss&&g.state!=='lost'&&g.stageBoss.stages.phase!=='clear-pending',model=active?bossHudModel(g.stageBoss.stages.encounter):null;
 document.body.classList.toggle('stageboss-playing',active);
 const slot=document.getElementById('stageBossHud');slot.classList.toggle('hidden',!model);
 if(model){document.getElementById('stageBossTitle').textContent=model.name+(g.stageBoss.defeatSequence?' · 붕괴 중':model.shielded?' · 본체 보호':'');document.getElementById('stageBossParts').textContent='부위 '+model.aliveParts+'/'+model.totalParts+' · '+Math.ceil(model.hp)+' / '+Math.round(model.maxHp);const bar=document.getElementById('stageBossHp');bar.style.width=model.fraction*100+'%';slot.setAttribute('aria-valuenow',String(Math.ceil(model.hp)));slot.setAttribute('aria-valuemax',String(Math.round(model.maxHp)));}
 const coop=active&&g.mode==='coop2';document.getElementById('coopXpHud').classList.toggle('hidden',!coop);
 if(coop)for(const p of g.players){document.getElementById(p.id+'XpLabel').textContent=p.id.toUpperCase()+' · LV. '+p.level;document.getElementById(p.id+'XpBar').style.width=Math.min(100,p.xp/p.need*100)+'%';}
}
const buildingGroup=createLazyImageGroup({atlas:'./city-buildings107.png'}),buildingArt=buildingGroup.images;
// Source rectangles preserve the roof silhouettes and real transparent margins.
const buildingFrames=[[218,7,280,610],[758,5,288,610],[209,630,302,608],[744,630,306,609]];
export function drawBossBuildings(c,g){
 const buildingAtlas=buildingArt.atlas;if(!buildingAtlas.naturalWidth)return;const berlin=(g.teamFaction||g.stageBoss?.stages.teamFaction)==='entente';
 for(const b of g.bossBuildings||[]){const f=buildingFrames[(b.destroyed?2:0)+(berlin?1:0)];c.save();c.imageSmoothingEnabled=false;
  c.drawImage(buildingAtlas,...f,b.x-b.w/2,b.y-b.h/2,b.w,b.h);c.restore();}
}
function cityHazard(c,h,ring){
 const warning=h.phase==='warning',age=Math.max(0,h.age-h.delay-h.warning);
 if(h.visual==='pompom-stream'){
  if(warning){c.fillStyle='#f1bc6814';c.fillRect(h.x-h.width/2,h.y-h.height/2,h.width,h.height);c.strokeStyle='#dcb776aa';c.lineWidth=1.5;c.setLineDash([10,7]);for(const side of [-1,1]){c.beginPath();c.moveTo(h.x-h.width/2,h.y+side*h.height/2);c.lineTo(h.x+h.width/2,h.y+side*h.height/2);c.stroke()}}
  else{const direction=Math.cos(h.angle)>=0?1:-1;const count=Math.min(36,Math.ceil(h.width/22));c.setLineDash([]);for(let i=0;i<count;i++){const d=(i*27+age*760)%Math.max(1,h.width),x=h.x+direction*(d-h.width/2),y=h.y+Math.sin(i*4.7)*h.height*.3;c.strokeStyle=i%3?'#dfab65cc':'#fff0bd';c.lineWidth=i%3?2:3;c.beginPath();c.moveTo(x,y);c.lineTo(x-direction*Math.min(17,d),y);c.stroke()}pixelBlast(c,h.x-direction*h.width/2,h.y,17,age);}
  return true;
 }
 if(h.visual==='black-flak'){
  if(warning){c.fillStyle='#d2aa5a10';c.beginPath();c.arc(h.x,h.y,h.radius,0,Math.PI*2);c.fill();c.strokeStyle='#e6bc77';c.lineWidth=1.5;c.setLineDash([6,5]);c.stroke();c.setLineDash([]);ring(h.x,h.y,h.radius*(1-clamp((h.age-h.delay)/h.warning,0,1)),'#f2d69b');}
  else{const fade=Math.min(1,(h.duration-age)*2);c.setLineDash([]);for(let i=0;i<5;i++){const a=i*2.4,dist=h.radius*(.12+age*.13),x=h.x+Math.cos(a)*dist,y=h.y+Math.sin(a)*dist;c.save();c.filter='brightness(.45)';bossSprite(c,11,x,y,h.radius*(.7+age*.35),h.radius*(.7+age*.35),a,fade*.8);c.restore()}if(age<.3)pixelBlast(c,h.x,h.y,h.radius*(.65+age),age);}
  return true;
 }
 return false;
}
function drawWaterColumn(c,h){
 const age=Math.max(0,h.age-h.delay-h.warning),top=h.y-h.height/2,bottom=h.y+h.height/2,px=Math.max(4,Math.round(h.width/14));
 c.save();c.globalAlpha=.94;c.imageSmoothingEnabled=false;
 // Stepped outer plume: a broken silhouette reads as a mass of water rather than a beam.
 const bands=[.18,.27,.22,.32,.38,.31,.43,.35,.48,.4,.54,.46];
 for(let i=0;i<bands.length;i++){const y=top+i*h.height/bands.length,w=h.width*bands[i]*(.96+Math.sin(age*13+i*1.7)*.06);c.fillStyle=i%3===0?'#65aeb7':i%3===1?'#83c5c7':'#9bd2ce';c.fillRect(Math.round((h.x-w)/px)*px,Math.round(y/px)*px,Math.ceil(w*2/px)*px,Math.ceil(h.height/bands.length/px+1)*px);}
 // Pale aerated core and irregular cap.
 c.fillStyle='#d8eee3';for(let i=0;i<8;i++){const y=top+px*2+i*(h.height-px*5)/8,w=px*(1+(i%3));c.fillRect(Math.round((h.x-w/2)/px)*px,Math.round(y/px)*px,w,px*2);}
 c.fillStyle='#e7f4e9';c.fillRect(h.x-px,top,px*2,px*3);c.fillRect(h.x-px*3,top+px*2,px*2,px*2);c.fillRect(h.x+px,top+px,px*3,px*2);
 // Side spray rises, separates and falls in chunky WWI-pixel droplets.
 for(let i=0;i<18;i++){const side=i&1?-1:1,t=(i*29+age*118)%Math.max(30,h.height*.82),y=bottom-px*3-t,d=h.width*(.28+(i%5)*.09)+Math.sin(age*9+i)*px*2;c.fillStyle=i%4?'#9fd3cf':'#d9ece2';const s=px*(1+(i%3===0));c.fillRect(Math.round((h.x+side*d)/px)*px,Math.round(y/px)*px,s,px);}
 // Broad broken foam foot makes the column feel rooted in the sea.
 for(let i=-6;i<=6;i++){const lift=Math.abs(i)%3*px;c.fillStyle=i%3?'#b5dcd5':'#e1f0e7';c.fillRect(h.x+i*px*1.25,bottom-px*2-lift,px*(1+(Math.abs(i)%2)),px*(1+(i%2===0)));}
 c.fillStyle='#579da8aa';c.fillRect(h.x-h.width*.62,bottom-px,h.width*1.24,px*2);c.restore();
}
export function drawStageBoss(c,g,W,H,{drawZeppelin,drawFieldArt,layer='all'}){
 const addon=g?.stageBoss;if(!addon||addon.ended)return;const z=g.camera?.zoom||1;
 c.save();c.translate(W/2,H/2);c.scale(z,z);c.translate(-g.x,-g.y);c.imageSmoothingEnabled=false;
 if(layer!=='hazards')drawBossBuildings(c,g);
 for(const body of addon.stages.encounter?.bodies.values()||[]){if(body.rail129&&layer!=='hazards'){const r=body.rail129;c.save();drawRailTrack(c,r,bossArt.parisGun);drawRailDamage(c,r,bossArt.parisGun);if(r.phase==='aim'&&r.target){const radius=body.kind==='lincomparable'?165:108;c.strokeStyle='#e6bb80';c.lineWidth=2;c.setLineDash([8,7]);c.beginPath();c.arc(r.target.x,r.target.y,radius,0,Math.PI*2);c.stroke();c.setLineDash([]);const a=Math.atan2(body.y-r.target.y,body.x-r.target.x);c.beginPath();c.moveTo(r.target.x+Math.cos(a)*radius,r.target.y+Math.sin(a)*radius);c.lineTo(r.target.x+Math.cos(a)*(radius+58),r.target.y+Math.sin(a)*(radius+58));c.stroke();}c.restore();}if(body.support129&&layer!=='bodies')drawSupportEffects(c,body.support129,{screenScale:z});}
 const ring=(x,y,r,color)=>{c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();};
 renderStageBossLayer(addon,{
  drawBody(b){if(layer==='hazards')return;
   if(b.assetKey==='sms-stuttgart'){const body=[...addon.stages.encounter.bodies.values()].find(v=>v.support129);if(body&&supportImages129.ship.naturalWidth&&supportImages129.cover.naturalWidth){c.save();c.imageSmoothingEnabled=true;drawSupportShip(c,b.destroying?{...body.support129,dead:false}:body.support129,supportImages129);c.restore();}return;}
   c.save();const wreck=b.destroying?Math.min(1,b.destructionAge/Math.max(.1,b.destructionDuration)):0;c.translate(b.x+(wreck?Math.sin(b.destructionAge*43)*4:0),b.y+(wreck?Math.cos(b.destructionAge*37)*4:0));
   const ship=b.assetKey.startsWith('hms-zubian')||b.assetKey==='sms-stuttgart',rail=['paris-gun','lincomparable'].includes(b.assetKey),structure=['livens-flame-projector','minenwerfer-battery'].includes(b.assetKey);
   if(ship){for(let i=0;i<12;i++){const drift=(b.motionTime*32+i*13)%155;c.fillStyle=i%2?'#d7f1de99':'#6eb9b777';const w=18+drift*.3;c.fillRect(-w/2,125+drift,w,4);}}

   if(!rail){const bs=structure?(b.t?.geometryScale||2.025):2.025;c.scale(bs,bs);c.translate(0,b.recoil*18);}
   if(b.recoil>0){pixelBlast(c,0,-100,24,b.motionTime);c.fillStyle='#d6d2b04d';c.fillRect(-13,-160,26,48);}
   if(rail){drawRailConsist181(c,b);}
   else if(b.assetKey.startsWith('hms-zubian')||b.assetKey==='sms-stuttgart'){
    if(b.assetKey==='sms-stuttgart')drawBossArt(c,'stuttgart',164,246);
    else if(b.assetKey.endsWith('front')){drawZubianFrame(c,'front',0,0,154,270);}
    else if(b.assetKey.endsWith('rear')){drawZubianFrame(c,'rear',0,0,154,248);}
    else if(b.phase==='splitting'){
     const gap=Math.min(48,b.splitGap*.52);drawZubianFrame(c,'front',0,-83-gap/2,154,270);drawZubianFrame(c,'rear',0,91+gap/2,154,248);

    }else{drawZubianFrame(c,'intact',0,0,154,416);if(b.phase==='seam-warning'){const flash=.55+.45*Math.sin(b.stateAge*18);c.globalAlpha=flash;c.strokeStyle='#ffb45f';c.lineWidth=3;c.setLineDash([8,6]);c.beginPath();c.moveTo(-66,0);c.lineTo(66,0);c.stroke();c.setLineDash([]);c.globalAlpha=1;}}
   }else if(b.assetKey==='zeppelin-l70'||b.assetKey==='hma23'){
    if(b.phase==='cloud'||b.phase==='reveal')c.globalAlpha=b.phase==='cloud'?.24:.65;
    drawBossArt(c,b.assetKey==='hma23'?'hma23':'l70',390,130);
    if(b.phase==='cloud'){c.globalAlpha=.65;for(let i=0;i<6;i++)bossSprite(c,11,-145+i*58,-6+(i%3)*12,110,75);}
   }else if(b.assetKey==='london-apron')drawBossArt(c,'londonApron',390,260);
   else if(b.assetKey==='drachen-net')drawBossArt(c,'drachenNet',315,250);
   else if(b.assetKey==='gik'||b.assetKey==='ca4'){drawBossArt(c,b.assetKey,b.assetKey==='gik'?300:330,b.assetKey==='gik'?235:250);}
   else if(b.assetKey==='livens-flame-projector'){
    const damaged=b.hp<=b.maxHp*.5,body=b.destroying?trenchBossArt.livensBodyDestroyed:damaged?trenchBossArt.livensBodyDamaged:trenchBossArt.livensBody;
    if(!drawTrenchImage(c,trenchBossArt.livensBase,0,0,310,171)){c.fillStyle='#383b30';c.fillRect(-150,-105,300,210);}
    drawTrenchImage(c,body,0,4,128,154);drawTrenchImage(c,trenchBossArt.livensMount,0,-62,210,133);
    drawTrenchImage(c,b.destroying?trenchBossArt.livensCoreDestroyed:b.coreVulnerable?trenchBossArt.livensCoreExposed:trenchBossArt.livensCoreClosed,0,28,88,132);
   }
   else if(b.assetKey==='minenwerfer-battery'){
    if(!drawTrenchImage(c,trenchBossArt.minenBase,0,0,286,205)){c.fillStyle='#4a4032';c.beginPath();c.arc(0,0,150,0,Math.PI*2);c.fill();}
    if(b.coreVulnerable)drawTrenchImage(c,trenchBossArt.minenCore,0,25,118,84);
   }
   else if(b.assetKey==='a7v-flak'){const image=rebuildArt.a7vHull;if(image.naturalWidth){c.imageSmoothingEnabled=true;c.drawImage(image,-105,-129,210,258)}else drawBossArt(c,'a7v',172,258);}
   else if(b.assetKey==='mark-v-cruiser'){const image=rebuildArt.markvHull;if(image.naturalWidth){c.imageSmoothingEnabled=true;c.drawImage(image,-105,-129,210,258)}else drawBossArt(c,'markv',172,258);}
   else if(b.assetKey==='armored-harbor-fortress'){
    const dead=id=>b.parts?.find(p=>p.id===id)?.destroyed,size=300;c.imageSmoothingEnabled=true;
    if(harborArt.base.naturalWidth)c.drawImage(harborArt.base,-size/2,-size/2,size,size);
    if(!dead('ammo-storage')&&harborArt.ammo.naturalWidth)c.drawImage(harborArt.ammo,-size/2,-size/2,size,size);
    if(!dead('seaplane-facility')&&harborArt.facility.naturalWidth)c.drawImage(harborArt.facility,-size/2,-size/2,size,size);
    if(!dead('crane-arm')&&harborArt.craneArm.naturalWidth){c.save();c.translate(-78,13);c.rotate(b.craneAngle);c.translate(78,-13);c.drawImage(harborArt.craneArm,-size/2,-size/2,size,size);c.restore();}
    if(!dead('crane-pivot')&&harborArt.cranePivot.naturalWidth)c.drawImage(harborArt.cranePivot,-size/2,-size/2,size,size);
    if(harborArt.guns.naturalWidth){const cw=harborArt.guns.naturalWidth/2,ch=harborArt.guns.naturalHeight/2;for(const [id,sx,x] of [['gun-left',0,-91],['gun-right',1,91]])if(!dead(id))c.drawImage(harborArt.guns,sx*cw,0,cw,ch,x-38,62-38,76,76);}
   }
   else drawBossArt(c,'markv',172,258);
   if(b.destroying){c.globalAlpha=.2+.3*(1-wreck);c.fillStyle='#171c19';for(let i=0;i<18;i++)c.fillRect(-70+(i*29)%140,-105+(i*47)%210,18+(i%3)*6,14+(i%2)*8);}
   if(!b.coreVulnerable&&!b.destroying&&!b.assetKey.startsWith('hms-zubian'))ring(0,0,76,'#bdd8df66');c.restore();
  },
  drawPart(p){if(layer==='hazards')return;
   if(p.kind==='engine'&&!p.hittable&&!p.destroyed)return;
   if(p.partId==='capsule'){c.strokeStyle='#a0aa9e';c.beginPath();const body=[...addon.stages.encounter.bodies.values()][0];c.moveTo(body.x,body.y+30);c.lineTo(p.x,p.y);c.stroke();}
   drawBossPart(c,p,ring);
  },
  drawHazard(h){if(layer==='bodies')return;
   const warning=h.phase==='warning';c.save();c.strokeStyle=warning?'#ffdc81':'#ff8067';c.fillStyle=warning?'#ffdc812c':h.visual==='water-column'?'#75d8ea99':'#ef604f55';c.lineWidth=2;
   if(warning)c.setLineDash([6,5]);
   if(cityHazard(c,h,ring)){c.restore();return;}
   if(h.kind==='beam'){const x2=h.x+Math.cos(h.angle)*h.length,y2=h.y+Math.sin(h.angle)*h.length;c.lineCap='round';c.lineWidth=h.thickness;c.strokeStyle=warning?'#ffb45f44':'#ff6a2dcc';c.beginPath();c.moveTo(h.x,h.y);c.lineTo(x2,y2);c.stroke();c.lineWidth=Math.max(4,h.thickness*.34);c.strokeStyle=warning?'#ffe0a866':'#fff0a8';c.stroke();
    if(!warning){const jet=(Math.floor(h.age*9)%2)?trenchFx.livensFlameA:trenchFx.livensFlameB;
     if(jet?.naturalWidth)drawTrenchImage(c,jet,(h.x+x2)/2,(h.y+y2)/2,h.length*1.06,h.thickness*2.5,h.angle,.94);
     else{const n=Math.max(3,Math.ceil(h.length/52));for(let i=0;i<n;i++){const d=(i+.75)*h.length/n,w=h.thickness*1.5*(1-i/(n+2));bossSprite(c,12,h.x+Math.cos(h.angle)*d,h.y+Math.sin(h.angle)*d,w,w,h.angle+i*.9,.8);}}}}
   else if(h.kind==='searchlight'){if(fxReady('searchlight')&&!warning)fx(c,'searchlight',h.x+Math.cos(h.angle)*h.radius*.55,h.y+Math.sin(h.angle)*h.radius*.55,h.radius*1.3,h.radius*h.halfAngle*1.5,h.angle,.8);const glow=c.createRadialGradient(h.x,h.y,0,h.x,h.y,h.radius);glow.addColorStop(0,warning?'#f8e5a526':'#fff1bc4d');glow.addColorStop(.65,warning?'#ead18f0d':'#f3dfa621');glow.addColorStop(1,'#f3dfa600');c.fillStyle=glow;c.beginPath();c.moveTo(h.x,h.y);c.arc(h.x,h.y,h.radius,h.angle-h.halfAngle,h.angle+h.halfAngle);c.closePath();c.fill();if(warning){c.strokeStyle='#d9c89755';c.lineWidth=1;c.stroke();}}
   else if(h.kind==='rect'){
    if(h.visual==='water-column'){if(warning){c.fillRect(h.x-h.width/2,h.y-h.height/2,h.width,h.height);c.strokeRect(h.x-h.width/2,h.y-h.height/2,h.width,h.height);}else if(partAtlas.naturalWidth)bossSprite(c,13,h.x,h.y,h.width*2.4,h.height*1.5,0,.95);else drawWaterColumn(c,h);}
    else if(h.visual==='apron-net'||h.visual==='drachen-mine-net'){
     c.fillStyle=warning?'#e5c2761a':'#5d514544';c.fillRect(h.x-h.width/2,h.y-h.height/2,h.width,h.height);c.strokeStyle=warning?'#f2cf7c':'#b2aa91';c.lineWidth=warning?2:3;c.strokeRect(h.x-h.width/2,h.y-h.height/2,h.width,h.height);
     if(!warning){const step=h.visual==='apron-net'?28:52;c.lineWidth=1;c.strokeStyle='#b8b5a488';for(let x=h.x-h.width/2+step;x<h.x+h.width/2;x+=step){c.beginPath();c.moveTo(x,h.y-h.height/2);c.lineTo(x,h.y+h.height/2);c.stroke()}for(let y=h.y-h.height/2+step;y<h.y+h.height/2;y+=step){c.beginPath();c.moveTo(h.x-h.width/2,y);c.lineTo(h.x+h.width/2,y);c.stroke()}if(h.visual==='drachen-mine-net')for(let i=-3;i<=3;i++){const x=h.x+i*52,y=h.y+(Math.abs(i)%2?32:-24);if(!fx(c,'mine',x,y,34,34)){c.fillStyle='#5a554b';c.beginPath();c.arc(x,y,13,0,Math.PI*2);c.fill();c.strokeStyle='#d0a56e';for(let k=0;k<8;k++){const a=k*Math.PI/4;c.beginPath();c.moveTo(x+Math.cos(a)*11,y+Math.sin(a)*11);c.lineTo(x+Math.cos(a)*18,y+Math.sin(a)*18);c.stroke()}}}}
    }else{c.fillRect(h.x-h.width/2,h.y-h.height/2,h.width,h.height);c.strokeRect(h.x-h.width/2,h.y-h.height/2,h.width,h.height);if(!warning){const n=Math.min(24,Math.ceil(h.width/38));for(let i=0;i<n;i++){const x=h.x-h.width/2+(i+.5)*h.width/n;bossSprite(c,h.visual==='gas-fire'?12:15,x,h.y,36,Math.max(28,h.height*1.25),h.visual==='gas-fire'?0:Math.PI/2,.85);}}}
   }
   else if(h.kind==='projectile'){
    if(h.visual==='torpedo-charge'){const a=Math.atan2(h.vy,h.vx),speed=Math.hypot(h.vx,h.vy),wake=Math.min(190,92+speed*.12),closing=Math.max(0,1-(h.life||0)/.32);c.save();c.translate(h.x,h.y);c.rotate(a);c.globalAlpha=.38;c.strokeStyle='#d9eee9';c.lineCap='round';for(const side of [-1,1]){c.lineWidth=3;c.beginPath();c.moveTo(-12,side*9);c.bezierCurveTo(-wake*.34,side*(12+speed*.018),-wake*.72,side*(22+speed*.024),-wake,side*(34+speed*.02));c.stroke();c.globalAlpha=.22;c.lineWidth=8;c.beginPath();c.moveTo(-24,side*12);c.bezierCurveTo(-wake*.38,side*17,-wake*.78,side*29,-wake,side*40);c.stroke();c.globalAlpha=.38}c.globalAlpha=.48;if(!fx(c,'torpedo',0,0,64,20,0,.96)){c.fillStyle='#6e7f7d';c.beginPath();c.moveTo(26,0);c.quadraticCurveTo(10,-13,-23,-11);c.lineTo(-35,-6);c.lineTo(-35,6);c.quadraticCurveTo(8,14,26,0);c.fill();c.strokeStyle='#d8e0d3';c.lineWidth=1;c.stroke();}if(closing>0){c.globalAlpha=.28+.24*closing;c.strokeStyle='#eef5e8';c.lineWidth=2+closing*2;for(const side of [-1,1]){c.beginPath();c.moveTo(20,side*2);c.quadraticCurveTo(36,side*(8+closing*9),50+closing*15,side*(15+closing*12));c.stroke()}}c.restore();c.save();c.globalAlpha=.18;c.strokeStyle='#e6b37f';c.lineWidth=1;c.beginPath();c.arc(h.x,h.y,h.radius,-.62,.62);c.stroke();c.restore();}
    else if(h.visual==='building-debris')bossSprite(c,10,h.x,h.y,h.radius*3.4,h.radius*3.4,Math.atan2(h.vy,h.vx)+Math.PI/2);
    else drawEnemyProjectile(c,{enemy:true,life:1,visualType:'boss',vx:h.vx,vy:h.vy},h.x,h.y,0,z);
   }
   else{c.beginPath();c.arc(h.x,h.y,h.radius,0,Math.PI*2);c.fill();c.stroke();if(!warning&&(h.visual==='livens-leak'||h.visual==='fire')){if(trenchFx.livensLeak?.naturalWidth){drawTrenchImage(c,trenchFx.livensLeak,h.x,h.y,h.radius*2.1,h.radius*2.1,h.age*.5,.92);if(trenchFx.livensSmoke?.naturalWidth)drawTrenchImage(c,trenchFx.livensSmoke,h.x,h.y-h.radius*1.1,h.radius*1.9,h.radius*1.6,-h.age*.3,.5);}else{bossSprite(c,12,h.x,h.y,h.radius*2.1,h.radius*2.1,h.age*.7,.9);bossSprite(c,11,h.x,h.y-h.radius*.9,h.radius*1.4,h.radius*1.4,-h.age*.4,.5);}}if(warning){const progress=clamp((h.age-h.delay)/h.warning,0,1);c.setLineDash([]);ring(h.x,h.y,h.radius*(1-progress),'#ffe6a5');c.beginPath();c.moveTo(h.x-8,h.y);c.lineTo(h.x+8,h.y);c.moveTo(h.x,h.y-8);c.lineTo(h.x,h.y+8);c.stroke();
     if(h.visual==='rail-shell'||h.visual==='observer-shell'){c.lineWidth=4;for(const q of [.62,.82,1])ring(h.x,h.y,h.radius*q,q===1?'#ff765e':'#ffd18499');c.fillStyle='#fff0bd';c.font='bold 13px monospace';c.textAlign='center';c.fillText(h.visual==='observer-shell'?'관측 포격':'열차포 낙탄',h.x,h.y-h.radius-12);}}
    else if(h.visual==='zubian-mortar'){for(const q of [.45,.72,1])ring(h.x,h.y,h.radius*q,q===1?'#e9c083':'#8bd0d199');pixelBlast(c,h.x,h.y,h.radius*.65,h.age,true);}
    else if(h.visual==='minenwerfer-shell'||h.visual==='minenwerfer-heavy'){
     const ring=trenchFx.minenRing;
     if(warning){const strip=ring?.naturalWidth?ring:null;
      if(strip){const cols=3,fw=strip.naturalWidth/cols,fh=strip.naturalHeight,fi=Math.min(cols-1,Math.floor(clamp((h.age-h.delay)/h.warning,0,.999)*cols));
       c.save();c.translate(h.x,h.y);const s=h.radius*2.1;c.globalAlpha=.95;c.drawImage(strip,fi*fw,0,fw,fh,-s/2,-s/2,s,s);c.restore();
       const trail=trenchFx.minenTrail,prog=clamp((h.age-h.delay)/h.warning,0,.999);
       if(trail?.naturalWidth&&prog>.45){const tc=5,tw=trail.naturalWidth/tc,th=trail.naturalHeight,ti=Math.min(tc-1,Math.floor((prog-.45)/.55*tc)),ts=h.radius*2.6;
        c.save();c.translate(h.x,h.y-h.radius*.9);c.globalAlpha=.92;c.drawImage(trail,ti*tw,0,tw,th,-ts/2,-ts/2,ts,ts);c.restore();}}
      else{c.strokeStyle='#e0a35c';for(const q of [.5,.78,1])ring(h.x,h.y,h.radius*q,'#e0a35c88');}}
     else{const boom=(h.visual==='minenwerfer-heavy'?trenchFx.minenImpactH:trenchFx.minenImpactS)||ring;
      if(boom?.naturalWidth)drawTrenchImage(c,boom,h.x,h.y,h.radius*2.5,h.radius*2.5,0,.95);
      else bossSprite(c,12,h.x,h.y,h.radius*1.9,h.radius*1.9,h.age,.85);}
    }
   }
   c.restore();
  }
 });
 if(layer!=='bodies')for(const cue of g.bossCues){c.strokeStyle='#ffce80';c.setLineDash([8,6]);c.beginPath();c.moveTo(cue.x,cue.y);c.lineTo(cue.targetX,cue.targetY);c.stroke();c.setLineDash([]);}
 c.restore();
 if(layer==='bodies')return;for(const b of addon.stages.encounter?.bodies.values()||[]){if(b.dead)continue;const hull=LARGE_HULLS[b.kind]||{halfWidth:0,halfHeight:0},sx=(b.x-g.x)*z+W/2,sy=(b.y-g.y)*z+H/2,hx=hull.halfWidth*z,hy=hull.halfHeight*z;const visW=Math.min(sx+hx,W-30)-Math.max(sx-hx,30),visH=Math.min(sy+hy,H-100)-Math.max(sy-hy,190),frac=(Math.max(0,visW)*Math.max(0,visH))/(Math.max(1,4*hx*hy)||1);if(frac>.45)continue;const x=clamp(sx,26,W-26),y=clamp(sy,190,H-100),a=Math.atan2(b.y-g.y,b.x-g.x);c.save();c.translate(x,y);c.rotate(a);c.fillStyle='#ffcd7c';c.beginPath();c.moveTo(12,0);c.lineTo(-7,-7);c.lineTo(-7,7);c.fill();c.restore();}
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

let skyCloud113;
export function paintSky(c,cx,cy,W,H){
 c.fillStyle='#607c89';c.fillRect(0,0,W,H);
 const partAtlas=partArt.atlas;if(!partAtlas.naturalWidth)return;
 if(!skyCloud113){skyCloud113=document.createElement('canvas');skyCloud113.width=skyCloud113.height=128;const q=skyCloud113.getContext('2d');q.imageSmoothingEnabled=false;const w=partAtlas.naturalWidth/4,h=partAtlas.naturalHeight/4;q.drawImage(partAtlas,3*w,2*h,w,h,0,0,128,128);q.globalCompositeOperation='source-in';q.fillStyle='#d3dedd';q.fillRect(0,0,128,128);}
 c.save();c.imageSmoothingEnabled=false;
 for(const layer of [0,1]){const tile=layer?440:620,parallax=layer?.35:.16,px=cx*parallax,py=cy*parallax,sx=Math.floor(px/tile)-1,sy=Math.floor(py/tile)-1;
  for(let ix=sx;ix<(px+W)/tile+1;ix++)for(let iy=sy;iy<(py+H)/tile+1;iy++){const seed=Math.abs(Math.sin(ix*12.7+iy*37.3+layer)*437.4)%1,x=ix*tile-px+seed*80,y=iy*tile-py+seed*100,w=tile*(.65+seed*.35);c.globalAlpha=layer?.24:.13;const cloudIm=fxImage('cloud')||skyCloud113;c.drawImage(cloudIm,x,y,w,w*.55);c.drawImage(cloudIm,x+w*.36,y-w*.08,w*.75,w*.45);}
 }c.restore();
}

export function paintCity(c,cx,cy,W,H,city='london'){
 const source=cityArt[city]||cityArt.london;
 c.fillStyle=city==='berlin'?'#4a5350':'#535a56';c.fillRect(0,0,W,H);
 if(!source.naturalWidth)return;
 if(!source.lowDetail){const tileCanvas=document.createElement('canvas');tileCanvas.width=tileCanvas.height=256;const tc=tileCanvas.getContext('2d');tc.imageSmoothingEnabled=true;tc.filter='saturate(.35) contrast(.55) brightness(.7)';tc.drawImage(source,0,0,256,256);tc.filter='none';tc.fillStyle='#53605a';tc.globalAlpha=.28;tc.fillRect(0,0,256,256);source.lowDetail=tileCanvas;}
 const image=source.lowDetail;
 const tile=1024,startX=Math.floor(cx*.4/tile),startY=Math.floor(cy*.4/tile),ox=startX*tile-cx*.4,oy=startY*tile-cy*.4;
 c.save();c.imageSmoothingEnabled=false;
 for(let x=ox,ix=startX;x<W;x+=tile,ix++)for(let y=oy,iy=startY;y<H;y+=tile,iy++){
  c.save();c.translate(x+tile/2,y+tile/2);c.scale(ix&1?-1:1,iy&1?-1:1);c.drawImage(image,-tile/2,-tile/2,tile,tile);c.restore();
 }
 c.fillStyle=city==='berlin'?'#17232a18':'#26302914';c.fillRect(0,0,W,H);c.restore();
 const time=(globalThis.performance?.now?.()||0)/1000;c.save();c.globalCompositeOperation='screen';
 for(let i=0;i<3;i++){const ox=(i+.5)*W/3,oy=H+18,a=-Math.PI/2+Math.sin(time*.28+i*2.1)*.48,len=H*.9,tx=ox+Math.cos(a)*len,ty=oy+Math.sin(a)*len;
  if(fxReady('searchlight')){const bx=ox+Math.cos(a)*len*.5,by=oy+Math.sin(a)*len*.5;fx(c,'searchlight',bx,by,len,110,a,.35);}
  else{c.fillStyle='#ead89b14';c.beginPath();c.moveTo(ox-9,oy);c.lineTo(tx-42,ty);c.lineTo(tx+42,ty);c.lineTo(ox+9,oy);c.closePath();c.fill();}
  c.strokeStyle='#f2dda13d';c.lineWidth=1;c.beginPath();c.moveTo(ox,oy);c.lineTo(tx,ty);c.stroke();c.fillStyle='#413e35';c.fillRect(ox-12,H-18,24,18);c.fillStyle='#d9c883';c.fillRect(ox-5,H-22,10,5);}
 c.restore();
}

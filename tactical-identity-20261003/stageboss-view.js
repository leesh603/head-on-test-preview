import {TRENCH_ARMOR_LAYOUT} from './trench-armor-layout.js?v=482';
import {drawTrenchArmorGun} from './trench-armor-gun-render.js?v=482';
import {drawRailDamage,drawRailTrack} from './rail-render129.js?v=482';
import {fx,fxReady,fxImage,FX3} from './fx-art.js?v=482';
import {drawEnemyProjectile,drawBattlefieldFire} from './projectiles.js?v=482';
import {drawLivensFlame} from './livens-fire195.js?v=482';
import {drawSupportShip,drawSupportEffects} from './stuttgart-render129.js?v=482';
import {renderStageBossLayer} from './headon-stageboss-render.js?v=482';
import {bossHudModel} from './headon-stageboss-hud.js?v=482';
import {bossTactic,BOSS_NAMES_EN} from './boss-feedback.js?v=482';
import {planeSprite} from './aircraft.js?v=482';
import {getLocale} from './i18n.js?v=482';
import {londonStatus} from './london-battle.js?v=482';
import {prepareLondonArt,releaseLondonArt,drawGotha,drawLondonRaidApron,drawLondonWorld} from './london-art.js?v=482';
import {drawAADefense,prepareAADefenseAssets,releaseAADefenseAssets} from './aa-defense-art.js?v=482';

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
const supportGroup=createLazyImageGroup({ship:'./stuttgart-open129.webp?v=482',cover:'./stuttgart-cover129.webp?v=482'}),supportImages129=supportGroup.images;

const bossSources={
 parisGun:'./boss-bruno-train115.webp?v=482',lincomparable:'./boss-lincomparable94.webp?v=482',stuttgart:'./boss-sms-stuttgart94.webp?v=482',zubian:'./boss-hms-zubian94.webp?v=482',
 l70:'./boss-zeppelin-l7094.webp?v=482',hma23:'./boss-hma2394.webp?v=482',a7v:'./boss-a7v-flak94.webp?v=482',markv:'./boss-mark-v94.webp?v=482',gik:'./boss-gik.webp?v=482',ca4:'./boss-ca4.webp?v=482',
 londonApron:'./boss-london-apron115.webp?v=482',drachenNet:'./boss-drachen-net115.webp?v=482',
 railCarrier:'./boss-art-rail-carrier.webp?v=482',treffasWagen:'./boss-art-treffas-wagen.webp?v=482',
 mark4:'./boss-mark4.webp?v=482',mark4Wreck:'./boss-mark4-wreck.webp?v=482',morser:'./boss-morser.webp?v=482',morserWreck:'./boss-morser-wreck.webp?v=482',
 staaken:'./staaken_dark.webp?v=482',staakenWreck:'./boss-staaken-wreck.webp?v=482',searchlight:'./boss-searchlight.webp?v=482',searchlightWreck:'./boss-searchlight-wreck.webp?v=482'
};
const bossGroup=createLazyImageGroup(bossSources),bossArt=bossGroup.images;
const rebuildGroup=createLazyImageGroup({a7vHull:'./boss-a7v-hull-rebuild.webp?v=482',a7vTurret:'./boss-a7v-turret-rebuild.webp?v=482',markvHull:'./boss-mark-v-hull-rebuild.webp?v=482',markvSponson:'./boss-mark-v-sponson-rebuild.webp?v=482'}),rebuildArt=rebuildGroup.images;
const armorDamageGroup=createLazyImageGroup({a7vLeft:'./boss-a7v-track-left-20260930.webp?v=482',a7vRight:'./boss-a7v-track-right-20260930.webp?v=482',a7vBreached:'./boss-a7v-breached-20260930.webp?v=482',a7vWreck:'./boss-a7v-wreck-20260930.webp?v=482',a7vGunWreck:'./boss-a7v-gun-wreck-20260930.webp?v=482',markLeft:'./boss-mark-v-track-left-20260930.webp?v=482',markRight:'./boss-mark-v-track-right-20260930.webp?v=482',markBreached:'./boss-mark-v-breached-20260930.webp?v=482',markWreck:'./boss-mark-v-wreck-20260930.webp?v=482',markGunWreck:'./boss-mark-v-gun-wreck-20260930.webp?v=482'}),armorDamage=armorDamageGroup.images;
const harborGroup=createLazyImageGroup({base:'./boss-armored-harbor-main-base.webp?v=482',craneArm:'./boss-armored-harbor-crane-arm.webp?v=482',cranePivot:'./boss-armored-harbor-crane-pivot.webp?v=482',ammo:'./boss-armored-harbor-ammo-storage.webp?v=482',guns:'./boss-armored-harbor-gun-emplacements.webp?v=482',facility:'./boss-armored-harbor-seaplane-facility.webp?v=482'}),harborArt=harborGroup.images;
const trenchGroup=createLazyImageGroup({
 livensParts:'./boss_livens_parts195.webp?v=482',livensBase:'./boss_livens_base187.webp?v=482',
 livensMount:'./boss_livens_nozzle_mount187.webp?v=482',livensNozzle:'./boss_livens_nozzle_normal_pivot187.webp?v=482',livensTurret:'./boss-livens-turret2x.webp?v=482',
 livensCoreClosed:'./boss_livens_core_closed187.webp?v=482',livensCoreExposed:'./boss_livens_core_exposed187.webp?v=482',livensCoreDestroyed:'./boss_livens_core_destroyed187.webp?v=482',
 livensPipeL:'./boss_livens_pipe_l_normal194.png',livensPipeR:'./boss_livens_pipe_r_normal194.png',livensPipeLBroken:'./boss_livens_pipe_l_broken194.png',livensPipeRBroken:'./boss_livens_pipe_r_broken194.png',
 minenComposite:'./boss-minenwerfer-composite188.webp?v=482',
 livensComposite:'./boss-livens-composite317.webp?v=482',livensPivot:'./boss-livens-pivot317.webp?v=482',livensPivotDamaged:'./boss-livens-pivot-damaged317.webp?v=482',livensPivotDestroyed:'./boss-livens-pivot-destroyed317.webp?v=482'
}),trenchBossArt=trenchGroup.images;
// Four authored RGBA frames, graded/packed offline; no runtime filter or canvas copy.
const impactGroup=createLazyImageGroup({atlas:'./fx-mortar-impact340.webp?v=482'}),impactArt=impactGroup.images;
const BOSS_KEYS_BY_REGION=Object.freeze({
  0:['parisGun','lincomparable'],1:['stuttgart','zubian'],2:['a7v','markv'],3:[],4:['londonApron','drachenNet'],5:['l70','hma23'],6:['gik','ca4'],7:[],8:['railCarrier','treffasWagen'],10:['mark4','mark4Wreck','morser','morserWreck'],11:[]
});
export function prepareStageBossAssets(region){
 const jobs=[];releaseLondonArt();if(region===11)jobs.push(prepareLondonArt());
 bossGroup.release();supportGroup.release();rebuildGroup.release();armorDamageGroup.release();harborGroup.release();trenchGroup.release();zubianGroup.release();cityGroup.release();buildingGroup.release();
 for(const group of [...Object.values(railGroups),...Object.values(railWreckGroups)])group.release();
 const bossKeys=BOSS_KEYS_BY_REGION[region]||[];if(bossKeys.length)jobs.push(bossGroup.preload(bossKeys));
 if(region===0)for(const group of Object.values(railGroups))jobs.push(group.preload());
 if(region===1){jobs.push(supportGroup.preload());jobs.push(zubianGroup.preload())}
  if(region===2){jobs.push(rebuildGroup.preload());jobs.push(armorDamageGroup.preload())}
  if(region===2||region===4||region===11)jobs.push(prepareAADefenseAssets(region===2?['fx']:['fx','drachen','london']));
  else releaseAADefenseAssets();
 if(region===3){jobs.push(trenchGroup.preload());jobs.push(impactGroup.preload())}else impactGroup.release();
 if(region===4){jobs.push(cityGroup.preload());jobs.push(buildingGroup.preload())}
 if(region===7)jobs.push(harborGroup.preload());
 if(region===8){jobs.push(railGroups.railCarrier.preload());jobs.push(railWreckGroups.railCarrier.preload());jobs.push(treffasGroup.preload());jobs.push(bugGroup.preload());jobs.push(partWreckGroup.preload());}else{treffasGroup.release();bugGroup.release();partWreckGroup.release()}
 if(region===10||region===11)jobs.push(partWreckGroup.preload());
 if(region>=0)jobs.push(partGroup.preload());else{partGroup.release();skyCloud113=null}
 return Promise.all(jobs);
}
const drawTrenchImage=(c,image,x,y,w,h,angle=0,alpha=1)=>{if(!(image?.naturalWidth||image?.width))return false;c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha=alpha;c.imageSmoothingEnabled=true;c.drawImage(image,-w/2,-h/2,w,h);c.restore();return true;};
// All three damage states share fixed atlas rectangles and mounting coordinates.
const drawLivensPart=(c,row,state,x,y,width)=>{
 const image=trenchBossArt.livensParts;if(!image?.naturalWidth)return;
 const [sy,sh]=[[60,290],[375,360],[745,460]][row],sx=[20,425,835][state];
 const height=sh*width/405;
 c.drawImage(image,sx,sy,405,sh,x-width/2,y-height/2,width,height);
};
function drawLivens(c,b){
 const part=id=>b.parts?.find?.(p=>p.id===id)||b.parts?.get?.(id),state=p=>p?.destroyed?2:p&&p.hp<=p.maxHp*.5?1:0;
 const destroyed=b.destroying;
 c.save();c.imageSmoothingEnabled=true;
 drawTrenchImage(c,trenchBossArt.livensBase,0,0,520,287);
 for(const side of [-1,1]){
  const upper=part(side<0?'tank-l1':'tank-r1'),lower=part(side<0?'tank-l2':'tank-r2');
  const pipeKey=broken=>side<0?(broken?'livensPipeLBroken':'livensPipeL'):(broken?'livensPipeRBroken':'livensPipeR');
  drawTrenchImage(c,trenchBossArt[pipeKey(upper?.destroyed)],side*104,-58,116,91);
  drawTrenchImage(c,trenchBossArt[pipeKey(lower?.destroyed)],side*104,61,116,91,Math.PI);
  for(const [p,y] of [[upper,-72],[lower,72]]){
   drawLivensPart(c,0,destroyed?2:state(p),side*155,y,156);
  }
 }
 const broken=b.parts?.filter?b.parts.filter(p=>p.destroyed).length:[...b.parts?.values?.()||[]].filter(p=>p.destroyed).length;
 drawLivensPart(c,2,destroyed||b.coreVulnerable?2:broken>=2?1:0,0,-8,166);
 if(b.coreVulnerable&&!destroyed){const core=trenchBossArt.livensCoreExposed;if(core.naturalWidth)c.drawImage(core,34,27,37,40,-25,-42,50,54);}
 drawLivensPart(c,1,destroyed?2:state(part('pressure')),0,72,124);
 drawTrenchImage(c,trenchBossArt.livensMount,0,-93,116,74);
 const angle=(Number.isFinite(b.nozzleAngle)?b.nozzleAngle:-Math.PI/2)-Math.PI;
 drawTrenchImage(c,trenchBossArt.livensNozzle,0,-98,240,240,angle);
 if(destroyed)drawBattlefieldFire(c,{t:b.destructionAge,fireZones:[{x:0,y:0,radius:120,life:Math.max(0,b.destructionDuration-b.destructionAge)}]});
 c.restore();
}
function drawMinenwerfer(c,b){
 const parts=b.parts?.filter?b.parts:[...b.parts?.values?.()||[]];
 c.save();c.imageSmoothingEnabled=true;
 for(const p of parts){
  const x=p.x,y=p.y,dead=b.destroying||p.destroyed,damaged=!dead&&p.hp<=p.maxHp*.5;
  const composite=dead?bakedImage(trenchBossArt.minenComposite,'grayscale(.72) brightness(.55)'):damaged?bakedImage(trenchBossArt.minenComposite,'saturate(.72) brightness(.82)'):trenchBossArt.minenComposite;
  drawTrenchImage(c,composite||trenchBossArt.minenComposite,x,y,250,188);
  if(damaged){fx(c,'smokeTrail',x+8,y-58,62,34,-Math.PI/2,.2);fx(c,'fireEngine',x-12,y-18,28,28,0,.42);}
  if(dead){fx(c,'fireGround',x-12,y+4,42,42,0,.58);fx(c,'smokeHeavy',x+10,y-34,64,64,0,.24);for(let i=0;i<2;i++)fx(c,'debrisShard',x+(i?31:-27),y+28-i*13,24,18,(i?1:-1)*.7,.65);}
 }
 c.restore();
}
const railConsistSources={
 parisGun:{engine:'./rail-boss-bruno-engine181.webp?v=482',front:'./rail-boss-bruno-front181.webp?v=482',middle:'./rail-boss-bruno-middle181.webp?v=482',rear:'./rail-boss-bruno-rear181.webp?v=482'},
 lincomparable:{engine:'./rail-boss-lincomparable-engine181.webp?v=482',front:'./rail-boss-lincomparable-front181.webp?v=482',middle:'./rail-boss-lincomparable-middle181.webp?v=482',rear:'./rail-boss-lincomparable-rear181.webp?v=482'},
 railCarrier:{engine:'./boss-rail-carrier-loco.webp?v=482',front:'./boss-rail-carrier-flak.webp?v=482',middle:'./boss-rail-carrier-launch.webp?v=482',rear:'./boss-rail-carrier-hangar.webp?v=482'}
};
const railWreckSources={
 parisGun:{engine:'./rail-boss-bruno-engine-wreck192.webp?v=482',front:'./rail-boss-bruno-front-wreck192.webp?v=482',middle:'./rail-boss-bruno-middle-wreck192.webp?v=482',rear:'./rail-boss-bruno-rear-wreck192.webp?v=482'},
 lincomparable:{engine:'./rail-boss-lincomparable-engine-wreck192.webp?v=482',front:'./rail-boss-lincomparable-front-wreck192.webp?v=482',middle:'./rail-boss-lincomparable-middle-wreck192.webp?v=482',rear:'./rail-boss-lincomparable-rear-wreck192.webp?v=482'},
 railCarrier:{engine:'./boss-rail-carrier-loco-wreck.webp?v=482',front:'./boss-rail-carrier-flak-wreck.webp?v=482',middle:'./boss-rail-carrier-launch-wreck.webp?v=482',rear:'./boss-rail-carrier-hangar-wreck.webp?v=482'}
};
// Fliegerzug munition + Treffas-Wagen separable parts (destroyed parts get a burn filter).
const bugGroup=createLazyImageGroup({folded:'./boss-bug-folded.webp?v=482',flight:'./boss-bug-flight.webp?v=482'}),bugArt=bugGroup.images;
const treffasGroup=createLazyImageGroup({wheel:'./boss-treffas-wheel.webp?v=482',wheelR:'./boss-treffas-wheel-r.webp?v=482',hull:'./boss-treffas-hull.webp?v=482',turret:'./boss-treffas-turret.webp?v=482',tail:'./boss-treffas-tail.webp?v=482'}),treffasArt=treffasGroup.images;
// Wreck sprites drawn over destroyed boss parts (wheels, turrets, gun pits...).
const partWreckGroup=createLazyImageGroup({wheel:'./boss-part-wreck-wheel.webp?v=482',turret:'./boss-part-wreck-turret.webp?v=482',tail:'./boss-part-wreck-tail.webp?v=482',light:'./boss-part-wreck-light.webp?v=482',gun:'./boss-part-wreck-gun.webp?v=482',pit:'./boss-part-wreck-pit.webp?v=482'}),partWreckArt=partWreckGroup.images;
const railGroups={},railConsistArt={},railWreckGroups={},railWreckArt={};
for(const [set,sources] of Object.entries(railConsistSources)){const group=createLazyImageGroup(sources);railGroups[set]=group;railConsistArt[set]=group.images;const wreckGroup=createLazyImageGroup(railWreckSources[set]);railWreckGroups[set]=wreckGroup;railWreckArt[set]=wreckGroup.images;}
function drawRailConsist181(c,b){
 const set=b.assetKey==='lincomparable'?'lincomparable':b.assetKey==='fliegerzug'?'railCarrier':'parisGun',images=railConsistArt[set],wreckImages=railWreckArt[set],cars=new Map((b.railCars||[]).map(car=>[car.id,car]));
 if(!images.engine.naturalWidth){drawBossArt(c,set,164*2.025,246*2.025);return;}
 c.save();c.imageSmoothingEnabled=true;
 if(b.phase==='derailed'){c.rotate(.16);c.translate(28,8);}
 const carDim=set==='railCarrier'?[124,400]:[260,390];
 for(const [id,key] of [['car-rear','rear'],['car-middle','middle'],['car-front','front']]){const car=cars.get(id);if(!car)continue;
  const wreckImage=wreckImages[key]; // Load only the active train's wreck art.
  if(!car.destroyed){c.drawImage(images[key],-carDim[0]/2,car.y-carDim[1]/2,carDim[0],carDim[1]);
   continue}
  // Destroyed car: wreck image under a rolling explosion cluster, then the
  // car is consumed and leaves an empty gap in the consist.
  const age=(b.motionTime||0)-(car.destroyedAt??b.motionTime??0);
  if(age>=3.0)continue;
  c.save();c.translate(0,car.y);c.rotate(.025);
  const fade=Math.max(0,1-age/2.4);
  if(wreckImage.naturalWidth&&fade>0){c.globalAlpha=fade;c.drawImage(wreckImage,-carDim[0]/2,-carDim[1]/2,carDim[0],carDim[1]);c.globalAlpha=1;}
  for(let k=0;k<7;k++){const e=clamp((age*.9-k*.28),0,1);if(e<=0||e>=1)continue;const ex=Math.sin(k*2.31)*78,ey=-135+(k%3)*130+Math.sin(k*5.7)*46,fr=Math.min(3,Math.floor(e*4));fx(c,(k%2?'explosionOily':'explosion')+fr,ex,ey,(120+70*e),(120+70*e),0,.95*(1-e*.4));}
  for(let k=0;k<3;k++){const s=((b.motionTime||0)*.5+k*.37)%1;fx(c,'smokeDark',Math.sin(k*4.1)*60,-90-s*170,120+s*150,120+s*150,0,(1-s)*.42);}
  c.restore()}
 const engineWreck=wreckImages.engine,engine=b.destroying&&engineWreck.naturalWidth?engineWreck:images.engine;
 c.drawImage(engine,-carDim[0]/2,-carDim[1]/2,carDim[0],carDim[1]);
 // Keep the launch payload readable above the intentionally overlapping consist.
 if(set==='railCarrier'&&bugArt.folded?.naturalWidth){const launch=cars.get('car-middle');if(launch&&!launch.destroyed)for(const [x,y] of [[-22,72],[22,72],[0,123]])c.drawImage(bugArt.folded,x-20,launch.y+y-44,40,88);}
 c.restore();
}

const FORMATION_BOSS_KEYS=new Set(['jasta11-circus','naval10-black-flight']);
const LARGE_HULLS=Object.freeze({'gotha-raider':{halfWidth:105,halfHeight:105},'london-apron-raid':{halfWidth:185,halfHeight:130},gik:{halfWidth:128,halfHeight:150},ca4:{halfWidth:128,halfHeight:150},'armored-harbor-fortress':{halfWidth:245,halfHeight:235},'jasta11-circus':{halfWidth:42,halfHeight:42},'naval10-black-flight':{halfWidth:42,halfHeight:42}});
function drawFormationBossRim(c,t=0){
 const pulse=.88+.08*Math.sin(t*2.6);c.save();c.globalAlpha=.72;c.fillStyle='rgba(24,10,10,.36)';c.beginPath();c.arc(0,0,39,0,Math.PI*2);c.fill();
 c.globalAlpha=pulse;c.strokeStyle='#6d171b';c.lineWidth=5;c.beginPath();c.arc(0,0,39,0,Math.PI*2);c.stroke();c.strokeStyle='#d06a52';c.lineWidth=1.5;c.beginPath();c.arc(0,0,34,0,Math.PI*2);c.stroke();
 c.strokeStyle='#e0b56e';c.lineWidth=2.2;for(let i=0;i<4;i++){const a=i*Math.PI/2,inner=35,outer=43;c.beginPath();c.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);c.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);c.stroke();}
 c.globalAlpha=.94;c.fillStyle='#240b0d';c.fillRect(-20,41,40,14);c.strokeStyle='#9e332d';c.lineWidth=1;c.strokeRect(-20,41,40,14);c.fillStyle='#f0d7a4';c.font='700 9px "Arial Narrow",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('BOSS',0,48);c.restore();
}
function drawFormationNameplate(c,x,y,name,viewWidth){
 if(!name)return;c.save();c.font='600 11px "Arial Narrow",sans-serif';c.textAlign='center';c.textBaseline='middle';const w=Math.ceil(c.measureText(name).width)+16;
 if(viewWidth)x=clamp(x,w/2+4,viewWidth-w/2-4);
 c.fillStyle='rgba(18,13,11,.88)';c.fillRect(Math.round(x-w/2),Math.round(y-8),w,17);c.strokeStyle='#8f332c';c.lineWidth=1;c.strokeRect(Math.round(x-w/2)+.5,Math.round(y-8)+.5,w-1,16);c.fillStyle='#f0d7a4';c.fillText(name,Math.round(x),Math.round(y));c.restore();
}
function drawFormationEdgeBadge(c,x,y,a){
 c.save();c.translate(x,y);c.fillStyle='rgba(28,10,12,.94)';c.strokeStyle='#c85b48';c.lineWidth=2.5;c.beginPath();c.arc(0,0,18,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#f0d7a4';c.font='700 8px "Arial Narrow",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('BOSS',0,0);c.rotate(a);c.fillStyle='#c85b48';c.beginPath();c.moveTo(24,0);c.lineTo(17,-5);c.lineTo(17,5);c.closePath();c.fill();c.restore();
}
const zubianGroup=createLazyImageGroup({atlas:'./zubian-atlas.webp?v=482'}),zubianArt=zubianGroup.images;
const sinkFoamGroup=createLazyImageGroup({foam:'./ship-sinkfoam.webp?v=482'}),sinkFoamArt=sinkFoamGroup.images;
const zubianFrames={intact:[90,4,185,500],front:[317,12,185,324],rear:[510,208,184,296]};
function drawZubianFrame(c,key,x,y,w,h){const zubianAtlas=zubianArt.atlas;if(!zubianAtlas.naturalWidth)return;const f=zubianFrames[key];c.save();c.imageSmoothingEnabled=true;c.drawImage(zubianAtlas,f[0],f[1],f[2],f[3],x-w/2,y-h/2,w,h);c.restore();}
const drawBossArt=(c,key,w,h)=>{const image=bossArt[key];if(image?.naturalWidth)c.drawImage(image,-w/2,-h/2,w,h)};
const cityGroup=createLazyImageGroup({london:'./terrain-city-london96.webp?v=482',berlin:'./terrain-city-berlin96.webp?v=482'}),cityArt=cityGroup.images;
// Dedicated aircraft-style sprite atlas; collider sizes remain authoritative.
const partGroup=createLazyImageGroup({atlas:'./boss-parts100.webp?v=482'}),partArt=partGroup.images;
function bossSprite(c,index,x,y,w,h,angle=0,alpha=1){
 const partAtlas=partArt.atlas;if(!partAtlas.naturalWidth)return;
 const cell=partAtlas.naturalWidth/4,row=partAtlas.naturalHeight/4;
 c.save();c.translate(Math.round(x),Math.round(y));c.rotate(angle);c.globalAlpha*=alpha;c.imageSmoothingEnabled=false;
 c.drawImage(partAtlas,(index%4)*cell,Math.floor(index/4)*row,cell,row,-w/2,-h/2,w,h);c.restore();
}
// iOS Safari drops to a software canvas path for every ctx.filter call, which
// punishes long sessions; burn/damage looks are baked once into offscreen
// canvases instead.
const bakedCellCache=new Map();
function bakedCell(index,filter){
 const partAtlas=partArt.atlas;if(!partAtlas.naturalWidth)return null;
 const key=index+'|'+filter,prev=bakedCellCache.get(key);if(prev)return prev;
 const cell=partAtlas.naturalWidth/4,row=partAtlas.naturalHeight/4,cv=document.createElement('canvas');
 cv.width=cell;cv.height=row;const cc=cv.getContext('2d');cc.filter=filter;
 cc.drawImage(partAtlas,(index%4)*cell,Math.floor(index/4)*row,cell,row,0,0,cell,row);
 bakedCellCache.set(key,cv);return cv;
}
function bossSpriteFiltered(c,index,filter,x,y,w,h,angle=0,alpha=1){
 const baked=bakedCell(index,filter);
 if(!baked)return bossSprite(c,index,x,y,w,h,angle,alpha);
 c.save();c.translate(Math.round(x),Math.round(y));c.rotate(angle);c.globalAlpha*=alpha;c.imageSmoothingEnabled=false;
 c.drawImage(baked,-w/2,-h/2,w,h);c.restore();
}
const bakedImageCache=new Map();
function bakedImage(image,filter){
 if(!image?.naturalWidth)return null;
 const key=image.src?image.src+'|'+filter:image,prev=bakedImageCache.get(key);if(prev)return prev;
 const cv=document.createElement('canvas');cv.width=image.naturalWidth;cv.height=image.naturalHeight;
 const cc=cv.getContext('2d');cc.filter=filter;cc.drawImage(image,0,0);
 bakedImageCache.set(key,cv);return cv;
}
function pixelBlast(c,x,y,r,age=0,water=false){bossSprite(c,water?13:12,x,y,r*2,r*2,water?0:age*.15)}
function drawArmorGun(c,part,kind,scale){
 const mark=kind==='mark-v-cruiser';
 const image=part.destroyed?(mark?armorDamage.markGunWreck:armorDamage.a7vGunWreck):(mark?rebuildArt.markvSponson:rebuildArt.a7vTurret);
 drawTrenchArmorGun(c,part,kind,image,scale);
}

function drawTrenchArmor(c,b){
 const mark=b.assetKey==='mark-v-cruiser',prefix=mark?'mark':'a7v',s=b.geometryScale||1;
 const parts=b.parts||[],part=id=>parts.find(p=>p.id===id),left=part('track-left')?.destroyed,right=part('track-right')?.destroyed;
 const key=b.destroying?'Wreck':left&&right?'Breached':left?'Left':right?'Right':null;
 const image=key?armorDamage[prefix+key]:(mark?rebuildArt.markvHull:rebuildArt.a7vHull);
 c.save();c.rotate(b.hullYaw||0);c.imageSmoothingEnabled=true;
 if(Math.abs(b.driveVelocity||0)>2&&!b.destroying){
  const y=b.driveVelocity<0?114:-114;
  for(const side of [-1,1])if(!part(side<0?'track-left':'track-right')?.destroyed)fx(c,'dustPuff',side*TRENCH_ARMOR_LAYOUT[b.assetKey].trackX,y,52,36,0,.22);
 }
 if(image?.naturalWidth)c.drawImage(image,-128,-128,256,256);
 else{const intact=mark?rebuildArt.markvHull:rebuildArt.a7vHull;if(intact.naturalWidth)c.drawImage(intact,-128,-128,256,256);}
 if(!b.destroying&&!(left&&right)&&(b.coreVulnerable||part('engine-deck')?.destroyed)){
  // The authored ruptured engine panel is the same registered hull patch.
  const breached=armorDamage[prefix+'Breached'];if(breached.naturalWidth){c.save();c.beginPath();c.rect(-31,-61,62,99);c.clip();c.drawImage(breached,-128,-128,256,256);c.restore();}
 }
 for(const p of parts)if(p.kind==='armor-gun')drawArmorGun(c,b.destroying?{...p,destroyed:true}:p,b.assetKey,s);
 for(const p of parts)if(p.destroyed&&!b.destroying){
  const x=p.localX/s,y=p.localY/s;
  fx(c,'smokeDark',x+Math.sin(b.motionTime*.4)*5,y-22,42,58,0,p.kind==='track'?.23:.35);
 }
 if(b.destroying)fx(c,'smokeHeavy',0,-24,130,155,0,.45);
 c.restore();
}

// Destroyed part: scorched crater with torn plating, a flickering fire core,
// sparks climbing out of it and a smoke column drifting upward.
function partWreck(c,p,r,t){
 const g=c.createRadialGradient(p.x,p.y,2,p.x,p.y,r*1.25);
 g.addColorStop(0,'rgba(22,18,14,.95)');g.addColorStop(.55,'rgba(46,38,30,.6)');g.addColorStop(1,'rgba(46,38,30,0)');
 c.fillStyle=g;c.beginPath();c.arc(p.x,p.y,r*1.25,0,Math.PI*2);c.fill();
 c.strokeStyle='#4d3f30aa';c.lineWidth=1.5;
 for(let i=0;i<6;i++){const a=i*1.07+p.x*.013;c.beginPath();c.moveTo(p.x+Math.cos(a)*r*.35,p.y+Math.sin(a)*r*.35);c.lineTo(p.x+Math.cos(a)*(r*.85+(i%2)*r*.3),p.y+Math.sin(a)*(r*.85+(i%2)*r*.3));c.stroke();}
 const fl=.75+Math.sin(t*13+p.x)*.25;
 fx(c,'fire',p.x,p.y-r*.15,r*1.15*fl,r*1.15*fl,0,.95);
 for(let i=0;i<3;i++){const e=(t*.6+i*.37)%1,ex=p.x+Math.sin(i*9.1+p.x)*r*.5,ey=p.y-r*.3-e*r*1.6;c.globalAlpha=(1-e)*.8;c.fillStyle=i?'#ffb54d':'#ff7a1e';c.fillRect(ex-1.5,ey-1.5,3,3);}
 c.globalAlpha=1;
 for(let i=0;i<3;i++){const s=(t*.24+i*.33)%1,ss=r*(.9+s*1.4),sx=p.x+Math.sin(i*5.3+t*.8)*r*.4,sy=p.y-r*.8-s*r*3.2;
  fx(c,'smokeDark',sx,sy,ss,ss,0,(1-s)*.42);}
}
function drawBossPart(c,p,ring,t=0){
 const r=p.radius;
 if(p.bodyKey==='gotha-raider'||p.bodyKey==='london-apron-raid'){if(!p.destroyed&&(p.hp<p.maxHp||p.partId==='bomb-bay'&&p.phase==='bombing-run')){ring(p.x,p.y,r,'#efc98aaa');c.fillStyle='#1b242a';c.fillRect(p.x-r,p.y+r+4,r*2,3);c.fillStyle='#edb875';c.fillRect(p.x-r,p.y+r+4,r*2*p.hp/p.maxHp,3);}return;}
 if(['paris-gun','lincomparable','sms-stuttgart','fliegerzug'].includes(p.bodyKey)||p.bodyKey.startsWith('hms-zubian')){
  return;
 }
 if(p.bodyKey==='treffas-wagen'){
  // Wreck sprites live inside the body composite; parts stay interaction-only.
  if(p.hittable&&!p.destroyed){c.strokeStyle='#ffd57988';c.lineWidth=1.5;for(let i=0;i<4;i++){const a=i*Math.PI/2;c.beginPath();c.arc(p.x,p.y,r,a-.34,a+.34);c.stroke();}c.fillStyle='#202e28';c.fillRect(p.x-r*.72,p.y+r+5,r*1.44,3);c.fillStyle='#efb96f';c.fillRect(p.x-r*.72,p.y+r+5,r*1.44*p.hp/p.maxHp,3);}return;
 }
  if(p.bodyKey==='london-apron'||p.bodyKey==='drachen-net'){
   // Body rendering owns the separated intact/wreck sprites. These are the
   // same coordinates as the hittable parts, without composite scorch patches.
   return;
  }
 if(p.bodyKey==='livens-flame-projector'){
  // Components are painted inside the composite; parts only carry a small hp
  // bar once they start taking damage.
  if(p.hittable&&!p.destroyed&&p.hp<p.maxHp){c.fillStyle='#202e28';c.fillRect(p.x-r*.65,p.y+r+3,r*1.3,3);c.fillStyle='#efb96f';c.fillRect(p.x-r*.65,p.y+r+3,r*1.3*p.hp/p.maxHp,3);}return;
 }
 if(p.bodyKey==='minenwerfer-battery'){
  // The body pass paints each authored emplacement and its wreck state. This
  // pass only communicates targetability and remaining local durability.
  if(p.hittable&&!p.destroyed){ring(p.x,p.y,r,'#ffd57999');c.fillStyle='#202e28';c.fillRect(p.x-r,p.y+r+5,r*2,4);c.fillStyle='#efb96f';c.fillRect(p.x-r,p.y+r+5,r*2*p.hp/p.maxHp,4);}return;
 }
 if(p.bodyKey==='morser-battery'){
  // Composite art already shows every pit; parts only carry ring + hp bar.
  if(p.destroyed)return;
  if(p.hittable&&!p.destroyed){ring(p.x,p.y,r,'#ffd57999');c.fillStyle='#202e28';c.fillRect(p.x-r,p.y+r+5,r*2,4);c.fillStyle='#efb96f';c.fillRect(p.x-r,p.y+r+5,r*2*p.hp/p.maxHp,4);}return;
 }
 if(p.bodyKey==='mark4-wedge'){
  // Tanks are painted by the body composite; destroyed hulls keep the wreck
  // art instead of a generic scorch patch.
  if(p.destroyed)return;
  if(p.hittable&&!p.destroyed){ring(p.x,p.y,r,'#ffd57999');c.fillStyle='#202e28';c.fillRect(p.x-r*.7,p.y+r*.62,r*1.4,4);c.fillStyle='#efb96f';c.fillRect(p.x-r*.7,p.y+r*.62,r*1.4*p.hp/p.maxHp,4);}return;
 }
 if(p.bodyKey==='staaken-rvi'||p.bodyKey==='london-searchlight'){
  // Composite bodies paint the hardware; parts stay interaction markers only.
  if(p.destroyed)return;
  if(p.hittable){ring(p.x,p.y,r,'#ffd57999');c.fillStyle='#202e28';c.fillRect(p.x-r,p.y+r+5,r*2,4);c.fillStyle='#efb96f';c.fillRect(p.x-r,p.y+r+5,r*2*p.hp/p.maxHp,4);}return;
 }
 if(p.bodyKey==='a7v-flak'||p.bodyKey==='mark-v-cruiser'){
  // All hardware is assembled in the body pass. Part pass only shows damage.
  if(p.hittable&&!p.destroyed&&p.hp<p.maxHp){c.fillStyle='#202e28';c.fillRect(p.x-r*.65,p.y+r+4,r*1.3,3);c.fillStyle='#efb96f';c.fillRect(p.x-r*.65,p.y+r+4,r*1.3*p.hp/p.maxHp,3);}return;
 }
 if(p.bodyKey==='armored-harbor-fortress'){
  if(p.partId==='crane-pivot'&&p.destroyed&&p.phase==='final-core'&&harborArt.cranePivot.naturalWidth){
   const scale=2.025,size=300*scale,bodyX=p.x+78*scale,bodyY=p.y-13*scale;
   const bakedCrane=bakedImage(harborArt.cranePivot,'grayscale(.55) brightness(.7) sepia(.25)');
   c.save();c.imageSmoothingEnabled=true;
   c.drawImage(bakedCrane||harborArt.cranePivot,bodyX-size/2,bodyY-size/2,size,size);c.restore();
   ring(p.x,p.y,r*1.35,'#ffb55fcc');ring(p.x,p.y,r*.72,'#fff0b0bb');return;
  }
  if(p.destroyed){partWreck(c,p,r,t);return;}
  if(p.hittable){ring(p.x,p.y,r,'#ffd57999');c.fillStyle='#202e28';c.fillRect(p.x-r,p.y+r+5,r*2,4);c.fillStyle='#efb96f';c.fillRect(p.x-r,p.y+r+5,r*2*p.hp/p.maxHp,4);}return;
 }
 if(['gik','ca4'].includes(p.bodyKey)){
  if(p.destroyed){const g=c.createRadialGradient(p.x,p.y,2,p.x,p.y,r*1.2);g.addColorStop(0,'rgba(20,17,14,.9)');g.addColorStop(.6,'rgba(60,48,36,.5)');g.addColorStop(1,'rgba(60,48,36,0)');c.fillStyle=g;c.beginPath();c.arc(p.x,p.y,r*1.2,0,Math.PI*2);c.fill();}
  if(p.hittable&&!p.destroyed){ring(p.x,p.y,r,'#ffd579aa');c.fillStyle='#202e28';c.fillRect(p.x-r,p.y+r+5,r*2,4);c.fillStyle='#efb96f';c.fillRect(p.x-r,p.y+r+5,r*2*p.hp/p.maxHp,4);}return;
 }
 if(['zeppelin-l70','hma23'].includes(p.bodyKey)){
  const carrier=p.bodyKey==='hma23',partSprite=carrier?6:4;
  // L70 keeps underslung engine pods; HMA uses the authored launch-port cradle
  // so the two airships no longer share one row of identical components.
  if(p.destroyed){bossSpriteFiltered(c,partSprite,'grayscale(1) brightness(.4)',p.x,p.y,r*2.1,r*1.5,Math.PI/2,.8);
   bossSprite(c,9,p.x,p.y,r*(carrier ? .72 : .9),r*(carrier ? .72 : .9),0,carrier ? .55 : .72);}
  else bossSprite(c,partSprite,p.x,p.y,r*2.1,r*1.5,Math.PI/2,.95);
  if(carrier&&!p.destroyed){const side=Number(p.partId.slice(5))<2?-1:1;c.strokeStyle='#d5c28a99';c.lineWidth=2;c.beginPath();c.moveTo(p.x-side*r*.2,p.y+r*.2);c.lineTo(p.x+side*r*1.15,p.y+r*.8);c.stroke();c.strokeStyle='#4e685f';c.lineWidth=1;c.beginPath();c.moveTo(p.x-side*r*.1,p.y-r*.05);c.lineTo(p.x+side*r,p.y+r*.55);c.stroke();}
  if(!carrier&&p.destroyed){fx(c,'fireEngine',p.x,p.y-r*.15,r*1.25,r*1.25,0,.72);if(Math.floor(t*3+p.x*.1)%2===0)fx(c,'smokeDark',p.x,p.y-r*.85,r*2.2,r*2.2,0,.32);}
  if(p.hittable&&!p.destroyed){ring(p.x,p.y,r,'#ffd579aa');c.fillStyle='#202e28';c.fillRect(p.x-r,p.y+r+5,r*2,4);c.fillStyle='#efb96f';c.fillRect(p.x-r,p.y+r+5,r*2*p.hp/p.maxHp,4);}return;
 }
 const index=p.partId==='truss'?0:p.partId==='muzzle'?1:p.partId==='hangar'?2:p.partId==='crane'?3:p.partId==='capsule'?4:p.kind==='engine'?5:p.partId.startsWith('port-')?6:p.bodyKey==='a7v-flak'?7:8;
 const angle=p.bodyKey==='a7v-flak'?({front:0,right:Math.PI/2,rear:Math.PI,left:-Math.PI/2}[p.partId]||0):p.partId==='sponson-right'?Math.PI:0;
 if(p.destroyed){
  // Preserve each original part's silhouette beneath torn armor instead of substituting an AA gun.
  bossSpriteFiltered(c,index,'grayscale(1) brightness(.35)',p.x,p.y,r*2.1,r*2.1,angle);
  bossSprite(c,9,p.x,p.y,r*1.65,r*1.65,angle,.92);
 }else bossSprite(c,index,p.x,p.y,r*2.1,r*2.1,angle);
 if(p.hittable&&!p.destroyed){ring(p.x,p.y,r,'#ffd57988');c.fillStyle='#202e28';c.fillRect(p.x-r,p.y+r+5,r*2,4);c.fillStyle='#efb96f';c.fillRect(p.x-r,p.y+r+5,r*2*p.hp/p.maxHp,4);}
}
export function updateStageBossHud(g){
 const active=!!g?.stageBoss&&g.state!=='lost'&&g.stageBoss.stages.phase!=='clear-pending',model=active?bossHudModel(g.stageBoss.stages.encounter):null;
 document.body.classList.toggle('stageboss-playing',active);
 const slot=document.getElementById('stageBossHud');slot.classList.toggle('hidden',!model);
 if(model){const en=getLocale()==='en';document.getElementById('stageBossTitle').textContent=(en?(BOSS_NAMES_EN[model.bossId]||model.name):model.name)+(g.stageBoss.defeatSequence?(en?' · BREAKING UP':' · 붕괴 중'):model.shielded?(en?' · ARMORED':' · 본체 보호'):'');document.getElementById('stageBossParts').textContent=(model.formationTotal?(en?'Formation ':'편대 생존 ')+model.formationAlive+'/'+model.formationTotal:(en?'Parts ':'부위 ')+model.aliveParts+'/'+model.totalParts)+' · '+Math.ceil(model.hp)+' / '+Math.round(model.maxHp);let hint=document.getElementById('stageBossTactic');if(!hint){hint=document.createElement('small');hint.id='stageBossTactic';slot.append(hint)}const tactic=bossTactic(g.stageBoss.stages.encounter,getLocale())+(g.londonBattle?'\n'+londonStatus(g,getLocale()):'');if(hint.textContent!==tactic)hint.textContent=tactic;const bar=document.getElementById('stageBossHp');bar.style.width=model.fraction*100+'%';slot.setAttribute('aria-valuenow',String(Math.ceil(model.hp)));slot.setAttribute('aria-valuemax',String(Math.round(model.maxHp)));}
 const coop=active&&g.mode==='coop2';document.getElementById('coopXpHud').classList.toggle('hidden',!coop);
 if(coop)for(const p of g.players){document.getElementById(p.id+'XpLabel').textContent=p.id.toUpperCase()+' · LV. '+p.level;document.getElementById(p.id+'XpBar').style.width=Math.min(100,p.xp/p.need*100)+'%';}
}
const buildingGroup=createLazyImageGroup({atlas:'./city-buildings107.webp?v=482'}),buildingArt=buildingGroup.images;
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
  else{const fade=Math.min(1,(h.duration-age)*2);c.setLineDash([]);for(let i=0;i<5;i++){const a=i*2.4,dist=h.radius*(.12+age*.13),x=h.x+Math.cos(a)*dist,y=h.y+Math.sin(a)*dist;bossSpriteFiltered(c,11,'brightness(.45)',x,y,h.radius*(.7+age*.35),h.radius*(.7+age*.35),a,fade*.8)}if(age<.3)pixelBlast(c,h.x,h.y,h.radius*(.65+age),age);}
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
 // Painted foam ring spreads from the foot — impact ring → rising column → spray.
 if(fxReady('foamRing')){const fq=clamp(age/Math.max(.6,h.height*.004),0,1);fx(c,'foamRing',h.x,bottom-px*2,h.width*(1.5+fq*2.2),h.width*(1.5+fq*2.2)*.36,0,(1-fq)*.55);}
}
export function drawStageBoss(c,g,W,H,{drawZeppelin,drawFieldArt,layer='all'}){
 const addon=g?.stageBoss;if(!addon||addon.ended)return;const z=g.camera?.zoom||1;
 c.save();c.translate(W/2,H/2);c.scale(z,z);c.translate(-g.x,-g.y);c.imageSmoothingEnabled=false;
 if(layer!=='hazards'){drawBossBuildings(c,g);drawLondonWorld(c,g,getLocale());}
 for(const body of addon.stages.encounter?.bodies.values()||[]){if(body.rail129&&layer!=='hazards'){const r=body.rail129;c.save();drawRailTrack(c,r,bossArt.parisGun);drawRailDamage(c,r,bossArt.parisGun);if(r.phase==='aim'&&r.target&&body.kind!=='fliegerzug'){const radius=body.kind==='lincomparable'?165:108;c.strokeStyle='#e6bb80';c.lineWidth=2;c.setLineDash([8,7]);c.beginPath();c.arc(r.target.x,r.target.y,radius,0,Math.PI*2);c.stroke();c.setLineDash([]);const a=Math.atan2(body.y-r.target.y,body.x-r.target.x);c.beginPath();c.moveTo(r.target.x+Math.cos(a)*radius,r.target.y+Math.sin(a)*radius);c.lineTo(r.target.x+Math.cos(a)*(radius+58),r.target.y+Math.sin(a)*(radius+58));c.stroke();}c.restore();}if(body.support129?.projectiles&&layer!=='bodies')drawSupportEffects(c,body.support129,{screenScale:z});}
 const ring=(x,y,r,color)=>{c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();};
 renderStageBossLayer(addon,{
  drawBody(b){if(layer==='hazards')return;
   if(b.assetKey==='gotha-raider'){drawGotha(c,b);return;}
   if(b.assetKey==='london-apron-raid'){drawLondonRaidApron(c,b);return;}
   if(b.assetKey==='sms-stuttgart'){const body=[...addon.stages.encounter.bodies.values()].find(v=>v.support129?.projectiles);if(body&&supportImages129.ship.naturalWidth&&supportImages129.cover.naturalWidth){
    const w0=b.destroying?Math.min(1,b.destructionAge/Math.max(.1,b.destructionDuration)):0;
    c.save();c.imageSmoothingEnabled=true;
    if(w0>0){c.translate(0,w0*260);c.rotate(w0*.3);c.globalAlpha*=Math.max(0,1-w0*.9);}
    drawSupportShip(c,b.destroying?{...body.support129,dead:false}:body.support129,supportImages129);
    c.restore();
    if(w0>0){const foam=sinkFoamArt.foam;
     if(foam?.naturalWidth){const f=Math.min(1,w0*1.3),fw=240+f*180,fh=fw*foam.naturalHeight/foam.naturalWidth;
      c.save();c.imageSmoothingEnabled=true;c.translate(b.x,b.y+60+w0*50);c.rotate(Math.sin(b.destructionAge*.7)*.08);
      c.globalAlpha=Math.min(1,w0*2)*Math.max(0,1-w0*.55);c.drawImage(foam,-fw/2,-fh/2,fw,fh);c.restore();}}
   }return;}
   c.save();const wreck=b.destroying?Math.min(1,b.destructionAge/Math.max(.1,b.destructionDuration)):0;
   const sinking=wreck>0&&(['sms-stuttgart','armored-harbor-fortress'].includes(b.assetKey)||b.assetKey.startsWith('hms-zubian'));
   c.translate(b.x+(wreck&&!sinking?Math.sin(b.destructionAge*43)*4:0),b.y+(wreck&&!sinking?Math.cos(b.destructionAge*37)*4:0));
   if(sinking){ // vessels list and submerge beneath the surface
    c.translate(0,wreck*260);
    c.rotate((b.assetKey==='armored-harbor-fortress'?-1:1)*wreck*.3);
    c.globalAlpha*=Math.max(0,1-wreck*.9);
   }
   const ship=b.assetKey.startsWith('hms-zubian')||b.assetKey==='sms-stuttgart',rail=['paris-gun','lincomparable','fliegerzug'].includes(b.assetKey),structure=['livens-flame-projector','minenwerfer-battery','treffas-wagen','morser-battery','staaken-rvi','london-searchlight'].includes(b.assetKey),plane=['jasta11-circus','naval10-black-flight'].includes(b.assetKey);
   if(ship){for(let i=0;i<12;i++){const drift=(b.motionTime*32+i*13)%155;c.fillStyle=i%2?'#d7f1de99':'#6eb9b777';const w=18+drift*.3;c.fillRect(-w/2,125+drift,w,4);}}

   // Churned-earth trail under the Treffas-Wagen, in world space before any scale.
   if(b.assetKey==='treffas-wagen'&&b.churn?.length){c.save();for(let i=0;i<b.churn.length;i++){const pt=b.churn[i],f=i/b.churn.length;c.globalAlpha=.1+f*.22;c.fillStyle='#33291d';for(const s of [-1,1]){c.beginPath();c.ellipse(pt.x-b.x+s*72,pt.y-b.y,36*(.6+f*.5),17*(.6+f*.4),0,0,Math.PI*2);c.fill();}}c.restore();}
   const trenchArmor=['a7v-flak','mark-v-cruiser'].includes(b.assetKey);
   if(trenchArmor)c.scale(b.geometryScale,b.geometryScale);
   else if(!rail&&!structure&&!plane){c.scale(2.025,2.025);c.translate(0,b.recoil*18);}
   if(b.recoil>0&&!structure&&!trenchArmor){pixelBlast(c,0,-100,24,b.motionTime);c.fillStyle='#d6d2b04d';c.fillRect(-13,-160,26,48);}
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
    if(b.phase==='cloud'){c.globalAlpha=.78;for(let i=0;i<8;i++)bossSprite(c,11,-165+i*47,-14+(i%3)*16,128,86);
     c.globalAlpha=.5;for(let i=0;i<5;i++)bossSprite(c,11,-140+i*70,34+(i%2)*14,96,62);}
    }else if(b.assetKey==='london-apron')drawBossArt(c,'londonApron',390,260);
    else if(b.assetKey==='drachen-net')drawBossArt(c,'drachenNet',315,250);
   else if(b.assetKey==='gik'||b.assetKey==='ca4'){drawBossArt(c,b.assetKey,b.assetKey==='gik'?300:330,b.assetKey==='gik'?235:250);}
   else if(b.assetKey==='livens-flame-projector'){
    if(trenchBossArt.livensBase.naturalWidth)drawLivens(c,b);
    else{const livensSrc=b.destroying?bakedImage(trenchBossArt.livensComposite,'grayscale(.72) brightness(.55)'):b.hp<=b.maxHp*.5?bakedImage(trenchBossArt.livensComposite,'saturate(.72) brightness(.82)'):null;
     if(!drawTrenchImage(c,livensSrc||trenchBossArt.livensComposite,0,0,520,390)){c.fillStyle='#383b30';c.fillRect(-250,-185,500,370);}}
   }
   else if(b.assetKey==='minenwerfer-battery'){
    drawMinenwerfer(c,b);
   }
   else if(trenchArmor)drawTrenchArmor(c,b);
   else if(b.assetKey==='armored-harbor-fortress'){
    const dead=id=>b.parts?.find(p=>p.id===id)?.destroyed,size=300;c.imageSmoothingEnabled=true;
    if(harborArt.base.naturalWidth)c.drawImage(harborArt.base,-size/2,-size/2,size,size);
    if(!dead('ammo-storage')&&harborArt.ammo.naturalWidth)c.drawImage(harborArt.ammo,-size/2,-size/2,size,size);
    if(!dead('seaplane-facility')&&harborArt.facility.naturalWidth)c.drawImage(harborArt.facility,-size/2,-size/2,size,size);
    if(!dead('crane-arm')&&harborArt.craneArm.naturalWidth){c.save();c.translate(-78,13);c.rotate(b.craneAngle);c.translate(78,-13);c.drawImage(harborArt.craneArm,-size/2,-size/2,size,size);c.restore();}
    if(!dead('crane-pivot')&&harborArt.cranePivot.naturalWidth)c.drawImage(harborArt.cranePivot,-size/2,-size/2,size,size);
    if(harborArt.guns.naturalWidth){const cw=harborArt.guns.naturalWidth/2,ch=harborArt.guns.naturalHeight/2;for(const [id,sx,x] of [['gun-left',0,-91],['gun-right',1,91]])if(!dead(id))c.drawImage(harborArt.guns,sx*cw,0,cw,ch,x-38,62-38,76,76);}
   }
   else if(b.assetKey==='treffas-wagen'){
    const partById=id=>b.parts?.find?.(p=>p.id===id)||b.parts?.get?.(id);
    // The assembled atlas reads as the actual vehicle; the cut-out parts looked
    // broken at this scale. Destroyed parts get a scorch patch + smoke instead.
    const atlas=null; // assemble from the independently destructible authored parts below
    const roll=Math.sin((b.wheelRoll||0)*9)*.04;
    if(atlas?.naturalWidth){
     const im=b.destroying?(bakedImage(atlas,'grayscale(.62) brightness(.52) sepia(.35)')||atlas):atlas;
     c.save();c.translate(0,10);c.rotate(roll);c.imageSmoothingEnabled=true;
     c.drawImage(im,-150,-200,300,400);c.restore();
    }else{
     const put=(key,x,y,w,h,rl=0,wrecked=false)=>{const im=wrecked?bakedImage(treffasArt[key],'grayscale(.62) brightness(.52) sepia(.35)')||treffasArt[key]:treffasArt[key];if(!(im?.naturalWidth||im?.width))return false;c.save();c.translate(x,y);c.rotate(rl);c.imageSmoothingEnabled=true;c.drawImage(im,-w/2,-h/2,w,h);c.restore();return true;};
     const wobble=Math.sin((b.wheelRoll||0)*9)*.05;
     for(const [id,key] of [['wheel-left','wheel'],['wheel-right','wheelR']]){const p=partById(id);if(!p)continue;
      put(key,p.x,p.y,72,168,wobble*(id==='wheel-left'?1:-1),p.destroyed||b.destroying);}
     put('hull',0,-18,100,150,0,b.destroying);
     const tp=partById('turret');if(tp)put('turret',tp.x,tp.y,62,92,0,tp.destroyed||b.destroying);
     const rp=partById('rudder');if(rp)put('tail',rp.x,rp.y,34,110,0,rp.destroyed||b.destroying);
    }
    // Per-part destruction: wreck sprite + smoke over the hit zone.
    if(!b.destroying)for(const [id,key,w,h] of [['wheel-left','wheel',64,120],['wheel-right','wheel',64,120],['turret','turret',52,86],['rudder','tail',30,84]]){const p=partById(id);if(!p?.destroyed)continue;
     const im=partWreckArt[key];if(im?.naturalWidth){c.save();c.translate(p.x,p.y);c.imageSmoothingEnabled=true;c.drawImage(im,-w/2,-h/2,w,h);c.restore();}
     for(let k=0;k<3;k++){const s=((b.motionTime||0)*.5+k*.33)%1;fx(c,'smokeDark',p.x+Math.sin(k*3.7)*17,p.y-s*54,30+s*44,30+s*44,0,(1-s)*.5);}}
   }
   else if(b.assetKey==='mark4-wedge'){
    const partById=id=>b.parts?.find?.(p=>p.id===id)||b.parts?.get?.(id);
    // Formation rocks as one body; track dust sells the crawl.
    const t=b.motionTime||0,rock=Math.sin(t*4.2)*.014;
    for(const [id,w,h] of [['tank-lead',120,200],['tank-left',120,200],['tank-right',120,200]]){
     const p=partById(id);if(!p)continue;
     const wreck=p.destroyed||b.destroying,im=wreck?bossArt.mark4Wreck||bossArt.mark4:bossArt.mark4;
     if(!im?.naturalWidth)continue;
     c.save();c.translate(p.x,p.y+Math.sin(t*4.2+(id==='tank-lead'?0:1.4))*2.2);c.rotate(rock);c.imageSmoothingEnabled=true;
     c.drawImage(im,-w/2,-h/2,w,h);c.restore();
     if(!wreck&&(t*3+id.length)%1<.5)fx(c,'dustPuff',p.x+(id==='tank-left'?-58:id==='tank-right'?58:(Math.sin(t*7)*55)),p.y+92,26+((t*3)%1)*20,26+((t*3)%1)*20,0,.32);
    }
   }
   else if(b.assetKey==='staaken-rvi'){
    const partById=id=>b.parts?.find?.(p=>p.id===id)||b.parts?.get?.(id);
    const im=b.destroying?(bossArt.staakenWreck||bossArt.staaken):bossArt.staaken;
    if(im?.naturalWidth){c.save();c.imageSmoothingEnabled=true;
     if(b.phase==='doomed')c.rotate(.06);
     c.drawImage(im,-190,-125,380,250);c.restore();}
    // Dead nacelles burn in place on the wing.
    if(!b.destroying)for(const id of ['eng-0','eng-1','eng-2','eng-3']){const p=partById(id);if(!p?.destroyed)continue;
     fx(c,'fireEngine',p.x,p.y-8,30,30,0,.8);
     for(let k=0;k<2;k++){const s=((b.motionTime||0)*.5+k*.5)%1;fx(c,'smokeDark',p.x+Math.sin(k*4.3)*12,p.y-16-s*56,22+s*36,22+s*36,0,(1-s)*.5);}}
   }
   else if(b.assetKey==='london-searchlight'){
    const partById=id=>b.parts?.find?.(p=>p.id===id)||b.parts?.get?.(id);
    const im=b.destroying?(bossArt.searchlightWreck||bossArt.searchlight):bossArt.searchlight;
    if(im?.naturalWidth){c.save();c.imageSmoothingEnabled=true;const wr=im.naturalHeight/im.naturalWidth,w=440,h=w*wr;c.drawImage(im,-w/2,-h/2,w,h);c.restore();}
    // Knocked-out positions get a wreck sprite + smoke over the composite art.
    if(!b.destroying)for(const id of ['light','gun','ammo']){const p=partById(id);if(!p?.destroyed)continue;
     const im=partWreckArt[id==='light'?'light':'gun'],r=p.radius||46;
     if(im?.naturalWidth){const w=r*1.5,h=w*im.naturalHeight/im.naturalWidth;c.save();c.translate(p.x,p.y);c.imageSmoothingEnabled=true;c.drawImage(im,-w/2,-h/2,w,h);c.restore();}
     for(let k=0;k<3;k++){const s=((b.motionTime||0)*.5+k*.33)%1;fx(c,'smokeDark',p.x+Math.sin(k*4.1)*22,p.y-24-s*64,24+s*38,24+s*38,0,(1-s)*.5);}}
   }
   else if(b.assetKey==='morser-battery'){
    const partById=id=>b.parts?.find?.(p=>p.id===id)||b.parts?.get?.(id);
    const gunIds=['gun-1','gun-2','gun-3'];
    const im=b.destroying?(bossArt.morserWreck||bossArt.morser):bossArt.morser;
    if(im?.naturalWidth){c.save();c.imageSmoothingEnabled=true;c.drawImage(im,-260,-236,520,472);c.restore();}
    // Dead pits get a wreck sprite + smoke so the battery visibly loses lanes.
    if(!b.destroying)for(const id of gunIds){const p=partById(id);if(!p?.destroyed)continue;
     const im=partWreckArt.pit;if(im?.naturalWidth){c.save();c.translate(p.x,p.y);c.imageSmoothingEnabled=true;c.drawImage(im,-48,-46,96,92);c.restore();}
     for(let k=0;k<3;k++){const s=((b.motionTime||0)*.5+k*.33)%1;fx(c,'smokeDark',p.x+Math.sin(k*4.1)*26,p.y-30-s*70,26+s*40,26+s*40,0,(1-s)*.5);}}
   }
   else if(plane){
    // Formation bosses fly painted aircraft sprites, not composite vehicles.
    const key=b.assetKey==='jasta11-circus'?'baron_albatros':'collishaw_sopwith';

    drawFormationBossRim(c,b.motionTime||0);
    planeSprite(c,0,0,(b.a??-Math.PI/2),key,1,true,false,b.hitFlash||0,b.hp<=b.maxHp*.5);
   }
   else drawBossArt(c,'markv',172,258);
   if(sinking){const foam=sinkFoamArt.foam;
    if(foam?.naturalWidth){const f=Math.min(1,wreck*1.3),fw=220+f*180,fh=fw*foam.naturalHeight/foam.naturalWidth;
     c.save();c.imageSmoothingEnabled=true;c.translate(0,60-wreck*210);c.rotate(Math.sin(b.destructionAge*.7)*.08);
     c.globalAlpha=Math.min(1,wreck*2)*Math.max(0,1-wreck*.55);c.drawImage(foam,-fw/2,-fh/2,fw,fh);c.restore();}}
   if(b.destroying&&!rail&&!structure&&!trenchArmor){c.globalAlpha=.2+.3*(1-wreck);c.fillStyle='#171c19';for(let i=0;i<18;i++)c.fillRect(-70+(i*29)%140,-105+(i*47)%210,18+(i%3)*6,14+(i%2)*8);}
   if(!b.coreVulnerable&&!b.destroying&&!structure&&!trenchArmor&&!b.assetKey.startsWith('hms-zubian')&&!['london-apron','drachen-net'].includes(b.assetKey))ring(0,0,76,'#bdd8df66');c.restore();
  },
  drawPart(p){if(layer==='hazards')return;
   if(p.kind==='engine'&&!p.hittable&&!p.destroyed)return;
   if(p.partId==='capsule'){c.strokeStyle='#a0aa9e';c.beginPath();const body=[...addon.stages.encounter.bodies.values()][0];c.moveTo(body.x,body.y+30);c.lineTo(p.x,p.y);c.stroke();}
   drawBossPart(c,p,ring,g?.t||0);
  },
   drawHazard(h){if(layer==='bodies')return;
    const warning=h.phase==='warning';c.save();
    if(h.visual==='aa-flak'){
     const q=clamp((h.age-h.delay)/Math.max(.01,h.warning),0,1);
     if(warning){if(h.sourceX!=null){
       if(q<.24)drawAADefense(c,'aaMuzzle',h.sourceX,h.sourceY,34,34,0,1-q);
       const sx=h.sourceX+(h.x-h.sourceX)*q,sy=h.sourceY+(h.y-h.sourceY)*q;
       fx(c,'shellHeavy',sx,sy-32*Math.sin(q*Math.PI),23,9,Math.atan2(h.y-h.sourceY,h.x-h.sourceX),.95);}
       c.strokeStyle='#bba97999';c.lineWidth=1.5;c.beginPath();c.arc(h.x,h.y,h.radius,0,Math.PI*2);c.stroke();}
     else{const age=h.age-h.delay-h.warning,frame=age<h.duration*.28?'aaFlakHot':age<h.duration*.65?'aaFlakDark':'aaFlakSmoke';
       drawAADefense(c,frame,h.x,h.y,h.radius*2.35,h.radius*2.35);}
     c.restore();return;
    }
   if(h.visual==='minenwerfer-heavy'||h.visual==='minenwerfer-shell'){
    const progress=clamp((h.age-h.delay)/Math.max(.01,h.warning),0,1);
    if(warning&&h.sourceX!=null){const x=h.sourceX+(h.x-h.sourceX)*progress,y=h.sourceY+(h.y-h.sourceY)*progress-Math.sin(progress*Math.PI)*80;fx(c,'shellHeavy',x,y,26,8,Math.atan2(h.y-h.sourceY,h.x-h.sourceX),.95)}
    if(!warning&&FX3){const age=Math.max(0,h.age-h.delay-h.warning),q=clamp(age/Math.max(.01,h.duration),0,.999),frame=Math.min(3,Math.floor(q*4)),size=Math.min(240,h.radius*2.5);if(fx(c,'mortarImpact'+frame,h.x,h.y,size,size,0,Math.min(1,(1-q)*3))){c.restore();return}}
    if(!warning){const img=impactArt.atlas;if(img.naturalWidth){const age=h.age-h.delay-h.warning,index=Math.min(3,Math.floor(age/.16)),cw=img.naturalWidth/2,ch=img.naturalHeight/2,size=h.radius*2.5;c.imageSmoothingEnabled=true;c.globalAlpha*=Math.min(1,Math.max(0,(h.duration-age)/.18));c.drawImage(img,(index%2)*cw,Math.floor(index/2)*ch,cw,ch,h.x-size/2,h.y-size/2,size,size);c.restore();return}}
   }
   c.strokeStyle=warning?'#ffdc81':'#ff8067';c.fillStyle=warning?'#ffdc812c':h.visual==='water-column'?'#75d8ea99':'#ef604f55';c.lineWidth=2;
   if(warning)c.setLineDash([6,5]);
   if(cityHazard(c,h,ring)){c.restore();return;}
   if(h.kind==='beam'){const x2=h.x+Math.cos(h.angle)*h.length,y2=h.y+Math.sin(h.angle)*h.length;
     if(h.visual==='apron-wire'){
      c.translate(h.x,h.y);c.rotate(h.angle);c.lineCap='round';c.setLineDash([]);
      if(h.sourceX!=null){const sx=h.sourceX-h.x,sy=h.sourceY-h.y;
       c.strokeStyle='#625c4fa6';c.lineWidth=1.6;c.beginPath();c.moveTo(sx,sy);c.lineTo(h.length*.5,0);c.stroke();}
     if(warning){c.strokeStyle='#e8c47f66';c.lineWidth=1.5;c.setLineDash([7,9]);c.beginPath();c.moveTo(0,0);c.lineTo(h.length,0);c.stroke();c.setLineDash([]);}
     else{
      // Heavy steel wire apron: dark twisted strands with sharp barbs.
      const sag=9,seg=Math.max(8,Math.round(h.length/40));
      for(const [lift,color,width] of [[-4.5,'#22292b',2.6],[-1.5,'#4a5652',1.6],[1.8,'#171d1f',2.4],[4.6,'#39444a',1.4]]){
       c.strokeStyle=color;c.lineWidth=width;c.beginPath();
       for(let i=0;i<=seg;i++){const px=i/seg*h.length,py=lift+Math.sin(i/seg*Math.PI)*sag;i?c.lineTo(px,py):c.moveTo(px,py)}c.stroke();}
      // Sharp barb knots alternating sides — dark metal, not glowing sparks.
       for(let d=25;d<h.length;d+=47)drawAADefense(c,'londonKnot',d,Math.sin(d/h.length*Math.PI)*sag,23,13);
      // Tension clamp collars where strands bind.
      for(let d=Math.max(40,h.length*.22);d<h.length;d+=h.length*.3){c.strokeStyle='#57635c';c.lineWidth=4.5;c.beginPath();c.moveTo(d,-7);c.lineTo(d,7);c.stroke();c.strokeStyle='#1a2123';c.lineWidth=2;c.beginPath();c.moveTo(d,-7);c.lineTo(d,7);c.stroke();}
     }
    }else if(h.visual==='livens-flame'){
     // Beam pivots at the turret mount; the continuous flame runs from the muzzle.
     const muzzle=h.muzzleLength||85,range=h.length-muzzle;
     if(warning){c.translate(h.x,h.y);c.rotate(h.angle);c.lineCap='round';
      const half=h.telegraphHalf||Math.atan((h.thickness*2.6)/range);
      c.fillStyle='#d2aa5a12';c.beginPath();c.moveTo(muzzle,0);c.arc(muzzle,0,range,-half,half);c.closePath();c.fill();
      c.strokeStyle='#e6bc77';c.lineWidth=1.5;c.setLineDash([7,6]);c.beginPath();c.moveTo(muzzle,0);c.arc(muzzle,0,range,-half,half);c.closePath();c.stroke();c.setLineDash([]);
      const prog=clamp((h.age-h.delay)/h.warning,0,1);
      c.strokeStyle='#f2d69b';c.beginPath();c.moveTo(muzzle,0);c.arc(muzzle,0,range*prog,-half,half);c.closePath();c.stroke();}
     else{const mx=h.x+Math.cos(h.angle)*muzzle,my=h.y+Math.sin(h.angle)*muzzle;
      drawLivensFlame(c,{...h,x:mx,y:my,length:Math.max(1,range)},{mobile:W<=560});}
    }else{c.lineCap='round';c.lineWidth=h.thickness;c.strokeStyle=warning?'#ffb45f44':'#ff6a2dcc';c.beginPath();c.moveTo(h.x,h.y);c.lineTo(x2,y2);c.stroke();c.lineWidth=Math.max(4,h.thickness*.34);c.strokeStyle=warning?'#ffe0a866':'#fff0a8';c.stroke();}}
   else if(h.kind==='searchlight'){if(fxReady('searchlight')&&!warning)fx(c,'searchlight',h.x+Math.cos(h.angle)*h.radius*.55,h.y+Math.sin(h.angle)*h.radius*.55,h.radius*1.3,h.radius*h.halfAngle*1.5,h.angle,.8);const glow=c.createRadialGradient(h.x,h.y,0,h.x,h.y,h.radius);glow.addColorStop(0,warning?'#f8e5a526':'#fff1bc4d');glow.addColorStop(.65,warning?'#ead18f0d':'#f3dfa621');glow.addColorStop(1,'#f3dfa600');c.fillStyle=glow;c.beginPath();c.moveTo(h.x,h.y);c.arc(h.x,h.y,h.radius,h.angle-h.halfAngle,h.angle+h.halfAngle);c.closePath();c.fill();if(warning){c.strokeStyle='#d9c89755';c.lineWidth=1;c.stroke();}}
   else if(h.kind==='rect'){
    if(h.visual==='water-column'){if(warning){c.fillRect(h.x-h.width/2,h.y-h.height/2,h.width,h.height);c.strokeRect(h.x-h.width/2,h.y-h.height/2,h.width,h.height);}else if(FX3&&fxReady('navalSplash3')){const q=clamp((h.age-h.delay-h.warning)/Math.max(.01,h.duration),0,1),d=Math.max(h.width,h.height)*1.25;fx(c,'navalSplash3',h.x,h.y,d,d,0,(1-q)*.8);fx(c,'navalFoam3',h.x,h.y,d*(.7+q*.65),d*(.7+q*.65),0,(1-q)*.55)}else if(!fx(c,'waterColumn',h.x,h.y,h.width*2.4,h.height*1.5,0,.95))drawWaterColumn(c,h);}
    else if(h.visual==='apron-net'||h.visual==='drachen-mine-net'){
     c.fillStyle=warning?'#e5c2761a':'#5d514544';c.fillRect(h.x-h.width/2,h.y-h.height/2,h.width,h.height);c.strokeStyle=warning?'#f2cf7c':'#b2aa91';c.lineWidth=warning?2:3;c.strokeRect(h.x-h.width/2,h.y-h.height/2,h.width,h.height);
     if(!warning){const step=h.visual==='apron-net'?28:52;c.lineWidth=1;c.strokeStyle='#b8b5a488';for(let x=h.x-h.width/2+step;x<h.x+h.width/2;x+=step){c.beginPath();c.moveTo(x,h.y-h.height/2);c.lineTo(x,h.y+h.height/2);c.stroke()}for(let y=h.y-h.height/2+step;y<h.y+h.height/2;y+=step){c.beginPath();c.moveTo(h.x-h.width/2,y);c.lineTo(h.x+h.width/2,y);c.stroke()}if(h.visual==='drachen-mine-net')for(let i=-3;i<=3;i++){const x=h.x+i*52,y=h.y+(Math.abs(i)%2?32:-24);if(!fx(c,'mine',x,y,34,34)){c.fillStyle='#5a554b';c.beginPath();c.arc(x,y,13,0,Math.PI*2);c.fill();c.strokeStyle='#d0a56e';for(let k=0;k<8;k++){const a=k*Math.PI/4;c.beginPath();c.moveTo(x+Math.cos(a)*11,y+Math.sin(a)*11);c.lineTo(x+Math.cos(a)*18,y+Math.sin(a)*18);c.stroke()}}}}
    }else if(h.visual==='gas-fire'){
     if(warning){// Hatched danger strip, not a plain box — same telegraph language as bomb zones.
      c.fillStyle='#d2aa5a14';c.fillRect(h.x-h.width/2,h.y-h.height/2,h.width,h.height);
      c.strokeStyle='#e6bc77';c.lineWidth=1.5;c.setLineDash([7,6]);c.strokeRect(h.x-h.width/2,h.y-h.height/2,h.width,h.height);c.setLineDash([]);
      c.strokeStyle='#e6bc7788';c.lineWidth=1;c.beginPath();
      for(let x=h.x-h.width/2;x<h.x+h.width/2;x+=18){c.moveTo(x,h.y-h.height/2);c.lineTo(x+9,h.y+h.height/2)}c.stroke();
      const prog=clamp((h.age-h.delay)/h.warning,0,1);
      c.strokeStyle='#f2d69b';c.lineWidth=2.5;c.strokeRect(h.x-h.width/2,h.y-h.height/2,h.width*prog,h.height);}
     else{const img=fxImage('flameJet'),vertical=h.height>h.width,w=vertical?h.height:h.width,height=vertical?h.width:h.height,lowDetail=(c.canvas?.width||999)<900;
      c.save();c.translate(h.x,h.y);if(vertical)c.rotate(Math.PI/2);
      c.fillStyle='#ef604f18';c.fillRect(-w/2,-height/2,w,height);
      if(img?.naturalWidth){const n=Math.min(lowDetail?6:10,Math.ceil(w/64)),jetLen=height*1.5,jetH=w/n*1.5;
       for(let i=0;i<n;i++){const x=-w/2+(i+.5)*w/n,wob=Math.sin(i*2.7+h.age*3)*4;
        c.save();c.translate(x,height/2+6);c.rotate(-Math.PI/2+wob*.012);
        c.globalAlpha=.92;c.drawImage(img,0,-jetH/2,jetLen,jetH);
        c.globalCompositeOperation='screen';c.globalAlpha=.5;c.drawImage(img,jetLen*.14,-jetH*.3,jetLen*.82,jetH*.6);
        c.restore();}
       const m=Math.min(lowDetail?3:6,Math.ceil(w/130));
       for(let i=0;i<m;i++){const x=-w/2+(i+.5)*w/m;fx(c,'smokeDark',x+Math.sin(i*3+h.age*2)*6,-height*.5,96,height*1.15,0,.42);}}
      else{const n=Math.min(lowDetail?12:20,Math.ceil(w/44));for(let i=0;i<n;i++){const x=-w/2+(i+.5)*w/n,wob=Math.sin(i*2.7+h.age*3)*5;
       if(!fx(c,'fire',x,8+wob*.4,54,height*.95,0,.92))bossSprite(c,12,x,0,36,height,0,.85);
       fx(c,'smokeDark',x,-height*.42+wob*.3,64,height*.9,0,.5);}}c.restore();}
    }else{c.fillRect(h.x-h.width/2,h.y-h.height/2,h.width,h.height);c.strokeRect(h.x-h.width/2,h.y-h.height/2,h.width,h.height);if(!warning){
     const n=Math.min(24,Math.ceil(h.width/38));for(let i=0;i<n;i++){const x=h.x-h.width/2+(i+.5)*h.width/n;bossSprite(c,15,x,h.y,36,Math.max(28,h.height*1.25),Math.PI/2,.85);}
    }}
   }
   else if(h.kind==='projectile'){
    if(h.visual==='torpedo-charge'){const a=Math.atan2(h.vy,h.vx),speed=Math.hypot(h.vx,h.vy),wake=Math.min(190,92+speed*.12),closing=Math.max(0,1-(h.life||0)/.32);c.save();c.translate(h.x,h.y);c.rotate(a);fx(c,'wakeFast',-wake*.46,0,wake*1.1,32,0,.5);c.globalAlpha=.38;c.strokeStyle='#d9eee9';c.lineCap='round';for(const side of [-1,1]){c.lineWidth=3;c.beginPath();c.moveTo(-12,side*9);c.bezierCurveTo(-wake*.34,side*(12+speed*.018),-wake*.72,side*(22+speed*.024),-wake,side*(34+speed*.02));c.stroke();c.globalAlpha=.22;c.lineWidth=8;c.beginPath();c.moveTo(-24,side*12);c.bezierCurveTo(-wake*.38,side*17,-wake*.78,side*29,-wake,side*40);c.stroke();c.globalAlpha=.38}c.globalAlpha=.48;if(!fx(c,'torpedo',0,0,64,20,0,.96)){c.fillStyle='#6e7f7d';c.beginPath();c.moveTo(26,0);c.quadraticCurveTo(10,-13,-23,-11);c.lineTo(-35,-6);c.lineTo(-35,6);c.quadraticCurveTo(8,14,26,0);c.fill();c.strokeStyle='#d8e0d3';c.lineWidth=1;c.stroke();}if(closing>0){c.globalAlpha=.28+.24*closing;c.strokeStyle='#eef5e8';c.lineWidth=2+closing*2;for(const side of [-1,1]){c.beginPath();c.moveTo(20,side*2);c.quadraticCurveTo(36,side*(8+closing*9),50+closing*15,side*(15+closing*12));c.stroke()}}c.restore();c.save();c.globalAlpha=.18;c.strokeStyle='#e6b37f';c.lineWidth=1;c.beginPath();c.arc(h.x,h.y,h.radius,-.62,.62);c.stroke();c.restore();}
    else if(h.visual==='building-debris')bossSprite(c,10,h.x,h.y,h.radius*3.4,h.radius*3.4,Math.atan2(h.vy,h.vx)+Math.PI/2);
    else if(h.visual==='treffas-debris'){const idx=[...(h.id||'x')].reduce((n,ch)=>n+ch.charCodeAt(0),0)%6;if(!fx(c,'rockChunk'+idx,h.x,h.y,h.radius*2.6,h.radius*2.6,Math.atan2(h.vy,h.vx),.95))drawEnemyProjectile(c,{enemy:true,life:1,visualType:'boss',vx:h.vx,vy:h.vy},h.x,h.y,0,z);}
     else if(h.visual==='armor-tracer')fx(c,'tracerOrange',h.x,h.y,34,6,Math.atan2(h.vy,h.vx),.95);
     else if(h.visual==='aa-shell')fx(c,'shellHeavy',h.x,h.y,24,8,Math.atan2(h.vy,h.vx),.95);
     else drawEnemyProjectile(c,{enemy:true,life:1,visualType:'boss',vx:h.vx,vy:h.vy},h.x,h.y,0,z);
   }
   else{if(!warning&&(h.visual==='livens-leak'||h.visual==='livens-pressure')){
     drawBattlefieldFire(c,{t:h.age,fireZones:[{x:h.x,y:h.y,radius:h.radius,life:Math.max(0,h.delay+h.warning+h.duration-h.age)}]});
    }else{c.beginPath();c.arc(h.x,h.y,h.radius,0,Math.PI*2);c.fill();c.stroke();}if(warning){const progress=clamp((h.age-h.delay)/h.warning,0,1);c.setLineDash([]);ring(h.x,h.y,h.radius*(1-progress),'#ffe6a5');c.beginPath();c.moveTo(h.x-8,h.y);c.lineTo(h.x+8,h.y);c.moveTo(h.x,h.y-8);c.lineTo(h.x,h.y+8);c.stroke();
     if(h.visual==='rail-shell'||h.visual==='observer-shell'){c.lineWidth=4;for(const q of [.62,.82,1])ring(h.x,h.y,h.radius*q,q===1?'#ff765e':'#ffd18499');c.fillStyle='#fff0bd';c.font='bold 13px monospace';c.textAlign='center';c.fillText(h.visual==='observer-shell'?'관측 포격':'열차포 낙탄',h.x,h.y-h.radius-12);}
     if(h.visual==='carpet-bomb'){const bs=h.airborneBomb?28+progress*12:26+progress*46,bx=h.airborneBomb?h.sourceX+(h.x-h.sourceX)*progress:h.x,by=h.airborneBomb?h.sourceY+(h.y-h.sourceY)*progress-Math.sin(progress*Math.PI)*24:h.y-h.radius*.85*(1-progress)-24;c.globalAlpha=.9;fx(c,'bomb',bx,by,bs,bs*.55,Math.PI/2);c.globalAlpha=1;}}
    else if(h.visual==='zubian-mortar'){for(const q of [.45,.72,1])ring(h.x,h.y,h.radius*q,q===1?'#e9c083':'#8bd0d199');pixelBlast(c,h.x,h.y,h.radius*.65,h.age,true);}
   }
   c.restore();
  }
  });
  if(layer!=='bodies')for(const effect of g.aaEffects||[])
    drawAADefense(c,effect.kind,effect.x,effect.y,effect.size||115,effect.size||115,0,Math.max(0,1-effect.age/effect.life));
  if(layer!=='bodies')for(const cue of g.bossCues){c.strokeStyle='#ffce80';c.setLineDash([8,6]);c.beginPath();c.moveTo(cue.x,cue.y);c.lineTo(cue.targetX,cue.targetY);c.stroke();c.setLineDash([]);}
 c.restore();
 if(layer==='bodies')return;for(const b of addon.stages.encounter?.bodies.values()||[]){if(b.dead)continue;const hull=LARGE_HULLS[b.kind]||{halfWidth:0,halfHeight:0},sx=(b.x-g.x)*z+W/2,sy=(b.y-g.y)*z+H/2,hx=hull.halfWidth*z,hy=hull.halfHeight*z;const visW=Math.min(sx+hx,W-30)-Math.max(sx-hx,30),visH=Math.min(sy+hy,H-100)-Math.max(sy-hy,190),frac=(Math.max(0,visW)*Math.max(0,visH))/(Math.max(1,4*hx*hy)||1),formation=FORMATION_BOSS_KEYS.has(b.kind);if(frac>.45){if(formation)drawFormationNameplate(c,sx,sy-54*z,b.callSign,W);continue;}const x=clamp(sx,26,W-26),y=clamp(sy,190,H-100),a=Math.atan2(b.y-g.y,b.x-g.x);if(formation){drawFormationEdgeBadge(c,x,y,a);continue;}c.save();c.translate(x,y);c.rotate(a);c.fillStyle='#ffcd7c';c.beginPath();c.moveTo(12,0);c.lineTo(-7,-7);c.lineTo(-7,7);c.fill();c.restore();}
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

let skyCloud113;
export function paintSky(c,cx,cy,W,H){
 c.fillStyle='#607c89';c.fillRect(0,0,W,H);
 const partAtlas=partArt.atlas;if(!partAtlas.naturalWidth)return;
 if(!skyCloud113){skyCloud113=document.createElement('canvas');skyCloud113.width=skyCloud113.height=128;const q=skyCloud113.getContext('2d');q.imageSmoothingEnabled=false;const w=partAtlas.naturalWidth/4,h=partAtlas.naturalHeight/4;q.drawImage(partAtlas,3*w,2*h,w,h,0,0,128,128);q.globalCompositeOperation='source-in';q.fillStyle='#d3dedd';q.fillRect(0,0,128,128);}
 c.save();c.imageSmoothingEnabled=false;
 for(const layer of [0,1]){const tile=layer?440:620,parallax=layer?.35:.16,px=cx*parallax,py=cy*parallax,sx=Math.floor(px/tile)-1,sy=Math.floor(py/tile)-1;
  for(let ix=sx;ix<(px+W)/tile+1;ix++)for(let iy=sy;iy<(py+H)/tile+1;iy++){const seed=Math.abs(Math.sin(ix*12.7+iy*37.3+layer)*437.4)%1,x=ix*tile-px+seed*80,y=iy*tile-py+seed*100,w=tile*(.65+seed*.35);c.globalAlpha=layer?.24:.13;const cloudIm=skyCloud113;c.drawImage(cloudIm,x,y,w,w*.55);c.drawImage(cloudIm,x+w*.36,y-w*.08,w*.75,w*.45);}
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


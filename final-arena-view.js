import {getLocale} from './i18n.js?v=09c75d146ae4289d';
import {outlineZeroSectorAircraft} from './zero-sector-aircraft.js?v=09c75d146ae4289d';
import {drawFormationEdgeBadge} from './tactical-marks.js?v=09c75d146ae4289d';
import {finalArenaBosses} from './pandemonium-registry.js?v=09c75d146ae4289d';
import {drawBoss as drawAsymmetric,loadAssets as loadAsymmetric,profile as asymmetricProfile} from './pandemonium-a-render.js?v=09c75d146ae4289d';
import {drawBoss as drawFactory,loadAssets as loadFactory,profile as factoryProfile} from './pandemonium-factory-render.js?v=09c75d146ae4289d';
import {drawFortress,loadFortressArt} from './fortress-render.js?v=09c75d146ae4289d';
import {drawFortressModules,drawFortressCombatWorld} from './fortress-systems-render.js?v=09c75d146ae4289d';
import {fx as sharedFX} from './fx-art.js?v=09c75d146ae4289d';
import {fx as fortressFX,fxArtReady as fortressFXReady} from './combat-fx196.js?v=09c75d146ae4289d';
const fx=(...args)=>fortressFX(...args)||sharedFX(...args);

// Rendering uses world coordinates shared with the host. No simulation is stepped here.
export const FINAL_ARENA_WORLD_SIZE=2600;
const ROOT=new URL('./asset-bank/zero-district/',import.meta.url);
const FORTRESS_ROOT=new URL('./asset-bank/moving-fortress/manifest.json',import.meta.url).href;
export const FINAL_ARENA_CUTINS=Object.freeze({mobile:'./asset-bank/moving-fortress/cutin.webp',asymmetric:'./asset-bank/zero-district/pandemonium-asymmetric-cutin.webp',factory:'./asset-bank/zero-district/pandemonium-factory-cutin.webp'});
let assets=null,pending=null,error=null,retryAt=0,attempt=0;
export const finalArenaAssetsReady=()=>!!assets;
export const finalArenaAssetStatus=()=>({ready:!!assets,loading:!!pending,error:error?.message||null,retryAt});
export const finalArenaVisible=g=>!!g?.finalArena&&['entry','battle','victory'].includes(g.finalArena.phase);
const image=url=>new Promise((resolve,reject)=>{const im=new Image(),timer=setTimeout(()=>{im.onload=im.onerror=null;reject(Error('Image timeout'));},20000);im.crossOrigin='anonymous';im.decoding='async';im.onload=async()=>{clearTimeout(timer);try{await im.decode();resolve(im)}catch(e){reject(e)}};im.onerror=()=>{clearTimeout(timer);reject(Error('Image unavailable'))};im.src=url;});
export function prepareFinalArenaAssets({retry=false}={}){
 if(assets)return Promise.resolve(assets);if(pending)return pending;
 if(error&&!retry&&Date.now()<retryAt)return Promise.reject(error);
 let deadline;pending=Promise.race([(async()=>{await fortressFXReady;const response=await fetch(new URL('manifest.json',ROOT));if(!response.ok)throw Error('Zero Sector manifest unavailable');const manifest=await response.json();const files=[manifest.terrain,...manifest.objects.map(p=>p.file)];const [fortress,loaded,combat,cutins,seal,asymmetric,factory]=await Promise.all([loadFortressArt(FORTRESS_ROOT),Promise.all([...new Set(files)].map(async file=>[file,await image(new URL(file,ROOT).href)])),Promise.all(Object.entries({aircraft:new URL('junkers-d1.webp',ROOT).href,drone:new URL('./boss-cambrai-bug-20261021.webp',import.meta.url).href,flame2:new URL('./fx-flame-tongue-2.webp',import.meta.url).href,flame3:new URL('./fx-flame-tongue-3.webp',import.meta.url).href,drachen:new URL('./boss-drachen-parts-v2.webp',import.meta.url).href}).map(async([k,url])=>[k,k==='aircraft'?outlineZeroSectorAircraft(await image(url)):await image(url)])),Promise.all(Object.entries(FINAL_ARENA_CUTINS).map(async([id,file])=>[id,await image(new URL(file,import.meta.url).href)])),image(new URL('secret-seal.png',ROOT).href),loadAsymmetric(),loadFactory()]);return{manifest,images:Object.fromEntries(loaded),fortress,asymmetric,factory,combat:Object.fromEntries(combat),cutins:Object.fromEntries(cutins),seal};})(),new Promise((_,reject)=>{deadline=setTimeout(()=>reject(Error('Final arena asset timeout')),30000);})]).then(loaded=>{assets=loaded;error=null;attempt=0;return assets}).catch(e=>{error=e;retryAt=Date.now()+Math.min(15000,1500*2**Math.min(attempt++,4));throw e}).finally(()=>{clearTimeout(deadline);pending=null});return pending;
}
// Called outside draw from the frame loop. Every session gets its own readiness flag.
export function serviceFinalArenaAssets(g){
 if(!g)return;
 const route=g.stageBoss?.stages?.finalArena;
 if(!finalArenaVisible(g)&&route?.phase!=='pending'&&!g.finalArenaPrewarm)return;
 g.finalArenaAssetsReady=!!assets;g.finalArenaAssetsError=error?.message||null;
 if(!assets&&!pending&&Date.now()>=retryAt)prepareFinalArenaAssets({retry:true}).then(()=>{g.finalArenaAssetsReady=true;g.finalArenaAssetsError=null},e=>{g.finalArenaAssetsReady=false;g.finalArenaAssetsError=e.message});
}
export function drawFinalArenaTerrain(c,g,cx,cy,W,H){
 if(!finalArenaVisible(g))return false;
 c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.fillStyle='#292c29';c.fillRect(0,0,W,H);
 if(assets){const n=FINAL_ARENA_WORLD_SIZE;c.translate(W/2-cx,H/2-cy);c.drawImage(assets.images[assets.manifest.terrain],-n/2,-n/2,n,n);for(const p of assets.manifest.objects){const im=assets.images[p.file];c.drawImage(im,(p.x-p.width/2)*.5,(p.y-p.height/2)*.5,p.width*.5,p.height*.5);}}
 c.restore();return true;
}
const FORMS=Object.freeze({mobile:{index:0,label:'기동형',worldScale:.5,maxHp:100},asymmetric:{index:1,label:'항공갑판형',worldScale:asymmetricProfile.worldScale,maxHp:300},factory:{index:2,label:'이동 군수공장',worldScale:factoryProfile.worldScale,maxHp:2000}});
// Pure presentation contract: authoring coordinates are converted exactly once.
export function finalArenaFormView(a){
 const variant=a?.variant||a?.fortress?.variant||'mobile',form=FORMS[variant];if(!form)return null;
 const s=a?.fortress,parts=s?.parts||(s?.systems?.zones||[]).concat(s?.crawlers||[]),max=s?.maxCoreHp||s?.parts?.find(p=>p.id==='core')?.maxHp||form.maxHp,hp=Math.max(0,Number.isFinite(s?.coreHp)?s.coreHp:0);
 const index=Number.isInteger(a?.formIndex)?Math.max(0,Math.min(2,a.formIndex)):form.index;
 return {...form,index,variant,hp,maxHp:max,hpRatio:Math.min(1,hp/max),destroyed:parts.filter(p=>p.hp<=0).length,partCount:parts.length,first:index===0};
}
export function drawFinalArenaBoss(c,g,W,H,{layer='body',scale=g?.mode==='coop2'?(g.camera?.zoom||1):1}={}){
 if(!finalArenaVisible(g)||!assets)return false;let drawn=false;
 for(const boss of finalArenaBosses(g.finalArena)){
  if(!boss.fortress||boss.active===false)continue;
  const form=finalArenaFormView(boss);if(!form)continue;
  const s=boss.fortress,k=form.worldScale,camera={x:g.x/k,y:g.y/k},options={camera,width:W,height:H,scale:scale*k};
  c.save();c.globalAlpha*=boss.defeated?1:Math.min(1,(boss.elapsed??1)/.35);
  if(form.variant!=='mobile')(form.variant==='asymmetric'?drawAsymmetric:drawFactory)(c,s,assets[form.variant],{...options,layer});
  else if(layer==='body')drawFortress(c,s,assets.fortress,{...options,paintFX:fx,drawModules:(c,s,a)=>drawFortressModules(c,s,a,assets.combat)});
  else if(layer==='hazards'){c.translate(W/2,H/2);c.scale(options.scale,options.scale);c.translate(-camera.x,-camera.y);drawFortressCombatWorld(c,s,assets.combat,fx,options.scale,{hidePlayer:true,hideFriendly:true});}
  c.restore();drawn=true;
 }
 return drawn;
}
function drawArenaEntry(c,a,W,H){
 const t=a.elapsed||0,mobile=W<600,x=W-24,y=H-(mobile?166:48);
 c.save();c.globalAlpha*=Math.max(0,Math.min(1,t/.2,(2.2-t)/.35));c.textAlign='right';
 c.font=`bold ${mobile?22:30}px sans-serif`;c.lineWidth=4;c.strokeStyle='#111710';c.fillStyle='#eee4ca';
 c.strokeText('제로구역',x,y,W-48);c.fillText('제로구역',x,y,W-48);
 c.font='12px sans-serif';c.lineWidth=3;c.strokeText('잿빛 의회 비밀병기공장',x,y+26,W-48);c.fillStyle='#d0c4ac';c.fillText('잿빛 의회 비밀병기공장',x,y+26,W-48);c.restore();
}
// One arrival portrait per independent boss, using the authoritative shared clock.
export function finalArenaArrivalView(a){
 if(a?.phase!=='battle'||!Number.isFinite(a.elapsed))return null;
 for(const boss of finalArenaBosses(a)){
  const variant=boss.variant||boss.id,age=a.elapsed-(boss.arrivesAt||0),form=FORMS[variant];
  if(!form||boss.active!==true||boss.defeated||boss.fortress?.coreHp<=0||age<0||age>=2.6)continue;
  return{boss,variant,label:form.label,age,alpha:Math.max(0,Math.min(1,age/.065,(2.6-age)/.18))};
 }
 return null;
}
// The application presents arrivals through the existing bossCutin DOM/CSS.
export function finalArenaHudModel(g){
 const a=g?.finalArena;if(!a||a.phase==='entry')return null;const bosses=finalArenaBosses(a);if(!bosses.length)return null;
 const forms=bosses.map(finalArenaFormView),fraction=forms.reduce((n,f)=>n+(f?.hpRatio||0),0)/bosses.length;
 return{fraction,hp:fraction*8000*bosses.length*(a.hpScale||1),maxHp:8000*bosses.length*(a.hpScale||1),
  active:bosses.filter(b=>b.active&&!b.defeated).length,broken:forms.reduce((n,f)=>n+(f?.destroyed||0),0),total:forms.reduce((n,f)=>n+(f?.partCount||0),0),
  detail:bosses.map((b,i)=>`${forms[i]?.label||b.id} ${b.defeated?'격파':!b.active?'대기':Math.ceil(forms[i].hpRatio*100)+'%'}`).join(' · ')};
}
export function drawFinalArenaHud(c,g,W,H){
 if(!finalArenaVisible(g))return;
 const en=getLocale()==='en';c.save();c.textAlign='center';c.textBaseline='middle';
 if(!assets){c.fillStyle='#121b20e8';c.fillRect(12,H*.37,W-24,96);c.fillStyle='#eee5d0';c.font='bold 15px sans-serif';c.fillText(error?(en?'Could not load Zero Sector.':'제로구역을 불러오지 못했습니다.'):(en?'Preparing to enter Zero Sector…':'제로구역 진입 준비 중…'),W/2,H*.37+32);c.font='12px sans-serif';c.fillText(error?(en?'Trying again shortly':'잠시 후 다시 불러옵니다'):(en?'Preparing the battlefield before combat':'전투 시작 전에 전장을 준비합니다'),W/2,H*.37+62);c.restore();return;}
 if(g.finalArena.waitingForAssets){c.fillStyle='#121b20e8';c.fillRect(12,H*.37,W-24,96);c.fillStyle='#eee5d0';c.font='bold 13px sans-serif';c.fillText(en?'Waiting for your teammate to prepare':'동료의 전장 준비를 기다리는 중…',W/2,H*.37+34);c.font='12px sans-serif';c.fillText(en?'Combat begins when everyone is ready':'모두 준비되면 전투를 시작합니다',W/2,H*.37+62);c.restore();return;}
 const a=g.finalArena;
 if(a.phase==='entry'){drawArenaEntry(c,a,W,H);c.restore();return;}
 const bosses=finalArenaBosses(a);
 if(a.phase==='battle')for(const boss of bosses){
  if(boss.active===false||boss.defeated)continue;const f=finalArenaFormView(boss),z=g.mode==='coop2'?(g.camera?.zoom||1):1,dx=boss.fortress.x*f.worldScale-g.x,dy=boss.fortress.y*f.worldScale-g.y,sx=W/2+dx*z,sy=H/2+dy*z;
  if(sx>=26&&sx<=W-26&&sy>=190&&sy<=H-100)continue;
  const bx=Math.max(26,Math.min(W-26,sx)),by=Math.max(190,Math.min(H-100,sy));drawFormationEdgeBadge(c,bx,by,Math.atan2(dy,dx));
  c.font='bold 10px sans-serif';c.fillStyle='#f0d7a4';c.textAlign=bx<W/2?'left':'right';c.fillText(f.label,bx+(bx<W/2?26:-26),by);
 }
 c.restore();
}

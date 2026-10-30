import {drawBoss as drawAsymmetric,loadAssets as loadAsymmetric,profile as asymmetricProfile} from './pandemonium-a-render.js';
import {drawBoss as drawFactory,loadAssets as loadFactory,profile as factoryProfile} from './pandemonium-factory-render.js';
import {drawFortress,loadFortressArt} from './fortress-render.js';
import {drawFortressModules,drawFortressCombatWorld} from './fortress-systems-render.js';
import {fx as sharedFX} from './fx-art.js?v=tame3';
import {fx as fortressFX,fxArtReady as fortressFXReady} from './combat-fx196.js';
const fx=(...args)=>fortressFX(...args)||sharedFX(...args);

// Rendering uses world coordinates shared with the host. No simulation is stepped here.
export const FINAL_ARENA_WORLD_SIZE=2600;
const ROOT=new URL('./asset-bank/zero-district/',import.meta.url);
const FORTRESS_ROOT=new URL('./asset-bank/moving-fortress/manifest.json',import.meta.url).href;
let assets=null,pending=null,error=null,retryAt=0,attempt=0;
export const finalArenaAssetsReady=()=>!!assets;
export const finalArenaAssetStatus=()=>({ready:!!assets,loading:!!pending,error:error?.message||null,retryAt});
export const finalArenaVisible=g=>!!g?.finalArena&&['entry','battle','victory'].includes(g.finalArena.phase);
const image=url=>new Promise((resolve,reject)=>{const im=new Image(),timer=setTimeout(()=>{im.onload=im.onerror=null;reject(Error('Image timeout'));},20000);im.crossOrigin='anonymous';im.decoding='async';im.onload=async()=>{clearTimeout(timer);try{await im.decode();resolve(im)}catch(e){reject(e)}};im.onerror=()=>{clearTimeout(timer);reject(Error('Image unavailable'))};im.src=url;});
export function prepareFinalArenaAssets({retry=false}={}){
 if(assets)return Promise.resolve(assets);if(pending)return pending;
 if(error&&!retry&&Date.now()<retryAt)return Promise.reject(error);
 let deadline;pending=Promise.race([(async()=>{await fortressFXReady;const response=await fetch(new URL('manifest.json',ROOT));if(!response.ok)throw Error('Zero Sector manifest unavailable');const manifest=await response.json();const files=[manifest.terrain,...manifest.objects.map(p=>p.file)];const [fortress,loaded,combat,cutin,seal,asymmetric,factory]=await Promise.all([loadFortressArt(FORTRESS_ROOT),Promise.all([...new Set(files)].map(async file=>[file,await image(new URL(file,ROOT).href)])),Promise.all(Object.entries({aircraft:new URL('junkers-d1.webp',ROOT).href,drone:new URL('./boss-cambrai-bug-20261021.webp',import.meta.url).href,flame2:new URL('./fx-flame-tongue-2.webp',import.meta.url).href,flame3:new URL('./fx-flame-tongue-3.webp',import.meta.url).href,drachen:new URL('./boss-drachen-parts-v2.webp',import.meta.url).href}).map(async([k,url])=>[k,await image(url)])),image(new URL('./asset-bank/moving-fortress/cutin.webp',import.meta.url).href),image(new URL('secret-seal.png',ROOT).href),loadAsymmetric(),loadFactory()]);return{manifest,images:Object.fromEntries(loaded),fortress,asymmetric,factory,combat:Object.fromEntries(combat),cutin,seal};})(),new Promise((_,reject)=>{deadline=setTimeout(()=>reject(Error('Final arena asset timeout')),30000);})]).then(loaded=>{assets=loaded;error=null;attempt=0;return assets}).catch(e=>{error=e;retryAt=Date.now()+Math.min(15000,1500*2**Math.min(attempt++,4));throw e}).finally(()=>{clearTimeout(deadline);pending=null});return pending;
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
const FORMS=Object.freeze({mobile:{index:0,label:'기동형 · 돌파 병기',worldScale:.5,maxHp:100},asymmetric:{index:1,label:'A형 · 장거리 출격 요새',worldScale:asymmetricProfile.worldScale,maxHp:300},factory:{index:2,label:'공장형 · 이동 군수공장',worldScale:factoryProfile.worldScale,maxHp:2000}});
// Pure presentation contract: authoring coordinates are converted exactly once.
export function finalArenaFormView(a){
 const variant=a?.variant||a?.fortress?.variant||'mobile',form=FORMS[variant];if(!form)return null;
 const s=a?.fortress,parts=s?.parts||(s?.systems?.zones||[]).concat(s?.crawlers||[]),max=s?.maxCoreHp||s?.parts?.find(p=>p.id==='core')?.maxHp||form.maxHp,hp=Math.max(0,Number.isFinite(s?.coreHp)?s.coreHp:0);
 const index=Number.isInteger(a?.formIndex)?Math.max(0,Math.min(2,a.formIndex)):form.index;
 return {...form,index,variant,hp,maxHp:max,hpRatio:Math.min(1,hp/max),destroyed:parts.filter(p=>p.hp<=0).length,partCount:parts.length,first:index===0};
}
export function drawFinalArenaBoss(c,g,W,H,{layer='body',scale=g?.mode==='coop2'?(g.camera?.zoom||1):1}={}){
 if(!finalArenaVisible(g)||!assets||!g.finalArena.fortress)return false;
 const form=finalArenaFormView(g.finalArena);if(!form)return false;
 const s=g.finalArena.fortress,k=form.worldScale,camera={x:g.x/k,y:g.y/k},options={camera,width:W,height:H,scale:scale*k};
 if(form.variant!=='mobile'){
  (form.variant==='asymmetric'?drawAsymmetric:drawFactory)(c,s,assets[form.variant],{...options,layer});
  return true;
 }
 if(layer==='body')drawFortress(c,s,assets.fortress,{...options,paintFX:fx,drawModules:(c,s,a)=>drawFortressModules(c,s,a,assets.combat)});
 else if(layer==='hazards'){c.save();c.translate(W/2,H/2);c.scale(options.scale,options.scale);c.translate(-camera.x,-camera.y);drawFortressCombatWorld(c,s,assets.combat,fx,options.scale,{hidePlayer:true,hideFriendly:true});c.restore();}
 return true;
}
export function drawFinalArenaHud(c,g,W,H){
 if(!finalArenaVisible(g))return;
 c.save();c.textAlign='center';c.textBaseline='middle';
 if(!assets){c.fillStyle='#121b20e8';c.fillRect(12,H*.37,W-24,96);c.fillStyle='#eee5d0';c.font='bold 15px sans-serif';c.fillText(error?'제로구역 원화 로드 실패 · 자동 재시도':'제로구역 원화 준비 중…',W/2,H*.37+32);c.font='12px sans-serif';c.fillText(error?'잠시 후 다시 불러옵니다':'전투 시작 전에 시설과 병기를 준비합니다',W/2,H*.37+62);c.restore();return;}
 if(g.finalArena.waitingForAssets){c.fillStyle='#121b20e8';c.fillRect(12,H*.37,W-24,96);c.fillStyle='#eee5d0';c.font='bold 13px sans-serif';c.fillText('다른 플레이어의 최종맵 준비를 기다리는 중',W/2,H*.37+34);c.font='12px sans-serif';c.fillText('모두 준비되면 안전하게 전투를 시작합니다',W/2,H*.37+62);c.restore();return;}
 const a=g.finalArena,s=a.fortress,form=finalArenaFormView(a);if(!form){c.restore();return;}const hp=form.hp,max=form.maxHp;
 const bw=Math.min(420,W-32),x=(W-bw)/2,y=H<600?52:62;c.fillStyle='#101719df';c.fillRect(x,y,bw,49);c.font='bold 12px sans-serif';c.fillStyle='#ece0c5';c.fillText(a.phase==='victory'?'판데모니움 무력화':`${form.index+1}/3 · ${form.label}`,W/2,y+12);c.fillStyle='#594238';c.fillRect(x+8,y+25,bw-16,4);c.fillStyle='#c49b67';c.fillRect(x+8,y+25,(bw-16)*form.hpRatio,4);
 c.font='11px sans-serif';c.fillStyle='#c9c1ad';c.fillText(`부위 파괴 ${form.destroyed}/${form.partCount}${form.variant==='factory'?(s?.coreExposed?' · 핵심 노출':' · 핵심 차폐'):''}`,W/2,y+39);
 if(a.phase==='entry'&&!form.first){const t=a.elapsed||0,alpha=Math.max(0,Math.min(1,t/.25,(2.5-t)/.4));c.globalAlpha=alpha;c.fillStyle='#101719e8';c.fillRect(12,H*.42-36,W-24,86);c.fillStyle='#eee5cf';c.font=`bold ${W<500?18:26}px sans-serif`;c.fillText(form.label,W/2,H*.42);c.font='12px sans-serif';c.fillText(`${form.index+1}/3 · 다음 전투 단계`,W/2,H*.42+28);c.globalAlpha=1;}
 // Center emblem has a deterministic 3 s timeline shared by co-op snapshots.
 if(a.phase==='entry'&&form.first&&(a.elapsed||0)<3){const t=a.elapsed||0,alpha=Math.max(0,Math.min(1,t/.6,(3-t)/1)),size=Math.min(180,W*.38,H*.25);c.globalAlpha=alpha;c.fillStyle='#080f12bb';c.fillRect(0,0,W,H);c.drawImage(assets.seal,W/2-size/2,H/2-size/2-24,size,size);c.fillStyle='#eee5cf';c.font=`bold ${W<500?26:36}px sans-serif`;c.fillText('제로구역 · 최후의 전장',W/2,H/2+size/2+13);c.font='13px sans-serif';c.fillText('잿빛의회 · 비밀병기공장',W/2,H/2+size/2+43);c.globalAlpha=1;}
 // Entry card follows the host phase/clock; it never pauses or controls gameplay.
 if(a.phase==='entry'&&form.first&&(a.elapsed||0)>=3&&(a.elapsed||0)<5){const cw=Math.min(W-28,520),ch=Math.min(H*.36,230),cy=H*.42;c.fillStyle='#101719ed';c.fillRect((W-cw)/2,cy-ch/2,cw,ch);const im=assets.cutin,k=Math.min(cw*.62/im.naturalWidth,(ch-28)/im.naturalHeight),iw=im.naturalWidth*k,ih=im.naturalHeight*k;c.drawImage(im,(W-cw)/2+8,cy-ih/2,iw,ih);c.fillStyle='#e8ddc6';c.font=`bold ${W<500?16:23}px sans-serif`;c.fillText('판데모니움',W/2+cw*.22,cy-10);c.font='12px sans-serif';c.fillText('제로구역 최종병기',W/2+cw*.22,cy+20);}
 c.restore();
}


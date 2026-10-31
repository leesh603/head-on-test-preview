import {drawFormationEdgeBadge} from './tactical-marks.js?v=tame3';
import {finalArenaBosses} from './pandemonium-registry.js';
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
export const FINAL_ARENA_CUTINS=Object.freeze({mobile:'./asset-bank/moving-fortress/cutin.webp',asymmetric:'./asset-bank/zero-district/pandemonium-asymmetric-cutin.webp',factory:'./asset-bank/zero-district/pandemonium-factory-cutin.webp'});
let assets=null,pending=null,error=null,retryAt=0,attempt=0;
export const finalArenaAssetsReady=()=>!!assets;
export const finalArenaAssetStatus=()=>({ready:!!assets,loading:!!pending,error:error?.message||null,retryAt});
export const finalArenaVisible=g=>!!g?.finalArena&&['entry','battle','victory'].includes(g.finalArena.phase);
const image=url=>new Promise((resolve,reject)=>{const im=new Image(),timer=setTimeout(()=>{im.onload=im.onerror=null;reject(Error('Image timeout'));},20000);im.crossOrigin='anonymous';im.decoding='async';im.onload=async()=>{clearTimeout(timer);try{await im.decode();resolve(im)}catch(e){reject(e)}};im.onerror=()=>{clearTimeout(timer);reject(Error('Image unavailable'))};im.src=url;});
export function prepareFinalArenaAssets({retry=false}={}){
 if(assets)return Promise.resolve(assets);if(pending)return pending;
 if(error&&!retry&&Date.now()<retryAt)return Promise.reject(error);
 let deadline;pending=Promise.race([(async()=>{await fortressFXReady;const response=await fetch(new URL('manifest.json',ROOT));if(!response.ok)throw Error('Zero Sector manifest unavailable');const manifest=await response.json();const files=[manifest.terrain,...manifest.objects.map(p=>p.file)];const [fortress,loaded,combat,cutins,seal,asymmetric,factory]=await Promise.all([loadFortressArt(FORTRESS_ROOT),Promise.all([...new Set(files)].map(async file=>[file,await image(new URL(file,ROOT).href)])),Promise.all(Object.entries({aircraft:new URL('junkers-d1.webp',ROOT).href,drone:new URL('./boss-cambrai-bug-20261021.webp',import.meta.url).href,flame2:new URL('./fx-flame-tongue-2.webp',import.meta.url).href,flame3:new URL('./fx-flame-tongue-3.webp',import.meta.url).href,drachen:new URL('./boss-drachen-parts-v2.webp',import.meta.url).href}).map(async([k,url])=>[k,await image(url)])),Promise.all(Object.entries(FINAL_ARENA_CUTINS).map(async([id,file])=>[id,await image(new URL(file,import.meta.url).href)])),image(new URL('secret-seal.png',ROOT).href),loadAsymmetric(),loadFactory()]);return{manifest,images:Object.fromEntries(loaded),fortress,asymmetric,factory,combat:Object.fromEntries(combat),cutins:Object.fromEntries(cutins),seal};})(),new Promise((_,reject)=>{deadline=setTimeout(()=>reject(Error('Final arena asset timeout')),30000);})]).then(loaded=>{assets=loaded;error=null;attempt=0;return assets}).catch(e=>{error=e;retryAt=Date.now()+Math.min(15000,1500*2**Math.min(attempt++,4));throw e}).finally(()=>{clearTimeout(deadline);pending=null});return pending;
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
 const t=a.elapsed||0,im=assets.images[assets.manifest.terrain];
 c.fillStyle='#080d0e';c.fillRect(0,0,W,H);
 const pad=W<600?12:Math.max(24,W*.05),height=Math.min(H,(W-pad*2)*im.naturalHeight/im.naturalWidth),width=height*im.naturalWidth/im.naturalHeight;
 c.globalAlpha=Math.min(1,Math.max(0,t/.22));c.drawImage(im,(W-width)/2,(H-height)/2,width,height);c.globalAlpha=1;
 const y=Math.min(H-105,H*.72),font=W<600?28:42;
 c.fillStyle='#080d0ed9';c.fillRect(0,y-24,W,H-y+24);c.fillStyle='#c6a76d';c.font='12px sans-serif';c.fillText('잿빛의회 · 비밀병기공장',W/2,y);
 c.fillStyle='#eee4ca';c.font=`bold ${font}px sans-serif`;c.fillText('제로구역 · 최후의 전장',W/2,y+38);
 c.fillStyle='#d0c4ac';c.font=`${W<600?12:15}px sans-serif`;c.fillText('비밀병기공장 침투',W/2,y+72);
 const size=Math.min(72,W*.16);c.drawImage(assets.seal,W/2-size/2,Math.max(24,y-size-38),size,size);
}
// One arrival portrait per independent boss, using the authoritative shared clock.
export function finalArenaArrivalView(a){
 if(a?.phase!=='battle'||!Number.isFinite(a.elapsed))return null;
 for(const boss of finalArenaBosses(a)){
  const variant=boss.variant||boss.id,age=a.elapsed-(boss.arrivesAt||0),form=FORMS[variant];
  if(!form||boss.active!==true||boss.defeated||boss.fortress?.coreHp<=0||age<0||age>=.72)continue;
  return{boss,variant,label:form.label,age,alpha:Math.max(0,Math.min(1,age/.065,(.72-age)/.09))};
 }
 return null;
}
function drawArenaArrival(c,a,W,H){
 const arrival=finalArenaArrivalView(a);if(!arrival)return;
 const im=assets.cutins[arrival.variant],mobile=W<600,cw=Math.min(W-24,980),ch=Math.min(H*.5,400),x=(W-cw)/2,y=(H-ch)/2;
 const boxW=mobile?cw-24:cw*.68,boxH=mobile?ch-84:ch-24,k=Math.min(boxW/im.naturalWidth,boxH/im.naturalHeight),iw=im.naturalWidth*k,ih=im.naturalHeight*k;
 c.save();c.globalAlpha*=arrival.alpha;c.fillStyle='#101719ed';c.fillRect(x,y,cw,ch);
 c.drawImage(im,x+12+(boxW-iw)/2,y+12+(boxH-ih)/2,iw,ih);
 const tx=mobile?W/2:x+cw*.83,ty=mobile?y+ch-53:y+ch*.44;
 c.textAlign='center';c.fillStyle='#e8ddc6';c.font=`bold ${mobile?21:30}px sans-serif`;c.fillText('판데모니움',tx,ty);
 c.fillStyle='#c6a76d';c.font=`bold ${mobile?14:18}px sans-serif`;c.fillText(arrival.label,tx,ty+30);c.restore();
}
export function drawFinalArenaHud(c,g,W,H){
 if(!finalArenaVisible(g))return;
 c.save();c.textAlign='center';c.textBaseline='middle';
 if(!assets){c.fillStyle='#121b20e8';c.fillRect(12,H*.37,W-24,96);c.fillStyle='#eee5d0';c.font='bold 15px sans-serif';c.fillText(error?'제로구역 원화 로드 실패 · 자동 재시도':'제로구역 원화 준비 중…',W/2,H*.37+32);c.font='12px sans-serif';c.fillText(error?'잠시 후 다시 불러옵니다':'전투 시작 전에 시설과 병기를 준비합니다',W/2,H*.37+62);c.restore();return;}
 if(g.finalArena.waitingForAssets){c.fillStyle='#121b20e8';c.fillRect(12,H*.37,W-24,96);c.fillStyle='#eee5d0';c.font='bold 13px sans-serif';c.fillText('다른 플레이어의 최종맵 준비를 기다리는 중',W/2,H*.37+34);c.font='12px sans-serif';c.fillText('모두 준비되면 안전하게 전투를 시작합니다',W/2,H*.37+62);c.restore();return;}
 const a=g.finalArena;
 if(a.phase==='entry'){drawArenaEntry(c,a,W,H);c.restore();return;}
 const bosses=finalArenaBosses(a),bw=Math.min(440,W-32),x=(W-bw)/2,y=H<600?48:60;
 c.fillStyle='#101719e8';c.fillRect(x,y,bw,24+bosses.length*27);c.fillStyle='#ece0c5';c.font='bold 12px sans-serif';
 c.fillText(a.phase==='victory'?'판데모니움 격파':`판데모니움 · ${bosses.filter(b=>b.active&&!b.defeated).length}기 교전`,W/2,y+12);
 for(const [i,boss] of bosses.entries()){
  const f=finalArenaFormView(boss);if(!f)continue;const row=y+30+i*27;
  c.textAlign='left';c.fillStyle=boss.defeated?'#9d9b8c':'#e5dbc2';c.font='11px sans-serif';c.fillText(f.label,x+10,row);
  c.textAlign='right';c.fillStyle='#baae95';c.fillText(boss.defeated?'격파':boss.active===false?'진입 대기':f.variant==='factory'?(boss.fortress.coreExposed?'핵심 노출':'핵심 차폐'):'교전 중',x+bw-10,row);
  c.fillStyle='#594238';c.fillRect(x+10,row+8,bw-20,4);c.fillStyle=boss.defeated?'#6f7267':'#c49b67';c.fillRect(x+10,row+8,(bw-20)*f.hpRatio,4);
 }
 if(a.phase==='battle')for(const boss of bosses){
  if(boss.active===false||boss.defeated)continue;const f=finalArenaFormView(boss),z=g.mode==='coop2'?(g.camera?.zoom||1):1,dx=boss.fortress.x*f.worldScale-g.x,dy=boss.fortress.y*f.worldScale-g.y,sx=W/2+dx*z,sy=H/2+dy*z;
  if(sx>=26&&sx<=W-26&&sy>=190&&sy<=H-100)continue;
  const bx=Math.max(26,Math.min(W-26,sx)),by=Math.max(190,Math.min(H-100,sy));drawFormationEdgeBadge(c,bx,by,Math.atan2(dy,dx));
  c.font='bold 10px sans-serif';c.fillStyle='#f0d7a4';c.textAlign=bx<W/2?'left':'right';c.fillText(f.label,bx+(bx<W/2?26:-26),by);
 }
 if(a.phase==='battle')drawArenaArrival(c,a,W,H);
 c.restore();
}

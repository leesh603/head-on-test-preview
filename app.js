import {hangarArt,hangarArtSource,hangarKeyFile} from './hangar-art.js?v=ui5';
import {bossCutinSource} from './boss-cutin-art.js?v=ui5';
import {applySeaColor} from './sea-colors.js?v=ui5';
import {drawGroundEnemy} from './ground-enemy-art.js?v=ui5';
import {pilotIdentityCopy} from './pilot-identity-copy.js';
import {drawHeineckeParachute,heineckeRemaining,HEINECKE} from './heinecke-rettungsfallschirm.js?v=ui5';
import {drawAircraftCrash,enemyCrashScale} from './aircraft-crash.js?v=ui5';
import {paintVerdun} from './verdun-art.js?v=ui5';
import {paintGallipoli,prepareGallipoliAssets} from './gallipoli-view.js?v=ui5';
import {createGallipoliRoute,gallipoliPoint,GALLIPOLI_ROUTE} from './gallipoli-route.js?v=ui5';
import {paintMaan,prepareMaanAssets} from './maan-view.js?v=ui5';
import {drawRegionalBug} from './regional-boss-view352.js?v=ui5';
import {drawGust3} from './atmosphere-role3.js?v=ui5';
import {drawGrenade,drawGrenadeBlast,drawAmatolBlast,drawFxExplosion} from './weapon-effects156.js?v=ui5';
import {fx,fxReady,fxTint,FX56,clearFxTintCache,fxArtReady} from './fx-art.js?v=ui5';
import {drawAADefense,drawDrachenMine,prepareAADefenseAssets} from './aa-defense-art.js?v=ui5';
import {CATEGORIES,categoryName,reinforcementName,buildStats,heldStats,cumulativeText,cleanDescription} from './reinforcement-ui151.js?v=ui5';
import {t,getLocale,setLocale,subscribe,initLocale,applyTranslations,rarityName,upgradeDescription as translatedUpgradeDescription,pilotName,aircraftName,weaponName,activeName,passiveName,pilotDescription,passiveDescription,aircraftRole,airframeHistory,airframeTip} from './i18n.js?v=ui5';
import {GamepadInput} from './gamepad-input.js?v=ui5';
installEventTextEN(Game,CoopGame,CampaignGame);registerEventPilots(PILOTS);
const fieldRecordLink=document.createElement('a');fieldRecordLink.href='./field-record.html';fieldRecordLink.target='_blank';fieldRecordLink.rel='noopener';fieldRecordLink.textContent=getLocale()==='en'?'Official Battle Record':'공식 전장 기록';fieldRecordLink.className='field-record-link';fieldRecordLink.style.cssText='display:block;margin:10px auto 0;text-align:center;color:#d7b26d;font-weight:800;text-decoration:none';document.getElementById('start')?.after(fieldRecordLink);
import {drawPilotSignatureFront,drawMccuddenSupply} from './pilot-signature-view.js?v=ui5';
import {paintJutland,prepareJutlandAssets} from './jutland-view.js?v=ui5';
import {createJutlandRoute,jutlandPoint,JUTLAND_ROUTE} from './jutland-route.js?v=ui5';
import {playerPose,applyPlayerAttitude,drawPlayerAura,drawPetalParticle,drawRedGhosts162} from './player-effects129.js?v=ui5';
import {drawStageBoss,updateStageBossHud,paintCity,paintSky,prepareStageBossAssets} from './stageboss-view.js?v=ui5&rail=1&hints=1';
import {paintParis} from './paris-night-art.js?v=ui5';
import {enableStageBoss,stageBossBounds,harborBankOffset,harborRouteHalfWidth} from './stageboss-host.js?v=ui5&rail=1&hints=1';
import {chooseTransitionTip,transitionRegionLabel} from './transition-tips188.js?v=ui5';
import './hud-layout94.js?v=ui5';
import {showBattlefieldEvent,hideBattlefieldEvent} from './battlefield-event-ui.js?v=ui5';
import {installOnlineLobby} from './online-coop-session.js';
import {CoopGame,coopPlane,COOP_BALANCE} from './coop-engine.js?v=ui5';
import {CoopInput,coopRecord,saveCoopLocal,COOP_RECORD_KEYS} from './coop-input.js?v=ui5';
import {drawCoop} from './coop-view.js?v=ui5';
import {drawSunStrike} from './sun-strike71.js?v=ui5';
import {drawEnemyProjectile,drawCannonProjectile,drawBattlefieldFire,friendlyTracerColor} from './projectiles.js?v=ui5';
import {installFlightViewport} from './flight-viewport.js?v=ui5';
import {aircraftFeelRatings,representativeArchetypeKey} from './aircraft-feel174.js?v=ui5';
import {aircraftCombatRole,aircraftGrowthCost} from './aircraft-combat-roles.js?v=ui5';
import {drawEnemyDanger} from './enemy-danger-view.js?v=ui5';
import {drawGas} from './gas-view.js?v=ui5';
import {drawWarAmbience} from './war-ambience.js?v=ui5';
import {missionNavigation,drawMissionRadar} from './navigation.js?v=ui5';
import {drawBattlefieldSprite,drawBattlefieldSpriteShadowed,battlefieldArtReady,fieldUnitsReady} from './battlefield-art.js?v=ui5';
import {CampaignGame,STAGES,stageFaction,historicalAircraft,sortieAircraft,liveryVariant} from './campaign.js?v=ui5';
import {drawCampaign} from './campaign-view.js?v=ui5';
import {campaignArtReady} from './aircraft.js?v=ui5';
import {drawGameIcon,drawSpecialAmmoIcon,iconsReady,hangarIconsReady} from './icons.js?v=ui5';
import {BattleMusic,musicContextForGame,musicModeForGame} from './music.js?v=ui5';
import {sfx,setSfxMuted,setSfxPaused,stopSfx} from './sfx.js?v=ui5&rail=2';
import {attachCombatFeedback,combatVisualPose,drawCombatFeedback,combatCameraOffset,combatFlightSound} from './combat-feedback.js?v=ui5';
import {installEventTextEN,registerEventPilots,unitNameEN} from './event-text-en.js?v=ui5';
import {drawHeadOnFeedback} from './engagement-feedback.js?v=ui5';
import {drawTailEngagement} from './engagement-hud410.js?v=ui5';
import {portraitSources,portraitsReady,portraitLoaded} from './portraits.js?v=ui5';
import {BOSS_CATALOG} from './headon-stageboss-patterns.js?v=ui5';
import {bossTactic,bossPhaseLabel,BOSS_NAMES_EN} from './boss-feedback.js?v=ui5&rail=1&hints=1';
import {drawEquipment} from './equipment.js?v=ui5';
import {installHeadOnElitePatch,createEliteAssets,renderEliteLayer} from './elite-patch/module/index.js?v=ui5';
import{planeSprite,aircraftReady,aircraftKey,hangarArtReady,paintedReady}from './aircraft.js?v=ui5';
import{Game,PLANES,PILOTS,UPGRADES,WEAPONS,PILOT_PLANES,upgradeDescription,pilotLoadout,pilotAircraftName,TAILING_BALANCE,SPECIAL_AMMO,enemyAircraftScale,LEGENDARY_DEFENSE_BALANCE,LEGENDARY_BALANCE}from './engine.js?v=ui5';
import {AUGMENTATION_OVERHAUL_BALANCE}from'./augmentation-overhaul150.js?v=ui5';
import {drawCloudCover}from'./cloud-cover1.js?v=ui5';
import {drawFleetLayer}from'./fleet-naval1.js?v=ui5';
import {drawTrenchLayer}from'./trench-war1.js?v=ui5';
import {drawCityAirLayer}from'./city-air1.js?v=ui5';
import {TerrainRenderer,MountainField,applyTerrainAtmosphere,preloadTerrainProfile,terrainProfilesReady} from './alps-terrain117.js?v=ui5';
import {FXS,fxsTracer,fxsBombFall,fxsBoomTail} from './fx-sample-preview.js?v=ui5';
import {drawPassiveFx,drawPassiveFxFront} from './passive-fx.js?v=ui5';

const flightViewport=installFlightViewport(document,window);
const ententeAirshipSprite=new Image();ententeAirshipSprite.src='./zeppelin-entente.webp?v=ui5&b=326';
const zeppelinSprite=new Image();zeppelinSprite.src='./zeppelin.webp?v=ui5&b=326';const ballCloudSprite=new Image();ballCloudSprite.src='./fx-ball-cloud.webp?v=ui5&b=326';
const globalZeppelinSprite=zeppelinSprite;
const TRANSPARENT_PORTRAIT='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
const eliteAssets=createEliteAssets({
 lePrieur:'./elite-patch/assets/le-prieur-squadron.webp?v=ui5&b=eliterim1',
 schlachtstaffel:'./elite-patch/assets/halberstadt-cliv-squadron.webp?v=ui5&b=eliterim1',
 junkers:'./elite-patch/assets/junkers-j1-squadron.webp?v=ui5',
 salamander:'./elite-patch/assets/salamander-squadron.webp?v=ui5',
 drawPlayerRocket:(c,x,y,angle,size)=>{if(!fx(c,'rocket',x,y,size,size*.3,angle-Math.PI/2))drawEquipment(c,'rocket',x,y,angle,size)}
});
const DIR_PLAY_PATTERNS=new Set(['RECOVERY','ELITE_FORMATION']);
installHeadOnElitePatch(Game,{
 planes:PLANES,
 isPlaying:g=>g.state==='playing'&&!g.mode&&(!g.directorMobSpawnsSuppressed?.()||DIR_PLAY_PATTERNS.has(g.battleDirectorPattern)||g.eliteEnemies?.active),
 getPlayer:g=>g,
 getPlayerFaction:g=>PLANES[g.plane]?.faction,
 getEnemies:g=>g.enemies,
 getFriendlyProjectiles:g=>g.bullets,
 isAceActive:g=>g.enemies.some(e=>e.hp>0&&(e.bossPilot||e.type==='boss')),
 secondsUntilAce:g=>Number.isFinite(g.nextBossAt)?g.nextBossAt-g.t:Infinity,
 getProgressStage:g=>Math.floor(Math.max(0,g.distance||0)/12000)+1,
 getNormalStats:(g,seconds)=>{
  const candidates=g.enemies.filter(e=>e.hp>0&&!e.ace&&!e.bossPilot&&!e.heavyBomber&&!e.surface&&!e.stationary&&['scout','hunter'].includes(e.type));
  const hp=candidates.length?candidates.map(e=>e.maxHp||e.hp).sort((a,b)=>a-b)[Math.floor(candidates.length/2)]:42*(1+Math.min(1.2,seconds/600));
  return{hp,damage:Math.round(9*(1+seconds/240)),speed:104*(1+seconds/700)};
 },
 getAceStats:(g,seconds)=>{
  const ace=g.enemies.find(e=>e.hp>0&&(e.bossPilot||e.type==='boss'));
  return{hp:ace?.maxHp||Math.round(700*(1+seconds/150)),damage:Math.round(28*(1+seconds/300))};
 },
 damagePlayer:(g,damage)=>g.hit(damage),
 emitWarning:(g,text)=>g.event('eliteWarn',text),
 playSound:(g,cue)=>{const map={eliteApproachFast:'formationPass',eliteApproachHeavy:'formationPass',eliteRocket:'heavyShot',eliteRearGun:'enemyShot',eliteGunfire:'enemyShot'};const s=map[cue];if(s)g.event('bossSound',s)},
 getEliteHitRadius:m=>m.eliteKind==='junkers_squadron'?30:m.eliteKind==='salamander_squadron'?26:undefined,
 onEliteImpact:(g,member)=>{const armored=member.eliteKind==='junkers_squadron'||member.eliteKind==='salamander_squadron';if(armored){g.event('armorImpact','');g.burst(member.x,member.y,'#d8e6ff',9)}else{g.event('impact','');g.burst(member.x,member.y,'#ffe0a0',7)}},
 onEliteKilled:(g,detail)=>{
  g.kills=(g.kills||0)+1;g.eliteKills=(g.eliteKills||0)+1;
  g.burst(detail.x,detail.y,'#f2aa52',26);for(let i=0;i<4;i++)g.smoke(detail.x+(g.rng()-.5)*14,detail.y+(g.rng()-.5)*14,true);
  g.event('kill','');g.drops.push({x:detail.x,y:detail.y,value:Math.round(detail.rewardMultiplier),heal:false,elite:true});
 }
});
const $=id=>document.getElementById(id);
// Per-frame HUD writers: skip DOM writes whose value is unchanged (same DOM, no style/layout invalidation).
const __txt=(el,v)=>{v=String(v);if(el.textContent!==v)el.textContent=v},__attr=(el,k,v)=>{v=String(v);if(el.getAttribute(k)!==v)el.setAttribute(k,v)},__data=(el,k,v)=>{v=String(v);if(el.dataset[k]!==v)el.dataset[k]=v};const transitionAssetPrep=region=>{const jobs=[];try{jobs.push(preloadTerrainProfile(terrainKeys[region]))}catch(_){}if(typeof prepareStageBossAssets==='function')jobs.push(Promise.resolve(prepareStageBossAssets(region)));return Promise.all(jobs).catch(()=>{})};const transitionTipPick=(region,locale,excludeId)=>typeof chooseTransitionTip==='function'?chooseTransitionTip(region,locale,Math.random,excludeId):{id:'',text:''};const transitionLabelPick=(region,locale,fallback)=>typeof transitionRegionLabel==='function'?transitionRegionLabel(region,locale,fallback):fallback;const canvas=$('game'),ctx=canvas.getContext('2d');let W=600,H=500,game=null,plane='fokker',pilot='baron',faction='central',keys={},joy=null,muted=true,sfxOff=false,bgmOff=false,audio=null,last=0,ambient=0,toastUntil=0,choices=[],lastFocus=null,cutinUntil=0,lastImpactSound=0,lastShotSound=0,lastPickupSound=0;const choiceIconRefs=[];function clearChoiceIconRefs(){choiceIconRefs.length=0}let regionTransitionUntil=0,regionTransitionAssetsReady=true,lastTransitionTipId='',regionTransitionSerial=0,renderStamp=-1e9;const mobileDisplay=window.matchMedia('(max-width:720px), (pointer:coarse) and (max-height:600px)').matches;let hiFpsMode=false;try{hiFpsMode=localStorage.getItem('headon.hiFps')==='1'}catch(_){}window.addEventListener('headon:hifps',e=>{hiFpsMode=e.detail===true});let batterySaver=false;try{batterySaver=localStorage.getItem('headon.saver')==='1'}catch(_){}let userZoom=1;try{userZoom=Math.min(1.4,Math.max(.8,parseFloat(localStorage.getItem('headon.zoom'))||1))}catch(_){}const KEYBIND_DEFAULTS={evade:'Space',skill:'KeyE',reload:'KeyR'},KEYBINDS={...KEYBIND_DEFAULTS};try{Object.assign(KEYBINDS,JSON.parse(localStorage.getItem('headon.keybinds')||'{}'))}catch(_){}const BIND_ACTIONS=['evade','skill','reload'];let capturingBind=null;const keyLabel=code=>({Space:'SPACE',Escape:'ESC',Backspace:'BACKSPACE',Tab:'TAB',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',ShiftLeft:'LSHIFT',ShiftRight:'RSHIFT',ControlLeft:'LCTRL',ControlRight:'RCTRL',AltLeft:'LALT',AltRight:'RALT'}[code]||code.replace(/^(Key|Digit|Numpad)/,''));let renderScale=1,__perfEma=0,__perfChecks=0,__perfUp=0,__perfResize=false;const __perfFrame=ms=>{if(!game||game.state!=='playing'||regionTransitionUntil>0){__perfEma=0;__perfChecks=0;__perfUp=0;return}__perfEma=__perfEma?__perfEma+(ms-__perfEma)*.1:ms;if(++__perfChecks<90)return;__perfChecks=0;if(__perfEma>14.5&&renderScale>.55){renderScale=Math.max(.55,+(renderScale*.82).toFixed(3));__perfUp=0;__perfResize=true}else if(__perfEma<9&&renderScale<1){if(++__perfUp>=3){renderScale=Math.min(1,+(renderScale*1.12).toFixed(3));__perfUp=0;__perfResize=true}}else __perfUp=0};
function resetRegionTransition(){regionTransitionSerial++;regionTransitionUntil=0;regionTransitionAssetsReady=true;show('regionTransition',false);clearChoiceIconRefs();clearFxTintCache();stopSfx();setSfxPaused(false)}
const regionTransition=document.createElement('div');regionTransition.id='regionTransition';regionTransition.className='region-transition hidden';regionTransition.innerHTML='<div class="region-transition-card"><small class="region-transition-kicker">FRONT LINE TRANSITION</small><strong id="regionTransitionName"></strong><span id="regionTransitionStatus" class="region-transition-status"></span><div class="region-transition-progress" aria-hidden="true"><i></i></div><div class="region-transition-tip"><b>TIP</b><span id="regionTransitionTip"></span></div></div>';$('viewport').append(regionTransition);function beginRegionTransition(label,region){const serial=++regionTransitionSerial;clearChoiceIconRefs();clearFxTintCache();stopSfx();setSfxPaused(true);keys={};joy=null;coopInput.reset();gamepadInput.reset();const locale=getLocale(),tip=transitionTipPick(region,locale,lastTransitionTipId);lastTransitionTipId=tip.id;$('regionTransitionName').textContent=transitionLabelPick(region,locale,label||'새 전장');$('regionTransitionStatus').textContent=locale==='en'?'Preparing next battlefield…':'다음 전장 준비 중…';$('regionTransitionTip').textContent=tip.text;regionTransitionUntil=performance.now()+2000;regionTransitionAssetsReady=false;show('regionTransition',true);if(game){game.particles.length=Math.min(game.particles.length,120);game.bullets=game.bullets.filter(b=>b.life>0)}transitionAssetPrep(region).catch(()=>{}).finally(()=>{if(serial===regionTransitionSerial)regionTransitionAssetsReady=true})}let best=0,nickname='';try{const rankingVersion='340';if(localStorage.getItem('headon-ranking-version')!==rankingVersion){for(const key of ['headon-priority-best-71','headon-priority-best-161','headon-ranking','headon-priority-ranking-71','headon-priority-ranking-161','headon-coop2-best-v1','headon-coop2-ranking-v1','headon-coop2-best-v2','headon-coop2-ranking-v2'])localStorage.removeItem(key);localStorage.setItem('headon-ranking-version',rankingVersion)}best=0}catch{}initLocale();$('record').textContent=t('record.best',{score:String(best).padStart(3,'0')});
const sortieVeil=document.createElement('div');sortieVeil.id='sortieVeil';sortieVeil.className='hidden';sortieVeil.innerHTML='<div class="sv-card"><small>SORTIE</small><strong id="sortieVeilTitle">출격</strong><span id="sortieVeilStatus"></span><i class="sv-bar" aria-hidden="true"><em></em></i></div>';document.body.append(sortieVeil);
let bossArrivalUntil=0;let bossCardFrom=0;let bossCutinUntil=0;let lastStageBossId='';
const coopInput=new CoopInput(),coopAvailable=!window.matchMedia('(pointer:coarse)').matches;
let coopTestOverride=false;
const gamepadInput=new GamepadInput(globalThis.navigator);
const syncGamepadUi=mode=>document.body.classList.toggle('gamepad-active',mode==='gamepad');
window.addEventListener('gamepadconnected',e=>gamepadInput.connect(e.gamepad));
window.addEventListener('gamepaddisconnected',e=>{gamepadInput.disconnect(e.gamepad);syncGamepadUi('keyboard')});
let coopPilot2='voss';const coopCutinEnds={p1:0,p2:0};
const coopRelicSignatures={p1:'',p2:''};let coopToastUntil=0;
const CAMPAIGN_ENABLED=false;
let selectedMode='endless',selectedStageId='C-01',freeSortie=false,campaignRecords=[],campaignLoadState='loading';
function normalizeSelectedMode(){if(!CAMPAIGN_ENABLED&&selectedMode==='campaign')selectedMode='endless'}
function sound(f=400,d=.06,type='square',vol=.035){if(muted||sfxOff)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();let o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(f,audio.currentTime);o.frequency.exponentialRampToValueAtTime(f*.45,audio.currentTime+d);g.gain.setValueAtTime(vol,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g);g.connect(audio.destination);o.onended=()=>{try{o.disconnect();g.disconnect()}catch{}};o.start();o.stop(audio.currentTime+d)}catch{}}
const _baseSound=sound;sound=(f,d,type,vol)=>_baseSound(f*(.94+Math.random()*.12),d,type,(vol??.035)*7.4);
const music=new BattleMusic();
function stopBgm(){music.setScene(null,true)}
function setBgmMode(mode){music.setScene(mode==='idle'?null:musicContextForGame(game),muted||bgmOff)}
function applyAudioPrefs(){setSfxMuted(muted||sfxOff);setBgmMode(musicModeForGame(game))}
// Audio begins only after the player presses a start/control button, but is
// enabled by default so the sortie has its intended musical atmosphere.
muted=false;setSfxMuted(muted||sfxOff);$('sound').textContent=t('menu.soundOn');$('sound').setAttribute('aria-label',t('menu.soundMute'));
function show(id,on=true){$(id).classList.toggle('hidden',!on)}let baronAircraft='fokker';const aircraftOverrides={},coopAircraftOverrides={};let coopBaronAircraft='fokker';const coopSelectedPlane=id=>id==='baron'?coopBaronAircraft:coopPlane(id);const pilotPlane=id=>(selectedMode==="coop2"?(id==='baron'?baronAircraft:coopPlane(id)):({baron:baronAircraft,voss:'fokker',boelcke:'albatros_d2',immelmann:'eindecker',fonck:'camel',collishaw:'collishaw_sopwith',baracca:'baracca_nieuport',udet:'udet_fokkerdv',guynemer:'guynemer_spad',bishop:'re7',goering:'goering_fokkerd7',mannock:'se5a',mckeever:'bristol_duo',huffzky:'halberstadt_duo',hawker:'airco_dh2',berthold:'berthold_pfalz',wolff:'wolff_albatros',loewenhardt:'loewenhardt_fokkerd7',mccudden:'mccudden_se5a',nungesser:'nungesser_nieuport24',jacobs:'fokker',rickenbacker:'rickenbacker_spad',ball:'ball_se5a',barker:'barker_snipe',luke:'luke_nieuport28',brumowski:'brumowski_albatros',gontermann:'gontermann_fokker',lothar:'lothar_dr1',sachsenberg:'junkers_d1',proctor:'proctor_se5a',schleich:'schleich_albatros',lufbery:'lufbery_nieuport17'}[id]||'camel'));

const CHOICE_PORTRAIT_SCALE={};
function choicePortraitScale(id){return CHOICE_PORTRAIT_SCALE[id]||1}
function applyPilotPortrait(target){if(!PILOTS[pilot]||!portraitSources[pilot])return;const el=$(target),choice=target==='portrait';el.style.backgroundImage=`url('${portraitSources[pilot]}')`;el.style.setProperty('--pilot-portrait-size','contain');el.style.backgroundSize='contain';el.style.backgroundPosition=choice?'right bottom':'center bottom';el.style.backgroundRepeat='no-repeat';el.style.filter='drop-shadow(0 5px 8px #0008)'}
function openPortraitLightbox(id){if(typeof id!=='string'||!id)id=pilot;if(!PILOTS[id])return;const src=portraitSources[id]||'portrait-'+id+'.webp?v=ui5&b=345';const img=$('plbImg');img.src=src;const p=pilotLoadout(id,id===pilot?plane:pilotPlane(id));$('plbName').textContent=p.name||PILOTS[id].name;$('plbAlias').textContent=p.alias||'';img.alt=(p.name||'')+' 파일럿 일러스트';show('portraitLightbox')}
$('plbClose').onclick=()=>show('portraitLightbox',false);$('portraitLightbox').onclick=e=>{if(e.target.id==='portraitLightbox')show('portraitLightbox',false)};window.addEventListener('keydown',e=>{if(e.code==='Escape'&&!$('portraitLightbox').classList.contains('hidden')){show('portraitLightbox',false);e.stopPropagation()}},true);$('portrait').onclick=openPortraitLightbox;$('hangarPortrait').onclick=openPortraitLightbox;
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.legendary-badge'))for(const b of document.querySelectorAll('.legendary-badge.tip156'))b.classList.remove('tip156')});

function prepareCutin(){applyPilotPortrait('cutinPortrait');const el=$('skillCutin');el.style.setProperty('--cutin-accent',faction==='central'?'#ffcf78':'#a2e2fa');el.style.animation='none';void el.offsetWidth;el.style.animation='';}
// Labels only: retain the selected simulation ID, original fit and renderer.
function displayAircraftName(pilotId,planeId){return aircraftName(planeId,pilotAircraftName(pilotId,planeId),pilotId)}
function aircraftCardLabel(name){const i=name.indexOf(' (');return i<0?name:name.slice(0,i)+'<br>'+name.slice(i+1)}
function roster(){document.body.classList.toggle('duo-selected',['mckeever','huffzky'].includes(pilot));document.body.classList.toggle('fac-central',faction==='central');document.body.classList.toggle('fac-entente',faction==='entente');if(!game&&selectedMode==='campaign'){const stage=activeCampaignStage();plane=sortieAircraft(stage,pilot,freeSortie,hasCampaignClear(stage.id),baronAircraft);}const p=pilotLoadout(pilot,plane);$('central').classList.toggle('active',faction==='central');$('entente').classList.toggle('active',faction==='entente');$('pilotNo').textContent=String(p.portrait+1).padStart(2,'0');$('pilotAlias').textContent=p.alias;$('pilotName').textContent=p.name;$('skillName').textContent=p.skill;$('skillDesc').textContent=p.desc;let passive=$('passive103');if(!passive){passive=document.createElement('p');passive.id='passive103';$('skillDesc').after(passive)}passive.textContent=p.passive+' · '+p.passiveDesc;const tabs=$('pilotTabs'),visiblePilots=Object.entries(PILOTS).filter(([,p])=>p.faction===faction),keepTabs=tabs.children.length===visiblePilots.length&&visiblePilots.every(([id],i)=>tabs.children[i].dataset.pilotId===id);if(!keepTabs)tabs.replaceChildren();for(let[i,[id,v]]of visiblePilots.entries()){let b=keepTabs?tabs.children[i]:document.createElement('button');if(!keepTabs){b.dataset.pilotId=id;b.dataset.pilotAlias=v.alias||'';const thumb=document.createElement('img');thumb.src=portraitSources[id]||'portrait-'+id+'.webp?v=ui5&b=326';thumb.className='pilot-tab-portrait';thumb.alt='';thumb.setAttribute('aria-hidden','true');thumb.onclick=e=>{e.stopPropagation();if(id===pilot)openPortraitLightbox(id);else{pilot=id;plane=pilotPlane(id);roster()}};const label=document.createElement('span');label.className='pilot-tab-label';label.textContent=v.name;b.append(thumb,label);if(id==='baron'){const medal=document.createElement('img');medal.src='./medal55.webp?v=ui5&b=326';medal.className='pilot-medal';medal.alt='푸르 르 메리트';medal.title='푸르 르 메리트';b.prepend(medal)}tabs.append(b)}const portrait=b.querySelector('.pilot-tab-portrait'),source=portraitSources[id]||'portrait-'+id+'.webp?v=ui5&b=326';if(portrait.getAttribute('src')!==source)portrait.src=source;b.className=id===pilot?'active':'';b.setAttribute('aria-pressed',id===pilot);b.disabled=!!game;b.onclick=()=>{pilot=id;plane=pilotPlane(id);roster()};}const canChooseBaron=pilot==='baron'&&(selectedMode!=='campaign'||freeSortie&&hasCampaignClear(activeCampaignStage().id));show('baronAircraftChoice',pilot==='baron');for(const [id,key] of [['baronTriplane','fokker'],['baronAlbatros','baron_albatros']]){$(id).disabled=!!game||!canChooseBaron;$(id).classList.toggle('active',plane===key);$(id).setAttribute('aria-pressed',plane===key);$(id).onclick=()=>{if(game||!canChooseBaron)return;delete aircraftOverrides.baron;baronAircraft=key;coopBaronAircraft=key;plane=pilotPlane(pilot);roster()}}$('baronAircraftHint').textContent=canChooseBaron?'기체마다 다른 액티브를 사용합니다.':'역사 출격은 임무 지정 기체를 사용합니다.';const combatRole=aircraftCombatRole(plane,PLANES);$('pilotAircraft').innerHTML=aircraftCardLabel(displayAircraftName(pilot,plane))+' · '+(PLANES[plane].tierLabel||PLANES[plane].role)+(combatRole?' · '+(getLocale()==='en'?combatRole.nameEn:combatRole.name):'');const flight=PLANES[plane].handling;$('airframeTip').textContent=(getLocale()==='en'?(PLANES[plane].aircraftTier?.descriptionEn||flight.tip):(PLANES[plane].identityDescription||flight.tip))+(combatRole?' · '+(getLocale()==='en'?combatRole.tipEn:combatRole.tip):'');$('airframeHistory').textContent=flight.history;const fit=PLANES[plane],gain=Math.round(((fit.xpGainMultiplier??1)-1)*100);$('airframeStats').textContent=`속도 ${Math.round(fit.speed/181*100)} · 선회 ${Math.round(fit.turn/4.3*100)} / 100 · 내구도 ${fit.hp} HP`;$('airframeGrowth').textContent=`XP ${gain>0?'+':''}${gain}% · ${fit.hp} HP`;const selected=$('selectedAircraft').getContext('2d');selected.clearRect(0,0,180,160);planeSprite(selected,90,76,-Math.PI/2,aircraftKey(plane,false,pilot),1/.54);const w=WEAPONS[plane];$('weaponSpec').textContent=`${w.name} × ${w.guns} · ${w.caliber} · 각 ${w.belt}발`;$('weaponDetail').textContent=`게임 연사 기준: 총당 분당 ${w.rpm}발 · 공중 재장전 ${w.reload}초 (각색)`;$('central').disabled=!!game;$('entente').disabled=!!game;applyPilotPortrait('portrait');swapArt($('hangarPortrait'),portraitSources[pilot]||'portrait-'+pilot+'.webp?v=ui5&b=326');$('hangarAircraftName').innerHTML=aircraftCardLabel(displayAircraftName(pilot,plane))+' · '+(PLANES[plane].tierLabel||'');$('hangarPortrait').alt=p.name+' 파일럿 일러스트';$('hangarName').textContent=p.name;$('hangarSkill').textContent=p.skill;const hc=$('hangarPlane').getContext('2d');hc.clearRect(0,0,144,160);planeSprite(hc,72,76,-Math.PI/2,aircraftKey(plane,false,pilot),1/.54);renderCampaignMenu();renderCoopSetup();renderAircraft103();if($('randomStart'))$('randomStart').hidden=selectedMode!=='endless'||!!game}
$('central').onclick=()=>{faction='central';pilot='baron';plane='fokker';roster()};$('entente').onclick=()=>{faction='entente';pilot='fonck';plane='camel';roster()};
let worldScale=1;function resize(){let r=canvas.getBoundingClientRect();const pixelScale=(mobileDisplay?.8:1)*userZoom;const nextW=Math.max(240,Math.round(r.width*renderScale)),nextH=Math.max(240,Math.round(r.height*renderScale));W=Math.max(240,Math.round(r.width/pixelScale));H=Math.max(240,Math.round(r.height/pixelScale));worldScale=nextW/W;if(canvas.width!==nextW)canvas.width=nextW;if(canvas.height!==nextH)canvas.height=nextH;ctx.setTransform(worldScale,0,0,worldScale,0,0);ctx.imageSmoothingEnabled=false;ctx.imageSmoothingQuality='high'}new ResizeObserver(resize).observe($('viewport'));
function saveRanking(score){let rows=[];try{rows=JSON.parse(localStorage.getItem('headon-ranking')||'[]')}catch{}rows.push({name:nickname||t('pilot.anonymous'),score,time:Math.floor(game.t),pilot});rows.sort((a,b)=>b.score-a.score);rows=rows.slice(0,10);try{localStorage.setItem('headon-ranking',JSON.stringify(rows))}catch{}return rows}function rankingText(rows){return rows.map((r,i)=>`${['🥇','🥈','🥉'][i]||String(i+1)+'.'} ${r.name} — ${t('ranking.points',{score:Number(r.score).toLocaleString()})}`).join('\n')}async function syncServerRanking(score){const run=game;try{const res=await fetch('/api/rankings',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:nickname,score,pilot})});if(!res.ok)return;const rows=await res.json();if(game!==run)return;const text=$('modalText').textContent;const mark=t('result.local');if(text.includes(mark))$('modalText').textContent=text.replace(new RegExp(mark+'[\\s\\S]*'),`${t('ranking.serverPriority')}\n${rankingText(rows)}`)}catch{}}function start(onlineSession=null,onlineStart=null){if(onlineStart){selectedMode='coop2';const own=onlineStart.players[onlineSession.role==='host'?0:1];pilot=own.pilot;plane=own.plane;faction=own.faction;}window.HEADON_GATE?.releaseAll();resetRegionTransition();game?.stageBoss?.dispose();if(selectedMode==='coop2'&&!coopAvailable&&!onlineStart&&!coopTestOverride)return;coopInput.reset();coopCutinEnds.p1=coopCutinEnds.p2=0;show('bossArrival',false);bossArrivalUntil=0;show('bossWarning',false);show('bossCutin',false);bossCardFrom=0;bossCutinUntil=0;lastStageBossId='';if(selectedMode!=='campaign')nickname=selectedMode==='coop2'?'P1':t('pilot.anonymous');show('skillCutin',false);cutinUntil=0;if(selectedMode==='campaign'){const stage=activeCampaignStage();game=new CampaignGame(stage.id,pilot,{free:freeSortie,cleared:hasCampaignClear(stage.id),baronAircraft});plane=game.plane}else if(onlineStart){game=onlineLobby.createGame(onlineSession,onlineStart)}else if(selectedMode==='coop2'){plane=pilot==='baron'?(baronAircraft==='baron_albatros'?'baron_albatros':'fokker'):pilotPlane(pilot);const coopP2Plane=coopPilot2==='baron'?(coopBaronAircraft==='baron_albatros'?'baron_albatros':'fokker'):coopSelectedPlane(coopPilot2);game=new CoopGame([{nickname:nickname||'P1',pilot,plane},{nickname:'P2',pilot:coopPilot2,plane:coopP2Plane}])}else{plane=pilotPlane(pilot);game=new Game(plane,pilot)}attachCombatFeedback(game,{play:sfx,pulse:kind=>gamepadInput.pulse(kind),key:e=>e.escortPlane||e.bossPlane||liveryVariant(e,faction==='central'?(e.type==='hunter'?'nieuport':e.type==='boss'?'spad':'camel'):(e.type==='hunter'||e.type==='boss'?'fokker':'albatros')),scale:enemyAircraftScale});if(selectedMode!=='campaign'&&!game.stageBoss&&(!game.online||game.host)){enableStageBoss(game,{teamFaction:selectedMode==='coop2'?game.teamFaction:PLANES[game.plane].faction,heavyHp:selectedMode==='coop2'?COOP_BALANCE.heavyHp:1})}const startRegion=game.worldRegion?.()??-1;if(startRegion>=0)beginRegionTransition(game.mode==='campaign'?game.stage.title:null,startRegion);else transitionAssetPrep(startRegion);game.viewWidth=W;game.viewHeight=H;keys={};joy=null;show('hangar',false);show('modal',false);show('hud');show('xpHud');show('ammoHud');show('touch');show('loadout');document.body.classList.add('playing');document.body.classList.toggle('coop-playing',game.mode==='coop2');document.body.classList.toggle('online-playing',!!game.online);show('coopHud',game.mode==='coop2');show('coopCutins',game.mode==='coop2');document.documentElement.classList.add('flight-fullscreen');flightViewport.lock();document.querySelector('.field-bottom').style.display='none';document.querySelector('footer').style.display='none';document.querySelector('.field-top').style.display='none';$('missionLabel').textContent=game.mode==='campaign'?game.stage.title:t('status.inProgress');document.querySelector('.time small').textContent=game.mode==='campaign'?'Campaign':t('mode.endless');show('campaignHud',game.mode==='campaign');show('missionMap',game.mode==='campaign');document.body.classList.toggle('campaign-playing',game.mode==='campaign');roster();resize();$('start').blur();sfx('launch')}
function returnHangar(){if(game?.online){game.disposeOnline();onlineLobby.close();selectedMode='endless';document.body.classList.remove('online-playing');}resetRegionTransition();transitionAssetPrep(-1).catch(()=>{});game?.stageBoss?.dispose();updateStageBossHud(null);coopInput.reset();document.body.classList.remove('coop-playing','coop-p2-choice');show('coopHud',false);show('coopCutins',false);show('bossArrival',false);bossArrivalUntil=0;show('bossWarning',false);show('bossCutin',false);bossCardFrom=0;bossCutinUntil=0;lastStageBossId='';show('skillCutin',false);cutinUntil=0;game=null;show('campaignHud',false);show('missionMap',false);document.body.classList.remove('campaign-playing');plane=pilotPlane(pilot);keys={};joy=null;show('modal',false);show('hangar');show('hud',false);show('xpHud',false);show('ammoHud',false);show('touch',false);show('loadout',false);show('toast',false);document.body.classList.remove('playing');document.documentElement.classList.remove('flight-fullscreen');flightViewport.unlock();document.querySelector('.field-bottom').style.display='';document.querySelector('footer').style.display='';document.querySelector('.field-top').style.display='';$('missionLabel').textContent='출격 대기';$('skillBar').style.width='100%';$('skillStatus').textContent='액티브 준비 완료';roster();resize();$('start').focus({preventScroll:true})}
function modal(tag,title,text,buttons){$('modal').classList.remove('settings-modal151','control-help151','build-modal151','manual-modal151');document.querySelector?.('#modal .help-panel151')?.remove?.();document.getElementById('build151')?.remove?.();clearChoiceIconRefs();lastFocus=document.activeElement;document.querySelector?.('#rankingPanel')?.remove?.();$('modalTag').textContent=tag;$('modalTitle').textContent=title;$('modalText').textContent=text;$('modalActions').replaceChildren();for(let b of buttons){let el=document.createElement('button');el.className=b.desc?'choice rarity-'+(b.rarity||'normal'):'primary';if(b.desc){let strong=document.createElement('b'),span=document.createElement('span');strong.textContent=b.label;span.textContent=b.desc;const icon=document.createElement('canvas');icon.width=112;icon.height=88;icon.className='choice-icon';choiceIconRefs.push({canvas:icon,id:b.upgradeId,owner:b.owner});if(icon.dataset)icon.dataset.upgradeId=b.upgradeId;icon.setAttribute('aria-hidden','true');drawUpgradeIcon(icon,b.upgradeId,b.owner);el.append(icon,strong,span)}else el.textContent=b.label;el.onclick=b.run;$('modalActions').append(el)}show('modal');$('modalActions').querySelector('button')?.focus({preventScroll:true})}
function resume(){music.unlock();if(game?.mode==='coop2'){if(game.resume()){coopInput.clear();last=performance.now();show('modal',false)}return}if(game?.state==='paused'){game.state='playing';show('modal',false);lastFocus?.focus({preventScroll:true})}}
function pause(){if(game?.mode==='coop2'){pauseCoop();return}if(game?.state==='playing'){game.state='paused';keys={};joy=null;showBuildPause151()}else resume()}
function helpControlSection151(title,rows){
 const section=document.createElement('section');section.className='help-control-section151';
 const heading=document.createElement('h3');heading.textContent=title;section.append(heading);
 for(const [keysText,labelText] of rows){const row=document.createElement('div');row.className='help-control-row151';const key=document.createElement('kbd');key.textContent=keysText;const label=document.createElement('span');label.textContent=labelText;row.append(key,label);section.append(row)}
 return section
}
function help(){
 if(game?.mode==="coop2"){if(game.state==="playing")pauseCoop();return}
 if(game?.state==='upgrade'||game?.state==='lost'||game?.state==='won')return;
 let wasPlaying=game?.state==='playing';if(wasPlaying){game.state='paused';keys={};joy=null}
 const en=getLocale()==='en',touchFirst=matchMedia('(pointer:coarse)').matches;
 modal('FLIGHT MANUAL',en?'Controls':'조작법',en?'Controls are grouped by device.':'기기별 조작만 빠르게 확인할 수 있습니다.',[{label:t('common.ok'),run:()=>{show('modal',false);if(wasPlaying)game.state='playing';else if(game?.state==='paused')pause();lastFocus?.focus({preventScroll:true})}}]);
 $('modal').classList.remove('manual-modal151','build-modal151','settings-modal151');$('modal').classList.add('control-help151');
 const pc=helpControlSection151(en?'PC · KEYBOARD':'PC · 키보드',[
  ['WASD / ↑↓←→',en?'Steer':'조종'],
  [keyLabel(KEYBINDS.evade),en?'Maneuver · 8s cooldown':'선회기동 · 쿨다운 8초'],
  [keyLabel(KEYBINDS.skill),en?'Pilot Active':'파일럿 액티브'],
  [keyLabel(KEYBINDS.reload),en?'Reload':'재장전'],
  ['P / ESC',en?'Pause':'일시정지']
 ]);
 const mobile=helpControlSection151(en?'MOBILE · TOUCH':'모바일 · 터치',[
  [en?'LEFT STICK':'왼쪽 스틱',en?'Steer':'조종'],
  [en?'DOUBLE TAP':'더블탭',en?'Maneuver from the stick':'스틱에서 선회기동'],
  [en?'MANEUVER':'선회기동',en?'Maneuver button':'선회기동 버튼'],
  [en?'ACTIVE':'액티브',en?'Pilot Active button':'파일럿 액티브 버튼'],
  [en?'RELOAD':'재장전',en?'Reload button':'재장전 버튼']
 ]);
 const pad=helpControlSection151(en?'GAMEPAD':'게임패드',[
  [en?'LEFT STICK':'왼쪽 스틱',en?'Steer':'조종'],
  ['A',en?'Fire while held':'누르는 동안 사격'],
  ['Y',en?'Maneuver':'선회기동'],
  ['X',en?'Pilot Active':'파일럿 액티브'],
  ['B',en?'Reload':'재장전'],
  [en?'MENU':'메뉴',en?'Pause':'일시정지']
 ]);
 const grid=document.createElement('div');grid.className='help-control-grid151';
 if(touchFirst)grid.append(mobile,pc,pad);else grid.append(pc,mobile,pad);
 const basics=document.createElement('section');basics.className='help-basics151';
 const basicsTitle=document.createElement('h3');basicsTitle.textContent=en?'COMBAT BASICS':'전투 기본';
 const basicsList=document.createElement('ul');
 const basicsText=en?[
  'The aircraft keeps moving forward.',
  'Keyboard and touch fire forward automatically. Gamepad fires while A is held.',
  'An empty belt reloads automatically; manual reload is also available.',
  'Cyan pickups give XP. Cross supplies restore durability.'
 ]:[
  '기체는 계속 전진합니다.',
  '키보드·터치는 전방 자동사격, 게임패드는 A를 누르는 동안 사격합니다.',
  '탄약이 떨어지면 자동 재장전되며, 직접 재장전도 가능합니다.',
  '청록색 경험치는 레벨업, 십자 보급품은 내구도를 회복합니다.'
 ];
 for(const text of basicsText){const li=document.createElement('li');li.textContent=text;basicsList.append(li)}
 basics.append(basicsTitle,basicsList);
 const panel=document.createElement('div');panel.className='help-panel151';panel.append(grid,basics);
 $('modalText').after(panel)
}
function randomSortie(){
 if(game||selectedMode!=='endless')return;
 const pool=Object.keys(PILOTS);if(!pool.length)return;
 pilot=pool[Math.floor(Math.random()*pool.length)];faction=PILOTS[pilot].faction;plane=pilotPlane(pilot);roster();sortie();
 battleReady.then(()=>{
  if(!game)return;
  const picks=game.rollChoices('normal').map(u=>({id:u.id,rarity:'normal'}));if(picks.length<3)return;
  game.state='upgrade';choices=picks;const en=getLocale()==='en';
  modal('RANDOM SORTIE',PILOTS[pilot].name,en?'Sortie bonus · choose 1 normal upgrade.':'출격 보너스 · 일반 강화 1개를 선택하세요.',choices.map((pick,i)=>{const u=UPGRADES.find(u=>u.id===pick.id);return{upgradeId:pick.id,label:`${i+1}. [${en?'NORMAL':'일반'}] ${u.name}`,rarity:'normal',desc:upgradeDescription(pick.id,'normal',game),run:()=>choose(pick.id,'normal')}}));sfx('levelup');
 });
}
$('reload').onclick=()=>game?.reload();$('start').onclick=sortie;document.addEventListener('click',e=>{if(e.target.closest?.('#randomStart')){e.preventDefault();randomSortie()}});$('pilotNickname').onkeydown=e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();sortie()}};$('pause').onclick=pause;$('help').onclick=help;$('touchSkill').onclick=e=>{e.preventDefault();game?.skill()};$('touchSkill').onpointerdown=e=>{e.preventDefault();game?.skill()};$('touchEvade').onclick=e=>{e.preventDefault();game?.evade()};$('touchEvade').onpointerdown=e=>{e.preventDefault();game?.evade()};$('sound').onclick=()=>{muted=!muted;setSfxMuted(muted||sfxOff);$('sound').textContent=muted?'소리 OFF':'소리 ON';$('sound').setAttribute('aria-label',muted?'소리 켜기':'소리 끄기');sound()};
window.addEventListener('keydown',e=>{if(capturingBind){e.preventDefault();e.stopPropagation();if(e.code!=='Escape'&&e.code!=='MetaLeft'&&e.code!=='MetaRight'){const conflict=Object.entries(KEYBINDS).find(([a,c])=>a!==capturingBind&&c===e.code);if(conflict){capturingBind=null;showKeybindSettings(t('settings.keysUsed'));return}KEYBINDS[capturingBind]=e.code;try{localStorage.setItem('headon.keybinds',JSON.stringify(KEYBINDS))}catch(_){}syncStartHint()}capturingBind=null;showKeybindSettings();return}if(regionTransitionUntil>0)return;if(['INPUT','TEXTAREA'].includes(e.target?.tagName))return;if(game?.mode==='coop2'){if(game.online){game.keydown(e,coopInput,{choose:chooseCoop,pause:pauseCoop,highlight:highlightCoopChoice},KEYBINDS);return;}coopInput.keydown(e,game,{choose:chooseCoop,pause:pauseCoop,highlight:highlightCoopChoice});return}if(e.code==='Tab'&&!$('modal').classList.contains('hidden')){const btns=[...$('modal').querySelectorAll('button,input')];if(e.shiftKey&&document.activeElement===btns[0]){e.preventDefault();btns.at(-1)?.focus({preventScroll:true})}else if(!e.shiftKey&&document.activeElement===btns.at(-1)){e.preventDefault();btns[0]?.focus({preventScroll:true})}return}if(!game)return;if([...new Set(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight',...Object.values(KEYBINDS)])].includes(e.code))e.preventDefault();keys[e.code]=true;if(e.repeat)return;if(e.code===KEYBINDS.evade)game.evade();if(e.code===KEYBINDS.skill)game.skill();if(e.code===KEYBINDS.reload)game.reload();if(e.code==='KeyQ')game.changeAltitude?.();if(e.code==='KeyP'||e.code==='Escape')pause();if(game.state==='upgrade'&&/^Digit[1234]$/.test(e.code)){let pick=choices[Number(e.code.slice(-1))-1];if(pick)choose(pick.id,pick.rarity)}});window.addEventListener('keyup',e=>{delete keys[e.code];coopInput.release(e.code)});window.addEventListener('blur',()=>{keys={};joy=null;if(game?.mode==='coop2'){coopInput.clear();game.pause();if(game.state==='paused')showCoopPause()}else if(game?.state==='playing')pause()});document.addEventListener('visibilitychange',()=>{if(!document.hidden)return;if(game?.mode==='coop2'){coopInput.clear();game.pause();if(game.state==='paused')showCoopPause()}else if(game?.state==='playing')pause()});
let stickId=null,lastStickTap=0;function moveStick(e){if(e.pointerId!==stickId)return;let r=$('stick').getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,l=Math.hypot(dx,dy),m=Math.min(l,33);joy=l>8?Math.atan2(dy,dx):null;$('stick').firstElementChild.style.transform=`translate(${l?dx/l*m:0}px,${l?dy/l*m:0}px)`} $('stick').onpointerdown=e=>{if(performance.now()-lastStickTap<280)game?.evade();lastStickTap=performance.now();stickId=e.pointerId;$('stick').setPointerCapture(e.pointerId);moveStick(e)};$('stick').onpointermove=moveStick;for(let ev of ['pointerup','pointercancel','lostpointercapture'])$('stick').addEventListener(ev,()=>{stickId=null;joy=null;$('stick').firstElementChild.style.transform='none'});
function choose(id,rarity='normal'){if(game?.state!=='upgrade')return;show('modal',false);game.upgrade(id,rarity);$('upgradesText').textContent=UPGRADES.filter(u=>game.upgrades[u.id]).map(u=>reinforcementName(u,game,PLANES)).join(' · ');sound(750,.12)}
function showUpgradeModal(){choices=game.rollChoices().map(u=>({id:u.id,rarity:u.rarity}));const rarityName={normal:'일반',magic:'매직',rare:'레어',unique:'유니크',legendary:'특수장비'};modal('LEVEL '+game.level+' / FIELD UPGRADE','강화 선택','전투에 적용할 강화를 하나 선택하세요',choices.map((pick,i)=>{const u=UPGRADES.find(u=>u.id===pick.id);return{upgradeId:pick.id,label:`${i+1}. [${rarityName[pick.rarity]}] ${u?.name||pick.id}`,rarity:pick.rarity,desc:upgradeDescription(pick.id,pick.rarity,game),run:()=>choose(pick.id,pick.rarity)}}));sfx('levelup')}
function events(){const _evs=game.events;game.events=[];for(let e of _evs)try{if(e.type==='bossPhase'){$('toast').textContent=bossPhaseLabel(e.text,getLocale());show('toast');toastUntil=performance.now()+2200;continue}if(e.type==='bossSound'){sfx(e.text);continue}if(e.type==='regionTransition')beginRegionTransition(e.text,e.region);if(e.type==='bossArrival'){bossArrivalUntil=game.t+4.5;{const _ef=e.pilot&&PILOTS[e.pilot]&&PILOTS[e.pilot].faction,fc=_ef==='entente'?'#7c9bb8':_ef==='central'?'#7d8f83':null,fcs=_ef==='entente'?'#a7c2da':_ef==='central'?'#9db3a5':null;document.querySelectorAll('#bossArrival,#bossWarning,.boss-cutin').forEach(el=>{el.style.setProperty('--enemy-fac',fc||'');el.style.setProperty('--enemy-fac-soft',fcs||'');el.style.setProperty('--enemy-fac-strong',fcs||'')})}$('bossName').textContent=e.pilot?pilotName(e.pilot,e.name||t('warning.ace')):(e.name||t('warning.ace'));swapArt($('bossPortrait'),portraitSources[e.pilot]||TRANSPARENT_PORTRAIT);$('bossPortrait').alt=$('bossName').textContent;$('bossArrivalDetail').textContent=e.pilot?(PILOTS[e.pilot]?.alias||''):t('warning.airspace');$('bossWarnSub').textContent=$('bossName').textContent+' · ENEMY ACE INBOUND';bossCardFrom=performance.now();bossCutinUntil=bossCardFrom+2600;const aceImg=portraitSources[e.pilot]||(e.pilot?'portrait-'+e.pilot+'.webp?v=ui5&b=326':(e.airframe?'mech/'+e.airframe+'.webp?v=ui5&b=326':''));setBossCutin(aceImg,$('bossName').textContent,'ENEMY ACE · 적 에이스',$('bossArrivalDetail').textContent);setBgmMode('boss');sfx('aceSting');{const arrivalRun=game;setTimeout(()=>{if(game===arrivalRun&&game.state==='playing'&&!regionTransitionUntil&&!document.hidden)sfx('aceSting')},380)}}if(e.type==='upgrade')showUpgradeModal();if(['wave','skill','ally','flak','heinecke','heineckeReturn'].includes(e.type)){$('toast').classList.remove('warn');$('toast').textContent=runtimeEventText(e.text);show('toast');toastUntil=performance.now()+2200;if(e.type==='skill'){sfx('skill');const p=pilotLoadout(pilot,game?.plane||plane)||PILOTS[pilot]||{};setBossCutin(portraitSources[pilot]||'portrait-'+pilot+'.webp?v=ui5&b=326',activeName(pilot==='baron'&&(game?.plane||plane)==='baron_albatros'?'baron:baron_albatros':pilot,p.skill||(getLocale()==='en'?'Active':'액티브')),'',pilotName(pilot,p.name||pilot),'skill');bossCardFrom=performance.now();bossCutinUntil=bossCardFrom+2100}else if(e.type==='heinecke'||e.type==='heineckeReturn')sfx(e.type==='heinecke'?'hit':'ally');else sfx(e.type==='flak'?'flak':e.type==='ally'?'ally':'wave')}if(e.type==='eliteWarn'){$('toast').classList.add('warn');$('toast').textContent=runtimeEventText(e.text);show('toast');toastUntil=performance.now()+3400;sfx('approachWarning')}if(e.type==='armorImpact')sfx('armorClink');if(e.type==='reload')sfx('reload');if(e.type==='loaded')sfx('loaded');if(e.type==='shot'&&performance.now()-lastShotSound>100){lastShotSound=performance.now();sfx('shot')}if(e.type==='impact'&&!e.combatMaterial&&performance.now()-lastImpactSound>65){lastImpactSound=performance.now();sfx('impact')}if(e.type==='pickup'&&performance.now()-lastPickupSound>220){lastPickupSound=performance.now();sfx(e.text==='heal'?'heal':'pickup')}if(e.type==='hit')sfx('hit');if(e.type==='kill')sfx(e.combatSound||(e.text==='balloon'?'balloon':'kill'));if(e.type==='end')sfx(game.state==='won'||game.result?.won?'victory':'defeat');if(e.type==='end'&&game.mode==='campaign'){campaignEnd(game);continue}if(e.type==='end'){showSoloResult(game)}}catch(evErr){console.error('[headon] event',e&&e.type,evErr)}}
function drawZeppelin(c,x,y,a,scale=1,damaged=false,airshipFaction=null){
 const zeppelinSprite=airshipFaction==='central'?globalZeppelinSprite:airshipFaction==='entente'?ententeAirshipSprite:faction==='central'?ententeAirshipSprite:globalZeppelinSprite;
  c.save();c.translate(Math.round(x),Math.round(y));c.rotate(a+Math.PI);c.imageSmoothingEnabled=false;
  if(zeppelinSprite.complete&&zeppelinSprite.naturalWidth){const w=400*scale,h=w*zeppelinSprite.naturalHeight/zeppelinSprite.naturalWidth;c.globalAlpha=damaged?.72:1;c.drawImage(zeppelinSprite,-w/2,-h/2,w,h);if(damaged){c.globalAlpha=.25;c.fillStyle='#ffb078';c.fillRect(-w*.34,-h*.32,w*.68,h*.18)}}
  else{c.scale(scale,scale);c.fillStyle=damaged?'#616b62':'#b4bba7';c.beginPath();c.ellipse(0,0,29,52,0,0,Math.PI*2);c.fill();c.strokeStyle='#59665b';c.lineWidth=2;c.stroke();c.fillStyle='#30372e';c.fillRect(-18,34,36,9);c.fillRect(-12,41,24,7);c.fillStyle='#d8cb9b';c.fillRect(-8,-15,16,6);c.fillRect(-8,9,16,6);c.fillStyle='#454d41';c.fillRect(-34,-3,7,6);c.fillRect(27,-3,7,6)}c.restore()}
function drawPixelHeart(c,x,y,size,color='#17131c'){const s=Math.max(1,Math.round(size/4));c.fillStyle=color;c.fillRect(x-2*s,y-s,s,s);c.fillRect(x+s,y-s,s,s);c.fillRect(x-3*s,y,6*s,s);c.fillRect(x-2*s,y+s,4*s,s);c.fillRect(x-s,y+2*s,2*s,s)}
function terrain(cx,cy,width=W,height=H){const W=width,H=height;ctx.fillStyle='#778563';ctx.fillRect(0,0,W,H);const tile=140;let sx=Math.floor((cx-W/2)/tile),sy=Math.floor((cy-H/2)/tile);const noise=(x,y)=>{let n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n)};for(let x=sx;x<sx+W/tile+2;x++)for(let y=sy;y<sy+H/tile+2;y++){let px=Math.floor(x*tile-cx+W/2),py=Math.floor(y*tile-cy+H/2),n=noise(x,y);ctx.fillStyle=['#758461','#7d8966','#81906c','#71815e','#6d7e5d'][Math.floor(n*5)];ctx.fillRect(px,py,138,138);ctx.fillStyle='#94a27733';for(let i=10;i<135;i+=13)ctx.fillRect(px+i,py+3,2,130);ctx.fillStyle='#4b604543';ctx.fillRect(px,py,140,3);if(n>.7){for(let j=0;j<7;j++){let tx=px+noise(x+j,y+3)*130,ty=py+noise(x+9,y+j)*130;ctx.fillStyle='#465f3d';ctx.fillRect(tx,ty,9,9);ctx.fillStyle='#567044';ctx.fillRect(tx-2,ty-3,9,8)}}if(n<.1){ctx.fillStyle='#586143';ctx.fillRect(px+43,py+48,29,20);ctx.fillStyle='#b3a487';ctx.fillRect(px+42,py+43,26,18);ctx.fillStyle='#71634d';ctx.fillRect(px+39,py+41,32,6)}}
 // A winding river and broken trench lines follow persistent world coordinates.
 ctx.strokeStyle='#667f76';ctx.lineWidth=38;ctx.beginPath();for(let yy=-30;yy<H+40;yy+=15){let wy=cy-H/2+yy,xx=Math.sin(wy*.002)*180+240-cx+W/2;yy===-30?ctx.moveTo(xx,yy):ctx.lineTo(xx,yy)}ctx.stroke();ctx.strokeStyle='#93a28a66';ctx.lineWidth=3;ctx.stroke();ctx.strokeStyle='#655c44';ctx.lineWidth=5;ctx.beginPath();for(let yy=-20;yy<H+30;yy+=15){let wy=cy-H/2+yy,xx=-210+Math.sin(wy*.008)*45+(Math.floor(wy/22)%2)*12-cx+W/2;yy===-20?ctx.moveTo(xx,yy):ctx.lineTo(xx,yy)}ctx.stroke()}
function drawEagleGhost(ctx,x,y,a,al){ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.globalAlpha=Math.max(0,al);ctx.fillStyle='#2e3a48';ctx.beginPath();ctx.moveTo(23,0);ctx.lineTo(15,-3.6);ctx.lineTo(8,-4.4);ctx.quadraticCurveTo(3,-8,-2,-13);ctx.quadraticCurveTo(-5,-19,-4,-26);ctx.lineTo(-10,-24);ctx.quadraticCurveTo(-11,-15,-8,-9);ctx.quadraticCurveTo(-6,-5,-3.5,-4);ctx.lineTo(-15,-4.4);ctx.lineTo(-21,-2);ctx.lineTo(-23,0);ctx.lineTo(-21,2);ctx.lineTo(-15,4.4);ctx.lineTo(-3.5,4);ctx.quadraticCurveTo(-6,5,-8,9);ctx.quadraticCurveTo(-11,15,-10,24);ctx.lineTo(-4,26);ctx.quadraticCurveTo(-5,19,-2,13);ctx.quadraticCurveTo(3,8,8,4.4);ctx.lineTo(15,3.6);ctx.closePath();ctx.fill();ctx.fillStyle='#4a5a6c';ctx.beginPath();ctx.ellipse(4,0,10,3.4,0,0,Math.PI*2);ctx.fill();ctx.restore()}
const fxGlow=(cx,cy,r,c0)=>{const g2=ctx.createRadialGradient(cx,cy,0,cx,cy,r);g2.addColorStop(0,c0);g2.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g2;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill()};
const fxSpark=(cx,cy,r,col,al,rot=0)=>{ctx.strokeStyle=col;ctx.lineWidth=Math.max(1.3,r*.13);ctx.lineCap='round';ctx.globalAlpha=al;ctx.beginPath();for(let i2=0;i2<4;i2++){const aa=rot+i2*Math.PI/2;ctx.moveTo(cx+Math.cos(aa)*r*.3,cy+Math.sin(aa)*r*.3);ctx.lineTo(cx+Math.cos(aa)*r,cy+Math.sin(aa)*r)}ctx.stroke();ctx.globalAlpha=Math.min(1,al*1.25);ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(cx,cy,Math.max(1.1,r*.15),0,Math.PI*2);ctx.fill()};
function drawPilotPassives(g,x,y,t,pt){drawPilotSignatureFront(ctx,g,x,y);if(FXS&&pt)drawPassiveFxFront(ctx,g,pt,t,x,y)}
const ghostPlaneCache=new Map();
const textWidthCache=new Map();
const _ptShare=[0,0];
const measureCached=(c,txt)=>{const k=c.font+'\u0000'+txt;let w=textWidthCache.get(k);if(w===undefined){w=c.measureText(txt).width;textWidthCache.set(k,w)}return w};
function ghostPlane(c,x,y,a,key,filter){const ck=key+'|'+filter;if(!ghostPlaneCache.has(ck)){const cv=document.createElement('canvas');cv.width=144;cv.height=160;const cc=cv.getContext('2d');cc.filter=filter;planeSprite(cc,72,76,-Math.PI/2,key,1,false,false);ghostPlaneCache.set(ck,cv)}const cv=ghostPlaneCache.get(ck);if(!cv.width)return;c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.translate(Math.round(x),Math.round(y));c.rotate(a+Math.PI/2);c.drawImage(cv,-72,-76);c.restore()}
function draw(t){let cx=game?game.x:Math.sin(t*.03)*45,cy=game?game.y:-t*12;ctx.save();if(game){const kick=combatCameraOffset(game),shake=Math.min(3,game.shake||0);ctx.translate(Math.sin((game.t||0)*89)*shake*.35+kick.x,Math.cos((game.t||0)*73)*shake*.3+kick.y);}terrain(cx,cy);drawStageBoss(ctx,game,W,H,{drawZeppelin,drawFieldArt,layer:'bodies'});if(game){ctx.strokeStyle='#ecf6de35';ctx.lineWidth=1;for(let i=0;i<16;i++){let px=(i*137.3+t*73)%W,py=(i*97.7+t*170)%H;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px-Math.cos(game.a)*22,py-Math.sin(game.a)*22);ctx.stroke()}}const point=(x,y)=>{_ptShare[0]=x-cx+W/2;_ptShare[1]=y-cy+H/2;return _ptShare};if(game){drawFleetLayer(ctx,game,{point});drawTrenchLayer(ctx,game,{point});drawCityAirLayer(ctx,game,{point})}if(game){
 // Voss reverse-turn afterimages: player and ace boss use the same pale ghost trail.
 for(const ghost of game.vossAfterimages||[]){const [gx,gy]=point(ghost.x,ghost.y);if(gx<-110||gx>W+110||gy<-110||gy>H+110)continue;ctx.save();ctx.globalAlpha=.34*(ghost.life/ghost.maxLife);planeSprite(ctx,gx,gy,ghost.a,aircraftKey(plane,false,'voss'),1,false,false);ctx.restore()}
 for(const e of game.enemies||[])for(const ghost of e.vossTrails||[]){const [gx,gy]=point(ghost.x,ghost.y);if(gx<-110||gx>W+110||gy<-110||gy>H+110)continue;ctx.save();ctx.globalAlpha=.42*(ghost.life/ghost.maxLife);planeSprite(ctx,gx,gy,ghost.a,e.bossPlane||'fokker_voss',enemyAircraftScale(e),true,false);ctx.restore()}
 for(let d of game.drops){let[x,y]=point(d.x,d.y);if(x<-70||x>W+70||y<-70||y>H+70)continue;if(d.mccuddenSupply){drawMccuddenSupply(ctx,d,x,y)}else if(d.heal||d.supply){const pulse=22+Math.sin(t*5)*4;ctx.save();ctx.globalAlpha=.4;ctx.strokeStyle='#5fff9e';ctx.lineWidth=7;ctx.beginPath();ctx.arc(x,y,pulse,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;ctx.strokeStyle='#9cffb4';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,pulse,0,Math.PI*2);ctx.stroke();ctx.fillStyle='rgba(210,255,224,.9)';for(let i=0;i<4;i++){const sa=t*2.6+i*Math.PI/2;ctx.beginPath();ctx.arc(x+Math.cos(sa)*(pulse+6),y+Math.sin(sa)*(pulse+6),1.7,0,Math.PI*2);ctx.fill()}ctx.restore();drawEquipment(ctx,'repair',x,y+Math.sin(t*3)*2,0,46)}else{if(xpGem?.naturalWidth)ctx.drawImage(xpGem,x-9,y-9,18,18);else{ctx.fillStyle='#63d5ec';ctx.fillRect(x-3,y-3,6,6)}}}for(const grenade of game.grenades||[]){const[gx,gy]=point(grenade.x,grenade.y);if(gx<-80||gx>W+80||gy<-80||gy>H+80)continue;drawGrenade(ctx,grenade,gx,gy)}for(let m of game.mines){let[x,y]=point(m.x,m.y);if(x<-80||x>W+80||y<-80||y>H+80)continue;drawDrachenMine(ctx,x,y,62,62);if(m.arm===0){ctx.strokeStyle='#ffcc6677';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,20+Math.sin(t*5)*2,0,Math.PI*2);ctx.stroke()}}for(let b of game.bullets){if(b.flak||b.enemy||b.motorCannon||b.cow37)continue;let[x,y]=point(b.x,b.y);if(x<-90||x>W+90||y<-90||y>H+90)continue;if(b.rocket){if(!fx(ctx,'rocket',x,y,52,16,Math.atan2(b.vy,b.vx)))drawEquipment(ctx,'rocket',x,y,Math.atan2(b.vy,b.vx)+Math.PI/2,48);}else if(b.mannockPass){fx(ctx,b.mannockPass==='vertical'?'tracerCream':'tracerAmber',x,y,48,8,Math.atan2(b.vy,b.vx));}else if(b.fonckVolley){fx(ctx,'tracerCream',x,y,46,10,Math.atan2(b.vy,b.vx));}else if(b.fonckSeeker){ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(b.vy,b.vx));if(!fx(ctx,'tracerCream',-6,0,46,10)){ctx.fillStyle='#fff5bd';ctx.fillRect(-18,-3,30,6);ctx.fillStyle='#f3a94f';ctx.fillRect(-25,-1,12,2)}ctx.restore();}else{const driMult=game.pilot==='baron'&&game.dreideckerActive&&typeof game.dreideckerTurnDamageMultiplier==='function'?game.dreideckerTurnDamageMultiplier():1;if(driMult>1.02&&!b.enemy&&!b.formation&&!b.ally){const power=Math.min(1,(driMult-1)/.6);ctx.save();ctx.globalAlpha=.58+.32*power;ctx.strokeStyle=power>.7?'#7d1010':'#551010';ctx.lineWidth=4+power*2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-b.vx*.021,y-b.vy*.021);ctx.stroke();ctx.globalAlpha=.9;ctx.strokeStyle=power>.7?'#ffe0a8':'#ff9b67';ctx.lineWidth=1.4+power*1.2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-b.vx*.016,y-b.vy*.016);ctx.stroke();ctx.restore();continue}const bc=b.mauserRound?'#a98cff':b.eagle?'#9fdcff':b.enemy?'#ffb096':(b.formation||b.ally)?'#b9f2de':b.pierce?'#f8f5cd':friendlyTracerColor(b,game.gunUpgradeBonus),bw=b.enemy?3:(b.formation||b.ally)?4:b.pierce?3:2;if(!(FXS&&fxsTracer(ctx,x,y,b.vx,b.vy,bc,bw))){ctx.strokeStyle=bc;ctx.lineWidth=bw;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-b.vx*.018,y-b.vy*.018);ctx.stroke()}}}for(const e of game.enemies){if(e.groundEscort){const[x,y]=point(e.x,e.y);if(x<-260||x>W+260||y<-260||y>H+260)continue;drawGroundEnemy(ctx,e,x,y,96)}}
for(const e of game.enemies){if(!e.fieldUnit||e.hp<=0)continue;const[x,y]=point(e.x,e.y);if(x<-360||x>W+360||y<-360||y>H+360)continue;ctx.save();
 if(e.rail){const r=e.rail,[rx,ry]=point(r.x,r.y);ctx.save();ctx.translate(rx,ry);ctx.rotate(r.angle);ctx.strokeStyle='#322c25';ctx.lineWidth=4;for(let pos=-r.half-20;pos<=r.half+20;pos+=18){ctx.beginPath();ctx.moveTo(pos,-13);ctx.lineTo(pos,13);ctx.stroke()}ctx.strokeStyle='#bec1ab';ctx.lineWidth=2;for(const off of [-8,8]){ctx.beginPath();ctx.moveTo(-r.half-25,off);ctx.lineTo(r.half+25,off);ctx.stroke()}ctx.restore();
  if(e.fire<.7){ctx.strokeStyle='#ffac7877';ctx.setLineDash([5,8]);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(W/2,H/2);ctx.stroke();ctx.setLineDash([])}
 }else{ctx.strokeStyle='#d4cbaa99';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y+75);ctx.lineTo(x+45,y+138);ctx.stroke();ctx.fillStyle='#4b4130';ctx.fillRect(x+41,y+135,8,5)}
 e.rail?drawGroundEnemy(ctx,e,x,y,210):drawBattlefieldSpriteShadowed(ctx,e.fieldSprite,x,y,354,0);ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillStyle='#ffce95';{const nm=unitNameEN(e.name),half=(e.rail?210:354)/2,onX=x>-half&&x<W+half,tw=measureCached(ctx,nm),lx=onX?Math.max(tw/2+4,Math.min(W-tw/2-4,x)):x,bx=onX?Math.max(30,Math.min(W-30,x)):x;ctx.fillText(nm,lx,y-(e.rail?120:190));ctx.fillStyle='#172b23';ctx.fillRect(bx-26,y+(e.rail?118:190),52,4);ctx.fillStyle='#e6b77d';ctx.fillRect(bx-26,y+(e.rail?118:190),52*e.hp/e.maxHp,4);}if(e.muzzleFlash>0){const ra=e.rail?e.rail.angle+Math.PI/2:0;fx(ctx,'muzzleHeavy',x+Math.cos(ra)*110,y+Math.sin(ra)*110,64,64,ra,Math.min(1,e.muzzleFlash*10));fx(ctx,'dustPuff',x-Math.cos(ra)*30,y-Math.sin(ra)*30,90,60,ra,.4)}ctx.restore();}
for(const f of game.flakBursts||[]){const [x,y]=point(f.x,f.y);if(x<-90||x>W+90||y<-90||y>H+90)continue;ctx.save();ctx.globalAlpha=Math.min(1,f.life);drawGroundEnemy(ctx,f,x,y,66,'mg',faction==='central'?'entente':'central');ctx.restore();if(f.life>5.9)drawFieldArt('flak',x,y-12,44,44,0,Math.min(1,(f.life-5.9)*2))}
for(const e of game.enemies){if(!e.navalVessel||e.hp<=0||e.movingShip)continue;const[x,y]=point(e.x,e.y);if(x<-260||x>W+260||y<-260||y>H+260)continue;drawBattlefieldSprite(ctx,'ship',x,y,320,e.a+Math.PI/2);ctx.fillStyle='#24332b';ctx.fillRect(x-22,y+172,44,4);ctx.fillStyle='#de9b73';ctx.fillRect(x-22,y+172,44*e.hp/e.maxHp,4)}
for(let e of game.enemies){let[x,y]=point(e.x,e.y);if(x<-260||x>W+260||y<-260||y>H+260)continue;if(e.groundEscort)continue;if(e.bugDrone){drawRegionalBug(ctx,e,x,y);continue}if(e.stageBossBody||e.heavyBomber||e.missionGround||e.navalVessel||e.fieldUnit||e.cityUnit||e.londonInstallation)continue;let key=e.escortPlane?e.escortPlane:e.bossPlane?e.bossPlane:liveryVariant(e,faction==='central'?(e.type==='hunter'?'nieuport':e.type==='boss'?'spad':'camel'):(e.type==='hunter'||e.type==='boss'?'fokker':'albatros'));let size=enemyAircraftScale(e);const visual=combatVisualPose(e);if(e.crashing){size*=enemyCrashScale(e);drawAircraftCrash(ctx,e,x,y,t,fx)}if(e.type!=='bomber'&&e.type!=='zeppelin')planeSprite(ctx,x+14,y+22,e.a,key,size,true,true);ctx.save();ctx.translate(x+visual.x,y+visual.y);ctx.rotate(e.a+visual.roll);ctx.scale(1,visual.bank);planeSprite(ctx,0,0,0,key,size,true,false,visual.active?Math.min(.1,e.hitFlash||0):e.hitFlash,e.hp<=e.maxHp*.5);ctx.restore();drawEnemyDanger(ctx,e,x,y,t,fx,game.t||0);if(e.vossInvuln>0||e.aceInvuln124>0){ctx.save();ctx.globalAlpha=.55;ctx.strokeStyle=e.aceInvuln124>0?'#35253d':'#e9f2ca';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,42+Math.sin(t*20)*4,0,Math.PI*2);ctx.stroke();ctx.restore()}if(e.vossSurge){ctx.save();ctx.globalAlpha=.9;const n2=Math.min(7,Math.max(3,e.vossSurgeCount||3));ctx.strokeStyle='rgba(255,222,140,.4)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,50,0,Math.PI*2);ctx.stroke();for(let i=0;i<n2;i++){const ga=t*2.3+i*Math.PI*2/n2;ctx.fillStyle=i%2?'#ffe6a2':'#cfe6ff';ctx.beginPath();ctx.arc(x+Math.cos(ga)*50,y+Math.sin(ga)*50,3,0,Math.PI*2);ctx.fill()}ctx.restore()}if(e.type==='zeppelin')drawZeppelin(ctx,x,y,e.a,size,e.hitFlash>0,e.faction);if(e.type==='boss'&&!e.crashing){ctx.fillStyle='#2a3024';ctx.fillRect(x-30,y-40,60,4);ctx.fillStyle='#e7835c';ctx.fillRect(x-30,y-40,60*e.hp/e.maxHp,4)}}drawCombatFeedback(ctx,game,point,{fx,planeSprite});for(let p of game.particles){let[x,y]=point(p.x,p.y);if(x<-70||x>W+70||y<-70||y>H+70)continue;const smokeLife=p.smoke?Math.max(0,p.life/p.maxLife):0;ctx.globalAlpha=p.smoke?smokeLife*(p.muzzleSmoke?.88:.65):Math.min(1,p.life*3);if(p.petal){drawPetalParticle(ctx,p,x,y);continue}if(p.heart){drawPixelHeart(ctx,Math.round(x),Math.round(y),p.size,p.color);continue}ctx.fillStyle=p.color;let size=p.smoke?p.size+(1-smokeLife)*(p.muzzleSmoke?15:10):3;
 if(!p.smoke&&fxReady('spark')){fxTint(ctx,'spark',p.color,x,y,size*4,size*4);continue}
 if(p.smoke){const lum=p._lum??(p._lum=parseInt(p.color?.slice(1,3)||'88',16)),sKey=p.muzzleSmoke?'smokePuff':lum<110?'smokeDark':lum>170?'smokeWisp':'smokeGray';const savedAlpha=ctx.globalAlpha;if(fx(ctx,sKey,x,y,size*2.4,size*2.4,0,savedAlpha)){ctx.globalAlpha=1;continue}}
 ctx.fillRect(Math.round(x-size/2),Math.round(y-size/2),size,size)}ctx.globalAlpha=1;let x=W/2,y=H/2;drawRedGhosts162(ctx,game,x,y,planeSprite,aircraftKey(plane,false,pilot));
 if(FXS&&drawPassiveFx(ctx,game,point,t,x,y)){}else if(game.huntTarget&&game.huntTargetAlive?.(game.huntTarget)){const tgt=game.huntTarget,[hx,hy]=point(tgt.x,tgt.y),sz=game.huntTargetElite?22:tgt.heavyBomber?58:tgt.bossPilot?44:tgt.type==='bomber'?32:26;ctx.save();const dp=game.huntDesignate>0?1-game.huntDesignate/.35:1;ctx.globalAlpha=(game.huntDesignate>0?Math.min(1,dp*1.7):.8)*.85;ctx.strokeStyle='#b32424';ctx.lineWidth=2;const rr=sz*.8,rot=t*2.2;ctx.beginPath();ctx.arc(hx,hy,rr,0,Math.PI*2);ctx.stroke();for(let i=0;i<4;i++){const a=rot+i*Math.PI/2;ctx.beginPath();ctx.moveTo(hx+Math.cos(a)*rr,hy+Math.sin(a)*rr);ctx.lineTo(hx+Math.cos(a)*(rr+7),hy+Math.sin(a)*(rr+7));ctx.stroke()}if(game.huntDesignate>0){const inset=sz+(1-dp)*30;ctx.strokeStyle='#7a1616';for(const[bx,by]of[[-1,-1],[1,-1],[-1,1],[1,1]]){ctx.beginPath();ctx.moveTo(hx+bx*inset-bx*13,hy+by*inset);ctx.lineTo(hx+bx*inset,hy+by*inset);ctx.lineTo(hx+bx*inset,hy+by*inset-by*13);ctx.stroke()}}ctx.restore()}
 for(const g of game.dreideckerGhosts||[]){const[gx,gy]=point(g.x,g.y),st=g.stretch?1.5:1;ctx.save();ctx.globalAlpha=(.15+.22*(g.turn||0))*(g.life/g.maxLife)*(g.stretch?1.3:1);ghostPlane(ctx,gx-Math.cos(g.a)*18*(st-1),gy-Math.sin(g.a)*18*(st-1),g.a,aircraftKey(plane,false,pilot),'brightness(.5)');ctx.restore()}
 for(const sl of game.huntStreaks||[]){const[lx,ly]=point(sl.x,sl.y);ctx.save();ctx.globalAlpha=.45*(sl.life/sl.maxLife);ctx.strokeStyle='#5e1414';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(lx-Math.cos(sl.a)*10,ly-Math.sin(sl.a)*10);ctx.lineTo(lx-Math.cos(sl.a)*(26+(sl.off||0)*5),ly-Math.sin(sl.a)*(26+(sl.off||0)*5));ctx.stroke();ctx.restore()}
 if(game.huntGhost){const g=game.huntGhost,[gx,gy]=point(g.x,g.y);ctx.save();ctx.globalAlpha=.3*(g.life/g.maxLife);ghostPlane(ctx,gx,gy,g.a,aircraftKey(plane,false,pilot),'brightness(.6)');ctx.restore()}
 if(game.heineckeEscape>0){const[hx,hy]=point(game.heineckeAnchor.x,game.heineckeAnchor.y);drawHeineckeParachute(ctx,game,hx,hy)}else{const pose129=playerPose(game,x,y),flightPose=combatVisualPose(game);pose129.x+=flightPose.x;pose129.y+=flightPose.y;pose129.roll=flightPose.roll;pose129.bank=flightPose.bank;drawPlayerAura(ctx,game,pose129.x,pose129.y);ctx.save();ctx.translate(pose129.x-x,pose129.y-y);ctx.globalAlpha=pose129.shadowAlpha;ctx.save();ctx.translate(Math.round(x+pose129.shadowX),Math.round(y+pose129.shadowY+pose129.height));applyPlayerAttitude(ctx,game,pose129,true);planeSprite(ctx,0,0,0,aircraftKey(plane,false,pilot),pose129.scale*pose129.shadowScale,false,true);ctx.restore();ctx.globalAlpha=1;ctx.globalAlpha=game.ballCloak>0?.24:game.invuln>0&&Number.isFinite(game.invuln)&&Math.floor(t*15)%2?.55:1;ctx.save();ctx.translate(x,y);applyPlayerAttitude(ctx,game,pose129);planeSprite(ctx,0,0,0,aircraftKey(plane,false,pilot),pose129.scale,false,false,game.hitFlash,game.pilot==='barker'?Math.max(game.barkerDamageStage||0,game.barkerScarStage||0):game.hp<=game.maxHp*.5);ctx.restore();ctx.globalAlpha=1;{const loDecal=(txt,al,dx,dy,seed)=>{ctx.save();ctx.translate(x,y);ctx.rotate(game.a);ctx.translate(dx,dy);ctx.font='italic 600 11px Georgia,"Times New Roman",serif';ctx.textAlign='center';const widths=[...txt].map(ch=>measureCached(ctx,ch));const total=widths.reduce((a2,b2)=>a2+b2,0);let lx=-total/2;[...txt].forEach((ch,i)=>{const w=widths[i],ph2=t*5.1+i*.83+seed,bob=Math.sin(ph2)*1.9+Math.sin(ph2*1.73+1.2)*.9,tilt=Math.sin(ph2*.9+i)*.14,la=al*(.7+.3*Math.sin(ph2*.6+i*1.9));ctx.save();ctx.translate(lx+w/2,bob);ctx.rotate(tilt);ctx.globalAlpha=Math.max(0,la);ctx.strokeStyle='#2c241c';ctx.lineWidth=2.2;ctx.strokeText(ch,0,0);ctx.fillStyle='#e8d7b4';ctx.fillText(ch,0,0);ctx.restore();lx+=w});ctx.restore()};if(game.upgrades?.loEmblem){const ph=t%8.5,fa=ph<1.4?ph/1.4:ph<5.4?1:ph<8.5?(8.5-ph)/3.1:0;if(fa>0)loDecal('LO!',fa*.55,-6,30,0)}}if(game.upgrades?.sacredCowling){ctx.save();ctx.translate(x,y);ctx.rotate(game.a);ctx.globalAlpha=.8;ctx.lineJoin='round';ctx.lineWidth=1.4;ctx.strokeStyle='#2c241c';for(const side of [-1,1]){ctx.fillStyle='#e9e4d0';ctx.beginPath();ctx.ellipse(25,side*7.5,5.2,3.4,side*-.25,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#201a12';ctx.beginPath();ctx.arc(26.5,side*7.5,1.8,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#e8d7b4';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(23,side*3.5);ctx.quadraticCurveTo(18,side*8,11,side*10.5);ctx.stroke();ctx.strokeStyle='#2c241c';ctx.lineWidth=1.4}ctx.restore()}ctx.restore();drawPilotPassives(game,x,y,t,point);if(game.muzzleFlash>0&&game.reloadTime===0){for(let gun=0;gun<game.weapon.guns;gun++){if(['huffzky','mckeever'].includes(game.pilot))continue;const o=game.weapon.bidirectional?0:(gun-(game.weapon.guns-1)/2)*8,ga=game.gunDirection(gun),mx=game.pilot==='huffzky'&&gun===1?x-Math.cos(game.a)*23:x+Math.cos(ga)*25-Math.sin(ga)*o,my=game.pilot==='huffzky'&&gun===1?y-Math.sin(game.a)*23:y+Math.sin(ga)*25+Math.cos(ga)*o;if(!fx(ctx,Math.cos(ga-game.a)<0?'muzzleRear':(game.cow37||game.motorCannon)?'muzzleHeavy':'muzzle',mx+Math.cos(ga)*7,my+Math.sin(ga)*7,22,22,ga)){ctx.fillStyle='#ffbb58';ctx.fillRect(mx-3,my-3,6,6);ctx.fillStyle='#fff4ca';ctx.fillRect(mx-1,my-1,3,3)}}}if(game.mauserFlash160>0){const ma=game.mauserAim156??game.a;fx(ctx,'muzzlePistol',x+Math.cos(ma)*22,y+Math.sin(ma)*22,26,26,ma,Math.min(1,game.mauserFlash160*8))}}
 let boss=game.enemies.find(e=>e.type==='boss');if(boss){let[x,y]=point(boss.x,boss.y);if(x<30||x>W-30||y<30||y>H-30){let a=Math.atan2(y-H/2,x-W/2),s=Math.min((W/2-22)/Math.abs(Math.cos(a)),(H/2-22)/Math.abs(Math.sin(a)));ctx.save();ctx.translate(W/2+Math.cos(a)*s,H/2+Math.sin(a)*s);ctx.rotate(a);ctx.fillStyle='#ffb189';ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-6,-6);ctx.lineTo(-6,6);ctx.fill();ctx.restore()}}}else{let x=W*.76+Math.sin(t*.3)*16,y=H*.49;planeSprite(ctx,x+23,y+30,-.62,aircraftKey(plane,false,pilot),2.1,false,true);planeSprite(ctx,x,y,-.62,aircraftKey(plane,false,pilot),2.1);planeSprite(ctx,W*.88,H*.74+Math.sin(t*.4)*10,-.62,aircraftKey(plane,false,pilot),.8,false,true);planeSprite(ctx,W*.88-15,H*.74-20+Math.sin(t*.4)*10,-.62,aircraftKey(plane,false,pilot),.8)}
 // Authored terrain clouds remain below combat; no late rectangular overlay.
 ctx.restore()}
function paintControl(id,key){const c=$(id).getContext('2d');c.clearRect(0,0,48,48);drawGameIcon(c,key,24,24,40)}
let hudAt=0,hudGunSig='';
function hud(){const _hn=performance.now();if(_hn-hudAt<90)return;hudAt=_hn;let g=game;let gun=$('ammoGunIcon');const gunSig=g.cow37?'cow37':'gun-'+(g.weapon.gunProfile||'spandau');if(gunSig!==hudGunSig){hudGunSig=gunSig;if(gun.width!==72)gun.width=72;gun.setAttribute('aria-label',g.weapon.name);gun.getContext('2d').clearRect(0,0,72,44);drawGameIcon(gun.getContext('2d'),gunSig,36,22,70)}const liveScore=g.priorityKills||0;if(g.mode!=='campaign'&&liveScore>best){best=liveScore;try{localStorage.setItem('headon-priority-best-161',best)}catch{}$('record').textContent='최고 기록 '+best}const reloading=g.reloadTime>0;$('ammoLabel').textContent=g.weapon.name+' × '+g.weapon.guns;$('ammoCount').textContent=(reloading?Math.floor(Math.max(0,Math.min(1,1-g.reloadTime/g.weapon.reload))*g.weapon.belt*g.weapon.guns):g.ammo.reduce((a,b)=>a+b,0))+' / '+g.weapon.belt*g.weapon.guns;/* display only: while reloading the count rolls up with the belt */$('ammoHud').dataset.status=reloading?'장전 '+g.reloadTime.toFixed(1)+'s':'탄약';$('ammoProgress').style.width=(reloading?(1-g.reloadTime/g.weapon.reload):g.ammo.reduce((a,b)=>a+b,0)/(g.weapon.belt*g.weapon.guns))*100+'%';$('ammoHud').classList.toggle('reloading',reloading);$('reload').disabled=g.state!=='playing'||reloading||g.ammo.every(n=>n===g.weapon.belt);$('reload').textContent=reloading?'장전':'R';$('reload').setAttribute('aria-label',reloading?'재장전 중 '+g.reloadTime.toFixed(1)+'초':'재장전 R');if($('healthCurrent151')){$('healthCurrent151').textContent=Math.ceil(g.hp);$('healthMax151').textContent=Math.round(g.maxHp)};$('healthBar').style.width=100*g.hp/g.maxHp+'%';$('healthBar').style.background=g.hp/g.maxHp<.3?'#ec7549':'#c6d590';$('clock').textContent=String(Math.floor(g.t/60)).padStart(2,'0')+':'+String(Math.floor(g.t%60)).padStart(2,'0');$('kills').textContent=g.priorityKills||0;$('level').textContent='LV. '+g.level;$('xpBar').style.width=Math.min(100,100*g.xp/g.need)+'%';$('skillBar').style.width=(1-g.cooldown/(g.skillCooldown()))*100+'%';$('skillStatus').textContent=g.skillTime>0?'액티브 발동 중':g.cooldown>0?`${g.cooldown.toFixed(1)}초 후 사용 가능`:'액티브 준비 완료';$('skillButtonText').textContent='액티브';$('skillButtonState').textContent=g.cooldown>0?`${Math.ceil(g.cooldown)}초`:'준비';$('touchSkill').disabled=g.cooldown>0||g.state!=='playing';$('touchSkill').style.setProperty('--ready',1-g.cooldown/g.skillCooldown());$('touchEvade').style.setProperty('--ready',1-Math.min(1,g.evadeCooldown/(8*(g.evadeCooldownMult||1))));$('maneuverButtonText').textContent='선회기동';$('maneuverButtonState').textContent=g.evadeCooldown>0?`${Math.ceil(g.evadeCooldown)}초`:'준비';$('touchEvade').disabled=g.evadeCooldown>0||g.state!=='playing'}
let frameErrors=0,frameFatalShown=false;
function reportFrameFatal(err){
 if(frameFatalShown)return;frameFatalShown=true;
 const bar=document.createElement('div');bar.style.cssText='position:fixed;left:0;right:0;top:0;z-index:9999;background:#3a1010;color:#f4d7d7;padding:10px 14px;font:13px/1.5 monospace;border-bottom:2px solid #c96a5a;display:flex;gap:12px;align-items:center';
 const msg=document.createElement('span');msg.textContent=(getLocale?.()==='en'?'Simulation error — please reload.':'시뮬레이션 오류 — 새로고침 해주세요.')+' ('+((err&&err.message)||err)+')';
 const btn=document.createElement('button');btn.textContent=getLocale?.()==='en'?'Reload':'새로고침';btn.style.cssText='background:#c96a5a;border:0;color:#1d0a0a;padding:4px 12px;font:inherit;cursor:pointer';btn.onclick=()=>location.reload();
 bar.append(msg,btn);document.body.append(bar);
}
const stepGame=(g,dt,input)=>{const n=Math.max(1,Math.min(2,Math.ceil(dt/.034)));for(let i=0;i<n;i++)g.update(dt/n,input)};
function frameInner(now){try{let dt=Math.min(.12,(now-last)/1000||.016);last=now;if(regionTransitionUntil&&now>=regionTransitionUntil&&(regionTransitionAssetsReady||now>=regionTransitionUntil+6000)){regionTransitionUntil=0;show('regionTransition',false)}const transitioning=!!game&&regionTransitionUntil>0;setSfxPaused(document.hidden||transitioning||game?.state==='paused');gamepadInput.setFeedbackEnabled(!document.hidden&&!transitioning&&game?.state==='playing');if(transitioning){requestAnimationFrame(frame);return}if(game?.mode==='coop2'){gamepadInput.poll(false);syncGamepadUi('keyboard');game.viewWidth=W;game.viewHeight=H;if(!transitioning){const inputs=coopInput.inputs();if(game.online)onlineLobby.input(game,inputs,joy);stepGame(game,dt,inputs);coopEvents();if(game.state==='upgrade'&&$('modal').classList.contains('hidden')&&game.activeUpgrade)showCoopUpgrade(game.activeUpgrade)}coopHud();relicCooldownTick();drawCoop(ctx,game,W,H,{terrain:(x,y,w,h)=>paintRegion(game.worldRegion(),x,y,w,h),drawZeppelin,drawFieldArt,fieldArt,fieldArtImg,groundLayer:()=>{const wp=(x,y)=>[x,y];drawFleetLayer(ctx,game,{point:wp});drawTrenchLayer(ctx,game,{point:wp});drawCityAirLayer(ctx,game,{point:wp})}});drawLegendaryDefenseOverlay(game,ctx,W,H);drawStageBoss(ctx,game,W,H,{drawZeppelin,drawFieldArt,layer:'hazards'});const _cz=game.camera?.zoom||1;if(game){drawCloudCover(ctx,game,{point:(x,y)=>[(x-game.x)*_cz+W/2,(y-game.y)*_cz+H/2],scale:_cz,region:game.worldRegion?.()})}updateStageBossHud(game);drawHeadOnFeedback(ctx,game,W,H,sfx);stageBossCutinCheck();show('bossCutin',game.state==='playing'&&performance.now()>=bossCardFrom&&performance.now()<bossCutinUntil&&!bossCutinHeld());requestAnimationFrame(frame);return}if(!game||(game.state==='playing'&&!transitioning))ambient+=dt;if(game&&!transitioning){let dx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),dy=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0),controller=gamepadInput.poll(true),angle;if(joy!=null){gamepadInput.useTouch();controller.inputMode='touch';angle=joy}else if(dx||dy){gamepadInput.useKeyboard();controller.inputMode='keyboard';angle=Math.atan2(dy,dx)}else if(controller.inputMode==='gamepad'&&(controller.moveX||controller.moveY))angle=Math.atan2(controller.moveY,controller.moveX);if(game.testMode&&game.worldRegion()===13&&game.maanOrbit){const mb=[...game.stageBoss?.stages.encounter?.bodies.values()||[]].find(b=>b.layout);if(mb&&mb.entryAge>=mb.entryDuration){const ox=mb.x-game.x,oy=mb.y-game.y,od=Math.hypot(ox,oy);angle=Math.atan2(oy,ox)+Math.PI/2-Math.max(-.8,Math.min(.8,(od-170)/170));}}syncGamepadUi(controller.inputMode);if(controller.inputMode==='gamepad'){if(controller.reloadJustPressed)game.reload();if(controller.activeJustPressed)game.skill();if(controller.maneuverJustPressed)game.evade();if(controller.pauseJustPressed)pause()}game.viewWidth=W;game.viewHeight=H;stepGame(game,dt,{angle,moveX:controller.moveX,moveY:controller.moveY,fireHeld:controller.inputMode==='gamepad'?controller.fireHeld:undefined,inputMode:controller.inputMode});events();hud();if(game.state==='upgrade'&&$('modal').classList.contains('hidden'))showUpgradeModal()}stageBossCutinCheck();show('bossCutin',!!game&&game.state==='playing'&&performance.now()>=bossCardFrom&&performance.now()<bossCutinUntil&&!bossCutinHeld());draw(ambient);drawLegendaryDefenseOverlay(game,ctx,W,H);drawSupport();drawCampaign(ctx,game,W,H);drawSunStrike(ctx,game,W,H);drawStageBoss(ctx,game,W,H,{drawZeppelin,drawFieldArt,layer:'hazards'});if(game){drawCloudCover(ctx,game,{point:(x,y)=>[x-game.x+W/2,y-game.y+H/2],scale:1,region:game.worldRegion?.()})}updateStageBossHud(game);drawHeadOnFeedback(ctx,game,W,H,sfx);if(game?.mode==='campaign')campaignHud();if(now>toastUntil)show('toast',false);if(now>cutinUntil||!game||['lost','won'].includes(game.state))show('skillCutin',false);requestAnimationFrame(frame)}catch(frameErr){console.error('[headon]',frameErr);if(++frameErrors>20)reportFrameFatal(frameErr);else requestAnimationFrame(frame)}}function frame(now){
 // Retain fractional frame time: resetting to now undershoots the target on
 // 90/144 Hz displays. Allow 1 ms of rAF timestamp jitter at the deadline.
 if(mobileDisplay&&!hiFpsMode){
  const cap=batterySaver?24:1000/60,gap=now-renderStamp;
  if(gap>=0&&gap<cap-1){requestAnimationFrame(frame);return}
  renderStamp=gap>=0&&gap<cap*4?renderStamp+Math.max(1,Math.floor((gap+1)/cap))*cap:now;
 }else renderStamp=now;
 // Skipped display callbacks must not count as cheap rendered frames or
 // trigger canvas reallocations in the adaptive-resolution controller.
 const __s=performance.now();if(__perfResize){__perfResize=false;resize()}
 frameInner(now);__perfFrame(performance.now()-__s)
}roster();syncStartHint();resize();requestAnimationFrame(frame);

function drawSupport(){if(!game)return;let cx=game.x,cy=game.y;const point=(x,y)=>{_ptShare[0]=x-cx+W/2;_ptShare[1]=y-cy+H/2;return _ptShare};for(let a of (game.allies||[])){if(!a.plane||!PLANES[a.plane])continue;let[x,y]=point(a.x,a.y),allyKey=game.pilot==='goering'?'goering_fokkerd7':a.plane==='fokker'?'fokker_standard':a.plane;ctx.globalAlpha=.95;planeSprite(ctx,x+12,y+20,a.a,allyKey,.78,false,true);planeSprite(ctx,x,y,a.a,allyKey,.78,false,false,a.hitFlash||0,a.hp!=null&&a.hp<=a.maxHp*.5);ctx.globalAlpha=1}}hangarArtReady.then(()=>roster());aircraftReady.then(()=>roster());

portraitsReady.then(()=>{roster();applyPilotPortrait('cutinPortrait')});

// A low, repeating rotary pulse gives the aircraft a stronger propeller presence.
// Flight feedback updates engine load from actual speed/turn/damage in simulation time.

// Sparse, quiet ambience shares the same bounded/disposable SFX bus.
setInterval(()=>{if(game?.state==='playing'&&!document.hidden&&!regionTransitionUntil)sfx('environment',game.worldRegion())},7200);
document.addEventListener('click',event=>{if(!document.hidden&&event.target.closest?.('#hangar button,#mainOperations button,#mainSettings button,#modalActions button'))sfx('uiSelect')});

// Aircraft are rendered at their actual combat positions, including commanded wings.
const _drawFormationBase=draw;
draw=function(t){
  const enemies=game?.enemies;
  let hiddenZeppelins=null;
  if(enemies)for(const e of enemies)if(e.type==='zeppelin'){
    hiddenZeppelins=enemies.filter(x=>x.type==='zeppelin');
    game.enemies=enemies.filter(x=>x.type!=='zeppelin');
    break;
  }
  _drawFormationBase(t);
  if(hiddenZeppelins&&game){
    const cx=game.x,cy=game.y,point=(x,y)=>{_ptShare[0]=x-cx+W/2;_ptShare[1]=y-cy+H/2;return _ptShare};
    for(const e of hiddenZeppelins){const [x,y]=point(e.x,e.y);if(x<-320||x>W+320||y<-320||y>H+320)continue;drawZeppelin(ctx,x,y,e.a,.92,e.hitFlash>0);ctx.fillStyle='#242c25';ctx.fillRect(x-55,y-65,110,4);ctx.fillStyle='#e7835c';ctx.fillRect(x-55,y-65,110*e.hp/e.maxHp,4)}
    game.enemies.push(...hiddenZeppelins);
  }
};
const _eventsFormationBase=events;
events=()=>{
  _eventsFormationBase();
  if(pilot==='collishaw'&&game?.skillTime>0){show('skillCutin',false);cutinUntil=0}
};

// The permanent wingman is intentionally a unique-tier choice whenever it appears.
const _modalWingman=modal;
modal=(tag,title,text,buttons)=>{
  if(tag.startsWith('LEVEL'))buttons=buttons.map(b=>b.upgradeId==='wingman'?{...b,label:b.label.replace(/\[(일반|매직|레어)\]/,'[유니크]'),rarity:'unique'}:b);
  return _modalWingman(tag,title,text,buttons);
};

// Start the score with a user gesture (required by mobile audio policies) and
// switch to the sharper ace motif whenever an ace or boss is on the field.
const _startWithMusic=start;start=(...args)=>{music.reset();music.unlock();_startWithMusic(...args);setBgmMode()};
const _returnWithMusic=returnHangar;returnHangar=()=>{_returnWithMusic();stopBgm()};
const _soundToggle=$('sound').onclick;$('sound').onclick=()=>{music.unlock();_soundToggle();if(muted)stopBgm();else setBgmMode()};
$('start').onclick=sortie;
setInterval(()=>{const off=document.hidden||regionTransitionUntil;setBgmMode(off?'idle':undefined)},240);
document.addEventListener('visibilitychange',()=>{if(document.hidden){setSfxPaused(true);stopBgm();if(game?.state==='playing')pause();keys={};joy=null;coopInput.reset();gamepadInput.reset()}else last=performance.now()});

// Replace the legacy score ladder without redeclaring its module bindings.
saveRanking=()=>{if(game?.mode==='campaign'||game?.mode==='coop2')return [];let rows=[];try{rows=JSON.parse(localStorage.getItem('headon-priority-ranking-161')||'[]')}catch{}rows.push({name:nickname||t('pilot.anonymous'),score:game.recordedKills?game.recordedKills():(game.priorityKills||0),time:Math.floor(game.t),pilot});rows.sort((a,b)=>b.score-a.score);rows=rows.slice(0,10);try{localStorage.setItem('headon-priority-ranking-161',JSON.stringify(rows))}catch{}return rows};
rankingText=rows=>rows.length===0?t('ranking.emptyPriority'):rows.map((r,i)=>`${[t('ranking.medal.centralDisplay'),t('ranking.medal.ironCross'),t('ranking.medal.ententeDisplay')][i]||String(i+1)+'.'} ${r.name} · ${pilotName(r.pilot,PILOTS[r.pilot]?.name||r.pilot||t('ranking.missingPilot'))} — ${t('ranking.rowPriority',{rank:i+1,name:r.name,pilot:pilotName(r.pilot,PILOTS[r.pilot]?.name||r.pilot||t('ranking.missingPilot')),score:Number(r.score).toLocaleString()}).split(' — ').at(-1)}`).join('\n');
function renderRankingMedals(rows,heading=t('ranking.serverPriority')){
 const box=$('modalText');box.replaceChildren();const title=document.createElement('strong');title.textContent=heading;box.append(title);
 if(!rows.length){const empty=document.createElement('p');empty.textContent=t('ranking.emptyPriority');box.append(empty);return}
 const list=document.createElement('ol');list.className='ranking-medal-list';rows.forEach((r,i)=>{const row=document.createElement('li'),badge=document.createElement(i===0?'img':'canvas');badge.className='ranking-medal';
  if(i===0){badge.src='./medal55.webp?v=ui5&b=326';badge.alt='1 · '+t('ranking.medal.centralDisplay');}else{badge.width=42;badge.height=42;badge.setAttribute('aria-label',(i+1)+' · '+(i===1?t('ranking.medal.ironCross'):t('ranking.medal.ententeDisplay')));drawGameIcon(badge.getContext('2d'),i===1?'ironCross':'victoriaCross',21,21,38);}
  const text=document.createElement('span');text.textContent=t('ranking.rowPriority',{rank:i+1,name:r.name,pilot:pilotName(r.pilot,PILOTS[r.pilot]?.name||r.pilot||t('ranking.missingPilot')),score:Number(r.score).toLocaleString()});row.append(badge,text);list.append(row);});box.append(list);
}
syncServerRanking=async()=>{const run=game;if(game?.mode==='campaign'||game?.mode==='coop2')return;try{const res=await fetch('/api/rankings',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:nickname,score:game.recordedKills?game.recordedKills():(game.priorityKills||0),pilot,season:'priority-340'})});if(!res.ok)return;const rows=await res.json();if(game!==run)return;renderRankingMedals(rows)}catch{}};


const fieldArt={};const FIELD_ART_FILE={flak:'flak-burst',gust:'gust',stork:'portrait-stork'};
const FIELD_ART_PRELOAD=['staaken','gotha','aeg_g4','friedrichshafen_g3','handley-page','voisin8','caudron_g4','fe2b','breguet14','felixstowe_f2'];
const fieldRim={};
function fieldArtImg(key){if(!key)return null;let im=fieldArt[key];if(im&&im.complete&&!im.naturalWidth){const now=performance.now();if(now-(fieldArt[key+'#at']||0)<1500)return null;fieldArt[key+'#at']=now;const tries=(fieldArt[key+'#retry']||0)+1;fieldArt[key+'#retry']=tries;im=new Image();im.src=`./${FIELD_ART_FILE[key]||key}.webp?v=ui5&b=326&r=${tries}`;im.decode?.().catch(()=>{});fieldArt[key]=im;fieldRim[key]=undefined}else if(!im){im=new Image();im.src=`./${FIELD_ART_FILE[key]||key}.webp?v=ui5&b=326`;im.decode?.().catch(()=>{});fieldArt[key]=im}return im.naturalWidth?im:null}
for(const key of[...Object.keys(FIELD_ART_FILE),...FIELD_ART_PRELOAD])fieldArtImg(key);
function rimmedFieldArt(key){const im=fieldArt[key];if(!im?.naturalWidth)return null;let r=fieldRim[key];if(r)return r;const c=document.createElement('canvas');c.width=im.naturalWidth+6;c.height=im.naturalHeight+6;const rc=c.getContext('2d');const sil=document.createElement('canvas');sil.width=c.width;sil.height=c.height;const sx=sil.getContext('2d');sx.drawImage(im,3,3);sx.globalCompositeOperation='source-in';sx.fillStyle='#140f08';sx.fillRect(0,0,c.width,c.height);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(dx*dx+dy*dy<=5)rc.drawImage(sil,dx,dy);rc.drawImage(im,3,3);r={c};fieldRim[key]=r;return r}
function drawFieldArt(key,x,y,w,h,a=0,alpha=1,flip=false){const im=fieldArtImg(key);if(!im)return;ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(a);if(flip)ctx.scale(-1,1);ctx.globalAlpha=alpha;ctx.imageSmoothingEnabled=false;if(!FIELD_ART_FILE[key]){const rim=rimmedFieldArt(key);if(rim){ctx.drawImage(rim.c,-w/2-3*w/im.naturalWidth,-h/2-3*h/im.naturalHeight,w+6*w/im.naturalWidth,h+6*h/im.naturalHeight);ctx.restore();return}}ctx.drawImage(im,-w/2,-h/2,w,h);ctx.restore()}
const _fieldSupport=drawSupport;
drawSupport=()=>{
 _fieldSupport();if(!game)return;
 const point=(x,y)=>{_ptShare[0]=x-game.x+W/2;_ptShare[1]=y-game.y+H/2;return _ptShare};
 for(const f of game.hostileMinefields||[]){const[x,y]=point(f.x,f.y);ctx.save();if(!f.encounterId){ctx.strokeStyle=f.warning>0?'#ffe0a199':'#e58b6c88';ctx.lineWidth=2;ctx.setLineDash([6,9]);ctx.beginPath();ctx.arc(x,y,f.radius,0,6.283);ctx.stroke();ctx.setLineDash([]);ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#ffd2a9';ctx.fillText(f.warning>0?(getLocale()==='en'?'Mine active '+f.warning.toFixed(1)+'s':'기뢰 활성화 '+f.warning.toFixed(1)+'초'):(getLocale()==='en'?'Minefield':'기뢰지대'),x,y-f.radius-9)}for(const m of f.mines){if(m.dead)continue;const[mx,my]=point(m.x,m.y);if(mx<-80||mx>W+80||my<-80||my>H+80)continue;drawDrachenMine(ctx,mx,my,64,64);ctx.strokeStyle=f.warning>0?'#ffe0a188':'#ff876e';ctx.beginPath();ctx.arc(mx,my,18,0,6.283);ctx.stroke()}ctx.restore()}
 for(const b of game.bullets){if(!b.flak)continue;const [x,y]=point(b.x,b.y);if(x<-80||x>W+80||y<-80||y>H+80)continue;drawFieldArt('flak',x,y,42,42,ambient*.2,.9);drawEnemyProjectile(ctx,b,x,y,ambient)}
 for(const g of game.gusts||[]){const [x,y]=point(g.x,g.y);if(x<-180||x>W+180||y<-180||y>H+180)continue;if(drawGust3(ctx,g,x,y,ambient))continue;const opacity=Math.min(.85,g.life,6-g.life);drawFieldArt('gust',x,y,g.radius*2.6,g.radius*2.6,g.a+ambient*.15,opacity);if(fxReady('windStreak'))for(let i=0;i<3;i++){const wa=(g.a||0)+i*1.1+ambient*.4;fx(ctx,'windStreak',x+Math.cos(wa)*g.radius*.32,y+Math.sin(wa)*g.radius*.32,g.radius*1.7,g.radius*.5,wa,opacity*.55)}}
};

function drawUpgradeIcon(canvas,id,owner=game){
 const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);c.imageSmoothingEnabled=false;
 const faction=owner&&PLANES[owner.plane]?.faction==='entente'?'entente':'central',key=id==='ironCross'?id+'-'+faction:id==='cooldown'?'cooldown-'+faction:id;
 drawGameIcon(c,key,56,44,76);
}
const _drawHeavyAircraft=draw;
draw=t=>{
 _drawHeavyAircraft(t);if(!game)return;
 for(const e of game.enemies){if(!e.heavyBomber)continue;
  const x=e.x-game.x+W/2,y=e.y-game.y+H/2,im=fieldArtImg(e.airframe);
  const w=e.airframe==='staaken'?178:158,h=im?.naturalWidth?w*im.naturalHeight/im.naturalWidth:w*.62;
  if(im?.naturalWidth)drawFieldArt(e.airframe,x,y,w,h,e.a+Math.PI/2,e.hitFlash>0?.65:1)
  else{ctx.save();ctx.globalAlpha=.9;planeSprite(ctx,x,y,e.a,'gotha',2.1,true,false,e.hitFlash||0);ctx.restore()}
  // Name + HP bar stay inside the screen while the bomber is (partly) on it, instead of being cut at the edge.
  const nm=unitNameEN(e.name);ctx.font='11px monospace';const onX=x>-w/2&&x<W+w/2,tw=measureCached(ctx,nm),lx=onX?Math.max(tw/2+4,Math.min(W-tw/2-4,x)):x,bx=onX?Math.max(52,Math.min(W-52,x)):x;
  ctx.fillStyle='#171f23';ctx.fillRect(bx-48,y-h/2-16,96,5);
  ctx.fillStyle='#ed9d66';ctx.fillRect(bx-48,y-h/2-16,96*Math.max(0,e.hp/e.maxHp),5);
  ctx.fillStyle='#ffe3aa';ctx.textAlign='center';ctx.fillText(nm,lx,y-h/2-22);
 }
};

// Layered tracers, gun flashes and telegraphed bombing use existing combat art.
const _drawCombatFX=draw;
draw=t=>{
 _drawCombatFX(t);if(!game)return;
 const point=(x,y)=>{_ptShare[0]=x-game.x+W/2;_ptShare[1]=y-game.y+H/2;return _ptShare};
 ctx.save();
 for(const b of game.bullets){
  const [x,y]=point(b.x,b.y);
  if(x<-100||x>W+100||y<-100||y>H+100)continue;
  if(b.rocket){const a=Math.atan2(b.vy,b.vx);if(FX56){fx(ctx,'smokePuff',x-Math.cos(a)*19,y-Math.sin(a)*19,12,10,0,.22)}else{ctx.strokeStyle='#ff982baa';ctx.lineWidth=b.special?5:3;ctx.beginPath();ctx.moveTo(x-Math.cos(a)*15,y-Math.sin(a)*15);ctx.lineTo(x-Math.cos(a)*34,y-Math.sin(a)*34);ctx.stroke()}continue}
  if(!b.enemy||b.flak)continue;
  drawEnemyProjectile(ctx,b,x,y,t);
  if(b.hostileRocket){const a=Math.atan2(b.vy,b.vx);fxTint(ctx,'smokePuff','#ff9a4a',x-Math.cos(a)*14,y-Math.sin(a)*14,18,15);if(!fxTint(ctx,'rocket','#ff7a55',x,y,52,16,a)){ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle='#f2a144';ctx.beginPath();ctx.moveTo(-14,0);ctx.lineTo(-26,-4);ctx.lineTo(-26,4);ctx.closePath();ctx.fill();ctx.fillStyle='#4a3f30';ctx.beginPath();ctx.ellipse(0,0,14,4.5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#8a2f22';ctx.beginPath();ctx.ellipse(9,0,4.5,3.4,0,0,Math.PI*2);ctx.fill();ctx.restore()}}

 }
 for(const e of game.enemies){if(!(e.muzzleFlash>0))continue;
  for(const offset of e.navalVessel||e.type==='zeppelin'?[-95,0,95]:e.heavyBomber?[-42,42]:(WEAPONS[e.escortPlane||e.bossPlane]?.guns??2)>=2?[-8,8]:[0]){
   const hull=e.navalVessel||e.type==='zeppelin';const [x,y]=point(e.x+(hull?Math.cos(e.a)*offset:Math.cos(e.a)*22-Math.sin(e.a)*offset),e.y+(hull?Math.sin(e.a)*offset:Math.sin(e.a)*22+Math.cos(e.a)*offset));
   ctx.save();ctx.translate(x,y);ctx.rotate(e.gunAim??e.a);ctx.globalAlpha=Math.min(1,e.muzzleFlash*10);
   if(!fx(ctx,hull||e.groundEscort?'muzzleHeavy':'muzzle',16,0,hull?44:30,hull?44:30)){ctx.fillStyle='#ff922b';ctx.beginPath();ctx.moveTo(-3,-6);ctx.lineTo(25,0);ctx.lineTo(-3,6);ctx.fill();ctx.fillStyle='#fff4ce';ctx.fillRect(0,-2,14,4);}ctx.restore();
  }
 }
 for(const z of game.bombZones||[]){
  const [x,y]=point(z.x,z.y),p=1-z.delay/z.maxDelay;
  ctx.fillStyle='#ff3c202a';ctx.strokeStyle='#ff855a';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(x,y,z.radius,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.arc(x,y,z.radius*(1-p),0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x-10,y);ctx.lineTo(x+10,y);ctx.moveTo(x,y-10);ctx.lineTo(x,y+10);ctx.stroke();
  const [bx,by]=point(z.sx+(z.x-z.sx)*p,z.sy+(z.y-z.sy)*p);
  if(FXS&&fxsBombFall(ctx,(X,Y,k,a)=>fx(ctx,'bomb',X,Y,40*k,20*k,a),...point(z.sx,z.sy),x,y,p)){}else if(!fx(ctx,'bomb',bx,by,40,20,Math.atan2(z.y-z.sy,z.x-z.sx)))drawEquipment(ctx,'rocket',bx,by,Math.atan2(z.y-z.sy,z.x-z.sx)+Math.PI/2,38);
 }
 fxsBoomTail(ctx,game.combatFX,point,game.t||0);
 for(const f of game.combatFX||[]){const[x,y]=point(f.x,f.y);const _m=(f.radius||60)*2.6+80;if(x<-_m||x>W+_m||y<-_m||y>H+_m)continue;const p=1-f.life/f.maxLife;
  if(f.amatol){drawAmatolBlast(ctx,f,x,y);continue}
  if(f.grenade){drawGrenadeBlast(ctx,f,x,y);continue}
  if(!drawFxExplosion(ctx,f,x,y))drawFieldArt('flak',x,y,f.radius*(1+p)*2,f.radius*(1+p)*2,0,Math.min(1,f.life*3));
  // Explosion art supplies hit confirmation; warning circles are drawn before impact.
 }
 ctx.restore();
};
const _eventsCombat=events;
let lastEnemyAudio=0;
events=()=>{
 for(const e of game.events){
  const eventNow=performance.now();
  if(e.type==='bombWarning'){$('toast').textContent=e.text;show('toast');toastUntil=eventNow+1800}
  const enemyAudio=e.type==='heavyShot'||e.type==='enemyShot'||e.type==='explosion'||e.type==='rocketSalvo'||e.type==='mineSalvo';
  if(enemyAudio&&eventNow-lastEnemyAudio>110){
   lastEnemyAudio=eventNow;sfx(e.type==='explosion'?'explosion':e.type==='rocketSalvo'?'rocket':e.type==='mineSalvo'?'flak':e.type==='heavyShot'?'heavyShot':'enemyShot');
  }
 }
 _eventsCombat();
};


const xpGem=null;
const _drawCharge=draw;
let chargeStamp=0,chargeWasOn=false;
draw=t=>{
 _drawCharge(t);if(!(game?.chargeTime>0)){chargeWasOn=false;return}
 if(FXS&&game.pilot==='baracca')return; // lance-charge FX (passive-fx.js) replaces this overlay
 if(!chargeWasOn){chargeWasOn=true;chargeStamp=performance.now()}
 const age=(performance.now()-chargeStamp)/1000;
 const a=game.chargeAngle,ox=Math.cos(a),oy=Math.sin(a),nx=-oy,ny=ox,ccx=W/2,ccy=H/2,fade=Math.min(1,game.chargeTime*4);
 ctx.save();
 ctx.globalCompositeOperation='lighter';
 if(age<.45){const rr=30+age*640,ra=(1-age/.45)*.8;ctx.strokeStyle=`rgba(255,228,160,${ra})`;ctx.lineWidth=4-3*age/.45;ctx.beginPath();ctx.arc(ccx,ccy,rr,0,Math.PI*2);ctx.stroke()}
 const wakeG=ctx.createLinearGradient(ccx-ox*10,ccy-oy*10,ccx-ox*190,ccy-oy*190);
 wakeG.addColorStop(0,`rgba(255,214,140,${.34*fade})`);wakeG.addColorStop(1,'rgba(255,214,140,0)');
 ctx.fillStyle=wakeG;
 for(const s of[-1,1]){ctx.beginPath();
  ctx.moveTo(ccx+nx*s*14-ox*6,ccy+ny*s*14-oy*6);
  ctx.lineTo(ccx+nx*s*52-ox*150,ccy+ny*s*52-oy*150);
  ctx.lineTo(ccx+nx*s*38-ox*190,ccy+ny*s*38-oy*190);
  ctx.lineTo(ccx+nx*s*8-ox*30,ccy+ny*s*8-oy*30);ctx.closePath();ctx.fill()}
 const tipX=ccx+ox*66,tipY=ccy+oy*66;
 fxGlow(tipX,tipY,18,`rgba(255,230,170,${.5*fade})`);
 ctx.save();ctx.translate(tipX,tipY);ctx.rotate(a*2+t*7);
 ctx.globalAlpha=.95*fade;ctx.strokeStyle='#fff2c8';ctx.lineWidth=3.2;ctx.lineCap='round';
 const gap=.62;
 ctx.beginPath();ctx.arc(0,0,9.5,-Math.PI/2+gap/2,Math.PI*1.5-gap/2);ctx.stroke();
 ctx.fillStyle='#fff2c8';for(const e of[-Math.PI/2+gap/2,Math.PI*1.5-gap/2]){ctx.beginPath();ctx.arc(Math.cos(e)*9.5,Math.sin(e)*9.5,2.1,0,Math.PI*2);ctx.fill()}
 ctx.restore();
 for(let i=0;i<6;i++){const ph=(t*3.1+i*.37)%1;
  const s=i%2?1:-1,ex=ccx-ox*(20+ph*150)+nx*s*(16+ph*44),ey=ccy-oy*(20+ph*150)+ny*s*(16+ph*44);
  ctx.globalAlpha=(1-ph)*.8*fade;ctx.fillStyle=i%3?'#ffd98a':'#ff9d5c';
  ctx.beginPath();ctx.arc(ex,ey,2.6*(1-ph)+.9,0,Math.PI*2);ctx.fill()}
 ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;

 ctx.restore();
};

const _drawHarborGuide=draw;
draw=t=>{
 _drawHarborGuide(t);
 const r=game?.navalRoute;
 if(!r||game.worldRegion?.()!==7||game.stageBoss?.stages.phase==='boss')return;
 const hx=Math.cos(r.a),hy=Math.sin(r.a),nx=-hy,ny=hx;
 const point=(x,y)=>{_ptShare[0]=x-game.x+W/2;_ptShare[1]=y-game.y+H/2;return _ptShare};
 ctx.save();
 ctx.strokeStyle='#8fd0d1';ctx.lineWidth=2.5;ctx.lineCap='round';
 const forward=(game.x-r.x)*hx+(game.y-r.y)*hy;
 for(let i=1;i<=4;i++){
  const[cx,cy]=point(r.x+hx*(forward+i*130),r.y+hy*(forward+i*130));
  ctx.save();ctx.translate(cx,cy);ctx.rotate(r.a);ctx.globalAlpha=.6-.11*i;
  ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-5,-9);ctx.moveTo(10,0);ctx.lineTo(-5,9);ctx.stroke();ctx.restore();
 }
 const bounds=stageBossBounds(game);
 const fwd=Math.max(500,Math.min(700,(bounds.bottom-bounds.top)*.9)),side=Math.max(340,Math.min(460,(bounds.right-bounds.left)*.55));
 const along=(r.maxForward||0)+fwd;
 const bx=r.x+hx*along+nx*side,by=r.y+hy*along+ny*side;
 const[sx,sy]=point(bx,by),dx=sx-W/2,dy=sy-H/2,edge=34;
 ctx.globalAlpha=.85;ctx.strokeStyle='#ff855a';ctx.fillStyle='#ff855a';
 if(sx>edge&&sx<W-edge&&sy>edge&&sy<H-edge){
  ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx,sy,26,0,Math.PI*2);ctx.stroke();
 }else{
  const angle=Math.atan2(dy,dx),sc=Math.min((W/2-edge)/Math.max(.001,Math.abs(Math.cos(angle))),(H/2-edge)/Math.max(.001,Math.abs(Math.sin(angle))));
  ctx.save();ctx.translate(W/2+Math.cos(angle)*sc,H/2+Math.sin(angle)*sc);ctx.rotate(angle);
  ctx.beginPath();ctx.moveTo(11,0);ctx.lineTo(-7,-6);ctx.lineTo(-4,0);ctx.lineTo(-7,6);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.restore();
 }
 ctx.restore();
};

// Same guide on the Gallipoli approach: forward chevrons along the strait
// course plus an off-screen edge arrow toward the cliff fortress.
{
const _drawGallipoliGuide=draw;
draw=t=>{
 _drawGallipoliGuide(t);
 const r=game?.gallipoliRoute;
 if(!r||game.worldRegion?.()!==14||game.stageBoss?.stages.phase==='boss')return;
 const hx=Math.cos(r.a),hy=Math.sin(r.a);
 const point=(x,y)=>{_ptShare[0]=x-game.x+W/2;_ptShare[1]=y-game.y+H/2;return _ptShare};
 ctx.save();
 ctx.strokeStyle='#8fd0d1';ctx.lineWidth=2.5;ctx.lineCap='round';
 const forward=(game.x-r.x)*hx+(game.y-r.y)*hy;
 for(let i=1;i<=4;i++){
  const[cx,cy]=point(r.x+hx*(forward+i*130),r.y+hy*(forward+i*130));
  ctx.save();ctx.translate(cx,cy);ctx.rotate(r.a);ctx.globalAlpha=.6-.11*i;
  ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-5,-9);ctx.moveTo(10,0);ctx.lineTo(-5,9);ctx.stroke();ctx.restore();
 }
 const fort=gallipoliPoint(r,GALLIPOLI_ROUTE.fort-900,0);
 const[sx,sy]=point(fort.x,fort.y),dx=sx-W/2,dy=sy-H/2,edge=34;
 ctx.globalAlpha=.85;ctx.strokeStyle='#ff855a';ctx.fillStyle='#ff855a';
 if(sx>edge&&sx<W-edge&&sy>edge&&sy<H-edge){
  ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx,sy,26,0,Math.PI*2);ctx.stroke();
 }else{
  const angle=Math.atan2(dy,dx),sc=Math.min((W/2-edge)/Math.max(.001,Math.abs(Math.cos(angle))),(H/2-edge)/Math.max(.001,Math.abs(Math.sin(angle))));
  ctx.save();ctx.translate(W/2+Math.cos(angle)*sc,H/2+Math.sin(angle)*sc);ctx.rotate(angle);
  ctx.beginPath();ctx.moveTo(11,0);ctx.lineTo(-7,-6);ctx.lineTo(-4,0);ctx.lineTo(-7,6);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.restore();
 }
 ctx.restore();
};
}

const regionTextures={};for(const name of ['sea','trenches']){const im=new Image();im.src='./terrain-'+name+'.webp?v=ui5';regionTextures[name]=im}
const terrainAlpsAtlas=new Image();terrainAlpsAtlas.src='./terrain-alps-atlas.webp?v=ui5';
// The no-op constructors only keep the import-stripped offline smoke harness
// inert; the hosted module always resolves the supplied Alps implementation.
const TerrainRendererSafe=typeof TerrainRenderer==='undefined'?class{draw(){}}:TerrainRenderer;
const MountainFieldSafe=typeof MountainField==='undefined'?class{constructor(){this.query=()=>[];this.step=()=>{};this.draw=()=>{}}}:MountainField;
const terrainAlpsRenderer=new TerrainRendererSafe({atlas:terrainAlpsAtlas,detail:.72,tileSize:768});
const zeeWaterTile=new Image();zeeWaterTile.src='./terrain-zeebrugge-water.webp?v=ui5';
const zeebruggeHarborArt=new Image();zeebruggeHarborArt.src='./terrain-zeebrugge-route.webp?v=ui5';
let zeebruggeHarborBlend=null;
function harborLandmark(){
 if(!zeebruggeHarborArt.naturalWidth)return null;
 if(zeebruggeHarborBlend)return zeebruggeHarborBlend;
 const w=zeebruggeHarborArt.naturalWidth,h=zeebruggeHarborArt.naturalHeight,c=document.createElement('canvas');c.width=w;c.height=h;
 const g=c.getContext('2d');g.drawImage(zeebruggeHarborArt,0,0);
 g.globalCompositeOperation='destination-in';
 for(const vertical of [true,false]){
  const length=vertical?h:w,fade=length*.18,gradient=g.createLinearGradient(0,0,vertical?0:w,vertical?h:0);
  gradient.addColorStop(0,'rgba(0,0,0,0)');gradient.addColorStop(fade/length,'#000');gradient.addColorStop(1-fade/length,'#000');gradient.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=gradient;g.fillRect(0,0,w,h);
 }
 return zeebruggeHarborBlend=c;
}
const terrainKeys=['rural','sea','trenches','burning','city','sky','alps','zeebrugge','cambrai','arras','somme','london','verdun','maan'];
const _ruralTerrain=terrain;
function drawSeamlessRural(cx,cy,W,H){
 ctx.fillStyle='#758461';ctx.fillRect(0,0,W,H);const worldX=cx-W/2,worldY=cy-H/2;
 // Broad, continuous field strips: no grid cells, no repeated tile boundary.
 for(let band=-2;band<7;band++){const y=band*150-worldY%150-80;ctx.fillStyle=band%3===0?'#80906c':band%3===1?'#71805d':'#7a8965';ctx.beginPath();ctx.moveTo(-40,y);for(let x=-40;x<W+80;x+=70)ctx.lineTo(x,y+Math.sin((worldX+x)*.003+band)*18);ctx.lineTo(W+50,y+128);for(let x=W+50;x>-60;x-=70)ctx.lineTo(x,y+128+Math.sin((worldX+x)*.003+band)*18);ctx.closePath();ctx.fill()}
 ctx.fillStyle='#4f6b42';for(let i=0;i<26;i++){const x=(Math.sin((worldY+i*83)*.013)*.5+.5)*(W+80)-40,y=(i*97-worldY*.18)%(H+80)-40;ctx.fillRect(x,y,11,7);ctx.fillRect(x+4,y-4,7,6)}
 ctx.strokeStyle='#5d7d78';ctx.lineWidth=18;ctx.beginPath();for(let y=-30;y<H+40;y+=16){const wy=worldY+y,x=W*.61+Math.sin(wy*.0024)*88+Math.sin(wy*.006)*18;y<0?ctx.moveTo(x,y):ctx.lineTo(x,y)}ctx.stroke();ctx.strokeStyle='#a2b19377';ctx.lineWidth=2;ctx.stroke();
}
function paintZeebrugge(cx,cy,W,H){
 // One bounded route: open sea, an increasingly visible shoreline, then the
 // authored harbor landmark. All geometry remains fixed in world coordinates.
 const route=game?.navalRoute;
 const camera={x:cx-W/2,y:cy-H/2};
 ctx.fillStyle='#244450';ctx.fillRect(0,0,W,H);
 if(zeeWaterTile.naturalWidth){
  const tile=512;
  ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();ctx.imageSmoothingEnabled=true;
  for(let ty=Math.floor(camera.y/tile);ty<=Math.floor((camera.y+H)/tile);ty++)for(let tx=Math.floor(camera.x/tile);tx<=Math.floor((camera.x+W)/tile);tx++){
   const x=Math.floor(tx*tile-camera.x),y=Math.floor(ty*tile-camera.y);
   ctx.drawImage(zeeWaterTile,x-1,y-1,tile+2,tile+2);
  }
  ctx.restore();
 }
 else terrainAlpsRenderer.draw(ctx,{key:'sea',camera,width:W,height:H});
 // Tint the water before harbor landmarks and ships are drawn.
 applySeaColor(ctx,'zeebrugge',W,H);
 if(!route){applyTerrainAtmosphere(ctx,'zeebrugge',W,H);return;}
 const a=Number.isFinite(route.a)?route.a:-Math.PI/2,hx=Math.cos(a),hy=Math.sin(a),nx=-hy,ny=hx;
 const centerS=(cx-route.x)*hx+(cy-route.y)*hy,diag=Math.hypot(W,H),span=diag*1.15;
 const point=(s,n)=>[route.x+hx*s+nx*n-camera.x,route.y+hy*s+ny*n-camera.y];
 const halfAt=(s,side)=>harborRouteHalfWidth(s);
 const samples=18,s0=centerS-span,s1=centerS+span;
 const shore=side=>{const pts=[];for(let i=0;i<=samples;i++){const s=s0+(s1-s0)*i/samples;pts.push(point(s,side*halfAt(s,side)));}return pts;};
 const left=shore(-1),right=shore(1);
 const cell=760,first=Math.floor((s0-200)/cell)-1,last=Math.ceil((s1+200)/cell)+1;
 const landmark=harborLandmark();
 if(landmark){
  const p=point(12100,150),height=2400,width=height*landmark.width/landmark.height;
  if(p[0]>-width&&p[0]<W+width&&p[1]>-height&&p[1]<H+height){
   ctx.save();ctx.translate(...p);ctx.rotate(a+Math.PI*1.5);ctx.imageSmoothingEnabled=true;
   ctx.drawImage(landmark,-width/2,-height/2,width,height);ctx.restore();
  }
 }
 applyTerrainAtmosphere(ctx,'zeebrugge',W,H);
 for(let k=first;k<=last;k++){
  if(k%2)continue;const side=((k/2)&1)?1:-1,s=k*cell+250;if(s<5400||s>10400)continue;
  const n=side*(halfAt(s,side)+110),p=point(s,n);
  if(p[0]<-130||p[0]>W+130||p[1]<-130||p[1]>H+130)continue;
  ctx.save();ctx.globalAlpha=.72;drawBattlefieldSprite(ctx,'ship',p[0],p[1],118,a+(side>0?Math.PI/2:-Math.PI/2));ctx.restore();
 }
 ctx.save();ctx.lineCap='round';ctx.setLineDash([9,17]);ctx.strokeStyle='#c8ddd066';ctx.lineWidth=2;
 for(const edge of [left,right]){ctx.beginPath();ctx.moveTo(...edge[0]);for(let i=1;i<edge.length;i++)ctx.lineTo(...edge[i]);ctx.stroke();}
 ctx.setLineDash([]);ctx.restore();
}
function paintTrenchHellOverlay(cx,cy,W,H){
 const wx=cx-W/2,wy=cy-H/2,time=(globalThis.performance?.now?.()||0)/1000;
 ctx.save();ctx.fillStyle='#27181142';ctx.fillRect(0,0,W,H);
 const cell=190,minX=Math.floor(wx/cell)-1,maxX=Math.ceil((wx+W)/cell)+1,minY=Math.floor(wy/cell)-1,maxY=Math.ceil((wy+H)/cell)+1;
 for(let gx=minX;gx<=maxX;gx++)for(let gy=minY;gy<=maxY;gy++){
  const seed=Math.abs(Math.sin(gx*91.73+gy*47.19)*43758.5453)%1;if(seed<.63)continue;
  const x=gx*cell-wx+cell*(.2+seed*.6),y=gy*cell-wy+cell*(.2+(seed*7%1)*.6),pulse=.72+.18*Math.sin(time*2+seed*20);
  ctx.globalAlpha=.16*pulse;ctx.fillStyle='#ff7a38';ctx.beginPath();ctx.arc(x,y,12+seed*16,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=.11;ctx.fillStyle='#171817';ctx.beginPath();ctx.arc(x+10,y-24,24+seed*24,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
// Terrain stays in a world-anchored offscreen buffer: each frame blits one
// integer-aligned slice instead of re-rasterizing every 768px tile + transform.
// The buffer only repaints when the camera crosses its inner margin.
const _terrBufs=new Map();
function drawTerrainBuffered(key,cx,cy,W,H){
 const M=192,bw=W+2*M,bh=H+2*M;
 let b=_terrBufs.get(key);
 if(!b){if(_terrBufs.size>=4)_terrBufs.delete(_terrBufs.keys().next().value);b={cv:document.createElement('canvas'),ax:NaN,ay:NaN};_terrBufs.set(key,b)}
 if(b.cv.width!==bw||b.cv.height!==bh){b.cv.width=bw;b.cv.height=bh;b.ax=NaN}
 const vx=cx-W/2,vy=cy-H/2,inner=M*.5;
 if(!(vx>=b.ax+inner&&vy>=b.ay+inner&&vx+W<=b.ax+bw-inner&&vy+H<=b.ay+bh-inner)){
  b.ax=vx-M;b.ay=vy-M;
  const g=b.cv.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,bw,bh);
  terrainAlpsRenderer.draw(g,{key,camera:{x:b.ax,y:b.ay},width:bw,height:bh});
  if(key==='alps'&&game?.alpsMountains)game.alpsMountains.draw(g,{camera:{x:b.ax,y:b.ay},width:bw,height:bh});
 }
 const sx=Math.round(vx-b.ax),sy=Math.round(vy-b.ay);
 ctx.drawImage(b.cv,sx,sy,W,H,0,0,W,H);
}
function paintRegion(region,cx,cy,width=W,height=H){
 const W=width,H=height;
 if(region===12){paintVerdun(ctx,game,cx,cy,W,H);return;}
 if(region===16){paintJutland(ctx,game,cx,cy,W,H);return;}
 if(region===14){paintGallipoli(ctx,game,cx,cy,W,H);return;}
 if(region===15){paintParis(ctx,game,cx,cy,W,H,terrainAlpsRenderer);return;}
 if(region===13){paintMaan(ctx,game,cx,cy,W,H);return;}
 if(region===7){paintZeebrugge(cx,cy,W,H);return;}
 if(region>=0&&region<terrainKeys.length){
  drawTerrainBuffered(terrainKeys[region],cx,cy,W,H);
  if(region===3)paintTrenchHellOverlay(cx,cy,W,H);
  if(region===11){ctx.save();ctx.fillStyle='#101b2c45';ctx.fillRect(0,0,W,H);ctx.restore();}
  drawWarAmbience(ctx,region,cx,cy,W,H,(game?.t||0)+ambient,(mobileDisplay&&batterySaver)?.45:1);
  return;
 }
 if(region===5){paintSky(ctx,cx,cy,W,H);return}if(region===4){paintCity(ctx,cx,cy,W,H,PLANES[game?.plane]?.faction==='central'?'london':'berlin');return}
 if(region===0){_ruralTerrain(cx,cy,W,H);return}
 const im=regionTextures[region===1?'sea':'trenches'];ctx.fillStyle=region===1?'#174b68':'#665440';ctx.fillRect(0,0,W,H);
 if(!im.naturalWidth)return;
 const tile=512,ox=((-cx*.4)%tile+tile)%tile-tile,oy=((-cy*.4)%tile+tile)%tile-tile;ctx.imageSmoothingEnabled=false;
 for(let x=ox;x<W;x+=tile)for(let y=oy;y<H;y+=tile)ctx.drawImage(im,x,y,tile,tile);
}
terrain=(cx,cy)=>{
 if(game?.mode==='campaign'||game?.stageBoss){paintRegion(game.worldRegion(),cx,cy);return}
 const distance=game?.distance||0,region=Math.floor(distance/12000)%3,blend=Math.max(0,(distance%12000-10500)/1500);
 paintRegion(region,cx,cy);if(blend>0){ctx.save();ctx.globalAlpha=blend;paintRegion((region+1)%3,cx,cy);ctx.restore()}
};
const _worldDraw=draw;
draw=t=>{
 _worldDraw(t);if(!game)return;
 ctx.save();ctx.font='12px monospace';ctx.textAlign='left';ctx.fillStyle='#f1edd0';ctx.fillText((game.mode==='campaign'?game.stage.region:(getLocale()==='en'?['Pastoral Minefields','Adriatic Sea Front','Trench Front','Saturated Trench Front','Urban Front','High Altitude Front','Alpine Front','Zeebrugge Harbor Front','Cambrai Fields','Arras Sky','Somme Front','London Raid','Verdun Front','Ma’an Front','Gallipoli Front','Paris Night Raid','Jutland Fleet Battle']:['전원 지대','아드리아해','참호 전선','포화의 참호전선','도심','고공 전역','알프스 산맥','제브뤼헤 군항','캉브레 들판','아라스 상공','솜 강전선','런던 대공습','베르됭 전선','마안 전선','갈리폴리 전선','1918 파리 야간공습','유틀란트 해전'])[game.region||0])+(getLocale()==='en'?' · Flown ':' · 비행 ')+((game.distance||0)/1000).toFixed(1)+' km',14,H-14);
 for(const e of game.enemies){const label=e.bossPilot?pilotName(e.bossPilot,e.name):e.bossMinion?(getLocale()==='en'?(e.callSign||e.callSignKo):(e.callSignKo||e.callSign)):null;if(!label)continue;const x=e.x-game.x+W/2,y=e.y-game.y+H/2,oy=e.bossPilot?58:48;ctx.font='600 11px "Arial Narrow",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';const w=Math.ceil(measureCached(ctx,label))+14,lx=Math.max(w/2+4,Math.min(W-w/2-4,x));ctx.fillStyle='rgba(18,13,11,.86)';ctx.fillRect(Math.round(lx-w/2),Math.round(y-oy-8),w,17);ctx.strokeStyle=e.bossPilot?'#a86a3d':'#743d35';ctx.lineWidth=1;ctx.strokeRect(Math.round(lx-w/2)+.5,Math.round(y-oy-8)+.5,w-1,16);ctx.fillStyle='#f0d7a4';ctx.fillText(label,Math.round(lx),Math.round(y-oy))}
 if(game.wingBoost>0){ctx.strokeStyle='#f5e7ad';for(const a of game.allies){const x=a.x-game.x+W/2,y=a.y-game.y+H/2;ctx.beginPath();ctx.arc(x,y,28,0,Math.PI*2);ctx.stroke()}}
 ctx.restore();
};

const _drawBomberSupport=draw;
draw=t=>{
 _drawBomberSupport(t);if(!game)return;
 ctx.save();
 for(const b of game.friendlyBombers||[]){const x=b.x-game.x+W/2,y=b.y-game.y+H/2,im=fieldArtImg(b.airframe);const w=150,h=im?.naturalWidth?w*im.naturalHeight/im.naturalWidth:w*.62;
  if(im?.naturalWidth)drawFieldArt(b.airframe,x,y,w,h,b.a+Math.PI/2,1);else{ctx.save();ctx.globalAlpha=.9;planeSprite(ctx,x,y,b.a,'gotha',1.9,false,false);ctx.restore()}
  ctx.fillStyle='#b4f4dd';ctx.font='12px monospace';ctx.textAlign='center';ctx.fillText(getLocale()==='en'?'Friendly Bombers':'아군 폭격대',x,y-h/2-12);
 }
 for(const b of game.friendlyBombs||[]){const p=1-b.life/b.maxLife,x=b.sx+(b.x-b.sx)*p-game.x+W/2,y=b.sy+(b.y-b.sy)*p-game.y+H/2;
  if(b.bishopBomb)fx(ctx,'bomb',x,y,40,20,Math.atan2(b.y-b.sy,b.x-b.sx));else if(!(FXS&&fxsBombFall(ctx,(X,Y,k,a)=>fx(ctx,'bomb',X,Y,40*k,20*k,a),b.sx-game.x+W/2,b.sy-game.y+H/2,b.x-game.x+W/2,b.y-game.y+H/2,p)))drawEquipment(ctx,'rocket',x,y,Math.atan2(b.y-b.sy,b.x-b.sx)+Math.PI/2,38);
  if(!b.bishopBomb){ctx.strokeStyle='#a2eddb70';ctx.lineWidth=1;ctx.beginPath();ctx.arc(b.x-game.x+W/2,b.y-game.y+H/2,22,0,Math.PI*2);ctx.stroke();}
 }
 ctx.restore();
};

// Persistent, compact inventory above touch controls; one badge per legendary.
let legendarySignature='';
const _hud51=hud;
const RELIC_COOLDOWNS={heineckeRettungsfallschirm:{rem:g=>heineckeRemaining(g),iv:()=>HEINECKE.cooldown},grunkreuz:{rem:g=>g.grunkreuzOn>0?0:(g.grunkreuzOff??0),iv:()=>LEGENDARY_DEFENSE_BALANCE.grunkreuzOffDuration},rankinShell:{rem:g=>g.rankinTimer??0,iv:()=>LEGENDARY_DEFENSE_BALANCE.rankinInterval},kaiserFog:{rem:g=>g.brockSmokeTimer??g.kaiserFogTimer??0,iv:g=>g.brockSmoke?AUGMENTATION_OVERHAUL_BALANCE.smokeInterval:LEGENDARY_DEFENSE_BALANCE.fogInterval},motorCannon:{rem:g=>g.motorCannonTimer??0,iv:g=>g.ordnanceInterval?g.ordnanceInterval(LEGENDARY_BALANCE.motorCannonInterval):LEGENDARY_BALANCE.motorCannonInterval},sparkPlug:{rem:g=>g.mccuddenRepairTimer??0,iv:()=>AUGMENTATION_OVERHAUL_BALANCE.repairInterval}};
const soloRelicRefs=[],coopRelicRefs={p1:[],p2:[]};

// Cut-in art swaps only once the new picture is decoded: the element stays hidden meanwhile, so a
// second ace never opens on the previous ace's portrait, and the card waits up to 600 ms for it.
var bossCutinArtWait=0;
function swapArt(el,url){const artSwapToken=swapArt.tokens||(swapArt.tokens=new WeakMap()),next=url?new URL(url,document.baseURI).href:'',current=artSwapToken.get(el);
 if(current&&current.url===next)return current.done;
 if(!url){artSwapToken.delete(el);el.removeAttribute('src');el.style.visibility='';return Promise.resolve()}
 if(el.src===next&&el.complete&&el.naturalWidth){el.style.visibility='';const done=Promise.resolve();artSwapToken.set(el,{url:next,done});return done}
 const token={url:next};artSwapToken.set(el,token);el.style.visibility='hidden';el.src=url;
 return token.done=(el.decode?el.decode():Promise.resolve()).catch(()=>{}).then(()=>{if(artSwapToken.get(el)===token)el.style.visibility=''})}
function bossCutinHeld(){return bossCutinArtWait&&performance.now()<bossCutinArtWait}
function setBossCutin(imgSrc,name,kicker,detail,side='boss'){$('bossCutin').classList.toggle('skill-side',side==='skill');{const wait=performance.now()+600;bossCutinArtWait=wait;swapArt($('bossCutinImg'),imgSrc).then(()=>{if(bossCutinArtWait===wait)bossCutinArtWait=0})}$('bossCutinImg').alt=name;$('bossCutinKicker').textContent=kicker;$('bossCutinName').textContent=name;$('bossCutinDetail').textContent=detail||''}
function stageBossCutinCheck(){const sb=game?.stageBoss?.stages;if(sb&&sb.phase==='boss'&&sb.bossId&&sb.bossId!==lastStageBossId){lastStageBossId=sb.bossId;const nm=(getLocale()==='en'?BOSS_NAMES_EN[sb.bossId]:BOSS_CATALOG[sb.bossId]?.name)||sb.bossId;setBossCutin(bossCutinSource(sb.bossId),nm,getLocale()==='en'?'AREA BOSS':'지역 보스',bossTactic(sb.encounter,getLocale()));$('bossWarnSub').textContent=nm+' · AREA BOSS INBOUND';show('bossWarning');{const warningRun=game,warningBoss=sb.encounter;setTimeout(()=>{if(game===warningRun&&game?.stageBoss?.stages.encounter===warningBoss)show('bossWarning',false)},1600)}bossCardFrom=performance.now()+1400;bossCutinUntil=bossCardFrom+2600;sfx('bossSting');{const run=game,encounter=sb.encounter;const later=(name,delay)=>setTimeout(()=>{if(game===run&&run.stageBoss?.stages.encounter===encounter&&run.state==='playing'&&!regionTransitionUntil&&!document.hidden)sfx(name)},delay);later('bossSting',620);if(['paris-gun','lincomparable'].includes(sb.bossId))later('trainApproach',380);else if(sb.bossId==='fliegerzug')later('trainWhistle',380);if([1,16].includes(BOSS_CATALOG[sb.bossId]?.stage))later('shipHorn',420)}}}
function paintRelicBadge(rb){const c=rb.ctx,spec=RELIC_COOLDOWNS[rb.id],owner=rb.owner();let prog=1;if(spec&&owner){const iv=spec.iv(owner)||1;prog=Math.max(0,Math.min(1,1-Math.max(0,spec.rem(owner))/iv))}c.clearRect(0,0,48,48);if(prog>=1){drawGameIcon(c,rb.key,24,24,42);return}c.globalAlpha=.32;drawGameIcon(c,rb.key,24,24,42);c.globalAlpha=1;c.save();c.beginPath();c.moveTo(24,24);c.arc(24,24,26,-Math.PI/2,-Math.PI/2+prog*Math.PI*2);c.closePath();c.clip();drawGameIcon(c,rb.key,24,24,42);c.restore();if(prog>0&&prog<1){c.save();c.strokeStyle='#ffe9a8';c.lineWidth=2;c.beginPath();c.arc(24,24,21,-Math.PI/2,-Math.PI/2+prog*Math.PI*2);c.stroke();c.restore()}}
function relicCooldownTick(){for(const rb of soloRelicRefs)if(RELIC_COOLDOWNS[rb.id])paintRelicBadge(rb);for(const arr of Object.values(coopRelicRefs))for(const rb of arr)if(RELIC_COOLDOWNS[rb.id])paintRelicBadge(rb)}
hud=()=>{_hud51();relicCooldownTick();const held=UPGRADES.filter(u=>u.legendary&&game.upgrades[u.id]);const signature=held.map(u=>u.id).join(',');if(signature!==legendarySignature){legendarySignature=signature;$('legendaryInventory').replaceChildren();soloRelicRefs.length=0;for(const u of held){const item=document.createElement('button');item.type='button';item.className='legendary-badge';item.setAttribute('aria-label',reinforcementName(u,game,PLANES)+' · '+cleanDescription(u.desc));const tip=document.createElement('span');tip.className='legendary-tip156';tip.textContent=reinforcementName(u,game,PLANES)+' · '+cleanDescription(u.desc);const c=document.createElement('canvas');c.width=48;c.height=48;const key=u.id==='ironCross'?'ironCross-'+(PLANES[game.plane]?.faction==='entente'?'entente':'central'):u.id;soloRelicRefs.push({id:u.id,key,ctx:c.getContext('2d'),owner:()=>game});paintRelicBadge(soloRelicRefs[soloRelicRefs.length-1]);item.append(c,tip);item.onclick=e=>{e.preventDefault();item.classList.toggle('tip156')};item.onblur=()=>item.classList.remove('tip156');$('legendaryInventory').append(item)}}};
const _draw51=draw;
draw=t=>{_draw51(t);if(!game)return;ctx.save();
 for(const w of game.divingSquadron||[]){const x=w.x-game.x+W/2,y=w.y-game.y+H/2;planeSprite(ctx,x+12,y+18,w.a, 'se5a',1,false,true);planeSprite(ctx,x,y,w.a,'se5a',1)}
 if(game.upgrades.redScarf){const a=game.a;ctx.strokeStyle='#d6f6efa8';ctx.lineWidth=2;for(const offset of [-29,-20,20,29]){const x=W/2-Math.sin(a)*offset,y=H/2+Math.cos(a)*offset,len=58+Math.sin(t*15+offset)*18;ctx.beginPath();ctx.moveTo(x-Math.cos(a)*24,y-Math.sin(a)*24);ctx.lineTo(x-Math.cos(a)*len,y-Math.sin(a)*len);ctx.stroke()}}
 ctx.restore();
};
iconsReady.then(()=>{legendarySignature='';for(const ref of choiceIconRefs)drawUpgradeIcon(ref.canvas,ref.id,ref.owner||game);const icon=$('pilotSkillIcon');drawGameIcon(icon.getContext('2d'),faction==='central'?'emblemCentral':'emblemEntente',24,24,44);paintControl('skillButtonIcon',faction==='central'?'emblemCentral':'emblemEntente');for(const id of ['p1','p2'])coopRelicSignatures[id]='';if(game){hud();if(game.mode==='coop2')coopHud()}});
const _roster51=roster;
roster=()=>{_roster51();const icon=$('pilotSkillIcon');icon.getContext('2d').clearRect(0,0,48,48);drawGameIcon(icon.getContext('2d'),faction==='central'?'emblemCentral':'emblemEntente',24,24,44);paintControl('skillButtonIcon',faction==='central'?'emblemCentral':'emblemEntente');const emb=document.querySelector('#touchSkill .astra-skill-emblem');if(emb){const f=faction==='central'?'central':'entente';if(!emb.src.includes(`emblem_bare_${f}`))emb.src=`./augmentation-icons/emblem_bare_${f}.webp?v=ui5`}};

function activeCampaignStage(){let s=STAGES.find(s=>s.id===selectedStageId);if(stageFaction(s)!==faction){s=STAGES.find(s=>stageFaction(s)===faction);selectedStageId=s.id;freeSortie=false}return s}
function hasCampaignClear(id){return campaignRecords.some(r=>r.stageId===id&&r.medals>0)}
function renderCampaignMenu(){
 const campaign=CAMPAIGN_ENABLED&&selectedMode==='campaign',stage=activeCampaignStage();document.body.classList.toggle('campaign-selected',campaign);show('campaignMode',CAMPAIGN_ENABLED);show('campaignPanel',campaign);
 $('endlessMode').classList.toggle('active',selectedMode==='endless');$('campaignMode').classList.toggle('active',campaign);$('endlessMode').setAttribute('aria-pressed',selectedMode==='endless');$('campaignMode').setAttribute('aria-pressed',campaign);
 const select=$('campaignStage');select.replaceChildren();for(const s of STAGES.filter(s=>stageFaction(s)===faction)){const opt=document.createElement('option');opt.value=s.id;opt.textContent=`${s.historicalAnchorDate} · ${s.id} ${s.title}${hasCampaignClear(s.id)?' ✓':''}`;select.append(opt)}select.value=stage.id;
 const cleared=hasCampaignClear(stage.id);$('freeSortie').disabled=!cleared;$('freeSortie').textContent=cleared?'자유 출격':'자유 출격 · 클리어 후';$('historicalSortie').classList.toggle('active',!freeSortie);$('freeSortie').classList.toggle('active',freeSortie);$('historicalSortie').setAttribute('aria-pressed',!freeSortie);$('freeSortie').setAttribute('aria-pressed',freeSortie);
 const record=campaignRecords.find(r=>r.stageId===stage.id);$('campaignRecord').textContent=campaignLoadState==='loading'?'캠페인 기록 확인 중…':campaignLoadState==='error'?'기록 서버에 연결하지 못했습니다. 기록 다시 확인 ↻':record?`${'★'.repeat(record.medals)}${'☆'.repeat(3-record.medals)} · 최고 ${record.score}점 · ${record.time}초`:'미클리어 · 역사 출격으로 자유 출격을 해금하세요';
 const brief=$('campaignBrief');brief.replaceChildren();const add=(tag,text)=>{const el=document.createElement(tag);el.textContent=text;brief.append(el)};
 add('h2',stage.title);add('p',`역사 배경 · ${stage.historicalEvent} / ${stage.region}`);add('p',`출격 기체 · ${displayAircraftName(pilot,campaign?plane:historicalAircraft(stage))||stage.defaultAircraft}`);add('strong',stage.sourceVictory);add('p',`${stage.recommendedDurationSec}초 · 목표 레벨업 ${stage.targetLevelUpCount}회 · ${stage.sourceGimmick}`);
 const phases=document.createElement('ol');for(const phase of stage.phases){const li=document.createElement('li');li.textContent=phase.description;phases.append(li)}brief.append(phases);
 add('small','게임 각색 · 선택한 에이스의 특성과 스킬을 적용합니다. 출격 기체·임무·등장인물의 조합은 역사 재현과 다를 수 있습니다.');$('start').innerHTML=campaign?'작전 출격 <span>↗</span>':'전선으로 출격 <span>↗</span>';
}
$('endlessMode').onclick=()=>{selectedMode='endless';plane=pilotPlane(pilot);roster()};$('campaignMode').onclick=()=>{if(!CAMPAIGN_ENABLED)return;selectedMode='campaign';roster()};
$('campaignStage').onchange=()=>{selectedStageId=$('campaignStage').value;freeSortie=false;roster()};$('historicalSortie').onclick=()=>{freeSortie=false;roster()};$('freeSortie').onclick=()=>{if(hasCampaignClear(selectedStageId)){freeSortie=true;roster()}};
$('campaignRecord').onclick=()=>{if(campaignLoadState==='error')loadCampaignRecords()};$('altitudeButton').onclick=()=>game?.changeAltitude();
function campaignHud(){const g=game,nav=missionNavigation(g);$('navigationTarget').textContent=`${nav.label} · ${nav.heading} ${nav.bearing}° · ${Math.round(nav.distance)} m`;$('navigationInstruction').textContent=nav.instruction;$('navigationArrow').style.transform=`rotate(${nav.angle}rad)`;const panel=$('campaignHud'),bounds=canvas.getBoundingClientRect();g.navigationTop=(panel.offsetTop+panel.offsetHeight+24)*H/bounds.height;g.navigationBottom=170*H/bounds.height;const radar=$('missionRadar');drawMissionRadar(radar.getContext('2d'),g,224);show('altitudeButton',g.mission.kind==='altitude');$('altitudeButton').disabled=g.state!=='playing'||g.altitudeCooldown>0;$('campaignPhase').textContent=`${g.stage.id} · ${g.phaseIndex+1}/3 · ${Math.max(0,Math.ceil(g.stage.recommendedDurationSec-g.stageTimer))}초`;$('campaignObjective').textContent=g.objectiveText();if(g.stage.id==='C-01'){$('ammoLabel').textContent='Parabellum · 후방 사수';}if(g.mission.unarmed){$('ammoCount').textContent='사진정찰 · 고정총 없음';$('ammoLabel').textContent='구름을 이용해 정찰 구역 유지';$('ammoProgress').style.width='0%';$('reload').disabled=true;$('touchSkill').disabled=true;$('skillButtonText').textContent='정찰 임무'} }
async function loadCampaignRecords(){campaignLoadState='loading';try{const res=await fetch('/api/campaign');if(!res.ok)throw Error();campaignRecords=await res.json();campaignLoadState='ready'}catch{campaignLoadState='error'}if(!game)roster()}
function campaignEnd(run){
 const result=run.result||{won:false,medals:0,score:run.campaignScore,time:run.stageTimer,reason:'작전 실패'};show('touch',false);$('missionLabel').textContent=result.reason;
 const detail=`${run.stage.id} ${run.stage.title}\n${result.reason}\n${'★'.repeat(result.medals)}${'☆'.repeat(3-result.medals)} · ${result.score}점 · ${result.time}초 · LV.${run.level}\n\n${result.won?'캠페인 기록 저장 중…':'목표를 다시 확인하고 재출격하세요.'}`;
 modal(result.won?'CAMPAIGN CLEAR':'SORTIE LOST',result.won?'작전 목표 달성':'작전 실패',detail,[{label:'같은 작전 재출격',run:start},{label:'작전 선택으로',run:returnHangar}]);
 if(result.won)saveCampaignResult(result,detail);
}
async function saveCampaignResult(result,detail){try{const res=await fetch('/api/campaign',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(result)});if(!res.ok)throw Error();campaignRecords=await res.json();campaignLoadState='ready';if(game?.result===result)$('modalText').textContent=detail.replace('캠페인 기록 저장 중…','캠페인 기록 저장됨 · 자유 출격 해금');}catch{if(game?.result===result){$('modalText').textContent=detail.replace('캠페인 기록 저장 중…','기록을 저장하지 못했습니다. 아래 버튼으로 다시 시도하세요.');const retry=document.createElement('button');retry.textContent='기록 저장 재시도';retry.onclick=()=>{retry.disabled=true;saveCampaignResult(result,detail).finally(()=>retry.remove())};$('modalActions').prepend(retry)}}}
campaignArtReady.then(()=>roster());loadCampaignRecords();

const _gasTerrain57=terrain;terrain=(cx,cy)=>{_gasTerrain57(cx,cy);if(game)drawGas(ctx,game,W,H)};

const _duoSupport61=drawSupport;drawSupport=()=>{_duoSupport61();if(!game?.crossfireFlash||game.pilot==='huffzky')return;ctx.save();ctx.fillStyle='#ffe8aa';for(let i=0;i<4;i++){const a=game.a+i*Math.PI/2;ctx.save();ctx.translate(W/2+Math.cos(a)*29,H/2+Math.sin(a)*29);ctx.rotate(a);ctx.fillRect(0,-2,15,4);ctx.restore()}ctx.restore()};

// Blue wing markers distinguish independent allied pilots from player wingmen.
const _patrolSupport79=drawSupport;
drawSupport=()=>{
 _patrolSupport79();if(!game)return;
 for(const p of game.patrols||[]){
  if(p.hp<=0||p.life<=0)continue;
  const x=p.x-game.x+W/2,y=p.y-game.y+H/2;if(x<-100||y<-100||x>W+100||y>H+100)continue;
  ctx.save();planeSprite(ctx,x+12,y+18,p.a,p.plane,.9,false,true);planeSprite(ctx,x,y,p.a,p.plane,.9,false,false,p.hitFlash,p.hp<=p.maxHp*.5);
  ctx.strokeStyle='#83dce9';ctx.lineWidth=2;
  for(const side of [-1,1]){const sx=x-Math.sin(p.a)*side*32,sy=y+Math.cos(p.a)*side*32;ctx.beginPath();ctx.moveTo(sx-Math.cos(p.a)*5,sy-Math.sin(p.a)*5);ctx.lineTo(sx+Math.cos(p.a)*5,sy+Math.sin(p.a)*5);ctx.stroke()}
  if(p.hp<p.maxHp){ctx.fillStyle='#182b36';ctx.fillRect(x-16,y+37,32,3);ctx.fillStyle='#83dce9';ctx.fillRect(x-16,y+37,32*p.hp/p.maxHp,3)}
  if(p.muzzleFlash>0){const mx=x+Math.cos(p.a)*27,my=y+Math.sin(p.a)*27;if(!fx(ctx,'muzzle',mx+Math.cos(p.a)*6,my+Math.sin(p.a)*6,16,16,p.a)){ctx.fillStyle='#f2efb1';ctx.fillRect(mx-2,my-2,4,4)}}
  ctx.restore();
 }
};
const _airshipSupport66=drawSupport;
drawSupport=()=>{_airshipSupport66();if(!game)return;for(const ship of game.airshipFleet||[]){if(ship.age<0||ship.age>6)continue;const x=ship.x-game.x+W/2,y=ship.y-game.y+H/2;ctx.save();const scale=ship.scale||.55;ctx.globalAlpha=.22;drawZeppelin(ctx,x,y,ship.a,scale*1.16,false,'central');ctx.globalAlpha=1;drawZeppelin(ctx,x,y,ship.a,scale,false,'central');if(ship.flash>0){ctx.fillStyle='#f5d49a';for(const side of [-1,1]){ctx.save();ctx.translate(x,y);ctx.rotate(ship.a);ctx.fillRect(-3,side*60-3,9,6);ctx.restore()}}ctx.restore()}};

// Revision 81 overlays: readable unlimited ammo, simultaneous ace warning and 37 mm shell art.
const _legendaryHud81=hud;
hud=()=>{_legendaryHud81();if(!game?.unlimitedAmmo)return;$('ammoCount').textContent=t('hud.ammo')+' ∞';$('ammoProgress').style.width='100%';$('reload').disabled=true;$('reload').textContent=t('hud.unlimited')};
const _bossEvents81=events;
events=()=>{let arrivalCount=0,last=null;const queued=game?.events;if(queued)for(const e of queued)if(e.type==='bossArrival'){arrivalCount++;last=e}_bossEvents81();if(!arrivalCount)return;const detailKey=`warning.aceDetail.${last.pilot}`,detail=t(detailKey);if(arrivalCount>1){$('bossName').textContent=t('warning.aceGroup');$('bossArrivalDetail').textContent=t('warning.aceApproach',{count:arrivalCount})}else $('bossArrivalDetail').textContent=detail===detailKey?t('warning.airspace'):detail};
const _legendaryDraw81=draw;
draw=t=>{
 _legendaryDraw81(t);if(!game)return;
 const point=(x,y)=>{_ptShare[0]=x-game.x+W/2;_ptShare[1]=y-game.y+H/2;return _ptShare};ctx.save();
 for(const m of game.mines)if(m.legendary){const [x,y]=point(m.x,m.y);if(x<-80||x>W+80||y<-80||y>H+80)continue;ctx.strokeStyle='#ffd56f99';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,25+Math.sin(t*6)*3,0,Math.PI*2);ctx.stroke()}
 for(const b of game.bullets)if(b.motorCannon||b.cow37){const [x,y]=point(b.x,b.y);if(x<-90||x>W+90||y<-90||y>H+90)continue;drawCannonProjectile(ctx,b,x,y)}
 drawBattlefieldFire(ctx,game,point);
 for(const e of game.enemyAirshipPasses||[]){const[x,y]=point(e.x,e.y);if(x<-320||x>W+320||y<-320||y>H+320)continue;drawZeppelin(ctx,x,y,e.a,.72,false,'central');}
 ctx.restore();
};

// PC cooperative mode is an explicit entrypoint, not another legacy draw/update wrapper.
function renderCoopSetup(){
 const on=selectedMode==='coop2';$('nicknameLabel').textContent=on?'P1 닉네임':'랭킹 닉네임';document.body.classList.toggle('coop-selected',on);show('coopMode',coopAvailable);show('coopPanel',on);$('coopMode').classList.toggle('active',on);$('coopMode').setAttribute('aria-pressed',on);
 if(!on)return;if(PILOTS[coopPilot2]?.faction!==faction)coopPilot2=pilot;if(pilot==='baron')coopBaronAircraft=baronAircraft;
 const select=$('coopPilot2');select.replaceChildren();for(const [id,p] of Object.entries(PILOTS).filter(([,p])=>p.faction===faction)){const option=document.createElement('option');option.value=id;option.textContent=p.name;select.append(option)}select.value=coopPilot2;select.disabled=!!game;$('coopNickname2').disabled=!!game;
 $('coopP1Summary').textContent=t('coop.teamSummary',{pilot:pilotName(pilot,PILOTS[pilot].name),team:t('coop.team',{faction:t(faction==='central'?'faction.central':'faction.entente')})});
 $('coopPortrait2').src=portraitSources[coopPilot2]||'portrait-'+coopPilot2+'.webp?v=ui5&b=326';$('coopPortrait2').alt=PILOTS[coopPilot2].name;$('coopPortrait2').style.setProperty('--pilot-choice-scale',choicePortraitScale(coopPilot2));
 $('coopSkill2').textContent=pilotLoadout(coopPilot2,coopSelectedPlane(coopPilot2)).skill;const c=$('coopPlane2').getContext('2d');c.clearRect(0,0,144,160);planeSprite(c,72,76,-Math.PI/2,aircraftKey(coopSelectedPlane(coopPilot2),false,coopPilot2),1/.54);
 const aircraft=$('coopAircraft103');aircraft.replaceChildren();for(const key of coopPilot2==='baron'?['fokker','baron_albatros']:[coopPlane(coopPilot2)]){const option=document.createElement('option');option.value=key;option.textContent=displayAircraftName(coopPilot2,key);aircraft.append(option)}aircraft.value=coopSelectedPlane(coopPilot2);aircraft.disabled=!!game||coopPilot2!=='baron';aircraft.title=coopPilot2==='baron'?'리히트호펜의 삼엽기 / 알바트로스 D.III':'파일럿별 역사 지정 기체';aircraft.onchange=()=>{if(game||coopPilot2!=='baron')return;coopBaronAircraft=aircraft.value==='baron_albatros'?'baron_albatros':'fokker';renderCoopSetup()};
 $('start').textContent='두 기체 함께 출격';
}
function highlightCoopChoice(index=0){const buttons=[...$('modalActions').querySelectorAll('button')];for(const [i,b] of buttons.entries())b.classList.toggle('coop-current',i===index);buttons[index]?.focus({preventScroll:true})}
function showCoopUpgrade(item){if(game?.mode!=='coop2'||game.state!=='upgrade'||game.activeUpgrade!==item)return;if(game.online&&item.playerId!==game.localPlayerId){modal('ONLINE CO-OP','동료 강화 선택 중',item.playerId.toUpperCase()+' 강화 선택이 끝나면 전투가 계속됩니다.',[]);return;}const p=game.player(item.playerId);coopInput.clear();coopInput.itemId=item.id;coopInput.selection=0;document.body.classList.toggle('coop-p2-choice',p.id==='p2');modal('COOP · '+p.id.toUpperCase()+' · LV. '+item.level,t('coop.choice.title',{player:p.id.toUpperCase()+' '+p.nickname}),t('coop.choice.text',{pilot:pilotName(p.pilot,PILOTS[p.pilot].name),controls:t(p.id==='p1'?'coop.choice.p1':'coop.choice.p2'),count:game.pendingLevelUps.length}),item.choices.map(u=>({owner:p,upgradeId:u.id,rarity:u.rarity,label:'['+rarityName(u.rarity)+'] '+u.name,desc:upgradeDescription(u.id,u.rarity,p),run:()=>chooseCoop(item.id,u.id)})));highlightCoopChoice(0)}
function chooseCoop(itemId,id){if(game?.mode!=='coop2')return;coopInput.clear();if(!game.chooseUpgrade(itemId,id))return;last=performance.now();sound(750,.12);if(game.state==='upgrade')coopEvents();else if(game.state==='paused')showCoopPause();else{show('modal',false);document.body.classList.remove('coop-p2-choice')}}
function showCoopPause(){showBuildPause151()}
function pauseCoop(){if(game?.mode!=='coop2'||game.state==='lost'||game.state==='upgrade')return;coopInput.clear();if(game.state==='paused'){resume();return}game.pause();showCoopPause()}
let coopHudAt=0;const coopGunSig={};
function coopHud(){const _hn=performance.now();if(_hn-coopHudAt<90)return;coopHudAt=_hn;if(game.online)onlineLobby.controls(game);
 for(const p of game.players){const sig=p.cow37?'cow37':'gun-'+p.weapon.gunProfile;if(coopGunSig[p.id]===sig)continue;coopGunSig[p.id]=sig;const c=$(p.id+'Gun113');c.title=p.weapon.name;c.getContext('2d').clearRect(0,0,72,44);drawGameIcon(c.getContext('2d'),sig,36,22,70);}
 const g=game;$('coopClock').textContent=String(Math.floor(g.t/60)).padStart(2,'0')+':'+String(Math.floor(g.t%60)).padStart(2,'0');$('coopKills').textContent=t('coop.kills',{priority:g.priorityKills});let localBest=0;try{localBest=Number(localStorage.getItem(COOP_RECORD_KEYS.best))||0}catch{}$('coopBest').textContent=t('coop.best',{score:Math.max(localBest,g.priorityKills)});
 for(const p of g.players){const id=p.id,down=p.status==='downed';$(id+'HudName').textContent=id.toUpperCase()+' · '+p.nickname+' / '+pilotName(p.pilot,PILOTS[p.pilot].name);const ammo=p.unlimitedAmmo?'∞':p.ammo.join(' / '),cooldown=p.cooldown>0?p.cooldown.toFixed(1)+'s':t('coop.ready'),special=p.specialAmmoStatus?.();$(id+'HudStats').textContent=down?t('coop.downed',{seconds:p.respawnRemaining.toFixed(1),level:p.level}):t('coop.stats',{hp:Math.ceil(p.hp),maxHp:Math.round(p.maxHp),level:p.level,ammo,reload:p.reloadTime>0?t('coop.reload',{seconds:p.reloadTime.toFixed(1)}):'',special:special?t('coop.special',{name:special.name,count:special.count}):'',active:cooldown,maneuver:p.evadeCooldown>0?p.evadeCooldown.toFixed(1)+'s':t('coop.ready')});$(id+'HpBar').style.width=100*p.hp/p.maxHp+'%';
  const held=UPGRADES.filter(u=>u.legendary&&p.upgrades[u.id]),signature=g.runId+':'+held.map(u=>u.id).join(',');if(coopRelicSignatures[id]!==signature){coopRelicSignatures[id]=signature;coopRelicRefs[id].length=0;$(id+'Relics').replaceChildren();for(const u of held){const icon=document.createElement('canvas');icon.width=48;icon.height=48;icon.title=reinforcementName(u,p,PLANES)+' · '+cleanDescription(u.desc);icon.setAttribute('aria-label',reinforcementName(u,p,PLANES));const key=u.id==='ironCross'?'ironCross-'+(PLANES[p.plane]?.faction==='entente'?'entente':'central'):u.id;coopRelicRefs[id].push({id:u.id,key,ctx:icon.getContext('2d'),owner:()=>p});paintRelicBadge(coopRelicRefs[id][coopRelicRefs[id].length-1]);$(id+'Relics').append(icon)}}
  show(id+'Cutin',!down&&g.state!=='lost'&&g.t<coopCutinEnds[id]);
 }
 if(g.t>coopToastUntil||g.state==='lost')show('toast',false);
}
function coopEvents(){
 const g=game;if(g?.mode!=='coop2')return;
 let arrivalCount=0;for(const e of g.events)if(e.type==='bossArrival')arrivalCount++;
 const _evs=g.events;if(g.online)g.captureEvents(_evs);g.events=[];for(const e of _evs){if(e.type==='onlineResume'){show('modal',false);document.body.classList.remove('coop-p2-choice');continue;}if(e.type==='onlinePause'){showCoopPause();continue;}
  if(e.type==='bossPhase'){$('toast').textContent=bossPhaseLabel(e.text,getLocale());show('toast');coopToastUntil=g.t+2.2;continue}
  if(e.type==='bossSound'){sfx(e.text);continue}
  if(e.type==='regionTransition'){beginRegionTransition(e.text,e.region);continue}
  if(e.type==='upgrade'){showCoopUpgrade(e.item);sfx('levelup');continue}
  if(e.type==='end'){sfx(g.state==='won'||g.result?.won?'victory':'defeat');showCoopResult(g);continue}
  if(e.type==='skill'&&e.ownerId){const p=g.player(e.ownerId),id=p.id;coopCutinEnds[id]=g.t+2.1;$(id+'CutinPortrait').src=portraitSources[p.pilot]||'portrait-'+p.pilot+'.webp?v=ui5&b=326';$(id+'CutinPortrait').alt=PILOTS[p.pilot].name;$(id+'CutinName').textContent=id.toUpperCase()+' · '+p.nickname;$(id+'CutinSkill').textContent=pilotLoadout(p.pilot,p.plane).skill;sfx('skill')}
  if(e.type==='bossArrival'){bossArrivalUntil=g.t+4.5;{const _ef=e.pilot&&PILOTS[e.pilot]&&PILOTS[e.pilot].faction,fc=_ef==='entente'?'#7c9bb8':_ef==='central'?'#7d8f83':null,fcs=_ef==='entente'?'#a7c2da':_ef==='central'?'#9db3a5':null;document.querySelectorAll('#bossArrival,#bossWarning,.boss-cutin').forEach(el=>{el.style.setProperty('--enemy-fac',fc||'');el.style.setProperty('--enemy-fac-soft',fcs||'');el.style.setProperty('--enemy-fac-strong',fcs||'')})}bossCardFrom=performance.now();$('bossName').textContent=arrivalCount>1?t('warning.aceGroup'):e.name;swapArt($('bossPortrait'),portraitSources[e.pilot]||'portrait-'+e.pilot+'.webp?v=ui5&b=326');$('bossArrivalDetail').textContent=arrivalCount>1?t('warning.aceApproach',{count:arrivalCount}):t('coop.aceCoop');bossCutinUntil=bossCardFrom+2600;setBossCutin($('bossPortrait').src,$('bossName').textContent,'ENEMY ACE · 적 에이스',$('bossArrivalDetail').textContent);setBgmMode('boss')}
  if(e.type==='heinecke'||e.type==='heineckeReturn'){$('toast').textContent=e.ownerId?.toUpperCase()+' · '+runtimeEventText(e.text);show('toast');coopToastUntil=g.t+1.8;sfx(e.type==='heinecke'?'hit':'ally')}
  if(['wave','downed','revived','flak','bombWarning'].includes(e.type)){$('toast').textContent=runtimeEventText(e.text);show('toast');coopToastUntil=g.t+2.2}
  if(e.type==='shot'&&performance.now()-lastShotSound>100){lastShotSound=performance.now();sfx('shot')}if(e.type==='hit')sfx('hit');if(e.type==='kill')sfx(e.combatSound||(e.text==='balloon'?'balloon':'kill'));if(e.type==='reload')sfx('reload');if(e.type==='loaded')sfx('loaded');if(e.type==='pickup'&&performance.now()-lastPickupSound>220){lastPickupSound=performance.now();sfx(e.text==='heal'?'heal':'pickup')}
 }
}
function coopRankingText(rows){return rows.length?rows.map((r,i)=>`${['🥇','🥈','🥉'][i]||i+1+'.'} ${r.players.map(p=>p.name+' ('+pilotName(p.pilot,PILOTS[p.pilot]?.name||p.pilot)+')').join(' + ')}\n${t('coop.team',{faction:t(r.faction==='central'?'faction.central':'faction.entente')})} · ${t('coop.result.summary',{score:r.score,seconds:r.durationSeconds})}`).join('\n\n'):t('coop.ranking.empty')}
function showSoloResult(run){
 best=Math.max(best,run.recordedKills?run.recordedKills():(run.priorityKills||0));try{localStorage.setItem('headon-priority-best-161',best)}catch{}
 $('record').textContent=t('record.best',{score:best});showEndNickname(run,false);
}
function showEndNickname(run,coop){
 keys={};coopInput.clear();joy=null;show('touch',false);show('skillCutin',false);
 let submitted=false;const players=coop?run.players:[{pilot:run.pilot}];
 const detail=players.map((p,i)=>(coop?'P'+(i+1)+' · ':'')+pilotName(p.pilot,PILOTS[p.pilot].name)).join(' + ')+
 '\n'+t('result.detail',{kills:run.recordedKills?run.recordedKills():(run.priorityKills||0),seconds:Math.floor(run.t)});
 const inputs=[];
 const submit=()=>{
  if(submitted||game!==run)return;submitted=true;
  if(coop){run.players.forEach((p,i)=>p.nickname=inputs[i].value.trim().slice(0,12)||'P'+(i+1));saveCoopResult(run);}
  else{nickname=inputs[0].value.trim().slice(0,12)||t('pilot.anonymous');const rows=saveRanking();
   modal('SORTIE COMPLETE',getLocale()==='en'?'Sortie Record':'출격 기록',detail+'\n\n'+t('result.local'),[{label:t('sortie.retry'),run:start},{label:t('sortie.pilotChange'),run:returnHangar}]);renderRankingMedals(rows,t('result.local')+' · '+t('ranking.priority'));syncServerRanking();}
 };
 modal('SORTIE COMPLETE',getLocale()==='en'?'Sortie Over · Submit to Ranking':'출격 종료 · 랭킹 등록',detail+'\n'+t('result.nicknamePrompt'),
 [{label:t('result.submit'),run:submit},{label:t('result.skip'),run:returnHangar}]);
 const form=document.createElement('div');form.className='result-nicknames';
 players.forEach((p,i)=>{const label=document.createElement('label'),input=document.createElement('input');
 label.textContent=(coop?'P'+(i+1)+' · ':'')+pilotName(p.pilot,PILOTS[p.pilot].name);
 input.type='text';input.value='';input.maxLength=12;input.placeholder=coop?'P'+(i+1):t('pilot.anonymous');input.autocomplete='nickname';
 input.setAttribute('aria-label',label.textContent+' '+t('pilot.nickname'));
 input.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter'&&!e.isComposing){e.preventDefault();if(i<inputs.length-1)inputs[i+1].focus();else submit()}};
 inputs.push(input);label.append(input);form.append(label);
 });$('modalActions').prepend(form);
}
function showCoopResult(run){if(run.online){coopInput.clear();show('touch',false);modal('ONLINE CO-OP','협동 작전 종료',`P1 + P2 · 주요 ${run.priorityKills}기 · ${Math.floor(run.t)}초\n온라인 Co-op 점수는 랭킹에 제출하지 않습니다.`,[{label:'출격 화면',run:returnHangar}]);return;}return showEndNickname(run,true)}
function saveCoopResult(run){coopInput.clear();show('skillCutin',false);const record=coopRecord(run),rows=saveCoopLocal(localStorage,record);modal('COOP SORTIE LOST',t('coop.result.title'),`${record.players.map(p=>p.name).join(' + ')}\n${t('coop.result.summary',{score:record.score,seconds:record.durationSeconds})}\n\n${t('coop.result.serverSaving')}\n${t('coop.result.local')}\n${coopRankingText(rows)}`,[{label:t('coop.result.retry'),run:start},{label:t('coop.result.setup'),run:returnHangar}]);syncCoopRanking(run,record)}
async function syncCoopRanking(run,record){if(run.online)return;try{const response=await fetch('/api/rankings',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(record)});if(!response.ok)throw Error();const rows=await response.json();if(game===run&&game.state==='lost')$('modalText').textContent=`${record.players.map(p=>p.name).join(' + ')}\n${t('coop.result.summary',{score:record.score,seconds:record.durationSeconds})}\n\n${t('coop.result.server')}\n${coopRankingText(rows)}`}catch{if(game!==run||game.state!=='lost')return;$('modalText').textContent=$('modalText').textContent.replace(t('coop.result.serverSaving'),t('coop.result.saveFailed'));const retry=document.createElement('button');retry.className='primary';retry.textContent=t('coop.result.retrySave');retry.onclick=()=>{retry.remove();syncCoopRanking(run,record)};$('modalActions').append(retry)}}
async function showCoopLeaderboard(){if(game)return;modal('COOP RANKING',t('coop.ranking.title'),t('ranking.loading'),[{label:t('coop.result.setup'),run:()=>show('modal',false)}]);try{const response=await fetch('/api/rankings?mode=coop2');if(!response.ok)throw Error();const rows=await response.json();if(!game)$('modalText').textContent=coopRankingText(rows)}catch{if(!game)$('modalText').textContent=t('ranking.loadFailed')}}
$('coopMode').onclick=()=>{if(game||!coopAvailable)return;selectedMode='coop2';plane=pilotPlane(pilot);roster()};
$('coopPilot2').onchange=()=>{if(game)return;coopPilot2=$('coopPilot2').value;renderCoopSetup()};
$('coopPause').onclick=pauseCoop;$('coopRanking').onclick=showCoopLeaderboard;
window.addEventListener('focus',()=>{if(game?.mode==='coop2'&&game.state!=='playing')coopInput.reset()});
renderCoopSetup();

// Revision 91 tactical overlays: tail-lock feedback and temporary ammunition belts.
function drawTailMarker(c,target,player,point,color='#ffd36f'){
 if(!target||!player)return;const [x,y]=point(target.x,target.y),progress=player.tailLockFraction?.()||0,locked=!!player.tailLocked;drawTailEngagement(c,x,y,progress,locked,locked?t('hud.tailAdvantage',{multiplier:TAILING_BALANCE.damageMultiplier.toFixed(2)}):t('hud.rearAim',{percent:Math.round(progress*100)}));
}
const _tacticalDraw91=draw;
draw=t=>{_tacticalDraw91(t);if(!game||game.mode==='coop2')return;const point=(x,y)=>{_ptShare[0]=x-game.x+W/2;_ptShare[1]=y-game.y+H/2;return _ptShare};ctx.save();for(const d of game.drops||[])if(!d.dead&&d.specialAmmo){const [x,y]=point(d.x,d.y),spec=SPECIAL_AMMO[d.specialAmmo];ctx.strokeStyle=(spec?.color||'#ffd36f')+'bb';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,24+Math.sin(t*6)*3,0,Math.PI*2);ctx.stroke();drawSpecialAmmoIcon(ctx,d.specialAmmo,x,y+Math.sin(t*4)*2,42)}for(const b of game.bullets||[])if(b.life>0&&b.specialAmmo){const [x,y]=point(b.x,b.y);ctx.strokeStyle=b.specialColor;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-b.vx*(b.specialAmmo==='tracer'?.032:.02),y-b.vy*(b.specialAmmo==='tracer'?.032:.02));ctx.stroke()}const target=game.enemies?.find(e=>e.tailId===game.tailTargetId&&e.hp>0);drawTailMarker(ctx,target,game,point);ctx.restore()};
const _tacticalHud91=hud;
hud=()=>{_tacticalHud91();if(!game||game.mode==='coop2')return;const ammo=game.specialAmmoStatus?.();if(ammo){$('ammoLabel').textContent+=' · '+ammo.name;$('ammoCount').textContent+=' · '+t('hud.specialAmmo',{count:ammo.count})}};
const _tacticalEvents91=events;
events=()=>{let lastAmmo=null;const queued=game?.events;if(queued)for(const e of queued)if(e.type==='ammo')lastAmmo=e;_tacticalEvents91();if(lastAmmo){$('toast').textContent=lastAmmo.text+' · '+t('hud.defaultAmmoFirst');show('toast');toastUntil=performance.now()+2600;sfx('pickup')}};
const _tacticalCoopEvents91=coopEvents;
coopEvents=()=>{let lastAmmo=null;const queued=game?.events;if(queued)for(const e of queued)if(e.type==='ammo')lastAmmo=e;_tacticalCoopEvents91();if(lastAmmo){$('toast').textContent=(lastAmmo.ownerId?.toUpperCase()||t('ranking.team'))+' · '+lastAmmo.text;show('toast');coopToastUntil=game.t+2.6;sfx('pickup')}};

// Development-only fixture controls are never loaded by the unbundled hosted app.
if(import.meta.env?.DEV&&new URLSearchParams(location.search).has('bossqa'))import('../tests/stageboss-browser94.js').then(({installBossQA})=>installBossQA({getGame:()=>game,reset:(team,mode)=>{if(game)returnHangar();faction=team;pilot=team==='central'?'baron':'fonck';coopPilot2=pilot;selectedMode=mode;plane=pilotPlane(pilot);start();},draw:()=>{if(game.mode==='coop2'){coopEvents();coopHud();}else{events();hud();}if(game.mode==='coop2')drawCoop(ctx,game,W,H,{terrain:(x,y,w,h)=>paintRegion(game.worldRegion(),x,y,w,h),drawZeppelin,drawFieldArt,fieldArt,fieldArtImg});else draw(ambient);drawStageBoss(ctx,game,W,H,{drawZeppelin,drawFieldArt,layer:'hazards'});updateStageBossHud(game);}}));

function renderAircraft103(){
 let select=$('aircraftSelect103');if(!select){select=document.createElement('select');select.id='aircraftSelect103';select.setAttribute('aria-label','출격 기체');$('pilotAircraft').after(select)}
 select.replaceChildren();const selectable=selectedMode==='coop2'&&pilot==='baron'?['fokker','baron_albatros']:[plane];for(const key of selectable){const option=document.createElement('option');option.value=key;option.textContent=displayAircraftName(pilot,key);option.selected=key===plane;select.append(option)}
 select.disabled=!!game||!(selectedMode==='coop2'&&pilot==='baron');select.title=selectedMode==='coop2'&&pilot==='baron'?'협동 리히트호펜 기체 선택':'파일럿별 역사 지정 기체';select.onchange=()=>{if(game||selectedMode!=='coop2'||pilot!=='baron')return;baronAircraft=select.value==='baron_albatros'?'baron_albatros':'fokker';coopBaronAircraft=baronAircraft;plane=baronAircraft;roster()};
}

const drawBeforeRevision103=draw;
draw=t=>{drawBeforeRevision103(t);if(!game||game.mode==='coop2')return;ctx.save();for(const d of game.revisionDecoys||[]){ctx.globalAlpha=Math.min(.45,d.life*.4);planeSprite(ctx,d.x-game.x+W/2,d.y-game.y+H/2,d.a,aircraftKey(d.plane,false,d.pilot),1)}ctx.restore()};

// Passive power stays in the HUD; no improvised bars, shields or stack pixels are painted on aircraft.
function drawPassiveEffectMarks(){}
// Revision 109 — automatic legendary defenses remain readable without obscuring bullets.
function drawLegendaryDefenseOverlay(g,c,w,h){
 if(!g)return;drawPassiveEffectMarks(g,c,w,h);const players=g.players||[g],zoom=g.players?(g.camera?.zoom||1):1,cx=g.players?(g.camera?.x||0):g.x,cy=g.players?(g.camera?.y||0):g.y;
 for(const p of players){if(!p||p.hp<=0)continue;const x=g.players?(p.x-cx)*zoom+w/2:w/2,y=g.players?(p.y-cy)*zoom+h/2:h/2;
  if(p.kaiserFogTime>0){const phase=(p.kaiserFogTime||0)*2.4,fade=Math.min(1,p.kaiserFogTime/.45);c.save();if(fxReady('mist'))for(let i=0;i<7;i++){const a=i*2.399+phase*.4,r=20+(i%3)*20,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;fx(c,'mist',px,py,96+(i%2)*30,96+(i%2)*30,a*.4,(.17+i*.012)*fade)}else{c.globalCompositeOperation='source-over';for(let i=0;i<9;i++){const a=i*2.399+phase,r=22+(i%3)*18,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r,rr=28+(i%4)*7;const grad=c.createRadialGradient(px,py,2,px,py,rr);grad.addColorStop(0,`rgba(203,210,196,${.22*fade})`);grad.addColorStop(.62,`rgba(151,165,156,${.15*fade})`);grad.addColorStop(1,'rgba(110,125,121,0)');c.fillStyle=grad;c.beginPath();c.arc(px,py,rr,0,Math.PI*2);c.fill()}}c.strokeStyle='#d9d5ad66';c.lineWidth=1;c.beginPath();c.arc(x,y,54+Math.sin(phase*4)*4,0,Math.PI*2);c.stroke();c.restore()}
  if(p.rankinFlash>0){const fade=Math.min(1,p.rankinFlash/.3),back=p.a+Math.PI;c.save();c.translate(x,y);c.rotate(back);c.globalAlpha=fade;c.strokeStyle='#ded9c2';c.lineWidth=2;c.beginPath();c.arc(0,0,52,-1.75,1.75);c.stroke();c.fillStyle='#efe7c9';for(let i=-4;i<=4;i++){const a=i*.24,d=58+Math.abs(i)*5;c.fillRect(Math.cos(a)*d-2,Math.sin(a)*d-1,5,2)}c.restore()}
 }
}

// McCudden may discard one reinforcement row per level-up draft. The engine
// owns eligibility and consumption so reopening the modal cannot restore it.
const modalBeforeLegendaryReroll115=modal;
modal=(tag,title,text,buttons)=>{
 modalBeforeLegendaryReroll115(tag,title,text,buttons);
 if(!game||game.state!=='upgrade'||(buttons.length<3||buttons.length>4)||!buttons.every(b=>b.upgradeId))return;
 const item=game.mode==='coop2'?game.activeUpgrade:null,owner=item?game.player(item.playerId):game;
 const current=item?item.choices:choices;if(!owner?.canRerollChoices?.(current))return;
 const reroll=document.createElement('button');reroll.className='legendary-reroll115';reroll.textContent=t('upgrade.freeReroll');reroll.setAttribute('aria-label',t('upgrade.freeRerollLabel'));
 reroll.onclick=()=>{const next=owner.rerollChoices(current);if(!next)return;sound(520,.16,'triangle');
  if(item){item.choices=next;showCoopUpgrade(item);return;}
  choices=next.map(u=>({id:u.id,rarity:u.rarity}));const rarityName={normal:'일반',magic:'매직',rare:'레어',unique:'유니크',legendary:'특수장비'};
  modal(tag,title,text,choices.map((pick,i)=>{const u=UPGRADES.find(u=>u.id===pick.id);return{upgradeId:pick.id,label:`${i+1}. [${rarityName[pick.rarity]}] ${u.name}`,rarity:pick.rarity,desc:upgradeDescription(pick.id,pick.rarity,game),run:()=>choose(pick.id,pick.rarity)}}));
 };
 $('modalActions').append(reroll);
};

// Revision 117 — deterministic Alps peaks, using the supplied low-density
// terrain module.  Damage remains on the game's established invulnerability
// and death paths; no preview input, HP, or parallel combat loop is used.
function tickAlpsTerrain(g,dt){
 if(!g||g.state!=='playing'||g.worldRegion?.()!==6)return;
 const roster=g.players||[g];
 if(!g.alpsMountains){
  g.alpsMountains=new MountainFieldSafe({seed:Math.floor((g.runSeed||g.t||17)*97)+17,
   safeAreas:roster.map(p=>({x:p.x,y:p.y,radius:130})),damageFraction:.30,cooldown:1.25,
   onDamage:(id,amount)=>{const p=roster.find(q=>(q.id||'p1')===id);if(!p||p.hp<=0)return;if(g.players)g.hitPlayer(p,amount);else g.hit(amount);},
   onImpact:()=>{g.shake=Math.max(g.shake||0,5);g.event?.('wave','알프스 봉우리 충돌 · 기체 손상');}});
 }
 g.alpsMountains.step(dt,{players:roster.map(p=>({id:p.id||'p1',alive:p.hp>0,x:p.x,y:p.y,maxHp:p.maxHp,radius:14})),paused:false});
}
const _alpsFrame117=frame;
frame=now=>{const run=game,before=run?.t||0;_alpsFrame117(now);if(run===game&&game?.state==='playing')tickAlpsTerrain(game,Math.max(0,(game.t||before)-before));};
// Revision 118 — pre-sortie solo leaderboard.  Keep it alongside the co-op
// briefing without altering the flight mode or pilot lock rules.
const soloRankingButton=document.createElement('button');
soloRankingButton.id='soloRanking';soloRankingButton.type='button';soloRankingButton.textContent='랭킹전 기록';soloRankingButton.className='coop-ranking';
soloRankingButton.style.marginTop='10px';soloRankingButton.style.display='block';
$('coopPanel').after(soloRankingButton);
async function showSoloLeaderboard(){if(game||selectedMode!=='endless')return;modal('RANKING MODE',t('ranking.title'),t('ranking.loading'),[{label:t('sortie.screen'),run:()=>show('modal',false)}]);try{const response=await fetch('/api/rankings');if(!response.ok)throw Error();const rows=await response.json();if(!game&&!$('modal').classList.contains('hidden')&&$('modalTag').textContent==='RANKING MODE')renderFactionRanking(rows)}catch{if(!game&&!$('modal').classList.contains('hidden')&&$('modalTag').textContent==='RANKING MODE')$('modalText').textContent=t('ranking.loadFailed')}}
// Ranking insignia are authored PNG sprites, separate from aircraft markings.
const rankingMedalImages=Object.fromEntries(['central','entente'].flatMap(side=>[1,2,3].map(rank=>{
 const image=new Image();image.src=`./ranking-${side}-${rank}.webp?v=ui5`;return [`${side}-${rank}`,image];
})));
const aircraftIronCrossImage=new Image();aircraftIronCrossImage.src='./aircraft-iron-cross.svg?v=ui5';
const aircraftRoundelImage=new Image();aircraftRoundelImage.src='./aircraft-roundel.svg?v=ui5';
function drawRankingFactionMedal(c,side,rank){
 const art=rankingMedalImages[`${side}-${rank+1}`];
 c.clearRect(0,0,c.canvas.width,c.canvas.height);
 if(art?.complete&&art.naturalWidth){c.imageSmoothingEnabled=true;const scale=Math.min(c.canvas.width/art.naturalWidth,c.canvas.height/art.naturalHeight)*.96,w=art.naturalWidth*scale,h=art.naturalHeight*scale;c.drawImage(art,(c.canvas.width-w)/2,(c.canvas.height-h)/2,w,h);return}
 if(art){art.addEventListener('load',()=>drawRankingFactionMedal(c,side,rank),{once:true});return}
}
function renderFactionRanking(rows){
 if(game||$('modal').classList.contains('hidden')||$('modalTag').textContent!=='RANKING MODE')return;
 $('rankingPanel')?.remove();
 const panel=document.createElement('section');panel.id='rankingPanel';panel.className='ranking-panel';$('modalActions').before(panel);
 const tabs=document.createElement('div');tabs.className='ranking-faction-tabs';
 const list=document.createElement('ol');list.className='ranking-medal-list';
 // The server is authoritative.  The aliases retain compatibility with old
 // records created before faction was stored in the ranking response.
 const aliases={'조르즈 기네미르':'entente','조르주 기네미르':'entente','조르즈 기네메르':'entente','조르주 기네메르':'entente'};
 const factionOf=r=>r.faction||PILOTS[r.pilot]?.faction||Object.values(PILOTS).find(p=>p.name===r.pilot)?.faction||aliases[r.pilot]||null;
 const paintMedal=(badge,i,side)=>{
   badge.width=42;badge.height=42;drawRankingFactionMedal(badge.getContext('2d'),side,i);badge.setAttribute('aria-label',`${side==='central'?'동맹국':'협상국'} ${i+1}위 훈장`);
 };
 const paint=(side,sourceRows)=>{
   list.replaceChildren();
   const subset=(side==='all'?sourceRows:sourceRows.filter(r=>factionOf(r)===side)).slice(0,10);
   subset.forEach((r,i)=>{
     const li=document.createElement('li');
     const badge=document.createElement('canvas');badge.width=36;badge.height=36;badge.className='ranking-medal';
     if(side==='all') drawRefinedFactionMark120(badge.getContext('2d'),factionOf(r));
     else if(i<3) paintMedal(badge,i,side);
     else drawRefinedFactionMark120(badge.getContext('2d'),factionOf(r));
     li.append(badge,document.createTextNode(t('ranking.rowPriority',{rank:i+1,name:r.name,pilot:pilotName(r.pilot,PILOTS[r.pilot]?.name||r.pilot||t('ranking.missingPilot')),score:Number(r.score).toLocaleString()})));list.append(li);
   });
   if(!subset.length)list.textContent=t('ranking.emptyPriority');
 };
 const select=async(side,button)=>{tabs.querySelectorAll('button').forEach(x=>x.classList.toggle('selected',x===button));if(side==='all'){paint(side,rows);return}list.textContent=t('ranking.loading');try{const response=await fetch(`/api/rankings?faction=${side}`);if(!response.ok)throw Error();const factionRows=await response.json();if(game||$('modal').classList.contains('hidden')||$('modalTag').textContent!=='RANKING MODE'||!button.classList.contains('selected'))return;paint(side,factionRows)}catch{if(button.classList.contains('selected'))list.textContent=t('ranking.loadFailed')}};
 for(const [id,key] of [['all','ranking.all'],['entente','faction.entente'],['central','faction.central']]){const b=document.createElement('button');b.textContent=t(key);b.onclick=()=>select(id,b);tabs.append(b)}
 panel.append(tabs,list);tabs.firstChild.click();
}
soloRankingButton.onclick=showSoloLeaderboard;
const rosterWithSoloRanking=roster;roster=()=>{rosterWithSoloRanking();show('soloRanking',!game&&selectedMode==='endless')};
show('soloRanking',!game&&selectedMode==='endless');

// Revision 119 — high-detail battlefields, faction durability mark, and a
// cleaner pilot roster. These are presentation-only and do not alter combat.
const durabilityMark=document.createElement('canvas');durabilityMark.width=24;durabilityMark.height=24;durabilityMark.className='durability-faction-mark healthMark151';durabilityMark.setAttribute('aria-label','소속 비행단 표식');document.querySelector('#hud>div:first-child')?.append(durabilityMark);
const rosterWithoutPilotMedal=roster;roster=()=>{rosterWithoutPilotMedal();$('pilotTabs').querySelectorAll?.('.pilot-medal').forEach(mark=>mark.remove())};

// Revision 120 — a map image may finish loading after the first draw.  Never
// keep that temporary flat tile in the countryside cache for the whole sortie.
const refreshTerrainAtlas120=()=>{terrainAlpsRenderer.tiles?.clear?.()};
terrainAlpsAtlas.onload=refreshTerrainAtlas120;if(terrainAlpsAtlas.naturalWidth)refreshTerrainAtlas120();
terrainAlpsRenderer.tileSize=768;

function drawRefinedFactionMark120(c,side){
 c.clearRect(0,0,32,32);c.imageSmoothingEnabled=true;const art=side==='central'?aircraftIronCrossImage:aircraftRoundelImage;
 if(art.complete&&art.naturalWidth)c.drawImage(art,2,2,28,28);
 else if(typeof art.addEventListener==='function')art.addEventListener('load',()=>drawRefinedFactionMark120(c,side),{once:true});
}
durabilityMark.width=32;durabilityMark.height=32;
// The 32px faction mark only changes with the faction (or when its art finishes loading);
// repainting a DOM canvas every frame forced a fresh layer upload each frame for identical pixels.
let durabilityMarkSig='';const hudWithRefinedFactionMark120=hud;hud=()=>{hudWithRefinedFactionMark120();const side=PLANES[game?.plane||plane]?.faction,art=side==='central'?aircraftIronCrossImage:aircraftRoundelImage,sig=side+'|'+(art.complete&&art.naturalWidth?1:0);if(sig===durabilityMarkSig)return;durabilityMarkSig=sig;drawRefinedFactionMark120(durabilityMark.getContext('2d'),side)};

// The hangar is revealed only after every portrait, aircraft and icon used by
// the current build is ready. This prevents the retired sheets from flashing
// for a frame before the authored asset replaces them.
const bootAt=performance.now();
const terrainAtlasReady=new Promise(resolve=>{if(terrainAlpsAtlas.complete)resolve(terrainAlpsAtlas.naturalWidth>0);else{terrainAlpsAtlas.addEventListener('load',()=>resolve(true),{once:true});terrainAlpsAtlas.addEventListener('error',()=>resolve(false),{once:true})}});
const warmStageAssetsReady=Promise.all([prepareStageBossAssets(0),prepareAADefenseAssets(['fx','drachen'])]).catch(()=>{});
// Split gate: the hangar only needs portraits/planes/icons, so reveal as soon
// as those land. Battle assets (FX sprites, terrain, boss atlas) stream in the
// background and are re-checked when the sortie button fires.
const hangarCardKeys=[...new Set(Object.keys(PILOTS).map(id=>aircraftKey(pilotPlane(id),false,id)).concat(['baron_albatros']))];
const hangarCardsReady=Promise.all(hangarCardKeys.map(hangarArt));
// Boot priority (boot-gate.js): the pilot on screen first, then the hangar portraits and
// illustrations (the shown faction before the other), then battle art. The hangar reveals as soon
// as the pilot on screen is ready, and whichever pilot the player picks jumps the queue.
const HANGAR_UI=/icons\d*\.webp|controls\d+|gun-atlas|relic-|medal\d*\.webp|hangar-keyart|emblem_bare_|medal_general_|ranking-|equipment-atlas/;
const bootGate=window.HEADON_GATE,absUrl=u=>new URL(u,document.baseURI).href;
const artUrls=key=>{const file=hangarKeyFile[key]||key;return [absUrl(hangarArtSource(key)),absUrl(`./mech/${file}.webp?v=ui5`),absUrl(`./mech/${{fokker_red:'fokker',fokker_voss:'fokker_f1',nieuport_italian:'nieuport'}[key]||key}.webp?v=ui5&b=347`)]};
const pilotUrls=(id,airframe=pilotPlane(id))=>[absUrl(portraitSources[id]||`./portrait-${id}.webp`),...artUrls(aircraftKey(airframe,false,id))];
const shownKey=aircraftKey(plane,false,pilot),shownUrls=new Set(pilotUrls(pilot,plane));
const rankHangar=()=>{const near=new Set(),far=new Set(),faces=new Set();for(const id of Object.keys(PILOTS)){const urls=pilotUrls(id);if(PILOTS[id].faction===faction){faces.add(urls[0]);for(const u of urls)near.add(u)}else for(const u of urls)far.add(u)}for(const u of artUrls('baron_albatros'))near.add(u);
 bootGate?.setRank?.(u=>{const b=u.replace(/&r=\d+$/,'');return shownUrls.has(b)||HANGAR_UI.test(b)||faces.has(b)?0:near.has(b)||far.has(b)?1:/augmentation-icons\//.test(b)?1.8:2})};
rankHangar();
const raisePilot=()=>setTimeout(()=>{if(!game&&bootGate&&!bootGate.open){rankHangar();bootGate.raise(pilotUrls(pilot,plane))}},0);
for(const id of ['pilotTabs','central','entente','baronAircraftChoice','aircraftSelect103'])$(id)?.addEventListener('click',raisePilot,true);
$('aircraftSelect103')?.addEventListener('change',raisePilot);
const shownPortraitReady=new Promise(r=>{const i=new Image();i.onload=i.onerror=()=>r();i.src=portraitSources[pilot]||''});
// The hangar opens only once every pilot card is decoded — all aircraft and all
// portraits — so a longer splash beats a half-empty roster. Every source promise
// resolves on error too, so a missing file can never hold the gate forever.
// hangarArtReady joins the gate because the hangar canvases draw the painted sprites —
// without it the cards are decoded but the planes on them still fill in after entry.
// Only the hangar airframes gate the reveal; the rest of the painted set streams
// behind the splash so the wait stays short on slow connections.
// The reveal waits only for what the first screen paints: the shown faction's tab
// portraits, the selected aircraft's figure art and painted sprite, and the icons.
// Every other pilot's art and portrait keeps warming at rank 1 so a faction switch
// still lands quickly — but it can no longer hold the splash hostage.
const visiblePortraitReady=Promise.all(Object.keys(PILOTS).filter(id=>PILOTS[id].faction===faction).map(id=>portraitLoaded.get(id)||Promise.resolve(true)));
const gateDeps={portraits:visiblePortraitReady,figure:hangarArt(shownKey),icons:hangarIconsReady,sprite:paintedReady(shownKey)};
const hangarReady=Promise.all(Object.values(gateDeps));
for(const n of Object.keys(gateDeps))gateDeps[n].then(()=>{(window.__gateMarks=window.__gateMarks||{})[n]=Math.round(performance.now()/100)/10},()=>{(window.__gateMarks=window.__gateMarks||{})[n]='err'});
const battleReady=Promise.all([fxArtReady,battlefieldArtReady,fieldUnitsReady,terrainProfilesReady,terrainAtlasReady,warmStageAssetsReady,aircraftReady]);
// The splash stays up until everything the first hangar screen shows can paint at once:
// every visible <img> and CSS background decoded, measured on the laid-out
// hangar itself (so nothing added later by other modules is missed). 30 s caps a dead network.
const urlsOfBackground=v=>[...String(v).matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m=>m[1]).filter(u=>!u.startsWith('data:'));
async function hangarPaintable(){
 const visible=el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
 const imgs=[...document.querySelectorAll('img')].filter(i=>i.getAttribute('src')&&visible(i));
 const bgs=new Set();for(const el of document.querySelectorAll('#hangar *,#flightRoster *,body>header *,.astra-stage *,.astra-lower *')){const bg=getComputedStyle(el).backgroundImage;if(bg&&bg!=='none'&&visible(el))for(const u of urlsOfBackground(bg))bgs.add(absUrl(u))}
 const extra=[...bgs].map(u=>{const i=new Image();i.decoding='async';i.src=u;return i});
 bootGate?.raise?.([...imgs.map(i=>i.src),...bgs]);
 const marks=(window.__gateMarks=window.__gateMarks||{}),pending=marks.pending=new Set(),note=(n,p)=>{pending.add(n);return Promise.resolve(p).catch(()=>{}).then(()=>{pending.delete(n);marks.last=n;marks.lastAt=Math.round(performance.now()/100)/10})};
 // (document.fonts.ready is not awaited: no web fonts here, and it resolves only after the page's
 // load event — i.e. after every queued battle image.)
 await Promise.all([...imgs.map(i=>note(i.src.split('/').pop(),i.decode?.())),...extra.map(i=>note(i.src.split('/').pop(),i.decode?.()))]);
 // Anything swapped in while we waited (a roster pass, a late module) gets one more round.
 if([...document.querySelectorAll("img")].some(i=>i.getAttribute("src")&&visible(i)&&!i.complete))await new Promise(r=>setTimeout(r,120)).then(hangarPaintable);
}
const capWait=(p,ms)=>Promise.race([p,new Promise(r=>setTimeout(r,ms))]);
const reveal=()=>{roster();applyPilotPortrait('cutinPortrait');
 capWait(hangarPaintable(),30000).then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))).then(()=>{document.body.classList.add('assets-ready','hangar-shown');bootGate?.relax?.();(window.__gateMarks=window.__gateMarks||{}).shown=Math.round(performance.now()/100)/10})};
hangarReady.then(()=>{
 // The strict-priority hold stays until the splash lifts (so battle art cannot crowd out the
 // last hangar images), then relaxes: the rest keeps arriving in rank order. Sortie still calls
 // releaseAll — a battle needs everything at once.
 const left=2000-(performance.now()-bootAt);left>0?setTimeout(reveal,left):reveal();
}).catch(reveal);
// The boot gate holds most battle art behind the hangar art, so a fast sortie can face the
// full download only after the click. Wait for it briefly, then launch anyway — every sprite
// has a procedural fallback and the painted files keep streaming in behind the game.
function sortie(){window.HEADON_GATE?.releaseAll();document.body.classList.remove('assets-ready');const _en=getLocale()==='en';$('sortieVeilTitle').textContent=_en?'SORTIE LAUNCH':'출격';$('sortieVeilStatus').textContent=_en?'Preparing aircraft…':'기체 준비 중…';show('hangar',false);show('sortieVeil',true);let began=false;const go=()=>{if(began)return;began=true;show('sortieVeil',false);document.body.classList.add('assets-ready');start()};battleReady.then(go,go);setTimeout(go,2600)}

// Shared reinforcement presentation for solo, co-op, and special rerolls.
const modalBefore151=modal;
modal=(tag,title,text,buttons)=>{
 document.getElementById('build151')?.remove();$('modal').classList.remove('build-modal151');
 const isChoice=buttons.some(b=>b.upgradeId);$('modal').classList.toggle('choice-modal151',isChoice);
 if(isChoice){title=t('upgrade.title');text=game?.mode==='coop2'?text:t('upgrade.prompt');buttons=buttons.map(b=>{if(!b.upgradeId)return b;const u=UPGRADES.find(u=>u.id===b.upgradeId);return {...b,label:reinforcementName(u,b.owner||game,PLANES),desc:translatedUpgradeDescription(b.upgradeId,cleanDescription(b.desc))}})}
 modalBefore151(tag,title,text,buttons);
 if(!isChoice)return;
 const cards=[...$('modalActions').querySelectorAll('.choice')];cards.forEach((card,i)=>{const b=buttons.filter(b=>b.upgradeId)[i],p=b.owner||game;card.classList.add('reinforcement-card151');card.dataset.equipment=b.upgradeId;card.style.setProperty('--arrival',i*70+'ms');if(b.upgradeId==='ironCross')card.title=PLANES[p.plane]?.faction==='entente'?'Victoria Cross':'Pour le Mérite';
 const category=document.createElement('small');category.className='effect-category151';category.textContent=categoryName(b.upgradeId);card.prepend(category);
 const rarity=document.createElement('small');rarity.className='rarity-label160';rarity.textContent=rarityName(b.rarity||'normal').toUpperCase();card.append(rarity);
 const total=document.createElement('span');total.className='cumulative151';total.textContent=cumulativeText(p,b.upgradeId,b.rarity);card.append(total);
 if(b.rarity==='legendary'){
  const run=card.onclick;card.onclick=()=>{if($('modal').classList.contains('equipping156'))return;$('modal').classList.add('equipping156');card.classList.add('equipping156');for(const el of $('modalActions').querySelectorAll('button'))el.disabled=true;setTimeout(()=>{$('modal').classList.remove('equipping156');run?.()},280)};
 }
 });
 $('modal').classList.toggle('special-draft156',buttons.some(b=>b.rarity==='legendary'));
 if(buttons.some(b=>b.rarity==='legendary'))$('modalText').textContent=t('special.prompt');
};
function closeBuildPop151(){document.querySelector('#build151 .build-pop151')?.remove();for(const t of document.querySelectorAll('#build151 .build-tile151[aria-expanded="true"]'))t.setAttribute('aria-expanded','false')}
function openBuildPop151(tile,{name,rarity,count,category,stats,desc,en}){
 const area=document.getElementById('build151');if(!area)return;const el=(tag,text,cls)=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e};
 const pop=el('div','','build-pop151 rarity-'+rarity);pop.setAttribute('role','dialog');pop.setAttribute('aria-label',name);pop.onclick=e=>e.stopPropagation();
 const head=el('div','','build-pop-head151');head.append(el('small',category+' · '+rarityName(rarity),'build-pop-kind151'));if(count>1)head.append(el('small',(en?'Stacks ×':'중첩 ×')+count,'build-pop-count151'));
 pop.append(head,el('strong',name));
 if(stats.length){const list=el('dl','','build-pop-stats151');list.append(el('dt',en?'Build total':'누적 효과','build-pop-cap151'));for(const s of stats){const row=el('div','');row.append(el('dt',s.name),el('dd',s.value));list.append(row)}pop.append(list)}
 if(desc)pop.append(el('p',desc));
 area.append(pop);tile.setAttribute('aria-expanded','true');
 // Anchor under the tile (above it when the tile sits low in view), clamped to the build column.
 const a=area.getBoundingClientRect(),r=tile.getBoundingClientRect(),w=pop.offsetWidth,h=pop.offsetHeight,card=area.closest('.modal-card')?.getBoundingClientRect(),acts=document.getElementById('modalActions')?.getBoundingClientRect();
 const floor=Math.min(window.innerHeight,card?.bottom??Infinity,acts&&acts.top>r.bottom?acts.top:Infinity)-8,ceil=Math.max(0,card?.top??0)+8;
 const left=Math.max(0,Math.min(a.width-w,r.left-a.left+r.width/2-w/2)),below=r.bottom+8+h<=floor||r.top-8-h<ceil&&floor-r.bottom>=r.top-ceil;
 pop.style.left=left+'px';pop.style.top=(below?r.bottom-a.top+8:r.top-a.top-8-h)+'px';pop.style.setProperty('--tip',(r.left-a.left+r.width/2-left)+'px');pop.classList.toggle('above151',!below);
}
document.addEventListener('click',e=>{if(!e.target.closest?.('.build-pop151,.build-tile151'))closeBuildPop151()},true);
function showBuildPause151(){
 modal('PAUSED','현재 빌드','ESC · 계속하기',[{label:'계속하기',run:resume},{label:'설정',run:showSettings151},{label:'전투 종료',run:returnHangar}]);$('modal').classList.remove('settings-modal151','manual-modal151');$('modal').classList.add('build-modal151');
 document.getElementById('build151')?.remove();
 const area=document.createElement('div');area.id='build151';
 const el=(tag,text,cls)=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e};
 for(const p of game.players||[game]){const section=el('section','');const rankedKills=game.mode==='coop2'?(game.priorityKills||0):(p===game?(game.priorityKills||0):(p.priorityKills??game.priorityKills??0));
  // The pilot's round hangar portrait sits left of the centred name, like the
  // ability medallions below it.
  const head=el('div','','build-head151'),bust=el('span','','build-portrait151');bust.setAttribute('aria-hidden','true');
  if(portraitSources[p.pilot]){bust.style.backgroundImage=`url('${portraitSources[p.pilot]}'),radial-gradient(circle at 50% 38%,#3a3426,#14110c 78%)`;bust.style.backgroundSize='auto 108%,cover';bust.style.backgroundPosition='center 12%,center'}
  head.append(bust,el('h3',(p.id?p.id.toUpperCase()+' · ':'')+PILOTS[p.pilot].name));
  section.append(head,el('p',displayAircraftName(p.pilot,p.plane)+' · '+String(Math.floor(game.t/60)).padStart(2,'0')+':'+String(Math.floor(game.t%60)).padStart(2,'0')+' · 랭킹 격추 '+rankedKills+'기 · LV. '+p.level,'build-meta151'));
 const lid=p.pilot==='baron'&&p.plane==='baron_albatros'?'baron:baron_albatros':p.pilot,ld=pilotLoadout(p.pilot,p.plane),idCopy=pilotIdentityCopy(lid,getLocale()),abs=el('div','','build-abilities151');
 for(const [kind,label,name,short,detail]of [['active','액티브',localizedActive(lid,ld.skill),hangarPilotDescription(lid,ld.desc),idCopy?.activeDetail||ld.desc],['passive','패시브',localizedPassive(lid,ld.passive),hangarPassiveDescription(lid,ld.passiveDesc),idCopy?.passiveDetail||ld.passiveDesc]]){
  const item=el('div','','astra-ability astra-'+kind);item.tabIndex=0;item.setAttribute('role','button');item.setAttribute('aria-expanded','false');
  const icon=el('span','','astra-ability-icon');icon.setAttribute('aria-hidden','true');const copy=el('div','','astra-ability-copy');copy.append(el('small',label,'astra-ability-label'),el('b',name));item.append(icon,copy);
  const fill=()=>{let pop=item.querySelector('.ho-skill-pop');if(!pop){pop=el('div','','ho-skill-pop');pop.setAttribute('role','note');item.append(pop)}pop.replaceChildren();pop.append(el('small',kind==='active'?'ACTIVE':'PASSIVE','ho-skill-kind'),el('strong',name),el('p',detail||short));if(kind==='active'&&p.skillDuration&&p.skillCooldown){const en=getLocale()==='en',fm=n=>(Math.round(n*10)/10).toString(),meta=el('div','','ho-skill-meta');for(const [lab,val]of[[en?'Duration':'지속',fm(p.skillDuration())+(en?'s':'초')],[en?'Cooldown':'재사용',fm(p.skillCooldown())+(en?'s':'초')]]){const c=el('span',''),b=el('b',val);c.append(lab+' ',b);meta.append(c)}pop.append(meta)}};
  const toggle=e=>{e.stopPropagation();const open=!item.classList.contains('ho-tip');for(const i of abs.querySelectorAll('.astra-ability')){i.classList.remove('ho-tip');i.setAttribute('aria-expanded','false')}item.classList.toggle('ho-tip',open);item.setAttribute('aria-expanded',String(open));if(open)fill()};
  item.onclick=toggle;item.onkeydown=e=>{if(e.code==='Enter'||e.code==='Space'){e.preventDefault();toggle(e)}};abs.append(item)}
 section.append(abs);
 // Upgrades and special equipment as an even icon grid; a tap opens what each one adds up to so far.
 const en=getLocale()==='en';
 for(const [heading,test]of [['획득 강화',u=>!u.legendary&&!u.uniqueOnly],['고유 강화',u=>u.uniqueOnly],['SPECIAL EQUIPMENT',u=>u.legendary]]){const held=UPGRADES.filter(u=>p.upgrades[u.id]&&test(u));section.append(el('h4',heading));const tiles=el('div','','build-icons151');if(!held.length)tiles.append(el('span','없음','empty151'));
  for(const u of held){const rarity=u.legendary?'legendary':u.uniqueOnly?'unique':p.upgradeRarities?.[u.id]||'normal',count=p.upgrades[u.id]||1,name=reinforcementName(u,p,PLANES);
   const tile=el('button','','build-tile151 rarity-'+rarity);tile.type='button';tile.dataset.upgradeId=u.id;tile.setAttribute('aria-label',name+(count>1?' ×'+count:''));tile.setAttribute('aria-expanded','false');
   const icon=document.createElement('canvas');icon.width=112;icon.height=88;icon.setAttribute('aria-hidden','true');choiceIconRefs.push({canvas:icon,id:u.id,owner:p});drawUpgradeIcon(icon,u.id,p);tile.append(icon);
   if(count>1)tile.append(el('b','×'+count,'build-count151'));
   tile.onclick=e=>{e.stopPropagation();const open=tile.getAttribute('aria-expanded')!=='true';closeBuildPop151();if(open)openBuildPop151(tile,{name,rarity,count,category:categoryName(u.id),stats:heldStats(p,u.id),desc:translatedUpgradeDescription(u.id,cleanDescription(u.desc)),en})};
   tiles.append(tile)}
  section.append(tiles)}
 area.append(section);
 }$('modalText').after(area);
}
function syncStartHint(){const k=document.querySelectorAll('.start-hint kbd');if(k[1])k[1].textContent=keyLabel(KEYBINDS.evade);if(k[2])k[2].textContent=keyLabel(KEYBINDS.skill)}
function cycleZoom(){const steps=[.8,.9,1,1.1,1.25,1.4];const i=steps.findIndex(s=>Math.abs(s-userZoom)<.005);userZoom=steps[(i<0?2:i+1)%steps.length];try{localStorage.setItem('headon.zoom',String(userZoom))}catch(_){}resize()}
function settingsIcon151(name){
 const paths={
  sound:'<path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16 9a4 4 0 0 1 0 6m2.5-9a8 8 0 0 1 0 12"/>',
  sfx:'<path d="M4 12h3m2-4v8m3-11v14m3-10v6m3-3h2"/>',
  music:'<path d="M9 18V7l10-2v11"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  fps:'<path d="M4 17a8 8 0 1 1 16 0"/><path d="m12 13 4-4"/><path d="M7 17h10"/>',
  language:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.2 2.4 3.3 5.4 3.3 9S14.2 18.6 12 21c-2.2-2.4-3.3-5.4-3.3-9S9.8 5.4 12 3Z"/>',
  display:'<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8m-4-4v4"/>',
  keys:'<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M7 11h.01M11 11h.01M15 11h.01M17 11h.01M7 14h10"/>',
  key:'<rect x="5" y="6" width="14" height="12" rx="2"/><path d="M9 10h6v4H9z"/>',
  battery:'<rect x="2" y="8" width="16" height="8" rx="2"/><path d="M22 11v2"/><path d="M6 11v2m3-2v2"/>',
  fullscreen:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  zoom:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.5-4.5M8 11h6M11 8v6"/>',
  reset:'<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
  back:'<path d="m14 6-6 6 6 6"/>'
 },span=document.createElement('span');span.className='setting-icon151';span.setAttribute('aria-hidden','true');span.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths[name]||paths.sound}</svg>`;return span
}
function applySettingsRows151(icons){[...$('modalActions').querySelectorAll('button')].forEach((button,index)=>{const label=document.createElement('span');label.className='setting-label151';label.textContent=button.textContent;button.replaceChildren(settingsIcon151(icons[index]),label);button.classList.add('settings-row151')})}
function showKeybindSettings(note){modal('SETTINGS',t('settings.keysTitle'),note||t('settings.keysHint'),[...BIND_ACTIONS.map(a=>({label:t('key.'+a)+' · '+keyLabel(KEYBINDS[a]),run:()=>{capturingBind=a;showKeybindSettings(t('settings.keysCapture'))}})),{label:t('settings.keysReset'),run:()=>{Object.assign(KEYBINDS,KEYBIND_DEFAULTS);try{localStorage.removeItem('headon.keybinds')}catch(_){}syncStartHint();showKeybindSettings()}},{label:t('settings.backSettings'),run:showSettings151}]);$('modal').classList.remove('build-modal151');$('modal').classList.add('settings-modal151');applySettingsRows151([...BIND_ACTIONS.map(()=> 'key'),'reset','back'])}
function showSettings151(){modal('SETTINGS',t('settings.title'),t('settings.paused'),[{label:t('settings.sound'),run:showSettingsSound151},{label:t('settings.display'),run:showSettingsDisplay151},{label:t('settings.keys'),run:()=>showKeybindSettings()},{label:getLocale()==='en'?'Language · English → 한국어':'언어 · 한국어 → English',run:()=>{setLocale(getLocale()==='en'?'ko':'en');showSettings151()}},{label:t('settings.back'),run:showBuildPause151}]);$('modal').classList.remove('build-modal151');$('modal').classList.add('settings-modal151');applySettingsRows151(['sound','display','keys','language','back'])}
function showSettingsSound151(){modal('SETTINGS',t('settings.sound'),t('settings.paused'),[{label:muted?t('settings.allOff'):t('settings.allOn'),run:()=>{$('sound').click();showSettingsSound151()}},{label:(muted||sfxOff)?t('settings.sfxOff'):t('settings.sfxOn'),run:()=>{sfxOff=!sfxOff;applyAudioPrefs();showSettingsSound151()}},{label:(muted||bgmOff)?t('settings.bgmOff'):t('settings.bgmOn'),run:()=>{bgmOff=!bgmOff;applyAudioPrefs();showSettingsSound151()}},{label:t('settings.backSettings'),run:showSettings151}]);$('modal').classList.remove('build-modal151');$('modal').classList.add('settings-modal151');applySettingsRows151(['sound','sfx','music','back'])}
function showSettingsDisplay151(){modal('SETTINGS',t('settings.display'),t('settings.paused'),[{label:hiFpsMode?t('settings.hiFpsOn'):t('settings.hiFpsOff'),run:()=>{hiFpsMode=!hiFpsMode;try{localStorage.setItem('headon.hiFps',hiFpsMode?'1':'0')}catch(_){}showSettingsDisplay151()}},{label:batterySaver?t('settings.saverOn'):t('settings.saverOff'),run:()=>{batterySaver=!batterySaver;try{localStorage.setItem('headon.saver',batterySaver?'1':'0')}catch(_){}showSettingsDisplay151()}},{label:t('settings.fullscreen'),run:()=>{flightViewport.fullscreen();showSettingsDisplay151()}},{label:t('settings.scale')+Math.round(userZoom*100)+'%',run:()=>{cycleZoom();showSettingsDisplay151()}},{label:t('settings.backSettings'),run:showSettings151}]);$('modal').classList.remove('build-modal151');$('modal').classList.add('settings-modal151');applySettingsRows151(['fps','battery','fullscreen','zoom','back'])}

if(import.meta.env?.DEV&&new URLSearchParams(location.search).has('reinforcementqa'))import('../tests/reinforcement-browser151.js?v=ui5').then(({installReinforcementQA})=>installReinforcementQA({getGame:()=>game,reset:(team,mode)=>{if(game)returnHangar();faction=team;pilot=team==='central'?'baron':'fonck';coopPilot2=pilot;selectedMode=mode;plane=pilotPlane(pilot);start()},pause:showBuildPause151,refresh:()=>{if(game.mode==='coop2'){coopEvents();coopHud()}else{events();hud()}updateStageBossHud(game)},pick:(items)=>{game.state='upgrade';choices=items;modal('QA · LIVE CHOICES','강화 선택','',items.map(pick=>{const u=UPGRADES.find(u=>u.id===pick.id);return{upgradeId:u.id,rarity:pick.rarity,label:u.name,desc:upgradeDescription(u.id,pick.rarity,game),run:()=>choose(u.id,pick.rarity)}}))}}));

// Revision 160 — portable elite-enemy module, rendered as a distinct combat layer.
const drawBeforeElite160=draw;
draw=t=>{
 drawBeforeElite160(t);
 if(!game?.eliteEnemies||game.mode)return;
 ctx.save();renderEliteLayer(ctx,game.eliteEnemies,{point:(x,y)=>[x-game.x+W/2,y-game.y+H/2]},eliteAssets,t);ctx.restore();
};

// Campaign data remains loaded, but disabled entries and direct mode injection
// always fall back to the standard free sortie path.
const rosterWithCampaignGuard=roster;roster=()=>{normalizeSelectedMode();return rosterWithCampaignGuard()};
const startWithCampaignGuard=start;start=(...args)=>{normalizeSelectedMode();return startWithCampaignGuard(...args)};
$('start').onclick=sortie;

// Locale presentation is installed last so it follows the final gameplay wrappers
// without changing their state or control flow.
const UI_LITERAL={
 '강화 선택':'upgrade.title','전투에 적용할 강화를 하나 선택하세요':'upgrade.prompt','현재 빌드':'pause.title','ESC · 계속하기':'pause.text','계속하기':'pause.continue','설정':'pause.settings','전투 종료':'pause.end',
 '출격 기록':'result.title','출격 종료 · 랭킹 등록':'result.register','작전 실패':'result.lost','랭킹전 기록':'ranking.title','서버 기록 확인 중…':'ranking.loading','출격 화면으로':'sortie.screen','재출격':'sortie.retry','파일럿 변경':'sortie.pilotChange',
 '일반':'rarity.normal','매직':'rarity.magic','레어':'rarity.rare','유니크':'rarity.unique','특수장비':'rarity.legendary','적 에이스':'warning.ace','에이스 편대 등장':'warning.aceGroup','전투 공역 진입':'warning.airspace'
};
const localeText=value=>UI_LITERAL[value]?t(UI_LITERAL[value]):value;
const RUNTIME_EVENT_EN={
 '아군 지원 편대 도착':'Friendly support flight arrived','대공포 발사! 탄막을 피하세요':'Flak barrage incoming — evade','제2파 · 추격기 접근':'Wave 2 · Pursuit fighters approaching','제3파 · 전선 돌파':'Wave 3 · Breakthrough','기습! 고속 추격 편대':'Ambush · High-speed pursuit flight','폭격 편대 통과':'Bomber formation crossing','전방 수리 보급품!':'Repair supplies ahead','돌풍 발생! 풍압을 피하세요':'Gust front incoming — evade','돌풍에 휘말렸다! 조준이 흔들린다':'Caught in turbulence · aim disrupted','폭격 투하! 붉은 표적을 벗어나세요':'Bombs away · clear the red target zone','폭격 종료 · 탄약 소진, 재장전 필요':'Bombing run complete · ammunition depleted','비행선 붕괴! 충격 돌풍 접근':'Airship collapse · shock gust incoming','아군 폭격대 진입 · 폭탄 5발 투하':'Friendly bombers inbound · five bombs released','기뢰지대 발견 · 붉은 기뢰를 피하거나 사격으로 제거하세요':'Minefield spotted · evade or shoot the red mines','적 함대 접근 · 함선의 대공 탄막을 피하세요':'Enemy fleet approaching · evade naval flak','독가스 살포 예고 · 노란 경계 밖으로 이동하세요':'Gas attack warning · move outside the yellow boundary','수소 화재 · 적과 아군 모두 접근 금지':'Hydrogen fire · all aircraft keep clear','전원 지대 · 기뢰지대 진입':'Open Country · Minefield sector','아드리아해 · 적 함대 진입':'Adriatic Sea · Enemy fleet sector','참호 전선 · 대공포 진입':'Trench Front · Flak sector','2인 협동 출격 · 서로의 꼬리를 지켜주세요':'2P co-op sortie · cover each other','2인 협동 · 서로의 꼬리를 지켜주세요':'2P co-op · cover each other','적 비행선 강습':'Enemy airship raid'};
const runtimeEventText=value=>getLocale()==='en'?(RUNTIME_EVENT_EN[value]||value):value;
const modalWithLocale=modal;
modal=(tag,title,text,buttons=[])=>modalWithLocale(tag,localeText(title),localeText(text),buttons.map(button=>{
 const localized={...button,label:localeText(button.label)};
 if(button.upgradeId)localized.desc=translatedUpgradeDescription(button.upgradeId,button.desc);
 return localized;
}));
const rosterWithLocale=roster;
roster=()=>{const result=rosterWithLocale();applyTranslations();$('nicknameLabel').textContent=t(selectedMode==='coop2'?'pilot.nicknameP1':'pilot.nickname');$('central').lastChild&&($('central').lastChild.textContent=t('faction.central'));$('entente').lastChild&&($('entente').lastChild.textContent=t('faction.entente'));$('start').textContent=selectedMode==='coop2'?t('sortie.startCoop'):t('sortie.start');return result};
const hudWithLocale=hud;
hud=()=>{hudWithLocale();if(!game)return;const reloading=game.reloadTime>0;__txt($('record'),t('record.best',{score:String(best).padStart(3,'0')}));__data($('ammoHud'),'status',reloading?t('hud.reloading'):t('hud.ammo'));__txt($('reload'),reloading?t('hud.reloading'):'R');$('reload').setAttribute('aria-label',reloading?`${t('hud.reloading')} ${game.reloadTime.toFixed(1)}s`:t('hud.reload'));/* kept unconditional: astra's reload-readout observer keys its per-frame sync off this write */__txt($('skillStatus'),game.skillTime>0?t('active.running'):game.cooldown>0?t('active.wait',{seconds:game.cooldown.toFixed(1)}):t('active.ready'));__txt($('skillButtonText'),t('active.label'));__txt($('skillButtonState'),game.cooldown>0?`${Math.ceil(game.cooldown)}s`:t('coop.ready'));__txt($('maneuverButtonText'),t('maneuver.label'));__txt($('maneuverButtonState'),game.evadeCooldown>0?`${Math.ceil(game.evadeCooldown)}s`:t('coop.ready'))};
const eventsWithLocale=events;
events=()=>{eventsWithLocale();if(getLocale()!=='en')return;if($('bossName').textContent==='적 에이스')$('bossName').textContent=t('warning.ace');if($('bossName').textContent==='에이스 편대 등장')$('bossName').textContent=t('warning.aceGroup');if($('bossArrivalDetail').textContent==='전투 공역 진입')$('bossArrivalDetail').textContent=t('warning.airspace')};
const startWithLocale=start;
start=(...args)=>{const result=startWithLocale(...args);if(game){$('missionLabel').textContent=game.mode==='campaign'?game.stage.title:t('status.inProgress');document.querySelector('.time small').textContent=game.mode==='campaign'?'Campaign':t('mode.endless')}return result};
const returnHangarWithLocale=returnHangar;
returnHangar=()=>{const result=returnHangarWithLocale();$('missionLabel').textContent=t('status.waiting');$('skillStatus').textContent=t('active.ready');return result};
function refreshLocale(){applyTranslations();fieldRecordLink.textContent=getLocale()==='en'?'Official Battle Record':'공식 전장 기록';$('sound').textContent=muted?t('menu.soundOff'):t('menu.soundOn');$('sound').setAttribute('aria-label',muted?t('menu.soundEnable'):t('menu.soundMute'));$('game')?.setAttribute('aria-label',t('ui.canvasLabel'));document.querySelector('.mode-tabs')?.setAttribute('aria-label',t('ui.modeLabel'));$('selectedAircraft')?.setAttribute('aria-label',t('ui.selectedAircraft'));$('airframeStats')?.setAttribute('aria-label',t('ui.aircraftPerformance'));$('stageBossHud')?.setAttribute('aria-label',t('ui.armorLabel'));$('localeSelect')?.setAttribute('aria-label',t('language.label'));$('flightRoster')?.setAttribute('aria-label',t('ui.rosterLabel'));$('aircraftSelect103')?.setAttribute('aria-label',t('aircraft.select'));$('legendaryInventory')?.setAttribute('aria-label',t('special.title'));$('stick')?.setAttribute('aria-label',t('ui.touchSteer'));$('touchEvade')?.setAttribute('aria-label',t('maneuver.label'));$('touchSkill')?.setAttribute('aria-label',t('active.label'));const note=document.querySelector('.airframe-note');if(note)note.textContent=t('ui.durabilityNote');const real=document.querySelector('.airframe-brief details summary');if(real)real.textContent=t('ui.realAircraft');const hist=document.querySelector('.airframe-brief details small');if(hist)hist.textContent=t('ui.historyNote');const arm=document.querySelector('.weapon-spec .equipment-label');if(arm)arm.textContent=t('ui.armament');const foot=document.querySelector('.footnote');if(foot)foot.innerHTML=t('ui.footnote').replace('\\n','<br>');const motto=document.querySelector('footer span:nth-child(2)');if(motto)motto.textContent=t('ui.footerMotto');const controls=document.querySelector('.skill-info kbd');if(controls)controls.textContent=t('ui.controls');const hints=document.querySelectorAll?.('.start-hint span')||[];for(const [index,key] of ['ui.steer','maneuver.label','active.label'].entries())if(hints[index]?.lastChild)hints[index].lastChild.textContent=' '+t(key);if($('soloRanking'))$('soloRanking').textContent=t('ranking.title');if(game){if(game.mode==='coop2')coopHud();else hud()}else roster()}
$('localeSelect').onchange=event=>setLocale(event.target.value);
const soundWithLocale=$('sound').onclick;
$('sound').onclick=()=>{soundWithLocale();refreshLocale()};
subscribe(refreshLocale);refreshLocale();
function refreshRuntimeAria(){$('record').textContent=t('record.best',{score:String(best).padStart(3,'0')});$('pause')?.setAttribute('aria-label',t('hud.pause').replace(/^Ⅱ\s*/,''));$('pause')?.setAttribute('title',t('hud.pause').replace(/^Ⅱ\s*/,'')+' · ESC');document.querySelector('.healthMark151')?.setAttribute('aria-label',t('ui.factionMark'))}
subscribe(refreshRuntimeAria);refreshRuntimeAria();
$('start').onclick=sortie;

// Dynamic values originate in the gameplay data, so static DOM translation is
// not enough after switching languages. Keep their IDs at the presentation
// boundary and retain the Korean data text as the KO fallback.
const localizedPilot=(id,fallback)=>pilotName(id,fallback);
const localizedWeapon=(id,fallback)=>weaponName(id,fallback);
const localizedActive=(id,fallback)=>activeName(id,fallback);
const localizedPassive=(id,fallback)=>passiveName(id,fallback);
const localizedPilotDescription=(id,fallback)=>pilotDescription(id,fallback);
const localizedPassiveDescription=(id,fallback)=>passiveDescription(id,fallback);
const hangarPilotDescription=(id,fallback)=>pilotIdentityCopy(id,getLocale())?.activeShort||(id==='baron:baron_albatros'?(getLocale()==='en'?'Suppress forward enemies and exploit their rear.':'전방 적을 제압하고 후방 공격 기회를 만듭니다.'):localizedPilotDescription(id,fallback));
const hangarPassiveDescription=(id,fallback)=>pilotIdentityCopy(id,getLocale())?.passiveShort||(id==='baron:baron_albatros'?(getLocale()==='en'?'Fly faster and turn more sharply.':'더 빠르게 비행하고 민첩하게 선회합니다.'):localizedPassiveDescription(id,fallback));
const localizedAircraftRole=(id,fallback)=>aircraftRole(id,fallback);
const localizedAirframeHistory=(id,fallback)=>airframeHistory(id,fallback);
const localizedAirframeTip=(id,fallback)=>airframeTip(id,fallback);
const localizedEquippedWeapon=(id,weapon)=>weapon?.name===WEAPONS[id]?.name?localizedWeapon(id,weapon.name):weapon?.name||'';
const rosterWithDynamicLocale=roster;
const renderAirframeFeel=(id,fit)=>{
 const root=$('airframeStats'),ratings=aircraftFeelRatings(fit),archetype=representativeArchetypeKey(id);
 if(!ratings){root.textContent=t('ui.stats',{speed:Math.round(fit.speed/181*100),turn:Math.round(fit.turn/4.3*100),hp:fit.hp});return false}
 root.replaceChildren();if(archetype){const tag=document.createElement('strong');tag.className='airframe-archetype';tag.textContent=t(`aircraft.archetype.${archetype}`);root.append(tag)}
 for(const key of ['speed','turn','retention','acceleration','growth']){
  const row=document.createElement('span');row.className='airframe-rating-row';
  const label=document.createElement('b');label.textContent=t(`ui.airframeRating.${key}`);
  const bar=document.createElement('span');bar.className='airframe-rating-bar';bar.setAttribute('aria-label',t('ui.airframeRating.value',{label:label.textContent,value:ratings[key]}));
  for(let step=1;step<=5;step++){const segment=document.createElement('i');if(step<=ratings[key])segment.className='active';bar.append(segment)}
  row.append(label,bar);root.append(row);
 }
 return true;
};
roster=()=>{
 const result=rosterWithDynamicLocale();
 const loadout=pilotLoadout(pilot,plane),pilotLabel=localizedPilot(pilot,loadout.name);
 const loadoutId=pilot==='baron'&&plane==='baron_albatros'?'baron:baron_albatros':pilot;
 $('pilotName').textContent=pilotLabel;$('skillName').textContent=localizedActive(loadoutId,loadout.skill);$('skillDesc').textContent=hangarPilotDescription(loadoutId,loadout.desc);
 $('passive103').textContent=localizedPassive(loadoutId,loadout.passive)+' · '+hangarPassiveDescription(loadoutId,loadout.passiveDesc);
 $('pilotAircraft').innerHTML=aircraftCardLabel(displayAircraftName(pilot,plane))+' · '+(PLANES[plane].tierLabel||localizedAircraftRole(plane,PLANES[plane].role));
 const airframe=PLANES[plane].handling||{};$('airframeTip').textContent=getLocale()==='en'?(PLANES[plane].aircraftTier?.descriptionEn||localizedAirframeTip(plane,airframe.tip)):(PLANES[plane].identityDescription||localizedAirframeTip(plane,airframe.tip));$('airframeHistory').textContent=localizedAirframeHistory(plane,airframe.history);
 $('baronAircraftHint').textContent=t(pilot==='baron'?'ui.aircraftHint':'ui.historicalAircraftHint');$('skillStatus').textContent=t('active.ready');
 const fit=PLANES[plane],xpPercent=Math.round((fit.xpCostMultiplier-1)*100),growthKey=xpPercent<0?'ui.growthFast':xpPercent>0?'ui.growthCost':'ui.growthStandard',weapon=WEAPONS[plane];
 const detailedFeel=renderAirframeFeel(plane,fit),gain=Math.round(((fit.xpGainMultiplier??1)-1)*100);
 $('airframeGrowth').textContent=`XP ${gain>0?'+':''}${gain}% · ${fit.hp} HP`;
 $('weaponSpec').textContent=t('ui.weaponSpec',{name:localizedWeapon(plane,weapon.name),guns:weapon.guns,caliber:weapon.caliber,belt:weapon.belt});
 $('weaponDetail').textContent=t('ui.weaponDetail',{rpm:weapon.rpm,reload:weapon.reload});
 $('hangarAircraftName').textContent=displayAircraftName(pilot,plane)+' · '+(PLANES[plane].tierLabel||'');
 $('hangarPortrait').alt=t('ui.pilotPortrait',{name:pilotLabel});$('hangarName').textContent=pilotLabel;$('hangarSkill').textContent=localizedActive(loadoutId,loadout.skill);
 const visiblePilots=Object.entries(PILOTS).filter(([,p])=>p.faction===faction);
 [...$('pilotTabs').querySelectorAll('button')].forEach((button,index)=>{const [id,data]=visiblePilots[index]||[];if(id)(button.querySelector('.pilot-tab-label')||button).textContent=localizedPilot(id,data.name)});
 return result;
};
const hudWithDynamicLocale=hud;
hud=()=>{if(!game||performance.now()-hudAt<90)return;hudWithDynamicLocale();const label=localizedEquippedWeapon(game.plane||plane,game.weapon);__attr($('ammoGunIcon'),'aria-label',label);__txt($('ammoLabel'),label+' × '+game.weapon.guns)};
const coopHudWithDynamicLocale=coopHud;
coopHud=()=>{coopHudWithDynamicLocale();if(!game?.players)return;for(const p of game.players){const weapon=localizedEquippedWeapon(p.plane,p.weapon);$(p.id+'Gun113').title=weapon;$(p.id+'HudName').textContent=p.id.toUpperCase()+' · '+p.nickname+' / '+localizedPilot(p.pilot,PILOTS[p.pilot].name)}};
const eventsWithDynamicLocale=events;
events=()=>{const result=eventsWithDynamicLocale();if(!game)return result;if(game.mode==='coop2'){for(const p of game.players){const name=$(p.id+'CutinName'),skill=$(p.id+'CutinSkill'),loadoutId=p.pilot==='baron'&&p.plane==='baron_albatros'?'baron:baron_albatros':p.pilot;if(name)__txt(name,p.id.toUpperCase()+' · '+p.nickname);if(skill)__txt(skill,localizedActive(loadoutId,pilotLoadout(p.pilot,p.plane).skill))}}else{const loadout=pilotLoadout(pilot,plane),loadoutId=pilot==='baron'&&plane==='baron_albatros'?'baron:baron_albatros':pilot;__txt($('cutinName'),localizedPilot(pilot,loadout.name));__txt($('cutinSkill'),localizedActive(loadoutId,loadout.skill))}return result};
const coopEventsWithDynamicLocale=coopEvents;
coopEvents=()=>{const result=coopEventsWithDynamicLocale();if(!game?.players)return result;for(const p of game.players){const name=$(p.id+'CutinName'),skill=$(p.id+'CutinSkill'),loadoutId=p.pilot==='baron'&&p.plane==='baron_albatros'?'baron:baron_albatros':p.pilot;if(name)name.textContent=p.id.toUpperCase()+' · '+p.nickname;if(skill)skill.textContent=localizedActive(loadoutId,pilotLoadout(p.pilot,p.plane).skill)}return result};
const eventsWithDoctrineLocale=events;
events=()=>{const result=eventsWithDoctrineLocale();if(getLocale()==='en'){const key=({'강습 편대 · 출격 장비 배정':'doctrine.assault','고속 정찰 · 출격 장비 배정':'doctrine.recon','장기 초계 · 출격 장비 배정':'doctrine.patrol','강습 편대 · 화력 +15% / 장전 +15%':'doctrine.assaultLabel','고속 정찰 · 속도 +12% / 내구도 −10%':'doctrine.reconLabel','장기 초계 · 내구도 +15 / 발사 간격 +8%':'doctrine.patrolLabel','신속 작전 · 경험치 +10% / 속도 +5%':'doctrine.rapidLabel','관측 비행 · 회수 반경 +35% / 경험치 +8%':'doctrine.observationLabel','방어진지 엄호 · 내구도 +25 / 기관총 −8%':'doctrine.defenseLabel'})[$('toast').textContent];if(key)$('toast').textContent=t(key)}return result};
const showBuildPauseWithDynamicLocale=showBuildPause151;
showBuildPause151=()=>{
 const result=showBuildPauseWithDynamicLocale();
 const players=game?.players||[game];
 const build=$('build151');if(!build?.querySelectorAll)return result;
 [...build.querySelectorAll('section')].forEach((section,index)=>{const p=players[index];if(!p)return;const h3=section.querySelector?.('h3'),meta=section.querySelector?.('.build-meta151');if(h3)h3.textContent=(p.id?p.id.toUpperCase()+' · ':'')+localizedPilot(p.pilot,PILOTS[p.pilot].name);if(meta&&getLocale()==='en'){const kills=game.mode==='coop2'?(game.priorityKills||0):(p.priorityKills??game.priorityKills??0);meta.textContent=displayAircraftName(p.pilot,p.plane)+' · '+String(Math.floor(game.t/60)).padStart(2,'0')+':'+String(Math.floor(game.t%60)).padStart(2,'0')+' · Priority kills '+kills+' · LV. '+p.level}for(const heading of section.querySelectorAll?.('h4')||[])heading.textContent=heading.textContent==='획득 강화'?t('upgrade.owned'):heading.textContent==='고유 강화'?t('upgrade.unique'):t('special.title');for(const empty of section.querySelectorAll?.('.empty151')||[])empty.textContent=t('special.none');});
 return result;
};
subscribe(()=>{if(game?.state==='paused')showBuildPause151();else if(game) {if(game.mode==='coop2')coopHud();else hud()}else roster()});

// Solo controller lifecycle follows the final start/return wrappers. Co-op keeps
// its existing two-keyboard input path unchanged.
let shownBattlefieldEvent='',shownBattlefieldResult='',shownRivalNotice='';
const startWithGamepad=start;
start=(...args)=>{gamepadInput.reset();syncGamepadUi('keyboard');shownBattlefieldEvent=shownBattlefieldResult=shownRivalNotice='';return startWithGamepad(...args)};
const returnHangarWithGamepad=returnHangar;
returnHangar=()=>{gamepadInput.reset();syncGamepadUi('keyboard');shownBattlefieldEvent=shownBattlefieldResult=shownRivalNotice='';return returnHangarWithGamepad()};
const pauseWithGamepad=pause;
pause=()=>{gamepadInput.reset();const result=pauseWithGamepad();setSfxPaused(game?.state==='paused');return result};
const helpWithGamepad=help;
help=()=>{gamepadInput.reset();return helpWithGamepad()};
$('start').onclick=sortie;$('pause').onclick=pause;$('help').onclick=help;

// Battlefield Events use the dedicated offer shell and stop simulation while
// the player makes a choice. The event core remains UI-agnostic for solo/co-op.
function syncBattlefieldEventUi(){
 const state=game?.battlefieldEvents,event=state?.current;
 if(event?.status==='offered'&&game.state==='battlefield-event'){
  const signature=event.id+':'+getLocale();if(signature===shownBattlefieldEvent)return;shownBattlefieldEvent=signature;
  showBattlefieldEvent({title:t(`event.${event.type}.title`),description:t(`event.${event.type}.text`),acceptText:t('event.accept'),declineText:t('event.decline'),
   onAccept:()=>{if(game?.battlefieldEvents?.current===event&&game.acceptBattlefieldEvent())last=performance.now()},
   onDecline:()=>{if(game?.battlefieldEvents?.current===event&&game.declineBattlefieldEvent())last=performance.now()}});
 }else{
  hideBattlefieldEvent();
  // Auto-started missions announce themselves through a toast.
  if(event?.status==='active'){const signature=event.id+':announced:'+getLocale();if(signature!==shownBattlefieldEvent){shownBattlefieldEvent=signature;$('toast').textContent=t(`event.${event.type}.title`)+' · '+t('event.hud.status');show('toast');toastUntil=performance.now()+2400}}
 }
 const result=state?.result;if(!result)return;const signature=result.id+':'+result.outcome;if(signature===shownBattlefieldResult)return;shownBattlefieldResult=signature;
 $('toast').textContent=t(`event.${result.outcome}`);show('toast');toastUntil=performance.now()+2200;
}
function syncRivalAceUi(){
 const notice=game?.rivalAceNotice,signature=notice?notice.id+':'+notice.phase+':'+getLocale():'';if(!notice||signature===shownRivalNotice)return;shownRivalNotice=signature;
 $('toast').textContent=t(`rival.${notice.phase}`,{name:pilotName(notice.pilot,notice.name)});show('toast');toastUntil=performance.now()+2600;
}
const frameWithBattlefieldEvents=frame;
frame=now=>{const run=game;frameWithBattlefieldEvents(now);if(run===game){syncBattlefieldEventUi();syncRivalAceUi()}};

// Active missions use a compact, DOM HUD so the shared Game state remains the
// sole owner for solo and co-op. It is intentionally absent while an offer is up.
let shownBattlefieldMissionNotice='',shownBattlefieldFeedback='';
function syncBattlefieldMissionHud(){
 const event=game?.battlefieldEvents?.current,panel=$('eventMissionHud');
 if(!event||event.status!=='active'){show('eventMissionHud',false);return}
 const targets=event.targets||[],destroyed=targets.filter(target=>target.hp<=0||target.deathHandled).length;
 $('eventMissionTitle').textContent=t(`event.${event.type}.title`);
 let objective='',meta='';
 if(event.type==='HIGH_VALUE_TARGET'){objective=t('event.hud.commander',{done:String(destroyed)});meta=t('event.hud.time',{seconds:String(Math.max(0,Math.ceil(event.deadline-game.t)))})}
 else if(event.type==='BOMBER_INTERCEPT'){objective=t('event.hud.bombers',{done:String(destroyed),total:String(targets.length)});meta=t('event.hud.time',{seconds:String(Math.max(0,Math.ceil(event.deadline-game.t)))} )}
 else if(event.type==='RESCUE'){const rescue=event.rescue,percent=Math.max(0,Math.round(100*(rescue?.hp||0)/(rescue?.maxHp||1)));objective=t('event.hud.rescue');meta=t('event.hud.hp',{percent:String(percent)})+' · '+t('event.hud.time',{seconds:String(Math.max(0,Math.ceil(event.endsAt-game.t)))})}
 else if(event.type==='PHOTO_RECON'){const wps=event.waypoints||[],done=wps.filter(w=>w.done).length;objective=t('event.hud.recon',{done:String(done),total:String(wps.length)});meta=t('event.hud.time',{seconds:String(Math.max(0,Math.ceil(event.deadline-game.t)))})}
 else {objective=t('event.hud.ace',{done:String(destroyed)});meta=t('event.hud.time',{seconds:String(Math.max(0,Math.ceil(event.deadline-game.t)))})}
 $('eventMissionObjective').textContent=objective;$('eventMissionMeta').textContent=meta;show('eventMissionHud');
 const notice=event.type==='ACE_CHALLENGE'?event.id+':'+getLocale():'';if(notice&&notice!==shownBattlefieldMissionNotice){shownBattlefieldMissionNotice=notice;$('toast').textContent=t('event.notice.ace');show('toast');toastUntil=performance.now()+1800}
}
const syncBattlefieldEventUiWithMissionHud=syncBattlefieldEventUi;
syncBattlefieldEventUi=()=>{syncBattlefieldEventUiWithMissionHud();syncBattlefieldMissionHud();const result=game?.battlefieldEvents?.result;if(!result){shownBattlefieldFeedback='';return}const signature=result.id+':'+result.outcome;if(signature===shownBattlefieldFeedback)return;shownBattlefieldFeedback=signature;if(result.outcome==='completed'){$('toast').textContent=t('event.complete');show('toast');toastUntil=performance.now()+1800}else if(result.outcome==='failed'){$('toast').textContent=t(`event.failedReason.${result.reason||'timeExpired'}`);show('toast');toastUntil=performance.now()+1800}};
const battlefieldMissionDraw=draw;
function drawBattlefieldMissionTarget(target,index,total,eventType){
 const x=target.x-game.x+W/2,y=target.y-game.y+H/2,dx=x-W/2,dy=y-H/2,distance=Math.round(Math.hypot(dx,dy)),bomber=eventType==='BOMBER_INTERCEPT',edge=28;
 ctx.save();ctx.strokeStyle=bomber?'#ffd27b':eventType==='RESCUE'?'#b9e3d2':'#dfc384';ctx.fillStyle=bomber?'#ffd27b':'#eadfc5';ctx.lineWidth=bomber?2.5:1.5;
 if(x>edge&&x<W-edge&&y>edge&&y<H-edge){const r=bomber?24:18;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(x-r,y-r*.55);ctx.lineTo(x-r,y-r);ctx.lineTo(x-r*.55,y-r);ctx.moveTo(x+r,y-r*.55);ctx.lineTo(x+r,y-r);ctx.lineTo(x+r*.55,y-r);ctx.stroke();if(eventType==='RESCUE'){ctx.fillStyle='#1a2928';ctx.fillRect(x-19,y+18,38,3);ctx.fillStyle='#b9e3d2';ctx.fillRect(x-19,y+18,38*Math.max(0,target.hp||0)/(target.maxHp||1),3)}}
 else{const angle=Math.atan2(dy,dx),scale=Math.min((W/2-edge)/Math.max(.001,Math.abs(Math.cos(angle))),(H/2-edge)/Math.max(.001,Math.abs(Math.sin(angle))));ctx.save();ctx.translate(W/2+Math.cos(angle)*scale,H/2+Math.sin(angle)*scale);ctx.rotate(angle);ctx.beginPath();ctx.moveTo(bomber?13:9,0);ctx.lineTo(bomber?-8:-6,bomber?-7:-5);ctx.lineTo(bomber?-4:-6,0);ctx.lineTo(bomber?-8:-6,bomber?7:5);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
 ctx.font=bomber?'bold 12px monospace':'11px monospace';ctx.textAlign='center';ctx.fillStyle='#fff0c2';const prefix=bomber&&total>1?'B'+(index+1)+' · ':'';ctx.fillText(prefix+t('event.hud.distance',{distance:String(distance)}),Math.max(54,Math.min(W-54,x)),Math.max(18,Math.min(H-12,y-32)));ctx.restore();
}
function drawReconWaypoint(wp,isActive,label,total){
 const x=wp.x-game.x+W/2,y=wp.y-game.y+H/2,dx=x-W/2,dy=y-H/2,edge=28;ctx.save();
 if(x>edge&&x<W-edge&&y>edge&&y<H-edge){
  if(isActive){const r=130;ctx.strokeStyle='#8fe5f4';ctx.setLineDash([9,6]);ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
   if(wp.progress>0){ctx.lineWidth=5;ctx.strokeStyle='#bff2ff';ctx.beginPath();ctx.arc(x,y,r,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,wp.progress));ctx.stroke()}
   ctx.strokeStyle='#dff6ff';ctx.lineWidth=2;const c=16;for(const[cx,cy]of[[-1,-1],[1,-1],[1,1],[-1,1]]){const px=x+cx*r*.62,py=y+cy*r*.62;ctx.beginPath();ctx.moveTo(px-cx*c,py);ctx.lineTo(px,py);ctx.lineTo(px,py-cy*c);ctx.stroke()}
  }else{ctx.strokeStyle='rgba(143,229,244,.4)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,14,0,Math.PI*2);ctx.stroke()}
 }else if(isActive){const angle=Math.atan2(dy,dx),scale=Math.min((W/2-edge)/Math.max(.001,Math.abs(Math.cos(angle))),(H/2-edge)/Math.max(.001,Math.abs(Math.sin(angle))));ctx.save();ctx.translate(W/2+Math.cos(angle)*scale,H/2+Math.sin(angle)*scale);ctx.rotate(angle);ctx.fillStyle='#9fe3f7';ctx.beginPath();ctx.moveTo(11,0);ctx.lineTo(-7,-6);ctx.lineTo(-4,0);ctx.lineTo(-7,6);ctx.closePath();ctx.fill();ctx.restore()}
 if(isActive){ctx.font='11px monospace';ctx.textAlign='center';ctx.fillStyle='#dff6ff';const distance=Math.round(Math.hypot(dx,dy));ctx.fillText(t('event.hud.reconPoint',{index:String(label),total:String(total)})+' · '+t('event.hud.distance',{distance:String(distance)}),Math.max(54,Math.min(W-54,x)),Math.max(18,Math.min(H-12,y-150)))}
 ctx.restore();
}
draw=frameTime=>{battlefieldMissionDraw(frameTime);const event=game?.battlefieldEvents?.current;if(!event||event.status!=='active')return;if(event.type==='PHOTO_RECON'){const wps=event.waypoints||[],active=wps.findIndex(w=>!w.done);wps.forEach((wp,index)=>{if(!wp.done)drawReconWaypoint(wp,index===active,index+1,wps.length)});return}const targets=event.type==='RESCUE'?[event.rescue]:(event.targets||[]).filter(unit=>unit.hp>0&&!unit.deathHandled);if(!targets.length)return;const visible=event.type==='BOMBER_INTERCEPT'?targets:[targets[0]];visible.forEach((target,index)=>drawBattlefieldMissionTarget(target,index,visible.length,event.type));};


// HEAD-ON Test Lab bridge. It is inert on production and only activates on the
// repository's public GitHub Pages preview or local development hosts.
const HEADON_TEST_REGION_NAMES=['전원 지대','아드리아해','참호 전선','포화의 참호전선','도심','고공 전역','알프스 산맥','제브뤼헤 군항','캉브레 들판','아라스 상공','솜 강전선','런던 대공습','베르됭 전투','마안 전투','갈리폴리 전선','1918 파리 야간공습 / Paris Night Air Raid','유틀란트 해전 / Jutland Fleet Battle'];
const HEADON_TEST_ALLOWED_HOSTS=new Set(['localhost','127.0.0.1','terminal.local','leesh603.github.io','raw.githack.com']);
function installHeadOnTestLab(){
 const testHost=globalThis.location?.hostname||'';if(!HEADON_TEST_ALLOWED_HOSTS.has(testHost))return;
 const configureRegion=(run,region)=>{
  const addon=enableStageBoss(run,{teamFaction:run.mode==='coop2'?run.teamFaction:PLANES[run.plane].faction,heavyHp:run.mode==='coop2'?COOP_BALANCE.heavyHp:1});if(!addon)return null;
  addon.stages.stageIndex=region;addon.stages.orderPosition=addon.stages.order.indexOf(region);addon.stages.phase='explore';addon.stages.encounter=null;
  run.jutlandRoute=region===16?createJutlandRoute(run):null;prepareJutlandAssets(region);run.gallipoliRoute=region===14?createGallipoliRoute(run):null;prepareGallipoliAssets(region);run.region=region;run.maanStartX=run.x;prepareMaanAssets(region);run.stageStartDistance=run.distance||0;run.stageStartTime=run.t;run.clearRegionalHazards();
  run.bossBuildings=[];run.bossCues=[];run.navalRouteCues=new Set();run.navalApproachAt=null;run.parisBattle=null;
  run.navalRoute=region===7?{x:run.x,y:run.y,a:Number.isFinite(run.a)?run.a:-Math.PI/2,maxForward:0,bankAt:harborBankOffset}:null;
  return addon;
 };
 const startTest=(options={})=>{
  if(game)returnHangar();
  const requestedPilot=String(options.pilot||pilot);
  const requestedCoop=String(options.coop||'');
  selectedMode=requestedCoop&&PILOTS[requestedCoop]?'coop2':'endless';
  coopTestOverride=selectedMode==='coop2'&&!coopAvailable;
  if(PILOTS[requestedPilot]){pilot=requestedPilot;faction=PILOTS[pilot].faction}
  if(selectedMode==='coop2'){coopPilot2=PILOTS[requestedCoop]?.faction===faction?requestedCoop:pilot}
  if(pilot==='baron'&&options.baronAircraft==='baron_albatros')baronAircraft='baron_albatros';
  else if(pilot==='baron'&&options.baronAircraft==='fokker')baronAircraft='fokker';
  plane=pilotPlane(pilot);roster();start();
  if(!game)return null;
  if(options.plane&&PLANES[options.plane]?.faction===faction){game.stageBoss?.dispose();plane=options.plane;game=new Game(plane,pilot);game.viewWidth=W;game.viewHeight=H;attachCombatFeedback(game,{play:sfx,pulse:kind=>gamepadInput.pulse(kind),key:e=>e.escortPlane||e.bossPlane||liveryVariant(e,faction==='central'?(e.type==='hunter'?'nieuport':e.type==='boss'?'spad':'camel'):(e.type==='hunter'||e.type==='boss'?'fokker':'albatros')),scale:enemyAircraftScale});roster()}
  game.testMode=true;game.maanOrbit=options.orbit===true;game.nextBossAt=Number.POSITIVE_INFINITY;game.viewWidth=W;game.viewHeight=H;
  const requestedRegion=Number.parseInt(options.region,10),region=Number.isInteger(requestedRegion)?Math.max(0,Math.min(HEADON_TEST_REGION_NAMES.length-1,requestedRegion)):0;
  const addon=configureRegion(game,region);if(region===13&&options.fire===false)game.fire=Number.POSITIVE_INFINITY;
  transitionAssetPrep(region);
  if(options.invincible!==false)game.invuln=Number.POSITIVE_INFINITY;
  const ace=String(options.ace||'');
  if(ace){
   if(ace!=='random'&&PILOTS[ace])game.bossDeck=[ace];
   game.spawnEnemy('boss');
  }
  if(options.boss&&addon){
   // Immediate test bosses must enter the viewport without a long steering run.
   if(region===16){const pos=jutlandPoint(game.jutlandRoute,JUTLAND_ROUTE.fleet-900);if(game.mode==='coop2'){game.camera.x=pos.x;game.camera.y=pos.y}else Object.assign(game,pos);}
   if(region===14){const pos=gallipoliPoint(game.gallipoliRoute,GALLIPOLI_ROUTE.fort-900);if(game.mode==='coop2'){game.camera.x=pos.x;game.camera.y=pos.y}else Object.assign(game,pos);}
   const distance=region===14?340:region===13?280:region===6?620:region===4?180:region===10?90:360,angle=Number.isFinite(game.a)?game.a:-Math.PI/2;
   const encounter=addon.startBoss({x:game.x+Math.cos(angle)*distance,y:game.y+Math.sin(angle)*distance});
   if(region===15){const body=encounter?.bodies.values().next().value;if(body?.kind==='paris-searchlight-fortress'){if(game.mode==='coop2'){game.camera.x=body.x;game.camera.y=body.y+280}else{game.x=body.x;game.y=body.y+280;}}}
  }
  const directorPattern=options.pattern||options.tactic;
  if(directorPattern&&!options.boss&&!ace){
   for(const key of ['spawn','eventTimer','nextBossAt','nextHeavyAt','_zeppelinSchedule','flakTimer','regionThreat','fieldUnitTimer','gasTimer','gustTimer','patrolTimer','supplyTimer','allyTimer'])game[key]=Infinity;
   game.t=400;game.stageStartTime=400;game.beginBattleDirectorPattern(directorPattern);
   game.t+=.36;game.tickBattleDirector(.04)
  }
  if(options.freeze||options.frozen)game.state='paused';
  game.event('wave','TEST LAB · '+HEADON_TEST_REGION_NAMES[region]);
  return{region,pilot:game.pilot,plane:game.plane,boss:addon?.stages?.bossId||null};
 };
 const catalog={
  regions:HEADON_TEST_REGION_NAMES.map((name,id)=>({id,name})),
  pilots:Object.entries(PILOTS).map(([id,p])=>({id,name:p.name,faction:p.faction,plane:pilotPlane(id)})),
  planes:Object.entries(PLANES).filter(([,p])=>p.handling).map(([id,p])=>({id,name:p.name,faction:p.faction})),
  patterns:['CHASE','CROSS_ATTACK','BAIT','ESCORT','HEAD_ON_PASS','VETERAN_FORMATION']
 };
 const inspectTest=()=>game?{state:game.state,t:+game.t.toFixed(2),plane:game.plane,role:game.aircraftCombatRole()?.name,xpCost:game.xpCostMultiplier,energy:game.airframeSpeed,pursuit:game.pursuitSpeedFactor,enemies:game.enemies.filter(e=>e.hp>0).map(e=>({tactic:e.directorSquad?.tactic||'일반',leader:!!e.isFormationCommander,linked:!!e.formationLeader,broken:!!e.directorSquad?.broken,skin:e.escortPlane,x:Math.round(e.x-game.x),y:Math.round(e.y-game.y),a:+e.a.toFixed(2),pass:e.directorSquad?.leader.combatPassState,aim:e.dangerAimUntil>game.t,pursuit:!!e.pursuitEngaged,heavy:!!e.dangerHeavy}))}:null;
 const stepTest=(seconds=.5,steer=0)=>{if(!game?.testMode)return null;game.state='playing';for(let t=0;t<seconds;t+=.02)game.update(.02,{inputMode:'gamepad',fireHeld:false,steer,inputAnalog:1,moveX:steer});game.state='paused';return inspectTest()};
 const maanInspect=()=>{const sb=game?.stageBoss,b=[...sb?.stages.encounter?.bodies.values()||[]].find(b=>b.layout&&(b.kind==='wustenpanzer'||b.kind==='sinai-landship'));return b?{kind:b.kind,phase:b.phase,entry:b.entryAge,hp:b.hp,maxHp:b.maxHp,yaw:b.hullYaw,parts:[...b.parts.values()].map(p=>({id:p.id,hp:p.hp,maxHp:p.maxHp,x:b.x+p.x,y:b.y+p.y,destroyed:p.destroyed})),cars:[...sb.stages.encounter.bodies.values()].filter(c=>c.leader&&!c.dead).length}:null;};
 const maanProbe=(id,mode='destroy')=>{const sb=game?.stageBoss,b=[...sb?.stages.encounter?.bodies.values()||[]].find(b=>b.layout&&(b.kind==='wustenpanzer'||b.kind==='sinai-landship'));if(!b||b.entryAge<b.entryDuration)return false;if(id==='hull'){sb.hit({bodyId:b.id,damage:Math.max(0,(b.hp-b.maxHp*.24)/(b.breached?1:.32)),faction:game.teamFaction});return true;}const p=b.parts.get(id);if(!p||p.destroyed)return false;const x=b.x+p.x,y=b.y+p.y;game.bullets.push({x,y,previousX:x,previousY:y-8,vx:0,vy:0,life:.4,damage:mode==='half'?p.maxHp*.55:p.maxHp*2,hit:new Set(),ownerId:'p1'});return true;};
 const advanceVerdun=(seconds=1)=>{
  const run=game;if(!run?.testMode||run.worldRegion?.()!==12||!['playing','paused'].includes(run.state))return false;
  const paused=run.state==='paused';run.state='playing';
  // QA only: fixed native engine substeps preserve projectile travel, timers,
  // collision, hazards and collapse. No encounter HP/phase is assigned here.
  seconds=Math.max(.04,Math.min(1,Number(seconds)||1));
  for(let elapsed=0;elapsed<seconds-1e-9&&game===run&&run.state==='playing';elapsed+=.04)run.update(Math.min(.04,seconds-elapsed),{inputMode:'gamepad',fireHeld:false});
  events();hud();if(paused&&run.state==='playing')run.state='paused';
  return true;
 };
 window.__HEADON_TEST__={catalog,start:startTest,maanInspect,maanProbe,maanOrbit:on=>{if(game?.testMode)game.maanOrbit=on;},maanFire:on=>{if(game?.testMode)game.fire=on?0:Number.POSITIVE_INFINITY;},status:()=>game?{state:game.state,region:game.worldRegion?.(),pilot:game.pilot,plane:game.plane,testMode:!!game.testMode}:null,debug:()=>game,music:()=>music.status(),inspect:inspectTest,step:stepTest,advanceVerdun,freeze:value=>{if(game?.testMode)game.state=value?'paused':'playing'},breakCommander:()=>{const e=game?.enemies.find(e=>e.isFormationCommander&&e.hp>0);if(e){game.bullets.push({x:e.x,y:e.y,vx:0,vy:0,life:.1,enemy:false,damage:e.maxHp*2,hit:new Set()});game.state='playing';game.update(.02,{inputMode:'gamepad',fireHeld:false});game.state='paused'}return inspectTest()}};
 const params=new URLSearchParams(location.search);
 if(params.get('headonTest')==='1'&&params.get('autostart')!=='0')queueMicrotask(()=>startTest({
  region:params.get('region'),pilot:params.get('pilot'),ace:params.get('ace'),boss:params.get('boss')==='1',
  invincible:params.get('invincible')!=='0',baronAircraft:params.get('baronAircraft'),coop:params.get('coop')
 }));
}
setInterval(()=>{if(game?.state==='playing'&&!muted&&!document.hidden&&!regionTransitionUntil)sfx('engineTick',combatFlightSound(game))},170);
installHeadOnTestLab();

const onlineLobby=installOnlineLobby({getLoadout:()=>({pilot,plane:pilotPlane(pilot),faction,nickname:pilotName(pilot,PILOTS[pilot].name)}),getGame:()=>game,onStart:(session,data)=>{battleReady.then(()=>{if(!session.closed)start(session,data)}).catch(error=>{session.leave();modal('ONLINE CO-OP','출격 실패',error.message,[{label:'출격 화면',run:returnHangar}]);});},onEnd:reason=>{if(!game?.online)return;game._netEnded=true;game.state='paused';game.disposeOnline();modal('ONLINE CO-OP','연결 종료',reason,[{label:'출격 화면',run:returnHangar}]);}});

import {drawGrenade,drawGrenadeBlast,drawAmatolBlast,drawFxExplosion} from './weapon-effects156.js?v=217';
import {fx,fxReady,fxTint,FX56} from './fx-art.js';
import {CATEGORIES,categoryName,reinforcementName,buildStats,cumulativeText,cleanDescription} from './reinforcement-ui151.js?v=214';
import {t,getLocale,setLocale,subscribe,initLocale,applyTranslations,rarityName,upgradeDescription as translatedUpgradeDescription,pilotName,aircraftName,weaponName,activeName,passiveName,pilotDescription,passiveDescription,aircraftRole,airframeHistory,airframeTip} from './i18n.js?v=217';
import {GamepadInput} from './gamepad-input.js?v=214';
const fieldRecordLink=document.createElement('a');fieldRecordLink.href='./field-record.html';fieldRecordLink.target='_blank';fieldRecordLink.rel='noopener';fieldRecordLink.textContent=getLocale()==='en'?'Official Battle Record':'공식 전장 기록';fieldRecordLink.className='field-record-link';fieldRecordLink.style.cssText='display:block;margin:10px auto 0;text-align:center;color:#d7b26d;font-weight:800;text-decoration:none';document.getElementById('start')?.after(fieldRecordLink);
import {playerPose,drawPlayerAura,drawPetalParticle,drawRedGhosts162} from './player-effects129.js?v=216';
import {drawStageBoss,updateStageBossHud,paintCity,paintSky,prepareStageBossAssets} from './stageboss-view.js?v=269&b=270';
import {enableStageBoss} from './stageboss-host.js?v=190';
import {chooseTransitionTip,transitionRegionLabel} from './transition-tips188.js?v=214';
import './hud-layout94.js?v=214';
import {showBattlefieldEvent,hideBattlefieldEvent} from './battlefield-event-ui.js?v=214';
import {CoopGame,coopPlane} from './coop-engine.js?v=237&b=238';
import {CoopInput,coopRecord,saveCoopLocal,COOP_RECORD_KEYS} from './coop-input.js?v=214';
import {drawCoop} from './coop-view.js?v=238';
import {drawSunStrike} from './sun-strike71.js?v=223&b=220';
import {drawEnemyProjectile,drawCannonProjectile,drawBattlefieldFire,friendlyTracerColor} from './projectiles.js?v=217&b=214';
import {installFlightViewport} from './flight-viewport.js?v=214';
import {aircraftFeelRatings,representativeArchetypeKey} from './aircraft-feel174.js?v=214';
import {drawGas} from './gas-view.js?v=218&b=231';
import {missionNavigation,drawMissionRadar} from './navigation.js?v=214&b=210';
import {drawBattlefieldSprite} from './battlefield-art.js?v=215&b=211';
import {CampaignGame,STAGES,stageFaction,historicalAircraft,sortieAircraft,liveryVariant} from './campaign.js?v=226&b=221';
import {drawCampaign} from './campaign-view.js?v=215&b=211';
import {campaignArtReady} from './aircraft.js?v=220';
import {drawGameIcon,drawSpecialAmmoIcon,iconsReady} from './icons.js?v=216';
import {BattleMusic,musicModeForGame} from './music.js?v=225&b=213';
import {sfx,setSfxMuted} from './sfx.js?v=224&b=212';
import {portraitSources,portraitsReady} from './portraits.js?v=217&b=212';
import {BOSS_CATALOG} from './headon-stageboss-patterns.js?v=190&b=210';
import {drawEquipment} from './equipment.js?v=215&b=211';
import {installHeadOnElitePatch,createEliteAssets,renderEliteLayer} from './elite-patch/module/index.js?v=214';
import{planeSprite,aircraftReady,aircraftKey,hangarArtReady}from'./aircraft.js?v=220';
import{Game,PLANES,PILOTS,UPGRADES,WEAPONS,PILOT_PLANES,upgradeDescription,pilotLoadout,pilotAircraftName,TAILING_BALANCE,SPECIAL_AMMO,enemyAircraftScale,LEGENDARY_DEFENSE_BALANCE,LEGENDARY_BALANCE}from'./engine.js?v=237&b=238';
import {TerrainRenderer,MountainField} from './alps-terrain117.js?v=214';
const flightViewport=installFlightViewport(document,window);
const ententeAirshipSprite=new Image();ententeAirshipSprite.src='./zeppelin-entente.webp?v=214&b=214';
const zeppelinSprite=new Image();zeppelinSprite.src='./zeppelin.webp?v=214&b=214';const ballCloudSprite=new Image();ballCloudSprite.src='./fx-ball-cloud.webp?v=257&b=215';
const globalZeppelinSprite=zeppelinSprite;
const TRANSPARENT_PORTRAIT='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
const eliteAssets=createEliteAssets({
 lePrieur:'./elite-patch/assets/le-prieur-squadron.webp?v=210',
 schlachtstaffel:'./elite-patch/assets/halberstadt-cliv-squadron.webp?v=210',
 drawPlayerRocket:(c,x,y,angle,size)=>{if(!fx(c,'rocket',x,y,size,size*.3,angle))drawEquipment(c,'rocket',x,y,angle,size)}
});
installHeadOnElitePatch(Game,{
 planes:PLANES,
 isPlaying:g=>g.state==='playing'&&!g.mode,
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
 emitWarning:(g,text)=>g.event('wave',text),
 onEliteImpact:(g,member)=>{g.event('impact','');g.burst(member.x,member.y,'#ffe0a0',7)},
 onEliteKilled:(g,detail)=>{
  g.kills=(g.kills||0)+1;g.eliteKills=(g.eliteKills||0)+1;
  g.burst(detail.x,detail.y,'#f2aa52',26);for(let i=0;i<4;i++)g.smoke(detail.x+(g.rng()-.5)*14,detail.y+(g.rng()-.5)*14,true);
  g.event('kill','');g.drops.push({x:detail.x,y:detail.y,value:Math.round(detail.rewardMultiplier),heal:false,elite:true});
 }
});
const $=id=>document.getElementById(id);const transitionAssetPrep=region=>typeof prepareStageBossAssets==='function'?Promise.resolve(prepareStageBossAssets(region)):Promise.resolve();const transitionTipPick=(region,locale,excludeId)=>typeof chooseTransitionTip==='function'?chooseTransitionTip(region,locale,Math.random,excludeId):{id:'',text:''};const transitionLabelPick=(region,locale,fallback)=>typeof transitionRegionLabel==='function'?transitionRegionLabel(region,locale,fallback):fallback;const canvas=$('game'),ctx=canvas.getContext('2d');let W=600,H=500,game=null,plane='fokker',pilot='baron',faction='central',keys={},joy=null,muted=true,audio=null,last=0,ambient=0,toastUntil=0,choices=[],lastFocus=null,cutinUntil=0,lastImpactSound=0,lastShotSound=0,lastPickupSound=0;const choiceIconRefs=[];function clearChoiceIconRefs(){choiceIconRefs.length=0}let regionTransitionUntil=0,regionTransitionAssetsReady=true,lastTransitionTipId='';const regionTransition=document.createElement('div');regionTransition.id='regionTransition';regionTransition.className='region-transition hidden';regionTransition.innerHTML='<div class="region-transition-card"><small class="region-transition-kicker">FRONT LINE TRANSITION</small><strong id="regionTransitionName"></strong><span id="regionTransitionStatus" class="region-transition-status"></span><div class="region-transition-progress" aria-hidden="true"><i></i></div><div class="region-transition-tip"><b>TIP</b><span id="regionTransitionTip"></span></div></div>';$('viewport').append(regionTransition);function beginRegionTransition(label,region){clearChoiceIconRefs();const locale=getLocale(),tip=transitionTipPick(region,locale,lastTransitionTipId);lastTransitionTipId=tip.id;$('regionTransitionName').textContent=transitionLabelPick(region,locale,label||'새 전장');$('regionTransitionStatus').textContent=locale==='en'?'Preparing next battlefield…':'다음 전장 준비 중…';$('regionTransitionTip').textContent=tip.text;regionTransitionUntil=performance.now()+850;regionTransitionAssetsReady=false;show('regionTransition',true);transitionAssetPrep(region).catch(()=>{}).finally(()=>{regionTransitionAssetsReady=true})}let best=0,nickname='';try{const rankingVersion='161';if(localStorage.getItem('headon-ranking-version')!==rankingVersion){for(const key of ['headon-priority-best-71','headon-priority-best-161','headon-ranking','headon-priority-ranking-71','headon-priority-ranking-161','headon-coop2-best-v1','headon-coop2-ranking-v1'])localStorage.removeItem(key);localStorage.setItem('headon-ranking-version',rankingVersion)}best=0}catch{}initLocale();$('record').textContent=t('record.best',{score:String(best).padStart(3,'0')});
let bossArrivalUntil=0;let bossCardFrom=0;let bossCutinUntil=0;let lastStageBossId='';
const coopInput=new CoopInput(),coopAvailable=!window.matchMedia('(pointer:coarse)').matches;
const gamepadInput=new GamepadInput(globalThis.navigator);
let coopPilot2='voss';const coopCutinEnds={p1:0,p2:0};
const coopRelicSignatures={p1:'',p2:''};let coopToastUntil=0;
const CAMPAIGN_ENABLED=false;
let selectedMode='endless',selectedStageId='C-01',freeSortie=false,campaignRecords=[],campaignLoadState='loading';
function normalizeSelectedMode(){if(!CAMPAIGN_ENABLED&&selectedMode==='campaign')selectedMode='endless'}
function sound(f=400,d=.06,type='square',vol=.035){if(muted)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();let o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(f,audio.currentTime);o.frequency.exponentialRampToValueAtTime(f*.45,audio.currentTime+d);g.gain.setValueAtTime(vol,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g);g.connect(audio.destination);o.onended=()=>{try{o.disconnect();g.disconnect()}catch{}};o.start();o.stop(audio.currentTime+d)}catch{}}
const _baseSound=sound;sound=(f,d,type,vol)=>_baseSound(f*(.94+Math.random()*.12),d,type,(vol??.035)*7.4);
const music=new BattleMusic();
function stopBgm(){music.setState('idle',true)}
function setBgmMode(mode){music.setState(mode,muted)}
// Audio begins only after the player presses a start/control button, but is
// enabled by default so the sortie has its intended musical atmosphere.
muted=false;setSfxMuted(false);$('sound').textContent=t('menu.soundOn');$('sound').setAttribute('aria-label',t('menu.soundMute'));
function show(id,on=true){$(id).classList.toggle('hidden',!on)}let baronAircraft='fokker';const aircraftOverrides={},coopAircraftOverrides={};let coopBaronAircraft='fokker';const coopSelectedPlane=id=>id==='baron'?coopBaronAircraft:coopPlane(id);const pilotPlane=id=>(selectedMode==="coop2"?(id==='baron'?baronAircraft:coopPlane(id)):({baron:baronAircraft,voss:'fokker',boelcke:'albatros_d2',immelmann:'eindecker',fonck:'camel',collishaw:'collishaw_sopwith',baracca:'baracca_nieuport',udet:'udet_fokkerdv',guynemer:'guynemer_spad',bishop:'re7',goering:'goering_fokkerd7',mannock:'se5a',mckeever:'bristol_duo',huffzky:'halberstadt_duo',hawker:'airco_dh2',berthold:'berthold_pfalz',wolff:'wolff_albatros',loewenhardt:'loewenhardt_fokkerd7',mccudden:'mccudden_se5a',nungesser:'nungesser_nieuport24',jacobs:'fokker',rickenbacker:'rickenbacker_spad',ball:'ball_se5a',barker:'barker_snipe',luke:'luke_nieuport28',brumowski:'brumowski_albatros',gontermann:'gontermann_fokker'}[id]||'camel'));

const CHOICE_PORTRAIT_SCALE={huffzky:.82};
function choicePortraitScale(id){return CHOICE_PORTRAIT_SCALE[id]||1}
function applyPilotPortrait(target){if(!PILOTS[pilot]||!portraitSources[pilot])return;const el=$(target),choice=target==='portrait';el.style.backgroundImage=`url('${portraitSources[pilot]}')`;el.style.setProperty('--pilot-portrait-size','contain');el.style.backgroundSize=choice?'contain':'auto 100%';el.style.backgroundPosition=choice?'right bottom':'center bottom';el.style.backgroundRepeat='no-repeat';el.style.filter='drop-shadow(0 5px 8px #0008)'}
function prepareCutin(){applyPilotPortrait('cutinPortrait');const el=$('skillCutin');el.style.setProperty('--cutin-accent',faction==='central'?'#ffcf78':'#a2e2fa');el.style.animation='none';void el.offsetWidth;el.style.animation='';}
// Labels only: retain the selected simulation ID, original fit and renderer.
function displayAircraftName(pilotId,planeId){return aircraftName(planeId,pilotAircraftName(pilotId,planeId),pilotId)}
function roster(){document.body.classList.toggle('duo-selected',['mckeever','huffzky'].includes(pilot));if(!game&&selectedMode==='campaign'){const stage=activeCampaignStage();plane=sortieAircraft(stage,pilot,freeSortie,hasCampaignClear(stage.id),baronAircraft);}const p=pilotLoadout(pilot,plane);$('central').classList.toggle('active',faction==='central');$('entente').classList.toggle('active',faction==='entente');$('pilotNo').textContent=String(p.portrait+1).padStart(2,'0');$('pilotAlias').textContent=p.alias;$('pilotName').textContent=p.name;$('skillName').textContent=p.skill;$('skillDesc').textContent=p.desc;let passive=$('passive103');if(!passive){passive=document.createElement('p');passive.id='passive103';$('skillDesc').after(passive)}passive.textContent=p.passive+' · '+p.passiveDesc;$('pilotTabs').replaceChildren();for(let[id,v]of Object.entries(PILOTS).filter(([,p])=>p.faction===faction)){let b=document.createElement('button');b.dataset.pilotId=id;b.dataset.pilotAlias=v.alias||'';const thumb=document.createElement('img');thumb.src=portraitSources[id]||'portrait-'+id+'.webp?v=214&b=219';thumb.className='pilot-tab-portrait';thumb.alt='';thumb.setAttribute('aria-hidden','true');const label=document.createElement('span');label.className='pilot-tab-label';label.textContent=v.name;b.append(thumb,label);if(id==='baron'){const medal=document.createElement('img');medal.src='./medal55.webp?v=214&b=218';medal.className='pilot-medal';medal.alt='푸르 르 메리트';medal.title='푸르 르 메리트';b.prepend(medal)}b.className=id===pilot?'active':'';b.setAttribute('aria-pressed',id===pilot);b.disabled=!!game;b.onclick=()=>{pilot=id;plane=pilotPlane(id);roster()};$('pilotTabs').append(b)}const canChooseBaron=pilot==='baron'&&(selectedMode!=='campaign'||freeSortie&&hasCampaignClear(activeCampaignStage().id));show('baronAircraftChoice',pilot==='baron');for(const [id,key] of [['baronTriplane','fokker'],['baronAlbatros','baron_albatros']]){$(id).disabled=!!game||!canChooseBaron;$(id).classList.toggle('active',plane===key);$(id).setAttribute('aria-pressed',plane===key);$(id).onclick=()=>{if(game||!canChooseBaron)return;delete aircraftOverrides.baron;baronAircraft=key;coopBaronAircraft=key;plane=pilotPlane(pilot);roster()}}$('baronAircraftHint').textContent=canChooseBaron?'기체마다 다른 액티브를 사용합니다.':'역사 출격은 임무 지정 기체를 사용합니다.';$('pilotAircraft').textContent=displayAircraftName(pilot,plane)+' · '+PLANES[plane].role;const flight=PLANES[plane].handling;$('airframeTip').textContent=flight.tip;$('airframeHistory').textContent=flight.history;const fit=PLANES[plane],xpPercent=Math.round((fit.xpCostMultiplier-1)*100);$('airframeStats').textContent=`속도 ${Math.round(fit.speed/181*100)} · 선회 ${Math.round(fit.turn/4.3*100)} / 100 · 내구도 ${fit.hp} HP`;$('airframeGrowth').textContent=`레벨업 경험치 ${xpPercent>0?'+':''}${xpPercent}%${xpPercent<0?' · 빠른 성장':xpPercent>0?' · 고성능 기체 성장 비용':' · 표준 성장'}`;const selected=$('selectedAircraft').getContext('2d');selected.clearRect(0,0,180,160);planeSprite(selected,90,76,-Math.PI/2,aircraftKey(plane,false,pilot),1/.54);const w=WEAPONS[plane];$('weaponSpec').textContent=`${w.name} × ${w.guns} · ${w.caliber} · 각 ${w.belt}발`;$('weaponDetail').textContent=`게임 연사 기준: 총당 분당 ${w.rpm}발 · 공중 재장전 ${w.reload}초 (각색)`;$('central').disabled=!!game;$('entente').disabled=!!game;applyPilotPortrait('portrait');$('hangarPortrait').src=portraitSources[pilot]||'portrait-'+pilot+'.webp?v=214&b=219';$('hangarAircraftName').textContent=displayAircraftName(pilot,plane);$('hangarPortrait').alt=p.name+' 파일럿 일러스트';$('hangarName').textContent=p.name;$('hangarSkill').textContent=p.skill;const hc=$('hangarPlane').getContext('2d');hc.clearRect(0,0,144,160);planeSprite(hc,72,76,-Math.PI/2,aircraftKey(plane,false,pilot),1/.54);renderCampaignMenu();renderCoopSetup();renderAircraft103()}
$('central').onclick=()=>{faction='central';pilot='baron';plane='fokker';roster()};$('entente').onclick=()=>{faction='entente';pilot='fonck';plane='camel';roster()};
function resize(){let r=canvas.getBoundingClientRect();const pixelScale=window.matchMedia('(max-width:720px), (pointer:coarse) and (max-height:600px)').matches?.8:1;W=Math.max(240,Math.round(r.width/pixelScale));H=Math.max(240,Math.round(r.height/pixelScale));canvas.width=W;canvas.height=H;ctx.imageSmoothingEnabled=false;ctx.imageSmoothingQuality='high'}new ResizeObserver(resize).observe($('viewport'));
function saveRanking(score){let rows=[];try{rows=JSON.parse(localStorage.getItem('headon-ranking')||'[]')}catch{}rows.push({name:nickname||t('pilot.anonymous'),score,time:Math.floor(game.t),pilot:PILOTS[pilot].name});rows.sort((a,b)=>b.score-a.score);rows=rows.slice(0,10);try{localStorage.setItem('headon-ranking',JSON.stringify(rows))}catch{}return rows}function rankingText(rows){return rows.map((r,i)=>`${['🥇','🥈','🥉'][i]||String(i+1)+'.'} ${r.name} — ${t('ranking.points',{score:Number(r.score).toLocaleString()})}`).join('\n')}async function syncServerRanking(score){const run=game;try{const res=await fetch('/api/rankings',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:nickname,score,pilot:PILOTS[pilot].name})});if(!res.ok)return;const rows=await res.json();if(game!==run)return;const text=$('modalText').textContent;const mark=t('result.local');if(text.includes(mark))$('modalText').textContent=text.replace(new RegExp(mark+'[\\s\\S]*'),`${t('ranking.serverPriority')}\n${rankingText(rows)}`)}catch{}}function start(){game?.stageBoss?.dispose();if(selectedMode==='coop2'&&!coopAvailable)return;coopInput.reset();coopCutinEnds.p1=coopCutinEnds.p2=0;show('bossArrival',false);bossArrivalUntil=0;show('bossWarning',false);show('bossCutin',false);bossCardFrom=0;bossCutinUntil=0;lastStageBossId='';if(selectedMode!=='campaign')nickname=selectedMode==='coop2'?'P1':t('pilot.anonymous');show('skillCutin',false);cutinUntil=0;if(selectedMode==='campaign'){const stage=activeCampaignStage();game=new CampaignGame(stage.id,pilot,{free:freeSortie,cleared:hasCampaignClear(stage.id),baronAircraft});plane=game.plane}else if(selectedMode==='coop2'){plane=pilot==='baron'?(baronAircraft==='baron_albatros'?'baron_albatros':'fokker'):pilotPlane(pilot);const coopP2Plane=coopPilot2==='baron'?(coopBaronAircraft==='baron_albatros'?'baron_albatros':'fokker'):coopSelectedPlane(coopPilot2);game=new CoopGame([{nickname:nickname||'P1',pilot,plane},{nickname:'P2',pilot:coopPilot2,plane:coopP2Plane}])}else{plane=pilotPlane(pilot);game=new Game(plane,pilot)}game.viewWidth=W;game.viewHeight=H;keys={};joy=null;show('hangar',false);show('modal',false);show('hud');show('xpHud');show('ammoHud');show('touch');show('loadout');document.body.classList.add('playing');document.body.classList.toggle('coop-playing',game.mode==='coop2');show('coopHud',game.mode==='coop2');show('coopCutins',game.mode==='coop2');document.documentElement.classList.add('flight-fullscreen');flightViewport.lock();document.querySelector('.field-bottom').style.display='none';document.querySelector('footer').style.display='none';document.querySelector('.field-top').style.display='none';$('missionLabel').textContent=game.mode==='campaign'?game.stage.title:t('status.inProgress');document.querySelector('.time small').textContent=game.mode==='campaign'?'Campaign':t('mode.endless');show('campaignHud',game.mode==='campaign');show('missionMap',game.mode==='campaign');document.body.classList.toggle('campaign-playing',game.mode==='campaign');roster();resize();$('start').blur();sfx('launch')}
function returnHangar(){regionTransitionUntil=0;regionTransitionAssetsReady=true;show('regionTransition',false);transitionAssetPrep(-1).catch(()=>{});game?.stageBoss?.dispose();updateStageBossHud(null);coopInput.reset();document.body.classList.remove('coop-playing','coop-p2-choice');show('coopHud',false);show('coopCutins',false);show('bossArrival',false);bossArrivalUntil=0;show('bossWarning',false);show('bossCutin',false);bossCardFrom=0;bossCutinUntil=0;lastStageBossId='';show('skillCutin',false);cutinUntil=0;game=null;show('campaignHud',false);show('missionMap',false);document.body.classList.remove('campaign-playing');plane=pilotPlane(pilot);keys={};joy=null;show('modal',false);show('hangar');show('hud',false);show('xpHud',false);show('ammoHud',false);show('touch',false);show('loadout',false);show('toast',false);document.body.classList.remove('playing');document.documentElement.classList.remove('flight-fullscreen');flightViewport.unlock();document.querySelector('.field-bottom').style.display='';document.querySelector('footer').style.display='';document.querySelector('.field-top').style.display='';$('missionLabel').textContent='출격 대기';$('skillBar').style.width='100%';$('skillStatus').textContent='액티브 준비 완료';roster();resize();$('start').focus({preventScroll:true})}
function modal(tag,title,text,buttons){clearChoiceIconRefs();lastFocus=document.activeElement;document.querySelector?.('#rankingPanel')?.remove?.();$('modalTag').textContent=tag;$('modalTitle').textContent=title;$('modalText').textContent=text;$('modalActions').replaceChildren();for(let b of buttons){let el=document.createElement('button');el.className=b.desc?'choice rarity-'+(b.rarity||'normal'):'primary';if(b.desc){let strong=document.createElement('b'),span=document.createElement('span');strong.textContent=b.label;span.textContent=b.desc;const icon=document.createElement('canvas');icon.width=112;icon.height=88;icon.className='choice-icon';choiceIconRefs.push({canvas:icon,id:b.upgradeId,owner:b.owner});if(icon.dataset)icon.dataset.upgradeId=b.upgradeId;icon.setAttribute('aria-hidden','true');drawUpgradeIcon(icon,b.upgradeId,b.owner);el.append(icon,strong,span)}else el.textContent=b.label;el.onclick=b.run;$('modalActions').append(el)}show('modal');$('modalActions').querySelector('button')?.focus({preventScroll:true})}
function resume(){if(game?.mode==='coop2'){if(game.resume()){coopInput.clear();last=performance.now();show('modal',false)}return}if(game?.state==='paused'){game.state='playing';show('modal',false);lastFocus?.focus({preventScroll:true})}}
function pause(){if(game?.mode==='coop2'){pauseCoop();return}if(game?.state==='playing'){game.state='paused';keys={};joy=null;showBuildPause151()}else resume()}
function help(){if(game?.mode==="coop2"){if(game.state==="playing")pauseCoop();return}if(game?.state==='upgrade'||game?.state==='lost'||game?.state==='won')return;let wasPlaying=game?.state==='playing';if(wasPlaying){game.state='paused';keys={};joy=null}modal('FLIGHT MANUAL',t('help.title'),t('help.text'),[{label:t('common.ok'),run:()=>{show('modal',false);if(wasPlaying)game.state='playing';else if(game?.state==='paused')pause();lastFocus?.focus({preventScroll:true})}}])}
$('reload').onclick=()=>game?.reload();$('start').onclick=start;$('pilotNickname').onkeydown=e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();start()}};$('pause').onclick=pause;$('help').onclick=help;$('touchSkill').onclick=e=>{e.preventDefault();game?.skill()};$('touchSkill').onpointerdown=e=>{e.preventDefault();game?.skill()};$('touchEvade').onclick=e=>{e.preventDefault();game?.evade()};$('touchEvade').onpointerdown=e=>{e.preventDefault();game?.evade()};$('sound').onclick=()=>{muted=!muted;setSfxMuted(muted);$('sound').textContent=muted?'소리 OFF':'소리 ON';$('sound').setAttribute('aria-label',muted?'소리 켜기':'소리 끄기');sound()};
window.addEventListener('keydown',e=>{if(regionTransitionUntil>0)return;if(['INPUT','TEXTAREA'].includes(e.target?.tagName))return;if(game?.mode==='coop2'){coopInput.keydown(e,game,{choose:chooseCoop,pause:pauseCoop,highlight:highlightCoopChoice});return}if(e.code==='Tab'&&!$('modal').classList.contains('hidden')){const btns=[...$('modal').querySelectorAll('button,input')];if(e.shiftKey&&document.activeElement===btns[0]){e.preventDefault();btns.at(-1)?.focus({preventScroll:true})}else if(!e.shiftKey&&document.activeElement===btns.at(-1)){e.preventDefault();btns[0]?.focus({preventScroll:true})}return}if(!game)return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys[e.code]=true;if(e.repeat)return;if(e.code==='Space')game.evade();if(e.code==='KeyE')game.skill();if(e.code==='KeyR')game.reload();if(e.code==='KeyQ')game.changeAltitude?.();if(e.code==='KeyP'||e.code==='Escape')pause();if(game.state==='upgrade'&&/^Digit[1234]$/.test(e.code)){let pick=choices[Number(e.code.slice(-1))-1];if(pick)choose(pick.id,pick.rarity)}});window.addEventListener('keyup',e=>{delete keys[e.code];coopInput.release(e.code)});window.addEventListener('blur',()=>{keys={};joy=null;if(game?.mode==='coop2'){coopInput.clear();game.pause();if(game.state==='paused')showCoopPause()}else if(game?.state==='playing')pause()});document.addEventListener('visibilitychange',()=>{if(!document.hidden)return;if(game?.mode==='coop2'){coopInput.clear();game.pause();if(game.state==='paused')showCoopPause()}else if(game?.state==='playing')pause()});
let stickId=null,lastStickTap=0;function moveStick(e){if(e.pointerId!==stickId)return;let r=$('stick').getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,l=Math.hypot(dx,dy),m=Math.min(l,33);joy=l>8?Math.atan2(dy,dx):null;$('stick').firstElementChild.style.transform=`translate(${l?dx/l*m:0}px,${l?dy/l*m:0}px)`} $('stick').onpointerdown=e=>{if(performance.now()-lastStickTap<280)game?.evade();lastStickTap=performance.now();stickId=e.pointerId;$('stick').setPointerCapture(e.pointerId);moveStick(e)};$('stick').onpointermove=moveStick;for(let ev of ['pointerup','pointercancel','lostpointercapture'])$('stick').addEventListener(ev,()=>{stickId=null;joy=null;$('stick').firstElementChild.style.transform='none'});
function choose(id,rarity='normal'){if(game?.state!=='upgrade')return;show('modal',false);game.upgrade(id,rarity);$('upgradesText').textContent=UPGRADES.filter(u=>game.upgrades[u.id]).map(u=>reinforcementName(u,game,PLANES)).join(' · ');sound(750,.12)}
function events(){for(let e of game.events.splice(0)){if(e.type==='regionTransition')beginRegionTransition(e.text,e.region);if(e.type==='bossArrival'){bossArrivalUntil=game.t+4.5;$('bossName').textContent=e.pilot?pilotName(e.pilot,e.name||t('warning.ace')):(e.name||t('warning.ace'));$('bossPortrait').src=portraitSources[e.pilot]||TRANSPARENT_PORTRAIT;$('bossPortrait').alt=$('bossName').textContent;$('bossArrivalDetail').textContent=e.pilot?(PILOTS[e.pilot]?.alias||''):t('warning.airspace');$('bossWarnSub').textContent=$('bossName').textContent+' · ENEMY ACE INBOUND';bossCardFrom=performance.now();bossCutinUntil=bossCardFrom+2600;const aceImg=portraitSources[e.pilot]||(e.pilot?'portrait-'+e.pilot+'.webp?v=214&b=219':(e.airframe?'mech/'+e.airframe+'.webp?v=217&b=216':''));setBossCutin(aceImg,$('bossName').textContent,'ENEMY ACE · 적 에이스',$('bossArrivalDetail').textContent);setBgmMode('boss');sfx('bossSting');setTimeout(()=>sfx('bossSting'),620)}if(e.type==='upgrade'){choices=game.rollChoices().map(u=>({id:u.id,rarity:u.rarity}));const rarityName={normal:'일반',magic:'매직',rare:'레어',unique:'유니크',legendary:'특수장비'};modal('LEVEL '+game.level+' / FIELD UPGRADE','강화 선택','전투에 적용할 강화를 하나 선택하세요',choices.map((pick,i)=>{let u=UPGRADES.find(u=>u.id===pick.id);return{upgradeId:pick.id,label:`${i+1}. [${rarityName[pick.rarity]}] ${u.name}`,rarity:pick.rarity,desc:upgradeDescription(pick.id,pick.rarity,game),run:()=>choose(pick.id,pick.rarity)}}));sfx('levelup')}if(['wave','skill','ally','flak'].includes(e.type)){$('toast').textContent=runtimeEventText(e.text);show('toast');toastUntil=performance.now()+2200;if(e.type==='skill'){sfx('skill');const p=pilotLoadout(pilot,plane);$('cutinName').textContent=p.name;$('cutinSkill').textContent=p.skill;prepareCutin();show('skillCutin');cutinUntil=performance.now()+2100}else sfx(e.type==='flak'?'flak':e.type==='ally'?'ally':'wave')}if(e.type==='reload')sfx('reload');if(e.type==='loaded')sfx('loaded');if(e.type==='shot'&&performance.now()-lastShotSound>100){lastShotSound=performance.now();sfx('shot')}if(e.type==='impact'&&performance.now()-lastImpactSound>65){lastImpactSound=performance.now();sfx('impact')}if(e.type==='pickup'&&performance.now()-lastPickupSound>220){lastPickupSound=performance.now();sfx(e.text==='heal'?'heal':'pickup')}if(e.type==='hit')sfx('hit');if(e.type==='kill')sfx(e.text==='balloon'?'balloon':'kill');if(e.type==='end')sfx(game.state==='won'||game.result?.won?'victory':'defeat');if(e.type==='end'&&game.mode==='campaign'){campaignEnd(game);continue}if(e.type==='end'){showSoloResult(game)}}}
function drawZeppelin(c,x,y,a,scale=1,damaged=false,airshipFaction=null){
 const zeppelinSprite=airshipFaction==='central'?globalZeppelinSprite:airshipFaction==='entente'?ententeAirshipSprite:faction==='central'?ententeAirshipSprite:globalZeppelinSprite;
  c.save();c.translate(Math.round(x),Math.round(y));c.rotate(a+Math.PI);c.imageSmoothingEnabled=false;
  if(zeppelinSprite.complete&&zeppelinSprite.naturalWidth){const w=400*scale,h=w*zeppelinSprite.naturalHeight/zeppelinSprite.naturalWidth;c.globalAlpha=damaged?.72:1;c.drawImage(zeppelinSprite,-w/2,-h/2,w,h);if(damaged){c.globalAlpha=.25;c.fillStyle='#ffb078';c.fillRect(-w*.34,-h*.32,w*.68,h*.18)}}
  else{c.scale(scale,scale);c.fillStyle=damaged?'#616b62':'#b4bba7';c.beginPath();c.ellipse(0,0,29,52,0,0,Math.PI*2);c.fill();c.strokeStyle='#59665b';c.lineWidth=2;c.stroke();c.fillStyle='#30372e';c.fillRect(-18,34,36,9);c.fillRect(-12,41,24,7);c.fillStyle='#d8cb9b';c.fillRect(-8,-15,16,6);c.fillRect(-8,9,16,6);c.fillStyle='#454d41';c.fillRect(-34,-3,7,6);c.fillRect(27,-3,7,6)}c.restore()}
function drawPixelHeart(c,x,y,size,color='#17131c'){const s=Math.max(1,Math.round(size/4));c.fillStyle=color;c.fillRect(x-2*s,y-s,s,s);c.fillRect(x+s,y-s,s,s);c.fillRect(x-3*s,y,6*s,s);c.fillRect(x-2*s,y+s,4*s,s);c.fillRect(x-s,y+2*s,2*s,s)}
function terrain(cx,cy,width=W,height=H){const W=width,H=height;ctx.fillStyle='#778563';ctx.fillRect(0,0,W,H);const tile=140;let sx=Math.floor((cx-W/2)/tile),sy=Math.floor((cy-H/2)/tile);const noise=(x,y)=>{let n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n)};for(let x=sx;x<sx+W/tile+2;x++)for(let y=sy;y<sy+H/tile+2;y++){let px=Math.floor(x*tile-cx+W/2),py=Math.floor(y*tile-cy+H/2),n=noise(x,y);ctx.fillStyle=['#758461','#7d8966','#81906c','#71815e','#6d7e5d'][Math.floor(n*5)];ctx.fillRect(px,py,138,138);ctx.fillStyle='#94a27733';for(let i=10;i<135;i+=13)ctx.fillRect(px+i,py+3,2,130);ctx.fillStyle='#4b604543';ctx.fillRect(px,py,140,3);if(n>.7){for(let j=0;j<7;j++){let tx=px+noise(x+j,y+3)*130,ty=py+noise(x+9,y+j)*130;ctx.fillStyle='#465f3d';ctx.fillRect(tx,ty,9,9);ctx.fillStyle='#567044';ctx.fillRect(tx-2,ty-3,9,8)}}if(n<.1){ctx.fillStyle='#586143';ctx.fillRect(px+43,py+48,29,20);ctx.fillStyle='#b3a487';ctx.fillRect(px+42,py+43,26,18);ctx.fillStyle='#71634d';ctx.fillRect(px+39,py+41,32,6)}}
 // A winding river and broken trench lines follow persistent world coordinates.
 ctx.strokeStyle='#667f76';ctx.lineWidth=38;ctx.beginPath();for(let yy=-30;yy<H+40;yy+=15){let wy=cy-H/2+yy,xx=Math.sin(wy*.002)*180+240-cx+W/2;yy===-30?ctx.moveTo(xx,yy):ctx.lineTo(xx,yy)}ctx.stroke();ctx.strokeStyle='#93a28a66';ctx.lineWidth=3;ctx.stroke();ctx.strokeStyle='#655c44';ctx.lineWidth=5;ctx.beginPath();for(let yy=-20;yy<H+30;yy+=15){let wy=cy-H/2+yy,xx=-210+Math.sin(wy*.008)*45+(Math.floor(wy/22)%2)*12-cx+W/2;yy===-20?ctx.moveTo(xx,yy):ctx.lineTo(xx,yy)}ctx.stroke()}
function drawEagleGhost(ctx,x,y,a,al){ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.globalAlpha=Math.max(0,al);ctx.strokeStyle='#2b3442';ctx.lineWidth=4.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-21,-7);ctx.quadraticCurveTo(-7,-22,16,-8);ctx.moveTo(-21,7);ctx.quadraticCurveTo(-7,22,16,8);ctx.moveTo(-21,-7);ctx.lineTo(-21,7);ctx.stroke();ctx.fillStyle='#2b3442';ctx.beginPath();ctx.ellipse(-9,0,12,3.6,0,0,Math.PI*2);ctx.fill();ctx.restore()}
function drawPilotPassives(g,x,y,t,point){
 const fxGlow=(cx,cy,r,c0)=>{const g2=ctx.createRadialGradient(cx,cy,0,cx,cy,r);g2.addColorStop(0,c0);g2.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g2;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill()};
 const fxSpark=(cx,cy,r,col,al,rot=0)=>{ctx.strokeStyle=col;ctx.lineWidth=Math.max(1.3,r*.13);ctx.lineCap='round';ctx.globalAlpha=al;ctx.beginPath();for(let i2=0;i2<4;i2++){const aa=rot+i2*Math.PI/2;ctx.moveTo(cx+Math.cos(aa)*r*.3,cy+Math.sin(aa)*r*.3);ctx.lineTo(cx+Math.cos(aa)*r,cy+Math.sin(aa)*r)}ctx.stroke();ctx.globalAlpha=Math.min(1,al*1.25);ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(cx,cy,Math.max(1.1,r*.15),0,Math.PI*2);ctx.fill()};
 for(const gh of g.immelmannGhosts||[]){const[gx,gy]=point(gh.x,gh.y);drawEagleGhost(ctx,gx,gy,gh.a,Math.min(1,gh.life/gh.maxLife*1.4)*.85)}
 if(g.loewenhardtEngaged){ctx.save();const pulse=.6+.3*Math.sin(t*9);fxGlow(x+Math.cos(g.a)*30,y+Math.sin(g.a)*30,26,`rgba(255,206,88,${.32*pulse})`);ctx.globalAlpha=.9;ctx.lineCap=`round`;ctx.strokeStyle=`rgba(255,196,64,${pulse*.5})`;ctx.lineWidth=7;ctx.beginPath();ctx.arc(x,y,37,g.a-Math.PI/2.7,g.a+Math.PI/2.7);ctx.stroke();ctx.strokeStyle=`rgba(255,232,140,${pulse})`;ctx.lineWidth=2.6;ctx.beginPath();ctx.arc(x,y,37,g.a-Math.PI/2.7,g.a+Math.PI/2.7);ctx.stroke();ctx.strokeStyle=`rgba(255,150,60,${pulse*.6})`;ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(x,y,45,g.a-Math.PI/4.4,g.a+Math.PI/4.4);ctx.stroke();for(let i=0;i<4;i++){const ga=g.a-Math.PI/3+i*Math.PI/4.5+t*4;fxSpark(x+Math.cos(ga)*40,y+Math.sin(ga)*40,7,`#ffdc7a`,.85,ga)}ctx.restore()}
 if(g.fxOverheat>0){ctx.save();const f=g.fxOverheat,nx=x+Math.cos(g.a)*16,ny=y+Math.sin(g.a)*16;ctx.globalAlpha=Math.min(1,f);fxGlow(nx,ny,20+Math.sin(t*26)*3,`rgba(255,110,30,.5)`);fxGlow(nx,ny,11+Math.sin(t*34)*2.4,`rgba(255,200,90,.75)`);fxGlow(nx+Math.cos(g.a)*4,ny+Math.sin(g.a)*4,5.5,`rgba(255,244,190,.9)`);for(let i=0;i<4;i++){const ph=(t*1.7+i*.25)%1,eo=nx+Math.sin(t*6+i*2.2)*7-ph*Math.cos(g.a)*4,ep=ny-ph*26-Math.cos(g.a)*2;ctx.globalAlpha=(1-ph)*.8*f;ctx.fillStyle=i%2?`#ffce6a`:`#ff8a3c`;ctx.beginPath();ctx.arc(eo,ep,2.6*(1-ph)+.8,0,Math.PI*2);ctx.fill()}ctx.restore()}
 if(g.pilot===`rickenbacker`&&(g.rickActive||g.skillTime)>0){ctx.save();ctx.translate(x,y);ctx.rotate(.32);ctx.globalAlpha=.9;ctx.strokeStyle=`rgba(255,200,90,.26)`;ctx.lineWidth=9;ctx.beginPath();ctx.ellipse(0,0,60,32,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=`rgba(255,236,160,.9)`;ctx.lineWidth=2.4;ctx.beginPath();ctx.ellipse(0,0,60,32,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([3,9]);ctx.strokeStyle=`rgba(255,244,200,.5)`;ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(0,0,54,27,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);for(let i=0;i<4;i++){const ga=t*2.4+i*Math.PI/2;fxSpark(Math.cos(ga)*60,Math.sin(ga)*32,7.5,`#ffe8a8`,.9,ga+t)}ctx.restore()}
 if((g.rickCount||0)>=2){ctx.save();const n=Math.min(5,g.rickCount);ctx.globalAlpha=.32;ctx.strokeStyle=`rgba(160,205,255,.55)`;ctx.setLineDash([2,7]);ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,46,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);for(let i=0;i<n;i++){const ga=t*2.2+i*Math.PI*2/n;fxSpark(x+Math.cos(ga)*46,y+Math.sin(ga)*46,7,i%2?`#dfeeff`:`#9fc8ff`,.9,ga+t*2)}ctx.restore()}
 if(g.ballCloak>0&&ballCloudSprite.naturalWidth){ctx.save();const fade=Math.min(1,g.ballCloak*3);for(let i=0;i<7;i++){const ga=t*.5+i*.9,rr=10+((i*53)%26),sc=.16+(i*29)%10*.014;ctx.globalAlpha=.5*fade*(i%2?.85:1);ctx.save();ctx.translate(x+Math.cos(ga)*rr,y+Math.sin(ga)*rr*.75);ctx.rotate(ga*.4);ctx.drawImage(ballCloudSprite,-160*sc,-100*sc,320*sc,200*sc);ctx.globalAlpha=.35*fade;ctx.strokeStyle='#cfe4e8';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,34,20,0,0,Math.PI*2);ctx.stroke();ctx.restore()}ctx.restore()}
 if(g.pilot===`ball`&&g.ballAlone){ctx.save();fxGlow(x,y,34,`rgba(225,235,210,.15)`);const ph=(t*.9)%1;ctx.globalAlpha=(1-ph)*.5;ctx.strokeStyle=`#eef2de`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,30+ph*20,0,Math.PI*2);ctx.stroke();const ph2=(t*.9+.5)%1;ctx.globalAlpha=(1-ph2)*.3;ctx.beginPath();ctx.arc(x,y,30+ph2*20,0,Math.PI*2);ctx.stroke();ctx.restore()}
 if((g.brumAllyCount||0)>0){ctx.save();const n=Math.min(4,g.brumAllyCount);ctx.globalAlpha=.3;ctx.strokeStyle=`rgba(255,140,110,.55)`;ctx.setLineDash([2,7]);ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,42,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);for(let i=0;i<n;i++){const ga=t*1.8+i*Math.PI*2/n;fxSpark(x+Math.cos(ga)*42,y+Math.sin(ga)*42,7,`#ff8a6a`,.9,ga)}ctx.restore()}
 const pl=g.pl||g,pil=pl.pilot||g.pilot;
 // Tail-lock (all pilots): brackets on the tailed enemy, gold when locked
 // Fonck: gold precision reticle ahead of the nose
 if(pil===`fonck`&&pl.muzzleFlash>0){ctx.save();const nx=x+Math.cos(g.a)*30,ny=y+Math.sin(g.a)*30;fxGlow(nx,ny,14,`rgba(255,220,120,.4)`);ctx.globalAlpha=.9;ctx.strokeStyle=`#ffe08a`;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(nx,ny,7,0,Math.PI*2);ctx.stroke();for(let i=0;i<4;i++){const a=g.a+i*Math.PI/2;ctx.beginPath();ctx.moveTo(nx+Math.cos(a)*9,ny+Math.sin(a)*9);ctx.lineTo(nx+Math.cos(a)*13,ny+Math.sin(a)*13);ctx.stroke()}fxSpark(nx,ny,15,`#fff0b0`,.75,t*3);ctx.restore()}
 // Baracca: head-on duel arc
 if(pil==='baracca'&&(g.enemies||[]).some(e=>{if(e.hp<=0)return false;const d=(e.x-pl.x)**2+(e.y-pl.y)**2;return d<520*520&&Math.abs(Math.atan2(Math.sin(Math.atan2(e.y-pl.y,e.x-pl.x)-g.a),Math.cos(Math.atan2(e.y-pl.y,e.x-pl.x)-g.a)))<Math.PI/3})){ctx.save();const pulse=.6+.3*Math.sin(t*10);fxGlow(x+Math.cos(g.a)*34,y+Math.sin(g.a)*34,24,`rgba(224,58,42,${.3*pulse})`);ctx.globalAlpha=.9;ctx.lineCap=`round`;ctx.strokeStyle=`rgba(224,58,42,${pulse*.55})`;ctx.lineWidth=7;ctx.beginPath();ctx.arc(x,y,44,g.a-Math.PI/3,g.a+Math.PI/3);ctx.stroke();ctx.strokeStyle=`rgba(255,214,150,${pulse})`;ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(x,y,44,g.a-Math.PI/3,g.a+Math.PI/3);ctx.stroke();ctx.strokeStyle=`rgba(255,120,80,${pulse*.7})`;ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(x,y,52,g.a-Math.PI/4.4,g.a+Math.PI/4.4);ctx.stroke();for(let i=0;i<3;i++){const ga=g.a-Math.PI/3+i*Math.PI/3;fxSpark(x+Math.cos(ga)*48,y+Math.sin(ga)*48,6.5,`#ff9a70`,.85,ga+t*3)}ctx.restore()}
 // Jacobs: little black devils, one per kill-stack (max 3)
 if(pil===`immelmann`&&(pl.eagleTime||0)>0){ctx.save();const f=Math.min(1,pl.eagleTime);fxGlow(x+Math.cos(g.a)*24,y+Math.sin(g.a)*24,20,`rgba(110,200,255,${.28*f})`);ctx.globalAlpha=.7+.25*Math.sin(t*14);ctx.lineCap=`round`;ctx.strokeStyle=`rgba(110,200,255,${.55*f})`;ctx.lineWidth=6;ctx.beginPath();ctx.arc(x,y,40,g.a-Math.PI/2-.9,g.a-Math.PI/2+.9);ctx.stroke();ctx.strokeStyle=`rgba(210,240,255,${.95*f})`;ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(x,y,40,g.a-Math.PI/2-.9,g.a-Math.PI/2+.9);ctx.stroke();for(let i=0;i<3;i++){const ga=g.a-Math.PI/2-.7+i*.7+t*5,ex=x+Math.cos(ga)*40,ey=y+Math.sin(ga)*40;ctx.globalAlpha=.8*f;ctx.strokeStyle=`#dff2ff`;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(ex-Math.cos(ga)*7,ey-Math.sin(ga)*7);ctx.lineTo(ex,ey);ctx.stroke()}ctx.restore()}
 if(pil===`jacobs`&&(pl.jacobsStacks||0)>0){ctx.save();for(let i=0;i<pl.jacobsStacks;i++){const ga=t*2.4+i*Math.PI*2/3+.6,ox=x+Math.cos(ga)*34,oy=y+Math.sin(ga)*34+Math.sin(t*6+i)*2;fxGlow(ox,oy,11,`rgba(8,4,2,.55)`);ctx.globalAlpha=.94;ctx.translate(ox,oy);ctx.rotate(ga+Math.PI/2);ctx.fillStyle=`#1c1410`;ctx.beginPath();ctx.arc(0,-2,4.4,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-3.6,-4.5);ctx.lineTo(-6.5,-10.5);ctx.lineTo(-1,-6.5);ctx.closePath();ctx.moveTo(3.6,-4.5);ctx.lineTo(6.5,-10.5);ctx.lineTo(1,-6.5);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(-3.4,1.5);ctx.quadraticCurveTo(-7.5,5,-5,9);ctx.lineTo(0,6.5);ctx.lineTo(5,9);ctx.quadraticCurveTo(7.5,5,3.4,1.5);ctx.closePath();ctx.fill();fxSpark(0,-2.5,5,`#ff4a3a`,.9,t*4+i);ctx.setTransform(1,0,0,1,0,0)}ctx.restore()}
 // Bishop: red close-range zone ring when enemy inside
 if(pil===`bishop`){const near=(g.enemies||[]).some(e=>e.hp>0&&(e.x-pl.x)**2+(e.y-pl.y)**2<300*300);if(near){ctx.save();const pulse=.55+.2*Math.sin(t*6);fxGlow(x,y,300,`rgba(224,60,40,.06)`);ctx.globalAlpha=pulse;ctx.setLineDash([10,9]);ctx.lineDashOffset=-t*46;ctx.strokeStyle=`#e04a3a`;ctx.lineWidth=2.8;ctx.beginPath();ctx.arc(x,y,300,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);for(let i=0;i<4;i++){const ga=t*.8+i*Math.PI/2;ctx.strokeStyle=`#ff8a6a`;ctx.lineWidth=3.4;ctx.beginPath();ctx.arc(x,y,300,ga,ga+.16);ctx.stroke()}ctx.restore()}}
 // Mannock: green command glints on his wingmen
 if(pil===`mannock`){const wings=(g.allies||[]).filter(a=>a.life>0);if(wings.length){ctx.save();wings.forEach((a,i)=>{const[ax,ay]=point(a.x,a.y);fxGlow(ax,ay,15,`rgba(120,235,150,.22)`);const ga=t*3+i*2.1;fxSpark(ax+Math.cos(ga)*19,ay+Math.sin(ga)*19,6,i%2?`#bff5c8`:`#7fe09a`,.9,ga);ctx.globalAlpha=.5;ctx.strokeStyle=`rgba(140,240,170,.55)`;ctx.lineWidth=1;ctx.beginPath();ctx.arc(ax,ay,14+Math.sin(t*5+i)*3,0,Math.PI*2);ctx.stroke()});ctx.restore()}}
 // Barker: red chevron pips = grudge stacks
 if(pil===`barker`&&(pl.barkerStacks||0)>0){ctx.save();const n=pl.barkerStacks;fxGlow(x,y-34-n*4.5,20+n*5,`rgba(255,90,60,.2)`);for(let i=0;i<n;i++){const oy=y-34-i*9;ctx.globalAlpha=.92;ctx.fillStyle=i%2?`#ff7a5a`:`#e0442e`;ctx.beginPath();ctx.moveTo(x-8,oy);ctx.lineTo(x,oy-6);ctx.lineTo(x+8,oy);ctx.lineTo(x+8,oy+4);ctx.lineTo(x,oy-2);ctx.lineTo(x-8,oy+4);ctx.closePath();ctx.fill();ctx.strokeStyle=`#ffd9c0`;ctx.lineWidth=.8;ctx.stroke()}fxSpark(x,y-38-n*9,6,`#ffb090`,.9,t*3);ctx.restore()}
 // Luke & Gontermann: markers over heavy targets in range
 if(pil===`boelcke`){const near=(g.allies||[]).filter(a=>a.life>0&&(a.x-pl.x)**2+(a.y-pl.y)**2<360*360);if(near.length){ctx.save();fxGlow(x,y,150,`rgba(150,230,190,.07)`);ctx.globalAlpha=.55;ctx.setLineDash([4,9]);ctx.strokeStyle=`#a8e6c8`;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(x,y,360,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);near.forEach((a,i)=>{const[ax,ay]=point(a.x,a.y);fxGlow(ax,ay,13,`rgba(190,240,215,.3)`);ctx.globalAlpha=.85;ctx.strokeStyle=`#e4f4ea`;ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(ax-4.5,ay);ctx.lineTo(ax+4.5,ay);ctx.moveTo(ax,ay-6);ctx.lineTo(ax,ay+6);ctx.stroke()});ctx.restore()}}
 if(pil===`voss`){const n=(g.enemies||[]).filter(e=>e.hp>0&&(e.x-pl.x)**2+(e.y-pl.y)**2<400*400).length;if(n>=2){ctx.save();const m=Math.min(6,n);ctx.globalAlpha=.3;ctx.strokeStyle=`rgba(255,140,110,.5)`;ctx.setLineDash([2,7]);ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,44,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);for(let i=0;i<m;i++){const ga=t*2.6+i*Math.PI*2/m+.4;fxSpark(x+Math.cos(ga)*44,y+Math.sin(ga)*44,7.5,i%2?`#ff9a7a`:`#e0523a`,.9,ga+t*2)}ctx.restore()}}
 if(pil===`luke`||pil===`gontermann`){const heavy=(g.enemies||[]).filter(e=>e.hp>0&&(e.heavyBomber||e.zeppelin||e.boss||e.ace||e.big||e.stageBossBody||e.navalVessel||e.fieldUnit||e.type===`boss`)&&(e.x-pl.x)**2+(e.y-pl.y)**2<700*700);if(heavy.length){ctx.save();heavy.slice(0,4).forEach((e,i)=>{const[ex,ey]=point(e.x,e.y);const r=(e.r||18)+13+Math.sin(t*6+i)*3;if(pil===`luke`){fxGlow(ex,ey,r+14,`rgba(255,170,60,.14)`);ctx.globalAlpha=.85;ctx.strokeStyle=`#ffb43c`;ctx.lineWidth=2.4;ctx.save();ctx.translate(ex,ey);ctx.rotate(t*1.5);ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r,0);ctx.lineTo(0,r);ctx.lineTo(-r,0);ctx.closePath();ctx.stroke();for(let i2=0;i2<4;i2++){const aa=t*1.5+i2*Math.PI/2;ctx.beginPath();ctx.moveTo(Math.cos(aa)*r,Math.sin(aa)*r);ctx.lineTo(Math.cos(aa)*(r+7),Math.sin(aa)*(r+7));ctx.stroke()}ctx.restore()}else{ctx.globalAlpha=.85;for(let j=0;j<3;j++){const ga=t*2+j*2.1;fxSpark(ex+Math.cos(ga)*r*.7,ey+Math.sin(ga)*r*.7,6,j%2?`#ff8a3c`:`#ffce6a`,.9,ga)}}});ctx.restore()}}
}
function draw(t){let cx=game?game.x:Math.sin(t*.03)*45,cy=game?game.y:-t*12;ctx.save();if(game?.shake)ctx.translate((Math.random()-.5)*game.shake,(Math.random()-.5)*game.shake);terrain(cx,cy);drawStageBoss(ctx,game,W,H,{drawZeppelin,drawFieldArt,layer:'bodies'});if(game){ctx.strokeStyle='#ecf6de35';ctx.lineWidth=1;for(let i=0;i<16;i++){let px=(i*137.3+t*73)%W,py=(i*97.7+t*170)%H;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px-Math.cos(game.a)*22,py-Math.sin(game.a)*22);ctx.stroke()}}const point=(x,y)=>[x-cx+W/2,y-cy+H/2];if(game){
 // Voss reverse-turn afterimages: player and ace boss use the same pale ghost trail.
 for(const ghost of game.vossAfterimages||[]){const [gx,gy]=point(ghost.x,ghost.y);ctx.save();ctx.globalAlpha=.34*(ghost.life/ghost.maxLife);planeSprite(ctx,gx,gy,ghost.a,aircraftKey(plane,false,'voss'),1,false,false);ctx.restore()}
 for(const e of game.enemies||[])for(const ghost of e.vossTrails||[]){const [gx,gy]=point(ghost.x,ghost.y);ctx.save();ctx.globalAlpha=.42*(ghost.life/ghost.maxLife);planeSprite(ctx,gx,gy,ghost.a,e.bossPlane||'fokker_voss',enemyAircraftScale(e),true,false);ctx.restore()}
 for(let d of game.drops){let[x,y]=point(d.x,d.y);if(d.heal||d.supply){ctx.strokeStyle='#9cffb4';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,22+Math.sin(t*5)*3,0,Math.PI*2);ctx.stroke();drawEquipment(ctx,'repair',x,y+Math.sin(t*3)*2,0,40)}else{if(xpGem?.naturalWidth)ctx.drawImage(xpGem,x-9,y-9,18,18);else{ctx.fillStyle='#63d5ec';ctx.fillRect(x-3,y-3,6,6)}}}for(const grenade of game.grenades||[]){const[gx,gy]=point(grenade.x,grenade.y);drawGrenade(ctx,grenade,gx,gy)}for(let m of game.mines){let[x,y]=point(m.x,m.y);if(!fx(ctx,'mine',x,y,FX56?56:60,FX56?56:60))drawEquipment(ctx,'mine',x,y,0,60);if(m.arm===0){ctx.strokeStyle='#ffcc6677';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,20+Math.sin(t*5)*2,0,Math.PI*2);ctx.stroke()}}for(let b of game.bullets){if(b.flak||b.enemy||b.motorCannon||b.cow37)continue;let[x,y]=point(b.x,b.y);if(b.rocket){if(!fx(ctx,'rocket',x,y,52,16,Math.atan2(b.vy,b.vx)))drawEquipment(ctx,'rocket',x,y,Math.atan2(b.vy,b.vx)+Math.PI/2,48);}else if(b.fonckSeeker){ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(b.vy,b.vx));if(!fx(ctx,'tracerCream',-6,0,46,10)){ctx.fillStyle='#fff5bd';ctx.fillRect(-18,-3,30,6);ctx.fillStyle='#f3a94f';ctx.fillRect(-25,-1,12,2)}ctx.restore();}else{const bc=b.mauserRound?'#a98cff':b.eagle?'#9fdcff':b.enemy?'#ffb096':(b.formation||b.ally)?'#b9f2de':b.pierce?'#f8f5cd':friendlyTracerColor(b,game.gunUpgradeBonus),bw=b.enemy?3:(b.formation||b.ally)?4:b.pierce?3:2;ctx.strokeStyle=bc;ctx.lineWidth=bw;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-b.vx*.018,y-b.vy*.018);ctx.stroke()}}for(let e of game.enemies){let[x,y]=point(e.x,e.y);if(e.groundEscort){drawBattlefieldSprite(ctx,'aa',x,y,96,e.a+Math.PI/2);continue}if(e.stageBossBody||e.heavyBomber||e.missionGround||e.navalVessel||e.fieldUnit)continue;let key=e.escortPlane?e.escortPlane:e.bossPlane?e.bossPlane:e.ace&&faction==='entente'?'fokker_red':liveryVariant(e,faction==='central'?(e.type==='hunter'?'nieuport':e.type==='boss'?'spad':'camel'):(e.type==='hunter'||e.type==='boss'?'fokker':'albatros'));let size=enemyAircraftScale(e);planeSprite(ctx,x+14,y+22,e.a,key,size,true,true);planeSprite(ctx,x,y,e.a,key,size,true,false,e.hitFlash,e.hp<=e.maxHp*.5);if(e.vossInvuln>0||e.aceInvuln124>0){ctx.save();ctx.globalAlpha=.55;ctx.strokeStyle=e.aceInvuln124>0?'#35253d':'#e9f2ca';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,42+Math.sin(t*20)*4,0,Math.PI*2);ctx.stroke();ctx.restore()}if(e.vossSurge){ctx.save();ctx.globalAlpha=.9;const n2=Math.min(7,Math.max(3,e.vossSurgeCount||3));ctx.strokeStyle='rgba(255,222,140,.4)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,50,0,Math.PI*2);ctx.stroke();for(let i=0;i<n2;i++){const ga=t*2.3+i*Math.PI*2/n2;ctx.fillStyle=i%2?'#ffe6a2':'#cfe6ff';ctx.beginPath();ctx.arc(x+Math.cos(ga)*50,y+Math.sin(ga)*50,3,0,Math.PI*2);ctx.fill()}ctx.restore()}if(e.type==='zeppelin')drawZeppelin(ctx,x,y,e.a,size,e.hitFlash>0);if(e.type==='boss'){ctx.fillStyle='#2a3024';ctx.fillRect(x-30,y-40,60,4);ctx.fillStyle='#e7835c';ctx.fillRect(x-30,y-40,60*e.hp/e.maxHp,4)}}for(let p of game.particles){let[x,y]=point(p.x,p.y);const smokeLife=p.smoke?Math.max(0,p.life/p.maxLife):0;ctx.globalAlpha=p.smoke?smokeLife*(p.muzzleSmoke?.88:.65):Math.min(1,p.life*3);if(p.petal){drawPetalParticle(ctx,p,x,y);continue}if(p.heart){drawPixelHeart(ctx,Math.round(x),Math.round(y),p.size,p.color);continue}ctx.fillStyle=p.color;let size=p.smoke?p.size+(1-smokeLife)*(p.muzzleSmoke?15:10):3;
 if(!p.smoke&&fxReady('spark')){fxTint(ctx,'spark',p.color,x,y,size*4,size*4);continue}
 if(p.smoke){const lum=parseInt(p.color?.slice(1,3)||'88',16),sKey=p.muzzleSmoke?'smokePuff':lum<110?'smokeDark':lum>170?'smokeWisp':'smokeGray';const savedAlpha=ctx.globalAlpha;if(fx(ctx,sKey,x,y,size*2.4,size*2.4,0,savedAlpha)){ctx.globalAlpha=1;continue}}
 ctx.fillRect(Math.round(x-size/2),Math.round(y-size/2),size,size)}ctx.globalAlpha=1;let x=W/2,y=H/2;if(game.pilot==='collishaw'&&game.skillTime>0){ctx.save();ctx.globalAlpha=.94;for(let i=-1;i<=1;i++){let ox=Math.cos(game.a+Math.PI/2)*92*i-Math.cos(game.a)*42,oy=Math.sin(game.a+Math.PI/2)*92*i-Math.sin(game.a)*42;planeSprite(ctx,x+ox,y+oy,game.a,'collishaw_sopwith',.78,false,false)}ctx.restore()}drawRedGhosts162(ctx,game,x,y,planeSprite,aircraftKey(plane,false,pilot));const pose129=playerPose(game,x,y);drawPlayerAura(ctx,game,pose129.x,pose129.y);ctx.save();ctx.translate(pose129.x-x,pose129.y-y);if(game.bishopTime>0)ctx.translate(0,-Math.sin(Math.PI*(1-game.bishopTime/2.4))*H*1.1);planeSprite(ctx,x+18,y+28,game.a,aircraftKey(plane,false,pilot),pose129.scale,false,true);ctx.globalAlpha=game.invuln>0&&Math.floor(t*15)%2?.55:1;planeSprite(ctx,x,y,game.a,aircraftKey(plane,false,pilot),pose129.scale,false,false,game.hitFlash,game.hp<=game.maxHp*.5);ctx.globalAlpha=1;{const loDecal=(txt,al,dx,dy,seed)=>{ctx.save();ctx.translate(x,y);ctx.rotate(game.a);ctx.translate(dx,dy);ctx.font='italic 600 11px Georgia,"Times New Roman",serif';ctx.textAlign='center';const widths=[...txt].map(ch=>ctx.measureText(ch).width);const total=widths.reduce((a2,b2)=>a2+b2,0);let lx=-total/2;[...txt].forEach((ch,i)=>{const w=widths[i],ph2=t*5.1+i*.83+seed,bob=Math.sin(ph2)*1.9+Math.sin(ph2*1.73+1.2)*.9,tilt=Math.sin(ph2*.9+i)*.14,la=al*(.7+.3*Math.sin(ph2*.6+i*1.9));ctx.save();ctx.translate(lx+w/2,bob);ctx.rotate(tilt);ctx.globalAlpha=Math.max(0,la);ctx.strokeStyle='#2c241c';ctx.lineWidth=2.2;ctx.strokeText(ch,0,0);ctx.fillStyle='#e8d7b4';ctx.fillText(ch,0,0);ctx.restore();lx+=w});ctx.restore()};if(game.upgrades?.loEmblem){const ph=t%8.5,fa=ph<1.4?ph/1.4:ph<5.4?1:ph<8.5?(8.5-ph)/3.1:0;if(fa>0)loDecal('LO!',fa*.55,-6,30,0)}if(game.pilot==='udet'&&game.udetBoost>0){const rem=game.udetBoost,fa=Math.min(1,rem*1.2,(5-rem)*2.5);if(fa>0)loDecal('Du doch nicht!!',fa*.62,-14,36,2.3)}}if(game.upgrades?.sacredCowling){ctx.save();ctx.translate(x,y);ctx.rotate(game.a);ctx.globalAlpha=.8;ctx.lineJoin='round';ctx.lineWidth=1.4;ctx.strokeStyle='#2c241c';for(const side of [-1,1]){ctx.fillStyle='#e9e4d0';ctx.beginPath();ctx.ellipse(25,side*7.5,5.2,3.4,side*-.25,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#201a12';ctx.beginPath();ctx.arc(26.5,side*7.5,1.8,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#e8d7b4';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(23,side*3.5);ctx.quadraticCurveTo(18,side*8,11,side*10.5);ctx.stroke();ctx.strokeStyle='#2c241c';ctx.lineWidth=1.4}ctx.restore()}ctx.restore();drawPilotPassives(game,x,y,t,point);if(game.muzzleFlash>0&&game.reloadTime===0){for(let gun=0;gun<game.weapon.guns;gun++){const o=game.weapon.bidirectional?0:(gun-(game.weapon.guns-1)/2)*8,ga=game.gunDirection(gun),mx=x+Math.cos(ga)*25-Math.sin(ga)*o,my=y+Math.sin(ga)*25+Math.cos(ga)*o;if(!fx(ctx,'muzzle',mx+Math.cos(ga)*7,my+Math.sin(ga)*7,22,22,ga)){ctx.fillStyle='#ffbb58';ctx.fillRect(mx-3,my-3,6,6);ctx.fillStyle='#fff4ca';ctx.fillRect(mx-1,my-1,3,3)}}}
 let boss=game.enemies.find(e=>e.type==='boss');if(boss){let[x,y]=point(boss.x,boss.y);if(x<30||x>W-30||y<30||y>H-30){let a=Math.atan2(y-H/2,x-W/2),s=Math.min((W/2-22)/Math.abs(Math.cos(a)),(H/2-22)/Math.abs(Math.sin(a)));ctx.save();ctx.translate(W/2+Math.cos(a)*s,H/2+Math.sin(a)*s);ctx.rotate(a);ctx.fillStyle='#ffb189';ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-6,-6);ctx.lineTo(-6,6);ctx.fill();ctx.restore()}}}else{let x=W*.76+Math.sin(t*.3)*16,y=H*.49;planeSprite(ctx,x+23,y+30,-.62,aircraftKey(plane,false,pilot),2.1,false,true);planeSprite(ctx,x,y,-.62,aircraftKey(plane,false,pilot),2.1);planeSprite(ctx,W*.88,H*.74+Math.sin(t*.4)*10,-.62,aircraftKey(plane,false,pilot),.8,false,true);planeSprite(ctx,W*.88-15,H*.74-20+Math.sin(t*.4)*10,-.62,aircraftKey(plane,false,pilot),.8)}
 // Pixel clouds drift above the battlefield without obscuring bullets completely.
 ctx.fillStyle='#e5e9ce12';for(let i=0;i<5;i++){let xx=((i*179-cx*.25+t*3)%(W+160)+W+160)%(W+160)-80,yy=((i*137-cy*.2)%(H+100)+H+100)%(H+100)-50;ctx.fillRect(xx,yy,95,20);ctx.fillRect(xx+18,yy-13,54,45)}ctx.restore()}
function paintControl(id,key){const c=$(id).getContext('2d');c.clearRect(0,0,48,48);drawGameIcon(c,key,24,24,40)}
function hud(){let g=game;let gun=$('ammoGunIcon');if(gun.width!==72)gun.width=72;gun.setAttribute('aria-label',g.weapon.name);gun.getContext('2d').clearRect(0,0,72,44);drawGameIcon(gun.getContext('2d'),g.cow37?'cow37':'gun-'+(g.weapon.gunProfile||'spandau'),36,22,70);const liveScore=g.priorityKills||0;if(g.mode!=='campaign'&&liveScore>best){best=liveScore;try{localStorage.setItem('headon-priority-best-161',best)}catch{}$('record').textContent='최고 기록 '+best}const reloading=g.reloadTime>0;$('ammoLabel').textContent=g.weapon.name+' × '+g.weapon.guns;$('ammoCount').textContent=g.ammo.reduce((a,b)=>a+b,0)+' / '+g.weapon.belt*g.weapon.guns;$('ammoHud').dataset.status=reloading?'장전 '+g.reloadTime.toFixed(1)+'s':'탄약';$('ammoProgress').style.width=(reloading?(1-g.reloadTime/g.weapon.reload):g.ammo.reduce((a,b)=>a+b,0)/(g.weapon.belt*g.weapon.guns))*100+'%';$('ammoHud').classList.toggle('reloading',reloading);$('reload').disabled=g.state!=='playing'||reloading||g.ammo.every(n=>n===g.weapon.belt);$('reload').textContent=reloading?'장전':'R';$('reload').setAttribute('aria-label',reloading?'재장전 중 '+g.reloadTime.toFixed(1)+'초':'재장전 R');if($('healthCurrent151')){$('healthCurrent151').textContent=Math.ceil(g.hp);$('healthMax151').textContent=Math.round(g.maxHp)};$('healthBar').style.width=100*g.hp/g.maxHp+'%';$('healthBar').style.background=g.hp/g.maxHp<.3?'#ec7549':'#c6d590';$('clock').textContent=String(Math.floor(g.t/60)).padStart(2,'0')+':'+String(Math.floor(g.t%60)).padStart(2,'0');$('kills').textContent=(g.priorityKills||0)+' / '+g.kills;$('level').textContent='LV. '+g.level;$('xpBar').style.width=Math.min(100,100*g.xp/g.need)+'%';$('skillBar').style.width=(1-g.cooldown/(g.skillCooldown()))*100+'%';$('skillStatus').textContent=g.skillTime>0?'액티브 발동 중':g.cooldown>0?`${g.cooldown.toFixed(1)}초 후 사용 가능`:'액티브 준비 완료';$('skillButtonText').textContent='액티브';$('skillButtonState').textContent=g.cooldown>0?`${Math.ceil(g.cooldown)}초`:'준비';$('touchSkill').disabled=g.cooldown>0||g.state!=='playing';$('touchSkill').style.setProperty('--ready',1-g.cooldown/g.skillCooldown());$('touchEvade').style.setProperty('--ready',1-Math.min(1,g.evadeCooldown/(8*(g.evadeCooldownMult||1))));$('maneuverButtonText').textContent='선회기동';$('maneuverButtonState').textContent=g.evadeCooldown>0?`${Math.ceil(g.evadeCooldown)}초`:'준비';$('touchEvade').disabled=g.evadeCooldown>0||g.state!=='playing'}
function frame(now){let dt=Math.min(.04,(now-last)/1000||.016);last=now;if(regionTransitionUntil&&now>=regionTransitionUntil&&regionTransitionAssetsReady){regionTransitionUntil=0;show('regionTransition',false)}const transitioning=!!game&&regionTransitionUntil>0;if(game?.mode==='coop2'){gamepadInput.poll(false);game.viewWidth=W;game.viewHeight=H;if(!transitioning){game.update(dt,coopInput.inputs());coopEvents()}coopHud();relicCooldownTick();drawCoop(ctx,game,W,H,{terrain:(x,y,w,h)=>paintRegion(game.worldRegion(),x,y,w,h),drawZeppelin,drawFieldArt,fieldArt});drawLegendaryDefenseOverlay(game,ctx,W,H);drawStageBoss(ctx,game,W,H,{drawZeppelin,drawFieldArt,layer:'hazards'});updateStageBossHud(game);stageBossCutinCheck();show('bossCutin',game.state==='playing'&&performance.now()>=bossCardFrom&&performance.now()<bossCutinUntil);requestAnimationFrame(frame);return}if(!game||(game.state==='playing'&&!transitioning))ambient+=dt;if(game&&!transitioning){let dx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),dy=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0),controller=gamepadInput.poll(true),angle;if(joy!=null){gamepadInput.useTouch();controller.inputMode='touch';angle=joy}else if(dx||dy){gamepadInput.useKeyboard();controller.inputMode='keyboard';angle=Math.atan2(dy,dx)}else if(controller.inputMode==='gamepad'&&(controller.moveX||controller.moveY))angle=Math.atan2(controller.moveY,controller.moveX);if(controller.inputMode==='gamepad'){if(controller.reloadJustPressed)game.reload();if(controller.activeJustPressed)game.skill();if(controller.maneuverJustPressed)game.evade();if(controller.pauseJustPressed)pause()}game.viewWidth=W;game.viewHeight=H;game.update(dt,{angle,moveX:controller.moveX,moveY:controller.moveY,fireHeld:controller.inputMode==='gamepad'?controller.fireHeld:undefined,inputMode:controller.inputMode});events();hud()}stageBossCutinCheck();show('bossCutin',!!game&&game.state==='playing'&&performance.now()>=bossCardFrom&&performance.now()<bossCutinUntil);draw(ambient);drawLegendaryDefenseOverlay(game,ctx,W,H);drawSupport();drawCampaign(ctx,game,W,H);drawSunStrike(ctx,game,W,H);drawStageBoss(ctx,game,W,H,{drawZeppelin,drawFieldArt,layer:'hazards'});updateStageBossHud(game);if(game?.mode==='campaign')campaignHud();if(now>toastUntil)show('toast',false);if(now>cutinUntil||!game||['lost','won'].includes(game.state))show('skillCutin',false);requestAnimationFrame(frame)}roster();resize();requestAnimationFrame(frame);

function drawSupport(){if(!game)return;let cx=game.x,cy=game.y;const point=(x,y)=>[x-cx+W/2,y-cy+H/2];for(let a of (game.allies||[])){if(!a.plane||!PLANES[a.plane])continue;let[x,y]=point(a.x,a.y),allyKey=game.pilot==='goering'?'goering_fokkerd7':a.plane==='fokker'?'fokker_standard':a.plane;ctx.globalAlpha=.95;planeSprite(ctx,x+12,y+20,a.a,allyKey,.78,false,true);planeSprite(ctx,x,y,a.a,allyKey,.78,false,false,0,a.hp!=null&&a.hp<=a.maxHp*.5);ctx.globalAlpha=1}}hangarArtReady.then(()=>roster());aircraftReady.then(()=>roster());

portraitsReady.then(()=>{roster();applyPilotPortrait('cutinPortrait')});

// A low, repeating rotary pulse gives the aircraft a stronger propeller presence.
setInterval(()=>{if(game?.state==='playing'&&!muted)sfx('engineTick',game.reloadTime>0)},170);

// Collishaw's special is a moving black-triplane strafing run, not a static cut-in.
const _drawFormationBase=draw;
draw=function(t){
  const collie=game?.pilot==='collishaw'&&game.skillTime>0;
  const hiddenZeppelins=game?.enemies?.filter(e=>e.type==='zeppelin')||[];
  if(hiddenZeppelins.length)game.enemies=game.enemies.filter(e=>e.type!=='zeppelin');
  if(collie)game.pilot='__black-flight__';
  _drawFormationBase(t);
  if(hiddenZeppelins.length&&game){
    game.pilot=collie?'collishaw':game.pilot;
    const cx=game.x,cy=game.y,point=(x,y)=>[x-cx+W/2,y-cy+H/2];
    for(const e of hiddenZeppelins){const [x,y]=point(e.x,e.y);drawZeppelin(ctx,x,y,e.a,.92,e.hitFlash>0);ctx.fillStyle='#242c25';ctx.fillRect(x-55,y-65,110,4);ctx.fillStyle='#e7835c';ctx.fillRect(x-55,y-65,110*e.hp/e.maxHp,4)}
    game.enemies.push(...hiddenZeppelins);
  }
  if(collie){
    game.pilot='collishaw';
    const cx=game.x,cy=game.y,point=(x,y)=>[x-cx+W/2,y-cy+H/2];
    ctx.save();ctx.globalAlpha=.98;
    for(const wing of game.formationWings||[]){
      const [x,y]=point(wing.x,wing.y),a=wing.a;
      ctx.strokeStyle='#dbe9d766';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-Math.cos(a)*62,y-Math.sin(a)*62);ctx.lineTo(x-Math.cos(a)*145,y-Math.sin(a)*145);ctx.stroke();
      ctx.globalAlpha=wing.alpha??1;planeSprite(ctx,x+10,y+16,a,'collishaw_sopwith',1,false,true);planeSprite(ctx,x,y,a,'collishaw_sopwith',1,false,false);
      ctx.fillStyle='#ffe1a0';ctx.fillRect(x+Math.cos(a)*31-3,y+Math.sin(a)*31-3,6,6);
    }
    ctx.restore();
  }else if(game)game.pilot=game.pilot==='__black-flight__'?'collishaw':game.pilot;
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
const _startWithMusic=start;start=()=>{music.unlock();_startWithMusic();setBgmMode(musicModeForGame(game))};
const _returnWithMusic=returnHangar;returnHangar=()=>{_returnWithMusic();stopBgm()};
const _soundToggle=$('sound').onclick;$('sound').onclick=()=>{music.unlock();_soundToggle();if(muted)stopBgm();else setBgmMode(musicModeForGame(game))};
$('start').onclick=()=>start();
setInterval(()=>setBgmMode(musicModeForGame(game)),240);

// Replace the legacy score ladder without redeclaring its module bindings.
saveRanking=()=>{if(game?.mode==='campaign'||game?.mode==='coop2')return [];let rows=[];try{rows=JSON.parse(localStorage.getItem('headon-priority-ranking-161')||'[]')}catch{}rows.push({name:nickname||t('pilot.anonymous'),score:game.priorityKills||0,time:Math.floor(game.t),pilot:PILOTS[pilot].name});rows.sort((a,b)=>b.score-a.score);rows=rows.slice(0,10);try{localStorage.setItem('headon-priority-ranking-161',JSON.stringify(rows))}catch{}return rows};
rankingText=rows=>rows.length===0?t('ranking.emptyPriority'):rows.map((r,i)=>`${[t('ranking.medal.centralDisplay'),t('ranking.medal.ironCross'),t('ranking.medal.ententeDisplay')][i]||String(i+1)+'.'} ${r.name} · ${pilotName(r.pilot,PILOTS[r.pilot]?.name||r.pilot||t('ranking.missingPilot'))} — ${t('ranking.rowPriority',{rank:i+1,name:r.name,pilot:pilotName(r.pilot,PILOTS[r.pilot]?.name||r.pilot||t('ranking.missingPilot')),score:Number(r.score).toLocaleString()}).split(' — ').at(-1)}`).join('\n');
function renderRankingMedals(rows,heading=t('ranking.serverPriority')){
 const box=$('modalText');box.replaceChildren();const title=document.createElement('strong');title.textContent=heading;box.append(title);
 if(!rows.length){const empty=document.createElement('p');empty.textContent=t('ranking.emptyPriority');box.append(empty);return}
 const list=document.createElement('ol');list.className='ranking-medal-list';rows.forEach((r,i)=>{const row=document.createElement('li'),badge=document.createElement(i===0?'img':'canvas');badge.className='ranking-medal';
  if(i===0){badge.src='./medal55.webp?v=214&b=214';badge.alt='1 · '+t('ranking.medal.centralDisplay');}else{badge.width=42;badge.height=42;badge.setAttribute('aria-label',(i+1)+' · '+(i===1?t('ranking.medal.ironCross'):t('ranking.medal.ententeDisplay')));drawGameIcon(badge.getContext('2d'),i===1?'ironCross':'victoriaCross',21,21,38);}
  const text=document.createElement('span');text.textContent=t('ranking.rowPriority',{rank:i+1,name:r.name,pilot:pilotName(r.pilot,PILOTS[r.pilot]?.name||r.pilot||t('ranking.missingPilot')),score:Number(r.score).toLocaleString()});row.append(badge,text);list.append(row);});box.append(list);
}
syncServerRanking=async()=>{const run=game;if(game?.mode==='campaign'||game?.mode==='coop2')return;try{const res=await fetch('/api/rankings',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:nickname,score:game.priorityKills||0,pilot:PILOTS[pilot].name,season:'priority-161'})});if(!res.ok)return;const rows=await res.json();if(game!==run)return;renderRankingMedals(rows)}catch{}};


const fieldArt={};for(const [key,file] of Object.entries({flak:'flak-burst',gust:'gust',stork:'portrait-stork',staaken:'staaken','handley-page':'handley-page'})){const im=new Image();im.src=`./${file}.webp?v=214&b=218`;fieldArt[key]=im}
function drawFieldArt(key,x,y,w,h,a=0,alpha=1,flip=false){const im=fieldArt[key];if(!im?.naturalWidth)return;ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(a);if(flip)ctx.scale(-1,1);ctx.globalAlpha=alpha;ctx.imageSmoothingEnabled=false;ctx.drawImage(im,-w/2,-h/2,w,h);ctx.restore()}
const _fieldSupport=drawSupport;
drawSupport=()=>{
 _fieldSupport();if(!game)return;
 const point=(x,y)=>[x-game.x+W/2,y-game.y+H/2];
 for(const e of game.enemies){if(!e.fieldUnit||e.hp<=0)continue;const[x,y]=point(e.x,e.y);ctx.save();
  if(e.rail){const r=e.rail,[rx,ry]=point(r.x,r.y);ctx.save();ctx.translate(rx,ry);ctx.rotate(r.angle);ctx.strokeStyle='#322c25';ctx.lineWidth=4;for(let pos=-r.half-20;pos<=r.half+20;pos+=18){ctx.beginPath();ctx.moveTo(pos,-13);ctx.lineTo(pos,13);ctx.stroke()}ctx.strokeStyle='#bec1ab';ctx.lineWidth=2;for(const off of [-8,8]){ctx.beginPath();ctx.moveTo(-r.half-25,off);ctx.lineTo(r.half+25,off);ctx.stroke()}ctx.restore();
   if(e.fire<.7){ctx.strokeStyle='#ffac7877';ctx.setLineDash([5,8]);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(W/2,H/2);ctx.stroke();ctx.setLineDash([])}
  }else{ctx.strokeStyle='#d4cbaa99';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y+75);ctx.lineTo(x+45,y+138);ctx.stroke();ctx.fillStyle='#4b4130';ctx.fillRect(x+41,y+135,8,5)}
  ctx.shadowColor='#080f0ccc';ctx.shadowBlur=12;ctx.shadowOffsetX=9;ctx.shadowOffsetY=13;drawBattlefieldSprite(ctx,e.fieldSprite,x,y,e.rail?210:354,e.rail?e.rail.angle+Math.PI/2:0);ctx.shadowBlur=ctx.shadowOffsetX=ctx.shadowOffsetY=0;ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillStyle='#ffce95';ctx.fillText(e.name,x,y-(e.rail?120:190));ctx.fillStyle='#172b23';ctx.fillRect(x-26,y+(e.rail?118:190),52,4);ctx.fillStyle='#e6b77d';ctx.fillRect(x-26,y+(e.rail?118:190),52*e.hp/e.maxHp,4);ctx.restore();
 }
 for(const f of game.flakBursts||[]){const [x,y]=point(f.x,f.y);ctx.save();ctx.globalAlpha=Math.min(1,f.life);drawBattlefieldSprite(ctx,'aa',x,y,66);ctx.restore();if(f.life>5.9)drawFieldArt('flak',x,y-12,44,44,0,Math.min(1,(f.life-5.9)*2))}
 for(const e of game.enemies){if(!e.navalVessel||e.hp<=0)continue;const[x,y]=point(e.x,e.y);drawBattlefieldSprite(ctx,'ship',x,y,320,e.a+Math.PI/2);ctx.fillStyle='#24332b';ctx.fillRect(x-22,y+172,44,4);ctx.fillStyle='#de9b73';ctx.fillRect(x-22,y+172,44*e.hp/e.maxHp,4)}
 for(const f of game.hostileMinefields||[]){const[x,y]=point(f.x,f.y);ctx.save();ctx.strokeStyle=f.warning>0?'#ffe0a199':'#e58b6c88';ctx.lineWidth=2;ctx.setLineDash([6,9]);ctx.beginPath();ctx.arc(x,y,f.radius,0,6.283);ctx.stroke();ctx.setLineDash([]);ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#ffd2a9';ctx.fillText(f.warning>0?(getLocale()==='en'?'Mine active '+f.warning.toFixed(1)+'s':'기뢰 활성화 '+f.warning.toFixed(1)+'초'):(getLocale()==='en'?'Minefield':'기뢰지대'),x,y-f.radius-9);for(const m of f.mines){if(m.dead)continue;const[mx,my]=point(m.x,m.y);if(!fx(ctx,'mine',mx,my,60,60))drawEquipment(ctx,'mine',mx,my,0,56);ctx.strokeStyle=f.warning>0?'#ffe0a188':'#ff876e';ctx.beginPath();ctx.arc(mx,my,18,0,6.283);ctx.stroke()}ctx.restore()}
 for(const b of game.bullets){if(!b.flak)continue;const [x,y]=point(b.x,b.y);drawFieldArt('flak',x,y,42,42,ambient*.2,.9);drawEnemyProjectile(ctx,b,x,y,ambient)}
 for(const g of game.gusts||[]){const [x,y]=point(g.x,g.y);const opacity=Math.min(.85,g.life,6-g.life);drawFieldArt('gust',x,y,g.radius*2.6,g.radius*2.6,g.a+ambient*.15,opacity)}
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
  const x=e.x-game.x+W/2,y=e.y-game.y+H/2,im=fieldArt[e.airframe];
  if(!im?.naturalWidth)continue;
  const w=e.airframe==='staaken'?178:158,h=w*im.naturalHeight/im.naturalWidth;
  drawFieldArt(e.airframe,x+14,y+18,w,h,e.a+Math.PI/2,.2);
  drawFieldArt(e.airframe,x,y,w,h,e.a+Math.PI/2,e.hitFlash>0?.65:1);
  ctx.fillStyle='#171f23';ctx.fillRect(x-48,y-h/2-16,96,5);
  ctx.fillStyle='#ed9d66';ctx.fillRect(x-48,y-h/2-16,96*Math.max(0,e.hp/e.maxHp),5);
  ctx.fillStyle='#ffe3aa';ctx.font='11px monospace';ctx.textAlign='center';ctx.fillText(e.name,x,y-h/2-22);
 }
};

// Layered tracers, gun flashes and telegraphed bombing use existing combat art.
const _drawCombatFX=draw;
draw=t=>{
 _drawCombatFX(t);if(!game)return;
 const point=(x,y)=>[x-game.x+W/2,y-game.y+H/2];
 ctx.save();
 for(const b of game.bullets){
  const [x,y]=point(b.x,b.y);
  if(b.rocket){const a=Math.atan2(b.vy,b.vx);if(FX56){fx(ctx,'smokePuff',x-Math.cos(a)*19,y-Math.sin(a)*19,12,10,0,.22)}else{ctx.strokeStyle='#ff982baa';ctx.lineWidth=b.special?5:3;ctx.beginPath();ctx.moveTo(x-Math.cos(a)*15,y-Math.sin(a)*15);ctx.lineTo(x-Math.cos(a)*34,y-Math.sin(a)*34);ctx.stroke()}continue}
  if(!b.enemy||b.flak)continue;
  drawEnemyProjectile(ctx,b,x,y,t);
  if(b.hostileRocket){const a=Math.atan2(b.vy,b.vx);fxTint(ctx,'smokePuff','#ff9a4a',x-Math.cos(a)*14,y-Math.sin(a)*14,18,15);if(!fxTint(ctx,'rocket','#ff7a55',x,y,52,16,a)){ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle='#f2a144';ctx.beginPath();ctx.moveTo(-14,0);ctx.lineTo(-26,-4);ctx.lineTo(-26,4);ctx.closePath();ctx.fill();ctx.fillStyle='#4a3f30';ctx.beginPath();ctx.ellipse(0,0,14,4.5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#8a2f22';ctx.beginPath();ctx.ellipse(9,0,4.5,3.4,0,0,Math.PI*2);ctx.fill();ctx.restore()}}

 }
 for(const e of game.enemies){if(!(e.muzzleFlash>0))continue;
  for(const offset of e.navalVessel||e.type==='zeppelin'?[-95,0,95]:e.heavyBomber?[-42,42]:[0]){
   const hull=e.navalVessel||e.type==='zeppelin';const [x,y]=point(e.x+(hull?Math.cos(e.a)*offset:Math.cos(e.a)*22-Math.sin(e.a)*offset),e.y+(hull?Math.sin(e.a)*offset:Math.sin(e.a)*22+Math.cos(e.a)*offset));
   ctx.save();ctx.translate(x,y);ctx.rotate(e.gunAim??e.a);ctx.globalAlpha=Math.min(1,e.muzzleFlash*10);
   if(!fx(ctx,'muzzle',16,0,hull?44:30,hull?44:30)){ctx.fillStyle='#ff922b';ctx.beginPath();ctx.moveTo(-3,-6);ctx.lineTo(25,0);ctx.lineTo(-3,6);ctx.fill();ctx.fillStyle='#fff4ce';ctx.fillRect(0,-2,14,4);}ctx.restore();
  }
 }
 for(const z of game.bombZones||[]){
  const [x,y]=point(z.x,z.y),p=1-z.delay/z.maxDelay;
  ctx.fillStyle='#ff3c202a';ctx.strokeStyle='#ff855a';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(x,y,z.radius,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.arc(x,y,z.radius*(1-p),0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x-10,y);ctx.lineTo(x+10,y);ctx.moveTo(x,y-10);ctx.lineTo(x,y+10);ctx.stroke();
  const [bx,by]=point(z.sx+(z.x-z.sx)*p,z.sy+(z.y-z.sy)*p);
  if(!fx(ctx,'bomb',bx,by,40,20,Math.atan2(z.y-z.sy,z.x-z.sx)))drawEquipment(ctx,'rocket',bx,by,Math.atan2(z.y-z.sy,z.x-z.sx)+Math.PI/2,38);
 }
 for(const f of game.combatFX||[]){const[x,y]=point(f.x,f.y),p=1-f.life/f.maxLife;
  if(f.amatol){drawAmatolBlast(ctx,f,x,y);continue}
  if(f.grenade){drawGrenadeBlast(ctx,f,x,y);continue}
  if(!drawFxExplosion(ctx,f,x,y))drawFieldArt('flak',x,y,f.radius*(1+p)*2,f.radius*(1+p)*2,0,Math.min(1,f.life*3));
  ctx.strokeStyle=f.side==='enemy'?'#ffae5780':'#ffe6a580';ctx.lineWidth=3*(1-p);ctx.beginPath();ctx.arc(x,y,f.radius*(.3+p),0,Math.PI*2);ctx.stroke();
 }
 ctx.restore();
};
const _eventsCombat=events;
let lastEnemyAudio=0;
events=()=>{
 for(const e of game.events){
  if(e.type==='bombWarning'){$('toast').textContent=e.text;show('toast');toastUntil=performance.now()+1800}
  if(['heavyShot','enemyShot','explosion','rocketSalvo','mineSalvo'].includes(e.type)&&performance.now()-lastEnemyAudio>110){
   lastEnemyAudio=performance.now();sfx(e.type==='explosion'?'explosion':e.type==='rocketSalvo'?'rocket':e.type==='mineSalvo'?'flak':e.type==='heavyShot'?'heavyShot':'enemyShot');
  }
 }
 _eventsCombat();
};

const horseEmblem=new Image();horseEmblem.src='./horse-emblem.webp?v=214&b=214';
const xpGem=null;
const _drawCharge=draw;
draw=t=>{
 _drawCharge(t);if(!(game?.chargeTime>0))return;
 ctx.save();
 const a=game.chargeAngle;ctx.strokeStyle='#ffe3a680';ctx.lineWidth=3;
 for(const offset of [-20,20]){const x=W/2-Math.sin(a)*offset,y=H/2+Math.cos(a)*offset;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-Math.cos(a)*150,y-Math.sin(a)*150);ctx.stroke()}
 if(horseEmblem.naturalWidth){const w=88,h=w*horseEmblem.naturalHeight/horseEmblem.naturalWidth,x=W-w-18,y=Math.max(90,H-h-175);ctx.globalAlpha=Math.min(1,game.chargeTime*6);ctx.imageSmoothingEnabled=false;ctx.drawImage(horseEmblem,x,y,w,h);ctx.fillStyle='#ffe5a2';ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillText(getLocale()==='en'?'Invulnerable Charge':'무적 돌격',x+w/2,y+h+15)}
 ctx.restore();
};

const regionTextures={};for(const name of ['sea','trenches']){const im=new Image();im.src='./terrain-'+name+'.webp?v=210';regionTextures[name]=im}
const terrainAlpsAtlas=new Image();terrainAlpsAtlas.src='./terrain-alps-atlas.webp?v=210';
// The no-op constructors only keep the import-stripped offline smoke harness
// inert; the hosted module always resolves the supplied Alps implementation.
const TerrainRendererSafe=typeof TerrainRenderer==='undefined'?class{draw(){}}:TerrainRenderer;
const MountainFieldSafe=typeof MountainField==='undefined'?class{constructor(){this.query=()=>[];this.step=()=>{};this.draw=()=>{}}}:MountainField;
const terrainAlpsRenderer=new TerrainRendererSafe({atlas:terrainAlpsAtlas,detail:.72,tileSize:768});
const zeeWaterTile=new Image();zeeWaterTile.src='./terrain-zeebrugge-water189.webp?v=212';
const zeeHarborAtlas=new Image();zeeHarborAtlas.src='./zeebrugge-harbor-atlas189.webp?v=212';
const ZEE_CELLS=Object.freeze({lighthouse:[36,62,147,168],breakwater:[202,123,167,76],dock:[411,117,171,105],crane:[631,75,99,149],freighter:[148,319,239,84],patrol:[65,326,31,112],coal:[438,348,113,64],buoy1:[612,307,29,55],buoy3:[703,323,24,38]});
const terrainKeys=['rural','sea','trenches','burning','city','sky','alps','zeebrugge'];
const _ruralTerrain=terrain;
function drawSeamlessRural(cx,cy,W,H){
 ctx.fillStyle='#758461';ctx.fillRect(0,0,W,H);const worldX=cx-W/2,worldY=cy-H/2;
 // Broad, continuous field strips: no grid cells, no repeated tile boundary.
 for(let band=-2;band<7;band++){const y=band*150-worldY%150-80;ctx.fillStyle=band%3===0?'#80906c':band%3===1?'#71805d':'#7a8965';ctx.beginPath();ctx.moveTo(-40,y);for(let x=-40;x<W+80;x+=70)ctx.lineTo(x,y+Math.sin((worldX+x)*.003+band)*18);ctx.lineTo(W+50,y+128);for(let x=W+50;x>-60;x-=70)ctx.lineTo(x,y+128+Math.sin((worldX+x)*.003+band)*18);ctx.closePath();ctx.fill()}
 ctx.fillStyle='#4f6b42';for(let i=0;i<26;i++){const x=(Math.sin((worldY+i*83)*.013)*.5+.5)*(W+80)-40,y=(i*97-worldY*.18)%(H+80)-40;ctx.fillRect(x,y,11,7);ctx.fillRect(x+4,y-4,7,6)}
 ctx.strokeStyle='#5d7d78';ctx.lineWidth=18;ctx.beginPath();for(let y=-30;y<H+40;y+=16){const wy=worldY+y,x=W*.61+Math.sin(wy*.0024)*88+Math.sin(wy*.006)*18;y<0?ctx.moveTo(x,y):ctx.lineTo(x,y)}ctx.stroke();ctx.strokeStyle='#a2b19377';ctx.lineWidth=2;ctx.stroke();
}
function paintZeebrugge(cx,cy,W,H){
 const camera={x:cx-W/2,y:cy-H/2};
 if(zeeWaterTile.naturalWidth){const t=zeeWaterTile.naturalWidth,sx=Math.floor(camera.x/t)-1,sy=Math.floor(camera.y/t)-1,ex=Math.ceil((camera.x+W)/t),ey=Math.ceil((camera.y+H)/t);for(let ty=sy;ty<=ey;ty++)for(let tx=sx;tx<=ex;tx++)ctx.drawImage(zeeWaterTile,tx*t-camera.x,ty*t-camera.y)}
 else terrainAlpsRenderer.draw(ctx,{key:'sea',camera,width:W,height:H});
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
function paintRegion(region,cx,cy,width=W,height=H){
 const W=width,H=height;
 if(region===7){paintZeebrugge(cx,cy,W,H);return;}
 if(region>=0&&region<terrainKeys.length){
  terrainAlpsRenderer.draw(ctx,{key:terrainKeys[region],camera:{x:cx-W/2,y:cy-H/2},width:W,height:H});
  if(region===6&&game?.alpsMountains)game.alpsMountains.draw(ctx,{camera:{x:cx-W/2,y:cy-H/2},width:W,height:H});
  if(region===3)paintTrenchHellOverlay(cx,cy,W,H);
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
 ctx.save();ctx.font='12px monospace';ctx.textAlign='left';ctx.fillStyle='#f1edd0';ctx.fillText((game.mode==='campaign'?game.stage.region:['전원 지대','아드리아해','참호 전선','포화의 참호전선','도심','고공 전역','알프스 산맥','제브뤼헤 군항'][game.region||0])+' · 비행 '+((game.distance||0)/1000).toFixed(1)+' km',14,H-14);
 for(const e of game.enemies){if(!e.bossPilot)continue;const x=e.x-game.x+W/2,y=e.y-game.y+H/2;ctx.textAlign='center';ctx.fillStyle='#ffcf86';ctx.fillText(e.name,x,y-58)}
 if(game.wingBoost>0){ctx.strokeStyle='#f5e7ad';for(const a of game.allies){const x=a.x-game.x+W/2,y=a.y-game.y+H/2;ctx.beginPath();ctx.arc(x,y,28,0,Math.PI*2);ctx.stroke()}}
 ctx.restore();
};

const _drawBomberSupport=draw;
draw=t=>{
 _drawBomberSupport(t);if(!game)return;
 ctx.save();
 for(const b of game.friendlyBombers||[]){const x=b.x-game.x+W/2,y=b.y-game.y+H/2,im=fieldArt[b.airframe];if(!im?.naturalWidth)continue;const w=150,h=w*im.naturalHeight/im.naturalWidth;
  drawFieldArt(b.airframe,x+14,y+18,w,h,b.a+Math.PI/2,.25);drawFieldArt(b.airframe,x,y,w,h,b.a+Math.PI/2,1);
  ctx.fillStyle='#b4f4dd';ctx.font='12px monospace';ctx.textAlign='center';ctx.fillText(getLocale()==='en'?'Friendly Bombers':'아군 폭격대',x,y-h/2-12);
 }
 for(const b of game.friendlyBombs||[]){const p=1-b.life/b.maxLife,x=b.sx+(b.x-b.sx)*p-game.x+W/2,y=b.sy+(b.y-b.sy)*p-game.y+H/2;
  drawEquipment(ctx,'rocket',x,y,Math.atan2(b.y-b.sy,b.x-b.sx)+Math.PI/2,38);
  ctx.strokeStyle='#a2eddb70';ctx.lineWidth=1;ctx.beginPath();ctx.arc(b.x-game.x+W/2,b.y-game.y+H/2,22,0,Math.PI*2);ctx.stroke();
 }
 ctx.restore();
};

// Persistent, compact inventory above touch controls; one badge per legendary.
let legendarySignature='';
const _hud51=hud;
const RELIC_COOLDOWNS={grunkreuz:{rem:g=>g.grunkreuzOn>0?0:(g.grunkreuzOff??0),iv:()=>LEGENDARY_DEFENSE_BALANCE.grunkreuzOffDuration},rankinShell:{rem:g=>g.rankinTimer??0,iv:()=>LEGENDARY_DEFENSE_BALANCE.rankinInterval},kaiserFog:{rem:g=>g.kaiserFogTimer??0,iv:()=>LEGENDARY_DEFENSE_BALANCE.fogInterval},motorCannon:{rem:g=>g.motorCannonTimer??0,iv:g=>g.ordnanceInterval?g.ordnanceInterval(LEGENDARY_BALANCE.motorCannonInterval):LEGENDARY_BALANCE.motorCannonInterval}};
const soloRelicRefs=[],coopRelicRefs={p1:[],p2:[]};
const BOSS_CUTIN_ART={'paris-gun':'boss-art-paris-gun.webp?v=257&b=216','lincomparable':'boss-art-lincomparable.webp?v=257&b=216','sms-stuttgart':'boss-art-sms-stuttgart.webp?v=257&b=216','hms-zubian':'boss-art-hms-zubian.webp?v=257&b=216','a7v-flak':'boss-art-a7v-flak.webp?v=257&b=216','mark-v-cruiser':'boss-art-mark-v-cruiser.webp?v=257&b=216','livens-flame-projector':'boss-art-livens-flame-projector.webp?v=257&b=216','minenwerfer-battery':'boss-art-minenwerfer-battery.webp?v=257&b=216','drachen-net':'boss-art-drachen-net.webp?v=257&b=216','london-apron':'boss-art-london-apron.webp?v=257&b=216','zeppelin-l70':'boss-art-zeppelin-l70.webp?v=257&b=216','hma23':'boss-art-hma23.webp?v=257&b=216','gik':'boss-art-gik.webp?v=257&b=216','ca4':'boss-art-ca4.webp?v=257&b=216','armored-harbor-fortress':'boss-art-armored-harbor-fortress.webp?v=257&b=216'};;
function setBossCutin(imgSrc,name,kicker,detail){$('bossCutinImg').src=imgSrc;$('bossCutinImg').alt=name;$('bossCutinKicker').textContent=kicker;$('bossCutinName').textContent=name;$('bossCutinDetail').textContent=detail||''}
function stageBossCutinCheck(){const sb=game?.stageBoss?.stages;if(sb&&sb.phase==='boss'&&sb.bossId&&sb.bossId!==lastStageBossId){lastStageBossId=sb.bossId;const nm=BOSS_CATALOG[sb.bossId]?.name||sb.bossId;setBossCutin(BOSS_CUTIN_ART[sb.bossId]||'',nm,'AREA BOSS · 지역 보스','');$('bossWarnSub').textContent=nm+' · AREA BOSS INBOUND';show('bossWarning');setTimeout(()=>show('bossWarning',false),1600);bossCardFrom=performance.now()+1400;bossCutinUntil=bossCardFrom+2600;sfx('bossSting');setTimeout(()=>sfx('bossSting'),620)}}
function paintRelicBadge(rb){const c=rb.ctx,spec=RELIC_COOLDOWNS[rb.id],owner=rb.owner();let prog=1;if(spec&&owner){const iv=spec.iv(owner)||1;prog=Math.max(0,Math.min(1,1-Math.max(0,spec.rem(owner))/iv))}c.clearRect(0,0,48,48);if(prog>=1){drawGameIcon(c,rb.key,24,24,42);return}c.globalAlpha=.32;drawGameIcon(c,rb.key,24,24,42);c.globalAlpha=1;c.save();c.beginPath();c.moveTo(24,24);c.arc(24,24,26,-Math.PI/2,-Math.PI/2+prog*Math.PI*2);c.closePath();c.clip();drawGameIcon(c,rb.key,24,24,42);c.restore();if(prog>0&&prog<1){c.save();c.strokeStyle='#ffe9a8';c.lineWidth=2;c.beginPath();c.arc(24,24,21,-Math.PI/2,-Math.PI/2+prog*Math.PI*2);c.stroke();c.restore()}}
function relicCooldownTick(){for(const rb of soloRelicRefs)if(RELIC_COOLDOWNS[rb.id])paintRelicBadge(rb);for(const arr of Object.values(coopRelicRefs))for(const rb of arr)if(RELIC_COOLDOWNS[rb.id])paintRelicBadge(rb)}
hud=()=>{_hud51();relicCooldownTick();const held=UPGRADES.filter(u=>u.legendary&&game.upgrades[u.id]);const signature=held.map(u=>u.id).join(',');if(signature!==legendarySignature){legendarySignature=signature;$('legendaryInventory').replaceChildren();soloRelicRefs.length=0;for(const u of held){const item=document.createElement('button');item.type='button';item.className='legendary-badge';item.setAttribute('aria-label',reinforcementName(u,game,PLANES)+' · '+cleanDescription(u.desc));const tip=document.createElement('span');tip.className='legendary-tip156';tip.textContent=reinforcementName(u,game,PLANES)+' · '+cleanDescription(u.desc);const c=document.createElement('canvas');c.width=48;c.height=48;const key=u.id==='ironCross'?'ironCross-'+(PLANES[game.plane]?.faction==='entente'?'entente':'central'):u.id;soloRelicRefs.push({id:u.id,key,ctx:c.getContext('2d'),owner:()=>game});paintRelicBadge(soloRelicRefs[soloRelicRefs.length-1]);item.append(c,tip);item.onclick=e=>{e.preventDefault();item.classList.toggle('tip156')};item.onblur=()=>item.classList.remove('tip156');$('legendaryInventory').append(item)}}};
const _draw51=draw;
draw=t=>{_draw51(t);if(!game)return;ctx.save();
 for(const w of game.divingSquadron||[]){const x=w.x-game.x+W/2,y=w.y-game.y+H/2;planeSprite(ctx,x+12,y+18,w.a, 'se5a',1,false,true);planeSprite(ctx,x,y,w.a,'se5a',1)}
 if(game.upgrades.redScarf){const a=game.a;ctx.strokeStyle='#d6f6efa8';ctx.lineWidth=2;for(const offset of [-29,-20,20,29]){const x=W/2-Math.sin(a)*offset,y=H/2+Math.cos(a)*offset,len=58+Math.sin(t*15+offset)*18;ctx.beginPath();ctx.moveTo(x-Math.cos(a)*24,y-Math.sin(a)*24);ctx.lineTo(x-Math.cos(a)*len,y-Math.sin(a)*len);ctx.stroke()}}
 ctx.restore();
};
iconsReady.then(()=>{legendarySignature='';for(const ref of choiceIconRefs)drawUpgradeIcon(ref.canvas,ref.id,ref.owner||game);const icon=$('pilotSkillIcon');drawGameIcon(icon.getContext('2d'),'command',24,24,44);for(const id of ['p1','p2'])coopRelicSignatures[id]='';if(game){hud();if(game.mode==='coop2')coopHud()}});
const _roster51=roster;
roster=()=>{_roster51();const icon=$('pilotSkillIcon');icon.getContext('2d').clearRect(0,0,48,48);drawGameIcon(icon.getContext('2d'),'command',24,24,44)};

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

const _duoSupport61=drawSupport;drawSupport=()=>{_duoSupport61();if(!game?.crossfireFlash)return;ctx.save();ctx.fillStyle='#ffe8aa';for(let i=0;i<4;i++){const a=game.a+i*Math.PI/2;ctx.save();ctx.translate(W/2+Math.cos(a)*29,H/2+Math.sin(a)*29);ctx.rotate(a);ctx.fillRect(0,-2,15,4);ctx.restore()}ctx.restore()};

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
events=()=>{const arrivals=game?.events.filter(e=>e.type==='bossArrival')||[];_bossEvents81();if(!arrivals.length)return;const last=arrivals.at(-1),detailKey=`warning.aceDetail.${last.pilot}`,detail=t(detailKey);if(arrivals.length>1){$('bossName').textContent=t('warning.aceGroup');$('bossArrivalDetail').textContent=t('warning.aceApproach',{count:arrivals.length})}else $('bossArrivalDetail').textContent=detail===detailKey?t('warning.airspace'):detail};
const _legendaryDraw81=draw;
draw=t=>{
 _legendaryDraw81(t);if(!game)return;
 const point=(x,y)=>[x-game.x+W/2,y-game.y+H/2];ctx.save();
 for(const m of game.mines)if(m.legendary){const [x,y]=point(m.x,m.y);ctx.strokeStyle='#ffd56f99';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,25+Math.sin(t*6)*3,0,Math.PI*2);ctx.stroke()}
 for(const b of game.bullets)if(b.motorCannon||b.cow37){const [x,y]=point(b.x,b.y);drawCannonProjectile(ctx,b,x,y)}
 drawBattlefieldFire(ctx,game,point);
 for(const e of game.enemyAirshipPasses||[]){const[x,y]=point(e.x,e.y);drawZeppelin(ctx,x,y,e.a,.72,false,'central');}
 ctx.restore();
};

// PC cooperative mode is an explicit entrypoint, not another legacy draw/update wrapper.
function renderCoopSetup(){
 const on=selectedMode==='coop2';$('nicknameLabel').textContent=on?'P1 닉네임':'랭킹 닉네임';document.body.classList.toggle('coop-selected',on);show('coopMode',coopAvailable);show('coopPanel',on);$('coopMode').classList.toggle('active',on);$('coopMode').setAttribute('aria-pressed',on);
 if(!on)return;if(PILOTS[coopPilot2]?.faction!==faction)coopPilot2=pilot;if(pilot==='baron')coopBaronAircraft=baronAircraft;
 const select=$('coopPilot2');select.replaceChildren();for(const [id,p] of Object.entries(PILOTS).filter(([,p])=>p.faction===faction)){const option=document.createElement('option');option.value=id;option.textContent=p.name;select.append(option)}select.value=coopPilot2;select.disabled=!!game;$('coopNickname2').disabled=!!game;
 $('coopP1Summary').textContent=t('coop.teamSummary',{pilot:pilotName(pilot,PILOTS[pilot].name),team:t('coop.team',{faction:t(faction==='central'?'faction.central':'faction.entente')})});
 $('coopPortrait2').src=portraitSources[coopPilot2]||'portrait-'+coopPilot2+'.webp?v=214&b=219';$('coopPortrait2').alt=PILOTS[coopPilot2].name;$('coopPortrait2').style.setProperty('--pilot-choice-scale',choicePortraitScale(coopPilot2));
 $('coopSkill2').textContent=pilotLoadout(coopPilot2,coopSelectedPlane(coopPilot2)).skill;const c=$('coopPlane2').getContext('2d');c.clearRect(0,0,144,160);planeSprite(c,72,76,-Math.PI/2,aircraftKey(coopSelectedPlane(coopPilot2),false,coopPilot2),1/.54);
 const aircraft=$('coopAircraft103');aircraft.replaceChildren();for(const key of coopPilot2==='baron'?['fokker','baron_albatros']:[coopPlane(coopPilot2)]){const option=document.createElement('option');option.value=key;option.textContent=displayAircraftName(coopPilot2,key);aircraft.append(option)}aircraft.value=coopSelectedPlane(coopPilot2);aircraft.disabled=!!game||coopPilot2!=='baron';aircraft.title=coopPilot2==='baron'?'리히트호펜의 삼엽기 / 알바트로스 D.III':'파일럿별 역사 지정 기체';aircraft.onchange=()=>{if(game||coopPilot2!=='baron')return;coopBaronAircraft=aircraft.value==='baron_albatros'?'baron_albatros':'fokker';renderCoopSetup()};
 $('start').textContent='두 기체 함께 출격';
}
function highlightCoopChoice(index=0){const buttons=[...$('modalActions').querySelectorAll('button')];for(const [i,b] of buttons.entries())b.classList.toggle('coop-current',i===index);buttons[index]?.focus({preventScroll:true})}
function showCoopUpgrade(item){if(game?.mode!=='coop2'||game.state!=='upgrade'||game.activeUpgrade!==item)return;const p=game.player(item.playerId);coopInput.clear();coopInput.itemId=item.id;coopInput.selection=0;document.body.classList.toggle('coop-p2-choice',p.id==='p2');modal('COOP · '+p.id.toUpperCase()+' · LV. '+item.level,t('coop.choice.title',{player:p.id.toUpperCase()+' '+p.nickname}),t('coop.choice.text',{pilot:pilotName(p.pilot,PILOTS[p.pilot].name),controls:t(p.id==='p1'?'coop.choice.p1':'coop.choice.p2'),count:game.pendingLevelUps.length}),item.choices.map(u=>({owner:p,upgradeId:u.id,rarity:u.rarity,label:'['+rarityName(u.rarity)+'] '+u.name,desc:upgradeDescription(u.id,u.rarity,p),run:()=>chooseCoop(item.id,u.id)})));highlightCoopChoice(0)}
function chooseCoop(itemId,id){if(game?.mode!=='coop2')return;coopInput.clear();if(!game.chooseUpgrade(itemId,id))return;last=performance.now();sound(750,.12);if(game.state==='upgrade')coopEvents();else if(game.state==='paused')showCoopPause();else{show('modal',false);document.body.classList.remove('coop-p2-choice')}}
function showCoopPause(){showBuildPause151()}
function pauseCoop(){if(game?.mode!=='coop2'||game.state==='lost'||game.state==='upgrade')return;coopInput.clear();if(game.state==='paused'){resume();return}game.pause();showCoopPause()}
function coopHud(){
 for(const p of game.players){const c=$(p.id+'Gun113');c.title=p.weapon.name;c.getContext('2d').clearRect(0,0,72,44);drawGameIcon(c.getContext('2d'),p.cow37?'cow37':'gun-'+p.weapon.gunProfile,36,22,70);}
 const g=game;$('coopClock').textContent=String(Math.floor(g.t/60)).padStart(2,'0')+':'+String(Math.floor(g.t%60)).padStart(2,'0');$('coopKills').textContent=t('coop.kills',{priority:g.priorityKills,total:g.kills});let localBest=0;try{localBest=Number(localStorage.getItem(COOP_RECORD_KEYS.best))||0}catch{}$('coopBest').textContent=t('coop.best',{score:Math.max(localBest,g.priorityKills)});
 for(const p of g.players){const id=p.id,down=p.status==='downed';$(id+'HudName').textContent=id.toUpperCase()+' · '+p.nickname+' / '+pilotName(p.pilot,PILOTS[p.pilot].name);const ammo=p.unlimitedAmmo?'∞':p.ammo.join(' / '),cooldown=p.cooldown>0?p.cooldown.toFixed(1)+'s':t('coop.ready'),special=p.specialAmmoStatus?.();$(id+'HudStats').textContent=down?t('coop.downed',{seconds:p.respawnRemaining.toFixed(1),level:p.level}):t('coop.stats',{hp:Math.ceil(p.hp),maxHp:Math.round(p.maxHp),level:p.level,ammo,reload:p.reloadTime>0?t('coop.reload',{seconds:p.reloadTime.toFixed(1)}):'',special:special?t('coop.special',{name:special.name,count:special.count}):'',active:cooldown,maneuver:p.evadeCooldown>0?p.evadeCooldown.toFixed(1)+'s':t('coop.ready')});$(id+'HpBar').style.width=100*p.hp/p.maxHp+'%';
  const held=UPGRADES.filter(u=>u.legendary&&p.upgrades[u.id]),signature=g.runId+':'+held.map(u=>u.id).join(',');if(coopRelicSignatures[id]!==signature){coopRelicSignatures[id]=signature;coopRelicRefs[id].length=0;$(id+'Relics').replaceChildren();for(const u of held){const icon=document.createElement('canvas');icon.width=48;icon.height=48;icon.title=reinforcementName(u,p,PLANES)+' · '+cleanDescription(u.desc);icon.setAttribute('aria-label',reinforcementName(u,p,PLANES));const key=u.id==='ironCross'?'ironCross-'+(PLANES[p.plane]?.faction==='entente'?'entente':'central'):u.id;coopRelicRefs[id].push({id:u.id,key,ctx:icon.getContext('2d'),owner:()=>p});paintRelicBadge(coopRelicRefs[id][coopRelicRefs[id].length-1]);$(id+'Relics').append(icon)}}
  show(id+'Cutin',!down&&g.state!=='lost'&&g.t<coopCutinEnds[id]);
 }
 if(g.t>coopToastUntil||g.state==='lost')show('toast',false);
}
function coopEvents(){
 const g=game;if(g?.mode!=='coop2')return;
 const arrivalCount=g.events.filter(e=>e.type==='bossArrival').length;
 for(const e of g.events.splice(0)){
  if(e.type==='regionTransition'){beginRegionTransition(e.text,e.region);continue}
  if(e.type==='upgrade'){showCoopUpgrade(e.item);sfx('levelup');continue}
  if(e.type==='end'){sfx(g.state==='won'||g.result?.won?'victory':'defeat');showCoopResult(g);continue}
  if(e.type==='skill'&&e.ownerId){const p=g.player(e.ownerId),id=p.id;coopCutinEnds[id]=g.t+2.1;$(id+'CutinPortrait').src=portraitSources[p.pilot]||'portrait-'+p.pilot+'.webp?v=214&b=219';$(id+'CutinPortrait').alt=PILOTS[p.pilot].name;$(id+'CutinName').textContent=id.toUpperCase()+' · '+p.nickname;$(id+'CutinSkill').textContent=pilotLoadout(p.pilot,p.plane).skill;sfx('skill')}
  if(e.type==='bossArrival'){bossArrivalUntil=g.t+4.5;bossCardFrom=performance.now();$('bossName').textContent=arrivalCount>1?t('warning.aceGroup'):e.name;$('bossPortrait').src=portraitSources[e.pilot]||'portrait-'+e.pilot+'.webp?v=214&b=219';$('bossArrivalDetail').textContent=arrivalCount>1?t('warning.aceApproach',{count:arrivalCount}):t('coop.aceCoop');bossCutinUntil=bossCardFrom+2600;setBossCutin($('bossPortrait').src,$('bossName').textContent,'ENEMY ACE · 적 에이스',$('bossArrivalDetail').textContent);setBgmMode('boss')}
  if(['wave','downed','revived','flak','bombWarning'].includes(e.type)){$('toast').textContent=runtimeEventText(e.text);show('toast');coopToastUntil=g.t+2.2}
  if(e.type==='shot'&&performance.now()-lastShotSound>100){lastShotSound=performance.now();sfx('shot')}if(e.type==='hit')sfx('hit');if(e.type==='kill')sfx(e.text==='balloon'?'balloon':'kill');if(e.type==='reload')sfx('reload');if(e.type==='loaded')sfx('loaded');if(e.type==='pickup'&&performance.now()-lastPickupSound>220){lastPickupSound=performance.now();sfx(e.text==='heal'?'heal':'pickup')}
 }
}
function coopRankingText(rows){return rows.length?rows.map((r,i)=>`${['🥇','🥈','🥉'][i]||i+1+'.'} ${r.players.map(p=>p.name+' ('+pilotName(p.pilot,PILOTS[p.pilot]?.name||p.pilot)+')').join(' + ')}\n${t('coop.team',{faction:t(r.faction==='central'?'faction.central':'faction.entente')})} · ${t('coop.result.summary',{score:r.score,seconds:r.durationSeconds})}`).join('\n\n'):t('coop.ranking.empty')}
function showSoloResult(run){
 best=Math.max(best,run.priorityKills||0);try{localStorage.setItem('headon-priority-best-161',best)}catch{}
 $('record').textContent=t('record.best',{score:best});showEndNickname(run,false);
}
function showEndNickname(run,coop){
 keys={};coopInput.clear();joy=null;show('touch',false);show('skillCutin',false);
 let submitted=false;const players=coop?run.players:[{pilot:run.pilot}];
 const detail=players.map((p,i)=>(coop?'P'+(i+1)+' · ':'')+pilotName(p.pilot,PILOTS[p.pilot].name)).join(' + ')+
 '\n'+t('result.detail',{kills:run.priorityKills||0,seconds:Math.floor(run.t)});
 const inputs=[];
 const submit=()=>{
  if(submitted||game!==run)return;submitted=true;
  if(coop){run.players.forEach((p,i)=>p.nickname=inputs[i].value.trim().slice(0,12)||'P'+(i+1));saveCoopResult(run);}
  else{nickname=inputs[0].value.trim().slice(0,12)||t('pilot.anonymous');const rows=saveRanking();
   modal('SORTIE COMPLETE','출격 기록',detail+'\n\n'+t('result.local'),[{label:t('sortie.retry'),run:start},{label:t('sortie.pilotChange'),run:returnHangar}]);renderRankingMedals(rows,t('result.local')+' · '+t('ranking.priority'));syncServerRanking();}
 };
 modal('SORTIE COMPLETE','출격 종료 · 랭킹 등록',detail+'\n'+t('result.nicknamePrompt'),
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
function showCoopResult(run){return showEndNickname(run,true)}
function saveCoopResult(run){coopInput.clear();show('skillCutin',false);const record=coopRecord(run),rows=saveCoopLocal(localStorage,record);modal('COOP SORTIE LOST',t('coop.result.title'),`${record.players.map(p=>p.name).join(' + ')}\n${t('coop.result.summary',{score:record.score,seconds:record.durationSeconds})}\n\n${t('coop.result.serverSaving')}\n${t('coop.result.local')}\n${coopRankingText(rows)}`,[{label:t('coop.result.retry'),run:start},{label:t('coop.result.setup'),run:returnHangar}]);syncCoopRanking(run,record)}
async function syncCoopRanking(run,record){try{const response=await fetch('/api/rankings',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(record)});if(!response.ok)throw Error();const rows=await response.json();if(game===run&&game.state==='lost')$('modalText').textContent=`${record.players.map(p=>p.name).join(' + ')}\n${t('coop.result.summary',{score:record.score,seconds:record.durationSeconds})}\n\n${t('coop.result.server')}\n${coopRankingText(rows)}`}catch{if(game!==run||game.state!=='lost')return;$('modalText').textContent=$('modalText').textContent.replace(t('coop.result.serverSaving'),t('coop.result.saveFailed'));const retry=document.createElement('button');retry.className='primary';retry.textContent=t('coop.result.retrySave');retry.onclick=()=>{retry.remove();syncCoopRanking(run,record)};$('modalActions').append(retry)}}
async function showCoopLeaderboard(){if(game)return;modal('COOP RANKING',t('coop.ranking.title'),t('ranking.loading'),[{label:t('coop.result.setup'),run:()=>show('modal',false)}]);try{const response=await fetch('/api/rankings?mode=coop2');if(!response.ok)throw Error();const rows=await response.json();if(!game)$('modalText').textContent=coopRankingText(rows)}catch{if(!game)$('modalText').textContent=t('ranking.loadFailed')}}
$('coopMode').onclick=()=>{if(game||!coopAvailable)return;selectedMode='coop2';plane=pilotPlane(pilot);roster()};
$('coopPilot2').onchange=()=>{if(game)return;coopPilot2=$('coopPilot2').value;renderCoopSetup()};
$('coopPause').onclick=pauseCoop;$('coopRanking').onclick=showCoopLeaderboard;
window.addEventListener('focus',()=>{if(game?.mode==='coop2'&&game.state!=='playing')coopInput.reset()});
renderCoopSetup();

// Revision 91 tactical overlays: tail-lock feedback and temporary ammunition belts.
function drawTailMarker(c,target,player,point,color='#ffd36f'){
 if(!target||!player)return;const [x,y]=point(target.x,target.y),progress=player.tailLockFraction?.()||0,locked=!!player.tailLocked;c.save();c.strokeStyle=locked?'#ff7258':color;c.lineWidth=locked?3:2;c.beginPath();c.arc(x,y,36,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);c.stroke();for(const side of [-1,1]){c.beginPath();c.moveTo(x+side*30,y-17);c.lineTo(x+side*38,y-17);c.lineTo(x+side*38,y-7);c.stroke()}c.fillStyle=locked?'#fff0c0':'#eadcae';c.font='bold 12px sans-serif';c.textAlign='center';c.fillText(locked?t('hud.tailAdvantage',{multiplier:TAILING_BALANCE.damageMultiplier.toFixed(2)}):t('hud.rearAim',{percent:Math.round(progress*100)}),x,y-45);c.restore();
}
const _tacticalDraw91=draw;
draw=t=>{_tacticalDraw91(t);if(!game||game.mode==='coop2')return;const point=(x,y)=>[x-game.x+W/2,y-game.y+H/2];ctx.save();for(const d of game.drops||[])if(!d.dead&&d.specialAmmo){const [x,y]=point(d.x,d.y),spec=SPECIAL_AMMO[d.specialAmmo];ctx.strokeStyle=(spec?.color||'#ffd36f')+'bb';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,24+Math.sin(t*6)*3,0,Math.PI*2);ctx.stroke();drawSpecialAmmoIcon(ctx,d.specialAmmo,x,y+Math.sin(t*4)*2,42)}for(const b of game.bullets||[])if(b.life>0&&b.specialAmmo){const [x,y]=point(b.x,b.y);ctx.strokeStyle=b.specialColor;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-b.vx*(b.specialAmmo==='tracer'?.032:.02),y-b.vy*(b.specialAmmo==='tracer'?.032:.02));ctx.stroke()}const target=game.enemies?.find(e=>e.tailId===game.tailTargetId&&e.hp>0);drawTailMarker(ctx,target,game,point);ctx.restore()};
const _tacticalHud91=hud;
hud=()=>{_tacticalHud91();if(!game||game.mode==='coop2')return;const ammo=game.specialAmmoStatus?.();if(ammo){$('ammoLabel').textContent+=' · '+ammo.name;$('ammoCount').textContent+=' · '+t('hud.specialAmmo',{count:ammo.count})}};
const _tacticalEvents91=events;
events=()=>{const ammo=(game?.events||[]).filter(e=>e.type==='ammo');_tacticalEvents91();if(ammo.length){$('toast').textContent=ammo.at(-1).text+' · '+t('hud.defaultAmmoFirst');show('toast');toastUntil=performance.now()+2600;sfx('pickup')}};
const _tacticalCoopEvents91=coopEvents;
coopEvents=()=>{const ammo=(game?.events||[]).filter(e=>e.type==='ammo');_tacticalCoopEvents91();if(ammo.length){const lastAmmo=ammo.at(-1);$('toast').textContent=(lastAmmo.ownerId?.toUpperCase()||t('ranking.team'))+' · '+lastAmmo.text;show('toast');coopToastUntil=game.t+2.6;sfx('pickup')}};

// Development-only fixture controls are never loaded by the unbundled hosted app.
if(import.meta.env?.DEV&&new URLSearchParams(location.search).has('bossqa'))import('../tests/stageboss-browser94.js').then(({installBossQA})=>installBossQA({getGame:()=>game,reset:(team,mode)=>{if(game)returnHangar();faction=team;pilot=team==='central'?'baron':'fonck';coopPilot2=pilot;selectedMode=mode;plane=pilotPlane(pilot);start();},draw:()=>{if(game.mode==='coop2'){coopEvents();coopHud();}else{events();hud();}if(game.mode==='coop2')drawCoop(ctx,game,W,H,{terrain:(x,y,w,h)=>paintRegion(game.worldRegion(),x,y,w,h),drawZeppelin,drawFieldArt,fieldArt});else draw(ambient);drawStageBoss(ctx,game,W,H,{drawZeppelin,drawFieldArt,layer:'hazards'});updateStageBossHud(game);}}));

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
  if(p.kaiserFogTime>0){const phase=(p.kaiserFogTime||0)*2.4;c.save();c.globalCompositeOperation='source-over';for(let i=0;i<9;i++){const a=i*2.399+phase,r=22+(i%3)*18,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r,rr=28+(i%4)*7,fade=Math.min(1,p.kaiserFogTime/.45);const grad=c.createRadialGradient(px,py,2,px,py,rr);grad.addColorStop(0,`rgba(203,210,196,${.22*fade})`);grad.addColorStop(.62,`rgba(151,165,156,${.15*fade})`);grad.addColorStop(1,'rgba(110,125,121,0)');c.fillStyle=grad;c.beginPath();c.arc(px,py,rr,0,Math.PI*2);c.fill()}c.strokeStyle='#d9d5ad66';c.lineWidth=1;c.beginPath();c.arc(x,y,54+Math.sin(phase*4)*4,0,Math.PI*2);c.stroke();c.restore()}
  if(p.rankinFlash>0){const fade=Math.min(1,p.rankinFlash/.3),back=p.a+Math.PI;c.save();c.translate(x,y);c.rotate(back);c.globalAlpha=fade;c.strokeStyle='#ded9c2';c.lineWidth=2;c.beginPath();c.arc(0,0,52,-1.75,1.75);c.stroke();c.fillStyle='#efe7c9';for(let i=-4;i<=4;i++){const a=i*.24,d=58+Math.abs(i)*5;c.fillRect(Math.cos(a)*d-2,Math.sin(a)*d-1,5,2)}c.restore()}
 }
}

// McCudden may discard one reinforcement row per level-up draft. The engine
// owns eligibility and consumption so reopening the modal cannot restore it.
const modalBeforeLegendaryReroll115=modal;
modal=(tag,title,text,buttons)=>{
 modalBeforeLegendaryReroll115(tag,title,text,buttons);
 if(!game||game.state!=='upgrade'||buttons.length!==3||!buttons.every(b=>b.upgradeId))return;
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
 const image=new Image();image.src=`./ranking-${side}-${rank}.webp?v=210`;return [`${side}-${rank}`,image];
})));
const aircraftIronCrossImage=new Image();aircraftIronCrossImage.src='./aircraft-iron-cross.svg?v=210';
const aircraftRoundelImage=new Image();aircraftRoundelImage.src='./aircraft-roundel.svg?v=210';
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
const highTerrainProfile={rural:{cell:0,base:'#424b3b'},sea:{cell:1,base:'#254555',strength:.46},trenches:{cell:2,base:'#4c443b'},burning:{cell:9,base:'#433d37',strength:.57},sky:{cell:3,base:'#3d5367'},city:{cell:4,base:'#454746'},alps:{cell:5,base:'#414e56'},zeebrugge:{cell:1,base:'#183e50'}};
TerrainRendererSafe.prototype.tile=function(key){
 if(this.tiles.has(key))return this.tiles.get(key);const p=highTerrainProfile[key]||highTerrainProfile.rural,c=this.canvasFactory(512,512),g=c.getContext('2d');g.fillStyle=p.base;g.fillRect(0,0,512,512);
 if(this.atlas&&(this.atlas.naturalWidth||this.atlas.width)){const aw=this.atlas.naturalWidth||this.atlas.width,ah=this.atlas.naturalHeight||this.atlas.height,col=p.cell%5,row=Math.floor(p.cell/5),x0=Math.round(col*aw/5),x1=Math.round((col+1)*aw/5),y0=Math.round(row*ah/2),y1=Math.round((row+1)*ah/2),inset=3;g.globalAlpha=p.strength??.97;g.imageSmoothingEnabled=true;g.drawImage(this.atlas,x0+inset,y0+inset,x1-x0-inset*2,y1-y0-inset*2,0,0,512,512);g.globalAlpha=1;}
 this.tiles.set(key,c);return c;
};terrainAlpsRenderer.setDetail?.(1);terrainAlpsRenderer.tiles?.clear?.();

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
const hudWithRefinedFactionMark120=hud;hud=()=>{hudWithRefinedFactionMark120();drawRefinedFactionMark120(durabilityMark.getContext('2d'),PLANES[game?.plane||plane]?.faction)};

// The hangar is revealed only after every portrait, aircraft and icon used by
// the current build is ready. This prevents the retired sheets from flashing
// for a frame before the authored asset replaces them.
const bootAt=performance.now();
Promise.all([portraitsReady,aircraftReady,campaignArtReady,iconsReady]).then(()=>{
 const reveal=()=>{document.body.classList.add('assets-ready');roster();applyPilotPortrait('cutinPortrait')};
 const left=3400-(performance.now()-bootAt);left>0?setTimeout(reveal,left):reveal();
}).catch(()=>{document.body.classList.add('assets-ready');roster();});

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
function showBuildPause151(){
 modal('PAUSED','현재 빌드','ESC · 계속하기',[{label:'계속하기',run:resume},{label:'설정',run:showSettings151},{label:'전투 종료',run:returnHangar}]);$('modal').classList.add('build-modal151');
 const area=document.createElement('div');area.id='build151';
 const el=(tag,text,cls)=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e};
 for(const p of game.players||[game]){const section=el('section','');const rankedKills=game.mode==='coop2'?(game.priorityKills||0):(p===game?(game.priorityKills||0):(p.priorityKills??game.priorityKills??0));section.append(el('h3',(p.id?p.id.toUpperCase()+' · ':'')+PILOTS[p.pilot].name),el('p',displayAircraftName(p.pilot,p.plane)+' · '+String(Math.floor(game.t/60)).padStart(2,'0')+':'+String(Math.floor(game.t%60)).padStart(2,'0')+' · 랭킹 격추 '+rankedKills+'기 · LV. '+p.level,'build-meta151'));
 const grid=el('div','','build-stats151'),groups=new Map();for(const [key,[category,label,value]] of Object.entries(buildStats(p))){if(value==='+0%'||value==='+0 HP'||value==='미장착'||value==='0발')continue;let group=groups.get(category);if(!group){group=el('div','');group.append(el('b',category));groups.set(category,group);grid.append(group)}group.append(el('span',label+' '+value))}if(!grid.children.length)grid.append(el('span','기본 기체 능력치 적용 중'));section.append(grid);
 for(const [heading,test]of [['획득 강화',u=>!u.legendary&&!u.uniqueOnly],['고유 강화',u=>u.uniqueOnly],['SPECIAL EQUIPMENT',u=>u.legendary]]){const held=UPGRADES.filter(u=>p.upgrades[u.id]&&test(u));section.append(el('h4',heading));const chips=el('div','','build-chips151');if(!held.length)chips.append(el('span','없음','empty151'));for(const u of held)chips.append(el('span',reinforcementName(u,p,PLANES),'build-chip151 rarity-'+(u.legendary?'legendary':u.uniqueOnly?'unique':p.upgradeRarities?.[u.id]||'normal')));section.append(chips)}area.append(section);
 }$('modalText').after(area);
}
function showSettings151(){modal('SETTINGS',t('settings.title'),t('settings.paused'),[{label:muted?t('menu.soundOn'):t('menu.soundOff'),run:()=>{$('sound').click();showSettings151()}},{label:t('settings.back'),run:showBuildPause151}])}

if(import.meta.env?.DEV&&new URLSearchParams(location.search).has('reinforcementqa'))import('../tests/reinforcement-browser151.js?v=214').then(({installReinforcementQA})=>installReinforcementQA({getGame:()=>game,reset:(team,mode)=>{if(game)returnHangar();faction=team;pilot=team==='central'?'baron':'fonck';coopPilot2=pilot;selectedMode=mode;plane=pilotPlane(pilot);start()},pause:showBuildPause151,refresh:()=>{if(game.mode==='coop2'){coopEvents();coopHud()}else{events();hud()}updateStageBossHud(game)},pick:(items)=>{game.state='upgrade';choices=items;modal('QA · LIVE CHOICES','강화 선택','',items.map(pick=>{const u=UPGRADES.find(u=>u.id===pick.id);return{upgradeId:u.id,rarity:pick.rarity,label:u.name,desc:upgradeDescription(u.id,pick.rarity,game),run:()=>choose(u.id,pick.rarity)}}))}}));

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
const startWithCampaignGuard=start;start=()=>{normalizeSelectedMode();return startWithCampaignGuard()};
$('start').onclick=start;

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
hud=()=>{hudWithLocale();if(!game)return;const reloading=game.reloadTime>0;$('record').textContent=t('record.best',{score:String(best).padStart(3,'0')});$('ammoHud').dataset.status=reloading?t('hud.reloading'):t('hud.ammo');$('reload').textContent=reloading?t('hud.reloading'):'R';$('reload').setAttribute('aria-label',reloading?`${t('hud.reloading')} ${game.reloadTime.toFixed(1)}s`:t('hud.reload'));$('skillStatus').textContent=game.skillTime>0?t('active.running'):game.cooldown>0?t('active.wait',{seconds:game.cooldown.toFixed(1)}):t('active.ready');$('skillButtonText').textContent=t('active.label');$('skillButtonState').textContent=game.cooldown>0?`${Math.ceil(game.cooldown)}s`:t('coop.ready');$('maneuverButtonText').textContent=t('maneuver.label');$('maneuverButtonState').textContent=game.evadeCooldown>0?`${Math.ceil(game.evadeCooldown)}s`:t('coop.ready')};
const eventsWithLocale=events;
events=()=>{eventsWithLocale();if(getLocale()!=='en')return;if($('bossName').textContent==='적 에이스')$('bossName').textContent=t('warning.ace');if($('bossName').textContent==='에이스 편대 등장')$('bossName').textContent=t('warning.aceGroup');if($('bossArrivalDetail').textContent==='전투 공역 진입')$('bossArrivalDetail').textContent=t('warning.airspace')};
const startWithLocale=start;
start=()=>{const result=startWithLocale();if(game){$('missionLabel').textContent=game.mode==='campaign'?game.stage.title:t('status.inProgress');document.querySelector('.time small').textContent=game.mode==='campaign'?'Campaign':t('mode.endless')}return result};
const returnHangarWithLocale=returnHangar;
returnHangar=()=>{const result=returnHangarWithLocale();$('missionLabel').textContent=t('status.waiting');$('skillStatus').textContent=t('active.ready');return result};
function refreshLocale(){applyTranslations();fieldRecordLink.textContent=getLocale()==='en'?'Official Battle Record':'공식 전장 기록';$('sound').textContent=muted?t('menu.soundOff'):t('menu.soundOn');$('sound').setAttribute('aria-label',muted?t('menu.soundEnable'):t('menu.soundMute'));$('game')?.setAttribute('aria-label',t('ui.canvasLabel'));document.querySelector('.mode-tabs')?.setAttribute('aria-label',t('ui.modeLabel'));$('selectedAircraft')?.setAttribute('aria-label',t('ui.selectedAircraft'));$('airframeStats')?.setAttribute('aria-label',t('ui.aircraftPerformance'));$('stageBossHud')?.setAttribute('aria-label',t('ui.armorLabel'));$('localeSelect')?.setAttribute('aria-label',t('language.label'));$('flightRoster')?.setAttribute('aria-label',t('ui.rosterLabel'));$('aircraftSelect103')?.setAttribute('aria-label',t('aircraft.select'));$('legendaryInventory')?.setAttribute('aria-label',t('special.title'));$('stick')?.setAttribute('aria-label',t('ui.touchSteer'));$('touchEvade')?.setAttribute('aria-label',t('maneuver.label'));$('touchSkill')?.setAttribute('aria-label',t('active.label'));const note=document.querySelector('.airframe-note');if(note)note.textContent=t('ui.durabilityNote');const real=document.querySelector('.airframe-brief details summary');if(real)real.textContent=t('ui.realAircraft');const hist=document.querySelector('.airframe-brief details small');if(hist)hist.textContent=t('ui.historyNote');const arm=document.querySelector('.weapon-spec .equipment-label');if(arm)arm.textContent=t('ui.armament');const foot=document.querySelector('.footnote');if(foot)foot.innerHTML=t('ui.footnote').replace('\\n','<br>');const motto=document.querySelector('footer span:nth-child(2)');if(motto)motto.textContent=t('ui.footerMotto');const controls=document.querySelector('.skill-info kbd');if(controls)controls.textContent=t('ui.controls');const hints=document.querySelectorAll?.('.start-hint span')||[];for(const [index,key] of ['ui.steer','maneuver.label','active.label'].entries())if(hints[index]?.lastChild)hints[index].lastChild.textContent=' '+t(key);if($('soloRanking'))$('soloRanking').textContent=t('ranking.title');if(game){if(game.mode==='coop2')coopHud();else hud()}else roster()}
$('localeSelect').onchange=event=>setLocale(event.target.value);
const soundWithLocale=$('sound').onclick;
$('sound').onclick=()=>{soundWithLocale();refreshLocale()};
subscribe(refreshLocale);refreshLocale();
function refreshRuntimeAria(){$('record').textContent=t('record.best',{score:String(best).padStart(3,'0')});$('pause')?.setAttribute('aria-label',t('hud.pause').replace(/^Ⅱ\s*/,''));$('pause')?.setAttribute('title',t('hud.pause').replace(/^Ⅱ\s*/,'')+' · ESC');document.querySelector('.healthMark151')?.setAttribute('aria-label',t('ui.factionMark'))}
subscribe(refreshRuntimeAria);refreshRuntimeAria();
$('start').onclick=start;

// Dynamic values originate in the gameplay data, so static DOM translation is
// not enough after switching languages. Keep their IDs at the presentation
// boundary and retain the Korean data text as the KO fallback.
const localizedPilot=(id,fallback)=>pilotName(id,fallback);
const localizedWeapon=(id,fallback)=>weaponName(id,fallback);
const localizedActive=(id,fallback)=>activeName(id,fallback);
const localizedPassive=(id,fallback)=>passiveName(id,fallback);
const localizedPilotDescription=(id,fallback)=>pilotDescription(id,fallback);
const localizedPassiveDescription=(id,fallback)=>passiveDescription(id,fallback);
const HANGAR_ACTIVE_COPY_KO=Object.freeze({"baron":"무적 급강하로 속도와 연사 강화","baron:baron_albatros":"전방 적을 제압하고 후방 공격 피해 증가","fonck":"전방 기관총탄이 적을 유도 추적","voss":"즉시 반전 · 잔상 6기가 사방으로 흩어지며 사격","boelcke":"아군 편대가 합류해 화력 지원","collishaw":"검은 삼엽기 편대가 좌우 기동하며 지원 사격","baracca":"무적 직선 돌격으로 경로의 적 관통","udet":"체력을 소모해 이동속도와 연사 대폭 강화","guynemer":"날개에서 다수의 직진 로켓 연속 발사","bishop":"초근접 화력 강화 후 상승·재진입 폭격","goering":"백색 윙맨의 화력과 연사 대폭 강화","immelmann":"반전하며 탄막을 지우고 관통 사격","mannock":"S.E.5a 편대가 교차 급강하하며 관통 사격","mckeever":"회전하며 전방·후방 기관총으로 사방 난사","huffzky":"회전하며 전방·후방 기관총으로 사방 난사","hawker":"탄약 소모 없이 기관총 연사 강화","berthold":"받는 피해를 크게 줄이는 방어 태세","wolff":"상승 후 급강하하며 화력과 속도 강화","loewenhardt":"하방 진입 후 수직 상승하며 고속 연사","mccudden":"주변에 수리 보급품 투하","nungesser":"잠시 완전 무적 상태 유지","jacobs":"근접 기관총 화력 강화와 짧은 무적","rickenbacker":"주변 적을 자동 조준하는 관통탄 추가 발사","ball":"구름에 은닉한 뒤 재등장 화력 강화","barker":"치명 피해를 버티며 각성 효과 강화","luke":"대형 표적 명중 시 연쇄 폭발 유발","brumowski":"붉은 알바트로스 호위 편대 소집","gontermann":"전탄을 소이탄으로 바꿔 화상·폭발 유발"});
const HANGAR_PASSIVE_COPY_KO=Object.freeze({"baron":"이동속도와 후방 공격 피해 증가","baron:baron_albatros":"이동속도와 선회력 증가","fonck":"기관총 피해와 사거리 증가","voss":"주변 적이 많을수록 공격·기동 성능 증가","boelcke":"주변 아군의 사격 피해 증가","collishaw":"검은 삼엽기 윙맨과 상시 출격","baracca":"정면 교전 시 공격 피해 증가","udet":"체력이 낮을수록 공격·기동 성능 증가","guynemer":"주기적으로 대구경 관통 기관포 발사","bishop":"기관총 사거리를 줄이고 공격력 증가","goering":"백색 윙맨과 상시 출격","immelmann":"선회기동 후 공격·기동 성능 증가","mannock":"짧은 사거리의 근접 기관총 운용","mckeever":"전방·후방 기관총 동시 사격","huffzky":"전방·후방 기관총 동시 사격","hawker":"선회 속도 손실 감소, 직선 비행 가속","berthold":"저체력에서 받는 피해 감소","wolff":"무피격 유지 시 공격력과 속도 누적 증가","loewenhardt":"정면 교전 시 기관총 피해 증가","mccudden":"레벨업 시 강화 선택지 추가","nungesser":"내구도가 낮을수록 공격속도와 이동속도 증가","jacobs":"기관총 공격력 증가","rickenbacker":"주변 적이 많을수록 기관총 공격력 증가","ball":"주변 아군이 없을 때 기관총 공격력 증가","barker":"피격 시 기관총 공격력 누적 증가","luke":"기구·폭격기·에이스 피해 증가","brumowski":"출격 중인 아군이 많을수록 기관총 공격력 증가","gontermann":"기구·폭격기·에이스 피해 증가"});
const HANGAR_ACTIVE_COPY_EN=Object.freeze({"baron":"Invulnerable dive boosts speed and fire rate","baron:baron_albatros":"Suppress enemies ahead and boost rear-attack damage","fonck":"Forward gunfire tracks nearby targets","voss":"Reverse, then scatter 6 firing afterimages in all directions","boelcke":"Summon a friendly formation for fire support","collishaw":"Black Flight sweeps and fires alongside you","baracca":"Invulnerable straight-line charge through enemies","udet":"Trade health for a major speed and fire-rate boost","guynemer":"Fire a rapid stream of forward rockets","bishop":"Boost close-range fire, then climb and bomb on re-entry","goering":"Greatly boost White Flight firepower and fire rate","immelmann":"Reverse, clear bullets, and fire piercing rounds","mannock":"S.E.5a formation makes crossing dive attacks","mckeever":"Spin and spray forward and rear guns in all directions","huffzky":"Spin and spray forward and rear guns in all directions","hawker":"Boost fire rate without consuming machine-gun ammo","berthold":"Greatly reduce incoming damage","wolff":"Climb then dive with boosted speed and firepower","loewenhardt":"Dip low, then climb vertically with rapid fire","mccudden":"Drop repair supplies nearby","nungesser":"Become fully invulnerable briefly","jacobs":"Boost close-range gun damage with brief invulnerability","rickenbacker":"Add auto-aimed piercing rounds against nearby enemies","ball":"Hide in cloud cover, then return with boosted firepower","barker":"Survive lethal damage and strengthen awakening stacks","luke":"Hits on large targets trigger chain explosions","brumowski":"Summon Red Albatros escorts","gontermann":"Turn all rounds incendiary to burn and blast targets"});
const HANGAR_PASSIVE_COPY_EN=Object.freeze({"baron":"Increase speed and rear-attack damage","baron:baron_albatros":"Increase speed and turn rate","fonck":"Increase machine-gun damage and range","voss":"Gain more combat power as nearby enemy count rises","boelcke":"Increase nearby allies' gun damage","collishaw":"Deploy with permanent Black Flight wingmen","baracca":"Increase damage in head-on engagements","udet":"Gain more combat power as health falls","guynemer":"Periodically fire a heavy piercing cannon round","bishop":"Trade machine-gun range for higher damage","goering":"Deploy with permanent White Flight wingmen","immelmann":"Gain combat bonuses after maneuvers","mannock":"Use a short-range close-combat gun setup","mckeever":"Fire forward and rear guns together","huffzky":"Fire forward and rear guns together","hawker":"Lose less speed in turns and accelerate in straight flight","berthold":"Take less damage at low health","wolff":"Build attack and speed while avoiding hits","loewenhardt":"Increase machine-gun damage in head-on engagements","mccudden":"Gain an extra upgrade choice on level-up","nungesser":"Gain fire rate and speed as durability falls","jacobs":"Increase machine-gun damage","rickenbacker":"Gain machine-gun damage as nearby enemy count rises","ball":"Gain machine-gun damage when no allies are nearby","barker":"Build machine-gun damage after taking hits","luke":"Deal more damage to balloons, bombers, and aces","brumowski":"Gain machine-gun damage from deployed allies","gontermann":"Deal more damage to balloons, bombers, and aces"});
const hangarPilotDescription=(id,fallback)=>getLocale()==='en'?(HANGAR_ACTIVE_COPY_EN[id]||localizedPilotDescription(id,fallback)):(HANGAR_ACTIVE_COPY_KO[id]||fallback);
const hangarPassiveDescription=(id,fallback)=>getLocale()==='en'?(HANGAR_PASSIVE_COPY_EN[id]||localizedPassiveDescription(id,fallback)):(HANGAR_PASSIVE_COPY_KO[id]||fallback);
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
 $('pilotAircraft').textContent=displayAircraftName(pilot,plane)+' · '+localizedAircraftRole(plane,PLANES[plane].role);
 const airframe=PLANES[plane].handling||{};$('airframeTip').textContent=localizedAirframeTip(plane,airframe.tip);$('airframeHistory').textContent=localizedAirframeHistory(plane,airframe.history);
 $('baronAircraftHint').textContent=t(pilot==='baron'?'ui.aircraftHint':'ui.historicalAircraftHint');$('skillStatus').textContent=t('active.ready');
 const fit=PLANES[plane],xpPercent=Math.round((fit.xpCostMultiplier-1)*100),growthKey=xpPercent<0?'ui.growthFast':xpPercent>0?'ui.growthCost':'ui.growthStandard',weapon=WEAPONS[plane];
 const detailedFeel=renderAirframeFeel(plane,fit);
 $('airframeGrowth').textContent=t(detailedFeel?'ui.growthWithDurability':'ui.growth',{value:(xpPercent>0?'+':'')+xpPercent,suffix:t(growthKey),hp:fit.hp});
 $('weaponSpec').textContent=t('ui.weaponSpec',{name:localizedWeapon(plane,weapon.name),guns:weapon.guns,caliber:weapon.caliber,belt:weapon.belt});
 $('weaponDetail').textContent=t('ui.weaponDetail',{rpm:weapon.rpm,reload:weapon.reload});
 $('hangarAircraftName').textContent=displayAircraftName(pilot,plane);
 $('hangarPortrait').alt=t('ui.pilotPortrait',{name:pilotLabel});$('hangarName').textContent=pilotLabel;$('hangarSkill').textContent=localizedActive(loadoutId,loadout.skill);
 const visiblePilots=Object.entries(PILOTS).filter(([,p])=>p.faction===faction);
 [...$('pilotTabs').querySelectorAll('button')].forEach((button,index)=>{const [id,data]=visiblePilots[index]||[];if(id)(button.querySelector('.pilot-tab-label')||button).textContent=localizedPilot(id,data.name)});
 return result;
};
const hudWithDynamicLocale=hud;
hud=()=>{hudWithDynamicLocale();if(!game)return;const label=localizedEquippedWeapon(game.plane||plane,game.weapon);$('ammoGunIcon').setAttribute('aria-label',label);$('ammoLabel').textContent=label+' × '+game.weapon.guns};
const coopHudWithDynamicLocale=coopHud;
coopHud=()=>{coopHudWithDynamicLocale();if(!game?.players)return;for(const p of game.players){const weapon=localizedEquippedWeapon(p.plane,p.weapon);$(p.id+'Gun113').title=weapon;$(p.id+'HudName').textContent=p.id.toUpperCase()+' · '+p.nickname+' / '+localizedPilot(p.pilot,PILOTS[p.pilot].name)}};
const eventsWithDynamicLocale=events;
events=()=>{const result=eventsWithDynamicLocale();if(!game)return result;if(game.mode==='coop2'){for(const p of game.players){const name=$(p.id+'CutinName'),skill=$(p.id+'CutinSkill'),loadoutId=p.pilot==='baron'&&p.plane==='baron_albatros'?'baron:baron_albatros':p.pilot;if(name)name.textContent=p.id.toUpperCase()+' · '+p.nickname;if(skill)skill.textContent=localizedActive(loadoutId,pilotLoadout(p.pilot,p.plane).skill)}}else{const loadout=pilotLoadout(pilot,plane),loadoutId=pilot==='baron'&&plane==='baron_albatros'?'baron:baron_albatros':pilot;$('cutinName').textContent=localizedPilot(pilot,loadout.name);$('cutinSkill').textContent=localizedActive(loadoutId,loadout.skill)}return result};
const coopEventsWithDynamicLocale=coopEvents;
coopEvents=()=>{const result=coopEventsWithDynamicLocale();if(!game?.players)return result;for(const p of game.players){const name=$(p.id+'CutinName'),skill=$(p.id+'CutinSkill'),loadoutId=p.pilot==='baron'&&p.plane==='baron_albatros'?'baron:baron_albatros':p.pilot;if(name)name.textContent=p.id.toUpperCase()+' · '+p.nickname;if(skill)skill.textContent=localizedActive(loadoutId,pilotLoadout(p.pilot,p.plane).skill)}return result};
const eventsWithDoctrineLocale=events;
events=()=>{const result=eventsWithDoctrineLocale();if(getLocale()==='en'){const key=({'강습 편대 · 출격 장비 배정':'doctrine.assault','고속 정찰 · 출격 장비 배정':'doctrine.recon','장기 초계 · 출격 장비 배정':'doctrine.patrol','강습 편대 · 화력 +15% / 장전 +15%':'doctrine.assaultLabel','고속 정찰 · 속도 +12% / 내구도 −10%':'doctrine.reconLabel','장기 초계 · 내구도 +15 / 발사 간격 +8%':'doctrine.patrolLabel','신속 작전 · 경험치 +25% / 속도 +5%':'doctrine.rapidLabel','관측 비행 · 회수 반경 +35% / 경험치 +8%':'doctrine.observationLabel','방어진지 엄호 · 내구도 +25 / 기관총 −8%':'doctrine.defenseLabel'})[$('toast').textContent];if(key)$('toast').textContent=t(key)}return result};
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
start=()=>{gamepadInput.reset();shownBattlefieldEvent=shownBattlefieldResult=shownRivalNotice='';return startWithGamepad()};
const returnHangarWithGamepad=returnHangar;
returnHangar=()=>{gamepadInput.reset();shownBattlefieldEvent=shownBattlefieldResult=shownRivalNotice='';return returnHangarWithGamepad()};
const pauseWithGamepad=pause;
pause=()=>{gamepadInput.reset();return pauseWithGamepad()};
const helpWithGamepad=help;
help=()=>{gamepadInput.reset();return helpWithGamepad()};
$('start').onclick=start;$('pause').onclick=pause;$('help').onclick=help;

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
 $('toast').textContent=t(`rival.${notice.phase}`,{name:notice.name});show('toast');toastUntil=performance.now()+2600;
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
 else if(event.type==='BOMBER_INTERCEPT'){objective=t('event.hud.bombers',{done:String(destroyed)});meta=t('event.hud.time',{seconds:String(Math.max(0,Math.ceil(event.deadline-game.t)))} )}
 else if(event.type==='RESCUE'){const rescue=event.rescue,percent=Math.max(0,Math.round(100*(rescue?.hp||0)/(rescue?.maxHp||1)));objective=t('event.hud.rescue');meta=t('event.hud.hp',{percent:String(percent)})+' · '+t('event.hud.time',{seconds:String(Math.max(0,Math.ceil(event.endsAt-game.t)))})}
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
draw=frameTime=>{battlefieldMissionDraw(frameTime);const event=game?.battlefieldEvents?.current;if(!event||event.status!=='active')return;const targets=event.type==='RESCUE'?[event.rescue]:(event.targets||[]).filter(unit=>unit.hp>0&&!unit.deathHandled);if(!targets.length)return;const visible=event.type==='BOMBER_INTERCEPT'?targets:[targets[0]];visible.forEach((target,index)=>drawBattlefieldMissionTarget(target,index,visible.length,event.type));};


// HEAD-ON Test Lab bridge. It is inert on production and only activates on the
// repository's public GitHub Pages preview or local development hosts.
const HEADON_TEST_REGION_NAMES=['전원 지대','아드리아해','참호 전선','포화의 참호전선','도심','고공 전역','알프스 산맥','제브뤼헤 군항'];
const HEADON_TEST_ALLOWED_HOSTS=new Set(['localhost','127.0.0.1','terminal.local','leesh603.github.io']);
function installHeadOnTestLab(){
 const testHost=globalThis.location?.hostname||'';if(!HEADON_TEST_ALLOWED_HOSTS.has(testHost))return;
 const configureRegion=(run,region)=>{
  const addon=enableStageBoss(run,{teamFaction:PLANES[run.plane].faction});if(!addon)return null;
  addon.stages.stageIndex=region;addon.stages.orderPosition=addon.stages.order.indexOf(region);addon.stages.phase='explore';addon.stages.encounter=null;
  run.region=region;run.stageStartDistance=run.distance||0;run.stageStartTime=run.t;run.clearRegionalHazards();
  run.bossBuildings=[];run.bossCues=[];run.navalRouteCues=new Set();run.navalApproachAt=null;
  run.navalRoute=region===7?{x:run.x,y:run.y,a:Number.isFinite(run.a)?run.a:-Math.PI/2,maxForward:0}:null;
  return addon;
 };
 const startTest=(options={})=>{
  if(game)returnHangar();
  selectedMode='endless';
  const requestedPilot=String(options.pilot||pilot);
  if(PILOTS[requestedPilot]){pilot=requestedPilot;faction=PILOTS[pilot].faction}
  if(pilot==='baron'&&options.baronAircraft==='baron_albatros')baronAircraft='baron_albatros';
  else if(pilot==='baron'&&options.baronAircraft==='fokker')baronAircraft='fokker';
  plane=pilotPlane(pilot);roster();start();
  if(!game)return null;
  game.testMode=true;game.nextBossAt=Number.POSITIVE_INFINITY;
  const requestedRegion=Number.parseInt(options.region,10),region=Number.isInteger(requestedRegion)?Math.max(0,Math.min(HEADON_TEST_REGION_NAMES.length-1,requestedRegion)):0;
  const addon=configureRegion(game,region);
  if(options.invincible!==false)game.invuln=Number.POSITIVE_INFINITY;
  const ace=String(options.ace||'');
  if(ace){
   if(ace!=='random'&&PILOTS[ace])game.bossDeck=[ace];
   game.spawnEnemy('boss');
  }
  if(options.boss&&addon){
   const distance=region===6?760:560,angle=Number.isFinite(game.a)?game.a:-Math.PI/2;
   addon.startBoss({x:game.x+Math.cos(angle)*distance,y:game.y+Math.sin(angle)*distance});
  }
  game.event('wave','TEST LAB · '+HEADON_TEST_REGION_NAMES[region]);
  return{region,pilot:game.pilot,plane:game.plane,boss:addon?.stages?.bossId||null};
 };
 const catalog={
  regions:HEADON_TEST_REGION_NAMES.map((name,id)=>({id,name})),
  pilots:Object.entries(PILOTS).map(([id,p])=>({id,name:p.name,faction:p.faction,plane:pilotPlane(id)}))
 };
 window.__HEADON_TEST__={catalog,start:startTest,status:()=>game?{state:game.state,region:game.worldRegion?.(),pilot:game.pilot,plane:game.plane,testMode:!!game.testMode}:null,debug:()=>game};
 const params=new URLSearchParams(location.search);
 if(params.get('headonTest')==='1'&&params.get('autostart')!=='0')queueMicrotask(()=>startTest({
  region:params.get('region'),pilot:params.get('pilot'),ace:params.get('ace'),boss:params.get('boss')==='1',
  invincible:params.get('invincible')!=='0',baronAircraft:params.get('baronAircraft')
 }));
}
installHeadOnTestLab();

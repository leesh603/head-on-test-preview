/* Astra presentation. Move the live controls, never clone gameplay state or handlers. */
import {getLocale,subscribe} from './i18n.js?v=buildfit1&afc=1&art=pilot-recovery2';
import {aircraftKey} from './aircraft.js?v=outline2&art=pilot-recovery2&pf=1027&crewbake=1';
import {hangarArt,hangarArtNow,hangarKeyFile,hangarArtLayout} from './hangar-art.js?v=buildfit1&art=pilot-recovery2';
export {hangarArt} from './hangar-art.js?v=buildfit1&art=pilot-recovery2';

const $=id=>document.getElementById(id);
const el=(tag,cls)=>{const node=document.createElement(tag);if(cls)node.className=cls;return node};
const put=(node,text)=>{if(node&&node.textContent!==text)node.textContent=text};
const putAircraftName=(node,text)=>{
 if(node.textContent!==text){node.textContent=text;node.title=text;}
 const width=node.clientWidth,max=Number(getComputedStyle(node).getPropertyValue('--aircraft-title-max'))||16;
 if(!width)return;
 const key=text+'|'+width+'|'+max;
 if(node.dataset.aircraftFit===key)return;
 node.style.setProperty('font-size',max+'px','important');
 const size=Math.min(max,Math.floor(max*width/Math.max(width,node.scrollWidth)*10)/10);
 node.style.setProperty('font-size',size+'px','important');node.dataset.aircraftFit=key;
};// The live select owns pilot choices, campaign locks, and the existing change handler.
function availableAircraftOptions(select){return [...(select?.options||[])].filter(option=>!option.disabled&&!option.hidden&&!option.parentElement?.disabled)}
function hasAircraftChoice(select){return !!select&&!select.disabled&&availableAircraftOptions(select).length>1}
function cycleAircraftChoice(select,direction){
 if(!hasAircraftChoice(select))return false;
 const options=availableAircraftOptions(select),step=direction<0?-1:1,current=options.findIndex(option=>option.value===select.value),index=current<0?(step>0?-1:0):current;
 select.value=options[(index+step+options.length)%options.length].value;
 select.dispatchEvent(new Event('change',{bubbles:true}));return true;
}
function aircraftHeading(select,fallback=''){
 const option=select?.selectedOptions?.[0];
 if(option?.dataset?.aircraftName)return option.dataset.aircraftName;if(!option)return fallback;
 // Strip only the choice badge and final role; keep separators inside model/livery names.
 const text=option.textContent.replace(/^(?:기본|해금 · 베타 개방|Default|Unlock · Beta open) · /,'');
 const role=text.lastIndexOf(' · ');return role<0?text:text.slice(0,role);
}
const paths={
 arrow:'<path d="m9 5 7 7-7 7"/>',
 sortie:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
 ranking:'<path d="M8 3h8v6a4 4 0 0 1-8 0V3ZM8 5H4v3a4 4 0 0 0 5 4m7-7h4v3a4 4 0 0 1-5 4m-3 1v6m-4 2h8m-9 0h10"/>',
 records:'<path d="M9 4H5v17h14V4h-4M9 2h6v4H9zm-1 8h8m-8 4h8m-8 4h5"/>',
 coop:'<circle cx="8" cy="7" r="3"/><circle cx="17" cy="8" r="2.5"/><path d="M2 21v-4a6 6 0 0 1 12 0v4H2Zm13-8a5 5 0 0 1 7 4v4h-5"/>',
 settings:'<path d="m10 2-.7 3-2 .9L4.6 5l-2 3.5 2.2 2.2v2.5l-2.2 2.3 2 3.4 2.8-.9 2 .9.7 3h4l.7-3 2-.9 2.8.9 2-3.4-2.2-2.3v-2.5l2.2-2.2-2-3.5-2.8.9-2-.9L14 2h-4Z"/><circle cx="12" cy="12" r="3.7"/>',
 active:'<path d="m3 18 4-5-4-6 7 4 2-9 3 9 6-4-3 7 3 4H3Zm0 4h18"/>',
 maneuver:'<path d="M5 18a8 8 0 0 1 12-10m-2-5 3 6-7 1"/>',
 reload:'<path d="M20 9A8 8 0 0 0 6 6L3 9m0-6v6h6m-5 6a8 8 0 0 0 14 3l3-3m0 6v-6h-6"/>',
 passive:'<path d="M12 2v18m-1-13L2 11v2l9-1m2-5 9 4v2l-9-1m-2 5-4 3v2l5-1 5 1v-2l-4-3"/>'
};
export function interfaceIcon(name,cls='astra-icon'){
 const holder=el('span',cls);holder.setAttribute('aria-hidden','true');
 if(name==='medals'){holder.classList.add('service-nav-medal');return holder}
 holder.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">${paths[name]||paths.sortie}</svg>`;
 return holder;
}
function ring(){
 const r=el('span','astra-dial');r.setAttribute('aria-hidden','true');
 r.innerHTML='<svg viewBox="0 0 100 100"><circle class="dial-track" cx="50" cy="50" r="45"/><circle class="dial-progress" cx="50" cy="50" r="45" pathLength="100"/></svg>';return r;
}
function install(){
 if(!$('hangar')||document.querySelector('#hangar .astra-home'))return;
 document.body.classList.add('astra-ui');
 const hangar=$('hangar'),roster=$('flightRoster');
 const stage=el('div','astra-stage'),home=el('div','astra-home'),hero=el('section','astra-hero'),dossier=el('div','astra-dossier');
 const kicker=el('div','astra-kicker'),title=el('h1','astra-pilot-title'),english=el('p','astra-pilot-english');
 title.id='astraPilotTitle';hero.setAttribute('aria-labelledby',title.id);
 const identity=el('div','astra-identity');identity.append(kicker,title,english);
 // Existing labels remain the authoritative text sources for every roster update.
 const legacy=el('div','astra-legacy');legacy.hidden=true;
 legacy.append($('hangarName'),$('hangarSkill'),$('pilotName'),$('pilotAlias'));
 const skills=roster.querySelector('.skill-info');
 const active=el('div','astra-ability astra-active'),activeMark=interfaceIcon('active','astra-ability-icon'),activeCopy=el('div','astra-ability-copy');
 const activeLabel=el('small','astra-ability-label');
 activeCopy.append(activeLabel,$('skillName'),$('skillDesc'));
 active.append(activeMark,activeCopy);
 const passive=el('div','astra-ability astra-passive'),passiveMark=interfaceIcon('passive','astra-ability-icon'),passiveCopy=el('div','astra-ability-copy');
 const passiveLabel=el('small','astra-ability-label'),passiveName=el('b'),passiveDesc=el('p');
 passiveCopy.append(passiveLabel,passiveName,passiveDesc);passive.append(passiveMark,passiveCopy);
 legacy.append($('passive103'),$('pilotSkillIcon'),$('skillStatus'));const skillBar=$('skillBar')?.closest('.bar');if(skillBar)legacy.append(skillBar);
 skills.replaceChildren(active,passive);dossier.append(identity,skills);hero.append($('hangarPortrait'),dossier);
 const aircraft=el('section','astra-aircraft');aircraft.setAttribute('aria-label','Aircraft');
 const selected=roster.querySelector('.selected-aircraft'),heading=el('div','astra-aircraft-heading');
 const previous=el('button','astra-aircraft-prev'),next=el('button','astra-aircraft-next'),headingCopy=el('div');
 previous.type=next.type='button';previous.append(interfaceIcon('arrow'));next.append(interfaceIcon('arrow'));
 const airName=el('h2'),airRole=el('p');headingCopy.append(airName,airRole);heading.append(previous,headingCopy,next);
 const figure=el('div','astra-aircraft-figure'),art=el('img','astra-aircraft-art');art.alt='';art.decoding='async';art.hidden=true;
 // This is a dedicated hangar illustration; the world renderer and sprite scale are untouched.
 figure.append($('selectedAircraft'),art);
 function fitArt(){
  const layout=hangarArtLayout(lastArt||"",art.clientWidth,art.clientHeight,figure.classList.contains("art-floor"));
  art.toggleAttribute("data-hangar-fit",!!layout);
  for(const [name,value]of Object.entries(layout||{scale:1,x:0,y:0}))art.style.setProperty("--hangar-art-"+name,String(value)+(name==="scale"?"":"px"));
 }
 const artResize=new ResizeObserver(fitArt);artResize.observe(figure);artResize.observe(art);
 art.addEventListener("load",fitArt);
 const data=el('div','astra-aircraft-data'),brief=selected.querySelector('.airframe-brief');
 const hp=el('div','astra-base-hp'),hpLabel=el('span'),hpBar=el('span','astra-base-hp-track'),hpFill=el('i'),hpValue=el('b');hpBar.append(hpFill);hp.append(hpLabel,hpBar,hpValue);
 const weapon=roster.querySelector('.weapon-spec');
 const weaponName=el('strong','astra-weapon-name'),weaponMeta=el('small','astra-weapon-meta'),weaponRate=el('small','astra-weapon-rate');
 weapon.append(weaponName,weaponMeta,weaponRate);
 data.append($('airframeStats'),hp,weapon);
 const growth=$('airframeGrowth');growth.classList.add('astra-growth');
 legacy.append($('baronAircraftChoice'),$('aircraftSelect103'),$('pilotAircraft'),brief);
 const equipmentLabel=selected.querySelector('.equipment-label');equipmentLabel.hidden=true;
 selected.replaceChildren(equipmentLabel,heading,figure,data,growth);aircraft.append(selected);
 stage.append(hero,aircraft);
 const lower=el('div','astra-lower'),railHead=el('div','astra-rail-heading'),railLabel=el('span'),railCounter=el('small');
 railHead.append(railLabel,roster.querySelector('.factions'),railCounter);
 const rail=el('div','astra-pilot-rail'),railPrev=el('button','astra-rail-prev'),railNext=el('button','astra-rail-next');
 railPrev.type=railNext.type='button';railPrev.append(interfaceIcon('arrow'));railNext.append(interfaceIcon('arrow'));rail.append(railPrev,$('pilotTabs'),railNext);
 // Keep every legacy ID queried by roster(), start(), and locale updates.
 for(const child of [...roster.childNodes])legacy.append(child);
 roster.replaceChildren(railHead,rail);
 const launch=el('div','astra-launch'),launchHint=el('p','astra-launch-hint'),randomStart=el('button','astra-random-sortie');
 randomStart.id='randomStart';randomStart.type='button';const randomIcon=el('span','astra-random-dice'),randomLabel=el('strong'),randomBadge=el('span','astra-random-badge');randomIcon.setAttribute('aria-hidden','true');randomStart.append(randomIcon,randomLabel,randomBadge);randomStart.hidden=document.body.classList.contains('coop-selected');
 const start=$('start');start.replaceChildren(interfaceIcon('passive','astra-sortie-plane'));
 const startLabel=el('strong'),startEnglish=el('span','astra-sortie-english');start.append(startLabel,startEnglish,interfaceIcon('sortie','astra-sortie-arrow'));
 launch.append(start,randomStart,launchHint);
 lower.append(roster,launch);
 const coop=$('coopPanel');home.append(stage,coop,lower,legacy);hangar.append(home);
 const nav=$('mainOperations'),header=document.querySelector('body>header');
 header.append(nav);document.body.append($('mainSettings'));
 const menuMedia=matchMedia('(max-width:720px)');
 const placeMenu=()=>{if(menuMedia.matches)home.append(nav);else header.append(nav)};
 menuMedia.addEventListener?.('change',placeMenu);placeMenu();
 nav.querySelectorAll('[data-action]').forEach(button=>button.prepend(interfaceIcon(button.dataset.action)));
 // Settings reuse the real language control, sound and help actions.
 const lang=$('localeSelect')?.closest('label');if(lang)$('mainSettings').append(lang);
 const mobileSettings=el('button','astra-mobile-settings');mobileSettings.type='button';mobileSettings.dataset.action='settings';mobileSettings.append(interfaceIcon('settings'));mobileSettings.addEventListener('click',()=>nav.querySelector('[data-action="settings"]').click());header.append(mobileSettings);
 railPrev.addEventListener('click',()=>scrollRoster(-1));railNext.addEventListener('click',()=>scrollRoster(1));
 function scrollRoster(direction){const tabs=$('pilotTabs');tabs.scrollBy({left:direction*tabs.clientWidth*.8,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'})}
 function changeAircraft(direction){cycleAircraftChoice($('aircraftSelect103'),direction)}
 previous.addEventListener('click',()=>changeAircraft(-1));next.addEventListener('click',()=>changeAircraft(1));
 let queued=false,lastArt='',lastPilot='',artRequest=0;
 const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync()})};
 function sync(){
  if(document.body.classList.contains('playing'))return;
  const en=getLocale()==='en',selectedButton=$('pilotTabs').querySelector('[data-pilot-id].active');
  if(!selectedButton)return;
  const pilot=selectedButton.dataset.pilotId,aircraftId=aircraftKey($('aircraftSelect103').value,false,pilot);
  put(title,$('hangarName').textContent);
  put(english,$('pilotAlias').textContent);
  put(kicker,en?'PILOT / SELECTED ACE':'파일럿 / 출격 대기');
  put(activeLabel,en?'ACTIVE':'액티브');put(passiveLabel,en?'PASSIVE':'패시브');
  const raw=$('passive103').textContent,index=raw.indexOf(' · ');
  put(passiveName,index>=0?raw.slice(0,index):'');put(passiveDesc,index>=0?raw.slice(index+3):raw);
  const airLabel=aircraftHeading($('aircraftSelect103'),$('pilotAircraft').textContent);
  // Keep the complete canonical aircraft name, including its parenthesized owner.
  putAircraftName(airName,airLabel);
  put(airRole,$('airframeTip').textContent);
  const hasChoice=hasAircraftChoice($('aircraftSelect103'));previous.hidden=next.hidden=!hasChoice;previous.disabled=next.disabled=!hasChoice;
  previous.setAttribute('aria-label',en?'Switch aircraft':'이전 기체');next.setAttribute('aria-label',en?'Switch aircraft':'다음 기체');
  if(aircraftId!==lastArt){const request=++artRequest;lastArt=aircraftId;art.onload=art.onerror=null;art.hidden=true;figure.classList.remove('has-art','use-canvas');
   const artFile=hangarKeyFile[aircraftId]||aircraftId;
   figure.classList.toggle('art-floor',artFile==='bristol_duo'||artFile==='halberstadt_duo');
   // Keep the flight canvas hidden while the exact hangar image loads. It has a
   // different crop/scale and used to flash between every uncached pilot choice.
   const displayArt=url=>{if(request!==artRequest)return;
    const failed=()=>{if(request!==artRequest)return;art.hidden=true;art.removeAttribute('src');figure.classList.remove('has-art');figure.classList.add('use-canvas')};
    if(!url){failed();return}
    const reveal=()=>{if(request!==artRequest)return;art.hidden=false;figure.classList.add('has-art');figure.classList.remove('use-canvas');fitArt()};
    art.onload=()=>{if(request!==artRequest)return;art.onload=null;
     // This DOM image also needs decoding, even when the preload image is cached.
     if(typeof art.decode==='function')art.decode().then(reveal,failed);else reveal();
    };
    art.onerror=failed;art.src=url;if(art.complete&&art.naturalWidth)art.onload();
   };
   const ready=hangarArtNow(aircraftId);if(ready)displayArt(ready);else hangarArt(aircraftId).then(displayArt);
  }
  art.alt=airName.textContent;fitArt();
  // Derive display values from the already-rendered authoritative roster, not a second stats table.
  for(const row of $('airframeStats').querySelectorAll('.airframe-rating-row')){
   let value=row.querySelector('.astra-rating-value');if(!value){value=el('small','astra-rating-value');row.append(value)}
   put(value,`${row.querySelectorAll('i.active').length} / 5`);
  }
  const ws=$('weaponSpec').textContent,wd=$('weaponDetail').textContent,parts=ws.split(' · ');
  put(weaponName,parts.shift()||ws);put(weaponMeta,parts.join(' · '));
  // Card shows the plain numbers; the long "game fire rate … (adapted)" note reads like a dev memo.
  put(weaponRate,wd.replace(/게임 연사 기준: (?:총합 |총당 )?분당 /,'총당 분당 ').replace(/ · 공중 /,' · ').replace(/\s*\(각색\)\s*$/,'').replace(/Game fir(?:e|ing) rate: /,'').replace(/ · Air reload /,' · Reload ').replace(/\s*\(adapted\)\s*$/,''));
  weapon.title=ws+' / '+wd;put(weapon.querySelector('.equipment-label'),en?'ARMAMENT':'무장');
  const baseHp=growth.textContent.match(/(\d+(?:\.\d+)?)\s*HP/);put(hpValue,baseHp?.[1]||'—');put(hpLabel,en?'Durability':'내구도');
  put(railLabel,en?'PILOT ROSTER':'파일럿 선택');put(railCounter,String($('pilotTabs').children.length).padStart(2,'0')+(en?' ACES':' ACES'));
  if(!start.contains(startLabel))start.replaceChildren(interfaceIcon('passive','astra-sortie-plane'),startLabel,startEnglish,interfaceIcon('sortie','astra-sortie-arrow'));
  put(startLabel,en?'SORTIE':'출격');put(startEnglish,en?'TAKE TO THE SKY':'SORTIE');
  start.setAttribute('aria-label',en?'Start sortie':'출격');
  put(randomLabel,en?'RANDOM SORTIE':'랜덤 출격');put(randomBadge,en?'+1 UPGRADE':'강화 +1');randomStart.setAttribute('aria-label',en?'Random sortie, +1 upgrade':'랜덤 출격 · 강화 1개');
  put(launchHint,en?'AUTO FIRE · WASD / ARROWS TO FLY':'자동 사격 · WASD / 방향키로 조종');
  railPrev.setAttribute('aria-label',en?'Previous pilots':'이전 파일럿');railNext.setAttribute('aria-label',en?'Next pilots':'다음 파일럿');
  mobileSettings.setAttribute('aria-label',en?'Settings':'설정');
  for(const button of $('pilotTabs').children){
   const label=button.querySelector('.pilot-tab-label'),alias=button.dataset.pilotAlias||'';
   button.title=alias?((label?.textContent||'')+' · '+alias):(label?.textContent||'');
   let caption=button.querySelector('.astra-pilot-caption');if(!caption){caption=el('small','astra-pilot-caption');button.append(caption)}put(caption,alias);
  }
  if(lastPilot!==pilot){lastPilot=pilot;const tabs=$('pilotTabs');const l=selectedButton.getBoundingClientRect().left-tabs.getBoundingClientRect().left+tabs.scrollLeft;if(l<tabs.scrollLeft||l+selectedButton.offsetWidth>tabs.scrollLeft+tabs.clientWidth)tabs.scrollLeft=Math.max(0,l-tabs.clientWidth/2+selectedButton.offsetWidth/2)}
  document.body.classList.add('boot-ready');
 }
 new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});
 new MutationObserver(schedule).observe($('pilotTabs'),{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
 new MutationObserver(schedule).observe($('aircraftSelect103'),{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','hidden','selected']});
 $('aircraftSelect103').addEventListener('change',schedule);
 const titleResize=new ResizeObserver(schedule);titleResize.observe(airName);
 document.fonts?.ready?.then(()=>{delete airName.dataset.aircraftFit;schedule()});
 subscribe(schedule);schedule();
 installHud();
}
function installHud(){
 const reload=$('reload'),ammo=$('ammoHud'),survival=document.querySelector('.flight-survival');if(!reload||!survival)return;
 for(const [id,name]of [['touchSkill','active'],['touchEvade','maneuver']]){
  const button=$(id);
  if(name==='active'){
   // The authored emblem is already painted into this canvas by app.js.
   // Reuse it instead of layering an extra <img> that can show a broken-image glyph.
   const icon=$('skillButtonIcon');
   if(icon){icon.classList.add('astra-control-icon');icon.style.display='block';}
   button.prepend(ring());
  }
  else button.prepend(interfaceIcon(name,'astra-control-icon'),ring());
 }
 const readout=el('div','astra-reload-readout'),caption=el('span'),seconds=el('b'),track=el('span','astra-reload-track'),fill=el('i');track.append(fill);readout.append(caption,seconds,track);survival.append(readout);
 const health=$('healthBar');let wasReloading=false,reloadedTimer=0;
 function syncReadout(){
  const en=getLocale()==='en',reloading=ammo.classList.contains('reloading');
  survival.classList.toggle('astra-reloading',reloading);put(caption,en?'RELOADING':'재장전');
  const text=reload.getAttribute('aria-label')||'',remaining=text.match(/(\d+(?:\.\d+)?)\s*(?:s|초)/);
  put(seconds,remaining?remaining[1]+(en?'s':'초'):'');
  const progress=$('ammoProgress').style.width;fill.style.width=reloading?progress:'0%';
  // Reload plays as an overlay inside the ammo pill (no floating readout that collides with toasts).
  // The touch reload key lives outside #ammoHud on phones; give it the same progress for its ring.
  reload.style.setProperty('--astra-reload-p',reloading?(progress||'0%'):'0%');reload.classList.toggle('ho-reloading',reloading);
  if(ammo){ammo.style.setProperty('--astra-reload-p',reloading?(progress||'0%'):'0%');ammo.dataset.reloadText=reloading?(en?'RELOADING':'재장전'):'';ammo.dataset.reloadShort=reloading?(en?'RELOAD':'재장전'):'';
   if(wasReloading&&!reloading){ammo.classList.remove('astra-reloaded');void ammo.offsetWidth;ammo.classList.add('astra-reloaded');clearTimeout(reloadedTimer);reloadedTimer=setTimeout(()=>ammo.classList.remove('astra-reloaded'),520)}}
  wasReloading=reloading;
  const counts=$('ammoCount').textContent.match(/(\d+)\s*\/\s*(\d+)/);
  if(counts&&+counts[2])ammo.style.setProperty('--astra-ammo',Math.min(100,+counts[1]/+counts[2]*100)+'%');
  // 4-digit belts (stacked belt upgrades) need a tighter layout on phones.
  if(ammo){const long=!!counts&&counts[2].length>=4;if((ammo.dataset.long==='1')!==long)ammo.dataset.long=long?'1':''}
  ammo?.classList.toggle('astra-low-ammo',!!counts&&+counts[2]>0&&!reloading&&+counts[1]/+counts[2]<.2);
  const hpCur=parseFloat(document.getElementById('healthCurrent151')?.textContent),hpMax=parseFloat(document.getElementById('healthMax151')?.textContent),hpRaw=parseFloat(health.style.width),hpNow=hpMax>0&&Number.isFinite(hpCur)?hpCur/hpMax*100:Number.isFinite(hpRaw)?hpRaw:100;survival.classList.toggle('astra-low-health',hpRaw<30);
  // Hit flash: the status pill blinks red once whenever health drops.
  if(hpNow<(survival.hoLastHp??hpNow)-.5){survival.classList.remove('astra-hit');void survival.offsetWidth;survival.classList.add('astra-hit')}survival.hoLastHp=hpNow;
  const bossHp=document.getElementById('stageBossHp');if(bossHp)bossHp.parentElement.classList.toggle('ho-boss-low',parseFloat(bossHp.style.width)<25);
 }
 let pending=false;const schedule=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;syncReadout()})};
 new MutationObserver(schedule).observe(reload,{attributes:true,attributeFilter:['aria-label','disabled']});
 new MutationObserver(schedule).observe($('ammoProgress'),{attributes:true,attributeFilter:['style']});
 new MutationObserver(schedule).observe(health,{attributes:true,attributeFilter:['style']});
 new MutationObserver(schedule).observe($('ammoCount'),{childList:true,characterData:true,subtree:true});
 subscribe(schedule);syncReadout();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();

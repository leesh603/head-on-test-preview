/* Astra presentation. Move the live controls, never clone gameplay state or handlers. */
import {getLocale,subscribe} from './i18n.js?v=324';
import {clearAircraftMatte,aircraftKey} from './aircraft.js?v=324&b=324';
import {clearCrewMatte} from './matte70.js?v=324&b=324';
import {aircraftArt} from './main-ui-art180.js?v=324';
const $=id=>document.getElementById(id);
const el=(tag,cls)=>{const node=document.createElement(tag);if(cls)node.className=cls;return node};
const put=(node,text)=>{if(node&&node.textContent!==text)node.textContent=text};
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
 holder.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">${paths[name]||paths.sortie}</svg>`;
 return holder;
}
// Reuse the production matte algorithm at native resolution. This cleans only
// the hangar illustration; the 144px gameplay sprite and its collision stay intact.
const rawHangarArt={fokker:'./fokker.webp?v=324&b=324',baron_albatros:'./baron_albatros.webp?v=324&b=324',albatros_d2:'./albatros_d2.webp?v=324&b=324',nieuport_italian:'./nieuport.webp?v=324&b=324'};
const hangarKeyFile={fokker_voss:'fokker_f1',fokker_red:'fokker',dh2:'airco_dh2',fokker_e1:'eindecker',fokker_d7_campaign:'fokkerd7',oeffag:'albatros',bristol:'bristol_duo',spad7:'spad',halberstadt:'halberstadt_duo',fokker_campaign:'fokker_standard',fokker:'fokker_standard'};
const artCache=new Map();
function hangarArt(key){
 if(artCache.has(key))return artCache.get(key);
 const src=rawHangarArt[key]||`./${hangarKeyFile[key]||key}.webp?v=324&b=324`;
 const pending=new Promise(resolve=>{const image=new Image();image.onerror=()=>resolve(aircraftArt[key]||'');image.onload=()=>{
  try{
   const scan=document.createElement('canvas');scan.width=image.naturalWidth;scan.height=image.naturalHeight;
   const c=scan.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);
   const pixels=c.getImageData(0,0,scan.width,scan.height),rgba=pixels.data;
   if(key==='nieuport_italian')for(let i=0;i<rgba.length;i+=4){const r=rgba[i],g=rgba[i+1],b=rgba[i+2];if(rgba[i+3]>0&&b>70&&b>r*1.18&&b>g*1.05){rgba[i]=55;rgba[i+1]=132;rgba[i+2]=78}}
   clearAircraftMatte(key,rgba,scan.width,scan.height);clearCrewMatte(key,rgba,scan.width,scan.height);c.putImageData(pixels,0,0);
   let l=scan.width,t=scan.height,r=-1,b=-1;
   for(let y=0;y<scan.height;y++)for(let x=0;x<scan.width;x++)if(rgba[(y*scan.width+x)*4+3]>128){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}
   if(r<l||b<t){resolve('');return}
   const out=document.createElement('canvas');out.width=r-l+1;out.height=b-t+1;out.getContext('2d').drawImage(scan,l,t,out.width,out.height,0,0,out.width,out.height);resolve(out.toDataURL('image/png'));
  }catch{resolve('')}
 };image.src=src});artCache.set(key,pending);return pending;
}
function ring(){
 const r=el('span','astra-dial');r.setAttribute('aria-hidden','true');
 r.innerHTML='<svg viewBox="0 0 100 100"><circle class="dial-track" cx="50" cy="50" r="45"/><circle class="dial-progress" cx="50" cy="50" r="45" pathLength="100"/></svg>';return r;
}
function install(){
 if(!$('hangar')||$('hangar .astra-home'))return;
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
 const launch=el('div','astra-launch'),launchHint=el('p','astra-launch-hint');
 const start=$('start');start.replaceChildren(interfaceIcon('passive','astra-sortie-plane'));
 const startLabel=el('strong'),startEnglish=el('span','astra-sortie-english');start.append(startLabel,startEnglish,interfaceIcon('sortie','astra-sortie-arrow'));
 launch.append(start,launchHint);
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
 function changeAircraft(direction){
  if($('baronAircraftChoice').classList.contains('hidden'))return;
  const current=$('aircraftSelect103').value;const id=current==='baron_albatros'?'baronTriplane':'baronAlbatros';$(id).click();
 }
 previous.addEventListener('click',()=>changeAircraft(-1));next.addEventListener('click',()=>changeAircraft(1));
 let queued=false,lastArt='',lastPilot='';
 const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync()})};
 function sync(){
  const en=getLocale()==='en',selectedButton=$('pilotTabs').querySelector('[data-pilot-id].active');
  if(!selectedButton)return;
  const pilot=selectedButton.dataset.pilotId,aircraftId=aircraftKey($('aircraftSelect103').value,false,pilot);
  put(title,$('hangarName').textContent);
  put(english,$('pilotAlias').textContent);
  put(kicker,en?'PILOT / SELECTED ACE':'파일럿 / 출격 대기');
  put(activeLabel,en?'ACTIVE':'액티브');put(passiveLabel,en?'PASSIVE':'패시브');
  const raw=$('passive103').textContent,index=raw.indexOf(' · ');
  put(passiveName,index>=0?raw.slice(0,index):'');put(passiveDesc,index>=0?raw.slice(index+3):raw);
  const option=$('aircraftSelect103').selectedOptions?.[0];put(airName,(option?.textContent||$('pilotAircraft').textContent).split(' · ')[0]);
  put(airRole,$('pilotAircraft').textContent.split(' · ').slice(1).join(' · '));
  const hasChoice=!$('baronAircraftChoice').classList.contains('hidden');previous.hidden=next.hidden=!hasChoice;
  previous.setAttribute('aria-label',en?'Switch aircraft':'이전 기체');next.setAttribute('aria-label',en?'Switch aircraft':'다음 기체');
  if(aircraftId!==lastArt){lastArt=aircraftId;
   hangarArt(aircraftId).then(url=>{if(lastArt!==aircraftId)return;if(!url){art.hidden=true;art.removeAttribute('src');figure.classList.remove('has-art');figure.classList.add('use-canvas');return}
    art.onload=()=>{if(lastArt!==aircraftId)return;art.hidden=false;figure.classList.add('has-art');figure.classList.remove('use-canvas')};
    art.onerror=()=>{art.hidden=true;figure.classList.remove('has-art');figure.classList.add('use-canvas')};art.src=url;
   });
  }
  art.alt=airName.textContent;
  // Derive display values from the already-rendered authoritative roster, not a second stats table.
  for(const row of $('airframeStats').querySelectorAll('.airframe-rating-row')){
   let value=row.querySelector('.astra-rating-value');if(!value){value=el('small','astra-rating-value');row.append(value)}
   put(value,`${row.querySelectorAll('i.active').length} / 5`);
  }
  const ws=$('weaponSpec').textContent,wd=$('weaponDetail').textContent,parts=ws.split(' · ');
  put(weaponName,parts.shift()||ws);put(weaponMeta,parts.join(' · '));
  put(weaponRate,wd.replace(/게임 연사 기준: (?:총합 )?분당 /,'분당 ').replace(/ · 공중 /,' · ').replace(/Game firing rate: /,''));
  weapon.title=ws+' / '+wd;put(weapon.querySelector('.equipment-label'),en?'ARMAMENT':'무장');
  const baseHp=growth.textContent.match(/(\d+(?:\.\d+)?)\s*HP/);put(hpValue,baseHp?.[1]||'—');put(hpLabel,en?'Durability':'내구도');
  put(railLabel,en?'PILOT ROSTER':'파일럿 선택');put(railCounter,String($('pilotTabs').children.length).padStart(2,'0')+(en?' ACES':' ACES'));
  if(!start.contains(startLabel))start.replaceChildren(interfaceIcon('passive','astra-sortie-plane'),startLabel,startEnglish,interfaceIcon('sortie','astra-sortie-arrow'));
  put(startLabel,en?'SORTIE':'출격');put(startEnglish,en?'TAKE TO THE SKY':'SORTIE');
  start.setAttribute('aria-label',en?'Start sortie':'출격');
  put(launchHint,en?'AUTO FIRE · WASD / ARROWS TO FLY':'자동 사격 · WASD / 방향키로 조종');
  railPrev.setAttribute('aria-label',en?'Previous pilots':'이전 파일럿');railNext.setAttribute('aria-label',en?'Next pilots':'다음 파일럿');
  mobileSettings.setAttribute('aria-label',en?'Settings':'설정');
  for(const button of $('pilotTabs').children){
   const label=button.querySelector('.pilot-tab-label'),alias=button.dataset.pilotAlias||'';
   button.title=alias?((label?.textContent||'')+' · '+alias):(label?.textContent||'');
   let caption=button.querySelector('.astra-pilot-caption');if(!caption){caption=el('small','astra-pilot-caption');button.append(caption)}put(caption,alias);
  }
  if(lastPilot!==pilot){lastPilot=pilot;const tabs=$('pilotTabs');const l=selectedButton.offsetLeft-tabs.offsetLeft;if(l<tabs.scrollLeft||l+selectedButton.offsetWidth>tabs.scrollLeft+tabs.clientWidth)tabs.scrollLeft=Math.max(0,l-tabs.clientWidth/2+selectedButton.offsetWidth/2)}
  document.body.classList.add('boot-ready');
 }
 new MutationObserver(schedule).observe($('pilotTabs'),{childList:true});
 new MutationObserver(schedule).observe($('aircraftSelect103'),{childList:true});
 subscribe(schedule);schedule();
 installHud();
}
function installHud(){
 const reload=$('reload'),ammo=$('ammoHud'),survival=document.querySelector('.flight-survival');if(!reload||!survival)return;
 for(const [id,name]of [['touchSkill','active'],['touchEvade','maneuver']]){
  const button=$(id);
  if(name==='active'){const f=$('central')?.classList.contains('active')?'central':'entente';
   const img=el('img','astra-control-icon astra-skill-emblem');img.alt='';img.decoding='async';
   img.src=`./augmentation-icons/emblem_bare_${f}.webp?v=324`;button.prepend(img,ring());}
  else button.prepend(interfaceIcon(name,'astra-control-icon'),ring());
 }
 const readout=el('div','astra-reload-readout'),caption=el('span'),seconds=el('b'),track=el('span','astra-reload-track'),fill=el('i');track.append(fill);readout.append(caption,seconds,track);survival.append(readout);
 const health=$('healthBar');
 function syncReadout(){
  const en=getLocale()==='en',reloading=ammo.classList.contains('reloading');
  survival.classList.toggle('astra-reloading',reloading);put(caption,en?'RELOADING':'재장전');
  const text=reload.getAttribute('aria-label')||'',remaining=text.match(/(\d+(?:\.\d+)?)\s*s/);
  put(seconds,remaining?remaining[1]+(en?'s':'초'):'');
  const progress=$('ammoProgress').style.width;fill.style.width=reloading?progress:'0%';
  const counts=$('ammoCount').textContent.match(/(\d+)\s*\/\s*(\d+)/);
  if(counts&&+counts[2])ammo.style.setProperty('--astra-ammo',Math.min(100,+counts[1]/+counts[2]*100)+'%');
  survival.classList.toggle('astra-low-health',parseFloat(health.style.width)<30);
 }
 let pending=false;const schedule=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;syncReadout()})};
 new MutationObserver(schedule).observe(reload,{attributes:true,attributeFilter:['aria-label','disabled']});
 new MutationObserver(schedule).observe($('ammoProgress'),{attributes:true,attributeFilter:['style']});
 new MutationObserver(schedule).observe(health,{attributes:true,attributeFilter:['style']});
 new MutationObserver(schedule).observe($('ammoCount'),{childList:true,characterData:true,subtree:true});
 subscribe(schedule);syncReadout();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();

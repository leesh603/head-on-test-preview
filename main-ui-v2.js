import {getLocale,subscribe,t} from './i18n.js?v=hangar2';


const $=id=>document.getElementById(id);
const hangar=$('hangar');

if(hangar){
 const nav=document.createElement('nav');
 nav.id='mainOperations';
 nav.className='main-operations';
 nav.setAttribute('aria-label','Main operations');

 const items=[
  ['sortie','status.waiting'],
  ['ranking','ranking.title'],
  ['coop','mode.coop'],
  ['records',null],
  ['settings','settings.title']
 ];
 for(const [action,key]of items){
  const control=action==='records'?document.createElement('a'):document.createElement('button');
  if(control.tagName==='BUTTON')control.type='button';
  if(action==='records'){control.href='./field-record.html';control.target='_blank';control.rel='noopener'}
  control.dataset.action=action;
  const full=document.createElement('span');full.className='operation-label-full';
  const short=document.createElement('span');short.className='operation-label-short';
  control.append(full,short);nav.append(control);
 }

 const settings=document.createElement('section');
 settings.id='mainSettings';settings.className='main-settings';settings.hidden=true;
 settings.setAttribute('aria-label','Settings');
 const settingSvg=path=>{const icon=document.createElement('span');icon.className='setting-icon';icon.setAttribute('aria-hidden','true');icon.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;return icon};
 const settingPaths={
  sound:'<path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16 9a4 4 0 0 1 0 6m2.5-9a8 8 0 0 1 0 12"/>',
  hifps:'<path d="M4 17a8 8 0 1 1 16 0"/><path d="m12 13 4-4"/><path d="M7 17h10"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.5 2.5 0 1 1 3.3 2.4c-.8.3-1.1.8-1.1 1.6v.3M12 17h.01"/>',
  language:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.2 2.4 3.3 5.4 3.3 9S14.2 18.6 12 21c-2.2-2.4-3.3-5.4-3.3-9S9.8 5.4 12 3Z"/>'
 };
 const makeSetting=(action,path)=>{
  const button=document.createElement('button');button.type='button';button.dataset.setting=action;button.className='setting-row';
  const copy=document.createElement('span');copy.className='setting-copy';
  const name=document.createElement('b'),desc=document.createElement('small');copy.append(name,desc);
  const value=document.createElement('span');value.className='setting-value';
  button.append(settingSvg(path),copy,value);return button;
 };
 const settingsHead=document.createElement('div');settingsHead.className='main-settings-head';
 const settingsTitle=document.createElement('strong'),settingsSubtitle=document.createElement('small');settingsHead.append(settingsTitle,settingsSubtitle);
 const soundButton=makeSetting('sound',settingPaths.sound);
 const hiFpsButton=makeSetting('hifps',settingPaths.hifps);
 const helpButton=makeSetting('help',settingPaths.help);
 const lang=$('localeSelect')?.closest('label');
 if(lang){
  lang.classList.add('setting-row','setting-language');
  const copy=document.createElement('span');copy.className='setting-copy';
  const name=document.createElement('b'),desc=document.createElement('small');copy.append(name,desc);
  lang.prepend(settingSvg(settingPaths.language),copy);
 }
 settings.append(settingsHead,soundButton,hiFpsButton);
 if(lang)settings.append(lang);
 settings.append(helpButton);
 hangar.append(nav,settings);

 const labels=()=>{
  const en=getLocale()==='en';
  const short={sortie:en?'Sortie':'출격',ranking:en?'Ranking':'랭킹',coop:en?'Co-op':'협동',records:en?'Records':'기록',settings:t('settings.title')};
  const full={sortie:t('status.waiting'),ranking:t('ranking.title'),coop:t('mode.coop'),records:en?'Official Battle Record':'공식 전장 기록',settings:t('settings.title')};
  nav.querySelectorAll('[data-action]').forEach(control=>{
   const action=control.dataset.action;
   control.querySelector('.operation-label-full').textContent=full[action];
   control.querySelector('.operation-label-short').textContent=short[action];
  });
  nav.setAttribute('aria-label',en?'Main operations':'주요 메뉴');
  settings.setAttribute('aria-label',t('settings.title'));settingsTitle.textContent=t('settings.title');
  settingsSubtitle.textContent=en?'AUDIO · DISPLAY · CONTROL':'오디오 · 화면 · 조작';
  const setRow=(button,name,desc,value,on)=>{button.querySelector('.setting-copy b').textContent=name;button.querySelector('.setting-copy small').textContent=desc;button.querySelector('.setting-value').textContent=value;button.classList.toggle('is-on',!!on);};
  const soundText=$('sound')?.textContent||t('menu.soundOff'),soundOn=!/OFF/i.test(soundText);
  setRow(soundButton,en?'Sound':'소리',en?'Master game audio':'전체 게임 사운드',soundOn?'ON':'OFF',soundOn);
  let hiFps=false;try{hiFps=localStorage.getItem('headon.hiFps')==='1'}catch(_){}
  setRow(hiFpsButton,en?'Frame rate':'프레임',en?(hiFps?'Use the display\'s highest refresh rate':'Standard mobile frame rate'):(hiFps?'기기 최대 주사율 사용':'모바일 표준 프레임'),hiFps?(en?'HIGH REFRESH':'고주사율'):'60 FPS',hiFps);
  setRow(helpButton,en?'Controls':'조작법',en?'Steering and combat controls':'조종 · 전투 버튼 안내','›',false);
  if(lang){lang.querySelector('.setting-copy b').textContent=en?'Language':'언어';lang.querySelector('.setting-copy small').textContent=en?'Interface language':'인터페이스 언어';}
 };
 const sync=()=>{
  labels();
  const coopSelected=document.body.classList.contains('coop-selected');
  nav.querySelector('[data-action="sortie"]')?.classList.toggle('active',!coopSelected);
  nav.querySelector('[data-action="coop"]')?.classList.toggle('active',coopSelected);
  const coopControl=nav.querySelector('[data-action="coop"]');
  if(coopControl){coopControl.hidden=$('coopMode')?.classList.contains('hidden')??true;coopControl.setAttribute('aria-pressed',String(coopSelected));}
 };

 nav.addEventListener('click',event=>{
  const control=event.target.closest('[data-action]');if(!control||control.tagName==='A')return;
  const action=control.dataset.action;
  if(action==='sortie')$('start')?.click();
  if(action==='ranking'){$('endlessMode')?.click();$('soloRanking')?.click()}
  if(action==='coop'){if(document.body.classList.contains('coop-selected'))$('endlessMode')?.click();else{$('coopMode')?.click();$('coopPanel')?.scrollIntoView?.({block:'nearest'})}}
  if(action==='settings')settings.hidden=!settings.hidden;
  sync();
 });
 settings.addEventListener('click',event=>{
  const action=event.target.closest('[data-setting]')?.dataset.setting;
  if(action==='sound')$('sound')?.click();
  if(action==='hifps'){let on=false;try{on=localStorage.getItem('headon.hiFps')!=='1';localStorage.setItem('headon.hiFps',on?'1':'0')}catch(_){}window.dispatchEvent(new CustomEvent('headon:hifps',{detail:on}))}
  if(action==='help'){$('help')?.click();settings.hidden=true}
  sync();
 });
 document.addEventListener('click',event=>{
  if(settings.hidden||settings.contains(event.target)||event.target.closest('[data-action="settings"]'))return;
  settings.hidden=true;
 });
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
 subscribe(sync);sync();
}

// Direct Astra implementation: all live controls and data bindings are preserved.
import("./astra-interface180.js?v=hangar2");


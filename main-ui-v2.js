import {getLocale,subscribe,t} from './i18n.js?v=331';

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
 const settingsTitle=document.createElement('strong');
 const soundButton=document.createElement('button');soundButton.type='button';soundButton.dataset.setting='sound';
 const helpButton=document.createElement('button');helpButton.type='button';helpButton.dataset.setting='help';
 settings.append(settingsTitle,soundButton,helpButton);
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
  soundButton.textContent=$('sound')?.textContent||t('menu.soundOff');helpButton.textContent=t('menu.help');
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
import("./astra-interface180.js?v=331");

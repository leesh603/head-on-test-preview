import {getLocale,subscribe,t} from './i18n.js?v=sortierhythm20261018&afc=1';


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
  ['online',null],
  ['records',null],
  ['settings','settings.title']
 ];
 for(const [action,key]of items){
  const control=action==='records'?document.createElement('a'):document.createElement('button');
  if(control.tagName==='BUTTON')control.type='button';
  if(action==='records'){control.href='./field-record.html?v=buildfit1&rail=40';control.target='_blank';control.rel='noopener'}
  control.dataset.action=action;
  if(action==='online')control.id='onlineCoopEntry';
  const full=document.createElement('span');full.className='operation-label-full';
  const short=document.createElement('span');short.className='operation-label-short';
  control.append(full,short);nav.append(control);
 }

 const settings=document.createElement('section');
 settings.id='mainSettings';settings.className='main-settings';settings.hidden=true;
 settings.setAttribute('aria-label','Settings');
 // Keep the legacy locale select available to i18n; both entrypoints open the
 // same game-owned settings dialog instead of maintaining a second popup.
 const lang=$('localeSelect')?.closest('label');
 if(lang)settings.append(lang);
 hangar.append(nav,settings);

 const labels=()=>{
  const en=getLocale()==='en';
  const short={sortie:en?'Sortie':'출격',ranking:en?'Ranking':'랭킹',medals:en?'Medals':'훈장',coop:en?'Co-op':'협동',online:en?'Online':'온라인',records:en?'Records':'기록',settings:t('settings.title')};
  const full={sortie:t('status.waiting'),ranking:t('ranking.title'),medals:en?'Service Medals':'전공 훈장',coop:t('mode.coop'),online:en?'Online Co-op':'온라인 Co-op',records:en?'Official Battle Record':'공식 전장 기록',settings:t('settings.title')};
  nav.querySelectorAll('[data-action]').forEach(control=>{
   const action=control.dataset.action;
   control.querySelector('.operation-label-full').textContent=full[action];
   control.querySelector('.operation-label-short').textContent=short[action];
  });
  nav.setAttribute('aria-label',en?'Main operations':'주요 메뉴');

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
  if(action==='online'){$('onlineCoopMode')?.click();$('onlineCoopPanel')?.scrollIntoView?.({block:'nearest'})}
  if(action==='settings')window.dispatchEvent(new CustomEvent('headon:settings'));
  sync();
 });
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
 subscribe(sync);sync();
}

// Direct Astra implementation: all live controls and data bindings are preserved.
import("./astra-interface180.js?v=sortierhythm20261018&afc=1");

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {Game,UPGRADES} from '../engine.js';
import {t,setLocale} from '../i18n.js';

test('live equipment descriptions explain range without engine coordinates',()=>{
 const g=new Game();
 for(const u of UPGRADES)for(const rarity of ['normal','magic','rare']){
  assert.doesNotMatch(g.augmentationDescription(u.id,rarity,g),/\d\s*(?:px|rad)\b|어그로/,u.id);
 }
 assert.match(g.augmentationDescription('mauserAceKiller'),/에이스·정예·일반.*160·54·18/);
});
test('mission briefings identify the actual support and weak-point rewards',()=>{
 setLocale('ko');
 assert.match(t('event.HIGH_VALUE_TARGET.text'),/2차례 교전/);
 for(const id of ['BOMBER_INTERCEPT','RECON_ESCORT'])assert.match(t(`event.${id}.text`),/3차례 교전마다 폭격기 2기/);
 assert.match(t('event.RESCUE.text'),/3차례 교전마다 아군 5기/);
 assert.match(t('event.ACE_CHALLENGE.text'),/강화를 한 번/);
 assert.match(t('event.PHOTO_RECON.text'),/약점 한 곳.*해당 부위.*35%/);
});
test('long equipment popups stay within the visible card above and below their tile',()=>{
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const source=app.slice(app.indexOf('function openBuildPop151('),app.indexOf("document.addEventListener('click',e=>{if(!e.target.closest?.('.build-pop151"));
 for(const [width,height] of [[320,568],[390,844],[1280,800]])for(const tileY of [90,height-95]){
  let popup;
  const node=()=>({style:{setProperty(){}},classList:{toggle(){}},setAttribute(){},append(){},
   get offsetWidth(){return Math.min(320,parseFloat(this.style.maxWidth)||320)},
   get offsetHeight(){return Math.min(650,parseFloat(this.style.maxHeight)||650)}});
  const area={getBoundingClientRect:()=>({left:20,top:60,width:width-40}),
   closest:()=>({getBoundingClientRect:()=>({top:35,bottom:height-25})}),append:p=>popup=p};
  const tile={getBoundingClientRect:()=>({left:50,top:tileY,bottom:tileY+40,width:48}),setAttribute(){}};
  const document={createElement:node,getElementById:id=>id==='build151'?area:{getBoundingClientRect:()=>({top:height-55})}};
  const fn=runInNewContext(source+';openBuildPop151',{document,window:{innerHeight:height,innerWidth:width},rarityName:()=>''});
  fn(tile,{name:'Long equipment',rarity:'legendary',count:1,category:'Equipment',stats:[],desc:'Long description',en:true});
  const top=60+parseFloat(popup.style.top),left=20+parseFloat(popup.style.left);
  assert(top>=43);assert(top+popup.offsetHeight<=height-33);
  assert(left>=20);assert(left+popup.offsetWidth<=width-20);
  assert.equal(popup.style.overflowY,'auto');
 }
});

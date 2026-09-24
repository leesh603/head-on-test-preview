// One shared flow: survival instruments left, boss/warning center, status right. ResizeObserver measures actual boxes.
const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href='./reinforcement151.css?v=304';if(!document.querySelector('link[href*="reinforcement151.css"]'))document.head.append(sheet);
const polished=document.createElement('link');polished.rel='stylesheet';polished.href='./flight-polish156.css?v=304';if(!document.querySelector('link[href*="flight-polish156.css"]'))document.head.append(polished);
const install=()=>{
 const $=id=>document.getElementById(id),viewport=$('viewport'),box=(id,cls)=>{const el=document.createElement('div');if(id)el.id=id;if(cls)el.className=cls;return el},stack=box('flightStack151'),top=box('flightTop151'),survival=box(null,'flight-survival'),status=box(null,'flight-status'),statusPanel=box(null,'flight-status-panel'),center=box('flightCenter156'),notices=box('flightNotices151');
 viewport.append(stack);stack.append(top);
 top.append(survival,center,status,$('coopHud'));status.append(statusPanel);center.append(notices);
 survival.append($('hud'),$('ammoHud'));
 statusPanel.append($('hud').querySelector('.time'),$('ammoHud').querySelector('.compact-kills'),$('xpHud'));
 status.append($('pause'));
 notices.append($('toast'),$('bossArrival'),$('eventMissionHud'),$('campaignHud'));
 center.prepend($('stageBossHud'));
 $('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','일시정지');$('pause').title='일시정지 · ESC';
 const health=$('hud').firstElementChild;health.classList.add('health151');health.querySelector('small').textContent='HP';const icon=health.querySelector('.durability-faction-mark');if(icon){icon.classList.add('healthMark151');health.prepend(icon)}
 $('healthText').replaceChildren();for(const [id,txt]of [['healthCurrent151','100'],['healthSlash151','/'],['healthMax151','100']]){const span=document.createElement('span');span.id=id;span.textContent=txt;$('healthText').append(span)}
 const measure=()=>{const h=top.getBoundingClientRect().height,b=$('stageBossHud').classList.contains('hidden')?0:$('stageBossHud').getBoundingClientRect().height;viewport.style.setProperty('--top-hud-height',h+'px');viewport.style.setProperty('--boss-hud-height',b+'px')};
 new ResizeObserver(measure).observe(stack);new MutationObserver(measure).observe($('stageBossHud'),{attributes:true,attributeFilter:['class']});measure();
 // The same existing reload control rides the touch cluster on coarse/small screens and the ammo group on desktop.
 const compactMedia=window.matchMedia('(max-width:720px), (pointer:coarse)');
 const placeReload=()=>{const reload=$('reload');if(!reload)return;if(compactMedia.matches)$('touch')?.querySelector('.touch-actions')?.prepend(reload);else $('ammoHud')?.append(reload)};
 placeReload();compactMedia.addEventListener?.('change',placeReload);compactMedia.addListener?.(placeReload);
};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();

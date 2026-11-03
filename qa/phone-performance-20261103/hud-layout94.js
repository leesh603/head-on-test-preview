// One shared flow: survival instruments left, boss/warning center, status right. ResizeObserver measures actual boxes.
const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href='./reinforcement151.css?v=tame3';if(!document.querySelector('link[href*="reinforcement151.css"]'))document.head.append(sheet);
const polished=document.createElement('link');polished.rel='stylesheet';polished.href='./flight-polish156.css?v=tame3';if(!document.querySelector('link[href*="flight-polish156.css"]'))document.head.append(polished);
const install=()=>{
 const $=id=>document.getElementById(id),viewport=$('viewport'),box=(id,cls)=>{const el=document.createElement('div');if(id)el.id=id;if(cls)el.className=cls;return el},stack=box('flightStack151'),top=box('flightTop151'),survival=box(null,'flight-survival'),status=box(null,'flight-status'),statusPanel=box(null,'flight-status-panel'),center=box('flightCenter156'),notices=box('flightNotices151');
 viewport.append(stack);stack.append(top);
 top.append(survival,center,status,$('coopHud'));status.append(statusPanel);center.append(notices);
 survival.append($('hud'),$('ammoHud'));
 statusPanel.append($('hud').querySelector('.time'),$('ammoHud').querySelector('.compact-kills'),$('xpHud'));
 status.append($('pause'));
 notices.append($('toast'),$('bossArrival'),$('campaignHud'));
 // Mission card sits top-left under the survival pill, apart from the centred alerts.
 top.append($('eventMissionHud'));
 center.prepend($('stageBossHud'));
 $('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','일시정지');$('pause').title='일시정지 · ESC';
 const health=$('hud').firstElementChild;health.classList.add('health151');health.querySelector('small').textContent='HP';const icon=health.querySelector('.durability-faction-mark');if(icon){icon.classList.add('healthMark151');health.prepend(icon)}
 $('healthText').replaceChildren();for(const [id,txt]of [['healthCurrent151','100'],['healthSlash151','/'],['healthMax151','100']]){const span=document.createElement('span');span.id=id;span.textContent=txt;$('healthText').append(span)}
 // Sizes come from the observer entries (measured after layout), and the CSS variables are written
 // only when a height really changes: reading boxes in a class-mutation callback forced a layout
 // every frame while HUD classes toggled. A hidden boss bar reports 0 through the same observer.
 const bossHud=$('stageBossHud'),last={top:-1,boss:-1};
 const put=(name,key,v)=>{v=Math.round(v);if(last[key]===v)return;last[key]=v;viewport.style.setProperty(name,v+'px')};
 const size=e=>e.borderBoxSize?.[0]?.blockSize??e.target.getBoundingClientRect().height;
 new ResizeObserver(entries=>{for(const e of entries){if(e.target===top)put('--top-hud-height','top',size(e));else if(e.target===bossHud)put('--boss-hud-height','boss',bossHud.classList.contains('hidden')?0:size(e))}}).observe(top);
 if(bossHud)new ResizeObserver(entries=>{for(const e of entries)put('--boss-hud-height','boss',bossHud.classList.contains('hidden')?0:size(e))}).observe(bossHud);
 put('--top-hud-height','top',top.getBoundingClientRect().height);put('--boss-hud-height','boss',bossHud&&!bossHud.classList.contains('hidden')?bossHud.getBoundingClientRect().height:0);
 // The same existing reload control rides the touch cluster on coarse/small screens and the ammo group on desktop.
 const compactMedia=window.matchMedia('(max-width:720px), (pointer:coarse)');
 const placeReload=()=>{const reload=$('reload');if(!reload)return;if(compactMedia.matches)$('touch')?.querySelector('.touch-actions')?.prepend(reload);else $('ammoHud')?.append(reload)};
 placeReload();compactMedia.addEventListener?.('change',placeReload);compactMedia.addListener?.(placeReload);
};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();

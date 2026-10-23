/* Phone lobby (420). Presentation only: the key art and logo own the screen,
   the selected aircraft is named under them, then mode tabs, the sortie
   button and a bottom tab bar. Pilot/aircraft choice moves to the "에이스"
   tab, which simply re-shows the existing hangar rows. Every action is routed
   to the existing controls; nothing here owns game state. */
import {aircraftKey} from './aircraft.js?v=headon-quality-20261023-7d8a4756&art=pilot-recovery2';
import {hangarArt, hangarArtLayout} from './hangar-art.js?v=headon-quality-20261023-7d8a4756&art=pilot-recovery2';
// Same module instances as app.js (identical URLs), read-only: locked aircraft show their real ratings.
import {PLANES} from './engine.js?v=headon-quality-20261023-7d8a4756&ai=1018&art=pilot-recovery2&sig=1019&boss=20261020b&phase=1021';
import {aircraftFeelRatings} from './aircraft-feel174.js?v=headon-quality-20261023-7d8a4756';
import {t} from './i18n.js?v=headon-quality-20261023-7d8a4756&afc=1&art=pilot-recovery2';
import {waitForLobbyIcons} from './lobby-assets-ready.js?v=headon-quality-20261023-7d8a4756';
const mq = matchMedia('(max-width:720px)');
const $ = id => document.getElementById(id);
const en = () => document.documentElement.lang === 'en';
const T = () => en()
  ? { solo: 'Solo Sortie', online: 'Online Co-op', campaign: 'Campaign', soon: 'Campaign is coming soon.', ranking: 'Ranking', aces: 'Aces', medals: 'Medals', home: 'Homepage', settings: 'Settings', active: 'Active', back: 'Lobby', acesTitle: 'Aces', ready: 'Fly this ace', hp: 'Durability', aircraft: 'Aircraft', pilots: 'Pilots', locked: 'Locked · unlocks later', prev: 'Previous aircraft', next: 'Next aircraft', home: 'Homepage', backHome: 'Back to lobby' }
  : { solo: '단독 출격', online: '온라인 협동', campaign: '캠페인', soon: '캠페인은 준비 중입니다.', ranking: '랭킹', aces: '에이스', medals: '훈장', home: '홈페이지', settings: '설정', active: '액티브', back: '로비', acesTitle: '에이스', ready: '이 에이스로 출격 준비', hp: '내구도', aircraft: '기체', pilots: '파일럿', locked: '잠김 · 추후 해금', prev: '이전 기체', next: '다음 기체', backHome: '로비로' };
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const put = (node, text) => { if (node.textContent !== text) node.textContent = text; };
const ICON = { ranking: 'lobby-ic-ranking420.webp?v=lobby1', aces: 'lobby-ic-aces420.webp?v=lobby1', medals: 'lobby-ic-medals420.webp?v=lobby1', home: 'lobby-ic-home420.webp?v=lobby1' };
const LOCK = '<svg viewBox="0 0 12 14" aria-hidden="true"><path d="M3 6V4a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="1.5" y="6" width="9" height="7" rx="1.2" fill="currentColor"/></svg>';

// Roster labels identify the ace, including siblings and both crew members.
const MOBILE_PILOT_NAMES420 = {
  ko: {baron:'만프레드',voss:'포스',boelcke:'뵐케',immelmann:'임멜만',udet:'우데트',fonck:'폰크',collishaw:'콜리쇼',baracca:'바라카',guynemer:'기느메르',bishop:'비숍',goering:'괴링',mannock:'매녹',mckeever:'맥키버\n& 파월',huffzky:'후프츠키\n& 에만',hawker:'호커',berthold:'베르토홀트',jacobs:'야콥스',rickenbacker:'리켄바커',ball:'볼',barker:'바커',luke:'루크',brumowski:'브루모프스키',gontermann:'곤터만',wolff:'볼프',loewenhardt:'뢰벤하르트',mccudden:'맥커든',nungesser:'눙게서',lothar:'로타르',sachsenberg:'작센베르크',proctor:'프록터',schleich:'슐라이히',lufbery:'러프베리'},
  en: {baron:'Manfred',voss:'Voss',boelcke:'Boelcke',immelmann:'Immelmann',udet:'Udet',fonck:'Fonck',collishaw:'Collishaw',baracca:'Baracca',guynemer:'Guynemer',bishop:'Bishop',goering:'Göring',mannock:'Mannock',mckeever:'McKeever\n& Powell',huffzky:'Huffzky\n& Ehmann',hawker:'Hawker',berthold:'Berthold',jacobs:'Jacobs',rickenbacker:'Rickenbacker',ball:'Ball',barker:'Barker',luke:'Luke',brumowski:'Brumowski',gontermann:'Gontermann',wolff:'Wolff',loewenhardt:'Loewenhardt',mccudden:'McCudden',nungesser:'Nungesser',lothar:'Lothar',sachsenberg:'Sachsenberg',proctor:'Proctor',schleich:'Schleich',lufbery:'Lufbery'}
};
function mobilePilotName420(id, label, locale) {
  return MOBILE_PILOT_NAMES420[locale === 'en' ? 'en' : 'ko'][id] || label.trim();
}

// Alpha bounds of the unchanged 1254px crew busts. Head bounds keep both
// people inside narrow cards while the painted shoulders meet the card floor.
const MOBILE_CREW_BOUNDS420 = {huffzky:{box:[55,227,1249,1117],heads:[290,1015]},mckeever:{box:[6,87,1251,1150],heads:[210,1090]}};
function mobileCrewPortraitLayout420(id, width, height) {
  const bounds = MOBILE_CREW_BOUNDS420[id];
  if (!bounds || !(width > 0 && height > 0)) return null;
  const [left, top, right, bottom] = bounds.box, center = (left + right) / 2;
  const fit = Math.min(width, height) / 1254;
  const headWidth = 2 * Math.max(center - bounds.heads[0], bounds.heads[1] - center);
  const scale = Math.min(height * .96 / (bottom - top), width * .98 / headWidth) / fit;
  return {scale, x: -(center - 627) * fit * scale, y: height * .48 - (bottom - 627) * fit * scale};
}
function fitMobileCrew420(image, id) {
  const layout = mobileCrewPortraitLayout420(id, image.clientWidth, image.clientHeight);
  image.toggleAttribute('data-crew-fit', !!layout);
  for (const [name, value] of Object.entries(layout || {scale:1,x:0,y:0})) image.style.setProperty('--crew-mobile-' + name, String(value) + (name === 'scale' ? '' : 'px'));
}

/* Art without an authored layout (e.g. not-yet-unlocked aircraft) is fitted by
   its alpha bounds so every aircraft fills the stage the same way. */
const alphaBox = new Map();
function alphaFit(img, w, h) {
  const src = img.currentSrc || img.src, nw = img.naturalWidth, nh = img.naturalHeight;
  if (!src || !nw || !nh || !w || !h) return null;
  let box = alphaBox.get(src);
  if (!box) {
    try {
      const c = document.createElement('canvas'); c.width = nw; c.height = nh;
      const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, nw, nh).data; let l = nw, r = -1, t = nh, b = -1;
      for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) if (d[(y * nw + x) * 4 + 3] > 24) { if (x < l) l = x; if (x > r) r = x; if (y < t) t = y; if (y > b) b = y; }
      box = r < 0 ? { l: 0, t: 0, w: nw, h: nh } : { l, t, w: r - l + 1, h: b - t + 1 };
    } catch { box = { l: 0, t: 0, w: nw, h: nh }; }
    alphaBox.set(src, box);
  }
  const s0 = Math.min(w / nw, h / nh), k = Math.min(w / (box.w * s0), h / (box.h * s0)) * .96;
  const cx = (box.l + box.w / 2 - nw / 2) * s0, cy = (box.t + box.h / 2 - nh / 2) * s0;
  return { scale: k, x: -cx * k, y: -cy * k };
}

function install() {
  const hangar = $('hangar'), stage = hangar?.querySelector('.astra-stage'), launch = hangar?.querySelector('.astra-launch');
  const nav = $('mainOperations'), start = $('start');
  if (!stage || !launch || !nav || !start || !$('astraPilotTitle') || !hangar.querySelector('.astra-aircraft h2')) return false;
  if (hangar.dataset.lobby420) return true;
  hangar.dataset.lobby420 = '1';
  const home = hangar.querySelector('.astra-home');

  /* top: pilot chip (opens Aces) + settings */
  const top = el('div', 'lobby-top');
  const chip = el('button', 'lobby-profile'); chip.type = 'button';
  const chipImg = el('img'); chipImg.alt = ''; const chipCopy = el('span'); const chipName = el('b'), chipSub = el('small');
  chipCopy.append(chipName, chipSub); chip.append(chipImg, chipCopy);
  const gear = el('button', 'lobby-settings'); gear.type = 'button';
  gear.append(Object.assign(el('img'), { src: 'lobby-ic-settings420.svg?v=lobby1', alt: '' }));
  top.append(chip, gear);


  /* mode tabs */
  const modes = el('div', 'lobby-modes'); modes.setAttribute('role', 'tablist');
  const mSolo = el('button', 'on'), mOnline = el('button'), mCamp = el('button', 'locked');
  for (const b of [mSolo, mOnline, mCamp]) { b.type = 'button'; b.setAttribute('role', 'tab'); modes.append(b); }
  mSolo.setAttribute('aria-selected', 'true'); mCamp.setAttribute('aria-disabled', 'true');
  const note = el('p', 'lobby-note'); note.hidden = true;
  launch.prepend(modes, note);

  /* bottom tabs */
  const tabs = el('nav', 'lobby-tabs');
  const tab = (key, tag = 'button') => { const b = el(tag, 'lobby-tab'); b.dataset.tab = key; if (tag === 'button') b.type = 'button'; b.append(Object.assign(el('img'), { src: ICON[key], alt: '' }), el('span')); tabs.append(b); return b; };
  const tRank = tab('ranking'), tAces = tab('aces'), tMedals = tab('medals'), tHome = tab('home', 'a');
  const records = nav.querySelector('[data-action="records"]');
  tHome.href = records?.getAttribute('href') || './field-record.html'; tHome.target = '_blank'; tHome.rel = 'noopener';
  home.append(top, tabs);


  /* Aces screen: own layout, every control routed to the existing roster */
  const ap = el('section', 'lobby-aces-panel'); ap.setAttribute('aria-label', 'Aces');
  const TRI = d => `<svg viewBox="0 0 20 28" aria-hidden="true"><path d="${d}"/></svg>`;
  ap.innerHTML = '<div class="lap-head"><button type="button" class="lap-back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg></button><h2></h2><div class="lap-seg"><button type="button" data-f="central"><img alt=""><span></span></button><button type="button" data-f="entente"><img alt=""><span></span></button></div></div>'
    + '<div class="lap-hero"><div class="lap-pt"><img alt=""></div><div class="lap-info"><h3></h3><small class="lap-ep"></small><div class="lap-sk act"><i></i><span><b></b><em></em></span></div><div class="lap-sk pas"><i></i><span><b></b><em></em></span></div></div></div>'
    + '<div class="lap-air"><div class="lap-label"><span class="lap-al"></span><span class="lap-dots"></span></div>'
    + '<div class="lap-stage"><button type="button" class="lap-arrow prev">' + TRI('M17 2 3 14l14 12z') + '</button><div class="lap-fig"><img alt=""><span class="lap-lock"></span></div><button type="button" class="lap-arrow next">' + TRI('M3 2l14 12L3 26z') + '</button></div>'
    + '<h4></h4><small class="lap-meta"></small><div class="lap-bars"></div></div>'
    + '<div class="lap-pilots"><div class="lap-label"><span class="lap-pl"></span><span class="lap-count"></span></div><div class="lap-grid"></div></div>'
    + '<div class="lap-foot"><button type="button" class="lap-go"></button></div>';
  home.append(ap);
  const q = s => ap.querySelector(s);
  ap.querySelectorAll('.lap-seg button').forEach(b => b.addEventListener('click', () => $(b.dataset.f)?.click()));
  q('.lap-go').addEventListener('click', () => setAces(false));
  q('.lap-grid').addEventListener('click', e => { const b = e.target.closest('[data-pick]'); if (b) $('pilotTabs').querySelector(`[data-pilot-id="${b.dataset.pick}"]`)?.click(); });
  /* Aircraft carousel: every option of the live select, in order. Usable ones
     are selected as you land on them; locked ones (disabled/hidden) are only
     previewed, so future unlocks slot in without new UI. */
  const optLocked = o => o.disabled || o.hidden || !!o.parentElement?.disabled;
  const optName = o => (o.textContent.split(' · ').find(s => /\(/.test(s)) || o.textContent.split(' · ').pop()).replace(/\s*\(.*$/, '').trim();
  let view = -1, viewPilot = '';
  const step = dir => {
    const sel = $('aircraftSelect103'); const n = sel?.options.length || 0; if (n < 2 || sel.disabled) return;
    view = ((view < 0 ? sel.selectedIndex : view) + dir + n) % n;
    const o = sel.options[view];
    if (!optLocked(o)) { sel.value = o.value; sel.dispatchEvent(new Event('change', {bubbles: true})); }
    schedule();
  };
  q('.lap-arrow.prev').addEventListener('click', () => step(-1));
  q('.lap-arrow.next').addEventListener('click', () => step(1));
  q('.lap-back').addEventListener('click', () => setAces(false));
  const iconFrom = (sel, slot) => { const svg = hangar.querySelector(sel + ' .astra-ability-icon svg'); if (svg && slot.dataset.src !== svg.outerHTML) { slot.dataset.src = svg.outerHTML; slot.innerHTML = svg.outerHTML; } };
  const syncAces = L => {
    put(q('.lap-head h2'), L.acesTitle); put(q('.lap-go'), L.ready);
    ap.querySelectorAll('.lap-seg button').forEach(b => { const src = $(b.dataset.f); if (!src) return; const img = src.querySelector('img'); if (img && b.firstChild.getAttribute('src') !== img.getAttribute('src')) b.firstChild.setAttribute('src', img.getAttribute('src')); put(b.lastChild, src.textContent.trim()); b.classList.toggle('on', src.classList.contains('active')); });
    const portrait = $('hangarPortrait'); if (portrait?.src && q('.lap-pt img').src !== portrait.src) q('.lap-pt img').src = portrait.src;
    put(q('.lap-hero h3'), $('astraPilotTitle').textContent.trim());
    put(q('.lap-ep'), (hangar.querySelector('.astra-pilot-english')?.textContent || '').trim());
    for (const [cls, src] of [['.act', '.astra-active'], ['.pas', '.astra-passive']]) {
      const box = q('.lap-sk' + cls); iconFrom('.skill-info ' + src, box.firstChild);
      put(box.querySelector('b'), (hangar.querySelector('.skill-info ' + src + ' .astra-ability-copy b')?.textContent || '').trim());
      put(box.querySelector('em'), (hangar.querySelector('.skill-info ' + src + ' .astra-ability-copy p')?.textContent || '').trim());
    }
    const sel = $('aircraftSelect103'), pilot = $('pilotTabs').querySelector('[data-pilot-id].active')?.dataset.pilotId || '';
    if (pilot !== viewPilot) { viewPilot = pilot; view = -1; }
    const n = sel?.options.length || 0;
    if (view < 0 || view >= n || (!optLocked(sel.options[view]) && view !== sel.selectedIndex)) view = sel ? sel.selectedIndex : 0;
    const previewing = n > 0 && view !== sel.selectedIndex;
    ap.classList.toggle('lap-preview', previewing);
    ap.classList.toggle('lap-single', n < 2);
    put(q('.lap-al'), L.aircraft); put(q('.lap-pl'), L.pilots);
    q('.lap-arrow.prev').setAttribute('aria-label', L.prev); q('.lap-arrow.next').setAttribute('aria-label', L.next);
    q('.lap-back').setAttribute('aria-label', L.backHome);
    const dotKey = n + ':' + view + ':' + (sel ? [...sel.options].map(o => optLocked(o) ? 1 : 0).join('') : '');
    if (q('.lap-dots').dataset.k !== dotKey) {
      q('.lap-dots').dataset.k = dotKey;
      q('.lap-dots').innerHTML = n > 1 ? [...sel.options].map((o, i) => `<i class="${i === view ? 'on' : ''}${optLocked(o) ? ' lock' : ''}"></i>`).join('') : '';
    }
    put(q('.lap-lock'), previewing ? sel.options[view].dataset.unlockProgress || L.locked : '');
    const fig = q('.lap-fig img');
    if (previewing) {
      const key = aircraftKey(sel.options[view].value, false, pilot);
      if (fig.dataset.key !== key) { fig.dataset.key = key; fig.hidden = true; hangarArt(key).then(url => { if (fig.dataset.key === key && url) { fig.src = url; fig.hidden = false; } }); }
      const o = sel.options[view], plane = PLANES[o.value];
      put(q('.lap-air h4'), optName(o));
      const owner = (o.textContent.match(/\(\u2060?\s*([^)]*)\)/) || [])[1] || '';
      put(q('.lap-meta'), [plane?.tierLabel || '', owner.trim()].filter(Boolean).join(' · '));
    } else {
      const art = hangar.querySelector('.astra-aircraft-art'); fig.dataset.key = '';
      if (art?.getAttribute('src') && !art.hidden) { if (fig.getAttribute('src') !== art.getAttribute('src')) fig.src = art.getAttribute('src'); fig.hidden = false; } else fig.hidden = true;
      const h2 = hangar.querySelector('.astra-aircraft h2');
      put(q('.lap-air h4'), (h2.firstChild?.nodeType === 3 ? h2.firstChild.textContent : h2.textContent).trim());
      const owner = (h2.querySelector('.ho-air-owner')?.textContent || '').trim();
      const tier = ($('pilotAircraft')?.textContent.split(' · ').find(s => /TIER/.test(s)) || '').trim();
      const role = (hangar.querySelector('.astra-aircraft-heading p')?.textContent || '').split(' · ').filter(s => !/TIER/.test(s)).join(' · ').trim();
      put(q('.lap-meta'), [tier, owner, role].filter(Boolean).join(' · '));
    }
    const layout = hangarArtLayout(aircraftKey(previewing ? sel.options[view].value : sel.value, false, pilot), fig.clientWidth || 240, fig.clientHeight || 150) || (fig.complete ? alphaFit(fig, fig.clientWidth, fig.clientHeight) : null);
    fig.toggleAttribute('data-hangar-fit', !!layout);
    for (const [name, value] of Object.entries(layout || {scale: 1, x: 0, y: 0})) fig.style.setProperty('--hangar-art-' + name, String(value) + (name === 'scale' ? '' : 'px'));
    q('.lap-pt').classList.toggle('duo', pilot === 'huffzky' || pilot === 'mckeever');
    fitMobileCrew420(q('.lap-pt img'), pilot);
    let rows = [...($('airframeStats')?.querySelectorAll('.airframe-rating-row') || [])].map(r => [r.querySelector('b')?.textContent.trim() || '', r.querySelectorAll('i.active').length]);
    let hp = (hangar.querySelector('.astra-base-hp b')?.textContent || '').trim();
    if (previewing) {
      const plane = PLANES[sel.options[view].value], ratings = aircraftFeelRatings(plane);
      rows = ratings ? ['speed', 'turn', 'retention', 'acceleration', 'growth'].map(k => [t(`ui.airframeRating.${k}`), ratings[k]]) : [];
      hp = plane?.hp != null ? String(plane.hp) : '';
    }
    const barKey = JSON.stringify([rows, hp, L.hp]);
    if (q('.lap-bars').dataset.k !== barKey) {
      q('.lap-bars').dataset.k = barKey;
      q('.lap-bars').innerHTML = rows.map(([n, v]) => `<span>${n}</span><u>${[0, 1, 2, 3, 4].map(k => `<s class="${k < v ? 'on' : ''}"></s>`).join('')}</u><em>${v}</em>`).join('') + (hp ? `<span>${L.hp}</span><u class="hp"></u><em>${hp}</em>` : '');
    }
    const tabs = [...$('pilotTabs').querySelectorAll('[data-pilot-id]')];
    put(q('.lap-count'), String(tabs.length));
    const gridKey = tabs.map(b => b.dataset.pilotId + (b.classList.contains('active') ? '*' : '') + (b.disabled ? '!' : '')).join() + document.documentElement.lang;
    if (q('.lap-grid').dataset.k !== gridKey) {
      q('.lap-grid').dataset.k = gridKey;
      q('.lap-grid').replaceChildren(...tabs.map(b => { const c = el('button', (b.classList.contains('active') ? 'on' : '') + (b.disabled ? ' lock' : '')); c.type = 'button'; c.dataset.pick = b.dataset.pilotId; c.disabled = b.disabled; c.title = b.title;
        const label = b.querySelector('.pilot-tab-label')?.textContent.trim() || '';
        c.setAttribute('aria-label', label); if (!c.title) c.title = label;
        const img = el('img'); img.alt = ''; img.src = b.querySelector('img')?.src || ''; const s = el('span'); s.textContent = mobilePilotName420(b.dataset.pilotId, label, document.documentElement.lang); c.append(img, s); return c; }));
    }
  };

  const setAces = open => { document.body.classList.toggle('lobby-aces', open); tAces.classList.toggle('on', open); tAces.setAttribute('aria-pressed', String(open)); if (open) { scrollTo(0, 0); ap.scrollTop = 0; } };
  tAces.addEventListener('click', () => setAces(!document.body.classList.contains('lobby-aces')));
  chip.addEventListener('click', () => setAces(true));
  tRank.addEventListener('click', () => nav.querySelector('[data-action="ranking"]')?.click());
  tMedals.addEventListener('click', () => $('serviceRecordEntry')?.click());
  gear.addEventListener('click', () => window.dispatchEvent(new CustomEvent('headon:settings')));
  mSolo.addEventListener('click', () => { note.hidden = true; });
  mOnline.addEventListener('click', () => { note.hidden = true; nav.querySelector('[data-action="online"]')?.click(); });
  let noteTimer = 0;
  mCamp.addEventListener('click', () => { note.textContent = T().soon; note.hidden = false; clearTimeout(noteTimer); noteTimer = setTimeout(() => { note.hidden = true; }, 2200); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('lobby-aces') && !document.querySelector('#modal:not(.hidden)')) setAces(false); });

  let queued = false;
  const sync = () => {
    queued = false;
    const L = T();
    put(mSolo, L.solo); put(mOnline, L.online);
    if (mCamp.dataset.lang !== document.documentElement.lang) { mCamp.dataset.lang = document.documentElement.lang; mCamp.innerHTML = LOCK + '<span></span>'; }
    put(mCamp.lastChild, L.campaign); if (start.dataset.lobbyMode !== L.solo) start.dataset.lobbyMode = L.solo;
    put(tRank.lastChild, L.ranking); put(tAces.lastChild, L.aces); put(tMedals.lastChild, L.medals); put(tHome.lastChild, L.home + ' ↗');
    gear.setAttribute('aria-label', L.settings); gear.title = L.settings;
    const portrait = $('hangarPortrait');
    if (portrait?.src && chipImg.src !== portrait.src) chipImg.src = portrait.src;
    put(chipName, $('astraPilotTitle').textContent.trim());
    const h2 = hangar.querySelector('.astra-aircraft h2');
    put(chipSub, (h2.firstChild?.nodeType === 3 ? h2.firstChild.textContent : h2.textContent).trim());
    syncAces(L);
  };
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(sync); } };
  const layoutResize = new ResizeObserver(schedule);
  for (const node of [q('.lap-fig img'), q('.lap-pt img')]) layoutResize.observe(node);
  q('.lap-fig img').addEventListener('load', schedule);
  // The logo sits in the dark band between the key art and the launch column.
  new ResizeObserver(() => document.body.style.setProperty('--lobby-launch-h', Math.round(launch.getBoundingClientRect().height) + 'px')).observe(launch);
  new MutationObserver(schedule).observe(hangar, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['src', 'class'] });
  new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  const apply = () => { document.body.classList.toggle('lobby420', mq.matches); if (!mq.matches) setAces(false); };
  mq.addEventListener?.('change', apply);
  apply(); sync();
  // Installation is not readiness: all four labelled controls must have decoded icons.
  waitForLobbyIcons(tabs,window.HEADON_GATE).then(()=>{
    window.HEADON_LOBBY_READY = true;
    window.dispatchEvent(new Event('headon:lobby-ready'));
  }).catch(error=>{
    window.HEADON_LOBBY_ERROR = error;
    window.dispatchEvent(new Event('headon:lobby-error'));
  });
  return true;
}

if (!install()) {
  const obs = new MutationObserver(() => { if (install()) obs.disconnect(); });
  obs.observe(document.body, { childList: true, subtree: true });
}



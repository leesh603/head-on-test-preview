/* Hangar compact (Phase 2). Presentation only: an aircraft sheet toggle and
   tap-to-read skill badges on phones. Never clones state, never touches
   handlers of existing controls. */
const mq = matchMedia('(max-width:720px)');
const t = () => document.documentElement.lang === 'en'
  ? { open: 'Details', close: 'Close' }
  : { open: '상세 보기', close: '닫기' };

function installAircraft() {
  const sec = document.querySelector('#hangar .astra-aircraft');
  if (!sec || sec.querySelector('.ho-air-more')) return !!sec;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'ho-air-more';
  const sync = () => {
    const open = sec.classList.contains('ho-open');
    btn.textContent = open ? t().close : t().open;
    btn.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('ho-sheet-open', open);
  };
  const set = open => { sec.classList.toggle('ho-open', open); sync(); };
  btn.addEventListener('click', e => { e.stopPropagation(); set(!sec.classList.contains('ho-open')); });
  document.addEventListener('click', e => {
    if (sec.classList.contains('ho-open') && !sec.contains(e.target)) set(false);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && sec.classList.contains('ho-open')) set(false); });
  mq.addEventListener?.('change', () => set(false));
  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  sec.append(btn);
  sync();
  return true;
}

/* Skill details (phone + PC): tapping a skill opens a card with the full
   in-game description and, for the active, its duration and cooldown.
   Read-only: the numbers come from the same engine/i18n module instances the
   game loaded (resolved by URL so no second copy is evaluated). */
const moduleURL = name => performance.getEntriesByType('resource').map(e => e.name)
  .find(n => new RegExp('/' + name.replace('.', '\\.') + '(\\?|$)').test(n));
let modsPromise;
const mods = () => modsPromise ||= (async () => {
  const eu = moduleURL('engine.js?v=509'), iu = moduleURL('i18n.js');
  if (!eu || !iu) return null;
  try { const [engine, i18n] = await Promise.all([import(eu), import(iu)]); return { engine, i18n }; } catch { return null; }
})();

function currentLoadout(m) {
  const pilot = document.querySelector('#pilotTabs button.active')?.dataset.pilotId;
  const { PILOTS, PILOT_BALANCE } = m.engine;
  const p = pilot && PILOTS[pilot];
  if (!p) return null;
  const hunterName = m.i18n.activeName('baron:baron_albatros', '태양을 등진 사냥꾼');
  const hunter = pilot === 'baron' && document.getElementById('skillName')?.textContent.trim() === hunterName;
  const id = hunter ? 'baron:baron_albatros' : pilot;
  const plane = hunter ? 'baron_albatros' : '';
  const desc = hunter ? '4초간 전방 범위의 적을 제압하고 후방타격 보너스를 적용합니다. 실제 후방에서 공격하면 추가 피해 +20%.' : p.desc;
  const passiveDesc = hunter ? '이동속도·선회력 +12%.' : p.passiveDesc;
  let duration = 0, cooldown = 0;
  try {
    const G = m.engine.Game.prototype;
    const fake = { pilot, plane, cooldownMult: 1, skillEnhanced: false, isRedHunter: () => hunter, skillDuration: G.skillDuration, skillRecovery: G.skillRecovery };
    duration = G.skillDuration.call(fake);
    cooldown = G.skillCooldown.call(fake);
  } catch { cooldown = hunter ? PILOT_BALANCE?.cooldowns?.baron_albatros : p.cooldown; }
  return {
    active: m.i18n.pilotDescription(id, desc),
    passive: m.i18n.passiveDescription(id, passiveDesc),
    duration, cooldown
  };
}

const fmt = n => (Math.round(n * 10) / 10).toString();

async function fillDetail(item) {
  let pop = item.querySelector('.ho-skill-pop');
  if (!pop) { pop = document.createElement('div'); pop.className = 'ho-skill-pop'; pop.setAttribute('role', 'note'); item.append(pop); }
  const en = document.documentElement.lang === 'en';
  const isActive = item.classList.contains('astra-active');
  const name = item.querySelector('.astra-ability-copy b')?.textContent.trim() || '';
  const short = item.querySelector('.astra-ability-copy p')?.textContent.trim() || '';
  const render = (text, meta) => {
    pop.replaceChildren();
    const k = document.createElement('small'); k.className = 'ho-skill-kind'; k.textContent = isActive ? 'ACTIVE' : 'PASSIVE';
    const h = document.createElement('strong'); h.textContent = name;
    const d = document.createElement('p'); d.textContent = text;
    pop.append(k, h, d);
    if (meta?.length) {
      const row = document.createElement('div'); row.className = 'ho-skill-meta';
      for (const [label, value] of meta) { const c = document.createElement('span'); const b = document.createElement('b'); b.textContent = value; c.append(label + ' ', b); row.append(c); }
      pop.append(row);
    }
  };
  render(short);
  const m = await mods();
  const data = m && currentLoadout(m);
  if (!data || !item.classList.contains('ho-tip')) return;
  if (isActive) {
    const meta = [];
    if (data.duration > 0) meta.push([en ? 'Duration' : '지속', fmt(data.duration) + (en ? 's' : '초')]);
    if (data.cooldown > 0) meta.push([en ? 'Cooldown' : '재사용', fmt(data.cooldown) + (en ? 's' : '초')]);
    render(data.active || short, meta);
  } else {
    render(data.passive || short);
  }
}

function installSkills() {
  const info = document.querySelector('#hangar .skill-info');
  const items = info ? [...info.querySelectorAll('.astra-ability')] : [];
  if (!items.length || info.dataset.hoTips) return !!items.length;
  info.dataset.hoTips = '1';
  const close = () => items.forEach(i => { i.classList.remove('ho-tip'); i.setAttribute('aria-expanded', 'false'); });
  items.forEach(item => {
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    item.setAttribute('aria-expanded', 'false');
    const toggle = e => {
      e.stopPropagation();
      const open = !item.classList.contains('ho-tip');
      close();
      item.classList.toggle('ho-tip', open);
      item.setAttribute('aria-expanded', String(open));
      if (open) fillDetail(item);
    };
    item.addEventListener('click', toggle);
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(e); } });
  });
  document.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  mq.addEventListener?.('change', close);
  // A new pilot means new text: never leave a stale card open.
  new MutationObserver(close).observe(document.getElementById('skillName') || info, { childList: true, characterData: true, subtree: true });
  return true;
}

/* Key-art lobby (phone): the art and the logo end where the pilot row
   starts. Measures only; writes one CSS variable on <body>. */
function installArt() {
  const stage = document.querySelector('#hangar .astra-stage');
  const hero = document.querySelector('#hangar .astra-hero');
  if (!stage || !hero) return false;
  if (stage.dataset.hoArt) return true;
  stage.dataset.hoArt = '1';
  const set = () => {
    if (!mq.matches) { document.body.style.removeProperty('--ho-art-h'); return; }
    if (document.body.classList.contains('ho-sheet-open')) return;
    const s = stage.getBoundingClientRect(), h = hero.getBoundingClientRect();
    if (!s.height || !h.height) return;
    document.body.style.setProperty('--ho-art-h', Math.round(h.top - s.top + 34) + 'px');
  };
  const ro = new ResizeObserver(set);
  ro.observe(stage); ro.observe(hero);
  addEventListener('resize', set);
  mq.addEventListener?.('change', set);
  set();
  return true;
}

/* Icon-only nav: keep a hover tooltip / accessible name in the live language. */
function installNavTitles() {
  const nav = document.getElementById('mainOperations');
  if (!nav) return false;
  if (nav.dataset.hoTitles) return true;
  nav.dataset.hoTitles = '1';
  const sync = () => nav.querySelectorAll(':scope>button,:scope>a').forEach(b => {
    const l = b.querySelector('.operation-label-full') || b.querySelector('.operation-label-short');
    const txt = (l ? l.textContent : b.textContent).trim();
    if (txt) b.title = txt;
  });
  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  sync();
  return true;
}

function install() { return installAircraft() & installSkills() & installArt() & installNavTitles(); }

if (!install()) {
  const obs = new MutationObserver(() => { if (install()) obs.disconnect(); });
  obs.observe(document.body, { childList: true, subtree: true });
}

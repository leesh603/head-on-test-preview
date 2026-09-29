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
      if (!mq.matches) return;
      e.stopPropagation();
      const open = !item.classList.contains('ho-tip');
      close();
      item.classList.toggle('ho-tip', open);
      item.setAttribute('aria-expanded', String(open));
    };
    item.addEventListener('click', toggle);
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(e); } });
  });
  document.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  // A new pilot means new text: never leave a stale bubble open.
  new MutationObserver(close).observe(document.getElementById('skillName') || info, { childList: true, characterData: true, subtree: true });
  return true;
}

function install() { return installAircraft() & installSkills(); }

if (!install()) {
  const obs = new MutationObserver(() => { if (install()) obs.disconnect(); });
  obs.observe(document.body, { childList: true, subtree: true });
}

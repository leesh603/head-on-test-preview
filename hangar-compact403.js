/* Hangar compact (Phase 2). Presentation only: adds one toggle that opens the
   full aircraft sheet on phones. Never clones state, never touches handlers
   of existing controls. */
const mq = matchMedia('(max-width:720px)');
const t = () => document.documentElement.lang === 'en'
  ? { open: 'Details', close: 'Close' }
  : { open: '상세', close: '닫기' };

function install() {
  const sec = document.querySelector('#hangar .astra-aircraft');
  if (!sec || sec.querySelector('.ho-air-more')) return !!sec;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'ho-air-more';
  const sync = () => {
    const open = sec.classList.contains('ho-open');
    btn.textContent = open ? t().close : t().open;
    btn.setAttribute('aria-expanded', String(open));
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

if (!install()) {
  const obs = new MutationObserver(() => { if (install()) obs.disconnect(); });
  obs.observe(document.body, { childList: true, subtree: true });
}

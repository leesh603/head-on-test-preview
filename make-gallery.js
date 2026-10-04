// HEAD-ON asset DB gallery generator.
// Scans the live asset set + asset-bank and writes asset-gallery.html (tabbed, searchable).
// Run: node make-gallery.js   (from repo root)
const fs = require('fs');
const path = require('path');

const EXTS = new Set(['.webp', '.png', '.jpg', '.jpeg']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'verdun-review', 'maan-20261003', 'tactical-identity-20261003', 'src-png', 'qa', 'tests', 'tools']);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name).replace(/\\/g, '/');
    if (e.isDirectory()) {
      const top = p.split('/')[0];
      if (!SKIP_DIRS.has(top)) walk(p, out);
    } else if (EXTS.has(path.extname(e.name).toLowerCase())) {
      out.push(p);
    }
  }
  return out;
}

const files = walk('.');

// --- aircraft key sets from aircraft.js ---
const acSrc = fs.readFileSync('aircraft.js', 'utf8');
const wingspanKeys = new Set((acSrc.match(/WINGSPAN_M=\{([^}]+)\}/)?.[1].match(/[a-z0-9_]+(?=:)/g)) || []);
const paintedKeys = new Set((acSrc.match(/PAINTED_KEYS=\[([^\]]+)\]/)?.[1].match(/'([^']+)'/g) || []).map(s => s.slice(1, -1)));

const genericPlane = k => paintedKeys.has(k) || wingspanKeys.has(k);
const aceVariant = k => {
  if (!k.includes('_')) return false;
  const tail = k.split('_').slice(1).join('_');
  // ace livery: prefix_person_planetype or jastaN_planetype
  return [...genericPlane.__keys||(genericPlane.__keys=[...wingspanKeys, ...paintedKeys])].some(g => k !== g && (k.endsWith('_' + g)));
};

// --- categorization ---
const cats = {
  planes: { label: '기체 (인게임)', groups: [['기본·대형', []], ['에이스·리버리', []]] },
  squads: { label: '편대·엘리트', groups: [['스프라이트', []]] },
  boss: { label: '보스', groups: {} },
  ground: { label: '지상·함선·기구', groups: [['유닛', []]] },
  terrain: { label: '지형·맵', groups: [['타일·맵', []]] },
  fx: { label: 'FX', groups: [['FX', []]] },
  portraits: { label: '초상화·컷인', groups: [['초상화', []], ['컷인·기타', []]] },
  icons: { label: '아이콘', groups: [['아이콘', []]] },
  hud: { label: 'HUD·UI', groups: [['요소', []]] },
  bank: { label: '에셋 뱅크 (보관)', groups: {} },
  mech: { label: 'mech 변형', groups: [['기체', []]] },
  misc: { label: '기타', groups: [['기타', []]] },
};

function push(cat, group, f) {
  const c = cats[cat];
  if (Array.isArray(c.groups)) c.groups.find(g => g[0] === group)[1].push(f);
  else { (c.groups[group] = c.groups[group] || []).push(f); }
}

const bankManifest = JSON.parse(fs.readFileSync('asset-bank/manifest.json', 'utf8'));

for (const f of files) {
  const parts = f.split('/');
  const base = parts[parts.length - 1];
  const stem = base.replace(/\.[^.]+$/, '');
  const dir = parts.length > 1 ? parts[0] : '';

  if (dir === 'asset-bank') push('bank', parts[1] === 'planes' ? '기체' : parts[1] === 'vehicles' ? '차량·보스 소재' : '지형 타일', f);
  else if (dir === 'plane-bank') push('bank', '기존 plane-bank', f);
  else if (dir === 'legacy') push('bank', 'legacy (이전 초상화 등)', f);
  else if (dir === 'elite-patch') push('squads', '스프라이트', f);
  else if (dir === 'augmentation-icons') push('icons', '아이콘', f);
  else if (dir === 'mech') push('mech', '기체', f);
  else if (/^(fx-pack-v189|fx-role-split|fx-sample)/.test(f) || /^fx[-_]/.test(base) || /explosion|smoke|blast|flame|impact|tracer|projectile|muzzle|debris|splash|foam|wake|streak|flare|debris/i.test(stem)) push('fx', 'FX', f);
  else if (/^portrait-|^new-aces-portraits|^portrait_/.test(base)) push('portraits', '초상화', f);
  else if (/cutin|cut-in|skill-art|boss-cutin|illust/i.test(stem)) push('portraits', '컷인·기타', f);
  else if (/^hud-|belt|ui-|button|icon-/.test(base)) push('hud', '요소', f);
  else if (/^(boss[-_]|zubian|tsar|a7v|fliegerzug|treffas|markv|morser|kettering|livens|minenwerfer|drachen|zeppelin|gotha-night|staaken|verdun[-_]|maan[-_]|souville|douaumont|flak|tower|fortress|landship|wusten|armored|carrier|searchlight|airship|london[-_]apron|gik|alps-ca4)/.test(base.replace(/[-_]\d{6,}\./, '.'))) push('boss', stem.replace(/[-_]?(atlas|parts|damage|destroyed|wreck|normal|normal_pivot|damaged_pivot|broken|closed|exposed|main|l|r|mount|pipe|core|body|base|turret|wheel|hull|gun|platform|crane|ammo|command|nozzle|pressure|tank|door|smoke|chimney|canopy|dome|boom|blade|rotor|post|leg|track|plate|side|rear|front|top|mid|tip|cone|ring|cowl|fin|vent|slab|panel|frame|pod|cupola|casemate|moat|gate|rampart|wall)[-_]?/g, ' ').trim().split(' ')[0] || '기타', f);
  else if (/terrain|ground|alps-peak|sky[-_]|city[-_]|harbor|field-map|verdun-tile|maan-tile|tile[-_]|sea[-_]|coast|mud|forest|snow|desert|crater|trench|apron|night/i.test(stem)) push('terrain', '타일·맵', f);
  else if (/balloon|caquot|parseval|shuttelanz|lohner|felixstowe|ff33|hb_w29|macchi|ship|naval|boat|monitor|train|rail|tank|gun|tower|fort|bunker|truck|vehicle|unit/i.test(stem)) push('ground', '유닛', f);
  else if (genericPlane(stem)) push('planes', aceVariant(stem) ? '에이스·리버리' : '기본·대형', f);
  else push('misc', '기타', f);
}

// --- manifest lookups for bank sub labels ---
const bankMeta = n => {
  for (const sec of Object.values(bankManifest)) if (sec[n]) { const v = sec[n]; return [v.faction, v.era, v.role, (v.tags || []).join(' ')].filter(Boolean).join(' · '); }
  return '';
};

// --- html ---
const card = f => {
  const stem = f.split('/').pop().replace(/\.[^.]+$/, '');
  const meta = f.startsWith('asset-bank') ? bankMeta(stem) : '';
  return `<div class="card" data-n="${stem.toLowerCase()}"><img loading="lazy" src="./${f}" alt="${stem}"><div class="nm">${stem}</div><div class="sb">${f}${meta ? ' · ' + meta : ''}</div></div>`;
};

let tabs = '', panels = '', total = 0, first = true;
for (const [id, c] of Object.entries(cats)) {
  const groups = Array.isArray(c.groups) ? c.groups : Object.entries(c.groups);
  const count = groups.reduce((n, g) => n + g[1].length, 0);
  if (!count) continue;
  total += count;
  tabs += `<button class="tab${first ? ' on' : ''}" data-t="${id}">${c.label} <b>${count}</b></button>`;
  panels += `<section class="panel${first ? '' : ' off'}" id="t-${id}">`;
  for (const [g, list] of groups) {
    if (!list.length) continue;
    list.sort();
    panels += `<h2>${g} <span>${list.length}</span></h2><div class="grid">${list.map(card).join('')}</div>`;
  }
  panels += `</section>`;
  first = false;
}

const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HEAD-ON 에셋 DB</title><style>
*{box-sizing:border-box}body{background:#1c1a16;color:#e8e0d2;font-family:system-ui,sans-serif;margin:0}
header{position:sticky;top:0;background:#1c1a16f2;padding:14px 22px 10px;border-bottom:1px solid #4a4234;z-index:9;backdrop-filter:blur(4px)}
h1{font-size:19px;margin:0 0 10px}.note{color:#9a8f7a;font-size:12px}
nav{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.tab{background:#2a2620;color:#cfc4ae;border:1px solid #4a4234;border-radius:20px;padding:5px 12px;font-size:12.5px;cursor:pointer}
.tab b{color:#cbb27a;font-weight:700}.tab.on{background:#cbb27a;color:#1c1a16;border-color:#cbb27a}.tab.on b{color:#1c1a16}
#q{margin-left:auto;background:#14120e;border:1px solid #4a4234;color:#e8e0d2;border-radius:20px;padding:6px 14px;font-size:13px;width:210px;outline:none}
#q:focus{border-color:#cbb27a}
main{padding:14px 22px 40px}
.panel.off{display:none}
h2{font-size:14px;margin:22px 0 9px;color:#cbb27a;border-bottom:1px solid #4a4234;padding-bottom:4px}
h2 span{color:#9a8f7a;font-weight:400;font-size:12px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:10px}
.card{background:#2a2620;border:1px solid #4a4234;border-radius:8px;padding:8px;text-align:center;min-width:0}
.card img{width:100%;height:150px;object-fit:contain;border-radius:5px;background:repeating-conic-gradient(#3a352c 0% 25%,#2e2a24 0% 50%) 0 0/14px 14px}
.nm{font-size:12px;font-weight:600;margin-top:5px;word-break:break-all}
.sb{font-size:10px;color:#9a8f7a;margin-top:1px;word-break:break-all}
.card.hide{display:none}
.empty{color:#9a8f7a;padding:40px;text-align:center;display:none}
</style></head><body>
<header><h1>HEAD-ON 에셋 DB <span class="note">${total}개 파일 — 인게임 전체 + 뱅크 보관 (재생성: node make-gallery.js)</span></h1>
<nav>${tabs}<input id="q" type="search" placeholder="검색 (파일명)"></nav></header>
<main>${panels}<div class="empty" id="emp">일치 없음</div></main>
<script>
const panels=[...document.querySelectorAll('.panel')],tabs=[...document.querySelectorAll('.tab')],q=document.getElementById('q'),emp=document.getElementById('emp');
tabs.forEach(b=>b.onclick=()=>{tabs.forEach(x=>x.classList.toggle('on',x===b));panels.forEach(p=>p.classList.toggle('off',p.id!=='t-'+b.dataset.t));emp.style.display='none';q.value='';});
q.oninput=()=>{const s=q.value.trim().toLowerCase();if(!s)return tabs.find(b=>b.classList.contains('on')).click(),0;
 panels.forEach(p=>p.classList.add('off'));let any=0;document.querySelectorAll('.card').forEach(c=>{const hit=c.dataset.n.includes(s);c.classList.toggle('hide',!hit);if(hit){c.closest('.panel').classList.remove('off');any++}});
 emp.style.display=any?'none':'block'};
</script></body></html>`;

fs.writeFileSync('asset-gallery.html', html);
console.log('files', total, '→ asset-gallery.html', (html.length / 1024) | 0, 'KB');

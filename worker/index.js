const ASSETS = __ASSET_MAP__;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function decode(value) {
  const raw = atob(value);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function asset(request, env) {
  const url = new URL(request.url);
  const path = url.pathname === "/" ? "/index.html" : url.pathname;
  const encoded = ASSETS[path];
  if (encoded && typeof encoded === "object" && encoded.imagePath) {
    if (!env.ASSETS) return new Response("Not found", {status:404});
    url.pathname=encoded.imagePath;
    return env.ASSETS.fetch(new Request(url.toString(),request));
  }
  if (!encoded) {
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("Not found", { status: 404 });
  }
  const dot = path.lastIndexOf(".");
  const ext = dot >= 0 ? path.slice(dot) : "";
  return new Response(decode(encoded), {
    headers: {
      "content-type": MIME[ext] || "application/octet-stream",
      // Game code and styles change together with each deployment; avoid a
      // stale mobile cache masking the latest playfield and controls.
      "cache-control": "no-cache, no-store, must-revalidate",
    },
  });
}

async function ranking(request, env) {
  if (!env.DB) return json({ error: "ranking_unavailable" }, 503);
  const queryMode=new URL(request.url).searchParams.get('mode');
  if(queryMode&&!['solo','coop2'].includes(queryMode))return json({error:'invalid_mode'},400);
  if(request.method==='GET'&&queryMode==='coop2')return coopRanking(null,env);
  if(request.method==='POST'){
    let body;try{body=await request.clone().json()}catch{return json({error:'invalid_json'},400)}
    const mode=body?.mode??'solo';
    if(!['solo','coop2'].includes(mode)||queryMode&&queryMode!==mode)return json({error:'invalid_mode'},400);
    if(mode==='coop2')return coopRanking(body,env);
  }
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS priority_scores_161 (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, score INTEGER NOT NULL, pilot TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
  const PILOT_FACTIONS={
    '붉은 남작':'central','만프레드 폰 리히트호펜':'central','베르너 포스':'central','오스왈드 뵐케':'central','막스 임멜만':'central','에른스트 우데트':'central','헤르만 괴링':'central','후프츠키 & 에만':'central',
    '쿠르트 볼프':'central','에리히 뢰벤하르트':'central',
    '르네 폰크':'entente','레이몬드 콜리쇼':'entente','프란체스코 바라카':'entente','조르즈 기네미르':'entente','조르주 기네미르':'entente','조르즈 기네메르':'entente','조르주 기네메르':'entente','빌리 비숍':'entente','믹 매녹':'entente','맥키버 & 파월':'entente','제임스 맥커든':'entente','샤를 너겐서':'entente'
  };
  const withFaction=rows=>(rows||[]).map(row=>({...row,faction:PILOT_FACTIONS[row.pilot]||null}));
  const factionFilter=new URL(request.url).searchParams.get('faction');
  if(factionFilter&&!['central','entente'].includes(factionFilter))return json({error:'invalid_faction'},400);
  const rankedRows=async()=>{
    const names=factionFilter?Object.entries(PILOT_FACTIONS).filter(([,side])=>side===factionFilter).map(([name])=>name):[];
    const where=names.length?` AND pilot IN (${names.map(()=>'?').join(',')})`:'';
    return env.DB.prepare(`SELECT name, score, pilot, created_at FROM priority_scores_161 WHERE score <= 9999${where} ORDER BY score DESC, created_at ASC LIMIT 10`).bind(...names).all();
  };
  if (request.method === "GET") {
    const result = await rankedRows();
    return json(withFaction(result.results));
  }
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  if (body?.season !== "priority-161") return json({error:"outdated_game_reload"},409);
  if (!Number.isInteger(body?.score) || body.score < 0 || body.score > 9999) return json({error:"invalid_score"},400);
  const name = String(body?.name || "익명 파일럿").trim().slice(0, 12) || "익명 파일럿";
  const score = Math.max(0, Math.min(999999999, Math.floor(Number(body?.score) || 0)));
  const pilot = String(body?.pilot || "unknown").slice(0, 40);
  if (score > 0) await env.DB.prepare("INSERT INTO priority_scores_161 (name, score, pilot) VALUES (?, ?, ?)")
    .bind(name, score, pilot)
    .run();
  const result = await rankedRows();
  return json(withFaction(result.results));
}

const COOP_PILOT_FACTIONS={baron:'central',voss:'central',boelcke:'central',immelmann:'central',udet:'central',goering:'central',huffzky:'central',wolff:'central',loewenhardt:'central',fonck:'entente',collishaw:'entente',baracca:'entente',guynemer:'entente',bishop:'entente',mannock:'entente',mckeever:'entente',mccudden:'entente',nungesser:'entente'};
async function coopRanking(body,env){
 if(body){
  if(body.mode!=='coop2'||body.season!=='coop2-v2')return json({error:'outdated_game_reload'},409);
  if(!Number.isInteger(body.score)||body.score<0||body.score>9999||!Number.isInteger(body.durationSeconds)||body.durationSeconds<0||body.durationSeconds>2147483647)return json({error:'invalid_score_or_duration'},400);
  if(typeof body.runId!=='string'||!/^[A-Za-z0-9_-]{16,96}$/.test(body.runId))return json({error:'invalid_run_id'},400);
  if(!['central','entente'].includes(body.faction)||!Array.isArray(body.players)||body.players.length!==2||body.players.some(p=>!p||typeof p.name!=='string'||!p.name.trim()||p.name.trim().length>12||typeof p.pilot!=='string'||!Object.hasOwn(COOP_PILOT_FACTIONS,p.pilot)||COOP_PILOT_FACTIONS[p.pilot]!==body.faction))return json({error:'invalid_team'},400);
  if(body.score>0)await env.DB.prepare('INSERT INTO coop_scores_v1(run_id,p1_name,p1_pilot,p2_name,p2_pilot,faction,score,duration_seconds) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(run_id) DO NOTHING').bind(body.runId,body.players[0].name.trim(),body.players[0].pilot,body.players[1].name.trim(),body.players[1].pilot,body.faction,body.score,body.durationSeconds).run();
 }
 const result=await env.DB.prepare('SELECT run_id,p1_name,p1_pilot,p2_name,p2_pilot,faction,score,duration_seconds,created_at FROM coop_scores_v1 ORDER BY score DESC,id ASC LIMIT 10').all();
 return json((result.results||[]).map(r=>({mode:'coop2',season:'coop2-v2',runId:r.run_id,players:[{name:r.p1_name,pilot:r.p1_pilot},{name:r.p2_name,pilot:r.p2_pilot}],faction:r.faction,score:r.score,durationSeconds:r.duration_seconds,created_at:r.created_at})));
}

async function campaign(request, env) {
  if (!env.DB) return json({error: 'campaign_unavailable'}, 503);
  if (!['GET','POST'].includes(request.method)) return json({error:'method_not_allowed'},405);
  const origin = request.headers.get('origin');
  if (request.method==='POST' && origin && origin!==new URL(request.url).origin) return json({error:'invalid_origin'},403);
  const existing = (request.headers.get('cookie')||'').match(/(?:^|;\s*)headon_campaign=([a-f0-9]{32})(?:;|$)/)?.[1];
  const profile = existing || crypto.randomUUID().replaceAll('-','');
  if (request.method==='POST') {
    let body;try{body=await request.json()}catch{return json({error:'invalid_json'},400)}
    if (!/^[AC]-(?:0[1-9]|10)$/.test(body?.stageId||'') || body?.won!==true || !Number.isInteger(body?.medals) || body.medals<1 || body.medals>3 || !Number.isInteger(body?.score) || body.score<0 || body.score>100000 || !Number.isFinite(body?.time) || body.time<0 || body.time>600) return json({error:'invalid_campaign_result'},400);
    await env.DB.prepare(`INSERT INTO campaign_progress(profile,stage_id,medals,score,best_time) VALUES(?,?,?,?,?)
      ON CONFLICT(profile,stage_id) DO UPDATE SET medals=MAX(campaign_progress.medals,excluded.medals), score=MAX(campaign_progress.score,excluded.score), best_time=MIN(campaign_progress.best_time,excluded.best_time)`).bind(profile,body.stageId,body.medals,body.score,body.time).run();
  }
  const rows=await env.DB.prepare('SELECT stage_id AS stageId,medals,score,best_time AS time FROM campaign_progress WHERE profile=? ORDER BY stage_id').bind(profile).all();
  const response=json(rows.results||[]);
  if(!existing)response.headers.set('set-cookie',`headon_campaign=${profile}; Path=/api/campaign; HttpOnly; SameSite=Strict; Max-Age=31536000${new URL(request.url).protocol==='https:'?'; Secure':''}`);
  return response;
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if(path === "/api/campaign") {
      try{return await campaign(request,env)}catch{return json({error:"campaign_unavailable"},503)}
    }
    if (path === "/api/rankings") {
      try {
        return await ranking(request, env);
      } catch {
        return json({ error: "ranking_unavailable" }, 503);
      }
    }
    return asset(request, env);
  },
};

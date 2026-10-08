import json, pathlib, traceback
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

OUT=pathlib.Path('/tmp/boss-results');OUT.mkdir(exist_ok=True)
ROOT=pathlib.Path.cwd()
results=[]
SETUP="""o=>{
 const t=window.__HEADON_TEST__;t.start({...o,boss:true,invincible:true,freeze:true});
 const g=t.debug();if(!g?.testMode)throw Error('Test lab did not start');
 for(const key of ['need','spawn','nextBossAt','nextHeavyAt','patrolTimer','allyTimer','eventTimer','supplyTimer'])g[key]=Infinity;
 for(const p of g.players||[g]){p.need=Infinity;p.fire=Infinity;p.invuln=Infinity;}
 g.enemies=g.enemies.filter(e=>e.stageBossBody);g.patrols=[];g.allies=[];
 const h=g.stageBoss.hazards,spawn=h.spawn.bind(h);window.__bossEvents=[];
 h.spawn=s=>{window.__bossEvents.push({...s,at:g.t});return spawn(s)};
 const ps=g.players||[g],old=ps.map(p=>({x:p.x,y:p.y}));
 g.state='playing';g.update(.02,g.players?{p1:{inputMode:'gamepad',fireHeld:false},p2:{inputMode:'gamepad',fireHeld:false}}:{inputMode:'gamepad',fireHeld:false});g.state='paused';
 return {kind:g.stageBoss.stages.bossId,velocity:ps.map((p,i)=>({actual:[(p.x-old[i].x)/.02,(p.y-old[i].y)/.02],received:[g.stageBoss.frameContext.players[i].vx,g.stageBoss.frameContext.players[i].vy]}))};
}"""
STEP="""n=>{
 const g=__HEADON_TEST__.debug(),b=g.stageBoss.stages.encounter.bodies.values().next().value;
 let maxHazards=0;g.state='playing';
 for(let i=0;i<n;i++){
  const inputs={};for(const p of g.players||[g]){
   const dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy),a=Math.atan2(dy,dx)+Math.PI/2+Math.atan((d-205)/100);
   const error=Math.atan2(Math.sin(a-p.a),Math.cos(a-p.a));
   inputs[p.id||'p1']={inputMode:'gamepad',fireHeld:false,steer:Math.max(-1,Math.min(1,error)),inputAnalog:1};
  }
  g.update(.02,g.players?inputs:inputs.p1);maxHazards=Math.max(maxHazards,g.stageBoss.hazards.pool.count);
  if(g.state!=='playing')break;
 }
 g.state='paused';return {time:g.t,state:g.state,phase:b.phase,tactical:b.tacticalState,rotation:b.rotation?.stage,maxHazards,dropped:g.stageBoss.hazards.pool.dropped||0,finite:Number.isFinite(g.x)&&Number.isFinite(g.y)&&Number.isFinite(b.x)&&Number.isFinite(b.y)};
}"""
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,args=['--disable-dev-shm-usage'])
 for patched in (False,True):
  mode='patched' if patched else 'baseline'
  context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
  replacements=[]
  if patched:
   def route_handler(route):
    name=pathlib.PurePosixPath(urlsplit(route.request.url).path).name
    if name in ('stageboss-host.js','headon-stageboss-patterns.js'):
     replacements.append(name);route.fulfill(status=200,content_type='text/javascript',body=(ROOT/name).read_text())
    else:route.continue_()
   context.route('**/*.js*',route_handler)
  page=context.new_page();errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
  try:
   page.goto('https://leesh603.github.io/head-on-test-preview/?v=boss-rhythm-diagnostic&headonTest=1&autostart=0',wait_until='domcontentloaded',timeout=120000)
   page.wait_for_function('!!window.__HEADON_TEST__',timeout=120000)
   for pilot,region,coop in [('fonck',2,''),('baron',2,''),('fonck',5,''),('fonck',5,'collishaw')]:
    name=f'{mode}-{pilot}-{region}'+('-coop' if coop else '')
    record={'mode':mode,'name':name,'viewport':'390x844','coop':bool(coop)}
    before=len(errors)
    try:
     record.update(page.evaluate(SETUP,{'pilot':pilot,'region':region,'coop':coop}))
     page.wait_for_timeout(3500)
     samples=[]
     for j in range(12):
      samples.append(page.evaluate(STEP,100));page.wait_for_timeout(40)
      if j in (3,7):page.screenshot(path=str(OUT/f'{name}-{j}.png'))
     record['samples']=samples
     record['attacks']=page.evaluate('window.__bossEvents.map(e=>({kind:e.kind,visual:e.visual,at:e.at,warning:e.warning,delay:e.delay,tag:e.tag,x:e.x,y:e.y,vx:e.vx,vy:e.vy}))')
     record['pageErrors']=errors[before:]
     assert all(s['finite'] and not s['dropped'] for s in samples),'Nonfinite state or hazard pool exhaustion'
     if patched:
      for v in record['velocity']:
       assert sum(a*a for a in v['actual'])>2500,'No actual player flight'
       assert max(abs(a-b) for a,b in zip(v['actual'],v['received']))<1e-5,'Actual motion not delivered to boss'
      assert record['attacks'],'Boss emitted no attacks'
      assert not record['pageErrors'],'Live runtime errors'
     record['pass']=True
    except Exception as exc:
     record['pass']=False;record['error']=str(exc);record['traceback']=traceback.format_exc()
     try:page.screenshot(path=str(OUT/f'{name}-failure.png'))
     except Exception:pass
    results.append(record)
    (OUT/'browser-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
    print(json.dumps({k:v for k,v in record.items() if k not in ('attacks','samples','traceback')},ensure_ascii=False),flush=True)
   if patched:assert set(replacements)=={'stageboss-host.js','headon-stageboss-patterns.js'},replacements
  except Exception as exc:
   results.append({'mode':mode,'pass':False,'error':str(exc),'pageErrors':errors,'traceback':traceback.format_exc()})
   (OUT/'browser-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
   print(traceback.format_exc(),flush=True)
  finally:context.close()
 browser.close()
assert len(results)==8 and all(r.get('pass') for r in results),'See browser-results.json'

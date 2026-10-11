// Run against an un-deployed branch served locally. Pin both ground modules
// for baseline comparisons, including revisions of the same feature branch.
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=process.env.QA_OUTPUT||'reports/trench-frontline',base=process.env.QA_BASE||'15564e8d059ce98fc70e2c7deeaa1b1d0af3c5cd';
const url=process.env.QA_URL||'http://127.0.0.1:8765/trench/';mkdirSync(root,{recursive:true});
const before=execFileSync('git',['show',base+':ground-life.js'],{encoding:'utf8'});
let beforeFrontline;try{beforeFrontline=execFileSync('git',['show',base+':trench-frontline.js'],{encoding:'utf8',stdio:['ignore','pipe','ignore']});}catch{/* Original main predates this module. */}
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,args:['--no-sandbox']});
const results=[],errors=[];
async function boot(label,mobile=false,baseline=false,live=false){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
 const page=await context.newPage();page.on('pageerror',e=>errors.push({label,error:e.message}));page.on('console',m=>{if(m.type()==='error'&&m.text().includes('[headon]'))errors.push({label,error:m.text()});});
 if(!live){
  if(baseline)await page.route('**/ground-life.js*',route=>route.fulfill({contentType:'text/javascript',body:before}));
  if(baseline&&beforeFrontline)await page.route('**/trench-frontline.js*',route=>route.fulfill({contentType:'text/javascript',body:beforeFrontline}));
  await page.route('**/app.js*',async route=>{
   const r=await route.fetch();let text=await r.text();
   const call='drawMovingDressing(ctx,key,cx-W/2,cy-H/2,W,H,terrainAlpsRenderer.sizeFor(key),game?.t??ambient,detailDensity);';
   if(!text.includes(call))throw Error('Ground timing instrumentation target changed');
   text=text.replace(call,'{const qaStart=performance.now();'+call+'if(window.__qaCollect)(window.__qaDrawTimes||=[]).push(performance.now()-qaStart);}');
   await route.fulfill({response:r,body:text});
  });
 }
 await page.goto((live?'https://leesh603.github.io/head-on-test-preview/':url)+'?headonTest=1&autostart=0',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.__HEADON_TEST__,null,{timeout:90000});
 await page.waitForFunction(()=>[...document.querySelectorAll('link[rel="stylesheet"]')].every(l=>l.sheet&&l.sheet.cssRules.length),null,{timeout:30000});
 await page.evaluate(async()=>{
  __HEADON_TEST__.start({region:2,pilot:'baron',invincible:true,freeze:true});
  window.HEADON_GATE?.releaseAll();await(await import('./ground-life.js?v=livingww1d')).groundLifeReady;
 });
 if(!baseline&&!live)await page.evaluate(async()=>{await(await import('./trench-frontline.js?v=frontline1')).loadTrenchSupport()});
 await page.waitForTimeout(2000);
 return {context,page};
}
async function run(label,{mobile=false,baseline=false,seconds=36,record=true,live=false}={}){
 const {context,page}=await boot(label,mobile,baseline,live);console.log('START',label);
 await page.evaluate(({mobile})=>{
  const g=__HEADON_TEST__.debug();Object.assign(g,{x:mobile?430:630,y:mobile?490:660,previousX:mobile?430:630,previousY:mobile?490:660,t:0,stageStartTime:0,a:0,need:Infinity});
  let seed=127;g.rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  // Repeatable steering only; the native update, enemies, shots, gas, flak,
  // damage and render loop remain active. No staged replacement scene.
  const update=g.update;
  g.update=function(dt,input){const cx=mobile?430:630,cy=mobile?360:520,dx=cx-this.x,dy=cy-this.y,d=Math.hypot(dx,dy);
   return update.call(this,dt,{...input,angle:Math.atan2(dy,dx)+Math.PI/2-Math.max(-.65,Math.min(.65,(d-140)/140))});};
  window.__qaDrawTimes=[];window.__qaRaf=[];window.__qaCollect=true;let previous=0;
  const tick=now=>{if(previous)window.__qaRaf.push(now-previous);previous=now;if(window.__qaCollect)requestAnimationFrame(tick)};requestAnimationFrame(tick);
  g.state='playing';
 },{mobile});
 if(record)await page.evaluate(()=>{
  const canvas=document.querySelector('#game'),stream=canvas.captureStream(30);window.__qaChunks=[];
  window.__qaRecorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:4500000});
  __qaRecorder.ondataavailable=e=>{if(e.data.size)__qaChunks.push(e.data)};__qaRecorder.start(1000);
 });
 for(let n=0;n<seconds;n++){
  await page.waitForTimeout(1000);
  if([7,15,25].includes(n))await page.screenshot({path:resolve(root,label+'-'+(n+1)+'s.png')});
  if(n%15===14)console.log('PLAY',label,n+1);
 }
 const metrics=await page.evaluate(async({live,baseline})=>{
  window.__qaCollect=false;const g=__HEADON_TEST__.debug(),endState=g.state;g.state='paused';
  const summarize=a=>{a=a.slice(60).sort((a,b)=>a-b);return {samples:a.length,p50:a[Math.floor(a.length*.5)]||0,p95:a[Math.floor(a.length*.95)]||0,p99:a[Math.floor(a.length*.99)]||0,max:a.at(-1)||0}};
  return {endState,state:__HEADON_TEST__.status(),seconds:g.t,position:[g.x,g.y],enemies:g.enemies.length,bullets:g.bullets.length,rafMs:summarize(window.__qaRaf),groundDrawMs:summarize(window.__qaDrawTimes||[]),frontline:!live&&!baseline?{...(await import('./trench-frontline.js?v=frontline1')).trenchFrontlineStats}:null};
 },{live,baseline});
 if(record){
  const data=await page.evaluate(()=>new Promise(resolve=>{__qaRecorder.onstop=()=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(__qaChunks,{type:'video/webm'}));__qaRecorder.stream.getTracks().forEach(t=>t.stop())};__qaRecorder.stop()}));
  writeFileSync(resolve(root,label+'.webm'),Buffer.from(data,'base64'));
 }
 await page.screenshot({path:resolve(root,label+'-final.png')});
 if(live)metrics.version=await page.evaluate(async()=>({version:await(await fetch('./version.txt',{cache:'no-store'})).text(),testBuild:await(await fetch('./test-build.json',{cache:'no-store'})).text()}));
 results.push({label,...metrics});writeFileSync(resolve(root,'verification.json'),JSON.stringify({base,results,errors,limitations:['Headless Chrome; mobile viewport/touch emulation, not a physical phone.','Videos use deterministic steering through the native game loop in invincible Test Lab.','Branch is not deployed. Live-server verification covers the existing published version only.']},null,2));
 console.log('DONE',label,JSON.stringify(metrics));await context.close();
}
try{
 if(process.env.QA_ONLY==='regression'){
  const {context,page}=await boot('other-map-pixels');
  await page.route('**/ground-life-baseline.js',route=>route.fulfill({contentType:'text/javascript',body:before}));
  const pixels=await page.evaluate(async()=>{
   const current=await import('./ground-life.js?v=livingww1d'),old=await import('./ground-life-baseline.js');await old.groundLifeReady;
   const cv=document.createElement('canvas');cv.width=1280;cv.height=900;const c=cv.getContext('2d',{willReadFrequently:true}),results=[];
   const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');
   for(const key of ['rural','burning','cambrai','somme','city','london','sea','sky'])for(const density of [1,.65]){
    // Warm lazy FX decode/crop paths on both graphs before exact pixels.
    for(const m of [old,current])m.drawGroundLife(c,key,0,0,1280,900,key==='cambrai'?768:1254,11,density);
    await new Promise(requestAnimationFrame);
    c.clearRect(0,0,1280,900);old.drawGroundLife(c,key,0,0,1280,900,key==='cambrai'?768:1254,11,density);const beforePixels=c.getImageData(0,0,1280,900).data.slice(),a=await digest(beforePixels);
    c.clearRect(0,0,1280,900);current.drawGroundLife(c,key,0,0,1280,900,key==='cambrai'?768:1254,11,density);const afterPixels=c.getImageData(0,0,1280,900).data,b=await digest(afterPixels);
    let differingChannels=0,maxDelta=0;for(let i=0;i<beforePixels.length;i++)if(beforePixels[i]!==afterPixels[i]){differingChannels++;maxDelta=Math.max(maxDelta,Math.abs(beforePixels[i]-afterPixels[i]));}
    results.push({key,density,equal:a===b,sha256:b,differingChannels,maxDelta});
   }return results;
  });
  writeFileSync(resolve(root,'other-map-pixels.json'),JSON.stringify(pixels,null,2));console.log('OTHER MAPS',JSON.stringify(pixels));await context.close();
  if(pixels.some(p=>!p.equal))throw Error('Other map pixels changed');
 }else if(process.env.QA_ONLY==='live')await run('live-test-server',{live:true,record:true,seconds:20});
 else if(process.env.QA_ONLY==='after')await run('after-desktop');
 else if(process.env.QA_ONLY==='mobile'){await run('before-mobile',{mobile:true,baseline:true,seconds:12,record:false});await run('after-mobile',{mobile:true,seconds:60});}
 else{await run('before-desktop',{baseline:true});await run('after-desktop');}
}finally{await browser.close();}
if(errors.length)throw Error(JSON.stringify(errors));

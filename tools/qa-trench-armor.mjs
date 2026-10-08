// Real branch app on a local test server. Test Lab's native hit/update paths
// advance deterministic boss scenarios; keyboard/touch checks run real RAF.
import {createRequire} from 'node:module';import {mkdirSync,writeFileSync} from 'node:fs';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
import {createCoopRelay} from '../server/coop-relay.mjs';
const relay=createCoopRelay();await new Promise(resolve=>relay.server.listen(8787,'127.0.0.1',resolve));
const root=process.env.QA_OUTPUT||'reports/trench-armor';mkdirSync(root,{recursive:true});const results=[],errors=[];
const launch=()=>chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox','--single-process','--no-zygote','--disable-background-timer-throttling']});
const kinds=process.env.QA_BOSS?[process.env.QA_BOSS]:['a7v-flak','mark-v-cruiser'];
const snapshot=page=>page.evaluate(()=>{const g=__HEADON_TEST__.debug(),b=g.stageBoss.stages.encounter&&[...g.stageBoss.stages.encounter.bodies.values()][0];if(!b)return {hp:0,cleared:true,state:g.state};return {kind:b.kind,hp:b.hp,maxHp:b.maxHp,combatPhase:b.combatPhase,x:b.x,y:b.y,yaw:b.hullYaw,left:b.leftTrack,right:b.rightTrack,rotation:b.rotation,tactical:b.tacticalState,marks:b.trackMarks.length,parts:[...b.parts.values()].map(p=>({id:p.id,hp:p.hp,hittable:p.hittable})),hazards:g.stageBoss.hazards.pool.count,players:(g.players||[g]).map(p=>({x:p.x,y:p.y,a:p.a})),state:g.state};});
async function focus(page){await page.evaluate(()=>{const g=__HEADON_TEST__.debug(),b=[...g.stageBoss.stages.encounter.bodies.values()][0];if(g.players){g.players.forEach((p,i)=>{p.x=b.x+(i?24:-24);p.y=b.y+120;p.invuln=Infinity;p.previousX=p.x;p.previousY=p.y;});Object.assign(g.camera,{x:b.x,y:b.y+120,zoom:1});}else{g.x=b.x;g.y=b.y+120;g.previousX=g.x;g.previousY=g.y;}g.state='paused';});await page.waitForTimeout(120);}
async function advance(page,seconds){return page.evaluate(seconds=>{const g=__HEADON_TEST__.debug();g.state='playing';for(let t=0;t<seconds;t+=.02){for(const p of g.players||[g]){p.invuln=Infinity;p.fire=Infinity;p.motorCannonTimer=Infinity;p.cow37Timer=Infinity;}g.update(.02,g.players?{p1:{inputMode:'gamepad',fireHeld:false,steer:1},p2:{inputMode:'gamepad',fireHeld:false,steer:-1}}:{inputMode:'gamepad',fireHeld:false,steer:1});if(g.state!=='playing')break;}g.state='paused';},seconds);}
async function damage(page,partId=null,amount=1e8){return page.evaluate(({partId,amount})=>{const g=__HEADON_TEST__.debug(),b=g.stageBoss.stages.encounter&&[...g.stageBoss.stages.encounter.bodies.values()][0];if(!b)return {cleared:true};return g.stageBoss.hit({bodyId:b.id,partId,damage:amount,faction:g.teamFaction});},{partId,amount});}
try{for(const kind of kinds)for(const mobile of process.env.QA_VIEW==='mobile'?[true]:process.env.QA_VIEW==='desktop'?[false]:[false,true]){
 const browser=await launch();const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});const page=await context.newPage(),label=kind+(mobile?'-mobile-coop':'-desktop-solo');
 page.on('pageerror',e=>errors.push({label,error:e.message,stack:e.stack}));page.on('console',m=>{if(m.type()==='error'&&m.text().includes('[headon]'))errors.push({label,error:m.text()});});
 const pilot=kind==='a7v-flak'?'fonck':'baron',coop=kind==='a7v-flak'?'guynemer':'voss';
 await page.goto((process.env.QA_URL||'http://127.0.0.1:8787/')+'?headonTest=1&autostart=0');await page.waitForFunction(()=>!!window.__HEADON_TEST__,null,{timeout:90000});await page.evaluate(async()=>{await(await import('./icons.js?v=raid1')).iconsReady;});
 await page.evaluate(({pilot,coop,mobile})=>__HEADON_TEST__.start({region:2,pilot,coop:mobile?coop:undefined,boss:true,freeze:true,invincible:true}),{pilot,coop,mobile});await page.waitForTimeout(1500);
 const original=await snapshot(page);assert.equal(original.kind,kind);await advance(page,.7);await focus(page);await page.screenshot({path:root+'/'+label+'-entry.png'});
 await advance(page,7);await focus(page);const phase1=await snapshot(page);assert(phase1.marks>0);assert(phase1.left.roll||phase1.right.roll);
 await page.screenshot({path:root+'/'+label+'-phase1.png'});
 // The existing armour opening rule still requires the relevant gun losses.
 await damage(page,kind==='a7v-flak'?'front':'sponson-left');if(kind==='a7v-flak')await damage(page,'rear');await damage(page);assert.equal((await snapshot(page)).combatPhase,2);await advance(page,3);await focus(page);
 await page.screenshot({path:root+'/'+label+'-phase2.png'});await damage(page);assert.equal((await snapshot(page)).combatPhase,3);
 // Capture the real differential turn after warning/braking, not a posed mock.
 for(let i=0;i<50;i++){await advance(page,.2);const s=await snapshot(page);if(s.rotation?.stage==='spin'&&s.rotation.age>=2.4&&Math.abs(s.left.speed-s.right.speed)>10)break;}
 await focus(page);const final=await snapshot(page);assert.equal(final.rotation?.stage,'spin');assert(final.left.speed*final.right.speed<0);await page.screenshot({path:root+'/'+label+'-final.png'});
 await damage(page,'track-left');await advance(page,1);assert.equal((await snapshot(page)).left.speed,0);await damage(page,'track-right');await advance(page,1);const stopped=await snapshot(page);assert.equal(stopped.left.speed,0);assert.equal(stopped.right.speed,0);
 await damage(page,'engine-deck');if(kind==='a7v-flak')await damage(page,'searchlight');await advance(page,1.6);await focus(page);await page.screenshot({path:root+'/'+label+'-damaged.png'});
 // Brief real RAF keyboard/touch input check. No fixed frame stepping here.
 await page.evaluate(()=>{const g=__HEADON_TEST__.debug();g.state='playing';g.manualPaused=false;});await page.keyboard.down('KeyD');await page.waitForTimeout(700);await page.keyboard.up('KeyD');await page.evaluate(()=>__HEADON_TEST__.debug().state='paused');
 await advance(page,8);await damage(page);await advance(page,.35);const wreck=await snapshot(page);assert.equal(wreck.hp,0);await page.screenshot({path:root+'/'+label+'-wreck.png'});await advance(page,3.2);const defeat=await snapshot(page);assert.equal(defeat.hp,0);await page.screenshot({path:root+'/'+label+'-defeat.png'});
 results.push({label,original,phase1,final,stopped,wreck,defeat});console.log('PASS',label,JSON.stringify({finalYaw:final.yaw,left:final.left.speed,right:final.right.speed,defeated:defeat.hp===0}));await browser.close();
 }}finally{writeFileSync(root+'/browser-results.json',JSON.stringify({results,errors,limitations:['Controlled Test Lab scenarios use native hit/update paths; not a natural full-run clear.','Headless desktop emulation; physical mobile FPS and audible sound quality are not verified.']},null,2));relay.server.close();}
assert.equal(errors.length,0,JSON.stringify(errors));console.log('BROWSER QA COMPLETE',results.length,'scenarios');

import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const output='reports/online-coop';mkdirSync(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const errors=[],results=[];
const check=(name,details)=>{results.push({name,details});console.log('PASS',name,JSON.stringify(details??''));};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const context=await browser.newContext({viewport:{width:1280,height:900}});
const host=await context.newPage(),guest=await (await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1})).newPage();
for(const [role,page] of [['host',host],['guest',guest]]){page.on('pageerror',error=>errors.push({role,error:error.message}));page.on('console',m=>{if(m.type()==='error'&&m.text().includes('[headon]'))errors.push({role,error:m.text()});});}
const probe=page=>page.evaluate(()=>{const g=window.__HEADON_TEST__.debug();return g?{online:g.online,host:g.host,state:g.state,t:g.t,region:g.region,players:g.players?.map(p=>({id:p.id,x:p.x,y:p.y,a:p.a,hp:p.hp,status:p.status,rounds:p.roundsFired,level:p.level,upgrades:p.upgrades})),enemies:g.enemies.map(e=>({id:e.id,hp:e.hp,scene:e.directorSceneId,leader:e.formationLeader?.id})),director:g.battleDirector?.sceneId,boss:g.stageBoss?.stages.encounter?.snapshot(),choice:g.activeUpgrade?.playerId}:null;});
try{
 await Promise.all([host.goto('http://127.0.0.1:8787/'),guest.goto('http://127.0.0.1:8787/')]);
 await Promise.all([host.waitForSelector('#onlineCoopEntry',{timeout:90000}),guest.waitForSelector('#onlineCoopEntry',{timeout:90000})]);
 await Promise.all([host.waitForFunction(()=>document.body.classList.contains('hangar-shown'),null,{timeout:90000}),guest.waitForFunction(()=>document.body.classList.contains('hangar-shown'),null,{timeout:90000})]);
 await host.locator('#onlineCoopEntry').click();await host.locator('#onlineCreate').click();
 await host.waitForFunction(()=>document.querySelector('#onlineRoomCode').textContent.includes('Room Code'));
 const code=(await host.locator('#onlineCode').inputValue());assert.match(code,/^[A-Z2-9]{6}$/);
 await guest.locator('#onlineCoopEntry').click();await guest.locator('#onlineCode').fill(code);await guest.locator('#onlineJoin').click();
 await guest.waitForFunction(()=>!document.querySelector('#onlineReady').hidden);
 await host.locator('#onlineReady').click();await guest.locator('#onlineReady').click();
 await Promise.all([host.waitForFunction(()=>window.__HEADON_TEST__.debug()?.online),guest.waitForFunction(()=>window.__HEADON_TEST__.debug()?.online)]);
 await wait(7000);check('create / join / both ready / launch',{code,host:await probe(host),guest:await probe(guest)});
 await host.keyboard.down('KeyD');await guest.keyboard.down('KeyA');await wait(1500);await host.keyboard.up('KeyD');await guest.keyboard.up('KeyA');
 check('independent movement / auto fire',{host:await probe(host),guest:await probe(guest)});
 await host.screenshot({path:output+'/pc-host.png'});await guest.screenshot({path:output+'/pc-guest.png'});
 await guest.screenshot({path:output+'/mobile-guest.png'});
 assert((await probe(host)).players.every(p=>p.rounds>0));assert.equal((await probe(guest)).host,false);
 const touch=await guest.locator('#touch').isVisible();assert(touch);check('390 x 844 touch viewport',touch);
 // Drive the real touch joystick, then the native active and maneuver buttons.
 const stick=await guest.locator('#stick').boundingBox();const previousAngle=(await probe(guest)).players[1].a;
 await guest.locator('#stick').dispatchEvent('pointerdown',{pointerId:1,clientX:stick.x+stick.width*.9,clientY:stick.y+stick.height*.5});
 await wait(300);await guest.locator('#stick').dispatchEvent('pointerup',{pointerId:1});
 assert.notEqual((await probe(guest)).players[1].a,previousAngle);check('touch joystick moves local aircraft');
 await guest.locator('#touchSkill').tap();await guest.locator('#touchEvade').tap();await wait(250);check('touch active / maneuver',await guest.evaluate(()=>{const p=__HEADON_TEST__.debug().player('p2');return {cooldown:p.cooldown,evadeCooldown:p.evadeCooldown};}));
 // Freeze the real authoritative world for exact state comparisons.
 await host.evaluate(()=>__HEADON_TEST__.debug().pause());await wait(160);
 assert.deepEqual((await probe(guest)).enemies.map(e=>e.id),(await probe(host)).enemies.map(e=>e.id));
 await host.evaluate(()=>{const g=__HEADON_TEST__.debug();g._qaDirector=g.tickBattleDirector;g.tickBattleDirector=()=>{};g.enemies=[];g.bullets=[];g.spawn=999;g.eventTimer=999;const e=g.spawnEnemy('scout');e.x=0;e.y=-140;e.a=-Math.PI/2;e.speed=0;e.stationary=true;e.fire=999;e.hp=e.maxHp=200;window.__qaEnemy=e.id;for(const [i,p]of g.players.entries()){p.x=i?4:-4;p.y=0;p.a=-Math.PI/2;p.hp=p.maxHp;p.invuln=999;p.fire=0;p.ammo.fill(p.weapon.belt);}g.resume();});
 await guest.waitForFunction(()=>{const g=__HEADON_TEST__.debug();return g.enemies.some(e=>e.stationary&&e.maxHp===200);});
 await host.waitForFunction(()=>{const g=__HEADON_TEST__.debug();return g.enemies.find(e=>e.id===window.__qaEnemy)?.hp<=0||!g.enemies.some(e=>e.id===window.__qaEnemy);});
 await host.evaluate(()=>__HEADON_TEST__.debug().pause());await wait(150);
 const dead=await probe(guest);assert(!dead.enemies.some(e=>e.hp>0));check('same enemy attacked / same authoritative death',{host:await probe(host),guest:dead});
 await host.evaluate(()=>{const g=__HEADON_TEST__.debug();g.tickBattleDirector=g._qaDirector;g.beginBattleDirectorPattern('CROSS_ATTACK');g.manualPaused=false;g.state='playing';});
 await wait(2000);await host.evaluate(()=>__HEADON_TEST__.debug().pause());await wait(150);
 assert.equal((await probe(host)).director,(await probe(guest)).director);check('Director scene / formation replication',{host:await probe(host),guest:await probe(guest)});
 await host.evaluate(()=>{const g=__HEADON_TEST__.debug();g.manualPaused=false;g.state='playing';g.awardXp(12);});
 await host.waitForFunction(()=>__HEADON_TEST__.debug().activeUpgrade?.playerId==='p1');await guest.waitForFunction(()=>__HEADON_TEST__.debug().state==='upgrade');
 await host.locator('#modalActions button').first().click();await guest.waitForFunction(()=>__HEADON_TEST__.debug().activeUpgrade?.playerId==='p2');
 await guest.locator('#modalActions button').first().tap();await host.waitForFunction(()=>__HEADON_TEST__.debug().state==='playing');
 await guest.waitForFunction(()=>__HEADON_TEST__.debug().state==='playing');
 check('both independently choose upgrades',{host:await probe(host),guest:await probe(guest)});
 await host.evaluate(()=>{const g=__HEADON_TEST__.debug();g.pause();g.enemies=[];g.bullets=[];g.stageBoss.stages.phase='explore';g.stageBoss.stages.encounter=null;g.stageBoss.startBoss({x:g.x,y:g.y-250});});
 await guest.waitForFunction(()=>!!__HEADON_TEST__.debug().stageBoss?.stages.encounter);await wait(250);
 assert.equal((await probe(host)).boss.bossId,(await probe(guest)).boss.bossId);check('native stage boss appears', (await probe(guest)).boss);
 await host.evaluate(()=>{const g=__HEADON_TEST__.debug(),b=[...g.stageBoss.stages.encounter.bodies.values()][0],p=[...b.parts.values()][0];window.__qaBoss={body:b.id,part:p.id};g.stageBoss.hit({bodyId:b.id,partId:p.id,damage:p.maxHp*2,faction:g.teamFaction});b.hp-=50;});
 await guest.waitForFunction(()=>[...__HEADON_TEST__.debug().stageBoss.stages.encounter.bodies.values()].some(b=>[...b.parts.values()].some(p=>p.destroyed)));
 assert(Math.abs((await probe(host)).boss.hp-(await probe(guest)).boss.hp)<.01);check('boss HP / part destruction', (await probe(guest)).boss);
 await host.evaluate(()=>document.querySelector('#modal').classList.add('hidden'));await guest.evaluate(()=>document.querySelector('#modal').classList.add('hidden'));
 await host.screenshot({path:output+'/pc-boss.png'});await guest.screenshot({path:output+'/mobile-boss.png'});
 // Exercise each native renderer using replicated boss data. No guest AI tick.
 for(let region=0;region<17;region++){
  await host.evaluate(region=>{const g=__HEADON_TEST__.debug();g.pause();g.stageBoss.stages.stageIndex=region;g.stageBoss.stages.phase='explore';g.stageBoss.stages.encounter=null;g.region=region;g.stageBoss.startBoss({x:g.x,y:g.y-200});},region);
  await guest.waitForFunction(region=>__HEADON_TEST__.debug().stageBoss.stages.stageIndex===region,region);
  await guest.waitForFunction(()=>document.querySelector('#regionTransition').classList.contains('hidden'));await wait(100);
  await guest.evaluate(()=>document.querySelector('#modal').classList.add('hidden'));
  await guest.screenshot({path:output+'/region-'+region+'.png'});check('regional boss renderer '+region,(await probe(guest)).boss.bossId);
 }
 await host.evaluate(()=>{const g=__HEADON_TEST__.debug();g.stageBoss.stages.stageIndex=0;g.region=0;});
 await host.evaluate(()=>{const g=__HEADON_TEST__.debug();g.stageBoss.stages.encounter=null;g.stageBoss.stages.phase='explore';g.resume();g.downPlayer(g.player('p2'));});await guest.waitForFunction(()=>__HEADON_TEST__.debug().player('p2').status==='downed');
 assert.equal((await probe(host)).state,'playing');check('one death keeps run alive');
 await host.evaluate(()=>__HEADON_TEST__.debug().player('p2').respawnRemaining=.1);await guest.waitForFunction(()=>__HEADON_TEST__.debug().player('p2').status==='alive');check('existing timed rescue / revival');
 await guest.evaluate(()=>__HEADON_TEST__.debug().session.socket.close());await host.waitForFunction(()=>__HEADON_TEST__.debug()._netDisconnected);assert.equal((await probe(host)).state,'paused');
 await host.waitForFunction(()=>!__HEADON_TEST__.debug()._netDisconnected);await guest.waitForFunction(()=>__HEADON_TEST__.debug().state==='playing');check('guest transport loss / same room reconnect');
 await guest.reload();await guest.waitForSelector('#onlineCoopEntry',{timeout:60000});await guest.locator('#onlineCoopEntry').click();await guest.locator('#onlineCode').fill(code);await guest.locator('#onlineJoin').click();
 await guest.waitForFunction(()=>{const g=__HEADON_TEST__.debug();return g?.online&&g._netHaveBase&&['playing','paused'].includes(g.state);});
 // The existing visibility handler may pause the world during page unload.
 // A rejoin must preserve that pause; resume using the actual shared UI.
 if((await probe(guest)).state==='paused')await guest.locator('#coopPause').click();
 await guest.waitForFunction(()=>__HEADON_TEST__.debug().state==='playing');check('guest reload / token rejoin / full reconciliation');
 await guest.keyboard.down('KeyD');await wait(250);await guest.keyboard.up('KeyD');const accepted=await host.evaluate(()=>__HEADON_TEST__.debug()._netSeq);assert(accepted>0);check('fresh guest inputs accepted after rejoin',accepted);
 await host.evaluate(()=>{const g=__HEADON_TEST__.debug();g.downPlayer(g.player('p1'));g.downPlayer(g.player('p2'));});await guest.waitForFunction(()=>__HEADON_TEST__.debug().state==='lost');assert.equal((await probe(host)).state,'lost');
 await guest.waitForFunction(()=>document.querySelector('#modalText').textContent.includes('랭킹에 제출하지'));check('both down game over / no ranking submission');
 await host.evaluate(()=>__HEADON_TEST__.debug().session.socket.close());await guest.waitForFunction(()=>document.querySelector('#modalTitle').textContent==='연결 종료');check('Host loss explicitly ends session');
 await host.locator('#modalActions button').first().click();await host.locator('#start').click();
 await host.waitForFunction(()=>{const g=__HEADON_TEST__.debug();return g&&!g.online&&g.t>1;});
 const single=await host.evaluate(()=>{const g=__HEADON_TEST__.debug();return {mode:g.mode||'endless',t:g.t,online:!!g.online,netTimer:!!g._netTimer};});assert(!single.online&&!single.netTimer);check('existing solo sortie / no network update',single);
 await host.screenshot({path:output+'/solo-regression.png'});
 assert.equal(errors.length,0,JSON.stringify(errors));
}finally{await host.screenshot({path:output+'/last-host.png'});await guest.screenshot({path:output+'/last-guest.png'});writeFileSync(output+'/browser-results.json',JSON.stringify({results,errors},null,2));await browser.close();}

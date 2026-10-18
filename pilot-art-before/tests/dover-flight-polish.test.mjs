import test from 'node:test';
import assert from 'node:assert/strict';
import {SupermarineNighthawk,SiemensSchuckertRVIII} from '../dover-night-bosses.js';
import {Game} from '../engine.js';
import {stageBossBounds} from '../stageboss-host.js';
import {doverPatrolChart,doverFlightBounds} from '../dover-patrol-chart.js';

const tuning={maxHp:1200,partHp:100,damage:20,bulletSpeed:240,geometryScale:.32};
const staticBounds={left:0,right:960,top:0,bottom:700};
const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const make=(Ctor,options={})=>new Ctor({id:options.id||'flight',tuning:{...tuning,...options.tuning},x:options.x??480,y:options.y??350,emit:options.emit});

test('Patrol steering follows its route rather than turning after either co-op player',()=>{
  for(const Ctor of [SupermarineNighthawk,SiemensSchuckertRVIII]){
    const a=make(Ctor,{id:'route-a'}),b=make(Ctor,{id:'route-b'});
    const left=[{id:'one',alive:true,x:-4000,y:9000,vx:-250,vy:80},{id:'two',alive:true,x:-2000,y:-7000,vx:200,vy:-40}];
    const right=[{id:'one',alive:true,x:8000,y:-5000,vx:300,vy:100},{id:'two',alive:true,x:5000,y:6000,vx:-300,vy:-100}];
    for(let i=0;i<250;i++){a.fly(.04,left,staticBounds,a.currentSpeed,.4,0);b.fly(.04,right,staticBounds,b.currentSpeed,.4,0);}
    assert.deepEqual([a.x,a.y,a.a,a.turnVelocity,a.bank],[b.x,b.y,b.a,b.turnVelocity,b.bank]);
  }
});

test('Maximum mobile step preserves forward-only motion, bounded yaw acceleration, and gentle bank',()=>{
  for(const [Ctor,turn] of [[SupermarineNighthawk,.5],[SiemensSchuckertRVIII,.4]]){
    const body=make(Ctor),dt=.04,accel=Math.max(.08,turn*.9);
    for(let i=0;i<500;i++){
      const x=body.x,y=body.y,a=body.a,w=body.turnVelocity;
      body.fly(dt,[],staticBounds,body.currentSpeed,turn,0);
      const dx=body.x-x,dy=body.y-y,distance=Math.hypot(dx,dy);
      assert.ok(Math.abs(angleDelta(body.a,a))<=turn*dt+1e-9);
      assert.ok(Math.abs(body.turnVelocity-w)<=accel*dt+1e-9);
      assert.ok(Math.abs(distance-body.flightSpeed*dt)<1e-8);
      assert.ok(Math.abs(angleDelta(Math.atan2(dy,dx),body.a))<1e-8,'heading is tangent to physical travel');
      assert.ok(Number.isFinite(body.bank)&&Math.abs(body.bank)<=1);
    }
  }
});

test('Flypasts can cross the viewport edge, then turn back without a clamp or teleport',()=>{
  for(const [Ctor,turn] of [[SupermarineNighthawk,.5],[SiemensSchuckertRVIII,.4]]){
    const body=make(Ctor,{x:955,y:350});body.a=0;body.rotateMounts();let wentOutside=false,reentered=false,maxStep=0,oldX=body.x,oldY=body.y;
    for(let i=0;i<1250;i++){
      body.fly(.04,[],staticBounds,body.currentSpeed,turn,0);const step=Math.hypot(body.x-oldX,body.y-oldY);maxStep=Math.max(maxStep,step);oldX=body.x;oldY=body.y;
      const outside=body.x<staticBounds.left||body.x>staticBounds.right||body.y<staticBounds.top||body.y>staticBounds.bottom;
      if(outside)wentOutside=true;else if(wentOutside)reentered=true;
      const w=staticBounds.right-staticBounds.left,h=staticBounds.bottom-staticBounds.top;
      assert.ok(body.x>staticBounds.left-w&&body.x<staticBounds.right+w&&body.y>staticBounds.top-h&&body.y<staticBounds.bottom+h);
    }
    assert.ok(wentOutside&&reentered);assert.ok(maxStep<=285*.04+1e-8);
    assert.ok(body.x!==staticBounds.right&&body.x!==staticBounds.left,'flight never assigns an edge coordinate');
  }
});

test('Patrols remain accessible while a mobile camera advances at cruising speed',()=>{
  for(const [Ctor,turn] of [[SupermarineNighthawk,.5],[SiemensSchuckertRVIII,.4]]){
    const body=make(Ctor,{x:700,y:430}),dt=.04;
    for(let i=0;i<750;i++){
      const scroll=-100*i*dt,bounds={left:0,right:1400,top:scroll,bottom:scroll+920};
      body.fly(dt,[],bounds,body.currentSpeed,turn,0);
      assert.ok(body.x>=bounds.left&&body.x<=bounds.right&&body.y>=bounds.top&&body.y<=bounds.bottom,`${body.kind} left the moving encounter`);
      assert.ok(Number.isFinite(body.x+body.y+body.flightSpeed+body.patrolFlowY));
    }
    assert.ok(Math.abs(body.patrolFlowY+100)<1e-6,'camera flow is learned smoothly without following a player turn');
  }
});

test('Engine and drive imbalance changes speed and yaw gradually',()=>{
  for(const [Ctor,part,target,rate,turn] of [[SupermarineNighthawk,'engine-left',.12,30,.5],[SiemensSchuckertRVIII,'drive-outer-left',.075,18,.4]]){
    const body=make(Ctor),before=body.currentSpeed;body.hit({partId:part,damage:1e6});
    body.update(.04,{players:[],bounds:staticBounds});const first=body.hullYaw;
    assert.ok(first>0&&first<target);assert.ok(before-body.currentSpeed<=rate*.04+1e-9);const oldTurn=body.turnVelocity;
    body.update(.04,{players:[],bounds:staticBounds});assert.ok(body.hullYaw>first&&body.hullYaw<target);
    assert.ok(Math.abs(body.turnVelocity-oldTurn)<=Math.max(.08,turn*.9)*.04+1e-9);assert.ok(Math.abs(body.bank)<=1);
  }
});

test('R.VIII announces a fixed in-view bombing stick without steering after the player',()=>{
  const events=[],body=make(SiemensSchuckertRVIII,{emit:e=>events.push(e)}),player={id:'one',alive:true,x:480,y:350,vx:40,vy:-80,radius:12};
  body.a=0;body.turnVelocity=0;body.rotateMounts();assert.equal(body.beginBombRun(player,staticBounds),true);
  const warning=events.find(e=>e.type==='dover-bomb-warning'),centre=[body.runCenterX,body.runCenterY],angle=body.runAngle;
  assert.ok(warning&&warning.safeGap===76);assert.equal(body.phase,'bomb-approach');
  let oldA=body.a,oldTurn=body.turnVelocity;
  for(let i=0;i<250&&events.filter(e=>e.visual==='rviii-bomb').length<8;i++){
    player.x=i%2?6000:-6000;player.y=i%3?5000:-5000;player.vx=i%2?-400:400;player.vy=i%3?350:-350;
    body.update(.04,{players:[player],bounds:staticBounds});
    assert.ok(Math.abs(angleDelta(body.a,oldA))<=.4*.04+1e-9);assert.ok(Math.abs(body.turnVelocity-oldTurn)<=.36*.04+1e-9);oldA=body.a;oldTurn=body.turnVelocity;
    assert.deepEqual([body.runCenterX,body.runCenterY],[...centre]);
  }
  const bombs=events.filter(e=>e.type==='hazard'&&e.visual==='rviii-bomb');assert.equal(bombs.length,8);
  const dx=Math.cos(angle),dy=Math.sin(angle),nx=-dy,ny=dx;
  for(let i=0;i<bombs.length;i++){
    const along=(bombs[i].x-centre[0])*dx+(bombs[i].y-centre[1])*dy,lateral=(bombs[i].x-centre[0])*nx+(bombs[i].y-centre[1])*ny;
    assert.ok(Math.abs(along-(i-3.5)*54)<1e-8);assert.ok(Math.abs(Math.abs(lateral)-76)<1e-8);assert.equal(bombs[i].angle,angle);
  }
});

const liveGame=(width)=>{const g=new Game('fokker','baron',()=>.5);Object.assign(g,{viewWidth:width,viewHeight:844,invuln:1e9});g.spawnEnemy=()=>null;g.spawnFlak=()=>{};return g;};
function gameFlight(Ctor,width,{damage=[],edge=null}={}){
  const g=liveGame(width),events=[],scale=1.2*Math.min(Ctor===SupermarineNighthawk?.55:.72,Math.max(Ctor===SupermarineNighthawk?.26:.32,width*(Ctor===SupermarineNighthawk?.8:.94)/1200)),chart=doverPatrolChart(g),flight=doverFlightBounds(g);
  let lockedX=null,lockedY=null;if(edge==='west')lockedX=flight.left;if(edge==='east')lockedX=flight.right;if(edge==='top')lockedY=flight.top;if(edge==='bottom')lockedY=flight.bottom;if(lockedX!==null)g.x=lockedX;if(lockedY!==null)g.y=lockedY;
  const body=new Ctor({id:'game-flight',tuning:{...tuning,geometryScale:scale},x:g.x,y:g.y-300,emit:e=>events.push({...e,time:g.t,phase:body.phase})});
  for(const id of damage)body.hit({partId:id,damage:1e6});
  let hiddenStart=null,longestHidden=0,hiddenCount=0,ordinary=0,centreVisible=0,vulnerable=0,vulnerableVisible=0,maxStep=0,lastX=body.x,lastY=body.y;const history=[];
  for(let i=0;i<3000;i++){
    const px=g.x,py=g.y;g.update(.02,{});g.x=lockedX??Math.max(flight.left,Math.min(flight.right,g.x));g.y=lockedY??Math.max(flight.top,Math.min(flight.bottom,g.y));const bounds=stageBossBounds(g),player={id:'p1',alive:true,x:g.x,y:g.y,vx:(g.x-px)/.02,vy:(g.y-py)/.02,radius:12};body.combatTime=g.t;body.update(.02,{players:[player],bounds,mapBounds:chart,isIlluminated:()=>false});history.push(bounds);
    const step=Math.hypot(body.x-lastX,body.y-lastY);maxStep=Math.max(maxStep,step);lastX=body.x;lastY=body.y;
    if(body.hidden&&hiddenStart===null){hiddenStart=g.t;hiddenCount++;}if(!body.hidden&&hiddenStart!==null){longestHidden=Math.max(longestHidden,g.t-hiddenStart);hiddenStart=null;}
    if(!body.phase.startsWith('sortie-')){ordinary++;if(body.coreInside(bounds,0))centreVisible++;}
    if(body.coreVulnerable){vulnerable++;if(body.coreInside(bounds,0)&&body.locateHit({x:body.x+body.coreOffset().x,y:body.y+body.coreOffset().y,radius:2}))vulnerableVisible++;}
  }
  if(hiddenStart!==null)longestHidden=Math.max(longestHidden,g.t-hiddenStart);
  return{g,body,events,history,hiddenCount,longestHidden,ordinary,centreVisible,vulnerable,vulnerableVisible,maxStep};
}

for(const width of [390,1280])test(`Full Dover chart permits one complete ${width}px sortie beside every finite-map edge`,()=>{
  for(const edge of ['west','east','top','bottom'])for(const Ctor of [SupermarineNighthawk,SiemensSchuckertRVIII]){
    const r=gameFlight(Ctor,width,{edge}),wide=width>720,rows=Ctor===SupermarineNighthawk?5:6,lanes=wide?4:2,expected=rows*lanes,bombs=r.events.filter(e=>e.type==='hazard'&&e.sortie),warning=r.events.find(e=>e.type==='dover-bomb-warning'&&e.sortie);
    assert.equal(r.hiddenCount,1,`${r.body.kind} ${edge} must fully depart once`);assert.ok(r.longestHidden<10,`${r.body.kind} ${edge} offscreen interval ${r.longestHidden}`);assert.equal(bombs.length,expected,`${r.body.kind} ${edge} must complete the sortie payload`);assert.deepEqual([warning.rows,warning.lanes,warning.count],[rows,lanes,expected]);assert.equal(r.body.hidden,false);assert.ok(r.events.some(e=>e.type==='phase-change'&&e.phase==='sortie-recovery'),'the aircraft naturally returns to its recovery');
    for(const bomb of bombs){const at=Math.min(r.history.length-1,Math.round((bomb.time+bomb.warning)/.02)-1),b=r.history[at];assert.ok(bomb.x+bomb.radius>=b.left&&bomb.x-bomb.radius<=b.right&&bomb.y+bomb.radius>=b.top&&bomb.y-bomb.radius<=b.bottom,`${r.body.kind} ${edge} carpet remains in the camera window`);}
    const e=r.body.airframeExtents();assert.ok(r.body.x>=doverPatrolChart(r.g).left-e.x-360&&r.body.x<=doverPatrolChart(r.g).right+e.x+360&&r.body.y>=doverPatrolChart(r.g).top-e.y-360&&r.body.y<=doverPatrolChart(r.g).bottom+e.y+360);
  }
});

for(const width of [390,1280])test(`Real Game ${width}px flight keeps ordinary attacks reachable and limits each deliberate sortie`,()=>{
  for(const Ctor of [SupermarineNighthawk,SiemensSchuckertRVIII]){
    const r=gameFlight(Ctor,width);assert.equal(r.hiddenCount,1);assert.ok(r.longestHidden>2&&r.longestHidden<8,`${r.body.kind} hidden ${r.longestHidden}`);
    assert.ok(r.centreVisible/r.ordinary>.72,`${r.body.kind} ordinary core position ratio ${r.centreVisible/r.ordinary}`);
    assert.ok(r.vulnerable>150&&r.vulnerableVisible/r.vulnerable>.82,`${r.body.kind} hittable core ratio ${r.vulnerableVisible/r.vulnerable}`);assert.ok(r.maxStep<=285*.02+1e-8);
    const sortieBombs=r.events.filter(e=>e.type==='hazard'&&e.sortie),wide=width>720,rows=Ctor===SupermarineNighthawk?5:6,lanes=wide?4:2,expected=rows*lanes;assert.equal(sortieBombs.length,expected);
    assert.ok(sortieBombs.every(e=>e.kind==='circle'&&e.airborneBomb&&e.sourcePartId===null&&e.warning===1.1));
    assert.ok(!r.events.some(e=>e.phase==='sortie-hidden'&&e.type==='hazard'&&e.kind==='projectile'),'hidden aircraft never fires guns');
    const warning=r.events.find(e=>e.type==='dover-bomb-warning'&&e.sortie);assert.ok(warning&&warning.safeGap===80);assert.deepEqual([warning.rows,warning.lanes,warning.count],[rows,lanes,expected]);assert.ok(warning.length>=(r.history[0].bottom-r.history[0].top)*.69,'signature carpet covers most of the viewport');
    for(let row=0;row<rows;row++){const inner=lanes===2?row*lanes:row*lanes+1,a=sortieBombs[inner],b=sortieBombs[inner+1];assert.ok(Math.hypot(a.x-b.x,a.y-b.y)-a.radius-b.radius>=79.9,'each row preserves the advertised central corridor');}
    for(const e of sortieBombs){const at=Math.min(r.history.length-1,Math.round((e.time+e.warning)/.02)-1),b=r.history[at];assert.ok(e.x+e.radius>=b.left&&e.x-e.radius<=b.right&&e.y+e.radius>=b.top&&e.y-e.radius<=b.bottom,'sortie blast remains in the moving viewport');}
  }
});

test('Damaged propulsion still returns a hittable core after the one mobile sortie',()=>{
  for(const [Ctor,damage] of [[SupermarineNighthawk,['engine-left']],[SiemensSchuckertRVIII,['drive-outer-left','drive-inner-left']]]){
    const r=gameFlight(Ctor,390,{damage});assert.equal(r.hiddenCount,1);assert.ok(r.longestHidden<8);assert.ok(r.vulnerableVisible/r.vulnerable>.75,`${r.body.kind} damaged core ratio ${r.vulnerableVisible/r.vulnerable}`);assert.ok(r.body.currentSpeed<(Ctor===SupermarineNighthawk?148:112));assert.notEqual(r.body.hullYaw,0);
  }
});

test('Finite chart walls produce a bounded tangent turn without a clamp or teleport',()=>{
  const viewport={left:300,right:900,top:-400,bottom:400},chart={left:-900,right:900,top:-4000,bottom:500};
  for(const [Ctor,turn] of [[SupermarineNighthawk,.5],[SiemensSchuckertRVIII,.4]]){
    const body=make(Ctor,{x:820,y:0});body.a=0;body.rotateMounts();let maxX=body.x,maxStep=0,oldX=body.x,oldY=body.y,turned=false;
    for(let i=0;i<750;i++){const oldA=body.a;body.fly(.04,[],viewport,body.currentSpeed,turn,0,null,null,chart);maxX=Math.max(maxX,body.x);maxStep=Math.max(maxStep,Math.hypot(body.x-oldX,body.y-oldY));oldX=body.x;oldY=body.y;if(Math.cos(body.a)<0)turned=true;assert.ok(Math.abs(angleDelta(body.a,oldA))<=turn*.04+1e-9);}
    assert.ok(turned);assert.ok(maxX<chart.right+360,'slow wall turn stays in a finite overshoot envelope');assert.ok(maxStep<=285*.04+1e-8);assert.notEqual(body.x,chart.right);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {SupermarineNighthawk,SiemensSchuckertRVIII} from '../dover-night-bosses.js';

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

test('Opposite-facing R.VIII aligns without snapping before telegraphing one committed bombing corridor',()=>{
  const events=[],body=make(SiemensSchuckertRVIII,{emit:e=>events.push(e)}),player={id:'one',alive:true,x:-500,y:350,vx:0,vy:0,radius:12};body.a=0;body.turnVelocity=0;body.rotateMounts();
  assert.equal(body.beginBombRun(player),true);const angle=body.runAngle;assert.ok(Math.abs(Math.abs(angle)-Math.PI)<1e-8);assert.equal(events.some(e=>e.type==='dover-bomb-warning'),false);
  let warning=null,warningHeading=null,warningAt=null,firstReleaseHeading=null,oldA=body.a,oldTurn=body.turnVelocity;
  for(let i=0;i<450&&events.filter(e=>e.type==='hazard'&&e.visual==='rviii-bomb').length<8;i++){
    player.x=i%2?6000:-6000;player.y=i%3?5000:-5000;player.vx=i%2?-400:400;player.vy=i%3?350:-350;const before=events.length;
    body.update(.04,{players:[player],bounds:staticBounds});
    assert.ok(Math.abs(angleDelta(body.a,oldA))<=.4*.04+1e-9);assert.ok(Math.abs(body.turnVelocity-oldTurn)<=.36*.04+1e-9);oldA=body.a;oldTurn=body.turnVelocity;
    if(body.phase==='bomb-align'||body.phase==='bomb-approach'||body.phase==='bomb-run')assert.equal(body.runAngle,angle);
    for(const event of events.slice(before)){if(event.type==='dover-bomb-warning'){warning=event;warningHeading=body.a;warningAt=i*.04;}if(event.type==='hazard'&&event.visual==='rviii-bomb'&&firstReleaseHeading===null)firstReleaseHeading=body.a;}
  }
  assert.ok(warningAt>5,'the route is hidden during the long alignment turn');assert.ok(Math.abs(angleDelta(warningHeading,angle))<=.08+1e-9);
  assert.equal(warning.angle,angle);assert.equal(warning.safeGap,76);assert.ok(Number.isFinite(warning.exitAngle+warning.x+warning.y+warning.length));assert.ok(Math.abs(angleDelta(firstReleaseHeading,angle))<.04);
  const bombs=events.filter(e=>e.type==='hazard'&&e.visual==='rviii-bomb');assert.equal(bombs.length,8);const cx=warning.x,cy=warning.y,dx=Math.cos(angle),dy=Math.sin(angle),nx=-dy,ny=dx;
  for(let i=0;i<bombs.length;i++){
    const along=(bombs[i].x-cx)*dx+(bombs[i].y-cy)*dy,lateral=(bombs[i].x-cx)*nx+(bombs[i].y-cy)*ny;
    assert.ok(Math.abs(along-(i-3.5)*54)<1e-8);assert.ok(Math.abs(Math.abs(lateral)-76)<1e-8);assert.equal(bombs[i].angle,angle);
    assert.ok((bombs[i].x-bombs[i].sourceX)*dx+(bombs[i].y-bombs[i].sourceY)*dy>0,'each bomb falls ahead along the committed flight path');
    assert.equal(bombs[i].sourcePartId,null);assert.ok(Number.isFinite(bombs[i].sourceX+bombs[i].sourceY));
  }
});

// Ordinary city only. Co-op calls this once for the shared world, not per pilot.
export const CITY_DEFENSE=Object.freeze({lockTime:1.2,beamHalf:.16,beamRange:520,warning:.65,reload:2.7,speed:250});
const delta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const pilots=g=>g.players?g.players.filter(p=>p.hp>0&&p.status==='alive'):[g];
export function spawnCityDefense(g){
 if(g.worldRegion()!==4||g.enemies.some(e=>e.cityUnit&&!e.expired&&e.hp>0))return;
 const a=g.a||0,hx=Math.cos(a),hy=Math.sin(a),nx=-hy,ny=hx;
 const bx=g.x+hx*420,by=g.y+hy*420,serial=(g._citySerial||0)+1;g._citySerial=serial;
 for(const [i,lat] of [-210,210].entries()){
  let light;
  for(const kind of ['light','pit']){
   const e=g.spawnEnemy('bomber');if(!e)continue;
   const hp=kind==='light'?130:110;
   Object.assign(e,{type:'installation',heavyBomber:false,bossPilot:false,burstLeft:0,fieldSalvoLeft:0,cityUnit:kind,cityNetwork:serial,cityLink:i,facSprite:kind==='light'?'fx-city-searchlight-pit2':'fx-city-aagun',facSize:kind==='light'?76:88,name:kind==='light'?'탐조등 진지':'연동 대공포좌',x:bx+nx*lat+hx*(kind==='pit'?95:0),y:by+ny*lat+hy*(kind==='pit'?95:0),a:0,speed:0,stationary:true,surface:true,hitRadius:kind==='light'?36:34,hp,maxHp:hp,fire:9,ace:false,escortPlane:undefined,hazardRegion:4,xpValue:10,scanA:a+Math.PI,scanBase:a+Math.PI,scanPhase:i*Math.PI,locks:new Map(),lit:new Map(),lockT:0,fireT:1+i*.8,cityShot:null});
   if(kind==='light')light=e;else e.cityLamp=light;
  }
 }
 g._citySpawned=true;g.event('flak','도심 방공망 · 탐조등을 파괴하면 연결 포좌의 추적 사격이 멈춥니다');
}
export function tickCityDefense(g,dt){
 if(g.state!=='playing'||dt<=0)return;
 const step=Math.min(.04,dt),ps=pilots(g),B=CITY_DEFENSE;
 const active=g.worldRegion()===4&&(!g.stageBoss||g.stageBoss.stages.phase==='explore');
 if(!active){
  for(const e of g.enemies||[])if(e.cityUnit){e.cityShot=null;e.lit?.clear();e.lockT=0;}
  for(const p of ps)p.illuminatedUntil=0;
  g._litBeam=false;if(g.worldRegion()!==4){g._citySpawned=false;g._cityRespawn=0;}return;
 }
 let units=(g.enemies||[]).filter(e=>e.cityUnit&&!e.expired&&e.hp>0);
 for(const e of units)if(ps.every(p=>Math.hypot(e.x-p.x,e.y-p.y)>1800))e.expired=true;
 units=units.filter(e=>!e.expired);
 if(!units.length){g._cityRespawn=Math.max(0,(g._cityRespawn||0)-step);if(g._cityRespawn<=0){spawnCityDefense(g);g._cityRespawn=9;}units=g.enemies.filter(e=>e.cityUnit&&e.hp>0&&!e.expired);}
 let lit=false;
 for(const e of units.filter(e=>e.cityUnit==='light')){
  const tracked=ps.find(p=>(e.locks.get(p.id||'p1')||0)>.15&&(p.cloudConceal||0)<.9&&Math.hypot(p.x-e.x,p.y-e.y)<B.beamRange);
  const aim=tracked?Math.atan2(tracked.y-e.y,tracked.x-e.x):e.scanBase+Math.sin((g.t||0)*.22+e.scanPhase)*.95;
  e.scanA+=Math.max(-step*.65,Math.min(step*.65,delta(aim,e.scanA)));e.lockT=0;
  for(const p of ps){
   const id=p.id||'p1',d=Math.hypot(p.x-e.x,p.y-e.y),inBeam=(p.cloudConceal||0)<.9&&d<B.beamRange&&Math.abs(delta(Math.atan2(p.y-e.y,p.x-e.x),e.scanA))<B.beamHalf;
   const lock=Math.max(0,Math.min(B.lockTime,(e.locks.get(id)||0)+(inBeam?step:-step*1.6)));
   e.locks.set(id,lock);e.lockT=Math.max(e.lockT,lock);lit||=inBeam;
   if(lock>=B.lockTime)e.lit.set(id,(g.t||0)+1.2);
   if((p.cloudConceal||0)>=.9)e.lit.delete(id);
  }
 }
 for(const p of ps)p.illuminatedUntil=Math.max(0,...units.filter(e=>e.cityUnit==='light').map(e=>e.lit.get(p.id||'p1')||0));
 for(const e of units.filter(e=>e.cityUnit==='pit')){
  const lamp=e.cityLamp,targets=lamp&&lamp.hp>0&&!lamp.expired?ps.filter(p=>(lamp.lit.get(p.id||'p1')||0)>(g.t||0)):[];
  if(e.cityShot){
   if(!targets.some(p=>(p.id||'p1')===e.cityShot.id)){e.cityShot=null;continue;}
   e.cityShot.remaining-=step;
   if(e.cityShot.remaining<=0){
    const a=Math.atan2(e.cityShot.y-e.y,e.cityShot.x-e.x),x=e.x+Math.cos(a)*28,y=e.y+Math.sin(a)*28;
    for(let j=-1;j<=1;j++){const h=a+j*.095;g.bullets.push({x,y,vx:Math.cos(h)*B.speed,vy:Math.sin(h)*B.speed,life:3.5,enemy:true,fireZone:true,hazardRegion:4,visualType:'flak',damage:Math.round(9*(1+(g.t||0)/300))});}
    g.burst?.(x,y,'#ffd9a0',4);e.muzzleFlash=.14;e.cityShot=null;e.fireT=B.reload;
   }
  }else{
   e.fireT-=step;if(e.fireT<=0&&targets.length){const p=targets[(e.cityCursor||0)%targets.length];e.cityCursor=(e.cityCursor||0)+1;const lead=Math.min(.65,Math.hypot(p.x-e.x,p.y-e.y)/B.speed*.35);e.cityShot={id:p.id||'p1',x:p.x+(p.vx??Math.cos(p.a||0)*(p.speed||0))*lead,y:p.y+(p.vy??Math.sin(p.a||0)*(p.speed||0))*lead,remaining:B.warning};e.a=Math.atan2(e.cityShot.y-e.y,e.cityShot.x-e.x);}
  }
 }
 g._litBeam=lit;
}

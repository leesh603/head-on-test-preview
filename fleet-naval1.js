import {fleetGunStations} from './naval-faction-atlas.js?v=perf5';
import {drawFleetShip,prepareFleetShipArt} from './jutland-view.js?v=perf5';
import {vacantShipPose,steerShipClear,resolveSurfaceSpacing,shipObstacles} from './naval-spacing.js?v=perf5';
import {drawShipWater,recordShipWake} from './naval-water.js?v=perf5';
import {drawSinkingShip,prepareSinkingWater,FLEET_SINK_DURATION} from './ship-sinking.js?v=perf5';
// Moving fleet system — Adriatic (region 1) and Zeebrugge harbor (region 7).
// Ships sail real headings, fire from actual gun positions on the hull, and are
// faction-owned: hostile ships hunt the player, friendly ships engage aircraft.
import {PLANES} from './engine.js?v=perf5';
import {fx} from './fx-art.js?v=perf5';

export const SHIP_TYPES=Object.freeze({
 dd:{name:'구축함',hp:150,drawnH:300,speed:26,guns:[96,-99],salvo:5,spread:.15,shellSpeed:215,interval:3.2,width:88},
 aa:{name:'대공순양함',hp:340,drawnH:380,speed:17,guns:[79,5,-39,-98],salvo:3,spread:.09,shellSpeed:205,interval:4.6,width:205}
});
export function installFleet(Game){
 if(typeof Image!=='undefined'){prepareFleetShipArt();prepareSinkingWater();}
 const P=Game.prototype;
 P.spawnMovingFleet=function(faction){
  const region=this.worldRegion();
  if(![1,7,16].includes(region)||this.enemies.length>60)return null;
  const friendly=faction===playerFaction(this),list=friendly?(this.friendlyShips??=[]):this.enemies;const live=list.filter(e=>e.navalVessel&&e.hp>0).length;
  if(live>=(friendly?2:4))return null;
  const playerSide=(typeof PLANES==='object'&&this.plane&&PLANES[this.plane])?PLANES[this.plane].faction:'entente';
  const side=faction??(playerSide==='central'?'entente':'central');
  const harbor=region===7&&this.navalRoute;if(harbor&&(this.navalRoute.maxForward||0)>=10400)return null;
  const baseHeading=harbor?this.navalRoute.a:this.a+(this.rng()-.5)*.45,heading=baseHeading+(friendly?Math.PI:0);
  const hx=Math.cos(baseHeading),hy=Math.sin(baseHeading),nx=-hy,ny=hx;
  const ahead=480+this.rng()*280,lateral=(friendly?-1:1)*(180+this.rng()*180);
  const bx=this.x+hx*ahead+nx*lateral,by=this.y+hy*ahead+ny*lateral;
  const comp=(friendly?['dd','aa']:['aa','dd']).slice(0,Math.min(2,(friendly?2:4)-live));
  const ships=[];
  for(let i=0;i<comp.length;i++){
   const cls=comp[i],t=SHIP_TYPES[cls],e=friendly?{}:this.spawnEnemy('bomber');if(!e)break;
   const off=(i-(comp.length-1)/2)*130,back=i*150;
   Object.assign(e,{type:'ship',shipClass:cls,faction:side,name:side==='entente'?(cls==='aa'?'연합국 '+t.name:'연합국 '+t.name):(cls==='aa'?'중앙국가 '+t.name:'중앙국가 '+t.name),x:bx+nx*off-hx*back,y:by+ny*off-hy*back,a:heading,course:heading,weave:this.rng()*6.28,speed:0,sailingSpeed:t.speed,driveVelocity:0,stationary:true,surface:true,navalVessel:true,movingShip:true,hitRadius:cls==='aa'?44:36,hullLength:t.drawnH*.45,hullWidth:t.drawnH*.12,hp:t.hp,maxHp:t.hp,fire:2+i*.9,ace:false,escortPlane:undefined,life:70,hazardRegion:region,xpValue:cls==='aa'?16:9});
   if(region===14&&this.gallipoliRoute){const r=this.gallipoliRoute,s=(e.x-r.x)*Math.cos(r.a)+(e.y-r.y)*Math.sin(r.a);if(s>2300){const n=-(e.x-r.x)*Math.sin(r.a)+(e.y-r.y)*Math.cos(r.a);e.x=r.x+Math.cos(r.a)*2300-Math.sin(r.a)*n;e.y=r.y+Math.sin(r.a)*2300+Math.cos(r.a)*n}}
   if(!vacantShipPose(this,e)){if(!friendly)e.expired=true;continue;}if(friendly)this.friendlyShips.push(e);ships.push(e);
  }
  if(ships.length)this.event('flak',side===((this.plane&&PLANES[this.plane])?PLANES[this.plane].faction:'entente')?'아군 함대 진입 · 아군 화망을 활용하세요':'적 함대 접근 · 함선 대공 화망을 피하세요');
  return ships;
 };
 const _fleetSpawn61=Game.prototype.spawnFleet;
 Game.prototype.spawnFleet=function(){
  if(![1,7,14,16].includes(this.worldRegion()))return _fleetSpawn61.call(this);
  return this.spawnMovingFleet();
 };
 P.fleetCrossing=function(){
  if(![1,7,16].includes(this.worldRegion()))return null;
  const playerSide=PLANES[this.plane]?.faction??'entente';
  const foe=playerSide==='central'?'entente':'central';
  this.spawnMovingFleet(foe);this.spawnMovingFleet(playerSide);
  this.event('flak','함대 교차 해역 — 양측 대공 화망이 교차합니다');
 };
 const _fleetFire61=Game.prototype.fireEnemy;
 Game.prototype.fireEnemy=function(e){
  if(!e.movingShip)return _fleetFire61.call(this,e);
  const t=SHIP_TYPES[e.shipClass],boost=(this.fleetBoostUntil||0)>(this.t||0)?.7:1;
  e.fire=t.interval*boost;
  const friendly=e.faction===playerFaction(this);if(fireSurfaceExchange(this,e,t))return;
  if(friendly){this._friendlyShipFire(e,t);return}
  const d=Math.hypot(this.x-e.x,this.y-e.y);
  if(d>980)return;
  const aim=Math.atan2(this.y-e.y,this.x-e.x),lead=d/t.shellSpeed;
  const tx=this.x+Math.cos(this.a||0)*(this.speed||0)*lead,ty=this.y+Math.sin(this.a||0)*(this.speed||0)*lead;
  const aimLead=Math.atan2(ty-e.y,tx-e.x);
  for(const along of fleetGunStations(e.faction,e.shipClass,t.drawnH*.9)){
   const gx=e.x+Math.cos(e.a)*along,gy=e.y+Math.sin(e.a)*along;
   for(let i=0;i<t.salvo;i++){const h=aimLead+(i-(t.salvo-1)/2)*t.spread;this.bullets.push({x:gx,y:gy,vx:Math.cos(h)*t.shellSpeed,vy:Math.sin(h)*t.shellSpeed,life:4.4,enemy:true,heavy:true,naval:true,hazardRegion:e.hazardRegion??this.worldRegion(),damage:Math.round(13*(1+this.t/260))})}
   this.burst(gx,gy,'#ffd9a0',5);
  }
  e.gunAim=aim;e.muzzleFlash=.16;this.event('enemyShot','');
 };
 // Distant friendly patrols cross the Adriatic horizon as ambient traffic.
 P.spawnDistantPatrol=function(){return this.spawnMovingFleet(playerFaction(this));};
 P._friendlyShipFire=function(e,t){
  let best=null,bd=850*850;
  for(const foe of this.enemies){if(foe.hp<=0||foe===e||foe.navalVessel||foe.fieldUnit||foe.surface)continue;const d=(foe.x-e.x)**2+(foe.y-e.y)**2;if(d<bd){bd=d;best=foe}}
  if(!best)return;
  const aim=Math.atan2(best.y-e.y,best.x-e.x);
  for(const along of fleetGunStations(e.faction,e.shipClass,t.drawnH*.9)){
   const gx=e.x+Math.cos(e.a)*along,gy=e.y+Math.sin(e.a)*along;
   for(let i=0;i<2;i++){const h=aim+(i-.5)*.1;this.bullets.push({x:gx,y:gy,vx:Math.cos(h)*240,vy:Math.sin(h)*240,life:3.6,patrol:true,fireZone:true,ally:true,damage:11,hit:new Set()})}
   this.burst(gx,gy,'#b9f2de',4);
  }
  e.muzzleFlash=.16;
 };
 const _fleetUpdate61=Game.prototype.update;
 Game.prototype.update=function(dt,input={}){
  _fleetUpdate61.call(this,dt,input);
  if(this.state!=='playing')return;
  updateNavalFleet(this,dt);
 };
}

export function drawFleetLayer(c,game,{point}){
 const cw=c.canvas.width,ch=c.canvas.height;
 for(const q of game.navalExchanges||[]){const t=q.age/q.duration,[x,y]=point(q.sx+(q.x-q.sx)*t,q.sy+(q.y-q.sy)*t),a=Math.atan2(q.y-q.sy,q.x-q.sx);fx(c,'shell',x,y-Math.sin(t*Math.PI)*24,23,9,a,.95);if(t<.15)fx(c,'muzzleHeavy',...point(q.sx,q.sy),42,25,a,.65);}
 // Combat corpses are detached from the visual wreck as soon as they die.
 for(const e of [...(game.enemies||[]),...(game.friendlyShips||[])]){
  if(!e.movingShip||e.expired)continue;
  if(e.hp<=0)continue;
  const t=SHIP_TYPES[e.shipClass],[x,y]=point(e.x,e.y),h=t.drawnH*.9,w=h*.21;
  if(x<-h||x>cw+h||y<-h||y>ch+h)continue;
   drawShipWater(c,e,w,h,point);c.save();c.translate(x,y);drawFleetShip(c,e,h,t.guns);c.restore();
   if(e.faction===playerFaction(game)){c.save();c.fillStyle='#b9d5c6';c.font='bold 11px sans-serif';c.textAlign='center';c.fillText('아군 '+t.name,x,y+h*.53);c.restore();}
 }
 for(const p of game.shipSinkPuffs||[]){const [x,y]=point(p.x,p.y);if(x<-p.h||x>cw+p.h||y<-p.h||y>ch+p.h)continue;
  drawSinkingShip(c,{key:p,x,y,yaw:p.ship.a+Math.PI/2,width:p.h*(p.ship.shipClass==='aa'?.24:.20),height:p.h,age:p.age,duration:FLEET_SINK_DURATION},k=>{
   k.save();k.translate(x,y);drawFleetShip(k,p.ship,p.h,SHIP_TYPES[p.ship.shipClass].guns);k.restore();});}
}

const playerFaction=g=>g.teamFaction??PLANES[g.plane]?.faction??'entente';
export function updateNavalFleet(g,dt){if(g.state!=='playing')return;
  const step=Math.min(.04,Math.max(0,dt)),region=g.worldRegion();if(g.navalRegion!==undefined&&g.navalRegion!==region){g.friendlyShips=[];g.navalExchanges=[];g.shipSinkPuffs=[];}g.navalRegion=region;if(![1,7,16].includes(region)){g.friendlyShips=[];g.navalExchanges=[];}
  const _fleetShipIter=[];for(const e of g.enemies)_fleetShipIter.push(e);for(const e of g.friendlyShips||[])_fleetShipIter.push(e);
  const _obstacles=shipObstacles(g);
  for(const e of _fleetShipIter){
   if(e.movingShip&&e.hp<=0){
    if(!e.sinkTracked){e.sinkTracked=true;
     const h=(SHIP_TYPES[e.shipClass]?.drawnH||320)*.9;
     const ship={a:e.a,shipClass:e.shipClass,faction:e.faction,hp:0,maxHp:e.maxHp,gunAim:e.gunAim};
     const wrecks=g.shipSinkPuffs??=[];wrecks.push({x:e.x,y:e.y,h,age:0,ship});if(wrecks.length>16)wrecks.shift();}
    e.driveVelocity=0;e.expired=true;
    continue}
   // Recon seaplanes shadow the player and spot for fleet support; cloud cover breaks it.
   if(e.recon&&e.hp>0){
    const d=Math.hypot(e.x-g.x,e.y-g.y);
    const exposed=d<750&&(g.cloudConceal||0)<.7;
    if(exposed)e.spot=(e.spot||0)+step;else e.spot=Math.max(0,(e.spot||0)-step*1.4);
    if((e.spot||0)>=4&&!e.spotted){e.spotted=true;g.fleetBoostUntil=(g.t||0)+20;g.spawnMovingFleet();g.event('flak','수상기가 함대에 위치를 송신 — 지원 함대 접근 중')}
   }
   if(!e.movingShip||e.hp<=0||e.expired)continue;
   if(!e.moored){
    e.weave+=step*.22;const desired=steerShipClear(g,e,step,_obstacles);const turn=Math.atan2(Math.sin(desired-e.a),Math.cos(desired-e.a));e.a+=Math.max(-.08*step,Math.min(.08*step,turn));e.driveVelocity=Math.min(e.sailingSpeed,e.driveVelocity+6*step);e.x+=Math.cos(e.a)*e.driveVelocity*step;e.y+=Math.sin(e.a)*e.driveVelocity*step;if(region===7&&g.navalRoute){const r=g.navalRoute,hx=Math.cos(r.a),hy=Math.sin(r.a),nx=-hy,ny=hx,along=(e.x-r.x)*hx+(e.y-r.y)*hy,lat=(e.x-r.x)*nx+(e.y-r.y)*ny,bank=Math.max(80,(r.bankAt?.(along,Math.sign(lat)||1)??430)-90);if(Math.abs(lat)>bank){e.x-=nx*(lat-Math.sign(lat)*bank)*Math.min(1,step*2);e.y-=ny*(lat-Math.sign(lat)*bank)*Math.min(1,step*2);}if(along>=10400)e.expired=true;}
    if(region===14&&g.gallipoliRoute){const r=g.gallipoliRoute,s=(e.x-r.x)*Math.cos(r.a)+(e.y-r.y)*Math.sin(r.a);if(s>2350){const n=-(e.x-r.x)*Math.sin(r.a)+(e.y-r.y)*Math.cos(r.a),pull=Math.min(1,step*2.4);e.x-=Math.cos(r.a)*(s-2350)*pull;e.y-=Math.sin(r.a)*(s-2350)*pull}}
   }
   if(Math.hypot(e.x-g.x,e.y-g.y)>2600)e.expired=true;
  }
  // Ambient fleet cadence — the sea should regularly show real ships.
  if([1,7,16].includes(region)){
   g.fleetAmbient=(g.fleetAmbient??6)-step;
   if(g.fleetAmbient<=0){g.fleetAmbient=30+g.rng()*10;
    const liveShips=g.enemies.filter(e=>e.navalVessel&&e.hp>0&&!e.patrolShip).length;
    if(liveShips<3&&g.enemies.length<62)g.spawnMovingFleet();
    if(!(g.friendlyShips||[]).some(e=>e.hp>0))g.spawnMovingFleet(playerFaction(g));
   }
  }else g.fleetAmbient=6;
  // Ambient recon planes over the sea.
  if([1,7,16].includes(region)){
   g.reconTimer=(g.reconTimer??18)-step;
   if(g.reconTimer<=0){g.reconTimer=42;
    if(!g.enemies.some(e=>e.recon&&e.hp>0)&&g.enemies.length<58){
     const e=g.spawnEnemy('scout');
     if(e){const a=g.a+(g.rng()-.5)*1.4,d=560+g.rng()*140;
      Object.assign(e,{recon:true,escortPlane:playerFaction(g)==='central'?'macchi_m3':'ff33',name:'수상 정찰기',x:g.x+Math.cos(a)*d,y:g.y+Math.sin(a)*d,speed:72,hp:26,maxHp:26,spot:0});
      g.event('wave','수상 정찰기 접근 — 구름에 숨거나 격추해 함대 지원을 차단하세요')}
    }
   }
  }else{g.reconTimer=18}
  resolveSurfaceSpacing(g);_fleetShipIter.length=0;for(const e of g.enemies)_fleetShipIter.push(e);for(const e of g.friendlyShips||[])_fleetShipIter.push(e);for(const e of _fleetShipIter)if(e.movingShip&&e.hp>0&&!e.expired)recordShipWake(e,step,SHIP_TYPES[e.shipClass].drawnH*.9);
  for(const e of g.friendlyShips||[]){e.life-=step;if(e.hp>0){e.fire-=step;if(e.fire<=0){e.fire=SHIP_TYPES[e.shipClass].interval;if(!fireSurfaceExchange(g,e,SHIP_TYPES[e.shipClass]))g._friendlyShipFire(e,SHIP_TYPES[e.shipClass]);}}}
  {const fs=g.friendlyShips||[];let w=0;for(let i=0;i<fs.length;i++){const e=fs[i];if(e.hp>0&&!e.expired&&e.life>0&&e.hazardRegion===region)fs[w++]=e}fs.length=w;g.friendlyShips=fs;}
  {const ex=g.navalExchanges||[];let w=0;for(let i=0;i<ex.length;i++){const q=ex[i];q.age+=step;if(q.age<q.duration){ex[w++]=q;continue}const target=q.target;if(target.hp>0&&Math.hypot(target.x-q.x,target.y-q.y)<70){target.hp=Math.max(0,target.hp-q.damage);target.hitFlash=.24;g.combatBlast?.(q.x,q.y,40,'enemy','naval');if(target.hp<=0&&!target.movingShip)target.expired=true;}}ex.length=w;g.navalExchanges=ex;}
  {const ps=g.shipSinkPuffs||[];let w=0;for(let i=0;i<ps.length;i++){const p=ps[i];p.age+=step;if(p.age<FLEET_SINK_DURATION)ps[w++]=p}ps.length=w;g.shipSinkPuffs=ps;}
}

export function fireSurfaceExchange(g,e,t){
 const targets=e.faction===playerFaction(g)?g.enemies:(g.friendlyShips||[]);let target=null,distance=1100;
 for(const foe of targets){if(!foe.movingShip||foe.hp<=0||foe.faction===e.faction)continue;const d=Math.hypot(foe.x-e.x,foe.y-e.y);if(d<distance){distance=d;target=foe;}}
 if(!target)return false;g.navalExchanges??=[];if(g.navalExchanges.length>=24)return true;
 const duration=Math.max(.9,distance/330),x=target.x+Math.cos(target.a)*(target.driveVelocity||0)*duration,y=target.y+Math.sin(target.a)*(target.driveVelocity||0)*duration;
 for(const along of fleetGunStations(e.faction,e.shipClass,t.drawnH*.9).slice(0,2)){if(g.navalExchanges.length>=24)break;const sx=e.x+Math.cos(e.a)*along,sy=e.y+Math.sin(e.a)*along;g.navalExchanges.push({sx,sy,x,y,age:0,duration,target,damage:18,faction:e.faction});}e.gunAim=Math.atan2(y-e.y,x-e.x);e.muzzleFlash=.16;g.event('enemyShot','');return true;
}
export function installCoopFleet(Coop,Game){const p=Coop.prototype;for(const key of ['spawnMovingFleet','spawnFleet','_friendlyShipFire','fleetCrossing'])p[key]=Game.prototype[key];const fire=p.fireEnemy;p.fireEnemy=function(e){return e.movingShip?Game.prototype.fireEnemy.call(this,e):fire.call(this,e)};const update=p.update;p.update=function(dt,input){update.call(this,dt,input);updateNavalFleet(this,dt)};}

// Moving fleet system — Adriatic (region 1) and Zeebrugge harbor (region 7).
// Ships sail real headings, fire from actual gun positions on the hull, and are
// faction-owned: hostile ships hunt the player, friendly ships engage aircraft.
import {PLANES} from './engine.js?v=327&b=326';
export const SHIP_TYPES=Object.freeze({
 dd:{name:'구축함',hp:150,drawnH:300,speed:26,guns:[96,-99],salvo:5,spread:.15,shellSpeed:215,interval:3.2,width:88},
 aa:{name:'대공순양함',hp:340,drawnH:380,speed:17,guns:[79,5,-39,-98],salvo:3,spread:.09,shellSpeed:205,interval:4.6,width:205}
});
const SHIP_IMG={ent_dd:'fx-ship-ent-dd',cen_dd:'fx-ship-cen-dd',ent_aa:'fx-ship-ent-aa',cen_aa:'fx-ship-cen-aa'};
const MAX_FLEET_SHIPS=6;
let _shipImgs={};
function shipImg(key){let im=_shipImgs[key];if(im===undefined){im=new Image();im.src=`./${key}.webp?v=327&b=326`;im.onload=()=>{_shipImgs[key]=im};_shipImgs[key]=im}return im}

export function installFleet(Game){
 for(const k of Object.values(SHIP_IMG))shipImg(k);
 shipImg('ship-wake');shipImg('ship-bowwave');
 const P=Game.prototype;
 P.spawnMovingFleet=function(faction){
  const region=this.worldRegion();
  if(![1,7].includes(region)||this.enemies.length>60)return null;
  const live=this.enemies.filter(e=>e.navalVessel&&e.hp>0).length;
  if(live>=MAX_FLEET_SHIPS-1)return null;
  const playerSide=(typeof PLANES==='object'&&this.plane&&PLANES[this.plane])?PLANES[this.plane].faction:'entente';
  const side=faction??(playerSide==='central'?'entente':'central');
  const harbor=region===7&&this.navalRoute;
  const heading=harbor?this.navalRoute.a:this.a+(this.rng()-.5)*.45;
  const hx=Math.cos(heading),hy=Math.sin(heading),nx=-hy,ny=hx;
  const ahead=480+this.rng()*280,lateral=(this.rng()>.5?1:-1)*(180+this.rng()*240);
  const bx=this.x+hx*ahead+nx*lateral,by=this.y+hy*ahead+ny*lateral;
  const comp=['aa','dd','dd'].slice(0,Math.min(3,Math.max(1,MAX_FLEET_SHIPS-live)));
  const ships=[];
  for(let i=0;i<comp.length;i++){
   const cls=comp[i],t=SHIP_TYPES[cls],e=this.spawnEnemy('bomber');if(!e)break;
   const off=(i-(comp.length-1)/2)*130,back=i*150;
   Object.assign(e,{type:'ship',shipClass:cls,faction:side,name:side==='entente'?(cls==='aa'?'연합국 '+t.name:'연합국 '+t.name):(cls==='aa'?'중앙국가 '+t.name:'중앙국가 '+t.name),x:bx+nx*off-hx*back,y:by+ny*off-hy*back,a:heading,course:heading,weave:this.rng()*6.28,speed:t.speed,stationary:false,surface:true,navalVessel:true,movingShip:true,hitRadius:cls==='aa'?72:52,hullLength:cls==='aa'?190:150,hullWidth:cls==='aa'?102:44,hp:t.hp,maxHp:t.hp,fire:2+i*.9,ace:false,escortPlane:undefined,life:70,hazardRegion:region,xpValue:cls==='aa'?16:9});
   ships.push(e);
  }
  if(ships.length)this.event('flak',side===((this.plane&&PLANES[this.plane])?PLANES[this.plane].faction:'entente')?'아군 함대 진입 · 아군 화망을 활용하세요':'적 함대 접근 · 함선 대공 화망을 피하세요');
  return ships;
 };
 const _fleetSpawn61=Game.prototype.spawnFleet;
 Game.prototype.spawnFleet=function(){
  if(![1,7].includes(this.worldRegion()))return _fleetSpawn61.call(this);
  return this.spawnMovingFleet();
 };
 P.fleetCrossing=function(){
  if(this.worldRegion()!==1)return null;
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
  const friendly=e.faction===PLANES[this.plane]?.faction;
  if(friendly){this._friendlyShipFire(e,t);return}
  const d=Math.hypot(this.x-e.x,this.y-e.y);
  if(d>980)return;
  const aim=Math.atan2(this.y-e.y,this.x-e.x),lead=d/t.shellSpeed;
  const tx=this.x+Math.cos(this.a||0)*(this.speed||0)*lead,ty=this.y+Math.sin(this.a||0)*(this.speed||0)*lead;
  const aimLead=Math.atan2(ty-e.y,tx-e.x);
  for(const along of t.guns){
   const gx=e.x+Math.cos(e.a)*along,gy=e.y+Math.sin(e.a)*along;
   for(let i=0;i<t.salvo;i++){const h=aimLead+(i-(t.salvo-1)/2)*t.spread;this.bullets.push({x:gx,y:gy,vx:Math.cos(h)*t.shellSpeed,vy:Math.sin(h)*t.shellSpeed,life:4.4,enemy:true,heavy:true,naval:true,hazardRegion:e.hazardRegion??this.worldRegion(),damage:Math.round(13*(1+this.t/260))})}
   this.burst(gx,gy,'#ffd9a0',5);
  }
  e.gunAim=aim;e.muzzleFlash=.16;this.event('enemyShot','');
 };
 // Distant friendly patrols cross the Adriatic horizon as ambient traffic.
 P.spawnDistantPatrol=function(){
  if(this.worldRegion()!==1)return;
  const live=this.enemies.filter(e=>e.navalVessel&&e.hp>0).length;
  if(live>=MAX_FLEET_SHIPS||this.enemies.length>62)return;
  const side=PLANES[this.plane]?.faction??'entente';
  const heading=this.a+(this.rng()>.5?1:-1)*(.3+this.rng()*.3);
  const hx=Math.cos(heading),hy=Math.sin(heading),nx=-hy,ny=hx;
  const bx=this.x+hx*(600+this.rng()*300)+nx*(this.rng()>.5?1:-1)*(560+this.rng()*300);
  const by=this.y+hy*(600+this.rng()*300)+ny*(this.rng()>.5?1:-1)*(560+this.rng()*300);
  const cls=this.rng()<.4?'aa':'dd',t=SHIP_TYPES[cls],e=this.spawnEnemy('bomber');if(!e)return;
  Object.assign(e,{type:'ship',shipClass:cls,faction:side,name:(side==='entente'?'연합국 ':'중앙국가 ')+t.name,x:bx,y:by,a:heading,course:heading,weave:this.rng()*6.28,speed:t.speed,stationary:false,surface:true,navalVessel:true,movingShip:true,patrolShip:true,hitRadius:cls==='aa'?72:52,hullLength:cls==='aa'?190:150,hullWidth:cls==='aa'?102:44,hp:t.hp,maxHp:t.hp,fire:6+this.rng()*4,ace:false,escortPlane:undefined,life:60,hazardRegion:1,xpValue:cls==='aa'?16:9});
 };
 P._friendlyShipFire=function(e,t){
  let best=null,bd=850*850;
  for(const foe of this.enemies){if(foe.hp<=0||foe===e||foe.navalVessel||foe.fieldUnit||foe.surface)continue;const d=(foe.x-e.x)**2+(foe.y-e.y)**2;if(d<bd){bd=d;best=foe}}
  if(!best)return;
  const aim=Math.atan2(best.y-e.y,best.x-e.x);
  for(const along of t.guns){
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
  const step=Math.min(.04,Math.max(0,dt)),region=this.worldRegion();
  for(const e of this.enemies){
   // Recon seaplanes shadow the player and spot for fleet support; cloud cover breaks it.
   if(e.recon&&e.hp>0){
    const d=Math.hypot(e.x-this.x,e.y-this.y);
    const exposed=d<750&&(this.cloudConceal||0)<.7;
    if(exposed)e.spot=(e.spot||0)+step;else e.spot=Math.max(0,(e.spot||0)-step*1.4);
    if((e.spot||0)>=4&&!e.spotted){e.spotted=true;this.fleetBoostUntil=(this.t||0)+20;this.spawnMovingFleet();this.event('flak','수상기가 함대에 위치를 송신 — 지원 함대 접근 중')}
   }
   if(!e.movingShip||e.hp<=0)continue;
   if(!e.moored){
    e.weave+=step*.5;
    const weave=Math.sin(e.weave)*.12,heading=e.course+weave;
    e.x+=Math.cos(heading)*e.speed*step;e.y+=Math.sin(heading)*e.speed*step;e.a=heading;
   }
   if(Math.hypot(e.x-this.x,e.y-this.y)>2600)e.expired=true;
  }
  // Ambient fleet cadence — the sea should regularly show real ships.
  if(region===1){
   this.fleetAmbient=(this.fleetAmbient??14)-step;
   if(this.fleetAmbient<=0){this.fleetAmbient=30+this.rng()*10;
    const liveShips=this.enemies.filter(e=>e.navalVessel&&e.hp>0&&!e.patrolShip).length;
    if(liveShips<3&&this.enemies.length<62)this.spawnMovingFleet();
    else if(this.enemies.length<62)this.spawnDistantPatrol();
   }
  }else this.fleetAmbient=14;
  // Ambient recon planes over the sea.
  if([1,7].includes(region)){
   this.reconTimer=(this.reconTimer??18)-step;
   if(this.reconTimer<=0){this.reconTimer=42;
    if(!this.enemies.some(e=>e.recon&&e.hp>0)&&this.enemies.length<58){
     const e=this.spawnEnemy('scout');
     if(e){const a=this.a+(this.rng()-.5)*1.4,d=560+this.rng()*140;
      Object.assign(e,{recon:true,name:'수상 정찰기',x:this.x+Math.cos(a)*d,y:this.y+Math.sin(a)*d,speed:72,hp:26,maxHp:26,spot:0});
      this.event('wave','수상 정찰기 접근 — 구름에 숨거나 격추해 함대 지원을 차단하세요')}
    }
   }
  }else{this.reconTimer=18}
 };
}

export function drawFleetLayer(c,game,{point}){
 const cw=c.canvas.width,ch=c.canvas.height;
 for(const e of game.enemies||[]){
  if(!e.movingShip||e.hp<=0)continue;
  const t=SHIP_TYPES[e.shipClass],key=`${e.faction==='entente'?'ent':'cen'}_${e.shipClass}`;
  const img=shipImg(SHIP_IMG[key]||key);
  const [x,y]=point(e.x,e.y);
  const h=t.drawnH*.9,w=h*(img?.naturalWidth?img.naturalWidth/img.naturalHeight:(t.width/t.drawnH));
  if(x<-h||x>cw+h||y<-h||y>ch+h)continue;
  if(img&&img.naturalWidth){
   c.save();c.translate(x,y);c.rotate(e.a+Math.PI/2);
   // Water contact: soft dark bed under the hull so the ship reads as
   // resting on the surface far below, not floating at the plane's level.
   c.fillStyle='#0d2229';c.globalAlpha=.34;
   c.beginPath();c.ellipse(0,4,w*.62,h*.52,0,0,Math.PI*2);c.fill();
   // Stern wake + bow spray: painted foam assets (approved illustration style),
   // trailing behind the hull in ship-local space.
   if(!e.moored){
    const wake=shipImg('ship-wake'),bow=shipImg('ship-bowwave');
    if(wake?.naturalWidth){const ww=w*1.5,wh=ww*wake.naturalHeight/wake.naturalWidth;
     c.globalAlpha=.85;c.drawImage(wake,-ww/2,h*.16,ww,wh);}
    if(bow?.naturalWidth){const bw=w*.9,bh=bw*bow.naturalHeight/bow.naturalWidth;
     c.globalAlpha=.8;c.drawImage(bow,-bw/2,-h*.5-bh*.55,bw,bh);}
   }
   c.globalAlpha=.96;c.drawImage(img,-w/2,-h/2,w,h);
   c.restore();
  }
 }
}

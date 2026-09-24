// Moving fleet system — Adriatic (region 1) and Zeebrugge harbor (region 7).
// Ships sail real headings, fire from actual gun positions on the hull, and are
// faction-owned: hostile ships hunt the player, friendly ships engage aircraft.
import {PLANES} from './engine.js?v=288&b=288';
export const SHIP_TYPES=Object.freeze({
 dd:{name:'구축함',hp:150,drawnH:300,speed:26,guns:[96,-99],salvo:5,spread:.15,shellSpeed:215,interval:3.2,width:88},
 aa:{name:'대공순양함',hp:340,drawnH:380,speed:17,guns:[79,5,-39,-98],salvo:3,spread:.09,shellSpeed:205,interval:4.6,width:205}
});
const SHIP_IMG={ent_dd:'fx-ship-ent-dd',cen_dd:'fx-ship-cen-dd',ent_aa:'fx-ship-ent-aa',cen_aa:'fx-ship-cen-aa'};
const MAX_FLEET_SHIPS=6;
let _shipImgs={};
function shipImg(key){let im=_shipImgs[key];if(im===undefined){im=new Image();im.src=`./${key}.webp?v=283&b=283`;im.onload=()=>{_shipImgs[key]=im};_shipImgs[key]=im}return im}

export function installFleet(Game){
 for(const k of [...Object.values(SHIP_IMG),'fx-city-aagun','fx-city-ammo','fx-harbor-seaplane-base','fx-harbor-mole'])shipImg(k);
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
  if(e.harborFacility){e.fire=5;return}
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
 // Zeebrugge harbor defense network — destructible facilities the player prioritizes.
 P.spawnHarborFacilities=function(){
  if(this.worldRegion()!==7||this._harborSpawned)return;
  this._harborSpawned=true;
  const route=this.navalRoute,heading=route?route.a:this.a,hx=Math.cos(heading),hy=Math.sin(heading),nx=-hy,ny=hx;
  const ahead=560+this.rng()*160,lateral=(this.rng()>.5?1:-1)*(240+this.rng()*120);
  const bx=this.x+hx*ahead+nx*lateral,by=this.y+hy*ahead+ny*lateral;
  this._harborQuay={x:bx,y:by,a:heading+Math.PI/2,h:heading};
  const defs=[
   {kind:'gun',name:'해안포대',hp:220,fire:3,sprite:'fx-city-aagun',size:170,off:-380},
   {kind:'base',name:'수상기 기지',hp:260,fire:8,sprite:'fx-harbor-seaplane-base',size:300,off:0},
   {kind:'depot',name:'탄약고',hp:140,fire:0,sprite:'fx-city-ammo',size:150,off:380}
  ];
  for(let i=0;i<defs.length;i++){
   const d=defs[i],e=this.spawnEnemy('bomber');if(!e)break;
   Object.assign(e,{type:'facility',harborFacility:d.kind,facSprite:d.sprite,facSize:d.size,name:d.name,x:bx+nx*d.off+hx*80,y:by+ny*d.off+hy*80,a:heading+Math.PI/2,speed:0,stationary:true,surface:true,hitRadius:d.size*.48,hp:d.hp,maxHp:d.hp,fire:d.fire,ace:false,escortPlane:undefined,hazardRegion:7,xpValue:d.kind==='depot'?6:12,baseTimer:0,gunFire:3});
  }
  this.event('flak','군항 방어시설 발견 — 우선순위를 선택하세요');
 };
 // Anchored friendly patrol boats dress the harbor and provide flak cover.
 P.spawnMooredShips=function(){
  if(this.worldRegion()!==7||this._mooredSpawned)return;
  this._mooredSpawned=true;
  const side=PLANES[this.plane]?.faction??'entente',q=this._harborQuay,heading=(this.navalRoute?this.navalRoute.a:this.a);
  const hx=Math.cos(heading),hy=Math.sin(heading),nx=-hy,ny=hx;
  const qx=q?q.x:this.x,qy=q?q.y:this.y,seaOff=-150;
  const offs=[-480,100,540];
  for(let i=0;i<3;i++){
   const cls=i===0?'aa':'dd',t=SHIP_TYPES[cls],e=this.spawnEnemy('bomber');if(!e)break;
   const bx=qx+nx*offs[i]+hx*seaOff,by=qy+ny*offs[i]+hy*seaOff;
   Object.assign(e,{type:'ship',shipClass:cls,faction:side,name:'정박 '+(cls==='aa'?'방공함':'초계함'),x:bx,y:by,a:(q?q.a:heading)+(i%2?-.06:.06),course:0,weave:0,speed:0,stationary:true,surface:true,navalVessel:true,movingShip:true,moored:true,hitRadius:cls==='aa'?72:52,hullLength:cls==='aa'?190:150,hullWidth:cls==='aa'?102:44,hp:t.hp,maxHp:t.hp,fire:3+i*1.7,ace:false,escortPlane:undefined,life:120,hazardRegion:7,xpValue:0});
  }
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
  // Harbor facilities tick: coastal gun fire, seaplane-base reinforcement, depot blast.
  if(region===7){
   if(!this._harborSpawned)this.spawnHarborFacilities();
   if(!this._mooredSpawned)this.spawnMooredShips();
   for(const e of this.enemies){
    if(!e.harborFacility)continue;
    if(e.hp<=0){
     if(e.harborFacility==='depot'&&!e._blasted){e._blasted=true;this.combatBlast(e.x,e.y,185,'enemy','depot');
      for(const foe of this.enemies)if(foe.hp>0&&Math.hypot(foe.x-e.x,foe.y-e.y)<185){foe.hp-=95;foe.hitFlash=.3}
      if(Math.hypot(this.x-e.x,this.y-e.y)<185)this.hit(32);
      this.event('flak','탄약고 폭발 — 주변이 초토화됐습니다')}
     continue;
    }
    if(Math.hypot(e.x-this.x,e.y-this.y)>2500){e.expired=true;continue}
    if(e.harborFacility==='gun'){
     e.gunFire-=step;
     if(e.gunFire<=0&&Math.hypot(e.x-this.x,e.y-this.y)<1100){e.gunFire=5.5;
      const lead=Math.hypot(e.x-this.x,e.y-this.y)/230;
      const tx=this.x+Math.cos(this.a||0)*(this.speed||0)*lead,ty=this.y+Math.sin(this.a||0)*(this.speed||0)*lead;
      const aim=Math.atan2(ty-e.y,tx-e.x);
      for(let i=-1;i<=1;i++){const h=aim+i*.13;this.bullets.push({x:e.x,y:e.y,vx:Math.cos(h)*230,vy:Math.sin(h)*230,life:4.8,enemy:true,heavy:true,naval:true,hazardRegion:7,damage:Math.round(20*(1+this.t/300))})}
      this.burst(e.x,e.y,'#ffd9a0',8);e.muzzleFlash=.16;this.event('enemyShot','');
     }
    }else if(e.harborFacility==='base'){
     e.baseTimer=(e.baseTimer||6)-step;
     if(e.baseTimer<=0){e.baseTimer=27;
      if(this.enemies.filter(s=>s.seaplane&&s.hp>0).length<3&&this.enemies.length<58){
       const s=this.spawnEnemy('scout');
       if(s)Object.assign(s,{seaplane:true,name:'수상기',x:e.x,y:e.y,speed:88,hp:30,maxHp:30,ace:false});
      }
     }
    }
   }
   if(this._harborQuay&&Math.hypot(this._harborQuay.x-this.x,this._harborQuay.y-this.y)>2950)this._harborQuay=null;
  }else this._harborSpawned=false;
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
 const q=game._harborQuay;
 if(q){
  const mi=shipImg('fx-harbor-mole');
  if(mi&&mi.naturalWidth){const [x,y]=point(q.x,q.y),w=1650,h=w*mi.naturalHeight/mi.naturalWidth;
   if(x>-w&&x<cw+w&&y>-w&&y<ch+w){c.save();c.translate(x,y);c.rotate(q.a);c.drawImage(mi,-w/2,-h/2,w,h);c.restore()}}
 }
 for(const e of game.enemies||[]){
  if(e.harborFacility&&e.hp>0){
   const img=shipImg(e.facSprite),[x,y]=point(e.x,e.y),s=e.facSize;
   if(x<-s||x>cw+s||y<-s||y>ch+s)continue;
   if(img&&img.naturalWidth){c.save();c.translate(x,y);c.rotate(e.a-Math.PI/2);c.drawImage(img,-s/2,-s/2,s,s);c.restore()}
   c.fillStyle='#24332b';c.fillRect(x-20,y+s*.55,40,4);c.fillStyle='#de9b73';c.fillRect(x-20,y+s*.55,40*e.hp/e.maxHp,4);
   continue;
  }
  if(!e.movingShip||e.hp<=0)continue;
  const t=SHIP_TYPES[e.shipClass],key=`${e.faction==='entente'?'ent':'cen'}_${e.shipClass}`;
  const img=shipImg(key);
  const [x,y]=point(e.x,e.y);
  const h=t.drawnH,w=h*(img?.naturalWidth?img.naturalWidth/img.naturalHeight:(t.width/t.drawnH));
  if(x<-h||x>cw+h||y<-h||y>ch+h)continue;
  if(img&&img.naturalWidth){
   c.save();c.translate(x,y);c.rotate(e.a+Math.PI/2);
   c.drawImage(img,-w/2,-h/2,w,h);
   if(!e.moored){c.globalAlpha=.3;c.fillStyle='#cfe0dd';
   c.beginPath();c.ellipse(0,h*.42,w*.28,h*.1,0,0,Math.PI*2);c.fill()}
   c.restore();
  }
  c.fillStyle='#24332b';c.fillRect(x-22,y+h*.55,44,4);
  c.fillStyle=e.faction===PLANES?.[game.plane]?.faction?'#7fd8a0':'#de9b73';
  c.fillRect(x-22,y+h*.55,44*e.hp/e.maxHp,4);
 }
}

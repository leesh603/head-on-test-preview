import {groundShellProfile,initExplosionProfile,pushExplosionFx} from './explosion-profiles.js?v=fx5';
import {MINEN_ART,MINEN_TUBES} from './minenwerfer-art-layout.js';

const APPROACH='verdun-approach';
const MORTAR_LANES=[[-1,0,1,0,-1],[1,0,-1,0,1]];
const HEAVY_LANES=[[-1,1,0,-1,1,0],[1,-1,0,1,-1,0]];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const alive=p=>p.hp>0&&p.status!=='downed'&&p.status!=='dead';
const players=g=>g.players||[g];
const near=(a,b,d)=>Math.hypot(a.x-b.x,a.y-b.y)<d;
const FRACTIONS={engine:.95,ammo:.73,mortar:1,observer:.77};

export const VERDUN_SUPPORT_LABELS={
 engine:['탄약열차 기관차','Ammunition train locomotive'],
 ammo:['탄약 화차','Ammunition wagon'],
 mortar:['박격포 진지','Trench mortar position'],
 observer:['포병 관측소','Artillery observation post'],
 balloon:['포병 관측기구','Artillery observation balloon']
};

function target(kind,id,x,y,width,height,faction,hp){
 const maxHp=Math.round(hp*FRACTIONS[kind]);
 return {id:APPROACH+':'+id,verdunKind:kind,groundFacility:true,stationary:true,surface:true,missionTarget:true,
  faction,x,y,width,height,hitWidth:width*.84,hitHeight:height*.71,hitOffsetX:0,hitOffsetY:height*.08,
  hp:maxHp,maxHp,hitFlash:0};
}

function installSupport(g,v){
 const zoom=g.camera?.zoom||1,w=(g.viewWidth||960)/zoom,h=(g.viewHeight||700)/zoom;
 const a=g.a??-Math.PI/2,hx=Math.cos(a),hy=Math.sin(a),offset=Math.max(h,w)*.63+125;
 const front={x:g.x+hx*offset,y:g.y+hy*offset};
 const point=(forward,side)=>({x:front.x+hx*forward-hy*side,y:front.y+hy*forward+hx*side});
 const faction=(g.stageBoss.stages.teamFaction||g.teamFaction)==='central'?'entente':'central';
 const hp=g.players?165:115;
 // One fixed north/south route. The entire consist starts beyond the camera.
 const x=g.x+(w/2+78)*(hy>0?-1:1)+hx*65,sign=hy>0?-1:1;
 const y=g.y-sign*(h/2+320),spacing=86;
 const engine=target('engine','loco',x,y,33,78,faction,hp);
 const wagons=[1,2].map(i=>target('ammo','wagon-'+i,x,y-sign*i*spacing,34,73,faction,hp));
 const train=v.train={x,start:y-sign*440,end:y+sign*2940,sign,spacing,engine,wagons,speed:61,discovered:false,supplyCut:false,departed:false};
 const battery=(id,forward,side)=>{const p=point(forward,side);
  return Object.assign(target('mortar',id,p.x,p.y,160,120,faction,hp),{mortarTube:0,mortarRecoil:0});};
 v.mortars=[battery('north',90,-175),battery('south',350,174)];
 const p=point(520,-58);
 v.observer=target('observer','post',p.x,p.y,108,81,faction,hp);
 v.targets=[engine,...wagons,...v.mortars,v.observer];
 g.event?.('wave','베르됭 · 보급열차·박격포 진지·관측소는 선택 목표');
 return train;
}

export function verdunSupportTargets(g){
 return g.verdunBattle?.targets?.filter(e=>e.hp>0&&!e.expired)||[];
}

export function clearVerdunBattle(g){
 g.stageBoss?.hazards.clear(APPROACH);
 g.enemies=g.enemies.filter(e=>!e.verdunObserver);
 g.verdunBattle=null;
}

function impact(g,v,x,y,radius,profile,{nearby=false,crater=true,sound}={}){
 pushExplosionFx(g,initExplosionProfile({x,y,radius,side:'enemy',kind:'shell',artillerySound:sound},profile));
 if(crater&&v){v.craters.push({x,y,radius:radius*.86,angle:(x+y)%6.28});if(v.craters.length>32)v.craters.shift();}
 if(v){v.dust.push({x,y,radius:radius*1.4,age:0,life:nearby?1.65:1.1});if(v.dust.length>8)v.dust.shift();}
 if(nearby)g.shake=Math.max(g.shake||0,profile==='heavyShell'?4:2);
}

function updateSupport(g,v,dt){
 const train=v.train;
 if(!train)return;
 for(const e of v.targets)e.hitFlash=Math.max(0,e.hitFlash-dt);
 for(const e of v.mortars){
  e.mortarRecoil=Math.max(0,e.mortarRecoil-dt);
  if(e.hp>0||e.silenced)continue;
  e.silenced=true;g.stageBoss.hazards.clearTagged(APPROACH,e.id,{pendingOnly:true});
  g.event?.('wave','박격포 진지 파괴 · 이 진지의 포격 중단');
 }
 if(v.observer.hp<=0&&!v.observer.silenced){v.observer.silenced=true;g.event?.('wave','포병 관측소 파괴 · 집중 포격 조준 약화');}
 const balloon=g.enemies.find(e=>e.verdunObserver);
 if(v.balloonActive&&(!balloon||balloon.hp<=0||balloon.expired)){
  v.balloonActive=false;g.event?.('wave','관측기구 무력화 · 수정 사격 중단');
 }
 if(!train.departed){
  if(train.engine.hp>0){
   train.engine.y+=train.speed*train.sign*dt;
   const beyondRoute=(train.engine.y-train.end)*train.sign>0;
   const behindLastCar=(train.engine.y-g.y)*train.sign>flightPose(g).h/2+2*train.spacing+train.engine.height;
   if(beyondRoute&&behindLastCar){
    train.departed=true;for(const e of [train.engine,...train.wagons])e.expired=true;
   }
  }
  for(const [i,e] of train.wagons.entries()){
   e.y=train.engine.y-train.sign*(i+1)*train.spacing;
   if(e.hp<=0&&!e.cookoff){
    e.cookoff=true;
    for(let j=0;j<3;j++)v.cookoffs.push({at:v.age+j*.29,x:e.x+(j%2?9:-5),y:e.y+(j-1)*21,radius:36+j*9});
   }
  }
  if(!train.discovered&&players(g).some(p=>alive(p)&&near(p,train.engine,680))){
   train.discovered=true;g.event?.('wave','탄약 수송열차 발견 · 기관차 또는 탄약 화차를 공격하세요');
  }
  if(!train.supplyCut&&(train.engine.hp<=0||train.wagons.every(e=>e.hp<=0))){
   train.supplyCut=true;g.event?.('wave','탄약 수송 차단 · 후방 중포 사격 빈도 감소');
  }
 }
 for(const e of v.cookoffs)if(v.age>=e.at)impact(g,v,e.x,e.y,e.radius,'ammoCookoff',{nearby:near(g,e,330),sound:'artilleryImpact',crater:false});
 v.cookoffs=v.cookoffs.filter(e=>v.age<e.at);
}

function flightPose(g){
 const zoom=g.camera?.zoom||1;
 return {w:(g.viewWidth||960)/zoom,h:(g.viewHeight||700)/zoom};
}
function fire(g,v,source){
 const live=players(g).filter(alive);
 const p=live[v.salvo%live.length];if(!p)return false;
 const heavy=!source,supplyCut=!!v.train?.supplyCut,observed=v.observer?.hp>0||v.balloonActive;
 const {w,h}=flightPose(g),warning=heavy?1.93:1.56,beat=heavy ? .49 : .46;
 const r=Math.min(heavy?46:29,w*.087),angle=p.a??g.a??-Math.PI/2;
 const hx=Math.cos(angle),hy=Math.sin(angle),speed=Math.min(270,(p.speed||180)*(p.airframeSpeed||1));
 const rng=g.rng||Math.random,lanes=(heavy?HEAVY_LANES:MORTAR_LANES)[v.salvo%2];
 const count=heavy?(supplyCut?3:6):(observed?5:4);
 const span=Math.max(r*2.45,Math.min(w,h)*.14);
 const drift=(rng()-.5)*(observed?16:70)+(observed?0:(v.salvo%2?1:-1)*span*.6);
 const tube=source?MINEN_TUBES[source.mortarTube=(source.mortarTube+1)%MINEN_TUBES.length]:null;
 const muzzle=source?{x:source.x+tube.muzzleX*source.width/MINEN_ART.width,y:source.y+tube.muzzleY*source.width/MINEN_ART.width}:{x:g.x+w*.8,y:g.y-h*.83};
 const tag=source?.id||APPROACH+':heavy',visual=heavy?'verdun-field-heavy':'verdun-field-mortar';
 let launched=false;
 // The warning locks each lane in world space. Sequential impact times and
 // narrower circles leave a different route open on every beat.
 for(let i=0;i<count;i++){
  const forward=Math.max(r+43,speed*(warning+i*beat)*(observed ? .81 : .66));
  const cross=lanes[i]*span+drift;
  const x=clamp(p.x+hx*forward-hy*cross,g.x-w/2+r+12,g.x+w/2-r-12);
  const y=clamp(p.y+hy*forward+hx*cross,g.y-h/2+r+12,g.y+h/2-r-12);
  const round=g.stageBoss.hazards.spawn({kind:'circle',encounterId:APPROACH,bossId:tag,tag,x,y,
   sourceX:muzzle.x,sourceY:muzzle.y,radius:r,warning,delay:i*beat,duration:.22,damage:heavy?13:8,once:true,visual});
  launched||=!!round;
 }
 if(!launched)return false;
 v.salvo++;
 if(source){
  source.mortarRecoil=MINEN_ART.recoilDuration;
  v.muzzles.push({...muzzle,a:angle+Math.PI,age:0});
 }
 if(near(g,muzzle,620))g.event?.('bossSound','artilleryFire');
 g.event?.('bossSound',heavy?'railShellIncoming520':'railShellIncoming');
 return true;
}

function tickVerdunSalvos(g,v){
 if(v.age<v.nextSalvo)return;
 const live=v.mortars.filter(e=>e.hp>0);
 const inRange=live.filter(e=>players(g).some(p=>alive(p)&&near(p,e,1550)));
 const rear=v.age>=v.nextRear&&(v.salvo%3===2||!inRange.length);
 if(!rear&&!inRange.length){v.nextSalvo=Math.max(v.age+.2,v.nextRear);return;}
 const source=rear?null:inRange[v.mortarCursor++%inRange.length];
 if(!fire(g,v,source)){v.nextSalvo=v.age+.5;return;}
 if(rear)v.nextRear=v.age+(v.train?.supplyCut?11.8:4.25);
 v.nextSalvo=v.age+(rear?4.8:live.length===1?5.35:4.1);
}

function ambient(g,v){
 const rng=g.rng||Math.random,{w,h}=flightPose(g),side=rng()<.5?-1:1;
 const q={x:g.x+side*w*(.33+rng()*.2),y:g.y+(rng()-.5)*h};
 const heavy=v.age>15&&rng()<.33;
 impact(g,v,q.x,q.y,heavy?58:19+rng()*22,heavy?'heavyShell':'groundShell',{sound:heavy&&rng()<.3?'artilleryImpact':undefined});
}

function launchPatrol(g,v){
 if(g.enemies.filter(e=>e.hp>0&&!e.surface&&!e.stationary).length>=18)return;
 const previous=g.bossMechanicSpawn;
 g.bossMechanicSpawn=true;
 try{
  const a=g.a??-Math.PI/2,x=g.x+Math.cos(a)*670,y=g.y+Math.sin(a)*670;
  let leader;
  for(let i=0;i<3;i++){
   const e=g.spawnEnemy(i===0&&v.age<14?'scout':'hunter');if(!e)continue;
   e.x=x+(i===1?-110:i===2?110:0);e.y=y+(i?78:0);e.a=Math.atan2(g.y-e.y,g.x-e.x);
   if(!leader)leader=e;else{e.formationLeader=leader;e.formationBack=70;e.formationOffset=i===1?-88:88;}
  }
  if(v.age>=19&&!v.balloonLaunched&&v.observer?.hp>0&&near(g,v.observer,1050)){
   const e=g.spawnFieldUnit?.('balloon');
   if(e){
    Object.assign(e,{x:v.observer.x-125,y:v.observer.y-90,hp:195,maxHp:195,verdunObserver:true,missionTarget:true});
    v.balloonLaunched=true;v.balloonActive=true;g.event?.('wave','적 관측기구 발견 · 포격 수정 사격 중');
   }
  }
 }finally{g.bossMechanicSpawn=previous;}
}

export function tickVerdunBattle(g,dt){
 if(g.stageBoss?.stages.stageIndex!==12||g.state!=='playing'||dt<=0)return;
 const addon=g.stageBoss;
 const v=g.verdunBattle??={age:0,nextAmbient:.55,nextSalvo:4.7,nextRear:5.6,nextPatrol:8,salvo:0,mortarCursor:0,
  dust:[],craters:[],muzzles:[],cookoffs:[],targets:[],mortars:[]};
 v.age+=dt;
 for(const e of v.dust)e.age+=dt;v.dust=v.dust.filter(e=>e.age<e.life);
 for(const e of v.muzzles)e.age+=dt;v.muzzles=v.muzzles.filter(e=>e.age<.2);
 if(v.age>=v.nextAmbient){ambient(g,v);v.nextAmbient=v.age+(v.age<4?1.35:.76);}
 if(addon.stages.phase!=='explore'){
  if(!v.approachCleared){addon.hazards.clear(APPROACH);v.approachCleared=true;}
  if(!v.reconTarget){
   const fort=addon.stages.encounter?.bodies.values().next().value;
   const partId=fort?.kind==='fort-douaumont'?'control':'observer',part=fort?.parts.get(partId);
   if(fort&&!fort.dead&&part&&!part.destroyed&&players(g).some(p=>alive(p)&&near(p,{x:fort.x+part.x,y:fort.y+part.y},470))){
    v.reconTarget={bodyId:fort.id,partId};
    g.event?.('wave',partId==='control'?'항공사진 판독 · 사격통제소를 파괴해 양측 중포를 교란':'항공사진 판독 · 관측소를 파괴해 외곽 유도포격 차단');
   }
  }
  updateSupport(g,v,dt);
  return;
 }
 if(!v.train)installSupport(g,v);
 updateSupport(g,v,dt);
 if(v.age>=v.nextPatrol){v.nextPatrol=v.age+15;launchPatrol(g,v);}
 tickVerdunSalvos(g,v);
}
const dust=(g,x,y,radius=55)=>{const v=g.verdunBattle;if(v){v.dust.push({x,y,radius,age:0,life:1.1});v.dust=v.dust.slice(-8);}};
export function handleVerdunCue(g,event){
 const body=g.stageBoss?.stages.encounter?.bodies.get(event.bossId),fort=body?.fortressBoss;
 if(event.type==='hazard-activated'&&event.visual?.startsWith('verdun-field-')){
  const close=near(g,event,330),profile=event.visual==='verdun-field-heavy'?'heavyShell':'groundShell';
  impact(g,g.verdunBattle,event.x,event.y,event.radius,profile,{nearby:close,sound:'artilleryImpact'});
  return true;
 }
 if(event.type==='hazard-activated'&&event.visual?.startsWith('verdun-')){
  const profile=groundShellProfile(event.visual);if(profile)pushExplosionFx(g,initExplosionProfile({x:event.x,y:event.y,radius:event.radius,side:'enemy',kind:'shell',artillerySound:'artilleryImpact'},profile));
  dust(g,event.x,event.y,event.radius*1.55);g.burst?.(event.x,event.y,'#c6af86',10,profile?'profileOnly':'shell');g.smoke?.(event.x,event.y,true,!!profile);g.shake=Math.max(g.shake||0,profile==='heavyShell'?5:3);g.event('bossSound','artilleryImpact');return true;
 }
 if(!fort)return false;
 if(event.type==='muzzle'){
  const part=body.parts.get(event.partId);g.verdunBattle?.muzzles.push({x:event.x,y:event.y,a:part?.angle||0,age:0});g.event('bossSound',['mg','bunker'].includes(part?.kind)?'enemyShot':'artilleryFire');return true;
 }
 if(event.type==='fort-aa-repairing'){g.event('wave','외곽 대공포 정비 · 곧 재가동');return true;}
 if(event.type==='fort-aa-restored'){dust(g,event.x,event.y,28);g.event('wave','외곽 대공포 수리 완료');return true;}
 if(event.type==='ammo-cookoff'){
  pushExplosionFx(g,initExplosionProfile({x:event.x,y:event.y,radius:82,side:'enemy',kind:'structure'},'ammoCookoff'));
  dust(g,event.x,event.y,100);g.burst?.(event.x,event.y,'#e9b66c',30,'profileOnly');g.smoke?.(event.x-18,event.y,true,true);g.smoke?.(event.x+20,event.y,true,true);g.shake=Math.max(g.shake||0,9);g.event('wave','요새 탄약고 유폭 · 주변 포대 화력 약화');return true;
 }
 if(event.type==='fort-section-exposed'){g.event('wave',event.partId==='ammo'?'폐허 붕괴 · 지하 탄약고 노출':'외부 장갑 붕괴 · 탄약고 노출');dust(g,event.x,event.y,45);return true;}
 if(event.type==='fort-pit-open'){dust(g,event.x,event.y,25);return true;}
 if(event.type==='fort-reserve-active'){g.event('wave','수빌 지휘소 · 예비 포좌 개방');return true;}
 if(event.type==='part-destroyed'&&g.verdunBattle?.reconTarget?.partId===event.partId){
  g.event('wave',event.partId==='control'?'사격통제소 파괴 · 중포 조준 초기화':'관측소 파괴 · 외곽 유도포격 중단');
 }
 if(event.type==='part-destroyed'){const p=body.parts.get(event.partId);if(p)dust(g,body.x+p.x,body.y+p.y,55);}
 if(event.type==='boss-destruction-pulse')dust(g,event.x,event.y,event.radius);
 return false;
}

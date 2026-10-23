import {groundShellProfile,initExplosionProfile,pushExplosionFx} from './explosion-profiles.js?v=fx5';
// Verdun-only environment; damage stays in the existing bounded hazard pool.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const players=g=>g.players||[g];
export function tickVerdunBattle(g,dt){
 if(g.stageBoss?.stages.stageIndex!==12||g.state!=='playing'||dt<=0)return;
 const addon=g.stageBoss;
 const v=g.verdunBattle??={x:g.x,y:g.y,a:g.a??-Math.PI/2,age:0,shellAt:2,formationAt:10,dust:[],muzzles:[],batteries:[]};
 v.age+=dt;for(const d of v.dust)d.age+=dt;v.dust=v.dust.filter(d=>d.age<d.life);
 for(const d of v.muzzles)d.age+=dt;v.muzzles=v.muzzles.filter(d=>d.age<.2);
 if(addon.stages.phase!=='explore'){
  if(!v.approachCleared){addon.hazards.clear('verdun-approach');v.approachCleared=true;}return;
 }
 if(v.age>=v.shellAt){
  v.shellAt=v.age+4.8;const live=players(g).filter(p=>p.hp>0),p=live[Math.floor((v.age/5)%Math.max(1,live.length))];if(!p)return;
  const z=g.camera?.zoom||1,w=(g.viewWidth||960)/z,h=(g.viewHeight||700)/z,r=Math.min(44,w*.12),rng=g.rng||Math.random;
  const source={x:g.x+(rng()<.5?-1:1)*(w*.55+80),y:g.y-h*.65};
  v.batteries.push({...source,age:0});v.batteries=v.batteries.slice(-3);
  for(let i=0;i<3;i++)addon.hazards.spawn({kind:'circle',encounterId:'verdun-approach',bossId:'verdun-battery',x:clamp(p.x+(i-1)*86+(rng()-.5)*55,g.x-w/2+r,g.x+w/2-r),y:clamp(p.y+(rng()-.5)*h*.32,g.y-h/2+r,g.y+h/2-r),sourceX:source.x,sourceY:source.y,radius:r,warning:1.85,delay:i*.24,duration:.5,damage:14,once:true,visual:'verdun-approach-shell'});
 }
 if(v.age>=v.formationAt){
  v.formationAt=v.age+18;
  // Existing formationLeader and dogfight AI; no ace-specific aircraft.
  if((g.enemies||[]).filter(e=>e.hp>0&&!e.surface).length<18){
   const leaderBefore=g.enemies.length,previousMechanicSpawn=g.bossMechanicSpawn;g.bossMechanicSpawn=true;let leader;
   try{for(let i=0;i<3;i++){
    const before=g.enemies.length,result=g.spawnEnemy('hunter'),e=result||(g.enemies.length>before?g.enemies.at(-1):null);if(!e)continue;
    if(!leader){leader=e;leader.x=g.x-220;leader.y=g.y-480;leader.a=Math.atan2(g.y-leader.y,g.x-leader.x);}
    else{e.formationLeader=leader;e.formationBack=70;e.formationOffset=i===1?-80:80;e.x=leader.x+e.formationOffset;e.y=leader.y-70;}
   }}finally{g.bossMechanicSpawn=previousMechanicSpawn;}
   if(g.enemies.length>leaderBefore)g.event('wave','베르됭 · 요새 접근로 적 편대');
  }
 }
}
const dust=(g,x,y,radius=55)=>{const v=g.verdunBattle;if(v){v.dust.push({x,y,radius,age:0,life:1.1});v.dust=v.dust.slice(-8);}};
export function handleVerdunCue(g,event){
 const body=g.stageBoss?.stages.encounter?.bodies.get(event.bossId),fort=body?.fortressBoss;
 if(event.type==='hazard-activated'&&event.visual?.startsWith('verdun-')){
  const profile=groundShellProfile(event.visual);if(profile)pushExplosionFx(g,initExplosionProfile({x:event.x,y:event.y,radius:event.radius,side:'enemy',kind:'shell'},profile));
  dust(g,event.x,event.y,event.radius*1.55);g.burst?.(event.x,event.y,'#c6af86',10,profile?'profileOnly':'shell');g.smoke?.(event.x,event.y,true,!!profile);g.shake=Math.max(g.shake||0,profile==='heavyShell'?5:3);g.event('heavyShot','');return true;
 }
 if(!fort)return false;
 if(event.type==='muzzle'){
  g.verdunBattle?.muzzles.push({x:event.x,y:event.y,a:body.parts.get(event.partId)?.angle||0,age:0});g.event('heavyShot','');return true;
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
 if(event.type==='part-destroyed'){const p=body.parts.get(event.partId);if(p)dust(g,body.x+p.x,body.y+p.y,55);}
 if(event.type==='boss-destruction-pulse')dust(g,event.x,event.y,event.radius);
 return false;
}

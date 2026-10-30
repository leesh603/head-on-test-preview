/** Optional sea encounters. Fictional WWI-inspired designs, not historical ship replicas. */
import {queueArtilleryMuzzle} from './artillery-fx.js?v=capital-final-20261030';
export const MARITIME_STAGES = Object.freeze([1,16]); // Adriatic sea and Jutland only.
export const MARITIME_PROFILES = Object.freeze({
 dreadnought:{id:'dreadnought',name:'드레드노트',faction:'entente',mode:'naval-broadside',enabled:true,stages:MARITIME_STAGES,domain:'sea',hpRatio:.60,detail:'대공포를 끊고 포격 사이로 파고들어라',artStatus:'new independent fictional WWI naval design; separate rotating turret assemblies'},
 nachtwal:{id:'nachtwal',name:'나흐트발',faction:'central',mode:'naval-submarine',enabled:true,stages:MARITIME_STAGES,domain:'sea',hpRatio:.43,detail:'항적을 쫓아 부상 직후를 노려라',artStatus:'new independent fictional submarine cruiser; existing authored deck-gun sprites reused'},
 qship:{id:'qship',name:'Q-ship',faction:'entente',mode:'naval-decoy',enabled:true,stages:MARITIME_STAGES,domain:'sea',hpRatio:.46,detail:'위장 덮개가 열리면 노출된 함포를 노려라',artStatus:'WWI Q-ship inspired game variant; fixed hull and separately opening concealment panels'},
 seeadler:{id:'seeadler',name:'제아들러',faction:'central',mode:'naval-sailing-raider',enabled:true,stages:MARITIME_STAGES,domain:'sea',hpRatio:.48,detail:'전방 양현 함포를 끊어라',artStatus:'SMS Seeadler inspired German naval commerce raider, not a pirate ship'}
});
const finite=(n,d=0)=>Number.isFinite(n)?n:d;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const angle=n=>Math.atan2(Math.sin(n),Math.cos(n));
export const isMaritimeIntrusion=e=>!!MARITIME_PROFILES[typeof e==='string'?e:e?.profileId];
export function maritimeAttackable(e){return e?.profileId!=='nachtwal'||!e.naval||e.naval.phase==='surfaced';}
export function maritimeOpacity(e,visual=true){
 if(visual&&Number.isFinite(e?.visualMaritimeOpacity))return e.visualMaritimeOpacity;
 if(e?.profileId!=='nachtwal'||!e.naval)return 1;
 const n=e.naval;
 if(n.phase==='diving')return 1-clamp(n.phaseAge/1.1,0,1);
 if(n.phase==='submerged')return 0;
 if(n.phase==='surfacing')return clamp(n.phaseAge/1.2,0,1);
 return 1;
}
export function maritimeDamageMultiplier(e,id){
 if(id!=='core')return 1;
 if(e.profileId==='nachtwal')return e.naval?.phase==='surfaced'&&e.naval.phaseAge<2.4?1.35:1;
 const aa=Object.values(e.parts||{}).filter(p=>p.kind==='anti_air');
 return e.profileId==='dreadnought'&&aa.length&&aa.every(p=>p.hp<=0)?1.25:1;
}
function changePhase(e,phase){e.naval.phase=phase;e.naval.phaseAge=0;e.shotCues=[];e.hazards=[];e.attackClock=Math.max(finite(e.attackClock),phase==='surfaced'?.8:1);}
/** Movement state is host-owned plain JSON. The bow follows actual world velocity,
 * never a camera-relative offset or a normalized interpolation to a destination. */
export function initMaritimeMotion(e){
 const n=e.naval||(e.naval={phase:'surfaced',phaseAge:0,clock:0,cycle:0,wakeTrail:[],wakeClock:0});
 n.course=finite(n.course,finite(e.a,-Math.PI/2));n.speed=finite(n.speed,0);
 n.clock=finite(n.clock);n.phaseAge=finite(n.phaseAge);n.wakeTrail||=[];n.wakeClock=finite(n.wakeClock);
 if(e.profileId==='qship'){n.reveal=finite(n.reveal);n.disguiseAge=finite(n.disguiseAge);}
 return n;
}
export function maritimeWeaponsReady(e){return e.profileId!=='qship'||finite(e.naval?.reveal)>=1;}
export function revealMaritimeDecoy(e){
 if(e.profileId!=='qship')return;
 const n=initMaritimeMotion(e);if(n.revealing)return;n.revealing=true;e.attackClock=Math.max(finite(e.attackClock),1.8);
}
export function maritimeReveal(e,visual=true){if(visual&&Number.isFinite(e?.visualMaritimeReveal))return e.visualMaritimeReveal;return e.profileId==='qship'?clamp(finite(e.naval?.reveal),0,1):1;}
const cruise=e=>e.profileId==='nachtwal'?7:e.profileId==='seeadler'?10:e.profileId==='qship'?9:12;
function integrateVessel(e,n,dt,targetSpeed,targetHeading){
 const turn=e.profileId==='nachtwal'?.14:.065;
 e.a+=clamp(angle(targetHeading-e.a),-turn*dt,turn*dt);
 n.speed+=clamp(targetSpeed-n.speed,-4*dt,3*dt);
 e.x+=Math.cos(e.a)*n.speed*dt;e.y+=Math.sin(e.a)*n.speed*dt;
 e.driveVelocity=n.speed;
 n.wakeClock+=dt;
 if(n.wakeClock>=.18){n.wakeClock%=.18;n.wakeTrail.push({x:e.x,y:e.y,a:e.a,t:n.clock});}
 n.wakeTrail=n.wakeTrail.filter(p=>n.clock-p.t<4.5).slice(-26);
}
/** Entry and withdrawal retain vessel inertia, not a freeze→instant speed change. */
export function stepMaritimeTransit(e,dt){
 const n=initMaritimeMotion(e);n.clock+=dt;
 integrateVessel(e,n,dt,cruise(e),n.course);
}
/** Sinking hull retains momentum while the existing death fade removes it. */
export function stepMaritimeWreck(e,dt){const n=initMaritimeMotion(e);n.clock+=dt;integrateVessel(e,n,dt,0,e.a);}
/** Called by the authoritative simulation, never drawing. All 4 vessels share
 * bounded acceleration and heading-aligned integration; no lateral sliding. */
export function stepMaritimeMotion(e,dt){
 if(!isMaritimeIntrusion(e)||e.phase!=='active')return false;
 const n=initMaritimeMotion(e);n.clock+=dt;n.phaseAge+=dt;
 let speed=cruise(e),heading=n.course+Math.sin(n.clock*.12)*(e.profileId==='seeadler'?.10:.16);
 if(e.profileId==='qship'){
  n.disguiseAge+=dt;
  if(n.disguiseAge>=3.5||e.hp<e.maxHp)revealMaritimeDecoy(e);
  if(n.revealing)n.reveal=Math.min(1,n.reveal+dt/1.5);
  e.movementPhase=n.reveal>=1?'guns-exposed':n.revealing?'revealing':'disguised';
 }else if(e.profileId==='nachtwal'){
  const control=e.parts.dive_control;
  if(control?.hp<=0&&['diving','submerged'].includes(n.phase))changePhase(e,'surfacing');
  if(n.phase==='surfaced'&&n.phaseAge>=8.5&&!(control?.hp<=0)){
   n.cycle++;n.travelAngle=e.a+(n.cycle%2?1:-1)*.35;
   changePhase(e,'diving');
  }else if(n.phase==='diving'&&n.phaseAge>=1.1)changePhase(e,'submerged');
  else if(n.phase==='submerged'&&n.phaseAge>=2.8)changePhase(e,'surfacing');
  else if(n.phase==='surfacing'&&n.phaseAge>=1.2){n.course=e.a;changePhase(e,'surfaced');}
  if(n.phase!=='surfaced'){
   heading=finite(n.travelAngle,e.a);speed=n.phase==='submerged'?15:7;
   // A short ahead-of-bow cue follows the continuous path. It is never a teleport target.
   const left=n.phase==='diving'?2.8+Math.max(0,1.1-n.phaseAge):n.phase==='submerged'?Math.max(0,2.8-n.phaseAge):0;
   n.destination={x:e.x+Math.cos(heading)*left*12,y:e.y+Math.sin(heading)*left*12};
  }
  e.movementPhase=n.phase;
 }else if(e.profileId==='dreadnought')e.movementPhase=Object.values(e.parts).filter(p=>p.kind==='anti_air').every(p=>p.hp<=0)?'aa-silenced':'broadside';
 else e.movementPhase='sailing-broadside';
 integrateVessel(e,n,dt,speed,heading);
 return true;
}
/** Aiming follows a finite slew rate. A pending telegraph locks the owning gun. */
export function aimMaritimeGuns(g,e,layout,dt,api){
 if(!isMaritimeIntrusion(e)||!maritimeAttackable(e)||!maritimeWeaponsReady(e))return;
 const players=api.alive(g);if(!players.length)return;
 const target=api.local(e,players[e.volley%players.length].x,players[e.volley%players.length].y);
 for(const gun of layout.targets.filter(t=>t.muzzle&&api.canFire(e,t.id))){
  if(e.shotCues.some(q=>q.partId===gun.id&&!q.done)||e.hazards.some(q=>q.sourcePartId===gun.id&&!q.done))continue;
  const m=gun.muzzle,wanted=clamp(angle(Math.atan2(target.y-m.pivotY,target.x-m.pivotX)-m.angle),-m.arc,m.arc);
  const current=finite(e.turretAngles[gun.id]),speed=gun.kind==='anti_air'?1.35:.72;
  e.turretAngles[gun.id]=current+clamp(wanted-current,-speed*dt,speed*dt);
 }
}
/** Uses real authored muzzle/pivot data. No center-of-hull bullets or invisible underwater fire. */
export function queueMaritimeAttack(g,e,layout,api){
 if(!isMaritimeIntrusion(e))return false;
 if(!maritimeAttackable(e)||!maritimeWeaponsReady(e))return true;
 const players=api.alive(g);if(!players.length)return true;
 const p=players[e.volley%players.length],target=api.local(e,p.x,p.y);
 const guns=layout.targets.filter(t=>t.muzzle&&api.canFire(e,t.id));
 const ordered=[...guns.slice(e.volley%Math.max(1,guns.length)),...guns.slice(0,e.volley%Math.max(1,guns.length))];let heavyQueued=false;
 for(const gun of ordered){
  // Alternating pairs leave a readable lane; destroyed guns never get replacement emitters.
  if(gun.kind==='anti_air'&&gun.x*(e.volley%2?1:-1)<0)continue;
  const available=e.parts[gun.id]?.state==='damaged'&&gun.damagedMuzzles?gun.damagedMuzzles:(gun.muzzles||[gun.muzzle]);if(!available.length)continue;
  const m=available[e.volley%available.length],d=finite(e.turretAngles[gun.id]);
  const desired=Math.atan2(target.y-m.pivotY,target.x-m.pivotX);
  if(Math.abs(angle(desired-(m.angle+d)))>.22)continue;
  const c=Math.cos(d),s=Math.sin(d),muzzle={x:m.pivotX+(m.x-m.pivotX)*c-(m.y-m.pivotY)*s,y:m.pivotY+(m.x-m.pivotX)*s+(m.y-m.pivotY)*c};
  const a=m.angle+d,world=api.world(e,muzzle),aa=gun.kind==='anti_air';
  if(!api.visible(g,e,world)||!api.clear(e,gun.id,muzzle,a))continue;
  if(!aa){
   // Deck/main guns shell the sea, never emit horizontal anti-aircraft bullets.
   // Spray danger to low-flying aircraft is a disclosed arcade exaggeration.
   if(heavyQueued)continue;
   if(api.visible(g,e,p)&&!e.hazards.some(h=>h.sourcePartId===gun.id&&!h.done)){heavyQueued=true;e.hazards.push({kind:'naval-splash',x:p.x,y:p.y,radius:34,age:0,warning:1.8,damage:17,sourcePartId:gun.id,localMuzzle:muzzle,localAngle:a,done:false});queueArtilleryMuzzle(g,{x:world.x,y:world.y,angle:a+e.a+Math.PI/2,scale:.9,heavy:true});}
   continue;
  }
  const spread=[-.09,0,.09];
  // Each fan ray must clear the same authored superstructure, not merely its middle ray.
  const offsets=spread.filter(offset=>api.clear(e,gun.id,muzzle,a+offset));
  if(!offsets.length)continue;
  e.shotCues.push({...world,localMuzzle:muzzle,localAngle:a,a:a+e.a+Math.PI/2,partId:gun.id,age:0,warning:aa?.8:1.2,damage:aa?10:19,speed:aa?285:235,offsets,done:false});
 }
 e.volley++;return true;
}
export function maritimeAttackInterval(e){return e.profileId==='dreadnought'?2.15:e.profileId==='seeadler'?2.7:2.4;}
export function maritimeTactic(e,locale='ko'){
 const en=locale==='en';
 if(e.profileId==='qship')return maritimeWeaponsReady(e)?(en?'GUNS EXPOSED · Break the deck mounts':'위장 해제 · 노출된 함포를 파괴하라'):(en?'DECOY CONTACT · Concealed guns opening':'위장 상선 · 숨겨진 함포가 열린다');
 if(e.profileId==='seeadler')return en?'SAILING RAIDER · Silence the forward broadside':'무장 범선 · 전방 양현 함포를 끊어라';
 if(e.profileId==='nachtwal'){
  if(e.naval?.phase==='diving')return en?'DIVING · Track the wake':'잠항 중 · 항적을 따라가라';
  if(e.naval?.phase==='submerged')return en?'SUBMERGED · Watch the surfacing mark':'잠항 중 · 부상 지점 확인';
  if(e.naval?.phase==='surfacing')return en?'SURFACING · Prepare to attack':'부상 중 · 공격 준비';
  if(e.parts.dive_control?.hp<=0)return en?'Dive controls disabled · Finish the hull':'잠항 장치 파괴 · 선체를 마무리하라';
  return e.naval?.phaseAge<2.4?(en?'EXPOSED · Strike now':'취약 구간 · 지금 집중 공격'):(en?'Break the deck guns or dive controls':'갑판포와 잠항 장치를 노려라');
 }
 const aa=Object.values(e.parts||{}).filter(p=>p.kind==='anti_air');
 return aa.length&&aa.every(p=>p.hp<=0)?(en?'AA SILENCED · Hull exposed':'방공망 무력화 · 선체 노출'):(en?'Silence one AA flank · Dodge the heavy guns':'한쪽 대공포를 끊고 주포 사이로 진입');
}




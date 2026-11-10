import {weaponImpactKind} from './weapon-impact-profile.js?v=b3bf991d11fc7798';
// Choreography for the existing combatFX list and approved painted sprites.
// No damage, timers, simulation RNG, emitted particles, or additional atlas.
export const EXPLOSION_LIFE=Object.freeze({aircraft:.72,fuelFire:3.2,groundShell:.48,heavyShell:.88,ammoCookoff:2.65,bulletImpact:.27,armorBreak:.85,engineBreak:1.5,navalBreak:1.3});
const impactTimes=new WeakMap();
const replicaAges=new WeakMap();
export function advanceReplicaImpactFx(world,dt){
 for(const f of world.combatFX||[])if(f.fxProfile==='bulletImpact'||f.fxProfile==='aircraftCritical'||f.fxProfile==='cannonMuzzle'||EXPLOSION_LIFE[f.fxProfile]||weaponImpactKind(f)){
  let clock=replicaAges.get(f);
  if(!clock||clock.life!==f.life){clock={life:f.life,age:0};replicaAges.set(f,clock);}
  else clock.age+=dt;
 }
}
export function combatFxAge(f){return Math.max(0,f.maxLife-f.life)+(replicaAges.get(f)?.age||0)}
// Keep the same small queues, but spend them on the most meaningful contacts.
// Expired/ordinary effects yield before player hits, parts, and boss destruction.
export function combatFxPriority(f){
 if(f.life<=0||f.fxHidden)return -1;
 if(f.kind==='bossFinal'||f.fxProfile==='bossFinal'||f.fxSource==='bossFinal'||f.v1500Cascade||f.riiCascade)return 7;
 if(f.presentationContact||f.fxProfile==='aircraftCritical'&&f.player)return 6;
 if(['armorBreak','engineBreak','navalBreak'].includes(f.fxProfile))return 5;
 if(f.fxProfile==='aircraftCritical'&&f.pilotKill)return 4;
 if(f.finisher||f.breakup||f.killExplosion||f.fxProfile==='aircraftCritical'&&f.lethal)return 3;
 if(f.fxProfile==='aircraftCritical')return 2;
 return f.fxProfile==='bulletImpact'?0:1;
}
function evictionIndex(list,priority,group){
 let index=-1,lowest=Infinity;
 for(let i=0;i<list.length;i++)if(!group||group(list[i])){
  const rank=combatFxPriority(list[i]);
  if(rank<=priority&&rank<lowest){index=i;lowest=rank;}
 }
 return index;
}
export function reserveCombatFxSlot(world,f,group=null,limit=0){
 const list=world.combatFX??=[],priority=combatFxPriority(f);
 if(group){
  let count=0;for(const current of list)if(group(current))count++;
  while(count>=limit){const i=evictionIndex(list,priority,group);if(i<0)return false;list.splice(i,1);count--;}
 }
 while(list.length>=EXPLOSION_LIMITS.total){const i=evictionIndex(list,priority);if(i<0)return false;list.splice(i,1);}
 return true;
}
const bulletImpact=f=>f.fxProfile==='bulletImpact';
const compactMgImpact=f=>f.ordinaryMg===true&&!f.finisher&&!f.breakup&&!f.blocked&&!f.partHit&&!f.railArmor&&!f.incendiary&&!f.piercing;
const profiled=f=>!!f.fxProfile;
export function queueCombatImpact(world,round,target,details){
 const now=world.t||0,previous=impactTimes.get(target)??-Infinity;
 if(!details.finisher&&!details.breakup&&now-previous<(world.viewWidth<=720?.065:.045))return null;
 impactTimes.set(target,now);
 const f={x:round.x,y:round.y,radius:18,life:.27,maxLife:.27,fxProfile:'bulletImpact',feedbackId:'hit:'+(world.combatFeedbackSerial=(world.combatFeedbackSerial||0)+1),direction:Math.atan2(round.vy||0,round.vx||0),...details};
 if(!reserveCombatFxSlot(world,f,bulletImpact,world.viewWidth<=720?8:14))return null;
 world.combatFX.push(f);return f;
}
export const EXPLOSION_LIMITS=Object.freeze({mobile:18,desktop:28,total:35});
const FRAMES=Object.freeze({air:['profileAir0','profileAir1','profileAir2','profileAir3'],earth:['profileEarth0','profileEarth1','profileEarth2','profileEarth3'],ammo:['profileAmmo0','profileAmmo1','profileAmmo2','profileAmmo3']});
const METAL=['metalShard0','metalShard1','metalShard2','metalShard3'];
const ROCK=['rockChunk0','rockChunk1','rockChunk2','rockChunk3'];
const HEAVY_SHELLS=new Set(['rail-shell','rail-shell-outer','morser-shell','minenwerfer-heavy','somme-heavy-shell','verdun-heavy-shell','verdun-core-shell','verdun-ambush-shell']);
const SMALL_SHELLS=new Set(['observer-shell','mark4-shell','treffas-shell','minenwerfer-shell','somme-landship-shell','verdun-approach-shell','verdun-offscreen-shell']);
export function groundShellProfile(visual){return HEAVY_SHELLS.has(visual)?'heavyShell':SMALL_SHELLS.has(visual)?'groundShell':null}
export function initExplosionProfile(f,profile){if(profile==='suppressed')f.fxHidden=true;else if(EXPLOSION_LIFE[profile]){f.fxProfile=profile;f.life=f.maxLife=EXPLOSION_LIFE[profile]}return f}
// Parts already have stable objects. Keep ignition age in presentation state.
const fuelStarts=new WeakMap();
export function drawPartFuelFire(c,fx,part,x,y,time,size,remaining=3){
 if(!fuelStarts.has(part))fuelStarts.set(part,time);
 return drawFuelFire(c,fx,x,y,Math.max(0,time-fuelStarts.get(part)),size,0,remaining);
}
export function pushExplosionFx(world,f){
 const limit=world.viewWidth<=720?EXPLOSION_LIMITS.mobile:EXPLOSION_LIMITS.desktop;
 if(reserveCombatFxSlot(world,f,f.fxProfile?profiled:null,limit))world.combatFX.push(f);
 return f;
}
export function advanceExplosionFx(world,dt){
 const list=world.combatFX??=[];let w=0;
 const zoom=world.camera?.zoom||1,hw=world.viewWidth?world.viewWidth/zoom/2:Infinity,hh=world.viewHeight?world.viewHeight/zoom/2:Infinity;
 for(let i=0;i<list.length;i++){
  const f=list[i];f.life-=dt;
  const margin=(f.radius||60)*2.6+80;
  if(f.life<=0||f.fxProfile&&(Math.abs(f.x-world.x)>hw+margin||Math.abs(f.y-world.y)>hh+margin))continue;
  list[w++]=f;
 }
 list.length=w;
 while(list.length>EXPLOSION_LIMITS.total)list.splice(evictionIndex(list,Infinity),1);
}
const clamp=n=>Math.max(0,Math.min(1,n));
function shards(c,fx,x,y,age,d,metal,count,up=false){
 const fade=clamp(1-age/.6);if(!fade)return;
 for(let i=0;i<count;i++){
  const a=up?-2.65+i*1.9/Math.max(1,count-1):i*2.399+x*.013+y*.017;
  const speed=d*(.8+i*.15),dx=Math.cos(a)*speed*age,dy=Math.sin(a)*speed*age+age*age*d*.9;
  fx(c,(metal?METAL:ROCK)[i%4],x+dx,y+dy,d*(metal?.13:.16),d*(metal?.13:.16),a+age*(i%2?-5:4),fade*.85);
 }
}
export function drawFuelFire(c,fx,x,y,age,size=48,angle=0,remaining=3){
 const fade=clamp(remaining/.45),thick=clamp(age/1.3),flicker=.92+Math.sin(age*23)*.06;
 if(age<.12)fx(c,'profileFlash',x,y,size*.95,size*.95,angle,(1-age/.12)*.85*fade);
 fx(c,'profileEngine',x,y-size*.08,size*flicker,size*1.3,angle,.8*fade);
 fx(c,'profileOil',x+size*.16*thick,y-size*(.4+thick*.3),size*(.65+thick*.55),size*(.85+thick*.65),angle*.15,(.15+thick*.27)*fade);
 if(age>.5)fx(c,'profileWing',x-size*.17,y+size*.08,size*.58,size*.72,angle+.25,.55*fade);
 return true;
}
export function drawExplosionProfile(c,f,x,y,fx){
 const profile=f.fxProfile;if(!EXPLOSION_LIFE[profile])return false;
 const age=Math.max(0,f.maxLife-f.life)+(replicaAges.get(f)?.age||0),r=f.radius||34;
 if(profile==='bulletImpact'){
  if(f.splash){
   if(age>=.22)return true;
   const q=age/.22,a=f.direction||0,d=4+q*13;
   fx(c,'debris',x+Math.cos(a)*d,y+Math.sin(a)*d,16+q*12,9+q*7,a,(1-q)*.66);
   return true;
  }
  const compact=compactMgImpact(f);
  if(compact&&age>=.18)return true;
  const a=f.direction||0,q=clamp(age/(compact?.18:.27)),fade=1-q,metal=f.material==='metal',blocked=!!f.blocked;
  const strength=clamp(((f.streak||1)-1)/5),decisive=f.finisher||f.breakup;
  const variant=(f.impactVariant||0)%3,mass=Math.max(1,Math.min(1.16,f.impactMass||1));
  // Ordinary hits keep their authored material cue at aircraft scale, even in a long burst.
  const size=compact?(metal?18:f.material==='fabric'?20:22):blocked?24:(metal?32:40)*(1+strength*.24+(decisive?.3:0)+(f.partHit?.12:0))*mass;
  const width=size*(.9+variant*.08),contactAngle=a+(variant-1)*.09;
  if(blocked){
   // A short backward painted ricochet reads as deflection, without the damage
   // flash or torn fragments of a successful part hit.
   const back=contactAngle+Math.PI,travel=q*14;
   if(age<.09)fx(c,'armorSpark',x,y,22,12,contactAngle,(1-age/.09)*.8);
   fx(c,'ricochet',x+Math.cos(back)*travel,y+Math.sin(back)*travel,width*(1+q*.6),size*.55,back,fade*.9);
   return true;
  }
  // A compact painted contact flash makes the first frames legible; the torn
  // fabric/sparks and directed fragments carry the rest of the impact.
  const flashLife=compact?.085:.12;
  if(!blocked&&age<flashLife)fx(c,'profileFlash',x,y,width*(compact?.58:.78),size*(compact?.48:.68),contactAngle,Math.min(1,(flashLife-age)/(compact?.04:.065))*(decisive?.95:compact?.78:.9));
  fx(c,(blocked||f.railArmor)?'ricochet':metal?'armorSpark':'debris',x,y,width*(.7+q*.5),size,contactAngle,fade*(blocked?.65:f.material==='fabric'?.76:.9));
  if(!blocked&&f.incendiary&&age<.12)fx(c,'fireEngine',x,y,18+q*12,13+q*8,a,(1-age/.12)*.65);
  if(!blocked)for(let i=0,count=decisive?5:f.piercing?3:2;i<count;i++){
   const dir=contactAngle+(i-(count-1)/2)*(decisive?.63:.7),travel=(compact?9+i*5:18+i*11)*q*(decisive?1.6:1);
   const shard=(compact?(metal?5:f.material==='fabric'?5.5:6.5):metal?8:11)*(decisive?1.3:1);
   fx(c,metal?'metalShard'+(i%4):'debrisShard',x+Math.cos(dir)*travel,y+Math.sin(dir)*travel,shard,shard,dir+q*3,fade*.85);
  }
  return true;
 }
 if(profile==='armorBreak'||profile==='engineBreak'||profile==='navalBreak'){
  const d=Math.min(150,Math.max(48,r*1.8)),naval=profile==='navalBreak',engine=profile==='engineBreak';
  if(age<.1)fx(c,'profileFlash',x,y,d*.6,d*.6,0,(1-age/.1)*.8);
  if(age<.38)fx(c,naval?'splashShell':engine?FRAMES.ammo[Math.min(3,Math.floor(age/.095))]:FRAMES.earth[Math.min(3,Math.floor(age/.095))],x,y,d,d*(naval?1.35:1),f.direction||0,clamp((.38-age)/.14));
  shards(c,fx,x,y,age,d,true,engine?4:3);
  if(age>.12)fx(c,naval?'mist':engine?'profileOil':'profileDust',x+d*.08,y-d*age*.22,d*(.55+age*.4),d*(.6+age*.3),0,clamp(f.life/.4)*(engine?.35:.22));
  if(engine&&age>.25)fx(c,'profileEngine',x,y,d*.42,d*.55,0,clamp(f.life/.35)*.65);
  return true;
 }
 if(profile==='fuelFire')return drawFuelFire(c,fx,x,y,age,Math.min(78,r*1.3),0,f.life);
 if(profile==='aircraft'){
  const d=Math.min(138,Math.max(56,r*2.5));
  if(age<.075)fx(c,'profileFlash',x,y,d*.85,d*.85,0,(1-age/.075)*.95);
  if(age<.24)fx(c,FRAMES.air[Math.min(3,Math.floor(age/.06))],x,y,d*(.65+clamp(age/.14)*.35),d,0,clamp((.24-age)/.09));
  if(age>.06)fx(c,'profileTrail',x+d*age*.22,y-d*age*.4,d*(.35+age*.6),d*(.6+age*.45),-.25,clamp((.72-age)/.3)*.38);
  shards(c,fx,x,y,age,d,true,3);
  if(age<.16)fx(c,'spark',x+d*age,y-d*age*.7,14,14,age*4,(1-age/.16)*.9);
 }else if(profile==='groundShell'||profile==='heavyShell'){
  const heavy=profile==='heavyShell',T=EXPLOSION_LIFE[profile],q=clamp(age/T),d=heavy?Math.min(300,Math.max(112,r*1.95)):Math.min(104,Math.max(38,r*1.25));
  // Fast lateral heave loses momentum while the central soil column rises.
  // These soft lobes are aftermath, never an extra damaging shock ring.
  const spread=1-Math.pow(1-clamp(age/(heavy?.65:.36)),3),dust=clamp(age/.045)*clamp((T-age)/(heavy?.36:.2))*(heavy?.38:.25);
  for(let i=0;i<(heavy?2:1);i++)fx(c,'profileDust',x+(heavy?(i?1:-1)*d*spread*.32:0),y+d*.08,d*(.8+spread),d*(.5+spread*.2),i?.15:-.12,dust);
  if(age<(heavy?.42:.24)){const heave=.62+.38*clamp(age/(heavy?.1:.06));fx(c,FRAMES.earth[Math.min(3,Math.floor(age/(heavy?.105:.06)))],x,y-d*(heavy?.12:.06),d*.9*heave,d*(heavy?1.12:.95)*heave,0,clamp(((heavy?.42:.24)-age)/.14)*.9);}
  if(age<.085)fx(c,'profileFlash',x,y,d*(heavy?.85:.7),d*(heavy?.85:.7),0,(1-age/.085)*.95);
  shards(c,fx,x,y,age,d,false,heavy?4:2,true);
  if(heavy&&q>.12&&q<.65)fx(c,'profileDirt',x,y-d*q*.42,d*.46,d*(.9+q*.5),0,(1-q/.65)*.4);
  if(!f.railImpact&&age>.2)fx(c,'profileOil',x+d*.04,y-d*(.12+q*.22),d*(.5+q*.4),d*(.6+q*.4),-.1,clamp((age-.2)/.12)*clamp((T-age)/.24)*(heavy?.24:.16));
  if(f.railImpact){
   // Railway HE keeps its earth column, with a painted detonation and brief
   // flame at the contact point. Reuse the capped effect, never extra particles.
   if(age<.36)fx(c,FRAMES.ammo[Math.min(3,Math.floor(age/.09))],x,y,d*(.7+.3*clamp(age/.14)),d,0,clamp((.36-age)/.12));
   if(age>.1&&age<.78)fx(c,'profileGround',x,y-d*.05,d*.55,d*.65,0,clamp((age-.1)/.08)*clamp((.78-age)/.28)*.85);
   if(age>.22)fx(c,'profileOil',x,y-d*age*.28,d*(.45+age*.25),d*(.55+age*.3),0,clamp((T-age)/.35)*.32);
  }
 }else{
  const d=Math.min(180,Math.max(92,r*1.65));
  // Initial blast + three internal detonations. Only two can overlap.
  for(let i=0;i<4;i++){
   const local=age-i*.19;if(local<0||local>=.3)continue;
   const ox=i===0?0:(i%2?-.22:.23)*d,oy=i===0?0:(i-2)*d*.12,s=d*(.44+i*.12)*(.72+clamp(local/.12)*.28);
   fx(c,FRAMES.ammo[Math.min(3,Math.floor(local/.075))],x+ox,y+oy,s,s,i*.24,clamp((.3-local)/.12));
   if(local<.06)fx(c,'profileFlash',x+ox,y+oy,s*.65,s*.65,0,(1-local/.06)*.8);
  }
  const growth=clamp(age/.9),fade=clamp((2.65-age)/.8);
  fx(c,'profileOil',x+d*.1,y-d*(.2+growth*.28),d*(.4+growth*.66),d*(.65+growth*.75),-.15,(.14+growth*.26)*fade);
  if(age>.52){fx(c,'profileGround',x,y,d*(.48+growth*.16),d*(.48+growth*.16),0,.75*fade);fx(c,'profileEngine',x-d*.13,y-d*.1,d*.4,d*.5,0,.65*fade)}
  if(age>=.19)shards(c,fx,x,y,age-.19,d,true,4);
  if(age>1.05&&age<2.4)fx(c,'spark',x+d*.19,y-d*.13-(age-1.05)*d*.12,13,13,age,fade*.5);
 }
 return true;
}



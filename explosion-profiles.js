// Choreography for the existing combatFX list and approved painted sprites.
// No damage, timers, simulation RNG, emitted particles, or additional atlas.
export const EXPLOSION_LIFE=Object.freeze({aircraft:.72,fuelFire:3.2,groundShell:.48,heavyShell:.88,ammoCookoff:2.65,bulletImpact:.27,armorBreak:.85,engineBreak:1.5,navalBreak:1.3});
const impactTimes=new WeakMap();
const replicaAges=new WeakMap();
export function advanceReplicaImpactFx(world,dt){
 for(const f of world.combatFX||[])if(f.fxProfile==='bulletImpact'){
  let clock=replicaAges.get(f);
  if(!clock||clock.life!==f.life){clock={life:f.life,age:0};replicaAges.set(f,clock);}
  else clock.age+=dt;
 }
}
export function queueCombatImpact(world,round,target,details){
 const now=world.t||0,previous=impactTimes.get(target)??-Infinity;
 if(!details.finisher&&!details.breakup&&now-previous<(world.viewWidth<=720?.065:.045))return null;
 impactTimes.set(target,now);
 const list=world.combatFX??=[],limit=world.viewWidth<=720?8:14;
 let count=0,oldest=-1;
 for(let i=0;i<list.length;i++)if(list[i].fxProfile==='bulletImpact'){count++;if(oldest<0)oldest=i;}
 if(count>=limit)list.splice(oldest,1);
 // A light hit must never evict a boss collapse or a heavy impact.
 if(list.length>=EXPLOSION_LIMITS.total)return null;
 const f={x:round.x,y:round.y,radius:18,life:.27,maxLife:.27,fxProfile:'bulletImpact',feedbackId:'hit:'+(world.combatFeedbackSerial=(world.combatFeedbackSerial||0)+1),direction:Math.atan2(round.vy||0,round.vx||0),...details};
 list.push(f);return f;
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
 const list=world.combatFX??=[];
 if(f.fxProfile){
  const limit=world.viewWidth<=720?EXPLOSION_LIMITS.mobile:EXPLOSION_LIMITS.desktop;
  let count=0,oldest=-1;
  for(let i=0;i<list.length;i++)if(list[i].fxProfile){count++;if(oldest<0)oldest=i}
  if(count>=limit)list.splice(oldest,1);
 }
 if(list.length>=EXPLOSION_LIMITS.total)list.splice(0,list.length-EXPLOSION_LIMITS.total+1);
 list.push(f);return f;
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
 list.length=w;if(w>35)list.splice(0,w-35);
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
  const a=f.direction||0,q=clamp(age/.27),fade=1-q,metal=f.material==='metal',blocked=!!f.blocked;
  const strength=clamp(((f.streak||1)-1)/5),decisive=f.finisher||f.breakup;
  const size=blocked?21:(metal?28:34)*(1+strength*.24+(decisive?.3:0));
  // A compact painted contact flash makes the first frames legible; the torn
  // fabric/sparks and directed fragments carry the rest of the impact.
  if(!blocked&&age<.065)fx(c,'profileFlash',x,y,size*.62,size*.62,a,(1-age/.065)*(decisive?.95:.72));
  fx(c,blocked?'ricochet':metal?'armorSpark':f.material==='fabric'?'smokePuff':'debris',x,y,size*(.7+q*.5),size,a,fade*(blocked?.65:.9));
  if(!blocked)for(let i=0,count=decisive?5:f.piercing?3:2;i<count;i++){
   const dir=a+(i-(count-1)/2)*(decisive?.63:.7),travel=(18+i*11)*q*(decisive?1.6:1);
   const shard=(metal?8:11)*(decisive?1.3:1);
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
  const d=Math.min(110,Math.max(48,r*2.25));
  if(age<.24)fx(c,FRAMES.air[Math.min(3,Math.floor(age/.06))],x,y,d*(.65+clamp(age/.14)*.35),d,0,clamp((.24-age)/.09));
  if(age>.06)fx(c,'profileTrail',x+d*age*.22,y-d*age*.4,d*(.35+age*.6),d*(.6+age*.45),-.25,clamp((.72-age)/.3)*.38);
  shards(c,fx,x,y,age,d,true,3);
  if(age<.16)fx(c,'spark',x+d*age,y-d*age*.7,14,14,age*4,(1-age/.16)*.9);
 }else if(profile==='groundShell'||profile==='heavyShell'){
  const heavy=profile==='heavyShell',T=EXPLOSION_LIFE[profile],q=clamp(age/T),d=heavy?Math.min(205,Math.max(112,r*1.75)):Math.min(76,Math.max(38,r*1.05));
  // Two lateral dust lobes separate the broad outer layer from the dirt column.
  const spread=clamp(age/(heavy?.55:.3)),dust=clamp((T-age)/(heavy?.4:.22))*(heavy?.3:.21);
  for(let i=0;i<(heavy?2:1);i++)fx(c,'profileDust',x+(i?1:-1)*d*spread*.3,y+d*.12,d*(.55+spread*.9),d*(.32+spread*.3),i?.15:-.12,dust);
  if(age<(heavy?.42:.24))fx(c,FRAMES.earth[Math.min(3,Math.floor(age/(heavy?.105:.06)))],x,y-d*(heavy?.14:.07),d*(heavy?.78:.7),d*(heavy?1.15:.9),0,clamp(((heavy?.42:.24)-age)/.14)*.9);
  if(heavy&&age<.1)fx(c,'profileFlash',x,y,d*.62,d*.62,0,(1-age/.1)*.95);
  shards(c,fx,x,y,age,d,false,heavy?4:2,true);
  if(heavy&&q>.12&&q<.55)fx(c,'profileDirt',x,y-d*q*.42,d*.46,d*(.9+q*.5),0,(1-q/.55)*.4);
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


// Choreography for the existing combatFX list and approved painted sprites.
// No damage, timers, simulation RNG, emitted particles, or additional atlas.
export const EXPLOSION_LIFE=Object.freeze({aircraft:.72,fuelFire:3.2,groundShell:.48,heavyShell:.88,ammoCookoff:2.65});
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
// Ease only secondary smoke/fire layers; the impact flash stays immediate.
const emerge=(age,start,duration)=>{const q=clamp((age-start)/duration);return q*q*(3-2*q)};
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
 fx(c,'profileOil',x+size*.16*thick,y-size*(.4+thick*.3),size*(.65+thick*.55),size*(.85+thick*.65),angle*.15,(.15+thick*.27)*fade*emerge(age,0,.18));
 if(age>.5)fx(c,'profileWing',x-size*.17,y+size*.08,size*.58,size*.72,angle+.25,.55*fade*emerge(age,.5,.16));
 return true;
}
export function drawExplosionProfile(c,f,x,y,fx){
 const profile=f.fxProfile;if(!EXPLOSION_LIFE[profile])return false;
 const age=Math.max(0,f.maxLife-f.life),r=f.radius||34;
 if(profile==='fuelFire')return drawFuelFire(c,fx,x,y,age,Math.min(78,r*1.3),0,f.life);
 if(profile==='aircraft'){
  const d=Math.min(110,Math.max(48,r*2.25));
  if(age<.24)fx(c,FRAMES.air[Math.min(3,Math.floor(age/.06))],x,y,d*(.65+clamp(age/.14)*.35),d,0,clamp((.24-age)/.09));
  if(age>.06)fx(c,'profileTrail',x+d*age*.22,y-d*age*.4,d*(.35+age*.6),d*(.6+age*.45),-.25,clamp((.72-age)/.3)*.38*emerge(age,.06,.12));
  shards(c,fx,x,y,age,d,true,3);
  if(age<.16)fx(c,'spark',x+d*age,y-d*age*.7,14,14,age*4,(1-age/.16)*.9);
 }else if(profile==='groundShell'||profile==='heavyShell'){
  const heavy=profile==='heavyShell',T=EXPLOSION_LIFE[profile],q=clamp(age/T),d=heavy?Math.min(205,Math.max(112,r*1.75)):Math.min(76,Math.max(38,r*1.05));
  // Two lateral dust lobes separate the broad outer layer from the dirt column.
  const spread=clamp(age/(heavy?.55:.3)),dust=clamp((T-age)/(heavy?.4:.22))*(heavy?.3:.21)*emerge(age,0,heavy?.09:.045);
  for(let i=0;i<(heavy?2:1);i++)fx(c,'profileDust',x+(i?1:-1)*d*spread*.3,y+d*.12,d*(.55+spread*.9),d*(.32+spread*.3),i?.15:-.12,dust);
  if(age<(heavy?.42:.24))fx(c,FRAMES.earth[Math.min(3,Math.floor(age/(heavy?.105:.06)))],x,y-d*(heavy?.14:.07),d*(heavy?.78:.7),d*(heavy?1.15:.9),0,clamp(((heavy?.42:.24)-age)/.14)*.9);
  if(heavy&&age<.1)fx(c,'profileFlash',x,y,d*.62,d*.62,0,(1-age/.1)*.95);
  shards(c,fx,x,y,age,d,false,heavy?4:2,true);
  if(heavy&&q>.12&&q<.55)fx(c,'profileDirt',x,y-d*q*.42,d*.46,d*(.9+q*.5),0,(1-q/.55)*.4*emerge(q,.12,.07));
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
  fx(c,'profileOil',x+d*.1,y-d*(.2+growth*.28),d*(.4+growth*.66),d*(.65+growth*.75),-.15,(.14+growth*.26)*fade*emerge(age,0,.2));
  if(age>.52){fx(c,'profileGround',x,y,d*(.48+growth*.16),d*(.48+growth*.16),0,.75*fade*emerge(age,.52,.18));fx(c,'profileEngine',x-d*.13,y-d*.1,d*.4,d*.5,0,.65*fade*emerge(age,.52,.18))}
  if(age>=.19)shards(c,fx,x,y,age-.19,d,true,4);
  if(age>1.05&&age<2.4)fx(c,'spark',x+d*.19,y-d*.13-(age-1.05)*d*.12,13,13,age,fade*.5*emerge(age,1.05,.1)*clamp((2.4-age)/.15));
 }
 return true;
}

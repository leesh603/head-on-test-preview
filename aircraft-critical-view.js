import {combatFxAge} from './explosion-profiles.js?v=fx5';
// Dedicated painted cockpit mist; all other parts reuse established WWI art.
const mist=typeof Image==='undefined'?null:new Image();
if(mist)mist.src='./cockpit-critical-mist.png';
const notices=new WeakMap();
const labels={wing:['날개 손상!','Wing damage!'],body:['동체 손상!','Airframe damage!'],engine:['엔진 손상!','Engine damage!'],fuel:['연료탱크 피격!','Fuel tank hit!'],cockpit:['조종석 피격!','Cockpit hit!']};
export function criticalNotice(world,locale='ko',blocked=false){
 let state=notices.get(world);if(!state){state={seen:new Set(),until:0,priority:0};notices.set(world,state);}
 let best=null;
 for(const f of world.combatFX||[]){
  if(f.fxProfile!=='aircraftCritical'||f.life<=0||state.seen.has(f.feedbackId))continue;
  state.seen.add(f.feedbackId);if(state.seen.size>256)state.seen.delete(state.seen.values().next().value);
  const priority=f.pilotKill?4:f.player?3:f.ignite?2:1;
  if(!best||priority>best.priority)best={...f,priority};
 }
 const time=world.t||0;
 if(best&&(!state.pending||time>state.expires||best.priority>=state.pending.priority)){state.pending=best;state.expires=time+2.5;}
 best=state.pending;
 if(blocked||!best||time>state.expires||time<state.until&&best.priority<=state.priority)return null;
 state.pending=null;
 state.until=(world.t||0)+.85;state.priority=best.priority;
 const pair=best.pilotKill?['파일럿 킬!','Pilot kill!']:best.ignite?['연료 화재!','Fuel fire!']:labels[best.part];
 return pair?{text:pair[locale==='en'?1:0],priority:best.priority}:null;
}
export function drawAircraftCritical(c,f,x,y,fx){
 if(f.fxProfile!=='aircraftCritical')return false;
 const age=combatFxAge(f);if(age>=f.maxLife||f.life<=0)return true;
 const q=Math.min(1,age/f.maxLife),fade=Math.min(1,(1-q)*1.8),a=f.a||0,heading=f.airframeA??a,scale=f.player?1:1.25;
 const flash=(size,time=.075)=>{if(age<time)fx(c,'profileFlash',x,y,size*scale,size*scale,a,(1-age/time)*.95)};
 const fragments=(metal,count,spread,size)=>{for(let i=0;i<count;i++){
  const dir=a+(i-(count-1)/2)*spread,travel=(1-Math.exp(-age*7))*(20+i*9)*scale;
  fx(c,metal?'metalShard'+(i%4):'debrisShard',x+Math.cos(dir)*travel,y+Math.sin(dir)*travel,size,size*.7,dir+age*(i%2?-7:6),fade*.9);
 }};
 if(f.pilotKill){
  flash(22,.05);
  if(mist?.complete&&mist.naturalWidth){c.save();c.translate(x,y);c.rotate(heading);c.globalAlpha*=fade*.65;c.drawImage(mist,-9,-15,44+q*9,30+q*6);c.restore();}
  fragments(true,2,.7,6);return true;
 }
 if(f.part==='engine'){
  flash(46);
  if(age<.16)fx(c,'armorSpark',x,y,45*scale,26*scale,a,(1-age/.16)*.95);
  if(age<.28)fx(c,'profileEngine',x,y,(30+q*24)*scale,(42+q*25)*scale,heading,fade*.9);
  if(age>.08)fx(c,'profileOil',x-Math.cos(heading)*(12+q*28),y-Math.sin(heading)*(12+q*28),(28+q*35)*scale,(30+q*45)*scale,heading,Math.min(1,(age-.08)/.12)*fade*.65);
  fragments(true,3,.65,9);
 }else if(f.part==='fuel'){
  flash(f.ignite?60:28);
  if(f.ignite){
   if(age<.32)fx(c,'profileAmmo'+Math.min(3,Math.floor(age/.08)),x,y,(36+Math.min(1,age/.12)*35)*scale,(40+Math.min(1,age/.12)*35)*scale,heading,fade*.95);
   if(age>.08)fx(c,'profileEngine',x,y,(32+q*15)*scale,(48+q*22)*scale,heading,fade*.9);
   if(age>.16)fx(c,'profileOil',x-Math.cos(heading)*q*34,y-Math.sin(heading)*q*34,(34+q*40)*scale,(38+q*45)*scale,heading,fade*.6);
  }else{if(age<.15)fx(c,'armorSpark',x,y,32,20,a,fade);fx(c,'smokePuff',x-Math.cos(heading)*q*16,y-Math.sin(heading)*q*16,22+q*22,18+q*20,heading,fade*.42);}
 }else if(f.part==='cockpit'){
  flash(24,.055);if(age<.13)fx(c,'armorSpark',x,y,24,16,a,(1-age/.13)*.8);fragments(true,3,.95,6);
 }else if(f.part==='wing'){
  flash(28);fx(c,'debris',x,y,34*scale,22*scale,heading+(f.side||1)*.25,fade*.75);fragments(false,4,.46,12);
  if(age>.06)fx(c,'smokePuff',x-Math.cos(heading)*q*20,y-Math.sin(heading)*q*20,22+q*20,16+q*16,heading,fade*.3);
 }else{
  flash(34);fx(c,'debris',x,y,28+q*18,24+q*16,a,fade*.8);fragments(false,5,.82,10);
 }
 return true;
}

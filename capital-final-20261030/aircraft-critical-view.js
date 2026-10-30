import {combatFxAge} from './explosion-profiles.js?v=capital-final-20261030';
// Dedicated painted cockpit mist; all other parts reuse established WWI art.
const mist=typeof Image==='undefined'?null:new Image();
if(mist)mist.src='https://head-on-aces.justzeon.chatgpt.site/cockpit-critical-mist.png';
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
 const age=combatFxAge(f),q=Math.min(1,age/f.maxLife),fade=Math.min(1,(1-q)*1.5),a=f.a||0,scale=f.player?1:1.45;
 if(f.pilotKill){
  if(mist?.complete&&mist.naturalWidth){c.save();c.translate(x,y);c.rotate(a);c.globalAlpha*=fade*.55;c.drawImage(mist,-9,-15,44+q*9,30+q*6);c.restore();}
  if(age<.07)fx(c,'debrisShard',x,y,8,8,a,fade*.65);
  return true;
 }
 if(f.part==='engine'){
  if(age<.12)fx(c,'profileFlash',x,y,48*scale,48*scale,a,fade*.9);
  fx(c,'profileEngine',x,y,(46+q*20)*scale,(56+q*20)*scale,a,fade*.95);
  fx(c,'profileOil',x-Math.cos(a)*q*24,y-Math.sin(a)*q*24,(34+q*24)*scale,(34+q*24)*scale,a,fade*.7);
 }else if(f.part==='fuel'){
  fx(c,f.ignite?'profileEngine':'armorSpark',x,y,(44+q*20)*scale,(54+q*20)*scale,a,fade*.95);
  if(f.ignite)fx(c,'profileOil',x-Math.cos(a)*q*20,y-Math.sin(a)*q*20,48+q*24,48+q*24,a,fade*.6);
 }else{
  if(age<.12)fx(c,'profileFlash',x,y,24*scale,24*scale,a,fade*.9);
  const count=f.part==='body'?4:3;
  for(let i=0;i<count;i++){const direction=a+(i-(count-1)/2)*.85,d=q*(22+i*10);fx(c,'debrisShard',x+Math.cos(direction)*d,y+Math.sin(direction)*d,12,15,direction+q*2,fade*.95);}
 }
 return true;
}

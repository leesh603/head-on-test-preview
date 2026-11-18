import {fx} from './fx-art.js?v=tame3';
import {drawSecretWarArt} from './secret-impact-signatures.js';
import {hasSecretWeapon} from './secret-weapons.js';
import {bombFallPose} from './bomb-sprites.js?v=bomb20&perf=1029';

const clamp=n=>Math.min(1,Math.max(0,n));
const mix=(a,b,t)=>a+(b-a)*t;
const pose={};
const aceHistory=new WeakMap();

function wingPath(wing,now){
 let path=aceHistory.get(wing);
 if(!path){path=[];aceHistory.set(wing,path);}
 const last=path.at(-1);
 if(last&&(now<last.at||now-last.at>.28||Math.hypot(wing.x-last.x,wing.y-last.y)>150))path.length=0;
 if(!path.length||now-path.at(-1).at>=.06){
  if(path.length>=8)path.shift();
  path.push({x:wing.x,y:wing.y,a:wing.a,at:now});
 }
 return path;
}

function strip(c,view,key,x0,y0,x1,y1,width,alpha){
 const dx=x1-x0,dy=y1-y0,length=Math.hypot(dx,dy);
 if(length<2||alpha<=0)return;
 fx(c,key,view.sx((x0+x1)/2),view.sy((y0+y1)/2),(length+3)*view.z,width*view.z,Math.atan2(dy,dx),alpha);
}

function skillFlight(c,wing,view,now,low){
 const path=wingPath(wing,now),mode=wing._netAcePilotState?.mode;
 if(!['reverse','ambush','dive','charge','hunt'].includes(mode)||path.length<2)return;
 const stride=low?3:2;
 // Reversals leave a hooked inside wake. A diving pair follows both wingtips;
 // the ambush breaks into narrow, widely spaced strips along its actual path.
 for(let i=path.length-1;i>=stride;i-=stride){
  const to=path[i],from=path[i-stride],age=now-from.at;
  if(age>.43)break;
  const bend=Math.sin(to.a-from.a),inside=bend<0?-1:1;
  if(mode==='reverse'&&Math.abs(bend)<.035)continue;
  const first=mode==='dive'||mode==='charge'?-1:inside,last=mode==='dive'||mode==='charge'?1:inside;
  for(let side=first;side<=last;side+=2){
   const spread=side*(mode==='ambush'?10:18);
   strip(c,view,mode==='ambush'?'smokeWisp':'vaporTrail',from.x-Math.sin(from.a)*spread,from.y+Math.cos(from.a)*spread,
    to.x-Math.sin(to.a)*spread,to.y+Math.cos(to.a)*spread,mode==='charge'?11:7,clamp(1-age/.48)*.86);
  }
 }
}

function bomberRack(c,wing,view,art,now){
 const elapsed=now-((wing.secretBombReadyAt??-Infinity)-10);
 const releasing=elapsed>=0&&elapsed<1;
 const secondPending=!!wing.secretBombSecond;
 const until=(wing.secretBombReadyAt??now)-now;
 const frame=secondPending?'cooperHalf':until>.32?'cooperEmpty':'cooperLoaded';
 const stroke=releasing?Math.sin(Math.PI*clamp((elapsed-(secondPending?0:.30))/.34)):0;
 const width=31,spread=stroke*4,roll=1-stroke*.38;
 c.save();c.translate(view.sx(wing.x),view.sy(wing.y));c.rotate(wing.a||0);c.scale(view.z,view.z);
 // Two halves of the painted physical cradle pivot away from the payload,
 // then close on the visibly half-empty / empty rack between actual drops.
 if(stroke>.015){
  for(const side of [-1,1]){
   c.save();c.translate(-5,side*spread);c.scale(1,roll);c.beginPath();
   c.rect(-width/2,side<0?-width/2:0,width,width/2);c.clip();
   art.sprite(c,frame,0,0,width,0,1);c.restore();
  }
 }else art.sprite(c,frame,-5,0,width,0,1);
 c.restore();
}

export function drawSecretFlightWings(c,world,view,art,low=false){
 const owners=world.players||[world];
 if(!owners.some(p=>p.hp>0&&(hasSecretWeapon(p,'eliteAirWing')||hasSecretWeapon(p,'longRangeBombers'))))return;
 const now=world.t||0;
 for(const wing of world.allies||[]){
  if(!(wing.life>0)||wing.hp<=0||wing.carrierHidden||!view.visible(wing.x,wing.y,100))continue;
  if(wing.secretBomber)bomberRack(c,wing,view,art,now);
  if(wing.secretAce)skillFlight(c,wing,view,now,low);
 }
}

function armorFlight(c,b,view,t,low){
 const a=b.releaseAngle,slot=b.secretArmorSlot??0,z=view.z,side=slot%2?-1:1;
 const dx=Math.cos(a),dy=Math.sin(a),u=1-Math.pow(1-t,1.55),lift=Math.sin(Math.PI*t);
 // Front, waist and tail plates leave distinct mounting positions. The bowed
 // path and tumbling plate converge on the simulation's exact fuse location.
 const mount=slot%3===0?20:15;
 const x=mix(b.sx+dx*mount,b.x,u)-dy*side*lift*8;
 const y=mix(b.sy+dy*mount,b.y,u)+dx*side*lift*8;
 if(!view.visible(x,y,65))return;
 const angle=a+side*(.28+t*(3.8+slot*.4));
 if(!low&&t>.08&&t<.7){
  const q=clamp(t-.12),v=1-Math.pow(1-q,1.55),l=Math.sin(Math.PI*q);
  const px=mix(b.sx+dx*mount,b.x,v)-dy*side*l*8,py=mix(b.sy+dy*mount,b.y,v)+dx*side*l*8;
  strip(c,view,'smokeTrail',px,py,x,y,7,.63*(1-t));
 }
 c.save();c.translate(view.sx(x),view.sy(y));c.rotate(angle);
 c.scale(1,.32+.68*Math.abs(Math.cos(t*6+slot*.4)));
 if(!drawSecretWarArt(c,'tornPlate',0,0,(24+lift*6)*z,0))fx(c,'metalShard'+slot,0,0,25*z,19*z,0,1);
 c.restore();
 // Fuze glints stay on the travelling plate while the other five continue
 // independently. They stop when this specific projectile is consumed.
 if(t>.63&&Math.sin((t-.63)*42)>-.2)fx(c,'spark',view.sx(x+Math.cos(angle)*7),view.sy(y+Math.sin(angle)*7),13*z,7*z,angle,1);
}

export function drawSecretFlightBomb(c,b,view,low=false){
 if(!(b.life>0&&b.maxLife>0))return false;
 const t=clamp(1-b.life/b.maxLife);
 if(b.secretWeapon==='explosiveArmor'){armorFlight(c,b,view,t,low);return true;}
 if(!['longRangeBombers','eliteAirWing'].includes(b.secretWeapon)||b.steelCoreFlight||!Number.isFinite(b.sx)||!Number.isFinite(b.sy))return false;
 const p=bombFallPose(b.sx,b.sy,b.x,b.y,t,b.releaseAngle,pose);
 if(!view.visible(p.x,p.y,80))return false;
 const dx=Math.cos(p.angle),dy=Math.sin(p.angle);
 // The stock bomb and its projected shadow still own the body. The release
 // pin falls free once, then twin tail vortices stay fixed to its shrinking fins.
 if(t<.32){
  const q=t/.32,side=b.secretReleaseIndex===1?-1:1;
  fx(c,'bulletBrass',view.sx(b.sx-dx*q*11-dy*side*q*20),view.sy(b.sy-dy*q*11+dx*side*q*20+q*q*8),
   10*view.z,4*view.z,p.angle+side*q*4,1-q);
 }else{
  const pulse=Math.sin(Math.PI*clamp((t-.32)/.68)),fin=5*p.scale;
  for(const side of [-1,1]){
   const x=p.x-dx*11*p.scale-dy*side*fin,y=p.y-dy*11*p.scale+dx*side*fin;
   strip(c,view,'vaporTrail',x-dx*(10+22*pulse)-dy*side*pulse*4,y-dy*(10+22*pulse)+dx*side*pulse*4,x,y,low?4:5,pulse*.8);
  }
 }
 return false;
}

export function drawSecretWingRound(c,b,view){
 if(!(b.life>0)||(b.secretWeapon!=='eliteAirWing'&&!b.secretWingRound)||b.actualExplosion||!view.visible(b.x,b.y,55))return;
 const direction=Math.atan2(b.vy,b.vx),dx=Math.cos(direction),dy=Math.sin(direction);
 // Follow each real round of a fan, precision burst, rear shot or rocket salvo.
 // Never emit a fan of surrogate bullets to decorate the launch origin.
 const x=Number.isFinite(b.previousX)?b.previousX:b.x-dx*11,y=Number.isFinite(b.previousY)?b.previousY:b.y-dy*11;
 if(b.rocket)strip(c,view,'exhaust',x-dx*24,y-dy*24,b.x-dx*3,b.y-dy*3,11,.92);
 else if(b.synthesisPayload?.incendiary)strip(c,view,'fireWing',x-dx*16,y-dy*16,b.x,b.y,8,.94);
 else if(b.secretWeapon==='eliteAirWing'||b.pierce)strip(c,view,'bulletBrass',x-dx*(b.pierce?17:8),y-dy*(b.pierce?17:8),b.x,b.y,b.pierce?3:4,.94);
}

function wakeCue(c,world,q,v,age,t,art,low){
 const path=q.path;
 if(path?.length){
  // Segments contain the exact leading and trailing points sampled by the
  // wake-contact test. Breaks never bridge a teleport or a new acceleration.
  const step=low?path.length:Math.max(1,Math.ceil(path.length/2));
  for(let i=0;i<path.length;i+=step){
   const start=path[i],end=path[Math.min(path.length-1,i+step-1)];
   const a0=Math.atan2(start[3]-start[1],start[2]-start[0]),a1=Math.atan2(end[3]-end[1],end[2]-end[0]);
   for(const side of [-1,1]){
    const tip=side*(22+t*10);
    strip(c,v,'vaporTrail',start[0]-Math.sin(a0)*tip,start[1]+Math.cos(a0)*tip,
     end[2]-Math.sin(a1)*tip,end[3]+Math.cos(a1)*tip,9+t*8,(1-t)*.9);
   }
  }
 }
 // Vortices shed alternately from the sampled wingtip strips. Each starts at
 // its own recorded world position, even after the aircraft turns away.
 const side=q.side??(Math.floor(q.at*9)%2?1:-1),ca=Math.cos(q.a),sa=Math.sin(q.a);
 const separation=side*(22+t*18),back=4+t*12;
 art.drawBadinVortex(c,v.sx(q.x-ca*back-sa*separation),v.sy(q.y-sa*back+ca*separation),
  q.a,side,(27+38*t)*v.z,age*(9+4*t),(1-t)*.88);
}

function liveWing(world,q){
 return (world.allies||[]).find(w=>w.life>0&&!w.carrierHidden&&(w.hp==null||w.hp>0)&&
  (w.ownerId??'p1')===(q.ownerId??'p1')&&w.slot===q.wingSlot&&(!q.acePilot||w.acePilot===q.acePilot));
}

function impact(c,q,v,a,t,low){
 const z=v.z,age=t*(q.life||1),fade=1-t,x=v.sx(q.x),y=v.sy(q.y);
 if(q.kind==='armorImpact'){
  if(age<.21)fx(c,'shellBurst'+Math.min(3,Math.floor(age/.05)),x,y,(42+age*100)*z,(33+age*75)*z,a,1-age/.23);
  const count=low?3:5;
  for(let i=0;i<count;i++){
   const h=a+(i-(count-1)/2)*.52,r=(1-(1-t)**2)*(25+(i%3)*11);
   const px=x+Math.cos(h)*r*z,py=y+(Math.sin(h)*r+31*t*t)*z;
   if(!drawSecretWarArt(c,'tornPlate',px,py,(9+i%3*3)*z,h+(i%2?-1:1)*age*11,fade)){
    fx(c,'metalShard'+i,px,py,13*z,7*z,h+age*8,fade);
   }
  }
  return;
 }
 const dx=Math.cos(a),dy=Math.sin(a);
 if(age<.27)fx(c,'bombfx'+Math.min(3,Math.floor(age/.065)),x,y,(73+age*85)*z,(60+age*53)*z,a,1-age/.31);
 // A surface blast expands around the impact point; smoke from an airburst
 // follows the aircraft's heading in the map plane.
 const spread=Math.sin(Math.PI*clamp(age/1.2)),width=(48+spread*40)*z;
 if(age>.07){
  if(q.impactLayer==='water')fx(c,'splashShell',x,y,width,width,a,clamp(fade*1.7));
  else if(q.impactLayer==='air')fx(c,'smokeDark',x-dx*t*12*z,y-dy*t*12*z,width,width*.83,a,clamp(fade*1.4));
  else if(!drawSecretWarArt(c,'earthPlume',x,y,width,a,clamp(fade*1.7)))fx(c,'dirtMix',x,y,width,width,a,fade);
 }
 if(age>.22&&q.impactLayer!=='air'){
  const slide=clamp((age-.22)/.66);
  for(const side of [-1,1]){
   const d=side*slide*27;
   fx(c,q.impactLayer==='water'?'splashTiny':'dustPuff',x-dy*d*z,y+dx*d*z,(21+slide*24)*z,(10+slide*13)*z,a+side*.27,fade*.76);
  }
 }
}

export function drawSecretFlightCue(c,world,q,v,art,low=false){
 const life=q.life||.45,age=(world.t||0)-q.at,t=clamp(age/life),fade=1-t;
 if(age<0||age>=life)return false;
 const a=q.a||0,dx=Math.cos(a),dy=Math.sin(a),z=v.z,x=v.sx(q.x),y=v.sy(q.y);
 switch(q.kind){
 case 'badinWake':wakeCue(c,world,q,v,age,t,art,low);return true;
 case 'wake':{
  const target=q.targetId!=null&&(world.enemies||[]).find(e=>e.hp>0&&(e.id===q.targetId||e.tailId===q.targetId));
  const ex=v.sx(target?.x??q.x),ey=v.sy(target?.y??q.y);
  // Both rolls meet the struck fuselage, then slip off opposite tips.
  for(const side of [-1,1]){
   const across=side*(7+31*Math.sin(t*Math.PI/2));
   art.drawBadinVortex(c,ex-dy*across*z-dx*t*19*z,ey+dx*across*z-dy*t*19*z,a,side,(28+33*t)*z,age*17,fade);
  }
  return true;
 }
 case 'armorLaunch':{
  // Bolt heads eject toward the incoming hit before individual flying panels
  // arrive; no second ring of projectiles competes with the real six plates.
  if(age<.16)fx(c,'armorSpark',x+dx*10*z,y+dy*10*z,56*z,30*z,a,1-age/.16);
  for(let i=0;i<(low?2:4);i++){
   const side=i%2?1:-1,d=10+t*(21+i*4);
   fx(c,'bulletBrass',x+(dx*d-dy*side*d*.63)*z,y+(dy*d+dx*side*d*.63+t*t*15)*z,8*z,4*z,a+side*t*5,fade);
  }
  return true;
 }
 case 'armorImpact':case 'bomberImpact':impact(c,q,v,a,t,low);return true;
 case 'bomberRelease':
  // The live bomber rack and the specific falling bomb own this sequence.
  return true;
 case 'wingAttack':{
  // A brief discharge stays at the shot's real muzzle; its casing and smoke
  // stay behind as the wing leaves instead of tracking a moving muzzle flash.
  const recoil=clamp(age/.12);
  if(age<.09)fx(c,q.rear?'muzzleRear':'muzzleTwin',x+dx*25*z,y+dy*25*z,41*z,17*z,a,1-age/.09);
  fx(c,'bulletBrass',x+(dx*9-dy*(7+recoil*12))*z,y+(dy*9+dx*(7+recoil*12)+recoil*recoil*6)*z,9*z,4*z,a+recoil*3,fade);
  return true;
 }
 case 'wingHit':{
  const target=q.targetId!=null&&(world.enemies||[]).find(e=>e.hp>0&&(e.id===q.targetId||e.tailId===q.targetId));
  const ex=v.sx(target?target.x+(q.offsetX||0):q.x),ey=v.sy(target?target.y+(q.offsetY||0):q.y);
  if(age<.13)fx(c,'armorSpark',ex,ey,38*z,24*z,a,1-age/.13);
  fx(c,'debrisShard',x+(dx*29-dy*9)*t*z,y+(dy*29+dx*9+18*t)*t*z,17*z,9*z,a+age*8,fade);
  return true;
 }
 case 'wingSkill':{
  const wing=liveWing(world,q);
  if(!wing)return true;
  const h=wing.a||0,cos=Math.cos(h),sin=Math.sin(h),wx=v.sx(wing.x),wy=v.sy(wing.y);
  if(q.mode==='repair'){
   // A line of short repair sparks advances along the actual repaired wing.
   for(const side of [-1,1]){
    const d=12-t*22,off=side*12;
    fx(c,'spark',wx+(cos*d-sin*off)*z,wy+(sin*d+cos*off)*z,17*z,7*z,h+side*.5,fade);
   }
  }else if(q.mode==='guard'&&t<.58){
   const off=(t/.58-.5)*28;
   fx(c,'ricochet',wx+(cos*15-sin*off)*z,wy+(sin*15+cos*off)*z,32*z,11*z,h+.7,1-t/.58);
  }else if(q.mode==='rally'||q.mode==='salvo'||q.mode==='fan'){
   // Fire pulses depart from the guns; the actual fan, precision pair, or
   // synchronized rounds continue independently in drawSecretWingRound.
   const gap=q.mode==='fan'?.13:q.mode==='salvo'?.045:.08;
   for(const side of [-1,1]){
    if(age>.16)break;
    fx(c,'muzzleTwin',x+dx*23*z,y+dy*23*z,34*z,12*z,a+side*gap,1-age/.16);
   }
  }
  // Rocket / incendiary / bomb effects follow their real projectiles, while
  // manoeuvre skills use the wing's continuous track in drawSecretFlightWings.
  return true;
 }
 default:return false;
 }
}

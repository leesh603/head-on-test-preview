import {fx} from './fx-art.js?v=tame3';
import {planeSprite} from './aircraft.js?v=outline2&art=pilot-recovery2&pf=1027&crewbake=1';
import {drawGameIcon} from './icons.js?v=buildfit1&afc=1&opt=1';

const clamp=n=>Math.max(0,Math.min(1,n));
// Weapon artwork is the existing painted gun atlas, fitted onto the incoming airframe.
// No particle allocation: at most three parts, three engine puffs and three gun flashes.
export function drawBuildTransferEntry(c,p,x,y){
 const fit=p.bomberTransfer,t=fit?.entryTime;if(!fit?.kind)return false;
 if(fit.kind==='gunship'){
  const seat=clamp((t-.35)/1.2),fade=clamp((2.25-t)/.5),sideSlide=(1-seat)**3*45;
  c.save();c.translate(x,y);c.rotate(p.a);
  for(const side of [-1,1]){
   c.save();c.translate(fit.front*.55,side*(10+sideSlide));c.rotate(side*(1-seat)*.32);
   c.globalAlpha=clamp(t/.25)*fade;drawGameIcon(c,p.plane&&fit.sprite==='transfer-aeg-ji'?'gun-spandau':'gun-vickers',0,0,34-10*seat);c.restore();
   const flash=clamp(1-Math.abs(t-(1.2+(side+1)*.14))/.22);
   if(flash)fx(c,'armorSpark',fit.front*.55,side*10,26,19,side*.5,flash*.65);
  }
  if(t>1.8&&t<2.35)for(const side of [-1,1])fx(c,'muzzleTwin',fit.front+5,side*9,25,18,0,Math.sin((t-1.8)/.55*Math.PI)*.85);
  c.restore();
 }else{
  const q=clamp((t-.35)/2.25);
  c.save();c.globalAlpha=clamp(t/.45)*(1-q)*.65;
  planeSprite(c,x+15,y+22,p.a,fit.sprite,fit.scale*(1.35-.35*q),false,true);c.restore();
  const arrival=clamp((t-.65)/1.95),height=(1-arrival)*(p.viewHeight||900)*.42;
  c.save();c.translate(x,y-height);c.rotate(p.a);c.scale(1.35-.35*arrival,1.35-.35*arrival);
  for(let i=0;i<3;i++){
   const age=t-.65-i*.25;if(age<0||age>1.35)continue;
   const phase=age/1.35,side=i===2?0:i?1:-1,forward=i===2?-fit.rear:8;
   fx(c,'engineSmoke',forward-7-phase*16,side*(fit.hullWidth-3),22+phase*24,13+phase*16,Math.PI,(1-phase)*.5);
   if(age<.25)fx(c,'muzzleFlash',forward-5,side*(fit.hullWidth-3),18,12,Math.PI,(1-age/.25)*.55);
  }
  if(t>2.05)for(const side of [-1,1])fx(c,'muzzleRear',fit.front*.45,side*fit.hullWidth,23,15,side*Math.PI/2,clamp((2.6-t)/.4)*.65);
  c.restore();
 }
 return true;
}
export function drawTransferStations(c,p,x,y){
 const fit=p.bomberTransfer;if(!fit?.stations)return;
 const ca=Math.cos(p.a),sa=Math.sin(p.a);
 for(const station of fit.stations){
  if(!(station.flash>0))continue;
  const a=station.aim,px=x+ca*station.front-sa*station.lateral,py=y+sa*station.front+ca*station.lateral;
  fx(c,'muzzleTwin',px+Math.cos(a)*5,py+Math.sin(a)*5,21,14,a,Math.min(1,station.flash*12));
 }
}


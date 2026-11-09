import {planeSprite} from './aircraft.js?v=outline2&art=pilot-recovery2&pf=1027&crewbake=1&rim=idle&decode=1';
import {bombSprite} from './bomb-sprites.js?v=bomb20&perf=1029';
import {fx} from './fx-art.js?v=tame3';

export function secretBomberAirframe(faction){
 return faction==='central'?'bomber-transfer-gotha':'bomber-transfer-o400';
}

export function drawSecretWeaponFx(c,world,view,art,{low,factionFor}={}){
 const {sx,sy,z,visible}=view,{sprite,cable}=art,now=world.t||0;
 for(const b of world.friendlyBombs||[]){
  if(b.secretWeapon!=='sn1650'||b.life<=0||!visible(b.x,b.y,250))continue;
  const t=1-b.life/b.maxLife,a=b.releaseAngle,owner=world.players?.find(p=>p.id===b.ownerId)||world;
  const x=sx(b.x),y=sy(b.y);
  c.save();c.filter='brightness(0)';
  bombSprite(c,'puw',x+12*z,y+9*z,(24+t*83)*z,a,.15+.24*t);
  c.restore();
  if(t<.62){
   const advance=(t/.62)*860;
   c.save();c.globalAlpha=.55;planeSprite(c,sx(b.sx+Math.cos(a)*advance),sy(b.sy+Math.sin(a)*advance),a,secretBomberAirframe(factionFor?.(owner)),2.4*z,false,true);c.restore();
  }else{
   const fall=(t-.62)/.38,offset=(1-fall)*(1-fall)*155;
   fx(c,'smokeDark',x+12*z,y+9*z,(24+fall*64)*z,(17+fall*22)*z,a,.2+fall*.25);
   bombSprite(c,'puw',x-Math.cos(a)*offset*z,y-Math.sin(a)*offset*z,(115-fall*48)*z,a);
  }
 }
 for(const cue of world.secretWeaponFx||[]){
  const age=now-cue.at,life=cue.life||.45;
  if(age<0||age>=life||!visible(cue.x,cue.y,280))continue;
  const x=sx(cue.x),y=sy(cue.y),a=cue.a||0,t=age/life,fade=1-t;
  const stamp=(key,dx,dy,w,h,angle=a,alpha=fade)=>fx(c,key,x+dx*z,y+dy*z,w*z,h*z,angle,alpha);
  const forward=(key,d,side,w,h,angle=a,alpha=fade)=>stamp(key,Math.cos(a)*d-Math.sin(a)*side,Math.sin(a)*d+Math.cos(a)*side,w,h,angle,alpha);
  switch(cue.kind){
  case 'rotary':
  case 'pom': {
   const pom=cue.kind==='pom';
   if(age<.095)forward('muzzleHeavy',pom?36:27,0,pom?46:28,pom?27:13,a,1-age/.095);
   forward('gunSmoke',38+age*20,0,23+age*18,15+age*15,a,.66*fade);
   for(let i=0;i<(low||pom?1:3);i++)forward('bulletBrass',4-age*34,6+age*(90+i*26),pom?12:7,pom?4:2,a+age*(5+i),fade);
   break;
  }
  case 'pomImpact':
   stamp('debrisShard',t*20,-t*17,19,13,a+t*3);
   stamp('fireSmall',0,0,27+t*18,23+t*15,-t,.8*fade);
   break;
  case 'heavyImpact': {
   const size=(cue.radius||198)*1.7;
   stamp('shockRing',0,0,size*(.3+.7*t),size*(.3+.7*t),0,.78*fade);
   stamp('fireFlash',0,0,size*.68,size*.62,0,Math.max(0,1-t*4));
   stamp(cue.water?'waterColumn':'dirtBurst',0,-26*t,size*.8,size*.73,0,fade);
   for(let i=0;i<(low?3:6);i++){
    const heading=i*2.39996,r=(.1+t*.6)*(cue.radius||198);
    stamp(cue.water?'splashShell':'dustPuff',Math.cos(heading)*r,Math.sin(heading)*r,60+86*t,50+70*t,heading,.77*fade);
   }
   break;
  }
  case 'steelRain':
   for(let i=0;i<(low?8:16);i++){
    const phase=(t*2.1+i*.173)%1,dx=(i%7-3)*16,dy=(Math.floor(i/7)-1)*18;
    sprite(c,'flechetteDart',x+dx*z,y+(dy-88*(1-phase))*z,15*z,1.23,Math.sin(phase*Math.PI)*fade);
   }
   break;
  case 'gasBarrage':
   for(let i=0;i<(low?2:4);i++){
    const heading=i*2.39996,r=(cue.radius||122)*(.2+t*.55);
    stamp(i%2?'smokeGray':'gas',Math.cos(heading)*r,Math.sin(heading)*r,75+t*55,65+t*44,heading,.62*Math.min(1,age*4,fade*4));
   }
   break;
  case 'firechain':
   for(const link of cue.links||[]){
    const end=(link.id!=null&&(world.enemies||[]).find(e=>e.id===link.id||e.tailId===link.id))||link;
    c.save();c.globalAlpha*=fade;cable(c,x,y,sx(end.x),sy(end.y),z,8*z);c.restore();
    sprite(c,'grapnelFire',sx(end.x),sy(end.y),32*z,Math.atan2(end.y-cue.y,end.x-cue.x),fade);
   }
   break;
  case 'breakthrough':
   for(const side of [-1,1])forward('vaporTrail',-36-age*105,side*(16+age*15),67,11,a,.65*fade);
   break;
  case 'wake':
   stamp('smokeWisp',0,0,47,20,a,fade);
   break;
  case 'ram':
   stamp('fireFlash',0,0,57,34,a,Math.max(0,1-3*t));
   stamp('debrisShard',18*t,-25*t,26,18,a+3*t);
   stamp('debrisShard',-18*t,22*t,20,13,a-2*t);
   break;
  case 'armorLaunch':
   for(let i=0;i<(low?3:6);i++){const h=a+i*Math.PI/(low?1.5:3);stamp('smokePuff',Math.cos(h)*(13+t*30),Math.sin(h)*(13+t*30),23,17,h);}
   break;
  case 'armorImpact':
   stamp('dirtBurst',0,0,52+t*24,43+t*24,0,fade);
   stamp('fireSmall',0,0,35,28,a,Math.max(0,1-t*2));
   break;
  case 'wingSkill':
   forward(cue.mode==='ignite'?'fireSmall':['dive','charge'].includes(cue.mode)?'vaporTrail':'muzzleTwin',cue.mode==='dive'?-26:28,0,52,24);
   break;
  case 'bomberRelease':
   forward('smokePuff',-14-t*22,0,48,24,a,.7*fade);
   break;
  }
 }
}

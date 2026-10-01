import {AIRSHIP_SIZE,airshipScale} from './airship-layout.js?v=airships20261001';
import {fx} from './fx-art.js?v=464';

// Registered rectangles in the two authored 1774 x 887 RGBA sheets.
export const AIRSHIP_DAMAGE_FRAMES=Object.freeze({
 'zeppelin-l70':[[0,135,887,295],[887,135,887,295],[0,476,887,295],[887,477,887,295]],
 hma23:[[0,131,887,295],[887,134,887,295],[0,534,887,295],[887,551,887,295]]
});
function sprite(c,im,frame,x,y,w,h){if(!im?.naturalWidth)return false;c.drawImage(im,...frame,x-w/2,y-h/2,w,h);return true;}
function brackets(c,x,y,r,color){c.strokeStyle=color;c.lineWidth=1.5;for(const [sx,sy]of [[-1,-1],[-1,1],[1,-1],[1,1]]){c.beginPath();c.moveTo(x+sx*r,y+sy*(r-5));c.lineTo(x+sx*r,y+sy*r);c.lineTo(x+sx*(r-5),y+sy*r);c.stroke();}}
export function drawAirship(c,b,images){
 const s=airshipScale(b),w=AIRSHIP_SIZE.width*s,h=AIRSHIP_SIZE.height*s,frames=AIRSHIP_DAMAGE_FRAMES[b.assetKey],parts=b.parts||[];
 const wreck=b.destroying?Math.min(1,b.destructionAge/Math.max(.1,b.destructionDuration)):0,time=b.motionTime||0;
 c.save();c.translate(b.x,b.y);c.rotate(b.hullYaw||0);c.imageSmoothingEnabled=true;
 if(wreck){c.translate(wreck*w*.1,wreck*h*.8);c.rotate(wreck*.18);c.globalAlpha*=Math.max(0,1-wreck*.93);}
 const hullAlpha=b.phase==='cloud'?.23:b.phase==='reveal'?.23+.77*(b.revealProgress||0):1;
 c.save();c.globalAlpha*=hullAlpha;
 const fraction=b.hp/b.maxHp,index=wreck?3:fraction<.35?2:fraction<.62?1:fraction<.82?0:-1;
 if(index>=0&&!sprite(c,images.damage,frames[index],0,0,w,h))sprite(c,images.normal,[0,0,640,213],0,0,w,h);
 else if(index<0)sprite(c,images.normal,[0,0,640,213],0,0,w,h);
 for(const p of parts){
   if(p.kind==='observer')continue;const x=p.localX,y=p.localY,r=p.radius||13*s;
   if(p.destroyed&&images.damage?.naturalWidth){const f=frames[2],rx=r*1.1,ry=r;
     c.drawImage(images.damage,f[0]+(x/w+.5-rx/w)*f[2],f[1]+(y/h+.5-ry/h)*f[3],rx*2/w*f[2],ry*2/h*f[3],x-rx,y-ry,rx*2,ry*2);
     const age=time-(p.destroyedAt??time),burn=Math.max(0,1-age/5)*(1-wreck);
     if(p.kind==='engine'&&burn>0){fx(c,'fireEngine',x,y,r*2.1,r*2.1,0,.65*burn);fx(c,'smokeDark',x+15*s,y-10*s,r*3,r*3,0,.38*burn);}
   }else if(!p.destroyed&&!wreck){
     // Hull wear never replaces an operational mount with a painted wreck.
     if(index>=0&&p.kind!=='bomb-bay'&&images.normal?.naturalWidth){const rx=r*(p.kind==='launch-port'?.82:.8),ry=r*(p.kind==='launch-port'?.63:.65);
       c.drawImage(images.normal,(x/w+.5-rx/w)*640,(y/h+.5-ry/h)*213,rx*2/w*640,ry*2/h*213,x-rx,y-ry,rx*2,ry*2);
     }
     if(p.kind==='engine'){
     c.save();c.translate(x,y+5*s);c.rotate(time*18);c.strokeStyle='#b3b0a69c';c.lineWidth=1.2*s;for(let i=0;i<3;i++){c.rotate(Math.PI*2/3);c.beginPath();c.moveTo(0,0);c.lineTo(0,6*s);c.stroke();}c.restore();
     }
   }
   if(!p.destroyed&&p.hatch&&!wreck){
     c.fillStyle='#161e1dc9';c.fillRect(x-r*.65,y-r*.38,r*1.3,r*.76);brackets(c,x,y,r*.85,'#d8b37da6');
     if(p.launchWarmup>0){c.strokeStyle='#e7c28b';c.lineWidth=2;c.beginPath();c.moveTo(x-r*.65,y+r*.52);c.lineTo(x-r*.65+r*1.3*(1-p.launchWarmup/1.05),y+r*.52);c.stroke();}
   }
   if(!p.destroyed&&p.hp<p.maxHp&&!wreck){c.fillStyle='#1b2427';c.fillRect(x-r,y+r+4,r*2,3);c.fillStyle='#d7af78';c.fillRect(x-r,y+r+4,r*2*p.hp/p.maxHp,3);}
 }
 c.restore();
 if(b.assetKey==='zeppelin-l70'){
   const observer=parts.find(p=>p.kind==='observer');
   if(observer&&b.phase==='cloud'){
     c.strokeStyle='#918d78';c.lineWidth=1.6*s;c.beginPath();c.moveTo(0,39*s);c.quadraticCurveTo(observer.localX*.28,94*s,observer.localX,observer.localY);c.stroke();
     sprite(c,images.normal,[278,142,73,43],observer.localX,observer.localY,45*s,27*s);
     if(observer.hp<observer.maxHp){brackets(c,observer.localX,observer.localY,23*s,'#e3b378b0');}
   }
   if(b.phase==='cloud'||b.phase==='reveal'){
     const opacity=(1-(b.revealProgress||0))*.4;
     for(let i=0;i<5;i++)fx(c,'mist',(i-2)*72*s+Math.sin(time*.2+i)*13*s,(i%2?-15:10)*s,180*s,90*s,0,opacity);
   }
 }
 if(wreck){fx(c,'fireEngine',w*.12,h*.08,w*.20,h*.7,0,(1-wreck)*.5);fx(c,'smokeHeavy',w*.18,-h*.2,w*.30,h*1.2,0,(1-wreck)*.45);}
 c.restore();
}

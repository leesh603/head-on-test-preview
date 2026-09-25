import {SUN_STRIKE} from './engine.js?v=331&b=326';
import {fx,fxReady} from './fx-art.js?v=331';
// Warm, restrained optical streaks; no strobe or additive whiteout.
export function drawSunStrike(c,g,w,h){
 if(!g||!g.isRedHunter()||g.skillTime<=0)return;
 const fade=Math.min(1,(SUN_STRIKE.duration-g.skillTime)/.22,g.skillTime/.35);
 c.save();c.fillStyle=`rgba(13,17,21,${.17*fade})`;c.fillRect(0,0,w,h);
 c.translate(w/2,h/2);c.rotate(g.a);
 c.beginPath();c.moveTo(0,0);c.arc(0,0,SUN_STRIKE.range,-SUN_STRIKE.halfAngle,SUN_STRIKE.halfAngle);c.closePath();c.clip();
 const glow=c.createLinearGradient(-65,0,SUN_STRIKE.range,0);glow.addColorStop(0,`rgba(255,232,179,${.25*fade})`);glow.addColorStop(.35,`rgba(230,195,122,${.15*fade})`);glow.addColorStop(1,'rgba(213,177,109,0)');c.fillStyle=glow;c.fillRect(0,-650,650,1300);
 if(fxReady('sunshaft')){
  for(let i=0;i<5;i++){const a=(i/4*2-1)*SUN_STRIKE.halfAngle*.9,L=SUN_STRIKE.range*.8;
   fx(c,'sunshaft',Math.cos(a)*L*.5-30,Math.sin(a)*L*.5,L,140+((i*53)%80),a,.5*fade);}
 }else for(let i=0;i<11;i++){
  const a=(i/10*2-1)*SUN_STRIKE.halfAngle,spread=.006+(i%3)*.005,length=650-(i%4)*24;
  c.fillStyle=`rgba(255,231,169,${(.055+.025*Math.sin(g.t*2+i))*fade})`;
  c.beginPath();c.moveTo(-65,0);c.lineTo(Math.cos(a-spread)*length,Math.sin(a-spread)*length);c.lineTo(Math.cos(a+spread)*length,Math.sin(a+spread)*length);c.closePath();c.fill();
 }
 c.restore();c.save();c.translate(w/2,h/2);c.rotate(g.a);c.fillStyle=`rgba(252,225,169,${.18*fade})`;c.fillRect(-65,-2,50,4);c.restore();
}

// Painted surface water conceals an opaque, stationary hull from bow to stern.
// Hull art, mounts and heading remain in their original world pose throughout.
export const FLEET_SINK_DURATION=3.1;
const clamp=v=>Math.max(0,Math.min(1,v));
const images={};
export function prepareSinkingWater(){
 if(typeof Image==='undefined')return;
 for(const key of ['foam','churn','splash'])if(!images[key]){const im=new Image();im.decoding='async';im.src='./ship-sink'+key+'.webp?v=sink-waterline-1';images[key]=im;}
}
export function sinkingPhase(age,duration=4.4){
 const life=Math.max(.1,duration),settle=Math.min(.28,life*.09),submerge=life*.77;
 const q=clamp((age-settle)/Math.max(.1,submerge-settle));
 // Slow initial flooding, a heavier middle plunge, then the stern disappears.
 const progress=q*q*(3-2*q);
 return {progress,water:clamp(age/.18),tail:1-clamp((age-submerge)/(life-submerge)),done:age>=life};
}
function paint(c,im,x,y,w,h,alpha,angle=0){
 if(!im?.naturalWidth||alpha<=0)return;
 c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha*=alpha;c.imageSmoothingEnabled=true;c.drawImage(im,-w/2,-h/2,w,h);c.restore();
}
export function drawSinkingWater(c,{x,y,yaw=0,width,height,age=0,duration=4.4}){
 prepareSinkingWater();const phase=sinkingPhase(age,duration);if(phase.done)return;
 const {progress:p,water,tail}=phase,w=width,h=height,edge=-h/2+h*p;
 c.save();c.translate(x,y);c.rotate(yaw);
 // Flooded water stays over the submerged part of the original footprint.
 const wet=Math.max(w*.3,h*p),f=water*tail;
 for(let i=0;i<3;i++)paint(c,images.churn,Math.sin(age*.6+i*2.1)*w*.08,-h/2+wet*(i+.5)/3,Math.max(w*.45,wet*.46),w*(.78+i*.12),f*(.31-i*.025),Math.PI/2);
 // Staggered aerated patches release along the hull rather than one blanket.
 for(let i=0;i<7;i++){
  const at=(i+.35)/7,release=clamp((p-at+.16)/.2),linger=1-clamp((p-at-.25)/.65);
  const size=w*(.52+.10*Math.sin(age*1.8+i*2.7));
  const side=i%2?1:-1;
  paint(c,images.foam,side*w*(.22+Math.sin(age+i)*.025),-h/2+h*at,size,size,f*release*linger*.62,i*1.9+age*.07);
 }
 if(p<1){
  // The foam collar covers the animated clip edge, in ship-local orientation.
  for(let i=0;i<3;i++){const s=w*(.76+i*.08),xx=(i-1)*w*.35;
   paint(c,images.foam,xx,edge+Math.sin(age*3+i*2)*w*.035,s,s*.72,water*(.74-i*.08),i*2.3+age*.12);}
  const splash=clamp(1-age/.72)*water;
  paint(c,images.splash,0,-h*.36,w*1.9,w*1.3,splash*.66);
 }else{
  // Only surface bubbles remain after the last opaque piece has submerged.
  paint(c,images.foam,0,h*.25,w*(1.15+(1-tail)*.5),w*(.9+(1-tail)*.35),f*.56,age*.05);
 }
 c.restore();
}
export function drawSinkingShip(c,pose,drawHull){
 const {progress,done}=sinkingPhase(pose.age,pose.duration);if(done)return;
 if(progress<1){
  const {x,y,yaw=0,width:w,height:h}=pose,edge=-h/2+progress*h,pad=w*1.25;
  c.save();c.translate(x,y);c.rotate(yaw);
  c.beginPath();c.moveTo(-pad,h/2+pad);c.lineTo(-pad,edge);
  for(let i=0;i<=12;i++){const xx=-pad+2*pad*i/12;
   c.lineTo(xx,edge+Math.sin(i*1.73+pose.age*4)*w*.025);}
  c.lineTo(pad,h/2+pad);c.closePath();c.clip();
  // Restore the caller's coordinates while retaining the world-space mask.
  c.rotate(-yaw);c.translate(-x,-y);drawHull();c.restore();
 }
 drawSinkingWater(c,pose);
}

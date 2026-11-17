// Authored foam/ordnance sprites only. Histories advance in simulation, never draw.
const images=new Map();
const WATER_RECTS=[[10,15,482,415],[521,16,480,423],[1041,10,485,432],[210,432,112,568],[642,430,295,565],[1120,428,335,570]];
const FILES={adriatic:'adriatic-water-contact-20261117.webp',wake:'ship-wake.webp',atlas:'naval-water-atlas.webp',roundel:'aircraft-roundel.svg',cross:'aircraft-iron-cross.svg'};
function image(key){if(typeof Image==='undefined')return null;if(!images.has(key)){const im=new Image();im.crossOrigin='anonymous';im.src='./'+FILES[key]+'?v='+(key==='adriatic'?'cohesion2':'tame3');images.set(key,im);}return images.get(key);}
export function prepareNavalWater(adriatic=false){
 for(const k of Object.keys(FILES))if(k!=='adriatic'||adriatic)image(k);
}
export function recordShipWake(b,dt,height){b.waterTime=(b.waterTime||0)+dt;const yaw=b.hullYaw??(b.a+Math.PI/2),x=b.x-Math.sin(yaw)*height*.43,y=b.y+Math.cos(yaw)*height*.43;b.wakeTrail??=[];const p=b.wakeTrail[0];if(!p||Math.hypot(x-p.x,y-p.y)>=8){b.wakeTrail.unshift({x,y,t:b.waterTime});if(b.wakeTrail.length>24)b.wakeTrail.pop();}b.wakeTrail=b.wakeTrail.filter(p=>b.waterTime-p.t<14);}
export function drawFactionMark(c,faction,x,y,size,angle=0){const im=image(faction==='central'?'cross':'roundel');if(!im?.naturalWidth)return;c.save();c.translate(x,y);c.rotate(angle);c.drawImage(im,-size/2,-size/2,size,size);c.restore();}
function atlas(c,index,x,y,w,h,angle=0,alpha=1){const im=image('atlas');if(!im?.naturalWidth)return;const r=WATER_RECTS[index];c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha*=alpha;c.drawImage(im,...r,-w/2,-h/2,w,h);c.restore();}
export function drawShipWater(c,b,width,height,point=(x,y)=>[x,y],{adriatic=false,local=false}={}){
 if(b.dead||b.destroying)return;
 const moving=!b.moored&&b.driveVelocity>1;
 if(!moving&&!adriatic)return;
 const yaw=b.hullYaw??(local?b.angle??0:b.a+Math.PI/2),[x,y]=local?[0,0]:point(b.x,b.y);
 const speed=moving?Math.min(1,b.driveVelocity/38):0,trail=b.wakeTrail||[],im=moving?image('wake'):null;
 const water=adriatic?image('adriatic'):null;
 const ca=Math.cos(yaw),sa=Math.sin(yaw);
 const wakePoint=local?p=>{
  const dx=p.x-b.x,dy=p.y-b.y;
  return [dx*ca+dy*sa,dy*ca-dx*sa];
 }:p=>point(p.x,p.y);
 // World-space stern positions retain the shape of the turn.
 if(im?.naturalWidth&&trail.length>1)for(let i=trail.length-2;i>=0;i--){
  if(i%4)continue;
  const p=trail[i],q=trail[i+1],[px,py]=wakePoint(p),[qx,qy]=wakePoint(q),fade=Math.max(0,1-(b.waterTime-p.t)/14);
  if(fade<.25||Math.hypot(qx-px,qy-py)<1||(!local&&(px<-height||py<-height||px>c.canvas.width+height||py>c.canvas.height+height)))continue;
  c.save();c.translate(px,py);c.rotate(Math.atan2(qy-py,qx-px)-Math.PI/2);
  c.globalAlpha*=fade*(.045+.025*speed);
  const w=width*(.65+(1-fade)*.55),h=Math.min(height*.7,w*3.2);
  c.drawImage(im,-w/2,0,w,h);c.restore();
 }
 c.save();c.translate(x,y);if(!local)c.rotate(yaw);
 const clock=b.waterTime||0;
 if(water?.naturalWidth){
  // Precomposited water contact and six foam phases cost one blit per hull.
  const frame=moving?Math.floor(clock*6)%6:6,alpha=c.globalAlpha;
  c.globalAlpha=alpha*(moving?.67+speed*.30:.7);
  c.drawImage(water,frame%4*192,Math.floor(frame/4)*384,192,384,-width*.82,-height*.57,width*1.64,height*1.15);
  c.globalAlpha=alpha;
 }
 if(moving){
  if(!water?.naturalWidth){
   const bw=width*1.65,bh=bw*.88;
   atlas(c,Math.floor(clock*5)%3,0,-height*.50+bh*.49,bw,bh,0,.45+speed*.25);
  }
  if(im?.naturalWidth){const w=width*.75,h=Math.min(height*.50,w*3);c.globalAlpha*=.35+speed*.20;c.drawImage(im,-w/2,height*.40,w,h);}
 }
 c.restore();
}
export function drawTorpedo(c,h){const a=Math.atan2(h.vy,h.vx)+Math.PI/2;c.save();c.translate(h.x,h.y);c.rotate(a);atlas(c,4+Math.floor((h.age||0)*8)%2,0,100,44,140,0,.65);atlas(c,3,0,0,20,64);c.restore();}
// Warmed by naval stages (prepareStageBossAssets); drawing still lazy-loads as a fallback.

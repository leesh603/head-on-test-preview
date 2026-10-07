// Authored foam/ordnance sprites only. Histories advance in simulation, never draw.
const images=new Map();
const WATER_RECTS=[[10,15,482,415],[521,16,480,423],[1041,10,485,432],[210,432,112,568],[642,430,295,565],[1120,428,335,570]];
const FILES={wake:'ship-wake.webp',atlas:'naval-water-atlas.webp',roundel:'aircraft-roundel.svg',cross:'aircraft-iron-cross.svg'};
function image(key){if(typeof Image==='undefined')return null;if(!images.has(key)){const im=new Image();im.crossOrigin='anonymous';im.src='./'+FILES[key]+'?v=coop1';images.set(key,im);}return images.get(key);}
export function prepareNavalWater(){for(const k of Object.keys(FILES))image(k);}
export function recordShipWake(b,dt,height){b.waterTime=(b.waterTime||0)+dt;const yaw=b.hullYaw??(b.a+Math.PI/2),x=b.x-Math.sin(yaw)*height*.43,y=b.y+Math.cos(yaw)*height*.43;b.wakeTrail??=[];const p=b.wakeTrail[0];if(!p||Math.hypot(x-p.x,y-p.y)>=8){b.wakeTrail.unshift({x,y,t:b.waterTime});if(b.wakeTrail.length>24)b.wakeTrail.pop();}b.wakeTrail=b.wakeTrail.filter(p=>b.waterTime-p.t<14);}
export function drawFactionMark(c,faction,x,y,size,angle=0){const im=image(faction==='central'?'cross':'roundel');if(!im?.naturalWidth)return;c.save();c.translate(x,y);c.rotate(angle);c.drawImage(im,-size/2,-size/2,size,size);c.restore();}
function atlas(c,index,x,y,w,h,angle=0,alpha=1){const im=image('atlas');if(!im?.naturalWidth)return;const r=WATER_RECTS[index];c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha*=alpha;c.drawImage(im,...r,-w/2,-h/2,w,h);c.restore();}
export function drawShipWater(c,b,width,height,point=(x,y)=>[x,y]){if(b.dead||b.destroying||b.moored||!(b.driveVelocity>1))return;const yaw=b.hullYaw??(b.a+Math.PI/2),[x,y]=point(b.x,b.y),speed=Math.min(1,b.driveVelocity/38),trail=b.wakeTrail||[],im=image('wake');
 // Trail stamps follow previous stern positions, so a turn leaves curved water.
 if(im?.naturalWidth&&trail.length>1)for(let i=trail.length-2;i>=0;i--){if(i%4)continue;const p=trail[i],q=trail[i+1],[px,py]=point(p.x,p.y),[qx,qy]=point(q.x,q.y),fade=Math.max(0,1-(b.waterTime-p.t)/14);if(Math.hypot(qx-px,qy-py)<1)continue;c.save();c.translate(px,py);c.rotate(Math.atan2(qy-py,qx-px)-Math.PI/2);c.globalAlpha*=fade*(.045+.025*speed);const w=width*(.65+(1-fade)*.55),h=Math.min(height*.7,w*3.2);c.drawImage(im,-w/2,0,w,h);c.restore();}
 c.save();c.translate(x,y);c.rotate(yaw);const frame=Math.floor((b.waterTime||0)*5)%3;const bw=width*1.65,bh=bw*.88;atlas(c,frame,0,-height*.50+bh*.49,bw,bh,0,.45+speed*.25);if(im?.naturalWidth){const w=width*.75,h=Math.min(height*.50,w*3);c.globalAlpha*=.35+speed*.20;c.drawImage(im,-w/2,height*.40,w,h);}c.restore();}
export function drawTorpedo(c,h){const a=Math.atan2(h.vy,h.vx)+Math.PI/2;c.save();c.translate(h.x,h.y);c.rotate(a);atlas(c,4+Math.floor((h.age||0)*8)%2,0,100,44,140,0,.65);atlas(c,3,0,0,20,64);c.restore();}
prepareNavalWater();

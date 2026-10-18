// Reuse the original Bruno train's rail steel and sleeper timber, in world space.
const steel=(c,image,x,y,h,side=0)=>{
 if(!image?.naturalWidth)return;
 const w=image.naturalWidth,ih=image.naturalHeight;
 c.drawImage(image,w*(side?.628:.352),ih*.957,w*.023,ih*.022,x-5,y,10,h);
};
const timber=(c,image,x,y,w=120,h=9)=>{
 if(!image?.naturalWidth)return;
 c.drawImage(image,image.naturalWidth*.385,image.naturalHeight*.969,image.naturalWidth*.075,image.naturalHeight*.003,x-w/2,y-h/2,w,h);
};
// Local-space y range covered by the canvas under the current transform (padded for AA spill).
function visibleLocalY(c){
 const cv=c.canvas,m=typeof c.getTransform==='function'?c.getTransform():null;
 if(!cv||!m||!(cv.width>0)||!(cv.height>0))return [-Infinity,Infinity];
 const inv=m.inverse();if(![inv.a,inv.b,inv.c,inv.d,inv.e,inv.f].every(Number.isFinite))return [-Infinity,Infinity];
 let lo=Infinity,hi=-Infinity;
 for(const [x,y] of [[0,0],[cv.width,0],[0,cv.height],[cv.width,cv.height]]){const ly=inv.b*x+inv.d*y+inv.f;if(ly<lo)lo=ly;if(ly>hi)hi=ly;}
 const pad=8*Math.max(1,Math.hypot(inv.b,inv.d));return [lo-pad,hi+pad];
}
export function drawRailTrack(c,boss,image){
 if(!boss.railTarget||boss.dead||!image?.naturalWidth)return;
 c.save();c.translate(boss.from.x,boss.from.y);c.rotate(Math.atan2(boss.axis.y,boss.axis.x)-Math.PI/2);c.imageSmoothingEnabled=true;
 const end=(boss.railTarget.x-boss.from.x)*boss.axis.x+(boss.railTarget.y-boss.from.y)*boss.axis.y,stop=end+1800;
 // The track spans ~3.6k world px but only a screen's worth is visible: skip pieces whose local
 // y-extent lies wholly outside the canvas (they rasterize nothing), ~500 drawImage calls/frame.
 const [vy0,vy1]=visibleLocalY(c);
 for(let y=-1800;y<stop;y+=19){if(boss.broken&&Math.abs(y-end)<27)continue;if(y+4.5<vy0||y-4.5>vy1)continue;timber(c,image,0,y);}
 for(let y=-1800;y<stop;y+=42){
  const h=Math.min(42,stop-y);if(y+h<vy0||y>vy1)continue;const segments=boss.broken?[[y,Math.min(y+h,end-22)],[Math.max(y,end+22),y+h]]:[[y,y+h]];
  for(const [a,b] of segments)if(b>a)for(const side of [0,1])steel(c,image,side?46:-46,a,b-a,side);
 }
 c.restore();
}
export function drawRailDamage(c,boss,image){
 const r=boss.railTarget;if(!r||boss.dead)return;
 c.save();c.translate(r.x,r.y);c.rotate(Math.atan2(boss.axis.y,boss.axis.x)-Math.PI/2);
 if(boss.broken){
  // Separate textured pieces leave an actual gap in the fixed track.
  for(const [x,y,a,side] of [[-45,-19,-.22,0],[46,9,.24,1],[-39,14,.35,0],[41,-21,-.3,1]]){
   c.save();c.translate(x,y);c.rotate(a);steel(c,image,0,0,22,side);c.restore();
  }
  for(const [x,y,a]of [[-26,-5,-.15],[30,7,.2]]){c.save();c.translate(x,y);c.rotate(a);timber(c,image,0,0,45,8);c.restore();}
 }else{
  c.strokeStyle=boss.hitFlash>0?'#fff0c4':'#bf9751';c.lineWidth=2;
  for(const x of [-65,65])for(const y of [-r.radius,r.radius]){c.beginPath();c.moveTo(x,y-Math.sign(y)*7);c.lineTo(x,y);c.lineTo(x-Math.sign(x)*7,y);c.stroke();}
  if(boss.railHp<boss.c.railHp){c.fillStyle='#262622';c.fillRect(-r.radius,r.radius+7,r.radius*2,3);c.fillStyle='#b29254';c.fillRect(-r.radius,r.radius+7,r.radius*2*boss.railHp/boss.c.railHp,3);}
 }
 c.restore();
}
export function gunRecoilOffset(boss){
 if(boss.phase!=='recoil')return 0;
 const t=boss.time/boss.c.recoilSeconds;
 return 8*Math.sin(Math.PI*Math.min(1,t))*Math.exp(-2*t);
}

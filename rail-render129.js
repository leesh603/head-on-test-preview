import {prepareRuralTrackArt,ruralTrackArtReady,drawRuralTrackTile,RURAL_TRACK_ART} from './rural-rail-track-art.js';
export {prepareRuralTrackArt};
// The carrier retains its existing art; stage 1 uses a registered track atlas.
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
 if(boss.ruralTrack){
  if(!boss.railTarget||!ruralTrackArtReady())return;
  const r=boss.artOrigin||boss.railTarget,h=RURAL_TRACK_ART.height*RURAL_TRACK_ART.scale;
  c.save();c.translate(r.x,r.y);c.rotate(Math.atan2(boss.axis.y,boss.axis.x)-Math.PI/2);c.imageSmoothingEnabled=true;
  const [lo,viewEnd]=visibleLocalY(c),trackEnd=Number.isFinite(boss.trackEndY)?boss.trackEndY-r.y:Infinity;
  const hi=Math.min(viewEnd,trackEnd);
  if(hi<=lo){c.restore();return;}
  if(trackEnd<viewEnd){
   const start=Number.isFinite(lo)?lo:trackEnd-3600;
   c.beginPath();c.rect(-160,start,320,trackEnd-start);c.clip();
  }
  const first=Math.floor(((Number.isFinite(lo)?lo:-1800)+h/2)/h),last=Math.ceil(((Number.isFinite(hi)?hi:1800)+h/2)/h);
  const state=boss.broken?2:boss.railHp<boss.c.railHp*.7?1:0,end=(boss.railTarget.x-r.x)*boss.axis.x+(boss.railTarget.y-r.y)*boss.axis.y;
  // Replace only the damaged section; its collision point need not snap to the texture's repeat.
  if(state){const low=Number.isFinite(lo)?lo:-1e7,high=Number.isFinite(hi)?hi:1e7,a=Math.max(low,Math.min(high,end-h/2)),b=Math.max(low,Math.min(high,end+h/2));c.save();c.beginPath();c.rect(-160,low,320,a-low);c.rect(-160,b,320,high-b);c.clip();}
  for(let n=first;n<last;n++)drawRuralTrackTile(c,0,n*h-h/2);
  if(state){c.restore();if(end+h/2>=lo&&end-h/2<=hi)drawRuralTrackTile(c,state,end-h/2);}
  c.restore();return;
 }
 if(!boss.railTarget||boss.dead||!image?.naturalWidth)return;
 const origin=boss.from;
 c.save();c.translate(origin.x,origin.y);c.rotate(Math.atan2(boss.axis.y,boss.axis.x)-Math.PI/2);c.imageSmoothingEnabled=true;
 const end=(boss.railTarget.x-origin.x)*boss.axis.x+(boss.railTarget.y-origin.y)*boss.axis.y,stop=end+1800;
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
 if(boss.broken&&!boss.ruralTrack){
  // Separate textured pieces leave an actual gap in the fixed track.
  for(const [x,y,a,side] of [[-45,-19,-.22,0],[46,9,.24,1],[-39,14,.35,0],[41,-21,-.3,1]]){
   c.save();c.translate(x,y);c.rotate(a);steel(c,image,0,0,22,side);c.restore();
  }
  for(const [x,y,a]of [[-26,-5,-.15],[30,7,.2]]){c.save();c.translate(x,y);c.rotate(a);timber(c,image,0,0,45,8);c.restore();}
 }else if(!boss.broken){
  c.strokeStyle=boss.hitFlash>0?'#fff0c4':'#bf9751';c.lineWidth=2;
  const halfWidth=boss.ruralTrack?r.radius+4:65;
  for(const x of [-halfWidth,halfWidth])for(const y of [-r.radius,r.radius]){c.beginPath();c.moveTo(x,y-Math.sign(y)*7);c.lineTo(x,y);c.lineTo(x-Math.sign(x)*7,y);c.stroke();}
  if(boss.railHp<boss.c.railHp){c.fillStyle='#262622';c.fillRect(-r.radius,r.radius+7,r.radius*2,3);c.fillStyle='#b29254';c.fillRect(-r.radius,r.radius+7,r.radius*2*boss.railHp/boss.c.railHp,3);}
 }
 c.restore();
}

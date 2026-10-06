// Sinking ships, seen from above. The hull settles and lists, floods stern-first under a moving
// waterline, darkens into the sea colour as it goes under, then slides away as a deep shadow.
// Fuel spreads on the surface, air boils up along the waterline, and a broken ring of foam marks
// where it went down. Water dressing: tools/fx-sample/sinkwater.py (ship-sinkwater.webp).
//
// The hull itself is painted opaque into an offscreen layer and the sea colour is laid over it
// with source-atop, so the deck never shows the sea through it; only the final deep phase fades.
export const FLEET_SINK_DURATION=5.2;
const clamp=v=>Math.max(0,Math.min(1,v));
const ease=q=>q*q*(3-2*q);
const hash=(a,b=0)=>{const s=Math.sin(a*127.1+b*311.7)*43758.5453;return s-Math.floor(s);};
const art={im:null,rects:null,loading:false};
export function prepareSinkingWater(){
 if(art.loading||typeof Image==='undefined'||typeof fetch!=='function')return;
 art.loading=true;
 fetch(new URL('./ship-sinkwater.json?v=sink2',import.meta.url)).then(r=>r.json()).then(m=>{
  const im=new Image();im.decoding='async';im.onload=()=>{art.im=im;art.rects=m.rects;};im.src=new URL('./ship-sinkwater.webp?v=sink2',import.meta.url).href;
 }).catch(()=>{art.loading=false;});
}
// settle → flood (stern first) → under → deep. progress is the flooded share of the hull (0..1).
export function sinkingPhase(age,duration=4.4){
 const life=Math.max(.1,duration),settle=Math.min(.55,life*.12),under=life*.72;
 const progress=ease(clamp((age-settle)/Math.max(.1,under-settle)));
 const deep=clamp((age-under)/Math.max(.05,life-under));
 return {progress,deep,list:ease(clamp(age/Math.max(.05,settle))),water:clamp(age/.18),tail:1-deep,done:age>=life};
}
function cell(c,key,x,y,w,h,alpha,angle=0){
 const r=art.rects?.[key];if(!r||!art.im||alpha<=.003||!(w>0)||!(h>0))return;
 c.save();c.translate(x,y);if(angle)c.rotate(angle);c.globalAlpha*=Math.min(1,alpha);c.imageSmoothingEnabled=true;
 c.drawImage(art.im,r[0],r[1],r[2],r[3],-w/2,-h/2,w,h);c.restore();
}
// Planform of a hull: full beam amidships, tapering to the bow and stern.
const beamAt=(u)=>Math.pow(Math.max(0,1-u*u),.42);
// The sinking hull is painted once into a layer in the ship's own frame (bow up, unrotated), so the
// layer is just the hull's footprint, and reused every frame; the flooding tint is redone only when
// the waterline has visibly moved. Resolution is capped: the hull is darkening, foreshortened and
// fading, and phones were filling 2k canvases several times a frame.
const MAX_LAYER=1024;
function canvas2d(w,h=w){
 if(typeof document==='undefined')return null;
 const cv=document.createElement('canvas');if(!cv?.getContext?.('2d'))return null;cv.width=w;cv.height=h;return cv;
}
const hullCache=new Map();
function cachedHull(key,{x,y,yaw,bx,by,q},drawHull,now){
 let e=hullCache.get(key);
 const lw=Math.max(8,Math.ceil(2*bx*q)),lh=Math.max(8,Math.ceil(2*by*q));
 if(!e||e.lh<lh*.7){
  const cv=canvas2d(lw,lh),tint=canvas2d(lw,lh);if(!cv||!tint)return null;
  const g=cv.getContext('2d');g.imageSmoothingEnabled=true;
  g.setTransform(q,0,0,q,lw/2,lh/2);g.rotate(-yaw);g.translate(-x,-y);
  drawHull(g);g.setTransform(1,0,0,1,0,0);
  e={cv,tint,lw,lh,q,tinted:null};hullCache.set(key,e);
 }
 e.used=now;
 if(hullCache.size>6)for(const [k,v] of hullCache)if(now-v.used>1000)hullCache.delete(k);
 return e;
}
function drawSurface(c,{x,y,yaw,w,h,age,phase,life}){
 const {progress,deep,list}=phase,fadeOut=1-clamp((age-life*.8)/(life*.2));
 c.save();c.translate(x,y);c.rotate(yaw);
 // Fuel slick spreading from the stern, then over the whole grave.
 const oilGrow=clamp(age/(life*.7));
 cell(c,'oil',0,h*(.32-.3*oilGrow),w*(1.2+2.0*oilGrow),h*(.3+.7*oilGrow),.55*clamp(age/.8)*fadeOut,hash(x,y)*6.28);
 if(progress<1){
  const f=h/2+h*.04-progress*h*1.1,u=Math.max(-1,Math.min(1,f/(h/2))),hw=w/2*beamAt(u);
  // Air boiling up just behind the waterline and along the submerged length.
  for(let i=0;i<4;i++){
   const yy=Math.min(h*.55,f+h*(.04+i*.11)),s=w*(.9+.25*i)*(.85+.15*Math.sin(age*2.3+i));
   cell(c,'boil',(hash(i,1)-.5)*w*.3,yy,s,s*1.15,.55*list*(1-i*.17),age*.25+i*1.7);
  }
 }
 if(progress>=1||deep>0){
  // The last bubbles and a broken ring of whitened water over the wreck.
  const r=deep,rr=w*(1.4+3.2*r)+h*.25*r;
  cell(c,'ripple',0,h*.05,rr*1.25,rr,(1-r)*.85,age*.08);
  cell(c,'boil',0,h*.05,w*(1.6+1.4*r),w*(1.7+1.4*r),(1-r)*.75,age*.3);
  for(let i=0;i<3;i++){const t=(age*1.3+i*.37)%1,s=w*(.25+.35*t);cell(c,'boil',(hash(i,3)-.5)*w*1.2,(hash(i,5)-.5)*h*.3,s,s,(1-t)*.6*(1-r),i);}
 }
 c.restore();
}
function drawWaterline(c,{x,y,yaw,w,h,age,phase}){
 const {progress,list}=phase;if(!(progress>0&&progress<1))return;
 const f=h/2+h*.04-progress*h*1.1,u=Math.max(-1,Math.min(1,f/(h/2))),hw=w/2*beamAt(u);
 c.save();c.translate(x,y);c.rotate(yaw);c.translate(w*.06*list,h*.03*progress);
 // Foam collar on the waterline across the hull, as wide as the hull is there (drawn over the deck).
 if(hw>w*.04){
  for(let i=0;i<3;i++){const jx=(i-1)*hw*.5,jy=Math.sin(age*3.1+i*2)*w*.03;
   cell(c,'lace',jx,f+jy,hw*(2.1-i*.3),w*(.42+.06*i),.95-i*.15,(hash(i,7)-.5)*.25);}
  // Spray where the hull shoulders the water.
  for(const side of [-1,1])cell(c,'lace',side*hw*1.1,f+h*.03,w*.7,w*.38,.75*list,side*1.15);
 }
 c.restore();
}
export function drawSinkingShip(c,pose,drawHull){
 const {x,y,yaw=0,width:w,height:h,age=0,duration=4.4}=pose,phase=sinkingPhase(age,duration);
 if(phase.done)return;
 prepareSinkingWater();
 const {progress,deep,list}=phase,life=Math.max(.1,duration);
 drawSurface(c,{x,y,yaw,w,h,age,phase,life});
 if(deep>=1||!drawHull)return;
 const m=typeof c.getTransform==='function'?c.getTransform():null,k=m?Math.max(.25,Math.hypot(m.a,m.b)):1;
 // Layer box around the hull, generous for boss art wider than the given beam.
 const bx=w*1.15,by=h*.8,q=Math.min(k,MAX_LAYER/(2*by)),now=typeof performance!=='undefined'?performance.now():Date.now();
 // Callers pass the sinking ship object as key; otherwise the ship is identified by where it went down.
 const key=pose.key||`${Math.round(x/8)}|${Math.round(y/8)}|${Math.round(w)}|${Math.round(h)}|${yaw.toFixed(2)}`;
 const hull=cachedHull(key,{x,y,yaw,bx,by,q},drawHull,now);
 c.save();c.globalAlpha=1;c.globalCompositeOperation='source-over';
 if(hull){
  const {lw,lh,q:hq,tint:L}=hull,last=hull.tinted;
  if(!last||Math.abs(last.progress-progress)>.012||Math.abs(last.deep-deep)>.02||Math.abs(last.list-list)>.04){
   hull.tinted={progress,deep,list};
   const g=L.getContext('2d');
   g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.globalCompositeOperation='copy';g.drawImage(hull.cv,0,0);
   // Sea colour over the flooded part, following the hull's own pixels (source-atop).
   g.setTransform(hq,0,0,hq,lw/2,lh/2);g.globalCompositeOperation='source-atop';
   g.fillStyle=`rgba(24,16,10,${(.22*list).toFixed(3)})`;g.fillRect(-bx,-by,2*bx,2*by);
   const f=h/2+h*.04-progress*h*1.1,grad=g.createLinearGradient(0,f-h*.015,0,f+h*.55);
   grad.addColorStop(0,'rgba(22,84,94,0)');grad.addColorStop(.05,'rgba(22,84,94,.5)');grad.addColorStop(.32,'rgba(16,68,78,.84)');grad.addColorStop(1,'rgba(10,50,60,.96)');
   g.fillStyle=grad;g.fillRect(-bx,-by,2*bx,2*by);
   if(deep>0){g.fillStyle=`rgba(10,50,60,${(.96*deep).toFixed(3)})`;g.fillRect(-bx,-by,2*bx,2*by);}
   // Under the surface the hull reads as a shadow: let the sea's own texture show over it, more with depth.
   const thin=g.createLinearGradient(0,f,0,f+h*.6);thin.addColorStop(0,'rgba(0,0,0,0)');thin.addColorStop(.25,'rgba(0,0,0,.32)');thin.addColorStop(1,'rgba(0,0,0,.5)');
   g.globalCompositeOperation='destination-out';g.fillStyle=thin;g.fillRect(-bx,-by,2*bx,2*by);
   g.globalCompositeOperation='source-over';g.setTransform(1,0,0,1,0,0);
  }
  // Settle and list, pitch stern-down (foreshortened), then slide away into the deep.
  c.translate(x,y);c.rotate(yaw);c.translate(w*.06*list,h*.03*progress);
  c.scale(1-.05*list-.08*deep,1-.07*progress-.12*deep);
  c.globalAlpha=Math.pow(1-deep,1.4);c.imageSmoothingEnabled=true;
  c.drawImage(L,0,0,lw,lh,-bx,-by,2*bx,2*by);
 }else{
  drawHull(c);
 }
 c.restore();
 drawWaterline(c,{x,y,yaw,w,h,age,phase});
}

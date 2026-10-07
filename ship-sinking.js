// Sinking ships, seen from above. The hull settles and lists, floods stern-first under a moving
// foam waterline, the flooded part turns into a sea-tinted shadow, then it slides away into the
// deep. Fuel spreads on the surface, air boils up behind the waterline, and a broken ring of foam
// marks where it went down. Water dressing: tools/fx-sample/sinkwater.py (ship-sinkwater.webp).
//
// Kept cheap for phones: each sinking hull is painted only once, into two small cached layers in the
// ship's own frame (dry, and sea-tinted "under water"). Every frame just draws those two layers,
// split at the waterline by a rectangle clip, plus a handful of water sprites.
export const FLEET_SINK_DURATION=3.8;
const clamp=v=>Math.max(0,Math.min(1,v));
const ease=q=>q*q*(3-2*q);
const hash=(a,b=0)=>{const s=Math.sin(a*127.1+b*311.7)*43758.5453;return s-Math.floor(s);};
const art={im:null,rects:null,loading:false};
export function prepareSinkingWater(){
 if(art.loading||typeof Image==='undefined'||typeof fetch!=='function')return;
 art.loading=true;
 fetch(new URL('./ship-sinkwater.json?v=perf5',import.meta.url)).then(r=>r.json()).then(m=>{
  const im=new Image();im.decoding='async';im.onload=()=>{art.im=im;art.rects=m.rects;};im.src=new URL('./ship-sinkwater.webp?v=perf5',import.meta.url).href;
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
// Layers are capped: the hull is darkening, foreshortened and fading while it sinks.
const MAX_LAYER=640;
function canvas2d(w,h){
 if(typeof document==='undefined')return null;
 const cv=document.createElement('canvas');if(!cv?.getContext?.('2d'))return null;cv.width=w;cv.height=h;return cv;
}
const hullCache=new Map();
function cachedHull(key,{x,y,yaw,bx,by,q},drawHull,now){
 let e=hullCache.get(key);
 if(!e){
  const lw=Math.max(8,Math.ceil(2*bx*q)),lh=Math.max(8,Math.ceil(2*by*q));
  const dry=canvas2d(lw,lh),wet=canvas2d(lw,lh);if(!dry||!wet)return null;
  const g=dry.getContext('2d');g.imageSmoothingEnabled=true;
  g.setTransform(q,0,0,q,lw/2,lh/2);g.rotate(-yaw);g.translate(-x,-y);drawHull(g);
  // Burnt and listing: a little darker than the living ship.
  g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-atop';g.fillStyle='rgba(24,16,10,.22)';g.fillRect(0,0,lw,lh);
  // Under water: the same hull in the sea's colour, thinned so the sea texture shows through.
  const u=wet.getContext('2d');u.drawImage(dry,0,0);u.globalCompositeOperation='source-atop';u.fillStyle='rgba(14,62,72,.88)';u.fillRect(0,0,lw,lh);
  u.globalCompositeOperation='destination-out';u.fillStyle='rgba(0,0,0,.4)';u.fillRect(0,0,lw,lh);
  g.globalCompositeOperation=u.globalCompositeOperation='source-over';
  e={dry,wet,lw,lh};hullCache.set(key,e);
 }
 e.used=now;
 if(hullCache.size>6)for(const [k,v] of hullCache)if(now-v.used>1000)hullCache.delete(k);
 return e;
}
function drawSurface(c,{x,y,yaw,w,h,age,phase,life}){
 const {progress,deep,list}=phase,fadeOut=1-clamp((age-life*.8)/(life*.2));
 c.save();c.translate(x,y);c.rotate(yaw);
 // Fuel slick spreading from the stern over the grave.
 const oilGrow=clamp(age/(life*.7));
 cell(c,'oil',0,h*(.3-.25*oilGrow),w*(1.1+1.1*oilGrow),h*(.28+.5*oilGrow),.6*clamp(age/.8)*fadeOut,(hash(x,y)-.5)*.6);
 if(progress<1){
  // Air boiling up just behind the waterline.
  const f=h/2+h*.04-progress*h*1.1;
  for(let i=0;i<2;i++){const s=w*(1.05+.4*i)*(.85+.15*Math.sin(age*2.3+i));
   cell(c,'boil',(hash(i,1)-.5)*w*.3,Math.min(h*.55,f+h*(.06+i*.16)),s,s*1.15,.6*list*(1-i*.25),age*.25+i*1.7);}
 }else{
  // A broken ring of whitened water over the wreck.
  const r=deep,rr=w*(1.4+2.2*r)+h*.15*r;
  cell(c,'ripple',0,h*.05,rr*1.25,rr,(1-r)*.85,age*.08);
  cell(c,'boil',0,h*.05,w*(1.6+1.4*r),w*(1.7+1.4*r),(1-r)*.75,age*.3);
 }
 c.restore();
}
function drawWaterline(c,{x,y,yaw,w,h,age,phase}){
 const {progress,list}=phase;if(!(progress>0&&progress<1))return;
 const f=h/2+h*.04-progress*h*1.1,u=Math.max(-1,Math.min(1,f/(h/2))),hw=w/2*beamAt(u);
 if(hw<=w*.04)return;
 c.save();c.translate(x,y);c.rotate(yaw);c.translate(w*.06*list,h*.03*progress);
 // Foam collar across the hull at the waterline (drawn over the deck), and a wider wash around it.
 cell(c,'lace',0,f+Math.sin(age*3.1)*w*.03,hw*2.3,w*.46,.95,(hash(x,7)-.5)*.2);
 cell(c,'lace',0,f+h*.03,hw*2+w*1.2,w*.5,.55*list,0);
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
 // Layer box around the hull (generous for boss art wider than the given beam; the wake is left out).
 const bx=w*1.15,by=h*.62,q=Math.min(k,MAX_LAYER/(2*by)),now=typeof performance!=='undefined'?performance.now():Date.now();
 // Callers pass the sinking ship object as key; otherwise the ship is identified by where it went down.
 const key=pose.key||`${Math.round(x/8)}|${Math.round(y/8)}|${Math.round(w)}|${Math.round(h)}|${yaw.toFixed(2)}`;
 const hull=cachedHull(key,{x,y,yaw,bx,by,q},drawHull,now);
 c.save();c.globalAlpha=1;c.globalCompositeOperation='source-over';
 if(hull){
  const {dry,wet,lw,lh}=hull,f=Math.max(-by,Math.min(by,h/2+h*.04-progress*h*1.1));
  // Settle and list, pitch stern-down (foreshortened), then slide away into the deep.
  c.translate(x,y);c.rotate(yaw);c.translate(w*.06*list,h*.03*progress);
  c.scale(1-.05*list-.08*deep,1-.07*progress-.12*deep);
  c.globalAlpha=Math.pow(1-deep,1.4);c.imageSmoothingEnabled=true;
  // Dry part above the waterline, sea-tinted part below it: two cached layers, one clip each.
  const v=(f+by)/(2*by);
  if(v>.002)c.drawImage(dry,0,0,lw,Math.max(1,lh*v),-bx,-by,2*bx,2*by*v);
  if(v<.998)c.drawImage(wet,0,lh*v,lw,Math.max(1,lh*(1-v)),-bx,f,2*bx,2*by*(1-v));
 }else{
  drawHull(c);
 }
 c.restore();
 drawWaterline(c,{x,y,yaw,w,h,age,phase});
}

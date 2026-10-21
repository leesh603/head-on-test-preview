import {fx,fxImage} from './fx-art.js?v=tame3';

// Physics owns one pooled beam. Rendering samples it into a small fixed atlas
// budget instead of allocating hundreds of particles or runtime canvases.
const PC_STREAM_SEGMENTS=8,MOBILE_STREAM_SEGMENTS=6;
const PC_TONGUES=5,MOBILE_TONGUES=3;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),clamp01=v=>clamp(v,0,1);
const curvePoint={x:0,y:0,a:0};

function fallbackJet(c,p,w,h,alpha,phase){
 // Asset rollback/load failure still needs a readable damaging stream. This
 // stays bounded to the same segment count and matches the collision width.
 c.save();c.translate(p.x,p.y);c.rotate(p.a);c.globalAlpha*=alpha;
 c.fillStyle='#b84b18';c.beginPath();c.moveTo(-w*.52,0);
 c.bezierCurveTo(-w*.34,-h*.42,-w*.12,-h*.5,0,-h*.5);
 c.bezierCurveTo(w*.2,-h*(.48+.02*Math.sin(phase)),w*.4,-h*.3,w*.52,0);
 c.bezierCurveTo(w*.38,h*.3,w*.18,h*(.48+.02*Math.cos(phase)),0,h*.5);
 c.bezierCurveTo(-w*.14,h*.5,-w*.36,h*.4,-w*.52,0);c.closePath();c.fill();
 c.globalAlpha*=.82;c.fillStyle='#f3c56b';c.beginPath();c.moveTo(-w*.45,0);
 c.bezierCurveTo(-w*.18,-h*.22,w*.16,-h*.14,w*.43,0);
 c.bezierCurveTo(w*.14,h*.13,-w*.2,h*.2,-w*.45,0);c.closePath();c.fill();c.restore();
}
function drawJet(c,p,w,h,alpha,phase){
 const img=fxImage('flameJet');
 if(!img?.naturalWidth){fallbackJet(c,p,w,h,alpha,phase);return false;}
 c.save();c.translate(p.x,p.y);c.rotate(p.a);c.globalAlpha*=alpha;c.drawImage(img,-w/2,-h/2,w,h);c.restore();return true;
}

// Collision and drawing share the same travelling front and trailing cutoff.
export function livensFlameSpan(h,length=h.length){
 const t=Math.max(0,h.age-(h.delay||0)-(h.warning||0)),travel=.28;
 return {t,front:Math.min(length,t*length/travel),tail:Math.max(0,(t-(h.duration-travel))*length/travel)};
}
export function livensFlameHalfWidth(h,along,span=livensFlameSpan(h),length=h.length){
 if(along<span.tail||along>span.front)return 0;
 const q=Math.max(0,along/Math.max(1,length));
 return h.thickness*(.5+2.1*q)*clamp01(Math.min((span.front-along)/45,(along-span.tail)/14));
}
export function livensFlameSegmentCount(h,mobile=false){
 const {front,tail}=livensFlameSpan(h),cap=mobile?MOBILE_STREAM_SEGMENTS:PC_STREAM_SEGMENTS;
 return front<=tail?0:Math.max(1,Math.min(cap,Math.ceil((front-tail)/66)));
}
export function livensFlameVisualAngle(h,q){
 // Far fuel retains a bounded amount of its previous heading during a sweep.
 const bend=-clamp((h.angularSpeed||0)*.22,-.12,.12);
 return h.angle+bend*clamp01(q);
}
function curvedPoint(h,d){
 const L=Math.max(1,h.length),bend=-clamp((h.angularSpeed||0)*.22,-.12,.12),k=bend/L;
 if(Math.abs(k)<1e-5){curvePoint.x=h.x+Math.cos(h.angle)*d;curvePoint.y=h.y+Math.sin(h.angle)*d;curvePoint.a=h.angle;return curvePoint;}
 const a=h.angle+k*d;
 curvePoint.x=h.x+(Math.sin(a)-Math.sin(h.angle))/k;curvePoint.y=h.y+(Math.cos(h.angle)-Math.cos(a))/k;curvePoint.a=a;return curvePoint;
}
export function drawLivensFlame(c,h,{mobile=false}={}){
 const flameSpan=livensFlameSpan(h),{t,front,tail}=flameSpan,span=front-tail;if(span<=0)return;
 const count=livensFlameSegmentCount(h,mobile),step=span/count;
 c.save();c.globalCompositeOperation='source-over';

 // Narrow white-hot muzzle, overlapping widening body, and no exposed seams.
 for(let i=0;i<count;i++){
  const d=tail+(i+.5)*step,p=curvedPoint(h,d),half=livensFlameHalfWidth(h,d,flameSpan,h.length);
  const width=Math.max(58,step*2.05),height=Math.max(24,half*2),alpha=.76+.16*Math.sin(t*11+i*2.3);
  drawJet(c,p,width,height,alpha,t*9+i*1.7);
 }

 // The broad end breaks into a few authored tongues instead of a rigid cone.
 const tongueCount=mobile?MOBILE_TONGUES:PC_TONGUES;
 for(let i=0;i<tongueCount;i++){
  const u=tongueCount===1?1:i/(tongueCount-1),d=tail+span*(.54+u*.43),p=curvedPoint(h,d);
  const half=Math.max(18,livensFlameHalfWidth(h,d,flameSpan,h.length)),side=i%2?1:-1;
  const offset=side*half*(.28+.34*u),key='flameTongue'+(1+i%3),a=p.a+side*(.08+.08*u);
  fx(c,key,p.x-Math.sin(p.a)*offset,p.y+Math.cos(p.a)*offset,Math.max(40,step*1.35),Math.max(42,half*(.72+.24*u)),a,.82);
 }

 // Fixed flash/smoke budget: 16 atlas draws on PC, 11 on mobile at maximum.
 const muzzle=curvedPoint(h,Math.max(tail,Math.min(front,16)));
 fx(c,'fireFlash',muzzle.x,muzzle.y,mobile?28:34,mobile?28:34,muzzle.a,.9);
 const smokeCount=mobile?1:2;
 for(let i=0;i<smokeCount;i++){
  const p=curvedPoint(h,Math.max(tail,front-18-i*24)),side=i?1:-1,size=mobile?48:58;
  fx(c,'smokeTrail',p.x-Math.sin(p.a)*side*10,p.y+Math.cos(p.a)*side*10,size,size*.55,p.a,.18);
 }
 c.restore();
}

// One drawing language for every in-game telegraph: inked strokes (a dark
// under-stroke keeps them readable on dirt, sea, cloud and night), a bone
// colour for ordinary danger, oxide red for heavy rounds and a muted green for
// safe lanes. Impact zones close four arc brackets onto the exact hit radius;
// weak points get square corner brackets; aim lines are dashed with a chevron.
const TAU=Math.PI*2;
export const MARK={warn:'#ecd39c',heavy:'#df5a40',blind:'#b9bea6',safe:'#a8d6c4',water:'#b5dcd6',ink:'rgba(20,14,10,.58)'};
const clamp01=v=>Math.max(0,Math.min(1,Number.isFinite(v)?v:0));
function inked(c,width,color,path){c.lineCap='round';c.lineJoin='round';c.strokeStyle=MARK.ink;c.lineWidth=width+2.2;path();c.stroke();c.strokeStyle=color;c.lineWidth=width;path();c.stroke();}
const toneColor=(tone,heavy)=>heavy?MARK.heavy:MARK[tone]||tone||MARK.warn;

// Pre-impact zone. p = warning progress 0..1 (brackets close onto r at 1).
export function impactMark(c,x,y,r,p=0,{heavy=false,tone='warn',alpha=1,cross=true,fill=true}={}){
 if(!(r>0))return;p=clamp01(p);const col=toneColor(tone,heavy);
 c.save();c.setLineDash([]);c.globalAlpha*=alpha;
 if(fill){c.fillStyle=`rgba(22,12,6,${.08+.2*p})`;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}
 const rr=r*(1.28-.28*p),span=Math.min(.42,22/Math.max(1,rr)+.22),tick=Math.min(r*.14,12);
 for(let i=0;i<4;i++){const m=i*Math.PI/2+Math.PI/4;
  inked(c,heavy?3:2.4,col,()=>{c.beginPath();c.arc(x,y,rr,m-span,m+span);});
  inked(c,1.6,col,()=>{c.beginPath();c.moveTo(x+Math.cos(m)*rr,y+Math.sin(m)*rr);c.lineTo(x+Math.cos(m)*(rr-tick),y+Math.sin(m)*(rr-tick));});}
 c.globalAlpha*=.55;c.setLineDash([3,7]);inked(c,1,col,()=>{c.beginPath();c.arc(x,y,r,0,TAU);});c.setLineDash([]);c.globalAlpha/=.55;
 if(heavy){c.globalAlpha*=.8;inked(c,1.2,col,()=>{c.beginPath();c.arc(x,y,r*.5,0,TAU);});c.globalAlpha/=.8;}
 if(cross){const s=Math.min(7,r*.25);inked(c,1.5,col,()=>{c.beginPath();c.moveTo(x-s,y);c.lineTo(x+s,y);c.moveTo(x,y-s);c.lineTo(x,y+s);});}
 c.restore();
}
// Expanding shock / sand ring: the danger is the band between inner and outer.
export function bandMark(c,x,y,inner,outer,p=0,{heavy=false,tone='warn'}={}){
 const col=toneColor(tone,heavy);c.save();c.setLineDash([]);
 c.fillStyle=`rgba(22,12,6,${.06+.12*clamp01(p)})`;c.beginPath();c.arc(x,y,outer,0,TAU);if(inner>0)c.arc(x,y,inner,0,TAU,true);c.fill('evenodd');
 c.setLineDash([3,7]);c.globalAlpha*=.6;if(inner>0)inked(c,1,col,()=>{c.beginPath();c.arc(x,y,inner,0,TAU);});c.globalAlpha/=.6;c.setLineDash([]);
 c.restore();impactMark(c,x,y,outer,p,{heavy,tone,fill:false,cross:false});
}
// Weak point / hittable part: four square corner brackets (no ring).
export function partMark(c,x,y,rx,ry=rx,{color='#e8cf98',alpha=1,hp=null,brackets=true}={}){
 if(!(rx>0))return;c.save();c.setLineDash([]);c.globalAlpha*=alpha;const lx=Math.max(5,rx*.38),ly=Math.max(5,ry*.38);
if(brackets)for(const sx of [-1,1])for(const sy of [-1,1])inked(c,1.6,color,()=>{c.beginPath();c.moveTo(x+sx*rx,y+sy*(ry-ly));c.lineTo(x+sx*rx,y+sy*ry);c.lineTo(x+sx*(rx-lx),y+sy*ry);});
 if(hp!=null){const w=rx*1.6,top=y+ry+5;c.fillStyle='rgba(20,14,10,.75)';c.fillRect(x-w/2-1,top-1,w+2,6);c.fillStyle='#3a2a20';c.fillRect(x-w/2,top,w,4);c.fillStyle='#efb96f';c.fillRect(x-w/2,top,w*clamp01(hp),4);}
 c.restore();
}
// Shield: dim dashed arcs with gaps, reads "protected" without a neon halo.
export function shieldMark(c,x,y,r,{alpha=.7}={}){
 c.save();c.globalAlpha*=alpha;c.setLineDash([2,6]);inked(c,1.2,'#bfd6da',()=>{c.beginPath();c.arc(x,y,r,0,TAU);});c.setLineDash([]);
 for(let i=0;i<4;i++){const m=i*Math.PI/2;inked(c,2,'#bfd6da',()=>{c.beginPath();c.arc(x,y,r,m-.18,m+.18);});}c.restore();
}
// Aim / bearing line with a chevron at the far end. p (optional) fills a
// solid head along the line as the warning runs out.
export function aimLine(c,x1,y1,x2,y2,{p=null,heavy=false,tone='warn',alpha=1,dash=[8,7],chevron=true}={}){
 const col=toneColor(tone,heavy),a=Math.atan2(y2-y1,x2-x1),len=Math.hypot(x2-x1,y2-y1);if(!(len>1))return;
 c.save();c.globalAlpha*=alpha;c.setLineDash(dash);inked(c,heavy?2.2:1.6,col,()=>{c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);});c.setLineDash([]);
 if(p!=null){const q=clamp01(p);inked(c,2.4,col,()=>{c.beginPath();c.moveTo(x1,y1);c.lineTo(x1+Math.cos(a)*len*q,y1+Math.sin(a)*len*q);});}
 if(chevron){const s=heavy?10:8;inked(c,1.8,col,()=>{c.beginPath();c.moveTo(x2-Math.cos(a-.5)*s,y2-Math.sin(a-.5)*s);c.lineTo(x2,y2);c.lineTo(x2-Math.cos(a+.5)*s,y2-Math.sin(a+.5)*s);});}
 c.restore();
}
// Lane edge (safe corridor or danger strip edge).
export function laneEdge(c,x1,y1,x2,y2,{safe=true,alpha=1}={}){c.save();c.globalAlpha*=alpha;c.setLineDash([10,8]);inked(c,1.5,safe?MARK.safe:MARK.warn,()=>{c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);});c.setLineDash([]);c.restore();}
// Danger strip (rect) with progress fill along its length.
export function stripMark(c,x,y,w,h,p=0,{angle=0,safe=false,heavy=false}={}){
 const col=safe?MARK.safe:toneColor('warn',heavy);c.save();c.translate(x,y);c.rotate(angle);c.setLineDash([]);
 c.fillStyle=safe?'rgba(120,190,170,.08)':`rgba(22,12,6,${.08+.16*clamp01(p)})`;c.fillRect(-w/2,-h/2,w,h);
 const l=Math.min(w,h)*.3;for(const sx of [-1,1])for(const sy of [-1,1])inked(c,2,col,()=>{c.beginPath();c.moveTo(sx*w/2,sy*(h/2-l));c.lineTo(sx*w/2,sy*h/2);c.lineTo(sx*(w/2-l),sy*h/2);});
 if(!safe&&p>0){c.globalAlpha*=.7;inked(c,2,col,()=>{c.beginPath();c.moveTo(-w/2,h/2+5);c.lineTo(-w/2+w*clamp01(p),h/2+5);});}
 c.restore();
}
// Cone / sector warning (flame, searchlight sweep).
export function sectorMark(c,x,y,r,a0,a1,p=0,{heavy=false}={}){
 const col=toneColor('warn',heavy);c.save();c.setLineDash([]);c.fillStyle=`rgba(22,12,6,${.06+.14*clamp01(p)})`;c.beginPath();c.moveTo(x,y);c.arc(x,y,r,a0,a1);c.closePath();c.fill();
 c.setLineDash([8,7]);inked(c,1.5,col,()=>{c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(a0)*r,y+Math.sin(a0)*r);c.moveTo(x,y);c.lineTo(x+Math.cos(a1)*r,y+Math.sin(a1)*r);});c.setLineDash([]);
 const rr=r*(.35+.65*clamp01(p));inked(c,2.2,col,()=>{c.beginPath();c.arc(x,y,rr,a0,a1);});c.restore();
}
// Lock-on reticle (searchlight lock, ears lock): corner brackets plus a progress arc.
export function lockMark(c,x,y,r,p=0){partMark(c,x,y,r,r,{color:MARK.warn});if(p>0){c.save();c.setLineDash([]);inked(c,2,MARK.warn,()=>{c.beginPath();c.arc(x,y,r*.7,-Math.PI/2,-Math.PI/2+TAU*clamp01(p));});c.restore();}}
// Swept path (crane load, turret traverse): a dashed inked arc with end ticks.
export function arcMark(c,x,y,r,a0,a1,{alpha=1}={}){
 c.save();c.globalAlpha*=alpha;c.setLineDash([6,7]);inked(c,1.5,MARK.warn,()=>{c.beginPath();c.arc(x,y,r,a0,a1);});c.setLineDash([]);
 for(const a of [a0,a1])inked(c,2,MARK.warn,()=>{c.beginPath();c.moveTo(x+Math.cos(a)*(r-9),y+Math.sin(a)*(r-9));c.lineTo(x+Math.cos(a)*(r+9),y+Math.sin(a)*(r+9));});c.restore();
}

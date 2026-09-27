import {fxImage} from './fx-art.js?v=340';

// Collision and drawing share the same travelling front and trailing cutoff.
// Keep this function allocation-free: it runs for rendering and every hazard hit test.
export function livensFlameSpan(h,length=h.length){
 const t=Math.max(0,h.age-(h.delay||0)-(h.warning||0)),travel=.28;
 return {t,front:Math.min(length,t*length/travel),tail:Math.max(0,(t-(h.duration-travel))*length/travel)};
}

const clamp01=n=>Math.max(0,Math.min(1,n));
export function livensFlameHalfWidth(h,along,span=livensFlameSpan(h),length=h.length){
 if(along<span.tail||along>span.front)return 0;
 const q=Math.max(0,along/Math.max(1,length));
 return h.thickness*(.5+2.1*q)*clamp01(Math.min((span.front-along)/45,(along-span.tail)/14));
}
function flameSilhouette(c,start,end,height,t,scale,color){
 const steps=14,len=end-start;c.beginPath();
 for(let i=0;i<=steps;i++){const q=i/steps,x=start+len*q,edge=Math.sin(q*Math.PI),w=height*scale*edge*(.82+.12*Math.sin(t*9+i*2.17)+.06*Math.sin(t*15-i*.83));c.lineTo(x,-w);}
 for(let i=steps;i>=0;i--){const q=i/steps,x=start+len*q,edge=Math.sin(q*Math.PI),w=height*scale*edge*(.84+.11*Math.sin(t*8+i*1.71)+.05*Math.sin(t*13+i*.69));c.lineTo(x,w);}
 c.closePath();c.fillStyle=color;c.fill();
}

// One authored jet plus a tiny bounded fallback replaces the former thousands of
// per-frame rectangles. The sprite keeps a continuous bright core and ragged edge;
// scaling only the live span makes both arrival and withdrawal read as flowing fuel.
export function drawLivensFlame(c,h){
 const {t,front,tail}=livensFlameSpan(h),span=front-tail;if(!(span>0))return;
 const alpha=clamp01(span/72),jet=fxImage('flameJet'),samples=16;
 let maxHalf=1;for(let i=0;i<=samples;i++)maxHalf=Math.max(maxHalf,livensFlameHalfWidth(h,tail+span*i/samples,{front,tail}));
 const height=maxHalf*2.08;
 c.save();c.translate(h.x,h.y);c.rotate(h.angle);c.globalAlpha*=alpha;
 // This ragged outer fuel fringe uses the exact collision profile. It keeps the
 // damage edge visible even where the authored bright jet is naturally narrower.
 const edgeXs=[];for(let i=0;i<=samples;i++)edgeXs.push(tail+span*i/samples);
 // Preserve both taper corners, plus the point where they cross on short spans.
 edgeXs.push(Math.min(front,tail+14),Math.max(tail,front-45),tail+span*14/59);edgeXs.sort((a,b)=>a-b);
 const profile=edgeXs.filter((x,i)=>!i||x-edgeXs[i-1]>.01);
 c.beginPath();for(const x of profile)c.lineTo(x,-livensFlameHalfWidth(h,x,{front,tail}));
 for(let i=profile.length-1;i>=0;i--){const x=profile[i];c.lineTo(x,livensFlameHalfWidth(h,x,{front,tail}));}
 c.closePath();c.globalAlpha*=.74;c.fillStyle='#8b3515';c.fill();c.globalAlpha/=.74;
 if(jet?.naturalWidth){
  const breathe=1+.025*Math.sin(t*13),drawH=height*breathe;
  c.imageSmoothingEnabled=true;c.drawImage(jet,tail,-drawH/2,span,drawH);
  // A low-alpha offset pass supplies motion without spawning particles or canvases.
  c.globalCompositeOperation='screen';c.globalAlpha*=.14;
  c.drawImage(jet,tail-span*.008,-drawH*.47,span*(1.012+.008*Math.sin(t*17)),drawH*.94);
 }else{
  flameSilhouette(c,tail,front,height*.5,t,1,'#843313');
  flameSilhouette(c,tail,front,height*.43,t+.17,.78,'#e26319');
  flameSilhouette(c,tail,front,height*.3,t+.31,.48,'#ffd36b');
 }
 // A small fixed ember budget preserves speed cues around the flame edge.
 c.globalCompositeOperation='source-over';
 const embers=(c.canvas?.width||999)<900?6:10;
 for(let i=0;i<embers;i++){
  const p=(i*.618+t*(.48+i*.013))%1,x=tail+span*p;
  const edge=Math.sin(p*Math.PI),side=i%2?1:-1,y=side*height*(.24+.18*((i*7)%5)/4)*edge+Math.sin(t*8+i*2.3)*5;
  c.globalAlpha=alpha*(.35+.45*Math.sin(p*Math.PI));c.fillStyle=i%3?'#e87724':'#ffe19a';c.fillRect(x,y,2+(i%2),2);
 }
 c.restore();
}

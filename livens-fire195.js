// Continuous advected fuel stream in the existing battlefield fire palette.
// Both collision and drawing share the travelling front and trailing cutoff.
export function livensFlameSpan(h){
 const t=Math.max(0,h.age-(h.delay||0)-(h.warning||0)),travel=.28;
 return {t,front:Math.min(h.length,t*h.length/travel),tail:Math.max(0,(t-(h.duration-travel))*h.length/travel)};
}
export function drawLivensFlame(c,h){
 const {t,front,tail}=livensFlameSpan(h);if(front<=tail)return;
 c.save();c.translate(h.x,h.y);c.rotate(h.angle);c.setLineDash([]);
 const speed=h.length/.28;
 const turbulence=(x,seed)=>Math.sin((x-t*speed)*.071+seed)*.45+Math.sin((x-t*speed)*.137+seed*2.7)*.2+Math.sin((x-t*speed)*.029+seed)*.35;
 // Each layer is one uninterrupted contour. Advection changes its silhouette,
 // rather than moving repeated flame pictures or spawning a row of fireballs.
 const ribbon=(scale,colors,seed)=>{
  const glow=c.createLinearGradient(tail,0,Math.max(tail+1,front),0);
  colors.forEach(([offset,color])=>glow.addColorStop(offset,color));c.fillStyle=glow;
  c.beginPath();
  for(const side of [-1,1]){
   const count=Math.max(2,Math.ceil((front-tail)/5));
   for(let j=0;j<=count;j++){
    const x=side<0?tail+(front-tail)*j/count:front-(front-tail)*j/count,q=x/h.length;
    const end=Math.min(1,(front-x)/45,(x-tail)/12),width=h.thickness*(.08+.42*Math.sqrt(q))*scale*Math.max(0,end);
    const y=side*width*(.78+.22*turbulence(x,seed+side))+Math.sin((x-t*speed*.8)*.035)*width*.12;
    if(side<0&&j===0)c.moveTo(x,y);else c.lineTo(x,y);
   }
  }
  c.closePath();c.fill();
 };
 ribbon(1.18,[[0,'#c7753780'],[.5,'#c77537cf'],[.86,'#a6573080'],[1,'#a6573000']],1);
 ribbon(.92,[[0,'#f5d38b'],[.18,'#efbd6b'],[.65,'#e3a34de8'],[1,'#c7753700']],3);
 ribbon(.44,[[0,'#fff0c3'],[.2,'#f5d38bf0'],[.58,'#edb45c90'],[1,'#e3a34d00']],5);
 // Sparse cooling flecks drift with the same flow, matching battlefield embers.
 for(let i=0;i<12;i++){
  const q=(t*2.1+i*.0833)%1,x=q*h.length;if(x<tail||x>front)continue;
  const y=Math.sin(i*2.399)*h.thickness*(.2+q*.35);
  c.globalAlpha=Math.sin(q*Math.PI)*.5;c.fillStyle=i%3?'#d3934f':'#f5d38b';c.fillRect(x,y,3+q*4,1.5);
 }
 c.restore();
}

// Dense roaring fuel stream in the battlefield fire palette: a bright core
// wrapped in thick orange masses, a ragged dark fringe, licks that break the
// outline and embers scattering beyond the cone. Collision and drawing share
// the travelling front, the trailing cutoff and the widening cone profile.
export function livensFlameSpan(h){
 const t=Math.max(0,h.age-(h.delay||0)-(h.warning||0)),travel=.28;
 return {t,front:Math.min(h.length,t*h.length/travel),tail:Math.max(0,(t-(h.duration-travel))*h.length/travel)};
}
export function drawLivensFlame(c,h){
 const {t,front,tail}=livensFlameSpan(h);if(front<=tail)return;
 c.save();c.translate(h.x,h.y);c.rotate(h.angle);
 const L=h.length,hw=q=>h.thickness*(.5+2.1*q);
 // Ragged deep-red fringe; slightly oversized so the body never looks thin.
 for(let x=tail+6;x<=front;x+=10){
  const H=hw(x/L),n=Math.max(2,H/10|0);
  for(let i=0;i<n;i++){
   const off=Math.sin(i*2.1+x*.013)*H*1.02,py=off+Math.sin(t*6+x*.23+i*2.9)*4;
   const s=7+(((i*5)+(x|0))%4)*3;
   c.globalAlpha=Math.min(1,(front-x)/50,(x-tail)/12)*(.5+.3*Math.sin(t*7+x*.41+i));
   c.fillStyle='#8a3a16';c.fillRect(x+Math.sin(i*7.3+x*.05)*5-s*.5,py-s*.3,s,s*.6);
  }
 }
 // Dense orange body fill.
 for(let x=tail+4;x<=front;x+=8){
  const H=hw(x/L)*.88,n=Math.max(2,H/7|0);
  for(let i=0;i<n;i++){
   const off=Math.sin(i*2.4+x*.07)*H,py=off+Math.sin(t*9+x*.29+i*3.1)*3;
   const s=9+(((i*3)+(x|0))%5)*2;
   c.globalAlpha=Math.min(1,(front-x)/60,(x-tail)/10)*(.75+.25*Math.sin(t*10+x*.37+i*1.7));
   c.fillStyle='#c4651f';c.fillRect(x+Math.sin(i*5.1+x*.11)*4-s*.5,py-s*.35,s,s*.7);
   if(((i+(x|0))%2)===0){c.fillStyle='#e08a2c';c.fillRect(x+Math.sin(i*5.1+x*.11)*4-s*.3,py-s*.55,s*.6,s*.7);}
  }
 }
 // Hot core, brightest near the muzzle and along the axis.
 for(let x=tail+2;x<=front;x+=7){
  const H=hw(x/L)*(.42-.12*(x/L)),n=Math.max(1,H/6|0);
  for(let i=0;i<n;i++){
   const off=Math.sin(i*2.7+x*.09)*H,s=6+(((i*7)+(x|0))%4)*2;
   c.globalAlpha=Math.min(1,(front-x)/70)*(.8+.2*Math.sin(t*12+x*.53+i));
   c.fillStyle=(x<front*.4||Math.abs(off)<H*.4)?'#f5e2a0':'#e8a34d';
   c.fillRect(x+Math.sin(i*3.9)*3-s*.5,off-s*.4,s,s*.8);
  }
 }
 // Licks that leap past the cone outline.
 for(let i=0;i<18;i++){
  const x=tail+(front-tail)*((i*.618+t*.15)%1);if(x>front)continue;
  const H=hw(x/L),side=i%2?1:-1,lip=H*(1.04+.24*Math.sin(t*11+i*2.2)),s=5+(i%3)*3;
  c.globalAlpha=.55+.3*Math.sin(t*13+i*4.1);
  c.fillStyle='#c4651f';c.fillRect(x,side*lip-s*.5,s,s);
  c.fillStyle='#e8a34d';c.fillRect(x+s*.2,side*lip-s*.5-s*.6,s*.5,s*.6);
 }
 // Spent embers scatter beyond the flame edges.
 for(let i=0;i<46;i++){
  const p=(t*(.6+i*.03)+i*.137)%1,x=p*L;if(x<tail||x>front+40)continue;
  const H=hw(x/L),spread=H*(.5+((i*7)%10)/8)+Math.sin(i*9.3)*20;
  const y=Math.sin(i*2.399+t*(2+i%3))*spread;
  c.globalAlpha=Math.sin(p*Math.PI)*(.5+.4*((i%3)/2));
  c.fillStyle=i%4===0?'#f5d38b':(i%4===1?'#e0912e':'#b0521a');
  c.fillRect(x+Math.sin(i*4.7)*10,y,2+(i%3),1.6);
 }
 // Dark smoke riding the spent far edge.
 for(let i=0;i<8;i++){
  const x=front-30+i*4+Math.sin(t*3+i)*6,y=Math.sin(i*2.1)*hw(1)*(.6+.06*i),s=14+((i*5)%12);
  c.globalAlpha=.16;c.fillStyle='#3a2a20';c.fillRect(x-s/2,y-s/2,s,s*.7);
 }
 c.restore();
}

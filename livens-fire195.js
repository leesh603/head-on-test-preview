// Continuous fuel-fan stream in the battlefield fire palette, drawn as dense
// small flame cells. Collision and drawing share the travelling front, the
// trailing cutoff and the widening cone profile.
export function livensFlameSpan(h){
 const t=Math.max(0,h.age-(h.delay||0)-(h.warning||0)),travel=.28;
 return {t,front:Math.min(h.length,t*h.length/travel),tail:Math.max(0,(t-(h.duration-travel))*h.length/travel)};
}
export function drawLivensFlame(c,h){
 const {t,front,tail}=livensFlameSpan(h);if(front<=tail)return;
 c.save();c.translate(h.x,h.y);c.rotate(h.angle);
 const flameLen=h.length,step=12;
 // Cone widens from the muzzle: the far edge is a broad wall of flame.
 for(let x=Math.max(tail,8);x<=front;x+=step){
  const q=x/flameLen,half=h.thickness*(.5+2.1*q);
  const rows=Math.max(1,Math.round(half/8));
  const edge=Math.min(1,(front-x)/45,(x-tail)/14);
  for(let j=-rows;j<=rows;j++){
   const off=j/rows;
   const wob=Math.sin(x*.19+j*2.7+t*7.3)*3.5;
   const px=x+Math.sin(j*1.9+x*.11)*4,py=off*half+wob;
   const s=(9+((j*7+(x|0))%5))*(0.8+0.5*q),flick=.72+.28*Math.sin(t*9+x*.37+j*2.1);
   c.globalAlpha=edge*flick;
   c.fillStyle='#8f3f1c';c.fillRect(px-s*.5,py-s*.2,s,s*.42);
   c.fillStyle='#c2622a';c.fillRect(px-s*.3,py-s*.6,s*.6,s*.66);
   if(((j*3)+(x|0))%3){c.fillStyle='#e8a34d';c.fillRect(px-s*.16,py-s*.48,s*.32,s*.5);}
   if(((j*5)+(x|0))%11===0){c.fillStyle='#f5d38b';c.fillRect(px-2,py-s*.72,3,4);}
   if(((j*2)+(x|0))%17===0){c.fillStyle='#57331d';c.fillRect(px-s*.34,py-s*.8,s*.5,s*.22);}
  }
 }
 // Spent embers drift with the same flow toward the wide end.
 for(let i=0;i<16;i++){
  const p=(t*2.1+i*.0625)%1,x=p*flameLen;if(x<tail||x>front)continue;
  const half=h.thickness*(.5+2.1*x/flameLen),y=Math.sin(i*2.399)*half*.85;
  c.globalAlpha=Math.sin(p*Math.PI)*.55;c.fillStyle=i%3?'#a34d1e':'#e8a34d';c.fillRect(x,y,3+p*4,1.6);
 }
 c.restore();
}

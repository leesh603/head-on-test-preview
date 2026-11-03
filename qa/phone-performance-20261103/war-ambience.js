// Noncombat sea/sky ambience. Ground battle decoration has been retired.
const hash=(x,y,s=0)=>{const n=Math.sin(x*127.1+y*311.7+s*74.7)*43758.5453;return n-Math.floor(n)};
const CFG={1:{gull:.5},5:{gull:.35},7:{gull:.6}};
const gullX=Array.from({length:14},(_,i)=>hash(i,2,5)),gullY=Array.from({length:14},(_,i)=>hash(i,3,5));
export function drawWarAmbience(c,region,cx,cy,W,H,t,density=1){
 const source=CFG[region];if(!source)return;
 const cfg={gull:source.gull*density};c.save();
 if(cfg.gull){ // tiny birds drifting over water/sky maps
  const n=Math.floor(cfg.gull*14);
  for(let i=0;i<n;i++){
   const s=gullX[i],px=(s*W*1.5+t*(14+s*10))%(W+30)-15,py=(gullY[i]*H*.5+t*6)%(H*.55)+10,fl=Math.sin(t*9+s*30)*3;
   c.globalAlpha=.5;c.strokeStyle=region===11?'#8a97ad':'#2c2c26';c.lineWidth=1.4;
   c.beginPath();c.moveTo(px-4,py);c.quadraticCurveTo(px-1,py-3-fl,px,py);c.quadraticCurveTo(px+1,py-3-fl,px+4,py);c.stroke();
  }
 }
 c.globalAlpha=1;c.restore();
}

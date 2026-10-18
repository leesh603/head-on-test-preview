// Baracca's forward membrane and lance envelope; Rickenbacker's visible half ring.
// Canvas gradients stay at native resolution. These are skill surfaces, not logo substitutes.
const clamp=n=>Math.max(0,Math.min(1,n));
export function drawCavalryGuard(c,opacity=1){
 if(typeof c.createLinearGradient!=='function')return;
 c.save();c.globalAlpha*=clamp(opacity);
 const ink=c.createLinearGradient(0,0,56,0);
 ink.addColorStop(0,'rgba(8,10,12,0)');ink.addColorStop(.32,'rgba(8,10,12,.08)');
 ink.addColorStop(.8,'rgba(8,10,12,.32)');ink.addColorStop(1,'rgba(8,10,12,.12)');
 c.fillStyle=ink;c.beginPath();c.ellipse(0,0,56,49,0,-Math.PI/2,Math.PI/2);c.closePath();c.fill();
 c.strokeStyle='rgba(14,18,21,.32)';c.lineWidth=1.4;c.beginPath();c.ellipse(0,0,55,48,0,-1.5,1.5);c.stroke();
 c.restore();
}
export function drawCavalryLance(c,time=0,opacity=1){
 if(typeof c.createLinearGradient!=='function')return;
 c.save();c.globalAlpha*=clamp(opacity);
 const tip=100+Math.sin(time*13)*2,ink=c.createLinearGradient(-55,0,tip,0);
 ink.addColorStop(0,'rgba(14,19,22,0)');ink.addColorStop(.3,'rgba(22,29,33,.16)');
 ink.addColorStop(.7,'rgba(31,40,45,.38)');ink.addColorStop(1,'rgba(12,17,20,.58)');
 c.fillStyle=ink;c.beginPath();c.moveTo(-55,-40);
 c.bezierCurveTo(-8,-38,65,-14,tip,0);c.bezierCurveTo(65,14,-8,38,-55,40);
 c.bezierCurveTo(-28,12,-28,-12,-55,-40);c.closePath();c.fill();
 // Two tapered metallic ridges end at a common lance point, with a clear aircraft-sized center.
 for(const side of [-1,1]){
  const edge=c.createLinearGradient(-55,0,tip,0);edge.addColorStop(0,'rgba(187,197,194,0)');
  edge.addColorStop(.58,'rgba(187,197,194,.25)');edge.addColorStop(1,'rgba(211,217,211,.58)');
  c.strokeStyle=edge;c.lineWidth=1.25;c.beginPath();c.moveTo(-53,side*39);
  c.bezierCurveTo(-8,side*37,65,side*14,tip,0);c.stroke();
 }
 c.restore();
}
export function drawRickenbackerHalfRing(c,time=0,opacity=1,front=false){
 if(typeof c.createLinearGradient!=='function')return;
 c.save();c.globalAlpha*=clamp(opacity);
 const ink=c.createLinearGradient(11,-47,58,47);
 ink.addColorStop(0,'rgba(189,172,129,.58)');ink.addColorStop(.5,'rgba(230,218,177,.84)');
 ink.addColorStop(1,'rgba(166,148,109,.52)');
 const from=front?0:-Math.PI/2,to=front?Math.PI/2:0;
 // A physical half-ring ahead of the nose, split across the aircraft's draw layers.
 c.fillStyle=ink;c.beginPath();c.ellipse(9,0,49,47,0,from,to);
 c.ellipse(9,0,44,42,0,to,from,true);c.closePath();c.fill();
 c.strokeStyle='rgba(244,232,192,.64)';c.lineWidth=.9;
 c.beginPath();c.ellipse(9,0,46.5,44.5,0,from,to);c.stroke();
 c.restore();
}

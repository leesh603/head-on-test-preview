// Reuse the authored horse-only SVG. Rasterize its silhouette once, never
// the round inventory illustration. These 96px caches add no frame allocation.
let horse=null,gauge=null;
if(typeof document!=='undefined'&&typeof Image!=='undefined'){
 const source=new Image();source.onload=()=>{
  const mask=document.createElement('canvas');mask.width=72;mask.height=96;
  const m=mask.getContext('2d');m.drawImage(source,5,3,62,90);
  m.globalCompositeOperation='source-in';m.fillStyle='#cfbf99';m.fillRect(0,0,72,96);
  horse=document.createElement('canvas');horse.width=76;horse.height=100;const c=horse.getContext('2d');
  // A fine worn-ivory keyline keeps the black horse visible on dark terrain.
  for(const [x,y] of [[0,2],[4,2],[2,0],[2,4]])c.drawImage(mask,x,y);
  m.fillStyle='#25231e';m.fillRect(0,0,72,96);c.drawImage(mask,2,2);
 };
 source.src=new URL('./pilot-mark-baracca-ferrari.svg',import.meta.url).href;
 gauge=document.createElement('canvas');gauge.width=64;gauge.height=64;const g=gauge.getContext('2d');
 g.translate(32,32);g.fillStyle='#302e25';g.beginPath();g.arc(0,0,27,0,Math.PI*2);g.fill();
 g.strokeStyle='#998563';g.lineWidth=3;g.stroke();g.fillStyle='#1c2421';g.beginPath();g.arc(0,0,23,0,Math.PI*2);g.fill();
 for(let i=0;i<9;i++){const a=Math.PI*.75+i*Math.PI*1.5/8;g.strokeStyle=i>6?'#a16445':'#bdb391';g.lineWidth=i%2?1.5:2.5;g.beginPath();g.moveTo(Math.cos(a)*17,Math.sin(a)*17);g.lineTo(Math.cos(a)*21,Math.sin(a)*21);g.stroke()}
}
export function drawHorseSilhouette(c,x,y,height,alpha=1){if(!horse)return;c.save();c.globalAlpha*=alpha;c.drawImage(horse,x-height*.38,y-height*.5,height*.76,height);c.restore()}
export function drawPowerInstrument(c,q,alpha=1){
 if(!gauge)return;c.save();c.globalAlpha*=alpha;c.drawImage(gauge,-11,-11,22,22);
 const a=Math.PI*.75+Math.max(0,Math.min(1,q))*Math.PI*1.5;
 c.strokeStyle='#ddcba4';c.lineWidth=1;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*6.7,Math.sin(a)*6.7);c.stroke();
 c.fillStyle='#af9970';c.beginPath();c.arc(0,0,1.2,0,Math.PI*2);c.fill();c.restore();
}

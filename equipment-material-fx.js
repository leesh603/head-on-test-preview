// Reuse the authored horse-only SVG. Rasterize its silhouette once, never
// the round inventory illustration. These 96px caches add no frame allocation.
let horse=null;
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
}

export function drawHorseSilhouette(c,x,y,height,alpha=1){if(!horse)return;c.save();c.globalAlpha*=alpha;c.drawImage(horse,x-height*.38,y-height*.5,height*.76,height);c.restore()}

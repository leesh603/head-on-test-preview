// Flat black silhouettes for ground shadows. `ctx.filter='brightness(0)'` gives the same picture,
// but a canvas filter is rasterised through an extra layer on every draw (and older iOS Safari
// ignores it, drawing the sprite in full colour). A silhouette is cut once and reused.
const cache=new WeakMap();
export function blacken(context,width,height){
 context.save();context.setTransform(1,0,0,1,0,0);context.globalAlpha=1;context.globalCompositeOperation='source-in';
 context.fillStyle='#000';context.fillRect(0,0,width,height);context.restore();
}
export function blackSilhouette(image){
 if(typeof document==='undefined'||!image)return null;
 let canvas=cache.get(image);
 if(!canvas){
  const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;if(!(width>0&&height>0))return null;
  canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const context=canvas.getContext('2d');context.drawImage(image,0,0,width,height);blacken(context,width,height);cache.set(image,canvas);
 }
 return canvas;
}

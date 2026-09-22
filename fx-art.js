// Unified hand-painted effect sprites. Each helper draws only when the PNG
// loaded; callers keep their procedural drawing as the fallback path.
const FX_FILES={}
const fxImgs={};
export const fxArtReady=typeof Image==='undefined'?Promise.resolve():Promise.all(Object.entries(FX_FILES).map(([key,file])=>new Promise(res=>{
 const im=new Image();im.onload=()=>{fxImgs[key]=im;res()};im.onerror=()=>res();im.src='./'+file+'?v=fx2';
})));
export function fxReady(key){return !!fxImgs[key]}
export function fxImage(key){return fxImgs[key]||null}
// Draw sprite centered at x,y, rotated to angle (0 = sprite's natural right/up orientation), fit inside w×h.
export function fx(c,key,x,y,w,h=w,angle=0,alpha=1){
 const im=fxImgs[key];if(!im)return false;
 c.save();c.translate(x,y);if(angle)c.rotate(angle);c.globalAlpha=alpha;
 const k=Math.min(w/im.naturalWidth,h/im.naturalHeight),dw=im.naturalWidth*k,dh=im.naturalHeight*k;
 c.drawImage(im,-dw/2,-dh/2,dw,dh);c.restore();return true;
}
const tintCache=new Map();
// Lazily bake a color-multiplied copy so painted shading survives tinting.
export function fxTintedCanvas(key,color){
 const im=fxImgs[key];if(!im)return null;
 const ck=key+color;let c=tintCache.get(ck);
 if(c===undefined){
  c=null;if(typeof document!=='undefined'){
   const cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;
   const g=cv.getContext('2d');g.drawImage(im,0,0);g.globalCompositeOperation='multiply';g.fillStyle=color;g.fillRect(0,0,cv.width,cv.height);
   g.globalCompositeOperation='destination-in';g.drawImage(im,0,0);c=cv;
  }
  tintCache.set(ck,c);
 }
 return c;
}
export function fxTint(c,key,color,x,y,w,h=w,angle=0,alpha=1){
 const cv=fxTintedCanvas(key,color);if(!cv)return fx(c,key,x,y,w,h,angle,alpha);
 c.save();c.translate(x,y);if(angle)c.rotate(angle);c.globalAlpha=alpha;
 c.drawImage(cv,-w/2,-h/2,w,h);c.restore();return true;
}

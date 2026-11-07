import {CAPORETTO_MAP} from './caporetto-map-profile.js?v=09c75d146ae4289d';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const positive=(v,label)=>{if(!Number.isFinite(v)||v<=0)throw new RangeError(label);return v;};
export function caporettoCamera(center,width,height,{map=CAPORETTO_MAP,zoom=1}={}){
 positive(width,'viewport width');positive(height,'viewport height');positive(zoom,'zoom');
 // A viewport larger than the finite artwork gets explicit letterboxing; never
 // wrap the river or stretch the axes independently to fill a wide monitor.
 const vw=width/zoom,vh=height/zoom,x=map.width<=vw?map.width/2:clamp(Number.isFinite(center.x)?center.x:map.width/2,vw/2,map.width-vw/2),y=map.height<=vh?map.height/2:clamp(Number.isFinite(center.y)?center.y:map.height/2,vh/2,map.height-vh/2);
 return {x,y,left:x-vw/2,top:y-vh/2,width,height,zoom,worldWidth:vw,worldHeight:vh};
}
export function caporettoWorldToScreen(x,y,camera){return{x:(x-camera.left)*camera.zoom,y:(y-camera.top)*camera.zoom};}
export function caporettoScreenToWorld(x,y,camera){return{x:camera.left+x/camera.zoom,y:camera.top+y/camera.zoom};}
export function caporettoCrop(camera,map=CAPORETTO_MAP){
 const x=Math.max(0,camera.left),y=Math.max(0,camera.top),r=Math.min(map.width,camera.left+camera.worldWidth),b=Math.min(map.height,camera.top+camera.worldHeight);
 if(r<=x||b<=y)return null;const scale=map.worldScale;
 return {sx:x/scale,sy:y/scale,sw:(r-x)/scale,sh:(b-y)/scale,dx:(x-camera.left)*camera.zoom,dy:(y-camera.top)*camera.zoom,dw:(r-x)*camera.zoom,dh:(b-y)*camera.zoom};
}
export class CaporettoTerrain {
 constructor({map=CAPORETTO_MAP,imageFactory=()=>new Image()}={}){this.map=map;this.imageFactory=imageFactory;this.image=null;this.promise=null;this.state='idle';this.generation=0;}
 prepare(){if(this.promise)return this.promise;const generation=++this.generation,im=this.imageFactory();this.image=im;this.state='loading';im.decoding='async';this.promise=new Promise(resolve=>{this.cancel=()=>resolve(false);let settled=false;const finish=async ok=>{if(settled)return;settled=true;if(ok&&im.decode)try{await im.decode();}catch{ok=false;}ok=ok&&im.naturalWidth===this.map.sourceWidth&&im.naturalHeight===this.map.sourceHeight;if(generation===this.generation)this.state=ok?'ready':'failed';resolve(ok&&generation===this.generation);};im.onload=()=>finish(true);im.onerror=()=>finish(false);im.src=this.map.src;if(im.complete&&im.naturalWidth)finish(true);});return this.promise;}
 draw(ctx,center,width,height,{zoom=1,atmosphere=true}={}){const camera=caporettoCamera(center,width,height,{map:this.map,zoom}),crop=caporettoCrop(camera,this.map);ctx.save();ctx.beginPath();ctx.rect(0,0,width,height);ctx.clip();ctx.fillStyle=this.map.base;ctx.fillRect(0,0,width,height);let drawn=false;if(this.state==='ready'&&crop){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(this.image,crop.sx,crop.sy,crop.sw,crop.sh,crop.dx,crop.dy,crop.dw,crop.dh);drawn=true;}if(atmosphere){ctx.globalAlpha*=this.map.atmosphereAlpha;ctx.fillStyle=this.map.atmosphere;ctx.fillRect(0,0,width,height);}ctx.restore();return{camera,drawn,imageDraws:drawn?1:0,sourcePixels:this.map.sourceWidth*this.map.sourceHeight,finite:true};}
 dispose(){this.generation++;this.cancel?.();this.cancel=null;if(this.image){this.image.onload=null;this.image.onerror=null;this.image.src='';}this.image=null;this.promise=null;this.state='idle';}
}

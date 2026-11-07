// Approved painted AA-only airburst. Rendering never changes hazard lifetime,
// damage, warning geometry, RNG, pools or network state.
export const FLAK_FRAME_MS=Object.freeze([40,50,70,100,120,150,170,200]);
const duration=900,cell=256,cols=4;
const off=typeof location!=='undefined'&&new URLSearchParams(location.search).get('fx')==='0';
const image=!off&&typeof Image!=='undefined'?new Image():null;
let ready=false;
export const flakAirburstArtReady=!image?Promise.resolve(false):new Promise(resolve=>{
 image.decoding='async';
 image.onload=()=>{image.onload=image.onerror=null;ready=image.naturalWidth===1024&&image.naturalHeight===512;resolve(ready);};
 image.onerror=()=>{image.onload=image.onerror=null;resolve(false);};
 image.src=new URL('./fx-flak-airburst-8f-20261104.webp',import.meta.url).href;
});
export function flakAirburstFrame(progress){
 if(!Number.isFinite(progress)||progress<0||progress>=1)return -1;
 let time=progress*duration;
 for(let i=0;i<FLAK_FRAME_MS.length;i++){if(time<FLAK_FRAME_MS[i])return i;time-=FLAK_FRAME_MS[i];}
 return 7;
}
export function drawFlakAirburstFrame(c,atlas,frame,x,y,size,angle=0,alpha=1){
 if(!atlas||(atlas.naturalWidth||atlas.width)!==1024||(atlas.naturalHeight||atlas.height)!==512)return false;
 if(!Number.isInteger(frame)||frame<0||frame>7||![x,y,size,angle,alpha].every(Number.isFinite)||size<=0)return false;
 c.save();c.translate(x,y);if(angle)c.rotate(angle);c.globalAlpha*=Math.max(0,Math.min(1,alpha));
 c.globalCompositeOperation='source-over';c.imageSmoothingEnabled=true;
 c.drawImage(atlas,frame%cols*cell,Math.floor(frame/cols)*cell,cell,cell,-size/2,-size/2,size,size);
 c.restore();return true;
}
export function drawFlakAirburst(c,x,y,size,progress,angle=0,alpha=1){
 if(off||!ready)return false;
 const frame=flakAirburstFrame(progress);if(frame<0)return false;
 const fade=progress>.78?(1-progress)/.22:1;
 return drawFlakAirburstFrame(c,image,frame,x,y,size,angle,alpha*fade);
}

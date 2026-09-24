import {clearCrewMatte} from './matte70.js?v=288&b=288';
// Use the cleaned canvas for every portrait surface, including boss arrivals.
export const portraitSources={};
const legacyPortraits=['baron','voss','boelcke','immelmann','udet','fonck','collishaw','baracca','guynemer','bishop','goering','mannock','mckeever','huffzky','hawker','berthold','jacobs','rickenbacker','ball','barker','luke','brumowski','gontermann'].map(id=>new Promise(resolve=>{
 const img=new Image(),key=id==='mckeever'?'mckeever-powell129':id,url=`./portrait-${key}.webp?v=226&b=226`;
 // Never leave a portrait surface blank while the cleaned canvas is loading.
 portraitSources[id]=url;
 img.onload=()=>{
  if(['mckeever','huffzky'].includes(id)){
   const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(img,0,0);const pixels=c.getImageData(0,0,canvas.width,canvas.height);clearCrewMatte(key,pixels.data,canvas.width,canvas.height);c.putImageData(pixels,0,0);// Frame from the actual opaque crew bounds, not the original padded image.
   let left=canvas.width,top=canvas.height,right=0,bottom=0;
   for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(pixels.data[(y*canvas.width+x)*4+3]>32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
   const width=Math.max(1,right-left+1),height=Math.max(1,Math.round((bottom-top+1)*1));
   const framed=document.createElement('canvas');framed.width=width;framed.height=height;
   framed.getContext('2d').drawImage(canvas,left,top,width,height,0,0,width,height);portraitSources[id]=framed.toDataURL('image/png');
  }
  resolve(true);
 };img.onerror=()=>resolve(false);img.src=url;
}));

const NEW_ACE_PORTRAITS=['wolff','loewenhardt','mccudden','nungesser'];
for(const id of NEW_ACE_PORTRAITS)portraitSources[id]=`./portrait-${id}-field.webp?v=226&b=226`;
function clearNavyMatte(data,w,h){
 const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
 const matte=i=>{const r=data[i],g=data[i+1],b=data[i+2];return b<82&&g<66&&r<50&&b>=g*.92&&g>=r*.92};
 const add=(x,y)=>{if(x<0||x>=w||y<0||y>=h)return;const n=y*w+x;if(seen[n])return;seen[n]=1;const i=n*4;if(!matte(i))return;data[i+3]=0;queue[tail++]=n};
 for(let x=0;x<w;x++)add(x,0);for(let y=0;y<h;y++){add(0,y);add(w-1,y)}
 while(head<tail){const n=queue[head++],x=n%w,y=Math.floor(n/w);add(x-1,y);add(x+1,y);add(x,y-1);add(x,y+1)}
}
// The four aces once cut from new-aces-portraits124.webp now ship as cleaned
// portrait-*-field.webp files (assigned above); the navy-matte atlas pass is
// retired so it can no longer overwrite them with half-cleared cells.
const newAcePortraitsReady=Promise.resolve(true);
export const portraitsReady=Promise.all([...legacyPortraits,newAcePortraitsReady]);

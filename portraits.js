// Every surface shares the authored transparent bust, including crew portraits.
export const portraitSources={};
// Per-pilot load tracking so the hangar gate can wait on just the portraits it shows.
export const portraitLoaded=new Map();
const legacyPortraits=['baron','voss','boelcke','immelmann','udet','fonck','collishaw','baracca','guynemer','bishop','goering','mannock','mckeever','huffzky','hawker','berthold','jacobs','rickenbacker','ball','barker','luke','brumowski','gontermann'].map(id=>{
 const promise=new Promise(resolve=>{
  const img=new Image(),key=id==='mckeever'?'mckeever-powell129':id,url=`./portrait-${key}.webp?v=ui3&b=bust1`;
  // Keep the authored transparent margin while the portrait loads.
  portraitSources[id]=url;
  img.onload=()=>{
   resolve(true);
  };img.onerror=()=>resolve(false);img.src=url;
 });
 portraitLoaded.set(id,promise);return promise;
});

const NEW_ACE_PORTRAITS=['wolff','loewenhardt','mccudden','nungesser','lothar','sachsenberg','proctor','schleich','lufbery'];
for(const id of NEW_ACE_PORTRAITS)portraitSources[id]=`./portrait-${id}-field.webp?v=ui3&b=bust1`;
// Warm the field portraits too, so an enemy-ace cut-in never waits on a first download.
const fieldPortraitWarm=typeof Image==='undefined'?[]:NEW_ACE_PORTRAITS.map(id=>{const img=new Image();img.decoding='async';img.src=portraitSources[id];
 const promise=new Promise(resolve=>{if(img.complete&&img.naturalWidth)return resolve(true);img.onload=()=>resolve(true);img.onerror=()=>resolve(false)});portraitLoaded.set(id,promise);return img});
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
// The gate waits on them too — a warm that never resolves leaves those aces
// popping in after the hangar opens.
const newAcePortraitsReady=Promise.all(fieldPortraitWarm.map((img,index)=>portraitLoaded.get(NEW_ACE_PORTRAITS[index])));
export const portraitsReady=Promise.all([...legacyPortraits,newAcePortraitsReady]);

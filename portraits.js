// Every surface uses the same transparent bust composition, including crews.
export const portraitSources={};
// Per-pilot load tracking so the hangar gate can wait on just the portraits it shows.
export const portraitLoaded=new Map();
const legacyPortraits=['baron','voss','boelcke','immelmann','udet','fonck','collishaw','baracca','guynemer','bishop','goering','mannock','mckeever','huffzky','hawker','berthold','jacobs','rickenbacker','ball','barker','luke','brumowski','gontermann'];
for(const id of legacyPortraits){const key=id==='mckeever'?'mckeever-powell129':id;portraitSources[id]=`./portrait-${key}.webp?v=headon-result339-20261028&b=bust2`;}

const NEW_ACE_PORTRAITS=['wolff','loewenhardt','mccudden','nungesser','lothar','sachsenberg','proctor','schleich','lufbery'];
for(const id of NEW_ACE_PORTRAITS)portraitSources[id]=`./portrait-${id}-field.webp?v=headon-result339-20261028&b=bust2`;
for(const id of ['huffzky','mckeever'])portraitSources[id]=`./portrait-${id==='mckeever'?'mckeever-powell129':id}.webp?v=headon-result339-20261028`;
export const portraitThumbnailSources={};
export const portraitThumbnailSource=id=>portraitThumbnailSources[id]||portraitSources[id];
// The lobby requests its selected/visible pilots. Reusing the promise avoids
// duplicate downloads when several surfaces request the same portrait.
export function ensurePortrait(id){
 if(!portraitSources[id])return Promise.resolve(false);
 if(!portraitLoaded.has(id))portraitLoaded.set(id,Promise.all([...new Set([portraitSources[id],portraitThumbnailSource(id)])].map(source=>new Promise(resolve=>{
  if(typeof Image==='undefined'){resolve(true);return;}
  const img=new Image();img.decoding='async';
  img.onload=()=>resolve(true);img.onerror=()=>resolve(false);img.src=source;
  if(img.complete&&img.naturalWidth)resolve(true);
 }))).then(results=>results.every(Boolean)));
 return portraitLoaded.get(id);
}
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
// Sources are immediately available; callers wait for the specific portraits
// they display through ensurePortrait/portraitLoaded instead of all32 busts.
export const portraitsReady=Promise.all([...portraitLoaded.values()]);

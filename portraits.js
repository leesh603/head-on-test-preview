// Every surface uses the same transparent bust composition, including crews.
export const portraitSources={};
// Per-pilot load tracking so the hangar gate can wait on just the portraits it shows.
export const portraitLoaded=new Map();
const legacyPortraits=['baron','voss','boelcke','immelmann','udet','fonck','collishaw','baracca','guynemer','bishop','goering','mannock','mckeever','huffzky','hawker','berthold','jacobs','rickenbacker','ball','barker','luke','brumowski','gontermann'];
for(const id of legacyPortraits){const key=id==='mckeever'?'mckeever-powell129':id;portraitSources[id]=`./portrait-${key}.webp?v=tame3&b=bust2`;}

const NEW_ACE_PORTRAITS=['wolff','loewenhardt','mccudden','nungesser','lothar','sachsenberg','proctor','schleich','lufbery'];
for(const id of NEW_ACE_PORTRAITS)portraitSources[id]=`./portrait-${id}-field.webp?v=tame3&b=bust2`;
for(const id of ['huffzky','mckeever'])portraitSources[id]=`./portrait-${id==='mckeever'?'mckeever-powell129':id}.webp?v=crew20261024`;
for(const id of ['navarre','frommherz'])portraitSources[id]=`./portrait-${id}.webp?v=navarre-frommherz-20261027`;
export const portraitThumbnailSources={};
// Load weight: surfaces use a 960px copy (portrait-sized/) and roster circles a 224px thumbnail
// (portrait-thumbs/). The authored originals stay for the full-size lightbox only.
export const portraitOriginalSources={...portraitSources};
for(const [id,src] of Object.entries(portraitSources)){const [file,q]=src.replace(/^\.\//,'').split('?');portraitSources[id]=`./portrait-sized/${file}?${q}&opt=1`;portraitThumbnailSources[id]=`./portrait-thumbs/${file}?${q}&opt=1`;}
// Thumbnail only: the hangar gate waits on these for the roster; the selected pilot's
// full portrait is requested separately.
export const portraitThumbLoaded=new Map();
function loadPortrait(cache,id,src){
 if(!src)return Promise.resolve(false);
 if(cache.has(id))return cache.get(id);
 const pending=new Promise(resolve=>{
  if(typeof Image==='undefined'){resolve(true);return;}
  const img=new Image();img.decoding='async';let settled=false;
  const finish=ok=>{if(settled)return;settled=true;clearTimeout(timer);img.onload=img.onerror=null;resolve(ok)};
  const timer=setTimeout(()=>finish(false),30000);
  img.onload=()=>finish(true);img.onerror=()=>finish(false);img.src=src;
  if(img.complete&&img.naturalWidth)finish(true);
 }).then(ok=>{if(!ok&&cache.get(id)===pending)cache.delete(id);return ok});
 cache.set(id,pending);return pending;
}
export function ensurePortraitThumb(id){return loadPortrait(portraitThumbLoaded,id,portraitThumbnailSources[id]);}
export const portraitThumbnailSource=id=>portraitThumbnailSources[id]||portraitSources[id];
// Share in-flight/successful requests; a failed request must be retryable.
export function ensurePortrait(id){return loadPortrait(portraitLoaded,id,portraitSources[id]);}
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

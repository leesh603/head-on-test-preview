// Every surface shares the authored transparent bust, including crew portraits.
export const portraitSources={};
const legacyPortraits=['baron','voss','boelcke','immelmann','udet','fonck','collishaw','baracca','guynemer','bishop','goering','mannock','mckeever','huffzky','hawker','berthold','jacobs','rickenbacker','ball','barker','luke','brumowski','gontermann'].map(id=>new Promise(resolve=>{
 const img=new Image(),key=id==='mckeever'?'mckeever-powell129':id,url=`./portrait-${key}.webp?v=485&b=bust1`;
 img.decoding='async';img.fetchPriority=id==='baron'?'high':'low';
 // Keep the authored transparent margin while the portrait loads.
 portraitSources[id]=url;
 img.onload=async()=>{try{if(img.decode)await img.decode();resolve(true)}catch{resolve(false)}};img.onerror=()=>resolve(false);img.src=url;
}));

const NEW_ACE_PORTRAITS=['wolff','loewenhardt','mccudden','nungesser','lothar','sachsenberg','proctor','schleich','lufbery'];
for(const id of NEW_ACE_PORTRAITS)portraitSources[id]=`./portrait-${id}-field.webp?v=485&b=bust1`;
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
const newAcePortraitsReady=Promise.all(NEW_ACE_PORTRAITS.map(id=>new Promise(resolve=>{
 const image=new Image();image.decoding='async';image.fetchPriority='low';
 image.onload=async()=>{try{if(image.decode)await image.decode();resolve(true)}catch{resolve(false)}};
 image.onerror=()=>resolve(false);image.src=portraitSources[id];
})));
export const portraitsReady=Promise.all([...legacyPortraits,newAcePortraitsReady]);

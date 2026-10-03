// Runtime transparency for these image-generator preview mattes only.
// Flood from exterior/verified gaps; isolated white insignia remain opaque.
export function clearCrewMatte(key,data,w,h){
 if(!['mckeever70','mckeever-powell129','huffzky'].includes(key))return;
 const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
 const add=(x,y)=>{if(x<0||x>=w||y<0||y>=h)return;const n=y*w+x;if(seen[n])return;seen[n]=1;const i=n*4,r=data[i],g=data[i+1],b=data[i+2];if(data[i+3]!==0&&(Math.min(r,g,b)<85||Math.max(r,g,b)-Math.min(r,g,b)>22))return;data[i+3]=0;queue[tail++]=n};
 for(let x=0;x<w;x++){add(x,0);add(x,h-1)}for(let y=0;y<h;y++){add(0,y);add(w-1,y)}
 const gaps=key==='mckeever70'?[[.15,.778],[.555,.79]]:key==='mckeever-powell129'?[[.637,.467]]:[];
 for(const [x,y]of gaps)add(Math.round(x*w),Math.round(y*h));
 while(head<tail){const n=queue[head++],x=n%w,y=Math.floor(n/w);add(x-1,y);add(x+1,y);add(x,y-1);add(x,y+1)}
}

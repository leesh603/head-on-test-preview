// One-time, premultiplied-alpha vertical wrap. Keep coastline colour and
// transparency together so offshore pixels never acquire a dark fringe.
export function periodicCoastPixels(src,width,height,edge=Math.round(height*.06)){
 const overlap=Math.max(1,Math.min(edge,Math.floor(height/8))),period=height-overlap*2;
 const out=new Uint8ClampedArray(width*period*4);
 for(let y=0;y<period;y++){
  const t=Math.min(1,y/(overlap*2)),blend=t*t*(3-2*t);
  for(let x=0;x<width;x++){
   const dest=(y*width+x)*4,a=(y*width+x)*4,b=((y+period)*width+x)*4;
   if(y>=overlap*2){out.set(src.subarray(a,a+4),dest);continue;}
   const aa=src[a+3]*blend,ba=src[b+3]*(1-blend),alpha=aa+ba;
   for(let k=0;k<3;k++)out[dest+k]=alpha?(src[a+k]*aa+src[b+k]*ba)/alpha:0;
   out[dest+3]=alpha;
  }
 }
 // Exact equal RGBA edges even at fractional camera positions.
 out.set(out.subarray(0,width*4),(period-1)*width*4);
 return {data:out,width,height:period};
}

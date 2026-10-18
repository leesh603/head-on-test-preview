// Blend only sand texture, once at decode. Normalize every sample: unlike
// additive panorama overlaps this never doubles brightness or ghosts rails.
export function periodicSandPixels(src,w,h,edge=Math.round(Math.min(w,h)*.06)){
 const b=Math.max(1,Math.min(edge,Math.floor(Math.min(w,h)/8))),pw=w-2*b,ph=h-2*b;
 const out=new Uint8ClampedArray(pw*ph*4),smooth=t=>t*t*(3-2*t);
 for(let y=0;y<ph;y++)for(let x=0;x<pw;x++){
  const ax=x<2*b?smooth(x/(2*b)):1,ay=y<2*b?smooth(y/(2*b)):1;
  const xs=x<2*b?[[x,ax],[x+pw,1-ax]]:[[x,1]],ys=y<2*b?[[y,ay],[y+ph,1-ay]]:[[y,1]];
  const dest=(y*pw+x)*4;
  for(let k=0;k<3;k++){let value=0;for(const [sx,wx]of xs)for(const [sy,wy]of ys)value+=src[(sy*w+sx)*4+k]*wx*wy;out[dest+k]=value;}out[dest+3]=255;
 }
 // Exact toroidal boundary; no empty strip at fractional camera positions.
 for(let y=0;y<ph;y++)out.set(out.subarray(y*pw*4,y*pw*4+4),(y*pw+pw-1)*4);
 out.set(out.subarray(0,pw*4),(ph-1)*pw*4);
 return{data:out,width:pw,height:ph};
}
export function maanGroundTiles(cx,cy,width,height,pw,ph){
 const left=cx-width/2,top=cy-height/2,result=[];
 for(let iy=Math.floor(top/ph);iy<Math.ceil((top+height)/ph);iy++)for(let ix=Math.floor(left/pw);ix<Math.ceil((left+width)/pw);ix++)result.push({x:ix*pw-left,y:iy*ph-top,width:pw,height:ph});
 return result;
}

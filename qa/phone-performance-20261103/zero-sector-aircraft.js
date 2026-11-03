// Decode-time silhouette rim, matching the existing 288x320 aircraft outline.
// Preserve the council paint, source resolution, transparent background and pivot.
export function outlineZeroSectorAircraft(source){
 const width=source.naturalWidth||source.width,height=source.naturalHeight||source.height;
 const mask=document.createElement('canvas');mask.width=width;mask.height=height;
 const mc=mask.getContext('2d');mc.drawImage(source,0,0);mc.globalCompositeOperation='source-in';mc.fillStyle='#140f08';mc.fillRect(0,0,width,height);
 const out=document.createElement('canvas');out.width=width;out.height=height;const c=out.getContext('2d'),r=Math.max(1,Math.round(width/288*2));
 for(let i=0;i<16;i++){const a=i*Math.PI/8;c.drawImage(mask,Math.round(Math.cos(a)*r),Math.round(Math.sin(a)*r));}
 c.drawImage(source,0,0);return out;
}

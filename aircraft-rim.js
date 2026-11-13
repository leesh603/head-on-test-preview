export function outlineAircraftRim(source){
 const mask=document.createElement('canvas');mask.width=source.width;mask.height=source.height;
 const mc=mask.getContext('2d');mc.drawImage(source,0,0);mc.globalCompositeOperation='source-in';mc.fillStyle='#140f08';mc.fillRect(0,0,mask.width,mask.height);
 const out=document.createElement('canvas');out.width=source.width;out.height=source.height;const c=out.getContext('2d');
 for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++)if(x*x+y*y<=5)c.drawImage(mask,x,y);
 c.drawImage(source,0,0);return out;
}

// Small airframes use the same rim at a normalized size so it reads at sortie zoom.
const SMALL_AIRFRAME_WIDTH=128;
export function outlineSmallAirframe(image,rects){
 const pad=3,w=image.naturalWidth,h=image.naturalHeight,k=SMALL_AIRFRAME_WIDTH/w;
 const canvas=document.createElement('canvas');canvas.width=SMALL_AIRFRAME_WIDTH+pad*2;canvas.height=Math.round(h*k)+pad*2;
 const c=canvas.getContext('2d');c.imageSmoothingQuality='high';
 for(const [x,y,width,height] of rects||[[0,0,w,h]])c.drawImage(image,x,y,width,height,pad+x*k,pad+y*k,width*k,height*k);
 return outlineAircraftRim(canvas);
}
export function drawSmallAirframe(c,frame,width){
 const scale=width/SMALL_AIRFRAME_WIDTH,w=frame.width*scale,h=frame.height*scale;
 c.imageSmoothingEnabled=true;
 c.drawImage(frame,-w/2,-h/2,w,h);
}

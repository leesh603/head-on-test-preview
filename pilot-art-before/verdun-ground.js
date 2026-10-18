// Ground and fortresses share the host's 1:1 world transform. No encounter,
// screen-size or player-heading anchor: entering a boss cannot move the ground.
export function verdunGroundTiles(cx,cy,w,h,period){
 const left=cx-w/2,top=cy-h/2,tiles=[];
 for(let iy=Math.floor(top/period);iy<Math.ceil((top+h)/period);iy++)
  for(let ix=Math.floor(left/period);ix<Math.ceil((left+w)/period);ix++)
   tiles.push({x:ix*period-left,y:iy*period-top,size:period});
 return tiles;
}
let ground=null,source=null;
export function releaseVerdunGround(){ground=null;source=null;}
export function prepareVerdunGround(im){if(im?.naturalWidth)seamlessGround(im);}
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function seamlessGround(im){
 if(source===im&&ground)return ground;
 if(typeof document==='undefined')return null;
 const size=im.naturalWidth,bleed=Math.round(size*.08),period=size-2*bleed;
 const feather=canvas(size,size),f=feather.getContext('2d',{willReadFrequently:true});f.drawImage(im,0,0);
 // Authored soil edges overlap with complementary weights. This one-time bake
 // gives an exactly periodic raster without mirroring trenches or runtime blur.
 const pixels=f.getImageData(0,0,size,size),data=pixels.data,edge=2*bleed;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const wx=Math.min(1,x/edge,(size-x)/edge),wy=Math.min(1,y/edge,(size-y)/edge);
  data[(y*size+x)*4+3]=Math.round(255*wx*wy);
 }
 f.putImageData(pixels,0,0);
 const tile=canvas(period,period),t=tile.getContext('2d');t.globalCompositeOperation='lighter';
 for(let y=-period;y<=period;y+=period)for(let x=-period;x<=period;x+=period)t.drawImage(feather,x,y);
 source=im;ground={tile,period};return ground;
}
export function drawVerdunGround(c,im,cx,cy,w,h){
 if(!im?.naturalWidth)return;
 const baked=seamlessGround(im),tile=baked?.tile||im,period=baked?.period||im.naturalWidth;
 c.save();c.imageSmoothingEnabled=true;
 for(const q of verdunGroundTiles(cx,cy,w,h,period))c.drawImage(tile,q.x,q.y,q.size,q.size);
 c.restore();
}

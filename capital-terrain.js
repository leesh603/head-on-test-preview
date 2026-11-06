// One coordinate scale for the painted city, the camera and river concealment.
// Native art is cached without shrinking it; neighbouring tiles only translate.
export const CAPITAL_TERRAIN_SIZE=2560;
export const CAPITAL_TERRAIN_SOURCES=Object.freeze({
 11:'./terrain-capital-london-20261031.webp',
 18:'./terrain-capital-berlin-20261031.webp'
});
const LONDON_BOROUGH_ART='./terrain-city-london96.webp';
const baseColor=region=>region===11?'#232a36':'#45514d';
const createCanvas=(width,height)=>{
 const canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(width,height):document.createElement('canvas');
 canvas.width=width;canvas.height=height;return canvas;
};

// Keep this small, one-time edge blend local: importing the general terrain
// renderer also starts unrelated image preloads when the battle module loads.
function joinTerrainEdges(canvas,border){
 const g=canvas.getContext('2d');if(typeof g.getImageData!=='function')return;
 const w=canvas.width,h=canvas.height,image=g.getImageData(0,0,w,h),d=image.data;
 const n=Math.min(border,Math.floor(Math.min(w,h)/4));
 const pair=(a,b,t)=>{for(let k=0;k<3;k++){const x=d[a+k],y=d[b+k];d[a+k]=Math.round(x*(1-t)+y*t);d[b+k]=Math.round(y*(1-t)+x*t);}};
 for(let i=0;i<n;i++){const t=.5*(1-i/n)**2;for(let y=0;y<h;y++)pair((y*w+i)*4,(y*w+w-1-i)*4,t);}
 for(let i=0;i<n;i++){const t=.5*(1-i/n)**2;for(let x=0;x<w;x++)pair((i*w+x)*4,((h-1-i)*w+x)*4,t);}
 g.putImageData(image,0,0);
}

function paintBoroughs(tile,image,makeCanvas){
 const w=tile.width,h=tile.height,variant=makeCanvas(w,h),ctx=variant.getContext('2d');
 ctx.drawImage(tile,0,0);
 for(const [sy,sh,y,dh] of [[.015,.31,.045,.325],[.69,.295,.655,.30]]){
  const pw=Math.round(w*.84),ph=Math.round(h*dh),panel=makeCanvas(pw,ph),q=panel.getContext('2d');
  q.drawImage(image,image.naturalWidth*.08,image.naturalHeight*sy,image.naturalWidth*.84,image.naturalHeight*sh,0,0,pw,ph);
  q.globalCompositeOperation='destination-in';
  for(const [x,v] of [[pw,0],[0,ph]]){
   const fade=q.createLinearGradient(0,0,x,v);
   for(const [offset,alpha] of [[0,0],[.06,.16],[.18,1],[.82,1],[.94,.16],[1,0]])fade.addColorStop(offset,'rgba(0,0,0,'+alpha+')');
   q.fillStyle=fade;q.fillRect(0,0,pw,ph);
  }
  ctx.drawImage(panel,Math.round(w*.08),Math.round(h*y));
 }
 return variant;
}

export class CapitalTerrainRenderer{
 constructor({imageFactory=()=>typeof Image==='undefined'?null:new Image(),canvasFactory=createCanvas}={}){
  this.imageFactory=imageFactory;this.canvasFactory=canvasFactory;this.entries=new Map();
 }
 prepare(region){
  const source=CAPITAL_TERRAIN_SOURCES[region];if(!source)return Promise.resolve(false);
  if(this.entries.has(region))return this.entries.get(region).ready;
  const image=this.imageFactory();if(!image)return Promise.resolve(false);
  const entry={image,tile:null,variant:null,ready:null};
  entry.ready=new Promise(resolve=>{
   image.onload=()=>Promise.resolve(image.decode?.()).catch(()=>{}).then(()=>{
    if(!image.naturalWidth){resolve(false);return;}
    const tile=this.canvasFactory(image.naturalWidth,image.naturalHeight),g=tile.getContext('2d');
    g.drawImage(image,0,0);joinTerrainEdges(tile,region===11?18:4);
    entry.tile=tile;
    const boroughs=region===11&&typeof g.createLinearGradient==='function'?this.imageFactory():null;
    if(!boroughs){resolve(true);return;}
    boroughs.onload=()=>Promise.resolve(boroughs.decode?.()).catch(()=>{}).then(()=>{
     if(boroughs.naturalWidth)entry.variant=paintBoroughs(tile,boroughs,this.canvasFactory);
     resolve(true);
    });
    boroughs.onerror=()=>resolve(true);boroughs.decoding='async';boroughs.src=LONDON_BOROUGH_ART;
   });
   image.onerror=()=>resolve(false);
  });
  this.entries.set(region,entry);image.decoding='async';image.src=source;
  return entry.ready;
 }
 draw(context,region,cx,cy,width,height){
  if(!CAPITAL_TERRAIN_SOURCES[region])return false;
  let entry=this.entries.get(region);if(!entry){this.prepare(region);entry=this.entries.get(region);}
  context.save();context.fillStyle=baseColor(region);context.fillRect(0,0,width,height);
  const tile=entry?.tile;
  if(tile){
   const size=CAPITAL_TERRAIN_SIZE,left=cx-width/2,top=cy-height/2;
   // Keep the heavier interpolation out of the shared Berlin renderer.
   context.imageSmoothingEnabled=true;context.imageSmoothingQuality=region===11?'medium':'low';
   for(let row=Math.floor(top/size);row*size<top+height;row++)for(let col=Math.floor(left/size);col*size<left+width;col++){
    // Integer world anchors plus a single pixel overlap avoid raster gaps at
    // positive and negative coordinates without reversing buildings or rivers.
    context.drawImage(((row+col)%2&&entry.variant)||tile,Math.floor(col*size-left),Math.floor(row*size-top),size+1,size+1);
   }
  }
  context.restore();return !!tile;
 }
}

const renderer=new CapitalTerrainRenderer();
export const prepareCapitalTerrain=region=>renderer.prepare(region);
export const paintCapitalTerrain=(context,region,cx,cy,width,height)=>renderer.draw(context,region,cx,cy,width,height);

// Conservative banks inside the painted Thames. The same endpoints meet at
// translated tile boundaries; bridges do not change the approach corridor.
const THAMES_BANKS=Object.freeze([[0,.435,.55],[.2,.405,.52],[.4,.42,.56],[.6,.46,.60],[.8,.46,.61],[1,.435,.55]]);
export function capitalLondonRiverCover(x,y){
 const u=((x%CAPITAL_TERRAIN_SIZE)+CAPITAL_TERRAIN_SIZE)%CAPITAL_TERRAIN_SIZE/CAPITAL_TERRAIN_SIZE;
 const v=((y%CAPITAL_TERRAIN_SIZE)+CAPITAL_TERRAIN_SIZE)%CAPITAL_TERRAIN_SIZE/CAPITAL_TERRAIN_SIZE;
 for(let i=1;i<THAMES_BANKS.length;i++){
  const a=THAMES_BANKS[i-1],b=THAMES_BANKS[i];if(u>b[0])continue;
  const t=(u-a[0])/(b[0]-a[0]),upper=a[1]+(b[1]-a[1])*t,lower=a[2]+(b[2]-a[2])*t;
  return v>upper+.01&&v<lower-.01;
 }
 return false;
}

// One coordinate scale for the painted city, the camera and river concealment.
// Native art is cached without shrinking it; neighbouring tiles only translate.
export const CAPITAL_TERRAIN_SIZE=2560;
export const CAPITAL_TERRAIN_SOURCES=Object.freeze({
 11:'./terrain-capital-london-20261031.webp?art=london-night-20261117',
 18:'./terrain-capital-berlin-20261031.webp?art=berlin-detail-20261117'
});
const baseColor=region=>region===11?'#232a36':'#45514d';

export class CapitalTerrainRenderer{
 constructor({imageFactory=()=>typeof Image==='undefined'?null:new Image()}={}){
  this.imageFactory=imageFactory;this.entries=new Map();
 }
 prepare(region){
  const source=CAPITAL_TERRAIN_SOURCES[region];if(!source)return Promise.resolve(false);
  if(this.entries.has(region))return this.entries.get(region).ready;
  const image=this.imageFactory();if(!image)return Promise.resolve(false);
  const entry={tile:null,ready:null};
  entry.ready=new Promise(resolve=>{
   image.onload=()=>Promise.resolve(image.decode?.()).catch(()=>{}).then(()=>{
    if(!image.naturalWidth){resolve(false);return;}
    // The WebPs contain the tile joins. Retain one decoded surface per city.
    entry.tile=image;resolve(true);
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
   context.imageSmoothingEnabled=true;context.imageSmoothingQuality='medium';
   for(let row=Math.floor(top/size);row*size<top+height;row++)for(let col=Math.floor(left/size);col*size<left+width;col++){
    // Integer world anchors plus a single pixel overlap avoid raster gaps at
    // positive and negative coordinates without reversing buildings or rivers.
    context.drawImage(tile,Math.floor(col*size-left),Math.floor(row*size-top),size+1,size+1);
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

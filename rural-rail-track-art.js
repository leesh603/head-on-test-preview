// Native alpha artwork, registered to the existing 92px rail gauge.
export const RURAL_TRACK_ART=Object.freeze({url:'./rail-track-states-20261110.webp',cellWidth:512,height:1024,scale:92/194,
 centers:[257,254,254],gauges:[192,196,192]});
let image,pending,generation=0,held=false,lastRegion=0;
export function holdRuralTrackArt(active){held=active;if(!active&&lastRegion!==0)prepareRuralTrackArt(lastRegion);}
export function prepareRuralTrackArt(region){
 lastRegion=region;
 if(region!==0){if(region<0)held=false;if(!held){generation++;image=null;pending=null;return Promise.resolve();}}
 if(pending)return pending;
 const current=generation,im=new Image();im.decoding='async';
 pending=new Promise(resolve=>{
  im.onload=()=>{Promise.resolve(im.decode?.()).catch(()=>{}).then(()=>{if(current===generation)image=im;resolve();});};
  im.onerror=()=>resolve();im.src=RURAL_TRACK_ART.url;
 });return pending;
}
export const ruralTrackArtReady=()=>!!image?.naturalWidth;
export function drawRuralTrackTile(c,state,y){
 const art=RURAL_TRACK_ART,k=92/art.gauges[state],height=art.height*art.scale;
 c.drawImage(image,state*art.cellWidth,0,art.cellWidth,art.height,-art.centers[state]*k,y,art.cellWidth*k,height);
}

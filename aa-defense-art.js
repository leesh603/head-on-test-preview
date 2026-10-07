// Authored transparent sprite sheets. Rects are measured from the source
// images, so parts remain independent as health and hazards change.
const SOURCES={
  drachen:'./boss-drachen-parts-v2.webp?v=perf5',
  london:'./boss-london-apron-parts-v2.webp?v=perf5',
  fx:'./fx-aa-defense-atlas.webp?v=perf5'
};
const CELLS={
  drachenBalloon:['drachen',20,0,880,500],
  drachenWinch:['drachen',920,0,615,500],
  drachenMine:['drachen',165,510,550,510],
  drachenWreck:['drachen',760,510,760,510],
  londonBalloon:['london',0,60,818,475],
  londonWinch:['london',810,65,725,455],
  londonKnot:['london',40,535,735,485],
  londonWreck:['london',810,540,725,480],
  aaMuzzle:['fx',0,0,362,362],
  aaFlakDark:['fx',362,0,362,362],
  aaFlakHot:['fx',724,0,362,362],
  aaFlakSmoke:['fx',1086,0,362,362],
  aaMine:['fx',0,362,362,362],
  aaMineBurst:['fx',362,362,362,362],
  aaChainBurst:['fx',724,362,362,362],
  aaWireSnap:['fx',1086,362,362,362],
  aaBalloonHit:['fx',0,724,362,362],
  aaBalloonBurst:['fx',362,724,362,362],
  aaWinchSpark:['fx',724,724,362,362],
  aaWreckSmoke:['fx',1086,724,362,362]
};
const images=new Map();
function imageFor(key){
  if(images.has(key))return images.get(key);
  const im=new Image();im.decoding='async';im.src=SOURCES[key];images.set(key,im);return im;
}
export function prepareAADefenseAssets(keys=['fx','drachen','london']){
  return Promise.all(keys.map(key=>new Promise(resolve=>{
    const im=imageFor(key);if(im.complete){resolve();return;}
    im.addEventListener('load',()=>{(im.decode?im.decode():Promise.resolve()).catch(()=>{}).finally(()=>resolve())},{once:true});im.addEventListener('error',resolve,{once:true});
  })));
}
export function releaseAADefenseAssets(){
  images.clear();
}
export function drawAADefense(c,key,x,y,w,h,angle=0,alpha=1){
  const cell=CELLS[key];if(!cell)return false;
  const [sheet,sx,sy,sw,sh]=cell,im=imageFor(sheet);if(!im.naturalWidth)return false;
  c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha*=alpha;c.imageSmoothingEnabled=true;
  c.drawImage(im,sx,sy,sw,sh,-w/2,-h/2,w,h);c.restore();return true;
}
export function drawDrachenMine(c,x,y,w,h){const im=imageFor('drachen');if(!im.naturalWidth)return;const[,sx,sy,sw,sh]=CELLS.drachenMine;c.save();c.translate(x,y);c.imageSmoothingEnabled=true;c.drawImage(im,sx,sy,sw,sh,-w/2,-h/2,w,h);c.restore()}

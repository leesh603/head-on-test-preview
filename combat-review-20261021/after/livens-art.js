// Registered, authored RGBA layers. All coordinates below are in the existing
// boss's nominal 520px frame; the combat model owns trenchScale and all hits.
export const LIVENS_ART_SOURCES=Object.freeze({
 foundation:'./livens-foundation-20261019.webp',
 machinery:'./livens-machinery-20261019.webp',
 nozzles:'./livens-nozzles-20261019.webp'
});

// The source sheet has deliberately irregular gutters. Explicit rectangles
// avoid clipping a coupling or sampling the neighbouring damage state.
// [source x, source y, source width, source height, anchor x, anchor y]
const MACHINERY=[
 [[20,11,318,225,180,121],[338,11,295,225,485,121],[633,11,296,225,784,121],[929,11,306,225,1083,121]],
 [[25,253,309,298,180,403],[337,253,297,298,485,403],[634,253,302,298,784,403],[936,253,299,298,1083,403]],
 [[25,560,309,328,180,721],[334,560,300,328,485,721],[634,560,302,328,784,721],[936,560,299,328,1083,721]]
];
const PART_SPAN=[[310,291,290,298],[293,275,295,284],[298,292,295,291]];
const NOZZLES=[
 [15,230,603,320,485,388],[618,230,620,320,1084,388],
 [15,747,603,335,485,907],[618,735,620,348,1084,907]
];
const loaded=im=>!!(im?.naturalWidth||im?.width);
const partState=(p,wreck)=>wreck?3:p?.destroyed?2:p&&p.hp<=p.maxHp*.5?1:0;

export function livensNozzleState(b){
 if(b.destroying||b.dead)return 3;
 if(b.lockedFlameAngle!=null&&b.flameLockTime>0&&b.flameAge>=b.flameWarn)return 1;
 return b.recovery>0?2:0;
}

function sprite(c,image,frame,x,y,scale){
 const [sx,sy,sw,sh,ax,ay]=frame;
 const resolution=(image.naturalWidth||image.width)/1254;
 c.drawImage(image,sx*resolution,sy*resolution,sw*resolution,sh*resolution,x+(sx-ax)*scale,y+(sy-ay)*scale,sw*scale,sh*scale);
}

// Returns false until the complete set is ready: never mix new and old kits.
export function drawLivensInstallation(c,b,art){
 if(!Object.keys(LIVENS_ART_SOURCES).every(key=>loaded(art[key])))return false;
 const parts=[...(b.parts?.values?b.parts.values():(b.parts||[]))];
 const part=id=>parts.find(p=>p.id===id),wreck=!!(b.destroying||b.dead);
 c.save();c.imageSmoothingEnabled=true;c.scale(b.trenchScale||1,b.trenchScale||1);
 // Preserve the foundation's aspect ratio. Its bearing is registered to -98.
 const height=520*(art.foundation.naturalHeight||art.foundation.height)/(art.foundation.naturalWidth||art.foundation.width);
 c.drawImage(art.foundation,-260,-height/2,520,height);
 const drawPart=(row,state,x,y,width)=>sprite(c,art.machinery,MACHINERY[row][state],x,y,width/PART_SPAN[row][state]);
 const broken=parts.filter(p=>p.destroyed).length;
 // Opening the armoured doors is distinct from a shattered pump housing.
 drawPart(2,wreck?3:b.coreVulnerable?2:broken>=2?1:0,0,-8,142);
 for(const side of [-1,1])for(const [suffix,y]of [['1',-72],['2',72]]){
  c.save();c.translate(side*155,y);
  // Mirrored reservoirs keep their rupture and supply connection inboard.
  if(side>0)c.scale(-1,1);
  drawPart(0,partState(part(`tank-${side<0?'l':'r'}${suffix}`),wreck),0,0,156);
  c.restore();
 }
 drawPart(1,partState(part('pressure'),wreck),0,72,110);
 if(b.nozzleRevealed!==false){
  c.save();c.translate(0,-98);
  c.rotate((Number.isFinite(b.nozzleAngle)?b.nozzleAngle:-Math.PI/2)-Math.PI);
  // The new top-down barrel points left. Its authored tip is exactly 458px
  // left of the pivot, corresponding to the existing 85px muzzle length.
  sprite(c,art.nozzles,NOZZLES[livensNozzleState(b)],0,0,85/458);
  c.restore();
 }
 c.restore();return true;
}

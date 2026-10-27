import {NPC_CREW_SEATS} from './aircraft-crew-seats.js';

const CREW_LOAD_TIMEOUT_MS=4000;
const composedCanvases=new WeakSet();
let crewArtPromise,crewImages,patchArtPromise,patchImage;

function loadCrewImage(file){
 return new Promise(resolve=>{
  const image=new Image();let settled=false;
  const finish=value=>{if(settled)return;settled=true;clearTimeout(timer);image.onload=null;image.onerror=null;resolve(value)};
  const timer=setTimeout(()=>finish(null),CREW_LOAD_TIMEOUT_MS);
  image.onload=()=>finish(image);image.onerror=()=>finish(null);
  image.src=new URL(`./crew/${file}.png?v=cockpit-placement-20261026`,import.meta.url).href;
 });
}

// The two shared figures are decoded at most once. A missing figure fails soft
// for the session rather than holding an aircraft's first frame for 45 seconds.
function crewArt(){
 return crewArtPromise??=Promise.all([loadCrewImage('pilot'),loadCrewImage('gunner')]).then(([pilot,gunner])=>crewImages=pilot&&gunner?{pilot,gunner}:null);
}

// One optional shared cockpit repair, never one image/canvas per aircraft.
// Ordinary seats do not request this resource. Failure is cached and leaves
// the affected cockpit's original art intact rather than drawing a second pilot.
function cockpitArt(){
 return patchArtPromise??=loadCrewImage('cockpit-single-pilot').then(image=>patchImage=image);
}
const polygonValid=p=>Array.isArray(p)&&p.length>=3&&p.every(v=>Array.isArray(v)&&v.length===2&&v.every(Number.isFinite));
function patchValid(p){
 return p?.key==='single-pilot'&&Array.isArray(p.rect)&&p.rect.length===4&&p.rect.every(Number.isFinite)&&p.rect[2]>0&&p.rect[3]>0&&polygonValid(p.polygon);
}
const seatPolygon=s=>s.cockpitPatch?s.cockpitPatch.polygon:s.innerPolygon;

function sameCell(a,b){
 return a&&b&&['x','y','w','h'].every(key=>Number(a[key])===Number(b[key]));
}

export function npcCrewSeats(path,cell){
 const entry=NPC_CREW_SEATS[path];
 if(!entry)return null;
 if(Array.isArray(entry.cells)){
  const match=entry.cells.find(candidate=>sameCell(candidate,cell));
  return match?match.seats:null;
 }
 return entry.seats||null;
}

// Only visually verified inner openings are writable; preserve original coaming.
function inside(x,y,poly){let ok=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])ok=!ok}return ok}
function overlaps(poly,corners,boundaryOnly=false){
 const [a,b,c,d]=corners,x0=a[0],y0=a[1],x1=d[0],y1=d[1];
 if((!boundaryOnly&&corners.some(([x,y])=>inside(x,y,poly)))||poly.some(([x,y])=>x>=x0&&x<=x1&&y>=y0&&y<=y1))return true;
 const cross=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);
 const hit=(p,q,r,t)=>cross(p,q,r)*cross(p,q,t)<=0&&cross(r,t,p)*cross(r,t,q)<=0&&Math.max(Math.min(p[0],q[0]),Math.min(r[0],t[0]))<=Math.min(Math.max(p[0],q[0]),Math.max(r[0],t[0]))&&Math.max(Math.min(p[1],q[1]),Math.min(r[1],t[1]))<=Math.min(Math.max(p[1],q[1]),Math.max(r[1],t[1]));
 const edges=[[a,b],[b,d],[d,c],[c,a]];for(let i=0;i<poly.length;i++)for(const [r,t]of edges)if(hit(poly[i],poly[(i+1)%poly.length],r,t))return true;return false;
}
function path(c,p,w,h){c.moveTo(p[0][0]*w,p[0][1]*h);for(let i=1;i<p.length;i++)c.lineTo(p[i][0]*w,p[i][1]*h);c.closePath()}
function composeWithArt(canvas,seats,art={},repair=null){
 const c=canvas.getContext('2d',{willReadFrequently:true}),w=canvas.width,h=canvas.height;
 const safe=seats.filter(s=>s.cockpitPatch?patchValid(s.cockpitPatch)&&repair:polygonValid(s.innerPolygon)&&s.personWidth>0&&s.personCenter?.length===2&&art?.[s.role]);if(!safe.length)return false;
 let before;try{before=c.getImageData(0,0,w,h)}catch{return false}try{
 for(const s of safe){c.save();c.beginPath();path(c,seatPolygon(s),w,h);c.clip();
  if(s.cockpitPatch){const [x,y,rw,rh]=s.cockpitPatch.rect;c.drawImage(repair,x*w,y*h,rw*w,rh*h)}
  else{const im=art[s.role],pw=s.personWidth*w,ph=pw*(im.naturalHeight||im.height)/(im.naturalWidth||im.width);c.translate(s.personCenter[0]*w,s.personCenter[1]*h);if(s.role==='gunner'&&s.direction==='forward')c.rotate(Math.PI);c.drawImage(im,-pw/2,-ph/2,pw,ph)}
  c.restore();
 }
 const after=c.getImageData(0,0,w,h);
 // Restore every protected/non-interior target pixel from the exact uncrewed
 // canvas. All four target-pixel corners must be inside; no resize-edge bleed.
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4;after.data[i+3]=before.data[i+3];if(after.data[i]===before.data[i]&&after.data[i+1]===before.data[i+1]&&after.data[i+2]===before.data[i+2])continue;
  const corners=[[x/w,y/h],[(x+1)/w,y/h],[x/w,(y+1)/h],[(x+1)/w,(y+1)/h]];
  const allowed=safe.some(s=>corners.every(([a,b])=>inside(a,b,seatPolygon(s)))&&!overlaps(seatPolygon(s),corners,true))&&!seats.some(s=>(s.protectedPolygons||[]).some(p=>overlaps(p,corners)));
  if(!allowed)for(let k=0;k<4;k++)after.data[i+k]=before.data[i+k];
 }
 c.putImageData(after,0,0);return true;}catch{try{c.restore();c.putImageData(before,0,0)}catch{}return false;}
}

export function composeNpcCrew(canvas,{path,cell}={}){
 if(!canvas||composedCanvases.has(canvas))return false;
 const seats=npcCrewSeats(path,cell);
 if(!seats){return false}
 composedCanvases.add(canvas);
 if(!seats.length)return false;
 const needsPatch=seats.some(s=>patchValid(s.cockpitPatch));
 if(needsPatch){
  const needsCrew=seats.some(s=>!s.cockpitPatch);
  if(patchImage&&(!needsCrew||crewImages))return composeWithArt(canvas,seats,crewImages||{},patchImage);
  return Promise.all([needsCrew?crewArt().catch(()=>null):null,cockpitArt().catch(()=>null)])
   .then(([art,repair])=>composeWithArt(canvas,seats,art||{},repair)).catch(()=>false);
 }
 if(crewImages)return composeWithArt(canvas,seats,crewImages);
 return crewArt().then(art=>art?composeWithArt(canvas,seats,art):false).catch(()=>false);
}

// Warm only the two shared 256px figures; no aircraft canvas is allocated here.
if(typeof Image==='function')crewArt();

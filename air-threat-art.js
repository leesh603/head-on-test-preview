import {airThreatMuzzles} from './air-threat-profiles.js';
import {AIR_THREAT_ASSETS} from './air-threat-assets.js';
// A small bounded cache, shared by solo/co-op and the asset-bank preview. No
// canvas creation, pixel reads, filters, or network requests on the hot path.
const images=new Map(),queue=[];
let active=0;
function pump(){
 while(active<2&&queue.length){
  const item=queue.shift();active++;
  const im=item.image;
  const finish=ok=>{item.ready=ok;item.done=true;active--;item.resolve(ok);pump()};
  im.onload=()=>finish(im.naturalWidth>0);im.onerror=()=>finish(false);
  im.crossOrigin='anonymous';im.decoding='async';im.src='./'+AIR_THREAT_ASSETS[item.id].path;
 }
}
function request(id){
 if(!AIR_THREAT_ASSETS[id]||typeof Image==='undefined')return null;
 if(images.has(id))return images.get(id);
 const item={id,image:new Image(),ready:false,done:false};
 item.promise=new Promise(resolve=>{item.resolve=resolve});
 images.set(id,item);queue.push(item);pump();return item;
}
export function airThreatArtReady(id){return request(id)?.ready===true;}
export function prepareAirThreatArt(ids=Object.keys(AIR_THREAT_ASSETS)){
 return Promise.all(ids.map(id=>request(id)?.promise||Promise.resolve(false)));
}
function imageSize(e){const m=AIR_THREAT_ASSETS[e.airThreatArt];if(!m)return null;const h=e.airThreatLength||280;return {w:h*m.width/m.height,h};}
export function drawAirThreat(c,e,x=e.x,y=e.y,{shadow=true,fx=null}={}){
 const item=request(e?.airThreatArt),size=imageSize(e||{});if(!item?.ready||!size)return false;
 const angle=e.fieldUnit==='balloon'?0:(e.a||0)+Math.PI/2;
 c.save();c.translate(x,y);c.rotate(angle);c.imageSmoothingEnabled=true;
 if(shadow){c.shadowColor='#08100b55';c.shadowOffsetX=7;c.shadowOffsetY=11;c.shadowBlur=0;}
 // Canvas opacity preserves cloth shading instead of painting a white hull.
 if(e.crashing)c.globalAlpha*=Math.max(.15,Math.min(1,e.crashLife??1));
 c.drawImage(item.image,-size.w/2,-size.h/2,size.w,size.h);c.restore();
 if(fx&&e.muzzleFlash>0)for(const m of airThreatMuzzles(e))fx(c,'muzzleHeavy',x+m.x-(e.x||0),y+m.y-(e.y||0),22,22,m.angle,Math.min(1,e.muzzleFlash*7));
 return true;
}
export function selectAAArt(e={},kind='aa'){
 if(kind!=='aa'||e.stageBossBody||e.bossMinion||e.bossPilot)return null;
 if(e.airThreatAA&&AIR_THREAT_ASSETS[e.airThreatAA]?.kind==='aa')return e.airThreatAA;
 const region=e.fieldRegion??e.hazardRegion??e.region;
 const env=e.threatEnvironment||(region===6?'alpine':[1,7,14,16,17].includes(region)?'coastal':'rural');
 const id=`aa-${env}-pedestal`;return AIR_THREAT_ASSETS[id]?id:null;
}
export function drawThreatAA(c,e,x,y,size,kind='aa'){
 const id=selectAAArt(e,kind),item=request(id),m=AIR_THREAT_ASSETS[id];if(!item?.ready||!m)return false;
 // High-angle barrels are baked into the approved top-view art: rotating the
 // entire emplacement to aim would rotate sandbags/truck and misplace the muzzle.
 const k=size/Math.max(m.width,m.height),w=m.width*k,h=m.height*k;
 c.save();c.imageSmoothingEnabled=true;c.drawImage(item.image,x-w/2,y-h/2,w,h);c.restore();return true;
}
export function aaMuzzle(e,size=66,kind='aa'){
 const x=e.x||0,y=e.y||0;
 const id=selectAAArt(e,kind),m=AIR_THREAT_ASSETS[id];if(!m)return {x,y};
 const k=size/Math.max(m.width,m.height),p=m.muzzleNormalized||[.5,.5];
 return {x:x+(p[0]-.5)*m.width*k,y:y+(p[1]-.5)*m.height*k};
}

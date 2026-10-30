import {CAPITAL_BOSS_ART} from './capital-boss-art.js';
import {capitalPartPose} from './capital-bosses.js';

const images=new Map(),pending=new Map();
export const isCapitalBoss=id=>Object.hasOwn(CAPITAL_BOSS_ART,id);
function load(source){
 if(pending.has(source))return pending.get(source);
 if(typeof Image==='undefined')return Promise.resolve(false);
 const image=new Image();image.decoding='async';images.set(source,image);
 const promise=new Promise(resolve=>{image.onload=()=>Promise.resolve(image.decode?.()).catch(()=>{}).then(()=>resolve(image.naturalWidth>0));image.onerror=()=>resolve(false);});
 pending.set(source,promise);image.src=source;return promise;
}
export function prepareCapitalBossAssets(region){
 const id=region===11?'final-leviathan':region===18?'final-kaiserkrone':null;
 if(!id){images.clear();pending.clear();return Promise.resolve([]);}
 return Promise.all(Object.values(CAPITAL_BOSS_ART[id].images).map(load));
}
export function capitalBossExtents(body){
 const art=CAPITAL_BOSS_ART[body.kind||body.assetKey],scale=body.capitalScale||.6;
 return art?{halfWidth:art.width*scale/2,halfHeight:art.height*scale/2}:null;
}
// Art, collision and muzzles consume the same live part pose. No canvas copies,
// filters, replacement shapes or per-frame image decoding are used.
export function drawCapitalBoss(context,body,{effect=()=>false,defeat}={}){
 const art=CAPITAL_BOSS_ART[body.kind||body.assetKey];if(!art)return false;
 const scale=body.capitalScale||.6,parts=body.parts instanceof Map?body.parts:new Map((body.parts||[]).map(p=>[p.id||p.partId,p]));
 const age=defeat?.age??body.defeatAge??0,destroying=!!(body.destroying||defeat);
 context.save();context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
 // Falling shadow remains below all of the articulated painted components.
 if(destroying)context.globalAlpha*=Math.max(.35,1-age*.07);
 for(let index=0;index<art.parts.length;index++){
  const source=art.parts[index],part=parts.get(source.id);if(!part)continue;
  const pose=capitalPartPose(body,part),state=destroying&&age>index*.14?2:pose.state;
  const image=images.get(art.images[source.atlas]);if(!image?.naturalWidth)continue;
  let [sx,sy,sw,sh]=source.frames[state]||source.frames[0];
  const pivot=source.framePivots?.[state]||source.pivot||[.5,.5];
  let width=source.w*scale,height=source.h*scale;
  if(source.preserveAspect!==false){const fit=Math.min(width/sw,height/sh);width=sw*fit;height=sh*fit;}
  let dx=-width*pivot[0],dy=-height*pivot[1],drawWidth=width;
  if(source.sourceHalf){if(source.sourceHalf==='right'){sx+=sw/2;dx+=width/2;}sw/=2;drawWidth/=2;}
  const fall=destroying?Math.min(1,Math.max(0,age-1.4)/4.6):0;
  context.save();context.globalAlpha*=pose.alpha??1;context.translate(pose.x,pose.y+fall*(source.kind==='structure'?38:22));context.rotate(pose.angle);
  context.scale((pose.scaleX??1)*(1-fall*.09),1-fall*.09);
  context.drawImage(image,sx,sy,sw,sh,dx,dy,drawWidth,height);context.restore();
  if(part.hitFlash>0)effect(context,'metalShard0',pose.x,pose.y,32,32,pose.angle,Math.min(.8,part.hitFlash*4));
  if(source.kind==='engine'&&state>0){
   const drift=((body.motionTime||0)*.65+index*.17)%1;
   effect(context,state===2?'smokeDark':'smokeOil',pose.x,pose.y-drift*65,24+drift*35,30+drift*50,0,(1-drift)*.44);
  }
  const recoil=source.kind==='barrel'?(parts.get(source.parent)?.recoil||0):0;
  if(source.kind==='barrel'&&recoil>0&&!part.destroyed){
   const muzzle=source.muzzle||[0,-64],cos=Math.cos(pose.angle),sin=Math.sin(pose.angle);
   const x=pose.x+(muzzle[0]*cos-muzzle[1]*sin)*scale,y=pose.y+(muzzle[0]*sin+muzzle[1]*cos)*scale;
   effect(context,'muzzle',x,y,46,36,pose.angle-Math.PI/2,Math.min(1,recoil*5));
  }
 }
 if(destroying){
  for(let i=0;i<5;i++){const q=age-i*.43;if(q<0||q>1.1)continue;const a=i*2.4,x=body.x+Math.cos(a)*120,y=body.y+Math.sin(a)*170;
   effect(context,'fire',x,y,110+q*60,110+q*60,a,Math.max(0,1-q));}
 }
 context.restore();return true;
}

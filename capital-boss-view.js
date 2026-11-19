import {CAPITAL_BOSS_ART} from './capital-boss-art.js';
import {capitalPartPose,capitalMuzzle} from './capital-bosses.js';

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
 if(!art)return null;
 const x=art.width*scale/2,y=art.height*scale/2,c=Math.abs(Math.cos(body.hullYaw||0)),s=Math.abs(Math.sin(body.hullYaw||0));
 return {halfWidth:x*c+y*s,halfHeight:x*s+y*c};
}
// A propeller turns around the engine's fore-aft axis. Its blades project onto
// that engine's cross-axis in top view, while the painted hub stays fixed.
function drawAxialPropeller(c,image,sx,sy,sw,sh,width,height,pivot,phase,direction){
 const hubX=sw*pivot[0],hubHalf=Math.round(Math.min(sh*.27,sw*.16));
 const left=Math.round(hubX)-hubHalf,right=Math.round(hubX)+hubHalf,scale=width/sw,dy=-height*pivot[1];
 const alpha=c.globalAlpha;
 for(let sample=1;sample>=0;sample--){
  const projected=Math.cos(phase-sample*direction*.58);
  const span=Math.sign(projected||1)*Math.max(.045,Math.abs(projected));
  c.save();c.globalAlpha=alpha*(sample?.23:.94);c.scale(span,1);
  // Extend each blade under the hub so it never separates at zero projected span.
  c.drawImage(image,sx,sy,left+2,sh,-hubX*scale,dy,(left+2)*scale,height);
  c.drawImage(image,sx+right-2,sy,sw-right+2,sh,(right-2-hubX)*scale,dy,(sw-right+2)*scale,height);
  c.restore();
 }
 c.drawImage(image,sx+left,sy,right-left,sh,(left-hubX)*scale,dy,(right-left)*scale,height);
}
// Art, collision and muzzles consume the same live part pose.
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
  context.scale(1-fall*.09,1-fall*.09);
  if(source.kind==='propeller'&&state<2&&!body.dead){
   const direction=source.x<0?1:-1;
   drawAxialPropeller(context,image,sx,sy,sw,sh,width,height,pivot,(part.propellerAngle||0)*direction,direction);
  }else for(const offset of source.barrelOffsets||[0])context.drawImage(image,sx,sy,sw,sh,dx+offset*scale,dy,drawWidth,height);
  context.restore();
  if(part.hitFlash>0){
   const wingOffset=source.kind==='structure'&&source.sourceHalf?width*(source.sourceHalf==='left'?-.25:.25):0;
   effect(context,'metalShard0',pose.x+Math.cos(pose.angle)*wingOffset,pose.y+Math.sin(pose.angle)*wingOffset,32,32,pose.angle,Math.min(.8,part.hitFlash*4));
  }
  if(source.kind==='engine'&&state>0){
   const drift=((body.motionTime||0)*.65+index*.17)%1;
   const aft=drift*(state===2?92:65);
   effect(context,state===2?'smokeDark':'smokeOil',pose.x-Math.sin(pose.angle)*aft,pose.y+Math.cos(pose.angle)*aft,24+drift*35,30+drift*50,pose.angle,(1-drift)*.44);
  }
  const recoil=source.kind==='barrel'?(parts.get(source.parent)?.recoil||0):0;
  if(source.kind==='barrel'&&recoil>0&&!part.destroyed&&!part.disabled){
   const mount=parts.get(source.parent);
   if(mount)for(const offset of source.barrelOffsets||[0]){
    const muzzle=capitalMuzzle(body,mount,undefined,offset);
    effect(context,'muzzle',muzzle.x,muzzle.y,46,36,muzzle.angle,Math.min(1,recoil*5));
   }
  }
 }
 if(destroying){
  for(let i=0;i<5;i++){const q=age-i*.43;if(q<0||q>1.1)continue;const a=i*2.4,x=body.x+Math.cos(a)*120,y=body.y+Math.sin(a)*170;
   effect(context,'fire',x,y,110+q*60,110+q*60,a,Math.max(0,1-q));}
 }
 context.restore();return true;
}

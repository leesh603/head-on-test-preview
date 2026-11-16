import {drawRIIIntrusion,drawRIIIntrusionBombs} from './rii-intrusion.js';
import {drawV1500Boss,drawV1500Bombs} from './v1500-render.js';
import {submarineLayers} from './submarine-intrusion.js';
import {maritimeReveal} from './maritime-intrusion.js';
import { intrusionLayout } from './intrusion-boss-layouts.js';
export { intrusionLayout, profileLayout } from './intrusion-boss-layouts.js';
const banks=new Map();
function browserLoader(src){return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error(`Intrusion texture failed: ${src}`));i.src=src;});}
/** One decoded image per unique lossless texture. Reject failures; never draw a placeholder. */
export function prepareIntrusionArt(id,options={}){
 const layout=intrusionLayout(id);if(!layout)return Promise.reject(new Error(`Unknown intrusion boss: ${id}`));
 if(banks.has(layout.id))return banks.get(layout.id).promise;
 const entry={images:new Map(),detachedWings:new Map(),ready:false,promise:null};banks.set(layout.id,entry);
 const paths=new Set(layout.parts.flatMap(p=>Object.values(p.states).filter(Boolean).map(s=>s.src)));
 for(const src of layout.extraAssets||[])paths.add(src);
 if(layout.submarineArt)for(const key of ['surface','diving','periscope'])if(layout.submarineArt[key])paths.add(layout.submarineArt[key]);
 if(layout.profileArt)paths.add(layout.profileArt);
 if(layout.cutin)paths.add(layout.cutin);
 entry.promise=Promise.all([...paths].map(async src=>{const im=await(options.loadImage||browserLoader)((options.baseUrl||'')+src);if(banks.get(layout.id)===entry)entry.images.set(src,im);else im.close?.();})).then(()=>{if(banks.get(layout.id)===entry)entry.ready=true;return entry;}).catch(error=>{if(banks.get(layout.id)===entry)banks.delete(layout.id);throw error;});return entry.promise;
}
// Preserve a bank already warming in the host while retiring the previous encounter.
export function releaseIntrusionArt(...keepIds){const keep=new Set(keepIds.map(id=>intrusionLayout(id)?.id));for(const [id,e] of banks){if(keep.has(id))continue;banks.delete(id);for(const im of e.images.values())im.close?.();e.images.clear();e.detachedWings.clear();e.ready=false;}}
export function intrusionArtReady(id){return !!banks.get(intrusionLayout(id)?.id)?.ready;}
export function intrusionPartState(encounter,group){
 const v=encounter.damage?.[group]??encounter.parts?.[group];
 if(typeof v==='string')return v;
 if(v?.state)return v.state;
 if(v?.destroyed||v?.hp<=0)return 'destroyed';
 if(v&&Number.isFinite(v.hp)&&Number.isFinite(v.maxHp)&&v.hp<v.maxHp*.55)return 'damaged';
 return 'intact';
}
function detachedWing(bank,part){
 if(bank.detachedWings.has(part))return bank.detachedWings.get(part);
 const full=part.states.intact,stub=part.states.destroyed;
 if(!full||!stub||full.src===stub.src||typeof document==='undefined')return null;
 const original=bank.images.get(full.src),remaining=bank.images.get(stub.src);
 if(!original||!remaining)return null;
 const canvas=document.createElement('canvas');
 [canvas.width,canvas.height]=full.drawSize||[full.width,full.height];
 const c=canvas.getContext('2d'),x=stub.x-stub.pivot[0]-full.x+full.pivot[0],y=stub.y-stub.pivot[1]-full.y+full.pivot[1];
 if(stub.bounds){
  const left=full.x<0,edge=x+stub.bounds[left?0:2],seam=canvas.width*.14;
  // Keep gaps inside the surviving wing out of the separated panel.
  c.beginPath();c.rect(left?0:edge-seam,0,left?edge+seam:canvas.width-edge+seam,canvas.height);c.clip();
 }
 c.drawImage(original,0,0,canvas.width,canvas.height);
 c.globalCompositeOperation='destination-out';
 // Remove the antialiased fringe of the remaining wing, too.
 for(let i=0;i<3;i++)c.drawImage(remaining,x,y,...(stub.drawSize||[stub.width,stub.height]));
 bank.detachedWings.set(part,canvas);
 return canvas;
}

/** World-space pieces use the original painted modules and the pose at impact. */
export function drawIntrusionDebris(c,e,point,z){
 const layout=intrusionLayout(e.profileId),bank=layout&&banks.get(layout.id);
 if(!bank?.ready)return;
 const now=e.visualTime??e.age??0;
 for(const p of layout.parts){
  if(!['wing','engine','float'].includes(p.kind))continue;
  const state=e.parts?.[p.group],age=now-state?.brokenAt,pose=state?.breakPose;
  if(!(age>=0&&age<.85)||!pose)continue;
  const full=p.states.intact;
  const lost=p.kind==='wing'?detachedWing(bank,p):
   (p.states.destroyed===null||p.dependencies.some(id=>intrusionPartState(e,id)==='destroyed')?bank.images.get(full?.src):null);
  if(!lost||!full)continue;
  const a=pose.a+Math.PI/2,cs=Math.cos(a),sn=Math.sin(a),side=Math.sign(full.x||p.x||1);
  const x=e.scale*full.x+(p.kind==='wing'?52:28)*side*age,y=e.scale*full.y+age*32+age*age*32;
  const at=point(pose.x+x*cs-y*sn,pose.y+x*sn+y*cs);
  const scale=e.scale*z*(p.spriteScale||1)*(1-age*.19);
  c.save();c.translate(at.x,at.y);c.rotate(a+p.angle+side*age*.98);c.scale(scale,scale);
  c.globalAlpha*=Math.min(1,1.2-age*1.35);
  c.drawImage(lost,-full.pivot[0],-full.pivot[1],...(full.drawSize||[full.width,full.height]));
  c.restore();
 }
}
/** point is screen center, scale is screen pixels per source pixel. Heading a=0 is east. */
export function drawIntrusionBoss(ctx,encounter,point,scale){
 const layout=intrusionLayout(encounter.profileId||encounter.bossId||encounter.id),bank=layout&&banks.get(layout.id);
 if(!layout?.enabled||!bank?.ready||!Number.isFinite(scale)||scale<=0)return false;
 const radius=Math.hypot(layout.width,layout.height)*scale*.5;
 const cw=ctx.canvas?.width,ch=ctx.canvas?.height;
 if(cw&&ch&&(point.x+radius<0||point.y+radius<0||point.x-radius>cw||point.y-radius>ch))return false;
 if(layout.id==='linke-hofmann-r-ii')return drawRIIIntrusion(ctx,encounter,point,scale,bank.images);
 if(layout.id==='handley-page-v1500')return drawV1500Boss(ctx,encounter,point,scale,bank.images);
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.translate(point.x,point.y);ctx.rotate((encounter.a??-Math.PI/2)+Math.PI/2);ctx.scale(scale,scale);
 const t=encounter.visualTime??encounter.elapsed??encounter.age??0;
 if(layout.submarineArt){const art=layout.submarineArt;for(const [key,alpha] of Object.entries(submarineLayers(encounter))){const image=bank.images.get(art[key]);if(alpha>0&&image){ctx.save();ctx.globalAlpha*=alpha;ctx.drawImage(image,-art.width/2,-art.height/2,art.width,art.height);ctx.restore();}}if(!art.separated){ctx.restore();return true;}}
 for(const p of layout.parts){
  if(layout.submarineArt?.separated&&p.kind==='base')continue;
  if(p.dependencies.some(d=>intrusionPartState(encounter,d)==='destroyed'))continue;
  const state=intrusionPartState(encounter,p.group);
  // Missing state falls back only for non-destructible fixed base. Explicit null hides a module.
  const spec=Object.hasOwn(p.states,state)?p.states[state]:p.states.intact;
  if(!spec)continue;const image=bank.images.get(spec.src);if(!image)continue;
  let delta=(p.kind==='barrel'||p.rotatesWithTurret)?(state==='destroyed'&&p.destroyedRotates===false?(encounter.destroyedTurretAngles?.[p.group]??encounter.turretAngles?.[p.group]??0):(encounter.turretAngles?.[p.group]??0)):0;
  delta=Math.max(-p.arc,Math.min(p.arc,delta));
  ctx.save();ctx.translate(spec.x,spec.y);ctx.rotate(p.angle+delta);
  if(layout.submarineArt?.separated){
   const layers=submarineLayers(encounter),visibility=layers.surface+layers.diving*.65;
   if(p.kind==='submarine_periscope'){
    const destroyed=state==='destroyed';ctx.globalAlpha*=destroyed?Math.min(1,visibility):1;
    if(!destroyed){ctx.rotate(encounter.naval?.periscopeAngle||0);ctx.translate(0,-12*(layers.periscope||0));}
   }else{ctx.globalAlpha*=Math.min(1,visibility);if(p.group==='deck_gun'&&state!=='destroyed')ctx.translate(0,(encounter.naval?.gunRecoil||0)*(layout.id==='m1'?24:12));}
  }

  if(p.revealOnly)ctx.globalAlpha*=maritimeReveal(encounter);
  if(p.concealment){const reveal=maritimeReveal(encounter);ctx.globalAlpha*=1-reveal;ctx.translate((p.openOffset?.[0]||0)*reveal,(p.openOffset?.[1]||0)*reveal);}
  // Projected axial propeller: blade span contracts; it must not become an overhead rotor.
  if(p.kind==='propeller'&&state!=='destroyed'&&!(p.stopWhenParentDestroyed||[]).some(id=>intrusionPartState(encounter,id)==='destroyed'))ctx.scale(Math.max(.12,Math.abs(Math.cos(t*23+p.phase))),1);
  if(p.spriteScale)ctx.scale(p.spriteScale,p.spriteScale);
  if(spec.drawSize)ctx.drawImage(image,-spec.pivot[0],-spec.pivot[1],...spec.drawSize);else ctx.drawImage(image,-spec.pivot[0],-spec.pivot[1]);
  // Hit flash: the struck module brightens for a moment (additive redraw of its own image).
  const fl=encounter.flash?.[p.group];if(fl>0&&state!=='destroyed'){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.min(1,fl/.12)*.85;if(spec.drawSize)ctx.drawImage(image,-spec.pivot[0],-spec.pivot[1],...spec.drawSize);else ctx.drawImage(image,-spec.pivot[0],-spec.pivot[1]);ctx.globalAlpha*=.6;if(spec.drawSize)ctx.drawImage(image,-spec.pivot[0],-spec.pivot[1],...spec.drawSize);else ctx.drawImage(image,-spec.pivot[0],-spec.pivot[1]);}
  ctx.restore();
 }
 ctx.restore();return true;
}
/** Local muzzle position follows exactly the same independent barrel pivot as rendering. */
export function intrusionMuzzle(layoutId,group,delta=0,barrelIndex=0){
 const p=intrusionLayout(layoutId)?.parts.find(p=>p.muzzle&&p.group===group);if(!p?.muzzle)return null;
 delta=Math.max(-p.arc,Math.min(p.arc,delta));const m=p.muzzles?.[Math.abs(Math.trunc(barrelIndex))%p.muzzles.length]||p.muzzle,c=Math.cos(delta),s=Math.sin(delta),x=m.x-p.x,y=m.y-p.y;
 return {x:p.x+x*c-y*s,y:p.y+x*s+y*c,angle:m.angle+delta,arc:p.arc};
}


export function drawIntrusionOrdnance(c,e,point,z){const bank=banks.get(e.profileId);if(e.profileId==='linke-hofmann-r-ii'&&bank?.ready)drawRIIIntrusionBombs(c,e,point,z,bank.images);if(e.profileId==='handley-page-v1500'&&bank?.ready)drawV1500Bombs(c,e,point,z,bank.images);}

import {maritimeReveal} from './maritime-intrusion.js?v=capital-final-20261030';
import { intrusionLayout } from './intrusion-boss-layouts.js?v=capital-final-20261030';
export { intrusionLayout, profileLayout } from './intrusion-boss-layouts.js?v=capital-final-20261030';
const banks=new Map();
let generation=0;
function browserLoader(src){return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error(`Intrusion texture failed: ${src}`));i.src=src;});}
/** One decoded image per unique lossless texture. Reject failures; never draw a placeholder. */
export function prepareIntrusionArt(id,options={}){
 const layout=intrusionLayout(id);if(!layout)return Promise.reject(new Error(`Unknown intrusion boss: ${id}`));
 if(banks.has(layout.id))return banks.get(layout.id).promise;
 const epoch=generation,entry={images:new Map(),ready:false,promise:null};banks.set(layout.id,entry);
 const paths=new Set(layout.parts.flatMap(p=>Object.values(p.states).filter(Boolean).map(s=>s.src)));
 if(layout.profileArt)paths.add(layout.profileArt);
 if(layout.cutin)paths.add(layout.cutin);
 entry.promise=Promise.all([...paths].map(async src=>{const im=await(options.loadImage||browserLoader)((options.baseUrl||'')+src);if(epoch===generation)entry.images.set(src,im);})).then(()=>{if(epoch===generation)entry.ready=true;return entry;}).catch(error=>{if(banks.get(layout.id)===entry)banks.delete(layout.id);throw error;});return entry.promise;
}
export function releaseIntrusionArt(){generation++;for(const e of banks.values())for(const im of e.images.values())if(typeof im.close==='function')im.close();banks.clear();}
export function intrusionArtReady(id){return !!banks.get(intrusionLayout(id)?.id)?.ready;}
export function intrusionPartState(encounter,group){
 const v=encounter.damage?.[group]??encounter.parts?.[group];
 if(typeof v==='string')return v;
 if(v?.state)return v.state;
 if(v?.destroyed||v?.hp<=0)return 'destroyed';
 if(v&&Number.isFinite(v.hp)&&Number.isFinite(v.maxHp)&&v.hp<v.maxHp*.55)return 'damaged';
 return 'intact';
}
/** point is screen center, scale is screen pixels per source pixel. Heading a=0 is east. */
export function drawIntrusionBoss(ctx,encounter,point,scale){
 const layout=intrusionLayout(encounter.profileId||encounter.bossId||encounter.id),bank=layout&&banks.get(layout.id);
 if(!layout?.enabled||!bank?.ready||!Number.isFinite(scale)||scale<=0)return false;
 const radius=Math.hypot(layout.width,layout.height)*scale*.5;
 const cw=ctx.canvas?.width,ch=ctx.canvas?.height;
 if(cw&&ch&&(point.x+radius<0||point.y+radius<0||point.x-radius>cw||point.y-radius>ch))return false;
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.translate(point.x,point.y);ctx.rotate((encounter.a??-Math.PI/2)+Math.PI/2);ctx.scale(scale,scale);
 const t=encounter.visualTime??encounter.elapsed??encounter.age??0;
 for(const p of layout.parts){
  if(p.dependencies.some(d=>intrusionPartState(encounter,d)==='destroyed'))continue;
  const state=intrusionPartState(encounter,p.group);
  // Missing state falls back only for non-destructible fixed base. Explicit null hides a module.
  const spec=Object.hasOwn(p.states,state)?p.states[state]:p.states.intact;
  if(!spec)continue;const image=bank.images.get(spec.src);if(!image)continue;
  let delta=(state!=='destroyed'||p.destroyedRotates!==false)&&(p.kind==='barrel'||p.rotatesWithTurret)?(encounter.turretAngles?.[p.group]??0):0;
  delta=Math.max(-p.arc,Math.min(p.arc,delta));
  ctx.save();ctx.translate(spec.x,spec.y);ctx.rotate(p.angle+delta);
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

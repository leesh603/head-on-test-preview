// Existing aircraft pixels only: localized cockpit/cowling adjustment, no
// external item, particles, light wash or change to the aircraft's world pose.
let nacelle,rotary;
const load=(file,set)=>new Promise(resolve=>{if(typeof Image==='undefined'){resolve(false);return;}const im=new Image();im.onload=()=>{set(im);resolve(true)};im.onerror=()=>resolve(false);im.src=new URL(file,import.meta.url).href;});
export const internalRepairArtReady=Promise.all([
 load('./asset-bank/outlined/native/boss-staaken-engines352.webp',im=>nacelle=im),
 load('./sortie-aircraft/flight/mccudden_dh2.webp',im=>rotary=im)
]);
export function internalRepairPose(p,elapsed){
 const r=p.mccuddenInternalRepair,age=elapsed??((p.t||0)-(r?.at??-Infinity));
 if(p.pilot!=='mccudden'||!(p.hp>0)||p.status==='downed'||p.heineckeEscape>0||!r||age<0||age>=r.duration)return null;
 const q=age/r.duration,settle=Math.max(0,1-q),stroke=Math.sin(Math.min(1,q/.82)*Math.PI*4)*Math.min(1,(1-q)*5);
 return {q,stroke,healed:r.healDelta>0};
}
const replicaClocks=new WeakMap();
export function internalRepairDisplayPose(p,now=globalThis.performance?.now?.()??0){
 if(!p.world?.online||p.world.host)return internalRepairPose(p);
 const r=p.mccuddenInternalRepair,received=(p.t||0)-(r?.at??-Infinity);
 if(!r||received<0){replicaClocks.delete(p);return null;}
 if(p.pilot!=='mccudden'||p.hp<=0||p.status==='downed'){replicaClocks.set(p,{at:r.at,seenAt:now,age:r.duration,last:r.duration});return null;}
 let clock=replicaClocks.get(p);
 if(!clock||clock.at!==r.at){clock={at:r.at,seenAt:now,age:received,last:received};replicaClocks.set(p,clock);}
 const age=Math.max(clock.last,received,clock.age+Math.max(0,now-clock.seenAt)/1000);clock.last=age;
 // Retain the bounded expired receipt until a different activation arrives:
 // repeating a stale network packet must not replay a completed repair.
 return internalRepairPose(p,age);
}
export function cowlRepairPose(p,phase){
 const q=phase||internalRepairDisplayPose(p);if(!q)return null;
 const open=q.q<.24?q.q/.24:q.q<.68?1:Math.max(0,(1-q.q)/.32);
 return {...q,open,hinge:Math.cos(open*Math.PI*.79),spark:q.healed&&((q.q>.31&&q.q<.39)||(q.q>.55&&q.q<.63))};
}
export function drawInternalRepair(c,p,x,y,paintPlane,key,spark){
 const q=cowlRepairPose(p);if(!q||p.bomberTransfer||!nacelle)return false;
 const dh2=key==='mccudden_dh2';if(key!=='mccudden_se5a'&&!dh2||dh2&&!rotary)return false;
 const cy=dh2?-3.5:-19,h=dh2?10:16,w=8,fade=Math.min(1,q.q*15,(1-q.q)*15);
 c.save();c.translate(x,y);c.rotate((p.a||0)+Math.PI/2);c.scale(p.aceScale129||1,p.aceScale129||1);c.globalAlpha*=fade;
 // Authored transparent engine silhouette, not a rectangular colour patch.
 if(dh2)c.drawImage(rotary,126,125,37,29,-w/2,cy-h/2,w,h);
 else c.drawImage(nacelle,47,29,32,47,-w/2,cy-h/2,w,h);
 if(q.spark&&spark){c.save();c.beginPath();c.rect(-3,cy-h/2+2,6,h-4);c.clip();spark(c,'spark',0,cy,9,9,0,.85);c.restore();}
 // One physical edge stays fixed at x=-4 throughout opening and closing.
 // This is the original olive access panel with alpha silhouette, not a UI icon.
 c.save();c.translate(-w/2,cy-h/2);c.scale(q.hinge,1);c.drawImage(nacelle,47,74,32,40,0,0,w,h);c.restore();
 c.restore();return true;
}

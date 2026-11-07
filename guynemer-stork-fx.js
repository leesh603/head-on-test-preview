// A brief Cigognes mark at the aircraft centre on the local foreground pass.
let stork;
export const guynemerStorkReady=new Promise(resolve=>{
 if(typeof Image==='undefined'){resolve(false);return;}
 stork=new Image();stork.onload=()=>resolve(true);stork.onerror=()=>resolve(false);
 stork.src=new URL('./squadron-emblems/cigognes.webp',import.meta.url).href;
});
const clamp=n=>Math.max(0,Math.min(1,n));
export function guynemerStorkPose(p){
 const f=p.pilotSignatureState?.guynemerBarrage;
 if(p.pilot!=='guynemer'||p.state!=='playing'||!(p.hp>0)||p.status==='downed'||!f)return null;
 const age=f.clock-f.start;
 if(!Number.isFinite(age)||age<0||age>=.96)return null;
 const entry=clamp(age/.08),fade=clamp((.96-age)/.22);
 return {x:0,y:0,a:Math.PI,size:26+10*entry,alpha:.78*entry*fade};
}
export function drawGuynemerStork(c,p){
 const v=guynemerStorkPose(p);if(!v||!v.alpha||!stork?.complete||!stork.naturalWidth)return;
 const h=v.size*stork.naturalHeight/stork.naturalWidth;
 c.save();try{
  c.translate(v.x,v.y);c.rotate(v.a);
  c.globalAlpha*=v.alpha;c.shadowColor='rgba(23,19,15,.85)';c.shadowBlur=2;
  c.drawImage(stork,-v.size/2,-h/2,v.size,h);
 }finally{c.restore();}
}

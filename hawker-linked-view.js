// Visual-only next-target handoff. Never creates or extends a combat link.
const clamp=n=>Math.max(0,Math.min(1,n));
const live=p=>p?.hp>0&&p.status!=='downed'&&(p.state===undefined||p.state==='playing');
let image,pending=null,retryAt=0;
// Eager module preload, then quiet bounded-frequency retries after a load failure.
// Drawing while pending omits this visual only; combat always keeps running.
export function warmHawkerLinkedArt(){
 if(image?.complete&&image.naturalWidth)return Promise.resolve(true);
 if(pending)return pending;
 if(typeof Image==='undefined'||Date.now()<retryAt)return Promise.resolve(false);
 const next=new Image();image=next;
 pending=new Promise(resolve=>{
  next.onload=()=>{retryAt=0;resolve(true);};
  next.onerror=()=>{retryAt=Date.now()+5000;resolve(false);};
  next.src=new URL('./pilot-material-art/hawker-link-sight.webp',import.meta.url).href;
 }).finally(()=>{pending=null;});
 return pending;
}
export const hawkerLinkedArtReady=warmHawkerLinkedArt();
// Match the combat link's range against the exposed native part of large bosses.
export const hawkerLinkedPoint=(p,e)=>e.stageBossBody?(p.tacticalWingAim?.(p,e)||e):e;
export function hawkerLinkedDistance(p,e){const q=hawkerLinkedPoint(p,e);return Math.hypot(q.x-p.x,q.y-p.y);}
export function hawkerLinkedTargetPose(w,e,scale=1){
 if(!live(e)||e.crashing||e.crashed||e.expired||e.rivalEscaped||e.combatLayer!=='air'&&(e.surface||e.fieldUnit||e.stageBossBody||e.navalVessel))return null;
 let selected=null;
 for(const p of w.players||[w]){
  if(!live(p)||p.pilot!=='hawker'||p.hawkerNext!==e||!(p.hawkerLinkTime>0)||hawkerLinkedDistance(p,e)>500)continue;
  if(!selected||(p.skillTime>0&&!(selected.skillTime>0))||((p.skillTime>0)===(selected.skillTime>0)&&p.hawkerLinkTime>selected.hawkerLinkTime))selected=p;
 }
 if(!selected)return null;
 const active=selected.skillTime>0,duration=selected.hawkerLinkDuration||Math.max(selected.hawkerLinkTime,active?(selected.skillEnhanced?2.2:1.8):1.2),age=Math.max(0,duration-selected.hawkerLinkTime),settle=1-clamp(age/.16),fade=clamp(age/.035)*clamp(selected.hawkerLinkTime/.16);
 const point=hawkerLinkedPoint(selected,e);
 return {x:(point.x-e.x)*scale,y:(point.y-e.y)*scale,ownerId:selected.id??'p1',active,width:(active?90+settle*8:90)*scale,height:(active?90+settle*8:90)*scale,alpha:(active?.95:.46)*fade,angle:0};
}
export function drawHawkerLinkedTarget(c,w,e,scale=1){
 const q=hawkerLinkedTargetPose(w,e,scale);if(!q)return false;
 if(!image?.complete||!image.naturalWidth){warmHawkerLinkedArt();return false;}
 c.save();try{c.globalAlpha*=q.alpha;c.drawImage(image,q.x-q.width/2,q.y-q.height/2,q.width,q.height);}finally{c.restore();}return true;
}


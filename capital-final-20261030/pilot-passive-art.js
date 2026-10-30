// Dedicated raster identities. Reads combat state; visual phases live in WeakMaps.
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const smooth=n=>{const q=clamp(n);return q*q*(3-2*q)};
const live=p=>p?.hp>0&&p.status!=='downed'&&(p.state===undefined||p.state==='playing');
const time=p=>p.pilotSignatureState?.clock??p.t??0;
const catalog=Object.freeze({
 rickenbacker:{file:'https://head-on-aces.justzeon.chatgpt.site/rickenbacker.webp',rect:[0,0,512,134],cache:512},
 immelmann:{file:'https://head-on-aces.justzeon.chatgpt.site/immelmann.webp',rect:[0,0,512,209],cache:512},
 hawker:{file:'https://head-on-aces.justzeon.chatgpt.site/hawker.webp',rect:[0,0,473,512],cache:256},
 bishop:{file:'https://head-on-aces.justzeon.chatgpt.site/bishop.webp',sheet:true,cache:256},
 jacobs:{file:'https://head-on-aces.justzeon.chatgpt.site/jacobs.webp',sheet:true,cache:256},
 gontermann:{file:'https://head-on-aces.justzeon.chatgpt.site/gontermann.webp',sheet:true,cache:256}
});
const textures=new Map(),visual=new WeakMap();
export function warmPilotPassiveArt(id){
 const spec=catalog[id];if(!spec||typeof Image==='undefined'||typeof document==='undefined')return Promise.resolve(false);
 if(textures.has(id))return textures.get(id).promise;
 const item={frames:null,promise:null};textures.set(id,item);
 item.promise=new Promise(resolve=>{const im=new Image();
  im.onload=()=>{try{
   const boxes=spec.sheet?Array.from({length:4},(_,i)=>[(i%2)*im.naturalWidth/2,Math.floor(i/2)*im.naturalHeight/2,im.naturalWidth/2,im.naturalHeight/2]):[spec.rect];
   item.frames=boxes.map(([x,y,w,h])=>{const cv=document.createElement('canvas'),k=spec.cache/Math.max(w,h);cv.width=Math.max(1,Math.round(w*k));cv.height=Math.max(1,Math.round(h*k));const c=cv.getContext('2d');c.imageSmoothingEnabled=true;c.drawImage(im,x,y,w,h,0,0,cv.width,cv.height);return cv;});
   im.onload=im.onerror=null;resolve(true);
  }catch{item.frames=null;resolve(false);}};
  im.onerror=()=>resolve(false);im.src=new URL('./pilot-passive-art-20261027/'+spec.file,import.meta.url).href;
 });return item.promise;
}
export async function preloadPilotPassiveArt(ids){return Promise.all(ids.map(warmPilotPassiveArt));}
export function pilotPassiveArtStatus(id){const f=textures.get(id)?.frames;return {ready:!!f,frames:f?.length||0,pixels:f?.reduce((n,c)=>n+c.width*c.height,0)||0};}
function sprite(c,id,frame,x,y,width,height,a,alpha,anchor=[.5,.5],flipX=1,flipY=1){
 warmPilotPassiveArt(id);const im=textures.get(id)?.frames?.[frame];if(!im||!(alpha>0))return false;
 const k=Math.min(width/im.width,height/im.height),w=im.width*k,h=im.height*k;
 c.save();try{c.translate(x,y);c.rotate(a);c.scale(flipX,flipY);c.globalAlpha*=clamp(alpha);c.drawImage(im,-w*anchor[0],-h*anchor[1],w,h);}finally{c.restore();}return true;
}
function memo(p,key){const now=time(p);let s=visual.get(p);if(!s||s.key!==key||now<s.clock||s.owner!==(p.id??'p1')){s={key,clock:now,owner:p.id??'p1',value:0,changed:-Infinity,armed:now,direction:1};visual.set(p,s);}s.clock=now;return s;}
export function racerPassivePose(p,power){
 if(!live(p)||p.pilot!=='rickenbacker'||p.skillTime>0){visual.delete(p);return null;}
 const s=memo(p,'racer'),n=clamp(power),now=time(p);
 if(n!==s.value){s.previous=s.value;s.value=n;s.changed=now;}
 const age=now-s.changed,fade=n>0?1:clamp(1-age/.14);if(!fade)return null;
 const value=n||(s.previous||0),pulse=n>(s.previous||0)?1-smooth(age/.16):0;
 return {alpha:(.23+value*.31)*fade,span:90+value*14,scale:1+pulse*.065,x:-5,y:0,angle:-Math.PI/2};
}
export function drawRacerPassive(c,p,power){const q=racerPassivePose(p,power);return q?sprite(c,'rickenbacker',0,q.x,q.y,q.span*q.scale,52*q.scale,q.angle,q.alpha):false;}
export function immelmannPassivePose(p){
 if(!live(p)||p.pilot!=='immelmann'||p.immelmannTurn||p.skillTime>0){visual.delete(p);return null;}
 const s=memo(p,'eagle'),remaining=Math.max(0,p.eagleTime||0),now=time(p);
 if(remaining>s.value+.06){s.armed=now;s.direction=Math.sign(p.pilotSignatureState?.turnRate||0)||p.evadeDirection||1;}
 s.value=remaining;if(!remaining){s.armed=now;return null;}
 const age=now-s.armed,open=smooth(age/.18),gather=1-clamp((age-.35)/1.15)*.22;
 return {x:1,y:s.direction*25,width:90,height:45*(.3+.7*open)*gather,alpha:.34*clamp(remaining/.22),angle:s.direction*(.25*(1-open)+.07),direction:s.direction};
}
export function drawImmelmannPassive(c,p){const q=immelmannPassivePose(p);return q?sprite(c,'immelmann',0,q.x,q.y,q.width,q.height,q.angle,q.alpha,[0,.73],-1,-q.direction):false;}
export function hawkerPassivePose(w,e,scale=1){
 if(!(e?.hp>0)||e.crashing||e.crashed||e.expired||e.rivalEscaped||e.surface||e.fieldUnit||e.stageBossBody||e.navalVessel)return null;
 let remaining=0;for(const p of w.players||[w])if(live(p)&&p.pilot==='hawker'&&p.hawkerNext===e&&p.hawkerLinkTime>0&&Math.hypot(e.x-p.x,e.y-p.y)<=500)remaining=Math.max(remaining,p.hawkerLinkTime);
 if(!remaining)return null;const age=Math.max(0,.85-remaining),entry=smooth(age/.14),exit=clamp(remaining/.18);
 return {diameter:130*scale*(1+.25*(1-entry)+.08*(1-exit)),alpha:.92*clamp(age/.045)*exit,angle:-.21*(1-entry)};
}
// Call in screen/world coordinates OUTSIDE the enemy's bank/rotation transform.
export function drawHawkerPassive(c,w,e,x,y,scale=1){const q=hawkerPassivePose(w,e,scale);return q?sprite(c,'hawker',0,x,y,q.diameter,q.diameter,q.angle,q.alpha):false;}
export function bishopPassivePose(p,e){
 if(!live(p)||p.pilot!=='bishop'||e.kind!=='ordnanceCloseHit'||!(e.age>=0)||e.age>=.24)return null;
 for(const other of p.pilotSignatureState?.effects||[])if(other!==e&&other.kind===e.kind&&other.life>0&&other.age<e.age&&Math.hypot(other.x-e.x,other.y-e.y)<30)return null;
 const frame=e.age<.07?1:e.age<.15?2:3,power=clamp(e.power||0);
 return {frame,width:(38+power*8)/.62,alpha:clamp((.24-e.age)/.055),angle:e.a-p.a};
}
export function drawBishopPassive(c,p,e){const q=bishopPassivePose(p,e);return q?sprite(c,'bishop',q.frame,0,0,q.width,q.width,q.angle,q.alpha):false;}

// This is an effect on the genuinely suppressed target, not on any nearby plane.
export function jacobsPassivePose(w,e,scale=1){
 const now=w.t||0,remaining=(e?.pilotSuppressedUntil||0)-now;
 if(!(e?.hp>0)||e.crashing||e.crashed||e.expired||e.rivalEscaped||e.surface||e.fieldUnit||e.stageBossBody||e.navalVessel||e.pilotSuppressKind!=='jacobs'||!(remaining>0))return null;
 const age=Math.max(0,.85-remaining),frame=age<.10?0:age<.20?1:age<.40?2:3;
 return {frame,width:128*scale,alpha:.88*clamp(age/.07)*clamp(remaining/.16),angle:Math.PI/2};
}
// Enemy-local coordinates, already rotated with the airframe by both renderers.
export function drawJacobsPassive(c,w,e,scale=1){const q=jacobsPassivePose(w,e,scale);return q?sprite(c,'jacobs',q.frame,-7*scale,0,q.width,q.width,q.angle,q.alpha,[.5,.23]):false;}

export function gontermannPassivePose(p){
 const s=p.pilotIdentity?.five,target=s?.prepared,now=p.pilotIdentity?.clock??0,age=now-(s?.lastHit??-Infinity);
 if(!live(p)||p.pilot!=='gontermann'||!(target?.hp>0)||target.dead||target.destroyed||target.crashed||target.expired||target.rivalEscaped||!(s.hits>0)||age>=2.4)return null;
 const w=p.combatWorld?.()||p;let x=target.x,y=target.y,a=target.a||0;
 // Prepared boss parts use local coordinates; recover their production world anchor.
 for(const e of w.enemies||[]){const body=e.stageBossBody;if(!body||!body.parts||![...body.parts.values()].includes(target))continue;
  const part=body.support129?.parts?.get(target.id),point=part?body.support129.world(part.nx,part.ny):{x:body.x+target.x,y:body.y+target.y};
  x=point.x;y=point.y;a=e.a||0;break;
 }
 if(!Number.isFinite(x)||!Number.isFinite(y)||Math.hypot(x-p.x,y-p.y)>1200)return null;
 const hits=Math.min(3,s.hits),frame=hits<3?hits-1:(Math.floor(now*7)%3===2?3:2);
 return {x:x-p.x,y:y-p.y,frame,width:44+hits*6,alpha:(.55+hits*.08)*clamp((2.4-age)/.25),angle:a+Math.PI/2};
}
// The source sheet's wet root sits at .23/.16; keep it on the actual target.
export function drawGontermannPassive(c,p,shift={x:0,y:0}){const q=gontermannPassivePose(p);return q?sprite(c,'gontermann',q.frame,q.x+shift.x,q.y+shift.y,q.width,q.width,q.angle,q.alpha,[.23,.16]):false;}

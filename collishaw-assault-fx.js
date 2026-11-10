// Renderer-owned observations of the two real Black Flight attackers. No shots,
// flight changes or serialized particles; missing textures stay omitted by tex.
import {roleImage} from './fx-role3.js?v=b3bf991d11fc7798';
import {fxImage} from './fx-art.js?v=b3bf991d11fc7798';
const histories=new WeakMap(),clamp=n=>Math.max(0,Math.min(1,n));
export const COLLISHAW_WAKE_SECONDS=.36,COLLISHAW_GUN_SMOKE_SECONDS=.28;
export function clearCollishawAssault(p){histories.delete(p)}
const eligible=(p,w)=>w.ownerId===(p.id??'p1')&&w.permanent&&!w.aceWingman&&!w.weaponModFormation&&!w.tacticalWing&&!w.boelckePincer&&!w.orbit&&!w.carrierHidden&&!w.crashing&&!w.crashed&&w.life>0&&(w.hp==null||w.hp>0)&&(w.slot===0||w.slot===1)&&[w.x,w.y,w.a].every(Number.isFinite);
export function collishawAssaultSamples(p,wings){
 const s=p.pilotSignatureState,t=s?.clock;
 if(p.pilot!=='collishaw'||p.hp<=0||p.status==='downed'||p.state!=='playing'||!(p.skillTime>0)||!Number.isFinite(t)){histories.delete(p);return {active:false,wakes:[],plumes:[]}}
 let h=histories.get(p);
 if(!h||h.signature!==s||h.activation!==s.activation||h.owner!==p.id||t<h.clock||t-h.clock>.25){h={signature:s,activation:s.activation,owner:p.id,clock:t,wings:new Map()};histories.set(p,h)}
 h.clock=t;const selected=wings.filter(w=>eligible(p,w)).slice(0,2),kept=new Set(selected),wakes=[],plumes=[];
 for(const w of h.wings.keys())if(!kept.has(w))h.wings.delete(w);
 for(const w of selected){
  let r=h.wings.get(w);if(!r){r={poses:[],shots:[],flash:0};h.wings.set(w,r)}
  const last=r.poses.at(-1);
  if(last&&Math.hypot(w.x-last.x,w.y-last.y)>Math.max(28,(t-last.t)*500)){r.poses=[];r.shots=[];r.flash=w.muzzleFlash||0}
  if(!r.poses.length||t-r.poses.at(-1).t>=.03){const ca=Math.cos(w.a),sa=Math.sin(w.a);r.poses.push({t,x:w.x,y:w.y,tips:[-1,1].map(side=>({x:w.x-ca*8-sa*side*19,y:w.y-sa*8+ca*side*19}))})}
  r.poses=r.poses.filter(v=>t-v.t<=COLLISHAW_WAKE_SECONDS).slice(-12);
  const alpha=w.alpha==null?1:clamp(w.alpha);
  for(let i=1;i<r.poses.length;i++)for(let side=0;side<2;side++){
   if(Math.hypot(r.poses[i].x-r.poses[i-1].x,r.poses[i].y-r.poses[i-1].y)<.5)continue;
   const from=r.poses[i-1].tips[side],to=r.poses[i].tips[side],dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy);
   if(length<.4||length>24)continue;
   const fade=clamp(1-(t-r.poses[i].t)/COLLISHAW_WAKE_SECONDS);
   wakes.push({x:(from.x+to.x)/2,y:(from.y+to.y)/2,a:Math.atan2(dy,dx),length:length+5,width:5+fade*2,alpha:.42*fade*alpha});
  }
  const flash=Math.max(0,w.muzzleFlash||0),aim=w.fireHeading??w.muzzleAngle??w.a;
  if(flash>0&&flash>r.flash+.004)r.shots.push({t,x:w.x+Math.cos(aim)*26,y:w.y+Math.sin(aim)*26,a:aim,slot:w.slot});
  r.flash=flash;r.shots=r.shots.filter(v=>t-v.t<COLLISHAW_GUN_SMOKE_SECONDS).slice(-4);
  for(const shot of r.shots)plumes.push({...shot,age:t-shot.t,alpha});
 }
 return {active:true,wakes,plumes};
}
export function drawCollishawAssault(c,p,wings,tex,front=false){
 const samples=collishawAssaultSamples(p,wings);
 if(!samples.active)return;
 if(!front){for(const v of samples.wakes)material(c,tex,'windStreak',v.x-p.x,v.y-p.y,v.length,v.width,v.a,v.alpha,'#d6cfb8');return}
 for(const w of wings.filter(w=>eligible(p,w)).slice(0,2))if(w.muzzleFlash>0){
  const a=w.fireHeading??w.muzzleAngle??w.a,alpha=(w.alpha==null?1:clamp(w.alpha))*clamp(w.muzzleFlash/.055);
  material(c,tex,'muzzleTwin',w.x-p.x+Math.cos(a)*26,w.y-p.y+Math.sin(a)*26,32,14,a,.94*alpha,'#f2d69e');
 }
 for(const v of samples.plumes){
  const q=v.age/COLLISHAW_GUN_SMOKE_SECONDS,fade=(1-q)*(1-q),side=v.slot===0?1:-1;
  // Leave the gun gases where the gun actually fired; the aircraft flies out
  // of them. This is a brief gun puff, never healthy-engine damage smoke.
  const x=v.x-p.x-Math.cos(v.a)*q*7-Math.sin(v.a)*side*q*5,y=v.y-p.y-Math.sin(v.a)*q*7+Math.cos(v.a)*side*q*5;
  material(c,tex,'gunSmoke',x,y,23+q*19,13+q*9,v.a,.62*fade*v.alpha,'#aeb4b1');
 }
}
function material(c,tex,key,x,y,w,h,a,alpha,color){
 // Use the existing atlas's alpha-trimmed material, preserving its proportions.
 // Transparent cell padding must not turn a 3px wake into a subpixel line.
 const image=key==='muzzleTwin'?trimMuzzle():roleImage(key,true);if(!image){tex(c,key,x,y,w,h,a,alpha,color);return}
 const scale=Math.min(w/image.width,h/image.height),width=image.width*scale,height=image.height*scale;
 c.save();try{c.translate(x,y);c.rotate(a);c.globalAlpha*=alpha;c.drawImage(image,-width/2,-height/2,width,height)}finally{c.restore()}
}
let muzzleSource=null,muzzleStamp=null;
function trimMuzzle(){
 const source=fxImage('muzzleTwin');if(!source||typeof document==='undefined')return null;
 if(source===muzzleSource)return muzzleStamp;
 const width=source.naturalWidth||source.width,height=source.naturalHeight||source.height;if(!width||!height)return null;
 const cv=document.createElement('canvas');cv.width=width;cv.height=height;const c=cv.getContext('2d');c.drawImage(source,0,0);const pixels=c.getImageData(0,0,width,height).data;
 let left=width,top=height,right=0,bottom=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>8){left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1)}
 muzzleSource=source;if(right<=left||bottom<=top)return null;
 muzzleStamp=document.createElement('canvas');muzzleStamp.width=right-left;muzzleStamp.height=bottom-top;muzzleStamp.getContext('2d').drawImage(source,left,top,right-left,bottom-top,0,0,right-left,bottom-top);return muzzleStamp;
}

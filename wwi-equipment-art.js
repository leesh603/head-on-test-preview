import {equipmentFinishingArtReady} from './equipment-finishing-fx.js?v=equipmentfinishing20261030';
import {equipmentMountArtReady} from './equipment-mount-fx.js?v=equipmentmount20261030';
import {drawFlechetteTrail,equipmentDetailArtReady} from './equipment-detail-fx.js?v=equipmentdetail20261030';
import {equipmentExtensionArtReady} from './equipment-extension-fx.js?v=equipmentextension20261030';
import {drawWimperisSight,drawAirbrakePressure,drawVeryDesignation,equipmentSignatureArtReady} from './equipment-signature-fx.js?v=equipmentart20261030';
import {bombSprite} from './bomb-sprites.js?v=bomb20&perf=1029';
import {drawGameIcon} from './icons.js?v=buildfit1&afc=1&opt=1';
import {getLocale} from './i18n.js?v=buildfit1&afc=1&art=pilot-recovery2';
import {WWI_FRAMES} from './wwi-equipment-art-data.js';
import {GRAPNEL_FRAMES} from './fiery-grapnel-art-data.js';
import {drawIncendiaryFire,incendiaryArtReady} from './incendiary-fire.js';
import {wwiBurnPoint,wwiWingTarget,currentCameraCue,WWI_BALANCE,resolveWWITarget,equipmentTargets} from './wwi-equipment.js';
import {playerPose,applyPlayerAttitude} from './player-effects129.js?v=deathdefiance1&sig=1019&boss=20261020b&phase=1021&motion=20261022&cityart=20261022&momentum=20261027';

let atlas,bomb,brakePanel,grapnelAtlas;
const load=(file,set)=>new Promise(resolve=>{
 if(typeof Image==='undefined'){resolve(false);return;}
 const image=new Image();image.onload=()=>{set(image);resolve(true);};image.onerror=()=>resolve(false);image.src=new URL(file,import.meta.url).href;
});
export const equipmentArtReady=Promise.all([
 load('./wwi-equipment-atlas.webp',im=>atlas=im),load('./bomb-cooper-readable-q92.webp',im=>bomb=im),
 load('./strutter-airbrake-panel.webp',im=>brakePanel=im),load('./fiery-grapnel-20261028.webp',im=>grapnelAtlas=im),incendiaryArtReady,equipmentSignatureArtReady,equipmentExtensionArtReady,equipmentDetailArtReady,equipmentMountArtReady,equipmentFinishingArtReady
]).then(results=>results.every(Boolean));

function sprite(c,key,x,y,width,angle=0,alpha=1){
 const personal=GRAPNEL_FRAMES[key],f=personal||WWI_FRAMES[key],image=personal?grapnelAtlas:atlas;if(!image?.naturalWidth||!f)return;
 const height=width*f.h/f.w;c.save();c.globalAlpha*=alpha;c.translate(x,y);c.rotate(angle);c.imageSmoothingEnabled=true;
 c.drawImage(image,f.x,f.y,f.w,f.h,-width/2,-height/2,width,height);c.restore();
}
// Repeat the authored twisted-steel strip along a short curved tether.
export function drawGrapnelCable(c,x0,y0,x1,y1,z=1,sag=0){
 const f=GRAPNEL_FRAMES.grapnelCable;if(!grapnelAtlas?.naturalWidth)return;
 const dx=x1-x0,dy=y1-y0,length=Math.hypot(dx,dy);if(length<1)return;
 const nx=-dy/length,ny=dx/length,cx=(x0+x1)/2+nx*sag,cy=(y0+y1)/2+ny*sag;
 const steps=Math.min(24,Math.max(1,Math.ceil(length/(18*z)))),thickness=3.2*z;
 let px=x0,py=y0;c.save();c.imageSmoothingEnabled=true;
 for(let i=1;i<=steps;i++){const t=i/steps,u=1-t,x=u*u*x0+2*u*t*cx+t*t*x1,y=u*u*y0+2*u*t*cy+t*t*y1,d=Math.hypot(x-px,y-py);
  c.save();c.translate(px,py);c.rotate(Math.atan2(y-py,x-px));c.drawImage(grapnelAtlas,f.x,f.y,f.w,f.h,0,-thickness/2,d+.6*z,thickness);c.restore();px=x;py=y;
 }c.restore();
}
function grapnelSprite(c,key,x,y,width,a){sprite(c,key,x-Math.cos(a)*width*.475,y-Math.sin(a)*width*.475,width,a)}

function brackets(c,x,y,size,color){
 c.strokeStyle=color;c.lineWidth=1;c.beginPath();
 for(const side of [-1,1]){c.moveTo(x+side*size,y-size+3);c.lineTo(x+side*size,y-size);c.lineTo(x+side*(size-3),y-size);c.moveTo(x+side*size,y+size-3);c.lineTo(x+side*size,y+size);c.lineTo(x+side*(size-3),y+size);}
 c.stroke();
}

function hardware(c,image,x,y,width,height){
 if(!image?.naturalWidth)return;c.drawImage(image,x-width/2,y-height/2,width,height);
}

// Equipment stays inside the aircraft silhouette; show deployed ordnance
// instead of inventory boxes pasted over the tail and wings.
export function drawWWIEquipment(c,world,W,H,options={}){
 if(!world)return;
 const z=world.mode==='coop2'?(world.camera?.zoom||1):1,cx=world.x||0,cy=world.y||0;
 const sx=x=>(x-cx)*z+W/2,sy=y=>(y-cy)*z+H/2;
 const visible=(x,y,pad=90)=>Math.abs((x-cx)*z)<W/2+pad&&Math.abs((y-cy)*z)<H/2+pad;
 const players=world.players||[world];c.save();
 for(const p of players){
  if(!(p.hp>0)||p.status==='downed'||p.heineckeEscape>0)continue;
  const u=p.upgrades||{},pose=playerPose(p,p.x,p.y),fit=p.bomberTransfer;
  c.save();c.translate(sx(pose.x),sy(pose.y));c.scale(z*(pose.scale||1),z*(pose.scale||1));c.globalAlpha*=pose.alpha??1;applyPlayerAttitude(c,p,pose);
  const front=fit?Math.min(26,fit.hullLength*.2):8;
  if(u.strutterAirbrake&&!fit&&Number.isFinite(p.strutterBrakeAge)){
   const age=p.strutterBrakeAge,open=Math.min(1,age/.04)*Math.max(0,Math.min(1,(.34-age)/.12));
   // Root panels follow the aircraft pose and close with the braking interval.
   if(open>0)for(const wing of [-1,1])hardware(c,brakePanel,-5,wing*13,5+18*open,22);
   // Already in aircraft-local coordinates, so pass a zero heading.
   drawAirbrakePressure(c,p,0,0,{...options,local:true});
  }
  if(u.hytheCamera&&p.wwiHytheShutter>0)sprite(c,'hytheShutter',front+10,-5,36,0,Math.min(1,p.wwiHytheShutter*8));
  c.restore();
  const sight=p.wimperisCue;
  if(u.wimperisSight&&sight?.until>world.t&&visible(sight.x,sight.y)){
   drawWimperisSight(c,sx(sight.x),sy(sight.y),sight.until-world.t,options);
  }
  const cable=p.wwiGrapnelCable;
  if(cable?.life>0){
   const e=resolveWWITarget(p,cable.targetId);
   if(e){const body=e.stageBossBody,host=body||e,a=body?.hullYaw??body?.angle??host.a??0,x=host.x+cable.localX*Math.cos(a)-cable.localY*Math.sin(a),y=host.y+cable.localX*Math.sin(a)+cable.localY*Math.cos(a),dx=x-p.x,dy=y-p.y,length=Math.hypot(dx,dy);
    const stretch=Math.max(0,Math.min(1,(520-length)/180));
    if(stretch>0){
     const x0=sx(p.x-Math.cos(p.a)*7),y0=sy(p.y-Math.sin(p.a)*7),x1=sx(x),y1=sy(y),a=Math.atan2(dy,dx);
     const fade=Math.min(1,cable.life/.25)*stretch,sag=Math.max(1,8*(1-Math.min(1,length/150)))*z;
     c.save();c.globalAlpha*=fade;
     const width=40*z,ex=x1-Math.cos(a)*width*.86,ey=y1-Math.sin(a)*width*.86;
     drawGrapnelCable(c,x0,y0,ex,ey,z,sag);
     grapnelSprite(c,'grapnelFire',x1,y1,width,a);
     c.restore();
    }
   }
  }
  const mark=wwiWingTarget(p),flare=p.wwiVery;
  if(mark&&flare&&visible(mark.x,mark.y)){
   const t=Math.min(1,flare.age/.4),x=flare.x+(mark.x-flare.x)*t,y=flare.y+(mark.y-flare.y)*t,a=Math.atan2(mark.y-flare.y,mark.x-flare.x);
   sprite(c,t<1?'veryFlare':'verySmoke',sx(x)-Math.cos(a)*20*z,sy(y)-Math.sin(a)*20*z,(t<1?48:62)*z,a,Math.min(1,p.wwiVeryTime));
   drawVeryDesignation(c,sx(mark.x),sy(mark.y),Math.max(24,Math.min(60,(mark.target.hitRadius||17)+10))*z,flare.age,p.wwiVeryTime,options);
  }
  const cue=currentCameraCue(p,world);
  if(u.hytheCamera){
   const analyzed=p.wwiHytheVisible>0,id=analyzed?p.wwiHytheAnalyzedId:p.wwiHytheTargetId;
   const e=resolveWWITarget(p,id);
   if(e&&id!=null&&(analyzed||p.wwiHytheHits>0)&&visible(e.x,e.y)){
    const x=sx(e.x),y=sy(e.y),size=Math.max(analyzed?25:20,Math.min(65,(e.hitRadius||e.hullWidth||17)+9))*z;
    c.save();c.globalAlpha*=analyzed?.95:.5+.35*Math.min(1,p.wwiHytheHits/WWI_BALANCE.hytheCamera.hits);
    // A camera viewfinder follows the photographed aircraft for the entire bonus window.
    c.shadowColor='#171812';c.shadowBlur=2;c.shadowOffsetY=1;
    brackets(c,x,y,size,analyzed?'#f4dfaa':'#c7bb96');
    c.shadowBlur=0;c.shadowOffsetY=0;
    drawGameIcon(c,'hytheCamera',x-size-10*z,y-size,22*z);
    if(analyzed){
     c.font='600 '+Math.round(11*z)+'px sans-serif';c.textAlign='center';c.textBaseline='bottom';
     c.lineWidth=3*z;c.strokeStyle='#171812';c.fillStyle='#f4dfaa';
     const text=getLocale()==='en'?'ANALYZED':'분석 완료';
     c.strokeText(text,x,y-size-5*z);c.fillText(text,x,y-size-5*z);
    }
    c.restore();
   }
  }
  if(cue&&Number.isFinite(cue.x)&&Number.isFinite(cue.y)&&visible(cue.x,cue.y)){
   const x=sx(cue.x),y=sy(cue.y);c.save();c.globalAlpha=.8;brackets(c,x,y,10*z,'#d8d0b0');
   const a=Number.isFinite(cue.angle)?cue.angle:Number.isFinite(cue.targetX)&&Number.isFinite(cue.targetY)?Math.atan2(cue.targetY-cue.y,cue.targetX-cue.x):null;
   if(a!==null){c.setLineDash([3*z,5*z]);c.strokeStyle='#d8d0b0';c.lineWidth=1;c.beginPath();c.moveTo(x+Math.cos(a)*14*z,y+Math.sin(a)*14*z);c.lineTo(x+Math.cos(a)*65*z,y+Math.sin(a)*65*z);c.stroke();}c.restore();
  }
 }
 for(const e of equipmentTargets(world)){
  if(!(e.hp>0&&e.burnTime>0&&e.burnAnchorSpace)||e.gontermannBurn)continue;
  const point=wwiBurnPoint(e);if(!point||!visible(point.x,point.y))continue;
  const a=e.stageBossBody?.hullYaw??e.stageBossBody?.angle??e.a??0,width=(e.stageBossBody||e.type==='zeppelin'?80:62)*z;
  const direction=Math.hypot(e.vx||0,e.vy||0)>10?Math.atan2(e.vy,e.vx):a;
  drawIncendiaryFire(c,sx(point.x),sy(point.y),direction+Math.PI,width,e.fuelFxAge||0,Math.min(1,e.burnTime*4));
 }
 for(const b of world.friendlyBombs||[]){
  if(b.wimperisAimed&&b.life>0&&b.life>(b.maxLife||.85)-.35){
   const px=b.x+(b.cooperBomb?b.vx*b.life:0),py=b.y+(b.cooperBomb?b.vy*b.life:0);
   if(visible(px,py))drawWimperisSight(c,sx(px),sy(py),.4-((b.maxLife||.85)-b.life),options);
  }
  if(!b.cooperBomb||!(b.life>0)||!bomb?.naturalWidth||!visible(b.x,b.y))continue;
  bombSprite(c,'cooper',sx(b.x),sy(b.y),30*z/.7,Math.atan2(b.vy,b.vx));
 }
 for(const b of world.bullets||[]){
  if(!(b.life>0)||!visible(b.x,b.y))continue;
  if(b.wwiIncendiary){sprite(c,'burn0',sx(b.x),sy(b.y),11*z,Math.atan2(b.vy,b.vx),.8);continue;}
  if(!b.flechette&&!b.fieryGrapnel)continue;
  if(b.flechette)drawFlechetteTrail(c,b,sx(b.x),sy(b.y),{...options,scale:z});
  if(b.fieryGrapnel){
   const p=players.find(p=>(p.id??'p1')===(b.ownerId??'p1'));
   if(p&&p.hp>0&&p.status!=='downed'){
    const a=Math.atan2(b.vy,b.vx),width=36*z;
    drawGrapnelCable(c,sx(p.x-Math.cos(p.a)*7),sy(p.y-Math.sin(p.a)*7),sx(b.x)-Math.cos(a)*width*.86,sy(b.y)-Math.sin(a)*width*.86,z);
   }
  }
  if(b.fieryGrapnel)grapnelSprite(c,'grapnelHead',sx(b.x),sy(b.y),36*z,Math.atan2(b.vy,b.vx));
  else sprite(c,'flechetteDart',sx(b.x),sy(b.y),10*z,Math.atan2(b.vy,b.vx));
 }
 c.restore();
}


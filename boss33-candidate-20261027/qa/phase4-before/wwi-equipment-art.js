import {drawGameIcon} from './icons.js?v=buildfit1&afc=1';
import {getLocale} from './i18n.js?v=buildfit1&afc=1&art=pilot-recovery2';
import {WWI_FRAMES} from './wwi-equipment-art-data.js';
import {wwiBurnPoint,wwiWingTarget,currentCameraCue,WWI_BALANCE,resolveWWITarget,equipmentTargets} from './wwi-equipment.js';
import {playerPose,applyPlayerAttitude} from './player-effects129.js?v=deathdefiance1&sig=1019&boss=20261020b&phase=1021&motion=20261022&cityart=20261022';

let atlas,bomb,brakePanel,bombsight;
const load=(file,set)=>new Promise(resolve=>{
 if(typeof Image==='undefined'){resolve(false);return;}
 const image=new Image();image.onload=()=>{set(image);resolve(true);};image.onerror=()=>resolve(false);image.src=new URL(file,import.meta.url).href;
});
export const equipmentArtReady=Promise.all([
 load('./wwi-equipment-atlas.webp',im=>atlas=im),load('./bomb-cooper.webp',im=>bomb=im),
 load('./strutter-airbrake-panel.webp',im=>brakePanel=im),load('./wimperis-sight-mount.webp',im=>bombsight=im)
]).then(results=>results.every(Boolean));

function sprite(c,key,x,y,width,angle=0,alpha=1){
 const f=WWI_FRAMES[key];if(!atlas?.naturalWidth||!f)return;
 const height=width*f.h/f.w;c.save();c.globalAlpha*=alpha;c.translate(x,y);c.rotate(angle);c.imageSmoothingEnabled=true;
 c.drawImage(atlas,f.x,f.y,f.w,f.h,-width/2,-height/2,width,height);c.restore();
}
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
export function drawWWIEquipment(c,world,W,H){
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
   if(open>0)for(const wing of [-1,1])hardware(c,brakePanel,-5,wing*10,4+14*open,18);
  }
  if(u.wimperisSight)hardware(c,bombsight,front,-5,19,19);
  if(u.hytheCamera&&p.wwiHytheShutter>0)sprite(c,'hytheShutter',front+10,-5,30,0,Math.min(1,p.wwiHytheShutter*8));
  c.restore();
  const sight=p.wimperisCue;
  if(u.wimperisSight&&sight?.until>world.t&&visible(sight.x,sight.y)){
   c.save();c.globalAlpha=.65;brackets(c,sx(sight.x),sy(sight.y),4*z,'#c9bd91');c.restore();
  }
  const cable=p.wwiGrapnelCable;
  if(cable?.life>0){
   const e=resolveWWITarget(p,cable.targetId);
   if(e){const body=e.stageBossBody,host=body||e,a=body?.hullYaw??body?.angle??host.a??0,x=host.x+cable.localX*Math.cos(a)-cable.localY*Math.sin(a),y=host.y+cable.localX*Math.sin(a)+cable.localY*Math.cos(a),dx=x-p.x,dy=y-p.y,length=Math.hypot(dx,dy);
    if(length<=100){const x0=sx(p.x-Math.cos(p.a)*7),y0=sy(p.y-Math.sin(p.a)*7),x1=sx(x),y1=sy(y),alpha=Math.min(1,cable.life*5);c.save();c.globalAlpha*=alpha;c.lineWidth=2*z;c.strokeStyle='#211f1b';c.beginPath();c.moveTo(x0,y0);c.quadraticCurveTo((x0+x1)/2,(y0+y1)/2+4*z,x1,y1);c.stroke();c.lineWidth=.7*z;c.strokeStyle='#a39d86';c.stroke();sprite(c,'grapnelFire',x1,y1,15*z,Math.atan2(dy,dx));c.restore();}
   }
  }
  const mark=wwiWingTarget(p),flare=p.wwiVery;
  if(mark&&flare&&visible(mark.x,mark.y)){
   const t=Math.min(1,flare.age/.4),x=flare.x+(mark.x-flare.x)*t,y=flare.y+(mark.y-flare.y)*t,a=Math.atan2(mark.y-flare.y,mark.x-flare.x);
   sprite(c,t<1?'veryFlare':'verySmoke',sx(x)-Math.cos(a)*12*z,sy(y)-Math.sin(a)*12*z,34*z,a,Math.min(1,p.wwiVeryTime));
   brackets(c,sx(mark.x),sy(mark.y),8*z,'#c9a07a');
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
  const a=e.stageBossBody?.hullYaw??e.stageBossBody?.angle??e.a??0,width=(e.stageBossBody||e.type==='zeppelin'?72:50)*z;
  sprite(c,Math.floor((e.fuelFxAge||0)*12)%2?'burn1':'burn0',sx(point.x)-Math.cos(a)*width*.35,sy(point.y)-Math.sin(a)*width*.35,width,a,Math.min(1,e.burnTime*4));
 }
 for(const b of world.friendlyBombs||[]){
  if(b.wimperisAimed&&b.life>0&&b.life>(b.maxLife||.85)-.16){
   const px=b.x+(b.cooperBomb?b.vx*b.life:0),py=b.y+(b.cooperBomb?b.vy*b.life:0);
   if(visible(px,py)){c.save();c.globalAlpha=.55;brackets(c,sx(px),sy(py),4*z,'#c9bd91');c.restore();}
  }
  if(!b.cooperBomb||!(b.life>0)||!bomb?.naturalWidth||!visible(b.x,b.y))continue;
  const width=23*z,height=width*bomb.naturalHeight/bomb.naturalWidth;c.save();c.translate(sx(b.x),sy(b.y));c.rotate(Math.atan2(b.vy,b.vx));c.imageSmoothingEnabled=true;c.drawImage(bomb,-width/2,-height/2,width,height);c.restore();
 }
 for(const b of world.bullets||[]){
  if(!(b.life>0)||!visible(b.x,b.y))continue;
  if(b.wwiIncendiary){sprite(c,'burn0',sx(b.x),sy(b.y),8*z,Math.atan2(b.vy,b.vx),.65);continue;}
  if(!b.flechette&&!b.fieryGrapnel)continue;
  if(b.flechette){c.save();c.globalAlpha*=.5;c.strokeStyle='#d8cfad';c.lineWidth=.8*z;c.beginPath();c.moveTo(sx(b.x),sy(b.y));c.lineTo(sx(b.x-b.vx*.025),sy(b.y-b.vy*.025));c.stroke();c.restore();}
  sprite(c,b.flechette?'flechetteDart':'grapnelHead',sx(b.x),sy(b.y),(b.flechette?18:15)*z,Math.atan2(b.vy,b.vx));
 }
 c.restore();
}


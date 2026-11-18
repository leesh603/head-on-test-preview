import {fx} from './fx-art.js?v=tame3';
import {bombSprite} from './bomb-sprites.js?v=bomb20&perf=1029';
import {drawIncendiaryFire} from './incendiary-fire.js';
import {drawSecretWarArt} from './secret-impact-signatures.js';

const clamp=v=>Math.max(0,Math.min(1,v));
const TAU=Math.PI*2;

// The painted face is cut in its own local space. Moving the pieces never
// creates an additional projectile or an unregistered strike.
function steelPetal(c,art,front,side,x,y,width,angle,alpha){
 c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha*=alpha;
 c.beginPath();c.rect(front<0?-width:0,side<0?-width:0,width,width);c.clip();
 if(!drawSecretWarArt(c,'steelDispenser',0,0,width,0)){
  bombSprite(c,'cooper',0,0,width/.7,0);
  art.sprite(c,'flechetteBundle',0,0,width*.76);
 }
 c.restore();
}
function hook(c,art,x,y,width,a,alpha=1){
 // Both the atlas and painted head point right. Register the tip, not its centre.
 const cx=x-Math.cos(a)*width*.45,cy=y-Math.sin(a)*width*.45;
 if(!drawSecretWarArt(c,'hookHead',cx,cy,width,a,alpha))art.sprite(c,'grapnelFire',cx,cy,width,a,alpha);
}
function gasFold(c,x,y,width,height,a,alpha){
 if(!(alpha>0))return;
 c.save();c.translate(x,y);c.rotate(a);c.scale(1,height/width);
 if(!drawSecretWarArt(c,'gasFold',0,0,width,0,alpha))fx(c,'gas',0,0,width,width,0,alpha);
 c.restore();
}

export function drawPayloadCarrier(c,b,view,art){
 if(!b.cooperBomb||(!b.secretSteelRain&&!b.secretGasMarked))return false;
 const {sx,sy,z}=view,x=sx(b.x),y=sy(b.y),size=z*(b.ammunitionScale||1);
 const a=Math.hypot(b.vx||0,b.vy||0)>1?Math.atan2(b.vy,b.vx):(b.releaseAngle||0);
 const progress=clamp(1-b.life/(b.maxLife||.55)),opening=clamp((progress-.57)/.43);
 c.save();c.translate(x,y);c.rotate(a);c.scale(size,size);
 if(b.secretSteelRain){
  // The four-leaf drawing is the opened casing. Keep its valves folded flat
  // around the closed Cooper body until the last part of the real fall.
  bombSprite(c,'cooper',0,0,62,0,1-.67*opening);
  c.save();c.scale(1,.28+.72*opening);
  if(!drawSecretWarArt(c,'steelDispenser',0,0,41+opening*12,0,.70+.30*opening))
   art.sprite(c,'flechetteBundle',0,0,38+opening*10);
  c.restore();
 }else{
  bombSprite(c,'cooper',0,0,57,0);
 }
 if(b.secretGasMarked){
  // Dense green discharge starts at the two aft vents of the gas carrier.
  for(const side of [-1,1]){
   const d=12+progress*13;
   fx(c,'gasSmall',-d,side*(4+opening*5),17+opening*19,7+opening*6,side*.24,.42+.37*opening);
  }
  art.stencil?.(c,-3,0,15,0,1);
 }
 c.restore();return true;
}

function targetById(world,id){
 if(id==null)return null;
 return world.enemies?.find(e=>e.id===id||e.tailId===id)||
  world.eliteEnemies?.members?.find(e=>e.id===id||e.tailId===id);
}
// Preserve the actual contact point through a turn. If its actor leaves the
// world, keep the historical contact point and let this bounded cue expire.
function anchor(world,id,point){
 const e=targetById(world,id);
 if(!e)return point;
 const a=(e.a||0)-(point.bodyAngle??e.a??0);
 const dx=point.offsetX||0,dy=point.offsetY||0;
 return {x:e.x+dx*Math.cos(a)-dy*Math.sin(a),y:e.y+dx*Math.sin(a)+dy*Math.cos(a),turn:a,heading:e.a||0};
}
function cablePoint(x0,y0,x1,y1,sag,k){
 const dx=x1-x0,dy=y1-y0,d=Math.hypot(dx,dy)||1;
 const bend=2*k*(1-k)*sag,turn=2*(1-2*k)*sag;
 return {x:x0+dx*k-dy/d*bend,y:y0+dy*k+dx/d*bend,a:Math.atan2(dy+dx/d*turn,dx-dy/d*turn)};
}

export function drawPayloadRound(c,b,world,view,art,low=false){
 if(b.secretWeapon!=='fliegerpfeil'&&b.secretWeapon!=='farnboroughFirechain')return false;
 const {sx,sy,z}=view,x=sx(b.x),y=sy(b.y),a=Math.atan2(b.vy,b.vx),size=z*(b.ammunitionScale||1);
 if(b.secretWeapon==='fliegerpfeil'){
  // Each visible dart is the authoritative travelling round. The three speed
  // bands each leave a different length brushed-metal streak behind the shaft.
  const speed=Math.hypot(b.vx,b.vy),band=clamp((speed-360)/160);
  const length=(30+band*32)*size,d=length*.56+13*size;
  fx(c,'vaporTrail',x-Math.cos(a)*d,y-Math.sin(a)*d,length,(3+band*2)*size,a,.77);
  // A beveled steel spine and forked tail keep the painted dart legible on
  // a white blast or dark ground, even after the viewport is scaled to mobile.
  c.save();c.translate(x,y);c.rotate(a);c.scale(size,size);
  const nose=15+band*5,tail=-13-band*5;
  c.beginPath();c.moveTo(nose+4,0);c.lineTo(nose-6,-2.8);c.lineTo(tail+6,-2);
  c.lineTo(tail-4,-4.5);c.lineTo(tail-1,0);c.lineTo(tail-4,4.5);
  c.lineTo(tail+6,2);c.lineTo(nose-6,2.8);c.closePath();
  c.fillStyle='#e8e2cd';c.strokeStyle='#201e1a';c.lineWidth=3;
  c.stroke();c.fill();art.sprite(c,'flechetteDart',0,0,(29+band*8),0,.83);
  c.beginPath();c.moveTo(tail+4,-.8);c.lineTo(nose+1,-.8);
  c.strokeStyle='#fff9e0';c.lineWidth=2;c.stroke();c.restore();
  return true;
 }
 const origin=b.secretChainOrigin;
 if(origin){
  const base=anchor(world,origin.id,origin),x0=sx(base.x),y0=sy(base.y);
  const ex=x-Math.cos(a)*28*size,ey=y-Math.sin(a)*28*size;
  const span=Math.hypot(ex-x0,ey-y0)/z,sag=Math.min(20,span*.14)*z;
  if(span>8){
   art.cable(c,x0,y0,ex,ey,z,sag);
   // Hot links pay out from the fixed hook as the real projectile lengthens
   // its tether. The marks clip to the actual paid-out portion of the cable.
   const stride=(low?42:29)*z;
   for(let i=1;i<=(low?4:7)&&i*stride<span*z;i++){
    const d=i*stride;
    const p=cablePoint(x0,y0,ex,ey,sag,d/(span*z));
    fx(c,'fireSmall',p.x,p.y,12*z,6*z,p.a,.77);
   }
  }
 }
 hook(c,art,x,y,53*size,a);
 return true;
}

function steelRelease(c,cue,age,view,art,low){
 const {sx,sy,z}=view,x=sx(cue.x),y=sy(cue.y),a=cue.a||0,t=clamp(age/.48);
 // Draw behind the case. Each wake ends where its own round actually
 // travelled, including a round that stopped early. Two batched strokes cover
 // all lanes, with widening gaps between the three different speed bands.
 const tracks=cue.steelTracks;
 if(tracks?.length){
  c.save();c.beginPath();c.lineCap='round';
  for(const {x:startX,y:startY,dart} of tracks){
   const dx=dart.x-startX,dy=dart.y-startY,distance=Math.hypot(dx,dy);
   if(distance<3)continue;
   const length=Math.min(distance,44+Math.hypot(dart.vx,dart.vy)*.13);
   const fraction=1-length/distance;
   c.moveTo(sx(startX+dx*fraction),sy(startY+dy*fraction));c.lineTo(sx(dart.x),sy(dart.y));
  }
  c.globalAlpha*=Math.min(1,Math.max(0,(cue.life-age)/.42));
  c.lineWidth=Math.max(2.8,5.2*z);c.strokeStyle='rgba(42,37,32,.79)';c.stroke();
  c.lineWidth=Math.max(1.25,2.4*z);c.strokeStyle='rgba(245,237,205,.88)';c.stroke();
  c.restore();
 }
 const opening=clamp(age/.48),throwDistance=1-Math.pow(1-opening,2),fade=Math.min(1,(1-opening)*4);
 c.save();c.translate(x,y);c.rotate(a);c.scale(z,z);
 for(const front of [-1,1])for(const side of [-1,1]){
  // Each quadrant is an actual hinged petal of the painted four-leaf dispenser.
  // Start assembled, then tumble each piece along its own ejection direction.
  steelPetal(c,art,front,side,front*throwDistance*39-t*11,side*throwDistance*46,
   55+throwDistance*13,front*side*throwDistance*1.7,fade);
 }
 if(age<.23){
  const burst=age/.23;
  art.sprite(c,'flechetteBundle',0,0,36*(1-burst*.45),0,1-burst);
  // Release stencil is aligned with the emitted rounds. Only vapour marks the
  // muzzle lanes; all 24 pointed steel bodies are rendered from the bullet list.
  const count=low?4:8;
  for(let i=0;i<count;i++){
   const h=(i*(24/count)+i%3)*Math.PI/12,d=14+burst*29;
   fx(c,'gunSmoke',Math.cos(h)*d,Math.sin(h)*d,25+burst*18,7+burst*8,h,1-burst);
  }
 }
 c.restore();
}

function embeddedDart(c,cue,age,world,view,art){
 const {sx,sy,z}=view,p=anchor(world,cue.targetId,cue);
 const a=(cue.a||0)+(p.turn||0),x=sx(p.x),y=sy(p.y),fade=Math.min(1,(cue.life-age)/.2);
 const jolt=Math.sin(age*59)*Math.max(0,1-age/.25)*.20;
 if(age<.16){
  const t=age/.16;
  fx(c,'ricochet',x,y,42*z,17*z,a,1-t);
  fx(c,'metalShard1',x-Math.cos(a+.65)*t*24*z,y-Math.sin(a+.65)*t*24*z,13*z,6*z,a-t*4,1-t);
 }
 art.sprite(c,'flechetteDart',x-Math.cos(a+jolt)*9*z,y-Math.sin(a+jolt)*9*z,27*z,a+jolt,fade);
}

function gasField(c,cue,age,view,art,low){
 const {sx,sy,z}=view,x=sx(cue.x),y=sy(cue.y),r=(cue.radius||122)*z;
 const growth=1-Math.pow(1-clamp(age/.85),2),remaining=cue.life-age;
 const fade=clamp(remaining/.95),a=cue.a||0,move=clamp(age/.6);
 // A venting canister skids to a stop near the impact, still giving the
 // player a fixed point of origin once the outer folds reach full extent.
 const cx=x-Math.cos(a)*14*z*move,cy=y-Math.sin(a)*14*z*move;
 const bearing=a+.7*move;
 const streams=low?2:3;
 for(let i=0;i<streams;i++){
  const h=bearing+(i-1)*2.12;
  const pulse=((age*.84+i/streams)%1);
  const d=r*(.08+growth*.50*pulse);
  const opacity=Math.sin(Math.PI*pulse)*fade*.66;
  fx(c,'gasSmall',cx+Math.cos(h)*d,cy+Math.sin(h)*d,r*(.30+pulse*.24),r*(.15+pulse*.14),h,opacity);
 }
 // A low, continuous bank joins the painted folds. They share a downwind
 // direction while their root positions and sizes vary across the cloud.
 fx(c,'gas',x,y,r*(.55+1.19*growth),r*(.47+1.12*growth),a+.2,fade*.60);
 const banks=low?2:3;
 for(let i=0;i<banks;i++){
  const advance=(i===0?-.29:i===1?.12:.46)*r*growth;
  const lateral=(i===0?-.22:i===1?.32:-.19)*r*growth;
  const drift=.05*r*Math.sin(age*.9+i)*growth;
  const px=x+Math.cos(a)*(advance+drift)-Math.sin(a)*lateral;
  const py=y+Math.sin(a)*(advance+drift)+Math.cos(a)*lateral;
  const w=r*(.46+growth*(i===1?.73:.62));
  gasFold(c,px,py,w,w*(i===1?.83:.66),a+(i-1)*.77+.13*Math.sin(age*1.2+i),fade*(.70+.14*Math.sin(age*1.5+i)));
 }
 const bodyAlpha=clamp(remaining/.72);
 bombSprite(c,'cooper',cx,cy,49*z,bearing,bodyAlpha);
 art.stencil?.(c,cx,cy,16*z,bearing,bodyAlpha);
 for(const side of [-1,1]){
  const h=bearing+side*Math.PI/2,vent=12+5*Math.sin(8*age+side);
  fx(c,'gasSmall',cx+Math.cos(h)*vent*z,cy+Math.sin(h)*vent*z,(28+vent)*z,13*z,h,bodyAlpha*.82);
 }
}

function gasContact(c,cue,age,world,view,low){
 const {sx,sy,z}=view,p=anchor(world,cue.targetId,cue),a=p.heading??cue.bodyAngle??0;
 const t=clamp(age/cue.life),fade=1-t;
 // Twin wisps fold under the moving target's nose and separate at the trailing
 // edges. Each ingestion starts only from an accepted chemical damage tick.
 for(let i=0;i<(low?1:2);i++){
  const side=i?-1:1,d=(12-t*40)*z,v=side*(3+Math.sin(t*Math.PI)*12)*z;
  gasFold(c,sx(p.x)+Math.cos(a)*d-Math.sin(a)*v,sy(p.y)+Math.sin(a)*d+Math.cos(a)*v,
   (21+t*10)*z,(9+t*9)*z,a+side*t*.45,.85*fade);
 }
}

function firechain(c,cue,age,world,view,art,low){
 const {sx,sy,z}=view,start=anchor(world,cue.originId,cue);
 const x0=sx(start.x),y0=sy(start.y),fade=clamp((cue.life-age)/.18);
 for(const link of cue.links||[]){
  const end=anchor(world,link.id,link),x1=sx(end.x),y1=sy(end.y);
  const dx=x1-x0,dy=y1-y0,h=Math.atan2(dy,dx),span=Math.hypot(dx,dy);
  const bite=clamp(age/.14),release=clamp((age-.55)/.29);
  const sag=(3+17*(1-bite)+12*release+3*Math.sin(age*21)*(1-release))*z;
  c.save();c.globalAlpha*=fade;
  if(span>9*z){
   art.cable(c,x0,y0,x1,y1,z,sag);
   art.sprite(c,'grapnelHead',x0,y0,25*z,h+Math.PI,.94);
  }
  // Two differently timed fronts heat actual adjacent links. The first runs
  // into the captured aircraft, the second recoils back toward the first hook.
  for(let pass=0;pass<2;pass++){
   const pulse=(age-(pass?.37:.04))/(pass?.36:.31);
   if(pulse<0||pulse>1||span<=9*z)continue;
   const head=pass?1-pulse:pulse;
   const count=low?2:4;
   for(let j=0;j<count;j++){
    const k=head+(pass?1:-1)*j*10*z/span;
    if(k<0||k>1)continue;
    const p=cablePoint(x0,y0,x1,y1,sag,k);
    fx(c,j?'fireSmall':'flameJet',p.x,p.y,(j?18:31)*z,(j?7:13)*z,p.a+(pass?Math.PI:0),1-j/(count+1));
   }
  }
  hook(c,art,x1,y1,(52+Math.sin(bite*Math.PI)*11)*z,h);
  if(age<.18)fx(c,'armorSpark',x1,y1,48*z,24*z,h,1-age/.18);
  drawIncendiaryFire(c,x1,y1,h,(34+27*clamp((age-.15)/.21))*z,age,1,'legacy');
  c.restore();
 }
}

export function drawPayloadCue(c,cue,world,view,art,low=false){
 const age=(world.t||0)-cue.at;
 switch(cue.kind){
  case 'steelRain':steelRelease(c,cue,age,view,art,low);return true;
  case 'dartHit':embeddedDart(c,cue,age,world,view,art);return true;
  case 'gasBarrage':gasField(c,cue,age,view,art,low);return true;
  case 'gasHit':gasContact(c,cue,age,world,view,low);return true;
  case 'firechain':firechain(c,cue,age,world,view,art,low);return true;
  default:return false;
 }
}

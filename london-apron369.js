import {APRON_GONDOLA_STAYS,drawApronCableMount,drawApronEnvelope,drawCityBalloonHull,drawCitySuspension,cityPartState} from './city-balloon-art.js?v=20261022';
import {drawAADefense} from './aa-defense-art.js?v=gal1';
// Registered in the original 768 x 512 illustration. Rendering and collision
// share this transform: no viewport-space attack sprites or hidden beam walls.
export const APRON={width:768,height:512,seam:216,bottom:448,centres:[143,384,645],edges:[0,305,464,768]};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export function apronPose(time=0,lost=0){
 const t=time%14;
 if(lost>=2)return{shear:Math.sin(time*.75)*42,depth:.82+Math.sin(time*.5)*.07,spread:1,mode:'survivor'};
 if(t<2)return{shear:0,depth:.78,spread:1,mode:'slack'};
 if(t<5){const q=(t-2)/3;return{shear:0,depth:.78+.35*q,spread:1,mode:'lower'};}
 if(t<9){const q=(t-5)/4;return{shear:Math.sin(q*Math.PI*2)*62,depth:1.13,spread:1,mode:'sweep'};}
 if(t<12){const q=Math.sin((t-9)/3*Math.PI);return{shear:0,depth:1.13+.12*q,spread:1+.12*q,mode:'close'};}
 return{shear:0,depth:1.13-.35*(t-12)/2,spread:1,mode:'recover'};
}
export function apronPoint(x,y,pose,scale){
 const q=clamp((y-APRON.seam)/(APRON.bottom-APRON.seam)),ease=q*q*(3-2*q);
 return{x:((x-384)*(1+(pose.spread-1)*ease)+pose.shear*ease)*scale,
 y:(APRON.seam-256+(y-APRON.seam)*pose.depth+Math.sin(x/768*Math.PI)*5*ease)*scale};
}
export function apronPanelHull(index,pose,scale,x=0,y=0){
 const left=[100,305,464][index],right=[305,464,664][index];
 return [[left,230],[right,230],[right,397],[left,397]].map(([u,v])=>{const p=apronPoint(u,v,pose,scale);return{x:x+p.x,y:y+p.y};});
}
export function netContact(p,vertices){
 if(!vertices?.length)return null;
 let inside=false,best=null,dist=Infinity;
 for(let i=0,j=vertices.length-1;i<vertices.length;j=i++){
  const a=vertices[j],b=vertices[i],dx=b.x-a.x,dy=b.y-a.y;
  if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  const t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)),qx=a.x+t*dx,qy=a.y+t*dy,d=Math.hypot(p.x-qx,p.y-qy);
  if(d<dist){dist=d;best={x:qx,y:qy,dx,dy};}
 }
 const r=p.radius||0;if(!inside&&dist>=r)return null;
 const sign=inside?-1:1,nx=dist>.001?(p.x-best.x)/dist*sign:best.dy/Math.max(1,Math.hypot(best.dx,best.dy)),ny=dist>.001?(p.y-best.y)/dist*sign:-best.dx/Math.max(1,Math.hypot(best.dx,best.dy));
 const amount=inside?dist+r+.1:r-dist+.1;return{x:nx*amount,y:ny*amount};
}

export const APRON_RIG_OFFSETS=[26,0,-26];
const RAID_MOUNTS=[[123,193],[384,199],[646,193]].map(([x,y],i)=>[x,y+APRON_RIG_OFFSETS[i]]);
// Suspension fittings on the older composite's envelope-only fallback.
const RAID_FALLBACK_STAYS=[[[94,180],[129,184],[193,185]],[[304,177],[384,184],[463,175]],[[575,185],[638,184],[675,183]]];
const RAID_HALF_WIDTHS=[62,68,62];
const RAID_LENGTHS=[300,348,316];
const RAID_SLACK_LENGTH=96;
const ease=v=>{const q=clamp(v);return q*q*(3-2*q);};
export const APRON_RAID_ENTRY=3.4;
export const APRON_RAID_WARNING=.95;

export function raidApronPose(entryAge,state,age,cycle,fallen,blockade=false){
 const setup=ease(entryAge/APRON_RAID_ENTRY);
 const warning=state==='corridor-formation'&&age<APRON_RAID_WARNING?age/APRON_RAID_WARNING:null;
 const pull=state==='corridor-formation'?ease((age-APRON_RAID_WARNING)/1.45):
  state==='relief'?1-ease(age/1.25):1;
 return {setup,pull,direction:[1,-1,0][cycle%3],lead:cycle%3,warning:setup===1?warning:null,fallen,blockade};
}

// The first half is the carrier cable, the second half is the free ends in
// reverse order. Drawn strands, the player barrier and shots use this outline.
export function raidApronPanel(index,pose,scale,x=0,y=0){
 const [anchorX,anchorY]=RAID_MOUNTS[index],half=RAID_HALF_WIDTHS[index];
 const pull=pose.pull*(pose.blockade||pose.lead===index?1:.77);
 const length=pose.setup*(RAID_SLACK_LENGTH+(RAID_LENGTHS[index]-RAID_SLACK_LENGTH+(pose.blockade?44:0))*pull);
 const drag=pose.direction*36*pull*pose.setup;
 const top=[],bottom=[];
 for(let j=0;j<=4;j++){
  const u=j/2-1;
  const cableY=anchorY+22+13*u*u;
  top.push({x:x+(anchorX-384+half*u)*scale,y:y+(cableY-256)*scale});
  const tipX=anchorX+drag+(half+4*pull)*u;
  const tipY=cableY+8+length*(.91+.09*(1-u*u)+.07*u*(index===0?-1:1));
  bottom.push({x:x+(tipX-384)*scale,y:y+(tipY-256)*scale});
 }
 return [...top,...bottom.reverse()];
}

function railPoint(row,t){
 const i=Math.min(3,Math.floor(t*4)),q=t*4-i,a=row[i],b=row[i+1];
 return {x:a.x+(b.x-a.x)*q,y:a.y+(b.y-a.y)*q};
}
function strandPoint({a,b,bend},t){
 return {x:a.x+(b.x-a.x)*t+4*bend*t*(1-t),y:a.y+(b.y-a.y)*t};
}
function strokeRaidCable(c,s,width,highlight){
 c.strokeStyle='#25231fdc';c.lineWidth=Math.max(1.1,width*s);c.stroke();
 c.strokeStyle=highlight;c.lineWidth=Math.max(.45,width*.36*s);c.stroke();
}
function drawRaidCables(c,vertices,s,pose,index){
 const top=vertices.slice(0,5),bottom=vertices.slice(5).reverse();
 const count=Math.max(8,Math.min(16,Math.round(14*s)));
 const strands=Array.from({length:count},(_,j)=>{
  const t=j/(count-1),u=t+.022*Math.sin(2*Math.PI*t)+.012*Math.sin(5*Math.PI*t);
  // The two edge stays remain on the collision outline. Interior drops
  // bow slightly between their fixed carrier and weighted end.
  const bend=18*s*u*(1-u)*(1-.55*pose.pull)*Math.sin((u*3+.2)*Math.PI);
  return {a:railPoint(top,u),b:railPoint(bottom,u),bend};
 });
 c.lineCap='round';
 c.beginPath();
 for(const wire of strands){
  const {a,b}=wire,m=strandPoint(wire,.5);
  c.moveTo(a.x,a.y);c.quadraticCurveTo(m.x+wire.bend,m.y,b.x,b.y);
 }
 c.save();c.shadowColor='#17171338';c.shadowOffsetX=7*s;c.shadowOffsetY=8*s;c.shadowBlur=0;
 c.strokeStyle='#25231fdc';c.lineWidth=Math.max(1.1,2.05*s);c.stroke();c.restore();
 c.strokeStyle='#b1afa1aa';c.lineWidth=Math.max(.45,.74*s);c.stroke();
 // Thin transverse lashings keep the long drops from bunching. Each span
 // hangs between two real strands, with its own small catenary.
 if(bottom[2].y-top[2].y>38*s){
  c.beginPath();
  for(const row of [.23,.49,.73]){
   let a=strandPoint(strands[0],row);
   c.moveTo(a.x,a.y);
   for(let i=1;i<strands.length;i++){
    const b=strandPoint(strands[i],row+Math.sin(i*.93+row*5+index*1.6)*.022);
    c.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2+1.9*s,b.x,b.y);
    a=b;
   }
  }
  strokeRaidCable(c,s,1.15,'#918e7e85');
 }
 // The heavier edge stays mark the actual boundary on a small screen.
 c.beginPath();
 for(const {a,b} of [strands[0],strands.at(-1)]){
  c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);
 }
 strokeRaidCable(c,s,2.8,'#b6aa91cb');
 c.beginPath();c.moveTo(top[0].x,top[0].y);
 for(const p of top.slice(1))c.lineTo(p.x,p.y);
 strokeRaidCable(c,s,3.1,'#ada592bf');
 if(typeof Image!=='undefined')for(let i=0;i<strands.length;i+=3){
  const {a,b}=strands[i],angle=Math.atan2(b.y-a.y,b.x-a.x);
  drawAADefense(c,'londonKnot',a.x,a.y+1.2*s,7*s,3.8*s,angle,.88);
  if(b.y-a.y>35*s)drawAADefense(c,'londonKnot',b.x,b.y,8.4*s,4.5*s,angle,.82);
 }
 if(pose.warning!=null){
  c.beginPath();
  for(const wire of strands){
   const a=strandPoint(wire,Math.max(0,pose.warning-.18)),b=strandPoint(wire,Math.min(1,pose.warning+.08));
   c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);
  }
  c.strokeStyle='#d1b486d2';c.lineWidth=Math.max(.85,1.18*s);c.stroke();
 }
}

export function drawRaidApron(c,b,intact,damaged){
 const s=b.apronScale||1,pose=b.apronPoseOverride||raidApronPose(0,'corridor-formation',0,0);
 const parts=RAID_MOUNTS.map((_,i)=>b.parts?.find(p=>p.id==='airship-'+i));
 const {carrier,panel}=APRON_GONDOLA_STAYS;
 c.save();c.translate(b.x,b.y);c.imageSmoothingEnabled=true;
 if(b.destroying)c.globalAlpha*=clamp(1-b.destructionAge/Math.max(.1,b.destructionDuration));
 // Overhead carrier cables sag between the mounts. The long hanging
 // strands below each gondola are the flight obstacles.
 for(let i=0;i<2;i++){
  const left=parts[i],right=parts[i+1];
  if(left?.destroyed&&right?.destroyed)continue;
  const [x,y]=RAID_MOUNTS[i],[u,v]=RAID_MOUNTS[i+1],sag=52-13*pose.pull,span=u-x-2*carrier.x;
  const ax=x+carrier.x-384,bx=u-carrier.x-384,ay=y-256+carrier.y,by=v-256+carrier.y;
  const severed=left?.destroyed?left:right?.destroyed?right:null;
  if(severed){
   const q=clamp(((b.motionTime||0)-(severed.destroyedAt||0))/.65);
   if(q<1){
    const fromRight=severed===left,px=fromRight?bx:ax,py=fromRight?by:ay,dx=(fromRight?-1:1)*(55-27*q);
    c.save();c.globalAlpha*=1-q;
    c.beginPath();c.moveTo(px*s,py*s);
    c.quadraticCurveTo((px+dx*.64)*s,(py+10+8*q)*s,(px+dx)*s,(py+17+23*q)*s);
    strokeRaidCable(c,s,2.65,'#aaa18b9e');
    c.restore();
   }
   continue;
  }
  c.beginPath();c.moveTo(ax*s,ay*s);
  c.bezierCurveTo((ax+span*.27)*s,(ay+sag)*s,(bx-span*.27)*s,(by+sag)*s,bx*s,by*s);
  strokeRaidCable(c,s,2.85,'#aaa18b9e');
 }
 for(const [i,[gx,gy]] of RAID_MOUNTS.entries()){
  const p=parts[i],dead=p?.destroyed,age=dead?Math.max(0,(b.motionTime||0)-(p.destroyedAt||0)+(b.destroying?b.destructionAge:0)):0;
  if(age>=1.25)continue;
  const offset=APRON_RIG_OFFSETS[i],x=gx-384,y=gy-256,hy=(i===1?123:132)-256+offset,state=cityPartState(p,dead||b.destroying);
  c.save();
  if(dead){
   c.globalAlpha*=clamp(1-age/1.25);
   c.translate(x*s,(y+180*age*age)*s);c.rotate((i===0?-1:1)*age*.42);
   c.scale(1-age*.5,1-age*.3);c.translate(-x*s,-y*s);
  }
  const panelPose=dead?{...(pose.fallen?.[i]||pose),warning:null}:pose,vertices=raidApronPanel(i,panelPose,s);
  drawRaidCables(c,vertices,s,panelPose,i);
  c.beginPath();
  for(const side of [-1,1]){
   const stay=vertices[2+side],mountX=(x+side*panel.x)*s,mountY=(y+panel.y)*s;
   c.moveTo(mountX,mountY);
   c.quadraticCurveTo((mountX+stay.x)/2,mountY+4*s,stay.x,stay.y);
  }
  strokeRaidCable(c,s,1.9,'#9f9685a8');
  c.save();c.scale(s,s);
  let hullStays=drawApronEnvelope(c,state,x,hy,234);
  if(!hullStays){
   const im=state&&damaged?.naturalWidth?damaged:intact;
   // Keep the old sheet's envelopes only; the separate suspension is drawn below.
   if(im?.naturalWidth){
    c.drawImage(im,i/3*im.naturalWidth,0,im.naturalWidth/3,190/512*im.naturalHeight,i*256-384,offset-256,256,190);
    hullStays=RAID_FALLBACK_STAYS[i].map(([px,py])=>[px-384,py+offset-256]);
   }
  }
  drawApronCableMount(c,p,state,x,y,hullStays);c.restore();
  c.restore();
 }
 c.restore();
}

// Affine texture strips preserve the authored weave and cable detail. The
// complete lower net is one continuous surface, pinned along its upper edge.
function triangle(c,image,src,dst){
 const [s0,s1,s2]=src,[d0,d1,d2]=dst;
 const den=(s1.x-s0.x)*(s2.y-s0.y)-(s2.x-s0.x)*(s1.y-s0.y);if(!den)return;
 const a=((d1.x-d0.x)*(s2.y-s0.y)-(d2.x-d0.x)*(s1.y-s0.y))/den;
 const b=((d1.y-d0.y)*(s2.y-s0.y)-(d2.y-d0.y)*(s1.y-s0.y))/den;
 const cc=((d2.x-d0.x)*(s1.x-s0.x)-(d1.x-d0.x)*(s2.x-s0.x))/den;
 const d=((d2.y-d0.y)*(s1.x-s0.x)-(d1.y-d0.y)*(s2.x-s0.x))/den;
 c.save();c.beginPath();c.moveTo(d0.x,d0.y);c.lineTo(d1.x,d1.y);c.lineTo(d2.x,d2.y);c.closePath();c.clip();
 c.transform(a,b,cc,d,d0.x-a*s0.x-cc*s0.y,d0.y-b*s0.x-d*s0.y);
 c.drawImage(image,0,0,image.naturalWidth,image.naturalHeight,0,0,768,512);c.restore();
}
export function drawAttachedApron(c,b,intact,damaged){
 if(!intact?.naturalWidth)return false;
 const parts=b.parts||[],lost=parts.filter(p=>p.id?.startsWith('airship-')&&p.destroyed).length,pose=b.apronPoseOverride||apronPose(b.apronTime||0,lost),s=b.apronScale||1;
 c.save();c.translate(b.x,b.y);c.imageSmoothingEnabled=true;
 if(b.destroying)c.globalAlpha*=Math.max(0,1-b.destructionAge/b.destructionDuration);
 // A balloon and its suspended bay form one falling assembly. Removing a
 // support can never leave its net hovering or a weapon firing in empty air.
 for(let panel=0;panel<3;panel++){
  const p=parts.find(p=>p.id==='airship-'+panel),dead=p?.destroyed;
  const age=dead?Math.max(0,(b.motionTime||0)-(p?.destroyedAt||0)+(b.destroying?b.destructionAge:0)):0;
  if(dead&&age>=1.8)continue;
  const im=dead&&damaged?.naturalWidth?damaged:intact,x0=APRON.edges[panel],width=APRON.edges[panel+1]-x0;
  c.save();if(dead){c.globalAlpha*=Math.max(0,1-age/1.8);c.translate(p.x,p.y+170*age*age*s);c.rotate((panel===0?-1:1)*age*.19);c.scale(1-age*.12,1-age*.12);c.translate(-p.x,-p.y);}
  const hull=(dead||p?.hp<p?.maxHp*.55)&&damaged?.naturalWidth?damaged:intact;
  const hx=[123,384,646][panel]-384,hy=[132,123,132][panel]-256,gy=[193,199,193][panel]-256,state=cityPartState(p,dead||b.destroying);
  if(drawCityBalloonHull(c,'london',state,hx*s,hy*s,234*s)){c.save();c.scale(s,s);drawCitySuspension(c,p,state,hx,gy,40,{hullX:hx,hullY:hy+34,net:true,flash:p?.gunFlash||0});c.restore();}
  else c.drawImage(hull,panel*256/768*hull.naturalWidth,0,256/768*hull.naturalWidth,216/512*hull.naturalHeight,(panel*256-384)*s,-256*s,256*s,216*s);
  for(let row=0;row<4;row++)for(let col=0;col<2;col++){
   const xa=x0+col*width/2,xb=x0+(col+1)*width/2,ya=216+row*74,yb=216+(row+1)*74;
   const src=[{x:xa,y:ya},{x:xb,y:ya},{x:xb,y:yb},{x:xa,y:yb}],dst=src.map(v=>apronPoint(v.x,v.y,pose,s));
   triangle(c,im,[src[0],src[1],src[2]],[dst[0],dst[1],dst[2]]);triangle(c,im,[src[0],src[2],src[3]],[dst[0],dst[2],dst[3]]);
  }
  c.restore();
 }
 c.restore();return true;
}
export function drawDrachenRig(c,b,atlases){
 if(typeof atlases==='function')atlases=atlases();
 if(!atlases.every(im=>im?.naturalWidth))return;
 const s=b.cityArtScale||1;
 // Each atlas is an authored whole aircraft + its own suspended mines.
 // Occluded hulls are painted in full: no polygon cuts through overlapping art.
 const rects=[[17,100,240,399],[189,-89,530,655],[547,217,206,380]];
 c.save();c.translate(b.x,b.y);c.scale(s,s);c.translate(-384,-288);
 const cable=(a,z)=>{
  if(b.parts?.find(p=>p.id==='airship-'+a)?.destroyed||b.parts?.find(p=>p.id==='airship-'+z)?.destroyed)return;
  const anchors=[[203,268],[414,259],[601,394]],oa=b.cityRigOffsets?.[a]||[0,0],oz=b.cityRigOffsets?.[z]||[0,0],x=anchors[a][0]+oa[0],y=anchors[a][1]+oa[1],u=anchors[z][0]+oz[0],v=anchors[z][1]+oz[1];
  c.save();c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+(u-x)*.28,y+65,x+(u-x)*.72,v+65,u,v);
  c.strokeStyle='#191711';c.lineWidth=4;c.stroke();c.strokeStyle='#746851';c.lineWidth=1.5;c.stroke();c.restore();
 };
 cable(0,1);cable(1,2);
 for(const i of [1,0,2]){
  const p=b.parts?.find(p=>p.id==='airship-'+i),dead=p?.destroyed;
  const age=dead?Math.max(0,(b.motionTime||0)-(p.destroyedAt||0)+(b.destroying?b.destructionAge:0)):0;
  if(dead&&age>=1.8)continue;
  c.save();const off=b.cityRigOffsets?.[i]||[0,0];c.translate(...off);if(dead){const px=p.x/s+384-off[0],py=p.y/s+288-off[1];c.globalAlpha*=Math.max(0,1-age/1.8);c.translate(px,py+170*age*age);c.rotate((i===0?-1:1)*age*.19);c.scale(1-age*.12,1-age*.12);c.translate(-px,-py);}
  const image=atlases[i],frame=dead||p?.hp<p?.maxHp*.55?1:0;
  c.drawImage(image,frame*image.naturalWidth/2,0,image.naturalWidth/2,image.naturalHeight,...rects[i]);c.restore();
 }
 c.restore();
}

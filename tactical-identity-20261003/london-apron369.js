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
 const parts=b.parts||[],lost=parts.filter(p=>p.destroyed).length,pose=apronPose(b.apronTime||0,lost),s=b.apronScale||1;
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
  c.drawImage(hull,panel*256/768*hull.naturalWidth,0,256/768*hull.naturalWidth,216/512*hull.naturalHeight,(panel*256-384)*s,-256*s,256*s,216*s);
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

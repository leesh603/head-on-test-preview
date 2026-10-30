import {DOVER_COAST_PROFILE} from './dover-terrain-profile.js?v=dover3';
import {DOVER_MAP} from './dover-patrol-chart.js?v=dover3';

// The finite coastline is geometry; the native-resolution art is its material.
// Never stretch a complete 1024px landscape across a 6144px battlefield.
const N=DOVER_COAST_PROFILE.length,STEP=DOVER_MAP.height/(N-1),CLEARANCE=DOVER_MAP.coastInset;
const SHORE_WIDTH=[640,560],shore=[];
for(let side=0;side<2;side++){
 const x=Float64Array.from(DOVER_COAST_PROFILE,q=>q[side]*DOVER_MAP.width+(side?CLEARANCE:-CLEARANCE)),nx=new Float64Array(N),ny=new Float64Array(N),arc=new Float64Array(N);
 for(let i=0;i<N;i++){
  const a=Math.max(0,i-1),b=Math.min(N-1,i+1),dx=x[b]-x[a],dy=(b-a)*STEP,len=Math.hypot(dx,dy);
  nx[i]=dy/len*(side?-1:1);ny[i]=-dx/len*(side?-1:1);
 }
 // Sample enough authored pixels for the longer edge of every curved quad.
 // Outer headland corners must never magnify or smear the cliff material.
 const half=SHORE_WIDTH[side]/2;arc[0]=0;
 for(let i=1;i<N;i++){
  const dx=x[i]-x[i-1],dnx=(nx[i]-nx[i-1])*half,dny=(ny[i]-ny[i-1])*half;
  arc[i]=arc[i-1]+Math.max(Math.hypot(dx-dnx,STEP-dny),Math.hypot(dx+dnx,STEP+dny));
 }
 shore.push({x,nx,ny,arc});
}

export function doverCoastPoint(chart,v,side){
 const q=shore[side>0?1:0],p=Math.max(0,Math.min(N-1,v*(N-1))),i=Math.min(N-2,Math.floor(p)),t=p-i;
 return {x:chart.left+q.x[i]+(q.x[i+1]-q.x[i])*t,y:chart.top+v*chart.height};
}

function landPath(c,chart,left,top,w,h,side,first,last){
 const q=shore[side],edge=side?w:0;
 c.moveTo(edge,0);c.lineTo(doverCoastPoint(chart,(top-chart.top)/chart.height,side?1:-1).x-left,0);
 for(let i=first;i<=last;i++)c.lineTo(chart.left+q.x[i]-left,chart.top+i*STEP-top);
 c.lineTo(doverCoastPoint(chart,(top+h-chart.top)/chart.height,side?1:-1).x-left,h);c.lineTo(edge,h);c.closePath();
}

// Affine texture triangles share the same world-space vertices at each join.
// A subpixel clip overlap removes raster hairlines, without alpha matting or filters.
function triangle(c,im,sy,sh,ax,ay,bx,by,cx,cy,dx,dy,ex,ey,fx,fy){
 const mx=(ax+bx+cx)/3,my=(ay+by+cy)/3;
 c.save();c.beginPath();c.moveTo(ax+(ax-mx)*.006,ay+(ay-my)*.006);c.lineTo(bx+(bx-mx)*.006,by+(by-my)*.006);c.lineTo(cx+(cx-mx)*.006,cy+(cy-my)*.006);c.closePath();c.clip();
 // Keep neighbouring source rows available to bilinear sampling at every clip edge.
 c.transform(dx,dy,ex,ey,fx,fy);c.drawImage(im,0,0,im.naturalWidth,im.naturalHeight,0,-sy,im.naturalWidth,im.naturalHeight);c.restore();
}

function quad(c,im,sy,sh,ax,ay,bx,by,cx,cy,dx,dy){
 const iw=im.naturalWidth;
 triangle(c,im,sy,sh,ax,ay,bx,by,cx,cy,(bx-ax)/iw,(by-ay)/iw,(cx-ax)/sh,(cy-ay)/sh,ax,ay);
 const a=(dx-cx)/iw,b=(dy-cy)/iw;
 triangle(c,im,sy,sh,bx,by,dx,dy,cx,cy,a,b,(dx-bx)/sh,(dy-by)/sh,bx-a*iw,by-b*iw);
}

// Mirrored repeat joins a material edge to itself, including its alpha contour.
export function doverMaterialY(distance,height){
 const period=height*2,phase=((distance%period)+period)%period;
 return phase<=height?phase:period-phase;
}

function paintShore(c,im,chart,left,top,w,h,side,first,last){
 const q=shore[side],width=SHORE_WIDTH[side],half=width/2,density=im.naturalWidth/width;
 const entry=DOVER_MAP.entryY*(N-1),row=Math.min(N-2,Math.floor(entry)),arc=q.arc[row]+(q.arc[row+1]-q.arc[row])*(entry-row);
 // Keep the reflected edge outside the normal entry view; the two shores use independent phases.
 const phase=im.naturalHeight*(.5+side*.05)-arc*density;
 // A tilted shore extends well beyond its centre row. Cull the complete
 // quad, otherwise scrolling removes still-visible cliff triangles.
 const padding=Math.ceil(half/STEP)+2;
 for(let i=Math.max(0,first-padding);i<Math.min(N-1,last+padding);i++){
  if(Math.max(q.x[i],q.x[i+1])+half<left-chart.left||Math.min(q.x[i],q.x[i+1])-half>left+w-chart.left)continue;
  const x0=chart.left+q.x[i]-left,y0=chart.top+i*STEP-top,x1=chart.left+q.x[i+1]-left,y1=y0+STEP;
  let ax=x0-q.nx[i]*half,ay=y0-q.ny[i]*half,bx=x0+q.nx[i]*half,by=y0+q.ny[i]*half;
  const cx=x1-q.nx[i+1]*half,cy=y1-q.ny[i+1]*half,dx=x1+q.nx[i+1]*half,dy=y1+q.ny[i+1]*half;
  if(Math.max(ay,by,cy,dy)<-2||Math.min(ay,by,cy,dy)>h+2)continue;
  let at=q.arc[i]*density+phase,remaining=(q.arc[i+1]-q.arc[i])*density;
  while(remaining>.001){
   const period=Math.floor((at+1e-7)/im.naturalHeight),sy=Math.max(0,at-period*im.naturalHeight),flip=period%2!==0;
   const sh=Math.min(remaining,im.naturalHeight-sy),t=sh/remaining;
   const ex=ax+(cx-ax)*t,ey=ay+(cy-ay)*t,fx=bx+(dx-bx)*t,fy=by+(dy-by)*t;
   // Mirrored material periods meet on the very same authored edge pixels.
   // Reversing destination vertices preserves x (land/sea) orientation.
   if(flip)quad(c,im,doverMaterialY(at+sh,im.naturalHeight),sh,ex,ey,fx,fy,ax,ay,bx,by);
   else quad(c,im,doverMaterialY(at,im.naturalHeight),sh,ax,ay,bx,by,ex,ey,fx,fy);
   ax=ex;ay=ey;bx=fx;by=fy;remaining-=sh;at+=sh;
  }
 }
}

function paintSurface(c,image,left,top,w,h,base){
 c.fillStyle=base;c.fillRect(0,0,w,h);
 const iw=image?.naturalWidth||image?.width,ih=image?.naturalHeight||image?.height;if(!iw||!ih)return;
 for(let y=Math.floor(top/ih);y<=Math.floor((top+h)/ih);y++)for(let x=Math.floor(left/iw);x<=Math.floor((left+w)/iw);x++)c.drawImage(image,Math.floor(x*iw-left)-1,Math.floor(y*ih-top)-1,iw+2,ih+2);
}

export function paintDoverTerrain(c,chart,cx,cy,w,h,coast,renderer,surfaces={}){
 const left=cx-w/2,top=cy-h/2,first=Math.max(0,Math.ceil((top-chart.top)/STEP)),last=Math.min(N-1,Math.floor((top+h-chart.top)/STEP));
 c.save();c.beginPath();c.rect(0,0,w,h);c.clip();c.imageSmoothingEnabled=true;
 if(surfaces.sea)paintSurface(c,surfaces.sea,left,top,w,h,'#263e4b');
 else renderer.draw(c,{key:'sea',camera:{x:left,y:top},width:w,height:h});
 let west=false,east=false;
 for(let i=Math.max(0,first-1);i<=Math.min(N-1,last+1);i++){west||=chart.left+shore[0].x[i]>left;east||=chart.left+shore[1].x[i]<left+w;}
 if(west||east){
  c.save();c.beginPath();if(west)landPath(c,chart,left,top,w,h,0,first,last);if(east)landPath(c,chart,left,top,w,h,1,first,last);c.clip();
  // Dover's chalk downland belongs to this coast; never expose inland farms
  // underneath the cliff's alpha edge or while its art is loading.
  paintSurface(c,surfaces.land,left,top,w,h,'#59604a');c.restore();
 }
 if(coast?.naturalWidth){paintShore(c,coast,chart,left,top,w,h,0,first,last);paintShore(c,coast,chart,left,top,w,h,1,first,last);}
 // One atmospheric night grade on ground only; combat and warnings draw later.
 c.globalAlpha*=.38;c.fillStyle='#101b2d';c.fillRect(0,0,w,h);c.restore();
}

// Authored scenery, below combat. No entities, collisions, RNG or particle pool.
import {fx} from './fx-art.js?v=gal1';
const CELLS=[
 [92,39,257,324],[435,40,259,321],[772,42,257,319],[1117,40,258,323],
 [140,400,151,346],[485,397,153,348],[822,398,158,335],[1161,394,161,345],
 [169,764,101,285],[500,788,127,226],[807,765,185,292],[1184,763,108,302]
];
const sprites=[];
export const groundLifeReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const im=new Image();im.decoding='async';im.onload=()=>{
  // Atmosphere and a fractional blur are baked ONCE, never a live filter.
  for(let i=0;i<CELLS.length;i++){
   const [x,y,w,h]=CELLS[i],cv=document.createElement('canvas'),size=i<8?128:40;
   cv.width=Math.ceil(size*w/h)+4;cv.height=size+4;const c=cv.getContext('2d');
   c.imageSmoothingEnabled=true;c.filter='blur(0.3px)';c.drawImage(im,x-2,y-2,w+4,h+4,2,2,cv.width-4,size);c.filter='none';
   c.globalCompositeOperation='source-atop';c.globalAlpha=.22;c.fillStyle='#929b9e';c.fillRect(0,0,cv.width,cv.height);sprites[i]=cv;
  }resolve(true);
 };im.onerror=()=>resolve(false);im.src='./ground-life-20261011.webp?v=groundlife1';
});
function sprite(c,frame,x,y,height,a,alpha){
 const im=sprites[frame];if(!im)return;const width=height*im.width/im.height;
 c.save();c.translate(x,y);c.rotate(a);c.globalAlpha*=alpha;c.drawImage(im,-width/2,-height/2,width,height);c.restore();
}
const hash=(x,y)=>((Math.imul(x,73856093)^Math.imul(y,19349663))>>>0);
const mod=(x,n)=>(x%n+n)%n;
// Paths in normalized coordinates of the current masters. All endpoints and
// complete vehicle footprints checked on road/open dry ground. No free roam.
// kind, x1,y1,x2,y2, height, duration. Natural truck art faces DOWN, tank UP.
export const GROUND_ROUTES=Object.freeze({
 rural:[['ambulance',.500,.356,.539,.394,12,22],['lorry',.261,.681,.292,.740,12,28]],
 city:[['ambulance',.795,.358,.800,.557,18,25],['lorry',.217,.379,.375,.419,18,25]],
 london:[['ambulance',.854,.095,.857,.242,22,25],['lorry',.375,.731,.377,.843,22,28]],
 trenches:[['tank',.560,.544,.601,.542,40,34]],
 burning:[['tank',.513,.604,.562,.612,40,36]],
 cambrai:[['tank',.850,.315,.885,.330,32,32]],
 somme:[['tank',.226,.696,.248,.691,32,35]]
});
// u,v, trench direction, firing direction. Members move only along the short
// straight trench floor; they never wander into no-man's-land or water.
export const GROUND_FIGHTS=Object.freeze({
 trenches:[[.291,.165,-.52,.55],[.765,.163,.63,2.4],[.694,.636,-.48,-2.2]],
 burning:[[.286,.213,-.07,.6],[.742,.427,.22,-2.4],[.548,.574,-.34,-.9]],
 cambrai:[[.462,.719,-.13,.15],[.197,.311,.33,-.5]],
 somme:[[.234,.918,-.15,-.75],[.873,.405,.54,2.9]]
});
// u,v, event type. Fire anchors coincide with painted burning wrecks. Shells
// land on dry no-man's-land, not on the Somme's water channels.
export const GROUND_EVENTS=Object.freeze({
 trenches:[[.509,.475,'shell'],[.679,.394,'shell'],[.416,.584,'shell']],
 burning:[[.711,.140,'fire'],[.281,.461,'fire'],[.180,.704,'fire'],[.512,.357,'shell'],[.682,.571,'shell'],[.367,.540,'shell']],
 cambrai:[[.510,.380,'shell'],[.488,.635,'shell']],
 somme:[[.257,.584,'shell'],[.877,.434,'shell']],
 city:[[.426,.864,'work']],rural:[[.757,.476,'work']]
});
const BATTERIES={trenches:[.194,.178,58,.32],burning:[.731,.444,57,.45],cambrai:[.475,.683,44,-.3],somme:[.800,.320,55,-.45]};
// Reusable pose sampler, also used by terrain-footprint QA.
export function groundRoutePose(route,t,seed,out){
 const q=mod(t+(seed%173)*.31,route[6])/route[6];
 // Smooth acceleration / deceleration; brief stop at either end. Fade only
 // during the stop, so a repeat never teleports a visible moving vehicle.
 const travel=Math.max(0,Math.min(1,(q-.08)/.84)),p=travel*travel*(3-2*travel);
 out.u=route[1]+(route[3]-route[1])*p;out.v=route[2]+(route[4]-route[2])*p;
 out.heading=Math.atan2(route[4]-route[2],route[3]-route[1]);out.alpha=Math.min(1,q/.06,(1-q)/.06);
 out.moving=travel>.02&&travel<.98;out.progress=p;return out;
}
const pose={};
const LIMIT=Object.freeze({vehicle:6,fight:5,event:7});
export function drawGroundLife(c,key,left,top,width,height,period,t,density=1){
 if(!sprites.length||!Number.isFinite(period)||period<=0||!Number.isFinite(t)||density<=0)return;
 const routes=GROUND_ROUTES[key],fights=GROUND_FIGHTS[key],events=GROUND_EVENTS[key];if(!routes&&!fights&&!events)return;
 let vehicles=0,groups=0,emitters=0;
 const low=density<.7,mirror=key==='cambrai',xmin=Math.floor(left/period),xmax=Math.floor((left+width)/period),ymin=Math.floor(top/period),ymax=Math.floor((top+height)/period);
 for(let iy=ymin;iy<=ymax;iy++)for(let ix=xmin;ix<=xmax;ix++){
  const seed=hash(ix,iy),mx=mirror&&Math.abs(ix%2),my=mirror&&Math.abs(iy%2),sx=mx?-1:1,sy=my?-1:1;
  const baseX=ix*period-left,baseY=iy*period-top;
  if(routes)for(let j=0;j<routes.length&&vehicles<(low?3:LIMIT.vehicle);j++){
   const r=routes[j];groundRoutePose(r,t,seed+j*29,pose);
   const x=baseX+(mx?1-pose.u:pose.u)*period,y=baseY+(my?1-pose.v:pose.v)*period,size=r[5];
   if(x<-size||y<-size||x>width+size||y>height+size)continue;vehicles++;
   const a=Math.atan2(Math.sin(pose.heading)*sy,Math.cos(pose.heading)*sx),tank=r[0]==='tank';
   // One stable hull; only the independently clipped tread art changes.
   const artAngle=a+(tank?Math.PI/2:-Math.PI/2),alpha=.68*pose.alpha;
   const bounce=pose.moving?Math.sin(t*(tank?6:9)+j)*.28:0;
   sprite(c,tank?0:r[0]==='ambulance'?4:6,x,y+bounce,size,artAngle,alpha);
   if(tank&&pose.moving){
    const frame=1+Math.floor(mod(pose.progress*90,3));
    c.save();c.translate(x,y+bounce);c.rotate(artAngle);
    // These are clip masks over painted image pixels, not drawn tracks.
    for(const side of [-1,1]){c.save();c.beginPath();c.rect(side<0?-size*.31:size*.19,-size*.37,size*.12,size*.74);c.clip();sprite(c,frame,0,0,size,0,alpha);c.restore();}c.restore();
   }
   if(pose.moving&&!low){const aft=tank?size*.38:size*.31,q=mod(t*.65+seed*.01,1);fx(c,'dustPuff',x-Math.cos(a)*(aft+q*8),y-Math.sin(a)*(aft+q*8),12+q*9,9+q*7,a,.14*(1-q)*pose.alpha);}
  }
  if(fights)for(let j=0;j<fights.length&&groups<(low?2:LIMIT.fight);j++){
   const f=fights[j],x0=baseX+(mx?1-f[0]:f[0])*period,y0=baseY+(my?1-f[1]:f[1])*period;
   if(x0<-35||y0<-35||x0>width+35||y0>height+35)continue;groups++;
   const cycle=mod(t+(seed%83)*.27+j*2.3,14),tx=Math.cos(f[2])*sx,ty=Math.sin(f[2])*sy;
   const aim=Math.atan2(Math.sin(f[3])*sy,Math.cos(f[3])*sx);
   const count=low?2:3;
   for(let n=0;n<count;n++){
    const local=mod(cycle+n*3.4,14),moving=local>8&&local<11;
    const crawl=moving?Math.sin((local-8)/3*Math.PI)*4:0;
    const x=x0+tx*((n-1)*9+crawl),y=y0+ty*((n-1)*9+crawl);
    const shooting=local<2.2,frame=n===1?10:shooting?8:moving?11:9;
    sprite(c,frame,x,y,n===1?11:10,aim+Math.PI/2,.70);
    // Short, dim volleys. No ambient projectiles crossing the flight layer.
    if(shooting&&mod(local,n===1?.19:.72)<.065){const tip=n===1?4.5:4;fx(c,'muzzle',x+Math.cos(aim)*tip,y+Math.sin(aim)*tip,5,4,aim,.33);}
   }
  }
  const battery=BATTERIES[key];
  if(battery&&!(seed&1)&&seed%4!==3&&emitters<(low?3:LIMIT.event)){
   const x=baseX+(mx?1-battery[0]:battery[0])*period,y=baseY+(my?1-battery[1]:battery[1])*period;
   if(x>-50&&y>-50&&x<width+50&&y<height+50){
    emitters++;const a=(mx?-battery[3]:battery[3])*(my?-1:1)+(my?Math.PI:0),q=mod(t+(seed%53)*.4,9);
    const tip=battery[2]*.31,gx=x+Math.sin(a)*tip,gy=y-Math.cos(a)*tip;
    if(q<.14)fx(c,'muzzleHeavy',gx,gy,17,21,a,.36*(1-q/.14));
    if(q<1.8)fx(c,'gunSmoke',gx+q*4,gy-q*6,15+q*10,18+q*12,a,.21*(1-q/1.8));
   }
  }
  if(events)for(let j=0;j<events.length&&emitters<(low?3:LIMIT.event);j++){
   const e=events[j],x=baseX+(mx?1-e[0]:e[0])*period,y=baseY+(my?1-e[1]:e[1])*period;
   if(x<-55||y<-75||x>width+55||y>height+55)continue;emitters++;
   if(e[2]==='work')continue; // Yard activity is handled by road vehicles.
   if(e[2]==='fire'){
    fx(c,'fireGround',x,y,15,19,0,.35+Math.sin(t*4+j)*.05);
    const q=mod(t*.16+j*.29+seed*.001,1);fx(c,'smokeDark',x+q*9,y-q*35,18+q*27,20+q*30,-.1,.22*(1-q));
   }else{
    const cycle=key==='burning'?6.5:11,q=mod(t+j*2.19+(seed%61)*.47,cycle);
    if(q<.24)fx(c,'profileEarth'+Math.min(3,Math.floor(q/.06)),x,y,29,26,0,.38*(1-q/.4));
    if(q<1.4)fx(c,'dirtBurst',x+q*3,y-q*5,22+q*20,20+q*14,0,.25*(1-q/1.4));
    if(q<3.3)fx(c,'smokeDust',x+q*4,y-q*9,24+q*12,22+q*13,0,.18*(1-q/3.3));
   }
  }
 }
}
// The harbor is one authored landmark, so activity is clipped to that same
// transform/fade by its caller. Coordinates use the harbor master, not sea tiles.
const harborRoute=['lorry',.528,.590,.522,.740,18,27];
export function drawHarborLife(c,width,height,t){
 if(!sprites.length)return;groundRoutePose(harborRoute,t,41,pose);
 const x=pose.u*width,y=pose.v*height,a=pose.heading-Math.PI/2;
 sprite(c,6,x,y,18*height/1254,a,.64*pose.alpha);
}
export function drawCoastLife(c,x,y,t){
 if(!sprites.length)return;
 sprite(c,mod(t,10)<2?8:9,x,y,9,-.3,.62);
 if(mod(t,8)<.1)fx(c,'muzzle',x-1,y-4,4,4,-.3,.3);
}

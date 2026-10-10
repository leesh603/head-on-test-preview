// Authored scenery, below combat. No entities, collisions, RNG or particle pool.
import {fx,fxImage,fxArtReady} from './fx-art.js?v=gal1';
const CELLS=[
 [92,39,257,324],[435,40,259,321],[772,42,257,319],[1117,40,258,323],
 [140,400,151,346],[485,397,153,348],[822,398,158,335],[1161,394,161,345],
 [169,764,101,285],[500,788,127,226],[807,765,185,292],[1184,763,108,302]
];
const sprites=[];
const atlasReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const im=new Image();im.decoding='async';im.onload=()=>{
  // Atmosphere and a fractional blur are baked ONCE, never a live filter.
  for(let i=0;i<CELLS.length;i++){
   const [x,y,w,h]=CELLS[i],cv=document.createElement('canvas'),size=i<8?128:40;
   cv.width=Math.ceil(size*w/h)+4;cv.height=size+4;const c=cv.getContext('2d');
   if(!c){resolve(false);return}
   c.imageSmoothingEnabled=true;c.filter='blur(0.3px)';c.drawImage(im,x-2,y-2,w+4,h+4,2,2,cv.width-4,size);c.filter='none';
   c.globalCompositeOperation='source-atop';c.globalAlpha=.22;c.fillStyle='#929b9e';c.fillRect(0,0,cv.width,cv.height);sprites[i]=cv;
  }resolve(true);
 };im.onerror=()=>resolve(false);im.src='./ground-life-20261011.webp?v=groundlife1';
});
// FX source sheets include large transparent margins. Bake tight 128px
// ground-only copies once; no per-frame pixel reads, filters or new images.
const groundFxImages={};
export const groundLifeStats={atlas:0,fx:0,vehicles:0,groups:0,emitters:0,alpha:1};
export const groundLifeReady=Promise.all([atlasReady,fxArtReady]).then(([ok])=>{
 if(typeof document==='undefined')return ok;
 const keys=['smokeDark','smokeDust','fireGround','dirtBurst','gunSmoke','dustPuff'];
 for(const key of keys){
  const im=fxImage(key);if(!im)continue;
  try{
   const cv=document.createElement('canvas');cv.width=cv.height=128;const g=cv.getContext('2d');if(!g)continue;
   const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height,k=128/Math.max(iw,ih);
   g.drawImage(im,0,0,iw*k,ih*k);const pixels=g.getImageData(0,0,128,128).data;
   let l=128,r=0,top=128,b=0;
   for(let y=0;y<128;y++)for(let x=0;x<128;x++)if(pixels[(y*128+x)*4+3]>5){l=Math.min(l,x);r=Math.max(r,x);top=Math.min(top,y);b=Math.max(b,y);}
   if(r<=l||b<=top)continue;l=Math.max(0,l-2);top=Math.max(0,top-2);r=Math.min(127,r+2);b=Math.min(127,b+2);
   const tight=document.createElement('canvas');tight.width=r-l+1;tight.height=b-top+1;const tc=tight.getContext('2d');if(!tc)continue;
   tc.drawImage(cv,l,top,tight.width,tight.height,0,0,tight.width,tight.height);groundFxImages[key]=tight;groundLifeStats.fx++;
  }catch{/* Original painted FX remains the safe fallback. */}
 }return ok;
});
function groundFx(c,key,x,y,w,h,angle=0,alpha=1){
 const im=groundFxImages[key];if(!im)return fx(c,key,x,y,w,h,angle,alpha);
 const k=Math.min(w/im.width,h/im.height),dw=im.width*k,dh=im.height*k;
 c.save();c.translate(x,y);if(angle)c.rotate(angle);c.globalAlpha*=alpha;c.drawImage(im,-dw/2,-dh/2,dw,dh);c.restore();return true;
}
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
 rural:[['ambulance',.491,.357,.520,.373,10,22],['lorry',.2474,.694,.267,.733,10,28]],
 city:[['ambulance',.795,.358,.800,.557,18,25],['lorry',.217,.379,.375,.419,18,25]],
 london:[['ambulance',.854,.095,.857,.242,22,25],['lorry',.375,.731,.377,.843,22,28]],
 trenches:[['tank',.560,.544,.601,.542,40,34]],
 burning:[['tank',.513,.604,.562,.612,40,36]],
 cambrai:[['tank',.850,.280,.885,.286,32,32]],
 somme:[['tank',.226,.696,.248,.691,32,35]]
});
// u,v, trench direction, firing direction. The short sorties stay within the
// inspected dry parapet apron (at most 17px from each station), never free roam.
export const GROUND_FIGHTS=Object.freeze({
 trenches:[[.291,.165,-.52,.55],[.765,.163,.63,2.4],[.694,.636,-.48,-2.2],[.354,.134,-.52,-2.6]],
 burning:[[.286,.213,-.07,.6],[.742,.427,.22,-2.4],[.548,.574,-.34,-.9]],
 cambrai:[[.839,.617,-.27,-2.1]]
});
// u,v, event type. Fire anchors coincide with painted burning wrecks. Shells
// land on dry no-man's-land, not on the Somme's water channels.
export const GROUND_EVENTS=Object.freeze({
 trenches:[[.509,.475,'shell'],[.679,.394,'shell'],[.416,.584,'shell'],[.392,.238,'shell'],[.248,.261,'shell'],[.688,.690,'shell'],[.242,.652,'shell']],
 burning:[[.711,.140,'fire'],[.281,.461,'fire'],[.180,.704,'fire'],[.512,.357,'shell'],[.682,.571,'shell'],[.367,.540,'shell'],[.407,.249,'shell'],[.240,.307,'shell']],
 cambrai:[[.510,.380,'shell'],[.488,.635,'shell'],[.803,.322,'shell'],[.735,.403,'shell'],[.904,.459,'shell']],
 somme:[[.257,.584,'shell'],[.877,.434,'shell']]
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
const infantryPose={};
// Shell strikes and nearby infantry use exactly the same 24-second clock.
// A burst is followed by dirt, a long smoke tail, and the squad's withdrawal.
// There is no event queue or entity pool: time reconstructs a bounded scene.
export function groundBattlePhase(t,seed,station){
 return mod(t+(seed%83)*.27+station*5.7,24);
}
export function groundInfantryPose(t,seed,station,member,out){
 const local=groundBattlePhase(t,seed,station),epoch=Math.floor((t+(seed%83)*.27+station*5.7)/24);
 const delay=member*.12;let along=0,forward=0,heading=0,frame=9,alpha=1,state='cover';
 if(local<4){state='fire';frame=member===1?10:8;}
 else if(local<6){frame=9;}
 else if(local<9){state='charge';forward=Math.max(0,Math.min(1,(local-6-delay)/2.5))*10;frame=8;}
 else if(local<10.5){state='scatter';const p=Math.max(0,Math.min(1,(local-9-delay)/1.1));forward=10*(1-p);along=(member-1)*3*p;heading=Math.PI;frame=8;}
 else if(local<13){state='retreat';along=(member-1)*3-Math.min(1,(local-10.5)/1.8)*8;heading=-Math.PI/2;frame=8;}
 else if(local<19){along=(member-1)*3-8;}
 else {state='regroup';along=((member-1)*3-8)*(1-(local-19)/5);heading=Math.PI/2;frame=8;}
 if(member===2&&mod(epoch+station,3)===0&&local>=9.15){
  state='fallen';forward=9;along=1;heading=.9;frame=11;
  alpha=local<15?1:local<19?(19-local)/4:0;
 }
 out.along=along;out.forward=forward;out.heading=heading;out.frame=frame;out.alpha=alpha;out.state=state;out.local=local;return out;
}
// Painted sprites only. Ground blasts are brown earth, never air fireballs.
// All tails have a finite lifetime and at most three baked smoke images.
function shellScene(c,x,y,age,burning,low,ignite=false){
 if(age<0||age>18)return;
 if(ignite&&age>.65&&age<9){const fade=Math.min(1,(age-.65)/1.2,(9-age)/2);groundFx(c,'fireGround',x,y+4,42+Math.sin(age*9)*3,28,0,.65*fade);}
 if(age<.32)groundFx(c,'profileEarth'+Math.min(3,Math.floor(age/.08)),x,y,54,48,0,.76*(1-age/.55));
 if(age<1.65)groundFx(c,'dirtBurst',x,y-age*8,54+age*24,48+age*22,0,.7*(1-age/1.65));
 if(age<5.5)groundFx(c,'smokeDust',x+age*3,y-age*4,58+age*12,52+age*10,0,.55*Math.min(1,age/.4)*(1-age/5.5));
 for(let n=0;n<(low?1:3);n++){
  const q=age-n*1.1;if(q<.3||q>16)continue;
  const fade=Math.min(1,q/1.2)*Math.max(0,1-q/16);
  groundFx(c,burning?'smokeDark':'smokeDust',x+q*2.6+n*5,y-q*3.7-n*5,44+q*4,52+q*5.2,-.12,.48*fade);
 }
}
function wreckFire(c,x,y,t,seed,low){
 const flicker=.87+Math.sin(t*7+seed)*.08+Math.sin(t*11+seed)*.05;
 groundFx(c,'fireGround',x,y,59*flicker,36*flicker,0,.75);
 // Staggered rising smoke prevents a solitary puff from resetting visibly.
 for(let n=0;n<(low?2:3);n++){
  const q=mod(t*.065+n/3+seed*.003,1),fade=Math.sin(q*Math.PI);
  groundFx(c,'smokeDark',x+q*26+n*3,y-12-q*66,48+q*65,68+q*95,-.16,.7*fade);
 }
}
const LIMIT=Object.freeze({vehicle:6,fight:5,event:10});
export function drawGroundLife(c,key,left,top,width,height,period,t,density=1){
 groundLifeStats.atlas=sprites.length;groundLifeStats.alpha=c.globalAlpha;
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
   if(pose.moving&&!low){const aft=tank?size*.38:size*.31,q=mod(t*.65+seed*.01,1);groundFx(c,'dustPuff',x-Math.cos(a)*(aft+q*8),y-Math.sin(a)*(aft+q*8),12+q*9,9+q*7,a,.14*(1-q)*pose.alpha);}
  }
  if(fights)for(let j=0;j<fights.length&&groups<(low?2:LIMIT.fight);j++){
   const f=fights[j],x0=baseX+(mx?1-f[0]:f[0])*period,y0=baseY+(my?1-f[1]:f[1])*period;
   if(x0<-35||y0<-35||x0>width+35||y0>height+35)continue;groups++;
   const tx=Math.cos(f[2])*sx,ty=Math.sin(f[2])*sy;
   const aim=Math.atan2(Math.sin(f[3])*sy,Math.cos(f[3])*sx);
   const count=low?3:4;
   for(let n=0;n<count;n++){
    groundInfantryPose(t,seed,j,n,infantryPose);
    const p=infantryPose,run=p.frame===8&&p.state!=='fire';
    const x=x0+tx*((n-1)*7+p.along)+Math.cos(aim)*p.forward;
    const y=y0+ty*((n-1)*7+p.along)+Math.sin(aim)*p.forward;
    const a=p.state==='retreat'?Math.atan2(-ty,-tx):p.state==='regroup'?Math.atan2(ty,tx):aim+p.heading;
    const bob=run?Math.sin(t*13+n*2)*.22:0;
    sprite(c,p.frame,x,y+bob,n===1&&p.frame===10?15:14,a+Math.PI/2,.78*p.alpha);
    // Short, dim volleys. No ambient projectiles crossing the flight layer.
    if(p.state==='fire'&&mod(p.local+n*.17,n===1?.22:.8)<.075){const tip=n===1?6:5;groundFx(c,'muzzle',x+Math.cos(aim)*tip,y+Math.sin(aim)*tip,7,5,aim,.55);}
   }
   // Two impacts on the inspected dry apron, timed to the same squad clock.
   if(emitters<(low?6:LIMIT.event)){
    emitters++;const phase=groundBattlePhase(t,seed,j);
    shellScene(c,x0+Math.cos(aim)*28,y0+Math.sin(aim)*28,mod(phase-9,24),key==='burning',low,key==='burning'&&j%2===0);
    if(!low)shellScene(c,x0-tx*22+Math.cos(aim)*19,y0-ty*22+Math.sin(aim)*19,mod(phase-11,24),key==='burning',low);
   }
  }
  const battery=BATTERIES[key];
  if(battery&&!(seed&1)&&seed%4!==3&&emitters<(low?6:LIMIT.event)){
   const x=baseX+(mx?1-battery[0]:battery[0])*period,y=baseY+(my?1-battery[1]:battery[1])*period;
   if(x>-50&&y>-50&&x<width+50&&y<height+50){
    emitters++;const a=(mx?-battery[3]:battery[3])*(my?-1:1)+(my?Math.PI:0),q=mod(t+(seed%53)*.4,9);
    const tip=battery[2]*.31,gx=x+Math.sin(a)*tip,gy=y-Math.cos(a)*tip;
    if(q<.18)groundFx(c,'muzzleHeavy',gx,gy,21,25,a,.52*(1-q/.22));
    if(q<3.5)groundFx(c,'gunSmoke',gx+q*4,gy-q*6,22+q*10,25+q*12,a,.34*(1-q/3.5));
   }
  }
  if(events)for(let j=0;j<events.length&&emitters<(low?6:LIMIT.event);j++){
   const e=events[j],x=baseX+(mx?1-e[0]:e[0])*period,y=baseY+(my?1-e[1]:e[1])*period;
   if(x<-115||y<-135||x>width+115||y>height+135)continue;emitters++;
   if(e[2]==='fire')wreckFire(c,x,y,t,j+seed,low);
   else {
    const cycle=key==='burning'?13:17,q=mod(t+j*3.31+(seed%61)*.47,cycle);
    shellScene(c,x,y,q,key==='burning',low,key==='burning'&&j%3===0);
   }
  }
 }
 groundLifeStats.vehicles=vehicles;groundLifeStats.groups=groups;groundLifeStats.emitters=emitters;
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
 if(mod(t,8)<.1)groundFx(c,'muzzle',x-1,y-4,4,4,-.3,.3);
}

// Region 2 only. Six authored scenes on the existing 1254px trench master.
// Sample short group tracks from game time; never create gameplay entities,
// use game RNG, register an update hook, or retain travelled terrain tiles.
export const TRENCH_SECTORS=Object.freeze([
 {id:'west-over-top',u:.291,v:.165,line:-.52,aim:.72,role:'assault',count:7,offset:0,support:'ammo',rear:[[-34,-35],[-14,-24],[12,-13]],fire:false},
 {id:'east-emplacement',u:.765,v:.163,line:.63,aim:2.72,role:'defend',count:8,offset:9,support:'relief',rear:[[49,-30],[29,-20],[14,-12]],fire:false},
 {id:'central-breach',u:.400,v:.320,line:.05,aim:1.30,role:'assault',count:6,offset:17,support:'stretcher',rear:[[-36,-18],[-6,-22],[28,-17]],fire:true},
 {id:'east-wire',u:.801,v:.500,line:-1.20,aim:3.12,role:'defend',count:7,offset:24,support:'ammo',rear:[[32,-42],[23,-17],[30,14]],fire:false},
 {id:'southwest-push',u:.337,v:.631,line:.40,aim:-1.02,role:'assault',count:8,offset:7,support:'relief',rear:[[-36,34],[-19,22],[-4,15]],fire:false},
 {id:'southern-aid-post',u:.630,v:.652,line:.10,aim:-1.90,role:'defend',count:6,offset:20,support:'stretcher',rear:[[10,22],[25,44],[41,61]],fire:true}
]);
export const TRENCH_LIMITS=Object.freeze({sectors:6,mobileSectors:3,troops:96,mobileTroops:48,fx:48,mobileFx:24});
export const trenchFrontlineStats={sectors:0,troops:0,fx:0,props:0,vehicles:0,assets:false,cacheBuilds:0};
const mod=(x,n)=>(x%n+n)%n,clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const hash=(x,y)=>(Math.imul(x,73856093)^Math.imul(y,19349663))>>>0;
export const trenchClock=(t,seed,sector)=>mod(t+(seed%71)*.37+sector.offset,34);

// One scratch pose per renderer. Formation stays spread over 60-90px, with
// staggered departures and two bounds; not seven copies sliding in a line.
export function trenchSoldierPose(sector,member,clock,out){
 const rank=member%4,row=Math.floor(member/4),delay=member*.19;
 let along=(rank-1.5)*16+row*6,forward=-row*14,heading=sector.aim,frame=9,state='cover',alpha=1,moving=false;
 const q=Math.max(0,clock-delay),reach=48+(member%3)*11;
 if(sector.role==='assault'){
  let progress=0,spread=0;
  if(q<3){state='fire';frame=8;}
  else if(q<8){progress=smooth((q-3)/5)*.65;state='advance';moving=true;}
  else if(q<10){progress=.65;state='cover';}
  else if(q<13){progress=.65+smooth((q-10)/3)*.35;state='advance';moving=true;}
  else if(q<16){progress=1;spread=smooth((q-13)/3);state=member%3===0?'prone':'scatter';moving=state==='scatter';frame=11;}
  else if(q<24){progress=1-smooth((q-16)/8);spread=progress;state='withdraw';moving=true;heading+=Math.PI;}
  else {state=q<28?'cover':'fire';frame=state==='fire'?8:9;}
  forward+=progress*reach;along+=(rank-1.5)*9*spread;
  if(moving)frame=8;
  // One casualty at the shell's edge. Fade entirely while the remainder
  // regroups, so the new loop never visibly resurrects a body.
  if(member===sector.count-1&&clock>=13.8){state='fallen';frame=11;moving=false;forward=-row*14+reach;along=(rank-1.5)*16+row*6;heading=sector.aim+.7;alpha=clock<24?1:1-clamp((clock-24)/4);}
 }else{
  // Defenders hold the parapet and feed replacement pairs along its length.
  if(q<12||q>23){state='fire';frame=member%3===0?11:8;}
  else if(q<17){state='cover';forward-=smooth((q-12)/2)*7;}
  else {const p=smooth((q-17)/6);state='relieve';moving=true;frame=8;forward-=(1-p)*7;along+=Math.sin(p*Math.PI)*(member%2?9:-9);heading=sector.line;}
 }
 Object.assign(out,{along,forward,heading,frame,state,alpha,moving});return out;
}

// Support parties remain on individually measured rear communication routes.
// Outward and return journeys meet continuously; a short stop turns the group.
export function trenchSupportPose(route,clock,out){
 const q=mod(clock,34),back=q>=17,p=smooth((back?q-18:q-1)/14),travel=back?1-p:p;
 const segment=travel<.5?0:1,f=travel<.5?travel*2:(travel-.5)*2;
 const a=route[segment],b=route[segment+1];
 out.x=a[0]+(b[0]-a[0])*f;out.y=a[1]+(b[1]-a[1])*f;
 out.heading=Math.atan2(b[1]-a[1],b[0]-a[0])+(back?Math.PI:0);
 out.moving=p>0&&p<1;return out;
}

// This tiny atlas is requested only on entering the trench map. Existing maps
// neither load it nor pay its one-time crop/bake cost. No live filter/readback.
let supportPromise;const supportImages=[];
export function loadTrenchSupport(){
 if(supportPromise)return supportPromise;
 if(typeof Image==='undefined')return Promise.resolve(false);
 supportPromise=new Promise(resolve=>{
  const im=new Image();im.decoding='async';im.onload=()=>{
   const cells=[[235,30,160,650],[700,275,480,220],[0,805,626,277],[637,805,610,270]];
   for(const [x,y,w,h] of cells){const cv=document.createElement('canvas'),k=128/Math.max(w,h);cv.width=Math.ceil(w*k);cv.height=Math.ceil(h*k);const c=cv.getContext('2d');
    if(!c){resolve(false);return;}c.drawImage(im,x,y,w,h,0,0,cv.width,cv.height);
    c.globalCompositeOperation='source-atop';c.globalAlpha=.16;c.fillStyle='#85867c';c.fillRect(0,0,cv.width,cv.height);supportImages.push(cv);
   }trenchFrontlineStats.assets=true;resolve(true);
  };im.onerror=()=>resolve(false);im.src='./trench-support-20261011.webp';
 });return supportPromise;
}
function prop(c,index,x,y,size,a=0,alpha=.86){
 const im=supportImages[index];if(!im)return;
 const k=size/Math.max(im.width,im.height),w=im.width*k,h=im.height*k;
 c.save();c.translate(x,y);c.rotate(a);c.globalAlpha*=alpha;c.drawImage(im,-w/2,-h/2,w,h);c.restore();trenchFrontlineStats.props++;
}
const soldier={},support={};
// Widen the six engagements into damaged defensive belts. All inert dressing
// is baked once into ONE 1024² transparent master (4 MiB), reused across tiles.
// No extra downloaded art, live filters, per-frame debris draws or world history.
let damageMaster;
function drawDamageBelt(c,left,top,width,height,period,paint){
 if(!paint.ready||supportImages.length!==4||typeof document==='undefined')return;
 if(!damageMaster){
  damageMaster=document.createElement('canvas');damageMaster.width=damageMaster.height=1024;
  const g=damageMaster.getContext('2d');if(!g){damageMaster=null;return;}
  g.scale(1024/1254,1024/1254);trenchFrontlineStats.cacheBuilds++;
  for(const s of TRENCH_SECTORS){
   const x=s.u*1254,y=s.v*1254,tx=Math.cos(s.line),ty=Math.sin(s.line),ax=Math.cos(s.aim),ay=Math.sin(s.aim);
   prop(g,2,x-tx*38,y-ty*38,44,s.line,.84);
   prop(g,3,x+ax*62,y+ay*62,66,s.line,.78);
   prop(g,1,x-ax*13-tx*22,y-ay*13-ty*22,12,s.line);
   for(let n=0;n<2;n++)paint.unit(g,11,x+ax*(38+n*16)+tx*(n?28:-29),y+ay*(38+n*16)+ty*(n?28:-29),18,s.aim+1.1+n,.64);
   for(const [n,along] of [-126,-75,74,128].entries()){
    const bx=x+tx*along,by=y+ty*along;
    prop(g,2,bx,by,48+n%2*16,s.line+(n%2?-.13:.12),.78);
    prop(g,3,bx+ax*(45+n%2*19),by+ay*(45+n%2*19),62+n%2*18,s.line+.12,.72);
    if(n%2===0)paint.unit(g,11,bx+ax*33,by+ay*33,18,s.aim+1.7,.66);
   }
   // Supply stacks stay behind the line, rather than scattered in open ground.
   for(let n=0;n<5;n++)prop(g,1,x-ax*43+tx*(n%3*15-15),y-ay*43+ty*(n%3*15-15)+Math.floor(n/3)*10,17,s.line,.85);
  }
 }
 const x1=Math.floor(left/period),x2=Math.floor((left+width)/period),y1=Math.floor(top/period),y2=Math.floor((top+height)/period);
 for(let iy=y1;iy<=y2;iy++)for(let ix=x1;ix<=x2;ix++){
  c.drawImage(damageMaster,ix*period-left,iy*period-top,period,period);trenchFrontlineStats.cachedTiles++;
 }
}

// Three broad, slow plumes per authored sector bridge the empty spaces between
// squads. Budgeted image stamps, not particles; central combat stays uncovered.
function drawFrontSmoke(c,left,top,width,height,period,t,low,effect){
 const max=low?7:14;let plumes=0,fireSites=0;
 for(const item of visibleSectors(left,top,width,height,period)){
  const s=item.sector,tx=Math.cos(s.line),ty=Math.sin(s.line),ax=Math.cos(s.aim),ay=Math.sin(s.aim);
  for(let n=0;n<3;n++){
   const along=n===0?-98:n===1?106:20,forward=n===2?180:19;
   const x=item.x-left+tx*along+ax*forward,y=item.y-top+ty*along+ay*forward;
   if(x<-100||y<-70||x>width+90||y>height+160||plumes>=max)continue;
   const clock=Math.floor(t*(low?8:12))/(low?8:12),phase=clock*.11+s.offset+n*2.1+(item.seed%17);
   const burning=n===0&&(s.fire||s.id==='west-over-top'||s.id==='east-wire');
   // Fire remains tied to wreckage and parapets, not arbitrary terrain points.
   if(burning&&fireSites<(low?2:4)){
    fireSites++;effect('fireGround',x,y+3,48+Math.sin(t*7+s.offset)*3,34,0,.76);
    effect('fireGround',x+19,y-3,30,23,0,.53+.08*Math.sin(t*9));
   }
   const sway=Math.sin(phase)*9,breath=1+Math.sin(phase*.71)*.09;
   effect(burning?'smokeDark':'smokeDust',x+19+sway,y-34, (burning?150:195)*breath,(burning?184:150)*breath,-.25,.51+Math.sin(phase*.83)*.045);
   plumes++;
  }
 }
 trenchFrontlineStats.plumes=plumes;trenchFrontlineStats.fireSites=fireSites;
}
// Viewport-only cache (at most 54 candidates), not an unbounded world registry.
let cacheKey='',candidates=[];
function visibleSectors(left,top,width,height,period){
 const key=[Math.floor(left/80),Math.floor(top/80),width,height,period].join(':');
 if(cacheKey!==key){
  cacheKey=key;candidates=[];
  const minX=Math.floor((left-180)/period),maxX=Math.floor((left+width+180)/period),minY=Math.floor((top-180)/period),maxY=Math.floor((top+height+180)/period);
  for(let iy=minY;iy<=maxY;iy++)for(let ix=minX;ix<=maxX;ix++)for(const sector of TRENCH_SECTORS){
   const x=(ix+sector.u)*period,y=(iy+sector.v)*period;
   if(x<left-200||y<top-200||x>left+width+200||y>top+height+200)continue;
   candidates.push({sector,x,y,seed:hash(ix,iy),distance:(x-left-width/2)**2+(y-top-height/2)**2});
  }
  candidates.sort((a,b)=>a.distance-b.distance);candidates.length=Math.min(candidates.length,54);
 }return candidates;
}

export function drawTrenchFrontline(c,left,top,width,height,period,t,density,paint){
 const low=density<.7,limit=low?TRENCH_LIMITS.mobileSectors:TRENCH_LIMITS.sectors,maxTroops=low?TRENCH_LIMITS.mobileTroops:TRENCH_LIMITS.troops,maxFx=low?TRENCH_LIMITS.mobileFx:TRENCH_LIMITS.fx;
 Object.assign(trenchFrontlineStats,{sectors:0,troops:0,fx:0,props:0,vehicles:0,cachedTiles:0,plumes:0,fireSites:0});loadTrenchSupport();
 let fires=0;
 const effect=(...args)=>{if(trenchFrontlineStats.fx>=maxFx)return;trenchFrontlineStats.fx++;paint.fx(c,...args)};
 drawDamageBelt(c,left,top,width,height,period,paint);
 drawFrontSmoke(c,left,top,width,height,period,t,low,effect);
 for(const item of visibleSectors(left,top,width,height,period)){
  const {sector:s,seed}=item,x0=item.x-left,y0=item.y-top;
  if(x0<-125||y0<-125||x0>width+125||y0>height+125)continue;
  const party=s.support==='stretcher'?4:3,total=s.count+3+party+2;
  if(trenchFrontlineStats.sectors>=limit||trenchFrontlineStats.troops+total>maxTroops)continue;
  trenchFrontlineStats.sectors++;trenchFrontlineStats.troops+=total;
  // Peripheral formations sample at 12Hz; central formations at 24Hz. Flash
  // clocks remain continuous. No individual AI/update cost, even on mobile.
  const peripheral=Math.abs(x0-width/2)>width*.38||Math.abs(y0-height/2)>height*.38,hz=peripheral?12:24;
  const clock=trenchClock(t,seed,s),poseClock=trenchClock(Math.floor(t*hz)/hz,seed,s);
  const tx=Math.cos(s.line),ty=Math.sin(s.line),ax=Math.cos(s.aim),ay=Math.sin(s.aim);
  // The inert parapet, wire, supply stacks and casualties are in damageMaster.
  for(let n=0;n<s.count;n++){
   const p=trenchSoldierPose(s,n,poseClock,soldier),x=x0+tx*p.along+ax*p.forward,y=y0+ty*p.along+ay*p.forward;
   const stride=p.moving?Math.sin(t*12+n*2.3):0;
   paint.unit(c,p.frame,x,y+stride*.38,21,p.heading+Math.PI/2+stride*.035,p.alpha);
   if(p.state==='fire'&&mod(clock+n*.23,1.65)<.10){effect('muzzle',x+ax*9,y+ay*9,9,6,s.aim,.64);}
  }
  // Machine gun: a fixed gunner, loader and ammunition handler. Burst/rest
  // cadence differs by side and points into the same group's no-man's-land.
  const gx=x0-tx*47-ax*4,gy=y0-ty*47-ay*4;
  paint.unit(c,10,gx,gy,24,s.aim+Math.PI/2,.90);
  paint.unit(c,9,gx-ax*10+tx*9,gy-ay*10+ty*9,18,s.aim+Math.PI/2,.86);
  paint.unit(c,9,gx-ax*13-tx*9,gy-ay*13-ty*9,18,s.aim+Math.PI/2+.4,.84);
  const burst=mod(clock+(s.role==='defend'?1.1:0),s.role==='defend'?3.1:4.8);
  if(burst<1.25&&mod(clock,.21)<.09)effect('muzzle',gx+ax*12,gy+ay*12,11,7,s.aim,.70);
  if(burst<1.4)effect('gunSmoke',gx+ax*15+burst*3,gy+ay*15-burst*3,17+burst*8,16+burst*8,0,.20*(1-burst/1.4));
  trenchSupportPose(s.rear,poseClock+4,support);
  const px=x0+support.x,py=y0+support.y,pa=support.heading,dx=Math.cos(pa),dy=Math.sin(pa);
  if(s.support==='stretcher'){
   prop(c,0,px,py,48,pa+Math.PI/2,.94);
   paint.unit(c,8,px-dy*13-dx*8,py+dx*13-dy*8,19,pa+Math.PI/2,.90);
  }else{
   for(let n=0;n<3;n++){
    const side=n===2?9:0,back=n*12;
    paint.unit(c,8,px-dx*back-dy*side,py-dy*back+dx*side+(support.moving?Math.sin(t*9+n)*.3:0),19,pa+Math.PI/2,.91);
   }
   if(s.support==='ammo')prop(c,1,px-dx*6,py-dy*6,11,pa+Math.PI/2,.95);
  }
  // One scheduled strike per sector, timed to assault scatter / defender
  // ducking. A compact dirt flash becomes a long, thinning smoke tail.
  const age=mod(clock-13,34),impactX=x0+ax*53+tx*9,impactY=y0+ay*53+ty*9;
  if(age<.24)effect('dirtBurst',impactX,impactY,38+age*90,36+age*80,0,.88);
  if(age<.16)effect('fireGround',impactX,impactY,18,14,0,.42*(1-age/.16));
  if(age<1.8)effect('smokeDust',impactX+age*2,impactY-age*4,40+age*15,38+age*12,0,.58*(1-age/1.8));
  if(age>.15&&age<12)effect('smokeDust',impactX+age*2,impactY-age*3,38+age*3,42+age*4,0,.40*Math.min(1,age/.8)*(1-age/12));
  // Two authored burning positions in the six-scene master, never random.
  if(s.fire&&fires<2){
   fires++;
   const fx=x0-tx*38,fy=y0-ty*38;
   effect('fireGround',fx,fy,24+Math.sin(t*8)*2,20,0,.61);
   for(let n=0;n<(low?1:2);n++){const q=mod(t*.075+n*.5+seed*.003,1);effect('smokeDark',fx+q*17,fy-9-q*42,28+q*32,35+q*48,0,.49*Math.sin(q*Math.PI));}
  }
 }
 // Preserve the established tank crossing on its existing dry-ground route.
 const ix=Math.floor((left+width/2)/period),iy=Math.floor((top+height/2)/period),q=mod(t,34)/34,p=smooth((q-.08)/.84);
 const x=(ix+.56+.041*p)*period-left,y=(iy+.544-.002*p)*period-top;
 if(x>-40&&y>-40&&x<width+40&&y<height+40){paint.unit(c,0,x,y,40,Math.atan2(-.002,.041)+Math.PI/2,.68*Math.min(1,q/.06,(1-q)/.06));trenchFrontlineStats.vehicles=1;}
 // Crew the existing painted field gun, only on tiles where that dressing
 // selects an intact gun. Its shot precedes the west assault's shell strike.
 for(let gy=Math.floor(top/period);gy<=Math.floor((top+height)/period);gy++)for(let gx=Math.floor(left/period);gx<=Math.floor((left+width)/period);gx++){
  const seed=hash(gx,gy);if(seed&1||trenchFrontlineStats.troops+3>maxTroops)continue;
  const bx=(gx+.194)*period-left,by=(gy+.178)*period-top;
  if(bx<-35||by<-35||bx>width+35||by>height+35)continue;
  trenchFrontlineStats.troops+=3;
  for(let n=0;n<3;n++)paint.unit(c,n===2?8:9,bx+(n-1)*13,by+17+(n%2)*8,18,.32,.87);
  const shot=mod(trenchClock(t,seed,TRENCH_SECTORS[0])-11,34),mx=bx+Math.sin(.32)*18,my=by-Math.cos(.32)*18;
  if(shot<.15)effect('muzzleHeavy',mx,my,18,22,.32,.64*(1-shot/.15));
  if(shot<2.8)effect('gunSmoke',mx+shot*3,my-shot*4,22+shot*8,25+shot*10,.32,.38*(1-shot/2.8));
 }
 return trenchFrontlineStats;
}

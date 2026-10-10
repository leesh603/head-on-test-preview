import {DOVER_PART_CLIPS} from './dover-night-bosses.js?v=dover3';
import {fx} from './fx-art.js?v=gal1';
import {drawBossOrdnance} from './boss-ordnance-art.js?v=gal1';
import {drawDressingSprite} from './background-dressing.js?v=1';
import {doverPatrolChart,doverWaterInterval} from './dover-patrol-chart.js?v=dover3';
import {impactMark,aimLine,laneEdge,sectorMark,partMark,shieldMark} from './tactical-marks.js?v=gal1';

export const DOVER_ASSETS=Object.freeze({terrain:'terrain-dover-finite.webp',nighthawk:'boss-dover-nighthawk.webp',nighthawkWreck:'boss-dover-nighthawk-wreck.webp',rviii:'boss-dover-rviii.webp',rviiiWreck:'boss-dover-rviii-wreck.webp',rotor:'propeller-dover.webp'});
const images=new Map();let pending=null,generation=0;
export const isDoverBoss=kind=>kind==='supermarine-nighthawk'||kind==='siemens-schuckert-r-viii';
export function doverExtents(b){const a=b.a+Math.PI/2,s=b.geometryScale||1,w=b.layout.width*s/2,h=b.layout.height*s/2;return {halfWidth:Math.abs(Math.cos(a))*w+Math.abs(Math.sin(a))*h,halfHeight:Math.abs(Math.sin(a))*w+Math.abs(Math.cos(a))*h};}
export function prepareDoverAssets(region){
 if(region!==17){generation++;images.clear();pending=null;return Promise.resolve();}
 if(pending)return pending;const epoch=generation;
 pending=Promise.all(Object.entries(DOVER_ASSETS).map(([key,path])=>new Promise(resolve=>{
  const im=new Image();im.decoding='async';images.set(key,im);
  im.onload=()=>{(im.decode?.()||Promise.resolve()).catch(()=>{}).then(()=>resolve(epoch===generation));};
  im.onerror=()=>resolve(false);im.src='./'+path+'?v=dover3';
 })));return pending;
}
export function paintDover(c,g,cx,cy,w,h){
 const chart=doverPatrolChart(g),left=cx-w/2,top=cy-h/2,im=images.get('terrain');
 c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.fillStyle='#0d2031';c.fillRect(0,0,w,h);
 // Crop a single opaque painting. No tile wraps, separate strip edges or coast seams.
 if(im?.naturalWidth){
  const x=Math.max(left,chart.left),y=Math.max(top,chart.top),right=Math.min(left+w,chart.right),bottom=Math.min(top+h,chart.bottom);
  if(right>x&&bottom>y)c.drawImage(im,(x-chart.left)/chart.width*im.naturalWidth,(y-chart.top)/chart.height*im.naturalHeight,(right-x)/chart.width*im.naturalWidth,(bottom-y)/chart.height*im.naturalHeight,x-left,y-top,right-x,bottom-y);
 }
 // Small, fixed cliff batteries belong to the coast, never to scrolling tile rows.
 for(const [v,side] of [[.16,-1],[.37,-1],[.61,-1],[.28,1],[.53,1],[.77,1]]){
  const gy=chart.top+chart.height*v,shore=doverWaterInterval(g,gy),gx=(side<0?shore.left-150:shore.right+150);
  const x=gx-left,y=gy-top;if(x< -160||x>w+160||y< -160||y>h+160)continue;
  drawDressingSprite(c,'coastalGun',x,y,56,side<0?0:Math.PI,.7);
  const a=side<0?.12+Math.sin((g?.t||0)*.18+v*8)*.35:Math.PI-.12-Math.sin((g?.t||0)*.18+v*8)*.35;
  fx(c,'searchlight',x+Math.cos(a)*90,y+Math.sin(a)*90,190,32,a,.12);
 }
 c.restore();
}
export const DOVER_PROPELLERS=Object.freeze({
 nighthawk:Object.freeze([{part:'engine-left',x:-175,y:-55,size:150},{part:'engine-right',x:175,y:-55,size:150}]),
 rviii:Object.freeze([{part:'drive-outer-left',x:-318,y:-57,size:150},{part:'drive-inner-left',x:-125,y:-180,size:140},{part:'drive-inner-right',x:125,y:-180,size:140},{part:'drive-outer-right',x:318,y:-57,size:150}])
});
function drawPropellers(c,b,key){
 const im=images.get('rotor');if(!im?.naturalWidth)return;
 for(const [i,m] of DOVER_PROPELLERS[key].entries()){
  const part=b.parts.get(m.part);if(!part||part.destroyed||b.dead)continue;
  const phase=(b.motionTime||0)*48+i*1.7;
  // A propeller disk is perpendicular to the fuselage shaft, foreshortened
  // in top-down view. Motion echoes avoid visibly strobing wooden blades.
  c.save();c.translate(m.x,m.y);c.scale(1,.18);
  for(const [lag,alpha] of [[-.40,.14],[-.20,.23],[0,.88]]){
   c.save();c.globalAlpha*=alpha;c.rotate(phase+lag);c.drawImage(im,-m.size/2,-m.size/2,m.size,m.size);c.restore();
  }c.restore();
 }
}
export function drawDoverBoss(c,b,destruction){
 const key=b.kind==='supermarine-nighthawk'?'nighthawk':'rviii',normal=images.get(key),wreck=images.get(key+'Wreck');if(!normal?.naturalWidth)return;
 const clips=DOVER_PART_CLIPS[key],layout=b.layout,s=b.geometryScale||1,dying=b.dead,age=destruction?.age||0,q=dying?Math.min(1,age/(destruction?.duration||2.65)):0;
 c.save();c.translate(b.x,b.y);c.rotate(b.a+Math.PI/2);
 if(dying){c.translate(0,q*115);c.rotate(q*.14);c.scale(1-q*.3,1-q*.3);c.globalAlpha*=1-q;}
 c.scale(s,s);c.imageSmoothingEnabled=true;
 c.scale(1-Math.abs(b.bank||0)*.025,1);
 const whole=im=>c.drawImage(im,-layout.width/2,-layout.height/2,layout.width,layout.height);
 c.save();c.beginPath();c.rect(-layout.width/2,-layout.height/2,layout.width,layout.height);for(const rect of Object.values(clips))c.rect(...rect);c.clip('evenodd');whole(normal);c.restore();
 for(const p of b.parts.values()){
  const rect=clips[p.id];if(!rect)continue;const broken=p.destroyed||dying;
  c.save();c.beginPath();c.rect(...rect);c.clip();whole(broken&&wreck?.naturalWidth?wreck:normal);c.restore();
  if(broken){const x=p.localX/s,y=p.localY/s,t=(((b.motionTime||0)*.3+x*.003)%1+1)%1;
   if(p.kind==='engine'||p.kind==='drive')fx(c,'fireEngine',x,y,25,42,0,.7);
   fx(c,'smokeDark',x+12*t,y-t*45,26+t*40,28+t*46,.15,(1-t)*.5);
  }
 }
 drawPropellers(c,b,key);
 if(!dying){const core=layout.core;if(b.coreVulnerable)partMark(c,core.x,core.y,core.radius*1.2);else shieldMark(c,core.x,core.y,core.radius*1.2,{alpha:.5});}
 c.restore();
}
export function drawDoverHazard(c,h,z=1){
 if(!['davis-cannon','rviii-bomb','nighthawk-light-bomb','dover-searchlight'].includes(h.visual))return false;
 const warning=h.phase==='warning',p=Math.max(0,Math.min(1,(h.age-h.delay)/Math.max(.01,h.warning)));c.save();
 if(h.visual==='davis-cannon'){
  if(warning)aimLine(c,h.x,h.y,h.x+Math.cos(h.angle)*h.length,h.y+Math.sin(h.angle)*h.length,{p,alpha:.85,dash:[9,9],chevron:false});
  else drawBossOrdnance(c,'he-big',h.x,h.y,40/Math.max(.7,z),Math.atan2(h.vy,h.vx));
 }else if(h.visual==='rviii-bomb'||h.visual==='nighthawk-light-bomb'){
  if(warning){impactMark(c,h.x,h.y,h.radius,p);if(h.sourceX!=null){const x=h.sourceX+(h.x-h.sourceX)*p,y=h.sourceY+(h.y-h.sourceY)*p-Math.sin(p*Math.PI)*28;drawBossOrdnance(c,'iron-bomb',x,y,h.visual==='rviii-bomb'?28:22,h.angle??.5*Math.PI);}}
  else{const q=Math.max(0,Math.min(1,(h.age-h.delay-h.warning)/h.duration));fx(c,'foamRing',h.x,h.y,h.radius*(1.3+q*1.8),h.radius*(1.3+q*1.8),0,(1-q)*.75);fx(c,'waterColumn',h.x,h.y-20,h.radius*.9,h.radius*1.8,0,(1-q)*.8);}
 }else{
  if(warning)sectorMark(c,h.x,h.y,h.radius,h.angle-h.halfAngle,h.angle+h.halfAngle,p);
  else fx(c,'searchlight',h.x+Math.cos(h.angle)*h.radius*.5,h.y+Math.sin(h.angle)*h.radius*.5,h.radius,h.radius*h.halfAngle*2,h.angle,.75);
 }
 c.restore();return true;
}

// Telegraph one committed bombing corridor with an honest clear centre lane.
export function drawDoverCue(c,cue){
 if(cue.type!=='dover-bomb-warning')return false;
 const dx=Math.cos(cue.angle),dy=Math.sin(cue.angle),nx=-dy,ny=dx,len=cue.length/2;
 const p=Math.max(0,Math.min(1,1-cue.life/cue.seconds));
 for(const side of [-1,1]){
  const x=cue.x+nx*side*76,y=cue.y+ny*side*76;
  aimLine(c,x-dx*len,y-dy*len,x+dx*len,y+dy*len,{p,heavy:true,alpha:.7,chevron:false});
  const sx=cue.x+nx*side*cue.safeGap/2,sy=cue.y+ny*side*cue.safeGap/2;
  laneEdge(c,sx-dx*len,sy-dy*len,sx+dx*len,sy+dy*len,{alpha:.55});
 }
 const ex=cue.x+dx*len,ey=cue.y+dy*len;
 if(Number.isFinite(cue.exitAngle))aimLine(c,ex,ey,ex+Math.cos(cue.exitAngle)*65,ey+Math.sin(cue.exitAngle)*65,{tone:'safe',alpha:.65});
 return true;
}

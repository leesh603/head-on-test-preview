// Authored RGBA hull states and mechanical hardware. Positions below come from
// live BossPart objects: they have already been scaled by PatternBoss.
export const SKY_AIRSHIP_SOURCES=Object.freeze({
 l70:'./boss-sky-l70-states-20261020.webp?v=headon-result339-20261028',
 hma23:'./boss-sky-hma23-states-20261020.webp?v=headon-result339-20261028',
 hardware:'./boss-sky-hardware-20261020.webp?v=headon-result339-20261028',
 mechanics:'./boss-sky-mechanics-20261022.webp'
});
// The authored sheet is not a uniform grid vertically. Keep neighbouring
// sprites out of each crop and put the visible hardware/hub on its collider.
export const SKY_HARDWARE_RECTS=Object.freeze([
 [0,62,256,182,128,150],[256,62,256,182,384,150],[512,62,256,182,640,150],
 [0,276,256,190,128,371],[256,276,256,190,384,371],[512,276,256,190,640,371],
 [0,503,256,205,128,606],[256,503,256,205,384,606],[512,503,256,205,640,606],
 [0,752,256,207,128,858],[268,710,232,281,384,847],[512,731,256,241,640,847]
].map(Object.freeze));
let images={},pending=null;
export function prepareSkyAirshipArt(){
 if(pending)return pending;
 pending=Promise.all(Object.entries(SKY_AIRSHIP_SOURCES).map(([key,url])=>new Promise(resolve=>{
  const im=new Image();im.decoding='async';images[key]=im;
  const done=()=>Promise.resolve(im.decode?.()).catch(()=>{}).then(()=>resolve(im));
  im.addEventListener('load',done,{once:true});im.addEventListener('error',()=>resolve(im),{once:true});im.src=url;
 })));return pending;
}
export function releaseSkyAirshipArt(){images={};pending=null;}
export function skyAirshipReady(kind){return !!(images[kind==='hma23'?'hma23':'l70']?.naturalWidth&&images.hardware?.naturalWidth);}
export function skyHullState(b){
 if(b.destroying)return 2;
 const hardware=(b.parts||[]).filter(p=>p.id!=='capsule'),lost=hardware.filter(p=>p.destroyed).length;
 const ratio=b.hp/Math.max(1,b.maxHp);
 return ratio<=.24||(hardware.length>0&&lost===hardware.length)?2:ratio<=.65||lost>=2?1:0;
}
export function skyHardwareCell(p,time){
 if(p.id==='capsule')return 3+(p.destroyed?2:p.hp<=p.maxHp*.5?1:0);
 if(p.id.startsWith('port-'))return p.destroyed?9:Number.isFinite(p.lastLaunchAt)&&time-p.lastLaunchAt>=0&&time-p.lastLaunchAt<1.25?7:p.hp<=p.maxHp*.5?8:6;
 return p.destroyed?2:p.hp<=p.maxHp*.5?1:0;
}
function hardware(c,index,x,y,size){
 const [sx,sy,w,h,px,py]=SKY_HARDWARE_RECTS[index],u=size/256;
 c.drawImage(images.hardware,sx,sy,w,h,x+(sx-px)*u,y+(sy-py)*u,w*u,h*u);
}
const ease=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
export function skyPortOpen(b,p){
 if(p.destroyed||b.destroying)return 0;
 const age=(b.motionTime||0)-p.lastLaunchAt;
 let open=age>=0&&age<1.03?1:age>=1.03&&age<1.25?ease((1.25-age)/.22):0;
 if(b.phase==='launching'&&Number.isFinite(b.skyLaunchIn)&&b.skyLaunchIn>=0&&b.skyLaunchIn<.35){
  const ports=(b.parts||[]).filter(q=>q.id.startsWith('port-')&&!q.destroyed),count=Math.min(ports.length,ports.length>=3?3:2);
  for(let i=0;i<count;i++)if(ports[((b.skyLaunchSide||0)+i)%ports.length]?.id===p.id)open=Math.max(open,ease(1-b.skyLaunchIn/.35));
 }
 return open;
}
function launchPort(c,b,p,size){
 const closed=p.hp<=p.maxHp*.5?8:6,open=skyPortOpen(b,p),u=size/256;
 hardware(c,closed,p.x,p.y,size);
 if(!open)return;
 // Reuse the actual metal shutters. Slide each half under the fixed rim;
 // the inset is painted depth, not an alpha crossfade between closed doors.
 const x=p.x-68*u,y=p.y-56*u,w=154*u,h=115*u,sx=(closed%3)*256+60;
 c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
 c.drawImage(images.mechanics,closed===8?256:0,0,256,256,x,y,w,h);
 const travel=w*.5*open;
 c.drawImage(images.hardware,sx,550,77,115,x-travel,y,w/2,h);
 c.drawImage(images.hardware,sx+77,550,77,115,x+w/2+travel,y,w/2,h);
 c.restore();
}
export function drawSkyAirship(c,b,{cloud=()=>{},effect=()=>{},mark=()=>{}}={}){
 if(!skyAirshipReady(b.assetKey))return false;
 const carrier=b.assetKey==='hma23',im=images[carrier?'hma23':'l70'],time=b.motionTime||0,parts=b.parts||[];
 const scale=b.geometryScale||2.025,width=390*scale,height=width/4,state=skyHullState(b);
 const defeat=b.destroying?Math.min(1,b.destructionAge/Math.max(.1,b.destructionDuration)):0;
 c.save();c.translate(b.x,b.y+defeat*35);c.imageSmoothingEnabled=true;
 c.globalAlpha*=1-defeat*.8;
 // A glass observation capsule is suspended independently of the ship. Its
 // cable follows the moving gameplay weak point instead of a painted mount.
 const capsule=parts.find(p=>p.id==='capsule');
 if(capsule&&(!capsule.destroyed||time-(capsule.destroyedAt??0)<2.6)){
  const cut=capsule.destroyed,age=Math.max(0,time-(capsule.destroyedAt??time)),endY=cut?(48+Math.min(age,1)*9)*scale:capsule.y;
  c.save();c.strokeStyle='#17201ce0';c.lineWidth=2*scale;c.beginPath();
  c.moveTo(-12*scale,32*scale);c.lineTo(cut?-15*scale:capsule.x-6*scale,endY);c.moveTo(12*scale,32*scale);c.lineTo(cut?16*scale:capsule.x+6*scale,endY);c.stroke();
  c.strokeStyle='#b7ac8490';c.lineWidth=.6*scale;c.stroke();c.restore();
 }
 c.save();if(!carrier&&b.phase==='cloud')c.globalAlpha*=.35;else if(!carrier&&b.phase==='reveal')c.globalAlpha*=.7;
 c.drawImage(im,0,state*im.naturalHeight/3,im.naturalWidth,im.naturalHeight/3,-width/2,-height/2,width,height);c.restore();
 // Authored hardware replaces the equipment on the old flattened picture.
 // No per-frame filters, generated canvases, or persistent particle lists.
 // Spend the existing two-plume budget on the most recent losses.
 let newest=null,previous=null;
 for(const part of parts){
  const p=part;if(!p.destroyed&&!(p.id==='capsule'&&time-(p.destroyedAt??0)>2.6))continue;
  if(!newest||(p.destroyedAt??0)>(newest.destroyedAt??0)){previous=newest;newest=p;}
  else if(!previous||(p.destroyedAt??0)>(previous.destroyedAt??0))previous=p;
 }
 let plumeCount=0;
 for(const p of parts){
  if(p.id==='capsule'&&p.destroyed&&time-(p.destroyedAt??0)>2.6)continue;
  const r=p.radius||19*scale,size=r*(p.id==='capsule'?2.7:p.id.startsWith('port-')?2.3:2.1),cell=b.destroying?(p.id==='capsule'?5:p.id.startsWith('port-')?9:2):skyHardwareCell(p,time);
  const falling=p.id==='capsule'&&p.destroyed,age=Math.max(0,time-(p.destroyedAt??time)),drop=falling?Math.min(90,age*age*24)*scale:0;
  if(falling){c.save();c.translate(p.x,p.y+drop);c.rotate(age*.26);c.globalAlpha*=Math.max(0,1-age/2.6);hardware(c,cell,0,0,size);c.restore();}
  else if(p.id.startsWith('port-')&&!p.destroyed&&!b.destroying&&images.mechanics?.naturalWidth)launchPort(c,b,p,size);
  else hardware(c,cell,p.x,p.y,size);
  if(cell===7&&!images.mechanics?.naturalWidth){const age=time-p.lastLaunchAt,closed=p.hp<=p.maxHp*.5?8:6,alpha=age<.18?1-age/.18:age>1.03?(age-1.03)/.22:0;
   if(alpha>0){c.save();c.globalAlpha*=Math.min(1,alpha);hardware(c,closed,p.x,p.y,size);c.restore();}
  }
  if(p.id.startsWith('engine-')){
   c.save();c.translate(p.x-r*.98,p.y);
   if(p.destroyed||b.destroying){
    c.rotate((Number(p.id.slice(7))%2?1:-1)*.22);
    if(images.mechanics?.naturalWidth)c.drawImage(images.mechanics,512,0,256,256,-r*1.125,-r*1.125,r*2.25,r*2.25);
    else hardware(c,10,0,0,r*2.25);
   }else{c.scale(.24+Math.abs(Math.cos(time*38+Number(p.id.slice(7))*1.7))*.76,1);hardware(c,10,0,0,r*2.25);}
   c.restore();
  }
  if(p.destroyed&&(p===newest||p===previous)){
   const age=Math.max(0,time-(p.destroyedAt??time));plumeCount++;
   if(age<5.5)effect('fireEngine',p.x,p.y+drop,r*1.7,r*1.7,0,.8*(1-age/5.5));
   const drift=(time*.16+plumeCount*.37)%1;
   effect('smokeDark',p.x+drift*r*.5,p.y+drop-r*(.6+drift*1.6),r*(1.5+drift),r*(1.5+drift),0,.34*(1-drift));
  }
  if(!b.destroying&&p.hittable&&!p.destroyed)mark(p.x,p.y,r,r,{hp:p.hp/Math.max(1,p.maxHp)});
 }
 if(!carrier&&(b.phase==='cloud'||b.phase==='reveal')){
  const alpha=b.phase==='cloud'?.58:.25;
  for(let i=0;i<6;i++)cloud((-155+i*61)*scale,(-12+(i%2)*20)*scale,105*scale,65*scale,0,alpha);
 }
 c.restore();return true;
}

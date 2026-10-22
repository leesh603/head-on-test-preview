// Authored RGBA hull states and mechanical hardware. Positions below come from
// live BossPart objects: they have already been scaled by PatternBoss.
export const SKY_AIRSHIP_SOURCES=Object.freeze({
 l70:'./boss-sky-l70-states-20261020.webp?v=muted1',
 hma23:'./boss-sky-hma23-states-20261020.webp?v=muted1',
 hardware:'./boss-sky-hardware-20261020.webp?v=muted1'
});
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
 const im=images.hardware,cell=im.naturalWidth/3;
 c.drawImage(im,(index%3)*cell,Math.floor(index/3)*cell,cell,cell,x-size/2,y-size/2,size,size);
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
 if(capsule&&!capsule.destroyed){
  c.save();c.strokeStyle='#17201ce0';c.lineWidth=2*scale;c.beginPath();
  c.moveTo(-12*scale,32*scale);c.lineTo(capsule.x-6*scale,capsule.y);c.moveTo(12*scale,32*scale);c.lineTo(capsule.x+6*scale,capsule.y);c.stroke();
  c.strokeStyle='#b7ac8490';c.lineWidth=.6*scale;c.stroke();c.restore();
 }
 c.save();if(!carrier&&b.phase==='cloud')c.globalAlpha*=.35;else if(!carrier&&b.phase==='reveal')c.globalAlpha*=.7;
 c.drawImage(im,0,state*im.naturalHeight/3,im.naturalWidth,im.naturalHeight/3,-width/2,-height/2,width,height);c.restore();
 // Authored hardware replaces the equipment on the old flattened picture.
 // No per-frame filters, generated canvases, or persistent particle lists.
 let plumeCount=0;
 for(const p of parts){
  if(p.id==='capsule'&&p.destroyed&&time-(p.destroyedAt??0)>2.6)continue;
  const r=p.radius||19*scale,size=r*(p.id==='capsule'?2.7:p.id.startsWith('port-')?2.3:2.1),cell=b.destroying?(p.id==='capsule'?5:p.id.startsWith('port-')?9:2):skyHardwareCell(p,time);
  hardware(c,cell,p.x,p.y,size);
  if(cell===7){const age=time-p.lastLaunchAt,closed=p.hp<=p.maxHp*.5?8:6,alpha=age<.18?1-age/.18:age>1.03?(age-1.03)/.22:0;
   if(alpha>0){c.save();c.globalAlpha*=Math.min(1,alpha);hardware(c,closed,p.x,p.y,size);c.restore();}
  }
  if(p.id.startsWith('engine-')&&!p.destroyed&&!b.destroying){
   c.save();c.translate(p.x-r*.98,p.y);c.scale(.24+Math.abs(Math.cos(time*38+Number(p.id.slice(7))*1.7))*.76,1);
   hardware(c,10,0,0,r*2.25);c.restore();
  }
  if(p.destroyed&&plumeCount<2){
   const age=Math.max(0,time-(p.destroyedAt??time));plumeCount++;
   if(age<5.5)effect('fireEngine',p.x,p.y,r*1.7,r*1.7,0,.8*(1-age/5.5));
   const drift=(time*.16+plumeCount*.37)%1;
   effect('smokeDark',p.x+drift*r*.5,p.y-r*(.6+drift*1.6),r*(1.5+drift),r*(1.5+drift),0,.34*(1-drift));
  }
  if(!b.destroying&&p.hittable&&!p.destroyed)mark(p.x,p.y,r,r,{hp:p.hp/Math.max(1,p.maxHp)});
 }
 if(!carrier&&(b.phase==='cloud'||b.phase==='reveal')){
  const alpha=b.phase==='cloud'?.58:.25;
  for(let i=0;i<6;i++)cloud((-155+i*61)*scale,(-12+(i%2)*20)*scale,105*scale,65*scale,0,alpha);
 }
 c.restore();return true;
}

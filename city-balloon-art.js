import {fx} from './fx-art.js?v=tame3';
import {SOMME_FRAMES} from './somme-boss-atlas.js?v=tame3';
const SOURCES={hulls:'./boss-city-balloon-hulls-20261022.webp',center:'./boss-city-drachen-center-20261021.webp',machinery:'./boss-city-balloon-machinery-20261021.webp',guns:'./boss-mark1-guns-r3.webp',apronGondola:'./boss-london-apron-gondola.webp'};
const APRON_GONDOLA_WIDTH=47;
const APRON_GONDOLA_TOP=4;
// The 448-pixel sprite is centered under the muzzle. Use the painted eye
// centers and lower rim so the suspension, carrier and panel share the fittings.
const apronGondolaPin=(x,y)=>({x:(x-224)*APRON_GONDOLA_WIDTH/448,y:APRON_GONDOLA_TOP+y*APRON_GONDOLA_WIDTH/448});
export const APRON_GONDOLA_STAYS={carrier:apronGondolaPin(403,19),inner:apronGondolaPin(373,18),panel:apronGondolaPin(348,123)};
// Cell-local pixels on the London hull sheet, in left, center, right order.
// The damaged skin shifts the eye positions and the wreck retains one eye.
const APRON_HULL_STAYS=[[[78,223],[161,234],[242,228]],[[72,222],[155,234],[236,226]],[null,[158,236],null]];
const FRAMES={left:{sheet:'hulls',row:0,cell:[362,362],box:[12,175,362,362]},right:{sheet:'hulls',row:1,cell:[362,362],box:[10,88,360,306]},london:{sheet:'hulls',row:2,cell:[362,362],box:[17,134,358,239]},center:{sheet:'center',row:0,cell:[724,724],box:[13,259,724,438]},pod:{sheet:'machinery',row:0,cell:[512,512],box:[43,2,500,512]},winch:{sheet:'machinery',row:1,cell:[512,512],box:[63,0,427,464]}};
let images={},pending;
export function cityBalloonArtReady(){return ['hulls','center','machinery','guns'].every(k=>images[k]?.naturalWidth>0);}
export function prepareCityBalloonArt(){if(pending)return pending;pending=Promise.all(Object.entries(SOURCES).map(([key,url])=>new Promise(resolve=>{const im=new Image();images[key]=im;im.decoding='async';im.onload=()=>Promise.resolve(im.decode?.()).catch(()=>{}).then(()=>resolve(im));im.onerror=()=>resolve(im);im.src=url;})));return pending;}
export function releaseCityBalloonArt(){images={};pending=null;}
export const cityPartState=(p,dead=false)=>dead||p?.destroyed?2:p?.hp<p?.maxHp*.55?1:0;
// The source's normal-state envelope fixes one pivot/scale for all three states.
// Wreck cloth collapses inside that space; it is never stretched back to full size.
function cell(c,key,state,x,y,width){
 const f=FRAMES[key],im=images[f.sheet];if(!im?.naturalWidth)return false;
 const [cw,ch]=f.cell,[l,t,r,b]=f.box,k=width/(r-l);
 c.drawImage(im,state*cw,f.row*ch,cw,ch,x-(l+r)/2*k,y-(t+b)/2*k,cw*k,ch*k);return true;
}
export function drawCityBalloonHull(c,key,state,x,y,width){return cell(c,key,state,x,y,width);}
export function drawApronEnvelope(c,state,x,y,width){
 if(!cell(c,'london',state,x,y,width))return null;
 const [l,t,r,b]=FRAMES.london.box,k=width/(r-l);
 const left=x-(l+r)/2*k,top=y-(t+b)/2*k;
 return APRON_HULL_STAYS[state].map(pin=>pin&&[left+pin[0]*k,top+pin[1]*k]);
}
function rope(c,x,y,u,v,slack=10,width=2.3){c.beginPath();c.moveTo(x,y);c.quadraticCurveTo((x+u)/2,(y+v)/2+slack,u,v);c.strokeStyle='#26231bcc';c.lineWidth=width;c.stroke();c.strokeStyle='#9b8b63a8';c.lineWidth=width*.8/2.3;c.stroke();}
function drawCityMountGun(c,p,state,x,y,reach){
 const f=SOMME_FRAMES['mark1-gun-mg-'+['normal','damaged','wreck'][state]],k=reach/f.reach;
 c.drawImage(images.guns,...f.rect,x-f.tip[0]*k,y-f.tip[1]*k+(state===2?0:(p?.recoil||0)*reach/8),f.rect[2]*k,f.rect[3]*k);
}
export function drawApronCableMount(c,p,state,x,y,hullStays){
 c.save();
 const {carrier,inner}=APRON_GONDOLA_STAYS;
 if(hullStays){
  const [left,center,right]=hullStays;
  for(const [side,outer] of [[-1,left],[1,right]]){
   if(outer)rope(c,...outer,x+side*carrier.x,y+carrier.y,2.5,1.55);
   if(center)rope(c,...center,x+side*inner.x,y+inner.y,1.4,1.35);
  }
 }
 const cabin=images.apronGondola;
 if(cabin?.naturalWidth){
  c.save();
  if(state===2)c.globalAlpha*=.68;
  const height=APRON_GONDOLA_WIDTH*cabin.naturalHeight/cabin.naturalWidth;
  c.drawImage(cabin,x-APRON_GONDOLA_WIDTH/2,y+APRON_GONDOLA_TOP,APRON_GONDOLA_WIDTH,height);
  c.restore();
 }
 if(images.guns?.naturalWidth){
  drawCityMountGun(c,p,state,x,y,9);
  if(p?.gunFlash>0)fx(c,'fireFlash',x,y-1,7,10,0,Math.min(.7,p.gunFlash/.15));
 }
 c.restore();
}
export function drawCitySuspension(c,p,state,x,y,width,{hullX=x,hullY=y-65,net=false,flash=0}={}){
 if(!cityBalloonArtReady())return false;c.save();
 for(const side of [-1,1])rope(c,hullX+side*width*.65,hullY,x+side*width*.3,y-width*.22,net?4:11);
 cell(c,'pod',state,x,y+width*.08,width);cell(c,'winch',state,x,y+width*.6,width*.42);
 // Fixed upward AA barrel: the authored tip remains on the existing source
 // point. Its two-pixel recoil recovers after the actual muzzle command.
 drawCityMountGun(c,p,state,x,y,16);
 if(flash>0)fx(c,'fireFlash',x,y-3,18,23,0,Math.min(1,flash/.15));
 c.restore();return true;
}
export function drawDetailedDrachen(c,b,drawMine){
 if(!cityBalloonArtReady())return false;const scale=b.cityArtScale||1,parts=b.parts||[],hulls=[[145,211,236,'left'],[454,159,520,'center'],[641,325,206,'right']],guns=[[154,295,52],[441,292,80],[641,432,49]],mines=[[[116,425],[189,425]],[[316,397],[443,456],[590,397]],[[607,509],[678,509]]];
 c.save();c.translate(b.x,b.y);c.scale(scale,scale);c.translate(-384,-288);
 for(const [a,z]of [[0,1],[1,2]]){if(parts.find(p=>p.id==='airship-'+a)?.destroyed||parts.find(p=>p.id==='airship-'+z)?.destroyed)continue;const A=b.cityRigOffsets?.[a]||[0,0],Z=b.cityRigOffsets?.[z]||[0,0];rope(c,guns[a][0]+A[0],guns[a][1]+A[1],guns[z][0]+Z[0],guns[z][1]+Z[1],55);}
 for(const i of [1,0,2]){
  const p=parts.find(p=>p.id==='airship-'+i),dead=p?.destroyed||b.destroying,state=cityPartState(p,dead),age=dead?Math.max(0,(b.motionTime||0)-(p?.destroyedAt||0)+(b.destroying?b.destructionAge:0)):0;if(dead&&age>=1.8)continue;
  const off=b.cityRigOffsets?.[i]||[0,0],[x,y,w,key]=hulls[i],[gx,gy,gw]=guns[i];c.save();c.translate(...off);
  if(dead){c.globalAlpha*=Math.max(0,1-age/1.8);c.translate(x,y+170*age*age);c.rotate((i===0?-1:1)*age*.19);c.scale(1-age*.12,1-age*.12);c.translate(-x,-y);}
  cell(c,key,state,x,y,w);drawCitySuspension(c,p,state,gx,gy,gw,{hullX:x,hullY:y+35,flash:p?.gunFlash||0});
  for(const [mx,my]of mines[i]){rope(c,gx,gy+gw*.7,mx,my-18,5);drawMine(c,mx,my,42,42);}
  c.restore();
 }
 c.restore();return true;
}

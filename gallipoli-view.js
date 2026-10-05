import {fx} from './fx-art.js?v=479';
import {GALLIPOLI_PARTS,GALLIPOLI_SECTORS,gallipoliObjective} from './gallipoli-boss.js?v=479';
import {GALLIPOLI_ROUTE} from './gallipoli-route.js?v=479';
import {periodicSandPixels,maanGroundTiles} from './maan-ground.js?v=479';
export const GALLIPOLI_ASSETS=Object.freeze({guns:'gallipoli-siege-guns.webp',facilities:'gallipoli-siege-facilities.webp',base:'gallipoli-siege-bases.webp',star:'gallipoli-siege-star.webp',wing:'gallipoli-siege-wing.webp',ground:'gallipoli-siege-ground.webp',coast:'asset-bank/terrain/gallipoli_coast.webp',sea:'terrain-sea359r2.webp',central:'gallipoli-overlay-central.webp',entente:'gallipoli-overlay-entente.webp'});
const images=new Map(),tiles=new Map(),pending=new Map();
function load(k){if(!GALLIPOLI_ASSETS[k])return null;if(images.has(k))return images.get(k);const im=new Image();images.set(k,im);im.decoding='async';im.crossOrigin='anonymous';pending.set(k,new Promise((resolve,reject)=>{im.onload=()=>im.naturalWidth?resolve(im):reject(new Error('Gallipoli empty asset '+k));im.onerror=()=>reject(new Error('Gallipoli asset '+k));}));im.src='./'+GALLIPOLI_ASSETS[k]+'?v=479';return im;}
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function bake(im,key,sy=0,sh=im.naturalHeight){if(tiles.has(key))return tiles.get(key);const c=canvas(im.naturalWidth,sh),ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,sy,im.naturalWidth,sh,0,0,c.width,sh);const p=periodicSandPixels(ctx.getImageData(0,0,c.width,sh).data,c.width,sh),t=canvas(p.width,p.height),tc=t.getContext('2d'),data=tc.createImageData(p.width,p.height);data.data.set(p.data);tc.putImageData(data,0,0);tiles.set(key,t);return t;}
export function prepareGallipoliAssets(region){if(region!==14){images.clear();pending.clear();tiles.clear();return Promise.resolve();}const sea=load('sea'),coast=load('coast');for(const k of Object.keys(GALLIPOLI_ASSETS))load(k);return Promise.all([...pending.values()]).then(()=>{if(images.get('coast')!==coast)return;bake(sea,'sea');bake(images.get('ground'),'land');bakeCoast(coast);});}
function tile(c,im,x,y,w,h){for(const q of maanGroundTiles(x+w/2,y+h/2,w,h,im.width,im.height))c.drawImage(im,q.x+x,q.y+y,q.width,q.height);}
export function paintGallipoli(c,g,cx,cy,w,h){const r=g?.gallipoliRoute;if(!r)return;c.save();c.translate(w/2-cx,h/2-cy);c.translate(r.x,r.y);c.rotate(r.a+Math.PI/2);const dx=cx-r.x,dy=cy-r.y,n=-Math.sin(r.a)*dx+Math.cos(r.a)*dy,s=Math.cos(r.a)*dx+Math.sin(r.a)*dy,span=Math.hypot(w,h)/2+160,left=n-span,top=-s-span,width=span*2,height=span*2;const sea=tiles.get('sea'),land=tiles.get('land');if(sea&&(!land||top+height>-GALLIPOLI_ROUTE.shore))tile(c,sea,left,top,width,height);if(land){c.save();c.beginPath();c.rect(left,top,width,Math.max(0,-GALLIPOLI_ROUTE.shore-top));c.clip();tile(c,land,left,top,width,height);c.restore();}
 // A continuous horizontal strip with normalized edge samples and soft end masks.
 const coast=tiles.get('coast');if(coast){const pw=coast.width,ph=coast.height,shoreY=-GALLIPOLI_ROUTE.shore;for(let ix=Math.floor(left/pw);ix<Math.ceil((left+width)/pw);ix++)c.drawImage(coast,ix*pw,shoreY-1000,pw,ph);}
 // Sparse authored trench/camp rows, varied by fixed world position rather than scrolling randomness.
 for(const forward of [7900,9300,10600])for(let lateral=-3000;lateral<=3000;lateral+=750){const yy=-forward,variant=(Math.abs(lateral/750)+forward/100)%3;if(lateral+430<left||lateral-430>left+width||yy+360<top||yy-360>top+height)continue;sprite(c,'base',2,0,lateral,yy,530,variant===0?.15:-.12);if(variant!==0)sprite(c,'facilities',variant===1?1:2,0,lateral+180,yy-120,150);}
 c.restore();
 if(!g.stageBoss?.stages.encounter&&s>GALLIPOLI_ROUTE.fort-span-300){const body={x:r.x+Math.cos(r.a)*GALLIPOLI_ROUTE.fort,y:r.y+Math.sin(r.a)*GALLIPOLI_ROUTE.fort,captured:new Set(),phase:'coastal-defense',coreAngle:Math.PI/2,hp:1,maxHp:1,faction:g.stageBoss?.stages.teamFaction==='central'?'entente':'central',parts:new Map(GALLIPOLI_PARTS.map(p=>[p.id,{...p,hp:1,maxHp:1,angle:Math.PI/2}]))};c.save();c.translate(w/2-cx,h/2-cy);drawGallipoliBoss(c,body);c.restore();}
}
// Authored atlas rectangles and measured pivots; the full barrels remain visible.
const gunRows=[[0,444,.69],[444,424,.70],[868,412,.63]];
const artRows={twin:0,howitzer:1,aa:2,command:0,ammo:1,signal:2};
function sprite(c,key,row,state,x,y,w,angle=0){const im=load(key);if(!im?.naturalWidth)return;const single=key==='star'||key==='wing',cw=im.naturalWidth/(single?1:3);let sy,sh,pivot;
 if(single){sy=0;sh=im.naturalHeight;pivot=key==='wing'?.48:.5;state=0;}else if(key==='guns'){[sy,sh,pivot]=gunRows[row];sy*=im.naturalHeight/1280;sh*=im.naturalHeight/1280;}else if(key==='base'){[sy,sh]=[[0,470],[470,365],[835,445]][row];sy*=im.naturalHeight/1280;sh*=im.naturalHeight/1280;pivot=.5;}else{sy=row*im.naturalHeight/3;sh=im.naturalHeight/3;pivot=.5;}
 c.save();c.translate(x,y);c.rotate(angle);c.imageSmoothingEnabled=true;const h=w*sh/cw;c.drawImage(im,state*cw,sy,cw,sh,-w*(single?.5:.53),-h*pivot,w,h);c.restore();}
function road(c,x1,y1,x2,y2){c.lineCap='round';c.strokeStyle='#272823';c.lineWidth=62;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.strokeStyle='#666353';c.lineWidth=45;c.stroke();c.strokeStyle='#373b32';c.lineWidth=3;c.setLineDash([16,22]);c.stroke();c.setLineDash([]);}
export function drawGallipoliBoss(c,b){const state=p=>b.dead||p?.destroyed?2:p&&p.hp<p.maxHp*.55?1:0;c.save();
 for(const s of GALLIPOLI_SECTORS){road(c,b.x,b.y,b.x+s.x,b.y+s.y);sprite(c,s.id==='citadel'?'star':'wing',0,0,b.x+s.x,b.y+s.y,1180);}
 road(c,b.x,b.y,b.x,b.y+680);sprite(c,'star',0,0,b.x,b.y,970);sprite(c,'base',2,b.dead?2:0,b.x,b.y+650,720);
 for(const p of b.parts.values()){const gun=p.kind==='gun'||p.kind==='aa';const recoil=(p.recoil||0)*25,x=b.x+p.x-Math.cos(p.angle)*recoil,y=b.y+p.y-Math.sin(p.angle)*recoil;sprite(c,gun?'guns':'facilities',artRows[p.art],state(p),x,y,p.size,gun?p.angle+Math.PI/2:0);
 if(p.destroyed){fx(c,'smokeDark',b.x+p.x,b.y+p.y,50,70,0,.23);continue;}
 // Small persistent HP strips distinguish targetable installations from scenery.
 c.fillStyle='#181d19';c.fillRect(b.x+p.x-35,b.y+p.y+75,70,5);c.fillStyle=p.kind==='supply'?'#ccb079':'#bf7d62';c.fillRect(b.x+p.x-35,b.y+p.y+75,70*p.hp/p.maxHp,5);}
 sprite(c,'facilities',0,b.dead?2:b.coreVulnerable?1:0,b.x,b.y,510);
 sprite(c,'guns',0,b.dead?2:b.hp<b.maxHp*.25?1:0,b.x,b.y,480,b.coreAngle+Math.PI/2);
 for(const s of GALLIPOLI_SECTORS){const captured=b.captured?.has(s.id),im=load(captured?(b.faction==='central'?'entente':'central'):b.faction);if(im?.naturalWidth&&!b.dead)c.drawImage(im,b.x+s.x-28,b.y+s.y-75,56,58);
 c.fillStyle=captured?'#9dcc9e':'#dbcaa8';c.font='bold 17px sans-serif';c.textAlign='center';c.fillText(captured?'점령 완료':s.name,b.x+s.x,b.y+s.y+490);}
 if(b.lane?.remaining>0){c.strokeStyle='#b9c6a5';c.lineWidth=1.5;c.setLineDash([8,9]);for(const side of [-1,1]){c.beginPath();c.moveTo(b.lane.x+side*80,b.lane.y-120);c.lineTo(b.lane.x+side*80,b.lane.y+340);c.stroke();}c.setLineDash([]);}c.restore();}
export function drawGallipoliGuide(c,b,g,w,h,z=1){if(b.dead)return;const p=gallipoliObjective(b,g.x,g.y),sx=(b.x+p.x-g.x)*z+w/2,sy=(b.y+p.y-g.y)*z+h/2;
 if(sx>55&&sx<w-55&&sy>195&&sy<h-150)return;const x=Math.max(44,Math.min(w-44,sx)),y=Math.max(205,Math.min(h-160,sy)),a=Math.atan2(sy-h/2,sx-w/2);c.save();c.translate(x,y);c.rotate(a);c.fillStyle='#e8c88e';c.beginPath();c.moveTo(13,0);c.lineTo(-7,-7);c.lineTo(-7,7);c.fill();c.restore();c.save();c.font='bold 11px sans-serif';c.textAlign='center';c.fillStyle='#f0dfbb';c.fillText(b.coreVulnerable?'지휘포대':'미점령 포대',x,y+23);c.restore();}

function bakeCoast(im){const w=im.naturalWidth,h=im.naturalHeight,b=80,pw=w-2*b,src=canvas(w,h),sc=src.getContext('2d',{willReadFrequently:true});sc.drawImage(im,0,0);const data=sc.getImageData(0,0,w,h).data,t=canvas(pw,h),tc=t.getContext('2d'),out=tc.createImageData(pw,h);for(let y=0;y<h;y++)for(let x=0;x<pw;x++){const q=Math.min(1,x/(2*b)),a=q*q*(3-2*q),i=(y*pw+x)*4,j=(y*w+x)*4,k=(y*w+x+pw)*4;for(let c=0;c<3;c++)out.data[i+c]=x<2*b?data[j+c]*a+data[k+c]*(1-a):data[j+c];out.data[i+3]=255*Math.min(1,y/180,(h-1-y)/110);}for(let y=0;y<h;y++)out.data.set(out.data.subarray(y*pw*4,y*pw*4+4),(y*pw+pw-1)*4);tc.putImageData(out,0,0);tiles.set('coast',t);}

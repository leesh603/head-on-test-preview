import {drawGallipoliWeapon,gallipoliSectorArtState} from './gallipoli-art-r10.js';
import {applySeaColor} from './sea-colors.js?v=tame3';
import {fx,fxReady} from './fx-art.js?v=tame3';
import {impactMark,aimLine,laneEdge} from './tactical-marks.js?v=tame3';
import {drawShellFlight} from './boss-rounds.js?v=tame3';
import {GALLIPOLI_PARTS,GALLIPOLI_SECTORS,gallipoliObjective,GALLIPOLI_HANGAR,GALLIPOLI_EXTENTS,GALLIPOLI_COMMAND_MUZZLE} from './gallipoli-boss.js?v=tame3&rail=41';
import {GALLIPOLI_ROUTE} from './gallipoli-route.js?v=tame3&rail=41';
import {periodicSandPixels,maanGroundTiles} from './maan-ground.js?v=tame3';
export const GALLIPOLI_ASSETS=Object.freeze({guns:'gallipoli-weapons-r10.webp',facilities:'gallipoli-facilities-r10.webp',base:'gallipoli-foundations-r10.webp',star:'gallipoli-star-r10.webp',wing:'gallipoli-wing-r10.webp',starDamage:'gallipoli-star-damage-r10.webp',wingDamage:'gallipoli-wing-damage-r10.webp',ground:'gallipoli-siege-ground.webp',coast:'asset-bank/terrain/gallipoli_coast.webp',sea:'terrain-sea359r2.webp',central:'gallipoli-overlay-central.webp',entente:'gallipoli-overlay-entente.webp'});
const images=new Map(),tiles=new Map(),pending=new Map();
function load(k){if(!GALLIPOLI_ASSETS[k])return null;if(images.has(k))return images.get(k);const im=new Image();images.set(k,im);im.decoding='async';im.crossOrigin='anonymous';pending.set(k,new Promise((resolve,reject)=>{im.onload=()=>{if(!im.naturalWidth){reject(new Error('Gallipoli empty asset '+k));return}(im.decode?im.decode():Promise.resolve()).catch(()=>{}).finally(()=>resolve(im))};im.onerror=()=>reject(new Error('Gallipoli asset '+k));}));im.src='./'+GALLIPOLI_ASSETS[k]+'?v=r5';return im;}
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function bake(im,key,sy=0,sh=im.naturalHeight){if(tiles.has(key))return tiles.get(key);const c=canvas(im.naturalWidth,sh),ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,sy,im.naturalWidth,sh,0,0,c.width,sh);const p=periodicSandPixels(ctx.getImageData(0,0,c.width,sh).data,c.width,sh),t=canvas(p.width,p.height),tc=t.getContext('2d'),data=tc.createImageData(p.width,p.height);data.data.set(p.data);tc.putImageData(data,0,0);if(key==='sea')applySeaColor(tc,'gallipoli',t.width,t.height);tiles.set(key,t);return t;}
export function prepareGallipoliAssets(region){if(region!==14){images.clear();pending.clear();tiles.clear();return Promise.resolve();}const sea=load('sea'),coast=load('coast');for(const k of Object.keys(GALLIPOLI_ASSETS))load(k);return Promise.all([...pending.values()]).then(()=>{if(images.get('coast')!==coast)return;bake(sea,'sea');bake(images.get('ground'),'land');bakeCoast(coast);});}
function tile(c,im,x,y,w,h){for(const q of maanGroundTiles(x+w/2,y+h/2,w,h,im.width,im.height))c.drawImage(im,q.x+x,q.y+y,q.width,q.height);}
export function paintGallipoli(c,g,cx,cy,w,h){const r=g?.gallipoliRoute;if(!r)return;c.save();c.translate(w/2-cx,h/2-cy);c.translate(r.x,r.y);c.rotate(r.a+Math.PI/2);const dx=cx-r.x,dy=cy-r.y,n=-Math.sin(r.a)*dx+Math.cos(r.a)*dy,s=Math.cos(r.a)*dx+Math.sin(r.a)*dy,span=Math.hypot(w,h)/2+160,left=n-span,top=-s-span,width=span*2,height=span*2;const sea=tiles.get('sea'),land=tiles.get('land');if(sea&&(!land||top+height>-GALLIPOLI_ROUTE.shore))tile(c,sea,left,top,width,height);if(land){c.save();c.beginPath();c.rect(left,top,width,Math.max(0,-GALLIPOLI_ROUTE.shore-top));c.clip();tile(c,land,left,top,width,height);c.restore();}
 // A continuous horizontal strip with normalized edge samples and soft end masks.
 const coast=tiles.get('coast');if(coast){const pw=coast.width,ph=coast.height,shoreY=-GALLIPOLI_ROUTE.shore;for(let ix=Math.floor(left/pw);ix<Math.ceil((left+width)/pw);ix++)c.drawImage(coast,ix*pw,shoreY-1000,pw,ph);}
 // Sparse authored trench/camp rows, varied by fixed world position rather than scrolling randomness.
 for(const forward of [4000,5200,6400])for(let lateral=-3000;lateral<=3000;lateral+=750){const yy=-forward,variant=(Math.abs(lateral/750)+forward/100)%3;if(lateral+430<left||lateral-430>left+width||yy+360<top||yy-360>top+height)continue;sprite(c,'base',2,0,lateral,yy,530,variant===0?.15:-.12);if(variant!==0)sprite(c,'facilities',variant===1?1:2,0,lateral+180,yy-120,150);}
 c.restore();
 if(!g.stageBoss?.stages.encounter&&s>GALLIPOLI_ROUTE.fort-span-GALLIPOLI_EXTENTS.halfHeight){const body=r.preview||{x:r.x+Math.cos(r.a)*GALLIPOLI_ROUTE.fort,y:r.y+Math.sin(r.a)*GALLIPOLI_ROUTE.fort,captured:new Set(),commandMaxHp:1,commandHp:1,commandDestroyed:false,phase:'active-defense',coreAngle:Math.PI/2,hp:1,maxHp:1,faction:g.stageBoss?.stages.teamFaction==='central'?'entente':'central',parts:new Map(GALLIPOLI_PARTS.map(p=>[p.id,{...p,hp:1,maxHp:1,angle:Math.PI/2}]))};c.save();c.translate(w/2-cx,h/2-cy);drawGallipoliBoss(c,body);c.restore();}
}
// Authored atlas rectangles and measured pivots; the full barrels remain visible.
const artRows={twin:0,howitzer:1,aa:2,command:0,ammo:1,signal:2};
function sprite(c,key,row,state,x,y,w,angle=0,height=0){const im=load(key);if(!im?.naturalWidth)return;
 const cw=im.naturalWidth/3;let sy,sh;
 if(key==='base'){[sy,sh]=[[0,490],[490,377],[867,387]][row];sy*=im.naturalHeight/1254;sh*=im.naturalHeight/1254;}
 else{sh=im.naturalHeight/4;sy=row*sh;}
 c.save();c.translate(x,y);c.rotate(angle);c.imageSmoothingEnabled=true;const h=height||w*sh/cw;
 c.drawImage(im,state*cw,sy,cw,sh,-w*.5,-h*.5,w,h);c.restore();}
function weapon(c,b,p,state){const im=load('guns'),q={...p,x:b.x+p.x,y:b.y+p.y};
 const blend=gallipoliRepairBlend(p,b.commandDestroyed);
 if(!blend){drawGallipoliWeapon(c,im,q,state);return;}
 drawGallipoliWeapon(c,im,q,blend.from);c.save();c.globalAlpha*=blend.amount;drawGallipoliWeapon(c,im,q,blend.to);c.restore();}
function fortress(c,key,state,x,y,w){const im=load(state?key+'Damage':key);if(!im?.naturalWidth)return;
 const cw=im.naturalWidth/(state?2:1),sh=im.naturalHeight,h=w*sh/cw;
 c.drawImage(im,state?(state-1)*cw:0,0,cw,sh,x-w/2,y-h*(key==='wing'?.48:.5),w,h);}
// Blend registered authored damage columns; collision/18s repair timing is unchanged.
export function gallipoliRepairBlend(p,commandDestroyed){if(p.destroyed)return !commandDestroyed&&p.repairRemaining>0&&p.repairRemaining<=3?{from:2,to:1,amount:Math.min(1,(3-p.repairRemaining)/.35)}:null;return p.repairGrace>0?{from:1,to:0,amount:Math.max(0,1-p.repairGrace/.35)}:null;}
function repairedSprite(c,b,p,key,row,state,x,y,w,angle){const blend=gallipoliRepairBlend(p,b.commandDestroyed);if(!blend||blend.amount===1||blend.amount===0){sprite(c,key,row,blend?(blend.amount===1?blend.to:blend.from):state,x,y,w,angle);return;}sprite(c,key,row,blend.from,x,y,w,angle);c.save();c.globalAlpha*=blend.amount;sprite(c,key,row,blend.to,x,y,w,angle);c.restore();}
function road(c,x1,y1,x2,y2){c.lineCap='round';c.strokeStyle='#272823';c.lineWidth=62;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.strokeStyle='#666353';c.lineWidth=45;c.stroke();c.strokeStyle='#373b32';c.lineWidth=3;c.setLineDash([16,22]);c.stroke();c.setLineDash([]);}
export function drawGallipoliBoss(c,b){const state=p=>b.dead||p?.destroyed?2:p&&p.hp<p.maxHp*.55?1:0;c.save();
 for(const s of GALLIPOLI_SECTORS){road(c,b.x,b.y,b.x+s.x,b.y+s.y);fortress(c,s.id==='citadel'?'star':'wing',gallipoliSectorArtState(b,s),b.x+s.x,b.y+s.y,920);}
 road(c,b.x,b.y,b.x,b.y+530);fortress(c,'star',b.dead||b.commandDestroyed?2:b.commandHp<b.commandMaxHp*.55?1:0,b.x,b.y,757);sprite(c,'base',2,b.dead?2:0,b.x,b.y+507,562);
 for(const p of b.parts.values()){const gun=p.kind==='gun'||p.kind==='aa';if(gun)weapon(c,b,p,state(p));else repairedSprite(c,b,p,'facilities',artRows[p.art],state(p),b.x+p.x,b.y+p.y,p.size,0);if(!p.destroyed&&p.gunFlash>0)fx(c,'muzzleHeavy',p.flashX,p.flashY,gun&&p.kind==='aa'?30:48,30,p.angle,Math.min(1,p.gunFlash/.08));
 if(p.destroyed){fx(c,'smokeDark',b.x+p.x,b.y+p.y,50,70,0,.23);if(p.repairRemaining>0&&!b.commandDestroyed){c.strokeStyle=p.repairRemaining<=3?'#edc482':'#b8bdb1';c.lineWidth=3;c.beginPath();c.arc(b.x+p.x,b.y+p.y,p.radius+16,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-p.repairRemaining/18));c.stroke();c.fillStyle='#e4d7b6';c.font='bold 13px sans-serif';c.textAlign='center';c.fillText('수리 '+Math.ceil(p.repairRemaining)+'초',b.x+p.x,b.y+p.y+73);}continue;}
 // Small persistent HP strips distinguish targetable installations from scenery.
 c.fillStyle='#181d19';c.fillRect(b.x+p.x-27,b.y+p.y+59,55,5);c.fillStyle=p.kind==='supply'?'#ccb079':'#bf7d62';c.fillRect(b.x+p.x-27,b.y+p.y+59,55*p.hp/p.maxHp,5);}
 sprite(c,'facilities',0,b.dead||b.commandDestroyed?2:b.commandHp<b.commandMaxHp*.55?1:0,b.x,b.y,398);
 drawGallipoliWeapon(c,load('guns'),{x:b.x,y:b.y,art:'twin',angle:b.coreAngle,recoil:b.coreRecoil,size:374,muzzle:GALLIPOLI_COMMAND_MUZZLE,barrelOffset:22},b.dead||b.commandDestroyed?2:b.commandHp<b.commandMaxHp*.55?1:0);if(!b.commandDestroyed&&b.coreFlash>0)fx(c,'muzzleHeavy',b.coreFlashX,b.coreFlashY,65,42,b.coreAngle,Math.min(1,b.coreFlash/.08));
 if(!b.dead){c.fillStyle='#222720';c.fillRect(b.x-51,b.y-121,101,6);c.fillStyle='#d7af76';c.fillRect(b.x-51,b.y-121,101*Math.max(0,b.commandHp/b.commandMaxHp),6);c.fillStyle='#e2d0a8';c.font='bold 14px sans-serif';c.textAlign='center';c.fillText(b.commandDestroyed?'지휘포대 파괴':'중앙 지휘포대',b.x,b.y-131);}
 const hh=GALLIPOLI_HANGAR;{sprite(c,'facilities',3,b.dead?2:b.commandDestroyed?1:0,b.x+hh.x,b.y+hh.y,hh.width,0,hh.height);c.font='bold 13px sans-serif';c.textAlign='center';c.fillStyle=b.commandDestroyed?'#a6aa9b':b.launchWarning?'#efd198':'#d4c9ac';c.fillText(b.commandDestroyed?'요격기 증원 중단':b.launchWarning?'요격기 출격 준비':'요격기 격납고',b.x+hh.x,b.y+hh.y-hh.height/2-12);if(b.launchWarning||b.launchFlash>0){c.strokeStyle='#ddc18a';c.lineWidth=3;c.beginPath();c.moveTo(b.x+hh.exitX-25,b.y+hh.exitY);c.lineTo(b.x+hh.exitX+25,b.y+hh.exitY);c.stroke();}}
 if(!b.dead&&b.pendingAttack){for(const s of b.pendingAttack.sources){const p=s.id?b.parts.get(s.id):{x:0,y:0};aimLine(c,b.x+p.x,b.y+p.y,s.target.x,s.target.y,{alpha:.6,chevron:false,dash:[6,10]});}}
 for(const s of GALLIPOLI_SECTORS){const captured=b.captured?.has(s.id),im=load(captured?(b.faction==='central'?'entente':'central'):b.faction);if(im?.naturalWidth&&!b.dead)c.drawImage(im,b.x+s.x-22,b.y+s.y-59,44,45);
 c.fillStyle=captured?'#9dcc9e':'#dbcaa8';c.font='bold 17px sans-serif';c.textAlign='center';c.fillText(captured?'진지 무력화':s.name,b.x+s.x,b.y+s.y+382);}
 if(b.lane?.remaining>0){for(const side of [-1,1])laneEdge(c,b.lane.x+side*b.lane.width/2,b.lane.y-120,b.lane.x+side*b.lane.width/2,b.lane.y+340);}c.restore();}
export function drawGallipoliGuide(c,b,g,w,h,z=1){if(b.dead)return;const p=gallipoliObjective(b,g.x,g.y),sx=(b.x+p.x-g.x)*z+w/2,sy=(b.y+p.y-g.y)*z+h/2;
 if(sx>55&&sx<w-55&&sy>195&&sy<h-150)return;const x=Math.max(44,Math.min(w-44,sx)),y=Math.max(205,Math.min(h-160,sy)),a=Math.atan2(sy-h/2,sx-w/2);c.save();c.translate(x,y);c.rotate(a);c.fillStyle='#e8c88e';c.beginPath();c.moveTo(13,0);c.lineTo(-7,-7);c.lineTo(-7,7);c.fill();c.restore();c.save();c.font='bold 11px sans-serif';c.textAlign='center';c.fillStyle='#f0dfbb';c.fillText(p.kind==='command'?'지휘포대':'생존 포대',x,y+23);c.restore();}

function bakeCoast(im){const w=im.naturalWidth,h=im.naturalHeight,b=80,pw=w-2*b,src=canvas(w,h),sc=src.getContext('2d',{willReadFrequently:true});sc.drawImage(im,0,0);const data=sc.getImageData(0,0,w,h).data,t=canvas(pw,h),tc=t.getContext('2d'),out=tc.createImageData(pw,h);for(let y=0;y<h;y++)for(let x=0;x<pw;x++){const q=Math.min(1,x/(2*b)),a=q*q*(3-2*q),i=(y*pw+x)*4,j=(y*w+x)*4,k=(y*w+x+pw)*4;for(let c=0;c<3;c++)out.data[i+c]=x<2*b?data[j+c]*a+data[k+c]*(1-a):data[j+c];out.data[i+3]=255*Math.min(1,y/180,(h-1-y)/110);}for(let y=0;y<h;y++)out.data.set(out.data.subarray(y*pw*4,y*pw*4+4),(y*pw+pw-1)*4);tc.putImageData(out,0,0);tiles.set('coast',t);}

// Native ordnance and ground-impact artwork, with the same warned circle as damage.
export function drawGallipoliHazard(c,h){
 if(h.visual!=='gallipoli-shell'||h.phase==='active'&&!fxReady('mortarImpact0'))return false;
 const warning=h.phase==='warning',q=Math.max(0,Math.min(1,(h.age-h.delay)/Math.max(.01,h.warning)));
 c.save();if(warning){
  impactMark(c,h.x,h.y,h.radius,q,{heavy:h.raidHeavy});
  drawShellFlight(c,h,q);
 }else{const age=Math.max(0,h.age-h.delay-h.warning),t=Math.min(.999,age/h.duration),frame=Math.floor(t*4),size=h.radius*2.5;fx(c,'mortarImpact'+frame,h.x,h.y,size,size,0,Math.min(1,(1-t)*3));}
 c.restore();return true;
}

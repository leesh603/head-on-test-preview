import {drawGroundEnemy,prepareGroundEnemyArt} from './ground-enemy-art.js?v=perf4';
prepareGroundEnemyArt().catch(()=>{});
const sheet=new Image(),sprites=new Map();
export const battlefieldArtReady=new Promise(resolve=>{sheet.onload=()=>{
 const c=document.createElement('canvas');c.width=sheet.naturalWidth;c.height=sheet.naturalHeight;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(sheet,0,0);const data=ctx.getImageData(0,0,c.width,c.height).data;
 ['aa','ship'].forEach((name,i)=>{const start=Math.round(c.width*i/2),end=Math.round(c.width*(i+1)/2);let l=end,r=start,t=c.height,b=0;for(let y=0;y<c.height;y++)for(let x=start;x<end;x++)if(data[(y*c.width+x)*4+3]>100){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}if(r>=l)sprites.set(name,{sheet,x:l,y:t,w:r-l+1,h:b-t+1})});resolve(true)
 };sheet.onerror=()=>resolve(false);sheet.src='./hazards53.webp?v=perf4&b=345'});
export function drawBattlefieldSprite(c,name,x,y,size,a=0){if(name==='aa'){drawGroundEnemy(c,{a:a-Math.PI/2},x,y,size,'aa');return;}if(name==='railgun'){drawGroundEnemy(c,{a:a-Math.PI/2},x,y,size,'railgun');return;}const f=sprites.get(name);if(!f)return;const k=size/Math.max(f.w,f.h);c.save();c.translate(Math.round(x),Math.round(y));c.rotate(a);c.imageSmoothingEnabled=false;c.drawImage(f.sheet,f.x,f.y,f.w,f.h,-f.w*k/2,-f.h*k/2,f.w*k,f.h*k);c.restore()}
const shadowTiles=new Map();
export function drawBattlefieldSpriteShadowed(c,name,x,y,size,a=0){
 const f=sprites.get(name);if(!f)return;const k=size/Math.max(f.w,f.h);
 let t=shadowTiles.get(name+'|'+size);
 if(!t){
  const dw=f.w*k,dh=f.h*k,pad=52;
  t=document.createElement('canvas');t.width=Math.ceil(dw)+pad*2;t.height=Math.ceil(dh)+pad*2;
  const g=t.getContext('2d');g.imageSmoothingEnabled=false;
  g.shadowColor='#080f0ccc';g.shadowBlur=12;g.shadowOffsetX=9;g.shadowOffsetY=13;
  g.drawImage(f.sheet,f.x,f.y,f.w,f.h,pad,pad,dw,dh);
  t.dw=dw;t.dh=dh;t.pad=pad;shadowTiles.set(name+'|'+size,t);
 }
 c.save();c.translate(Math.round(x),Math.round(y));c.rotate(a);c.imageSmoothingEnabled=false;c.drawImage(t,-t.pad-t.dw/2,-t.pad-t.dh/2);c.restore();
}

export const fieldUnitsReady=new Promise(resolve=>{const sheet=new Image();sheet.onload=()=>{const c=document.createElement('canvas');c.width=sheet.naturalWidth;c.height=sheet.naturalHeight;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(sheet,0,0);const d=ctx.getImageData(0,0,c.width,c.height).data;
 ['drachen','caquot','railgun'].forEach((name,i)=>{const start=Math.round(c.width*i/3),end=Math.round(c.width*(i+1)/3);let l=end,r=start,t=c.height,b=0;for(let y=0;y<c.height;y++)for(let x=start;x<end;x++)if(d[(y*c.width+x)*4+3]>100){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}if(r>=l)sprites.set(name,{sheet,x:l,y:t,w:r-l+1,h:b-t+1})});resolve(true)};sheet.onerror=()=>resolve(false);sheet.src='./units56.webp?v=perf4&b=345'});

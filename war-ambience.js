import {fx} from './fx-art.js?v=gal1';
// Ambient battlefield dressing drawn on top of terrain, below entities.
// All emitters are deterministic in world space so they scroll with the map.
const hash=(x,y,s=0)=>{const n=Math.sin(x*127.1+y*311.7+s*74.7)*43758.5453;return n-Math.floor(n)};

// Per-region ambience: flash = distant artillery blink, smoke = rising columns,
// ember = drifting sparks, aa = far-off AA twinkles (london night), gull = sea birds.
const CFG={
 0:{flash:.16,smoke:.12},
 1:{flash:.14,smoke:.08,gull:.5},
 2:{flash:.6,smoke:.42},
 3:{flash:.95,smoke:.75,ember:.9},
 4:{flash:.5,smoke:.45,aa:.25},
 5:{gull:.35},
 6:{smoke:.1},
 7:{flash:.2,smoke:.2,gull:.6},
 8:{flash:.55,smoke:.4},
 9:{flash:.42,smoke:.3},
 10:{flash:.8,smoke:.6},
 11:{flash:.25,smoke:.35,aa:1},
};

// Retain only the current viewport cell range per effect family. No history of
// travelled world cells is retained. Reuse the numeric arrays at each boundary.
const makeSeedCache=()=>({minX:NaN,maxX:NaN,minY:NaN,maxY:NaN,threshold:NaN,cells:[]});
const smokeSeeds=makeSeedCache(),flashSeeds=makeSeedCache(),aaSeeds=makeSeedCache();
function emitterSeeds(cache,minX,maxX,minY,maxY,threshold,salt){
 if(cache.minX===minX&&cache.maxX===maxX&&cache.minY===minY&&cache.maxY===maxY&&cache.threshold===threshold)return cache.cells;
 const cells=cache.cells;cells.length=0;
 for(let gx=minX;gx<=maxX;gx++)for(let gy=minY;gy<=maxY;gy++){
  const s=hash(gx,gy,salt);if(s<=threshold)cells.push(gx,gy,s);
 }
 cache.minX=minX;cache.maxX=maxX;cache.minY=minY;cache.maxY=maxY;cache.threshold=threshold;
 return cells;
}
const emberX=Array.from({length:26},(_,i)=>hash(i,0,3)),emberY=Array.from({length:26},(_,i)=>hash(i,1,3));
const gullX=Array.from({length:14},(_,i)=>hash(i,2,5)),gullY=Array.from({length:14},(_,i)=>hash(i,3,5));

let FLASH_SPRITE=null;
const flashSprite=()=>{
 if(FLASH_SPRITE)return FLASH_SPRITE;
 const k=document.createElement('canvas');k.width=k.height=64;const g=k.getContext('2d');
 const gr=g.createRadialGradient(32,32,0,32,32,32);
 gr.addColorStop(0,'#ffd9a0');gr.addColorStop(.35,'#ff9a4a');gr.addColorStop(1,'#ff7a3800');
 g.fillStyle=gr;g.fillRect(0,0,64,64);return FLASH_SPRITE=k;
};


/* Distant trench skirmishes: sprite-sized ground detail, not enemies/projectiles.
   Sites coincide with surveyed gun and trench-shoulder terrain dressing spots.
   No RNG ownership, AI, collision bodies, combat damage or particle allocations. */
const SKIRMISH_FIELDS=Object.freeze({
 2:[[.194,.178],[.493,.333]],
 3:[[.731,.444],[.524,.252]],
 8:[[.475,.683]],
 10:[[.800,.320]]
});
const SOLDIER_PALETTE=Object.freeze([
 {coat:'#565f50',edge:'#353e35',helmet:'#697266',pack:'#514b38'}, // feldgrau
 {coat:'#656e71',edge:'#3f4947',helmet:'#78817b',pack:'#736b56'}  // muted Entente
]);
const soldierCache=[null,null];
function soldierSprite(side){
 if(soldierCache[side])return soldierCache[side];
 const p=SOLDIER_PALETTE[side],cv=document.createElement('canvas');cv.width=38;cv.height=26;
 const g=cv.getContext('2d');g.translate(18,13);g.lineCap='round';
 // Small top-down infantry silhouette, a single prerendered sprite.
 g.fillStyle='#17191166';g.beginPath();g.ellipse(-1,3,14,5,0,0,Math.PI*2);g.fill();
 g.strokeStyle=p.edge;g.lineWidth=4.3;g.beginPath();
 g.moveTo(-6,-2);g.lineTo(-13,-4);g.moveTo(-6,3);g.lineTo(-13,5);g.stroke();
 g.fillStyle=p.pack;g.fillRect(-7,-6,6,12);
 g.fillStyle=p.coat;g.beginPath();g.ellipse(1,0,10,6,0,0,Math.PI*2);g.fill();
 g.strokeStyle=p.edge;g.lineWidth=2;g.beginPath();g.moveTo(-7,-5);g.lineTo(7,-5);g.stroke();
 // Rifle silhouette, wood stock and dark steel barrel.
 g.strokeStyle='#473b2c';g.lineWidth=2.8;g.beginPath();g.moveTo(1,7);g.lineTo(11,7);g.stroke();
 g.strokeStyle='#242b28';g.lineWidth=1.6;g.beginPath();g.moveTo(10,7);g.lineTo(18,7);g.stroke();
 g.fillStyle=p.helmet;g.beginPath();g.ellipse(7,-1,5.1,5.2,-.15,0,Math.PI*2);g.fill();
 g.strokeStyle='#353a32';g.lineWidth=1.3;g.beginPath();g.ellipse(7,-1,5.1,5.2,-.15,0,Math.PI*2);g.stroke();
 g.strokeStyle='#afb49b66';g.lineWidth=1;g.beginPath();g.moveTo(6,-4);g.lineTo(9,-3);g.stroke();
 return soldierCache[side]=cv;
}
function drawTrenchSkirmishes(c,region,wx,wy,W,H,t,density,period){
 if(!Number.isFinite(period)||period<=0)return;
 const sites=SKIRMISH_FIELDS[region];if(!sites)return;
 const loX=Math.floor(wx/period),hiX=Math.floor((wx+W)/period);
 const loY=Math.floor(wy/period),hiY=Math.floor((wy+H)/period);
 for(let gy=loY;gy<=hiY;gy++)for(let gx=loX;gx<=hiX;gx++){
  const seed=hash(gx,gy,16);
  if(seed>.66 || (density<.7&&seed>.32))continue;
  for(let k=0;k<sites.length;k++){
   if(k===1&&(seed>.28||density<.7))continue;
   const site=sites[k],x=(gx+site[0])*period-wx,y=(gy+site[1])*period-wy;
   if(x<-100||x>W+100||y<-70||y>H+70)continue;
   const phase=(t+seed*22+k*5.1)%5.4;
   for(let side=0;side<2;side++)for(let i=0;i<3;i++){
    const dir=side===0?1:-1;
    const sx=x-dir*(29+i*3)+Math.sin(t*.64+seed*31+i*1.8+side)*2;
    const sy=y+(i-1)*12+(side?.5:-.5);
    const duck=(phase>4.5&&i===1);
    c.save();c.translate(sx,sy);if(side)c.rotate(Math.PI);
    c.globalAlpha*=duck?.56:.76;c.imageSmoothingEnabled=true;
    c.drawImage(soldierSprite(side),-13,-9,26,18);c.restore();
   }
   // Short muted ground-level volleys. Deliberately never target the player.
   if(phase<.24){
    const fade=1-phase/.24,shootRight=((gx+gy+k)&1)===0;
    const x1=x+(shootRight?-12:12),x2=x+(shootRight?15:-15);
    c.globalAlpha=.42*fade;c.strokeStyle='#dbb886';c.lineWidth=1.3;
    c.beginPath();c.moveTo(x1,y-10);c.lineTo(x2,y-9);c.stroke();
    c.globalAlpha=1;
    fx(c,'muzzlePistol',x1,y-10,10,8,shootRight?0:Math.PI,.34*fade);
    fx(c,'dustPuff',x2,y-9,16,12,0,.18*fade);
   }
   if(phase>3.7&&phase<4.9){
    const q=(phase-3.7)/1.2;
    fx(c,'smokePuff',x+3+q*5,y-3-q*9,24+q*12,18+q*12,0,.10*(1-q));
   }
  }
 }
}

export function drawWarAmbience(c,region,cx,cy,W,H,t,density=1,terrainPeriod=768){
 const cfg0=CFG[region];if(!cfg0)return;
 const cfg=density<1?{flash:(cfg0.flash||0)*density,smoke:(cfg0.smoke||0)*density,ember:(cfg0.ember||0)*density,aa:(cfg0.aa||0)*density,gull:(cfg0.gull||0)*density}:cfg0;
 const wx=cx-W/2,wy=cy-H/2;
 c.save();
 if(cfg.smoke){ // persistent smudge columns
  const cell=340,minX=Math.floor(wx/cell)-1,maxX=Math.ceil((wx+W)/cell)+1,minY=Math.floor(wy/cell)-1,maxY=Math.ceil((wy+H)/cell)+1;
  const seeds=emitterSeeds(smokeSeeds,minX,maxX,minY,maxY,cfg.smoke*.4,1);
  for(let j=0;j<seeds.length;j+=3){
   const gx=seeds[j],gy=seeds[j+1],s=seeds[j+2];
   const x=gx*cell-wx+cell*(.15+s*.7),y=gy*cell-wy+cell*(.15+(s*13%1)*.7),ph=(t*.09+s*7)%1;
   for(let i=0;i<2;i++){
    const q=(ph+i*.5)%1,yy=y-q*118,r=16+q*48+s*19,xx=x+Math.sin(t*.35+i+s*9)*15*q;
    c.globalAlpha=.20*(1-q)*Math.min(1,cfg.smoke+.15);
    // Reuse the approved painted smoke atlas instead of flat radial circles.
    if(!fx(c,region===11?'smokeGray':'smokeDark',xx,yy,r*1.8,r*1.6,0,1)){
     c.fillStyle=region===11?'#2a3038':'#24221e';
     c.beginPath();c.arc(xx,yy,r*.65,0,Math.PI*2);c.fill();
    }
   }
  }
 }
 if(cfg.flash){ // brief artillery muzzle flashes on a slower grid
  const cell=420,minX=Math.floor(wx/cell)-1,maxX=Math.ceil((wx+W)/cell)+1,minY=Math.floor(wy/cell)-1,maxY=Math.ceil((wy+H)/cell)+1;
  const seeds=emitterSeeds(flashSeeds,minX,maxX,minY,maxY,cfg.flash*.5,2);
  for(let j=0;j<seeds.length;j+=3){
   const gx=seeds[j],gy=seeds[j+1],s=seeds[j+2];
   const period=2.4+s*4,ph=(t+s*31)%period,on=ph<.34;
   if(!on)continue;
   const fade=1-ph/.34,x=gx*cell-wx+cell*(.1+(s*17%1)*.8),y=gy*cell-wy+cell*(.1+(s*23%1)*.8),r=6+s*20;
   c.globalAlpha=.5*fade;c.drawImage(flashSprite(),x-r*2.2,y-r*2.2,r*4.4,r*4.4);
   c.globalAlpha=.25*fade;c.fillStyle='#3a2c1e';c.beginPath();c.arc(x+4,y-16,10+s*12,0,Math.PI*2);c.fill();
  }
 }
 if(cfg.ember){ // drifting sparks on hellish maps
  const n=Math.floor(cfg.ember*26);
  for(let i=0;i<n;i++){
   const s=emberX[i],px=(s*W*1.4+t*(10+s*24))%(W+40)-20,py=(emberY[i]*H*1.3-t*(26+s*30))%(H+40)-20;
   c.globalAlpha=.5+.4*Math.sin(t*7+s*20);c.fillStyle='#ff9a4a';c.fillRect(px,py,2.4,2.4);
  }
 }
 if(cfg.aa){ // far-off AA twinkles, kept dim so real boss beams stay readable
  const cell=560,minX=Math.floor(wx/cell)-1,maxX=Math.ceil((wx+W)/cell)+1,minY=Math.floor(wy/cell)-1,maxY=Math.ceil((wy+H)/cell)+1;
  const seeds=emitterSeeds(aaSeeds,minX,maxX,minY,maxY,cfg.aa*.42,4);
  for(let j=0;j<seeds.length;j+=3){
   const gx=seeds[j],gy=seeds[j+1],s=seeds[j+2];
   const period=3.6+s*5,ph=(t+s*47)%period;if(ph>.5)continue;
   const fade=1-ph/.5,x=gx*cell-wx+cell*(.1+(s*19%1)*.8),y=gy*cell-wy+cell*(.1+(s*29%1)*.8);
   c.globalAlpha=.34*fade;c.fillStyle='#ffe8b8';
   c.beginPath();c.arc(x,y,2.6+s*3,0,Math.PI*2);c.fill();
   c.globalAlpha=.16*fade;c.strokeStyle='#ffe8b8';c.lineWidth=1;
   c.beginPath();c.arc(x,y,7+s*8+ph*22,0,Math.PI*2);c.stroke();
  }
 }
 if(cfg.gull){ // tiny birds drifting over water/sky maps
  const n=Math.floor(cfg.gull*14);
  for(let i=0;i<n;i++){
   const s=gullX[i],px=(s*W*1.5+t*(14+s*10))%(W+30)-15,py=(gullY[i]*H*.5+t*6)%(H*.55)+10,fl=Math.sin(t*9+s*30)*3;
   c.globalAlpha=.5;c.strokeStyle=region===11?'#8a97ad':'#2c2c26';c.lineWidth=1.4;
   c.beginPath();c.moveTo(px-4,py);c.quadraticCurveTo(px-1,py-3-fl,px,py);c.quadraticCurveTo(px+1,py-3-fl,px+4,py);c.stroke();
  }
 }
 c.globalAlpha=1;
 drawTrenchSkirmishes(c,region,wx,wy,W,H,t,density,terrainPeriod);
 c.restore();
}

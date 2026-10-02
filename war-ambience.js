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

let FLASH_SPRITE=null;
const flashSprite=()=>{
 if(FLASH_SPRITE)return FLASH_SPRITE;
 const k=document.createElement('canvas');k.width=k.height=64;const g=k.getContext('2d');
 const gr=g.createRadialGradient(32,32,0,32,32,32);
 gr.addColorStop(0,'#ffd9a0');gr.addColorStop(.35,'#ff9a4a');gr.addColorStop(1,'#ff7a3800');
 g.fillStyle=gr;g.fillRect(0,0,64,64);return FLASH_SPRITE=k;
};

export function drawWarAmbience(c,region,cx,cy,W,H,t,density=1){
 const cfg0=CFG[region];if(!cfg0)return;
 const cfg=density<1?{flash:(cfg0.flash||0)*density,smoke:(cfg0.smoke||0)*density,ember:(cfg0.ember||0)*density,aa:(cfg0.aa||0)*density,gull:(cfg0.gull||0)*density}:cfg0;
 const wx=cx-W/2,wy=cy-H/2;
 c.save();
 if(cfg.smoke){ // persistent smudge columns
  const cell=340,minX=Math.floor(wx/cell)-1,maxX=Math.ceil((wx+W)/cell)+1,minY=Math.floor(wy/cell)-1,maxY=Math.ceil((wy+H)/cell)+1;
  for(let gx=minX;gx<=maxX;gx++)for(let gy=minY;gy<=maxY;gy++){
   const s=hash(gx,gy,1);if(s>cfg.smoke*.4)continue;
   const x=gx*cell-wx+cell*(.15+s*.7),y=gy*cell-wy+cell*(.15+(s*13%1)*.7),ph=(t*.09+s*7)%1;
   for(let i=0;i<3;i++){const q=(ph+i/3)%1,yy=y-q*130,r=10+q*34+s*14;
    c.globalAlpha=.13*(1-q);c.fillStyle=region===11?'#2a3038':'#24221e';
    c.beginPath();c.arc(x+Math.sin(t*.35+i+s*9)*14*q,yy,r,0,Math.PI*2);c.fill();}
  }
 }
 if(cfg.flash){ // brief artillery muzzle flashes on a slower grid
  const cell=420,minX=Math.floor(wx/cell)-1,maxX=Math.ceil((wx+W)/cell)+1,minY=Math.floor(wy/cell)-1,maxY=Math.ceil((wy+H)/cell)+1;
  for(let gx=minX;gx<=maxX;gx++)for(let gy=minY;gy<=maxY;gy++){
   const s=hash(gx,gy,2);if(s>cfg.flash*.5)continue;
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
   const s=hash(i,0,3),px=(s*W*1.4+t*(10+s*24))%(W+40)-20,py=(hash(i,1,3)*H*1.3-t*(26+s*30))%(H+40)-20;
   c.globalAlpha=.5+.4*Math.sin(t*7+s*20);c.fillStyle='#ff9a4a';c.fillRect(px,py,2.4,2.4);
  }
 }
 if(cfg.aa){ // far-off AA twinkles, kept dim so real boss beams stay readable
  const cell=560,minX=Math.floor(wx/cell)-1,maxX=Math.ceil((wx+W)/cell)+1,minY=Math.floor(wy/cell)-1,maxY=Math.ceil((wy+H)/cell)+1;
  for(let gx=minX;gx<=maxX;gx++)for(let gy=minY;gy<=maxY;gy++){
   const s=hash(gx,gy,4);if(s>cfg.aa*.42)continue;
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
   const s=hash(i,2,5),px=(s*W*1.5+t*(14+s*10))%(W+30)-15,py=(hash(i,3,5)*H*.5+t*6)%(H*.55)+10,fl=Math.sin(t*9+s*30)*3;
   c.globalAlpha=.5;c.strokeStyle=region===11?'#8a97ad':'#2c2c26';c.lineWidth=1.4;
   c.beginPath();c.moveTo(px-4,py);c.quadraticCurveTo(px-1,py-3-fl,px,py);c.quadraticCurveTo(px+1,py-3-fl,px+4,py);c.stroke();
  }
 }
 c.restore();
}

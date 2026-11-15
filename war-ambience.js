// World scenery only. These visuals never enter the combat simulation.
const hash=(x,y,s=0)=>{const n=Math.sin(x*127.1+y*311.7+s*74.7)*43758.5453;return n-Math.floor(n)};
const CFG={1:{gull:.5},5:{gull:.35},7:{gull:.6}};
const gullX=Array.from({length:14},(_,i)=>hash(i,2,5)),gullY=Array.from({length:14},(_,i)=>hash(i,3,5));
export function drawWarAmbience(c,region,cx,cy,W,H,t,density=1){
 const source=CFG[region];if(!source)return;
 const cfg={gull:source.gull*density};c.save();
 if(cfg.gull){ // tiny birds drifting over water/sky maps
  const n=Math.floor(cfg.gull*14);
  for(let i=0;i<n;i++){
   const s=gullX[i],px=(s*W*1.5+t*(14+s*10))%(W+30)-15,py=(gullY[i]*H*.5+t*6)%(H*.55)+10,fl=Math.sin(t*9+s*30)*3;
   c.globalAlpha=.5;c.strokeStyle=region===11?'#8a97ad':'#2c2c26';c.lineWidth=1.4;
   c.beginPath();c.moveTo(px-4,py);c.quadraticCurveTo(px-1,py-3-fl,px,py);c.quadraticCurveTo(px+1,py-3-fl,px+4,py);c.stroke();
  }
 }
 c.globalAlpha=1;c.restore();
}

// Normalized landmarks on terrain-burning-front-20261115.webp.
// Fires sit over charred timber, and steam stays close to flooded craters.
const BURNING_SITES=[
 {x:.12,y:.28,size:64,angle:.3}, {x:.284,y:.48,size:54,angle:-.18},
 {x:.497,y:.544,size:80,angle:.55}, {x:.156,y:.712,size:59,angle:-.38},
 {x:.664,y:.849,size:72,angle:.42}, {x:.704,y:.126,size:58,angle:-.42},
 {x:.345,y:.316,size:104}, {x:.586,y:.729,size:122}
];
let burningFire,burningSmoke,burningLoad;
export function prepareBurningFront(){
 if(typeof Image==='undefined')return Promise.resolve();
 if(!burningLoad){
  const load=src=>new Promise(resolve=>{
   const img=new Image();img.decoding='async';
   img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src;
  });
  burningLoad=Promise.all([load('./fx-fire-ground.webp'),load('./burning-front-smoke-20261115.webp')]).then(([fire,smoke])=>{
   burningFire=fire;burningSmoke=smoke;
   if(!fire||!smoke)burningLoad=null;
  });
 }
 return burningLoad;
}

function drawGroundFire(c,x,y,site,pulse){
 const width=site.size*(.82+.25*pulse),height=width*.7;
 c.save();c.translate(x,y-2);c.rotate(site.angle);
 c.globalAlpha=.66+.32*pulse;
 c.drawImage(burningFire,-width/2,-height/2,width,height);
 c.restore();
}

function drawGroundSmoke(c,x,y,site,t,seed,steps,turn,budget){
 const flame=site.angle!==undefined,cell=burningSmoke.naturalWidth/2,sh=burningSmoke.naturalHeight;
 const speed=flame?220:185,cycle=(flame?6.9:10.4)+seed*2;
 let count=0;
 for(let i=0;i<steps&&count<budget;i++){
  const age=(t/cycle+seed+i/steps)%1;
  const soot=flame&&i%3===0;
  const dx=age*speed*(soot?.58:1),dy=dx*turn+Math.sin(age*7+seed*9)*age*18;
  const width=site.size*(.72+(soot?1.45:2.1)*age),height=width*.76;
  c.globalAlpha=Math.sin(age*Math.PI)*(soot?.64:flame?.54:.38);
  c.drawImage(burningSmoke,soot?cell:0,0,cell,sh,x+dx-width/2,y+dy-height/2,width,height);
  count++;
 }
 return count;
}

export function drawBurningFront(c,cx,cy,W,H,t,tile,lowDetail=false){
 if(!burningFire&&!burningSmoke)return;
 const left=cx-W/2,top=cy-H/2,steps=lowDetail?3:5,wind=-.34+Math.sin(t*.29)*.11;
 let smokeBudget=lowDetail?24:48;
 c.save();c.imageSmoothingEnabled=true;
 for(let iy=Math.floor((top-150)/tile);iy<=Math.floor((top+H+200)/tile);iy++){
  for(let ix=Math.floor((left-340)/tile);ix<=Math.floor((left+W+150)/tile);ix++){
   for(let k=0;k<BURNING_SITES.length;k++){
    const site=BURNING_SITES[k],x=(ix+site.x)*tile-left,y=(iy+site.y)*tile-top;
    if(x<-320||x>W+150||y<-150||y>H+200)continue;
    const seed=hash(ix,iy,k+1),flame=site.angle!==undefined;
    if(k!==2&&seed<.2)continue;
    if(flame&&burningFire&&x>=-45&&x<=W+45&&y>=-45&&y<=H+45){
     const pulse=.5+.25*Math.sin(t*(8+seed*6)+seed*30)+.25*Math.sin(t*3.6+k);
     drawGroundFire(c,x,y,site,pulse);
    }
    if(burningSmoke&&smokeBudget>0)smokeBudget-=drawGroundSmoke(c,x,y,site,t,seed,steps,wind,smokeBudget);
   }
  }
 }
 c.restore();
}

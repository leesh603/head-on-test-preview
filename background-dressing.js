// Scenery only: no Game/RNG ownership, collision, AI, particles or update loop.
// Coordinates were measured on the current authored terrain, never scattered.
import {drawGroundLife,groundLifeReady,drawHarborLife,drawCoastLife} from './ground-life.js?v=livingww1d';
const FRAMES=Object.freeze({gun:0,tank:1,farm:2,wagon:3,ambulance:4,lorry:5,train:6,supplies:7,landing:8,camp:9,desertWagon:10,brokenGun:11});
const images={};
export const backgroundDressingReady=typeof Image==='undefined'?Promise.resolve(false):Promise.all([groundLifeReady,...[
 ['atlas','./background-dressing-20261010.webp?v=gal1'],['coastalGun','./zeebrugge-harbor-props.webp?v=gal1']
].map(([key,src])=>new Promise(resolve=>{const im=new Image();images[key]=im;im.decoding='async';im.onload=()=>{(im.decode?im.decode():Promise.resolve()).catch(()=>{}).finally(()=>resolve(!!im.naturalWidth))};im.onerror=()=>resolve(false);im.src=src;}))]);
export function drawDressingSprite(c,kind,x,y,size,angle=0,alpha=.74){
 const coastal=kind==='coastalGun',im=images[coastal?'coastalGun':'atlas'];if(!im?.naturalWidth)return;
 c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha*=alpha;c.imageSmoothingEnabled=true;
 if(coastal){const sw=im.naturalWidth/3,sh=im.naturalHeight/3;c.drawImage(im,0,sh*2,sw,sh,-size/2,-size*sh/sw/2,size,size*sh/sw);}
 else{const i=FRAMES[kind];if(i!==undefined){const sw=im.naturalWidth/4,sh=im.naturalHeight/3;c.drawImage(im,(i%4)*sw,Math.floor(i/4)*sh,sw,sh,-size/2,-size/2,size,size);}}
 c.restore();
}
// [kind, normalized terrain x/y, footprint size, heading, context]. Roads,
// trench shoulders and farm yards are checked against the unmodified masters.
export const TERRAIN_DRESSING=Object.freeze({
 rural:[['farm',.757,.476,38,.08,'farm-yard'],['wagon',.615,.740,35,-.65,'farm-road'],['supplies',.215,.657,20,.1,'farm-yard']],
 trenches:[['gun',.194,.178,58,.32,'trench-shoulder'],['tank',.696,.697,56,-.55,'trench-approach'],['brokenGun',.493,.333,43,.8,'trench-shoulder']],
 burning:[['gun',.731,.444,57,.45,'trench-shoulder'],['tank',.267,.585,55,.35,'trench-approach'],['brokenGun',.524,.252,41,-.3,'trench-shoulder']],
 cambrai:[['tank',.457,.260,45,.2,'trench-approach'],['gun',.475,.683,44,-.3,'trench-shoulder']],
 somme:[['gun',.800,.320,55,-.45,'trench-shoulder'],['tank',.266,.698,53,.65,'trench-approach']],
 city:[['ambulance',.800,.457,27,.03,'street'],['lorry',.186,.369,25,1.76,'street'],['supplies',.426,.864,18,.2,'warehouse-yard']],
 london:[['ambulance',.858,.169,30,.05,'street'],['lorry',.371,.783,27,-.05,'street'],['train',.743,.667,120,1.73,'rail-yard']]
});
const variant=(x,y)=>((Math.imul(x,73856093)^Math.imul(y,19349663))>>>0);
export function drawRepeatedDressing(c,key,left,top,width,height,period){
 const sites=TERRAIN_DRESSING[key];if(!sites)return;
 let trains=0;
 for(let iy=Math.floor(top/period);iy<=Math.floor((top+height)/period);iy++)for(let ix=Math.floor(left/period);ix<=Math.floor((left+width)/period);ix++){
  const seed=variant(ix,iy),mirror=key==='cambrai',mx=mirror&&Math.abs(ix%2),my=mirror&&Math.abs(iy%2);
  for(let j=0;j<sites.length;j++){
   const [kind,u,v,size,a]=sites[j];
   // Animated vehicles are painted in a live pass, never baked as ghosts.
   if(kind==='tank'||kind==='ambulance'||kind==='lorry')continue;
   // Two or three approved sites per tile, with alternating damage/heading.
   if((seed+j)%4===3)continue;
   if(kind==='train'&&(ix%3!==0||iy%3!==0||trains))continue;
   const x=(ix+(mx?1-u:u))*period-left,y=(iy+(my?1-v:v))*period-top;
   if(x+size/2<0||y+size/2<0||x-size/2>width||y-size/2>height)continue;
   if(kind==='train')trains++;
   const heading=(mx?-a:a)*(my?-1:1)+(my?Math.PI:0);
   drawDressingSprite(c,kind==='gun'&&(seed&1)?'brokenGun':kind,x,y,size,heading+(kind==='train'?0:((seed%3)-1)*.07));
  }
 }
}

// Live authored image layer, under all combat entities and hazard markers.
export function drawMovingDressing(c,key,left,top,width,height,period,t,density=1){
 drawGroundLife(c,key,left,top,width,height,period,t,density);
}

// The harbor image itself supplies every dock/land coordinate. Bake before
// the existing landmark's fade, so no ground prop survives beyond its land.
export const HARBOR_DRESSING=Object.freeze([
 ['supplies',253,402,29,.1,'dock'],['supplies',168,692,28,-.18,'dock'],
 ['supplies',614,587,28,.08,'dock'],['supplies',714,819,28,-.1,'dock'],
 ['wagon',340,1071,34,1.92,'land-road']
]);
export function bakeHarborDressing(c,width,height){
 c.save();c.scale(width/1254,height/1254);
 for(const [kind,x,y,size,a]of HARBOR_DRESSING)drawDressingSprite(c,kind,x,y,size,a,.72);
 c.restore();
}
// Conservative hand-checked rectangles in the 1254px coast master. The beach
// extends below route.shore; using that single s threshold would misclassify it.
export const COAST_DRESSING=Object.freeze([
 {kind:'coastalGun',x:326,y:860,size:68,a:.12,terrain:'land',safe:[280,810,405,925]},
 {kind:'supplies',x:376,y:895,size:25,a:.1,terrain:'land',safe:[280,810,405,925]},
 {kind:'landing',x:580,y:1018,size:38,a:-.12,terrain:'beach',safe:[530,990,650,1043]}
]);
export function drawGallipoliDressing(c,r,cx,cy,w,h,t=0){
 if(!r)return;const dx=cx-r.x,dy=cy-r.y,n=-Math.sin(r.a)*dx+Math.cos(r.a)*dy,s=Math.cos(r.a)*dx+Math.sin(r.a)*dy,span=Math.hypot(w,h)/2+90;
 c.save();c.translate(w/2-cx,h/2-cy);c.translate(r.x,r.y);c.rotate(r.a+Math.PI/2);
 // Current bakeCoast removes 80px at each horizontal edge: period 1094.
 for(let ix=Math.floor((n-span)/1094);ix<=Math.floor((n+span)/1094);ix++)for(const site of COAST_DRESSING){
  const y=-2800-1000+site.y,x=ix*1094+site.x;
  if(Math.abs(x-n)>span+site.size||Math.abs(y+s)>span+site.size)continue;
  // No translation jitter: the complete footprint must stay on authored land.
  drawDressingSprite(c,site.kind,x,y,site.size,site.a+((variant(ix,0)%3)-1)*.04,.7);
  if(site.kind==='coastalGun')drawCoastLife(c,x+24,y+20,t);
 }
 c.restore();
}
export function drawDesertDressing(c,cx,cy,w,h){
 const left=cx-w/2,top=cy-h/2,period=1700;
 // This current Ma'an master contains only dry sand/rock. Wagons stay at the
 // two-tent supply camp, never on an invented road or European farm patch.
 for(let iy=Math.floor(top/period);iy<=Math.floor((top+h)/period);iy++)for(let ix=Math.floor(left/period);ix<=Math.floor((left+w)/period);ix++){
  const seed=variant(ix,iy);if(seed%3===2)continue;
  const x=ix*period+320-left,y=iy*period+380-top;
  if(x<-130||y<-130||x>w+130||y>h+130)continue;
  drawDressingSprite(c,'camp',x,y,96,((seed%3)-1)*.12,.77);
  drawDressingSprite(c,'desertWagon',x+83,y+55,48,.22,.76);
 }
}
export const PARIS_DRESSING=Object.freeze([
 ['ambulance',350,805,46,.04,'hospital-road'],['lorry',1190,627,38,-.05,'street'],
 ['supplies',1023,674,36,.2,'rail-platform'],['train',984,633,187,1.82,'rail-yard']
]);
export function drawParisDressing(c,g,cx,cy,w,h){
 const origin=g?.parisBattle?.origin;if(!origin)return;
 const period=4096,left=cx-w/2-origin.x+period*601/1200,top=cy-h/2-origin.y+460+period*372/1204;
 let trains=0;
 for(let iy=Math.floor(top/period);iy<=Math.floor((top+h)/period);iy++)for(let ix=Math.floor(left/period);ix<=Math.floor((left+w)/period);ix++){
  const mx=Math.abs(ix%2),my=Math.abs(iy%2),seed=variant(ix,iy);
  for(let j=0;j<PARIS_DRESSING.length;j++){
   const [kind,px,py,size,a]=PARIS_DRESSING[j];if((seed+j)%4===3&&kind!=='train')continue;
   if(kind==='train'&&(trains||ix%3!==0||iy%3!==0))continue;
   const u=(px-27)/1200,v=(py-25)/1204,x=(ix+(mx?1-u:u))*period-left,y=(iy+(my?1-v:v))*period-top;
   if(x<-size||y<-size||x>w+size||y>h+size)continue;
   if(kind==='train')trains++;
   drawDressingSprite(c,kind,x,y,size,(mx?-a:a)*(my?-1:1)+(my?Math.PI:0),.57);
  }
 }
}

export {drawHarborLife};

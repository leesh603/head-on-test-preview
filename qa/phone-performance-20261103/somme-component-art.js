// Authored hull and independently destructible roofs. No per-frame canvases,
// filters or generated graphics; fallback rendering remains in somme-boss-render.
export const SOMME_DETAIL_SOURCES=Object.freeze({
 fort:'./boss-somme-fort-20261021.webp',tank:'./boss-somme-mark1-20261021.webp',parts:'./boss-somme-components-20261021.webp'
});
let images={},pending=null;
export function prepareSommeDetailArt(){
 if(pending)return pending;
 pending=Promise.all(Object.entries(SOMME_DETAIL_SOURCES).map(([key,url])=>new Promise(resolve=>{
  const im=new Image();im.decoding='async';images[key]=im;
  im.addEventListener('load',()=>Promise.resolve(im.decode?.()).catch(()=>{}).then(()=>resolve(im)),{once:true});
  im.addEventListener('error',()=>resolve(im),{once:true});im.src=url;
 })));return pending;
}
export function releaseSommeDetailArt(){images={};pending=null;}
export function sommeDetailReady(){return Object.keys(SOMME_DETAIL_SOURCES).every(k=>images[k]?.naturalWidth>0);}
export function drawSommeDetailHull(c,b){
 if(!sommeDetailReady())return false;
 const s=b.sommeScale||1,tank=b.assetKey==='mark4-wedge';
 if(tank){
  const im=images.tank,cell=im.naturalWidth/3,index=b.destroying?2:b.hp<b.maxHp*.55?1:0;
  // All three cells share a measured hull axis; keep the existing roof size.
  c.drawImage(im,index*cell,0,cell,im.naturalHeight,-84*s*256/234,-230*s*256/493,84*s*cell/234,230*s*im.naturalHeight/493);
 }else{
  const im=images.fort,w=im.naturalWidth/2,h=im.naturalHeight/2,index=b.destroying?3:b.coreVulnerable?2:b.hp<b.maxHp*.72?1:0;
  c.drawImage(im,(index%2)*w,Math.floor(index/2)*h,w,h,-340*s,-170*s,680*s,340*s);
 }
 return true;
}
export function sommeComponentCell(p,dead=false){
 const row=p.art==='observer'?0:p.art==='ammo'?1:p.art==='engine-deck'?2:p.art==='mg'?3:-1;
 return row<0?-1:row*3+(dead||p.destroyed?2:p.hp<=p.maxHp*.5?1:0);
}
export function drawSommeComponent(c,p,dead=false,{x=p.x,y=p.y,angle=0}={}){
 const cell=sommeComponentCell(p,dead);if(cell<0||!sommeDetailReady())return false;
 const im=images.parts,n=im.naturalWidth/3;
 c.save();c.translate(x,y);c.rotate(angle);c.drawImage(im,(cell%3)*n,Math.floor(cell/3)*n,n,n,-p.drawWidth/2,-p.drawHeight/2,p.drawWidth,p.drawHeight);c.restore();return true;
}

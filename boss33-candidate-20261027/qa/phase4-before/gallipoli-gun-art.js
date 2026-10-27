// Registered measurements on the existing 1254px production sheet.
// These masks cover bare barrels, leaving shields, handwheels and platforms fixed.
const guns={
 twin:{row:[0,435],pivot:[224.5,300],tipY:18,halfBores:23.5,masks:[[189,0,76,154]]},
 howitzer:{row:[435,415],pivot:[224,725],tipY:455,masks:[[201,435,46,140]]},
 aa:{row:[850,404],pivot:[224,1104],tipY:880,masks:[[190,850,25,155],[236,850,25,155]]}
};
export function gallipoliGunPose(image,p,state=0){
 const f=guns[p.art];if(!f||!image?.naturalWidth)return null;
 const scale=image.naturalHeight/1254,column=image.naturalWidth/3,index=Math.max(0,Math.min(2,state));
 const ky=p.muzzle/(f.pivot[1]-f.tipY),kx=f.halfBores?(p.barrelOffset||14)/f.halfBores:ky;
 // The art advances 400px per state inside 418px cells; undo that 18px drift.
 const offset=index*(400*scale-column);
 return {rect:[index*column,f.row[0]*scale,column,f.row[1]*scale],
  pivot:[f.pivot[0]*scale+offset,f.pivot[1]*scale],kx:kx/scale,ky:ky/scale,
  masks:f.masks.map(([x,y,w,h])=>[x*scale+offset,y*scale,w*scale,h*scale]),
  recoil:index===2||p.destroyed?0:Math.max(0,Math.min(.3,p.recoil||0))*25};
}
function drawState(c,image,p,state){
 const q=gallipoliGunPose(image,p,state),[sx,sy,sw,sh]=q.rect,
  left=-q.pivot[0]*q.kx,top=(sy-q.pivot[1])*q.ky,width=sw*q.kx,height=sh*q.ky;
 const draw=(dy=0)=>c.drawImage(image,sx,sy,sw,sh,left,top+dy,width,height);
 if(!q.recoil){draw();return;}
 c.save();c.beginPath();c.rect(left-2,top-2,width+4,height+4);
 for(const [x,y,w,h]of q.masks)c.rect((x-q.pivot[0])*q.kx,(y-q.pivot[1])*q.ky,w*q.kx,h*q.ky);
 c.clip('evenodd');draw();c.restore();
 for(const [x,y,w,h]of q.masks){
  c.save();c.beginPath();c.rect((x-q.pivot[0])*q.kx,(y-q.pivot[1])*q.ky,w*q.kx,h*q.ky);c.clip();draw(q.recoil);c.restore();
 }
}
export function drawGallipoliGun(c,image,p,state,x,y,blend=null){
 if(!gallipoliGunPose(image,p,state))return false;
 c.save();c.translate(x,y);c.rotate(p.angle+Math.PI/2);c.imageSmoothingEnabled=true;
 if(blend&&blend.amount>0&&blend.amount<1){
  // Rebuild from the platform towards the bores. Complementary clips preserve
  // the source alpha without translucent overlapping wrecks or raster caches.
  const q=gallipoliGunPose(image,p,blend.from),top=(q.rect[1]-q.pivot[1])*q.ky,
   height=q.rect[3]*q.ky,cut=top+height*(1-blend.amount),left=-q.pivot[0]*q.kx,width=q.rect[2]*q.kx;
  // A small underlap keeps antialiased clip edges opaque on rotated canvases.
  c.save();c.beginPath();c.rect(left-30,top-2,width+60,cut-top+4);c.clip();drawState(c,image,p,blend.from);c.restore();
  c.save();c.beginPath();c.rect(left-30,cut,width+60,top+height-cut+2);c.clip();drawState(c,image,p,blend.to);c.restore();
 }else drawState(c,image,p,blend?(blend.amount>=1?blend.to:blend.from):state);
 c.restore();return true;
}

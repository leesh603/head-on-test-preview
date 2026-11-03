// Joints measured on the existing 192px component cells. Never move the
// receiver, feed or mounting ring with the recoiling upper barrel crop.
export function alpsGunHardwarePose(body,part){
 const cannon=part.id==='cannon',s=body.geometryScale||1,stopped=body.destroying||part.destroyed;
 const angle=part.id==='rearGun'?Math.PI:0;
 const size=part.radius*(cannon?4:2.7),muzzle=(cannon?16:6)*s;
 return {angle,size,anchorX:113.5/192,anchorY:.02+muzzle/size,joint:cannon?.52:.40,recoil:stopped?0:Math.max(0,Math.min(1,(part.recoil||0)/(cannon?.22:.12)))*(cannon?4:1.8)*s};
}

export function drawAlpsGunHardware(c,body,part,atlas,cell){
 if(!atlas?.naturalWidth)return false;
 const pose=alpsGunHardwarePose(body,part),cw=atlas.naturalWidth/3,sx=cell%3*cw,sy=Math.floor(cell/3)*cw,x=-pose.size*pose.anchorX,y=-pose.size*pose.anchorY;
 c.save();c.rotate(pose.angle);
 if(pose.recoil>0){
  const height=pose.size*pose.joint;
  c.save();c.beginPath();c.rect(x,y,pose.size,height);c.clip();
  c.drawImage(atlas,sx,sy,cw,cw,x,y+pose.recoil,pose.size,pose.size);c.restore();
  // Keep the full-frame sampling grid for the fixed receiver: a cropped
  // fractional source height can otherwise introduce a one-pixel seam.
  c.save();c.beginPath();c.rect(x,y+height,pose.size,pose.size-height);c.clip();
  c.drawImage(atlas,sx,sy,cw,cw,x,y,pose.size,pose.size);c.restore();
 }else c.drawImage(atlas,sx,sy,cw,cw,x,y,pose.size,pose.size);
 c.restore();return true;
}

import {JUTLAND_RECTS} from './jutland-atlas.js?v=capital-final-20261030';

// Measured turntable centers and barrel joints in the original 1254px sheet.
// Damage columns are registered to the same deck station, never rescaled to fit.
const mounts=[
 {x:249,y:282,tipY:7,jointY:154,reach:128},
 {x:248.5,y:632,tipY:399,jointY:525,reach:85},
 {x:248,y:941.2}
];
export function jutlandGunPose(row,state,size,recoil=0){
 const mount=mounts[row];if(!mount)return null;
 const index=Math.max(0,Math.min(2,state)),rect=JUTLAND_RECTS.parts[row*3+index];
 const scale=row<2?mount.reach/(mount.y-mount.tipY):size/JUTLAND_RECTS.parts[row*3][2];
 return {rect,scale,pivot:[mount.x+index*378-rect[0],mount.y-rect[1]],
  joint:mount.jointY==null?null:(mount.jointY-rect[1])*scale,
  recoil:index===2||row===2?0:Math.max(0,Math.min(1,recoil/.22))*mount.reach*.07};
}
export function drawJutlandGun(c,image,p,state,x,y){
 const pose=jutlandGunPose(p.row,state,p.size,p.recoil||0);
 if(!pose||!image?.naturalWidth)return false;
 const [sx,sy,sw,sh]=pose.rect,[px,py]=pose.pivot,k=pose.scale,
  left=-px*k,top=-py*k,width=sw*k,height=sh*k;
 c.save();c.translate(x,y);c.rotate(p.angle+Math.PI/2);c.imageSmoothingEnabled=true;
 if(pose.recoil>0){
  c.save();c.beginPath();c.rect(left-2,top-2,width+4,pose.joint+2);c.clip();
  c.drawImage(image,sx,sy,sw,sh,left,top+pose.recoil,width,height);c.restore();
  // Full-frame sampling keeps the fixed receiver identical during recoil.
  c.save();c.beginPath();c.rect(left-2,top+pose.joint,width+4,height-pose.joint+2);c.clip();
  c.drawImage(image,sx,sy,sw,sh,left,top,width,height);c.restore();
 }else c.drawImage(image,sx,sy,sw,sh,left,top,width,height);
 c.restore();return true;
}

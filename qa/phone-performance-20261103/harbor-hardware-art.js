// Measured crops from the authored HEAD-ON harbor hardware sheet.
// Pivots are measured in source pixels; platform and gun share one native mount.
export const HARBOR_HARDWARE_FRAMES=Object.freeze({"deck0":{"rect":[0,0,417,402],"pivot":[219,143]},"deck1":{"rect":[417,0,417,402],"pivot":[194,143]},"deck2":{"rect":[835,0,417,402],"pivot":[175,143]},"deck3":{"rect":[0,402,436,411],"pivot":[220,212]},"gun":{"rect":[480,402,289,382],"pivot":[140,259],"reach":247,"joint":168},"gunDamaged":{"rect":[872,402,304,382],"pivot":[151,259],"reach":247,"joint":168},"gunWreck":{"rect":[20,833,392,353],"pivot":[199,176]},"pivotDamaged":{"rect":[416,789,410,418],"pivot":[203,224]},"pivotWreck":{"rect":[828,794,413,416],"pivot":[197,228]}});

const DECKS=[['deck0',1],['deck1',1],['deck3',-1],['deck3',1]];
export const HARBOR_GUN_REACH=30;
export function harborGunArtPose(body,part){
 const state=body.destroying||part.destroyed?2:part.hp<part.maxHp*.55?1:0,key=['gun','gunDamaged','gunWreck'][state],frame=HARBOR_HARDWARE_FRAMES[key];
 return {state,key,frame,angle:part.angle+Math.PI/2,scale:HARBOR_GUN_REACH/HARBOR_HARDWARE_FRAMES.gun.reach,recoil:state===2?0:Math.max(0,part.recoil||0)*2};
}
function frame(c,im,f,k){const [sx,sy,sw,sh]=f.rect,[px,py]=f.pivot;c.drawImage(im,sx,sy,sw,sh,-px*k,-py*k,sw*k,sh*k);}
export function drawHarborGunArt(c,body,part,atlas){
 if(!atlas?.naturalWidth)return false;
 const [deck,flip]=DECKS[part.cell??0],pose=harborGunArtPose(body,part),f=pose.frame,[sx,sy,sw,sh]=f.rect,[px,py]=f.pivot,k=pose.scale;
 c.save();c.translate(part.localX,part.localY);c.imageSmoothingEnabled=true;
 c.save();c.scale(flip,1);frame(c,atlas,HARBOR_HARDWARE_FRAMES[deck],part.drawWidth/512);c.restore();
 c.rotate(pose.angle);
 if(pose.recoil>0&&f.joint){
  c.save();c.beginPath();c.rect(-px*k,-py*k,sw*k,f.joint*k);c.clip();
  c.drawImage(atlas,sx,sy,sw,f.joint,-px*k,-py*k+pose.recoil,sw*k,f.joint*k);c.restore();
  c.drawImage(atlas,sx,sy+f.joint,sw,sh-f.joint,-px*k,(f.joint-py)*k,sw*k,(sh-f.joint)*k);
 }else frame(c,atlas,f,k);
 c.restore();return true;
}
export function drawHarborPivotArt(c,part,atlas,x,y,forceWreck=false){
 if(!atlas?.naturalWidth||!part)return false;
 const dead=forceWreck||part.destroyed,damaged=part.hp<part.maxHp*.55;
 if(!dead&&!damaged)return false;
 const f=HARBOR_HARDWARE_FRAMES[dead?'pivotWreck':'pivotDamaged'];c.save();c.translate(x,y);c.imageSmoothingEnabled=true;frame(c,atlas,f,82/f.rect[2]);c.restore();return true;
}

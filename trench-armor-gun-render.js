import {TRENCH_ARMOR_LAYOUT,armorGunTurn,armorGunRecoil} from './trench-armor-layout.js?v=512';

// Draw the existing authored pixels in two layers. The breech/armor stays
// bolted to the chassis and occludes the rotating barrel root. No new art,
// per-frame rasterization, stretching, or rectangular housing rotation.
export function drawTrenchArmorGun(c,part,kind,image,scale=1){
 if(!(image?.naturalWidth||image?.width))return;
 const layout=TRENCH_ARMOR_LAYOUT[kind],art=layout.gunArt,mark=kind==='mark-v-cruiser';
 const base=layout.guns.find(g=>g.id===part.id).baseAngle,k=layout.gunSize/320;
 const mirrored=mark&&part.id==='sponson-right',turn=armorGunTurn(kind,part);
 c.save();c.translate(part.localX/scale,part.localY/scale);
 if(mark){if(mirrored)c.scale(-1,1)}else c.rotate(base);
 c.scale(k,k);c.translate(-art.originX,-art.originY);
 if(part.destroyed){c.drawImage(image,0,0,320,320);c.restore();return}
 const [sx,sy,sw,sh]=art.barrel;
 c.save();c.translate(art.pivotX,art.pivotY);c.rotate(mirrored?-turn:turn);
 c.translate((mark?1:-1)*armorGunRecoil(kind,part.recoil)/k,0);
 c.beginPath();c.rect(sx-art.pivotX,sy-art.pivotY,sw,sh);c.clip();
 c.drawImage(image,-art.pivotX,-art.pivotY,320,320);c.restore();
 c.save();c.beginPath();c.rect(0,0,320,320);c.rect(sx,sy,sw,sh);c.clip('evenodd');
 c.drawImage(image,0,0,320,320);c.restore();c.restore();
}

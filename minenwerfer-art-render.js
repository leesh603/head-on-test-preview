import {MINEN_ART,minenAtlasFrame,minenRecoilFrame} from './minenwerfer-art-layout.js';
export function drawMinenInstallation(c,part,images,{scale=1,destroying=false}={}){
 const dead=destroying||part.destroyed,image=dead?images.damage:images.recoil;
 if(!(image?.naturalWidth||image?.width))return false;
 const w=MINEN_ART.width*scale,h=MINEN_ART.height*scale;
 c.save();c.translate(part.x,part.y);c.imageSmoothingEnabled=true;
 // One complete, connected installation per world anchor in EVERY state.
 c.drawImage(image,...minenAtlasFrame(image,dead?2:minenRecoilFrame(part)),-w/2,-h/2,w,h);
 if(!dead&&part.hp<=part.maxHp*.5&&(images.damage?.naturalWidth||images.damage?.width)){
  // Authored damaged perimeter overlays retain the moving three-tube frame.
  c.save();c.beginPath();c.rect(-290*scale,-170*scale,580*scale,80*scale);c.rect(-290*scale,105*scale,580*scale,100*scale);c.clip();
  c.drawImage(images.damage,...minenAtlasFrame(images.damage,0),-w/2,-h/2,w,h);c.restore();
 }
 c.restore();return true;
}

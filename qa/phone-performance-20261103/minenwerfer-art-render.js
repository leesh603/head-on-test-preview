import {MINEN_ART,MINEN_TUBES,minenAtlasFrame,minenRecoilOffset} from './minenwerfer-art-layout.js';
export function drawMinenInstallation(c,part,images,{scale=1,destroying=false}={}){
 const dead=destroying||part.destroyed;
 const authored=!!((images.states?.naturalWidth||images.states?.width)&&(images.barrels?.naturalWidth||images.barrels?.width));
 const state=destroying?3:part.destroyed?2:part.hp<=part.maxHp*.5?1:0;
 const image=authored?images.states:dead?images.damage:images.base;
 if(!(image?.naturalWidth||image?.width))return false;
 const w=MINEN_ART.width*scale,h=MINEN_ART.height*scale;
 c.save();c.translate(part.x,part.y);c.imageSmoothingEnabled=true;
 // One complete, connected installation per world anchor in EVERY state.
 const frame=authored?minenAtlasFrame(image,state):[0,0,image.naturalWidth||image.width,image.naturalHeight||image.height];
 if(authored)c.drawImage(image,...frame,-w/2,-h/2,w,h);
 else if(dead)c.drawImage(image,...minenAtlasFrame(image,2),-w/2,-h/2,w,h);
 else c.drawImage(image,-w/2,-h/2,w,h);
 if(!authored&&!dead&&part.hp<=part.maxHp*.5&&(images.damage?.naturalWidth||images.damage?.width)){
  // Damage stays fixed to the perimeter, behind the separated moving tubes.
  c.save();c.beginPath();c.rect(-290*scale,-170*scale,580*scale,80*scale);c.rect(-290*scale,105*scale,580*scale,100*scale);c.clip();
  c.drawImage(images.damage,...minenAtlasFrame(images.damage,0),-w/2,-h/2,w,h);c.restore();
 }
 const barrels=images.barrels;
 if(!dead&&(barrels?.naturalWidth||barrels?.width)){
  const cell=(barrels.naturalWidth||barrels.width)/3,sh=barrels.naturalHeight||barrels.height;
  for(let tube=0;tube<MINEN_TUBES.length;tube++){
   const t=MINEN_TUBES[tube],y=t.barrelY+minenRecoilOffset(part,tube);
   // Hold the atlas collar at its authored rest pose. Only the tube above
   // it can travel, sliding behind this fixed receiver (as on the rail gun).
   const collar=tube===1?31:20,top=t.barrelY-55;
   c.save();c.beginPath();c.rect((t.x-55)*scale,(top-1)*scale,110*scale,(collar-top+1)*scale);c.clip();
   c.drawImage(barrels,tube*cell,0,cell,sh,(t.x-55)*scale,(y-55)*scale,110*scale,110*scale);c.restore();
   const sy=(collar-top)/110*sh;
   c.drawImage(barrels,tube*cell,sy,cell,sh-sy,(t.x-55)*scale,collar*scale,110*scale,(110-collar+top)*scale);
  }
  // The fixed receiver lips sit IN FRONT of the lower tube. Recoil slides the
  // barrel into the socket instead of dragging its base over the carriage.
  const kx=frame[2]/MINEN_ART.width,ky=frame[3]/MINEN_ART.height;
  for(let tube=0;tube<MINEN_TUBES.length;tube++){
   const t=MINEN_TUBES[tube],ow=tube===1?60:44,oy=tube===1?-10:8,oh=75;
   c.drawImage(image,frame[0]+(t.x-ow/2+MINEN_ART.width/2)*kx,frame[1]+(oy+MINEN_ART.height/2)*ky,ow*kx,oh*ky,(t.x-ow/2)*scale,oy*scale,ow*scale,oh*scale);
  }
 }
 c.restore();return true;
}

// Authored airship art only: loading failures must never expose debug geometry.
export function loadAirshipSprite(faction, ImageType=globalThis.Image){
 const stem=faction==='entente'?'zeppelin-entente':'zeppelin';
 const paths=[`./asset-bank/outlined/native/${stem}-bank.webp?v=bank-airships1`,`./${stem}-bank.webp`,`./${stem}.webp`];
 const image=new ImageType();let next=0;
 image.fetchPriority='high';image.decoding='async';
 image.onerror=()=>{if(next<paths.length)image.src=paths[next++];};
 image.src=paths[next++];return image;
}
export function drawAirshipSprite(c,image,x,y,a,scale=1,damaged=false){
 if(!image?.complete||!(image.naturalWidth>0)||!(image.naturalHeight>0))return false;
 const w=400*scale,h=w*image.naturalHeight/image.naturalWidth;
 c.save();c.translate(Math.round(x),Math.round(y));c.rotate(a+Math.PI);c.imageSmoothingEnabled=false;
 c.globalAlpha*=damaged?.72:1;c.drawImage(image,-w/2,-h/2,w,h);c.restore();return true;
}

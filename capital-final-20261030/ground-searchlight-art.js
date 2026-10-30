// Ground base remains fixed. Only the lamp swivels around its measured mount.
const root='asset-bank/ground-perspective/';
export const SEARCHLIGHT_ART=Object.freeze({central:{file:root+'https://head-on-aces.justzeon.chatgpt.site/central-base-r2.webp',width:256,height:256,mount:[626/1254,451/1254]},entente:{file:root+'https://head-on-aces.justzeon.chatgpt.site/entente-base-r2.webp',width:214,height:256,mount:[.5,464/1371]},head:{file:root+'https://head-on-aces.justzeon.chatgpt.site/shared-lamp-head-r2.webp',width:128,height:117,pivot:[656/1313,958/1198],size:.36}});
const images=new Map();function request(file){if(typeof Image==='undefined')return null;if(images.has(file))return images.get(file);const im=new Image();images.set(file,im);im.decoding='async';im.groundLoad=new Promise(resolve=>{im.onload=()=>resolve(true);im.onerror=()=>resolve(false);});im.src='./'+file;return im;}
export function prepareGroundSearchlights(){return Promise.all(Object.values(SEARCHLIGHT_ART).map(m=>request(m.file)?.groundLoad||Promise.resolve(false)));}
export function searchlightGeometry(e,size){const base=SEARCHLIGHT_ART[e.faction==='entente'?'entente':'central'],head=SEARCHLIGHT_ART.head,k=size/Math.max(base.width,base.height),w=base.width*k,h=base.height*k,hw=size*head.size,hh=hw*head.height/head.width;return{base,head,w,h,hw,hh,mountX:(base.mount[0]-.5)*w,mountY:(base.mount[1]-.5)*h,angle:(e.scanA||0)+Math.PI/2};}
export function drawGroundSearchlight(c,e,x,y,size,state=0,fallbackFaction='central'){
 const pose=searchlightGeometry(e.faction?e:{...e,faction:fallbackFaction},size),base=request(pose.base.file),head=request(pose.head.file);if(!base?.naturalWidth||!head?.naturalWidth)return false;
 c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';if(state===2)c.globalAlpha*=.45;c.drawImage(base,x-pose.w/2,y-pose.h/2,pose.w,pose.h);
 if(state!==2){c.translate(x+pose.mountX,y+pose.mountY);c.rotate(pose.angle);c.drawImage(head,-pose.hw*pose.head.pivot[0],-pose.hh*pose.head.pivot[1],pose.hw,pose.hh);}c.restore();return true;
}

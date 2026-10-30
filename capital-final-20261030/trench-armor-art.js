// Registered to the existing 640px hull and its physical gun/track mounts.
export const ARMOR_ART_SOURCES=Object.freeze({
 a7v:'https://head-on-aces.justzeon.chatgpt.site/boss-a7v-states-20261022.webp',markv:'https://head-on-aces.justzeon.chatgpt.site/boss-markv-states-20261022.webp',
 a7vTreads:'https://head-on-aces.justzeon.chatgpt.site/boss-a7v-tread-source-20261022.webp',markvTreads:'https://head-on-aces.justzeon.chatgpt.site/boss-markv-tread-source-20261022.webp'
});
export const MARKV_TREAD_PROFILE=Object.freeze({pitch:34,sourceY:278,halfWidth:15,
 left:[[12,246],[64,233],[154,224],[280,222],[382,222],[494,227],[570,239],[618,251]],
 right:[[12,406],[64,419],[154,428],[280,430],[382,430],[494,425],[570,413],[618,401]],segments:[[12,618]]});
let images={},pending;
const keyFor=kind=>kind==='mark-v-cruiser'?'markv':'a7v';
export function prepareTrenchArmorArt(){
 if(pending)return pending;
 pending=Promise.all(Object.entries(ARMOR_ART_SOURCES).map(([key,url])=>new Promise(resolve=>{
  const im=new Image();images[key]=im;im.decoding='async';
  im.onload=()=>Promise.resolve(im.decode?.()).catch(()=>{}).then(()=>resolve(im));
  im.onerror=()=>resolve(im);im.src=url;
 })));return pending;
}
export function releaseTrenchArmorArt(){images={};pending=null;}
export function trenchArmorArtReady(kind){const key=keyFor(kind);return !!(images[key]?.naturalWidth&&images[key+'Treads']?.naturalWidth);}
export function trenchArmorTreadSource(kind){return trenchArmorArtReady(kind)?images[keyFor(kind)+'Treads']:null;}
export function trenchArmorHullFrame(b){
 if(b.destroying)return 5;
 const parts=b.parts||[],dead=id=>parts.some(p=>p.id===id&&p.destroyed);
 if(dead('track-left')&&dead('track-right'))return 4;
 if(dead('track-left'))return 1;if(dead('track-right'))return 2;
 return dead('engine-deck')||b.coreVulnerable?3:0;
}
function frame(c,im,n){c.drawImage(im,n%3*768,Math.floor(n/3)*768,768,768,-153.6,-153.6,307.2,307.2);}
export function drawTrenchArmorHull(c,b){
 if(!trenchArmorArtReady(b.assetKey))return false;
 const im=images[keyFor(b.assetKey)],n=trenchArmorHullFrame(b);frame(c,im,n);
 if((n===1||n===2)&&(b.coreVulnerable||b.parts?.some(p=>p.id==='engine-deck'&&p.destroyed))){
  c.save();c.beginPath();c.rect(-31,-61,62,99);c.clip();frame(c,im,3);c.restore();
 }
 return true;
}

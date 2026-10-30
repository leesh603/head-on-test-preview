import {SOMME_FRAMES} from './somme-boss-atlas.js?v=capital-final-20261030';
export const HARBOR_DETAIL_SOURCES=Object.freeze({base:'https://head-on-aces.justzeon.chatgpt.site/boss-harbor-base-20261021.webp',parts:'https://head-on-aces.justzeon.chatgpt.site/boss-harbor-components-20261021.webp',guns:'https://head-on-aces.justzeon.chatgpt.site/boss-schwaben-guns-r2.webp',mg:'https://head-on-aces.justzeon.chatgpt.site/boss-mark1-guns-r3.webp',housing:'https://head-on-aces.justzeon.chatgpt.site/boss-somme-components-20261021.webp'});
const BOXES=[[[97,86,317,340],[75,86,362,340],[90,87,331,337]],[[97,101,318,310],[83,101,346,310],[94,100,324,312]],[[108,81,296,350],[109,81,294,349],[101,68,310,376]],[[89,102,333,308],[80,103,352,306],[88,98,335,315]]];
let images={},pending;
export function harborDetailReady(){return Object.keys(HARBOR_DETAIL_SOURCES).every(k=>images[k]?.naturalWidth>0);}
export function prepareHarborDetailArt(){if(pending)return pending;pending=Promise.all(Object.entries(HARBOR_DETAIL_SOURCES).map(([key,url])=>new Promise(resolve=>{const im=new Image();im.decoding='async';images[key]=im;im.addEventListener('load',()=>Promise.resolve(im.decode?.()).catch(()=>{}).then(()=>resolve(im)),{once:true});im.addEventListener('error',()=>resolve(im),{once:true});im.src=url;})));return pending;}
export function releaseHarborDetailArt(){images={};pending=null;}
export const harborPartState=(p,dead=false)=>dead||p?.destroyed?2:p?.hp<=p?.maxHp*.5?1:0;
export function drawHarborDetailBase(c,b){if(!harborDetailReady())return false;const st=b.destroying?2:b.hp<b.maxHp*.55?1:0;c.drawImage(images.base,st*512,0,512,512,-150,-139,300,300);return true;}
export function drawHarborDetailComponent(c,p,dead=false){
 if(!harborDetailReady())return false;const st=harborPartState(p,dead),x=p.localX,y=p.localY,w=p.drawWidth,h=p.drawHeight;
 if(p.kind==='harbor-mg'){c.drawImage(images.housing,st*256,768,256,256,x-w/2,y-h/2,w,h);return true;}
 const row=p.kind==='crane-pivot'?0:p.kind==='ammo-storage'?1:p.kind==='seaplane-facility'?2:p.kind==='harbor-gun'?3:-1;if(row<0)return false;
 const [bx,by,bw,bh]=BOXES[row][st];c.drawImage(images.parts,st*512,row*512,512,512,x+(-bx-bw/2)*w/bw,y+(-by-bh/2)*h/bh,512*w/bw,512*h/bh);return true;
}
export function drawHarborDetailWeapon(c,p,dead=false){
 if(!harborDetailReady())return false;const mg=p.kind==='harbor-mg',key=mg?'mark1-gun-mg':'gun-twin-aa',st=harborPartState(p,dead),f=SOMME_FRAMES[key+'-'+['normal','damaged','wreck'][st]],k=(mg?22:30)/f.reach;
 c.save();c.translate(p.localX,p.localY);c.rotate(p.angle+Math.PI/2);c.translate(0,st===2?0:(p.recoil||0)*2);c.drawImage(images[mg?'mg':'guns'],...f.rect,-f.pivot[0]*k,-f.pivot[1]*k,f.rect[2]*k,f.rect[3]*k);c.restore();return true;
}

// Painted WWI ordnance for hostile boss rounds (nose right, hostile ink rim
// and crimson under-glow baked in). Frames: [x,y,w,h] in fx-boss-ordnance.webp.
export const BOSS_ORDNANCE_FRAMES=Object.freeze({"ap-small": [0, 0, 132, 63], "he-shell": [134, 0, 132, 63], "he-big": [268, 0, 156, 80], "ap-big": [426, 0, 156, 68], "frag-shell": [584, 0, 132, 81], "iron-bomb": [718, 0, 132, 92], "mortar-small": [852, 0, 156, 75], "mortar-big": [1010, 0, 156, 70], "rifle-grenade": [1168, 0, 156, 44], "pineapple": [1326, 0, 132, 86], "stick-grenade": [1460, 0, 156, 54], "dart": [1618, 0, 156, 54]});
const image=typeof Image==='undefined'?null:new Image();let ready=false;
export const bossOrdnanceReady=new Promise(resolve=>{if(!image){resolve(false);return;}image.decoding='async';image.onload=()=>{ready=true;resolve(true)};image.onerror=()=>resolve(false);image.src=new URL('./fx-boss-ordnance.webp?v=r1',import.meta.url).href;});
export function bossOrdnanceLoaded(){return ready;}
// Draw a round centred on x,y, `length` px long along `angle` (frame aspect kept).
export function drawBossOrdnance(c,name,x,y,length,angle=0,alpha=1){
 const f=BOSS_ORDNANCE_FRAMES[name];if(!ready||!f||!(length>0))return false;
 const k=length/f[2];c.save();c.translate(x,y);if(angle)c.rotate(angle);c.globalAlpha*=alpha;c.imageSmoothingEnabled=true;
 c.drawImage(image,f[0],f[1],f[2],f[3],-f[2]*k*.55,-f[3]*k/2,f[2]*k,f[3]*k);c.restore();return true;
}

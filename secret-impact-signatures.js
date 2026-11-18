// Orthographic artwork matched to the production aircraft and equipment palette.
const frames = {"dartShaft": [4, 4, 380, 87], "steelDispenser": [516, 4, 392, 226], "wingRibs": [1028, 4, 322, 345], "tornPlate": [1540, 4, 350, 240], "earthPlume": [4, 516, 398, 377], "flakFlower": [516, 516, 329, 306], "rotaryCrown": [1028, 516, 294, 147], "gasFold": [1540, 516, 393, 332], "steelLidLeft": [516, 4, 91, 226], "steelTray": [607, 4, 210, 226], "steelLidRight": [817, 4, 91, 226]};
let sheet;
export const secretImpactArtReady = new Promise(resolve => {
 if (typeof Image === 'undefined') { resolve(false); return; }
 const image = new Image();
 image.decoding = 'async';
 image.onload = () => {
  if (image.naturalWidth === 2048 && image.naturalHeight === 1024) sheet = image;
  resolve(Boolean(sheet));
 };
 image.onerror = () => resolve(false);
 image.src = new URL('./secret-topdown-patterns-20261118.webp', import.meta.url).href;
});

export function drawSecretWarArt(c,key,x,y,width,angle,alpha=1) {
 const frame=frames[key];
 if (!sheet || !frame || !(alpha>0 && width>0)) return false;
 const [sx,sy,sw,sh]=frame, height=width*sh/sw;
 c.save();
 c.translate(x,y);
 c.rotate(angle);
 c.globalAlpha*=Math.min(1,alpha);
 c.drawImage(sheet,sx,sy,sw,sh,-width/2,-height/2,width,height);
 c.restore();
 return true;
}

// Use the existing per-event renderer for actual Ranken bodies, fuses, and ram contact.
// The former illustrated fans and oblique fragments duplicated the live projectiles.
export function drawSecretImpactSignature() { return false; }

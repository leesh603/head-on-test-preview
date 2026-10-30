// One generated RGBA texture; no render-time particles, gradients or canvases.
let vortex;
export function prepareSandVortexArt(){
 if(!vortex&&typeof Image!=='undefined'){vortex=new Image();vortex.decoding='async';vortex.src='https://head-on-aces.justzeon.chatgpt.site/fx-maan-sand-vortex.webp?v=capital-final-20261030';}
 return vortex;
}
export function drawSandVortex(c,s,opacity){
 const im=prepareSandVortexArt();if(!im?.naturalWidth)return false;
 const pulse=1+Math.sin(s.age*1.7+s.seed)*.035;
 c.save();c.translate(s.x,s.y);c.scale(1,s.ry/s.rx);c.rotate(s.seed+s.age*.43);
 c.globalAlpha*=opacity*.88;
 const size=s.rx*2.45*pulse;c.drawImage(im,-size/2,-size/2,size,size);c.restore();return true;
}

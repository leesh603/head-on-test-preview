// Equipment-only colour grade of the four top-view smoke paintings.
let image;
export function drawGrunkreuzPlume(c,z,x,y,q,fade){
 if(!image&&typeof Image!=='undefined'){
  image=new Image();image.decoding='async';image.src=new URL('./fx-grunkreuz-plume.webp',import.meta.url).href;
 }
 if(!image?.complete||image.naturalWidth!==1024)return false;
 const age=q*(z.maxLife||3),open=Math.min(1,age/.57),angle=(z.releaseAngle??z.seed??0)+Math.PI;
 const r=z.r,axisX=Math.cos(angle),axisY=Math.sin(angle),roll=(z.seed||0)*.4+q*.62;
 const frame=Math.min(3,Math.floor(q*4)),span=r*(.56+1.08*open+.23*q);
 // A compact roll starts at the physical vent. Later frames expand behind
 // the aircraft, then separate into broken filaments within the hazard.
 const lead=r*(.08+.19*open),side=r*.13*open,ca=c.globalAlpha;
 c.save();c.translate(x+axisX*lead,y+axisY*lead);c.rotate(angle);
 c.globalAlpha=ca*fade*(.89-.33*q);
 c.drawImage(image,frame*256,0,256,256,-span*.53,-span*.36,span,span*.72);
 c.translate(lead*.32,side);c.rotate(roll);
 c.globalAlpha=ca*fade*(.74-.43*q);
 c.drawImage(image,Math.min(frame+1,3)*256,0,256,256,-span*.38,-span*.31,span*.76,span*.62);
 c.restore();return true;
}

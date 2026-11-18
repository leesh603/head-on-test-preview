// Painted pressure, fire and smoke phases. No geometry, RNG or damage radius writes.
const clamp=n=>Math.max(0,Math.min(1,n));
// The contact flipbook supplies the silhouette. These layers describe the
// material pushed away from the impact after the hot core collapses.
const profiles={
 grenade:{mass:.65,hot:.07,smoke:'gunSmoke',drift:.12},
 cooper:{mass:.8,hot:.10,smoke:'dustPuff',drift:.32},
 puw:{mass:1.25,hot:.17,smoke:'dirtMix',drift:.5},
 bomb:{mass:1.03,hot:.14,smoke:'dustPuff',drift:.41},
 rocket:{mass:.86,hot:.11,smoke:'gunSmoke',drift:.56},
 cannon:{mass:.65,hot:.065,smoke:'gunSmoke',drift:.39},
 mine:{mass:.92,hot:.12,smoke:'smokeGray',drift:.22},
 shell:{mass:.88,hot:.085,smoke:'dirtBurst',drift:.46},
 flak:{mass:.83,hot:.09,smoke:'smokeOil',drift:.27},
 incendiary:{mass:.74,hot:.12,smoke:'smokeOil',drift:.14}
};
export function drawDetonationPresence(c,f,x,y,age,weapon,paint,ready){
 const p=profiles[weapon];if(!p||age<0||age>=f.maxLife||f.life<=0)return false;
 const r=Math.min(82,Math.max(24,f.radius||40)),d=r*1.65*p.mass,directed=Number.isFinite(f.direction),a=directed?f.direction:0;
 const tail=clamp((f.maxLife-age)/.16),expansion=1-Math.exp(-age*22);
 const draw=(key,px,py,w,h,angle,alpha)=>{if(alpha>0&&ready(key))paint(c,key,px,py,w,h,angle,alpha*tail)};
 // Sea mines retain their water column and spray rather than a land fireball.
 if(f.fxSource==='mineBlast'||f.kind==='mineBlast'){
  if(age<.08)draw('fireFlash',x,y,d*.35,d*.35,0,(1-age/.08)*.65);
  if(age<.4)draw('splashShell',x,y,d*(.55+expansion*.5),d*(.8+expansion*.7),a,clamp((.4-age)/.15));
  if(age>.1)draw('mist',x,y-d*age*.2,d*(.5+age),d*(.4+age*.6),0,Math.sin(clamp(age/f.maxLife)*Math.PI)*.45);
  return true;
 }
 const directional=directed&&(weapon==='rocket'||weapon==='cannon'||weapon==='shell');
 if(age<p.hot){
  const width=d*(.28+expansion*.58);
  draw('fireFlash',x,y,width,directional?width*.48:width,a,(1-age/p.hot)*.88);
 }
 if(age>.045){
  const u=clamp((age-.045)/Math.max(.1,f.maxLife-.045)),spread=1-Math.exp(-u*3.5);
  const alpha=Math.sin(u*Math.PI)*.46,width=d*(.24+spread*.41);
  const dx=Math.cos(a),dy=Math.sin(a),travel=d*spread*p.drift;
  const smoke=f.presentationContact&&weapon==='shell'?'smokeGray':p.smoke;
  if(directional){
   draw(smoke,x+dx*travel,y+dy*travel,width*1.32,width*.62,a,alpha);
  }else{
   // Derive a stable split axis from the world contact; camera motion has no effect.
   const axis=(f.x||0)*.067+(f.y||0)*.029,ux=Math.cos(axis),uy=Math.sin(axis);
   draw(smoke,x+ux*travel,y+uy*travel,width,width*.87,axis,alpha);
   draw(smoke,x-ux*travel*.74,y-uy*travel*.74,width*.78,width*.69,axis+2.3,alpha*.75);
  }
 }
 return true;
}

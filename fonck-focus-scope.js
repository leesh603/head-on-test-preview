// Fonck optical sight: authored transparent aiming-reticle art, never primitives.
// Render-only: authoritative focus controls the four mechanical sight quadrants.
let scope=null;
export const fonckScopeReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const image=new Image();image.onload=()=>{scope=image;resolve(true)};image.onerror=()=>resolve(false);
 image.src=new URL('./fonck-optical-scope.webp',import.meta.url).href;
});
export function drawFonckFocusScope(c,p,point,t,sizeOf){
 if(p.pilot!=='fonck')return false;
 const e=p.pilotIdentity?.target,f=Math.max(0,Math.min(1,p.pilotIdentity?.focus||0));
 if(!e||!(e.hp>0)||e.crashed||e.expired||e.rivalEscaped||f<=0)return false;
 if(!scope)return true; // No temporary geometry when artwork is unavailable.
 const [x,y]=point(e.x,e.y),ready=f>=.8,settle=Math.min(1,f/.8);
 const diameter=Math.max(60,Math.min(128,sizeOf(e)*3));
 const separation=(1-settle)*7,half=diameter/2;
 // Four bitmap quadrants slide inward along the etched sight axes. At 80%
 // their crosshair becomes one aligned reticle; fire does not consume it.
 c.save();c.globalAlpha*=ready?.85:.30+.40*settle;
 for(let row=0;row<2;row++)for(let col=0;col<2;col++){
  const dx=x+(col?separation:-half-separation),dy=y+(row?separation:-half-separation);
  c.drawImage(scope,col*627,row*627,627,627,dx,dy,half,half);
 }
 c.restore();return true;
}

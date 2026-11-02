// Painted pressure, fire and smoke phases. No geometry, RNG or damage radius writes.
const clamp=n=>Math.max(0,Math.min(1,n));
const profiles={grenade:[.75,.16,.7],cooper:[.9,.22,.9],puw:[1.3,.32,1.2],bomb:[1.1,.27,1.05],rocket:[.92,.23,.85],cannon:[.72,.18,.72],mine:[1.05,.24,.9],shell:[.95,.22,.9],flak:[.9,.18,.8],incendiary:[.7,.30,.8]};
export function drawDetonationPresence(c,f,x,y,age,weapon,paint,ready){
 const p=profiles[weapon];if(!p||age<0||age>=f.maxLife||f.life<=0)return false;
 const [mass,fireTime,smoke]=p,r=Math.min(82,Math.max(24,f.radius||40)),d=r*1.65*mass,a=Number.isFinite(f.direction)?f.direction:0;
 const tail=clamp((f.maxLife-age)/.16),expansion=1-Math.exp(-age*22);
 const draw=(key,px,py,w,h,angle,alpha)=>{if(alpha>0&&ready(key))paint(c,key,px,py,w,h,angle,alpha*tail)};
 // Sea mines retain their water column and spray rather than a land fireball.
 if(f.fxSource==='mineBlast'||f.kind==='mineBlast'){
  if(age<.08)draw('fireFlash',x,y,d*.35,d*.35,0,(1-age/.08)*.65);
  if(age<.4)draw('splashShell',x,y,d*(.55+expansion*.5),d*(.8+expansion*.7),a,clamp((.4-age)/.15));
  if(age>.1)draw('mist',x,y-d*age*.2,d*(.5+age),d*(.4+age*.6),0,Math.sin(clamp(age/f.maxLife)*Math.PI)*.45);
  return true;
 }
 // A single bright pressure front disappears before the darker fireball peaks.
 if(age<.065)draw('fireFlash',x,y,d*(.5+expansion*.7),d*(.5+expansion*.7),a,(1-age/.065)*.95);
 if(age<fireTime){const size=d*(.46+expansion*.6);draw('bossBlast'+Math.min(3,Math.floor(age/fireTime*4)),x,y,size,size,a,clamp((fireTime-age)/.09)*.88);}
 // Smoke follows the blast instead of sitting on it at full opacity from frame one.
 if(age>.09){const u=clamp((age-.09)/Math.max(.1,f.maxLife-.09)),spread=1-Math.exp(-u*3),alpha=Math.sin(u*Math.PI)*.42;
  for(let i=0;i<2;i++)draw('smokeOil',x+(i?1:-1)*d*spread*.21,y-d*u*.18,d*(.32+spread*.5)*smoke,d*(.35+spread*.55)*smoke,a+(i?.3:-.25),alpha);
 }
 return true;
}

// Bishop's real bomb detonation only. This tags/draws the already-created FX;
// it never creates a projectile, blast, target, timer or damage event.
export function tagBishopBombImpact(p,b,f){
 if(p?.pilot!=='bishop'||!b?.bishopBomb||b.enemy||(b.ownerId??'p1')!==(p.id??'p1')||!f)return false;
 if(![b.sx,b.sy,b.x,b.y].every(Number.isFinite))return false;
 f.bishopBombFxOwner=p.id??'p1';
 f.bishopBombFxBearing=Math.atan2(b.y-b.sy,b.x-b.sx);
 return true;
}
export function drawBishopBombImpact(c,f,x,y,age,paint,ready){
 if(!f?.bishopBombFxOwner||f.fxHidden||f.killExplosion||f.fxProfile||f.fxSource!=='bomb'||!(f.life>0)||!(f.maxLife>0)||!(age>=0&&age<.36)||!Number.isFinite(f.bishopBombFxBearing))return false;
 // Keep the original blast artwork, radius and lifetime. No dirt plume: these
 // bombs may hit aircraft as well as the ground. Painted steel flecks emerge
 // from the real impact and travel only within the existing blast footprint.
 if(!ready('armorSpark')||!ready('metalShard0'))return false;
 const a=f.bishopBombFxBearing,fade=Math.min(1,f.life/.08),r=Math.min(86,Math.max(24,f.radius||40));
 if(age<.105)paint(c,'armorSpark',x,y,48,29,a,(1-age/.105)*.96*fade);
 if(age>.025)for(let i=0;i<4;i++){
  const angle=a+(i-1.5)*.82,travel=Math.min(r,21+(age-.025)*(210+i*25)),size=9+(i%2)*2;
  const key='metalShard'+(i%2);if(!ready(key))continue;
  if(age<.23&&ready('tracerCore'))paint(c,'tracerCore',x+Math.cos(angle)*travel,y+Math.sin(angle)*travel,17,2.1,angle,(1-age/.23)*.88*fade);
  paint(c,key,x+Math.cos(angle)*travel,y+Math.sin(angle)*travel,size,size*.48,angle+age*(i%2?5:-5),(1-age/.36)*.94*fade);
 }
 return true;
}

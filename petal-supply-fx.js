// Material animation only. The engine owns every petal, drop and accepted heal.
const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{const q=clamp(n);return q*q*(3-2*q);};
const art=new Map();
export const materialArtReady=Promise.all(['petal-0','petal-1','petal-2','petal-3','petal-4','petal-5','supply-0','mccudden-repair-kit-256'].map(key=>new Promise(resolve=>{
 if(typeof Image==='undefined'){resolve(false);return;}
 const im=new Image();art.set(key,im);im.onload=()=>resolve(true);im.onerror=()=>resolve(false);im.src=new URL('./pilot-material-art/'+key+'.webp',import.meta.url).href;
})));
function sprite(c,key,x,y,size,a=0,alpha=1,anchor=[.5,.5],fold=1){
 const im=art.get(key);if(!im?.complete||!im.naturalWidth||!(alpha>0))return false;
 const k=size/Math.max(im.naturalWidth,im.naturalHeight),w=im.naturalWidth*k,h=im.naturalHeight*k;
 c.save();c.translate(x,y);c.rotate(a);c.scale(1,fold);c.globalAlpha*=alpha;c.drawImage(im,-w*anchor[0],-h*anchor[1],w,h);c.restore();return true;
}
export function petalMaterialPose(p,owner){
 const age=Math.max(0,(p.maxLife||1)-p.life),seed=p.angle||0;
 let dx=0,dy=0,angle=seed+age*(p.spin||0),fold=.48+.52*Math.abs(Math.cos(age*5+seed));
 let size=(p.size||4)*2.8,alpha=clamp(p.life/.22);
 if(owner?.pilot==='wolff'&&owner.skillTime>0&&owner.aceSkillPhase==='climb'&&!p.divePetal){
  const q=clamp(((owner.wolffSkillDuration||2.8)-owner.skillTime)/.75),rx=p.x-owner.x,ry=p.y-owner.y;
  // Let the nearby loose petals settle back before the climb phase ends.
  const curl=Math.sin(q*Math.PI)*clamp((104-Math.hypot(rx,ry))/55),turn=curl*1.1;
  dx=rx*Math.cos(turn)-ry*Math.sin(turn)-rx;dy=rx*Math.sin(turn)+ry*Math.cos(turn)-ry-curl*9;angle+=turn;
 }
 if(p.divePetal){
  const a=p.diveHeading??owner?.aceHeading129??seed,ca=Math.cos(a),sa=Math.sin(a);
  const i=p.diveIndex??Math.abs(Math.round(seed-a)),side=i%2?-1:1;
  let sweep=0;
  if(owner?.pilot==='wolff'&&owner.aceSkillPhase==='dive'){
   const rx=owner.x-p.x,ry=owner.y-p.y,along=rx*ca+ry*sa,across=-rx*sa+ry*ca;
   // The dive opens each petal only as the real aircraft reaches that part of the lane.
   if(Number.isFinite(along)&&Number.isFinite(across))sweep=smooth((along+44)/102)*smooth((64+52*smooth(along/90)-Math.abs(across))/46);
  }
  const back=sweep*(11+age*21),spread=side*(4+sweep*(14+age*25))+Math.sin(age*7+i*.85)*(2+sweep*3);
  dx=-ca*back-sa*spread;dy=-sa*back+ca*spread;
  angle+=side*sweep*(1.25+age*1.1);
  fold=.48+.52*Math.abs(Math.cos(seed+age*(5+sweep*4)));
  size=(p.size||4)*(2.55+sweep*.82);
  alpha*=smooth((age-i*.018)/.13)*(.47+.47*sweep);
 }
 return {dx,dy,angle,fold,index:Math.abs(Math.floor(seed*7))%6,size,alpha};
}
export function drawMaterialPetal(c,p,x,y,owner){
 if(!(p.life>0))return false;
 const q=petalMaterialPose(p,owner);return sprite(c,'petal-'+q.index,x+q.dx,y+q.dy,q.size,q.angle,q.alpha,[.5,.5],q.fold);
}
export function supplyMaterialPose(d){
 const fall=clamp((d.fallTime||0)/.65),q=1-fall;
 // A compact repair parcel separates from the aircraft; its centre stays on
 // the engine's actual pickup. No canopy opens over the flying aircraft.
 const turn=Math.sin(q*Math.PI*1.6)*fall;
 return {fall,q,lift:fall*24,size:30+fall*10,angle:(d.dropHeading||0)*.12+turn*.42,fold:1-Math.sin(q*Math.PI)**2*fall*.27,alpha:clamp((d.life??25)/1.2)};
}
export function drawMaterialSupply(c,d,x,y){
 if(d.dead)return false;
 const pose=supplyMaterialPose(d);
 sprite(c,'supply-0',x+3,y+4,pose.size*.9,pose.angle,.16*pose.alpha,[.5,.5],.8);
 return sprite(c,'supply-0',x,y-pose.lift,pose.size,pose.angle,pose.alpha,[.5,.5],pose.fold);
}
export function drawRepairRecovery(c,p,x,y){
 if(!(p.hp>0&&p.mccuddenRepairFlash>0))return false;
 const q=clamp(1-p.mccuddenRepairFlash/.4),a=p.a||0,side=30-q*9,back=14+q*7;
 return sprite(c,'mccudden-repair-kit-256',x-Math.cos(a)*back-Math.sin(a)*side,y-Math.sin(a)*back+Math.cos(a)*side,26*(1-q*.45),a*.12,(1-q)**.7,[.5,.5],1-q*.35)||sprite(c,'supply-0',x-Math.cos(a)*back-Math.sin(a)*side,y-Math.sin(a)*back+Math.cos(a)*side,28*(1-q*.45),a*.12,(1-q)**.7);
}

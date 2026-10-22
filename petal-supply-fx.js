// Material animation only. The engine owns every petal, drop and accepted heal.
const clamp=n=>Math.max(0,Math.min(1,n));
const art=new Map();
export const materialArtReady=Promise.all(['petal-0','petal-1','petal-2','petal-3','petal-4','petal-5','supply-0','supply-1','supply-2','supply-3'].map(key=>new Promise(resolve=>{
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
 if(owner?.pilot==='wolff'&&owner.skillTime>0&&owner.aceSkillPhase==='climb'&&!p.divePetal){
  const q=clamp(((owner.wolffSkillDuration||2.8)-owner.skillTime)/.75),turn=q*1.6,rx=p.x-owner.x,ry=p.y-owner.y;
  dx=rx*Math.cos(turn)-ry*Math.sin(turn)-rx;dy=rx*Math.sin(turn)+ry*Math.cos(turn)-ry-q*18;angle+=turn;
 }
 if(p.divePetal){
  const a=owner?.aceHeading129??seed,side=Math.sin(seed*2.17)*(16+age*54),forward=age*42;
  dx+=Math.cos(a)*forward-Math.sin(a)*side;dy+=Math.sin(a)*forward+Math.cos(a)*side;angle+=age*2;
 }
 return {dx,dy,angle,fold,index:Math.abs(Math.floor(seed*7))%6,size:(p.size||4)*2.8,alpha:clamp(p.life/.22)};
}
export function drawMaterialPetal(c,p,x,y,owner){
 if(!(p.life>0))return false;
 const q=petalMaterialPose(p,owner);return sprite(c,'petal-'+q.index,x+q.dx,y+q.dy,q.size,q.angle,q.alpha,[.5,.5],q.fold);
}
export function supplyMaterialPose(d){
 const fall=clamp((d.fallTime||0)/.65),q=1-fall,landAge=Math.max(0,25-(d.life??25)-.65);
 // Cross-fade authored cloth poses, keeping the actual package pickup at x/y.
 if(fall>0){const opening=clamp(q/.22),deploy=clamp((q-.22)/.26);return {fall,q,landAge,weights:[1-opening,opening*(1-deploy),deploy,0]};}
 const collapse=clamp(landAge/.22);return {fall,q,landAge,weights:[0,0,1-collapse,collapse]};
}
const anchors=[[.5,.5],[.5,.77],[.5,.86],[.5,.58]],sizes=[34,48,64,53];
export function drawMaterialSupply(c,d,x,y){
 if(d.dead)return false;
 const pose=supplyMaterialPose(d),a=(d.dropHeading||0)*.12,shift=pose.fall*14;
 let drawn=false;
 for(let i=0;i<4;i++)if(pose.weights[i]>0){
  // The shadow is the painted fabric silhouette, never an extra loot ring.
  sprite(c,'supply-'+i,x+7+shift*.35,y+9,sizes[i]*.88,a,.13*pose.weights[i],anchors[i],.75);
  drawn=sprite(c,'supply-'+i,x+Math.sin(pose.q*Math.PI*2)*pose.fall*3,y-shift,sizes[i]*(1+pose.fall*.08),a,pose.weights[i],anchors[i])||drawn;
 }
 return drawn;
}
export function drawRepairRecovery(c,p,x,y){
 if(!(p.hp>0&&p.mccuddenRepairFlash>0))return false;
 const q=clamp(1-p.mccuddenRepairFlash/.4),a=p.a||0;
 return sprite(c,'supply-3',x-Math.cos(a)*18-Math.sin(a)*24,y-Math.sin(a)*18+Math.cos(a)*24,42*(1-q*.45),a*.12,(1-q)**.7,[.5,.58],1-q*.45);
}

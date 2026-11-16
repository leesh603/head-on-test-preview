import {drawAADefense,drawDrachenMine} from './aa-defense-art.js?v=d7a0cfcfc455802b';

let mineShadow;
function bakedMineShadow(){
 if(mineShadow)return mineShadow;
 const bitmap=document.createElement('canvas');bitmap.width=40;bitmap.height=40;
 const ink=bitmap.getContext('2d');
 if(!drawAADefense(ink,'drachenMine',20,20,31,31))return null;
 ink.globalCompositeOperation='source-in';
 ink.fillStyle='#262319';
 ink.fillRect(0,0,40,40);
 const soft=document.createElement('canvas');soft.width=40;soft.height=40;
 const shade=soft.getContext('2d');
 shade.filter='blur(1.6px)';
 shade.drawImage(bitmap,0,0);
 return mineShadow=soft;
}

export function isMeadowMinefield(field){
 return !field.encounterId;
}

// Restore the authored mine silhouette. The amber marks use the existing trigger distance.
export function drawMeadowMinefield(c,field,point,visible,triggerRadius){
 const [x,y]=point(field.x,field.y),arming=field.warning>0;
 const radius=field.radius;
 c.save();
 c.imageSmoothingEnabled=true;
 if(visible(x,y,radius+8)){
  c.beginPath();
  c.arc(x,y,radius,0,Math.PI*2);
  c.setLineDash([14,11]);
  c.lineWidth=2.4;
  c.strokeStyle='#251f1596';
  c.stroke();
  c.lineWidth=1.1;
  c.strokeStyle=arming?'#ffd592':'#f7c29491';
  c.stroke();
 }
 c.setLineDash([]);
 const halfArc=.24;
 for(const mine of field.mines){
  if(mine.dead)continue;
  const [mx,my]=point(mine.x,mine.y),range=mine.triggerRadius||triggerRadius;
  if(!visible(mx,my,Math.max(range,18)))continue;
  const shadow=bakedMineShadow();
  if(shadow){
   const alpha=c.globalAlpha;
   c.globalAlpha=alpha*.37;
   c.drawImage(shadow,mx-13,my-9,44,37);
   c.globalAlpha=alpha;
  }
  drawDrachenMine(c,mx,my,52,52);
  c.beginPath();
  for(let side=0;side<4;side++){
   const angle=side*Math.PI/2,start=angle-halfArc;
   c.moveTo(mx+Math.cos(start)*range,my+Math.sin(start)*range);
   c.arc(mx,my,range,start,angle+halfArc);
  }
  c.lineWidth=2.5;
  c.strokeStyle='#302217af';
  c.stroke();
  c.lineWidth=1.2;
  c.strokeStyle='#ebb279';
  c.stroke();
 }
 c.restore();
}

export function drawMeadowGunFlash(c,fx,x,y,angle,remaining){
 const dx=Math.cos(angle),dy=Math.sin(angle),heat=Math.min(1,remaining/.055);
 const shown=fx(c,'muzzle',x+dx*7,y+dy*7,22,13,angle,.43+.57*heat);
 if(shown&&heat<.58){
  const trail=6+(1-heat)*9;
  fx(c,'gunSmoke',x-dx*trail,y-dy*trail,23,10,angle,.22*(1-heat));
 }
 return shown;
}

export function drawMeadowGroundImpact(c,fx,blast,x,y){
 if(blast.fxHidden||blast.fxOnly||blast.fxSource||blast.mortarOverlay||!(blast.life>0&&blast.maxLife>0))return;
 const facility=blast.kind==='structure'&&blast.side==='friendly'&&blast.fxProfile==='armorBreak';
 if(!facility&&blast.kind!=='mine'&&(blast.kind!=='bomb'||blast.fxProfile==='groundShell'))return;
 const progress=1-blast.life/blast.maxLife;
 const size=Math.min(facility?111:84,Math.max(28,blast.radius*1.13));
 const angle=(blast.x+blast.y)*.012;
 const spreading=.62+progress*.76;
 // Low soil rolls outward while the original localized fireball remains above it.
 fx(c,'dustPuff',x+size*progress*.2,y+size*.12,size*spreading,size*spreading*.55,angle,.74*(1-progress));
 if(progress<.58){
  const travel=size*(.19+progress*.76),fade=1-progress/.58;
  fx(c,'debrisShard',x+Math.cos(angle)*travel,y+Math.sin(angle)*travel,size*.19,size*.14,angle+progress*5,fade*.8);
  if(progress>.1)fx(c,'rockChunk0',x-Math.cos(angle)*travel*.66,y-Math.sin(angle)*travel*.66,size*.16,size*.12,angle-progress*3,fade*.69);
 }
}

export function drawMeadowAirSmoke(c,fx,blast,x,y){
 if(blast.fxProfile!=='aircraft'||blast.fxOnly||blast.fxHidden||blast.fxSource||!(blast.life>0&&blast.maxLife>0))return;
 const progress=1-blast.life/blast.maxLife;
 if(progress<.19)return;
 const size=Math.min(69,Math.max(20,blast.radius*.72));
 const angle=Number.isFinite(blast.direction)?blast.direction:0;
 const drift=size*(.3+progress*.85);
 fx(c,'smokeOil',x+Math.cos(angle)*drift,y+Math.sin(angle)*drift,size*(1+progress*.65),size*.58,angle,.44*(1-progress));
}

const contactSprites=new WeakMap();
export function drawMeadowContactShadow(c,image,x,y,w,h){
 let shadow=contactSprites.get(image);
 if(!shadow){
  shadow=document.createElement('canvas');
  shadow.width=104;shadow.height=Math.round(image.naturalHeight*96/image.naturalWidth)+8;
  const ink=shadow.getContext('2d');
  ink.filter='blur(1px)';ink.drawImage(image,4,4,96,shadow.height-8);ink.filter='none';
  ink.globalCompositeOperation='source-in';ink.fillStyle='#272015a0';ink.fillRect(0,0,shadow.width,shadow.height);
  contactSprites.set(image,shadow);
 }
 const pad=w/24;
 c.drawImage(shadow,x-w/2-pad+Math.min(4,w*.047),y-h/2-pad+Math.min(6,w*.068),w+pad*2,h+pad*2);
}

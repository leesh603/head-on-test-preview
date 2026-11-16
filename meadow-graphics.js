let mineArt;

export function prepareMeadowGraphics(){
 if(mineArt||typeof Image==='undefined')return;
 mineArt=new Image();
 mineArt.decoding='async';
 mineArt.src='./meadow-mine.webp?v=1';
}

export function meadowMinefieldReady(field){
 return !field.encounterId&&!!mineArt?.naturalWidth;
}

export function drawMeadowMinefield(c,field,point,visible,triggerRadius){
 const [x,y]=point(field.x,field.y),arming=field.warning>0;
 const radius=field.radius;
 c.save();
 c.imageSmoothingEnabled=true;
 if(visible(x,y,radius+8)){
  c.beginPath();
  c.arc(x,y,radius,0,Math.PI*2);
  c.setLineDash([12,8]);
  c.lineWidth=2.6;
  c.strokeStyle=arming?'#231c15b8':'#251f156b';
  c.stroke();
  c.lineWidth=1.15;
  c.strokeStyle=arming?'#ffd592':'#f7c29491';
  c.stroke();
 }
 c.setLineDash([5,7]);
 for(const mine of field.mines){
  if(mine.dead)continue;
  const [mx,my]=point(mine.x,mine.y),range=mine.triggerRadius||triggerRadius;
  if(!visible(mx,my,Math.max(range,28)))continue;
  c.drawImage(mineArt,mx-26,my-26,52,52);
  if(arming)continue;
  c.beginPath();
  c.arc(mx,my,range,0,Math.PI*2);
  c.lineWidth=2.8;
  c.strokeStyle='#352016b8';
  c.stroke();
  c.lineWidth=1.4;
  c.strokeStyle='#f0a974';
  c.stroke();
 }
 c.restore();
}

export function drawMeadowGunFlash(c,fx,x,y,angle,remaining){
 const dx=Math.cos(angle),dy=Math.sin(angle),heat=Math.min(1,remaining/.055);
 return fx(c,'muzzle',x+dx*7,y+dy*7,22,13,angle,.52+.48*heat);
}

export function drawMeadowGroundImpact(c,fx,blast,x,y){
 if(blast.fxHidden||blast.fxOnly||blast.fxSource||blast.mortarOverlay)return;
 if(blast.kind!=='mine'&&(blast.kind!=='bomb'||blast.fxProfile==='groundShell'))return;
 const progress=1-blast.life/blast.maxLife;
 const size=Math.min(92,Math.max(30,blast.radius*1.1));
 const angle=blast.x*.017+blast.y*.011;
 // Use the painted soil and debris behind the existing source-specific flash.
 const drift=size*progress*.34;
 fx(c,'dustPuff',x-drift,y+drift*.6,size*(.75+progress*.55),size*(.4+progress*.32),angle,.68*(1-progress));
 if(progress<.64){
  const throwDistance=size*(.12+progress*.7);
  fx(c,'debrisShard',x+Math.cos(angle)*throwDistance,y+Math.sin(angle)*throwDistance,size*.22,size*.18,angle+progress*4,(1-progress/.64)*.75);
 }
}

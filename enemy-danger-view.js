import {aimLine} from './tactical-marks.js?v=09c75d146ae4289d';
import {fxImage,fxTint} from './fx-art.js?v=09c75d146ae4289d';
const SIGNAL_COLORS={attack:'#ef957d',regroup:'#a9d18d',defend:'#f2ead1'},signalSprites=new Map();
function paintSignal(ctx,key,color,x,y,w,h,a,alpha){
 const im=fxImage(key);if(!im||typeof document==='undefined')return fxTint(ctx,key,color,x,y,w,h,a,alpha);
 const id=key+color;let sprite=signalSprites.get(id);
 if(!sprite){
  const width=im.naturalWidth||im.width,height=im.naturalHeight||im.height,scale=Math.min(1,192/Math.max(width,height));
  sprite=document.createElement('canvas');sprite.width=Math.max(1,Math.round(width*scale));sprite.height=Math.max(1,Math.round(height*scale));
  const c=sprite.getContext('2d');if(!c)return false;
  c.drawImage(im,0,0,sprite.width,sprite.height);c.globalCompositeOperation='source-in';c.fillStyle=color;c.fillRect(0,0,sprite.width,sprite.height);
  // Keep the painted alpha texture. Multiplying an orange flame made green
  // and white orders look orange too. At most nine small cells are cached.
  signalSprites.set(id,sprite);
 }
 ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.globalAlpha*=alpha;
 const scale=Math.min(w/sprite.width,h/sprite.height);ctx.drawImage(sprite,-sprite.width*scale/2,-sprite.height*scale/2,sprite.width*scale,sprite.height*scale);ctx.restore();return true;
}
export function drawFormationSignals(ctx,e,point,now,paint=paintSignal){
 if(!(e.hp>0)||e.crashing||e.expired||e.bossPilot||e.surface||e.stationary)return;
 for(const signal of (e.directorSignals||[]).slice(-2)){
  const age=now-signal.at,color=SIGNAL_COLORS[signal.order];
  if(!color||age<0||age>=2.6||![signal.x,signal.y,signal.a].every(Number.isFinite))continue;
  const fade=Math.min(1,(2.6-age)/.8),flight=Math.min(1.3,age),a=signal.a-.9;
  // A Very-pistol arc with painted, drifting smoke. The launch point stays
  // in world space as the aircraft/camera moves; no HUD marker follows it.
  const position=t=>[signal.x+Math.cos(a)*52*(1-Math.exp(-t*2.4))+(age-t)*5,signal.y+Math.sin(a)*52*(1-Math.exp(-t*2.4))-Math.sin(t/1.3*Math.PI/2)*23-(age-t)*7];
  for(let i=6;i>=0;i--){
   const t=flight-i*.14;if(t<0)continue;
   const [x,y]=point(...position(t)),size=8+(age-t)*11;
   paint(ctx,'smokeWisp',color,x,y,size*1.5,size,a,.66*fade*(1-i/10));
  }
  if(age<1.3){const [x,y]=point(...position(age)),burn=Math.min(1,(1.3-age)/.22);
   paint(ctx,'fireSmall',color,x,y,17,20,a,.94*burn);
   paint(ctx,'spark','#fff0cd',x,y,9,12,a,.78*burn);
  }
 }
}
// Threat cues are tied to an actual attack or formation role, using authored FX.
export function drawEnemyDanger(ctx,e,x,y,time,fx,now,point){
 if(e.hp<=0||e.bossPilot||e.type==='boss'||e.surface||e.stationary)return;
 if(e.legendWingPreparing&&(e.legendWingUnit!=='jasta2'||(e.legendWingLeader??e.legendWingSlot===0))){ctx.save();ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillStyle='#efb69b';ctx.fillText(e.legendWingUnit==='jasta2'?'편대장 조준 · 격추 시 해체':(e.legendWingLeader??e.legendWingSlot===0)?'56 선도기 사격 준비':'엄호기 차단 준비',x,y-37);ctx.restore();}
 if(e.expansionPreparing){ctx.save();ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillStyle='#efb69b';ctx.fillText(e.expansionWingUnit==='jasta5'?'추격 조준 · 크게 선회':'전령기 사격 준비',x,y-37);ctx.restore();}
 if(e.famousWingPreparing){ctx.save();ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillStyle='#efb69b';ctx.fillText(e.famousWingUnit==='lafayette'?'엄호 준비 · 피격 시 중단':'교차 사격 준비',x,y-37);ctx.restore();}
 if(e.hatRingGroup!=null&&['warning','salvo'].includes(e.hatRingPhase)){ctx.save();ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillStyle=e.hatRingOpen?'#e7dfbe':'#efb69b';ctx.fillText(e.hatRingOpen?'94 · 사격 중지':e.hatRingPhase==='salvo'?'94 · 사격':'94 · 사격 준비',x,y-37);ctx.restore();}
 if(e.cigognesRole==='cannon'){ctx.save();ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillStyle=e.cigognesPhase==='locked'?'#ffc0aa':'#e3dcc9';if(['aim','locked','reload'].includes(e.cigognesPhase))ctx.fillText(e.cigognesPhase==='reload'?'37 mm · 재장전':e.cigognesPhase==='locked'?'37 mm · 조준 고정':'37 mm · 조준',x,y-38);if(e.cigognesFlash>0){const a=e.gunAim??e.a,mx=x+Math.cos(a)*30,my=y+Math.sin(a)*30;fx(ctx,'gunSmoke',mx,my,34,23,a,Math.min(.7,e.cigognesFlash*2));if(e.cigognesFlash>.22)fx(ctx,'muzzleHeavy',mx,my,28,18,a,.95);}ctx.restore();}
 if(point)drawFormationSignals(ctx,e,point,now);
 const commander=e.isFormationCommander&&e.directorSquad&&!e.directorSquad.broken;
 ctx.save();ctx.translate(x,y);
 if(commander){
  // A small gold star floats above the squad leader.
  ctx.fillStyle='#f0c56b';ctx.strokeStyle='#6b4f18';ctx.lineWidth=1.4;ctx.lineJoin='round';
  ctx.beginPath();
  for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?3.2:7.5;const px=Math.cos(a)*r,py=-31+Math.sin(a)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}
  ctx.closePath();ctx.fill();ctx.stroke();
 }
 ctx.rotate(e.a);
 if(e.dangerMarksman&&e.dangerAimUntil>now){
  const progress=1-(e.dangerAimUntil-now)/.38;
  aimLine(ctx,28,0,205,0,{p:Math.max(0,progress),alpha:.5+Math.max(0,progress)*.4,dash:[9,7]});
 }
 if(e.dangerPursuit&&e.pursuitEngaged){
  const pulse=.18+Math.sin(time*13)*.04;
  fx(ctx,'engineSmoke',-27,0,26,10,0,pulse);
  fx(ctx,'smokeWisp',-9,-24,17,7,.15,pulse);fx(ctx,'smokeWisp',-9,24,17,7,-.15,pulse);
 }
 if(e.dangerHeavy&&e.muzzleFlash>0){
  ctx.globalAlpha=Math.min(1,e.muzzleFlash*9);
  fx(ctx,'muzzleHeavy',38,0,42,30,0,.9);
  fx(ctx,'gunSmoke',27,0,22,18,0,.45);
 }
 ctx.restore();
}


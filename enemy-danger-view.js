import {aimLine} from './tactical-marks.js?v=tame3';
// Threat cues are tied to an actual attack or formation role, using authored FX.
export function drawEnemyDanger(ctx,e,x,y,time,fx,now){
 if(e.hp<=0||e.bossPilot||e.type==='boss'||e.surface||e.stationary)return;
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

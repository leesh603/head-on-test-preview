// Threat cues are tied to an actual attack or formation role, using authored FX.
export function drawEnemyDanger(ctx,e,x,y,time,fx,now){
 if(e.hp<=0||e.bossPilot||e.type==='boss'||e.surface||e.stationary)return;
 const commander=e.isFormationCommander&&e.directorSquad&&!e.directorSquad.broken;
 ctx.save();ctx.translate(x,y);
 if(commander){
  // Floating command chevrons above the aircraft mark the squad leader.
  ctx.strokeStyle='#e7d6a9';ctx.lineWidth=2;ctx.lineCap='round';
  for(const dy of [-34,-27]){ctx.beginPath();ctx.moveTo(-6,dy-5);ctx.lineTo(0,dy);ctx.lineTo(6,dy-5);ctx.stroke()}
 }
 ctx.rotate(e.a);
 if(commander){
  // Small linen command chevrons sit on the tail, like painted airframe marks.
  ctx.strokeStyle='#e7d6a9';ctx.lineWidth=1.6;ctx.lineCap='round';
  for(const back of [18,24]){ctx.beginPath();ctx.moveTo(-back-4,-4);ctx.lineTo(-back,0);ctx.lineTo(-back-4,4);ctx.stroke()}
 }
 if(e.dangerMarksman&&e.dangerAimUntil>now){
  const progress=1-(e.dangerAimUntil-now)/.38;
  ctx.globalAlpha=.35+Math.max(0,progress)*.4;ctx.strokeStyle='#dfb17f';ctx.lineWidth=1.3;
  ctx.setLineDash([9,7]);ctx.beginPath();ctx.moveTo(28,0);ctx.lineTo(205,0);ctx.stroke();ctx.setLineDash([]);
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

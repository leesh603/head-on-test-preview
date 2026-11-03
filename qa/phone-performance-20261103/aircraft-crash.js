// Shared original ace crash choreography. Callers supply their own effect host.
// Gotha bodies retain their last heading while the existing defeat timer runs.
// Rendering and the terminal explosion use the same pose, without moving hitboxes.
export function gothaCrashPose(b,age=0,duration=2.65){
 const f=Math.max(0,Math.min(1,age/Math.max(.1,duration))),fall=f*f,a=b.a||0;
 const travel=(2*f-fall)*100,side=(String(b.id||'').charCodeAt(String(b.id||'').length-1)%2?1:-1);
 return{x:b.x+Math.cos(a)*travel,y:b.y+Math.sin(a)*travel+fall*45,
  angle:a+Math.PI/2+side*fall*.65,scale:1-fall*.5,bank:1-fall*.32,
  alpha:Math.max(0,1-Math.max(0,(f-.82)/.18)),wreckMix:Math.min(1,age/.32),progress:f};
}
export function enemyCanCrash(e){return !e.stageBossBody&&!e.surface&&!e.stationary&&!e.fieldUnit&&!e.navalVessel&&!e.heavyBomber&&!e.missionGround&&!e.bugDrone&&!e.groundEscort&&!e.londonInstallation&&!e.cityUnit&&!e.bossMinion&&!e.expired&&(e.bossPilot||['scout','hunter','bomber','boss'].includes(e.type))}
export function chooseEnemyDeathStyle(e,rng){if(!enemyCanCrash(e))return null;if(e.crashStyle)return e.crashStyle;const roll=rng();e.crashStyle=e.type==='bomber'?(roll<.4?'burst':'glide'):e.bossPilot||e.type==='boss'?(roll<.2?'burst':roll<.55?'glide':'spin'):(roll<.3?'burst':roll<.65?'glide':'spin');return e.crashStyle}
export function enemyDeathBurst(e,style){if(style==='glide')return{count:7};if(style==='spin')return{count:14};const heavy=e.navalVessel||e.type==='zeppelin'||e.fieldUnit||e.heavyBomber||e.bossPilot||e.type==='boss';return{count:heavy?36:30,kind:e.navalVessel?'mineBlast':e.fieldUnit?'structure':heavy?'aircraftHeavy':e.type==='bomber'?'aircraftMedium':undefined}}
// Render-only descent: preserve the simulation lifetime, motion and RNG.
export function enemyCrashVisual(e){
 const duration=e.crashDuration||1,progress=Math.min(1,Math.max(0,1-Math.max(0,e.crashT||0)/duration));
 const descent=progress*progress*(3-2*progress),spin=e.crashStyle==='spin';
 const phase=progress*duration*(e.crashSpin||0);
 return{progress,scale:1-(spin?.22:.14)*descent,bank:spin?Math.max(.34,Math.abs(Math.cos(phase))):1-.18*descent,roll:Math.sin(phase)*.08,shadowX:14*(1-descent)+descent,shadowY:22*(1-descent)+2*descent};
}
export function enemyCrashScale(e){return enemyCrashVisual(e).scale}
export function startEnemyCrash(e,rng){const style=chooseEnemyDeathStyle(e,rng);if(!style||style==='burst')return false;const ace=e.bossPilot||e.type==='boss';e.crashing=true;e.crashDuration=style==='spin'?(ace?1.25:1):(ace?.95:.68);e.crashT=e.crashDuration;e.crashDir=e.a+(rng()-.5)*(style==='spin'?.9:.3);e.crashSpeed=Math.max(style==='spin'?100:75,(e.speed||100)*(style==='spin'?.9:.7));e.crashSpin=(rng()<.5?-1:1)*(style==='spin'?2.2+rng()*1.1:.15+rng()*.3);e.crashSmoke=0;e.hitFlash=0;e.hp=0;return true}
export function beginAircraftCrash(e,rng){const ace=e.bossPilot||e.type==='boss';e.crashing=true;e.crashDuration=ace?1.15:.8;e.crashT=e.crashDuration;e.crashDir=e.a+(rng()-.5)*.7;e.crashSpeed=Math.max(90,(e.speed||100)*.85);e.crashSpin=(rng()<.5?-1:1)*(1.2+rng()*1.1);e.crashSmoke=0;e.hp=0;}
export function advanceAircraftCrash(world,e,dt){const spin=e.crashStyle==='spin';e.crashT-=dt;e.a+=e.crashSpin*dt;if(spin)e.crashDir+=e.crashSpin*.27*dt;e.x+=Math.cos(e.crashDir)*e.crashSpeed*dt;e.y+=Math.sin(e.crashDir)*e.crashSpeed*dt;e.crashSpeed=Math.max(25,e.crashSpeed*(1-(spin?.65:.35)*dt));e.crashSmoke-=dt;if(e.crashSmoke<=0){e.crashSmoke=spin?.07:.14;world.smoke(e.x+(world.rng()-.5)*8,e.y+(world.rng()-.5)*8,spin)}if(e.crashT<=0){e.crashed=true;world.burst(e.x,e.y,'#f2aa52',spin?(e.bossPilot||e.type==='boss'?34:30):20,e.bossPilot||e.type==='boss'?(spin?'aircraftMedium':undefined):'aircraft');for(let k=0;k<(spin?5:2);k++)world.smoke(e.x+(world.rng()-.5)*22,e.y+(world.rng()-.5)*22,spin)}}
export function drawAircraftCrash(c,e,x,y,t,fx){
 const sink=enemyCrashScale(e),spin=e.crashStyle==='spin';
 const progress=Math.min(1,Math.max(0,1-(e.crashT||0)/(e.crashDuration||1))),travel=e.crashDir??e.a;
 // The hot origin stays on the engine; the wake follows travel, not the spinning nose.
 const ox=x+Math.cos(e.a)*12*sink,oy=y+Math.sin(e.a)*12*sink;
 fx(c,'smokeTrail',ox-Math.cos(travel)*40*sink,oy-Math.sin(travel)*40*sink,(spin?124:92)*sink,(spin?34:23)*sink,travel,.35+progress*.16);
 if(spin){fx(c,'fireEngine',ox,oy,32*sink,40*sink,e.a+Math.PI/2,.7);fx(c,'engineSmoke',ox-Math.cos(travel)*20,oy-Math.sin(travel)*20,36+progress*20,36+progress*20,travel,.32);}
 // Painted fragments peel away during the opening break only; no new entities or collision.
 if(progress<.55)for(let i=0;i<2;i++){
  const a=travel+(i?1.15:-1.15),d=progress*(60+i*28),fade=1-progress/.55;
  fx(c,'debrisShard',x+Math.cos(a)*d,y+Math.sin(a)*d,12*sink,16*sink,a+progress*(i?5:-4),fade*.8);
 }
}


// Shared original ace crash choreography. Callers supply their own effect host.
export function enemyCanCrash(e){return !e.stageBossBody&&!e.surface&&!e.stationary&&!e.fieldUnit&&!e.navalVessel&&!e.heavyBomber&&!e.missionGround&&!e.bugDrone&&!e.groundEscort&&!e.londonInstallation&&!e.cityUnit&&!e.bossMinion&&!e.expired&&(e.bossPilot||['scout','hunter','bomber','boss'].includes(e.type))}
export function enemyCrashScale(e){const progress=Math.min(1,Math.max(0,1-Math.max(0,e.crashT||0)/(e.crashDuration||1.15)));return 1-.42*progress*progress}
export function beginAircraftCrash(e,rng){e.crashing=true;e.crashDuration=e.bossPilot||e.type==='boss'?1.15:.8;e.crashT=e.crashDuration;e.crashDir=e.a+(rng()-.5)*.7;e.crashSpeed=Math.max(90,(e.speed||100)*.85);e.crashSpin=(rng()<.5?-1:1)*(1.2+rng()*1.1);e.crashSmoke=0;e.hp=0;}
export function advanceAircraftCrash(world,e,dt){e.crashT-=dt;e.a+=e.crashSpin*dt;e.x+=Math.cos(e.crashDir)*e.crashSpeed*dt;e.y+=Math.sin(e.crashDir)*e.crashSpeed*dt;e.crashSpeed=Math.max(30,e.crashSpeed*(1-.7*dt));e.crashSmoke-=dt;if(e.crashSmoke<=0){e.crashSmoke=.09;world.smoke(e.x+(world.rng()-.5)*10,e.y+(world.rng()-.5)*10,true)}if(e.crashT<=0){e.crashed=true;world.burst(e.x,e.y,'#f2aa52',e.bossPilot||e.type==='boss'?30:26,'aircraftMedium');for(let k=0;k<5;k++)world.smoke(e.x+(world.rng()-.5)*26,e.y+(world.rng()-.5)*26,true)}}
export function drawAircraftCrash(c,e,x,y,t,fx){
 const sink=enemyCrashScale(e);
 fx(c,'smokeTrail',x-Math.cos(e.a)*34*sink,y-Math.sin(e.a)*34*sink,90*sink,32*sink,e.a,.4);
 fx(c,'fireEngine',x,y,30*sink,30*sink,e.a+Math.PI/2,.5);
}

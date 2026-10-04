// Shared original ace crash choreography. Callers supply their own effect host.
export function beginAircraftCrash(e,rng){e.crashing=true;e.crashT=1.15;e.crashDir=e.a+Math.PI/2+(rng()-.5)*.9;e.crashSpeed=Math.max(120,e.speed*1.2);e.crashSpin=(rng()<.5?-1:1)*(2.4+rng()*2.2);e.crashSmoke=0;e.hp=0;}
export function advanceAircraftCrash(world,e,dt){e.crashT-=dt;e.a+=e.crashSpin*dt;e.x+=Math.cos(e.crashDir)*e.crashSpeed*dt;e.y+=Math.sin(e.crashDir)*e.crashSpeed*dt;e.crashSpeed=Math.max(30,e.crashSpeed*(1-.7*dt));e.crashSmoke-=dt;if(e.crashSmoke<=0){e.crashSmoke=.045;world.smoke(e.x+(world.rng()-.5)*10,e.y+(world.rng()-.5)*10,true)}if(e.crashT<=0){e.crashed=true;world.burst(e.x,e.y,'#f2aa52',36,'bomb');for(let k=0;k<9;k++)world.smoke(e.x+(world.rng()-.5)*26,e.y+(world.rng()-.5)*26,true);world.event('kill','')}}
export function drawAircraftCrash(c,e,x,y,t,fx){
 fx(c,'smokeTrail',x-Math.cos(e.a)*46,y-Math.sin(e.a)*46,128,44,e.a,.6);
 if(Math.floor(t*9+e.x*.11)%3===0)fx(c,'fireEngine',x,y,38,38,e.a+Math.PI/2,.85);
}

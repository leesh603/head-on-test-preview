import {armorRotate} from './trench-armor-layout.js?v=train1';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const approach=(v,w,step)=>v+clamp(w-v,-step,step);
export function initArmorDrive(b){
 b.leftTrack={speed:0,roll:0};b.rightTrack={speed:0,roll:0};b.angularVelocity=0;b.trackMarks=[];b.markClock=0;b.engineSoundClock=0;b.suspension=0;b.entryAge=0;b.hullYaw=Math.PI;b.syncMounts();
}
// Positive tread velocity advances the nose (local -Y). Unequal velocities
// rotate the actual chassis, with the same pose used by mounts and collision.
export function stepArmorDrive(b,dt,{speed=0,turn=0,brake=false,bounds}={}){
 const s=b.t.geometryScale||1,gauge=b.layout.trackX*2*s,lost=b.trackLoss(),engine=b.parts.get('engine-deck').destroyed;
 const mobility=engine?(b.kind==='a7v-flak'?0:.18):1,turnLimit=(lost===2?0:lost===1?.14:.68)*mobility;
 const omega=clamp(turn,-turnLimit,turnLimit),v=speed*mobility;
 let left=v+omega*gauge/2,right=v-omega*gauge/2;
 if(lost){const limit=gauge*.14*mobility;if(b.parts.get('track-left').destroyed){left=0;right=clamp(right,-limit,limit);}if(b.parts.get('track-right').destroyed){right=0;left=clamp(left,-limit,limit);}}
 const accel=(brake?160:engine?8:34)*dt;
 b.leftTrack.speed=approach(b.leftTrack.speed,left,accel);b.rightTrack.speed=approach(b.rightTrack.speed,right,accel);
 if(b.parts.get('track-left').destroyed||!mobility)b.leftTrack.speed=0;
 if(b.parts.get('track-right').destroyed||!mobility)b.rightTrack.speed=0;
 if(lost){const limit=gauge*.14*mobility;b.leftTrack.speed=clamp(b.leftTrack.speed,-limit,limit);b.rightTrack.speed=clamp(b.rightTrack.speed,-limit,limit);}
 let forward=(b.leftTrack.speed+b.rightTrack.speed)/2,angular=(b.leftTrack.speed-b.rightTrack.speed)/gauge;
 const yaw=b.hullYaw+angular*dt,nx=b.x+Math.sin(yaw)*forward*dt,ny=b.y-Math.cos(yaw)*forward*dt;
 // Brake at a bounded route edge; no camera-relative teleport or sliding.
 if(bounds){const mx=Math.min(38,(bounds.right-bounds.left)*.1),my=Math.min(65,(bounds.bottom-bounds.top)*.1);
  if((nx<bounds.left+mx&&nx<b.x)||(nx>bounds.right-mx&&nx>b.x)||(ny<bounds.top+my&&ny<b.y)||(ny>bounds.bottom-my&&ny>b.y)){b.leftTrack.speed=b.rightTrack.speed=0;forward=angular=0;}
 }
 const oldSuspension=b.suspension;const rocking=Math.sin((b.leftTrack.roll+b.rightTrack.roll)*.23)*Math.min(.65,Math.abs(forward)/45);b.hullYaw+=angular*dt+(forward?(rocking-oldSuspension)*.008:0);b.suspension=rocking;
 b.x+=(b.kickX||0)*dt;b.y+=(b.kickY||0)*dt;b.kickX=(b.kickX||0)*Math.exp(-12*dt);b.kickY=(b.kickY||0)*Math.exp(-12*dt);
 b.x+=Math.sin(b.hullYaw)*forward*dt;b.y-=Math.cos(b.hullYaw)*forward*dt;b.driveVelocity=forward===0?0:-forward;b.angularVelocity=angular;
 b.leftTrack.roll+=b.leftTrack.speed*dt/s;b.rightTrack.roll+=b.rightTrack.speed*dt/s;b.driveDistance+=Math.abs(forward*dt);
 for(let i=b.trackMarks.length-1;i>=0;i--){b.trackMarks[i].age+=dt;if(b.trackMarks[i].age>9)b.trackMarks.splice(i,1);}
 if((Math.abs(b.leftTrack.speed)+Math.abs(b.rightTrack.speed)>5)&&(b.markClock-=dt)<=0){b.markClock=.22;
  for(const [side,tread]of [[-1,b.leftTrack],[1,b.rightTrack]])if(Math.abs(tread.speed)>2){const q=armorRotate(side*b.layout.trackX*s,0,b.hullYaw);if(b.trackMarks.length>=80)b.trackMarks.shift();b.trackMarks.push({x:b.x+q.x,y:b.y+q.y,yaw:b.hullYaw,age:0,width:b.layout.trackWidth*s,length:12*s});}
 }
 if((Math.abs(forward)>2||Math.abs(angular)>.03)&&(b.engineSoundClock-=dt)<=0){b.engineSoundClock=.65;b.command('armor-drive',{speed:Math.abs(forward),turn:Math.abs(angular)});}
 b.syncMounts();
}

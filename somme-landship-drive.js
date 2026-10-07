import {clamp,landshipClearance,syncSommeParts,turn} from './somme-boss-layout.js?v=adr1';

// World-space tracked drive: translation follows the hull, never the camera
// bounds or a steering target. Partners yield before collision, without pushes.
export function driveLandship(b,dt){
 if(!(dt>0)||b.dead)return;
 const tracks=b.tracks(),s=b.sommeScale;
 if(!tracks){b.driveVelocity=0;b.driveMoving=false;b.tacticalState='immobilized';return;}
 b.driveDirection??=1;b.driveDistance??=0;b.driveVelocity??=0;b.trackDistance??=0;
 const peers=[...b.encounter?.bodies.values()||[]].filter(q=>q!==b&&q.sommeBoss);
 const clear=pose=>peers.every(q=>landshipClearance(pose,q)>=.25*s);
 const halt=!!b.salvo||b.drivePause>0;
 b.drivePause=Math.max(0,(b.drivePause||0)-dt);
 const leg=125*s;
 if(b.driveDistance>=leg&&!halt){b.driveDirection*=-1;b.driveDistance=0;b.drivePause=1.15;}
 const heading=Math.PI+(b.slot===1?-.09:b.slot===2?.09:0);
 const yaw=tracks===1?b.hullYaw+(b.parts.get('track-left').destroyed?-.10:.10)*dt*b.driveDirection:turn(b.hullYaw,heading,.16*dt);
 const canTurn=clear({x:b.x,y:b.y,sommeScale:s,hullYaw:yaw});
 const remaining=leg-b.driveDistance;
 const target=(tracks===1?5.5:17)*s*(halt||b.drivePause>0?0:clamp(remaining/(18*s),0,1));
 let speed=b.driveVelocity+clamp(target-b.driveVelocity,-34*s*dt,13*s*dt);
 const a=canTurn?yaw:b.hullYaw,travel=speed*dt,direction=b.driveDirection;
 const pose={sommeScale:s,hullYaw:a,x:b.x+Math.sin(a)*travel*direction,y:b.y-Math.cos(a)*travel*direction};
 const moving=clear(pose);
 if(canTurn)b.hullYaw=a;
 if(moving){b.x=pose.x;b.y=pose.y;b.driveDistance+=travel;b.trackDistance+=travel;}
 else speed=0;
 b.driveVelocity=speed;b.driveMoving=moving&&speed>.05;
 b.tacticalState=!moving?'yield':halt?'halt-fire':b.drivePause>0?'regroup':direction>0?'advance':'reverse';
 // Approach braking stops short of the endpoint; finish the leg at rest.
 if(remaining<.75*s&&speed<.65*s)b.driveDistance=leg;
 syncSommeParts(b);
 if(b.driveMoving&&b.trackDistance>=9*s){
  b.trackDistance=0;b.trackMarks.push({x:b.x,y:b.y,a:b.hullYaw,age:0});
  if(b.trackMarks.length>18)b.trackMarks.shift();
 }
}

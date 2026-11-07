// Alternate the real underwing launches. Counts, fan, payload and equipment
// preparation remain with the existing salvo; no decorative projectiles.
import {signatureState} from './pilot-signature-state.js?v=09c75d146ae4289d';
const pending=new WeakMap();
export const GUYNEMER_BARRAGE=Object.freeze({wingDelay:.08,waveDelay:.36});
export function tickGuynemerBarrage(p,dt,emit,{longRange=p.longRange}={}){
 if(p.pilot!=='guynemer')return;
 if(!(p.hp>0)||p.status==='downed'){pending.delete(p);if(p.pilotSignatureState)delete p.pilotSignatureState.guynemerBarrage;p.salvoWaves=0;return;}
 if(p.state!=='playing'||!(dt>0))return;
 const step=Math.min(.04,dt),s=signatureState(p);let f=s.guynemerBarrage;
 if(f){f.clock+=step;const k=1-Math.exp(-step*9);if(Math.hypot(p.x-f.x,p.y-f.y)>100){f.x=p.x;f.y=p.y;f.a=p.a;}else{f.x+=(p.x-f.x)*k;f.y+=(p.y-f.y)*k;f.a+=Math.atan2(Math.sin(p.a-f.a),Math.cos(p.a-f.a))*k;}}
 const launch=side=>{
  f??=s.guynemerBarrage={clock:0,start:0,last:0,x:p.x,y:p.y,a:p.a,wings:[]};
  f.last=f.clock;f.wings[side<0?0:1]=f.clock;
  const a=p.a;
  for(let k=0;k<3;k++){const j=k+(side<0?0:3),angle=a+(j-2.5)*.16;
   emit({x:p.x+Math.cos(a)*12-Math.sin(a)*side*23,y:p.y+Math.sin(a)*12+Math.cos(a)*side*23,vx:Math.cos(angle)*330,vy:Math.sin(angle)*330,life:longRange?p.shotLifetime(330):3.2,enemy:false,ownerId:p.id,damage:p.payloadPower(32.4),rocket:true,special:true,hit:new Set()},j);
  }
  p.event('rocketSalvo','');p.muzzleFlash=.12;
 };
 let q=pending.get(p);if(q&&(q.state!==s||q.activation!==s.activation)){pending.delete(p);q=null;}
 if(q){q.delay-=step;if(q.delay<=1e-8){pending.delete(p);launch(1);}}
 if(p.salvoWaves>0){p.salvoTimer-=step;if(p.salvoTimer<=0){
  // A new activation reuses the bounded presentation record, never old smoke.
  if(!f||f.clock-f.last>.8){f=s.guynemerBarrage={clock:0,start:0,last:0,x:p.x,y:p.y,a:p.a,wings:[]};}
  p.salvoTimer+=GUYNEMER_BARRAGE.waveDelay;p.salvoWaves--;launch(-1);pending.set(p,{delay:GUYNEMER_BARRAGE.wingDelay,state:s,activation:s.activation});
 }}
 if(f&&f.clock-f.last>.7&&!(p.salvoWaves>0)&&!pending.has(p))delete s.guynemerBarrage;
}

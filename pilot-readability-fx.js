import {drawFonckFocusScope} from './fonck-focus-scope.js';
// Visual-only views of authoritative pilot states. No game mutations or extra shots.
const clamp=n=>Math.max(0,Math.min(1,n));
export function createPilotReadability(fx){
 const switches=new WeakMap();
 return {
  fonck(c,p,point,t,sizeOf){
   return drawFonckFocusScope(c,p,point,t,sizeOf);
  },
  rickenbacker(c,p,point,t,px,py){
   if(p.pilot!=='rickenbacker')return false;
   const s=p.pilotIdentity;if(!s)return false;
   let m=switches.get(p);if(!m){m={target:null,at:-Infinity,clock:t};switches.set(p,m)}
   if(t<m.clock){m.target=null;m.at=-Infinity}m.clock=t;
   const e=s.lastHit;if(e!==m.target){m.target=e;m.at=t}
   if(!e||!(e.hp>0)||!(s.switches>0)||!(s.switchTime>0))return true;
   const q=(t-m.at)/.32;if(q<0||q>1)return true;
   const [x,y]=point(e.x,e.y),a=Math.atan2(p.y-e.y,p.x-e.x),r=Math.min(43,Math.max(22,(e.hitRadius||28)));
   // Three short impact glints at the newly hit target, never a connecting arc.
   // The established active volley ring remains in its existing renderer.
   for(let i=0;i<Math.min(3,s.switches);i++){const b=a+(i-(Math.min(3,s.switches)-1)/2)*.48;
    fx(c,'ricochet',x+Math.cos(b)*(r+q*8),y+Math.sin(b)*(r+q*8),18*(1-q*.4),9,b,(1-q)*.68);
   }return true;
  },
  ball(c,p,point,t,px,py){
   if(p.pilot!=='ball')return false;
   if(p.sortieFlightFx)return true;
   if(!p.pilotIdentity?.alone||p.ballCloak>0)return true;
   const a=p.a||0; c.save();c.translate(px,py);c.rotate(a);
   // A narrow, neutral slipstream follows the airframe. No magic halo and no
   // per-frame radial gradient; nearby allies remove the lone-hunter cue.
   for(let side=-1;side<=1;side+=2)fx(c,'vaporTrail',-28,side*22,34,5,Math.PI,p.ballAmbush>0?.24:.12);
   if(p.ballAmbush>0&&p.muzzleFlash>0&&!(p.reloadTime>0)){
    const aim=(p.gunDirection?.(0)??a)-a;
    fx(c,'muzzleTwin',31,0,40,18,aim,.7);
    for(let side=-1;side<=1;side+=2)fx(c,'mist',-11,side*20,45,14,side*.25,.16);
   }c.restore();return true;
  }
 };
}


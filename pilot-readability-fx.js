// Visual-only views of authoritative pilot states. No game mutations or extra shots.
const clamp=n=>Math.max(0,Math.min(1,n));
export function createPilotReadability(fx){
 const switches=new WeakMap();
 return {
  fonck(c,p,point,t,sizeOf){
   if(p.pilot!=='fonck')return false;
   const e=p.pilotIdentity?.target,f=clamp(p.pilotIdentity?.focus||0);
   if(!e||!(e.hp>0)||f<=0)return false;
   const [x,y]=point(e.x,e.y),r=sizeOf(e)*.85+8+(1-f)*17,len=5+f*4;
   // Open-center, worn brass sight. It converges around the aircraft silhouette,
   // never into a bright star covering the target or a blue laser-like beam.
   c.save();c.globalAlpha*=.38+f*.5;c.lineCap='round';
   for(let pass=0;pass<2;pass++){
    c.lineWidth=pass?1.15:3;c.strokeStyle=pass?(p.skillTime>0?'#e4c281':'#cbbd98'):'#302d26';
    c.beginPath();for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4,ca=Math.cos(a),sa=Math.sin(a),tx=x+ca*r,ty=y+sa*r;c.moveTo(tx-ca*len-sa*len*.5,ty-sa*len+ca*len*.5);c.lineTo(tx,ty);c.lineTo(tx-ca*len+sa*len*.5,ty-sa*len-ca*len*.5)}c.stroke();
   }c.restore();return true;
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

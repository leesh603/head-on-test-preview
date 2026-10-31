// Authored air ribbons show real earned charges; muzzle accents require a real shot.
import {udetPhase,udetStacks,udetRollPose} from './udet-acrobatics.js';
export const UDET_FX_PALETTE=Object.freeze({red:'#d96363',ivory:'#f3e9d2',gold:'#efd18b',smoke:'#b4a5a3'});
const clamp=n=>Math.max(0,Math.min(1,n));
export function drawUdetWake(c,p,tex){const f=p.udetAcrobat;if(!f)return;
 for(const v of f.wake){const q=clamp((f.clock-v.at)/.44),ca=Math.cos(v.a),sa=Math.sin(v.a);
  if(v.phase!=='roll')continue;
  // Recorded wingtip paths cross during the actual barrel roll only.
  const turn=clamp((v.at-(f.active?.at??v.at))/.42)*Math.PI*2,bank=Math.cos(turn),back=17+q*12;
  for(const side of [-1,1]){const span=side*25*bank;
   tex(c,'vaporTrail',v.x-p.x-ca*back-sa*span,v.y-p.y-sa*back+ca*span,40+q*16,6,v.a+side*Math.sin(turn)*.3,.58*(1-q),side<0?UDET_FX_PALETTE.red:UDET_FX_PALETTE.ivory);
  }
 }
}
export function drawUdetLocal(c,p,tex,front=false){const f=p.udetAcrobat;if(!f)return;const phase=udetPhase(p),n=udetStacks(p);
 if(front){
  if(phase==='roll')return;
  if(p.reloadTime>0||p.cow37)return;
  const count=Math.min(8,p.weapon?.guns||1),ca=Math.cos(p.a),sa=Math.sin(p.a);
  for(let gun=0;gun<count;gun++){const shot=f.muzzles[gun],age=shot?f.clock-shot.at:Infinity;if(age<0||age>.055)continue;
   const a=p.gunDirection?.(gun)??p.a,offset=p.weapon?.bidirectional?0:(gun-(count-1)/2)*8,m=p.bomberGunMount(gun,a,offset),dx=m.x-p.x,dy=m.y-p.y,x=dx*ca+dy*sa,y=-dx*sa+dy*ca,heading=a-p.a,power=phase==='counter'?f.active.spent/3:n/3;
   tex(c,'muzzle',x+Math.cos(heading)*10,y+Math.sin(heading)*10,28+power*12,12+power*5,heading,.95*(1-age/.055),power>0?UDET_FX_PALETTE.gold:UDET_FX_PALETTE.ivory);
   if(power>0)tex(c,'gunSmoke',x+Math.cos(heading)*18,y+Math.sin(heading)*18,35,14,heading,.22*(1-age/.055),UDET_FX_PALETTE.smoke);
  }return;
 }
 // Small wing-local airflow reads the stored level, never inventing tokens.
 // Expiry, damage and spending clear it directly through authoritative stacks.
 if(!phase&&n>0){
  const remaining=clamp((f.buffUntil-f.clock)/.35),breath=.92+.08*Math.sin(f.clock*7);
  for(const side of [-1,1])tex(c,'windStreak',-16-n*3,side*24,26+n*10,8+n*6,0,(.13+n*.12)*remaining*breath,UDET_FX_PALETTE.ivory);
 }
 if(phase==='roll'){
  const q=clamp((f.clock-f.active.at)/.42),span=Math.cos(q*Math.PI*2)*25;
  for(const side of [-1,1])tex(c,'mist',-7,side*span,24,7,side*Math.sin(q*Math.PI*2)*.3,.17,UDET_FX_PALETTE.ivory);
 }
}
export function drawUdetCue(c,p,e,tex,front){const q=clamp(e.age/e.maxLife),fade=1-q,a=e.a-p.a;
 if(e.kind==='udetGraze'){
  // Count comes from the accepted near-miss event, not a predicted collision.
  const n=Math.max(0,Math.min(3,e.count||0));
  if(front&&n>0){
   tex(c,'windStreak',-q*14,0,30+n*10+q*12,10+n*8,a,(.48+n*.13)*fade,UDET_FX_PALETTE.ivory);
   tex(c,'vaporTrail',-8-q*22,0,22+n*7,7+n*2,a,.45*fade,UDET_FX_PALETTE.ivory);
  }return true;
 }
 if(e.kind==='udetBrass'){if(front)tex(c,'bulletBrass',-e.age*32,e.side*(6+e.age*62),6,2.6,a+e.age*13,.80*fade,UDET_FX_PALETTE.gold);return true;}
 if(e.kind==='counterRoll'){
  if(front)return false; // Keep the existing short, hand-lettered motto.
  tex(c,'mist',-15-q*12,0,28,12,0,.18*fade,UDET_FX_PALETTE.ivory);return true;
 }
 if(e.kind==='udetCounter'){
  // The real roll has spent these charges; zero spent has no charged burst.
  const n=Math.max(0,Math.min(3,e.count||0));
  // One short split-air release outside the wings, above the aircraft layer.
  // Event life remains untouched; only this visual settles after 0.28 seconds.
  if(front&&n>0&&e.age<.28){const release=clamp(e.age/.28),tail=clamp((.28-e.age)/.12);
   for(const side of [-1,1])tex(c,'windStreak',-12-release*20,side*(32+release*8),32+n*14,14+n*10,side*.06,(.44+n*.18)*tail,UDET_FX_PALETTE.ivory);
  }return true;
 }
 return false;
}
export {udetRollPose};


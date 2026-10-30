// Painted red/ivory ribbons follow the real maneuver; gold marks earned grazes.
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
 if(phase==='roll'){
  const q=clamp((f.clock-f.active.at)/.42),span=Math.cos(q*Math.PI*2)*25;
  for(const side of [-1,1])tex(c,'mist',-7,side*span,24,7,side*Math.sin(q*Math.PI*2)*.3,.17,UDET_FX_PALETTE.ivory);
 }
}
export function drawUdetCue(c,p,e,tex,front){const q=clamp(e.age/e.maxLife),fade=1-q,a=e.a-p.a;
 if(e.kind==='udetGraze'){
  if(front){tex(c,'windStreak',0,0,25+q*12,4,a,.55*fade,UDET_FX_PALETTE.ivory);tex(c,'spark',0,0,12,6,a,.75*fade,UDET_FX_PALETTE.gold);}return true;
 }
 if(e.kind==='udetBrass'){if(front)tex(c,'bulletBrass',-e.age*32,e.side*(6+e.age*62),6,2.6,a+e.age*13,.80*fade,UDET_FX_PALETTE.gold);return true;}
 if(e.kind==='counterRoll'){
  if(front)return false; // Keep the existing short, hand-lettered motto.
  tex(c,'mist',-15-q*12,0,28,12,0,.18*fade,UDET_FX_PALETTE.ivory);return true;
 }
 if(e.kind==='udetCounter'){
  if(!front)tex(c,'gunSmoke',-23-q*12,0,28,11,0,.18*fade,UDET_FX_PALETTE.smoke);return true;
 }
 return false;
}
export {udetRollPose};


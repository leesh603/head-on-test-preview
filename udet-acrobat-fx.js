// Painted red/ivory ribbons follow the real maneuver; gold marks earned grazes.
import {udetPhase,udetStacks,udetRollPose} from './udet-acrobatics.js';
export const UDET_FX_PALETTE=Object.freeze({red:'#d96363',ivory:'#f3e9d2',gold:'#efd18b',smoke:'#b4a5a3'});
const clamp=n=>Math.max(0,Math.min(1,n));
export function drawUdetWake(c,p,tex){const f=p.udetAcrobat;if(!f)return;
 for(const v of f.wake){const q=clamp((f.clock-v.at)/.44),ca=Math.cos(v.a),sa=Math.sin(v.a);
  for(const side of [-1,1]){const roll=v.phase==='roll',back=20+q*18;
   tex(c,'vaporTrail',v.x-p.x-ca*back-sa*side*24,v.y-p.y-sa*back+ca*side*24,roll?58:42,roll?9:5,v.a+side*(roll?.12:0),.52*(1-q),side<0?UDET_FX_PALETTE.red:v.phase==='counter'?UDET_FX_PALETTE.gold:UDET_FX_PALETTE.ivory);
  }
 }
}
export function drawUdetLocal(c,p,tex,front=false){const f=p.udetAcrobat;if(!f)return;const phase=udetPhase(p),n=udetStacks(p),t=f.clock;
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
  const q=clamp((f.clock-f.active.at)/.42),a=q*Math.PI*2;
  for(const side of [-1,1]){const ribbon=a+side*Math.PI/2;tex(c,'windStreak',-16-Math.sin(ribbon)*10,Math.cos(ribbon)*27,76,9,Math.sin(ribbon)*.38,.70,side<0?UDET_FX_PALETTE.red:UDET_FX_PALETTE.ivory);tex(c,'mist',-9,side*(10+Math.abs(Math.cos(a))*12),43,17,side*.24,.29,UDET_FX_PALETTE.ivory);}
 }else if(phase==='counter')for(const side of [-1,1])tex(c,'vaporTrail',-30,side*25,65,8,side*.08,.45,side<0?UDET_FX_PALETTE.red:UDET_FX_PALETTE.gold);
 else if(n)for(let i=0;i<n;i++){const q=(t*1.5+i/3)%1;tex(c,'vaporTrail',-24-q*27,(i%2?1:-1)*(19+q*9),33+q*15,5,0,.35*(1-q),i%2?UDET_FX_PALETTE.ivory:UDET_FX_PALETTE.red);}
}
export function drawUdetCue(c,p,e,tex,front){const q=clamp(e.age/e.maxLife),fade=1-q,a=e.a-p.a;
 if(e.kind==='udetGraze'){
  if(front){tex(c,'windStreak',0,0,45+q*18,8,a,.70*fade,UDET_FX_PALETTE.ivory);tex(c,'spark',0,0,21,11,a,.85*fade,UDET_FX_PALETTE.gold);tex(c,'gunSmoke',-q*14,0,24+q*12,13,a,.22*fade,UDET_FX_PALETTE.smoke);}return true;
 }
 if(e.kind==='udetBrass'){if(front)tex(c,'bulletBrass',-e.age*32,e.side*(6+e.age*62),6,2.6,a+e.age*13,.80*fade,UDET_FX_PALETTE.gold);return true;}
 if(e.kind==='counterRoll'){
  if(front)return false; // Keep the existing short, hand-lettered motto.
  for(const side of [-1,1]){tex(c,'windStreak',-14-q*35,side*(24-q*8),74+q*15,10,side*(.4-q*.55),.70*fade,side<0?UDET_FX_PALETTE.red:UDET_FX_PALETTE.ivory);tex(c,'mist',-9,side*17,51,20,side*.2,.27*fade,UDET_FX_PALETTE.ivory);}return true;
 }
 if(e.kind==='udetCounter'){
  if(!front)for(const side of [-1,1])tex(c,'windStreak',-20-q*36,side*(22+q*8),76,9,-side*.1,.66*fade,side<0?UDET_FX_PALETTE.red:UDET_FX_PALETTE.gold);return true;
 }
 return false;
}
export {udetRollPose};

// Offline-style PCM synthesis, cached by sfx.js: one voice, no per-frame audio graph.
// Steam pressure, resonant whistle pipes and paired wheel joints replace organ-like saw notes.
export const RAIL_AUDIO_SECONDS=Object.freeze({trainApproach:3.4,trainRoll:.48,trainBrake:.85,railBreech:.42,railGunFire:1.05});
export function railAudioSamples(name,sampleRate=48000){
 if(!RAIL_AUDIO_SECONDS[name]||!Number.isFinite(sampleRate)||sampleRate<8000)throw new Error('Invalid rail audio');
 const data=new Float32Array(Math.ceil(RAIL_AUDIO_SECONDS[name]*sampleRate));
 let seed=1871,low=0,body=0,steam=0,phase=0;
 const tau=Math.PI*2;
 for(let i=0;i<data.length;i++){
  const t=i/sampleRate,q=t/RAIL_AUDIO_SECONDS[name];
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;const n=seed/2147483648-1;
  low+=(n-low)*(1-Math.exp(-tau*180/sampleRate));
  body+=(n-body)*(1-Math.exp(-tau*1700/sampleRate));
  steam+=(body-steam)*(1-Math.exp(-tau*650/sampleRate));
  let v=0;
  if(name==='trainApproach'||name==='trainRoll'){
   const arrival=name==='trainApproach',speed=arrival?4.4-2.1*Math.min(1,q*1.15):4.6;
   phase+=speed/sampleRate;const rev=phase%1;
   // 칙칙폭폭: four exhaust chuffs per wheel rev, alternating strong/weak
   // cylinders. Each puff is a gated noise burst over a low thump — the chuff
   // rhythm carries the arrival, continuous rumble stays under it.
   const cyl=Math.floor(rev*4),pos=rev*4-cyl,strong=cyl%2===0;
   const puff=Math.exp(-pos*(strong?15:17))*(strong?1:.66);
   const distance=arrival?.2+.8*Math.sin(Math.min(1,q*1.25)*Math.PI/2):.5;
   const thump=Math.sin(tau*72*t)*.5+Math.sin(tau*144*t)*.2;
   v=(low*.16+((body-steam)*1.05+thump*.8+body*.18)*puff)*distance;
   // Rod clank sits between the chuffs.
   v+=body*.11*Math.exp(-Math.abs(pos-.55)*30)*distance;
   if(arrival){
    // Steam whistle: single long blast. Dominant root + octave, valve-open pitch
    // droop, breath hiss and slow pressure wobble keep it steamy, not organ-like.
    const wt=t-.22,env=wt>0&&wt<3.1?Math.min(1,wt/.07)*Math.min(1,(3.1-wt)/.5):0;
    const droop=1+.028*Math.exp(-wt*7)-.014*q,steamWob=1+.006*Math.sin(tau*7.3*t)+.003*Math.sin(tau*11.1*t+1.2);
    const drift=droop*steamWob;
    const chord=Math.sin(tau*196*t*drift)+.62*Math.sin(tau*392*t*(drift+.0012)+.4)+.5*Math.sin(tau*294*t*(drift-.0009)+.9)+.22*Math.sin(tau*247*t*(drift+.0018)+1.6)+.14*Math.sin(tau*588*t*drift+2.2);
    const breath=(body-steam)*.75+low*.15;
    v+=env*(chord*.42+breath*.3);
    // Edge transient when the valve slams open + faint reed shimmer.
    v+=Math.exp(-Math.max(0,wt)*38)*(body-steam)*.5;
    v+=env*Math.sin(tau*(784*t-60*t*t))*.04*Math.sin(Math.PI*Math.min(1,wt/.4));
   }
  }else if(name==='trainBrake'){
   v=(body-steam)*.45*(1-q)+Math.sin(tau*(1120*t-180*t*t))*.095*Math.sin(Math.PI*q)+low*.16*(1-q);
  }else if(name==='railBreech'){
   const strike=Math.exp(-t*45)+.6*Math.exp(-Math.max(0,t-.16)*60)*(t>.16?1:0);
   v=strike*(body*.32+Math.sin(tau*390*t)*.16)+low*.2*Math.sin(Math.PI*q);
  }else{
   v=low*.65*Math.exp(-t*5)+body*.5*Math.exp(-t*15)+Math.sin(tau*(68*t-13*t*t))*.3*Math.exp(-t*7)+(body-steam)*.17*Math.exp(-t*3);
  }
  const edge=Math.min(1,t/.006,(RAIL_AUDIO_SECONDS[name]-t)/.04);
  data[i]=Math.tanh(v*1.3)*Math.max(0,edge);
 }
 return data;
}

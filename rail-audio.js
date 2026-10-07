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
   const arrival=name==='trainApproach',speed=arrival?3.2+q*1.5:4.6;
   phase+=speed/sampleRate;const wheel=(phase%1),beat=Math.exp(-wheel*65)+.65*Math.exp(-Math.abs(wheel-.11)*85);
   const distance=arrival?.22+.78*Math.sin(Math.min(1,q*1.3)*Math.PI/2):.5;
   v=(low*.28+beat*(body*.38+Math.sin(tau*79*t)*.16))*distance;
   // Exhaust chuffs have pressure noise rather than a melodic low-frequency oscillator.
   v+=(body-steam)*.24*Math.pow(Math.max(0,Math.sin(tau*phase*2)),4)*distance;
   if(arrival){
    const wt=t-.38,env=wt>0&&wt<2.45?Math.min(1,wt/.14)*Math.min(1,(2.45-wt)/.45):0;
    const drift=1.018-.02*q+.002*Math.sin(tau*5.7*t)+.0012*low;
    const pipe=Math.sin(tau*246*t*drift)+.52*Math.sin(tau*369*t*drift+.2)+.23*Math.sin(tau*493*t*drift);
    v+=env*(pipe*.13+(body-steam)*.32);
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

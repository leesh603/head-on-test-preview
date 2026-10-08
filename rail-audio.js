// Offline-style PCM synthesis, cached by sfx.js: one voice, no per-frame audio graph.
// Steam locomotive arrival: percussive exhaust puffs (chug-chuff) over a long
// low horn blast. Puffs are shaped noise bursts — percussive, not a wind bed.
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
   const arrival=name==='trainApproach',revs=arrival?2.7-1.2*Math.min(1,q*1.2):2.5;
   phase+=revs/sampleRate;const rev=phase%1;
   // 칙칙폭폭: four exhaust puffs per rev — sharp band-noise burst + low thump.
   // Noise lives only inside the puff envelope so it reads as "ch", not wind.
   const cyl=Math.floor(rev*4),pos=rev*4-cyl,strong=cyl%2===0;
   const puff=Math.exp(-pos*(strong?10:13))*(strong?1:.6);
   const chug=(body-steam)*1.35+body*.55;
   const boom=Math.sin(tau*66*t)*.6+Math.sin(tau*132*t)*.24;
   const distance=arrival?.22+.78*Math.sin(Math.min(1,q*1.25)*Math.PI/2):.5;
   v=(low*.05+(chug*.45+boom*.72)*puff)*distance;
   // rod knock between puffs
   v+=Math.sin(tau*295*t+Math.sin(tau*51*t)*2)*.05*Math.exp(-Math.abs(pos-.6)*28)*distance;
   if(arrival){
    // 뿌우우우우: long low steam-whistle blast — deep dominant root with its
    // octave/fifth stack, a breath of steam, valve-open droop, long decay.
    const wt=t-.32,env=wt>0&&wt<2.9?Math.min(1,wt/.09)*Math.min(1,(2.9-wt)/.65):0;
    const drift=1+.024*Math.exp(-wt*6)+.0045*Math.sin(tau*5.4*t);
    const horn=Math.sin(tau*220*t*drift)+.52*Math.sin(tau*440*t*(drift+.001))+.35*Math.sin(tau*330*t*(drift-.0008)+.6)+.16*Math.sin(tau*660*t*drift+1.1);
    v+=env*(horn*.62+(body-steam)*.13);
   }
  }else if(name==='trainBrake'){
   v=Math.sin(tau*(1120*t-180*t*t))*.16*Math.sin(Math.PI*q)+low*.12*(1-q);
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

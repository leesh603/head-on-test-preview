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
   // 칙칙폭폭: four exhaust puffs per rev — percussive low thump + bright tick,
   // almost no noise so nothing reads as wind on small speakers.
   const cyl=Math.floor(rev*4),pos=rev*4-cyl,strong=cyl%2===0;
   const puff=Math.exp(-pos*(strong?11:14))*(strong?1:.58);
   const boom=Math.sin(tau*82*t)*.8+Math.sin(tau*164*t)*.3+Math.sin(tau*246*t)*.12;
   const tick=Math.sin(tau*520*t)*.1;
   const distance=arrival?.22+.78*Math.sin(Math.min(1,q*1.25)*Math.PI/2):.5;
   v=((tick+boom*1.05)*puff)*distance;
   // rod knock between puffs
   v+=Math.sin(tau*295*t+Math.sin(tau*51*t)*2)*.05*Math.exp(-Math.abs(pos-.6)*28)*distance;
   if(arrival){
    // 뿌우우우우: long steam-whistle blast voiced for small speakers — mid root
    // with a wide octave/fifth stack and a breath of steam on the attack.
    const wt=t-.32,env=wt>0&&wt<2.9?Math.min(1,wt/.09)*Math.min(1,(2.9-wt)/.65):0;
    const drift=1+.024*Math.exp(-wt*6)+.0045*Math.sin(tau*5.4*t);
    const horn=Math.sin(tau*330*t*drift)+.55*Math.sin(tau*660*t*(drift+.001))+.4*Math.sin(tau*494*t*(drift-.0008)+.6)+.22*Math.sin(tau*988*t*drift+1.1)+.12*Math.sin(tau*220*t*drift+2);
    v+=env*horn*.7;
   }
  }else if(name==='trainBrake'){
   v=Math.sin(tau*(1120*t-180*t*t))*.16*Math.sin(Math.PI*q);
  }else if(name==='railBreech'){
   const strike=Math.exp(-t*45)+.6*Math.exp(-Math.max(0,t-.16)*60)*(t>.16?1:0);
   v=strike*(Math.sin(tau*390*t)*.16+Math.sin(tau*195*t)*.1);
  }else{
   v=Math.sin(tau*(68*t-13*t*t))*.5*Math.exp(-t*7)+Math.sin(tau*340*t)*.2*Math.exp(-t*15)+Math.sin(tau*136*t)*.3*Math.exp(-t*5);
  }
  const edge=Math.min(1,t/.006,(RAIL_AUDIO_SECONDS[name]-t)/.04);
  data[i]=Math.tanh(v*1.3)*Math.max(0,edge);
 }
 return data;
}

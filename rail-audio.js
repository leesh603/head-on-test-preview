// Offline PCM synthesis for the rail bosses, cached by sfx.js: one voice, no per-frame audio graph.
// A steam locomotive is three distinct, percussive things, and nothing here is a continuous bed:
//  · 칙칙폭폭 — exhaust chuffs: short gated bursts of steam (two light "칙", two heavy "폭" with a
//    chest thump), accelerating as the train arrives. Each burst is ~0.1 s; silence in between.
//  · 덜컹덜컹 — wheels over rail joints: paired metallic knocks ringing at fixed rail pitches.
//  · 뿌우우우 — the steam whistle: three tuned pipes (A minor chord) with a pitch scoop on the
//    attack, a little vibrato and a narrow breath *on each pipe's pitch* (tonal, never a hiss).
// Everything sits above ~120 Hz so phone speakers carry it.
export const RAIL_AUDIO_SECONDS=Object.freeze({trainApproach:4.2,trainWhistle:2.6,trainRoll:.5,trainBrake:.9,railBreech:.42,railGunFire:1.05});
const TAU=Math.PI*2;
// Deterministic white noise.
function noiseSource(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/2147483648-1}}
// RBJ band-pass (constant 0 dB peak gain), per-sample.
function bandpass(sr,f,q){const w=TAU*f/sr,a=Math.sin(w)/(2*q),c=Math.cos(w),n=1+a;const b0=a/n,b2=-a/n,a1=-2*c/n,a2=(1-a)/n;let x1=0,x2=0,y1=0,y2=0;
 return x=>{const y=b0*x+b2*x2-a1*y1-a2*y2;x2=x1;x1=x;y2=y1;y1=y;return y}}
function lowpass1(sr,f){let y=0;const k=1-Math.exp(-TAU*f/sr);return (x,fc)=>{const kk=fc?1-Math.exp(-TAU*fc/sr):k;y+=(x-y)*kk;return y}}
// One exhaust chuff starting at t0: gated steam burst, heavy ones with a low thump.
function chuffs(sr,len,times,level){
 const out=new Float32Array(len),rnd=noiseSource(1871);
 const light=bandpass(sr,1250,1.1),lightAir=bandpass(sr,2600,1.4),heavy=bandpass(sr,620,1.0);
 let k=0;
 for(let i=0;i<len;i++){
  const t=i/sr;while(k+1<times.length&&times[k+1].t<=t)k++;
  const c=times[k];const n=rnd();
  let v=0;
  if(c&&t>=c.t){const dt=t-c.t,dec=c.heavy?.055:.038,env=Math.min(1,dt/.004)*Math.exp(-dt/dec)*(dt<.16?1:0);
   if(env>1e-4){
    v=c.heavy?heavy(n)*1.25+light(n)*.45:light(n)*1.05+lightAir(n)*.35;
    v*=env*c.gain;
    // "폭": a short pitch-dropping thump under the heavy puffs (130 → 80 Hz), audible as a knock.
    if(c.heavy)v+=Math.sin(TAU*(130*dt-250*dt*dt))*Math.exp(-dt/.05)*.55*c.gain;
   }else{light(n);lightAir(n);heavy(n)}
  }else{light(n);lightAir(n);heavy(n)}
  out[i]=v*level;
 }
 return out;
}
function chuffSchedule(seconds,rate0,rate1,gain=t=>1){
 const list=[];let t=.04,i=0;
 while(t<seconds-.12){const q=t/seconds,rate=rate0+(rate1-rate0)*q,heavy=i%4>=2;
  list.push({t,heavy,gain:gain(t)*(heavy?1:.78)*(.93+.07*Math.sin(i*1.7))});t+=1/rate;i++}
 return list;
}
// 덜컹덜컹: a wheel set over a rail joint — two knocks 85 ms apart, ringing at two rail pitches.
function clacks(sr,len,times,level){
 const out=new Float32Array(len),rnd=noiseSource(907),r1=bandpass(sr,1650,9),r2=bandpass(sr,2950,12),body=bandpass(sr,420,2.2);
 let k=0;
 for(let i=0;i<len;i++){
  const t=i/sr;while(k+1<times.length&&times[k+1].t<=t)k++;
  let ex=0;const c=times[k];
  if(c){for(const off of [0,.085]){const dt=t-c.t-off;if(dt>=0&&dt<.004)ex+=rnd()*(1-dt/.004)*c.gain*(off?1:.8)}}
  let v=r1(ex)*2.4+r2(ex)*1.6+body(ex)*1.8;
  // a dull wheel thud under each knock
  if(c)for(const off of [0,.085]){const dt=t-c.t-off;if(dt>=0&&dt<.08)v+=Math.sin(TAU*190*dt)*Math.exp(-dt/.022)*.3*c.gain}
  out[i]=v*level;
 }
 return out;
}
// 뿌우우우: three-chime steam whistle. blasts: [{t,dur,gain}]
function whistle(sr,len,blasts,level){
 const out=new Float32Array(len),rnd=noiseSource(4242);
 const pipes=[[440,1],[523.25,.82],[659.25,.62]];
 const breath=pipes.map(([f])=>bandpass(sr,f,28));
 const phase=pipes.map(()=>0);
 for(let i=0;i<len;i++){
  const t=i/sr;let env=0,scoop=0,g=0;
  for(const b of blasts){const dt=t-b.t;if(dt<0||dt>b.dur+.35)continue;
   const e=Math.min(1,dt/.07)*(dt<b.dur?1:Math.max(0,1-(dt-b.dur)/.35));if(e>env){env=e;scoop=Math.exp(-dt/.09);g=b.gain}}
  const n=rnd();let v=0;
  for(let p=0;p<pipes.length;p++){
   const [f,a]=pipes[p];const fr=f*(1-.035*scoop)*(1+.004*Math.sin(TAU*5.6*t+p));
   phase[p]=(phase[p]+fr/sr)%1;const ph=TAU*phase[p];
   const tone=Math.sin(ph)+.32*Math.sin(2*ph)+.12*Math.sin(3*ph);
   const br=breath[p](n)*(.9+1.6*scoop);
   v+=a*(tone*.8+br*3.2);
  }
  out[i]=v*env*g*level;
 }
 return out;
}
function mix(len,parts){const out=new Float32Array(len);for(const p of parts)for(let i=0;i<len;i++)out[i]+=p[i];return out}
function finish(data,sr,seconds,peak=.92){
 let m=0;for(let i=0;i<data.length;i++){data[i]=Math.tanh(data[i]*1.2);m=Math.max(m,Math.abs(data[i]))}
 const k=m>0?peak/m:1;
 for(let i=0;i<data.length;i++){const t=i/sr,edge=Math.min(1,t/.004,(seconds-t)/.05);data[i]*=k*Math.max(0,edge)}
 return data;
}
export function railAudioSamples(name,sampleRate=48000){
 if(!RAIL_AUDIO_SECONDS[name]||!Number.isFinite(sampleRate)||sampleRate<8000)throw new Error('Invalid rail audio');
 const sr=sampleRate,seconds=RAIL_AUDIO_SECONDS[name],len=Math.ceil(seconds*sr);
 if(name==='trainApproach'){
  // The train runs in from a distance: chuffs speed up from 3 to 4.6 a second and swell,
  // joints knock under them, and the whistle calls twice — a long blast and a short one.
  const near=t=>.32+.68*Math.min(1,Math.sin(Math.min(1,t/3.1)*Math.PI/2));
  const ch=chuffs(sr,len,chuffSchedule(seconds,3,4.6,near),1);
  const cl=clacks(sr,len,Array.from({length:Math.floor(seconds/.52)},(_,i)=>({t:.2+i*.52,gain:near(.2+i*.52)})),.45);
  const wh=whistle(sr,len,[{t:.3,dur:1.65,gain:1},{t:2.3,dur:.6,gain:.9}],.3);
  // Distance: the far train is duller; the brightness opens as it arrives.
  const lp=lowpass1(sr,4000),body=mix(len,[ch,cl]);
  for(let i=0;i<len;i++){const t=i/sr;body[i]=lp(body[i],1200+3600*Math.min(1,t/3))}
  return finish(mix(len,[body,wh]),sr,seconds);
 }
 if(name==='trainWhistle')return finish(whistle(sr,len,[{t:.02,dur:1.25,gain:1},{t:1.55,dur:.55,gain:.85}],.5),sr,seconds,.85);
 if(name==='trainRoll'){
  // One beat of a rolling train: a puff and a joint knock pair.
  // Rolling events repeat about three times a second, so each carries one puff: a steady 칙-폭 beat.
  const ch=chuffs(sr,len,[{t:.02,heavy:true,gain:.8}],1);
  const cl=clacks(sr,len,[{t:.15,gain:1}],.5);
  return finish(mix(len,[ch,cl]),sr,seconds,.7);
 }
 if(name==='trainBrake'){
  // Slowing to a stop: joint knocks spacing out and a heavy coupling clank — no squeal, no hiss.
  const cl=clacks(sr,len,[{t:.02,gain:1},{t:.3,gain:.8},{t:.62,gain:.6}],.55);
  const clank=new Float32Array(len);for(let i=0;i<len;i++){const dt=i/sr-.5;if(dt>=0)clank[i]=(Math.sin(TAU*240*dt)*.5+Math.sin(TAU*610*dt)*.25)*Math.exp(-dt/.07)}
  return finish(mix(len,[cl,clank]),sr,seconds,.75);
 }
 const data=new Float32Array(len);
 for(let i=0;i<len;i++){
  const t=i/sr;let v;
  if(name==='railBreech'){const strike=Math.exp(-t*45)+.6*Math.exp(-Math.max(0,t-.16)*60)*(t>.16?1:0);v=strike*(Math.sin(TAU*390*t)*.16+Math.sin(TAU*195*t)*.1)}
  else v=Math.sin(TAU*(68*t-13*t*t))*.5*Math.exp(-t*7)+Math.sin(TAU*340*t)*.2*Math.exp(-t*15)+Math.sin(TAU*136*t)*.3*Math.exp(-t*5);
  const edge=Math.min(1,t/.006,(seconds-t)/.04);data[i]=Math.tanh(v*1.3)*Math.max(0,edge);
 }
 return data;
}

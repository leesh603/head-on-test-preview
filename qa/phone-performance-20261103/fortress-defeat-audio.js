// Original 7-second mechanical destruction score. No borrowed audio or external samples.
export const FORTRESS_DEFEAT_SECONDS=7;
export const FORTRESS_DEFEAT_TIMELINE=Object.freeze([
 {at:0,kind:'power-down'}, {at:.65,kind:'pressure-steam'},
 {at:1.85,kind:'ammunition-small'}, {at:2.38,kind:'ammunition-medium'},
 {at:2.95,kind:'ammunition-heavy'}, {at:3.48,kind:'ammunition-secondary'},
 {at:3.65,kind:'track-collapse'}, {at:4.65,kind:'reactor-impact'},
 {at:5.35,kind:'falling-debris'}, {at:6.2,kind:'metal-settle'}
]);
const TAU=Math.PI*2,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function* sampleChunks(sr=22050){
 const n=Math.ceil(FORTRESS_DEFEAT_SECONDS*sr),left=new Float32Array(n),right=new Float32Array(n);let seed=19180407,lo=0,mid=0,phase=0;
 const events=FORTRESS_DEFEAT_TIMELINE;
 for(let i=0;i<n;i++){
  if(i>0&&i%4096===0)yield;
  const t=i/sr;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/2147483648-1;
  lo+=(noise-lo)*(1-Math.exp(-TAU*420/sr));mid+=(noise-mid)*(1-Math.exp(-TAU*1500/sr));let l=0,r=0;
  function add(v,pan=0){const a=(pan+1)*Math.PI/4;l+=v*Math.cos(a);r+=v*Math.sin(a);}
  // Piston frequency decays and mechanical knocks spread apart, rather than a sci-fi siren.
  if(t<1.6){phase+=TAU*(29+72*Math.exp(-t/0.46))/sr;const env=Math.min(1,t/.012)*Math.max(0,1-t/1.6);add((Math.sin(phase)*.13+Math.sin(phase*2.02)*.035+lo*.10)*env*(.5+.5*Math.sin(phase*.19)**2));}
  const steam=t-.65;if(steam>0&&steam<2.5){const env=Math.sin(Math.PI*steam/2.5)**1.4;add((mid-lo)*.20*env*(.7+.3*Math.sin(TAU*11*steam)**2),-.25);}
  for(let j=2;j<=5;j++){const d=t-events[j].at;if(d<0||d>1.3)continue;const f=[130,95,69,155][j-2],dec=[.14,.18,.27,.12][j-2],amp=[.36,.46,.62,.30][j-2],env=Math.min(1,d/.002)*Math.exp(-d/dec);const p=TAU*(f*d+f*.025*(1-Math.exp(-d/.025)));add((Math.sin(p)*.7+lo*.8+mid*.35*Math.exp(-d/.04))*env*amp,[-.6,.4,-.15,.55][j-2]);}
  // Heavy track links: several damped inharmonic metal collisions, each different.
  for(const [at,f,g,pan]of [[3.65,164,.24,-.55],[3.83,237,.19,.42],[4.04,116,.28,-.3],[4.23,329,.12,.6],[5.35,271,.12,-.5],[5.57,418,.08,.4],[5.91,193,.06,-.2],[6.2,361,.035,.3]]){
   const d=t-at;if(d<0||d>.8)continue;add((Math.sin(TAU*f*d)*Math.exp(-d/.12)+.5*Math.sin(TAU*f*2.73*d)*Math.exp(-d/.19)+mid*.18*Math.exp(-d/.02))*Math.min(1,d/.0015)*g,pan);
  }
  const d=t-4.65;if(d>0){const env=Math.min(1,d/.002)*Math.exp(-d/.33),p=TAU*(45*d+2.6*(1-Math.exp(-d/.035)));add((Math.sin(p)*.85+lo*1.1+mid*.65*Math.exp(-d/.035))*env*.95);for(const at of [.12,.23,.39])if(d>at)add(lo*.18*Math.exp(-(d-at)/.26));}
  const tail=Math.min(1,(7-t)/.12);left[i]=l*tail;right[i]=r*tail;
 }
 let peak=0;for(let i=0;i<n;i++)peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));const gain=.82/peak;
 for(let i=0;i<n;i++){left[i]*=gain;right[i]*=gain;}return[left,right];
}

export function fortressDefeatSamples(sr=22050){const chunks=sampleChunks(sr);let next;do{next=chunks.next();}while(!next.done);return next.value;}

// Caller supplies its already gesture-unlocked context and normal/capture destinations.
// eventId must be a stable encounter id, not a freshly reconstructed co-op snapshot object.
export function createFortressDefeatAudio({context,destinations,document:doc=globalThis.document}={}){
 let pcm=null,buffer=null,bufferContext=null,voice=null,disposed=false,played=0,currentId=null,last=null,error=null;
 const done=new Set();const ready=(async()=>{const chunks=sampleChunks();let next;do{await new Promise(resolve=>setTimeout(resolve,0));if(disposed)return;next=chunks.next();}while(!next.done);pcm=next.value;})();
 function remember(id){done.add(id);while(done.size>64)done.delete(done.values().next().value);}
 function stop(){if(!voice)return;const v=voice;voice=null;v.source.onended=null;try{v.source.stop();}catch{}v.source.disconnect();v.gain.disconnect();}
 function update(state){
  if(disposed)return;last=state;const {eventId,elapsed=0,active=false,paused=false,muted=false,volume=1}=state||{};
  if(!active||eventId==null){if(currentId!=null)remember(currentId);stop();currentId=null;return;}
  if(currentId!==eventId){if(currentId!=null)remember(currentId);stop();currentId=eventId;}
  if(elapsed>=7){stop();remember(eventId);return;}
  if(paused||muted||doc?.hidden){stop();return;}
  if(voice){voice.gain.gain.value=.35*clamp(Number.isFinite(volume)?volume:1,0,1);return;}
  if(done.has(eventId)||!pcm)return;
  const ctx=typeof context==='function'?context():context;if(!ctx||ctx.state!=='running')return;
  try{
   if(!buffer||bufferContext!==ctx){buffer=ctx.createBuffer(2,pcm[0].length,22050);buffer.copyToChannel(pcm[0],0);buffer.copyToChannel(pcm[1],1);bufferContext=ctx;}
   const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;gain.gain.value=.35*clamp(Number.isFinite(volume)?volume:1,0,1);source.connect(gain);
   const outputs=(typeof destinations==='function'?destinations(ctx):destinations)||[ctx.destination];for(const out of new Set(outputs.filter(Boolean)))gain.connect(out);
   const v={source,gain,id:eventId};voice=v;source.onended=()=>{if(voice!==v)return;voice=null;source.disconnect();gain.disconnect();remember(eventId);};source.start(ctx.currentTime,clamp(elapsed,0,7));played++;error=null;
  }catch(e){stop();error=e.message;}
 }
 function visibility(){if(doc?.hidden)stop();}doc?.addEventListener?.('visibilitychange',visibility);
 return{ready,update,stop,dispose(){disposed=true;stop();pcm=null;buffer=null;done.clear();doc?.removeEventListener?.('visibilitychange',visibility);},status(){return{active:voice?1:0,limit:1,played,eventId:currentId,completed:done.size,ready:!!pcm,error};}};
}

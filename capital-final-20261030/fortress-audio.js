// Original deterministic PCM: no downloaded samples, music, or network dependency.
// Acoustic pressure impulses, damped metal and piston/propeller pulses, not sci-fi tones.
export const FORTRESS_CUES=Object.freeze({cannon:1.5,gun:.55,mortar:.85,impact:.95,destroy:1.5,prepare:.65,'mine-release':.65,'mine-arm':.3,flame:2.3,drone:1.4,aircraft:1.8,searchlight:.5,track:.3,steam:.65});
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function fortressAudioSamples(kind,sr=44100){
 if(!FORTRESS_CUES[kind])throw new Error('Unknown fortress cue: '+kind);
 const seconds=FORTRESS_CUES[kind],out=new Float32Array(Math.ceil(seconds*sr));
 let seed=1731+[...kind].reduce((n,c)=>n+c.charCodeAt(0),0),lo=0,body=0,phase=0;
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
 const blast=['cannon','gun','mortar','impact','destroy'].includes(kind);
 for(let i=0;i<out.length;i++){
  const t=i/sr,n=rand();lo+=(n-lo)*(1-Math.exp(-TAU*550/sr));body+=(n-body)*(1-Math.exp(-TAU*1900/sr));
  let v=0;
  if(blast){
   const heavy=kind==='cannon'||kind==='destroy',f=heavy?54:kind==='mortar'?95:138,decay=heavy?.31:.15;
   // Integrated exponentially settling membrane pitch; short pressure crack + low outdoor tail.
   phase+=TAU*(f+f*1.2*Math.exp(-t/.018))/sr;
   v=Math.sin(phase)*Math.exp(-t/decay)*.7+lo*Math.exp(-t/(decay*1.3))*1.1+body*Math.exp(-t/.028)*.9;
   v+=Math.sin(TAU*f*2.17*t)*Math.exp(-t/.065)*.16;
   for(const delay of[.085,.147,.231])if(t>delay)v+=lo*Math.exp(-(t-delay)/.16)*.13;
   if(kind==='destroy')v+=(Math.sin(TAU*333*t)+Math.sin(TAU*791*t))*.11*Math.exp(-t/.35)*(1+Math.sin(t*47))*.5;
  }else if(kind==='flame'){
   const sustain=Math.min(1,t/.07,(seconds-t)/.22);
   v=(lo*.7+Math.sin(TAU*72*t)*.14)*(0.75+.25*Math.sin(TAU*18*t))*sustain;
   v+=body*.4*Math.exp(-t/.025); // ignition, then a dark pressure roar, no broad hiss
  }else if(kind==='aircraft'||kind==='drone'){
   const f=kind==='aircraft'?73:108,env=Math.sin(Math.PI*t/seconds)**.7;
   phase+=TAU*(f+27*t/seconds)/sr;
   v=(Math.sin(phase)*.24+Math.sin(phase*2)*.12+lo*.18)*(0.65+.35*Math.sin(TAU*23*t)**2)*env;
  }else if(kind==='steam'){
   v=(body-lo)*.65*Math.sin(Math.PI*t/seconds)**2*(.65+.35*Math.sin(TAU*13*t)**2);
  }else{
   const events=kind==='prepare'?[0,.16,.32]:kind==='mine-release'?[0,.09,.24]:kind==='mine-arm'?[0,.08]:kind==='track'?[0,.10]:[0];
   for(const at of events){const d=t-at;if(d<0)continue;
    const base=kind==='track'?162:kind==='mine-arm'?610:kind==='searchlight'?252:280;
    v+=(Math.sin(TAU*base*d)*.4*Math.exp(-d/.035)+Math.sin(TAU*base*2.71*d)*.14*Math.exp(-d/.06)+body*.25*Math.exp(-d/.009));
   }
   if(kind==='mine-release')v+=lo*.6*Math.exp(-t/.12);
  }
  // 2 ms attack and 20 ms release remove discontinuities, leave pressure transient intact.
  out[i]=v*Math.min(1,t/.002,(seconds-t)/.02);
 }
 let peak=0;for(const v of out)peak=Math.max(peak,Math.abs(v));
 const gain=(blast?.85:kind==='flame'?.55:.65)/Math.max(peak,1e-6);
 for(let i=0;i<out.length;i++)out[i]*=gain;
 return out;
}

export function createFortressAudio({contextFactory,document:doc=globalThis.document}={}){
 let ctx,bus,limiter,record,muted=false,paused=false,disposed=false,unlocked=false,previous=null,cursor=-1,clock=0,trackAt=0,steamAt=0;
 let played=0,dropped=0,resuming=null;const voices=new Map(),buffers=new Map(),last=new Map(),effects=new WeakSet(),armed=new WeakSet();
 const LIMIT=16,PCM_RATE=22050,pcmBank=new Map();
 // Prepare one cue per task before combat; never synthesize in a frame/play callback.
 const ready=(async()=>{for(const kind of Object.keys(FORTRESS_CUES)){await new Promise(resolve=>setTimeout(resolve,0));if(disposed)return;pcmBank.set(kind,fortressAudioSamples(kind,PCM_RATE));}})();
 function release(src){const v=voices.get(src);if(!v)return;voices.delete(src);src.onended=null;src.disconnect();v.gain.disconnect();v.pan?.disconnect();}
 function stop(){for(const src of [...voices.keys()]){try{src.stop();}catch{}release(src);}last.clear();}
 function init(){if(ctx||disposed)return;const AC=globalThis.AudioContext||globalThis.webkitAudioContext;if(!contextFactory&&!AC)return;ctx=contextFactory?contextFactory():new AC();bus=ctx.createGain();bus.gain.value=.8;
  limiter=ctx.createWaveShaper();const curve=new Float32Array(4097);for(let i=0;i<curve.length;i++){const x=i/(curve.length-1)*2-1;curve[i]=.94*Math.tanh(x*1.6);}limiter.curve=curve;limiter.oversample='none';bus.connect(limiter);limiter.connect(ctx.destination);
  record=ctx.createMediaStreamDestination?.();if(record)limiter.connect(record);
 }
 async function unlock(){if(disposed||muted)return false;try{init();if(!ctx)return false;if(!resuming)resuming=Promise.resolve(ctx.resume()).finally(()=>resuming=null);await resuming;await ready;if(disposed)return false;unlocked=ctx.state==='running';return unlocked;}catch{return false;}}
 function play(kind,{x=0,source='',volume=1}={}){
  if(!FORTRESS_CUES[kind]||!ctx||!unlocked||muted||paused||doc?.hidden||ctx.state!=='running'||disposed)return false;
  const now=ctx.currentTime,key=kind+':'+source,interval=kind==='track'?.09:kind==='gun'?.065:kind==='mine-release'?.08:.045;
  if(now-(last.get(key)??-Infinity)<interval){dropped++;return false;}
  const priority=['cannon','destroy','flame'].includes(kind)?2:['track','steam','prepare'].includes(kind)?0:1;
  if(voices.size>=LIMIT){const victim=[...voices].find(([,v])=>v.priority<priority);if(!victim){dropped++;return false;}try{victim[0].stop();}catch{}release(victim[0]);}
  let buffer=buffers.get(kind);if(!buffer){const data=pcmBank.get(kind);if(!data)return false;buffer=ctx.createBuffer(1,data.length,PCM_RATE);buffer.copyToChannel(data,0);buffers.set(kind,buffer);}
  const src=ctx.createBufferSource(),gain=ctx.createGain(),pan=ctx.createStereoPanner?.();src.buffer=buffer;gain.gain.value=(priority===0?.09:kind==='cannon'?.39:kind==='destroy'?.30:.23)*clamp(volume,0,1);
  src.connect(gain);if(pan){pan.pan.value=clamp(x/1000,-.75,.75);gain.connect(pan);pan.connect(bus);}else gain.connect(bus);
  voices.set(src,{gain,pan,priority,kind,source});src.onended=()=>release(src);last.set(key,now);src.start();played++;return true;
 }
 function update(s,dt=0){
  const reset=previous!==s;if(reset){stop();previous=s;cursor=-1;clock=0;trackAt=0;steamAt=0;}
  paused=!!s.paused||!!doc?.hidden;const queue=s.audioEvents||s.systems?.audioEvents||[];
  if(paused||muted||!unlocked){stop();for(const e of queue)cursor=Math.max(cursor,e.serial);for(const e of s.effects||[])effects.add(e);for(const h of s.systems?.hazards||[])if(h.kind==='mine'&&h.age>=h.armed)armed.add(h);return;}
  clock+=clamp(dt,0,.1);
  for(const [src,v] of voices)if(v.kind==='flame'&&!s.systems?.hazards?.some(h=>h.kind==='flame'&&h.life>0)){try{src.stop();}catch{}release(src);}
  for(const e of queue)if(e.serial>cursor){cursor=e.serial;const kind=e.kind==='beam'?'searchlight':e.kind==='cannon'&&e.source!=='main'?'gun':e.kind;play(kind,{x:(e.x??s.x)-s.x,source:e.source||'',volume:e.volume??1});}
  // Mechanics-only shots and impact fallback. Systems events own attacks when a queue exists.
  for(const e of s.effects||[])if(!effects.has(e)){effects.add(e);if(e.kind==='explosion')play('impact',{x:e.x-s.x});else if(e.kind==='muzzle'&&!queue.length)play(e.heavy?'cannon':'gun',{x:e.x-s.x,source:e.source});}
  for(const h of s.systems?.hazards||[])if(!queue.length&&h.kind==='mine'&&h.age>=h.armed&&!armed.has(h)){armed.add(h);play('mine-arm',{x:h.x-s.x,source:String(h.serial)});}
  if(s.coreHp>0&&Math.abs(s.v)>.5&&clock>=trackAt){trackAt=clock+clamp(10/Math.abs(s.v),.13,.65);play('track',{volume:Math.min(1,Math.abs(s.v)/65)});}
  if(s.coreHp>0&&Math.abs(s.v)>1&&clock>=steamAt){steamAt=clock+3.5;play('steam',{volume:.6});}
 }
 function visibility(){if(doc?.hidden){stop();paused=true;const queue=previous?.audioEvents||previous?.systems?.audioEvents||[];for(const e of queue)cursor=Math.max(cursor,e.serial);for(const e of previous?.effects||[])effects.add(e);}}
 doc?.addEventListener?.('visibilitychange',visibility);
 return {ready,unlock,update,play,stop,setMuted(v){muted=!!v;if(muted)stop();},captureStream(){return record?.stream||null;},dispose(){disposed=true;stop();doc?.removeEventListener?.('visibilitychange',visibility);buffers.clear();pcmBank.clear();ctx?.close?.();},get stats(){return{active:voices.size,limit:LIMIT,muted,paused,unlocked,played,dropped,buffers:buffers.size,prepared:pcmBank.size,state:ctx?.state||'locked'};}};
}

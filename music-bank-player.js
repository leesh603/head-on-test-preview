import {MUSIC_SAMPLES} from './music-samples.js?v=485';

// A bounded sampler, owned by the existing BattleMusic AudioContext.
export class AcousticBank {
 constructor(ctx){this.ctx=ctx;this.buffers=new Map();this.voices=new Set();this.ready=false;this.errors=[];this.round=0;}
 load(){
  if(this.loading)return this.loading;
  const queue=Object.values(MUSIC_SAMPLES).flat().filter(s=>!this.buffers.has(s.file));
  this.errors=[];
  this.loading=Promise.all(Array.from({length:4},async()=>{
   while(queue.length){const sample=queue.shift();try{
    const response=await fetch(new URL('./music-bank/'+sample.file,import.meta.url));
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const buffer=await this.ctx.decodeAudioData(await response.arrayBuffer());
    this.buffers.set(sample.file,buffer);
   }catch(error){this.errors.push(sample.file+': '+error.message);}}
  })).then(()=>{this.ready=this.errors.length===0;this.loading=null;return this.ready;});
  return this.loading;
 }
 note(instrument,midi,time,duration,volume,pan,layer,tag='score'){
  if(!this.ready||!layer||volume<=0||this.voices.size>=80)return;
  const samples=MUSIC_SAMPLES[instrument];if(!samples)return;
  const root=samples.reduce((best,s)=>Math.abs(s.root-midi)<Math.abs(best.root-midi)?s:best).root;
  const choices=samples.filter(s=>s.root===root),sample=choices[this.round++%choices.length],buffer=this.buffers.get(sample.file);
  if(!buffer)return;
  const c=this.ctx,source=c.createBufferSource(),gain=c.createGain(),panner=c.createStereoPanner();
  const rate=2**((midi-root)/12),start=Math.max(c.currentTime+.004,time),length=Math.min(buffer.duration/rate,duration+.2);
  source.buffer=buffer;source.playbackRate.value=rate;panner.pan.value=Math.max(-.7,Math.min(.7,pan||0));
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume,start+.012);
  gain.gain.setValueAtTime(volume,start+Math.max(.015,length-.18));gain.gain.linearRampToValueAtTime(0,start+length);
  source.connect(gain);gain.connect(panner);panner.connect(layer);
  const voice={source,gain,panner,layer,tag,start};this.voices.add(voice);
  source.onended=()=>{source.disconnect();gain.disconnect();panner.disconnect();this.voices.delete(voice);};
  source.start(start);source.stop(start+length+.01);
 }
 stop(predicate=()=>true,fade=.08){
  const now=this.ctx.currentTime;
  for(const voice of this.voices)if(predicate(voice)){
   const gain=voice.gain.gain;
   if(gain.cancelAndHoldAtTime)gain.cancelAndHoldAtTime(now);else{gain.cancelScheduledValues(now);gain.setValueAtTime(gain.value,now);}
   gain.linearRampToValueAtTime(0,now+fade);
   try{voice.source.stop(voice.start>now?now:now+fade+.01);}catch{}
  }
 }
 get decodedBytes(){let bytes=0;for(const b of this.buffers.values())bytes+=b.length*b.numberOfChannels*4;return bytes;}
}

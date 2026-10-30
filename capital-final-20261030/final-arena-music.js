import {createFortressDefeatAudio} from './fortress-defeat-audio.js';
// Final-area original score controller. Existing BattleMusic preferences remain authoritative.
import {createFortressAudio} from './fortress-audio.js';
const ROOT=new URL('./asset-bank/zero-district/audio/',import.meta.url);
export const FINAL_ARENA_MUSIC=Object.freeze({entry:'zero-district-infiltration',battle:'pandemonium-battle',loopEnd:87.27271875,crossfade:2.7272727});
export function createFinalArenaMusic({music,fetcher=globalThis.fetch?.bind(globalThis),document:doc=globalThis.document,sfxFactory=createFortressAudio,defeatFactory=createFortressDefeatAudio}={}){
 if(!music)throw Error('BattleMusic instance required');
 const defeat=defeatFactory({context:()=>music.ctx,destinations:ctx=>[ctx.destination,music.meter].filter(Boolean)});
 const sfx=sfxFactory({document:doc}),buffers=new Map(),inflight=new Map(),positions=new Map(),voices=new Set();
 let bus,ctx,tap,active=false,disposed=false,wanted=null,current=null,pending=null,serial=0,error=null,retryAt=0,lastGame=null,lastOptions={},paused=false;
 function release(v){if(!voices.delete(v))return;v.source.onended=null;v.source.disconnect();v.gain.disconnect();}
 function stopVoice(v,preserve=false){if(preserve)positions.set(v.id,(v.offset+Math.max(0,ctx.currentTime-v.started))%FINAL_ARENA_MUSIC.loopEnd);try{v.source.stop();}catch{}release(v);}
 function silence(preserve=false){for(const v of [...voices])stopVoice(v,preserve);current=null;}
 function ensure(){if(bus||!music.ctx)return;ctx=music.ctx;bus=ctx.createGain();bus.gain.value=0;bus.connect(ctx.destination);if(music.meter)bus.connect(music.meter);}
 async function unlock(){if(disposed)return false;music.unlock();ensure();const ok=await sfx.unlock();await defeat.ready;if(!tap&&ctx&&sfx.captureStream()&&ctx.createMediaStreamSource){tap=ctx.createMediaStreamSource(sfx.captureStream());if(music.meter)tap.connect(music.meter);}return ok;}
 async function load(id){if(buffers.has(id))return buffers.get(id);if(inflight.has(id))return inflight.get(id);const task=loadFile(id).finally(()=>inflight.delete(id));inflight.set(id,task);return task;}
 async function loadFile(id){let failure;
  for(const ext of ['ogg','mp3']){const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),15000);try{const response=await fetcher(new URL(id+'.'+ext,ROOT).href,{signal:abort.signal});if(!response.ok)throw Error('HTTP '+response.status);const bytes=await response.arrayBuffer();const buffer=await ctx.decodeAudioData(bytes);if(!disposed)buffers.set(id,buffer);return buffer;}catch(e){failure=e;}finally{clearTimeout(timer);}}
  throw failure||Error('BGM unavailable');
 }
 function start(id,buffer){
  // Current + retiring is the maximum graph size, including rapid phase changes.
  for(const v of [...voices])if(v!==current)stopVoice(v);
  const now=ctx.currentTime,old=current,source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;source.loop=true;source.loopStart=0;source.loopEnd=Math.min(FINAL_ARENA_MUSIC.loopEnd,buffer.duration);source.connect(gain);gain.connect(bus);gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(1,now+FINAL_ARENA_MUSIC.crossfade);
  const offset=(positions.get(id)||0)%source.loopEnd,v={id,source,gain,offset,started:now};voices.add(v);current=v;source.onended=()=>release(v);source.start(now,offset);
  if(old){old.gain.gain.cancelScheduledValues(now);old.gain.gain.setValueAtTime(old.gain.gain.value,now);old.gain.gain.linearRampToValueAtTime(0,now+FINAL_ARENA_MUSIC.crossfade);old.source.stop(now+FINAL_ARENA_MUSIC.crossfade+.01);}
 }
 function service(g,options={}){
  if(disposed)return;lastGame=g;lastOptions=options;ensure();const phase=g?.finalArena?.phase,isActive=['entry','battle','victory'].includes(phase),isPaused=g?.state!=='playing'||!!doc?.hidden;
  if(isActive&&!active){positions.clear();error=null;retryAt=0;}
  active=isActive;paused=isPaused;const mute=!!(options.muted??music.muted),bgmMute=mute||!!options.bgmOff;const fortress=g?.finalArena?.fortress;
  defeat.update({active:phase==='victory',eventId:fortress?.defeat?.token??g?.finalArena?.token,elapsed:fortress?.defeat?.elapsed??g?.finalArena?.elapsed??0,paused:isPaused,muted:mute||!!options.sfxOff,volume:Number.isFinite(music.volume)?music.volume:1});
  sfx.setMuted(mute||!!options.sfxOff||!isActive||isPaused||phase!=='battle');if(fortress)sfx.update(fortress,options.dt||0);else sfx.stop();
  const desired=isActive&&!isPaused&&!bgmMute&&phase!=='victory'?FINAL_ARENA_MUSIC[phase]:null;
  if(bus){const volume=Number.isFinite(music.volume)?Math.max(0,Math.min(1,music.volume)):1;bus.gain.setTargetAtTime(desired ? .25*volume : 0,ctx.currentTime,isPaused||bgmMute ? .015 : .15);}
  if(desired!==wanted){wanted=desired;serial++;pending=null;}
  if(!desired){silence(isActive&&phase!=='victory');if(!active)positions.clear();return;}
  if(!ctx||ctx.state!=='running'||current?.id===desired||pending||Date.now()<retryAt)return;
  const token=serial;pending=desired;load(desired).then(buffer=>{if(disposed||token!==serial||wanted!==desired||ctx.state!=='running')return;error=null;start(desired,buffer);},e=>{if(token===serial){error=e.message;retryAt=Date.now()+5000;}}).finally(()=>{if(token===serial)pending=null;});
 }
 function visibility(){if(doc?.hidden){serial++;pending=null;wanted=null;silence(true);sfx.stop();defeat.stop();if(bus)bus.gain.setValueAtTime(0,ctx.currentTime);}else if(lastGame)service(lastGame,lastOptions);}
 doc?.addEventListener?.('visibilitychange',visibility);
 return {update:service,unlock,dispose(){disposed=true;serial++;silence();sfx.dispose();defeat.dispose();bus?.disconnect();tap?.disconnect();buffers.clear();doc?.removeEventListener?.('visibilitychange',visibility);},status(){return{active,paused,track:current?.id||null,wanted,loading:pending,error,voices:voices.size,cached:buffers.size,sfx:sfx.stats,defeat:defeat.status()};}};
}


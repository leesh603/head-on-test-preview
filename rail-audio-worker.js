// Rail-boss PCM synthesis off the main thread. sfx.js posts {name,sampleRate};
// the samples come back as a transferred Float32Array, so a 4 s locomotive
// voice never costs a frame on a phone.
import {railAudioSamples} from './rail-audio.js?v=d7a0cfcfc455802b';
self.onmessage=e=>{
 const {name,sampleRate}=e.data||{};
 try{const data=railAudioSamples(name,sampleRate);self.postMessage({name,sampleRate,data},[data.buffer]);}
 catch(error){self.postMessage({name,sampleRate,error:String(error)});}
};

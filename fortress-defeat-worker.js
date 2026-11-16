// Builds the 7 s fortress-defeat PCM off the main thread; fortress-defeat-audio.js
// posts {sampleRate} and receives both channels as transferred Float32Arrays.
import {fortressDefeatSamples} from './fortress-defeat-audio.js?v=a09a7cbc62f4d4d8';
self.onmessage=e=>{
 try{const pcm=fortressDefeatSamples(e.data?.sampleRate||22050);self.postMessage({pcm},pcm.map(c=>c.buffer));}
 catch(error){self.postMessage({error:String(error)});}
};

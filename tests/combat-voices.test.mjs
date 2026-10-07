import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {railAudioSamples} from '../rail-audio.js?v=rail1';

function audioHarness(mobile=false){
 const created=[];const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
 const node=()=>{const n={frequency:param(),gain:param(),Q:{},connect(){},disconnect(){this.disconnected=true},start(){},stop(){this.stopped=true}};created.push(n);return n};
 const clock={currentTime:0,state:'running',sampleRate:48000,destination:{},resume:()=>Promise.resolve(),createGain:node,createDynamicsCompressor:node,createOscillator:node,createBiquadFilter:node,createBufferSource:node,createBuffer:(channels,length)=>{const data=new Float32Array(length);return{getChannelData:()=>data}}};
 const sandbox={window:{AudioContext:class{constructor(){return clock}},matchMedia:()=>({matches:mobile})},Math,Map,Promise,railAudioSamples};
 vm.createContext(sandbox);vm.runInContext(readFileSync(new URL('../sfx.js?v=imm3',import.meta.url),'utf8').replace(/^import .*$/gm,'').replaceAll('export ','')+'\nthis.api={sfx,setSfxMuted,setSfxPaused,stopSfx,sfxStats};',sandbox);
 return{api:sandbox.api,clock,created};
}

test('flight and close-pass voices share source budgets and stop on pause',()=>{
 const {api,clock,created}=audioHarness(true);
 for(const [voice,arg] of [['materialImpact','fabric'],['materialImpact','wood'],['materialImpact','metal'],['materialImpact',{material:'wood',streak:6}],['engineTick',{speed:.8,turn:4,damage:.8,duck:true}],['whizz'],['closePass'],['airframeBreak']]){
  api.stopSfx();clock.currentTime+=2;const before=created.length;api.sfx(voice,arg);assert(api.sfxStats().active>0,voice);const count=api.sfxStats().active;api.sfx(voice,arg);assert.equal(api.sfxStats().active,count,voice+' throttles');
  api.setSfxPaused(true);assert.equal(api.sfxStats().active,0);assert(created.slice(before).filter(n=>n.stopped).every(n=>n.disconnected));api.setSfxPaused(false);
 }
});

test('rail samples use one cached buffer per cue, obey voice limits and stop on pause/mute',()=>{
 const {api,clock,created}=audioHarness(true);
 for(const voice of ['trainApproach','trainRoll','trainBrake','railBreech','railGunFire']){
  api.stopSfx();clock.currentTime+=5;const before=created.length;api.sfx(voice);
  const n=created.slice(before).find(n=>n.buffer);assert(n,voice);assert.equal(api.sfxStats().active,1);
  api.sfx(voice);assert.equal(api.sfxStats().active,1,'duplicate cue throttled');
  api.stopSfx();clock.currentTime+=5;api.sfx(voice);assert.equal(created.at(-3).buffer,n.buffer,'PCM buffer reused');
  api.setSfxPaused(true);assert.equal(api.sfxStats().active,0);api.sfx(voice);assert.equal(api.sfxStats().active,0);api.setSfxPaused(false);
 }
 for(let i=0;i<50;i++){clock.currentTime+=.3;api.sfx('trainRoll');assert(api.sfxStats().active<=api.sfxStats().limit)}
 api.setSfxMuted(true);assert.equal(api.sfxStats().active,0);api.sfx('trainApproach');assert.equal(api.sfxStats().active,0);
});

test('rail PCM is finite, unclipped and fades to silence at both ends',()=>{
 for(const name of ['trainApproach','trainRoll','trainBrake','railBreech','railGunFire']){
  const pcm=railAudioSamples(name,12000);let peak=0,sum=0;
  for(const x of pcm){assert(Number.isFinite(x));peak=Math.max(peak,Math.abs(x));sum+=x*x;}
  assert(peak>.1&&peak<1,name);assert(sum/pcm.length>.0002,name);assert.equal(pcm[0],0);assert(Math.abs(pcm.at(-1))<.002);
 }
});

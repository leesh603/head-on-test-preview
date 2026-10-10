import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {railAudioSamples} from '../rail-audio.js?v=gal1';

function audioHarness(mobile=false){
 const created=[];const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(t){this.cancelAt=t},setTargetAtTime(value,time,smoothing){this.target=value;this.smoothing=smoothing}});
 const node=()=>{const n={frequency:param(),gain:param(),Q:{},connect(){},disconnect(){this.disconnected=true},start(){},stop(){this.stopped=true}};created.push(n);return n};
 const clock={currentTime:0,state:'running',sampleRate:48000,destination:{},resume:()=>Promise.resolve(),createGain:node,createDynamicsCompressor:node,createOscillator:node,createBiquadFilter:node,createBufferSource:node,createBuffer:(channels,length)=>{const data=new Float32Array(length);return{getChannelData:()=>data}}};
 const sandbox={window:{AudioContext:class{constructor(){return clock}},matchMedia:()=>({matches:mobile})},Math,Map,Promise,railAudioSamples};
 vm.createContext(sandbox);vm.runInContext(readFileSync(new URL('../sfx.js?v=gal1&rail=42',import.meta.url),'utf8').replace(/^import .*$/gm,'').replaceAll('export ','')+'\nthis.api={sfx,setSfxMuted,setSfxPaused,stopSfx,sfxStats,setSfxVolume,outputGain:()=>bus?.gain};',sandbox);
 return{api:sandbox.api,clock,created};
}

test('flight and close-pass voices share source budgets and stop on pause',()=>{
 const {api,clock,created}=audioHarness(true);
 for(const [voice,arg] of [['materialImpact','fabric'],['materialImpact','wood'],['materialImpact','metal'],['materialImpact',{material:'wood',streak:6}],['engineTick',{speed:.8,turn:4,damage:.8,duck:true}],['whizz'],['closePass'],['airframeBreak']]){
  api.stopSfx();clock.currentTime+=2;const before=created.length;api.sfx(voice,arg);assert(api.sfxStats().active>0,voice);const count=api.sfxStats().active;api.sfx(voice,arg);assert.equal(api.sfxStats().active,count,voice+' throttles');
  api.setSfxPaused(true);assert.equal(api.sfxStats().active,0);assert(created.slice(before).filter(n=>n.stopped).every(n=>n.disconnected));api.setSfxPaused(false);
 }
});


test('volume changes reach already-playing voices without new nodes or restarts',()=>{
 const {api,clock,created}=audioHarness(true);
 api.setSfxVolume(.5);api.sfx('kill');
 assert.equal(api.outputGain().value,.45);
 const count=created.length,voices=api.sfxStats().active;
 assert(voices>0);clock.currentTime=1;api.setSfxVolume(.2);
 assert(Math.abs(api.outputGain().target-.18)<1e-12);
 assert.equal(api.outputGain().smoothing,.015);
 assert.equal(created.length,count);assert.equal(api.sfxStats().active,voices);
 api.setSfxVolume(0);assert.equal(api.outputGain().target,0);
 api.setSfxVolume(1);assert.equal(api.outputGain().target,.9);
 api.stopSfx();assert.equal(api.sfxStats().active,0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {GamepadInput,HAPTIC_PATTERNS} from '../gamepad-input.js?v=478';
test('gamepad effects distinguish events without delaying input or replacing damage with gun chatter',()=>{
 const calls=[],pad={connected:true,mapping:'standard',index:0,axes:[1,0],buttons:Array(10).fill({pressed:false,value:0}),vibrationActuator:{playEffect:(...args)=>{calls.push(args);return Promise.resolve()},reset:()=>{calls.push(['reset'])}}};
 const input=new GamepadInput({getGamepads:()=>[pad]});assert.equal(input.poll().moveX,1);
 assert(input.pulse('hit',0));assert.equal(input.pulse('shot',10),false);assert(input.pulse('shot',100));assert.equal(input.pulse('shot',120),false);assert(input.pulse('pass',300));assert(input.pulse('explosion',400));
 assert.equal(new Set(calls.map(c=>c[1].duration)).size,4);assert.equal(input.poll().moveX,1);input.setFeedbackEnabled(false);assert.equal(calls.at(-1)[0],'reset');assert.equal(input.pulse('hit',600),false);
 assert(HAPTIC_PATTERNS.shot.strongMagnitude<HAPTIC_PATTERNS.hit.strongMagnitude);
});
test('unsupported/rejecting pads and touch vibration are optional and bounded',async()=>{
 const touch=[];const input=new GamepadInput({getGamepads:()=>[],vibrate:n=>touch.push(n)});input.useTouch();assert.equal(input.pulse('shot',0),false);assert(input.pulse('hit',0));assert.equal(input.pulse('hit',10),false);assert.deepEqual(touch,[22]);input.setFeedbackEnabled(false);assert.equal(touch.at(-1),0);
 const pad={connected:true,mapping:'standard',axes:[1,0],buttons:Array(10).fill({pressed:false,value:0}),vibrationActuator:{playEffect:()=>Promise.reject(new Error('unsupported'))}};
 const rejected=new GamepadInput({getGamepads:()=>[pad]});rejected.poll();assert(rejected.pulse('shot',0));await new Promise(resolve=>setImmediate(resolve));
});

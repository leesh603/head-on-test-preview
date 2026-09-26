// HEAD-ON thermal hotfix: rendering quality is independent of world coordinates.
// No temperature sensor, network telemetry, enemy cap or damage changes.
export const MOBILE_PERFORMANCE_REVISION='thermal-20260926-r1';
export const MOBILE_QUALITY_LEVELS=Object.freeze([
 Object.freeze({scale:.8,particles:260}),
 Object.freeze({scale:.65,particles:180}),
 Object.freeze({scale:.5,particles:120})
]);
export function readPerformanceOptions(search='',mobile=false){
 const q=new URLSearchParams(search),enabled=q.get('perf')!=='off';
 return Object.freeze({enabled,mobile,scale:enabled&&q.get('perfScale')!=='off',
  clock:enabled&&q.get('perfFps')!=='off',grid:enabled&&q.get('perfGrid')!=='off',
  fx:enabled&&q.get('perfFx')!=='off',debug:q.get('perfDebug')==='1',
  fps:mobile&&q.get('perfFps')!=='60'?30:60});
}
export function performanceCanvasSize(cssWidth,cssHeight,worldZoom,options,quality=0){
 const width=Math.max(240,Math.round(cssWidth/worldZoom));
 const height=Math.max(240,Math.round(cssHeight/worldZoom));
 const level=MOBILE_QUALITY_LEVELS[Math.min(2,Math.max(0,quality))];
 const scaled=options.mobile&&options.scale;
 return {width,height,backingWidth:scaled?Math.max(1,Math.round(cssWidth*level.scale)):width,
  backingHeight:scaled?Math.max(1,Math.round(cssHeight*level.scale)):height};
}
export class MobilePerformanceClock{
 constructor(options){
  this.options=options;this.step=1/60;this.quality=0;this.simulationSteps=0;this.rendered=0;
  this.droppedSeconds=0;this.qualityChanges=0;this.changed=false;this.sampleStart=null;
  this.sampleWork=0;this.sampleCount=0;this.sampleLate=0;this.healthyWindows=0;
  this.lastQualityChange=-Infinity;this.reset();
 }
 reset(now=null){this.last=now;this.accumulator=0;this.lastRender=null;this.running=false;this.renderState=null;}
 discard(){this.accumulator=0;}
 advance(now,running){
  if(!Number.isFinite(now))return 0;
  const elapsed=this.last===null||now<this.last?0:Math.max(0,(now-this.last)/1000);this.last=now;
  if(!running){this.accumulator=0;this.running=false;return 0;}
  // Inactive time and tab suspension never become catch-up simulation.
  if(!this.running){this.running=true;this.accumulator=0;return 0;}
  const accepted=Math.min(.1,elapsed);this.droppedSeconds+=elapsed-accepted;
  this.accumulator+=accepted;const count=Math.min(6,Math.floor((this.accumulator+1e-9)/this.step));
  this.accumulator=Math.max(0,this.accumulator-count*this.step);return count;
 }
 shouldRender(now,state='playing'){
  const fps=state==='playing'?this.options.fps:state==='hangar'?10:5;
  const interval=1000/fps;
  if(this.lastRender===null||this.renderState!==state||now<this.lastRender){
   this.lastRender=now;this.renderState=state;this.rendered++;return true;
  }
  const elapsed=now-this.lastRender;
  if(elapsed+0.25<interval)return false;
  // Preserve phase on 60/90/120 Hz screens instead of accidentally halving FPS.
  this.lastRender+=Math.max(1,Math.floor((elapsed+.25)/interval))*interval;
  if(this.lastRender>now+.25)this.lastRender=now;
  this.rendered++;return true;
 }
 sample(now,workMs,renderGapMs){
  if(!this.options.mobile||(!this.options.scale&&!this.options.fx))return;
  if(this.sampleStart===null){this.sampleStart=now;return;}
  this.sampleWork+=Math.max(0,workMs);this.sampleCount++;
  if(renderGapMs>1000/this.options.fps*1.45)this.sampleLate++;
  if(now-this.sampleStart<5000||this.sampleCount<30)return;
  const average=this.sampleWork/this.sampleCount,late=this.sampleLate/this.sampleCount;
  const overloaded=average>18||late>.15;
  const healthy=average<8&&late<.02;
  this.healthyWindows=healthy?this.healthyWindows+1:0;
  if(overloaded&&this.quality<2&&now-this.lastQualityChange>=10000){
   this.quality++;this.qualityChanges++;this.changed=true;this.lastQualityChange=now;this.healthyWindows=0;
  }else if(this.healthyWindows>=6&&this.quality>0&&now-this.lastQualityChange>=30000){
   this.quality--;this.qualityChanges++;this.changed=true;this.lastQualityChange=now;this.healthyWindows=0;
  }
  this.sampleStart=now;this.sampleWork=0;this.sampleCount=0;this.sampleLate=0;
 }
 particleLimit(){return this.options.mobile&&this.options.fx?MOBILE_QUALITY_LEVELS[this.quality].particles:450;}
 snapshot(){return {revision:MOBILE_PERFORMANCE_REVISION,mobile:this.options.mobile,targetFps:this.options.fps,
  quality:this.quality,scale:MOBILE_QUALITY_LEVELS[this.quality].scale,particles:this.particleLimit(),
  simulationHz:60,simulationSteps:this.simulationSteps,rendered:this.rendered,
  droppedSeconds:this.droppedSeconds,qualityChanges:this.qualityChanges};}
}

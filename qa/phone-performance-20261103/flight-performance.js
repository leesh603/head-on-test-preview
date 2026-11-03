// Opt-in flight diagnostics. No DOM, network, gameplay writes, or per-frame
// sample objects: only fixed histograms and bounded ten-second summaries.
const BIN_MS=.5,MAX_BIN_MS=1000,BIN_COUNT=2002;
const METRICS=['rafGapMs','drawGapMs','frameJsMs','updateMs','drawMs'];
const SKIPS=['limiter','hidden','inactive','transition','capture','error','other'];
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const rounded=value=>Number.isFinite(value)?Math.round(value*1000)/1000:0;

function histogram(){return{counts:new Uint32Array(BIN_COUNT),sums:new Float64Array(BIN_COUNT),count:0,sum:0,max:0};}
function clearHistogram(h){h.counts.fill(0);h.sums.fill(0);h.count=0;h.sum=0;h.max=0;}
function add(h,value){
 if(!finite(value)||value<0)return;
 const bin=Math.min(BIN_COUNT-1,Math.ceil(value/BIN_MS));
 h.counts[bin]++;h.sums[bin]+=value;h.count++;h.sum+=value;if(value>h.max)h.max=value;
}
function quantile(h,p){
 if(!h.count)return 0;
 const target=Math.max(1,Math.ceil(h.count*p));let n=0;
 for(let i=0;i<BIN_COUNT;i++){n+=h.counts[i];if(n>=target)return i===BIN_COUNT-1?h.max:i*BIN_MS;}
 return h.max;
}
function lowFps(h){
 if(!h.count)return 0;
 let left=Math.max(1,Math.ceil(h.count*.01)),sum=0;const n=left;
 for(let i=BIN_COUNT-1;i>=0&&left;i--){const take=Math.min(left,h.counts[i]);if(take){sum+=take*h.sums[i]/h.counts[i];left-=take;}}
 return sum>0?1000*n/sum:0;
}
function describe(h){return{count:h.count,mean:rounded(h.count?h.sum/h.count:0),p50:rounded(quantile(h,.5)),p95:rounded(quantile(h,.95)),p99:rounded(quantile(h,.99)),max:rounded(h.max),overflowCount:h.counts[BIN_COUNT-1]};}

// Reports accept only a small, plain snapshot. In particular, never retain or
// serialize a Game instance, cyclic context, DOM node, or arbitrary metadata.
function snapshot(input,depth=0){
 if(input==null||typeof input==='boolean')return input;
 if(typeof input==='string')return input.slice(0,512);
 if(typeof input==='number')return finite(input)?input:null;
 if(depth>=3||typeof input!=='object')return null;
 if(Array.isArray(input))return input.slice(0,32).map(value=>snapshot(value,depth+1));
 const proto=Object.getPrototypeOf(input);if(proto!==Object.prototype&&proto!==null)return null;
 const result={};let n=0;
 for(const key of Object.keys(input)){if(n++>=64)break;result[key.slice(0,80)]=snapshot(input[key],depth+1);}
 return result;
}
function accumulator(){
 const a={activeMs:0,rafCallbacks:0,renderedFrames:0,processedFrames:0,updateSteps:0,maxUpdateSteps:0,simulatedSeconds:0,slow33:0,slow50:0,slow100:0,skips:{},firstContext:null,lastContext:null,contextPeaks:{}};
 for(const key of METRICS)a[key]=histogram();for(const key of SKIPS)a.skips[key]=0;return a;
}
function clearAccumulator(a){
 a.activeMs=a.rafCallbacks=a.renderedFrames=a.processedFrames=a.updateSteps=a.maxUpdateSteps=a.simulatedSeconds=a.slow33=a.slow50=a.slow100=0;
 for(const key of METRICS)clearHistogram(a[key]);for(const key of SKIPS)a.skips[key]=0;
 a.firstContext=a.lastContext=null;a.contextPeaks={};
}
function applyContext(a,value){
 if(!a.firstContext)a.firstContext=value;a.lastContext=value;
 if(value)for(const key of Object.keys(value))if(finite(value[key]))a.contextPeaks[key]=Math.max(a.contextPeaks[key]??-Infinity,value[key]);
}
function summarize(a){
 const result={activeMs:rounded(a.activeMs),rafCallbacks:a.rafCallbacks,renderedFrames:a.renderedFrames,processedFrames:a.processedFrames,
  rafFps:rounded(a.activeMs?1000*a.rafGapMs.count/a.activeMs:0),drawFps:rounded(a.activeMs?1000*a.drawGapMs.count/a.activeMs:0),
  drawCadenceFps:rounded(a.drawGapMs.sum?1000*a.drawGapMs.count/a.drawGapMs.sum:0),onePercentLowFps:rounded(lowFps(a.drawGapMs)),
  slowDrawFrames:{over33_34ms:a.slow33,over50ms:a.slow50,over100ms:a.slow100},
  updateSteps:a.updateSteps,maxUpdateSteps:a.maxUpdateSteps,simulatedSeconds:rounded(a.simulatedSeconds),skips:{...a.skips},
  firstContext:a.firstContext,lastContext:a.lastContext,contextPeaks:{...a.contextPeaks}};
 for(const key of METRICS)result[key]=describe(a[key]);return result;
}

/**
 * Hooks are inert until start(). Call beginFrame once per native rAF, even when
 * its render is limited. active must be false for hidden, paused, upgrade,
 * transition and non-playing states. Never feed a setInterval capture clock.
 *
 * workStart/endFrame bracket the processed frame. updateStart/updateEnd bracket
 * the entire simulation batch; drawStart/drawEnd bracket real canvas drawing
 * (including its combat HUD). drawEnd counts a draw only once in that rAF.
 *
 * context() is sampled at most once a second. Use plain scalar stage/region,
 * entity-count, resolution and simulation-debt values, not gameplay objects.
 * read() is for occasional UI/export, never a per-frame call.
 */
export function createFlightRecorder({now=()=>performance.now(),context=()=>({}),bucketMs=10000,maxBuckets=360}={}){
 // Smaller bounds permit deterministic unit tests; callers cannot expand the
 // production memory bound (roughly one hour at ten-second windows).
 bucketMs=Math.min(10000,Math.max(100,finite(bucketMs)?bucketMs:10000));
 maxBuckets=Math.min(360,Math.max(1,Math.floor(finite(maxBuckets)?maxBuckets:360)));
 const total=accumulator(),current=accumulator(),buckets=[];
 let recording=false,measuring=false,metadata={},startedAt=0,stoppedAt=0,reason='not-started';
 let frameAt=0,lastRaf=null,lastDraw=null,identity=null,workAt=null,updateAt=null,drawAt=null;
 let frameUpdateMs=0,frameSteps=0,frameSimulation=0,drawRecorded=false,nextContextAt=0,currentStart=0,sceneKey=null,lastContext=null;
 function resetIntervals(){lastRaf=lastDraw=null;workAt=updateAt=drawAt=null;measuring=false;}
 function metric(key,value){add(total[key],value);add(current[key],value);}
 function skip(key){key=SKIPS.includes(key)?key:'other';total.skips[key]++;current.skips[key]++;}
 function closeBucket(){
  if(!(current.rafCallbacks||current.processedFrames||current.activeMs))return;
  const entry=summarize(current);entry.startActiveMs=rounded(currentStart);entry.endActiveMs=rounded(total.activeMs);buckets.push(entry);
  currentStart=total.activeMs;clearAccumulator(current);if(lastContext)applyContext(current,lastContext);
  if(buckets.length>=maxBuckets){recording=false;reason='capacity';stoppedAt=now();identity=null;resetIntervals();}
 }
 function sampleContext(timestamp){
  if(timestamp<nextContextAt)return;nextContextAt=timestamp+1000;
  let value;try{value=snapshot(context())}catch{value={contextError:true}}
  if(!value||typeof value!=='object')value={};
  const key=String(value.stage??value.stageNumber??'')+':'+String(value.region??'');
  if(sceneKey!==null&&key!==sceneKey){closeBucket();current.firstContext=current.lastContext=null;current.contextPeaks={};}
  if(!recording)return;sceneKey=key;lastContext=value;
  applyContext(total,value);applyContext(current,value);
 }
 const api={
  get recording(){return recording},get measuring(){return measuring},
  start(meta={}){
   clearAccumulator(total);clearAccumulator(current);buckets.length=0;metadata=snapshot(meta)||{};startedAt=now();stoppedAt=0;reason='recording';recording=true;
   identity=null;resetIntervals();frameAt=0;frameUpdateMs=frameSteps=frameSimulation=0;drawRecorded=false;nextContextAt=0;currentStart=0;sceneKey=null;lastContext=null;
   return true;
  },
  stop(why='manual'){
   if(recording){reason=String(why).slice(0,80);stoppedAt=now();closeBucket();recording=false;identity=null;resetIntervals();}
   return api.read();
  },
  beginFrame(timestamp,active,gameIdentity){
   if(!recording)return false;
   // Finish a window even if its final rAF was deliberately skipped.
   if(current.activeMs>=bucketMs)closeBucket();if(!recording)return false;
   if(!active||!finite(timestamp)){resetIntervals();identity=gameIdentity;return false;}
   if(identity!==gameIdentity){resetIntervals();identity=gameIdentity;nextContextAt=0;}
   sampleContext(timestamp);if(!recording)return false;
   measuring=true;frameAt=timestamp;workAt=updateAt=drawAt=null;frameUpdateMs=frameSteps=frameSimulation=0;drawRecorded=false;
   total.rafCallbacks++;current.rafCallbacks++;
   if(lastRaf!==null){const elapsed=timestamp-lastRaf;if(elapsed>=0){total.activeMs+=elapsed;current.activeMs+=elapsed;metric('rafGapMs',elapsed)}else lastDraw=null;}
   lastRaf=timestamp;return true;
  },
  workStart(){if(measuring)workAt=now();},
  updateStart(){if(measuring)updateAt=now();},
  updateEnd(steps=0,simulatedSeconds=0){
   if(!measuring||updateAt===null)return;
   frameUpdateMs+=Math.max(0,now()-updateAt);updateAt=null;
   if(finite(steps))frameSteps+=Math.max(0,steps);if(finite(simulatedSeconds))frameSimulation+=Math.max(0,simulatedSeconds);
  },
  drawStart(){if(measuring&&!drawRecorded)drawAt=now();},
  drawEnd(){
   if(!measuring||drawAt===null||drawRecorded)return;
   metric('drawMs',Math.max(0,now()-drawAt));drawAt=null;drawRecorded=true;total.renderedFrames++;current.renderedFrames++;
   if(lastDraw!==null){const gap=frameAt-lastDraw;if(gap>=0){metric('drawGapMs',gap);if(gap>33.34){total.slow33++;current.slow33++;}if(gap>50){total.slow50++;current.slow50++;}if(gap>100){total.slow100++;current.slow100++;}}}
   lastDraw=frameAt;
  },
  endFrame(totalJsMs){
   if(!measuring||workAt===null)return;
   metric('frameJsMs',finite(totalJsMs)?Math.max(0,totalJsMs):Math.max(0,now()-workAt));metric('updateMs',frameUpdateMs);
   total.processedFrames++;current.processedFrames++;total.updateSteps+=frameSteps;current.updateSteps+=frameSteps;
   total.maxUpdateSteps=Math.max(total.maxUpdateSteps,frameSteps);current.maxUpdateSteps=Math.max(current.maxUpdateSteps,frameSteps);
   total.simulatedSeconds+=frameSimulation;current.simulatedSeconds+=frameSimulation;measuring=false;workAt=updateAt=drawAt=null;
   if(current.activeMs>=bucketMs)closeBucket();
  },
  markSkip(why='other'){
   if(!recording)return;skip(why);
   if(why==='limiter'){measuring=false;workAt=updateAt=drawAt=null;if(current.activeMs>=bucketMs)closeBucket();}
  },
  resetGap(why){if(!recording)return;if(why)skip(why);resetIntervals();},
  read(){
   const pending=current.rafCallbacks||current.processedFrames||current.activeMs;
   const rows=buckets.slice();if(pending&&rows.length<maxBuckets){const row=summarize(current);row.startActiveMs=rounded(currentStart);row.endActiveMs=rounded(total.activeMs);rows.push(row);}
   return{schemaVersion:1,metadata:snapshot(metadata),status:recording?'recording':reason==='not-started'?'idle':'stopped',reason,activeMs:rounded(total.activeMs),
    wallMs:rounded(reason==='not-started'?0:Math.max(0,(recording?now():stoppedAt)-startedAt)),summary:summarize(total),buckets:rows,
    limits:{bucketMs,maxBuckets,maxActiveMs:bucketMs*maxBuckets,histogramBinMs:BIN_MS,histogramMaxMs:MAX_BIN_MS},
    definitions:{drawFps:'Completed game canvas draw intervals / active native-rAF time. Not physical panel presentation FPS.',
     activeMs:'Only consecutive visible playing callbacks; pause, hidden, transition and game-switch gaps are excluded.',
     drawCadenceFps:'1000 / mean completed-draw interval; use drawFps to include active time with no completed drawing.',
     onePercentLowFps:'1000 / mean of slowest ceil(1% of draw intervals); histogram boundary bin is approximated by its actual mean.',
     quantiles:'0.5 ms upper-bin estimates through 1000 ms; overflow quantiles use the observed maximum. Means and maxima use exact samples.',
     cpu:'JavaScript update / canvas submission plus combat HUD / whole processed-frame CPU time. GPU and compositor execution are not measured.',
     buckets:'Up to 360 summaries. Scene changes are sampled at most once per second and may split a window. Capacity stops recording.'}};
  }
 };
 return api;
}

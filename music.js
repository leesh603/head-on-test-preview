import {REGIONAL_VARIATIONS,ACE_MOTIFS,BOSS_ARRANGEMENTS,scorePitch} from './music-score.js?v=imm2';
export {musicContextForGame} from './music-context.js?v=imm2';
// Original adaptive score. Map themes share no borrowed soundtrack melodies.
// Modes: 'idle' | map regions (rural/sea/trench/city/sky/alps/zeebrugge) |
// 'boss' (enemy ace duel) | 'boss:<family>' for stage bosses.
export function musicModeForGame(game){
  if(!game||game.state!=='playing')return 'idle';
  const stages=game.stageBoss?.stages;
  if(stages?.phase==='boss')return 'boss:'+(BOSS_TRACKS[stages.bossId]||'fortress');
  if(game.enemies.some(e=>e.hp>0&&e.type==='boss'))return 'boss';
  return MAP_KEYS[game.worldRegion()]||'rural';
}
const MAP_KEYS=['rural','sea','trench','trench','city','sky','alps','zeebrugge','cambrai','arras','somme','london','verdun','maan','gallipoli','paris-night','jutland'];
// Stage-boss id -> score family. Related boss pairs share a family.
const BOSS_TRACKS={
 'paris-gun':'railgun',lincomparable:'railgun',
 'sms-stuttgart':'naval','hms-zubian':'naval',
 'a7v-flak':'landship','mark-v-cruiser':'landship',
 'drachen-net':'net','london-apron':'net',
 'zeppelin-l70':'airship',hma23:'airship',
 gik:'bomber',ca4:'bomber',
 'armored-harbor-fortress':'fortress',
 'fliegerzug':'railgun','treffas-wagen':'landship',
 'jasta11-circus':'duel','naval10-black-flight':'duel'
};
// Per-family tempo and bar-root progressions; each family also has its own
// pattern branch in bossStep.
const BOSS_SCORES={
 railgun:{bpm:64,ramp:56,roots:[28,28,25,28,30,28,25,24]},
 naval:{bpm:74,ramp:44,roots:[33,30,33,35,31,30,28,27]},
 landship:{bpm:84,ramp:48,roots:[31,31,34,31,29,31,28,30]},
 net:{bpm:100,ramp:30,roots:[35,33,38,35,31,33,30,32]},
 airship:{bpm:66,ramp:66,roots:[30,28,30,32,27,28,32,26]},
 bomber:{bpm:90,ramp:42,roots:[29,29,32,33,29,27,28,25]},
 fortress:{bpm:72,ramp:55,roots:[26,26,24,26,28,26,24,23]},
 duel:{bpm:78,ramp:72,roots:[33,30,33,32,29,30,32,28]}
};
const THEMES={
  rural:{bpm:88,steps:8,roots:[38,38,34,36,38,41,34,33],melody:[[62,65,64,62,57,58,57,53],[62,60,58,57,53,57,58,61],[65,64,62,60,58,57,53,57],[62,61,58,57,53,52,57,61]]},
  sea:{bpm:78,steps:12,roots:[33,33,29,32,33,36,29,28],melody:[[57,60,59,57,53,52],[53,57,55,53,52,48],[55,58,57,55,52,50],[52,55,53,52,48,47]]},
  trench:{bpm:84,steps:8,roots:[38,38,34,37,38,41,34,33],melody:[[62,65,69,68],[65,62,60,57],[62,69,72,70],[65,64,61,57]]},
  city:{bpm:96,steps:8,roots:[40,40,36,38,40,43,36,35],melody:[[64,67,66,64,60,62,60,57],[64,62,60,57,55,60,62,63],[67,66,64,62,60,57,55,57],[64,63,60,57,55,55,60,62]]},
  sky:{bpm:92,steps:8,roots:[41,41,38,36,41,45,38,36],melody:[[65,69,72,71,65,62,60,62],[69,71,72,69,65,64,62,64],[72,71,69,65,64,62,60,62],[65,64,62,60,59,60,62,64]]},
  alps:{bpm:78,steps:8,roots:[40,40,36,38,40,43,36,33],melody:[[64,67,64,62,59,60,59,57],[64,62,60,59,57,60,62,64],[67,64,62,60,59,57,55,57],[64,62,60,59,57,55,57,59]]},
  zeebrugge:{bpm:70,steps:12,roots:[31,31,28,31,29,31,28,26],melody:[[55,58,57,55,52,50],[53,55,52,50,48,46],[55,60,58,55,52,50],[52,55,52,50,48,46]]}
};
const originalKey=id=>id==='trenches'?'trench':id;
const BOSS_TEMPO={railgun:108,naval:96,landship:104,net:110,airship:92,bomber:112,fortress:98,duel:118};
const familyFor=id=>BOSS_TRACKS[id]||({rail:'railgun',naval:'naval',split:'naval',armor:'landship',siege:'fortress',net:'net',airship:'airship',bomber:'bomber',formation:'duel',searchlight:'net'}[BOSS_ARRANGEMENTS[id]?.mechanic])||id;
export const MUSIC_THEME_IDS=Object.freeze([...Object.keys(THEMES).filter(k=>k!=='trench'),'trenches',...Object.keys(REGIONAL_VARIATIONS)]);
export class BattleMusic {
  constructor(){this.mode='idle';this.muted=false;this.step=0;this.next=0;this.timer=null;this.track=null;this.positions={};this.scene=null;this.seenAces=new WeakSet();this.intensity=.2;this.signatureCount=0;this.pulseCount=0;this.volume=1;this.voices=new Set();this.noteGain=1;this.errors=[];}
  unlock(){try{if(!this.ctx){
    this.ctx=new (window.AudioContext||window.webkitAudioContext)();
    this.bus=this.ctx.createGain();this.bus.gain.value=0;
    const comp=this.ctx.createDynamicsCompressor();this.bus.connect(comp);comp.connect(this.ctx.destination);
    this.meter=this.ctx.createAnalyser();this.meter.fftSize=256;comp.connect(this.meter);this.meterData=new Float32Array(256);
    this.noise=this.ctx.createBuffer(1,this.ctx.sampleRate,this.ctx.sampleRate);
    const d=this.noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    this.timer=setInterval(()=>this.schedule(),50);
  }this.ctx.resume().catch(error=>{this.errors=[error.message];});}catch(error){this.errors=[error.message];}}
  trackVoice(source,gain,filter,start,layer){
    const voice={source,gain,filter,start,layer};this.voices.add(voice);
    source.onended=()=>{source.disconnect();gain.disconnect();filter.disconnect();this.voices.delete(voice);};
  }
  stopVoices(predicate=()=>true,fade=.08){
    const now=this.ctx?.currentTime||0;
    for(const voice of this.voices)if(predicate(voice)){
      const g=voice.gain.gain;
      if(g.cancelAndHoldAtTime)g.cancelAndHoldAtTime(now);else{g.cancelScheduledValues(now);g.setValueAtTime(g.value,now);}
      g.linearRampToValueAtTime(0,now+fade);
      try{voice.source.stop(voice.start>now?now:now+fade+.01);}catch{}
    }
  }
  changeLayer(now,fade=.8){
    if(!this.ctx?.createGain)return;
    if(this.retiring){this.stopVoices(v=>v.layer===this.retiring,.02);this.retiring.disconnect();}
    const old=this.layer;
    if(old){old.gain.cancelScheduledValues(now);old.gain.setTargetAtTime(0,now,fade/4);this.stopVoices(v=>v.layer===old,fade);this.retiring=old;
      setTimeout(()=>{old.disconnect();if(this.retiring===old)this.retiring=null;},(fade+.15)*1000);}
    this.layer=this.ctx.createGain();this.layer.gain.setValueAtTime(0,now);this.layer.gain.linearRampToValueAtTime(1,now+fade);this.layer.connect(this.bus);
  }
  reset(){
    this.stopVoices();this.setState('idle',this.muted);this.layer?.disconnect();this.layer=null;
    this.scene=null;this.run=null;this.positions={};this.track=null;this.step=0;this.intensity=.2;
    this.seenAces=new WeakSet();this.intro=null;this.signatureCount=0;this.pulseCount=0;this.lastPulse=null;this.pendingPulse=false;this.tempo=null;this.noteGain=1;
  }
  setScene(scene,muted=false){
    if(scene?.run&&this.run&&scene.run!==this.run)this.reset();
    if(scene?.run)this.run=scene.run;
    const previous=this.scene;
    if(previous?.state==='BOSS_FINAL'&&scene?.encounterId&&scene.encounterId===previous.encounterId)scene={...scene,state:'BOSS_FINAL'};
    if(previous?.ace!==scene?.ace||scene?.state!=='ACE')this.intro=null;
    this.scene=scene;
    if(scene?.pulse&&scene.pulse!==this.lastPulse){this.pendingPulse=true;this.lastPulse=scene.pulse;}
    if(!scene?.pulse)this.pendingPulse=false;
    const inactive=!scene||scene.state==='IDLE';
    if(inactive||muted)this.intro=null;
    const mode=inactive?'idle':scene.state==='ACE'?'boss':scene.state==='BOSS'||scene.state==='BOSS_FINAL'?'boss:'+scene.bossId:scene.theme;
    this.setState(mode,muted);
  }
  setVolume(value){this.volume=Math.max(0,Math.min(1,Number.isFinite(value)?value:1));this.setState(this.mode,this.muted);}
  status(){let rms=0,peak=0;if(this.meter){this.meter.getFloatTimeDomainData(this.meterData);for(const v of this.meterData){rms+=v*v;peak=Math.max(peak,Math.abs(v));}rms=Math.sqrt(rms/this.meterData.length);}
    return {theme:this.scene?.theme,state:this.mode==='idle'?'IDLE':this.scene?.state,mode:this.mode,muted:this.muted,volume:this.volume,rms,peak,
    ready:!!this.ctx,engine:'original-synth',context:this.ctx?.state||'locked',errors:this.errors,
    voices:this.voices.size,step:this.step,bpm:this.tempo,intensity:this.intensity,signatureCount:this.signatureCount,pulseCount:this.pulseCount,bossId:this.scene?.bossId,aceId:this.scene?.aceId};}
  bossTrack(){return this.mode==='boss'?'duel':this.mode.startsWith('boss:')?familyFor(this.mode.slice(5)):null}
  setState(mode,muted){
    if(mode==='flight'||mode==='ace')mode='rural';
    const isBoss=mode==='boss'||mode.startsWith('boss:');
    if(mode!=='idle'&&!isBoss&&!THEMES[originalKey(mode)]&&!REGIONAL_VARIATIONS[mode])mode='rural';
    const now=this.ctx?.currentTime||0;
    if(mode!==this.mode){
      if(this.mode!=='idle')this.positions[this.mode]=this.step;
      if(mode!=='idle'){
        const resume=this.mode==='idle'&&this.track===mode;
        this.step=resume?this.positions[mode]||0:isBoss?0:this.positions[mode]||0;
        if(isBoss){if(!resume)this.bossSince=now;else if(this.pausedAt!=null)this.bossSince+=now-this.pausedAt;}
        // A fresh gain bus fades the previous arrangement without a hard cut.
        this.changeLayer(now,1.1);
        this.track=mode;this.next=now+.02;
        if(!isBoss)this.tempo=(THEMES[originalKey(mode)]||REGIONAL_VARIATIONS[mode]).bpm;
      }else this.pausedAt=now;
    }
    this.mode=mode;this.muted=muted;
    if(mode==='idle'||muted)this.stopVoices();
    if(this.ctx)this.bus.gain.setTargetAtTime(mode==='idle'||muted?0:.88*this.volume,now,.08);
  }
  tone(midi,time,duration,volume,type='sawtooth',cutoff=1500,attack=.025){
    if(this.voices.size>=96)return;
    volume*=this.noteGain;
    const c=this.ctx,o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();
    o.type=type;o.frequency.value=440*2**((midi-69)/12);f.type='lowpass';f.frequency.value=cutoff;
    g.gain.setValueAtTime(.0001,time);g.gain.linearRampToValueAtTime(volume,time+Math.min(attack,duration*.35));
    g.gain.exponentialRampToValueAtTime(.0001,time+duration);
    o.connect(f);f.connect(g);g.connect(this.layer||this.bus);o.start(time);o.stop(time+duration+.03);
    this.trackVoice(o,g,f,time,this.layer);
  }
  drum(time,snare=false,volume=1){
    if(!snare){const heavy=!!this.bossTrack();this.tone(heavy?28:35,time,heavy?.42:.26,.32*volume,'sine',heavy?145:190,heavy?.012:.006);return}
    const c=this.ctx,n=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
    n.buffer=this.noise;f.type='bandpass';f.frequency.value=this.bossTrack()?850:1900;f.Q.value=this.bossTrack()?.8:.6;
    g.gain.setValueAtTime(.13*volume*this.noteGain,time);g.gain.exponentialRampToValueAtTime(.0001,time+.16);
    n.connect(f);f.connect(g);g.connect(this.layer||this.bus);n.start(time);n.stop(time+.17);
    this.trackVoice(n,g,f,time,this.layer);
  }
  // Continuous regional ambience: a filtered-noise bed under each map's score.
  // Each entry: [bandpass center Hz, Q, peak gain, optional second layer freq].
  amb(mode,t,dur){
    if(!this.noise)return;
    const A={rural:[170,1.1,.02],sea:[230,.6,.055],trench:[150,.9,.04],city:[340,1.6,.016],sky:[950,.35,.06],alps:[1250,.4,.05],zeebrugge:[270,.6,.05]}[mode]||[300,1,.02];
    const c=this.ctx,n=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
    n.buffer=this.noise;n.loop=true;n.playbackRate.value=.9+Math.random()*.2;
    f.type='bandpass';f.frequency.setValueAtTime(A[0],t);f.frequency.linearRampToValueAtTime(A[0]*(0.85+Math.random()*.3),t+dur);f.Q.value=A[1];
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(A[2],t+Math.min(dur*.35,2.5));g.gain.linearRampToValueAtTime(.0001,t+dur);
    n.connect(f);f.connect(g);g.connect(this.layer||this.bus);n.start(t);n.stop(t+dur+.05);
    this.trackVoice(n,g,f,t,this.layer);
  }
  mapStep(mode,i,t,b){
    const s=THEMES[mode],bar=Math.floor(i/s.steps),p=i%s.steps,section=Math.floor(bar/8)%4;
    const root=s.roots[bar%8],melody=s.melody[Math.floor(bar/2)%4];
    const open=section===2,full=section===1||section===3;
    if(p===0){
      this.amb(mode,t,b*s.steps);
      this.tone(root-12,t,b*s.steps*.8,.19,'triangle',450);
      for(const off of [0,3,7])this.tone(root+off,t,b*s.steps*.95,.028,'sawtooth',mode==='sea'?850:mode==='zeebrugge'?500:650,.24);
    }
    if(p===6&&(mode==='sky'||mode==='alps'||mode==='sea'||mode==='zeebrugge'))this.amb(mode,t,b*(s.steps-6));
    if(mode==='rural'){
      // Low bowed pulse and restrained horn calls: a weary battlefield march.
      if(p%2===0||(!open&&p===7))this.tone(root+[0,0,7,0,0,0,3,1][p],t,b*1.35,.13,'sawtooth',560,.055);
      if(p===0||p===4)this.drum(t,false,.95);
      if(p===6&&!open)this.drum(t,true,.55);
      if(p===0||p===4){const n=melody[p/4+(bar%4)*2];this.tone(n,t,b*3.7,.085,'sawtooth',850,.22);if(full)this.tone(n-12,t,b*3.4,.055,'triangle',500,.15)}
      if(full&&p===7)this.drum(t+b*.5,true,.32);
    }else if(mode==='sea'){
      // Long dark swells over a slow naval pulse, without bright plucked arpeggios.
      if(p===0||p===6){this.drum(t,false,1.05);this.tone(root,t,b*5.7,.16,'sawtooth',390,.3)}
      if(p===3||p===9)this.tone(root+7,t,b*2.7,.095,'triangle',440,.16);
      if(p%4===0&&!open)this.tone(melody[(p/4+bar%2*3)%6],t,b*3.8,.075,'sawtooth',720,.3);
      if(full&&p===6)for(const off of [12,13])this.tone(root+off,t,b*5.5,.032,'sawtooth',650,.4);
      if(p===11&&bar%2===1)this.drum(t,true,.3);
    }else if(mode==='trench'){
      if(p%2===0)this.drum(t,p===2||p===6,.95);
      if(p===3||p===7)this.drum(t+b*.65,true,.35);
      if(!open||p%2===0)this.tone(root+[0,0,7,0,0,3,7,1][p],t,b*.55,.14,'sawtooth',470,.009);
      if(p%2===0&&bar%2===0)this.tone(melody[p/2]-12,t,b*1.8,.11,'sawtooth',750,.12);
      if(full&&p===6)this.tone(root+19,t,b*2,.06,'triangle',1500);
    }else if(mode==='city'){
      // Barrage over the rooftops: martial snare discipline and watchtower calls.
      if(p%2===0)this.drum(t,p===4,.9);
      if(!open&&p===7)this.drum(t+b*.5,true,.4);
      if(p===0||p===5)this.tone(root,t,b*2.2,.13,'sawtooth',540,.05);
      if(p===0||p===5){const n=melody[(p/5+bar*2)%8];this.tone(n,t,b*3,.08,'square',1100,.18)}
      if(full&&p===3)this.tone(root+12,t,b*2,.05,'sawtooth',1400,.1);
    }else if(mode==='sky'){
      // Thin cold air over the ceiling: open fifths and long gliding calls.
      if(p===0){this.tone(root-12,t,b*6,.12,'sine',500,.5);this.tone(root,t,b*7,.09,'triangle',800,.6)}
      if(p===4)this.tone(root+7,t,b*5,.07,'triangle',900,.4);
      if(p===0||p===5){const n=melody[(bar*2+p/5)%8];this.tone(n+12,t,b*4.5,.07,'sawtooth',1600,.35)}
      if(!open&&p===7)this.drum(t,false,.5);
      if(full&&p===3)this.tone(root+19,t,b*3,.04,'sine',2200,.3);
    }else if(mode==='alps'){
      // Mountain patrol: horn calls answered by an echo one beat later.
      if(p===0)this.tone(root-12,t,b*7,.14,'triangle',300,.5);
      if(p===0||p===4){const n=melody[(bar+p/4)%8];this.tone(n,t,b*3.4,.09,'sawtooth',900,.3);this.tone(n,t+b*1.1,b*2,.04,'sawtooth',900,.3)}
      if(!open&&p===6)this.drum(t,false,.6);
      if(full&&p===6)this.tone(root+24,t,b*2.4,.035,'sine',1900,.4);
    }else{
      // Zeebrugge harbour at night: tide pulse, hull clangs, low watch horns.
      if(p===0||p===6){this.drum(t,false,1.2);this.tone(root,t,b*6,.18,'sawtooth',330,.35)}
      if(p===3)this.tone(root+7,t,b*3,.08,'triangle',380,.25);
      if(p===9)this.drum(t,true,.5);
      if(!open&&p===10)this.tone(root+12,t,b*2,.06,'square',600,.1);
      if(full&&p===6)for(const off of [12,13])this.tone(root+off,t,b*5,.03,'sawtooth',600,.4);
      if(p===11&&bar%2===1)this.drum(t,true,.35);
    }
  }
  bossStep(i,t,b,elapsed){
    const name=this.bossTrack(),T=BOSS_SCORES[name]||BOSS_SCORES.duel;
    const p=i%16,bar=Math.floor(i/16),root=Math.max(34,Math.min(43,T.roots[bar%8]+5));
    this.scoreRoot=root;
    const final=this.scene?.state==='BOSS_FINAL',pressure=Math.max(.5,this.intensity),gain=.19+pressure*.055;
    // Original low-string figures: uneven breath, semitone friction and tritones.
    // Fixed threat harmony replaces the map's pastoral melodic progression.
    const pulses={railgun:[0,2,3,6,8,10,11,14],naval:[0,2,5,8,10,13],landship:[0,3,4,8,11,12],net:[0,2,6,8,10,14],airship:[0,3,7,8,11,15],bomber:[0,2,4,7,8,10,12,15],fortress:[0,2,5,8,11,14],duel:[0,2,3,6,8,10,11,14]};
    const rhythm=pulses[name]||pulses.fortress,slot=rhythm.indexOf(p);
    if(p===0){
      this.tone(root-12,t,b*14,.085,'triangle',220,.16);
      this.tone(root+12,t,b*12,.052,'sawtooth',680,.38);
      this.tone(root+13,t+b*.5,b*10,.025,'sawtooth',640,.5);
    }
    if(slot>=0){
      const off=[0,0,1,0,6,1,0,1][(slot+bar%2)%8];
      this.tone(root+off,t,b*(final?.82:1.18),gain,'sawtooth',final?920:720,.022);
      this.tone(root-12+off,t,b*.95,.075,'triangle',240,.015);
    }
    if(p===0||p===8)this.drum(t,false,1.15);
    if(p===6||p===14)this.drum(t,true,final?.7:.4);
    if(p===5||p===13)this.tone(root+6,t,b*2.3,.055,'square',470,.14);
    if(final&&(p===7||p===15)){
      this.tone(root+1,t,b*.55,.15,'sawtooth',1000,.015);
      this.drum(t+b*.5,false,.7);
    }
    if(this.scene){this.bossVariation(i,t,b,root);this.aceSignature(i,t,b,root);}
  }
  mapRoot(id,bar){
    const old=THEMES[originalKey(id)];if(old)return old.roots[bar%old.roots.length];
    const s=REGIONAL_VARIATIONS[id];return s?scorePitch(s,s.harmony[Math.floor(bar/2)%s.harmony.length])-12:38;
  }
  voice(name,midi,t,duration,volume){
    const shape={horn:['sawtooth',850,.18],trumpet:['sawtooth',1200,.06],trombone:['square',520,.08],strings:['sawtooth',950,.2],spiccato:['sawtooth',650,.012],cello:['triangle',440,.18],bassoon:['triangle',500,.09],oboe:['square',850,.14],clarinet:['triangle',850,.1],harp:['triangle',1200,.02],bell:['sine',700,.012],metal:['square',650,.01]}[name]||['triangle',650,.1];
    this.tone(midi,t,duration,volume,...shape);
  }
  regionalStep(mode,i,t,b){
    const s=REGIONAL_VARIATIONS[mode],n=s.beats*2,p=i%n,bar=Math.floor(i/n),section=Math.floor(bar/8)%4;
    const chord=s.harmony[Math.floor(bar/2)%s.harmony.length],root=scorePitch(s,chord)-12;
    if(p===0){
      this.tone(root-12,t,b*n*.8,.19,'triangle',450);
      for(const off of [0,3,7])this.tone(root+off,t,b*n*.95,.028,'sawtooth',550,.24);
    }
    const slot=s.rhythm.indexOf(p);
    if(slot>=0){
      const degree=s.motif[(bar*s.rhythm.length+slot+Math.floor(bar/32)*3)%s.motif.length];
      if(section!==2||slot%2===0)this.voice(s.lead,scorePitch(s,degree+chord),t,b*1.8,.075);
      this.voice(s.pulse,root+(slot%2?7:0),t,b*.8,.08);
    }
    if(s.drums.includes(p))this.drum(t,false,.85);
    if(section!==2&&p===n-2)this.drum(t,true,.4);
  }
  combatStep(mode,i,t,b){
    // Add an audible, regular groove on the same clock as the original song.
    // Rural CALM never calls this, preserving its original notes and mix.
    if(this.intensity<.3)return;
    const s=THEMES[originalKey(mode)],extra=REGIONAL_VARIATIONS[mode],n=s?.steps||extra?.beats*2||8;
    const p=i%n,root=this.mapRoot(mode,Math.floor(i/n)),drive=Math.min(1,(this.intensity-.25)/.5);
    const pattern=this.scene?.pattern,heavy=pattern==='BOMBER_RUN'||pattern==='HEAD_ON_PASS';
    const chase=pattern==='CHASE',escort=pattern==='ESCORT';
    const beats=extra?.rhythm||({rural:[1,3,5,7],sea:[0,3,6,9],trench:[1,3,5,7],city:[0,2,5,7],sky:[0,3,6],alps:[0,4,6],zeebrugge:[0,2,6,8,10]}[originalKey(mode)]||[0,2,4,6]);
    if(beats.includes(p)||(chase&&p%2===1))this.tone(root+(p%4===3?7:0),t,b*.65,.095*drive*(escort?.65:1),'sawtooth',680,.018);
    if(p===2||p===n-2)this.drum(t,true,.65*drive);
    if(heavy&&p%4===0)this.drum(t,false,.45*drive);
    if((pattern==='CROSS_ATTACK'||pattern==='PINCER')&&p===Math.floor(n/2))this.tone(root+19,t,b*1.4,.045*drive,'sawtooth',950,.06);
  }
  bossVariation(i,t,b,root){
    const scene=this.scene,B=BOSS_ARRANGEMENTS[scene?.bossId];if(!B)return;
    const p=i%16,bar=Math.floor(i/16),final=scene.state==='BOSS_FINAL',parts=scene.parts??1;
    const base=root;
    const q=d=>base+[0,1,6,1,0,6,1][((d%7)+7)%7];
    if(B.steps.includes(p)&&(!final||p%2===0))this.voice(final?'trombone':B.mechanic==='airship'?'cello':'bassoon',q(B.notes[(bar+p)%B.notes.length]),t,b*(final?1.2:1.8),.065+.02*parts);
    if(B.mechanic==='rail'){
      for(const [car,step,offset] of [['car-rear',1,12],['car-middle',5,7],['car-front',9,0]])
        if(scene.cars?.[car]&&p===step)this.tone(root+offset,t,b*.45,.055,'square',450,.015);
      if(final&&p%4===0)this.tone(root-12,t,b*.55,.1,'triangle',280,.03);
    }
    if(B.mechanic==='bomber'&&p%2===0)this.tone(root,t,b*.35,.07*(scene.engines??1),'sawtooth',400,.018);
    if(B.mechanic==='formation'&&p===8&&(scene.formation??1)>.3)this.voice('trombone',root+6,t,b*2,.045*(scene.formation??1));
    if(scene.locked&&p%4===2){this.drum(t,true,.6);this.voice('trombone',root+13,t,b,.05);}
    if(final&&p===14)this.voice('trombone',q(B.notes[bar%B.notes.length]),t,b*1.4,.08);
  }
  aceSignature(i,t,b,root){
    const scene=this.scene,a=ACE_MOTIFS[scene?.aceId];if(scene?.state!=='ACE'||!a||!scene.ace)return;
    const pitch=d=>root+[0,1,3,6,7,8,10][d%7]+Math.min(3,2*Math.floor(d/7));
    const voice=['trumpet','horn','trombone'].includes(a.instrument)?'trombone':['strings','spiccato'].includes(a.instrument)?'spiccato':'bassoon';
    if(!this.seenAces.has(scene.ace)&&i%8===0){
      this.seenAces.add(scene.ace);this.signatureCount++;
      this.intro={start:i,ticks:Math.max(a.notes.length,Math.round(a.seconds/b)),delay:scene.aceId==='ball'?2:0};
    }
    const intro=this.intro;
    if(intro){
      const elapsed=i-intro.start-intro.delay;
      for(let k=0;k<a.notes.length;k++)if(elapsed===Math.floor(k*(intro.ticks-intro.delay)/a.notes.length)){
        const d=a.notes[k];
        this.voice(voice,pitch(d),t,Math.min(b*2,1.2),.09*a.accents[k]);
      }
      if(i-intro.start>=intro.ticks)this.intro=null;
    }else if(i%16===8){const d=a.notes[Math.floor(i/16)%a.notes.length];this.voice(voice,pitch(d),t,b*1.6,.045);}
  }
  schedule(){
    if(!this.ctx||this.ctx.state!=='running')return;
    const now=this.ctx.currentTime;if(this.mode==='idle'||this.muted){this.next=now;return}
    if(this.next<now)this.next=now+.015;
    while(this.next<now+.15){
      const elapsed=Math.max(0,now-(this.bossSince||0));
      const bossT=this.bossTrack(),T=bossT?BOSS_SCORES[bossT]||BOSS_SCORES.duel:null;
      const map=THEMES[originalKey(this.mode)]||REGIONAL_VARIATIONS[this.mode]||THEMES.rural;
      const targetTempo=T?BOSS_TEMPO[bossT]+Math.min(18,elapsed*.55)+(this.scene?.urgency||0)*8+(this.scene?.state==='BOSS_FINAL'?8:0):map.bpm;
      // Every boss and ace uses the same restrained acceleration and dark mix.
      this.tempo=this.scene?(this.tempo??targetTempo)+(targetTempo-(this.tempo??targetTempo))*.12:targetTempo;
      const b=60/this.tempo/2;
      const i=this.step++,t=this.next;
      const target=this.scene?.phase==='cooldown'?this.scene.intensity*.55:this.scene?.intensity??.2;
      this.intensity+=(target-this.intensity)*(1-Math.exp(-b/(target>this.intensity?.65:1.8)));
      // The score and every combat accent share this clock and current root.
      const loss=this.scene?.parts??1,engines=this.scene?.engines??1;
      this.noteGain=T&&this.scene?.state!=='ACE'?.72+.28*loss:1;
      if(T&&this.bossTrack()==='bomber')this.noteGain*=.7+.3*engines;
      if(this.scene?.aceId==='ball'&&this.intro)this.noteGain*=.6;
      if(T)this.bossStep(i,t,b,elapsed);
      else if(REGIONAL_VARIATIONS[this.mode])this.regionalStep(this.mode,i,t,b);
      else this.mapStep(originalKey(this.mode),i,t,b);
      this.noteGain=1;
      if(!T&&this.scene)this.combatStep(this.mode,i,t,b);
      if(this.pendingPulse&&i%2===0){
        this.pendingPulse=false;this.pulseCount++;
        this.tone((this.scoreRoot||this.mapRoot(this.scene?.theme,Math.floor(i/8)))+(T?1:19),t,b*.7,.045,'triangle',T?600:900,.04);
      }
      this.next+=b;
    }
  }
}

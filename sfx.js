// Layered procedural SFX — every combat feedback voice is synthesized from
// oscillators plus filtered noise, matching the music.js approach. No audio
// assets, no external requests.
let ctx=null,bus=null,noise=null,active=0,muted=false,master=1;
export function setSfxMuted(v){muted=v}
export function setSfxVolume(v){master=Math.max(0,Math.min(1,v))}
function ac(){
  if(ctx)return ctx.state;
  try{
    ctx=new (window.AudioContext||window.webkitAudioContext)();
    bus=ctx.createGain();bus.gain.value=.9;
    const comp=ctx.createDynamicsCompressor();bus.connect(comp);comp.connect(ctx.destination);
    noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);
    const d=noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  }catch{}
  return ctx?.state;
}
function tone(f0,f1,d,v,type='square',cut=1600,when=0,att=.004){
  if(active>28)return;
  const j=.94+Math.random()*.12;f0*=j;if(f1!==f0)f1*=j;
  const t=ctx.currentTime+when,o=ctx.createOscillator(),g=ctx.createGain();
  o.type=type;o.frequency.setValueAtTime(f0,t);if(f1!==f0)o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+d);
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v*master,t+Math.min(att,d*.3));g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(g);g.connect(bus);o.start(t);o.stop(t+d+.03);
  active++;o.onended=()=>{active--;o.disconnect();g.disconnect()};
}
function hiss(f0,f1,d,v,type='bandpass',Q=.8,when=0,att=.003){
  if(active>28)return;
  const t=ctx.currentTime+when,n=ctx.createBufferSource(),g=ctx.createGain(),f=ctx.createBiquadFilter();
  n.buffer=noise;n.loop=true;
  f.type=type;f.frequency.setValueAtTime(f0,t);if(f1!==f0)f.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+d);f.Q.value=Q;
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v*master,t+Math.min(att,d*.3));g.gain.exponentialRampToValueAtTime(.0001,t+d);
  n.connect(f);f.connect(g);g.connect(bus);n.start(t);n.stop(t+d+.03);
  active++;n.onended=()=>{active--;n.disconnect();f.disconnect();g.disconnect()};
}
// Original pre-layering voices: one oscillator per event, the game's first
// envelope shape (f -> f*.45 exponential, gain -> .001), ~±6% pitch jitter
// applied inside tone(). Keep to single tones — no noise layers, no chords.
const VOICES={
  shot(){tone(120,54,.035,.133,'square')},
  enemyShot(){tone(85,38,.065,.185,'sawtooth')},
  heavyShot(){tone(85,38,.065,.518,'sawtooth')},
  impact(){tone(210,95,.055,.48,'triangle')},
  hit(){tone(110,50,.1,.26,'sawtooth')},
  kill(){tone(80,36,.1,.26,'square')},
  explosion(){tone(48,22,.25,.518,'sawtooth')},
  rocket(){tone(190,86,.065,.518,'sawtooth')},
  flak(){tone(600,270,.17,.26,'triangle')},
  skill(){tone(350,158,.3,.26,'sawtooth')},
  reload(){tone(160,72,.14,.44,'triangle')},
  loaded(){tone(560,252,.1,.26,'triangle')},
  levelup(){tone(880,396,.2,.26,'triangle')},
  wave(){tone(600,270,.17,.26,'triangle')},
  ally(){tone(600,270,.17,.26,'triangle')},
  pickup(){tone(750,338,.12,.26,'triangle')},
  bossSting(){tone(90,40,.6,.2,'sawtooth')},
  launch(){tone(520,234,.15,.26,'square')},
  balloon(){tone(80,36,.12,.26,'square')},
  heal(){tone(960,432,.09,.2,'triangle')},
  engineTick(reload){const f=reload?58:76;tone(f,f*.45,.13,.133,'sawtooth');tone(f*2.05,f*.92,.08,.067,'triangle')},
  victory(){tone(660,297,.4,.15,'triangle')},
  defeat(){tone(140,63,.5,.15,'sawtooth')}
};
export function sfx(name,arg){
  if(muted||!VOICES[name])return;
  if(!ctx&&ac()===undefined)return;
  if(!ctx)return;
  try{ctx.resume()}catch{}
  try{VOICES[name](arg)}catch{}
}

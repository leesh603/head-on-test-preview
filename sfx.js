// Layered procedural SFX — every combat feedback voice is synthesized from
// oscillators plus filtered noise, matching the music.js approach. No audio
// assets, no external requests.
let ctx=null,bus=null,noise=null,active=0,muted=false,master=1;
const jit=f=>f*(0.94+Math.random()*0.12); // ±6% pitch drift so repeat hits never sound identical
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
  if(active>44)return;
  const t=ctx.currentTime+when,o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();
  o.type=type;o.frequency.setValueAtTime(f0,t);if(f1!==f0)o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+d);
  f.type='lowpass';f.frequency.value=cut;
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v*master,t+Math.min(att,d*.3));g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(f);f.connect(g);g.connect(bus);o.start(t);o.stop(t+d+.03);
  active++;o.onended=()=>{active--;o.disconnect();f.disconnect();g.disconnect()};
}
function hiss(f0,f1,d,v,type='bandpass',Q=.8,when=0,att=.003){
  if(active>44)return;
  const t=ctx.currentTime+when,n=ctx.createBufferSource(),g=ctx.createGain(),f=ctx.createBiquadFilter();
  n.buffer=noise;n.loop=true;
  f.type=type;f.frequency.setValueAtTime(f0,t);if(f1!==f0)f.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+d);f.Q.value=Q;
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v*master,t+Math.min(att,d*.3));g.gain.exponentialRampToValueAtTime(.0001,t+d);
  n.connect(f);f.connect(g);g.connect(bus);n.start(t);n.stop(t+d+.03);
  active++;n.onended=()=>{active--;n.disconnect();f.disconnect();g.disconnect()};
}
const VOICES={
  // Player machine guns: a bright crack over a short mechanical body.
  shot(){tone(jit(760),190,.05,.05,'square',2600);hiss(jit(3200),900,.04,.05,'bandpass',1);tone(jit(165),80,.03,.04,'square',900)},
  // Enemy guns: thinner, duller crack.
  enemyShot(){tone(jit(430),140,.06,.038,'sawtooth',1400);hiss(jit(1900),500,.05,.032,'bandpass',.8)},
  // Cannon-class fire: deep bark with air displacement.
  heavyShot(){tone(jit(190),60,.12,.09,'sawtooth',800);hiss(900,200,.1,.06,'lowpass',.5);tone(jit(60),40,.1,.06,'sine',300);tone(90,45,.14,.05,'sine',220,.04)},
  // Round hitting an airframe: thud + tearing ping + brief canvas flutter.
  impact(){tone(jit(215),60,.07,.1,'triangle',1100);hiss(jit(2400),600,.05,.055,'bandpass',1);tone(92,50,.05,.06,'sine',400);hiss(3600,900,.03,.03,'bandpass',2,.02)},
  // Player takes damage: metal clang, splinter tear, warning blip.
  hit(){tone(jit(240),80,.12,.14,'sawtooth',1600);hiss(jit(1200),300,.1,.09,'bandpass',.7);tone(620,600,.09,.03,'square',2000,.05);hiss(2600,700,.05,.04,'bandpass',1.6,.012);tone(140,60,.08,.07,'sine',300,.015)},
  // Kill: sub boom, rolling noise, airframe tear, hot debris sparkle.
  kill(){tone(100,32,.32,.18,'sine',300);tone(46,24,.4,.14,'sine',170,.01);hiss(2000,150,.3,.15,'lowpass',.4);hiss(4500,2000,.08,.05,'highpass',.8);hiss(jit(1400),300,.2,.08,'bandpass',.9,.05)},
  // Big detonations (grenades, flak walls, hull breaks): deep sub whoomph,
  // concussion thud, long dirt-and-debris roll. No sharp crackle — reads as
  // ordnance, not ignition clicks.
  explosion(){tone(62,18,.7,.3,'sine',200);tone(34,15,.95,.24,'sine',140,.02);tone(115,38,.2,.09,'triangle',520,.04);hiss(jit(1100),110,.55,.24,'lowpass',.5,.01);hiss(420,70,.75,.18,'lowpass',.55,.04);hiss(jit(2200),480,.14,.025,'bandpass',1,.11)},
  // Rocket salvo: launch pop into a rising whoosh.
  rocket(){hiss(400,2400,.3,.09,'bandpass',1.4);tone(280,900,.28,.05,'sawtooth',1800);tone(120,70,.1,.07,'square',700)},
  // Flak airburst near the plane: muffled pop, crackle, far echo.
  flak(){tone(jit(300),90,.14,.08,'sawtooth',900);hiss(jit(3200),900,.16,.07,'bandpass',.9);tone(95,45,.14,.08,'sine',350);tone(180,60,.22,.045,'sine',280,.14)},
  // Skill trigger: three rising brass hits with a shimmer on top.
  skill(){tone(392,392,.09,.06,'sawtooth',2200);tone(523,523,.1,.06,'sawtooth',2400,.07);tone(659,659,.14,.06,'sawtooth',2600,.14);hiss(2400,4800,.22,.03,'highpass',1)},
  // Belt reload: two bolt clicks. Loaded: confident clack + confirm.
  reload(){tone(520,340,.04,.05,'square',1600);tone(300,220,.05,.06,'square',1200,.06)},
  loaded(){tone(340,340,.05,.05,'square',1400);tone(560,560,.08,.05,'square',1800,.05)},
  // Field upgrade: bright four-note arp.
  levelup(){for(let i=0;i<4;i++)tone([523,659,784,1046][i],[523,659,784,1046][i],.12,.05,'triangle',2600,i*.07)},
  // Wave / signal toast stingers.
  wave(){tone(660,660,.07,.04,'triangle',1800);tone(880,880,.09,.04,'triangle',2000,.08)},
  ally(){tone(523,523,.08,.05,'triangle',2000);tone(659,659,.1,.05,'triangle',2200,.09)},
  // Supply pickup / ammo restock: bright chime.
  pickup(){tone(880,1320,.09,.05,'triangle',2600);tone(1320,1760,.07,.035,'sine',3200,.05)},
  // Boss arrival: low brass hit over a timpani swell.
  bossSting(){tone(49,49,.9,.16,'sawtooth',500);tone(55,55,.9,.13,'sawtooth',400);tone(98,98,.7,.08,'sawtooth',800,.25);hiss(300,90,1,.1,'lowpass',.4)},
  // Enemy ace arrival: sharp bandit snarl — rising twin brass over an engine whine.
  aceSting(){tone(330,392,.16,.08,'sawtooth',2400);tone(415,494,.16,.07,'sawtooth',2400,.1);tone(220,180,.3,.09,'sawtooth',1400,.02);hiss(jit(2400),900,.35,.05,'bandpass',1.2,.04);tone(110,55,.4,.07,'sine',500,.28)},
  // Sortie launch: engine spool-up.
  launch(){tone(55,110,.5,.1,'sawtooth',600);hiss(200,900,.5,.04,'bandpass',.8)},
  // Rail-boss arrival: deep locomotive horn — a low two-chime blast with a
  // breathy steam attack, short fade, then a quieter answer from further off.
  trainWhistle(){for(const [f,v]of [[233,.34],[294,.28],[175,.2]]){tone(f*1.06,f,1.9,v,'sawtooth',520,.0,.1);tone(f*1.067,f*1.007,1.9,v*.6,'sawtooth',520,0,.1)}hiss(900,300,.55,.11,'lowpass',.5);hiss(2600,900,.45,.06,'bandpass',.6,.06);tone(92,68,1.7,.14,'sine',220,.02);for(const [f,v]of [[233,.16],[294,.13]])tone(f*1.05,f,.7,v,'sawtooth',520,2.25,.07)},
  // Balloon burst: taut fabric pop plus pressure release.
  balloon(){tone(500,60,.22,.14,'sine',800);hiss(4000,300,.2,.12,'bandpass',.6);tone(1300,400,.06,.04,'square',3000);tone(70,30,.3,.12,'sine',260,.03)},
  // Repair pickup: soft double chime.
  heal(){tone(720,720,.06,.05,'sine',2200);tone(960,960,.09,.05,'sine',2600,.07)},
  // Engine idle: one propeller/exhaust beat per call (the host fires it on an interval).
  engineTick(reload){const f=(reload?.72:1)*jit(1);tone(58*f,42*f,.11,.085,'sawtooth',300);hiss(700,180,.08,.05,'lowpass',.5);tone(117*f,90*f,.07,.028,'triangle',500)},
  // Run results.
  victory(){for(let i=0;i<5;i++)tone([57,60,64,67,72][i],[57,60,64,67,72][i],.5-i*.05,.06,'triangle',2400,i*.11)},
  defeat(){for(let i=0;i<4;i++)tone([64,60,57,50][i],[64,60,57,50][i],.55,.06,'sawtooth',1200,i*.16)}
};
export function sfx(name,arg){
  if(muted||!VOICES[name])return;
  if(!ctx&&ac()===undefined)return;
  if(!ctx)return;
  try{ctx.resume()}catch{}
  try{VOICES[name](arg)}catch{}
}

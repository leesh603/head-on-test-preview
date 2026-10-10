// Layered procedural SFX — every combat feedback voice is synthesized from
// oscillators plus filtered noise, matching the music.js approach. No audio
// assets, no external requests.
import {railAudioSamples} from './rail-audio.js?v=gal1';
const RAIL_APPROACH_SECONDS=4.2;// rail-audio.js RAIL_AUDIO_SECONDS.trainApproach
let ctx=null,bus=null,noise=null,muted=false,paused=false,master=1,priority=0,resuming=null;
const railBuffers=new Map();
const sources=new Map(),lastVoices=new Map();
const PRIORITY={bossSiren:3,bossKlaxon:3,airshipArrival:3,railGunFire520:2,railShellIncoming:1,railShellIncoming520:1,railShellImpact:1,railShellImpact520:2,trainApproach:3,trainRoll:0,trainBrake:1,railBreech:1,railGunFire:2,materialImpact:1,armorClink:2,whizz:1,closePass:2,airframeBreak:1,engineTick:0,enemyShot:0,shot:1,impact:1,kill:1,explosion:1,headOn:2,hit:3,bossSting:3,aceSting:3,trainWhistle:3,shipHorn:3,skill:3,flameValve:3,approachWarning:3,environment:0};
const INTERVAL={upgradeChosen:.3,pickup:.09,bossSiren:2,bossKlaxon:2,airshipArrival:3,railGunFire520:.5,railShellIncoming:.3,railShellIncoming520:.5,railShellImpact:.18,railShellImpact520:.3,trainWhistle:2.4,armorDrive:.55,armorEntry:3,armorBrake:.7,trainApproach:4,trainRoll:.25,trainBrake:.8,railBreech:.6,railGunFire:.16,materialImpact:.045,whizz:.17,closePass:.65,airframeBreak:.1,engineTick:.12,enemyShot:.065,shot:.045,impact:.055,kill:.08,explosion:.12,flak:.1,headOn:1,heavyShot:.18,mortarLaunch:.5,earthImpact:.14,waterImpact:.18,navalGun:.3,armorOpen:.8,metalBreak:.25,armorClink:.05,winchRelease:.6,railClatter:1,flameValve:1,flameBurn:1,formationPass:1,approachWarning:1,shipBreak:1,uiSelect:.08,environment:6};
let inputMedia=null;
const sourceLimit=()=>{if(!inputMedia&&typeof window!=='undefined')inputMedia=window.matchMedia?.('(pointer:coarse)');return inputMedia?.matches?24:44};
export function stopSfx(){if(engine){try{engine.src.stop()}catch{}engine=null}for(const [source,entry]of sources){try{source.stop()}catch{}entry.release()}lastVoices.clear()}
export function setSfxPaused(v){if(paused===!!v)return;paused=!!v;if(paused)stopSfx()}
export function sfxStats(){return{active:sources.size,limit:sourceLimit(),muted,paused}}
function reserve(){
 const limit=sourceLimit(),budget=priority<2?limit-8:limit;
 if(sources.size<budget)return true;
 if(priority<2)return false;
 for(const [source,entry]of sources)if(entry.priority<priority){try{source.stop()}catch{}entry.release();return true}
 return false;
}
function track(source,filter,gain){
 const release=()=>{if(!sources.delete(source))return;source.onended=null;source.disconnect();filter.disconnect();gain.disconnect()};
 sources.set(source,{priority,release});source.onended=release;
}
const jit=f=>f*(0.94+Math.random()*0.12); // ±6% pitch drift so repeat hits never sound identical
export function setSfxMuted(v){muted=!!v;if(muted)stopSfx()}
export function setSfxVolume(v){master=Math.max(0,Math.min(1,v));if(bus){bus.gain.cancelScheduledValues(ctx.currentTime);bus.gain.setTargetAtTime(.9*master,ctx.currentTime,.015)}}
function ac(){
  if(ctx)return ctx.state;
  try{
    ctx=new (window.AudioContext||window.webkitAudioContext)();
    bus=ctx.createGain();bus.gain.value=.9*master;
    const comp=ctx.createDynamicsCompressor();bus.connect(comp);comp.connect(ctx.destination);
    noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);
    const d=noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  }catch{}
  loadFileCues();
  return ctx?.state;
}
function tone(f0,f1,d,v,type='square',cut=1600,when=0,att=.004){
  if(!reserve())return;
  const t=ctx.currentTime+when,o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();
  o.type=type;o.frequency.setValueAtTime(f0,t);if(f1!==f0)o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+d);
  f.type='lowpass';f.frequency.value=cut;
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+Math.min(att,d*.3));g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(f);f.connect(g);g.connect(bus);o.start(t);o.stop(t+d+.03);
  track(o,f,g);
}
function hiss(f0,f1,d,v,type='bandpass',Q=.8,when=0,att=.003){
  if(!reserve())return;
  const t=ctx.currentTime+when,n=ctx.createBufferSource(),g=ctx.createGain(),f=ctx.createBiquadFilter();
  n.buffer=noise;n.loop=true;
  f.type=type;f.frequency.setValueAtTime(f0,t);if(f1!==f0)f.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+d);f.Q.value=Q;
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+Math.min(att,d*.3));g.gain.exponentialRampToValueAtTime(.0001,t+d);
  n.connect(f);f.connect(g);g.connect(bus);n.start(t);n.stop(t+d+.03);
  track(n,f,g);
}
function railSample(name,level){

 if(!reserve())return;
 let buffer=railBuffers.get(name);if(!buffer){const data=railAudioSamples(name,ctx.sampleRate);buffer=ctx.createBuffer(1,data.length,ctx.sampleRate);buffer.getChannelData(0).set(data);railBuffers.set(name,buffer);}
 const n=ctx.createBufferSource(),g=ctx.createGain(),f=ctx.createBiquadFilter();n.buffer=buffer;f.type='lowpass';f.frequency.value=7200;g.gain.value=level;
 n.connect(f);f.connect(g);g.connect(bus);track(n,f,g);n.start();
}
// Recorded-style rail-gun cues (tools/fx-sample/railgun-audio.py → rail-*.mp3), decoded once.
const FILE_CUES=['rail-fire-520','rail-fire-bruno','rail-incoming-520','rail-incoming-bruno','rail-impact-520','rail-impact-bruno'];
// Sample bank (tools/fx-sample/combat-audio.py, boss-audio.py → sfx/*.mp3): variants per cue, picked in turn.
const BANK={mg:3,enemy:3,hit:4,hitmetal:2,damage:0,kill:0,flak:3,'boss-siren':0,'boss-drums':0,'boss-klaxon':0,'ship-horn':0,airship:0,armour:0,'ace-bugle':0,'ui-skill':0,'ui-levelup':0,'ui-upgrade':0,'ui-pickup':0,'ui-repair':0,'ui-reload':0,'ui-loaded':0,'engine-rotary':0,'engine-inline':0,'amb-front':0,'amb-sea':0};
const BANK_FILES=Object.entries(BANK).flatMap(([k,n])=>n?Array.from({length:n},(_,i)=>`sfx/${k}-${i}`):[`sfx/${k}`]);
const fileBuffers=new Map();let filesRequested=false;
// mp3 decoders prepend encoder padding; cut leading silence so rapid fire stays tight on the trigger.
function trimLead(buf){
 const d=buf.getChannelData(0);let i=0;while(i<d.length&&Math.abs(d[i])<.002)i++;i=Math.max(0,i-24);if(i<8)return buf;
 const out=ctx.createBuffer(1,d.length-i,buf.sampleRate);out.getChannelData(0).set(d.subarray(i));return out;
}
function loadFileCues(){
 if(filesRequested||!ctx||typeof fetch!=='function')return;filesRequested=true;
 for(const name of FILE_CUES)fetch(`./${name}.mp3?v=gal1`).then(r=>r.arrayBuffer()).then(b=>new Promise((ok,no)=>ctx.decodeAudioData(b,ok,no))).then(buf=>fileBuffers.set(name,buf)).catch(()=>{});
 for(const name of BANK_FILES)fetch(`./${name}.mp3?v=gal1`).then(r=>r.arrayBuffer()).then(b=>new Promise((ok,no)=>ctx.decodeAudioData(b,ok,no))).then(buf=>fileBuffers.set(name,trimLead(buf))).catch(()=>{});
}
const bankTurn=new Map();
// Engine: one looping sample per airframe type, its rate following speed and turn. engineTick keeps
// it alive; if the ticks stop (menu, pause, death) it fades out on its own.
const ROTARY=/^(fokker(_red|_voss|_f1|_jacobs|_standard)?|fokker|camel|pup|strutter|snipe|sopwith.*|.*nieuport.*|eindecker|fokker_e1|airco_dh2|dh2|hanriot|siemens_d4|morane.*|bristol_m1|.*camel|.*dr1|.*_sopwith|.*_snipe)$/;
let engine=null;
function engineLoop(p){
 const kind=ROTARY.test(p.plane||'')?'engine-rotary':'engine-inline',buffer=fileBuffers.get('sfx/'+kind);
 if(!buffer){loadFileCues();return false}
 const now=ctx.currentTime,speed=Math.max(.7,Math.min(1.25,p.speed??1)),turn=Math.min(4,p.turn||0),damage=Math.max(0,Math.min(1,p.damage||0));
 if(!engine||engine.kind!==kind){
  if(engine)try{engine.gain.gain.setTargetAtTime(0,now,.08);engine.src.stop(now+.4)}catch{}
  const src=ctx.createBufferSource(),gain=ctx.createGain(),f=ctx.createBiquadFilter();
  if(buffer.loopEndAt==null){const d=buffer.getChannelData(0);let e=d.length-1;while(e>0&&Math.abs(d[e])<.01)e--;buffer.loopEndAt=(e+1)/buffer.sampleRate}
  src.buffer=buffer;src.loop=true;src.loopStart=0;src.loopEnd=buffer.loopEndAt;f.type='lowpass';f.frequency.value=2400;gain.gain.value=0;
  src.connect(f);f.connect(gain);gain.connect(bus);src.start();
  engine={kind,src,gain,f};src.onended=()=>{try{src.disconnect();f.disconnect();gain.disconnect()}catch{}if(engine?.src===src)engine=null};
 }
 const level=(p.duck?.32:.6)*(p.reload?.85:1)*.42;
 engine.src.playbackRate.setTargetAtTime((.9+.28*(speed-.7)/.55)*(1+turn*.012)*(1-damage*.05),now,.15);
 engine.f.frequency.setTargetAtTime(2400-damage*900,now,.2);
 engine.gain.gain.setTargetAtTime(level,now,.12);
 clearTimeout(engine.idle);const e=engine;e.idle=setTimeout(()=>{try{e.gain.gain.setTargetAtTime(0,ctx.currentTime,.1);e.src.stop(ctx.currentTime+.5)}catch{}},450);
 return true;
}

function bankSample(key,level,fallback,rate=1){
 const n=BANK[key],i=n?(bankTurn.get(key)||0)%n:0;if(n)bankTurn.set(key,i+1);
 const name=n?`sfx/${key}-${i}`:`sfx/${key}`,buffer=fileBuffers.get(name);
 if(!buffer){loadFileCues();fallback?.();return}
 if(!reserve())return;
 const src=ctx.createBufferSource(),g=ctx.createGain(),f=ctx.createBiquadFilter();src.buffer=buffer;src.playbackRate.value=rate;f.type='lowpass';f.frequency.value=16000;g.gain.value=level;
 src.connect(f);f.connect(g);g.connect(bus);track(src,f,g);src.start();
}
function fileSample(name,level,fallback){
 const buffer=fileBuffers.get(name);if(!buffer){loadFileCues();fallback?.();return}
 if(!reserve())return;
 const n=ctx.createBufferSource(),g=ctx.createGain(),f=ctx.createBiquadFilter();n.buffer=buffer;f.type='lowpass';f.frequency.value=16000;g.gain.value=level;
 n.connect(f);f.connect(g);g.connect(bus);track(n,f,g);n.start();
}
const VOICES={
  trainApproach(){railSample('trainApproach',.68)},
  trainRoll(){railSample('trainRoll',.28)},
  trainBrake(){railSample('trainBrake',.34)},
  railBreech(){railSample('railBreech',.38)},
  railGunFire(){fileSample('rail-fire-bruno',.8,()=>railSample('railGunFire',.63))},
  railGunFire520(){fileSample('rail-fire-520',.9,()=>railSample('railGunFire',.63))},
  railShellIncoming(){fileSample('rail-incoming-bruno',.38)},
  railShellIncoming520(){fileSample('rail-incoming-520',.42)},
  railShellImpact(){fileSample('rail-impact-bruno',.7,()=>VOICES.earthImpact())},
  railShellImpact520(){fileSample('rail-impact-520',.8,()=>VOICES.earthImpact())},
  materialImpact(hit){const material=typeof hit==='string'?hit:hit?.material,streak=Math.min(6,hit?.streak||1);
    // A tighter body on repeated hits, not a critical-hit bell or volume ramp.
    if(streak>=3)tone(jit(150+streak*9),65,.055,.024,'triangle',650);
    if(material==='metal'){tone(jit(720),240,.065,.042,'triangle',2400);hiss(jit(3600),1500,.045,.034,'bandpass',2)}
    else if(material==='fabric'){hiss(jit(1300),450,.075,.047,'bandpass',.5);tone(jit(150),70,.045,.026,'triangle',600)}
    else{tone(jit(260),85,.055,.05,'triangle',1300);hiss(jit(2300),650,.075,.039,'bandpass',1.2)}},
  whizz(){hiss(jit(3300),720,.14,.037,'bandpass',3,0,.018);tone(jit(850),310,.08,.007,'sine',1400)},
  closePass(){tone(jit(155),47,.38,.068,'sawtooth',680,0,.045);hiss(1600,250,.34,.074,'bandpass',.65,0,.035)},
  airframeBreak(){tone(jit(180),53,.18,.062,'triangle',700);hiss(jit(1800),420,.26,.057,'bandpass',.65);hiss(3200,1200,.05,.026,'highpass',.7,.035)},
  // Mechanical/material cues follow actual boss actions, not a generic beep.
  armorDrive(){tone(49,46,.3,.02,'sawtooth',170);for(let i=0;i<3;i++){hiss(760,350,.045,.016,'bandpass',.7,i*.09);tone(117,72,.07,.01,'triangle',310,i*.09)}},
  armorEntry(){bankSample('armour',.42,()=>VOICES.armorEntrySynth())},
  armorEntrySynth(){tone(72,43,1.2,.045,'sawtooth',220);hiss(480,180,.9,.03,'lowpass',.5);for(let i=0;i<6;i++)hiss(1200,550,.06,.024,'bandpass',1,i*.15)},
  armorBrake(){tone(82,34,.4,.038,'sawtooth',270);hiss(900,360,.3,.038,'bandpass',.6)},
  mortarLaunch(){tone(135,46,.22,.075,'sine',440);hiss(680,180,.16,.065,'bandpass',.7);hiss(1250,500,.44,.018,'bandpass',3,.14)},
  earthImpact(){tone(78,28,.34,.09,'sine',250);hiss(1100,170,.48,.075,'lowpass',.6);hiss(2700,850,.09,.035,'bandpass',1.2)},
  waterImpact(){hiss(1900,430,.62,.065,'bandpass',.45);tone(68,35,.3,.045,'sine',240);hiss(3600,1700,.2,.022,'highpass',.5,.14)},
  navalGun(){tone(104,31,.32,.1,'sine',300);hiss(2100,230,.26,.085,'lowpass',.5);tone(58,30,.38,.032,'sine',180,.15)},
  armorOpen(){hiss(1800,480,.24,.045,'bandpass',2);tone(142,84,.2,.035,'triangle',650);hiss(2600,1600,.045,.05,'highpass',.8,.23)},
  armorClink(){tone(jit(1420),560,.13,.052,'triangle',3400);hiss(jit(5200),2400,.055,.045,'bandpass',4);tone(jit(470),290,.08,.028,'square',2400,.02);tone(jit(2350),1400,.05,.02,'triangle',4200,.06)},
  metalBreak(){hiss(3200,700,.3,.065,'bandpass',2);tone(237,107,.24,.05,'triangle',1600);tone(419,171,.17,.025,'square',2100,.07)},
  winchRelease(){for(let i=0;i<3;i++)hiss(2100,1200,.035,.035,'bandpass',2,i*.055);tone(176,88,.3,.028,'sawtooth',600,.1)},
  railClatter(){for(let i=0;i<4;i++)tone(93,45,.06,.034,'triangle',350,i*.12)},
  flameValve(){hiss(1600,420,.5,.055,'bandpass',1.2);tone(122,75,.12,.035,'triangle',550)},
  flameBurn(){hiss(480,180,.85,.065,'lowpass',.5);hiss(1300,680,.55,.032,'bandpass',.4)},
  formationPass(){tone(82,120,.65,.045,'sawtooth',360);tone(89,126,.7,.025,'sawtooth',400);hiss(540,260,.8,.025,'lowpass',.5)},
  approachWarning(){tone(172,228,.24,.045,'sawtooth',650);hiss(820,360,.35,.03,'bandpass',1)},
  shipBreak(){tone(93,27,.75,.07,'sawtooth',250);hiss(2300,260,.55,.055,'bandpass',.6);hiss(900,350,.75,.03,'lowpass',.4,.25)},
  uiSelect(){hiss(2100,900,.025,.023,'bandpass',1.5);tone(180,100,.025,.018,'triangle',700)},
  environment(region){const name=region===1||region===7||region===16||region===14?'amb-sea':region===5||region===6?null:'amb-front';if(name)bankSample(name,.32)},
  environmentSynth(region){if(region===1||region===7)hiss(520,280,1.3,.009,'bandpass',.35);else if(region===5){hiss(2600,1900,1.5,.005,'highpass',.3);tone(210,195,1,.003,'triangle',60)}else if(region===6)hiss(1500,850,1.4,.008,'bandpass',.4);else{tone(46,25,.6,.014,'sine',130);hiss(280,100,.8,.01,'lowpass',.4)}},
  // Brief propeller rush and mechanical rattle, below weapon volume.
  headOn(){hiss(320,950,.16,.045,'bandpass',.6);tone(92,140,.14,.035,'sawtooth',450);hiss(1400,420,.09,.022,'bandpass',1,.08)},
  // Player machine guns: a bright crack over a short mechanical body.
  shot(){bankSample('mg',.21,()=>VOICES.shotSynth(),jit(1))},
  shotSynth(){tone(jit(760),190,.05,.05,'square',2600);hiss(jit(3200),900,.04,.05,'bandpass',1);tone(jit(165),80,.03,.04,'square',900)},
  // Enemy guns: thinner, duller crack.
  enemyShot(){bankSample('enemy',.09,()=>VOICES.enemyShotSynth(),jit(1))},
  enemyShotSynth(){tone(jit(430),140,.06,.038,'sawtooth',1400);hiss(jit(1900),500,.05,.032,'bandpass',.8)},
  // Cannon-class fire: deep bark with air displacement.
  heavyShot(){tone(jit(190),60,.12,.09,'sawtooth',800);hiss(900,200,.1,.06,'lowpass',.5);tone(jit(60),40,.1,.06,'sine',300);tone(90,45,.14,.05,'sine',220,.04)},
  // Round hitting an airframe: thud + tearing ping + brief canvas flutter.
  impact(){const t=(bankTurn.get('impactCount')||0)+1;bankTurn.set('impactCount',t);t%4===0?bankSample('hitmetal',.15,()=>VOICES.impactSynth(),jit(1)):bankSample('hit',.17,()=>VOICES.impactSynth(),jit(1))},
  impactSynth(){tone(jit(215),60,.07,.1,'triangle',1100);hiss(jit(2400),600,.05,.055,'bandpass',1);tone(92,50,.05,.06,'sine',400);hiss(3600,900,.03,.03,'bandpass',2,.02)},
  // Player takes damage: metal clang, splinter tear, warning blip.
  hit(){bankSample('damage',.36,()=>VOICES.hitSynth())},
  hitSynth(){tone(jit(240),80,.12,.14,'sawtooth',1600);hiss(jit(1200),300,.1,.09,'bandpass',.7);tone(620,600,.09,.03,'square',2000,.05);hiss(2600,700,.05,.04,'bandpass',1.6,.012);tone(140,60,.08,.07,'sine',300,.015)},
  // Kill: sub boom, rolling noise, airframe tear, hot debris sparkle.
  kill(){bankSample('kill',.32,()=>VOICES.killSynth())},
  killSynth(){tone(100,32,.32,.18,'sine',300);tone(46,24,.4,.14,'sine',170,.01);hiss(2000,150,.3,.15,'lowpass',.4);hiss(4500,2000,.08,.05,'highpass',.8);hiss(jit(1400),300,.2,.08,'bandpass',.9,.05)},
  // Big detonations (grenades, flak walls, hull breaks): deep sub whoomph,
  // concussion thud, long dirt-and-debris roll. No sharp crackle — reads as
  // ordnance, not ignition clicks.
  explosion(){tone(62,18,.7,.3,'sine',200);tone(34,15,.95,.24,'sine',140,.02);tone(115,38,.2,.09,'triangle',520,.04);hiss(jit(1100),110,.55,.24,'lowpass',.5,.01);hiss(420,70,.75,.18,'lowpass',.55,.04);hiss(jit(2200),480,.14,.025,'bandpass',1,.11)},
  // Rocket salvo: launch pop into a rising whoosh.
  rocket(){hiss(400,2400,.3,.09,'bandpass',1.4);tone(280,900,.28,.05,'sawtooth',1800);tone(120,70,.1,.07,'square',700)},
  // Flak airburst near the plane: muffled pop, crackle, far echo.
  flak(){bankSample('flak',.26,()=>VOICES.flakSynth(),jit(1))},
  flakSynth(){tone(jit(300),90,.14,.08,'sawtooth',900);hiss(jit(3200),900,.16,.07,'bandpass',.9);tone(95,45,.14,.08,'sine',350);tone(180,60,.22,.045,'sine',280,.14)},
  // Skill trigger: three rising brass hits with a shimmer on top.
  // Upgrade card picked: the order-sheet stamp.
  upgradeChosen(){VOICES.uiSelect()},
  skill(){bankSample('ui-skill',.2,()=>VOICES.skillSynth())},
  skillSynth(){tone(392,392,.09,.06,'sawtooth',2200);tone(523,523,.1,.06,'sawtooth',2400,.07);tone(659,659,.14,.06,'sawtooth',2600,.14);hiss(2400,4800,.22,.03,'highpass',1)},
  // Belt reload: two bolt clicks. Loaded: confident clack + confirm.
  reload(){bankSample('ui-reload',.3,()=>VOICES.reloadSynth())},
  reloadSynth(){tone(520,340,.04,.05,'square',1600);tone(300,220,.05,.06,'square',1200,.06)},
  loaded(){bankSample('ui-loaded',.34,()=>VOICES.loadedSynth())},
  loadedSynth(){tone(340,340,.05,.05,'square',1400);tone(560,560,.08,.05,'square',1800,.05)},
  // Field upgrade: short confirm tick.
  levelup(){VOICES.levelupSynth()},
  levelupSynth(){hiss(2100,900,.03,.02,'bandpass',1.5);tone(520,520,.07,.045,'triangle',2000);tone(780,780,.1,.04,'triangle',2200,.07)},
  // Wave / signal toast stingers.
  wave(){tone(660,660,.07,.04,'triangle',1800);tone(880,880,.09,.04,'triangle',2000,.08)},
  ally(){tone(523,523,.08,.05,'triangle',2000);tone(659,659,.1,.05,'triangle',2200,.09)},
  // Supply pickup / ammo restock: bright chime.
  pickup(){bankSample('ui-pickup',.1,()=>VOICES.pickupSynth())},
  pickupSynth(){tone(880,1320,.09,.05,'triangle',2600);tone(1320,1760,.07,.035,'sine',3200,.05)},
  // Boss arrival: low brass hit over a timpani swell.
  bossSiren(){bankSample('boss-siren',.42,()=>VOICES.bossStingSynth())},
  bossKlaxon(){bankSample('boss-klaxon',.42,()=>VOICES.bossStingSynth())},
  airshipArrival(){bankSample('airship',.45)},
  bossSting(){bankSample('boss-drums',.5,()=>VOICES.bossStingSynth())},
  bossStingSynth(){tone(49,49,.9,.16,'sawtooth',500);tone(55,55,.9,.13,'sawtooth',400);tone(98,98,.7,.08,'sawtooth',800,.25)},
  // Enemy ace arrival: sharp bandit snarl — rising twin brass over an engine whine.
  aceSting(){bankSample('ace-bugle',.32,()=>VOICES.aceStingSynth())},
  aceStingSynth(){tone(330,392,.16,.08,'sawtooth',2400);tone(415,494,.16,.07,'sawtooth',2400,.1);tone(220,180,.3,.09,'sawtooth',1400,.02);hiss(jit(2400),900,.35,.05,'bandpass',1.2,.04);tone(110,55,.4,.07,'sine',500,.28)},
  // Sortie launch: engine spool-up.
  launch(){tone(55,110,.5,.1,'sawtooth',600);hiss(200,900,.5,.04,'bandpass',.8)},
  // Rail-boss arrival: the three-chime steam whistle from rail-audio.js (뿌우우우 — 뿌우).
  trainWhistle(){railSample('trainWhistle',.6)},
  // Ship-boss arrival: a long foghorn blast — two stacked detuned notes that
  // swell, hold, then decay, with a second fainter call answering from afar.
  shipHorn(){bankSample('ship-horn',.5,()=>VOICES.shipHornSynth())},
  shipHornSynth(){for(const [f,v]of [[87,.5],[131,.42],[65,.3]]){tone(f*1.02,f,2.8,v,'sawtooth',430,0,.35);tone(f*1.018,f*1.006,2.8,v*.6,'sawtooth',430,0,.35)}
    hiss(400,140,1.1,.1,'lowpass',.35);tone(44,33,2.6,.2,'sine',160,.03);
    for(const [f,v]of [[87,.24],[131,.2]])tone(f*1.015,f*1.004,2.1,v,'sawtooth',430,3.1,.3);tone(44,33,1.9,.1,'sine',160,3.12)},
  // Balloon burst: taut fabric pop plus pressure release.
  balloon(){tone(500,60,.22,.14,'sine',800);hiss(4000,300,.2,.12,'bandpass',.6);tone(1300,400,.06,.04,'square',3000);tone(70,30,.3,.12,'sine',260,.03)},
  // Repair pickup: soft double chime.
  heal(){bankSample('ui-repair',.3,()=>VOICES.healSynth())},
  healSynth(){tone(720,720,.06,.05,'sine',2200);tone(960,960,.09,.05,'sine',2600,.07)},
  // Engine idle: one propeller/exhaust beat per call (the host fires it on an interval).
  engineTick(flight){const p=typeof flight==='object'?flight:{reload:flight};if(!engineLoop(p))VOICES.engineTickSynth(flight)},
  engineTickSynth(flight){const p=typeof flight==='object'?flight:{reload:flight},speed=Math.max(.7,Math.min(1.2,p.speed??1)),turn=Math.min(4,p.turn||0),damage=Math.max(0,Math.min(1,p.damage||0));
    const f=(p.reload?.72:1)*(.96+speed*.04)*jit(1),level=p.duck?.35:.68;
    // Reuse one original engine voice. No overlapping enemy/propeller drones.
    tone(58*f,42*f,.11,.085*level,'sawtooth',300-damage*40);
    hiss(540+speed*160+turn*70,180,.08,.05*level*(1+turn*.035),'lowpass',.5);
    tone(117*f,90*f,.07,.028*level*(1-damage*.25),'triangle',500);
  },
  // Run results.
  victory(){for(let i=0;i<5;i++)tone([57,60,64,67,72][i],[57,60,64,67,72][i],.5-i*.05,.06,'triangle',2400,i*.11)},
  defeat(){for(let i=0;i<4;i++)tone([64,60,57,50][i],[64,60,57,50][i],.55,.06,'sawtooth',1200,i*.16)}
};
export function sfx(name,arg){
  if(muted||(paused&&name!=='uiSelect'&&name!=='upgradeChosen')||!VOICES[name])return;
  if(!ctx&&ac()===undefined)return;
  if(!ctx)return;
  if(ctx.state==='closed')return;
  if(ctx.state!=='running'&&!resuming){try{resuming=Promise.resolve(ctx.resume()).catch(()=>{}).finally(()=>{resuming=null})}catch{}}
  const now=ctx.currentTime;
  if(now-(lastVoices.get(name)??-Infinity)<(INTERVAL[name]||0))return;
  // The arrival call already carries its own chuff rhythm; rolling beats wait until it ends.
  if(name==='trainRoll'&&now-(lastVoices.get('trainApproach')??-Infinity)<RAIL_APPROACH_SECONDS-.3)return;
  lastVoices.set(name,now);priority=PRIORITY[name]??2;
  try{VOICES[name](arg)}catch{}finally{priority=0}
}

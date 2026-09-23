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
const MAP_KEYS=['rural','sea','trench','city','sky','alps','zeebrugge'];
// Stage-boss id -> score family. Related boss pairs share a family.
const BOSS_TRACKS={
 'paris-gun':'railgun',lincomparable:'railgun',
 'sms-stuttgart':'naval','hms-zubian':'naval',
 'a7v-flak':'landship','mark-v-cruiser':'landship',
 'drachen-net':'net','london-apron':'net',
 'zeppelin-l70':'airship',hma23:'airship',
 gik:'bomber',ca4:'bomber',
 'armored-harbor-fortress':'fortress'
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
export class BattleMusic {
  constructor(){this.mode='idle';this.muted=false;this.step=0;this.next=0;this.timer=null;this.track=null;this.positions={}}
  unlock(){try{if(!this.ctx){
    this.ctx=new (window.AudioContext||window.webkitAudioContext)();
    this.bus=this.ctx.createGain();this.bus.gain.value=0;
    const comp=this.ctx.createDynamicsCompressor();this.bus.connect(comp);comp.connect(this.ctx.destination);
    this.noise=this.ctx.createBuffer(1,this.ctx.sampleRate,this.ctx.sampleRate);
    const d=this.noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    this.timer=setInterval(()=>this.schedule(),50);
  }this.ctx.resume().catch(()=>{})}catch{}}
  bossTrack(){return this.mode==='boss'?'duel':this.mode.startsWith('boss:')?this.mode.slice(5):null}
  setState(mode,muted){
    if(mode==='flight'||mode==='ace')mode='rural';
    const isBoss=mode==='boss'||mode.startsWith('boss:');
    if(mode!=='idle'&&!isBoss&&!THEMES[mode])mode='rural';
    const now=this.ctx?.currentTime||0;
    if(mode!==this.mode){
      if(this.mode!=='idle')this.positions[this.mode]=this.step;
      if(mode!=='idle'){
        const resume=this.mode==='idle'&&this.track===mode;
        this.step=resume?this.positions[mode]||0:isBoss?0:this.positions[mode]||0;
        if(isBoss){if(!resume)this.bossSince=now;else if(this.pausedAt!=null)this.bossSince+=now-this.pausedAt;}
        // A fresh gain bus fades the previous arrangement without a hard cut.
        if(this.ctx?.createGain){
          const old=this.layer;
          if(old){old.gain.setTargetAtTime(0,now,.10);setTimeout(()=>old.disconnect(),1600)}
          this.layer=this.ctx.createGain();this.layer.gain.setValueAtTime(0,now);
          this.layer.gain.linearRampToValueAtTime(1,now+.35);this.layer.connect(this.bus);
        }
        this.track=mode;this.next=now+.02;
      }else this.pausedAt=now;
    }
    this.mode=mode;this.muted=muted;
    if(this.ctx)this.bus.gain.setTargetAtTime(mode==='idle'||muted?0:.88,now,.08);
  }
  tone(midi,time,duration,volume,type='sawtooth',cutoff=1500,attack=.025){
    const c=this.ctx,o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();
    o.type=type;o.frequency.value=440*2**((midi-69)/12);f.type='lowpass';f.frequency.value=cutoff;
    g.gain.setValueAtTime(.0001,time);g.gain.linearRampToValueAtTime(volume,time+Math.min(attack,duration*.35));
    g.gain.exponentialRampToValueAtTime(.0001,time+duration);
    o.connect(f);f.connect(g);g.connect(this.layer||this.bus);o.start(time);o.stop(time+duration+.03);
    o.onended=()=>{o.disconnect();f.disconnect();g.disconnect()};
  }
  drum(time,snare=false,volume=1){
    if(!snare){this.tone(35,time,.26,.32*volume,'sine',190,.006);return}
    const c=this.ctx,n=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
    n.buffer=this.noise;f.type='bandpass';f.frequency.value=1900;f.Q.value=.6;
    g.gain.setValueAtTime(.13*volume,time);g.gain.exponentialRampToValueAtTime(.0001,time+.16);
    n.connect(f);f.connect(g);g.connect(this.layer||this.bus);n.start(time);n.stop(time+.17);
    n.onended=()=>{n.disconnect();f.disconnect();g.disconnect()};
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
    n.onended=()=>{n.disconnect();f.disconnect();g.disconnect()};
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
    const T=BOSS_SCORES[this.bossTrack()]||BOSS_SCORES.duel;
    const name=this.bossTrack(),p=i%16,bar=Math.floor(i/16),root=T.roots[bar%8];
    const intensity=Math.min(1,elapsed/24),breath=bar%8===6;
    if(name==='railgun'){
      // Siege gun: long gaps, one colossal muzzle blast, echoing breech clangs.
      if(p===0){this.drum(t,false,1.35);this.tone(root-12,t,b*15,.22,'sine',130,.5)}
      if(p%8===4)this.tone(root-19,t,b*2.5,.05,'sine',170,.35); // distant ember pulse
      if(p===8&&bar%2===1)this.tone(root+7,t,b*5,.06,'square',420,.3);
      if(p===6||p===14)this.drum(t,true,.5);
      if(intensity>.25&&(p===2||p===10))this.tone(root+19,t,b*.9,.04,'sawtooth',1400,.01);
      if(intensity>.6&&p===12)for(const off of [12,18])this.tone(root+off,t,b*6,.03,'sawtooth',700,.2);
    }else if(name==='naval'){
      // Warships: rolling swell bass, foghorn fifth calls, gunfire snare rolls.
      if(p===0||p===8){this.drum(t,false,1.1);this.tone(root,t,b*8,.17,'sawtooth',300,.35);this.tone(root-5,t,b*8,.06,'triangle',200,.4)}
      if(p===4)this.tone(root+7,t,b*6,.08,'sawtooth',420,.4);
      if(p===12)this.drum(t,true,.55);
      if(intensity>.3&&p%4===2)this.tone(root+12,t,b*.8,.05,'triangle',900,.15);
      if(intensity>.7&&p===15){this.drum(t,true,.4);this.drum(t+b*.5,true,.55)}
    }else if(name==='landship'){
      // Land armour: four-on-the-floor tread stomp, grinding bass, hull clanks.
      if(p%4===0)this.drum(t,false,1.2);
      if(p%2===0)this.tone(root-12,t,b*.9,.15,'square',260,.01);
      if(p===4||p===12)this.drum(t,true,.7);
      if(p===6||p===14)this.tone(root+7,t,b*.7,.09,'sawtooth',520,.01);
      if(intensity>.3&&p%4===2)this.tone(root+24,t,b*.5,.05,'sawtooth',1500,.008);
      if(intensity>.65&&p===15)this.drum(t+b*.5,true,.5);
    }else if(name==='net'){
      // Mine net / balloon apron: hypnotic pulsing grid, radar ping each bar.
      if(p%2===0)this.tone(root-12,t,b*.42,.1,'sawtooth',380,.008);
      if(p===0||p===8)this.drum(t,false,1);
      if(p===15)this.tone(root+36,t,b*2,.05,'sine',2400,.005);
      if(p===6||p===14)this.drum(t,true,.5);
      if(intensity>.35&&(p===4||p===12))this.tone(root+7,t,b*1.2,.06,'square',700,.02);
      if(intensity>.7&&p===11)this.tone(root+24,t,b*1.5,.04,'sawtooth',1800,.008);
    }else if(name==='airship'){
      // Zeppelin / sky carrier: massive drone, slowly rising dread line.
      if(p===0){this.tone(root-12,t,b*15,.2,'sawtooth',220,.6);this.tone(root-5,t,b*15,.07,'sine',140,.6)}
      if(p===0||p===10)this.drum(t,false,1.15);
      if(p===8&&bar%2===0)this.tone(root+13,t,b*7,.05,'sawtooth',600,.5);
      if(p===14)this.drum(t,true,.5);
      if(intensity>.3&&p===6)this.tone(root+24,t,b*3,.045,'triangle',1300,.2);
      if(intensity>.65&&bar%4===3&&p===11)for(const off of [18,25])this.tone(root+off,t,b*4,.05,'sawtooth',1100,.2);
    }else if(name==='bomber'){
      // Heavy bombers: relentless engine chug, propeller ticks, bombs-away stabs.
      if(p%2===0)this.tone(root-12,t,b*.55,.12,'sawtooth',330,.008);
      if(p===0||p===8)this.drum(t,false,1.15);
      if(p===4||p===12){this.drum(t,true,.6);this.tone(root+7,t,b*.8,.08,'sawtooth',480,.01)}
      if(p%4===2)this.tone(root,t,b*.4,.06,'square',500,.008);
      if(intensity>.3&&p===6)this.tone(root+24,t,b*.9,.05,'sawtooth',1600,.008);
      if(intensity>.65&&p===15){this.drum(t,true,.4);this.drum(t+b*.5,true,.5)}
    }else if(name==='fortress'){
      // Harbour fortress: the heaviest track — tom wall, anvil hits, doom pads.
      if(p===0||p===5||p===10){this.drum(t,false,1.4);this.tone(root-12,t,b*4,.24,'triangle',170,.02)}
      if(p===5||p===13)this.drum(t,true,.8);
      if(p===15&&bar%2===1)this.tone(root+6,t,b*3,.07,'sawtooth',520,.15);
      if(intensity>.25&&p===8)this.tone(root+24,t,b*1.4,.05,'sawtooth',1400,.01);
      if(intensity>.6&&p===3)for(const off of [12,18,24])this.tone(root+off,t,b*5,.035,'sawtooth',800,.15);
    }else{
      // Enemy ace duel: the fast breakaway dogfight track.
      if([0,2,3,6,8,10,11,14].includes(p)){
        const off=({3:7,6:1,11:6,14:12})[p]||0;
        this.tone(root+off,t,b*.78,.24+intensity*.07,'sawtooth',430+intensity*330,.008);
        this.tone(root+off-12,t,b*.9,.16,'triangle',220,.008);
      }
      if(p===0||p===8){this.drum(t,false,1.15);for(const off of [12,13,19])this.tone(root+off,t,b*7,.025+intensity*.014,'sawtooth',900,.18)}
      if(intensity>.2&&!breath){
        this.tone(root+24+[0,1,7,6][i%4],t,b*.46,.035+intensity*.025,'sawtooth',1900,.007);
        if(intensity>.65)this.tone(root+36+[7,6,1,0][i%4],t+b*.5,b*.4,.025,'triangle',2300,.006);
      }
      if(p===6||p===14)this.drum(t,true,.65+intensity*.4);
      if(p===15&&intensity>.35){this.drum(t,true,.45);this.drum(t+b*.5,true,.65)}
      if(bar%4===3&&p===12)for(const off of [18,25,30])this.tone(root+off,t,b*3.8,.047,'sawtooth',1500,.12);
    }
  }
  schedule(){
    if(!this.ctx||this.ctx.state!=='running')return;
    const now=this.ctx.currentTime;if(this.mode==='idle'||this.muted){this.next=now;return}
    if(this.next<now)this.next=now+.015;
    while(this.next<now+.15){
      const elapsed=Math.max(0,now-(this.bossSince||0));
      const bossT=this.bossTrack(),T=bossT?BOSS_SCORES[bossT]||BOSS_SCORES.duel:null;
      const b=T?60/(T.bpm+Math.min(T.ramp,elapsed*3))/2:60/THEMES[this.mode].bpm/2;
      const i=this.step++,t=this.next;
      if(T)this.bossStep(i,t,b,elapsed);else this.mapStep(this.mode,i,t,b);
      this.next+=b;
    }
  }
}

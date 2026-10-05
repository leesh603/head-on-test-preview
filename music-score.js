// Original HEAD-ON chamber-orchestra compositions. No borrowed melodies.
// Motifs are scale degrees; rhythm is in half-beats. Thirty-two-bar arcs have
// an exposition, answer, thin interlude and varied return, not an eight-note loop.
const minor=[0,2,3,5,7,8,10],dorian=[0,2,3,5,7,9,10],phrygian=[0,1,3,5,7,8,10];
const theme=(bpm,beats,key,scale,lead,pulse,motif,rhythm,drums,harmony)=>({bpm,beats,key,scale,lead,pulse,motif,rhythm,drums,harmony});
export const MUSIC_THEMES=Object.freeze({
 rural:theme(78,6,50,dorian,'oboe','harp',[7,9,8,7,4,5,3,4,7,6,4,2],[0,3,5,8,10],[0,6],[0,0,3,4,0,5,3,4]),
 sea:theme(62,6,40,minor,'clarinet','cello',[7,11,10,8,7,5,6,4,7,8,5,4],[0,4,7,10],[0,8],[0,5,3,0,4,3,1,4]),
 trenches:theme(100,2,48,minor,'trombone','spiccato',[7,7,9,8,4,7,6,4,3,4,6,7],[0,1,2],[0,2],[0,0,3,4,5,3,1,4]),
 'trenches-hell':theme(70,5,41,phrygian,'bassoon','cello',[7,8,7,3,4,2,1,0,4,3,1,0],[0,3,7,9],[0,7],[0,1,0,4,1,3,0,4]),
 city:theme(112,3,55,minor,'clarinet','spiccato',[7,9,8,6,7,4,5,3,7,8,4,6],[0,2,3,5],[0,4],[0,3,5,4,0,1,3,4]),
 sky:theme(54,4,45,dorian,'strings','harp',[14,11,13,14,9,11,8,7,11,10,8,7],[0,5],[0],[0,4,0,3,5,0,3,4]),
 alps:theme(66,3,47,minor,'horn','harp',[7,11,14,11,9,7,6,4,7,9,8,6],[0,3,5],[0],[0,3,0,5,3,1,4,4]),
 zeebrugge:theme(84,4,49,minor,'bassoon','metal',[7,4,7,8,6,4,3,1,4,6,3,0],[0,3,6],[0,5],[0,0,5,3,1,0,3,4]),
 cambrai:theme(108,2,52,minor,'trombone','spiccato',[0,4,7,4,3,7,8,6,4,1,3,0],[0,1,3],[0,3],[0,4,0,1,3,0,5,4]),
 arras:theme(126,6,54,minor,'strings','spiccato',[7,9,11,10,8,7,9,6,4,7,8,6],[0,2,3,5,6,8,9,11],[0,6,9],[0,3,5,4,0,5,1,4]),
 somme:theme(58,4,46,minor,'cello','bassoon',[7,6,4,5,3,1,0,3,4,1,2,0],[0,4,7],[0,6],[0,5,3,1,0,3,1,4]),
 london:theme(92,4,55,dorian,'trumpet','clarinet',[7,7,11,10,9,7,6,4,7,9,8,7],[0,2,5,7],[0,4,7],[0,3,0,4,5,3,0,4]),
 'paris-night':theme(83,4,50,minor,'clarinet','spiccato',[7,8,11,10,6,7,4,3,7,6,4,2],[0,3,4,7],[0,5],[0,1,3,4,0,5,1,4]),
 verdun:theme(72,3,48,minor,'trumpet','trombone',[7,9,7,4,6,8,6,3,7,8,5,4],[0,2,5],[0,3],[0,4,1,4,0,3,5,4]),
 isonzo:theme(86,6,53,dorian,'horn','harp',[7,9,11,14,12,11,9,7,8,10,9,7],[0,3,5,8],[0,9],[0,3,5,0,3,4,0,4]),
 'spring-offensive':theme(116,4,45,minor,'trombone','spiccato',[7,4,7,9,8,6,7,4,3,5,4,0],[0,1,4,6],[0,3,6],[0,0,5,4,0,3,1,4]),
 picardy:theme(88,6,51,minor,'horn','cello',[7,6,8,7,4,3,5,4,3,1,0,4],[0,4,6,10],[0,8],[0,5,3,4,1,3,0,4]),
 argonne:theme(76,5,43,phrygian,'bassoon','spiccato',[7,4,3,1,4,3,0,1,3,2,1,0],[0,2,6,9],[0,6,9],[0,1,4,0,3,1,0,4]),
 maan:theme(96,5,52,phrygian,'oboe','cello',[7,8,7,4,5,3,1,0,4,3,1,0],[0,3,7,9],[0,7],[0,1,0,4,1,3,0,4]),
 gallipoli:theme(104,3,50,minor,'trumpet','spiccato',[7,9,8,7,4,6,4,3,7,8,4,3],[0,2,5,8],[0,5],[0,0,3,4,1,3,0,4]),
 jutland:theme(66,4,42,minor,'trombone','cello',[7,6,4,3,4,1,0,1,4,3,1,0],[0,3,7],[0,6],[0,5,3,1,0,3,1,4])
});
const ace=(instrument,notes,seconds,accents)=>({instrument,notes,seconds,accents});
export const ACE_MOTIFS=Object.freeze({
 baron:ace('horn',[0,4,7,6,4],5,[1,.5,1,.6,.9]),fonck:ace('trumpet',[7,4,0],3,[.6,.4,.8]),
 voss:ace('spiccato',[7,9,8,11,9,7,6,8,4],4,[.7,.4,.5,.8,.5,.6,.4,.7,.9]),boelcke:ace('horn',[0,4,2,5,4,7],5,[.8,.5,.8,.5,.7,1]),
 collishaw:ace('trombone',[0,3,7,1,4,8],4,[1,.5,.8,1,.5,.8]),baracca:ace('horn',[0,2,4,7,6,9,7],5,[.6,.5,.7,1,.5,.8,1]),
 udet:ace('trumpet',[7,8,4,7,3],3,[1,.5,.8,1,.7]),guynemer:ace('trumpet',[7,9,11,14,11],5,[.5,.6,.7,1,.6]),
 bishop:ace('horn',[0,7,11,7],4,[.4,1,.7,.9]),goering:ace('trombone',[0,2,4,2,7],5,[.8,.7,.7,.6,1]),
 immelmann:ace('clarinet',[0,3,7,10,7,4,0],4,[.5,.6,.7,.9,.7,.6,1]),mannock:ace('strings',[0,7,2,9,4,11],5,[.6,.8,.6,.8,.6,1]),
 mckeever:ace('oboe',[0,4,1,5,2,7],4,[.6,.8,.5,.8,.5,.9]),huffzky:ace('bassoon',[7,0,6,1,4,2],4,[.8,.5,.8,.5,.8,.6]),
 hawker:ace('trumpet',[0,0,4,4,7],3,[.8,.6,.8,.6,1]),berthold:ace('horn',[0,1,0,4],5,[1,.5,.8,1]),
 wolff:ace('strings',[4,7,9,11,8,4,0],4,[.5,.6,.7,.9,.7,.6,.8]),loewenhardt:ace('trumpet',[4,7,11,14,7],4,[.6,.7,.8,1,.9]),
 mccudden:ace('clarinet',[9,7,6,4,3,0],5,[.6,.5,.7,.5,.7,.8]),nungesser:ace('bell',[0,1,4,3],6,[.7,.4,.6,.4]),
 jacobs:ace('trombone',[0,0,1,0,4,3],4,[.8,.5,.8,.5,1,.6]),rickenbacker:ace('trumpet',[0,2,7,4,9,7],4,[.6,.5,.9,.5,.7,1]),
 ball:ace('strings',[7,11,8,4],4,[1,.6,.8,.5]),barker:ace('spiccato',[0,3,4,6,7,9,7],5,[.4,.5,.6,.7,.8,.9,1]),
 luke:ace('trumpet',[0,7,11,4,0],3,[.6,1,.7,.9,1]),brumowski:ace('horn',[0,4,2,4,7,4],5,[1,.5,.6,.5,.9,.6]),
 gontermann:ace('bassoon',[0,0,3,4,6,7],4,[.7,.4,.5,.6,.7,.8]),
 lothar:ace('trumpet',[0,4,7,4],4,[.8,.6,.9,.7]),lufbery:ace('oboe',[7,9,8,7,4],5,[.5,.6,.8,.7,.9]),
 proctor:ace('clarinet',[0,4,7,9,7],4,[.6,.7,.8,.6,1]),sachsenberg:ace('horn',[0,2,4,2,7],5,[.7,.5,.8,.6,1]),
 schleich:ace('bassoon',[7,4,7,8,4],4,[.6,.5,.7,.8,.9])
});
// Individual orchestration, attack rhythm and motif for every catalog boss.
const boss=(voice,steps,notes,mechanic,finalVoice)=>({voice,steps,notes,mechanic,finalVoice});
export const BOSS_ARRANGEMENTS=Object.freeze({
 'paris-gun':boss('horn',[0,6],[0,4,3,0],'rail','cello'),lincomparable:boss('trombone',[0,9],[0,1,4,0],'rail','bassoon'),
 'sms-stuttgart':boss('horn',[0,4,8],[0,4,7,5],'naval','clarinet'),'hms-zubian':boss('clarinet',[0,3,7,10],[7,4,6,3],'split','bassoon'),
 'a7v-flak':boss('trombone',[0,2,6],[0,0,3,1],'armor','trombone'),'mark-v-cruiser':boss('horn',[0,3,4],[0,4,2,7],'armor','horn'),
 'livens-flame-projector':boss('cello',[0,5,9],[0,1,3,1],'siege','bassoon'),'minenwerfer-battery':boss('bassoon',[0,3,7],[0,3,1,4],'siege','trombone'),
 'drachen-net':boss('oboe',[0,2,5],[7,8,11,6],'net','clarinet'),'london-apron':boss('strings',[0,3,5],[7,4,8,5],'net','cello'),
 'zeppelin-l70':boss('cello',[0,7],[0,4,1,5],'airship','bassoon'),hma23:boss('horn',[0,3,6],[0,7,4,9],'airship','horn'),
 gik:boss('trombone',[0,2,5],[0,1,4,3],'bomber','cello'),ca4:boss('horn',[0,3,4],[0,4,7,6],'bomber','clarinet'),
 'armored-harbor-fortress':boss('trombone',[0,3,6],[0,1,4,1],'siege','bassoon'),
 fliegerzug:boss('spiccato',[0,1,3],[0,4,7,1],'rail','trombone'),'treffas-wagen':boss('trombone',[0,3],[0,0,1,4],'armor','horn'),
 'jasta11-circus':boss('horn',[0,3,6,9],[0,4,7,6],'formation','horn'),'naval10-black-flight':boss('trombone',[0,2,6,8],[0,3,7,1],'formation','clarinet'),
 'mark4-wedge':boss('horn',[0,4,6],[0,3,4,7],'armor','cello'),'morser-battery':boss('bassoon',[0,5],[0,1,0,4],'siege','bassoon'),
 'gotha-squadron':boss('cello',[0,2,5,7],[0,3,4,1],'bomber','clarinet'),'london-apron-raid':boss('trumpet',[0,3,7],[7,4,9,6],'net','horn'),
 'paris-staaken-rvi':boss('cello',[0,2,4,7],[0,4,1,3],'bomber','strings'),'paris-searchlight-fortress':boss('clarinet',[0,3,4,7],[7,8,4,6],'searchlight','trombone'),
 'flak-tower':boss('trombone',[0,3,7],[0,4,1,6],'siege','horn'),
 'fort-douaumont':boss('bassoon',[0,3,6],[0,3,1,4],'siege','trombone'),'fort-souville':boss('cello',[0,4,7],[0,2,4,1],'siege','bassoon'),
 'gallipoli-fortress':boss('trombone',[0,2,6],[7,4,1,4],'siege','bassoon'),'jutland-grand-fleet':boss('horn',[0,3,6],[0,4,2,5],'naval','cello'),
 'sinai-landship':boss('trombone',[0,2,4],[0,3,4,1],'armor','horn'),wustenpanzer:boss('horn',[0,2,5],[0,1,3,1],'armor','trombone')
});
export function scorePitch(score,degree){const oct=Math.floor(degree/7),d=((degree%7)+7)%7;return score.key+score.scale[d]+oct*12;}

// Pure score rendering shared by real-time playback and the reproducible audio
// review renderer. emit(instrument, MIDI, seconds, duration, gain, pan).
export function orchestralStep(scene,i,t,b,intensity,emit){
 const s=MUSIC_THEMES[scene.theme]||MUSIC_THEMES.rural,n=s.beats*2,p=i%n,bar=Math.floor(i/n),arc=Math.floor(bar/8)%4;
 const movement=Math.floor(bar/32)%3;
 const chord=s.harmony[(Math.floor(bar/2)+movement*3)%s.harmony.length],q=degree=>scorePitch(s,degree+chord);
 const final=scene.state==='BOSS_FINAL',B=BOSS_ARRANGEMENTS[scene.bossId],thin=arc===2;
 const phrasing=.9+.1*Math.sin(bar*.7),strength=(thin?.76:1)*phrasing;
 const play=(inst,note,dur,vol,pan=0,delay=0)=>emit(inst,note,t+delay,dur,vol*strength,pan);
 const duck=scene.aceId==='ball'&&scene.signatureActive?.35:1;
 // Rearticulation keeps the recorded bow/breath intact instead of looping a
 // frozen sustain. Voicings move by phrase and leave space for battlefield SFX.
 if(p===0||p===Math.floor(n/2)){
  play('bass',q(-7),Math.min(2.8,b*n*.46),.32,0);
  play('cello',q(0),Math.min(2.5,b*n*.43),.24*duck,-.18);
  if(!final&&(!thin||p===0))play('strings',q(bar%2?6:4),Math.min(2.4,b*n*.4),.16*duck,.25);
 }
 const slot=s.rhythm.indexOf(p);
 if(slot>=0&&!(thin&&slot%2)&&!(final&&slot%3===1)){
  const a=(bar*s.rhythm.length+slot+movement*2)%s.motif.length;
  const degree=arc===1?s.motif[(a+4)%s.motif.length]:arc===3?s.motif[(a+8)%s.motif.length]:s.motif[a];
  play(s.lead,q(degree),Math.min(2.3,b*(slot===s.rhythm.length-1?2.2:1.5)),.24*duck,-.27,((i*7)%5)*.003);
  if(arc===1&&slot===0)play('horn',q(4),Math.min(2.6,b*3),.13,.2);
 }
 // Rhythms are authored separately for each map; the Director opens/closes
 // these existing score layers without switching the underlying theme.
 if(intensity>.28&&s.rhythm.includes(p)&&!thin){
  const layer=final?.55:1,inst=s.pulse;
  play(inst,inst==='metal'?60:q(p%3?4:0),Math.min(1.6,b*.85),.27*intensity*layer,.15);
 }
 if(s.drums.includes(p)&&intensity>.3){
  const quiet=scene.phase==='cooldown'?.45:1;
  play('drum',60,.9,.3*intensity*quiet);
  if((bar+p)%3!==0&&intensity>.48&&s.beats<=4)play('snare',60,.3,.18*intensity*quiet,.15,b*.08);
 }
 if(scene.state==='ACE'&&scene.aceId&&ACE_MOTIFS[scene.aceId]&&!scene.signatureActive&&p===0&&bar%2===1){
  const a=ACE_MOTIFS[scene.aceId],k=bar%a.notes.length;
  play(a.instrument,q(a.notes[k]),Math.min(2,b*2.5),.25*intensity,.2);
 }
 if(!B)return;
 const sectionLoss=Math.max(.18,scene.parts??1),engines=scene.engines??1;
 const mode=B.mechanic,rail=mode==='rail',bomber=mode==='bomber';
 const active=B.steps.some(step=>step%n===p);
 if(active){
  const index=(bar+Math.floor(p/2))%B.notes.length,voice=final?B.finalVoice:B.voice;
  const sustain=mode==='airship'?3:mode==='naval'?2:1.2;
  play(voice,q(B.notes[index]),Math.min(2.7,b*sustain),.28*(.7+intensity*.3),.1);
  if(!final&&sectionLoss>.35)play('horn',q(B.notes[index]+4),Math.min(2,b*1.8),.1*sectionLoss,-.25);
 }
 // Part destruction removes voices; it never starts another independent BGM.
 if(rail&&p%2===0&&(!final||p%4===0))play('metal',60,.3,.18*sectionLoss,.1);
 if(rail&&!final){
  // One voice per living rail car, spread across the bar by fleet order.
  const CAR_VOICE={'car-rear':'clarinet','car-middle':'spiccato','car-front':'trombone'},pool=['clarinet','spiccato','trombone','oboe','horn'];
  let ci=0;for(const [carId,on] of Object.entries(scene.cars||{})){const voice=CAR_VOICE[carId]||pool[ci%pool.length];if(on&&p===(1+ci*2)%n)play(voice,q([7,4,0,5,2][ci%5]),Math.min(1.4,b*(.5+ci*.15)),.12+.03*(ci%3),ci%2?.3:-.3);ci++}
 }
 if(bomber&&p%2===0&&engines>.05)play('spiccato',q(0),b*.68,.2*engines*(.65+(scene.urgency||0)*.35),-.1);
 if(mode==='formation'&&p===Math.floor(n/2)&&(scene.formation??1)>.3)play('trumpet',q(7),b*1.8,.2*(scene.formation??1),.3);
 if(scene.locked&&p%2===0){play('snare',60,.3,.22);play('trumpet',q(7),b*.7,.18,-.1);}
 if(final&&p===n-1&&bar%2===0)play(B.finalVoice,q(B.notes[bar%B.notes.length]+1),b*1.8,.22,0);
}

export function signatureNotes(id,themeId,time,emit){
 const a=ACE_MOTIFS[id],s=MUSIC_THEMES[themeId];if(!a||!s)return 0;
 const delay=id==='ball'?.85:0,spacing=(a.seconds-delay)/a.notes.length;
 for(let i=0;i<a.notes.length;i++)emit(a.instrument,scorePitch(s,a.notes[i]+(a.instrument==='bell'?14:0)),time+delay+i*spacing,Math.min(1.8,spacing*.85),.26*a.accents[i],i%2?.16:-.16);
 return a.seconds;
}

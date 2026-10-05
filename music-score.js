// New melodies retained from the overhaul, voiced through the original synth.
// The seven original map scores stay unchanged in music.js. All rhythms use its
// half-beat transport: no independent sample player or free-running accents.
const minor=[0,2,3,5,7,8,10],dorian=[0,2,3,5,7,9,10],phrygian=[0,1,3,5,7,8,10];
const theme=(bpm,beats,key,scale,lead,pulse,motif,rhythm,drums,harmony)=>({bpm,beats,key,scale,lead,pulse,motif,rhythm,drums,harmony});
export const REGIONAL_VARIATIONS=Object.freeze({
 'trenches-hell':theme(70,5,41,phrygian,'bassoon','cello',[7,8,7,3,4,2,1,0,4,3,1,0],[0,3,7,9],[0,7],[0,1,0,4,1,3,0,4]),
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
 'drachen-net':boss('oboe',[0,2,5],[7,8,11,6],'net','clarinet'),'london-apron-raid':boss('strings',[0,3,5],[7,4,8,5],'net','cello'),
 'zeppelin-l70':boss('cello',[0,7],[0,4,1,5],'airship','bassoon'),hma23:boss('horn',[0,3,6],[0,7,4,9],'airship','horn'),
 gik:boss('trombone',[0,2,5],[0,1,4,3],'bomber','cello'),ca4:boss('horn',[0,3,4],[0,4,7,6],'bomber','clarinet'),
 'armored-harbor-fortress':boss('trombone',[0,3,6],[0,1,4,1],'siege','bassoon'),
 fliegerzug:boss('spiccato',[0,1,3],[0,4,7,1],'rail','trombone'),'treffas-wagen':boss('trombone',[0,3],[0,0,1,4],'armor','horn'),
 'jasta11-circus':boss('horn',[0,3,6,9],[0,4,7,6],'formation','horn'),'naval10-black-flight':boss('trombone',[0,2,6,8],[0,3,7,1],'formation','clarinet'),
 'mark4-wedge':boss('horn',[0,4,6],[0,3,4,7],'armor','cello'),'morser-battery':boss('bassoon',[0,5],[0,1,0,4],'siege','bassoon'),
 'gotha-squadron':boss('cello',[0,2,5,7],[0,3,4,1],'bomber','clarinet'),'london-apron-raid':boss('trumpet',[0,3,7],[7,4,9,6],'net','horn'),
 'paris-staaken-rvi':boss('cello',[0,2,4,7],[0,4,1,3],'bomber','strings'),'paris-searchlight-fortress':boss('clarinet',[0,3,4,7],[7,8,4,6],'searchlight','trombone'),
 'gallipoli-fortress':boss('trombone',[0,2,6],[7,4,1,4],'siege','bassoon'),'jutland-grand-fleet':boss('horn',[0,3,6],[0,4,2,5],'naval','cello'),
 'sinai-landship':boss('trombone',[0,2,4],[0,3,4,1],'armor','horn'),wustenpanzer:boss('horn',[0,2,5],[0,1,3,1],'armor','trombone'),
 'flak-tower':boss('trombone',[0,4,7],[0,2,4,1],'siege','bassoon'),'fort-douaumont':boss('horn',[0,3,6],[7,4,1,4],'siege','cello'),
 'fort-souville':boss('cello',[0,2,5],[0,3,4,1],'siege','trombone')
});
export function scorePitch(score,degree){const oct=Math.floor(degree/7),d=((degree%7)+7)%7;return score.key+score.scale[d]+oct*12;}

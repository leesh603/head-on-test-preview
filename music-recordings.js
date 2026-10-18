import {SITUATION_TRACKS} from './music-situation-tracks.js?v=sortierhythm20261018';
// Original score recordings; the active encounter is the only network request.
const BASE='https://head-on-tension-audio.justzeon.chatgpt.site/audio-packs/headon-tension-v1/';
const TRACKS={"supermarine-nighthawk":{"id":"supermarine-nighthawk","file":"audio/boss/supermarine-nighthawk.ogg","family":"searchlight","loopEnd":49.6551875},"siemens-schuckert-r-viii":{"id":"siemens-schuckert-r-viii","file":"audio/boss/siemens-schuckert-r-viii.ogg","family":"bomber","loopEnd":48.0},"paris-gun":{"id":"paris-gun","file":"audio/boss/paris-gun.ogg","family":"rail","loopEnd":55.384625},"lincomparable":{"id":"lincomparable","file":"audio/boss/lincomparable.ogg","family":"rail","loopEnd":57.6},"sms-stuttgart":{"id":"sms-stuttgart","file":"audio/boss/sms-stuttgart.ogg","family":"naval","loopEnd":58.7755},"hms-zubian":{"id":"hms-zubian","file":"audio/boss/hms-zubian.ogg","family":"naval","loopEnd":51.4285625},"a7v-flak":{"id":"a7v-flak","file":"audio/boss/a7v-flak.ogg","family":"armor","loopEnd":48.0},"mark-v-cruiser":{"id":"mark-v-cruiser","file":"audio/boss/mark-v-cruiser.ogg","family":"armor","loopEnd":49.6551875},"livens-flame-projector":{"id":"livens-flame-projector","file":"audio/boss/livens-flame-projector.ogg","family":"siege","loopEnd":51.4285625},"minenwerfer-battery":{"id":"minenwerfer-battery","file":"audio/boss/minenwerfer-battery.ogg","family":"siege","loopEnd":53.33334375},"drachen-net":{"id":"drachen-net","file":"audio/boss/drachen-net.ogg","family":"net","loopEnd":44.3076875},"london-apron-raid":{"id":"london-apron-raid","file":"audio/boss/london-apron-raid.ogg","family":"net","loopEnd":45.0},"zeppelin-l70":{"id":"zeppelin-l70","file":"audio/boss/zeppelin-l70.ogg","family":"airship","loopEnd":62.6086875},"hma23":{"id":"hma23","file":"audio/boss/hma23.ogg","family":"airship","loopEnd":61.27659375},"gik":{"id":"gik","file":"audio/boss/gik.ogg","family":"bomber","loopEnd":48.0},"ca4":{"id":"ca4","file":"audio/boss/ca4.ogg","family":"bomber","loopEnd":48.0},"armored-harbor-fortress":{"id":"armored-harbor-fortress","file":"audio/boss/armored-harbor-fortress.ogg","family":"siege","loopEnd":54.339625},"fliegerzug":{"id":"fliegerzug","file":"audio/boss/fliegerzug.ogg","family":"rail","loopEnd":53.33334375},"treffas-wagen":{"id":"treffas-wagen","file":"audio/boss/treffas-wagen.ogg","family":"armor","loopEnd":48.0},"jasta11-circus":{"id":"jasta11-circus","file":"audio/boss/jasta11-circus.ogg","family":"formation","loopEnd":41.739125},"naval10-black-flight":{"id":"naval10-black-flight","file":"audio/boss/naval10-black-flight.ogg","family":"formation","loopEnd":41.14284375},"mark4-wedge":{"id":"mark4-wedge","file":"audio/boss/mark4-wedge.ogg","family":"armor","loopEnd":48.8135625},"morser-battery":{"id":"morser-battery","file":"audio/boss/morser-battery.ogg","family":"siege","loopEnd":56.47059375},"gotha-squadron":{"id":"gotha-squadron","file":"audio/boss/gotha-squadron.ogg","family":"bomber","loopEnd":45.71428125},"paris-staaken-rvi":{"id":"paris-staaken-rvi","file":"audio/boss/paris-staaken-rvi.ogg","family":"bomber","loopEnd":45.71428125},"paris-searchlight-fortress":{"id":"paris-searchlight-fortress","file":"audio/boss/paris-searchlight-fortress.ogg","family":"searchlight","loopEnd":48.0},"gallipoli-fortress":{"id":"gallipoli-fortress","file":"audio/boss/gallipoli-fortress.ogg","family":"siege","loopEnd":54.339625},"jutland-grand-fleet":{"id":"jutland-grand-fleet","file":"audio/boss/jutland-grand-fleet.ogg","family":"naval","loopEnd":58.7755},"sinai-landship":{"id":"sinai-landship","file":"audio/boss/sinai-landship.ogg","family":"armor","loopEnd":48.0},"wustenpanzer":{"id":"wustenpanzer","file":"audio/boss/wustenpanzer.ogg","family":"armor","loopEnd":48.8135625},"flak-tower":{"id":"flak-tower","file":"audio/boss/flak-tower.ogg","family":"siege","loopEnd":56.47059375},"fort-douaumont":{"id":"fort-douaumont","file":"audio/boss/fort-douaumont.ogg","family":"siege","loopEnd":57.6},"fort-souville":{"id":"fort-souville","file":"audio/boss/fort-souville.ogg","family":"siege","loopEnd":56.47059375},"baron":{"id":"baron","file":"audio/ace/baron.ogg","family":"command","loopEnd":43.636375},"fonck":{"id":"fonck","file":"audio/ace/fonck.ogg","family":"precision","loopEnd":41.739125},"voss":{"id":"voss","file":"audio/ace/voss.ogg","family":"agile","loopEnd":37.40259375},"boelcke":{"id":"boelcke","file":"audio/ace/boelcke.ogg","family":"command","loopEnd":42.3529375},"collishaw":{"id":"collishaw","file":"audio/ace/collishaw.ogg","family":"shadow","loopEnd":44.3076875},"baracca":{"id":"baracca","file":"audio/ace/baracca.ogg","family":"duelist","loopEnd":39.4520625},"udet":{"id":"udet","file":"audio/ace/udet.ogg","family":"daredevil","loopEnd":37.40259375},"guynemer":{"id":"guynemer","file":"audio/ace/guynemer.ogg","family":"duelist","loopEnd":41.14284375},"bishop":{"id":"bishop","file":"audio/ace/bishop.ogg","family":"shadow","loopEnd":44.3076875},"goering":{"id":"goering","file":"audio/ace/goering.ogg","family":"command","loopEnd":44.3076875},"immelmann":{"id":"immelmann","file":"audio/ace/immelmann.ogg","family":"agile","loopEnd":38.4},"mannock":{"id":"mannock","file":"audio/ace/mannock.ogg","family":"duelist","loopEnd":38.91890625},"mckeever":{"id":"mckeever","file":"audio/ace/mckeever.ogg","family":"precision","loopEnd":41.739125},"huffzky":{"id":"huffzky","file":"audio/ace/huffzky.ogg","family":"shadow","loopEnd":44.3076875},"hawker":{"id":"hawker","file":"audio/ace/hawker.ogg","family":"duelist","loopEnd":40.0},"berthold":{"id":"berthold","file":"audio/ace/berthold.ogg","family":"shadow","loopEnd":45.71428125},"wolff":{"id":"wolff","file":"audio/ace/wolff.ogg","family":"agile","loopEnd":37.89475},"loewenhardt":{"id":"loewenhardt","file":"audio/ace/loewenhardt.ogg","family":"duelist","loopEnd":38.91890625},"mccudden":{"id":"mccudden","file":"audio/ace/mccudden.ogg","family":"precision","loopEnd":40.563375},"nungesser":{"id":"nungesser","file":"audio/ace/nungesser.ogg","family":"shadow","loopEnd":46.451625},"jacobs":{"id":"jacobs","file":"audio/ace/jacobs.ogg","family":"shadow","loopEnd":45.0},"rickenbacker":{"id":"rickenbacker","file":"audio/ace/rickenbacker.ogg","family":"daredevil","loopEnd":37.40259375},"ball":{"id":"ball","file":"audio/ace/ball.ogg","family":"daredevil","loopEnd":38.4},"barker":{"id":"barker","file":"audio/ace/barker.ogg","family":"agile","loopEnd":40.0},"luke":{"id":"luke","file":"audio/ace/luke.ogg","family":"daredevil","loopEnd":38.4},"brumowski":{"id":"brumowski","file":"audio/ace/brumowski.ogg","family":"command","loopEnd":43.636375},"gontermann":{"id":"gontermann","file":"audio/ace/gontermann.ogg","family":"daredevil","loopEnd":37.89475},"lothar":{"id":"lothar","file":"audio/ace/lothar.ogg","family":"daredevil","loopEnd":38.91890625},"lufbery":{"id":"lufbery","file":"audio/ace/lufbery.ogg","family":"duelist","loopEnd":38.91890625},"proctor":{"id":"proctor","file":"audio/ace/proctor.ogg","family":"precision","loopEnd":41.14284375},"sachsenberg":{"id":"sachsenberg","file":"audio/ace/sachsenberg.ogg","family":"command","loopEnd":45.0},"schleich":{"id":"schleich","file":"audio/ace/schleich.ogg","family":"shadow","loopEnd":44.3076875},"final-rail":{"id":"final-rail","file":"audio/final/rail.ogg","family":"rail","loopEnd":55.384625},"final-naval":{"id":"final-naval","file":"audio/final/naval.ogg","family":"naval","loopEnd":58.7755},"final-armor":{"id":"final-armor","file":"audio/final/armor.ogg","family":"armor","loopEnd":48.0},"final-siege":{"id":"final-siege","file":"audio/final/siege.ogg","family":"siege","loopEnd":51.4285625},"final-net":{"id":"final-net","file":"audio/final/net.ogg","family":"net","loopEnd":44.3076875},"final-searchlight":{"id":"final-searchlight","file":"audio/final/searchlight.ogg","family":"searchlight","loopEnd":49.6551875},"final-airship":{"id":"final-airship","file":"audio/final/airship.ogg","family":"airship","loopEnd":62.6086875},"final-bomber":{"id":"final-bomber","file":"audio/final/bomber.ogg","family":"bomber","loopEnd":48.0},"final-formation":{"id":"final-formation","file":"audio/final/formation.ogg","family":"formation","loopEnd":41.739125}};
export function recordingForScene(scene){
 if(SITUATION_TRACKS[scene?.situationTrack]?.kind==='loop')return SITUATION_TRACKS[scene.situationTrack];
 if(scene?.state==='ACE')return TRACKS[scene.aceId]||null;
 if(scene?.state!=='BOSS'&&scene?.state!=='BOSS_FINAL')return null;
 const boss=TRACKS[scene.bossId==='london-apron'?'london-apron-raid':scene.bossId];
 return scene.state==='BOSS_FINAL'&&boss?TRACKS['final-'+boss.family]||boss:boss||null;
}
export class RecordedBattleMusic{
 constructor({fetcher=globalThis.fetch?.bind(globalThis),onStart=()=>{}}={}){
  this.fetcher=fetcher;this.onStart=onStart;this.cache=new Map();this.serial=0;this.voice=null;this.retiring=null;this.request=null;this.resume=null;this.error=null;this.failedAt=0;this.stingerSerial=0;this.stinger=null;
 }
 get playing(){return !!this.voice;}
 stopVoice(voice,fade=.9){
  if(!voice)return;
  const now=voice.ctx.currentTime,g=voice.gain.gain;
  if(g.cancelAndHoldAtTime)g.cancelAndHoldAtTime(now);else{g.cancelScheduledValues(now);g.setValueAtTime(g.value,now);}
  g.linearRampToValueAtTime(0,now+fade);
  try{voice.source.stop(now+fade+.01);}catch{}
 }
 silence(preserve=false){
  if(preserve)this.stopStinger();
  this.serial++;this.abort?.abort();this.abort=null;this.loading=null;this.request=null;
  if(this.voice){
   const v=this.voice;
   this.resume=preserve?{track:v.track,scope:v.scope,run:v.run,offset:(v.offset+v.ctx.currentTime-v.startedAt)%v.loopEnd}:null;
   this.stopVoice(this.retiring,.02);this.retiring=v;this.stopVoice(v,preserve?.04:.9);this.voice=null;
  }else if(!preserve)this.resume=null;
 }
 reset(){this.stopStinger();this.silence();this.stopVoice(this.retiring,.02);this.retiring=null;this.error=null;this.failedAt=0;}
 sync(ctx,bus,scene,off=false){
  const track=recordingForScene(scene),scope=track?.situation?scene?.run:scene?.state==='ACE'?scene.ace:scene?.encounterId;
  if(off)this.stopStinger();
  if(off||!track||!ctx?.createBufferSource||!ctx.decodeAudioData){if(this.request||this.voice)this.silence(off);else if(!off)this.resume=null;return;}
  if(this.request?.track===track&&this.request.scope===scope&&this.request.run===scene.run){
   if(this.voice?.track===track||this.loading||Date.now()-this.failedAt<15000)return;
  }
  this.abort?.abort();const serial=++this.serial;
  const request=this.request={track,scope,run:scene.run,fade:scene.musicCrossfade||1};this.abort=new AbortController();
  const load=this.load(ctx,track,this.abort.signal);this.loading=load;
  load.then(buffer=>{
   if(serial!==this.serial||this.request!==request)return;
   this.loading=null;this.error=null;this.failedAt=0;
   this.cache.delete(track.id);this.cache.set(track.id,buffer);
   while(this.cache.size>2)this.cache.delete(this.cache.keys().next().value);
   this.start(ctx,bus,request,buffer);
  }).catch(error=>{
   if(serial!==this.serial)return;
   this.loading=null;this.error=error.message;this.failedAt=Date.now();
   // Keep a failed transition's previous recording from covering its synth fallback.
   if(this.voice&&!track.situation){this.stopVoice(this.voice,.3);this.voice=null;}
  });
 }
 async load(ctx,track,signal){
  if(this.cache.has(track.id))return this.cache.get(track.id);
  const ogg=typeof Audio==='undefined'||!!new Audio().canPlayType('audio/ogg; codecs="vorbis"');
  let last;
  for(const ext of ogg?['ogg','mp3']:['mp3','ogg'])try{
   const response=await this.fetcher((track.base||BASE)+track.file.replace(/\.ogg$/,'.'+ext),{signal,mode:'cors'});
   if(!response.ok)throw Error('BGM HTTP '+response.status);
   const buffer=await ctx.decodeAudioData(await response.arrayBuffer());
   if(signal.aborted)throw Object.assign(Error('Aborted'),{name:'AbortError'});
   return buffer;
  }catch(error){if(signal.aborted)throw error;last=error;}
  throw last;
 }
 start(ctx,bus,request,buffer){
  this.stopVoice(this.retiring,.02);this.retiring=this.voice;this.stopVoice(this.voice,request.fade||.9);
  const source=ctx.createBufferSource(),gain=ctx.createGain(),now=ctx.currentTime;
  const loopEnd=Math.min(buffer.duration,request.track.loopEnd),saved=this.resume;
  const offset=saved?.track===request.track&&saved.scope===request.scope&&saved.run===request.run?saved.offset%loopEnd:0;
  this.resume=null;source.buffer=buffer;source.loop=true;source.loopStart=0;source.loopEnd=loopEnd;
  gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.72,now+(request.fade||1));
  source.connect(gain);gain.connect(bus);
  const voice={...request,source,gain,ctx,offset,startedAt:now,loopEnd};this.voice=voice;
  source.onended=()=>{source.disconnect();gain.disconnect();if(this.retiring===voice)this.retiring=null;};
  source.start(now,offset);this.onStart();
 }
 stopStinger(){
  this.stingerSerial++;this.stingerAbort?.abort();this.stingerAbort=null;
  this.stopVoice(this.stinger,.04);this.stinger=null;
 }
 playStinger(ctx,bus,id){
  const track=SITUATION_TRACKS[id];if(track?.kind!=='stinger'||!ctx?.createBufferSource||!ctx.decodeAudioData||ctx.state==='suspended'||ctx.state==='closed')return;
  this.stopStinger();const serial=this.stingerSerial,at=ctx.currentTime;
  const abort=this.stingerAbort=new AbortController();
  this.load(ctx,track,abort.signal).then(buffer=>{
   if(serial!==this.stingerSerial||abort.signal.aborted||ctx.currentTime-at>2)return;
   this.cache.delete(track.id);this.cache.set(track.id,buffer);while(this.cache.size>2)this.cache.delete(this.cache.keys().next().value);
   const source=ctx.createBufferSource(),gain=ctx.createGain(),now=ctx.currentTime;
   source.buffer=buffer;source.loop=false;gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.26,now+.03);
   source.connect(gain);gain.connect(bus);const voice={source,gain,ctx};this.stinger=voice;
   source.onended=()=>{source.disconnect();gain.disconnect();if(this.stinger===voice)this.stinger=null;};source.start(now,0);
  }).catch(()=>{});
 }
 status(){return {trackId:this.voice?.track.id||null,loading:this.loading?this.request?.track.id:null,cached:this.cache.size,error:this.error};}
}

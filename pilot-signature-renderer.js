// Draw authored game textures; omit any insignia whose artwork is unavailable.
import {PILOT_SIGNATURES} from './pilot-signature-state.js';
import {signatureWingPositions} from './pilot-signature-geometry.js';
const TAU=Math.PI*2;
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const SYMBOL_ICONS=Object.freeze({blackHorse:'prancingHorse',lo:'loEmblem',vossCowling:'sacredCowling'});
export const UNRESOLVED_SIGNATURE_ART=Object.freeze(['wingedSword','blackDevil','skull','cigogne']);
export function createPilotSignatureRenderer({fx,icon,petal=()=>{},insignia=()=>false}){
 if(typeof fx!=='function'||typeof icon!=='function')throw new TypeError('Authored FX and icon renderers are required');
 const texture=(c,key,x,y,w,h=w,a=0,opacity=1)=>fx(c,key,x,y,w,h,a,clamp(opacity));
 function smokeArc(c,r,from,to,time,opacity=.3,flatten=1,count=12){
  for(let i=0;i<count;i++){const q=i/(count-1),a=from+(to-from)*q;texture(c,'gunSmoke',Math.cos(a)*r,Math.sin(a)*r*flatten,18+q*13,12+q*9,a+time*.15,opacity*(.35+.65*q))}
 }
 function flash(c,rear=false,strength=1,heavy=false){
  const a=rear?Math.PI:0,x=rear?-29:31;
  texture(c,heavy?'muzzleHeavy':rear?'muzzleRear':'muzzleTwin',x,0,heavy?74:34+12*strength,heavy?41:20,a,.88);
  texture(c,'gunSmoke',x+Math.cos(a)*9,0,31+9*strength,22,a,.32);
 }
 function crest(c,symbol,time,opacity=.35,size=96){
  if(!symbol)return false;
  c.save();try{c.rotate(symbol==='blackHeart'?-Math.PI/2:Math.PI/2);c.globalAlpha*=opacity;if(insignia(c,symbol,0,0,size,time))return true;const key=SYMBOL_ICONS[symbol];if(!key)return false;icon(c,key,0,0,size);return true}finally{c.restore()}
 }
 function metal(c,time,n=5,opacity=.7){for(let i=0;i<n;i++){const a=i*TAU/n+.35,d=24+time*(27+i*6);texture(c,'metalShard'+(i%6),Math.cos(a)*d,Math.sin(a)*d,9+i%3*3,9+i%3*3,a+time*(i-2),opacity)}}
 function petals(c,time,n=7){for(let i=0;i<n;i++){const a=i*2.4;petal(c,{life:Math.max(.01,1.4-time),maxLife:1.4,angle:a,spin:(i%2?1:-1)*1.3,size:4+i%3},-20-time*(35+i*5),Math.sin(a)*20+Math.sin(time*3+a)*12)}}
 // A pointed envelope of painted slipstreams, with an open center for the aircraft.
 // The angled textures converge beyond the nose; no polygon or filled aura is drawn.
 function cavalrySlipstream(c,time,opacity=1){
  for(const side of [-1,1]){
   for(let i=0;i<3;i++){
    const phase=(time*7+i*.31)%1,x=21-i*29-phase*12,y=side*(13+i*10+phase*4);
    texture(c,'windStreak',x,y,66+i*17,10+i*3,-side*.34,(.43-i*.07)*opacity);
   }
   texture(c,'vaporTrail',-38,side*37,105,11,-side*.22,.23*opacity);
   const phase=(time*5+side*.2+1)%1;
   texture(c,'metalShard'+(side>0?1:4),40-phase*87,side*(14+phase*28),7,5,side*.4,.48*(1-phase)*opacity);
  }
  texture(c,'windStreak',48,0,46,7,0,.35*opacity);
 }
 function volleyRing(c,p,e,front){
  c.rotate(e.a-p.a);
  // One short-lived smoke disturbance at the real salvo origin; each radial shot crosses it.
  for(let i=0;i<18;i++){
   const a=i*TAU/18;if((Math.sin(a)>=0)!==front)continue;
   const r=48+e.age*15,uneven=1+Math.sin(i*2.7)*.06;
   texture(c,'gunSmoke',Math.cos(a)*r*uneven,Math.sin(a)*r*.82,15+i%3*3,12+i%3*2,a+.4,.31);
  }
 }
 function start(c,p,e,foreground=false){
  const q=clamp(e.age/e.maxLife),fade=Math.min(1,e.age/.09)*Math.min(1,e.life/.28),time=e.age;c.globalAlpha*=fade;
  switch(e.kind){
   case 'cavalryCharge':if(time<.4)crest(c,'blackHorse',q,.19*(1-time/.4),88);break;
   case 'blackHeart':if(time<.35)texture(c,'smokeDark',-34,0,55+q*25,38,Math.PI,.18);break;
   case 'ringPass':{
    // The visible ring is emitted by actual piercing volleys, not by pressing the skill alone.
    if(!foreground&&p.muzzleFlash>0)texture(c,'gunSmoke',32,0,24,17,0,.25);
    break;
   }
   case 'ringVolley':volleyRing(c,p,e,foreground);break;
   case 'phoenixDeflect':metal(c,time,3,.75);texture(c,'smokeDark',0,0,34+time*25,26,Math.PI,.3);break;
   case 'climbingAttack':for(const side of [-1,1]){c.save();c.translate(-28,side*22);c.scale(1,side);smokeArc(c,48,Math.PI*.68,Math.PI*(.68+.64*q),time,.22,.65,8);c.restore()}if(q>.3&&q<.8)flash(c,false,1.2);break;
   case 'counterRoll':case 'grazeRoll':crest(c,'lo',q,.28,86);c.save();c.rotate((e.direction||1)*q*Math.PI);smokeArc(c,45,-1.2,1.2,time,.4,.7,10);c.restore();break;
   case 'halfLoop':smokeArc(c,54,Math.PI*.55,Math.PI*.55+Math.PI*q,time,.4,.65,14);if(q>.65)flash(c,false,1.1);break;
   case 'sixDirections':crest(c,'vossCowling',q,.32,92);for(let i=0;i<6;i++){c.save();c.rotate(i*TAU/6);texture(c,'engineSmoke',35+q*85,0,31,18,0,.24);c.restore()}break;
   case 'redHunt':case 'huntConfirmation':texture(c,'sunshaft',-85,0,210,85,Math.PI,.15);break;
   case 'sightConverge':case 'steadySight':for(const side of [-1,1])texture(c,'tracerCream',52+q*58,side*(1-q)*26,55,5,0,.45);break;
   case 'pincerOrder':case 'whiteCommand':case 'blackFlight':case 'coverOrder':case 'skullGuard':{
    if(e.kind==='skullGuard')crest(c,'skull',q,.3,90);
    const wings=signatureWingPositions(p);
    wings.forEach((w,i)=>{const launch=e.kind==='blackFlight'?i%2*.16:e.kind==='whiteCommand'?i*.06:0;if(time<launch||time>launch+.5)return;c.save();c.translate(w.x,w.y);c.rotate(w.a);texture(c,e.kind==='blackFlight'?'smokeDark':e.kind==='coverOrder'?'smokeWisp':'engineSmoke',-23,0,54,24,Math.PI,.32);if(e.kind==='whiteCommand'&&time<launch+.15)flash(c,false,.6);c.restore()});
    if(!wings.length)texture(c,'gunSmoke',-29,0,36,20,Math.PI,.35);break;
   }
   case 'wingedSword':crest(c,'wingedSword',q,.4,106);metal(c,q,4,.55);break;
   case 'blackDevil':crest(c,'blackDevil',q,.36,100);smokeArc(c,39,1.4,1.4+3.8*q,time,.28,.7,13);break;
   case 'storkCannon':crest(c,'cigogne',q,.26,90);texture(c,'gunSmoke',32,0,60,32,0,.4);break;
   case 'fuseIgnition':texture(c,'incendiary',33,0,44,30,0,.8);break;
   case 'incendiaryRun':for(const side of [-1,1])texture(c,'incendiary',28,side*8,49,17,0,.65);break;
   case 'gunnerHandoff':flash(c,false,.7);flash(c,true,1.1);break;
   case 'attackRun':flash(c,true,.8);texture(c,'gunSmoke',-12,17,32,28,Math.PI,.4);break;
   case 'closeAttack':flash(c,false,1.6);texture(c,'gunSmoke',55,0,48,34,0,.36);break;
   case 'cloudAmbush':texture(c,'mist',-8,0,132+q*44,82+q*22,0,.6);break;
   case 'lastStand':metal(c,q,4,.55);texture(c,'engineSmoke',-30-q*45,0,65+q*38,39,0,.35);break;
   case 'petalDive':case 'petalScatter':petals(c,time,e.count||8);break;
   case 'fieldRepair':texture(c,'gunSmoke',-28,0,70,42,Math.PI,.35*(1-q));metal(c,q,3,.5);break;
   case 'survivalBreak':metal(c,q,6,.7);texture(c,'smokeDark',-35-q*80,0,80,48,Math.PI,.35);break;
   case 'ambushBreak':texture(c,'mist',-50,0,116,68,0,.28);flash(c,false,1.6);break;
   case 'shotAccent':if(e.active)flash(c,e.gun===1,e.style==='cannon'?1.8:1,e.style==='cannon');break;
   case 'defiantHit':case 'wound':case 'escape':metal(c,q,4,.7);crest(c,e.symbol,q,.27,92);break;
   case 'fuseHit':texture(c,'fireEngine',0,0,38,30,0,.6);break;
   case 'burnKill':texture(c,'fireFlash',0,0,56,44,0,.6);break;
   case 'cannonShot':flash(c,false,1.8,true);texture(c,'gunSmoke',39,0,75,45,0,.48);break;
   case 'climbSalvo':if(p.aceSkillPhase==='vertical-fire'||!p.aceSkillPhase){flash(c,false,1.6);texture(c,'gunSmoke',-38,0,74,31,Math.PI,.22)}break;
   case 'reverseShot':flash(c,false,1.1);smokeArc(c,36,1.6,3.9,time,.24,.65,7);break;
   case 'rearShot':case 'handoff':flash(c,true,1.3);texture(c,'tracerCream',-58,0,40,5,Math.PI,.55);break;
   case 'aimedShot':texture(c,'tracerCream',36,0,70,4,0,.7);texture(c,'armorSpark',0,0,22,15,0,.65);break;
   case 'headOn':texture(c,'armorSpark',0,0,30,20,0,.6);texture(c,'metalShard1',-10,12,7,5,.4,.6);break;
   case 'hunt':texture(c,'ricochet',0,0,45,24,0,.65);break;
   case 'encircled':crest(c,'vossCowling',q,.24,70);texture(c,'smokeWisp',-23,0,40,20,Math.PI,.28);break;
   case 'graze':smokeArc(c,33,-1.3,1.3,time,.32,.6,8);break;
   case 'turnShot':texture(c,'gunSmoke',-15,0,45,24,.8,.3);texture(c,'spark',0,0,30,22,0,.65);break;
   case 'rearAttack':case 'crossfire':case 'rescueShot':case 'intercept':texture(c,'ricochet',0,0,40,22,0,.65);texture(c,'gunSmoke',-18,0,30,18,0,.22);break;
   case 'targetSwitch':smokeArc(c,24,-.9,.9,time,.26,.75,6);texture(c,'spark',0,0,30,20,0,.6);break;
   case 'ambushShot':texture(c,'mist',-18,0,65,34,0,.25);texture(c,'armorSpark',0,0,44,26,0,.72);break;
   case 'petalKill':petals(c,time,7);break;
   case 'repair':texture(c,'gunSmoke',-25,0,46,26,Math.PI,.2);metal(c,time,3,.5);break;
   case 'precisionHit':case 'closeHit':case 'commandHit':texture(c,'armorSpark',0,0,e.kind==='precisionHit'?24:42,24,0,.7);break;
  }
 }
 function continuous(c,p,profile,s){
  const t=s.clock,age=s.activeAge,shot=p.muzzleFlash>0,active=p.skillTime>0;
  if(p.pilot==='nungesser'){
   const low=p.maxHp>0?clamp((1-p.hp/p.maxHp)/.8):0;
   if(low>.12||active){
    const opacity=active?.30:.055+low*.13;
    crest(c,'blackHeart',t,opacity,active?102:80+low*12);
    for(let i=0;i<(active?3:2);i++){
     const q=(t*(active?1.6:1)+i*.43)%1;
     texture(c,'smokeDark',-31-q*(active?63:38),Math.sin(t*2+i)*7,30+q*35,23+q*15,Math.PI,(active?.3:.24*low)*(1-q));
    }
   }
   return;
  }
  if(!active)return;
  switch(profile.sustain){
   case 'charge':if(p.chargeTime>0)cavalrySlipstream(c,t,Math.min(1,p.chargeTime/.12));break;
   case 'defyDeath':if(age>.65)crest(c,'blackHeart',age,.18,102);if(p.hitFlash>0)texture(c,'armorSpark',18,0,52,42,p.a,.65);break;
   case 'precision':if(shot)texture(c,'tracerCream',54,0,63,5,0,.68);break;
   case 'cannon':if(p.cannonRecoil129>0)flash(c,false,1.8,true);break;
   case 'gunPlatform':if(shot){flash(c,false,1.5);texture(c,'smokePuff',41,0,38,24,0,.25)}break;
   case 'climb':if(age>.4&&age<2.5){texture(c,'vaporTrail',-48,0,95,28,Math.PI,.18);if(shot)flash(c,false,1.25)}break;
   case 'roll':if(Math.abs(s.turnRate)>.6){c.save();c.rotate(Math.sign(s.turnRate)*.8);texture(c,'smokeWisp',-39,18,75,24,Math.PI,.28);c.restore()}break;
   case 'reversal':if(age<.8)texture(c,'vaporTrail',-42,0,75,19,Math.PI,.22);break;
   case 'tightTurn':if(Math.abs(s.turnRate)>.35)smokeArc(c,35,1.5,4.8,t,.20,.75,9);break;
   case 'defiance':if(p.hitFlash>0)metal(c,0,5,.7);break;
   case 'bombRun':if(shot)flash(c,true,1.25);break;
   case 'twoSeater':if(shot){flash(c,false,.65);flash(c,true,1.3)}break;
   case 'closeFire':if(shot)flash(c,false,1.8);break;
   case 'flameAttack':if(shot)texture(c,'incendiary',41,0,58,23,0,.6);break;
   case 'fuse':if(shot)texture(c,'incendiary',36,0,35,18,0,.65);break;
   case 'concealment':if(p.ballCloak>0)texture(c,'mist',-10,0,125,75,.1*Math.sin(t),.45);break;
   case 'survival':if(p.hp<Math.max(10,p.maxHp*.2))texture(c,'smokeDark',-39,0,62,28,Math.PI,.4);break;
   case 'petals':petals(c,(t*.6)%1.3,5);break;
   case 'maintenance':texture(c,'gunSmoke',-30,0,45,27,Math.PI,.22*(1-clamp(age/4)));break;
   case 'pursuit':case 'decoy':case 'pincer':case 'convergence':case 'guard':case 'splitFlight':case 'cover':case 'ringFlight':break;
  }
 }
 return function drawPilotSignature(c,p,x,y,layer='under'){
  const s=p.pilotSignatureState,profile=PILOT_SIGNATURES[p.pilot];if(!s||!profile||!(p.hp>0)||![x,y,p.a].every(Number.isFinite))return false;
  c.save();try{
   c.translate(x,y);c.rotate(p.a);if(layer!=='front')continuous(c,p,profile,s);
   for(const e of s.effects){if(layer==='front'&&e.kind!=='ringPass'&&e.kind!=='ringVolley')continue;const dx=e.x-p.x,dy=e.y-p.y;c.save();try{if(!e.signatureStart&&e.kind!=='shotAccent')c.translate(dx*Math.cos(p.a)+dy*Math.sin(p.a),-dx*Math.sin(p.a)+dy*Math.cos(p.a));start(c,p,e,layer==='front')}finally{c.restore()}}
  }finally{c.restore()}
  return true;
 };
}

// Draw authored game textures; omit any insignia whose artwork is unavailable.
import {PILOT_SIGNATURES} from './pilot-signature-state.js';
import {signatureWingPositions} from './pilot-signature-geometry.js';
import {drawCavalryGuard,drawCavalryLance,drawRickenbackerHalfRing} from './pilot-directed-fx.js';
const TAU=Math.PI*2;
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const SYMBOL_ICONS=Object.freeze({lo:'loEmblem',vossCowling:'sacredCowling'});
export const UNRESOLVED_SIGNATURE_ART=Object.freeze(['wingedSword','blackDevil','cigogne']);
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
 function muzzleAt(c,x,y,a,key='muzzleTwin',strength=1){texture(c,key,x+Math.cos(a)*7,y+Math.sin(a)*7,48*strength,23*strength,a,.95);texture(c,'gunSmoke',x+Math.cos(a)*16,y+Math.sin(a)*16,36,19,a,.28)}
 function crest(c,symbol,time,opacity=.35,size=96){
  if(!symbol)return false;
  c.save();try{c.rotate(symbol==='blackHeart'?-Math.PI/2:Math.PI/2);c.globalAlpha*=opacity;if(insignia(c,symbol,0,0,size,time))return true;const key=SYMBOL_ICONS[symbol];if(!key)return false;icon(c,key,0,0,size);return true}finally{c.restore()}
 }
 function metal(c,time,n=5,opacity=.7){for(let i=0;i<n;i++){const a=i*TAU/n+.35,d=24+time*(27+i*6);texture(c,'metalShard'+(i%6),Math.cos(a)*d,Math.sin(a)*d,9+i%3*3,9+i%3*3,a+time*(i-2),opacity)}}
 function petals(c,time,n=7){for(let i=0;i<n;i++){const a=i*2.4;petal(c,{life:Math.max(.01,1.4-time),maxLife:1.4,angle:a,spin:(i%2?1:-1)*1.3,size:4+i%3},-20-time*(35+i*5),Math.sin(a)*20+Math.sin(time*3+a)*12)}}
 // A pointed envelope of painted slipstreams, with an open center for the aircraft.
 // The angled textures converge beyond the nose; no polygon or filled aura is drawn.
 function cavalrySlipstream(c,time,opacity=1){
  drawCavalryLance(c,time,opacity);
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
  for(let i=0;i<=8;i++){
   const a=-Math.PI/2+i*Math.PI/8;if((Math.sin(a)>=0)!==front)continue;
   const r=46+e.age*10,uneven=1+Math.sin(i*2.7)*.035;
   texture(c,'gunSmoke',9+Math.cos(a)*r*uneven,Math.sin(a)*r*.95,12+i%3*2,10+i%3*2,a+.4,.18);
  }
 }
 function worldEffects(c,p){
  const world=p.combatWorld?.()||p,owner=p.id||'p1';
  if(p.pilot==='hawker'&&!(p.skillTime>0)&&p.straightCharge>0)for(const b of world.bullets||[]){
   if(b.life<=0||b.enemy||b.ally||b.patrol||b.formation||b.rocket||b.motorCannon||b.cow37||b.mauserRound||b.blast||b.actualExplosion||b.gun===undefined||(b.ownerId!==undefined&&b.ownerId!==owner)||Math.hypot(b.x-p.x,b.y-p.y)>700)continue;
   const a=Math.atan2(b.vy,b.vx),strength=clamp(p.straightCharge);
   texture(c,'tracerCream',b.x-p.x-Math.cos(a)*10,b.y-p.y-Math.sin(a)*10,27+strength*13,3,a,.24+strength*.22);
  }
  if(p.pilot==='guynemer')for(const b of world.bullets||[]){
   if(!b.rocket||b.enemy||b.life<=0||(b.ownerId!==undefined&&b.ownerId!==owner)||Math.hypot(b.x-p.x,b.y-p.y)>900)continue;
   const a=Math.atan2(b.vy,b.vx),x=b.x-p.x,y=b.y-p.y;
   texture(c,'incendiary',x-Math.cos(a)*21,y-Math.sin(a)*21,24,9,a,.65);
   for(let i=0;i<3;i++)texture(c,'smokeWisp',x-Math.cos(a)*(32+i*19),y-Math.sin(a)*(32+i*19),30+i*9,10+i*3,a,.22-i*.055);
  }
  if(['collishaw','brumowski'].includes(p.pilot)){
   const wings=[...(world.allies||[]).filter(w=>w.life>0&&(w.ownerId===undefined||w.ownerId===owner)),...(p.formationWings||[]).filter(w=>w.alpha>0)];
   for(const w of wings){
    const x=w.x-p.x,y=w.y-p.y,a=w.a||0;
    texture(c,'engineSmoke',x-Math.cos(a)*26,y-Math.sin(a)*26,40,13,a,.19);
    if(w.muzzleFlash>0){const aim=w.fireHeading??a;texture(c,'muzzleTwin',x+Math.cos(aim)*30,y+Math.sin(aim)*30,28,15,aim,.85)}
   }
  }
  if(p.pilot==='gontermann')for(const e of world.enemies||[]){
   const burn=e.gontermannBurn;if(e.hp<=0||!burn||!(e.burnTime>0)||(e.burnOwnerId??'p1')!==owner||Math.hypot(e.x-p.x,e.y-p.y)>950)continue;
   const turn=(e.a||0)-burn.a,dx=burn.x*Math.cos(turn)-burn.y*Math.sin(turn),dy=burn.x*Math.sin(turn)+burn.y*Math.cos(turn),age=burn.age;
   const large=e.type==='bomber'||e.type==='zeppelin'||e.heavyBomber||e.bossPilot||e.type==='boss'||e.fieldUnit==='balloon';
   const radius=Math.min(large?45:16,Math.max(10,(e.hitRadius||30)*.55)),spread=clamp((age-.22)/.8);
   if(age<.4)texture(c,'spark',e.x-p.x+dx,e.y-p.y+dy,17,12,e.a||0,.75*(1-age/.4));
   for(let i=0;i<(large?4:2);i++){
    if(i>0&&spread<i/(large?4:2))continue;
    const a=(e.a||0)+i*2.4,x=e.x-p.x+dx*(1-spread)+Math.cos(a)*radius*spread,y=e.y-p.y+dy*(1-spread)+Math.sin(a)*radius*.6*spread;
    const size=12+spread*10+Math.sin(age*15+i)*2;
    texture(c,'fireSmall',x,y,size,size*1.15,a,.52);
    texture(c,'smokeDark',x-Math.cos(e.a||0)*13,y-Math.sin(e.a||0)*13,size*1.5,size,a,.18);
   }
  }
 }
 function start(c,p,e,foreground=false){
  const q=clamp(e.age/e.maxLife),fade=Math.min(1,e.age/.09)*Math.min(1,e.life/.28),time=e.age;c.globalAlpha*=fade;
  switch(e.kind){
   case 'cavalryCharge':if(p.chargeTime>0)texture(c,'vaporTrail',-52,0,92,20,Math.PI,.2*(1-q));break;
   case 'cavalryGuard':drawCavalryGuard(c,fade);texture(c,'smokeDark',42,0,29,41,Math.PI,.12*fade);break;
   case 'blackHeart':if(time<.35)texture(c,'smokeDark',-34,0,55+q*25,38,Math.PI,.18);break;
   case 'ringPass':{
    // The visible ring is emitted by actual piercing volleys, not by pressing the skill alone.
    if(!foreground&&p.muzzleFlash>0)texture(c,'gunSmoke',32,0,24,17,0,.25);
    break;
   }
   case 'ringVolley':volleyRing(c,p,e,foreground);break;
   case 'phoenixDeflect':metal(c,time,3,.75);texture(c,'smokeDark',0,0,34+time*25,26,Math.PI,.3);break;
   case 'climbingAttack':for(const side of [-1,1]){c.save();c.translate(-28,side*22);c.scale(1,side);smokeArc(c,48,Math.PI*.68,Math.PI*(.68+.64*q),time,.22,.65,8);c.restore()}if(q>.3&&q<.8)flash(c,false,1.2);break;
   case 'counterRoll':{
    if(foreground){
     const alpha=clamp((.72-time)/.18);if(!alpha)break;
     const text='Du doch nicht!!';c.translate(-14,36);c.font='italic 600 11px Georgia,"Times New Roman",serif';c.textAlign='center';c.textBaseline='alphabetic';
     const widths=[...text].map(ch=>c.measureText(ch).width);let x=-widths.reduce((sum,w)=>sum+w,0)/2;
     [...text].forEach((ch,i)=>{const w=widths[i],phase=time*5.1+i*.83+2.3;c.save();c.translate(x+w/2,Math.sin(phase)*1.9+Math.sin(phase*1.73+1.2)*.9);c.rotate(Math.sin(phase*.9+i)*.14);c.globalAlpha*=alpha*(.7+.3*Math.sin(phase*.6+i*1.9));c.strokeStyle='#2c241c';c.lineWidth=2.2;c.strokeText(ch,0,0);c.fillStyle='#e8d7b4';c.fillText(ch,0,0);c.restore();x+=w});
    }else{c.save();c.rotate((e.direction||p.evadeDirection||1)*q*Math.PI);smokeArc(c,38,-1.2,1.2,time,.26,.7,7);c.restore()}
    break;
   }
   case 'halfLoop':for(const side of [-1,1])texture(c,'vaporTrail',-34,side*14,58,12,Math.PI,.2*(p.immelmannAltitude||0));break;
   case 'sixDirections':crest(c,'vossCowling',q,.32,92);for(let i=0;i<6;i++){c.save();c.rotate(i*TAU/6);texture(c,'engineSmoke',35+q*85,0,31,18,0,.24);c.restore()}break;
   case 'redHunt':case 'huntConfirmation':texture(c,'sunshaft',-85,0,210,85,Math.PI,.15);break;
   case 'sightConverge':if(time<.13)muzzleAt(c,30,0,0,'muzzleHeavy',1.15);break;
   case 'steadySight':for(const side of [-1,1])texture(c,'tracerCream',52+q*58,side*(1-q)*26,55,5,0,.45);break;
   case 'whiteCommand':{c.rotate(e.a-p.a);const d=24+time*180;if(time<.38){texture(c,'tracerCream',-12,-d,22,7,-Math.PI/2,.95);texture(c,'armorSpark',-12,-d,26,18,0,.9);texture(c,'gunSmoke',-12,-d+19,25+time*30,14,-Math.PI/2,.35*(1-q))}break;}
   case 'coverOrder':break;
   case 'pincerOrder':case 'blackFlight':case 'skullGuard':{
    if(e.kind==='skullGuard')crest(c,'skull',q,.3,90);
    const wings=signatureWingPositions(p);
    wings.forEach((w,i)=>{const launch=e.kind==='blackFlight'?i%2*.16:0;if(time<launch||time>launch+.5)return;c.save();c.translate(w.x,w.y);c.rotate(w.a);texture(c,e.kind==='blackFlight'?'smokeDark':'engineSmoke',-23,0,54,24,Math.PI,.32);c.restore()});
    if(!wings.length)texture(c,'gunSmoke',-29,0,36,20,Math.PI,.35);break;
   }
   case 'wingedSword':crest(c,'wingedSword',q,.4,106);metal(c,q,4,.55);break;
   case 'blackDevil':texture(c,'smokeDark',-29-time*45,Math.sin(time*9)*9,48+time*24,30,Math.PI,.3);break;
   case 'storkCannon':crest(c,'cigogne',q,.26,90);texture(c,'gunSmoke',32,0,60,32,0,.4);break;
   case 'fuseIgnition':texture(c,'fireSmall',30,0,26,23,0,.85);texture(c,'fireSmall',-8,15,17,15,.7,.5);texture(c,'fireSmall',-8,-15,17,15,-.7,.5);break;
   case 'incendiaryRun':texture(c,'gunSmoke',31,0,42,23,0,.3);break;
   case 'gunnerHandoff':flash(c,false,.7);flash(c,true,1.1);break;
   case 'rocketSalvo':for(const side of [-1,1])texture(c,'gunSmoke',12,side*23,32,15,0,.18);break;
   case 'attackRun':break;
   case 'closeAttack':break;
   case 'cloudAmbush':texture(c,'mist',-8,-20,110,28,0,.22);texture(c,'vaporTrail',-28,20,85,16,Math.PI,.18);break;
   case 'lastStand':texture(c,'smokeDark',-30-q*45,0,65+q*38,39,Math.PI,.35);break;
   case 'battleDamage':{
    const n=Math.min(5,e.count||1);metal(c,time,2+n,.72);
    for(let i=0;i<n;i++)texture(c,'debris',-13-time*(34+i*11),Math.sin(i*2.1)*9+time*(i%2?14:-14),14+i*2,10+i,time*(i%2?2:-2),.55*(1-q));
    texture(c,'smokeDark',-25-time*58,0,42+n*7+time*25,25+n*4,Math.PI,.24+n*.04);break;
   }
   case 'wingSlipstream':c.rotate(e.a-p.a);texture(c,'vaporTrail',-24-time*18,0,48+time*25,12,Math.PI,.19*(1-q));break;
   case 'petalDive':case 'petalScatter':petals(c,time,e.count||8);break;
   case 'fieldRepair':texture(c,'armorSpark',-18,0,29,18,0,.7*(1-q));for(let i=0;i<3;i++)texture(c,'metalShard'+i,-22-time*17,(-1+i)*7,7,5,time*(i-1),.65*(1-q));break;
   case 'survivalBreak':metal(c,q,6,.7);texture(c,'smokeDark',-35-q*80,0,80,48,Math.PI,.35);break;
   case 'ambushBreak':texture(c,'mist',-50,0,116,68,0,.28);flash(c,false,1.6);break;
   case 'shotAccent':if(p.pilot==='huffzky')break;if(e.active){if(p.pilot==='jacobs'){for(const side of [-1,1])texture(c,'muzzleTwin',31,side*4,48,26,Math.abs(safeTurn(p))>.35?side*.24:0,.92);texture(c,'gunSmoke',34,0,42,25,0,.34)}else flash(c,e.gun===1,e.style==='cannon'?1.8:1,e.style==='cannon')}break;
   case 'defiantHit':case 'wound':case 'escape':metal(c,q,4,.7);crest(c,e.symbol,q,.27,92);break;
   case 'fuseHit':texture(c,'fireEngine',0,0,38,30,0,.6);break;
   case 'incendiaryImpact':{
    if(time<.22)texture(c,'armorSpark',0,0,20+time*35,16,0,.8*(1-time/.22));
    const spread=clamp((time-.12)/.8);texture(c,'fireEngine',0,0,21+spread*30,17+spread*23,0,.66*(1-q*.7));
    if(spread>0)for(const side of [-1,1])texture(c,'fireWing',side*spread*17,side*6,17+spread*16,15+spread*10,side*.35,.42*spread*(1-q));
    texture(c,'smokeDark',-9-time*13,0,23+spread*29,17+spread*17,Math.PI,.2*spread);break;
   }
   case 'burnKill':texture(c,'explosionHot'+Math.min(3,Math.floor(q*4)),0,0,76,62,0,.8*(1-q*.4));texture(c,'fireFlash',0,0,48,36,0,.5*(1-q));break;
   case 'cannonShot':flash(c,false,1.8,true);texture(c,'gunSmoke',39,0,75,45,0,.48);break;
   case 'climbSalvo':if(p.aceSkillPhase==='vertical-fire'||!p.aceSkillPhase){flash(c,false,1.6);texture(c,'gunSmoke',-38,0,74,31,Math.PI,.22)}break;
   case 'reverseShot':flash(c,false,1.1);smokeArc(c,36,1.6,3.9,time,.24,.65,7);break;
   case 'rearShot':if(p.pilot==='huffzky')break;
   case 'handoff':flash(c,true,1.3);texture(c,'tracerCream',-58,0,40,5,Math.PI,.55);break;
   case 'aimedShot':texture(c,'tracerCream',36,0,70,4,0,.7);texture(c,'armorSpark',0,0,22,15,0,.65);break;
   case 'headOn':texture(c,'armorSpark',0,0,30,20,0,.6);texture(c,'metalShard1',-10,12,7,5,.4,.6);break;
   case 'hunt':texture(c,'ricochet',0,0,45,24,0,.65);break;
   case 'turnShot':texture(c,'gunSmoke',-15,0,45,24,.8,.3);texture(c,'spark',0,0,30,22,0,.65);break;
   case 'rearAttack':case 'crossfire':case 'rescueShot':case 'intercept':texture(c,'ricochet',0,0,40,22,0,.65);texture(c,'gunSmoke',-18,0,30,18,0,.22);break;
   case 'targetSwitch':smokeArc(c,24,-.9,.9,time,.26,.75,6);texture(c,'spark',0,0,30,20,0,.6);break;
   case 'ambushShot':texture(c,'mist',-18,0,65,34,0,.25);texture(c,'armorSpark',0,0,44,26,0,.72);break;
   case 'petalKill':petals(c,time,7);break;
   case 'repair':texture(c,'armorSpark',-14,0,24,17,0,.7);for(let i=0;i<3;i++)texture(c,'metalShard'+i,-17-time*12,i*5-5,7,5,time*(i-1),.5*(1-q));break;
   case 'precisionHit':case 'closeHit':case 'commandHit':texture(c,'armorSpark',0,0,e.kind==='precisionHit'?24:42,24,0,.7);break;
  }
 }
 const safeTurn=p=>p.pilotSignatureState?.turnRate||0;
 function continuous(c,p,profile,s){
  const t=s.clock,age=s.activeAge,shot=p.muzzleFlash>0,active=p.skillTime>0;
  if(p.pilot==='udet'&&p.fxOverheat>0){
   const heat=clamp(p.fxOverheat),pulse=.7+.3*Math.sin(t*26)**2;
   texture(c,'spark',16,0,15+heat*6,10+heat*4,0,heat*.6*pulse);
   texture(c,'engineSmoke',-9,0,31,13,Math.PI,heat*.16);
  }
  if(p.pilot==='voss'&&!active){
   const world=p.combatWorld?.()||p,count=(world.enemies||[]).filter(e=>e.hp>0&&Math.hypot(e.x-p.x,e.y-p.y)<400).length,strength=Math.min(6,count)/6;
   if(strength){
    const turn=clamp(s.turnRate/3,-1,1);
    for(const side of [-1,1]){
     for(let i=0;i<3;i++){const phase=(t*2.8+i/3)%1;texture(c,'vaporTrail',-17-phase*34,side*27-turn*phase*11,30+phase*22,5+phase*4,Math.PI+turn*phase*.28,(.15+strength*.17)*(1-phase));}
     texture(c,'windStreak',-13,side*25,43,7,-turn*.18,.13+strength*.19);
     if(Math.abs(turn)>.12)for(let i=0;i<3;i++){const q=i/2;texture(c,'smokeWisp',-21-q*19,side*27-turn*q*q*20,21+q*12,8+q*5,Math.PI+turn*q*.38,(.13+strength*.12)*Math.abs(turn)*(1-q*.5));}
    }
   }
  }
  if(p.pilot==='hawker'&&!active&&p.straightCharge>0&&shot&&!(p.reloadTime>0)){
   const strength=clamp(p.straightCharge),guns=p.weapon?.guns||1;
   for(let gun=0;gun<guns;gun++){
    const a=(p.gunDirection?.(gun)??p.a)-p.a,offset=p.weapon?.bidirectional?0:(gun-(guns-1)/2)*8,x=Math.cos(a)*25-Math.sin(a)*offset,y=Math.sin(a)*25+Math.cos(a)*offset;
    texture(c,Math.cos(a)<0?'muzzleRear':guns>1?'muzzleTwin':'muzzle',x+Math.cos(a)*7,y+Math.sin(a)*7,25+strength*10,15+strength*5,a,.7+strength*.16);
    texture(c,'gunSmoke',x+Math.cos(a)*12,y+Math.sin(a)*12,28+strength*13,14+strength*6,a,.18+strength*.13);
   }
  }
  if(p.pilot==='nungesser'){
   const low=p.maxHp>0?clamp((1-p.hp/p.maxHp)/.8):0;
   // Low-health aggression is fog around the airframe; the coffin belongs only to the active.
   if(low>0){
    for(let i=0;i<5;i++){
     const a=i*TAU/5+t*.24,drift=Math.sin(t*2+i)*3;
     texture(c,'smokeDark',Math.cos(a)*19-7,Math.sin(a)*21+drift,48+low*16,34+low*12,a,.06*low+.18*low*(.6+.4*Math.sin(t*1.4+i)**2));
    }
   }
   if(active)crest(c,'blackHeart',t,.30,102);
   return;
  }
  if(p.pilot==='barker'){
   const n=Math.min(5,p.barkerStacks||0),strength=n/5;
   if(n||active){for(let i=0;i<2+n;i++){const q=(t*(.9+n*.12)+i*.37)%1;texture(c,'smokeDark',-24-q*(48+n*7),Math.sin(t*4+i*1.7)*(4+n),24+q*(25+n*6),17+q*(15+n*3),Math.PI,(.18+strength*.24)*(1-q))}if(n){const q=(t*1.9)%1;texture(c,'debris',-25-q*66,Math.sin(t*3)*13,12+n*2,9+n,t,.38*(1-q));texture(c,'metalShard2',-18-q*47,-7-q*12,7,5,t,.5*(1-q))}}
   return;
  }
  if(p.pilot==='jacobs'&&(active||p.jacobsStacks>0)){
   const n=active?7:2+Math.min(3,p.jacobsStacks||0),turn=clamp(s.turnRate/3,-1,1);
   for(let i=0;i<n;i++){const q=(t*(active?1.6:.9)+i/n)%1,a=q*TAU*1.25-t*2;texture(c,'smokeDark',-25-q*79,Math.sin(a)*(5+q*15)+turn*q*22,22+q*30,16+q*18,Math.PI+a*.12,(active?.28:.12)*(1-q))}
   if(active&&shot)flash(c,false,1.6);return;
  }
  if(p.pilot==='immelmann'&&p.eagleTime>0&&shot&&!p.immelmannTurn){texture(c,'muzzleTwin',31,0,32,19,0,.82);texture(c,'gunSmoke',35,0,28,16,0,.18)}
  if(p.pilot==='mccudden'&&p.mccuddenRepairFlash>0){const fade=clamp(p.mccuddenRepairFlash/.4);texture(c,'armorSpark',-14,0,28,18,0,.7*fade);for(let i=0;i<3;i++)texture(c,'metalShard'+i,-18-(1-fade)*12,i*6-6,7,5,t+i,.55*fade)}
  if(p.pilot==='huffzky'){
   if(p.crossfireFlash>0){for(let i=0;i<4;i++){const rear=i>=2;muzzleAt(c,rear?-25:25,0,i*Math.PI/2,rear?'muzzleRear':'muzzleTwin',1.1);}}
   return;
  }
  if(p.pilot==='goering'&&active){
   for(const w of signatureWingPositions(p)){c.save();c.translate(w.x,w.y);c.rotate(w.a);texture(c,'engineSmoke',-40,0,65,20,Math.PI,.26);if(w.muzzleFlash>0){const aim=w.muzzleAngle-w.a;muzzleAt(c,Math.cos(aim)*23,Math.sin(aim)*23,aim,'muzzleTwin',.95);}c.restore();}
   return;
  }
  if(p.pilot==='mannock'&&active)return;
  if(!active)return;
  switch(profile.sustain){
   case 'charge':if(p.chargeTime>0&&!globalThis.__hoLance?.has(p))cavalrySlipstream(c,t,Math.min(1,p.chargeTime/.12));break;
   case 'defyDeath':if(p.hitFlash>0)texture(c,'armorSpark',18,0,52,42,p.a,.65);break;
   case 'precision':if(shot)muzzleAt(c,30,0,0,'muzzleHeavy',1.05);break;
   case 'cannon':if(p.cannonRecoil129>0)flash(c,false,1.8,true);break;
   case 'gunPlatform':if(shot){flash(c,false,1.5);texture(c,'smokePuff',41,0,38,24,0,.25)}break;
   case 'climb':if(age>.4&&age<2.5){texture(c,'vaporTrail',-48,0,95,28,Math.PI,.18);if(shot)flash(c,false,1.25)}break;
   case 'roll':if(p.evadeTime>0){c.save();c.rotate((p.evadeDirection||1)*age*4);texture(c,'vaporTrail',-37,18,70,16,Math.PI,.24);c.restore()}break;
   case 'reversal':if(p.immelmannTurn)for(const side of [-1,1])texture(c,'vaporTrail',-39,side*12,67,12,Math.PI,.22*(p.immelmannAltitude||0));break;
   case 'tightTurn':if(Math.abs(s.turnRate)>.35)smokeArc(c,35,1.5,4.8,t,.20,.75,9);break;
   case 'defiance':if(p.hitFlash>0)metal(c,0,5,.7);break;
   case 'bombRun':if(shot)flash(c,true,1.25);break;
   case 'twoSeater':if(shot){flash(c,false,.65);flash(c,true,1.3)}break;
   case 'closeFire':if(shot)flash(c,false,1.8);break;
   case 'flameAttack':if(shot){flash(c,false,1.1);texture(c,'gunSmoke',37,0,29,17,0,.2)}break;
   case 'fuse':if(shot)texture(c,'fireSmall',34,0,21,17,0,.5);break;
   case 'concealment':if(p.ballCloak>0){texture(c,'mist',-14,-22,95,25,.05*Math.sin(t),.19);texture(c,'vaporTrail',-35,21,90,14,Math.PI,.17)}break;
   case 'survival':if(p.hp<Math.max(10,p.maxHp*.2))texture(c,'smokeDark',-39,0,62,28,Math.PI,.4);break;
   case 'petals':petals(c,(t*.6)%1.3,5);break;
   case 'maintenance':texture(c,'gunSmoke',-30,0,45,27,Math.PI,.22*(1-clamp(age/4)));break;
   case 'pincer':for(const w of signatureWingPositions(p)){if(!w.muzzleFlash)continue;c.save();c.translate(w.x,w.y);c.rotate(w.muzzleAngle);flash(c,false,1.1);c.restore()}break;
   case 'ringFlight':if(!globalThis.__hoHoop?.has(p))drawRickenbackerHalfRing(c,t,Math.min(1,p.skillTime/.15),false);break;
   case 'rocketFlight':case 'pursuit':case 'decoy':case 'convergence':case 'guard':case 'splitFlight':case 'cover':break;
  }
 }
 return function drawPilotSignature(c,p,x,y,layer='under'){
  const s=p.pilotSignatureState,profile=PILOT_SIGNATURES[p.pilot];if(!s||!profile||!(p.hp>0)||![x,y,p.a].every(Number.isFinite))return false;
  c.save();try{
   c.translate(x,y);if(layer!=='front')worldEffects(c,p);c.rotate(p.a);if(layer!=='front')continuous(c,p,profile,s);
   if(layer==='front'){
    if(p.pilot==='rickenbacker'&&p.skillTime>0&&!globalThis.__hoHoop?.has(p))drawRickenbackerHalfRing(c,s.clock,Math.min(1,p.skillTime/.15),true);
    if(p.pilot==='baracca'&&(p.chargeTime>0||p.prancingHorseFlash160>0||s.effects.some(e=>e.kind==='cavalryGuard'))){
     c.save();c.rotate(Math.PI/2);c.globalAlpha*=.82;insignia(c,'baraccaHorse',0,5,16,s.clock);c.restore();
    }
   }
   for(const e of s.effects){if(layer==='front'&&e.kind!=='ringPass'&&e.kind!=='ringVolley'&&e.kind!=='counterRoll')continue;const dx=e.x-p.x,dy=e.y-p.y;c.save();try{if((!e.signatureStart||e.kind==='whiteCommand')&&e.kind!=='shotAccent')c.translate(dx*Math.cos(p.a)+dy*Math.sin(p.a),-dx*Math.sin(p.a)+dy*Math.cos(p.a));start(c,p,e,layer==='front')}finally{c.restore()}}
  }finally{c.restore()}
  return true;
 };
}

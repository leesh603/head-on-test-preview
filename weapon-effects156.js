import {drawGameIcon} from './icons.js?v=340';
import {fx,fxReady,FX56,FX3} from './fx-art.js?v=340';
export function drawGrenade(c,g,x,y){
 c.save();c.translate(x,y-g.height);c.rotate(g.phase==='flight'?g.age*7:0);
 if(!fx(c,'grenade',0,0,52,52))drawGameIcon(c,'mines',0,0,46);
 if(g.phase==='fuse'){c.fillStyle='#f1cd8e';c.beginPath();c.arc(3,-8,1.4,0,Math.PI*2);c.fill()}c.restore();
}
export function drawGrenadeBlast(c,f,x,y){
 const q=1-f.life/f.maxLife;
 if(fxReady('explosion1')){
  const d=FX56?Math.min(108,Math.max(38,f.radius*1.2))*(.72+q*.28):f.radius*2*(.5+q*.8),frame=Math.min(3,Math.floor(q*4));
  const grenadeSet=fxReady('pop0')?'pop':'explosion';
  FX56?fx(c,grenadeSet+frame,x,y,d,d,0,Math.min(1,(1-q)*2.2)):fx(c,grenadeSet+frame,x,y,d,d);return;
 }c.save();c.translate(x,y);c.globalAlpha=(1-q)*.8;
 const r=12+24*q,glow=c.createRadialGradient(0,0,2,0,0,r);glow.addColorStop(0,'#fff3ca');glow.addColorStop(.3,'#d3934f');glow.addColorStop(1,'#51483a00');c.fillStyle=glow;c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();
 // Fine fragments show the unchanged 110-unit damage boundary without a giant fireball.
 c.strokeStyle='#c8b490';c.lineWidth=1;
 for(let i=0;i<13;i++){const a=i*2.399,r=12+q*f.radius*(.65+(i%3)*.12);c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r);c.lineTo(Math.cos(a)*(r+4),Math.sin(a)*(r+4));c.stroke()}
 c.globalAlpha=(1-q)*.22;c.strokeStyle='#c1b7a0';c.beginPath();c.arc(0,0,f.radius*(.6+q*.4),0,Math.PI*2);c.stroke();c.restore();
}

// Shared painted burst for generic combat explosions (combatFX layer).
// kind varies size and lingering smoke so each blast source reads differently.
const FX_BLAST_KINDS={
 blast:{size:1,smoke:1,smokeKey:'smokeGray',set:'airblast'},
 aircraft:{size:1,smoke:1,smokeKey:'smokeGray',set:'airblast'},
 pop:{size:.7,smoke:1,smokeKey:'smokePuff',set:'pop'},
 shell:{size:1.15,smoke:2,smokeKey:'smokeHeavy',set:'shellBurst',ring:true},
 structure:{size:1.5,smoke:3,smokeKey:'smokeHeavy',set:'structure',ring:true,debris:true},
 bossFinal:{size:2.1,smoke:4,smokeKey:'smokeHeavy',set:'bossBlast',ring:true,debris:true},
 mineBlast:{size:1.25,smoke:2,smokeKey:'mist',set:'mineBlast',cool:true},
 mine:{size:1.2,smoke:2,smokeKey:'smokeHeavy',set:'shellBurst'},
 bomb:{size:1.35,smoke:3,smokeKey:'smokeHeavy',set:'bombfx',ring:true,debris:true},
 charge:{size:1.1,smoke:1,smokeKey:'smokeGray',set:'shellBurst'},
 cannon:{size:.8,smoke:1,smokeKey:'smokeGray',set:'pop'},
 hydrogen:{size:1.7,smoke:3,smokeKey:'smokeHeavy',set:'bossBlast',ring:true,debris:true}
};
export function drawFxExplosion(c,f,x,y,radius=0){
 if(f.fxOnly&&!FX3)return true;
 if(f.mortarOverlay&&FX3&&fxReady('mortarImpact0'))return true;
 const q=Math.max(0,Math.min(.999,1-f.life/f.maxLife)),frame=Math.min(3,Math.floor(q*4));
 if(drawRoleExplosion(c,f,x,y,radius,q,frame))return true;
 const legacy={aircraftHeavy:'structure',aircraftMedium:'blast'};
 const kind=FX_BLAST_KINDS[legacy[f.kind]||f.kind]||FX_BLAST_KINDS.blast;
 const d=Math.max(30,(radius||f.radius||60)*2.2*(.55+q*.6))*kind.size;
 if(!fx(c,kind.set+frame,x,y,d,d,0,Math.min(1,(1-q)*2.4)))return false;
 if(q>.5&&kind.smoke){const sq=(q-.5)/.5;
  for(let i=0;i<kind.smoke;i++){const a=i*2.1+x*.01,ox=Math.cos(a)*d*.2,oy=-d*.1*(i+1)-sq*d*.12;
   fx(c,kind.smokeKey,x+ox,y+oy,d*.55,d*.42,sq*.6,Math.min(.3,(1-sq)*.4));}}
 // expanding shock ring + tumbling shard silhouettes for heavy tiers
 if(kind.ring&&q>.12&&q<.6){const rq=(q-.12)/.48;fx(c,'shockRing',x,y,d*(1.15+rq*.95),d*(1.15+rq*.95),0,(1-rq)*.45);}
 if(kind.debris&&q>.25&&q<.85){const dq=(q-.25)/.6;for(let i=0;i<3;i++){const a=i*2.1+x*.013+y*.017;
  fx(c,'debrisShard',x+Math.cos(a)*d*.5*dq,y+Math.sin(a)*d*.5*dq+dq*dq*d*.16,d*.32,d*.32,a+q*4,(1-dq)*.8);}}
 return true;
}

// Source tags are visual metadata only; all damage/lifetimes stay in the engine.
function drawRoleExplosion(c,f,x,y,radius,q,frame){
 if(!FX3)return false;
 const source=f.fxSource||f.kind,r=radius||f.radius||60,fade=Math.min(1,(1-q)*2.4);
 const families={cow:'cowImpact',moteur:'moteurImpact',lePrieur:'lePrieurImpact',bomb:'mortarImpact',mortar:'mortarImpact'};
 if(families[source]){
  const size={cow:1.95,moteur:1.7,lePrieur:1.35,bomb:2,mortar:2.15}[source];
  const d=Math.min(source==='bomb'||source==='mortar'?240:150,Math.max(30,r*size))*(.86+q*.28);
  return fx(c,families[source]+frame,x,y,d,d,0,fade);
 }
 if(source==='navalMG'||source==='navalMedium'){
  if(!fxReady('navalSplash3'))return false;const medium=source==='navalMedium',d=(medium?64:27)*(.72+q*.45);
  fx(c,'navalSplash3',x,y,d,d,0,(1-q)*(medium?.72:.62));if(medium&&q>.3)fx(c,'navalFoam3',x,y,d*1.12,d*1.12,0,(1-q)*.24);return true;
 }
 if(source==='mineBlast'||source==='mineSea'||source==='navalShell'){
  if(!fxReady('navalSplash3')||!fxReady('navalFoam3'))return false;
  const d=Math.min(250,Math.max(54,r*2.2));
  const shell=source==='navalShell';
  if(q<.65)fx(c,'navalSplash3',x,y,d*(.55+q*.7),d*(.55+q*.7),shell?.35:0,fade*(1-q)*(shell?1:.7));
  if(!shell||q>.25)fx(c,'navalFoam3',x,y,d*(.7+q*.65),d*(.7+q*.65),0,fade*(shell?.32:.65));return true;
 }
 if(source==='mine'||source==='mineAir'){
  const d=Math.min(155,Math.max(44,r*1.65))*(.8+q*.3);
  return fx(c,'shellBurst'+frame,x,y,d,d,0,fade);
 }
 if(source==='aircraftHeavy'||source==='aircraftMedium'){
  const heavy=source==='aircraftHeavy',d=Math.min(heavy?220:155,r*(heavy?3:2.5))*(.75+q*.4);
  if(!fx(c,(heavy?'bossBlast':'airblast')+frame,x,y,d,d,0,fade))return false;
  if(heavy&&q>.35)fx(c,'smokeOil',x,y,d*.75,d*.75,0,(1-q)*.25);
  return true;
 }
 return false;
}

// Approved four-stage Amatol artwork. Ordinary grenade and mine effects keep
// their existing renderer; this layer is used only by Amatol-tagged blasts.
const amatolEffect=typeof Image==='undefined'?null:new Image();
if(amatolEffect)amatolEffect.src='./amatol_explosion_effects.webp?v=340';
const AMATOL_FRAMES=[[19,319,306,315],[321,261,427,427],[744,227,475,503],[1209,245,463,489]];
export function drawAmatolBlast(c,f,x,y){
 if(FX3&&fxReady('bossBlast0')){const q=Math.max(0,Math.min(.999,1-f.life/f.maxLife)),d=Math.min(f.secondaryExplosion?120:260,f.radius*2.15)*(.82+q*.18);
  fx(c,(f.secondaryExplosion?'structure':'bossBlast')+Math.floor(q*4),x,y,d,d,0,Math.min(1,(1-q)*3));return;
 }
 if(!amatolEffect?.complete||!amatolEffect.naturalWidth)return;
 const q=Math.max(0,Math.min(.999,1-f.life/f.maxLife)),frame=AMATOL_FRAMES[Math.min(3,Math.floor(q*4))],[sx,sy,sw,sh]=frame;
 const diameter=Math.min(f.secondaryExplosion?120:260,f.radius*2.15)*(0.82+q*.18);
 c.save();c.globalAlpha=Math.min(1,(1-q)*3);c.drawImage(amatolEffect,sx,sy,sw,sh,x-diameter/2,y-diameter/2,diameter,diameter);c.restore();
}

import {drawGameIcon} from './icons.js?v=158';
import {fx,fxReady} from './fx-art.js?v=201';
export function drawGrenade(c,g,x,y){
 c.save();c.translate(x,y-g.height);c.rotate(g.phase==='flight'?g.age*7:0);
 if(!fx(c,'grenade',0,0,26,26))drawGameIcon(c,'mines',0,0,23);
 if(g.phase==='fuse'){c.fillStyle='#f1cd8e';c.beginPath();c.arc(3,-8,1.4,0,Math.PI*2);c.fill()}c.restore();
}
export function drawGrenadeBlast(c,f,x,y){
 const q=1-f.life/f.maxLife;
 if(fxReady('explosion1')){
  const d=f.radius*2*(.5+q*.8),frame=Math.min(3,Math.floor(q*4));
  fx(c,'explosion'+frame,x,y,d,d);return;
 }c.save();c.translate(x,y);c.globalAlpha=(1-q)*.8;
 const r=12+24*q,glow=c.createRadialGradient(0,0,2,0,0,r);glow.addColorStop(0,'#fff3ca');glow.addColorStop(.3,'#d3934f');glow.addColorStop(1,'#51483a00');c.fillStyle=glow;c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();
 // Fine fragments show the unchanged 110-unit damage boundary without a giant fireball.
 c.strokeStyle='#c8b490';c.lineWidth=1;
 for(let i=0;i<13;i++){const a=i*2.399,r=12+q*f.radius*(.65+(i%3)*.12);c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r);c.lineTo(Math.cos(a)*(r+4),Math.sin(a)*(r+4));c.stroke()}
 c.globalAlpha=(1-q)*.22;c.strokeStyle='#c1b7a0';c.beginPath();c.arc(0,0,f.radius*(.6+q*.4),0,Math.PI*2);c.stroke();c.restore();
}

// Shared painted burst for generic combat explosions (combatFX layer).
export function drawFxExplosion(c,f,x,y,radius=0){
 const q=Math.max(0,Math.min(.999,1-f.life/f.maxLife)),frame=Math.min(3,Math.floor(q*4));
 const d=Math.max(30,(radius||f.radius||60)*2.2*(.55+q*.6));
 if(!fx(c,'explosion'+frame,x,y,d,d,0,Math.min(1,(1-q)*2.4)))return false;
 return true;
}

// Approved four-stage Amatol artwork. Ordinary grenade and mine effects keep
// their existing renderer; this layer is used only by Amatol-tagged blasts.
const amatolEffect=typeof Image==='undefined'?null:new Image();
if(amatolEffect)amatolEffect.src='./amatol_explosion_effects.png?v=164';
const AMATOL_FRAMES=[[19,319,306,315],[321,261,427,427],[744,227,475,503],[1209,245,463,489]];
export function drawAmatolBlast(c,f,x,y){
 if(!amatolEffect?.complete||!amatolEffect.naturalWidth)return;
 const q=Math.max(0,Math.min(.999,1-f.life/f.maxLife)),frame=AMATOL_FRAMES[Math.min(3,Math.floor(q*4))],[sx,sy,sw,sh]=frame;
 const diameter=Math.min(f.secondaryExplosion?120:260,f.radius*2.15)*(0.82+q*.18);
 c.save();c.globalAlpha=Math.min(1,(1-q)*3);c.drawImage(amatolEffect,sx,sy,sw,sh,x-diameter/2,y-diameter/2,diameter,diameter);c.restore();
}

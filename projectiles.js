// Muted tracer families: no black borders, outlined gems, or neon rings.
// Rendering never changes projectile movement, damage or collision.
import {fx,fxReady,fxTint,FX56} from './fx-art.js';
export function projectileStyle(b){return b.hostileRocket?'rocket':b.flak?'flak':b.visualType||(b.naval?'naval':b.fieldShell?'balloon':b.heavy?'heavyBomber':'scout')}
const TRACERS={scout:['#e7a06b',10,2],hunter:['#efb77f',14,2],bomber:['#dfbc7b',11,3],heavyBomber:['#e4ae72',15,3],boss:['#e58f7c',16,3],zeppelin:['#d8bb8b',12,3],railgun:['#efaa89',23,3],naval:['#dfaa82',16,3],balloon:['#dbbf8b',8,3],flak:['#dfac80',6,3],rocket:['#edac77',15,3]};
// gunUpgradeBonus is the cumulative machine-gun attack bonus, not temporary
// skill damage. Interpolation avoids sudden color jumps at upgrade thresholds.
const GUN_COLORS=[[0,[248,223,135]],[.3,[245,204,145]],[.6,[238,177,132]],[1,[222,147,119]],[1.6,[199,117,123]],[2.5,[173,111,131]]];
export function friendlyTracerColor(b,gunUpgradeBonus=0){
 if(b.mauserRound)return '#a98cff';
 if(b.specialColor)return b.specialColor;
 if(b.ally||b.formation)return '#d4c8a3';
 if(b.pierce)return '#f8f5cd';
 const value=Math.max(0,Math.min(2.5,Number(gunUpgradeBonus)||0));
 let i=1;while(i<GUN_COLORS.length-1&&value>GUN_COLORS[i][0])i++;
 const [lo,a]=GUN_COLORS[i-1],[hi,z]=GUN_COLORS[i],t=(value-lo)/(hi-lo);
 return '#'+a.map((v,j)=>Math.round(v+(z[j]-v)*t).toString(16).padStart(2,'0')).join('');
}
const cannonAtlas=typeof Image==='undefined'?null:new Image();
if(cannonAtlas)cannonAtlas.src='./cannon-projectiles135.webp?v=210';
export function drawEnemyProjectile(c,b,x,y,t=0,screenScale=1){
 if(!b.enemy||b.life<=0)return;const kind=projectileStyle(b),[color,length,width]=TRACERS[kind]||TRACERS.scout;
 c.save();c.translate(Math.round(x),Math.round(y));c.rotate(Math.atan2(b.vy,b.vx));
 if(kind==='boss'){
  const k=Math.max(1,1/Math.max(.35,screenScale));
  if(fxReady('tracerOrange')){c.scale(k,k);fx(c,'tracerOrange',-6,0,30,9,0,1);c.restore();return}
  c.scale(k,k);
  c.globalAlpha=.35;c.fillStyle='#ff947d';c.fillRect(-22,-2,8,4);
  c.globalAlpha=1;c.fillStyle='#ff947d';c.fillRect(-14,-2,16,4);
  c.fillStyle='#fff4d2';c.fillRect(-3,-1,5,2);c.restore();return;
 }
 if(kind==='railgun'&&fxReady('shell')){FX56?fx(c,'shell',-8,0,9,27,Math.PI/2):fx(c,'shell',-8,0,30,9);c.restore();return}
 if(kind==='rocket'&&fxReady('rocket')){FX56?fx(c,'rocket',-4,0,10,32,Math.PI/2):fx(c,'rocket',-4,0,34,10);c.restore();return}
 if(fxReady('tracerAmber')){
  const vKey=kind==='balloon'||kind==='flak'?'tracerCream':(kind==='heavyBomber'||kind==='naval'||kind==='zeppelin')?'tracerOrange':'tracerAmber';
  fxTint(c,vKey,color,-4,0,length*2.1,width*5);c.restore();return;
 }
 const head=kind==='rocket'?-15:2;
 // Two short, fading rectangular tail segments echo the aircraft pixel grid.
 c.globalAlpha=.2;c.fillStyle=color;c.fillRect(head-length-7,-width/2,7,width);
 c.globalAlpha=.5;c.fillRect(head-length,-width/2,length*.55,width);
 c.globalAlpha=1;c.fillRect(head-length*.45,-width/2,length*.45,width);
 c.fillStyle='#fff0cc';c.fillRect(head-3,-.5,3,1);
 if(kind==='heavyBomber'||kind==='naval'){c.globalAlpha=.65;c.fillStyle=color;c.fillRect(head-5,-2,3,4)}
 c.restore();
}

export function drawCannonProjectile(c,b,x,y){
 if(b.life<=0)return;const cow=!!b.cow37;
 c.save();c.translate(Math.round(x),Math.round(y));c.rotate(Math.atan2(b.vy,b.vx));
 // Reuse the production rocket's painted metal and plume pixels. The short
 // grey plume is part of the sprite, keeping it readable on mobile canvases.
 if(cannonAtlas&&cannonAtlas.complete&&cannonAtlas.naturalWidth){
  const sw=cannonAtlas.naturalWidth/2,sh=cannonAtlas.naturalHeight,dw=cow?24:20,dh=cow?56:49;
  c.imageSmoothingEnabled=false;c.rotate(Math.PI/2);
  c.drawImage(cannonAtlas,cow?0:sw,0,sw,sh,-dw/2,-dh*.42,dw,dh);
 }else{
  const len=cow?16:13,w=cow?6:5;
  c.globalAlpha=.28;c.fillStyle='#cbc8b8';c.fillRect(-len-15,-1,13,2);
  c.globalAlpha=1;c.fillStyle=cow?'#c5ad74':'#b8bdb5';c.fillRect(-len,-w/2,len,w);
  c.fillStyle='#f3e4bc';c.fillRect(-3,-1,4,2);
 }
 c.restore();
}
// Deterministic, bounded pixel embers; no per-frame sprite allocation or gradients.
export function drawBattlefieldFire(c,g,point=(x,y)=>[x,y]){
 for(const e of g.enemies||[])if(e.sunBlindUntil>g.t){const[x,y]=point(e.x,e.y);c.save();c.translate(x,y);c.rotate(e.a);
  if(fxReady('sunshaft')){fx(c,'sunshaft',250,0,520,260,0,.5)}else{c.globalAlpha=.12;c.fillStyle='#e5ca7c';c.beginPath();c.moveTo(0,0);c.arc(0,0,470,-.7,.7);c.closePath();c.fill();c.globalAlpha=.35;c.fillStyle='#f1dca4';for(let i=-2;i<=2;i++){c.save();c.rotate(i*.22);c.fillRect(20,-1,160+Math.abs(i)*25,2);c.restore();}}c.restore();}
 for(const f of g.cannonImpacts||[]){const[x,y]=point(f.x,f.y);c.save();c.globalAlpha=f.life/.38;c.strokeStyle='#d6bf88';c.lineWidth=2;c.beginPath();c.arc(x,y,8+(1-f.life/.38)*20,0,Math.PI*2);c.stroke();c.restore();if(fxReady('spark'))fx(c,'spark',x,y,26,26,0,f.life/.38);}
 for(const f of g.fireZones||[]){const[x,y]=point(f.x,f.y),fade=Math.min(1,f.life/1.5);c.save();c.globalAlpha=.13*fade;c.fillStyle='#c57138';c.beginPath();c.arc(x,y,f.radius,0,Math.PI*2);c.fill();
  if(fxReady('fire')){
   c.globalAlpha=1;
   const n=Math.max(3,Math.round(f.radius/26));
   for(let i=0;i<n;i++){const a=i*2.399,r=Math.sqrt((i+.5)/n)*f.radius*.7,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r,s=34+((i*37)%22);
    if(FX56){fx(c,'fire',px,py,s,s*.6,0,fade*.7);if(i%2)fx(c,'smokeDark',px,py-s*.5,s*.8,s*.6,0,fade*.24)}
    else{fx(c,'fire',px,py,s,s*1.2,i*1.7,fade*.8);if(i%2)fx(c,'smokeDark',px,py-s*.7,s*1.1,s,i*.9,fade*.4)}}
  }else for(let i=0;i<38;i++){const a=i*2.399,r=Math.sqrt((i+.5)/38)*f.radius*.92,phase=(g.t*2+i*.37)%1,px=Math.round(x+Math.cos(a)*r),py=Math.round(y+Math.sin(a)*r),h=8+Math.round((1-phase)*14);c.globalAlpha=fade*(.5+.5*(1-phase));c.fillStyle='#b56534';c.fillRect(px-6,py-8,12,9);c.fillRect(px-4,py-h,8,h);c.fillRect(px+3,py-h+4,3,7);c.fillStyle='#e3a34d';c.fillRect(px-3,py-h+5,6,h-3);c.fillRect(px-5,py-5,9,5);c.fillStyle='#f5d38b';c.fillRect(px-1,py-4,3,4);c.globalAlpha=.25*fade;c.fillStyle='#686a60';c.fillRect(px-3,py-h-8-phase*14,6,6);}
  c.restore();
 }
}

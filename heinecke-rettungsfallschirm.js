// Heinecke Rettungsfallschirm: one independent survival insurance per sortie.
// aircraft.js is loaded lazily: it touches DOM APIs at import time, so a static
// import would crash the module-less test environment.
let aircraftModule;
const aircraftSprites=()=>{
 aircraftModule??=import('./aircraft.js?v=ui5').then(m=>aircraftModule=m);
 return aircraftModule?.then?null:aircraftModule;
};
export const HEINECKE=Object.freeze({escape:3,returnHp:.4,invulnerability:2,cooldown:180,maxUses:2,reentryDistance:270});
export function heineckeRemaining(p){
 if((p.heineckeUses||0)>=HEINECKE.maxUses)return HEINECKE.cooldown;
 return Math.max(0,HEINECKE.cooldown-((p.t||0)-(p.heineckeLastAt??-Infinity)));
}
export function triggerHeinecke(p,damage){
 if(!p.upgrades?.heineckeRettungsfallschirm||!(p.hp>0)||damage<p.hp||p.heineckeEscape>0||heineckeRemaining(p)>0||(p.heineckeUses||0)>=HEINECKE.maxUses)return false;
 p.heineckeUses=(p.heineckeUses||0)+1;
 p.heineckeLastAt=p.t||0;
 p.heineckeAnchor={x:p.x,y:p.y,a:p.a};
 p.heineckeEscape=HEINECKE.escape;
 p.hp=1;
 p.invuln=Math.max(p.invuln||0,HEINECKE.escape);
 p.hitFlash=0;
 p.muzzleFlash=0;
 p.event('heinecke','하이네케 구명낙하산 · 기체 탈출');
 p.burst(p.x,p.y,'#e7c99a',18);
 p.smoke(p.x,p.y,true);
 return true;
}
export function tickHeinecke(p,dt){
 if(!(p.heineckeEscape>0))return false;
 p.heineckeEscape=Math.max(0,p.heineckeEscape-dt);
 if(p.heineckeEscape===0){
  const {x,y,a}=p.heineckeAnchor;
  p.x=x-Math.cos(a)*HEINECKE.reentryDistance;
  p.y=y-Math.sin(a)*HEINECKE.reentryDistance;
  p.a=a;
  p.hp=p.maxHp*HEINECKE.returnHp;
  p.invuln=HEINECKE.invulnerability;
  p.fire=.12;
  p.gasExposure=0;
  p.event('heineckeReturn','예비기 재출격');
  p.burst(p.x,p.y,'#f1dfb7',10);
 }
 return true;
}
// Bail-out scene: the doomed plane spirals off while the pilot drops clear and
// the canopy blossoms open, then drifts back with a gentle pendulum sway.
export function drawHeineckeParachute(c,p,x,y){
 if(!(p.heineckeEscape>0))return;
 const a=p.heineckeAnchor?.a??p.a??0;
 const elapsed=HEINECKE.escape-p.heineckeEscape;
 const fade=Math.min(1,elapsed/.22)*Math.min(1,p.heineckeEscape/.35);
 // Doomed airframe: keeps heading, drops and rolls away, gone by ~2s.
 const planeFade=Math.max(0,1-Math.max(0,elapsed-.6)/1.4);
 if(planeFade>0){
  const fwd=26*elapsed,drop=elapsed*elapsed*46;
  c.save();c.globalAlpha=fade*planeFade;
  const mods=aircraftSprites();
  if(mods)mods.planeSprite(c,x+Math.cos(a)*fwd,y+Math.sin(a)*fwd+drop,a+elapsed*1.05,mods.aircraftKey(p.plane||'fokker',false,p.pilot),.92,false,false,0,elapsed>.35);
  c.restore();
 }
 // Pilot: pops out, falls a touch, then the canopy opens above them.
 const pop=Math.min(1,elapsed/.12),open=Math.min(1,Math.max(0,(elapsed-.34)/.3));
 const bob=Math.sin(elapsed*2.2)*4*open,sway=Math.sin(elapsed*1.7)*6*open;
 const px=x+Math.cos(a)*Math.min(elapsed,.4)*38-Math.cos(a)*elapsed*9+sway;
 const py=y+elapsed*elapsed*16+elapsed*8+bob;
 c.save();c.globalAlpha=fade;
 c.translate(px,py);c.rotate(sway*.028);
 if(open>0){
  const s=.35+.65*open;
  c.lineJoin='round';c.lineWidth=1.6;
  for(const lx of [-13,-4.5,4.5,13]){c.strokeStyle='#4a4237';c.lineWidth=1;c.beginPath();c.moveTo(lx*s,-9*s+2);c.lineTo(lx*.24,3);c.stroke()}
  c.fillStyle='#ece1c4';c.strokeStyle='#2c241c';
  c.beginPath();c.moveTo(-17*s,-9*s);
  c.quadraticCurveTo(0,-26*s,17*s,-9*s);
  c.quadraticCurveTo(9*s,-4*s,0,-6.5*s);
  c.quadraticCurveTo(-9*s,-4*s,-17*s,-9*s);
  c.closePath();c.fill();c.stroke();
  c.fillStyle='#b8452f';c.beginPath();
  c.moveTo(-4.5*s,-19.5*s);c.quadraticCurveTo(0,-21.5*s,4.5*s,-19.5*s);c.lineTo(4.5*s,-15.5*s);c.quadraticCurveTo(0,-17.5*s,-4.5*s,-15.5*s);c.closePath();c.fill();
 }
 if(pop>0){
  c.fillStyle='#5a4d38';c.strokeStyle='#2c241c';c.lineWidth=1.4;
  c.beginPath();c.ellipse(0,6.5,3.4,5,0,0,Math.PI*2);c.fill();c.stroke();
  c.fillStyle='#d8c9a8';c.beginPath();c.arc(0,0,2.7,0,Math.PI*2);c.fill();c.stroke();
 }
 c.restore();
}

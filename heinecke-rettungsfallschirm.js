import {drawHeineckeCloth} from './equipment-finishing-fx.js?v=equipmentfinishing20261030';
import {resetFlightEquipment} from './flight-equipment.js';
// Heinecke Rettungsfallschirm: one independent survival insurance per sortie.
// aircraft.js is loaded lazily: it touches DOM APIs at import time, so a static
// import would crash the module-less test environment.
let aircraftModule;
const aircraftSprites=()=>{
 aircraftModule??=import('./aircraft.js?v=outline2&art=pilot-recovery2&pf=1027&crewbake=1').then(m=>aircraftModule=m);
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
 resetFlightEquipment(p);p.heineckeEscape=HEINECKE.escape;
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
 drawHeineckeCloth(c,open,pop);
 c.restore();
}


import {isBaronAlbatros} from './pilot-aircraft.js?v=capital-final-20261030&art=pilot-recovery2';
// Red Albatros only. Pure views of the existing agility and Sun Strike states.
export const isAlbatrosHunter=p=>p?.pilot==='baron'&&isBaronAlbatros(p.plane);
export const ALBATROS_FX_PALETTE=Object.freeze({red:'#cc8570',wine:'#995248',linen:'#e5d7b6',amber:'#f0d394',shade:'#c4b597'});
const clamp=n=>Math.max(0,Math.min(1,n));
const clock=p=>p.pilotSignatureState?.clock??p.t??0;
const visible=p=>isAlbatrosHunter(p)&&p.hp>0&&p.status!=='downed';
function sunFade(p){const duration=p.skillDuration?.()||4;return p.skillTime>0?clamp((duration-p.skillTime)/.16)*clamp(p.skillTime/.30):0;}
export function drawAlbatrosLocal(c,p,tex,front=false){
 if(!visible(p))return;const t=clock(p),turn=p.pilotSignatureState?.turnRate||0,k=clamp((Math.abs(turn)-.25)/1.6),moving=clamp((p.speed||0)/170),sun=sunFade(p);
 if(front){
  // Fabric-coloured condensation catches the outer wing, without a white core.
  for(const side of [-1,1]){const outside=turn*side<0?1:.3;tex(c,'mist',-1,side*33,35+k*8,11+k*4,-side*.14,.15*moving+.17*k*outside+.20*sun,ALBATROS_FX_PALETTE.linen);}
  return;
 }
 for(const side of [-1,1]){
  const outside=turn*side<0?1:.3,strength=(.36*moving+.38*k*outside),spread=31+k*outside*5;
  if(k>.15)tex(c,'mist',-15,side*spread,36+k*outside*13,11+k*outside*5,-side*.12,.25*k*outside,ALBATROS_FX_PALETTE.red);
  // A broken, tapered fan responds to the live turn rate rather than a fixed
  // pair of white lines. No render-time flight history or particles are stored.
  for(let i=0;i<2;i++){const phase=(t*1.4+i*.5)%1,x=-27-i*20-phase*9,y=side*(spread+i*k*outside*3);
   tex(c,'vaporTrail',x,y,48+i*17+k*outside*17,6+i*2,-side*k*outside*(.10+i*.12),strength*(1-i*.20)*(1-phase*.20),i===0?ALBATROS_FX_PALETTE.linen:ALBATROS_FX_PALETTE.red);
  }
 }
 if(sun>0){
  tex(c,'sunshaft',-46,0,140,44,0,.52*sun,ALBATROS_FX_PALETTE.amber);
  for(const side of [-1,1]){tex(c,'windStreak',5,side*35,82,17,-side*.24,.80*sun,ALBATROS_FX_PALETTE.amber);tex(c,'mist',2,side*32,47,15,-side*.18,.34*sun,ALBATROS_FX_PALETTE.linen);}
 }
}
export function drawAlbatrosWorld(c,p,tex,front=false){
 if(!visible(p))return;
 // The old solo full-screen overlay already honours this presentation guard.
 (globalThis.__hoSun??=new WeakSet()).add(p);
 const sun=sunFade(p);if(!sun)return;
 if(!front){
  // The atlas itself has only 40% peak alpha. A readable source-over fan
  // needs enough opacity before tinting; .075 made it effectively invisible.
  // Painted side rays follow the real +/-36 degree suppression sector.
  for(const side of [-1,1]){const a=p.a+side*Math.PI/5*.76;tex(c,'sunshaft',Math.cos(a)*238,Math.sin(a)*238,480,100,a,.90*sun,ALBATROS_FX_PALETTE.amber);}
  tex(c,'sunshaft',Math.cos(p.a)*230,Math.sin(p.a)*230,470,74,p.a,.55*sun,ALBATROS_FX_PALETTE.amber);
  return;
 }
 let count=0;for(const e of (p.combatWorld?.()||p).enemies||[]){
  if(e.surface||e.fieldUnit||e.stageBossBody||e.crashed||!p.sunStrikeContains?.(e))continue;if(count++===6)break;
  const a=e.a||0,x=e.x-p.x+Math.cos(a)*24,y=e.y-p.y+Math.sin(a)*24;
  // Warm grey haze at a genuinely suppressed aircraft's gun, not a hit flash.
  tex(c,'gunSmoke',x,y,39,18,a,.44*sun,ALBATROS_FX_PALETTE.shade);
  tex(c,'windStreak',x-Math.sin(a)*12,y+Math.cos(a)*12,42,12,a-.22,.68*sun,ALBATROS_FX_PALETTE.amber);
 }
}

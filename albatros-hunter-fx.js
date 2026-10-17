// Red Albatros only. Pure views of the existing agility and Sun Strike states.
export const isAlbatrosHunter=p=>p?.pilot==='baron'&&p.plane==='baron_albatros';
export const ALBATROS_FX_PALETTE=Object.freeze({red:'#a15a49',wine:'#783e37',linen:'#cbbd9b',amber:'#b59761',shade:'#7d8171'});
const clamp=n=>Math.max(0,Math.min(1,n));
const clock=p=>p.pilotSignatureState?.clock??p.t??0;
const visible=p=>isAlbatrosHunter(p)&&p.hp>0&&p.status!=='downed';
function sunFade(p){const duration=p.skillDuration?.()||4;return p.skillTime>0?clamp((duration-p.skillTime)/.16)*clamp(p.skillTime/.30):0;}
export function drawAlbatrosLocal(c,p,tex,front=false){
 if(!visible(p))return;const t=clock(p),turn=p.pilotSignatureState?.turnRate||0,k=clamp((Math.abs(turn)-.25)/1.6),moving=clamp((p.speed||0)/170),sun=sunFade(p);
 if(front){
  // Fabric-coloured condensation catches the outer wing, without a white core.
  for(const side of [-1,1]){const outside=turn*side<0?1:.3;tex(c,'mist',-1,side*35,34+k*12,12+k*6,-side*.22,.16*moving+.18*k*outside+.16*sun,ALBATROS_FX_PALETTE.linen);}
  return;
 }
 for(const side of [-1,1]){
  const outside=turn*side<0?1:.3,strength=(.17*moving+.56*k*outside),spread=35+k*outside*8;
  tex(c,'mist',-6,side*spread,51+k*outside*25,17+k*outside*12,-side*(.13+k*.22),strength,side<0?ALBATROS_FX_PALETTE.red:ALBATROS_FX_PALETTE.wine);
  // A broken, tapered fan responds to the live turn rate rather than a fixed
  // pair of white lines. No render-time flight history or particles are stored.
  for(let i=0;i<3;i++){const phase=(t*1.9+i*.33)%1,x=-22-i*18-phase*14,y=side*(spread+i*k*outside*6);
   tex(c,'vaporTrail',x,y,35+i*9+k*outside*15,5+i*2,-side*k*outside*(.15+i*.10),strength*(1-i*.22)*(1-phase*.35),i===0?ALBATROS_FX_PALETTE.linen:ALBATROS_FX_PALETTE.red);
  }
 }
 if(sun>0){
  tex(c,'sunshaft',-61,0,126,34,0,.14*sun,ALBATROS_FX_PALETTE.amber);
  for(const side of [-1,1]){tex(c,'windStreak',4,side*41,86,15,-side*.29,.54*sun,ALBATROS_FX_PALETTE.amber);tex(c,'mist',5,side*39,65,24,-side*.22,.46*sun,ALBATROS_FX_PALETTE.red);}
 }
}
export function drawAlbatrosWorld(c,p,tex,front=false){
 if(!visible(p))return;
 // The old solo full-screen overlay already honours this presentation guard.
 (globalThis.__hoSun??=new WeakSet()).add(p);
 const sun=sunFade(p);if(!sun)return;
 if(!front){
  // Two low-opacity painted edge glances; no filled cone, radial flash,
  // additive blend, lens-flare ghosts, strobing stars or white sun disc.
  for(const side of [-1,1]){const a=p.a+side*.52;tex(c,'sunshaft',Math.cos(a)*129,Math.sin(a)*129,208,25,a,.075*sun,ALBATROS_FX_PALETTE.amber);}
  return;
 }
 let count=0;for(const e of (p.combatWorld?.()||p).enemies||[]){
  if(e.surface||e.fieldUnit||e.stageBossBody||e.crashed||!p.sunStrikeContains?.(e))continue;if(count++===6)break;
  const a=e.a||0,x=e.x-p.x+Math.cos(a)*24,y=e.y-p.y+Math.sin(a)*24;
  // Warm grey haze at a genuinely suppressed aircraft's gun, not a hit flash.
  tex(c,'gunSmoke',x,y,30,13,a,.30*sun,ALBATROS_FX_PALETTE.shade);
  tex(c,'windStreak',x-Math.sin(a)*12,y+Math.cos(a)*12,31,8,a-.22,.32*sun,ALBATROS_FX_PALETTE.amber);
 }
}

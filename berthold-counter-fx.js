import {bertholdCounterThreshold} from './pilot-nine-combat.js?v=b3bf991d11fc7798';

// Visual-only, front-layer feedback from this pilot's real combat cues.
// Never infer a counter from the active timer: only ironSalvo means shots fired.
const clamp=v=>Math.max(0,Math.min(1,v));
export function drawBertholdCounterLocal(c,p,tex){
 if(p.pilot!=='berthold'||!(p.hp>0)||p.status==='downed'||!Number.isFinite(p.a))return false;
 const s=p.pilotSignatureState;if(!s)return false;
 const active=p.skillTime>0,ca=Math.cos(p.a),sa=Math.sin(p.a);
 // The wake builds with damage accepted during this activation only.
 if(active&&!p.ironSalvoDone&&p.maxHp>0){
  const load=clamp((p.ironActiveDamage||0)/bertholdCounterThreshold(p));
  const ready=load===1,settle=clamp((s.activeAge||0)/.25)*(ready?1:clamp(p.skillTime/.2));
  for(const side of [-1,1]){
   tex(c,'windStreak',-24-load*9,side*22,34+load*26,8+load*9,Math.PI+side*.09,(.22+load*.55)*settle);
   if(ready)tex(c,'mistPuff',-31,side*17,35,13,Math.PI+side*.14,.51*settle);
  }
 }
 for(const e of s.effects||[]){
  if(!(e.life>0)||!Number.isFinite(e.age)||e.age<0||e.ownerId!==(p.id??'p1'))continue;
  if(e.kind!=='ironImpact'&&e.kind!=='ironSalvo')continue;
  c.save();try{
   const dx=e.x-p.x,dy=e.y-p.y;
   if(![dx,dy,e.a].every(Number.isFinite))continue;
   c.translate(dx*ca+dy*sa,-dx*sa+dy*ca);c.rotate(e.a-p.a);
   const t=e.age;
   if(e.kind==='ironImpact'){
    if(t>=.48)continue;
    const fade=clamp((.48-t)/.32);
    if(t<.11)tex(c,'armorSpark',0,0,38,25,0,.96*(1-t/.11));
    // Existing jagged painted wood/metal scrap, not a persistent torn skin.
    for(let i=0;i<3;i++){
     const side=i%2?1:-1;
     tex(c,'metalShard1',-7-t*(32+i*17),side*(9+t*(17+i*12)),7+i,4+i*.5,.4+i+t*(i-1)*5,.8*fade);
    }
    tex(c,'gunSmoke',-8-t*30,0,19+t*27,12+t*12,Math.PI,.18*fade);
   }else{
    if(t>=.38)continue;
    // The five real rounds share a muzzle. Powder separates as the flash dies.
    if(t<.09)tex(c,'muzzleTwin',31,0,40+t*40,19+t*27,0,.98*clamp((.09-t)/.055));
    const fade=clamp((.38-t)/.28)*clamp(t/.045);
    for(const side of [-1,1])tex(c,'gunSmoke',28-t*37,side*(3+t*25),25+t*49,12+t*21,side*.18,.68*fade);
   }
  }finally{c.restore();}
 }
 return true;
}

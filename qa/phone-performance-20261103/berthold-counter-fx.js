// Visual-only, front-layer feedback from this pilot's real combat cues.
// Never infer a counter from the active timer: only ironSalvo means shots fired.
const clamp=v=>Math.max(0,Math.min(1,v));
export function drawBertholdCounterLocal(c,p,tex){
 if(p.pilot!=='berthold'||!(p.hp>0)||p.status==='downed'||!Number.isFinite(p.a))return false;
 const s=p.pilotSignatureState;if(!s)return false;
 const active=p.skillTime>0,ca=Math.cos(p.a),sa=Math.sin(p.a);
 // A restrained, steady wing wake; it stops with the active, not held damage.
 if(active&&!p.ironSalvoDone){
  const settle=clamp((s.activeAge||0)/.25)*clamp(p.skillTime/.2);
  for(const side of [-1,1])tex(c,'windStreak',-20,side*22,32,5,Math.PI,.25*settle);
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
    // Existing jagged painted wood/metal scrap, not a persistent torn skin.
    for(let i=0;i<3;i++){
     const side=i%2?1:-1;
     tex(c,'metalShard1',-7-t*(32+i*17),side*(9+t*(17+i*12)),7+i,4+i*.5,.4+i+t*(i-1)*5,.8*fade);
    }
    tex(c,'gunSmoke',-8-t*30,0,19+t*27,12+t*12,Math.PI,.18*fade);
   }else{
    if(t>=.38)continue;
    // Five rounds are emitted simultaneously by combat; one dense paired flash.
    if(t<.14)tex(c,'muzzleTwin',31,0,43,23,0,.98*clamp((.14-t)/.045));
    const fade=clamp((.38-t)/.30);
    for(const side of [-1,1])tex(c,'gunSmoke',25-t*30,side*(4+t*19),29+t*40,14+t*18,side*.12,.48*fade);
   }
  }finally{c.restore();}
 }
 return true;
}

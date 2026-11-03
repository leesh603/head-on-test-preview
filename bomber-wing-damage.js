// Structural wing wear shares the existing hull HP budget. It is NOT a new
// BossPart, shield or extra kill pool. Collision probing remains read-only.
export const BOMBER_WING_THRESHOLDS=Object.freeze({damaged:.12,severe:.24});
export function bomberWingContact(kind,x,y,radius=0){
 const side=x<0?'left':'right',out=Math.abs(x),r=Math.max(0,radius||0);
 if(kind==='o400-raider')return out>=40&&out<=92+r&&y>=-38-r&&y<=-2+r?side:null;
 if(kind==='gotha-raider')return out>=38&&out<=105+r&&((y>=-54-r&&y<=-21+r)||(y>=-13-r&&y<=8+r))?side:null;
 return null;
}
export function recordBomberWingHit(b,side,damage){
 if(!['left','right'].includes(side)||!(damage>0)||!Number.isFinite(damage))return;
 const wings=b.wingDamage??={left:{damage:0,stage:0,hitFlash:0},right:{damage:0,stage:0,hitFlash:0}},w=wings[side];
 w.damage=Math.min(b.maxHp*BOMBER_WING_THRESHOLDS.severe,w.damage+damage);w.hitFlash=.16;
 w.stage=w.damage>=b.maxHp*BOMBER_WING_THRESHOLDS.severe-1e-8?2:w.damage>=b.maxHp*BOMBER_WING_THRESHOLDS.damaged-1e-8?1:0;
}
export function tickBomberWings(b,dt){for(const w of Object.values(b.wingDamage||{}))w.hitFlash=Math.max(0,(w.hitFlash||0)-dt);}
// Wing wear deliberately does not change flight authority. Candidate speed/turn
// penalties increased close crossings; existing safe motion stays authoritative.

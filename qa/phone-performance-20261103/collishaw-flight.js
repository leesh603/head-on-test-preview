// Black Flight's paint and callsigns are presentation, independent of upgrades.
export const COLLISHAW_WING_ART='collishaw_sopwith';
export const COLLISHAW_WING_NAMES=Object.freeze({
 ko:Object.freeze(['블랙 프린스','블랙 데스','블랙 로저','블랙 쉽']),
 en:Object.freeze(['Black Prince','Black Death','Black Roger','Black Sheep'])
});
export const isCollishawWing=(p,w)=>!!p&&p.pilot==='collishaw'&&!!w&&w.ownerId===(p.id||'p1')&&w.permanent===true&&!w.aceWingman&&!w.temporary&&!w.boelckePincer;
const living=w=>w.life>0&&(w.hp==null||w.hp>0)&&!w.dead&&!w.crashing&&!w.crashed;
export const collishawWingArt=(p,w,fallback)=>isCollishawWing(p,w)?COLLISHAW_WING_ART:fallback;
export function collishawWingName(p,w,locale='ko'){
 return isCollishawWing(p,w)&&living(w)&&!w.carrierHidden&&Number.isInteger(w.slot)?(COLLISHAW_WING_NAMES[locale]||COLLISHAW_WING_NAMES.ko)[w.slot]||'':'';
}
// Keep surviving callsigns stable. The legacy factory uses the alive count as
// its next slot, which can duplicate a survivor when an earlier slot is lost.
export function normalizeCollishawSlots(p){
 if(p.pilot!=='collishaw')return;
 const wings=(p.combatWorld?.().allies||p.allies||[]).filter(w=>isCollishawWing(p,w)&&living(w)),used=new Set(),pending=[];
 for(const w of wings){if(Number.isInteger(w.slot)&&w.slot>=0&&!used.has(w.slot))used.add(w.slot);else pending.push(w);}
 for(const w of pending){let slot=0;while(used.has(slot))slot++;w.slot=slot;used.add(slot);}
}
// Called after aircraft rendering. Text stays upright and 11 screen pixels at
// either solo or cooperative camera zoom; no badges, boxes or combat markers.
export function drawCollishawWingNames(c,p,wings,point=(x,y)=>[x,y],locale='ko',zoom=1,bounds=null,placed=[]){
 if(p?.pilot!=='collishaw')return placed;
 const z=Math.max(.25,zoom),font=11/z,gap=15/z;
 c.save();c.font=`600 ${font}px sans-serif`;c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';c.lineWidth=3/z;c.strokeStyle='#142021';c.fillStyle='#eee5ce';c.globalAlpha=.95;
 for(const w of wings){const name=collishawWingName(p,w,locale);if(!name)continue;
  const q=point(w.x,w.y);let x=q[0],y=q[1]-38/z;const half=Math.min(64/z,c.measureText(name).width/2+3/z);
  if(bounds&&(x<bounds.left-64/z||x>bounds.right+64/z||q[1]<bounds.top-48/z||q[1]>bounds.bottom+48/z))continue;
  if(bounds)x=Math.max(bounds.left+half,Math.min(bounds.right-half,x));
  for(let n=0;n<8&&placed.some(r=>Math.abs(r.x-x)<r.half+half&&Math.abs(r.y-y)<gap);n++)y-=gap;
  if(bounds&&(y<bounds.top+font||y>bounds.bottom-font))continue;
  placed.push({x,y,half});c.strokeText(name,x,y,128/z);c.fillText(name,x,y,128/z);
 }
 c.restore();return placed;
}

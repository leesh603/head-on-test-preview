// Read actual accepted suppression, never choose targets or add damage/movement.
import {navarreSuppressionVisual,NAVARRE_FROMMHERZ_BALANCE as B} from './navarre-frommherz-combat.js';
const living=p=>p?.pilot==='navarre'&&p.state==='playing'&&p.hp>0&&p.status!=='downed';
export function navarreSuppressionEntries(w,e){
 if(!(e?.hp>0)||e.expired||e.crashed)return [];
 const entries=w.online&&!w.host?e.navarreSuppressionFx:navarreSuppressionVisual(w,e),t=w.t||0;
 if(!Array.isArray(entries))return [];
 return entries.slice(0,2).filter(v=>v&&typeof v.ownerId==='string'&&Number.isFinite(v.started)&&v.started>=0&&v.started<=t+.001&&Number.isFinite(v.until)&&v.until>t&&v.until-t<=B.slowSeconds+.01&&[B.slowMultiplier,B.aceSlowMultiplier].includes(v.factor)&&(w.players||[w]).some(p=>living(p)&&(p.id??'p1')===v.ownerId));
}
export function drawNavarreSuppression(c,p,{point=(x,y)=>[x,y],fx,visible=()=>true}={}){
 const w=p.combatWorld?.()||p.world||p;
 if(!living(p)||!fx||(w.players||[w]).find(living)!==p)return;
 const t=w.t||0;let count=0;
 for(const e of w.enemies||[]){
  const entries=navarreSuppressionEntries(w,e);if(!entries.length||![e.x,e.y,e.a].every(Number.isFinite))continue;
  const [x,y]=point(e.x,e.y);if(!visible(x,y,60))continue;if(count++===16)break;
  const timing=entries.reduce((a,b)=>b.factor<a.factor?b:a),factor=timing.factor,left=Math.max(...entries.map(v=>v.until-t)),strength=factor===B.aceSlowMultiplier?.58:1,fade=Math.min(1,left/.2),a=e.a,ca=Math.cos(a),sa=Math.sin(a);
  // Two separated exhaust coughs, not a flame or a continuous damaged-aircraft
  // plume. Existing aircraft position/heading is used on host and guest.
  for(let i=0;i<2;i++){
   const phase=(Math.max(0,t-timing.started)*2.8+i*.19)%1;if(phase>.58)continue;
   const age=phase/.58,back=16+age*42,side=(i?1:-1)*(8+age*5),alpha=Math.sin(age*Math.PI)*.82*strength*fade;
   fx(c,'gunSmoke',x-ca*back-sa*side,y-sa*back+ca*side,29+age*22,15+age*9,a+Math.PI,alpha);
   if(age<.35)fx(c,'smokeWisp',x-ca*(back-3)-sa*side,y-sa*(back-3)+ca*side,22,9,a+Math.PI,alpha*.65);
  }
 }
}

import {drawNavarreSuppression} from './navarre-blockade-fx.js';
import {frommherzLandingEvents,cleanFrommherzLandingEvents,drawFrommherzLandingEvents} from './frommherz-landing-fx.js';
// Native inked tactical marks and existing smoke sprites, not a luminous aura.
import {navarreFrommherzState,NAVARRE_FROMMHERZ_BALANCE} from './navarre-frommherz-combat.js';
import {impactMark,partMark,MARK} from './tactical-marks.js?v=tame3';
const finite=n=>Number.isFinite(n)&&Math.abs(n)<=1e7;
const position=p=>p&&finite(p.x)&&finite(p.y)?{x:p.x,y:p.y}:null;
export function cleanNavarreFrommherzVisual(value){
 if(!value||typeof value!=='object')return null;
 const pos=position(value.zone),until=value.zone?.until;
 const zone=pos&&Number.isFinite(until)&&until>=0&&until<=1e9&&value.zone.radius===NAVARRE_FROMMHERZ_BALANCE.zoneRadius?{...pos,radius:NAVARRE_FROMMHERZ_BALANCE.zoneRadius,until}:null;
 const out={zone,suppressing:value.suppressing===true,focus:position(value.focus)};
 const landing=cleanFrommherzLandingEvents(value.landing);if(landing.length)out.landing=landing;return out;
}
// The combat accessor exposes an enemy reference locally; never copy it into
// snapshots. Only these bounded numeric coordinates cross the network.
export function captureNavarreFrommherzVisual(p){
 const s=navarreFrommherzState(p);return s?cleanNavarreFrommherzVisual({zone:s.zone,suppressing:s.suppressing,focus:position(s.focusedTarget),landing:frommherzLandingEvents(p)}):null;
}
export function navarreFrommherzVisual(p){
 if(!p||!['navarre','frommherz'].includes(p.pilot)||p.hp<=0||p.status==='downed')return null;
 const w=p.world||p;
 return w.online&&!w.host?cleanNavarreFrommherzVisual(p.navarreFrommherzVisual):captureNavarreFrommherzVisual(p);
}
export function drawNavarreFrommherz(c,p,{point=(x,y)=>[x,y],fx=null,tint=null,locale='ko',visible=()=>true}={}){
 drawNavarreSuppression(c,p,{point,fx,visible});
 const s=navarreFrommherzVisual(p);if(!s)return;
 if(p.pilot==='frommherz')drawFrommherzLandingEvents(c,s.landing,{point,fx,tint,visible});
 const t=(p.world||p).t||0,z=s.zone;
 if(p.pilot==='navarre'&&z&&z.until>t&&z.until-t<=10){
  const [x,y]=point(z.x,z.y),r=z.radius;if(!visible(x,y,r+35))return;
  const alpha=Math.min(.58,(z.until-t)*.8);
  impactMark(c,x,y,r,1,{tone:'safe',alpha,cross:false,fill:false});
  // Eight restrained wisps are drawn directly; no particles are accumulated.
  if(fx)for(let i=0;i<8;i++){const a=i*Math.PI/4;fx(c,'smokeWisp',x+Math.cos(a)*r,y+Math.sin(a)*r,25,16,a,.12*alpha);}
  c.save();c.font='600 11px sans-serif';c.textAlign='center';c.fillStyle=MARK.safe;c.strokeStyle=MARK.ink;c.lineWidth=3;
  const label=locale==='en'?'VERDUN BLOCKADE':'베르됭 봉쇄';c.strokeText(label,x,y-r-12);c.fillText(label,x,y-r-12);c.restore();
 }
 if(p.pilot==='frommherz'&&s.focus){const [x,y]=point(s.focus.x,s.focus.y);if(visible(x,y,35))partMark(c,x,y,24,20,{color:MARK.warn,alpha:.5});}
 // Active firing uses the normal muzzle/round sprites. Only a compact caption
 // is added, avoiding a second fake muzzle or a generic skill ring.
 if(p.pilot==='frommherz'&&s.suppressing&&p.skillTime>0){const[x,y]=point(p.x,p.y);if(!visible(x,y,70))return;c.save();c.font='600 10px sans-serif';c.textAlign='center';c.fillStyle=MARK.warn;c.strokeStyle=MARK.ink;c.lineWidth=3;const text=locale==='en'?'FORCED LANDING':'강제 착륙';c.strokeText(text,x,y+46);c.fillText(text,x,y+46);c.restore();}
}

import {airThreatMuzzles,aaMuzzle} from './air-threat-profiles.js';
// Existing volley schedules call these helpers. They create no extra enemies,
// timers or prototype layers, and cap fire well below the previous 45-round volley.
function protectedUnit(e){return !e?.airThreatArt||e.stageBossBody||e.bossMinion||e.bossPilot;}
function emit(g,e,m,count,speed,damage){
 for(let j=0;j<count;j++){
  const a=m.angle+(j-(count-1)/2)*.12;
  g.bullets.push({x:m.x,y:m.y,sourceX:m.x,sourceY:m.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:3.6,enemy:true,heavy:true,visualType:e.fieldUnit==='balloon'?'balloon':'zeppelin',damage,hazardRegion:e.fieldRegion,airThreatRound:true});
 }
}
export function fireAirThreatVolley(g,e,followup=false){
 if(protectedUnit(e)||e.type!=='zeppelin')return false;
 if(e.hp<=0||g.sunStrikeContains?.(e)||(g.online&&g.host===false))return true;
 const muzzles=airThreatMuzzles(e),role=e.airThreatRole;
 const count=role==='heavy-defense'?3:role==='bomber'?2:1;
 const damage=Math.round(9*(1+(g.t||0)/240));
 for(const m of muzzles)emit(g,e,m,count,role==='bomber'?160:185,damage);
 e.muzzleFlash=.14;g.event?.('enemyShot','');return true;
}
export function fireBalloonVolley(g,e){
 if(protectedUnit(e)||e.fieldUnit!=='balloon')return false;
 // Ordinary observers retain spotting/repair/event utility, not guns absent in art.
 if(e.airThreatRole!=='heavy-defense'){e.fieldSalvoLeft=0;return true;}
 if(e.hp<=0||g.sunStrikeContains?.(e)||(g.online&&g.host===false))return true;
 for(const m of airThreatMuzzles(e))emit(g,e,m,3,145,14);
 e.fieldBurstIndex=(e.fieldBurstIndex||0)+1;e.muzzleFlash=.16;g.event?.('enemyShot','');return true;
}
export function configureFlakSource(source,rounds,size=66){
 const muzzle=aaMuzzle(source,size);source.muzzleOffsetX=muzzle.x-source.x;source.muzzleOffsetY=muzzle.y-source.y;
 for(const round of rounds){round.x=muzzle.x;round.y=muzzle.y;round.sourceX=muzzle.x;round.sourceY=muzzle.y;round.damage*=source.aaDamageFactor||1;}
 return source;
}
// Outside the original solo-rural network (which stays in engine.js), observers
// use the same existing observed battery volley. This replaces their old direct
// 33-round fire; it does not add entities or change the field spawn schedule.
export function tickAirThreatObservation(g,dt){
 if(g.state!=='playing'||g.online&&g.host===false)return;
 const region=g.worldRegion?.()??g.region??0,step=Math.min(.04,Math.max(0,dt));
 const observers=(g.enemies||[]).filter(e=>e.fieldUnit==='balloon'&&e.airThreatArt&&e.fieldRegion===region);
 for(const e of observers)noteAirThreatObserverDown(g,e);
 const live=observers.filter(e=>e.hp>0&&!e.expired),pilots=(g.players||[g]).filter(p=>p.hp>0&&(!p.status||p.status==='alive'));
 if(!live.length||(g.obsBlackoutUntil||0)>(g.t||0)||g.stageBoss?.stages?.phase==='boss'){g.airThreatObservationT=7;return;}
 for(const e of live){const exposed=pilots.some(p=>(p.cloudConceal||0)<.7&&Math.hypot(e.x-p.x,e.y-p.y)<720);e.observe=Math.max(0,(e.observe||0)+(exposed?step:-step*1.6));if(e.observe>=3)g.spottedUntil=(g.t||0)+10;}
 const spotted=(g.spottedUntil||0)>(g.t||0);g.airThreatObservationT=(g.airThreatObservationT??7)-step;
 if(g.airThreatObservationT<=0){g.airThreatObservationT=spotted?4.5:7;g.observedVolley?.(spotted);}
}

export function noteAirThreatObserverDown(g,e){
 if(e?.fieldUnit!=='balloon'||!e.airThreatArt||e.hp>0||e._obsDown)return false;
 e._obsDown=true;g.obsBlackoutUntil=Math.max(g.obsBlackoutUntil||0,(g.t||0)+12);g.spottedUntil=0;g.airThreatObservationT=7;g.event?.('flak','관측기구 격추 · 12초간 관측포격 중단');return true;
}

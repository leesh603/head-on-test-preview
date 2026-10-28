import {drawIntrusionBoss,prepareIntrusionArt,intrusionArtReady,releaseIntrusionArt,profileLayout} from './intrusion-boss-art.js';

export {intrusionArtReady};
export const INTRUSION_COPY=Object.freeze({
 'armed-svyatogor':{ko:'무장형 스뱌토고르',en:'Armed Svyatogor',tactic:'구동부를 끊고 기총좌를 제압하라',tacticEn:'Break the drives, silence the guns'},
 'twin-fortress':{ko:'쌍동 공중요새',en:'Twin Sky Fortress',tactic:'한쪽 포대를 무너뜨려라',tacticEn:'Break one broadside'},
 goliath:{ko:'골리앗',en:'Goliath',tactic:'외측 엔진을 끊어라',tacticEn:'Disable the outer engines'},
 bastion:{ko:'바스티옹',en:'Bastion',tactic:'장갑을 벗겨 기낭을 노려라',tacticEn:'Strip the armour, expose the gasbag'},
 citadel:{ko:'시타델',en:'Citadel',tactic:'현측 포대를 끊고 측면을 열어라',tacticEn:'Silence the broadside'},
 leviathan:{ko:'리바이어던',en:'Leviathan',tactic:'한쪽 외익을 무너뜨려라',tacticEn:'Break an outer wing'}
});
const requested=new Set();
export function releaseIntrusionView(){requested.clear();releaseIntrusionArt();}
export function prepareIntrusionView(e){
 if(!e||!INTRUSION_COPY[e.profileId]||requested.has(e.profileId))return;
 requested.add(e.profileId);
 prepareIntrusionArt(e.profileId).catch(error=>{console.error('[headon] intrusion asset unavailable',e.profileId,error);});
}
export function intrusionVisible(g){return !!g?.intrusionBoss&&!['reserved','resolved'].includes(g.intrusionBoss.phase)&&!['lost','won'].includes(g.state)&&g.stageBoss?.stages?.phase!=='boss';}
export function intrusionHudModel(g,locale='ko'){
 if(!intrusionVisible(g))return null;
 const e=g.intrusionBoss,copy=INTRUSION_COPY[e.profileId];if(!copy)return null;
 const en=locale==='en',parts=Object.values(e.parts||{}).filter(p=>p.kind!=='core');
 return {name:en?copy.en:copy.ko,tactic:en?copy.tacticEn:copy.tactic,hp:Math.max(0,e.hp),maxHp:e.maxHp,
 remaining:Math.ceil(Math.max(0,45-(e.activeAge||0))),broken:parts.filter(p=>p.hp<=0).length,total:parts.length,
 phase:e.phase,phaseLabel:({warning:en?'INCOMING':'접근 중',entering:en?'INCOMING':'진입 중',retreating:en?'WITHDRAWING':'이탈 중',destroyed:en?'DESTROYED':'격추'})[e.phase]||null};
}
/** Poll on simulation time, not wall time: pause/reconnect cannot replay or consume an arrival. */
export function intrusionCutinModel(g,seen,locale='ko'){
 const e=g?.intrusionBoss;
 if(!intrusionVisible(g)||!e||!['warning','entering'].includes(e.phase)||!INTRUSION_COPY[e.profileId])return null;
 if(seen?.encounterId===e.encounterId)return null;
 const copy=INTRUSION_COPY[e.profileId],en=locale==='en';
 return {encounterId:e.encounterId,startedAt:g.t,until:g.t+2.6,src:profileLayout(e.profileId)?.cutin,name:en?copy.en:copy.ko,
 kicker:en?'INTRUSION BOSS':'난입 보스',detail:en?copy.tacticEn:copy.tactic};
}
export function drawIntrusionLayer(c,g,W,H,layer='bodies'){
 const e=g?.intrusionBoss;if(!e)return;
 prepareIntrusionView(e);if(!intrusionVisible(g))return;
 const z=g.camera?.zoom||1,point=(x,y)=>({x:(x-g.x)*z+W/2,y:(y-g.y)*z+H/2});
 if(layer!=='hazards'&&intrusionArtReady(e.profileId)){
  c.save();
  if(e.phase==='warning'){
   // The authored silhouette crosses the field before the real body arrives.
   c.globalAlpha=.2;c.filter='brightness(0)';
   drawIntrusionBoss(c,e,{x:W*.5,y:-H*.15+Math.min(1,e.phaseAge/4)*H*.9},e.scale*z);
  }else{
   if(e.phase==='destroyed')c.globalAlpha=Math.max(0,1-e.phaseAge/3);
   drawIntrusionBoss(c,e,point(e.x,e.y),e.scale*z);
  }
  c.restore();
 }
 if(layer==='bodies')return;
 c.save();c.lineWidth=1.5;c.strokeStyle='#ffdba4';c.fillStyle='#d56a4f';
 for(const h of e.hazards||[]){if(h.done)continue;const p=point(h.x,h.y),r=h.radius*z,q=Math.min(1,h.age/Math.max(.01,h.warning));
  c.globalAlpha=.18;c.beginPath();c.arc(p.x,p.y,r,0,Math.PI*2);c.fill();c.globalAlpha=.8;c.setLineDash([5,5]);c.stroke();c.setLineDash([]);
  c.beginPath();c.arc(p.x,p.y,r*q,0,Math.PI*2);c.stroke();
 }
 for(const h of e.shotCues||[]){if(h.done)continue;const p=point(h.x,h.y),q=Math.min(1,h.age/Math.max(.01,h.warning));c.globalAlpha=.25+.5*q;c.setLineDash([4,6]);c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x+Math.cos(h.a)*110*z,p.y+Math.sin(h.a)*110*z);c.stroke();}
 c.restore();
}

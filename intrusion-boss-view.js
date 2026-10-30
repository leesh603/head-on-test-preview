import {drawIntrusionBoss,prepareIntrusionArt,intrusionArtReady,releaseIntrusionArt,profileLayout} from './intrusion-boss-art.js';

import {isMaritimeIntrusion,maritimeOpacity,maritimeTactic} from './maritime-intrusion.js';
import {drawShipWater} from './naval-water.js?v=tame3&perf=1029';
import {fx} from './fx-art.js';
import {getLocale} from './i18n.js';

export {intrusionArtReady};
export const INTRUSION_COPY=Object.freeze({
 dreadnought:{ko:'드레드노트',en:'Dreadnought',tactic:'대공포를 끊고 포격 사이로 진입하라',tacticEn:'Silence the AA, evade the heavy guns'},
 qship:{ko:'Q-ship',en:'Q-ship',tactic:'위장 덮개가 열리면 함포를 노려라',tacticEn:'Wait for the covers to open, silence the guns'},
 seeadler:{ko:'제아들러',en:'SMS Seeadler',tactic:'전방 양현 함포를 끊어라',tacticEn:'Silence the forward broadside'},
 nachtwal:{ko:'나흐트발',en:'Nachtwal',tactic:'항적을 쫓아 부상 직후를 노려라',tacticEn:'Track the wake, strike after surfacing'},
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
 return {name:en?copy.en:copy.ko,tactic:isMaritimeIntrusion(e)?maritimeTactic(e,locale):(en?copy.tacticEn:copy.tactic),hp:Math.max(0,e.hp),maxHp:e.maxHp,
 remaining:Math.ceil(Math.max(0,45-(e.activeAge||0))),broken:parts.filter(p=>p.hp<=0).length,total:parts.length,
 phase:e.phase,phaseLabel:({warning:en?'INCOMING':'접근 중',entering:en?'INCOMING':'진입 중',retreating:en?'WITHDRAWING':'이탈 중',destroyed:isMaritimeIntrusion(e)?(en?'SUNK':'격침'):(en?'DESTROYED':'격추')})[e.phase]||(e.profileId==='nachtwal'&&e.naval&&e.naval.phase!=='surfaced'?(en?'TRACK THE WAKE':'항적 추적'):null)};
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
/** Surface sprites are drawn in the existing ground/body pass, below aircraft and clouds.
 * All water marks use the game's authored foam assets; drawing never advances simulation. */
function drawMaritimeWater(c,e,point,z){
 const l=profileLayout(e.profileId),n=e.naval||{},waterWidth=l.waterWidth||l.width,waterHeight=l.waterHeight||l.height,w=waterWidth*e.scale*z,h=waterHeight*e.scale*z;
 const map=(x,y)=>{const p=point(x,y);return[p.x,p.y];};
 const trail=(n.wakeTrail||[]).slice().reverse().map(p=>({...p,x:p.x-Math.sin(p.a+Math.PI/2)*waterHeight*e.scale*.43,y:p.y+Math.cos(p.a+Math.PI/2)*waterHeight*e.scale*.43}));
 drawShipWater(c,{...e,waterTime:n.clock||e.age,wakeTrail:trail,driveVelocity:Math.max(0,e.driveVelocity||0)},w,h,map);
 if(e.profileId==='nachtwal'&&['diving','submerged','surfacing'].includes(n.phase)){
  // Bubbles follow the actual moving submarine; destination foam previews emergence.
  const p=point(e.x,e.y),pulse=1+.08*Math.sin((n.clock||0)*7);
  fx(c,'foamRing',p.x,p.y,w*.9*pulse,w*1.4*pulse,0,.55);
  if(n.destination){const d=point(n.destination.x,n.destination.y);fx(c,'foamRing',d.x,d.y,w*1.3,w*1.3,0,.35+.15*Math.sin((n.clock||0)*6));}
 }
 if(e.phase==='destroyed'){const p=point(e.x,e.y);fx(c,'foamRing',p.x,p.y,w*1.6,h*.8,0,.7);}
}
/** The control tower is baked into the original hull: damage is an explicit FX-only cue. */
function drawMaritimeDamage(c,e,point,z){
 if(e.profileId!=='nachtwal'||!(e.parts?.dive_control?.hp<=0))return;
 const target=profileLayout(e.profileId).targets.find(p=>p.id==='dive_control');if(!target)return;
 const a=e.a+Math.PI/2,cs=Math.cos(a),sn=Math.sin(a);
 const p=point(e.x+e.scale*(target.x*cs-target.y*sn),e.y+e.scale*(target.x*sn+target.y*cs));
 const width=Math.max(8,target.rx*2*e.scale*z),pulse=1+.08*Math.sin((e.age||0)*9);
 fx(c,'fire',p.x,p.y,width*.65*pulse,width*1.1,0,.85);
 fx(c,'smokeDark',p.x-width*.10,p.y-width*.7,width*1.25,width*1.9,-.12,.7);
}
/** Navigation only: a surface vessel stays in the world instead of chasing the camera. */
export function maritimeEdgeGuide(g,W,H){
 const e=g?.intrusionBoss;
 if(!intrusionVisible(g)||!isMaritimeIntrusion(e)||!['entering','active'].includes(e.phase)||!(W>0&&H>0))return null;
 const target=e.profileId==='nachtwal'&&['diving','submerged','surfacing'].includes(e.naval?.phase)&&e.naval.destination?e.naval.destination:e;
 const z=g.camera?.zoom||1,dx=(target.x-g.x)*z,dy=(target.y-g.y)*z;
 if(!Number.isFinite(dx)||!Number.isFinite(dy))return null;
 if(Math.abs(dx)<=W/2+24&&Math.abs(dy)<=H/2+24)return null;
 const compact=W<600||H<500,left=32,right=W-32,top=compact?Math.min(144,H*.22):100,bottom=H-(compact?Math.min(180,H*.27):58);
 const cx=W/2,cy=H/2;
 const tx=dx>0?(right-cx)/dx:dx<0?(left-cx)/dx:Infinity;
 const ty=dy>0?(bottom-cy)/dy:dy<0?(top-cy)/dy:Infinity;
 const t=Math.min(tx,ty);
 return{x:cx+dx*t,y:cy+dy*t,angle:Math.atan2(dy,dx),profileId:e.profileId,submerged:target!==e};
}
function drawMaritimeGuide(c,g,W,H){
 const m=maritimeEdgeGuide(g,W,H);if(!m)return;
 // Reuse the game's off-screen navigation chevron, not a substitute for a ship sprite.
 c.save();c.translate(m.x,m.y);c.rotate(m.angle);c.globalAlpha=.95;c.fillStyle='#ff855a';c.strokeStyle='#241a19';c.lineWidth=2;c.setLineDash([]);
 c.beginPath();c.moveTo(11,0);c.lineTo(-7,-6);c.lineTo(-4,0);c.lineTo(-7,6);c.closePath();c.fill();c.stroke();c.restore();
 const en=getLocale()==='en',copy=INTRUSION_COPY[m.profileId];
 c.save();c.globalAlpha=.95;c.font='700 11px sans-serif';c.textAlign='center';c.textBaseline='middle';c.lineWidth=3;c.strokeStyle='#172731';c.fillStyle='#ffe3bb';
 const label=m.submerged?(en?'Surfacing contact':'부상 예고 지점'):(en?copy.en:copy.ko),x=Math.max(82,Math.min(W-82,m.x)),y=m.y+18;
 c.strokeText(label,x,y);c.fillText(label,x,y);c.restore();
}
export function drawIntrusionLayer(c,g,W,H,layer='bodies'){
 const e=g?.intrusionBoss;if(!e)return;
 prepareIntrusionView(e);if(!intrusionVisible(g))return;
 const z=g.camera?.zoom||1,point=(x,y)=>({x:(x-g.x)*z+W/2,y:(y-g.y)*z+H/2});
 if(layer!=='hazards'&&intrusionArtReady(e.profileId)){
  c.save();
  const maritime=isMaritimeIntrusion(e);
  if(maritime&&e.phase!=='warning')drawMaritimeWater(c,e,point,z);
  if(e.phase==='warning'&&maritime){
   // A sea contact approaches at the waterline; never use the aircraft flyover shadow.
   // Cut-in/HUD warns first; the world contact is placed once at entry, not teleported visibly.
  }else if(e.phase==='warning'){
   // The authored silhouette crosses the field before the real body arrives.
   c.globalAlpha=.2;c.filter='brightness(0)';
   drawIntrusionBoss(c,{...e,a:Math.PI/2},{x:W*.5,y:-H*.15+Math.min(1,e.phaseAge/4)*H*.9},e.scale*z);
  }else{
   if(maritime){c.globalAlpha=maritimeOpacity(e);if(e.phase==='entering')c.globalAlpha*=Math.min(1,e.phaseAge/1.2);if(e.phase==='retreating')c.globalAlpha*=Math.max(0,1-e.phaseAge/3);}
   if(e.phase==='destroyed')c.globalAlpha*=Math.max(0,1-e.phaseAge/(maritime?1:3));
   const position=point(e.x,e.y);
   if(!maritime){
    // Use the same subtle ground-shadow cue as ordinary aircraft, with the exact
    // damaged-module silhouette; no replacement art or separate collision pose.
    c.save();c.globalAlpha*=.16;c.filter='brightness(0)';
    drawIntrusionBoss(c,{...e,flash:{}},{x:position.x+10*z,y:position.y+16*z},e.scale*z);
    c.restore();
   }
   drawIntrusionBoss(c,e,position,e.scale*z);
   if(maritime)drawMaritimeDamage(c,e,point,z);
  }
  c.restore();
 }
 if(layer==='bodies')return;
 drawMaritimeGuide(c,g,W,H);
 c.save();c.lineWidth=1.5;c.strokeStyle='#ffdba4';c.fillStyle='#d56a4f';
 for(const h of e.hazards||[]){const p=point(h.x,h.y),r=h.radius*z,q=Math.min(1,h.age/Math.max(.01,h.warning));
  if(h.kind==='naval-splash'){
   c.strokeStyle='#b8e8f4';c.fillStyle='#80bbcc';
   if(h.done){const fade=Math.max(0,1-(h.age-h.warning)/.35);fx(c,'splashShell',p.x,p.y,r*3,r*3,0,fade);fx(c,'waterColumn',p.x,p.y-r*.5,r*1.7,r*3,0,fade);continue;}
   fx(c,'foamRing',p.x,p.y,r*2,r*2,0,.25+.35*q);
  }else{c.strokeStyle='#ffdba4';c.fillStyle='#d56a4f';if(h.done)continue;}
  c.globalAlpha=.18;c.beginPath();c.arc(p.x,p.y,r,0,Math.PI*2);c.fill();c.globalAlpha=.8;c.setLineDash([5,5]);c.stroke();c.setLineDash([]);
  c.beginPath();c.arc(p.x,p.y,r*q,0,Math.PI*2);c.stroke();
 }
 c.strokeStyle='#ffdba4';
 for(const h of e.shotCues||[]){if(h.done)continue;const p=point(h.x,h.y),q=Math.min(1,h.age/Math.max(.01,h.warning));c.globalAlpha=.25+.5*q;c.setLineDash([4,6]);for(const offset of h.offsets||[0]){c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x+Math.cos(h.a+offset)*110*z,p.y+Math.sin(h.a+offset)*110*z);c.stroke();}}
 c.restore();
}


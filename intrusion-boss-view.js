import {giantArrivalShadowPose} from './giant-intrusion-arrival.js';
import {blacken} from './silhouette.js';
import {isNewSubmarine,SUBMARINE_SINK_DURATION} from './submarine-intrusion.js';
import {drawIntrusionOrdnance,drawIntrusionBoss,drawIntrusionDebris,prepareIntrusionArt,intrusionArtReady,releaseIntrusionArt,profileLayout} from './intrusion-boss-art.js';

import {isMaritimeIntrusion,isSubmarine,maritimeOpacity,maritimeTactic,maritimeWeaponsReady} from './maritime-intrusion.js';
import {drawShipWater,drawTorpedo} from './naval-water.js?v=tame3&perf=1029&shipperf=20261112';
import {drawSinkingShip} from './ship-sinking.js?v=tame3';
import {fx} from './fx-art.js?v=tame3';
import {drawWaterContact} from './water-contact-art.js';
import {getLocale} from './i18n.js?v=buildfit1&afc=1&art=pilot-recovery2';

export {intrusionArtReady};
export const INTRUSION_COPY=Object.freeze({
 uboat:{ko:'U-35',en:'U-35',tactic:'갑판포를 피하고 어뢰 발사관을 파괴하세요.',tacticEn:'Evade guns; break torpedo tubes.'},
 m1:{ko:'HMS M1',en:'HMS M1',tactic:'주포 예고를 피하고 재장전 중 공격하세요.',tacticEn:'Dodge shells; attack on reload.'},
 'linke-hofmann-r-ii':{ko:'링케호프만 R.II',en:'Linke-Hofmann R.II',tactic:'후방 기총을 피하고 구동부를 끊어라',tacticEn:'Evade the rear guns, break the shared drive'},
 'handley-page-v1500':{ko:'핸들리 페이지 V/1500',en:'Handley Page V/1500',tactic:'폭격 항로를 벗어나 앞뒤 엔진을 끊어라',tacticEn:'Leave the bomb lane, disable the tandem engines'},
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
export function prepareIntrusionView(e,ships=[]){
 const ids=new Set(ships.map(ship=>ship.profileId));
 if(e&&e.phase!=='resolved'&&INTRUSION_COPY[e.profileId])ids.add(e.profileId);
 if(ids.size===requested.size&&[...ids].every(id=>requested.has(id)))return;
 releaseIntrusionArt(...ids);requested.clear();
 for(const id of ids){
  requested.add(id);
  prepareIntrusionArt(id).catch(error=>{console.error('[headon] intrusion asset unavailable',id,error);});
 }
}
export function intrusionVisible(g){return !!g?.intrusionBoss&&!['reserved','resolved'].includes(g.intrusionBoss.phase)&&!['lost','won'].includes(g.state)&&g.stageBoss?.stages?.phase!=='boss';}
export function intrusionHudModel(g,locale='ko'){
 if(!intrusionVisible(g))return null;
 const e=g.intrusionBoss,copy=INTRUSION_COPY[e.profileId];if(!copy)return null;
 const en=locale==='en',parts=Object.values(e.parts||{}).filter(p=>p.kind!=='core');
 const disguised=e.operationOwned&&e.profileId==='qship'&&!e.naval?.revealing;
 return {name:disguised?(en?'Merchant contact':'미확인 상선'):e.displayName||(en?copy.en:copy.ko),
 tactic:disguised?(en?'Cover U-139 as it approaches':'U-139의 접근을 엄호하세요'):isMaritimeIntrusion(e)?maritimeTactic(e,locale):(en?copy.tacticEn:copy.tactic),hp:Math.max(0,e.hp),maxHp:e.maxHp,
 remaining:Math.ceil(Math.max(0,e.operationTimeLeft??45-(e.activeAge||0))),broken:parts.filter(p=>p.hp<=0).length,total:parts.length,
 phase:e.phase,phaseLabel:({warning:en?'INCOMING':'접근 중',entering:en?'INCOMING':'진입 중',retreating:en?'WITHDRAWING':'이탈 중',destroyed:isMaritimeIntrusion(e)?(en?'SUNK':'격침'):(en?'DESTROYED':'격추')})[e.phase]||(isSubmarine(e)&&e.naval&&e.naval.phase!=='surfaced'?(en?'TRACK THE WAKE':'항적 추적'):null)};
}
/** Poll on simulation time, not wall time: pause/reconnect cannot replay or consume an arrival. */
export function intrusionCutinModel(g,seen,locale='ko'){
 const e=g?.intrusionBoss;
 if(!intrusionVisible(g)||!e||!INTRUSION_COPY[e.profileId])return null;
 if(e.operationOwned&&e.profileId==='qship'){
  if(!e.naval?.revealing||e.naval.reveal>=1)return null;
 }else if(!['warning','entering'].includes(e.phase))return null;
 if(seen?.encounterId===e.encounterId)return null;
 const copy=INTRUSION_COPY[e.profileId],en=locale==='en';
 return {encounterId:e.encounterId,startedAt:g.t,until:g.t+2.6,src:profileLayout(e.profileId)?.cutin,name:e.displayName||(en?copy.en:copy.ko),
 kicker:e.operationOwned?(en?'NAVAL OPERATION':'해상 작전'):(en?'INTRUSION BOSS':'난입 보스'),detail:en?copy.tacticEn:copy.tactic};
}
/** Surface sprites are drawn in the existing ground/body pass, below aircraft and clouds.
 * All water marks use the game's authored foam assets; drawing never advances simulation. */
function drawMaritimeWater(c,e,point,z){
 const l=profileLayout(e.profileId),n=e.naval||{},waterWidth=l.waterWidth||l.width,waterHeight=l.waterHeight||l.height,w=waterWidth*e.scale*z,h=waterHeight*e.scale*z;
 const map=(x,y)=>{const p=point(x,y);return[p.x,p.y];};
 const trail=(n.wakeTrail||[]).slice().reverse().map(p=>({...p,x:p.x-Math.sin(p.a+Math.PI/2)*waterHeight*e.scale*.43,y:p.y+Math.cos(p.a+Math.PI/2)*waterHeight*e.scale*.43}));
 drawShipWater(c,{...e,waterTime:n.clock||e.age,wakeTrail:trail,driveVelocity:Math.max(0,e.driveVelocity||0)},w,h,map);
 if(isSubmarine(e)&&['diving','submerged','surfacing'].includes(n.phase)){
  // Bubbles follow the actual moving submarine; destination foam previews emergence.
  const p=point(e.x,e.y),pulse=1+.08*Math.sin((n.clock||0)*7);
  fx(c,'foamRing',p.x,p.y,w*.9*pulse,w*1.4*pulse,0,.55);
  if(n.destination){const d=point(n.destination.x,n.destination.y);fx(c,'foamRing',d.x,d.y,w*1.3,w*1.3,0,.35+.15*Math.sin((n.clock||0)*6));}
 }
 if(e.phase==='destroyed'){const p=point(e.x,e.y);fx(c,'foamRing',p.x,p.y,w*1.6,h*.8,0,.7);}
}
/** The control tower is baked into the original hull: damage is an explicit FX-only cue. */
function drawMaritimeDamage(c,e,point,z){
 if(isNewSubmarine(e)){
  if(e.naval?.phase!=='surfaced')return;
  const a=e.a+Math.PI/2,cs=Math.cos(a),sn=Math.sin(a);
  for(const t of profileLayout(e.profileId).targets){const part=e.parts?.[t.id];if(t.id==='core'||!part||part.hp>part.maxHp*.5)continue;
   const p=point(e.x+e.scale*(t.x*cs-t.y*sn),e.y+e.scale*(t.x*sn+t.y*cs)),w=Math.max(8,t.rx*2*e.scale*z);
   fx(c,'fire',p.x,p.y,w*.65,w,0,.85);fx(c,'smokeDark',p.x,p.y-w*.6,w,w*1.7,-.12,.7);
  }return;
 }

 if(!isSubmarine(e)){
  if(!maritimeWeaponsReady(e))return;
  const layout=profileLayout(e.profileId),a=e.a+Math.PI/2,cs=Math.cos(a),sn=Math.sin(a),t=e.visualTime??e.age??0;
  let sources=0;
  for(const target of layout.targets){
   const part=e.parts?.[target.id];
   if(target.id==='core'||!part||part.hp>part.maxHp*.5)continue;
   const {x,y}=target,p=point(e.x+e.scale*(x*cs-y*sn),e.y+e.scale*(x*sn+y*cs));
   const width=Math.min(25,Math.max(8,Math.min(target.rx,target.ry)*2*e.scale))*z;
   const dead=part.hp<=0,drift=(t*.7+sources*.38)%1;
   fx(c,dead?'smokeDark':'smokeGray',p.x+width*drift*.54,p.y-width*(.24+drift*1.25),width*(.68+drift*1.3),width*(1+drift*1.65),.26,(1-drift)*(dead?.66:.35));
   if(dead)fx(c,'fireGround',p.x,p.y,width*.57,width*.78,0,.48+.1*Math.sin(t*16+sources));
   if(++sources===4)break;
  }
  return;
 }
 if(!(e.parts?.dive_control?.hp<=0))return;
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
 const target=isSubmarine(e)&&['diving','submerged','surfacing'].includes(e.naval?.phase)&&e.naval.destination?e.naval.destination:e;
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
// The boss shadow is the boss itself in flat black. It used to be drawn through
// `filter='brightness(0)'` every frame, which alone took the game from 60 to under 20 fps while a
// flying intrusion boss was on the field. The silhouette is now cut into one offscreen canvas in the
// boss's own frame (refreshed five times a second for turrets and lost modules) and rotated on blit.
const SHADOW={canvas:null,key:'',limit:1536,rate:5};
function drawIntrusionSilhouette(c,e,a,position,scale){
 const layout=profileLayout(e.profileId);
 if(typeof document==='undefined'||!layout||!(scale>0)){c.filter='brightness(0)';drawIntrusionBoss(c,{...e,a,flash:{},v1500Shadow:true,riiShadow:true},position,scale);return;}
 const full=Math.ceil(Math.hypot(layout.width,layout.height)*scale)+8,fit=Math.min(1,SHADOW.limit/full),size=Math.ceil(full*fit);
 const key=`${e.encounterId||''}|${e.profileId}|${size}|${Math.floor((e.age||0)*SHADOW.rate)}`;
 const canvas=SHADOW.canvas||(SHADOW.canvas=document.createElement('canvas'));
 if(SHADOW.key!==key){
  if(canvas.width!==size)canvas.width=canvas.height=size;
  const o=canvas.getContext('2d');o.setTransform(1,0,0,1,0,0);o.globalAlpha=1;o.globalCompositeOperation='source-over';o.clearRect(0,0,size,size);
  drawIntrusionBoss(o,{...e,a:-Math.PI/2,flash:{},v1500Shadow:true,riiShadow:true},{x:size/2,y:size/2},scale*fit);
  blacken(o,size,size);SHADOW.key=key;
 }
 c.save();c.translate(position.x,position.y);c.rotate(a+Math.PI/2);c.drawImage(canvas,-full/2,-full/2,full,full);c.restore();
}
function drawAirframeDamage(c,e,point,z){
 const layout=profileLayout(e.profileId),t=e.visualTime??e.age??0;
 const a=e.a+Math.PI/2,cs=Math.cos(a),sn=Math.sin(a),scale=e.scale;
 let sources=0;
 for(const target of layout.targets){
  const part=e.parts?.[target.id];
  if(!part||!['engine','wing'].includes(target.kind)||part.hp>part.maxHp*.5)continue;
  const sprite=layout.parts.find(p=>p.group===target.id&&p.kind===target.kind);
  if(!sprite||sprite.dependencies.some(id=>e.parts?.[id]?.hp<=0))continue;
  const destroyed=part.hp<=0;
  if(target.kind==='wing'&&!destroyed)continue;
  const stub=sprite.states.destroyed;
  const x=target.kind==='wing'&&stub?.bounds?stub.x-stub.pivot[0]+stub.bounds[target.x<0?0:2]:target.x;
  const y=target.kind==='wing'?target.y:target.y+target.ry*.58;
  const width=Math.min(22,Math.max(5,Math.min(target.rx,target.ry)*scale*1.8));
  const w=width*z,seed=++sources*.37;
  for(let i=1;i>=0;i--){
   const age=(t*.85+seed+i*.5)%1,off=age*width*2.9,drift=Math.sin(age*3+seed)*off*.22;
   const q=point(e.x+x*scale*cs-y*scale*sn+drift*cs-off*sn,e.y+x*scale*sn+y*scale*cs+drift*sn+off*cs);
   fx(c,destroyed?'smokeDark':'smokeGray',q.x,q.y,w*(.7+age*1.8),w*(1+age*2.1),a+age*.4,(1-age)*(destroyed?.53:.32));
  }
  if(destroyed&&target.kind==='engine'&&stub&&stub.src!==sprite.states.intact?.src){
   const q=point(e.x+scale*(x*cs-y*sn),e.y+scale*(x*sn+y*cs));
   const flame=.83+.12*Math.sin(t*19+seed);
   fx(c,'fireEngine',q.x,q.y,w*.8*flame,w*1.2*flame,a,.68);
  }
  if(sources===5)break;
 }
}
export function drawIntrusionLayer(c,g,W,H,layer='bodies'){
 if(!g)return;
 const e=g.intrusionBoss,naval=g.operationBattle?.naval||g.operationSnapshot?.battle?.naval;
 prepareIntrusionView(e,naval?.ships);
 const z=g.camera?.zoom||1,point=(x,y)=>({x:(x-g.x)*z+W/2,y:(y-g.y)*z+H/2});
 if(naval)drawOperationWater(c,naval,point,z,layer);
 if(!e||!intrusionVisible(g))return;
 if(layer!=='hazards'&&intrusionArtReady(e.profileId)){
  c.save();
  const maritime=isMaritimeIntrusion(e);
  if(maritime&&(e.phase!=='warning'||isNewSubmarine(e)&&e.contactPlaced))drawMaritimeWater(c,e,point,z);
  if(e.phase==='warning'&&maritime){
   if(isNewSubmarine(e)&&e.contactPlaced)drawIntrusionBoss(c,e,point(e.x,e.y),e.scale*z);
   // A sea contact approaches at the waterline; never use the aircraft flyover shadow.
   // Cut-in/HUD warns first; the world contact is placed once at entry, not teleported visibly.
  }else if(e.phase==='warning'&&['handley-page-v1500','linke-hofmann-r-ii'].includes(e.profileId)){
   const shadow=giantArrivalShadowPose(e);if(shadow){c.globalAlpha=shadow.alpha;drawIntrusionSilhouette(c,e,shadow.a,point(shadow.x,shadow.y),e.scale*z);}
  }else if(e.phase==='warning'){
   // The authored silhouette crosses the field before the real body arrives.
   c.globalAlpha=.2;
   drawIntrusionSilhouette(c,e,Math.PI/2,{x:W*.5,y:-H*.15+Math.min(1,e.phaseAge/4)*H*.9},e.scale*z);
  }else if(e.phase==='destroyed'&&isNewSubmarine(e)){
   drawIntrusionWreck(c,e,point,z,e.phaseAge);
  }else{
   if(maritime){c.globalAlpha=maritimeOpacity(e);if(e.phase==='entering'&&!isNewSubmarine(e))c.globalAlpha*=Math.min(1,e.phaseAge/1.2);if(e.phase==='retreating')c.globalAlpha*=Math.max(0,1-e.phaseAge/3);}
   if(e.phase==='destroyed')c.globalAlpha*=Math.max(0,1-e.phaseAge/(maritime?1:3));
   const position=point(e.x,e.y);
   if(!maritime){
    // Use the same subtle ground-shadow cue as ordinary aircraft, with the exact
    // damaged-module silhouette; no replacement art or separate collision pose.
    c.save();c.globalAlpha*=.16;
    drawIntrusionSilhouette(c,e,e.a??-Math.PI/2,{x:position.x+10*z,y:position.y+(16+(e.profileId==='handley-page-v1500'?e.crashDrop||0:0))*z},e.scale*z);
    c.restore();
   }
   drawIntrusionBoss(c,e,position,e.scale*z);
   if(['handley-page-v1500','linke-hofmann-r-ii'].includes(e.profileId))drawIntrusionOrdnance(c,e,point,z);
   else if(maritime)drawMaritimeDamage(c,e,point,z);
   else{drawIntrusionDebris(c,e,point,z);drawAirframeDamage(c,e,point,z);}
  }
  c.restore();
 }
 if(layer==='bodies')return;
 for(const q of e.naval?.torpedoes||[]){const p=point(q.x,q.y);if(q.age<q.warning){fx(c,'foamRing',p.x,p.y,30*z,30*z,0,.7);continue;}c.save();c.translate(p.x,p.y);c.scale(z*.45,z*.45);drawTorpedo(c,{...q,x:0,y:0});c.restore();}
 drawMaritimeGuide(c,g,W,H);
 c.save();c.lineWidth=1.5;c.strokeStyle='#ffdba4';c.fillStyle='#d56a4f';
 for(const h of e.hazards||[]){let p=point(h.x,h.y);const r=h.radius*z,q=Math.min(1,h.age/Math.max(.01,h.warning));
  if(h.kind==='naval-splash'){
   c.strokeStyle='#b8e8f4';c.fillStyle='#80bbcc';
    if(h.done){
     const progress=Math.min(1,Math.max(0,(h.age-h.warning)/.35)),diameter=r*(h.fireAt!=null?3.9:3);
     if(!drawWaterContact(c,p.x,p.y,diameter,progress)){
      fx(c,'splashShell',p.x,p.y,diameter,diameter,0,1-progress);
      fx(c,'waterColumn',p.x,p.y-r*.5,diameter*.57,diameter,0,1-progress);
     }
     continue;
    }
    if(h.fired&&h.fireAt!=null){
     const t=Math.min(1,(h.age-h.fireAt)/(h.warning-h.fireAt));
     const shell=point(h.fireX+(h.x-h.fireX)*t,h.fireY+(h.y-h.fireY)*t);
     fx(c,'shell',shell.x,shell.y-Math.sin(Math.PI*t)*24*z,24*z,10*z,Math.atan2(h.y-h.fireY,h.x-h.fireX),1);
    }
  }else{c.strokeStyle='#ffdba4';c.fillStyle='#d56a4f';if(h.done)continue;}
  if(h.edgeWarning){
   const pad=Math.min(r+5,W*.15,H*.15);
   p={x:Math.max(pad,Math.min(W-pad,p.x)),y:Math.max(pad,Math.min(H-pad,p.y))};
  }
  if(h.kind==='naval-splash')fx(c,'foamRing',p.x,p.y,r*2,r*2,0,.25+.35*q);
  c.globalAlpha=.18;c.beginPath();c.arc(p.x,p.y,r,0,Math.PI*2);c.fill();c.globalAlpha=.8;c.setLineDash([5,5]);c.stroke();c.setLineDash([]);
  c.beginPath();c.arc(p.x,p.y,r*q,0,Math.PI*2);c.stroke();
 }
 c.strokeStyle='#ffdba4';
 for(const h of e.shotCues||[]){if(h.done)continue;const p=point(h.x,h.y),q=Math.min(1,h.age/Math.max(.01,h.warning));c.globalAlpha=.25+.5*q;c.setLineDash([4,6]);for(const offset of h.offsets||[0]){c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x+Math.cos(h.a+offset)*(h.telegraphLength||110)*z,p.y+Math.sin(h.a+offset)*(h.telegraphLength||110)*z);c.stroke();}}
 c.restore();
}

function drawIntrusionWreck(c,e,point,z,age){
 const p=point(e.x,e.y),layout=profileLayout(e.profileId),scale=e.scale*z;
 drawSinkingShip(c,{...p,key:e,yaw:e.a+Math.PI/2,width:(layout.waterWidth||layout.width)*scale,height:(layout.waterHeight||layout.height)*scale,age,duration:SUBMARINE_SINK_DURATION},ctx=>drawIntrusionBoss(ctx,e,p,scale));
}

function drawOperationWater(c,naval,point,z,layer){
 if(layer!=='hazards')for(const ship of naval.ships){
  if(!intrusionArtReady(ship.profileId))continue;
  if(ship.hp<=0){drawIntrusionWreck(c,ship,point,z,ship.sinkAge||0);continue;}
  drawMaritimeWater(c,ship,point,z);
  drawIntrusionBoss(c,ship,point(ship.x,ship.y),ship.scale*z);
 }
 if(layer==='bodies')return;
 for(const h of naval.pressure){
  const target=point(h.x,h.y),r=h.radius*z,t=Math.min(1,h.age/h.warning);
  if(h.done){
   const progress=Math.min(1,Math.max(0,(h.age-h.warning)/.35));
   if(!drawWaterContact(c,target.x,target.y,r*3,progress))fx(c,'splashShell',target.x,target.y,r*3,r*3,0,1-progress);
   continue;
  }
  const shot=point(h.fireX+(h.x-h.fireX)*t,h.fireY+(h.y-h.fireY)*t);
  fx(c,h.bomb?'bomb':'shell',shot.x,shot.y-Math.sin(t*Math.PI)*32*z,20*z,9*z,Math.atan2(h.y-h.fireY,h.x-h.fireX),.9);
  fx(c,'foamRing',target.x,target.y,r*2,r*2,0,.55+.35*t);
 }
}


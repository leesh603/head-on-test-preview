import {ordinaryFighter,fighterShotReady} from './dogfight-pass165.js?v=headon-quality-20261023-7d8a4756';
// Regional doctrine for ordinary aircraft.  This module only selects among the
// Battle Director's existing manoeuvres and bends those manoeuvres around live
// battlefield hazards; it never changes aircraft stats, spawn counts or caps.
import {maanSandCover} from './maan-weather.js?v=headon-quality-20261023-7d8a4756';

const P=Object.freeze({
 HEAD_ON_PASS:'HEAD_ON_PASS',CROSS_ATTACK:'CROSS_ATTACK',PINCER:'PINCER',CHASE:'CHASE',ESCORT:'ESCORT',DECOY:'DECOY',
 BOMBER_RUN:'BOMBER_RUN',BAIT:'BAIT',VETERAN_FORMATION:'VETERAN_FORMATION',ELITE_FORMATION:'ELITE_FORMATION'
});

const profile=(name,patterns,hazards=[],escort=[],scene={})=>Object.freeze({name,patterns:Object.freeze(patterns),hazards:Object.freeze(hazards),escort:Object.freeze(escort),scene:Object.freeze(scene)});

// Indexes intentionally match stageboss-host STAGE_NAMES (0..17).
export const REGIONAL_AIR_TACTICS=Object.freeze([
 profile('전원 기뢰 회피',[P.PINCER,P.DECOY,P.CHASE],['mine'],['field'],{front:35,lane:1.3,yaw:-.18,exit:.5}),
 profile('아드리아 해상 횡단',[P.CROSS_ATTACK,P.ESCORT,P.BOMBER_RUN],['naval'],['naval'],{front:90,lane:1.7,yaw:.32,exit:.8}),
 profile('참호 포격선 돌파',[P.HEAD_ON_PASS,P.PINCER,P.CHASE],['bomb','gas'],['field'],{front:60,lane:1.45,yaw:-.12,exit:.65}),
 profile('포화 연막 교차전',[P.CROSS_ATTACK,P.BAIT,P.PINCER],['bomb','gas'],[],{front:20,lane:1.8,yaw:.48,exit:.9}),
 profile('도심 탐조등 엄호',[P.DECOY,P.CHASE,P.CROSS_ATTACK],[],['city'],{front:75,lane:.72,yaw:-.28,exit:.55}),
 profile('고공 기류 추격',[P.CHASE,P.HEAD_ON_PASS,P.BOMBER_RUN],['wind'],[],{front:135,lane:2,yaw:.2,exit:1.05}),
 profile('알프스 능선 협공',[P.PINCER,P.CHASE,P.BAIT],['gust','mountain'],[],{front:105,lane:1.65,yaw:.58,exit:.85}),
 profile('제브뤼헤 항만 엄호',[P.ESCORT,P.BOMBER_RUN,P.CROSS_ATTACK],['naval'],['naval','harbor'],{front:55,lane:.62,yaw:-.08,exit:.45}),
 profile('캉브레 횡단 포격',[P.CROSS_ATTACK,P.PINCER,P.BOMBER_RUN],['bomb'],[],{front:80,lane:1.85,yaw:-.52,exit:.95}),
 profile('아라스 비행단',[P.VETERAN_FORMATION,P.HEAD_ON_PASS,P.PINCER],['gust'],[],{front:145,lane:1.1,yaw:.1,exit:.7}),
 profile('솜 관측기 엄호',[P.ESCORT,P.PINCER,P.CHASE],['bomb'],['field'],{front:45,lane:1.5,yaw:.38,exit:.6}),
 profile('런던 야간 폭격',[P.BOMBER_RUN,P.ESCORT,P.DECOY],[],['london'],{front:120,lane:2.1,yaw:-.42,exit:1.1}),
 profile('베르됭 요새 접근',[P.HEAD_ON_PASS,P.CROSS_ATTACK,P.CHASE],['bossHazard'],[],{front:85,lane:1.25,yaw:.14,exit:.5}),
 profile('마안 먼지 엄폐',[P.DECOY,P.BAIT,P.CROSS_ATTACK],['sand'],[],{front:30,lane:2.2,yaw:.66,exit:1.15}),
 profile('갈리폴리 해안 횡단',[P.ESCORT,P.CROSS_ATTACK,P.BOMBER_RUN],['mine','naval'],['naval'],{front:110,lane:.78,yaw:-.22,exit:.48}),
 profile('파리 야간 차단',[P.DECOY,P.CROSS_ATTACK,P.CHASE],['cloud'],[],{front:70,lane:1.9,yaw:.5,exit:1}),
 profile('유틀란트 함대 엄호',[P.ESCORT,P.BOMBER_RUN,P.PINCER],['naval'],['naval'],{front:130,lane:2.25,yaw:.27,exit:.82}),
 profile('도버 야간 차단',[P.CROSS_ATTACK,P.DECOY,P.ESCORT],['naval'],['naval'],{front:95,lane:1.72,yaw:-.6,exit:1.2})
]);

const regionFor=game=>game.worldRegion?.()??game.region??0;
export function regionalTacticsActive(game){
 if(!game||game.state!=='playing')return false;
 const phase=game.stageBoss?.stages?.phase;
 return !phase||phase==='explore';
}
export function regionalAirProfile(game){return REGIONAL_AIR_TACTICS[regionFor(game)]||null;}

export function regionalAircraftEligible(e,{allowElite=false}={}){
 if(!(e?.hp>0))return false;
 if(e.eliteKind)return !!(allowElite&&e.alive!==false&&!e.expired&&!e.crashing&&!e.bossPilot&&!e.ace&&!e.rivalAce&&!e.eventAce&&!e.stageBossBody&&!e.bossMinion&&!e.missionTarget&&!e.battlefieldEventId);
 return !!(!e.expired&&!e.crashing&&!e.bossPilot&&!e.ace&&!e.rivalAce&&!e.bossMinion&&!e.stageBossBody&&!e.heavyBomber&&!e.surface&&!e.stationary&&!e.fieldUnit&&!e.navalVessel&&!e.missionTarget&&!e.battlefieldEventId&&!e.eventAce&&['scout','hunter','bomber'].includes(e.type));
}

export function regionalPatternPool(game,candidates){
 const profile=regionalAirProfile(game);
 if(!profile||!regionalTacticsActive(game))return candidates;
 const available=new Set(candidates),preferred=profile.patterns.filter(pattern=>available.has(pattern));
 // Repetition is a weight only.  Candidate kinds and the Director cadence stay
 // unchanged, and a map cannot unlock a pattern before its normal time gate.
 return preferred.length?[...preferred,...candidates]:candidates;
}

const facilityKind=e=>e.navalVessel||e.movingShip?'naval':e.harborFacility?'harbor':e.cityUnit?'city':e.londonInstallation?'london':e.fieldUnit?'field':null;
export function regionalEscortTarget(game,from){
 const profile=regionalAirProfile(game);
 if(!profile?.escort.length||!regionalTacticsActive(game))return null;
 const allowed=new Set(profile.escort),origin=from||game.players?.find(p=>p.hp>0)||game;
 let target=null,best=Infinity;
 for(const e of game.enemies||[]){
  const kind=facilityKind(e);
  if(!(e.hp>0)||e.expired||e.missionTarget||e.battlefieldEventId||e.bossPilot||e.bossMinion||e.stageBossBody||!allowed.has(kind))continue;
  const d=Math.hypot((e.x||0)-(origin.x||0),(e.y||0)-(origin.y||0));
  if(d<best&&d<=Math.max(900,(game.viewWidth||960)*.9)){best=d;target=e}
 }
 return target;
}

// Rotate and widen the Director's existing layout once, at scene entry.  The
// aircraft then fly there through normal steering; no combat-frame teleporting.
export function regionalScenePlacement(game,{anchor,layout,index,count,forward,lateral,protectedTarget=null}){
 const profile=regionalAirProfile(game),scene=profile?.scene||{},side=index%2?1:-1;
 const routeA=(Number.isFinite(anchor.a)?anchor.a:-Math.PI/2)+(scene.yaw||0)*side;
 let f=forward+(forward<0?-(scene.front||0):scene.front||0),l=lateral*(scene.lane||1);
 let center=anchor;
 if(protectedTarget&&['escort','bomber'].includes(layout)){
  center=protectedTarget;f=layout==='bomber'?180:130;l=(index-(count-1)/2)*85*(scene.lane||1);
 }
 return{x:center.x+Math.cos(routeA)*f-Math.sin(routeA)*l,y:center.y+Math.sin(routeA)*f+Math.cos(routeA)*l,a:routeA,exit:(scene.exit||.6)*side,region:regionFor(game),protectedTarget};
}

export function regionalExitHeading(game,e,heading){
 const scene=regionalAirProfile(game)?.scene;if(!scene||!regionalTacticsActive(game))return heading;
 return heading+(e.regionalExitOffset??(scene.exit||.6)*(e.directorEntrySide||e.combatPassSide||1));
}

function hazardCircles(game,profile){
 const key=regionFor(game)+':'+Math.floor((game.t||0)*5),cached=game._regionalAirHazards;
 if(cached?.key===key)return cached.items;
 const kinds=profile.hazards,out=[],push=(x,y,r,mode='avoid',dir,width)=>{if(out.length<48&&Number.isFinite(x)&&Number.isFinite(y))out.push({x,y,r,mode,dir,width})};
 if(kinds.includes('mine'))for(const f of game.hostileMinefields||[])if(f.warning<=0&&f.life>0)for(const m of f.mines||[])if(!m.dead&&!m.deploying)push(m.x,m.y,(m.triggerRadius||36)+38);
 if(kinds.includes('gas'))for(const z of game.gasZones||[])if((z.warning??0)<=0&&z.life>0)push(z.x,z.y,(z.r||z.radius||150)+35);
 if(kinds.includes('bomb'))for(const z of game.bombZones||[])if(z.delay>0&&z.delay<2.4)push(z.x,z.y,(z.radius||38)+45);
 if(kinds.includes('bomb')&&game.barrage&&!game.barrage.expired&&(game.barrage.warn??0)<=0&&out.length<48){const b=game.barrage;out.push({x:b.x,y:b.y,mode:'barrage',dir:b.dir,pos:b.pos||0,width:65})}
 if(kinds.includes('gust'))for(const z of game.gusts||[])if(z.life>0){if(z.thermal)push(z.x,z.y,(z.radius||100)+35,'current',Math.atan2(z.vy||0,z.vx||0));else push(z.x,z.y,(z.radius||60)+35)}
 if(kinds.includes('naval'))for(const b of game.bullets||[])if(b.enemy&&b.naval&&b.life>0)push(b.x,b.y,48);
 if(kinds.includes('wind'))for(const w of game.windStreams||[])if(!w.expired&&w.life>0)push(w.x,w.y,w.len||0,'flow',w.dir,w.width||130);
 if(kinds.includes('sand'))for(const s of game.maanWeather?.cells||[])if(s.age>.6&&s.life-s.age>.6)push(s.x,s.y,Math.max(s.rx||0,s.ry||0),'seek');
 if(kinds.includes('cloud'))for(const c of game.clouds||[])if(c.type!=='wispy')push(c.x,c.y,c.type==='bank'?245:c.type==='dark'?190:135,'seek');
 if(kinds.includes('mountain')&&game.alpsMountains?.query){const z=game.camera?.zoom||1,w=(game.viewWidth||960)/z,h=(game.viewHeight||700)/z;for(const p of game.alpsMountains.query({left:(game.x||0)-w/2,top:(game.y||0)-h/2,right:(game.x||0)+w/2,bottom:(game.y||0)+h/2})||[])push(p.x,p.y,Math.max(p.hitRx||p.radius||60,p.hitRy||p.radius||60)+35,'mountain')}
 if(kinds.includes('bossHazard'))game.stageBoss?.hazards?.pool?.visit?.(h=>{if(['warning','active'].includes(h.phase)&&h.kind==='circle')push(h.x,h.y,(h.radius||48)+40)});
 game._regionalAirHazards={key,items:out};return out;
}

function hazardAvoidance(game,e,profile,baseTurn){
 const look=90,x=e.x+Math.cos(e.a)*look,y=e.y+Math.sin(e.a)*look;
 let nearest=null,best=Infinity;
 const hazards=hazardCircles(game,profile);
 for(const h of hazards)if(h.mode==='barrage'){
  const ca=Math.cos(h.dir),sa=Math.sin(h.dir),dx=x-h.x,dy=y-h.y,along=dx*ca+dy*sa,lateral=-dx*sa+dy*ca;
  if(along>=h.pos-65&&along<=h.pos+65&&Math.abs(lateral)<h.width+45){const heading=h.dir+(lateral>=0?1:-1)*Math.PI/2;return{delta:Math.atan2(Math.sin(heading-e.a),Math.cos(heading-e.a)),turn:baseTurn}}
 }
 for(const h of hazards){if(!['avoid','mountain'].includes(h.mode)||h.mode==='mountain'&&e._ridgeWarn>0)continue;const d=Math.hypot(x-h.x,y-h.y)-h.r;if(d<best){best=d;nearest=h}}
 if(nearest&&best<=0){
  const away=Math.atan2(e.y-nearest.y,e.x-nearest.x),side=Math.sin(e.a-away)>=0?1:-1,heading=away+side*.55;
  return{delta:Math.atan2(Math.sin(heading-e.a),Math.cos(heading-e.a)),turn:baseTurn};
 }
 const flow=hazards.find(h=>{if(h.mode!=='flow')return false;const ca=Math.cos(h.dir),sa=Math.sin(h.dir),dx=e.x-h.x,dy=e.y-h.y,along=dx*ca+dy*sa,lateral=-dx*sa+dy*ca;return along>0&&along<h.r&&Math.abs(lateral)<h.width});
 if(flow&&Number.isFinite(flow.dir)&&Math.cos(flow.dir-e.a)>.25)return{delta:Math.atan2(Math.sin(flow.dir-e.a),Math.cos(flow.dir-e.a)),turn:baseTurn};
 const current=hazards.find(h=>h.mode==='current'&&Math.hypot(e.x-h.x,e.y-h.y)<h.r);
 if(current&&Number.isFinite(current.dir)&&Math.cos(current.dir-e.a)>.25)return{delta:Math.atan2(Math.sin(current.dir-e.a),Math.cos(current.dir-e.a)),turn:baseTurn};
 if(['DISENGAGE','REPOSITION'].includes(e.combatPassState)){
  let cover=null,coverDistance=460;for(const h of hazards)if(h.mode==='seek'){const d=Math.hypot(e.x-h.x,e.y-h.y);if(d<coverDistance){coverDistance=d;cover=h}}
  if(cover){const heading=Math.atan2(cover.y-e.y,cover.x-e.x);return{delta:Math.atan2(Math.sin(heading-e.a),Math.cos(heading-e.a)),turn:baseTurn}}
 }
 return null;
}

// Called after the existing pass/personality steering has made its decision.
// Only an imminent live hazard may override it.
export function regionalSteering(game,e,contact,baseTurn,result,allowElite=false){
 if(!regionalTacticsActive(game)||!regionalAircraftEligible(e,{allowElite})||!contact||contact.fogHidden||contact.kaiserFogTime>0||contact.ballCloak>0||baseTurn<=0)return result;
 const profile=regionalAirProfile(game);if(!profile)return result;
 e.regionalTacticRegion=regionFor(game);
 return hazardAvoidance(game,e,profile,baseTurn)||result;
}

// Call from a world's native target selector before cloud concealment wraps it.
// Exact raw player contacts may be reprioritized; ghost/copied contacts pass
// through unchanged so smoke, cloud and pilot concealment stay authoritative.
export function regionalCombatTarget(game,e,contact){
 if(!regionalTacticsActive(game)||!regionalAircraftEligible(e)||!contact||contact.fogHidden)return contact;
 const players=game.players?.filter(p=>p.hp>0&&(!p.status||p.status==='alive'))||(game.hp>0?[game]:[]);
 if(players.length&&contact!==game&&!players.includes(contact))return contact;
 const region=regionFor(game);
 if(region===13&&maanSandCover(game.maanWeather,contact.x,contact.y))return{x:e.x+Math.cos(e.a)*420,y:e.y+Math.sin(e.a)*420,a:e.a,fogHidden:true};
 const visible=p=>(p.kaiserFogTime||0)<=0&&!(p.ballCloak>0)&&(p.cloudConceal||0)<1.2;
 const exposed=region===4?players.filter(p=>(p.illuminatedUntil||0)>(game.t||0)&&visible(p)):region===11?players.filter(p=>(p.londonLitUntil||0)>(game.t||0)&&visible(p)):null;
 if(exposed?.length)return exposed.reduce((best,p)=>!best||Math.hypot(p.x-e.x,p.y-e.y)<Math.hypot(best.x-e.x,best.y-e.y)?p:best,null);
 return contact;
}

// Co-op enemy volleys aim directly at a contact even when the airframe points
// elsewhere.  Gate only ordinary fighter fire; bombers, facilities, aces and
// bosses retain their authored weapons and timings.
export function regionalShotReady(game,e,contact){
 if(!regionalTacticsActive(game)||!regionalAircraftEligible(e)||e.type==='bomber')return true;
 if(ordinaryFighter(e))return fighterShotReady(game,e,contact);
 if(!contact||contact.fogHidden||contact.kaiserFogTime>0||contact.ballCloak>0)return false;
 const aim=Math.atan2(contact.y-e.y,contact.x-e.x),error=Math.abs(Math.atan2(Math.sin(aim-e.a),Math.cos(aim-e.a)));
 return error<=.55;
}

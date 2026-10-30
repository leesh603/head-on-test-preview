import {isMaritimeIntrusion,maritimeAttackable} from './maritime-intrusion.js?v=capital-final-20261030';
import {photoReconActive} from './photo-recon-encounters.js';
/** Narrow adapter: optional encounters never enter BossStages or its reward hooks. */
import {stepIntrusion,intrusionActive,disposeIntrusion,hitIntrusionAt,locateIntrusionHit,intrusionProfiles,intrusionWorldPoint,intrusionPartExposed} from './intrusion-bosses.js?v=capital-final-20261030';
import {intrusionLayout} from './intrusion-boss-layouts.js?v=capital-final-20261030';
import {prepareIntrusionArt,intrusionArtReady} from './intrusion-boss-art.js?v=capital-final-20261030';
const visualLoads=new WeakMap();
export function tickIntrusionHost(g,dt,window){
 if(g.online&&!g.host||g.mode==='campaign')return;
 if(['lost','won'].includes(g.state)){disposeIntrusion(g,'run-ended');syncIntrusionTarget(g);return;}
 const stages=g.stageBoss?.stages;if(!stages||!window)return;
 const busy=photoReconActive(g)||(g.bossPresentationAfter||0)>(g.t||0)||(g.battleRecoveryUntil||0)>(g.t||0)||(g.enemies||[]).some(e=>!e.intrusionBody&&!e.stageBossBody&&e.hp>0&&!e.expired&&!e.rivalEscaped&&(e.bossPilot||e.type==='boss'))||!!g.eliteEnemies?.active||g.battlefieldEvents?.current?.status==='active'||(g.ruralFronts?.fronts||[]).some(f=>f.status==='active')||!!g.londonBattle||!!g.parisBattle||!!g.verdunBattle;
 const artReady=id=>typeof Image==='undefined'||intrusionArtReady(id);
 stepIntrusion(g,dt,{...window,phase:stages.phase,orderPosition:stages.orderPosition,faction:stages.teamFaction||g.teamFaction,width:(g.viewWidth||960)/(g.camera?.zoom||1),height:(g.viewHeight||700)/(g.camera?.zoom||1),blocked:busy,artReady,regularBossHp:g.stageBoss.hooks?.getTuning?.({bossId:'gik'})?.maxHp});
 const e=g.intrusionBoss;
 if(e&&intrusionActive(g)&&typeof Image!=='undefined'&&visualLoads.get(g)!==e.encounterId){visualLoads.set(g,e.encounterId);prepareIntrusionArt(e.profileId).catch(error=>{e.assetError=String(error.message);disposeIntrusion(g,'art-unavailable');});}
 syncIntrusionTarget(g);
}
export function syncIntrusionTarget(g){
 const e=g.intrusionBoss,attackable=e&&['entering','active'].includes(e.phase)&&maritimeAttackable(e);
 g.enemies=(g.enemies||[]).filter(t=>!t.intrusionBody||(attackable&&t.encounterId===e.encounterId));
 if(!attackable||g.enemies.some(t=>t.intrusionBody&&t.encounterId===e.encounterId))return;
 const body={id:e.encounterId,kind:e.profileId,faction:intrusionProfiles[e.profileId].faction};
 for(const k of ['x','y','a','hp','maxHp'])Object.defineProperty(body,k,{enumerable:true,get:()=>e[k]});
 const parts=new Map();
 for(const shape of intrusionLayout(e.profileId).targets){const state=e.parts[shape.id];if(!state)continue;const part={id:shape.id,kind:state.kind};
  for(const key of ['hp','maxHp','state'])Object.defineProperty(part,key,{enumerable:true,get:()=>state[key]});
  Object.defineProperty(part,'destroyed',{get:()=>state.hp<=0||!intrusionPartExposed(e,shape.id)});
  Object.defineProperty(part,'x',{get:()=>intrusionWorldPoint(e,shape).x-e.x});
  Object.defineProperty(part,'y',{get:()=>intrusionWorldPoint(e,shape).y-e.y});parts.set(shape.id,part);
 }
 Object.defineProperty(body,'parts',{value:parts});
 Object.defineProperty(body,'dead',{get:()=>e.hp<=0||!['entering','active'].includes(e.phase)||!maritimeAttackable(e)});
 const target={id:e.encounterId,encounterId:e.encounterId,intrusionBody:true,stageBossBody:body,type:'stageBoss',faction:body.faction,combatLayer:isMaritimeIntrusion(e)?'surface':'air',stationary:isMaritimeIntrusion(e),surface:isMaritimeIntrusion(e),navalVessel:isMaritimeIntrusion(e),missionTarget:true,speed:0,fire:Infinity};
 for(const k of ['x','y','a','hp','maxHp'])Object.defineProperty(target,k,{enumerable:true,get:()=>e[k]});
 // Broadphase includes the entire hull; narrowphase uses each authored part ellipse.
 target.collisionRadius=Math.hypot(e.width,e.height)*.5;
 g.enemies.push(target);
}
export function intrusionTargetCollision(g,target,x,y,b={}){if(!maritimeAttackable(g.intrusionBoss))return false;if(b.identityDotTarget)return target.encounterId===g.intrusionBoss?.encounterId&&['entering','active'].includes(g.intrusionBoss.phase)&&target.stageBossBody.parts.get(b.identityDotTarget.id)===b.identityDotTarget&&b.identityDotTarget.hp>0&&intrusionPartExposed(g.intrusionBoss,b.identityDotTarget.id);return target.encounterId===g.intrusionBoss?.encounterId&&!!locateIntrusionHit(g,{x,y,previousX:b.previousX??x,previousY:b.previousY??y,radius:b.actualExplosion?b.explosionRadius:b.collisionRadius||0});}
export function hitIntrusionTarget(g,target,b,damage){
 if(target.encounterId!==g.intrusionBoss?.encounterId||!maritimeAttackable(g.intrusionBoss))return{damage:0,broken:[]};
 const partId=b.identityDotTarget?.id;if(b.identityDotTarget&&target.stageBossBody.parts.get(partId)!==b.identityDotTarget)return {damage:0,broken:[]};
 return hitIntrusionAt(g,{partId,x:b.x,y:b.y,previousX:b.previousX,previousY:b.previousY,radius:b.actualExplosion?b.explosionRadius:b.collisionRadius||0,damage,ownerId:b.ownerId});
}



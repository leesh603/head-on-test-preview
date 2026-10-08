import {GALLIPOLI_PARTS,gallipoliMuzzle,gallipoliAngleDelta,turnGallipoliTurret} from './gallipoli-boss.js?v=raid2&rail=18';
export const GALLIPOLI_ROUTE=Object.freeze({shore:2800,cliff:4000,fort:8000,halfWidth:3600,backLimit:-1500,bossLimit:10800});
export function createGallipoliRoute(g){return{x:g.x,y:g.y,a:Number.isFinite(g.a)?g.a:-Math.PI/2,maxForward:0,cues:new Set(),encounterId:(g.stageBoss?.runId||'route')+':gallipoli-approach'};}
export function gallipoliPoint(r,s,n=0){return{x:r.x+Math.cos(r.a)*s-Math.sin(r.a)*n,y:r.y+Math.sin(r.a)*s+Math.cos(r.a)*n};}
export function tickGallipoliRoute(g,dt=0){
 const addon=g.stageBoss;if(addon?.stages.stageIndex!==14){if(g.gallipoliRoute)addon?.hazards?.clear(g.gallipoliRoute.encounterId);g.gallipoliRoute=null;return;}
 const r=g.gallipoliRoute??=createGallipoliRoute(g);
 for(const p of g.players||[g]){const dx=p.x-r.x,dy=p.y-r.y,s=Math.max(GALLIPOLI_ROUTE.backLimit,Math.min(GALLIPOLI_ROUTE.bossLimit,dx*Math.cos(r.a)+dy*Math.sin(r.a))),n=Math.max(-GALLIPOLI_ROUTE.halfWidth,Math.min(GALLIPOLI_ROUTE.halfWidth,-dx*Math.sin(r.a)+dy*Math.cos(r.a)));Object.assign(p,gallipoliPoint(r,s,n));r.maxForward=Math.max(r.maxForward,s);}
 if(addon.stages.phase!=='explore'){if(!r.introStopped){addon.hazards?.clear(r.encounterId);r.introStopped=true;}return;}
 // The preview is the installed fortress at its final world coordinates.
 const anchor=gallipoliPoint(r,GALLIPOLI_ROUTE.fort);
 r.preview??={...anchor,captured:new Set(),commandMaxHp:1,commandHp:1,commandDestroyed:false,coreAngle:Math.PI/2,hp:1,maxHp:1,faction:addon.stages.teamFaction==='central'?'entente':'central',parts:new Map(GALLIPOLI_PARTS.map(p=>[p.id,{...p,hp:1,maxHp:1,angle:Math.PI/2,recoil:0}]))};
 for(const [s,msg,id]of [[1000,'다르다넬스 외해 · 해안 방어선 수색'],[2200,'갈리폴리 해안 접근 · 절벽 포대 경계','left'],[4300,'참호 방어선 진입 · 동부 해안포 확인','east-howitzer'],[6500,'절벽 요새 접근 · 후방 중포 성채 확인','rear-left']]){
  if(r.maxForward<s||r.cues.has(s))continue;r.cues.add(s);g.event?.('wave',msg);
  if(id&&addon.hazards&&r.maxForward-s<700){const p=r.preview.parts.get(id),dx=g.x-r.x,dy=g.y-r.y,n=-dx*Math.sin(r.a)+dy*Math.cos(r.a);p.aimTarget=gallipoliPoint(r,r.maxForward+250,n+(id==='east-howitzer'?190:-190));}
 }
 for(const p of r.preview.parts.values()){
  p.recoil=Math.max(0,p.recoil-dt);p.gunFlash=Math.max(0,(p.gunFlash||0)-dt);if(!p.aimTarget)continue;
  const target=p.aimTarget,want=Math.atan2(target.y-anchor.y-p.y,target.x-anchor.x-p.x);p.angle=turnGallipoliTurret(p.angle,want,.7,dt);if(Math.abs(gallipoliAngleDelta(p.angle,want))>.055)continue;
  p.recoil=.28;const muzzle=gallipoliMuzzle(r.preview,p,-1);Object.assign(p,{gunFlash:.16,flashX:muzzle.x,flashY:muzzle.y});
  const tuning=addon.hooks.getTuning({bossId:'gallipoli-fortress',stageIndex:14,loopIndex:addon.stages.loopIndex});
  addon.hazards.spawn({kind:'circle',encounterId:r.encounterId,bossId:'gallipoli-approach',...target,sourceX:muzzle.x,sourceY:muzzle.y,radius:60,damage:tuning.damage,warning:2.6,duration:.45,once:true,visual:'gallipoli-shell'});
  addon.hooks.onCue({type:'muzzle',bossId:'gallipoli-approach',partId:p.id,...muzzle});p.aimTarget=null;
 }
}

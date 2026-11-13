import {RURAL_TRACK_ART,holdRuralTrackArt} from './rural-rail-track-art.js';
export const RURAL_TRACK_PITCH=RURAL_TRACK_ART.height*RURAL_TRACK_ART.scale;
export const onRuralRailMap=g=>g?.stageBoss?.stages?.stageIndex===0
 &&(g.worldRegion?.()??g.region??0)===0&&!g.operationBattle&&!g.finalArena;

// Terrain belongs to the region, not to the encounter that happens on it.
export function updateRuralRailGround(g,{newMap=false}={}){
 if(onRuralRailMap(g)){
  if(newMap)g.ruralRailGround=null;
  if(!g.ruralRailGround&&g.viewWidth>0){
   const z=g.camera?.zoom||1,w=g.viewWidth/z,h=(g.viewHeight||700)/z;
   const approachY=Math.round(g.y-Math.max(1800,h*.7+RURAL_TRACK_PITCH));
   const origin={x:Math.round(g.x-Math.min(85,w*.18)),y:approachY-Math.round(RURAL_TRACK_PITCH/2)};
   g.ruralRailGround={ruralTrack:true,approachY,trackEndY:approachY+Math.ceil(RURAL_TRACK_PITCH),artOrigin:origin,axis:{x:0,y:1},railTarget:{...origin,radius:34},railHp:1,c:{railHp:1}};
  }
 }else g.ruralRailGround=null;
 holdRuralTrackArt(!!g.ruralRailGround);
 return g.ruralRailGround??null;
}
export function ruralRailRoute(g){
 if(onRuralRailMap(g))return g.ruralRailGround?.artOrigin;
}
export function ruralRailApproach(g){
 const r=g.ruralRailGround;
 if(!r||!onRuralRailMap(g))return null;
 const x=r.artOrigin.x,approachY=r.approachY??r.trackMaxY;
 const pilots=g.players||[g];
 if(pilots.some(p=>(p.hp??1)>0&&p.status!=='downed'&&p.status!=='dead'&&Math.abs(p.x-x)<=110&&p.y<=approachY))return null;
 return {x,y:Math.min(g.y,approachY)};
}
export function syncRuralRailGround(g,body){
 const ground=g.ruralRailGround,r=body?.rail129;
 if(!ground||!onRuralRailMap(g)||!body?.ruralRailBoss||!r)return;
 ground.railTarget={...r.railTarget};ground.railHp=r.railHp;ground.c.railHp=r.c.railHp;ground.broken=r.broken;
 ground.trackEndY=Math.max(ground.trackEndY??ground.approachY??-Infinity,Math.ceil(r.railTarget.y+RURAL_TRACK_PITCH));
}

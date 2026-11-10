import {RURAL_TRACK_ART,holdRuralTrackArt} from './rural-rail-track-art.js?v=b3bf991d11fc7798';
export const RURAL_TRACK_PITCH=RURAL_TRACK_ART.height*RURAL_TRACK_ART.scale;
export const onRuralRailMap=g=>g?.stageBoss?.stages?.stageIndex===0
 &&(g.worldRegion?.()??g.region??0)===0&&!g.operationBattle&&!g.finalArena;

// Terrain belongs to the region, not to the encounter that happens on it.
export function updateRuralRailGround(g,{newMap=false}={}){
 if(onRuralRailMap(g)){
  if(newMap)g.ruralRailGround=null;
  if(!g.ruralRailGround&&g.viewWidth>0){
   const z=g.camera?.zoom||1,w=g.viewWidth/z,h=(g.viewHeight||700)/z;
   const trackMaxY=Math.round(g.y-Math.max(1800,h*.7));
   const origin={x:Math.round(g.x-Math.min(85,w*.18)),y:trackMaxY-Math.round(RURAL_TRACK_PITCH/2)};
   g.ruralRailGround={ruralTrack:true,trackMaxY,artOrigin:origin,axis:{x:0,y:1},railTarget:{...origin,radius:34},railHp:1,c:{railHp:1}};
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
 const z=g.camera?.zoom||1,w=(g.viewWidth||960)/z,h=(g.viewHeight||700)/z;
 const x=r.artOrigin.x,y=Math.min(g.y,r.trackMaxY-h/2-200);
 return Math.abs(g.x-x)>Math.max(60,w/2-105)||g.y>y?{x,y}:null;
}
export function syncRuralRailGround(g,body){
 const ground=g.ruralRailGround,r=body?.rail129;
 if(!ground||!onRuralRailMap(g)||!body?.ruralRailBoss||!r)return;
 ground.railTarget={...r.railTarget};ground.railHp=r.railHp;ground.c.railHp=r.c.railHp;ground.broken=r.broken;
}

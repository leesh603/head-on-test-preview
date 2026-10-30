export const JUTLAND_ROUTE=Object.freeze({fleet:13800,halfWidth:3600,backLimit:-1500,bossLimit:17500});
export function createJutlandRoute(g){return{x:g.x,y:g.y,a:Number.isFinite(g.a)?g.a:-Math.PI/2,maxForward:0,cues:new Set()};}
export function jutlandPoint(r,s,n=0){return{x:r.x+Math.cos(r.a)*s-Math.sin(r.a)*n,y:r.y+Math.sin(r.a)*s+Math.cos(r.a)*n};}
// Keep the existing finite sea battle around the steaming fleet. Ships retain
// their own speed; they must never skate after the aircraft or its camera.
export function jutlandBattleBounds(g){
 const s=g.stageBoss?.stages,e=s?.encounter;
 if(s?.stageIndex!==16||s.phase!=='boss'||e?.bossId!=='jutland-grand-fleet')return null;
 const ships=[...e.bodies.values()].filter(b=>!b.jutlandAirship);
 if(!ships.length||ships.every(b=>b.dead))return null;
 return {left:Math.min(...ships.map(b=>b.anchorX))-1050,right:Math.max(...ships.map(b=>b.anchorX))+1050,top:Math.min(...ships.map(b=>b.anchorY))-1200,bottom:Math.max(...ships.map(b=>b.anchorY))+1200};
}
export function steerJutlandBoundary(g,p,dt,speed){
 const b=jutlandBattleBounds(g);if(!b){delete p.jutlandReturn;return;}
 const buffer=Math.max(320,Math.min(650,speed*2));let x=0,y=0;
 if(p.x<b.left+buffer)x=(b.left+buffer-p.x)/buffer;
 if(p.x>b.right-buffer)x=-(p.x-b.right+buffer)/buffer;
 if(p.y<b.top+buffer)y=(b.top+buffer-p.y)/buffer;
 if(p.y>b.bottom-buffer)y=-(p.y-b.bottom+buffer)/buffer;
 const id=g.stageBoss.stages.encounter.id;
 let turn=p.jutlandReturn;
 if(turn?.id!==id){delete p.jutlandReturn;turn=null;}
 if(!turn){
  if(!x&&!y||Math.cos(p.a)*x+Math.sin(p.a)*y>=.35*Math.hypot(x,y))return;
  turn=p.jutlandReturn={id,angle:p.a};
 }
 // Finish the physical return turn before handing steering back. Starting
 // from the newly applied outward input each frame pins a held stick/mouse
 // to the boundary and discards almost all forward movement at the clamp.
 const target=Math.atan2((b.top+b.bottom)/2-p.y,(b.left+b.right)/2-p.x),delta=Math.atan2(Math.sin(target-turn.angle),Math.cos(target-turn.angle)),rate=Math.max(1.2,Math.min(3.5,(p.turn||2)*1.7));
 p.a=turn.angle+=Math.max(-rate*dt,Math.min(rate*dt,delta));
 if(!x&&!y)delete p.jutlandReturn;
}
export function containJutlandPlayer(g,p,previousX=p.x,previousY=p.y){const b=jutlandBattleBounds(g);if(b&&previousX>=b.left&&previousX<=b.right&&previousY>=b.top&&previousY<=b.bottom){p.x=Math.max(b.left,Math.min(b.right,p.x));p.y=Math.max(b.top,Math.min(b.bottom,p.y));}}
export function tickJutlandRoute(g){if(g.stageBoss?.stages.stageIndex!==16){g.jutlandRoute=null;return;}const r=g.jutlandRoute??=createJutlandRoute(g);for(const p of g.players||[g]){const dx=p.x-r.x,dy=p.y-r.y,s=Math.max(JUTLAND_ROUTE.backLimit,Math.min(JUTLAND_ROUTE.bossLimit,dx*Math.cos(r.a)+dy*Math.sin(r.a))),n=Math.max(-JUTLAND_ROUTE.halfWidth,Math.min(JUTLAND_ROUTE.halfWidth,-dx*Math.sin(r.a)+dy*Math.cos(r.a)));Object.assign(p,jutlandPoint(r,s,n));r.maxForward=Math.max(r.maxForward,s);}if(g.stageBoss.stages.phase==='explore')for(const [s,msg]of [[3000,'북해 외해 · 전투전대 수색'],[6200,'연기 기둥 포착 · 순양함 경계선 접근'],[9200,'관측 비행선 확인 · 함대 사격지휘 경계'],[11400,'유틀란트 전투전대 · 전함과 호위함을 개별 격파']])if(r.maxForward>=s&&!r.cues.has(s)){r.cues.add(s);g.event?.('wave',msg);}}

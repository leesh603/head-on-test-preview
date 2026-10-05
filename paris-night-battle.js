// Paris has one authored city, shared by terrain, objectives and boss placement.
export const PARIS_SIZE=2048;
const inParis=g=>g.stageBoss?.stages.stageIndex===15;
export function ensureParisBattle(g){
 if(!inParis(g)){g.parisBattle=null;return null;}
 if(g.parisBattle)return g.parisBattle;
 const origin={x:g.x,y:g.y};
 return g.parisBattle={origin,cityDamage:0,damageLimit:120,warnings:[],bombs:[],cleared:false,
  role:g.stageBoss.stages.teamFaction==='central'?'attack':'defend',
  districts:[['rail','철도 보급역','Rail depot',680,230],['hospital','시가지 구호구역','Medical district',-780,360],['quay','센 강변','Seine quays',340,460]].map(([id,name,en,x,y])=>({id,name,en,x:x+origin.x,y:y+origin.y,hp:120,maxHp:120}))};
}
export function handleParisCue(g,e){
 const b=ensureParisBattle(g);if(!b)return;
 if(e.type==='boss-enter'){
  const body=g.stageBoss.stages.encounter?.bodies.values().next().value;
  if(body?.kind==='paris-searchlight-fortress'){body.x=b.origin.x;body.y=b.origin.y-460;}
  g.event('wave',b.role==='attack'?'파리 방공요새 · 빛의 박자를 피하고 발전기를 제압하세요':'파리 방어 · 엔진과 폭탄창을 공략해 도시 폭격을 막으세요');
 }
 if(e.type==='city-bomb-warning')b.warnings.push({...e,bodyId:e.bossId});
 if(e.type==='paris-light-beat')b.safeRoutes=e.safeRoutes;
 if(e.type==='city-bomb-abort')b.warnings=b.warnings.filter(w=>w.runId!==e.runId);
 if(e.type==='city-bomb-rack-abort')b.bombs=b.bombs.filter(q=>q.bossId!==e.sourceBossId||q.rackId!==e.rackId);
 if(e.type==='city-bomb'){b.warnings=b.warnings.filter(w=>w.runId!==e.runId);b.bombs.push({...e,left:e.seconds});}
}
export function tickParisBattle(g,dt){
 const b=ensureParisBattle(g);if(!b||g.state!=='playing'||g.pendingLevelUps?.length)return;
 // Flight remains unrestricted; authored outskirts blend into the countryside.
 for(const bomb of b.bombs){
  bomb.left-=dt;if(bomb.left>0||bomb.resolved)continue;bomb.resolved=true;
  const d=b.districts.find(d=>d.id===bomb.targetId);if(!d||b.cleared)continue;
  const damage=Math.min(d.hp,Math.max(0,bomb.damage));d.hp-=damage;b.cityDamage+=damage;
  g.combatBlast(d.x,d.y,75,'enemy','bomb');g.event('wave',d.name+' 피격 · 도시 피해 '+Math.ceil(b.cityDamage)+' / '+b.damageLimit);
 }
 b.bombs=b.bombs.filter(q=>!q.resolved);
 if(b.role==='defend'&&!b.cleared&&b.cityDamage>=b.damageLimit){g.state='lost';g.score=g.kills*100+Math.floor(g.t)*10;g.event('end','파리 방어 실패 · 도시 누적 피해 한계 초과');}
}
export function parisStatus(g,locale='ko'){
 const b=g.parisBattle;if(!b)return '';const en=locale==='en';
 const q=g.stageBoss?.stages.encounter?.bodies.values().next().value;
 if(b.role==='attack'){
  if(q?.phase==='last-stand'){
   const armed=[...q.parts.values()].some(p=>p.kind==='gun'&&!p.destroyed);
   return en?(armed?'LIGHTS DOWN · evade batteries and attack command':'BATTERIES DOWN · attack command'):(armed?'탐조등 제압 · 잔여 포대 회피 · 지휘부 공격':'포대 제압 · 지휘부 공격');
  }
  const angle=b.safeRoutes?.[0]?.angle,arrows=['→','↘','↓','↙','←','↖','↑','↗'];
  const arrow=Number.isFinite(angle)?' '+arrows[(Math.round(angle/(Math.PI/4))%8+8)%8]:'';
  return q?.coreVulnerable?(en?'BLACKOUT · attack command':'소등 · 지휘부 공격'):(en?'LIGHT BEAT ':'탐조 ')+Math.min(4,q?.rhythmBeat||0)+' / 4'+arrow+(q?.locks?.size?(en?' · TRACKED!':' · 발각!'):'');
 }
 return (en?'CITY DAMAGE ':'도시 피해 ')+Math.ceil(b.cityDamage)+' / '+b.damageLimit+(q?.runTarget?(en?' · DROP ':' · 투하 ')+Math.max(0,q.runRemaining/q.speedRatio()).toFixed(1)+'s':'');
}

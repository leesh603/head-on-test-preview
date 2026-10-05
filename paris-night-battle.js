// Paris has one authored city, shared by terrain, objectives and boss placement.
export const PARIS_SIZE=3072;
const heroes=g=>g.players||[g];
const inParis=g=>g.stageBoss?.stages.stageIndex===15;
export function ensureParisBattle(g){
 if(!inParis(g)){g.parisBattle=null;return null;}
 if(g.parisBattle)return g.parisBattle;
 const origin={x:g.x,y:g.y};
 return g.parisBattle={origin,cityDamage:0,damageLimit:120,warnings:[],bombs:[],cleared:false,
  role:g.stageBoss.stages.teamFaction==='central'?'attack':'defend',
  districts:[['rail','철도 보급역','Rail depot',700,-850],['hospital','시가지 구호구역','Medical district',-700,190],['quay','센 강변','Seine quays',500,430]].map(([id,name,en,x,y])=>({id,name,en,x:x+origin.x,y:y+origin.y,hp:120,maxHp:120}))};
}
export function handleParisCue(g,e){
 const b=ensureParisBattle(g);if(!b)return;
 if(e.type==='boss-enter'){
  const body=g.stageBoss.stages.encounter?.bodies.values().next().value;
  if(body?.kind==='paris-searchlight-fortress'){body.x=b.origin.x;body.y=b.origin.y-940;}
  g.event('wave',b.role==='attack'?'파리 방공요새 · 빛의 박자를 피하고 발전기를 제압하세요':'파리 방어 · 엔진과 폭탄창을 공략해 도시 폭격을 막으세요');
 }
 if(e.type==='city-bomb-warning')b.warnings.push({...e,bodyId:e.bossId});
 if(e.type==='city-bomb-abort')b.warnings=b.warnings.filter(w=>w.runId!==e.runId);
 if(e.type==='city-bomb'){b.warnings=b.warnings.filter(w=>w.runId!==e.runId);b.bombs.push({...e,left:e.seconds});}
}
export function tickParisBattle(g,dt){
 const b=ensureParisBattle(g);if(!b||g.state!=='playing'||g.pendingLevelUps?.length)return;
 // A finite city avoids repeated tiles. Keep the camera inside the authored map.
 const z=g.camera?.zoom||1,mx=Math.min(700,(g.viewWidth||960)/z/2+24),my=Math.min(700,(g.viewHeight||700)/z/2+24);
 for(const p of heroes(g)){p.x=Math.max(b.origin.x-PARIS_SIZE/2+mx,Math.min(b.origin.x+PARIS_SIZE/2-mx,p.x));p.y=Math.max(b.origin.y-PARIS_SIZE/2+my,Math.min(b.origin.y+PARIS_SIZE/2-my,p.y));}
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
 if(b.role==='attack')return en?'Dodge the light rhythm → strike during blackout':'빛의 박자 회피 → 소등 중 공격';
 const q=g.stageBoss?.stages.encounter?.bodies.values().next().value;
 return (en?'CITY DAMAGE ':'도시 피해 ')+Math.ceil(b.cityDamage)+' / '+b.damageLimit+(q?.runTarget?(en?' · DROP ':' · 투하 ')+Math.max(0,q.runRemaining/q.speedRatio()).toFixed(1)+'s':'');
}

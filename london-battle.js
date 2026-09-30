const heroes=g=>g.players||[g],live=g=>heroes(g).filter(p=>p.hp>0&&!p.down);
const inLondon=g=>(g.worldRegion?.()??g.stageBoss?.stages.stageIndex)===11;
export function londonRiverCover(x,y){const u=((x%768)+768)%768/768,v=((y%768)+768)%768/768;return v>.415+u*.15&&v<.495+u*.16;}
export function ensureLondonBattle(g){if(!inLondon(g)){if(g.londonBattle){g.enemies=g.enemies.filter(e=>!e.londonOwned);g.londonBattle=null;}return null;}
 if(g.londonBattle)return g.londonBattle;return g.londonBattle={role:(g.teamFaction||g.stageBoss?.stages.teamFaction)==='central'?'attack':'defend',elapsed:0,waveClock:4,waves:0,suppressed:0,intercepted:0,tracked:[],districts:[],warnings:[],bombs:[],supportClock:5,cleared:false};}
export function handleLondonCue(g,e){const b=ensureLondonBattle(g);if(!b)return;
 if(e.type==='boss-enter'){
  if(b.role==='defend'&&!b.districts.length){const bs=[...g.stageBoss.stages.encounter.bodies.values()],x=bs.reduce((n,q)=>n+q.anchorX,0)/bs.length,y=bs.reduce((n,q)=>n+q.anchorY,0)/bs.length+210,s=Math.min(230,(g.viewWidth||800)*.5);
   b.districts=[['west','서부 구역','West district',x-s,y],['docks','강변 보급지','River depot',x,y+125],['east','동부 구역','East district',x+s,y]].map(([id,name,en,x,y])=>({id,name,en,x,y,hp:120,maxHp:120}));
   g.event('wave','런던 방어 · 폭격 예고 중 폭탄창이나 엔진을 파괴하세요');}
  else if(b.suppressed){const boss=[...g.stageBoss.stages.encounter.bodies.values()][0];for(const id of ['light','gun']){const p=boss.parts.get(id);if(p)p.hp*=Math.max(.55,1-b.suppressed*.12);}}}
 if(e.type==='city-bomb-warning')b.warnings.push({...e,bodyId:e.bossId});
 if(e.type==='city-bomb-abort')b.warnings=b.warnings.filter(w=>w.runId!==e.runId);
 if(e.type==='city-bomb'){b.warnings=b.warnings.filter(w=>w.runId!==e.runId);b.bombs.push({...e,left:e.seconds});}}
function spawnWave(g,b){const a=Number.isFinite(g.a)?g.a:-Math.PI/2,hx=Math.cos(a),hy=Math.sin(a),nx=-hy,ny=hx;
 if(g.enemies.filter(e=>e.londonOwned&&!e.londonInstallation&&e.hp>0).length<4)for(let i=0;i<2;i++){const e=g.spawnEnemy(b.role==='defend'?'bomber':'hunter');if(!e)break;
  Object.assign(e,{londonOwned:true,x:g.x+hx*480+nx*(i?65:-65),y:g.y+hy*480+ny*(i?65:-65),a:a+Math.PI,escortPlane:b.role==='defend'?'gotha_night':'camel',ace:false});b.tracked.push(e);}
 if(b.role==='attack'&&g.enemies.filter(e=>e.londonInstallation&&e.hp>0).length<3)for(const [id,offset,sprite] of [['light',-95,'fx-city-searchlight'],['gun',95,'fx-city-aagun']]){const e=g.spawnEnemy('bomber');if(!e)break;const hp=Math.round((id==='light'?115:140)*(1+g.t/600));
  Object.assign(e,{type:'installation',londonOwned:true,londonInstallation:id,facSprite:sprite,facSize:74,x:g.x+hx*520+nx*offset,y:g.y+hy*520+ny*offset,a:0,speed:0,stationary:true,surface:true,hitRadius:30,hp,maxHp:hp,fire:Infinity,ace:false,escortPlane:undefined,hazardRegion:11,scanA:a+Math.PI,lockT:0,fireT:1.6});b.tracked.push(e);}
 b.tracked=b.tracked.filter(e=>!e.londonCounted&&!e.expired).slice(-24);b.waves++;g.event('wave',b.role==='attack'?'런던 방공 순찰 · 탐조등 제압으로 포대의 조준 차단':'고타 선발대 접근 · 폭격기를 먼저 요격하세요');}
export function tickLondonBattle(g,dt){const b=ensureLondonBattle(g);if(!b||g.state!=='playing'||dt<=0)return;b.elapsed+=dt;
 for(const e of b.tracked)if(e.hp<=0&&!e.expired&&!e.londonCounted){e.londonCounted=true;if(e.londonInstallation)b.suppressed++;else if(e.type==='bomber')b.intercepted++;}
 const phase=g.stageBoss?.stages.phase;if(phase==='explore'&&(b.waveClock-=dt)<=0){b.waveClock=18;spawnWave(g,b);}
 for(const k of ['fieldUnitTimer','regionThreat','flakTimer'])if(g[k]!==Infinity)g[k]=Math.max(g[k]||0,dt+.1)+dt;
 for(const k of ['nextHeavyAt','_zeppelinSchedule'])if(g[k]!==Infinity)g[k]=Math.max(g[k]||0,g.t+dt+.1)+dt;
 for(const e of g.enemies.filter(e=>e.londonInstallation==='light'&&e.hp>0)){e.scanA+=dt*.38;e.lockT=Math.max(0,e.lockT-dt*.5);for(const p of live(g)){const a=Math.atan2(p.y-e.y,p.x-e.x),d=Math.atan2(Math.sin(a-e.scanA),Math.cos(a-e.scanA));if(Math.abs(d)<.17&&Math.hypot(p.x-e.x,p.y-e.y)<570&&(p.cloudConceal||0)<.9){e.lockT+=dt*(londonRiverCover(p.x,p.y)?.7:1.5);if(e.lockT>1)p.londonLitUntil=g.t+1.2;}}}
 for(const e of g.enemies.filter(e=>e.londonInstallation==='gun'&&e.hp>0)){const p=live(g).find(p=>(p.londonLitUntil||0)>g.t);e.fireT-=dt;if(p&&e.fireT<=0&&Math.hypot(p.x-e.x,p.y-e.y)<720){e.fireT=1.8;const a=Math.atan2(p.y-e.y,p.x-e.x);for(let i=-1;i<=1;i++){const h=a+i*.12;g.bullets.push({x:e.x,y:e.y,vx:Math.cos(h)*235,vy:Math.sin(h)*235,life:3.5,enemy:true,hazardRegion:11,visualType:'flak',damage:12});}}}
 const encounter=g.stageBoss?.stages.encounter;b.warnings=b.warnings.filter(w=>{const q=encounter?.bodies.get(w.bodyId);return q&&!q.dead&&q.runTarget&&q.runId===w.runId;});
 for(const bomb of b.bombs){bomb.left-=dt;if(bomb.left>0||bomb.resolved)continue;bomb.resolved=true;const d=b.districts.find(d=>d.id===bomb.targetId);if(d&&d.hp>0){d.hp=Math.max(0,d.hp-bomb.damage);g.event('wave',d.name+' 피격 · 폭탄창을 제압하세요');}}b.bombs=b.bombs.filter(q=>!q.resolved);
 if(b.role==='defend'&&b.districts.length&&b.districts.every(d=>d.hp<=0)&&!b.cleared){g.state='lost';g.score=g.kills*100+Math.floor(g.t)*10;g.event('end','런던 방어 실패 · 도시 구역 모두 파괴');return;}
 if(b.role==='defend'&&phase==='boss'&&!g.stageBoss.defeatSequence&&(b.supportClock-=dt)<=0){b.supportClock=6;const q=[...encounter.bodies.values()].find(p=>!p.dead);if(q)for(const d of b.districts.filter(d=>d.hp>0)){const a=Math.atan2(q.y-d.y,q.x-d.x);g.bullets.push({x:d.x,y:d.y,vx:Math.cos(a)*330,vy:Math.sin(a)*330,life:2.2,damage:8,enemy:false,londonFriendly:true});}}}
export function londonStatus(g,locale='ko'){const b=g.londonBattle;if(!b)return '';const en=locale==='en';if(b.role==='attack')return (en?'ATTACK · batteries suppressed ':'공격 작전 · 제압한 포대 ')+b.suppressed+(londonRiverCover(g.x,g.y)?(en?' · dark river approach':' · 강변 암흑 접근'):'');
 if(!b.districts.length)return (en?'DEFEND · Gothas intercepted ':'방어 작전 · 고타 요격 ')+b.intercepted;
 const city=b.districts.map(d=>Math.ceil(d.hp/d.maxHp*100)+'%').join(' / '),q=b.warnings.map(w=>g.stageBoss?.stages.encounter?.bodies.get(w.bodyId)).filter(Boolean).sort((a,b)=>a.runRemaining-b.runRemaining)[0];return (en?'CITY ':'도시 ')+city+(q?(en?' · DROP ':' · 투하 ')+Math.max(0,q.runRemaining/(q.engines()===1?.55:1)).toFixed(1)+'s':'');}
export function installLondonBattle(Game){const P=Game.prototype,spawn=P.spawnEnemy,comp=P.spawnComposition,flak=P.spawnFlak,fire=P.fireEnemy;
 P.spawnComposition=function(){if(!inLondon(this))return comp.call(this);const r=this.rng(),attack=(this.teamFaction||this.stageBoss?.stages.teamFaction)==='central';return attack?(r<.58?'scout':'hunter'):(r<.45?'bomber':r<.65?'scout':'hunter');};
 P.spawnEnemy=function(type){if(!inLondon(this))return spawn.call(this,type);if(inLondon(this)&&type==='boss'&&!this.bossMechanicSpawn&&!this._escortSummon)return null;const n=this.enemies.length,result=spawn.call(this,type),e=result||(this.enemies.length>n?this.enemies.at(-1):null);if(e&&inLondon(this)&&!this.bossMechanicSpawn&&!this._escortSummon&&type==='bomber')e.escortPlane=(this.teamFaction||this.stageBoss?.stages.teamFaction)==='central'?'be2c':'gotha_night';return result||e;};
 P.spawnFlak=function(){if(inLondon(this))return;return flak.call(this);};P.fireEnemy=function(e){if(e.londonInstallation){e.fire=Infinity;return;}return fire.call(this,e);};}

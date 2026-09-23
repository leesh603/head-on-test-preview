// Stationary firing-range diagnostics, not a win-rate or human playtest.
// Real Game.update, projectile movement/collision and damage are used. Only
// movement/spawns/hostile attacks are disabled to make paired trials repeatable.
import {Game,PILOTS,PILOT_PLANES,pilotLoadout} from '../dist/engine.js';
const seconds=8,dt=.02;
function trial(pilot,plane,scene,active){
 const g=new Game(plane,pilot,()=>.5);
 for(const k of ['spawn','nextBossAt','_zeppelinSchedule','nextHeavyAt','eventTimer','allyTimer','flakTimer','regionThreat','gustTimer','supplyTimer','fieldUnitTimer','gasTimer','patrolTimer'])g[k]=Infinity;
 g._supplyTuned=true;g.speed=g.baseSpeed=0;g.invuln=Infinity;g.viewWidth=800;g.viewHeight=600;g.a=-Math.PI/2;
 const points=scene==='front'?Array.from({length:9},(_,i)=>[(i%3-1)*65,-140-Math.floor(i/3)*85]):scene==='rear'?Array.from({length:9},(_,i)=>[(i%3-1)*65,140+Math.floor(i/3)*85]):Array.from({length:12},(_,i)=>[Math.cos(i*Math.PI/6)*220,Math.sin(i*Math.PI/6)*220]);
 for(const [x,y] of points){g.spawnEnemy('scout');Object.assign(g.enemies.at(-1),{x,y,speed:0,stationary:true,fire:Infinity,hp:1e6,maxHp:1e6});}
 if(active)g.skill();
 for(let i=0;i<seconds/dt;i++){g.update(dt);g.events=[];}
 return Math.round(g.enemies.reduce((sum,e)=>sum+1e6-e.hp,0)*100)/100;
}
const rows=[];
for(const [pilot,p] of Object.entries(PILOTS))for(const plane of pilot==='baron'?['fokker','baron_albatros']:[({voss:'fokker',...PILOT_PLANES}[pilot]).replace('fokker_red','fokker').replace('fokker_voss','fokker')]){
 const g=new Game(plane,pilot,()=>.5),row={pilot,plane,name:p.name,cooldown:g.skillCooldown(),duration:g.skillDuration(),description:pilotLoadout(pilot,plane).desc,scenes:{}};
 for(const scene of ['front','ring','rear']){const base=trial(pilot,plane,scene,false),active=trial(pilot,plane,scene,true);row.scenes[scene]={base,active,delta:Math.round((active-base)*100)/100};}
 rows.push(row);
}
console.log(JSON.stringify({method:'8s stationary actual-collision paired trials; no enemy fire, player movement or upgrades. Defensive value, charge movement, target AI and survival excluded. Never treat as a tier list.',rows},null,2));

// Read-only bridge. Never advances a timer, consumes an event, or changes combat.
export const MUSIC_REGIONS=Object.freeze(['rural','sea','trenches','trenches-hell','city','sky','alps','zeebrugge','cambrai','arras','somme','london','verdun','maan','gallipoli','paris-night','jutland']);
export const CAMPAIGN_MUSIC=Object.freeze({
 'A-01':'rural','A-02':'trenches','A-03':'verdun','A-04':'somme','A-05':'arras','A-06':'trenches-hell','A-07':'cambrai','A-08':'spring-offensive','A-09':'somme','A-10':'picardy',
 'C-01':'rural','C-02':'trenches','C-03':'somme','C-04':'arras','C-05':'rural','C-06':'cambrai','C-07':'isonzo','C-08':'spring-offensive','C-09':'trenches','C-10':'argonne'
});
const pressure={HEAD_ON_PASS:.72,CROSS_ATTACK:.8,PINCER:.82,CHASE:.64,ESCORT:.48,BOMBER_RUN:.78,ELITE_FORMATION:.85,ACE_PRESSURE:.7};
const terminal={
 'paris-gun':['locomotive','derailed'],lincomparable:['locomotive','derailed'],fliegerzug:['locomotive','derailed'],
 'mark-v-cruiser':['final-assault'],'minenwerfer-battery':['final-assault'],'armored-harbor-fortress':['final-core'],
 'paris-searchlight-fortress':['last-stand'],'paris-staaken-rvi':['gliding'],'gotha-squadron':['gliding']
};
const alive=e=>e&&e.hp>0&&!e.dead&&!e.expired&&!e.rivalEscaped&&!e.aceRetreat;
const ratio=(value,total)=>total>0?Math.max(0,Math.min(1,value/total)):1;
export function musicContextForGame(game){
 const theme=CAMPAIGN_MUSIC[game?.stage?.id]||MUSIC_REGIONS[game?.worldRegion?.()]||'rural';
 if(!game||game.state!=='playing')return {theme,state:'IDLE',intensity:0,run:game};
 const base={theme,state:'CALM',intensity:.2,run:game,parts:1,engines:1,urgency:0,locked:false};
 const stages=game.stageBoss?.stages,encounter=stages?.encounter;
 if(stages?.phase==='boss'&&encounter&&!encounter.completed){
  const snapshot=encounter.snapshot(),bodies=[...encounter.bodies.values()].filter(alive);
  if(bodies.length){
   const bossId=stages.bossId||snapshot.bossId,hp=ratio(snapshot.hp,snapshot.maxHp);
   // A multi-body formation is final only after all remaining bodies are in their
   // last stand, or its aggregate health has crossed the threshold.
   const final=hp<=.25||bodies.every(b=>b.lastStand===true||(terminal[bossId]||[]).includes(b.phase));
   let engines=0,totalEngines=0,urgency=0,locked=false,pulse=null,phase=bodies[0].phase;
   const cars={};
   for(const b of bodies){
    for(const p of b.parts?.values()||[]){
     if(p.kind==='engine'||p.id.startsWith('engine')){totalEngines++;if(!p.destroyed&&p.hp>0)engines++;}
     if(p.kind==='rail-car')cars[p.id]=!p.destroyed&&p.hp>0;
    }
    if(b.runTarget){const seconds=(b.runRemaining||0)/(typeof b.speedRatio==='function'?b.speedRatio():b.engines?.()===1?.55:1);urgency=Math.max(urgency,1-Math.min(1,seconds/24));}
    locked||=[...(b.locks?.values()||[])].some(v=>v.remaining>0)||[...(b.illumination?.values()||[])].some(v=>v>=.55);
    if(b.rhythmBeat>0&&b.phase==='scan')pulse=`${b.id}:${b.rhythmCycle}:${b.rhythmBeat}`;
   }
   return {...base,state:final?'BOSS_FINAL':'BOSS',bossId,encounterId:snapshot.id,hp,
    parts:ratio(snapshot.aliveParts,snapshot.totalParts),formation:ratio(snapshot.formationAlive,snapshot.formationTotal),
    engines:ratio(engines,totalEngines),cars,urgency,locked,pulse,phase,
    intensity:Math.min(1,.5+(1-hp)*.2+urgency*.2+(locked?.2:0))};
  }
 }
 const enemies=(game.enemies||[]).filter(alive);
 const ace=enemies.find(e=>e.bossPilot)||enemies.find(e=>e.type==='boss');
 if(ace)return {...base,state:'ACE',aceId:ace.bossPilot||null,ace,pressure:enemies.length,
  intensity:Math.min(.95,.6+enemies.length*.022+(ace.rivalPhase==='FINAL_DUEL'?.15:0))};
 const director=game.battleDirector,pattern=director?.pattern;
 const active=pattern&&(game.t||0)<director.endsAt;
 const near=enemies.filter(e=>!e.surface&&!e.stationary&&Math.hypot((e.x||0)-(game.x||0),(e.y||0)-(game.y||0))<700).length;
 if(active&&pattern==='RECOVERY')return {...base,pattern,intensity:.12};
 // Even one close opponent should open the combat groove; do not require a
 // crowd before the music acknowledges a dogfight. Bullet density, low health
 // and live battlefield events add to the pressure the same way.
 const x=game.x||0,y=game.y||0;let threat=0,fire=0;
 for(const b of game.bullets||[])if(b.enemy&&Math.hypot(b.x-x,b.y-y)<300)fire++;
 threat+=Math.min(.22,fire*.05);
 const hpFrac=game.players?.length?Math.min(1,...game.players.filter(p=>p.hp>0).map(p=>p.hp/(p.maxHp||1)),1):game.hp/(game.maxHp||game.hp||1);
 threat+=(1-Math.max(0,Math.min(1,hpFrac)))*.34;
 if(game.battlefieldEvents?.current)threat+=.14;
 const intensity=active?pressure[pattern]||.5:Math.min(.95,(near?Math.min(.78,.38+near*.065):.2)+threat);
 return {...base,state:active||near>0?'COMBAT':'CALM',pattern:active?pattern:null,intensity};
}

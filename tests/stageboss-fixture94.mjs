import {StageBossAddon} from '../headon-stageboss-runtime.js?v=city20261001';
// Test numbers only. Production MUST supply current already-scaled boss stats.
export function fixture(options={}) {
  const log={damage:[],status:[],barrier:[],minions:[],buildings:[],cues:[],clears:[],stages:[],cleanup:[]};
  const frame={paused:false,players:[{id:'existing-a',alive:true,x:300,y:380,radius:10},{id:'existing-b',alive:true,x:450,y:380,radius:10}],bounds:{left:0,right:800,top:0,bottom:600}};
  const hooks={
    getTuning:()=>({maxHp:1000,partHp:100,damage:12,bulletSpeed:160}),
    onDamage:(...a)=>log.damage.push(a),onStatus:(...a)=>log.status.push(a),onBarrierContact:(...a)=>log.barrier.push(a),
    spawnMinion:spec=>{log.minions.push(spec);return true;},countMinions:id=>log.minions.filter(m=>m.encounterId===id).length,
    onBuildingImpact:event=>{log.buildings.push(event);return true;},onCue:event=>log.cues.push(event),
    onEncounterCleared:event=>log.clears.push(event),onStageChange:event=>log.stages.push(event),clearEncounterOwned:id=>log.cleanup.push(id)
  };
  const addon=new StageBossAddon({runId:'fixture',teamFaction:'entente',hooks,rng:()=>.5,...options});
  return {addon,frame,log,hooks};
}
export function step(f,seconds,{advance=false}={}) {
  for(let i=0;i<Math.ceil(seconds/.05);i++){f.addon.tick(.05,f.frame);f.addon.reconcile({blocked:!advance||f.frame.paused});}
}
export function demo() {
  const f=fixture({teamFaction:'central',stageIndex:1});
  const e=f.addon.startBoss({x:400,y:180});
  f.addon.hit({bodyId:[...e.bodies.keys()][0],partId:'seam',damage:600});
  step(f,2.8); // the split is staged: seam warning, then the hull physically separates
  const halves=[...e.bodies.values()];
  f.addon.hit({bodyId:halves[0].id,damage:999});f.addon.reconcile({blocked:false});const afterFirst=f.addon.stages.stage;
  f.addon.hit({bodyId:halves[1].id,damage:999});f.addon.reconcile({blocked:true});const whileLeveling=f.addon.stages.stage;
  step(f,4.5); // the sinking-class destruction pulses must finish before the clear banks
  f.addon.reconcile({blocked:false});
  return {afterFirst,whileLeveling,afterBoth:f.addon.stages.stage,clears:f.log.clears.length,stageChanges:f.log.stages.length};
}
if(process.argv[1]?.endsWith('/examples/headless.js'))console.log(JSON.stringify(demo(),null,2));

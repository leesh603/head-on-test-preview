import {BOSS_CATALOG,STAGES,createBossEncounter} from './headon-stageboss-patterns.js?v=307&b=307';
import {BossHazards} from './headon-stageboss-hazards.js?v=307&b=307';

export class BossStages {
  constructor({teamFaction,stageIndex=0,loopIndex=0,rng=Math.random}) {
    if(!['central','entente'].includes(teamFaction)||!Number.isInteger(stageIndex)||stageIndex<0||stageIndex>=STAGES.length||!Number.isInteger(loopIndex)||loopIndex<0)throw new Error('Invalid current stage/faction');
    Object.assign(this,{teamFaction,stageIndex,loopIndex,rng});this.order=[0,1,7,2,3,5,6,4];this.orderPosition=this.order.indexOf(stageIndex);this.phase='explore';this.encounter=null;
  }
  get stage(){return STAGES[this.stageIndex];}
  get bossId(){return Object.keys(BOSS_CATALOG).find(id=>BOSS_CATALOG[id].stage===this.stageIndex&&(BOSS_CATALOG[id].faction==='neutral'||BOSS_CATALOG[id].faction!==this.teamFaction));}
  attach(encounter) {
    if(this.phase!=='explore')return false;
    if(encounter.bossId!==this.bossId)throw new Error('Wrong stage/faction boss');
    this.encounter=encounter;this.phase='boss';return true;
  }
  poll() {if(this.phase==='boss'&&this.encounter.completed){this.phase='clear-pending';return true;}return false;}
  advance(blocked=false) {
    if(blocked||this.phase!=='clear-pending'||!this.encounter.completed)return null;
    const id=this.encounter.id;this.orderPosition=this.order.indexOf(this.stageIndex)+1;
    if(this.orderPosition>=this.order.length){this.loopIndex++;this.orderPosition=0;const previous=this.stageIndex;this.order=STAGES.map((_,i)=>i);for(let i=this.order.length-1;i>0;i--){const j=Math.floor(this.rng()*(i+1));[this.order[i],this.order[j]]=[this.order[j],this.order[i]]}if(this.order[0]===previous)[this.order[0],this.order[1]]=[this.order[1],this.order[0]];}
    this.stageIndex=this.order[this.orderPosition];
    this.phase='explore';this.encounter=null;
    return{completedId:id,stage:this.stage,stageIndex:this.stageIndex,loopIndex:this.loopIndex};
  }
}
// Wrap the EXISTING normal spawn calculation. No player-count or difficulty multipliers here.
export function normalSpawnInterval(currentInterval,{bossPresent,factor=.55,alreadyReduced=false}) {
  if(!Number.isFinite(currentInterval)||currentInterval<=0||!Number.isFinite(factor)||factor<=0||factor>1)throw new Error('Invalid normal spawn policy');
  return bossPresent&&!alreadyReduced?currentInterval/factor:currentInterval;
}

export class StageBossAddon {
  constructor({runId,teamFaction,stageIndex=0,loopIndex=0,hooks,rng=Math.random,capacity=512,minionCap=12}) {
    for(const key of ['getTuning','onDamage','onStatus','onBarrierContact','spawnMinion','countMinions','onBuildingImpact','onCue','onEncounterCleared','onStageChange','clearEncounterOwned']) {
      if(typeof hooks?.[key]!=='function')throw new Error('Required host adapter: '+key);
    }
    if(!runId||!Number.isInteger(minionCap)||minionCap<0)throw new Error('Run ID and bounded minion budget required');
    Object.assign(this,{runId,hooks,rng,minionCap});this.serial=0;this.time=0;this.frameContext=null;this.defeatSequence=null;this.bodyDefeats=[];
    this.stages=new BossStages({teamFaction,stageIndex,loopIndex,rng});
    this.hazards=new BossHazards({capacity,onDamage:hooks.onDamage,onStatus:hooks.onStatus,onBarrierContact:hooks.onBarrierContact,
      onActivate:h=>hooks.onCue({type:'hazard-activated',encounterId:h.encounterId,bossId:h.bossId,kind:h.kind,visual:h.visual,x:h.x,y:h.y,radius:h.radius})});
    this.metrics={minionsDenied:0};this.ended=false;
  }
  startBoss({x,y}) {
    if(this.ended||this.stages.phase!=='explore')return null;
    if(!Number.isFinite(x)||!Number.isFinite(y))throw new Error('Current world spawn point required');
    const bossId=this.stages.bossId,id=this.runId+':stageboss:'+this.serial++;
    // Host returns CURRENT loop/player-count-scaled stats. This module adds no scaling.
    let tuning=this.hooks.getTuning({bossId,stageIndex:this.stages.stageIndex,loopIndex:this.stages.loopIndex});
    if(bossId==='ca4'||bossId==='gik')tuning={...tuning,geometryScale:1.45,motionMultiplier:0,mobileBoss:false};
    if(bossId==='livens-flame-projector'||bossId==='minenwerfer-battery')tuning={...tuning,geometryScale:1,motionMultiplier:0,mobileBoss:false};
    const entry=BOSS_CATALOG[bossId],faction=entry.faction==='neutral'?(this.stages.teamFaction==='central'?'entente':'central'):entry.faction;
    const encounter=createBossEncounter({id,bossId,tuning,x,y,rng:this.rng,faction,emit:event=>this.accept(event,id,tuning)});
    for(const b of encounter.bodies.values())if(b.support129)b.countMinions129=()=>this.hooks.countMinions(id);this.defeatSequence=null;this.bodyDefeats=[];this.stages.attach(encounter);this.hooks.onCue({type:'boss-enter',encounterId:id,bossId});return encounter;
  }
  accept(event,encounterId,tuning) {
    if(this.ended)return;
    if(event.type==='support-damage'){this.hooks.onDamage(event.playerId,event.damage,event.source);return;}if(event.type==='support-cleanup'){this.hooks.clearEncounterOwned(encounterId);return;}
    if(event.type==='hazard')this.hazards.spawn({...event,encounterId});
    else if(event.type==='cancel-hazards')this.hazards.clearTagged(encounterId,event.tag);
    else if(event.type==='status')this.hooks.onStatus(event.playerId,{...event.status,encounterId,sourceId:encounterId+':'+event.status.type});
    else if(event.type==='spawn-minion') {
      if(this.hooks.countMinions(encounterId)>=this.minionCap){this.metrics.minionsDenied++;return;}
      this.hooks.spawnMinion({...event,encounterId,id:this.runId+':boss-minion:'+this.serial++});
    }else if(event.type==='body-defeated') {
      const body=this.stages.encounter?.bodies.get(event.bossId),zubianHalf=body?.kind?.startsWith('hms-zubian-');
      if(zubianHalf&&!this.bodyDefeats.some(d=>d.id===body.id))this.bodyDefeats.push({id:body.id,kind:body.kind,x:body.x,y:body.y,age:0,duration:1.35});
      this.hooks.onCue({...event,encounterId,x:body?.x,y:body?.y,kind:body?.kind});
    }else if(event.type==='building-impact') {
      if(!this.frameContext||!this.hooks.onBuildingImpact({...event,encounterId}))return;
      const b=this.frameContext.bounds,x=Math.max(b.left+20,Math.min(b.right-20,event.x));
      for(let i=0;i<6;i++)this.hazards.spawn({kind:'projectile',encounterId,bossId:event.bossId,x:Math.max(b.left+8,Math.min(b.right-8,x+(this.rng()-.5)*140)),
        y:b.top-20-i*25,vx:0,vy:tuning.bulletSpeed*.75,radius:10,damage:tuning.damage,warning:.65,duration:8,visual:'building-debris'});
    }else this.hooks.onCue({...event,encounterId});
  }
  hit({bodyId,partId=null,damage,faction}) {
    if(this.ended)return{damage:0,blocked:true};
    const body=this.stages.encounter?.bodies.get(bodyId);
    if(!body||(faction&&faction===body.faction))return{damage:0,blocked:true};
    return body.hit({partId,damage});
  }
  hitAt({x,y,radius=0,damage,faction}) {
    for(const body of this.stages.encounter?.bodies.values()||[]) {
      if(body.dead)continue;const hit=body.locateHit({x,y,radius});
      if(hit)return this.hit({bodyId:body.id,...hit,damage,faction});
    }return{damage:0,miss:true};
  }
  tick(dt,frame) {
    if(this.ended||frame.paused)return false;
    if(!Number.isFinite(dt)||dt<0)throw new Error('Invalid boss step');
    dt=Math.min(.05,dt);if(!dt)return false;
    this.time+=dt;this.frameContext=frame;for(const d of this.bodyDefeats)d.age+=dt;this.bodyDefeats=this.bodyDefeats.filter(d=>d.age<d.duration);
    const encounter=this.stages.encounter;
    // Resolve destruction before any lingering delayed attack can fire.
    this.reconcile({blocked:true});
    if(this.defeatSequence)this.updateDefeat(dt);
    else if(encounter&&!encounter.completed)encounter.update(dt,{...frame,isIlluminated:p=>this.hazards.isIlluminated(p)});
    this.hazards.update(dt,frame);
    return true;
  }
  beginDefeat(encounter) {
    const bodies=[...encounter.bodies.values()].map(b=>({id:b.id,kind:b.kind,x:b.x,y:b.y}));
    this.defeatSequence={encounterId:encounter.id,bossId:encounter.bossId,age:0,duration:2.65,pulse:0,bodies};
    this.hazards.clear(encounter.id);this.hooks.clearEncounterOwned(encounter.id);
    this.hooks.onCue({type:'boss-destruction-start',encounterId:encounter.id,bossId:encounter.bossId,bodies});
  }
  updateDefeat(dt) {
    const d=this.defeatSequence;if(!d)return;d.age=Math.min(d.duration,d.age+dt);
    const schedule=[0,.22,.48,.78,1.12,1.5,1.9,2.28,2.58];
    while(d.pulse<schedule.length&&d.age>=schedule[d.pulse]){
      const i=d.pulse++,body=d.bodies[i%d.bodies.length],airship=/zeppelin|hma23/.test(body.kind);
      const spanX=airship?170:body.kind.includes('zubian')||body.kind==='sms-stuttgart'?90:72;
      const spanY=airship?42:body.kind.includes('zubian')||body.kind==='sms-stuttgart'?120:105;
      const final=i===schedule.length-1;
      this.hooks.onCue({type:'boss-destruction-pulse',encounterId:d.encounterId,bossId:d.bossId,
        x:body.x+(this.rng()-.5)*spanX*2,y:body.y+(this.rng()-.5)*spanY*2,radius:final?130:48+(i%3)*14,final});
    }
  }
  reconcile({blocked}={}) {
    if(this.ended)return null;
    if(typeof blocked!=='boolean')throw new Error('Pass current pause/upgrade/game-over block state');
    const encounter=this.stages.encounter;
    if(encounter?.completed&&this.stages.phase==='boss'&&!this.defeatSequence)this.beginDefeat(encounter);
    if(this.defeatSequence&&this.defeatSequence.age<this.defeatSequence.duration)return null;
    if(this.stages.poll()) {
      this.hooks.onEncounterCleared({id:encounter.id,bossId:encounter.bossId});
      this.defeatSequence=null;
    }
    const transition=this.stages.advance(blocked);
    if(transition)this.hooks.onStageChange(transition);return transition;
  }
  // Called on host game-over/restart; it does not restart players or submit scores.
  dispose() {
    if(this.ended)return;this.ended=true;
    const encounter=this.stages.encounter;if(encounter){for(const b of encounter.bodies.values())b.dispose?.();this.hooks.clearEncounterOwned(encounter.id);}
    this.hazards.pool.clear();this.stages.encounter=null;this.frameContext=null;
    this.defeatSequence=null;this.bodyDefeats=[];
  }
}

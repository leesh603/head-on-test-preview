// Shared situation selection rules. No audio or combat writes.
// Pass the local player's HP explicitly. musicContext.hp is BOSS HP, not player HP.
export class SituationPolicy {
  constructor(){this.reset();}
  reset(){
    this.critical=false;this.lastStand=false;this.exitCriticalAt=null;
    this.exitLastAt=null;this.recoveryUntil=-Infinity;this.lastDanger=-Infinity;
    this.barrage=false;this.fireSince=null;this.clearSince=null;
    this.runId=undefined;this.time=-Infinity;
  }
  update(frame){
    const now=Number.isFinite(frame.now)?frame.now:0;
    if((frame.runId!==undefined&&this.runId!==undefined&&frame.runId!==this.runId)||now<this.time)this.reset();
    if(frame.runId!==undefined)this.runId=frame.runId;
    this.time=now;
    if(frame.alive===false||(Number.isFinite(frame.playerHp)&&frame.playerHp<=0)){
      this.reset();return {loop:null,stingers:[],state:'OFF',crossfade:0.15};
    }
    if(frame.playing===false)return {loop:null,stingers:[],state:'PAUSED',crossfade:0.15};
    const valid=Number.isFinite(frame.playerHp)&&Number.isFinite(frame.playerMaxHp)&&frame.playerMaxHp>0;
    const hp=valid?Math.max(0,Math.min(1,frame.playerHp/frame.playerMaxHp)):null;
    const stingers=[];
    if(valid){
      if(!this.critical&&hp<=.20){
        this.critical=true;this.exitCriticalAt=null;
        if(now-this.lastDanger>=8){stingers.push('danger-entry');this.lastDanger=now;}
      }
      if(this.critical){
        if(hp>=.28){
          this.exitCriticalAt??=now;
          if(now-this.exitCriticalAt>=2){
            this.critical=false;this.lastStand=false;this.exitLastAt=null;
            this.exitCriticalAt=null;this.recoveryUntil=now+4;stingers.push('recovery-turn');
          }
        }else this.exitCriticalAt=null;
      }
      if(this.critical&&hp<=.10){this.lastStand=true;this.exitLastAt=null;}
      if(this.lastStand){
        if(hp>=.14){this.exitLastAt??=now;if(now-this.exitLastAt>=1){this.lastStand=false;this.exitLastAt=null;}}
        else this.exitLastAt=null;
      }
    }
    if(frame.underFire===true){
      this.clearSince=null;this.fireSince??=now;
      if(now-this.fireSince>=1.5)this.barrage=true;
    }else{
      this.fireSince=null;this.clearSince??=now;
      if(now-this.clearSince>=2.5)this.barrage=false;
    }
    const encounter=['boss','ace'].includes(frame.encounter)?frame.encounter:'flight';
    let loop=null,state='NORMAL';
    if(this.lastStand){loop='last-stand';state='LAST_STAND';}
    else if(this.critical){loop='critical-'+encounter;state='CRITICAL';}
    else if(frame.approach==='boss'||frame.approach==='ace'){loop=frame.approach+'-approach';state='APPROACH';}
    else if(this.barrage){loop='barrage';state='BARRAGE';}
    else if(now<this.recoveryUntil&&encounter==='flight'){loop='recovery';state='RECOVERY';}
    return {loop,stingers,state,crossfade:state==='LAST_STAND'?.45:.9};
  }
}

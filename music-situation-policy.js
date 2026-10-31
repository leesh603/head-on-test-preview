// Shared situation selection rules. No audio or combat writes.
// Pass the local player's HP explicitly. musicContext.hp is BOSS HP, not player HP.
export class SituationPolicy {
  constructor(){this.reset();}
  reset(){
    this.critical=false;this.lastStand=false;this.exitCriticalAt=null;
    this.exitLastAt=null;
    this.barrage=false;this.fireSince=null;this.clearSince=null;
    this.runId=undefined;this.time=-Infinity;
  }
  update(frame){
    const now=Number.isFinite(frame.now)?frame.now:0;
    if((frame.runId!==undefined&&this.runId!==undefined&&frame.runId!==this.runId)||now<this.time)this.reset();
    if(frame.runId!==undefined)this.runId=frame.runId;
    this.time=now;
    if(frame.alive===false||(Number.isFinite(frame.playerHp)&&frame.playerHp<=0)){
      this.reset();return {loop:null,stingers:[],state:'OFF',crossfade:0.15,tempoScale:1};
    }
    if(frame.playing===false)return {loop:null,stingers:[],state:'PAUSED',crossfade:0.15,tempoScale:1};
    const valid=Number.isFinite(frame.playerHp)&&Number.isFinite(frame.playerMaxHp)&&frame.playerMaxHp>0;
    const hp=valid?Math.max(0,Math.min(1,frame.playerHp/frame.playerMaxHp)):null;
    const stingers=[];
    if(valid){
      if(!this.critical&&hp<=.20){
        this.critical=true;this.exitCriticalAt=null;
      }
      if(this.critical){
        if(hp>=.28){
          this.exitCriticalAt??=now;
          if(now-this.exitCriticalAt>=2){
            this.critical=false;this.lastStand=false;this.exitLastAt=null;
            this.exitCriticalAt=null;
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
    // Health changes the current score's pace, never its track or melody.
    let loop=null,state=this.lastStand?'LAST_STAND':this.critical?'CRITICAL':'NORMAL';
    // Once a boss exists, its own score leads from entry through combat.
    // Shared approach/barrage loops must not mask every boss with the same music.
    if(frame.encounter!=='boss'){
      if(frame.approach==='boss'||frame.approach==='ace'){loop=frame.approach+'-approach';state='APPROACH';}
      else if(this.barrage){loop='barrage';state='BARRAGE';}
    }
    return {loop,stingers,state,crossfade:.9,tempoScale:this.lastStand?1.06:this.critical?1.04:1};
  }
}

export const COOP_KEYS=Object.freeze({p1:{left:'KeyA',right:'KeyD',up:'KeyW',down:'KeyS',evade:'Space',skill:'KeyE',reload:'KeyR'},p2:{left:'ArrowLeft',right:'ArrowRight',up:'ArrowUp',down:'ArrowDown',evade:'ShiftRight',skill:'Enter',reload:'Backslash'}});
export class CoopInput {
 constructor(){this.held=new Set();this.blocked=new Set();this.selection=0;this.itemId=null}
 release(code){this.held.delete(code);this.blocked.delete(code)}
 clear(){for(const code of this.held)this.blocked.add(code)}
 reset(){this.held.clear();this.blocked.clear();this.selection=0;this.itemId=null}
 inputs(){const result={};for(const [id,map] of Object.entries(COOP_KEYS)){const on=key=>this.held.has(key)&&!this.blocked.has(key),dx=Number(on(map.right))-Number(on(map.left)),dy=Number(on(map.down))-Number(on(map.up));result[id]={angle:dx||dy?Math.atan2(dy,dx):undefined}}return result}
 keydown(e,game,hooks={}){
  if(e.isComposing||['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName)||e.target?.isContentEditable)return false;
  const used=['Escape',...Object.values(COOP_KEYS).flatMap(Object.values)].includes(e.code);if(!used)return false;e.preventDefault();
  const repeat=e.repeat||this.held.has(e.code);this.held.add(e.code);if(repeat||this.blocked.has(e.code))return true;
  if(game.state==='upgrade'){
   const item=game.activeUpgrade;if(!item)return true;if(this.itemId!==item.id){this.itemId=item.id;this.selection=0}const map=COOP_KEYS[item.playerId];
   if(e.code===map.left||e.code===map.right){this.selection=(this.selection+(e.code===map.left?2:1))%item.choices.length;hooks.highlight?.(this.selection)}
   if(e.code===map.skill){this.clear();hooks.choose?.(item.id,item.choices[this.selection].id)}return true;
  }
  if(e.code==='Escape'){this.clear();hooks.pause?.();return true}if(game.state!=='playing')return true;
  for(const [id,map] of Object.entries(COOP_KEYS))for(const action of ['evade','skill','reload'])if(e.code===map[action])game.action(id,action);return true;
 }
}

export const COOP_RECORD_KEYS=Object.freeze({best:'headon-coop2-best-v3',ranking:'headon-coop2-ranking-v3'});
export function coopRecord(g){return {mode:'coop2',season:'coop2-v3',runId:g.runId,faction:g.teamFaction,players:g.players.map(p=>({name:p.nickname,pilot:p.pilot})),score:g.priorityKills,durationSeconds:Math.floor(g.t)}}
export function saveCoopLocal(storage,record){let rows=[];try{const raw=JSON.parse(storage.getItem(COOP_RECORD_KEYS.ranking)||'[]');if(Array.isArray(raw))rows=raw.filter(r=>r.mode==='coop2'&&r.season==='coop2-v3')}catch{}if(record.score>0&&!rows.some(r=>r.runId===record.runId))rows.push(record);rows.sort((a,b)=>b.score-a.score);rows=rows.slice(0,10);try{storage.setItem(COOP_RECORD_KEYS.ranking,JSON.stringify(rows));storage.setItem(COOP_RECORD_KEYS.best,String(Math.max(Number(storage.getItem(COOP_RECORD_KEYS.best))||0,record.score)))}catch{}return rows}

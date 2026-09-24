import {BOSS_CATALOG} from './headon-stageboss-patterns.js?v=305&b=305';
export function bossHudModel(encounter) {
  if(!encounter||encounter.completed)return null;
  const state=encounter.snapshot();
  return {...state,name:BOSS_CATALOG[encounter.bossId]?.name||encounter.bossId,fraction:Math.max(0,Math.min(1,state.hp/state.maxHp))};
}
// Reuses the main build's existing durability/XP nodes, whether it has one
// shared XP bar or individual XP bars. No new player HUD or level-up logic.
export function bindStageBossHUD({bossSlot,xpBindings=[]}) {
  if(!bossSlot)throw new Error('Existing top HUD slot required');
  const doc=bossSlot.ownerDocument,root=doc.createElement('section'),title=doc.createElement('div');
  const track=doc.createElement('div'),fill=doc.createElement('div');
  root.className='hsb-health';title.className='hsb-title';track.className='hsb-track';fill.className='hsb-fill';
  track.setAttribute('role','progressbar');track.setAttribute('aria-label','보스 내구도');track.setAttribute('aria-valuemin','0');
  track.append(fill);root.append(title,track);bossSlot.append(root);root.hidden=true;
  const restored=xpBindings.map(({durabilityElement,xpElement})=>{
    if(!durabilityElement?.parentNode||!xpElement?.parentNode)throw new Error('Existing HP/XP nodes required');
    const entry={xp:xpElement,parent:xpElement.parentNode,next:xpElement.nextSibling,hadClass:xpElement.classList.contains('hsb-xp')};
    durabilityElement.insertAdjacentElement('afterend',xpElement);xpElement.classList.add('hsb-xp');return entry;
  });
  return {
    render(encounter) {
      const b=bossHudModel(encounter);root.hidden=!b;if(!b)return;
      title.textContent=`${b.name} · ${b.shielded?'본체 보호 · ':''}남은 부위 ${b.aliveParts}/${b.totalParts}`;
      fill.style.width=`${b.fraction*100}%`;track.setAttribute('aria-valuemax',String(b.maxHp));track.setAttribute('aria-valuenow',String(b.hp));
    },
    destroy() {
      root.remove();for(const entry of restored.reverse()) {
        if(!entry.hadClass)entry.xp.classList.remove('hsb-xp');
        entry.parent.insertBefore(entry.xp,entry.next?.parentNode===entry.parent?entry.next:null);
      }
    }
  };
}

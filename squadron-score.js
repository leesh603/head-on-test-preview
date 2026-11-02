/** Original unit themes. Equipment/history are documented separately from game choreography. */
const score=(bpm,key,lead,answer,motif,pulse)=>Object.freeze({bpm,key,lead,answer,motif,pulse});
export const SQUADRON_SCORES=Object.freeze(Object.assign(Object.create(null),{
 cigognes:score(104,38,'horn','bassoon',[0,7,3,2,0,10,7,2],[0,3,6,8,11,14]),
 'hat-ring':score(116,40,'trumpet','clarinet',[0,3,7,10,7,5,2,3],[0,2,4,7,8,10,12,15]),
 jasta18:score(122,35,'spiccato','horn',[0,1,7,6,3,1,6,2],[0,3,4,6,8,11,12,14]),
 lafayette:score(110,41,'clarinet','horn',[0,5,7,3,10,7,5,2],[0,2,5,8,10,13]),
 jasta5:score(106,36,'bassoon','strings',[0,7,6,2,3,8,7,1],[0,3,6,8,10,14]),
 spa65:score(118,43,'trumpet','spiccato',[0,2,7,5,3,10,8,7],[0,2,3,6,8,10,11,14]),
 sqn56:score(114,38,'horn','clarinet',[0,7,10,7,3,5,2,0],[0,2,5,7,8,10,13,15]),
 jasta2:score(108,33,'trombone','horn',[0,0,7,3,1,6,7,2],[0,3,4,7,8,11,12,15]),
 le_prieur_squadron:score(112,39,'spiccato','trumpet',[0,1,5,7,8,3,7,6],[0,2,6,8,10,14]),
 schlachtstaffel:score(100,31,'bassoon','trombone',[0,3,1,0,6,7,3,1],[0,3,4,8,11,12]),
 junkers_squadron:score(96,30,'trombone','cello',[0,1,0,6,3,1,7,6],[0,4,6,8,12,14]),
 salamander_squadron:score(102,34,'horn','spiccato',[0,3,6,7,1,0,7,3],[0,2,4,7,8,10,12,15])
}));
const living=e=>e&&e.hp>0&&e.alive!==false&&!e.dead&&!e.crashing&&!e.expired;
const unit=e=>e.cigognesGroup!=null?'cigognes':e.hatRingGroup!=null?'hat-ring':e.famousWingUnit||e.expansionWingUnit||e.legendWingUnit||e.eliteKind;
const group=e=>e.cigognesGroup??e.hatRingGroup??e.famousWingGroup??e.expansionWingGroup??e.legendWingGroup??e.squadronId;
/** Read the same replicated aircraft used to render host/guest encounters; never run a director. */
export function squadronMusicForGame(g){
 const native=g.online&&!g.host?g.legacySquadronVisual:g.eliteEnemies;
 const aircraft=[...(g.enemies||[]),...(native?.members||[])].filter(living);
 const owner=g.squadronDirector?.owner,first=aircraft.find(e=>SQUADRON_SCORES[unit(e)]&&(!owner?.token||unit(e)===owner.unitId));
 const shots=[...(g.bullets||[]),...(native?.projectiles||[])];
 const tail=!first&&shots.find(e=>e.life>0&&SQUADRON_SCORES[unit(e)]);
 if(!first&&!tail)return null;
 const id=unit(first||tail),a=g.squadronArrival,matching=a?.unitId===id;
 const token=owner?.unitId===id&&owner.token||matching&&a.token||`${id}:${group(first||tail)??'native'}`;
 const members=aircraft.filter(e=>unit(e)===id),exiting=!first||members.every(e=>[e.cigognesPhase,e.hatRingPhase,e.famousWingPhase,e.expansionWingPhase,e.legendWingPhase,e.phase].includes('exit')||e.phase==='departing');
 return {squadronId:id,squadronToken:token,squadronIntro:!!(matching&&a.token===token&&(g.t||0)>=a.startedAt&&(g.t||0)<a.until),
  formation:Math.min(1,members.length/3),intensity:exiting?.3:.78};
}
/** One bounded transport: four-bar melody, answering wing, and a brief entry statement. */
export function squadronScoreStep(m,id,i,t,b){
 const s=SQUADRON_SCORES[id];if(!s)return false;
 const p=i%16,bar=Math.floor(i/16),root=s.key+[0,-3,-5,-1][bar%4],drive=m.scene?.intensity??.78;
 m.scoreRoot=root;
 if(p===0){m.voice('cello',root-12,t,b*13,.11);m.voice('strings',root+7,t,b*11,.035);}
 const slot=s.pulse.indexOf(p);
 if(slot>=0){m.voice('spiccato',root+(slot%2?7:0),t,b*.7,.055+.025*drive);m.voice('cello',root-12,t,b*.6,.045);}
 if(p%2===0){const note=s.motif[(p/2+bar*3)%s.motif.length];m.voice(s.lead,root+12+note,t,b*1.5,.075);}
 if((p===7||p===15)&&(m.scene?.formation??1)>.3)m.voice(s.answer,root+12+s.motif[(bar+4)%8],t,b*2,.055);
 if(p===0||p===8)m.drum(t,false,.75);
 if(p===4||p===12)m.drum(t,true,.4);
 // Consumed only on a new authoritative arrival token, not on resume/reconnect.
 if(m.squadronEntry&&i<8&&p%2===0){m.voice(s.answer,root+24+s.motif[p/2],t,b*1.7,.10);if(p===0)m.drum(t,true,.55);}
 return true;
}

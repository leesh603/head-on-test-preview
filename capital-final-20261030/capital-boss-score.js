// Two original capital scores, scheduled on BattleMusic's existing paused/muted clock.
// Reuse its bounded voices, instrument envelopes and mixer; no extra audio context.
export const CAPITAL_SCORES=Object.freeze({
 kaiserkrone:{bpm:86,ramp:66,roots:[28,28,25,27,24,24,27,23]},
 leviathan:{bpm:112,ramp:48,roots:[33,30,35,32,29,32,28,31]}
});
const march=[0,7,3,1,0,10,7,6,0,3,7,12,10,7,6,1];
const flight=[0,7,12,10,7,3,5,1,0,12,7,15,12,10,6,7];
export function capitalScoreStep(m,id,i,t,b){
 const crown=id==='final-kaiserkrone';if(!crown&&id!=='final-leviathan')return false;
 const score=CAPITAL_SCORES[crown?'kaiserkrone':'leviathan'],p=i%16,bar=Math.floor(i/16),root=score.roots[bar%8]+12;
 const phase=m.scene?.phase==='capital-phase-3'||m.scene?.state==='BOSS_FINAL'?3:m.scene?.phase==='capital-phase-2'?2:1;
 const voices=m.scene?.engines??1,motif=crown?march:flight,section=Math.floor(bar/4)%4;
 m.scoreRoot=root;
 if(p===0){m.voice('cello',root-12,t,b*15,.10);m.voice(crown?'trombone':'horn',root,t,b*7,.072);m.voice('strings',root+7,t,b*15,.036);}
 const pulses=crown?[0,3,4,7,8,11,12,15]:[0,2,3,6,8,10,11,14];
 if(pulses.includes(p)){m.voice('spiccato',root+motif[(bar*3+p)%16],t,b*.9,.075);m.voice('cello',root-12+(p%4?7:0),t,b*.8,.062);}
 if(p===0||p===8||phase===3&&p===12)m.drum(t,false,crown?.85:.70);
 if(p===6||p===14)m.drum(t,true,phase===3?.5:.3);
 if((p===2||p===10)&&section!==2)m.voice(crown?'horn':'trumpet',root+12+motif[(bar+p/2)%16],t,b*(crown?4:2.5),.056);
 if(phase>=2&&p%4===1)m.voice('strings',root+19+motif[(p+bar)%16],t,b*1.6,.025);
 if(phase===3&&(p===7||p===15)){m.voice('trombone',root+6,t,b*1.4,.047);m.voice('bell',root+24,t,b*2,.018);}
 if(voices<.5&&p===4)m.voice('bassoon',root+1,t,b*5,.037);
 return true;
}

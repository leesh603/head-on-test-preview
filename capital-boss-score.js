// Two capital battle themes on the existing bounded music clock.
// Slow brass attacks, octave strings and military percussion replace the light pulse.
export const CAPITAL_SCORES=Object.freeze({
 kaiserkrone:{bpm:128,ramp:38,roots:[38,38,34,34,31,31,33,33]},
 leviathan:{bpm:144,ramp:34,roots:[40,40,36,36,33,33,35,35]}
});
const crownTheme=[7,7,8,7,3,5,7,2,3,3,5,3,2,0,2,7];
const leviathanTheme=[7,12,10,7,8,7,3,5,7,10,12,15,14,10,7,11];
const ostinato=[0,7,12,7,3,7,12,7];
function brass(m,n,t,d,v){
 m.tone(n-.06,t,d,v*.56,'sawtooth',1000,.11);
 m.tone(n+.06,t,d,v*.44,'sawtooth',1250,.13);
}
export function capitalScoreStep(m,id,i,t,b){
 const crown=id==='final-kaiserkrone';if(!crown&&id!=='final-leviathan')return false;
 const score=CAPITAL_SCORES[crown?'kaiserkrone':'leviathan'],p=i%16,bar=Math.floor(i/16),root=score.roots[bar%8];
 const phase=m.scene?.phase==='capital-phase-3'||m.scene?.state==='BOSS_FINAL'?3:m.scene?.phase==='capital-phase-2'?2:1;
 const theme=crown?crownTheme:leviathanTheme,section=Math.floor(bar/8)%3;
 m.scoreRoot=root;
 if(p===0){
  m.voice('cello',root-12,t,b*15.7,.15);
  for(const interval of [0,3,7])m.voice('strings',root+12+interval,t,b*15.5,.032);
  brass(m,root,t,b*6,.075);
 }
 if(p%2===0||phase===3){
  const n=root+ostinato[(p+(crown?0:2))%8];
  m.voice('spiccato',n+12,t,b*.72,.063);
  m.voice('cello',n-12,t,b*.8,.075);
 }
 if(p%4===0){
  const note=theme[(bar%4)*4+p/4],length=b*(section===1?3.6:3.2);
  brass(m,root+12+note,t,length,.095);
  if(phase>=2||section===2)m.voice('strings',root+24+note,t,length,.034);
 }
 if(p===0||p===8){m.drum(t,false,1.2);m.voice('cello',root-12,t,b*2,.1);}
 if(p===4||p===12)m.drum(t,true,.85);
 if(phase>=2&&(p===7||p===15)){m.drum(t,true,.34);m.drum(t+b*.5,true,.44);}
 if(phase===3&&(p===2||p===10))m.drum(t,false,.65);
 if(p===14&&bar%4===3)brass(m,root+11,t,b*1.7,.08);
 return true;
}


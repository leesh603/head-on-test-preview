// One committed 520mm round. No homing hazards or changes to the rail controller.
export function lincomparableRound(target,phase,origin,{blind=false,final=false,stress=0,broken=false}={}){
 const q=final?Math.min(1,Math.max(0,stress)+(broken?.35:0)):0;
 const dx=target.x-origin.x,dy=target.y-origin.y,length=Math.hypot(dx,dy)||1;
 const axis=blind?{x:0,y:-1}:{x:dx/length,y:dy/length};
 const radius=final?175-40*q:phase===2?112:92;
 const wave=final?360-70*q:phase===2?300:245,start=final?radius+45:phase===2?150:92;
 const offset=final?140:phase===2?100:0,smokeRadius=final?100-20*q:phase===2?72:132;
 return{target:{...target},points:[{x:target.x,y:target.y}],mode:final?'last-520':phase===2?'shock-link':'heavy-shell',blind,final,radius,wave,start,
  waveDelay:final?1.05:phase===2?.8:.28,waveWarning:final?.55:phase===2?.45:.55,waveDuration:final?.65:phase===2?.55:.4,
  centerDuration:phase===2||final?.45:.65,smoke:{x:target.x+axis.x*offset,y:target.y+axis.y*offset,radius:smokeRadius},
  smokeDelay:final?2.7:phase===2?1.8:.5,smokeWarning:final||phase===2?.3:.04,smokeDuration:final?3:phase===2?2.6:1.8,stress:q};
}

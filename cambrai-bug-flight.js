// A fixed-course 1918 aerial torpedo. Travel range is consumed exactly once,
// so even a large frame step reaches the endpoint without circling or stalling.
export function advanceCambraiBug(e,dt){
 if(!(dt>0)||e.hp<=0)return false;
 if(!Number.isFinite(e.bugRange)){
  const a=Number.isFinite(e.a)?e.a:-Math.PI/2;
  if(!Number.isFinite(e.bugTargetX)||!Number.isFinite(e.bugTargetY)){e.bugTargetX=e.x+Math.cos(a)*320;e.bugTargetY=e.y+Math.sin(a)*320;}
  e.bugRange=Math.hypot(e.bugTargetX-e.x,e.bugTargetY-e.y);e.bugTravel=0;
  e.a=Math.atan2(e.bugTargetY-e.y,e.bugTargetX-e.x);e.launchHeading=e.a;
 }
 e.bugAge=(e.bugAge||0)+dt;e.launchAge=(e.launchAge||0)+dt;
 const remaining=Math.max(0,e.bugRange-e.bugTravel),step=Math.min(Math.max(1,e.speed||186)*dt,remaining);
 e.x+=Math.cos(e.a)*step;e.y+=Math.sin(e.a)*step;e.bugTravel+=step;
 if(remaining-step>1e-6)return false;
 e.x=e.bugTargetX;e.y=e.bugTargetY;return true;
}

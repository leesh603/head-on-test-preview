// Short painted accents carried by the existing combatFX lane. Cues are emitted
// by successful combat actions; this renderer never creates attacks or damage.
const clamp=n=>Math.max(0,Math.min(1,n));
const wingCues=new Set(['wingReinforcement','wingElite','crossfire','formationBreakthrough','mutualCover']);
export function tacticalCueSound(id){
 if(id==='survivalRepair')return 'heal';
 if(id==='explosiveFocus'||id==='explosiveArea'||id==='fireLink'||id==='diveBombing'||id==='guidedBombing'||id==='blockingBombing')return 'rocket';
 if(id==='emergencyEscape')return 'loaded';
 if(wingCues.has(id))return 'formationPass';
 return null; // Existing shot/material sounds already carry machine-gun rhythm.
}
export function drawTacticalCombatCue(c,f,x,y,paint,world,point=(x,y)=>[x,y]){
 if(f?.fxProfile!=='tactical')return false;
 if(!(f.life>0)||!(f.maxLife>0)||![x,y].every(Number.isFinite))return true;
 const id=f.tacticalCue,owner=(world?.players||[world]).find(p=>p&&(p.id||'p1')===(f.ownerId||'p1'));
 let a=f.a||0;if(id==='survivalRepair'&&owner){if(!(owner.hp>0))return true;[x,y]=point(owner.x,owner.y);a=owner.a||0;}
 const age=f.maxLife-f.life,q=clamp(age/f.maxLife),fade=clamp(f.life/.16),cs=Math.cos(a),sn=Math.sin(a);
 const stamp=(key,forward,side,w,h=w,alpha=1,rotation=a)=>paint(c,key,x+cs*forward-sn*side,y+sn*forward+cs*side,w,h,rotation,alpha*fade);
 if(id==='survivalRepair'){
  // Weld at the engine panels while HP is actually increasing. No shield/ring.
  const side=Math.sin(age*25)>0?1:-1;
  stamp('armorSpark',10,side*8,17,14,(1-q)*.7,a+side*.5);
  if(age>.07)stamp('spark',4,side*11,12,12,(1-q)*.7,a-side*.8);
 }else if(id==='emergencyEscape'){
  stamp('exhaust',-28-q*25,0,45+q*20,17,(1-q)*.28);
 }else if(wingCues.has(id)){
  // The formation itself is the effect. Accent only wingmen that really fired.
  let count=0;for(const wing of world?.allies||[]){if(wing.ownerId!==(f.ownerId||'p1')||wing.carrierHidden||!(wing.muzzleFlash>0))continue;
   const wa=wing.muzzleAngle??wing.a,[wx,wy]=point(wing.x+Math.cos(wa)*23,wing.y+Math.sin(wa)*23);
   paint(c,id==='wingElite'||id==='formationBreakthrough'?'muzzleTwin':'muzzle',wx,wy,id==='mutualCover'?24:30,22,wa,fade*.8);
   if(++count>=(world?.viewWidth<=720?4:6))break;
  }
 }else if(id==='blockingBombing'){
  // Rearward release smoke follows each actual timed drop in the escape chain.
  for(const side of [-1,1])stamp('gunSmoke',-24-q*18,side*(8+q*9),29+q*16,15,(1-q)*.4,a+Math.PI);
 }else if(id==='explosiveArea'){
  for(const side of [-1,1])stamp('gunSmoke',-9-q*12,side*(11+q*14),24+q*14,18,(1-q)*.35,a+(id==='blockingBombing'?Math.PI:0));
 }else if(id==='diveBombing'){
  stamp('gunSmoke',-5-q*12,-12,25+q*14,14,(1-q)*.35,a-.18);
  stamp('gunSmoke',-5-q*12,12,25+q*14,14,(1-q)*.35,a+.18);
 }else if(id==='guidedBombing'){
  stamp('exhaust',10-q*18,0,42+q*20,13,(1-q)*.4);
  if(age<.09)stamp('muzzleHeavy',24,0,26,20,(1-age/.09)*.65);
 }else if(id==='explosiveFocus'||id==='fireLink'){
  stamp('exhaust',7-q*16,0,34+q*28,16,(1-q)*.4);
  if(age<.09)stamp('muzzleHeavy',21,0,30,24,(1-age/.09)*.65);
 }else if(id==='gunSuppression'){
  for(const side of [-1,1]){if(age<.07)stamp('muzzle',23,side*8,23,16,(1-age/.07)*.7,a+side*.12);stamp('gunSmoke',14-q*8,side*9,19+q*12,14,(1-q)*.25);}
 }else if(id==='gunPrecision'){
  if(age<.085)stamp('muzzleTwin',24,0,31,17,(1-age/.085)*.85);
  stamp('gunSmoke',18-q*9,0,19+q*12,12,(1-q)*.28);
 }else if(id==='speedStrike'||id==='highSpeedIntercept'){
  if(age<.095)stamp('muzzleTwin',26,0,id==='highSpeedIntercept'?43:37,17,(1-age/.095)*.9);
  stamp('gunSmoke',15-q*14,0,28+q*18,12,(1-q)*.24);
 }else if(id==='speedDuel'||id==='survivalCounter'||id==='defensiveSuppression'){
  if(age<.09)stamp('muzzleTwin',24,0,id==='speedDuel'?27:35,22,(1-age/.09)*.85);
  stamp('gunSmoke',17-q*11,id==='speedDuel'?8:0,22+q*10,17,(1-q)*.28);
 }
 return true; // Even expired/unknown tactical entries never become explosions.
}

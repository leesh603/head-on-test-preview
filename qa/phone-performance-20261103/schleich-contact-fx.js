// Read the existing accepted hit/interception records. No shield or new rounds.
const clamp=n=>Math.max(0,Math.min(1,n));
export function drawSchleichContact(c,p,e,tex,front){
 if(p.pilot!=='schleich'||!['metalArmor','metalDeflect'].includes(e.kind))return false;
 if(!front||p.state!=='playing'||!(p.hp>0)||p.status==='downed'||!(e.age>=0&&e.age<e.maxLife)||![e.a,p.a].every(Number.isFinite)||e.ownerId!==undefined&&e.ownerId!==(p.id??'p1'))return true;
 const q=clamp(e.age/e.maxLife),fade=(1-q)**1.2,a=e.a-p.a;
 if(e.kind==='metalDeflect'){
  // The combat record already owns the outward deflection heading. Three
  // short sparks leave that point; there is no persistent forward boundary.
  const flash=1-clamp(e.age/.12);
  if(flash>0)tex(c,'spark',0,0,18,16,a,flash,'#fff1cf');
  for(let i=-1;i<=1;i++){
   const heading=a+i*.24,distance=e.age*(125-Math.abs(i)*23);
   const x=Math.cos(heading)*distance,y=Math.sin(heading)*distance;
   if(tex(c,'tracerCore',x,y,10+(1-q)*18,1.4+(!i?.5:0),heading,.96*fade,i?'#e2d0a5':'#fff0c9')===false)
    tex(c,'ricochet',x,y,18,9,heading,.88*fade,'#e2d0a5'); // Existing art when ?fxs=0.
  }
  for(const side of [-1,1]){
   const heading=a+side*.48,distance=e.age*83;
   tex(c,'metalShard1',Math.cos(heading)*distance,Math.sin(heading)*distance,5,2,heading+side*q*2,.7*fade,'#b5b1a3');
  }
  tex(c,'gunSmoke',-Math.cos(a)*q*8,-Math.sin(a)*q*8,20+q*20,12+q*8,a,.22*fade,'#b7b3a2');
 }else{
  // Add a few irregular wood/fabric fragments to the existing accepted-hit
  // flash. This does not replace the original airframe hit response.
  for(let i=-1;i<=1;i++){
   const heading=a+i*.8,distance=3+e.age*(95+Math.abs(i)*35);
   tex(c,'debris',Math.cos(heading)*distance,Math.sin(heading)*distance,19-q*6,12-q*4,heading+i*q*2.2,.95*fade,i?'#c2ad88':'#685849');
  }
 }
 return true;
}

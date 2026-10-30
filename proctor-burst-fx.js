// Read actual, short-lived gun records; never infer shots from skill timers.
const clamp=n=>Math.max(0,Math.min(1,n));
export function drawProctorGunRecord(c,p,f,tex,x=0,y=0){
 if(p.pilot!=='proctor'||!['muzzleTwin','gunSmoke'].includes(f.key))return false;
 if(!(p.hp>0)||p.status==='downed'||p.state!=='playing'||!(f.life>0)||!(f.maxLife>0)||![p.x,p.y,p.a,x,y,f.x,f.y,f.a,f.life,f.maxLife].every(Number.isFinite))return true;
 const age=Math.max(0,f.maxLife-f.life),fade=clamp(f.life/f.maxLife),ca=Math.cos(f.a),sa=Math.sin(f.a);
 const px=x+f.x-p.x,py=y+f.y-p.y;
 if(f.key==='muzzleTwin'){
  // The barrel moves with the aircraft; old shot records leave only falling brass.
  if(age<.045)tex(c,'muzzleTwin',x+Math.cos(p.a)*25+ca*3,y+Math.sin(p.a)*25+sa*3,32,13,f.a,.90*fade,'#e6c696');
  for(let i=0;i<2;i++){
   const back=12+age*70+i*4,side=9+age*95+i*6;
   tex(c,'bulletBrass',px-ca*back-sa*side,py-sa*back+ca*side,5.5,2.5,f.a+.7+age*15+i*.5,.84*fade,'#bc955c');
  }
 }else{
  // Powder from each real three-round burst hangs briefly on its original line.
  const spread=clamp(age/.20),alpha=.48*fade;
  tex(c,'gunSmoke',px-ca*age*32,py-sa*age*32,34+spread*29,16+spread*12,f.a,alpha,'#b8bdb1');
  tex(c,'smokeWisp',px-ca*(8+age*50)-sa*spread*4,py-sa*(8+age*50)+ca*spread*4,25+spread*20,11+spread*9,f.a-.12,alpha*.65,'#d8d6c3');
 }
 return true;
}

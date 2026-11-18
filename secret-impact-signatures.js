// Tightly packed painted sprites, trimmed to their visible silhouette.
const frames = {"dartFan": [4, 4, 248, 149], "embeddedDart": [260, 4, 248, 61], "dartBlast": [516, 4, 248, 155], "bowVapor": [772, 4, 248, 199], "ramFlash": [4, 260, 248, 168], "airframeDebris": [260, 260, 248, 180], "rotaryCrown": [516, 260, 248, 170], "flakFlower": [772, 260, 247, 248], "steelDispenser": [4, 516, 248, 236], "gasFold": [260, 516, 248, 216], "hookHead": [516, 516, 248, 170], "wingRibs": [772, 516, 248, 244], "earthPlume": [4, 772, 248, 225], "tornPlate": [260, 772, 248, 190]};
let sheet;
export const secretImpactArtReady = new Promise(resolve => {
 if (typeof Image === 'undefined') { resolve(false); return; }
 const image = new Image();
 image.decoding = 'async';
 image.onload = () => {
  if (image.naturalWidth === 1024 && image.naturalHeight === 1024) sheet = image;
  resolve(Boolean(sheet));
 };
 image.onerror = () => resolve(false);
 image.src = new URL('./secret-final-patterns.webp', import.meta.url).href;
});

export function drawSecretWarArt(c,key,x,y,width,angle,alpha=1) {
 const frame=frames[key];
 if (!sheet || !frame || !(alpha>0 && width>0)) return false;
 const [sx,sy,sw,sh]=frame, height=width*sh/sw;
 c.save();
 c.translate(x,y);
 c.rotate(angle);
 c.globalAlpha*=Math.min(1,alpha);
 c.drawImage(sheet,sx,sy,sw,sh,-width/2,-height/2,width,height);
 c.restore();
 return true;
}

// The caller supplies the projected confirmed cue position and combat-clock age.
// Every dart stays at its attachment point. Fragments move after the actual strike.
export function drawSecretImpactSignature(c,cue,x,y,z,age,low) {
 if (!sheet) return false;
 const a=cue.a||0, life=cue.life||.45, t=Math.min(1,age/life);
 const along=(key,dist,side,width,heading,alpha,axis=a)=>{
  const dx=Math.cos(axis),dy=Math.sin(axis);
  return drawSecretWarArt(c,key,x+(dx*dist-dy*side)*z,y+(dy*dist+dx*side)*z,width*z,heading,alpha);
 };
 switch(cue.kind){
 case 'rankenLaunch': {
  const out=1-(1-t)*(1-t),size=44+out*63;
  along('dartFan',size*.4,0,size,a,1-t*t);
  break;
 }
 case 'rankenEmbed': {
  const shake=Math.sin(t*Math.PI*6)*.18*(1-t);
  along('embeddedDart',-12,0,30+4*t,a+shake,1);
  break;
 }
 case 'rankenBurst': {
  const span=cue.radius||48, out=1-Math.pow(1-t,3);
  along('dartBlast',-span*out*.45,0,span*(1.2+1.6*out),a,1-t*t);
  if (!low && age<.33) along('embeddedDart',-13-age*85,age*35,19,a+age*8,1-age/.33);
  break;
 }
 case 'ram': {
  const approach=cue.approach??a, power=.85+.22*(cue.strength??.5);
  if(age<.48) along('bowVapor',-30-age*66,0,(82+age*80)*power,approach,1-age/.48,approach);
  if(age<.36) along('ramFlash',9+age*28,0,(87+54*Math.sin(Math.min(1,age/.22)*Math.PI/2))*power,a,1-(age/.36)**2);
  const depart=1-(1-t)**2;
  for(const side of [-1,1]){
   const distance=side*(11+depart*46)*power;
   along('airframeDebris',9+depart*(side>0?23:37),distance,(32+depart*10)*power,a+side*(.4+depart*2.3),Math.min(1,age*16)*(1-t*t));
  }
  break;
 }
 default: return false;
 }
 return true;
}

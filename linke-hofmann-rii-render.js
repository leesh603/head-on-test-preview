import {fx} from './fx-art.js?v=tame3';
import {impactMark} from './tactical-marks.js?v=tame3';
// Painted layers measured in art-delivery/layer-metadata.json (1800 x 900).
// No class methods: the same renderer accepts a plain coop snapshot.
const images=new Map(),loads=new Map();
const keys=['hull','damaged','propeller','gun','bomb','cutin'];
export const RII_BOMB_ART=Object.freeze({path:'bomb-puw-readable-q92.webp',width:1213,height:278});
export function isRIIBoss(body){return (typeof body==='string'?body:body?.kind??body?.assetKey)==='linke-hofmann-r-ii';}
function imageFor(key){
 if(images.has(key))return images.get(key);
 if(typeof Image==='undefined')return null;
 const im=new Image();im.decoding='async';images.set(key,im);
 let finish;const pending=new Promise(resolve=>{let done=false;finish=(decoded=true)=>{if(done)return;done=true;const ok=decoded&&!!im.naturalWidth;if(!ok){images.delete(key);loads.delete(key);}resolve(ok);};});
 loads.set(key,pending);
 im.onload=()=>{if(im.decode)im.decode().then(()=>finish(true),()=>finish(false));else finish();};im.onerror=()=>finish(false);
 im.src=new URL(key==='bomb'?'./'+RII_BOMB_ART.path+'?v=bomb20':'./rii-boss/'+key+'.webp'+(key==='cutin'?'?v=gal1':''),import.meta.url).href;if(im.complete){if(im.naturalWidth)im.onload();else finish(false);}return im;
}
export async function prepareRIIAssets(){
 const pending=keys.map(key=>{imageFor(key);return loads.get(key)||Promise.resolve(false);});
 return (await Promise.all(pending)).every(Boolean);
}
const scaleOf=b=>Number.isFinite(b?.geometryScale)&&b.geometryScale>0?b.geometryScale:1;
const partsOf=b=>b.parts instanceof Map?[...b.parts.values()]:Array.isArray(b.parts)?b.parts:Object.values(b.parts||{});
const broken=(parts,id)=>parts.some(p=>p.id===id&&(p.destroyed===true||p.hp===0));
const damagedEngine=(parts,id)=>id.startsWith('engine-')&&parts.some(p=>p.id===id&&p.hp<=p.maxHp*.5);
export function riiExtents(body){
 const s=scaleOf(body),a=(body.a??-Math.PI/2)+Math.PI/2,c=Math.abs(Math.cos(a)),n=Math.abs(Math.sin(a));
 const halfWidth=(900*c+450*n)*s,halfHeight=(900*n+450*c)*s,x=body.x||0,y=body.y||0;
 return {left:x-halfWidth,right:x+halfWidth,top:y-halfHeight,bottom:y+halfHeight,width:halfWidth*2,height:halfHeight*2,halfWidth,halfHeight};
}
const regions={
 'engine-1':[832,68,899,181.5],'engine-2':[899,68,966,181.5],
 'engine-3':[832,181.5,899,295],'engine-4':[899,181.5,966,295],
 'gun-left':[822,405,900,485],'gun-right':[900,405,978,485],rudder:[700,705,1100,886]
};
export function drawRIIBoss(c,b,{time=0,effect,images:bank}={}){
 if(!isRIIBoss(b)||b.hidden)return false;
 const get=key=>bank?.get(key==='bomb'?RII_BOMB_ART.path:'rii-boss/'+key+'.webp')||imageFor(key);const hull=get('hull');if(!hull?.naturalWidth)return false;
 const damaged=get('damaged'),prop=get('propeller'),gun=get('gun'),bomb=get('bomb');
 const parts=partsOf(b),yaw=(b.a??-Math.PI/2)+Math.PI/2,s=scaleOf(b);
 c.save();try{
 c.imageSmoothingEnabled=true;
 c.translate(b.x||0,b.y||0);c.rotate(yaw);c.scale(s,s);
 if(b.crash){const q=b.defeatProgress||0;c.scale(1-.12*q,1-.12*q);}
 // Underslung ordnance is behind the airframe, never a dorsal hatch.
 if(!b.dead&&bomb?.naturalWidth)for(const [id,x]of [['rack-left',-250],['rack-right',250]])if(!broken(parts,id))for(let n=0;n<(b.rackAmmo?.[id]??2);n++){c.save();try{c.translate(x-7+n*14,40);c.rotate(-Math.PI/2);const width=60*RII_BOMB_ART.height/RII_BOMB_ART.width;c.drawImage(bomb,-30,-width/2,60,width);}finally{c.restore();}}
 c.drawImage(b.dead&&damaged?.naturalWidth?damaged:hull,-900,-450,1800,900);
 if(!b.dead&&damaged?.naturalWidth)for(const [id,r]of Object.entries(regions))if(broken(parts,id)||damagedEngine(parts,id)){
  const [x,y,right,bottom]=r;c.save();try{c.beginPath();c.rect(x-900,y-450,right-x,bottom-y);c.clip();c.drawImage(damaged,-900,-450,1800,900);}finally{c.restore();}
 }
 if(typeof effect==='function')for(let i=1;i<=4;i++)if(broken(parts,'engine-'+i)||damagedEngine(parts,'engine-'+i)||b.crash){
  const r=regions['engine-'+i],x=(r[0]+r[2])/2-900,y=(r[1]+r[3])/2-450;
  const pulse=1+.12*Math.sin((b.defeatAge||time)*17+i);
  effect(c,'smokeTrail',x,y+28,42*pulse,70*(b.crash?1.7:1),0,(broken(parts,'engine-'+i)||b.crash)?.58:.30);
  if(broken(parts,'engine-'+i)||b.crash)effect(c,'fireEngine',x,y,24*pulse,36*pulse,0,.65);
 }
 if(b.crash&&typeof effect==='function'){
  const age=b.defeatAge||0;
  for(let i=0;i<3;i++){const t=age-.3-i*.35;if(t>0&&t<1.5)effect(c,'debrisShard',(i-1)*90+b.crash.side*t*80,40+t*110,28,42,t*2,(1-t/1.5)*.85);}
 }
 if((!b.dead||b.crash)&&prop?.naturalWidth){
  // The shaft points forward. Blade motion is projected, not a flat spinning fan.
  const alive=parts.filter(p=>p.kind==='engine'&&!p.destroyed&&p.hp!==0).length;
  const rpm=Number.isFinite(b.rpm)?Math.max(0,b.rpm):(.25+.75*(parts.length?alive:4)/4);
  const phase=Number.isFinite(b.propellerPhase)?b.propellerPhase:time*42*rpm;
  const width=300*Math.max(.035,Math.abs(Math.cos(phase)));
  c.drawImage(prop,-width/2,-399-16.5,width,33);
 }
 if(!b.dead&&gun?.naturalWidth)for(const [id,x]of [['gun-left',-36],['gun-right',38]])if(!broken(parts,id)){
  const state=b.turretStates?.[id]||{},p=parts.find(p=>p.id===id),angle=state.angle??p?.angle??b.a??-Math.PI/2;
  const recoil=Math.min(4,Math.max(0,Number(state.recoil)||0));
  c.save();try{c.translate(x,-3);c.rotate(angle+Math.PI/2-yaw);c.drawImage(gun,-27*.52,-82*.8+recoil,27,82);
   if(state.flash>0&&typeof effect==='function')effect(c,'muzzle',0,-65.6,38,64,0,Math.min(1,state.flash/.035));
  }finally{c.restore();}
 }
 // Brief additive redraw is clipped to the struck component, never the giant hull.
 if(!b.dead)for(const [id,left]of Object.entries(b.hitFlash||{})){
  if(!(left>0))continue;
  const r=regions[id]||(id==='rack-left'?[632,460,668,520]:id==='rack-right'?[1132,460,1168,520]:id==='core'?[868,468,932,532]:null);
  if(!r)continue;const [x,y,right,bottom]=r;
  c.save();try{c.beginPath();c.rect(x-900,y-450,right-x,bottom-y);c.clip();c.globalCompositeOperation='lighter';c.globalAlpha*=Math.min(1,left/.12)*.6;c.drawImage(hull,-900,-450,1800,900);}finally{c.restore();}
 }
 return true;
 }finally{c.restore();drawRIIReleasedBombs(c,b,{effect,images:bank});}
}

// Released ordnance is its own foreground pass: it cannot disappear under
// opaque wings. The short aft arc is depth/readability projection, not homing.
export function riiBombPose(drop,scale){
 const life=drop.maxlife??drop.maxLife??1.6,q=Math.max(0,Math.min(1,(drop.age||0)/life)),a=drop.angle??-Math.PI/2;
 const groundX=drop.x+((drop.targetX??drop.x+Math.cos(a)*28*scale*life)-drop.x)*q,groundY=drop.y+((drop.targetY??drop.y+Math.sin(a)*28*scale*life)-drop.y)*q;
 const separation=18*Math.sin(Math.PI*q);
 return{x:groundX-Math.cos(a)*separation,y:groundY-Math.sin(a)*separation,groundX,groundY,q,angle:a,size:Math.min(.6,scale*3.2)*(1-.15*q)};
}
export function drawRIIReleasedBombs(c,b,{effect,images:bank}={}){
 const bomb=bank?.get(RII_BOMB_ART.path)||imageFor('bomb');if(!bomb?.naturalWidth)return;
 for(const drop of b.visualBombs||[]){const life=drop.maxlife??drop.maxLife??1.6;if((drop.age||0)>=life||!Number.isFinite(drop.x)||!Number.isFinite(drop.y))continue;
  const p=riiBombPose(drop,scaleOf(b)),w=Math.min(43,80*p.size),h=w*RII_BOMB_ART.height/RII_BOMB_ART.width;
  c.save();try{
   c.translate(p.groundX+3,p.groundY+5);c.rotate(p.angle);c.globalAlpha*=.32;c.filter='brightness(0)';c.drawImage(bomb,-w/2,-h/2,w,h);
  }finally{c.restore();}
  c.save();try{c.translate(p.x,p.y);c.rotate(p.angle);
   // Existing nose-right PuW artwork, unchanged colours and native aspect.
   // No exhaust trail: this is a falling bomb, not a powered missile.
   c.shadowColor='rgba(19,17,12,.95)';c.shadowBlur=2;c.drawImage(bomb,-w/2,-h/2,w,h);
  }finally{c.restore();}
 }
}

// R.II bombs strike land. The physical painted bomb is body.visualBombs only.
export function drawRIIHazard(c,h,z=1,{effect=fx,mark=impactMark}={}){
 if(h?.bossKind!=='linke-hofmann-r-ii'||h.visual!=='rviii-bomb')return false;
 const age=Math.max(0,(h.age||0)-(h.delay||0)),warning=Math.max(.01,h.warning||0),r=h.radius||32;
 c.save();try{
  if(h.phase==='warning')mark(c,h.x,h.y,r,Math.min(1,age/warning));
  else{const q=Math.max(0,Math.min(1,(age-warning)/Math.max(.01,h.duration||.3))),frame=Math.min(3,Math.floor(q*4));
   effect(c,'explosionDust'+frame,h.x,h.y,r*(2+q),r*(2+q),0,(1-q)*.8);
   effect(c,'explosionHot'+frame,h.x,h.y,r*1.8,r*1.8,0,1-q);
  }
  return true;
 }finally{c.restore();}
}


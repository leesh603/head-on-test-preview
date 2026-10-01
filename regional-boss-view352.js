import {REGIONAL_ART,STAAKEN_ENGINE_RECTS} from './regional-boss-art-data352.js?v=477';
import {REGIONAL_BOSS_SET,REGIONAL_LAYOUT,RAIL_CAR_SIZE} from './regional-boss-layout352.js?v=477';
import {fx} from './fx-art.js?v=477';
import {drawAADefense} from './aa-defense-art.js?v=477';

// These are authored/derived RGBA sprites, not canvas-painted replacement art.
// Only the current battlefield's small atlas set remains resident.
const SOURCES=Object.freeze({
 train:'./boss-fliegerzug-parts352.webp',treffas:'./boss-treffas-parts352.webp',support:'./boss-regional-support352.webp',
 staaken:'./boss-staaken-body352.webp',staakenEngines:'./boss-staaken-engines352.webp',staakenWreck:'./boss-staaken-wreck352.webp',
 tank:'./boss-mark4.webp?v=426',tankWreck:'./boss-mark4-wreck.webp?v=426',
 morser:'./boss-morser.webp?v=426',morserWreck:'./boss-morser-wreck.webp?v=426',
 bugFolded:'./boss-cambrai-bug.webp?v=426',bugFlight:'./boss-cambrai-bug.webp?v=426',impact:'./fx-mortar-impact340.webp'
});
const SHEETS={train:'boss-fliegerzug-parts352',treffas:'boss-treffas-parts352',support:'boss-regional-support352',staakenEngines:'boss-staaken-engines352'};
const REGION_KEYS={4:['support'],8:['support','bugFlight','impact'],10:['support','tank','tankWreck','morser','morserWreck','impact'],11:['support','staaken','staakenEngines','staakenWreck','impact']};
const REQUIRED={'fliegerzug':['train','support','bugFolded'],'treffas-wagen':['treffas'],'mark4-wedge':['tank','tankWreck','support'],'morser-battery':['morser','morserWreck','support'],'staaken-rvi':['staaken','staakenEngines','staakenWreck'],'london-searchlight':['support'],'london-apron':['support'],'drachen-net':['support']};
const cache=new Map();
function load(key){
 if(cache.has(key))return cache.get(key);
 const image=new Image();image.decoding='async';
 const record={image,failed:false,promise:null};
 record.promise=new Promise(resolve=>{
  image.addEventListener('load',()=>resolve(true),{once:true});
  image.addEventListener('error',()=>{record.failed=true;resolve(false);},{once:true});
 });cache.set(key,record);image.src=SOURCES[key];return record;
}
export function prepareRegionalBossArt(region){
 const keys=REGION_KEYS[region]||[];
 for(const key of cache.keys())if(!keys.includes(key))cache.delete(key);
 return Promise.all(keys.map(key=>load(key).promise));
}
export function regionalArtStatus(){return [...cache].map(([key,r])=>({key,ready:!!r.image.naturalWidth,failed:r.failed,width:r.image.naturalWidth,height:r.image.naturalHeight}));}
const image=key=>load(key).image;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
function sprite(c,key,x,y,w,h,angle=0,alpha=1,pivotY=.5){
 const im=image(key);if(!im.naturalWidth)return false;
 const scale=Math.min(w/im.naturalWidth,h/im.naturalHeight),dw=im.naturalWidth*scale,dh=im.naturalHeight*scale;
 c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha*=alpha;c.imageSmoothingEnabled=true;c.drawImage(im,-dw/2,-dh*pivotY,dw,dh);c.restore();return true;
}
function frame(c,sheet,key,x,y,w,h,angle=0,alpha=1,pivotY=.5,exact=false){
 const rect=REGIONAL_ART[SHEETS[sheet]]?.[key],im=image(sheet);if(!rect||!im.naturalWidth)return false;
 const [sx,sy,sw,sh]=rect,s=exact?1:Math.min(w/sw,h/sh),dw=exact?w:sw*s,dh=exact?h:sh*s;
 c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha*=alpha;c.imageSmoothingEnabled=true;c.drawImage(im,sx,sy,sw,sh,-dw/2,-dh*pivotY,dw,dh);c.restore();return true;
}
function smoke(c,p,t,width,dead){
 const damaged=dead||p.hp<p.maxHp*.5;if(!damaged)return;
 const q=(t*.34+p.x*.009)%1,s=width*(.5+Math.abs(q)*.5),a=dead?.35:.20;
 fx(c,'smokeDark',p.x+Math.sin(t+p.x)*width*.08,p.y-width*.23-Math.abs(q)*width*.5,s,s,0,a*(1-Math.abs(q)));
 const burn=dead&&p.destroyedAt!=null?clamp(1-(t-p.destroyedAt)/6,0,1):0;
 if(burn>0)fx(c,'fireEngine',p.x,p.y+width*.1,width*.22*Math.max(.4,burn),width*.22*Math.max(.4,burn),0,.5*burn);
}
function brackets(c,x,y,rx,ry,alpha=.75){
 c.save();c.globalAlpha*=alpha;c.strokeStyle='#d7bc82';c.lineWidth=1.5;const n=Math.min(9,rx*.3);
 for(const sx of [-1,1])for(const sy of [-1,1]){c.beginPath();c.moveTo(x+sx*(rx-n),y+sy*ry);c.lineTo(x+sx*rx,y+sy*ry);c.lineTo(x+sx*rx,y+sy*(ry-n));c.stroke();}
 c.restore();
}
function drawCore(c,b,{closed='core-closed',w,h}={}){
 const k=b.regionalCore;if(!k)return;const scale=b.regionalScale||1;
 w??=Math.max(k.rx,k.ry)*2.35;h??=w;
 frame(c,'support',b.destroying?'core-wreck':b.coreVulnerable?'core-open':closed,k.x,k.y,w,h);
 if(b.coreVulnerable&&!b.destroying)brackets(c,k.x,k.y,k.rx+4*scale,k.ry+4*scale,.65);
}
function cable(c,x0,y0,x1,y1,broken=false){
 c.save();c.strokeStyle=broken?'#4c48417a':'#574f41b8';c.lineWidth=1.8;c.beginPath();c.moveTo(x0,y0);c.lineTo(broken?x0+(x1-x0)*.24:x1,broken?y0+(y1-y0)*.24:y1);c.stroke();c.restore();
}
export function drawRegionalBossBody(c,b){
 if(!REGIONAL_BOSS_SET.has(b.assetKey)||b.assetKey==='fliegerzug'||b.assetKey==='treffas-wagen')return false;
 // The city encounters keep their approved full composite silhouettes. Only
 // hazards and restrained damage overlays are layered elsewhere.
 if(b.assetKey==='london-apron'||b.assetKey==='drachen-net')return false;
 if(!REQUIRED[b.assetKey].every(key=>image(key).naturalWidth))return false;
 const parts=b.parts||[],part=id=>parts.find(p=>p.id===id),scale=b.regionalScale||b.geometryScale||1,t=b.motionTime||0;
 c.save();c.translate(b.x,b.y);c.imageSmoothingEnabled=true;
 if(b.destroying)c.globalAlpha*=clamp(1-b.destructionAge/Math.max(.1,b.destructionDuration)*.5);
 switch(b.assetKey){
  case 'fliegerzug':{
   const a=b.phase==='derailed'?.16:0,s=b.railBodyScale||1;c.rotate(a);
   const cars=b.railCars||[];
   for(const [id,key] of [['car-rear','hangar'],['car-middle','launch'],['car-front','flak'],[null,'loco']]){
    const p=id?cars.find(p=>p.id===id):{x:0,y:0,hp:b.hp,maxHp:b.maxHp,destroyed:b.destroying};if(!p)continue;
    const dead=p.destroyed||b.destroying;
    const detached=dead&&p.detachedPose,dx=detached?p.detachedPose.x-b.x:0,dy=detached?p.detachedPose.y-b.y:0,px=detached?dx*Math.cos(a)+dy*Math.sin(a):(p.x||0),py=detached?-dx*Math.sin(a)+dy*Math.cos(a):p.y;
    frame(c,'train',key+(dead?'-wreck':'-normal'),px,py,RAIL_CAR_SIZE.width*s,RAIL_CAR_SIZE.height*s,detached?p.detachedPose.angle-a:0);
    if(key==='flak'&&!dead)frame(c,'support','gun-normal',0,p.y-8*s,60*s,73*s,(b.flakAngle??-Math.PI/2)+Math.PI/2-a,1,.70);
    if(key==='launch'&&!dead)for(let i=0;i<(b.launchStock??2);i++)sprite(c,'bugFolded',(i?23:-23)*s,p.y+18*s,39*s,86*s,0,1);
    if(key==='hangar'&&!dead&&b.hangarHatch>0)fx(c,'smokeTrail',0,p.y+52*s,66*s,32*s,Math.PI/2,.3*clamp(b.hangarHatch));
    if(dead||p.hp<p.maxHp*.5)smoke(c,{...p,x:px,y:py},t,80*s,dead);
    if(id&&!dead&&p.hittable)brackets(c,0,p.y,RAIL_CAR_SIZE.rx*s+3,RAIL_CAR_SIZE.ry*s+3,.65);
   }
   if(b.coreVulnerable&&!b.destroying)brackets(c,0,0,RAIL_CAR_SIZE.rx*s+3,RAIL_CAR_SIZE.ry*s+3);
   break;
  }
  case 'treffas-wagen':{
   const tail=part('rudder'),turret=part('turret');
   if(tail)frame(c,'treffas','tail-'+(tail.destroyed||b.destroying?'wreck':'normal'),tail.x,tail.y,tail.drawWidth,tail.drawHeight);
   for(const id of ['wheel-left','wheel-right']){const p=part(id);if(!p)continue;const dead=p.destroyed||b.destroying;
    frame(c,'treffas','wheel-'+(dead?'wreck':'normal'),p.x,p.y,p.drawWidth,p.drawHeight);
    if(!dead&&b.wheelRoll>0&&b.phase!=='crippled'&&b.phase!=='exposed')fx(c,'dustPuff',p.x,p.y+p.drawHeight*.47,35*scale,19*scale,0,.21);
    smoke(c,p,t,65*scale,dead);
   }
   frame(c,'treffas','hull-'+(b.coreVulnerable||b.destroying?'wreck':'normal'),0,0,102*scale,162*scale);
   if(turret){const dead=turret.destroyed||b.destroying;frame(c,'treffas','turret-'+(dead?'wreck':'normal'),turret.x,turret.y,turret.drawWidth,turret.drawHeight,dead?0:(turret.angle??-Math.PI/2)+Math.PI/2,1,.70);smoke(c,turret,t,42*scale,dead);}
   if(b.coreVulnerable&&!b.destroying){const k=b.regionalCore;brackets(c,k.x,k.y,k.rx+3,k.ry+3);}
   break;
  }
  case 'london-apron':{
   const k=b.regionalCore;
   if(b.coreVulnerable||b.destroying)drawCore(c,b,{w:120*scale,h:120*scale});
   else drawAADefense(c,'londonWinch',0,0,120*scale,83*scale);
   for(const p of parts){const dead=p.destroyed||b.destroying;
    cable(c,p.x,p.y+p.drawHeight*.36,0,0,dead);
    drawAADefense(c,dead?'londonWreck':'londonBalloon',p.x,p.y+(dead?18*scale:0),p.drawWidth*(dead?.8:1),p.drawHeight*(dead?.7:1),0,dead?.8:1);
    if(!dead&&p.hp<p.maxHp*.5)smoke(c,p,t,35*scale,false);
   }
   if(b.coreVulnerable&&!b.destroying)brackets(c,k.x,k.y,k.rx+5,k.ry+5);
   break;
  }
  case 'drachen-net':{
   const balloon=part('balloon'),winch=part('winch');drawCore(c,b,{w:90*scale,h:90*scale});
   if(balloon&&winch){cable(c,balloon.x,balloon.y+balloon.drawHeight*.38,winch.x,winch.y,balloon.destroyed||winch.destroyed||b.destroying);
    for(const side of [-1,1])cable(c,balloon.x+side*35*scale,balloon.y+27*scale,winch.x+side*25*scale,winch.y-18*scale,balloon.destroyed||b.destroying);}
   if(winch)drawAADefense(c,winch.destroyed||b.destroying?'drachenWreck':'drachenWinch',winch.x,winch.y,winch.drawWidth,winch.drawHeight);
   if(balloon){const dead=balloon.destroyed||b.destroying;drawAADefense(c,dead?'londonWreck':'drachenBalloon',balloon.x,balloon.y+(dead?20*scale:0),balloon.drawWidth*(dead?.66:1),balloon.drawHeight*(dead?.65:1),0,dead?.8:1);smoke(c,balloon,t,48*scale,dead);}
   break;
  }
  case 'mark4-wedge':{
   drawCore(c,b);
   for(const p of parts){const dead=p.destroyed||b.destroying;sprite(c,dead?'tankWreck':'tank',p.x,p.y,p.drawWidth,p.drawHeight);smoke(c,p,t,90*scale,dead);
    if(!dead&&b.phase!=='exposed')fx(c,'dustPuff',p.x,p.y+p.drawHeight*.44,45*scale,24*scale,0,.18);}
   break;
  }
  case 'morser-battery':{
   drawCore(c,b);
   for(const p of parts){const dead=p.destroyed||b.destroying;
    if(p.id==='ammo')frame(c,'support',dead?'ammo-wreck':'ammo-normal',p.x,p.y,p.drawWidth,p.drawHeight);
    else sprite(c,dead?'morserWreck':'morser',p.x,p.y,p.drawWidth,p.drawHeight);
    smoke(c,p,t,(p.id==='ammo'?52:78)*scale,dead);
   }
   break;
  }
  case 'staaken-rvi':{
   const w=380*scale,h=434*380/768*scale;
   if(b.coreVulnerable||b.destroying)sprite(c,'staakenWreck',0,0,w,h);
   else{
    sprite(c,'staaken',0,0,w,h);
    for(let i=0;i<4;i++){const p=part('eng-'+i);if(!p)continue;const [x0,y0,x1,y1]=STAAKEN_ENGINE_RECTS[i],s=w/768;
      frame(c,'staakenEngines','engine-'+i+(p.destroyed?'-wreck':''),((x0+x1)/2-384)*s,((y0+y1)/2-217)*s,(x1-x0)*s,(y1-y0)*s,0,1,.5,true);}
   }
   for(const p of parts)smoke(c,p,t,48*scale,p.destroyed||b.destroying);
   if(b.coreVulnerable&&!b.destroying){const k=b.regionalCore;brackets(c,k.x,k.y,k.rx+3,k.ry+3);}
   break;
  }
  case 'london-searchlight':{
   drawCore(c,b);const lamp=part('light'),gun=part('gun'),ammo=part('ammo'),k=b.regionalCore;
   if(lamp)cable(c,k.x,k.y,lamp.x,lamp.y,lamp.destroyed||b.destroying);
   if(gun)cable(c,k.x,k.y,gun.x,gun.y,gun.destroyed||b.destroying);
   if(lamp){const dead=lamp.destroyed||b.destroying;frame(c,'support',dead?'light-wreck':'light-normal',lamp.x,lamp.y,lamp.drawWidth,lamp.drawHeight);
    if(!dead&&b.beamRemaining>0)drawAADefense(c,'aaMuzzle',lamp.x+Math.cos(b.lampAngle)*5,lamp.y+Math.sin(b.lampAngle)*5,20,20,0,.12+.14*(b.lockProgress||0));smoke(c,lamp,t,62*scale,dead);}
   if(gun){const dead=gun.destroyed||b.destroying;frame(c,'support',dead?'gun-wreck':'gun-normal',gun.x,gun.y,gun.drawWidth,gun.drawHeight,dead?0:(gun.angle??Math.PI/2)+Math.PI/2,1,.70);smoke(c,gun,t,62*scale,dead);}
   if(ammo){const dead=ammo.destroyed||b.destroying;frame(c,'support',dead?'ammo-wreck':'ammo-normal',ammo.x,ammo.y,ammo.drawWidth,ammo.drawHeight);smoke(c,ammo,t,46*scale,dead);}
   break;
  }
 }
 c.restore();return true;
}
export function drawRegionalBossPart(c,p){
 if(!REGIONAL_BOSS_SET.has(p.bodyKey)||p.bodyKey==='fliegerzug'||p.bodyKey==='treffas-wagen')return false;
 if(p.bodyKey==='fliegerzug'||p.destroyed||!p.hittable)return true;
 const rx=p.hitRadiusX||p.radius,ry=p.hitRadiusY||p.radius;
 if(p.hp<p.maxHp){brackets(c,p.x,p.y,rx+3,ry+3,.55);c.save();c.fillStyle='#232820';c.fillRect(p.x-rx*.8,p.y+ry+6,rx*1.6,3);c.fillStyle='#d6b27d';c.fillRect(p.x-rx*.8,p.y+ry+6,rx*1.6*clamp(p.hp/p.maxHp),3);c.restore();}
 return true;
}
export function drawRegionalHazard(c,h,bossKind){
 if(!REGIONAL_BOSS_SET.has(bossKind))return false;
 // The attached net is textured once with its parent body. Never paint a
 // duplicate hazard-layer image over aircraft or an unrelated screen lane.
 if(h.visual==='apron-attached'||h.visual==='apron-wire')return true;
 const artillery=['morser-shell','mark4-shell','treffas-shell','observer-shell','black-flak'].includes(h.visual)||(h.visual==='carpet-bomb'&&/^staaken-/.test(h.tag||''));
 if(!artillery||h.kind!=='circle')return false;
 const warning=h.phase==='warning',q=clamp((h.age-h.delay)/Math.max(.01,h.warning));c.save();
 if(warning){
  c.strokeStyle='#d5b781b8';c.lineWidth=1.5;c.setLineDash([6,6]);c.beginPath();c.arc(h.x,h.y,h.radius,0,Math.PI*2);c.stroke();c.setLineDash([]);
  c.strokeStyle='#eed29bb8';c.lineWidth=2;c.beginPath();c.arc(h.x,h.y,h.radius,-Math.PI/2,-Math.PI/2+q*Math.PI*2);c.stroke();
  if(h.sourceX!=null&&q>0){const x=h.sourceX+(h.x-h.sourceX)*q,y=h.sourceY+(h.y-h.sourceY)*q-Math.sin(q*Math.PI)*74,angle=Math.atan2(h.y-h.sourceY,h.x-h.sourceX);
    fx(c,'shellHeavy',x,y,h.visual==='carpet-bomb'?25:27,9,angle,.96);}
 }else{
  const age=Math.max(0,h.age-h.delay-h.warning),progress=clamp(age/Math.max(.01,h.duration)),opacity=Math.min(1,(1-progress)*3);
  if(h.visual==='black-flak'||h.visual==='observer-shell')drawAADefense(c,progress<.25?'aaFlakHot':progress<.65?'aaFlakDark':'aaFlakSmoke',h.x,h.y,h.radius*2.25,h.radius*2.25,0,opacity);
  else{const im=image('impact');if(im.naturalWidth){const n=Math.min(3,Math.floor(progress*4)),sw=im.naturalWidth/2,sh=im.naturalHeight/2,size=h.radius*2.35;c.globalAlpha*=opacity;c.imageSmoothingEnabled=true;c.drawImage(im,(n%2)*sw,Math.floor(n/2)*sh,sw,sh,h.x-size/2,h.y-size/2,size,size);}}
 }
 c.restore();return true;
}
export function drawRegionalCue(c,cue){
 if(cue.type==='safe-corridor'){
  c.save();c.globalAlpha=.45*clamp(cue.life/.4);c.strokeStyle='#d6d4ab';c.lineWidth=2;
  for(const side of [-1,1]){const x=cue.x+side*cue.width/2;c.beginPath();c.moveTo(x-side*12,cue.y-15);c.lineTo(x,cue.y-15);c.lineTo(x,cue.y+15);c.lineTo(x-side*12,cue.y+15);c.stroke();}c.restore();return true;
 }
 if(cue.type==='bug-launch-warning'){
  c.save();c.translate(cue.x,cue.y);c.rotate(cue.angle+Math.PI/2);c.strokeStyle='#d7c291b3';c.lineWidth=1.3;c.setLineDash([5,6]);
  for(const side of [-1,1]){c.beginPath();c.moveTo(side*23,15);c.lineTo(side*23,-92);c.stroke();}c.restore();return true;
 }
 if(cue.type==='bug-launch'){
  fx(c,'smokeTrail',cue.x-Math.cos(cue.angle)*15,cue.y-Math.sin(cue.angle)*15,45,18,cue.angle,.34*clamp(cue.life/.6));return true;
 }
 if(cue.type==='searchlight-lock'){
  brackets(c,cue.x,cue.y,20,20,.7*clamp(cue.life/.3));return true;
 }
 return false;
}
// Shared by solo and co-op; no canvas filter, improvised triangle, or separate
// shadow rotation. The departure and flight use the same authored biplane.
export function drawRegionalBug(c,e,x=e.x,y=e.y){
 if(e.hp<=0)return;const im=image('bugFlight');if(!im.naturalWidth)return;
 const angle=(e.a??-Math.PI/2)+Math.PI/2;
 sprite(c,'bugFlight',x+7,y+10,72,72*im.naturalHeight/im.naturalWidth,angle,.18);
 sprite(c,'bugFlight',x,y,72,72*im.naturalHeight/im.naturalWidth,angle,1);
 if(e.launchAge<e.launchSeconds)fx(c,'smokeTrail',x-Math.cos(e.a)*24,y-Math.sin(e.a)*24,38,16,e.a,.3);
 if(e.hp<e.maxHp){c.save();c.fillStyle='#252b24';c.fillRect(x-14,y-24,28,3);c.fillStyle='#c08e6d';c.fillRect(x-14,y-24,28*clamp(e.hp/e.maxHp),3);c.restore();}
}

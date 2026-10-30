import {maanHullFrame,drawMaanHullFrame,maanBarrelMotion,drawMaanBarrels} from './maan-hull-art.js?v=capital-final-20261030';
import {drawPartFuelFire} from './explosion-profiles.js?v=capital-final-20261030';
import {MAAN_LAYOUT,MAAN_ENTRY,rotateMaan} from './maan-layout.js?v=capital-final-20261030';
import {periodicSandPixels,maanGroundTiles} from './maan-ground.js?v=capital-final-20261030';
import {sandOpacity} from './maan-weather.js?v=capital-final-20261030';
import {drawSandVortex,prepareSandVortexArt} from './sand-vortex-art.js?v=capital-final-20261030';
import {fx} from './fx-art.js?v=capital-final-20261030';
import {drawTracerBolt} from './projectiles.js?v=capital-final-20261030';
import {impactMark,bandMark,aimLine,laneEdge} from './tactical-marks.js?v=capital-final-20261030';
import {drawShellFlight} from './boss-rounds.js?v=capital-final-20261030&ai=1018';
export const MAAN_ASSETS=Object.freeze({terrain:'https://head-on-aces.justzeon.chatgpt.site/terrain-maan-r2.webp',workshop:'https://head-on-aces.justzeon.chatgpt.site/maan-workshop-r2.webp',wusten:'https://head-on-aces.justzeon.chatgpt.site/boss-maan-wusten-r2.webp',sinai:'https://head-on-aces.justzeon.chatgpt.site/boss-maan-sinai-r2.webp',car:'https://head-on-aces.justzeon.chatgpt.site/boss-maan-rolls-royce.webp'});
const images=new Map();let ground=null,settledWorkshop=null;
const _filterBakes=new WeakMap();
function bakedFiltered(img,filter){if(!img?.naturalWidth)return img;let m=_filterBakes.get(img);if(!m){m=new Map();_filterBakes.set(img,m)}let cv=m.get(filter);if(cv===undefined){cv=document.createElement('canvas');cv.width=img.naturalWidth;cv.height=img.naturalHeight;const cc=cv.getContext('2d');cc.filter=filter;cc.drawImage(img,0,0);m.set(filter,cv)}return cv}
const load=key=>{if(images.has(key))return images.get(key);const im=new Image();im.decoding='async';im.src='./'+MAAN_ASSETS[key]+'?v=capital-final-20261030';images.set(key,im);return im;};
export function prepareMaanAssets(region){
 if(region!==13){images.clear();ground=null;if(settledWorkshop){settledWorkshop.canvas.width=settledWorkshop.canvas.height=1;settledWorkshop=null;}return Promise.resolve();}
 prepareSandVortexArt();
 return Promise.all(Object.keys(MAAN_ASSETS).map(key=>{const im=load(key);if(im.complete&&im.naturalWidth)return Promise.resolve();return new Promise((resolve,reject)=>{im.onload=()=>{if(!im.naturalWidth){reject(new Error('Ma’an empty asset: '+MAAN_ASSETS[key]));return}(im.decode?im.decode():Promise.resolve()).catch(()=>{}).finally(()=>resolve())};im.onerror=()=>reject(new Error('Ma’an asset: '+MAAN_ASSETS[key]));});})).then(()=>{seamlessGround(load('terrain'));});
}
function seamlessGround(im){
 if(ground?.source===im)return ground;
 if(typeof document==='undefined')return null;
 const source=document.createElement('canvas');source.width=im.naturalWidth;source.height=im.naturalHeight;
 const c=source.getContext('2d',{willReadFrequently:true});c.drawImage(im,0,0);
 const baked=periodicSandPixels(c.getImageData(0,0,source.width,source.height).data,source.width,source.height);
 const tile=document.createElement('canvas');tile.width=baked.width;tile.height=baked.height;const t=tile.getContext('2d'),pixels=t.createImageData(tile.width,tile.height);pixels.data.set(baked.data);t.putImageData(pixels,0,0);
 return ground={source:im,tile,pw:tile.width,ph:tile.height};
}
export function paintMaan(c,g,cx,cy,width,height){
 c.fillStyle='#b69363';c.fillRect(0,0,width,height);const im=load('terrain');if(!im.naturalWidth)return;
 const baked=seamlessGround(im),tile=baked?.tile||im,pw=baked?.pw||im.naturalWidth,ph=baked?.ph||im.naturalHeight;
 c.save();c.imageSmoothingEnabled=true;
 for(const q of maanGroundTiles(cx,cy,width,height,pw,ph))c.drawImage(tile,q.x,q.y,q.width,q.height);
 c.restore();
}
function workshopPieces(f,flight){
 const pieces=[],columns=8,rows=10;
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const i=row*columns+col,side=col<columns/2?-1:1,w=f.width/columns,h=f.height/rows;
  const dx=(col+.5)*w-f.width/2,dy=(row+.5)*h-f.height/2,pace=.75+(Math.sin(i*13.7)+1)*.25;
  pieces.push({i,row,col,w,h,px:f.x+dx+side*(80+Math.abs(dx)*.18)*flight*pace,py:f.y+dy+(row-3.5)*15*flight+25*flight*flight,angle:side*flight*(.25+(i%5)*.12)});
 }
 return pieces;
}
function paintWorkshopPieces(c,image,pieces,cw,ch,alpha){
 for(const {i,row,col,w,h,px,py,angle} of pieces){
  c.save();c.translate(px,py);c.rotate(angle);c.globalAlpha=alpha;
  c.beginPath();c.moveTo(-w*.5,-h*(.2+(i%3)*.1));c.lineTo(-w*.2,-h*.5);c.lineTo(w*.5,-h*.32);c.lineTo(w*(.2+(i%4)*.07),h*.5);c.lineTo(-w*.5,h*.24);c.closePath();c.clip();
  c.drawImage(image,col*cw/8,row*ch/10,cw/8,ch/10,-w/2,-h/2,w,h);c.restore();
 }
}
export function drawMaanWorkshop(c,b){
 const f=b.workshop,im=load('workshop');if(!im.naturalWidth||!f)return;
 const cw=im.naturalWidth/2,ch=im.naturalHeight,x=f.x-f.width/2,y=f.y-f.height/2;
 const age=f.destroyedAt==null?-1:b.entryAge-f.destroyedAt;
 c.save();c.imageSmoothingEnabled=true;
 if(age<0){
  const shake=b.entryAge>MAAN_ENTRY.ignition?Math.sin(b.entryAge*45)*1.1:0;
  c.drawImage(im,0,0,cw,ch,x+shake,y,f.width,f.height);
 }else{
  // Break up the authored roof itself. Every fragment keeps the original art
  // and alpha, then lands outside the tank's exit corridor as scorched rubble.
  if(age>=2.8){
   // The landed roof never changes again. Bake its exact clipped atlas pieces
   // once, rather than re-running eighty rotated clips on every mobile frame.
   const cache=settledWorkshop;
   if(!cache||cache.source!==im||cache.width!==f.width||cache.height!==f.height){
    if(cache)cache.canvas.width=cache.canvas.height=1;
    const local={...f,x:0,y:0},pieces=workshopPieces(local,2.8);
    const left=Math.floor(Math.min(...pieces.map(p=>p.px-Math.hypot(p.w,p.h)/2)))-2;
    const top=Math.floor(Math.min(...pieces.map(p=>p.py-Math.hypot(p.w,p.h)/2)))-2;
    const right=Math.ceil(Math.max(...pieces.map(p=>p.px+Math.hypot(p.w,p.h)/2)))+2;
    const bottom=Math.ceil(Math.max(...pieces.map(p=>p.py+Math.hypot(p.w,p.h)/2)))+2;
    const canvas=document.createElement('canvas');canvas.width=right-left;canvas.height=bottom-top;
    const cc=canvas.getContext('2d');cc.imageSmoothingEnabled=true;cc.translate(-left,-top);
    paintWorkshopPieces(cc,bakedFiltered(im,'brightness(.5) saturate(.55)'),pieces,cw,ch,.55);
    settledWorkshop={source:im,width:f.width,height:f.height,canvas,left,top};
   }
   c.globalAlpha=1;c.drawImage(settledWorkshop.canvas,f.x+settledWorkshop.left,f.y+settledWorkshop.top);
  }else paintWorkshopPieces(c,im,workshopPieces(f,age),cw,ch,1);
  if(age<3.2)for(let i=0;i<7;i++){const q=(age*.65+i/7)%1;fx(c,'smokeDust',f.x+(i-3)*66,f.openingY-110-q*160,150+q*140,140+q*130,0,(1-q)*Math.max(0,1-age/3.2)*.65);}
 }
 c.restore();
}
const trackStrips={
 wustenpanzer:[['track-left',-88,157,26,112],['track-right',88,157,26,112]],
 'sinai-landship':[['track-front-left',-36,-238,21,35],['track-front-right',36,-238,21,35],['track-rear-left',-57,228,23,46],['track-rear-right',57,228,23,46]]
};
function drawTracks(c,b,frame){
 if(b.dead||!frame)return;
 const l=b.layout,sx=frame.width/l.width,sy=frame.height/l.height;
 for(const [id,x,y,w,h] of trackStrips[b.kind]||[]){
  const p=b.parts.get(id);if(p.destroyed)continue;
  const pitch=b.kind==='wustenpanzer'?11:9,offset=((p.trackRoll||0)%pitch+pitch)%pitch;
  c.save();c.beginPath();c.rect(x-w/2,y-h/2,w,h);c.clip();
  for(let dy=-h/2-pitch+offset;dy<h/2;dy+=pitch)c.drawImage(frame.image,frame.x+(x-w/2+l.width/2)*sx,frame.y+(y+l.height/2-pitch/2)*sy,w*sx,pitch*sy,x-w/2,y+dy,w,pitch);
  c.restore();
 }
}
export function drawMaanBoss(c,b){
 if(!['wustenpanzer','sinai-landship','maan-rolls-royce'].includes(b.kind))return false;
 if(b.hidden)return true;
 const factory=b.kind==='wustenpanzer'&&b.workshop;
 if(factory)drawMaanWorkshop(c,b);
 c.save();
 if(factory&&factory.destroyedAt==null){c.beginPath();c.rect(factory.x-1500,factory.openingY,3000,4000);c.clip();}
 c.imageSmoothingEnabled=true;c.translate(b.x,b.y);c.rotate(b.hullYaw||0);
 if(b.kind==='maan-rolls-royce'){const im=load('car');if(im.naturalWidth)c.drawImage(im,-20,-35,40,70);
  if(b.driveVelocity>1)for(let i=0;i<2;i++){const q=((b.motionTime||0)*.8+i*.5)%1;fx(c,'dustPuff',0,30+q*45,26+q*35,24+q*35,0,(1-q)*.3);}
  if(b.gunFlash>0)fx(c,'muzzleTwin',0,-31,23,23,-Math.PI/2,Math.min(1,b.gunFlash/.06));
  c.restore();return true;}
 const l=b.layout,t=b.entryAge,key=b.kind==='wustenpanzer'?'wusten':'sinai',im=load(key);
 const parts=b.parts,frame=maanHullFrame(im,b),motions=maanBarrelMotion(b);
 const main=parts.get('heavy-gun'),recoil=!b.dead&&!main?.destroyed?main?.recoil||0:0;
 c.save();
 if(recoil>0||motions.length){
  c.beginPath();c.rect(-l.width/2-20,-l.height/2-20,l.width+40,l.height+40);
  if(recoil>0)c.rect(-12,-260,24,100);
  for(const [,x,y,w,h]of motions)c.rect(x,y,w,h);
  c.clip('evenodd');
 }
 drawMaanHullFrame(c,frame,l);c.restore();
 // Recoil uses the same composed damage frame as the body, so a damaged
 // barrel cannot briefly turn pristine again when it fires.
 if(recoil>0&&frame)c.drawImage(frame.image,frame.x+(l.width/2-12)/l.width*frame.width,frame.y,24/l.width*frame.width,100/l.height*frame.height,-12,-260+recoil,24,100);
 drawMaanBarrels(c,frame,l,motions);
 drawTracks(c,b,frame);
 c.filter='none';
 const time=b.motionTime||0;
 for(const p of parts.values())if(p.destroyed||p.hp<p.maxHp*.5){
  if(p.kind==='fuel'){drawPartFuelFire(c,fx,p,p.localX,p.localY,time,46);continue;}
  if(['engine','command'].includes(p.kind))fx(c,'fireSmall',p.localX,p.localY,42,55,0,.85);
  for(let i=0;i<2;i++){const drift=(time*.32+i*.5)%1;fx(c,p.kind==='cooling'?'smokeGray':'smokeDark',p.localX+Math.sin(i+time)*10,p.localY-drift*58,30+drift*48,30+drift*48,0,(1-drift)*.58);}
 }
 if(b.driveVelocity>1)for(const side of [-1,1])for(let i=0;i<3;i++){
  const q=(time*.45+i*.33)%1;fx(c,'dustPuff',side*l.width*.39,l.height*.38+q*65,35+q*65,35+q*60,0,(1-q)*.32);
 }
 if(!b.dead&&!b.gone('engine')){const q=(time*.55)%1;fx(c,'smokeDark',0,l.height*.28+q*50,25+q*35,30+q*45,0,(1-q)*.22);}
 c.restore();
 if(!b.dead)for(const p of parts.values())if(!p.destroyed&&p.gunFlash>0){
  const side=p.id.startsWith('sponson-')?(p.localX<0?-1:1):0,m=b.muzzle(p,side),v=rotateMaan(side||0,side?0:-1,b.hullYaw);
  fx(c,p.kind==='mg'?'muzzleTwin':'muzzleHeavy',m.x,m.y,p.kind==='mg'?25:52,p.kind==='mg'?25:52,Math.atan2(v.y,v.x),Math.min(1,p.gunFlash/.08));
 }
 if(b.heavyPlan&&!b.gone('heavy-gun')){
  const m=b.muzzle(parts.get('heavy-gun')),a=b.heavyPlan.target;
  aimLine(c,m.x,m.y,a.x,a.y,{heavy:true});
 }
 if(t<b.entryDuration){
  if(factory&&t>2.8&&t<6){const age=t-2.8,q=age/3.2;for(let i=0;i<10;i++){const side=i%2?1:-1;fx(c,'metalShard'+i%6,factory.x+side*(80+age*(50+i*7)),factory.openingY-80+Math.sin(i*2.1)*90+age*age*20,28+i%3*12,32+i%4*10,side*age*(.8+i*.1),(1-q)*.9);}if(age<.9)fx(c,'structure'+Math.min(3,Math.floor(age/.225)),factory.x,factory.openingY-100,330,310,0,1-age/.9);}
  if(!factory&&t>2.4)for(let i=0;i<5;i++){
   const d=(t*.36+i/5)%1,reveal=Math.max(.08,1-(t-4.8)/4.2);
   fx(c,'smokeDust',b.x+(i-2)*62+Math.sin(t+i)*12,b.y+l.height*.25-d*95,130+d*70,100+d*55,0,(1-d)*.52*reveal);
  }
 }
 const lane=b.duneLane;
 if(lane?.remaining>0)for(const side of [-1,1])laneEdge(c,lane.x+side*lane.width/2,lane.y-50,lane.x+side*lane.width/2,lane.y+lane.depth-50);
 return true;
}
export function drawMaanWeather(c,g){
 if(g.stageBoss?.stages.stageIndex!==13)return;
 for(const s of g.maanWeather?.cells||[]){
  const zoom=g.camera?.zoom||1;
  if(Math.abs(s.x-g.x)>(g.viewWidth||960)/zoom/2+220||Math.abs(s.y-g.y)>(g.viewHeight||700)/zoom/2+220)continue;
  const opacity=sandOpacity(s);if(opacity<=0)continue;
  if(s.vortex&&drawSandVortex(c,s,opacity))continue;
  // At most three puffs per bounded cell. Dust never dims telegraphs rendered
  // afterward, nor replaces clouds or forces player movement/slowdown.
  for(let i=0;i<3;i++){const drift=Math.sin(s.age*.35+s.seed+i)*18;fx(c,'smokeDust',s.x+(i-1)*55+drift,s.y+Math.cos(i+s.seed)*16,s.rx*1.6,s.ry*1.7,s.seed*.07,opacity*(i===1?.26:.16));}
 }
}
export function drawMaanHazard(c,h){
 if(h.visual==='maan-sand-ring'){
  c.save();const warning=h.phase==='warning',r=warning?h.radiusLimit:h.radius;
  if(warning)bandMark(c,h.x,h.y,44,r,Math.min(1,(h.age-h.delay)/Math.max(.01,h.warning)),{heavy:h.raidHeavy});
  else for(let i=0;i<8;i++){const a=i*Math.PI/4+(h.age-h.warning)*.1;fx(c,'dustPuff',h.x+Math.cos(a)*(r-11),h.y+Math.sin(a)*(r-11),44,30,a,.55);}
  c.restore();return true;
 }
 if(!/^(wusten|sinai)-/.test(h.visual))return false;
 c.save();const warning=h.phase==='warning';
 if(h.kind==='projectile'){if(h.visual.endsWith('mg'))drawTracerBolt(c,h.x,h.y,Math.atan2(h.vy,h.vx),'#e8a86a',15,4,.95);else fx(c,'shellHeavy',h.x,h.y,20,5,Math.atan2(h.vy,h.vx),.95);}
 else if(warning){impactMark(c,h.x,h.y,h.radius,Math.max(0,Math.min(1,(h.age-h.delay)/Math.max(.01,h.warning))),{heavy:h.raidHeavy,tone:h.visual==='wusten-steam'?'blind':'warn'});
  if(h.visual.endsWith('impact'))drawShellFlight(c,h,Math.max(0,Math.min(1,(h.age-h.delay)/h.warning)));
 }
 else{const age=Math.max(0,h.age-h.delay-h.warning),q=Math.min(.999,age/h.duration);
  if(h.visual==='wusten-steam')fx(c,'smokeGray',h.x,h.y,h.radius*2,h.radius*2,0,.55*(1-q));
  else if(h.visual==='sinai-fire')fx(c,'fireSmall',h.x,h.y,h.radius*1.5,h.radius*1.5,0,.8*(1-q));
  else fx(c,'bombfx'+Math.min(3,Math.floor(q*4)),h.x,h.y,h.radius*2.7,h.radius*2.7,0,Math.min(1,(1-q)*3));
 }
 c.restore();return true;
}
export function handleMaanCue(g,event,body){
 if(event.type==='maan-entry'){
  const wusten=body?.kind==='wustenpanzer';
  const messages=wusten?{alarm:'마안 철도공창 · 내부 경보',ignition:'거대 기관 시동 · 증기압 상승',doors:'공창 붕괴 · 육상순양함 돌파',reveal:'Wüstenpanzer · 사막 육상순양함 출격',engaged:'냉각장치와 궤도 공략'}:{alarm:'사막 능선 너머 포격',ignition:'롤스로이스 장갑차 · 선행 정찰',doors:'모래먼지 속 거대한 육상함 접근',reveal:'Sinai Landship · 호위부대 전개',engaged:'측면 일제사격 · 호위 장갑차 주의'};
  g.event('wave',messages[event.stage]||'');g.event('bossSound',event.stage==='alarm'?'approachWarning':event.stage==='doors'&&wusten?'metalBreak':event.stage==='engaged'?'bossSting':'heavyShot');
  if(!wusten&&event.stage==='alarm')for(const dx of [-190,20,185]){const y=body.entryTarget.y-230-Math.abs(dx)*.2;g.combatBlast(body.entryTarget.x+dx,y,35,'enemy','shell');g.smoke?.(body.entryTarget.x+dx,y,false);}
  if(event.stage==='doors'&&wusten)g.shake=Math.max(g.shake,5);
  if(event.stage==='reveal')g.shake=Math.max(g.shake,4);
  return true;
 }
 if(event.type==='maan-workshop-collapse'){g.combatBlast(event.x,event.y,115,'enemy','structure');g.shake=Math.max(g.shake,8);return true;}
 if(event.type==='maan-tactic'){
  const messages={'siege-shot':'중포 고정 사격 · 조준 지점 이탈','walking-barrage':'순차 포격 · 폭발 진행 방향 주의','aa-sweep':'대공포 부채꼴 제압','pressure-release':'증기 배출 예고 · 양옆 위험 구역 이탈','desert-runaway':'사막의 폭주 · 증기 배출 후 순차 중포격','overheat-service':'과열 정지 · 노출된 본체에 반격','corridor-barrage':'양측 협동 포격 · 중앙 통로 확보','desert-encirclement':'최후의 사막 포위 · 장갑차 협공 후 측면 집중사격','broken-encirclement':'지휘망 붕괴 · 잔존 측면포의 산발 사격','convoy-reload':'호위대 후퇴 · 육상함 장전 중 반격','command-lost':'지휘부 파괴 · 협동 포격 취소·호위대 후퇴'};
  g.event('wave',messages[event.name]||'');return true;
 }
 if(event.type==='maan-damage'){g.combatBlast(event.x,event.y,42,'enemy','structure');g.shake=Math.max(g.shake,6);return true;}
 if(event.type==='maan-vent'){g.smoke?.(event.x,event.y,event.black);g.event('bossSound','flameValve');return true;}
 if(event.type==='maan-escort'){g.event('wave','롤스로이스 장갑차 · 측면 압박');return true;}
 if(event.type==='muzzle'&&['wustenpanzer','sinai-landship','maan-rolls-royce'].includes(body?.kind)){const mg=body.kind==='maan-rolls-royce'||body.parts.get(event.partId)?.kind==='mg';g.event('bossSound',mg?'enemyShot':'heavyShot');g.shake=Math.max(g.shake,mg?1:3);return true;}
 return false;
}


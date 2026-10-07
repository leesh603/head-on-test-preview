import {MAAN_LAYOUT,MAAN_ENTRY,rotateMaan} from './maan-layout.js?v=imm2';
import {periodicSandPixels,maanGroundTiles} from './maan-ground.js?v=imm2';
import {sandOpacity} from './maan-weather.js?v=imm2';
import {fx} from './fx-art.js?v=imm2';
export const MAAN_ASSETS=Object.freeze({terrain:'terrain-maan-r2.webp',workshop:'maan-workshop-r2.webp',wusten:'boss-maan-wusten-r2.webp',sinai:'boss-maan-sinai-r2.webp',car:'boss-maan-rolls-royce.webp'});
const images=new Map();let ground=null;
const _filterBakes=new WeakMap();
function bakedFiltered(img,filter){if(!img?.naturalWidth)return img;let m=_filterBakes.get(img);if(!m){m=new Map();_filterBakes.set(img,m)}let cv=m.get(filter);if(cv===undefined){cv=document.createElement('canvas');cv.width=img.naturalWidth;cv.height=img.naturalHeight;const cc=cv.getContext('2d');cc.filter=filter;cc.drawImage(img,0,0);m.set(filter,cv)}return cv}
const load=key=>{if(images.has(key))return images.get(key);const im=new Image();im.decoding='async';im.src='./'+MAAN_ASSETS[key]+'?v=imm2';images.set(key,im);return im;};
export function prepareMaanAssets(region){
 if(region!==13){images.clear();ground=null;return Promise.resolve();}
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
// Equal atlas columns share the hull axis and full cell size. Never trim each
// damage state independently: part ownership must stay registered to the hull.
function drawHullImage(c,im,l,state=0){if(im.naturalWidth)c.drawImage(im,state*im.naturalWidth/2,0,im.naturalWidth/2,im.naturalHeight,-l.width/2,-l.height/2,l.width,l.height);}
const regionCache=new Map();
function regions(kind){
 if(regionCache.has(kind))return regionCache.get(kind);const l=MAAN_LAYOUT[kind],step=4,rows=[];
 for(let y=-l.height/2;y<l.height/2;y+=step){let last=null,start=-l.width/2;
  const owner=x=>l.parts.reduce((best,p)=>{const d=((x-p[1])/p[3])**2+((y+step/2-p[2])/p[4])**2;return !best||d<best?{id:p[0],d}:best;},null).id;
  for(let x=-l.width/2;x<=l.width/2;x+=step){const id=x>=l.width/2?null:owner(x+step/2);if(last!==id){if(last)rows.push({id:last,x:start,y,w:x-start,h:Math.min(step,l.height/2-y)});last=id;start=x;}}
 }regionCache.set(kind,rows);return rows;
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
  const columns=8,rows=10,flight=Math.min(age,2.8),settled=age>=2.8;
  const rim=settled?bakedFiltered(im,'brightness(.5) saturate(.55)'):im;
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
   const i=row*columns+col,side=col<columns/2?-1:1,w=f.width/columns,h=f.height/rows;
   const dx=(col+.5)*w-f.width/2,dy=(row+.5)*h-f.height/2,pace=.75+(Math.sin(i*13.7)+1)*.25;
   const px=f.x+dx+side*(80+Math.abs(dx)*.18)*flight*pace,py=f.y+dy+(row-3.5)*15*flight+25*flight*flight;
   c.save();c.translate(px,py);c.rotate(side*flight*(.25+(i%5)*.12));c.globalAlpha=settled?.55:1;
   c.beginPath();c.moveTo(-w*.5,-h*(.2+(i%3)*.1));c.lineTo(-w*.2,-h*.5);c.lineTo(w*.5,-h*.32);c.lineTo(w*(.2+(i%4)*.07),h*.5);c.lineTo(-w*.5,h*.24);c.closePath();c.clip();
   c.drawImage(rim,col*cw/columns,row*ch/rows,cw/columns,ch/rows,-w/2,-h/2,w,h);c.restore();
  }
  if(age<3.2)for(let i=0;i<7;i++){const q=(age*.65+i/7)%1;fx(c,'smokeDust',f.x+(i-3)*66,f.openingY-110-q*160,150+q*140,140+q*130,0,(1-q)*Math.max(0,1-age/3.2)*.65);}
 }
 c.restore();
}
const trackStrips={
 wustenpanzer:[['track-left',-88,157,26,112],['track-right',88,157,26,112]],
 'sinai-landship':[['track-front-left',-36,-238,21,35],['track-front-right',36,-238,21,35],['track-rear-left',-57,228,23,46],['track-rear-right',57,228,23,46]]
};
function drawTracks(c,b,im){
 if(b.dead||!im.naturalWidth)return;
 const l=b.layout,sx=im.naturalWidth/2/l.width,sy=im.naturalHeight/l.height;
 for(const [id,x,y,w,h] of trackStrips[b.kind]||[]){
  const p=b.parts.get(id);if(p.destroyed)continue;
  const pitch=b.kind==='wustenpanzer'?11:9,offset=((p.trackRoll||0)%pitch+pitch)%pitch;
  c.save();c.beginPath();c.rect(x-w/2,y-h/2,w,h);c.clip();
  for(let dy=-h/2-pitch+offset;dy<h/2;dy+=pitch)c.drawImage(im,(x-w/2+l.width/2)*sx,(y+l.height/2-pitch/2)*sy,w*sx,pitch*sy,x-w/2,y+dy,w,pitch);
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
  c.restore();return true;}
 const l=b.layout,t=b.entryAge,key=b.kind==='wustenpanzer'?'wusten':'sinai',im=load(key);
 const parts=b.parts,broken=[...parts.values()].some(p=>p.destroyed||p.hp<p.maxHp*.5);
 if(b.dead)drawHullImage(c,im,l,1);
 else if(!broken)drawHullImage(c,im,l);
 else if(im.naturalWidth){
  const signature=[...parts.values()].map(p=>p.destroyed||p.hp<=p.maxHp*.5?'1':'0').join('');
  if(b._maanSprite?.signature!==signature){
   const canvas=document.createElement('canvas');canvas.width=l.width;canvas.height=l.height;const cc=canvas.getContext('2d'),cw=im.naturalWidth/2;
   for(const r of regions(b.kind)){const p=parts.get(r.id),state=p&&(p.destroyed||p.hp<=p.maxHp*.5)?1:0;
    cc.drawImage(im,state*cw+(r.x+l.width/2)/l.width*cw,(r.y+l.height/2)/l.height*im.naturalHeight,r.w/l.width*cw,r.h/l.height*im.naturalHeight,r.x+l.width/2,r.y+l.height/2,r.w,r.h);}
   b._maanSprite={signature,canvas};
  }
  c.drawImage(b._maanSprite.canvas,-l.width/2,-l.height/2);
 }
 drawTracks(c,b,im);
 c.filter='none';
 const time=b.motionTime||0;
 for(const p of parts.values())if(p.destroyed||p.hp<p.maxHp*.5){
  if(['fuel','engine','command'].includes(p.kind))fx(c,'fireSmall',p.localX,p.localY,42,55,0,.85);
  for(let i=0;i<2;i++){const drift=(time*.32+i*.5)%1;fx(c,p.kind==='cooling'?'smokeGray':'smokeDark',p.localX+Math.sin(i+time)*10,p.localY-drift*58,30+drift*48,30+drift*48,0,(1-drift)*.58);}
 }
 if(b.driveVelocity>1)for(const side of [-1,1])for(let i=0;i<3;i++){
  const q=(time*.45+i*.33)%1;fx(c,'dustPuff',side*l.width*.39,l.height*.38+q*65,35+q*65,35+q*60,0,(1-q)*.32);
 }
 if(!b.dead&&!b.gone('engine')){const q=(time*.55)%1;fx(c,'smokeDark',0,l.height*.28+q*50,25+q*35,30+q*45,0,(1-q)*.22);}
 c.restore();
 if(t<b.entryDuration){
  if(factory&&t>2.8&&t<6){const age=t-2.8,q=age/3.2;for(let i=0;i<10;i++){const side=i%2?1:-1;fx(c,'metalShard'+i%6,factory.x+side*(80+age*(50+i*7)),factory.openingY-80+Math.sin(i*2.1)*90+age*age*20,28+i%3*12,32+i%4*10,side*age*(.8+i*.1),(1-q)*.9);}if(age<.9)fx(c,'structure'+Math.min(3,Math.floor(age/.225)),factory.x,factory.openingY-100,330,310,0,1-age/.9);}
  if(!factory&&t>2.4)for(let i=0;i<5;i++){
   const d=(t*.36+i/5)%1,reveal=Math.max(.08,1-(t-4.8)/4.2);
   fx(c,'smokeDust',b.x+(i-2)*62+Math.sin(t+i)*12,b.y+l.height*.25-d*95,130+d*70,100+d*55,0,(1-d)*.52*reveal);
  }
 }
 const lane=b.duneLane;
 if(lane?.remaining>0){c.save();c.strokeStyle='#dfd1a7';c.lineWidth=2;c.setLineDash([10,8]);for(const side of [-1,1]){c.beginPath();c.moveTo(lane.x+side*lane.width/2,lane.y-50);c.lineTo(lane.x+side*lane.width/2,lane.y+lane.depth-50);c.stroke();}c.restore();}
 return true;
}
export function drawMaanWeather(c,g){
 if(g.stageBoss?.stages.stageIndex!==13)return;
 for(const s of g.maanWeather?.cells||[]){
  const opacity=sandOpacity(s);if(opacity<=0)continue;
  // At most three puffs per bounded cell. Dust never dims telegraphs rendered
  // afterward, nor replaces clouds or forces player movement/slowdown.
  for(let i=0;i<3;i++){const drift=Math.sin(s.age*.35+s.seed+i)*18;fx(c,'smokeDust',s.x+(i-1)*55+drift,s.y+Math.cos(i+s.seed)*16,s.rx*1.6,s.ry*1.7,s.seed*.07,opacity*(i===1?.26:.16));}
 }
}
export function drawMaanHazard(c,h){
 if(h.visual==='maan-sand-ring'){
  c.save();const warning=h.phase==='warning',r=warning?h.radiusLimit:h.radius;
  c.strokeStyle=warning?'#ffe0a0':'#cbac71';c.lineWidth=warning?2:3;c.setLineDash(warning?[8,6]:[]);c.beginPath();c.arc(h.x,h.y,r,0,Math.PI*2);c.stroke();
  if(warning){c.globalAlpha=.5;c.beginPath();c.arc(h.x,h.y,44,0,Math.PI*2);c.stroke();}
  else for(let i=0;i<8;i++){const a=i*Math.PI/4+(h.age-h.warning)*.1;fx(c,'dustPuff',h.x+Math.cos(a)*(r-11),h.y+Math.sin(a)*(r-11),44,30,a,.55);}
  c.restore();return true;
 }
 if(!/^(wusten|sinai)-/.test(h.visual))return false;
 c.save();const warning=h.phase==='warning';
 if(h.kind==='projectile'){fx(c,h.visual.endsWith('mg')?'tracerAmber':'shellHeavy',h.x,h.y,h.visual.endsWith('mg')?12:20,5,Math.atan2(h.vy,h.vx),.95);}
 else if(warning){c.strokeStyle='#ffdf99';c.lineWidth=2;c.setLineDash([7,5]);c.beginPath();c.arc(h.x,h.y,h.radius,0,Math.PI*2);c.stroke();}
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
  const messages={'siege-shot':'중포 고정 사격 · 조준 지점 이탈','walking-barrage':'순차 포격 · 폭발 진행 방향 주의','aa-sweep':'대공포 부채꼴 제압','pressure-release':'증기 배출 · 본체 장갑 개방','corridor-barrage':'양측 협동 포격 · 중앙 통로 확보'};
  g.event('wave',messages[event.name]||'');return true;
 }
 if(event.type==='maan-damage'){g.combatBlast(event.x,event.y,42,'enemy','structure');g.shake=Math.max(g.shake,6);return true;}
 if(event.type==='maan-vent'){g.smoke?.(event.x,event.y,event.black);g.event('bossSound','flameValve');return true;}
 if(event.type==='maan-escort'){g.event('wave','롤스로이스 장갑차 · 측면 압박');return true;}
 return false;
}

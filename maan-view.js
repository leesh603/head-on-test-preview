import {MAAN_LAYOUT,MAAN_ENTRY,rotateMaan} from './maan-layout.js?v=maan20261004r2';
import {periodicSandPixels,maanGroundTiles} from './maan-ground.js?v=maan20261004r2';
import {sandOpacity} from './maan-weather.js?v=maan20261004r2';
import {fx} from './fx-art.js?v=526';
export const MAAN_ASSETS=Object.freeze({terrain:'terrain-maan-r2.webp',workshop:'maan-workshop-r2.webp',wusten:'boss-maan-wusten-r2.webp',sinai:'boss-maan-sinai-r2.webp',car:'boss-maan-rolls-royce.webp'});
const images=new Map();let ground=null;
const load=key=>{if(images.has(key))return images.get(key);const im=new Image();im.decoding='async';im.src='./'+MAAN_ASSETS[key]+'?v=maan20261004r2';images.set(key,im);return im;};
export function prepareMaanAssets(region){
 if(region!==13){images.clear();ground=null;return Promise.resolve();}
 return Promise.all(Object.keys(MAAN_ASSETS).map(key=>{const im=load(key);if(im.complete&&im.naturalWidth)return Promise.resolve();return new Promise((resolve,reject)=>{im.onload=()=>im.naturalWidth?resolve():reject(new Error('Ma’an empty asset: '+MAAN_ASSETS[key]));im.onerror=()=>reject(new Error('Ma’an asset: '+MAAN_ASSETS[key]));});})).then(()=>{seamlessGround(load('terrain'));});
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
  const owner=x=>l.parts.reduce((best,p)=>{const d=((x-p[1])/p[3])**2+((y+step/2-p[2])/p[4])**2;return !best||d<best.d?{id:p[0],d}:best;},null).id;
  for(let x=-l.width/2;x<=l.width/2;x+=step){const id=x>=l.width/2?null:owner(x+step/2);if(last!==id){if(last)rows.push({id:last,x:start,y,w:x-start,h:Math.min(step,l.height/2-y)});last=id;start=x;}}
 }regionCache.set(kind,rows);return rows;
}
export function drawMaanWorkshop(c,b){
 const im=load('workshop');if(!im.naturalWidth||!b.entryAnchor)return;
 const a=b.entryAnchor,t=b.entryAge,w=b.layout.width*1.5,h=b.layout.height*1.14,cw=im.naturalWidth/2,ch=im.naturalHeight;
 c.save();c.translate(a.x,a.y);c.imageSmoothingEnabled=true;
 if(t<MAAN_ENTRY.breakAt){
  const shake=t>MAAN_ENTRY.ignition?Math.sin(t*45)*1.1:0;
  c.drawImage(im,0,0,cw,ch,-w/2+shake,-h/2,w,h);
 }else{
  const age=t-MAAN_ENTRY.breakAt,q=Math.min(1,age/1.05),ease=1-(1-q)**3,push=w*.32*ease;
  // Authored collapsed halves fall OUTWARD; their gap then clears the hull.
  for(const side of [0,1])c.drawImage(im,cw+side*cw/2,0,cw/2,ch,-w/2+side*w/2+(side?push:-push),-h/2,w/2,h);
  if(age<.8){
   c.globalAlpha=Math.max(0,1-age/.8);
   for(let i=0;i<6;i++){
    const side=i%2?-1:1,row=Math.floor(i/2),dx=side*(w*.25+age*120),dy=-h/2+(row+.5)*h/3-age*32;
    c.save();c.translate(dx,dy);c.rotate(side*age*(.4+row*.13));c.drawImage(im,(i%2)*cw/2,row*ch/3,cw/2,ch/3,-w/4,-h/6,w/2,h/3);c.restore();
   }
  }
 }
 c.restore();
}
export function drawMaanBoss(c,b){
 if(!['wustenpanzer','sinai-landship','maan-rolls-royce'].includes(b.kind))return false;
 if(b.hidden)return true;
 if(b.kind==='maan-rolls-royce'){c.save();c.translate(b.x,b.y);c.rotate(b.hullYaw||0);const im=load('car');if(im.naturalWidth)c.drawImage(im,-20,-35,40,70);c.restore();return true;}
 const l=b.layout,t=b.entryAge,key=b.kind==='wustenpanzer'?'wusten':'sinai',im=load(key),breaking=t>=MAAN_ENTRY.breakAt&&t<MAAN_ENTRY.breakAt+.85;
 if(!breaking)drawMaanWorkshop(c,b);
 if(t>=MAAN_ENTRY.breakAt){
  c.save();c.imageSmoothingEnabled=true;c.translate(b.x,b.y);c.rotate(b.hullYaw||0);
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
  const time=b.motionTime||0;
  for(const p of parts.values())if(p.destroyed||p.hp<p.maxHp*.5){
   if(['fuel','engine','command'].includes(p.kind))fx(c,'fireSmall',p.localX,p.localY,42,55,0,.85);
   for(let i=0;i<2;i++){const drift=(time*.32+i*.5)%1;fx(c,p.kind==='cooling'?'smokeGray':'smokeDark',p.localX+Math.sin(i+time)*10,p.localY-drift*58,30+drift*48,30+drift*48,0,(1-drift)*.58);}
  }
  if(b.driveVelocity>1)for(const side of [-1,1])for(let i=0;i<2;i++){
   const q=(time*.45+i*.5)%1;fx(c,'smokeDust',side*l.width*.39,l.height*.38+q*50,40+q*55,30+q*45,0,(1-q)*.3);
  }
  c.restore();
 }
 if(breaking)drawMaanWorkshop(c,b);
 if(t<MAAN_ENTRY.duration){
  const a=b.entryAnchor,rupture=Math.max(0,t-MAAN_ENTRY.breakAt);
  if(t>MAAN_ENTRY.ignition&&t<MAAN_ENTRY.breakAt)for(const side of [-1,1])fx(c,'smokeGray',a.x+side*l.width*.3,a.y,65,110,0,.24);
  if(rupture>0&&rupture<1.4)for(let i=0;i<6;i++){
   const side=i%2?-1:1,row=Math.floor(i/2);fx(c,'dirtBurst',a.x+side*(l.width*.35+rupture*70),a.y+(row-1)*l.height*.25,90+rupture*70,70+rupture*50,side*.2,Math.max(0,(1-rupture/1.4)*.72));
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
  if(event.stage==='alarm')for(const p of g.players||[g])g.stageBoss?.hooks.onStatus(p.id||'p1',{type:'maan-arrival',seconds:MAAN_ENTRY.duration,speedFactor:.25});
  const messages={alarm:'마안 철도공창 · 내부 경보',ignition:'격납고 진동 · 거대 기관 시동',doors:'격납고 지붕 파열 · 육상함 돌파',engaged:body?.kind==='wustenpanzer'?'사막 육상순양함 · 냉각장치와 궤도 공략':'시나이 육상함 · 측면포와 지원구획 공략'};
  g.event('wave',messages[event.stage]||'');g.event('bossSound',event.stage==='alarm'?'approachWarning':event.stage==='doors'?'metalBreak':'heavyShot');
  if(event.stage==='doors'){
   const a=body?.entryAnchor||event;g.shake=Math.max(g.shake,10);
   for(const side of [-1,1])g.combatBlast(a.x+side*(body?.layout.width||248)*.36,a.y,48,'enemy','structure');
  }return true;
 }
 if(event.type==='maan-damage'){g.combatBlast(event.x,event.y,42,'enemy','structure');g.shake=Math.max(g.shake,6);return true;}
 if(event.type==='maan-vent'){g.smoke?.(event.x,event.y,event.black);g.event('bossSound','flameValve');return true;}
 if(event.type==='maan-escort'){g.event('wave','롤스로이스 장갑차 · 측면 압박');return true;}
 return false;
}

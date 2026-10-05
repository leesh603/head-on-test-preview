import {MAAN_LAYOUT,rotateMaan} from './maan-layout.js?v=479';
import {fx} from './fx-art.js?v=479';
const urls={terrain:'terrain-maan.webp',workshop:'maan-workshop.webp',wusten:'boss-maan-wusten.webp',wustenWreck:'boss-maan-wusten-wreck.webp',sinai:'boss-maan-sinai.webp',sinaiWreck:'boss-maan-sinai-wreck.webp',car:'boss-maan-rolls-royce.webp'};
const images=new Map();
const load=key=>{if(images.has(key))return images.get(key);const im=new Image();im.decoding='async';im.src='./'+urls[key]+'?v=479';images.set(key,im);return im;};
export function prepareMaanAssets(region){if(region!==12){images.clear();return Promise.resolve();}return Promise.all(Object.keys(urls).map(key=>{const im=load(key);return im.complete?Promise.resolve():new Promise((resolve,reject)=>{im.onload=resolve;im.onerror=()=>reject(new Error('Ma’an asset: '+urls[key]));});}));}
export function paintMaan(c,g,cx,cy,width,height){
 c.fillStyle='#b69363';c.fillRect(0,0,width,height);
 const im=load('terrain');if(!im.naturalWidth)return;
 const tile=768,scale=tile/im.naturalWidth,fullH=im.naturalHeight*scale;
 const progress=Math.max(0,Math.min(1,((g?.distance||0)-(g?.stageStartDistance||0))/12000));
 const boss=g?.stageBoss?.stages.phase==='boss',pan=(boss?(g?.stageBoss?.stages.bossId==='sinai-landship'?.52:1):progress)*Math.max(0,fullH-height);
 const encounter=boss?g.stageBoss.stages.encounter?.id:null;
 if(boss&&g._maanGround?.encounter!==encounter)g._maanGround={encounter,y:cy};
 const cameraPan=boss?-(cy-g._maanGround.y)*.3:0;
 const ox=((-(cx-(g?.maanStartX??cx))*.3-width/2)%tile+tile)%tile-tile;
 c.save();c.imageSmoothingEnabled=true;
 for(let x=ox;x<width;x+=tile)c.drawImage(im,x,-fullH+height+pan+cameraPan,tile,fullH);
 c.restore();
}
function drawHullImage(c,im,layout){if(im.naturalWidth)c.drawImage(im,-layout.width/2,-layout.height/2,layout.width,layout.height);}
// Each region chooses the intact or authored wreck atlas at the same anchor.
// Voronoi ownership makes disjoint replacement regions: no intact plate behind
// a ripped opening, no black mask and no disappearing whole components.
const regionCache=new Map();
function regions(kind){
 if(regionCache.has(kind))return regionCache.get(kind);
 const l=MAAN_LAYOUT[kind],step=4,rows=[];
 for(let y=-l.height/2;y<l.height/2;y+=step){let last=null,start=-l.width/2;
  const owner=x=>l.parts.reduce((best,p)=>{const d=((x-p[1])/p[3])**2+((y+step/2-p[2])/p[4])**2;return !best||d<best.d?{id:p[0],d}:best;},null).id;
  for(let x=-l.width/2;x<=l.width/2;x+=step){const id=x>=l.width/2?null:owner(x+step/2);if(last!==id){if(last)rows.push({id:last,x:start,y,w:x-start,h:Math.min(step,l.height/2-y)});last=id;start=x;}}
 }regionCache.set(kind,rows);return rows;
}
export function drawMaanBoss(c,b){
 if(!['wustenpanzer','sinai-landship','maan-rolls-royce'].includes(b.kind))return false;
 const factory=b.kind==='wustenpanzer'&&b.entryAnchor;
 if(factory){const roof=load('workshop'),open=Math.max(0,Math.min(1,((b.entryAge||0)-3.8)/2));
  if(roof.naturalWidth){const w=300,h=b.layout.height,x=factory.x-w/2,y=factory.y-h/2,door=18,cut=roof.naturalHeight*(h-door)/h;
   c.drawImage(roof,0,0,roof.naturalWidth,cut,x,y,w,h-door);
   for(const side of [0,1])c.drawImage(roof,side*roof.naturalWidth/2,cut,roof.naturalWidth/2,roof.naturalHeight-cut,x+side*w/2+(side?1:-1)*open*160,y+h-door,w/2,door);
  }
 }
 c.save();if(factory&&b.entryAge<7){c.beginPath();c.rect(factory.x-1000,factory.y+b.layout.height/2-18,2000,2000);c.clip();}
 c.imageSmoothingEnabled=true;c.translate(b.x,b.y);c.rotate(b.hullYaw||0);
 if(b.kind==='maan-rolls-royce'){const im=load('car');if(im.naturalWidth)c.drawImage(im,-20,-35,40,70);c.restore();return true;}
 const l=b.layout,key=b.kind==='wustenpanzer'?'wusten':'sinai',base=load(key),wreck=load(key+'Wreck');
 if(b.kind==='sinai-landship'&&b.entryAge<7)c.filter='brightness('+(.28+.72*Math.max(0,Math.min(1,(b.entryAge-3)/4)))+')';
 const parts=b.parts,broken=[...parts.values()].filter(p=>p.destroyed).length;
 if(b.dead){drawHullImage(c,wreck,l);}
 else if(!broken&&![...parts.values()].some(p=>p.hp<p.maxHp*.5)){drawHullImage(c,base,l);}
 else if(base.naturalWidth&&wreck.naturalWidth){
  const signature=[...parts.values()].map(p=>p.destroyed||p.hp<=p.maxHp*.5?'1':'0').join('');
  if(b._maanSprite?.signature!==signature){
   const canvas=document.createElement('canvas');canvas.width=l.width;canvas.height=l.height;const cc=canvas.getContext('2d');
   for(const r of regions(b.kind)){const p=parts.get(r.id),im=p&&(p.destroyed||p.hp<=p.maxHp*.5)?wreck:base;
    cc.drawImage(im,(r.x+l.width/2)/l.width*im.naturalWidth,(r.y+l.height/2)/l.height*im.naturalHeight,r.w/l.width*im.naturalWidth,r.h/l.height*im.naturalHeight,r.x+l.width/2,r.y+l.height/2,r.w,r.h);}
   b._maanSprite={signature,canvas};
  }
  c.drawImage(b._maanSprite.canvas,-l.width/2,-l.height/2);
 }
 c.filter='none';
 const time=b.motionTime||0;
 for(const p of parts.values())if(p.destroyed||p.hp<p.maxHp*.5){
  if(['fuel','engine','command'].includes(p.kind))fx(c,'fireSmall',p.localX,p.localY,42,55,0,.85);
  for(let i=0;i<2;i++){const drift=(time*.32+i*.5)%1;fx(c,p.kind==='cooling'?'smokeGray':'smokeDark',p.localX+Math.sin(i+time)*10,p.localY-drift*58,30+drift*48,30+drift*48,0,(1-drift)*.58);}
 }
 if(b.driveVelocity>1||b.entryAge<7)for(const side of [-1,1])for(let i=0;i<3;i++){
  const t=(time*.45+i*.33)%1;fx(c,'smokeGray',side*l.width*.39,l.height*.38+t*60,35+t*70,35+t*70,0,(1-t)*.27);
 }
 c.restore();
 if(b.entryAge<7){
  const t=b.entryAge,origin=b.entryAnchor||b.entryOrigin;
  const count=b.kind==='wustenpanzer'?6:10;
  for(let i=0;i<count;i++){const d=(t*.36+i/count)%1;fx(c,b.kind==='wustenpanzer'&&t<3?'smokeDark':'smokeGray',b.x+(i-count/2)*45+Math.sin(t+i)*25,b.y+130-d*260,(b.kind==='sinai-landship'?185:115)+d*95,(b.kind==='sinai-landship'?145:90)+d*90,0,(1-d)*(b.kind==='sinai-landship'?.64:.46));}
 }
 return true;
}
export function handleMaanCue(g,event,body){
 if(event.type==='maan-entry'){
  const wusten=body?.kind==='wustenpanzer';
  if(event.stage==='alarm')for(const p of g.players||[g])g.stageBoss?.hooks.onStatus(p.id||'p1',{type:'maan-arrival',seconds:7,speedFactor:.25});
  const messages=wusten?{alarm:'마안 철도공창 · 내부 경보',ignition:'거대 기관 시동 · 증기압 상승',doors:'철판 문 파열 · 사막 육상순양함 출격',engaged:'Wüstenpanzer · 냉각장치와 궤도 공략'}:{alarm:'사막 능선 너머 포격 · 장갑차 선행',ignition:'모래먼지 속 거대한 육상함 접근',doors:'Sinai Landship · 양측 호위 전개',engaged:'측면 일제사격 · 호위 장갑차 주의'};
  g.event('wave',messages[event.stage]||'');g.event('bossSound',event.stage==='alarm'?'approachWarning':event.stage==='doors'?'metalBreak':'heavyShot');
  if(!wusten&&['alarm','ignition'].includes(event.stage))for(const dx of [-190,20,185]){g.combatBlast(g.x+dx,g.y-250-Math.abs(dx)*.2,35,'enemy','structure');g.smoke?.(g.x+dx,g.y-250,false);}
  if(event.stage==='doors')g.shake=Math.max(g.shake,10);
 }
 if(event.type==='maan-damage'){g.combatBlast(event.x,event.y,42,'enemy','structure');g.shake=Math.max(g.shake,6);}
 if(event.type==='maan-vent'){g.smoke?.(event.x,event.y,event.black);g.event('bossSound','flameValve');}
 if(event.type==='maan-escort')g.event('wave','롤스로이스 장갑차 · 측면 압박');
}

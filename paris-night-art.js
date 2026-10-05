import {fx} from './fx-art.js?v=485';
import {PARIS_SIZE,ensureParisBattle} from './paris-night-battle.js';
import {PARIS_ART_LAYOUTS,PARIS_PART_CLIPS} from './paris-night-atlas.js';
let images={},mapLayer=null;
export function releaseParisArt(){images={};mapLayer=null;}
export function prepareParisArt(){
 return Promise.all([['map','terrain-paris-night1918.webp'],['fortress','paris-fortress-parts1918.webp'],['fortressWreck','paris-fortress-wreck1918.webp'],['staaken','paris-staaken-parts1918.webp'],['staakenWreck','paris-staaken-wreck1918.webp']].map(([key,path])=>new Promise(resolve=>{
  const im=new Image();im.decoding='async';images[key]=im;im.onload=()=>{if(key==='map')mapLayer=null;(im.decode?im.decode():Promise.resolve()).catch(()=>{}).finally(()=>resolve(true))};im.onerror=()=>resolve(false);im.src='./'+path+'?v=485';
 })));
}
function featherMap(im){
 const layer=document.createElement('canvas');layer.width=im.naturalWidth;layer.height=im.naturalHeight;
 const c=layer.getContext('2d');c.drawImage(im,0,0);c.globalCompositeOperation='destination-in';
 for(const axis of ['x','y']){const size=axis==='x'?layer.width:layer.height,gradient=c.createLinearGradient(0,0,axis==='x'?size:0,axis==='y'?size:0);
  gradient.addColorStop(0,'#0000');gradient.addColorStop(.055,'#000');gradient.addColorStop(.945,'#000');gradient.addColorStop(1,'#0000');c.fillStyle=gradient;c.fillRect(0,0,layer.width,layer.height);}
 return layer;
}
export function paintParis(c,g,cx,cy,w,h,terrain){
 const b=ensureParisBattle(g),im=images.map;
 if(terrain){terrain.draw(c,{key:'rural',camera:{x:cx-w/2,y:cy-h/2},width:w,height:h});c.save();c.fillStyle='#15202a65';c.fillRect(0,0,w,h);c.restore();}
 if(!b||!im?.complete||!im.naturalWidth)return;
 mapLayer??=featherMap(im);
 const x=b.origin.x-PARIS_SIZE/2-(cx-w/2),y=b.origin.y-PARIS_SIZE/2-(cy-h/2);
 c.save();c.imageSmoothingEnabled=true;c.drawImage(mapLayer,x,y,PARIS_SIZE,PARIS_SIZE);c.restore();
}
export function drawParisBoss(c,b,addon){
 const fortress=b.assetKey==='paris-searchlight-fortress',set=fortress?'fortress':'staaken',a=fortress?0:(b.a||0)+Math.PI/2;
 const layout=PARIS_ART_LAYOUTS[set],clips=PARIS_PART_CLIPS[set],normal=images[set],damaged=images[set+'Wreck'];if(!normal?.naturalWidth)return;
 c.save();c.translate(b.x,b.y);c.rotate(a);c.imageSmoothingEnabled=true;
 const s=b.geometryScale||1;
 c.scale(s,s);
 const whole=im=>c.drawImage(im,-layout.width/2,-layout.height/2,layout.width,layout.height);
 // Foundations exclude the independently replaceable mounts. Live layers
 // retain exact source pixels; wreck layers retain broken machinery.
 c.save();c.beginPath();c.rect(-layout.width/2,-layout.height/2,layout.width,layout.height);
 for(const rect of Object.values(clips))c.rect(...rect);c.clip('evenodd');whole(normal);c.restore();
 for(const p of b.parts||[]){
  const wreck=p.destroyed||b.destroying,rect=clips[p.id];if(!rect)continue;
  c.save();c.beginPath();c.rect(...rect);c.clip();whole(wreck&&damaged?.naturalWidth?damaged:normal);c.restore();
  if(wreck){const x=(p.localX??p.x)/s,y=(p.localY??p.y)/s;
   if(p.id.startsWith('engine-')||p.id.startsWith('generator-'))fx(c,'fireEngine',x,y,32,44,0,.85);
   const drift=(((b.motionTime||0)*.35+x*.001)%1+1)%1;fx(c,'smokeDark',x,y-25-drift*50,28+drift*45,28+drift*45,0,(1-drift)*.48);
  }
 }
 if(fortress&&b.coreVulnerable&&!b.destroying){c.strokeStyle='#ead591';c.lineWidth=2;c.setLineDash([7,6]);c.beginPath();c.arc(layout.core.x,layout.core.y,layout.core.radius+9,0,Math.PI*2);c.stroke();c.setLineDash([]);}
 c.restore();
}
export function drawParisWorld(c,g,locale='ko'){
 const b=g.parisBattle;if(!b||b.role!=='defend')return;const en=locale==='en';
 c.save();c.font='12px system-ui';c.textAlign='center';c.lineWidth=1.5;
 for(const d of b.districts){c.strokeStyle=d.hp>0?'#b7dad590':'#d8876590';c.setLineDash([6,8]);c.beginPath();c.arc(d.x,d.y,62,0,Math.PI*2);c.stroke();c.setLineDash([]);c.fillStyle='#f0e4c7';c.fillText(en?d.en:d.name,d.x,d.y+79);
  if(d.hp<d.maxHp){fx(c,'fire',d.x,d.y,43,48,0,.6);fx(c,'smokeDark',d.x,d.y-38,67,72,0,.5);}}
 const q=g.stageBoss?.stages.encounter?.bodies.values().next().value;
 if(q?.runTarget){const d=q.runTarget;c.strokeStyle='#f5c178b0';c.setLineDash([8,9]);c.beginPath();c.moveTo(q.x,q.y);c.lineTo(d.x,d.y);c.stroke();c.setLineDash([]);c.beginPath();c.arc(d.x,d.y,78,0,Math.PI*2);c.stroke();c.fillStyle='#ffd69b';c.fillText((en?'DROP ':'투하 ')+(q.runRemaining/q.speedRatio()).toFixed(1)+'s',d.x,d.y-88);}
 c.restore();
}

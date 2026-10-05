import {fx} from './fx-art.js?v=485';
import {PARIS_SIZE,ensureParisBattle} from './paris-night-battle.js?v=485';
import {PARIS_ATLAS_RECTS} from './paris-night-atlas.js?v=485';
let images={};
export function releaseParisArt(){images={};}
export function prepareParisArt(){
 return Promise.all([['map','terrain-paris-night1918.webp'],['fortress','paris-fortress-parts1918.webp'],['staaken','paris-staaken-parts1918.webp']].map(([key,path])=>new Promise(resolve=>{
  const im=new Image();im.decoding='async';images[key]=im;im.onload=()=>resolve(true);im.onerror=()=>resolve(false);im.src='./'+path;
 })));
}
function sprite(c,set,index,x,y,w,h,angle=0){
 const im=images[set],r=PARIS_ATLAS_RECTS[set]?.[index];if(!im?.naturalWidth||!r)return;
 c.save();c.translate(x,y);c.rotate(angle);c.imageSmoothingEnabled=true;c.drawImage(im,...r,-w/2,-h/2,w,h);c.restore();
}
export function paintParis(c,g,cx,cy,w,h){
 const b=ensureParisBattle(g),im=images.map;c.fillStyle='#293039';c.fillRect(0,0,w,h);if(!b||!im?.naturalWidth)return;
 const x=b.origin.x-PARIS_SIZE/2-(cx-w/2),y=b.origin.y-PARIS_SIZE/2-(cy-h/2);
 c.save();c.imageSmoothingEnabled=true;c.drawImage(im,x,y,PARIS_SIZE,PARIS_SIZE);c.restore();
}
export function drawParisBoss(c,b,addon){
 const fortress=b.assetKey==='paris-searchlight-fortress',set=fortress?'fortress':'staaken',a=fortress?0:(b.a||0)+Math.PI/2;
 const beamAngles=new Map();if(fortress)addon?.hazards.pool.visit(h=>{if(h.kind==='searchlight'&&h.phase!=='waiting'){const id=h.tag?.split(':').at(-1);if(id)beamAngles.set(id,h.angle);}});
 c.save();c.translate(b.x,b.y);c.rotate(a);c.imageSmoothingEnabled=true;
 const s=b.geometryScale||1;
 // Foundations and airframes stay beneath independently replaceable mounts.
 sprite(c,set,b.destroying?1:0,0,0,(fortress?500:540)*s,(fortress?368:295)*s);
 for(const p of b.parts||[]){
  const wreck=p.destroyed||b.destroying;let index,w,h;
  if(fortress){
   if(p.id.startsWith('light-')){index=p.id==='light-main'?12:2;w=p.id==='light-main'?89:72;h=w;}
   else if(p.id==='generator'){index=4;w=86;h=76;}
   else if(p.id.startsWith('aa-')){index=6;w=78;h=78;}
   else if(p.id.startsWith('mg-')){index=8;w=65;h=48;}
   else {index=10;w=86;h=76;}
  }else{
   if(p.id.startsWith('engine-')){index=2;w=37;h=92;}
   else if(p.id==='gun-front'){index=4;w=31;h=36;}
   else if(p.id==='gun-top'){index=6;w=36;h=39;}
   else if(p.id==='gun-rear'){index=8;w=32;h=36;}
   else if(p.id==='gun-left'){index=10;w=39;h=27;}
   else if(p.id==='gun-right'){index=12;w=39;h=27;}
   else {index=14;w=43;h=57;}
  }
  const mountAngle=fortress&&p.id.startsWith('light-')?(beamAngles.get(p.id)??p.angle??Math.PI/2)-Math.PI/2:0;
  sprite(c,set,index+(wreck?1:0),p.localX??p.x,p.localY??p.y,w*s,h*s,mountAngle);
  if(wreck){const x=p.localX??p.x,y=p.localY??p.y;
   if(p.id.startsWith('engine-')||p.id==='generator')fx(c,'fireEngine',x,y,27,35,0,.85);
   const drift=((b.motionTime||0)*.35+index*.11)%1;fx(c,'smokeDark',x,y-25-drift*40,23+drift*30,23+drift*30,0,(1-drift)*.48);
  }
 }
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

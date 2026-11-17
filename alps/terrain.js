import {hash,clamp,sweptPolygon,positive} from './geometry.js';
export const TERRAIN_PROFILES=Object.freeze({
 rural:{name:'전원 지대',cell:0,base:'#424b3b',strength:.67},
 sea:{name:'아드리아해',cell:1,base:'#254555',strength:.66},
 trenches:{name:'참호 전선',cell:2,base:'#4c443b',strength:.62},
 sky:{name:'창공',cell:3,base:'#3d5367',strength:.46},
 city:{name:'도심 지대',cell:4,base:'#454746',strength:.60},
 alps:{name:'알프스 산맥',cell:5,base:'#414e56',strength:.43},
 channel:{name:'영국 해협',cell:6,base:'#304a56',strength:.59},
 desert:{name:'중동 사막',cell:7,base:'#71634a',strength:.58},
 night:{name:'야간 공습',cell:8,base:'#232b34',strength:.58},
 burning:{name:'불타는 전선',cell:9,base:'#433d37',strength:.57}
});
// Gameplay coordinates throughout are WORLD pixels. Camera is supplied by the host.
// Ten visual profiles do not register ten gameplay stages.
export class TerrainRenderer {
 constructor({atlas=null,tileSize=768,detail=1,canvasFactory}={}){this.atlas=atlas;this.tileSize=positive(tileSize,'tileSize');this.detail=clamp(detail,.25,1);this.tiles=new Map();this.canvasFactory=canvasFactory??((w,h)=>{const c=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(w,h):document.createElement('canvas');c.width=w;c.height=h;return c;});}
 setAtlas(atlas){this.atlas=atlas;this.tiles.clear();}
 setDetail(detail){this.detail=clamp(detail,.25,1);this.tiles.clear();}
 tile(key){if(this.tiles.has(key))return this.tiles.get(key);const p=TERRAIN_PROFILES[key];if(!p)throw new Error('Unknown terrain '+key);
  // Pre-render once at 160 logical pixels; suppress small high-frequency texture detail.
  const c=this.canvasFactory(160,160),g=c.getContext('2d');g.fillStyle=p.base;g.fillRect(0,0,160,160);
  if(this.atlas?.width){const col=p.cell%5,row=Math.floor(p.cell/5),x0=Math.round(col*this.atlas.width/5),x1=Math.round((col+1)*this.atlas.width/5),y0=Math.round(row*this.atlas.height/2),y1=Math.round((row+1)*this.atlas.height/2),inset=3;g.globalAlpha=p.strength*this.detail;g.imageSmoothingEnabled=true;g.drawImage(this.atlas,x0+inset,y0+inset,x1-x0-inset*2,y1-y0-inset*2,0,0,160,160);g.globalAlpha=1;}
  this.tiles.set(key,c);return c;
 }
 draw(ctx,{key,camera,width,height}){const tile=this.tile(key),s=this.tileSize;
  ctx.save();ctx.beginPath();ctx.rect(0,0,width,height);ctx.clip();ctx.imageSmoothingEnabled=false;ctx.fillStyle=TERRAIN_PROFILES[key].base;ctx.fillRect(0,0,width,height);
  for(let y=Math.floor(camera.y/s);y<=Math.floor((camera.y+height)/s);y++)for(let x=Math.floor(camera.x/s);x<=Math.floor((camera.x+width)/s);x++){
   // Mirrored repeats share the SAME boundary pixels on each edge, avoiding hard seams.
   const mx=Math.abs(x%2),my=Math.abs(y%2),dx=Math.floor(x*s-camera.x),dy=Math.floor(y*s-camera.y);ctx.save();ctx.translate(dx+(mx?s+1:-1),dy+(my?s+1:-1));ctx.scale(mx?-1:1,my?-1:1);ctx.drawImage(tile,0,0,s+2,s+2);ctx.restore();
  }ctx.restore();
 }
 dispose(){this.tiles.clear();this.atlas=null;}
}
export class MountainField {
 constructor({seed=17,cellSize=560,safeAreas=[],damageFraction=.30,cooldown=1.25,onDamage,onImpact=()=>{}}={}){
  if(typeof onDamage!=='function')throw new Error('Mountain onDamage adapter required');positive(cellSize,'cellSize');positive(cooldown,'cooldown');positive(damageFraction,'damageFraction');
  Object.assign(this,{seed,cellSize,safeAreas:safeAreas.map(s=>({...s})),damageFraction,cooldown,onDamage,onImpact});this.cache=new Map();this.contacts=new Map();this.time=0;
 }
 peak(cx,cy){const id=cx+':'+cy;if(this.cache.has(id)){const p=this.cache.get(id);this.cache.delete(id);this.cache.set(id,p);return p;}
  const s=this.cellSize,h=n=>hash(cx*11+n,cy,this.seed),r=s*(.09+h(1)*.035),x=(cx+.22+h(2)*.5)*s,y=(cy+.22+h(3)*.5)*s;
  let p=null;if(h(0)>.22&&!this.safeAreas.some(a=>Math.hypot(a.x-x,a.y-y)<a.radius+r+32)){
   const points=Array.from({length:12},(_,i)=>{const a=i*Math.PI/6,rr=r*(.80+h(i+10)*.20);return{x:x+Math.cos(a)*rr,y:y+Math.sin(a)*rr};});p={id,x,y,radius:r,points};
  }this.cache.set(id,p);if(this.cache.size>96)this.cache.delete(this.cache.keys().next().value);return p;
 }
 query({left,top,right,bottom}){const result=[],s=this.cellSize;for(let cy=Math.floor(top/s)-1;cy<=Math.floor(bottom/s)+1;cy++)for(let cx=Math.floor(left/s)-1;cx<=Math.floor(right/s)+1;cx++){const p=this.peak(cx,cy);if(p&&p.x+p.radius>=left&&p.x-p.radius<=right&&p.y+p.radius>=top&&p.y-p.radius<=bottom)result.push(p);}return result;}
 step(dt,{players,paused=false}){if(paused)return;if(!Number.isFinite(dt)||dt<0)throw new Error('Invalid dt');this.time+=dt;const present=new Set();
  for(const p of players){present.add(p.id);if(!p.alive){this.contacts.delete(p.id);continue;}const previous=this.contacts.get(p.id),a=p.teleported||!previous?{x:p.x,y:p.y}:previous;
   const next={x:p.x,y:p.y,nextHit:previous?.nextHit??0};this.contacts.set(p.id,next);if(this.time<next.nextHit)continue;
   const radius=p.radius??12;const peaks=this.query({left:Math.min(a.x,p.x)-radius,top:Math.min(a.y,p.y)-radius,right:Math.max(a.x,p.x)+radius,bottom:Math.max(a.y,p.y)+radius});
   const hit=peaks.find(q=>sweptPolygon(a,p,radius,q.points));if(hit){positive(p.maxHp,'player.maxHp');next.nextHit=this.time+this.cooldown;const info={kind:'terrain-peak',sourceId:'peak:'+hit.id,peak:hit,damageFraction:this.damageFraction};this.onDamage(p.id,p.maxHp*this.damageFraction,info);this.onImpact(p.id,info);}
  }for(const id of this.contacts.keys())if(!present.has(id))this.contacts.delete(id);
 }
 draw(ctx,{camera,width,height}){const peaks=this.query({left:camera.x-100,top:camera.y-100,right:camera.x+width+100,bottom:camera.y+height+100});ctx.save();ctx.translate(-camera.x,-camera.y);
  for(const p of peaks){const path=()=>{ctx.beginPath();p.points.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();};
   // Shadow extends downwind; only the outlined polygon is solid. No invisible broad collider.
   ctx.save();ctx.translate(22,27);path();ctx.fillStyle='#182a35aa';ctx.fill();ctx.restore();
   path();ctx.fillStyle='#59636b';ctx.fill();const apex={x:p.x-p.radius*.12,y:p.y-p.radius*.19};
   for(let i=0;i<p.points.length;i++){const a=p.points[i],b=p.points[(i+1)%p.points.length];ctx.beginPath();ctx.moveTo(apex.x,apex.y);ctx.lineTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.closePath();ctx.fillStyle=['#77828a','#69767f','#53626b','#46555e'][Math.floor(i/3)];ctx.fill();}
   // Snowcap kept below player white brightness, no strobing or bright grain.
   ctx.beginPath();ctx.moveTo(apex.x,apex.y-8);ctx.lineTo(p.x+p.radius*.26,p.y+p.radius*.15);ctx.lineTo(p.x,p.y);ctx.lineTo(p.x-p.radius*.27,p.y+p.radius*.10);ctx.closePath();ctx.fillStyle='#a9b6bb';ctx.fill();
   path();ctx.strokeStyle='#b5a580';ctx.lineWidth=2;ctx.stroke();
  }ctx.restore();return peaks;
 }
 reset(){this.contacts.clear();this.cache.clear();this.time=0;}
}

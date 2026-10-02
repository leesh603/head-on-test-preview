import {TREFFAS_ART} from './cambrai-layout.js?v=503';
const cache=new WeakMap();
function layers(image){
 if(cache.has(image))return cache.get(image);
 const base=document.createElement('canvas');base.width=image.naturalWidth;base.height=image.naturalHeight;
 const c=base.getContext('2d');c.drawImage(image,0,0);
 // Lift the approved gun barrel out of the connected sprite. The small roof
 // behind it is repaired from the adjacent plate on this same authored image.
 c.clearRect(581,54,47,131);c.drawImage(image,633,107,47,37,581,107,47,37);
 const gun=document.createElement('canvas');gun.width=47;gun.height=149;gun.getContext('2d').drawImage(image,581,54,47,149,0,0,47,149);
 const result={base,gun};cache.set(image,result);return result;
}
export function drawCambraiTreffas(c,b,intact,wreck){
 if(!intact?.naturalWidth)return false;
 const s=TREFFAS_ART.worldWidth/intact.naturalWidth,w=310,h=intact.naturalHeight*s,normal=layers(intact),damaged=wreck?.naturalWidth?layers(wreck):normal;
 const zones={'wheel-left':[0,60,305,1130],'wheel-right':[900,60,307,1130],turret:[385,42,440,340],rudder:[450,1010,315,265]},dead=id=>b.destroying||b.parts?.find(p=>p.id===id)?.destroyed;
 c.save();c.rotate(b.heading||0);c.imageSmoothingEnabled=true;
 c.save();c.beginPath();c.rect(-w/2,-h/2,w,h);for(const [id,[x,y,rw,rh]]of Object.entries(zones))if(dead(id))c.rect(x*s-w/2,y*s-h/2,rw*s,rh*s);c.clip('evenodd');c.drawImage(normal.base,-w/2,-h/2,w,h);c.restore();
 for(const [id,[x,y,rw,rh]]of Object.entries(zones))if(dead(id))c.drawImage(damaged.base,x,y,rw,rh,x*s-w/2,y*s-h/2,rw*s,rh*s);
 if(b.destroying)c.drawImage(damaged.base,-w/2,-h/2,w,h);
 // Only the ribbed centre of each drum moves. Rims, axles and hubs stay pinned.
 for(const [id,sx]of [['wheel-left',110],['wheel-right',990]])if(!dead(id)){
  const x=sx*s-w/2,y=230*s-h/2,tw=108*s,th=800*s,tile=116*s,shift=(((b.wheelRoll||0)*34)%tile+tile)%tile;
  c.save();c.beginPath();c.rect(x,y,tw,th);c.clip();for(let d=-tile;d<th;d+=tile)c.drawImage(intact,sx,464,108,116,x,y+d+shift,tw,tile);c.restore();
 }
 const turret=b.parts?.find(p=>p.id==='turret'),gun=dead('turret')?damaged.gun:normal.gun;
 c.save();c.translate((TREFFAS_ART.gunX-intact.naturalWidth/2)*s,(TREFFAS_ART.gunY-intact.naturalHeight/2)*s);c.rotate((b.gunAngle??-Math.PI/2)+Math.PI/2-(b.heading||0));c.translate(0,(turret?.recoil||0)*4);c.drawImage(gun,(581-TREFFAS_ART.gunX)*s,(54-TREFFAS_ART.gunY)*s,47*s,149*s);c.restore();c.restore();return true;
}
export function drawCambraiFlakWarning(c,b){
 const lock=b.flakLock;if(!lock)return;
 c.save();c.strokeStyle=lock.aligned?'#ffd39bb3':'#e0c39670';c.lineWidth=1.4;c.setLineDash([5,8]);
 for(const p of lock.points){c.beginPath();c.arc(p.x,p.y,lock.mode==='bracket'?34:32,0,Math.PI*2);c.stroke();}
 c.setLineDash([]);c.restore();
}

import {fx} from './fx-art.js?v=tame3';
import {TREFFAS_ART} from './cambrai-layout.js?v=tame3';

const cache=new WeakMap();
function layers(image){
 if(cache.has(image))return cache.get(image);
 const base=document.createElement('canvas');base.width=image.naturalWidth;base.height=image.naturalHeight;
 const c=base.getContext('2d');c.drawImage(image,0,0);
 // Lift the approved gun barrel out of the connected sprite. The small roof
 // behind it is repaired from the adjacent plate on this same authored image.
 c.clearRect(581,54,47,131);c.drawImage(image,633,107,47,37,581,107,47,37);
 const gun=document.createElement('canvas');gun.width=47;gun.height=149;gun.getContext('2d').drawImage(image,581,54,47,149,0,0,47,149);
 const treads=[110,990].map(sx=>{const surface=document.createElement('canvas');surface.width=108;surface.height=800;const context=surface.getContext('2d'),mask=context.createLinearGradient(0,0,0,800);for(const [stop,alpha]of [[0,0],[.14,1],[.86,1],[1,0]])mask.addColorStop(stop,`rgba(255,255,255,${alpha})`);return{sx,surface,context,mask};});
 const result={base,gun,treads};cache.set(image,result);return result;
}
export function drawCambraiTreffas(c,b,intact,wreck){
 if(!intact?.naturalWidth)return false;
 const s=TREFFAS_ART.worldWidth/intact.naturalWidth,w=310,h=intact.naturalHeight*s,normal=layers(intact),damaged=wreck?.naturalWidth?layers(wreck):normal;
 const zones={'wheel-left':[0,60,305,1130],'wheel-right':[900,60,307,1130],turret:[385,42,440,340],rudder:[450,1010,315,265]},dead=id=>b.destroying||b.parts?.find(p=>p.id===id)?.destroyed;
 c.save();c.rotate(b.heading||0);c.imageSmoothingEnabled=true;
 if(!b.destroying&&Math.abs(b.driveVelocity||0)>8)for(const [id,x]of [['wheel-left',-112],['wheel-right',112]])if(!dead(id)){
  const pulse=.5+.5*Math.sin((b.motionTime||0)*11+x);fx(c,'dustPuff',x,-Math.sign(b.driveVelocity)*142,38+pulse*8,24+pulse*5,0,.16);
 }
 c.save();c.beginPath();c.rect(-w/2,-h/2,w,h);for(const [id,[x,y,rw,rh]]of Object.entries(zones))if(dead(id))c.rect(x*s-w/2,y*s-h/2,rw*s,rh*s);c.clip('evenodd');c.drawImage(normal.base,-w/2,-h/2,w,h);c.restore();
 for(const [id,[x,y,rw,rh]]of Object.entries(zones))if(dead(id))c.drawImage(damaged.base,x,y,rw,rh,x*s-w/2,y*s-h/2,rw*s,rh*s);
 if(b.destroying)c.drawImage(damaged.base,-w/2,-h/2,w,h);
 // Roll the complete authored tread surface; keep caps, rims, bolts and axles
 // pinned to the approved drum. Smooth end masks preserve its curved lighting.
 for(const [i,id,roll]of [[0,'wheel-left',b.wheelRollLeft],[1,'wheel-right',b.wheelRollRight]])if(!dead(id)){
  const {sx,surface,context:tc,mask}=normal.treads[i],travel=(roll??b.wheelRoll??0)*34/s,start=((-travel%800)+800)%800,first=800-start;
  tc.clearRect(0,0,108,800);tc.drawImage(intact,sx,230+start,108,first,0,0,108,first);
  if(first<800)tc.drawImage(intact,sx,230,108,800-first,0,first,108,800-first);
  tc.globalCompositeOperation='destination-in';tc.fillStyle=mask;tc.fillRect(0,0,108,800);tc.globalCompositeOperation='source-over';
  c.drawImage(surface,sx*s-w/2,230*s-h/2,108*s,800*s);
 }
 const turret=b.parts?.find(p=>p.id==='turret'),gun=dead('turret')?damaged.gun:normal.gun;
 c.save();c.translate((TREFFAS_ART.gunX-intact.naturalWidth/2)*s,(TREFFAS_ART.gunY-intact.naturalHeight/2)*s);c.rotate((b.gunAngle??-Math.PI/2)+Math.PI/2-(b.heading||0));c.translate(0,(turret?.recoil||0)*4);c.drawImage(gun,(581-TREFFAS_ART.gunX)*s,(54-TREFFAS_ART.gunY)*s,47*s,149*s);c.restore();c.restore();return true;
}
export function drawCambraiFlakWarning(c,b){
 const lock=b.flakLock;if(!lock)return;
 for(const p of lock.points.slice(lock.index||0))impactMark(c,p.x,p.y,lock.mode==='bracket'?34:32,lock.aligned?.5:.1,{alpha:lock.aligned?1:.6});
}

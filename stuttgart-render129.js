import {drawEnemyProjectile} from './projectiles.js?v=510';
import {HANGAR} from './stuttgart129.js?v=510';
import {drawNavalWake} from './adriatic-boss-render.js?v=510';
import {fx} from './fx-art.js?v=510';
// Geometry masks remove the source canvas outside the drawn silhouette at render time.
// Never color-key gray pixels: doing so also erases metal highlights inside the ship.
export const SHIP_OUTLINE=[[.498,.007],[.504,.007],[.51,.026],[.538,.05],[.562,.08],[.60,.13],[.628,.161],[.661,.158],[.663,.165],[.642,.174],[.661,.206],[.674,.267],[.681,.343],[.697,.355],[.699,.403],[.683,.416],[.682,.441],[.724,.437],[.727,.444],[.698,.451],[.702,.482],[.688,.499],[.692,.537],[.700,.56],[.696,.61],[.695,.646],[.70,.66],[.695,.71],[.697,.74],[.69,.775],[.696,.81],[.685,.87],[.678,.90],[.663,.932],[.638,.955],[.613,.963],[.61,.974],[.57,.983],[.574,.991],[.565,.995],[.55,.986],[.455,.986],[.43,.995],[.42,.991],[.415,.98],[.358,.958],[.34,.94],[.321,.908],[.309,.873],[.303,.82],[.307,.775],[.298,.743],[.300,.709],[.306,.67],[.303,.628],[.304,.60],[.296,.575],[.300,.536],[.313,.511],[.302,.49],[.291,.475],[.289,.456],[.275,.443],[.28,.438],[.313,.445],[.315,.416],[.301,.401],[.301,.358],[.317,.348],[.326,.32],[.317,.294],[.326,.271],[.333,.23],[.341,.209],[.354,.18],[.339,.162],[.344,.156],[.365,.166],[.392,.131],[.436,.08],[.46,.05],[.489,.025]];
function shipPath(g,b){g.beginPath();SHIP_OUTLINE.forEach(([x,y],i)=>{const px=(x-.5)*b.width,py=(y-.5)*b.height;i?g.lineTo(px,py):g.moveTo(px,py);});g.closePath();}
export function drawSupportShip(g,b,images,{camera={x:0,y:0},debug=false}={}){
 if(!b||b.dead)return;g.save();g.translate(b.x-camera.x,b.y-camera.y);g.rotate(b.angle);g.imageSmoothingEnabled=false;
 drawNavalWake(g,b,b.width*.45,b.height);
 const atlas=images.damage,cell=atlas?.naturalWidth/2,drawFrame=(index)=>g.drawImage(atlas,index%2*cell,Math.floor(index/2)*cell,cell,cell,-b.width/2,-b.height/2,b.width,b.height);
 if(atlas?.naturalWidth&&b.hp<=b.maxHp*.28)drawFrame(b.wreck?3:2);
 else if(images.shipMat?.naturalWidth)g.drawImage(images.shipMat,-b.width/2,-b.height/2,b.width,b.height);
 else {g.save();shipPath(g,b);g.clip();g.drawImage(images.ship,-b.width/2,-b.height/2,b.width,b.height);g.restore();}
 if(b.phase===1)g.drawImage(images.cover,-HANGAR.w*b.width/2,(HANGAR.y-HANGAR.h/2)*b.height,HANGAR.w*b.width,HANGAR.h*b.height);
 for(const p of b.parts.values()){if(p.id==='cover')continue;
 if(p.hp<p.maxHp&&atlas?.naturalWidth){const index=p.hp<=0?2:1,sx=index%2*cell,sy=Math.floor(index/2)*cell;
  g.drawImage(atlas,sx+(p.nx+.5-p.rx)*cell,sy+(p.ny+.5-p.ry)*cell,p.rx*2*cell,p.ry*2*cell,(p.nx-p.rx)*b.width,(p.ny-p.ry)*b.height,p.rx*2*b.width,p.ry*2*b.height);
  if(p.hp<=0&&(p.id==='fuel'||p.id==='boiler')){const r=p.rx*b.width;fx(g,'fireEngine',p.nx*b.width,p.ny*b.height,r*2.4,r*2.4,0,b.wreck?.15:.5);fx(g,'smokeDark',p.nx*b.width,p.ny*b.height-r,r*3,r*3,0,.3);}
 }
 if(debug&&b.hittable(p)){g.strokeStyle='#efd4a2';g.lineWidth=1.5;g.beginPath();g.ellipse(p.nx*b.width,p.ny*b.height,p.rx*b.width,p.ry*b.height,0,0,Math.PI*2);g.stroke();}}
 g.restore();
 if(b.cover){const c=b.cover,scale=1+Math.sin(Math.min(1,c.age/1.8)*Math.PI)*.20;g.save();g.translate(c.x-camera.x,c.y-camera.y-c.age*55);g.rotate(c.angle);g.globalAlpha=Math.max(0,1-c.age/1.8);g.scale(scale,scale);g.drawImage(images.cover,-HANGAR.w*b.width/2,-HANGAR.h*b.height/2,HANGAR.w*b.width,HANGAR.h*b.height);g.restore();}
}
export function drawSupportEffects(g,b,{camera={x:0,y:0},screenScale=1}={}){if(!b)return;g.save();g.translate(-camera.x,-camera.y);
 b.projectiles.visit(p=>{if(p.kind==='flak'){if(p.age<0)return;if(p.age<p.warning){g.strokeStyle='#eab277';g.lineWidth=2;g.beginPath();g.arc(p.x,p.y,p.radius,-Math.PI/2,-Math.PI/2+Math.PI*2*p.age/p.warning);g.stroke();g.fillStyle='#bd7f3b22';g.beginPath();g.arc(p.x,p.y,p.radius,0,Math.PI*2);g.fill();}return;}
 drawEnemyProjectile(g,{enemy:true,life:1,visualType:'boss',vx:p.vx,vy:p.vy},p.x,p.y,0,screenScale);});
 b.effects.visit(f=>{const t=f.age/f.life;g.save();g.globalAlpha=1-t;g.translate(f.x,f.y);
 if(f.kind==='muzzle'&&fx(g,'muzzleHeavy',0,0,f.radius*3,f.radius*2,f.angle)){}
 else if(f.kind==='burst'&&fx(g,'shellBurst'+Math.min(3,Math.floor(t*4)),0,0,f.radius*2.5,f.radius*2.5)){}
 else if(f.kind==='wake'&&fx(g,'foamRing',0,0,f.radius*(1+t)*2,f.radius*(.5+t),f.angle)){}
 else if(f.kind==='muzzle'){g.rotate(f.angle);g.fillStyle='#ffdfa0';g.beginPath();g.moveTo(-3,-5);g.lineTo(28*(1-t),0);g.lineTo(-3,5);g.closePath();g.fill();}
 else if(f.kind==='debris'){g.rotate(f.age*4);g.fillStyle='#b49b6d';g.fillRect(-3,-2,7,4);}
 else if(f.kind==='wake'){g.rotate(f.angle);g.strokeStyle='#91b4be';g.lineWidth=3;for(let i=0;i<3;i++){g.beginPath();g.ellipse(0,i*7,f.radius*(.5+t),6+t*12,0,0,Math.PI*2);g.stroke();}}
 else {g.fillStyle=t<.3?'#ffd697':'#423c36';for(let i=0;i<7;i++){const a=i*2.4,r=f.radius*(.1+t*.5);g.beginPath();g.arc(Math.cos(a)*r,Math.sin(a)*r,f.radius*(.13+t*.2),0,Math.PI*2);g.fill();}g.strokeStyle='#ddac76';g.lineWidth=2;g.beginPath();g.arc(0,0,f.radius*(.3+t),0,Math.PI*2);g.stroke();}g.restore();});g.restore();}

import {fx} from './fx-art.js?v=tame3';
import {DRACHEN_MINES,DRACHEN_MG,drachenMuzzle} from './city-airship-combat378.js?v=gal1&ai=1018&sig=1019&boss=20261020b&phase=1021&cityart=20261022';

// Destination rects and cable eyes are measured in the existing boss layout.
// The canvas and collider use the same rig offset, scale and suspension origin.
const CELL_WIDTH=512,CELL_HEIGHT=416;
const RECTS=[[26,123,236,223],[194,46,540,337],[539,236,207,246]];
const EYES=[[[115.11,325.23],[154.62,325.23]],[[429.26,354.27],[503.08,354.27],[571.42,354.27]],[[606.74,459.2],[640.66,459.2]]];
const EMPTY_OFFSET=[0,0];
function stay(c,x,y,u,v,sag){
 c.beginPath();c.moveTo(x,y);
 c.bezierCurveTo(x+(u-x)*.31,y+sag,u-(u-x)*.31,v+sag,u,v);
 c.strokeStyle='#201a15';c.lineWidth=2.8;c.stroke();
 c.strokeStyle='#827464';c.lineWidth=.85;c.stroke();
}
function ageOf(b,p){
 return Math.max(0,(b.motionTime||0)-(p.destroyedAt||0)+(b.destroying?b.destructionAge||0:0));
}
function carrierStay(c,b,parts,offsets,left,right){
 const a=parts[left],z=parts[right],ea=EYES[left].at(-1),ez=EYES[right][0];
 const x=ea[0]+offsets[left][0],y=ea[1]+offsets[left][1],u=ez[0]+offsets[right][0],v=ez[1]+offsets[right][1];
 if(!a?.destroyed&&!z?.destroyed){stay(c,x,y,u,v,40);return;}
 if(!a||!z||a.destroyed&&z.destroyed)return;
 const age=ageOf(b,a.destroyed?a:z),life=.65;
 if(age>=life)return;
 const q=age/life,fromLeft=!a.destroyed,sx=fromLeft?x:u,sy=fromLeft?y:v;
 c.save();c.globalAlpha*=1-q;
 stay(c,sx,sy,sx+(fromLeft?1:-1)*34*(1-q*.65),sy+18+q*24,8);
 c.restore();
}
function drawGondolaGun(c,index,part,gun){
 const [x,y,reach]=DRACHEN_MG[index],angle=part?.angle??Math.PI/2;
 const dead=part?.destroyed,recoil=dead?0:part?.recoil||0;
 // The painted receiver center and muzzle center are (86,43) and (236,43).
 const k=reach/150;
 c.save();c.translate(x,y);c.rotate(angle);
 c.drawImage(gun,-86*k-2.4*recoil,-43*k,238*k,96*k);
 c.restore();
 if(!dead&&part?.gunFlash>0){
  const [mx,my]=drachenMuzzle(index,angle,recoil);
  fx(c,'fireFlash',mx,my,16,12,angle,Math.min(1,part.gunFlash/.12));
 }
}
export function drawDrachenRedraw(c,b,atlas,mine,gun){
 if(atlas?.naturalWidth!==3*CELL_WIDTH||atlas.naturalHeight!==3*CELL_HEIGHT||!mine?.naturalWidth||!mine.naturalHeight||gun?.naturalWidth!==238||gun.naturalHeight!==96)return false;
 const scale=b.cityArtScale||1,parts=[0,1,2].map(i=>b.parts?.find(p=>p.id==='airship-'+i));
 const offsets=parts.map((_,i)=>b.cityRigOffsets?.[i]||EMPTY_OFFSET);
 const mineHeight=48,mineWidth=mineHeight*mine.naturalWidth/mine.naturalHeight;
 c.save();c.translate(b.x,b.y);c.scale(scale,scale);c.translate(-384,-288);c.imageSmoothingEnabled=true;
 carrierStay(c,b,parts,offsets,0,1);carrierStay(c,b,parts,offsets,1,2);
 for(const i of [1,0,2]){
  const p=parts[i],dead=p?.destroyed,age=dead?ageOf(b,p):0,[ox,oy]=offsets[i];
  if(dead&&age>=1.8)continue;
  c.save();c.translate(ox,oy);
  if(dead){
   const x=p.x/scale+384-ox,y=p.y/scale+288-oy;
   c.globalAlpha*=1-age/1.8;c.translate(x,y+170*age*age);
   c.rotate((i===0?-1:1)*age*.19);c.scale(1-age*.12,1-age*.12);c.translate(-x,-y);
  }
  const frame=dead?2:p?.hp<p?.maxHp*.55?1:0;
  for(const [slot,[mx,my]] of DRACHEN_MINES[i].entries()){
   const [ex,ey]=EYES[i][slot];
   stay(c,ex,ey,mx,my-mineHeight*.46,4);
   c.drawImage(mine,mx-mineWidth/2,my-mineHeight/2,mineWidth,mineHeight);
  }
  c.drawImage(atlas,frame*CELL_WIDTH,i*CELL_HEIGHT,CELL_WIDTH,CELL_HEIGHT,...RECTS[i]);
  drawGondolaGun(c,i,p,gun);
  c.restore();
 }
 c.restore();
 return true;
}

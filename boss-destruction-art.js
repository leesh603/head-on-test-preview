import {drawMaterialFrame, materialRows} from './combat-material-art.js';
import {fx} from './fx-art.js?v=tame3';
import {drawFuelPocket} from './fx-sample-preview.js?v=pilotfx20261018&perf=1029&decode=1&warm=20261106&early=20261115&mem=20261117';

const clamp=value=>Math.max(0,Math.min(1,value));
const paint={
 fabric:[materialRows.linen,1.3,.74,'profileWing'],
 plate:[materialRows.metal,1,.72,'armorSpark'],
 fuel:[materialRows.fuel,1.42,.86,'fireEngine'],
 air:[materialRows.air,1,1,'profileAir1'],
 charge:[materialRows.powder,1.15,.8,'profileAmmo1'],
 water:[materialRows.water,1.23,1,'splashShell']
};

// The caller supplies an impact centre in its own coordinate space. Smoke and
// steam advect from that centre. The painted directional rows use a root pivot.
export function drawWreckMaterial(c,material,x,y,size,progress,angle=0){
 if(progress<0||progress>=1)return;
 const q=clamp(progress),fade=clamp((1-q)/.3);
 if(material==='bed'){
  if(drawFuelPocket(c,x,y,size,q,angle,fade))return;
  material='fuel';
 }
 if(material==='steam'||material==='soot'||material==='dust'){
  const steam=material==='steam',dust=material==='dust',drift=size*q*(dust?.32:.57);
  const width=size*(.44+q*(dust?.79:.55)),height=width*(steam?.72:dust?.54:.85);
  const key=steam?'smokeWisp':dust?'profileDust':'profileOil';
  if(steam){
   const root=size*(.32+q*.25);
   fx(c,'smokePuff',x,y,root,root*.79,angle+.7,Math.min(1,q*16)*fade*.76);
  }
  fx(c,key,x+Math.cos(angle)*drift,y+Math.sin(angle)*drift,width,height,angle,Math.min(1,q*15)*fade*(steam?.73:.67));
  return;
 }
 const [row,w,h,fallback]=paint[material];
 const frame=q<.12?0:q<.34?1:q<.64?2:3;
 const spread=size*(.77+q*.26);
 if(!drawMaterialFrame(c,row,frame,x,y,spread*w,spread*h,angle,fade))
  fx(c,fallback,x,y,spread*w,spread*h,angle,fade);
}

const sea=['water','plate','charge','soot','water'];
const air=['fabric','fuel','air','soot','plate'];
const offsets=[.08,.17,0,.20,.29];

export function drawIntrusionBreak(c,f,x,y,radius,age){
 const beat=f.wreckBeat,d=radius||f.radius;
 const material=f.wreckMaterial==='sea'?sea[beat]:f.wreckMaterial==='airframe'?air[beat]:f.wreckMaterial;
 const delay=beat>=0?offsets[beat]:0;
 const q=(age-delay)/(f.maxLife-delay);
 if(q<0||q>=1)return true;
 const a=f.wreckAngle||0;
 const span=d*(material==='air'?1.87:material==='water'?1.66:material==='soot'?1.43:1.24);
 drawWreckMaterial(c,material,x,y,span,q,a);
 if((material==='air'||material==='charge'||material==='fuel')&&q>.22){
  drawWreckMaterial(c,'soot',x,y,span*.9,(q-.22)/.78,a+.34);
 }
 return true;
}

// The carrier's forward guns fail before the deck stores catch. The factory
// vents at the boiler, loses its drive and burns through its production line.
// Entries refer to the authored socket on the rotating chassis.
const carrierCues=[
 ['main-left','plate',0,.74,130,-.75],['deck','bed',.14,1.7,258,2.62],
 ['aa-bridge','soot',.65,1.8,153,-1.2],['main-right','charge',1.18,.94,172,1.1],
 ['crane','plate',2.12,.82,134,-1.22],['track-main-left','dust',2.68,1.5,165,2.5],
 ['core','air',3.04,1,220,.34],['deck','soot',3.52,2.43,205,-1.95],
 ['core','bed',4.42,1.5,218,-2.31]
];
const factoryCues=[
 ['boiler','steam',0,1.72,190,-1.43],['production-left','plate',.06,.9,120,2.4],
 ['turret-right','charge',.86,.74,90,.37],['boiler','steam',1.27,1.9,181,-1.67],
 ['production-right','bed',2.04,1.75,157,.31],['track-left','dust',2.69,1.65,139,2.61],
 ['crane','plate',3.31,.79,104,-1.1],['production-left','charge',4.34,1.09,153,2.78],
 ['boiler','soot',4.75,2.17,168,-1.67],['production-right','bed',5.55,1.36,144,-2.67]
];
export function drawFinalCollapse(c,s,transform){
 if(!s.defeat)return;
 const t=s.defeat.elapsed;
 for(const [id,material,at,life,size,angle] of s.variant==='factory'?factoryCues:carrierCues){
  if(t<at||t>=at+life)continue;
  const part=s.parts.find(p=>p.id===id);if(!part)continue;
  const w=transform(s,part.x,part.y);
  drawWreckMaterial(c,material,w.x,w.y,size,(t-at)/life,s.a+angle);
 }
}

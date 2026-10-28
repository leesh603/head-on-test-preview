import {MAAN_LAYOUT} from './maan-layout.js?v=headon-result339-20261028';

// Keep both authored atlas cells on their common axis. The ownership field is
// independent of health, so rebuilding a wreck never redoes the geometry scan.
const fields=new Map(),frames=new WeakMap();
const SCALE=2,FEATHER=2;
function ownership(kind){
 let field=fields.get(kind);if(field)return field;
 const l=MAAN_LAYOUT[kind],width=l.width*SCALE,height=l.height*SCALE,owners=new Uint8Array(width*height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  let best=Infinity,index=0;
  for(let i=0;i<l.parts.length;i++){
   const p=l.parts[i],d=((x/SCALE+.25-l.width/2-p[1])/p[3])**2+((y/SCALE+.25-l.height/2-p[2])/p[4])**2;
   if(d<best){best=d;index=i;}
  }
  owners[y*width+x]=index;
 }
 field={width,height,owners};fields.set(kind,field);return field;
}
function canvas(width,height){const c=document.createElement('canvas');c.width=width;c.height=height;return c;}
export function maanHullFrame(image,body){
 if(!image.naturalWidth)return null;
 const l=body.layout,cw=image.naturalWidth/2;
 if(body.dead)return {image,x:cw,y:0,width:cw,height:image.naturalHeight};
 const states=l.parts.map(([id])=>{const p=body.parts.get(id);return p?.destroyed?2:p&&p.hp<=p.maxHp*.5?1:0;});
 if(!states.some(Boolean))return {image,x:0,y:0,width:cw,height:image.naturalHeight};
 const signature=states.join(''),old=frames.get(body);
 if(old?.source===image&&old.signature===signature)return old.frame;
 const {width,height,owners}=ownership(body.kind),mask=canvas(width,height),mc=mask.getContext('2d'),pixels=mc.createImageData(width,height);
 for(let i=0;i<owners.length;i++)pixels.data[i*4+3]=states[owners[i]]===2?255:states[owners[i]]===1?160:0;
 mc.putImageData(pixels,0,0);
 // Feather only the state boundary. Rendering at twice world resolution keeps
 // rivets and torn silhouettes sharp, while avoiding the old 4px stair steps.
 const feather=canvas(width,height),fc=feather.getContext('2d');fc.filter=`blur(${FEATHER*SCALE}px)`;fc.drawImage(mask,0,0);fc.filter='none';
 const wreck=canvas(width,height),wc=wreck.getContext('2d');wc.drawImage(image,cw,0,cw,image.naturalHeight,0,0,width,height);wc.globalCompositeOperation='destination-in';wc.drawImage(feather,0,0);
 const result=canvas(width,height),rc=result.getContext('2d');rc.drawImage(image,0,0,cw,image.naturalHeight,0,0,width,height);rc.globalCompositeOperation='destination-out';rc.drawImage(feather,0,0);
 // Add premultiplied layers: source-over would leave healthy steel showing
 // through holes in the authored wreck cell.
 rc.globalCompositeOperation='lighter';rc.drawImage(wreck,0,0);rc.globalCompositeOperation='source-over';
 const frame={image:result,x:0,y:0,width,height};frames.set(body,{source:image,signature,frame});return frame;
}
export function drawMaanHullFrame(c,frame,l){if(frame)c.drawImage(frame.image,frame.x,frame.y,frame.width,frame.height,-l.width/2,-l.height/2,l.width,l.height);}

// Only the steel protruding outside each sponson moves. The carriage, flags
// and deck remain in the authored hull. The centre Sinai pair is static art.
export const MAAN_BARRELS=Object.freeze({
 wustenpanzer:[['sponson-left',-118,-19,30,8,-1],['sponson-right',88,-19,30,8,1]],
 'sinai-landship':[['sponson-left-front',-113,-129,22,10,-1],['sponson-right-front',91,-129,22,10,1],['sponson-left-rear',-122,75,26,10,-1],['sponson-right-rear',96,75,26,10,1]]
});
export function maanBarrelMotion(body){return (MAAN_BARRELS[body.kind]||[]).filter(([id])=>!body.dead&&!body.parts.get(id)?.destroyed&&(body.parts.get(id)?.gunFlash||0)>0).map(row=>[...row,Math.sin(Math.min(1,body.parts.get(row[0]).gunFlash/.14)*Math.PI)*2.6]);}
export function drawMaanBarrels(c,frame,l,motions){
 if(!frame)return;
 for(const [,x,y,w,h,side,recoil]of motions){
  c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
  c.drawImage(frame.image,frame.x+(x+l.width/2)/l.width*frame.width,frame.y+(y+l.height/2)/l.height*frame.height,w/l.width*frame.width,h/l.height*frame.height,x-side*recoil,y,w,h);c.restore();
 }
}

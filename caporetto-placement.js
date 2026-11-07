import {caporettoWorldToScreen} from './caporetto-terrain.js?v=09c75d146ae4289d';
// Art-worker inspected native-source rectangles. Decoration only, NOT a navmesh
// or destructible mission targets. Widths are calibrated at map scale 1.5.
export const CAPORETTO_DECOR=Object.freeze([
 {id:'north-post',slot:[350,568,30,24],src:'props.webp',sourceRect:[1512,142,520,429],worldWidth:24},
 {id:'central-hut',slot:[357,617,34,28],src:'hut.webp',sourceRect:[512,129,446,765],worldWidth:24},
 {id:'south-tent',slot:[464,709,26,22],src:'props.webp',sourceRect:[872,108,429,489],worldWidth:24}
].map(p=>Object.freeze({...p,slot:Object.freeze(p.slot),sourceRect:Object.freeze(p.sourceRect)})));
export function caporettoDecorBounds(p,map){const [x,y,w,h]=p.slot,k=map.worldScale,width=p.worldWidth*k/1.5,height=width*p.sourceRect[3]/p.sourceRect[2];return{x:(x+w/2)*k-width/2,y:(y+h/2)*k-height/2,width,height};}
export function caporettoDecorFits(p,map){const r=caporettoDecorBounds(p,map),[x,y,w,h]=p.slot,k=map.worldScale;return r.x>=x*k&&r.y>=y*k&&r.x+r.width<=(x+w)*k&&r.y+r.height<=(y+h)*k;}
export function drawCaporettoDecor(ctx,camera,map,images){let count=0;ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';for(const p of CAPORETTO_DECOR){const im=images[p.src];if(!im?.naturalWidth||!caporettoDecorFits(p,map))continue;const b=caporettoDecorBounds(p,map),q=caporettoWorldToScreen(b.x,b.y,camera),w=b.width*camera.zoom,h=b.height*camera.zoom;if(q.x+w<0||q.y+h<0||q.x>camera.width||q.y>camera.height)continue;ctx.drawImage(im,...p.sourceRect.map(v=>v/2),q.x,q.y,w,h);count++;}ctx.restore();return count;}

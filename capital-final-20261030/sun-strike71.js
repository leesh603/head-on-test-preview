import {fxTint} from './fx-art.js?v=capital-final-20261030';
import {isAlbatrosHunter,drawAlbatrosWorld,drawAlbatrosLocal} from './albatros-hunter-fx.js';

// Legacy solo entry: the shared signature view normally draws this already.
// A missing signature view still receives the same restrained painted effect.
export function drawSunStrike(c,g,w,h){
 if(!isAlbatrosHunter(g)||g.hp<=0||g.skillTime<=0||globalThis.__hoSun?.has(g))return;
 const tex=(c,key,x,y,width,height,a,alpha,color)=>fxTint(c,key,color,x,y,width,height,a,alpha);
 c.save();try{c.globalCompositeOperation='source-over';c.translate(w/2,h/2);drawAlbatrosWorld(c,g,tex);c.rotate(g.a);drawAlbatrosLocal(c,g,tex);}finally{c.restore();}
}

// Native production-renderer review, not a browser screenshot or touch/FPS test.
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {createCanvas,Image:NativeImage}=require(process.env.CANVAS_MODULE||'@napi-rs/canvas');
const root=resolve('.'),out=resolve(process.env.QA_OUTPUT||'qa/verdun-r9');
mkdirSync(out,{recursive:true});
globalThis.document={createElement:()=>createCanvas(1,1)};
globalThis.location={search:'',href:'file://'+root+'/index.html'};
globalThis.Image=class extends NativeImage{
 get naturalWidth(){return this.width}get naturalHeight(){return this.height}
 set src(value){if(value)super.src=value.startsWith('file:')?fileURLToPath(value.split('?')[0]):resolve(root,value.split('?')[0]);}
};
const {FortDouaumont,FortSouville,verdunFortExtents}=await import('../verdun-fortresses.js');
const {prepareVerdunAssets,paintVerdun,drawVerdunFort}=await import('../verdun-art.js');
const {fxArtReady}=await import('../fx-art.js');
await prepareVerdunAssets();await fxArtReady;
function body(Ctor,state){
 const b=new Ctor({id:'review',x:0,y:0,tuning:{maxHp:4000,damage:20,bulletSpeed:260,verdunScale:1},emit(){}});
 for(const p of b.parts.values()){
  p.angle=Math.atan2(380-p.y,-p.x);p.active=true;p.revealed=true;p.openAmount=1;p.damageBlend=1;
  if(state==='damaged')p.hp=p.maxHp*.4;
  if(state==='destroyed')p.hp=0;
 }
 if(state==='destroyed'){b.dead=true;b.hp=0;}
 return b;
}
for(const Ctor of [FortDouaumont,FortSouville]){
 const cv=createCanvas(1600,1160),c=cv.getContext('2d');
 c.fillStyle='#191c1b';c.fillRect(0,0,1600,1160);
 for(const [i,state]of ['intact','damaged','destroyed'].entries()){
  const b=body(Ctor,state),ext=verdunFortExtents(b),factor=Math.min(1500/(ext.halfWidth*2),325/(ext.halfHeight*2));
  c.save();c.translate(800,85+i*380+150);c.scale(factor,factor);drawVerdunFort(c,b);c.restore();
  c.fillStyle='#e2d7c0';c.font='22px sans-serif';c.fillText(`${b.kind} / ${state.toUpperCase()} — native renderer`,24,34+i*380);
 }
 writeFileSync(out+'/'+body(Ctor,'intact').kind+'-states.webp',cv.encodeSync('webp',90));
 const b=body(Ctor,'intact'),focus=b.parts.get(Ctor===FortDouaumont?'heavy-left':'pit-left');
 const phone=createCanvas(390,844),p=phone.getContext('2d');
 paintVerdun(p,{},focus.x,focus.y,390,844);p.save();p.translate(195-focus.x,422-focus.y);drawVerdunFort(p,b);p.restore();
 writeFileSync(out+'/'+b.kind+'-mobile-gun.webp',phone.encodeSync('webp',90));
}
console.log('Saved native renderer state sheets and 390x844 gun views to '+out);

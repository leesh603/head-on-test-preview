// Optional native Canvas pixel QA. This does not certify browser/device FPS.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const {createCanvas,loadImage,GlobalFonts}=require(process.env.HEADON_QA_CANVAS||'@napi-rs/canvas');
const qaFont=process.env.HEADON_QA_FONT||'/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
if(existsSync(qaFont))GlobalFonts.registerFromPath(qaFont,'Maan QA');
globalThis.document={createElement:()=>createCanvas(1,1)};
const {MAAN_LAYOUT}=await import('../maan-layout.js');
const {maanHullSprite,MAAN_DAMAGE_PANELS}=await import('../maan-art.js?v=maan-r3');
const out=process.env.HEADON_QA_OUT||resolve(root,'qa/maan-r3');mkdirSync(out,{recursive:true});
const results=[];
for(const [kind,name] of [['wustenpanzer','wusten'],['sinai-landship','sinai']]){
 const im=await loadImage(readFileSync(resolve(root,`boss-maan-${name}-r3.webp`)));
 Object.defineProperties(im,{naturalWidth:{value:im.width},naturalHeight:{value:im.height}});
 const l=MAAN_LAYOUT[kind],b={kind,layout:l,parts:new Map(l.parts.map(p=>[p[0],{id:p[0],hp:100,maxHp:100,destroyed:false}]))};
 const intact=maanHullSprite(b,im),original=intact.getContext('2d').getImageData(0,0,l.width,l.height).data;
 const sheet=createCanvas(l.width*6,l.height*Math.ceil(b.parts.size/2)),c=sheet.getContext('2d');let slot=0;
 for(const part of b.parts.values()){
  part.hp=40;const damaged=maanHullSprite(b,im);
  assert.equal(maanHullSprite(b,im),damaged,'steady damage reuses composed canvas');
  part.destroyed=true;const wreck=maanHullSprite(b,im);assert.notEqual(wreck,damaged);
  const dp=damaged.getContext('2d').getImageData(0,0,l.width,l.height).data,wp=wreck.getContext('2d').getImageData(0,0,l.width,l.height).data;
  const [px,py,pw,ph]=MAAN_DAMAGE_PANELS[kind][part.id];let changed=0,distinct=0;
  for(let y=0;y<l.height;y++)for(let x=0;x<l.width;x++){
   const i=(y*l.width+x)*4,inside=x>=Math.floor(px+l.width/2)&&x<Math.ceil(px+l.width/2+pw)&&y>=Math.floor(py+l.height/2)&&y<Math.ceil(py+l.height/2+ph);
   for(let k=0;k<4;k++){
    if(!inside){assert.equal(dp[i+k],original[i+k],`${kind}/${part.id}: damage escaped its panel`);assert.equal(wp[i+k],original[i+k]);}
    else{changed+=wp[i+k]!==original[i+k]?1:0;distinct+=wp[i+k]!==dp[i+k]?1:0;}
   }
  }
  assert(changed>100,part.id+' destruction must be visible');assert(distinct>100,part.id+' destroyed state must differ from damaged');
  const x=slot%2*l.width*3,y=Math.floor(slot/2)*l.height;
  c.drawImage(intact,x,y);c.drawImage(damaged,x+l.width,y);c.drawImage(wreck,x+l.width*2,y);
  c.fillStyle='#faf0d7';c.font='13px "Maan QA"';c.fillText(part.id,x+8,y+l.height-8);
  results.push({kind,part:part.id,changedChannels:changed,damageVsDestroyedChannels:distinct,unaffectedPanelsExact:true});
  part.hp=100;part.destroyed=false;slot++;
 }
 b.dead=true;const dead=maanHullSprite(b,im),expected=createCanvas(l.width,l.height);
 expected.getContext('2d').drawImage(im,im.width*2/3,0,im.width/3,im.height,0,0,l.width,l.height);
 assert.deepEqual(dead.getContext('2d').getImageData(0,0,l.width,l.height).data,expected.getContext('2d').getImageData(0,0,l.width,l.height).data);
 writeFileSync(resolve(out,`parts-${name}.webp`),await sheet.encode('webp',93));
}
writeFileSync(resolve(out,'art-pixel-results.json'),JSON.stringify(results,null,2));
console.log(JSON.stringify({partsVerified:results.length,unaffectedPanelsExact:true,deadUsesFullWreck:true}));

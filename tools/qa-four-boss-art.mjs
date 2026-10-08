// Offline production Canvas renderer inspection. This is not browser gameplay.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),{createCanvas,Image}=require('@napi-rs/canvas');
const root=fileURLToPath(new URL('../',import.meta.url)),out=root+'qa/four-boss-art';mkdirSync(out,{recursive:true});
globalThis.document={createElement:()=>createCanvas(1,1)};
globalThis.location={search:''};
globalThis.Image=class extends Image{
 get naturalWidth(){return this.width}get naturalHeight(){return this.height}
 addEventListener(type,fn){if(type==='load')this.onload=fn;if(type==='error')this.onerror=fn;}
 set src(v){
  try{super.src=readFileSync(String(v).startsWith('file:')?fileURLToPath(new URL(String(v).split('?')[0])):root+String(v).replace(/^\.\//,'').split('?')[0]);}
  catch(e){queueMicrotask(()=>this.onerror?.(e));}
 }
};
const {fixture}=await import('../tests/stageboss-fixture94.mjs');
const {prepareStageBossAssets,drawStageBoss}=await import('../stageboss-view.js');
const {fxArtReady}=await import('../fx-art.js');await fxArtReady;
const load=async name=>{const im=new Image();im.src=readFileSync(root+name);await im.decode();return im;};
const terrain=await load('terrain-trenches359r2.webp');
const bg=(c,w,h,sea)=>{c.fillStyle=sea?'#263e4b':'#443d30';c.fillRect(0,0,w,h);if(!sea){const pattern=c.createPattern(terrain,'repeat');c.fillStyle=pattern;c.fillRect(0,0,w,h);}};
const draw=(c,f,w,h,x=0,y=0,zoom=1)=>drawStageBoss(c,{stageBoss:f.addon,x,y,camera:{zoom},t:10,region:f.addon.stages.stageIndex,bossBuildings:[]},w,h,{layer:'bodies',drawZeppelin(){},drawFieldArt(){}});
const files=[];
for(const [region,faction,name]of [[3,'entente','minenwerfer'],[3,'central','livens'],[1,'central','zubian'],[1,'entente','stuttgart']]){
 await prepareStageBossAssets(region);const f=fixture({stageIndex:region,teamFaction:faction});const e=f.addon.startBoss({x:0,y:0}),b=[...e.bodies.values()][0];
 if(name==='minenwerfer')for(const p of b.parts.values())p.discovered=true;
 if(name==='livens'){b.nozzleRevealed=true;b.trenchScale=1;b.nozzleAngle=-Math.PI/2;}
 if(name==='stuttgart'){b.support129.time=5;b.support129.phase=2;b.sync129();}
 for(const state of name==='minenwerfer'?['idle','left-recoil','center-recoil','right-recoil','damaged','wreck']:name==='zubian'?['intact','splitting']:name==='stuttgart'?['intact','closed','damaged']:['intact']){
  const cv=createCanvas(1000,800),c=cv.getContext('2d');bg(c,1000,800,region===1);
  let cameraX=0,cameraY=0;if(name==='minenwerfer'){
   const p=b.parts.get('main-gun');cameraX=p.x;cameraY=p.y;
   p.mortarRecoil=state.includes('recoil')?.2:0;p.mortarTube=['left-recoil','center-recoil','right-recoil'].indexOf(state);
   p.hp=state==='wreck'?0:state==='damaged'?p.maxHp*.4:p.maxHp;
  }
  if(state==='splitting'){b.phase='splitting';b.splitGap=50;b.stateAge=.5;}
  if(name==='stuttgart'){const ship=b.support129;ship.phase=state==='closed'?1:2;ship.hp=state==='damaged'?ship.maxHp*.2:ship.maxHp;b.sync129();}
  draw(c,f,1000,800,cameraX,cameraY,1);
  c.fillStyle='#e7d9b6';c.font='20px sans-serif';c.fillText(name+' / '+state+' / production renderer',22,32);
  const path=out+'/'+name+'-'+state+'.webp';writeFileSync(path,await cv.encode('webp',95));files.push(path);
 }
 f.addon.dispose();
}
const board=createCanvas(1800,1440),c=board.getContext('2d');c.fillStyle='#111b20';c.fillRect(0,0,1800,1440);
for(const [file,x,y]of [['minenwerfer-idle',0,0],['minenwerfer-center-recoil',900,0],['zubian-intact',0,480],['stuttgart-intact',900,480],['livens-intact',0,960],['minenwerfer-wreck',900,960]])c.drawImage(await load('qa/four-boss-art/'+file+'.webp'),x,y,900,480);
writeFileSync(out+'/review.webp',await board.encode('webp',95));
console.log(`Rendered ${files.length} production states plus review.webp (offline; no browser performance claim)`);
process.exit(0);

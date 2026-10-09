// Exercise the integrated game renderer, including asset loading and body dispatch.
// Native Canvas verification; browser and device performance are separate checks.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{createCanvas,Image}=require('@napi-rs/canvas');
const root=fileURLToPath(new URL('../',import.meta.url)),out=root+'qa/minenwerfer-integrated';mkdirSync(out,{recursive:true});
globalThis.document={createElement:()=>createCanvas(1,1)};
globalThis.location={search:''};
globalThis.Image=class extends Image{
 get naturalWidth(){return this.width}get naturalHeight(){return this.height}
 addEventListener(type,fn){if(type==='load')this.onload=fn;if(type==='error')this.onerror=fn;}
 set src(v){try{super.src=readFileSync(String(v).startsWith('file:')?fileURLToPath(new URL(String(v).split('?')[0])):root+String(v).replace(/^\.\//,'').split('?')[0]);}catch(e){queueMicrotask(()=>this.onerror?.(e));}}
};
const {fixture}=await import('../tests/stageboss-fixture94.mjs');
const {prepareStageBossAssets,drawStageBoss}=await import('../stageboss-view.js');
const {MINEN_ART,MINEN_TUBES}=await import('../minenwerfer-art-layout.js');
const {fxArtReady}=await import('../fx-art.js');await fxArtReady;await prepareStageBossAssets(3);
const terrain=new Image();terrain.src=readFileSync(root+'terrain-trenches359r2.webp');await terrain.decode();
const f=fixture({stageIndex:3,teamFaction:'entente'}),enc=f.addon.startBoss({x:0,y:0}),b=[...enc.bodies.values()][0];
for(const p of b.parts.values())p.discovered=true;
const paint=(p,w=1000,h=800)=>{
 const cv=createCanvas(w,h),c=cv.getContext('2d');c.fillStyle=c.createPattern(terrain,'repeat');c.fillRect(0,0,w,h);
 drawStageBoss(c,{stageBoss:f.addon,x:b.x+p.x,y:b.y+p.y,camera:{zoom:1},t:0,region:3,bossBuildings:[]},w,h,{layer:'bodies',drawZeppelin(){},drawFieldArt(){}});
 return cv;
};
const results=[];
for(const [w,h]of [[1000,800],[390,844]])for(const p of b.parts.values()){
 p.mortarRecoils=[0,0,0];p.mortarFlash=0;p.mortarSmoke=0;
 const idle=paint(p,w,h).getContext('2d').getImageData(0,0,w,h).data;
 for(let tube=0;tube<3;tube++){
  p.mortarRecoils=[0,0,0];p.mortarRecoils[tube]=MINEN_ART.recoilDuration-MINEN_ART.recoilKick;
  const active=paint(p,w,h).getContext('2d').getImageData(0,0,w,h).data,t=MINEN_TUBES[tube];let changed=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=(y*w+x)*4;if(idle[i]===active[i]&&idle[i+1]===active[i+1]&&idle[i+2]===active[i+2]&&idle[i+3]===active[i+3])continue;
   assert(x>=w/2+t.x-56&&x<=w/2+t.x+56&&y>=h/2+t.barrelY-56&&y<h/2+(tube===1?31:20),`stationary pixels moved: ${p.id}/${tube} ${x},${y}`);changed++;
  }
  assert(changed>0,`integrated renderer never animated ${p.id}/${tube}`);
  results.push({viewport:[w,h],part:p.id,tube,changedPixels:changed,stationaryPixelChanges:0});
 }
 p.mortarRecoils=[0,0,0];
}
const p=b.parts.get('main-gun');
for(const state of ['idle','damaged','wreck']){
 p.hp=state==='wreck'?0:state==='damaged'?p.maxHp*.4:p.maxHp;
 writeFileSync(out+'/'+state+'.webp',await paint(p).encode('webp',94));
}p.hp=p.maxHp;
const frames=mkdtempSync(join(tmpdir(),'minen-game-'));for(let frame=0;frame<78;frame++){
 const time=frame/30;p.mortarRecoils=[.2,1,1.8].map(start=>time>=start?Math.max(0,MINEN_ART.recoilDuration-(time-start)):0);
 writeFileSync(frames+'/'+String(frame).padStart(3,'0')+'.png',await paint(p,650,490).encode('png'));
}
const ff=spawnSync('ffmpeg',['-y','-loglevel','error','-framerate','30','-i',frames+'/%03d.png','-filter_complex','[0:v]split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3','-loop','0',out+'/recoil.gif'],{encoding:'utf8'});assert.equal(ff.status,0,ff.stderr);rmSync(frames,{recursive:true,force:true});
writeFileSync(out+'/results.json',JSON.stringify({source:'stageboss-view.js → drawStageBoss → drawMinenInstallation',results,limitations:['Native Canvas, not browser gameplay or physical-device performance']},null,2));
console.log('PASS integrated body dispatch: 18 tube/viewport checks; stationary pixels unchanged');f.addon.dispose();process.exit(0);

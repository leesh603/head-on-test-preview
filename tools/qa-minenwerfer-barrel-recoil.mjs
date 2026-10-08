// Offline production renderer QA, not a browser gameplay/performance claim.
import {createRequire} from 'node:module';
import {mkdirSync,mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {drawMinenInstallation} from '../minenwerfer-art-render.js';
import {MINEN_ART} from '../minenwerfer-art-layout.js';
const require=createRequire(import.meta.url),{createCanvas,Image}=require('@napi-rs/canvas');
const root=fileURLToPath(new URL('../',import.meta.url)),out=root+'qa/minenwerfer-barrel-recoil',frames=mkdtempSync(join(tmpdir(),'headon-minen-recoil-'));mkdirSync(out,{recursive:true});
const load=async name=>{const im=new Image();im.src=readFileSync(root+name);await im.decode();return im;};
const images={base:await load('boss-minenwerfer-base-20261009.webp'),barrels:await load('boss-minenwerfer-barrels-20261009.webp'),damage:await load('boss-minenwerfer-damage-20261008.webp')};
const terrain=await load('terrain-trenches359r2.webp');
const paint=(p,w=650,h=490)=>{const cv=createCanvas(w,h),c=cv.getContext('2d');c.fillStyle=c.createPattern(terrain,'repeat');c.fillRect(0,0,w,h);drawMinenInstallation(c,p,images);return cv;};
const p={x:325,y:245,hp:400,maxHp:400,mortarRecoils:[0,0,0]};
writeFileSync(out+'/idle.webp',await paint(p).encode('webp',95));
const fps=30;
for(let frame=0;frame<78;frame++){
 const time=frame/fps;
 p.mortarRecoils=[.2,1,1.8].map(start=>time>=start?Math.max(0,MINEN_ART.recoilDuration-(time-start)):0);
 writeFileSync(frames+'/'+String(frame).padStart(3,'0')+'.png',await paint(p).encode('png'));
}
const ff=spawnSync('ffmpeg',['-y','-loglevel','error','-framerate',String(fps),'-i',frames+'/%03d.png','-filter_complex','[0:v]split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3','-loop','0',out+'/recoil.gif'],{encoding:'utf8'});
if(ff.status!==0)throw new Error(ff.stderr);
rmSync(frames,{recursive:true,force:true});
// Pixel differences outside the fired tube's rectangle must be exactly zero.
for(const tube of [0,1,2]){
 p.mortarRecoils=[0,0,0];const idle=paint(p).getContext('2d').getImageData(0,0,650,490).data;
 p.mortarRecoils[tube]=MINEN_ART.recoilDuration-MINEN_ART.recoilKick;const fired=paint(p).getContext('2d').getImageData(0,0,650,490).data;
 if(tube===1)writeFileSync(out+'/peak.webp',await paint(p).encode('webp',95));
 const x=p.x+[-175,0,175][tube],y=p.y+[-5,-49,-5][tube];let changed=0;
 for(let py=0;py<490;py++)for(let px=0;px<650;px++){
  const i=(py*650+px)*4;if(idle[i]!==fired[i]||idle[i+1]!==fired[i+1]||idle[i+2]!==fired[i+2]||idle[i+3]!==fired[i+3]){
   if(px<x-56||px>x+56||py<y-56||py>y+74)throw new Error('Stationary pixels moved outside tube '+tube);
   changed++;
  }
 }
 if(!changed)throw new Error('Tube did not visibly recoil '+tube);
 console.log(`Tube ${tube}: ${changed} changed pixels, zero changes outside moving tube`);
}
console.log('Saved idle.webp and recoil.gif from the production renderer');

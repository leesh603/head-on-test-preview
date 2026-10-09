// Native renderer QA; does not claim browser or device performance.
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {drawGallipoliWeapon} from '../gallipoli-art-r10.js';
const require=createRequire(import.meta.url),{createCanvas,loadImage}=require(process.env.HEADON_QA_CANVAS||'@napi-rs/canvas');
const out=process.env.HEADON_QA_OUT||'qa/gallipoli-r10';mkdirSync(out,{recursive:true});
const im=await loadImage(new URL('../gallipoli-weapons-r10.webp',import.meta.url).pathname);
const ground=await loadImage(new URL('../gallipoli-siege-ground.webp',import.meta.url).pathname);
const frames=mkdtempSync(join(tmpdir(),'gallipoli-recoil-'));
for(let i=0;i<48;i++){
 const cv=createCanvas(900,380),c=cv.getContext('2d');c.fillStyle=c.createPattern(ground,'repeat');c.fillRect(0,0,900,380);
 for(const [j,art]of ['twin','howitzer','aa'].entries()){
  const time=i/24-j*.35,recoil=time>=0?Math.max(0,.24-time%1):0;
  drawGallipoliWeapon(c,im,{art,x:150+j*300,y:225,angle:-Math.PI/2,size:art==='aa'?156:242,muzzle:art==='aa'?92:art==='twin'?168:162,recoil});
 }
 writeFileSync(join(frames,String(i).padStart(3,'0')+'.png'),await cv.encode('png'));
}
const ff=spawnSync('ffmpeg',['-y','-loglevel','error','-framerate','24','-i',frames+'/%03d.png','-filter_complex','[0:v]split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3','-loop','0',out+'/barrel-recoil.gif'],{encoding:'utf8'});
if(ff.status!==0)throw new Error(ff.stderr);rmSync(frames,{recursive:true,force:true});console.log('Saved barrel-only recoil animation');

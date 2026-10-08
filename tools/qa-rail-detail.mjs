// Actual game sprites + renderer/model, rendered by Skia; not a browser gameplay claim.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),require=createRequire(import.meta.url);
const {createCanvas,Image}=require(process.env.HEADON_QA_CANVAS||'@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(1,1)};
const missing=[];
globalThis.Image=class extends Image{
 get naturalWidth(){return this.width}get naturalHeight(){return this.height}
 addEventListener(t,f){this['on'+t]=f}
 set src(value){if(!value)return;const p=String(value).replace(/^file:\/\//,'').split('?')[0];try{super.src=readFileSync(resolve(root,p))}catch(e){missing.push(p);queueMicrotask(()=>this.onerror?.(e))}}
 get src(){return super.src}
};
const {fxArtReady}=await import('../fx-art.js?v=ui5');
const {ParisGun,LIncomparable}=await import('../headon-stageboss-patterns.js?v=ui5');
const {drawRuralRail}=await import('../rural-rail-render.js?v=ui5&rail=38');
const {renderStageBossLayer}=await import('../headon-stageboss-render.js?v=ui5&rail=38');
const {drawRailTrack,drawRailDamage}=await import('../rail-render129.js?v=ui5');
const {railAudioSamples}=await import('../rail-audio.js?v=rail1');
await fxArtReady;
const image=async file=>{const im=new Image();await new Promise((ok,no)=>{im.onload=ok;im.onerror=no;im.src=readFileSync(resolve(root,file))});return im};
const ground=await image('terrain-rural359.webp'),track=await image('boss-paris-gun94.webp');
const out=root+'/qa/rail-detail';mkdirSync(out,{recursive:true});const summary={missing,renderKind:'actual renderer + Skia, not browser',shots:{},viewports:[1440,390]};
for(const [Type,key]of [[ParisGun,'bruno'],[LIncomparable,'lincomparable']]){
 const images={},wrecks={};for(const name of ['engine','front','middle','rear']){images[name]=await image('rail-boss-'+key+'-'+name+'181.webp');wrecks[name]=await image('rail-boss-'+key+'-'+name+'-wreck192.webp');}
 for(const part of ['chassis','gun'])images[part]=await image('rail-'+key+'-'+part+'-r1.webp');
 const events=[],b=new Type({id:'qa',x:0,y:650,faction:key==='bruno'?'central':'entente',tuning:{maxHp:2400,partHp:300,damage:20,bulletSpeed:270,warningSeconds:1.55,railCycle:7.5},emit:e=>events.push(e)});
 const addon={stages:{encounter:{bodies:new Map([[b.id,b]])}},hazards:{pool:{visit(){}}}};
 const frame={players:[{id:'p',alive:true,x:160,y:b.y+700}],bounds:{left:-480,right:480,top:b.y-100,bottom:b.y+900}};
 b.rail129.velocity=0;b.rail129.enter('aim');b.update(.02,frame);
 function draw(width,height,full=false,offset=120){
  const canvas=createCanvas(width,height),c=canvas.getContext('2d');c.drawImage(ground,0,0,width,height);
  const z=full?.5:1,camY=full?b.y+520:b.y+offset;
  c.save();c.translate(width/2,height/2);c.scale(z,z);c.translate(-b.x,-camY);drawRailTrack(c,b.rail129,track);drawRailDamage(c,b.rail129,track);
  renderStageBossLayer(addon,{drawBody:model=>{c.save();c.translate(model.x,model.y);drawRuralRail(c,model,images,wrecks);c.restore()},drawPart(){},drawHazard(){}});c.restore();return canvas;
 }
 for(const [w,h,label,full]of [[1440,900,'pc',false],[390,844,'mobile',false],[640,900,'consist',true]])writeFileSync(out+'/'+key+'-'+label+'.webp',await draw(w,h,full).encode('webp',94));
 const strip=createCanvas(1000,500),sc=strip.getContext('2d');
 for(const [i,age]of [0,.035,.14,.45].entries()){
  b.railGun.shotAge=age;b.gunFlash=age<.16?.16-age:0;
  const shot=draw(250,500,false,0);sc.drawImage(shot,i*250,0);sc.fillStyle='#f7e9cd';sc.font='15px sans-serif';sc.fillText(age+'s',i*250+14,25);
 }writeFileSync(out+'/'+key+'-recoil.webp',await strip.encode('webp',94));
 b.railGun.shotAge=10;b.gunFlash=0;
 for(let t=0;t<2.95;t+=1/60)b.update(1/60,frame);
 summary.shots[key]={count:b.railGun.shotCount,soundCues:events.filter(e=>e.type==='heavy-gun-fired').length,loading:b.railGun.load};
 writeFileSync(out+'/'+key+'-reload.webp',await draw(390,844).encode('webp',94));
 const frames=process.env.HEADON_QA_FRAMES;if(frames){const dest=frames+'/'+key;mkdirSync(dest,{recursive:true});b.barrage=null;b.rail129.target=null;b.rail129.enter('aim');b.update(.02,frame);for(let i=0;i<150;i++){b.update(1/30,frame);writeFileSync(dest+'/'+String(i).padStart(4,'0')+'.png',await draw(390,844).encode('png'));}}
 b.hit({partId:'car-rear',damage:99999});b.hit({partId:'car-middle',damage:99999});b.hit({partId:'car-front',damage:99999});
 writeFileSync(out+'/'+key+'-damage.webp',await draw(640,900,true).encode('webp',94));
}
for(const name of ['trainApproach','trainBrake','railGunFire']){
 const sr=24000,pcm=railAudioSamples(name,sr),buffer=Buffer.alloc(44+pcm.length*2);buffer.write('RIFF');buffer.writeUInt32LE(buffer.length-8,4);buffer.write('WAVEfmt ',8);buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(1,22);buffer.writeUInt32LE(sr,24);buffer.writeUInt32LE(sr*2,28);buffer.writeUInt16LE(2,32);buffer.writeUInt16LE(16,34);buffer.write('data',36);buffer.writeUInt32LE(pcm.length*2,40);for(let i=0;i<pcm.length;i++)buffer.writeInt16LE(Math.round(pcm[i]*32767),44+i*2);writeFileSync(out+'/'+name+'.wav',buffer);
}
writeFileSync(out+'/render-audit.json',JSON.stringify(summary,null,2));console.log(JSON.stringify(summary));if(missing.length)process.exitCode=1;

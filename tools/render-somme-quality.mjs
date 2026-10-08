// Supplementary automated Game render evidence, never browser gameplay proof.
// Uses original production art/FX and normal flight + swept projectile collision.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const require=createRequire(import.meta.url),root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const {createCanvas,Image,ImageData}=require(process.env.HEADON_QA_CANVAS||'@napi-rs/canvas');
const timer=setTimeout;globalThis.setTimeout=(f,ms,...args)=>{const t=timer(f,ms,...args);if(ms>=10000)t.unref();return t};
class LocalImage extends Image{
 constructor(){super();this.listeners={}}
 get naturalWidth(){return this.width}get naturalHeight(){return this.height}
 addEventListener(k,f){(this.listeners[k]??=[]).push(f)}decode(){return Promise.resolve()}
 set src(v){this.source=v;const before=this.onload;this.onload=()=>{before?.();for(const f of this.listeners.load||[])f()};this.onerror=e=>{for(const f of this.listeners.error||[])f(e)};try{super.src=readFileSync(String(v).startsWith('file:')?fileURLToPath(v.split('?')[0]):resolve(root,String(v).split('?')[0]))}catch(e){this.onerror(e)}}
 get src(){return this.source}
}
globalThis.Image=LocalImage;globalThis.ImageData=ImageData;globalThis.document={createElement:()=>createCanvas(1,1)};globalThis.location={search:'',href:'file://'+root+'/index.html'};
const {prepareStageBossAssets,drawStageBoss}=await import('../stageboss-view.js?v=gun1');
const {fxArtReady}=await import('../fx-art.js?v=gun1');
const {planeSprite,aircraftKey,aircraftReady}=await import('../aircraft.js?v=gun1');
const {TerrainRenderer,preloadTerrainProfile}=await import('../alps-terrain117.js?v=gun1');
const {Game}=await import('../engine.js?v=gun1');
const {enableStageBoss}=await import('../stageboss-host.js?v=gun1');
await Promise.all([prepareStageBossAssets(10),fxArtReady,aircraftReady,preloadTerrainProfile('somme')]);
const terrain=new TerrainRenderer({canvasFactory:createCanvas}),out=resolve(root,'qa/somme-quality');mkdirSync(out,{recursive:true});const results=[];
for(const [w,h]of [[390,844],[1280,800]]){
 const g=new Game('fokker','baron',()=>.5);g.viewWidth=w;g.viewHeight=h;g.region=10;g.spawn=Infinity;g.nextBossAt=Infinity;g.nextHeavyAt=Infinity;g.need=Infinity;g.fire=Infinity;g.invuln=Infinity;
 enableStageBoss(g,{teamFaction:'central'});g.stageBoss.stages.stageIndex=10;const e=g.stageBoss.startBoss({x:g.x,y:g.y-520}),bs=[...e.bodies.values()],b=bs[0];const saves=new Set();
 const save=name=>{const canvas=createCanvas(w,h),c=canvas.getContext('2d');terrain.draw(c,{key:'somme',camera:{x:g.x-w/2,y:g.y-h/2},width:w,height:h});drawStageBoss(c,g,w,h,{drawZeppelin(){},drawFieldArt(){}});planeSprite(c,w/2,h/2,g.a,aircraftKey('fokker',false,'baron'),1);c.fillStyle='#10191edd';c.fillRect(8,h-36,w-16,28);c.fillStyle='#ecd8ad';c.font='11px sans-serif';c.fillText(name+' · automated Game render',16,h-18);writeFileSync(resolve(out,`${name}-${w}.webp`),canvas.toBuffer('image/webp',82));saves.add(name)};
 const step=()=>{const distance=Math.hypot(b.x-g.x,b.y-g.y),angle=g.t<2.2?-Math.PI/2:Math.atan2(b.y-g.y,b.x-g.x)+Math.PI/2-Math.max(-.8,Math.min(.8,(distance-200)/180));g.update(.02,{angle,moveX:Math.cos(angle),moveY:Math.sin(angle),inputMode:'gamepad',fireHeld:false})};
 for(let i=0;i<1300;i++){step();if(!b.discovered&&b.y-g.y>-h/2+145&&!saves.has('approach'))save('approach');if(b.discovered&&!saves.has('advance'))save('advance');if(g.t>13)break;}
 const shot=(q,p,damage)=>{let x=q.x+(p?.x||0),y=q.y+(p?.y??-15*q.sommeScale*Math.cos(q.hullYaw)),vx=200,vy=0;if(p?.id.startsWith('track-')){x-=Math.sin(q.hullYaw)*55*q.sommeScale;y+=Math.cos(q.hullYaw)*55*q.sommeScale;}if(p?.id.startsWith('sponson-')){const side=Math.sign(p.localX),dx=Math.cos(q.hullYaw)*side,dy=Math.sin(q.hullYaw)*side;x+=dx*(13*q.sommeScale+3);y+=dy*(13*q.sommeScale+3);vx=-dx*200;vy=-dy*200;}g.bullets.push({x,y,previousX:x,previousY:y,vx,vy,life:.15,enemy:false,ownerId:'p1',damage,hit:new Set()})};
 for(const q of bs)shot(q,null,(q.hp-q.maxHp*.3)/q.hullArmor());
 for(let i=0;i<800;i++){step();const q=e.markFinal;if(q?.age>3&&!saves.has('final-drive'))save('final-drive');if(b.salvo&&q&&!saves.has('cannon-lock'))save('cannon-lock');if(q?.age>8&&!saves.has('staggered-mg'))save('staggered-mg');if(q?.age>11&&!saves.has('counter'))save('counter');if(q?.done)break;}
 shot(bs[1],bs[1].parts.get('track-left'),99999);shot(bs[0],bs[0].parts.get('sponson-right'),99999);step();save('part-damage');shot(bs[2],null,bs[2].hp/bs[2].hullArmor()+1);step();save('wreck');
 results.push({width:w,height:h,entry:e.markEntry,final:e.markFinal,frames:[...saves],hulls:bs.map(q=>({role:q.tankRole,hp:q.hp,dead:q.dead,x:q.x,y:q.y,tracks:q.tracks(),destroyedParts:[...q.parts.values()].filter(p=>p.destroyed).map(p=>p.id)})),hazards:g.stageBoss.hazards.pool.count,dropped:g.stageBoss.hazards.pool.dropped});g.stageBoss.dispose();
}
writeFileSync(resolve(out,'render-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));

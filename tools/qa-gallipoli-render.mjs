// Optional native renderer QA, not browser gameplay. Uses production authored assets.
// HEADON_QA_OUT selects a scratch output folder; never rewrites game artwork.
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const {createCanvas,Image}=require(process.env.HEADON_QA_CANVAS||'@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(1,1)};
globalThis.location={search:'',href:'file://'+root+'/index.html',hostname:'localhost'};
const missing=[];
globalThis.Image=class extends Image{
 constructor(...args){super(...args);this._decoded=false;const self=this;
  Object.defineProperty(this,'onload',{configurable:true,get(){return (...args)=>{self._decoded=true;self._loadHandler?.(...args)}},set(fn){self._loadHandler=fn}});
  Object.defineProperty(this,'onerror',{configurable:true,get(){return (...args)=>self._errorHandler?.(...args)},set(fn){self._errorHandler=fn}});
 }
 get complete(){return this._decoded}
 get naturalWidth(){return this.width}get naturalHeight(){return this.height}addEventListener(type,fn){this['on'+type]=fn}
 set src(value){if(!value)return;const path=resolve(root,String(value).replace(/^file:\/\//,'').split('?')[0]);
  if(!existsSync(path)){missing.push(path);queueMicrotask(()=>this.onerror?.(new Error(path)));return;}
  super.src=readFileSync(path);
 }get src(){return super.src}
};
const view=await import('../gallipoli-view.js?v=gallipoli-r10'),{drawStageBoss}=await import('../stageboss-view.js'),{fxArtReady}=await import('../fx-art.js?v=tame3'),{fixture,step}=await import('../tests/stageboss-fixture94.mjs'),{createGallipoliRoute,gallipoliPoint,GALLIPOLI_ROUTE}=await import('../gallipoli-route.js');

await view.prepareGallipoliAssets(14);await fxArtReady;
const {planeSprite,aircraftReady}=await import('../aircraft.js?v=tame3');await aircraftReady;
const {GALLIPOLI_HANGAR}=await import('../gallipoli-boss.js?v=tame3');
const out=process.env.HEADON_QA_OUT||'/tmp/headon-gallipoli-render';mkdirSync(out,{recursive:true});const metrics={renderer:'native canvas; browser performance unmeasured'};
for(const [team,name]of [['entente','central'],['central','entente']])for(const [w,h,size]of [[1440,1000,'pc'],[390,844,'mobile']]){
 const f=fixture({teamFaction:team,stageIndex:14}),r=createGallipoliRoute({x:0,y:0,a:-Math.PI/2}),anchor=gallipoliPoint(r,GALLIPOLI_ROUTE.fort),p=gallipoliPoint(r,GALLIPOLI_ROUTE.fort-160,-940);f.frame.players=[{id:'p',alive:true,...p,radius:12}];f.frame.bounds={left:p.x-w/2,right:p.x+w/2,top:p.y-h/2,bottom:p.y+h/2};f.addon.startBoss(anchor);const b=[...f.addon.stages.encounter.bodies.values()][0],g={...p,region:14,stageBoss:f.addon,gallipoliRoute:r,bossBuildings:[],bossCues:[]},cv=createCanvas(w,h),c=cv.getContext('2d');step(f,5.2);b.coastalClock=4.4;step(f,.2);
 const draw=()=>{view.paintGallipoli(c,g,g.x,g.y,w,h);drawStageBoss(c,g,w,h,{layer:'bodies'});drawStageBoss(c,g,w,h,{layer:'hazards'});};draw();writeFileSync(out+'/'+size+'-'+name+'.webp',await cv.encode('webp',94));
 for(const id of ['left','west-howitzer','aa-west'])f.addon.hit({bodyId:b.id,partId:id,damage:1e9,faction:team});step(f,3.2);draw();writeFileSync(out+'/'+size+'-'+name+'-damaged.webp',await cv.encode('webp',94));
 if(size==='pc'&&team==='entente'){step(f,12);assert(b.parts.get('left').destroyed&&b.parts.get('left').repairRemaining<=3);draw();writeFileSync(out+'/pc-repair-warning.webp',await cv.encode('webp',94));step(f,3.2);draw();writeFileSync(out+'/pc-repaired.webp',await cv.encode('webp',94));f.b=b;b.hit({damage:1e9});g.x=b.x;g.y=b.y+160;draw();writeFileSync(out+'/pc-command-destroyed.webp',await cv.encode('webp',94));}
 if(size==='pc'&&team==='entente'){const art=createCanvas(760,520),ac=art.getContext('2d');ac.translate(380,305);ac.scale(.22,.22);b.x=b.y=0;b.faction=null;b.phase='active-defense';b.captured.clear();b.commandDestroyed=false;b.commandHp=b.commandMaxHp;b.coreVulnerable=true;b.hp=b.maxHp;b.pendingAttack=null;for(const part of b.parts.values())part.hp=part.maxHp;view.drawGallipoliBoss(ac,b);writeFileSync(out+'/cut-in.webp',await art.encode('webp',95));}
}
{
 const r=createGallipoliRoute({x:0,y:0,a:-Math.PI/2}),p=gallipoliPoint(r,GALLIPOLI_ROUTE.fort+200),f=fixture({teamFaction:'entente',stageIndex:14});f.addon.startBoss(gallipoliPoint(r,GALLIPOLI_ROUTE.fort));step(f,5.2);const g={...p,region:14,stageBoss:f.addon,gallipoliRoute:r,bossBuildings:[],bossCues:[]};const cv=createCanvas(1920,1400),c=cv.getContext('2d');c.scale(.42,.42);view.paintGallipoli(c,g,p.x,p.y,1920/.42,1400/.42);drawStageBoss(c,g,1920/.42,1400/.42,{layer:'bodies'});writeFileSync(out+'/siege-overview.webp',await cv.encode('webp',94));
}
for(const s of [1000,2200,4000,6000,7800]){const r=createGallipoliRoute({x:0,y:0,a:-Math.PI/2}),p=gallipoliPoint(r,s),cv=createCanvas(1440,1000),c=cv.getContext('2d');view.paintGallipoli(c,{...p,gallipoliRoute:r},p.x,p.y,1440,1000);writeFileSync(out+'/route-'+s+'.webp',await cv.encode('webp',94));}
{
 const f=fixture({teamFaction:'entente',stageIndex:14}),r=createGallipoliRoute({x:0,y:0,a:-Math.PI/2}),anchor=gallipoliPoint(r,GALLIPOLI_ROUTE.fort);f.addon.startBoss(anchor);const b=[...f.addon.stages.encounter.bodies.values()][0];step(f,5.1);const g={x:b.x,y:b.y+300,region:14,stageBoss:f.addon,gallipoliRoute:r,bossBuildings:[],bossCues:[]};f.frame.players=[{id:'p',alive:true,x:g.x,y:g.y,radius:12}];b.pendingAttack=null;b.planFinal(f.frame.players[0]);
 for(const source of b.pendingAttack.sources){if(source.id){const p=b.parts.get(source.id);p.angle=Math.atan2(source.target.y-b.y-p.y,source.target.x-b.x-p.x);}else b.coreAngle=Math.atan2(source.target.y-b.y,source.target.x-b.x);}
 const cv=createCanvas(1280,800),c=cv.getContext('2d'),draw=()=>{view.paintGallipoli(c,g,g.x,g.y,1280,800);drawStageBoss(c,g,1280,800,{layer:'bodies'});drawStageBoss(c,g,1280,800,{layer:'hazards'});};
 for(const [seconds,name]of [[1.3,'west'],[1.1,'east'],[1.2,'citadel'],[1.2,'command'],[3.6,'recovery']]){step(f,seconds);draw();writeFileSync(out+'/final-'+name+'.webp',await cv.encode('webp',94));}
 const p=b.parts.get('left');g.x=b.x+p.x;g.y=b.y+p.y;b.hit({partId:p.id,damage:1e9});for(const [remaining,name]of [[3,'wreck'],[1.5,'repair-mid'],[.05,'repair-ready']]){p.repairRemaining=remaining;draw();writeFileSync(out+'/'+name+'.webp',await cv.encode('webp',94));}step(f,.1);draw();writeFileSync(out+'/repair-restored.webp',await cv.encode('webp',94));
}
// Native aircraft sprites at the exact spawn coordinates returned by the boss.
for(const team of ['central','entente']){const f=fixture({teamFaction:team,stageIndex:14}),r=createGallipoliRoute({x:0,y:0,a:-Math.PI/2});f.addon.startBoss(gallipoliPoint(r,GALLIPOLI_ROUTE.fort));const b=[...f.addon.stages.encounter.bodies.values()][0];step(f,11.5);assert(f.log.minions.length>0);const h=GALLIPOLI_HANGAR,g={x:b.x+h.exitX,y:b.y+h.y,region:14,stageBoss:f.addon,gallipoliRoute:r,bossBuildings:[],bossCues:[]},cv=createCanvas(1000,800),c=cv.getContext('2d');view.paintGallipoli(c,g,g.x,g.y,1000,800);drawStageBoss(c,g,1000,800,{layer:'bodies'});for(const m of f.log.minions){assert.equal(m.x,b.x+h.exitX);assert.equal(m.y,b.y+h.exitY);planeSprite(c,m.x-g.x+500,m.y-g.y+400,m.a,m.plane,1,true,false);}writeFileSync(out+'/hangar-'+b.faction+'.webp',await cv.encode('webp',94));assert.equal(f.addon.hazards.pool.dropped,0);}
assert.equal(missing.length,0);writeFileSync(out+'/render-metrics.json',JSON.stringify({missing,metrics},null,2));console.log(JSON.stringify(metrics));

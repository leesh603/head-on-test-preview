import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,step} from './stageboss-fixture94.mjs';
// Exercise the production view callbacks without a browser or external canvas
// dependency. Pixel appearance is checked separately in the saved renderer QA.
const calls=[];
const realTimer=globalThis.setTimeout;globalThis.setTimeout=(f,ms,...args)=>{const timer=realTimer(f,ms,...args);if(ms>=10000)timer.unref();return timer;};
function context(){const c={globalAlpha:1,canvas:{},getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),measureText:s=>({width:String(s).length*8})};return new Proxy(c,{get:(o,k)=>k in o?o[k]:(...a)=>{calls.push([k,...a]);}});}
globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>context()})};
globalThis.location={search:'',href:'http://localhost/index.html'};
globalThis.Image=class{constructor(){this.listeners={};this.naturalWidth=500;this.naturalHeight=375;this.width=500;this.height=375;}addEventListener(k,f){(this.listeners[k]??=[]).push(f);}decode(){return Promise.resolve();}set src(s){this._src=s;queueMicrotask(()=>{this.onload?.();for(const f of this.listeners.load||[])f();});}get src(){return this._src;}};
const {prepareStageBossAssets,drawStageBoss}=await import('../stageboss-view.js?v=bs1');
await prepareStageBossAssets(3);
for(const teamFaction of ['central','entente'])test(`${teamFaction} trench production view executes entry, warnings, final, part damage and wreck callbacks`,()=>{
 const f=fixture({stageIndex:3,teamFaction}),enc=f.addon.startBoss({x:0,y:0}),b=[...enc.bodies.values()][0];f.frame.bounds={left:-640,right:640,top:-400,bottom:400};f.frame.players=[{id:'p1',alive:true,x:0,y:180,vx:100,vy:0,radius:12}];const draw=()=>drawStageBoss(context(),{stageBoss:f.addon,x:0,y:0,bossBuildings:[],bossCues:[],t:5,gasZones:[]},1280,800,{drawZeppelin(){},drawFieldArt(){}});
 assert.doesNotThrow(draw);step(f,2);assert.doesNotThrow(draw);
 if(teamFaction==='central'){for(let i=0;i<100&&!b.coreVulnerable;i++)step(f,.05);b.hit({damage:780});step(f,4);}else b.finalOrder(f.frame.players,f.frame.bounds,b.liveGuns());
 step(f,.8);calls.length=0;assert.doesNotThrow(draw);assert(calls.some(c=>c[0]==='drawImage'));
 if(teamFaction==='entente'){const pits=calls.filter(c=>c[0]==='drawImage'&&c[1]?.src?.includes('boss-minenwerfer-composite188')&&c.length===6);assert.equal(pits.length,3);assert(calls.some(c=>c[0]==='fillText'&&c[1]==='1'));}
 const part=[...b.parts.values()][0];b.hit({partId:part.id,damage:part.hp});assert.doesNotThrow(draw);
 for(const p of b.parts.values())b.hit({partId:p.id,damage:p.hp});if(teamFaction==='central')b.hit({damage:b.hp});step(f,.1);assert.doesNotThrow(draw);f.addon.dispose();
});
test('Livens entry renders soil at the fixed mount and keeps the buried nozzle hidden',()=>{
 const f=fixture({stageIndex:3,teamFaction:'central'}),enc=f.addon.startBoss({x:0,y:0});f.frame.bounds={left:-195,right:195,top:-422,bottom:422};f.frame.players=[{id:'p1',alive:true,x:0,y:180,radius:12}];const draw=()=>drawStageBoss(context(),{stageBoss:f.addon,x:0,y:0,bossBuildings:[],bossCues:[],t:1,gasZones:[]},390,844,{drawZeppelin(){},drawFieldArt(){}});
 step(f,.3);calls.length=0;draw();assert(calls.some(c=>c[0]==='drawImage'&&c[1]?.src?.includes('fx-dust-puff')));assert(!calls.some(c=>c[0]==='drawImage'&&c[1]?.src?.includes('boss_livens_nozzle_normal_pivot187')));
 step(f,.65);calls.length=0;draw();assert(calls.some(c=>c[0]==='drawImage'&&c[1]?.src?.includes('fx-dirt-burst')));assert(calls.some(c=>c[0]==='drawImage'&&c[1]?.src?.includes('boss_livens_nozzle_normal_pivot187')));f.addon.dispose();
});

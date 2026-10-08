import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Load the renderer with only its declared imports replaced by asset-free modules.
// An undeclared fx reference must still throw, as it does in the browser.
const data=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const source=await readFile(new URL('../player-effects129.js?v=tame2',import.meta.url),'utf8');
const moduleSource=source.replace(/(['"])\.\/fx-art\.js[^'"]*\1/g,JSON.stringify(data('export const fx=()=>true,fxTint=()=>true;')))
 .replace(/(['"])\.\/icons\.js[^'"]*\1/g,JSON.stringify(data('export const drawGameIcon=()=>true;')))
 .replace(/(['"])\.\/pilot-signature-view\.js[^'"]*\1/g,JSON.stringify(data('export const createSignatureView=()=>()=>{};')))
 .replace(/(['"])\.\/pilot-directed-fx\.js[^'"]*\1/g,JSON.stringify(data('export const drawCavalryGuard=()=>{};')))
 .replace(/(['"])\.\/aircraft\.js[^'"]*\1/g,JSON.stringify(data('export const planeSprite=()=>{},aircraftKey=()=>"";')));
const {drawPlayerAura,playerPose,applyPlayerAttitude}=await import(data(moduleSource));
const ctx=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
for(const [name,fields] of Object.entries({
 active:{pilotIdentity:{fx:[{key:'windStreak',x:0,y:0,a:0,size:60,life:.35}]}},
 cloak:{ballCloak:1},
 reversal:{immelmannGhosts:[{x:0,y:0,a:0,life:.2,maxLife:.3}]},
 muzzle:{fxOverheat:.2}
}))test(`shared pilot renderer resolves FX import: ${name}`,()=>{
 assert.doesNotThrow(()=>drawPlayerAura(ctx,{hp:100,x:0,y:0,a:0,...fields},100,100));
});

test('Immelmann pitch/roll projection stays continuous for every entry heading',()=>{
 for(const heading of [0,Math.PI/2,Math.PI,-Math.PI/2,.73]){
  let previous;
  for(let i=0;i<=200;i++){
   const q=i/200,ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
   const pitch=Math.PI*ease(q/.56),roll=Math.PI*ease((q-.44)/.28);
   const p={pilot:'immelmann',a:heading+(Math.cos(pitch)<0?Math.PI:0),immelmannTurn:{heading,pitch,roll}};
   let matrix;applyPlayerAttitude({transform(...args){matrix=args}},p);
   assert(matrix.every(Number.isFinite));
   assert(Math.abs(matrix[0]*matrix[3]-matrix[1]*matrix[2])>=.06-1e-12,'Edge-on aircraft remains visible');
   if(previous)assert(Math.max(...matrix.map((v,k)=>Math.abs(v-previous[k])))<.16,'No frame-sized heading swap');
   previous=matrix;
   if(i===0||q>=.72){
    const a=heading+(i===0?0:Math.PI);
    [Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0].forEach((v,k)=>assert(Math.abs(v-matrix[k])<1e-12));
   }
  }
 }
});

test('Immelmann climb lifts the aircraft while its shadow keeps the ground anchor',()=>{
 const p={pilot:'immelmann',a:.7,immelmannAltitude:1},pose=playerPose(p,120,200);
 assert.equal(pose.y,148);assert.equal(pose.y+pose.height,200);
 assert.equal(pose.scale,1.1);assert(pose.shadowScale<1&&pose.shadowAlpha<1);
 p.immelmannAltitude=0;const landed=playerPose(p,120,200);
 assert.equal(landed.y,200);assert.equal(landed.height,0);assert.equal(landed.scale,1);
});

test('shared attitude preserves other pilots and ordinary shadow orientation',()=>{
 const calls=[],c={rotate(a){calls.push(['rotate',a])},scale(x,y){calls.push(['scale',x,y])}};
 const p={pilot:'baron',a:.7,immelmannTurn:{heading:0,pitch:2,roll:1}};
 applyPlayerAttitude(c,p,{roll:.1,bank:.9});assert.deepEqual(calls,[['rotate',.7+.1],['scale',1,.9]]);
 calls.length=0;applyPlayerAttitude(c,p,{roll:.1,bank:.9},true);assert.deepEqual(calls,[['rotate',.7]]);
});

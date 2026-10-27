import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Load the renderer with only its declared imports replaced by asset-free modules.
// An undeclared fx reference must still throw, as it does in the browser.
const data=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const source=await readFile(new URL('../player-effects129.js?v=tame3',import.meta.url),'utf8');
const moduleSource=source.replace(/(['"])\.\/fx-art\.js[^'"]*\1/g,JSON.stringify(data('export const fx=()=>true,fxTint=()=>true;')))
 .replace(/(['"])\.\/icons\.js[^'"]*\1/g,JSON.stringify(data('export const drawGameIcon=()=>true;')))
 .replace(/(['"])\.\/pilot-signature-view\.js[^'"]*\1/g,JSON.stringify(data('export const createSignatureView=()=>()=>{};')))
 .replace(/(['"])\.\/pilot-directed-fx\.js[^'"]*\1/g,JSON.stringify(data('export const drawCavalryGuard=()=>{};')))
 .replace(/(['"])\.\/aircraft\.js[^'"]*\1/g,JSON.stringify(data('export const planeSprite=()=>{},aircraftKey=()=>"";')))
 .replace(/(['"])\.\/equipment-material-fx\.js[^'"]*\1/g,JSON.stringify(data('export const drawHorseSilhouette=()=>{};')))
 .replace(/(['"])\.\/engine\.js[^'"]*\1/g,JSON.stringify(data('export const bishopFlightHeight=()=>0;')));
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

test('Immelmann uses the ordinary heading and bank projection throughout a level turn',()=>{
 for(const heading of [0,Math.PI/2,Math.PI,-Math.PI/2,.73])for(const direction of [-1,1]){
  for(let i=0;i<=100;i++){
   const a=heading+direction*Math.PI*i/100,p={pilot:'immelmann',a,immelmannAltitude:0,immelmannTurn:{heading,direction}},calls=[];
   const c={rotate(a){calls.push(['rotate',a])},scale(x,y){calls.push(['scale',x,y])},transform(){assert.fail('No pitch/roll distortion')}};
   applyPlayerAttitude(c,p,{bank:.9});assert.deepEqual(calls,[['rotate',a],['scale',1,.9]]);
   calls.length=0;applyPlayerAttitude(c,p,{},true);assert.deepEqual(calls,[['rotate',a]]);
   const pose=playerPose(p,120,200);assert.equal(pose.y,200);assert.equal(pose.height,0);assert.equal(pose.scale,1);
  }
 }
});

test('shared attitude preserves other pilots and ordinary shadow orientation',()=>{
 const calls=[],c={rotate(a){calls.push(['rotate',a])},scale(x,y){calls.push(['scale',x,y])}};
 const p={pilot:'baron',a:.7,immelmannTurn:{heading:0,pitch:2,roll:1}};
 applyPlayerAttitude(c,p,{roll:.1,bank:.9});assert.deepEqual(calls,[['rotate',.7+.1],['scale',1,.9]]);
 calls.length=0;applyPlayerAttitude(c,p,{roll:.1,bank:.9},true);assert.deepEqual(calls,[['rotate',.7]]);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Load the renderer with only its declared imports replaced by asset-free modules.
// An undeclared fx reference must still throw, as it does in the browser.
const data=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const source=await readFile(new URL('../player-effects129.js?v=504',import.meta.url),'utf8');
const moduleSource=source.replace(/(['"])\.\/fx-art\.js[^'"]*\1/g,JSON.stringify(data('export const fx=()=>true,fxTint=()=>true;')))
 .replace(/(['"])\.\/icons\.js[^'"]*\1/g,JSON.stringify(data('export const drawGameIcon=()=>true;')))
 .replace(/(['"])\.\/pilot-signature-view\.js[^'"]*\1/g,JSON.stringify(data('export const createSignatureView=()=>()=>{};')))
 .replace(/(['"])\.\/pilot-directed-fx\.js[^'"]*\1/g,JSON.stringify(data('export const drawCavalryGuard=()=>{};')))
 .replace(/(['"])\.\/aircraft\.js[^'"]*\1/g,JSON.stringify(data('export const planeSprite=()=>{},aircraftKey=()=>"";')));
const {drawPlayerAura}=await import(data(moduleSource));
const ctx=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
for(const [name,fields] of Object.entries({
 active:{pilotIdentity:{fx:[{key:'windStreak',x:0,y:0,a:0,size:60,life:.35}]}},
 cloak:{ballCloak:1},
 reversal:{immelmannGhosts:[{x:0,y:0,a:0,life:.2,maxLife:.3}]},
 muzzle:{fxOverheat:.2}
}))test(`shared pilot renderer resolves FX import: ${name}`,()=>{
 assert.doesNotThrow(()=>drawPlayerAura(ctx,{hp:100,x:0,y:0,a:0,...fields},100,100));
});

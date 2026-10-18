// Production render verification in Skia; does not claim browser performance.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),{createCanvas,Image}=require(process.env.HEADON_QA_CANVAS||'@napi-rs/canvas');
const root=fileURLToPath(new URL('../',import.meta.url));
globalThis.document={createElement:()=>createCanvas(1,1)};
globalThis.Image=class extends Image{get naturalWidth(){return this.width}get naturalHeight(){return this.height}set src(v){super.src=readFileSync(String(v).startsWith('file:')?fileURLToPath(new URL(String(v).split('?')[0])):root+String(v).replace(/^\.\//,'').split('?')[0]);}};
const {drawZubianShip}=await import('../adriatic-boss-render.js?v=485');
const {drawJutlandBody,prepareJutlandAssets}=await import('../jutland-view.js?v=485');
const {fxArtReady}=await import('../fx-art.js?v=485');
await prepareJutlandAssets(16);await fxArtReady;
const load=async name=>{const im=new Image();im.src=readFileSync(root+name);await im.decode();return im;};
const images={atlas:await load('zubian-atlas-tone.webp'),damage:await load('zubian-damage-tone.webp')};
const old={atlas:await load('zubian-atlas.webp'),damage:await load('zubian-damage-20261001.webp')};
const out=root+'qa/zubian-tone';mkdirSync(out,{recursive:true});
for(const state of ['intact','damaged','splitting','front','rear','frontWreck','rearWreck']){
 const cv=createCanvas(960,720),c=cv.getContext('2d');c.fillStyle='#263e4b';c.fillRect(0,0,960,720);
 const role=state.startsWith('front')?'front':state.startsWith('rear')?'rear':'';
 const b={x:240,y:350,assetKey:'hms-zubian'+(role?'-'+role:''),geometryScale:1,hullYaw:0,hp:state==='damaged'?50:100,maxHp:100,parts:[],phase:state==='splitting'?'splitting':'barrage',splitGap:45,destroying:state.endsWith('Wreck'),destructionAge:.2,destructionDuration:4};
 c.save();c.translate(0,0);drawZubianShip(c,b,old);c.restore();b.x=720;drawZubianShip(c,b,images);
 writeFileSync(out+'/'+state+'.webp',await cv.encode('webp',95));
}
// New Zubian beside the production Jutland cruiser at comparable scale.
{const cv=createCanvas(800,780),c=cv.getContext('2d');c.fillStyle='#263e4b';c.fillRect(0,0,800,780);
 drawZubianShip(c,{x:210,y:385,assetKey:'hms-zubian',geometryScale:1.4,hp:100,maxHp:100,parts:[],hullYaw:0},images);
 drawJutlandBody(c,{x:590,y:385,role:'cruiser',faction:'entente',slot:1,hullYaw:0,width:122,height:610,hp:100,maxHp:100,parts:new Map(),destroying:false,dead:false});
 writeFileSync(out+'/tone-comparison.webp',await cv.encode('webp',95));}
console.log('Rendered 7 Zubian states and comparison using production functions');

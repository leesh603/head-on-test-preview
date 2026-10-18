// Additive painted FX pack. No simulation dependencies; ?fx3=0 restores main art.
const params=typeof location==='undefined'?null:new URLSearchParams(location.search);
export const FX3=params?.get('fx')!=='0'&&params?.get('fx3')!=='0';
export const ROLE3_CELLS=Object.freeze([
 'cowImpact0','cowImpact1','cowImpact2','cowImpact3',
 'moteurImpact0','moteurImpact1','moteurImpact2','moteurImpact3',
 'lePrieurImpact0','lePrieurImpact1','lePrieurImpact2','lePrieurImpact3',
 'mortarImpact0','mortarImpact1','mortarImpact2','mortarImpact3'
]);
const packs=[
 {file:'role-impacts.webp',size:1024,cell:256,cols:4,keys:ROLE3_CELLS},
 {file:'naval-contact.webp',size:768,cell:384,cols:2,keys:['shipWake3','shipBow3','navalSplash3','navalFoam3']},
 {file:'surface-fire.webp',size:768,cell:384,cols:2,keys:['fireEngine','fireWing','fireGround','fireFlash']},
 {file:'weather-clouds.webp',size:1152,cell:384,cols:3,keys:['fx-cloud-cumulus-0','fx-cloud-cumulus-1','fx-cloud-cumulus-2','fx-cloud-bank-0','fx-cloud-bank-1','fx-cloud-dark-0','fx-cloud-dark-1','fx-cloud-wispy-0','fx-cloud-wispy-1']},
 {file:'atmosphere-smoke-gas.webp',size:1024,cell:256,cols:4,keys:['gustFront','wreckGust','windStreak','mist','gunSmoke','engineSmoke','smokeTrail','smokeOil','wreckSmoke','explosionSmoke','smokeDust','vaporTrail','gasCloud0','gasCloud1','gasCloud2','gasCloud3']},
 {file:'combat-families.webp',size:1024,cell:256,cols:4,keys:['pop0','pop1','pop2','pop3','airblast0','airblast1','airblast2','airblast3','structure0','structure1','structure2','structure3','bossBlast0','bossBlast1','bossBlast2','bossBlast3']}
];
const aliases={spark:'pop0',armorSpark:'pop0',smokeGray:'engineSmoke',smokeDark:'smokeOil',smokeWisp:'mist',smokePuff:'gunSmoke',smokeHeavy:'wreckSmoke',dustPuff:'smokeDust',dirtBurst:'explosionSmoke',dirtMix:'smokeDust',gas:'gasCloud2',gasSmall:'gasCloud0',gasThin:'gasCloud3',exhaust:'vaporTrail',fire:'fireGround',fireSmall:'fireEngine',shockRing:'wreckGust',splashTiny:'navalSplash3',splashShell:'navalSplash3',waterColumn:'navalSplash3',wakeFast:'shipWake3',foamRing:'navalFoam3'};
for(let i=0;i<4;i++){aliases['shellBurst'+i]='cowImpact'+i;aliases['bombfx'+i]='mortarImpact'+i;aliases['explosion'+i]='airblast'+i;aliases['fire'+i]='fireGround';}
const resolveKey=key=>aliases[key]||key;
const entries=new Map();
export const roleArtReady=Promise.all(packs.map(pack=>{
 if(!FX3||typeof Image==='undefined')return false;
 return new Promise(resolve=>{
  const image=new Image();image.decoding='async';
  image.onload=()=>{const valid=image.naturalWidth===pack.size&&image.naturalHeight===pack.size;
   if(valid)pack.keys.forEach((key,index)=>entries.set(key,{image,pack,index}));
   image.onload=image.onerror=null;resolve(valid);
  };
  image.onerror=()=>{image.onload=image.onerror=null;resolve(false)};
  image.src=new URL('./fx-role-split/'+pack.file,import.meta.url).href;
 });
}));
export function roleReady(key){return FX3&&entries.has(resolveKey(key))}
export function roleDraw(c,key,x,y,w,h=w,angle=0,alpha=1){
 const entry=entries.get(resolveKey(key));if(!FX3||!entry||!(w>0)||!(h>0))return false;
 const {image,pack,index}=entry,{cell,cols}=pack;
 c.save();c.translate(x,y);if(angle)c.rotate(angle);c.globalAlpha*=Math.max(0,Math.min(1,Number.isFinite(alpha)?alpha:1));
 c.imageSmoothingEnabled=true;
 c.drawImage(image,(index%cols)*cell,Math.floor(index/cols)*cell,cell,cell,-w/2,-h/2,w,h);
 c.restore();return true;
}
const cells=new Map();
export function roleImage(key,trim=false){
 key=resolveKey(key);
 if(!roleReady(key)||typeof document==='undefined')return null;
 const cacheKey=key+(trim?':trim':'');if(cells.has(cacheKey))return cells.get(cacheKey);
 const {image,pack,index}=entries.get(key),{cell,cols}=pack,cv=document.createElement('canvas');
 cv.width=cv.height=cell;const c=cv.getContext('2d');if(!c)return null;
 c.drawImage(image,(index%cols)*cell,Math.floor(index/cols)*cell,cell,cell,0,0,cell,cell);
 let result=cv;
 if(trim){const data=c.getImageData(0,0,cell,cell).data;let left=cell,top=cell,right=0,bottom=0;
  for(let y=0;y<cell;y++)for(let x=0;x<cell;x++)if(data[(y*cell+x)*4+3]>8){left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1)}
  if(right>left&&bottom>top){result=document.createElement('canvas');result.width=right-left;result.height=bottom-top;result.getContext('2d').drawImage(cv,left,top,result.width,result.height,0,0,result.width,result.height)}
 }
 Object.defineProperties(result,{naturalWidth:{value:result.width},naturalHeight:{value:result.height}});cells.set(cacheKey,result);return result;
}

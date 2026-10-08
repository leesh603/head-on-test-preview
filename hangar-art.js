// Presentation-only artwork, prepared once and shared by boot and pilot changes.
import {clearAircraftMatte} from './aircraft.js?v=tame1';
import {aircraftArt} from './main-ui-art180.js?v=tame1';

export const hangarKeyFile={fokker_voss:'fokker_f1',fokker_red:'fokker',dh2:'airco_dh2',fokker_e1:'eindecker',fokker_d7_campaign:'fokkerd7',oeffag:'albatros',bristol:'bristol_duo',spad7:'spad',halberstadt:'halberstadt_duo',fokker_campaign:'fokker_standard',fokker:'fokker_standard'};
const cleanMech=new Set(['halberstadt_duo','fokker_jacobs','gontermann_fokker','nungesser_nieuport24','rickenbacker_spad','luke_nieuport28']);
const rawArt={fokker:'./fokker.webp?v=r5&b=349',baron_albatros:'./baron_albatros.webp?v=r5&b=345',albatros_d2:'./albatros_d2.webp?v=r5&b=345',nieuport_italian:'./nieuport.webp?v=r5&b=345'};
const artCache=new Map(),artReady=new Map();
// The decoded display images stay referenced, so switching back to a pilot paints at once.
export function hangarArtNow(key){return artReady.get(key)?.url||''}
export function hangarArtSource(key){
 const file=hangarKeyFile[key]||key;
 return cleanMech.has(file)?`./mech/${file}.webp?v=r5`:rawArt[key]||`./${file}.webp?v=r5&b=349`;
}
function prepareArt(image,key){
 // Existing alpha-clean WebPs can be displayed directly, without a PNG encode
 // and second decode on every first visit to a pilot.
 if(!['baron_albatros','albatros_d2','nieuport_italian'].includes(key))return Promise.resolve(image.src);
 const scan=document.createElement('canvas');scan.width=image.naturalWidth;scan.height=image.naturalHeight;
 const c=scan.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);
 const pixels=c.getImageData(0,0,scan.width,scan.height),rgba=pixels.data;
 if(key==='nieuport_italian')for(let i=0;i<rgba.length;i+=4){const r=rgba[i],g=rgba[i+1],b=rgba[i+2];if(rgba[i+3]>0&&b>70&&b>r*1.18&&b>g*1.05){rgba[i]=55;rgba[i+1]=132;rgba[i+2]=78}}
 clearAircraftMatte(key,rgba,scan.width,scan.height);c.putImageData(pixels,0,0);
 let l=scan.width,t=scan.height,r=-1,b=-1;
 for(let y=0;y<scan.height;y++)for(let x=0;x<scan.width;x++)if(rgba[(y*scan.width+x)*4+3]>128){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}
 if(r<l||b<t)return Promise.resolve('');
 const out=document.createElement('canvas');out.width=r-l+1;out.height=b-t+1;out.getContext('2d').drawImage(scan,l,t,out.width,out.height,0,0,out.width,out.height);
 return new Promise(resolve=>out.toBlob(blob=>resolve(blob?URL.createObjectURL(blob):''),'image/png'));
}
export function hangarArt(key){
 if(artCache.has(key))return artCache.get(key);
 const src=hangarArtSource(key),mechSrc=`./mech/${hangarKeyFile[key]||key}.webp?v=r5`;
 const pending=new Promise(resolve=>{
  const image=new Image();image.decoding='async';let fellBack=false;
  image.onerror=()=>{if(!fellBack&&src!==mechSrc){fellBack=true;image.src=mechSrc;return}resolve(aircraftArt[key]||'')};
  image.onload=async()=>{
   try{
    const url=await prepareArt(image,key);if(!url){resolve('');return}
    const display=new Image();display.decoding='async';display.src=url;
    if(display.decode)await display.decode();
    else await new Promise(done=>{if(display.complete)done();else{display.onload=done;display.onerror=done}});
    artReady.set(key,{url,display});resolve(url);
   }catch{resolve('')}
  };image.src=src;
 });artCache.set(key,pending);return pending;
}

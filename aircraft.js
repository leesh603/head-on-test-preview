import {clearCrewMatte} from './matte70.js?v=317&b=317';
// Hand-authored game-native pixel sprites. All detail is rasterized once on an
// integer grid; Canvas scaling keeps the same pixels in flight and the roster.
const AIRFRAMES={
 'white-fokkerdv55':{paint:['#596264','#aeb7b6','#e5e9e4','#fffef4'],wings:[[55,-20,22]],body:84,tail:22,nose:-40,cross:true},
 fokker:{paint:['#394435','#5d6848','#7f855d','#a9a779'],wings:[[43,16,15],[48,-4,17],[54,-27,20]],body:76,tail:22,nose:-40,cross:true},
 fokker_standard:{paint:['#394435','#5d6848','#7f855d','#a9a779'],wings:[[43,16,15],[48,-4,17],[54,-27,20]],body:76,tail:22,nose:-40,cross:true},
 albatros:{paint:['#554736','#8b6946','#c29861','#e2bd7b'],wings:[[46,2,15],[55,-22,21]],body:101,tail:25,nose:-47,cross:true},
 camel:{paint:['#323c2d','#586043','#7c8354','#a5a46e'],wings:[[48,2,17],[53,-17,21]],body:88,tail:23,nose:-42,country:'britain'},
 sopwith:{paint:['#111817','#252d29','#3d4740','#69736a'],wings:[[40,11,11],[45,-2,13],[49,-18,16]],body:92,tail:19,nose:-46,country:'britain'},
 nieuport:{paint:['#56676a','#8d9c98','#bac8be','#e5e9ce'],wings:[[33,6,10],[54,-17,20]],body:90,tail:20,nose:-44,country:'france'},
 nieuport_italian:{paint:['#56676a','#8d9c98','#bac8be','#e5e9ce'],wings:[[33,6,10],[54,-17,20]],body:90,tail:20,nose:-44,country:'italy'},
 spad:{paint:['#433e2c','#776444','#ac945e','#d0ba7e'],wings:[[49,2,18],[52,-17,21]],body:100,tail:23,nose:-48,country:'france'}
};
const cache=new Map(),shadows=new Map(),flashes=new Map();
// Dedicated painted pixel sprites for the two German airframes. Crop only the
// transparent padding at runtime; never stretch or recolor aircraft markings.
const painted=new Map();
// Load the detailed painted WWI sprites once; each airframe keeps its own
// cache entry so Albatros can never inherit Fokker's canvas.
// Sprites ship with baked alpha; the matte pass only defensively clears any
// neutral preview matte still connected to the exterior on legacy art.
export function clearAircraftMatte(key,data,w,h){
 if(!['baron_albatros','albatros_d2'].includes(key))return;
 const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
 const add=(x,y)=>{if(x<0||x>=w||y<0||y>=h)return;const n=y*w+x;if(seen[n])return;seen[n]=1;const i=n*4,r=data[i],g=data[i+1],b=data[i+2];if(Math.min(r,g,b)<90||Math.max(r,g,b)-Math.min(r,g,b)>32)return;queue[tail++]=n;data[i+3]=0;};
 for(let x=0;x<w;x++){add(x,0);add(x,h-1)}for(let y=0;y<h;y++){add(0,y);add(w-1,y)}
 while(head<tail){const n=queue[head++],x=n%w,y=Math.floor(n/w);add(x-1,y);add(x+1,y);add(x,y-1);add(x,y+1)}
}
// Approximate real wingspans in metres; drawn width scales ~ (span/8.5)^0.8 so
// two-seaters read larger than scouts while staying inside the 144x160 canvas.
const WINGSPAN_M={fokker:7.19,fokker_standard:7.19,fokker_f1:7.19,fokker_jacobs:7.19,nieuport11:7.52,nieuport28:8,spad12:8,sopwith:8.08,pup:8.08,se5a:8.11,mccudden_se5a:8.11,nieuport:8.16,nieuport_italian:8.16,nieuport24:8.21,nungesser_nieuport24:8.21,spad:8.25,fokkerdv:8.34,albatros_d2:8.5,camel:8.53,airco_dh2:8.61,hanriot:8.7,fokkerd7:8.9,loewenhardt_fokkerd7:8.9,albatros:9.05,albatros_d5a:9.05,baron_albatros:9.05,wolff_albatros:9.05,hansa_brandenburg_cc:9.25,pfalz_d3a:9.4,berthold_pfalz:9.4,goering_fokkerd7:8.9,collishaw_sopwith:8.08,guynemer_spad:8.25,udet_fokkerdv:8.34,baracca_nieuport:8.16,eindecker:9.52,bristol_m1:9.8,dolphin:9.91,snipe:9.13,strutter:10.21,halberstadt_duo:10.77,gunbus:11.17,morane_ai:11.21,hannover_cl3:11.7,be2c:11.28,bristol_duo:11.96,aviatik:12.4,re8:12.98,dfw_cv:13.27,dh4:13.21,fe2b:14.55,junkers_j1:16,re7:17.45,gotha:23.7,roland_d6:9.42,siemens_d4:8.35,rickenbacker_spad:8.25,ball_se5a:8.11,barker_snipe:9.13,luke_nieuport28:8,brumowski_albatros:9.05,gontermann_fokker:7.19,macchi_m5:11.9,macchi_m3:15.95,lohner_l:16.2,aeg_g4:18.4,friedrichshafen_g3:23.7,breguet14:14.36,voisin8:17.92,caudron_g4:17.2,ssw_d3:8.43,pfalz_d12:9,phonix_d1:9.75,aviatik_d1:9,junkers_d1:9,ansaldo_sva5:9.1,hb_w29:13.5,ff33:16,felixstowe_f2:29.05,shuttelanz_sl11:22.9,parseval:11.2,caquot_balloon:13.4,lothar_dr1:7.19,beaulieu_dr1:7.19,mai_dr1:7.19,hantelmann_dr1:7.19,jasta11_fokkerd7:8.9,jasta18_fokkerd7:8.9,jasta27_fokkerd7:8.9,jasta43_fokkerd7:8.9,gabriel_fokkerd7:8.9,jasta4_albatros:9.05,jasta5_albatros:9.05,jasta78b_albatros:9.05,kissenberth_albatros:9.05,allmenroder_albatros:9.05,baeumer_pfalz:9,degelow_pfalz:9,linke_crawford_phonix:9.75,kiss_phonix:9.75,arigi_aviatik:9,gotha_night:23.7,staaken_dark:42.3,brown_camel:8.53,mcelroy_camel:8.53,dazzle_camel:8.53,lufbery_nieuport17:8.16,dorme_nieuport:8.16,meulemeester_nieuport:8.16,eagle_nieuport28:8,coppens_hanriot:8.7,madon_spad:8.25,tarascon_spad:8.25,boyau_spad:8.25,hatring_spad:8.25,springs_se5a:8.11,proctor_se5a:8.11,checker_se5a:8.11,ruffo_sva5:9.1,pierozzi_macchi:11.9};
const spriteScale=key=>WINGSPAN_M[key]==null?1:Math.min(1.18,Math.max(.8,(WINGSPAN_M[key]/8.5)**.8));
const PAINTED_KEYS=['fokker','fokker_standard','fokker_f1','albatros','camel','sopwith','nieuport','nieuport_italian','spad12','fokkerdv','re7','fokkerd7','eindecker','se5a','bristol_duo','halberstadt_duo','baron_albatros','albatros_d2','nieuport24','pfalz_d3a','airco_dh2','spad','be2c','aviatik','strutter','nieuport11','nieuport28','hanriot','pup','dh5','re8','dh4','albatros_d5a','fokker_jacobs','goering_fokkerd7','collishaw_sopwith','guynemer_spad','udet_fokkerdv','baracca_nieuport','berthold_pfalz','siemens_d4','roland_d6','hannover_cl3','dfw_cv','junkers_j1','gotha','bristol_m1','dolphin','snipe','fe2b','gunbus','morane_ai','rickenbacker_spad','ball_se5a','barker_snipe','luke_nieuport28','brumowski_albatros','gontermann_fokker','hansa_brandenburg_cc','lohner_l','macchi_m3','macchi_m5','wolff_albatros','loewenhardt_fokkerd7','mccudden_se5a','nungesser_nieuport24','aeg_g4','friedrichshafen_g3','breguet14','voisin8','caudron_g4','ssw_d3','pfalz_d12','phonix_d1','aviatik_d1','junkers_d1','ansaldo_sva5','hb_w29','ff33','felixstowe_f2','shuttelanz_sl11','parseval','caquot_balloon','staaken','handley-page','jasta4_albatros','jasta5_albatros','jasta78b_albatros','kissenberth_albatros','allmenroder_albatros','lothar_dr1','beaulieu_dr1','mai_dr1','hantelmann_dr1','jasta11_fokkerd7','jasta18_fokkerd7','jasta43_fokkerd7','gabriel_fokkerd7','jasta27_fokkerd7','baeumer_pfalz','degelow_pfalz','linke_crawford_phonix','kiss_phonix','arigi_aviatik','gotha_night','staaken_dark','brown_camel','mcelroy_camel','dazzle_camel','lufbery_nieuport17','dorme_nieuport','meulemeester_nieuport','eagle_nieuport28','coppens_hanriot','madon_spad','tarascon_spad','boyau_spad','hatring_spad','springs_se5a','proctor_se5a','checker_se5a','ruffo_sva5','pierozzi_macchi'];
const HANGAR_KEYS=['fokker','fokker_f1','fokker_standard','fokker_jacobs','baron_albatros','albatros','albatros_d2','eindecker','camel','sopwith','collishaw_sopwith','nieuport','nieuport_italian','nieuport24','baracca_nieuport','nungesser_nieuport24','luke_nieuport28','fokkerdv','udet_fokkerdv','spad','spad12','guynemer_spad','rickenbacker_spad','re7','fokkerd7','goering_fokkerd7','loewenhardt_fokkerd7','se5a','mccudden_se5a','ball_se5a','bristol_duo','halberstadt_duo','barker_snipe','brumowski_albatros','gontermann_fokker','wolff_albatros','berthold_pfalz'];
const loadPainted=key=>new Promise(resolve=>{
 const img=new Image();img.onload=()=>{
  const scan=document.createElement('canvas');scan.width=Math.ceil(img.naturalWidth/2);scan.height=Math.ceil(img.naturalHeight/2);const sc=scan.getContext('2d',{willReadFrequently:true});sc.drawImage(img,0,0,scan.width,scan.height);const pixels=sc.getImageData(0,0,scan.width,scan.height),rgba=pixels.data;if(key==='nieuport_italian')for(let i=0;i<rgba.length;i+=4){const r=rgba[i],g=rgba[i+1],b=rgba[i+2];if(rgba[i+3]>0&&b>70&&b>r*1.18&&b>g*1.05){rgba[i]=55;rgba[i+1]=132;rgba[i+2]=78}}clearAircraftMatte(key,rgba,scan.width,scan.height);clearCrewMatte(key,rgba,scan.width,scan.height);sc.putImageData(pixels,0,0);let minX=scan.width,minY=scan.height,maxX=-1,maxY=-1;
  for(let y=0;y<scan.height;y++)for(let x=0;x<scan.width;x++)if(rgba[(y*scan.width+x)*4+3]>128){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}
  if(maxX>=minX&&maxY>=minY){const out=document.createElement('canvas');out.width=288;out.height=320;const oc=out.getContext('2d');oc.imageSmoothingEnabled=true;oc.imageSmoothingQuality='high';const w=maxX-minX+1,h=maxY-minY+1,k=Math.min(228/w,264/h)*spriteScale(key),dw=Math.round(w*k),dh=Math.round(h*k);oc.drawImage(scan,minX,minY,w,h,Math.round((288-dw)/2),Math.round(152-dh/2),dw,dh);const sil=document.createElement('canvas');sil.width=288;sil.height=320;const sx=sil.getContext('2d');sx.drawImage(out,0,0);sx.globalCompositeOperation='source-in';sx.fillStyle='#140f08';sx.fillRect(0,0,288,320);const rim=document.createElement('canvas');rim.width=288;rim.height=320;const rc=rim.getContext('2d');for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(dx*dx+dy*dy<=5)rc.drawImage(sil,dx,dy);rc.drawImage(out,0,0);painted.set(key,rim);cache.clear();shadows.clear();flashes.clear()}resolve(true);
 };img.onerror=()=>resolve(false);const sourceKey=key==='nieuport_italian'?'nieuport':key;const mechDir=new URLSearchParams(location.search).get('mech')==='0'?'':'mech/';img.src=new URL(`./${mechDir}${sourceKey}.webp?v=317&b=317`,import.meta.url).href;
});
export const hangarArtReady=Promise.all(HANGAR_KEYS.map(loadPainted));
const individualAircraftReady=[hangarArtReady,hangarArtReady.then(()=>Promise.all(PAINTED_KEYS.filter(k=>!HANGAR_KEYS.includes(k)).map(loadPainted)))];
// The four aces once cut from this 2x2 atlas now ship as individual PNGs and are
// loaded through individualAircraftReady; keeping the list empty skips the atlas
// fetch entirely and prevents it overwriting the newer painted sprites.
const NEW_ACE_AIRCRAFT=[];
function clearNavyAtlasMatte(data,w,h){
 const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
 const matte=i=>{const r=data[i],g=data[i+1],b=data[i+2];return b<86&&g<70&&r<54&&b>=g*.92&&g>=r*.9};
 const add=(x,y)=>{if(x<0||x>=w||y<0||y>=h)return;const n=y*w+x;if(seen[n])return;seen[n]=1;const i=n*4;if(!matte(i))return;data[i+3]=0;queue[tail++]=n};
 for(let x=0;x<w;x++){add(x,0);add(x,h-1)}for(let y=0;y<h;y++){add(0,y);add(w-1,y)}
 while(head<tail){const n=queue[head++],x=n%w,y=Math.floor(n/w);add(x-1,y);add(x+1,y);add(x,y-1);add(x,y+1)}
}
const newAceAircraftReady=!NEW_ACE_AIRCRAFT.length?Promise.resolve(true):new Promise(resolve=>{
 const img=new Image();img.onload=()=>{
  const cellW=Math.floor(img.naturalWidth/2),cellH=Math.floor(img.naturalHeight/2);
  NEW_ACE_AIRCRAFT.forEach((key,index)=>{
   const scan=document.createElement('canvas');scan.width=cellW;scan.height=cellH;const sc=scan.getContext('2d',{willReadFrequently:true});
   sc.drawImage(img,(index%2)*cellW,Math.floor(index/2)*cellH,cellW,cellH,0,0,cellW,cellH);
   const pixels=sc.getImageData(0,0,cellW,cellH),rgba=pixels.data;clearNavyAtlasMatte(rgba,cellW,cellH);sc.putImageData(pixels,0,0);
   let minX=cellW,minY=cellH,maxX=-1,maxY=-1;for(let y=0;y<cellH;y++)for(let x=0;x<cellW;x++)if(rgba[(y*cellW+x)*4+3]>128){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}
   if(maxX<minX||maxY<minY)return;const out=document.createElement('canvas');out.width=288;out.height=320;const oc=out.getContext('2d');oc.imageSmoothingEnabled=true;oc.imageSmoothingQuality='high';
   const w=maxX-minX+1,h=maxY-minY+1,k=Math.min(236/w,272/h)*spriteScale(key),dw=Math.round(w*k),dh=Math.round(h*k);oc.drawImage(scan,minX,minY,w,h,Math.round((288-dw)/2),Math.round(152-dh/2),dw,dh);painted.set(key,out);
  });cache.clear();shadows.clear();flashes.clear();resolve(true);
 };img.onerror=()=>resolve(false);img.src=new URL('./new-aces-aircraft124.webp?v=317&b=317',import.meta.url).href;
});
// Painted battle-damage marks (bullet holes, torn canvas, scorch) applied over the
// authored sprites once a hull drops below half durability.
const damageDecals=[],damageCache=new Map();
const damageDecalReady=new Promise(resolve=>{
 const img=new Image();img.onload=()=>{
  const cellW=Math.floor(img.naturalWidth/3),cellH=Math.floor(img.naturalHeight/3);
  for(let i=0;i<9;i++){
   const sc=document.createElement('canvas');sc.width=cellW;sc.height=cellH;const c=sc.getContext('2d',{willReadFrequently:true});
   c.drawImage(img,(i%3)*cellW,Math.floor(i/3)*cellH,cellW,cellH,0,0,cellW,cellH);
   const d=c.getImageData(0,0,cellW,cellH).data;let l=cellW,t=cellH,r=0,b=0,any=false;
   for(let y=0;y<cellH;y++)for(let x=0;x<cellW;x++)if(d[(y*cellW+x)*4+3]>40){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);any=true}
   if(!any){damageDecals.push(null);continue}
   const cell=document.createElement('canvas');cell.width=r-l+1;cell.height=b-t+1;cell.getContext('2d').drawImage(sc,l,t,r-l+1,b-t+1,0,0,r-l+1,b-t+1);damageDecals.push(cell);
  }damageCache.clear();resolve(true);
 };img.onerror=()=>resolve(false);img.src=new URL('./damage-decals.webp?v=317&b=317',import.meta.url).href;
});
// Deterministic per-airframe mark layout so a plane's scars stay put between frames.
function damageSeed(key){let h=2166136261;for(const ch of key){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function damageRand(a){return()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^a>>>15,1|a);t=(t+Math.imul(t^t>>>7,61|t))^t;return((t^t>>>14)>>>0)/4294967296}}
function damagedSprite(base,key){
 if(damageCache.has(key))return damageCache.get(key);
 const out=document.createElement('canvas');out.width=base.width;out.height=base.height;const c=out.getContext('2d',{willReadFrequently:true});
 c.drawImage(base,0,0);
 const px=c.getImageData(0,0,out.width,out.height).data,opaque=[];
 for(let i=0;i<px.length;i+=4)if(px[i+3]>128)opaque.push(i/4);
 // Marks paint on a separate layer first so they can be clipped to the
 // airframe silhouette — a scar must never float on open sky.
 const layer=document.createElement('canvas');layer.width=out.width;layer.height=out.height;const lc=layer.getContext('2d');
 const rnd=damageRand(damageSeed(key)),spots=3+Math.floor(rnd()*2);
 for(let s=0;s<spots&&opaque.length;s++){
  const d=damageDecals[Math.floor(rnd()*damageDecals.length)];if(!d)continue;
  const at=opaque[Math.floor(rnd()*opaque.length)],tx=at%out.width,ty=Math.floor(at/out.width);
  const w=4.5+rnd()*7,h=w*d.height/d.width,a=(rnd()-.5)*.9;
  lc.save();lc.translate(tx,ty);lc.rotate(a);lc.globalAlpha=.75+rnd()*.25;lc.drawImage(d,-w/2,-h/2,w,h);lc.restore();
 }
 c.globalCompositeOperation='source-atop';c.drawImage(layer,0,0);c.fillStyle='rgba(24,19,12,.12)';c.fillRect(0,0,out.width,out.height);c.globalCompositeOperation='source-over';
 damageCache.set(key,out);return out;
}
export const aircraftReady=Promise.all([...individualAircraftReady,newAceAircraftReady,damageDecalReady]);
function build(key){
 key=campaignSpriteAliases[key]||key;

 if(key==='fokker_red')key='fokker';
 if(painted.has(key))return painted.get(key);
 const p=AIRFRAMES[key]||AIRFRAMES.camel,canvas=document.createElement('canvas');canvas.width=144;canvas.height=160;const c=canvas.getContext('2d');c.translate(72,76);const [dark,shade,base,light]=p.paint;
 const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
 const line=(x0,y0,x1,y1,color)=>{let dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1,err=dx+dy;while(true){r(x0,y0,1,1,color);if(x0===x1&&y0===y1)break;let e=2*err;if(e>=dy){err+=dy;x0+=sx}if(e<=dx){err+=dx;y0+=sy}}};
 const oval=(x,y,rx,ry,color)=>{for(let yy=-ry;yy<=ry;yy++){let w=Math.floor(rx*Math.sqrt(Math.max(0,1-yy*yy/(ry*ry))));r(x-w,y+yy,2*w+1,1,color)}};
 function cross(x,y){
  // 1917-style flared cross: white edging stays legible under rotation.
  // Draw a cross pattée with concave sides, not a plus or a roundel.
  const filled=(xx,yy)=>{let ax=Math.abs(xx-8),ay=Math.abs(yy-8);return (ay>=ax&&ax<=2+Math.floor(Math.max(0,ay-3)*.6))||(ax>=ay&&ay<=2+Math.floor(Math.max(0,ax-3)*.6))};
  for(let yy=0;yy<17;yy++)for(let xx=0;xx<17;xx++)if(filled(xx,yy))r(x+xx-9,y+yy-9,3,3,'#f3eada');
  for(let yy=0;yy<17;yy++)for(let xx=0;xx<17;xx++)if(filled(xx,yy))r(x+xx-8,y+yy-8,1,1,'#19201e');
 }
 function roundel(x,y){if(p.country==='italy'){oval(x,y,9,9,'#b94a42');oval(x,y,6,6,'#eee8d3');oval(x,y,3,3,'#39834f');return}oval(x,y,9,9,p.country==='france'?'#a44739':'#354d67');oval(x,y,6,6,'#e8e5ce');oval(x,y,3,3,p.country==='france'?'#354d67':'#b85243')}
 function wing(span,y,chord,top){
  // Rounded tips, fabric ribs, trailing aileron seam and layered shadow.
  r(-span+4,y-1,span*2-8,chord+3,dark);r(-span+1,y+2,span*2-2,chord-3,dark);r(-span+3,y,span*2-6,chord,shade);r(-span+5,y,span*2-10,chord-3,base);r(-span+6,y,span*2-12,2,light);
  for(let x=-span+11;x<span-5;x+=7){r(x,y+3,1,chord-6,light);r(x+1,y+3,1,chord-5,shade)}
  r(-span+6,y+chord-5,span*2-12,1,dark);r(-span+7,y+chord-4,span*2-14,1,base);
  for(let side of [-1,1]){r(side<0?-span+15:span-16,y+chord-5,1,4,dark);r(side<0?-span+30:span-31,y+chord-5,1,4,dark)}
  if(top){if(p.cross){cross(-span+17,y+10);cross(span-17,y+10)}else{roundel(-span+16,y+10);roundel(span-16,y+10)}}
 }
 // Undercarriage and lowest wing remain visible in the shallow overhead view.
 r(-13,5,3,24,'#202b26');r(10,5,3,24,'#202b26');line(-11,8,0,-12,'#4c5142');line(11,8,0,-12,'#4c5142');r(-14,26,6,10,'#242925');r(9,26,6,10,'#242925');
 const tailY=p.nose+p.body-8;
 oval(0,tailY,p.tail,9,dark);oval(0,tailY-1,p.tail-2,7,base);r(-p.tail+6,tailY-5,p.tail*2-12,1,light);r(-p.tail+4,tailY+2,p.tail*2-8,1,shade);
 // Long plywood taper on Albatros; compact radial fuselage on Dr.I.
 const end=p.nose+p.body;for(let y=p.nose+6;y<=end;y++){let f=(y-p.nose)/p.body;let half=key==='albatros'?Math.max(3,Math.round(11*(1-f)+3*Math.sin(f*Math.PI))):Math.max(3,Math.round(10*(1-f)+2));r(-half,y,half*2+1,1,dark);r(-half+2,y,half*2-3,1,shade);r(-half+2,y,half+1,1,base);r(-2,y,2,1,light)}
 if(key==='albatros')for(let y=0;y<end-7;y+=10){line(-5,y,5,y+2,'#9b764e');r(-5,y+3,1,1,'#e2bd7b')}
 if(key==='spad'){r(-10,-38,4,21,'#3b4331');r(4,14,4,11,'#665942')}
 // Rudder with aircraft-specific national colors.
 if(p.cross){oval(0,end-3,6,11,'#e8dfc8');r(-1,end-11,2,16,'#30342d');r(-4,end-5,8,3,'#30342d')}else{oval(0,end-3,6,10,'#e4e0c6');if(p.country==='italy'){r(-5,end-9,3,13,'#39834f');r(3,end-9,3,13,'#b94a42')}else{r(-5,end-9,3,13,p.country==='france'?'#385575':'#aa4c40');r(3,end-9,3,13,p.country==='france'?'#ad4c3e':'#385575')}}
 // Paint lower wings first. The separated chord bands deliberately expose all
 // three planes on Dr.I at gameplay size, while preserving its compact body.
 for(let i=0;i<p.wings.length;i++){const [span,y,chord]=p.wings[i];if(i){const previous=p.wings[i-1];for(let side of [-1,1]){line(side*34,previous[1]+4,side*34,y+chord-1,'#242b27');line(side*35,previous[1]+4,side*35,y+chord-1,'#d0b887');if(key!=='fokker'){line(side*12,previous[1]+8,side*35,y+chord-1,'#b7b39b');line(side*34,previous[1]+6,side*13,y+chord-1,'#383e32')}}}wing(span,y,chord,i===p.wings.length-1)}
 // Cabane struts, twin machine-guns and open cockpit.
 line(-8,-8,-13,-18,'#262b24');line(8,-8,13,-18,'#262b24');r(-5,-24,3,14,'#242c29');r(3,-24,3,14,'#242c29');r(-5,-24,1,12,'#a6a99b');r(3,-24,1,12,'#a6a99b');
 oval(0,6,7,10,dark);oval(0,5,5,7,'#222b29');r(-4,0,8,2,'#d6bd87');r(-3,2,6,3,'#73938c');oval(0,8,3,4,'#ad8153');r(-2,6,4,2,'#e0ba79');
 if(key==='camel'){r(-8,-9,16,6,shade);r(-6,-10,12,2,light)}
 // Engine cowling, cooling vents, brass hub and a wooden two-blade propeller.
 const ny=p.nose;
 if(key==='albatros'||key==='spad'){oval(0,ny+5,10,9,dark);oval(0,ny+4,8,8,base);r(-5,ny+1,10,2,light);for(let i=-6;i<=6;i+=3)r(i,ny+6,1,5,'#353b31')}
 else{oval(0,ny+6,12,11,dark);oval(0,ny+4,11,9,key==='fokker'?'#bc3d35':'#a8aca0');oval(0,ny+6,8,7,'#343d37');for(let x=-6;x<=6;x+=3)r(x,ny+2,1,7,'#7f8575');r(-8,ny-2,16,2,key==='fokker'?'#ea7458':'#dbdecb')}
 line(-22,ny-6,22,ny-2,'#573f2b');line(-22,ny-5,22,ny-1,'#9e7442');line(-19,ny-5,19,ny-2,'#dab57a');oval(0,ny-3,3,3,'#c9b78b');r(-1,ny-5,2,3,'#efdcaa');
 // Small scuffs stay sparse so insignia and wing structure carry the silhouette.
 r(-24,p.wings.at(-1)[1]+3,3,1,'#e8d1a066');r(20,p.wings.at(-1)[1]+15,2,1,dark);
 return canvas;
}
export function aircraftKey(key,enemy=false,pilot=null){if(key==='fokker'&&!enemy){if(pilot==='baron')return 'fokker_red';if(pilot==='voss')return 'fokker_voss';if(pilot==='jacobs')return 'fokker_jacobs'}return key}
export function planeSprite(c,x,y,a,key,scale=1,enemy=false,shadow=false,flash=0,damaged=false){
 const redAce=key==='fokker_red',variant=key==='fokker_voss',standard=key==='fokker';const cacheKey=redAce?'fokker':variant?'fokker_voss':standard?'fokker_standard':key;
 const sourceKey=campaignSpriteAliases[key]||(redAce?'fokker':variant?'fokker_f1':standard?'fokker_standard':key);
 // Never fall back to the retired procedural planes while the authored art is
 // loading (or if an asset fails). A blank frame is preferable to a visual swap.
 if(!painted.has(sourceKey))return;
 if(!cache.has(cacheKey)){const source=cache.get(cacheKey)||build(redAce?'fokker':variant?'fokker_f1':standard?'fokker_standard':key);cache.set(cacheKey,source)}const sprite=damaged&&damageDecals.length?damagedSprite(cache.get(cacheKey),cacheKey):cache.get(cacheKey);
 c.save();c.imageSmoothingEnabled=false;c.translate(Math.round(x),Math.round(y));c.rotate(a+Math.PI/2);
 const s=scale*.54;c.scale(s,s);
 if(shadow){if(!shadows.has(cacheKey)){const sh=document.createElement('canvas');sh.width=144;sh.height=160;const sc=sh.getContext('2d');sc.imageSmoothingEnabled=true;sc.imageSmoothingQuality='high';sc.drawImage(sprite,0,0,144,160);sc.globalCompositeOperation='source-in';sc.fillStyle='#18271f';sc.fillRect(0,0,144,160);shadows.set(cacheKey,sh)}c.globalAlpha*=.26;c.drawImage(shadows.get(cacheKey),-72,-76)}
 else {c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(sprite,-72,-76,144,160);if(flash>0){const fk=damaged?cacheKey+'#d':cacheKey;if(!flashes.has(fk)){const f=document.createElement('canvas');f.width=144;f.height=160;const fc=f.getContext('2d');fc.imageSmoothingEnabled=true;fc.imageSmoothingQuality='high';fc.drawImage(sprite,0,0,144,160);fc.globalCompositeOperation='source-in';fc.fillStyle='#fff1c9';fc.fillRect(0,0,144,160);flashes.set(fk,f)}c.globalAlpha*=Math.min(.9,flash/.16);c.drawImage(flashes.get(fk),-72,-76)}}
 c.restore();
}

// Campaign aircraft mostly have dedicated PNGs; only the Mark IV tank remains on
// the atlas. The alias defaults below resolve the remaining campaign ids even when
// registerCampaignSpriteAliases has not run in this module instance.
const campaignSpriteAliases={dh2:'airco_dh2',fokker_e1:'eindecker',fokker_d7_campaign:'fokkerd7',albatros_d5:'albatros_d5a',oeffag:'albatros',bristol:'bristol_duo',spad7:'spad',halberstadt:'halberstadt_duo',fokker_campaign:'fokker_standard'};
export function registerCampaignSpriteAliases(aliases){Object.assign(campaignSpriteAliases,aliases)}
export const campaignArtReady=new Promise(resolve=>{
 const img=new Image();img.onload=()=>{
  for(const [i,key] of ['markiv'].entries()){
   const out=document.createElement('canvas');out.width=288;out.height=320;const c=out.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
   const boxes=[[75,18,364,445]];
   const cell=i===0?5:i;
   const [x,y,w,h]=boxes[i],k=Math.min(228/w,264/h),dw=Math.round(w*k),dh=Math.round(h*k);
   c.drawImage(img,cell%3*512+x,Math.floor(cell/3)*512+y,w,h,Math.round((288-dw)/2),Math.round(152-dh/2),dw,dh);painted.set(key,out);
  }cache.clear();shadows.clear();flashes.clear();resolve(true);
 };img.onerror=()=>resolve(false);img.src=new URL('./campaign-units.webp?v=317&b=317',import.meta.url).href;
});

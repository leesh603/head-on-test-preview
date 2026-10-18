// Registered three-column atlases: intact, damaged, destroyed. Coordinates
// below are painted panel footprints in hull space, not combat hit boxes.
export const MAAN_ART_COLUMNS=3;
export const MAAN_DAMAGE_PANELS=Object.freeze({
 wustenpanzer:Object.freeze({
  'track-left':[-116,89,61,160], 'track-right':[55,89,61,160],
  'heavy-gun':[-22,-260,44,159],
  'aa-left':[-101,-209,47,75], 'aa-right':[54,-209,47,75],
  'sponson-left':[-124,-37,66,65], 'sponson-right':[58,-37,66,65],
  radiator:[-52,-28,104,101], engine:[-57,89,114,124]
 }),
 'sinai-landship':Object.freeze({
  'track-front-left':[-102,-254,49,54], 'track-front-right':[53,-254,49,54],
  'track-rear-left':[-105,158,53,100], 'track-rear-right':[52,158,53,100],
  'sponson-left-front':[-142,-153,61,67], 'sponson-right-front':[81,-153,61,67],
  'sponson-left-rear':[-142,43,61,66], 'sponson-right-rear':[81,43,61,66],
  lewis:[-25,-226,50,66], tank:[-44,-75,88,140],
  command:[-48,109,96,141], support:[-43,63,86,45]
 })
});
export const MAAN_TRACK_WINDOWS=Object.freeze({
 wustenpanzer:[['track-left',-82,157,36,120],['track-right',82,157,36,120]],
 'sinai-landship':[['track-front-left',-78,-231,29,33],['track-front-right',78,-231,29,33],['track-rear-left',-80,202,31,67],['track-rear-right',80,202,31,67]]
});
export function maanArtState(part){return part?.destroyed?2:part&&part.hp<=part.maxHp*.5?1:0;}
export function maanArtSignature(parts){return [...parts.values()].map(maanArtState).join('');}
export function maanWorkshopSpread(age,hullWidth){
 const q=Math.max(0,Math.min(1,age/.55));return (hullWidth+24)/2*(1-(1-q)**3);
}

const atlasCache=new WeakMap(),maskCache=new Map();
function stateCanvases(im,layout){
 let entry=atlasCache.get(im);
 if(entry)return entry;
 entry=Array.from({length:MAAN_ART_COLUMNS},(_,state)=>{
  const cv=document.createElement('canvas');cv.width=layout.width;cv.height=layout.height;
  const c=cv.getContext('2d'),cw=im.naturalWidth/MAAN_ART_COLUMNS;
  c.drawImage(im,state*cw,0,cw,im.naturalHeight,0,0,cv.width,cv.height);return cv;
 });atlasCache.set(im,entry);return entry;
}
function panelMask(kind,id,layout){
 const key=kind+':'+id;if(maskCache.has(key))return maskCache.get(key);
 const cv=document.createElement('canvas');cv.width=layout.width;cv.height=layout.height;
 const c=cv.getContext('2d'),[x,y,w,h]=MAAN_DAMAGE_PANELS[kind][id];
 // A narrow feather hides subpixel atlas registration differences. Masks
 // never extend beyond the authored panel, including transparent wreck holes.
 for(let inset=0;inset<4;inset++){
  c.fillStyle=inset===3?'#fff':'rgba(255,255,255,.35)';c.beginPath();
  c.roundRect(x+layout.width/2+inset,y+layout.height/2+inset,w-inset*2,h-inset*2,Math.max(1,5-inset));c.fill();
 }
 maskCache.set(key,cv);return cv;
}
export function maanHullSprite(b,im){
 if(!im.naturalWidth)return null;
 const states=stateCanvases(im,b.layout);
 if(b.dead)return states[2];
 const signature=maanArtSignature(b.parts);
 if(!/[12]/.test(signature))return states[0];
 if(b._maanSprite?.source===im&&b._maanSprite.signature===signature)return b._maanSprite.canvas;
 const canvas=document.createElement('canvas');canvas.width=b.layout.width;canvas.height=b.layout.height;
 const c=canvas.getContext('2d'),patch=document.createElement('canvas');patch.width=canvas.width;patch.height=canvas.height;
 const p=patch.getContext('2d');c.drawImage(states[0],0,0);
 for(const part of b.parts.values()){
  const state=maanArtState(part);if(!state||!MAAN_DAMAGE_PANELS[b.kind][part.id])continue;
  const mask=panelMask(b.kind,part.id,b.layout);
  p.clearRect(0,0,patch.width,patch.height);p.globalCompositeOperation='source-over';p.drawImage(states[state],0,0);
  p.globalCompositeOperation='destination-in';p.drawImage(mask,0,0);
  // Erase the intact panel first; transparent gaps in broken treads and
  // severed guns must reveal the ground instead of retaining intact pixels.
  c.globalCompositeOperation='destination-out';c.drawImage(mask,0,0);
  // Add premultiplied masked pixels to the complement left above. This
  // preserves alpha at feather edges instead of making a dark translucent rim.
  c.globalCompositeOperation='lighter';c.drawImage(patch,0,0);
  c.globalCompositeOperation='source-over';
 }
 b._maanSprite={source:im,signature,canvas};return canvas;
}

// Keep a small working set of decoded cut-ins; regional preloads share requests.
const cutinImages=new Map();
const CUTIN_CACHE_LIMIT=12;
function trimCutinImages(){
 for(const [key,entry]of cutinImages){
  if(cutinImages.size<=CUTIN_CACHE_LIMIT)break;
  if(entry.settled)cutinImages.delete(key);
 }
}
export function prepareCutinImage(src,priority='low'){
 if(!src||typeof Image==='undefined')return Promise.resolve(null);
 const cached=cutinImages.get(src);
 if(cached){cutinImages.delete(src);cutinImages.set(src,cached);if(priority==='high')cached.image.fetchPriority='high';return cached.promise}
 const image=new Image();image.decoding='async';image.fetchPriority=priority;
 const entry={image,settled:false,promise:null};
 entry.promise=new Promise(resolve=>{
  image.onload=async()=>{try{if(image.decode)await image.decode();entry.settled=true;resolve(image)}catch{entry.settled=true;resolve(null)}finally{trimCutinImages()}};
  image.onerror=()=>{entry.settled=true;cutinImages.delete(src);resolve(null)};
 });cutinImages.set(src,entry);image.src=src;trimCutinImages();return entry.promise;
}
// Decode off-screen, then replace the DOM node. An older request never commits
// after a newer cut-in or after the player leaves the current sortie.
export function createCutinPresenter(getImage){
 let serial=0;
 return async(src,alt,isCurrent=()=>true)=>{
  const request=++serial,target=getImage();target.style.visibility='hidden';
  const prepared=await prepareCutinImage(src,'high');
  if(request!==serial||!isCurrent())return false;
  if(!prepared)return true; // Correct text may still appear; stale art stays hidden.
  const replacement=target.cloneNode(false);replacement.src=src;replacement.alt=alt;replacement.decoding='async';
  try{if(replacement.decode)await replacement.decode()}catch{return request===serial&&isCurrent()}
  if(request!==serial||!isCurrent())return false;
  replacement.style.visibility='';target.replaceWith(replacement);return true;
 };
}

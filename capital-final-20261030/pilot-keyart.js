// One representative painting per pilot, independent of selected airframe and combat.
const art=(id,version='pilotkey1')=>Object.freeze({mobile:`hangar-keyart/${id}.webp?v=${version}`,pc:`hangar-keyart/${id}.webp?v=${version}`});
export const PILOT_KEYART=Object.freeze({
 navarre:Object.freeze({mobile:'https://head-on-aces.justzeon.chatgpt.site/portrait-sized/portrait-navarre.webp?v=capital-final-20261030&opt=1',pc:'https://head-on-aces.justzeon.chatgpt.site/portrait-sized/portrait-navarre.webp?v=capital-final-20261030&opt=1'}),
 frommherz:Object.freeze({mobile:'https://head-on-aces.justzeon.chatgpt.site/portrait-sized/portrait-frommherz.webp?v=capital-final-20261030&opt=1',pc:'https://head-on-aces.justzeon.chatgpt.site/portrait-sized/portrait-frommherz.webp?v=capital-final-20261030&opt=1'}),
 baron:Object.freeze({mobile:'https://head-on-aces.justzeon.chatgpt.site/hangar-keyart-mobile.webp?v=capital-final-20261030',pc:'https://head-on-aces.justzeon.chatgpt.site/hangar-keyart-pc.webp?v=capital-final-20261030'}),
 voss:art('voss','pilotkey3'),boelcke:art('boelcke','pilotkey3'),immelmann:art('immelmann'),udet:art('udet'),goering:art('goering'),huffzky:art('huffzky'),berthold:art('berthold'),wolff:art('wolff'),loewenhardt:art('loewenhardt'),jacobs:art('jacobs','pilotkey3'),brumowski:art('brumowski','pilotkey5'),gontermann:art('gontermann','pilotkey2'),lothar:art('lothar'),sachsenberg:art('sachsenberg','pilotkey3'),schleich:art('schleich'),fonck:art('fonck'),collishaw:art('collishaw'),baracca:art('baracca'),guynemer:art('guynemer','pilotkey3'),bishop:art('bishop'),mannock:art('mannock'),mckeever:art('mckeever','pilotkey4'),hawker:art('hawker'),mccudden:art('mccudden','pilotkey2'),nungesser:art('nungesser','pilotkey2'),rickenbacker:art('rickenbacker'),ball:art('ball'),barker:art('barker','pilotkey2'),luke:art('luke'),proctor:art('proctor'),lufbery:art('lufbery')
});
const controllers=new WeakMap();
function loadImage(url){
 return new Promise((resolve,reject)=>{
  const img=new Image();img.decoding='async';
  img.onload=()=>Promise.resolve(img.decode?.()).then(()=>resolve(url),reject);
  img.onerror=()=>reject(new Error('Pilot key art failed: '+url));
  img.src=url;globalThis.HEADON_GATE?.raise?.([url]);
 });
}
export function createPilotKeyartController(root,{load=loadImage,now=()=>Date.now()}={}){
 let selected='',serial=0,pending=Promise.resolve(false),retryAt=0;
 const recent=new Map();
 const request=url=>{
  if(recent.has(url))return recent.get(url);
  const job=Promise.resolve().then(()=>load(url)).catch(error=>{recent.delete(url);throw error});
  recent.set(url,job);if(recent.size>3)recent.delete(recent.keys().next().value);
  return job;
 };
 return id=>{
  const entry=PILOT_KEYART[id];if(!root||!entry)return Promise.resolve(false);
  if(id===selected&&(!retryAt||now()<retryAt))return pending;
  selected=id;retryAt=0;const token=++serial;
  root.dataset.pilotKeyartRequested=id;root.dataset.pilotKeyartStatus='loading';
  pending=Promise.all([...new Set([entry.mobile,entry.pc])].map(request)).then(()=>{
   if(token!==serial)return false;
   root.style.setProperty('--ho-keyart',`url("${entry.mobile}")`);
   root.style.setProperty('--ho-keyart-pc',`url("${entry.pc}")`);
   root.style.setProperty('--ho-keyart-focus','50% 0%');
   root.style.setProperty('--ho-keyart-focus-pc',id==='baron'?'65% 30%':'50% 0%');
   root.dataset.pilotKeyart=id;root.dataset.pilotKeyartStatus='ready';return true;
  }).catch(error=>{
   if(token!==serial)return false;
   root.style.setProperty('--ho-keyart','none');root.style.setProperty('--ho-keyart-pc','none');
   delete root.dataset.pilotKeyart;root.dataset.pilotKeyartStatus='error';retryAt=now()+5000;
   console.error('[HEAD-ON] pilot key art',id,error);return false;
  });
  return pending;
 };
}
export function selectPilotKeyart(root,id){
 if(!root)return Promise.resolve(false);
 if(!controllers.has(root))controllers.set(root,createPilotKeyartController(root));
 return controllers.get(root)(id);
}

/*
 * HEAD-ON hangar portrait continuity / 186
 * Adjusts only visual fitting variables for the existing #hangarPortrait image.
 */
const portrait186=document.getElementById("hangarPortrait");
const tabs186=document.getElementById("pilotTabs");

// Fit the painted bust, rather than its transparent square, to the card height.
const CREW_BOUNDS186={huffzky:{top:228/1254,bottom:1116/1254},mckeever:{top:88/1254,bottom:1141/1254}};
function crewFit186(height,id,ratio=1){
  const {top,bottom}=CREW_BOUNDS186[id];
  const rendered=height*.9/(bottom-top);
  return {height:rendered,width:rendered*ratio,offset:rendered*(1-bottom)};
}
function crewPilot186(image){return image===portrait186?activePilot186():image.closest('[data-pilot-id]')?.dataset.pilotId}
const crewResize186=new ResizeObserver(entries=>{for(const {target}of entries){const image=target.querySelector('img');if(image)anchorCrew186(image,crewPilot186(image))}});
function anchorCrew186(image,id){
  let frame=image.parentElement;
  if(!CREW_BOUNDS186[id]){if(frame.classList.contains('crew-portrait-frame'))delete frame.dataset.crewFloor;delete image.dataset.crewFloor;return}
  if(!frame.classList.contains('crew-portrait-frame')){
    frame=document.createElement('span');frame.className='crew-portrait-frame';
    image.replaceWith(frame);frame.append(image);crewResize186.observe(frame);
    image.addEventListener('load',()=>anchorCrew186(image,crewPilot186(image)));
  }
  frame.dataset.crewFloor=id;image.dataset.crewFloor=id;
  const ratio=image.naturalWidth&&image.naturalHeight?image.naturalWidth/image.naturalHeight:1;
  const fit=crewFit186(frame.clientHeight,id,ratio);
  for(const [key,value]of Object.entries(fit))frame.style.setProperty('--crew-'+key,value.toFixed(3)+'px');
}

const PORTRAIT_TUNE186=Object.freeze({
  mckeever:{desktop:.82,mobile:.62,liftD:-6,liftM:-8},
  huffzky:{desktop:.85,mobile:.66,liftD:-4,liftM:-6},
  bishop:{desktop:.96,mobile:.94,liftD:4,liftM:5},
  mannock:{desktop:.96,mobile:.94,liftD:-4,liftM:-6},
  mccudden:{desktop:.97,mobile:.95,liftD:-4,liftM:-6},
  nungesser:{desktop:.97,mobile:.95},
  wolff:{desktop:.98,mobile:.96,liftD:-4,liftM:-6},
  loewenhardt:{desktop:.98,mobile:.96,liftD:-4,liftM:-6},
  boelcke:{liftD:-4,liftM:-6},
  udet:{liftD:-4,liftM:-6},
  berthold:{liftD:-4,liftM:-6},
  jacobs:{liftD:-4,liftM:-6},
  fonck:{liftD:4,liftM:5}
});

function activePilot186(){
  return tabs186?.querySelector("[data-pilot-id].active")?.dataset?.pilotId||"";
}

function autoScale186(){
  if(!portrait186?.naturalWidth||!portrait186?.naturalHeight)return{desktop:.98,mobile:.96};
  const ratio=portrait186.naturalWidth/portrait186.naturalHeight;
  if(ratio>=1.0)return{desktop:.90,mobile:.87};
  if(ratio>=.82)return{desktop:.94,mobile:.91};
  if(ratio>=.66)return{desktop:.97,mobile:.94};
  return{desktop:.99,mobile:.97};
}

function syncPortrait186(){
  if(!portrait186)return;
  const id=activePilot186();
  anchorCrew186(portrait186,id);
  for(const button of tabs186?.querySelectorAll('[data-pilot-id]')||[]){
    if(CREW_BOUNDS186[button.dataset.pilotId]){const image=button.querySelector('.pilot-tab-portrait');if(image)anchorCrew186(image,button.dataset.pilotId)}
  }
  const base=autoScale186();
  const tune=PORTRAIT_TUNE186[id]||base;
  portrait186.classList.add("hangar-portrait186");
  if(id)portrait186.dataset.pilotId=id;
  portrait186.style.setProperty("--hp-scale-desktop",String(tune.desktop??base.desktop));
  portrait186.style.setProperty("--hp-scale-mobile",String((tune.mobile??base.mobile)*1.35));
  portrait186.style.setProperty("--hp-shift-desktop","0%");
  portrait186.style.setProperty("--hp-shift-mobile","0%");
  portrait186.style.setProperty("--hp-lift-desktop",(tune.liftD??0)+"%");
  portrait186.style.setProperty("--hp-lift-mobile",(tune.liftM??0)+"%");
}

if(portrait186){
  portrait186.addEventListener("load",syncPortrait186);
  new MutationObserver(syncPortrait186).observe(portrait186,{attributes:true,attributeFilter:["src"]});
}
if(tabs186)new MutationObserver(syncPortrait186).observe(tabs186,{
  subtree:true,
  childList:true,
  attributes:true,
  attributeFilter:["class"]
});

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",syncPortrait186,{once:true});
else syncPortrait186();

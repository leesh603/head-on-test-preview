/*
 * HEAD-ON hangar portrait continuity / 186
 * Adjusts only visual fitting variables for the existing #hangarPortrait image.
 */
const portrait186=document.getElementById("hangarPortrait");
const tabs186=document.getElementById("pilotTabs");

const PORTRAIT_TUNE186=Object.freeze({
  mckeever:{desktop:.91,mobile:.88},
  huffzky:{desktop:.91,mobile:.88},
  bishop:{desktop:.96,mobile:.94},
  mannock:{desktop:.96,mobile:.94},
  mccudden:{desktop:.97,mobile:.95},
  nungesser:{desktop:.97,mobile:.95},
  wolff:{desktop:.98,mobile:.96},
  loewenhardt:{desktop:.98,mobile:.96}
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
  const base=autoScale186();
  const tune=PORTRAIT_TUNE186[id]||base;
  portrait186.classList.add("hangar-portrait186");
  if(id)portrait186.dataset.pilotId=id;
  portrait186.style.setProperty("--hp-scale-desktop",String(tune.desktop??base.desktop));
  portrait186.style.setProperty("--hp-scale-mobile",String((tune.mobile??base.mobile)*1.7));
  portrait186.style.setProperty("--hp-shift-desktop","0%");
  portrait186.style.setProperty("--hp-shift-mobile","0%");
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

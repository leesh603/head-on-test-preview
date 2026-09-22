/*
 * HEAD-ON HUD continuity / 184
 * Presentation-only adapter. No combat/ranking/save behavior changes.
 */
const $=id=>document.getElementById(id);

function decorateAce(){
  const root=$("bossArrival");
  if(!root)return;
  root.classList.add("hc-ace-arrival");
  const portrait=root.querySelector(".boss-portrait-window");
  const copy=[...root.children].find(node=>node!==portrait && node.nodeType===1 && !node.classList.contains("hc-ace-sight"));
  if(copy){
    copy.classList.add("hc-ace-copy");
    const label=copy.querySelector("small");
    if(label && label.textContent!=="적 에이스 등장")label.textContent="적 에이스 등장";
  }
  const detail=$("bossArrivalDetail");
  if(detail)detail.hidden=true;
  if(!root.querySelector(".hc-ace-sight")){
    const sight=document.createElement("span");
    sight.className="hc-ace-sight";
    sight.setAttribute("aria-hidden","true");
    root.append(sight);
  }
}

function syncModal(){
  const modal=$("modal");
  if(!modal)return;
  const pause=modal.classList.contains("build-modal151") && !!$("build151");
  const ranking=!!$("rankingPanel") || $("modalTag")?.textContent?.trim()==="RANKING MODE";
  modal.classList.toggle("hc-pause-modal",pause);
  modal.classList.toggle("hc-ranking-modal",!pause&&ranking);
  if(pause){
    if($("modalTag"))$("modalTag").textContent="PAUSED";
    if($("modalTitle"))$("modalTitle").textContent="일시 정지";
    if($("modalText"))$("modalText").textContent="";
  }else if(ranking){
    if($("modalTag"))$("modalTag").textContent="RANKING";
    if($("modalTitle"))$("modalTitle").textContent="출격 기록";
  }
}

function install(){
  decorateAce();
  syncModal();
  const boss=$("bossArrival");
  if(boss)new MutationObserver(decorateAce).observe(boss,{subtree:true,childList:true,attributes:true,attributeFilter:["class","src"]});
  const modal=$("modal");
  if(modal)new MutationObserver(syncModal).observe(modal,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});
else install();

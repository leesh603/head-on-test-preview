/*
 * HEAD-ON HUD continuity / 184
 * Presentation-only adapter. No combat/ranking/save behavior changes.
 */
const $=id=>document.getElementById(id);

/* Pilot display contract / 185
 * KO: Korean real name + English alias.
 * EN: English real name + English alias.
 * Gameplay IDs and stored records stay untouched.
 */
const PILOT_IDENTITY185=Object.freeze({
 baron:{ko:"만프레드 폰 리히트호펜",en:"Manfred von Richthofen",alias:"THE RED BARON",legacy:["붉은 남작"]},
 fonck:{ko:"르네 폰크",en:"René Fonck",alias:"THE PRECISION ACE"},
 voss:{ko:"베르너 포스",en:"Werner Voss",alias:"THE LONE HUSSAR"},
 boelcke:{ko:"오스왈드 뵐케",en:"Oswald Boelcke",alias:"THE FATHER OF FIGHTERS"},
 collishaw:{ko:"레이몬드 콜리쇼",en:"Raymond Collishaw",alias:"THE BLACK FLIGHT"},
 baracca:{ko:"프란체스코 바라카",en:"Francesco Baracca",alias:"THE ACE OF THE CAVALRY"},
 udet:{ko:"에른스트 우데트",en:"Ernst Udet",alias:"LO · THE DAREDEVIL"},
 guynemer:{ko:"조르즈 기네미르",en:"Georges Guynemer",alias:"THE STORK"},
 bishop:{ko:"빌리 비숍",en:"Billy Bishop",alias:"GUERRILLA NIGHT"},
 goering:{ko:"헤르만 괴링",en:"Hermann Göring",alias:"WHITE FLIGHT LEADER"},
 immelmann:{ko:"막스 임멜만",en:"Max Immelmann",alias:"THE EAGLE OF LILLE"},
 mannock:{ko:"믹 매녹",en:"Mick Mannock",alias:"74 SQUADRON"},
 mckeever:{ko:"맥키버 & 파월",en:"McKeever & Powell",alias:"THE HAWK & THE GNAT"},
 huffzky:{ko:"후프츠키 & 에만",en:"Huffzky & Ehmann",alias:"SCHLASTA 15"},
 hawker:{ko:"라노 호커",en:"Lanoe Hawker",alias:"VICTORIA CROSS"},
 berthold:{ko:"루돌프 베르토홀트",en:"Rudolf Berthold",alias:"THE IRON KNIGHT"},
 wolff:{ko:"쿠르트 볼프",en:"Kurt Wolff",alias:"ZARTE BLÜMLEIN"},
 loewenhardt:{ko:"에리히 뢰벤하르트",en:"Erich Loewenhardt",alias:"YELLOW PERIL"},
 mccudden:{ko:"제임스 맥커든",en:"James McCudden",alias:"THE ENGINEERING ACE"},
 nungesser:{ko:"샤를 너겐서",en:"Charles Nungesser",alias:"THE KNIGHT OF DEATH"},
 jacobs:{ko:"요제프 야콥스",en:"Josef Jacobs",alias:"THE HAWK OF JASTA 7"},
 rickenbacker:{ko:"에디 리켄바커",en:"Eddie Rickenbacker",alias:"HAT IN THE RING"},
 ball:{ko:"앨버트 볼",en:"Albert Ball",alias:"LONE HAWK OF THE RFC"},
 barker:{ko:"빌리 바커",en:"Billy Barker",alias:"THE LAST STAND"},
 luke:{ko:"프랭크 루크",en:"Frank Luke",alias:"THE ARIZONA BALLOON BUSTER"},
 brumowski:{ko:"고트빈 브루모프스키",en:"Godwin Brumowski",alias:"THE RED HAWK OF AUSTRIA"},
 gontermann:{ko:"하인리히 곤터만",en:"Heinrich Gontermann",alias:"THE NIGHTMARE OF THE FRONT"}
});
const put185=(el,value)=>{if(el&&el.textContent!==value)el.textContent=value};
const englishUi185=()=>document.documentElement.lang?.toLowerCase().startsWith("en");
const pilotRealName185=id=>PILOT_IDENTITY185[id]?.[englishUi185()?"en":"ko"]||"";
const pilotAlias185=id=>PILOT_IDENTITY185[id]?.alias||"";
function pilotIdFromText185(value=""){
 const text=String(value).trim();
 for(const [id,p] of Object.entries(PILOT_IDENTITY185)){
  if(text===p.ko||text===p.en||p.legacy?.includes(text))return id;
 }
 return null;
}
function replacePilotNames185(value=""){
 let text=String(value);
 for(const [id,p] of Object.entries(PILOT_IDENTITY185)){
  const display=pilotRealName185(id);
  for(const source of [p.ko,p.en,...(p.legacy||[])]){
   if(source&&text.includes(source))text=text.split(source).join(display);
  }
 }
 return text;
}
function syncPilotIdentity185(){
 const selected=document.querySelector("#pilotTabs [data-pilot-id].active");
 const selectedId=selected?.dataset.pilotId;
 if(selectedId&&PILOT_IDENTITY185[selectedId]){
  const title=document.querySelector(".astra-pilot-title");
  const aliasLine=document.querySelector(".astra-pilot-english");
  put185(title,pilotRealName185(selectedId));
  put185(aliasLine,pilotAlias185(selectedId));
  const cutin=$("cutinName");
  put185(cutin,pilotRealName185(selectedId));
 }
 for(const button of document.querySelectorAll("#pilotTabs [data-pilot-id]")){
  const id=button.dataset.pilotId,p=PILOT_IDENTITY185[id];
  if(!p)continue;
  const label=button.querySelector(".pilot-tab-label");
  const caption=button.querySelector(".astra-pilot-caption");
  put185(label,pilotRealName185(id));
  put185(caption,p.alias);
  button.title=p.alias?pilotRealName185(id)+" · "+p.alias:pilotRealName185(id);
 }
 const bossName=$("bossName");
 if(bossName){
  const id=pilotIdFromText185(bossName.textContent);
  if(id){
   put185(bossName,pilotRealName185(id));
   const detail=$("bossArrivalDetail");
   if(detail){detail.hidden=false;put185(detail,pilotAlias185(id));}
  }
 }
 for(const heading of document.querySelectorAll("#build151 h3"))put185(heading,replacePilotNames185(heading.textContent));
 for(const row of document.querySelectorAll("#rankingPanel .ranking-medal-list li"))row.childNodes.forEach(node=>{
  if(node.nodeType===Node.TEXT_NODE){const next=replacePilotNames185(node.textContent);if(node.textContent!==next)node.textContent=next;}
 });
}


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
  if(!root.querySelector(".hc-ace-sight")){
    const sight=document.createElement("span");
    sight.className="hc-ace-sight";
    sight.setAttribute("aria-hidden","true");
    root.append(sight);
  }
}

let syncingModal=false;
function syncModal(){
  const modal=$("modal");
  if(!modal||syncingModal)return;
  syncingModal=true;
  try{
  const pause=modal.classList.contains("build-modal151") && !!$("build151");
  const ranking=!!$("rankingPanel") || $("modalTag")?.textContent?.trim()==="RANKING MODE";
  modal.classList.toggle("hc-pause-modal",pause);
  modal.classList.toggle("hc-ranking-modal",!pause&&ranking);
  if(pause){
    put185($("modalTag"),"PAUSED");
    put185($("modalTitle"),"일시 정지");
    put185($("modalText"),"");
  }else if(ranking){
    put185($("modalTag"),"RANKING");
    put185($("modalTitle"),"출격 기록");
  }
  }finally{syncingModal=false}
}

function install(){
  decorateAce();
  const tabs=$("pilotTabs");
  if(tabs)new MutationObserver(syncPilotIdentity185).observe(tabs,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});
  const identityTitle=document.querySelector(".astra-pilot-title");
  const identityAlias=document.querySelector(".astra-pilot-english");
  for(const node of [identityTitle,identityAlias])if(node)new MutationObserver(syncPilotIdentity185).observe(node,{subtree:true,childList:true,characterData:true});
  const cutin=$("cutinName");
  if(cutin)new MutationObserver(syncPilotIdentity185).observe(cutin,{subtree:true,childList:true,characterData:true});
  new MutationObserver(syncPilotIdentity185).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
  syncModal();
  syncPilotIdentity185();
  const boss=$("bossArrival");
  if(boss)new MutationObserver(()=>{decorateAce();syncPilotIdentity185()}).observe(boss,{subtree:true,childList:true,attributes:true,attributeFilter:["class","src"]});
  const modal=$("modal");
  if(modal)new MutationObserver(()=>{syncModal();syncPilotIdentity185()}).observe(modal,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});
else install();

// Keep the official field record aligned with the live augmentation catalog.
// Game text (name, alias, skill, passive, descriptions) is pulled from the live
// engine — PILOTS/pilotLoadout are the single source so record entries can
// never drift from what the game actually shows.
import{PILOTS,PILOT_PLANES,pilotLoadout}from'./engine.js?v=334';
for(const p of DATA.pilots){
  const loadout=PILOTS[p.key]?pilotLoadout(p.key,PILOT_PLANES[p.key]||'fokker'):null;
  if(!loadout)continue;
  if(loadout.name)p.name=loadout.name;
  if(loadout.alias)p.alias=loadout.alias;
  if(loadout.skill)p.skill=loadout.skill;
  if(loadout.desc)p.desc=loadout.desc;
  if(loadout.passive)p.passive=loadout.passive;
  if(loadout.passiveDesc)p.passiveDesc=loadout.passiveDesc;
}

const CURRENT_SPECIAL_DESCRIPTIONS={
  '르네 퐁크의 망원경':'전방 약 21° 안의 적을 초점 포착하여 초기 0.8초 동안 최대 17° 조준 보정. 보정 궤적과 표적 표시가 나타납니다.',
  "마우저C96 '에이스킬러'":'근거리 적을 자동 조준해 권총탄을 발사합니다. 일반 적 피해는 낮고 에이스에게 큰 피해를 줍니다.',
  '기네메르의 37mm 모퇴르 카농':'3초마다 전방으로 거대한 37mm 관통탄을 발사합니다. 고품질 화약 개량이 적용됩니다.',
  '스카프링 총좌':'기본 기관총이 초당 60°로 천천히 회전합니다. 반대 방향 조준에 3초. 총기 수·탄약 소모는 유지됩니다.'
};

for(const item of DATA.legendary){
  if(CURRENT_SPECIAL_DESCRIPTIONS[item.name])item.desc=CURRENT_SPECIAL_DESCRIPTIONS[item.name];
}

// Replace the retired zero-byte preview and provide stable fallbacks for every ace.
DATA.images.p_nungesser='./portrait-nungesser-field.webp';
const PORTRAIT_FALLBACKS=Object.fromEntries(DATA.pilots.map(p=>[p.key,p.portrait]));
document.addEventListener('error',event=>{
  const image=event.target;
  if(!(image instanceof HTMLImageElement)||image.dataset.portraitFallback==='1')return;
  const pilotButton=image.closest('[data-pilot]');
  const detailAlt=image.alt?.match(/^(.+) 초상화$/)?.[1];
  const pilot=pilotButton
    ? DATA.pilots.find(p=>p.key===pilotButton.dataset.pilot)
    : DATA.pilots.find(p=>p.name===detailAlt);
  if(!pilot||!PORTRAIT_FALLBACKS[pilot.key])return;
  image.dataset.portraitFallback='1';
  image.src=PORTRAIT_FALLBACKS[pilot.key];
},true);

if(state.page==='augments')render();

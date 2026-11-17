// First-sortie coach: a new player's very first solo run gets a handful of one-line prompts in
// the existing toast, each tied to the moment it becomes useful, and a slightly earlier first
// upgrade. Pure logic: the host supplies storage and shows the returned text.
export const FIRST_SORTIE_KEY='headon.firstSortie.v1';
const GAP=7;      // seconds of quiet between prompts
const HOLD=4.2;   // seconds a prompt stays up
const COPY={
 ko:{
  steerStick:'왼쪽 스틱으로 방향을 잡으세요 · 사격은 자동입니다',
  steerTouch:'전장을 터치하고 움직여 조종하세요 · 사격은 자동입니다',
  steerPad:'스틱으로 조종하고 A를 누르는 동안 사격합니다',
  steerMouse:'마우스 커서 쪽으로 비행합니다 · 사격은 자동입니다',
  steerKeys:'WASD 또는 방향키로 조종하세요 · 사격은 자동입니다',
  xp:'격추! 청록색 보급품을 모으면 강화를 얻습니다',
  build:'강화를 조합하면 비밀 병기가 완성됩니다',
  skill:'액티브 버튼으로 에이스의 기술을 쓸 수 있습니다',
  supply:'십자 보급품이 내구도를 회복합니다'
 },
 en:{
  steerStick:'Steer with the left stick · guns fire automatically',
  steerTouch:'Touch and drag on the battlefield to steer · guns fire automatically',
  steerPad:'Steer with the stick and hold A to fire',
  steerMouse:'Steer toward the mouse pointer · guns fire automatically',
  steerKeys:'Steer with WASD or the arrow keys · guns fire automatically',
  xp:'Kill! Collect cyan pickups to earn upgrades',
  build:'Combine upgrades to complete secret weapons',
  skill:'Use the active button for your ace technique',
  supply:'Cross supplies restore durability'
 }
};
export function firstSortieDone(storage){try{return storage?.getItem(FIRST_SORTIE_KEY)==='1'}catch{return true}}
export function createFirstSortieCoach({storage,force=false}={}){
 const pending=force||!firstSortieDone(storage);
 let run=null,shown=new Set(),quietUntil=0,finished=!pending;
 const finish=()=>{if(finished)return;finished=true;if(!force)try{storage?.setItem(FIRST_SORTIE_KEY,'1')}catch{}};
 return {
  get active(){return !finished},
  // The host calls this when another notice replaced a prompt before it could be read.
  requeue(id,g){if(finished||!shown.delete(id))return;quietUntil=(g?.t||0)+3;},
  // Call every frame while a solo run is on screen. Returns {text,seconds} when a prompt should show.
  tick(g,{locale='ko',control='keys',busy=false}={}){
   if(finished||!g||g.mode==='coop2'||g.mode==='campaign'||(g.testMode&&!force))return null;
   if(g!==run){
    if(run){finish();return null;}           // a second run: the first sortie is over
    run=g;shown=new Set();quietUntil=1.5;
    // First upgrade arrives sooner on the very first run (default requirement only).
    if(g.level===1&&g.need===g.levelRequirement?.(g.baseLevelNeed)&&g.need>4)g.need=4;
   }
   if(g.state==='lost'||g.state==='front-complete'||g.t>150||shown.size>=5){finish();return null;}
   if(g.state!=='playing'||busy||g.t<quietUntil)return null;
   const copy=COPY[locale==='en'?'en':'ko'];
   const steer=control==='pointer'?'steerTouch':control==='stick'?'steerStick':control==='gamepad'?'steerPad':control==='mouse'?'steerMouse':'steerKeys';
   const next=!shown.has('steer')?['steer',copy[steer]]
    :g.hp<g.maxHp*.5&&!shown.has('supply')?['supply',copy.supply]
    :(g.kills||0)>=1&&!shown.has('xp')?['xp',copy.xp]
    :(g.level||1)>=2&&!shown.has('build')?['build',copy.build]
    :(g.level||1)>=2&&g.t>=30&&!shown.has('skill')?['skill',copy.skill]
    :null;
   if(!next)return null;
   shown.add(next[0]);quietUntil=g.t+HOLD+GAP;
   return {id:next[0],text:next[1],seconds:HOLD};
  }
 };
}

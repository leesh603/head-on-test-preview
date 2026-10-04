export const GAMEPAD_BUTTONS=Object.freeze({FACE_BOTTOM:0,FACE_RIGHT:1,FACE_LEFT:2,FACE_TOP:3,MENU:9});
export const GAMEPAD_DEADZONE=.18;
export const GAMEPAD_INTENT_THRESHOLD=.35;

const empty=mode=>({moveX:0,moveY:0,fireHeld:false,reloadJustPressed:false,activeJustPressed:false,maneuverJustPressed:false,pauseJustPressed:false,inputMode:mode});
const pressed=button=>!!button&&(button.pressed||Number(button.value)>=.5);

export function radialStick(x=0,y=0,deadzone=GAMEPAD_DEADZONE){
 const magnitude=Math.min(1,Math.hypot(x,y));
 if(magnitude<=deadzone)return{x:0,y:0,magnitude:0};
 const scaled=(magnitude-deadzone)/(1-deadzone);
 return{x:x/magnitude*scaled,y:y/magnitude*scaled,magnitude:scaled};
}

export class GamepadInput{
 constructor(source=globalThis.navigator){this.source=source;this.inputMode='keyboard';this.index=null;this.previous=Array(10).fill(false);this.suppressActions=false}
 pads(){try{return Array.from(this.source?.getGamepads?.()||[])}catch{return[]}}
 current(){const pads=this.pads(),known=this.index==null?null:pads[this.index];return known?.connected&&known.mapping==='standard'?known:pads.find(p=>p?.connected&&p.mapping==='standard')||null}
 seedButtons(pad=this.current()){this.previous=this.previous.map((_,i)=>pressed(pad?.buttons?.[i]))}
 reset(mode='keyboard'){this.inputMode=mode;const pad=this.current();this.index=pad?.index??null;this.seedButtons(pad);this.suppressActions=!!pad&&this.previous.some(Boolean)}
 useKeyboard(){this.reset('keyboard')}
 useTouch(){this.reset('touch')}
 poll(enabled=true){
  if(!enabled){this.reset('keyboard');return empty('keyboard')}
  const pad=this.current();
  if(!pad){this.index=null;this.inputMode='keyboard';this.previous.fill(false);this.suppressActions=false;return empty('keyboard')}
  this.index=pad.index;
  const rawX=Number(pad.axes?.[0])||0,rawY=Number(pad.axes?.[1])||0,rawMagnitude=Math.hypot(rawX,rawY);
  const now=this.previous.map((_,i)=>pressed(pad.buttons?.[i]));
  if(rawMagnitude>=GAMEPAD_INTENT_THRESHOLD||now.some(Boolean))this.inputMode='gamepad';
  const result=empty(this.inputMode),anyButton=now.some(Boolean);
  if(this.inputMode==='gamepad'){
   const stick=radialStick(rawX,rawY);result.moveX=stick.x;result.moveY=stick.y;result.fireHeld=now[GAMEPAD_BUTTONS.FACE_BOTTOM];
   if(this.suppressActions){if(!anyButton)this.suppressActions=false}
   else{result.reloadJustPressed=now[GAMEPAD_BUTTONS.FACE_RIGHT]&&!this.previous[GAMEPAD_BUTTONS.FACE_RIGHT];result.activeJustPressed=now[GAMEPAD_BUTTONS.FACE_LEFT]&&!this.previous[GAMEPAD_BUTTONS.FACE_LEFT];result.maneuverJustPressed=now[GAMEPAD_BUTTONS.FACE_TOP]&&!this.previous[GAMEPAD_BUTTONS.FACE_TOP];result.pauseJustPressed=now[GAMEPAD_BUTTONS.MENU]&&!this.previous[GAMEPAD_BUTTONS.MENU]}
  }
  this.previous=now;return result;
 }
}

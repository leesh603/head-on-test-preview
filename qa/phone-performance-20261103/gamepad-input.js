export const GAMEPAD_BUTTONS=Object.freeze({FACE_BOTTOM:0,FACE_RIGHT:1,FACE_LEFT:2,FACE_TOP:3,MENU:9});
export const GAMEPAD_DEADZONE=.18;
export const GAMEPAD_INTENT_THRESHOLD=.35;

const empty=mode=>({moveX:0,moveY:0,fireHeld:false,reloadJustPressed:false,activeJustPressed:false,maneuverJustPressed:false,pauseJustPressed:false,inputMode:mode});
const pressed=button=>!!button&&(button.pressed||Number(button.value)>=.5);
const usablePad=pad=>!!pad?.connected&&Number(pad.axes?.length)>=2&&Number(pad.buttons?.length)>=4&&(pad.mapping==='standard'||pad.mapping===''||pad.mapping==null);

export function radialStick(x=0,y=0,deadzone=GAMEPAD_DEADZONE){
 const magnitude=Math.min(1,Math.hypot(x,y));
 if(magnitude<=deadzone)return{x:0,y:0,magnitude:0};
 const scaled=(magnitude-deadzone)/(1-deadzone);
 return{x:x/magnitude*scaled,y:y/magnitude*scaled,magnitude:scaled};
}

export const HAPTIC_PATTERNS=Object.freeze({
 shot:{duration:24,weakMagnitude:.09,strongMagnitude:.015,priority:0,interval:95},
 hit:{duration:85,weakMagnitude:.24,strongMagnitude:.3,priority:3,interval:120},
 explosion:{duration:125,weakMagnitude:.3,strongMagnitude:.4,priority:2,interval:240},
 pass:{duration:60,weakMagnitude:.28,strongMagnitude:.07,priority:1,interval:500}
});

export class GamepadInput{
 constructor(source=globalThis.navigator){this.source=source;this.inputMode='keyboard';this.index=null;this.fallback=null;this.previous=Array(10).fill(false);this.suppressActions=false}
 setFeedbackEnabled(enabled){if(!enabled&&this.feedbackEnabled!==false){try{Promise.resolve(this.current()?.vibrationActuator?.reset?.()).catch(()=>{})}catch{}try{this.source?.vibrate?.(0)}catch{}this.feedbackUntil=0;this.feedbackPriority=-1}this.feedbackEnabled=!!enabled}
 pulse(kind,now=globalThis.performance?.now?.()??Date.now()){
  const pattern=HAPTIC_PATTERNS[kind];if(!pattern||this.feedbackEnabled===false)return false;
  this.feedbackTimes??={};if(now-(this.feedbackTimes[kind]??-Infinity)<pattern.interval||now<(this.feedbackUntil||0)&&pattern.priority<(this.feedbackPriority??-1))return false;
  const pad=this.inputMode==='gamepad'?this.current():null,actuator=pad?.vibrationActuator||pad?.hapticActuators?.[0];
  try{
   if(actuator?.playEffect)Promise.resolve(actuator.playEffect('dual-rumble',{startDelay:0,duration:pattern.duration,weakMagnitude:pattern.weakMagnitude,strongMagnitude:pattern.strongMagnitude})).catch(()=>{});
   else if(actuator?.pulse)Promise.resolve(actuator.pulse(Math.max(pattern.weakMagnitude,pattern.strongMagnitude),pattern.duration)).catch(()=>{});
   else if(this.inputMode==='touch'&&kind!=='shot'&&this.source?.vibrate)this.source.vibrate(kind==='hit'?22:kind==='explosion'?30:12);
   else return false;
  }catch{return false}
  this.feedbackTimes[kind]=now;this.feedbackUntil=now+pattern.duration;this.feedbackPriority=pattern.priority;return true;
 }
 pads(){try{return Array.from(this.source?.getGamepads?.()||[])}catch{return[]}}
 current(){
  const pads=this.pads(),known=this.index==null?null:pads[this.index];
  if(usablePad(known))return known;
  const standard=pads.find(p=>usablePad(p)&&p.mapping==='standard');if(standard)return standard;
  const compatible=pads.find(usablePad);if(compatible)return compatible;
  return usablePad(this.fallback)?this.fallback:null;
 }
 seedButtons(pad=this.current()){this.previous=this.previous.map((_,i)=>pressed(pad?.buttons?.[i]))}
 connect(pad){
  if(!usablePad(pad))return false;
  this.fallback=pad;this.index=Number.isInteger(pad.index)?pad.index:this.index;this.seedButtons(pad);this.suppressActions=this.previous.some(Boolean);return true;
 }
 disconnect(pad){
  if(pad&&this.index!=null&&Number.isInteger(pad.index)&&pad.index!==this.index&&pad!==this.fallback)return false;
  this.fallback=null;this.index=null;this.inputMode='keyboard';this.previous.fill(false);this.suppressActions=false;return true;
 }
 reset(mode='keyboard'){this.inputMode=mode;const pad=this.current();this.index=pad?.index??null;if(pad)this.fallback=pad;this.seedButtons(pad);this.suppressActions=!!pad&&this.previous.some(Boolean)}
 useKeyboard(){this.reset('keyboard')}
 useTouch(){this.reset('touch')}
 poll(enabled=true){
  if(!enabled){this.reset('keyboard');return empty('keyboard')}
  const pad=this.current();
  if(!pad){this.index=null;this.fallback=null;this.inputMode='keyboard';this.previous.fill(false);this.suppressActions=false;return empty('keyboard')}
  this.index=pad.index;this.fallback=pad;
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

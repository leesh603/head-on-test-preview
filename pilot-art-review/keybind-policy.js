export const KEYBIND_DEFAULTS=Object.freeze({evade:'Space',skill:'KeyE',reload:'KeyR'});
export const BIND_ACTIONS=Object.keys(KEYBIND_DEFAULTS);
const movement=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
export function keybindConflict(code,bindings={},action){
 if(typeof code!=='string'||!code||code==='Unidentified')return 'invalid';
 if(!/^(Key[A-Z]|Digit[0-9]|Numpad(?:[0-9]|Add|Subtract|Multiply|Divide|Decimal|Enter)|Space|Backspace|Delete|Insert|Home|End|PageUp|PageDown|CapsLock|ShiftLeft|ShiftRight|Backquote|Minus|Equal|BracketLeft|BracketRight|Backslash|Semicolon|Quote|Comma|Period|Slash|Arrow(?:Up|Down|Left|Right)|Tab|Enter|Escape|(?:Meta|Control|Alt)(?:Left|Right))$/.test(code))return 'invalid';
 if(movement.has(code))return 'movement';
 if(code==='KeyP'||code==='Escape')return 'pause';
 if(code==='KeyQ')return 'altitude';
 if(/^Digit[1-4]$/.test(code))return 'choice';
 if(code==='Tab'||code==='Enter')return 'menu';
 if(code==='ShiftRight'||code==='Backslash')return 'coop';
 if(/^(Meta|Alt|Control)/.test(code))return 'system';
 if(BIND_ACTIONS.some(a=>a!==action&&bindings[a]===code))return 'action';
 return '';
}
export function restoreKeybinds(saved){
 const result={},invalid=[];
 for(const action of BIND_ACTIONS){const code=saved?.[action]??KEYBIND_DEFAULTS[action];if(keybindConflict(code,result,action))invalid.push(action);else result[action]=code}
 for(const action of invalid)result[action]=[KEYBIND_DEFAULTS[action],...Object.values(KEYBIND_DEFAULTS),'KeyZ','KeyX','KeyC'].find(code=>!keybindConflict(code,result,action));
 return result;
}

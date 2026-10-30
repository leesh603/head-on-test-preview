// Dedicated post-maneuver air texture; solo/co-op entry points preserved.
import {drawImmelmannPassive} from './pilot-passive-art.js';
export function drawImmelmannWake(){}
export function drawImmelmannEnergy(c,p,tex,front=false){
 if(!front)drawImmelmannPassive(c,p);
}

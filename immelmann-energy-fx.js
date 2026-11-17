// Immelmann passive and counter-salvo visuals.
import {drawImmelmannPassive} from './pilot-passive-art.js';
const clamp=n=>Math.max(0,Math.min(1,n));
const visible=p=>p?.pilot==='immelmann'&&p.hp>0&&p.status!=='downed'&&p.state==='playing';
export function drawImmelmannEnergy(c,p,tex,front=false){
 if(!front)drawImmelmannPassive(c,p);
 if(!front||!visible(p)||!p.immelmannTurn?.fired||!(p.muzzleFlash>0)||p.reloadTime>0)return;
 const age=Math.max(0,.12-p.muzzleFlash),flash=clamp(1-age/.065),smoke=clamp(1-age/.12);
 // The counter salvo is emitted at x=24 by rebalance103; preserve that origin.
 if(flash>0)tex(c,'muzzle',29,0,31,12,0,.95*flash,'#ebd5a9');
 tex(c,'gunSmoke',27-age*70,0,24+age*115,10+age*48,0,.46*smoke,'#bfc5bc');
 for(let i=0;i<2;i++)tex(c,'bulletBrass',15-age*50-i*4,9+age*75+i*4,5.5,2.5,.6+age*11+i,.8*smoke,'#c69a61');
}

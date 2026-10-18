// Co-op teammate gauge: one 26 px HP ring sitting in the gap between the HP/ammo module and the
// time/kills module, vertically centred on them. Nothing else of the partner is drawn on a player's
// own screen. Local co-op shows P2 to the shared screen; online shows the other seat.
const SIZE=26,R=10.5,C=2*Math.PI*R;
let el=null,arc=null,label=null,last='',at=0;
function build(){
 el=document.createElement('div');el.id='allyRing';el.setAttribute('role','img');
 el.innerHTML=`<svg viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}" aria-hidden="true"><circle cx="13" cy="13" r="${R}" class="ally-ring-track"/><circle cx="13" cy="13" r="${R}" class="ally-ring-arc" transform="rotate(-90 13 13)" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg><b></b>`;
 arc=el.querySelector('.ally-ring-arc');label=el.querySelector('b');document.body.append(el);
}
function partnerOf(game){
 if(!game?.players?.length||game.players.length<2)return null;
 if(game.online)return game.players.find(p=>p.id!==game.localPlayerId)||null;
 return game.player?.('p2')||game.players[1];
}
// Centre of the empty space between the two top modules (falls back to the top centre).
function place(){
 const left=document.querySelector('#flightTop151 .flight-survival'),right=document.querySelector('#flightTop151 .flight-status');
 const a=left?.getBoundingClientRect(),b=right?.getBoundingClientRect();
 let x=innerWidth/2,y=12+15;
 // Narrow (phone) gap: centred in it. Wide (desktop) gap: tucked beside the HP module, clear of the
 // centred notices.
 if(a?.width&&b?.width){const gap=b.left-a.right;x=gap>120?a.right+10+SIZE/2:(a.right+b.left)/2;y=a.top+a.height/2}
 el.style.left=Math.round(x-SIZE/2)+'px';el.style.top=Math.round(y-SIZE/2)+'px';
}
export function updateAllyRing(game){
 const now=performance.now();if(now-at<120)return;at=now;
 if(!el)build();
 const p=partnerOf(game);
 if(!p){if(last!=='off'){el.hidden=true;last='off'}return}
 const ratio=Math.max(0,Math.min(1,(p.hp||0)/(p.maxHp||1))),down=p.status==='downed'||p.status==='dead'||ratio<=0;
 const num=(p.id||'p2').replace(/\D/g,'')||'2';
 const sig=ratio.toFixed(3)+down+num+innerWidth+innerHeight;
 el.hidden=false;place();
 if(sig===last)return;last=sig;
 arc.setAttribute('stroke-dashoffset',String(C*(1-ratio)));
 el.dataset.state=down?'down':ratio<.3?'low':ratio<.6?'mid':'ok';
 label.textContent=num;
 el.setAttribute('aria-label',`P${num} ${Math.round(ratio*100)}%`);
}
export function hideAllyRing(){if(el){el.hidden=true;last='off'}}

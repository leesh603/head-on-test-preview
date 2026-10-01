import {Game} from './engine.js';
const mk=()=>{let s=7;return()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648}};
const out=[];
for(const pilot of ['baron','fonck','voss','mckeever','boelcke','collishaw','immelmann','jacobs']){
 const plane='fokker';
 const g=new Game(plane,pilot,mk());
 for(let i=0;i<700;i++){
   g.update(0.016,{angle:.3+i*.001,moveX:.4,moveY:-.3,fireHeld:true,inputMode:'keyboard'});
   if(i%150===50)g.skill();
   if(i%200===100)g.reload();
 }
 out.push({p:pilot,t:+g.t.toFixed(4),hp:g.hp,cd:+g.cooldown.toFixed(4),st:+g.skillTime.toFixed(4),kills:g.kills,ev:g.events.map(e=>e.type).join(',')});
}
console.log(JSON.stringify(out));

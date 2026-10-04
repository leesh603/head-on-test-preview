// Heinecke Rettungsfallschirm: one independent survival insurance per sortie.
export const HEINECKE=Object.freeze({escape:3,returnHp:.4,invulnerability:2,cooldown:180,maxUses:2,reentryDistance:270});
export function heineckeRemaining(p){
 if((p.heineckeUses||0)>=HEINECKE.maxUses)return HEINECKE.cooldown;
 return Math.max(0,HEINECKE.cooldown-((p.t||0)-(p.heineckeLastAt??-Infinity)));
}
export function triggerHeinecke(p,damage){
 if(!p.upgrades?.heineckeRettungsfallschirm||!(p.hp>0)||damage<p.hp||p.heineckeEscape>0||heineckeRemaining(p)>0||(p.heineckeUses||0)>=HEINECKE.maxUses)return false;
 p.heineckeUses=(p.heineckeUses||0)+1;
 p.heineckeLastAt=p.t||0;
 p.heineckeAnchor={x:p.x,y:p.y,a:p.a};
 p.heineckeEscape=HEINECKE.escape;
 p.hp=1;
 p.invuln=Math.max(p.invuln||0,HEINECKE.escape);
 p.hitFlash=0;
 p.muzzleFlash=0;
 p.event('heinecke','하이네케 구명낙하산 · 기체 탈출');
 p.burst(p.x,p.y,'#e7c99a',18);
 p.smoke(p.x,p.y,true);
 return true;
}
export function tickHeinecke(p,dt){
 if(!(p.heineckeEscape>0))return false;
 p.heineckeEscape=Math.max(0,p.heineckeEscape-dt);
 if(p.heineckeEscape===0){
  const {x,y,a}=p.heineckeAnchor;
  p.x=x-Math.cos(a)*HEINECKE.reentryDistance;
  p.y=y-Math.sin(a)*HEINECKE.reentryDistance;
  p.a=a;
  p.hp=p.maxHp*HEINECKE.returnHp;
  p.invuln=HEINECKE.invulnerability;
  p.fire=.12;
  p.gasExposure=0;
  p.event('heineckeReturn','예비기 재출격');
  p.burst(p.x,p.y,'#f1dfb7',10);
 }
 return true;
}
let parachuteImage;
export function drawHeineckeParachute(c,p,x,y,size=55){
 if(!(p.heineckeEscape>0)||typeof Image==='undefined')return;
 parachuteImage??=new Image();
 if(!parachuteImage.src)parachuteImage.src='./augmentation-icons/heinecke_rettungsfallschirm.webp?v=526';
 if(!parachuteImage.complete||!parachuteImage.naturalWidth)return;
 const elapsed=HEINECKE.escape-p.heineckeEscape;
 c.save();
 c.globalAlpha=Math.min(1,elapsed/.22)*Math.min(1,p.heineckeEscape/.3);
 c.drawImage(parachuteImage,x-size/2+Math.sin(elapsed*2)*6,y-size/2+elapsed*13,size,size);
 c.restore();
}

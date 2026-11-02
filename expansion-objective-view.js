/** Presentation only: labels the real native patrol; its existing renderer owns HP and art. */
export function drawExpansionObjectives(ctx,g,W,H,{locale='ko',worldToScreen,visible}={}){
 if(!ctx||!g||g.state!=='playing')return 0;
 const project=worldToScreen||((x,y)=>[x-g.x+W/2,y-g.y+H/2]);let count=0;
 for(const p of g.patrols||[]){
  if(!p.spa65Courier||!(p.hp>0)||!(p.life>0)||p.crashing||!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;
  if(visible&&!visible(p.x,p.y,60))continue;
  const [x,y]=project(p.x,p.y);if(!Number.isFinite(x)||!Number.isFinite(y))continue;
  if(!worldToScreen&&(x<-60||x>W+60||y<-60||y>H+60))continue;
  ctx.save();ctx.font='600 11px "Noto Sans CJK KR","Noto Sans KR",sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.lineJoin='round';ctx.lineWidth=3;ctx.strokeStyle='#14231ff0';ctx.fillStyle='#a9eced';
  const text=locale==='en'?'Allied courier':'아군 전령기';ctx.strokeText(text,x,y-34);ctx.fillText(text,x,y-34);ctx.restore();count++;
 }
 return count;
}

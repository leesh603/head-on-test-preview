/** Compact unit arrivals: presentation only, never pauses or advances the simulation. */
export const SQUADRON_CUTIN_COPY=Object.freeze({
 cigognes:{ko:'시고뉴 기관포 편대',en:'Cigognes cannon patrol',detailKo:'조준 고정 후 회피 · 재장전 중 반격',detailEn:'Dodge the locked shot · counter during reload'},
 'hat-ring':{ko:'제94항공대 · Hat in the Ring',en:'94th Aero · Hat in the Ring',detailKo:'평행 사격 · 사격을 쉬는 통로로 회피',detailEn:'Parallel fire · find the quiet lane'},
 jasta18:{ko:'야스타 18 · 라벤의 까마귀',en:'Jasta 18 · Raven',detailKo:'엇갈린 교차 점사 · 한 기씩 회피',detailEn:'Staggered crossing bursts · dodge each pass'},
 lafayette:{ko:'라파예트 에스카드리유',en:'Lafayette Escadrille',detailKo:'피격기 이탈 · 엄호 준비를 맞혀 중단',detailEn:'Damaged wing retreats · hit the preparing cover'},
 jasta5:{ko:'야스타 5 · 녹색 꼬리',en:'Jasta 5',detailKo:'조준 준비 중 크게 선회 · 이탈 때 반격',detailEn:'Turn hard during aim preparation · counter on withdrawal'},
 spa65:{ko:'SPA 65 · 키메라',en:'SPA 65',detailKo:'아군 전령기 구출 · 추격기 저지',detailEn:'Rescue the allied courier · stop its pursuers'},
 sqn56:{ko:'제56비행대 · S.E.5a',en:'No. 56 Squadron · S.E.5a',detailKo:'이탈기 추격 주의 · 측면 엄호를 확인',detailEn:'Mind the lure · watch the covering wing'},
 jasta2:{ko:'야스타 2 · 뵐케',en:'Jasta 2 · Boelcke',detailKo:'편대장을 격추해 공동 조준 해체',detailEn:'Break coordinated aim · take down the leader'},
 le_prieur_squadron:{ko:'르 프리외르 로켓 편대',en:'Le Prieur rocket squadron',detailKo:'로켓 발사 방향 확인 · 일제사격 뒤 반격',detailEn:'Read the rocket heading · counter after the salvo'},
 schlachtstaffel:{ko:'슐라흐트슈타펠 공격 편대',en:'Schlachtstaffel',detailKo:'후방 사수 주의 · 옆으로 돌아 공격',detailEn:'Beware rear gunners · attack from the flank'},
 junkers_squadron:{ko:'융커스 J.I 기갑 편대',en:'Junkers J.I armored squadron',detailKo:'장갑기와 후방 사수 · 측면을 노려 공격',detailEn:'Armored aircraft and rear gunners · work the flanks'},
 salamander_squadron:{ko:'샐러맨더 시험운용 편대',en:'Salamander trial flight',detailKo:'쌍열 기관총 전방을 피해 측면으로',detailEn:'Avoid the twin forward guns · take the flank'}
});
export function createSquadronArtCache(makeImage=()=>typeof Image==='undefined'?null:new Image(),now=Date.now){
 const entries=new Map();
 const ready=id=>!!SQUADRON_CUTIN_COPY[id]&&entries.get(id)?.ready===true;
 const load=id=>{
  if(!SQUADRON_CUTIN_COPY[id])return Promise.resolve(false);
  const prior=entries.get(id);if(prior?.ready)return Promise.resolve(true);if(prior?.pending)return prior.pending;if((prior?.retryAt||0)>now())return Promise.resolve(false);
  const im=makeImage();if(!im)return Promise.resolve(false);
  const entry={image:im,ready:false,retryAt:0,pending:null};entries.set(id,entry);
  entry.pending=new Promise(resolve=>{
   let finished=false;const done=ok=>{if(finished)return;finished=true;entry.ready=ok;entry.retryAt=ok?0:now()+30000;resolve(ok);};
   im.decoding='async';im.onload=()=>{if(!(im.naturalWidth||im.width)){done(false);return;}if(typeof im.decode==='function')Promise.resolve().then(()=>im.decode()).then(()=>done(true),()=>done(false));else done(true);};im.onerror=()=>done(false);
   im.src=new URL('./squadron-emblems/'+id+'.webp',import.meta.url).href;
  });const pending=entry.pending;pending.then(()=>{if(entry.pending===pending)entry.pending=null;});return pending;
 };
 const bounds=id=>{const e=entries.get(id);if(!e?.ready)return null;if(e.bounds)return e.bounds;const im=e.image,w=im.naturalWidth||im.width,h=im.naturalHeight||im.height;e.bounds={x:0,y:0,w,h};try{const cv=globalThis.document?.createElement?.('canvas');if(!cv)return e.bounds;cv.width=w;cv.height=h;const c=cv.getContext('2d',{willReadFrequently:true});c.drawImage(im,0,0);const data=c.getImageData(0,0,w,h).data;let x0=w,y0=h,x1=-1,y1=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>12){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}if(x1>=x0)e.bounds={x:Math.max(0,x0-2),y:Math.max(0,y0-2),w:Math.min(w,x1+3)-Math.max(0,x0-2),h:Math.min(h,y1+3)-Math.max(0,y0-2)};}catch{}return e.bounds;};
 return {ready,load,bounds,image:id=>ready(id)?entries.get(id).image:null};
}
const art=createSquadronArtCache();
export const squadronCutinReady=id=>art.ready(id);
export const squadronCutinSource=id=>SQUADRON_CUTIN_COPY[id]?new URL('./squadron-emblems/'+id+'.webp',import.meta.url).href:'';
export const warmSquadronCutin=id=>art.load(id);
const runs=new WeakMap();
export function resetSquadronArrival(g){if(g&&typeof g==='object')runs.delete(g);}
const priority=g=>['entry','battle','victory'].includes(g.finalArena?.phase)||g.stageBoss?.stages?.phase==='boss'||['warning','entering','active'].includes(g.intrusionBoss?.phase)||(g.bossPresentationAfter||0)>(g.t||0);
/** Canonical timing is remembered per token, so duplicate events/snapshots cannot restart a card. */
export function squadronArrivalModel(g,W,H,{suppressed=false,locale='ko',coarse=false,safeBottom=22,safeRight=8}={}){
 if(!g||typeof g!=='object')return null;const a=g.squadronArrival,t=g.t;
 if(!a||!SQUADRON_CUTIN_COPY[a.unitId]||!['string','number'].includes(typeof a.token)||String(a.token).length>160||!Number.isFinite(t)||!Number.isFinite(a.startedAt)||!Number.isFinite(a.until)||a.until<=a.startedAt||a.until-a.startedAt>3)return null;
 let run=runs.get(g);if(!run){run={seen:new Map()};runs.set(g,run);}const token=String(a.token);
 if(!run.seen.has(token)){run.seen.set(token,{unitId:a.unitId,token,startedAt:a.startedAt,until:a.until});while(run.seen.size>32)run.seen.delete(run.seen.keys().next().value);}
 const card=run.seen.get(token);if(t<card.startedAt||t>=card.until||g.state!=='playing'||suppressed||priority(g)||!(W>=240&&H>=420))return null;
 const mobile=W<=720||coarse,width=Math.min(mobile?230:300,W-24),height=mobile?46:64,bottom=Math.max(22,safeBottom)+(mobile?200:92),right=Math.max(8,safeRight),x=W-width-right,y=Math.max(8,H-bottom-height),age=t-card.startedAt,left=card.until-t;
 const copy=SQUADRON_CUTIN_COPY[card.unitId],en=locale==='en';return {...card,x,y,width,height,mobile,bottom,right,alpha:Math.min(1,age/.14,left/.22),slide:Math.max(0,1-age/.32)*32,name:en?copy.en:copy.ko,detail:en?copy.detailEn:copy.detailKo};
}

/** One compact row: measured name follows the emblem, both share a vertical centre. */
export function squadronInlineLayout(ctx,model,crop){
 const {x,y,width,height,mobile}=model,edge=x+width,gap=mobile?8:10;
 // Keep the approved .34 emblem cap from the previous taller cut-in, not the new row height.
 const artW=mobile?136:184,artH=mobile?98:148,ratio=.34*Math.min(artW/crop.w,artH/crop.h),iw=crop.w*ratio,ih=crop.h*ratio;
 const available=Math.max(1,width-iw-gap),family='"Noto Sans CJK KR","Noto Sans KR",sans-serif';let fontSize=mobile?16:22;
 ctx.font='900 '+fontSize+'px '+family;let nameWidth=ctx.measureText(model.name).width;
 if(nameWidth>available){fontSize*=available/nameWidth;ctx.font='900 '+fontSize+'px '+family;nameWidth=ctx.measureText(model.name).width;}
 const centreY=y+height/2,ix=edge-nameWidth-gap-iw;
 return {ix,iy:centreY-ih/2,iw,ih,textX:ix+iw+gap,textY:centreY,nameWidth,fontSize,font:ctx.font,available};
}
export function drawSquadronArrival(ctx,g,W,H,options){
 const model=squadronArrivalModel(g,W,H,options);if(!model)return false;if(!art.ready(model.unitId)){void art.load(model.unitId);return false;}
 const im=art.image(model.unitId),crop=art.bounds(model.unitId);
 ctx.save();ctx.globalAlpha*=model.alpha;ctx.translate(model.slide,0);
 const row=squadronInlineLayout(ctx,model,crop),{ix,iy,iw,ih}=row;
 // Free-standing cutout: no panel, header or secondary stacked text.
 // Filtering belongs only to the emblem, never the pixel-art world or text.
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='medium';
 ctx.shadowColor='#f3e7c8b0';ctx.shadowBlur=2;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;ctx.drawImage(im,crop.x,crop.y,crop.w,crop.h,ix,iy,iw,ih);
 ctx.shadowColor='#000b';ctx.shadowBlur=8;ctx.shadowOffsetY=4;ctx.drawImage(im,crop.x,crop.y,crop.w,crop.h,ix,iy,iw,ih);ctx.restore();
 ctx.shadowColor='#000b';ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
 ctx.textAlign='left';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=3;ctx.strokeStyle='#000e';ctx.fillStyle='#f6ecd6';ctx.font=row.font;
 ctx.strokeText(model.name,row.textX,row.textY);ctx.fillText(model.name,row.textX,row.textY);
 ctx.restore();return true;
}

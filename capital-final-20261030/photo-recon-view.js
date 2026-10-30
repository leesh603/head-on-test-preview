/** Approved photographic-reconnaissance artwork; no recolor, rim or crew compositing. */
export const PHOTO_RECON_ART=Object.freeze({
 'rumpler-civ-photo':Object.freeze({path:'https://head-on-aces.justzeon.chatgpt.site/asset-bank/photo-recon/rumpler-civ-photo.webp',width:1536,height:1024,drawWidth:269,name:'Rumpler C.IV',faction:'central',crewBaked:true}),
 're8-photo':Object.freeze({path:'https://head-on-aces.justzeon.chatgpt.site/asset-bank/photo-recon/re8-photo.webp',width:1536,height:1024,drawWidth:269,name:'R.E.8',faction:'entente',crewBaked:true})
});
/** Fit without stretching into the existing 288×320 aircraft cache coordinate system. */
export function paintPhotoReconSprite(context,image,key){
 const art=PHOTO_RECON_ART[key];if(!art)return false;
 const w=art.drawWidth,h=w*art.height/art.width;
 context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
 context.drawImage(image,0,0,art.width,art.height,(288-w)/2,152-h/2,w,h);
 return true;
}
export function photoReconHudModel(game,locale='ko'){
 const d=game?.photoReconDirector;
 if(!d||['lost','won','dead'].includes(game.state)||game.stageBoss?.stages?.phase==='boss')return null;
 const en=locale==='en',art=PHOTO_RECON_ART[d.profileId];if(!art)return null;
 const seconds=value=>Math.max(0,Math.ceil(Number.isFinite(value)?value:0));
 if(d.phase==='active')return {phase:d.phase,title:art.name+(en?' · PHOTO RECON':' · 사진 정찰기'),label:(en?'Intercept within ':'격추 제한 ')+seconds(d.remaining)+(en?'s':'초'),hint:en?'Intercept before the enemy calls reinforcements':'시간 안에 격추하여 증원 요청을 차단하세요',fraction:Math.max(0,Math.min(1,d.remaining/(d.duration||18))),remaining:seconds(d.remaining)};
 if(d.phase==='pending')return {phase:d.phase,title:en?'RECON REPORT SENT':'정찰 보고 완료',label:(en?'Enemy reinforcements in ':'적 증원 도착까지 ')+seconds(d.reinforcementIn)+(en?'s':'초'),hint:en?'Fighters, bombers or an airship are approaching':'적 편대·폭격기·비행선 혼합 증원 접근',fraction:Math.max(0,Math.min(1,d.reinforcementIn/(d.reinforcementDelay||12))),remaining:seconds(d.reinforcementIn)};
 if(d.phase==='dispatching')return {phase:d.phase,title:en?'ENEMY REINFORCEMENTS':'적 혼합 증원 진입',label:en?'Watch the approach':'진입 방향에 주의하세요',hint:en?'Reconnaissance has revealed your position':'정찰 보고로 아군 위치가 노출되었습니다',fraction:0,remaining:0};
 if(d.phase==='resolved'&&d.noticeRemaining>0&&d.outcome==='intercepted')return {phase:d.phase,title:en?'RECON AIRCRAFT DOWN':'사진 정찰기 격추',label:en?'Reinforcements prevented':'증원 요청 차단',hint:en?'Normal aircraft kill reward earned':'일반 기체 격추 보상 획득',fraction:1,remaining:0};
 return null;
}
/** Reuse the existing fixed boss/objective HUD: no new button, panel or mobile overlap. */
export function updatePhotoReconHud(game,locale='ko',doc=globalThis.document){
 const model=photoReconHudModel(game,locale);if(!model||!doc)return false;
 const slot=doc.getElementById('stageBossHud'),title=doc.getElementById('stageBossTitle'),parts=doc.getElementById('stageBossParts'),bar=doc.getElementById('stageBossHp');
 if(!slot||!title||!parts||!bar)return false;
 slot.classList.remove('hidden','gate-armored');slot.querySelectorAll('.gate-tick').forEach(n=>n.remove());
 title.textContent=model.title;parts.textContent=model.label;
 let hint=doc.getElementById('stageBossTactic');if(!hint){hint=doc.createElement('small');hint.id='stageBossTactic';slot.append(hint)}hint.textContent=model.hint;
 bar.style.width=(model.fraction*100)+'%';slot.setAttribute('aria-valuenow',String(Math.round(model.fraction*100)));slot.setAttribute('aria-valuemax','100');slot.setAttribute('aria-label',model.title+' · '+model.label);
 doc.body.classList.toggle('stageboss-playing',!!game.stageBoss);
 const coop=game.mode==='coop2';doc.getElementById('coopXpHud')?.classList.toggle('hidden',!coop);
 if(coop)for(const p of game.players||[]){const label=doc.getElementById(p.id+'XpLabel'),xp=doc.getElementById(p.id+'XpBar');if(label)label.textContent=p.id.toUpperCase()+' · LV. '+p.level;if(xp)xp.style.width=Math.min(100,p.xp/p.need*100)+'%';}
 return true;
}

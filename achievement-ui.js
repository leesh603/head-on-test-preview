import {AchievementBook,MEDALS,MEDAL_SAVE_KEY,setAchievementBook,achievementRun,syncPilotKills,secretMedalDisclosure} from './achievements.js?v=pandemonium394r2';
import {getLocale,subscribe} from './i18n.js?v=pandemonium394r2&afc=1&art=pilot-recovery2';

export function installAchievementUI({getGame,document:doc=globalThis.document}={}){
 if(!doc?.getElementById('hangar'))return null;
 let storage=null;try{storage=globalThis.localStorage}catch{}
 const book=new AchievementBook(storage);setAchievementBook(book);
 const en=()=>getLocale()==='en',text=(ko,eng)=>en()?eng:ko;
 const node=(tag,cls,content)=>{const e=doc.createElement(tag);if(cls)e.className=cls;if(content!==undefined)e.textContent=content;return e};
 const icon=(d,tier=0)=>{const e=node('span','service-medal-art');if(d.id==='pandemonium'&&!tier){e.textContent='?';e.style.backgroundImage='none';e.setAttribute('aria-hidden','true');return e;}e.style.backgroundPosition=`${d.icon%3*50}% ${Math.floor(d.icon/3)*100}%`;e.setAttribute('aria-hidden','true');if(!tier)e.classList.add('is-locked');return e};
 const link=node('link');link.rel='stylesheet';link.href='./achievements.css?v=pandemonium394r2';doc.head.append(link);
 const button=node('button','service-record-entry');button.type='button';button.id='serviceRecordEntry';button.dataset.action='medals';button.setAttribute('aria-haspopup','dialog');
 const entryFull=node('span','operation-label-full'),entryShort=node('span','operation-label-short');button.append(entryFull,entryShort);
 const strip=node('div','service-featured');strip.id='serviceFeatured';
 const mount=()=>{const ranking=doc.querySelector('#mainOperations [data-action=ranking]');if(!ranking)return false;if(ranking.querySelector('.astra-icon')){const mark=node('span','astra-icon service-nav-medal');mark.setAttribute('aria-hidden','true');button.prepend(mark)}ranking.after(button);return true};
 let mountObserver=null;if(!mount()){mountObserver=new MutationObserver(()=>{if(mount())mountObserver.disconnect()});mountObserver.observe(doc.body,{childList:true,subtree:true})}
 const dialog=node('dialog','service-record');dialog.id='serviceRecord';dialog.setAttribute('aria-labelledby','serviceRecordTitle');
 const head=node('div','service-record-head'),heading=node('div'),kicker=node('small',null,'SERVICE RECORD'),title=node('h2',null);title.id='serviceRecordTitle';
 heading.append(kicker,title);const close=node('button','service-close','×');close.type='button';head.append(heading,close);
 const summary=node('p','service-summary'),note=node('p','service-note'),filters=node('div','service-filters'),grid=node('div','service-grid');
 const featuredNote=node('p','service-note');featuredNote.id='serviceFeaturedStatus';featuredNote.setAttribute('role','status');
 dialog.append(head,summary,strip,note,filters,featuredNote,grid);doc.body.append(dialog);
 const toast=node('div','service-medal-toast');toast.id='serviceMedalToast';toast.hidden=true;toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');doc.body.append(toast);
 let filter='all',timer=0,queue=[],focusBefore=null,shownRun=null,resultSignature='';
 const groups=[['all','전체','All'],['earned','획득','Earned'],['aircraft','기체 해금','Aircraft'],['entry','출격','Sortie'],['combat','전투','Combat'],['mission','임무','Mission'],['boss','보스','Boss'],['special','특별','Special'],['coop','협동','Co-op']];
 const label=d=>en()?d.en:d.name;
 const tierName=(d,tier)=>tier?(d.goals.length>1?[text('동장','Bronze'),text('은장','Silver'),text('금장','Gold')][tier-1]:text('획득','Earned')):text('미획득','Locked');
 function renderStrip(target=strip){
  target.replaceChildren();for(const id of book.data.featured){const d=MEDALS.find(x=>x.id===id),entry=node('span','service-featured-item');entry.title=label(d);entry.append(icon(d,book.progress(d).tier),node('span',null,label(d)));target.append(entry)}
  target.hidden=!book.data.featured.length;
 }
 function renderEntry(){
  const earned=Object.keys(book.data.awards).length,label=text('전공 훈장','Service Medals');entryFull.textContent=label;entryShort.textContent=text('훈장','Medals');button.title=label;button.setAttribute('aria-label',label+` ${earned}/${MEDALS.length}`);
 }
 function render(){
  const earned=Object.keys(book.data.awards).length;
  renderEntry();title.textContent=text('전공 훈장','Service Medals');close.setAttribute('aria-label',text('닫기','Close'));
  summary.textContent=text(`획득 ${earned} / ${MEDALS.length} · 대표 뱃지 ${book.data.featured.length} / 3`,`Earned ${earned} / ${MEDALS.length} · Featured ${book.data.featured.length} / 3`);
  note.textContent=text('기체 해금은 파일럿별 일반·정예 누적 50기 격추입니다. 협동에서는 각자의 격추만 기록합니다. 기존 전투 훈장은 라이카 보너스를 포함한 랭킹 정예 기록·팀 전과를 따릅니다. 도입 이후 기록을 이 브라우저에 저장합니다.','Aircraft unlock after 50 ordinary or priority kills with that pilot. Co-op unlock progress counts each pilot’s own kills. Combat medals still use ranked priority kills and team totals. Records are saved in this browser from this update onward.')+(book.saved?'':text(' 현재 영구 저장을 사용할 수 없습니다.',' Persistent storage is currently unavailable.'));
  featuredNote.textContent=text('획득한 훈장 중 대표 뱃지를 최대 3개 선택하세요.','Choose up to 3 earned medals to feature.');
  filters.replaceChildren();for(const [id,ko,eng]of groups){const b=node('button',filter===id?'active':'',text(ko,eng));b.type='button';b.dataset.filter=id;b.setAttribute('aria-pressed',String(filter===id));filters.append(b)}
  grid.replaceChildren();for(const d of MEDALS){const p=book.progress(d);if(filter==='earned'&&!p.tier||!['all','earned'].includes(filter)&&d.group!==filter)continue;
   const card=node('article','service-medal-card'+(p.tier?' is-earned':''));card.dataset.medal=d.id;card.append(icon(d,p.tier));const copy=node('div','service-medal-copy');
   const hidden=d.hidden&&!p.tier,disclosure=secretMedalDisclosure(d,book);copy.append(node('h3',null,disclosure.hidden?'????':hidden?text('미확인 전공','Hidden Citation'):label(d)),node('p',null,disclosure.hidden?'????':hidden?text('특별한 생환 기록을 남겨보세요.','Return from an exceptional ordeal.'):en()?d.descriptionEn:d.description));
   const status=node('div','service-medal-meta');status.append(node('span','service-tier tier-'+p.tier,tierName(d,p.tier)));
   if(!hidden){const count=node('span',null,Math.min(p.value,p.goal).toLocaleString()+' / '+p.goal.toLocaleString()+(d.id==='circuit'&&p.goal>1?text(' 전장 · 한 출격 최고',' battlefields · best sortie'):d.id==='survivor'?text('초',' s'):''));status.append(count);const meter=node('progress');meter.max=p.goal;meter.value=Math.min(p.value,p.goal);meter.setAttribute('aria-label',label(d));copy.append(meter)}
   if(p.tier){const a=book.data.awards[d.id],date=new Date(a.firstAt);if(Number.isFinite(date.getTime()))status.append(node('time',null,date.toLocaleDateString(en()?'en-GB':'ko-KR')));const pick=node('button','service-feature-toggle',book.data.featured.includes(d.id)?text('대표 해제','Unfeature'):text('대표 선택','Feature'));pick.type='button';pick.dataset.feature=d.id;pick.setAttribute('aria-pressed',String(book.data.featured.includes(d.id)));status.append(pick)}
   copy.append(status);card.append(copy);grid.append(card);
  }
  if(!grid.childElementCount)grid.append(node('p','service-empty',text('아직 획득한 훈장이 없습니다. 첫 정예 격추부터 도전해보세요.','No medals earned yet. Start with your first priority kill.')));
  renderStrip();
 }
 function showNext(){
  if(timer||!queue.length)return;const id=queue.shift(),d=MEDALS.find(x=>x.id===id);toast.replaceChildren(icon(d,book.progress(d).tier),node('div',null,text('전공 훈장 획득 · ','Medal earned · ')+label(d)));toast.hidden=false;
  timer=setTimeout(()=>{toast.hidden=true;timer=0;showNext()},3200);
 }
 button.onclick=()=>{focusBefore=doc.activeElement;render();dialog.showModal();close.focus()};
 close.onclick=()=>dialog.close();dialog.addEventListener('close',()=>focusBefore?.focus());
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
 filters.onclick=e=>{const b=e.target.closest('[data-filter]');if(b){filter=b.dataset.filter;render();filters.querySelector(`[data-filter="${filter}"]`)?.focus()}};
 grid.onclick=e=>{const b=e.target.closest('[data-feature]');if(!b)return;if(!book.feature(b.dataset.feature)){featuredNote.textContent=text('대표 뱃지는 최대 3개입니다. 기존 선택을 하나 해제하세요.','You can feature 3 medals. Unfeature one first.');return}render();grid.querySelector(`[data-feature="${b.dataset.feature}"]`)?.focus()};
 const unsubscribe=book.subscribe(({newAwards})=>{if(dialog.open)render();else{renderEntry();renderStrip()}for(const id of newAwards)if(!queue.includes(id)&&queue.length<6)queue.push(id);showNext()});
 const localeOff=subscribe(()=>{render();if(dialog.open)dialog.setAttribute('lang',en()?'en':'ko')});
 const onStorage=e=>{if(e.key===MEDAL_SAVE_KEY){try{book.load(JSON.parse(e.newValue));render()}catch{}}};globalThis.addEventListener?.('storage',onStorage);
 function sync(){
  const g=getGame?.();syncPilotKills(g);if(g!==shownRun){shownRun=g;resultSignature='';queue=[];clearTimeout(timer);timer=0;toast.hidden=true;doc.getElementById('serviceResultMedals')?.remove();if(dialog.open)dialog.close()}
  if(!g||!['lost','won'].includes(g.state))return;
  const signature=book.data.featured.join(',')+':'+[...achievementRun(g)?.sessionAwards||[]].join(',');if(signature===resultSignature&&doc.getElementById('serviceResultMedals'))return;
  const modal=doc.getElementById('modal');if(!modal||modal.classList.contains('hidden'))return;resultSignature=signature;
  let box=doc.getElementById('serviceResultMedals');if(!box){box=node('section','service-result');box.id='serviceResultMedals';doc.getElementById('modalText')?.after(box)}box.replaceChildren();
  const earned=[...achievementRun(g)?.sessionAwards||[]];box.append(node('b',null,text('전공 훈장','Service Medals')));if(earned.length)box.append(node('p',null,text('이번 출격: ','This sortie: ')+earned.map(id=>label(MEDALS.find(d=>d.id===id))).join(' · ')));
  const badges=node('div','service-featured');renderStrip(badges);box.append(badges);box.hidden=!earned.length&&!book.data.featured.length;
 }
 render();return{book,sync,dispose(){clearTimeout(timer);mountObserver?.disconnect();unsubscribe();localeOff?.();globalThis.removeEventListener?.('storage',onStorage);dialog.remove();toast.remove();button.remove();link.remove()}};
}

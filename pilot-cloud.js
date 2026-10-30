import {cleanPilotUnlocks,mergePilotUnlocks} from './pilot-unlocks.js';
const pilotUnlockRecords={clean:cleanPilotUnlocks,merge:mergePilotUnlocks};
// Optional account-backed copies of service records. Never stores passwords.
import {PILOT_AIRCRAFT, AIRCRAFT_SELECTION_KEY, pilotAircraftChoices} from './pilot-aircraft.js?v=pilotair1&art=pilot-recovery2';

const own=(o,k)=>Object.hasOwn(o,k),plain=o=>!!o&&typeof o==='object'&&!Array.isArray(o),safe=k=>!['__proto__','prototype','constructor'].includes(k);
const number=n=>Number.isInteger(n)&&n>=0&&n<=1e9;
const empty=()=>({version:1,service:{version:1,metrics:{},collections:{},awards:{},featured:[]},aircraft:{p1:{},p2:{}}});
const validDate=s=>s===''||typeof s==='string'&&s.length<=32&&Number.isFinite(Date.parse(s));
const entries=(obj,max)=>{if(!plain(obj)||Object.keys(obj).length>max)throw new Error('invalid_profile');return Object.entries(obj)};
export const PILOT_CLOUD_OWNER_KEY='headon.pilot-profile.owner.v1';
const BACKUP_PREFIX='headon.pilot-profile.local.v1:',GUEST_IMPORTED_KEY='headon.pilot-profile.guest-imported.v1';

// Reject malformed cloud responses before touching either persistent local key.
export function validatePilotProfile(raw){
 if(!plain(raw)||raw.version!==1||Object.keys(raw).some(k=>!['version','service','aircraft'].includes(k)))throw new Error('invalid_profile');
 const s=raw.service,out=empty();
 if(!plain(s)||s.version!==1||Object.keys(s).some(k=>!['version','metrics','collections','awards','featured','pilotKills','pilotUnlocks'].includes(k)))throw new Error('invalid_profile');
 for(const [k,v]of entries(s.metrics,128)){if(!safe(k)||!/^[a-zA-Z]{1,64}$/.test(k)||!number(v))throw new Error('invalid_profile');out.service.metrics[k]=v}
 for(const [k,list]of entries(s.collections,16)){
  if(!safe(k)||!/^[a-zA-Z]{1,64}$/.test(k)||!Array.isArray(list)||list.length>100||list.some(id=>typeof id!=='string'||!/^[a-z0-9-]{1,80}$/.test(id)))throw new Error('invalid_profile');
  out.service.collections[k]=[...new Set(list)];
 }
 for(const [k,a]of entries(s.awards,128)){
  if(!safe(k)||!/^[a-z0-9_]{1,64}$/.test(k)||!plain(a)||!Number.isInteger(a.tier)||a.tier<1||a.tier>8||!validDate(a.firstAt)||!validDate(a.at)||Object.keys(a).some(v=>!['tier','firstAt','at'].includes(v)))throw new Error('invalid_profile');
  out.service.awards[k]={tier:a.tier,firstAt:a.firstAt,at:a.at};
 }
 if(!Array.isArray(s.featured)||s.featured.length>3||s.featured.some(id=>typeof id!=='string'||!own(out.service.awards,id)))throw new Error('invalid_profile');
 out.service.featured=[...new Set(s.featured)];
 if(s.pilotKills!==undefined){out.service.pilotKills={};for(const [id,n]of entries(s.pilotKills,Object.keys(PILOT_AIRCRAFT).length)){if(!own(PILOT_AIRCRAFT,id)||!number(n))throw new Error('invalid_profile');out.service.pilotKills[id]=n}}
 if(s.pilotUnlocks!==undefined){if(!plain(s.pilotUnlocks)||s.pilotUnlocks.version!==1||JSON.stringify(s.pilotUnlocks).length>40000)throw new Error('invalid_profile');out.service.pilotUnlocks=pilotUnlockRecords.clean(s.pilotUnlocks)}
 if(!plain(raw.aircraft)||Object.keys(raw.aircraft).some(k=>!['p1','p2'].includes(k)))throw new Error('invalid_profile');
 for(const slot of ['p1','p2'])for(const [id,choice]of entries(raw.aircraft[slot]||{},Object.keys(PILOT_AIRCRAFT).length)){
  if(!own(PILOT_AIRCRAFT,id)||!pilotAircraftChoices(id).includes(choice))throw new Error('invalid_profile');out.aircraft[slot][id]=choice;
 }
 return out;
}

// Counts are monotonic; max avoids counting the same restored sortie twice.
export function mergePilotProfiles(remote,local){
 const a=remote?validatePilotProfile(remote):empty(),b=validatePilotProfile(local),out=empty();
 for(const key of ['metrics','pilotKills']){
  if(key==='pilotKills'&&!a.service[key]&&!b.service[key])continue;
  out.service[key]={...a.service[key]};for(const [k,n]of Object.entries(b.service[key]||{}))out.service[key][k]=Math.max(n,out.service[key][k]||0);
 }
 for(const key of new Set([...Object.keys(a.service.collections),...Object.keys(b.service.collections)])){
  const list=[...new Set([...(a.service.collections[key]||[]),...(b.service.collections[key]||[])])].slice(0,100);out.service.collections[key]=list;
  out.service.metrics[key]=Math.max(out.service.metrics[key]||0,list.length);
 }
 if(a.service.pilotUnlocks||b.service.pilotUnlocks)out.service.pilotUnlocks=pilotUnlockRecords.merge(a.service.pilotUnlocks,b.service.pilotUnlocks);
 out.service.awards={...a.service.awards};
 for(const [id,award]of Object.entries(b.service.awards)){
  const old=out.service.awards[id];if(!old){out.service.awards[id]={...award};continue}
  const dates=(...values)=>values.filter(Boolean).sort();
  out.service.awards[id]={tier:Math.max(old.tier,award.tier),firstAt:dates(old.firstAt,award.firstAt)[0]||'',at:dates(old.at,award.at).at(-1)||''};
 }
 out.service.featured=[...(Object.keys(b.service.metrics).length||Object.keys(b.service.awards).length?b.service.featured:a.service.featured)];
 for(const slot of ['p1','p2'])out.aircraft[slot]={...a.aircraft[slot],...b.aircraft[slot]};
 return validatePilotProfile(out);
}

export function installPilotCloud({book,onRestore,canRestore=()=>true,getLocale=()=>globalThis.document?.documentElement?.lang||'ko',document:doc=globalThis.document,storage,fetch:fetcher=globalThis.fetch,debounceMs=15000}={}){
 if(!book||typeof book.load!=='function'||typeof fetcher!=='function')return null;
 if(storage===undefined){try{storage=globalThis.localStorage}catch{storage=null}}
 let state={account:null,phase:'checking',message:'',updatedAt:null},revision=0,timer=0,restoring=false,busy=false,dirty=false,profileReady=false,disposed=false,dialog=null,focusBefore=null;
 const listeners=new Set(),en=()=>String(getLocale()).startsWith('en'),text=(ko,eng)=>en()?eng:ko;
 const errors={
  invalid_credentials:['아이디 또는 비밀번호를 확인하세요.','Check your ID and password.'],account_exists:['이미 사용 중인 아이디입니다. 로그인해 주세요.','That ID already exists. Please sign in.'],
  invalid_id:['아이디는 영문·숫자·밑줄·하이픈 3~32자입니다.','Use 3–32 letters, numbers, underscores or hyphens for your ID.'],invalid_password:['비밀번호는 8~128자입니다.','Use a password of 8–128 characters.'],
  rate_limited:['시도가 너무 많습니다. 잠시 후 다시 시도하세요.','Too many attempts. Please try again later.'],session_expired:['로그인이 만료되었습니다. 다시 로그인하세요.','Your session expired. Sign in again.'],
  invalid_profile:['기록 형식을 확인할 수 없어 불러오지 않았습니다.','The record was not restored because its format is invalid.'],profile_conflict:['다른 기기의 기록이 변경되었습니다. 다시 불러와 주세요.','Another device changed this record. Load it again.'],
  cloud_unavailable:['서버에 연결하지 못했습니다. 이 브라우저 기록은 유지됩니다.','Cloud storage is unavailable. Records in this browser are retained.'],local_save_failed:['서버 기록을 받았지만 이 브라우저에 저장하지 못했습니다.','The cloud record was received, but could not be saved in this browser.'],
  restore_during_sortie:['출격 중에는 기록을 바꾸지 않습니다. 격납고에서 다시 불러와 주세요.','Records cannot be restored during a sortie. Load them again from the hangar.'],profile_not_loaded:['기록을 먼저 불러와 주세요. 기존 브라우저 기록은 유지됩니다.','Load your account records first. Existing browser records are retained.']
 };
 function emit(phase=state.phase,message=state.message){state={...state,phase,message};for(const fn of listeners)try{fn({...state})}catch{}render()}
 async function request(path,method='GET',body){
  const headers=body?{'content-type':'application/json'}:{};if(state.account&&['save','load','logout'].includes(path))headers['x-headon-account']=state.account;
  let response;try{response=await fetcher('/api/pilot-profile/'+path,{method,credentials:'same-origin',headers,...(body?{body:JSON.stringify(body)}:{}),cache:'no-store',signal:globalThis.AbortSignal?.timeout?.(12000)})}catch{throw new Error('cloud_unavailable')}
  let data;try{data=await response.json()}catch{throw new Error('cloud_unavailable')}
  if(!response.ok){const err=new Error(data.error||'cloud_unavailable');err.payload=data;err.status=response.status;throw err}return data;
 }
 function snapshot(){
  let aircraft={p1:{},p2:{}};try{aircraft=JSON.parse(storage?.getItem(AIRCRAFT_SELECTION_KEY)||'{"p1":{},"p2":{}}')}catch{}
  return validatePilotProfile({version:1,service:JSON.parse(JSON.stringify(book.data)),aircraft});
 }
 const localOwner=()=>{try{const id=storage?.getItem(PILOT_CLOUD_OWNER_KEY);return typeof id==='string'&&/^[a-z0-9_-]{3,32}$/.test(id)?id:null}catch{return null}};
 function accountLocal(){
  const owner=localOwner(),current=snapshot();
  // Preserve the old account's offline changes before switching local records.
  storage?.setItem(BACKUP_PREFIX+(owner||'guest'),JSON.stringify(current));
  if(owner===state.account)return {profile:current,importGuest:false};
  const saved=storage?.getItem(BACKUP_PREFIX+state.account);
  if(saved){try{return {profile:validatePilotProfile(JSON.parse(saved)),importGuest:false}}catch{/* A valid server copy can recover a damaged local backup. */}}
  if(!owner&&storage?.getItem(GUEST_IMPORTED_KEY)!=='1')return {profile:current,importGuest:true};
  return {profile:empty(),importGuest:false};
 }
 function fail(error){
  if(error.message==='session_expired'){state.account=null;profileReady=false;clearTimeout(timer);timer=0}
  const msg=errors[error.message]||errors.cloud_unavailable;emit('error',text(...msg));return false;
 }
 function apply(data,{saved=false,importGuest=false,allowDuringSortie=false}={}){
  if(!allowDuringSortie&&!canRestore())throw new Error('restore_during_sortie');
  const checked=validatePilotProfile(data);restoring=true;
  try{book.load(checked.service);book.persist();storage?.setItem(AIRCRAFT_SELECTION_KEY,JSON.stringify(checked.aircraft));storage?.setItem(PILOT_CLOUD_OWNER_KEY,state.account);storage?.setItem(BACKUP_PREFIX+state.account,JSON.stringify(checked));if(importGuest)storage?.setItem(GUEST_IMPORTED_KEY,'1');onRestore?.({aircraft:checked.aircraft,service:book.data});}
  finally{restoring=false}
  if(!book.saved||!storage)throw new Error('local_save_failed');
  profileReady=true;
  if(saved)dirty=false;
 }
 function schedule(){
  if(!state.account||!profileReady||timer||disposed)return;timer=setTimeout(()=>{timer=0;if(dirty&&!busy)void save();else if(dirty)schedule()},Math.max(1000,debounceMs));timer?.unref?.();
 }
 function markDirty(){if(restoring)return;dirty=true;schedule();if(state.account&&!busy)emit('pending',text('변경 내용 자동 저장 대기','Changes will save automatically'))}
 async function loadInternal({saveAfter=false}={}){
  profileReady=false;const result=await request('load');if(result.data!==null)validatePilotProfile(result.data);
  if(result.account!==state.account)throw new Error('session_expired');
  if(!Number.isInteger(result.revision)||result.revision<0)throw new Error('invalid_profile');
  const local=accountLocal(),merged=mergePilotProfiles(result.data,local.profile);revision=result.revision;
  apply(merged,{importGuest:local.importGuest});dirty=true;state.updatedAt=result.updatedAt||null;
  if(saveAfter)return saveInternal();
  emit('restored',text('서버 기록을 합쳐 불러왔습니다.','Cloud records were merged and restored.'));schedule();return true;
 }
 async function saveInternal(){
  if(!profileReady)throw new Error('profile_not_loaded');if(localOwner()!==state.account)throw new Error('session_expired');
  for(let attempt=0;attempt<3;attempt++){
   const data=snapshot();let result;
   try{result=await request('save','PUT',{revision,data})}catch(error){
    if(error.message!=='profile_conflict'||attempt===2)throw error;
    if(localOwner()!==state.account)throw new Error('session_expired');
    const remote=error.payload;if(remote.account!==state.account)throw new Error('session_expired');validatePilotProfile(remote.data);
    if(!Number.isInteger(remote.revision)||remote.revision<0)throw new Error('invalid_profile');
    revision=remote.revision;apply(mergePilotProfiles(remote.data,snapshot()),{allowDuringSortie:true});continue;
   }
   if(result.account!==state.account||localOwner()!==state.account)throw new Error('session_expired');validatePilotProfile(result.data);if(!Number.isInteger(result.revision)||result.revision<1)throw new Error('invalid_profile');
   revision=result.revision;const now=snapshot(),changed=JSON.stringify(now)!==JSON.stringify(data);
   apply(mergePilotProfiles(result.data,now),{saved:!changed,allowDuringSortie:true});dirty=changed;state.updatedAt=result.updatedAt;emit(changed?'pending':'saved',changed?text('최근 변경 내용을 저장 대기 중입니다.','New changes are waiting to save.'):text('서버에 저장했습니다.','Saved to cloud.'));if(changed)schedule();return true;
  }
 }
 async function operate(fn){if(busy||disposed)return false;busy=true;clearTimeout(timer);timer=0;emit('working',text('기록 확인 중…','Checking records…'));try{return await fn()}catch(error){return fail(error)}finally{busy=false;render();if(dirty)schedule()}}
 const save=()=>operate(()=>state.account?saveInternal():Promise.reject(new Error('session_expired')));
 const load=()=>operate(()=>state.account?loadInternal():Promise.reject(new Error('session_expired')));
 const authenticate=(kind,id,pw)=>operate(async()=>{
  const result=await request(kind,'POST',{id,pw});if(typeof result.account!=='string'||!/^[a-z0-9_-]{3,32}$/.test(result.account))throw new Error('invalid_profile');state.account=result.account;profileReady=false;revision=0;
  if(dialog)dialog.querySelector('[name=password]').value='';
  return loadInternal({saveAfter:true});
 });
 const login=(id,pw)=>authenticate('login',id,pw),signup=(id,pw)=>authenticate('signup',id,pw);
 const logout=()=>operate(async()=>{if(dirty&&profileReady&&state.account)await saveInternal();await request('logout','POST',{});state.account=null;profileReady=false;revision=0;dirty=false;emit('offline',text('로그아웃했습니다. 이 브라우저 기록은 유지됩니다.','Signed out. Records in this browser are retained.'));return true});
 function createDialog(){
  if(!doc||dialog)return;
  const node=(tag,content)=>{const el=doc.createElement(tag);if(content!==undefined)el.textContent=content;return el};
  const style=node('style');style.dataset.pilotCloud='';style.textContent='.pilot-cloud{box-sizing:border-box;width:min(430px,calc(100vw - 24px));max-height:calc(100dvh - 28px);overflow:auto;padding:24px;border:1px solid #a28f68;background:#171c1e;color:#eee4ce;box-shadow:0 16px 60px #000b;font:inherit}.pilot-cloud::backdrop{background:#050a0dcc}.pilot-cloud h2{font-size:21px;margin:0 0 12px}.pilot-cloud p{font-size:13px;line-height:1.6;color:#c1baaa}.pilot-cloud label{display:grid;gap:6px;font-size:13px;margin:12px 0}.pilot-cloud input{box-sizing:border-box;width:100%;min-height:44px;border:1px solid #7e785f;background:#0d1417;color:#eee4ce;padding:10px;font:inherit}.pilot-cloud-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}.pilot-cloud button{min-height:44px;padding:10px 14px;border:1px solid #9c8c69;background:#2d3333;color:inherit;font:inherit;cursor:pointer}.pilot-cloud button:disabled{opacity:.5;cursor:wait}.pilot-cloud [role=status]{min-height:42px;white-space:pre-line}.pilot-cloud small{font-size:12px;color:#c1baaa}.pilot-cloud [hidden]{display:none}';doc.head.append(style);
  dialog=node('dialog');dialog.className='pilot-cloud';dialog.id='pilotCloud';dialog.setAttribute('aria-labelledby','pilotCloudTitle');
  const title=node('h2');title.id='pilotCloudTitle';const note=node('p'),account=node('p'),form=node('form');
  const idLabel=node('label'),idText=node('span'),id=node('input');id.name='username';id.autocomplete='username';id.maxLength=32;id.minLength=3;id.required=true;id.pattern='[A-Za-z0-9_-]{3,32}';id.spellcheck=false;id.autocapitalize='none';idLabel.append(idText,id);
  const pwLabel=node('label'),pwText=node('span'),pw=node('input');pw.type='password';pw.name='password';pw.autocomplete='current-password';pw.minLength=8;pw.maxLength=128;pw.required=true;pwLabel.append(pwText,pw);
  const auth=node('div');auth.className='pilot-cloud-actions';const loginButton=node('button'),signupButton=node('button');loginButton.type='submit';signupButton.type='button';auth.append(loginButton,signupButton);form.append(idLabel,pwLabel,auth);
  const actions=node('div');actions.className='pilot-cloud-actions';const saveButton=node('button'),loadButton=node('button'),logoutButton=node('button'),close=node('button');for(const b of [saveButton,loadButton,logoutButton,close])b.type='button';actions.append(saveButton,loadButton,logoutButton,close);
  const status=node('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');const hint=node('small');dialog.append(title,note,account,form,actions,status,hint);doc.body.append(dialog);
  dialog._parts={title,note,account,form,idText,pwText,loginButton,signupButton,saveButton,loadButton,logoutButton,close,status,hint};
  form.onsubmit=e=>{e.preventDefault();if(form.reportValidity())void login(id.value,pw.value)};signupButton.onclick=()=>{if(form.reportValidity())void signup(id.value,pw.value)};saveButton.onclick=()=>void save();loadButton.onclick=()=>void load();logoutButton.onclick=()=>void logout();close.onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{pw.value='';focusBefore?.focus?.({preventScroll:true})});dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
 }
 function render(){
  if(!dialog)return;const p=dialog._parts;dialog.lang=en()?'en':'ko';p.title.textContent=text('파일럿 기록 저장','Pilot Cloud Records');p.note.textContent=text('파일럿별 격추·기체 해금·훈장·선택 기체를 계정으로 보관합니다. 다른 기기의 기록은 큰 값으로 합칩니다.','Store pilot kills, aircraft unlocks, medals and aircraft choices with your account. Higher counts from each device are kept.');
  p.account.textContent=state.account?text('로그인: ','Signed in: ')+state.account:'';p.form.hidden=!!state.account;p.idText.textContent=text('아이디','ID');p.pwText.textContent=text('비밀번호 (8자 이상)','Password (8+ characters)');p.loginButton.textContent=text('로그인','Sign in');p.signupButton.textContent=text('새 계정 만들기','Create account');p.saveButton.textContent=text('지금 저장','Save now');p.loadButton.textContent=text('불러와 합치기','Load and merge');p.logoutButton.textContent=text('로그아웃','Sign out');p.close.textContent=text('닫기','Close');
  for(const b of [p.saveButton,p.loadButton,p.logoutButton])b.hidden=!state.account;
  for(const b of dialog.querySelectorAll('button,input'))b.disabled=busy&&b!==p.close;
  p.saveButton.disabled=busy||!profileReady;
  p.status.textContent=state.message+(state.updatedAt?'\n'+text('최근 서버 저장: ','Last cloud save: ')+new Date(state.updatedAt).toLocaleString(en()?'en-GB':'ko-KR'):'');
  p.hint.textContent=text('비밀번호는 기기에 보관하지 않습니다. 비밀번호 찾기는 지원하지 않으니 따로 기억해 주세요. 랭킹과는 별도 기록입니다.','Passwords are not stored on your device. Password recovery is unavailable, so keep it safe. These records are separate from rankings.');
 }
 const unsubscribe=book.subscribe?.(()=>{if(!restoring)markDirty()});
 const onAircraft=()=>markDirty();globalThis.addEventListener?.('headon:aircraft-selection',onAircraft);
 const onOwnerStorage=e=>{if(e.key===PILOT_CLOUD_OWNER_KEY&&state.account&&e.newValue!==state.account)fail(new Error('session_expired'))};globalThis.addEventListener?.('storage',onOwnerStorage);
 const ready=operate(async()=>{const result=await request('session');if(result.account){if(typeof result.account!=='string'||!/^[a-z0-9_-]{3,32}$/.test(result.account))throw new Error('invalid_profile');state.account=result.account;return loadInternal()}state.account=null;profileReady=false;emit('offline',text('로그인하면 다른 기기에서도 기록을 이어갈 수 있습니다.','Sign in to continue your records on another device.'));return true});
 return {ready,open(){createDialog();if(!dialog)return;focusBefore=doc.activeElement;render();if(!dialog.open)dialog.showModal();(state.account?dialog._parts.close:dialog.querySelector('[name=username]')).focus()},save,load,login,signup,logout,markDirty,getState:()=>({...state}),subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)},dispose(){disposed=true;clearTimeout(timer);unsubscribe?.();listeners.clear();globalThis.removeEventListener?.('headon:aircraft-selection',onAircraft);globalThis.removeEventListener?.('storage',onOwnerStorage);dialog?.remove();doc?.querySelector('style[data-pilot-cloud]')?.remove()}};
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PILOT_IDENTITY_COPY as catalog,pilotIdentityCopy} from '../pilot-identity-copy.js';

const pilots='baron voss boelcke udet goering immelmann huffzky berthold wolff loewenhardt jacobs gontermann lothar sachsenberg proctor schleich lufbery brumowski fonck collishaw baracca guynemer bishop mannock mckeever hawker mccudden nungesser rickenbacker ball barker luke'.split(' ').sort();
const variant='baron:baron_albatros';
const detailFields=['passiveShort','activeShort','passiveDetail','activeDetail'];
const approved={
 'baron:baron_albatros':['붉은 날개','태양의 사냥꾼'],
 baron:['사냥 본능','드라이데커'],voss:['고독한 후사르','세븐 투 원'],
 boelcke:['딕타 뵐케','전술 협공'],udet:['공중 곡예사','두 도흐 니히트'],
 goering:['백색 편대장','화이트 플라이트'],immelmann:['릴의 독수리','임멜만 턴'],
 huffzky:['에만의 엄호','슐라스타 15'],berthold:['날개 달린 검','아이언 나이트'],
 wolff:['여린 꽃','붐 앤 줌'],loewenhardt:['옐로 포커','라이징 스트라이크'],
 jacobs:['검은 악마','야스타 7'],gontermann:['기구 사냥꾼','플레임 살보'],
 lothar:['황색 날개','캐벌리 차지'],sachsenberg:['융커스의 날개','발트해의 매'],
 schleich:['흑기사','블랙 어드밴스'],brumowski:['붉은 호위대','편대 재집결'],
 fonck:['정밀의 에이스','핀포인트 살보'],collishaw:['블랙 플라이트','블랙 마리아'],
 baracca:['바라카의 말','카발리노 람판테'],guynemer:['모퇴르 카농','황새의 포화'],
 bishop:['근접 사냥','게릴라 어택'],mannock:['74비행대 지휘','74비행대 교차강하'],
 mckeever:['파월의 엄호','호크 앤 냇'],hawker:['연속 추적','어택 에브리싱'],
 mccudden:['플라잉 메카닉','야전 정비'],nungesser:['검은 심장','죽음의 기사'],
 rickenbacker:['레이서의 본능','햇 인 더 링'],ball:['고독한 사냥꾼','구름 속의 매'],
 barker:['불굴의 각성','라스트 스탠드'],luke:['벌룬 버스터','연쇄 폭파'],
 proctor:['사격의 명수','버스터 살보'],lufbery:['기교의 장인','라파예트 살보']
};
test('covers the 32 pilots and the separate Richthofen Albatros loadout',()=>{
 assert.deepEqual(Object.keys(catalog).sort(),[...pilots,variant].sort());
});
test('all 66 Korean titles exactly match the approved naming revision',()=>{
 assert.deepEqual(Object.keys(approved).sort(),Object.keys(catalog).sort());
 for(const [id,names] of Object.entries(approved))assert.deepEqual([catalog[id].ko.passive,catalog[id].ko.skill],names,id);
});
test('all Korean/English names and descriptions are populated',()=>{
 for(const [id,langs] of Object.entries(catalog))for(const lang of ['ko','en']){
  assert.deepEqual(Object.keys(langs[lang]).sort(),['passive','skill',...detailFields].sort());
  for(const text of Object.values(langs[lang]))assert.equal(typeof text==='string'&&text.trim().length>0,true,id+':'+lang);
 }
});
test('titles preserve unit numbers and foreign originals without bilingual subtitles',()=>{
 for(const [id,langs] of Object.entries(catalog))for(const lang of ['ko','en'])for(const key of ['passive','skill']){
  const text=langs[lang][key],label=id+':'+lang+':'+key;
  assert.equal(text,text.trim(),label);
  assert.doesNotMatch(text,/[\n\r·|…]/,label);
  if(lang==='ko')assert.match(text,/^[가-힣0-9]+(?: [가-힣0-9]+)*$/,label);
 }
 assert.equal(catalog.udet.en.skill,'Du doch nicht!');
 assert.equal(catalog.baracca.en.skill,'Cavallino Rampante');
 assert.equal(catalog.huffzky.en.skill,'Schlasta 15');
 assert.equal(catalog.jacobs.en.skill,'Jasta 7');
 assert.equal(catalog.mckeever.en.skill,'Hawk & Gnat');
});
test('active/passive names remain distinct and pilot titles are not duplicated',()=>{
 for(const lang of ['ko','en']){
  const seen=new Set();
  for(const [id,copy] of Object.entries(catalog)){
   assert.notEqual(copy[lang].passive,copy[lang].skill,id);
   for(const key of ['passive','skill']){assert.ok(!seen.has(copy[lang][key]),id);seen.add(copy[lang][key]);}
  }
 }
});
test('all existing pilot descriptions are byte-for-byte unchanged from c2d27ad',()=>{
 const rows=pilots.flatMap(id=>['ko','en'].map(lang=>[id,lang,...detailFields.map(f=>catalog[id][lang][f])]));
 assert.equal(createHash('sha256').update(JSON.stringify(rows)).digest('hex'),'d112999f46a62883598ac37e2dfb56cec2c612973d0abeb7d4240b9a22fd7796');
});
test('Albatros keeps its descriptions and never falls back to Dr.I',()=>{
 assert.equal(pilotIdentityCopy(variant).skill,'태양의 사냥꾼');
 assert.equal(pilotIdentityCopy(variant).passive,'붉은 날개');
 assert.equal(pilotIdentityCopy('baron').skill,'드라이데커');
 assert.equal(pilotIdentityCopy(variant).activeDetail,'4초간 전방 적을 제압합니다. 적의 바로 뒤에서 공격하면 추가 피해를 줍니다.');
 assert.equal(pilotIdentityCopy(variant,'en').activeDetail,'Suppress enemies ahead for 4 seconds. Attacks from directly behind deal extra damage.');
 assert.equal(pilotIdentityCopy('nungesser').passive,'검은 심장');
 assert.equal(pilotIdentityCopy('nungesser').skill,'죽음의 기사');
});
test('locale fallback and unknown-ID behavior stay intact',()=>{
 for(const id of Object.keys(catalog)){
  assert.equal(pilotIdentityCopy(id),catalog[id].ko);
  assert.equal(pilotIdentityCopy(id,'en'),catalog[id].en);
  assert.equal(pilotIdentityCopy(id,'unsupported'),catalog[id].ko);
 }
 assert.equal(pilotIdentityCopy('missing'),undefined);
});
test('title guard fits its container without hiding titles or changing descriptions',()=>{
 const css=readFileSync(new URL('../skill-names.css',import.meta.url),'utf8');
 assert.match(css,/white-space:nowrap!important/);
 assert.match(css,/container-type:inline-size/);
 assert.match(css,/font-size:clamp\(11px,10cqi,15px\)/);
 assert.doesNotMatch(css,/#skillDesc|\.astra-ability-copy\s*>?\s*p\b|display\s*:\s*none|text-overflow\s*:\s*ellipsis/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PILOT_IDENTITY_COPY as catalog,pilotIdentityCopy} from '../pilot-identity-copy.js';

const pilots='baron voss boelcke udet goering immelmann huffzky berthold wolff loewenhardt jacobs gontermann lothar sachsenberg proctor schleich lufbery brumowski fonck collishaw baracca guynemer bishop mannock mckeever hawker mccudden nungesser rickenbacker ball barker luke'.split(' ').sort();
const variant='baron:baron_albatros';
const detailFields=['passiveShort','activeShort','passiveDetail','activeDetail'];

test('covers the 32 pilots and the separate Richthofen Albatros loadout',()=>{
 assert.deepEqual(Object.keys(catalog).sort(),[...pilots,variant].sort());
});
test('all Korean/English names and descriptions are populated',()=>{
 for(const [id,langs] of Object.entries(catalog))for(const lang of ['ko','en']){
  assert.deepEqual(Object.keys(langs[lang]).sort(),['passive','skill',...detailFields].sort());
  for(const text of Object.values(langs[lang]))assert.equal(typeof text==='string'&&text.trim().length>0,true,id+':'+lang);
 }
});
test('titles stay within the mobile naming budget without bilingual subtitles',()=>{
 for(const [id,langs] of Object.entries(catalog))for(const lang of ['ko','en'])for(const key of ['passive','skill']){
  const text=langs[lang][key],label=id+':'+lang+':'+key;
  assert.equal(text,text.trim(),label);
  assert.doesNotMatch(text,/[\n\r·|&!…]/,label);
  if(lang==='ko'){
   assert.match(text,/^[가-힣]+(?: [가-힣]+)*$/,label);
   assert.ok([...text.replaceAll(' ','')].length<=6,label);
  }else assert.ok(text.length<=15,label);
 }
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
 assert.equal(createHash('sha256').update(JSON.stringify(rows)).digest('hex'),'25ce7ede23b46642641b46f869f2e22629529dceab0fa9f0dd07f4090ddcdacf');
});
test('Albatros keeps its existing descriptions and never falls back to Dr.I',()=>{
 assert.equal(pilotIdentityCopy(variant).skill,'태양의 기습');
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
test('entrypoint loads the title guard last and has no stale initial skill title',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.ok(html.indexOf('skill-names.css?v=names1')>html.indexOf('hangar-ww1-403.css'));
 assert.match(html,/id="hangarSkill">드라이데커</);
 assert.match(html,/id="skillName">드라이데커</);
 const css=readFileSync(new URL('../skill-names.css',import.meta.url),'utf8');
 assert.match(css,/white-space:nowrap!important/);
 assert.doesNotMatch(css,/#skillDesc|\.astra-ability-copy\s*>?\s*p\b|display\s*:\s*none/);
});

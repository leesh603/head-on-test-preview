// One authoritative pre-sortie roster. Beta access is independent of pilot unlocks.
// Historical sources and exceptions: docs/pilot-aircraft-20261018.md.
const row=(defaultAircraft,unlockAircraft=null,holdReason='')=>Object.freeze({
 defaultAircraft,unlockAircraft,unlockRequirement:null,unlockStatus:!!unlockAircraft,
 holdReason,betaAccess:true
});
export const PILOT_AIRCRAFT=Object.freeze({
 baron:row('fokker','baron_albatros'),voss:row('fokker','voss_pfalz'),
 boelcke:row('boelcke_albatros','eindecker'),
 immelmann:row('eindecker',null,'LVG B.I는 비무장 정찰기여서 전투용 무장 고증 검토 필요'),
 udet:row('udet_fokkerdv','udet_dr1'),goering:row('goering_fokkerd7','goering_dr1'),
 huffzky:row('halberstadt_duo',null,'동일 승무원 조합의 다른 기종 근거 부족'),
 berthold:row('berthold_pfalz','berthold_d7'),wolff:row('wolff_albatros','wolff_f1'),
 loewenhardt:row('loewenhardt_fokkerd7','loewenhardt_albatros'),
 jacobs:row('fokker','jacobs_d7'),brumowski:row('brumowski_albatros','hansa_brandenburg_di'),
 gontermann:row('gontermann_fokker',null,'Pfalz D.III 개인 탑승 근거 추가 확인 필요'),
 lothar:row('lothar_dr1','lothar_albatros'),sachsenberg:row('junkers_d1','sachsenberg_d7'),
 schleich:row('schleich_albatros',null,'다른 기종의 개인 탑승·도색 근거 추가 확인 필요'),
 fonck:row('fonck_spad','fonck_caudron'),collishaw:row('collishaw_sopwith','collishaw_camel'),
 baracca:row('baracca_nieuport','baracca_spad'),guynemer:row('guynemer_spad','morane_l'),
 bishop:row('bishop_nieuport','bishop_se5a'),mannock:row('se5a','mannock_nieuport'),
 mckeever:row('bristol_duo',null,'동일 승무원 조합의 다른 기종 근거 부족'),
 hawker:row('airco_dh2','bristol_scout_c'),mccudden:row('mccudden_se5a','airco_dh2'),
 nungesser:row('nungesser_nieuport24','voisin_iii'),rickenbacker:row('rickenbacker_spad','rickenbacker_n28'),
 ball:row('ball_se5a','ball_nieuport'),barker:row('barker_snipe','barker_re8'),
 luke:row('luke_spad',null,'Nieuport 28은 부대 보유와 개인 탑승 기록을 구분해 추가 확인 필요'),
 proctor:row('proctor_se5a',null,'대표 기체와 충분히 다른 개인 탑승 후보 검토 중'),
 lufbery:row('lufbery_nieuport17',null,'대표 기체와 충분히 다른 개인 탑승 후보 검토 중')
});

// Existing high-quality art is referenced by its real registered sprite ID.
// New models use authored transparent WebPs, loaded only when selected.
export const SORTIE_FITS=Object.freeze({
 fonck_spad:{base:'spad',sprite:'fonck_spad',name:'SPAD XIII · 폰크',style:'rickenbacker_spad'},
 luke_spad:{base:'spad',sprite:'luke_spad',name:'SPAD XIII · 프랭크 루크',style:'rickenbacker_spad'},
 bishop_nieuport:{base:'nieuport',sprite:'bishop_nieuport',name:'Nieuport 17 · 비숍',style:'baracca_nieuport'},
 bishop_se5a:{base:'se5a',sprite:'bishop_se5a',name:'S.E.5a · 비숍'},
 voss_pfalz:{base:'pfalz_d3a',sprite:'voss_pfalz',name:'Pfalz D.III · Jasta 10',style:'berthold_pfalz'},
 udet_dr1:{base:'fokker',sprite:'udet_dr1',name:'Fokker Dr.I · 우데트'},
 goering_dr1:{base:'fokker',sprite:'goering_dr1',name:'Fokker Dr.I · 괴링'},
 berthold_d7:{base:'fokkerd7',sprite:'berthold_d7',name:'Fokker D.VII · 베르톨트',style:'goering_fokkerd7'},
 wolff_f1:{base:'fokker',sprite:'wolff_f1',name:'Fokker F.I · 102/17'},
 loewenhardt_albatros:{base:'albatros',sprite:'loewenhardt_albatros',name:'Albatros D.III (OAW) · Jasta 10',style:'boelcke_albatros'},
 jacobs_d7:{base:'fokkerd7',sprite:'jacobs_d7',name:'Fokker D.VII · 야콥스',style:'goering_fokkerd7'},
 lothar_albatros:{base:'albatros',sprite:'lothar_albatros',name:'Albatros D.III · 로타르 D.2006/16',style:'boelcke_albatros'},
 sachsenberg_d7:{base:'fokkerd7',sprite:'sachsenberg_d7',name:'Fokker D.VII · 작센베르크',style:'goering_fokkerd7'},
 collishaw_camel:{base:'camel',sprite:'collishaw_camel',name:'Sopwith Camel · 콜리쇼 Black Maria'},
 baracca_spad:{base:'spad',sprite:'baracca_spad',name:'SPAD XIII · 이탈리아',style:'rickenbacker_spad'},
 mannock_nieuport:{base:'nieuport',sprite:'mannock_nieuport',name:'Nieuport 17 · 매녹 40 Sqn',style:'baracca_nieuport'},
 rickenbacker_n28:{base:'nieuport28',fallback:'nieuport',sprite:'rickenbacker_n28',name:'Nieuport 28 · 리켄바커 12',style:'baracca_nieuport',speed:150,turn:3.8,hp:95,drag:.19,recovery:1.15,guns:2},
 ball_nieuport:{base:'nieuport',sprite:'ball_nieuport',name:'Nieuport 17 · 앨버트 볼',style:'baracca_nieuport'},
 barker_re8:{base:'re7',weaponBase:'bristol_duo',sprite:'barker_re8',name:'R.E.8 · 복좌 정찰기',style:'bristol_duo',tier:'re8',speed:126,turn:2.25,hp:120,drag:.21,recovery:.85,guns:2,bidirectional:true,role:'복좌 전후방 지원형'},
 fonck_caudron:{base:'re7',sprite:'fonck_caudron',name:'Caudron G.4 · 폰크',style:'re7',tier:'caudron_g4',speed:112,turn:2.3,hp:150,drag:.21,recovery:.75,guns:1,gunName:'Hotchkiss',role:'쌍발 정찰·지속사격형'},
 morane_l:{base:'nieuport',sprite:'morane_l',name:'Morane-Saulnier L',style:'eindecker',tier:'be2c',speed:113,turn:2.65,hp:100,drag:.22,recovery:.8,guns:1,gunName:'Hotchkiss',role:'초기 파라솔 정찰형',wings:1},
 bristol_scout_c:{base:'airco_dh2',sprite:'bristol_scout_c',name:'Bristol Scout C · 1609',style:'airco_dh2',tier:'airco_dh2',speed:137,turn:3.55,hp:80,drag:.23,recovery:.95,guns:1,gunName:'Lewis',gunAngle:-.3,muzzleSide:-5,role:'경량 좌측 경사사격형'},
 hansa_brandenburg_di:{base:'albatros_d2',sprite:'hansa_brandenburg_di',name:'Hansa-Brandenburg D.I',style:'boelcke_albatros',tier:'albatros_d2',speed:133,turn:3.15,hp:105,drag:.23,recovery:.9,guns:1,gunName:'Schwarzlose',role:'초기형 경량 강습기'},
 voisin_iii:{base:'re7',sprite:'voisin_iii',name:'Voisin III',style:'re7',tier:'be2c',speed:102,turn:2.1,hp:140,drag:.25,recovery:.65,guns:1,gunName:'Hotchkiss',role:'푸셔 복좌 지속사격형'}
});
// Artwork variants only: keep saved aircraft IDs and every flight/skill value intact.
export const PILOT_RENDER_ART=Object.freeze({
 boelcke:Object.freeze({eindecker:'boelcke_eindecker'}),
 hawker:Object.freeze({airco_dh2:'hawker_dh2'}),
 mccudden:Object.freeze({airco_dh2:'mccudden_dh2'}),
 mannock:Object.freeze({se5a:'mannock_se5a'})
});
export const NEW_SORTIE_ART=Object.freeze(['morane_l','bristol_scout_c','hansa_brandenburg_di','voisin_iii','loewenhardt_albatros','sachsenberg_d7','wolff_f1','voss_pfalz']);
export const pilotAircraftChoices=id=>{const r=PILOT_AIRCRAFT[id];return r?[r.defaultAircraft,...(r.unlockAircraft?[r.unlockAircraft]:[])]:[]};
export const selectedPilotAircraft=(id,choice)=>pilotAircraftChoices(id).includes(choice)?choice:PILOT_AIRCRAFT[id]?.defaultAircraft;
export const aircraftChoiceLabel=(id,plane,name,role,locale='ko')=>`${plane===PILOT_AIRCRAFT[id]?.defaultAircraft?(locale==='en'?'Default':'기본'):(locale==='en'?'Unlock · Beta open':'해금 · 베타 개방')} · ${name} · ${role||''}`;

export const AIRCRAFT_SELECTION_KEY='headon.pilot-aircraft.v1';
export function readAircraftSelections(storage){
 const out={p1:{},p2:{}};
 try{const saved=JSON.parse(storage.getItem(AIRCRAFT_SELECTION_KEY)||'{}');for(const slot of ['p1','p2'])for(const [id,choice] of Object.entries(saved[slot]||{}))if(PILOT_AIRCRAFT[id]&&pilotAircraftChoices(id).includes(choice))out[slot][id]=choice}catch{}
 return out;
}
export function saveAircraftSelection(storage,selections,slot,id,choice){
 if(!['p1','p2'].includes(slot)||!pilotAircraftChoices(id).includes(choice))return false;
 selections[slot][id]=choice;try{storage.setItem(AIRCRAFT_SELECTION_KEY,JSON.stringify(selections))}catch{}return true;
}

export function installPilotAircraft(planes,weapons,pilots,mapping,profiles,configure){
 for(const [id,s] of Object.entries(SORTIE_FITS)){
  if(planes[id])continue;
  const base=planes[s.base]||planes[s.fallback],weapon=weapons[s.weaponBase||s.base]||weapons[s.fallback];
  if(!base||!weapon)throw new Error('Missing sortie aircraft base: '+id);
  const handling=Object.freeze({...base.handling,...Object.fromEntries(['speed','turn','drag','recovery'].filter(k=>s[k]!==undefined).map(k=>[k,s[k]])),role:s.role||base.role,left:base.handling?.left??1});
  planes[id]={...base,name:s.name,handling,role:s.role||base.role,sortieBase:s.tier||s.base,sortieStyle:s.style||s.base,campaignOnly:false,...Object.fromEntries(['speed','turn','wings'].filter(k=>s[k]!==undefined).map(k=>[k,s[k]]))};
  weapons[id]={...weapon,...(s.guns?{guns:s.guns,gunProfiles:Array(s.guns).fill(s.gunName==='Lewis'?'lewis':weapon.gunProfile||'vickers')}:{}),...(s.gunName?{name:s.gunName,...(['Hotchkiss','Schwarzlose'].includes(s.gunName)?{caliber:'8 mm'}:{})}:{}),...(s.bidirectional?{bidirectional:true,gunProfiles:['vickers','lewis']}:{}),...(s.gunAngle?{sortieGunAngle:s.gunAngle,sortieMuzzleSide:s.muzzleSide}:{})};
  configure(planes[id],s.hp??base.baseHp??base.hp);
  profiles[id]=handling;
 }
 for(const [id,entry] of Object.entries(PILOT_AIRCRAFT)){
  mapping[id]=entry.defaultAircraft;
  if(pilots[id])Object.assign(pilots[id],entry);
 }
}

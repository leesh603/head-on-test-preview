// Generation/performance bands, not rarity. Existing handling and weapons are
// authoritative; growth is granted once at XP pickup, never again in level cost.
export const TIER_XP_GAIN=Object.freeze({1:1.28,2:1.18,3:1,4:1,5:.88});
export const TIER_LABELS=Object.freeze({1:'TIER I',2:'TIER II',3:'TIER III',4:'TIER IV',5:'TIER V'});

// Dates describe introduction generations. The tier also accounts for the
// existing arcade fit: late specialised heavy/support craft need not be V.
// Eindecker synchronisation: airandspace.si.edu/explore/stories/world-war-i-laboratory-air
// Late generation: airandspace.si.edu/collection-objects/fokker-dvii/nasm_A19200004000
// D.VIII: museumofflight.org/exhibits-and-events/aircraft/fokker-dviii-reproduction
// Snipe: rafmuseum.org.uk/research/collections/sopwith-snipe/
// These are game classifications, not historical rankings.
const rows=[
 ['eindecker',1,1915,'빠른 성장 · 정밀 지속사격','Fast growth / sustained precision',['precision','lowSpeedPursuit'],{gunSpreadMultiplier:.72,tailMatchStrength:1.14,tailGraceBonus:.04}],
 ['fokker_e1',1,1915,'빠른 성장 · 저속 정밀사격','Fast growth / low-speed precision',['precision','lowSpeedPursuit'],{gunSpreadMultiplier:.8,tailMatchStrength:1.1,tailGraceBonus:.025}],
 ['be2c',1,1914,'빠른 성장 · 안정적인 관측 비행','Fast growth / steady observation',['growth','stability']],
 ['gunbus',1,1915,'빠른 성장 · 푸셔 전방사격','Fast growth / pusher gun platform',['growth','sustainedFire']],
 ['aviatik',1,1915,'빠른 성장 · 복좌 정찰','Fast growth / two-seat reconnaissance',['growth','twoSeat']],
 ['airco_dh2',2,1916,'근접 선회 · 저속 추격','Close turn / low-speed pursuit',['lowSpeedTurn','lowSpeedPursuit'],{tailMatchStrength:1.08}],
 ['nieuport11',2,1916,'빠른 성장 · 경량 선회','Fast growth / light turning',['growth','lowSpeedTurn']],
 ['pup',2,1916,'경량 선회 · 빠른 방향전환','Light turning / quick reversal',['lowSpeedTurn','reversal']],
 ['strutter',2,1916,'복좌 운용 · 안정적인 진입','Two-seat operation / steady approach',['twoSeat','stability']],
 ['fe2b',2,1915,'빠른 성장 · 복좌 방어','Fast growth / defensive two-seater',['growth','twoSeat']],
 ['re7',2,1915,'빠른 성장 · 묵직한 생환 비행','Fast growth / durable withdrawal',['growth','durability']],
 ['albatros_d2',2,1916,'정면 쌍총 · 안정적인 사격선','Twin frontal guns / steady gun line',['frontalFire','stability']],
 ['caudron_g4',2,1915,'빠른 성장 · 쌍발 내구성','Fast growth / twin-engine endurance',['growth','durability']],
 ['voisin8',2,1916,'푸셔 화력 · 긴 작전 유지','Pusher firepower / endurance',['frontalFire','durability']],
 ['ff33',2,1915,'빠른 성장 · 수상 정찰','Fast growth / floatplane reconnaissance',['growth','twoSeat']],
 ['parseval',1,1909,'빠른 성장 · 완만한 지원 비행','Fast growth / slow support flight',['growth','durability']],
 ['caquot_balloon',1,1916,'빠른 성장 · 관측 임무','Fast growth / observation duty',['growth','observation']],
 ['shuttelanz_sl11',2,1916,'대형 내구성 · 느린 지원 비행','Large hull endurance / slow support',['durability','support']],
 ['albatros',3,1916,'정면 쌍총 · 균형형 진입','Twin frontal guns / balanced approach',['frontalFire','stability']],
 ['nieuport',3,1916,'경량 선회 · 가까운 후방 추격','Light turning / close pursuit',['lowSpeedTurn','lowSpeedPursuit'],{tailMatchStrength:1.06}],
 ['sopwith',3,1917,'연속 방향전환 · 편대 강습','Repeated reversals / formation assault',['reversal','formation']],
 ['spad7',3,1916,'직선 사격 · 속도 회복','Straight gun runs / energy recovery',['boomZoom','energyRecovery']],
 ['dh5',3,1917,'기동 진입 · 근접 사격','Agile approach / close gun runs',['reversal','frontalFire']],
 ['hanriot',3,1917,'경쾌한 선회 · 기동 회복','Light turning / handling recovery',['lowSpeedTurn','energyRecovery']],
 ['bristol_m1',3,1917,'민첩한 단엽기 · 단총 사격','Agile monoplane / single-gun platform',['lowSpeedTurn','precision'],{gunSpreadMultiplier:.92}],
 ['re8',3,1916,'복좌 운용 · 넓은 방어 진로','Two-seat operation / defensive routing',['twoSeat','stability']],
 ['halberstadt_duo',3,1917,'전후방 교차사격 · 근접 지원','Front/rear crossfire / close support',['rearGunner','formation']],
 ['dfw_cv',3,1916,'복좌 정찰 · 안정적인 생환','Two-seat reconnaissance / steady return',['twoSeat','stability']],
 ['camel',4,1917,'우선회 근접전 · 후방 압박','Right-turn dogfight / rear pressure',['rightTurn','lowSpeedPursuit'],{tailMatchStrength:1.06}],
 ['fokker',4,1917,'저속 선회 · 시저스 교전','Low-speed turn / scissors fighting',['lowSpeedTurn','reversal'],{tailMatchStrength:1.08}],
 ['albatros_d5',4,1917,'균형형 쌍총 · 사격선 유지','Balanced twin guns / gun-line control',['frontalFire','stability']],
 ['albatros_d5a',4,1917,'균형형 쌍총 · 안정적인 진입','Balanced twin guns / stable approach',['frontalFire','stability'],{gunSpreadMultiplier:.92}],
 ['oeffag',4,1917,'균형형 쌍총 · 튼튼한 진입','Balanced twin guns / durable approach',['frontalFire','durability']],
 ['nieuport24',4,1917,'경량 선회 · 꼬리잡기 유지','Light turning / sustained tail chase',['lowSpeedTurn','lowSpeedPursuit'],{tailMatchStrength:1.09,tailGraceBonus:.02}],
 ['nieuport28',4,1918,'경량 고속 진입 · 선회 복귀','Light fast approach / turning re-entry',['reversal','energyRecovery']],
 ['se5a',4,1917,'고속 사격 · 에너지 회복','Fast gun runs / energy recovery',['stability','energyRecovery'],{gunSpreadMultiplier:.9}],
 ['spad',4,1917,'고속 일격이탈 · 직선 화력','Boom & Zoom / straight-line firepower',['boomZoom','frontalFire']],
 ['spad12',4,1917,'직선 강습 · 중화력 사격','Straight assault / heavy gun platform',['frontalFire','stability']],
 ['bristol_duo',4,1917,'공세적 복좌기 · 전후방 교차사격','Offensive two-seater / crossfire',['rearGunner','frontalFire']],
 ['pfalz_d3a',4,1917,'튼튼한 강습 · 안정적인 쌍총','Durable assault / steady twin guns',['durability','frontalFire']],
 ['dh4',4,1917,'고속 복좌기 · 통과 사격','Fast two-seater / passing gun runs',['twoSeat','boomZoom']],
 ['hannover_cl3',4,1917,'복좌 근접 지원 · 기동 방어','Two-seat close support / turning defence',['twoSeat','formation']],
 ['junkers_j1',4,1917,'장갑 생환 · 지상 지원','Armoured return / ground support',['durability','support']],
 ['gotha',4,1917,'중폭격기 내구성 · 지원 운용','Heavy bomber endurance / support',['durability','support']],
 ['aeg_g4',4,1916,'쌍발 내구성 · 지원 운용','Twin-engine endurance / support',['durability','support']],
 ['friedrichshafen_g3',4,1917,'중폭격기 생환 · 지원 운용','Heavy bomber return / support',['durability','support']],
 ['breguet14',4,1917,'튼튼한 복좌기 · 주간 강습','Durable two-seater / day assault',['durability','twoSeat']],
 ['phonix_d1',4,1917,'균형형 강습 · 안정적인 진입','Balanced assault / steady approach',['frontalFire','stability']],
 ['aviatik_d1',4,1917,'기동형 강습 · 방향전환','Agile assault / reversal',['reversal','frontalFire']],
 ['morane_ai',4,1918,'경량 단엽기 · 근접 선회','Light monoplane / close turning',['lowSpeedTurn','reversal']],
 ['hb_w29',4,1918,'수상 전투기 · 기동 진입','Floatplane fighter / manoeuvring approach',['reversal','frontalFire']],
 ['felixstowe_f2',4,1917,'비행정 내구성 · 장기 지원','Flying-boat endurance / prolonged support',['durability','support']],
 ['macchi_m5',4,1917,'수상 전투기 · 안정적인 후방 추격','Flying-boat fighter / steady tail pursuit',['lowSpeedPursuit','precision'],{tailMatchStrength:1.07,gunSpreadMultiplier:.92}],
 ['fokkerd7',5,1918,'선회 중 에너지 유지 · 재공격','Energy retention / repeat attacks',['energyRetention','reattack']],
 ['fokkerdv',5,1918,'경쾌한 단엽기 · 기동 재진입','Agile monoplane / manoeuvring re-entry',['reversal','reattack']],
 ['siemens_d4',5,1918,'고속 상승형 · 빠른 재진입','Fast climbing fit / re-entry',['energyRecovery','reattack']],
 ['ssw_d3',5,1918,'상승형 기동 · 빠른 재공격','Climbing manoeuvres / reattack',['energyRecovery','reattack']],
 ['pfalz_d12',5,1918,'후기형 쌍총 · 직선 강습','Late twin guns / straight assault',['frontalFire','stability']],
 ['snipe',5,1918,'후기형 선회기 · 기동 회복','Late turn fighter / handling recovery',['lowSpeedTurn','energyRecovery']],
 ['dolphin',5,1918,'기동형 고속기 · 안정적인 재공격','Agile fast fighter / steady reattack',['reversal','reattack']],
 ['roland_d6',4,1918,'중기체 사격선 · 균형 강습','Heavy gun platform / balanced assault',['stability','frontalFire']],
 ['junkers_d1',5,1918,'전금속 내구성 · 고속 진입','Metal-airframe endurance / fast entry',['durability','boomZoom']],
 ['ansaldo_sva5',5,1917,'최고속 직선 진입 · 일격이탈','Very fast straight entry / Boom & Zoom',['boomZoom','energyRetention']],
];

const aliases={
 dh2:'airco_dh2',bristol:'bristol_duo',halberstadt:'halberstadt_duo',fokker_campaign:'fokker',fokker_d7_campaign:'fokkerd7',
 nieuport_italian:'nieuport',baron_albatros:'albatros',wolff_albatros:'albatros',loewenhardt_fokkerd7:'fokkerd7',mccudden_se5a:'se5a',nungesser_nieuport24:'nieuport24',fokker_jacobs:'fokker',
 goering_fokkerd7:'fokkerd7',collishaw_sopwith:'sopwith',guynemer_spad:'spad12',udet_fokkerdv:'fokkerdv',baracca_nieuport:'nieuport',berthold_pfalz:'pfalz_d3a',
 rickenbacker_spad:'spad',ball_se5a:'se5a',barker_snipe:'snipe',luke_nieuport28:'nieuport28',brumowski_albatros:'albatros',gontermann_fokker:'fokker',
 fokker_standard:'fokker',fokker_f1:'fokker',fokker_red:'fokker',fokker_voss:'fokker',
 jasta4_albatros:'albatros_d5a',jasta5_albatros:'albatros_d5a',jasta78b_albatros:'albatros_d5a',kissenberth_albatros:'albatros_d5a',allmenroder_albatros:'albatros_d5a',
 jasta11a_albatros:'albatros_d5a',jasta11b_albatros:'albatros_d5a',jasta11c_albatros:'albatros_d5a',jasta11d_albatros:'albatros_d5a',
 lothar_dr1:'fokker',beaulieu_dr1:'fokker',mai_dr1:'fokker',hantelmann_dr1:'fokker',
 jasta11_fokkerd7:'fokkerd7',jasta18_fokkerd7:'fokkerd7',jasta43_fokkerd7:'fokkerd7',gabriel_fokkerd7:'fokkerd7',jasta27_fokkerd7:'fokkerd7',
 baeumer_pfalz:'pfalz_d12',degelow_pfalz:'pfalz_d12',linke_crawford_phonix:'phonix_d1',kiss_phonix:'phonix_d1',arigi_aviatik:'aviatik_d1',
 gotha_night:'gotha',staaken_dark:'gotha',brown_camel:'camel',mcelroy_camel:'camel',dazzle_camel:'camel',
 lufbery_nieuport17:'nieuport',dorme_nieuport:'nieuport',meulemeester_nieuport:'nieuport',eagle_nieuport28:'nieuport28',coppens_hanriot:'hanriot',
 madon_spad:'spad',tarascon_spad:'spad',boyau_spad:'spad',hatring_spad:'spad',springs_se5a:'se5a',proctor_se5a:'se5a',checker_se5a:'se5a',ruffo_sva5:'ansaldo_sva5',pierozzi_macchi:'macchi_m5'
};
const catalog={};
for(const [id,tier,introduced,description,descriptionEn,identity,mechanics={}]of rows){
 catalog[id]=Object.freeze({id,baseId:id,tier,tierLabel:TIER_LABELS[tier],introduced,description,descriptionEn,identity:Object.freeze(identity),mechanics:Object.freeze(mechanics),xpGainMultiplier:TIER_XP_GAIN[tier]});
}
for(const [id,baseId]of Object.entries(aliases))catalog[id]=Object.freeze({...catalog[baseId],id,baseId});
// These separate models currently share a legacy bomber fit. Give their own
// operating reason without rewriting that fit or inventing extra armament.
catalog.gotha_night=Object.freeze({...catalog.gotha_night,description:'야간형 지속사격 · 지원 운용',descriptionEn:'Night sustained fire / support',identity:Object.freeze(['sustainedFire','support']),mechanics:Object.freeze({reloadMultiplier:.95})});
catalog.staaken_dark=Object.freeze({...catalog.staaken_dark,description:'대형기 지속사격 · 지원 운용',descriptionEn:'Large-craft sustained fire / support',identity:Object.freeze(['sustainedFire','support']),mechanics:Object.freeze({reloadMultiplier:.9})});
export const AIRCRAFT_TIERS=Object.freeze(catalog);
export const aircraftTierFor=id=>AIRCRAFT_TIERS[id]||null;

// Campaign planes are non-enumerable. Re-running after that registry finishes
// is deliberate and idempotent, and also handles late historical/livery fits.
export function registerAircraftTiers(planes){
 const missing=[];
 for(const id of Object.getOwnPropertyNames(planes)){
  const profile=aircraftTierFor(id);if(!profile){missing.push(id);continue}
  Object.assign(planes[id],{aircraftTier:profile,tier:profile.tier,tierLabel:profile.tierLabel,identityDescription:profile.description,xpGainMultiplier:profile.xpGainMultiplier,xpCostMultiplier:1});
 }
 return missing;
}

const EMPTY_MECHANICS=Object.freeze({});
// A model tier applies to every player fit, but new handling/gun refinements
// leave dedicated pilot fits alone. Their existing aircraft traits still apply.
const DEDICATED_FITS=new Set(['baron_albatros','wolff_albatros','loewenhardt_fokkerd7','mccudden_se5a','nungesser_nieuport24','fokker_jacobs','goering_fokkerd7','collishaw_sopwith','guynemer_spad','udet_fokkerdv','baracca_nieuport','berthold_pfalz','rickenbacker_spad','ball_se5a','barker_snipe','luke_nieuport28','brumowski_albatros','gontermann_fokker']);
export function aircraftTailPursuit(game){return DEDICATED_FITS.has(game.plane)?EMPTY_MECHANICS:aircraftTierFor(game.plane)?.mechanics||EMPTY_MECHANICS}
export function aircraftGunSpreadMultiplier(game){return aircraftTailPursuit(game).gunSpreadMultiplier??1}
export function aircraftReloadMultiplier(game){return aircraftTailPursuit(game).reloadMultiplier??1}

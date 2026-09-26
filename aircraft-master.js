// Identity and display metadata only. No art paths, render geometry or combat values.
// Catalog presence does NOT register a fit, unlock a sortie or activate a pilot.
// Existing PLANES/PILOT_PLANES and mode-specific selection remain authoritative.

const ownerLabels = {
  "baron": ["리히트호펜", "Manfred von Richthofen"],
  "voss": ["베르너 포스", "Werner Voss"],
  "collishaw": ["콜리쇼", "Raymond Collishaw"],
  "baracca": ["바라카", "Francesco Baracca"],
  "udet": ["우데트", "Ernst Udet"],
  "guynemer": ["기네메르", "Georges Guynemer"],
  "goering": ["괴링", "Hermann Göring"],
  "berthold": ["베르토홀트", "Rudolf Berthold"],
  "wolff": ["볼프", "Kurt Wolff"],
  "loewenhardt": ["뢰벤하르트", "Erich Löwenhardt"],
  "mccudden": ["맥커든", "James McCudden"],
  "nungesser": ["너겐서", "Charles Nungesser"],
  "jacobs": ["요제프 야콥스", "Josef Jacobs"],
  "rickenbacker": ["리켄배커", "Eddie Rickenbacker"],
  "ball": ["앨버트 볼", "Albert Ball"],
  "barker": ["빌리 바커", "Billy Barker"],
  "luke": ["프랭크 루크", "Frank Luke"],
  "brumowski": ["브루모프스키", "Godwin Brumowski"],
  "gontermann": ["곤터만", "Heinrich Gontermann"]
};

// [identity, exact in-game model, faction, owner, base fit, simulation fit, usage tags]
// Base fit describes the existing game family, not a new historical claim.
const identityRows = [
  ["fokker","Fokker Dr.I","central",null,"fokker","fokker",[]],
  ["albatros","Albatros D.III","central",null,"albatros","albatros",[]],
  ["camel","Sopwith Camel","entente",null,"camel","camel",[]],
  ["sopwith","Sopwith Triplane","entente",null,"sopwith","sopwith",[]],
  ["nieuport","Nieuport 17","entente",null,"nieuport","nieuport",[]],
  ["spad","SPAD XIII","entente",null,"spad","spad",[]],
  ["fokkerdv","Fokker D.VIII","central",null,"fokkerdv","fokkerdv",[]],
  ["spad12","SPAD XII","entente",null,"spad12","spad12",[]],
  ["re7","R.E.7","entente",null,"re7","re7",["two-seater"]],
  ["fokkerd7","Fokker D.VII","central",null,"fokkerd7","fokkerd7",[]],
  ["eindecker","Fokker E.III","central",null,"eindecker","eindecker",[]],
  ["se5a","S.E.5a","entente",null,"se5a","se5a",[]],
  ["bristol_duo","Bristol F.2B","entente",null,"bristol_duo","bristol_duo",["two-seater","duo"]],
  ["baron_albatros","Albatros D.III","central","baron","albatros","baron_albatros",[]],
  ["albatros_d2","Albatros D.II","central",null,"albatros_d2","albatros_d2",[]],
  ["halberstadt_duo","Halberstadt CL.II","central",null,"halberstadt_duo","halberstadt_duo",["two-seater","duo"]],
  ["nieuport_italian","Nieuport 17 (Italian)","entente",null,"nieuport_italian","nieuport_italian",[]],
  ["nieuport24","Nieuport 24","entente",null,"nieuport24","nieuport24",[]],
  ["pfalz_d3a","Pfalz D.IIIa","central",null,"pfalz_d3a","pfalz_d3a",[]],
  ["airco_dh2","Airco DH.2","entente",null,"airco_dh2","airco_dh2",[]],
  ["wolff_albatros","Albatros D.III","central","wolff","albatros","wolff_albatros",[]],
  ["loewenhardt_fokkerd7","Fokker D.VII","central","loewenhardt","fokkerd7","loewenhardt_fokkerd7",[]],
  ["mccudden_se5a","S.E.5a","entente","mccudden","se5a","mccudden_se5a",[]],
  ["nungesser_nieuport24","Nieuport 24bis","entente","nungesser","nieuport24","nungesser_nieuport24",[]],
  ["fokker_jacobs","Fokker Dr.I","central","jacobs","fokker","fokker_jacobs",[]],
  ["goering_fokkerd7","Fokker D.VII","central","goering","fokkerd7","goering_fokkerd7",[]],
  ["collishaw_sopwith","Sopwith Triplane","entente","collishaw","sopwith","collishaw_sopwith",[]],
  ["guynemer_spad","SPAD XII","entente","guynemer","spad12","guynemer_spad",[]],
  ["udet_fokkerdv","Fokker D.VIII","central","udet","fokkerdv","udet_fokkerdv",[]],
  ["baracca_nieuport","Nieuport 17","entente","baracca","nieuport","baracca_nieuport",[]],
  ["berthold_pfalz","Pfalz D.IIIa","central","berthold","pfalz_d3a","berthold_pfalz",[]],
  ["be2c","B.E.2c","entente",null,"be2c","be2c",["campaign","two-seater"]],
  ["dh2","Airco DH.2","entente",null,"dh2","dh2",["campaign"]],
  ["aviatik","Aviatik C.I","central",null,"aviatik","aviatik",["campaign","two-seater"]],
  ["strutter","Sopwith 1½ Strutter","entente",null,"strutter","strutter",["campaign","two-seater"]],
  ["nieuport11","Nieuport 11","entente",null,"nieuport11","nieuport11",["campaign"]],
  ["nieuport28","Nieuport 28","entente",null,"nieuport28","nieuport28",["campaign"]],
  ["fokker_e1","Fokker E.I","central",null,"fokker_e1","fokker_e1",["campaign"]],
  ["albatros_d5","Albatros D.V","central",null,"albatros_d5","albatros_d5",["campaign"]],
  ["oeffag","Albatros D.III (Oeffag)","central",null,"oeffag","oeffag",["campaign"]],
  ["fokker_campaign","Fokker Dr.I","central",null,"fokker_campaign","fokker_campaign",["campaign"]],
  ["fokker_d7_campaign","Fokker D.VII","central",null,"fokker_d7_campaign","fokker_d7_campaign",["campaign"]],
  ["pup","Sopwith Pup","entente",null,"pup","pup",["campaign"]],
  ["dh5","Airco DH.5","entente",null,"dh5","dh5",["campaign"]],
  ["bristol","Bristol F.2B","entente",null,"bristol","bristol",["campaign","two-seater"]],
  ["halberstadt","Halberstadt CL.II","central",null,"halberstadt","halberstadt",["campaign","two-seater"]],
  ["albatros_d5a","Albatros D.Va","central",null,"albatros_d5a","albatros_d5a",["campaign"]],
  ["spad7","SPAD VII","entente",null,"spad7","spad7",["campaign"]],
  ["hanriot","Hanriot HD.1","entente",null,"hanriot","hanriot",["campaign"]],
  ["re8","R.E.8","entente",null,"re8","re8",["campaign","two-seater"]],
  ["dh4","Airco DH.4","entente",null,"dh4","dh4",["campaign","two-seater"]],
  ["siemens_d4","Siemens-Schuckert D.IV","central",null,"siemens_d4","siemens_d4",["campaign"]],
  ["roland_d6","Roland D.VIa","central",null,"roland_d6","roland_d6",["campaign"]],
  ["hannover_cl3","Hannover CL.IIIa","central",null,"hannover_cl3","hannover_cl3",["campaign","two-seater"]],
  ["dfw_cv","DFW C.V","central",null,"dfw_cv","dfw_cv",["campaign","two-seater"]],
  ["junkers_j1","Junkers J.I","central",null,"junkers_j1","junkers_j1",["campaign","two-seater"]],
  ["gotha","Gotha G.V","central",null,"gotha","gotha",["campaign","large","bomber"]],
  ["bristol_m1","Bristol M.1","entente",null,"bristol_m1","bristol_m1",["campaign"]],
  ["dolphin","Sopwith Dolphin","entente",null,"dolphin","dolphin",["campaign"]],
  ["snipe","Sopwith Snipe","entente",null,"snipe","snipe",["campaign"]],
  ["fe2b","F.E.2b","entente",null,"fe2b","fe2b",["campaign","two-seater"]],
  ["gunbus","Vickers F.B.5 Gunbus","entente",null,"gunbus","gunbus",["campaign","two-seater"]],
  ["morane_ai","Morane-Saulnier A.I","entente",null,"morane_ai","morane_ai",["campaign"]],
  ["rickenbacker_spad","SPAD XIII","entente","rickenbacker","spad","rickenbacker_spad",[]],
  ["ball_se5a","S.E.5a","entente","ball","se5a","ball_se5a",[]],
  ["barker_snipe","Sopwith Snipe","entente","barker","snipe","barker_snipe",[]],
  ["luke_nieuport28","Nieuport 28","entente","luke","nieuport28","luke_nieuport28",[]],
  ["brumowski_albatros","Albatros D.III","central","brumowski","albatros","brumowski_albatros",[]],
  ["gontermann_fokker","Fokker Dr.I","central","gontermann","fokker","gontermann_fokker",[]],
  ["fokker_red","Fokker Dr.I","central","baron","fokker","fokker",[]],
  ["fokker_voss","Fokker F.I","central","voss","fokker","fokker",[]],
  ["hansa_brandenburg_cc","Hansa-Brandenburg C.C.","central",null,"hansa_brandenburg_cc",null,["seaplane","boss-minion"]],
  ["macchi_m5","Macchi M.5","entente",null,"macchi_m5",null,["seaplane","boss-minion"]],
  ["macchi_m3","Macchi M.3","entente",null,"macchi_m3",null,["seaplane"]],
  ["lohner_l","Lohner L","central",null,"lohner_l",null,["seaplane"]],
  ["l70","Super Zeppelin L70","central",null,"l70",null,["large","boss"]],
  ["hma23","HMA 23-class airborne carrier","entente",null,"hma23",null,["large","boss"]],
  ["gik","Hansa-Brandenburg G.IK","central",null,"gik",null,["large","boss"]],
  ["ca4","Caproni Ca.4","entente",null,"ca4",null,["large","boss"]],
  ["staaken","Zeppelin-Staaken R.VI","central",null,"staaken",null,["large","support","boss"]],
  ["handley-page","Handley Page O/400","entente",null,"handley-page",null,["large","support","boss"]],
  ["zeppelin_generic_central","Zeppelin","central",null,"zeppelin_generic_central",null,["airship","non-player","special"]],
  ["zeppelin_generic_entente","Entente airship","entente",null,"zeppelin_generic_entente",null,["airship","non-player","special"]],
  ["aeg_g4","AEG G.IV","central",null,"re7","aeg_g4",["campaign","large","bomber","two-seater"]],
  ["friedrichshafen_g3","Friedrichshafen G.III","central",null,"re7","friedrichshafen_g3",["campaign","large","bomber","two-seater"]],
  ["breguet14","Breguet 14","entente",null,"re7","breguet14",["campaign","bomber","two-seater"]],
  ["voisin8","Voisin 8","entente",null,"re7","voisin8",["campaign","bomber","two-seater"]],
  ["caudron_g4","Caudron G.4","entente",null,"re7","caudron_g4",["campaign","bomber","two-seater"]],
  ["ssw_d3","Siemens-Schuckert D.III","central",null,"albatros","ssw_d3",["campaign"]],
  ["pfalz_d12","Pfalz D.XII","central",null,"albatros","pfalz_d12",["campaign"]],
  ["phonix_d1","Phönix D.I","central",null,"albatros","phonix_d1",["campaign"]],
  ["aviatik_d1","Aviatik D.I Berg","central",null,"albatros","aviatik_d1",["campaign"]],
  ["junkers_d1","Junkers D.I","central",null,"albatros","junkers_d1",["campaign"]],
  ["ansaldo_sva5","Ansaldo SVA.5","entente",null,"spad","ansaldo_sva5",["campaign"]],
  ["hb_w29","Hansa-Brandenburg W.29","central",null,"albatros","hb_w29",["campaign"]],
  ["ff33","Friedrichshafen FF.33","central",null,"re7","ff33",["campaign","two-seater"]],
  ["felixstowe_f2","Felixstowe F.2","entente",null,"re7","felixstowe_f2",["campaign","large","two-seater"]],
  ["shuttelanz_sl11","Schütte-Lanz SL.11","central",null,"re7","shuttelanz_sl11",["campaign","large","airship"]],
  ["parseval","Parseval PL","central",null,"re7","parseval",["campaign","large","airship"]],
  ["caquot_balloon","Caquot Balloon","entente",null,"re7","caquot_balloon",["campaign","large","observation"]],
  ["jasta4_albatros","Albatros D.Va · 야스타 4","central",null,"albatros","jasta4_albatros",["campaign","livery"]],
  ["jasta5_albatros","Albatros D.Va · 야스타 5","central",null,"albatros","jasta5_albatros",["campaign","livery"]],
  ["jasta78b_albatros","Albatros D.Va · 야스타 78b","central",null,"albatros","jasta78b_albatros",["campaign","livery"]],
  ["kissenberth_albatros","Albatros D.Va · 키센베르트","central",null,"albatros","kissenberth_albatros",["campaign","livery"]],
  ["allmenroder_albatros","Albatros D.Va · 알멘룰더","central",null,"albatros","allmenroder_albatros",["campaign","livery"]],
  ["lothar_dr1","Fokker Dr.I · 로타르","central",null,"fokker","lothar_dr1",["campaign","livery"]],
  ["beaulieu_dr1","Fokker Dr.I · 볼리외","central",null,"fokker","beaulieu_dr1",["campaign","livery"]],
  ["mai_dr1","Fokker Dr.I · 마이","central",null,"fokker","mai_dr1",["campaign","livery"]],
  ["hantelmann_dr1","Fokker Dr.I · 한텔만","central",null,"fokker","hantelmann_dr1",["campaign","livery"]],
  ["jasta11_fokkerd7","Fokker D.VII · 야스타 11","central",null,"fokkerd7","jasta11_fokkerd7",["campaign","livery"]],
  ["jasta18_fokkerd7","Fokker D.VII · 야스타 18","central",null,"fokkerd7","jasta18_fokkerd7",["campaign","livery"]],
  ["jasta43_fokkerd7","Fokker D.VII · 야스타 43","central",null,"fokkerd7","jasta43_fokkerd7",["campaign","livery"]],
  ["gabriel_fokkerd7","Fokker D.VII · 가브리엘","central",null,"fokkerd7","gabriel_fokkerd7",["campaign","livery"]],
  ["jasta27_fokkerd7","Fokker D.VII · 귀링","central",null,"fokkerd7","jasta27_fokkerd7",["campaign","livery"]],
  ["baeumer_pfalz","Pfalz D.XII · 보이머","central",null,"pfalz_d12","baeumer_pfalz",["campaign","livery"]],
  ["degelow_pfalz","Pfalz D.XII · 데겔로프","central",null,"pfalz_d12","degelow_pfalz",["campaign","livery"]],
  ["linke_crawford_phonix","Phönix D.I · 링케-크로퍼드","central",null,"phonix_d1","linke_crawford_phonix",["campaign","livery"]],
  ["kiss_phonix","Phönix D.I · 키스","central",null,"phonix_d1","kiss_phonix",["campaign","livery"]],
  ["arigi_aviatik","Aviatik D.I · 아리기","central",null,"aviatik_d1","arigi_aviatik",["campaign","livery"]],
  ["gotha_night","Gotha G.IV · 야간형","central",null,"gotha","gotha_night",["campaign","large","bomber","livery"]],
  ["staaken_dark","Staaken R.VI · 심녹색","central",null,"gotha","staaken_dark",["campaign","large","bomber","livery"]],
  ["brown_camel","Sopwith Camel · 로이 브라운","entente",null,"camel","brown_camel",["campaign","livery"]],
  ["mcelroy_camel","Sopwith Camel · 맥엘로이","entente",null,"camel","mcelroy_camel",["campaign","livery"]],
  ["dazzle_camel","Sopwith Camel · 대즐위장","entente",null,"camel","dazzle_camel",["campaign","livery"]],
  ["lufbery_nieuport17","Nieuport 17 · 러프버리","entente",null,"nieuport","lufbery_nieuport17",["campaign","livery"]],
  ["dorme_nieuport","Nieuport 23 · 도름","entente",null,"nieuport","dorme_nieuport",["campaign","livery"]],
  ["meulemeester_nieuport","Nieuport · 뮨르메스터","entente",null,"nieuport","meulemeester_nieuport",["campaign","livery"]],
  ["eagle_nieuport28","Nieuport 28 · 제27대대","entente",null,"nieuport28","eagle_nieuport28",["campaign","livery"]],
  ["coppens_hanriot","Hanriot HD.1 · 코펜스","entente",null,"hanriot","coppens_hanriot",["campaign","livery"]],
  ["madon_spad","SPAD XIII · 마동","entente",null,"spad","madon_spad",["campaign","livery"]],
  ["tarascon_spad","SPAD · 타라콘","entente",null,"spad","tarascon_spad",["campaign","livery"]],
  ["boyau_spad","SPAD XIII · 보요","entente",null,"spad","boyau_spad",["campaign","livery"]],
  ["hatring_spad","SPAD XIII · 제94대대","entente",null,"spad","hatring_spad",["campaign","livery"]],
  ["springs_se5a","S.E.5a · 스프링스","entente",null,"se5a","springs_se5a",["campaign","livery"]],
  ["proctor_se5a","S.E.5a · 프록터","entente",null,"se5a","proctor_se5a",["campaign","livery"]],
  ["checker_se5a","S.E.5a · 제60대대","entente",null,"se5a","checker_se5a",["campaign","livery"]],
  ["ruffo_sva5","SVA.5 · 루포","entente",null,"ansaldo_sva5","ruffo_sva5",["campaign","livery"]],
  ["pierozzi_macchi","Macchi M.5 · 피에로치","entente",null,"albatros","pierozzi_macchi",["campaign","livery"]],
];

export const AIRCRAFT_MASTER = Object.freeze(Object.fromEntries(identityRows.map(
  ([aircraftId, modelName, faction, exclusivePilotId, baseAirframeId, simulationId, tags]) => {
    const owner = exclusivePilotId ? ownerLabels[exclusivePilotId] : null;
    return [aircraftId, Object.freeze({
      aircraftId, modelName, faction, exclusivePilotId, baseAirframeId, simulationId,
      category: owner ? 'exclusive' : 'basic',
      tags: Object.freeze(tags),
      displayNameKo: modelName + (owner ? ` (⁠${owner[0]} 전용기)` : ''),
      displayNameEn: modelName + (owner ? ` (⁠${owner[1]}'s aircraft)` : ''),
    })];
  }
)));

// Descriptive pilot associations only; never use this table to overwrite live loadouts.
const pilotRows = [
  ["baron","fokker_red",["baron_albatros"]],
  ["fonck","camel",[]],
  ["voss","fokker_voss",[]],
  ["boelcke","albatros_d2",[]],
  ["collishaw","collishaw_sopwith",[]],
  ["baracca","baracca_nieuport",[]],
  ["udet","udet_fokkerdv",[]],
  ["guynemer","guynemer_spad",[]],
  ["bishop","re7",[]],
  ["goering","goering_fokkerd7",[]],
  ["immelmann","eindecker",[]],
  ["mannock","se5a",[]],
  ["mckeever","bristol_duo",[]],
  ["huffzky","halberstadt_duo",[]],
  ["hawker","airco_dh2",[]],
  ["berthold","berthold_pfalz",[]],
  ["wolff","wolff_albatros",[]],
  ["loewenhardt","loewenhardt_fokkerd7",[]],
  ["mccudden","mccudden_se5a",[]],
  ["nungesser","nungesser_nieuport24",[]],
  ["jacobs","fokker_jacobs",[]],
  ["rickenbacker","rickenbacker_spad",[]],
  ["ball","ball_se5a",[]],
  ["barker","barker_snipe",[]],
  ["luke","luke_nieuport28",[]],
  ["brumowski","brumowski_albatros",[]],
  ["gontermann","gontermann_fokker",[]]
];
export const PILOT_AIRCRAFT = Object.freeze(Object.fromEntries(pilotRows.map(
  ([pilotId, defaultAircraftId, alternateAircraftIds]) => [pilotId, Object.freeze({
    pilotId, defaultAircraftId, alternateAircraftIds: Object.freeze(alternateAircraftIds),
  })]
)));

// Label aliases only. The renderer's aliases and game IDs are not modified.
export const AIRCRAFT_LABEL_ALIASES = Object.freeze({
  fokker_standard: 'fokker', fokker_f1: 'fokker_voss', 'zeppelin-l70': 'l70',
});
const sharedFokkerOwners = Object.freeze({
  baron: 'fokker_red', voss: 'fokker_voss', jacobs: 'fokker_jacobs',
});
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

export function getAircraftMeta(id, pilotId = null) {
  if (typeof id !== 'string') return null;
  let key = own(AIRCRAFT_LABEL_ALIASES, id) ? AIRCRAFT_LABEL_ALIASES[id] : id;
  // Only the shared runtime fit is pilot-aware. An explicit standard/campaign
  // ID must remain a basic aircraft even with a pilot argument.
  if (id === 'fokker' && own(sharedFokkerOwners, pilotId)) key = sharedFokkerOwners[pilotId];
  return own(AIRCRAFT_MASTER, key) ? AIRCRAFT_MASTER[key] : null;
}

export function getAircraftDisplayName(id, pilotId = null, locale = 'ko', fallback = '') {
  const meta = getAircraftMeta(id, pilotId);
  return meta ? (locale === 'en' ? meta.displayNameEn : meta.displayNameKo) : fallback || id || '';
}

export function getAircraftCategory(id, pilotId = null) {
  return getAircraftMeta(id, pilotId)?.category ?? null;
}

export function aircraftCategoryLabel(id, pilotId = null, locale = 'ko') {
  const category = getAircraftCategory(id, pilotId);
  if (!category) return '';
  return locale === 'en' ? (category === 'exclusive' ? 'Pilot-specific' : 'Basic')
    : (category === 'exclusive' ? '전용기' : '기본기');
}

// Inspect the registry actually supplied by the caller, including non-enumerable
// campaign fits. Registration is not proof of selection availability or working skills.
export function getAircraftRegistration(id, planes, pilotId = null) {
  const meta = getAircraftMeta(id, pilotId);
  if (!meta) return null;
  const registered = !!(planes && meta.simulationId && own(planes, meta.simulationId));
  return Object.freeze({
    aircraftId: meta.aircraftId, simulationId: meta.simulationId, registered,
    campaignOnly: registered ? !!planes[meta.simulationId].campaignOnly : null,
  });
}

// Only text and descriptive category fields may change. Preserve row counts,
// ordering, all image URLs, statistics, weapons, biographies and pilot abilities.
export function applyAircraftRecordNames(data, locale = 'ko') {
  for (const plane of data.planes || []) {
    const meta = getAircraftMeta(plane.key);
    if (!meta) continue;
    plane.name = getAircraftDisplayName(plane.key, null, locale, plane.name);
    plane.category = meta.category;
    plane.categoryLabel = aircraftCategoryLabel(plane.key, null, locale);
  }
  for (const pilot of data.pilots || []) {
    const mapping = own(PILOT_AIRCRAFT, pilot.key) ? PILOT_AIRCRAFT[pilot.key] : null;
    if (!mapping) continue;
    const ids = [mapping.defaultAircraftId, ...mapping.alternateAircraftIds];
    pilot.plane = getAircraftDisplayName(ids[0], null, locale, pilot.plane);
    (pilot.aircraftOptions || []).forEach((option, index) => {
      if (ids[index]) option.name = getAircraftDisplayName(ids[index], null, locale, option.name);
    });
  }
  return data;
}

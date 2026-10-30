// Approved concepts 01–32: NPC-only art/profile registrations, never playable ace skills.
// New-airframe speed/hp/turn/fire values multiply the COMMON spawned NPC defaults,
// not the comparison aircraft's already-multiplied values. Fire > 1 is a longer interval.
// Personal paints copy existing BANK_LIVERY_FAMILIES base/scale and use unit multipliers.
// Years are conservative encounter gates, not guarantees of exact service-entry dates.
// Static family copies avoid a concept-art -> BANK_ART -> liveries import cycle.
// crewCount describes visible authored stations where known; closed-cabin total is null.
const rows = [
  [
    "bank_plane_morane_type_n",
    {
      "conceptId": "01",
      "newAirframe": true,
      "name": "Morane-Saulnier Type N",
      "ko": "모란-솔니에 타입 N",
      "crewCount": 1,
      "scorePolicy": "existing-enemy-type",
      "role": "fighter",
      "base": "nieuport",
      "speed": 0.86,
      "hp": 0.8,
      "turn": 1.04,
      "fire": 1.25,
      "scale": 0.88,
      "id": "morane_type_n",
      "year": 1915,
      "faction": "entente",
      "comparisonExistingId": "nieuport_11_bebe",
      "note": "Earlier compact single-gun scout; do not confuse Morane AI.",
      "roleSummary": "Single-seat scout / fighter",
      "weaponMounts": [
        {
          "x": 144,
          "y": 91,
          "direction": "forward",
          "evidence": "inferred"
        }
      ],
      "bombOrigin": {
        "x": 144,
        "y": 145
      },
      "bombOriginEvidence": "underside origin inferred; top-view hardware not visible",
      "flightRole": "fighter",
      "bombLoad": 0
    }
  ],
  [
    "bank_plane_fokker_dii",
    {
      "conceptId": "02",
      "newAirframe": true,
      "name": "Fokker D.II",
      "ko": "포커 D.II",
      "crewCount": 1,
      "scorePolicy": "existing-enemy-type",
      "role": "fighter",
      "base": "albatros",
      "speed": 0.9,
      "hp": 0.91,
      "turn": 1.04,
      "fire": 1.18,
      "scale": 0.93,
      "id": "fokker_dii",
      "year": 1916,
      "faction": "central",
      "comparisonExistingId": "halberstadt_dii",
      "note": "Early scout, not existing Fokker D.V.",
      "roleSummary": "Single-seat scout / fighter",
      "weaponMounts": [
        {
          "x": 144,
          "y": 99,
          "direction": "forward",
          "evidence": "inferred"
        }
      ],
      "bombOrigin": {
        "x": 144,
        "y": 148
      },
      "bombOriginEvidence": "underside origin inferred; top-view hardware not visible",
      "flightRole": "fighter",
      "bombLoad": 0
    }
  ],
  [
    "bank_plane_farman_f50",
    {
      "conceptId": "03",
      "newAirframe": true,
      "name": "Farman F.50",
      "ko": "파르망 F.50",
      "crewCount": 2,
      "scorePolicy": "existing-enemy-type",
      "role": "bomber",
      "base": "gotha",
      "speed": 0.78,
      "hp": 2.5,
      "turn": 0.57,
      "fire": 1.3,
      "scale": 1.67,
      "id": "farman_f50",
      "year": 1918,
      "faction": "entente",
      "comparisonExistingId": "caproni_ca3",
      "note": "Twin-engine heavy bomber; below Ca.3 durability/size.",
      "roleSummary": "Land bomber",
      "weaponMounts": [
        {
          "x": 144,
          "y": 57,
          "direction": "forward",
          "evidence": "observed"
        }
      ],
      "bombOrigin": {
        "x": 144,
        "y": 151
      },
      "bombOriginEvidence": "underside origin inferred; top-view hardware not visible",
      "flightRole": "bomber",
      "bombLoad": 1
    }
  ],
  [
    "bank_plane_short_bomber",
    {
      "conceptId": "04",
      "newAirframe": true,
      "name": "Short Bomber",
      "ko": "쇼트 폭격기",
      "crewCount": 2,
      "scorePolicy": "existing-enemy-type",
      "role": "bomber",
      "base": "re8",
      "speed": 0.72,
      "hp": 1.8,
      "turn": 0.56,
      "fire": 1.38,
      "scale": 1.58,
      "id": "short_bomber",
      "year": 1916,
      "faction": "entente",
      "comparisonExistingId": "short_184",
      "note": "Land bomber, NOT Short184 floatplane; no sea prefix.",
      "roleSummary": "Land bomber",
      "weaponMounts": [
        {
          "x": 144,
          "y": 149,
          "direction": "aft",
          "evidence": "observed"
        }
      ],
      "bombOrigin": {
        "x": 144,
        "y": 157
      },
      "bombOriginEvidence": "underside origin inferred; top-view hardware not visible",
      "flightRole": "bomber",
      "bombLoad": 1
    }
  ],
  [
    "bank_ace_stark_fokkerd7",
    {
      "conceptId": "05",
      "newAirframe": false,
      "name": "Stark - Fokker D.VII",
      "ko": "슈타르크 - 포커 D.VII",
      "crewCount": 1,
      "scorePolicy": "existing-enemy-type",
      "id": "stark_fokkerd7",
      "family": "fokkerd7",
      "paint": "stark_fokkerd7",
      "faction": "central",
      "role": "fighter",
      "base": "fokkerd7",
      "scale": 1,
      "speed": 1,
      "hp": 1,
      "turn": 1,
      "fire": 1,
      "encounterTypes": [
        "hunter"
      ],
      "year": 1918,
      "comparisonExistingId": "fokkerd7",
      "note": "Personal livery only; existing family handling and size, no pilot ability or player loadout changes.",
      "roleSummary": "Single-seat scout / fighter",
      "flightRole": "named-enemy-hunter-livery; original family combat profile"
    }
  ],
  [
    "bank_ace_klimke_dr1",
    {
      "conceptId": "06",
      "newAirframe": false,
      "name": "Klimke - Fokker Dr.I",
      "ko": "클림케 - 포커 Dr.I",
      "crewCount": 1,
      "scorePolicy": "existing-enemy-type",
      "id": "klimke_dr1",
      "family": "fokker_dr1",
      "paint": "klimke_dr1",
      "faction": "central",
      "role": "fighter",
      "base": "fokker",
      "scale": 1,
      "speed": 1,
      "hp": 1,
      "turn": 1,
      "fire": 1,
      "encounterTypes": [
        "hunter"
      ],
      "year": 1918,
      "comparisonExistingId": "fokker_dr1",
      "note": "Personal livery only; existing family handling and size, no pilot ability or player loadout changes.",
      "roleSummary": "Single-seat scout / fighter",
      "flightRole": "named-enemy-hunter-livery; original family combat profile"
    }
  ],
  [
    "bank_ace_buchner_fokkerd7",
    {
      "conceptId": "07",
      "newAirframe": false,
      "name": "Buchner - Fokker D.VII",
      "ko": "부흐너 - 포커 D.VII",
      "crewCount": 1,
      "scorePolicy": "existing-enemy-type",
      "id": "buchner_fokkerd7",
      "family": "fokkerd7",
      "paint": "buchner_fokkerd7",
      "faction": "central",
      "role": "fighter",
      "base": "fokkerd7",
      "scale": 1,
      "speed": 1,
      "hp": 1,
      "turn": 1,
      "fire": 1,
      "encounterTypes": [
        "hunter"
      ],
      "year": 1918,
      "comparisonExistingId": "fokkerd7",
      "note": "Personal livery only; existing family handling and size, no pilot ability or player loadout changes.",
      "roleSummary": "Single-seat scout / fighter",
      "flightRole": "named-enemy-hunter-livery; original family combat profile"
    }
  ],
  [
    "bank_ace_cobby_camel",
    {
      "conceptId": "08",
      "newAirframe": false,
      "name": "Cobby - Sopwith Camel",
      "ko": "코비 - 소프위드 카멜",
      "crewCount": 1,
      "scorePolicy": "existing-enemy-type",
      "id": "cobby_camel",
      "family": "camel",
      "paint": "cobby_camel",
      "faction": "entente",
      "role": "fighter",
      "base": "camel",
      "scale": 1,
      "speed": 1,
      "hp": 1,
      "turn": 1,
      "fire": 1,
      "encounterTypes": [
        "hunter"
      ],
      "year": 1918,
      "comparisonExistingId": "camel",
      "note": "Personal livery only; existing family handling and size, no pilot ability or player loadout changes. Training livery with game armament adaptation, not combat markings; 1918 attribution is approximate. 게임용 무장 각색 · 실전 도색 재현 아님",
      "historicalCombat": false,
      "yearAttribution": "approximate",
      "roleSummary": "Single-seat scout / fighter",
      "flightRole": "named-enemy-hunter-livery; original family combat profile"
    }
  ],
  [
    "bank_plane_spad_sa2",
    {
      "conceptId": "09",
      "newAirframe": true,
      "name": "SPAD S.A.2",
      "ko": "스파드 S.A.2",
      "crewCount": 2,
      "scorePolicy": "existing-enemy-type",
      "role": "recon",
      "base": "gunbus",
      "speed": 0.8,
      "hp": 1.05,
      "turn": 0.87,
      "fire": 1.3,
      "scale": 1.1,
      "id": "spad_sa2",
      "year": 1915,
      "faction": "entente",
      "comparisonExistingId": "vickers_fb5",
      "note": "Forward gunner nacelle; not SPAD XIII and not rear-gunner weapon.",
      "roleSummary": "Two-seat fighter/reconnaissance aircraft with forward gunner nacelle",
      "weaponMounts": [
        {
          "x": 144,
          "y": 49,
          "direction": "forward",
          "evidence": "observed"
        }
      ],
      "bombOrigin": {
        "x": 144,
        "y": 145
      },
      "bombOriginEvidence": "underside origin inferred; top-view hardware not visible",
      "flightRole": "recon",
      "bombLoad": 0
    }
  ],
  [
    "bank_sea_porte_baby",
    {
      "conceptId": "10",
      "newAirframe": true,
      "name": "Porte Baby",
      "ko": "포르테 베이비",
      "crewCount": null,
      "scorePolicy": "existing-enemy-type",
      "role": "sea-bomber",
      "base": "macchi_m3",
      "speed": 0.68,
      "hp": 2.8,
      "turn": 0.43,
      "fire": 1.42,
      "scale": 1.9,
      "id": "porte_baby",
      "year": 1916,
      "faction": "entente",
      "comparisonExistingId": "hp_o400",
      "note": "Large flying boat; compare Felixstowe family; preserve closed cabin. Closed cabin: crewCount is unknown here, not zero persons.",
      "roleSummary": "Maritime bomber / torpedo aircraft",
      "visibleCrewCount": 0,
      "weaponMounts": [],
      "bombOrigin": {
        "x": 144,
        "y": 155
      },
      "bombOriginEvidence": "underside origin inferred; top-view hardware not visible",
      "flightRole": "sea-bomber",
      "bombLoad": 1
    }
  ],
  [
    "bank_ace_bolle_fokkerd7",
    {
      "conceptId": "11",
      "newAirframe": false,
      "name": "Bolle - Fokker D.VII",
      "ko": "볼레 - 포커 D.VII",
      "crewCount": 1,
      "scorePolicy": "existing-enemy-type",
      "id": "bolle_fokkerd7",
      "family": "fokkerd7",
      "paint": "bolle_fokkerd7",
      "faction": "central",
      "role": "fighter",
      "base": "fokkerd7",
      "scale": 1,
      "speed": 1,
      "hp": 1,
      "turn": 1,
      "fire": 1,
      "encounterTypes": [
        "hunter"
      ],
      "year": 1918,
      "comparisonExistingId": "fokkerd7",
      "note": "Personal livery only; existing family handling and size, no pilot ability or player loadout changes.",
      "roleSummary": "Single-seat scout / fighter",
      "flightRole": "named-enemy-hunter-livery; original family combat profile"
    }
  ],
  [
    "bank_ace_slade_spad",
    {
      "conceptId": "12",
      "newAirframe": false,
      "name": "Slade - SPAD",
      "ko": "슬레이드 - 스파드",
      "crewCount": 1,
      "scorePolicy": "existing-enemy-type",
      "id": "slade_spad",
      "family": "spad13",
      "paint": "slade_spad",
      "faction": "entente",
      "role": "fighter",
      "base": "spad",
      "scale": 1,
      "speed": 1,
      "hp": 1,
      "turn": 1,
      "fire": 1,
      "encounterTypes": [
        "hunter"
      ],
      "year": 1918,
      "comparisonExistingId": "spad13",
      "note": "Personal livery only; existing family handling and size, no pilot ability or player loadout changes.",
      "roleSummary": "Single-seat scout / fighter",
      "flightRole": "named-enemy-hunter-livery; original family combat profile"
    }
  ],
  [
    "bank_plane_roland_dii",
    {
      "conceptId": "13",
      "newAirframe": true,
      "name": "Roland D.II",
      "ko": "롤란트 D.II",
      "crewCount": 1,
      "scorePolicy": "existing-enemy-type",
      "role": "fighter",
      "base": "albatros",
      "speed": 0.99,
      "hp": 1.06,
      "turn": 0.93,
      "fire": 1.0,
      "scale": 0.99,
      "id": "roland_dii",
      "year": 1917,
      "faction": "central",
      "comparisonExistingId": "albatros_d3",
      "note": "Distinct D.II, not existing Roland C.II or D.VI.",
      "roleSummary": "Single-seat scout / fighter",
      "weaponMounts": [
        {
          "x": 144,
          "y": 91,
          "direction": "forward",
          "evidence": "inferred"
        }
      ],
      "bombOrigin": {
        "x": 144,
        "y": 160
      },
      "bombOriginEvidence": "underside origin inferred; top-view hardware not visible",
      "flightRole": "fighter",
      "bombLoad": 0
    }
  ],
  [
    "bank_plane_gotha_gi",
    {
      "conceptId": "14",
      "newAirframe": true,
      "name": "Gotha G.I",
      "ko": "고타 G.I",
      "crewCount": 2,
      "scorePolicy": "existing-enemy-type",
      "role": "bomber",
      "base": "gotha",
      "speed": 0.68,
      "hp": 1.8,
      "turn": 0.58,
      "fire": 1.42,
      "scale": 1.47,
      "id": "gotha_gi",
      "year": 1915,
      "faction": "central",
      "comparisonExistingId": "caproni_ca3",
      "note": "Early G.I, not G.IV/G.V; smaller and less durable than late heavies.",
      "roleSummary": "Land bomber",
      "weaponMounts": [
        {
          "x": 144,
          "y": 53,
          "direction": "forward",
          "evidence": "observed"
        }
      ],
      "bombOrigin": {
        "x": 144,
        "y": 145
      },
      "bombOriginEvidence": "underside origin inferred; top-view hardware not visible",
      "flightRole": "bomber",
      "bombLoad": 1
    }
  ],
  [
    "bank_ace_bohning_albatros",
    {
      "conceptId": "15",
      "newAirframe": false,
      "name": "Böhning - Albatros",
      "ko": "뵈닝 - 알바트로스",
      "crewCount": 1,
      "scorePolicy": "existing-enemy-type",
      "id": "bohning_albatros",
      "family": "albatros_d5a",
      "paint": "bohning_albatros",
      "faction": "central",
      "role": "fighter",
      "base": "albatros",
      "scale": 1,
      "speed": 1,
      "hp": 1,
      "turn": 1,
      "fire": 1,
      "encounterTypes": [
        "hunter"
      ],
      "year": 1917,
      "comparisonExistingId": "albatros_d5a",
      "note": "Personal livery only; existing family handling and size, no pilot ability or player loadout changes. 기수 수정 최종본 v3",
      "roleSummary": "Single-seat scout / fighter",
      "flightRole": "named-enemy-hunter-livery; original family combat profile"
    }
  ],
  [
    "bank_ace_beamish_camel",
    {
      "conceptId": "16",
      "newAirframe": false,
      "name": "Beamish - Sopwith Camel",
      "ko": "비미시 - 소프위드 카멜",
      "crewCount": 1,
      "scorePolicy": "existing-enemy-type",
      "id": "beamish_camel",
      "family": "camel",
      "paint": "beamish_camel",
      "faction": "entente",
      "role": "fighter",
      "base": "camel",
      "scale": 1,
      "speed": 1,
      "hp": 1,
      "turn": 1,
      "fire": 1,
      "encounterTypes": [
        "hunter"
      ],
      "year": 1918,
      "comparisonExistingId": "camel",
      "note": "Personal livery only; existing family handling and size, no pilot ability or player loadout changes.",
      "roleSummary": "Single-seat scout / fighter",
      "flightRole": "named-enemy-hunter-livery; original family combat profile"
    }
  ],
  [
    "bank_sea_hanriot_hd2",
    {
      "conceptId": "17",
      "newAirframe": true,
      "name": "Hanriot HD.2",
      "ko": "앙리오 HD.2",
      "crewCount": 1,
      "scorePolicy": "existing-enemy-type",
      "role": "sea-fighter",
      "base": "nieuport",
      "speed": 0.94,
      "hp": 0.95,
      "turn": 1.0,
      "fire": 1.12,
      "scale": 1.04,
      "id": "hanriot_hd2",
      "year": 1917,
      "faction": "entente",
      "comparisonExistingId": "sopwith_baby",
      "note": "Floatplane variant, distinct from land Hanriot HD.1.",
      "roleSummary": "Floatplane fighter",
      "weaponMounts": [
        {
          "x": 144,
          "y": 73,
          "direction": "forward",
          "evidence": "observed"
        }
      ],
      "bombOrigin": {
        "x": 144,
        "y": 158
      },
      "bombOriginEvidence": "underside origin inferred; top-view hardware not visible",
      "flightRole": "sea-fighter",
      "bombLoad": 0
    }
  ],
  [
    "bank_plane_sopwith_cuckoo",
    {
      "conceptId": "18",
      "newAirframe": true,
      "name": "Sopwith Cuckoo",
      "ko": "소프위드 쿠쿠",
      "crewCount": 1,
      "scorePolicy": "existing-enemy-type",
      "role": "sea-bomber",
      "base": "re8",
      "speed": 0.87,
      "hp": 1.23,
      "turn": 0.79,
      "fire": 1.4,
      "scale": 1.16,
      "id": "sopwith_cuckoo",
      "year": 1918,
      "faction": "entente",
      "comparisonExistingId": "short_184",
      "landingType": "landplane",
      "seaOnly": true,
      "noWWICombat": true,
      "note": "Torpedo landplane: naval context but not floatplane. historicalCombat:false. Do not claim historical forward MG; generic fire is game adaptation. 제1차 세계대전 실전 참가 없음 Existing bomb-zone gameplay adaptation; no new torpedo simulation.",
      "historicalCombat": false,
      "roleSummary": "Maritime bomber / torpedo aircraft",
      "weaponMounts": [],
      "bombOrigin": {
        "x": 144,
        "y": 154
      },
      "bombOriginEvidence": "underside origin inferred; top-view hardware not visible",
      "flightRole": "naval-torpedo-role-with-existing-bomb-zone-adaptation",
      "bombLoad": 1
    }
  ],
  [
    "bank_ace_michetti_hanriot",
    {
      "conceptId": "19",
      "newAirframe": false,
      "name": "Michetti - Hanriot",
      "ko": "미케티 - 앙리오",
      "crewCount": 1,
      "scorePolicy": "existing-enemy-type",
      "id": "michetti_hanriot",
      "family": "hanriot",
      "paint": "michetti_hanriot",
      "faction": "entente",
      "role": "fighter",
      "base": "nieuport",
      "scale": 0.96,
      "speed": 1,
      "hp": 1,
      "turn": 1,
      "fire": 1,
      "encounterTypes": [
        "hunter"
      ],
      "year": 1918,
      "comparisonExistingId": "hanriot",
      "note": "Personal livery only; existing family handling and size, no pilot ability or player loadout changes.",
      "roleSummary": "Single-seat scout / fighter",
      "flightRole": "named-enemy-hunter-livery; original family combat profile"
    }
  ],
  [
    "bank_ace_chambers_spad",
    {
      "conceptId": "20",
      "newAirframe": false,
      "name": "Chambers - SPAD",
      "ko": "체임버스 - 스파드",
      "crewCount": 1,
      "scorePolicy": "existing-enemy-type",
      "id": "chambers_spad",
      "family": "spad13",
      "paint": "chambers_spad",
      "faction": "entente",
      "role": "fighter",
      "base": "spad",
      "scale": 1,
      "speed": 1,
      "hp": 1,
      "turn": 1,
      "fire": 1,
      "encounterTypes": [
        "hunter"
      ],
      "year": 1919,
      "comparisonExistingId": "spad13",
      "note": "Personal livery only; existing family handling and size, no pilot ability or player loadout changes. Postwar 1919 markings; nonhistorical endless encounters only. 제1차 세계대전 종전 이후",
      "historicalCombat": false,
      "endlessFromYear": 1918,
      "endlessAfter": 210,
      "roleSummary": "Single-seat scout / fighter",
      "flightRole": "named-enemy-hunter-livery; original family combat profile"
    }
  ],
  [
    "bank_plane_caproni_ca5",
    {
      "conceptId": "21",
      "newAirframe": true,
      "name": "Caproni Ca.5",
      "ko": "카프로니 Ca.5",
      "crewCount": 2,
      "scorePolicy": "existing-enemy-type",
      "role": "bomber",
      "base": "gotha",
      "speed": 0.78,
      "hp": 3.1,
      "turn": 0.47,
      "fire": 1.31,
      "scale": 1.88,
      "id": "caproni_ca5",
      "year": 1918,
      "faction": "entente",
      "comparisonExistingId": "caproni_ca3",
      "note": "Distinct Ca.5; modest upgrade vs existing Ca.3, not duplicate.",
      "roleSummary": "Land bomber",
      "weaponMounts": [
        {
          "x": 144,
          "y": 144,
          "direction": "aft",
          "evidence": "observed"
        }
      ],
      "bombOrigin": {
        "x": 144,
        "y": 139
      },
      "bombOriginEvidence": "underside origin inferred; top-view hardware not visible",
      "flightRole": "bomber",
      "bombLoad": 1
    }
  ],
  [
    "bank_plane_martinsyde_s1",
    {
      "conceptId": "22",
      "newAirframe": true,
      "name": "Martinsyde S.1",
      "ko": "마틴사이드 S.1",
      "crewCount": 1,
      "scorePolicy": "existing-enemy-type",
      "role": "fighter",
      "base": "airco_dh2",
      "speed": 0.78,
      "hp": 0.85,
      "turn": 0.95,
      "fire": 1.32,
      "scale": 1.0,
      "id": "martinsyde_s1",
      "year": 1915,
      "faction": "entente",
      "comparisonExistingId": "vickers_fb5",
      "note": "Early scout; conservative lower speed and longer firing interval.",
      "roleSummary": "Single-seat scout / fighter",
      "weaponMounts": [
        {
          "x": 144,
          "y": 75,
          "direction": "forward",
          "evidence": "observed"
        }
      ],
      "bombOrigin": {
        "x": 144,
        "y": 152
      },
      "bombOriginEvidence": "underside origin inferred; top-view hardware not visible",
      "flightRole": "fighter",
      "bombLoad": 0
    }
  ],
  [
    "bank_ace_hippert_fokkerd7",
    {
      "conceptId": "23",
      "newAirframe": false,
      "name": "Hippert - Fokker D.VII",
      "ko": "히페르트 - 포커 D.VII",
      "crewCount": 1,
      "scorePolicy": "existing-enemy-type",
      "id": "hippert_fokkerd7",
      "family": "fokkerd7",
      "paint": "hippert_fokkerd7",
      "faction": "central",
      "role": "fighter",
      "base": "fokkerd7",
      "scale": 1,
      "speed": 1,
      "hp": 1,
      "turn": 1,
      "fire": 1,
      "encounterTypes": [
        "hunter"
      ],
      "year": 1919,
      "comparisonExistingId": "fokkerd7",
      "note": "Personal livery only; existing family handling and size, no pilot ability or player loadout changes. Postwar 1919 markings; nonhistorical endless encounters only. 제1차 세계대전 종전 이후",
      "historicalCombat": false,
      "endlessFromYear": 1918,
      "endlessAfter": 210,
      "roleSummary": "Single-seat scout / fighter",
      "flightRole": "named-enemy-hunter-livery; original family combat profile"
    }
  ],
  [
    "bank_ace_auffarth_fokkerd7",
    {
      "conceptId": "24",
      "newAirframe": false,
      "name": "Auffarth - Fokker D.VII",
      "ko": "아우파르트 - 포커 D.VII",
      "crewCount": 1,
      "scorePolicy": "existing-enemy-type",
      "id": "auffarth_fokkerd7",
      "family": "fokkerd7",
      "paint": "auffarth_fokkerd7",
      "faction": "central",
      "role": "fighter",
      "base": "fokkerd7",
      "scale": 1,
      "speed": 1,
      "hp": 1,
      "turn": 1,
      "fire": 1,
      "encounterTypes": [
        "hunter"
      ],
      "year": 1918,
      "comparisonExistingId": "fokkerd7",
      "note": "Personal livery only; existing family handling and size, no pilot ability or player loadout changes. 녹색 날개는 재구성 표현",
      "roleSummary": "Single-seat scout / fighter",
      "flightRole": "named-enemy-hunter-livery; original family combat profile"
    }
  ],
  [
    "bank_plane_farman_mf11",
    {
      "conceptId": "25",
      "newAirframe": true,
      "name": "Farman MF.11",
      "ko": "파르망 MF.11",
      "crewCount": 2,
      "scorePolicy": "existing-enemy-type",
      "role": "recon",
      "base": "caudron_g4",
      "speed": 0.72,
      "hp": 1.18,
      "turn": 0.78,
      "fire": 1.38,
      "scale": 1.24,
      "id": "farman_mf11",
      "year": 1914,
      "faction": "entente",
      "comparisonExistingId": "farman_f40",
      "note": "Do not copy F40 current unusually large hp2.15/scale1.52 blindly.",
      "roleSummary": "Reconnaissance aircraft",
      "weaponMounts": [
        {
          "x": 144,
          "y": 54,
          "direction": "forward",
          "evidence": "observed"
        }
      ],
      "bombOrigin": {
        "x": 144,
        "y": 113
      },
      "bombOriginEvidence": "underside origin inferred; top-view hardware not visible",
      "flightRole": "recon",
      "bombLoad": 0
    }
  ],
  [
    "bank_plane_phonix_dii",
    {
      "conceptId": "26",
      "newAirframe": true,
      "name": "Phönix D.II",
      "ko": "푀닉스 D.II",
      "crewCount": 1,
      "scorePolicy": "existing-enemy-type",
      "role": "fighter",
      "base": "phonix_d1",
      "speed": 1.02,
      "hp": 1.16,
      "turn": 1.01,
      "fire": 1.0,
      "scale": 0.98,
      "id": "phonix_dii",
      "year": 1918,
      "faction": "central",
      "comparisonExistingId": "phoenix_d1",
      "note": "D.II variant rather than D.I repaint; modest tuning delta.",
      "roleSummary": "Single-seat scout / fighter",
      "weaponMounts": [
        {
          "x": 136,
          "y": 94,
          "direction": "forward",
          "evidence": "observed"
        },
        {
          "x": 152,
          "y": 94,
          "direction": "forward",
          "evidence": "observed"
        }
      ],
      "bombOrigin": {
        "x": 144,
        "y": 161
      },
      "bombOriginEvidence": "underside origin inferred; top-view hardware not visible",
      "flightRole": "fighter",
      "bombLoad": 0
    }
  ],
  [
    "bank_ace_chavannes_spad13",
    {
      "conceptId": "27",
      "newAirframe": false,
      "name": "Chavannes - SPAD XIII",
      "ko": "샤반 - 스파드 XIII",
      "crewCount": 1,
      "scorePolicy": "existing-enemy-type",
      "id": "chavannes_spad13",
      "family": "spad13",
      "paint": "chavannes_spad13",
      "faction": "entente",
      "role": "fighter",
      "base": "spad",
      "scale": 1,
      "speed": 1,
      "hp": 1,
      "turn": 1,
      "fire": 1,
      "encounterTypes": [
        "hunter"
      ],
      "year": 1918,
      "comparisonExistingId": "spad13",
      "note": "Personal livery only; existing family handling and size, no pilot ability or player loadout changes. 거미 표식 기반 · 정밀 복원 아님",
      "roleSummary": "Single-seat scout / fighter",
      "flightRole": "named-enemy-hunter-livery; original family combat profile"
    }
  ],
  [
    "bank_ace_konnecke_albatros",
    {
      "conceptId": "28",
      "newAirframe": false,
      "name": "Könnecke - Albatros D.V",
      "ko": "쾨네케 - 알바트로스 D.V",
      "crewCount": 1,
      "scorePolicy": "existing-enemy-type",
      "id": "konnecke_albatros",
      "family": "albatros_d5a",
      "paint": "konnecke_albatros",
      "faction": "central",
      "role": "fighter",
      "base": "albatros",
      "scale": 1,
      "speed": 1,
      "hp": 1,
      "turn": 1,
      "fire": 1,
      "encounterTypes": [
        "hunter"
      ],
      "year": 1917,
      "comparisonExistingId": "albatros_d5a",
      "note": "Personal livery only; existing family handling and size, no pilot ability or player loadout changes. 붉은 셰브런의 정확한 색조는 재구성",
      "roleSummary": "Single-seat scout / fighter",
      "flightRole": "named-enemy-hunter-livery; original family combat profile"
    }
  ],
  [
    "bank_plane_siemens_schuckert_di",
    {
      "conceptId": "29",
      "newAirframe": true,
      "name": "Siemens-Schuckert D.I",
      "ko": "지멘스-슈케르트 D.I",
      "crewCount": 1,
      "scorePolicy": "existing-enemy-type",
      "role": "fighter",
      "base": "nieuport",
      "speed": 0.89,
      "hp": 0.87,
      "turn": 1.09,
      "fire": 1.2,
      "scale": 0.9,
      "id": "siemens_schuckert_di",
      "year": 1917,
      "faction": "central",
      "comparisonExistingId": "nieuport_11_bebe",
      "note": "Early D.I, not existing D.III/D.IV late fighters. 일반 전시 도색 재구성",
      "roleSummary": "Single-seat scout / fighter",
      "weaponMounts": [
        {
          "x": 144,
          "y": 71,
          "direction": "forward",
          "evidence": "observed"
        }
      ],
      "bombOrigin": {
        "x": 144,
        "y": 148
      },
      "bombOriginEvidence": "underside origin inferred; top-view hardware not visible",
      "flightRole": "fighter",
      "bombLoad": 0
    }
  ],
  [
    "bank_sea_donnet_denhaut_dd8",
    {
      "conceptId": "30",
      "newAirframe": true,
      "name": "Donnet-Denhaut D.D.8",
      "ko": "도네-덴오 D.D.8",
      "crewCount": 3,
      "scorePolicy": "existing-enemy-type",
      "role": "sea-recon",
      "base": "macchi_m3",
      "speed": 0.78,
      "hp": 1.34,
      "turn": 0.8,
      "fire": 1.27,
      "scale": 1.31,
      "id": "donnet_denhaut_dd8",
      "year": 1917,
      "faction": "entente",
      "comparisonExistingId": "fba_h",
      "note": "Three-seat patrol flying boat; slightly heavier than FBA H. 3인승 · 일반 전시 도색 재구성",
      "roleSummary": "Maritime reconnaissance flying boat",
      "weaponMounts": [
        {
          "x": 144,
          "y": 59,
          "direction": "forward",
          "evidence": "observed"
        },
        {
          "x": 144,
          "y": 188,
          "direction": "aft",
          "evidence": "observed"
        }
      ],
      "bombOrigin": {
        "x": 144,
        "y": 118
      },
      "bombOriginEvidence": "underside origin inferred; top-view hardware not visible",
      "flightRole": "sea-recon",
      "bombLoad": 0
    }
  ],
  [
    "bank_ace_neckel_fokkerd7",
    {
      "conceptId": "31",
      "newAirframe": false,
      "name": "Ulrich Neckel — Fokker D.VII (OAW)",
      "ko": "울리히 네켈 — 포커 D.VII",
      "crewCount": 1,
      "scorePolicy": "existing-enemy-type",
      "id": "neckel_fokkerd7",
      "family": "fokkerd7",
      "paint": "neckel_fokkerd7",
      "faction": "central",
      "role": "fighter",
      "base": "fokkerd7",
      "scale": 1,
      "speed": 1,
      "hp": 1,
      "turn": 1,
      "fire": 1,
      "encounterTypes": [
        "hunter"
      ],
      "year": 1918,
      "comparisonExistingId": "fokkerd7",
      "note": "Personal livery only; existing family handling and size, no pilot ability or player loadout changes. 제조사 도색 자료 기반 색상 재구성",
      "roleSummary": "Single-seat scout / fighter",
      "flightRole": "named-enemy-hunter-livery; original family combat profile"
    }
  ],
  [
    "bank_ace_navratil_oeffag",
    {
      "conceptId": "32",
      "newAirframe": false,
      "name": "Friedrich Navratil — Albatros D.III (Oeffag) 253.116",
      "ko": "프리드리히 나브라틸 — 알바트로스 D.III",
      "crewCount": 1,
      "scorePolicy": "existing-enemy-type",
      "id": "navratil_oeffag",
      "family": "albatros_oeffag",
      "paint": "navratil_oeffag",
      "faction": "central",
      "role": "fighter",
      "base": "albatros",
      "scale": 1,
      "speed": 1,
      "hp": 1,
      "turn": 1,
      "fire": 1,
      "encounterTypes": [
        "hunter"
      ],
      "year": 1918,
      "comparisonExistingId": "albatros_oeffag",
      "note": "Personal livery only; existing family handling and size, no pilot ability or player loadout changes. 녹색·갈색 얼룩 색상 재구성",
      "roleSummary": "Single-seat scout / fighter",
      "flightRole": "named-enemy-hunter-livery; original family combat profile"
    }
  ]
];
export const CONCEPT_AIRFRAMES=Object.freeze(Object.fromEntries(rows.map(([key,fit])=>[key,Object.freeze({...fit,...fit.encounterTypes?{encounterTypes:Object.freeze(fit.encounterTypes)}:{}})])));
export const CONCEPT_ART_ROWS=Object.freeze([
  {
    "key": "bank_plane_morane_type_n",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/01.webp",
    "conceptId": "01",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_plane_fokker_dii",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/02.webp",
    "conceptId": "02",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_plane_farman_f50",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/03.webp",
    "conceptId": "03",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_plane_short_bomber",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/04.webp",
    "conceptId": "04",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_ace_stark_fokkerd7",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/05.webp",
    "conceptId": "05",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_ace_klimke_dr1",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/06.webp",
    "conceptId": "06",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_ace_buchner_fokkerd7",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/07.webp",
    "conceptId": "07",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_ace_cobby_camel",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/08.webp",
    "conceptId": "08",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_plane_spad_sa2",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/09.webp",
    "conceptId": "09",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_sea_porte_baby",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/10.webp",
    "conceptId": "10",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_ace_bolle_fokkerd7",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/11.webp",
    "conceptId": "11",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_ace_slade_spad",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/12.webp",
    "conceptId": "12",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_plane_roland_dii",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/13.webp",
    "conceptId": "13",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_plane_gotha_gi",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/14.webp",
    "conceptId": "14",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_ace_bohning_albatros",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/15.webp",
    "conceptId": "15",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_ace_beamish_camel",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/16.webp",
    "conceptId": "16",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_sea_hanriot_hd2",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/17.webp",
    "conceptId": "17",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_plane_sopwith_cuckoo",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/18.webp",
    "conceptId": "18",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_ace_michetti_hanriot",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/19.webp",
    "conceptId": "19",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_ace_chambers_spad",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/20.webp",
    "conceptId": "20",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_plane_caproni_ca5",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/21.webp",
    "conceptId": "21",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_plane_martinsyde_s1",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/22.webp",
    "conceptId": "22",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_ace_hippert_fokkerd7",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/23.webp",
    "conceptId": "23",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_ace_auffarth_fokkerd7",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/24.webp",
    "conceptId": "24",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_plane_farman_mf11",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/25.webp",
    "conceptId": "25",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_plane_phonix_dii",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/26.webp",
    "conceptId": "26",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_ace_chavannes_spad13",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/27.webp",
    "conceptId": "27",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_ace_konnecke_albatros",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/28.webp",
    "conceptId": "28",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_plane_siemens_schuckert_di",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/29.webp",
    "conceptId": "29",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_sea_donnet_denhaut_dd8",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/30.webp",
    "conceptId": "30",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_ace_neckel_fokkerd7",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/31.webp",
    "conceptId": "31",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  },
  {
    "key": "bank_ace_navratil_oeffag",
    "path": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/flight/concepts-20261026/32.webp",
    "conceptId": "32",
    "x": 0,
    "y": 0,
    "w": 288,
    "h": 320
  }
].map(Object.freeze));
export const CONCEPT_NEW_COUNT=16;

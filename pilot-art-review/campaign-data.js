// Source: docs/campaign/headon_campaign_patch.json. Preserve historical fields.
export const CAMPAIGN_DATA = {
  "schemaVersion": 1,
  "project": "HEAD-ON · 에이스의 하늘",
  "purpose": "implementation-ready WWI campaign data patch for transfer to another ChatGPT Work",
  "authoritativeRule": "When this package conflicts with an older build, newest confirmed project instructions win. Do not invent missing numeric balance values.",
  "globalRules": {
    "campaignMode": {
      "coexistsWithEndless": true,
      "modeIds": [
        "endless",
        "campaign"
      ],
      "stageCount": 20,
      "factions": {
        "allies": 10,
        "central": 10
      },
      "historicalSortie": "uses stage default aircraft",
      "freeSortie": "recommended unlock after first clear; faction-compatible unlocked aircraft/pilot"
    },
    "combat": {
      "autoFire": true,
      "machineGunDisplayName": "Spandau LMG 08/15",
      "separateLeftRightAmmo": true,
      "reloadKeyKnownFromCurrentHud": "R",
      "evasionUiLabelFinal": "선회기동",
      "missile": {
        "guided": false,
        "behavior": "straight_line_from_firing_heading"
      },
      "ultimateCooldown": {
        "minimumCooldownFloorRequired": true,
        "minimumCooldownSeconds": null,
        "note": "exact floor must be chosen after reading current source balance; invulnerability ultimates need reduced cooldown-reduction efficiency"
      },
      "lowHpSpeedPenalty": false,
      "levelUpHealingRemoved": true,
      "fieldRepairPickupVisual": "wrench_or_gear_pixel_art"
    },
    "augments": {
      "wingman": {
        "rarity": "unique",
        "addPerPick": 1
      },
      "friendlyBomberSupport": {
        "rarity": "unique",
        "intervalSeconds": null
      },
      "turnRateAugment": "strongly_nerfed_from_old_build",
      "synergyWorkRemaining": [
        "machine_gun",
        "missile",
        "mine",
        "wingman",
        "pilot_trait"
      ]
    },
    "artAndFaction": {
      "genericRedFokkerDrIAllowed": false,
      "redFokkerDrIReservedFor": "Manfred von Richthofen",
      "goringFormationColor": "white",
      "centralPlayerEnemyAirship": "allied_marked_variant",
      "zeppelinDeathCreatesFastGust": true,
      "antiAircraftArt": "top_view_pixel_sprite",
      "hudIcons": "WWI_aircraft_style_pixel_icons",
      "boelckeSkillIcon": "flight_manual_pixel_icon"
    }
  },
  "aceOverrides": {
    "Manfred von Richthofen": {
      "aircraft": "Fokker Dr.I",
      "skin": "red_reserved",
      "note": "generic red Fokker Dr.I must never spawn"
    },
    "Ernst Udet": {
      "aircraft": "Fokker D.VIII",
      "skin": "red_white_top_LO",
      "ultimate": {
        "name": "무모한 기동술",
        "hpCostPercent": 10,
        "durationSeconds": null,
        "effects": [
          "movement_speed_major_up",
          "fire_rate_major_up"
        ]
      }
    },
    "Hermann Goring": {
      "formation": {
        "allWingmenWhite": true
      },
      "role": "commander_wingman"
    },
    "Francesco Baracca": {
      "aircraft": "silver Nieuport 17",
      "ultimate": "black_prancing_horse_diagonal_sweep",
      "vfxRule": "direction_independent_or_fixed_direction_to_avoid_sprite_distortion"
    },
    "Georges Guynemer": {
      "aircraft": "yellow SPAD 12",
      "ultimate": "white_stork_field_strike",
      "vfxRule": "direction_independent_or_fixed_direction_to_avoid_sprite_distortion"
    },
    "Billy Bishop": {
      "afterUltimate": {
        "leftAmmo": 0,
        "rightAmmo": 0
      }
    },
    "Oswald Boelcke": {
      "skillIcon": "flight_manual_pixel_icon"
    },
    "Max Immelmann": {
      "aircraft": "Fokker Eindecker"
    }
  },
  "stages": [
    {
      "id": "A-01",
      "faction": "allies",
      "displayFaction": "협상국",
      "chapter": "I",
      "title": "정찰기의 시대",
      "historicalAnchorDate": "1915-04-22",
      "historicalEvent": "제2차 이프르 전투",
      "region": "플랑드르, 벨기에",
      "defaultAircraft": "BE.2c",
      "enemyDisplayPool": [
        "Fokker E.I",
        "Aviatik C.I"
      ],
      "sourceMission": "사진정찰 후 귀환",
      "sourceGimmick": "고정총이 없는 상태에서 구름과 고도를 이용",
      "sourceAceBoss": "Fokker E.I 편대",
      "sourceVictory": "정찰사진 3구역 확보",
      "sourceType": "초기전",
      "difficulty": 1,
      "recommendedDurationSec": 210,
      "targetLevelUpCount": 3,
      "augmentEmphasis": [
        "기동",
        "생존"
      ],
      "environment": [
        "구름 은폐",
        "낮은 고도"
      ],
      "phases": [
        {
          "atProgress": 0.0,
          "description": "정찰구역 1: 카메라 튜토리얼"
        },
        {
          "atProgress": 0.35,
          "description": "2·3구역: Fokker 추격 증가"
        },
        {
          "atProgress": 0.7,
          "description": "귀환선 생성, 추격 편대 1회"
        }
      ],
      "aceBossBehavior": "보스 없음. Fokker E.I 편대가 추격자 역할",
      "failureCondition": "BE.2c 격추 또는 정찰구역 3개를 제한시간 내 확보 실패",
      "reuseSystems": [
        "조종",
        "회피",
        "타이머",
        "적 스폰"
      ],
      "requiredHooks": [
        "photoZone",
        "cloudConceal",
        "weaponDisable"
      ],
      "rewardCandidate": "Airco DH.2 해금 후보",
      "randomizationPool": [
        "정찰구역 위치",
        "구름대 위치",
        "추격 편대 진입 방향"
      ],
      "implementationNote": "Keep the historical source fields as presentation/reference. Gameplay phase/balance fields are game-design additions."
    },
    {
      "id": "A-02",
      "faction": "allies",
      "displayFaction": "협상국",
      "chapter": "I",
      "title": "포커의 재앙",
      "historicalAnchorDate": "1915-10-01",
      "historicalEvent": "Fokker Scourge",
      "region": "서부전선",
      "defaultAircraft": "Airco DH.2",
      "enemyDisplayPool": [
        "Fokker E.III"
      ],
      "sourceMission": "아군 정찰기 호위",
      "sourceGimmick": "정면 사격 가능한 단엽기가 추격",
      "sourceAceBoss": "막스 이멜만",
      "sourceVictory": "호위기 1대 이상 생존",
      "sourceType": "요격/호위",
      "difficulty": 2,
      "recommendedDurationSec": 240,
      "targetLevelUpCount": 4,
      "augmentEmphasis": [
        "기관총",
        "기동"
      ],
      "environment": [
        "구름대",
        "산발적 대공포"
      ],
      "phases": [
        {
          "atProgress": 0.0,
          "description": "호위 정찰기 2기와 출발"
        },
        {
          "atProgress": 0.35,
          "description": "Fokker E.III 3개 파동"
        },
        {
          "atProgress": 0.7,
          "description": "70% 시점 막스 이멜만 난입"
        }
      ],
      "aceBossBehavior": "막스 이멜만: 직선 교차 → Immelmann 반전 → 재진입. 체력 35% 이하 공격 간격 단축",
      "failureCondition": "호위 정찰기 전멸",
      "reuseSystems": [
        "자동사격",
        "재장전",
        "에이스 AI"
      ],
      "requiredHooks": [
        "escortTarget",
        "aceEntry"
      ],
      "rewardCandidate": "Nieuport 11 해금 후보",
      "randomizationPool": [
        "호위기 수",
        "적 파동 각도",
        "이멜만 난입 시점 ±15초"
      ],
      "implementationNote": "Keep the historical source fields as presentation/reference. Gameplay phase/balance fields are game-design additions."
    },
    {
      "id": "A-03",
      "faction": "allies",
      "displayFaction": "협상국",
      "chapter": "II",
      "title": "베르됭 상공",
      "historicalAnchorDate": "1916-02-21",
      "historicalEvent": "베르됭 전투",
      "region": "베르됭, 프랑스",
      "defaultAircraft": "Nieuport 11",
      "enemyDisplayPool": [
        "Fokker E.III",
        "Albatros D.I"
      ],
      "sourceMission": "관측기 차단과 제공권 확보",
      "sourceGimmick": "포격 연기와 대공포 탄막",
      "sourceAceBoss": "오스왈드 뵐케",
      "sourceVictory": "관측기 6대 격추",
      "sourceType": "제공권",
      "difficulty": 2,
      "recommendedDurationSec": 240,
      "targetLevelUpCount": 4,
      "augmentEmphasis": [
        "화력",
        "정밀사격"
      ],
      "environment": [
        "대공포 탄막",
        "포격 연기"
      ],
      "phases": [
        {
          "atProgress": 0.0,
          "description": "관측기 2기 탐색"
        },
        {
          "atProgress": 0.35,
          "description": "대공포 밀집구역 + 관측기 2기"
        },
        {
          "atProgress": 0.7,
          "description": "뵐케 엄호 편대 + 관측기 2기"
        }
      ],
      "aceBossBehavior": "오스왈드 뵐케: 지휘형. 동반 적기 명중/집결 버프, 마지막 관측기를 엄호",
      "failureCondition": "시간 종료 전에 관측기 6기 격추 실패",
      "reuseSystems": [
        "대공포",
        "에이스",
        "편대"
      ],
      "requiredHooks": [
        "observerPriority",
        "commanderAura"
      ],
      "rewardCandidate": "Nieuport 17 해금 후보",
      "randomizationPool": [
        "관측기 고도",
        "대공포 안전회랑",
        "뵐케 편대 수"
      ],
      "implementationNote": "Keep the historical source fields as presentation/reference. Gameplay phase/balance fields are game-design additions."
    },
    {
      "id": "A-04",
      "faction": "allies",
      "displayFaction": "협상국",
      "chapter": "II",
      "title": "솜의 눈",
      "historicalAnchorDate": "1916-07-01",
      "historicalEvent": "솜 전투",
      "region": "솜, 프랑스",
      "defaultAircraft": "Sopwith 1½ Strutter",
      "enemyDisplayPool": [
        "Albatros D.II",
        "Roland C.II"
      ],
      "sourceMission": "포병 관측과 참호 촬영",
      "sourceGimmick": "포탄 폭발 지역이 이동하며 비행로를 제한",
      "sourceAceBoss": "베르너 포스",
      "sourceVictory": "정찰 지점 4곳 통과",
      "sourceType": "정찰/생존",
      "difficulty": 3,
      "recommendedDurationSec": 250,
      "targetLevelUpCount": 4,
      "augmentEmphasis": [
        "기동",
        "재장전"
      ],
      "environment": [
        "이동 포격지대",
        "연기"
      ],
      "phases": [
        {
          "atProgress": 0.0,
          "description": "정찰지점 1"
        },
        {
          "atProgress": 0.35,
          "description": "포격선이 이동하며 지점 2·3"
        },
        {
          "atProgress": 0.7,
          "description": "지점 4 후 베르너 포스 추격"
        }
      ],
      "aceBossBehavior": "베르너 포스: 격추 필수 아님. 마지막 45초 압박, 주변 적 3기 이상일 때 강화",
      "failureCondition": "정찰 지점 미통과 또는 플레이어 격추",
      "reuseSystems": [
        "위험지대",
        "에이스 추격"
      ],
      "requiredHooks": [
        "movingBarrage",
        "checkpointMission"
      ],
      "rewardCandidate": "Sopwith Pup 해금 후보",
      "randomizationPool": [
        "포격선 방향",
        "지점 위치",
        "포스 동반기 수"
      ],
      "implementationNote": "Keep the historical source fields as presentation/reference. Gameplay phase/balance fields are game-design additions."
    },
    {
      "id": "A-05",
      "faction": "allies",
      "displayFaction": "협상국",
      "chapter": "III",
      "title": "블러디 에이프릴",
      "historicalAnchorDate": "1917-04-09",
      "historicalEvent": "아라스 전투·Bloody April",
      "region": "아라스, 프랑스",
      "defaultAircraft": "Nieuport 17 / Sopwith Pup",
      "enemyDisplayPool": [
        "Albatros D.III"
      ],
      "sourceMission": "열세 속에서 정찰기 엄호",
      "sourceGimmick": "적 Jasta가 파도처럼 증원",
      "sourceAceBoss": "만프레트 폰 리히트호펜",
      "sourceVictory": "제한 시간 생존 후 이탈",
      "sourceType": "생존전",
      "difficulty": 4,
      "recommendedDurationSec": 270,
      "targetLevelUpCount": 5,
      "augmentEmphasis": [
        "생존",
        "화력",
        "윙맨"
      ],
      "environment": [
        "Jasta 증원",
        "저운고"
      ],
      "phases": [
        {
          "atProgress": 0.0,
          "description": "정찰기 엄호"
        },
        {
          "atProgress": 0.35,
          "description": "파도식 Jasta 증원"
        },
        {
          "atProgress": 0.7,
          "description": "마지막 60초 리히트호펜 + 이탈선"
        }
      ],
      "aceBossBehavior": "리히트호펜: 붉은 Dr.I 전용. 일반 빨간 Dr.I 금지. 종료 직전 이탈 방해",
      "failureCondition": "정찰기 전멸 또는 플레이어 격추",
      "reuseSystems": [
        "윙맨",
        "에이스",
        "추격"
      ],
      "requiredHooks": [
        "waveEscalation",
        "extractionZone"
      ],
      "rewardCandidate": "Sopwith Camel 해금 후보",
      "randomizationPool": [
        "Jasta 구성",
        "이탈선 위치",
        "적 진입 방향"
      ],
      "implementationNote": "Keep the historical source fields as presentation/reference. Gameplay phase/balance fields are game-design additions."
    },
    {
      "id": "A-06",
      "faction": "allies",
      "displayFaction": "협상국",
      "chapter": "III",
      "title": "플랑드르의 진흙",
      "historicalAnchorDate": "1917-07-31",
      "historicalEvent": "제3차 이프르 전투",
      "region": "파스샹달, 벨기에",
      "defaultAircraft": "Sopwith Camel",
      "enemyDisplayPool": [
        "Albatros D.V",
        "Pfalz D.III"
      ],
      "sourceMission": "저고도 지상군 지원",
      "sourceGimmick": "비·진흙·저운고, 기관총 진지 제압",
      "sourceAceBoss": "에른스트 우데트",
      "sourceVictory": "지상 표적 12개 파괴",
      "sourceType": "지상공격",
      "difficulty": 4,
      "recommendedDurationSec": 260,
      "targetLevelUpCount": 5,
      "augmentEmphasis": [
        "기관총",
        "폭격지원"
      ],
      "environment": [
        "비",
        "저운고",
        "대공포",
        "진흙 전장"
      ],
      "phases": [
        {
          "atProgress": 0.0,
          "description": "기관총 진지 4개"
        },
        {
          "atProgress": 0.35,
          "description": "대공포+진지 혼합 4개"
        },
        {
          "atProgress": 0.7,
          "description": "우데트 난입 속 진지 4개"
        }
      ],
      "aceBossBehavior": "에른스트 우데트: Fokker D.VIII + LO. '무모한 기동술' 적 버전으로 고속 패스",
      "failureCondition": "지상표적 12개 파괴 실패",
      "reuseSystems": [
        "대공포",
        "지상표적",
        "에이스"
      ],
      "requiredHooks": [
        "groundTarget",
        "lowCloudMask"
      ],
      "rewardCandidate": "S.E.5a 해금 후보",
      "randomizationPool": [
        "지상표적 종류",
        "비 강도",
        "우데트 난입 루트"
      ],
      "implementationNote": "Keep the historical source fields as presentation/reference. Gameplay phase/balance fields are game-design additions."
    },
    {
      "id": "A-07",
      "faction": "allies",
      "displayFaction": "협상국",
      "chapter": "III",
      "title": "캉브레의 강철",
      "historicalAnchorDate": "1917-11-20",
      "historicalEvent": "캉브레 전투",
      "region": "캉브레, 프랑스",
      "defaultAircraft": "Sopwith Camel / DH.5",
      "enemyDisplayPool": [
        "Albatros D.V",
        "대공포"
      ],
      "sourceMission": "전차 종대 근접지원",
      "sourceGimmick": "전차 진로를 막는 포대·기관총 진지 파괴",
      "sourceAceBoss": "리히트호펜(62번째 승리 모티프)",
      "sourceVictory": "전차 60% 이상 생존",
      "sourceType": "복합전",
      "difficulty": 4,
      "recommendedDurationSec": 280,
      "targetLevelUpCount": 5,
      "augmentEmphasis": [
        "지상공격",
        "기동"
      ],
      "environment": [
        "전차 종대",
        "대공포",
        "기관총 진지"
      ],
      "phases": [
        {
          "atProgress": 0.0,
          "description": "전차 종대 1구간"
        },
        {
          "atProgress": 0.35,
          "description": "포대 집중 2구간"
        },
        {
          "atProgress": 0.7,
          "description": "리히트호펜 교차 난입 + 마지막 구간"
        }
      ],
      "aceBossBehavior": "리히트호펜은 격추 보스보다 압박 이벤트. 역사 문구는 '62번째 승리 모티프' 수준",
      "failureCondition": "전차 생존율 60% 미만",
      "reuseSystems": [
        "대공포",
        "에이스",
        "호위"
      ],
      "requiredHooks": [
        "tankConvoy",
        "groundEmplacement"
      ],
      "rewardCandidate": "Bristol F.2B 해금 후보",
      "randomizationPool": [
        "전차 진로",
        "포대 배치",
        "리히트호펜 난입 횟수"
      ],
      "implementationNote": "Keep the historical source fields as presentation/reference. Gameplay phase/balance fields are game-design additions."
    },
    {
      "id": "A-08",
      "faction": "allies",
      "displayFaction": "협상국",
      "chapter": "IV",
      "title": "봄 공세",
      "historicalAnchorDate": "1918-03-21",
      "historicalEvent": "독일 춘계 공세",
      "region": "생캉탱, 프랑스",
      "defaultAircraft": "S.E.5a / Bristol F.2B",
      "enemyDisplayPool": [
        "Fokker Dr.I",
        "Albatros D.Va"
      ],
      "sourceMission": "후퇴 부대 엄호",
      "sourceGimmick": "이동하는 전선과 탄약 보급 지점",
      "sourceAceBoss": "게오르크 폰 한텔만",
      "sourceVictory": "수송대 3개 구간 호위",
      "sourceType": "호위/후퇴",
      "difficulty": 4,
      "recommendedDurationSec": 300,
      "targetLevelUpCount": 6,
      "augmentEmphasis": [
        "탄약",
        "속도",
        "윙맨"
      ],
      "environment": [
        "이동 전선",
        "보급 지점",
        "빠른 돌풍"
      ],
      "phases": [
        {
          "atProgress": 0.0,
          "description": "수송대 구간 1"
        },
        {
          "atProgress": 0.35,
          "description": "보급 선택 후 구간 2"
        },
        {
          "atProgress": 0.7,
          "description": "돌풍 회랑 + 구간 3"
        }
      ],
      "aceBossBehavior": "게오르크 폰 한텔만: 전용 정의가 없으면 GenericAce 템플릿 사용",
      "failureCondition": "수송대가 각 구간 도달 전에 전멸",
      "reuseSystems": [
        "돌풍",
        "호위",
        "보급"
      ],
      "requiredHooks": [
        "movingFront",
        "supplyZone"
      ],
      "rewardCandidate": "SPAD XIII 해금 후보",
      "randomizationPool": [
        "보급지점 위치",
        "돌풍 방향",
        "호위 적 편대 종류"
      ],
      "implementationNote": "Keep the historical source fields as presentation/reference. Gameplay phase/balance fields are game-design additions."
    },
    {
      "id": "A-09",
      "faction": "allies",
      "displayFaction": "협상국",
      "chapter": "IV",
      "title": "붉은 남작의 마지막 날",
      "historicalAnchorDate": "1918-04-21",
      "historicalEvent": "리히트호펜 최후의 전투",
      "region": "솜 강, 프랑스",
      "defaultAircraft": "Sopwith Camel",
      "enemyDisplayPool": [
        "Fokker Dr.I"
      ],
      "sourceMission": "저고도 추격전",
      "sourceGimmick": "강과 대공포 사격선 사이 위험한 추격",
      "sourceAceBoss": "만프레트 폰 리히트호펜",
      "sourceVictory": "보스 체력 소진 또는 생존",
      "sourceType": "에이스 결투",
      "difficulty": 5,
      "recommendedDurationSec": 210,
      "targetLevelUpCount": 3,
      "augmentEmphasis": [
        "기동",
        "정밀사격"
      ],
      "environment": [
        "강",
        "저고도",
        "대공포 사격선"
      ],
      "phases": [
        {
          "atProgress": 0.0,
          "description": "추격 진입"
        },
        {
          "atProgress": 0.35,
          "description": "대공포 사격선 교차"
        },
        {
          "atProgress": 0.7,
          "description": "리히트호펜 1대1 압박"
        }
      ],
      "aceBossBehavior": "리히트호펜: 승리 연출은 '격추 확정'이 아니라 체력 소진 또는 생존/이탈. 사망 원인 단정 금지",
      "failureCondition": "플레이어 격추",
      "reuseSystems": [
        "에이스 보스",
        "대공포"
      ],
      "requiredHooks": [
        "lowAltitudeDuel",
        "nonCanonicalDefeat"
      ],
      "rewardCandidate": "에이스 결투 챌린지 해금 후보",
      "randomizationPool": [
        "대공포 사격선",
        "강 굴곡",
        "보스 공격 순서"
      ],
      "implementationNote": "Keep the historical source fields as presentation/reference. Gameplay phase/balance fields are game-design additions."
    },
    {
      "id": "A-10",
      "faction": "allies",
      "displayFaction": "협상국",
      "chapter": "IV",
      "title": "검은 날",
      "historicalAnchorDate": "1918-08-08",
      "historicalEvent": "아미앵 전투",
      "region": "피카르디, 프랑스",
      "defaultAircraft": "Sopwith Camel / S.E.5a",
      "enemyDisplayPool": [
        "Fokker D.VII",
        "Halberstadt CL.II"
      ],
      "sourceMission": "대규모 공세 지원",
      "sourceGimmick": "안개가 걷히며 목표와 적이 동시에 증가",
      "sourceAceBoss": "헤르만 괴링",
      "sourceVictory": "지상 목표와 적기 합산 점수 달성",
      "sourceType": "최종 공세",
      "difficulty": 5,
      "recommendedDurationSec": 320,
      "targetLevelUpCount": 6,
      "augmentEmphasis": [
        "모든 빌드",
        "폭격지원"
      ],
      "environment": [
        "안개 해제",
        "폭격기",
        "대공포"
      ],
      "phases": [
        {
          "atProgress": 0.0,
          "description": "안개 속 지상목표"
        },
        {
          "atProgress": 0.35,
          "description": "안개 해제 + 적기 물량 증가"
        },
        {
          "atProgress": 0.7,
          "description": "괴링 흰 편대 + 대형 목표"
        }
      ],
      "aceBossBehavior": "헤르만 괴링: 편대 전부 흰 기체. 지휘 버프로 집결/사격 빈도 강화",
      "failureCondition": "합산 목표점수 미달 또는 플레이어 격추",
      "reuseSystems": [
        "폭격기",
        "윙맨",
        "대공포",
        "에이스"
      ],
      "requiredHooks": [
        "fogLift",
        "scoreObjective",
        "whiteGoringFormation"
      ],
      "rewardCandidate": "협상국 캠페인 클리어 / 1918 자유출격",
      "randomizationPool": [
        "안개 해제 시점",
        "폭격기 진입 방향",
        "목표 조합"
      ],
      "implementationNote": "Keep the historical source fields as presentation/reference. Gameplay phase/balance fields are game-design additions."
    },
    {
      "id": "C-01",
      "faction": "central",
      "displayFaction": "동맹국",
      "chapter": "I",
      "title": "하늘의 감시자",
      "historicalAnchorDate": "1915-04-22",
      "historicalEvent": "제2차 이프르 전투",
      "region": "플랑드르, 벨기에",
      "defaultAircraft": "Aviatik C.I",
      "enemyDisplayPool": [
        "BE.2c",
        "Morane-Saulnier L"
      ],
      "sourceMission": "정찰기 보호와 포병 관측",
      "sourceGimmick": "후방 사수 방향에 따른 사각지대 관리",
      "sourceAceBoss": "롤랑 가로스 모티프",
      "sourceVictory": "관측 구역 3곳 유지",
      "sourceType": "초기전",
      "difficulty": 1,
      "recommendedDurationSec": 220,
      "targetLevelUpCount": 3,
      "augmentEmphasis": [
        "생존",
        "후방사격"
      ],
      "environment": [
        "구름",
        "포병 관측구역"
      ],
      "phases": [
        {
          "atProgress": 0.0,
          "description": "관측구역 1 유지"
        },
        {
          "atProgress": 0.35,
          "description": "적 요격기 증가 + 구역 2"
        },
        {
          "atProgress": 0.7,
          "description": "구역 3 + 후방 사수 압박"
        }
      ],
      "aceBossBehavior": "롤랑 가로스 '모티프' 에이스. 직접 사망/격추 확정 연출 없이 시대 상징형으로 처리",
      "failureCondition": "관측구역 3곳 점유 실패 또는 정찰기 격추",
      "reuseSystems": [
        "호위",
        "체크포인트"
      ],
      "requiredHooks": [
        "rearGunnerArc",
        "holdZone"
      ],
      "rewardCandidate": "Fokker E.I 해금 후보",
      "randomizationPool": [
        "적 진입 방향",
        "관측구역 위치",
        "구름대"
      ],
      "implementationNote": "Keep the historical source fields as presentation/reference. Gameplay phase/balance fields are game-design additions."
    },
    {
      "id": "C-02",
      "faction": "central",
      "displayFaction": "동맹국",
      "chapter": "I",
      "title": "포커의 재앙",
      "historicalAnchorDate": "1915-08-01",
      "historicalEvent": "Fokker Scourge",
      "region": "서부전선",
      "defaultAircraft": "Fokker E.I",
      "enemyDisplayPool": [
        "BE.2c",
        "Voisin III"
      ],
      "sourceMission": "적 정찰망 붕괴",
      "sourceGimmick": "동조 기관총으로 정면 공격 보너스",
      "sourceAceBoss": "막스 이멜만(플레이어 동료)",
      "sourceVictory": "정찰기 8대 격추",
      "sourceType": "사냥",
      "difficulty": 2,
      "recommendedDurationSec": 240,
      "targetLevelUpCount": 4,
      "augmentEmphasis": [
        "기관총",
        "정면공격"
      ],
      "environment": [
        "개활 하늘",
        "정찰기 밀집"
      ],
      "phases": [
        {
          "atProgress": 0.0,
          "description": "정찰기 3대"
        },
        {
          "atProgress": 0.35,
          "description": "호위기 포함 3대"
        },
        {
          "atProgress": 0.7,
          "description": "이멜만 동료 이벤트 + 정찰기 2대"
        }
      ],
      "aceBossBehavior": "보스 없음. 막스 이멜만은 플레이어 동료로 등장해 전방 공격각을 만들어줌",
      "failureCondition": "시간 내 정찰기 8대 격추 실패",
      "reuseSystems": [
        "윙맨",
        "자동사격"
      ],
      "requiredHooks": [
        "syncGunBonus",
        "scriptedAllyAce"
      ],
      "rewardCandidate": "Albatros D.II 해금 후보",
      "randomizationPool": [
        "정찰기 종류",
        "이멜만 지원 타이밍",
        "호위기 수"
      ],
      "implementationNote": "Keep the historical source fields as presentation/reference. Gameplay phase/balance fields are game-design additions."
    },
    {
      "id": "C-03",
      "faction": "central",
      "displayFaction": "동맹국",
      "chapter": "II",
      "title": "뵐케의 편대",
      "historicalAnchorDate": "1916-09-17",
      "historicalEvent": "Jasta 2 창설기·솜 전투",
      "region": "솜, 프랑스",
      "defaultAircraft": "Albatros D.II",
      "enemyDisplayPool": [
        "DH.2",
        "Nieuport 17"
      ],
      "sourceMission": "편대 전술로 제공권 회복",
      "sourceGimmick": "엄호·고도우세·일격이탈 보너스",
      "sourceAceBoss": "오스왈드 뵐케 지휘 이벤트",
      "sourceVictory": "편대원 2명 생존",
      "sourceType": "편대전",
      "difficulty": 3,
      "recommendedDurationSec": 250,
      "targetLevelUpCount": 4,
      "augmentEmphasis": [
        "윙맨",
        "기동",
        "정밀사격"
      ],
      "environment": [
        "고도층",
        "편대전"
      ],
      "phases": [
        {
          "atProgress": 0.0,
          "description": "편대 집결 튜토리얼"
        },
        {
          "atProgress": 0.35,
          "description": "고도 우위 목표"
        },
        {
          "atProgress": 0.7,
          "description": "뵐케 지휘 이벤트 + 집중공격"
        }
      ],
      "aceBossBehavior": "뵐케는 아군 지휘 이벤트. Dicta Boelcke 조건을 HUD 목표로 점등",
      "failureCondition": "편대원 2명 미만 생존",
      "reuseSystems": [
        "윙맨",
        "편대"
      ],
      "requiredHooks": [
        "formationGoal",
        "dictaBoelckeHUD"
      ],
      "rewardCandidate": "Albatros D.III 해금 후보",
      "randomizationPool": [
        "편대원 기체",
        "고도 목표",
        "적 웨이브 진입각"
      ],
      "implementationNote": "Keep the historical source fields as presentation/reference. Gameplay phase/balance fields are game-design additions."
    },
    {
      "id": "C-04",
      "faction": "central",
      "displayFaction": "동맹국",
      "chapter": "III",
      "title": "블러디 에이프릴",
      "historicalAnchorDate": "1917-04-09",
      "historicalEvent": "아라스 전투·Bloody April",
      "region": "아라스, 프랑스",
      "defaultAircraft": "Albatros D.III",
      "enemyDisplayPool": [
        "BE.2e",
        "Sopwith Pup",
        "Nieuport 17"
      ],
      "sourceMission": "적 정찰기와 호위대 격파",
      "sourceGimmick": "Jasta 연속 합류로 콤보 유지",
      "sourceAceBoss": "앨버트 볼",
      "sourceVictory": "정찰기 우선 격추 보너스",
      "sourceType": "공세 방어",
      "difficulty": 3,
      "recommendedDurationSec": 260,
      "targetLevelUpCount": 5,
      "augmentEmphasis": [
        "화력",
        "연속격추"
      ],
      "environment": [
        "Jasta 합류",
        "정찰기 우선표적"
      ],
      "phases": [
        {
          "atProgress": 0.0,
          "description": "정찰기 3+호위"
        },
        {
          "atProgress": 0.35,
          "description": "Jasta 합류 후 정찰기 3"
        },
        {
          "atProgress": 0.7,
          "description": "앨버트 볼 에이스 난입"
        }
      ],
      "aceBossBehavior": "앨버트 볼: 상승공격형. Climb 직후 공격 강화 패턴",
      "failureCondition": "정찰기 격추 목표 미달 또는 플레이어 격추",
      "reuseSystems": [
        "에이스",
        "콤보"
      ],
      "requiredHooks": [
        "priorityTarget",
        "comboWindow"
      ],
      "rewardCandidate": "Albatros D.V 해금 후보",
      "randomizationPool": [
        "정찰기 스폰 위치",
        "Jasta 합류 위치",
        "볼 난입 시점"
      ],
      "implementationNote": "Keep the historical source fields as presentation/reference. Gameplay phase/balance fields are game-design additions."
    },
    {
      "id": "C-05",
      "faction": "central",
      "displayFaction": "동맹국",
      "chapter": "III",
      "title": "플라잉 서커스",
      "historicalAnchorDate": "1917-06-24",
      "historicalEvent": "Jagdgeschwader 1 창설",
      "region": "플랑드르 전선",
      "defaultAircraft": "Albatros D.V",
      "enemyDisplayPool": [
        "Sopwith Triplane",
        "SPAD VII"
      ],
      "sourceMission": "이동 전투비행단 첫 작전",
      "sourceGimmick": "기체 색상별 동료 특성·편대 명령",
      "sourceAceBoss": "레이먼드 콜리쇼",
      "sourceVictory": "에이스 3연전",
      "sourceType": "에이스 러시",
      "difficulty": 4,
      "recommendedDurationSec": 300,
      "targetLevelUpCount": 5,
      "augmentEmphasis": [
        "윙맨",
        "에이스전"
      ],
      "environment": [
        "이동 전투비행단",
        "색상 편대"
      ],
      "phases": [
        {
          "atProgress": 0.0,
          "description": "에이스 1"
        },
        {
          "atProgress": 0.35,
          "description": "보급/짧은 정비 후 에이스 2"
        },
        {
          "atProgress": 0.7,
          "description": "레이먼드 콜리쇼 + Black Flight"
        }
      ],
      "aceBossBehavior": "콜리쇼: Black Flight 2~3기 협공. 표적 공유와 동시 진입을 핵심 패턴으로",
      "failureCondition": "에이스 3연전 완료 전 플레이어 격추",
      "reuseSystems": [
        "에이스",
        "윙맨",
        "정비픽업"
      ],
      "requiredHooks": [
        "aceRush",
        "intermissionRepair"
      ],
      "rewardCandidate": "Fokker Dr.I 해금 후보",
      "randomizationPool": [
        "1·2번째 에이스 풀",
        "Black Flight 진입 패턴",
        "정비 픽업 위치"
      ],
      "implementationNote": "Keep the historical source fields as presentation/reference. Gameplay phase/balance fields are game-design additions."
    },
    {
      "id": "C-06",
      "faction": "central",
      "displayFaction": "동맹국",
      "chapter": "III",
      "title": "캉브레의 반격",
      "historicalAnchorDate": "1917-11-30",
      "historicalEvent": "캉브레 독일 반격",
      "region": "캉브레, 프랑스",
      "defaultAircraft": "Albatros D.V / Halberstadt CL.II",
      "enemyDisplayPool": [
        "Sopwith Camel",
        "DH.5"
      ],
      "sourceMission": "돌파 부대 근접지원",
      "sourceGimmick": "저고도 기총소사와 전차 공격",
      "sourceAceBoss": "앤드루 맥키버",
      "sourceVictory": "전차 10대 무력화",
      "sourceType": "지상공격",
      "difficulty": 4,
      "recommendedDurationSec": 280,
      "targetLevelUpCount": 5,
      "augmentEmphasis": [
        "지상공격",
        "폭격지원"
      ],
      "environment": [
        "전차",
        "대공포",
        "기관총 진지"
      ],
      "phases": [
        {
          "atProgress": 0.0,
          "description": "전차 3대"
        },
        {
          "atProgress": 0.35,
          "description": "전차 4대+대공포"
        },
        {
          "atProgress": 0.7,
          "description": "전차 3대+맥키버 요격"
        }
      ],
      "aceBossBehavior": "앤드루 맥키버: 기존 정의가 없으면 GenericAce 템플릿 사용",
      "failureCondition": "전차 10대 무력화 실패",
      "reuseSystems": [
        "지상표적",
        "대공포"
      ],
      "requiredHooks": [
        "tankEnemy",
        "strafingRun"
      ],
      "rewardCandidate": "Halberstadt CL.II 해금 후보",
      "randomizationPool": [
        "전차 대형",
        "대공포 위치",
        "에이스 난입"
      ],
      "implementationNote": "Keep the historical source fields as presentation/reference. Gameplay phase/balance fields are game-design additions."
    },
    {
      "id": "C-07",
      "faction": "central",
      "displayFaction": "동맹국",
      "chapter": "III",
      "title": "카포레토의 독수리",
      "historicalAnchorDate": "1917-10-24",
      "historicalEvent": "카포레토 전투",
      "region": "이손초, 이탈리아",
      "defaultAircraft": "Albatros D.III(Oeffag)",
      "enemyDisplayPool": [
        "Hanriot HD.1",
        "SPAD VII"
      ],
      "sourceMission": "산악 계곡을 따라 돌파 지원",
      "sourceGimmick": "산봉우리·강풍·좁은 비행 회랑",
      "sourceAceBoss": "프란체스코 바라카",
      "sourceVictory": "계곡 목표 5곳 파괴",
      "sourceType": "산악전",
      "difficulty": 4,
      "recommendedDurationSec": 270,
      "targetLevelUpCount": 5,
      "augmentEmphasis": [
        "기동",
        "속도"
      ],
      "environment": [
        "산봉우리",
        "좁은 회랑",
        "빠른 돌풍"
      ],
      "phases": [
        {
          "atProgress": 0.0,
          "description": "계곡 목표 2"
        },
        {
          "atProgress": 0.35,
          "description": "강풍 회랑+목표 2"
        },
        {
          "atProgress": 0.7,
          "description": "프란체스코 바라카 + 마지막 목표"
        }
      ],
      "aceBossBehavior": "바라카: 은색 Nieuport 17. 검은 도약마는 방향 독립/고정 연출로 재작업한 버전만 사용",
      "failureCondition": "산악 충돌 또는 목표 5곳 파괴 실패",
      "reuseSystems": [
        "돌풍",
        "에이스"
      ],
      "requiredHooks": [
        "mountainCorridor",
        "collisionBounds"
      ],
      "rewardCandidate": "Oeffag 변형 해금 후보",
      "randomizationPool": [
        "돌풍 방향",
        "회랑 폭",
        "바라카 난입각"
      ],
      "implementationNote": "Keep the historical source fields as presentation/reference. Gameplay phase/balance fields are game-design additions."
    },
    {
      "id": "C-08",
      "faction": "central",
      "displayFaction": "동맹국",
      "chapter": "IV",
      "title": "황제의 봄",
      "historicalAnchorDate": "1918-03-21",
      "historicalEvent": "독일 춘계 공세",
      "region": "생캉탱, 프랑스",
      "defaultAircraft": "Fokker Dr.I / Albatros D.Va",
      "enemyDisplayPool": [
        "S.E.5a",
        "Bristol F.2B"
      ],
      "sourceMission": "돌격대 진격로 개척",
      "sourceGimmick": "이동 전선·짧은 시간 내 목표 연쇄 파괴",
      "sourceAceBoss": "르네 퐁크",
      "sourceVictory": "목표 연쇄 15콤보",
      "sourceType": "공세",
      "difficulty": 4,
      "recommendedDurationSec": 290,
      "targetLevelUpCount": 6,
      "augmentEmphasis": [
        "화력",
        "연속격추",
        "보조무장"
      ],
      "environment": [
        "이동 전선",
        "연쇄 목표"
      ],
      "phases": [
        {
          "atProgress": 0.0,
          "description": "연쇄 목표 5"
        },
        {
          "atProgress": 0.35,
          "description": "전선 이동 + 목표 5"
        },
        {
          "atProgress": 0.7,
          "description": "르네 퐁크 + 목표 5"
        }
      ],
      "aceBossBehavior": "르네 퐁크: 정밀사격형. 약점 표식/관통 사격을 적 버전 텔레그래프로 구현",
      "failureCondition": "15콤보 끊김 누적 또는 제한시간 초과",
      "reuseSystems": [
        "에이스",
        "점수",
        "연속처치"
      ],
      "requiredHooks": [
        "chainObjective",
        "movingFront"
      ],
      "rewardCandidate": "Fokker Dr.I 고급 출격 해금 후보",
      "randomizationPool": [
        "목표 종류",
        "전선 이동 방향",
        "퐁크 사격선"
      ],
      "implementationNote": "Keep the historical source fields as presentation/reference. Gameplay phase/balance fields are game-design additions."
    },
    {
      "id": "C-09",
      "faction": "central",
      "displayFaction": "동맹국",
      "chapter": "IV",
      "title": "최고의 전투기",
      "historicalAnchorDate": "1918-06-01",
      "historicalEvent": "Fokker D.VII 전선 투입기",
      "region": "서부전선",
      "defaultAircraft": "Fokker D.VII",
      "enemyDisplayPool": [
        "Sopwith Camel",
        "SPAD XIII"
      ],
      "sourceMission": "신형기의 성능 시험",
      "sourceGimmick": "고고도 실속 저항·상승전 특화",
      "sourceAceBoss": "윌리엄 비숍 모티프",
      "sourceVictory": "고도 3단계 적 편대 격파",
      "sourceType": "기체 시험",
      "difficulty": 5,
      "recommendedDurationSec": 280,
      "targetLevelUpCount": 5,
      "augmentEmphasis": [
        "기동",
        "고도전"
      ],
      "environment": [
        "3단 고도",
        "실속 압박"
      ],
      "phases": [
        {
          "atProgress": 0.0,
          "description": "저고도 Camel"
        },
        {
          "atProgress": 0.35,
          "description": "중고도 혼합편대"
        },
        {
          "atProgress": 0.7,
          "description": "고고도 SPAD XIII + 비숍 모티프"
        }
      ],
      "aceBossBehavior": "윌리엄 비숍 모티프: 기습 첫타형. 플레이어블 비숍의 액티브 후 잔탄 0 규칙은 플레이어 쪽에서 유지",
      "failureCondition": "고도 3단계 적 편대 격파 실패",
      "reuseSystems": [
        "에이스",
        "고도표기"
      ],
      "requiredHooks": [
        "altitudeBands",
        "climbBonus"
      ],
      "rewardCandidate": "Fokker D.VII 해금",
      "randomizationPool": [
        "고도별 적 조합",
        "돌입 방향",
        "보급 위치"
      ],
      "implementationNote": "Keep the historical source fields as presentation/reference. Gameplay phase/balance fields are game-design additions."
    },
    {
      "id": "C-10",
      "faction": "central",
      "displayFaction": "동맹국",
      "chapter": "IV",
      "title": "마지막 서커스",
      "historicalAnchorDate": "1918-09-26",
      "historicalEvent": "뫼즈-아르곤·백일 공세",
      "region": "아르곤, 프랑스",
      "defaultAircraft": "Fokker D.VII",
      "enemyDisplayPool": [
        "SPAD XIII",
        "S.E.5a",
        "DH.4"
      ],
      "sourceMission": "후퇴로 확보",
      "sourceGimmick": "적 물량은 증가하고 보급은 감소",
      "sourceAceBoss": "에디 리켄배커",
      "sourceVictory": "지정 시간 생존·동료 탈출",
      "sourceType": "최종 생존전",
      "difficulty": 5,
      "recommendedDurationSec": 330,
      "targetLevelUpCount": 6,
      "augmentEmphasis": [
        "생존",
        "윙맨",
        "탄약관리"
      ],
      "environment": [
        "후퇴선",
        "보급 감소",
        "적 폭격기"
      ],
      "phases": [
        {
          "atProgress": 0.0,
          "description": "후퇴구간 1"
        },
        {
          "atProgress": 0.35,
          "description": "보급 감소 + 구간 2"
        },
        {
          "atProgress": 0.7,
          "description": "에디 리켄베커 추격 + 동료 탈출"
        }
      ],
      "aceBossBehavior": "에디 리켄베커: 고속 패스 후 이탈 반복. 죽이는 보스보다 추격/억제 에이스",
      "failureCondition": "지정시간 전에 플레이어 격추 또는 동료 탈출 실패",
      "reuseSystems": [
        "윙맨",
        "호위",
        "폭격기"
      ],
      "requiredHooks": [
        "retreatLine",
        "supplyScarcity"
      ],
      "rewardCandidate": "동맹국 캠페인 클리어 / 1918 자유출격",
      "randomizationPool": [
        "보급량",
        "적 폭격기 종류",
        "리켄베커 진입 방향"
      ],
      "implementationNote": "Keep the historical source fields as presentation/reference. Gameplay phase/balance fields are game-design additions."
    }
  ],
  "eventDefinitions": [
    {
      "eventKey": "photoZone",
      "category": "정찰",
      "behavior": "지정 원 안에 일정 시간 머물면 사진/관측 진행. 피격 시 진행이 느려지되 즉시 초기화하지 않음.",
      "usedBy": "A-01,A-04",
      "implementationStatus": "신규",
      "assetUI": "카메라 아이콘/원형 진행바"
    },
    {
      "eventKey": "cloudConceal",
      "category": "환경",
      "behavior": "구름 내부에서는 적 추적/명중 보정 약화. 플레이어 시야도 제한.",
      "usedBy": "A-01,A-02,C-01",
      "implementationStatus": "신규/간단",
      "assetUI": "반투명 구름 레이어"
    },
    {
      "eventKey": "observerPriority",
      "category": "표적",
      "behavior": "관측기/정찰기를 우선표적으로 지정하고 HUD 마커 표시.",
      "usedBy": "A-03,C-04",
      "implementationStatus": "신규/간단",
      "assetUI": "표적 아이콘"
    },
    {
      "eventKey": "movingBarrage",
      "category": "환경",
      "behavior": "세로/가로/대각 폭격 띠가 이동. 경고 후 피해.",
      "usedBy": "A-04",
      "implementationStatus": "신규",
      "assetUI": "포격 경고선+폭발"
    },
    {
      "eventKey": "waveEscalation",
      "category": "스폰",
      "behavior": "시간 경과에 따라 적 웨이브 수와 에이스 동반기 비율 증가.",
      "usedBy": "A-05",
      "implementationStatus": "기존 스폰 확장",
      "assetUI": "없음"
    },
    {
      "eventKey": "extractionZone",
      "category": "임무",
      "behavior": "마지막 단계에 탈출선/귀환 원 생성. 진입 후 짧은 채널링으로 클리어.",
      "usedBy": "A-05",
      "implementationStatus": "신규/간단",
      "assetUI": "귀환 마커"
    },
    {
      "eventKey": "groundTarget",
      "category": "지상공격",
      "behavior": "대공포·기관총 진지·관측소를 공통 파괴가능 지상표적으로 취급.",
      "usedBy": "A-06,A-07,C-06",
      "implementationStatus": "기존 대공포 확장",
      "assetUI": "기존 대공포/폭발"
    },
    {
      "eventKey": "tankConvoy",
      "category": "호위",
      "behavior": "아군 전차 종대가 경로를 따라 이동하고 생존율을 계산.",
      "usedBy": "A-07",
      "implementationStatus": "신규",
      "assetUI": "탑뷰 전차 스프라이트"
    },
    {
      "eventKey": "movingFront",
      "category": "전장",
      "behavior": "전선 경계가 이동해 안전/위험 영역을 재구성.",
      "usedBy": "A-08,C-08",
      "implementationStatus": "신규",
      "assetUI": "전선/연기 오버레이"
    },
    {
      "eventKey": "supplyZone",
      "category": "보급",
      "behavior": "통과 시 탄약 보충. 레벨업 체력회복은 금지; 수리는 스패너/기어 픽업만.",
      "usedBy": "A-08,C-10",
      "implementationStatus": "기존 탄약 확장",
      "assetUI": "탄약/정비 아이콘"
    },
    {
      "eventKey": "zeppelinDeathGust",
      "category": "대형유닛",
      "behavior": "비행선 파괴 시 빠른 돌풍을 생성.",
      "usedBy": "대형 유닛 공통",
      "implementationStatus": "최신 확정",
      "assetUI": "비행선+돌풍"
    },
    {
      "eventKey": "friendlyBomberUnique",
      "category": "유니크 강화",
      "behavior": "유니크 강화 획득 시 수초마다 아군 폭격기가 진입해 폭격.",
      "usedBy": "전체",
      "implementationStatus": "최신 확정",
      "assetUI": "진영별 폭격기"
    },
    {
      "eventKey": "wingmanUnique",
      "category": "유니크 강화",
      "behavior": "유니크 강화에서만 등장하며 선택당 정확히 윙맨 1기 추가.",
      "usedBy": "전체",
      "implementationStatus": "최신 확정",
      "assetUI": "진영별 지원기"
    },
    {
      "eventKey": "fogLift",
      "category": "환경",
      "behavior": "초반 안개로 시야/스폰 표시 제한, 중반 이후 걷히며 목표와 적 동시 증가.",
      "usedBy": "A-10",
      "implementationStatus": "신규/간단",
      "assetUI": "안개 오버레이"
    },
    {
      "eventKey": "whiteGoringFormation",
      "category": "에이스",
      "behavior": "괴링 등장 시 동반 편대는 전부 흰 기체. 지휘 버프로 집결/사격 빈도 강화.",
      "usedBy": "A-10",
      "implementationStatus": "최신 확정",
      "assetUI": "흰 기체 변형"
    },
    {
      "eventKey": "redFokkerReserved",
      "category": "아트/진영",
      "behavior": "일반 Fokker Dr.I는 빨간색 사용 금지. 빨간 Dr.I는 리히트호펜 전용.",
      "usedBy": "전체",
      "implementationStatus": "최신 확정",
      "assetUI": "올리브 일반 Dr.I / 붉은 전용 Dr.I"
    },
    {
      "eventKey": "factionAirship",
      "category": "아트/진영",
      "behavior": "동맹국 플레이 시 적 비행선은 협상국 버전/마킹 사용.",
      "usedBy": "전체",
      "implementationStatus": "최신 확정",
      "assetUI": "협상국 비행선"
    },
    {
      "eventKey": "lowHpSpeedPenalty",
      "category": "플레이어",
      "behavior": "현재 체력과 관계없이 기체 이동속도를 그대로 유지.",
      "usedBy": "전체",
      "implementationStatus": "최신 확정",
      "assetUI": "없음"
    }
  ]
};

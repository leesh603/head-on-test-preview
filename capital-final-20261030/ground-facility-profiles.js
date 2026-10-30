// Vetted map-ground profiles; mirrored coordinates only, never faction marks.
export const FACILITY_MAPS={
  "0": {
    "key": "rural",
    "period": 768,
    "mirror": false,
    "airfield": [
      [
        {
          "u": 0.33984375,
          "v": 0.5397135416666666,
          "width": 64,
          "height": 30
        },
        {
          "u": 0.7083333333333334,
          "v": 0.8404947916666666,
          "width": 64,
          "height": 30
        }
      ]
    ],
    "signal": [],
    "exclusions": [
      [
        581.376,
        365.568,
        38,
        768
      ],
      [
        472.32,
        568.3199999999999,
        35,
        768
      ],
      [
        165.12,
        504.576,
        20,
        768
      ]
    ]
  },
  "8": {
    "key": "cambrai",
    "period": 768,
    "mirror": true,
    "airfield": [
      [
        {
          "u": 0.8528645833333334,
          "v": 0.2109375,
          "width": 68,
          "height": 30
        },
        {
          "u": 0.22135416666666666,
          "v": 0.6106770833333334,
          "width": 68,
          "height": 30
        }
      ]
    ],
    "signal": [],
    "exclusions": [
      [
        350.976,
        199.68,
        45,
        768
      ],
      [
        364.79999999999995,
        524.5440000000001,
        44,
        768
      ]
    ]
  },
  "10": {
    "key": "somme",
    "period": 1254,
    "mirror": false,
    "airfield": [
      [
        {
          "u": 0.20334928229665072,
          "v": 0.7567783094098883,
          "width": 64,
          "height": 28
        },
        {
          "u": 0.19776714513556617,
          "v": 0.7998405103668261,
          "width": 64,
          "height": 28
        }
      ]
    ],
    "signal": [
      [
        {
          "u": 0.8133971291866029,
          "v": 0.21929824561403508,
          "width": 220
        }
      ]
    ],
    "exclusions": [
      [
        1003.2,
        401.28000000000003,
        55,
        1254
      ],
      [
        333.564,
        875.2919999999999,
        53,
        1254
      ]
    ]
  },
  "13": {
    "key": "maan",
    "period": 1104,
    "mirror": false,
    "airfield": [
      [
        {
          "u": 0.3351449275362319,
          "v": 0.33061594202898553,
          "width": 70,
          "height": 32
        },
        {
          "u": 0.46195652173913043,
          "v": 0.4257246376811594,
          "width": 70,
          "height": 32
        }
      ],
      [
        {
          "u": 0.12681159420289856,
          "v": 0.5434782608695652,
          "width": 70,
          "height": 32
        },
        {
          "u": 0.23550724637681159,
          "v": 0.6340579710144928,
          "width": 70,
          "height": 32
        }
      ]
    ],
    "signal": [
      [
        {
          "u": 0.5434782608695652,
          "v": 0.49818840579710144,
          "width": 260
        }
      ]
    ],
    "exclusions": [
      [
        320,
        380,
        96,
        1700
      ],
      [
        403,
        435,
        48,
        1700
      ]
    ]
  }
};
export const FACILITY_ART={
  "rural-airfield-entente": {
    "file": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/ground-facilities/airfield-rural-entente-clean.webp",
    "width": 288,
    "height": 129,
    "hit": [
      34.559999999999995,
      15.48,
      218.87999999999997,
      92.88000000000001
    ],
    "national": "프랑스",
    "flag": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/ground-facilities/flag-somme-entente.png",
    "rubble": [
      18.75986471251409,
      40.983089064261556,
      480.82976324689963,
      174.03382187147687
    ]
  },
  "rural-airfield-central": {
    "file": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/ground-facilities/airfield-rural-central-clean.webp",
    "width": 288,
    "height": 124,
    "hit": [
      34.559999999999995,
      14.879999999999997,
      218.88,
      89.28
    ],
    "national": "독일",
    "flag": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/ground-facilities/flag-somme-central.png",
    "rubble": [
      18.75986471251409,
      40.983089064261556,
      480.82976324689963,
      174.03382187147687
    ]
  },
  "cambrai-airfield-entente": {
    "file": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/ground-facilities/airfield-cambrai-entente-clean.webp",
    "width": 288,
    "height": 128,
    "hit": [
      34.559999999999995,
      15.36,
      218.88,
      92.16
    ],
    "national": "영국",
    "flag": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/ground-facilities/flag-maan-entente.png",
    "rubble": [
      18.75986471251409,
      40.983089064261556,
      480.82976324689963,
      174.03382187147687
    ]
  },
  "cambrai-airfield-central": {
    "file": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/ground-facilities/airfield-cambrai-central-clean.webp",
    "width": 288,
    "height": 124,
    "hit": [
      34.559999999999995,
      14.879999999999999,
      218.87999999999997,
      89.27999999999999
    ],
    "national": "독일",
    "flag": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/ground-facilities/flag-somme-central.png",
    "rubble": [
      18.75986471251409,
      40.983089064261556,
      480.82976324689963,
      174.03382187147687
    ]
  },
  "maan-airfield-entente": {
    "file": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/ground-facilities/airfield-maan-entente-clean.webp",
    "width": 288,
    "height": 130,
    "hit": [
      34.559999999999995,
      15.6,
      218.87999999999997,
      93.60000000000001
    ],
    "national": "영국",
    "flag": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/ground-facilities/flag-maan-entente.png",
    "rubble": [
      18.75986471251409,
      40.983089064261556,
      480.82976324689963,
      174.03382187147687
    ]
  },
  "maan-airfield-central": {
    "file": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/ground-facilities/airfield-maan-central-clean.webp",
    "width": 288,
    "height": 126,
    "hit": [
      34.56,
      15.12,
      218.88,
      90.72
    ],
    "national": "오스만",
    "flag": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/ground-facilities/flag-maan-central.png",
    "rubble": [
      18.75986471251409,
      40.983089064261556,
      480.82976324689963,
      174.03382187147687
    ]
  },
  "somme-airfield-entente": {
    "file": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/ground-facilities/airfield-somme-entente-clean.webp",
    "width": 288,
    "height": 110,
    "hit": [
      34.559999999999995,
      13.200000000000001,
      218.88,
      79.2
    ],
    "national": "프랑스",
    "flag": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/ground-facilities/flag-somme-entente.png",
    "rubble": [
      18.75986471251409,
      40.983089064261556,
      480.82976324689963,
      174.03382187147687
    ]
  },
  "somme-airfield-central": {
    "file": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/ground-facilities/airfield-somme-central-clean.webp",
    "width": 288,
    "height": 122,
    "hit": [
      34.559999999999995,
      14.639999999999999,
      218.88,
      87.83999999999999
    ],
    "national": "독일",
    "flag": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/ground-facilities/flag-somme-central.png",
    "rubble": [
      18.75986471251409,
      40.983089064261556,
      480.82976324689963,
      174.03382187147687
    ]
  },
  "maan-signal-entente": {
    "file": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/ground-facilities/signal-hq-maan-entente-clean.webp",
    "width": 768,
    "height": 509,
    "nominalWidth": 776.0842105263158,
    "pivot": [
      388.0421052631579,
      250.20357497517375
    ],
    "hit": [
      248.58947368421053,
      183.48262164846076,
      198.06315789473686,
      166.8023833167825
    ],
    "rubble": [
      163.06651634723787,
      49.064261555806084,
      187.59864712514093,
      158.73731679819616
    ],
    "national": "영국"
  },
  "maan-signal-central": {
    "file": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/ground-facilities/signal-hq-maan-central-clean.webp",
    "width": 768,
    "height": 521,
    "nominalWidth": 788.008016032064,
    "pivot": [
      381.1783567134268,
      258.19014778325123
    ],
    "hit": [
      239.58316633266531,
      190.43448275862067,
      201.10621242484967,
      169.38916256157634
    ],
    "rubble": [
      163.06651634723787,
      49.064261555806084,
      187.59864712514093,
      158.73731679819616
    ],
    "national": "오스만"
  },
  "somme-signal-entente": {
    "file": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/ground-facilities/signal-hq-somme-entente-clean.webp",
    "width": 768,
    "height": 526,
    "nominalWidth": 788.5347593582889,
    "pivot": [
      379.3796791443851,
      263
    ],
    "hit": [
      237.68983957219254,
      195.1953125,
      201.24064171122996,
      169.51171875
    ],
    "rubble": [
      163.06651634723787,
      49.064261555806084,
      187.59864712514093,
      158.73731679819616
    ],
    "national": "프랑스"
  },
  "somme-signal-central": {
    "file": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/ground-facilities/signal-hq-somme-central-clean.webp",
    "width": 768,
    "height": 506,
    "nominalWidth": 768,
    "pivot": [
      384,
      250
    ],
    "hit": [
      246,
      184,
      196,
      165
    ],
    "rubble": [
      163.06651634723787,
      49.064261555806084,
      187.59864712514093,
      158.73731679819616
    ],
    "national": "독일"
  }
};

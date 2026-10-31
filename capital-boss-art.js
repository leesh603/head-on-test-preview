// Supplied HEAD-ON articulated artwork; native source-pixel coordinates.
export const CAPITAL_BOSS_ART=Object.freeze({
  "final-kaiserkrone": {
    "id": "final-kaiserkrone",
    "name": "독일 · 카이저크로네",
    "width": 1080,
    "height": 1100,
    "coordinateSpace": "center",
    "previewPadding": 24,
    "defaultPart": "port-engine-1",
    "images": {
      "structure": "./asset-bank/capital-bosses/kaiserkrone-structure.webp",
      "hardware": "./asset-bank/capital-bosses/kaiserkrone-hardware.webp",
      "envelopeHD": "./asset-bank/capital-bosses/kaiserkrone-envelope-hd-20261031.webp"
    },
    "illustration": "./asset-bank/capital-bosses/kaiserkrone-cutin.webp",
    "previewDamage": {
      "port-envelope": "destroyed",
      "main-envelope": "damaged",
      "port-engine-1": "destroyed",
      "port-engine-2": "damaged",
      "port-gun-1": "destroyed",
      "bomb-hatch-left": "damaged"
    },
    "parts": [
      {
        "atlas": "structure",
        "frames": [
          [
            60,
            866,
            380,
            374
          ],
          [
            440,
            866,
            380,
            374
          ],
          [
            831,
            866,
            380,
            374
          ]
        ],
        "framePivots": [
          [
            0.5,
            0.5
          ],
          [
            0.5,
            0.502674
          ],
          [
            0.5,
            0.502674
          ]
        ],
        "id": "load-frame",
        "label": "기관 연결 골조",
        "kind": "structure",
        "x": 0,
        "y": 45,
        "w": 880,
        "h": 620,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "preserveAspect": false,
        "width": 880,
        "height": 620,
        "radius": 217
      },
      {
        "atlas": "structure",
        "frames": [
          [
            169,
            519,
            160,
            351
          ],
          [
            549,
            519,
            160,
            351
          ],
          [
            944,
            519,
            160,
            351
          ]
        ],
        "framePivots": [
          [
            0.5,
            0.495726
          ],
          [
            0.5,
            0.495726
          ],
          [
            0.5,
            0.495726
          ]
        ],
        "id": "port-envelope",
        "label": "좌현 부양낭",
        "kind": "structure",
        "x": -310,
        "y": 20,
        "w": 264,
        "h": 579.15,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "width": 264,
        "height": 579.15,
        "radius": 92.39999999999999
      },
      {
        "atlas": "structure",
        "frames": [
          [
            169,
            519,
            160,
            351
          ],
          [
            549,
            519,
            160,
            351
          ],
          [
            944,
            519,
            160,
            351
          ]
        ],
        "framePivots": [
          [
            0.5,
            0.495726
          ],
          [
            0.5,
            0.495726
          ],
          [
            0.5,
            0.495726
          ]
        ],
        "id": "starboard-envelope",
        "label": "우현 부양낭",
        "kind": "structure",
        "x": 310,
        "y": 20,
        "w": 264,
        "h": 579.15,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "width": 264,
        "height": 579.15,
        "radius": 92.39999999999999
      },
      {
        "atlas": "envelopeHD",
        "frames": [
          [
            110,
            0,
            380,
            1110
          ],
          [
            504,
            0,
            380,
            1110
          ],
          [
            880,
            0,
            430,
            1110
          ]
        ],
        "framePivots": [
          [
            0.5,
            0.5
          ],
          [
            0.5,
            0.5
          ],
          [
            0.5,
            0.5
          ]
        ],
        "id": "main-envelope",
        "label": "황제 부양낭",
        "kind": "structure",
        "x": 0,
        "y": -20,
        "w": 378.4,
        "h": 884.08,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "width": 378.4,
        "height": 884.08,
        "radius": 132.44,
        "preserveAspect": false
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            100,
            8,
            240,
            370
          ],
          [
            405,
            8,
            240,
            370
          ],
          [
            730,
            8,
            240,
            370
          ]
        ],
        "id": "port-engine-1",
        "label": "좌현 1번 기관",
        "kind": "engine",
        "x": -397,
        "y": -170,
        "w": 76.8,
        "h": 118.4,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "load-frame",
        "inheritDamage": false,
        "width": 76.8,
        "height": 118.4,
        "radius": 26.88
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            45,
            385,
            338,
            104
          ],
          [
            389,
            385,
            294,
            104
          ],
          [
            700,
            385,
            268,
            104
          ]
        ],
        "framePivots": [
          [
            0.508876,
            0.509615
          ],
          [
            0.462585,
            0.509615
          ],
          [
            0.559701,
            0.509615
          ]
        ],
        "id": "port-engine-1-propeller",
        "label": "좌현 1번 프로펠러",
        "kind": "propeller",
        "x": -397,
        "y": -222.8,
        "w": 101.39999999999999,
        "h": 31.2,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "port-engine-1",
        "speed": 25,
        "phase": 0,
        "width": 101.39999999999999,
        "height": 31.2,
        "radius": 14
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            100,
            8,
            240,
            370
          ],
          [
            405,
            8,
            240,
            370
          ],
          [
            730,
            8,
            240,
            370
          ]
        ],
        "id": "port-engine-2",
        "label": "좌현 2번 기관",
        "kind": "engine",
        "x": -397,
        "y": 35,
        "w": 76.8,
        "h": 118.4,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "load-frame",
        "inheritDamage": false,
        "width": 76.8,
        "height": 118.4,
        "radius": 26.88
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            45,
            385,
            338,
            104
          ],
          [
            389,
            385,
            294,
            104
          ],
          [
            700,
            385,
            268,
            104
          ]
        ],
        "framePivots": [
          [
            0.508876,
            0.509615
          ],
          [
            0.462585,
            0.509615
          ],
          [
            0.559701,
            0.509615
          ]
        ],
        "id": "port-engine-2-propeller",
        "label": "좌현 2번 프로펠러",
        "kind": "propeller",
        "x": -397,
        "y": -17.800000000000004,
        "w": 101.39999999999999,
        "h": 31.2,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "port-engine-2",
        "speed": 27,
        "phase": 0,
        "width": 101.39999999999999,
        "height": 31.2,
        "radius": 14
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            100,
            8,
            240,
            370
          ],
          [
            405,
            8,
            240,
            370
          ],
          [
            730,
            8,
            240,
            370
          ]
        ],
        "id": "port-engine-3",
        "label": "좌현 3번 기관",
        "kind": "engine",
        "x": -397,
        "y": 285,
        "w": 76.8,
        "h": 118.4,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "load-frame",
        "inheritDamage": false,
        "width": 76.8,
        "height": 118.4,
        "radius": 26.88
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            45,
            385,
            338,
            104
          ],
          [
            389,
            385,
            294,
            104
          ],
          [
            700,
            385,
            268,
            104
          ]
        ],
        "framePivots": [
          [
            0.508876,
            0.509615
          ],
          [
            0.462585,
            0.509615
          ],
          [
            0.559701,
            0.509615
          ]
        ],
        "id": "port-engine-3-propeller",
        "label": "좌현 3번 프로펠러",
        "kind": "propeller",
        "x": -397,
        "y": 232.2,
        "w": 101.39999999999999,
        "h": 31.2,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "port-engine-3",
        "speed": 29,
        "phase": 0,
        "width": 101.39999999999999,
        "height": 31.2,
        "radius": 14
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            100,
            8,
            240,
            370
          ],
          [
            405,
            8,
            240,
            370
          ],
          [
            730,
            8,
            240,
            370
          ]
        ],
        "id": "starboard-engine-1",
        "label": "우현 1번 기관",
        "kind": "engine",
        "x": 397,
        "y": -170,
        "w": 76.8,
        "h": 118.4,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "load-frame",
        "inheritDamage": false,
        "width": 76.8,
        "height": 118.4,
        "radius": 26.88
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            45,
            385,
            338,
            104
          ],
          [
            389,
            385,
            294,
            104
          ],
          [
            700,
            385,
            268,
            104
          ]
        ],
        "framePivots": [
          [
            0.508876,
            0.509615
          ],
          [
            0.462585,
            0.509615
          ],
          [
            0.559701,
            0.509615
          ]
        ],
        "id": "starboard-engine-1-propeller",
        "label": "우현 1번 프로펠러",
        "kind": "propeller",
        "x": 397,
        "y": -222.8,
        "w": 101.39999999999999,
        "h": 31.2,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "starboard-engine-1",
        "speed": 25,
        "phase": 0,
        "width": 101.39999999999999,
        "height": 31.2,
        "radius": 14
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            100,
            8,
            240,
            370
          ],
          [
            405,
            8,
            240,
            370
          ],
          [
            730,
            8,
            240,
            370
          ]
        ],
        "id": "starboard-engine-2",
        "label": "우현 2번 기관",
        "kind": "engine",
        "x": 397,
        "y": 35,
        "w": 76.8,
        "h": 118.4,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "load-frame",
        "inheritDamage": false,
        "width": 76.8,
        "height": 118.4,
        "radius": 26.88
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            45,
            385,
            338,
            104
          ],
          [
            389,
            385,
            294,
            104
          ],
          [
            700,
            385,
            268,
            104
          ]
        ],
        "framePivots": [
          [
            0.508876,
            0.509615
          ],
          [
            0.462585,
            0.509615
          ],
          [
            0.559701,
            0.509615
          ]
        ],
        "id": "starboard-engine-2-propeller",
        "label": "우현 2번 프로펠러",
        "kind": "propeller",
        "x": 397,
        "y": -17.800000000000004,
        "w": 101.39999999999999,
        "h": 31.2,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "starboard-engine-2",
        "speed": 27,
        "phase": 0,
        "width": 101.39999999999999,
        "height": 31.2,
        "radius": 14
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            100,
            8,
            240,
            370
          ],
          [
            405,
            8,
            240,
            370
          ],
          [
            730,
            8,
            240,
            370
          ]
        ],
        "id": "starboard-engine-3",
        "label": "우현 3번 기관",
        "kind": "engine",
        "x": 397,
        "y": 285,
        "w": 76.8,
        "h": 118.4,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "load-frame",
        "inheritDamage": false,
        "width": 76.8,
        "height": 118.4,
        "radius": 26.88
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            45,
            385,
            338,
            104
          ],
          [
            389,
            385,
            294,
            104
          ],
          [
            700,
            385,
            268,
            104
          ]
        ],
        "framePivots": [
          [
            0.508876,
            0.509615
          ],
          [
            0.462585,
            0.509615
          ],
          [
            0.559701,
            0.509615
          ]
        ],
        "id": "starboard-engine-3-propeller",
        "label": "우현 3번 프로펠러",
        "kind": "propeller",
        "x": 397,
        "y": 232.2,
        "w": 101.39999999999999,
        "h": 31.2,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "starboard-engine-3",
        "speed": 29,
        "phase": 0,
        "width": 101.39999999999999,
        "height": 31.2,
        "radius": 14
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            104,
            1209,
            232,
            316
          ],
          [
            410,
            1209,
            232,
            316
          ],
          [
            738,
            1209,
            232,
            316
          ]
        ],
        "id": "command-cabin",
        "label": "황제 사령실",
        "kind": "command",
        "x": 0,
        "y": -92,
        "w": 120.64,
        "h": 164.32,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "dependencies": [
          "main-envelope"
        ],
        "width": 120.64,
        "height": 164.32,
        "radius": 42.224
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            90,
            994,
            254,
            215
          ],
          [
            398,
            994,
            254,
            215
          ],
          [
            716,
            994,
            254,
            215
          ]
        ],
        "id": "bomb-hatch-left",
        "label": "중앙 폭탄창 좌문",
        "kind": "door",
        "x": 0,
        "y": 205,
        "w": 116.84,
        "h": 98.9,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "load-frame",
        "inheritDamage": false,
        "sourceHalf": "left",
        "side": "left",
        "travel": 53.746,
        "phase": 0,
        "width": 116.84,
        "height": 98.9,
        "radius": 34.615
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            90,
            994,
            254,
            215
          ],
          [
            398,
            994,
            254,
            215
          ],
          [
            716,
            994,
            254,
            215
          ]
        ],
        "id": "bomb-hatch-right",
        "label": "중앙 폭탄창 우문",
        "kind": "door",
        "x": 0,
        "y": 205,
        "w": 116.84,
        "h": 98.9,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "load-frame",
        "inheritDamage": false,
        "sourceHalf": "right",
        "side": "right",
        "travel": 53.746,
        "phase": 0,
        "width": 116.84,
        "height": 98.9,
        "radius": 34.615
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            105,
            493,
            230,
            214
          ],
          [
            410,
            493,
            230,
            214
          ],
          [
            730,
            493,
            240,
            214
          ]
        ],
        "framePivots": [
          [
            0.48695652173913045,
            0.5373831775700935
          ],
          [
            0.5,
            0.5373831775700935
          ],
          [
            0.5,
            0.5373831775700935
          ]
        ],
        "id": "port-gun-1",
        "label": "좌현 1번 포좌",
        "kind": "turret",
        "x": -177,
        "y": -200,
        "w": 74.4,
        "h": 66.34,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "load-frame",
        "inheritDamage": false,
        "arc": [
          -1.45,
          1.45
        ],
        "width": 74.4,
        "height": 66.34,
        "radius": 23.219
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            176,
            710,
            90,
            288
          ],
          [
            480,
            710,
            90,
            288
          ],
          [
            800,
            710,
            100,
            288
          ]
        ],
        "framePivots": [
          [
            0.46,
            0.82
          ],
          [
            0.46,
            0.82
          ],
          [
            0.46,
            0.82
          ]
        ],
        "id": "port-gun-1-barrel",
        "label": "좌현 1번 포신",
        "kind": "barrel",
        "x": -177,
        "y": -200,
        "w": 25.11,
        "h": 80.352,
        "pivot": [
          0.46,
          0.82
        ],
        "angle": 0,
        "parent": "port-gun-1",
        "recoilDistance": 8,
        "recoilPeriod": 2.9,
        "phase": 0.6,
        "muzzle": [
          0,
          -65.88864
        ],
        "inheritRotation": true,
        "width": 25.11,
        "height": 80.352,
        "radius": 14
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            105,
            493,
            230,
            214
          ],
          [
            410,
            493,
            230,
            214
          ],
          [
            730,
            493,
            240,
            214
          ]
        ],
        "framePivots": [
          [
            0.48695652173913045,
            0.5373831775700935
          ],
          [
            0.5,
            0.5373831775700935
          ],
          [
            0.5,
            0.5373831775700935
          ]
        ],
        "id": "port-gun-2",
        "label": "좌현 2번 포좌",
        "kind": "turret",
        "x": -177,
        "y": 30,
        "w": 74.4,
        "h": 66.34,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "load-frame",
        "inheritDamage": false,
        "arc": [
          -1.45,
          1.45
        ],
        "width": 74.4,
        "height": 66.34,
        "radius": 23.219
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            176,
            710,
            90,
            288
          ],
          [
            480,
            710,
            90,
            288
          ],
          [
            800,
            710,
            100,
            288
          ]
        ],
        "framePivots": [
          [
            0.46,
            0.82
          ],
          [
            0.46,
            0.82
          ],
          [
            0.46,
            0.82
          ]
        ],
        "id": "port-gun-2-barrel",
        "label": "좌현 2번 포신",
        "kind": "barrel",
        "x": -177,
        "y": 30,
        "w": 25.11,
        "h": 80.352,
        "pivot": [
          0.46,
          0.82
        ],
        "angle": 0,
        "parent": "port-gun-2",
        "recoilDistance": 8,
        "recoilPeriod": 2.9,
        "phase": 0.6,
        "muzzle": [
          0,
          -65.88864
        ],
        "inheritRotation": true,
        "width": 25.11,
        "height": 80.352,
        "radius": 14
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            105,
            493,
            230,
            214
          ],
          [
            410,
            493,
            230,
            214
          ],
          [
            730,
            493,
            240,
            214
          ]
        ],
        "framePivots": [
          [
            0.48695652173913045,
            0.5373831775700935
          ],
          [
            0.5,
            0.5373831775700935
          ],
          [
            0.5,
            0.5373831775700935
          ]
        ],
        "id": "port-gun-3",
        "label": "좌현 3번 포좌",
        "kind": "turret",
        "x": -177,
        "y": 290,
        "w": 74.4,
        "h": 66.34,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "load-frame",
        "inheritDamage": false,
        "arc": [
          -1.45,
          1.45
        ],
        "width": 74.4,
        "height": 66.34,
        "radius": 23.219
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            176,
            710,
            90,
            288
          ],
          [
            480,
            710,
            90,
            288
          ],
          [
            800,
            710,
            100,
            288
          ]
        ],
        "framePivots": [
          [
            0.46,
            0.82
          ],
          [
            0.46,
            0.82
          ],
          [
            0.46,
            0.82
          ]
        ],
        "id": "port-gun-3-barrel",
        "label": "좌현 3번 포신",
        "kind": "barrel",
        "x": -177,
        "y": 290,
        "w": 25.11,
        "h": 80.352,
        "pivot": [
          0.46,
          0.82
        ],
        "angle": 0,
        "parent": "port-gun-3",
        "recoilDistance": 8,
        "recoilPeriod": 2.9,
        "phase": 0.6,
        "muzzle": [
          0,
          -65.88864
        ],
        "inheritRotation": true,
        "width": 25.11,
        "height": 80.352,
        "radius": 14
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            105,
            493,
            230,
            214
          ],
          [
            410,
            493,
            230,
            214
          ],
          [
            730,
            493,
            240,
            214
          ]
        ],
        "framePivots": [
          [
            0.48695652173913045,
            0.5373831775700935
          ],
          [
            0.5,
            0.5373831775700935
          ],
          [
            0.5,
            0.5373831775700935
          ]
        ],
        "id": "starboard-gun-1",
        "label": "우현 1번 포좌",
        "kind": "turret",
        "x": 177,
        "y": -200,
        "w": 74.4,
        "h": 66.34,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "load-frame",
        "inheritDamage": false,
        "arc": [
          -1.45,
          1.45
        ],
        "width": 74.4,
        "height": 66.34,
        "radius": 23.219
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            176,
            710,
            90,
            288
          ],
          [
            480,
            710,
            90,
            288
          ],
          [
            800,
            710,
            100,
            288
          ]
        ],
        "framePivots": [
          [
            0.46,
            0.82
          ],
          [
            0.46,
            0.82
          ],
          [
            0.46,
            0.82
          ]
        ],
        "id": "starboard-gun-1-barrel",
        "label": "우현 1번 포신",
        "kind": "barrel",
        "x": 177,
        "y": -200,
        "w": 25.11,
        "h": 80.352,
        "pivot": [
          0.46,
          0.82
        ],
        "angle": 0,
        "parent": "starboard-gun-1",
        "recoilDistance": 8,
        "recoilPeriod": 2.9,
        "phase": 0.6,
        "muzzle": [
          0,
          -65.88864
        ],
        "inheritRotation": true,
        "width": 25.11,
        "height": 80.352,
        "radius": 14
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            105,
            493,
            230,
            214
          ],
          [
            410,
            493,
            230,
            214
          ],
          [
            730,
            493,
            240,
            214
          ]
        ],
        "framePivots": [
          [
            0.48695652173913045,
            0.5373831775700935
          ],
          [
            0.5,
            0.5373831775700935
          ],
          [
            0.5,
            0.5373831775700935
          ]
        ],
        "id": "starboard-gun-2",
        "label": "우현 2번 포좌",
        "kind": "turret",
        "x": 177,
        "y": 30,
        "w": 74.4,
        "h": 66.34,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "load-frame",
        "inheritDamage": false,
        "arc": [
          -1.45,
          1.45
        ],
        "width": 74.4,
        "height": 66.34,
        "radius": 23.219
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            176,
            710,
            90,
            288
          ],
          [
            480,
            710,
            90,
            288
          ],
          [
            800,
            710,
            100,
            288
          ]
        ],
        "framePivots": [
          [
            0.46,
            0.82
          ],
          [
            0.46,
            0.82
          ],
          [
            0.46,
            0.82
          ]
        ],
        "id": "starboard-gun-2-barrel",
        "label": "우현 2번 포신",
        "kind": "barrel",
        "x": 177,
        "y": 30,
        "w": 25.11,
        "h": 80.352,
        "pivot": [
          0.46,
          0.82
        ],
        "angle": 0,
        "parent": "starboard-gun-2",
        "recoilDistance": 8,
        "recoilPeriod": 2.9,
        "phase": 0.6,
        "muzzle": [
          0,
          -65.88864
        ],
        "inheritRotation": true,
        "width": 25.11,
        "height": 80.352,
        "radius": 14
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            105,
            493,
            230,
            214
          ],
          [
            410,
            493,
            230,
            214
          ],
          [
            730,
            493,
            240,
            214
          ]
        ],
        "framePivots": [
          [
            0.48695652173913045,
            0.5373831775700935
          ],
          [
            0.5,
            0.5373831775700935
          ],
          [
            0.5,
            0.5373831775700935
          ]
        ],
        "id": "starboard-gun-3",
        "label": "우현 3번 포좌",
        "kind": "turret",
        "x": 177,
        "y": 290,
        "w": 74.4,
        "h": 66.34,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "load-frame",
        "inheritDamage": false,
        "arc": [
          -1.45,
          1.45
        ],
        "width": 74.4,
        "height": 66.34,
        "radius": 23.219
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            176,
            710,
            90,
            288
          ],
          [
            480,
            710,
            90,
            288
          ],
          [
            800,
            710,
            100,
            288
          ]
        ],
        "framePivots": [
          [
            0.46,
            0.82
          ],
          [
            0.46,
            0.82
          ],
          [
            0.46,
            0.82
          ]
        ],
        "id": "starboard-gun-3-barrel",
        "label": "우현 3번 포신",
        "kind": "barrel",
        "x": 177,
        "y": 290,
        "w": 25.11,
        "h": 80.352,
        "pivot": [
          0.46,
          0.82
        ],
        "angle": 0,
        "parent": "starboard-gun-3",
        "recoilDistance": 8,
        "recoilPeriod": 2.9,
        "phase": 0.6,
        "muzzle": [
          0,
          -65.88864
        ],
        "inheritRotation": true,
        "width": 25.11,
        "height": 80.352,
        "radius": 14
      }
    ]
  },
  "final-leviathan": {
    "id": "final-leviathan",
    "name": "협상국 · 리바이어던 최종형",
    "width": 1500,
    "height": 1150,
    "coordinateSpace": "center",
    "previewPadding": 24,
    "defaultPart": "port-engine-1",
    "images": {
      "structure": "./asset-bank/capital-bosses/leviathan-final-structure.webp",
      "hardware": "./asset-bank/capital-bosses/leviathan-final-hardware.webp",
      "wingsHD": "./asset-bank/capital-bosses/leviathan-wings-hd-20261031.webp",
      "hullHD": "./asset-bank/capital-bosses/leviathan-armored-hull-hd-20261031.webp"
    },
    "illustration": "./asset-bank/capital-bosses/leviathan-final-cutin.webp",
    "previewDamage": {
      "port-wing": "damaged",
      "flying-boat-hull": "damaged",
      "port-float": "destroyed",
      "port-engine-1": "destroyed",
      "port-engine-3": "damaged",
      "port-forward-gun": "destroyed",
      "port-launch-hatch-left": "destroyed",
      "port-escort": "damaged"
    },
    "parts": [
      {
        "atlas": "structure",
        "frames": [
          [
            137,
            864,
            208,
            374
          ],
          [
            524,
            864,
            208,
            374
          ],
          [
            919,
            864,
            208,
            374
          ]
        ],
        "framePivots": [
          [
            0.5,
            0.36631
          ],
          [
            0.5,
            0.36631
          ],
          [
            0.5,
            0.36631
          ]
        ],
        "id": "port-float",
        "label": "좌현 보조 선체",
        "kind": "structure",
        "x": -615,
        "y": 178,
        "w": 210,
        "h": 370,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "width": 210,
        "height": 370,
        "radius": 53.144
      },
      {
        "atlas": "structure",
        "frames": [
          [
            137,
            864,
            208,
            374
          ],
          [
            524,
            864,
            208,
            374
          ],
          [
            919,
            864,
            208,
            374
          ]
        ],
        "framePivots": [
          [
            0.5,
            0.36631
          ],
          [
            0.5,
            0.36631
          ],
          [
            0.5,
            0.36631
          ]
        ],
        "id": "starboard-float",
        "label": "우현 보조 선체",
        "kind": "structure",
        "x": 615,
        "y": 178,
        "w": 210,
        "h": 370,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "width": 210,
        "height": 370,
        "radius": 53.144
      },
      {
        "atlas": "wingsHD",
        "frames": [
          [
            15,
            15,
            1224,
            455
          ],
          [
            15,
            475,
            1224,
            438
          ],
          [
            15,
            913,
            1224,
            341
          ]
        ],
        "id": "port-wing",
        "label": "좌현 삼중 주익",
        "kind": "structure",
        "x": 0,
        "y": -35,
        "w": 1370,
        "h": 620,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "preserveAspect": false,
        "sourceHalf": "left",
        "width": 1370,
        "height": 620,
        "radius": 199.5,
        "framePivots": [
          [
            0.5,
            0.5
          ],
          [
            0.5,
            0.5
          ],
          [
            0.5,
            0.5
          ]
        ]
      },
      {
        "atlas": "wingsHD",
        "frames": [
          [
            15,
            15,
            1224,
            455
          ],
          [
            15,
            475,
            1224,
            438
          ],
          [
            15,
            913,
            1224,
            341
          ]
        ],
        "id": "starboard-wing",
        "label": "우현 삼중 주익",
        "kind": "structure",
        "x": 0,
        "y": -35,
        "w": 1370,
        "h": 620,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "preserveAspect": false,
        "sourceHalf": "right",
        "width": 1370,
        "height": 620,
        "radius": 199.5,
        "framePivots": [
          [
            0.5,
            0.5
          ],
          [
            0.5,
            0.5
          ],
          [
            0.5,
            0.5
          ]
        ]
      },
      {
        "atlas": "hullHD",
        "frames": [
          [
            50,
            0,
            410,
            1115
          ],
          [
            490,
            0,
            410,
            1115
          ],
          [
            940,
            0,
            410,
            1115
          ]
        ],
        "id": "flying-boat-hull",
        "label": "장갑 전함 선체",
        "kind": "structure",
        "x": 0,
        "y": 15,
        "w": 440,
        "h": 980,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "width": 440,
        "height": 980,
        "radius": 94.5,
        "framePivots": [
          [
            0.5,
            0.5
          ],
          [
            0.5,
            0.5
          ],
          [
            0.5,
            0.5
          ]
        ],
        "preserveAspect": false
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            95,
            2,
            216,
            380
          ],
          [
            405,
            2,
            216,
            380
          ],
          [
            717,
            2,
            216,
            380
          ]
        ],
        "framePivots": [
          [
            0.49537037037037035,
            0.5
          ],
          [
            0.5046296296296297,
            0.5
          ],
          [
            0.5046296296296297,
            0.5
          ]
        ],
        "id": "port-engine-1",
        "label": "좌현 1번 기관",
        "kind": "engine",
        "x": -245,
        "y": -28,
        "w": 100,
        "h": 176,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "port-wing",
        "inheritDamage": false,
        "width": 100,
        "height": 176,
        "radius": 27.971999999999998
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            30,
            390,
            334,
            92
          ],
          [
            367,
            390,
            303,
            92
          ],
          [
            672,
            390,
            274,
            92
          ]
        ],
        "framePivots": [
          [
            0.511976,
            0.456522
          ],
          [
            0.478548,
            0.423913
          ],
          [
            0.562044,
            0.402174
          ]
        ],
        "id": "port-engine-1-propeller",
        "label": "좌현 1번 프로펠러",
        "kind": "propeller",
        "x": -245,
        "y": -107.2,
        "w": 150,
        "h": 41.32,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "port-engine-1",
        "speed": 25,
        "phase": 0,
        "width": 150,
        "height": 41.32,
        "radius": 14
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            95,
            2,
            216,
            380
          ],
          [
            405,
            2,
            216,
            380
          ],
          [
            717,
            2,
            216,
            380
          ]
        ],
        "framePivots": [
          [
            0.49537037037037035,
            0.5
          ],
          [
            0.5046296296296297,
            0.5
          ],
          [
            0.5046296296296297,
            0.5
          ]
        ],
        "id": "port-engine-2",
        "label": "좌현 2번 기관",
        "kind": "engine",
        "x": -410,
        "y": -28,
        "w": 100,
        "h": 176,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "port-wing",
        "inheritDamage": false,
        "width": 100,
        "height": 176,
        "radius": 27.971999999999998
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            30,
            390,
            334,
            92
          ],
          [
            367,
            390,
            303,
            92
          ],
          [
            672,
            390,
            274,
            92
          ]
        ],
        "framePivots": [
          [
            0.511976,
            0.456522
          ],
          [
            0.478548,
            0.423913
          ],
          [
            0.562044,
            0.402174
          ]
        ],
        "id": "port-engine-2-propeller",
        "label": "좌현 2번 프로펠러",
        "kind": "propeller",
        "x": -410,
        "y": -107.2,
        "w": 150,
        "h": 41.32,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "port-engine-2",
        "speed": 27,
        "phase": 0,
        "width": 150,
        "height": 41.32,
        "radius": 14
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            95,
            2,
            216,
            380
          ],
          [
            405,
            2,
            216,
            380
          ],
          [
            717,
            2,
            216,
            380
          ]
        ],
        "framePivots": [
          [
            0.49537037037037035,
            0.5
          ],
          [
            0.5046296296296297,
            0.5
          ],
          [
            0.5046296296296297,
            0.5
          ]
        ],
        "id": "port-engine-3",
        "label": "좌현 3번 기관",
        "kind": "engine",
        "x": -570,
        "y": -28,
        "w": 100,
        "h": 176,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "port-wing",
        "inheritDamage": false,
        "width": 100,
        "height": 176,
        "radius": 27.971999999999998
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            30,
            390,
            334,
            92
          ],
          [
            367,
            390,
            303,
            92
          ],
          [
            672,
            390,
            274,
            92
          ]
        ],
        "framePivots": [
          [
            0.511976,
            0.456522
          ],
          [
            0.478548,
            0.423913
          ],
          [
            0.562044,
            0.402174
          ]
        ],
        "id": "port-engine-3-propeller",
        "label": "좌현 3번 프로펠러",
        "kind": "propeller",
        "x": -570,
        "y": -107.2,
        "w": 150,
        "h": 41.32,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "port-engine-3",
        "speed": 29,
        "phase": 0,
        "width": 150,
        "height": 41.32,
        "radius": 14
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            95,
            2,
            216,
            380
          ],
          [
            405,
            2,
            216,
            380
          ],
          [
            717,
            2,
            216,
            380
          ]
        ],
        "framePivots": [
          [
            0.49537037037037035,
            0.5
          ],
          [
            0.5046296296296297,
            0.5
          ],
          [
            0.5046296296296297,
            0.5
          ]
        ],
        "id": "starboard-engine-1",
        "label": "우현 1번 기관",
        "kind": "engine",
        "x": 245,
        "y": -28,
        "w": 100,
        "h": 176,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "starboard-wing",
        "inheritDamage": false,
        "width": 100,
        "height": 176,
        "radius": 27.971999999999998
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            30,
            390,
            334,
            92
          ],
          [
            367,
            390,
            303,
            92
          ],
          [
            672,
            390,
            274,
            92
          ]
        ],
        "framePivots": [
          [
            0.511976,
            0.456522
          ],
          [
            0.478548,
            0.423913
          ],
          [
            0.562044,
            0.402174
          ]
        ],
        "id": "starboard-engine-1-propeller",
        "label": "우현 1번 프로펠러",
        "kind": "propeller",
        "x": 245,
        "y": -107.2,
        "w": 150,
        "h": 41.32,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "starboard-engine-1",
        "speed": 25,
        "phase": 0,
        "width": 150,
        "height": 41.32,
        "radius": 14
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            95,
            2,
            216,
            380
          ],
          [
            405,
            2,
            216,
            380
          ],
          [
            717,
            2,
            216,
            380
          ]
        ],
        "framePivots": [
          [
            0.49537037037037035,
            0.5
          ],
          [
            0.5046296296296297,
            0.5
          ],
          [
            0.5046296296296297,
            0.5
          ]
        ],
        "id": "starboard-engine-2",
        "label": "우현 2번 기관",
        "kind": "engine",
        "x": 410,
        "y": -28,
        "w": 100,
        "h": 176,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "starboard-wing",
        "inheritDamage": false,
        "width": 100,
        "height": 176,
        "radius": 27.971999999999998
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            30,
            390,
            334,
            92
          ],
          [
            367,
            390,
            303,
            92
          ],
          [
            672,
            390,
            274,
            92
          ]
        ],
        "framePivots": [
          [
            0.511976,
            0.456522
          ],
          [
            0.478548,
            0.423913
          ],
          [
            0.562044,
            0.402174
          ]
        ],
        "id": "starboard-engine-2-propeller",
        "label": "우현 2번 프로펠러",
        "kind": "propeller",
        "x": 410,
        "y": -107.2,
        "w": 150,
        "h": 41.32,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "starboard-engine-2",
        "speed": 27,
        "phase": 0,
        "width": 150,
        "height": 41.32,
        "radius": 14
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            95,
            2,
            216,
            380
          ],
          [
            405,
            2,
            216,
            380
          ],
          [
            717,
            2,
            216,
            380
          ]
        ],
        "framePivots": [
          [
            0.49537037037037035,
            0.5
          ],
          [
            0.5046296296296297,
            0.5
          ],
          [
            0.5046296296296297,
            0.5
          ]
        ],
        "id": "starboard-engine-3",
        "label": "우현 3번 기관",
        "kind": "engine",
        "x": 570,
        "y": -28,
        "w": 100,
        "h": 176,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "starboard-wing",
        "inheritDamage": false,
        "width": 100,
        "height": 176,
        "radius": 27.971999999999998
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            30,
            390,
            334,
            92
          ],
          [
            367,
            390,
            303,
            92
          ],
          [
            672,
            390,
            274,
            92
          ]
        ],
        "framePivots": [
          [
            0.511976,
            0.456522
          ],
          [
            0.478548,
            0.423913
          ],
          [
            0.562044,
            0.402174
          ]
        ],
        "id": "starboard-engine-3-propeller",
        "label": "우현 3번 프로펠러",
        "kind": "propeller",
        "x": 570,
        "y": -107.2,
        "w": 150,
        "h": 41.32,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "starboard-engine-3",
        "speed": 29,
        "phase": 0,
        "width": 150,
        "height": 41.32,
        "radius": 14
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            70,
            1000,
            264,
            203
          ],
          [
            381,
            1000,
            264,
            203
          ],
          [
            692,
            1000,
            264,
            203
          ]
        ],
        "id": "port-launch-hatch-left",
        "label": "좌현 출격갑판 좌문",
        "kind": "door",
        "x": -350,
        "y": -215,
        "w": 180,
        "h": 138.4,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "port-wing",
        "inheritDamage": false,
        "sourceHalf": "left",
        "side": "left",
        "travel": 82.8,
        "phase": 0,
        "width": 180,
        "height": 138.4,
        "radius": 35.525
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            70,
            1000,
            264,
            203
          ],
          [
            381,
            1000,
            264,
            203
          ],
          [
            692,
            1000,
            264,
            203
          ]
        ],
        "id": "port-launch-hatch-right",
        "label": "좌현 출격갑판 우문",
        "kind": "door",
        "x": -350,
        "y": -215,
        "w": 180,
        "h": 138.4,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "port-wing",
        "inheritDamage": false,
        "sourceHalf": "right",
        "side": "right",
        "travel": 82.8,
        "phase": 0,
        "width": 180,
        "height": 138.4,
        "radius": 35.525
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            33,
            1213,
            332,
            298
          ],
          [
            365,
            1213,
            305,
            298
          ],
          [
            677,
            1213,
            320,
            298
          ]
        ],
        "framePivots": [
          [
            0.5,
            0.5
          ],
          [
            0.49,
            0.5
          ],
          [
            0.47,
            0.5
          ]
        ],
        "id": "port-escort",
        "label": "좌현 호위기",
        "kind": "fighter",
        "x": -350,
        "y": -210,
        "w": 112.88000000000001,
        "h": 101.32000000000001,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "dependencies": [
          "port-launch-hatch-left",
          "port-launch-hatch-right",
          "port-wing"
        ],
        "launchPeriod": 8.5,
        "launchDistance": 150,
        "phase": 0,
        "width": 112.88000000000001,
        "height": 101.32000000000001,
        "radius": 35.462
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            70,
            1000,
            264,
            203
          ],
          [
            381,
            1000,
            264,
            203
          ],
          [
            692,
            1000,
            264,
            203
          ]
        ],
        "id": "starboard-launch-hatch-left",
        "label": "우현 출격갑판 좌문",
        "kind": "door",
        "x": 350,
        "y": -215,
        "w": 180,
        "h": 138.4,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "starboard-wing",
        "inheritDamage": false,
        "sourceHalf": "left",
        "side": "left",
        "travel": 82.8,
        "phase": 0,
        "width": 180,
        "height": 138.4,
        "radius": 35.525
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            70,
            1000,
            264,
            203
          ],
          [
            381,
            1000,
            264,
            203
          ],
          [
            692,
            1000,
            264,
            203
          ]
        ],
        "id": "starboard-launch-hatch-right",
        "label": "우현 출격갑판 우문",
        "kind": "door",
        "x": 350,
        "y": -215,
        "w": 180,
        "h": 138.4,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "starboard-wing",
        "inheritDamage": false,
        "sourceHalf": "right",
        "side": "right",
        "travel": 82.8,
        "phase": 0,
        "width": 180,
        "height": 138.4,
        "radius": 35.525
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            33,
            1213,
            332,
            298
          ],
          [
            365,
            1213,
            305,
            298
          ],
          [
            677,
            1213,
            320,
            298
          ]
        ],
        "framePivots": [
          [
            0.5,
            0.5
          ],
          [
            0.49,
            0.5
          ],
          [
            0.47,
            0.5
          ]
        ],
        "id": "starboard-escort",
        "label": "우현 호위기",
        "kind": "fighter",
        "x": 350,
        "y": -210,
        "w": 112.88000000000001,
        "h": 101.32000000000001,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "dependencies": [
          "starboard-launch-hatch-left",
          "starboard-launch-hatch-right",
          "starboard-wing"
        ],
        "launchPeriod": 8.5,
        "launchDistance": 150,
        "phase": 0,
        "width": 112.88000000000001,
        "height": 101.32000000000001,
        "radius": 35.462
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            87,
            491,
            230,
            204
          ],
          [
            397,
            491,
            230,
            204
          ],
          [
            710,
            491,
            230,
            204
          ]
        ],
        "framePivots": [
          [
            0.5,
            0.622549
          ],
          [
            0.5,
            0.622549
          ],
          [
            0.504348,
            0.622549
          ]
        ],
        "id": "bow-gun",
        "label": "선수 쌍열 주포",
        "kind": "turret",
        "x": 0,
        "y": -345,
        "w": 125,
        "h": 110.87,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "flying-boat-hull",
        "inheritDamage": false,
        "arc": [
          -1.5,
          1.5
        ],
        "width": 125,
        "height": 110.87,
        "radius": 23.562
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            157,
            700,
            90,
            296
          ],
          [
            467,
            700,
            90,
            296
          ],
          [
            780,
            700,
            90,
            296
          ]
        ],
        "framePivots": [
          [
            0.5,
            0.82
          ],
          [
            0.5,
            0.82
          ],
          [
            0.5,
            0.82
          ]
        ],
        "id": "bow-gun-barrel",
        "label": "선수 쌍열 포신",
        "kind": "barrel",
        "x": 0,
        "y": -345,
        "w": 43.17567567567568,
        "h": 142,
        "pivot": [
          0.5,
          0.82
        ],
        "angle": 0,
        "parent": "bow-gun",
        "recoilDistance": 8,
        "recoilPeriod": 2.9,
        "phase": 0.6,
        "muzzle": [
          0,
          -116.44
        ],
        "inheritRotation": true,
        "width": 43.17567567567568,
        "height": 142,
        "radius": 14,
        "barrelOffsets": [
          -10,
          10
        ]
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            87,
            491,
            230,
            204
          ],
          [
            397,
            491,
            230,
            204
          ],
          [
            710,
            491,
            230,
            204
          ]
        ],
        "framePivots": [
          [
            0.5,
            0.622549
          ],
          [
            0.5,
            0.622549
          ],
          [
            0.504348,
            0.622549
          ]
        ],
        "id": "stern-gun",
        "label": "선미 쌍열 주포",
        "kind": "turret",
        "x": 0,
        "y": 337,
        "w": 125,
        "h": 110.87,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "flying-boat-hull",
        "inheritDamage": false,
        "arc": [
          -1.6,
          1.6
        ],
        "width": 125,
        "height": 110.87,
        "radius": 23.562
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            157,
            700,
            90,
            296
          ],
          [
            467,
            700,
            90,
            296
          ],
          [
            780,
            700,
            90,
            296
          ]
        ],
        "framePivots": [
          [
            0.5,
            0.82
          ],
          [
            0.5,
            0.82
          ],
          [
            0.5,
            0.82
          ]
        ],
        "id": "stern-gun-barrel",
        "label": "선미 쌍열 포신",
        "kind": "barrel",
        "x": 0,
        "y": 337,
        "w": 43.17567567567568,
        "h": 142,
        "pivot": [
          0.5,
          0.82
        ],
        "angle": 0,
        "parent": "stern-gun",
        "recoilDistance": 8,
        "recoilPeriod": 2.9,
        "phase": 0.6,
        "muzzle": [
          0,
          -116.44
        ],
        "inheritRotation": true,
        "width": 43.17567567567568,
        "height": 142,
        "radius": 14,
        "barrelOffsets": [
          -10,
          10
        ]
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            87,
            491,
            230,
            204
          ],
          [
            397,
            491,
            230,
            204
          ],
          [
            710,
            491,
            230,
            204
          ]
        ],
        "framePivots": [
          [
            0.5,
            0.622549
          ],
          [
            0.5,
            0.622549
          ],
          [
            0.504348,
            0.622549
          ]
        ],
        "id": "port-forward-gun",
        "label": "좌현 전방 포좌",
        "kind": "turret",
        "x": -530,
        "y": -205,
        "w": 90,
        "h": 79.83,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "port-wing",
        "inheritDamage": false,
        "arc": [
          -1.5,
          1.5
        ],
        "width": 90,
        "height": 79.83,
        "radius": 21.419999999999998
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            157,
            700,
            90,
            296
          ],
          [
            467,
            700,
            90,
            296
          ],
          [
            780,
            700,
            90,
            296
          ]
        ],
        "framePivots": [
          [
            0.5,
            0.82
          ],
          [
            0.5,
            0.82
          ],
          [
            0.5,
            0.82
          ]
        ],
        "id": "port-forward-gun-barrel",
        "label": "좌현 전방 포신",
        "kind": "barrel",
        "x": -530,
        "y": -205,
        "w": 31.925675675675677,
        "h": 105,
        "pivot": [
          0.5,
          0.82
        ],
        "angle": 0,
        "parent": "port-forward-gun",
        "recoilDistance": 8,
        "recoilPeriod": 2.9,
        "phase": 0.6,
        "muzzle": [
          0,
          -86.1
        ],
        "inheritRotation": true,
        "width": 31.925675675675677,
        "height": 105,
        "radius": 14
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            87,
            491,
            230,
            204
          ],
          [
            397,
            491,
            230,
            204
          ],
          [
            710,
            491,
            230,
            204
          ]
        ],
        "framePivots": [
          [
            0.5,
            0.622549
          ],
          [
            0.5,
            0.622549
          ],
          [
            0.504348,
            0.622549
          ]
        ],
        "id": "starboard-forward-gun",
        "label": "우현 전방 포좌",
        "kind": "turret",
        "x": 530,
        "y": -205,
        "w": 90,
        "h": 79.83,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "starboard-wing",
        "inheritDamage": false,
        "arc": [
          -1.5,
          1.5
        ],
        "width": 90,
        "height": 79.83,
        "radius": 21.419999999999998
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            157,
            700,
            90,
            296
          ],
          [
            467,
            700,
            90,
            296
          ],
          [
            780,
            700,
            90,
            296
          ]
        ],
        "framePivots": [
          [
            0.5,
            0.82
          ],
          [
            0.5,
            0.82
          ],
          [
            0.5,
            0.82
          ]
        ],
        "id": "starboard-forward-gun-barrel",
        "label": "우현 전방 포신",
        "kind": "barrel",
        "x": 530,
        "y": -205,
        "w": 31.925675675675677,
        "h": 105,
        "pivot": [
          0.5,
          0.82
        ],
        "angle": 0,
        "parent": "starboard-forward-gun",
        "recoilDistance": 8,
        "recoilPeriod": 2.9,
        "phase": 0.6,
        "muzzle": [
          0,
          -86.1
        ],
        "inheritRotation": true,
        "width": 31.925675675675677,
        "height": 105,
        "radius": 14
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            87,
            491,
            230,
            204
          ],
          [
            397,
            491,
            230,
            204
          ],
          [
            710,
            491,
            230,
            204
          ]
        ],
        "framePivots": [
          [
            0.5,
            0.622549
          ],
          [
            0.5,
            0.622549
          ],
          [
            0.504348,
            0.622549
          ]
        ],
        "id": "port-aft-gun",
        "label": "좌현 후방 포좌",
        "kind": "turret",
        "x": -285,
        "y": 183,
        "w": 90,
        "h": 79.83,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "port-wing",
        "inheritDamage": false,
        "arc": [
          -1.5,
          1.5
        ],
        "width": 90,
        "height": 79.83,
        "radius": 21.419999999999998
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            157,
            700,
            90,
            296
          ],
          [
            467,
            700,
            90,
            296
          ],
          [
            780,
            700,
            90,
            296
          ]
        ],
        "framePivots": [
          [
            0.5,
            0.82
          ],
          [
            0.5,
            0.82
          ],
          [
            0.5,
            0.82
          ]
        ],
        "id": "port-aft-gun-barrel",
        "label": "좌현 후방 포신",
        "kind": "barrel",
        "x": -285,
        "y": 183,
        "w": 31.925675675675677,
        "h": 105,
        "pivot": [
          0.5,
          0.82
        ],
        "angle": 0,
        "parent": "port-aft-gun",
        "recoilDistance": 8,
        "recoilPeriod": 2.9,
        "phase": 0.6,
        "muzzle": [
          0,
          -86.1
        ],
        "inheritRotation": true,
        "width": 31.925675675675677,
        "height": 105,
        "radius": 14
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            87,
            491,
            230,
            204
          ],
          [
            397,
            491,
            230,
            204
          ],
          [
            710,
            491,
            230,
            204
          ]
        ],
        "framePivots": [
          [
            0.5,
            0.622549
          ],
          [
            0.5,
            0.622549
          ],
          [
            0.504348,
            0.622549
          ]
        ],
        "id": "starboard-aft-gun",
        "label": "우현 후방 포좌",
        "kind": "turret",
        "x": 285,
        "y": 183,
        "w": 90,
        "h": 79.83,
        "pivot": [
          0.5,
          0.5
        ],
        "angle": 0,
        "parent": "starboard-wing",
        "inheritDamage": false,
        "arc": [
          -1.5,
          1.5
        ],
        "width": 90,
        "height": 79.83,
        "radius": 21.419999999999998
      },
      {
        "atlas": "hardware",
        "frames": [
          [
            157,
            700,
            90,
            296
          ],
          [
            467,
            700,
            90,
            296
          ],
          [
            780,
            700,
            90,
            296
          ]
        ],
        "framePivots": [
          [
            0.5,
            0.82
          ],
          [
            0.5,
            0.82
          ],
          [
            0.5,
            0.82
          ]
        ],
        "id": "starboard-aft-gun-barrel",
        "label": "우현 후방 포신",
        "kind": "barrel",
        "x": 285,
        "y": 183,
        "w": 31.925675675675677,
        "h": 105,
        "pivot": [
          0.5,
          0.82
        ],
        "angle": 0,
        "parent": "starboard-aft-gun",
        "recoilDistance": 8,
        "recoilPeriod": 2.9,
        "phase": 0.6,
        "muzzle": [
          0,
          -86.1
        ],
        "inheritRotation": true,
        "width": 31.925675675675677,
        "height": 105,
        "radius": 14
      }
    ]
  }
});

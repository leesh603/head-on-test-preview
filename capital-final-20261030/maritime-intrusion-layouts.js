/** Independent fictional WWI-inspired naval designs. Native pixels centered on hull, bow up.
 * Whole gun assemblies rotate; destroyed assemblies remain fixed. Muzzles are measured from source art. */
export const maritimeLayouts = {
  "dreadnought": {
    "id": "dreadnought",
    "width": 432,
    "height": 1536,
    "enabled": true,
    "domain": "sea",
    "parts": [
      {
        "id": "fixed_base",
        "kind": "base",
        "group": "fixed_base",
        "x": -216.0,
        "y": -768.0,
        "pivot": [
          0,
          0
        ],
        "angle": 0,
        "dependencies": [],
        "phase": 0,
        "arc": 0,
        "width": 432,
        "height": 1536,
        "states": {
          "intact": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/dreadnought/hull.webp",
            "pivot": [
              0,
              0
            ],
            "x": -216.0,
            "y": -768.0,
            "width": 432,
            "height": 1536
          }
        }
      },
      {
        "id": "main_fore",
        "kind": "turret_body",
        "group": "main_fore",
        "x": 0.0,
        "y": -504.0,
        "pivot": [
          240,
          390
        ],
        "angle": 0,
        "dependencies": [],
        "phase": 0,
        "states": {
          "intact": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/dreadnought/main-normal.webp",
            "pivot": [
              240,
              390
            ],
            "x": 0.0,
            "y": -504.0,
            "width": 480,
            "height": 600
          },
          "damaged": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/dreadnought/main-damaged.webp",
            "pivot": [
              240,
              390
            ],
            "x": 0.0,
            "y": -504.0,
            "width": 480,
            "height": 600
          },
          "destroyed": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/dreadnought/main-destroyed.webp",
            "pivot": [
              240,
              390
            ],
            "x": 0.0,
            "y": -504.0,
            "width": 480,
            "height": 600
          }
        },
        "arc": 2.2,
        "width": 480,
        "height": 600,
        "spriteScale": 0.235,
        "rotatesWithTurret": true,
        "destroyedRotates": false,
        "muzzle": {
          "x": -11.045,
          "y": -577.085,
          "angle": -1.5707963267948966,
          "arc": 2.2,
          "pivotX": 0.0,
          "pivotY": -504.0
        },
        "muzzles": [
          {
            "x": -11.045,
            "y": -577.085,
            "angle": -1.5707963267948966,
            "arc": 2.2,
            "pivotX": 0.0,
            "pivotY": -504.0
          },
          {
            "x": 11.75,
            "y": -577.085,
            "angle": -1.5707963267948966,
            "arc": 2.2,
            "pivotX": 0.0,
            "pivotY": -504.0
          }
        ],
        "damagedMuzzles": [
          {
            "x": -11.045,
            "y": -577.085,
            "angle": -1.5707963267948966,
            "arc": 2.2,
            "pivotX": 0.0,
            "pivotY": -504.0
          }
        ]
      },
      {
        "id": "main_mid",
        "kind": "turret_body",
        "group": "main_mid",
        "x": 0.0,
        "y": -366.0,
        "pivot": [
          240,
          390
        ],
        "angle": 0,
        "dependencies": [],
        "phase": 0,
        "states": {
          "intact": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/dreadnought/main-normal.webp",
            "pivot": [
              240,
              390
            ],
            "x": 0.0,
            "y": -366.0,
            "width": 480,
            "height": 600
          },
          "damaged": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/dreadnought/main-damaged.webp",
            "pivot": [
              240,
              390
            ],
            "x": 0.0,
            "y": -366.0,
            "width": 480,
            "height": 600
          },
          "destroyed": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/dreadnought/main-destroyed.webp",
            "pivot": [
              240,
              390
            ],
            "x": 0.0,
            "y": -366.0,
            "width": 480,
            "height": 600
          }
        },
        "arc": 2.2,
        "width": 480,
        "height": 600,
        "spriteScale": 0.235,
        "rotatesWithTurret": true,
        "destroyedRotates": false,
        "muzzle": {
          "x": -11.045,
          "y": -439.085,
          "angle": -1.5707963267948966,
          "arc": 2.2,
          "pivotX": 0.0,
          "pivotY": -366.0
        },
        "muzzles": [
          {
            "x": -11.045,
            "y": -439.085,
            "angle": -1.5707963267948966,
            "arc": 2.2,
            "pivotX": 0.0,
            "pivotY": -366.0
          },
          {
            "x": 11.75,
            "y": -439.085,
            "angle": -1.5707963267948966,
            "arc": 2.2,
            "pivotX": 0.0,
            "pivotY": -366.0
          }
        ],
        "damagedMuzzles": [
          {
            "x": -11.045,
            "y": -439.085,
            "angle": -1.5707963267948966,
            "arc": 2.2,
            "pivotX": 0.0,
            "pivotY": -366.0
          }
        ]
      },
      {
        "id": "main_aft",
        "kind": "turret_body",
        "group": "main_aft",
        "x": 0.0,
        "y": 317.0,
        "pivot": [
          240,
          390
        ],
        "angle": 3.141592653589793,
        "dependencies": [],
        "phase": 0,
        "states": {
          "intact": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/dreadnought/main-normal.webp",
            "pivot": [
              240,
              390
            ],
            "x": 0.0,
            "y": 317.0,
            "width": 480,
            "height": 600
          },
          "damaged": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/dreadnought/main-damaged.webp",
            "pivot": [
              240,
              390
            ],
            "x": 0.0,
            "y": 317.0,
            "width": 480,
            "height": 600
          },
          "destroyed": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/dreadnought/main-destroyed.webp",
            "pivot": [
              240,
              390
            ],
            "x": 0.0,
            "y": 317.0,
            "width": 480,
            "height": 600
          }
        },
        "arc": 2.2,
        "width": 480,
        "height": 600,
        "spriteScale": 0.235,
        "rotatesWithTurret": true,
        "destroyedRotates": false,
        "muzzle": {
          "x": 11.045,
          "y": 390.085,
          "angle": 1.5707963267948966,
          "arc": 2.2,
          "pivotX": 0.0,
          "pivotY": 317.0
        },
        "muzzles": [
          {
            "x": 11.045,
            "y": 390.085,
            "angle": 1.5707963267948966,
            "arc": 2.2,
            "pivotX": 0.0,
            "pivotY": 317.0
          },
          {
            "x": -11.75,
            "y": 390.085,
            "angle": 1.5707963267948966,
            "arc": 2.2,
            "pivotX": 0.0,
            "pivotY": 317.0
          }
        ],
        "damagedMuzzles": [
          {
            "x": 11.045,
            "y": 390.085,
            "angle": 1.5707963267948966,
            "arc": 2.2,
            "pivotX": 0.0,
            "pivotY": 317.0
          }
        ]
      },
      {
        "id": "aa_port_fore",
        "kind": "anti_air",
        "group": "aa_port_fore",
        "x": -107.0,
        "y": -185.0,
        "pivot": [
          170,
          290
        ],
        "angle": -1.5707963267948966,
        "dependencies": [],
        "phase": 0,
        "states": {
          "intact": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/dreadnought/aa-normal.webp",
            "pivot": [
              170,
              290
            ],
            "x": -107.0,
            "y": -185.0,
            "width": 340,
            "height": 430
          },
          "damaged": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/dreadnought/aa-damaged.webp",
            "pivot": [
              170,
              290
            ],
            "x": -107.0,
            "y": -185.0,
            "width": 340,
            "height": 430
          },
          "destroyed": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/dreadnought/aa-destroyed.webp",
            "pivot": [
              170,
              290
            ],
            "x": -107.0,
            "y": -185.0,
            "width": 340,
            "height": 430
          }
        },
        "arc": 1.3,
        "width": 340,
        "height": 430,
        "spriteScale": 0.192,
        "rotatesWithTurret": true,
        "destroyedRotates": false,
        "muzzle": {
          "x": -153.272,
          "y": -185.0,
          "angle": -3.141592653589793,
          "arc": 1.3,
          "pivotX": -107.0,
          "pivotY": -185.0
        },
        "muzzles": [
          {
            "x": -153.272,
            "y": -185.0,
            "angle": -3.141592653589793,
            "arc": 1.3,
            "pivotX": -107.0,
            "pivotY": -185.0
          }
        ],
        "damagedMuzzles": []
      },
      {
        "id": "aa_starboard_fore",
        "kind": "anti_air",
        "group": "aa_starboard_fore",
        "x": 108.0,
        "y": -185.0,
        "pivot": [
          170,
          290
        ],
        "angle": 1.5707963267948966,
        "dependencies": [],
        "phase": 0,
        "states": {
          "intact": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/dreadnought/aa-normal.webp",
            "pivot": [
              170,
              290
            ],
            "x": 108.0,
            "y": -185.0,
            "width": 340,
            "height": 430
          },
          "damaged": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/dreadnought/aa-damaged.webp",
            "pivot": [
              170,
              290
            ],
            "x": 108.0,
            "y": -185.0,
            "width": 340,
            "height": 430
          },
          "destroyed": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/dreadnought/aa-destroyed.webp",
            "pivot": [
              170,
              290
            ],
            "x": 108.0,
            "y": -185.0,
            "width": 340,
            "height": 430
          }
        },
        "arc": 1.3,
        "width": 340,
        "height": 430,
        "spriteScale": 0.192,
        "rotatesWithTurret": true,
        "destroyedRotates": false,
        "muzzle": {
          "x": 154.272,
          "y": -185.0,
          "angle": 0.0,
          "arc": 1.3,
          "pivotX": 108.0,
          "pivotY": -185.0
        },
        "muzzles": [
          {
            "x": 154.272,
            "y": -185.0,
            "angle": 0.0,
            "arc": 1.3,
            "pivotX": 108.0,
            "pivotY": -185.0
          }
        ],
        "damagedMuzzles": []
      },
      {
        "id": "aa_port_aft",
        "kind": "anti_air",
        "group": "aa_port_aft",
        "x": -108.0,
        "y": 332.0,
        "pivot": [
          170,
          290
        ],
        "angle": -1.5707963267948966,
        "dependencies": [],
        "phase": 0,
        "states": {
          "intact": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/dreadnought/aa-normal.webp",
            "pivot": [
              170,
              290
            ],
            "x": -108.0,
            "y": 332.0,
            "width": 340,
            "height": 430
          },
          "damaged": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/dreadnought/aa-damaged.webp",
            "pivot": [
              170,
              290
            ],
            "x": -108.0,
            "y": 332.0,
            "width": 340,
            "height": 430
          },
          "destroyed": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/dreadnought/aa-destroyed.webp",
            "pivot": [
              170,
              290
            ],
            "x": -108.0,
            "y": 332.0,
            "width": 340,
            "height": 430
          }
        },
        "arc": 1.3,
        "width": 340,
        "height": 430,
        "spriteScale": 0.192,
        "rotatesWithTurret": true,
        "destroyedRotates": false,
        "muzzle": {
          "x": -154.272,
          "y": 332.0,
          "angle": -3.141592653589793,
          "arc": 1.3,
          "pivotX": -108.0,
          "pivotY": 332.0
        },
        "muzzles": [
          {
            "x": -154.272,
            "y": 332.0,
            "angle": -3.141592653589793,
            "arc": 1.3,
            "pivotX": -108.0,
            "pivotY": 332.0
          }
        ],
        "damagedMuzzles": []
      },
      {
        "id": "aa_starboard_aft",
        "kind": "anti_air",
        "group": "aa_starboard_aft",
        "x": 108.0,
        "y": 332.0,
        "pivot": [
          170,
          290
        ],
        "angle": 1.5707963267948966,
        "dependencies": [],
        "phase": 0,
        "states": {
          "intact": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/dreadnought/aa-normal.webp",
            "pivot": [
              170,
              290
            ],
            "x": 108.0,
            "y": 332.0,
            "width": 340,
            "height": 430
          },
          "damaged": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/dreadnought/aa-damaged.webp",
            "pivot": [
              170,
              290
            ],
            "x": 108.0,
            "y": 332.0,
            "width": 340,
            "height": 430
          },
          "destroyed": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/dreadnought/aa-destroyed.webp",
            "pivot": [
              170,
              290
            ],
            "x": 108.0,
            "y": 332.0,
            "width": 340,
            "height": 430
          }
        },
        "arc": 1.3,
        "width": 340,
        "height": 430,
        "spriteScale": 0.192,
        "rotatesWithTurret": true,
        "destroyedRotates": false,
        "muzzle": {
          "x": 154.272,
          "y": 332.0,
          "angle": 0.0,
          "arc": 1.3,
          "pivotX": 108.0,
          "pivotY": 332.0
        },
        "muzzles": [
          {
            "x": 154.272,
            "y": 332.0,
            "angle": 0.0,
            "arc": 1.3,
            "pivotX": 108.0,
            "pivotY": 332.0
          }
        ],
        "damagedMuzzles": []
      }
    ],
    "targets": [
      {
        "id": "core",
        "kind": "core",
        "x": 0,
        "y": 0,
        "rx": 172.8,
        "ry": 706.5600000000001,
        "angle": 0,
        "dependencies": []
      },
      {
        "id": "main_fore",
        "kind": "turret_body",
        "x": 0.0,
        "y": -504.0,
        "rx": 43,
        "ry": 43,
        "angle": 0,
        "dependencies": [],
        "muzzle": {
          "x": -11.045,
          "y": -577.085,
          "angle": -1.5707963267948966,
          "arc": 2.2,
          "pivotX": 0.0,
          "pivotY": -504.0
        },
        "muzzles": [
          {
            "x": -11.045,
            "y": -577.085,
            "angle": -1.5707963267948966,
            "arc": 2.2,
            "pivotX": 0.0,
            "pivotY": -504.0
          },
          {
            "x": 11.75,
            "y": -577.085,
            "angle": -1.5707963267948966,
            "arc": 2.2,
            "pivotX": 0.0,
            "pivotY": -504.0
          }
        ],
        "damagedMuzzles": [
          {
            "x": -11.045,
            "y": -577.085,
            "angle": -1.5707963267948966,
            "arc": 2.2,
            "pivotX": 0.0,
            "pivotY": -504.0
          }
        ]
      },
      {
        "id": "main_mid",
        "kind": "turret_body",
        "x": 0.0,
        "y": -366.0,
        "rx": 43,
        "ry": 43,
        "angle": 0,
        "dependencies": [],
        "muzzle": {
          "x": -11.045,
          "y": -439.085,
          "angle": -1.5707963267948966,
          "arc": 2.2,
          "pivotX": 0.0,
          "pivotY": -366.0
        },
        "muzzles": [
          {
            "x": -11.045,
            "y": -439.085,
            "angle": -1.5707963267948966,
            "arc": 2.2,
            "pivotX": 0.0,
            "pivotY": -366.0
          },
          {
            "x": 11.75,
            "y": -439.085,
            "angle": -1.5707963267948966,
            "arc": 2.2,
            "pivotX": 0.0,
            "pivotY": -366.0
          }
        ],
        "damagedMuzzles": [
          {
            "x": -11.045,
            "y": -439.085,
            "angle": -1.5707963267948966,
            "arc": 2.2,
            "pivotX": 0.0,
            "pivotY": -366.0
          }
        ]
      },
      {
        "id": "main_aft",
        "kind": "turret_body",
        "x": 0.0,
        "y": 317.0,
        "rx": 43,
        "ry": 43,
        "angle": 0,
        "dependencies": [],
        "muzzle": {
          "x": 11.045,
          "y": 390.085,
          "angle": 1.5707963267948966,
          "arc": 2.2,
          "pivotX": 0.0,
          "pivotY": 317.0
        },
        "muzzles": [
          {
            "x": 11.045,
            "y": 390.085,
            "angle": 1.5707963267948966,
            "arc": 2.2,
            "pivotX": 0.0,
            "pivotY": 317.0
          },
          {
            "x": -11.75,
            "y": 390.085,
            "angle": 1.5707963267948966,
            "arc": 2.2,
            "pivotX": 0.0,
            "pivotY": 317.0
          }
        ],
        "damagedMuzzles": [
          {
            "x": 11.045,
            "y": 390.085,
            "angle": 1.5707963267948966,
            "arc": 2.2,
            "pivotX": 0.0,
            "pivotY": 317.0
          }
        ]
      },
      {
        "id": "aa_port_fore",
        "kind": "anti_air",
        "x": -107.0,
        "y": -185.0,
        "rx": 28,
        "ry": 28,
        "angle": 0,
        "dependencies": [],
        "muzzle": {
          "x": -153.272,
          "y": -185.0,
          "angle": -3.141592653589793,
          "arc": 1.3,
          "pivotX": -107.0,
          "pivotY": -185.0
        },
        "muzzles": [
          {
            "x": -153.272,
            "y": -185.0,
            "angle": -3.141592653589793,
            "arc": 1.3,
            "pivotX": -107.0,
            "pivotY": -185.0
          }
        ],
        "damagedMuzzles": []
      },
      {
        "id": "aa_starboard_fore",
        "kind": "anti_air",
        "x": 108.0,
        "y": -185.0,
        "rx": 28,
        "ry": 28,
        "angle": 0,
        "dependencies": [],
        "muzzle": {
          "x": 154.272,
          "y": -185.0,
          "angle": 0.0,
          "arc": 1.3,
          "pivotX": 108.0,
          "pivotY": -185.0
        },
        "muzzles": [
          {
            "x": 154.272,
            "y": -185.0,
            "angle": 0.0,
            "arc": 1.3,
            "pivotX": 108.0,
            "pivotY": -185.0
          }
        ],
        "damagedMuzzles": []
      },
      {
        "id": "aa_port_aft",
        "kind": "anti_air",
        "x": -108.0,
        "y": 332.0,
        "rx": 28,
        "ry": 28,
        "angle": 0,
        "dependencies": [],
        "muzzle": {
          "x": -154.272,
          "y": 332.0,
          "angle": -3.141592653589793,
          "arc": 1.3,
          "pivotX": -108.0,
          "pivotY": 332.0
        },
        "muzzles": [
          {
            "x": -154.272,
            "y": 332.0,
            "angle": -3.141592653589793,
            "arc": 1.3,
            "pivotX": -108.0,
            "pivotY": 332.0
          }
        ],
        "damagedMuzzles": []
      },
      {
        "id": "aa_starboard_aft",
        "kind": "anti_air",
        "x": 108.0,
        "y": 332.0,
        "rx": 28,
        "ry": 28,
        "angle": 0,
        "dependencies": [],
        "muzzle": {
          "x": 154.272,
          "y": 332.0,
          "angle": 0.0,
          "arc": 1.3,
          "pivotX": 108.0,
          "pivotY": 332.0
        },
        "muzzles": [
          {
            "x": 154.272,
            "y": 332.0,
            "angle": 0.0,
            "arc": 1.3,
            "pivotX": 108.0,
            "pivotY": 332.0
          }
        ],
        "damagedMuzzles": []
      }
    ],
    "cutin": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/dreadnought/cutin.webp",
    "shotOcclusion": {
      "basis": "Deck-height guns: fixed bridge/funnels and other live gun assemblies block low-angle fire; low deck does not.",
      "gunHeights": {
        "main_fore": 1,
        "main_mid": 1,
        "main_aft": 1,
        "aa_port_fore": 1,
        "aa_starboard_fore": 1,
        "aa_port_aft": 1,
        "aa_starboard_aft": 1
      },
      "occluders": [
        {
          "id": "main_fore",
          "x": 0.0,
          "y": -504.0,
          "rx": 43,
          "ry": 43,
          "height": 1,
          "persistent": false
        },
        {
          "id": "main_mid",
          "x": 0.0,
          "y": -366.0,
          "rx": 43,
          "ry": 43,
          "height": 1,
          "persistent": false
        },
        {
          "id": "main_aft",
          "x": 0.0,
          "y": 317.0,
          "rx": 43,
          "ry": 43,
          "height": 1,
          "persistent": false
        },
        {
          "id": "aa_port_fore",
          "x": -107.0,
          "y": -185.0,
          "rx": 28,
          "ry": 28,
          "height": 1,
          "persistent": false
        },
        {
          "id": "aa_starboard_fore",
          "x": 108.0,
          "y": -185.0,
          "rx": 28,
          "ry": 28,
          "height": 1,
          "persistent": false
        },
        {
          "id": "aa_port_aft",
          "x": -108.0,
          "y": 332.0,
          "rx": 28,
          "ry": 28,
          "height": 1,
          "persistent": false
        },
        {
          "id": "aa_starboard_aft",
          "x": 108.0,
          "y": 332.0,
          "rx": 28,
          "ry": 28,
          "height": 1,
          "persistent": false
        },
        {
          "id": "bridge",
          "x": 0.5,
          "y": -208.0,
          "rx": 73.5,
          "ry": 90.0,
          "height": 3,
          "persistent": true
        },
        {
          "id": "funnels",
          "x": 2.0,
          "y": 33.0,
          "rx": 81.0,
          "ry": 143.0,
          "height": 3,
          "persistent": true
        }
      ]
    }
  },
  "nachtwal": {
    "id": "nachtwal",
    "width": 288,
    "height": 1536,
    "enabled": true,
    "domain": "sea",
    "parts": [
      {
        "id": "fixed_base",
        "kind": "base",
        "group": "fixed_base",
        "x": -144.0,
        "y": -768.0,
        "pivot": [
          0,
          0
        ],
        "angle": 0,
        "dependencies": [],
        "phase": 0,
        "arc": 0,
        "width": 288,
        "height": 1536,
        "states": {
          "intact": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/nachtwal/hull.webp",
            "pivot": [
              0,
              0
            ],
            "x": -144.0,
            "y": -768.0,
            "width": 288,
            "height": 1536
          }
        }
      },
      {
        "id": "deck_fore",
        "kind": "turret_body",
        "group": "deck_fore",
        "x": 0.0,
        "y": -447.0,
        "pivot": [
          121.5,
          233
        ],
        "angle": 0.0,
        "dependencies": [],
        "phase": 0,
        "states": {
          "intact": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/nachtwal/deck-gun-normal.webp",
            "pivot": [
              121.5,
              233
            ],
            "x": 0.0,
            "y": -447.0,
            "width": 243,
            "height": 342
          },
          "damaged": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/nachtwal/deck-gun-damaged.webp",
            "pivot": [
              121.5,
              233
            ],
            "x": 0.0,
            "y": -447.0,
            "width": 243,
            "height": 342
          },
          "destroyed": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/nachtwal/deck-gun-destroyed.webp",
            "pivot": [
              125.5,
              200
            ],
            "x": 0.0,
            "y": -447.0,
            "width": 261,
            "height": 309
          }
        },
        "arc": 2.2,
        "width": 243,
        "height": 342,
        "spriteScale": 0.34,
        "rotatesWithTurret": true,
        "destroyedRotates": false,
        "muzzle": {
          "x": 0.0,
          "y": -526.22,
          "angle": -1.5707963267948966,
          "arc": 2.2,
          "pivotX": 0.0,
          "pivotY": -447.0
        },
        "muzzles": [
          {
            "x": 0.0,
            "y": -526.22,
            "angle": -1.5707963267948966,
            "arc": 2.2,
            "pivotX": 0.0,
            "pivotY": -447.0
          }
        ],
        "damagedMuzzles": [
          {
            "x": 0.0,
            "y": -526.22,
            "angle": -1.5707963267948966,
            "arc": 2.2,
            "pivotX": 0.0,
            "pivotY": -447.0
          }
        ]
      },
      {
        "id": "deck_aft",
        "kind": "turret_body",
        "group": "deck_aft",
        "x": 0.0,
        "y": 237.0,
        "pivot": [
          121.5,
          233
        ],
        "angle": 3.141592653589793,
        "dependencies": [],
        "phase": 0,
        "states": {
          "intact": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/nachtwal/deck-gun-normal.webp",
            "pivot": [
              121.5,
              233
            ],
            "x": 0.0,
            "y": 237.0,
            "width": 243,
            "height": 342
          },
          "damaged": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/nachtwal/deck-gun-damaged.webp",
            "pivot": [
              121.5,
              233
            ],
            "x": 0.0,
            "y": 237.0,
            "width": 243,
            "height": 342
          },
          "destroyed": {
            "src": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/nachtwal/deck-gun-destroyed.webp",
            "pivot": [
              125.5,
              200
            ],
            "x": 0.0,
            "y": 237.0,
            "width": 261,
            "height": 309
          }
        },
        "arc": 2.2,
        "width": 243,
        "height": 342,
        "spriteScale": 0.34,
        "rotatesWithTurret": true,
        "destroyedRotates": false,
        "muzzle": {
          "x": 0.0,
          "y": 316.22,
          "angle": 1.5707963267948966,
          "arc": 2.2,
          "pivotX": 0.0,
          "pivotY": 237.0
        },
        "muzzles": [
          {
            "x": 0.0,
            "y": 316.22,
            "angle": 1.5707963267948966,
            "arc": 2.2,
            "pivotX": 0.0,
            "pivotY": 237.0
          }
        ],
        "damagedMuzzles": [
          {
            "x": 0.0,
            "y": 316.22,
            "angle": 1.5707963267948966,
            "arc": 2.2,
            "pivotX": 0.0,
            "pivotY": 237.0
          }
        ]
      }
    ],
    "targets": [
      {
        "id": "core",
        "kind": "core",
        "x": 0,
        "y": 0,
        "rx": 115.2,
        "ry": 706.5600000000001,
        "angle": 0,
        "dependencies": []
      },
      {
        "id": "deck_fore",
        "kind": "turret_body",
        "x": 0.0,
        "y": -447.0,
        "rx": 35,
        "ry": 35,
        "angle": 0,
        "dependencies": [],
        "muzzle": {
          "x": 0.0,
          "y": -526.22,
          "angle": -1.5707963267948966,
          "arc": 2.2,
          "pivotX": 0.0,
          "pivotY": -447.0
        },
        "muzzles": [
          {
            "x": 0.0,
            "y": -526.22,
            "angle": -1.5707963267948966,
            "arc": 2.2,
            "pivotX": 0.0,
            "pivotY": -447.0
          }
        ],
        "damagedMuzzles": [
          {
            "x": 0.0,
            "y": -526.22,
            "angle": -1.5707963267948966,
            "arc": 2.2,
            "pivotX": 0.0,
            "pivotY": -447.0
          }
        ]
      },
      {
        "id": "deck_aft",
        "kind": "turret_body",
        "x": 0.0,
        "y": 237.0,
        "rx": 35,
        "ry": 35,
        "angle": 0,
        "dependencies": [],
        "muzzle": {
          "x": 0.0,
          "y": 316.22,
          "angle": 1.5707963267948966,
          "arc": 2.2,
          "pivotX": 0.0,
          "pivotY": 237.0
        },
        "muzzles": [
          {
            "x": 0.0,
            "y": 316.22,
            "angle": 1.5707963267948966,
            "arc": 2.2,
            "pivotX": 0.0,
            "pivotY": 237.0
          }
        ],
        "damagedMuzzles": [
          {
            "x": 0.0,
            "y": 316.22,
            "angle": 1.5707963267948966,
            "arc": 2.2,
            "pivotX": 0.0,
            "pivotY": 237.0
          }
        ]
      },
      {
        "id": "dive_control",
        "kind": "control",
        "x": 0.0,
        "y": -58.0,
        "rx": 65,
        "ry": 170,
        "angle": 0,
        "dependencies": [],
        "visualDamage": "runtime-fx-only"
      }
    ],
    "cutin": "https://head-on-aces.justzeon.chatgpt.site/asset-bank/intrusion-bosses/nachtwal/cutin.webp",
    "shotOcclusion": {
      "basis": "Deck-height guns: fixed bridge/funnels and other live gun assemblies block low-angle fire; low deck does not.",
      "gunHeights": {
        "deck_fore": 1,
        "deck_aft": 1
      },
      "occluders": [
        {
          "id": "deck_fore",
          "x": 0.0,
          "y": -447.0,
          "rx": 35,
          "ry": 35,
          "height": 1,
          "persistent": false
        },
        {
          "id": "deck_aft",
          "x": 0.0,
          "y": 237.0,
          "rx": 35,
          "ry": 35,
          "height": 1,
          "persistent": false
        },
        {
          "id": "bridge",
          "x": 0.0,
          "y": -58.0,
          "rx": 65,
          "ry": 170,
          "height": 3,
          "persistent": true
        }
      ]
    }
  }
};

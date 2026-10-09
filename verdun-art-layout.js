// Measured source rectangles and mounting pivots for r8 authored atlases.
// Ground frames remain world aligned; gun-only frames turn around their own socket.
export const VERDUN_PART_FRAMES={"douaumont":{"mounts":{"heavy":{"size":[210,207],"frames":[{"rect":[10,36,210,207],"pivot":[104,104]},{"rect":[10,245,210,203],"pivot":[104,100]},{"rect":[10,454,210,203],"pivot":[104,99]}]},"mg":{"size":[202,166],"frames":[{"rect":[225,61,202,166],"pivot":[95,84]},{"rect":[225,268,202,164],"pivot":[95,81]},{"rect":[221,472,206,169],"pivot":[99,86]}]},"aa":{"size":[201,205],"frames":[{"rect":[428,38,201,205],"pivot":[102,103]},{"rect":[428,247,200,201],"pivot":[102,101]},{"rect":[428,455,205,202],"pivot":[102,101]}]},"control":{"size":[183,182],"frames":[{"rect":[634,54,183,182],"pivot":[89,90]},{"rect":[634,259,183,181],"pivot":[89,91]},{"rect":[634,471,197,180],"pivot":[89,89]}]},"ammo":{"size":[201,150],"frames":[{"rect":[832,74,201,150],"pivot":[105,72]},{"rect":[832,279,201,150],"pivot":[105,71]},{"rect":[832,482,202,160],"pivot":[105,77]}]},"core":{"size":[202,188],"frames":[{"rect":[1041,48,202,188],"pivot":[101,95]},{"rect":[1041,252,203,189],"pivot":[101,96]},{"rect":[1041,457,203,196],"pivot":[101,97]}]}},"guns":{"heavy":[{"rect":[79,662,73,205],"pivot":[36,158],"reach":155},{"rect":[65,878,96,188],"pivot":[51,142],"reach":139},{"rect":[64,1080,106,157],"pivot":[49,109],"reach":106}],"mg":[{"rect":[271,713,105,146],"pivot":[50,107],"reach":104},{"rect":[262,920,127,145],"pivot":[59,100],"reach":97},{"rect":[270,1098,109,131],"pivot":[51,92],"reach":89}],"aa":[{"rect":[459,664,143,206],"pivot":[70,155],"reach":152},{"rect":[455,880,150,187],"pivot":[76,140],"reach":137},{"rect":[460,1079,139,155],"pivot":[70,111],"reach":108}]}},"souville":{
"mounts":{
"bunker":{"size":[212,172],"frames":[{"rect":[10,70,212,172],"pivot":[109,87]},{"rect":[10,274,212,178],"pivot":[109,88]},{"rect":[10,503,214,183],"pivot":[110,87]},{"rect":[5,717,219,182],"pivot":[114,90]}]},
"pit":{"size":[202,181],"frames":[{"rect":[228,64,202,181],"pivot":[102,93]},{"rect":[228,272,204,184],"pivot":[102,93]},{"rect":[228,491,204,194],"pivot":[102,101]},{"rect":[226,713,210,192],"pivot":[102,100]}]},
"observer":{"size":[143,137],"frames":[{"rect":[450,92,143,137],"pivot":[73,67]},{"rect":[450,300,143,137],"pivot":[73,67]},{"rect":[450,523,146,152],"pivot":[73,74]},{"rect":[448,731,151,165],"pivot":[75,82]}]},
"command":{"size":[216,176],"frames":[{"rect":[618,62,216,176],"pivot":[111,93]},{"rect":[618,268,218,192],"pivot":[111,98]},{"rect":[615,497,222,195],"pivot":[114,99]},{"rect":[615,700,223,209],"pivot":[114,114]}]},
"ammo":{"size":[207,151],"frames":[{"rect":[830,76,207,151],"pivot":[105,79]},{"rect":[830,285,208,168],"pivot":[105,81]},{"rect":[830,511,209,178],"pivot":[105,85]},{"rect":[827,739,212,164],"pivot":[108,80]}]},
"core":{"size":[209,218],"frames":[{"rect":[1040,25,209,218],"pivot":[105,122]},{"rect":[1040,247,209,213],"pivot":[105,108]},{"rect":[1039,473,210,225],"pivot":[106,115]},{"rect":[1037,700,212,212],"pivot":[108,111]}]}
},
"guns":{
"bunker":[{"rect":[71,916,98,146],"pivot":[47,105],"reach":98},{"rect":[50,1084,132,153],"pivot":[68,118],"reach":92}],
"pit":[{"rect":[271,893,106,169],"pivot":[55,128],"reach":121},{"rect":[266,1069,125,170],"pivot":[60,133],"reach":115}]
}
}};

export const VERDUN_BODY_GRID={douaumont:{columns:2,rows:1},souville:{columns:1,rows:2}};

// r9 standalone weapon atlas, measured in native 1619 x 971 pixels.
// Pivots are breech mounting centers; reach ends at the illustrated muzzle.
// Wrecks retain the intact scale and last bearing, rather than stretching a bent barrel.
export const VERDUN_GUN_ATLAS_SIZE=[1619,971];
export const VERDUN_GUN_FRAMES={
 heavy:[
  {rect:[68,30,278,294],pivot:[139,233],reach:220},
  {rect:[65,343,279,286],pivot:[142,227],reach:213},
  {rect:[59,658,290,272],pivot:[147,212],reach:220}
 ],
 mg:[
  {rect:[395,89,249,232],pivot:[123,181],reach:170},
  {rect:[392,385,253,238],pivot:[126,183],reach:172},
  {rect:[390,691,257,229],pivot:[128,176],reach:170}
 ],
 aa:[
  {rect:[697,27,228,308],pivot:[114,243],reach:235},
  {rect:[694,337,235,294],pivot:[117,234],reach:227},
  {rect:[698,648,231,275],pivot:[113,217],reach:235}
 ],
 bunker:[
  {rect:[995,97,241,228],pivot:[121,173],reach:159},
  {rect:[987,392,258,232],pivot:[129,176],reach:157},
  {rect:[978,687,279,232],pivot:[138,176],reach:159}
 ],
 pit:[
  {rect:[1357,43,157,279],pivot:[78,220],reach:204},
  {rect:[1358,350,165,274],pivot:[79,216],reach:200},
  {rect:[1339,663,214,259],pivot:[97,198],reach:204}
 ]
};

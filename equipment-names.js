// Display copy only. Stable upgrade IDs and gameplay data are unchanged.
export const MEDAL_DISPLAY_NAMES=Object.freeze({
 central:Object.freeze({ko:'푸르 르 메리트 훈장',en:'Pour le Mérite'}),
 entente:Object.freeze({ko:'빅토리아 십자 훈장',en:'Victoria Cross'})
});
export function medalDisplayName(faction='central',locale='ko'){
 return MEDAL_DISPLAY_NAMES[faction==='entente'?'entente':'central'][locale==='en'?'en':'ko'];
}
const PROTOTYPE_AMMO_NAMES={
 central:{ko:'크루프 시제탄약',en:'Krupp Prototype Ammunition'},
 entente:{ko:'울위치 시제탄약',en:'Woolwich Prototype Ammunition'}
};
export function prototypeAmmoName(faction,locale='ko'){
 return PROTOTYPE_AMMO_NAMES[faction==='entente'?'entente':'central'][locale==='en'?'en':'ko'];
}
export const EQUIPMENT_NAMES_KO=Object.freeze({
 steelCore:'S.m.K. 철심탄',
 ironCross:MEDAL_DISPLAY_NAMES.central.ko,
 redScarf:'붉은 남작의 머플러',
 telescope:'르네 폰크의 망원경',
 flightGloves:'빌리 비숍의 비행 장갑',
 sparkPlug:'맥커든의 비상 수선 키트',
 immelmannManual:'임멜만의 기동 전술 교본',
 motorCannon:'기네메르의 37 mm 모퇴르 카농',
 rearGunner:'스카프 링 총좌',
 cow37:'COW 37 mm 기관포',
 kaiserFog:'브록식 연막 장치',
 lufberyCircle:'러프베리 서클',
 combinedProjectiles:'시차 투사 장치'
});
export function equipmentNameKo(id,fallback=''){return EQUIPMENT_NAMES_KO[id]||fallback;}

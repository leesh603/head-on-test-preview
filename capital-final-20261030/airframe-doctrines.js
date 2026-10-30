// Data only: combat and doctrine modules both depend on this catalog.
export const BOMBER_TRANSFER_DESCRIPTION='대형 중폭격기로 전환합니다. 폭발물 강화가 적용되는 고위력 융단·집중폭격, 후방 방어사수를 획득합니다. 선회기동 대신 후방 방어탄막을 사용합니다. 내구도 3.2~3.5배(상한 480~520), 4.5~4.8초마다 강화 폭격. 속도 −20~24%, 선회력 −34~38%이며 다른 기체 전환과 동시 장착 불가.';
export const BUILD_TRANSFER_DESCRIPTIONS=Object.freeze({
 mgTransfer:'대형 중무장 공격기로 전환합니다. 내구도 2배(상한 360), 전방 기관총 피해 +40%, 고속 기관총 2정 추가 및 표적 추적, 후방 사수 유지. 선회기동 대신 탄환을 요격하는 화망 전개를 사용합니다. 속도 −14%, 선회력 −22%, 피탄 면적 증가. 다른 기체 전환과 동시 장착 불가.',
 airshipTransfer:'편대 지휘 비행선으로 전환합니다. 내구도 4배(상한 600), 하부 호위기 3기 출격(상시 윙맨 합산 최대 7기), 편대 피해 +35%, 집중사격 및 기존 편대 강화 계승. 선회기동 대신 전방위 대공 방어망을 사용합니다. 속도 −38%, 선회력 −50%, 피탄 면적 크게 증가. 다른 기체 전환과 동시 장착 불가.'
});
// Airframe conversion is a free, optional special doctrine, independent of the
// five family doctrines and the one composite tactic. Reuse the approved art.
export const SPECIAL_DOCTRINES=Object.freeze([
 Object.freeze({id:'bomberTransfer',family:'EXPLOSIVE',specialDoctrine:true,name:'중폭격기 전환 교리',enName:'Heavy Bomber Doctrine',description:BOMBER_TRANSFER_DESCRIPTION,enDescription:'Durability ×3.2–3.5 (cap 480–520), stronger automatic bombing every 4.5–4.8s and a rear gunner. Speed −20–24%, turn −34–38%. Defensive barrage replaces maneuver.',advantage:'고위력 자동 폭격·대폭 증가한 내구도',enAdvantage:'Heavy automatic bombing and durability',weakness:'큰 피탄 면적·기동 대신 후방 방어탄막',enWeakness:'Larger target; rear barrage replaces maneuver'}),
 Object.freeze({id:'mgTransfer',family:'GUN',specialDoctrine:true,name:'중무장기 전환 교리',enName:'Gunship Doctrine',description:BUILD_TRANSFER_DESCRIPTIONS.mgTransfer,enDescription:'Durability ×2 (cap 360), forward gun damage +40% and two stronger, faster tracking MGs. Speed −14%, turn −22%. Gun barrage replaces maneuver.',advantage:'정면 피해 +40%·고속 기관총 2정·내구도 2배',enAdvantage:'+40% forward damage, two fast MGs and double durability',weakness:'큰 피탄 면적·기동 대신 정면 화망',enWeakness:'Larger target; frontal barrage replaces maneuver'}),
 Object.freeze({id:'airshipTransfer',family:'FORMATION',specialDoctrine:true,name:'비행선 전환 교리',enName:'Airship Doctrine',description:BUILD_TRANSFER_DESCRIPTIONS.airshipTransfer,enDescription:'Durability ×4 (cap 600), three escorts (seven permanent wings total), wing damage +35% and stronger defensive guns. Speed −38%, turn −50%. AA barrage replaces maneuver.',advantage:'호위기 3기·편대 피해 +35%·내구도 4배',enAdvantage:'Three escorts, +35% wing damage and quadruple durability',weakness:'매우 큰 피탄 면적·느린 이동과 선회',enWeakness:'Very large target and slower handling'})
]);

// Concise bilingual aircraft introductions; display only.
export const AIRCRAFT_HISTORY_COPY=Object.freeze({
  "nieuport24": [
    "Nieuport 24는 작은 하부 날개를 가진 프랑스의 경량 전투기입니다.",
    "The Nieuport 24 was a lightweight French fighter with a narrow lower wing."
  ],
  "pfalz_d3a": [
    "Pfalz D.IIIa는 합판 동체를 사용한 독일 복엽 전투기입니다.",
    "The Pfalz D.IIIa was a German biplane fighter with a plywood fuselage."
  ],
  "airco_dh2": [
    "Airco DH.2는 프로펠러를 뒤에 배치한 영국의 단좌 전투기입니다.",
    "The Airco DH.2 was a British single-seat fighter with a rear-mounted propeller."
  ],
  "berthold_pfalz": [
    "Pfalz D.IIIa는 합판 동체를 사용한 독일 복엽 전투기입니다.",
    "The Pfalz D.IIIa was a German biplane fighter with a plywood fuselage."
  ],
  "voss_pfalz": [
    "Pfalz D.III는 합판 동체를 사용한 독일 복엽 전투기입니다.",
    "The Pfalz D.III was a German biplane fighter with a plywood fuselage."
  ],
  "bristol_scout_c": [
    "Bristol Scout C는 1차대전에 사용된 영국의 소형 단좌 복엽기입니다.",
    "The Bristol Scout C was a small British single-seat biplane used in the First World War."
  ],
  "hansa_brandenburg_di": [
    "한자브란덴부르크 D.I는 단일 기관총을 갖춘 초기형 전투기입니다.",
    "The Hansa-Brandenburg D.I is an early fighter with a single machine gun."
  ],
  "barker_re8": [
    "R.E.8은 정찰과 포병 관측에 사용된 영국의 복좌기입니다.",
    "The R.E.8 was a British two-seater used for reconnaissance and artillery observation."
  ],
  "fonck_caudron": [
    "Caudron G.4는 정찰과 폭격에 사용된 프랑스의 쌍발기입니다.",
    "The Caudron G.4 was a French twin-engine aircraft used for reconnaissance and bombing."
  ],
  "voisin_iii": [
    "Voisin III는 프로펠러를 뒤에 배치한 프랑스의 복좌기입니다.",
    "The Voisin III was a French two-seater with a rear-mounted propeller."
  ],
  "albatros_d2": [
    "뵐케의 알바트로스 D.II입니다. 넓은 하부 날개와 평행 지주가 특징입니다.",
    "Boelcke’s Albatros D.II has a broad lower wing and parallel struts."
  ],
  "boelcke_albatros": [
    "뵐케의 알바트로스 D.II입니다. 넓은 하부 날개와 평행 지주가 특징입니다.",
    "Boelcke’s Albatros D.II has a broad lower wing and parallel struts."
  ],
  "wolff_albatros": [
    "쿠르트 볼프의 알바트로스 D.III를 바탕으로 한 도장입니다. 목재 동체·Jasta 11 적색 띠·초록 꼬리·흰 꽃 표식을 사용합니다.",
    "Markings inspired by Kurt Wolff’s Albatros D.III: a wooden fuselage, Jasta 11 red band, green tail and white flower."
  ],
  "loewenhardt_fokkerd7": [
    "에리히 뢰벤하르트 전용 D.VII입니다. 노란 상부 날개·동체, 로젠지 하부 날개, 흰 꼬리와 검은 십자가 특징입니다.",
    "Löwenhardt’s D.VII has yellow upper wings and fuselage, lozenge lower wings, a white tail and black crosses."
  ],
  "nungesser_nieuport24": [
    "눙게서의 은색 뉴포르와 검은 심장·해골 표식을 바탕으로 각색한 24bis입니다.",
    "A game adaptation of the Nieuport 24bis with Nungesser’s silver finish, black heart and skull markings."
  ]
});
export function aircraftHistoryCopy(id,locale='ko'){return AIRCRAFT_HISTORY_COPY[id]?.[locale==='en'?1:0];}

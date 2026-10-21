// Player-only aerodynamic envelopes. Existing aircraft stats, upgrades and AI
// profiles stay authoritative. A paint scheme inherits its physical model.
const fit=(family,drag,low,high,recovery=1,reverse=0)=>Object.freeze({family,drag,low,high,recovery,reverse});
export const PLAYER_HANDLING=Object.freeze({
 fokker:fit('turn',1.35,1.24,.92,.85),
 camel:fit('turn',1.25,1.12,.94,.95),
 nieuport:fit('light',1.28,1.12,1.02,1.05,.18),
 nieuport24:fit('light',1.2,1.1,1.01,1.08,.14),
 nieuport28:fit('light',1.3,1.08,1.02,1.05,.2),
 sopwith:fit('turn',1.12,1.12,1,1.05,.08),
 snipe:fit('turn',1.08,1.1,.98,1),
 spad:fit('pass',2.8,.91,.94,1.45),
 se5a:fit('pass',1.95,.96,1,1.25),
 fokkerd7:fit('energy',.85,1.02,.98,1.1),
 fokkerdv:fit('energy',1.1,1.07,1.02,1.2,.16),
 albatros:fit('steady',1.4,.95,.98,1),
 albatros_d2:fit('steady',1.45,.94,.97,.95),
 pfalz_d3a:fit('steady',1.4,.94,.97,1),
 spad12:fit('steady',1.7,.87,.94,1.05),
 junkers_d1:fit('steady',1.5,.87,.94,.9),
 bristol_duo:fit('twoSeat',1.4,.95,.99,1),
 halberstadt_duo:fit('twoSeat',1.5,.91,.96,.85),
 re7:fit('twoSeat',1.65,.85,.93,.8),
 re8:fit('twoSeat',1.5,.89,.95,.85),
 caudron_g4:fit('twoSeat',1.6,.86,.93,.8),
 voisin_iii:fit('twoSeat',1.55,.84,.92,.8),
 eindecker:fit('early',1.3,.97,.97,.9),
 airco_dh2:fit('light',1.3,1.15,.95,.9,.12),
 morane_l:fit('early',1.4,.98,.94,.85),
 bristol_scout_c:fit('light',1.25,1.1,.98,1,.14),
 hansa_brandenburg_di:fit('steady',1.35,.98,.96,.9)
});
const aliases=Object.freeze({
 fokker_red:'fokker',fokker_voss:'fokker',fokker_standard:'fokker',
 boelcke_albatros:'albatros_d2',baron_albatros:'albatros',brumowski_albatros:'albatros',schleich_albatros:'albatros',wolff_albatros:'albatros',
 baracca_nieuport:'nieuport',nieuport_italian:'nieuport',lufbery_nieuport17:'nieuport',nungesser_nieuport24:'nieuport24',luke_nieuport28:'nieuport28',
 rickenbacker_spad:'spad',guynemer_spad:'spad12',ball_se5a:'se5a',proctor_se5a:'se5a',mccudden_se5a:'se5a',
 udet_fokkerdv:'fokkerdv',goering_fokkerd7:'fokkerd7',berthold_pfalz:'pfalz_d3a',collishaw_sopwith:'sopwith',barker_snipe:'snipe',gontermann_fokker:'fokker',lothar_dr1:'fokker',fokker_jacobs:'fokker'
});
export function playerAirframeModel(id,planes){
 if(PLAYER_HANDLING[id])return id;
 if(aliases[id])return aliases[id];
 const base=planes?.[id]?.sortieBase;
 return base&&base!==id?playerAirframeModel(base,planes):null;
}
export function playerHandlingProfile(game,planes){
 // Forced manoeuvres and UR transformations retain their existing performance.
 if(game.bomberTransfer||game.skillTime>0||game.evadeTime>0||game.chargeTime>0||game.aceRetreat129||game.duoSpinStep>0||game.pilot==='loewenhardt'||game.plane==='loewenhardt_fokkerd7')return null;
 return PLAYER_HANDLING[playerAirframeModel(game.plane,planes)]||null;
}

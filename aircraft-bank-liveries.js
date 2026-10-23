import {BANK_ART} from './aircraft-bank-art.js?v=headon-quality-20261023-7d8a4756';
// Gallery families reuse established NPC handling; paint never grants pilot skills.
// family, name, faction, service year, encounter role, handling base, visual scale.
const rows=[
 ['aeg_c4','AEG C.IV','central',1916,'recon','halberstadt_duo',1.16],
 ['aeg_g4','AEG G.IV','central',1916,'bomber','re7',1.53],
 ['airco_dh2','Airco DH.2','entente',1916,'fighter','airco_dh2',1],
 ['albatros_d2','Albatros D.II','central',1916,'fighter','albatros_d2',1],
 ['albatros_d3','Albatros D.III','central',1917,'fighter','albatros',1],
 ['albatros_d5a','Albatros D.Va','central',1917,'fighter','albatros',1],
 ['albatros_oeffag','Albatros D.III Oeffag','central',1917,'fighter','albatros',1],
 ['ansaldo_sva5','Ansaldo SVA.5','entente',1917,'fighter','spad',1],
 ['armstrong_fk8','Armstrong Whitworth F.K.8','entente',1916,'recon','re7',1.18],
 ['aviatik_d1','Aviatik D.I','central',1917,'fighter','albatros',.98],
 ['avro_504','Avro 504','entente',1913,'recon','re7',1.04],
 ['be2c','Royal Aircraft Factory B.E.2c','entente',1914,'recon','re7',1.1],
 ['breguet14','Breguet 14','entente',1917,'bomber','bristol_duo',1.24],
 ['bristol_f2b','Bristol F.2B','entente',1917,'recon','bristol_duo',1.16],
 ['bristol_m1','Bristol M.1','entente',1917,'fighter','spad',1],
 ['camel','Sopwith Camel','entente',1917,'fighter','camel',1],
 ['caproni_ca3','Caproni Ca.3','entente',1917,'bomber','re7',1.8],
 ['caudron_g4','Caudron G.4','entente',1915,'bomber','re7',1.42],
 ['caudron_r11','Caudron R.11','entente',1918,'bomber','re7',1.52],
 ['dfw_cv','DFW C.V','central',1916,'recon','halberstadt_duo',1.17],
 ['dh4','Airco DH.4','entente',1917,'bomber','bristol_duo',1.24],
 ['dh5','Airco DH.5','entente',1917,'fighter','airco_dh2',.98],
 ['dh9','Airco DH.9','entente',1917,'bomber','bristol_duo',1.22],
 ['dolphin','Sopwith Dolphin','entente',1918,'fighter','se5a',.98],
 ['eindecker','Fokker E.III','central',1915,'fighter','eindecker',1],
 ['fe2b','Royal Aircraft Factory F.E.2b','entente',1915,'recon','bristol_duo',1.2],
 ['felixstowe_f2','Felixstowe F.2','entente',1917,'sea-bomber','re7',1.65],
 ['ff33','Friedrichshafen FF.33','central',1915,'sea-recon','re7',1.22],
 ['fokker_d5','Fokker D.V','central',1916,'fighter','fokker',.94],
 ['fokker_dr1','Fokker Dr.I','central',1917,'fighter','fokker',1],
 ['fokker_ev','Fokker E.V / D.VIII','central',1918,'fighter','fokkerdv',.91],
 ['fokkerd7','Fokker D.VII','central',1918,'fighter','fokkerd7',1],
 ['friedrichshafen_g3','Friedrichshafen G.III','central',1917,'bomber','re7',1.6],
 ['gotha_g4','Gotha G.IV','central',1917,'bomber','re7',1.6],
 ['halberstadt_duo','Halberstadt CL.II','central',1917,'recon','halberstadt_duo',1.12],
 ['hannover_cl3','Hannover CL.III','central',1918,'recon','halberstadt_duo',1.16],
 ['hanriot','Hanriot HD.1','entente',1917,'fighter','nieuport',.96],
 ['hansa_cc','Hansa-Brandenburg C.C.','central',1917,'sea-fighter','nieuport',1.08],
 ['hb_w29','Hansa-Brandenburg W.29','central',1918,'sea-fighter','nieuport',1.16],
 ['hp_o400','Handley Page O/400','entente',1918,'bomber','re7',1.85],
 ['ilya_muromets','Sikorsky Ilya Muromets','entente',1914,'bomber','re7',2.01],
 ['junkers_d1','Junkers D.I','central',1918,'fighter','spad12',.98],
 ['junkers_j1','Junkers J.I','central',1917,'recon','halberstadt_duo',1.28],
 ['lohner_l','Lohner L','central',1915,'sea-recon','re7',1.28],
 ['macchi_m3','Macchi M.3','entente',1916,'sea-recon','re7',1.28],
 ['macchi_m5','Macchi M.5','entente',1917,'sea-fighter','nieuport',1.12],
 ['morane_ai','Morane-Saulnier AI','entente',1918,'fighter','spad',.98],
 ['nieuport11','Nieuport 11 Bébé','entente',1916,'fighter','nieuport',.87],
 ['nieuport17','Nieuport 17','entente',1916,'fighter','nieuport',1],
 ['nieuport24','Nieuport 24','entente',1917,'fighter','nieuport24',.91],
 ['nieuport28','Nieuport 28','entente',1918,'fighter','nieuport28',.95],
 ['pfalz_d12','Pfalz D.XII','central',1918,'fighter','pfalz_d3a',1],
 ['pfalz_d3a','Pfalz D.IIIa','central',1917,'fighter','pfalz_d3a',1],
 ['phonix_d1','Phönix D.I','central',1917,'fighter','albatros',.98],
 ['pup','Sopwith Pup','entente',1917,'fighter','nieuport',.89],
 ['re7','Royal Aircraft Factory R.E.7','entente',1915,'recon','re7',1.22],
 ['re8','Royal Aircraft Factory R.E.8','entente',1917,'recon','re7',1.14],
 ['roland_d6','Roland D.VI','central',1918,'fighter','albatros',1],
 ['rumpler_taube','Rumpler Taube','central',1914,'recon','re7',1.12],
 ['salmson_2a2','Salmson 2A2','entente',1917,'recon','re7',1.17],
 ['savoia_pomilio','Savoia-Pomilio SP.4','entente',1917,'recon','re7',1.28],
 ['se5a','Royal Aircraft Factory S.E.5a','entente',1917,'fighter','se5a',1],
 ['snipe','Sopwith Snipe','entente',1918,'fighter','camel',.98],
 ['spad13','SPAD XIII','entente',1917,'fighter','spad',1],
 ['ssw_d3','Siemens-Schuckert D.III','central',1918,'fighter','fokkerdv',.9],
 ['ssw_d4','Siemens-Schuckert D.IV','central',1918,'fighter','fokkerdv',.87],
 ['staaken_r6','Zeppelin-Staaken R.VI','central',1917,'bomber','re7',2.04],
 ['strutter','Sopwith 1½ Strutter','entente',1916,'recon','re7',1.09],
 ['triplane','Sopwith Triplane','entente',1917,'fighter','sopwith',.91],
 ['vickers_fb5','Vickers F.B.5 Gunbus','entente',1915,'fighter','airco_dh2',1.1],
 ['voisin8','Voisin VIII','entente',1916,'bomber','re7',1.4]
];
export const BANK_LIVERY_FAMILIES=Object.freeze(Object.fromEntries(rows.map(([id,name,faction,year,role,base,scale])=>[id,Object.freeze({id,name,faction,year,role,base,scale})])));
// Neutral/postwar markings and paints reserved for named ace encounters remain gallery-only.
export const BANK_LIVERY_EXCLUSIONS=Object.freeze(['swiss','danish','chile','polish','soviet','ukrainian']);
const excluded=new Set(BANK_LIVERY_EXCLUSIONS);
const ententeMarks=new Set(['french','british','italian','italy','russian','belgian','greek','usas','us','usn','raf','japan','japanese']);
const centralMarks=new Set(['german','austria','ottoman','bavarian']);
export const BANK_LIVERIES=Object.freeze(Object.fromEntries(Object.entries(BANK_ART).flatMap(([key,art])=>{
 if(!art.family||excluded.has(art.paint)||art.family==='fokker_dr1'&&art.paint==='jasta11'||art.family==='fokkerd7'&&art.paint==='berthold')return [];
 const family=BANK_LIVERY_FAMILIES[art.family];
 const faction=art.paint==='captured'?(family.faction==='central'?'entente':'central'):ententeMarks.has(art.paint)?'entente':centralMarks.has(art.paint)?'central':family.faction;
 const year=faction!==family.faction?Math.max(1917,family.year):family.year;
 return [[key,Object.freeze({...family,id:key,family:family.id,paint:art.paint,faction,year,speed:1,hp:1,turn:1,fire:1})]];
})));
export const BANK_LIVERY_COUNT=Object.keys(BANK_LIVERIES).length;

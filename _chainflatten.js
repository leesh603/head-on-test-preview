const fs=require('fs');
// Generic wrapper-chain flattener for engine.js
// cfg: {method, baseRe, phases[], aliasMap{alias->phaseName}, keep[declNames],
//       repoints[{before:string, value:string}], defRe}
const cfg=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
let t=fs.readFileSync('engine.js','utf8');
// 1) base class method rename (exactly one hit)
if(cfg.baseRe){
 const baseRe=new RegExp(cfg.baseRe,'g');
 const baseHits=[...t.matchAll(baseRe)].length;
 if(baseHits!==1)throw new Error('base hits '+baseHits);
 t=t.replace(baseRe,cfg.baseNew);
}
// 2) rename defs in order
const defRe=new RegExp('Game\\.prototype\\.'+cfg.method+'=function','g');
let wi=0;
t=t.replace(defRe,()=>'Game.prototype.'+cfg.phases[wi++]+'=function');
if(wi!==cfg.phases.length)throw new Error('defs '+wi+' != '+cfg.phases.length);
// 3) alias call sites -> static phase calls
for(const [a,p] of Object.entries(cfg.aliasMap)){
 t=t.replace(new RegExp(a+'\\.call\\(this,?\\s*','g'),'this.'+p+'(');
}
// 4) drop non-kept decls of this method
t=t.replace(new RegExp('const _\\w+=Game\\.prototype\\.'+cfg.method+';','g'),m=>{
 const name=m.match(/_(\w+)/)[0];
 return cfg.keep.includes(name)?m:'';
});
// 5) repoints
for(const r of cfg.repoints){
 if(!t.includes(r.before))throw new Error('repoint anchor missing: '+r.before);
 t=t.replace(r.before,r.value+'\n'+r.before);
}
fs.writeFileSync('engine.js',t);
console.log(cfg.method,'ok',wi);

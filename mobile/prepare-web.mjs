import {copyFile,mkdir,readdir,readFile,rm,stat,writeFile} from 'node:fs/promises';
import {dirname,extname,join,normalize,relative,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const mobile=dirname(fileURLToPath(import.meta.url));
const root=join(mobile,'..');
const target=join(mobile,'www');

const excludedTopFiles=new Set(['asset-gallery.html','fx-compare.html','keyfill-tmp.html','keywhite-tmp.html','livery-studio.html','mapaudit.html','mapsian.html','preview-cowling.html','seampage.html','test-lab.html']);

const excludedTopDirs=new Set([
  '.git','.github','mobile',
  'src-png',
  'maan-20261003',
  'tactical-identity-20261003',
  'verdun-review',
  'asset-bank',
  'qa',
  'mapgen',
  'art-candidates',
  'tests',
  'tools',
  'source-art',
  'docs',
  '.agents'
]);

await rm(target,{recursive:true,force:true});
await mkdir(target,{recursive:true});

let files=0;
let bytes=0;
let skippedBytes=0;

async function treeSize(path){
  let total=0;
  for(const entry of await readdir(path,{withFileTypes:true})){
    const child=join(path,entry.name);
    if(entry.isDirectory())total+=await treeSize(child);
    else if(entry.isFile())total+=(await stat(child)).size;
  }
  return total;
}

async function copyTree(from,to,isRoot=false){
  for(const entry of await readdir(from,{withFileTypes:true})){
    const src=join(from,entry.name);
    const dst=join(to,entry.name);
    if(entry.isDirectory()){
      if(isRoot&&excludedTopDirs.has(entry.name)){
        if(entry.name!=='.git')skippedBytes+=await treeSize(src);
        continue;
      }
      await mkdir(dst,{recursive:true});
      await copyTree(src,dst,false);
      continue;
    }
    if(!entry.isFile())continue;
    if(isRoot&&(entry.name==='.gitignore'||excludedTopFiles.has(entry.name))){skippedBytes+=(await stat(src)).size;continue;}
    await copyFile(src,dst);
    const size=(await stat(src)).size;
    files++;
    bytes+=size;
  }
}

await copyTree(root,target,true);

const extraRuntimeFiles=['asset-bank/terrain/gallipoli_coast.webp'];
for(const rel of extraRuntimeFiles){
  const src=join(root,rel),dst=join(target,rel);
  await mkdir(dirname(dst),{recursive:true});
  await copyFile(src,dst);
  files++;
  bytes+=(await stat(src)).size;
}

const bridge=`(() => {
  const capacitor=globalThis.Capacitor;
  if(!capacitor?.isNativePlatform?.())return;
  const apiOrigin='https://head-on-aces.justzeon.chatgpt.site';
  const originalFetch=globalThis.fetch.bind(globalThis);
  const mapApi=value=>{
    const url=new URL(value,location.href);
    if(url.origin!==location.origin||!url.pathname.startsWith('/api/'))return null;
    return apiOrigin+url.pathname+url.search+url.hash;
  };
  globalThis.fetch=(input,init)=>{
    if(typeof input==='string'||input instanceof URL){
      const mapped=mapApi(String(input));
      if(mapped)return originalFetch(mapped,init);
    }else if(input instanceof Request){
      const mapped=mapApi(input.url);
      if(mapped)return originalFetch(new Request(mapped,input),init);
    }
    return originalFetch(input,init);
  };
  document.documentElement.classList.add('native-app');
})();`;

await writeFile(join(target,'native-bridge.js'),bridge);
files++;
bytes+=Buffer.byteLength(bridge);

const indexPath=join(target,'index.html');
let index=await readFile(indexPath,'utf8');
const appTag=index.match(/<script\s+type="module"\s+src="app\.js[^"]*"\s*><\/script>/)?.[0];
if(!appTag)throw new Error('app.js module tag not found in test-main index.html');
index=index.replace(appTag,'<script src="./native-bridge.js?v=android-test-main"></script>'+appTag);
await writeFile(indexPath,index);

if(!index.includes('?v=477'))throw new Error('Expected latest test-main pin ?v=477 not found');
if(!index.includes('native-bridge.js'))throw new Error('Native bridge injection failed');

const textExt=new Set(['.html','.js','.css']);
const assetExt='(?:js|css|html|webp|png|svg|json|mp3|ogg|wav)';
const literalRef=new RegExp("(?:['\\\"(])((?:\\./)?[A-Za-z0-9_@./-]+\\."+assetExt+")(?:\\?[^'\\\")\\s]*)?",'g');
const cssRef=/url\((?:['"])?([^'")?#]+)(?:\?[^'")]*)?(?:['"])?\)/g;
const missing=[];

async function validateReachable(){
  const queue=[join(target,'index.html'),join(target,'field-record.html')];
  const seen=new Set();
  while(queue.length){
    const path=queue.shift();
    if(seen.has(path))continue;
    seen.add(path);
    let text;
    try{text=await readFile(path,'utf8')}catch{missing.push(relative(target,path)+' <- entry');continue}
    const refs=[];
    for(const match of text.matchAll(literalRef))refs.push(match[1]);
    for(const match of text.matchAll(cssRef))refs.push(match[1]);
    for(const raw of refs){
      if(!raw||raw.startsWith('http:')||raw.startsWith('https:')||raw.startsWith('data:')||raw.startsWith('/')||raw.startsWith('../'))continue;
      if(raw.includes('${'))continue;
      const clean=raw.replace(/^\.\//,'');
      const resolved=resolve(dirname(path),clean);
      if(!resolved.startsWith(resolve(target)))continue;
      try{
        const info=await stat(resolved);
        if(info.isFile()&&textExt.has(extname(resolved).toLowerCase()))queue.push(resolved);
      }catch{
        const rel=relative(target,resolved);
        try{
          await stat(join(root,rel));
          missing.push(rel+' <- '+relative(target,path));
        }catch{
          // Same missing reference already exists in test-main itself; do not
          // turn an Android packaging check into an unrelated game fix.
        }
      }
    }
  }
  return seen;
}

const reachable=await validateReachable();
const uniqueMissing=[...new Set(missing)].filter(x=>!x.startsWith('favicon.ico'));
if(uniqueMissing.length)throw new Error('Missing packaged runtime references:\n'+uniqueMissing.slice(0,40).join('\n'));
console.log('Validated reachable runtime text files: '+reachable.size);

await writeFile(join(target,'android-source.txt'),'head-on-test-preview main 0902c2141ebcbd5438f04871151a741468707133\n');

const finalBytes=await treeSize(target);
console.log('Source: head-on-test-preview main 0902c2141ebcbd5438f04871151a741468707133');
console.log('Android web package: '+files+' files, '+(finalBytes/1048576).toFixed(1)+' MiB');
console.log('Excluded dev/backup payload: '+(skippedBytes/1048576).toFixed(1)+' MiB');

import { mkdir, readFile, readdir, writeFile, copyFile, cp, rm, stat } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = await readFile(join(root, "worker/index.js"), "utf8");
const testOnlyAssets = new Set(["test-lab.html"]);
const retiredAssets = new Set([
  "pilots.png",
  "pilot-cutouts.png",
  "boelcke.svg",
  "legendary-icons83.png",
  "portrait-mckeever.png",
  "portrait-mckeever70.png",
]);
const files = (await readdir(join(root, "dist"))).filter((name) =>
  [".html", ".js", ".css", ".svg", ".png", ".webp"].includes(extname(name)) &&
  !retiredAssets.has(name) &&
  !testOnlyAssets.has(name),
);
const assets = {};
// PNG bytes belong in the hosted asset collection, not the Worker module.
// Keep the authored dist/ files intact for the existing local game workflow.
await rm(join(root, "dist/client"), { recursive: true, force: true });
await mkdir(join(root, "dist/client"), { recursive: true });
for (const file of files) {
  if ([".png", ".webp"].includes(extname(file))) {
    if ((await stat(join(root, "dist", file))).size === 0) {
      throw new Error(`Refusing to publish empty image asset: dist/${file}`);
    }
    if(file.endsWith(".png")) assets[`/${file}`]={imagePath:`/${file}.webp`};
    else await copyFile(join(root, "dist", file), join(root, "dist/client", file));
  } else {
    let bytes=await readFile(join(root, "dist", file));
    if(file==="field-record.html")bytes=Buffer.from(bytes.toString("utf8").replace("</body>",'<script src="./field-record-sync.js?v=159"></script></body>'));
    assets[`/${file}`] = bytes.toString("base64");
  }
}
// Portable elite patch modules and their authored sprites live in a namespace
// so they cannot collide with the long-running root asset set.
for (const file of await readdir(join(root, "dist/elite-patch/module"))) {
  if (!file.endsWith(".js")) continue;
  assets[`/elite-patch/module/${file}`] = (await readFile(join(root, "dist/elite-patch/module", file))).toString("base64");
}
await mkdir(join(root, "dist/client/elite-patch/assets"), { recursive: true });
for (const file of await readdir(join(root, "dist/elite-patch/assets"))) {
  if (!file.endsWith(".png")) continue;
  await copyFile(join(root, "dist/elite-patch/assets", file), join(root, "dist/client/elite-patch/assets", file));
  assets[`/elite-patch/assets/${file}`] = { imagePath: `/elite-patch/assets/${file}` };
}
// Augmentation icons intentionally live in a namespaced directory. Keep their
// original PNG bytes and directory structure in the hosted asset collection.
for(const file of await readdir(join(root,"dist/augmentation-icons")))if(file.endsWith('.png'))assets[`/augmentation-icons/${file}`]={imagePath:`/augmentation-icons/${file}.webp`};
try{
  execFileSync(process.env.CODEX_PRIMARY_RUNTIME_PYTHON||'python3',[join(root,'scripts/encode-hosted-images.py'),root],{stdio:'inherit'});
}catch(error){
  if(error?.code!=='ENOENT')throw error;
  // Remote builders may not include Python/Pillow. Preserve the original PNG
  // bytes and point the asset map at them so publication never depends on it.
  const compactPortraits={
    'portrait-bishop.png':'field-img-ee662aad50e69542cdfa.webp',
    'portrait-mannock.png':'field-img-c829ce384f1508844473.webp',
    'portrait-mckeever-powell129.png':'field-img-20cbb216a301e89fa104.webp',
    'portrait-huffzky.png':'field-img-5b4217058c8ea7273eb7.webp',
    'portrait-hawker.png':'field-img-f730ddc77f2703fc9e45.webp',
    'portrait-berthold.png':'field-img-810cf2a381918ee792d6.webp'
  };
  for(const file of files.filter(name=>name.endsWith('.png'))){
    if(compactPortraits[file]){assets[`/${file}`]={imagePath:`/${compactPortraits[file]}`};continue;}
    await copyFile(join(root,'dist',file),join(root,'dist/client',file));
    assets[`/${file}`]={imagePath:`/${file}`};
  }
  for(const file of await readdir(join(root,'dist/augmentation-icons'))){
    if(!file.endsWith('.png'))continue;
    await mkdir(join(root,'dist/client/augmentation-icons'),{recursive:true});
    await copyFile(join(root,'dist/augmentation-icons',file),join(root,'dist/client/augmentation-icons',file));
    assets[`/augmentation-icons/${file}`]={imagePath:`/augmentation-icons/${file}`};
  }
  console.log('Lossless image payload: original PNG fallback');
}
await writeFile(join(root,"dist/client/_headers"), "/*\n  Cache-Control: no-cache, no-store, must-revalidate\n");
await mkdir(join(root, "dist/server"), { recursive: true });
await mkdir(join(root, "dist/.openai"), { recursive: true });
await writeFile(join(root, "dist/server/index.js"), source.replace("__ASSET_MAP__", JSON.stringify(assets)));
await copyFile(join(root, ".openai/hosting.json"), join(root, "dist/.openai/hosting.json"));
await cp(join(root,"drizzle"),join(root,"dist/.openai/drizzle"),{recursive:true});
const textCount=Object.values(assets).filter(v=>typeof v==='string').length;
console.log(`Built Worker with ${textCount} text assets and lossless external images`);
// Stage only deployable output, never the source PNG copies at dist root.
const staged=join(root,'.sites-runtime/hosting-package-159');await rm(staged,{recursive:true,force:true});
for(const rel of ['.openai','dist/server','dist/client','dist/.openai','drizzle'])await cp(join(root,rel),join(staged,rel),{recursive:true});
console.log('Deployment staging: .sites-runtime/hosting-package-159');
